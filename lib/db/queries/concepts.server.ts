import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { UNITS, conceptsOf } from "@/content";
import { conceptProgress, conceptReviewCounts, type ConceptState } from "@/lib/concepts/progress";
import {
  contentVersionHash,
  getVersionsByIds,
  hasActiveLease,
  listSlots,
  type ConceptKind,
} from "@/lib/concepts/store.server";
import type { Db } from "@/lib/db/index.server";
import { conceptSlots, conceptVersions, type ConceptVersionRow } from "@/lib/db/schema";
import type { Unit } from "@/lib/types";

import { load, type Loaded } from "./history.server";
import { listAllResultsForProgress, listUnitResultsForProgress } from "./results.server";

/**
 * What a student may see of a concept's shared content. Deliberately small: no review reason,
 * no error, no model names, no timestamps (those are teacher-only; spec 002 FR-029).
 */
export interface ApprovedContent {
  summary: { versionId: string; bullets: string[] } | null;
  illustration: { versionId: string; alt: string } | null;
}

/**
 * THE read path for students (spec 002 FR-027, SC-012): only a slot's LIVE version, and only if
 * it is approved. A pending version, a version that failed review, and a replacement are
 * unreachable from here, however many times they failed or how recently they were written.
 */
export async function loadApprovedContent(db: Db, conceptIds: string[]): Promise<Map<string, ApprovedContent>> {
  const out = new Map<string, ApprovedContent>();
  if (conceptIds.length === 0) return out;
  const rows = await db
    .select({
      conceptId: conceptSlots.conceptId,
      kind: conceptSlots.kind,
      versionId: conceptVersions.id,
      bullets: conceptVersions.summaryBullets,
      alt: conceptVersions.illustrationAlt,
    })
    .from(conceptSlots)
    .innerJoin(conceptVersions, eq(conceptVersions.id, conceptSlots.liveVersionId))
    .where(and(inArray(conceptSlots.conceptId, conceptIds), eq(conceptVersions.status, "approved")));
  for (const r of rows) {
    const entry = out.get(r.conceptId) ?? { summary: null, illustration: null };
    if (r.kind === "summary" && r.bullets) entry.summary = { versionId: r.versionId, bullets: r.bullets };
    if (r.kind === "illustration" && r.alt) entry.illustration = { versionId: r.versionId, alt: r.alt };
    out.set(r.conceptId, entry);
  }
  return out;
}

/** What the unit page and the status route need to show and to notice changes. */
export interface ConceptContentView {
  content: Map<string, ApprovedContent>;
  /** A worker currently holds a lease on one of these concepts, so content may arrive soon. */
  pending: boolean;
  /** A short hash of the approved versions shown; changes when new content is approved. */
  version: string;
}

/** Approved content for the listed concepts, plus the `pending` flag and the `version` hash. */
export async function loadConceptContentView(
  db: Db,
  conceptIds: string[],
  now: Date = new Date(),
): Promise<ConceptContentView> {
  const content = await loadApprovedContent(db, conceptIds);
  const versionIds = [...content.values()].flatMap((c) => [c.summary?.versionId, c.illustration?.versionId]);
  return {
    content,
    pending: await hasActiveLease(db, conceptIds, now),
    version: contentVersionHash(versionIds),
  };
}

/** Page loader: never throws for an outage. */
export const loadConceptContentViewForPage = (conceptIds: string[]) =>
  load((db) => loadConceptContentView(db, conceptIds));

/**
 * The signed-in student's uncleared concepts for one unit (spec 002 User Story 1).
 *
 * `userId` is always the session user's id, never a value from the client (Principle IX). A
 * unit that has not adopted concepts has none, so there is nothing to load. Like the other
 * page loaders this never throws for an outage: it reports `unavailable`.
 */
export function loadUnitConceptProgress(userId: string, unit: Unit): Promise<Loaded<ConceptState[]>> {
  if (!unit.conceptsReady) return Promise.resolve({ status: "ok", data: [] });
  return load(async (db) => conceptProgress(unit, await listUnitResultsForProgress(db, userId, unit.id)));
}

/**
 * The home page's "to review" counts: how many concepts are not yet cleared in each unit,
 * so every unit card gets its pill from ONE query across all the student's results. Like the
 * other page loaders this never throws for an outage: it reports `unavailable`.
 */
export function loadHomeReviewCounts(
  userId: string,
  units: readonly Unit[],
): Promise<Loaded<Map<string, number>>> {
  return load(async (db) => conceptReviewCounts(units, await listAllResultsForProgress(db, userId)));
}

/**
 * The SVG of a concept's LIVE, APPROVED illustration, only if `versionId` is that version.
 * Any other id (a pending, flagged or superseded version, another concept's) gives null, so
 * the route can answer 404 without revealing which it was.
 */
export async function getLiveIllustrationSvg(db: Db, conceptId: string, versionId: string): Promise<string | null> {
  const rows = await db
    .select({ svg: conceptVersions.illustrationSvg })
    .from(conceptSlots)
    .innerJoin(conceptVersions, eq(conceptVersions.id, conceptSlots.liveVersionId))
    .where(
      and(
        eq(conceptSlots.conceptId, conceptId),
        eq(conceptSlots.kind, "illustration"),
        eq(conceptVersions.id, versionId),
        eq(conceptVersions.status, "approved"),
      ),
    )
    .limit(1);
  return rows[0]?.svg ?? null;
}

// ---- teacher-only reads (spec 002 FR-051 to FR-055) ---------------------------------------
// Used only by code that has passed `authenticateAdmin` / `requireAdminPage`. They carry the
// review reason, errors and model names that no student route may return, and never any
// student data.

export interface TeacherVersion {
  id: string;
  status: string;
  origin: string;
  attemptNo: number;
  bullets: string[] | null;
  brief: string | null;
  alt: string | null;
  hasSvg: boolean;
  generatorModel: string;
  generatedAt: Date;
  reviewerModel: string | null;
  reviewerReason: string | null;
  reviewedAt: Date | null;
  approvedBy: string | null;
}

export interface TeacherSlot {
  kind: ConceptKind;
  live: TeacherVersion | null;
  replacement: TeacherVersion | null;
  lastError: string | null;
  lastErrorAt: Date | null;
  leaseUntil: Date | null;
  retryAfter: Date | null;
}

export interface TeacherConceptRow {
  unitId: string;
  unitTitle: string;
  conceptId: string;
  description: string;
  /** null = nothing generated yet ("not generated") */
  summary: TeacherSlot | null;
  illustration: TeacherSlot | null;
}

const teacherVersion = (v: ConceptVersionRow): TeacherVersion => ({
  id: v.id,
  status: v.status,
  origin: v.origin,
  attemptNo: v.attemptNo,
  bullets: v.summaryBullets,
  brief: v.illustrationBrief,
  alt: v.illustrationAlt,
  hasSvg: v.illustrationSvg !== null,
  generatorModel: v.generatorModel,
  generatedAt: v.generatedAt,
  reviewerModel: v.reviewerModel,
  reviewerReason: v.reviewerReason,
  reviewedAt: v.reviewedAt,
  approvedBy: v.approvedBy,
});

/** Every concept of every concept-ready unit with its stored content, in content order. */
export async function listConceptContentForTeacher(db: Db): Promise<TeacherConceptRow[]> {
  const entries = UNITS.filter((u) => u.conceptsReady).flatMap((unit) =>
    conceptsOf(unit).map((concept) => ({ unit, concept })),
  );
  if (entries.length === 0) return [];
  const slots = await listSlots(
    db,
    entries.map((e) => e.concept.id),
  );
  const versionIds = slots.flatMap((s) => [s.liveVersionId, s.replacementVersionId]).filter((id): id is string => !!id);
  const versions = await getVersionsByIds(db, versionIds);

  const slotOf = (conceptId: string, kind: ConceptKind): TeacherSlot | null => {
    const slot = slots.find((s) => s.conceptId === conceptId && s.kind === kind);
    if (!slot) return null;
    const live = slot.liveVersionId ? versions.get(slot.liveVersionId) : undefined;
    const replacement = slot.replacementVersionId ? versions.get(slot.replacementVersionId) : undefined;
    return {
      kind,
      live: live ? teacherVersion(live) : null,
      replacement: replacement ? teacherVersion(replacement) : null,
      lastError: slot.lastError,
      lastErrorAt: slot.lastErrorAt,
      leaseUntil: slot.leaseUntil,
      retryAfter: slot.retryAfter,
    };
  };

  return entries.map(({ unit, concept }) => ({
    unitId: unit.id,
    unitTitle: unit.title,
    conceptId: concept.id,
    description: concept.description,
    summary: slotOf(concept.id, "summary"),
    illustration: slotOf(concept.id, "illustration"),
  }));
}

/** The SVG of ANY version of a concept's illustration (a teacher previewing), or null if the version is not that concept's. */
export async function getIllustrationSvgForTeacher(db: Db, conceptId: string, versionId: string): Promise<string | null> {
  const rows = await db
    .select({ svg: conceptVersions.illustrationSvg })
    .from(conceptVersions)
    .where(
      and(
        eq(conceptVersions.id, versionId),
        eq(conceptVersions.conceptId, conceptId),
        eq(conceptVersions.kind, "illustration"),
      ),
    )
    .limit(1);
  return rows[0]?.svg ?? null;
}

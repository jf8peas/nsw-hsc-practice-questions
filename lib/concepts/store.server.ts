import "server-only";

import { createHash } from "node:crypto";

import { and, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import {
  conceptSlots,
  conceptVersions,
  dailyConceptUsage,
  type ConceptSlotRow,
  type ConceptVersionRow,
} from "@/lib/db/schema";

// Storage for the concept pipeline (spec 002 research R5, R8, R9; data-model.md).
//
// The Neon HTTP driver has no interactive transactions, so every critical step here is one
// atomic statement: the cap reservation, the lease claim, and the promotion that approves a
// version and swaps the slot's pointers together. Every function takes the Db first.

export type ConceptKind = "summary" | "illustration";

export const LEASE_MS = 5 * 60_000;
export const BACKOFF_MS = 15 * 60_000;

// ---- daily cap (global, Principle VII) ---------------------------------------

/** A reserved model call: remember which Sydney day it was taken on, so a refund hits the same row. */
export interface CapSlot {
  sydneyDate: string;
}

const dbSydneyToday = sql`(now() at time zone 'Australia/Sydney')::date`;

/**
 * Atomically reserve one concept-pipeline model call for today (Sydney time): one statement
 * that inserts the first call or increments only while count < cap, so the cap can never be
 * exceeded under concurrency. Null when the cap is used up (or is 0).
 * `sydneyDate` overrides the day (tests only).
 */
export async function reserveConceptCall(db: Db, cap: number, sydneyDate?: string): Promise<CapSlot | null> {
  if (!(cap > 0)) return null;
  const day = sydneyDate ? sql`${sydneyDate}::date` : dbSydneyToday;
  const rows = await db
    .insert(dailyConceptUsage)
    .values({ sydneyDate: day as unknown as string, count: 1 })
    .onConflictDoUpdate({
      target: dailyConceptUsage.sydneyDate,
      set: { count: sql`${dailyConceptUsage.count} + 1` },
      setWhere: sql`${dailyConceptUsage.count} < ${cap}`,
    })
    .returning({ sydneyDate: dailyConceptUsage.sydneyDate });
  return rows.length > 0 ? { sydneyDate: rows[0].sydneyDate } : null;
}

/** Give a reserved call back (the model could not be reached). Never goes below 0. */
export async function refundConceptCall(db: Db, slot: CapSlot): Promise<void> {
  await db
    .update(dailyConceptUsage)
    .set({ count: sql`greatest(${dailyConceptUsage.count} - 1, 0)` })
    .where(eq(dailyConceptUsage.sydneyDate, slot.sydneyDate));
}

/** Model calls used today across all students (Sydney day). */
export async function conceptCallsToday(db: Db): Promise<number> {
  const rows = await db
    .select({ count: dailyConceptUsage.count })
    .from(dailyConceptUsage)
    .where(eq(dailyConceptUsage.sydneyDate, dbSydneyToday as unknown as string));
  return rows[0]?.count ?? 0;
}

// ---- slots and leases -----------------------------------------------------------

export async function ensureSlot(db: Db, conceptId: string, kind: ConceptKind, unitId: string): Promise<void> {
  await db
    .insert(conceptSlots)
    .values({ conceptId, kind, unitId })
    .onConflictDoNothing({ target: [conceptSlots.conceptId, conceptSlots.kind] });
}

export async function getSlot(db: Db, conceptId: string, kind: ConceptKind): Promise<ConceptSlotRow | null> {
  const rows = await db
    .select()
    .from(conceptSlots)
    .where(and(eq(conceptSlots.conceptId, conceptId), eq(conceptSlots.kind, kind)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getVersion(db: Db, versionId: string): Promise<ConceptVersionRow | null> {
  const rows = await db.select().from(conceptVersions).where(eq(conceptVersions.id, versionId)).limit(1);
  return rows[0] ?? null;
}

/** Versions by id (missing ids are simply absent from the result). */
export async function getVersionsByIds(db: Db, ids: string[]): Promise<Map<string, ConceptVersionRow>> {
  if (ids.length === 0) return new Map();
  const rows = await db.select().from(conceptVersions).where(inArray(conceptVersions.id, ids));
  return new Map(rows.map((r) => [r.id, r]));
}

/**
 * Take the generation lease for a concept item in one atomic statement. Only the caller that
 * gets a row back may generate; a held lease (until it expires) or a backoff in the future
 * refuses. A teacher's deliberate action passes `ignoreBackoff`.
 */
export async function claimLease(
  db: Db,
  conceptId: string,
  kind: ConceptKind,
  owner: string,
  now: Date,
  opts: { leaseMs?: number; ignoreBackoff?: boolean } = {},
): Promise<boolean> {
  const rows = await db
    .update(conceptSlots)
    .set({
      leaseOwner: owner,
      leaseUntil: new Date(now.getTime() + (opts.leaseMs ?? LEASE_MS)),
      updatedAt: now,
    })
    .where(
      and(
        eq(conceptSlots.conceptId, conceptId),
        eq(conceptSlots.kind, kind),
        or(isNull(conceptSlots.leaseUntil), lte(conceptSlots.leaseUntil, now)),
        opts.ignoreBackoff ? undefined : or(isNull(conceptSlots.retryAfter), lte(conceptSlots.retryAfter, now)),
      ),
    )
    .returning({ conceptId: conceptSlots.conceptId });
  return rows.length > 0;
}

/** Give the lease back (only if this owner still holds it). */
export async function releaseLease(db: Db, conceptId: string, kind: ConceptKind, owner: string): Promise<void> {
  await db
    .update(conceptSlots)
    .set({ leaseOwner: null, leaseUntil: null })
    .where(and(eq(conceptSlots.conceptId, conceptId), eq(conceptSlots.kind, kind), eq(conceptSlots.leaseOwner, owner)));
}

/** A model call failed: do not hit it again for a while, and remember why (teacher-only). */
export async function setBackoff(
  db: Db,
  conceptId: string,
  kind: ConceptKind,
  now: Date,
  error: string,
): Promise<void> {
  await db
    .update(conceptSlots)
    .set({
      retryAfter: new Date(now.getTime() + BACKOFF_MS),
      lastError: error.slice(0, 500),
      lastErrorAt: now,
      updatedAt: now,
    })
    .where(and(eq(conceptSlots.conceptId, conceptId), eq(conceptSlots.kind, kind)));
}

/** A step succeeded: forget any earlier backoff and error. */
export async function clearBackoff(db: Db, conceptId: string, kind: ConceptKind): Promise<void> {
  await db
    .update(conceptSlots)
    .set({ retryAfter: null, lastError: null, lastErrorAt: null })
    .where(and(eq(conceptSlots.conceptId, conceptId), eq(conceptSlots.kind, kind)));
}

/** True when any listed concept has an unexpired lease on a slot (the `pending` flag). */
export async function hasActiveLease(db: Db, conceptIds: string[], now: Date): Promise<boolean> {
  if (conceptIds.length === 0) return false;
  const rows = await db
    .select({ conceptId: conceptSlots.conceptId })
    .from(conceptSlots)
    .where(and(inArray(conceptSlots.conceptId, conceptIds), sql`${conceptSlots.leaseUntil} > ${now.toISOString()}::timestamptz`))
    .limit(1);
  return rows.length > 0;
}

/** Slots for the listed concepts (both kinds). */
export async function listSlots(db: Db, conceptIds: string[]): Promise<ConceptSlotRow[]> {
  if (conceptIds.length === 0) return [];
  return db.select().from(conceptSlots).where(inArray(conceptSlots.conceptId, conceptIds));
}

// ---- versions -----------------------------------------------------------------------

export interface NewVersion {
  conceptId: string;
  kind: ConceptKind;
  unitId: string;
  origin: "first" | "teacher" | "auto_retry";
  attemptNo: 1 | 2;
  summaryBullets?: string[];
  illustrationBrief?: string | null;
  illustrationAlt?: string | null;
  illustrationSvg?: string;
  generatorModel: string;
  generatedAt: Date;
}

/**
 * Store a new `pending_review` version as the slot's replacement. The slot has one
 * replacement pointer, so "at most one pending or failed replacement" holds by construction;
 * the previous replacement row is deleted once the pointer has moved.
 */
export async function insertReplacement(db: Db, input: NewVersion): Promise<ConceptVersionRow> {
  const [row] = await db
    .insert(conceptVersions)
    .values({
      conceptId: input.conceptId,
      kind: input.kind,
      unitId: input.unitId,
      status: "pending_review",
      origin: input.origin,
      attemptNo: input.attemptNo,
      summaryBullets: input.summaryBullets ?? null,
      illustrationBrief: input.illustrationBrief ?? null,
      illustrationAlt: input.illustrationAlt ?? null,
      illustrationSvg: input.illustrationSvg ?? null,
      generatorModel: input.generatorModel,
      generatedAt: input.generatedAt,
    })
    .returning();

  await ensureSlot(db, input.conceptId, input.kind, input.unitId);
  const before = await getSlot(db, input.conceptId, input.kind);
  await db
    .update(conceptSlots)
    .set({ replacementVersionId: row.id, updatedAt: input.generatedAt })
    .where(and(eq(conceptSlots.conceptId, input.conceptId), eq(conceptSlots.kind, input.kind)));
  const old = before?.replacementVersionId;
  if (old && old !== row.id) await db.delete(conceptVersions).where(eq(conceptVersions.id, old));
  return row;
}

/** Record a review outcome on a version that stays a replacement (failed, or still pending). */
export async function markReviewed(
  db: Db,
  versionId: string,
  review: { status: "pending_review" | "failed_review"; reviewerModel: string | null; reason: string | null; at: Date },
): Promise<void> {
  await db
    .update(conceptVersions)
    .set({
      status: review.status,
      reviewerModel: review.reviewerModel,
      reviewerReason: review.reason ? review.reason.slice(0, 1000) : null,
      reviewedAt: review.at,
    })
    .where(eq(conceptVersions.id, versionId));
}

/**
 * Approve the slot's replacement and make it the live version, in ONE statement: the version's
 * status and the slot's pointers change together, so no reader ever sees a live version that
 * is not approved. Returns false (and changes nothing) unless `versionId` is the slot's
 * current replacement. The superseded live version is left unreferenced; call
 * `cleanupOrphans` afterwards.
 */
export async function promote(
  db: Db,
  conceptId: string,
  kind: ConceptKind,
  versionId: string,
  approvedBy: "reviewer" | "teacher",
  review: { reviewerModel: string | null; reason: string | null; at: Date },
): Promise<boolean> {
  const at = review.at.toISOString();
  const res = await db.execute(sql`
    with approved as (
      update concept_versions
         set status = 'approved',
             approved_by = ${approvedBy},
             reviewer_model = coalesce(${review.reviewerModel}::text, reviewer_model),
             reviewer_reason = coalesce(${review.reason ? review.reason.slice(0, 1000) : null}::text, reviewer_reason),
             reviewed_at = ${at}::timestamptz
       where id = ${versionId}::uuid and concept_id = ${conceptId} and kind = ${kind}
         and exists (
           select 1 from concept_slots
            where concept_id = ${conceptId} and kind = ${kind} and replacement_version_id = ${versionId}::uuid)
      returning id
    )
    update concept_slots
       set live_version_id = (select id from approved),
           replacement_version_id = null,
           updated_at = ${at}::timestamptz
     where concept_id = ${conceptId} and kind = ${kind}
       and replacement_version_id = ${versionId}::uuid
       and exists (select 1 from approved)
    returning concept_id
  `);
  const rows = (res as unknown as { rows?: unknown[] }).rows ?? (res as unknown as unknown[]);
  return Array.isArray(rows) && rows.length > 0;
}

/** Delete versions of this concept item that no slot points at any more (idempotent). */
export async function cleanupOrphans(db: Db, conceptId: string, kind: ConceptKind): Promise<void> {
  await db.execute(sql`
    delete from concept_versions v
     where v.concept_id = ${conceptId} and v.kind = ${kind}
       and not exists (
         select 1 from concept_slots s
          where s.live_version_id = v.id or s.replacement_version_id = v.id)
  `);
}

// ---- change detection ---------------------------------------------------------------------

/** A short, stable hash of the approved version ids a student can currently see. */
export function contentVersionHash(versionIds: Array<string | null | undefined>): string {
  const ids = versionIds.filter((x): x is string => Boolean(x)).sort();
  if (ids.length === 0) return "0";
  return createHash("sha1").update(ids.join("|")).digest("hex").slice(0, 10);
}

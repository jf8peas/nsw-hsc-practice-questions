import "server-only";

import fs from "node:fs";

import { eq } from "drizzle-orm";

import { getConcept } from "@/content";
import { MAX_BULLETS, MAX_BULLET_CHARS, MIN_BULLETS } from "@/lib/concepts/prompts";
import { cleanupOrphans, getSlot, getVersion, promote, type ConceptKind } from "@/lib/concepts/store.server";
import { checkSvg } from "@/lib/concepts/svg.server";
import type { Db } from "@/lib/db/index.server";
import { conceptVersions } from "@/lib/db/schema";

// The backend approval of a held-back concept item (spec 002 FR-053; research R10). It is run by
// a teacher on their own machine (`npm run concept:approve`), never over HTTP, and is the only
// way a version becomes live without passing the reviewer model.

export type ApproveStatus = "approved" | "already_live" | "no_replacement" | "not_found" | "invalid";

export interface ApproveResult {
  status: ApproveStatus;
  /** One line for the operator. */
  message: string;
  versionId?: string;
}

export interface ApproveArgs {
  conceptId: string;
  kind: ConceptKind;
  /** Replace the summary's bullets first (summary only). */
  bullets?: string[];
}

/** One bullet per line; blank lines and surrounding whitespace are ignored. */
export function parseBulletsFile(file: string): string[] {
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const invalid = (message: string): ApproveResult => ({ status: "invalid", message });

function checkBullets(bullets: string[]): string | null {
  if (bullets.length < MIN_BULLETS || bullets.length > MAX_BULLETS) {
    return `a summary needs ${MIN_BULLETS} to ${MAX_BULLETS} bullets; got ${bullets.length}`;
  }
  for (const b of bullets) {
    if (!b.trim()) return "a bullet is blank";
    if (b.length > MAX_BULLET_CHARS) return `a bullet is longer than ${MAX_BULLET_CHARS} characters`;
  }
  return null;
}

/**
 * Make the slot's waiting replacement (a flagged one, or one still pending) the live version,
 * approved by the teacher. The reviewer's fields stay as they were. A picture is checked against
 * the SVG rules first, so a hand edit cannot put unchecked markup in front of students. Running
 * it again once the version is live changes nothing.
 */
export async function approveConcept(db: Db, args: ApproveArgs, now: Date = new Date()): Promise<ApproveResult> {
  const { conceptId, kind } = args;
  if (!getConcept(conceptId)) return { status: "not_found", message: `No concept with id ${conceptId}.` };

  const slot = await getSlot(db, conceptId, kind);
  if (!slot?.replacementVersionId) {
    return slot?.liveVersionId
      ? { status: "already_live", message: `Nothing to approve: the ${kind} is already live.`, versionId: slot.liveVersionId }
      : { status: "no_replacement", message: `Nothing to approve: no ${kind} has been generated for ${conceptId}.` };
  }
  const version = await getVersion(db, slot.replacementVersionId);
  if (!version) return { status: "no_replacement", message: `Nothing to approve: no ${kind} is waiting for ${conceptId}.` };

  if (args.bullets) {
    if (kind !== "summary") return invalid("--bullets-file applies to summaries only.");
    const bullets = args.bullets.map((b) => b.trim());
    const problem = checkBullets(bullets);
    if (problem) return invalid(problem);
    await db.update(conceptVersions).set({ summaryBullets: bullets }).where(eq(conceptVersions.id, version.id));
  } else if (kind === "summary") {
    const problem = checkBullets(version.summaryBullets ?? []);
    if (problem) return invalid(problem);
  }

  if (kind === "illustration") {
    const checked = checkSvg(version.illustrationSvg ?? "");
    if (!checked.ok) return invalid(`the picture does not pass the SVG rules: ${checked.reason}`);
    if (checked.svg !== version.illustrationSvg) {
      await db.update(conceptVersions).set({ illustrationSvg: checked.svg }).where(eq(conceptVersions.id, version.id));
    }
  }

  const promoted = await promote(db, conceptId, kind, version.id, "teacher", { reviewerModel: null, reason: null, at: now });
  if (!promoted) return { status: "no_replacement", message: `The waiting ${kind} changed while approving; nothing was changed.` };
  await cleanupOrphans(db, conceptId, kind);
  return { status: "approved", message: `Approved: the ${kind} for ${conceptId} is now live.`, versionId: version.id };
}

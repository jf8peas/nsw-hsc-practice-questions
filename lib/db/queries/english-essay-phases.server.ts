import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import { attempts, essayPhases, results, type EssayPhaseRow } from "@/lib/db/schema";
import { emptyEnglishEssayScaffold, sanitiseEnglishEssayScaffold } from "@/lib/english-essay/scaffold";
import {
  ENGLISH_CRITERIA_IDS,
  ENGLISH_VERDICTS,
  type EnglishBand,
  type EnglishCriteria,
  type EnglishEssayScaffold,
  type EnglishKnowledgeError,
  type EnglishPlanReview,
  type EnglishQuestionFocus,
  type EnglishQuoteResult,
} from "@/lib/english-essay/types";

/**
 * Queries for the English essay-writing unit's phase row (spec 011, data-model §5-6). The English unit shares the
 * `essay_phases` table with Economics; these functions give the row English types at the boundary and never change
 * the Economics aliases or behaviour. Every query is scoped to the session user's id (Principle IX).
 */

/** A marking lease older than this is ignored (a crashed request must not strand an attempt). */
export const ENGLISH_LEASE_SECONDS = 130;

const leaseExpired = sql`(${essayPhases.markingStartedAt} is null or ${essayPhases.markingStartedAt} < now() - make_interval(secs => ${ENGLISH_LEASE_SECONDS}))`;

/** An English phase row with its JSON columns validated and typed. `band` is the MARKER-selected band. */
export interface EnglishEssayPhaseRow {
  id: string;
  attemptId: string;
  userId: string;
  unitId: string;
  questionId: string;
  status: "planning" | "writing" | "finished";
  scaffold: EnglishEssayScaffold;
  scaffoldWords: number;
  scaffoldLockedAt: Date | null;
  review: EnglishPlanReview | null;
  reviewPromptVersion: string | null;
  reviewModel: string | null;
  reviewedAt: Date | null;
  markingStartedAt: Date | null;
  essayText: string | null;
  essayWords: number | null;
  rawMark: number | null;
  /** The marker-selected band (audit only). */
  band: number | null;
  finalMark: number | null;
  finalBand: EnglishBand | null;
  criteria: EnglishCriteria | null;
  bandReason: string | null;
  lift: string[] | null;
  questionFocus: EnglishQuestionFocus | null;
  questionFocusReason: string | null;
  knowledgeErrors: EnglishKnowledgeError[] | null;
  quoteResults: EnglishQuoteResult[] | null;
  referenceTextHash: string | null;
  gaps: Array<{ conceptId: string; detail: string }> | null;
  usedWell: string[] | null;
  promptVersion: string | null;
  model: string | null;
  gradedAt: Date | null;
}

const isStatus = (s: string): s is EnglishEssayPhaseRow["status"] => s === "planning" || s === "writing" || s === "finished";
const isFocus = (s: unknown): s is EnglishQuestionFocus => s === "fully" || s === "partly" || s === "barely";
const isBand = (n: unknown): n is EnglishBand => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;

function readCriteria(v: unknown): EnglishCriteria | null {
  if (!v || typeof v !== "object") return null;
  const out = {} as EnglishCriteria;
  for (const id of ENGLISH_CRITERIA_IDS) {
    const c = (v as Record<string, unknown>)[id] as { verdict?: unknown; reason?: unknown } | undefined;
    if (!c || !ENGLISH_VERDICTS.includes(c.verdict as never)) return null;
    out[id] = { verdict: c.verdict as EnglishCriteria[typeof id]["verdict"], reason: typeof c.reason === "string" ? c.reason : "" };
  }
  return out;
}

function readReview(v: unknown): EnglishPlanReview | null {
  const checks = (v as { checks?: unknown } | null)?.checks;
  if (!Array.isArray(checks)) return null;
  const out: EnglishPlanReview["checks"] = [];
  for (const c of checks) {
    if (!c || typeof c !== "object") return null;
    const { id, status, line } = c as Record<string, unknown>;
    if (typeof id !== "string" || (status !== "strength" && status !== "fix") || typeof line !== "string") return null;
    out.push({ id: id as EnglishPlanReview["checks"][number]["id"], status, line });
  }
  return { checks: out };
}

/** Maps a raw row to the English shape, validating every JSON column. Never trusts the stored JSON's shape. */
export function toEnglishRow(row: EssayPhaseRow): EnglishEssayPhaseRow {
  if (!isStatus(row.status)) throw new Error(`english essay phase has unknown status ${row.status}`);
  const scaffold = sanitiseEnglishEssayScaffold(row.scaffold) ?? emptyEnglishEssayScaffold();
  const knowledgeErrors = Array.isArray(row.knowledgeErrors)
    ? row.knowledgeErrors.filter((e) => e && typeof e.quote === "string" && typeof e.why === "string")
    : null;
  const quoteResults = Array.isArray(row.quoteResults) ? row.quoteResults.filter((q) => q && typeof q.quote === "string") : null;
  return {
    id: row.id,
    attemptId: row.attemptId,
    userId: row.userId,
    unitId: row.unitId,
    questionId: row.questionId,
    status: row.status,
    scaffold,
    scaffoldWords: row.scaffoldWords,
    scaffoldLockedAt: row.scaffoldLockedAt,
    review: row.review ? readReview(row.review) : null,
    reviewPromptVersion: row.reviewPromptVersion,
    reviewModel: row.reviewModel,
    reviewedAt: row.reviewedAt,
    markingStartedAt: row.markingStartedAt,
    essayText: row.essayText,
    essayWords: row.essayWords,
    rawMark: row.rawMark,
    band: row.band,
    finalMark: row.finalMark,
    finalBand: isBand(row.finalBand) ? row.finalBand : null,
    criteria: readCriteria(row.criteria),
    bandReason: row.bandReason,
    lift: Array.isArray(row.lift) ? row.lift.filter((l): l is string => typeof l === "string") : null,
    questionFocus: isFocus(row.questionFocus) ? row.questionFocus : null,
    questionFocusReason: row.questionFocusReason,
    knowledgeErrors,
    quoteResults,
    referenceTextHash: row.referenceTextHash,
    gaps: Array.isArray(row.gaps) ? row.gaps : null,
    usedWell: row.usedWell,
    promptVersion: row.promptVersion,
    model: row.model,
    gradedAt: row.gradedAt,
  };
}

const own = (userId: string, attemptId: string, questionId: string) =>
  and(eq(essayPhases.userId, userId), eq(essayPhases.attemptId, attemptId), eq(essayPhases.questionId, questionId));

export async function getEnglishEssayPhase(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<EnglishEssayPhaseRow | null> {
  const rows = await db.select().from(essayPhases).where(own(userId, attemptId, questionId)).limit(1);
  return rows[0] ? toEnglishRow(rows[0]) : null;
}

/** Creates the row for an attempt (a no-op if it exists). The attempt must belong to `userId`. */
export async function insertEnglishEssayPhase(
  db: Db,
  input: { attemptId: string; userId: string; unitId: string; questionId: string; scaffold?: EnglishEssayScaffold },
): Promise<EnglishEssayPhaseRow> {
  await db
    .insert(essayPhases)
    .values({
      attemptId: input.attemptId,
      userId: input.userId,
      unitId: input.unitId,
      questionId: input.questionId,
      status: "planning",
      scaffold: (input.scaffold ?? emptyEnglishEssayScaffold()) as unknown as EssayPhaseRow["scaffold"],
      scaffoldWords: 0,
    })
    .onConflictDoNothing();
  const row = await getEnglishEssayPhase(db, input.userId, input.attemptId, input.questionId);
  if (!row) throw new Error("english essay phase vanished after insert");
  return row;
}

/** Saves the plan while it is still editable. False when it is locked (or the row is missing). */
export async function saveEnglishScaffold(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
  scaffold: EnglishEssayScaffold,
  words: number,
): Promise<boolean> {
  const rows = await db
    .update(essayPhases)
    .set({ scaffold: scaffold as unknown as EssayPhaseRow["scaffold"], scaffoldWords: words, updatedAt: new Date() })
    .where(and(own(userId, attemptId, questionId), eq(essayPhases.status, "planning")))
    .returning({ id: essayPhases.id });
  return rows.length > 0;
}

/** Saves the plan and locks it (planning to writing) in one conditional update. Null when it was already locked. */
export async function lockEnglishScaffold(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
  scaffold: EnglishEssayScaffold,
  words: number,
): Promise<EnglishEssayPhaseRow | null> {
  const rows = await db
    .update(essayPhases)
    .set({
      scaffold: scaffold as unknown as EssayPhaseRow["scaffold"],
      scaffoldWords: words,
      status: "writing",
      scaffoldLockedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(own(userId, attemptId, questionId), eq(essayPhases.status, "planning")))
    .returning();
  return rows[0] ? toEnglishRow(rows[0]) : null;
}

/** Takes the marking lease (one marking at a time). Null when another request holds it or the row is not writing. */
export async function takeEnglishMarkingLease(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<EnglishEssayPhaseRow | null> {
  const rows = await db
    .update(essayPhases)
    .set({ markingStartedAt: new Date() })
    .where(and(own(userId, attemptId, questionId), eq(essayPhases.status, "writing"), leaseExpired))
    .returning();
  return rows[0] ? toEnglishRow(rows[0]) : null;
}

export async function clearEnglishMarkingLease(db: Db, userId: string, attemptId: string, questionId: string): Promise<void> {
  await db.update(essayPhases).set({ markingStartedAt: null }).where(own(userId, attemptId, questionId));
}

export interface EnglishLatest {
  questionId: string;
  mark: number;
  /** `final_band`, never the marker-selected band. */
  band: number | null;
  attemptId: string;
  at: Date;
}

/** The student's latest marked result per essay (the unit page's "latest mark"; a redo replaces it). */
export async function latestEnglishEssayMarks(db: Db, userId: string, unitId: string): Promise<Map<string, EnglishLatest>> {
  const rows = await db
    .select({
      questionId: results.questionId,
      mark: results.marksAwarded,
      attemptId: results.attemptId,
      at: results.createdAt,
      band: essayPhases.finalBand,
    })
    .from(results)
    .leftJoin(essayPhases, and(eq(essayPhases.attemptId, results.attemptId), eq(essayPhases.questionId, results.questionId)))
    .where(and(eq(results.userId, userId), eq(results.unitId, unitId)))
    .orderBy(desc(results.createdAt), desc(results.id));
  const out = new Map<string, EnglishLatest>();
  for (const r of rows) if (!out.has(r.questionId)) out.set(r.questionId, r);
  return out;
}

/** For each concept, the missing-piece sentence from the student's most recent finished essay that listed it. */
export async function latestEnglishGapDetails(db: Db, userId: string, unitId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ gaps: essayPhases.gaps })
    .from(essayPhases)
    .where(and(eq(essayPhases.userId, userId), eq(essayPhases.unitId, unitId), eq(essayPhases.status, "finished")))
    .orderBy(desc(essayPhases.gradedAt));
  const out = new Map<string, string>();
  for (const r of rows) for (const g of r.gaps ?? []) if (!out.has(g.conceptId)) out.set(g.conceptId, g.detail);
  return out;
}

/** The finished phase rows still waiting for their result row (a failed result save): used to repair. */
export async function listFinishedOpenEnglishAttempts(db: Db, userId: string, unitId: string): Promise<EnglishEssayPhaseRow[]> {
  const rows = await db
    .select({ phase: essayPhases })
    .from(essayPhases)
    .innerJoin(attempts, eq(attempts.id, essayPhases.attemptId))
    .where(and(eq(essayPhases.userId, userId), eq(essayPhases.unitId, unitId), eq(essayPhases.status, "finished"), isNull(attempts.completedAt)));
  return rows.map((r) => toEnglishRow(r.phase));
}

export interface FinaliseEnglishEssayInput {
  essayText: string;
  essayWords: number;
  rawMark: number;
  /** The MARKER-selected band (audit only). */
  band: number;
  finalMark: number;
  finalBand: number;
  criteria: EnglishCriteria;
  bandReason: string;
  lift: string[];
  questionFocus: EnglishQuestionFocus;
  questionFocusReason: string;
  knowledgeErrors: EnglishKnowledgeError[];
  quoteResults: EnglishQuoteResult[];
  referenceTextHash: string;
  gaps: Array<{ conceptId: string; detail: string }>;
  usedWell: string[];
  promptVersion: string;
  model: string;
}

/** Fills the marking columns and finishes the row (writing to finished) in one conditional update. Null if it was not writing. */
export async function finaliseEnglishEssay(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
  input: FinaliseEnglishEssayInput,
): Promise<EnglishEssayPhaseRow | null> {
  const now = new Date();
  const rows = await db
    .update(essayPhases)
    .set({ ...input, criteria: input.criteria as unknown as EssayPhaseRow["criteria"], status: "finished", markingStartedAt: null, gradedAt: now, updatedAt: now })
    .where(and(own(userId, attemptId, questionId), eq(essayPhases.status, "writing")))
    .returning();
  return rows[0] ? toEnglishRow(rows[0]) : null;
}

export type EnglishDiscardOutcome = "discarded" | "marking_in_progress" | "already_finished" | "not_found";

/**
 * Deletes the student's OPEN English essay attempt: the attempt row, and by cascade its phase row and draft. Refused while a
 * marking is in flight (a lease younger than 130 s). Earlier finished attempts are other attempt rows and are never touched.
 */
export async function discardOpenEnglishAttempt(db: Db, userId: string, attemptId: string): Promise<EnglishDiscardOutcome> {
  const found = await db
    .select({ completedAt: attempts.completedAt, unitId: attempts.unitId })
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
    .limit(1);
  if (!found[0] || found[0].unitId !== "y12-english-essay-writing") return "not_found";
  if (found[0].completedAt) return "already_finished";
  const phase = await db
    .select({ id: essayPhases.id })
    .from(essayPhases)
    .where(and(eq(essayPhases.attemptId, attemptId), eq(essayPhases.userId, userId), sql`not ${leaseExpired}`))
    .limit(1);
  if (phase[0]) return "marking_in_progress";
  const deleted = await db
    .delete(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId), isNull(attempts.completedAt)))
    .returning({ id: attempts.id });
  return deleted.length > 0 ? "discarded" : "already_finished";
}

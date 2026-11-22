import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import { attempts, essayPhases, results, type EssayPhaseRow, type StoredPlanReview } from "@/lib/db/schema";
import type { EssayScaffold } from "@/lib/essay/scaffold";

/**
 * Queries for the essay-writing unit's phase row (spec 010, data-model §3). One row per attempt,
 * created with the attempt, holding the plan, the optional review and the marking. Every query is
 * scoped to the session user's id (Principle IX).
 */

/** A marking lease older than this is ignored (a crashed request must not strand an attempt). */
export const LEASE_SECONDS = 90;

const leaseExpired = sql`(${essayPhases.markingStartedAt} is null or ${essayPhases.markingStartedAt} < now() - make_interval(secs => ${LEASE_SECONDS}))`;

export async function getEssayPhase(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<EssayPhaseRow | null> {
  const rows = await db
    .select()
    .from(essayPhases)
    .where(and(eq(essayPhases.userId, userId), eq(essayPhases.attemptId, attemptId), eq(essayPhases.questionId, questionId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Creates the row for an attempt (a no-op if it exists). The attempt must belong to `userId`. */
export async function ensureEssayPhase(
  db: Db,
  input: { attemptId: string; userId: string; unitId: string; questionId: string; scaffold: EssayScaffold },
): Promise<EssayPhaseRow> {
  await db
    .insert(essayPhases)
    .values({
      attemptId: input.attemptId,
      userId: input.userId,
      unitId: input.unitId,
      questionId: input.questionId,
      status: "planning",
      scaffold: input.scaffold,
      scaffoldWords: 0,
    })
    .onConflictDoNothing();
  const row = await getEssayPhase(db, input.userId, input.attemptId, input.questionId);
  if (!row) throw new Error("essay phase vanished after insert");
  return row;
}

/** Saves the plan while it is still editable. False when it is locked (or the row is missing). */
export async function saveScaffold(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
  scaffold: EssayScaffold,
  words: number,
): Promise<boolean> {
  const rows = await db
    .update(essayPhases)
    .set({ scaffold, scaffoldWords: words, updatedAt: new Date() })
    .where(
      and(
        eq(essayPhases.userId, userId),
        eq(essayPhases.attemptId, attemptId),
        eq(essayPhases.questionId, questionId),
        eq(essayPhases.status, "planning"),
      ),
    )
    .returning({ id: essayPhases.id });
  return rows.length > 0;
}

/** Saves the plan and locks it (planning to writing) in one conditional update. Null when it was already locked. */
export async function lockScaffold(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
  scaffold: EssayScaffold,
  words: number,
): Promise<EssayPhaseRow | null> {
  const rows = await db
    .update(essayPhases)
    .set({ scaffold, scaffoldWords: words, status: "writing", scaffoldLockedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(essayPhases.userId, userId),
        eq(essayPhases.attemptId, attemptId),
        eq(essayPhases.questionId, questionId),
        eq(essayPhases.status, "planning"),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

/** Stores the plan review and locks the plan in one update (S2). Null when it was already locked. */
export async function storeReviewAndLock(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
  input: { scaffold: EssayScaffold; words: number; review: StoredPlanReview; promptVersion: string; model: string },
): Promise<EssayPhaseRow | null> {
  const now = new Date();
  const rows = await db
    .update(essayPhases)
    .set({
      scaffold: input.scaffold,
      scaffoldWords: input.words,
      status: "writing",
      scaffoldLockedAt: now,
      review: input.review,
      reviewPromptVersion: input.promptVersion,
      reviewModel: input.model,
      reviewedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(essayPhases.userId, userId),
        eq(essayPhases.attemptId, attemptId),
        eq(essayPhases.questionId, questionId),
        eq(essayPhases.status, "planning"),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

/** Takes the marking lease (one marking at a time). Null when another request holds it or the row is not writing. */
export async function takeMarkingLease(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<EssayPhaseRow | null> {
  const rows = await db
    .update(essayPhases)
    .set({ markingStartedAt: new Date() })
    .where(
      and(
        eq(essayPhases.userId, userId),
        eq(essayPhases.attemptId, attemptId),
        eq(essayPhases.questionId, questionId),
        eq(essayPhases.status, "writing"),
        leaseExpired,
      ),
    )
    .returning();
  return rows[0] ?? null;
}

export async function clearMarkingLease(db: Db, userId: string, attemptId: string, questionId: string): Promise<void> {
  await db
    .update(essayPhases)
    .set({ markingStartedAt: null })
    .where(and(eq(essayPhases.userId, userId), eq(essayPhases.attemptId, attemptId), eq(essayPhases.questionId, questionId)));
}

export interface FinaliseEssayInput {
  essayText: string;
  essayWords: number;
  rawMark: number;
  band: number;
  finalMark: number;
  coversBoth: boolean;
  criteria: NonNullable<EssayPhaseRow["criteria"]>;
  bandReason: string;
  lift: string[];
  flags: Array<{ quote: string; why: string }>;
  gaps: Array<{ conceptId: string; detail: string }>;
  usedWell: string[];
  promptVersion: string;
  model: string;
}

/** Fills the marking columns and finishes the row (writing to finished). Null if it was not writing. */
export async function finaliseEssay(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
  input: FinaliseEssayInput,
): Promise<EssayPhaseRow | null> {
  const now = new Date();
  const rows = await db
    .update(essayPhases)
    .set({ ...input, status: "finished", markingStartedAt: null, gradedAt: now, updatedAt: now })
    .where(
      and(
        eq(essayPhases.userId, userId),
        eq(essayPhases.attemptId, attemptId),
        eq(essayPhases.questionId, questionId),
        eq(essayPhases.status, "writing"),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

export type DiscardOutcome = "discarded" | "marking_in_progress" | "already_finished" | "not_found";

/**
 * Deletes the student's OPEN essay attempt (S2): the attempt row, and by cascade its phase row and draft.
 * Refused while a marking is in flight (a lease younger than 90 s). Earlier finished attempts are other
 * attempt rows and are never touched.
 */
export async function discardOpenAttempt(db: Db, userId: string, attemptId: string): Promise<DiscardOutcome> {
  const found = await db
    .select({ completedAt: attempts.completedAt })
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
    .limit(1);
  if (!found[0]) return "not_found";
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

export interface EssayLatest {
  questionId: string;
  mark: number;
  band: number | null;
  attemptId: string;
  at: Date;
}

/** The student's latest marked result per essay (the unit page's "latest mark"; a redo replaces it). */
export async function latestEssayMarks(db: Db, userId: string, unitId: string): Promise<Map<string, EssayLatest>> {
  const rows = await db
    .select({
      questionId: results.questionId,
      mark: results.marksAwarded,
      attemptId: results.attemptId,
      at: results.createdAt,
      band: essayPhases.band,
    })
    .from(results)
    .leftJoin(essayPhases, and(eq(essayPhases.attemptId, results.attemptId), eq(essayPhases.questionId, results.questionId)))
    .where(and(eq(results.userId, userId), eq(results.unitId, unitId)))
    .orderBy(desc(results.createdAt), desc(results.id));
  const out = new Map<string, EssayLatest>();
  for (const r of rows) if (!out.has(r.questionId)) out.set(r.questionId, r);
  return out;
}

/** For each concept, the missing-piece sentence from the student's most recent finished essay that listed it. */
export async function latestGapDetails(db: Db, userId: string, unitId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ gaps: essayPhases.gaps })
    .from(essayPhases)
    .where(and(eq(essayPhases.userId, userId), eq(essayPhases.unitId, unitId), eq(essayPhases.status, "finished")))
    .orderBy(desc(essayPhases.gradedAt));
  const out = new Map<string, string>();
  for (const r of rows) for (const g of r.gaps ?? []) if (!out.has(g.conceptId)) out.set(g.conceptId, g.detail);
  return out;
}

/** The finished phase rows still waiting for their result row (a failed result save): used to repair (C2). */
export async function listFinishedOpenAttempts(db: Db, userId: string, unitId: string): Promise<EssayPhaseRow[]> {
  const rows = await db
    .select({ phase: essayPhases })
    .from(essayPhases)
    .innerJoin(attempts, eq(attempts.id, essayPhases.attemptId))
    .where(and(eq(essayPhases.userId, userId), eq(essayPhases.unitId, unitId), eq(essayPhases.status, "finished"), isNull(attempts.completedAt)));
  return rows.map((r) => r.phase);
}


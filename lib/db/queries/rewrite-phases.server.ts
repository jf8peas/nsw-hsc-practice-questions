import "server-only";

import { and, eq } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import { rewritePhases, type NewRewritePhaseRow, type RewriteDisplayData, type RewritePhaseRow } from "@/lib/db/schema";

/**
 * Phase-row queries for the sentence-writing unit (spec 005). One row per question in a
 * writing-practice attempt, created at phase 1 and kept for the attempt detail page. All
 * queries are scoped to the session user's id (Principle IX).
 */

export type PhaseStatus = "phase1" | "phase2" | "final";

/** The phase row for one question, only if it belongs to `userId`. */
export async function getRewritePhase(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<RewritePhaseRow | null> {
  const rows = await db
    .select()
    .from(rewritePhases)
    .where(
      and(
        eq(rewritePhases.userId, userId),
        eq(rewritePhases.attemptId, attemptId),
        eq(rewritePhases.questionId, questionId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Every phase row of one attempt (scoped to `userId`), for the attempt detail page (FR-020). */
export async function listRewritePhases(
  db: Db,
  userId: string,
  attemptId: string,
): Promise<RewritePhaseRow[]> {
  return db
    .select()
    .from(rewritePhases)
    .where(and(eq(rewritePhases.userId, userId), eq(rewritePhases.attemptId, attemptId)));
}

/**
 * Insert a phase row. Idempotent: `UNIQUE(attempt_id, question_id)` means a second
 * simultaneous submit for the same question changes nothing and `inserted` is false
 * (FR-029). Used for a graded phase 1 (status `phase1`, or `final` at 3/3) and for the
 * self-mark path (status `final`).
 */
export async function insertRewritePhase(
  db: Db,
  row: NewRewritePhaseRow,
): Promise<{ inserted: boolean }> {
  const rows = await db
    .insert(rewritePhases)
    .values(row)
    .onConflictDoNothing({ target: [rewritePhases.attemptId, rewritePhases.questionId] })
    .returning({ id: rewritePhases.id });
  return { inserted: rows.length > 0 };
}

/**
 * Finalise a question with the phase 2 result (FR-019 best-of). Guarded by
 * `status = 'phase1'` so a double tap updates once; returns the updated row, or null when
 * the row was already final.
 */
export async function finaliseRewritePhase(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
  input: {
    phase2Answer: string;
    phase2Marks: number;
    phase2Feedback: string | null;
    recordedMark: number;
    /** spec 006: the display-only phase 2 data (spans, outcomes, language note). */
    displayData?: RewriteDisplayData | null;
  },
): Promise<RewritePhaseRow | null> {
  const rows = await db
    .update(rewritePhases)
    .set({
      status: "final",
      phase2Answer: input.phase2Answer,
      phase2Marks: input.phase2Marks,
      phase2Feedback: input.phase2Feedback,
      phase2GradedAt: new Date(),
      recordedMark: input.recordedMark,
      ...(input.displayData !== undefined ? { displayData: input.displayData } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(rewritePhases.userId, userId),
        eq(rewritePhases.attemptId, attemptId),
        eq(rewritePhases.questionId, questionId),
        eq(rewritePhases.status, "phase1"),
      ),
    )
    .returning();
  return rows[0] ?? null;
}


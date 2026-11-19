import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import {
  unseenPhases,
  type NewUnseenPhaseRow,
  type SkillVerdicts,
  type UnseenPhaseRow,
} from "@/lib/db/schema";

/**
 * Phase-row queries for the unseen-text unit (spec 008). One row per question in an attempt, created
 * when the first try is marked and kept for the attempt detail page. Every query is scoped to the
 * session user's id (Principle IX).
 */

export type UnseenEndingValue = "full_marks" | "retried" | "declined" | "no_retry";

/** The phase row for one question, only if it belongs to `userId`. */
export async function getUnseenPhase(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<UnseenPhaseRow | null> {
  const rows = await db
    .select()
    .from(unseenPhases)
    .where(
      and(
        eq(unseenPhases.userId, userId),
        eq(unseenPhases.attemptId, attemptId),
        eq(unseenPhases.questionId, questionId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Every phase row of one attempt (scoped to `userId`), for the attempt detail page. */
export async function listUnseenPhases(db: Db, userId: string, attemptId: string): Promise<UnseenPhaseRow[]> {
  return db
    .select()
    .from(unseenPhases)
    .where(and(eq(unseenPhases.userId, userId), eq(unseenPhases.attemptId, attemptId)));
}

/**
 * Insert a phase row. Idempotent: `UNIQUE(attempt_id, question_id)` means a second simultaneous
 * submit changes nothing and `inserted` is false. Used for a marked first try (status `try1`, or
 * `final` at full marks and for a question with no retry).
 */
export async function insertUnseenPhase(db: Db, row: NewUnseenPhaseRow): Promise<{ inserted: boolean }> {
  const rows = await db
    .insert(unseenPhases)
    .values(row)
    .onConflictDoNothing({ target: [unseenPhases.attemptId, unseenPhases.questionId] })
    .returning({ id: unseenPhases.id });
  return { inserted: rows.length > 0 };
}

export interface FinaliseRetryInput {
  recordedMark: number;
  try2: {
    text: string;
    /** Already capped at max marks minus one. */
    mark: number;
    verdicts: SkillVerdicts;
    feedback: string;
    biggestGap: string;
    promptVersion: string;
    model: string;
  };
}

/**
 * Finalise a question after a marked retry. Guarded by `status = 'try1'` so a double tap updates once;
 * returns the updated row, or null when the row was already final.
 */
export async function finaliseUnseenRetry(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
  input: FinaliseRetryInput,
): Promise<UnseenPhaseRow | null> {
  const rows = await db
    .update(unseenPhases)
    .set({
      status: "final",
      ending: "retried",
      recordedMark: input.recordedMark,
      try2Text: input.try2.text,
      try2Mark: input.try2.mark,
      try2Verdicts: input.try2.verdicts,
      try2Feedback: input.try2.feedback,
      try2BiggestGap: input.try2.biggestGap,
      try2PromptVersion: input.try2.promptVersion,
      try2Model: input.try2.model,
      try2GradedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(unseenPhases.userId, userId),
        eq(unseenPhases.attemptId, attemptId),
        eq(unseenPhases.questionId, questionId),
        eq(unseenPhases.status, "try1"),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

/**
 * Finalise a question when the student declines the retry: the first try's mark is recorded.
 * Guarded by `status = 'try1'`; returns the updated row, or null when it was already final.
 */
export async function finaliseUnseenDecline(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<UnseenPhaseRow | null> {
  const current = await getUnseenPhase(db, userId, attemptId, questionId);
  if (!current || current.status !== "try1") return null;
  const rows = await db
    .update(unseenPhases)
    .set({ status: "final", ending: "declined", recordedMark: current.try1Mark, updatedAt: new Date() })
    .where(
      and(
        eq(unseenPhases.userId, userId),
        eq(unseenPhases.attemptId, attemptId),
        eq(unseenPhases.questionId, questionId),
        eq(unseenPhases.status, "try1"),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

/**
 * Flag a final attempt for review (FR-035). Conditional on `flagged_at is null`, so it is stored once
 * and covers both tries. Returns whether THIS call stored it; the caller reads the row to tell "already
 * flagged" from "not final". Never touches a mark.
 */
export async function flagUnseenPhase(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<boolean> {
  const rows = await db
    .update(unseenPhases)
    .set({ flaggedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(unseenPhases.userId, userId),
        eq(unseenPhases.attemptId, attemptId),
        eq(unseenPhases.questionId, questionId),
        eq(unseenPhases.status, "final"),
        isNull(unseenPhases.flaggedAt),
      ),
    )
    .returning({ id: unseenPhases.id });
  return rows.length > 0;
}

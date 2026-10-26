import "server-only";

import { finalizeIfComplete } from "@/lib/attempts/complete.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { ensureAttempt, getAttemptForUser } from "@/lib/db/queries/attempts.server";
import {
  getResult,
  insertResultIdempotent,
  touchLastAnswer,
} from "@/lib/db/queries/results.server";
import type { ResultRow } from "@/lib/db/schema";
import { signReceipt, type AttemptFields, type GradedBy } from "@/lib/tokens.server";

/** What gets stored for one graded answer (the student, attempt and unit come from elsewhere). */
export interface ResultFields {
  questionId: string;
  answer: string;
  marks: number;
  max: number;
  gradedBy: GradedBy;
  feedback: string | null;
  hits: string[] | null;
  misses: string[] | null;
}

export type SaveOutcome =
  | {
      status: "saved";
      /** False when a result for this question already existed (a duplicate). */
      inserted: boolean;
      completed: boolean;
      /** The already-stored row, when `inserted` is false. */
      stored: ResultRow | null;
    }
  | { status: "failed"; unavailable: boolean; error: unknown };

/** Save time budget: marking must never wait longer than this for the database (SC-003). */
export const SAVE_TIMEOUT_MS = 1500;

/**
 * Save one result, creating the attempt row first if the attempt was started
 * while the database was down. Every step is idempotent, so a retry after a
 * partial failure heals. Never throws for database trouble: a failure comes
 * back as `{ status: "failed" }` so the caller can hand the student a receipt.
 * AttemptOwnerMismatchError (an attempt id owned by someone else) is rethrown.
 */
export async function saveResult(
  userId: string,
  attemptId: string,
  attempt: AttemptFields,
  fields: ResultFields,
  timeoutMs: number = SAVE_TIMEOUT_MS,
): Promise<SaveOutcome> {
  try {
    return await dbCall(async (db) => {
      await ensureAttempt(db, {
        id: attemptId,
        userId,
        unitId: attempt.unitId,
        questionIds: attempt.questionIds,
        mcOptionOrder: attempt.mcOptionOrder,
        startedAt: new Date(attempt.issuedAt * 1000),
      });
      const { inserted } = await insertResultIdempotent(db, {
        attemptId,
        userId,
        unitId: attempt.unitId,
        questionId: fields.questionId,
        answer: fields.answer,
        marksAwarded: fields.marks,
        maxMarks: fields.max,
        gradedBy: fields.gradedBy,
        feedback: fields.feedback,
        rubricHits: fields.hits,
        rubricMisses: fields.misses,
      });
      const stored = inserted ? null : await getResult(db, userId, attemptId, fields.questionId);
      if (inserted) await touchLastAnswer(db, userId);
      const row = await getAttemptForUser(db, userId, attemptId);
      const { completed } = row ? await finalizeIfComplete(db, row) : { completed: false };
      return { status: "saved" as const, inserted, completed, stored };
    }, timeoutMs);
  } catch (error) {
    if (error instanceof Error && error.name === "AttemptOwnerMismatchError") throw error;
    if (!(error instanceof DbUnavailableError)) {
      console.error("saving a result failed", error);
    }
    return { status: "failed", unavailable: error instanceof DbUnavailableError, error };
  }
}

/** A signed receipt the client can re-send to /api/results/retry later. */
export function buildReceipt(
  userId: string,
  attemptId: string,
  attempt: AttemptFields,
  fields: ResultFields,
): string {
  return signReceipt({
    uid: userId,
    attemptId,
    attempt,
    questionId: fields.questionId,
    answer: fields.answer,
    marks: fields.marks,
    max: fields.max,
    gradedBy: fields.gradedBy,
    feedback: fields.feedback,
    hits: fields.hits,
    misses: fields.misses,
  });
}

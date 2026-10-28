import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import type { ConceptResult } from "@/lib/concepts/progress";
import type { Db } from "@/lib/db/index.server";
import { results, users, type ResultRow } from "@/lib/db/schema";

export interface ResultInsert {
  attemptId: string;
  userId: string;
  unitId: string;
  questionId: string;
  answer: string;
  marksAwarded: number;
  maxMarks: number;
  gradedBy: "auto" | "llm" | "self";
  feedback: string | null;
  rubricHits: string[] | null;
  rubricMisses: string[] | null;
  /**
   * When the answer was given. Left unset the column defaults to now(); only a late save
   * (the retry route) sets it, from the receipt's issue time, so concept progress replays
   * in answer order rather than save order (spec 002 research R2).
   */
  createdAt?: Date;
}

/**
 * Insert one result. `UNIQUE(attempt_id, question_id)` makes this idempotent:
 * if the row already exists nothing changes and `inserted` is false (FR-007).
 */
export async function insertResultIdempotent(
  db: Db,
  row: ResultInsert,
): Promise<{ inserted: boolean }> {
  const rows = await db
    .insert(results)
    .values(row)
    .onConflictDoNothing({ target: [results.attemptId, results.questionId] })
    .returning({ id: results.id });
  return { inserted: rows.length > 0 };
}

/** A stored result, only if it belongs to `userId`. */
export async function getResult(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<ResultRow | null> {
  const rows = await db
    .select()
    .from(results)
    .where(
      and(
        eq(results.userId, userId),
        eq(results.attemptId, attemptId),
        eq(results.questionId, questionId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** question id -> marks for every result saved in this attempt (the student's own). */
export async function getAnsweredMarks(
  db: Db,
  userId: string,
  attemptId: string,
): Promise<Record<string, { marks: number; max: number }>> {
  const rows = await db
    .select({
      questionId: results.questionId,
      marks: results.marksAwarded,
      max: results.maxMarks,
    })
    .from(results)
    .where(and(eq(results.userId, userId), eq(results.attemptId, attemptId)));
  return Object.fromEntries(rows.map((r) => [r.questionId, { marks: r.marks, max: r.max }]));
}

/**
 * One student's results for one unit, in answer order, for concept progress. Always scoped to
 * the session user's id (Principle IX); ties on time break on id so the replay is deterministic.
 */
export async function listUnitResultsForProgress(
  db: Db,
  userId: string,
  unitId: string,
): Promise<ConceptResult[]> {
  return db
    .select({
      id: results.id,
      questionId: results.questionId,
      marks: results.marksAwarded,
      max: results.maxMarks,
      answeredAt: results.createdAt,
    })
    .from(results)
    .where(and(eq(results.userId, userId), eq(results.unitId, unitId)))
    .orderBy(asc(results.createdAt), asc(results.id));
}

/** last_answer_at only ever moves forward. */
export async function touchLastAnswer(db: Db, userId: string): Promise<void> {
  await db
    .update(users)
    .set({ lastAnswerAt: sql`greatest(${users.lastAnswerAt}, now())` })
    .where(eq(users.id, userId));
}

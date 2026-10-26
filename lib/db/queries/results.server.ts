import "server-only";

import { and, eq, sql } from "drizzle-orm";

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

/** last_answer_at only ever moves forward. */
export async function touchLastAnswer(db: Db, userId: string): Promise<void> {
  await db
    .update(users)
    .set({ lastAnswerAt: sql`greatest(${users.lastAnswerAt}, now())` })
    .where(eq(users.id, userId));
}

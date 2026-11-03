import "server-only";

import { and, eq } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import { rewriteDrafts, type RewriteDraftRow } from "@/lib/db/schema";

/**
 * Draft-row queries for the sentence-writing unit (spec 006 FR-053/FR-054). One row per question
 * in a writing-practice attempt holding the student's in-progress draft text per phase, so a
 * resume on another device restores what the student had typed. All queries are scoped to the
 * session user's id (Principle IX).
 */

/** The draft row for one question, only if it belongs to `userId`. */
export async function getRewriteDraft(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<RewriteDraftRow | null> {
  const rows = await db
    .select()
    .from(rewriteDrafts)
    .where(
      and(
        eq(rewriteDrafts.userId, userId),
        eq(rewriteDrafts.attemptId, attemptId),
        eq(rewriteDrafts.questionId, questionId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Every draft row of one attempt (scoped to `userId`), for the resume loader. */
export async function listRewriteDrafts(
  db: Db,
  userId: string,
  attemptId: string,
): Promise<RewriteDraftRow[]> {
  return db
    .select()
    .from(rewriteDrafts)
    .where(and(eq(rewriteDrafts.userId, userId), eq(rewriteDrafts.attemptId, attemptId)));
}

/**
 * Upsert one phase's draft text. Idempotent: `UNIQUE(attempt_id, question_id)` means a second
 * concurrent save for the same question updates the same row. An empty `draft` clears that
 * phase's column. The update uses the schema's TypeScript keys (phase1Draft / phase2Draft) —
 * Drizzle's update builder only matches those, not the SQL column names.
 */
export async function upsertRewriteDraft(
  db: Db,
  userId: string,
  attemptId: string,
  unitId: string,
  questionId: string,
  phase: 1 | 2,
  draft: string,
): Promise<void> {
  await db
    .insert(rewriteDrafts)
    .values({
      attemptId,
      userId,
      unitId,
      questionId,
      ...(phase === 1 ? { phase1Draft: draft } : { phase2Draft: draft }),
    })
    .onConflictDoUpdate({
      target: [rewriteDrafts.attemptId, rewriteDrafts.questionId],
      set: phase === 1 ? { phase1Draft: draft, updatedAt: new Date() } : { phase2Draft: draft, updatedAt: new Date() },
    });
}

/** Clear one phase's draft column (called when that phase is graded but the question is not final). */
export async function clearRewriteDraft(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
  phase: 1 | 2,
): Promise<void> {
  await db
    .update(rewriteDrafts)
    .set(phase === 1 ? { phase1Draft: "", updatedAt: new Date() } : { phase2Draft: "", updatedAt: new Date() })
    .where(
      and(
        eq(rewriteDrafts.userId, userId),
        eq(rewriteDrafts.attemptId, attemptId),
        eq(rewriteDrafts.questionId, questionId),
      ),
    );
}

/** Delete the whole draft row (called when the question becomes final). Scoped to the user. */
export async function deleteRewriteDraft(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<void> {
  await db
    .delete(rewriteDrafts)
    .where(
      and(
        eq(rewriteDrafts.userId, userId),
        eq(rewriteDrafts.attemptId, attemptId),
        eq(rewriteDrafts.questionId, questionId),
      ),
    );
}
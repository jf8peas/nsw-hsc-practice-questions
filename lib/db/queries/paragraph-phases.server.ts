import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import {
  paragraphPhases,
  type NewParagraphPhaseRow,
  type ParagraphPhaseRow,
  type ParagraphVerdicts,
} from "@/lib/db/schema";

/**
 * Phase-row queries for the paragraph-writing unit (spec 007). One row per question in a paragraph
 * attempt, created at phase 1 and kept for the attempt detail page. Every query is scoped to the
 * session user's id (Principle IX).
 */

export type ParagraphEnding = "full_marks" | "corrected" | "no_correction" | "self_mark";

/** The phase row for one question, only if it belongs to `userId`. */
export async function getParagraphPhase(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<ParagraphPhaseRow | null> {
  const rows = await db
    .select()
    .from(paragraphPhases)
    .where(
      and(
        eq(paragraphPhases.userId, userId),
        eq(paragraphPhases.attemptId, attemptId),
        eq(paragraphPhases.questionId, questionId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Every phase row of one attempt (scoped to `userId`), for the attempt detail page. */
export async function listParagraphPhases(db: Db, userId: string, attemptId: string): Promise<ParagraphPhaseRow[]> {
  return db
    .select()
    .from(paragraphPhases)
    .where(and(eq(paragraphPhases.userId, userId), eq(paragraphPhases.attemptId, attemptId)));
}

/**
 * Insert a phase row. Idempotent: `UNIQUE(attempt_id, question_id)` means a second simultaneous
 * submit changes nothing and `inserted` is false. Used for a marked phase 1 (status `phase1`, or
 * `final` at 4/4) and for the self-mark path (status `final`).
 */
export async function insertParagraphPhase(db: Db, row: NewParagraphPhaseRow): Promise<{ inserted: boolean }> {
  const rows = await db
    .insert(paragraphPhases)
    .values(row)
    .onConflictDoNothing({ target: [paragraphPhases.attemptId, paragraphPhases.questionId] })
    .returning({ id: paragraphPhases.id });
  return { inserted: rows.length > 0 };
}

export interface FinaliseInput {
  ending: "corrected" | "no_correction";
  recordedMark: number;
  /** Only when the correction was marked. */
  phase2?: {
    text: string;
    mark: number;
    verdicts: ParagraphVerdicts;
    feedback: string | null;
    promptVersion: string;
    model: string;
  };
}

/**
 * Finalise a question after phase 2 (marked, or the FR-019a ending). Guarded by
 * `status = 'phase1'` so a double tap updates once; returns the updated row, or null when the
 * row was already final.
 */
export async function finaliseParagraphPhase(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
  input: FinaliseInput,
): Promise<ParagraphPhaseRow | null> {
  const rows = await db
    .update(paragraphPhases)
    .set({
      status: "final",
      ending: input.ending,
      recordedMark: input.recordedMark,
      ...(input.phase2
        ? {
            phase2Text: input.phase2.text,
            phase2Mark: input.phase2.mark,
            phase2Verdicts: input.phase2.verdicts,
            phase2Feedback: input.phase2.feedback,
            phase2PromptVersion: input.phase2.promptVersion,
            phase2Model: input.phase2.model,
            phase2GradedAt: new Date(),
          }
        : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(paragraphPhases.userId, userId),
        eq(paragraphPhases.attemptId, attemptId),
        eq(paragraphPhases.questionId, questionId),
        eq(paragraphPhases.status, "phase1"),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

/**
 * Flag a marker-marked, final answer for review (FR-029). Conditional on `flagged_at is null`, so
 * it is stored once. Returns whether THIS call stored it; the caller then reads the row to tell
 * "already flagged" from "not flaggable". Never touches a mark.
 */
export async function flagParagraphPhase(
  db: Db,
  userId: string,
  attemptId: string,
  questionId: string,
): Promise<boolean> {
  const rows = await db
    .update(paragraphPhases)
    .set({ flaggedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(paragraphPhases.userId, userId),
        eq(paragraphPhases.attemptId, attemptId),
        eq(paragraphPhases.questionId, questionId),
        eq(paragraphPhases.status, "final"),
        eq(paragraphPhases.mode, "marker"),
        isNull(paragraphPhases.flaggedAt),
      ),
    )
    .returning({ id: paragraphPhases.id });
  return rows.length > 0;
}

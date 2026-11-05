import "server-only";

import { randomUUID } from "node:crypto";

import { nextQuestion, essayProgress } from "@/lib/attempts/sequence.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { createSequentialAttempt } from "@/lib/db/queries/attempts.server";
import { recordedMarks } from "@/lib/db/queries/sequence.server";
import type { Attempt } from "@/lib/db/schema";
import { essayBarFrom, loadParagraphState } from "@/lib/paragraph/state.server";
import type { EssayBar, ParagraphState } from "@/lib/paragraph/types";
import type { ParagraphQuestion, Unit } from "@/lib/types";

// Start (or rejoin) the student's next paragraph quiz (spec 007, research R1). The next question is
// derived from their results; the one attempt per part is guaranteed by the partial unique index.

export type StartSequential =
  | { kind: "finished"; essayTotal: number }
  | { kind: "unavailable" }
  | { kind: "ok"; created: boolean; attempt: Attempt; question: ParagraphQuestion; essay: EssayBar; paragraphState: ParagraphState };

export async function startSequential(userId: string, unit: Unit): Promise<StartSequential> {
  try {
    const marks = await dbCall((db) => recordedMarks(db, userId, unit.id));
    const next = nextQuestion(unit, new Set(marks.keys()));
    const progress = essayProgress(unit, marks);
    if (!next || progress.finished) return { kind: "finished", essayTotal: progress.finished ? progress.essayTotal : 0 };

    const { attempt, created } = await dbCall((db) =>
      createSequentialAttempt(db, { id: randomUUID(), userId, unitId: unit.id, questionId: next.id }),
    );
    const paragraphState = await dbCall((db) => loadParagraphState(db, userId, attempt));
    if (!paragraphState) return { kind: "unavailable" };
    return { kind: "ok", created, attempt, question: next, essay: essayBarFrom(progress), paragraphState };
  } catch (error) {
    if (error instanceof DbUnavailableError) return { kind: "unavailable" };
    throw error;
  }
}

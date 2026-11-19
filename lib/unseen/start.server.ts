import "server-only";

import { randomInt, randomUUID } from "node:crypto";

import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { createUnseenAttempt, getLatestIncompleteAttempt } from "@/lib/db/queries/attempts.server";
import { listUnitResultsForProgress } from "@/lib/db/queries/results.server";
import type { Attempt } from "@/lib/db/schema";
import type { Unit, UnseenQuestion } from "@/lib/types";
import { conceptProgress } from "@/lib/concepts/progress";
import { drawUnseen, formStatsOf, unansweredOf, unseenQuestions, weightOf, type RandomInt } from "@/lib/unseen/draw";
import { loadUnseenState } from "@/lib/unseen/state.server";
import type { UnseenState } from "@/lib/unseen/types";

// Start (or rejoin) the student's next unseen-text quiz (spec 008, research R8 and R9). An unfinished
// question is offered first; otherwise one unanswered question is drawn. The partial unique index on
// open attempts makes two tabs starting at once end on the same attempt. Without the database nothing
// can be chosen or resumed, so the unit does not start (constitution Principle VI, 2.15.0).

export type StartUnseen =
  | { kind: "finished"; total: number; answered: number }
  | { kind: "unavailable" }
  | { kind: "ok"; created: boolean; attempt: Attempt; question: UnseenQuestion; unseenState: UnseenState };

export async function startUnseen(userId: string, unit: Unit, rand: RandomInt = randomInt): Promise<StartUnseen> {
  try {
    const questions = unseenQuestions(unit);
    const results = await dbCall((db) => listUnitResultsForProgress(db, userId, unit.id));
    const answered = new Set(results.map((r) => r.questionId));

    let attempt = await dbCall((db) => getLatestIncompleteAttempt(db, userId, unit.id));
    let created = false;
    if (!attempt) {
      const candidates = unansweredOf(questions, answered);
      // weights: the form's average mark (untried forms first) and the skills still to clear. Results for
      // questions no longer in the bank count toward nothing here.
      const formOf = (q: UnseenQuestion) => unit.texts?.find((t) => t.id === q.textId)?.form ?? null;
      const marks = new Map(results.map((r) => [r.questionId, r.max > 0 ? r.marks / r.max : 0]));
      const stats = formStatsOf(questions, formOf, marks);
      const uncleared = new Set(conceptProgress(unit, results).map((c) => c.conceptId));
      const drawn = drawUnseen(candidates, (q) => weightOf(q, formOf(q), stats, uncleared), rand);
      if (!drawn) return { kind: "finished", total: questions.length, answered: answered.size };
      const made = await dbCall((db) =>
        createUnseenAttempt(db, { id: randomUUID(), userId, unitId: unit.id, questionId: drawn.id }),
      );
      attempt = made.attempt;
      created = made.created;
    }

    const question = questions.find((q) => q.id === attempt!.questionIds[0]);
    if (!question) return { kind: "unavailable" }; // the question was retired: nothing sensible to resume
    const unseenState = await dbCall((db) => loadUnseenState(db, userId, attempt!));
    if (!unseenState) return { kind: "unavailable" };
    return { kind: "ok", created, attempt, question, unseenState };
  } catch (error) {
    if (error instanceof DbUnavailableError) return { kind: "unavailable" };
    throw error;
  }
}

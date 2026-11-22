import "server-only";

import { randomInt, randomUUID } from "node:crypto";

import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { createUnseenAttempt, getLatestIncompleteAttempt } from "@/lib/db/queries/attempts.server";
import { listUnitResultsForProgress, loadConceptProgress } from "@/lib/db/queries/results.server";
import type { Attempt } from "@/lib/db/schema";
import type { Db } from "@/lib/db/index.server";
import type { TextForm, Unit, UnseenQuestion } from "@/lib/types";
import {
  ageWeights,
  drawUnseen,
  type DrawQuestion,
  formStatsOf,
  isRepeating,
  latestAnswers,
  latestShares,
  recentQuestionIds,
  repeatCandidates,
  repeatWeightOf,
  unansweredOf,
  unseenQuestions,
  weightOf,
  type RandomInt,
} from "@/lib/unseen/draw";
import { loadUnseenState } from "@/lib/unseen/state.server";
import type { UnseenState } from "@/lib/unseen/types";

// Start (or rejoin) the student's next unseen-text quiz (spec 008, research R8 and R9). An unfinished
// question is offered first; otherwise one unanswered question is drawn, and once every question has a
// recorded mark the draw repeats over the whole bank (a repeat is a new attempt, never an overwrite). The partial unique index on
// open attempts makes two tabs starting at once end on the same attempt. Without the database nothing
// can be chosen or resumed, so the unit does not start (constitution Principle VI, 2.15.0).

export type StartUnseen =
  | { kind: "finished"; total: number; answered: number }
  | { kind: "unavailable" }
  | { kind: "ok"; created: boolean; attempt: Attempt; question: UnseenQuestion; unseenState: UnseenState };

/**
 * What differs between the Advanced English units' starts (spec 009 research R9): the unit's questions, how a
 * question's text form is weighted (the comparative unit has none), which skill concepts are uncleared (spec 009
 * shares progress between the units), and how an attempt's state is loaded.
 */
export interface DrawConfig<Q extends DrawQuestion, S> {
  questions: readonly Q[];
  formOf: (q: Q) => TextForm | null;
  unclearedOf: (db: Db, userId: string) => Promise<ReadonlySet<string>>;
  loadState: (db: Db, userId: string, attempt: Attempt) => Promise<S | null>;
}

export type StartDraw<Q, S> =
  | { kind: "finished"; total: number; answered: number }
  | { kind: "unavailable" }
  | { kind: "ok"; created: boolean; attempt: Attempt; question: Q; state: S };

/** The shared start: an unfinished question first, otherwise one unanswered question drawn, repeats once all are answered. */
export async function startDraw<Q extends DrawQuestion, S>(
  userId: string,
  unitId: string,
  config: DrawConfig<Q, S>,
  rand: RandomInt = randomInt,
): Promise<StartDraw<Q, S>> {
  try {
    const questions = config.questions;
    const results = await dbCall((db) => listUnitResultsForProgress(db, userId, unitId));
    const answered = new Set(results.map((r) => r.questionId));

    let attempt = await dbCall((db) => getLatestIncompleteAttempt(db, userId, unitId));
    let created = false;
    if (!attempt) {
      const repeating = isRepeating(questions, answered);
      const latest = latestAnswers(results);
      const candidates = repeating ? repeatCandidates(questions, recentQuestionIds(questions, results)) : unansweredOf(questions, answered);
      // weights: the form's average mark (untried forms first; none in the comparative unit) and the skills still
      // to clear. Results for questions no longer in the bank count toward nothing here.
      const stats = formStatsOf(questions, config.formOf, latestShares(results)); // each question's latest mark
      const uncleared = await dbCall((db) => config.unclearedOf(db, userId));
      const ages = ageWeights(candidates, latest);
      const drawn = drawUnseen(
        candidates,
        (q) => (repeating ? repeatWeightOf(q, config.formOf(q), stats, uncleared, latest, ages) : weightOf(q, config.formOf(q), stats, uncleared)),
        rand,
      );
      if (!drawn) return { kind: "finished", total: questions.length, answered: answered.size }; // an empty bank only
      const made = await dbCall((db) => createUnseenAttempt(db, { id: randomUUID(), userId, unitId, questionId: drawn.id }));
      attempt = made.attempt;
      created = made.created;
    }

    const question = questions.find((q) => q.id === attempt!.questionIds[0]);
    if (!question) return { kind: "unavailable" }; // the question was retired: nothing sensible to resume
    const state = await dbCall((db) => config.loadState(db, userId, attempt!));
    if (!state) return { kind: "unavailable" };
    return { kind: "ok", created, attempt, question, state };
  } catch (error) {
    if (error instanceof DbUnavailableError) return { kind: "unavailable" };
    throw error;
  }
}

export async function startUnseen(userId: string, unit: Unit, rand: RandomInt = randomInt): Promise<StartUnseen> {
  const formOf = (q: UnseenQuestion) => unit.texts?.find((t) => t.id === q.textId)?.form ?? null;
  const started = await startDraw<UnseenQuestion, UnseenState>(
    userId,
    unit.id,
    {
      questions: unseenQuestions(unit),
      formOf,
      unclearedOf: async (db, uid) => new Set((await loadConceptProgress(db, uid, unit)).map((c) => c.conceptId)),
      loadState: (db, uid, attempt) => loadUnseenState(db, uid, attempt),
    },
    rand,
  );
  return started.kind === "ok" ? { kind: "ok", created: started.created, attempt: started.attempt, question: started.question, unseenState: started.state } : started;
}

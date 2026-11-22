import "server-only";

import { randomInt } from "node:crypto";

import { loadConceptProgress } from "@/lib/db/queries/results.server";
import type { Attempt } from "@/lib/db/schema";
import type { ComparativeState } from "@/lib/comparative/types";
import { loadComparativeState } from "@/lib/comparative/state.server";
import type { ComparativeQuestion, Unit } from "@/lib/types";
import { startDraw, type StartDraw } from "@/lib/unseen/start.server";
import type { RandomInt } from "@/lib/unseen/draw";

// Start (or rejoin) the student's next comparative quiz (spec 009 research R9): spec 008's start with the text-form
// weight switched off (every question mixes forms), the skills still to clear counted across both units (the seven
// shared skills are one count), and the comparative state loader. An unfinished question is offered first; one
// unanswered question is drawn, and once every question has a recorded mark the draw repeats. Without the database
// nothing can be chosen or resumed, so the unit does not start (constitution Principle VI).

export type StartComparative =
  | { kind: "finished"; total: number; answered: number }
  | { kind: "unavailable" }
  | { kind: "ok"; created: boolean; attempt: Attempt; question: ComparativeQuestion; comparativeState: ComparativeState };

export const comparativeQuestions = (unit: Unit): ComparativeQuestion[] =>
  unit.questions.filter((q): q is ComparativeQuestion => q.type === "comparative");

export async function startComparative(userId: string, unit: Unit, rand: RandomInt = randomInt): Promise<StartComparative> {
  const started: StartDraw<ComparativeQuestion, ComparativeState> = await startDraw<ComparativeQuestion, ComparativeState>(
    userId,
    unit.id,
    {
      questions: comparativeQuestions(unit),
      formOf: () => null,
      unclearedOf: async (db, uid) => new Set((await loadConceptProgress(db, uid, unit)).map((c) => c.conceptId)),
      loadState: (db, uid, attempt) => loadComparativeState(db, uid, attempt),
    },
    rand,
  );
  return started.kind === "ok"
    ? { kind: "ok", created: started.created, attempt: started.attempt, question: started.question, comparativeState: started.state }
    : started;
}

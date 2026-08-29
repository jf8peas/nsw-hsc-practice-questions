import "server-only";

import type { Answer, AnswerSet } from "@/lib/types";

import { answers as y11FormulaTestAnswers } from "../units/y11-formula-test/answers";

/**
 * The answer-key registry. SERVER ONLY — the "server-only" import above makes
 * the build fail if this module is ever pulled into a client bundle.
 *
 * To add a unit: add its answer set here, keyed the same way as its questions.
 */
const ALL_ANSWERS: AnswerSet = {
  ...y11FormulaTestAnswers,
};

export function getAnswer(questionId: string): Answer | undefined {
  return ALL_ANSWERS[questionId];
}

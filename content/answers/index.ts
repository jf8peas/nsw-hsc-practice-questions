import "server-only";

import type { Answer, AnswerSet } from "@/lib/types";

import { answers as y11FormulaTestAnswers } from "../units/y11-formula-test/answers";
import { answers as y11EconSupplyDemandAnswers } from "../units/y11-economics-supply-demand/answers";
import { answers as y11EconPreliminaryAnswers } from "../units/y11-economics-preliminary/answers";
import { answers as y11PhysPreliminaryAnswers } from "../units/y11-physics-preliminary/answers";
import { answers as y11EconEssayAnswers } from "../units/y11-economics-essay-scaffold/answers";

/**
 * The answer-key registry. SERVER ONLY — the "server-only" import above makes
 * the build fail if this module is ever pulled into a client bundle.
 *
 * To add a unit: add its answer set here, keyed the same way as its questions.
 */
const ALL_ANSWERS: AnswerSet = {
  ...y11FormulaTestAnswers,
  ...y11EconSupplyDemandAnswers,
  ...y11EconPreliminaryAnswers,
  ...y11PhysPreliminaryAnswers,
  ...y11EconEssayAnswers,
};

export function getAnswer(questionId: string): Answer | undefined {
  return ALL_ANSWERS[questionId];
}

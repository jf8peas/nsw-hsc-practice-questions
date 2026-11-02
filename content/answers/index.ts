import "server-only";

import type { Answer, AnswerSet } from "@/lib/types";

import { answers as y11EconSupplyDemandAnswers } from "../units/y11-economics-supply-demand/answers";
import { answers as y11EconPreliminaryAnswers } from "../units/y11-economics-preliminary/answers";
import { answers as y11PhysPreliminaryAnswers } from "../units/y11-physics-preliminary/answers";
import { answers as y12PhysAdvMechAnswers } from "../units/y12-physics-advanced-mechanics/answers";
import { answers as y12PhysCircPracAnswers } from "../units/y12-physics-circular-motion-practical/answers";
import { answers as y11EconEssayAnswers } from "../units/y11-economics-essay-scaffold/answers";
import { answers as y12EconGlobalAnswers } from "../units/y12-economics-global-economy/answers";
import { answers as y12EconSentenceAnswers } from "../units/y12-economics-sentence-writing/answers";

/**
 * The answer-key registry. SERVER ONLY — the "server-only" import above makes
 * the build fail if this module is ever pulled into a client bundle.
 *
 * To add a unit: add its answer set here, keyed the same way as its questions.
 */
const ALL_ANSWERS: AnswerSet = {
  ...y11EconSupplyDemandAnswers,
  ...y11EconPreliminaryAnswers,
  ...y11PhysPreliminaryAnswers,
  ...y11EconEssayAnswers,
  ...y12PhysAdvMechAnswers,
  ...y12PhysCircPracAnswers,
  ...y12EconGlobalAnswers,
  ...y12EconSentenceAnswers,
};

export function getAnswer(questionId: string): Answer | undefined {
  return ALL_ANSWERS[questionId];
}

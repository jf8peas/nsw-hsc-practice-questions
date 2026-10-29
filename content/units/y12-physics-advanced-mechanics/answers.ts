import type { AnswerSet } from "@/lib/types";

import { withWrongExplanations } from "../../explanation-helpers";
import { explanations } from "./explanations";
import { questions } from "./questions";
import { gravitationAnswers } from "./answers-gravitation";
import { projectileAnswers } from "./answers-projectiles";
import { circularAnswers } from "./answers-circular";

// Answer key for y12-physics-advanced-mechanics. NO "server-only" import here (the validator
// reads it); only re-exported via content/answers/index.ts, which is server-only. Never import
// from a client component. This unit's ids are three digits (m001–m180), so the explanations
// helper is told the width is 3.
const U = "y12-physics-advanced-mechanics";

const keyWithoutExplanations: AnswerSet = Object.fromEntries([
  ...gravitationAnswers,
  ...projectileAnswers,
  ...circularAnswers,
]);

export const answers: AnswerSet = withWrongExplanations(keyWithoutExplanations, questions, U, explanations, 3);

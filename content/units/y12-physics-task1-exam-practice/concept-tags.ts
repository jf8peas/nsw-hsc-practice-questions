import { defineTags } from "../../concept-helpers";

import { concepts } from "./concepts";

// PUBLIC — the concept each question tests (spec 002); "s01" is short answer 1.

export const conceptOfQuestionId = defineTags("y12-physics-task1-exam-practice", concepts, {
  "data-processing": ["s01", "s09"],
  "graph-analysis": ["s03", "s07", "s08", "s15"],
  "model-calcs": ["s04", "s05", "s06"],
  "reliability-validity": ["s02", "s10", "s11"],
  "errors-improvements": ["s12", "s13", "s14"],
  "projectile-calcs": ["s17", "s18", "s19", "s20"],
  "projectile-ideas": ["s21", "s22", "s23"],
  "circular-calcs": ["s24", "s25", "s26", "s35"],
  "circular-ideas": ["s27", "s28"],
  "investigation-design": ["s16", "s29", "s30", "s33"],
  "evaluating-methods": ["s31", "s32", "s34"],
});

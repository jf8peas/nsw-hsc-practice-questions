import { defineTags } from "../../concept-helpers";

import { concepts } from "./concepts";

// PUBLIC — the concept each question tests (spec 002); "s36" is short answer 36.

export const conceptOfQuestionId = defineTags("y12-physics-task1-exam-practice", concepts, {
  "error-trace": ["s36", "s37", "s38", "s39", "s40", "s41", "s42", "s43"],
  "accuracy-reliability-validity": ["s44", "s45", "s46", "s47", "s48", "s49", "s50"],
  "gradient-meaning": ["s51", "s52", "s53", "s54", "s55", "s56", "s57"],
  relationships: ["s58", "s59", "s60", "s61", "s62", "s63", "s64"],
  "sanity-check": ["s65", "s66", "s67", "s68", "s71"],
  anomalies: ["s69", "s70", "s72"],
});

// PUBLIC — which concept each question tests (spec 012 FR-022). Keyed by concept slug; the values are question
// numbers within this unit ("m" = multiple choice, "s" = short answer). Exactly one concept per question.

import { defineTags } from "../../concept-helpers";
import { U } from "./build";
import { concepts } from "./concepts";

export const conceptOfQuestionId = defineTags(U, concepts, {
  "china-opening-up": ["m01", "m02", "m03", "s05"],
  "china-growth": ["m08", "s02", "s19"],
  "china-development": ["m06", "s04", "s22"],
  "china-targeted-poverty-alleviation": ["m05", "s06"],
  "china-inequality": ["m04", "s01", "s07", "s18"],
  "china-environment": ["m07", "s03", "s08", "s23"],
  "nepal-strategies": ["m09", "m13", "m14", "m15", "s11", "s24"],
  "nepal-growth-trade": ["s10", "s15", "s21"],
  "nepal-flows": ["m16", "s09", "s13", "s20"],
  "nepal-development": ["m11", "m12", "s12", "s17"],
  "nepal-tourism-electricity": ["m10", "s14", "s16"],
});

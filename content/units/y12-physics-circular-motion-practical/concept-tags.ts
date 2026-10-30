import { defineTags } from "../../concept-helpers";

import { concepts } from "./concepts";

// PUBLIC — the concept each question tests (spec 002); "s01" is short answer 1.

export const conceptOfQuestionId = defineTags("y12-physics-circular-motion-practical", concepts, {
  "aim-hypothesis": ["s01", "s21", "s22"],
  apparatus: ["s02", "s30"],
  procedure: ["s03", "s13", "s20"],
  "force-model": ["s04", "s14", "s23", "s29"],
  "centripetal-ideas": ["s05", "s15"],
  "linear-graph": ["s06", "s16", "s24"],
  "data-processing": ["s07", "s17", "s25"],
  "measuring-r": ["s10", "s11"],
  errors: ["s08", "s12", "s18", "s27"],
  recording: ["s09", "s19", "s28"],
  sag: ["s26"],
});

import { defineConcepts } from "../../concept-helpers";

// PUBLIC — the concepts a student can be asked to relearn in this unit (spec 002).
// Ids are `<unit-id>.c-<slug>`, never renamed or reused. Question tags are in ./concept-tags.ts.

export const concepts = defineConcepts("y12-physics-circular-motion-practical", [
  ["aim-hypothesis", "The aim, the hypothesis v² ∝ r, and the independent, dependent and controlled variables"],
  ["apparatus", "What each part of the apparatus does, especially how the paperclip sets and shows the radius"],
  ["procedure", "Running a trial well: steady rotation first, timing 20 revolutions, roles, rehearsal"],
  ["force-model", "Why the string tension equals Mg and provides the centripetal force on the stopper"],
  ["centripetal-ideas", "Constant speed is still acceleration; centripetal force is a role, not an extra force"],
  ["linear-graph", "Why v² against r is a straight line through the origin with gradient Mg/m"],
  ["data-processing", "Turning the time for 20 revolutions into T, v and v²"],
  ["measuring-r", "Measuring r from the top of the tube to the centre of the stopper, with the string taut"],
  ["errors", "Systematic and random errors in this practical: friction, drifting radius, reaction time, miscounts"],
  ["recording", "Recording results: consistent decimal places, uncertainties and percentage uncertainty"],
  ["sag", "Why string sag does not spoil the v² against r result when r is measured along the string"],
]);

/** Questions removed from this unit, with the concept each carried. None so far. */
export const retired: Record<string, string | null> = {};

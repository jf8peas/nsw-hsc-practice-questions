import { defineConcepts } from "../../concept-helpers";

// PUBLIC — the concepts a student can be asked to relearn in this unit (spec 002).
// Ids are `<unit-id>.c-<slug>`, never renamed or reused. Question tags are in ./concept-tags.ts.
//
// The first eleven belong to the unit's first version (s01–s35, now retired); they stay so the
// tombstones below resolve. The last six are the misunderstandings the current questions target.

const U = "y12-physics-task1-exam-practice";

export const concepts = defineConcepts(U, [
  ["data-processing", "Turning times for 20 revolutions into T, v and v², and why 20 revolutions are timed"],
  ["graph-analysis", "The v² against r graph: why it is linear, its gradient with units, and predicting from it"],
  ["model-calcs", "Using gradient = Mg/m to find the stopper mass, the centripetal force or g, with percentage error"],
  ["reliability-validity", "Judging reliability and validity, and handling an anomalous trial"],
  ["errors-improvements", "Random and systematic errors in the practical, their effects, and improvements"],
  ["projectile-calcs", "Projectile calculations: resolving velocity, maximum height, time of flight, range, impact velocity"],
  ["projectile-ideas", "Projectile ideas: independent components, complementary angles, effect of air resistance"],
  ["circular-calcs", "Circular motion calculations: v = 2πr/T, ω, F = mv²/r, a = v²/r"],
  ["circular-ideas", "Circular motion ideas: no work by the centripetal force, tangential motion when released"],
  ["investigation-design", "Designing valid and reliable investigations, with the right graph to analyse the data"],
  ["evaluating-methods", "Evaluating a method or data set for accuracy and reliability, and suggesting improvements"],
  ["error-trace", "Tracing an error: random or systematic, what it changes, which way, and its effect on the result"],
  ["accuracy-reliability-validity", "Accuracy vs reliability vs validity, and why averaging cancels random (not systematic) error"],
  ["gradient-meaning", "Rearranging the model into y = (gradient) × x to see what the gradient stands for"],
  ["relationships", "Increases is not proportional: working out the relationship before choosing the axes"],
  ["sanity-check", "Sanity-checking a result and reading what a percentage error says about its cause"],
  ["anomalies", "Leaving an anomalous trial out of the average, and what including it does to v"],
]);

/** Questions removed from this unit, with the concept each carried. */
export const retired: Record<string, string> = {
  [`${U}.s01`]: `${U}.c-data-processing`,
  [`${U}.s02`]: `${U}.c-reliability-validity`,
  [`${U}.s03`]: `${U}.c-graph-analysis`,
  [`${U}.s04`]: `${U}.c-model-calcs`,
  [`${U}.s05`]: `${U}.c-model-calcs`,
  [`${U}.s06`]: `${U}.c-model-calcs`,
  [`${U}.s07`]: `${U}.c-graph-analysis`,
  [`${U}.s08`]: `${U}.c-graph-analysis`,
  [`${U}.s09`]: `${U}.c-data-processing`,
  [`${U}.s10`]: `${U}.c-reliability-validity`,
  [`${U}.s11`]: `${U}.c-reliability-validity`,
  [`${U}.s12`]: `${U}.c-errors-improvements`,
  [`${U}.s13`]: `${U}.c-errors-improvements`,
  [`${U}.s14`]: `${U}.c-errors-improvements`,
  [`${U}.s15`]: `${U}.c-graph-analysis`,
  [`${U}.s16`]: `${U}.c-investigation-design`,
  [`${U}.s17`]: `${U}.c-projectile-calcs`,
  [`${U}.s18`]: `${U}.c-projectile-calcs`,
  [`${U}.s19`]: `${U}.c-projectile-calcs`,
  [`${U}.s20`]: `${U}.c-projectile-calcs`,
  [`${U}.s21`]: `${U}.c-projectile-ideas`,
  [`${U}.s22`]: `${U}.c-projectile-ideas`,
  [`${U}.s23`]: `${U}.c-projectile-ideas`,
  [`${U}.s24`]: `${U}.c-circular-calcs`,
  [`${U}.s25`]: `${U}.c-circular-calcs`,
  [`${U}.s26`]: `${U}.c-circular-calcs`,
  [`${U}.s27`]: `${U}.c-circular-ideas`,
  [`${U}.s28`]: `${U}.c-circular-ideas`,
  [`${U}.s29`]: `${U}.c-investigation-design`,
  [`${U}.s30`]: `${U}.c-investigation-design`,
  [`${U}.s31`]: `${U}.c-evaluating-methods`,
  [`${U}.s32`]: `${U}.c-evaluating-methods`,
  [`${U}.s33`]: `${U}.c-investigation-design`,
  [`${U}.s34`]: `${U}.c-evaluating-methods`,
  [`${U}.s35`]: `${U}.c-circular-calcs`,
};

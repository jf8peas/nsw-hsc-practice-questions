import { defineConcepts } from "../../concept-helpers";

// PUBLIC — the concepts a student can be asked to relearn in this unit (spec 002).
// Ids are `<unit-id>.c-<slug>`, never renamed or reused. Question tags are in ./concept-tags.ts.

export const concepts = defineConcepts("y12-physics-task1-exam-practice", [
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
]);

/** Questions removed from this unit, with the concept each carried. None so far. */
export const retired: Record<string, string | null> = {};

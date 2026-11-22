// The seven plan-review checks' names, in the order the student sees them (spec 010 FR-013). Public: no prompt text.
// lib/essay/review.json (server-only) carries the same ids and labels for the prompt; tests/essay/review-parse.test.ts
// checks they agree.
export const CHECK_ORDER = ["answers", "scope", "band", "data", "models", "evaluation", "fit"] as const;
export const CHECK_LABEL: Record<(typeof CHECK_ORDER)[number], string> = {
  answers: "Answers the question",
  scope: "Strategies and influences in scope",
  band: "Top-band coverage",
  data: "Data",
  models: "Models",
  evaluation: "Evaluation",
  fit: "Fits 600 to 800 words",
};

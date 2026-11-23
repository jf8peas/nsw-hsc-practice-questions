import "server-only";

import { createHash } from "node:crypto";

/**
 * One line per English essay marking or review outcome (spec 011). The user id is hashed. Only the outcome, the question
 * id, the kind, the duration and the model are logged; never a student's text, a quotation, a reason, feedback, the plan or
 * any key or play material.
 */
export type EnglishEssayOutcome =
  | "graded"
  | "reviewed"
  | "model_fail"
  | "rate_limited"
  | "over_allowance"
  | "already_answered"
  | "marking_in_progress"
  | "answer_rejected"
  | "db_unavailable"
  | "not_locked"
  | "reference_unavailable";

export function logEnglishEssay(input: {
  outcome: EnglishEssayOutcome;
  kind: "grade" | "review";
  userId: string;
  questionId: string;
  durationMs: number;
  model?: string;
}): void {
  const user = createHash("sha256").update(input.userId, "utf8").digest("hex");
  console.info(
    `[english-essay] kind=${input.kind} outcome=${input.outcome} user=${user} question=${input.questionId}` +
      ` duration_ms=${input.durationMs}${input.model ? ` model=${input.model}` : ""}`,
  );
}

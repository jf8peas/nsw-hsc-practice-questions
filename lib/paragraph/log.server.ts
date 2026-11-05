import "server-only";

import { createHash } from "node:crypto";

/**
 * One line per paragraph grading outcome (spec 007 FR-034, as spec 005 FR-044). The user id is
 * hashed. Only the outcome, the question id, the phase and the model are logged; never a
 * student's text, a reason, feedback, the brief or any model part.
 */
export type ParagraphOutcome =
  | "graded"
  | "unparseable"
  | "model_fail"
  | "rate_limited"
  | "over_allowance"
  | "already_answered"
  | "phase_refused"
  | "db_unavailable"
  | "flagged"
  | "flag_repeat";

export function logParagraph(input: {
  outcome: ParagraphOutcome;
  userId: string;
  questionId: string;
  phase?: 1 | 2;
  durationMs: number;
  model?: string;
}): void {
  const user = createHash("sha256").update(input.userId, "utf8").digest("hex");
  console.info(
    `[paragraph] outcome=${input.outcome} user=${user} question=${input.questionId}` +
      `${input.phase ? ` phase=${input.phase}` : ""} duration_ms=${input.durationMs}` +
      `${input.model ? ` model=${input.model}` : ""}`,
  );
}

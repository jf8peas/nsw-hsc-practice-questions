import "server-only";

import { createHash } from "node:crypto";

/**
 * One line per unseen-text outcome (spec 008 FR-033, as spec 005 FR-044 and spec 007). The user id is
 * hashed. Only the outcome, the question id, the phase and the model are logged; never a student's
 * text, a reason, feedback, the biggest gap, the model answer or any key.
 */
export type UnseenOutcome =
  | "graded"
  | "unparseable"
  | "model_fail"
  | "rate_limited"
  | "over_allowance"
  | "already_answered"
  | "phase_refused"
  | "answer_rejected"
  | "db_unavailable"
  | "declined"
  | "invalid_pick"
  | "pick_changed";

export function logUnseen(input: {
  outcome: UnseenOutcome;
  userId: string;
  questionId: string;
  phase?: 1 | 2;
  durationMs: number;
  model?: string;
}): void {
  const user = createHash("sha256").update(input.userId, "utf8").digest("hex");
  console.info(
    `[unseen] outcome=${input.outcome} user=${user} question=${input.questionId}` +
      `${input.phase ? ` phase=${input.phase}` : ""} duration_ms=${input.durationMs}` +
      `${input.model ? ` model=${input.model}` : ""}`,
  );
}

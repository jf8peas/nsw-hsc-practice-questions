import "server-only";

import { createHash } from "node:crypto";

/**
 * One line per rewrite grading outcome (spec 005 FR-044). The user id is hashed (the same
 * minimal-observability pattern as photo answers, spec 004 FR-026). Only the outcome, the
 * question id and the model are logged; never a sentence, a model reply, a definition or a
 * marking note.
 */
export type RewriteOutcome =
  | "graded"
  | "unparseable"
  | "model_fail"
  | "rate_limited"
  | "over_allowance"
  | "already_answered"
  | "phase_refused"
  | "db_unavailable";

export function logRewriteGrade(input: {
  outcome: RewriteOutcome;
  userId: string;
  questionId: string;
  durationMs: number;
  model?: string;
}): void {
  const user = createHash("sha256").update(input.userId, "utf8").digest("hex");
  console.info(
    `[rewrite] outcome=${input.outcome} user=${user} question=${input.questionId} ` +
      `duration_ms=${input.durationMs}${input.model ? ` model=${input.model}` : ""}`,
  );
}

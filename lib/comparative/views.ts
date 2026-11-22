// Builders for what the browser may see of a stored comparative phase row (spec 009, contracts/api.md). Pure: no I/O,
// no key. The model answer and pairing are passed in by the caller (they come from lib/grading.server.ts and only for
// a final row).

import type { UnseenPhaseRow } from "@/lib/db/schema";
import type { ComparativeDiscussion } from "@/lib/comparative/types";
import { gradeResultFrom } from "@/lib/unseen/views";
import type { UnseenGradeResult } from "@/lib/unseen/types";

export type ComparativeGradeResult = Omit<UnseenGradeResult, "type"> & {
  type: "comparative";
  /** The texts the student chose (a choice question), fixed from the first try. */
  pick?: string[];
};

/**
 * The result for a stored comparative row: spec 008's shape with nine verdicts, the discussion (model answer and, for
 * a choice question, its pairing) only on a final row, and the pick on a choice question.
 */
export function comparativeResultFrom(row: UnseenPhaseRow, discussion?: ComparativeDiscussion | null): ComparativeGradeResult {
  const base = gradeResultFrom(row, discussion);
  return { ...base, type: "comparative", ...(row.pickedTextIds ? { pick: row.pickedTextIds } : {}) };
}

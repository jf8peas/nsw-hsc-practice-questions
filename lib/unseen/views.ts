// Builders for what the browser may see of a stored unseen phase row (spec 008, contracts/api.md).
// Pure: no I/O, no key. The model answer is passed in by the caller (it comes from
// lib/grading.server.ts and only for a final row).

import type { SkillVerdicts, UnseenPhaseRow } from "@/lib/db/schema";
import { retryOffered } from "@/lib/unseen/scoring";
import { SKILL_IDS } from "@/lib/unseen/skills";
import type { SkillView, TryView, UnseenDiscussion, UnseenEnding, UnseenGradeResult } from "@/lib/unseen/types";
import { countWords } from "@/lib/wordcount";

export function skillViewsFrom(v: SkillVerdicts): SkillView[] {
  return SKILL_IDS.map((id) => ({ id, met: v[id].met, reason: v[id].reason }));
}

export function tryViewFrom(row: UnseenPhaseRow, which: 1 | 2): TryView | null {
  if (which === 1) {
    return {
      text: row.try1Text,
      mark: row.try1Mark,
      skills: skillViewsFrom(row.try1Verdicts),
      feedback: row.try1Feedback,
      biggestGap: row.try1BiggestGap,
      wordCount: countWords(row.try1Text),
    };
  }
  if (row.try2Text === null || row.try2Mark === null || !row.try2Verdicts) return null;
  return {
    text: row.try2Text,
    mark: row.try2Mark,
    skills: skillViewsFrom(row.try2Verdicts),
    feedback: row.try2Feedback ?? "",
    biggestGap: row.try2BiggestGap ?? "",
    wordCount: countWords(row.try2Text),
  };
}

const base = (row: UnseenPhaseRow) => ({ questionId: row.questionId, type: "unseen" as const, maxMarks: row.maxMarks });

/**
 * The result for a stored row, used for a `409 already_answered` (a double tap or a second device)
 * and by the decline route. `discussion` is only attached to a final row.
 */
export function gradeResultFrom(row: UnseenPhaseRow, discussion?: UnseenDiscussion | null): UnseenGradeResult {
  const t1 = tryViewFrom(row, 1)!;
  if (row.status === "try1") {
    return {
      ...base(row),
      phase: 1,
      marksAwarded: t1.mark,
      skills: t1.skills,
      feedback: t1.feedback,
      biggestGap: t1.biggestGap,
      wordCount: t1.wordCount,
      retryOffered: retryOffered(row.try1Mark, row.maxMarks),
    };
  }
  const ending = row.ending as UnseenEnding;
  const t2 = ending === "retried" ? tryViewFrom(row, 2) : null;
  if (t2) {
    return {
      ...base(row),
      phase: 2,
      marksAwarded: t2.mark,
      recordedMark: row.recordedMark ?? undefined,
      skills: t2.skills,
      feedback: t2.feedback,
      biggestGap: t2.biggestGap,
      wordCount: t2.wordCount,
      ending,
      try1: t1,
      ...(discussion ? { discussion } : {}),
    };
  }
  return {
    ...base(row),
    phase: 1,
    marksAwarded: t1.mark,
    recordedMark: row.recordedMark ?? undefined,
    skills: t1.skills,
    feedback: t1.feedback,
    biggestGap: t1.biggestGap,
    wordCount: t1.wordCount,
    ending,
    ...(ending === "declined" ? { try1: t1 } : {}),
    ...(discussion ? { discussion } : {}),
  };
}

// Builders for what the browser may see of a stored unseen phase row (spec 008, contracts/api.md).
// Pure: no I/O, no key. The model answer is passed in by the caller (it comes from
// lib/grading.server.ts and only for a final row).

import type { AnySkillVerdicts, UnseenPhaseRow } from "@/lib/db/schema";
import { retryOffered, skillsOf } from "@/lib/unseen/scoring";
import type { SkillView, TryView, UnseenDiscussion, UnseenEnding, UnseenGradeResult } from "@/lib/unseen/types";
import { countWords } from "@/lib/wordcount";

/** One view per skill the verdicts cover, in rubric order: seven for a spec 008 row, nine for a comparative one. */
export function skillViewsFrom(v: AnySkillVerdicts): SkillView[] {
  return skillsOf(v).map((id) => {
    const verdict = v[id as keyof AnySkillVerdicts]!;
    return { id, met: verdict.met, reason: verdict.reason };
  });
}

export function tryViewFrom(row: UnseenPhaseRow, which: 1 | 2): TryView | null {
  if (which === 1) {
    return {
      text: row.try1Text,
      mark: row.try1Mark,
      skills: skillViewsFrom(row.try1Verdicts),
      feedback: row.try1Feedback,
      biggestGap: row.try1BiggestGap,
      goFurther: row.try1Mark >= row.maxMarks ? row.try1GoFurther : null,
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
    goFurther: null,
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
      goFurther: t1.goFurther,
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
    goFurther: t1.goFurther,
    wordCount: t1.wordCount,
    ending,
    ...(ending === "declined" ? { try1: t1 } : {}),
    ...(discussion ? { discussion } : {}),
  };
}

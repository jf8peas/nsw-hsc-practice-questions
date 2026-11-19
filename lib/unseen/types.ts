// Shared types for the unseen-text unit (spec 008, contracts/api.md). Type-only: safe in the browser
// bundle. These describe what MAY reach the browser and when (constitution Principle I, 2.15.0):
// nothing from the key before a try is marked; the per-skill verdicts, feedback and biggest gap after
// it; the model answer at the discussion only.

import type { UnseenText } from "@/lib/types";
import type { SkillId } from "@/lib/unseen/skills";

export interface SkillView {
  id: SkillId;
  met: boolean;
  /** The marker's one line; "" when it gave none. */
  reason: string;
}

export interface TryView {
  text: string;
  mark: number;
  /** All seven, in rubric order. */
  skills: SkillView[];
  feedback: string;
  biggestGap: string;
  /** "To go further": only for a first try at full marks, else null. */
  goFurther: string | null;
  wordCount: number;
}

/** Released at the discussion only. */
export interface UnseenDiscussion {
  modelAnswer: string;
  modelWords: number;
}

export type UnseenEnding = "full_marks" | "retried" | "declined" | "no_retry";

export interface UnseenGradeResult {
  questionId: string;
  type: "unseen";
  maxMarks: number;
  phase: 1 | 2;
  /** 0..maxMarks (try 1) or 0..maxMarks-1 (try 2, capped in code). */
  marksAwarded: number;
  /** Present when the question is final. */
  recordedMark?: number;
  skills: SkillView[];
  feedback: string;
  biggestGap: string;
  /** Phase 1 at full marks only. */
  goFurther?: string | null;
  wordCount: number;
  /** Phase 1 only: below full marks and the question is worth more than 1 mark. */
  retryOffered?: boolean;
  /** Present when final. */
  ending?: UnseenEnding;
  /** On phase 2, decline and 409 responses: the first try, so the discussion can label pills. */
  try1?: TryView;
  /** Only when final. */
  discussion?: UnseenDiscussion;
}

/** The marker could not mark, or the student's daily allowance is used up. Never an error. */
export interface NotMarked {
  reason: "marker_unavailable" | "daily_limit";
  phase: 1 | 2;
  /** daily_limit only: the next Sydney midnight, ISO with offset. */
  resetsAt?: string;
}

export type UnseenStage = "write" | "choice" | "retry" | "discussion";

export interface UnseenState {
  stage: UnseenStage;
  /** The public stimulus; an image's src is the authenticated route. */
  text: UnseenText;
  /** Stage write: the saved first draft. */
  draft1?: string;
  /** Stage choice, retry and discussion. */
  try1?: TryView;
  /** Stage discussion after a marked retry. */
  try2?: TryView;
  /** Stage retry: the saved retry draft. */
  draft2?: string;
  /** Stage choice and retry. */
  retryOffered?: boolean;
  /** Present only when the day's allowance is used up. */
  dailyLimit?: { reached: true; resetsAt: string };
  ending?: UnseenEnding;
  recordedMark?: number;
  flagged?: boolean;
  /** Only when stage = "discussion". */
  discussion?: UnseenDiscussion;
}

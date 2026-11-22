// Shared types for the comparative unit (spec 009, contracts/api.md, data-model §7). Type-only: safe in the browser
// bundle. These describe what MAY reach the browser and when (constitution Principle I, 2.16.0): nothing from the
// key before a try is marked; the per-skill verdicts, feedback and biggest gap after it; the model answer and a
// choice question's pairing at the discussion only.

import type { UnseenText } from "@/lib/types";
import type { TryView, UnseenDiscussion, UnseenEnding } from "@/lib/unseen/types";

export type ComparativeStage = "write" | "choice" | "retry" | "discussion";

/** Released at the discussion only. `pairing` (text ids the model answer uses) is present on a choice question only. */
export interface ComparativeDiscussion extends UnseenDiscussion {
  pairing?: string[];
}

export interface ComparativeState {
  stage: ComparativeStage;
  /** Every text the question shows, tab order (public). An image's src is the authenticated route. */
  texts: UnseenText[];
  /** Choice questions: the saved pick (the phase row once the first try is submitted, else the draft row). */
  pick?: string[];
  /** True once the first try is submitted: the pick is fixed. */
  pickLocked: boolean;
  draft1?: string;
  draft2?: string;
  try1?: TryView;
  try2?: TryView;
  retryOffered?: boolean;
  /** Present only when the day's allowance is used up. */
  dailyLimit?: { reached: true; resetsAt: string };
  ending?: UnseenEnding;
  recordedMark?: number;
  repeating?: boolean;
  /** Only when stage = "discussion". */
  discussion?: ComparativeDiscussion;
}

import type { EssayScaffold } from "@/lib/essay/scaffold";
import type { CriterionId, Verdict } from "@/lib/essay/scoring";

// Shapes the essay unit's server routes return and its client components read (spec 010,
// contracts/api.md). No key material: the model essay appears only in EssayResultView, which
// lib/essay/views.ts builds only for the student's own finished attempt.

export const ESSAY_UNIT_ID = "y12-economics-essay-writing";

/** A concept id from a key of lib/essay/concepts.json. */
export const essayConceptId = (key: string): string => `${ESSAY_UNIT_ID}.c-${key}`;

export type EssayStage = "scaffold" | "write" | "result";

/** The public face of an essay question: no key fields. */
export interface PublicEssay {
  id: string;
  prompt: string;
  verb: string;
  verbDefinition: string;
  economy: "china" | "nepal" | "both";
  offer: number;
  source?: string;
}

export interface PlanReviewCheck {
  id: "answers" | "scope" | "band" | "data" | "models" | "evaluation" | "fit";
  status: "strength" | "fix";
  line: string;
}

export interface PlanReview {
  checks: PlanReviewCheck[];
  figureFlags: Array<{ quote: string; why: string }>;
}

export interface EssayResultView {
  questionId: string;
  essay: PublicEssay;
  finalMark: number;
  band: 1 | 2 | 3 | 4 | 5;
  /** True when the one-economy cap lowered the mark. */
  capped: boolean;
  criteria: Record<CriterionId, { verdict: Verdict; reason: string }>;
  bandReason: string;
  lift: string[];
  flags: Array<{ quote: string; why: string }>;
  gaps: Array<{ conceptId: string; term: string; detail: string }>;
  /** The student's own text and plan. */
  essayText: string;
  plan: EssayScaffold;
  words: number;
  /** Present only on the student's own finished result. */
  modelEssay?: string;
}

/** What start and resume return: the stage the attempt is in and what that stage needs. */
export interface EssayState {
  stage: EssayStage;
  essay: PublicEssay;
  scaffold: EssayScaffold;
  locked: boolean;
  review?: PlanReview;
  draft?: string;
  result?: EssayResultView;
  /** Present when the student is at today's marking limit (Submit stays disabled until then). */
  cap?: { resetsAt: string };
}

/** The marker could not mark, or the daily allowance is used up. Never an error; no phase (one try). */
export interface EssayNotMarked {
  reason: "marker_unavailable" | "daily_limit";
  resetsAt?: string;
}

export interface EssayNotReviewed {
  reason: "reviewer_unavailable" | "daily_limit";
  resetsAt?: string;
}

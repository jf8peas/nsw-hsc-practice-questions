// Shapes the English essay unit's server routes return and its client components read (spec 011,
// contracts/api.md, data-model.md). No key material: the model essay appears only in
// EnglishEssayResultView, which lib/english-essay/views.ts builds only for the student's own finished
// attempt. Types only, so the browser may import this file.

import type { EnglishDirective } from "@/lib/types";

export const ENGLISH_ESSAY_UNIT_ID = "y12-english-essay-writing";

/** A concept id from the unit's single concept record (content/units/y12-english-essay-writing/concepts.ts). */
export const englishEssayConceptId = (key: string): string => `${ENGLISH_ESSAY_UNIT_ID}.c-${key}`;

export type EnglishEssayStage = "scaffold" | "write" | "result";

/** The student's plan: a thesis and three optional claim/evidence pairs (data-model §2). Seven strings. */
export interface EnglishEssayScaffold {
  thesis: string;
  body: [
    { claim: string; evidence: string },
    { claim: string; evidence: string },
    { claim: string; evidence: string },
  ];
}

/** The public face of an English essay question: no key fields. */
export interface PublicEnglishEssay {
  type: "englishEssay";
  group: "englishEssay";
  maxMarks: 20;
  live: boolean;
  id: string;
  prompt: string;
  directive: EnglishDirective;
  directiveDefinition: string;
  /** "nesa" for a glossary definition, "unit" for this unit's own guidance wording. */
  directiveGuidance: "nesa" | "unit";
  offer: number;
  source: string;
  /** Public skill-* practice tags only. */
  conceptIds: string[];
}

export const ENGLISH_CRITERIA_IDS = ["argument", "analysis", "knowledge", "expression"] as const;
export type EnglishCriterionId = (typeof ENGLISH_CRITERIA_IDS)[number];
export const ENGLISH_VERDICTS = ["strong", "sound", "developing", "weak"] as const;
export type EnglishVerdict = (typeof ENGLISH_VERDICTS)[number];
export type EnglishCriteria = Record<EnglishCriterionId, { verdict: EnglishVerdict; reason: string }>;

export type EnglishQuestionFocus = "fully" | "partly" | "barely";
export type EnglishBand = 1 | 2 | 3 | 4 | 5;

/** A factual or attribution mistake: the student's exact words and what is wrong. */
export interface EnglishKnowledgeError {
  quote: string;
  why: string;
  source: "marker" | "quote-check";
}

/** One checked quotation (contracts/quote-check.md). `correct` is present for `near` only. */
export interface EnglishQuoteResult {
  quote: string;
  status: "ok" | "near" | "other-source" | "not-found";
  correct?: string;
  ratio?: number;
}

/** The five checks of the optional plan review (S2). */
export interface EnglishPlanReview {
  checks: Array<{
    id: "thesis" | "claims" | "development" | "evidence" | "fit";
    status: "strength" | "fix";
    line: string;
  }>;
}

export interface EnglishEssayResultView {
  questionId: string;
  essay: PublicEnglishEssay;
  finalMark: number;
  finalBand: EnglishBand;
  /** True when a deduction or cap lowered the clamped mark. */
  capped: boolean;
  knowledgeCapApplied: boolean;
  focusCap: 12 | 10 | null;
  criteria: EnglishCriteria;
  bandReason: string;
  lift: string[];
  questionFocus: EnglishQuestionFocus;
  questionFocusReason: string;
  knowledgeErrors: Array<{ quote: string; why: string }>;
  quoteFlags: Array<{ quote: string; status: "near" | "not-found"; correct?: string; ratio?: number }>;
  gaps: Array<{ conceptId: string; term: string; detail: string }>;
  /** The student's own text and plan. */
  essayText: string;
  plan: EnglishEssayScaffold;
  words: number;
  /** Present only on the student's own finished result. */
  modelEssay?: string;
}

/** What start and resume return: the stage the attempt is in and what that stage needs. */
export interface EnglishEssayState {
  stage: EnglishEssayStage;
  essay: PublicEnglishEssay;
  scaffold: EnglishEssayScaffold;
  locked: boolean;
  review?: EnglishPlanReview;
  draft?: string;
  result?: EnglishEssayResultView;
  /** Present when the student is at today's marking limit (Submit stays disabled until then). */
  cap?: { resetsAt: string };
}

/** The marker could not mark, or the daily allowance is used up. Never an error; no phase (one try). */
export interface EnglishEssayNotMarked {
  reason: "marker_unavailable" | "daily_limit" | "reference_text_unavailable";
  resetsAt?: string;
}

export interface EnglishEssayNotReviewed {
  reason: "reviewer_unavailable" | "daily_limit" | "not_live";
  resetsAt?: string;
}

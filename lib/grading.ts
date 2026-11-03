// Shared request/response shapes for POST /api/grade.
// The grading logic itself is server-only (lib/grading.server.ts) because it
// touches the answer key.

export interface GradeRequest {
  attemptId: string;
  /** The server-issued, signed attempt token (carries the question list and MC option order). */
  attemptToken: string;
  questionId: string;
  /**
   * Student's answer. For `mc` this is the DISPLAY index of the chosen option
   * (as shown to the student) as a string; the server maps it to the original
   * option using the attempt's option order.
   */
  answer: string;
}

export interface GradeResult {
  questionId: string;
  type: "mc" | "short" | "rewrite";
  maxMarks: number;
  /** Marks awarded, once known. null while the student still needs to self-mark. */
  marksAwarded: number | null;
  /** MC only: DISPLAY index of the correct option. */
  correctDisplayIndex?: number;
  /**
   * MC only, wrong answers only: why the option the student chose is wrong. Present only
   * for a unit whose explanations are complete. Never stored with the result (spec 002 FR-041).
   */
  optionExplanation?: string;
  /** Short only: revealed after submitting. */
  modelAnswer?: string;
  /** Short only: mark-scheme points. */
  rubric?: string[];
  notes?: string;
  /** Free-text feedback from the LLM grader, addressed to the student. */
  feedback?: string;
  /** Rubric points the LLM judged satisfied / missed. */
  rubricHits?: string[];
  rubricMisses?: string[];
  /** The model that graded this answer, if any. */
  gradedBy?: string;
  /** True when the client must ask the student to self-mark (no LLM result). */
  needsSelfMark: boolean;
}

/** One target term as the browser may see it (spec 005). Never sent before phase 1 is graded. */
export interface RewriteTermView {
  term: string;
  definition: string;
}

/** The hint: only the terms the student missed or misused (FR-015), or none + the lost criterion (FR-045). */
export interface RewriteHint {
  terms: RewriteTermView[];
  /** Present only when `terms` is empty (every term was used, FR-045). */
  lostCriterion?: "a" | "c";
  /** The marker's words for the lost criterion. */
  criterionText?: string;
}

/** The discussion: shown only after the last phase (or on the self-mark screen). */
export interface RewriteDiscussion {
  modelSentences: string[];
  terms: Array<RewriteTermView & { why: string; conceptId: string }>;
}

/** A credited span: the exact words in the student's sentence the grader credited for one term. */
export interface RewriteCreditedSpan {
  conceptId: string; // the target term's concept id
  span: string; // validated: found in the sentence (case-insensitive, whitespace-normalised)
}

/** The optional language note for the final sentence (spec 006 FR-027, FR-034). */
export interface RewriteLanguageNote {
  spelling?: Array<{ wrong: string; fix: string }>; // ≤ 3 pairs, each string ≤ 60 chars
  grammar?: string; // one short note, ≤ 200 chars
}

/** The grade result for a rewrite question (spec 005, extended by spec 006). */
export interface RewriteGradeResult {
  questionId: string;
  type: "rewrite";
  maxMarks: 3;
  phase: 1 | 2;
  /** Marks awarded, once known. null while the student still needs to self-mark. */
  marksAwarded: number | null;
  feedback: string;
  /** Per-term outcomes from phase 1 (drives concept tracking, FR-033). */
  termOutcomes: Array<{ conceptId: string; correct: boolean }>;
  /** Phase 1, marks < 3, not self-marked. */
  hint?: RewriteHint;
  /** Phase 1 at 3/3, or phase 2, or the self-mark screen. */
  discussion?: RewriteDiscussion;
  /**
   * Phase 1 or 2: the credited-and-found spans only (spec 006 FR-031, FR-032). Phase 1 spans
   * appear only with the phase 1 grade; a phase 1 span never names a term the student did not use.
   */
  creditedSpans?: RewriteCreditedSpan[];
  /** Phase 2 only: which terms the retry used correctly. Display only (FR-033). */
  phase2TermOutcomes?: Array<{ conceptId: string; correct: boolean }>;
  /** Final phase only (phase 2, or phase 1 at 3/3): the optional language note (FR-034). */
  languageNote?: RewriteLanguageNote;
  needsSelfMark: boolean;
}

/** Response of POST /api/grade (specs/001-student-saved-scores/contracts/api.md). */
export interface GradeResponse {
  /** A short-answer/MC result, or a rewrite result (spec 005). */
  result: GradeResult | RewriteGradeResult;
  /** True if the result is stored in the database. */
  saved: boolean;
  /** True when the database could not be reached (marked from the attempt token alone). */
  degraded?: boolean;
  /** Decided by the server; null when degraded (the server could not check). */
  attemptCompleted: boolean | null;
  /** Present when saved is false: re-send to POST /api/results/retry. */
  receipt?: string;
  /** Present when needsSelfMark: send to POST /api/results/self-mark. */
  selfMarkToken?: string;
  /** Short answer could not be AI-marked because the database is unavailable. */
  aiUnavailable?: boolean;
  /** Short answer could not be AI-marked because today's allowance is used up. */
  aiLimit?: { reached: true; resetsAt: string };
}

/** Body of a `409 already_answered` response: the mark that is already stored. */
export interface AlreadyAnswered {
  error: "already_answered";
  result: Pick<
    GradeResult,
    | "questionId"
    | "type"
    | "maxMarks"
    | "marksAwarded"
    | "feedback"
    | "rubricHits"
    | "rubricMisses"
    | "optionExplanation"
  > & { needsSelfMark: false };
}

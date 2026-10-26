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
  type: "mc" | "short";
  maxMarks: number;
  /** Marks awarded, once known. null while the student still needs to self-mark. */
  marksAwarded: number | null;
  /** MC only: DISPLAY index of the correct option. */
  correctDisplayIndex?: number;
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

/** Response of POST /api/grade (specs/001-student-saved-scores/contracts/api.md). */
export interface GradeResponse {
  result: GradeResult;
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
    "questionId" | "type" | "maxMarks" | "marksAwarded" | "feedback" | "rubricHits" | "rubricMisses"
  > & { needsSelfMark: false };
}

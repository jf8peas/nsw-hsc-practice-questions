// Shared request/response shapes for POST /api/grade.
// The grading logic itself is server-only (lib/grading.server.ts) because it
// touches the answer key.

export interface GradeRequest {
  questionId: string;
  /** Student's answer. For `mc` this is the selected option index as a string. */
  answer: string;
}

export interface GradeResult {
  questionId: string;
  type: "mc" | "short";
  maxMarks: number;
  /** Marks awarded, once known. null while the student still needs to self-mark. */
  marksAwarded: number | null;
  /** MC only: index of the correct option. */
  correctIndex?: number;
  /** Short only: revealed after submitting. */
  modelAnswer?: string;
  /** Short only: mark-scheme points. */
  rubric?: string[];
  notes?: string;
  /** Free-text feedback (LLM, step 3). Empty for now. */
  feedback?: string;
  /** True when the client must ask the student to self-mark (no LLM result). */
  needsSelfMark: boolean;
}

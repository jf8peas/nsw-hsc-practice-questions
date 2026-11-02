import "server-only";

import { getQuestion, getUnit } from "@/content";
import { getAnswer } from "@/content/answers";
import type { ReviewMaterial } from "@/lib/concepts/port";
import type { GradeResult, RewriteDiscussion, RewriteGradeResult, RewriteHint } from "@/lib/grading";
import { gradeRewrite, gradeShortAnswer } from "@/lib/openrouter.server";
import type { Answer } from "@/lib/types";
import { countWords } from "@/lib/wordcount";

export interface GradeOptions {
  /** MC only: optionOrder[displayIndex] = original option index (from the attempt). */
  optionOrder?: number[];
  /** Do not call the LLM (the database is unavailable, so the daily cap cannot be reserved). */
  skipLlm?: boolean;
  /** The answer was handwritten and transcribed from photos: credit working and method, ignore crossed-out work. */
  handwritten?: boolean;
}

/**
 * Answer-key material for the questions tagged with a concept: their public prompts plus the
 * model answers, rubric points and correct options. For the concept REVIEWER only (spec 002
 * FR-024): the caller passes it to a model and discards it. It must never be stored, logged
 * or returned to a client (constitution Principle I). Together with `getOptionExplanation`,
 * this is the only route by which concept code reads `content/answers`.
 */
export function getReviewMaterial(unitId: string, conceptId: string): ReviewMaterial | null {
  const unit = getUnit(unitId);
  if (!unit) return null;
  return {
    questions: unit.questions
      .filter((q) => q.concept === conceptId)
      .map((q) => {
        const key = getAnswer(q.id);
        const correctText =
          q.type === "mc"
            ? (key?.correctText ?? (typeof key?.correctIndex === "number" ? q.options[key.correctIndex] : undefined))
            : undefined;
        return {
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          modelAnswer: key?.modelAnswer,
          rubric: key?.rubric ?? [],
          correctText,
        };
      }),
  };
}

/**
 * Answer-key material for the self-mark screen when a photo read fails (spec 004 FR-019):
 * the model answer, rubric and max marks, so the student can mark their photo answer
 * themselves. This is the same material the grade route returns for self-marking today.
 * Lives here (not in the transcribe route) so the answer key is only ever read through
 * this module (spec 002 FR-043).
 */
export function getSelfMarkMaterial(questionId: string): {
  modelAnswer?: string;
  rubric: string[];
  maxMarks?: number;
} {
  const found = getQuestion(questionId);
  const key = getAnswer(questionId);
  return {
    modelAnswer: key?.modelAnswer,
    rubric: key?.rubric ?? [],
    maxMarks: found?.question.maxMarks,
  };
}

/**
 * Why a wrong multiple-choice option is wrong (spec 002 FR-039 to FR-043), or undefined when
 * there is nothing to show: not an MC question, the unit's explanations are not complete, the
 * chosen option is the correct one, or that option has no written explanation. The explanation
 * is keyed by option text (options are shuffled per attempt) and is read from the key at the
 * time of asking, so an old attempt shows the current wording.
 */
export function getOptionExplanation(questionId: string, chosenOptionText: string): string | undefined {
  const found = getQuestion(questionId);
  if (!found || found.question.type !== "mc" || !found.unit.explanationsComplete) return undefined;
  const key = getAnswer(questionId);
  if (!key) return undefined;
  const q = found.question;
  const correctText =
    key.correctText ?? (typeof key.correctIndex === "number" ? q.options[key.correctIndex] : undefined);
  if (chosenOptionText === correctText) return undefined;
  return key.wrongExplanations?.[chosenOptionText];
}

export interface Graded {
  result: GradeResult;
  /** What to store as the answer: the chosen option's text for MC, the student's text for short. */
  answerText: string;
  /** How it was marked, as stored. Meaningless while the result still needs a self-mark. */
  gradedBy: "auto" | "llm";
}

/**
 * Grade one answer. Runs only on the server so the answer key never reaches
 * the browser.
 *
 * MC is marked here directly: `answer` is the DISPLAY index, mapped to the
 * original option through the attempt's option order. Short answers go to the
 * LLM grader (OpenRouter) when it is configured; otherwise the client falls
 * back to student self-marking against the model answer.
 */
export async function gradeAnswer(
  questionId: string,
  answer: string,
  options: GradeOptions = {},
): Promise<Graded | null> {
  const found = getQuestion(questionId);
  const key = getAnswer(questionId);
  if (!found || !key) return null;

  const { question } = found;

  if (question.type === "mc") {
    const count = question.options.length;
    const order = options.optionOrder ?? question.options.map((_, i) => i);
    const displayIndex = Number.parseInt(answer, 10);
    const original = order[displayIndex];
    if (
      !Number.isInteger(displayIndex) ||
      original === undefined ||
      original < 0 ||
      original >= count
    ) {
      throw new RangeError("invalid option index");
    }
    const correctIndex =
      key.correctText !== undefined
        ? question.options.indexOf(key.correctText)
        : (key.correctIndex ?? -1);
    const correct = original === correctIndex && correctIndex >= 0;
    const optionExplanation = correct ? undefined : getOptionExplanation(questionId, question.options[original]);
    return {
      result: {
        questionId,
        type: "mc",
        maxMarks: question.maxMarks,
        marksAwarded: correct ? question.maxMarks : 0,
        correctDisplayIndex: correctIndex >= 0 ? order.indexOf(correctIndex) : undefined,
        rubric: key.rubric,
        ...(optionExplanation ? { optionExplanation } : {}),
        needsSelfMark: false,
      },
      answerText: question.options[original],
      gradedBy: "auto",
    };
  }

  // short answer
  const base = {
    questionId,
    type: "short" as const,
    maxMarks: question.maxMarks,
    modelAnswer: key.modelAnswer,
    rubric: key.rubric,
    notes: key.notes,
  };

  if (!answer.trim()) {
    return {
      result: { ...base, marksAwarded: 0, feedback: "No answer was submitted.", needsSelfMark: false },
      answerText: answer,
      gradedBy: "auto",
    };
  }

  if (options.skipLlm) {
    return {
      result: { ...base, marksAwarded: null, feedback: "", needsSelfMark: true },
      answerText: answer,
      gradedBy: "llm",
    };
  }

  const llm = await gradeShortAnswer({
    formula: question.formula,
    prompt: question.prompt,
    modelAnswer: key.modelAnswer ?? "",
    rubric: key.rubric,
    maxMarks: question.maxMarks,
    answer,
    markingGuidance: key.notes,
    handwritten: options.handwritten,
  });

  if (llm) {
    return {
      result: {
        ...base,
        marksAwarded: llm.marksAwarded,
        feedback: llm.feedback,
        rubricHits: llm.rubricHits,
        rubricMisses: llm.rubricMisses,
        gradedBy: llm.gradedBy,
        needsSelfMark: false,
      },
      answerText: answer,
      gradedBy: "llm",
    };
  }

  // No LLM (not configured, or the call failed twice) — student self-marks.
  return {
    result: { ...base, marksAwarded: null, feedback: "", needsSelfMark: true },
    answerText: answer,
    gradedBy: "llm",
  };
}

// ---- rewrite grading (spec 005) ----------------------------------------------

export const REWRITE_WORD_LIMIT = 25;

export interface RewriteGraded {
  result: RewriteGradeResult;
  /** What to store as the answer: the final sentence. */
  answerText: string;
  gradedBy: "auto" | "llm";
}

/**
 * The discussion material (FR-018): the model sentences and every target term with its
 * definition and why it fits this sentence. Read from the key at grade time; never stored.
 */
/** The target-term concept ids of a rewrite question (for the self-mark token, FR-046). */
export function rewriteTermConceptIds(questionId: string): string[] {
  const key = getAnswer(questionId);
  return key?.targetTerms?.map((t) => t.conceptId) ?? [];
}

/** The discussion material for a rewrite question, or undefined if it is not one / has no key. */
export function rewriteDiscussionOrNull(questionId: string): RewriteDiscussion | undefined {
  const key = getAnswer(questionId);
  return key ? buildRewriteDiscussion(key) : undefined;
}

export function buildRewriteDiscussion(key: Answer): RewriteDiscussion {
  return {
    modelSentences: key.modelSentences ?? [],
    terms: (key.targetTerms ?? []).map((t) => ({
      term: t.term,
      definition: t.definition,
      why: t.why,
    })),
  };
}

/**
 * Grade one rewrite answer (spec 005). The model returns only the judgements code cannot
 * compute (criterion A, padding, per-term status, feedback); code computes the word count,
 * criterion C, the all-or-nothing criterion B, the marks, the phase 2 cap and the hint.
 */
export async function gradeRewriteAnswer(
  questionId: string,
  answer: string,
  phase: 1 | 2,
  options: { skipLlm?: boolean } = {},
): Promise<RewriteGraded | null> {
  const found = getQuestion(questionId);
  const key = getAnswer(questionId);
  if (!found || !key || found.question.type !== "rewrite" || !key.targetTerms) return null;
  const { question } = found;

  const wordCount = countWords(answer);
  const base = {
    questionId,
    type: "rewrite" as const,
    maxMarks: 3 as const,
    phase,
    feedback: "",
    termOutcomes: key.targetTerms.map((t) => ({ conceptId: t.conceptId, correct: false })),
    needsSelfMark: false,
  };

  if (!answer.trim()) {
    return {
      result: { ...base, marksAwarded: 0, feedback: "No answer was submitted." },
      answerText: answer,
      gradedBy: "auto",
    };
  }

  if (options.skipLlm) {
    return {
      result: { ...base, marksAwarded: null, feedback: "", needsSelfMark: true },
      answerText: answer,
      gradedBy: "llm",
    };
  }

  const llm = await gradeRewrite({
    prompt: question.prompt,
    targetTerms: key.targetTerms.map((t) => ({
      term: t.term,
      definition: t.definition,
      equivalents: t.equivalents,
      misuses: t.misuses,
    })),
    answer,
  });

  if (!llm) {
    return {
      result: { ...base, marksAwarded: null, feedback: "", needsSelfMark: true },
      answerText: answer,
      gradedBy: "llm",
    };
  }

  // code computes the criteria and marks (research R4)
  const criterionA = llm.criterionA;
  const criterionC = wordCount <= REWRITE_WORD_LIMIT && !llm.padding;
  const byTerm = new Map(llm.terms.map((t) => [t.term, t.status]));
  const criterionB = key.targetTerms.every((t) => byTerm.get(t.term) === "used");
  const marks = (criterionA ? 1 : 0) + (criterionB ? 1 : 0) + (criterionC ? 1 : 0);
  const capped = phase === 2 ? Math.min(marks, 2) : marks;

  const result: RewriteGradeResult = {
    ...base,
    marksAwarded: capped,
    feedback: llm.feedback,
    termOutcomes: key.targetTerms.map((t) => ({
      conceptId: t.conceptId,
      correct: byTerm.get(t.term) === "used",
    })),
  };

  if (phase === 1 && capped < 3) {
    const missed = key.targetTerms.filter((t) => byTerm.get(t.term) !== "used");
    if (missed.length > 0) {
      result.hint = { terms: missed.map((t) => ({ term: t.term, definition: t.definition })) };
    } else {
      // every term used but (a) or (c) lost (FR-045)
      result.hint = {
        terms: [],
        lostCriterion: criterionA ? "c" : "a",
        criterionText: criterionA
          ? "Cut your sentence to 25 words or fewer."
          : "Keep the meaning and the cause and effect of the original sentence.",
      };
    }
  }

  if (phase === 2 || (phase === 1 && capped === 3)) {
    result.discussion = buildRewriteDiscussion(key);
  }

  return { result, answerText: answer, gradedBy: "llm" };
}

/**
 * The rewrite state a resume may see (spec 005 FR-021, FR-023): built server-side from a phase
 * row and the answer key, so the browser only ever gets what that stage allows — nothing from
 * the key before a phase 1 grade, the hint at a phase 1 under 3, the discussion once final.
 * This is the ONLY route by which the quiz page reads the answer key.
 */
export function rewriteResumeState(
  questionId: string,
  phaseRow: {
    status: "phase1" | "phase2" | "final";
    phase1Answer: string;
    phase1Marks: number;
    phase1Feedback: string | null;
    phase1TermOutcomes: Array<{ conceptId: string; correct: boolean }> | null;
    phase2Answer: string | null;
    phase2Marks: number | null;
    phase2Feedback: string | null;
    recordedMark: number | null;
  },
): {
  phase: "phase1" | "phase2" | "final";
  phase1Answer: string;
  phase1Marks?: number;
  phase1Feedback?: string;
  phase2Answer?: string;
  phase2Marks?: number;
  phase2Feedback?: string;
  marks?: number;
  hint?: RewriteHint;
  discussion?: RewriteDiscussion;
} {
  const key = getAnswer(questionId);
  const state: ReturnType<typeof rewriteResumeState> = {
    phase: phaseRow.status,
    phase1Answer: phaseRow.phase1Answer,
    phase1Marks: phaseRow.phase1Marks,
    ...(phaseRow.phase1Feedback ? { phase1Feedback: phaseRow.phase1Feedback } : {}),
    ...(phaseRow.phase2Answer ? { phase2Answer: phaseRow.phase2Answer } : {}),
    ...(phaseRow.phase2Marks !== null && phaseRow.phase2Marks !== undefined ? { phase2Marks: phaseRow.phase2Marks } : {}),
    ...(phaseRow.phase2Feedback ? { phase2Feedback: phaseRow.phase2Feedback } : {}),
    ...(phaseRow.recordedMark !== null ? { marks: phaseRow.recordedMark } : { marks: phaseRow.phase1Marks }),
  };
  if (phaseRow.status === "phase1" && phaseRow.phase1Marks < 3 && key?.targetTerms) {
    const outcomes = new Map((phaseRow.phase1TermOutcomes ?? []).map((o) => [o.conceptId, o.correct]));
    const missed = key.targetTerms.filter((t) => outcomes.get(t.conceptId) === false);
    if (missed.length > 0) {
      state.hint = { terms: missed.map((t) => ({ term: t.term, definition: t.definition })) };
    } else {
      const over = countWords(phaseRow.phase1Answer) > REWRITE_WORD_LIMIT;
      state.hint = {
        terms: [],
        lostCriterion: over ? "c" : "a",
        criterionText: over
          ? "Cut your sentence to 25 words or fewer."
          : "Keep the meaning and the cause and effect of the original sentence.",
      };
    }
  }
  if (phaseRow.status === "final" && key) state.discussion = buildRewriteDiscussion(key);
  return state;
}

import "server-only";

import { getQuestion, getUnit } from "@/content";
import { getAnswer } from "@/content/answers";
import type { ReviewMaterial } from "@/lib/concepts/port";
import type { GradeResult } from "@/lib/grading";
import { gradeShortAnswer } from "@/lib/openrouter.server";

export interface GradeOptions {
  /** MC only: optionOrder[displayIndex] = original option index (from the attempt). */
  optionOrder?: number[];
  /** Do not call the LLM (the database is unavailable, so the daily cap cannot be reserved). */
  skipLlm?: boolean;
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

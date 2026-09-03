import "server-only";

import { getQuestion } from "@/content";
import { getAnswer } from "@/content/answers";
import type { GradeResult } from "@/lib/grading";
import { gradeShortAnswer } from "@/lib/openrouter.server";

/**
 * Grade one answer. Runs only on the server so the answer key never reaches
 * the browser.
 *
 * MC is marked here directly. Short answers go to the LLM grader (OpenRouter)
 * when it is configured; otherwise the client falls back to student
 * self-marking against the model answer.
 */
export async function gradeAnswer(
  questionId: string,
  answer: string,
): Promise<GradeResult | null> {
  const found = getQuestion(questionId);
  const key = getAnswer(questionId);
  if (!found || !key) return null;

  const { question } = found;

  if (question.type === "mc") {
    const correctIndex =
      key.correctText !== undefined
        ? question.options.indexOf(key.correctText)
        : (key.correctIndex ?? -1);
    const picked = Number.parseInt(answer, 10);
    const correct = picked === correctIndex && correctIndex >= 0;
    return {
      questionId,
      type: "mc",
      maxMarks: question.maxMarks,
      marksAwarded: correct ? question.maxMarks : 0,
      correctIndex,
      rubric: key.rubric,
      needsSelfMark: false,
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
      ...base,
      marksAwarded: 0,
      feedback: "No answer was submitted.",
      needsSelfMark: false,
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
      ...base,
      marksAwarded: llm.marksAwarded,
      feedback: llm.feedback,
      rubricHits: llm.rubricHits,
      rubricMisses: llm.rubricMisses,
      gradedBy: llm.gradedBy,
      needsSelfMark: false,
    };
  }

  // No LLM (not configured, or the call failed twice) — student self-marks.
  return { ...base, marksAwarded: null, feedback: "", needsSelfMark: true };
}

import "server-only";

import { getQuestion } from "@/content";
import { getAnswer } from "@/content/answers";
import type { GradeResult } from "@/lib/grading";

/**
 * Grade one answer. Runs only on the server so the answer key never reaches
 * the browser.
 *
 * Step 1 (now): MC is marked here; short answers reveal the model answer and
 *   rubric and the student self-marks.
 * Step 3 (later): short answers are sent to an LLM via OpenRouter, which fills
 *   in `marksAwarded` + `feedback` and sets `needsSelfMark: false`.
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
  return {
    questionId,
    type: "short",
    maxMarks: question.maxMarks,
    marksAwarded: null,
    modelAnswer: key.modelAnswer,
    rubric: key.rubric,
    notes: key.notes,
    feedback: "",
    needsSelfMark: true,
  };
}

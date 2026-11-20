import "server-only";

import { and, eq, sql } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import { attempts } from "@/lib/db/schema";
import { getLatestIncompleteAttempt } from "@/lib/db/queries/attempts.server";
import { listUnitResultsForProgress } from "@/lib/db/queries/results.server";
import type { TextForm, Unit } from "@/lib/types";
import { isRepeating, latestShares, unseenQuestions } from "@/lib/unseen/draw";
import { paperLabel } from "@/lib/unseen/source";

// What the unit page of the unseen-text unit needs (spec 008 FR-029, research R13): how many of the
// bank's questions the student has answered, whether every question is answered (so questions repeat), and the unfinished question
// the next quiz will offer first. Derived from results and the open attempt; nothing is stored.

export interface FormResult {
  form: TextForm;
  total: number;
  answered: number;
  /** Mean of marks / maxMarks over the answered questions in this form, 0..1; null when none. */
  average: number | null;
}

export interface UnseenProgress {
  total: number;
  answered: number;
  /** Every question has a recorded mark: the draw now repeats over the whole bank. */
  repeating: boolean;
  pending: { questionId: string; heading: string; label: string } | null;
  byForm: FormResult[];
}

export async function loadUnseenProgress(db: Db, userId: string, unit: Unit): Promise<UnseenProgress> {
  const questions = unseenQuestions(unit);
  const results = await listUnitResultsForProgress(db, userId, unit.id);
  const markOf = latestShares(results); // each question's LATEST recorded mark, so improvement shows
  const answered = questions.filter((q) => markOf.has(q.id));

  const textOf = (id: string) => unit.texts?.find((t) => t.id === id);
  const formOf = (textId: string): TextForm | null => textOf(textId)?.form ?? null;
  const forms = [...new Set(questions.map((q) => formOf(q.textId)).filter((f): f is TextForm => f !== null))];
  const byForm: FormResult[] = forms.map((form) => {
    const inForm = questions.filter((q) => formOf(q.textId) === form);
    const done = inForm.filter((q) => markOf.has(q.id));
    return {
      form,
      total: inForm.length,
      answered: done.length,
      average: done.length ? done.reduce((s, q) => s + (markOf.get(q.id) ?? 0), 0) / done.length : null,
    };
  });

  const open = await getLatestIncompleteAttempt(db, userId, unit.id);
  const pendingQuestion = open ? questions.find((q) => q.id === open.questionIds[0]) : undefined;
  return {
    total: questions.length,
    answered: answered.length,
    repeating: isRepeating(questions, new Set(answered.map((q) => q.id))),
    pending: pendingQuestion
      ? { questionId: pendingQuestion.id, heading: textOf(pendingQuestion.textId)?.heading ?? "", label: paperLabel(pendingQuestion.paper) }
      : null,
    byForm,
  };
}

/**
 * Whether this student has an attempt, finished or not, on a question that uses this text. The text's own
 * page (spec 008 FR-006, research R12) shows a text only to a student who has started it, so a text id can
 * neither be probed nor read ahead of its question.
 */
export async function hasStartedText(db: Db, userId: string, unit: Unit, textId: string): Promise<boolean> {
  const ids = unseenQuestions(unit).filter((q) => q.textId === textId).map((q) => q.id);
  if (ids.length === 0) return false;
  const rows = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.unitId, unit.id), sql`${attempts.questionIds} && ARRAY[${sql.join(ids.map((i) => sql`${i}`), sql`, `)}]::text[]`))
    .limit(1);
  return rows.length > 0;
}

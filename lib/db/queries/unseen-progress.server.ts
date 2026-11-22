import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { UNITS } from "@/content";

import type { Db } from "@/lib/db/index.server";
import { attempts } from "@/lib/db/schema";
import { getLatestIncompleteAttempt } from "@/lib/db/queries/attempts.server";
import { listUnitResultsForProgress } from "@/lib/db/queries/results.server";
import type { ComparativeQuestion, TextForm, Unit } from "@/lib/types";
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

/** One row of the comparative unit's results: a question type (spec 009 FR-024a). */
export interface KindResult {
  kind: "fixed" | "choice";
  total: number;
  answered: number;
  /** Mean of marks / maxMarks over the answered questions of this type, 0..1; null when none. */
  average: number | null;
}

export interface ComparativeProgress {
  total: number;
  answered: number;
  /** Every question has a recorded mark: the draw now repeats over the whole bank. */
  repeating: boolean;
  pending: { questionId: string; heading: string; label: string } | null;
  byKind: KindResult[];
}

/**
 * What the comparative unit's page needs (spec 009 FR-024a, research R9): how many of the bank's questions the student has
 * answered, whether every question is answered (so questions repeat), the unfinished question the next quiz will offer first,
 * and the results by question type, fixed pair and choice, each with answered of total and the average of the latest recorded
 * marks as a share of full marks. Never by text form. Derived from results and the open attempt; nothing is stored.
 */
export async function loadComparativeProgress(db: Db, userId: string, unit: Unit): Promise<ComparativeProgress> {
  const questions = unit.questions.filter((q): q is ComparativeQuestion => q.type === "comparative");
  const results = await listUnitResultsForProgress(db, userId, unit.id);
  const markOf = latestShares(results); // each question's LATEST recorded mark, so improvement shows
  const answered = questions.filter((q) => markOf.has(q.id));
  const byKind: KindResult[] = (["fixed", "choice"] as const)
    .map((kind) => {
      const ofKind = questions.filter((q) => (q.choice === null ? "fixed" : "choice") === kind);
      const done = ofKind.filter((q) => markOf.has(q.id));
      return {
        kind,
        total: ofKind.length,
        answered: done.length,
        average: done.length ? done.reduce((s, q) => s + (markOf.get(q.id) ?? 0), 0) / done.length : null,
      };
    })
    .filter((r) => r.total > 0);
  const open = await getLatestIncompleteAttempt(db, userId, unit.id);
  const pendingQuestion = open ? questions.find((q) => q.id === open.questionIds[0]) : undefined;
  return {
    total: questions.length,
    answered: answered.length,
    repeating: isRepeating(questions, new Set(answered.map((q) => q.id))),
    pending: pendingQuestion
      ? {
          questionId: pendingQuestion.id,
          heading: pendingQuestion.choice === null ? "Compare two texts" : "Compare, with a choice of texts",
          label: paperLabel(pendingQuestion.paper),
        }
      : null,
    byKind,
  };
}

/**
 * The units that show a text and the ids of their questions that show it (spec 009 research R3). A text is stored once
 * and shared: spec 008's questions show one text (`textId`), the comparative unit's show every text of the pair or of
 * the choice, picked or not (`textIds`). A unit counts when its `texts` hold the text.
 */
export function questionsShowingText(units: readonly Unit[], textId: string): Array<{ unitId: string; questionIds: string[] }> {
  const out: Array<{ unitId: string; questionIds: string[] }> = [];
  for (const unit of units) {
    if (!unit.texts?.some((t) => t.id === textId)) continue;
    const questionIds = unit.questions
      .filter((q) => (q.type === "unseen" && q.textId === textId) || (q.type === "comparative" && q.textIds.includes(textId)))
      .map((q) => q.id);
    if (questionIds.length > 0) out.push({ unitId: unit.id, questionIds });
  }
  return out;
}

const overlap = (ids: string[]) => sql`${attempts.questionIds} && ARRAY[${sql.join(ids.map((i) => sql`${i}`), sql`, `)}]::text[]`;

/**
 * Whether this student has an attempt, finished or not, in ANY unit on a question that shows this text. The text's own
 * page (spec 008 FR-006, spec 009 FR-006, research R3) shows a text only to a student who has started it, so a text id
 * can neither be probed nor read ahead of its question; an attempt in either Advanced English unit counts, and a
 * comparative question counts every text it shows, picked or not.
 */
export async function hasStartedText(db: Db, userId: string, textId: string, units: readonly Unit[] = UNITS): Promise<boolean> {
  const showing = questionsShowingText(units, textId);
  if (showing.length === 0) return false;
  const rows = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), inArray(attempts.unitId, showing.map((u) => u.unitId)), overlap(showing.flatMap((u) => u.questionIds))))
    .limit(1);
  return rows.length > 0;
}

/**
 * Whether this attempt belongs to this student and holds a question that shows this text, in any unit. The text-only tab
 * takes the attempt id from its link to keep highlights per attempt (spec 008 FR-006a); a link that does not match turns
 * highlighting off for that tab and nothing else.
 */
export async function attemptUsesText(db: Db, userId: string, attemptId: string, textId: string, units: readonly Unit[] = UNITS): Promise<boolean> {
  const showing = questionsShowingText(units, textId);
  if (showing.length === 0) return false;
  const rows = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId), inArray(attempts.unitId, showing.map((u) => u.unitId)), overlap(showing.flatMap((u) => u.questionIds))))
    .limit(1);
  return rows.length > 0;
}

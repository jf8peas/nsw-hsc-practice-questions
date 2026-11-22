import "server-only";

import { getQuestion } from "@/content";
import type { Db } from "@/lib/db/index.server";
import { hasEarlierResult } from "@/lib/db/queries/results.server";
import { getRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import { getUnseenPhase } from "@/lib/db/queries/unseen-phases.server";
import type { Attempt, RewriteDraftRow, UnseenPhaseRow } from "@/lib/db/schema";
import { comparativeDiscussion } from "@/lib/grading.server";
import { isCompletePick, tabOrder } from "@/lib/comparative/pick";
import type { ComparativeState } from "@/lib/comparative/types";
import { retryOffered } from "@/lib/unseen/scoring";
import { dailyLimitFor, type DailyLimit } from "@/lib/unseen/state.server";
import type { UnseenEnding } from "@/lib/unseen/types";
import { tryViewFrom } from "@/lib/unseen/views";

// Builds what the quiz may show for a comparative attempt (spec 009, data-model §7), for the attempt-start response
// and the resume page. The stage decides what is released (Principle I): the public texts at every stage; the try-1
// verdicts once it is marked; the model answer and pairing only for a FINAL row. The pick comes from the phase row
// once the first try is submitted and from the draft row before. There is no marking stage: marking is never restored.

/** Pure: the state for one question from its phase row and draft row (either may be absent). */
export function comparativeStateFrom(
  questionId: string,
  row: UnseenPhaseRow | null,
  draft: Pick<RewriteDraftRow, "phase1Draft" | "phase2Draft" | "pickedTextIds"> | null,
  dailyLimit: DailyLimit | null,
  repeating = false,
): ComparativeState | null {
  const found = getQuestion(questionId);
  if (!found || found.question.type !== "comparative") return null;
  const question = found.question;
  const texts = [];
  for (const id of question.textIds) {
    const text = found.unit.texts?.find((t) => t.id === id);
    if (!text) return null;
    texts.push(text);
  }
  // a saved pick is returned only if it is still a complete, allowed pick (a retired text means choosing again)
  const saved = row?.pickedTextIds ?? draft?.pickedTextIds ?? undefined;
  const pick = question.choice && saved && isCompletePick(question.choice, saved) ? tabOrder(question, saved) : undefined;
  const common = { texts, pickLocked: row !== null, ...(pick ? { pick } : {}), ...(repeating ? { repeating: true as const } : {}) };
  const limit = dailyLimit ? { dailyLimit } : {}; // a finished question has no daily-limit notice

  if (!row) {
    return { stage: "write", ...common, ...limit, ...(draft?.phase1Draft ? { draft1: draft.phase1Draft } : {}) };
  }
  const try1 = tryViewFrom(row, 1)!;
  if (row.status === "try1") {
    return {
      stage: draft?.phase2Draft ? "retry" : "choice",
      ...common,
      ...limit,
      try1,
      retryOffered: retryOffered(row.try1Mark, row.maxMarks),
      ...(draft?.phase2Draft ? { draft2: draft.phase2Draft } : {}),
    };
  }
  const discussion = comparativeDiscussion(questionId);
  const try2 = tryViewFrom(row, 2);
  return {
    stage: "discussion",
    ...common,
    try1,
    ...(try2 ? { try2 } : {}),
    ending: row.ending as UnseenEnding,
    recordedMark: row.recordedMark ?? row.try1Mark,
    ...(discussion ? { discussion } : {}),
  };
}

/** Reads the rows (scoped to the session user) and builds the state for an attempt's one question. */
export async function loadComparativeState(db: Db, userId: string, attempt: Attempt): Promise<ComparativeState | null> {
  const questionId = attempt.questionIds[0];
  if (!questionId) return null;
  const [row, draft, limit, repeating] = await Promise.all([
    getUnseenPhase(db, userId, attempt.id, questionId),
    getRewriteDraft(db, userId, attempt.id, questionId),
    dailyLimitFor(db, userId),
    hasEarlierResult(db, userId, questionId, attempt.id),
  ]);
  return comparativeStateFrom(questionId, row, draft, row?.status === "final" ? null : limit, repeating);
}

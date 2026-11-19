import "server-only";

import { getQuestion } from "@/content";
import { getConfig } from "@/lib/config.server";
import type { Db } from "@/lib/db/index.server";
import { hasEarlierResult } from "@/lib/db/queries/results.server";
import { getUnseenPhase } from "@/lib/db/queries/unseen-phases.server";
import { getRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import type { Attempt, RewriteDraftRow, UnseenPhaseRow } from "@/lib/db/schema";
import { unseenDiscussion } from "@/lib/grading.server";
import { nextSydneyMidnight, toSydneyIso } from "@/lib/sydney";
import { retryOffered } from "@/lib/unseen/scoring";
import type { UnseenEnding, UnseenState } from "@/lib/unseen/types";
import { tryViewFrom } from "@/lib/unseen/views";
import { aiUsedToday } from "@/lib/usage.server";

// Builds what the quiz may show for an unseen-text attempt (spec 008, data-model.md §4.1), for the
// attempt-start response and the resume page. The stage decides what is released (Principle I): the
// public text at every stage; the try-1 verdicts once it is marked; the model answer only for a FINAL
// row. There is no marking stage: marking is never restored.

export interface DailyLimit {
  reached: true;
  resetsAt: string;
}

/** Pure: the state for one question from its phase row and draft row (either may be absent). */
export function unseenStateFrom(
  questionId: string,
  row: UnseenPhaseRow | null,
  draft: Pick<RewriteDraftRow, "phase1Draft" | "phase2Draft"> | null,
  dailyLimit: DailyLimit | null,
  repeating = false,
): UnseenState | null {
  const found = getQuestion(questionId);
  if (!found || found.question.type !== "unseen") return null;
  const text = found.unit.texts?.find((t) => t.id === (found.question as { textId: string }).textId);
  if (!text) return null;
  const limit = dailyLimit ? { dailyLimit } : {};
  const repeat = repeating ? { repeating: true as const } : {};

  if (!row) {
    return { stage: "write", text, ...(draft?.phase1Draft ? { draft1: draft.phase1Draft } : {}), ...limit, ...repeat };
  }
  const try1 = tryViewFrom(row, 1)!;
  if (row.status === "try1") {
    return {
      stage: draft?.phase2Draft ? "retry" : "choice",
      text,
      try1,
      retryOffered: retryOffered(row.try1Mark, row.maxMarks),
      ...(draft?.phase2Draft ? { draft2: draft.phase2Draft } : {}),
      ...limit,
      ...repeat,
    };
  }
  const discussion = unseenDiscussion(questionId);
  const try2 = tryViewFrom(row, 2);
  return {
    stage: "discussion",
    text,
    try1,
    ...(try2 ? { try2 } : {}),
    ending: row.ending as UnseenEnding,
    recordedMark: row.recordedMark ?? row.try1Mark,
    ...(discussion ? { discussion } : {}),
    ...repeat,
  };
}

/** The daily-limit marker: the day's slots have reached LLM_DAILY_CAP (and the cap is above 0). */
export async function dailyLimitFor(db: Db, userId: string, now: Date = new Date()): Promise<DailyLimit | null> {
  const cap = getConfig().llmDailyCap;
  if (cap <= 0) return null; // 0 turns marking off: that is "marker unavailable", not "come back tomorrow"
  const used = await aiUsedToday(db, userId);
  return used >= cap ? { reached: true, resetsAt: toSydneyIso(nextSydneyMidnight(now)) } : null;
}

/** Reads the rows (scoped to the session user) and builds the state for an attempt's one question. */
export async function loadUnseenState(db: Db, userId: string, attempt: Attempt): Promise<UnseenState | null> {
  const questionId = attempt.questionIds[0];
  if (!questionId) return null;
  const [row, draft, limit, repeating] = await Promise.all([
    getUnseenPhase(db, userId, attempt.id, questionId),
    getRewriteDraft(db, userId, attempt.id, questionId),
    dailyLimitFor(db, userId),
    hasEarlierResult(db, userId, questionId, attempt.id),
  ]);
  return unseenStateFrom(questionId, row, draft, row?.status === "final" ? null : limit, repeating);
}

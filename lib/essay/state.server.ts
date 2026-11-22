import "server-only";

import { getConfig } from "@/lib/config.server";
import type { Db } from "@/lib/db/index.server";
import { ensureEssayPhase } from "@/lib/db/queries/essay-phases.server";
import { getRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import type { Attempt } from "@/lib/db/schema";
import { aiUsedToday } from "@/lib/usage.server";
import { essayPublicView } from "@/lib/grading.server";
import { nextSydneyMidnight, toSydneyIso } from "@/lib/sydney";

import { finishedResult } from "./results.server";
import { emptyScaffold } from "./scaffold";
import type { EssayState } from "./types";

/**
 * Reads the rows (scoped to the session user) and builds the state for an attempt's one essay: the stage the
 * attempt is in and what that stage needs. It never carries key material; the model essay is only in a finished
 * attempt's own result. Marking is never restored as marking: a lease is not shown (spec 010 US7 AS5). Creates
 * the phase row if the attempt has none (a crash between the two inserts heals here).
 */
export async function loadEssayState(db: Db, userId: string, attempt: Attempt): Promise<EssayState | null> {
  const questionId = attempt.questionIds[0];
  if (!questionId) return null;
  const essay = essayPublicView(questionId);
  if (!essay) return null;
  const row = await ensureEssayPhase(db, { attemptId: attempt.id, userId, unitId: attempt.unitId, questionId, scaffold: emptyScaffold() });

  if (row.status === "planning") {
    return { stage: "scaffold", essay, scaffold: row.scaffold, locked: false };
  }
  if (row.status === "finished") {
    const result = finishedResult(row);
    if (!result) return null;
    return { stage: "result", essay, scaffold: row.scaffold, locked: true, result };
  }
  const draft = await getRewriteDraft(db, userId, attempt.id, questionId);
  const cap = getConfig().llmDailyCap;
  const atCap = cap > 0 && (await aiUsedToday(db, userId)) >= cap;
  return {
    stage: "write",
    essay,
    scaffold: row.scaffold,
    locked: true,
    ...(row.review ? { review: row.review } : {}),
    ...(draft?.phase1Draft ? { draft: draft.phase1Draft } : {}),
    ...(atCap ? { cap: { resetsAt: toSydneyIso(nextSydneyMidnight(new Date())) } } : {}),
  };
}

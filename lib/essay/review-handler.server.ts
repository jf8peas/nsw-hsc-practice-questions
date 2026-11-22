import "server-only";

import type { NextResponse } from "next/server";

import { getConfig } from "@/lib/config.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { getAttemptForUser } from "@/lib/db/queries/attempts.server";
import { ensureEssayPhase, getEssayPhase, storeReviewAndLock } from "@/lib/db/queries/essay-phases.server";
import { bad, clientIp, giveBack, json } from "@/lib/grade-common.server";
import { essayPublicView } from "@/lib/grading.server";
import { llmGradingConfigured } from "@/lib/openrouter.server";
import { checkIpRateLimit, checkUserRateLimit } from "@/lib/ratelimit.server";
import { nextSydneyMidnight, toSydneyIso } from "@/lib/sydney";
import { reserveAiSlot, type AiSlot } from "@/lib/usage.server";

import { logEssay, type EssayOutcome } from "./log.server";
import { reviewPlan } from "./review.server";
import { emptyScaffold, sanitiseScaffold, validateScaffold } from "./scaffold";
import { ESSAY_UNIT_ID, type EssayNotReviewed } from "./types";

// POST /api/essay/review (spec 010 FR-012 to FR-017, contracts/api.md D): the optional, unmarked feedback on the
// plan. It reviews the scaffold the student sends, and on success stores the review and locks the plan in one
// update. If the reviewer cannot be reached, or the student is at the daily limit, nothing is locked and the student
// is offered "Start writing" without a review (constitution Principle VI). One slot of LLM_DAILY_CAP, refunded on
// failure. The review is never a mark and the result view never carries it.

export async function handleReview(
  req: Request,
  user: { id: string },
  body: Record<string, unknown>,
  attemptId: string,
  questionId: string,
): Promise<NextResponse> {
  const start = Date.now();
  const log = (outcome: EssayOutcome, model?: string) =>
    logEssay({ outcome, kind: "review", userId: user.id, questionId, durationMs: Date.now() - start, model });

  const scaffold = sanitiseScaffold(body.scaffold);
  if (!scaffold) return bad("invalid_request");
  const checked = validateScaffold(scaffold, "start");
  if (!checked.ok) return bad("scaffold_invalid", 400, { reasons: checked.reasons, words: checked.words });

  let slot: AiSlot | null = null;
  try {
    const attempt = await dbCall((db) => getAttemptForUser(db, user.id, attemptId));
    if (!attempt || attempt.unitId !== ESSAY_UNIT_ID || attempt.questionIds[0] !== questionId || attempt.completedAt) {
      return bad("not_found", 404);
    }
    const row = await dbCall((db) =>
      getEssayPhase(db, user.id, attemptId, questionId).then(
        (r) => r ?? ensureEssayPhase(db, { attemptId, userId: user.id, unitId: attempt.unitId, questionId, scaffold: emptyScaffold() }),
      ),
    );
    if (row.status !== "planning") return bad("scaffold_locked", 409);
    if (row.review) return bad("already_reviewed", 409);

    const notReviewed = (reason: EssayNotReviewed["reason"], resetsAt?: string) =>
      json({ notReviewed: { reason, ...(resetsAt ? { resetsAt } : {}) } satisfies EssayNotReviewed });

    // Review off (no key, or LLM_DAILY_CAP=0): the student is told and offered "Start writing".
    if (!llmGradingConfigured() || getConfig().llmDailyCap === 0) {
      log("model_fail");
      return notReviewed("reviewer_unavailable");
    }
    const perUser = await checkUserRateLimit(user.id);
    const perIp = perUser.ok ? await checkIpRateLimit(clientIp(req)) : perUser;
    if (!perIp.ok) {
      log("rate_limited");
      return json(
        { error: "rate_limited", retryAfter: perIp.retryAfter },
        429,
        perIp.retryAfter ? { "retry-after": String(perIp.retryAfter) } : undefined,
      );
    }
    slot = await dbCall((db) => reserveAiSlot(db, user.id, getConfig().llmDailyCap));
    if (!slot) {
      log("over_allowance");
      return notReviewed("daily_limit", toSydneyIso(nextSydneyMidnight(new Date())));
    }

    const essay = essayPublicView(questionId);
    if (!essay) {
      await giveBack(slot);
      return bad("not_found", 404);
    }
    const t0 = Date.now();
    const out = await reviewPlan({ question: essay.prompt, verb: essay.verb, economy: essay.economy, plan: scaffold }); // a throw is refunded below
    if (!out) {
      await giveBack(slot); // the reviewer failed: that does not count against the allowance
      logEssay({ outcome: "model_fail", kind: "review", userId: user.id, questionId, durationMs: Date.now() - t0 });
      return notReviewed("reviewer_unavailable");
    }
    const locked = await dbCall((db) =>
      storeReviewAndLock(db, user.id, attemptId, questionId, { scaffold, words: checked.words, review: out.review, promptVersion: out.promptVersion, model: out.model }),
    );
    if (!locked) {
      await giveBack(slot); // lost a race with a "Start writing" in another tab
      return bad("scaffold_locked", 409);
    }
    logEssay({ outcome: "reviewed", kind: "review", userId: user.id, questionId, durationMs: Date.now() - t0, model: out.model });
    return json({ review: out.review, stage: "write", locked: true });
  } catch (error) {
    if (slot) await giveBack(slot);
    if (error instanceof DbUnavailableError) return bad("temporarily_unavailable", 503);
    throw error;
  }
}

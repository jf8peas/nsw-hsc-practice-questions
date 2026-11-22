import "server-only";

import type { NextResponse } from "next/server";

import { getConfig } from "@/lib/config.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { clearMarkingLease, finaliseEssay, getEssayPhase, takeMarkingLease } from "@/lib/db/queries/essay-phases.server";
import { deleteRewriteDraft, upsertRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import type { EssayPhaseRow } from "@/lib/db/schema";
import { bad, clientIp, giveBack, json } from "@/lib/grade-common.server";
import { markEssay } from "@/lib/grading.server";
import { llmGradingConfigured } from "@/lib/openrouter.server";
import { checkIpRateLimit, checkUserRateLimit } from "@/lib/ratelimit.server";
import { buildReceipt, saveResult } from "@/lib/results/save.server";
import { nextSydneyMidnight, toSydneyIso } from "@/lib/sydney";
import { attemptFieldsOf, type AttemptTokenPayload } from "@/lib/tokens.server";
import { reserveAiSlot, type AiSlot } from "@/lib/usage.server";
import { countWords } from "@/lib/wordcount";

import { ESSAY_MAX, ESSAY_MAX_CHARS, ESSAY_MIN } from "./counter";
import { logEssay, type EssayOutcome } from "./log.server";
import { finishedResult, resultFieldsFor } from "./results.server";
import type { EssayNotMarked } from "./types";

// The grade flow for an essay (spec 010), called from POST /api/grade. One try per attempt: the essay is
// marked once, out of 20. The unit is never self-marked and a marking that cannot happen does not end the
// attempt: the marker failing returns the editable box (the slot refunded) and the daily limit keeps the
// drafts (constitution Principle VI, 2.17.0). Both answer `200 { notMarked }`. One marking at a time per
// attempt: the lease on the phase row refuses a double submit or a second tab.

export async function handleEssayGrade(
  req: Request,
  user: { id: string },
  body: Record<string, unknown>,
  token: AttemptTokenPayload,
  questionId: string,
  degraded: boolean,
): Promise<NextResponse> {
  const attemptId = String(body.attemptId ?? "");
  const answer = typeof body.answer === "string" ? body.answer : "";
  const start = Date.now();
  const log = (outcome: EssayOutcome, model?: string) =>
    logEssay({ outcome, kind: "grade", userId: user.id, questionId, durationMs: Date.now() - start, model });

  if (!answer.trim()) return bad("invalid_request");

  // The word rules, enforced here as on the client (FR-019, FR-020): before any limit, slot or call.
  const words = countWords(answer);
  if (answer.length > ESSAY_MAX_CHARS || words > ESSAY_MAX) {
    log("answer_rejected");
    return bad("essay_too_long", 400, { words, min: ESSAY_MIN, max: ESSAY_MAX });
  }
  if (words < ESSAY_MIN) {
    log("answer_rejected");
    return bad("essay_too_short", 400, { words, min: ESSAY_MIN, max: ESSAY_MAX });
  }

  // The unit needs the database for everything (constitution Principle VI): no guessing, no self-marking.
  if (degraded) {
    log("db_unavailable");
    return bad("temporarily_unavailable", 503);
  }

  let row: EssayPhaseRow | null;
  try {
    row = await dbCall((db) => getEssayPhase(db, user.id, attemptId, questionId));
  } catch (error) {
    if (!(error instanceof DbUnavailableError)) throw error;
    log("db_unavailable");
    return bad("temporarily_unavailable", 503);
  }
  if (!row) return bad("not_found", 404);
  if (row.status === "finished") {
    log("already_answered");
    return json({ error: "already_answered", result: finishedResult(row) }, 409);
  }
  if (row.status === "planning") {
    log("not_locked");
    return bad("scaffold_not_locked", 409);
  }

  // One marking at a time: a double submit or a second tab does not mark twice or take a second slot.
  let leased: EssayPhaseRow | null;
  try {
    leased = await dbCall((db) => takeMarkingLease(db, user.id, attemptId, questionId));
  } catch (error) {
    if (!(error instanceof DbUnavailableError)) throw error;
    log("db_unavailable");
    return bad("temporarily_unavailable", 503);
  }
  if (!leased) {
    log("marking_in_progress");
    return bad("marking_in_progress", 409);
  }

  const release = () => dbCall((db) => clearMarkingLease(db, user.id, attemptId, questionId)).catch(() => {});
  // Keep what the student typed, whatever happens next: a reload can never lose it.
  const notMarked = async (reason: EssayNotMarked["reason"], resetsAt?: string): Promise<NextResponse> => {
    await dbCall((db) => upsertRewriteDraft(db, user.id, attemptId, token.unitId, questionId, 1, answer)).catch(() => {});
    await release();
    const nm: EssayNotMarked = { reason, ...(resetsAt ? { resetsAt } : {}) };
    return json({ notMarked: nm, saved: false });
  };

  // Marking off (no key, or LLM_DAILY_CAP=0): nothing can be marked and nothing is self-marked.
  if (!llmGradingConfigured() || getConfig().llmDailyCap === 0) {
    log("model_fail");
    return notMarked("marker_unavailable");
  }

  // Rate limits, then one slot of the daily allowance per marked essay.
  const perUser = await checkUserRateLimit(user.id);
  const perIp = perUser.ok ? await checkIpRateLimit(clientIp(req)) : perUser;
  if (!perIp.ok) {
    log("rate_limited");
    await release();
    return json(
      { error: "rate_limited", retryAfter: perIp.retryAfter },
      429,
      perIp.retryAfter ? { "retry-after": String(perIp.retryAfter) } : undefined,
    );
  }
  let slot: AiSlot | null;
  try {
    slot = await dbCall((db) => reserveAiSlot(db, user.id, getConfig().llmDailyCap));
  } catch (error) {
    if (!(error instanceof DbUnavailableError)) throw error;
    log("db_unavailable");
    await release();
    return bad("temporarily_unavailable", 503);
  }
  if (!slot) {
    log("over_allowance");
    return notMarked("daily_limit", toSydneyIso(nextSydneyMidnight(new Date())));
  }

  const t0 = Date.now();
  let marked;
  try {
    marked = await markEssay(questionId, answer);
  } catch (error) {
    await giveBack(slot);
    await release();
    throw error;
  }
  if (!marked) {
    // the marker failed: that does not count against the allowance, and no mark is invented
    await giveBack(slot);
    logEssay({ outcome: "model_fail", kind: "grade", userId: user.id, questionId, durationMs: Date.now() - t0 });
    return notMarked("marker_unavailable");
  }
  logEssay({ outcome: "graded", kind: "grade", userId: user.id, questionId, durationMs: Date.now() - t0, model: marked.model });

  const r = marked.reply;
  let finished: EssayPhaseRow | null;
  try {
    finished = await dbCall((db) =>
      finaliseEssay(db, user.id, attemptId, questionId, {
        essayText: answer,
        essayWords: words,
        rawMark: marked.rawMark,
        band: r.band,
        finalMark: marked.finalMark,
        coversBoth: r.covers,
        criteria: r.criteria,
        bandReason: r.bandReason,
        lift: r.lift,
        flags: r.flags,
        gaps: r.gaps,
        usedWell: r.usedWell,
        promptVersion: marked.promptVersion,
        model: marked.model,
      }),
    );
  } catch (error) {
    await giveBack(slot);
    await release();
    if (error instanceof DbUnavailableError) return bad("temporarily_unavailable", 503);
    throw error;
  }
  if (!finished) {
    await giveBack(slot); // lost a race: the other request's marking stands
    const existing = await dbCall((db) => getEssayPhase(db, user.id, attemptId, questionId)).catch(() => null);
    return json({ error: "already_answered", result: existing ? finishedResult(existing) : undefined }, 409);
  }

  await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});

  // Save the result row (the mark out of 20 and the concept outcomes). A failed save still shows the student
  // their mark, with a receipt to retry; the attempt is repaired on the next visit if it stays open.
  const attempt = attemptFieldsOf(token);
  const fields = resultFieldsFor(finished);
  const result = finishedResult(finished);
  let save;
  try {
    save = await saveResult(user.id, attemptId, attempt, fields);
  } catch (error) {
    if (error instanceof Error && error.name === "AttemptOwnerMismatchError") return bad("not_found", 404);
    throw error;
  }
  if (save.status === "failed") {
    return json({ result, saved: false, degraded: false, attemptCompleted: null, receipt: buildReceipt(user.id, attemptId, attempt, fields) });
  }
  return json({ result, saved: true, attemptCompleted: save.completed });
}


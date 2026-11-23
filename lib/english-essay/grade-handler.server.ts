import "server-only";

import type { NextResponse } from "next/server";

import { getConfig } from "@/lib/config.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import {
  clearEnglishMarkingLease,
  finaliseEnglishEssay,
  getEnglishEssayPhase,
  takeEnglishMarkingLease,
  type EnglishEssayPhaseRow,
} from "@/lib/db/queries/english-essay-phases.server";
import { deleteRewriteDraft, upsertRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import { bad, clientIp, giveBack, json } from "@/lib/grade-common.server";
import { englishEssayPublicView, markEnglishEssay } from "@/lib/grading.server";
import { llmGradingConfigured } from "@/lib/openrouter.server";
import { checkIpRateLimit, checkUserRateLimit } from "@/lib/ratelimit.server";
import { buildReceipt, saveResult } from "@/lib/results/save.server";
import { nextSydneyMidnight, toSydneyIso } from "@/lib/sydney";
import { attemptFieldsOf, type AttemptTokenPayload } from "@/lib/tokens.server";
import { reserveAiSlot, type AiSlot } from "@/lib/usage.server";

import { checkEssayLength, ESSAY_MAX, ESSAY_MIN } from "./counter";
import { logEnglishEssay, type EnglishEssayOutcome } from "./log.server";
import { buildOtherSources, checkQuotes } from "./quotes";
import { loadReferenceIndex, ReferenceTextUnavailableError } from "./reference-text.server";
import { englishFinishedResult, englishResultFieldsFor } from "./results.server";
import { dedupeMarkerErrors, englishFinalMark, mergeKnowledgeErrors } from "./scoring";
import type { EnglishEssayNotMarked } from "./types";

// The grade flow for an English essay (spec 011, contracts/api.md F), called from POST /api/grade. One try per attempt: the
// essay is marked once, out of 20. Exact order: parse, word and character checks, database and row state, the 130-second
// lease, the reference text, marking available, rate limits, one daily slot, the marker, the quote check, the final-mark
// function, finalise, result save. The unit is never self-marked, and a marking that cannot happen does not end the attempt:
// the marker failing returns the editable box (the slot refunded), the daily limit keeps the drafts, and a missing reference
// text refuses before any model call or daily slot (constitution Principle VI, 2.18.0). All three answer `200 { notMarked }`.

export async function handleEnglishEssayGrade(
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
  const log = (outcome: EnglishEssayOutcome, model?: string) =>
    logEnglishEssay({ outcome, kind: "grade", userId: user.id, questionId, durationMs: Date.now() - start, model });

  // The length rules, enforced here as on the client: before any lease, limit, slot or call. No shared 6,000-character
  // truncation applies to this unit.
  const length = checkEssayLength(answer);
  if (!length.ok) {
    log("answer_rejected");
    if (length.error === "invalid_request") return bad("invalid_request");
    return bad(length.error, 400, { words: length.words, min: ESSAY_MIN, max: ESSAY_MAX });
  }
  const words = length.words;

  // The unit needs the database for everything (constitution Principle VI): no guessing, no self-marking.
  if (degraded) {
    log("db_unavailable");
    return bad("temporarily_unavailable", 503);
  }

  let row: EnglishEssayPhaseRow | null;
  try {
    row = await dbCall((db) => getEnglishEssayPhase(db, user.id, attemptId, questionId));
  } catch (error) {
    if (!(error instanceof DbUnavailableError)) throw error;
    log("db_unavailable");
    return bad("temporarily_unavailable", 503);
  }
  if (!row) return bad("not_found", 404);
  if (row.status === "finished") {
    log("already_answered");
    return json({ error: "already_answered", result: englishFinishedResult(row) }, 409);
  }
  if (row.status === "planning") {
    log("not_locked");
    return bad("scaffold_not_locked", 409);
  }

  // One marking at a time: a double submit or a second tab does not mark twice or take a second slot.
  let leased: EnglishEssayPhaseRow | null;
  try {
    leased = await dbCall((db) => takeEnglishMarkingLease(db, user.id, attemptId, questionId));
  } catch (error) {
    if (!(error instanceof DbUnavailableError)) throw error;
    log("db_unavailable");
    return bad("temporarily_unavailable", 503);
  }
  if (!leased) {
    log("marking_in_progress");
    return bad("marking_in_progress", 409);
  }

  const release = () => dbCall((db) => clearEnglishMarkingLease(db, user.id, attemptId, questionId)).catch(() => {});
  // Keep what the student typed, whatever happens next: a reload can never lose it.
  const notMarked = async (reason: EnglishEssayNotMarked["reason"], resetsAt?: string): Promise<NextResponse> => {
    await dbCall((db) => upsertRewriteDraft(db, user.id, attemptId, token.unitId, questionId, 1, answer)).catch(() => {});
    await release();
    const nm: EnglishEssayNotMarked = { reason, ...(resetsAt ? { resetsAt } : {}) };
    return json({ notMarked: nm, saved: false });
  };

  // The reference text must be readable BEFORE any model call or daily slot: never an unchecked mark.
  let reference;
  try {
    reference = await dbCall((db) => loadReferenceIndex(db));
  } catch (error) {
    if (error instanceof ReferenceTextUnavailableError) {
      log("reference_unavailable");
      return notMarked("reference_text_unavailable");
    }
    if (error instanceof DbUnavailableError) {
      log("db_unavailable");
      await release();
      return bad("temporarily_unavailable", 503);
    }
    throw error;
  }

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
    marked = await markEnglishEssay(questionId, answer);
  } catch (error) {
    await giveBack(slot);
    await release();
    throw error;
  }
  if (!marked) {
    // the marker failed: that does not count against the allowance, and no mark is invented
    await giveBack(slot);
    logEnglishEssay({ outcome: "model_fail", kind: "grade", userId: user.id, questionId, durationMs: Date.now() - t0 });
    return notMarked("marker_unavailable");
  }
  logEnglishEssay({ outcome: "graded", kind: "grade", userId: user.id, questionId, durationMs: Date.now() - t0, model: marked.model });

  // The deterministic quote check runs after a valid marker reply and before the final mark.
  const r = marked.reply;
  const question = englishEssayPublicView(questionId)?.prompt ?? "";
  const quoteResults = checkQuotes(answer, reference.index, buildOtherSources(question));
  const knowledgeErrors = mergeKnowledgeErrors(dedupeMarkerErrors(r.knowledgeErrors, answer), quoteResults);
  const final = englishFinalMark({ rawMark: r.mark, band: r.band, errorCount: knowledgeErrors.length, focus: r.questionFocus });

  let finished: EnglishEssayPhaseRow | null;
  try {
    finished = await dbCall((db) =>
      finaliseEnglishEssay(db, user.id, attemptId, questionId, {
        essayText: answer,
        essayWords: words,
        rawMark: r.mark,
        band: r.band,
        finalMark: final.finalMark,
        finalBand: final.finalBand,
        criteria: r.criteria,
        bandReason: r.bandReason,
        lift: r.lift,
        questionFocus: r.questionFocus,
        questionFocusReason: r.questionFocusReason,
        knowledgeErrors,
        quoteResults,
        referenceTextHash: reference.hash,
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
    const existing = await dbCall((db) => getEnglishEssayPhase(db, user.id, attemptId, questionId)).catch(() => null);
    return json({ error: "already_answered", result: existing ? englishFinishedResult(existing) : undefined }, 409);
  }

  await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});

  // Save the result row (the mark out of 20 and the concept outcomes). A failed save still shows the student their mark, with
  // a receipt to retry; the attempt is repaired on the next visit if it stays open.
  const attempt = attemptFieldsOf(token);
  const fields = englishResultFieldsFor(finished);
  const result = englishFinishedResult(finished);
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

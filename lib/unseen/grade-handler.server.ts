import "server-only";

import { NextResponse } from "next/server";

import { getConfig } from "@/lib/config.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { clearRewriteDraft, deleteRewriteDraft, upsertRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import {
  finaliseUnseenRetry,
  getUnseenPhase,
  insertUnseenPhase,
} from "@/lib/db/queries/unseen-phases.server";
import type { UnseenPhaseRow } from "@/lib/db/schema";
import { markUnseen, unseenDiscussion } from "@/lib/grading.server";
import { llmGradingConfigured } from "@/lib/openrouter.server";
import { checkIpRateLimit, checkUserRateLimit } from "@/lib/ratelimit.server";
import { buildReceipt, saveResult, type ResultFields } from "@/lib/results/save.server";
import { nextSydneyMidnight, toSydneyIso } from "@/lib/sydney";
import { attemptFieldsOf, type AttemptTokenPayload } from "@/lib/tokens.server";
import type { UnseenQuestion } from "@/lib/types";
import { limitsFor, MIN_WORDS } from "@/lib/unseen/limits";
import { logUnseen, type UnseenOutcome } from "@/lib/unseen/log.server";
import { conceptOutcomes, endingAfterFirstTry, metSkills, missedSkills, recordedMark, retryOffered } from "@/lib/unseen/scoring";
import type { NotMarked, UnseenGradeResult } from "@/lib/unseen/types";
import { gradeResultFrom } from "@/lib/unseen/views";
import { refundAiSlot, reserveAiSlot, type AiSlot } from "@/lib/usage.server";
import { countWords } from "@/lib/wordcount";

// The two-try grade flow for an unseen-text question (spec 008), called from POST /api/grade. Try 1
// marks the first answer: full marks (and a 1-mark question) go straight to the final state; otherwise
// the phase row waits for ONE retry, capped at one mark below full marks, with the recorded mark the
// higher of the two. The unit is never self-marked and a try that cannot be marked does not end the
// question: the marker failing returns the editable box (the slot refunded), and the daily limit holds
// the question at that step (constitution Principle VI, 2.15.0). Both outcomes answer `200 { notMarked }`.

const MAX_ANSWER_CHARS = 6000;

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });
const bad = (error: string, status = 400, extra: Record<string, unknown> = {}) => json({ error, ...extra }, status);

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

async function giveBack(slot: AiSlot): Promise<void> {
  try {
    await dbCall((db) => refundAiSlot(db, slot));
  } catch (error) {
    console.error("could not refund an AI slot", error);
  }
}

/** The result row's fields: the deciding try's text and feedback, the FIRST try's seven outcomes (FR-026). */
export function resultFieldsFor(row: UnseenPhaseRow): ResultFields {
  const retryDecides = row.ending === "retried" && row.try2Text !== null && row.try2Mark !== null && row.try2Mark >= row.try1Mark;
  const verdicts = retryDecides && row.try2Verdicts ? row.try2Verdicts : row.try1Verdicts;
  return {
    questionId: row.questionId,
    answer: retryDecides ? row.try2Text! : row.try1Text,
    marks: row.recordedMark ?? row.try1Mark,
    max: row.maxMarks,
    gradedBy: "llm",
    feedback: retryDecides ? row.try2Feedback : row.try1Feedback,
    hits: metSkills(verdicts),
    misses: missedSkills(verdicts),
    conceptOutcomes: conceptOutcomes(row.try1Verdicts),
  };
}

/** Save the final result row and answer. A failed save still shows the student their mark, with a receipt. */
export async function saveFinalAndRespond(i: {
  userId: string;
  attemptId: string;
  attempt: ReturnType<typeof attemptFieldsOf>;
  result: UnseenGradeResult;
  row: UnseenPhaseRow;
}): Promise<NextResponse> {
  const fields = resultFieldsFor(i.row);
  let save;
  try {
    save = await saveResult(i.userId, i.attemptId, i.attempt, fields);
  } catch (error) {
    if (error instanceof Error && error.name === "AttemptOwnerMismatchError") return bad("not_found", 404);
    throw error;
  }
  if (save.status === "failed") {
    return json({
      result: i.result,
      saved: false,
      degraded: false,
      attemptCompleted: null,
      receipt: buildReceipt(i.userId, i.attemptId, i.attempt, fields),
    });
  }
  return json({ result: i.result, saved: true, attemptCompleted: save.completed });
}

export async function handleUnseenGrade(
  req: Request,
  user: { id: string },
  body: Record<string, unknown>,
  token: AttemptTokenPayload,
  question: UnseenQuestion,
  degraded: boolean,
): Promise<NextResponse> {
  const attemptId = String(body.attemptId ?? "");
  const questionId = question.id;
  const answer = typeof body.answer === "string" ? body.answer : "";
  const phaseRaw = body.phase;
  const phase: 1 | 2 | null =
    phaseRaw === undefined || phaseRaw === 1 || phaseRaw === "1" ? 1 : phaseRaw === 2 || phaseRaw === "2" ? 2 : null;
  const start = Date.now();
  const log = (outcome: UnseenOutcome, p: 1 | 2 | undefined, model?: string) =>
    logUnseen({ outcome, userId: user.id, questionId, phase: p, durationMs: Date.now() - start, model });

  if (phase === null) return bad("invalid_phase");
  // the retry cannot be skipped by the grade route: refuse before any marker call, slot or write
  if (body.skip === true) return bad("invalid_request");
  if (!answer.trim()) return bad("invalid_request");

  // The word rules, enforced here as on the client (FR-010, FR-011): before any limit, slot or call.
  const words = countWords(answer);
  const limits = limitsFor(question.suggestedWords);
  if (answer.length > MAX_ANSWER_CHARS || words > limits.max) {
    log("answer_rejected", phase);
    return bad("answer_too_long", 400, { maxWords: limits.max });
  }
  if (words < MIN_WORDS) {
    log("answer_rejected", phase);
    return bad("answer_too_short", 400, { minWords: MIN_WORDS });
  }

  // The unit needs the database for everything (constitution Principle VI): no guessing, no self-marking.
  if (degraded) {
    log("db_unavailable", phase);
    return bad("temporarily_unavailable", 503);
  }

  let row: UnseenPhaseRow | null;
  try {
    row = await dbCall((db) => getUnseenPhase(db, user.id, attemptId, questionId));
  } catch (error) {
    if (!(error instanceof DbUnavailableError)) throw error;
    log("db_unavailable", phase);
    return bad("temporarily_unavailable", 503);
  }
  const stored = (r: UnseenPhaseRow) => gradeResultFrom(r, r.status === "final" ? unseenDiscussion(questionId) : null);
  if (phase === 2) {
    if (row?.status === "final") {
      log("already_answered", 2);
      return json({ error: "already_answered", result: stored(row) }, 409);
    }
    if (!row || !retryOffered(row.try1Mark, row.maxMarks)) {
      log("phase_refused", 2);
      return bad("phase_refused");
    }
  } else if (row) {
    log("already_answered", 1);
    return json({ error: "already_answered", result: stored(row) }, 409);
  }

  // Keep what the student typed, whatever happens next: a reload can never lose it.
  const saveDraft = () =>
    dbCall((db) => upsertRewriteDraft(db, user.id, attemptId, token.unitId, questionId, phase, answer)).catch(() => {});
  const notMarked = async (reason: NotMarked["reason"], resetsAt?: string): Promise<NextResponse> => {
    await saveDraft();
    const nm: NotMarked = { reason, phase, ...(resetsAt ? { resetsAt } : {}) };
    return json({ notMarked: nm, saved: false });
  };

  // Marking off (no key, or LLM_DAILY_CAP=0): nothing can be marked and nothing is self-marked.
  if (!llmGradingConfigured() || getConfig().llmDailyCap === 0) {
    log("model_fail", phase);
    return notMarked("marker_unavailable");
  }

  // Rate limits, then one slot of the daily allowance per marked try.
  const perUser = await checkUserRateLimit(user.id);
  const perIp = perUser.ok ? await checkIpRateLimit(clientIp(req)) : perUser;
  if (!perIp.ok) {
    log("rate_limited", phase);
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
    log("db_unavailable", phase);
    return bad("temporarily_unavailable", 503);
  }
  if (!slot) {
    log("over_allowance", phase);
    return notMarked("daily_limit", toSydneyIso(nextSydneyMidnight(new Date())));
  }

  const t0 = Date.now();
  let marked;
  try {
    marked = await markUnseen(questionId, answer, phase);
  } catch (error) {
    await giveBack(slot);
    throw error;
  }
  if (!marked) {
    // the marker failed: that does not count against the allowance, and no mark is invented
    await giveBack(slot);
    logUnseen({ outcome: "model_fail", userId: user.id, questionId, phase, durationMs: Date.now() - t0 });
    return notMarked("marker_unavailable");
  }
  logUnseen({ outcome: "graded", userId: user.id, questionId, phase, durationMs: Date.now() - t0, model: marked.model });

  const attempt = attemptFieldsOf(token);

  // ---- try 1 ---------------------------------------------------------------------------------
  if (phase === 1) {
    const ending = endingAfterFirstTry(marked.mark, question.maxMarks);
    try {
      const inserted = await dbCall((db) =>
        insertUnseenPhase(db, {
          attemptId,
          userId: user.id,
          unitId: token.unitId,
          questionId,
          maxMarks: question.maxMarks,
          status: ending ? "final" : "try1",
          ...(ending ? { ending, recordedMark: marked.mark } : {}),
          try1Text: answer,
          try1Mark: marked.mark,
          try1Verdicts: marked.verdicts,
          try1Feedback: marked.feedback,
          try1BiggestGap: marked.biggestGap,
          try1PromptVersion: marked.promptVersion,
          try1Model: marked.model,
        }),
      );
      if (!inserted.inserted) {
        await giveBack(slot); // lost a race with another tab: the other tab's marking stands
        const existing = await dbCall((db) => getUnseenPhase(db, user.id, attemptId, questionId));
        if (existing) return json({ error: "already_answered", result: stored(existing) }, 409);
      }
    } catch (error) {
      if (error instanceof DbUnavailableError) {
        await giveBack(slot);
        return bad("temporarily_unavailable", 503);
      }
      if (error instanceof Error && error.name === "AttemptOwnerMismatchError") return bad("not_found", 404);
      throw error;
    }
    const saved = await dbCall((db) => getUnseenPhase(db, user.id, attemptId, questionId));
    if (!saved) return bad("temporarily_unavailable", 503);
    if (!ending) {
      await dbCall((db) => clearRewriteDraft(db, user.id, attemptId, questionId, 1)).catch(() => {});
      return json({ result: gradeResultFrom(saved), saved: false, phaseSaved: true, attemptCompleted: false });
    }
    await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});
    return saveFinalAndRespond({ userId: user.id, attemptId, attempt, result: gradeResultFrom(saved, unseenDiscussion(questionId)), row: saved });
  }

  // ---- try 2 (the retry): already capped at max - 1; the recorded mark is the higher try ---------
  const recorded = recordedMark(row!.try1Mark, marked.mark);
  const ended = await dbCall((db) =>
    finaliseUnseenRetry(db, user.id, attemptId, questionId, {
      recordedMark: recorded,
      try2: {
        text: answer,
        mark: marked.mark,
        verdicts: marked.verdicts,
        feedback: marked.feedback,
        biggestGap: marked.biggestGap,
        promptVersion: marked.promptVersion,
        model: marked.model,
      },
    }),
  );
  if (!ended) {
    await giveBack(slot);
    const existing = await dbCall((db) => getUnseenPhase(db, user.id, attemptId, questionId));
    return json({ error: "already_answered", result: existing ? stored(existing) : undefined }, 409);
  }
  await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});
  return saveFinalAndRespond({ userId: user.id, attemptId, attempt, result: gradeResultFrom(ended, unseenDiscussion(questionId)), row: ended });
}

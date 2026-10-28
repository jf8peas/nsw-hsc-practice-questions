import { NextResponse } from "next/server";

import { getQuestion } from "@/content";
import { resolveSession } from "@/lib/auth.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { getResult } from "@/lib/db/queries/results.server";
import type { ResultRow } from "@/lib/db/schema";
import { getConfig } from "@/lib/config.server";
import type { AlreadyAnswered, GradeResponse } from "@/lib/grading";
import { getOptionExplanation, gradeAnswer } from "@/lib/grading.server";
import { llmGradingConfigured } from "@/lib/openrouter.server";
import { checkIpRateLimit, checkUserRateLimit } from "@/lib/ratelimit.server";
import { buildReceipt, saveResult, type ResultFields } from "@/lib/results/save.server";
import { nextSydneyMidnight, toSydneyIso } from "@/lib/sydney";
import { attemptFieldsOf, signSelfMarkToken, verifyAttemptToken } from "@/lib/tokens.server";
import { refundAiSlot, reserveAiSlot, type AiSlot } from "@/lib/usage.server";

export const runtime = "nodejs";

const MAX_ANSWER_LEN = 6000;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });

const bad = (error: string, status = 400) => json({ error }, status);

/** Refund a reserved AI slot. Best effort: a failure only costs the student one slot for the day. */
async function giveBack(slot: AiSlot): Promise<void> {
  try {
    await dbCall((db) => refundAiSlot(db, slot));
  } catch (error) {
    console.error("could not refund an AI slot", error);
  }
}

/** 409: this question already has a stored result; show that mark and move on. */
function alreadyAnswered(row: ResultRow, type: "mc" | "short"): NextResponse {
  const body: AlreadyAnswered = {
    error: "already_answered",
    result: {
      questionId: row.questionId,
      type,
      maxMarks: row.maxMarks,
      marksAwarded: row.marksAwarded,
      feedback: row.feedback ?? undefined,
      rubricHits: row.rubricHits ?? undefined,
      rubricMisses: row.rubricMisses ?? undefined,
      // recomputed from the stored option text, never stored (spec 002 FR-041)
      optionExplanation:
        type === "mc" && row.marksAwarded === 0 ? getOptionExplanation(row.questionId, row.answer) : undefined,
      needsSelfMark: false,
    },
  };
  return json(body, 409);
}

/**
 * Grade one answer and save it (specs/001-student-saved-scores/contracts/api.md).
 *
 * Degraded-capable (research R19): when the database cannot be reached the
 * answer is still marked from the signed attempt token alone — MC is graded and
 * returned with a receipt to save later; a short answer falls back to
 * self-marking and never touches the daily AI cap.
 */
export async function POST(req: Request) {
  const session = await resolveSession();
  if (session.kind === "none") return bad("unauthenticated", 401);
  const user = session.user;
  let degraded = session.kind === "unverified";

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_request");
  }
  const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  const answer = typeof body.answer === "string" ? body.answer.slice(0, MAX_ANSWER_LEN) : "";
  if (!attemptId || !questionId || typeof body.attemptToken !== "string") {
    return bad("invalid_request");
  }

  // The signed attempt token proves who the attempt belongs to, which questions
  // it contains and the MC option order. Nothing else from the client is trusted.
  const verified = verifyAttemptToken(body.attemptToken, { uid: user.id, attemptId });
  if (!verified.ok) return bad("invalid_attempt_token");
  const token = verified.payload;
  if (!token.questionIds.includes(questionId)) return bad("not_found", 404);

  const found = getQuestion(questionId);
  if (!found) return bad("not_found", 404);
  const { question } = found;

  if (question.type === "mc") {
    const index = /^\d+$/.test(answer) ? Number(answer) : -1;
    if (index < 0 || index >= question.options.length) return bad("invalid_request");
  }

  // Already answered? (skipped when the database cannot be read: duplicates are
  // then prevented at save time by UNIQUE(attempt_id, question_id).)
  if (!degraded) {
    try {
      const existing = await dbCall((db) => getResult(db, user.id, attemptId, questionId));
      if (existing) return alreadyAnswered(existing, question.type);
    } catch (error) {
      if (!(error instanceof DbUnavailableError)) throw error;
      degraded = true;
    }
  }

  // Only a request that would spend LLM credits is rate limited and counted against the
  // daily allowance. MC and empty answers are never limited or counted (Principle VI).
  let skipLlm = degraded;
  let aiLimit: GradeResponse["aiLimit"];
  let slot: AiSlot | null = null;
  const cap = getConfig().llmDailyCap;
  if (question.type === "short" && answer.trim() !== "" && !degraded) {
    if (!llmGradingConfigured() || cap === 0) {
      skipLlm = true; // AI marking is off: the student self-marks, nothing to count
    } else {
      // validate -> per-user limit -> per-IP backstop -> reserve a daily slot -> LLM
      const perUser = await checkUserRateLimit(user.id);
      const perIp = perUser.ok ? await checkIpRateLimit(clientIp(req)) : perUser;
      if (!perIp.ok) {
        return json(
          { error: "rate_limited", retryAfter: perIp.retryAfter },
          429,
          perIp.retryAfter ? { "retry-after": String(perIp.retryAfter) } : undefined,
        );
      }
      try {
        slot = await dbCall((db) => reserveAiSlot(db, user.id, cap));
        if (!slot) {
          // Over today's allowance: self-mark, and say when AI marking returns.
          skipLlm = true;
          aiLimit = { reached: true, resetsAt: toSydneyIso(nextSydneyMidnight(new Date())) };
        }
      } catch (error) {
        if (!(error instanceof DbUnavailableError)) throw error;
        degraded = true; // the allowance cannot be checked, so no LLM call
        skipLlm = true;
      }
    }
  }

  let graded;
  try {
    graded = await gradeAnswer(questionId, answer, {
      optionOrder: token.mcOptionOrder[questionId],
      skipLlm,
    });
  } catch (error) {
    if (slot) await giveBack(slot); // never keep a slot for an answer that was not marked
    throw error;
  }
  if (!graded) {
    if (slot) await giveBack(slot);
    return bad("not_found", 404);
  }
  // The LLM failed or fell back to self-marking: that does not count against the allowance.
  if (slot && graded.result.needsSelfMark) await giveBack(slot);
  const { result } = graded;

  // The grader could not mark it: the student self-marks (POST /api/results/self-mark).
  if (result.needsSelfMark) {
    const response: GradeResponse = {
      result,
      saved: false,
      degraded,
      attemptCompleted: degraded ? null : false,
      selfMarkToken: signSelfMarkToken({ uid: user.id, attemptId, questionId, answer }),
      ...(degraded ? { aiUnavailable: true } : {}),
      ...(aiLimit ? { aiLimit } : {}),
    };
    return json(response);
  }

  const isLlm = graded.gradedBy === "llm";
  const fields: ResultFields = {
    questionId,
    answer: graded.answerText,
    marks: result.marksAwarded ?? 0,
    max: result.maxMarks,
    gradedBy: graded.gradedBy,
    feedback: isLlm ? (result.feedback ?? null) : null,
    hits: isLlm ? (result.rubricHits ?? null) : null,
    misses: isLlm ? (result.rubricMisses ?? null) : null,
  };
  const attempt = attemptFieldsOf(token);

  if (degraded) {
    const response: GradeResponse = {
      result,
      saved: false,
      degraded: true,
      attemptCompleted: null,
      receipt: buildReceipt(user.id, attemptId, attempt, fields),
    };
    return json(response);
  }

  let outcome;
  try {
    outcome = await saveResult(user.id, attemptId, attempt, fields);
  } catch (error) {
    if (error instanceof Error && error.name === "AttemptOwnerMismatchError") {
      return bad("not_found", 404);
    }
    throw error;
  }

  // Saving failed or timed out: the student still gets their mark, plus a receipt to retry with.
  if (outcome.status === "failed") {
    const response: GradeResponse = {
      result,
      saved: false,
      degraded: false,
      attemptCompleted: null,
      receipt: buildReceipt(user.id, attemptId, attempt, fields),
    };
    return json(response);
  }

  // Lost a race with a simultaneous request for the same question: show the stored mark.
  if (!outcome.inserted && outcome.stored) return alreadyAnswered(outcome.stored, question.type);

  const response: GradeResponse = {
    result,
    saved: true,
    degraded: false,
    attemptCompleted: outcome.completed,
  };
  return json(response);
}

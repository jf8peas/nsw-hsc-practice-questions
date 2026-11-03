import { NextResponse } from "next/server";

import { rewriteScore } from "@/lib/rewrite-scoring";
import { getQuestion } from "@/content";
import { resolveSession } from "@/lib/auth.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { deleteRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import { finaliseRewritePhase, getRewritePhase, insertRewritePhase } from "@/lib/db/queries/rewrite-phases.server";
import { getResult } from "@/lib/db/queries/results.server";
import { buildReceipt, saveResult, type ResultFields } from "@/lib/results/save.server";
import {
  attemptFieldsOf,
  verifyAttemptToken,
  verifySelfMarkToken,
  type AttemptTokenPayload,
} from "@/lib/tokens.server";

export const runtime = "nodejs";

const MAX_ANSWER_LEN = 6000;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const bad = (error: string, status = 400) => json({ error }, status);

/**
 * Save the student's own mark for a short answer the grader could not mark.
 * The only client-supplied mark is the binary `correct` flag, accepted only
 * with a valid server-issued self-mark token (specs/.../contracts/api.md).
 * Degraded-capable: with the database unreachable it verifies the tokens and
 * returns a receipt.
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
  if (!attemptId || !questionId || typeof body.correct !== "boolean") return bad("invalid_request");

  const attemptToken = verifyAttemptToken(body.attemptToken, { uid: user.id, attemptId });
  if (!attemptToken.ok) return bad("invalid_attempt_token");
  const selfMarkToken = verifySelfMarkToken(body.token, {
    uid: user.id,
    attemptId,
    questionId,
    answer,
  });
  if (!selfMarkToken.ok) return bad("invalid_token");

  const token = attemptToken.payload;
  if (!token.questionIds.includes(questionId)) return bad("not_found", 404);
  const found = getQuestion(questionId);
  if (!found) return bad("not_found", 404);
  if (found.question.type === "rewrite") {
    return handleRewriteSelfMark(user, body, token, degraded, found.question.maxMarks);
  }
  if (found.question.type !== "short") return bad("not_short_question", 422);

  if (!degraded) {
    try {
      const existing = await dbCall((db) => getResult(db, user.id, attemptId, questionId));
      if (existing) {
        return json({ error: "already_answered", result: { marksAwarded: existing.marksAwarded } }, 409);
      }
    } catch (error) {
      if (!(error instanceof DbUnavailableError)) throw error;
      degraded = true;
    }
  }

  const max = found.question.maxMarks;
  const fields: ResultFields = {
    questionId,
    answer,
    marks: body.correct ? max : 0,
    max,
    gradedBy: "self",
    feedback: null,
    hits: null,
    misses: null,
  };
  const attempt = attemptFieldsOf(token);
  const receipt = () => buildReceipt(user.id, attemptId, attempt, fields);

  if (degraded) return json({ saved: false, degraded: true, attemptCompleted: null, receipt: receipt() });

  let outcome;
  try {
    outcome = await saveResult(user.id, attemptId, attempt, fields);
  } catch (error) {
    if (error instanceof Error && error.name === "AttemptOwnerMismatchError") {
      return bad("not_found", 404);
    }
    throw error;
  }
  if (outcome.status === "failed") {
    return json({ saved: false, degraded: false, attemptCompleted: null, receipt: receipt() });
  }
  if (!outcome.inserted && outcome.stored) {
    return json({ error: "already_answered", result: { marksAwarded: outcome.stored.marksAwarded } }, 409);
  }
  return json({ saved: true, attemptCompleted: outcome.completed });
}

/**
 * Self-marking for a rewrite question (spec 005 FR-030, FR-046): the student ticks criterion A,
 * one tick per target term for criterion (b), and criterion C. The self-mark token binds the
 * answer and the question's term concept ids, so the ticks cannot be forged and no other term
 * can be invented. The per-term ticks become the result's `concept_outcomes` (phase 1 only).
 */
async function handleRewriteSelfMark(
  user: { id: string },
  body: Record<string, unknown>,
  token: AttemptTokenPayload,
  degraded: boolean,
  maxMarks: number,
): Promise<NextResponse> {
  const attemptId = String(body.attemptId ?? "");
  const questionId = String(body.questionId ?? "");
  const answer = typeof body.answer === "string" ? body.answer.slice(0, MAX_ANSWER_LEN) : "";
  // the client sends the phase as a number; accept the string form too
  const phase: 1 | 2 = Number(body.phase) === 2 ? 2 : 1;
  const rawTicks = body.termTicks && typeof body.termTicks === "object" ? (body.termTicks as Record<string, unknown>) : {};
  const termTicks: Record<string, boolean> = {};
  for (const [id, v] of Object.entries(rawTicks)) if (typeof v === "boolean") termTicks[id] = v;

  const selfMarkToken = verifySelfMarkToken(body.token, { uid: user.id, attemptId, questionId, answer });
  if (!selfMarkToken.ok) return bad("invalid_token");
  const termIds = selfMarkToken.payload.termConceptIds ?? [];
  for (const id of Object.keys(termTicks)) {
    if (!termIds.includes(id)) return bad("invalid_token");
  }

  // rubric (2026-11-03 fix): each term ticked contributes, criteria A/C each cost one mark when
  // lost, a retry is capped at totalMarks - 1, and a non-perfect first try is capped below that
  const criterionA = body.criterionA === true;
  const criterionC = body.criterionC === true;
  const termCount = termIds.length;
  const termsUsed = termIds.filter((id) => termTicks[id] === true).length;
  const marks = rewriteScore({ totalMarks: maxMarks, termCount, termsUsed, criterionA, criterionC, phase });
  const conceptOutcomes = termIds.map((id) => ({ conceptId: id, correct: termTicks[id] === true }));

  if (!degraded) {
    try {
      const existing = await dbCall((db) => getResult(db, user.id, attemptId, questionId));
      if (existing) return json({ error: "already_answered", result: { marksAwarded: existing.marksAwarded } }, 409);
    } catch (error) {
      if (!(error instanceof DbUnavailableError)) throw error;
      degraded = true;
    }
  }

  // The recorded mark is the best of phase 1 and this (capped) self-marked phase 2 (FR-019).
  let recorded = marks;
  try {
    const existingPhase = degraded ? null : await dbCall((db) => getRewritePhase(db, user.id, attemptId, questionId));
    if (existingPhase) {
      if (phase === 2) recorded = Math.max(existingPhase.phase1Marks, marks);
      if (!degraded) {
        await dbCall((db) =>
          finaliseRewritePhase(db, user.id, attemptId, questionId, {
            phase2Answer: answer,
            phase2Marks: marks,
            phase2Feedback: null,
            recordedMark: recorded,
          }),
        );
      }
    } else if (!degraded) {
      await dbCall((db) =>
        insertRewritePhase(db, {
          attemptId,
          userId: user.id,
          unitId: token.unitId,
          questionId,
          status: "final",
          phase1Answer: answer,
          phase1Marks: marks,
          phase1Feedback: null,
          phase1TermOutcomes: conceptOutcomes,
          recordedMark: recorded,
        }),
      );
    }
  } catch (error) {
    if (error instanceof DbUnavailableError) degraded = true;
    else if (error instanceof Error && error.name === "AttemptOwnerMismatchError") return bad("not_found", 404);
    else throw error;
  }

  const fields: ResultFields = {
    questionId,
    answer,
    marks: recorded,
    max: 3,
    gradedBy: "self",
    feedback: null,
    hits: null,
    misses: null,
    conceptOutcomes,
  };
  const attempt = attemptFieldsOf(token);
  const receipt = () => buildReceipt(user.id, attemptId, attempt, fields);

  if (degraded) return json({ saved: false, degraded: true, attemptCompleted: null, receipt: receipt() });

  let outcome;
  try {
    outcome = await saveResult(user.id, attemptId, attempt, fields);
  } catch (error) {
    if (error instanceof Error && error.name === "AttemptOwnerMismatchError") return bad("not_found", 404);
    throw error;
  }
  if (outcome.status === "failed") {
    return json({ saved: false, degraded: false, attemptCompleted: null, receipt: receipt() });
  }
  if (!outcome.inserted && outcome.stored) {
    return json({ error: "already_answered", result: { marksAwarded: outcome.stored.marksAwarded } }, 409);
  }
  // the question is final: the draft row is no longer needed (research R5.2, Principle II)
  await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});
  return json({ saved: true, attemptCompleted: outcome.completed });
}

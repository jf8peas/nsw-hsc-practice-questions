import { NextResponse } from "next/server";

import { getQuestion } from "@/content";
import { resolveSession } from "@/lib/auth.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { getResult } from "@/lib/db/queries/results.server";
import { buildReceipt, saveResult, type ResultFields } from "@/lib/results/save.server";
import {
  attemptFieldsOf,
  verifyAttemptToken,
  verifySelfMarkToken,
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

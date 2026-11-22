import { NextResponse } from "next/server";

import { getQuestion } from "@/content";
import { authenticate } from "@/lib/api-auth.server";
import { isCompletePick, tabOrder } from "@/lib/comparative/pick";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { getAttemptForUser } from "@/lib/db/queries/attempts.server";
import { savePickedTextIds } from "@/lib/db/queries/rewrite-drafts.server";
import { getUnseenPhase } from "@/lib/db/queries/unseen-phases.server";
import { checkDraftRateLimit } from "@/lib/ratelimit.server";
import { verifyAttemptToken } from "@/lib/tokens.server";

export const runtime = "nodejs";

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });
const bad = (error: string, status = 400) => json({ error }, status);

/**
 * Save the pick a student made on a comparative choice question (spec 009 FR-009, research R5, contracts/api.md), as
 * soon as it is complete or changed, so leaving and returning, even on another device, restores it. The pick is a list
 * of text ids from the question's own public allowed set; the server re-checks every id (Principle I, 2.16.0), and
 * the request carries nothing else from the client. It is the student's own choice, never key material, and is deleted
 * with the student (Principle II). Once the first try is submitted the pick is fixed on the phase row and this route
 * answers 409 pick_locked without changing anything. It shares the draft route's per-user limiter.
 */
export async function POST(req: Request) {
  const auth = await authenticate();
  if (auth.response) return auth.response;
  const user = auth.user;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_request");
  }
  const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  if (!attemptId || !questionId || typeof body.attemptToken !== "string") return bad("invalid_request");

  // The signed attempt token proves who the attempt belongs to and which questions it contains.
  const verified = verifyAttemptToken(body.attemptToken, { uid: user.id, attemptId });
  if (!verified.ok) return json({ error: "invalid_attempt_token" }, 401);
  const token = verified.payload;
  if (!token.questionIds.includes(questionId)) return bad("not_found", 404);
  const found = getQuestion(questionId);
  if (!found || found.question.type !== "comparative") return bad("not_found", 404);
  const question = found.question;

  // a fixed pair has no pick; an incomplete or disallowed pick is refused (nothing is saved)
  if (!isCompletePick(question.choice, body.pick)) return bad("invalid_pick");
  const pick = tabOrder(question, body.pick);

  const perUser = await checkDraftRateLimit(user.id);
  if (!perUser.ok) {
    return json(
      { error: "rate_limited", retryAfter: perUser.retryAfter },
      429,
      perUser.retryAfter ? { "retry-after": String(perUser.retryAfter) } : undefined,
    );
  }

  try {
    const attempt = await dbCall((db) => getAttemptForUser(db, user.id, attemptId));
    if (!attempt) return bad("not_found", 404);
    // fixed from the first submission on: nothing is changed
    const phaseRow = await dbCall((db) => getUnseenPhase(db, user.id, attemptId, questionId));
    if (phaseRow) return bad("pick_locked", 409);
    await dbCall((db) => savePickedTextIds(db, user.id, attemptId, token.unitId, questionId, pick));
  } catch (error) {
    if (!(error instanceof DbUnavailableError)) throw error;
    return bad("temporarily_unavailable", 503);
  }
  return json({ ok: true });
}

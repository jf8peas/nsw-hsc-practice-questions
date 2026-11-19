import "server-only";

import { NextResponse } from "next/server";

import { getQuestion } from "@/content";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { deleteRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import { finaliseUnseenDecline, getUnseenPhase } from "@/lib/db/queries/unseen-phases.server";
import { unseenDiscussion } from "@/lib/grading.server";
import { saveFinalAndRespond } from "@/lib/unseen/grade-handler.server";
import { logUnseen } from "@/lib/unseen/log.server";
import { checkUserRateLimit } from "@/lib/ratelimit.server";
import { attemptFieldsOf, verifyAttemptToken } from "@/lib/tokens.server";
import { retryOffered } from "@/lib/unseen/scoring";
import { gradeResultFrom } from "@/lib/unseen/views";

// "Skip the retry and see the model answer" (spec 008 FR-020): records the first try's mark as the
// question's recorded mark and finishes the question. No marker call and no daily-limit slot, so it
// works whatever the day's allowance. The body is exactly attemptId, questionId and the signed
// attempt token (constitution Principle I, 2.15.0).

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });
const bad = (error: string, status = 400) => json({ error }, status);

export async function handleUnseenDecline(req: Request, user: { id: string }): Promise<NextResponse> {
  const start = Date.now();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_request");
  }
  const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  if (!attemptId || !questionId || typeof body.attemptToken !== "string") return bad("invalid_request");

  const verified = verifyAttemptToken(body.attemptToken, { uid: user.id, attemptId });
  if (!verified.ok) return bad("invalid_attempt_token", 401);
  const token = verified.payload;
  if (!token.questionIds.includes(questionId)) return bad("not_found", 404);
  if (getQuestion(questionId)?.question.type !== "unseen") return bad("not_found", 404);

  const limit = await checkUserRateLimit(user.id);
  if (!limit.ok) {
    return json(
      { error: "rate_limited", retryAfter: limit.retryAfter },
      429,
      limit.retryAfter ? { "retry-after": String(limit.retryAfter) } : undefined,
    );
  }

  try {
    const row = await dbCall((db) => getUnseenPhase(db, user.id, attemptId, questionId));
    if (!row) return bad("phase_refused");
    if (row.status === "final") {
      return json({ error: "already_answered", result: gradeResultFrom(row, unseenDiscussion(questionId)) }, 409);
    }
    if (!retryOffered(row.try1Mark, row.maxMarks)) return bad("phase_refused");

    const ended = await dbCall((db) => finaliseUnseenDecline(db, user.id, attemptId, questionId));
    if (!ended) {
      const again = await dbCall((db) => getUnseenPhase(db, user.id, attemptId, questionId));
      return json({ error: "already_answered", result: again ? gradeResultFrom(again, unseenDiscussion(questionId)) : undefined }, 409);
    }
    await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});
    logUnseen({ outcome: "declined", userId: user.id, questionId, durationMs: Date.now() - start });
    return saveFinalAndRespond({
      userId: user.id,
      attemptId,
      attempt: attemptFieldsOf(token),
      result: gradeResultFrom(ended, unseenDiscussion(questionId)),
      row: ended,
    });
  } catch (error) {
    if (error instanceof DbUnavailableError) return bad("temporarily_unavailable", 503);
    throw error;
  }
}

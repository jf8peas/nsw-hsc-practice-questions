import { NextResponse } from "next/server";

import { getQuestion } from "@/content";
import { authenticate } from "@/lib/api-auth.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { flagParagraphPhase, getParagraphPhase } from "@/lib/db/queries/paragraph-phases.server";
import { logParagraph } from "@/lib/paragraph/log.server";
import { checkFlagRateLimit } from "@/lib/ratelimit.server";
import { verifyAttemptToken } from "@/lib/tokens.server";

export const runtime = "nodejs";

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });
const bad = (error: string, status = 400) => json({ error }, status);

/**
 * "This mark seems wrong" (spec 007 FR-029): flag a marker-marked, final paragraph answer for the
 * teacher to review offline. The body is exactly `attemptId`, `questionId` and the signed attempt
 * token (constitution Principle I). Stored once (a repeat, or a second tab, changes nothing and
 * answers the same done state). It never reads or writes a mark, a result or a concept outcome.
 */
export async function POST(req: Request) {
  const auth = await authenticate();
  if (auth.response) return auth.response;
  const user = auth.user;
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
  if (!verified.payload.questionIds.includes(questionId)) return bad("not_found", 404);
  if (getQuestion(questionId)?.question.type !== "paragraph") return bad("not_found", 404);

  const limit = await checkFlagRateLimit(user.id);
  if (!limit.ok) {
    return json(
      { error: "rate_limited", retryAfter: limit.retryAfter },
      429,
      limit.retryAfter ? { "retry-after": String(limit.retryAfter) } : undefined,
    );
  }

  try {
    const row = await dbCall((db) => getParagraphPhase(db, user.id, attemptId, questionId));
    if (!row) return bad("not_found", 404);
    if (row.mode !== "marker") return bad("not_flaggable");
    if (row.status !== "final") return bad("not_final", 409);

    const stored = await dbCall((db) => flagParagraphPhase(db, user.id, attemptId, questionId));
    logParagraph({ outcome: stored ? "flagged" : "flag_repeat", userId: user.id, questionId, durationMs: Date.now() - start });
    return json(stored ? { flagged: true } : { flagged: true, already: true });
  } catch (error) {
    if (error instanceof DbUnavailableError) return bad("temporarily_unavailable", 503);
    throw error;
  }
}

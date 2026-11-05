import { NextResponse } from "next/server";

import { authenticate } from "@/lib/api-auth.server";
import { getQuestion } from "@/content";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { getAttemptForUser } from "@/lib/db/queries/attempts.server";
import { upsertRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import { getParagraphPhase } from "@/lib/db/queries/paragraph-phases.server";
import { getRewritePhase } from "@/lib/db/queries/rewrite-phases.server";
import { checkDraftRateLimit } from "@/lib/ratelimit.server";
import { verifyAttemptToken } from "@/lib/tokens.server";

export const runtime = "nodejs";

const MAX_DRAFT_LEN = 6000;

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });
const bad = (error: string, status = 400) => json({ error }, status);

/**
 * Save the in-progress draft text for one phase of a rewrite question (spec 006 FR-053/FR-054),
 * so a resume on another device restores what the student had typed. Fire-and-forget from the
 * client (`navigator.sendBeacon` on blur / page hide / visibility change); the quiz never waits
 * on it (constitution Principle VI). The draft is the student's own text — never answer-key
 * material — and is deleted with the student (Principle II, amended 2.13.0).
 *
 * Stale check: once the phase is already graded (a phase row exists for phase 1; the phase row's
 * status is final for phase 2), or the attempt is complete, nothing is written and the route
 * returns `200 { saved: false }` — the client's pagehide/visibilitychange handler beacons both
 * phases' text whenever the page is hidden, including already-submitted text.
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
  const phase: 1 | 2 | null =
    body.phase === 1 || body.phase === "1" ? 1 : body.phase === 2 || body.phase === "2" ? 2 : null;
  const draft = typeof body.draft === "string" ? body.draft.slice(0, MAX_DRAFT_LEN) : null;
  if (!attemptId || !questionId || phase === null || draft === null || typeof body.attemptToken !== "string") {
    return bad("invalid_request");
  }

  // The signed attempt token proves who the attempt belongs to and which questions it contains.
  const verified = verifyAttemptToken(body.attemptToken, { uid: user.id, attemptId });
  if (!verified.ok) return json({ error: "invalid_attempt_token" }, 401);
  const token = verified.payload;
  if (!token.questionIds.includes(questionId)) return bad("not_found", 404);
  const found = getQuestion(questionId);
  // serves the sentence unit (spec 006) and the paragraph unit (spec 007)
  if (!found || (found.question.type !== "rewrite" && found.question.type !== "paragraph")) return bad("not_found", 404);
  const isParagraph = found.question.type === "paragraph";

  // A dedicated per-user limiter, separate from the grading limits (research R5.2).
  const perUser = await checkDraftRateLimit(user.id);
  if (!perUser.ok) {
    return json(
      { error: "rate_limited", retryAfter: perUser.retryAfter },
      429,
      perUser.retryAfter ? { "retry-after": String(perUser.retryAfter) } : undefined,
    );
  }

  try {
    // Stale check: once the attempt is complete nothing is written (the client's pagehide /
    // visibilitychange handler beacons both phases' text whenever the page is hidden, including
    // already-submitted text). The attempt is scoped to the session user.
    const attempt = await dbCall((db) => getAttemptForUser(db, user.id, attemptId));
    if (attempt?.completedAt) {
      return json({ saved: false });
    }
    // Stale check: a phase row exists for phase 1 (already graded), or the phase row is final for
    // phase 2 (the question is final) — write nothing.
    const phaseRow = isParagraph
      ? await dbCall((db) => getParagraphPhase(db, user.id, attemptId, questionId))
      : await dbCall((db) => getRewritePhase(db, user.id, attemptId, questionId));
    if (phaseRow && (phase === 1 || phaseRow.status === "final")) {
      return json({ saved: false });
    }
    await dbCall((db) => upsertRewriteDraft(db, user.id, attemptId, token.unitId, questionId, phase, draft));
  } catch (error) {
    if (!(error instanceof DbUnavailableError)) throw error;
    return bad("temporarily_unavailable", 503);
  }
  return json({ saved: true });
}
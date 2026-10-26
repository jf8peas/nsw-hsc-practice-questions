import { NextResponse } from "next/server";

import { resolveSession } from "@/lib/auth.server";
import { saveResult } from "@/lib/results/save.server";
import { verifyReceipt } from "@/lib/tokens.server";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

/**
 * Re-send a result whose save failed (or that was marked while the database
 * was down). Idempotent: a result is stored exactly once however often this is
 * retried, and a missing attempt row is created from the receipt's attempt
 * fields first (research R19).
 */
export async function POST(req: Request) {
  const session = await resolveSession();
  if (session.kind === "none") {
    // A receipt for a student who no longer exists is discarded: the client drops it silently.
    if (session.reason === "student_missing") return json({ error: "student_not_found" }, 410);
    return json({ error: "unauthenticated" }, 401);
  }
  // This route needs the database by nature: the outbox keeps the receipt and backs off.
  if (session.kind === "unverified") return json({ error: "temporarily_unavailable" }, 503);
  const user = session.user;

  let body: { receipt?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  const verified = verifyReceipt(body.receipt, { uid: user.id });
  if (!verified.ok) {
    if (verified.reason === "wrong_user") return json({ error: "forbidden" }, 403);
    return json({ error: "invalid_receipt" }, 400);
  }
  const r = verified.payload;

  let outcome;
  try {
    outcome = await saveResult(user.id, r.attemptId, r.attempt, {
      questionId: r.questionId,
      answer: r.answer,
      marks: r.marks,
      max: r.max,
      gradedBy: r.gradedBy,
      feedback: r.feedback,
      hits: r.hits,
      misses: r.misses,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AttemptOwnerMismatchError") {
      return json({ error: "forbidden" }, 403);
    }
    throw error;
  }

  if (outcome.status === "failed") {
    // Still can't save (database down, or an unexpected error): keep the receipt and back off.
    return json({ error: "temporarily_unavailable" }, 503);
  }
  return json({ saved: true, duplicate: !outcome.inserted, attemptCompleted: outcome.completed });
}


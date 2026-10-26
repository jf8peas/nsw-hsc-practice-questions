import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getUnit } from "@/content";
import { resolveSession } from "@/lib/auth.server";
import { DEFAULT_PASS_MARK, drawAttempt, toPublicQuestions } from "@/lib/attempts/draw.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { createAttempt } from "@/lib/db/queries/attempts.server";
import { checkAttemptRateLimit } from "@/lib/ratelimit.server";
import { signAttemptToken } from "@/lib/tokens.server";

export const runtime = "nodejs";

/**
 * Start a new attempt: draw the questions on the server (research R14) and
 * return public question data plus a signed attempt token.
 *
 * Degraded-capable (research R19): if the database is unavailable the draw
 * still happens and the response has `persisted: false`; nothing is stored,
 * and resume is not offered. The attempt row is created later, from the
 * attempt fields in a result receipt, when the first result is saved.
 */
export async function POST(req: Request) {
  const session = await resolveSession();
  if (session.kind === "none") {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const user = session.user;

  let body: { unitId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const unitId = typeof body.unitId === "string" ? body.unitId : "";
  const unit = getUnit(unitId);
  if (!unit) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const rl = await checkAttemptRateLimit(user.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: rl.retryAfter },
      {
        status: 429,
        headers: rl.retryAfter ? { "retry-after": String(rl.retryAfter) } : undefined,
      },
    );
  }

  const drawn = drawAttempt(unit);
  const attemptId = randomUUID();

  let persisted = session.kind === "user";
  if (persisted) {
    try {
      await dbCall((db) =>
        createAttempt(db, {
          id: attemptId,
          userId: user.id,
          unitId: unit.id,
          questionIds: drawn.questionIds,
          mcOptionOrder: drawn.mcOptionOrder,
        }),
      );
    } catch (error) {
      if (!(error instanceof DbUnavailableError)) throw error;
      persisted = false;
    }
  }

  const attemptToken = signAttemptToken({
    uid: user.id,
    attemptId,
    unitId: unit.id,
    questionIds: drawn.questionIds,
    mcOptionOrder: drawn.mcOptionOrder,
  });

  return NextResponse.json(
    {
      attemptId,
      attemptToken,
      persisted,
      unitId: unit.id,
      passMark: unit.quiz?.passMark ?? DEFAULT_PASS_MARK,
      questions: toPublicQuestions(drawn.questionIds, drawn.mcOptionOrder),
      answered: {},
    },
    { status: 201 },
  );
}

import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getUnit } from "@/content";
import { resolveSession } from "@/lib/auth.server";
import { DEFAULT_PASS_MARK, drawAttempt, toPublicQuestions } from "@/lib/attempts/draw.server";
import { loadWeighting, type Weighting } from "@/lib/concepts/weighting.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { createAttempt } from "@/lib/db/queries/attempts.server";
import { checkAttemptRateLimit } from "@/lib/ratelimit.server";
import { startSequential } from "@/lib/paragraph/start.server";
import { startComparative } from "@/lib/comparative/start.server";
import { startUnseen } from "@/lib/unseen/start.server";
import { startEssay } from "@/lib/essay/start.server";
import { startEnglishEssay } from "@/lib/english-essay/start.server";
import { getQuestion } from "@/content";
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

  let body: { unitId?: unknown; questionId?: unknown };
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

  // The essay-writing unit (spec 010): the student picks an essay (`questionId`, re-checked against the live essays) or
  // resumes the one open attempt. It cannot choose or resume without the database, so an unreadable database is a 503
  // (constitution Principle VI); it never starts degraded and never guesses.
  if (unit.flow === "essay") {
    if (session.kind !== "user") {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    const wanted = typeof body.questionId === "string" ? body.questionId : undefined;
    if (body.questionId !== undefined && wanted === undefined) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    const started = await startEssay(user.id, wanted);
    if (started.kind === "unavailable") {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    if (started.kind === "not_found") return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (started.kind === "no_open_attempt") return NextResponse.json({ error: "no_open_attempt" }, { status: 404 });
    if (started.kind === "attempt_open") {
      return NextResponse.json({ error: "attempt_open", questionId: started.questionId }, { status: 409 });
    }
    const attemptToken = signAttemptToken({
      uid: user.id,
      attemptId: started.attempt.id,
      unitId: unit.id,
      questionIds: [started.essay.id],
      mcOptionOrder: {},
    });
    return NextResponse.json(
      {
        attemptId: started.attempt.id,
        attemptToken,
        persisted: true,
        unitId: unit.id,
        passMark: unit.quiz?.passMark ?? DEFAULT_PASS_MARK,
        questions: [getQuestion(started.essay.id)!.question],
        answered: {},
        essayState: started.essayState,
        ...(started.created ? {} : { resumed: true }),
      },
      { status: started.created ? 201 : 200 },
    );
  }

  // The English essay-writing unit (spec 011): the same shape as the Economics essay flow with its own start, state and
  // unique index. The student picks an essay (`questionId`, re-checked against the live essays) or resumes the one open
  // attempt; it never starts degraded and never guesses (constitution Principle VI).
  if (unit.flow === "englishEssay") {
    if (session.kind !== "user") {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    const wanted = typeof body.questionId === "string" ? body.questionId : undefined;
    if (body.questionId !== undefined && wanted === undefined) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    const started = await startEnglishEssay(user.id, wanted);
    if (started.kind === "unavailable") {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    if (started.kind === "not_found") return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (started.kind === "no_open_attempt") return NextResponse.json({ error: "no_open_attempt" }, { status: 404 });
    if (started.kind === "attempt_open") {
      return NextResponse.json({ error: "attempt_open", questionId: started.questionId }, { status: 409 });
    }
    const attemptToken = signAttemptToken({
      uid: user.id,
      attemptId: started.attempt.id,
      unitId: unit.id,
      questionIds: [started.essay.id],
      mcOptionOrder: {},
    });
    return NextResponse.json(
      {
        attemptId: started.attempt.id,
        attemptToken,
        persisted: true,
        unitId: unit.id,
        passMark: unit.quiz?.passMark ?? DEFAULT_PASS_MARK,
        questions: [started.essay],
        answered: {},
        englishEssayState: started.englishEssayState,
        ...(started.created ? {} : { resumed: true }),
      },
      { status: started.created ? 201 : 200 },
    );
  }

  // A sequential unit (spec 007): the next part of the student's essay, derived from their results.
  // Not random and not weighted; two tabs starting at once end on the same attempt. It cannot guess
  // a place without reading results, so an unreadable database is a 503 (constitution Principle VI).
  if (unit.sequence) {
    if (session.kind !== "user") {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    const started = await startSequential(user.id, unit);
    if (started.kind === "unavailable") {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    if (started.kind === "finished") {
      return NextResponse.json({ finished: true, essayTotal: started.essayTotal }, { status: 200 });
    }
    const { attempt, question } = started;
    const attemptToken = signAttemptToken({
      uid: user.id,
      attemptId: attempt.id,
      unitId: unit.id,
      questionIds: [question.id],
      mcOptionOrder: {},
    });
    return NextResponse.json(
      {
        attemptId: attempt.id,
        attemptToken,
        persisted: true,
        unitId: unit.id,
        passMark: unit.quiz?.passMark ?? DEFAULT_PASS_MARK,
        questions: [question],
        answered: {},
        essay: started.essay,
        paragraphState: started.paragraphState,
        ...(started.created ? {} : { resumed: true }),
      },
      { status: started.created ? 201 : 200 },
    );
  }

  // The unseen-text unit (spec 008): an unfinished question first, otherwise one unanswered question
  // drawn from the student's results. It cannot choose or resume without the database, so an unreadable
  // database is a 503 (constitution Principle VI); it never starts degraded and never guesses.
  // The comparative unit (spec 009) is the same flow with two texts: same rules, its own start and state.
  if (unit.draw?.kind === "comparative-weighted") {
    if (session.kind !== "user") {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    const started = await startComparative(user.id, unit);
    if (started.kind === "unavailable") {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    if (started.kind === "finished") {
      return NextResponse.json({ finished: true, total: started.total, answered: started.answered }, { status: 200 });
    }
    const { attempt, question } = started;
    const attemptToken = signAttemptToken({
      uid: user.id,
      attemptId: attempt.id,
      unitId: unit.id,
      questionIds: [question.id],
      mcOptionOrder: {},
    });
    return NextResponse.json(
      {
        attemptId: attempt.id,
        attemptToken,
        persisted: true,
        unitId: unit.id,
        passMark: unit.quiz?.passMark ?? DEFAULT_PASS_MARK,
        questions: [question],
        answered: {},
        comparativeState: started.comparativeState,
        ...(started.created ? {} : { resumed: true }),
      },
      { status: started.created ? 201 : 200 },
    );
  }

  if (unit.draw) {
    if (session.kind !== "user") {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    const started = await startUnseen(user.id, unit);
    if (started.kind === "unavailable") {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    if (started.kind === "finished") {
      return NextResponse.json({ finished: true, total: started.total, answered: started.answered }, { status: 200 });
    }
    const { attempt, question } = started;
    const attemptToken = signAttemptToken({
      uid: user.id,
      attemptId: attempt.id,
      unitId: unit.id,
      questionIds: [question.id],
      mcOptionOrder: {},
    });
    return NextResponse.json(
      {
        attemptId: attempt.id,
        attemptToken,
        persisted: true,
        unitId: unit.id,
        passMark: unit.quiz?.passMark ?? DEFAULT_PASS_MARK,
        questions: [question],
        answered: {},
        unseenState: started.unseenState,
        ...(started.created ? {} : { resumed: true }),
      },
      { status: started.created ? 201 : 200 },
    );
  }

  // Weighted toward the student's weak concepts (spec 002 US4). Any failure to read their
  // results means an ordinary draw: a quiz always starts (FR-046, Principle VI).
  let weighting: Weighting | null = null;
  if (session.kind === "user" && unit.conceptsReady) {
    try {
      weighting = await dbCall((db) => loadWeighting(db, user.id, unit));
    } catch {
      weighting = null;
    }
  }
  const drawn = drawAttempt(unit, undefined, weighting ?? undefined);
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

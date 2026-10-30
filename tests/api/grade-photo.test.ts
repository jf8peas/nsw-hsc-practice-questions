// Photo answers through POST /api/grade: transcription token verification,
// hash matching, the handwriting system prompt, and spending the carried slot
// (specs/004-photo-answers/contracts/api.md, TASK-106).

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { dailyAiUsage } from "@/lib/db/schema";
import { formatAnswer } from "@/lib/transcribe-format";
import { hashAnswer, signTranscriptionToken } from "@/lib/tokens.server";

import {
  firstOf,
  post,
  setupRouteEnv,
  signedInStudent,
  startAttempt,
  type RouteEnv,
  type StartedAttempt,
} from "../helpers/routes";

let env: RouteEnv;
afterEach(async () => {
  delete process.env.LLM_DAILY_CAP;
  await env?.close();
});

async function grade(
  started: StartedAttempt,
  questionId: string,
  answer: string,
  transcriptionToken?: string,
) {
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(
    post("/api/grade", {
      attemptId: started.attemptId,
      attemptToken: started.attemptToken,
      questionId,
      answer,
      ...(transcriptionToken ? { transcriptionToken } : {}),
    }),
  );
  return { status: res.status, body: await res.json() };
}

const usedBy = async (userId: string) =>
  (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce(
    (s, r) => s + r.count,
    0,
  );

const TRANSCRIPTION = "F = ma";

function tokenFor(
  user: { id: string },
  started: StartedAttempt,
  questionId: string,
  transcription: string = TRANSCRIPTION,
  nowMs: number = Date.now(),
) {
  return signTranscriptionToken(
    {
      uid: user.id,
      attemptId: started.attemptId,
      questionId,
      transcriptionHash: hashAnswer(transcription),
      readCount: 1,
      reservedSlot: { userId: user.id, sydneyDate: "2026-10-29" },
    },
    nowMs,
  );
}

describe("photo answers through /api/grade", () => {
  it("grades a photo answer with a valid token, adds the handwriting prompt, and spends the carried slot", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");
    const answer = formatAnswer(TRANSCRIPTION);

    const { status, body } = await grade(started, q.id, answer, tokenFor(user, started, q.id));
    expect(status).toBe(200);
    expect(body.saved).toBe(true);
    expect(env.llm).toHaveBeenCalledTimes(1);
    const args = env.llm.mock.calls[0][0] as { handwritten?: boolean; answer: string };
    expect(args.handwritten).toBe(true);
    expect(args.answer).toBe(answer);
    // The slot was already reserved by /api/transcribe: grading must not reserve a second one.
    expect(await usedBy(user.id)).toBe(0);
  });

  it("rejects a tampered transcription token", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    const { status, body } = await grade(started, q.id, formatAnswer(TRANSCRIPTION), "tampered");
    expect(status).toBe(400);
    expect(body.error).toBe("invalid_request");
    expect(env.llm).not.toHaveBeenCalled();
  });

  it("rejects a token bound to a different question", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");
    const other = started.questions.find((x) => x.type === "short" && x.id !== q.id);

    const { status } = await grade(started, q.id, formatAnswer(TRANSCRIPTION), tokenFor(user, started, other!.id));
    expect(status).toBe(400);
  });

  it("rejects a transcription hash mismatch", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    // Token signed for "F = ma" but the answer carries different text.
    const answer = formatAnswer("F = ma\nv = u + at");
    const { status } = await grade(started, q.id, answer, tokenFor(user, started, q.id));
    expect(status).toBe(400);
    expect(env.llm).not.toHaveBeenCalled();
  });

  it("rejects an expired transcription token", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    const expired = tokenFor(user, started, q.id, TRANSCRIPTION, Date.now() - 3 * 60 * 60 * 1000);
    const { status } = await grade(started, q.id, formatAnswer(TRANSCRIPTION), expired);
    expect(status).toBe(400);
  });

  it("grades as a typed answer when the student switched to Type after a read (no transcription marker)", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    // The token is valid but the answer is plain typed text: the carried slot is
    // spent and the answer is graded without the handwriting prompt line.
    const { status, body } = await grade(started, q.id, "typed answer", tokenFor(user, started, q.id));
    expect(status).toBe(200);
    expect(body.saved).toBe(true);
    const args = env.llm.mock.calls[0][0] as { handwritten?: boolean; answer: string };
    expect(args.handwritten).toBe(false);
    expect(args.answer).toBe("typed answer");
    expect(await usedBy(user.id)).toBe(0);
  });
});
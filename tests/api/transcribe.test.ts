// POST /api/transcribe: photo upload, validation, vision call, transcription token
// (specs/004-photo-answers/contracts/api.md).

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dailyAiUsage, results } from "@/lib/db/schema";
import type { ChatResult } from "@/lib/openrouter.server";

import { setupTestEnv, type TestEnv } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";
import { firstOf, startAttempt, type StartedAttempt } from "../helpers/routes";

/** A tiny buffer whose magic bytes look like a JPEG (FF D8 FF). */
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x00, 0x00]);

interface TranscribeEnv extends TestEnv {
  vision: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<ChatResult>>>;
}

async function setupTranscribeEnv(): Promise<TranscribeEnv> {
  process.env.VISION_MODEL = "deepseek/deepseek-v4.1-flash";
  const env = await setupTestEnv();
  const vision = vi.fn<(...args: unknown[]) => Promise<ChatResult>>(async () => ({
    ok: true,
    content: JSON.stringify({ transcription: "F = ma", legible: true, answersQuestion: true, notes: "" }),
  }));
  vi.doMock("@/lib/openrouter.server", () => ({
    llmGradingConfigured: () => true,
    gradeShortAnswer: async () => null,
    chatCompletion: (...args: unknown[]) => vision(...args),
  }));
  return Object.assign(env, { vision });
}

let env: TranscribeEnv;
afterEach(async () => {
  delete process.env.VISION_MODEL;
  delete process.env.LLM_DAILY_CAP;
  delete process.env.GRADE_RATE_LIMIT;
  await env?.close();
});

function transcribeRequest(
  started: StartedAttempt,
  questionId: string,
  images: Blob[],
  note?: string,
  overrides: Record<string, string> = {},
): Request {
  const form = new FormData();
  form.append("attemptId", overrides.attemptId ?? started.attemptId);
  form.append("attemptToken", overrides.attemptToken ?? started.attemptToken);
  form.append("questionId", questionId);
  for (const img of images) form.append("images", img, "photo.jpg");
  if (note) form.append("note", note);
  return new Request("http://localhost/api/transcribe", { method: "POST", body: form });
}

const imageBlob = (bytes: Buffer = JPEG, size?: number) => {
  const buf = size ? Buffer.concat([bytes, Buffer.alloc(size - bytes.length)]) : bytes;
  return new Blob([new Uint8Array(buf)], { type: "image/jpeg" });
};

async function transcribe(
  started: StartedAttempt,
  questionId: string,
  images: Blob[],
  note?: string,
  overrides: Record<string, string> = {},
) {
  const { POST } = await import("@/app/api/transcribe/route");
  const res = await POST(transcribeRequest(started, questionId, images, note, overrides));
  return { status: res.status, body: await res.json() };
}

const usedBy = async (userId: string) =>
  (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce(
    (s, r) => s + r.count,
    0,
  );

describe("POST /api/transcribe", () => {
  it("transcribes a valid photo and returns a signed token bound to the transcription", async () => {
    env = await setupTranscribeEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    const { status, body } = await transcribe(started, q.id, [imageBlob()]);
    expect(status).toBe(200);
    expect(body.transcription).toBe("F = ma");
    expect(typeof body.transcriptionHtml).toBe("string");
    expect(typeof body.transcriptionToken).toBe("string");
    expect(body.readCount).toBe(1);
    expect(body.reservedSlot).toBeDefined();
    expect(await usedBy(user.id)).toBe(1);

    const { verifyTranscriptionToken } = await import("@/lib/tokens.server");
    const verified = verifyTranscriptionToken(body.transcriptionToken, {
      uid: user.id,
      attemptId: started.attemptId,
      questionId: q.id,
    });
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.payload.readCount).toBe(1);
      expect(verified.payload.reservedSlot?.userId).toBe(user.id);
    }
  });

  it("answers 401 when signed out", async () => {
    env = await setupTranscribeEnv();
    const { POST } = await import("@/app/api/transcribe/route");
    const form = new FormData();
    form.append("attemptId", "x");
    form.append("attemptToken", "x");
    form.append("questionId", "x");
    form.append("images", imageBlob(), "photo.jpg");
    const res = await POST(
      new Request("http://localhost/api/transcribe", { method: "POST", body: form }),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthenticated" });
  });

  it("answers 400 for missing fields and for a note over 500 characters", async () => {
    env = await setupTranscribeEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    const { POST } = await import("@/app/api/transcribe/route");
    const empty = new Request("http://localhost/api/transcribe", { method: "POST", body: new FormData() });
    expect((await POST(empty)).status).toBe(400);

    const { status } = await transcribe(started, q.id, [imageBlob()], "x".repeat(501));
    expect(status).toBe(400);
  });

  it("answers 403 for an invalid attempt token", async () => {
    env = await setupTranscribeEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");
    const { status, body } = await transcribe(started, q.id, [imageBlob()], undefined, {
      attemptToken: "tampered",
    });
    expect(status).toBe(403);
    expect(body.error).toBe("invalid_attempt_token");
  });

  it("answers 404 when the question is not in the attempt or is not short-answer", async () => {
    env = await setupTranscribeEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const mc = firstOf(started.questions, "mc");
    const { status } = await transcribe(started, mc.id, [imageBlob()]);
    expect(status).toBe(404);
  });

  it("answers 400 for a file that is not an image and for an oversized image", async () => {
    env = await setupTranscribeEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    const notImage = new Blob([Buffer.from("hello world, definitely not an image")], {
      type: "image/jpeg",
    });
    const { status: badStatus, body } = await transcribe(started, q.id, [notImage]);
    expect(badStatus).toBe(400);
    expect(body.error).toBe("invalid_image");

    const big = imageBlob(JPEG, 1.5 * 1024 * 1024 + 1);
    const { status: bigStatus, body: bigBody } = await transcribe(started, q.id, [big]);
    expect(bigStatus).toBe(400);
    expect(bigBody.error).toBe("image_too_large");
  });

  it("answers 409 before any AI call when the question already has a result", async () => {
    env = await setupTranscribeEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    await env.db.insert(results).values({
      attemptId: started.attemptId,
      userId: user.id,
      unitId: "y11-physics-preliminary",
      questionId: q.id,
      answer: "already done",
      marksAwarded: 1,
      maxMarks: q.maxMarks,
      gradedBy: "llm",
      feedback: "ok",
      rubricHits: [],
      rubricMisses: [],
      createdAt: new Date(),
    });

    const { status, body } = await transcribe(started, q.id, [imageBlob()]);
    expect(status).toBe(409);
    expect(body.error).toBe("already_answered");
    expect(env.vision).not.toHaveBeenCalled();
  });

  it("refunds the slot and returns a self-mark token when the photo is illegible", async () => {
    env = await setupTranscribeEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");
    env.vision.mockResolvedValueOnce({
      ok: true,
      content: JSON.stringify({ transcription: "", legible: false, answersQuestion: true, notes: "" }),
    });

    const { status, body } = await transcribe(started, q.id, [imageBlob()]);
    expect(status).toBe(400);
    expect(body.error).toBe("illegible");
    expect(typeof body.selfMarkToken).toBe("string");
    expect(body.modelAnswer).toBeDefined();
    expect(await usedBy(user.id)).toBe(0);
  });

  it("refunds the slot and returns a self-mark token when the photo is not an answer", async () => {
    env = await setupTranscribeEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");
    env.vision.mockResolvedValueOnce({
      ok: true,
      content: JSON.stringify({ transcription: "", legible: true, answersQuestion: false, notes: "" }),
    });

    const { status, body } = await transcribe(started, q.id, [imageBlob()]);
    expect(status).toBe(400);
    expect(body.error).toBe("not_answer");
    expect(typeof body.selfMarkToken).toBe("string");
    expect(await usedBy(user.id)).toBe(0);
  });

  it("refunds the slot and returns 500 with a self-mark token when the vision call fails", async () => {
    env = await setupTranscribeEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");
    // The route retries once, so both attempts must fail.
    env.vision.mockResolvedValueOnce({ ok: false, reason: "network" });
    env.vision.mockResolvedValueOnce({ ok: false, reason: "network" });

    const { status, body } = await transcribe(started, q.id, [imageBlob()]);
    expect(status).toBe(500);
    expect(body.error).toBe("model_fail");
    expect(typeof body.selfMarkToken).toBe("string");
    expect(await usedBy(user.id)).toBe(0);
  });

  it("answers 429 over_daily_cap with a self-mark token when the allowance is used up", async () => {
    process.env.LLM_DAILY_CAP = "1";
    env = await setupTranscribeEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    // Use the one allowed slot on another question first.
    const other = started.questions.find((x) => x.type === "short" && x.id !== q.id);
    if (other) {
      const { status } = await transcribe(started, other.id, [imageBlob()]);
      expect(status).toBe(200);
    }

    const { status, body } = await transcribe(started, q.id, [imageBlob()]);
    expect(status).toBe(429);
    expect(body.error).toBe("over_daily_cap");
    expect(typeof body.selfMarkToken).toBe("string");
    expect(body.resetsAt).toBeDefined();
    expect(env.vision).toHaveBeenCalledTimes(1); // no read for the capped question
    expect(await usedBy(user.id)).toBe(1);
  });

  it("answers 429 rate_limited when the per-user limit is exceeded", async () => {
    process.env.GRADE_RATE_LIMIT = "2";
    env = await setupTranscribeEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    const { status: first } = await transcribe(started, q.id, [imageBlob()]);
    expect(first).toBe(200);
    const { status: second } = await transcribe(started, q.id, [imageBlob()]);
    expect(second).toBe(200);
    const { status: third, body } = await transcribe(started, q.id, [imageBlob()]);
    expect(third).toBe(429);
    expect(body.error).toBe("rate_limited");
  });
});

async function signedInStudent(env: TestEnv) {
  const row = await seedUser(env.db);
  env.signedInAs({ id: row.id, name: row.name, email: row.email });
  return row;
}
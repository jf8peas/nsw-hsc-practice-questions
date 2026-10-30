// Constitution compliance for photo answers (specs/004-photo-answers, TASK-304):
// 3-read limit, refund rules, no image data stored, production fails closed.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dailyAiUsage, results } from "@/lib/db/schema";
import type { ChatResult } from "@/lib/openrouter.server";

import { setupTestEnv, type TestEnv } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";
import { firstOf, startAttempt, type StartedAttempt } from "../helpers/routes";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x00, 0x00]);

interface ComplianceEnv extends TestEnv {
  vision: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<ChatResult>>>;
}

async function setupComplianceEnv(): Promise<ComplianceEnv> {
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

let env: ComplianceEnv;
afterEach(async () => {
  delete process.env.VISION_MODEL;
  delete process.env.LLM_DAILY_CAP;
  await env?.close();
});

const usedBy = async (userId: string) =>
  (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce(
    (s, r) => s + r.count,
    0,
  );

function transcribeRequest(
  started: StartedAttempt,
  questionId: string,
  readCount?: number,
): Request {
  const form = new FormData();
  form.append("attemptId", started.attemptId);
  form.append("attemptToken", started.attemptToken);
  form.append("questionId", questionId);
  if (readCount !== undefined) form.append("readCount", String(readCount));
  form.append("images", new Blob([JPEG], { type: "image/jpeg" }), "photo.jpg");
  return new Request("http://localhost/api/transcribe", { method: "POST", body: form });
}

async function transcribe(started: StartedAttempt, questionId: string, readCount?: number) {
  const { POST } = await import("@/app/api/transcribe/route");
  const res = await POST(transcribeRequest(started, questionId, readCount));
  return { status: res.status, body: await res.json() };
}

async function signedInStudent(env: TestEnv) {
  const row = await seedUser(env.db);
  env.signedInAs({ id: row.id, name: row.name, email: row.email });
  return row;
}

describe("photo answer constitution compliance", () => {
  it("enforces the 3-read limit: the 4th read is refused before any AI call", async () => {
    process.env.VISION_MODEL = "deepseek/deepseek-v4.1-flash";
    env = await setupComplianceEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    // Reads 1-3 succeed, each carrying the incremented count.
    for (const expected of [1, 2, 3]) {
      const { status, body } = await transcribe(started, q.id, expected - 1);
      expect(status).toBe(200);
      expect(body.readCount).toBe(expected);
    }
    // The 4th read is refused with over_read_limit and no AI call.
    const { status, body } = await transcribe(started, q.id, 3);
    expect(status).toBe(429);
    expect(body.error).toBe("over_read_limit");
    expect(typeof body.selfMarkToken).toBe("string");
    expect(env.vision).toHaveBeenCalledTimes(3);
    expect(await usedBy(user.id)).toBe(1); // one slot for the question, never more
  });

  it("refuses a malformed readCount", async () => {
    process.env.VISION_MODEL = "deepseek/deepseek-v4.1-flash";
    env = await setupComplianceEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");
    for (const bad of [-1, 1.5, "x"]) {
      const { status } = await transcribe(started, q.id, bad as number);
      expect(status).toBe(400);
    }
    // A count beyond the limit is refused as over_read_limit, not malformed.
    const { status } = await transcribe(started, q.id, 4);
    expect(status).toBe(429);
  });

  it("fails closed with 503 when VISION_MODEL is not configured", async () => {
    delete process.env.VISION_MODEL;
    env = await setupComplianceEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    const { status, body } = await transcribe(started, q.id);
    expect(status).toBe(503);
    expect(body.error).toBe("model_unavailable");
    expect(env.vision).not.toHaveBeenCalled();
  });

  it("never stores image data: only the usage slot row exists after a read", async () => {
    process.env.VISION_MODEL = "deepseek/deepseek-v4.1-flash";
    env = await setupComplianceEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    const { status } = await transcribe(started, q.id);
    expect(status).toBe(200);

    // No result row (nothing was graded yet) and the usage row holds only counts.
    expect(await env.db.select().from(results).where(eq(results.attemptId, started.attemptId))).toHaveLength(0);
    const usage = await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, user.id));
    expect(usage).toHaveLength(1);
    expect(usage[0].count).toBe(1);
    const serialized = JSON.stringify(usage[0]);
    expect(serialized).not.toContain("0xffd8");
    expect(serialized).not.toContain("base64");
  });

  it("refunds the slot on illegible, not-answer and model failure (one slot per question)", async () => {
    process.env.VISION_MODEL = "deepseek/deepseek-v4.1-flash";
    env = await setupComplianceEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");

    env.vision.mockResolvedValueOnce({
      ok: true,
      content: JSON.stringify({ transcription: "", legible: false, answersQuestion: true, notes: "" }),
    });
    expect((await transcribe(started, q.id)).status).toBe(400);
    expect(await usedBy(user.id)).toBe(0);

    env.vision.mockResolvedValueOnce({
      ok: true,
      content: JSON.stringify({ transcription: "", legible: true, answersQuestion: false, notes: "" }),
    });
    expect((await transcribe(started, q.id)).status).toBe(400);
    expect(await usedBy(user.id)).toBe(0);

    env.vision.mockResolvedValueOnce({ ok: false, reason: "network" });
    env.vision.mockResolvedValueOnce({ ok: false, reason: "network" });
    expect((await transcribe(started, q.id)).status).toBe(500);
    expect(await usedBy(user.id)).toBe(0);
  });
});
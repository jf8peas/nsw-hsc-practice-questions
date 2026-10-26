// The per-student daily allowance on AI-graded short answers (FR-017 to FR-019, SC-006).

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { dailyAiUsage, results } from "@/lib/db/schema";

import { asSessionUser } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";
import {
  correctDisplayIndex,
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
  delete process.env.GRADE_RATE_LIMIT;
  await env?.close();
});

async function grade(started: StartedAttempt, questionId: string, answer: string) {
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(
    post("/api/grade", {
      attemptId: started.attemptId,
      attemptToken: started.attemptToken,
      questionId,
      answer,
    }),
  );
  return { status: res.status, body: await res.json() };
}

const shortsOf = (started: StartedAttempt) => started.questions.filter((q) => q.type === "short");
const usedBy = async (userId: string) =>
  (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce((s, r) => s + r.count, 0);

describe("counting", () => {
  it("a successful AI-graded answer counts toward the allowance", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const { body } = await grade(started, shortsOf(started)[0].id, "an answer");
    expect(body.result.needsSelfMark).toBe(false);
    expect(body.aiLimit).toBeUndefined();
    expect(await usedBy(user.id)).toBe(1);
    expect(env.llm).toHaveBeenCalledTimes(1);
  });

  it("an LLM failure refunds the slot and falls back to self-marking with a token", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    env.llm.mockResolvedValueOnce(null);
    const { status, body } = await grade(started, shortsOf(started)[0].id, "an answer");
    expect(status).toBe(200);
    expect(body.result.needsSelfMark).toBe(true);
    expect(typeof body.selfMarkToken).toBe("string");
    expect(body.aiLimit).toBeUndefined();
    expect(body.aiUnavailable).toBeUndefined();
    expect(await usedBy(user.id)).toBe(0);
  });

  it("an LLM that throws also gives the slot back", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    env.llm.mockRejectedValueOnce(new Error("provider exploded"));
    await expect(grade(started, shortsOf(started)[0].id, "an answer")).rejects.toThrow("provider exploded");
    expect(await usedBy(user.id)).toBe(0);
  });

  it("an empty short answer never reserves a slot or calls the LLM", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const { body } = await grade(started, shortsOf(started)[0].id, "   ");
    expect(body.result.marksAwarded).toBe(0);
    expect(env.llm).not.toHaveBeenCalled();
    expect(await usedBy(user.id)).toBe(0);
  });

  it("MC answers are never counted", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    for (const q of started.questions.filter((x) => x.type === "mc")) {
      expect((await grade(started, q.id, "0")).status).toBe(200);
    }
    expect(await usedBy(user.id)).toBe(0);
  });
});

describe("over the allowance", () => {
  it("falls back to self-marking with aiLimit { reached, resetsAt } and does not call the LLM", async () => {
    process.env.LLM_DAILY_CAP = "2";
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const [s1, s2, s3] = shortsOf(started);
    expect((await grade(started, s1.id, "a")).body.result.needsSelfMark).toBe(false);
    expect((await grade(started, s2.id, "b")).body.result.needsSelfMark).toBe(false);
    expect(env.llm).toHaveBeenCalledTimes(2);

    const { status, body } = await grade(started, s3.id, "c");
    expect(status).toBe(200);
    expect(body.result.needsSelfMark).toBe(true);
    expect(typeof body.selfMarkToken).toBe("string");
    expect(body.aiLimit).toMatchObject({ reached: true });
    expect(body.aiLimit.resetsAt).toMatch(/^\d{4}-\d\d-\d\dT00:00:00\+1[01]:00$/);
    expect(env.llm).toHaveBeenCalledTimes(2);
    expect(await usedBy(user.id)).toBe(2);
  });

  it("MC is graded normally when the allowance is used up (FR-018)", async () => {
    process.env.LLM_DAILY_CAP = "1";
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    await grade(started, shortsOf(started)[0].id, "a");
    expect((await grade(started, shortsOf(started)[1].id, "b")).body.aiLimit).toBeDefined();
    const mc = firstOf(started.questions, "mc");
    const { status, body } = await grade(started, mc.id, String(correctDisplayIndex(mc)));
    expect(status).toBe(200);
    expect(body.saved).toBe(true);
    expect(body.result.marksAwarded).toBe(mc.maxMarks);
    expect(body.aiLimit).toBeUndefined();
  });

  it("a self-marked answer after a cap fallback is saved as self, and does not count", async () => {
    process.env.LLM_DAILY_CAP = "1";
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    await grade(started, shortsOf(started)[0].id, "a");
    const q = shortsOf(started)[1];
    const { body } = await grade(started, q.id, "second answer");
    expect(body.aiLimit).toBeDefined();
    const { POST } = await import("@/app/api/results/self-mark/route");
    const res = await POST(
      post("/api/results/self-mark", {
        attemptId: started.attemptId,
        attemptToken: started.attemptToken,
        questionId: q.id,
        answer: "second answer",
        correct: true,
        token: body.selfMarkToken,
      }),
    );
    expect(res.status).toBe(200);
    const rows = await env.db.select().from(results).where(eq(results.questionId, q.id));
    expect(rows[0]).toMatchObject({ gradedBy: "self", marksAwarded: q.maxMarks });
    expect(await usedBy(user.id)).toBe(1);
  });

  it("another student still gets AI marking", async () => {
    process.env.LLM_DAILY_CAP = "1";
    env = await setupRouteEnv();
    await signedInStudent(env);
    const mine = await startAttempt();
    await grade(mine, shortsOf(mine)[0].id, "a");
    expect((await grade(mine, shortsOf(mine)[1].id, "b")).body.aiLimit).toBeDefined();

    const other = await seedUser(env.db);
    env.signedInAs(asSessionUser(other));
    const theirs = await startAttempt();
    const { body } = await grade(theirs, shortsOf(theirs)[0].id, "a");
    expect(body.result.needsSelfMark).toBe(false);
    expect(body.aiLimit).toBeUndefined();
  });

  it("the daily count never exceeds the cap under concurrent grading (SC-006)", async () => {
    process.env.LLM_DAILY_CAP = "3";
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const a = await startAttempt();
    const b = await startAttempt();
    const calls = [
      ...shortsOf(a).map((q) => grade(a, q.id, "answer")),
      ...shortsOf(b).map((q) => grade(b, q.id, "answer")),
    ];
    const settled = await Promise.all(calls);
    expect(settled.every((r) => r.status === 200)).toBe(true);
    const aiMarked = settled.filter((r) => !r.body.result.needsSelfMark).length;
    const capped = settled.filter((r) => r.body.aiLimit).length;
    expect(aiMarked).toBe(3);
    expect(capped).toBe(settled.length - 3);
    expect(env.llm).toHaveBeenCalledTimes(3);
    expect(await usedBy(user.id)).toBe(3);
  });
});

describe("AI marking switched off or unavailable", () => {
  it("LLM_DAILY_CAP=0 turns AI marking off: self-mark, nothing reserved, no LLM call", async () => {
    process.env.LLM_DAILY_CAP = "0";
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const { body } = await grade(started, shortsOf(started)[0].id, "an answer");
    expect(body.result.needsSelfMark).toBe(true);
    expect(body.aiLimit).toBeUndefined();
    expect(env.llm).not.toHaveBeenCalled();
    expect(await usedBy(user.id)).toBe(0);
  });

  it("a reservation query that fails returns needsSelfMark with aiUnavailable and never calls the LLM", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    env.failAfterCalls(2); // session lookup + already-answered check succeed; the reservation fails
    const { status, body } = await grade(started, shortsOf(started)[0].id, "an answer");
    expect(status).toBe(200);
    expect(body.result.needsSelfMark).toBe(true);
    expect(body.aiUnavailable).toBe(true);
    expect(body.degraded).toBe(true);
    expect(typeof body.selfMarkToken).toBe("string");
    expect(env.llm).not.toHaveBeenCalled();
    env.databaseUp();
    expect(await usedBy(user.id)).toBe(0);
  });

  it("a reservation query that times out is treated the same way", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    env.slowAfterCalls(2, 1700);
    const { body } = await grade(started, shortsOf(started)[0].id, "an answer");
    expect(body.aiUnavailable).toBe(true);
    expect(env.llm).not.toHaveBeenCalled();
  });
});

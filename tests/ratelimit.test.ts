import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { correctDisplayIndex, firstOf, post, setupRouteEnv, signedInStudent, startAttempt, type RouteEnv } from "./helpers/routes";

beforeEach(() => {
  vi.resetModules();
});
afterEach(() => {
  delete process.env.GRADE_RATE_LIMIT;
  delete process.env.GRADE_IP_RATE_LIMIT;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe("rate limiter (in-memory fallback)", () => {
  it("the per-user limit blocks after GRADE_RATE_LIMIT calls within a minute, and not another user", async () => {
    process.env.GRADE_RATE_LIMIT = "3";
    const rl = await import("@/lib/ratelimit.server");
    for (let i = 0; i < 3; i++) expect((await rl.checkUserRateLimit("alice")).ok).toBe(true);
    const blocked = await rl.checkUserRateLimit("alice");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
    expect((await rl.checkUserRateLimit("bob")).ok).toBe(true);
  });

  it("the per-IP backstop blocks when many users share an address beyond GRADE_IP_RATE_LIMIT", async () => {
    process.env.GRADE_IP_RATE_LIMIT = "5";
    const rl = await import("@/lib/ratelimit.server");
    for (let i = 0; i < 5; i++) expect((await rl.checkIpRateLimit("203.0.113.9")).ok).toBe(true);
    expect((await rl.checkIpRateLimit("203.0.113.9")).ok).toBe(false);
    expect((await rl.checkIpRateLimit("198.51.100.4")).ok).toBe(true);
  });

  it("the limit window slides: calls are allowed again after a minute", async () => {
    process.env.GRADE_RATE_LIMIT = "1";
    vi.useFakeTimers();
    try {
      const rl = await import("@/lib/ratelimit.server");
      expect((await rl.checkUserRateLimit("alice")).ok).toBe(true);
      expect((await rl.checkUserRateLimit("alice")).ok).toBe(false);
      vi.advanceTimersByTime(60_001);
      expect((await rl.checkUserRateLimit("alice")).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("user, IP and attempt limits are separate counters", async () => {
    process.env.GRADE_RATE_LIMIT = "1";
    const rl = await import("@/lib/ratelimit.server");
    expect((await rl.checkUserRateLimit("alice")).ok).toBe(true);
    expect((await rl.checkUserRateLimit("alice")).ok).toBe(false);
    expect((await rl.checkAttemptRateLimit("alice")).ok).toBe(true);
    expect((await rl.checkIpRateLimit("alice")).ok).toBe(true);
  });
});

describe("through /api/grade", () => {
  let env: RouteEnv;
  afterEach(async () => {
    await env?.close();
  });

  async function grade(started: Awaited<ReturnType<typeof startAttempt>>, questionId: string, answer: string, ip = "10.0.0.1") {
    const { POST } = await import("@/app/api/grade/route");
    const res = await POST(
      post("/api/grade", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, answer }, { "x-forwarded-for": ip }),
    );
    return { status: res.status, body: await res.json(), headers: res.headers };
  }

  it("short answers are limited per user with retry-after; MC is never rate limited", async () => {
    process.env.GRADE_RATE_LIMIT = "1";
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const shorts = started.questions.filter((q) => q.type === "short");
    const mcs = started.questions.filter((q) => q.type === "mc");

    expect((await grade(started, shorts[0].id, "first")).status).toBe(200);
    const blocked = await grade(started, shorts[1].id, "second");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe("rate_limited");
    expect(blocked.body.retryAfter).toBeGreaterThan(0);
    expect(blocked.headers.get("retry-after")).toBeTruthy();

    // MC: every question, with the short-answer limit already exhausted
    for (const q of mcs) expect((await grade(started, q.id, "0")).status).toBe(200);
    expect(env.llm).toHaveBeenCalledTimes(1);
  });

  it("a rate-limited short answer is not counted against the daily allowance", async () => {
    process.env.GRADE_RATE_LIMIT = "1";
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const shorts = started.questions.filter((q) => q.type === "short");
    await grade(started, shorts[0].id, "first");
    await grade(started, shorts[1].id, "second"); // 429
    const rows = await env.db.query.dailyAiUsage.findMany();
    expect(rows.filter((r) => r.userId === user.id).reduce((s, r) => s + r.count, 0)).toBe(1);
  });

  it("the per-IP backstop applies across different students on the same address", async () => {
    process.env.GRADE_IP_RATE_LIMIT = "2";
    env = await setupRouteEnv();
    const { seedUser } = await import("./helpers/fixtures");
    const { asSessionUser } = await import("./helpers/env");
    let blocked = 0;
    for (let i = 0; i < 4; i++) {
      const u = await seedUser(env.db);
      env.signedInAs(asSessionUser(u));
      const started = await startAttempt();
      const q = firstOf(started.questions, "short");
      const r = await grade(started, q.id, "answer", "192.0.2.50"); // same school address
      if (r.status === 429) blocked += 1;
    }
    expect(blocked).toBe(2);
  });

  it("MC keeps working for everyone even when the IP backstop is exhausted", async () => {
    process.env.GRADE_IP_RATE_LIMIT = "1";
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const mc = firstOf(started.questions, "mc");
    const short = firstOf(started.questions, "short");
    await grade(started, short.id, "x");
    expect((await grade(started, short.id, "y")).status).not.toBe(200); // 409 (answered) or 429
    expect((await grade(started, mc.id, String(correctDisplayIndex(mc)))).status).toBe(200);
  });
});

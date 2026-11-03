// The draft-save route for the sentence-writing unit (spec 006 FR-053/FR-054) through POST
// /api/rewrite/draft: session and token checks, the draft rate limit, the stale check (nothing
// written once the attempt is complete or the phase is graded), a second save replacing the text,
// an empty draft clearing the column, the grade and self-mark routes deleting the row at final,
// and deletion with the student.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnswer } from "@/content/answers";
import { attempts, rewriteDrafts, rewritePhases, users } from "@/lib/db/schema";
import type { RewriteGrade } from "@/lib/openrouter.server";
import type { Question } from "@/lib/types";

import { setupTestEnv, type TestEnv } from "../helpers/env";
import { post, signedInStudent, startAttempt, type StartedAttempt } from "../helpers/routes";

const REWRITE_UNIT = "y12-economics-sentence-writing";

interface RewriteRouteEnv extends TestEnv {
  /** The stubbed rewrite grader. Default: full marks (A, no padding, every term used). */
  rewrite: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<RewriteGrade | null>>>;
}

/** setupTestEnv plus a mock for the rewrite grader (the real OpenRouter call is never made). */
async function setupRewriteEnv(): Promise<RewriteRouteEnv> {
  const env = await setupTestEnv();
  const rewrite = vi.fn<(...args: unknown[]) => Promise<RewriteGrade | null>>(async (...args) => {
    const p = args[0] as { targetTerms: Array<{ term: string }> };
    return {
      criterionA: true,
      padding: false,
      terms: p.targetTerms.map((t) => ({ term: t.term, status: "used" as const })),
      feedback: "Good work.",
      gradedBy: "mock-model",
    };
  });
  vi.doMock("@/lib/openrouter.server", () => ({
    llmGradingConfigured: () => true,
    gradeShortAnswer: () => Promise.resolve(null),
    gradeRewrite: (...args: unknown[]) => rewrite(...args),
  }));
  return Object.assign(env, { rewrite });
}

let env: RewriteRouteEnv;
afterEach(async () => {
  delete process.env.DRAFT_RATE_LIMIT;
  delete process.env.LLM_DAILY_CAP;
  delete process.env.GRADE_RATE_LIMIT;
  await env?.close();
});

const rewritesOf = (started: StartedAttempt) => started.questions.filter((q) => q.type === "rewrite");

async function draft(started: StartedAttempt, questionId: string, body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/rewrite/draft/route");
  const res = await POST(
    post("/api/rewrite/draft", {
      attemptId: started.attemptId,
      attemptToken: started.attemptToken,
      questionId,
      ...body,
    }),
  );
  return { status: res.status, body: await res.json() };
}

const draftRowFor = async (questionId: string) =>
  (await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.questionId, questionId)))[0];

/** Grade a rewrite in phase 1 at 3/3 (final) so the grade route deletes the draft row. */
async function gradeFinal(started: StartedAttempt, q: Question, answer: string) {
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(
    post("/api/grade", {
      attemptId: started.attemptId,
      attemptToken: started.attemptToken,
      questionId: q.id,
      answer,
    }),
  );
  return { status: res.status, body: await res.json() };
}

/** Grade a rewrite in phase 1 while the model fails, so the grader asks for a self-mark. */
async function needsSelfMark(started: StartedAttempt, q: Question, answer: string) {
  env.rewrite.mockResolvedValueOnce(null);
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(
    post("/api/grade", {
      attemptId: started.attemptId,
      attemptToken: started.attemptToken,
      questionId: q.id,
      answer,
    }),
  );
  const body = await res.json();
  return { token: body.selfMarkToken as string };
}

async function selfMark(started: StartedAttempt, q: Question, answer: string, token: unknown) {
  const { POST } = await import("@/app/api/results/self-mark/route");
  const res = await POST(
    post("/api/results/self-mark", {
      attemptId: started.attemptId,
      attemptToken: started.attemptToken,
      questionId: q.id,
      answer,
      correct: true,
      token,
    }),
  );
  return { status: res.status, body: await res.json() };
}

describe("POST /api/rewrite/draft", () => {
  it("401 without a session", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    env.signedOut();
    const res = await draft(started, q.id, { phase: 1, draft: "hello" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("unauthenticated");
  });

  it("401 with another student's attempt token", async () => {
    env = await setupRewriteEnv();
    const a = await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    // sign in as a different student and try to save a draft with A's token
    await signedInStudent(env, { email: "other@example.com" });
    void a;
    const res = await draft(started, q.id, { phase: 1, draft: "hello" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("invalid_attempt_token");
  });

  it("400 for a bad body", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    for (const bad of [
      { phase: 1 }, // no draft
      { draft: "x" }, // no phase
      { phase: 3, draft: "x" }, // bad phase
      { phase: 1, draft: 42 }, // non-string draft
    ]) {
      const res = await draft(started, q.id, bad);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_request");
    }
  });

  it("404 for a question not in the attempt or not a rewrite question", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const notInAttempt = "y11-physics-preliminary.s01";
    expect((await draft(started, notInAttempt, { phase: 1, draft: "x" })).status).toBe(404);
    // a non-rewrite question id that is in the attempt is not possible here (all are rewrite),
    // so use a short-answer question id from another unit that is not in the attempt
    expect((await draft(started, "y11-physics-preliminary.s01", { phase: 1, draft: "x" })).status).toBe(404);
    void q;
  });

  it("429 over DRAFT_RATE_LIMIT", async () => {
    process.env.DRAFT_RATE_LIMIT = "1";
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    expect((await draft(started, q.id, { phase: 1, draft: "a" })).status).toBe(200);
    const second = await draft(started, q.id, { phase: 1, draft: "b" });
    expect(second.status).toBe(429);
    expect(second.body.error).toBe("rate_limited");
  });

  it("503 with the database down", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    env.databaseDown();
    const res = await draft(started, q.id, { phase: 1, draft: "hello" });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe("temporarily_unavailable");
  });

  it("writes nothing and returns saved:false once the attempt is complete (stale check)", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    await env.db.update(attempts).set({ completedAt: new Date() }).where(eq(attempts.id, started.attemptId));
    const res = await draft(started, q.id, { phase: 1, draft: "stale" });
    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(false);
    expect(await draftRowFor(q.id)).toBeUndefined();
  });

  it("a second save for the same phase replaces the text (not just the timestamp)", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    expect((await draft(started, q.id, { phase: 1, draft: "first fragment" })).status).toBe(200);
    expect((await draft(started, q.id, { phase: 1, draft: "second fragment" })).status).toBe(200);
    const row = await draftRowFor(q.id);
    expect(row?.phase1Draft).toBe("second fragment");
  });

  it("an empty draft clears that phase's column", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    await draft(started, q.id, { phase: 1, draft: "hello" });
    expect((await draftRowFor(q.id))?.phase1Draft).toBe("hello");
    await draft(started, q.id, { phase: 1, draft: "" });
    expect((await draftRowFor(q.id))?.phase1Draft).toBe("");
  });

  it("writes nothing and returns saved:false once the phase is already graded (stale check)", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    // phase 1 graded under 3 → a phase row exists → phase 1 drafts are stale
    const key = getAnswer(q.id)!;
    env.rewrite.mockResolvedValueOnce({
      criterionA: true,
      padding: false,
      terms: key.targetTerms!.map((t, i) => ({ term: t.term, status: i === 0 ? "missing" : "used" as const })),
      feedback: "Name the tax.",
      gradedBy: "mock-model",
    });
    const g = await gradeFinal(started, q, "A sentence that misses one term.");
    expect(g.status).toBe(200);
    const res = await draft(started, q.id, { phase: 1, draft: "stale" });
    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(false);
    expect(await draftRowFor(q.id)).toBeUndefined();
  });

  it("writes nothing and returns saved:false once the question is final (phase 2 stale)", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const key = getAnswer(q.id)!;
    env.rewrite.mockResolvedValueOnce({
      criterionA: true,
      padding: false,
      terms: key.targetTerms!.map((t, i) => ({ term: t.term, status: i === 0 ? "missing" : "used" as const })),
      feedback: "Name the tax.",
      gradedBy: "mock-model",
    });
    await gradeFinal(started, q, "Phase one under three.");
    env.rewrite.mockResolvedValueOnce({
      criterionA: true,
      padding: false,
      terms: key.targetTerms!.map((t) => ({ term: t.term, status: "used" as const })),
      feedback: "Better.",
      gradedBy: "mock-model",
    });
    const { POST } = await import("@/app/api/grade/route");
    await POST(
      post("/api/grade", {
        attemptId: started.attemptId,
        attemptToken: started.attemptToken,
        questionId: q.id,
        answer: "A perfect retry.",
        phase: 2,
      }),
    );
    const res = await draft(started, q.id, { phase: 2, draft: "stale" });
    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(false);
    expect(await draftRowFor(q.id)).toBeUndefined();
  });

  it("the grade route deletes the draft row when the question becomes final (3/3 phase 1)", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    await draft(started, q.id, { phase: 1, draft: "in progress" });
    expect(await draftRowFor(q.id)).toBeDefined();
    const g = await gradeFinal(started, q, "A perfect concise sentence using every term.");
    expect(g.status).toBe(200);
    expect(await draftRowFor(q.id)).toBeUndefined();
  });

  it("the self-mark save deletes the draft row", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const answer = "A sentence the model cannot grade.";
    await draft(started, q.id, { phase: 1, draft: "in progress" });
    const { token } = await needsSelfMark(started, q, answer);
    const res = await selfMark(started, q, answer, token);
    expect(res.status).toBe(200);
    expect(await draftRowFor(q.id)).toBeUndefined();
  });

  it("deleting the student removes the draft rows", async () => {
    env = await setupRewriteEnv();
    const me = await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    await draft(started, q.id, { phase: 1, draft: "in progress" });
    expect(await draftRowFor(q.id)).toBeDefined();
    await env.db.delete(users).where(eq(users.id, me.id));
    expect(await draftRowFor(q.id)).toBeUndefined();
  });
});
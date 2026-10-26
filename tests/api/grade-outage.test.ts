// Principle VI / SC-004 / research R19: a database outage never blocks practice.
// The test database is made fully unreachable; the student can still start a
// quiz, get MC marks, self-mark short answers, and receive receipts. When the
// database returns, retries create the attempt and each result exactly once.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { attempts, results, users } from "@/lib/db/schema";

import { asSessionUser } from "../helpers/env";
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
  await env?.close();
});

async function gradeCall(started: StartedAttempt, questionId: string, answer: string) {
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

async function retry(receipt: string) {
  const { POST } = await import("@/app/api/results/retry/route");
  const res = await POST(post("/api/results/retry", { receipt }));
  return { status: res.status, body: await res.json() };
}

describe("full outage: start, mark, self-mark, then save everything exactly once", () => {
  it("works end to end", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    env.databaseDown();

    // 1. a quiz can still be started (not persisted)
    const started = await startAttempt();
    expect(started.status).toBe(201);
    expect(started.persisted).toBe(false);

    // 2. MC is marked from the attempt token alone, with a receipt
    const mc = firstOf(started.questions, "mc");
    const mcRes = await gradeCall(started, mc.id, String(correctDisplayIndex(mc)));
    expect(mcRes.status).toBe(200);
    expect(mcRes.body).toMatchObject({ saved: false, degraded: true, attemptCompleted: null });
    expect(mcRes.body.result.marksAwarded).toBe(mc.maxMarks);
    expect(typeof mcRes.body.receipt).toBe("string");

    // 3. a short answer cannot be AI-marked: self-mark, no LLM call, no cap use
    const short = firstOf(started.questions, "short");
    const shortRes = await gradeCall(started, short.id, "my short answer");
    expect(shortRes.status).toBe(200);
    expect(shortRes.body.result.needsSelfMark).toBe(true);
    expect(shortRes.body.aiUnavailable).toBe(true);
    expect(typeof shortRes.body.selfMarkToken).toBe("string");
    expect(env.llm).not.toHaveBeenCalled();

    // 4. self-mark returns a receipt too
    const { POST: selfMarkPost } = await import("@/app/api/results/self-mark/route");
    const sm = await selfMarkPost(
      post("/api/results/self-mark", {
        attemptId: started.attemptId,
        attemptToken: started.attemptToken,
        questionId: short.id,
        answer: "my short answer",
        correct: true,
        token: shortRes.body.selfMarkToken,
      }),
    );
    const smBody = await sm.json();
    expect(sm.status).toBe(200);
    expect(smBody).toMatchObject({ saved: false, degraded: true });

    // 5. retry cannot work yet: 503 so the outbox keeps the receipts and backs off
    expect((await retry(mcRes.body.receipt)).status).toBe(503);
    expect((await retry(smBody.receipt)).status).toBe(503);

    // 6. the database returns: replay each receipt twice
    env.databaseUp();
    expect(await env.db.select().from(attempts)).toHaveLength(0);
    for (const receipt of [mcRes.body.receipt, smBody.receipt, mcRes.body.receipt, smBody.receipt]) {
      expect((await retry(receipt)).status).toBe(200);
    }
    const atts = await env.db.select().from(attempts).where(eq(attempts.id, started.attemptId));
    expect(atts).toHaveLength(1);
    expect(atts[0].userId).toBe(user.id);
    expect(atts[0].questionIds).toEqual(started.questions.map((q) => q.id));
    const rows = await env.db.select().from(results).where(eq(results.attemptId, started.attemptId));
    expect(rows.map((r) => [r.questionId, r.gradedBy, r.marksAwarded]).sort()).toEqual(
      [
        [mc.id, "auto", mc.maxMarks],
        [short.id, "self", short.maxMarks],
      ].sort(),
    );
    const [u] = await env.db.select().from(users).where(eq(users.id, user.id));
    expect(u.lastAnswerAt).toBeInstanceOf(Date);
  });
});

describe("a slow database is treated as unavailable", () => {
  it("marks MC from the token when the session lookup exceeds 1500 ms", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt(); // database fine here
    const mc = firstOf(started.questions, "mc");
    env.databaseSlow(1700);
    const { status, body } = await gradeCall(started, mc.id, String(correctDisplayIndex(mc)));
    expect(status).toBe(200);
    expect(body).toMatchObject({ saved: false, degraded: true });
    expect(body.result.marksAwarded).toBe(mc.maxMarks);
    expect(typeof body.receipt).toBe("string");
  });

  it("a mid-request failure (user lookup ok, already-answered check fails) is also degraded", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const mc = firstOf(started.questions, "mc");
    env.failAfterCalls(1);
    const { body } = await gradeCall(started, mc.id, String(correctDisplayIndex(mc)));
    expect(body).toMatchObject({ saved: false, degraded: true, attemptCompleted: null });
    const short = firstOf(started.questions, "short");
    env.llm.mockClear();
    const s = await gradeCall(started, short.id, "an answer");
    expect(s.body.aiUnavailable).toBe(true);
    expect(env.llm).not.toHaveBeenCalled();
  });
});

describe("what an outage must NOT weaken", () => {
  it("with the database up and the student's row gone, /api/grade answers 401 (not degraded)", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const mc = firstOf(started.questions, "mc");
    await env.testDb.pg.query("delete from users where id = $1", [user.id]);
    const { status, body } = await gradeCall(started, mc.id, "0");
    expect(status).toBe(401);
    expect(body.receipt).toBeUndefined();
  });

  it("a receipt for a deleted student is discarded with 410 and writes nothing", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    env.databaseDown();
    const started = await startAttempt();
    const mc = firstOf(started.questions, "mc");
    const { body } = await gradeCall(started, mc.id, String(correctDisplayIndex(mc)));
    env.databaseUp();
    await env.testDb.pg.query("delete from users where id = $1", [user.id]);
    const r = await retry(body.receipt);
    expect(r.status).toBe(410);
    expect(r.body.error).toBe("student_not_found");
    expect(await env.db.select().from(attempts)).toHaveLength(0);
    expect(await env.db.select().from(results)).toHaveLength(0);
  });

  it("a non-connection error is an ordinary failure, never a degraded 200", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const mc = firstOf(started.questions, "mc");
    env.state.genericError = true;
    const { POST } = await import("@/app/api/grade/route");
    await expect(
      POST(
        post("/api/grade", {
          attemptId: started.attemptId,
          attemptToken: started.attemptToken,
          questionId: mc.id,
          answer: "0",
        }),
      ),
    ).rejects.toThrow("boom");
  });

  it("routes with no degraded path answer 503 temporarily_unavailable, never 401", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    env.databaseDown();
    const { authenticate } = await import("@/lib/api-auth.server");
    const r = await authenticate();
    expect(r.user).toBeUndefined();
    expect(r.response!.status).toBe(503);
    expect(await r.response!.json()).toEqual({ error: "temporarily_unavailable" });
    // and signed out is still 401
    env.databaseUp();
    env.signedOut();
    expect((await authenticate()).response!.status).toBe(401);
    env.signedInAs(asSessionUser(user));
    expect((await authenticate()).user?.id).toBe(user.id);
  });
});

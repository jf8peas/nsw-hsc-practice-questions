import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { results } from "@/lib/db/schema";

import { asSessionUser } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";
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
  await env?.close();
});

/** Grade a short answer while the LLM is failing, so the grader asks for a self-mark. */
async function needsSelfMark(started: StartedAttempt, answer = "my answer") {
  env.llm.mockResolvedValueOnce(null);
  const q = firstOf(started.questions, "short");
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
  return { q, answer, token: body.selfMarkToken as string };
}

const OMIT = Symbol("omit");

async function selfMark(
  started: StartedAttempt,
  q: { id: string },
  answer: string,
  token: unknown,
  correct: unknown = true,
  extra: Record<string, unknown> = {},
) {
  const { POST } = await import("@/app/api/results/self-mark/route");
  const res = await POST(
    post("/api/results/self-mark", {
      attemptId: started.attemptId,
      attemptToken: started.attemptToken,
      questionId: q.id,
      answer,
      ...(correct === OMIT ? {} : { correct }),
      token,
      ...extra,
    }),
  );
  return { res, status: res.status, body: await res.json() };
}

const rowsFor = (id: string) => env.db.select().from(results).where(eq(results.attemptId, id));

describe("POST /api/results/self-mark", () => {
  it("accepts a valid token and saves graded_by self with max marks (right) or 0 (wrong)", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const { q, answer, token } = await needsSelfMark(started);
    const right = await selfMark(started, q, answer, token, true);
    expect(right.status).toBe(200);
    expect(right.body.saved).toBe(true);
    const [row] = await rowsFor(started.attemptId);
    expect(row).toMatchObject({
      userId: user.id,
      questionId: q.id,
      gradedBy: "self",
      marksAwarded: q.maxMarks,
      maxMarks: q.maxMarks,
      answer: "my answer",
      feedback: null,
    });
  });

  it("stores 0 marks when the student marks themselves wrong", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const { q, answer, token } = await needsSelfMark(started);
    expect((await selfMark(started, q, answer, token, false)).status).toBe(200);
    const [row] = await rowsFor(started.attemptId);
    expect(row.marksAwarded).toBe(0);
    expect(row.gradedBy).toBe("self");
  });

  it("ignores any client-supplied marks: only the binary flag counts", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const { q, answer, token } = await needsSelfMark(started);
    await selfMark(started, q, answer, token, false, { marks: 99, marksAwarded: 99, maxMarks: 99 });
    const [row] = await rowsFor(started.attemptId);
    expect(row).toMatchObject({ marksAwarded: 0, maxMarks: q.maxMarks });
  });

  it("rejects a missing or non-boolean correct flag", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const { q, answer, token } = await needsSelfMark(started);
    for (const bad of [OMIT, "true", 1, null]) {
      expect((await selfMark(started, q, answer, token, bad)).status).toBe(400);
    }
    expect(await rowsFor(started.attemptId)).toHaveLength(0);
  });

  it("rejects: no token, wrong question, wrong answer, wrong attempt and an expired token", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const { q, answer, token } = await needsSelfMark(started);
    const shorts = started.questions.filter((x) => x.type === "short");

    expect((await selfMark(started, q, answer, undefined)).status).toBe(400);
    expect((await selfMark(started, q, answer, "garbage")).status).toBe(400);
    // wrong question (token was issued for q)
    expect((await selfMark(started, shorts[1] ?? q, answer, token)).status).toBe(shorts[1] ? 400 : 200);
    // wrong answer text
    expect((await selfMark(started, q, "a different answer", token)).status).toBe(400);
    // a token for a different attempt
    const { signSelfMarkToken } = await import("@/lib/tokens.server");
    const otherAttempt = signSelfMarkToken({
      uid: user.id,
      attemptId: "44444444-3a39-4a3e-8d5b-0b2f6f3c9d11",
      questionId: q.id,
      answer,
    });
    expect((await selfMark(started, q, answer, otherAttempt)).status).toBe(400);
    // an expired token
    const expired = signSelfMarkToken(
      { uid: user.id, attemptId: started.attemptId, questionId: q.id, answer },
      Date.now() - 3 * 60 * 60 * 1000,
    );
    expect((await selfMark(started, q, answer, expired)).status).toBe(400);
    expect((await rowsFor(started.attemptId)).length).toBe(0);
  });

  it("rejects a token issued to another student", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const { q, answer } = await needsSelfMark(started);
    const { signSelfMarkToken } = await import("@/lib/tokens.server");
    const other = await seedUser(env.db);
    const foreign = signSelfMarkToken({ uid: other.id, attemptId: started.attemptId, questionId: q.id, answer });
    expect((await selfMark(started, q, answer, foreign)).status).toBe(400);
    expect(user.id).not.toBe(other.id);
  });

  it("requires a valid attemptToken bound to the same user and attempt", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const { q, answer, token } = await needsSelfMark(started);
    const other = await seedUser(env.db);
    env.signedInAs(asSessionUser(other));
    const theirs = await startAttempt();
    env.signedInAs(asSessionUser((await env.db.query.users.findFirst())!));
    expect(theirs.attemptId).not.toBe(started.attemptId);

    // missing attempt token
    const { POST } = await import("@/app/api/results/self-mark/route");
    const missing = await POST(
      post("/api/results/self-mark", { attemptId: started.attemptId, questionId: q.id, answer, correct: true, token }),
    );
    expect(missing.status).toBe(400);
    // an attempt token for a different attempt
    const wrong = await selfMark({ ...started, attemptToken: theirs.attemptToken }, q, answer, token);
    expect(wrong.status).toBe(400);
    expect(await rowsFor(started.attemptId)).toHaveLength(0);
  });

  it("rejects a self-mark for an MC question with 422", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const mc = firstOf(started.questions, "mc");
    const { signSelfMarkToken } = await import("@/lib/tokens.server");
    const token = signSelfMarkToken({ uid: user.id, attemptId: started.attemptId, questionId: mc.id, answer: "0" });
    const res = await selfMark(started, mc, "0", token);
    expect(res.status).toBe(422);
    expect(res.body.error).toBe("not_short_question");
  });

  it("rejects a question that is not in the attempt with 404", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const { signSelfMarkToken } = await import("@/lib/tokens.server");
    const token = signSelfMarkToken({ uid: user.id, attemptId: started.attemptId, questionId: "retired.q1", answer: "x" });
    expect((await selfMark(started, { id: "retired.q1" }, "x", token)).status).toBe(404);
  });

  it("rejects an already-answered question with 409", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const { q, answer, token } = await needsSelfMark(started);
    expect((await selfMark(started, q, answer, token, true)).status).toBe(200);
    const again = await selfMark(started, q, answer, token, false);
    expect(again.status).toBe(409);
    expect(again.body.error).toBe("already_answered");
    expect((await rowsFor(started.attemptId))[0].marksAwarded).toBe(q.maxMarks);
  });

  it("a failed save returns a receipt that carries the attempt fields", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const { q, answer, token } = await needsSelfMark(started);
    env.failAfterCalls(2); // session lookup + already-answered check ok; the save fails
    const res = await selfMark(started, q, answer, token, true);
    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(false);
    env.databaseUp();
    expect(await rowsFor(started.attemptId)).toHaveLength(0);
    const { verifyReceipt } = await import("@/lib/tokens.server");
    const v = verifyReceipt(res.body.receipt, { uid: user.id });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.payload).toMatchObject({ questionId: q.id, gradedBy: "self", marks: q.maxMarks, answer });
      expect(v.payload.attempt.questionIds).toEqual(started.questions.map((x) => x.id));
    }
  });

  it("with the database unreachable it verifies the tokens and returns a receipt with the attempt fields", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const { q, answer, token } = await needsSelfMark(started);
    env.databaseDown();
    const res = await selfMark(started, q, answer, token, false);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ saved: false, degraded: true, attemptCompleted: null });
    const { verifyReceipt } = await import("@/lib/tokens.server");
    const v = verifyReceipt(res.body.receipt, { uid: user.id });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.payload.attempt).toMatchObject({
        unitId: "y11-physics-preliminary",
        questionIds: started.questions.map((x) => x.id),
      });
      expect(v.payload.marks).toBe(0);
    }
    // a bad token is still rejected with the database down
    expect((await selfMark(started, q, answer, "garbage")).status).toBe(400);
  });
});

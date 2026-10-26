import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { getQuestion } from "@/content";
import { attempts } from "@/lib/db/schema";

import { allKeys, post, setupRouteEnv, signedInStudent, startAttempt, type RouteEnv } from "../helpers/routes";

let env: RouteEnv;
afterEach(async () => {
  delete process.env.ATTEMPT_RATE_LIMIT;
  await env?.close();
});

describe("POST /api/attempts", () => {
  it("creates an attempt owned by the session user with ordered question_ids and mc_option_order", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt("y11-formula-test");
    expect(started.status).toBe(201);
    expect(started.persisted).toBe(true);

    const rows = await env.db.select().from(attempts).where(eq(attempts.userId, user.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(started.attemptId);
    expect(rows[0].unitId).toBe("y11-formula-test");
    expect(rows[0].questionIds).toEqual(started.questions.map((q) => q.id));
    expect(rows[0].completedAt).toBeNull();
    const mcIds = started.questions.filter((q) => q.type === "mc").map((q) => q.id);
    expect(Object.keys(rows[0].mcOptionOrder).sort()).toEqual([...mcIds].sort());
  });

  it("returns an attemptToken bound to the user and attempt, and public question data only", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt("y11-economics-supply-demand");
    const { verifyAttemptToken } = await import("@/lib/tokens.server");
    const verified = verifyAttemptToken(started.attemptToken, {
      uid: user.id,
      attemptId: started.attemptId,
    });
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.payload.questionIds).toEqual(started.questions.map((q) => q.id));
    }

    const keys = allKeys(started.questions);
    for (const banned of ["correctText", "correctIndex", "modelAnswer", "rubric", "notes", "answers"]) {
      expect(keys.has(banned), banned).toBe(false);
    }
    // MC options are in the stored display order (not the authored order)
    const order = (await env.db.select().from(attempts))[0].mcOptionOrder;
    for (const q of started.questions) {
      if (q.type !== "mc") continue;
      const authored = (getQuestion(q.id)!.question as { options: string[] }).options;
      expect(q.options).toEqual(order[q.id].map((i) => authored[i]));
    }
  });

  it("answers 404 for an unknown unit and 400 for a malformed body", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const { POST } = await import("@/app/api/attempts/route");
    expect((await POST(post("/api/attempts", { unitId: "nope" }))).status).toBe(404);
    expect((await POST(post("/api/attempts", "not json"))).status).toBe(400);
    expect((await POST(post("/api/attempts", { unitId: 5 }))).status).toBe(404);
  });

  it("answers 401 when signed out", async () => {
    env = await setupRouteEnv();
    const { POST } = await import("@/app/api/attempts/route");
    const res = await POST(post("/api/attempts", { unitId: "y11-formula-test" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthenticated" });
  });

  it("answers 401 when the student's row no longer exists", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    await env.testDb.pg.query("delete from users where id = $1", [user.id]);
    const { POST } = await import("@/app/api/attempts/route");
    expect((await POST(post("/api/attempts", { unitId: "y11-formula-test" }))).status).toBe(401);
  });

  it("limits attempts per user per minute (ATTEMPT_RATE_LIMIT) with retryAfter", async () => {
    process.env.ATTEMPT_RATE_LIMIT = "3";
    env = await setupRouteEnv();
    await signedInStudent(env);
    const { POST } = await import("@/app/api/attempts/route");
    for (let i = 0; i < 3; i++) {
      expect((await POST(post("/api/attempts", { unitId: "y11-formula-test" }))).status).toBe(201);
    }
    const res = await POST(post("/api/attempts", { unitId: "y11-formula-test" }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("rate_limited");
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(res.headers.get("retry-after")).toBeTruthy();
  });

  it("with the database unreachable still returns 201, persisted: false and a valid token, storing nothing", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    env.databaseDown();
    const started = await startAttempt("y11-formula-test");
    expect(started.status).toBe(201);
    expect(started.persisted).toBe(false);
    expect(started.questions.length).toBeGreaterThan(0);
    expect(started.attemptId).toMatch(/^[0-9a-f-]{36}$/);

    const { verifyAttemptToken } = await import("@/lib/tokens.server");
    expect(
      verifyAttemptToken(started.attemptToken, { uid: user.id, attemptId: started.attemptId }).ok,
    ).toBe(true);

    env.databaseUp();
    expect(await env.db.select().from(attempts)).toHaveLength(0);
  });

  it("falls back to persisted: false when only the insert cannot reach the database", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    env.failAfterCalls(1); // the session lookup succeeds, the insert fails
    const started = await startAttempt("y11-formula-test");
    expect(started.status).toBe(201);
    expect(started.persisted).toBe(false);
    env.databaseUp();
    expect(await env.db.select().from(attempts)).toHaveLength(0);
  });

  it("propagates a non-connection database error as an ordinary failure (not a degraded 201)", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    env.state.genericError = true;
    const { POST } = await import("@/app/api/attempts/route");
    await expect(POST(post("/api/attempts", { unitId: "y11-formula-test" }))).rejects.toThrow("boom");
  });
});

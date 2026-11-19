// POST /api/rewrite/draft now also serves the unseen-text unit (spec 008): the in-progress text of a
// try is saved so a resume on another device restores it. Stale once the try is marked.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { rewriteDrafts } from "@/lib/db/schema";

import { post, signedInStudent } from "../helpers/routes";
import { Q, fillWords, gradeUnseen, restoreUnseenEnv, setupUnseenEnv, startUnseen, type UnseenEnv } from "../helpers/unseen";

let env: UnseenEnv;
afterEach(async () => {
  restoreUnseenEnv();
  delete process.env.DRAFT_RATE_LIMIT;
  vi.restoreAllMocks();
  await env?.close();
});

const q = Q[0];
async function draft(started: { attemptId: string; attemptToken: string }, phase: 1 | 2, text: string) {
  const { POST } = await import("@/app/api/rewrite/draft/route");
  const res = await POST(post("/api/rewrite/draft", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId: q, phase, draft: text }));
  return { status: res.status, body: await res.json() };
}
const stored = async () => (await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.questionId, q)))[0];

describe("saving an unseen-text draft", () => {
  it("saves the first draft, replaces it, and clears it with an empty draft", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    expect(await draft(started, 1, "Half an answer")).toEqual({ status: 200, body: { saved: true } });
    expect((await stored()).phase1Draft).toBe("Half an answer");
    await draft(started, 1, "A longer half answer");
    expect((await stored()).phase1Draft).toBe("A longer half answer");
    await draft(started, 1, "");
    expect((await stored()).phase1Draft).toBe("");
  });

  it("is stale once the first try is marked (phase 1), but a retry draft is saved until the question is final", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, fillWords(60, "[mark:1]"));
    expect((await draft(started, 1, "late text")).body).toEqual({ saved: false });
    expect((await draft(started, 2, "A half retry")).body).toEqual({ saved: true });
    expect((await stored()).phase2Draft).toBe("A half retry");
    await gradeUnseen(started, q, fillWords(60, "[mark:2]"), { phase: 2 });
    expect((await draft(started, 2, "after final")).body).toEqual({ saved: false });
  });

  it("limits the draft to 6000 characters, rate limits, checks the token and the question, and handles a database outage", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await draft(started, 1, "x".repeat(7000));
    expect((await stored()).phase1Draft).toHaveLength(6000);
    const { POST } = await import("@/app/api/rewrite/draft/route");
    expect((await POST(post("/api/rewrite/draft", { attemptId: started.attemptId, attemptToken: "x.y", questionId: q, phase: 1, draft: "a" }))).status).toBe(401);
    expect((await POST(post("/api/rewrite/draft", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId: "y12-english-advanced-unseen-texts.nope", phase: 1, draft: "a" }))).status).toBe(404);
    process.env.DRAFT_RATE_LIMIT = "1";
    const first = await draft(started, 1, "a");
    const second = await draft(started, 1, "b");
    expect([first.status, second.status]).toContain(429);
    delete process.env.DRAFT_RATE_LIMIT;
    env.databaseDown();
    expect((await draft(started, 1, "c")).status).toBe(503);
  });
});

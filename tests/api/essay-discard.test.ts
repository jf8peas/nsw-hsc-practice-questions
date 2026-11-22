// Discarding an open, unmarked essay attempt (spec 010 FR-002a, contracts/api.md B): the attempt, its plan and its
// draft are deleted; earlier marked essays stay; marking in flight and finished attempts are refused; only the
// owner can discard; every essay can be started afterwards.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { attempts, essayPhases, results, rewriteDrafts } from "@/lib/db/schema";

import { E1, E5, essayOfWords, goodScaffold, gradeEssay, restoreEssayEnv, saveEssayDraft, saveScaffold, setupEssayEnv, startEssay, startToWriting, type EssayEnv } from "../helpers/essay";
import { asSessionUser } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";
import { post, signedInStudent } from "../helpers/routes";

let env: EssayEnv;
afterEach(async () => {
  restoreEssayEnv();
  vi.restoreAllMocks();
  await env?.close();
});

async function discard(a: { attemptId: string; attemptToken: string }, questionId = E1) {
  const { POST } = await import("@/app/api/essay/discard/route");
  const res = await POST(post("/api/essay/discard", { attemptId: a.attemptId, attemptToken: a.attemptToken, questionId }));
  return { status: res.status, body: await res.json() };
}

describe("discarding an attempt", () => {
  it("deletes a planning attempt and its row, and frees the student to start any essay", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    await saveScaffold(a, E1, "save", goodScaffold());
    expect(await discard(a)).toMatchObject({ status: 200, body: { discarded: true } });
    expect(await env.db.select().from(attempts).where(eq(attempts.id, a.attemptId))).toHaveLength(0);
    expect(await env.db.select().from(essayPhases).where(eq(essayPhases.attemptId, a.attemptId))).toHaveLength(0);
    expect((await startEssay(E5)).status).toBe(201);
  });

  it("deletes a writing attempt with its draft", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    await saveEssayDraft(a, E1, "half an essay");
    expect((await discard(a)).status).toBe(200);
    expect(await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.attemptId, a.attemptId))).toHaveLength(0);
    expect(await env.db.select().from(essayPhases).where(eq(essayPhases.attemptId, a.attemptId))).toHaveLength(0);
  });

  it("keeps an earlier marked result of the same essay", async () => {
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const first = await startToWriting();
    await gradeEssay(first, E1, essayOfWords(700));
    const redo = await startEssay(E1);
    expect((await discard(redo)).status).toBe(200);
    expect(await env.db.select().from(results).where(eq(results.userId, user.id))).toHaveLength(1);
    expect((await env.db.select().from(essayPhases).where(eq(essayPhases.attemptId, first.attemptId)))[0].status).toBe("finished");
  });

  it("is refused while a marking is in flight, and allowed once the lease is stale", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    await env.db.update(essayPhases).set({ markingStartedAt: new Date() }).where(eq(essayPhases.attemptId, a.attemptId));
    expect(await discard(a)).toMatchObject({ status: 409, body: { error: "marking_in_progress" } });
    expect(await env.db.select().from(attempts).where(eq(attempts.id, a.attemptId))).toHaveLength(1);
    await env.db.update(essayPhases).set({ markingStartedAt: new Date(Date.now() - 150_000) }).where(eq(essayPhases.attemptId, a.attemptId));
    expect((await discard(a)).status).toBe(200);
  });

  it("is refused for a finished attempt, which is never deleted", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    await gradeEssay(a, E1, essayOfWords(700));
    expect(await discard(a)).toMatchObject({ status: 409, body: { error: "already_finished" } });
    expect(await env.db.select().from(attempts).where(eq(attempts.id, a.attemptId))).toHaveLength(1);
  });

  it("refuses another student's attempt, a bad token and a missing session", async () => {
    env = await setupEssayEnv();
    const owner = await signedInStudent(env);
    const a = await startEssay(E1);
    const intruder = await seedUser(env.db, { email: "intruder@example.com", googleSub: "g-intruder" });
    env.signedInAs(asSessionUser(intruder));
    expect((await discard(a)).status).toBe(401);
    env.signedInAs(asSessionUser(owner));
    expect((await discard({ ...a, attemptToken: "garbage" })).status).toBe(401);
    env.signedOut();
    expect((await discard(a)).status).toBe(401);
    expect(await env.db.select().from(attempts).where(eq(attempts.id, a.attemptId))).toHaveLength(1);
  });

  it("is unavailable, never guessed, when the database cannot be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    env.databaseDown();
    expect((await discard(a)).status).toBe(503);
  });
});

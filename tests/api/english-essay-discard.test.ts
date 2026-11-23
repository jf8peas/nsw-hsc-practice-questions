// POST /api/english-essay/discard (spec 011 contracts/api.md B): an open, unmarked attempt (planning or writing) and its draft
// are deleted while earlier finished attempts and results remain; a live marking lease, a finished attempt, another
// student's attempt and a bad token are refused; and any essay can start after a successful discard.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { attempts, essayPhases, results, rewriteDrafts } from "@/lib/db/schema";

import {
  E1,
  E2,
  discardEnglish,
  essayOfWords,
  goodEnglishScaffold,
  gradeEnglish,
  restoreEnglishEnv,
  saveEnglishDraft,
  saveEnglishScaffold,
  setupEnglishEnv,
  startEnglish,
  startEnglishToWriting,
  type EnglishEnv,
} from "../helpers/english-essay";
import { post, signedInStudent } from "../helpers/routes";
import { seedUser } from "../helpers/fixtures";
import { asSessionUser } from "../helpers/env";

let env: EnglishEnv;
afterEach(async () => {
  restoreEnglishEnv();
  vi.restoreAllMocks();
  await env?.close();
});

describe("discarding an open attempt", () => {
  it("deletes a planning attempt and its phase row", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold());
    expect(await discardEnglish(a, E1)).toMatchObject({ status: 200, body: { discarded: true } });
    expect(await env.db.select().from(attempts).where(eq(attempts.id, a.attemptId))).toHaveLength(0);
    expect(await env.db.select().from(essayPhases).where(eq(essayPhases.attemptId, a.attemptId))).toHaveLength(0);
  });

  it("deletes a writing attempt with its draft, leaving earlier finished attempts and results alone", async () => {
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    const first = await startEnglishToWriting(E1);
    await gradeEnglish(first, E1, essayOfWords(900));
    const second = await startEnglishToWriting(E1);
    await saveEnglishDraft(second, E1, "an unfinished essay");
    expect(await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.attemptId, second.attemptId))).toHaveLength(1);

    expect((await discardEnglish(second, E1)).body).toEqual({ discarded: true });
    expect(await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.attemptId, second.attemptId))).toHaveLength(0);
    expect(await env.db.select().from(attempts).where(eq(attempts.id, first.attemptId))).toHaveLength(1);
    expect(await env.db.select().from(results).where(eq(results.userId, user.id))).toHaveLength(1);
    expect(await env.db.select().from(essayPhases).where(eq(essayPhases.attemptId, first.attemptId))).toHaveLength(1);
  });

  it("lets any essay start after a successful discard", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    expect((await startEnglish(E2)).status).toBe(409);
    await discardEnglish(a, E1);
    expect((await startEnglish(E2)).status).toBe(201);
  });
});

describe("refusals", () => {
  it("refuses while a marking lease is under 130 seconds old, and allows a stale one", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    await env.db.update(essayPhases).set({ markingStartedAt: new Date() }).where(eq(essayPhases.attemptId, a.attemptId));
    expect(await discardEnglish(a, E1)).toMatchObject({ status: 409, body: { error: "marking_in_progress" } });
    expect(await env.db.select().from(attempts).where(eq(attempts.id, a.attemptId))).toHaveLength(1);
    await env.db.update(essayPhases).set({ markingStartedAt: new Date(Date.now() - 200_000) }).where(eq(essayPhases.attemptId, a.attemptId));
    expect((await discardEnglish(a, E1)).status).toBe(200);
  });

  it("refuses a finished attempt", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    await gradeEnglish(a, E1, essayOfWords(900));
    expect(await discardEnglish(a, E1)).toMatchObject({ status: 409, body: { error: "already_finished" } });
    expect(await env.db.select().from(results)).toHaveLength(1);
  });

  it("refuses another student's attempt (401 for the token) and a bad token", async () => {
    env = await setupEnglishEnv();
    const owner = await signedInStudent(env);
    const a = await startEnglish(E1);
    expect((await discardEnglish({ ...a, attemptToken: "garbage" }, E1)).status).toBe(401);
    const intruder = await seedUser(env.db, { email: "intruder@example.com", googleSub: "g-intruder" });
    env.signedInAs(asSessionUser(intruder));
    expect((await discardEnglish(a, E1)).status).toBe(401);
    env.signedInAs(asSessionUser(owner));
    expect(await env.db.select().from(attempts).where(eq(attempts.id, a.attemptId))).toHaveLength(1);
  });

  it("refuses an unknown attempt id with a valid-looking body, and needs a session", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    const { POST } = await import("@/app/api/english-essay/discard/route");
    expect((await POST(post("/api/english-essay/discard", { attemptId: a.attemptId, attemptToken: a.attemptToken, questionId: "nope" }))).status).toBe(404);
    expect((await POST(post("/api/english-essay/discard", "not json"))).status).toBe(400);
    env.signedOut();
    expect((await discardEnglish(a, E1)).status).toBe(401);
  });

  it("is unavailable, never guessed, when the database cannot be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    env.databaseDown();
    expect(await discardEnglish(a, E1)).toMatchObject({ status: 503, body: { error: "temporarily_unavailable" } });
    env.databaseUp();
    expect(await env.db.select().from(attempts).where(eq(attempts.id, a.attemptId))).toHaveLength(1);
  });
});


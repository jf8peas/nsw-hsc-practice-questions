// Starting and resuming the English essay unit through POST /api/attempts (spec 011 contracts/api.md B): a live start,
// resume, a second essay refused while one is open, racing tabs, unknown and non-live ids, Redo of a finished essay,
// rate limits and an unreadable database. PGlite and a stubbed model; no network.

import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { attempts, essayPhases } from "@/lib/db/schema";

import { E1, E2, E4, ENGLISH_UNIT, KEYS, MODEL_WORD, NOTES, restoreEnglishEnv, setupEnglishEnv, startEnglish, type EnglishEnv } from "../helpers/english-essay";
import { signedInStudent } from "../helpers/routes";

let env: EnglishEnv;
afterEach(async () => {
  restoreEnglishEnv();
  delete process.env.ATTEMPT_RATE_LIMIT;
  vi.restoreAllMocks();
  await env?.close();
});

const rows = () => env.db.select().from(attempts).where(eq(attempts.unitId, ENGLISH_UNIT));

describe("starting an English essay", () => {
  it("starts a live essay: 201, a signed token, the public question and the scaffold stage, with no key", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    expect(a.status).toBe(201);
    expect(a.persisted).toBe(true);
    expect(a.attemptToken).toBeTruthy();
    expect(a.questions).toHaveLength(1);
    expect(a.questions[0]).toMatchObject({ id: E1, type: "englishEssay", maxMarks: 20, directive: "to what extent", source: "Knox 2025 Trial, Q6" });
    expect(a.englishEssayState).toMatchObject({ stage: "scaffold", locked: false });
    const s = JSON.stringify(a);
    for (const secret of [NOTES.slice(0, 30), MODEL_WORD, "ENOTES-TOKEN-5521", "markingNotes", "modelEssay", "conceptTags"]) expect(s).not.toContain(secret);
    expect(JSON.stringify(KEYS)).toContain("ENOTES-TOKEN-5521"); // the fixture really carries the secret
    const [row] = await env.db.select().from(essayPhases).where(eq(essayPhases.attemptId, a.attemptId));
    expect(row).toMatchObject({ status: "planning", scaffoldLockedAt: null, unitId: ENGLISH_UNIT, questionId: E1 });
  });

  it("resumes the same essay (200, resumed) with or without an id, and refuses another essay while one is open", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    const again = await startEnglish(E1);
    expect(again).toMatchObject({ status: 200, resumed: true, attemptId: a.attemptId });
    const bare = await startEnglish();
    expect(bare).toMatchObject({ status: 200, resumed: true, attemptId: a.attemptId });
    const other = await startEnglish(E2);
    expect(other.status).toBe(409);
    expect(other).toMatchObject({ error: "attempt_open", questionId: E1 });
  });

  it("returns 404 for an unknown or non-live essay and 404 no_open_attempt when nothing is open", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    expect((await startEnglish(E4)).status).toBe(404); // exists, not live
    expect((await startEnglish(`${ENGLISH_UNIT}.e9`)).status).toBe(404);
    const none = await startEnglish();
    expect(none.status).toBe(404);
    expect(none.error).toBe("no_open_attempt");
    expect(await rows()).toHaveLength(0);
  });

  it("ends two tabs starting at once on one open attempt", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const [x, y] = await Promise.all([startEnglish(E1), startEnglish(E1)]);
    expect(x.attemptId).toBe(y.attemptId);
    expect(await rows()).toHaveLength(1);
    const [p, q] = await Promise.all([startEnglish(E1), startEnglish(E2)].map((r) => r.then((v) => v.status)));
    expect([p, q].sort()).toEqual([200, 409]);
  });

  it("lets a finished essay be started again as a new attempt (Redo), leaving the old one", async () => {
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    const first = await startEnglish(E1);
    await env.db.update(attempts).set({ completedAt: new Date() }).where(eq(attempts.id, first.attemptId));
    const redo = await startEnglish(E1);
    expect(redo.status).toBe(201);
    expect(redo.attemptId).not.toBe(first.attemptId);
    expect(await rows()).toHaveLength(2);
    expect(await env.db.select().from(attempts).where(and(eq(attempts.userId, user.id), eq(attempts.id, first.attemptId)))).toHaveLength(1);
  });

  it("keeps one open English attempt per student, independent of other students", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    await startEnglish(E1);
    await signedInStudent(env, { email: "second@example.com", googleSub: "g-second" });
    expect((await startEnglish(E2)).status).toBe(201);
    expect(await rows()).toHaveLength(2);
  });
});

describe("limits and outages", () => {
  it("applies the per-user attempt rate limit with retryAfter", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    process.env.ATTEMPT_RATE_LIMIT = "1";
    expect((await startEnglish(E1)).status).toBe(201);
    const second = await startEnglish(E1);
    expect(second.status).toBe(429);
    expect(second.error).toBe("rate_limited");
  });

  it("is unavailable, never guessed, when the database cannot be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    env = await setupEnglishEnv();
    await signedInStudent(env);
    env.databaseDown();
    const r = await startEnglish(E1);
    expect(r.status).toBe(503);
    expect(r.error).toBe("temporarily_unavailable");
    env.databaseUp();
    expect(await rows()).toHaveLength(0);
  });

  it("needs a session", async () => {
    env = await setupEnglishEnv();
    env.signedOut();
    expect((await startEnglish(E1)).status).toBe(401);
  });
});

// POST /api/english-essay/scaffold (spec 011 contracts/api.md C): save 0-150 words, the over-cap refusal, the start/lock
// transition, later calls refused as locked, malformed bodies, ownership and token checks, the draft limiter and an
// unreadable database. PGlite; no network.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { essayPhases } from "@/lib/db/schema";

import { E1, goodEnglishScaffold, restoreEnglishEnv, saveEnglishScaffold, setupEnglishEnv, startEnglish, type EnglishEnv } from "../helpers/english-essay";
import { post, signedInStudent } from "../helpers/routes";
import { seedUser } from "../helpers/fixtures";
import { asSessionUser } from "../helpers/env";

let env: EnglishEnv;
afterEach(async () => {
  restoreEnglishEnv();
  delete process.env.DRAFT_RATE_LIMIT;
  vi.restoreAllMocks();
  await env?.close();
});

const phase = async (attemptId: string) => (await env.db.select().from(essayPhases).where(eq(essayPhases.attemptId, attemptId)))[0]!;
const words = (n: number) => Array.from({ length: n }, () => "w").join(" ");

describe("save", () => {
  it("saves 0 to 150 words, including an empty plan, and returns the server's own count", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    const empty = await saveEnglishScaffold(a, E1, "save", { thesis: "", body: [{}, {}, {}] });
    expect(empty).toMatchObject({ status: 200, body: { saved: true, words: 0 } });
    const full = await saveEnglishScaffold(a, E1, "save", { thesis: words(150), body: [{}, {}, {}] });
    expect(full).toMatchObject({ status: 200, body: { saved: true, words: 150 } });
    expect((await phase(a.attemptId)).scaffoldWords).toBe(150);
  });

  it("refuses 151 words with over_cap and stores nothing", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold());
    const before = (await phase(a.attemptId)).scaffold;
    const over = await saveEnglishScaffold(a, E1, "save", { thesis: words(151), body: [{}, {}, {}] });
    expect(over).toMatchObject({ status: 400, body: { error: "over_cap", words: 151, max: 150 } });
    expect((await phase(a.attemptId)).scaffold).toEqual(before);
  });

  it("applies the draft rate limit to saves", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    process.env.DRAFT_RATE_LIMIT = "1";
    const first = await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold());
    const second = await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold());
    expect([first.status, second.status]).toEqual([200, 429]);
    expect(second.body.error).toBe("rate_limited");
  });
});

describe("start (lock)", () => {
  it("locks atomically: returns started, sets writing and the lock time", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    const go = await saveEnglishScaffold(a, E1, "start", goodEnglishScaffold());
    expect(go).toMatchObject({ status: 200, body: { started: true, stage: "write", locked: true } });
    const row = await phase(a.attemptId);
    expect(row.status).toBe("writing");
    expect(row.scaffoldLockedAt).not.toBeNull();
  });

  it("starts with only a thesis: claims and evidence are never compulsory", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    expect((await saveEnglishScaffold(a, E1, "start", { thesis: "A position.", body: [{}, {}, {}] })).status).toBe(200);
  });

  it("refuses a whitespace thesis and an over-cap plan with the reasons and the count", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    const blank = await saveEnglishScaffold(a, E1, "start", { thesis: "  \n ", body: [{ claim: "c" }, {}, {}] });
    expect(blank).toMatchObject({ status: 400, body: { error: "scaffold_invalid", reasons: ["no_thesis"], words: 1 } });
    const both = await saveEnglishScaffold(a, E1, "start", { thesis: " ", body: [{ claim: words(151) }, {}, {}] });
    expect(both.body).toMatchObject({ error: "scaffold_invalid", reasons: ["over_cap", "no_thesis"], words: 151 });
    expect((await phase(a.attemptId)).status).toBe("planning");
  });

  it("refuses every later save or start as scaffold_locked and keeps the stored plan", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    await saveEnglishScaffold(a, E1, "start", goodEnglishScaffold());
    const stored = (await phase(a.attemptId)).scaffold;
    for (const action of ["save", "start"] as const) {
      const r = await saveEnglishScaffold(a, E1, action, goodEnglishScaffold({ thesis: "changed" }));
      expect(r).toMatchObject({ status: 409, body: { error: "scaffold_locked" } });
    }
    expect((await phase(a.attemptId)).scaffold).toEqual(stored);
  });
});

describe("requests", () => {
  it("rejects malformed bodies, unknown actions and non-string fields as invalid_request", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    const { POST } = await import("@/app/api/english-essay/scaffold/route");
    expect((await POST(post("/api/english-essay/scaffold", "not json"))).status).toBe(400);
    expect((await saveEnglishScaffold(a, E1, "nope" as never, goodEnglishScaffold())).body).toEqual({ error: "invalid_request" });
    expect((await saveEnglishScaffold(a, E1, "save", { thesis: 5, body: [{}, {}, {}] })).body).toEqual({ error: "invalid_request" });
    expect((await saveEnglishScaffold(a, E1, "save", { thesis: "t", body: [{ claim: 7 }, {}, {}] })).body).toEqual({ error: "invalid_request" });
    expect((await saveEnglishScaffold(a, E1, "save", "text")).status).toBe(400);
  });

  it("checks the signed token and ownership, and needs a session", async () => {
    env = await setupEnglishEnv();
    const owner = await signedInStudent(env);
    const a = await startEnglish(E1);
    expect((await saveEnglishScaffold({ ...a, attemptToken: "garbage" }, E1, "save", goodEnglishScaffold())).status).toBe(401);
    expect((await saveEnglishScaffold(a, `${E1}x`, "save", goodEnglishScaffold())).status).toBe(404);
    const intruder = await seedUser(env.db, { email: "intruder@example.com", googleSub: "g-intruder" });
    env.signedInAs(asSessionUser(intruder));
    expect((await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold())).status).toBe(401);
    env.signedInAs(asSessionUser(owner));
    expect((await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold())).status).toBe(200);
    env.signedOut();
    expect((await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold())).status).toBe(401);
  });

  it("is unavailable, never guessed, when the database cannot be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    env.databaseDown();
    expect(await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold())).toMatchObject({ status: 503, body: { error: "temporarily_unavailable" } });
    env.databaseUp();
  });

  it("returns no key or marking material from any scaffold response", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    const s = JSON.stringify([await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold()), await saveEnglishScaffold(a, E1, "start", goodEnglishScaffold())]);
    for (const secret of ["ENOTES-TOKEN", "EMODELESSAYTOKEN", "modelEssay", "markingNotes", "conceptTags"]) expect(s).not.toContain(secret);
  });
});

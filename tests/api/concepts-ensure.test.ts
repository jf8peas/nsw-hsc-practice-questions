// POST /api/units/[unitId]/concepts/ensure: starts background preparation of the signed-in
// student's own weak-concept content (spec 002 US2, US3; research R5; contracts/api.md).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedUser } from "../helpers/fixtures";
import {
  PLAIN,
  READY,
  conceptId,
  failVerdict,
  fakeLlmPort,
  fixtureContent,
  seedResultAt,
  type FakePort,
} from "../helpers/concept-fixtures";

const A = conceptId("a");
const B = conceptId("b");
const C = conceptId("c");
let env: TestEnv;
let port: FakePort;

beforeEach(async () => {
  env = await setupTestEnv();
  fixtureContent();
  port = fakeLlmPort();
  vi.stubEnv("CONCEPT_MODEL", "vendor/gen");
  vi.stubEnv("REVIEW_MODEL", "vendor/rev");
  vi.stubEnv("ILLUSTRATION_MODEL", "");
  vi.doMock("@/lib/concepts/llm.server", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/lib/concepts/llm.server")>()),
    createConceptLlmPort: () => port,
  }));
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await env.close();
});

const at = (minute: number) => new Date(Date.UTC(2026, 9, 1, 9, minute, 0));

async function student() {
  const row = await seedUser(env.db);
  env.signedInAs(asSessionUser(row));
  const attempt = await seedAttempt(env.db, row.id, { unitId: READY });
  return { row, base: { attemptId: attempt.id, userId: row.id } };
}
const miss = (s: Awaited<ReturnType<typeof student>>, q: string, minute: number) =>
  seedResultAt(env.db, s.base, READY, `${READY}.${q}`, 0, q.startsWith("s") ? 2 : 1, at(minute));
const hit = (s: Awaited<ReturnType<typeof student>>, q: string, minute: number) =>
  seedResultAt(env.db, s.base, READY, `${READY}.${q}`, q.startsWith("s") ? 2 : 1, q.startsWith("s") ? 2 : 1, at(minute));

async function ensure(unitId = READY) {
  const { POST } = await import("@/app/api/units/[unitId]/concepts/ensure/route");
  const { settleBackground } = await import("@/lib/background.server");
  const res = await POST(new Request(`http://localhost/api/units/${unitId}/concepts/ensure`, { method: "POST" }), {
    params: Promise.resolve({ unitId }),
  });
  const body = await res.json();
  await settleBackground();
  return { res, status: res.status, body };
}

async function liveSummary(id: string) {
  const store = await import("@/lib/concepts/store.server");
  const slot = await store.getSlot(env.db, id, "summary");
  return slot?.liveVersionId ? store.getVersion(env.db, slot.liveVersionId) : null;
}

describe("access", () => {
  it("401 when signed out", async () => {
    env.signedOut();
    expect((await ensure()).status).toBe(401);
  });

  it("404 for an unknown unit and for a unit that has not adopted concepts", async () => {
    await student();
    expect((await ensure("no-such-unit")).status).toBe(404);
    expect((await ensure(PLAIN)).status).toBe(404);
  });

  it("503 temporarily_unavailable (never 401) when the database is down", async () => {
    await student();
    env.databaseDown();
    const r = await ensure();
    expect(r.status).toBe(503);
    expect(r.body).toEqual({ error: "temporarily_unavailable" });
  });

  it("is rate limited per student: the 3rd request in a minute is 429 with retry-after", async () => {
    vi.stubEnv("CONCEPT_RATE_LIMIT", "2");
    await student();
    expect((await ensure()).status).toBe(200);
    expect((await ensure()).status).toBe(200);
    const third = await ensure();
    expect(third.status).toBe(429);
    expect(third.body.error).toBe("rate_limited");
    expect(Number(third.res.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});

describe("which concepts it prepares", () => {
  it("only the signed-in student's own uncleared concepts", async () => {
    const bob = await student();
    await miss(bob, "m03", 1); // bob misses concept c
    const alice = await student();
    await miss(alice, "m01", 1);
    await miss(alice, "m02", 2);

    const r = await ensure();
    expect(r.status).toBe(202);
    expect([...r.body.queued].sort()).toEqual([A, B]);
    expect(await liveSummary(A)).not.toBeNull();
    expect(await liveSummary(B)).not.toBeNull();
    expect(await liveSummary(C)).toBeNull(); // bob's weakness, not alice's
    expect(port.calls.every((c) => JSON.stringify(c.input).includes("Concept A") || JSON.stringify(c.input).includes("Concept B"))).toBe(true);
  });

  it("never a concept the student has cleared", async () => {
    const s = await student();
    await miss(s, "m01", 1);
    await hit(s, "m07", 2);
    await hit(s, "s01", 3);
    await hit(s, "s07", 4); // concept a: 3 -> 0
    const r = await ensure();
    expect(r.status).toBe(200);
    expect(r.body.queued).toEqual([]);
    expect(port.calls).toHaveLength(0);
  });

  it("highest count first, and at most 3 per visit", async () => {
    const s = await student();
    await miss(s, "m01", 1);
    await hit(s, "m07", 2); // concept a: count 2
    for (const [q, minute] of [["m02", 3], ["m03", 4], ["m04", 5], ["m05", 6], ["m06", 7]] as const) await miss(s, q, minute); // b..f: 3
    const r = await ensure();
    expect(r.body.queued).toHaveLength(3);
    expect(r.body.queued).not.toContain(A); // the lower count waits its turn
  });

  it("skips a concept whose lease is held or that is backing off after a failure", async () => {
    const s = await student();
    await miss(s, "m01", 1);
    await miss(s, "m02", 2);
    await miss(s, "m03", 3);
    const store = await import("@/lib/concepts/store.server");
    await store.ensureSlot(env.db, A, "summary", READY);
    await store.claimLease(env.db, A, "summary", "dddddddd-dddd-4ddd-8ddd-dddddddddddd", new Date());
    await store.ensureSlot(env.db, B, "summary", READY);
    await store.setBackoff(env.db, B, "summary", new Date(), "earlier failure");
    const r = await ensure();
    expect(r.body.queued).toEqual([C]);
  });

  it("never claims content that failed review twice: opening the page again makes no call", async () => {
    const s = await student();
    await miss(s, "m01", 1);
    port.queue.reviewSummary.push(failVerdict("One."), failVerdict("Two."));
    expect((await ensure()).body.queued).toEqual([A]);
    expect(await liveSummary(A)).toBeNull();
    const calls = port.calls.length;
    const again = await ensure();
    expect(again.status).toBe(200);
    expect(again.body.queued).toEqual([]);
    expect(port.calls.length).toBe(calls);
  });

  it("a second student with the same weakness triggers no new model call", async () => {
    const alice = await student();
    await miss(alice, "m01", 1);
    await ensure();
    const calls = port.calls.length;
    expect(calls).toBeGreaterThan(0);
    const bob = await student();
    await miss(bob, "m07", 1); // also concept a
    const r = await ensure();
    expect(r.status).toBe(200);
    expect(r.body.queued).toEqual([]);
    expect(port.calls.length).toBe(calls);
  });
});

describe("response shape", () => {
  it("202 { queued, pending: true, version } when work started", async () => {
    const s = await student();
    await miss(s, "m01", 1);
    const { POST } = await import("@/app/api/units/[unitId]/concepts/ensure/route");
    const res = await POST(new Request("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ unitId: READY }) });
    const body = await res.json();
    expect(res.status).toBe(202);
    expect(body).toEqual({ queued: [A], pending: true, version: "0" });
    await (await import("@/lib/background.server")).settleBackground();
  });

  it("200 { queued: [], pending: false } when there is nothing to do, with the version of what is shown", async () => {
    const s = await student();
    await miss(s, "m01", 1);
    await ensure();
    const r = await ensure();
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ queued: [], pending: false });
    expect(r.body.version).toMatch(/^[0-9a-f]{10}$/);
  });

  it("the response never carries a reviewer reason, a model name or an error", async () => {
    const s = await student();
    await miss(s, "m01", 1);
    port.queue.reviewSummary.push(failVerdict("Secret reason quoting the model answer."));
    const r = await ensure();
    const text = JSON.stringify(r.body);
    for (const secret of ["Secret reason", "vendor/", "model answer"]) expect(text).not.toContain(secret);
    expect(Object.keys(r.body).sort()).toEqual(["pending", "queued", "version"]);
  });
});

describe("when preparation cannot run, the student is never told so", () => {
  for (const [name, setup] of [
    ["the reviewer is unset", () => vi.stubEnv("REVIEW_MODEL", "")],
    ["the reviewer is the same model as the generator", () => vi.stubEnv("REVIEW_MODEL", "Vendor/GEN:online")],
    ["the daily concept cap is 0", () => vi.stubEnv("CONCEPT_DAILY_CAP", "0")],
  ] as Array<[string, () => void]>) {
    it(`${name}: 200, nothing queued, no model call, no error`, async () => {
      setup();
      const s = await student();
      await miss(s, "m01", 1);
      const r = await ensure();
      expect(r.status).toBe(200);
      expect(r.body.queued).toEqual([]);
      expect(port.calls).toHaveLength(0);
    });
  }
});

describe("illustrations", () => {
  it("prepares the picture later when an illustration model is configured after the summary was approved", async () => {
    port = fakeLlmPort({ illustrate: true });
    const s = await student();
    await miss(s, "m01", 1);
    await ensure(); // no illustration model: summary only
    expect(port.count("generateIllustration")).toBe(0);

    vi.stubEnv("ILLUSTRATION_MODEL", "vendor/draw");
    const r = await ensure();
    expect(r.status).toBe(202);
    expect(r.body.queued).toEqual([A]);
    expect(port.count("generateIllustration")).toBe(1);
    expect(port.count("generateSummary")).toBe(1); // the summary was not generated again
  });

  it("does not use a reviewer that is the illustration model for the picture", async () => {
    port = fakeLlmPort({ illustrate: true });
    const s = await student();
    await miss(s, "m01", 1);
    await ensure();
    vi.stubEnv("ILLUSTRATION_MODEL", "vendor/rev"); // the same as the reviewer
    const r = await ensure();
    expect(r.body.queued).toEqual([]);
    expect(port.count("generateIllustration")).toBe(0);
  });
});

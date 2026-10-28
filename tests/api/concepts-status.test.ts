// GET /api/units/[unitId]/concepts/status: the cheap poll (spec 002 FR-021; contracts/api.md).

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedUser } from "../helpers/fixtures";
import { PLAIN, READY, conceptId, fixtureContent, seedResultAt } from "../helpers/concept-fixtures";

const A = conceptId("a");
const C = conceptId("c");
const OTHER = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
let env: TestEnv;

beforeEach(async () => {
  env = await setupTestEnv();
  fixtureContent();
});
afterEach(async () => {
  await env.close();
});

async function student() {
  const row = await seedUser(env.db);
  env.signedInAs(asSessionUser(row));
  const attempt = await seedAttempt(env.db, row.id, { unitId: READY });
  return { row, base: { attemptId: attempt.id, userId: row.id } };
}
const miss = (s: Awaited<ReturnType<typeof student>>, q: string) =>
  seedResultAt(env.db, s.base, READY, `${READY}.${q}`, 0, 1, new Date());

async function status(unitId = READY) {
  const { GET } = await import("@/app/api/units/[unitId]/concepts/status/route");
  const res = await GET(new Request(`http://localhost/api/units/${unitId}/concepts/status`), {
    params: Promise.resolve({ unitId }),
  });
  return { res, status: res.status, body: await res.json() };
}

async function approve(conceptIdValue: string, bullets = ["one", "two", "three"]) {
  const store = await import("@/lib/concepts/store.server");
  const v = await store.insertReplacement(env.db, {
    conceptId: conceptIdValue, kind: "summary", unitId: READY, origin: "first", attemptNo: 1,
    summaryBullets: bullets, generatorModel: "vendor/gen", generatedAt: new Date(),
  });
  await store.promote(env.db, conceptIdValue, "summary", v.id, "reviewer", { reviewerModel: "vendor/rev", reason: null, at: new Date() });
  return v;
}

describe("access", () => {
  it("401 signed out; 404 for an unknown or non-concept unit; 503 (never 401) when the database is down", async () => {
    env.signedOut();
    expect((await status()).status).toBe(401);
    await student();
    expect((await status("nope")).status).toBe(404);
    expect((await status(PLAIN)).status).toBe(404);
    env.databaseDown();
    const down = await status();
    expect(down.status).toBe(503);
    expect(down.body).toEqual({ error: "temporarily_unavailable" });
  });
});

describe("pending", () => {
  it("is false when nothing is running, and true only while an unexpired lease is held on one of the student's concepts", async () => {
    const s = await student();
    await miss(s, "m01");
    expect((await status()).body.pending).toBe(false);

    const store = await import("@/lib/concepts/store.server");
    await store.ensureSlot(env.db, A, "summary", READY);
    await store.claimLease(env.db, A, "summary", OTHER, new Date());
    expect((await status()).body.pending).toBe(true);

    // a lease that has run out no longer counts
    await store.releaseLease(env.db, A, "summary", OTHER);
    await store.claimLease(env.db, A, "summary", OTHER, new Date(Date.now() - 10 * 60_000));
    expect((await status()).body.pending).toBe(false);
  });

  it("a lease on a concept the student has not missed does not count", async () => {
    const s = await student();
    await miss(s, "m01");
    const store = await import("@/lib/concepts/store.server");
    await store.ensureSlot(env.db, C, "summary", READY);
    await store.claimLease(env.db, C, "summary", OTHER, new Date());
    expect((await status()).body.pending).toBe(false);
  });
});

describe("version", () => {
  it("is '0' with nothing approved, stable while nothing changes, and different once content is approved or replaced", async () => {
    const s = await student();
    await miss(s, "m01");
    expect((await status()).body.version).toBe("0");

    const v1 = await approve(A);
    const first = (await status()).body.version;
    expect(first).toMatch(/^[0-9a-f]{10}$/);
    expect((await status()).body.version).toBe(first);

    await (await import("@/lib/concepts/store.server")).cleanupOrphans(env.db, A, "summary");
    expect(v1.id).toBeTruthy();
    await approve(A, ["new one", "new two", "new three"]);
    expect((await status()).body.version).not.toBe(first);
  });

  it("is not affected by approved content for a concept this student has not missed", async () => {
    const s = await student();
    await miss(s, "m01");
    await approve(C);
    expect((await status()).body.version).toBe("0");
  });

  it("is the same for two students who see the same approved content", async () => {
    const alice = await student();
    await miss(alice, "m01");
    await approve(A);
    const a = (await status()).body.version;
    const bob = await student();
    await miss(bob, "m07");
    expect((await status()).body.version).toBe(a);
  });
});

describe("what it returns", () => {
  it("exactly pending and version, nothing else", async () => {
    const s = await student();
    await miss(s, "m01");
    expect(Object.keys((await status()).body).sort()).toEqual(["pending", "version"]);
  });
});

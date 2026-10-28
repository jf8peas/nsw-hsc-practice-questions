// Slots, leases, replacements and promotion (spec 002 research R5, R9; data-model.md invariants).

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { conceptSlots, conceptVersions } from "@/lib/db/schema";
import {
  BACKOFF_MS,
  LEASE_MS,
  claimLease,
  cleanupOrphans,
  clearBackoff,
  contentVersionHash,
  ensureSlot,
  getSlot,
  hasActiveLease,
  insertReplacement,
  markReviewed,
  promote,
  releaseLease,
  setBackoff,
  type NewVersion,
} from "@/lib/concepts/store.server";

import { createTestDb, type TestDb } from "../helpers/db";

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

const NOW = new Date("2026-10-28T10:00:00Z");
// lease owners are UUIDs
const OA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OC = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OT = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const OX = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
let n = 0;
const fresh = () => `unit-s.c-${++n}`;

const summary = (conceptId: string, over: Partial<NewVersion> = {}): NewVersion => ({
  conceptId,
  kind: "summary",
  unitId: "unit-s",
  origin: "first",
  attemptNo: 1,
  summaryBullets: ["one", "two", "three"],
  generatorModel: "vendor/generator",
  generatedAt: NOW,
  ...over,
});

const countVersions = async (conceptId: string) =>
  (await t.db.select().from(conceptVersions).where(eq(conceptVersions.conceptId, conceptId))).length;

describe("slots", () => {
  it("ensureSlot is idempotent and creates one row per concept and kind", async () => {
    const c = fresh();
    await ensureSlot(t.db, c, "summary", "unit-s");
    await ensureSlot(t.db, c, "summary", "unit-s");
    await ensureSlot(t.db, c, "illustration", "unit-s");
    expect((await t.db.select().from(conceptSlots).where(eq(conceptSlots.conceptId, c))).length).toBe(2);
  });
});

describe("leases (one generation per concept under concurrency)", () => {
  it("lets exactly one of two concurrent callers claim a slot", async () => {
    const c = fresh();
    await ensureSlot(t.db, c, "summary", "unit-s");
    const [a, b] = await Promise.all([
      claimLease(t.db, c, "summary", OA, NOW),
      claimLease(t.db, c, "summary", OB, NOW),
    ]);
    expect([a, b].filter(Boolean)).toHaveLength(1);
  });

  it("refuses while held, allows again after release, and after the lease expires", async () => {
    const c = fresh();
    await ensureSlot(t.db, c, "summary", "unit-s");
    expect(await claimLease(t.db, c, "summary", OA, NOW)).toBe(true);
    expect(await claimLease(t.db, c, "summary", OB, new Date(NOW.getTime() + 1000))).toBe(false);
    await releaseLease(t.db, c, "summary", OA);
    expect(await claimLease(t.db, c, "summary", OB, new Date(NOW.getTime() + 1000))).toBe(true);
    // a crashed worker never releases: the lease expires by itself
    expect(await claimLease(t.db, c, "summary", OC, new Date(NOW.getTime() + LEASE_MS + 5000))).toBe(true);
  });

  it("release by someone who does not hold the lease changes nothing", async () => {
    const c = fresh();
    await ensureSlot(t.db, c, "summary", "unit-s");
    await claimLease(t.db, c, "summary", OA, NOW);
    await releaseLease(t.db, c, "summary", OX);
    expect(await claimLease(t.db, c, "summary", OB, new Date(NOW.getTime() + 1000))).toBe(false);
  });

  it("an item and its sibling kind have separate leases", async () => {
    const c = fresh();
    await ensureSlot(t.db, c, "summary", "unit-s");
    await ensureSlot(t.db, c, "illustration", "unit-s");
    expect(await claimLease(t.db, c, "summary", OA, NOW)).toBe(true);
    expect(await claimLease(t.db, c, "illustration", OB, NOW)).toBe(true);
  });

  it("a backoff in the future refuses a claim until it passes; a teacher can ignore it", async () => {
    const c = fresh();
    await ensureSlot(t.db, c, "summary", "unit-s");
    await setBackoff(t.db, c, "summary", NOW, "http 502");
    const slot = await getSlot(t.db, c, "summary");
    expect(slot?.lastError).toBe("http 502");
    expect(slot?.retryAfter?.getTime()).toBe(NOW.getTime() + BACKOFF_MS);
    expect(await claimLease(t.db, c, "summary", OA, new Date(NOW.getTime() + 60_000))).toBe(false);
    expect(await claimLease(t.db, c, "summary", OT, new Date(NOW.getTime() + 60_000), { ignoreBackoff: true })).toBe(true);
    await releaseLease(t.db, c, "summary", OT);
    expect(await claimLease(t.db, c, "summary", OX, new Date(NOW.getTime() + BACKOFF_MS + 1000))).toBe(true);
  });

  it("clearBackoff forgets the error", async () => {
    const c = fresh();
    await ensureSlot(t.db, c, "summary", "unit-s");
    await setBackoff(t.db, c, "summary", NOW, "boom");
    await clearBackoff(t.db, c, "summary");
    const slot = await getSlot(t.db, c, "summary");
    expect([slot?.retryAfter, slot?.lastError, slot?.lastErrorAt]).toEqual([null, null, null]);
  });

  it("hasActiveLease is true only while an unexpired lease exists on a listed concept", async () => {
    const c = fresh();
    const other = fresh();
    await ensureSlot(t.db, c, "summary", "unit-s");
    expect(await hasActiveLease(t.db, [c], NOW)).toBe(false);
    await claimLease(t.db, c, "summary", OA, NOW);
    expect(await hasActiveLease(t.db, [c], new Date(NOW.getTime() + 1000))).toBe(true);
    expect(await hasActiveLease(t.db, [other], new Date(NOW.getTime() + 1000))).toBe(false);
    expect(await hasActiveLease(t.db, [c], new Date(NOW.getTime() + LEASE_MS + 1000))).toBe(false);
    expect(await hasActiveLease(t.db, [], NOW)).toBe(false);
  });
});

describe("replacements", () => {
  it("stores a pending version as the slot's replacement", async () => {
    const c = fresh();
    const v = await insertReplacement(t.db, summary(c));
    expect(v.status).toBe("pending_review");
    const slot = await getSlot(t.db, c, "summary");
    expect(slot?.replacementVersionId).toBe(v.id);
    expect(slot?.liveVersionId).toBeNull();
  });

  it("a new replacement removes the previous one, so there is at most one", async () => {
    const c = fresh();
    const first = await insertReplacement(t.db, summary(c));
    const second = await insertReplacement(t.db, summary(c, { attemptNo: 2, origin: "auto_retry" }));
    const slot = await getSlot(t.db, c, "summary");
    expect(slot?.replacementVersionId).toBe(second.id);
    expect(await countVersions(c)).toBe(1);
    expect((await t.db.select().from(conceptVersions).where(eq(conceptVersions.id, first.id))).length).toBe(0);
  });

  it("markReviewed records a failure with its reason and keeps the version as the replacement", async () => {
    const c = fresh();
    const v = await insertReplacement(t.db, summary(c));
    await markReviewed(t.db, v.id, { status: "failed_review", reviewerModel: "vendor/reviewer", reason: "x".repeat(2000), at: NOW });
    const [row] = await t.db.select().from(conceptVersions).where(eq(conceptVersions.id, v.id));
    expect(row.status).toBe("failed_review");
    expect(row.reviewerReason).toHaveLength(1000); // truncated
    expect((await getSlot(t.db, c, "summary"))?.replacementVersionId).toBe(v.id);
    expect((await getSlot(t.db, c, "summary"))?.liveVersionId).toBeNull();
  });
});

describe("promotion", () => {
  const review = { reviewerModel: "vendor/reviewer", reason: null, at: NOW };

  it("approves the version and makes it live in one step", async () => {
    const c = fresh();
    const v = await insertReplacement(t.db, summary(c));
    expect(await promote(t.db, c, "summary", v.id, "reviewer", review)).toBe(true);
    const slot = await getSlot(t.db, c, "summary");
    expect(slot?.liveVersionId).toBe(v.id);
    expect(slot?.replacementVersionId).toBeNull();
    const [row] = await t.db.select().from(conceptVersions).where(eq(conceptVersions.id, v.id));
    expect(row).toMatchObject({ status: "approved", approvedBy: "reviewer", reviewerModel: "vendor/reviewer" });
    expect(row.reviewedAt?.getTime()).toBe(NOW.getTime());
  });

  it("replaces an earlier live version, which cleanupOrphans then removes", async () => {
    const c = fresh();
    const v1 = await insertReplacement(t.db, summary(c));
    await promote(t.db, c, "summary", v1.id, "reviewer", review);
    const v2 = await insertReplacement(t.db, summary(c, { origin: "teacher" }));
    expect((await getSlot(t.db, c, "summary"))?.liveVersionId).toBe(v1.id); // still on show until approved
    expect(await promote(t.db, c, "summary", v2.id, "reviewer", review)).toBe(true);
    expect((await getSlot(t.db, c, "summary"))?.liveVersionId).toBe(v2.id);
    expect(await countVersions(c)).toBe(2); // v1 is unreferenced but not yet gone
    await cleanupOrphans(t.db, c, "summary");
    expect(await countVersions(c)).toBe(1);
    await cleanupOrphans(t.db, c, "summary"); // idempotent
    expect(await countVersions(c)).toBe(1);
  });

  it("does nothing unless the version is the slot's current replacement", async () => {
    const c = fresh();
    const v1 = await insertReplacement(t.db, summary(c));
    const v2 = await insertReplacement(t.db, summary(c)); // v1 is gone, v2 is the replacement
    expect(await promote(t.db, c, "summary", v1.id, "reviewer", review)).toBe(false);
    expect(await promote(t.db, c, "summary", "00000000-0000-4000-8000-000000000000", "reviewer", review)).toBe(false);
    expect(await promote(t.db, fresh(), "summary", v2.id, "reviewer", review)).toBe(false); // wrong concept
    const slot = await getSlot(t.db, c, "summary");
    expect(slot?.liveVersionId).toBeNull();
    const [row] = await t.db.select().from(conceptVersions).where(eq(conceptVersions.id, v2.id));
    expect(row.status).toBe("pending_review");
  });

  it("a failed version stays out of the live pointer until a teacher approves it, and keeps the failure reason", async () => {
    const c = fresh();
    const v = await insertReplacement(t.db, summary(c));
    await markReviewed(t.db, v.id, { status: "failed_review", reviewerModel: "vendor/reviewer", reason: "inaccurate", at: NOW });
    expect((await getSlot(t.db, c, "summary"))?.liveVersionId).toBeNull();

    const later = new Date(NOW.getTime() + 3600_000);
    expect(await promote(t.db, c, "summary", v.id, "teacher", { reviewerModel: null, reason: null, at: later })).toBe(true);
    const [row] = await t.db.select().from(conceptVersions).where(eq(conceptVersions.id, v.id));
    expect(row).toMatchObject({ status: "approved", approvedBy: "teacher", reviewerReason: "inaccurate", reviewerModel: "vendor/reviewer" });
    expect(row.reviewedAt?.getTime()).toBe(later.getTime());
    expect((await getSlot(t.db, c, "summary"))?.liveVersionId).toBe(v.id);
  });

  it("refuses a reviewer approval without a reviewer model (the database check)", async () => {
    const c = fresh();
    const v = await insertReplacement(t.db, summary(c));
    await expect(
      promote(t.db, c, "summary", v.id, "reviewer", { reviewerModel: null, reason: null, at: NOW }),
    ).rejects.toThrow();
    expect((await getSlot(t.db, c, "summary"))?.liveVersionId).toBeNull();
  });

  it("promotes an illustration the same way, independently of its summary", async () => {
    const c = fresh();
    const s = await insertReplacement(t.db, summary(c));
    await promote(t.db, c, "summary", s.id, "reviewer", review);
    const ill = await insertReplacement(t.db, {
      conceptId: c, kind: "illustration", unitId: "unit-s", origin: "first", attemptNo: 1,
      illustrationSvg: "<svg/>", illustrationBrief: "brief", illustrationAlt: "alt",
      generatorModel: "vendor/drawer", generatedAt: NOW,
    });
    expect((await getSlot(t.db, c, "summary"))?.liveVersionId).toBe(s.id);
    expect(await promote(t.db, c, "illustration", ill.id, "reviewer", review)).toBe(true);
    expect((await getSlot(t.db, c, "illustration"))?.liveVersionId).toBe(ill.id);
    expect((await getSlot(t.db, c, "summary"))?.liveVersionId).toBe(s.id);
  });
});

describe("contentVersionHash", () => {
  it("is stable, order-independent and changes when the set changes", () => {
    const a = contentVersionHash(["b", "a", "c"]);
    expect(contentVersionHash(["c", "b", "a"])).toBe(a);
    expect(contentVersionHash(["a", "b"])).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{10}$/);
  });

  it("ignores missing ids, and an empty set hashes to '0'", () => {
    expect(contentVersionHash([null, undefined])).toBe("0");
    expect(contentVersionHash(["a", null])).toBe(contentVersionHash(["a"]));
  });
});

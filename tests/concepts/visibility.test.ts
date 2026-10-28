// Students read only approved, live concept content (spec 002 FR-027, FR-029, SC-011, SC-012).
// `loadApprovedContent` is the only read path; these tests try to get anything else out of it.

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadApprovedContent } from "@/lib/db/queries/concepts.server";
import { conceptVersions } from "@/lib/db/schema";
import { insertReplacement, markReviewed, promote, cleanupOrphans, type NewVersion } from "@/lib/concepts/store.server";

import { createTestDb, type TestDb } from "../helpers/db";

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

const NOW = new Date("2026-10-28T10:00:00Z");
let n = 0;
const fresh = () => `unit-v.c-${++n}`;
const BULLETS = ["one", "two", "three"];

const summary = (conceptId: string, over: Partial<NewVersion> = {}): NewVersion => ({
  conceptId, kind: "summary", unitId: "unit-v", origin: "first", attemptNo: 1,
  summaryBullets: BULLETS, generatorModel: "vendor/secret-generator", generatedAt: NOW, ...over,
});
const picture = (conceptId: string): NewVersion => ({
  conceptId, kind: "illustration", unitId: "unit-v", origin: "first", attemptNo: 1,
  illustrationSvg: "<svg/>", illustrationBrief: "brief", illustrationAlt: "A labelled graph",
  generatorModel: "vendor/secret-drawer", generatedAt: NOW,
});
const approve = (conceptId: string, versionId: string, kind: "summary" | "illustration" = "summary") =>
  promote(t.db, conceptId, kind, versionId, "reviewer", { reviewerModel: "vendor/secret-reviewer", reason: null, at: NOW });
const fail = (versionId: string, reason = "Quotes the model answer: the secret model answer text.") =>
  markReviewed(t.db, versionId, { status: "failed_review", reviewerModel: "vendor/secret-reviewer", reason, at: NOW });

describe("loadApprovedContent", () => {
  it("returns nothing for a concept with nothing stored, and for an empty list", async () => {
    const c = fresh();
    expect((await loadApprovedContent(t.db, [c])).size).toBe(0);
    expect((await loadApprovedContent(t.db, [])).size).toBe(0);
  });

  it("returns the live approved summary and picture, and only those fields", async () => {
    const c = fresh();
    const s = await insertReplacement(t.db, summary(c));
    await approve(c, s.id);
    const p = await insertReplacement(t.db, picture(c));
    await approve(c, p.id, "illustration");

    const got = (await loadApprovedContent(t.db, [c])).get(c)!;
    expect(got).toEqual({
      summary: { versionId: s.id, bullets: BULLETS },
      illustration: { versionId: p.id, alt: "A labelled graph" },
    });
    // nothing a student must not see: no reason, error, model name or time
    const text = JSON.stringify(got);
    for (const secret of ["secret-generator", "secret-reviewer", "secret-drawer", "vendor/", "reviewerReason", "lastError", "generatedAt"]) {
      expect(text).not.toContain(secret);
    }
    expect(Object.keys(got).sort()).toEqual(["illustration", "summary"]);
  });

  it("returns nothing for a version that is pending review", async () => {
    const c = fresh();
    await insertReplacement(t.db, summary(c));
    expect((await loadApprovedContent(t.db, [c])).size).toBe(0);
  });

  it("returns nothing for a version that failed review, however many times", async () => {
    const c = fresh();
    const first = await insertReplacement(t.db, summary(c));
    await fail(first.id);
    const second = await insertReplacement(t.db, summary(c, { attemptNo: 2, origin: "auto_retry" }));
    await fail(second.id, "Second failure.");
    expect((await loadApprovedContent(t.db, [c])).size).toBe(0);
  });

  it("a flagged picture never appears, though the approved summary does", async () => {
    const c = fresh();
    const s = await insertReplacement(t.db, summary(c));
    await approve(c, s.id);
    const p = await insertReplacement(t.db, picture(c));
    await fail(p.id);
    const got = (await loadApprovedContent(t.db, [c])).get(c)!;
    expect(got.summary).not.toBeNull();
    expect(got.illustration).toBeNull();
  });

  it("keeps showing the old approved version while a replacement is pending or flagged, then the new one once approved", async () => {
    const c = fresh();
    const v1 = await insertReplacement(t.db, summary(c, { summaryBullets: ["old 1", "old 2", "old 3"] }));
    await approve(c, v1.id);

    const v2 = await insertReplacement(t.db, summary(c, { origin: "teacher", summaryBullets: ["new 1", "new 2", "new 3"] }));
    expect((await loadApprovedContent(t.db, [c])).get(c)?.summary?.bullets).toEqual(["old 1", "old 2", "old 3"]); // pending
    await fail(v2.id);
    expect((await loadApprovedContent(t.db, [c])).get(c)?.summary?.bullets).toEqual(["old 1", "old 2", "old 3"]); // flagged

    const v3 = await insertReplacement(t.db, summary(c, { origin: "teacher", summaryBullets: ["new 1", "new 2", "new 3"] }));
    await approve(c, v3.id);
    await cleanupOrphans(t.db, c, "summary");
    expect((await loadApprovedContent(t.db, [c])).get(c)?.summary?.bullets).toEqual(["new 1", "new 2", "new 3"]);
  });

  it("an approved version that is only the replacement (promotion never finished) is not shown", async () => {
    const c = fresh();
    const v = await insertReplacement(t.db, summary(c));
    await t.db
      .update(conceptVersions)
      .set({ status: "approved", approvedBy: "reviewer", reviewerModel: "m", reviewedAt: NOW })
      .where(eq(conceptVersions.id, v.id));
    expect((await loadApprovedContent(t.db, [c])).size).toBe(0);
  });

  it("even a live pointer to a version that is not approved shows nothing (defence in depth)", async () => {
    const c = fresh();
    const v = await insertReplacement(t.db, summary(c));
    await approve(c, v.id);
    await t.db
      .update(conceptVersions)
      .set({ status: "failed_review", reviewerReason: "later found wrong", reviewedAt: NOW })
      .where(eq(conceptVersions.id, v.id));
    expect((await loadApprovedContent(t.db, [c])).size).toBe(0);
  });

  it("returns only the concepts asked for", async () => {
    const [c1, c2] = [fresh(), fresh()];
    for (const c of [c1, c2]) {
      const v = await insertReplacement(t.db, summary(c));
      await approve(c, v.id);
    }
    expect([...(await loadApprovedContent(t.db, [c1])).keys()]).toEqual([c1]);
    expect((await loadApprovedContent(t.db, [c1, c2])).size).toBe(2);
  });

  it("holds no student data anywhere it reads from", async () => {
    const res = await t.pg.query<{ column_name: string }>(
      `select column_name from information_schema.columns where table_name in ('concept_versions','concept_slots')`,
    );
    for (const banned of ["user_id", "email", "name", "answer"]) {
      expect(res.rows.map((r) => r.column_name)).not.toContain(banned);
    }
  });
});

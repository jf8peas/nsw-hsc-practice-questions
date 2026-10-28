import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  attempts,
  conceptSlots,
  conceptVersions,
  dailyAiUsage,
  dailyConceptUsage,
  results,
  users,
} from "@/lib/db/schema";

import { createTestDb, type TestDb } from "../helpers/db";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

let t: TestDb;

beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

async function columns(table: string): Promise<string[]> {
  const res = await t.pg.query<{ column_name: string }>(
    `select column_name from information_schema.columns
     where table_schema = 'public' and table_name = $1 order by column_name`,
    [table],
  );
  return res.rows.map((r) => r.column_name);
}

describe("migrations and column sets (Principle II)", () => {
  it("creates exactly the permitted columns, and no extra personal data", async () => {
    expect(await columns("users")).toEqual(
      [
        "id",
        "google_sub",
        "name",
        "email",
        "created_at",
        "last_sign_in_at",
        "last_answer_at",
      ].sort(),
    );
    expect(await columns("attempts")).toEqual(
      [
        "id",
        "user_id",
        "unit_id",
        "started_at",
        "completed_at",
        "question_ids",
        "mc_option_order",
      ].sort(),
    );
    expect(await columns("results")).toEqual(
      [
        "id",
        "attempt_id",
        "user_id",
        "unit_id",
        "question_id",
        "answer",
        "marks_awarded",
        "max_marks",
        "graded_by",
        "feedback",
        "rubric_hits",
        "rubric_misses",
        "created_at",
      ].sort(),
    );
    expect(await columns("daily_ai_usage")).toEqual(["user_id", "sydney_date", "count"].sort());
  });

  it("has no column that could hold a profile photo, token, model answer or rubric text", async () => {
    const all = [
      ...(await columns("users")),
      ...(await columns("attempts")),
      ...(await columns("results")),
    ];
    for (const banned of ["image", "picture", "photo", "token", "model_answer", "rubric", "notes"]) {
      expect(all.filter((c) => c === banned)).toEqual([]);
    }
  });
});

describe("constraints", () => {
  it("rejects a duplicate (attempt_id, question_id)", async () => {
    const u = await seedUser(t.db);
    const a = await seedAttempt(t.db, u.id);
    await seedResult(t.db, { attemptId: a.id, userId: u.id }, { questionId: "q.dup" });
    await expect(
      seedResult(t.db, { attemptId: a.id, userId: u.id }, { questionId: "q.dup" }),
    ).rejects.toThrow();
  });

  it("rejects marks outside 0..max and an unknown graded_by", async () => {
    const u = await seedUser(t.db);
    const a = await seedAttempt(t.db, u.id);
    await expect(
      seedResult(t.db, { attemptId: a.id, userId: u.id }, { marksAwarded: 3, maxMarks: 2 }),
    ).rejects.toThrow();
    await expect(
      seedResult(t.db, { attemptId: a.id, userId: u.id }, { marksAwarded: -1, maxMarks: 2 }),
    ).rejects.toThrow();
    await expect(
      seedResult(t.db, { attemptId: a.id, userId: u.id }, { gradedBy: "robot" }),
    ).rejects.toThrow();
  });

  it("rejects a negative daily AI count", async () => {
    const u = await seedUser(t.db);
    await expect(
      t.db.insert(dailyAiUsage).values({ userId: u.id, sydneyDate: "2026-01-01", count: -1 }),
    ).rejects.toThrow();
  });

  it("rejects a result whose user differs from its attempt's owner (composite FK)", async () => {
    const owner = await seedUser(t.db);
    const other = await seedUser(t.db);
    const a = await seedAttempt(t.db, owner.id);
    await expect(
      seedResult(t.db, { attemptId: a.id, userId: other.id }),
    ).rejects.toThrow();
  });

  it("deleting a user cascades to attempts, results and usage rows", async () => {
    const u = await seedUser(t.db);
    const a = await seedAttempt(t.db, u.id);
    await seedResult(t.db, { attemptId: a.id, userId: u.id });
    await t.db.insert(dailyAiUsage).values({ userId: u.id, sydneyDate: "2026-01-02", count: 3 });

    await t.db.delete(users).where(eq(users.id, u.id));

    const left = await t.db.select({ n: sql<number>`count(*)::int` }).from(results).where(eq(results.userId, u.id));
    const att = await t.db.select({ n: sql<number>`count(*)::int` }).from(attempts).where(eq(attempts.userId, u.id));
    const use = await t.db.select({ n: sql<number>`count(*)::int` }).from(dailyAiUsage).where(eq(dailyAiUsage.userId, u.id));
    expect([left[0].n, att[0].n, use[0].n]).toEqual([0, 0, 0]);
  });

  it("keeps results when a question disappears from content (no FK to content)", async () => {
    const u = await seedUser(t.db);
    const a = await seedAttempt(t.db, u.id);
    const r = await seedResult(t.db, { attemptId: a.id, userId: u.id }, { questionId: "removed.q1" });
    expect(r.questionId).toBe("removed.q1");
  });
});

describe("concept tables (spec 002)", () => {
  const base = {
    conceptId: "unit-a.c-one",
    unitId: "unit-a",
    origin: "first",
    attemptNo: 1,
    generatorModel: "vendor/generator",
    generatedAt: new Date("2026-10-28T00:00:00Z"),
  };
  const summary = (over: Record<string, unknown> = {}) => ({
    ...base,
    kind: "summary",
    status: "pending_review",
    summaryBullets: ["one", "two", "three"],
    ...over,
  });
  const illustration = (over: Record<string, unknown> = {}) => ({
    ...base,
    kind: "illustration",
    status: "pending_review",
    illustrationSvg: "<svg/>",
    illustrationBrief: "a brief",
    illustrationAlt: "alt text",
    ...over,
  });
  const insertVersion = (row: Record<string, unknown>) =>
    t.db.insert(conceptVersions).values(row as typeof conceptVersions.$inferInsert).returning();

  it("has exactly the columns in data-model.md, and none is a user column", async () => {
    expect(await columns("concept_versions")).toEqual(
      [
        "id", "concept_id", "kind", "unit_id", "status", "origin", "attempt_no", "summary_bullets",
        "illustration_brief", "illustration_alt", "illustration_svg", "generator_model",
        "generated_at", "reviewer_model", "reviewer_reason", "reviewed_at", "approved_by", "created_at",
      ].sort(),
    );
    expect(await columns("concept_slots")).toEqual(
      [
        "concept_id", "kind", "unit_id", "live_version_id", "replacement_version_id", "lease_owner",
        "lease_until", "retry_after", "last_error", "last_error_at", "created_at", "updated_at",
      ].sort(),
    );
    expect(await columns("daily_concept_usage")).toEqual(["sydney_date", "count"].sort());
    const all = [
      ...(await columns("concept_versions")),
      ...(await columns("concept_slots")),
      ...(await columns("daily_concept_usage")),
    ];
    for (const banned of ["user_id", "student_id", "name", "email", "answer", "attempt_id"]) {
      expect(all.filter((c) => c === banned)).toEqual([]);
    }
  });

  it("rejects a summary with an SVG, an illustration with bullets, and a bullet count outside 3 to 6", async () => {
    await expect(insertVersion(summary({ illustrationSvg: "<svg/>" }))).rejects.toThrow();
    await expect(insertVersion(illustration({ summaryBullets: ["a", "b", "c"] }))).rejects.toThrow();
    await expect(insertVersion(summary({ summaryBullets: ["a", "b"] }))).rejects.toThrow();
    await expect(insertVersion(summary({ summaryBullets: ["a", "b", "c", "d", "e", "f", "g"] }))).rejects.toThrow();
    await expect(insertVersion(illustration({ illustrationAlt: null }))).rejects.toThrow();
    await expect(insertVersion(summary())).resolves.toHaveLength(1);
    await expect(insertVersion(illustration())).resolves.toHaveLength(1);
  });

  it("rejects an unknown kind, status, origin or attempt number", async () => {
    await expect(insertVersion(summary({ kind: "poster" }))).rejects.toThrow();
    await expect(insertVersion(summary({ status: "live" }))).rejects.toThrow();
    await expect(insertVersion(summary({ origin: "robot" }))).rejects.toThrow();
    await expect(insertVersion(summary({ attemptNo: 3 }))).rejects.toThrow();
  });

  it("approved needs who approved it and when; a reviewer approval needs a reviewer model", async () => {
    await expect(insertVersion(summary({ status: "approved" }))).rejects.toThrow();
    await expect(
      insertVersion(summary({ status: "approved", approvedBy: "reviewer", reviewedAt: new Date() })),
    ).rejects.toThrow();
    await expect(
      insertVersion(summary({ status: "approved", approvedBy: "robot", reviewedAt: new Date(), reviewerModel: "m" })),
    ).rejects.toThrow();
    await expect(
      insertVersion(summary({ status: "approved", approvedBy: "reviewer", reviewedAt: new Date(), reviewerModel: "vendor/reviewer" })),
    ).resolves.toHaveLength(1);
    await expect(
      insertVersion(summary({ status: "approved", approvedBy: "teacher", reviewedAt: new Date() })),
    ).resolves.toHaveLength(1);
  });

  it("failed_review needs a reason and a review time", async () => {
    await expect(insertVersion(summary({ status: "failed_review" }))).rejects.toThrow();
    await expect(
      insertVersion(summary({ status: "failed_review", reviewerReason: "not accurate" })),
    ).rejects.toThrow();
    await expect(
      insertVersion(summary({ status: "failed_review", reviewerReason: "not accurate", reviewedAt: new Date() })),
    ).resolves.toHaveLength(1);
  });

  it("a slot cannot point its live and replacement at the same version", async () => {
    const [v] = await insertVersion(summary({ conceptId: "unit-a.c-slot" }));
    await expect(
      t.db.insert(conceptSlots).values({
        conceptId: "unit-a.c-slot", kind: "summary", unitId: "unit-a",
        liveVersionId: v.id, replacementVersionId: v.id,
      }),
    ).rejects.toThrow();
    await expect(
      t.db.insert(conceptSlots).values({
        conceptId: "unit-a.c-slot", kind: "summary", unitId: "unit-a", replacementVersionId: v.id,
      }),
    ).resolves.toBeDefined();
  });

  it("a slot is unique per concept and kind", async () => {
    await t.db.insert(conceptSlots).values({ conceptId: "unit-a.c-dup", kind: "summary", unitId: "unit-a" });
    await expect(
      t.db.insert(conceptSlots).values({ conceptId: "unit-a.c-dup", kind: "summary", unitId: "unit-a" }),
    ).rejects.toThrow();
    await expect(
      t.db.insert(conceptSlots).values({ conceptId: "unit-a.c-dup", kind: "illustration", unitId: "unit-a" }),
    ).resolves.toBeDefined();
  });

  it("rejects a negative daily concept count", async () => {
    await expect(t.db.insert(dailyConceptUsage).values({ sydneyDate: "2026-01-01", count: -1 })).rejects.toThrow();
  });

  it("deleting a student changes nothing in the concept tables", async () => {
    const u = await seedUser(t.db);
    await insertVersion(summary({ conceptId: "unit-a.c-survives" }));
    await t.db.insert(dailyConceptUsage).values({ sydneyDate: "2026-01-03", count: 5 });
    const count = async () => [
      (await t.db.select({ n: sql<number>`count(*)::int` }).from(conceptVersions))[0].n,
      (await t.db.select({ n: sql<number>`count(*)::int` }).from(conceptSlots))[0].n,
      (await t.db.select({ n: sql<number>`count(*)::int` }).from(dailyConceptUsage))[0].n,
    ];
    const before = await count();
    await t.db.delete(users).where(eq(users.id, u.id));
    expect(await count()).toEqual(before);
  });

  it("adds the index the concept-progress loader uses", async () => {
    const res = await t.pg.query<{ indexdef: string }>(
      "select indexdef from pg_indexes where indexname = 'results_user_unit_created_idx'",
    );
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].indexdef).toMatch(/(user_id, unit_id, created_at, id)/);
  });
});

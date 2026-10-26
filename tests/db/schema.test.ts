import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { attempts, dailyAiUsage, results, users } from "@/lib/db/schema";

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

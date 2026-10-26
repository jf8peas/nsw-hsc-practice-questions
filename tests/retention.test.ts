import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { attempts, dailyAiUsage, results, users } from "@/lib/db/schema";
import { runRetention } from "@/lib/retention.server";

import { createTestDb, type TestDb } from "./helpers/db";
import { seedAttempt, seedResult, seedUsage, seedUser } from "./helpers/fixtures";

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

const NOW = new Date("2026-10-26T03:00:00.000Z");
/** `NOW` minus exactly two years. */
const TWO_YEARS_AGO = new Date("2024-10-26T03:00:00.000Z");
const plus = (d: Date, ms: number) => new Date(d.getTime() + ms);

const exists = async (id: string) =>
  (await t.db.select({ id: users.id }).from(users).where(eq(users.id, id))).length === 1;

async function student(opts: {
  created: Date;
  signIn?: Date;
  answer?: Date | null;
}) {
  const u = await seedUser(t.db, {
    createdAt: opts.created,
    lastSignInAt: opts.signIn ?? opts.created,
    lastAnswerAt: opts.answer ?? null,
  });
  return u;
}

describe("the 2-year cut-off (SC-009, FR-025)", () => {
  it("keeps a student whose last activity is exactly 2 years old, deletes one a second older", async () => {
    const exact = await student({ created: TWO_YEARS_AGO });
    const older = await student({ created: plus(TWO_YEARS_AGO, -1000) });
    const newer = await student({ created: plus(TWO_YEARS_AGO, 1000) });
    const r = await runRetention(t.db, NOW);
    expect(await exists(exact.id)).toBe(true);
    expect(await exists(newer.id)).toBe(true);
    expect(await exists(older.id)).toBe(false);
    expect(r.deletedStudents).toBeGreaterThanOrEqual(1);
  });

  it("last activity is the latest of answer, sign-in and creation", async () => {
    const old = new Date("2023-01-01T00:00:00Z");
    // answered long ago but signed in recently -> kept
    const recentSignIn = await student({ created: old, signIn: new Date("2026-09-01T00:00:00Z"), answer: old });
    // signed in long ago but answered recently -> kept
    const recentAnswer = await student({ created: old, signIn: old, answer: new Date("2026-09-01T00:00:00Z") });
    // everything long ago -> deleted
    const allOld = await student({ created: old, signIn: old, answer: old });
    await runRetention(t.db, NOW);
    expect(await exists(recentSignIn.id)).toBe(true);
    expect(await exists(recentAnswer.id)).toBe(true);
    expect(await exists(allOld.id)).toBe(false);
  });

  it("an account that never answered is deleted 2 years after its last sign-in (or creation)", async () => {
    const created = new Date("2023-01-01T00:00:00Z");
    const neverAnswered = await student({ created, signIn: created, answer: null });
    const signedInRecently = await student({ created, signIn: new Date("2026-06-01T00:00:00Z"), answer: null });
    await runRetention(t.db, NOW);
    expect(await exists(neverAnswered.id)).toBe(false);
    expect(await exists(signedInRecently.id)).toBe(true);
  });

  it("a brand-new account is kept", async () => {
    const fresh = await student({ created: new Date("2026-10-01T00:00:00Z") });
    await runRetention(t.db, NOW);
    expect(await exists(fresh.id)).toBe(true);
  });

  it("is idempotent: running it again deletes nothing more", async () => {
    await student({ created: new Date("2020-01-01T00:00:00Z") });
    await runRetention(t.db, NOW);
    const again = await runRetention(t.db, NOW);
    expect(again.deletedStudents).toBe(0);
  });
});

describe("what goes with a deleted student", () => {
  it("cascades to attempts, results and usage rows, and leaves other students alone", async () => {
    const gone = await student({ created: new Date("2020-01-01T00:00:00Z") });
    const kept = await student({ created: new Date("2026-10-01T00:00:00Z") });
    const goneAttempt = await seedAttempt(t.db, gone.id);
    await seedResult(t.db, { attemptId: goneAttempt.id, userId: gone.id });
    await seedUsage(t.db, gone.id, "2026-10-25", 3);
    const keptAttempt = await seedAttempt(t.db, kept.id);
    await seedResult(t.db, { attemptId: keptAttempt.id, userId: kept.id });
    await seedUsage(t.db, kept.id, "2026-10-25", 2);

    await runRetention(t.db, NOW);

    const count = async (table: typeof attempts | typeof results | typeof dailyAiUsage, userId: string) =>
      (await t.db.select().from(table).where(eq(table.userId, userId))).length;
    expect(await count(attempts, gone.id)).toBe(0);
    expect(await count(results, gone.id)).toBe(0);
    expect(await count(dailyAiUsage, gone.id)).toBe(0);
    expect(await count(attempts, kept.id)).toBe(1);
    expect(await count(results, kept.id)).toBe(1);
    expect(await count(dailyAiUsage, kept.id)).toBe(1);
  });
});

describe("daily_ai_usage pruning and counts", () => {
  it("prunes usage rows older than 7 days (Sydney date) and returns the counts", async () => {
    const db = await createTestDb();
    try {
      const u = await seedUser(db.db, { createdAt: new Date("2026-10-01T00:00:00Z"), lastSignInAt: new Date("2026-10-01T00:00:00Z") });
      // NOW is 2026-10-26 14:00 Sydney; 7 days before is 2026-10-19
      for (const d of ["2026-10-10", "2026-10-18", "2026-10-19", "2026-10-25", "2026-10-26"]) {
        await seedUsage(db.db, u.id, d, 1);
      }
      const old = await seedUser(db.db, { createdAt: new Date("2020-01-01T00:00:00Z"), lastSignInAt: new Date("2020-01-01T00:00:00Z") });
      await seedUsage(db.db, old.id, "2026-10-25", 1);

      const r = await runRetention(db.db, NOW);
      expect(r.prunedUsageRows).toBe(2); // 10-10 and 10-18
      expect(r.deletedStudents).toBe(1);
      const left = (await db.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, u.id))).map((x) => x.sydneyDate).sort();
      expect(left).toEqual(["2026-10-19", "2026-10-25", "2026-10-26"]);
    } finally {
      await db.close();
    }
  });

  it("returns zero counts when there is nothing to do", async () => {
    const db = await createTestDb();
    try {
      expect(await runRetention(db.db, NOW)).toEqual({ deletedStudents: 0, prunedUsageRows: 0 });
    } finally {
      await db.close();
    }
  });
});

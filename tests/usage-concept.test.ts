// The separate daily cap on concept-pipeline model calls (spec 002 FR-030, SC-006; Principle VII).

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { dailyConceptUsage } from "@/lib/db/schema";
import { conceptCallsToday, refundConceptCall, reserveConceptCall } from "@/lib/concepts/store.server";

import { createTestDb, type TestDb } from "./helpers/db";

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

const used = async (day: string) =>
  (await t.db.select().from(dailyConceptUsage).where(eq(dailyConceptUsage.sydneyDate, day)))[0]?.count ?? 0;

describe("reserveConceptCall", () => {
  it("inserts the first call, then increments only while under the cap", async () => {
    const day = "2026-03-01";
    expect(await reserveConceptCall(t.db, 3, day)).toEqual({ sydneyDate: day });
    expect(await reserveConceptCall(t.db, 3, day)).toEqual({ sydneyDate: day });
    expect(await reserveConceptCall(t.db, 3, day)).toEqual({ sydneyDate: day });
    expect(await reserveConceptCall(t.db, 3, day)).toBeNull();
    expect(await used(day)).toBe(3);
  });

  it("never exceeds the cap under concurrency: 20 reservations against a cap of 7 grant exactly 7", async () => {
    const day = "2026-03-02";
    const grants = await Promise.all(Array.from({ length: 20 }, () => reserveConceptCall(t.db, 7, day)));
    expect(grants.filter(Boolean)).toHaveLength(7);
    expect(await used(day)).toBe(7);
  });

  it("a cap of 0 grants nothing and writes nothing", async () => {
    const day = "2026-03-03";
    expect(await reserveConceptCall(t.db, 0, day)).toBeNull();
    expect(await used(day)).toBe(0);
  });

  it("counts each Sydney day separately", async () => {
    expect(await reserveConceptCall(t.db, 1, "2026-03-04")).not.toBeNull();
    expect(await reserveConceptCall(t.db, 1, "2026-03-04")).toBeNull();
    expect(await reserveConceptCall(t.db, 1, "2026-03-05")).not.toBeNull(); // a fresh day
  });

  it("uses the database's Sydney date when no day is given, and reads it back", async () => {
    const before = await conceptCallsToday(t.db);
    const slot = await reserveConceptCall(t.db, 1000);
    expect(slot?.sydneyDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(await conceptCallsToday(t.db)).toBe(before + 1);
  });
});

describe("refundConceptCall", () => {
  it("gives a call back, and never goes below 0", async () => {
    const day = "2026-03-06";
    const slot = await reserveConceptCall(t.db, 5, day);
    expect(await used(day)).toBe(1);
    await refundConceptCall(t.db, slot!);
    expect(await used(day)).toBe(0);
    await refundConceptCall(t.db, slot!);
    expect(await used(day)).toBe(0);
    // the freed call can be taken again
    expect(await reserveConceptCall(t.db, 1, day)).not.toBeNull();
  });
});

describe("the counter is global", () => {
  it("has no student on it: one row per day", async () => {
    const res = await t.pg.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_name = 'daily_concept_usage'",
    );
    expect(res.rows.map((r) => r.column_name).sort()).toEqual(["count", "sydney_date"]);
  });
});

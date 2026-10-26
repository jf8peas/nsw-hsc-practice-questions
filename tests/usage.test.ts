import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { dailyAiUsage } from "@/lib/db/schema";
import { aiUsedToday, refundAiSlot, reserveAiSlot } from "@/lib/usage.server";

import { createTestDb, type TestDb } from "./helpers/db";
import { seedUser } from "./helpers/fixtures";

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

const countFor = async (userId: string, date?: string) => {
  const rows = await t.db
    .select()
    .from(dailyAiUsage)
    .where(date ? and(eq(dailyAiUsage.userId, userId), eq(dailyAiUsage.sydneyDate, date)) : eq(dailyAiUsage.userId, userId));
  return rows.reduce((s, r) => s + r.count, 0);
};

describe("reserveAiSlot (SC-006)", () => {
  it("with a cap of N, 3N concurrent reservations grant exactly N and deny the rest", async () => {
    const u = await seedUser(t.db);
    const N = 5;
    const results = await Promise.all(Array.from({ length: 3 * N }, () => reserveAiSlot(t.db, u.id, N)));
    expect(results.filter(Boolean)).toHaveLength(N);
    expect(results.filter((r) => r === null)).toHaveLength(2 * N);
    expect(await countFor(u.id)).toBe(N);
  });

  it("grants then denies sequentially at the cap", async () => {
    const u = await seedUser(t.db);
    expect(await reserveAiSlot(t.db, u.id, 2)).not.toBeNull();
    expect(await reserveAiSlot(t.db, u.id, 2)).not.toBeNull();
    expect(await reserveAiSlot(t.db, u.id, 2)).toBeNull();
    expect(await aiUsedToday(t.db, u.id)).toBe(2);
  });

  it("a cap of 0 (LLM off) denies everything and writes nothing", async () => {
    const u = await seedUser(t.db);
    expect(await reserveAiSlot(t.db, u.id, 0)).toBeNull();
    expect(await countFor(u.id)).toBe(0);
  });

  it("rows for different users are independent", async () => {
    const a = await seedUser(t.db);
    const b = await seedUser(t.db);
    expect(await reserveAiSlot(t.db, a.id, 1)).not.toBeNull();
    expect(await reserveAiSlot(t.db, a.id, 1)).toBeNull();
    expect(await reserveAiSlot(t.db, b.id, 1)).not.toBeNull();
  });

  it("a new Sydney date starts at 0", async () => {
    const u = await seedUser(t.db);
    expect(await reserveAiSlot(t.db, u.id, 1, "2026-01-01")).not.toBeNull();
    expect(await reserveAiSlot(t.db, u.id, 1, "2026-01-01")).toBeNull();
    expect(await reserveAiSlot(t.db, u.id, 1, "2026-01-02")).not.toBeNull();
    expect(await countFor(u.id, "2026-01-01")).toBe(1);
    expect(await countFor(u.id, "2026-01-02")).toBe(1);
  });

  it("uses the Sydney date as the database sees it (matches the teacher's 'today')", async () => {
    const u = await seedUser(t.db);
    const slot = await reserveAiSlot(t.db, u.id, 5);
    const sydneyToday = (
      await t.pg.query<{ d: string }>("select to_char((now() at time zone 'Australia/Sydney')::date, 'YYYY-MM-DD') as d")
    ).rows[0].d;
    expect(slot!.sydneyDate).toBe(sydneyToday);
    expect(await aiUsedToday(t.db, u.id)).toBe(1);
  });
});

describe("refundAiSlot", () => {
  it("frees a slot", async () => {
    const u = await seedUser(t.db);
    const slot = (await reserveAiSlot(t.db, u.id, 1))!;
    expect(await reserveAiSlot(t.db, u.id, 1)).toBeNull();
    await refundAiSlot(t.db, slot);
    expect(await reserveAiSlot(t.db, u.id, 1)).not.toBeNull();
  });

  it("never goes below 0", async () => {
    const u = await seedUser(t.db);
    const slot = (await reserveAiSlot(t.db, u.id, 3))!;
    await refundAiSlot(t.db, slot);
    await refundAiSlot(t.db, slot);
    await refundAiSlot(t.db, slot);
    expect(await countFor(u.id)).toBe(0);
  });

  it("refunds the day it was reserved on, even if the day has since changed", async () => {
    const u = await seedUser(t.db);
    const slot = (await reserveAiSlot(t.db, u.id, 5, "2026-03-01"))!;
    await reserveAiSlot(t.db, u.id, 5, "2026-03-02");
    await refundAiSlot(t.db, slot);
    expect(await countFor(u.id, "2026-03-01")).toBe(0);
    expect(await countFor(u.id, "2026-03-02")).toBe(1);
  });

  it("refund followed by concurrent reservations still never exceeds the cap", async () => {
    const u = await seedUser(t.db);
    const cap = 3;
    const first = (await reserveAiSlot(t.db, u.id, cap))!;
    await refundAiSlot(t.db, first);
    const many = await Promise.all(Array.from({ length: 10 }, () => reserveAiSlot(t.db, u.id, cap)));
    expect(many.filter(Boolean)).toHaveLength(cap);
    expect(await countFor(u.id)).toBe(cap);
  });
});

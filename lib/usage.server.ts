import "server-only";

import { and, eq, sql } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import { dailyAiUsage } from "@/lib/db/schema";

/** A reserved slot: remember which Sydney day it was taken on, so a refund hits the same row. */
export interface AiSlot {
  userId: string;
  sydneyDate: string;
}

/** The Sydney date as the database sees it, so the day boundary matches the teacher's "today" query. */
const dbSydneyToday = sql`(now() at time zone 'Australia/Sydney')::date`;

/**
 * Atomically reserve one AI-graded answer for today (Sydney time). One
 * statement: insert the first slot, or increment only while count < cap. Safe
 * under concurrency, so the cap can never be exceeded (SC-006).
 * Returns the slot, or null when the allowance is used up (or the cap is 0).
 * `sydneyDate` overrides the day (tests only).
 */
export async function reserveAiSlot(
  db: Db,
  userId: string,
  cap: number,
  sydneyDate?: string,
): Promise<AiSlot | null> {
  if (!(cap > 0)) return null;
  const day = sydneyDate ? sql`${sydneyDate}::date` : dbSydneyToday;
  const rows = await db
    .insert(dailyAiUsage)
    .values({ userId, sydneyDate: day as unknown as string, count: 1 })
    .onConflictDoUpdate({
      target: [dailyAiUsage.userId, dailyAiUsage.sydneyDate],
      set: { count: sql`${dailyAiUsage.count} + 1` },
      setWhere: sql`${dailyAiUsage.count} < ${cap}`,
    })
    .returning({ sydneyDate: dailyAiUsage.sydneyDate });
  return rows.length > 0 ? { userId, sydneyDate: rows[0].sydneyDate } : null;
}

/** Give a slot back (the LLM failed or fell back to self-marking). Never goes below 0. */
export async function refundAiSlot(db: Db, slot: AiSlot): Promise<void> {
  await db
    .update(dailyAiUsage)
    .set({ count: sql`greatest(${dailyAiUsage.count} - 1, 0)` })
    .where(and(eq(dailyAiUsage.userId, slot.userId), eq(dailyAiUsage.sydneyDate, slot.sydneyDate)));
}

/** How many AI-graded answers this student has used today (Sydney). */
export async function aiUsedToday(db: Db, userId: string): Promise<number> {
  const rows = await db
    .select({ count: dailyAiUsage.count })
    .from(dailyAiUsage)
    .where(and(eq(dailyAiUsage.userId, userId), eq(dailyAiUsage.sydneyDate, dbSydneyToday as unknown as string)));
  return rows[0]?.count ?? 0;
}

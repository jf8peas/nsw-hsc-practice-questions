import { randomUUID } from "node:crypto";

import type { Db } from "@/lib/db/index.server";
import { attempts, dailyAiUsage, results, users } from "@/lib/db/schema";

let counter = 0;

export async function seedUser(
  db: Db,
  overrides: Partial<typeof users.$inferInsert> = {},
): Promise<typeof users.$inferSelect> {
  counter += 1;
  const [row] = await db
    .insert(users)
    .values({
      googleSub: `sub-${counter}-${randomUUID()}`,
      name: `Student ${counter}`,
      email: `student${counter}@example.com`,
      ...overrides,
    })
    .returning();
  return row;
}

export async function seedAttempt(
  db: Db,
  userId: string,
  overrides: Partial<typeof attempts.$inferInsert> = {},
): Promise<typeof attempts.$inferSelect> {
  const [row] = await db
    .insert(attempts)
    .values({
      userId,
      unitId: "y11-formula-test",
      questionIds: [],
      mcOptionOrder: {},
      ...overrides,
    })
    .returning();
  return row;
}

export async function seedResult(
  db: Db,
  base: { attemptId: string; userId: string },
  overrides: Partial<typeof results.$inferInsert> = {},
): Promise<typeof results.$inferSelect> {
  counter += 1;
  const [row] = await db
    .insert(results)
    .values({
      unitId: "y11-formula-test",
      questionId: `y11-formula-test.q${counter}`,
      answer: "an answer",
      marksAwarded: 1,
      maxMarks: 1,
      gradedBy: "auto",
      ...base,
      ...overrides,
    })
    .returning();
  return row;
}

export async function seedUsage(
  db: Db,
  userId: string,
  sydneyDate: string,
  count: number,
): Promise<void> {
  await db.insert(dailyAiUsage).values({ userId, sydneyDate, count });
}

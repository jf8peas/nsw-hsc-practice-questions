// The clean-up for archived essays (17 Nov 2026): a dry-run plan, and a clear that removes only a
// student's UNFINISHED essays, leaves finished essays, live essays and other students alone, and
// takes the marks and drafts with the attempts (cascade).
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { attempts, results } from "@/lib/db/schema";

import { clearUnfinished, describePlan, planClear, UNIT } from "../../scripts/clear-unfinished-essays";
import { setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const id = (essay: string, part: number) => `${UNIT}.${essay}p${part}`;

/** A started part; with a mark when `marks` is given. */
async function part(userId: string, essay: string, p: number, marks?: number) {
  const a = await seedAttempt(env.db, userId, { unitId: UNIT, questionIds: [id(essay, p)], completedAt: marks === undefined ? null : new Date() });
  if (marks !== undefined) {
    await seedResult(env.db, { attemptId: a.id, userId }, { unitId: UNIT, questionId: id(essay, p), marksAwarded: marks, maxMarks: 4, gradedBy: "llm" });
  }
  return a;
}

async function world() {
  env = await setupTestEnv();
  const peyton = await seedUser(env.db, { name: "Peyton", email: "peyton@example.com" });
  const other = await seedUser(env.db, { name: "Other", email: "other@example.com" });
  // e01: parts 1 and 2 recorded, part 3 started and left open -> unfinished
  await part(peyton.id, "e01", 1, 3);
  await part(peyton.id, "e01", 2, 2);
  await part(peyton.id, "e01", 3);
  // e02: all five recorded -> finished, kept
  for (let p = 1; p <= 5; p++) await part(peyton.id, "e02", p, 4);
  // a live essay and another student's archived work are never touched
  await part(peyton.id, "e03", 1, 4);
  await part(other.id, "e01", 1, 1);
  return { peyton, other };
}

const count = async (table: typeof attempts | typeof results, userId: string) =>
  (await env.db.select().from(table).where(eq(table.userId, userId))).length;

describe("clear-unfinished-essays", () => {
  it("plans without changing anything: unfinished, finished and untouched essays", async () => {
    const { peyton } = await world();
    const plans = await planClear(env.db, peyton.id, ["e01", "e02", "e04"]);
    expect(plans.map((p) => [p.essayId, p.status, p.recordedParts, p.attemptCount])).toEqual([
      ["e01", "unfinished", [1, 2], 3],
      ["e02", "finished", [1, 2, 3, 4, 5], 5],
      ["e04", "none", [], 0],
    ]);
    expect(plans[0]).toMatchObject({ economy: "Vietnam", archived: true });
    expect(plans[2]).toMatchObject({ economy: "China", archived: false });
    expect(describePlan(plans[0])).toContain("UNFINISHED");
    expect(describePlan(plans[1])).toContain("Kept");
    expect(await count(attempts, peyton.id)).toBe(9);
  });

  it("clears only the unfinished essay, with its marks, and leaves everything else", async () => {
    const { peyton, other } = await world();
    const removed = await clearUnfinished(env.db, peyton.id, await planClear(env.db, peyton.id, ["e01", "e02"]));
    expect(removed).toBe(3);
    const left = await env.db.select().from(results).where(eq(results.userId, peyton.id));
    expect(left.map((r) => r.questionId).sort()).toEqual([...[1, 2, 3, 4, 5].map((p) => id("e02", p)), id("e03", 1)].sort());
    expect(await count(attempts, peyton.id)).toBe(6);
    expect(await count(results, other.id)).toBe(1);
    // running it again finds nothing unfinished
    const again = await planClear(env.db, peyton.id, ["e01", "e02"]);
    expect(again.map((p) => p.status)).toEqual(["none", "finished"]);
    expect(await clearUnfinished(env.db, peyton.id, again)).toBe(0);
  });
});

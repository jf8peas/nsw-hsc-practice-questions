import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { attempts } from "@/lib/db/schema";

import { setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const unit = UNITS.find((u) => u.id === "y11-physics-preliminary")!;
const [q1, q2, q3, q4] = unit.questions.slice(0, 4).map((q) => q.id);
const day = (n: number) => new Date(Date.UTC(2026, 0, n, 10));

async function load() {
  env = await setupTestEnv();
  return import("@/lib/db/queries/history.server");
}

async function attempt(userId: string, questionIds: string[], answered: string[], startedAt = day(1)) {
  const a = await seedAttempt(env.db, userId, { unitId: unit.id, questionIds, startedAt });
  for (const questionId of answered) {
    await seedResult(env.db, { attemptId: a.id, userId }, { unitId: unit.id, questionId });
  }
  return a;
}

describe("resume (FR-032)", () => {
  it("offers the latest incomplete attempt, listing only the questions still to answer", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const a = await attempt(me.id, [q1, q2, q3], [q1]);
    const r = (await h.unitHistory(env.db, me.id, unit.id)).resume!;
    expect(r).toMatchObject({ attemptId: a.id, answered: 1, total: 3 });
    expect(r.remainingIds).toEqual([q2, q3]);
  });

  it("skips retired questions", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    await attempt(me.id, [q1, "retired.q9", q2], [q1]);
    const r = (await h.unitHistory(env.db, me.id, unit.id)).resume!;
    expect(r.remainingIds).toEqual([q2]);
    expect(r).toMatchObject({ answered: 1, total: 2 });
  });

  it("completes (rather than offers) an attempt whose remaining questions are all retired", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const a = await attempt(me.id, [q1, "retired.q8", "retired.q9"], [q1]);
    const result = await h.unitHistory(env.db, me.id, unit.id);
    expect(result.resume).toBeNull();
    const [row] = await env.db.select().from(attempts).where(eq(attempts.id, a.id));
    expect(row.completedAt).toBeInstanceOf(Date);
    expect(result.attempts[0].completedAt).not.toBeNull();
    expect(result).toMatchObject({ completed: 1 });
  });

  it("offers only the latest incomplete attempt per unit", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    await attempt(me.id, [q1, q2], [q1], day(1));
    const newer = await attempt(me.id, [q3, q4], [q3], day(2));
    const r = (await h.unitHistory(env.db, me.id, unit.id)).resume!;
    expect(r.attemptId).toBe(newer.id);
  });

  it("starting a new attempt leaves the earlier one incomplete", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const older = await attempt(me.id, [q1, q2], [q1], day(1));
    await attempt(me.id, [q3, q4], [q3], day(2));
    const [row] = await env.db.select().from(attempts).where(eq(attempts.id, older.id));
    expect(row.completedAt).toBeNull();
    const history = await h.unitHistory(env.db, me.id, unit.id);
    expect(history.attempts).toHaveLength(2);
    expect(history.attempts.every((a) => a.completedAt === null)).toBe(true);
  });

  it("does not offer a completed attempt, or an attempt with no saved answers", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    await seedAttempt(env.db, me.id, { unitId: unit.id, questionIds: [q1], completedAt: day(1), startedAt: day(1) });
    await attempt(me.id, [q2], []); // nothing answered yet
    expect((await h.unitHistory(env.db, me.id, unit.id)).resume).toBeNull();
  });

  it("never offers another student's attempt", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const other = await seedUser(env.db);
    await attempt(other.id, [q1, q2], [q1]);
    expect((await h.unitHistory(env.db, me.id, unit.id)).resume).toBeNull();
  });

  it("works on any device: the same offer every time", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    await attempt(me.id, [q1, q2], [q1]);
    const first = (await h.unitHistory(env.db, me.id, unit.id)).resume;
    const second = (await h.unitHistory(env.db, me.id, unit.id)).resume;
    expect(second).toEqual(first);
    expect(first).not.toBeNull();
  });
});

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

const unitA = UNITS.find((u) => u.id === "y11-physics-preliminary")!;
const unitB = UNITS.find((u) => u.id === "y11-economics-preliminary")!;
const qa = unitA.questions.slice(0, 6).map((q) => q.id);
const qb = unitB.questions.slice(0, 3).map((q) => q.id);

async function load() {
  env = await setupTestEnv();
  return import("@/lib/db/queries/history.server");
}

/** An attempt with one result per entry: [questionId, marks, max]. */
async function attemptWith(
  userId: string,
  unitId: string,
  questionIds: string[],
  answered: Array<[string, number, number]>,
  opts: { completedAt?: Date | null; startedAt?: Date } = {},
) {
  const a = await seedAttempt(env.db, userId, {
    unitId,
    questionIds,
    startedAt: opts.startedAt ?? new Date(),
    completedAt: opts.completedAt ?? null,
  });
  for (const [questionId, marksAwarded, maxMarks] of answered) {
    await seedResult(env.db, { attemptId: a.id, userId }, { unitId, questionId, marksAwarded, maxMarks });
  }
  return a;
}

const day = (n: number) => new Date(Date.UTC(2026, 0, n, 10));

describe("unit history", () => {
  it("lists only this student's attempts at this unit, newest first, with scores", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const other = await seedUser(env.db);
    await attemptWith(me.id, unitA.id, qa.slice(0, 2), [[qa[0], 1, 2], [qa[1], 2, 2]], { startedAt: day(1), completedAt: day(1) });
    await attemptWith(me.id, unitA.id, qa.slice(0, 2), [[qa[0], 2, 2], [qa[1], 2, 2]], { startedAt: day(2), completedAt: day(2) });
    await attemptWith(me.id, unitB.id, qb.slice(0, 1), [[qb[0], 1, 1]], { startedAt: day(3), completedAt: day(3) });
    await attemptWith(other.id, unitA.id, qa.slice(0, 1), [[qa[0], 1, 1]], { startedAt: day(4), completedAt: day(4) });

    const r = await h.unitHistory(env.db, me.id, unitA.id);
    expect(r.attempts.map((a) => a.percent)).toEqual([100, 75]);
    expect(r.attempts[0]).toMatchObject({ marks: 4, max: 4, answered: 2, total: 2 });
    expect(r.attempts.every((a) => a.unitId === unitA.id)).toBe(true);
    expect(r).toMatchObject({ best: 100, latest: 100, completed: 2 });
  });

  it("best and latest come from completed attempts only; incomplete ones are listed", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    await attemptWith(me.id, unitA.id, qa.slice(0, 2), [[qa[0], 1, 2], [qa[1], 1, 2]], { startedAt: day(1), completedAt: day(1) });
    await attemptWith(me.id, unitA.id, qa.slice(0, 3), [[qa[0], 1, 1]], { startedAt: day(2), completedAt: null });
    const r = await h.unitHistory(env.db, me.id, unitA.id);
    expect(r.attempts).toHaveLength(2);
    expect(r.attempts[0]).toMatchObject({ completedAt: null, percent: 100 });
    expect(r).toMatchObject({ best: 50, latest: 50, completed: 1 });
  });

  it("an empty history is not an error", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    expect(await h.unitHistory(env.db, me.id, unitA.id)).toEqual({
      attempts: [],
      best: null,
      latest: null,
      completed: 0,
      resume: null,
    });
  });

  it("an attempt with no saved answers is not listed", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    await seedAttempt(env.db, me.id, { unitId: unitA.id, questionIds: qa });
    expect((await h.unitHistory(env.db, me.id, unitA.id)).attempts).toEqual([]);
  });
});

describe("per-unit progress summary", () => {
  it("gives attempt count, latest, best and trend per unit, scoped to the student", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const other = await seedUser(env.db);
    for (const [n, marks] of [[1, 1], [2, 2], [3, 2]] as const) {
      await attemptWith(me.id, unitA.id, [qa[0]], [[qa[0], marks, 2]], { startedAt: day(n), completedAt: day(n) });
    }
    await attemptWith(me.id, unitB.id, [qb[0]], [[qb[0], 0, 1]], { startedAt: day(5), completedAt: null });
    await attemptWith(other.id, unitA.id, [qa[0]], [[qa[0], 2, 2]], { startedAt: day(6), completedAt: day(6) });

    const summary = await h.progressSummary(env.db, me.id);
    const a = summary.find((s) => s.unitId === unitA.id)!;
    expect(a).toMatchObject({ attemptCount: 3, completedCount: 3, latest: 100, best: 100 });
    expect(a.trend.kind).toBe("up");
    expect(a.recent).toHaveLength(3);
    expect(a.recent[0].startedAt.getTime()).toBe(day(3).getTime());

    const b = summary.find((s) => s.unitId === unitB.id)!;
    expect(b).toMatchObject({ attemptCount: 1, completedCount: 0, latest: null, best: null });
    expect(b.trend.kind).toBe("none");
    expect(summary).toHaveLength(2);
  });

  it("returns an empty list for a student with no history", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    expect(await h.progressSummary(env.db, me.id)).toEqual([]);
  });
});

describe("attempt detail (SC-002, FR-014, FR-023)", () => {
  it("returns each question with the answer, marks and stored feedback, in drawn order", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const a = await attemptWith(me.id, unitA.id, [qa[0], qa[1], qa[2]], [], { completedAt: null });
    await seedResult(env.db, { attemptId: a.id, userId: me.id }, {
      unitId: unitA.id, questionId: qa[1], answer: "my words", marksAwarded: 2, maxMarks: 3,
      gradedBy: "llm", feedback: "Good", rubricHits: ["a"], rubricMisses: ["b"],
    });
    const d = (await h.attemptDetail(env.db, me.id, a.id))!;
    expect(d.items.map((i) => i.questionId)).toEqual([qa[0], qa[1], qa[2]]);
    expect(d.items[0]).toMatchObject({ answered: false, answer: null, marks: null });
    expect(d.items[1]).toMatchObject({
      answered: true, answer: "my words", marks: 2, max: 3, gradedBy: "llm",
      feedback: "Good", hits: ["a"], misses: ["b"], retired: false,
    });
    expect(d.attempt).toMatchObject({ marks: 2, max: 3, answered: 1, total: 3 });
  });

  it("student B asking for student A's attempt gets nothing", async () => {
    const h = await load();
    const a = await seedUser(env.db);
    const b = await seedUser(env.db);
    const att = await attemptWith(a.id, unitA.id, [qa[0]], [[qa[0], 1, 1]]);
    expect(await h.attemptDetail(env.db, b.id, att.id)).toBeNull();
    expect(await h.attemptDetail(env.db, b.id, "not-a-uuid")).toBeNull();
    expect(await h.attemptDetail(env.db, b.id, "00000000-0000-4000-8000-000000000000")).toBeNull();
    expect(await h.attemptDetail(env.db, a.id, att.id)).not.toBeNull();
  });

  it("flags a question missing from content as retired, keeping its stored answer and marks", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const a = await attemptWith(me.id, unitA.id, ["retired.q1", qa[0]], [["retired.q1", 1, 2], [qa[0], 1, 1]]);
    const d = (await h.attemptDetail(env.db, me.id, a.id))!;
    expect(d.items[0]).toMatchObject({ questionId: "retired.q1", retired: true, answered: true, marks: 1, max: 2 });
    expect(d.items[1].retired).toBe(false);
  });
});

describe("two devices and re-creation (SC-001, FR-027)", () => {
  it("the same data is returned every time for the same student (any device)", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    await attemptWith(me.id, unitA.id, [qa[0]], [[qa[0], 1, 1]], { startedAt: day(1), completedAt: day(1) });
    const phone = await h.unitHistory(env.db, me.id, unitA.id);
    const laptop = await h.unitHistory(env.db, me.id, unitA.id);
    expect(laptop).toEqual(phone);
    expect(await h.progressSummary(env.db, me.id)).toEqual(await h.progressSummary(env.db, me.id));
  });

  it("a deleted-then-recreated student sees an empty history", async () => {
    const h = await load();
    const old = await seedUser(env.db, { googleSub: "same-google-account" });
    await attemptWith(old.id, unitA.id, [qa[0]], [[qa[0], 1, 1]], { completedAt: day(1) });
    await env.testDb.pg.query("delete from users where id = $1", [old.id]);
    const fresh = await seedUser(env.db, { googleSub: "same-google-account" });
    expect(fresh.id).not.toBe(old.id);
    expect((await h.unitHistory(env.db, fresh.id, unitA.id)).attempts).toEqual([]);
    expect(await h.progressSummary(env.db, fresh.id)).toEqual([]);
  });
});

describe("loaders return { status: 'unavailable' } instead of throwing when the database is unreachable", () => {
  it("loadUnitHistory, loadProgress and loadAttemptDetail", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const att = await attemptWith(me.id, unitA.id, [qa[0]], [[qa[0], 1, 1]]);
    expect(await h.loadUnitHistory(me.id, unitA.id)).toMatchObject({ status: "ok" });
    env.databaseDown();
    expect(await h.loadUnitHistory(me.id, unitA.id)).toEqual({ status: "unavailable" });
    expect(await h.loadProgress(me.id)).toEqual({ status: "unavailable" });
    expect(await h.loadAttemptDetail(me.id, att.id)).toEqual({ status: "unavailable" });
    env.databaseUp();
    expect(await h.loadProgress(me.id)).toMatchObject({ status: "ok" });
  });

  it("a non-connection error is not swallowed", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    env.state.genericError = true;
    await expect(h.loadProgress(me.id)).rejects.toThrow("boom");
  });

  it("does not modify attempts when reading history", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const att = await attemptWith(me.id, unitA.id, [qa[0], qa[1]], [[qa[0], 1, 1]]);
    await h.loadProgress(me.id);
    const [row] = await env.db.select().from(attempts).where(eq(attempts.id, att.id));
    expect(row.completedAt).toBeNull();
  });
});

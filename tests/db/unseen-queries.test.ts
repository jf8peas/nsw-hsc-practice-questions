// spec 008: the phase-row queries and the open-attempt start on PGlite (research R8).

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createUnseenAttempt } from "@/lib/db/queries/attempts.server";
import {
  finaliseUnseenDecline,
  finaliseUnseenRetry,
  flagUnseenPhase,
  getUnseenPhase,
  insertUnseenPhase,
  listUnseenPhases,
} from "@/lib/db/queries/unseen-phases.server";
import type { SkillVerdicts } from "@/lib/db/schema";

import { createTestDb, type TestDb } from "../helpers/db";
import { seedAttempt, seedUser } from "../helpers/fixtures";

const UNIT = "y12-english-advanced-unseen-texts";
const Q1 = `${UNIT}.fs25-q1`;
const Q2 = `${UNIT}.fs25-q2`;

const v = (misses: string[] = []): SkillVerdicts => {
  const out = {} as SkillVerdicts;
  for (const id of ["answers-question", "directive-verb", "analyses-not-retells", "technique-effect", "apt-evidence", "human-experience", "succinct"] as const) {
    out[id] = { met: !misses.includes(id), reason: "r" };
  }
  return out;
};

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

async function seeded(sub: string) {
  const u = await seedUser(t.db, { googleSub: sub });
  const at = await seedAttempt(t.db, u.id, { unitId: UNIT, questionIds: [Q1] });
  const row = {
    attemptId: at.id, userId: u.id, unitId: UNIT, questionId: Q1, maxMarks: 4, status: "try1",
    try1Text: "first", try1Mark: 2, try1Verdicts: v(["technique-effect"]), try1Feedback: "f", try1BiggestGap: "g",
    try1PromptVersion: "unseen-pilot-4", try1Model: "m",
  };
  return { u, at, row };
}
const retry = { recordedMark: 3, try2: { text: "second", mark: 3, verdicts: v(), feedback: "f2", biggestGap: "g2", promptVersion: "unseen-pilot-4", model: "m" } };

describe("insertUnseenPhase and getUnseenPhase", () => {
  it("inserts once; a second insert changes nothing; reads are scoped to the owner", async () => {
    const { u, at, row } = await seeded("uq-1");
    expect(await insertUnseenPhase(t.db, row)).toEqual({ inserted: true });
    expect(await insertUnseenPhase(t.db, { ...row, try1Text: "other" })).toEqual({ inserted: false });
    expect((await getUnseenPhase(t.db, u.id, at.id, Q1))?.try1Text).toBe("first");
    const other = await seedUser(t.db, { googleSub: "uq-1b" });
    expect(await getUnseenPhase(t.db, other.id, at.id, Q1)).toBeNull();
    expect((await listUnseenPhases(t.db, u.id, at.id)).length).toBe(1);
  });
});

describe("finaliseUnseenRetry", () => {
  it("finalises a try1 row as retried with the capped mark and the recorded mark", async () => {
    const { u, at, row } = await seeded("uq-2");
    await insertUnseenPhase(t.db, row);
    const done = await finaliseUnseenRetry(t.db, u.id, at.id, Q1, retry);
    expect(done).toMatchObject({ status: "final", ending: "retried", recordedMark: 3, try2Mark: 3, try2Text: "second" });
  });

  it("two simultaneous finalises give one winner", async () => {
    const { u, at, row } = await seeded("uq-3");
    await insertUnseenPhase(t.db, row);
    const [a, b] = await Promise.all([
      finaliseUnseenRetry(t.db, u.id, at.id, Q1, retry),
      finaliseUnseenRetry(t.db, u.id, at.id, Q1, retry),
    ]);
    expect([a, b].filter(Boolean)).toHaveLength(1);
  });

  it("does nothing for a row that is already final", async () => {
    const { u, at, row } = await seeded("uq-4");
    await insertUnseenPhase(t.db, row);
    await finaliseUnseenDecline(t.db, u.id, at.id, Q1);
    expect(await finaliseUnseenRetry(t.db, u.id, at.id, Q1, retry)).toBeNull();
  });
});

describe("finaliseUnseenDecline", () => {
  it("records the first try's mark and ends declined, once", async () => {
    const { u, at, row } = await seeded("uq-5");
    await insertUnseenPhase(t.db, row);
    const done = await finaliseUnseenDecline(t.db, u.id, at.id, Q1);
    expect(done).toMatchObject({ status: "final", ending: "declined", recordedMark: 2, try2Mark: null });
    expect(await finaliseUnseenDecline(t.db, u.id, at.id, Q1)).toBeNull();
  });

  it("refuses when there is no row", async () => {
    const u = await seedUser(t.db, { googleSub: "uq-6" });
    const at = await seedAttempt(t.db, u.id, { unitId: UNIT, questionIds: [Q1] });
    expect(await finaliseUnseenDecline(t.db, u.id, at.id, Q1)).toBeNull();
  });
});

describe("flagUnseenPhase", () => {
  it("flags only a final row, once, and never touches the mark", async () => {
    const { u, at, row } = await seeded("uq-7");
    await insertUnseenPhase(t.db, row);
    expect(await flagUnseenPhase(t.db, u.id, at.id, Q1)).toBe(false); // still try1
    await finaliseUnseenDecline(t.db, u.id, at.id, Q1);
    expect(await flagUnseenPhase(t.db, u.id, at.id, Q1)).toBe(true);
    expect(await flagUnseenPhase(t.db, u.id, at.id, Q1)).toBe(false);
    const stored = await getUnseenPhase(t.db, u.id, at.id, Q1);
    expect(stored?.flaggedAt).not.toBeNull();
    expect(stored?.recordedMark).toBe(2);
  });
});

describe("createUnseenAttempt", () => {
  it("creates the open attempt, then returns it for a second start with a different question", async () => {
    const u = await seedUser(t.db, { googleSub: "uq-8" });
    const first = await createUnseenAttempt(t.db, { id: crypto.randomUUID(), userId: u.id, unitId: UNIT, questionId: Q1 });
    expect(first.created).toBe(true);
    const second = await createUnseenAttempt(t.db, { id: crypto.randomUUID(), userId: u.id, unitId: UNIT, questionId: Q2 });
    expect(second.created).toBe(false);
    expect(second.attempt.id).toBe(first.attempt.id);
    expect(second.attempt.questionIds).toEqual([Q1]);
  });

  it("two simultaneous starts end on one attempt", async () => {
    const u = await seedUser(t.db, { googleSub: "uq-9" });
    const [a, b] = await Promise.all([
      createUnseenAttempt(t.db, { id: crypto.randomUUID(), userId: u.id, unitId: UNIT, questionId: Q1 }),
      createUnseenAttempt(t.db, { id: crypto.randomUUID(), userId: u.id, unitId: UNIT, questionId: Q2 }),
    ]);
    expect(a.attempt.id).toBe(b.attempt.id);
    expect([a.created, b.created].sort()).toEqual([false, true]);
  });
});

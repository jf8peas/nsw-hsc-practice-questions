// spec 008: migration 0006 on PGlite: the unseen_phases table with its checks, and the partial unique
// index that keeps one OPEN attempt per student in the unseen-text unit (research R8).

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { unseenPhases, type SkillVerdicts } from "@/lib/db/schema";

import { createTestDb, type TestDb } from "../helpers/db";
import { seedAttempt, seedUser } from "../helpers/fixtures";

const UNIT = "y12-english-advanced-unseen-texts";
const Q1 = `${UNIT}.fs25-q1`;
const Q2 = `${UNIT}.fs25-q2`;

const skill = (met: boolean) => ({ met, reason: "because" });
const verdicts: SkillVerdicts = {
  "answers-question": skill(true),
  "directive-verb": skill(true),
  "analyses-not-retells": skill(true),
  "technique-effect": skill(false),
  "apt-evidence": skill(true),
  "human-experience": skill(true),
  succinct: skill(true),
};

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

describe("attempts_unseen_incomplete_unique", () => {
  it("rejects a second open attempt for the same student in the unseen unit", async () => {
    const u = await seedUser(t.db, { googleSub: "un-1" });
    await seedAttempt(t.db, u.id, { unitId: UNIT, questionIds: [Q1] });
    await expect(seedAttempt(t.db, u.id, { unitId: UNIT, questionIds: [Q2] })).rejects.toThrow();
  });

  it("allows a new open attempt once the last one is completed, another student, and other units", async () => {
    const a = await seedUser(t.db, { googleSub: "un-2" });
    const b = await seedUser(t.db, { googleSub: "un-3" });
    await seedAttempt(t.db, a.id, { unitId: UNIT, questionIds: [Q1], completedAt: new Date() });
    await seedAttempt(t.db, a.id, { unitId: UNIT, questionIds: [Q2] });
    await seedAttempt(t.db, b.id, { unitId: UNIT, questionIds: [Q1] });
    await seedAttempt(t.db, a.id, { unitId: "other-unit", questionIds: ["other-unit.q1"] });
    await seedAttempt(t.db, a.id, { unitId: "other-unit", questionIds: ["other-unit.q2"] });
  });
});

describe("unseen_phases checks", () => {
  async function base(sub: string) {
    const u = await seedUser(t.db, { googleSub: sub });
    const at = await seedAttempt(t.db, u.id, { unitId: UNIT, questionIds: [Q1] });
    return { attemptId: at.id, userId: u.id, unitId: UNIT, questionId: Q1, maxMarks: 4 };
  }
  const try1 = (mark: number) => ({
    try1Text: "x", try1Mark: mark, try1Verdicts: verdicts, try1Feedback: "f", try1BiggestGap: "g",
    try1PromptVersion: "unseen-pilot-4", try1Model: "deepseek/deepseek-v4.1-flash",
  });
  const try2 = (mark: number) => ({
    try2Text: "y", try2Mark: mark, try2Verdicts: verdicts, try2Feedback: "f", try2BiggestGap: "g",
    try2PromptVersion: "unseen-pilot-4", try2Model: "deepseek/deepseek-v4.1-flash",
  });

  it("accepts a try1 row and a retried final row where recorded is the higher mark", async () => {
    const b = await base("un-4");
    await t.db.insert(unseenPhases).values({ ...b, status: "try1", ...try1(2) });
    const c = await base("un-5");
    await t.db.insert(unseenPhases).values({ ...c, status: "final", ending: "retried", ...try1(2), ...try2(3), recordedMark: 3 });
  });

  it("rejects a recorded mark that is not the higher try", async () => {
    const b = await base("un-6");
    await expect(
      t.db.insert(unseenPhases).values({ ...b, status: "final", ending: "retried", ...try1(3), ...try2(2), recordedMark: 2 }),
    ).rejects.toThrow();
  });

  it("rejects a retry mark above max minus one, a first mark above max, and a max outside 1 to 6", async () => {
    const b = await base("un-7");
    await expect(
      t.db.insert(unseenPhases).values({ ...b, status: "final", ending: "retried", ...try1(2), ...try2(4), recordedMark: 4 }),
    ).rejects.toThrow();
    const c = await base("un-8");
    await expect(t.db.insert(unseenPhases).values({ ...c, status: "try1", ...try1(5) })).rejects.toThrow();
    const d = await base("un-9");
    await expect(t.db.insert(unseenPhases).values({ ...d, maxMarks: 7, status: "try1", ...try1(2) })).rejects.toThrow();
  });

  it("rejects a final row with no ending or no recorded mark, and endings that disagree with the retry", async () => {
    const b = await base("un-10");
    await expect(t.db.insert(unseenPhases).values({ ...b, status: "final", ...try1(4), recordedMark: 4 })).rejects.toThrow();
    const c = await base("un-11");
    await expect(t.db.insert(unseenPhases).values({ ...c, status: "final", ending: "declined", ...try1(2) })).rejects.toThrow();
    const d = await base("un-12");
    await expect(
      t.db.insert(unseenPhases).values({ ...d, status: "final", ending: "declined", ...try1(2), ...try2(3), recordedMark: 3 }),
    ).rejects.toThrow();
    const e = await base("un-13");
    await expect(t.db.insert(unseenPhases).values({ ...e, status: "final", ending: "retried", ...try1(2), recordedMark: 2 })).rejects.toThrow();
  });

  it("rejects a half-written retry (text without a mark and verdicts)", async () => {
    const b = await base("un-14");
    await expect(
      t.db.insert(unseenPhases).values({ ...b, status: "try1", ...try1(2), try2Text: "half" }),
    ).rejects.toThrow();
  });

  it("allows a flag only on a final row", async () => {
    const b = await base("un-15");
    await expect(
      t.db.insert(unseenPhases).values({ ...b, status: "try1", ...try1(2), flaggedAt: new Date() }),
    ).rejects.toThrow();
    const c = await base("un-16");
    await t.db.insert(unseenPhases).values({ ...c, status: "final", ending: "full_marks", ...try1(4), recordedMark: 4, flaggedAt: new Date() });
  });

  it("is unique per attempt and question", async () => {
    const b = await base("un-17");
    const row = { ...b, status: "try1", ...try1(2) };
    await t.db.insert(unseenPhases).values(row);
    await expect(t.db.insert(unseenPhases).values(row)).rejects.toThrow();
  });
});

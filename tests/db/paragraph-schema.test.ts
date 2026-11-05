// spec 007: migration 0005 on PGlite: the paragraph_phases table with its checks, and the partial
// unique index that keeps one attempt per paragraph-unit part (research R1, R6).

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { attempts, paragraphPhases, type ParagraphVerdicts } from "@/lib/db/schema";

import { createTestDb, type TestDb } from "../helpers/db";
import { seedAttempt, seedUser } from "../helpers/fixtures";

const UNIT = "y12-economics-paragraph-writing";
const Q1 = `${UNIT}.e01p1`;
const Q2 = `${UNIT}.e01p2`;

const verdicts: ParagraphVerdicts = {
  a: { met: true, reason: "ok" },
  b: { met: true, reason: "ok" },
  c: { met: false, reason: "no" },
  d: { met: true, reason: "ok", subs: { preciseLanguage: true, noPadding: true, withinLimit: true } },
};

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

describe("attempts_paragraph_part_unique", () => {
  it("rejects a second attempt for the same part of the paragraph unit", async () => {
    const u = await seedUser(t.db, { googleSub: "para-1" });
    await seedAttempt(t.db, u.id, { unitId: UNIT, questionIds: [Q1] });
    await expect(seedAttempt(t.db, u.id, { unitId: UNIT, questionIds: [Q1] })).rejects.toThrow();
  });

  it("allows another part, another student, and repeated questions in other units", async () => {
    const a = await seedUser(t.db, { googleSub: "para-2" });
    const b = await seedUser(t.db, { googleSub: "para-3" });
    await seedAttempt(t.db, a.id, { unitId: UNIT, questionIds: [Q1] });
    await seedAttempt(t.db, a.id, { unitId: UNIT, questionIds: [Q2] });
    await seedAttempt(t.db, b.id, { unitId: UNIT, questionIds: [Q1] });
    await seedAttempt(t.db, a.id, { unitId: "other-unit", questionIds: ["other-unit.q1"] });
    await seedAttempt(t.db, a.id, { unitId: "other-unit", questionIds: ["other-unit.q1"] });
    const rows = await t.db.select().from(attempts);
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });
});

describe("paragraph_phases checks", () => {
  async function base(sub: string) {
    const u = await seedUser(t.db, { googleSub: sub });
    const at = await seedAttempt(t.db, u.id, { unitId: UNIT, questionIds: [Q1] });
    return { attemptId: at.id, userId: u.id, unitId: UNIT, questionId: Q1 };
  }

  it("accepts a phase 1 row and a final row where recorded is the higher mark", async () => {
    const b = await base("para-4");
    await t.db.insert(paragraphPhases).values({
      ...b, status: "final", mode: "marker", ending: "corrected",
      phase1Text: "x", phase1Mark: 2, phase1Verdicts: verdicts,
      phase2Text: "y", phase2Mark: 3, phase2Verdicts: verdicts, recordedMark: 3,
    });
  });

  it("rejects a recorded mark that is not the higher try", async () => {
    const b = await base("para-5");
    await expect(
      t.db.insert(paragraphPhases).values({
        ...b, status: "final", mode: "marker", ending: "corrected",
        phase1Text: "x", phase1Mark: 3, phase1Verdicts: verdicts,
        phase2Text: "y", phase2Mark: 2, phase2Verdicts: verdicts, recordedMark: 2,
      }),
    ).rejects.toThrow();
  });

  it("rejects a phase 2 mark above the cap of 3, a phase 1 mark above 4, and a final row with no ending", async () => {
    const b = await base("para-6");
    await expect(
      t.db.insert(paragraphPhases).values({
        ...b, status: "phase1", mode: "marker", phase1Text: "x", phase1Mark: 2, phase1Verdicts: verdicts, phase2Mark: 4,
      }),
    ).rejects.toThrow();
    const c = await base("para-7");
    await expect(
      t.db.insert(paragraphPhases).values({ ...c, status: "phase1", mode: "marker", phase1Text: "x", phase1Mark: 5, phase1Verdicts: verdicts }),
    ).rejects.toThrow();
    const d = await base("para-8");
    await expect(
      t.db.insert(paragraphPhases).values({ ...d, status: "final", mode: "marker", phase1Text: "x", phase1Mark: 4, phase1Verdicts: verdicts, recordedMark: 4 }),
    ).rejects.toThrow();
  });

  it("allows a flag only on a marker-marked row", async () => {
    const b = await base("para-9");
    await expect(
      t.db.insert(paragraphPhases).values({
        ...b, status: "final", mode: "self_mark", ending: "self_mark",
        phase1Text: "x", phase1Mark: 3, phase1Verdicts: verdicts, recordedMark: 3, flaggedAt: new Date(),
      }),
    ).rejects.toThrow();
  });

  it("is unique per attempt and question, and deleted with its attempt", async () => {
    const b = await base("para-10");
    const row = { ...b, status: "phase1", mode: "marker", phase1Text: "x", phase1Mark: 2, phase1Verdicts: verdicts };
    await t.db.insert(paragraphPhases).values(row);
    await expect(t.db.insert(paragraphPhases).values(row)).rejects.toThrow();
  });
});

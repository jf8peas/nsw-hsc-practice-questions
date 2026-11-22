// spec 009: the pick queries on PGlite (research R5, R10): the pick is saved with the draft row before the
// first try, a draft save never touches it, and the first try's pick lives on the phase row.

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getRewriteDraft, savePickedTextIds, upsertRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import { getUnseenPhase, insertUnseenPhase } from "@/lib/db/queries/unseen-phases.server";
import type { SkillVerdicts } from "@/lib/db/schema";

import { createTestDb, type TestDb } from "../helpers/db";
import { seedAttempt, seedUser } from "../helpers/fixtures";

const UNIT = "y12-english-advanced-comparative-texts";
const Q1 = `${UNIT}.ab24-q5`;

const v = (): SkillVerdicts =>
  Object.fromEntries(
    ["answers-question", "directive-verb", "analyses-not-retells", "technique-effect", "apt-evidence", "human-experience", "succinct"].map((id) => [id, { met: true, reason: "r" }]),
  ) as SkillVerdicts;

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

async function start(sub: string) {
  const u = await seedUser(t.db, { googleSub: sub });
  const at = await seedAttempt(t.db, u.id, { unitId: UNIT, questionIds: [Q1] });
  return { userId: u.id, attemptId: at.id };
}

describe("the draft pick", () => {
  it("creates the draft row on the first save and round-trips, with an empty draft text", async () => {
    const { userId, attemptId } = await start("cq-1");
    await savePickedTextIds(t.db, userId, attemptId, UNIT, Q1, ["ab24-t2"]);
    const row = await getRewriteDraft(t.db, userId, attemptId, Q1);
    expect(row?.pickedTextIds).toEqual(["ab24-t2"]);
    expect(row?.phase1Draft).toBe("");
  });

  it("changing the pick replaces it; typing a draft keeps it; saving the pick keeps the draft", async () => {
    const { userId, attemptId } = await start("cq-2");
    await savePickedTextIds(t.db, userId, attemptId, UNIT, Q1, ["ab24-t2"]);
    await upsertRewriteDraft(t.db, userId, attemptId, UNIT, Q1, 1, "My comparison so far");
    expect((await getRewriteDraft(t.db, userId, attemptId, Q1))?.pickedTextIds).toEqual(["ab24-t2"]);
    await savePickedTextIds(t.db, userId, attemptId, UNIT, Q1, ["ab24-t3"]);
    const row = await getRewriteDraft(t.db, userId, attemptId, Q1);
    expect(row?.pickedTextIds).toEqual(["ab24-t3"]);
    expect(row?.phase1Draft).toBe("My comparison so far");
  });

  it("is scoped to the user: another user's attempt id finds no row", async () => {
    const a = await start("cq-3");
    const b = await seedUser(t.db, { googleSub: "cq-4" });
    await savePickedTextIds(t.db, a.userId, a.attemptId, UNIT, Q1, ["ab24-t2"]);
    expect(await getRewriteDraft(t.db, b.id, a.attemptId, Q1)).toBeNull();
  });
});

describe("the pick on the phase row", () => {
  it("is stored with the first try and read back", async () => {
    const { userId, attemptId } = await start("cq-5");
    const out = await insertUnseenPhase(t.db, {
      attemptId, userId, unitId: UNIT, questionId: Q1, maxMarks: 6, status: "try1",
      try1Text: "x", try1Mark: 3, try1Verdicts: v(), try1Feedback: "f", try1BiggestGap: "g",
      try1PromptVersion: "comparative-pilot-1", try1Model: "m", pickedTextIds: ["ab24-t2"],
    });
    expect(out.inserted).toBe(true);
    expect((await getUnseenPhase(t.db, userId, attemptId, Q1))?.pickedTextIds).toEqual(["ab24-t2"]);
  });

  it("is null for a fixed pair", async () => {
    const { userId, attemptId } = await start("cq-6");
    await insertUnseenPhase(t.db, {
      attemptId, userId, unitId: UNIT, questionId: Q1, maxMarks: 6, status: "try1",
      try1Text: "x", try1Mark: 3, try1Verdicts: v(), try1Feedback: "f", try1BiggestGap: "g",
      try1PromptVersion: "comparative-pilot-1", try1Model: "m",
    });
    expect((await getUnseenPhase(t.db, userId, attemptId, Q1))?.pickedTextIds).toBeNull();
  });
});

// Phase 2 of the paragraph unit through POST /api/grade (spec 007 FR-014 to FR-016, FR-019,
// FR-019a): the one capped correction, the higher-try rule, no skip and no third try, the ending
// that keeps the first-try mark when a correction cannot be marked, and the phase 1 self-mark.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { getAnswer } from "@/content/answers";
import { dailyAiUsage, paragraphPhases, results } from "@/lib/db/schema";

import {
  gradeParagraph,
  q,
  restoreParagraphEnv,
  setupParagraphEnv,
  startParagraph,
  type ParagraphEnv,
} from "../helpers/paragraph";
import { seedUsage } from "../helpers/fixtures";
import { signedInStudent } from "../helpers/routes";

let env: ParagraphEnv;
afterEach(async () => {
  restoreParagraphEnv();
  await env?.close();
});

const used = async (userId: string) =>
  (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce((s, r) => s + r.count, 0);
const phaseRow = async (questionId: string) =>
  (await env.db.select().from(paragraphPhases).where(eq(paragraphPhases.questionId, questionId)))[0];
const resultRow = async (questionId: string) =>
  (await env.db.select().from(results).where(eq(results.questionId, questionId)))[0];
const key = () => getAnswer(q(1, 1))!.paragraph!.essay;

async function afterFirstTry(first: string, opts: { cap?: string } = {}) {
  if (opts.cap !== undefined) process.env.LLM_DAILY_CAP = opts.cap;
  env = await setupParagraphEnv();
  const user = await signedInStudent(env);
  const { started, questionId } = await startParagraph();
  const r1 = await gradeParagraph(started, questionId, first);
  return { user, started, questionId, r1 };
}

describe("paragraph phase 2: the correction", () => {
  it("is capped at 3 even when every criterion is met, and the first try (not the correction) feeds the tips", async () => {
    const { user, started, questionId, r1 } = await afterFirstTry("First try. [met:ad]");
    expect(r1.body.result.marksAwarded).toBe(2);
    const r2 = await gradeParagraph(started, questionId, "A fuller correction. [met:abcd]", { phase: 2 });
    expect(r2.status).toBe(200);
    expect(r2.body.result).toMatchObject({ phase: 2, marksAwarded: 3, recordedMark: 3, ending: "corrected", needsSelfMark: false });
    expect(r2.body.result.phase1).toMatchObject({ mark: 2, text: "First try. [met:ad]" });
    expect(r2.body.result.discussion.modelPart).toBe(key().models[1]);
    expect(r2.body.saved).toBe(true);
    expect(r2.body.attemptCompleted).toBe(true);

    const row = await phaseRow(questionId);
    expect(row).toMatchObject({ status: "final", ending: "corrected", phase1Mark: 2, phase2Mark: 3, recordedMark: 3, phase2Text: "A fuller correction. [met:abcd]" });
    expect(row.phase2Verdicts!.b.met).toBe(true);
    expect(row.phase2PromptVersion).toBe("round 5 (4 Nov 2026)");
    const res = await resultRow(questionId);
    expect(res.marksAwarded).toBe(3);
    expect(res.answer).toBe("A fuller correction. [met:abcd]");
    // criteria b and c were missed on the first try, so their tips count as missed
    expect(res.conceptOutcomes!.map((o) => o.correct)).toEqual([true, false, false, true, true]);
    expect(await used(user.id)).toBe(2);
  });

  it("records the higher try when the correction scores lower", async () => {
    const { started, questionId } = await afterFirstTry("First try. [met:abd]");
    const r2 = await gradeParagraph(started, questionId, "Worse. [met:a]", { phase: 2 });
    expect(r2.body.result).toMatchObject({ marksAwarded: 1, recordedMark: 3, ending: "corrected" });
    expect((await resultRow(questionId)).marksAwarded).toBe(3);
    expect((await phaseRow(questionId)).recordedMark).toBe(3);
  });

  it("cannot be skipped, has no third try, and never takes more than two slots", async () => {
    const { user, started, questionId } = await afterFirstTry("First try. [met:ad]");
    const calls = env.chat.mock.calls.length;
    const skip = await gradeParagraph(started, questionId, "x", { phase: 2, skip: true });
    expect(skip.status).toBe(400);
    expect(env.chat.mock.calls.length).toBe(calls);
    expect(await used(user.id)).toBe(1);

    await gradeParagraph(started, questionId, "Correction. [met:abcd]", { phase: 2 });
    const third = await gradeParagraph(started, questionId, "Another. [met:abcd]", { phase: 2 });
    expect(third.status).toBe(409);
    expect(third.body.error).toBe("already_answered");
    expect(third.body.result.ending).toBe("corrected");
    expect(await used(user.id)).toBe(2);
  });

  it("is refused with no first try, and after a 4/4", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    const noFirst = await gradeParagraph(started, questionId, "text", { phase: 2 });
    expect(noFirst.status).toBe(400);
    expect(noFirst.body.error).toBe("phase_refused");
    await gradeParagraph(started, questionId, "Perfect. [met:abcd]");
    const afterFull = await gradeParagraph(started, questionId, "text", { phase: 2 });
    expect(afterFull.status).toBe(409);
  });
});

describe("FR-019a: a correction that cannot be marked keeps the first-try mark", () => {
  it("over the daily limit: 200, ending no_correction, no error, no correction stored", async () => {
    const { user, started, questionId } = await afterFirstTry("First try. [met:ad]", { cap: "1" });
    const r2 = await gradeParagraph(started, questionId, "Correction text. [met:abcd]", { phase: 2 });
    expect(r2.status).toBe(200);
    expect(r2.body.error).toBeUndefined();
    expect(r2.body.result).toMatchObject({ phase: 2, marksAwarded: null, recordedMark: 2, ending: "no_correction", needsSelfMark: false });
    expect(r2.body.result.criteria.filter((c: { met: boolean }) => !c.met).map((c: { key: string }) => c.key)).toEqual(["b", "c"]);
    expect(r2.body.result.discussion).toBeDefined();
    expect(r2.body.aiLimit.reached).toBe(true);
    const row = await phaseRow(questionId);
    expect(row).toMatchObject({ status: "final", ending: "no_correction", recordedMark: 2, phase2Text: null, phase2Mark: null });
    expect((await resultRow(questionId)).marksAwarded).toBe(2);
    expect(await used(user.id)).toBe(1);
    expect(env.chat).toHaveBeenCalledTimes(1);
  });

  it("marker unavailable: the same ending, and the slot is given back", async () => {
    const { user, started, questionId } = await afterFirstTry("First try. [met:ad]");
    env.chat.mockResolvedValue({ ok: false, reason: "http", status: 500 });
    const r2 = await gradeParagraph(started, questionId, "Correction text. [met:abcd]", { phase: 2 });
    expect(r2.status).toBe(200);
    expect(r2.body.error).toBeUndefined();
    expect(r2.body.result).toMatchObject({ ending: "no_correction", recordedMark: 2 });
    expect((await phaseRow(questionId)).ending).toBe("no_correction");
    expect(await used(user.id)).toBe(1); // phase 1's slot only: the failed correction was refunded
  });

  it("an unparseable reply twice counts as unavailable (one retry only)", async () => {
    const { started, questionId } = await afterFirstTry("First try. [met:ad]");
    env.chat.mockResolvedValue({ ok: true, content: "prose, not JSON" });
    const before = env.chat.mock.calls.length;
    const r2 = await gradeParagraph(started, questionId, "Correction. [met:abcd]", { phase: 2 });
    expect(r2.body.result.ending).toBe("no_correction");
    expect(env.chat.mock.calls.length - before).toBe(2);
  });
});

describe("phase 1: the marker is unavailable (self-mark)", () => {
  it("returns the model part and a self-mark token, no error, no row, and no slot used", async () => {
    env = await setupParagraphEnv();
    const user = await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    env.chat.mockResolvedValue({ ok: false, reason: "network" });
    const r = await gradeParagraph(started, questionId, "My text.");
    expect(r.status).toBe(200);
    expect(r.body.error).toBeUndefined();
    expect(r.body.result).toMatchObject({ needsSelfMark: true, marksAwarded: null });
    expect(r.body.result.discussion.modelPart).toBe(key().models[1]);
    expect(typeof r.body.selfMarkToken).toBe("string");
    expect(await phaseRow(questionId)).toBeUndefined();
    expect(await resultRow(questionId)).toBeUndefined();
    expect(await used(user.id)).toBe(0);
  });

  it("with the allowance already used up: the same screen, the reset time, and the model is never called", async () => {
    process.env.LLM_DAILY_CAP = "1";
    env = await setupParagraphEnv();
    const user = await signedInStudent(env);
    const { sydneyToday } = await import("../helpers/sydney-day");
    await seedUsage(env.db, user.id, await sydneyToday(env.db), 1);
    const { started, questionId } = await startParagraph();
    const r = await gradeParagraph(started, questionId, "My text.");
    expect(r.body.result.needsSelfMark).toBe(true);
    expect(r.body.aiLimit.reached).toBe(true);
    expect(env.chat).not.toHaveBeenCalled();
    expect(await used(user.id)).toBe(1);
  });

  it("with LLM_DAILY_CAP=0 the model is off: self-mark, no call", async () => {
    process.env.LLM_DAILY_CAP = "0";
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    const r = await gradeParagraph(started, questionId, "My text.");
    expect(r.body.result.needsSelfMark).toBe(true);
    expect(env.chat).not.toHaveBeenCalled();
  });
});

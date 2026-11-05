// The paragraph unit's grade flow through POST /api/grade (spec 007): phase 1, the phase row, the
// daily-allowance slot, the verdicts stored with the prompt version, and what may be released.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnswer } from "@/content/answers";
import { conceptProgress } from "@/lib/concepts/progress";
import { getUnit } from "@/content";
import { attempts, dailyAiUsage, paragraphPhases, results } from "@/lib/db/schema";

import {
  FEEDBACK,
  PARAGRAPH_UNIT,
  REASON,
  gradeParagraph,
  q,
  restoreParagraphEnv,
  setupParagraphEnv,
  startParagraph,
  words,
  type ParagraphEnv,
} from "../helpers/paragraph";
import { signedInStudent } from "../helpers/routes";

let env: ParagraphEnv;
afterEach(async () => {
  restoreParagraphEnv();
  vi.restoreAllMocks();
  await env?.close();
});

const used = async (userId: string) =>
  (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce((s, r) => s + r.count, 0);
const phaseRow = async (questionId: string) =>
  (await env.db.select().from(paragraphPhases).where(eq(paragraphPhases.questionId, questionId)))[0];
const resultRow = async (questionId: string) =>
  (await env.db.select().from(results).where(eq(results.questionId, questionId)))[0];
const key = () => getAnswer(q(1, 1))!.paragraph!.essay;

describe("paragraph phase 1: 4/4", () => {
  it("goes straight to the discussion: result saved, row final/full_marks, verdicts and prompt version stored", async () => {
    env = await setupParagraphEnv();
    const user = await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    expect(questionId).toBe(q(1, 1));

    const { status, body } = await gradeParagraph(started, questionId, "A strong topic sentence. [met:abcd]");
    expect(status).toBe(200);
    expect(body.saved).toBe(true);
    expect(body.attemptCompleted).toBe(true);
    expect(body.result).toMatchObject({ type: "paragraph", phase: 1, maxMarks: 4, marksAwarded: 4, recordedMark: 4, ending: "full_marks", needsSelfMark: false });
    expect(body.result.criteria.map((c: { key: string; met: boolean }) => [c.key, c.met])).toEqual([["a", true], ["b", true], ["c", true], ["d", true]]);
    expect(body.result.criteria[0].reason).toBe(REASON);
    expect(body.result.feedback).toBe(FEEDBACK);
    expect(body.result.discussion.modelPart).toBe(key().models[1]);

    const res = await resultRow(questionId);
    expect(res).toMatchObject({ userId: user.id, marksAwarded: 4, maxMarks: 4, gradedBy: "llm" });
    expect(res.conceptOutcomes).toHaveLength(5);
    expect(res.conceptOutcomes!.every((o) => o.correct)).toBe(true);

    const row = await phaseRow(questionId);
    expect(row).toMatchObject({ status: "final", mode: "marker", ending: "full_marks", phase1Mark: 4, recordedMark: 4, flaggedAt: null });
    expect(row.phase1Text).toContain("strong topic sentence");
    expect(row.phase1Verdicts.a).toEqual({ met: true, reason: REASON });
    expect(row.phase1Verdicts.d.subs).toEqual({ preciseLanguage: true, noPadding: true, withinLimit: true });
    expect(row.phase1PromptVersion).toBe("round 5 (4 Nov 2026)");
    expect(row.phase1Model).toBe("mock-default");
    expect(await used(user.id)).toBe(1);
  });
});

describe("paragraph phase 1: under 4", () => {
  it("keeps the model back: a phase row, no result, no discussion, no recorded mark", async () => {
    env = await setupParagraphEnv();
    const user = await signedInStudent(env);
    const { started, questionId } = await startParagraph();

    const { status, body } = await gradeParagraph(started, questionId, "Some topic sentence. [met:ad]");
    expect(status).toBe(200);
    expect(body.saved).toBe(false);
    expect(body.phaseSaved).toBe(true);
    expect(body.attemptCompleted).toBe(false);
    expect(body.result.marksAwarded).toBe(2);
    expect(body.result.discussion).toBeUndefined();
    expect(body.result.recordedMark).toBeUndefined();
    expect(body.result.ending).toBeUndefined();
    expect(body.result.criteria.filter((c: { met: boolean }) => !c.met).map((c: { key: string }) => c.key)).toEqual(["b", "c"]);

    // nothing from the key before the discussion: not the model part, not a note
    const text = JSON.stringify(body);
    expect(text).not.toContain(key().models[1].slice(0, 40));
    expect(text).not.toContain(key().markingNotes[1].slice(0, 40));
    expect(text).not.toContain("RESTATED-MUST-NOT-BE-KEPT");

    expect(await resultRow(questionId)).toBeUndefined();
    const row = await phaseRow(questionId);
    expect(row).toMatchObject({ status: "phase1", mode: "marker", phase1Mark: 2, recordedMark: null, ending: null });
    expect(row.phase1Verdicts.b).toEqual({ met: false, reason: REASON });
    expect(await used(user.id)).toBe(1);
  });

  it("stores the five phase-1 concept outcomes only when the question is final (no result yet)", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    await gradeParagraph(started, questionId, "Some topic sentence. [met:ad]");
    expect(await resultRow(questionId)).toBeUndefined();
    const unit = getUnit(PARAGRAPH_UNIT)!;
    expect(conceptProgress(unit, [])).toEqual([]);
  });
});

describe("paragraph phase 1: word limit and input", () => {
  it("over the limit loses (d) in code, still marks, never blocks", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    const { status, body } = await gradeParagraph(started, questionId, words(45, "[met:abcd]")); // topic limit is 40
    expect(status).toBe(200);
    expect(body.result.marksAwarded).toBe(3);
    const d = body.result.criteria.find((c: { key: string }) => c.key === "d");
    expect(d.met).toBe(false);
    expect(d.subs).toEqual({ preciseLanguage: true, noPadding: true, withinLimit: false });
    expect(d.reason).toContain("40-word limit");
    expect(body.result.wordCount).toBe(46);
  });

  it("refuses an empty or whitespace-only answer without a slot or a write", async () => {
    env = await setupParagraphEnv();
    const user = await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    expect((await gradeParagraph(started, questionId, "   \n ")).status).toBe(400);
    expect(env.chat).not.toHaveBeenCalled();
    expect(await used(user.id)).toBe(0);
    expect(await phaseRow(questionId)).toBeUndefined();
  });

  it("refuses an unknown phase", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    const r = await gradeParagraph(started, questionId, "text", { phase: "3" as unknown as 1 });
    expect(r.status).toBe(400);
  });
});

describe("paragraph phase 1: a second submit", () => {
  it("returns 409 already_answered with the stored result and takes no second slot", async () => {
    env = await setupParagraphEnv();
    const user = await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    await gradeParagraph(started, questionId, "Some topic sentence. [met:ad]");
    const again = await gradeParagraph(started, questionId, "Another try. [met:abcd]");
    expect(again.status).toBe(409);
    expect(again.body.error).toBe("already_answered");
    expect(again.body.result.marksAwarded).toBe(2);
    expect(env.chat).toHaveBeenCalledTimes(1);
    expect(await used(user.id)).toBe(1);
  });
});

describe("paragraph grading: logs and route config", () => {
  it("logs carry no answer text, reason, feedback, brief or model part", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const spies = [vi.spyOn(console, "info"), vi.spyOn(console, "warn"), vi.spyOn(console, "error"), vi.spyOn(console, "log")];
    const { started, questionId } = await startParagraph();
    await gradeParagraph(started, questionId, "UNIQUE-STUDENT-TEXT-9921 [met:ad]");
    const logged = spies.flatMap((s) => s.mock.calls.map((c) => c.join(" "))).join("\n");
    expect(logged).toContain("[paragraph]");
    for (const secret of ["UNIQUE-STUDENT-TEXT-9921", REASON, FEEDBACK, key().brief.argument.slice(0, 30), key().models[1].slice(0, 30)]) {
      expect(logged).not.toContain(secret);
    }
  });

  it("allows a model call longer than the platform default", async () => {
    env = await setupParagraphEnv();
    const route = await import("@/app/api/grade/route");
    expect(route.maxDuration).toBe(60);
  });
});

describe("paragraph attempts are single-question and owned", () => {
  it("the started attempt holds exactly the one part", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started } = await startParagraph();
    const [row] = await env.db.select().from(attempts).where(eq(attempts.id, started.attemptId));
    expect(row.questionIds).toEqual([q(1, 1)]);
  });
});

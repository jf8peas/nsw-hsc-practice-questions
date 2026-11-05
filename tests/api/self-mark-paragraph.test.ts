// The paragraph self-mark path (spec 007 FR-033): the marker is unavailable at phase 1, the student
// ticks each criterion, the ticks are the mark and the tip results, and there is no phase 2.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { getAnswer } from "@/content/answers";
import { paragraphPhases, results } from "@/lib/db/schema";

import {
  gradeParagraph,
  q,
  restoreParagraphEnv,
  setupParagraphEnv,
  startParagraph,
  type ParagraphEnv,
} from "../helpers/paragraph";
import { post, signedInStudent } from "../helpers/routes";

let env: ParagraphEnv;
afterEach(async () => {
  restoreParagraphEnv();
  await env?.close();
});

async function selfMark(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/results/self-mark/route");
  const res = await POST(post("/api/results/self-mark", body));
  return { status: res.status, body: await res.json() };
}

/** Start a part, let the marker fail, and return what the self-mark request needs. */
async function atSelfMark(text = "My own text.") {
  env = await setupParagraphEnv();
  const user = await signedInStudent(env);
  const { started, questionId } = await startParagraph();
  env.chat.mockResolvedValue({ ok: false, reason: "http", status: 500 });
  const g = await gradeParagraph(started, questionId, text);
  const req = {
    attemptId: started.attemptId,
    attemptToken: started.attemptToken,
    questionId,
    answer: text,
    token: g.body.selfMarkToken,
    phase: 1,
  };
  return { user, started, questionId, req, g };
}
const phaseRow = async (qid: string) => (await env.db.select().from(paragraphPhases).where(eq(paragraphPhases.questionId, qid)))[0];
const resultRow = async (qid: string) => (await env.db.select().from(results).where(eq(results.questionId, qid)))[0];

describe("POST /api/results/self-mark (paragraph)", () => {
  it("the ticks are the mark: three ticks is 3 of 4, the row is final/self_mark and the result is self-graded", async () => {
    const { questionId, req } = await atSelfMark();
    const r = await selfMark({ ...req, ticks: { a: true, b: true, c: true, d: false } });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ saved: true, marksAwarded: 3, recordedMark: 3, ending: "self_mark", attemptCompleted: true });
    expect(r.body.discussion.modelPart).toBe(getAnswer(q(1, 1))!.paragraph!.essay.models[1]);

    const row = await phaseRow(questionId);
    expect(row).toMatchObject({ status: "final", mode: "self_mark", ending: "self_mark", phase1Mark: 3, recordedMark: 3, phase1PromptVersion: null, phase1Model: null, flaggedAt: null });
    expect(row.phase1Verdicts.d).toEqual({ met: false, reason: "" });
    const res = await resultRow(questionId);
    expect(res).toMatchObject({ marksAwarded: 3, maxMarks: 4, gradedBy: "self", answer: "My own text." });
  });

  it("an unticked criterion is a phase 1 miss and a ticked one a correct use; a d tick covers both all-parts tips", async () => {
    const { questionId, req } = await atSelfMark();
    await selfMark({ ...req, ticks: { a: true, b: false, c: true, d: true } });
    expect((await resultRow(questionId)).conceptOutcomes!.map((o) => o.correct)).toEqual([true, false, true, true, true]);
  });

  it("all unticked is 0 and misses every tip", async () => {
    const { questionId, req } = await atSelfMark();
    const r = await selfMark({ ...req, ticks: { a: false, b: false, c: false, d: false } });
    expect(r.body.marksAwarded).toBe(0);
    expect((await resultRow(questionId)).conceptOutcomes!.every((o) => !o.correct)).toBe(true);
  });

  it("offers no phase 2: a self-marked correction is refused", async () => {
    const { req } = await atSelfMark();
    const r = await selfMark({ ...req, phase: 2, ticks: { a: true, b: true, c: true, d: true } });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("phase_refused");
  });

  it("needs four boolean ticks and the self-mark token bound to this answer", async () => {
    const { req } = await atSelfMark();
    expect((await selfMark({ ...req, ticks: { a: true, b: true, c: true } })).status).toBe(400);
    expect((await selfMark({ ...req, ticks: { a: true, b: true, c: true, d: "yes" } })).status).toBe(400);
    const forged = await selfMark({ ...req, answer: "A different text", ticks: { a: true, b: true, c: true, d: true } });
    expect(forged.status).toBe(400);
    expect(forged.body.error).toBe("invalid_token");
    const noToken = await selfMark({ ...req, token: undefined, ticks: { a: true, b: true, c: true, d: true } });
    expect(noToken.status).toBe(400);
  });

  it("a second save is 409 and the first mark stands", async () => {
    const { questionId, req } = await atSelfMark();
    await selfMark({ ...req, ticks: { a: true, b: true, c: true, d: true } });
    const again = await selfMark({ ...req, ticks: { a: false, b: false, c: false, d: false } });
    expect(again.status).toBe(409);
    expect((await resultRow(questionId)).marksAwarded).toBe(4);
  });

  it("cannot replace a marker-marked first try", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    // the marker marks (under 4), then the student tries to self-mark with a token from a later failure
    await gradeParagraph(started, questionId, "First try. [met:ad]");
    const { signSelfMarkToken } = await import("@/lib/tokens.server");
    const token = signSelfMarkToken({ uid: (await env.db.select().from(paragraphPhases))[0].userId, attemptId: started.attemptId, questionId, answer: "Cheat" });
    const r = await selfMark({ attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, answer: "Cheat", token, phase: 1, ticks: { a: true, b: true, c: true, d: true } });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("phase_refused");
    expect((await phaseRow(questionId)).phase1Mark).toBe(2);
  });

  it("a self-marked part cannot be flagged (there is no marker mark to dispute)", async () => {
    const { req } = await atSelfMark();
    await selfMark({ ...req, ticks: { a: true, b: true, c: true, d: true } });
    const { POST } = await import("@/app/api/paragraph/flag/route");
    const res = await POST(post("/api/paragraph/flag", { attemptId: req.attemptId, attemptToken: req.attemptToken, questionId: req.questionId }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("not_flaggable");
  });
});

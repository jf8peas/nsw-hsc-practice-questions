// The retry, the decline and the discussion of the comparative unit (spec 009 FR-009, FR-015, FR-018, task T040):
// the retry is capped at full marks minus one, the recorded mark is the higher try, there is no third try, a choice
// question's pick is fixed (the same texts reach the marker, a different pick is refused), a decline records the
// first try with no marker call and no slot, and the discussion carries the model answer and, for a choice question
// only, the pairing. PGlite and a stubbed model; no network.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { storeTexts } from "@/content/units/y12-english-advanced-unseen-texts/store-texts";
import { dailyAiUsage, results, rewriteDrafts, unseenPhases } from "@/lib/db/schema";

import {
  CHOICE_Q,
  FIXED_Q,
  KEY,
  TEXTS,
  gradeComparative,
  restoreComparativeEnv,
  setupComparativeEnv,
  startComparative,
  type ComparativeEnv,
} from "../helpers/comparative";
import { post, signedInStudent } from "../helpers/routes";
import { fillWords } from "../helpers/unseen";

let env: ComparativeEnv;
afterEach(async () => {
  restoreComparativeEnv();
  vi.restoreAllMocks();
  await env?.close();
});

const MODEL_WORDS = KEY.model.trim().split(/\s+/).length;
const phaseRow = async (q: string) => (await env.db.select().from(unseenPhases).where(eq(unseenPhases.questionId, q)))[0];
const used = async (userId: string) => (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce((s, r) => s + r.count, 0);
const BELOW = fillWords(60, "[mark:3]", "[miss:compares-texts]");
const lastSent = () => JSON.stringify(env.chat.mock.calls.at(-1)![0]);
const poemLine = (id: string) => {
  const t = storeTexts.find((x) => x.id === id)!;
  return (t.body.kind === "poem" ? t.body.stanzas[0][0] : t.body.kind === "prose" ? t.body.paragraphs[0].slice(0, 40) : "").replace(/"/g, '\\"');
};

async function decline(started: { attemptId: string; attemptToken: string }, questionId: string) {
  const { POST } = await import("@/app/api/unseen/decline/route");
  const res = await POST(post("/api/unseen/decline", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId }));
  return { status: res.status, body: await res.json() };
}

/** A fixed pair graded below full marks, ready for its retry. */
async function fixedAtRetry() {
  const user = await signedInStudent(env);
  const { started } = await startComparative();
  const first = await gradeComparative(started, FIXED_Q, BELOW);
  return { user, started, first };
}
/** The choice question, picked and graded below full marks, ready for its retry. */
async function choiceAtRetry(pick = [TEXTS.B]) {
  const user = await signedInStudent(env);
  const one = await startComparative();
  await gradeComparative(one.started, FIXED_Q, fillWords(60));
  const { started } = await startComparative();
  const first = await gradeComparative(started, CHOICE_Q, BELOW, { pick });
  return { user, started, first };
}

describe("the retry", () => {
  it("is capped at full marks minus one, finalises as retried, records the higher try and releases the discussion", async () => {
    env = await setupComparativeEnv();
    const { started, first } = await fixedAtRetry();
    expect(first.body.result).toMatchObject({ marksAwarded: 3, retryOffered: true });
    const { status, body } = await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:6]"), { phase: 2 });
    expect(status).toBe(200);
    expect(body.result).toMatchObject({ type: "comparative", phase: 2, marksAwarded: 5, recordedMark: 5, ending: "retried" });
    expect(body.result.skills).toHaveLength(9);
    expect(body.result.try1).toMatchObject({ mark: 3 });
    expect(body.result.discussion).toEqual({ modelAnswer: KEY.model, modelWords: MODEL_WORDS });
    expect(await phaseRow(FIXED_Q)).toMatchObject({ status: "final", ending: "retried", try1Mark: 3, try2Mark: 5, recordedMark: 5 });
  });

  it("records the first try when the retry scores lower, and only the first try feeds the skill outcomes", async () => {
    env = await setupComparativeEnv();
    const { started } = await fixedAtRetry();
    const { body } = await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:1]"), { phase: 2 });
    expect(body.result).toMatchObject({ marksAwarded: 1, recordedMark: 3, ending: "retried" });
    const res = (await env.db.select().from(results).where(eq(results.questionId, FIXED_Q)))[0];
    expect(res.marksAwarded).toBe(3);
    // the retry showed every skill, but the first try's outcome stands: compares-texts was missed on it
    const outcomes = res.conceptOutcomes as Array<{ conceptId: string; correct: boolean }>;
    expect(outcomes).toHaveLength(9);
    expect(outcomes.find((o) => o.conceptId.endsWith("c-compares-texts"))?.correct).toBe(false);
  });

  it("has no third try, and a second first try is refused with the stored result", async () => {
    env = await setupComparativeEnv();
    const { started } = await fixedAtRetry();
    await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:4]"), { phase: 2 });
    const third = await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:5]"), { phase: 2 });
    expect(third.status).toBe(409);
    expect(third.body.error).toBe("already_answered");
    expect(third.body.result.discussion.modelAnswer).toBe(KEY.model);
    const again = await gradeComparative(started, FIXED_Q, BELOW);
    expect(again.status).toBe(409);
  });

  it("refuses a retry with no first try", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const { started } = await startComparative();
    const { status, body } = await gradeComparative(started, FIXED_Q, fillWords(60), { phase: 2 });
    expect({ status, body }).toEqual({ status: 400, body: { error: "phase_refused" } });
  });

  it("uses one daily-limit slot per marked try", async () => {
    env = await setupComparativeEnv();
    const { user, started } = await fixedAtRetry();
    expect(await used(user.id)).toBe(1);
    await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:4]"), { phase: 2 });
    expect(await used(user.id)).toBe(2);
  });

  it("a marker failure on the retry keeps the answer as the retry draft, refunds the slot and leaves the retry open", async () => {
    env = await setupComparativeEnv();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { user, started } = await fixedAtRetry();
    env.chat.mockResolvedValue({ ok: false, reason: "http", status: 503 });
    const { status, body } = await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:4]"), { phase: 2 });
    expect({ status, body }).toEqual({ status: 200, body: { notMarked: { reason: "marker_unavailable", phase: 2 }, saved: false } });
    expect(await used(user.id)).toBe(1);
    expect((await phaseRow(FIXED_Q)).status).toBe("try1");
    expect((await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.questionId, FIXED_Q)))[0].phase2Draft).toBe(fillWords(60, "[mark:4]"));
  });
});

describe("the pick is fixed on the retry", () => {
  it("accepts no pick (the stored one is used), and the marker receives the same texts as on the first try", async () => {
    env = await setupComparativeEnv();
    const { started } = await choiceAtRetry([TEXTS.B]);
    const firstSent = lastSent();
    const { status, body } = await gradeComparative(started, CHOICE_Q, fillWords(60, "[mark:5]"), { phase: 2 });
    expect(status).toBe(200);
    expect(body.result.pick).toEqual([TEXTS.B]);
    const retrySent = lastSent();
    for (const sent of [firstSent, retrySent]) {
      expect(sent).toContain(poemLine(TEXTS.A));
      expect(sent).toContain(poemLine(TEXTS.B));
      expect(sent).not.toContain("VISUAL TEXT: you cannot see the image");
    }
  });

  it("accepts the identical pick, in any order", async () => {
    env = await setupComparativeEnv();
    const { started } = await choiceAtRetry([TEXTS.V]);
    const { status } = await gradeComparative(started, CHOICE_Q, fillWords(60, "[mark:5]"), { phase: 2, pick: [TEXTS.V] });
    expect(status).toBe(200);
  });

  it("refuses a different pick with 409 pick_changed before any slot or marker call, and the question stays at the retry", async () => {
    env = await setupComparativeEnv();
    const { user, started } = await choiceAtRetry([TEXTS.B]);
    const calls = env.chat.mock.calls.length;
    const slots = await used(user.id);
    for (const pick of [[TEXTS.V], [TEXTS.B, TEXTS.V], [], "x"]) {
      const res = await gradeComparative(started, CHOICE_Q, fillWords(60, "[mark:5]"), { phase: 2, pick });
      expect({ status: res.status, body: res.body }).toEqual({ status: 409, body: { error: "pick_changed" } });
    }
    expect(env.chat.mock.calls.length).toBe(calls);
    expect(await used(user.id)).toBe(slots);
    expect((await phaseRow(CHOICE_Q)).status).toBe("try1");
    expect((await phaseRow(CHOICE_Q)).pickedTextIds).toEqual([TEXTS.B]);
  });
});

describe("declining the retry", () => {
  it("records the first try's mark, ends as declined, makes no marker call and uses no slot", async () => {
    env = await setupComparativeEnv();
    const { user, started } = await fixedAtRetry();
    const calls = env.chat.mock.calls.length;
    const slots = await used(user.id);
    const { status, body } = await decline(started, FIXED_Q);
    expect(status).toBe(200);
    expect(body.result).toMatchObject({ type: "comparative", phase: 1, marksAwarded: 3, recordedMark: 3, ending: "declined" });
    expect(body.result.try1).toMatchObject({ mark: 3 });
    expect(body.result.skills).toHaveLength(9);
    expect(body.result.discussion).toEqual({ modelAnswer: KEY.model, modelWords: MODEL_WORDS });
    expect(env.chat.mock.calls.length).toBe(calls);
    expect(await used(user.id)).toBe(slots);
    expect(await phaseRow(FIXED_Q)).toMatchObject({ status: "final", ending: "declined", recordedMark: 3 });
    expect((await env.db.select().from(results).where(eq(results.questionId, FIXED_Q)))[0].marksAwarded).toBe(3);
  });

  it("is refused with no first try, and answers 409 with the stored result when repeated", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const { started } = await startComparative();
    expect((await decline(started, FIXED_Q)).body).toEqual({ error: "phase_refused" });
    await gradeComparative(started, FIXED_Q, BELOW);
    expect((await decline(started, FIXED_Q)).status).toBe(200);
    const again = await decline(started, FIXED_Q);
    expect(again.status).toBe(409);
    expect(again.body.error).toBe("already_answered");
  });
});

describe("the discussion's pairing", () => {
  it("a choice question releases the pairing with the model answer, at the decline and after the retry", async () => {
    env = await setupComparativeEnv();
    const { started } = await choiceAtRetry([TEXTS.V]);
    const { body } = await decline(started, CHOICE_Q);
    expect(body.result.pick).toEqual([TEXTS.V]);
    expect(body.result.discussion).toEqual({ modelAnswer: KEY.model, modelWords: MODEL_WORDS, pairing: KEY.pairing });
  });

  it("never carries the pairing, the model answer or the criteria before the discussion", async () => {
    env = await setupComparativeEnv();
    const { first } = await choiceAtRetry([TEXTS.B]);
    const wire = JSON.stringify(first.body);
    for (const secret of [KEY.model.slice(0, 40), "pairing", "Skilful comparison", "discussion"]) expect(wire).not.toContain(secret);
  });
});

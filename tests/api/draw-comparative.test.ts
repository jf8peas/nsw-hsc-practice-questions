// The comparative unit's start through POST /api/attempts (spec 009 FR-023, FR-024, SC-009, task T046): an unanswered
// question first, none repeated until every question is answered, then repeats with the most recent excluded (the small-bank
// rule), a question left unfinished offered first at the pick, the retry choice and the retry, and one open attempt per unit.

import { afterEach, describe, expect, it, vi } from "vitest";

import { CHOICE_Q, FIXED_Q, TEXTS, gradeComparative, restoreComparativeEnv, savePick, setupComparativeEnv, startComparative, type ComparativeEnv } from "../helpers/comparative";
import { post, signedInStudent } from "../helpers/routes";
import { fillWords } from "../helpers/unseen";

let env: ComparativeEnv;
afterEach(async () => {
  restoreComparativeEnv();
  vi.restoreAllMocks();
  await env?.close();
});

async function decline(started: { attemptId: string; attemptToken: string }, questionId: string) {
  const { POST } = await import("@/app/api/unseen/decline/route");
  await POST(post("/api/unseen/decline", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId }));
}

describe("new draws", () => {
  it("offers an unanswered question, and does not offer an answered one again until every question is answered", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const first = await startComparative();
    expect(first.questionId).toBe(FIXED_Q); // the deterministic draw: the first unanswered, in the bank's order
    expect(first.state.repeating).toBeUndefined();
    await gradeComparative(first.started, FIXED_Q, fillWords(60)); // full marks: the question ends
    const second = await startComparative();
    expect(second.questionId).toBe(CHOICE_Q);
    expect(second.state.repeating).toBeUndefined();
  });
});

describe("repeats", () => {
  it("once every question is answered the unit does not stop: a repeat is a new attempt marked as a repeat", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const one = await startComparative();
    await gradeComparative(one.started, FIXED_Q, fillWords(60));
    const two = await startComparative();
    await gradeComparative(two.started, CHOICE_Q, fillWords(60), { pick: [TEXTS.B] });
    const again = await startComparative();
    expect(again.started.attemptId).not.toBe(one.started.attemptId);
    expect(again.state.repeating).toBe(true);
    expect([FIXED_Q, CHOICE_Q]).toContain(again.questionId);
    // the small-bank rule: with 3 or fewer questions only the most recent quiz's question is excluded
    expect(again.questionId).toBe(FIXED_Q);
  });
});

describe("an unfinished question is offered first, at the step it was left", () => {
  it("at the pick (nothing submitted): the same attempt, with its saved pick", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const one = await startComparative();
    await gradeComparative(one.started, FIXED_Q, fillWords(60));
    const two = await startComparative();
    await savePick(two.started, CHOICE_Q, [TEXTS.V]);
    const back = await startComparative();
    expect(back.started.attemptId).toBe(two.started.attemptId);
    expect(back.state).toMatchObject({ stage: "write", pick: [TEXTS.V], pickLocked: false });
    expect((back.started as unknown as { resumed?: boolean }).resumed).toBe(true);
  });

  it("at the retry choice and at the retry (a retry draft saved), with the pick fixed", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const one = await startComparative();
    await gradeComparative(one.started, FIXED_Q, fillWords(60));
    const two = await startComparative();
    await gradeComparative(two.started, CHOICE_Q, fillWords(60, "[mark:3]", "[miss:compares-texts]"), { pick: [TEXTS.B] });
    const choice = await startComparative();
    expect(choice.started.attemptId).toBe(two.started.attemptId);
    expect(choice.state).toMatchObject({ stage: "choice", pickLocked: true, pick: [TEXTS.B], retryOffered: true });
    const { POST } = await import("@/app/api/rewrite/draft/route");
    await POST(post("/api/rewrite/draft", { attemptId: two.started.attemptId, attemptToken: two.started.attemptToken, questionId: CHOICE_Q, phase: 2, draft: "retry so far" }));
    const retry = await startComparative();
    expect(retry.state).toMatchObject({ stage: "retry", draft2: "retry so far", pick: [TEXTS.B] });
  });

  it("two tabs starting at once end on one attempt", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const [a, b] = await Promise.all([startComparative(), startComparative()]);
    expect(a.started.attemptId).toBe(b.started.attemptId);
  });

  it("after a declined retry the question is finished and a new question is drawn", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const one = await startComparative();
    await gradeComparative(one.started, FIXED_Q, fillWords(60, "[mark:3]", "[miss:compares-texts]"));
    await decline(one.started, FIXED_Q);
    const next = await startComparative();
    expect(next.questionId).toBe(CHOICE_Q);
  });
});

describe("the database", () => {
  it("answers 503 and chooses nothing when results cannot be read", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    env.databaseDown();
    const { POST } = await import("@/app/api/attempts/route");
    const res = await POST(post("/api/attempts", { unitId: "y12-english-advanced-comparative-texts" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "temporarily_unavailable" });
  });
});

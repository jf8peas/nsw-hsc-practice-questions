// Shared skill progress across the two Advanced English units, end to end (spec 009 FR-022, SC-005, task T044): real
// results written by real grading in both units, read back through the loaders the unit pages use. A miss in either unit
// puts the skill in both lists; two first tries that show it, in any mix of units, clear it in both; a retry that fixes
// a skill does not stop the miss counting; the two comparison skills come only from the comparative unit.

import { afterEach, describe, expect, it, vi } from "vitest";

import { COMPARATIVE_SKILL_IDS, comparativeSkillConceptId, skillConceptId } from "@/lib/unseen/skills";

import { CHOICE_Q, CMP_UNIT, FIXED_Q, TEXTS, gradeComparative, restoreComparativeEnv, setupComparativeEnv, startComparative, type ComparativeEnv } from "../helpers/comparative";
import { post, signedInStudent, startAttempt } from "../helpers/routes";
import { UNSEEN_UNIT, fillWords } from "../helpers/unseen";

let env: ComparativeEnv;
afterEach(async () => {
  restoreComparativeEnv();
  vi.restoreAllMocks();
  await env?.close();
});

const APT = skillConceptId("apt-evidence");
const COMPARES = comparativeSkillConceptId("compares-texts");

async function lists(userId: string) {
  const { getUnit } = await import("@/content");
  const { loadConceptProgress } = await import("@/lib/db/queries/results.server");
  const [unseen, comparative] = [getUnit(UNSEEN_UNIT)!, getUnit(CMP_UNIT)!];
  const show = async (u: typeof unseen) => (await loadConceptProgress(env.db, userId, u)).map((s) => [s.conceptId, s.count] as const).sort();
  return { unseen: await show(unseen), comparative: await show(comparative) };
}

/** A spec 008 first try; a result (and so skill progress) is saved when the question ends, so a below-full try is declined. */
async function gradeUnseenFirstTry(answer: string) {
  const started = await startAttempt(UNSEEN_UNIT);
  const questionId = started.questions?.[0]?.id as string;
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(post("/api/grade", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, answer, phase: 1 }));
  expect(res.status).toBe(200);
  if ((await res.json()).result.retryOffered) await decline(started, questionId);
  return started;
}
async function decline(started: { attemptId: string; attemptToken: string }, questionId: string) {
  const { POST } = await import("@/app/api/unseen/decline/route");
  const res = await POST(post("/api/unseen/decline", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId }));
  expect(res.status).toBe(200);
}

describe("a miss in either unit sets the skill in both lists", () => {
  it("a comparative first try that misses a shared skill and a comparison skill: the shared one is in both lists at 2, the comparison skill only in its own", async () => {
    env = await setupComparativeEnv();
    const user = await signedInStudent(env);
    const { started } = await startComparative();
    await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:4]", "[miss:apt-evidence,compares-texts]"));
    await decline(started, FIXED_Q); // skill progress is written when the question ends
    const l = await lists(user.id);
    expect(l.unseen).toEqual([[APT, 2]]);
    expect(l.comparative).toEqual([[APT, 2], [COMPARES, 2]].sort());
  });

  it("an unseen-text first try that misses a skill puts it in the comparative unit's list", async () => {
    env = await setupComparativeEnv();
    const user = await signedInStudent(env);
    await gradeUnseenFirstTry(fillWords(60, "[miss:apt-evidence]"));
    const l = await lists(user.id);
    expect(l.unseen).toEqual([[APT, 2]]);
    expect(l.comparative).toEqual([[APT, 2]]);
  });
});

describe("two shows clear it, in any mix of units", () => {
  it("a miss in the comparative unit, then a show in each unit, clears it in both", async () => {
    env = await setupComparativeEnv();
    const user = await signedInStudent(env);
    const first = await startComparative();
    await gradeComparative(first.started, FIXED_Q, fillWords(60, "[mark:4]", "[miss:apt-evidence]"));
    await decline(first.started, FIXED_Q); // finish the question so the next quiz can start
    expect((await lists(user.id)).unseen).toEqual([[APT, 2]]);

    await gradeUnseenFirstTry(fillWords(60)); // a spec 008 first try that shows it: 2 → 1
    const mid = await lists(user.id);
    expect(mid.unseen).toEqual([[APT, 1]]);
    expect(mid.comparative).toEqual([[APT, 1]]);

    const second = await startComparative();
    expect(second.questionId).toBe(CHOICE_Q);
    await gradeComparative(second.started, CHOICE_Q, fillWords(60), { pick: [TEXTS.B] }); // a comparative first try that shows it: 1 → 0
    const done = await lists(user.id);
    expect(done.unseen).toEqual([]);
    expect(done.comparative).toEqual([]);
  });

  it("a later miss in the other unit sets it back to 2", async () => {
    env = await setupComparativeEnv();
    const user = await signedInStudent(env);
    await gradeUnseenFirstTry(fillWords(60, "[miss:apt-evidence]"));
    const first = await startComparative();
    await gradeComparative(first.started, FIXED_Q, fillWords(60)); // shows it: 2 → 1
    expect((await lists(user.id)).unseen).toEqual([[APT, 1]]);
    const second = await startComparative();
    await gradeComparative(second.started, CHOICE_Q, fillWords(60, "[mark:4]", "[miss:apt-evidence]"), { pick: [TEXTS.B] });
    await decline(second.started, CHOICE_Q);
    const l = await lists(user.id);
    expect(l.unseen).toEqual([[APT, 2]]);
    expect(l.comparative).toEqual([[APT, 2]]);
  });
});

describe("only the first try counts", () => {
  it("a retry that fixes a missed skill does not stop the miss counting, in either list", async () => {
    env = await setupComparativeEnv();
    const user = await signedInStudent(env);
    const { started } = await startComparative();
    await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:4]", "[miss:compares-texts,apt-evidence]"));
    await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:5]"), { phase: 2 }); // the retry shows everything (and ends the question)
    const l = await lists(user.id);
    expect(l.unseen).toEqual([[APT, 2]]);
    expect(l.comparative).toEqual([[APT, 2], [COMPARES, 2]].sort());
  });

  it("the comparison skills clear after two comparative first tries that show them, and never touch the other unit", async () => {
    env = await setupComparativeEnv();
    const user = await signedInStudent(env);
    const one = await startComparative();
    await gradeComparative(one.started, FIXED_Q, fillWords(60, "[mark:4]", "[miss:compares-texts]"));
    await decline(one.started, FIXED_Q);
    const two = await startComparative();
    await gradeComparative(two.started, CHOICE_Q, fillWords(60), { pick: [TEXTS.B] }); // full marks: the question ends and its result is saved
    const l = await lists(user.id);
    expect(l.comparative).toEqual([[COMPARES, 1]]); // one show so far
    expect(l.unseen).toEqual([]);
    expect(COMPARATIVE_SKILL_IDS).toContain("compares-texts");
  });
});

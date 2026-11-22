// The quiz page's resume for a comparative attempt (spec 009 FR-009, FR-018, contracts/api.md, task T028): the stage the
// stored rows say, the saved pick (from the draft row, then the phase row), the drafts, and no key field before
// the discussion. A synthetic two-question bank on real store texts; PGlite; no network.

import { isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { rewriteDrafts, unseenPhases, type SkillVerdicts } from "@/lib/db/schema";
import { COMPARATIVE_SKILL_IDS } from "@/lib/unseen/skills";

import { CHOICE_Q, CMP_UNIT, FIXED_Q, KEY, TEXTS, mockComparativeContent } from "../helpers/comparative";
import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedUser } from "../helpers/fixtures";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: () => {}, push: vi.fn() }),
  usePathname: () => "/",
}));

let env: TestEnv;
afterEach(async () => {
  vi.doUnmock("@/content/units/y12-english-advanced-comparative-texts/questions");
  vi.doUnmock("@/content/units/y12-english-advanced-comparative-texts/keys");
  await env?.close();
});

function findAll(node: ReactNode, match: (el: ReactElement) => boolean, out: ReactElement[] = []) {
  if (Array.isArray(node)) node.forEach((n) => findAll(n, match, out));
  else if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (match(el)) out.push(el);
    findAll(el.props.children, match, out);
  }
  return out;
}

const verdicts = (missed: string[] = []): SkillVerdicts =>
  Object.fromEntries(COMPARATIVE_SKILL_IDS.map((id) => [id, { met: !missed.includes(id), reason: "a reason" }])) as SkillVerdicts;

async function resume(questionId: string, seed: (ids: { userId: string; attemptId: string }) => Promise<void> = async () => {}) {
  env = await setupTestEnv();
  mockComparativeContent();
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  const attempt = await seedAttempt(env.db, me.id, { unitId: CMP_UNIT, questionIds: [questionId] });
  await seed({ userId: me.id, attemptId: attempt.id });
  const Page = (await import("@/app/unit/[unitId]/quiz/page")).default;
  const tree = await Page({ params: Promise.resolve({ unitId: CMP_UNIT }), searchParams: Promise.resolve({ attempt: attempt.id }) });
  const quiz = findAll(tree, (el) => typeof el.type === "function" && (el.type as { name?: string }).name === "Quiz")[0];
  return (quiz.props as { initial: { comparativeState: Record<string, unknown>; questions: Array<{ id: string }>; unseenState?: unknown } }).initial;
}

const phase = (ids: { userId: string; attemptId: string }, questionId: string, over: Record<string, unknown> = {}) =>
  env.db.insert(unseenPhases).values({
    attemptId: ids.attemptId, userId: ids.userId, unitId: CMP_UNIT, questionId, maxMarks: 6, status: "try1",
    try1Text: "My first comparison of the two texts", try1Mark: 3, try1Verdicts: verdicts(["compares-texts"]),
    try1Feedback: "Feedback.", try1BiggestGap: "Compare throughout.", try1PromptVersion: "comparative-pilot-1", try1Model: "m", ...over,
  });

describe("resume", () => {
  it("a fresh fixed pair resumes at write with both texts, no pick and no unseen state", async () => {
    const initial = await resume(FIXED_Q);
    expect(initial.questions.map((q) => q.id)).toEqual([FIXED_Q]);
    expect(initial.unseenState).toBeUndefined();
    expect(initial.comparativeState).toMatchObject({ stage: "write", pickLocked: false });
    expect((initial.comparativeState.texts as Array<{ id: string }>).map((t) => t.id)).toEqual([TEXTS.A, TEXTS.V]);
    expect(initial.comparativeState.pick).toBeUndefined();
  });

  it("restores the draft pick and the draft text of an unfinished choice question", async () => {
    const initial = await resume(CHOICE_Q, async (ids) => {
      await env.db.insert(rewriteDrafts).values({ ...ids, unitId: CMP_UNIT, questionId: CHOICE_Q, phase1Draft: "half an answer", pickedTextIds: [TEXTS.V] });
    });
    expect(initial.comparativeState).toMatchObject({ stage: "write", pick: [TEXTS.V], pickLocked: false, draft1: "half an answer" });
  });

  it("drops a saved pick that is no longer allowed, so the student chooses again", async () => {
    const initial = await resume(CHOICE_Q, async (ids) => {
      await env.db.insert(rewriteDrafts).values({ ...ids, unitId: CMP_UNIT, questionId: CHOICE_Q, pickedTextIds: ["retired-text"] });
    });
    expect(initial.comparativeState.pick).toBeUndefined();
  });

  it("after a marked first try below full marks: the choice stage, the pick locked, verdicts but no model answer, pairing or key", async () => {
    const initial = await resume(CHOICE_Q, async (ids) => {
      await phase(ids, CHOICE_Q, { pickedTextIds: [TEXTS.B] });
    });
    expect(initial.comparativeState).toMatchObject({ stage: "choice", pick: [TEXTS.B], pickLocked: true, retryOffered: true });
    const wire = JSON.stringify(initial);
    for (const secret of [KEY.model.slice(0, 40), "Skilful comparison", "pairing", "discussion"]) expect(wire).not.toContain(secret);
    expect((initial.comparativeState.try1 as { skills: unknown[] }).skills).toHaveLength(9);
  });

  it("with a saved retry draft resumes at the retry, from the same pick", async () => {
    const initial = await resume(CHOICE_Q, async (ids) => {
      await phase(ids, CHOICE_Q, { pickedTextIds: [TEXTS.B] });
      await env.db.insert(rewriteDrafts).values({ ...ids, unitId: CMP_UNIT, questionId: CHOICE_Q, phase2Draft: "my retry so far", pickedTextIds: [TEXTS.B] });
    });
    expect(initial.comparativeState).toMatchObject({ stage: "retry", draft2: "my retry so far", pick: [TEXTS.B], pickLocked: true });
  });

  it("a finished choice question shows the discussion with the model answer and the pairing; a fixed pair has no pairing", async () => {
    const done = await resume(CHOICE_Q, async (ids) => {
      await phase(ids, CHOICE_Q, { pickedTextIds: [TEXTS.B], status: "final", ending: "declined", recordedMark: 3 });
    });
    expect(done.comparativeState).toMatchObject({ stage: "discussion", ending: "declined", recordedMark: 3, pick: [TEXTS.B] });
    expect(done.comparativeState.discussion).toEqual({ modelAnswer: KEY.model, modelWords: KEY.model.trim().split(/\s+/).length, pairing: KEY.pairing });
    await env.close();
    const fixed = await resume(FIXED_Q, async (ids) => {
      await phase(ids, FIXED_Q, { status: "final", ending: "declined", recordedMark: 3 });
    });
    expect((fixed.comparativeState.discussion as { pairing?: string[] }).pairing).toBeUndefined();
  });
});

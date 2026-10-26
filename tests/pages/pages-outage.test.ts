// Pages when the database is unavailable (research R19): the unit page, the quiz,
// /progress and the attempt detail still render, with a notice in place of
// history. Never a 500. Also: other students' attempts render not-found.

import { renderToStaticMarkup } from "react-dom/server";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { HISTORY_UNAVAILABLE } from "@/lib/format";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const unit = UNITS.find((u) => u.id === "y11-formula-test")!;
const [q1, q2] = unit.questions.slice(0, 2).map((q) => q.id);

/** Find elements in a React element tree (server components are not rendered, just inspected). */
function findAll(node: ReactNode, match: (el: ReactElement) => boolean, out: ReactElement[] = []) {
  if (Array.isArray(node)) node.forEach((n) => findAll(n, match, out));
  else if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (match(el)) out.push(el);
    findAll(el.props.children, match, out);
  }
  return out;
}

/** All string text inside an element tree. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node as ReactElement<{ children?: ReactNode }>).props.children);
  return "";
}

const named = (name: string) => (el: ReactElement) =>
  typeof el.type === "function" && (el.type as { name?: string }).name === name;

const params = <T,>(p: T) => ({ params: Promise.resolve(p) });

async function signedIn() {
  env = await setupTestEnv();
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  return me;
}

describe("the notice itself", () => {
  it("is the agreed wording", async () => {
    env = await setupTestEnv();
    const { HistoryUnavailable } = await import("@/components/HistoryUnavailable");
    const html = renderToStaticMarkup(createElement(HistoryUnavailable));
    expect(html).toContain("History is temporarily unavailable — your answers are still being marked and will be saved.");
    expect(HISTORY_UNAVAILABLE).toContain("still being marked");
  });
});

describe("with the database unreachable", () => {
  it("the unit page shows the notice, keeps Start quiz, hides Continue, and does not throw", async () => {
    await signedIn();
    env.databaseDown();
    const Page = (await import("@/app/unit/[unitId]/page")).default;
    const tree = await Page(params({ unitId: unit.id }));
    expect(findAll(tree, named("HistoryUnavailable"))).toHaveLength(1);
    expect(findAll(tree, named("AttemptHistory"))).toHaveLength(0);
    const start = findAll(tree, named("StartQuiz"));
    expect(start).toHaveLength(1);
    expect((start[0].props as { label?: string }).label).toBeUndefined(); // plain "Start quiz"
    expect(findAll(tree, (el) => el.type === "a" || (typeof el.type === "function" && (el.type as { name?: string }).name === "Link") ? JSON.stringify((el.props as { children?: unknown }).children).includes("Continue") : false)).toHaveLength(0);
  });

  it("the unit page also copes when only the history query fails (session lookup ok)", async () => {
    await signedIn();
    env.failAfterCalls(1);
    const Page = (await import("@/app/unit/[unitId]/page")).default;
    const tree = await Page(params({ unitId: unit.id }));
    expect(findAll(tree, named("HistoryUnavailable"))).toHaveLength(1);
    expect(findAll(tree, named("StartQuiz"))).toHaveLength(1);
  });

  it("/progress shows the notice", async () => {
    await signedIn();
    env.databaseDown();
    const Page = (await import("@/app/progress/page")).default;
    const tree = await Page();
    expect(findAll(tree, named("HistoryUnavailable"))).toHaveLength(1);
  });

  it("the attempt detail page shows the notice", async () => {
    await signedIn();
    env.databaseDown();
    const Page = (await import("@/app/attempts/[attemptId]/page")).default;
    const tree = await Page(params({ attemptId: "00000000-0000-4000-8000-000000000000" }));
    expect(findAll(tree, named("HistoryUnavailable"))).toHaveLength(1);
  });

  it("the quiz page renders the quiz in offline mode (initial = null) instead of failing", async () => {
    await signedIn();
    env.databaseDown();
    const Page = (await import("@/app/unit/[unitId]/quiz/page")).default;
    const tree = await Page({
      ...params({ unitId: unit.id }),
      searchParams: Promise.resolve({ attempt: "55555555-0000-4000-8000-000000000000" }),
    });
    const quiz = findAll(tree, named("Quiz"));
    expect(quiz).toHaveLength(1);
    expect((quiz[0].props as { initial: unknown }).initial).toBeNull();
    expect((quiz[0].props as { attemptId: string }).attemptId).toBe("55555555-0000-4000-8000-000000000000");
  });
});

describe("with the database up", () => {
  it("the quiz page passes the student's own attempt with a fresh attempt token and display-ordered MC", async () => {
    const me = await signedIn();
    const a = await seedAttempt(env.db, me.id, { unitId: unit.id, questionIds: [q1, q2] });
    await seedResult(env.db, { attemptId: a.id, userId: me.id }, { unitId: unit.id, questionId: q1, marksAwarded: 1, maxMarks: 1 });
    const Page = (await import("@/app/unit/[unitId]/quiz/page")).default;
    const tree = await Page({
      ...params({ unitId: unit.id }),
      searchParams: Promise.resolve({ attempt: a.id }),
    });
    const quiz = findAll(tree, named("Quiz"))[0];
    const initial = (quiz.props as { initial: { attemptToken: string; questions: Array<{ id: string }>; answered: Record<string, unknown> } }).initial;
    expect(initial.questions.map((q) => q.id)).toEqual([q1, q2]);
    expect(Object.keys(initial.answered)).toEqual([q1]);
    const { verifyAttemptToken } = await import("@/lib/tokens.server");
    expect(verifyAttemptToken(initial.attemptToken, { uid: me.id, attemptId: a.id }).ok).toBe(true);
  });

  it("the quiz page and the attempt detail render not-found for someone else's attempt", async () => {
    await signedIn();
    const owner = await seedUser(env.db);
    const theirs = await seedAttempt(env.db, owner.id, { unitId: unit.id, questionIds: [q1] });

    const Quiz = (await import("@/app/unit/[unitId]/quiz/page")).default;
    await expect(
      Quiz({ ...params({ unitId: unit.id }), searchParams: Promise.resolve({ attempt: theirs.id }) }),
    ).rejects.toMatchObject({ digest: expect.stringContaining("404") });

    const Detail = (await import("@/app/attempts/[attemptId]/page")).default;
    await expect(Detail(params({ attemptId: theirs.id }))).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
    // an unknown id is indistinguishable
    await expect(
      Detail(params({ attemptId: "00000000-0000-4000-8000-000000000000" })),
    ).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("the unit page offers Continue for an unfinished attempt and lists history", async () => {
    const me = await signedIn();
    const a = await seedAttempt(env.db, me.id, { unitId: unit.id, questionIds: [q1, q2] });
    await seedResult(env.db, { attemptId: a.id, userId: me.id }, { unitId: unit.id, questionId: q1 });
    const Page = (await import("@/app/unit/[unitId]/page")).default;
    const tree = await Page(params({ unitId: unit.id }));
    expect(findAll(tree, named("AttemptHistory"))).toHaveLength(1);
    expect(findAll(tree, named("HistoryUnavailable"))).toHaveLength(0);
    const start = findAll(tree, named("StartQuiz"));
    expect((start[0].props as { label?: string }).label).toBe("Start new attempt");
    const links = findAll(tree, (el) => (el.props as { href?: string }).href?.includes(`attempt=${a.id}`) === true);
    expect(links).toHaveLength(1);
  });

  it("/progress shows an empty state for a student with no history", async () => {
    await signedIn();
    const Page = (await import("@/app/progress/page")).default;
    const tree = await Page();
    expect(findAll(tree, named("HistoryUnavailable"))).toHaveLength(0);
    expect(textOf(tree)).toContain("haven't attempted anything yet");
  });
});

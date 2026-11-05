// The unit page for the paragraph unit (spec 007 FR-004, design §4): the essay in progress, its part
// dots with the recorded marks, the Continue/Start button, "Things I need to know", the finished
// and database-down states, and the exam row.

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { conceptOutcomes, buildVerdicts } from "@/lib/paragraph/scoring";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: () => {}, push: vi.fn() }),
}));

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const UNIT = "y12-economics-paragraph-writing";
const qid = (part: number) => `${UNIT}.e01p${part}`;

function findAll(node: ReactNode, match: (el: ReactElement) => boolean, out: ReactElement[] = []) {
  if (Array.isArray(node)) node.forEach((n) => findAll(n, match, out));
  else if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (match(el)) out.push(el);
    findAll(el.props.children, match, out);
  }
  return out;
}
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node as ReactElement<{ children?: ReactNode }>).props.children);
  return "";
}
const named = (name: string) => (el: ReactElement) => typeof el.type === "function" && (el.type as { name?: string }).name === name;
const staticOf = (el: ReactElement) => renderToStaticMarkup(createElement(el.type as never, el.props as never));

async function setup() {
  env = await setupTestEnv();
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  return me;
}
async function answered(userId: string, part: number, marks: number, outcomes?: ReturnType<typeof conceptOutcomes>, essay = 1) {
  const id = `${UNIT}.e0${essay}p${part}`;
  const a = await seedAttempt(env.db, userId, { unitId: UNIT, questionIds: [id], completedAt: new Date() });
  await seedResult(env.db, { attemptId: a.id, userId }, { unitId: UNIT, questionId: id, marksAwarded: marks, maxMarks: 4, gradedBy: "llm", conceptOutcomes: outcomes ?? null });
}
async function render() {
  const Page = (await import("@/app/unit/[unitId]/page")).default;
  return Page({ params: Promise.resolve({ unitId: UNIT }) });
}

describe("the essay in progress", () => {
  it("a new student: essay 1, next Topic Sentence, button 'Start essay (Part 1 of 5)'", async () => {
    await setup();
    const tree = await render();
    const block = findAll(tree, named("EssayBlock"))[0];
    expect(block).toBeDefined();
    const html = staticOf(block);
    expect(html).toContain("Essay 1 of 2 · next: Topic Sentence");
    expect(html).toContain("Model economy: Vietnam");
    expect(html).toContain('aria-label="Essay 1 parts"');
    expect(html).toContain("Evaluate"); // the directive verb, highlighted
    expect(html).toContain('<mark class="pg-verb">Evaluate</mark>');
    const start = findAll(tree, named("StartQuiz"))[0];
    expect((start.props as { label: string }).label).toBe("Start essay (Part 1 of 5)");
    expect(findAll(tree, (el) => (el.props as { label?: string }).label === "Start new attempt")).toHaveLength(0);
  });

  it("after parts 1 and 2: recorded marks on the dots, the next part marked, and 'Continue essay (Part 3 of 5)'", async () => {
    const me = await setup();
    await answered(me.id, 1, 4);
    await answered(me.id, 2, 3);
    const tree = await render();
    const html = staticOf(findAll(tree, named("EssayBlock"))[0]);
    expect(html).toContain("next: Evidence &amp; Application");
    expect(html).toContain("4/4");
    expect(html).toContain("3/4");
    expect(html).toMatch(/pg-dot next[^>]*aria-current="step"/);
    expect(textOf(tree)).not.toContain("Brief"); // no key material on the page
    const start = findAll(tree, named("StartQuiz"))[0];
    expect((start.props as { label: string }).label).toBe("Continue essay (Part 3 of 5)");
  });

  it("when every essay is finished: the message, no essay block, no start button", async () => {
    const me = await setup();
    for (let p = 1; p <= 5; p++) await answered(me.id, p, 3);
    for (let p = 1; p <= 5; p++) await answered(me.id, p, 3, undefined, 2);
    const tree = await render();
    expect(findAll(tree, named("EssayBlock"))).toHaveLength(0);
    expect(findAll(tree, named("StartQuiz"))).toHaveLength(0);
    expect(textOf(tree)).toContain("finished every essay so far");
  });

  it("when the database cannot be read: the notice and no start button", async () => {
    await setup();
    env.databaseDown();
    const tree = await render();
    expect(findAll(tree, named("StartQuiz"))).toHaveLength(0);
    expect(textOf(tree)).toContain("load your place in the essay right now");
  });
});

describe("the rest of the page", () => {
  it("shows the intro, the exam row and 'Things I need to know' with two-pip part tips", async () => {
    const me = await setup();
    const miss = buildVerdicts(
      { a: { met: true, reason: "" }, b: { met: false, reason: "" }, c: { met: true, reason: "" }, conventions: { reason: "", preciseLanguage: true, noPadding: true }, feedback: "f" },
      10,
      40,
    );
    await answered(me.id, 1, 3, conceptOutcomes("topic", miss));
    const tree = await render();
    const text = textOf(findAll(tree, (el) => el.type === "header")[0]);
    expect(text).toContain("Writing economics paragraphs");
    expect(text).toContain("Writing Practice");
    expect(text).toContain("Year 12 Economics Assessment Task 1");
    const panel = staticOf(findAll(tree, named("ConceptPanel"))[0]);
    expect(panel).toContain("Things I need to know");
    expect(panel).toContain("Writing tips you missed on a first try.");
    expect(panel).toContain("1 to review");
    expect(panel).toContain("Topic Sentence</strong>: Name both the strategy and the outcome");
    expect(panel).toContain("2 to go");
    expect((panel.match(/class="pip/g) ?? []).length).toBe(2);
  });

  it("names past attempts for their essay and part, with the mark out of 4", async () => {
    const me = await setup();
    await answered(me.id, 2, 3);
    const tree = await render();
    const history = staticOf(findAll(tree, named("AttemptHistory"))[0]);
    expect(history).toContain("Essay 1 · Mechanism");
    expect(history).toContain("3/4");
  });
});

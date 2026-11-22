// The unit page of the comparative unit (spec 009 FR-024a, tasks T047 and T048): the start button and its states, "Results
// by question type" for fixed pair and choice (answered of total, the average of the latest recorded marks as a share of
// full marks, "Not tried yet" where none) and no text-form rows, and "Things I need to know" with the nine skills, shared
// with the unseen-text unit. A synthetic two-question bank on real store texts; PGlite; no network.

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { conceptOutcomes } from "@/lib/unseen/scoring";
import type { SkillVerdicts } from "@/lib/db/schema";
import { COMPARATIVE_SKILL_IDS } from "@/lib/unseen/skills";

import { CHOICE_Q, CMP_UNIT, FIXED_Q, mockComparativeContent } from "../helpers/comparative";
import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: () => {}, push: vi.fn() }),
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
  mockComparativeContent();
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  return me;
}
async function render() {
  const Page = (await import("@/app/unit/[unitId]/page")).default;
  return Page({ params: Promise.resolve({ unitId: CMP_UNIT }) });
}
const verdicts = (missed: string[] = []): SkillVerdicts =>
  Object.fromEntries(COMPARATIVE_SKILL_IDS.map((id) => [id, { met: !missed.includes(id), reason: "r" }])) as SkillVerdicts;
async function answered(userId: string, questionId: string, marks: number, missed: string[] = []) {
  const a = await seedAttempt(env.db, userId, { unitId: CMP_UNIT, questionIds: [questionId], completedAt: new Date() });
  await seedResult(env.db, { attemptId: a.id, userId }, { unitId: CMP_UNIT, questionId, marksAwarded: marks, maxMarks: 6, gradedBy: "llm", conceptOutcomes: conceptOutcomes(verdicts(missed)) });
}
const resultsRows = async (tree: ReactNode) => {
  const section = findAll(tree, named("ComparativeResults"))[0];
  return section ? staticOf(section) : "";
};

describe("the start button", () => {
  it("a new student: 'Start a question' and no unfinished-question line", async () => {
    await setup();
    const tree = await render();
    expect((findAll(tree, named("StartQuiz"))[0].props as { label: string }).label).toBe("Start a question");
    expect(textOf(tree)).not.toContain("You have a question in progress");
  });

  it("an unfinished question: 'Continue question' and a line naming it by paper", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: CMP_UNIT, questionIds: [CHOICE_Q] });
    const tree = await render();
    expect((findAll(tree, named("StartQuiz"))[0].props as { label: string }).label).toBe("Continue question");
    expect(textOf(tree)).toContain("You have a question in progress: Compare, with a choice of texts · Invented 2026 · Q5");
  });

  it("with every question answered, says questions now repeat", async () => {
    const me = await setup();
    await answered(me.id, FIXED_Q, 6);
    await answered(me.id, CHOICE_Q, 3);
    const tree = await render();
    expect(textOf(tree)).toMatch(/answered every question|repeat/i);
  });

  it("with the database down, shows the plain notice and still offers no guess", async () => {
    await setup();
    env.databaseDown();
    const tree = await render();
    expect(textOf(tree)).toContain("We can't load your questions right now");
  });
});

describe("results by question type", () => {
  it("lists a fixed-pair row and a choice row with 'Not tried yet' for both, and no text-form rows", async () => {
    await setup();
    const html = await resultsRows(await render());
    expect(html).toContain("Results by question type");
    expect(html).toContain("Fixed pair");
    expect(html).toContain("Choice of texts");
    expect(html.match(/Not tried yet/g)).toHaveLength(2);
    expect(html).toContain("0 of 1 answered");
    for (const form of ["Poem", "Prose", "Visual", "Image", "Non-fiction", "Speech", "Drama"]) expect(html).not.toContain(form);
  });

  it("shows answered of total and the average of the LATEST recorded marks as a share of full marks", async () => {
    const me = await setup();
    await answered(me.id, FIXED_Q, 3); // earlier 3/6
    await new Promise((r) => setTimeout(r, 5));
    await answered(me.id, FIXED_Q, 6); // a repeat: 6/6 is the latest
    const html = await resultsRows(await render());
    expect(html).toContain("1 of 1 answered");
    expect(html).toContain("100% average");
    expect(html).toContain("Not tried yet"); // the choice row is untouched
  });
});

describe("Things I need to know", () => {
  it("lists the skills missed in this unit, the two comparison skills included, with their pips", async () => {
    const me = await setup();
    await answered(me.id, FIXED_Q, 3, ["compares-texts", "apt-evidence"]);
    const tree = await render();
    const panel = findAll(tree, named("ConceptPanel"))[0];
    const progress = (panel.props as { progress: { data: Array<{ conceptId: string; count: number }> } }).progress;
    expect(progress.data.map((s) => [s.conceptId.split(".c-")[1], s.count]).sort()).toEqual([["apt-evidence", 2], ["compares-texts", 2]]);
  });

  it("shows a skill missed in the unseen-text unit, because the seven are shared", async () => {
    const me = await setup();
    const unseenUnit = "y12-english-advanced-unseen-texts";
    const a = await seedAttempt(env.db, me.id, { unitId: unseenUnit, questionIds: [`${unseenUnit}.fs25-q1`], completedAt: new Date() });
    await seedResult(env.db, { attemptId: a.id, userId: me.id }, {
      unitId: unseenUnit, questionId: `${unseenUnit}.fs25-q1`, marksAwarded: 1, maxMarks: 3, gradedBy: "llm",
      conceptOutcomes: conceptOutcomes(Object.fromEntries(COMPARATIVE_SKILL_IDS.slice(0, 7).map((id) => [id, { met: id !== "succinct", reason: "r" }])) as SkillVerdicts),
    });
    const tree = await render();
    const panel = findAll(tree, named("ConceptPanel"))[0];
    const progress = (panel.props as { progress: { data: Array<{ conceptId: string; count: number }> } }).progress;
    expect(progress.data.map((s) => s.conceptId.split(".c-")[1])).toEqual(["succinct"]);
  });
});

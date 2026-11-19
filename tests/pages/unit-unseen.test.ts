// The unit page for the unseen-text unit (spec 008 FR-027, FR-029, research R13): the start button and
// its three states, the finished and database-down notices, and "Things I need to know" with two-pip
// rows for the seven skills.

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { questions } from "@/content/units/y12-english-advanced-unseen-texts/questions";
import { conceptOutcomes } from "@/lib/unseen/scoring";
import type { SkillVerdicts } from "@/lib/db/schema";
import { SKILL_IDS, skillById, type SkillId } from "@/lib/unseen/skills";

import { questions as bankQuestions } from "@/content/units/y12-english-advanced-unseen-texts/questions";
import { texts as bankTexts } from "@/content/units/y12-english-advanced-unseen-texts/texts";

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

const UNIT = "y12-english-advanced-unseen-texts";
const Q1 = `${UNIT}.fs25-q1`;
// the shipped bank grows as papers are released, so the expected counts come from it
const FORM_OF = new Map(bankTexts.map((t) => [t.id, t.form]));
const POEMS = bankQuestions.filter((q) => FORM_OF.get((q as { textId: string }).textId) === "poem").length;
const FORMS = new Set(bankQuestions.map((q) => FORM_OF.get((q as { textId: string }).textId))).size;

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
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const staticOf = (el: ReactElement) => renderToStaticMarkup(createElement(el.type as never, el.props as never));

async function setup() {
  env = await setupTestEnv();
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  return me;
}
async function render() {
  const Page = (await import("@/app/unit/[unitId]/page")).default;
  return Page({ params: Promise.resolve({ unitId: UNIT }) });
}
const verdicts = (missed: SkillId[] = []) =>
  Object.fromEntries(SKILL_IDS.map((id) => [id, { met: !missed.includes(id), reason: "r" }])) as SkillVerdicts;
async function answered(userId: string, marks: number, missed: SkillId[] = [], questionId = Q1) {
  const a = await seedAttempt(env.db, userId, { unitId: UNIT, questionIds: [questionId], completedAt: new Date() });
  await seedResult(env.db, { attemptId: a.id, userId }, { unitId: UNIT, questionId, marksAwarded: marks, maxMarks: 3, gradedBy: "llm", conceptOutcomes: conceptOutcomes(verdicts(missed)) });
}

describe("the start button", () => {
  it("a new student: 'Start a question', with the exam row and no unfinished-question line", async () => {
    await setup();
    const tree = await render();
    const start = findAll(tree, named("StartQuiz"))[0];
    expect((start.props as { label: string }).label).toBe("Start a question");
    const text = textOf(tree);
    expect(text).toContain("Year 12 Advanced English Task 1");
    expect(text).not.toContain("question in progress");
    expect(findAll(tree, (el) => (el.props as { label?: string }).label === "Start new attempt")).toHaveLength(0);
  });

  it("an unfinished question: 'Continue question', naming the text and the paper", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [Q1] });
    const tree = await render();
    const start = findAll(tree, named("StartQuiz"))[0];
    expect((start.props as { label: string }).label).toBe("Continue question");
    expect(textOf(tree)).toContain("You have a question in progress: Text 1 – Poem · Fort St 2025 · Q1");
  });

  it("when every question is answered: the repeat message, and the start button stays", async () => {
    const me = await setup();
    expect(textOf(await render())).not.toContain("Questions now repeat");
    for (const q of questions) await answered(me.id, 3, [], q.id);
    const tree = await render();
    expect(findAll(tree, named("StartQuiz"))).toHaveLength(1);
    expect(textOf(tree)).toContain("You've answered every question. Questions now repeat, starting with the ones you found hardest.");
    expect(textOf(tree)).not.toContain("in the bank so far");
  });

  it("when the database cannot be read: the notice and no start button", async () => {
    await setup();
    env.databaseDown();
    const tree = await render();
    expect(findAll(tree, named("StartQuiz"))).toHaveLength(0);
    expect(textOf(tree)).toContain("We can't load your questions right now. Try again in a moment.");
  });
});

describe("results by text form", () => {
  it("lists one row per form in the bank, with answered of total and the average as a share of full marks", async () => {
    const me = await setup();
    await answered(me.id, 2, [], Q1); // a poem, 2 of 3
    const tree = await render();
    const forms = findAll(tree, named("UnitProgress"))[0];
    const html = staticOf(forms);
    expect(html).toContain("Results by text form");
    expect(html).toContain("Poem");
    expect(html).toContain(`1 of ${POEMS} answered`);
    expect(html).toContain("67% average");
    expect(html).toContain("Not tried yet");
    expect((html.match(/un-form-row/g) ?? []).length).toBe(FORMS); // one row per form in the bank
  });
});

describe("results by text form use each question's latest recorded mark", () => {
  it("a better repeat raises the form's average, and the answered count stays one per question", async () => {
    const me = await setup();
    const first = await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [Q1], completedAt: new Date() });
    await seedResult(env.db, { attemptId: first.id, userId: me.id }, { unitId: UNIT, questionId: Q1, marksAwarded: 1, maxMarks: 3, gradedBy: "llm", createdAt: new Date("2026-11-01T00:00:00Z") });
    const again = await seedAttempt(env.db, me.id, { unitId: UNIT, questionIds: [Q1], completedAt: new Date() });
    await seedResult(env.db, { attemptId: again.id, userId: me.id }, { unitId: UNIT, questionId: Q1, marksAwarded: 3, maxMarks: 3, gradedBy: "llm", createdAt: new Date("2026-11-09T00:00:00Z") });
    const html = staticOf(findAll(await render(), named("UnitProgress"))[0]);
    expect(html).toContain(`1 of ${POEMS} answered`);
    expect(html).toContain("100% average"); // not (33% + 100%) / 2
  });
});

describe("Things I need to know", () => {
  it("is empty for a new student", async () => {
    await setup();
    const tree = await render();
    const html = staticOf(findAll(tree, named("ConceptPanel"))[0]);
    expect(html).toContain("All clear — nothing to review right now. Any skill you miss on a first try will show up here.");
  });

  it("lists the skills missed on the first try with the skill name and two pips each", async () => {
    const me = await setup();
    await answered(me.id, 1, ["technique-effect", "apt-evidence"]);
    const tree = await render();
    const html = staticOf(findAll(tree, named("ConceptPanel"))[0]);
    expect(html).toContain("Things I need to know");
    expect(html).toContain("Skills you missed on a first try. A skill clears after 2 first tries that show it.");
    expect(html).toContain(esc(skillById("technique-effect").name));
    expect(html).toContain(esc(skillById("apt-evidence").name));
    expect(html).not.toContain(esc(skillById("succinct").name));
    expect(html).toContain("2 to go");
    expect((html.match(/class="pip/g) ?? []).length).toBe(4);
  });

  it("clears a skill after two later first tries that show it", async () => {
    const me = await setup();
    await answered(me.id, 1, ["technique-effect"]);
    await answered(me.id, 3, [], `${UNIT}.fs25-q1`);
    const html1 = staticOf(findAll(await render(), named("ConceptPanel"))[0]);
    expect(html1).toContain(esc(skillById("technique-effect").name));
    expect(html1).toContain("1 to go");
    await answered(me.id, 3, [], `${UNIT}.fs25-q1`);
    const html2 = staticOf(findAll(await render(), named("ConceptPanel"))[0]);
    expect(html2).not.toContain(esc(skillById("technique-effect").name));
    expect(html2).toContain("All clear");
  });

  it("requests no concept summary or illustration for this unit (Writing Practice)", async () => {
    const me = await setup();
    await answered(me.id, 1, ["technique-effect"]);
    const tree = await render();
    const html = staticOf(findAll(tree, named("ConceptPanel"))[0]);
    expect(html).not.toMatch(/concept-details|Generating|illustration/i);
  });
});

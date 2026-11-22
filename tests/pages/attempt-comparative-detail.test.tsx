// The attempt detail page for a comparative question (spec 009 FR-025, research R13, tasks T043): each text under its
// heading, each try with nine verdicts and reasons, the pick named, the recorded mark, and the model answer with the
// one-pairing line ONLY once the question is final; never the criteria, the notes, a description or the pairing early.

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { storeTexts } from "@/content/units/y12-english-advanced-unseen-texts/store-texts";
import { unseenPhases, type SkillVerdicts } from "@/lib/db/schema";
import { COMPARATIVE_SKILL_IDS } from "@/lib/unseen/skills";

import { CHOICE_Q, CMP_UNIT, FIXED_Q, KEY, TEXTS, mockComparativeContent } from "../helpers/comparative";
import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

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

const heading = (id: string) => storeTexts.find((t) => t.id === id)!.heading;
const verdicts = (missed: string[] = []): SkillVerdicts =>
  Object.fromEntries(COMPARATIVE_SKILL_IDS.map((id) => [id, { met: !missed.includes(id), reason: missed.includes(id) ? "REASON-MISSED-7001" : "REASON-MET-7002" }])) as SkillVerdicts;

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

async function render(attemptId: string) {
  const Page = (await import("@/app/attempts/[attemptId]/page")).default;
  const tree = await Page({ params: Promise.resolve({ attemptId }) });
  const detail = findAll(tree, (el) => typeof el.type === "function" && (el.type as { name?: string }).name === "UnseenAttemptDetailView");
  return textOf(tree) + detail.map((el) => renderToStaticMarkup(createElement(el.type as never, el.props as never))).join("");
}

async function seeded(questionId: string, opts: { final: boolean; pick?: string[] }) {
  env = await setupTestEnv();
  mockComparativeContent();
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  const attempt = await seedAttempt(env.db, me.id, { unitId: CMP_UNIT, questionIds: [questionId], completedAt: opts.final ? new Date() : null });
  await env.db.insert(unseenPhases).values({
    attemptId: attempt.id, userId: me.id, unitId: CMP_UNIT, questionId, maxMarks: 6,
    status: opts.final ? "final" : "try1", ...(opts.final ? { ending: "declined", recordedMark: 3 } : {}),
    try1Text: "MY-FIRST-COMPARISON", try1Mark: 3, try1Verdicts: verdicts(["compares-texts"]), try1Feedback: "FEEDBACK-ONE",
    try1BiggestGap: "GAP-ONE", try1PromptVersion: "comparative-pilot-1", try1Model: "m", pickedTextIds: opts.pick ?? null,
  });
  if (opts.final) {
    await seedResult(env.db, { attemptId: attempt.id, userId: me.id }, { unitId: CMP_UNIT, questionId, marksAwarded: 3, maxMarks: 6, answer: "MY-FIRST-COMPARISON", gradedBy: "llm" });
  }
  return attempt;
}

describe("a finished choice question", () => {
  it("shows both texts, the pick, nine verdicts with reasons, the recorded mark, the model answer and the one-pairing line", async () => {
    const a = await seeded(CHOICE_Q, { final: true, pick: [TEXTS.B] });
    const out = await render(a.id);
    for (const id of [TEXTS.A, TEXTS.B, TEXTS.V]) expect(out).toContain(heading(id));
    expect(out).toContain(`You wrote about: ${heading(TEXTS.B)}.`);
    expect(out).toContain("MY-FIRST-COMPARISON");
    expect(out).toContain("REASON-MISSED-7001");
    expect(out).toContain("Compares the texts");
    expect(out).toContain("Treats both texts in depth");
    expect(out).toContain("Recorded 3/6");
    expect(out).toContain(KEY.model);
    expect(out).toContain(`This model answer shows one possible pairing (${heading(KEY.pairing[0])} and ${heading(KEY.pairing[1])})`);
  });
  it("never shows the criteria, the notes or a description", async () => {
    const a = await seeded(CHOICE_Q, { final: true, pick: [TEXTS.B] });
    const out = await render(a.id);
    for (const secret of [KEY.criteria.split("\n")[0], "None provided by the school.", "A black-and-white line drawing"]) expect(out).not.toContain(secret);
  });
});

describe("an unfinished choice question", () => {
  it("shows the first try and the pick but no model answer and no pairing", async () => {
    const a = await seeded(CHOICE_Q, { final: false, pick: [TEXTS.V] });
    const out = await render(a.id);
    expect(out).toContain(`You wrote about: ${heading(TEXTS.V)}.`);
    expect(out).toContain("MY-FIRST-COMPARISON");
    expect(out).not.toContain(KEY.model);
    expect(out).not.toContain("one possible pairing");
  });
});

describe("a fixed pair", () => {
  it("names no pick and gives no pairing line, with the model answer once final", async () => {
    const a = await seeded(FIXED_Q, { final: true });
    const out = await render(a.id);
    expect(out).not.toContain("You wrote about");
    expect(out).not.toContain("one possible pairing");
    expect(out).toContain(KEY.model);
  });
});

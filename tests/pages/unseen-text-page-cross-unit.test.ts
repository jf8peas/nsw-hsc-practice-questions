// The text-only page across the two Advanced English units (spec 009 FR-005, FR-006, research R3, task T036): a text
// shows to a student with an attempt, in EITHER unit, on a question that shows it (both texts of a fixed pair, and
// every allowed text of a choice question, picked or not); the unit in the URL must hold the text; anything else is
// the same 404; the attempt id in the link turns highlighting on only when it is the student's own attempt on a
// question that shows the text. A synthetic comparative bank on real store texts; PGlite; no network.

import { isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { questions as unseenQuestions } from "@/content/units/y12-english-advanced-unseen-texts/questions";

import { CHOICE_Q, CMP_UNIT, FIXED_Q, TEXTS, mockComparativeContent } from "../helpers/comparative";
import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedUser } from "../helpers/fixtures";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

let env: TestEnv;
afterEach(async () => {
  vi.doUnmock("@/content/units/y12-english-advanced-comparative-texts/questions");
  vi.doUnmock("@/content/units/y12-english-advanced-comparative-texts/keys");
  await env?.close();
});

const UNSEEN = "y12-english-advanced-unseen-texts";
const UNSEEN_Q_A = `${UNSEEN}.fs25-q1`; // shows fs25-t1, which is the comparative bank's first text (TEXTS.A)
// a text the comparative bank never shows (TEXTS.C), through a spec 008 question that does
const UNSEEN_Q_OTHER = unseenQuestions.find((q) => q.type === "unseen" && q.textId === TEXTS.C)!.id;

function findAll(node: ReactNode, match: (el: ReactElement) => boolean, out: ReactElement[] = []) {
  if (Array.isArray(node)) node.forEach((n) => findAll(n, match, out));
  else if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (match(el)) out.push(el);
    findAll(el.props.children, match, out);
  }
  return out;
}
const named = (name: string) => (el: ReactElement) => typeof el.type === "function" && (el.type as { name?: string }).name === name;

async function setup() {
  env = await setupTestEnv();
  mockComparativeContent();
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  return me;
}
const page = async (unitId: string, textId: string, attempt?: string) => {
  const Page = (await import("@/app/unit/[unitId]/text/[textId]/page")).default;
  return Page({ params: Promise.resolve({ unitId, textId }), searchParams: Promise.resolve(attempt === undefined ? {} : { attempt }) });
};
const panelOf = async (unitId: string, textId: string, attempt?: string) => {
  const tree = await page(unitId, textId, attempt);
  const panel = findAll(tree, named("TextPanel"))[0];
  return panel.props as { text: { id: string }; highlight: { userId: string; attemptId: string } | null };
};

describe("access counts an attempt in either unit and every text the question shows", () => {
  it("a fixed pair's attempt opens both of its texts, through the comparative unit's link", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: CMP_UNIT, questionIds: [FIXED_Q] });
    expect((await panelOf(CMP_UNIT, TEXTS.A)).text.id).toBe(TEXTS.A);
    expect((await panelOf(CMP_UNIT, TEXTS.V)).text.id).toBe(TEXTS.V);
  });

  it("a choice question's attempt opens every allowed text, picked or not, on a first visit", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: CMP_UNIT, questionIds: [CHOICE_Q] });
    for (const id of [TEXTS.A, TEXTS.B, TEXTS.V]) expect((await panelOf(CMP_UNIT, id)).text.id).toBe(id);
  });

  it("an attempt only in the unseen-text unit opens the text through the comparative unit's link, when that unit shows it", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: UNSEEN, questionIds: [UNSEEN_Q_A] });
    expect((await panelOf(CMP_UNIT, TEXTS.A)).text.id).toBe(TEXTS.A);
  });

  it("an attempt only in the comparative unit opens the text through the unseen-text unit's link", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: CMP_UNIT, questionIds: [FIXED_Q] });
    expect((await panelOf(UNSEEN, TEXTS.A)).text.id).toBe(TEXTS.A);
  });
});

describe("everything else is the same 404", () => {
  it("no attempt in either unit", async () => {
    await setup();
    await expect(page(CMP_UNIT, TEXTS.A)).rejects.toThrow("NOT_FOUND");
    await expect(page(UNSEEN, TEXTS.A)).rejects.toThrow("NOT_FOUND");
  });

  it("another student's attempt does not count", async () => {
    await setup();
    const other = await seedUser(env.db);
    await seedAttempt(env.db, other.id, { unitId: CMP_UNIT, questionIds: [CHOICE_Q] });
    await expect(page(CMP_UNIT, TEXTS.B)).rejects.toThrow("NOT_FOUND");
  });

  it("a text the named unit does not hold, even when the student has met it in the other unit", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: UNSEEN, questionIds: [UNSEEN_Q_OTHER] });
    await expect(page(CMP_UNIT, TEXTS.C)).rejects.toThrow("NOT_FOUND"); // no comparative question shows it
    expect((await panelOf(UNSEEN, TEXTS.C)).text.id).toBe(TEXTS.C); // its own unit still opens it
  });

  it("an unknown unit, an unknown text and a malformed text id answer alike", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: CMP_UNIT, questionIds: [FIXED_Q] });
    await expect(page("no-such-unit", TEXTS.A)).rejects.toThrow("NOT_FOUND");
    await expect(page(CMP_UNIT, "nope-t9")).rejects.toThrow("NOT_FOUND");
    await expect(page(CMP_UNIT, "../../etc")).rejects.toThrow("NOT_FOUND");
  });

  it("a signed-out visitor is redirected to sign in", async () => {
    env = await setupTestEnv();
    mockComparativeContent();
    env.signedInAs(null as never);
    await expect(page(CMP_UNIT, TEXTS.A)).rejects.toThrow(/REDIRECT:/);
  });
});

describe("the attempt id in the link turns highlighting on only when it is this student's attempt on a question showing the text", () => {
  it("its own comparative attempt, and its own unseen-text attempt on the same text, both work", async () => {
    const me = await setup();
    const cmp = await seedAttempt(env.db, me.id, { unitId: CMP_UNIT, questionIds: [FIXED_Q] });
    const old = await seedAttempt(env.db, me.id, { unitId: UNSEEN, questionIds: [UNSEEN_Q_A], completedAt: new Date() });
    expect((await panelOf(CMP_UNIT, TEXTS.A, cmp.id)).highlight).toEqual({ userId: me.id, attemptId: cmp.id });
    expect((await panelOf(CMP_UNIT, TEXTS.A, old.id)).highlight).toEqual({ userId: me.id, attemptId: old.id });
  });

  it("a choice attempt gives highlighting on an unpicked allowed text too", async () => {
    const me = await setup();
    const a = await seedAttempt(env.db, me.id, { unitId: CMP_UNIT, questionIds: [CHOICE_Q] });
    expect((await panelOf(CMP_UNIT, TEXTS.B, a.id)).highlight).toEqual({ userId: me.id, attemptId: a.id });
  });

  it("another student's attempt, a question that does not show the text, a malformed id and no id turn it off, and the text still shows", async () => {
    const me = await setup();
    await seedAttempt(env.db, me.id, { unitId: CMP_UNIT, questionIds: [FIXED_Q] });
    const other = await seedUser(env.db);
    const theirs = await seedAttempt(env.db, other.id, { unitId: CMP_UNIT, questionIds: [FIXED_Q] });
    const unrelated = await seedAttempt(env.db, me.id, { unitId: UNSEEN, questionIds: [UNSEEN_Q_OTHER], completedAt: new Date() });
    expect((await panelOf(CMP_UNIT, TEXTS.A, theirs.id)).highlight).toBeNull();
    expect((await panelOf(CMP_UNIT, TEXTS.A, unrelated.id)).highlight).toBeNull();
    expect((await panelOf(CMP_UNIT, TEXTS.A, "not-a-uuid")).highlight).toBeNull();
    expect((await panelOf(CMP_UNIT, TEXTS.A)).highlight).toBeNull();
  });
});

describe("what the page carries", () => {
  it("only the public text: no question, pick, description or key reaches the tree", async () => {
    const me = await setup();
    const a = await seedAttempt(env.db, me.id, { unitId: CMP_UNIT, questionIds: [CHOICE_Q] });
    const tree = await page(CMP_UNIT, TEXTS.V, a.id);
    const wire = JSON.stringify(tree, (_k, v) => (typeof v === "function" ? undefined : v));
    for (const secret of ["criteria", "pairing", "Skilful comparison", "description", "pickedTextIds", "model"]) expect(wire).not.toContain(secret);
  });
});

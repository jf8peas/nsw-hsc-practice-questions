// The "to review" pill on the home page unit cards: the number of concepts not yet cleared
// in a unit, absent at zero, and never breaking the page when the database is unavailable.

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";

// UnitCard renders next/link; a plain anchor keeps renderToStaticMarkup self-contained.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { seedAttempt, seedUser } from "../helpers/fixtures";
import { PLAIN, READY, fixtureContent, seedResultAt } from "../helpers/concept-fixtures";

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const at = (minute: number) => new Date(Date.UTC(2026, 9, 1, 9, minute, 0));

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

const named = (name: string) => (el: ReactElement) =>
  typeof el.type === "function" && (el.type as { name?: string }).name === name;

async function setup() {
  env = await setupTestEnv();
  fixtureContent();
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  return { me };
}

/** The home page tree with every UnitCard rendered to real markup. */
async function renderHomeCards() {
  const Page = (await import("@/app/page")).default;
  const { UnitCard } = await import("@/components/UnitCard");
  const tree = await Page();
  return findAll(tree, named("UnitCard")).map((el) =>
    renderToStaticMarkup(createElement(UnitCard, el.props as never)),
  );
}

const cardFor = (cards: string[], unitId: string) =>
  cards.find((c) => c.includes(`/unit/${unitId}`)) ?? "";

describe("home page 'to review' pill", () => {
  it("shows the number of uncleared concepts on a unit card, before the other badges", async () => {
    const { me } = await setup();
    const attempt = await seedAttempt(env.db, me.id, { unitId: READY });
    await seedResultAt(env.db, { attemptId: attempt.id, userId: me.id }, READY, `${READY}.m01`, 0, 1, at(1));
    await seedResultAt(env.db, { attemptId: attempt.id, userId: me.id }, READY, `${READY}.m02`, 0, 1, at(2));

    const cards = await renderHomeCards();
    const ready = cardFor(cards, READY);
    expect(ready).toContain("2 to review");
    // first badge in the card, before the type/date pills
    expect(ready.indexOf("rd-pill review")).toBeLessThan(ready.indexOf("rd-pill blue"));
    // the other badges are untouched
    expect(ready).toContain("Ready fixture");
  });

  it("renders nothing when every concept is cleared: no '0 to review', no all-done state", async () => {
    const { me } = await setup();
    const attempt = await seedAttempt(env.db, me.id, { unitId: READY });
    // concept a (tagged on m01, m07, s01, s07): a wrong then three corrects clears it.
    // One row per question: the results table is UNIQUE(attempt_id, question_id).
    await seedResultAt(env.db, { attemptId: attempt.id, userId: me.id }, READY, `${READY}.m01`, 0, 1, at(1));
    await seedResultAt(env.db, { attemptId: attempt.id, userId: me.id }, READY, `${READY}.m07`, 1, 1, at(2));
    await seedResultAt(env.db, { attemptId: attempt.id, userId: me.id }, READY, `${READY}.s01`, 2, 2, at(3));
    await seedResultAt(env.db, { attemptId: attempt.id, userId: me.id }, READY, `${READY}.s07`, 2, 2, at(4));

    const cards = await renderHomeCards();
    const ready = cardFor(cards, READY);
    expect(ready).not.toContain("to review");
    expect(ready).not.toContain("0 to review");
  });

  it("a unit that has not adopted concepts and a unit with no results get no pill", async () => {
    const { me } = await setup();
    const attempt = await seedAttempt(env.db, me.id, { unitId: PLAIN });
    await seedResultAt(env.db, { attemptId: attempt.id, userId: me.id }, PLAIN, `${PLAIN}.m01`, 0, 1, at(1));

    const cards = await renderHomeCards();
    expect(cardFor(cards, PLAIN)).not.toContain("to review");
  });

  it("other students' misses never count", async () => {
    const { me } = await setup();
    const bob = await seedUser(env.db);
    const bobAttempt = await seedAttempt(env.db, bob.id, { unitId: READY });
    await seedResultAt(env.db, { attemptId: bobAttempt.id, userId: bob.id }, READY, `${READY}.m01`, 0, 1, at(1));

    const cards = await renderHomeCards();
    expect(cardFor(cards, READY)).not.toContain("to review");
    expect(me.id).not.toBe(bob.id);
  });

  it("renders exactly as today, with no pills and no error, when the database is unreachable", async () => {
    await setup();
    env.databaseDown();
    const cards = await renderHomeCards();
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) expect(card).not.toContain("to review");
  });

  it("renders without pills, and does not throw, when only the review-count query fails", async () => {
    await setup();
    env.failAfterCalls(1); // the session lookup succeeds, the results query fails
    const cards = await renderHomeCards();
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) expect(card).not.toContain("to review");
  });
});

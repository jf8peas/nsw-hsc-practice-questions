// The "Concepts to review" section on the unit page (spec 002 User Story 1).

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";

// ConceptPanel includes the invisible client refresher, which asks for the app router. Rendering
// the panel on its own (outside Next) needs a stand-in for it; nothing here runs effects.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: () => {} }),
}));
import { seedAttempt, seedUser } from "../helpers/fixtures";
import { PLAIN, READY, fixtureContent, seedResultAt } from "../helpers/concept-fixtures";

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const at = (minute: number) => new Date(Date.UTC(2026, 9, 1, 9, minute, 0));
const params = <T,>(p: T) => ({ params: Promise.resolve(p) });

function findAll(node: ReactNode, match: (el: ReactElement) => boolean, out: ReactElement[] = []) {
  if (Array.isArray(node)) node.forEach((n) => findAll(n, match, out));
  else if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (match(el)) out.push(el);
    findAll(el.props.children, match, out);
  }
  return out;
}

/** Names of the function components in a tree, in document order. */
function componentOrder(node: ReactNode, out: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((n) => componentOrder(n, out));
  else if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (typeof el.type === "function") out.push((el.type as { name?: string }).name ?? "");
    componentOrder(el.props.children, out);
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
  const attempt = await seedAttempt(env.db, me.id, { unitId: READY });
  return { me, attempt };
}

async function render(unitId: string) {
  const Page = (await import("@/app/unit/[unitId]/page")).default;
  const tree = await Page(params({ unitId }));
  const panelEl = findAll(tree, named("ConceptPanel"))[0];
  const { ConceptPanel } = await import("@/components/ConceptPanel");
  return {
    tree,
    panelEl,
    html: panelEl ? renderToStaticMarkup(createElement(ConceptPanel, panelEl.props as never)) : "",
  };
}

describe("Concepts to review", () => {
  it("lists the uncleared concepts with their descriptions and counts, highest count first, then most recently missed", async () => {
    const { me, attempt } = await setup();
    const base = { attemptId: attempt.id, userId: me.id };
    await seedResultAt(env.db, base, READY, `${READY}.m01`, 0, 1, at(1)); // concept a: 3
    await seedResultAt(env.db, base, READY, `${READY}.m02`, 0, 1, at(5)); // concept b: 3, missed later
    await seedResultAt(env.db, base, READY, `${READY}.m03`, 0, 1, at(3)); // concept c: 3 ...
    await seedResultAt(env.db, base, READY, `${READY}.m09`, 1, 1, at(6)); // ... then 2

    const { html } = await render(READY);
    expect(html).toContain("Concepts to review");
    const order = ["Concept B", "Concept A", "Concept C"].map((d) => html.indexOf(d));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((x, y) => x - y)).toEqual(order); // B, then A, then C
    expect(html).toContain("3 more correct answers needed");
    expect(html).toContain("2 more correct answers needed");
  });

  it("says '1 more correct answer needed' (singular) at a count of 1", async () => {
    const { me, attempt } = await setup();
    const base = { attemptId: attempt.id, userId: me.id };
    await seedResultAt(env.db, base, READY, `${READY}.m01`, 0, 1, at(1));
    await seedResultAt(env.db, base, READY, `${READY}.m07`, 1, 1, at(2));
    await seedResultAt(env.db, base, READY, `${READY}.s01`, 2, 2, at(3));
    const { html } = await render(READY);
    expect(html).toContain("1 more correct answer needed");
    expect(html).not.toContain("1 more correct answers");
  });

  it("shows a short positive message, not an empty list or an error, when nothing is weak", async () => {
    await setup();
    const { html } = await render(READY);
    expect(html).toContain("Concepts to review");
    expect(html).not.toContain("<li");
    expect(html).toMatch(/no weak concepts|nothing to catch up on|all clear|well done/i);
  });

  it("ignores results in another unit", async () => {
    const { me } = await setup();
    const other = await seedAttempt(env.db, me.id, { unitId: PLAIN });
    await seedResultAt(env.db, { attemptId: other.id, userId: me.id }, PLAIN, `${PLAIN}.m01`, 0, 1, at(1));
    const { html } = await render(READY);
    expect(html).not.toContain("<li");
  });

  it("another student's misses never appear", async () => {
    const { me } = await setup();
    const bob = await seedUser(env.db);
    const bobAttempt = await seedAttempt(env.db, bob.id, { unitId: READY });
    await seedResultAt(env.db, { attemptId: bobAttempt.id, userId: bob.id }, READY, `${READY}.m01`, 0, 1, at(1));
    expect(me.id).not.toBe(bob.id);
    const { html } = await render(READY);
    expect(html).not.toContain("Concept A");
  });

  it("is absent for a unit that has not adopted concepts", async () => {
    await setup();
    const { html } = await render(PLAIN);
    expect(html).toBe("");
  });

  it("shows a plain notice, and does not throw, when the database cannot be reached", async () => {
    await setup();
    env.databaseDown();
    const { html, panelEl } = await render(READY);
    expect(panelEl).toBeDefined();
    expect(html).toContain("Concepts to review");
    expect(html).toContain("We could not load your weak concepts right now");
  });

  it("keeps Start quiz before the section, and the section before the history (Principle VIII)", async () => {
    await setup();
    const { tree } = await render(READY);
    const order = componentOrder(tree);
    expect(order.indexOf("StartQuiz")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("StartQuiz")).toBeLessThan(order.indexOf("ConceptPanel"));
    expect(order.indexOf("ConceptPanel")).toBeLessThan(
      Math.min(...["AttemptHistory", "HistoryUnavailable"].map((n) => (order.includes(n) ? order.indexOf(n) : Infinity))),
    );
  });
});

describe("heading, pill and progress pips (spec 003)", () => {
  it("shows the pill count, the explanation, pips filled 3 - count, 'to go' and the hidden sentence", async () => {
    const { me, attempt } = await setup();
    const base = { attemptId: attempt.id, userId: me.id };
    await seedResultAt(env.db, base, READY, `${READY}.m01`, 0, 1, at(1)); // concept a: 3
    await seedResultAt(env.db, base, READY, `${READY}.m02`, 0, 1, at(2)); // concept b: 3
    await seedResultAt(env.db, base, READY, `${READY}.m08`, 1, 1, at(3)); // ... then 2
    const { html } = await render(READY);
    // the pill reads "{n} to review", n = concepts listed
    expect(html).toContain('class="rd-pill review"');
    expect(html).toContain("2 to review");
    // the one-sentence explanation
    expect(html).toContain(
      "Ideas you have missed in this quiz. Answer each one correctly 3 times in a row to clear it; your next attempts include extra questions on them.",
    );
    // per concept: "to go" matches the count and the pips fill 3 - count (0 for a, 1 for b)
    expect(html).toContain("3 to go");
    expect(html).toContain("2 to go");
    expect((html.match(/class="pip on"/g) ?? []).length).toBe(1);
    // the pips and "to go" are decorative; screen readers get the sentence instead
    expect(html).toContain('class="concept-pips" aria-hidden="true"');
    expect(html).toContain("3 more correct answers needed");
    expect(html).toContain("2 more correct answers needed");
  });

  it("omits the pill and explanation, and shows the All clear box, when nothing is weak", async () => {
    await setup();
    const { html } = await render(READY);
    expect(html).toContain("Concepts to review");
    expect(html).not.toMatch(/\d+ to review/);
    expect(html).not.toContain("next attempts include extra questions");
    expect(html).toContain(
      "All clear — nothing to review right now. Any concept you miss in a quiz will show up here.",
    );
  });
});

describe("approved explanations and pictures (spec 002 User Story 2)", () => {
  const NOW = new Date("2026-10-28T10:00:00Z");

  async function approveSummary(conceptIdValue: string, bullets: string[], brief = false) {
    const store = await import("@/lib/concepts/store.server");
    const v = await store.insertReplacement(env.db, {
      conceptId: conceptIdValue, kind: "summary", unitId: READY, origin: "first", attemptNo: 1,
      summaryBullets: bullets, generatorModel: "vendor/secret-generator", generatedAt: NOW,
      ...(brief ? { illustrationBrief: "brief", illustrationAlt: "alt" } : {}),
    });
    await store.promote(env.db, conceptIdValue, "summary", v.id, "reviewer", { reviewerModel: "vendor/secret-reviewer", reason: null, at: NOW });
    return v;
  }
  async function approvePicture(conceptIdValue: string, alt: string) {
    const store = await import("@/lib/concepts/store.server");
    const v = await store.insertReplacement(env.db, {
      conceptId: conceptIdValue, kind: "illustration", unitId: READY, origin: "first", attemptNo: 1,
      illustrationSvg: "<svg/>", illustrationBrief: "brief", illustrationAlt: alt, generatorModel: "vendor/secret-drawer", generatedAt: NOW,
    });
    await store.promote(env.db, conceptIdValue, "illustration", v.id, "reviewer", { reviewerModel: "vendor/secret-reviewer", reason: null, at: NOW });
    return v;
  }

  const A = "fx-ready.c-a";
  const B = "fx-ready.c-b";

  async function twoWeakConcepts() {
    const { me, attempt } = await setup();
    const base = { attemptId: attempt.id, userId: me.id };
    await seedResultAt(env.db, base, READY, `${READY}.m01`, 0, 1, at(1));
    await seedResultAt(env.db, base, READY, `${READY}.m02`, 0, 1, at(2));
  }

  it("an approved summary opens as a native <details> listing its bullets", async () => {
    await twoWeakConcepts();
    await approveSummary(A, ["Idea one.", "Idea two.", "Idea three."]);
    const { html } = await render(READY);
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    for (const b of ["Idea one.", "Idea two.", "Idea three."]) expect(html).toContain(b);
    expect(html).toContain("Concept A");
  });

  it("a concept with no approved content is just its description: no details, no empty space, no error", async () => {
    await twoWeakConcepts();
    await approveSummary(A, ["Idea one.", "Idea two.", "Idea three."]);
    const { html } = await render(READY);
    const listItems = html.split("<li").length - 1;
    expect(html).toContain("Concept B");
    expect(html.split("<details").length - 1).toBe(1); // only A opens
    expect(listItems).toBeGreaterThanOrEqual(2);
    expect(html).not.toMatch(/error|unavailable|generat/i);
  });

  it("an approved picture is an <img> with alt text and lazy loading, never inline markup", async () => {
    await twoWeakConcepts();
    await approveSummary(A, ["Idea one.", "Idea two.", "Idea three."], true);
    const picture = await approvePicture(A, "A graph with two crossing curves");
    const { html } = await render(READY);
    expect(html).toContain(`<img`);
    expect(html).toContain(`src="/api/concepts/${A}/illustration?v=${picture.id}"`);
    expect(html).toContain('alt="A graph with two crossing curves"');
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain("<svg");
  });

  it("shows the bullets, and no image area, when the summary is approved but its picture is not", async () => {
    await twoWeakConcepts();
    await approveSummary(A, ["Idea one.", "Idea two.", "Idea three."], true);
    const store = await import("@/lib/concepts/store.server");
    const pending = await store.insertReplacement(env.db, {
      conceptId: A, kind: "illustration", unitId: READY, origin: "first", attemptNo: 1,
      illustrationSvg: "<svg/>", illustrationBrief: "brief", illustrationAlt: "alt", generatorModel: "vendor/draw", generatedAt: NOW,
    });
    await store.markReviewed(env.db, pending.id, { status: "failed_review", reviewerModel: "vendor/rev", reason: "axes swapped", at: NOW });
    const { html } = await render(READY);
    expect(html).toContain("Idea one.");
    expect(html).not.toContain("<img");
  });

  it("a summary that is pending or failed review is not shown", async () => {
    await twoWeakConcepts();
    const store = await import("@/lib/concepts/store.server");
    const v = await store.insertReplacement(env.db, {
      conceptId: A, kind: "summary", unitId: READY, origin: "first", attemptNo: 1,
      summaryBullets: ["Unreviewed one.", "Unreviewed two.", "Unreviewed three."], generatorModel: "vendor/gen", generatedAt: NOW,
    });
    expect((await render(READY)).html).not.toContain("Unreviewed one.");
    await store.markReviewed(env.db, v.id, { status: "failed_review", reviewerModel: "vendor/rev", reason: "wrong", at: NOW });
    expect((await render(READY)).html).not.toContain("Unreviewed one.");
  });

  it("carries no reviewer reason, model name, error or timestamp in the markup", async () => {
    await twoWeakConcepts();
    await approveSummary(A, ["Idea one.", "Idea two.", "Idea three."], true);
    await approvePicture(A, "alt text");
    const store = await import("@/lib/concepts/store.server");
    await store.ensureSlot(env.db, B, "summary", READY);
    await store.setBackoff(env.db, B, "summary", NOW, "http 502 from the secret provider");
    const { html } = await render(READY);
    for (const secret of ["secret-generator", "secret-reviewer", "secret-drawer", "vendor/", "502", "secret provider", "reviewer_reason"]) {
      expect(html).not.toContain(secret);
    }
  });

  it("includes the live refresher only when there are weak concepts to prepare", async () => {
    const { panelEl } = await (async () => {
      await twoWeakConcepts();
      return render(READY);
    })();
    const props = panelEl.props as { progress: { status: string }; view?: { status: string } };
    expect(props.progress.status).toBe("ok");
    expect(props.view?.status).toBe("ok");
    const none = await (async () => {
      await env.close();
      await setup();
      return render(READY);
    })();
    expect((none.panelEl.props as { view?: unknown }).view).toBeUndefined(); // nothing weak: nothing to load
  });
});

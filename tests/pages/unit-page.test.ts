// The unit page as a whole (spec 003): the four sections in order, the introduction card with
// badges / full description / exam countdown / Start-Continue, the "Your results" card with its
// notes, the "Past attempts" rows with their numbering and clamped bars, the shared headings and
// accessibility guarantees, the empty states, and the database-down view.

import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";
import { READY, fixtureContent, readyUnit, seedResultAt } from "../helpers/concept-fixtures";
import { formatWhen } from "@/lib/format";
import type { UnitHistory } from "@/lib/db/queries/history.server";
import { UNITS } from "@/content";
import type { Exam } from "@/lib/types";

// ConceptPanel includes the invisible client refresher, which asks for the app router (as in
// unit-concepts.test.ts). Nothing here runs effects.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: () => {}, push: vi.fn() }),
}));

// content/exams.ts ships an empty EXAMS array today, so the countdown strips are tested with a
// synthetic exam; daysUntil itself stays real.
let mockExams: Exam[] = [];
vi.mock("@/content/exams", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/content/exams")>();
  return { ...real, examsForUnit: () => mockExams };
});

let env: TestEnv;
afterEach(async () => {
  mockExams = [];
  await env?.close();
});

const REAL = "y11-physics-preliminary";
const realUnit = UNITS.find((u) => u.id === REAL)!;
const qs = realUnit.questions.slice(0, 4).map((q) => q.id);

const params = <T,>(p: T) => ({ params: Promise.resolve(p) });
const at = (day: number) => new Date(Date.UTC(2026, 0, day, 10, 0, 0));
/** An ISO date `n` days from today (UTC), the same base `daysUntil` uses. */
const isoDaysAhead = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

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

/** Static markup of an element's props (the pattern from unit-concepts.test.ts). */
function staticOf(el: ReactElement): string {
  return renderToStaticMarkup(createElement(el.type as never, el.props as never));
}

/** HTML-escape text so it can be compared against renderToStaticMarkup output. */
function escapeHtml(s: string): string {
  // entities are assembled with + so the source never contains a literal "&" that renderers could mangle
  const amp = "&" + "amp;";
  const lt = "&" + "lt;";
  const gt = "&" + "gt;";
  const quot = "&" + "quot;";
  const apos = "&" + "#x27;";
  return s
    .replace(/&/g, amp)
    .replace(/</g, lt)
    .replace(/>/g, gt)
    .replace(/"/g, quot)
    .replace(/'/g, apos);
}

/** One attempt with a single result of marks/max, started/completed at `day` (null = unfinished). */
async function attemptAt(userId: string, day: number, marks: number, max: number, completed = true) {
  const a = await seedAttempt(env.db, userId, {
    unitId: REAL,
    questionIds: [qs[0], qs[1]],
    startedAt: at(day),
    completedAt: completed ? at(day) : null,
  });
  await seedResult(env.db, { attemptId: a.id, userId }, { unitId: REAL, questionId: qs[0], marksAwarded: marks, maxMarks: max });
  return a;
}

/** Start a signed-in student. `useFixtures` swaps content for fx-ready/fx-plain. */
async function start(useFixtures = false) {
  env = await setupTestEnv();
  if (useFixtures) {
    fixtureContent();
  } else {
    // undo any fixture doMock from a previous test so real units resolve again
    vi.doUnmock("@/content");
    vi.doUnmock("@/content/answers");
  }
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  return me;
}

/** Render the unit page and return its element tree. */
async function renderPage(unitId: string) {
  const Page = (await import("@/app/unit/[unitId]/page")).default;
  return Page(params({ unitId }));
}

function introOf(tree: ReactNode): ReactElement {
  return findAll(
    tree,
    (el) =>
      el.type === "header" &&
      String((el.props as { className?: string }).className ?? "").split(" ").includes("unit-intro"),
  )[0];
}

async function attemptHtml(): Promise<string> {
  const tree = await renderPage(REAL);
  return staticOf(findAll(tree, named("AttemptHistory"))[0]);
}

describe("Introduction (US1)", () => {
  it("renders exactly one h1, the badges, the full description and Start quiz", async () => {
    await start();
    const tree = await renderPage(REAL);
    expect(findAll(tree, (el) => el.type === "h1")).toHaveLength(1);
    const html = staticOf(introOf(tree));
    expect(html).toContain(realUnit.type);
    expect(html).toContain(realUnit.created);
    expect(html).toContain(escapeHtml(realUnit.description)); // the full text stays in the page
    expect(html).toContain("Start quiz");
  });

  it("exam strip reads 'In 12 days' with the exam title and date", async () => {
    await start();
    const date = isoDaysAhead(12);
    mockExams = [{ id: "mock-12", title: "Mock HSC Physics 2026", date, unitIds: [REAL] }];
    const html = staticOf(introOf(await renderPage(REAL)));
    expect(html).toContain("In 12 days");
    expect(html).toContain("Mock HSC Physics 2026");
    expect(html).toContain(date);
  });

  it("exam strip reads 'In 1 day' with one day to go", async () => {
    await start();
    mockExams = [{ id: "mock-1", title: "Mock Tomorrow", date: isoDaysAhead(1), unitIds: [REAL] }];
    const html = staticOf(introOf(await renderPage(REAL)));
    expect(html).toContain("In 1 day");
    expect(html).toContain("Mock Tomorrow");
  });

  it("exam strip reads 'Today' on the day itself", async () => {
    await start();
    mockExams = [{ id: "mock-0", title: "Mock Today", date: isoDaysAhead(0), unitIds: [REAL] }];
    const html = staticOf(introOf(await renderPage(REAL)));
    expect(html).toContain("Today");
    expect(html).toContain("Mock Today");
  });

  it("offers Continue and Start new attempt when a resume exists", async () => {
    const me = await start();
    const a = await seedAttempt(env.db, me.id, { unitId: REAL, questionIds: [qs[0], qs[1]] });
    await seedResult(env.db, { attemptId: a.id, userId: me.id }, { unitId: REAL, questionId: qs[0] });
    const html = staticOf(introOf(await renderPage(REAL)));
    expect(html).toContain("Continue attempt (1 of 2 answered)");
    expect(html).toContain("Start new attempt");
  });
});

describe("Concepts to review (US2)", () => {
  it("shows the pill, the pips fill 3 - count, 'to go' and the screen-reader sentence", async () => {
    const me = await start(true);
    const attempt = await seedAttempt(env.db, me.id, { unitId: READY, questionIds: [`${READY}.m01`] });
    await seedResultAt(env.db, { attemptId: attempt.id, userId: me.id }, READY, `${READY}.m01`, 0, 1, at(1));
    const tree = await renderPage(READY);
    const panel = findAll(tree, named("ConceptPanel"))[0];
    const html = staticOf(panel);
    expect(html).toContain("1 to review");
    expect(html).toContain("Concepts to review");
    expect(html).toContain("3 to go"); // a count of 3: none filled yet
    expect(html).toContain("3 more correct answers needed");
    expect(html).toContain('class="concept-pips" aria-hidden="true"');
    expect((html.match(/class="pip on"/g) ?? []).length).toBe(0);
  });

  it("shows the All clear box, with no pill, when nothing is weak", async () => {
    await start(true);
    const html = staticOf(findAll(await renderPage(READY), named("ConceptPanel"))[0]);
    expect(html).toContain("Concepts to review");
    expect(html).toContain(
      "All clear — nothing to review right now. Any concept you miss in a quiz will show up here.",
    );
    expect(html).not.toMatch(/\d+ to review/);
    expect(html).not.toContain("next attempts include extra questions");
  });
});

describe("Your results (US3)", () => {
  it("notes an improvement as '↑ {d} pts on last' and Best as 'from {n} completed'", async () => {
    const me = await start();
    await attemptAt(me.id, 1, 3, 5); // 60%
    await attemptAt(me.id, 2, 4, 5); // 80%
    const html = await attemptHtml();
    expect(html).toContain("80%");
    expect(html).toContain("from 2 completed");
    expect(html).toContain("↑ 20 pts on last");
  });

  it("notes a drop as '↓ {d} pts on last'", async () => {
    const me = await start();
    await attemptAt(me.id, 1, 3, 5); // 60%
    await attemptAt(me.id, 2, 3, 10); // 30%
    expect(await attemptHtml()).toContain("↓ 30 pts on last");
  });

  it("says 'same as before' when the two most recent percents are equal", async () => {
    const me = await start();
    await attemptAt(me.id, 1, 2, 4); // 50%
    await attemptAt(me.id, 2, 2, 4); // 50%
    expect(await attemptHtml()).toContain("same as before");
  });

  it("says 'first result' with exactly one completed attempt", async () => {
    const me = await start();
    await attemptAt(me.id, 1, 4, 5); // 80%
    const html = await attemptHtml();
    expect(html).toContain("first result");
    expect(html).toContain("from 1 completed");
  });

  it("says 'none completed yet' with an empty Latest note when nothing is completed, and '{n} in progress'", async () => {
    const me = await start();
    await attemptAt(me.id, 1, 2, 4, false);
    await attemptAt(me.id, 2, 2, 4, false);
    const html = await attemptHtml();
    expect(html).toContain("none completed yet");
    expect(html).toContain("2 in progress");
    expect(html).not.toContain("first result");
    expect(html).not.toMatch(/pts on last/);
  });

  it("counts every attempt including unfinished ones and reports '{n} in progress'", async () => {
    const me = await start();
    await attemptAt(me.id, 1, 4, 5); // completed
    await attemptAt(me.id, 2, 2, 4, false); // in progress
    const html = await attemptHtml();
    expect(html).toContain("from 1 completed");
    expect(html).toContain("1 in progress");
  });

  it("shows the 'No attempts yet.' box, with no dashes, when there are no attempts", async () => {
    await start();
    const html = await attemptHtml();
    expect(html).toContain(
      "No attempts yet. Your scores will appear here after your first quiz, on any device.",
    );
    expect(html).not.toContain("—");
  });
});

describe("Past attempts (US4)", () => {
  it("numbers attempts oldest = 1, newest first, marks an unfinished middle attempt 'incomplete', and links each row", async () => {
    const me = await start();
    await attemptAt(me.id, 1, 2, 4);
    const mid = await attemptAt(me.id, 2, 1, 4, false);
    const newest = await attemptAt(me.id, 3, 4, 4);

    const html = await attemptHtml();
    expect(html).toContain("Past attempts");
    expect(html).toContain("Open an attempt to see each of your answers with its marks and feedback.");
    // newest first: Attempt 3, then the unfinished Attempt 2 (1 of 2 answered), then Attempt 1
    const order = ["Attempt 3", "Attempt 2", "Attempt 1"].map((t) => html.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    expect(html).toContain('title="1 of 2 answered"');
    expect(html).toContain("incomplete");
    expect(html).toContain(`/attempts/${mid.id}`);
    expect(html).toContain(`/attempts/${newest.id}`);
    expect(html).toContain(formatWhen(at(3))); // start time shown
    expect(html).toContain("50%"); // the real percent
    expect(html).toContain("1/4"); // and the marks/max figures
  });

  it("clamps the score bar to 0-100 while the text shows the real percent and marks", async () => {
    await start();
    const { AttemptHistory } = await import("@/components/AttemptHistory");
    // The results table forbids marks > max, so an out-of-range percent can only be exercised
    // against the component directly (the clamp is defensive).
    const history: UnitHistory = {
      attempts: [
        { id: "hi", unitId: REAL, startedAt: at(2), completedAt: at(2), marks: 3, max: 1, answered: 1, total: 1, percent: 300 },
        { id: "lo", unitId: REAL, startedAt: at(1), completedAt: at(1), marks: 0, max: 1, answered: 1, total: 1, percent: -20 },
      ],
      best: 300,
      latest: -20,
      completed: 2,
      resume: null,
    };
    const html = renderToStaticMarkup(createElement(AttemptHistory, { history }));
    expect(html).toContain("300%");
    expect(html).toContain("3/1");
    expect(html).toContain('style="width:100%"'); // 300 clamped to 100 for the bar only
    expect(html).toContain("-20%");
    expect(html).toContain('style="width:0%"'); // negative clamped to 0 for the bar only
  });
});

describe("Structure and accessibility (US5)", () => {
  it("has one h1, every section labelled by its heading, the shared headings on Formulas and the guide, and decorative elements hidden", async () => {
    const me = await start(true);
    // one weak concept and one completed attempt so every section renders
    const a = await seedAttempt(env.db, me.id, { unitId: READY, questionIds: [`${READY}.m01`, `${READY}.m02`] });
    await seedResultAt(env.db, { attemptId: a.id, userId: me.id }, READY, `${READY}.m01`, 0, 1, at(1));
    const done = await seedAttempt(env.db, me.id, { unitId: READY, questionIds: [`${READY}.m01`], startedAt: at(2), completedAt: at(2) });
    await seedResultAt(env.db, { attemptId: done.id, userId: me.id }, READY, `${READY}.m01`, 1, 1, at(2));

    const tree = await renderPage(READY);
    expect(findAll(tree, (el) => el.type === "h1")).toHaveLength(1);

    // The tree holds the components opaquely, so the sections/headings inside them
    // (ConceptPanel, AttemptHistory) and the inline formulas/guide sections are all
    // inspected through their rendered markup instead.
    const panel = staticOf(findAll(tree, named("ConceptPanel"))[0]);
    const ath = staticOf(findAll(tree, named("AttemptHistory"))[0]);
    const formulas = staticOf(
      findAll(
        tree,
        (el) => el.type === "section" && (el.props as { "aria-labelledby"?: string })["aria-labelledby"] === "formulas-title",
      )[0],
    );
    const guide = staticOf(
      findAll(
        tree,
        (el) => el.type === "section" && (el.props as { "aria-labelledby"?: string })["aria-labelledby"] === "guide-title",
      )[0],
    );

    // the shared headings: concepts, results, past attempts, formulas and the guide's own title
    expect(panel).toContain('aria-labelledby="concepts-title"');
    expect(panel).toContain('id="concepts-title"');
    expect(ath).toContain('aria-labelledby="results-title"');
    expect(ath).toContain('id="results-title"');
    expect(ath).toContain('aria-labelledby="attempt-history-title"');
    expect(ath).toContain('id="attempt-history-title"');
    expect(formulas).toContain('aria-labelledby="formulas-title"');
    expect(formulas).toContain('id="formulas-title"');
    expect(formulas).toContain("Formulas in this test");
    expect(guide).toContain('aria-labelledby="guide-title"');
    expect(guide).toContain('id="guide-title"');
    expect(guide).toContain("Fixture guide");

    // every labelled section has a heading h2 with the matching id (the shared heading style)
    const html = panel + ath + formulas + guide;
    const labelled = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((m) => m[1]);
    const headingIds = [...html.matchAll(/<h2 id="([^"]+)"/g)].map((m) => m[1]);
    expect(labelled.length).toBe(5);
    expect(headingIds.length).toBe(5);
    for (const id of labelled) expect(headingIds).toContain(id);

    // the full description stays in the page (ClampedText only hides it visually)
    expect(staticOf(introOf(tree))).toContain(escapeHtml(readyUnit.description));

    // pips, the score bar and the chevrons are decorative (aria-hidden), with text equivalents
    expect(panel).toContain('class="concept-pips" aria-hidden="true"');
    expect(ath).toContain('class="unit-attempt-bar" aria-hidden="true"');
    expect(ath).toContain('class="chev" aria-hidden="true"');
  });
});

describe("Database down (US6)", () => {
  it("keeps the page working: Start quiz, the concepts notice, the history notice, and no Past attempts", async () => {
    await start(true);
    env.databaseDown();

    const tree = await renderPage(READY);
    expect(findAll(tree, named("StartQuiz"))).toHaveLength(1);
    expect(findAll(tree, named("HistoryUnavailable"))).toHaveLength(1);
    expect(findAll(tree, named("AttemptHistory"))).toHaveLength(0);

    const results = findAll(
      tree,
      (el) => el.type === "section" && (el.props as { "aria-labelledby"?: string })["aria-labelledby"] === "results-title",
    )[0];
    expect(results).toBeDefined();
    expect(staticOf(results)).toContain("History is temporarily unavailable");
    expect(textOf(tree)).not.toContain("Past attempts");

    const panelHtml = staticOf(findAll(tree, named("ConceptPanel"))[0]);
    expect(panelHtml).toContain("We could not load your weak concepts right now");
  });
});

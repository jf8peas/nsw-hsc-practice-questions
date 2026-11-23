// @vitest-environment jsdom
//
// Accessibility structure of the English essay screens (spec 011 NFR, T099): every field labelled, polite live regions for the
// counter, marking progress and notices, an alert for errors, focus moved to the result summary and to a not-marked notice,
// no colour-only status (every verdict, flag and cap has words or shapes), reduced-motion safe styles, and 44 px targets in the
// stylesheet. jsdom cannot lay out pixels, so sizes are checked in the CSS source and structure in the DOM.

import fs from "node:fs";
import path from "node:path";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EssayPanel } from "@/components/english-essay/EssayPanel";
import { EnglishEssayResult } from "@/components/english-essay/Result";
import { Scaffold } from "@/components/english-essay/Scaffold";
import { emptyEnglishEssayScaffold } from "@/lib/english-essay/scaffold";
import type { EnglishEssayResultView, EnglishEssayState, PublicEnglishEssay } from "@/lib/english-essay/types";

const essay: PublicEnglishEssay = {
  type: "englishEssay",
  group: "englishEssay",
  maxMarks: 20,
  live: true,
  id: "y12-english-essay-writing.e1",
  prompt: "To what extent do you agree?",
  directive: "to what extent",
  directiveDefinition: "Make a judgement.",
  directiveGuidance: "unit",
  offer: 1,
  source: "Knox 2025 Trial, Q6",
  conceptIds: [],
};
const css = fs.readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");

beforeEach(() => {
  window.sessionStorage.clear();
  Object.defineProperty(navigator, "sendBeacon", { value: vi.fn(() => true), configurable: true });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ notMarked: { reason: "marker_unavailable" }, saved: false }), { status: 200 })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("the plan screen", () => {
  it("labels every field and announces the counter politely", () => {
    const { container } = render(<Scaffold attemptId="a" attemptToken="t" essay={essay} initial={emptyEnglishEssayScaffold()} onStarted={() => {}} />);
    for (const ta of Array.from(container.querySelectorAll("textarea"))) expect(screen.getByLabelText(ta.previousElementSibling?.textContent ?? "", { selector: `#${ta.id}` })).toBeTruthy();
    const counter = screen.getByText("0 / 150 words");
    expect(counter.getAttribute("role")).toBe("status");
    expect(counter.getAttribute("aria-live")).toBe("polite");
  });
});

describe("the essay screen", () => {
  const state = (): EnglishEssayState => ({ stage: "write", essay, scaffold: emptyEnglishEssayScaffold(), locked: true, draft: Array.from({ length: 900 }, () => "w").join(" ") });

  it("describes the box by its counter and note, and moves focus to a not-marked notice", async () => {
    render(<EssayPanel attemptId="a" attemptToken="t" state={state()} onFinish={() => {}} />);
    const box = screen.getByLabelText("Your essay");
    expect(box.getAttribute("aria-describedby")).toBe("es-essay-counter es-essay-note");
    expect(document.getElementById("es-essay-counter")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Submit essay/ }));
    const notice = await screen.findByText(/couldn’t mark your essay just now/);
    await waitFor(() => expect(document.activeElement).toBe(notice.closest('[role="status"]')));
  });

  it("shows an error as an alert", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "server" }), { status: 500 })));
    render(<EssayPanel attemptId="a" attemptToken="t" state={state()} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Submit essay/ }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Marking didn’t work this time/);
  });
});

describe("the result", () => {
  const result = (over: Partial<EnglishEssayResultView> = {}): EnglishEssayResultView => ({
    questionId: "q",
    essay,
    finalMark: 10,
    finalBand: 3,
    capped: true,
    knowledgeCapApplied: true,
    focusCap: 10,
    criteria: { argument: { verdict: "weak", reason: "r" }, analysis: { verdict: "developing", reason: "r" }, knowledge: { verdict: "sound", reason: "r" }, expression: { verdict: "strong", reason: "r" } },
    bandReason: "b",
    lift: ["a", "b"],
    questionFocus: "barely",
    questionFocusReason: "why",
    knowledgeErrors: [{ quote: "q", why: "w" }],
    quoteFlags: [{ quote: "x y z", status: "not-found" }, { quote: "a b c", status: "near", correct: "a b d" }],
    gaps: [],
    essayText: "e",
    plan: emptyEnglishEssayScaffold(),
    words: 900,
    ...over,
  });

  it("moves focus to the summary and gives every status words or shapes, never colour alone", () => {
    const { container } = render(<EnglishEssayResult result={result()} />);
    const summary = container.querySelector(".es-summary") as HTMLElement;
    expect(summary.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(summary);
    // each verdict: a word and a bar shape
    for (const badge of Array.from(container.querySelectorAll(".es-verdict"))) {
      expect(badge.textContent).toMatch(/Strong|Sound|Developing|Weak/);
      expect(badge.querySelector(".es-bars")?.getAttribute("aria-hidden")).toBe("true");
      expect(badge.querySelector(".es-bars")?.textContent).toMatch(/[▰▱]/);
    }
    // the focus warning, each flag and the cap explanation are all sentences
    expect(screen.getByText("Barely on the question.")).toBeTruthy();
    expect(screen.getByText(/not found in the play/)).toBeTruthy();
    expect(screen.getByText(/Check this quote\. The play says/)).toBeTruthy();
    expect(screen.getByText(/held to 10 or below/)).toBeTruthy();
  });

  it("uses headings for its sections so a screen reader can move between them", () => {
    render(<EnglishEssayResult result={result()} />);
    for (const name of ["How each criterion went", "To lift your mark", "Mistakes about the text", "Check these quotations", "Added to Things I need to know"]) {
      expect(screen.getByRole("heading", { name })).toBeTruthy();
    }
  });
});

describe("the stylesheet", () => {
  it("keeps 44 px (here 48 px) action targets and tokens only in the shared essay styles", () => {
    expect(css).toMatch(/\.es-actions \.rw-btn \{[^}]*min-height: 48px/);
    expect(css).toMatch(/\.es-section > summary[^{]*\{[^}]*min-height: 44px/);
    expect(css).toMatch(/\.es-grow \{[^}]*min-height: 44px/);
    const english = css.slice(css.indexOf("the English essay-writing unit (spec 011)"));
    expect(english).not.toMatch(/#[0-9a-fA-F]{3,6}\b/); // no raw colours: tokens only
  });

  it("respects reduced motion for the marking spinner and the auto-growing fields", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \.es-card \.rw-spinner \{ animation: none; \} \}/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \.es-grow \{ transition: none; \} \}/);
  });

  it("lets the plan and result stack at 390 px and sit in two columns from 900 px", () => {
    expect(css).toMatch(/\.es-sidebyside \{ display: grid; grid-template-columns: minmax\(0, 1fr\)/);
    expect(css).toMatch(/@media \(min-width: 900px\) \{ \.es-sidebyside \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  });
});

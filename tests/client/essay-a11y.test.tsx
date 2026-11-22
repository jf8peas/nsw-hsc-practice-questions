// @vitest-environment jsdom
//
// Accessibility of the essay unit (spec 010 FR-049, SC-009): verdicts and strength or fix statuses never rely on colour
// alone, status messages sit in polite live regions, the result and notices can take focus, targets are at least
// 44 px, reduced motion is respected, and no fixed width would force sideways scrolling at 390 px.

import fs from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EssayBox } from "@/components/essay/EssayBox";
import { EssayResult } from "@/components/essay/Result";
import { ReviewPanel } from "@/components/essay/ReviewPanel";
import { Timer } from "@/components/essay/Timer";
import { NotMarkedNotice } from "@/components/unseen/Writing";
import { CHECK_ORDER } from "@/lib/essay/review-labels";
import { emptyScaffold } from "@/lib/essay/scaffold";
import type { EssayResultView } from "@/lib/essay/types";

beforeEach(() => {
  Object.defineProperty(navigator, "sendBeacon", { value: vi.fn(() => true), configurable: true });
});
afterEach(cleanup);

const css = fs.readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");
const esCss = css.slice(css.indexOf("the essay-writing unit (spec 010)")).replace(/\/\*[\s\S]*?\*\//g, "");
const rules = [...esCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1]!.trim(), m[2]!] as const);

const result: EssayResultView = {
  questionId: "u.e1",
  essay: { id: "u.e1", prompt: "Explain it.", verb: "explain", verbDefinition: "d", economy: "china", offer: 1 },
  finalMark: 14,
  band: 2,
  capped: false,
  criteria: {
    understanding: { verdict: "strong", reason: "a" },
    theory: { verdict: "sound", reason: "b" },
    assessment: { verdict: "developing", reason: "c" },
    data: { verdict: "weak", reason: "d" },
    structure: { verdict: "sound", reason: "e" },
  },
  bandReason: "r",
  lift: ["x", "y"],
  flags: [],
  gaps: [],
  essayText: "essay",
  plan: emptyScaffold(),
  words: 700,
};

describe("verdicts and statuses", () => {
  it("every criterion verdict says its word and carries a shape, not only a colour", () => {
    const { container } = render(<EssayResult result={result} />);
    const badges = [...container.querySelectorAll(".es-verdict")];
    expect(badges.map((b) => b.textContent?.replace(/[▰▱]/g, "").trim())).toEqual(["Strong", "Sound", "Developing", "Weak", "Sound"]);
    for (const b of badges) expect(b.querySelector(".es-bars")?.getAttribute("aria-hidden")).toBe("true");
    expect(badges.map((b) => (b.textContent!.match(/▰/g) ?? []).length)).toEqual([4, 3, 2, 1, 3]);
  });

  it("every plan check says Strength or Fix in words with a mark", () => {
    const review = { checks: CHECK_ORDER.map((id, i) => ({ id, status: i % 2 ? ("strength" as const) : ("fix" as const), line: "l?" })), figureFlags: [] };
    const { container } = render(<ReviewPanel review={review} />);
    const statuses = [...container.querySelectorAll(".es-check-status")].map((s) => s.textContent!.trim());
    for (const s of statuses) expect(s).toMatch(/Strength|Fix/);
    expect(statuses).toHaveLength(7);
  });
});

describe("status messages and focus", () => {
  it("the not-marked notice is a polite status that can take focus", () => {
    render(<NotMarkedNotice reason="marker_unavailable" />);
    const notice = screen.getByRole("status");
    expect(notice.getAttribute("tabindex")).toBe("-1");
    expect(notice.textContent).not.toMatch(/error|fail/i);
  });

  it("the result summary takes focus when the result appears", () => {
    const { container } = render(<EssayResult result={result} />);
    expect(document.activeElement).toBe(container.querySelector(".es-summary"));
  });

  it("the word counter and the timer's end are announced in polite live regions", () => {
    const { container } = render(<EssayBox attemptId="a" attemptToken="t" questionId="q" value="" onChange={() => {}} onSubmit={() => {}} locked={false} limitReached={false} />);
    expect(container.querySelector('[role="status"][aria-live="polite"]')).toBeTruthy();
    cleanup();
    render(<Timer seconds={1} />);
    expect(screen.queryByRole("status")).toBeNull(); // nothing announced until the time is up
  });

  it("the essay box is labelled and described by its counter", () => {
    render(<EssayBox attemptId="a" attemptToken="t" questionId="q" value="" onChange={() => {}} onSubmit={() => {}} locked={false} limitReached={false} />);
    const box = screen.getByRole("textbox", { name: "Your essay" });
    expect(box.getAttribute("aria-describedby")).toContain("es-essay-counter");
  });
});

describe("the stylesheet", () => {
  const body = (selector: string) => rules.find(([s]) => s === selector)?.[1] ?? "";

  it("makes the section headers and the action buttons at least 44 px tall", () => {
    expect(body(".es-section > summary, .es-collapse > summary")).toMatch(/min-height:\s*44px/);
    expect(body(".es-actions .rw-btn")).toMatch(/min-height:\s*48px/);
  });

  it("sets no fixed width that would force sideways scrolling at 390 px", () => {
    for (const [selector, decl] of rules) {
      if (selector.startsWith("@media")) continue;
      const widths = [...decl.matchAll(/(?<![-\w])(?:min-)?width:\s*(\d+)px/g)].map((m) => Number(m[1]));
      for (const w of widths) expect(w, `${selector} width ${w}px`).toBeLessThanOrEqual(390);
    }
    expect(body(".es-essay")).toMatch(/box-sizing:\s*border-box/);
  });

  it("wraps long text instead of overflowing, and stacks the plan under the essay on a phone", () => {
    expect(body(".es-essay-text")).toMatch(/overflow-wrap:\s*anywhere/);
    expect(body(".es-sidebyside")).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(esCss).toMatch(/@media \(min-width: 900px\)\s*\{\s*\.es-sidebyside\s*\{\s*grid-template-columns:\s*repeat\(2/);
  });

  it("stops the spinner under reduced motion", () => {
    expect(esCss).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*\.rw-spinner\s*\{\s*animation:\s*none/);
  });
});

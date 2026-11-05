// @vitest-environment jsdom
//
// Accessibility of the paragraph unit (spec 007 FR-042): ordered lists with aria-current, verdicts
// that never rely on colour, a polite live status region, 44 px targets, reduced motion, no fixed
// widths that would force sideways scrolling at 390 px.

import fs from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EssayProgressBar, ParagraphStepTracker } from "@/components/paragraph/Frame";
import { CriterionPills, CriterionResults, ResultSummary } from "@/components/paragraph/Results";
import { MarkingStatus } from "@/components/rewrite/MarkingStatus";

afterEach(cleanup);

const css = fs.readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");
const pgCss = css.slice(css.indexOf("Paragraph writing (spec 007)"));
const rule = (selector: string): string => {
  const i = pgCss.indexOf(`${selector} {`);
  return i < 0 ? "" : pgCss.slice(i, pgCss.indexOf("}", i));
};
const rwRule = (selector: string): string => {
  const i = css.indexOf(`${selector} {`);
  return i < 0 ? "" : css.slice(i, css.indexOf("}", i));
};

const criteria = [
  { key: "a" as const, met: true, reason: "ok" },
  { key: "b" as const, met: false, reason: "no" },
  { key: "c" as const, met: true, reason: "ok" },
  { key: "d" as const, met: false, reason: "no" },
];

describe("structure", () => {
  it("the essay progress bar is a labelled ordered list with the current part marked", () => {
    render(
      <EssayProgressBar
        essayNo={3}
        part={3}
        parts={[
          { part: 1, short: "Topic", state: "done" }, { part: 2, short: "Mechanism", state: "done" },
          { part: 3, short: "Evidence", state: "current" }, { part: 4, short: "Evaluation", state: "later" },
          { part: 5, short: "Link", state: "later" },
        ]}
      />,
    );
    const list = screen.getByLabelText("Essay 3 progress: part 3 of 5");
    expect(list.tagName).toBe("OL");
    expect(list.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
    expect(list.querySelector('[aria-current="step"]')!.textContent).toBe("Evidence");
  });

  it("the step tracker is a labelled list with exactly one current step", () => {
    render(<ParagraphStepTracker step="correct" phase1Mark={2} />);
    const list = screen.getByLabelText("Steps");
    expect(list.tagName).toBe("OL");
    expect(list.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
    expect(screen.getByText("Write · 2/4")).toBeTruthy();
  });

  it("marking progress is a polite live status region", () => {
    render(<MarkingStatus steps={[{ label: "Read your writing", state: "done" }, { label: "Checking…", state: "active" }, { label: "Writing your feedback", state: "pending" }]} announced="Checking…" />);
    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-live")).toBe("polite");
  });
});

describe("verdicts and statuses are never colour alone", () => {
  it("every verdict icon has a text name, and the pills carry text", () => {
    render(
      <>
        <CriterionResults partNo={3} phase={{ text: "t", mark: 2, criteria, feedback: "f", wordCount: 1 }} />
        <CriterionPills partNo={3} phase1={{ text: "t", mark: 2, criteria, feedback: "f", wordCount: 1 }} phase2={{ text: "t2", mark: 3, criteria: criteria.map((c) => ({ ...c, met: true })), feedback: "g", wordCount: 1 }} heading="Your correction, criterion by criterion" />
      </>,
    );
    expect(screen.getAllByRole("img", { name: "Met" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("img", { name: "Not met" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("First try")).toHaveLength(2);
    expect(screen.getAllByText("Fixed in correction")).toHaveLength(2);
  });

  it("the result summary is focusable by script and says the mark in words", () => {
    render(<ResultSummary ending="full_marks" recorded={4} phase1={{ text: "t", mark: 4, criteria, feedback: "f", wordCount: 1 }} />);
    const el = document.querySelector(".rw-summary") as HTMLElement;
    expect(el.getAttribute("tabindex")).toBe("-1");
    expect(el.textContent).toContain("4 / 4 marks");
  });

  it("the verb highlight is bold as well as tinted", () => {
    expect(rule(".pg-verb")).toMatch(/font-weight:\s*600/);
  });
});

describe("targets, motion and width (read from the stylesheet)", () => {
  it("interactive rows are at least 44 px tall and buttons 48 px", () => {
    expect(rule(".pg-collapse > summary")).toMatch(/min-height:\s*44px/);
    expect(rule(".pg-flag-btn")).toMatch(/min-height:\s*44px/);
    expect(rule(".pg-tick")).toMatch(/min-height:\s*44px/);
    expect(rule(".pg-criteria-pills > li")).toMatch(/min-height:\s*44px/);
    expect(rwRule(".rw-btn")).toMatch(/height:\s*48px/);
  });

  it("animations stop under prefers-reduced-motion", () => {
    expect(pgCss).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.pg-card \*[^}]*animation:\s*none/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.rw-progress-fill\s*\{\s*animation:\s*none/);
  });

  it("no pg-* rule sets a fixed width beyond the phone width, and the brief stacks on phones", () => {
    const widths = [...pgCss.matchAll(/(?<![-\w])width:\s*(\d+)px/g)].map((m) => Number(m[1]));
    expect(widths.filter((w) => w > 390)).toEqual([]);
    expect(pgCss).toMatch(/@media \(max-width: 560px\)\s*\{[^}]*\.pg-brief-row\s*\{\s*grid-template-columns:\s*1fr/);
  });

  it("long words wrap in the text blocks", () => {
    expect(rule(".pg-brief-value")).toMatch(/overflow-wrap:\s*anywhere/);
    expect(rule(".pg-bar-label")).toMatch(/overflow-wrap:\s*anywhere/);
  });
});

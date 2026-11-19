// @vitest-environment jsdom
//
// Accessibility of the unseen-text unit (spec 008 FR-047, research R14): verdicts that never rely on
// colour, status messages in polite live regions, result and notice targets that can take focus, the
// dialogs, 44 px targets, reduced motion, and no fixed width that would force sideways scrolling at
// 390 px.

import fs from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MarkingStatus } from "@/components/rewrite/MarkingStatus";
import { ResultCard, SkillList } from "@/components/unseen/Results";
import { MarkingFooter, NotMarkedNotice } from "@/components/unseen/Writing";
import { SKILL_IDS } from "@/lib/unseen/skills";

afterEach(cleanup);

const css = fs.readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");
const unCss = css.slice(css.indexOf(".un-card {")).replace(/\/\*[\s\S]*?\*\//g, "");
/** Every `selector { … }` rule in the un-* block, as [selector, body]. */
const rules = [...unCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]] as const);

const skills = SKILL_IDS.map((id, i) => ({ id, met: i % 2 === 0, reason: `reason ${i}` }));

describe("verdicts and results", () => {
  it("each skill says Met or Missed in words, not only by colour or icon", () => {
    render(<SkillList skills={skills} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(7);
    expect(items[0].textContent).toContain("Met");
    expect(items[1].textContent).toContain("Missed");
  });

  it("the result card is a labelled section whose summary can take focus", () => {
    render(<ResultCard label="First try" result={{ mark: 2, feedback: "f", biggestGap: "g", skills }} maxMarks={3} />);
    const heading = screen.getByRole("heading", { name: "2 / 3 marks" });
    expect(screen.getByRole("region", { name: "2 / 3 marks" })).toBeTruthy();
    expect(heading.parentElement!.getAttribute("tabindex")).toBe("-1");
  });
});

describe("status messages", () => {
  it("the not-marked notice is a polite status and can take focus", () => {
    render(<NotMarkedNotice reason="marker_unavailable" />);
    const notice = screen.getByRole("status");
    expect(notice.getAttribute("tabindex")).toBe("-1");
    expect(notice.textContent).not.toMatch(/error|fail/i);
  });

  it("the daily-limit notice says to come back tomorrow, in a status region", () => {
    render(<NotMarkedNotice reason="daily_limit" resetsAt="2026-11-20T00:00:00+11:00" />);
    expect(screen.getByRole("status").textContent).toContain("Come back tomorrow");
  });

  it("the marking footer is not an interactive control while marking: its button is disabled", () => {
    render(<MarkingFooter note="Marking your answer" />);
    expect((screen.getByRole("button", { name: /Marking/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("the marking steps sit in a polite live region that announces a step once", () => {
    const steps = [{ label: "Sent", state: "done" as const }, { label: "Marking", state: "active" as const }];
    const { container, rerender } = render(<MarkingStatus steps={steps} announced="Marking" />);
    const live = container.querySelector("[aria-live]");
    expect(live?.getAttribute("aria-live")).toBe("polite");
    const before = live!.textContent;
    rerender(<MarkingStatus steps={steps} announced="Marking" />);
    expect(container.querySelector("[aria-live]")!.textContent).toBe(before);
  });
});

describe("styles", () => {
  const body = (selector: string): string => rules.find(([s]) => s === selector)?.[1] ?? "";

  it("the buttons and summary rows have a 44 px target", () => {
    expect(body(".un-btn-secondary")).toMatch(/min-height:\s*44px/);
    expect(body(".un-collapse > summary")).toMatch(/min-height:\s*44px/);
    expect(body(".un-form-row")).toMatch(/min-height:\s*44px/);
  });

  it("has no two-column card layout, sticky text column or rule that hides the Text button", () => {
    expect(css).not.toMatch(/\.un-layout|\.un-text-col|\.un-textbtn/);
    expect(body(".un-poem")).toMatch(/max-width:\s*68ch/);
    expect(body(".un-prose")).toMatch(/max-width:\s*68ch/);
    expect(body(".un-image")).toMatch(/width:\s*100%/);
  });

  it("the Make it even stronger panel has a 4px success border, a success tint and success-700 heading text, no warning colours", () => {
    const panel = body(".un-go-further");
    expect(panel).toMatch(/border-left:\s*4px solid var\(--rd-success-500\)/);
    expect(panel).toMatch(/background:\s*var\(--rd-success-50\)/);
    expect(body(".un-go-further .un-go-further-label")).toMatch(/color:\s*var\(--rd-success-700\)/);
    expect(body(".un-go-further p")).toMatch(/color:\s*var\(--rd-ink-900\)/);
    expect(rules.filter(([s]) => s.includes("un-go-further")).map(([, d]) => d).join(" ")).not.toMatch(/warn|danger/);
  });

  it("reduced motion switches off animation and transitions in the unit", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.un-card \*, \.un-dialog \*\s*\{\s*animation: none !important;\s*transition: none !important;/);
  });

  it("no un-* rule fixes a width wider than a 390 px screen, outside min() or a media query", () => {
    const fixed = rules.flatMap(([selector, decls]) =>
      [...decls.matchAll(/(?:^|[;\s])(?:min-)?width:\s*(\d+)px/g)].filter((m) => Number(m[1]) > 360).map(() => selector),
    );
    expect(fixed).toEqual([]);
  });

  it("the unit never sets text to mute-500 or warn-500 (below 4.5:1 on tinted panels)", () => {
    const lines = unCss.split("\n").filter((l) => /[^-]color:\s*var\(--rd-(mute-500|warn-500)\)/.test(l));
    expect(lines).toEqual([]);
  });
});

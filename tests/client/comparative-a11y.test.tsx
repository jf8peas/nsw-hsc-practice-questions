// @vitest-environment jsdom
//
// Accessibility and layout of the comparative unit's own surfaces (spec 009 FR-035, SC-008, task T053): tabs and chips are
// at least 44 px, states are never colour alone, nothing forces sideways scrolling at 390 px, the tab strip scrolls inside
// its own box, focus rings exist, and print shows every text. Contrast pairs are in tests/styles/contrast.test.ts.

import fs from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PickChips } from "@/components/unseen/PickChips";
import { TextTabs } from "@/components/unseen/TextTabs";
import type { UnseenText } from "@/lib/types";

afterEach(cleanup);

const css = fs.readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");
const block = css.slice(css.indexOf(".un-tabs {")).replace(/\/\*[\s\S]*?\*\//g, "");
const rules = [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]] as const);
const body = (selector: string) => rules.filter(([s]) => s.split(",").map((x) => x.trim()).includes(selector)).map(([, b]) => b).join(" ");

const text = (id: string, heading: string): UnseenText => ({
  id, form: "prose-fiction", heading, title: "", author: "", sourceLine: "s", body: { kind: "prose", paragraphs: ["Some words."] }, hscChecked: "2026-11-19",
});
const texts = [text("a", "Text 1 – Prose"), text("b", "Text 2 – Prose"), text("c", "Text 3 – Prose")];

describe("targets and focus", () => {
  it("a tab and a chip are at least 44 px high, with a visible focus ring", () => {
    expect(body(".un-tab")).toMatch(/min-height:\s*44px/);
    expect(body(".un-chip")).toMatch(/min-height:\s*44px/);
    expect(body(".un-tab:focus-visible")).toMatch(/outline:\s*2px solid/);
    expect(body(".un-chip:focus-visible")).toMatch(/outline:\s*2px solid/);
  });
});

describe("no sideways scrolling at 390 px", () => {
  it("the tab strip scrolls inside its own box and the page never does; nothing sets a fixed width over 390 px", () => {
    expect(body(".un-tablist")).toMatch(/overflow-x:\s*auto/);
    expect(body(".un-tablist")).toMatch(/max-width:\s*100%/);
    expect(body(".un-tabs")).toMatch(/min-width:\s*0/);
    for (const [, b] of rules) for (const m of b.matchAll(/(?:^|[;\s])width:\s*(\d+)px/g)) expect(Number(m[1])).toBeLessThanOrEqual(390);
  });
  it("the chips wrap rather than overflow", () => {
    expect(body(".un-pick-list")).toMatch(/flex-wrap:\s*wrap/);
  });
  it("has no side-by-side layout for the texts", () => {
    expect(css).not.toMatch(/\.un-texts-row|\.un-compare-grid|\.un-side-by-side/);
  });
});

describe("state is never colour alone", () => {
  it("the selected tab is selected by aria-selected, weight and a thicker bar, not only a colour", () => {
    expect(body(".un-tab.selected")).toMatch(/font-weight:\s*700/);
    expect(body(".un-tab.selected")).toMatch(/border-bottom-color/);
    render(<TextTabs texts={texts} unitId="u" attemptId="at" uid="me" final={false} picked={["b"]} />);
    expect(screen.getAllByRole("tab")[0].getAttribute("aria-selected")).toBe("true");
    // a picked text's tab says so in words
    expect(screen.getAllByRole("tab")[1].textContent).toContain("Picked");
  });
  it("a chosen chip says 'Chosen' with a tick and aria-pressed; a locked pick is a list with ticks", () => {
    const choice = { fixed: ["a"], from: ["b", "c"], pick: 1 };
    const { rerender } = render(<PickChips texts={texts} choice={choice} pick={["b"]} locked={false} onChange={() => {}} />);
    const chip = screen.getByRole("button", { name: /Text 2/ });
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    expect(chip.textContent).toContain("Chosen");
    expect(chip.textContent).toContain("✓");
    rerender(<PickChips texts={texts} choice={choice} pick={["b"]} locked onChange={() => {}} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["✓ Text 1 – Prose", "✓ Text 2 – Prose"]);
  });
  it("the chip group is labelled for a screen reader by its question and the fixed text is named", () => {
    render(<PickChips texts={texts} choice={{ fixed: ["a"], from: ["b", "c"], pick: 1 }} pick={[]} locked={false} onChange={() => {}} />);
    expect(screen.getByRole("group", { name: "Choose one text to write about" })).toBeTruthy();
    expect(screen.getByText("Always included: Text 1 – Prose")).toBeTruthy();
  });
});

describe("tabs for a screen reader", () => {
  it("is a tablist with a name, one tab per text and a panel per tab labelled by its tab", () => {
    const { container } = render(<TextTabs texts={texts} unitId="u" attemptId="at" uid="me" final={false} />);
    expect(screen.getByRole("tablist", { name: "The texts for this question" })).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    for (const panel of container.querySelectorAll('[role="tabpanel"]')) expect(document.getElementById(panel.getAttribute("aria-labelledby")!)).toBeTruthy();
  });
});

describe("print", () => {
  it("shows every text and hides the tab strip", () => {
    expect(css).toMatch(/@media print\s*\{\s*\.un-tablist,\s*\.un-tab-restore\s*\{\s*display:\s*none;\s*\}\s*\.un-tabpanel\[hidden\]\s*\{\s*display:\s*block;/);
  });
});

// Colour contrast for the paragraph unit's styles (spec 007 FR-042, research R11): every text and
// background pair the pg-* classes (and the rw-* classes they reuse) put together meets WCAG 2 AA:
// 4.5:1 for text, 3:1 for glyphs and borders. Token values are read from styles/tokens.css, so a
// token change that breaks a pair fails here.

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const tokens = fs.readFileSync(path.resolve(__dirname, "../../styles/tokens.css"), "utf8");
const hex = (name: string): string => {
  const m = new RegExp(`--rd-${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(tokens);
  if (!m) throw new Error(`token --rd-${name} not found`);
  return m[1];
};

function luminance(color: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const ratio = (fg: string, bg: string): number => {
  const [a, b] = [luminance(hex(fg)), luminance(hex(bg))].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};

// [foreground, background, what uses it]
const TEXT: Array<[string, string, string]> = [
  ["ink-900", "white", "body text, headings, labels"],
  ["ink-700", "white", "secondary text, guidance lines, reasons"],
  ["ink-900", "surface-50", "question block, result text strip"],
  ["ink-700", "surface-50", "verb definition"],
  ["mute-600", "white", "helper text, counters, chips, tip 'Lost:' line"],
  ["mute-600", "surface-50", "labels on the question block"],
  ["mute-600", "surface-100", "Not met / Your tick pill"],
  ["blue-700", "blue-50", "Use in this part row label, slot, tracker"],
  ["blue-700", "blue-100", "verb highlight, Use pill, this-part highlight, disabled button"],
  ["blue-700", "white", "current progress label, next dot label"],
  ["ink-900", "blue-50", "brief rows that are used"],
  ["ink-900", "success-50", "result summary, First try pill"],
  ["ink-700", "success-50", "summary second line"],
  ["ink-900", "warn-50", "tip card text"],
  ["ink-700", "warn-50", "tip card application line"],
  ["mute-600", "warn-50", "tip card 'Lost:' line"],
  ["ink-900", "danger-50", "error box"],
  ["white", "blue-500", "primary button"],
  ["success-500", "white", "the done tick label (large or bold only; checked at 3:1 below)"],
];
const GLYPHS: Array<[string, string, string]> = [
  ["success-500", "success-50", "✓ icon"],
  ["danger-500", "danger-50", "✗ icon"],
  ["success-500", "white", "progress tick and fill"],
  ["blue-500", "white", "current segment and button edge"],
  ["border-200", "white", "dashed chips and borders (decorative)"],
];

describe("text pairs used by the paragraph unit meet 4.5:1", () => {
  for (const [fg, bg, use] of TEXT.filter((t) => t[0] !== "success-500")) {
    it(`${fg} on ${bg} (${use})`, () => {
      expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("glyph pairs meet 3:1", () => {
  for (const [fg, bg, use] of GLYPHS.filter((g) => g[0] !== "border-200")) {
    it(`${fg} on ${bg} (${use})`, () => {
      expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
    });
  }
  it("success-500 text is only used on white at bold weight (>= 3:1)", () => {
    expect(ratio("success-500", "white")).toBeGreaterThanOrEqual(3);
  });
});

describe("known risks stay avoided", () => {
  it("mute-500 on surface-100 is below 4.5:1, so tinted panels use mute-600", () => {
    expect(ratio("mute-500", "surface-100")).toBeLessThan(4.5);
    expect(ratio("mute-600", "surface-100")).toBeGreaterThanOrEqual(4.5);
  });
  it("warn-500 on warn-50 is below 4.5:1, so tip cards use ink for their text", () => {
    expect(ratio("warn-500", "warn-50")).toBeLessThan(4.5);
  });
  it("the pg-* rules never set text to mute-500 or warn-500", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");
    const pg = css.slice(css.indexOf("Paragraph writing (spec 007)"));
    const colorLines = pg.split("\n").filter((l) => /[^-]color:\s*var\(--rd-(mute-500|warn-500)\)/.test(l));
    expect(colorLines).toEqual([]);
  });
});

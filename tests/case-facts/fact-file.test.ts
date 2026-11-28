// The fact-file parser (spec 012, research §7, data-model §9): the fact file is the only list of facts, ★ flags and
// impact lines, so a format change must be noticed.

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseFactFile } from "@/lib/case-facts/fact-file";

const SMALL = `# Invented facts

| ID | ★ | Fact | When | Exams | Source |
|---|---|---|---|---|---|
| X99 |  | not a fact row | - | - | - |

## China (invented)

### A. First section

| ID | ★ | Fact | When | Exams | Source |
|---|---|---|---|---|---|
| C01 | ★ | Widgets exported: 12.5 bn | 1990 | 1 | [S1] |
| C02 |  | Widgets imported | 2001 | 1 | [S1] [S2] |

## Nepal (invented)

### B. Second section

| ID | ★ | Fact | When | Exams | Source |
|---|---|---|---|---|---|
| N01 |  | Gadgets made | 2019–2020 | 2 | secondary (see notes) |

## China vs Nepal (comparison)

| Indicator | China | Nepal | Source |
|---|---|---|---|
| Widgets | 12.5 bn | - | [S1] |

## Context and impact

One line per fact. The Zanzibar paragraph is not a line.

- **C01** Showed that widgets matter.
- **C02** Showed that buying widgets matters too.
- **N01** Showed that gadgets matter.

## Sources

- **S1** An invented source.
- **S2** Another invented source.
`;

describe("parseFactFile", () => {
  const parsed = parseFactFile(SMALL);

  it("reads the fact rows with their flags, columns, source numbers and groups", () => {
    expect([...parsed.facts.keys()]).toEqual(["C01", "C02", "N01"]);
    expect(parsed.facts.get("C01")).toEqual({
      id: "C01",
      star: true,
      statement: "Widgets exported: 12.5 bn",
      when: "1990",
      source: "[S1]",
      sourceNumbers: ["S1"],
      group: "china-a",
    });
    expect(parsed.facts.get("C02")!.star).toBe(false);
    expect(parsed.facts.get("C02")!.sourceNumbers).toEqual(["S1", "S2"]);
    expect(parsed.facts.get("N01")!.group).toBe("nepal-b");
    expect(parsed.facts.get("N01")!.sourceNumbers).toEqual([]);
    expect(parsed.groups).toEqual(["china-a", "nepal-b"]);
    expect([...parsed.sources]).toEqual(["S1", "S2"]);
  });

  it("maps each ID to its impact line and leaves the section out of the text", () => {
    expect([...parsed.impact]).toEqual([
      ["C01", "Showed that widgets matter."],
      ["C02", "Showed that buying widgets matters too."],
      ["N01", "Showed that gadgets matter."],
    ]);
    expect(parsed.text).not.toContain("Context and impact");
    expect(parsed.text).not.toContain("Zanzibar");
    expect(parsed.text).not.toContain("gadgets matter");
    expect(parsed.text).toContain("Widgets exported");
    expect(parsed.text).toContain("## Sources");
  });

  it("reads CRLF line endings the same way", () => {
    expect(parseFactFile(SMALL.replace(/\n/g, "\r\n"))).toEqual(parsed);
  });

  const broken = (from: string, to: string) => () => parseFactFile(SMALL.replace(from, to));

  it("throws on a fact row without six cells, a duplicate id, a row outside a section and an empty file", () => {
    expect(broken("| C02 |  | Widgets imported | 2001 | 1 | [S1] [S2] |", "| C02 |  | Widgets imported | 2001 | [S1] |")).toThrow(/C02/);
    expect(broken("| C02 |  |", "| C01 |  |")).toThrow(/C01/);
    expect(broken("### B. Second section", "Second section")).toThrow(/N01/);
    expect(() => parseFactFile("# Nothing here\n")).toThrow(/no fact/i);
  });

  it("throws, naming the ID, on a broken impact section", () => {
    expect(broken("- **N01** Showed that gadgets matter.\n", "")).toThrow(/N01/);
    expect(broken("- **N01** Showed that gadgets matter.", "- **N01**")).toThrow(/N01/);
    expect(broken("- **N01** Showed", "- **N01** Showed again.\n- **N01** Showed")).toThrow(/N01/);
    expect(broken("- **N01** Showed", "- **N07** Showed an unknown fact.\n- **N01** Showed")).toThrow(/N07/);
    expect(broken("gadgets matter.", "gadgets matter in 2001.")).toThrow(/N01/);
  });

  it("reads the shipped fact file: 57 facts, 36 starred, 11 groups, 31 sources and 57 impact lines", () => {
    const file = fs.readFileSync(path.resolve(__dirname, "../../docs/y12-economics-case-study-facts-research.md"), "utf8");
    const real = parseFactFile(file);
    expect(real.facts.size).toBe(57);
    expect([...real.facts.values()].filter((f) => f.star)).toHaveLength(36);
    expect(real.groups).toHaveLength(11);
    expect(real.sources.size).toBe(31);
    expect(real.impact.size).toBe(57);
    expect(real.facts.get("C25")!.sourceNumbers).toEqual([]);
  });
});

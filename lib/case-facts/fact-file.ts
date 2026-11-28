// The parser of the case-study fact file (spec 012, research §7, data-model §9). The markdown file is the only list of
// facts, ★ flags and impact lines, so the validator and the check script read it directly. A plain module: no I/O.
//
// An impact line is interpretation, never data: `text` (the file as a source of values and names) leaves the whole
// "Context and impact" section out.

export interface Fact {
  id: string;
  star: boolean;
  statement: string;
  when: string;
  /** The Source cell as written. */
  source: string;
  /** "S8" and so on; empty for a secondary source with no number. */
  sourceNumbers: string[];
  /** "china-a" to "nepal-e". */
  group: string;
}

export interface FactFile {
  facts: Map<string, Fact>;
  /** The lettered sections, in file order. */
  groups: string[];
  /** The numbers listed under "Sources". */
  sources: Set<string>;
  /** Fact ID to its context-and-impact line. */
  impact: Map<string, string>;
  /** The file without the "Context and impact" section. */
  text: string;
}

const FACT_ROW = /^\|\s*([CN]\d{2})\s*\|/;
const SOURCE_LINE = /^- \*\*(S\d+)\*\*/;
const IMPACT_LINE = /^- \*\*([^*]+)\*\*\s*(.*)$/;
const IMPACT_HEADING = /^## Context and impact\s*$/;

export function parseFactFile(markdown: string): FactFile {
  const facts = new Map<string, Fact>();
  const groups: string[] = [];
  const sources = new Set<string>();
  const impact = new Map<string, string>();
  const kept: string[] = [];

  let economy: "china" | "nepal" | undefined;
  let section: string | undefined;
  let inImpact = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith("## ")) {
      economy = line.startsWith("## China (") ? "china" : line.startsWith("## Nepal (") ? "nepal" : undefined;
      section = undefined;
      inImpact = IMPACT_HEADING.test(line);
    }

    if (inImpact) {
      const match = IMPACT_LINE.exec(line);
      if (match) {
        const id = match[1].trim();
        const words = match[2].trim();
        if (impact.has(id)) throw new Error(`${id}: more than one impact line in the fact file`);
        if (/\d/.test(words)) throw new Error(`${id}: its impact line contains a digit (impact lines hold no figures)`);
        impact.set(id, words);
      }
      continue;
    }
    kept.push(line);

    const heading = /^### ([A-Z])\. /.exec(line);
    if (heading && economy) {
      section = heading[1].toLowerCase();
      groups.push(`${economy}-${section}`);
      continue;
    }

    const source = SOURCE_LINE.exec(line);
    if (source) sources.add(source[1]);

    const row = FACT_ROW.exec(line);
    if (!row) continue;
    const id = row[1];
    const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    if (cells.length !== 6) throw new Error(`${id}: the fact row has ${cells.length} cells, not 6`);
    if (facts.has(id)) throw new Error(`${id}: listed twice in the fact file`);
    if (!economy || !section) throw new Error(`${id}: the fact row is not inside a lettered China or Nepal section`);
    const [, star, statement, when, , sourceCell] = cells;
    facts.set(id, {
      id,
      star: star.includes("★"),
      statement,
      when,
      source: sourceCell,
      sourceNumbers: sourceCell.match(/S\d+/g) ?? [],
      group: `${economy}-${section}`,
    });
  }

  if (facts.size === 0) throw new Error("The fact file has no fact rows");
  for (const id of impact.keys()) {
    if (!facts.has(id)) throw new Error(`${id}: has an impact line but no fact row`);
  }
  for (const id of facts.keys()) {
    if (!impact.get(id)) throw new Error(`${id}: has no impact line in the fact file`);
  }

  return { facts, groups, sources, impact, text: kept.join("\n") };
}

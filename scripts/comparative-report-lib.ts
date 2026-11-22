// The pure half of the comparative bank review report (spec 009 FR-032, research R12, task T056): per paper what was kept
// and skipped and why, counts by mark value and by fixed pair or choice, the rubric source per question, the pairing of each
// choice question, any text in the shared store that no question of either unit uses, and the medians counted for 7 and 8
// marks (which MEDIAN_WORDS must match before a median-fallback 7 or 8 mark question can ship). No I/O.

import { MEDIAN_WORDS } from "../lib/unseen/limits";
import { SKIP_REASONS, type InventoryFile } from "./unseen-report-lib";

export interface ComparativeInventoryFile extends Omit<InventoryFile, "questions"> {
  questions: Array<InventoryFile["questions"][number] & { choice?: { fixed: string[]; from: string[]; pick: number } }>;
}

export interface ComparativeReportQuestion {
  id: string;
  paperShort: string;
  paperYear: number;
  qNo: number;
  maxMarks: number;
  kind: "fixed" | "choice";
  /** Headings (or ids) of the texts shown. */
  texts: string[];
  /** For a choice question: the texts the model answer uses. */
  pairing: string[];
  suggestedWords: number;
  suggestedFrom: "lines" | "median";
  modelOrigin: "school" | "drafted";
  criteriaOrigin: "school" | "drafted";
  reviewedOn?: string;
}

export interface ComparativeReportInput {
  inventories: ComparativeInventoryFile[];
  questions: ComparativeReportQuestion[];
  /** Ids of texts in the shared store that no question of either unit shows. */
  unusedTexts: string[];
  promptVersion: string;
  today: string;
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/** The median of the counted (answer lines) suggested lengths per mark value, among this unit's questions. */
export function countedMedians(questions: ComparativeReportQuestion[]): Map<number, { median: number; n: number }> {
  const byMarks = new Map<number, number[]>();
  for (const q of questions.filter((x) => x.suggestedFrom === "lines")) byMarks.set(q.maxMarks, [...(byMarks.get(q.maxMarks) ?? []), q.suggestedWords]);
  return new Map([...byMarks].map(([marks, words]) => [marks, { median: median(words), n: words.length }]));
}

/**
 * The medians this unit counts for 7 and 8 marks (spec 009 FR-011) must equal MEDIAN_WORDS once they are in it, and a
 * question that falls back to a median for a mark value with no median in the table cannot ship (validation refuses it).
 * Marks 3 to 6 use spec 008's table, counted over its own papers, so they are not checked here.
 */
export function comparativeMedianProblems(questions: ComparativeReportQuestion[]): string[] {
  const out: string[] = [];
  const counted = countedMedians(questions);
  for (const marks of [7, 8]) {
    const c = counted.get(marks);
    if (c && MEDIAN_WORDS[marks] !== c.median) {
      out.push(`${marks}-mark median from ${c.n} counted question(s) is ${c.median} words, but MEDIAN_WORDS[${marks}] is ${MEDIAN_WORDS[marks] ?? "missing"}: add or correct it in lib/unseen/limits.ts`);
    }
  }
  for (const q of questions.filter((x) => x.suggestedFrom === "median")) {
    if (MEDIAN_WORDS[q.maxMarks] === undefined) out.push(`${q.id}: its answer lines cannot be counted and there is no median for ${q.maxMarks} marks yet`);
  }
  return out;
}

const count = <T,>(xs: T[], key: (x: T) => string | number): Array<[string, number]> => {
  const m = new Map<string, number>();
  for (const x of xs) m.set(String(key(x)), (m.get(String(key(x))) ?? 0) + 1);
  return [...m].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
};

const source = (q: ComparativeReportQuestion): string => {
  const model = q.modelOrigin === "school" ? "school" : q.reviewedOn ? `drafted, reviewed ${q.reviewedOn}` : "drafted, NOT reviewed";
  return `model ${model}; criteria ${q.criteriaOrigin === "school" ? "school" : "drafted"}`;
};

export function buildComparativeReport(input: ComparativeReportInput): { markdown: string; problems: string[] } {
  const { inventories, questions } = input;
  const lines: string[] = [
    "# Comparative texts bank: review report",
    "",
    `Generated ${input.today} · comparative marker prompt ${input.promptVersion}. Approve each section by ticking its box.`,
    "",
    "## Papers",
    "",
  ];
  const sorted = [...inventories].sort((a, b) => `${a.paper.short}${a.paper.year}`.localeCompare(`${b.paper.short}${b.paper.year}`));
  let kept = 0;
  let skipped = 0;
  let listed = 0;
  for (const inv of sorted) {
    // a comparative question is a Section I question that refers to two or more texts, whatever its number
    const multi = inv.questions.filter((q) => q.texts.length > 1 || q.reason === "two_or_more_texts" || q.choice !== undefined);
    if (multi.length === 0) continue;
    const k = multi.filter((q) => q.decision === "kept");
    const s = multi.filter((q) => q.decision === "skipped");
    kept += k.length;
    skipped += s.length;
    listed += 1;
    lines.push(`### ${inv.paper.short} ${inv.paper.year} — ${k.length} kept, ${s.length} skipped`, "", "- [ ] Approved", "");
    for (const q of k) lines.push(`- Q${q.qNo} (${q.marks} marks, ${q.choice ? "choice" : "fixed pair"}; ${q.forms.join(" + ") || "forms not recorded"}): kept`);
    for (const q of s) lines.push(`- Q${q.qNo} (${q.marks} marks, ${q.choice ? "choice" : "fixed pair"}): skipped — ${q.reason ?? "no reason recorded"}`);
    lines.push("");
  }
  lines.push(`Total: ${kept} kept, ${skipped} skipped across ${listed} paper(s).`, "");
  lines.push("## Counts", "", "### By mark value", "", ...count(questions, (q) => q.maxMarks).map(([k, n]) => `- ${k} marks: ${n}`), "");
  lines.push("### By question type", "", ...count(questions, (q) => (q.kind === "fixed" ? "fixed pair" : "choice")).map(([k, n]) => `- ${k}: ${n}`), "");
  lines.push("### Suggested length", "");
  for (const [marks, c] of [...countedMedians(questions)].sort((a, b) => a[0] - b[0])) lines.push(`- ${marks} marks: median ${c.median} words from ${c.n} counted question(s)`);
  lines.push("", "## Rubric source per question", "", "- [ ] Approved", "");
  for (const q of [...questions].sort((a, b) => a.id.localeCompare(b.id))) {
    lines.push(`- ${q.id}: ${source(q)}`);
    if (q.kind === "choice") lines.push(`  - the model answer's pairing: ${q.pairing.join(" and ") || "none recorded"} (one possible pairing; any allowed pairing earns full marks)`);
  }
  lines.push("", "## Texts in the shared store used by no question", "");
  lines.push(...(input.unusedTexts.length ? input.unusedTexts.map((id) => `- ${id}`) : ["- none"]), "");

  const problems = comparativeMedianProblems(questions);
  for (const i of inventories) {
    for (const q of i.questions) {
      if (q.decision === "skipped" && !(SKIP_REASONS as readonly string[]).includes(q.reason ?? "")) {
        problems.push(`${i.paper.short} ${i.paper.year} Q${q.qNo}: skip reason "${q.reason ?? ""}" is not in the fixed list`);
      }
    }
  }
  if (problems.length) lines.push("## Problems", "", ...problems.map((p) => `- ✗ ${p}`), "");
  return { markdown: lines.join("\n"), problems };
}

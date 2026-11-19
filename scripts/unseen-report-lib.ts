// The pure half of the bank review report (spec 008, research R2 / R-008): per paper what was kept
// and skipped and why, counts by text form and mark value, the rubric source per question, the images
// folder size, and the check that MEDIAN_WORDS still matches the counted papers. No I/O.

import { MEDIAN_WORDS } from "../lib/unseen/limits";

export const SKIP_REASONS = [
  "two_or_more_texts",
  "not_q1_to_q4",
  "text_illegible",
  "text_missing",
  "hsc_text",
  "visual_not_describable",
  "scan_needs_ocr",
  "reserved_holdout",
] as const;

export interface InventoryFile {
  paper: { school?: string; short: string; year: number; exam?: string };
  questions: Array<{ qNo: number; marks: number; texts: string[]; forms: string[]; decision: "kept" | "skipped"; reason?: string }>;
}

export interface ReportQuestion {
  id: string;
  paperShort: string;
  paperYear: number;
  qNo: number;
  maxMarks: number;
  form: string;
  suggestedWords: number;
  suggestedFrom: "lines" | "median";
  modelOrigin: "school" | "drafted";
  criteriaOrigin: "school" | "drafted";
  reviewedOn?: string;
}

export interface ReportInput {
  inventories: InventoryFile[];
  questions: ReportQuestion[];
  imagesBytes: number;
  promptVersion: string;
  today: string;
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/** Mark values with counted data whose median differs from MEDIAN_WORDS. Values with no data are not checked. */
export function medianProblems(questions: ReportQuestion[]): string[] {
  const out: string[] = [];
  const byMarks = new Map<number, number[]>();
  for (const q of questions.filter((x) => x.suggestedFrom === "lines")) {
    byMarks.set(q.maxMarks, [...(byMarks.get(q.maxMarks) ?? []), q.suggestedWords]);
  }
  for (const [marks, words] of [...byMarks].sort((a, b) => a[0] - b[0])) {
    const m = median(words);
    if (MEDIAN_WORDS[marks] !== m) {
      out.push(`${marks}-mark median from ${words.length} counted question(s) is ${m} words, but MEDIAN_WORDS[${marks}] is ${MEDIAN_WORDS[marks]}`);
    }
  }
  return out;
}

const count = <T,>(xs: T[], key: (x: T) => string | number): Array<[string, number]> => {
  const m = new Map<string, number>();
  for (const x of xs) m.set(String(key(x)), (m.get(String(key(x))) ?? 0) + 1);
  return [...m].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
};

const source = (q: ReportQuestion): string => {
  const model = q.modelOrigin === "school" ? "school" : q.reviewedOn ? `drafted, reviewed ${q.reviewedOn}` : "drafted, NOT reviewed";
  const criteria = q.criteriaOrigin === "school" ? "school" : "drafted";
  return `model ${model}; criteria ${criteria}`;
};

export function buildReport(input: ReportInput): { markdown: string; problems: string[] } {
  const { inventories, questions } = input;
  const lines: string[] = [
    "# Unseen-text bank: review report",
    "",
    `Generated ${input.today} · marker prompt ${input.promptVersion}. Approve each section by ticking its box.`,
    "",
    "## Papers",
    "",
  ];
  const sorted = [...inventories].sort((a, b) => `${a.paper.short}${a.paper.year}`.localeCompare(`${b.paper.short}${b.paper.year}`));
  for (const inv of sorted) {
    const kept = inv.questions.filter((q) => q.decision === "kept");
    const skipped = inv.questions.filter((q) => q.decision === "skipped");
    lines.push(`### ${inv.paper.short} ${inv.paper.year} — ${kept.length} kept, ${skipped.length} skipped`, "", "- [ ] Approved", "");
    for (const q of kept) lines.push(`- Q${q.qNo} (${q.marks} marks, ${q.forms.join(", ") || "form not recorded"}): kept`);
    for (const q of skipped) lines.push(`- Q${q.qNo} (${q.marks} marks): skipped — ${q.reason ?? "no reason recorded"}`);
    lines.push("");
  }
  lines.push("## Counts", "", "### By text form", "", ...count(questions, (q) => q.form).map(([k, n]) => `- ${k}: ${n}`), "");
  lines.push("### By mark value", "", ...count(questions, (q) => q.maxMarks).map(([k, n]) => `- ${k} marks: ${n}`), "");
  lines.push("## Rubric source per question", "", "- [ ] Approved", "");
  for (const q of [...questions].sort((a, b) => a.id.localeCompare(b.id))) lines.push(`- ${q.id}: ${source(q)}`);
  lines.push("", "## Images", "", `- folder size: ${(input.imagesBytes / 1024).toFixed(0)} KB`, "");

  const problems = medianProblems(questions);
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

// Traces every number, period and date in the case-facts unit to the fact file (spec 012 FR-032, research §8). A plain
// module: no I/O. It cannot judge direction, country or meaning: those are the maintainer's read.
//
// Strict fields (correct option, model answer, rubric, notes) must use the question's own fact rows. Loose fields
// (prompt, wrong options, explanations) may use anything in the file. Impact lines are never a source: only
// `factFile.text`, which leaves that section out, and the fact rows are read here.

import type { FactFile } from "@/lib/case-facts/fact-file";
import type { AnswerSet, Question, Unit } from "@/lib/types";

export type TraceStatus = "OK" | "ROUNDED" | "OTHER_ROW" | "UNTRACED";

export interface TraceFinding {
  questionId: string;
  where: string;
  value: string;
  status: TraceStatus;
  factIds: string[];
}

export interface TraceResult {
  findings: TraceFinding[];
  warnings: string[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_WORDS = [
  "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
  ...MONTHS.map((m) => m.toLowerCase()),
];

const DATE = /\b(\d{1,2}) (Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?) (\d{4})\b/g;
const PERIOD = /(?<![A-Za-z\d.])\d{4}[/-]\d{2}(?![\d])/g;
const NUMBER = /(?<![A-Za-z\d.])\d+(?:\.\d+)?/g;
const MAGNITUDE = /^ ?(bn|billion|million|trillion|m)\b/;

interface Token {
  kind: "date" | "period" | "number";
  value: string;
  magnitude?: string;
  at: number;
}

function normalise(text: string): string {
  return text
    .replace(/(?<=\d),(?=\d{3}(?!\d))/g, "")
    .replace(/\bFY(?=\d)/g, "")
    .replace(/–/g, "-")
    .replace(/\b\d+[- ]marks?\b/gi, " ");
}

/** The dates, periods and numbers of a text, in the order they appear. */
function tokens(text: string): Token[] {
  let rest = normalise(text);
  const out: Token[] = [];
  const take = (pattern: RegExp, read: (match: RegExpMatchArray) => Omit<Token, "at">) => {
    for (const match of [...rest.matchAll(pattern)]) {
      out.push({ ...read(match), at: match.index! });
    }
    rest = rest.replace(pattern, (s) => " ".repeat(s.length));
  };
  take(DATE, (m) => ({ kind: "date", value: `${Number(m[1])} ${m[2].slice(0, 3)} ${m[3]}` }));
  take(PERIOD, (m) => ({ kind: "period", value: m[0].replace("/", "-") }));
  take(NUMBER, (m) => {
    const word = MAGNITUDE.exec(m.input!.slice(m.index! + m[0].length))?.[1];
    const magnitude = word === "billion" ? "bn" : word === "m" ? "million" : word;
    return { kind: "number", value: m[0], ...(magnitude ? { magnitude } : {}) };
  });
  return out.sort((a, b) => a.at - b.at);
}

/** What a body of text vouches for. A date also vouches for its year. */
interface Values {
  dates: Set<string>;
  periods: Set<string>;
  numbers: Map<number, { text: string; magnitudes: Set<string> }>;
}

function valuesOf(texts: string[]): Values {
  const values: Values = { dates: new Set(), periods: new Set(), numbers: new Map() };
  const number = (text: string, magnitude?: string) => {
    const entry = values.numbers.get(Number(text)) ?? { text, magnitudes: new Set<string>() };
    entry.magnitudes.add(magnitude ?? "");
    values.numbers.set(Number(text), entry);
  };
  for (const t of texts.flatMap(tokens)) {
    if (t.kind === "date") {
      values.dates.add(t.value);
      number(t.value.slice(-4));
    } else if (t.kind === "period") values.periods.add(t.value);
    else number(t.value, t.magnitude);
  }
  return values;
}

const holds = (v: Values, t: Token) =>
  t.kind === "date" ? v.dates.has(t.value) : t.kind === "period" ? v.periods.has(t.value) : v.numbers.has(Number(t.value));

const isYear = (n: number) => Number.isInteger(n) && n >= 1900 && n <= 2100;

function significantFigures(text: string): number {
  const digits = text.replace(".", "").replace(/^0+/, "");
  return text.includes(".") ? digits.length : digits.replace(/0+$/, "").length;
}

/** Fewer significant figures than a row value and within 5% of it. Years are never rounded. */
function isRounding(v: Values, t: Token): boolean {
  if (t.kind !== "number") return false;
  const n = Number(t.value);
  if (isYear(n)) return false;
  return [...v.numbers].some(
    ([row, { text }]) =>
      !isYear(row) && row !== 0 && significantFigures(t.value) < significantFigures(text) && Math.abs(n - row) / row <= 0.05,
  );
}

interface Field {
  where: string;
  text: string;
  strict: boolean;
}

function fieldsOf(q: Question, answers: AnswerSet): Field[] {
  const key = answers[q.id];
  const out: Field[] = [{ where: "prompt", text: q.prompt, strict: false }];
  if (q.type === "mc") {
    for (const option of q.options) {
      const correct = option === key?.correctText;
      out.push({ where: correct ? "correct option" : "wrong option", text: option, strict: correct });
    }
  }
  if (key?.modelAnswer) out.push({ where: "model answer", text: key.modelAnswer, strict: true });
  for (const point of key?.rubric ?? []) out.push({ where: "rubric", text: point, strict: true });
  if (key?.notes) out.push({ where: "notes", text: key.notes, strict: true });
  for (const text of Object.values(key?.wrongExplanations ?? {})) out.push({ where: "explanation", text, strict: false });
  return out;
}

const shortId = (unit: Unit, id: string) => id.slice(unit.id.length + 1);

/** Capitalised words of a text, leaving out one that only starts a sentence. */
function names(text: string): string[] {
  const out: string[] = [];
  for (const match of text.matchAll(/(?<![A-Za-z\d])[A-Z][A-Za-z'’-]*/g)) {
    const before = text.slice(0, match.index).trimEnd();
    const startsSentence = before === "" || /[.!?:;("'“‘…]$/.test(before);
    const followedByName = /^ [A-Z]/.test(text.slice(match.index! + match[0].length));
    if (startsSentence && !followedByName) continue;
    out.push(match[0].replace(/['’]s$/, "").replace(/['’-]+$/, ""));
  }
  return out;
}

export function traceUnit(unit: Unit, answers: AnswerSet, factFile: FactFile): TraceResult {
  const findings: TraceFinding[] = [];
  const warnings: string[] = [];
  const everywhere = valuesOf([factFile.text]);
  const vocabulary = new Set(
    (factFile.text.match(/[A-Za-z][A-Za-z'’-]*/g) ?? []).flatMap((w) => {
      const word = w.toLowerCase().replace(/['’]s$/, "").replace(/['’-]+$/, "");
      return [word, ...word.split("-")];
    }),
  );
  const unknownNames = new Map<string, Set<string>>();
  const usedBy = new Map<string, { mc: string[]; short: string[] }>();

  for (const q of unit.questions) {
    const factIds = answers[q.id]?.factIds ?? [];
    const own = valuesOf(
      factIds.flatMap((id) => {
        const fact = factFile.facts.get(id);
        return fact ? [fact.statement, fact.when] : [];
      }),
    );
    for (const id of factIds) {
      const uses = usedBy.get(id) ?? { mc: [], short: [] };
      if (q.type === "mc" || q.type === "short") uses[q.type].push(shortId(unit, q.id));
      usedBy.set(id, uses);
    }

    for (const field of fieldsOf(q, answers)) {
      for (const t of tokens(field.text)) {
        let status: TraceStatus;
        if (field.strict) {
          status = holds(own, t) ? "OK" : isRounding(own, t) ? "ROUNDED" : holds(everywhere, t) ? "OTHER_ROW" : "UNTRACED";
        } else {
          status = holds(everywhere, t) ? "OK" : isRounding(own, t) ? "ROUNDED" : "UNTRACED";
        }
        findings.push({ questionId: q.id, where: field.where, value: t.value, status, factIds });

        const row = t.kind === "number" ? own.numbers.get(Number(t.value)) : undefined;
        if (t.magnitude && row && field.where !== "wrong option" && !row.magnitudes.has(t.magnitude)) {
          const written = [...row.magnitudes].map((m) => `${row.text} ${m}`.trim()).join(" or ");
          warnings.push(`${q.id}: ${field.where} says ${t.value} ${t.magnitude}; the fact row has ${written}`);
        }
      }
      for (const name of names(field.text)) {
        const word = name.toLowerCase();
        if (vocabulary.has(word) || MONTH_WORDS.includes(word) || word.split("-").every((part) => vocabulary.has(part))) continue;
        unknownNames.set(name, (unknownNames.get(name) ?? new Set()).add(shortId(unit, q.id)));
      }
    }

    if (q.type === "short") {
      // every mark point but the last (the significance) awards a figure, date or period
      const awarded = valuesOf((answers[q.id]?.rubric ?? []).slice(0, -1));
      const given = tokens(q.prompt).filter((t) => holds(awarded, t));
      if (given.length > 0) {
        warnings.push(`${q.id}: the prompt states ${[...new Set(given.map((t) => t.value))].join(", ")}, which its mark points award`);
      }
    }
  }

  for (const [id, { mc, short }] of usedBy) {
    if (mc.length > 0 && short.length > 0) {
      warnings.push(`${id}: shared by multiple choice ${mc.join(", ")} and short answer ${short.join(", ")}`);
    }
  }
  for (const [name, where] of unknownNames) {
    warnings.push(`name "${name}" is not in the fact file (${[...where].join(", ")})`);
  }

  return { findings, warnings };
}

// Pure marking rules for the essay unit (spec 010, research R7, contracts/replies.md §3): clamp the
// marker's mark into its band, cap a one-economy answer to a two-economy question, check that a
// quoted figure really is in the essay and that no replacement number is given, and turn the gaps
// and the concepts used well into concept outcomes. No I/O, no secrets, and it does NOT import
// rubric.json (the prompt and band descriptors are server-only); tests/essay/rubric-drift.test.ts
// checks the constants below against that file. The Python pilot has twins of these functions.

export interface Band {
  band: number;
  min: number;
  max: number;
}

/** The AT1 bands (band 1 is the top). Descriptors are in the server-only rubric.json. */
export const BANDS: Band[] = [
  { band: 1, min: 17, max: 20 },
  { band: 2, min: 13, max: 16 },
  { band: 3, min: 9, max: 12 },
  { band: 4, min: 5, max: 8 },
  { band: 5, min: 1, max: 4 },
];
export const MAX_GAPS = 5;
/** A one-economy answer to a two-economy question cannot go above the top of band 3. */
export const ONE_ECONOMY_CAP = 12;

export const CRITERIA_IDS = ["understanding", "theory", "assessment", "data", "structure"] as const;
export type CriterionId = (typeof CRITERIA_IDS)[number];
export const VERDICTS = ["strong", "sound", "developing", "weak"] as const;
export type Verdict = (typeof VERDICTS)[number];
export type Economy = "china" | "nepal" | "both";

export const WRONG_FIGURE_WHY = "This figure looks wrong; check it against a source.";

/** Lower case, whitespace collapsed, curly quotes straightened: how a quote is compared with its text. */
export function normalise(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** True when the quote occurs in the text (whitespace and case ignored). An empty quote never does. */
export function quoteInText(quote: string, text: string): boolean {
  const q = normalise(quote);
  return q.length > 0 && normalise(text).includes(q);
}

/**
 * A flag's reason must not give a replacement figure (spec FR-031). Any digit run in the reason
 * that is not in the quoted words means a number was supplied, so the reason is replaced.
 */
export function scrubFlagWhy(quote: string, why: string): string {
  const inQuote = new Set(quote.match(/\d+(?:[.,]\d+)*/g) ?? []);
  const numbers = why.match(/\d+(?:[.,]\d+)*/g) ?? [];
  const clean = why.trim();
  if (!clean || numbers.some((n) => !inQuote.has(n))) return WRONG_FIGURE_WHY;
  return clean;
}

export function clampToBand(mark: number, band: number, bands: readonly Band[] = BANDS): number {
  const b = bands.find((x) => x.band === band);
  if (!b) return mark;
  return Math.min(Math.max(mark, b.min), b.max);
}

/** Caps a one-economy answer to a two-economy ("both") question at 12; other essays are untouched. */
export function applyOneEconomyCap(final: number, economy: Economy, covers: boolean): number {
  return economy === "both" && !covers ? Math.min(final, ONE_ECONOMY_CAP) : final;
}

/** The recorded mark: clamped into its band, then capped. `capped` is true when the cap lowered it. */
export function finalMark(
  raw: number,
  band: number,
  economy: Economy,
  covers: boolean,
): { final: number; clamped: number; capped: boolean } {
  const clamped = clampToBand(raw, band);
  const final = applyOneEconomyCap(clamped, economy, covers);
  return { final, clamped, capped: final < clamped };
}

export interface Gap {
  conceptId: string;
  detail: string;
}

/** Concept outcomes for the results row: each gap a miss in the marker's order, then each concept used well. */
export function outcomesFrom(
  gaps: readonly Gap[],
  usedWell: readonly string[],
): Array<{ conceptId: string; correct: boolean }> {
  const missed = new Set(gaps.map((g) => g.conceptId));
  return [
    ...gaps.map((g) => ({ conceptId: g.conceptId, correct: false })),
    ...usedWell.filter((id) => !missed.has(id)).map((conceptId) => ({ conceptId, correct: true })),
  ];
}

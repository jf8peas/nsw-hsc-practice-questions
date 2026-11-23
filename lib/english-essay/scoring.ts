import { BANDS, clampToBand, normalise, outcomesFrom, quoteInText } from "@/lib/essay/scoring";

import type { EnglishBand, EnglishKnowledgeError, EnglishQuestionFocus, EnglishQuoteResult } from "./types";

// Pure marking rules for the English essay unit (spec 011, data-model §7, contracts/replies.md): deduplicate the
// knowledge errors, then one exact order of adjustments to the marker's mark. No I/O, no secrets, and it does NOT
// import rubric.json. The generic band table, clamp and outcome helpers are reused from the Economics module
// unchanged (the AT1 bands are the same five ranges).

export { BANDS, outcomesFrom, quoteInText };

/** A quotation the quote check could not find in the play becomes this knowledge error. */
export const NOT_FOUND_WHY = "check this quote: not found in the play";

export const FOCUS_CAPS: Record<EnglishQuestionFocus, number | null> = { fully: null, partly: 12, barely: 10 };
export const MAX_DEDUCTION = 2;
export const KNOWLEDGE_CAP = 16;

/** The band containing a final mark (1 is the top). */
export function bandOfMark(mark: number): EnglishBand {
  const b = BANDS.find((x) => mark >= x.min && mark <= x.max);
  return (b?.band ?? 5) as EnglishBand;
}

/** Lower case, curly quotes straightened, everything but letters and digits collapsed to single spaces. */
export function squashQuote(s: string): string {
  return normalise(s)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface MarkerError {
  quote: string;
  why: string;
}

/**
 * Marker errors as the model gave them, validated and deduplicated: the quote must occur in the essay (case and
 * whitespace ignored) and the reason must be non-empty; a later error whose normalised quote OR normalised reason
 * repeats an earlier one is the same underlying mistake and is dropped (data-model §7.1 steps 1-2).
 */
export function dedupeMarkerErrors(errors: readonly MarkerError[], essay: string): EnglishKnowledgeError[] {
  const out: EnglishKnowledgeError[] = [];
  const quotes = new Set<string>();
  const whys = new Set<string>();
  for (const e of errors) {
    const why = e.why.trim();
    if (!why || !quoteInText(e.quote, essay)) continue;
    const q = normalise(e.quote);
    const w = normalise(why);
    if (quotes.has(q) || whys.has(w)) continue;
    quotes.add(q);
    whys.add(w);
    out.push({ quote: e.quote, why, source: "marker" });
  }
  return out;
}

/** True when either quotation contains the other, after straightening and punctuation stripping. */
export function quotesOverlap(a: string, b: string): boolean {
  const x = squashQuote(a);
  const y = squashQuote(b);
  if (!x || !y) return false;
  return x.includes(y) || y.includes(x);
}

/**
 * The final knowledge-error list: marker errors first, then one `quote-check` error per unique not-found quotation
 * that no marker error already covers (data-model §7.1 steps 3-4). Near matches, other-source and ok add nothing.
 */
export function mergeKnowledgeErrors(markerErrors: readonly EnglishKnowledgeError[], quoteResults: readonly EnglishQuoteResult[]): EnglishKnowledgeError[] {
  const out = [...markerErrors];
  for (const r of quoteResults) {
    if (r.status !== "not-found") continue;
    if (out.some((e) => quotesOverlap(e.quote, r.quote))) continue;
    out.push({ quote: r.quote, why: NOT_FOUND_WHY, source: "quote-check" });
  }
  return out;
}

export interface EnglishFinalMark {
  clampedMark: number;
  finalMark: number;
  finalBand: EnglishBand;
  deduction: number;
  knowledgeCapApplied: boolean;
  focusCap: 12 | 10 | null;
  capped: boolean;
}

/**
 * The recorded mark. Exact order: clamp the raw mark into the marker's band; deduct one per deduplicated error (at
 * most two); cap at 16 when there are two or more errors; cap at 12 (partly) or 10 (barely); never below 1; then the
 * band that contains the result. The marker-selected band is NOT changed: the caller stores it separately.
 */
export function englishFinalMark(input: {
  rawMark: number;
  band: number;
  errorCount: number;
  focus: EnglishQuestionFocus;
}): EnglishFinalMark {
  const clampedMark = clampToBand(input.rawMark, input.band);
  const deduction = Math.min(input.errorCount, MAX_DEDUCTION);
  let mark = clampedMark - deduction;
  const knowledgeCapApplied = input.errorCount >= 2;
  if (knowledgeCapApplied) mark = Math.min(mark, KNOWLEDGE_CAP);
  const focusCap = FOCUS_CAPS[input.focus] as 12 | 10 | null;
  if (focusCap !== null) mark = Math.min(mark, focusCap);
  const finalMark = Math.max(mark, 1);
  return { clampedMark, finalMark, finalBand: bandOfMark(finalMark), deduction, knowledgeCapApplied, focusCap, capped: finalMark < clampedMark };
}

import exclusions from "./quote-exclusions.json";
import { NEAR_RATIO, normWords, PlayIndex } from "./play-index";
import type { EnglishQuoteResult } from "./types";

// The deterministic quotation check (spec 011, contracts/quote-check.md): code, not a model. It extracts every
// quotation from an essay and compares it with the server-only reference text. Pure given a PlayIndex; the server-only
// module lib/english-essay/reference-text.server.ts supplies the index. A port of the Python pilot's check_quotes, whose
// results the parity script compares (scripts/check-english-essay-quote-parity.ts).

// Straight double, curly double, and single quotes. A single quote does not open or close inside a word, but an
// apostrophe between two letters (I'm, don't, Tom's) stays inside a single-quoted quotation (the pilot's corrected
// pattern, 23 Nov 2026).
const QUOTE_RE = new RegExp(
  '"([^"\n]{3,400})"' +
    "|\u201c([^\u201d\n]{3,400})\u201d" +
    "|(?<![A-Za-z0-9])['\u2018]((?:[^'\u2018\u2019\n]|(?<=[A-Za-z])['\u2019](?=[A-Za-z])){3,300}?)['\u2019](?![A-Za-z0-9])",
  "g",
);

/** Every quotation in the text, in order, without its surrounding quote marks. */
export function extractQuotations(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(QUOTE_RE)) out.push((m[1] ?? m[2] ?? m[3]) as string);
  return out;
}

export const QUOTE_EXCLUSION_PHRASES: readonly string[] = (exclusions as { phrases: string[] }).phrases;

/** An index of the question's own wording plus the exclusion phrases: quoting these is not quoting the play. */
export function buildOtherSources(question: string): PlayIndex {
  return new PlayIndex([question, ...QUOTE_EXCLUSION_PHRASES].join("\n"));
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Status of every quotation of three or more words, in essay order: `ok` (in the play), `other-source` (the question or a
 * listed syllabus phrase: never flagged or counted), `near` (close to the play: the exact words, no penalty) or
 * `not-found` (a knowledge error).
 */
export function checkQuotes(essay: string, play: PlayIndex, others?: PlayIndex): EnglishQuoteResult[] {
  const out: EnglishQuoteResult[] = [];
  for (const q of extractQuotations(essay)) {
    const words = normWords(q);
    if (words.length < 3) continue;
    const segments = q
      .split(/\.\.\.|…|\//)
      .map((s) => normWords(s))
      .filter((s) => s.length >= 2);
    if (segments.length > 0 && segments.every((s) => play.found(s))) {
      out.push({ quote: q, status: "ok" });
      continue;
    }
    if (others && others.words.length > 0) {
      if ((segments.length > 0 && segments.every((s) => others.found(s))) || others.nearest(words).ratio >= NEAR_RATIO) {
        out.push({ quote: q, status: "other-source" });
        continue;
      }
    }
    const { ratio, raw } = play.nearest(words);
    if (ratio >= NEAR_RATIO) out.push({ quote: q, status: "near", correct: raw, ratio: round2(ratio) });
    else out.push({ quote: q, status: "not-found", ratio: round2(ratio) });
  }
  return out;
}

import { createHash } from "node:crypto";

import { sequenceRatio } from "./sequence-matcher";

// The normalised word index the quote check searches (spec 011, contracts/quote-check.md §2-3). Pure and I/O-free
// apart from hashing; the server-only module lib/english-essay/reference-text.server.ts decides where the text comes
// from. The same class indexes the essay question's own wording and the exclusion phrases (`other-source`).

/** Straightens curly quotes, lower-cases, turns every run outside [a-z0-9' ] into a space and trims edge apostrophes. */
export function normWords(s: string): string[] {
  const t = s
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, " ");
  const out: string[] = [];
  for (const w of t.split(/\s+/)) {
    const stripped = w.replace(/^'+|'+$/g, "");
    if (stripped) out.push(stripped);
  }
  return out;
}

export const sha256Hex = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex");

/** A quotation of this ratio or better against the play is a near match (the pilot's MISQUOTE_RATIO). */
export const NEAR_RATIO = 0.75;

export class PlayIndex {
  readonly rawWords: string[];
  readonly words: string[] = [];
  /** For each normalised word, the index of the raw word it came from. */
  readonly index: number[] = [];
  private readonly joined: string;

  constructor(text: string) {
    // Index from the first act marker when the source has one, as the pilot does (skips front matter).
    const at = text.indexOf("ACT ONE");
    const body = at >= 0 ? text.slice(at) : text;
    this.rawWords = body.split(/\s+/).filter(Boolean);
    this.rawWords.forEach((raw, i) => {
      for (const n of normWords(raw)) {
        this.words.push(n);
        this.index.push(i);
      }
    });
    this.joined = " " + this.words.join(" ") + " ";
  }

  /** True when the normalised word run occurs exactly in the text. */
  found(segment: string[]): boolean {
    return this.joined.includes(" " + segment.join(" ") + " ");
  }

  /** The best fuzzy window (n-2 to n+2 words) for the quotation: its ratio and the text's own raw words. */
  nearest(q: string[]): { ratio: number; raw: string } {
    const n = q.length;
    const target = q.join(" ");
    const first = new Set([...q.slice(0, 3), ...q.slice(-3)]);
    // the character multiset of the target: an upper bound on any window's ratio (CPython's quick_ratio). A window can only
    // replace the best when strictly better, so skipping one whose bound is not above the best never changes the answer.
    const targetCounts = new Int32Array(128);
    for (let c = 0; c < target.length; c++) targetCounts[target.charCodeAt(c) & 127]!++;
    const windowCounts = new Int32Array(128);
    let best = 0;
    let where: [number, number] = [0, 0];
    const len = this.words.length;
    for (let i = 0; i < len; i++) {
      if (!first.has(this.words[i]) && i + n - 1 < len && !first.has(this.words[Math.min(i + n - 1, len - 1)])) continue;
      for (const m of [n - 2, n - 1, n, n + 1, n + 2]) {
        if (m < 2 || i + m > len) continue;
        const window = this.words.slice(i, i + m).join(" ");
        windowCounts.fill(0);
        for (let c = 0; c < window.length; c++) windowCounts[window.charCodeAt(c) & 127]!++;
        let shared = 0;
        for (let c = 0; c < 128; c++) shared += Math.min(targetCounts[c]!, windowCounts[c]!);
        if ((2 * shared) / (target.length + window.length) <= best) continue;
        const r = sequenceRatio(target, window);
        if (r > best) {
          best = r;
          where = [i, i + m];
        }
      }
    }
    const [a, b] = where;
    const raw = b > a ? this.rawWords.slice(this.index[a], this.index[b - 1] + 1).join(" ") : "";
    return { ratio: best, raw };
  }
}

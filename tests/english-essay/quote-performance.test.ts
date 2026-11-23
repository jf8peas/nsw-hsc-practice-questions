import { describe, expect, it } from "vitest";

import { PlayIndex } from "@/lib/english-essay/play-index";
import { buildOtherSources, checkQuotes } from "@/lib/english-essay/quotes";

// A 1,200-word essay with 25 quotations against a cached invented reference index (spec 011 research R10): target under
// 500 ms locally, fail above 2 s. The index is built once; repeated checks must not rebuild it. Invented text only: a
// seeded pseudo-random "play" of 20,000 words with a Zipf-like vocabulary (a few very common words, a long tail), so the
// near-match search is exercised the way real prose exercises it.

let seed = 12345;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const COMMON = "the a and of to in it was he she that with her his on at for as but".split(" ");
const TAIL = Array.from({ length: 2500 }, (_, i) => `w${(i * 2654435761).toString(36).slice(0, 5)}`);
const word = () => (rand() < 0.35 ? COMMON[Math.floor(rand() * COMMON.length)]! : TAIL[Math.floor(Math.pow(rand(), 2) * TAIL.length)]!);
const sentence = (len: number) => Array.from({ length: len }, word).join(" ");

const SENTENCES = Array.from({ length: 2000 }, () => sentence(10));
const PLAY = ["ACT ONE", ...SENTENCES.map((s) => `${s}.`)].join("\n");

function essay(): string {
  const quotes: string[] = [];
  for (let i = 0; i < 25; i++) {
    const exact = SENTENCES[(i * 77) % SENTENCES.length]!;
    // like a real essay: most quotations are exact (they return before any near search); a few are slightly off or invented
    quotes.push(i % 8 === 1 ? exact.replace(/^\S+/, "ledger") : i % 12 === 5 ? sentence(10) : exact);
  }
  const filler = Array.from({ length: 1200 - 25 * 11 }, () => "word").join(" ");
  return `${filler} ${quotes.map((q) => `"${q}"`).join(" and then ")}`;
}

describe("quote-check performance", () => {
  const index = new PlayIndex(PLAY);
  const others = buildOtherSources("To what extent do texts illuminate anomalies in human behaviour?");
  const text = essay();

  it("checks 25 quotations in a 1,200-word essay well under 2 seconds", () => {
    const start = performance.now();
    const results = checkQuotes(text, index, others);
    const ms = performance.now() - start;
    expect(results.length).toBeGreaterThanOrEqual(20);
    expect(results.filter((r) => r.status === "ok").length).toBeGreaterThanOrEqual(18);
    expect(ms).toBeLessThan(2000);
    // the stricter local target is advisory so a busy machine does not flake
    if (ms > 500) console.warn(`quote check took ${Math.round(ms)} ms (target < 500 ms)`);
  });

  it("does not rebuild the index between checks", () => {
    const first = index.words;
    checkQuotes(text, index, others);
    checkQuotes(text, index, others);
    expect(index.words).toBe(first);
  });
});

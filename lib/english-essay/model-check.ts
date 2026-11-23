import { PlayIndex } from "./play-index";
import { buildOtherSources, checkQuotes } from "./quotes";
import type { EnglishQuoteResult } from "./types";
import { countWords } from "@/lib/wordcount";

// The deterministic check every LIVE English model essay must pass (spec 011 FR-035, contracts/quote-check.md §4): 900 to 1,100
// words, and every extracted quotation found in the play (status `ok`). A `near` or `not-found` result blocks the builder and
// `npm run validate`. Pure given a PlayIndex; callers read the local gitignored play themselves (this module touches no file).
// The question's own wording and listed syllabus phrases are `other-source`: allowed in a model, as in a student essay.

export const MODEL_MIN_WORDS = 900;
export const MODEL_MAX_WORDS = 1100;

export interface ModelCheck {
  words: number;
  wordsOk: boolean;
  quotations: number;
  flags: EnglishQuoteResult[];
}

export function checkModelEssay(modelEssay: string, question: string, play: PlayIndex): ModelCheck {
  const words = countWords(modelEssay);
  const results = checkQuotes(modelEssay, play, buildOtherSources(question));
  return {
    words,
    wordsOk: words >= MODEL_MIN_WORDS && words <= MODEL_MAX_WORDS,
    quotations: results.length,
    flags: results.filter((r) => r.status === "near" || r.status === "not-found"),
  };
}

/** Human-readable problems for one model essay (no play text beyond the flagged quotation and its near correction). */
export function modelProblems(id: string, check: ModelCheck): string[] {
  const out: string[] = [];
  if (!check.wordsOk) out.push(`${id}: the model essay is ${check.words} words; it must be ${MODEL_MIN_WORDS} to ${MODEL_MAX_WORDS}`);
  for (const f of check.flags) {
    out.push(
      f.status === "near"
        ? `${id}: quotation "${f.quote}" is close to the play but not exact (the play says "${f.correct}")`
        : `${id}: quotation "${f.quote}" was not found in the play`,
    );
  }
  return out;
}

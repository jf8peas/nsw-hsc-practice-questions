import { countWords } from "@/lib/wordcount";

// The English essay word counter's wording and limits (spec 011, research R6). One place, so the page, the tests and
// the server's error numbers agree. A plain module: no I/O, no secrets. The count itself is the app's one
// `countWords`, never a second algorithm.

export const ESSAY_MIN = 800;
export const ESSAY_MAX = 1200;
/** A defensive backstop on the stored/submitted text, well above 1,200 words. */
export const ESSAY_MAX_CHARS = 12000;

export interface EnglishEssayCounter {
  state: "under" | "ready" | "over";
  text: string;
  canSubmit: boolean;
}

const fmt = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function englishEssayCounter(n: number): EnglishEssayCounter {
  const range = `${fmt(ESSAY_MIN)}–${fmt(ESSAY_MAX)}`;
  if (n < ESSAY_MIN) {
    return { state: "under", text: `${fmt(n)} / ${range} words — ${fmt(ESSAY_MIN - n)} more to go`, canSubmit: false };
  }
  if (n > ESSAY_MAX) {
    const cut = n - ESSAY_MAX;
    return { state: "over", text: `${fmt(n)} / ${fmt(ESSAY_MAX)} — cut ${fmt(cut)} ${plural(cut, "word", "words")}`, canSubmit: false };
  }
  return { state: "ready", text: `${fmt(n)} / ${range} words`, canSubmit: true };
}

export type EssayLengthCheck =
  | { ok: true; words: number }
  | { ok: false; error: "invalid_request" | "essay_too_short" | "essay_too_long"; words: number };

/** The server's length rule for a submitted essay (contracts/api.md F). */
export function checkEssayLength(text: unknown): EssayLengthCheck {
  if (typeof text !== "string" || text.trim() === "") return { ok: false, error: "invalid_request", words: 0 };
  if (text.length > ESSAY_MAX_CHARS) return { ok: false, error: "essay_too_long", words: countWords(text) };
  const words = countWords(text);
  if (words < ESSAY_MIN) return { ok: false, error: "essay_too_short", words };
  if (words > ESSAY_MAX) return { ok: false, error: "essay_too_long", words };
  return { ok: true, words };
}

// The essay and scaffold word counters' wording (spec 010 FR-008, FR-019). One place, so the page,
// the tests and the server's error numbers agree. A plain module: no I/O, no secrets.

export const ESSAY_MIN = 600;
export const ESSAY_MAX = 800;
export const ESSAY_MAX_CHARS = 8000;

export interface EssayCounter {
  state: "under" | "ready" | "over";
  text: string;
  canSubmit: boolean;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function essayCounter(n: number): EssayCounter {
  if (n < ESSAY_MIN) {
    const more = ESSAY_MIN - n;
    return { state: "under", text: `${n} / ${ESSAY_MIN}–${ESSAY_MAX} words — ${more} more to go`, canSubmit: false };
  }
  if (n > ESSAY_MAX) {
    const cut = n - ESSAY_MAX;
    return { state: "over", text: `${n} / ${ESSAY_MAX} — cut ${cut} ${plural(cut, "word", "words")}`, canSubmit: false };
  }
  return { state: "ready", text: `${n} / ${ESSAY_MIN}–${ESSAY_MAX} words`, canSubmit: true };
}

export function scaffoldCounter(n: number, cap = 250): { over: boolean; text: string } {
  if (n > cap) {
    const cut = n - cap;
    return { over: true, text: `${n} / ${cap} words, cut ${cut} ${plural(cut, "word", "words")}` };
  }
  return { over: false, text: `${n} / ${cap} words` };
}

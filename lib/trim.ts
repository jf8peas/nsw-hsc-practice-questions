// A length ceiling for the model's free text that never leaves a student reading half a sentence. The ceilings are
// there to stop a runaway reply, so they sit well above what a normal reply uses.

/** The end of a sentence: . ! or ?, any closing quote or bracket, then a space or the end. */
const SENTENCE_END = /[.!?]['"’”)\]]*(?=\s|$)/g;

/**
 * `value` trimmed. Text over `max` characters is cut back to its last whole sentence; with no sentence that keeps at
 * least half the allowance, it is cut at the last whole word and ends with "…". The result is never longer than `max`.
 */
export function trimToLimit(value: string, max: number): string {
  const clean = value.trim();
  if (clean.length <= max) return clean;
  // One character past the ceiling, so a sentence or word that ends exactly on it is seen to end.
  const window = clean.slice(0, max + 1);
  let end = 0;
  for (const m of window.matchAll(SENTENCE_END)) {
    const stop = m.index + m[0].length;
    if (stop <= max) end = stop;
  }
  if (end >= max / 2) return window.slice(0, end);
  const head = clean.slice(0, max);
  const space = head.lastIndexOf(" ");
  return `${head.slice(0, space > 0 ? space : max - 1).replace(/[\s,;:—–-]+$/, "")}…`;
}

/**
 * The shared word counter for the sentence-writing unit (spec 005 FR-043). Used by both the
 * client's live counter and the server's marker, so a student's count is always the marker's
 * count. A plain module: no I/O, no secrets, safe anywhere.
 *
 * Counts whitespace-separated tokens; hyphenated words and numbers count as one word each
 * (e.g. "well-being" is one word, "2027" is one word).
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

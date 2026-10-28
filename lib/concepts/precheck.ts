// A free, deterministic check run before the reviewer: a concept summary must not copy a long
// run of words from any model answer, rubric point or correct option of the questions tagged
// with the concept (spec 002 FR-015, research R5). A plain module: no I/O, no secrets.

/** Lower-case, strip punctuation, collapse spaces. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A run of this many consecutive words in common counts as copying. */
export const OVERLAP_WORDS = 8;

/**
 * True when any run of OVERLAP_WORDS consecutive words of `text` also appears, in the same
 * order, in any of `material` (after normalising both).
 */
export function overlapsAnswerKey(text: string, material: readonly string[]): boolean {
  const words = normalise(text).split(" ").filter(Boolean);
  if (words.length < OVERLAP_WORDS) return false;
  const haystacks = material.map((m) => ` ${normalise(m)} `).filter((m) => m.trim() !== "");
  if (haystacks.length === 0) return false;
  for (let i = 0; i + OVERLAP_WORDS <= words.length; i++) {
    const run = ` ${words.slice(i, i + OVERLAP_WORDS).join(" ")} `;
    if (haystacks.some((h) => h.includes(run))) return true;
  }
  return false;
}

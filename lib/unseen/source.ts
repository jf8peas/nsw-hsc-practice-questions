// The credit shown with every unseen-text question (constitution Principle V: school, year, paper
// type, question number) and the short label used in past-attempt names. PUBLIC, pure.

import type { TextForm, UnseenPaper } from "@/lib/types";

/**
 * "Fort St 2025 Trial, Q1": the format every school-paper question uses (school, year, paper type,
 * question number; constitution Principle V) and `npm run validate` checks.
 */
export function sourceOf(paper: UnseenPaper): string {
  return `${paper.short} ${paper.year} ${paper.exam}, Q${paper.qNo}`;
}

const FORM_LABELS: Record<TextForm, string> = {
  poem: "Poem",
  "prose-fiction": "Prose fiction",
  "non-fiction": "Non-fiction",
  "personal-essay": "Personal essay",
  visual: "Visual",
  drama: "Drama",
  speech: "Speech",
};

/** "Poem", "Prose fiction": how a text form is named on the unit page and in past-attempt names. */
export const formLabel = (form: TextForm): string => FORM_LABELS[form];

/** "Fort St 2025 · Q1". */
export function paperLabel(paper: UnseenPaper): string {
  return `${paper.short} ${paper.year} · Q${paper.qNo}`;
}

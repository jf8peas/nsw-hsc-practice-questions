import type { Answer, AnswerSet, PartNo } from "@/lib/types";
import { PARAGRAPH_UNIT_ID } from "@/lib/paragraph/parts";

import { essays } from "./essays";

// Answer key for y12-economics-paragraph-writing: one entry per question, pointing at its essay's
// key and part. NO "server-only" import here (the validator reads it); only re-exported via
// content/answers/index.ts, which is server-only. Never import from a client component.

export const answers: AnswerSet = {};

for (const essay of essays) {
  for (const part of [1, 2, 3, 4, 5] as PartNo[]) {
    const entry: Answer = { rubric: [], paragraph: { essay, part } };
    answers[`${PARAGRAPH_UNIT_ID}.${essay.essayId}p${part}`] = entry;
  }
}

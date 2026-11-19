import type { Answer, AnswerSet, UnseenQuestion } from "@/lib/types";

import { descriptionChecks } from "./description-checks";
import { descriptions } from "./descriptions";
import { keys } from "./keys";
import { questions } from "./questions";
import { texts } from "./texts";

// Answer key for y12-english-advanced-unseen-texts: one entry per question, from keys.ts (criteria,
// notes, model answer), plus, for a visual text, its written description and the result of its
// pre-release check. NO "server-only" import here (the validator reads it under plain tsx); only
// re-exported via content/answers/index.ts, which is server-only. Never import from a client component.

export const answers: AnswerSet = {};

for (const question of questions) {
  if (question.type !== "unseen") continue;
  const key = keys[question.id];
  if (!key) continue; // the validator reports a question with no key
  const text = texts.find((t) => t.id === (question as UnseenQuestion).textId);
  const description = text?.body.kind === "image" ? descriptions[text.id] : undefined;
  const entry: Answer = {
    rubric: [],
    unseen: {
      ...key,
      ...(text && description !== undefined
        ? { visual: { description, ...(descriptionChecks[text.id] ? { check: descriptionChecks[text.id] } : {}) } }
        : {}),
    },
  };
  answers[question.id] = entry;
}

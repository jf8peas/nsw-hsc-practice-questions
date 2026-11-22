import type { Answer, AnswerSet } from "@/lib/types";

import { descriptionChecks } from "../y12-english-advanced-unseen-texts/description-checks";
import { descriptions } from "../y12-english-advanced-unseen-texts/descriptions";
import { keys } from "./keys";
import { questions } from "./questions";
import { texts } from "./texts";

// Answer key for y12-english-advanced-comparative-texts: one entry per question, from keys.ts (criteria, notes,
// model answer, pairing), plus, for every visual text the question shows (picked or not), its written description
// and the result of its pre-release check, both read from the shared text store's files by text id. NO
// "server-only" import here (the validator reads it under plain tsx); only re-exported via
// content/answers/index.ts, which is server-only. Never import from a client component.

export const answers: AnswerSet = {};

for (const question of questions) {
  if (question.type !== "comparative") continue;
  const key = keys[question.id];
  if (!key) continue; // the validator reports a question with no key
  const visuals: NonNullable<Answer["comparative"]>["visuals"] = {};
  for (const textId of question.textIds) {
    const text = texts.find((t) => t.id === textId);
    const description = text?.body.kind === "image" ? descriptions[text.id] : undefined;
    if (text && description !== undefined) {
      visuals[text.id] = { description, ...(descriptionChecks[text.id] ? { check: descriptionChecks[text.id] } : {}) };
    }
  }
  answers[question.id] = { rubric: [], comparative: { ...key, ...(Object.keys(visuals).length ? { visuals } : {}) } };
}

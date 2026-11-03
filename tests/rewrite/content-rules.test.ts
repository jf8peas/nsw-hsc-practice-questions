import { describe, expect, it } from "vitest";

import { validateRewriteRules } from "@/lib/content-rules";
import type { AnswerSet, Unit } from "@/lib/types";

const U = "y12-economics-sentence-writing";
const C1 = `${U}.c-tariff`;
const C2 = `${U}.c-imports`;

const unit: Unit = {
  id: U,
  year: "Year 12",
  topic: "Topic 1: The Global Economy",
  type: "Writing Practice",
  title: "Sentence Writing",
  description: "",
  created: "2026-11-02",
  order: 1,
  questions: Array.from({ length: 4 }, (_, i) => ({
    id: `${U}.r0${i + 1}`,
    type: "rewrite" as const,
    prompt: `Plain sentence ${i + 1}.`,
    maxMarks: 3,
    concepts: [C1, C2],
  })),
  concepts: [
    { id: C1, term: "tariff", description: "A tax on imported goods that raises their price." },
    { id: C2, term: "imports", description: "Goods and services bought from other countries." },
  ],
  quiz: { short: 0, mc: 0, passMark: 60 },
};

const goodAnswer = (id: string) => ({
  [id]: {
    modelSentences: ["The premium sentence."],
    targetTerms: [
      { conceptId: C1, term: "tariff", definition: "A tax on imports.", why: "names the tax", equivalents: ["import tax"], misuses: ["quota"] },
      { conceptId: C2, term: "imports", definition: "Goods bought abroad.", why: "names the goods", equivalents: [], misuses: ["exports"] },
    ],
    rubric: ["a", "b", "c"],
  },
});

const answers: AnswerSet = {};
for (const q of unit.questions) Object.assign(answers, goodAnswer(q.id));

describe("validateRewriteRules (spec 005 FR-008, FR-007)", () => {
  it("accepts a well-formed rewrite unit where every concept appears in at least 4 questions", () => {
    expect(validateRewriteRules(unit, answers)).toEqual([]);
  });

  it("requires a model sentence on every rewrite question", () => {
    const bad = { ...answers, [`${U}.r01`]: { ...answers[`${U}.r01`], modelSentences: [] } };
    const errors = validateRewriteRules(unit, bad);
    expect(errors.some((e) => e.includes("model sentence"))).toBe(true);
  });

  it("requires 1-3 target terms each with a definition", () => {
    const bad = { ...answers, [`${U}.r01`]: { ...answers[`${U}.r01`], targetTerms: [] } };
    expect(validateRewriteRules(unit, bad)[0]).toContain("1-3 target terms");
  });

  it("requires every target term to be a concept of the unit", () => {
    const bad = {
      ...answers,
      [`${U}.r01`]: {
        ...answers[`${U}.r01`],
        targetTerms: [{ conceptId: "not-a-concept", term: "x", definition: "d", why: "w", equivalents: [], misuses: [] }],
      },
    };
    expect(validateRewriteRules(unit, bad).some((e) => e.includes("not a concept"))).toBe(true);
  });

  it("fails when a concept appears in fewer than 4 questions (FR-007)", () => {
    const withoutC2 = { ...goodAnswer(`${U}.r01`) };
    void withoutC2;
    // answer keys with only C1 target terms, so C2 never appears
    const answersC1Only: AnswerSet = {};
    for (const q of unit.questions) {
      answersC1Only[q.id] = {
        modelSentences: ["The premium sentence."],
        targetTerms: [
          { conceptId: C1, term: "tariff", definition: "A tax on imports.", why: "names the tax", equivalents: ["import tax"], misuses: ["quota"] },
        ],
        rubric: ["a", "b", "c"],
      };
    }
    const errors = validateRewriteRules(unit, answersC1Only);
    expect(errors.some((e) => e.includes("appears in 0 rewrite question"))).toBe(true);
  });
});

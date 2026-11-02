import { describe, expect, it } from "vitest";

import { conceptProgress, type ConceptResult } from "@/lib/concepts/progress";
import type { Unit } from "@/lib/types";

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
  questions: [
    { id: `${U}.r01`, type: "rewrite", prompt: "p", maxMarks: 3, concepts: [C1, C2] },
    { id: `${U}.r02`, type: "short", prompt: "s", maxMarks: 2, concept: "other" },
  ],
  concepts: [
    { id: C1, description: "A tax on imported goods that raises their price." },
    { id: C2, description: "Goods and services bought from other countries." },
    { id: "other", description: "Some other concept." },
  ],
  quiz: { short: 0, mc: 0, passMark: 60 },
};

function result(over: Partial<ConceptResult>): ConceptResult {
  return {
    id: over.id ?? "x",
    questionId: `${U}.r01`,
    marks: 2,
    max: 3,
    answeredAt: new Date("2026-11-02T00:00:00Z"),
    ...over,
  };
}

describe("concept progress with per-term outcomes (spec 005 FR-033)", () => {
  it("replays each term from concept_outcomes in order (phase 1 only)", () => {
    const results: ConceptResult[] = [
      result({
        conceptOutcomes: [
          { conceptId: C1, correct: false },
          { conceptId: C2, correct: true },
        ],
      }),
    ];
    const states = conceptProgress(unit, results);
    expect(states.map((s) => s.conceptId)).toEqual([C1]); // C2 used correctly in phase 1: not listed
    expect(states[0]?.count).toBe(3);
  });

  it("a term missed in phase 1 counts as wrong even when used correctly later in phase 2 (outcomes come from phase 1)", () => {
    const results: ConceptResult[] = [
      result({ conceptOutcomes: [{ conceptId: C1, correct: false }] }), // phase 1: missed
      result({
        answeredAt: new Date("2026-11-02T00:05:00Z"),
        marks: 2,
        conceptOutcomes: [{ conceptId: C1, correct: false }], // phase 2 used correctly, but concept_outcomes is still phase 1
      }),
    ];
    const states = conceptProgress(unit, results);
    expect(states.some((s) => s.conceptId === C1 && s.count === 3)).toBe(true);
  });

  it("clears after 3 correct phase-1 uses", () => {
    const correct = (at: string): ConceptResult =>
      result({ answeredAt: new Date(at), conceptOutcomes: [{ conceptId: C1, correct: true }] });
    const results = [
      result({ answeredAt: new Date("2026-11-02T00:01:00Z"), conceptOutcomes: [{ conceptId: C1, correct: false }] }),
      correct("2026-11-02T00:02:00Z"),
      correct("2026-11-02T00:03:00Z"),
      correct("2026-11-02T00:04:00Z"),
    ];
    expect(conceptProgress(unit, results)).toEqual([]);
  });

  it("a result without conceptOutcomes replays from the question's current tag exactly as before", () => {
    const results: ConceptResult[] = [
      { id: "y", questionId: `${U}.r02`, marks: 1, max: 2, answeredAt: new Date("2026-11-02T00:00:00Z") },
    ];
    const states = conceptProgress(unit, results);
    expect(states[0]?.conceptId).toBe("other");
    expect(states[0]?.count).toBe(3);
  });
});

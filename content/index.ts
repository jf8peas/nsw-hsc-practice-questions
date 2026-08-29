import type { Unit, UnitMeta, Year } from "@/lib/types";

import { meta as y11FormulaTestMeta } from "./units/y11-formula-test/meta";
import { questions as y11FormulaTestQuestions } from "./units/y11-formula-test/questions";

/**
 * The unit registry. This is the ONLY file that imports every unit.
 * To add a unit: create content/units/<id>/{meta,questions,answers}.ts,
 * then add one entry here and one in content/answers/index.ts.
 *
 * PUBLIC — safe to import from client components. No answer keys.
 */
export const UNITS: Unit[] = [
  { ...y11FormulaTestMeta, questions: y11FormulaTestQuestions },
];

export const YEARS: Year[] = ["Year 11", "Year 12"];

export function getUnit(id: string): Unit | undefined {
  return UNITS.find((u) => u.id === id);
}

export function getQuestion(questionId: string) {
  for (const unit of UNITS) {
    const q = unit.questions.find((question) => question.id === questionId);
    if (q) return { unit, question: q };
  }
  return undefined;
}

export interface TopicGroup {
  topic: string;
  units: Unit[];
}

export interface YearGroup {
  year: Year;
  isEmpty: boolean;
  topics: TopicGroup[];
}

/** Units grouped year -> topic -> units, each sorted by `order`. */
export function unitsByYear(): YearGroup[] {
  return YEARS.map((year) => {
    const inYear = UNITS.filter((u) => u.year === year);
    const topicNames = [...new Set(inYear.map((u) => u.topic))];
    const topics: TopicGroup[] = topicNames.map((topic) => ({
      topic,
      units: inYear
        .filter((u) => u.topic === topic)
        .sort((a, b) => a.order - b.order),
    }));
    return { year, isEmpty: inYear.length === 0, topics };
  });
}

export type { Unit, UnitMeta };

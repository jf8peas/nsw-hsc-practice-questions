import type { Unit, UnitMeta, Year } from "@/lib/types";

import { meta as y11FormulaTestMeta } from "./units/y11-formula-test/meta";
import { questions as y11FormulaTestQuestions } from "./units/y11-formula-test/questions";
import { meta as y11EconSupplyDemandMeta } from "./units/y11-economics-supply-demand/meta";
import { questions as y11EconSupplyDemandQuestions } from "./units/y11-economics-supply-demand/questions";
import { meta as y11EconPreliminaryMeta } from "./units/y11-economics-preliminary/meta";
import { questions as y11EconPreliminaryQuestions } from "./units/y11-economics-preliminary/questions";
import { meta as y11PhysPreliminaryMeta } from "./units/y11-physics-preliminary/meta";
import { questions as y11PhysPreliminaryQuestions } from "./units/y11-physics-preliminary/questions";
import { meta as y11EconEssayMeta } from "./units/y11-economics-essay-scaffold/meta";
import { questions as y11EconEssayQuestions } from "./units/y11-economics-essay-scaffold/questions";

/**
 * The unit registry. This is the ONLY file that imports every unit.
 * To add a unit: create content/units/<id>/{meta,questions,answers}.ts,
 * then add one entry here and one in content/answers/index.ts.
 *
 * PUBLIC — safe to import from client components. No answer keys.
 */
export const UNITS: Unit[] = [
  { ...y11FormulaTestMeta, questions: y11FormulaTestQuestions },
  { ...y11EconSupplyDemandMeta, questions: y11EconSupplyDemandQuestions },
  { ...y11EconPreliminaryMeta, questions: y11EconPreliminaryQuestions },
  { ...y11PhysPreliminaryMeta, questions: y11PhysPreliminaryQuestions },
  { ...y11EconEssayMeta, questions: y11EconEssayQuestions },
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

export interface YearGroup {
  year: Year;
  isEmpty: boolean;
  units: Unit[];
}

/** newest first */
const byCreatedDesc = (a: Unit, b: Unit) => b.created.localeCompare(a.created);

/** Units grouped by year, each list sorted newest first. */
export function unitsByYear(): YearGroup[] {
  return YEARS.map((year) => {
    const units = UNITS.filter((u) => u.year === year).sort(byCreatedDesc);
    return { year, isEmpty: units.length === 0, units };
  });
}

export type { Unit, UnitMeta };

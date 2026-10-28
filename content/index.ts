import type { Concept, Unit, UnitMeta, Year } from "@/lib/types";

import { tagQuestions } from "./concept-helpers";

import { meta as y11EconSupplyDemandMeta } from "./units/y11-economics-supply-demand/meta";
import { questions as y11EconSupplyDemandQuestions } from "./units/y11-economics-supply-demand/questions";
import { concepts as y11EconSupplyDemandConcepts, retired as y11EconSupplyDemandRetired } from "./units/y11-economics-supply-demand/concepts";
import { conceptOfQuestionId as y11EconSupplyDemandTags } from "./units/y11-economics-supply-demand/concept-tags";
import { meta as y11EconPreliminaryMeta } from "./units/y11-economics-preliminary/meta";
import { questions as y11EconPreliminaryQuestions } from "./units/y11-economics-preliminary/questions";
import { concepts as y11EconPreliminaryConcepts, retired as y11EconPreliminaryRetired } from "./units/y11-economics-preliminary/concepts";
import { conceptOfQuestionId as y11EconPreliminaryTags } from "./units/y11-economics-preliminary/concept-tags";
import { meta as y11PhysPreliminaryMeta } from "./units/y11-physics-preliminary/meta";
import { questions as y11PhysPreliminaryQuestions } from "./units/y11-physics-preliminary/questions";
import { concepts as y11PhysPreliminaryConcepts, retired as y11PhysPreliminaryRetired } from "./units/y11-physics-preliminary/concepts";
import { meta as y11EconEssayMeta } from "./units/y11-economics-essay-scaffold/meta";
import { questions as y11EconEssayQuestions } from "./units/y11-economics-essay-scaffold/questions";
import { concepts as y11EconEssayConcepts, retired as y11EconEssayRetired } from "./units/y11-economics-essay-scaffold/concepts";
import { conceptOfQuestionId as y11EconEssayTags } from "./units/y11-economics-essay-scaffold/concept-tags";

/**
 * The unit registry. This is the ONLY file that imports every unit.
 * To add a unit: create content/units/<id>/{meta,questions,answers}.ts,
 * then add one entry here and one in content/answers/index.ts.
 *
 * PUBLIC — safe to import from client components. No answer keys.
 */
export const UNITS: Unit[] = [
  {
    ...y11EconSupplyDemandMeta,
    questions: tagQuestions(y11EconSupplyDemandQuestions, y11EconSupplyDemandTags),
    concepts: y11EconSupplyDemandConcepts,
    retired: y11EconSupplyDemandRetired,
  },
  {
    ...y11EconPreliminaryMeta,
    questions: tagQuestions(y11EconPreliminaryQuestions, y11EconPreliminaryTags),
    concepts: y11EconPreliminaryConcepts,
    retired: y11EconPreliminaryRetired,
  },
  {
    ...y11PhysPreliminaryMeta,
    questions: y11PhysPreliminaryQuestions,
    concepts: y11PhysPreliminaryConcepts,
    retired: y11PhysPreliminaryRetired,
  },
  {
    ...y11EconEssayMeta,
    questions: tagQuestions(y11EconEssayQuestions, y11EconEssayTags),
    concepts: y11EconEssayConcepts,
    retired: y11EconEssayRetired,
  },
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

/** The concepts a unit has adopted (empty for a unit that has not). */
export function conceptsOf(unit: Unit): Concept[] {
  return unit.concepts ?? [];
}

/** A concept by id, with the unit that owns it. */
export function getConcept(conceptId: string): { unit: Unit; concept: Concept } | undefined {
  for (const unit of UNITS) {
    const concept = unit.concepts?.find((c) => c.id === conceptId);
    if (concept) return { unit, concept };
  }
  return undefined;
}

/**
 * The concept a question counts toward: its own tag, or, for a question that has been
 * removed, the concept recorded in the unit's `retired` map. A question with no tag, a
 * removed question recorded as having none (`null`), and an unknown id all give `undefined`.
 */
export function conceptOfQuestion(unit: Unit, questionId: string): string | undefined {
  const question = unit.questions.find((q) => q.id === questionId);
  if (question) return question.concept;
  return unit.retired?.[questionId] ?? undefined;
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

/** True if the unit was created within the last `days` days (default 3). */
export function unitIsNew(unit: Unit, days = 3, now: Date = new Date()): boolean {
  const created = new Date(unit.created + "T00:00:00").getTime();
  const today = new Date(now.toISOString().slice(0, 10) + "T00:00:00").getTime();
  return Math.round((today - created) / 86_400_000) < days;
}

export type { Unit, UnitMeta };

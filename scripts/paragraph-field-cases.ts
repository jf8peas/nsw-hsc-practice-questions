// Pure helpers for the offline revision loop (spec 007 FR-030, FR-031, research R8): turn answers
// into labelled-test-case SKELETONS in resources/topic010/pilot-essays.json as a "field" set. No
// database, no network and no secrets here, so it is unit-tested. An exported case carries the
// student's WRITING and nothing that identifies them: no name, email, user id, attempt id, row id
// or date. The teacher labels each case (edits `fails`, clears `needsLabel`) before it counts.

import { essays } from "../content/units/y12-economics-paragraph-writing/essays";
import { ESSAYS } from "../content/units/y12-economics-paragraph-writing/questions";
import { PART_ORDER } from "../lib/paragraph/parts";
import type { PartNo } from "../lib/types";

export interface FieldAnswer {
  /** y12-economics-paragraph-writing.e01p3 */
  questionId: string;
  /** The text to label: the try that decided the recorded mark. */
  text: string;
  /** A one-line hint for the labeller, e.g. "marker: (a) met, (b) not met". Never an id or a date. */
  note: string;
}

export interface PilotCase {
  id: string;
  part: (typeof PART_ORDER)[number];
  text: string;
  fails: string[];
  ambiguous: string[];
  needsLabel?: boolean;
  note?: string;
  set?: string;
}
export interface PilotEssay {
  id: string;
  set?: string;
  economy: string;
  type: string;
  question: string;
  directiveVerb: string;
  strategy: string;
  brief: Record<string, unknown>;
  sources: string[];
  models: Record<string, string>;
  markingNotes: Record<string, string>;
  cases: PilotCase[];
}
export interface PilotFile {
  about?: string;
  essays: PilotEssay[];
}

const parse = (questionId: string): { essayId: string; part: PartNo } | null => {
  const m = /\.(e\d{2})p([1-5])$/.exec(questionId);
  return m ? { essayId: m[1], part: Number(m[2]) as PartNo } : null;
};

/** The pilot-format essay entry for a content essay, as a "field" essay. */
export function fieldEssayFor(essayId: string): PilotEssay {
  const key = essays.find((e) => e.essayId === essayId);
  const header = ESSAYS.find((e) => e.essayId === essayId);
  if (!key || !header) throw new Error(`no content essay ${essayId}`);
  const byPart = <T>(rec: Record<PartNo, T>) => Object.fromEntries(PART_ORDER.map((p, i) => [p, rec[(i + 1) as PartNo]])) as Record<string, T>;
  return {
    id: `field-${essayId}`,
    set: "field",
    economy: header.economy,
    type: key.economyType,
    question: header.question,
    directiveVerb: header.verb,
    strategy: key.strategy,
    brief: {
      argument: key.brief.argument,
      counterpoint: key.brief.counterpoint,
      chainSteps: key.brief.chainSteps,
      facts: key.brief.facts,
      limitation: key.brief.limitation,
    },
    sources: [],
    models: byPart(key.models),
    markingNotes: byPart(key.markingNotes),
    cases: [],
  };
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Add the answers to the file as unlabelled field cases (`needsLabel: true`). An answer already in
 * the file (same part, same text) is skipped. Returns the new file object and how many were added.
 */
export function exportFieldCases(file: PilotFile, answers: FieldAnswer[]): { file: PilotFile; added: number; skipped: number } {
  const next: PilotFile = structuredClone(file);
  let added = 0;
  let skipped = 0;
  let counter = next.essays.flatMap((e) => e.cases).filter((c) => c.id.startsWith("field-")).length;
  for (const a of answers) {
    const p = parse(a.questionId);
    if (!p) {
      skipped++;
      continue;
    }
    const part = PART_ORDER[p.part - 1];
    let essay = next.essays.find((e) => e.id === `field-${p.essayId}`);
    if (!essay) {
      essay = fieldEssayFor(p.essayId);
      next.essays.push(essay);
    }
    const duplicate = next.essays.some((e) => e.cases.some((c) => c.part === part && norm(c.text) === norm(a.text)));
    if (duplicate) {
      skipped++;
      continue;
    }
    counter++;
    essay.cases.push({
      id: `field-${p.essayId}-${part}-${counter}`,
      part,
      text: a.text,
      fails: [],
      ambiguous: [],
      needsLabel: true,
      note: a.note,
    });
    added++;
  }
  return { file: next, added, skipped };
}

/** The keys an exported case may have: nothing that could identify a student. */
export const CASE_KEYS = ["id", "part", "text", "fails", "ambiguous", "needsLabel", "note"] as const;

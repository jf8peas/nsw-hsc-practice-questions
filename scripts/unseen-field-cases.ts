// Pure helpers for the offline revision loop of the unseen-text unit (spec 008 FR-036, research R11):
// turn flagged answers into labelled-test-case SKELETONS in resources/english-unseen/pilot-questions.json
// as a "field" set. No database, no network and no secrets here, so it is unit-tested. An exported case
// carries the student's WRITING and nothing that identifies them: no name, email, user id, attempt id,
// row id or date. The teacher labels each case (sets expectMark and expectMissed, clears needsLabel)
// before it counts. Reads the answer key (offline teacher tool: see OFFLINE_KEY_READERS).

import { descriptions } from "../content/units/y12-english-advanced-unseen-texts/descriptions";
import { keys } from "../content/units/y12-english-advanced-unseen-texts/keys";
import { questions } from "../content/units/y12-english-advanced-unseen-texts/questions";
import { texts } from "../content/units/y12-english-advanced-unseen-texts/texts";
import type { UnseenPhaseRow, SkillVerdicts } from "../lib/db/schema";
import type { UnseenQuestion } from "../lib/types";
import { formForPrompt, renderTextForMarker, type UnseenMarkerInput } from "../lib/unseen/marker.server";
import { SKILL_IDS } from "../lib/unseen/skills";
import { countWords } from "../lib/wordcount";

export interface FieldAnswer {
  /** y12-english-advanced-unseen-texts.fs25-q1 */
  questionId: string;
  /** The try to label: the one that decided the recorded mark. */
  text: string;
  /** A one-line hint for the labeller, e.g. "marker: 2/3, missed technique-effect". Never an id or a date. */
  note: string;
}

export interface PilotCase {
  id: string;
  origin: string;
  /** [low, high]; absent until the case is labelled. */
  expectMark?: [number, number];
  expectMissed?: string[];
  allSkillsMet?: boolean;
  answer: string;
  needsLabel?: boolean;
  note?: string;
}

export interface PilotQuestion {
  id: string;
  set?: string;
  anchors?: string[];
  source: string;
  marks: number;
  questionHeading: string;
  question: string;
  directive: string;
  textForm: string;
  visual: boolean;
  text: string;
  criteria: string;
  notes: string;
  suggestedWords: number;
  cases: PilotCase[];
}

export interface PilotFile {
  note?: string;
  questions: PilotQuestion[];
}

const UNIT_PREFIX = "y12-english-advanced-unseen-texts.";
const slugOf = (questionId: string): string | null => (questionId.startsWith(UNIT_PREFIX) ? questionId.slice(UNIT_PREFIX.length) : null);
const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/** The question as the marker is given it: prompt then each part on its own line. */
export const questionText = (q: UnseenQuestion): string => [q.prompt, ...(q.parts ?? []).map((p) => `(${p.label}) ${p.text}`)].join("\n");

/** The pilot-format entry for a content question, as a "field" question with the model answer as its anchor. */
export function fieldQuestionFor(slug: string): PilotQuestion {
  const q = (questions as UnseenQuestion[]).find((x) => x.id === `${UNIT_PREFIX}${slug}`);
  const key = q && keys[q.id];
  const text = q && texts.find((t) => t.id === q.textId);
  if (!q || !key || !text) throw new Error(`no content question ${slug}`);
  const visual = text.body.kind === "image";
  const anchorId = `field-${slug}-model`;
  return {
    id: `field-${slug}`,
    set: "field",
    anchors: [anchorId],
    source: q.source ?? "",
    marks: q.maxMarks,
    questionHeading: text.heading,
    question: questionText(q),
    directive: q.verb,
    textForm: formForPrompt(text.form),
    visual,
    text: visual ? (descriptions[text.id] ?? "") : renderTextForMarker(text),
    criteria: key.criteria,
    notes: key.notes,
    suggestedWords: q.suggestedWords,
    cases: [
      {
        id: anchorId,
        origin: "model answer",
        expectMark: [q.maxMarks, q.maxMarks],
        expectMissed: [],
        allSkillsMet: true,
        answer: key.model,
      },
    ],
  };
}

/**
 * Add the answers to the file as unlabelled field cases (`needsLabel: true`). An answer already in the
 * file (same question, same text) is skipped. Returns the new file object; the input is not changed.
 */
export function exportFieldCases(file: PilotFile, answers: FieldAnswer[]): { file: PilotFile; added: number; skipped: number } {
  const next: PilotFile = structuredClone(file);
  let added = 0;
  let skipped = 0;
  let counter = next.questions.flatMap((q) => q.cases).filter((c) => c.id.startsWith("field-") && !c.id.endsWith("-model")).length;
  for (const a of answers) {
    const slug = slugOf(a.questionId);
    let entry: PilotQuestion | undefined;
    try {
      if (!slug) throw new Error("not an unseen question");
      entry = next.questions.find((q) => q.id === `field-${slug}`) ?? fieldQuestionFor(slug);
    } catch {
      skipped++;
      continue;
    }
    if (!next.questions.includes(entry)) next.questions.push(entry);
    const duplicate = entry.cases.some((c) => norm(c.answer) === norm(a.text));
    if (duplicate || countWords(a.text) < 1) {
      skipped++;
      continue;
    }
    counter++;
    entry.cases.push({ id: `field-${slug}-${counter}`, origin: "student (flagged)", answer: a.text, needsLabel: true, note: a.note });
    added++;
  }
  return { file: next, added, skipped };
}

/** The keys an exported case may have: nothing that could identify a student. */
export const CASE_KEYS = ["id", "origin", "expectMark", "expectMissed", "allSkillsMet", "answer", "needsLabel", "note"] as const;

/** The try that decided the recorded mark: the retry when it scored at least as well. */
export function decidingTry(row: UnseenPhaseRow): { text: string; verdicts: SkillVerdicts; mark: number } {
  if (row.ending === "retried" && row.try2Text && row.try2Verdicts && row.try2Mark !== null && row.try2Mark >= row.try1Mark) {
    return { text: row.try2Text, verdicts: row.try2Verdicts, mark: row.try2Mark };
  }
  return { text: row.try1Text, verdicts: row.try1Verdicts, mark: row.try1Mark };
}

export function noteFor(verdicts: SkillVerdicts, mark: number, maxMarks: number, promptVersion: string | null): string {
  const missed = SKILL_IDS.filter((id) => !verdicts[id]?.met);
  const summary = missed.length ? `missed ${missed.join(", ")}` : "met every skill";
  return `flagged by a student. Marker: ${mark}/${maxMarks}, ${summary}${promptVersion ? `; prompt ${promptVersion}` : ""}. Label what the mark and skills SHOULD be.`;
}

/** The marker input for a stored answer, built the same way as the app builds it (lib/grading.server.ts). */
export function markerInputFor(questionId: string, answer: string): UnseenMarkerInput {
  const q = (questions as UnseenQuestion[]).find((x) => x.id === questionId);
  const key = q && keys[q.id];
  const text = q && texts.find((t) => t.id === q.textId);
  if (!q || !key || !text) throw new Error(`no content question ${questionId}`);
  const visual = text.body.kind === "image";
  const stimulus = visual ? "" : renderTextForMarker(text);
  return {
    maxMarks: q.maxMarks,
    questionHeading: text.heading,
    question: questionText(q),
    verb: q.verb,
    textForm: formForPrompt(text.form),
    visual,
    text: visual ? (descriptions[text.id] ?? "") : stimulus,
    criteria: key.criteria,
    notes: key.notes,
    suggestedWords: q.suggestedWords,
    modelAnswer: key.model,
    stimulus,
    answer,
  };
}

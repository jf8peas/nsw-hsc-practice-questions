// Pure helpers for the offline revision loop of the comparative unit (spec 009 FR-027, research R7, R10): turn real first
// tries into labelled-test-case SKELETONS in resources/english-unseen/pilot-comparative.json as a "field" set, in the
// format scripts/pilot-unseen-marker.py --unit comparative reads (several texts, a choice and each answer's pick). No
// database, network or secret here, so it is unit-tested. An exported case carries the student's WRITING and the texts
// they picked (ids of the question's own public texts) and nothing that identifies them: no name, email, user id, attempt
// id, row id or date. The teacher labels each case (sets expectMark and expectMissed, clears needsLabel) before it counts.
// Reads the answer key (offline teacher tool: see OFFLINE_KEY_READERS).

import { keys } from "../content/units/y12-english-advanced-comparative-texts/keys";
import { questions } from "../content/units/y12-english-advanced-comparative-texts/questions";
import { descriptions } from "../content/units/y12-english-advanced-unseen-texts/descriptions";
import { storeTexts } from "../content/units/y12-english-advanced-unseen-texts/store-texts";
import type { AnySkillVerdicts, UnseenPhaseRow } from "../lib/db/schema";
import { pickedTextIdsOf } from "../lib/comparative/pick";
import type { ComparativeQuestion } from "../lib/types";
import { formForPrompt, renderTextForMarker, type MarkerText, type UnseenMarkerInput } from "../lib/unseen/marker.server";
import { COMPARATIVE_SKILL_IDS, COMPARATIVE_UNIT_ID } from "../lib/unseen/skills";
import { countWords } from "../lib/wordcount";

export interface ComparativeFieldAnswer {
  /** y12-english-advanced-comparative-texts.ab24-q5 */
  questionId: string;
  /** The try to label: the one that decided the recorded mark. */
  text: string;
  /** The texts the student picked on a choice question; absent for a fixed pair. */
  pick?: string[];
  note: string;
}

export interface ComparativePilotText {
  id: string;
  heading: string;
  textForm: string;
  visual: boolean;
  /** The text, or a visual's written description. */
  text: string;
}

export interface ComparativePilotCase {
  id: string;
  origin: string;
  pick?: string[];
  expectMark?: [number, number];
  expectMissed?: string[];
  allSkillsMet?: boolean;
  answer: string;
  needsLabel?: boolean;
  note?: string;
}

export interface ComparativePilotQuestion {
  id: string;
  set?: string;
  anchors?: string[];
  source: string;
  marks: number;
  question: string;
  directive: string;
  choice: { fixed: string[]; from: string[]; pick: number } | null;
  texts: ComparativePilotText[];
  criteria: string;
  notes: string;
  suggestedWords: number;
  cases: ComparativePilotCase[];
}

export interface ComparativePilotFile {
  note?: string;
  questions: ComparativePilotQuestion[];
}

const slugOf = (questionId: string): string | null =>
  questionId.startsWith(`${COMPARATIVE_UNIT_ID}.`) ? questionId.slice(COMPARATIVE_UNIT_ID.length + 1) : null;
const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

const questionOf = (questionId: string): ComparativeQuestion | undefined =>
  (questions as ComparativeQuestion[]).find((q) => q.type === "comparative" && q.id === questionId);

/** The question as the marker is given it: prompt then each part on its own line. */
export const comparativeQuestionText = (q: ComparativeQuestion): string => [q.prompt, ...(q.parts ?? []).map((p) => `(${p.label}) ${p.text}`)].join("\n");

function pilotTextsOf(q: ComparativeQuestion): ComparativePilotText[] {
  const key = keys[q.id];
  return q.textIds.map((id) => {
    const text = storeTexts.find((t) => t.id === id);
    if (!text) throw new Error(`no text ${id}`);
    const visual = text.body.kind === "image";
    const description = (key as { visuals?: Record<string, { description: string }> } | undefined)?.visuals?.[id]?.description ?? descriptions[id] ?? "";
    return { id, heading: text.heading, textForm: formForPrompt(text.form), visual, text: visual ? description : renderTextForMarker(text) };
  });
}

/** The pilot-format entry for a content question, as a "field" question with the model answer as its anchor. */
export function comparativeFieldQuestionFor(slug: string): ComparativePilotQuestion {
  const q = questionOf(`${COMPARATIVE_UNIT_ID}.${slug}`);
  const key = q && keys[q.id];
  if (!q || !key) throw new Error(`no content question ${slug}`);
  const anchorId = `field-${slug}-model`;
  return {
    id: `field-${slug}`,
    set: "field",
    anchors: [anchorId],
    source: q.source ?? "",
    marks: q.maxMarks,
    question: comparativeQuestionText(q),
    directive: q.verb,
    choice: q.choice,
    texts: pilotTextsOf(q),
    criteria: key.criteria,
    notes: key.notes,
    suggestedWords: q.suggestedWords,
    cases: [
      {
        id: anchorId,
        origin: "model answer",
        // the model answer is an example for ONE pairing: its pick is the key's pairing minus the fixed texts
        ...(q.choice ? { pick: key.pairing.filter((id) => q.choice!.from.includes(id)) } : {}),
        expectMark: [q.maxMarks, q.maxMarks],
        expectMissed: [],
        allSkillsMet: true,
        answer: key.model,
      },
    ],
  };
}

/**
 * Add the answers to the file as unlabelled field cases (`needsLabel: true`). An answer already in the file (same question,
 * same text, same pick) is skipped. Returns the new file object; the input is not changed.
 */
export function exportComparativeFieldCases(file: ComparativePilotFile, answers: ComparativeFieldAnswer[]): { file: ComparativePilotFile; added: number; skipped: number } {
  const next: ComparativePilotFile = structuredClone(file);
  let added = 0;
  let skipped = 0;
  let counter = next.questions.flatMap((q) => q.cases).filter((c) => c.id.startsWith("field-") && !c.id.endsWith("-model")).length;
  for (const a of answers) {
    const slug = slugOf(a.questionId);
    let entry: ComparativePilotQuestion | undefined;
    try {
      if (!slug) throw new Error("not a comparative question");
      entry = next.questions.find((q) => q.id === `field-${slug}`) ?? comparativeFieldQuestionFor(slug);
    } catch {
      skipped++;
      continue;
    }
    if (!next.questions.includes(entry)) next.questions.push(entry);
    const pick = a.pick ? [...a.pick].sort() : undefined;
    const duplicate = entry.cases.some((c) => norm(c.answer) === norm(a.text) && JSON.stringify([...(c.pick ?? [])].sort()) === JSON.stringify(pick ?? []));
    if (duplicate || countWords(a.text) < 1) {
      skipped++;
      continue;
    }
    counter++;
    entry.cases.push({ id: `field-${slug}-${counter}`, origin: "student (first try)", ...(a.pick ? { pick: a.pick } : {}), answer: a.text, needsLabel: true, note: a.note });
    added++;
  }
  return { file: next, added, skipped };
}

/** The keys an exported case may have: nothing that could identify a student. */
export const COMPARATIVE_CASE_KEYS = ["id", "origin", "pick", "expectMark", "expectMissed", "allSkillsMet", "answer", "needsLabel", "note"] as const;

/** The try that decided the recorded mark: the retry when it scored at least as well. */
export function comparativeDecidingTry(row: UnseenPhaseRow): { text: string; verdicts: AnySkillVerdicts; mark: number } {
  if (row.ending === "retried" && row.try2Text && row.try2Verdicts && row.try2Mark !== null && row.try2Mark >= row.try1Mark) {
    return { text: row.try2Text, verdicts: row.try2Verdicts, mark: row.try2Mark };
  }
  return { text: row.try1Text, verdicts: row.try1Verdicts, mark: row.try1Mark };
}

export function comparativeNoteFor(verdicts: AnySkillVerdicts, mark: number, maxMarks: number, promptVersion: string | null): string {
  const missed = COMPARATIVE_SKILL_IDS.filter((id) => verdicts[id as keyof AnySkillVerdicts] !== undefined && !verdicts[id as keyof AnySkillVerdicts]!.met);
  const summary = missed.length ? `missed ${missed.join(", ")}` : "met every skill";
  return `first try. Marker: ${mark}/${maxMarks}, ${summary}${promptVersion ? `; prompt ${promptVersion}` : ""}. Label what the mark and skills SHOULD be.`;
}

/** The marker input for a stored answer, built the same way as the app builds it (lib/grading.server.ts markComparative). */
export function comparativeMarkerInputFor(questionId: string, answer: string, pick: readonly string[] | undefined): UnseenMarkerInput {
  const q = questionOf(questionId);
  const key = q && keys[q.id];
  if (!q || !key) throw new Error(`no content question ${questionId}`);
  const ids = pickedTextIdsOf(q, pick);
  if (!ids) throw new Error(`no valid pick for ${questionId}`);
  const all = pilotTextsOf(q);
  const markerTexts: MarkerText[] = ids.map((id) => {
    const t = all.find((x) => x.id === id)!;
    return { heading: t.heading, textForm: t.textForm, visual: t.visual, text: t.text };
  });
  return {
    maxMarks: q.maxMarks,
    questionHeading: "",
    question: comparativeQuestionText(q),
    verb: q.verb,
    textForm: "",
    visual: false,
    text: "",
    texts: markerTexts,
    criteria: key.criteria,
    notes: key.notes,
    suggestedWords: q.suggestedWords,
    modelAnswer: key.model,
    stimulus: markerTexts.filter((t) => !t.visual).map((t) => t.text).join("\n\n"),
    answer,
  };
}

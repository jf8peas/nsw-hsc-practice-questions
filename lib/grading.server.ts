import "server-only";

import { getQuestion, getUnit } from "@/content";
import { getAnswer } from "@/content/answers";
import type { ReviewMaterial } from "@/lib/concepts/port";
import type { AnySkillVerdicts, RewriteDisplayData } from "@/lib/db/schema";
import type {
  GradeResult,
  RewriteCreditedSpan,
  RewriteDiscussion,
  RewriteGradeResult,
  RewriteHint,
} from "@/lib/grading";
import { gradeRewrite, gradeShortAnswer } from "@/lib/openrouter.server";
import { verbDefinition } from "@/content/glossary";
import { markWithModel } from "@/lib/paragraph/marker.server";
import { PARTS, partKeyOf } from "@/lib/paragraph/parts";
import { buildVerdicts, markOf, phase2Mark } from "@/lib/paragraph/scoring";
import type { ParagraphDiscussion, ParagraphQuestionView } from "@/lib/paragraph/types";
import { rewriteScore } from "@/lib/rewrite-scoring";
import type { Answer, ComparativeKey, ComparativeQuestion, ParagraphQuestion, PartNo, UnseenKey, UnseenQuestion, UnseenText } from "@/lib/types";
import { pickedTextIdsOf } from "@/lib/comparative/pick";
import { COMPARATIVE_MAX_TOKENS, comparativeRubric } from "@/lib/comparative/rubric";
import type { ComparativeDiscussion } from "@/lib/comparative/types";
import { formForPrompt, markWithModel as markUnseenWithModel, renderTextForMarker, type MarkerText } from "@/lib/unseen/marker.server";
import { COMPARATIVE_SKILL_IDS } from "@/lib/unseen/skills";
import { cappedMark } from "@/lib/unseen/scoring";
import type { UnseenDiscussion } from "@/lib/unseen/types";
import { countWords } from "@/lib/wordcount";
import { markEssayWithModel, type ParsedEssayReply } from "@/lib/essay/marker.server";
import { finalMark } from "@/lib/essay/scoring";
import type { PublicEssay } from "@/lib/essay/types";
import { directiveInfo } from "@/content/units/y12-english-essay-writing/directives";
import { markEnglishEssayWithModel, type EnglishMarkerOutput } from "@/lib/english-essay/marker.server";
import type { PublicEnglishEssay } from "@/lib/english-essay/types";
import type { EnglishEssayKey, EnglishEssayQuestion, EssayQuestion, EssayQuestionKey } from "@/lib/types";
import type { ParagraphVerdicts } from "@/lib/db/schema";

export interface GradeOptions {
  /** MC only: optionOrder[displayIndex] = original option index (from the attempt). */
  optionOrder?: number[];
  /** Do not call the LLM (the database is unavailable, so the daily cap cannot be reserved). */
  skipLlm?: boolean;
  /** The answer was handwritten and transcribed from photos: credit working and method, ignore crossed-out work. */
  handwritten?: boolean;
}

/**
 * Answer-key material for the questions tagged with a concept: their public prompts plus the
 * model answers, rubric points and correct options. For the concept REVIEWER only (spec 002
 * FR-024): the caller passes it to a model and discards it. It must never be stored, logged
 * or returned to a client (constitution Principle I). Together with `getOptionExplanation`,
 * this is the only route by which concept code reads `content/answers`.
 */
export function getReviewMaterial(unitId: string, conceptId: string): ReviewMaterial | null {
  const unit = getUnit(unitId);
  if (!unit) return null;
  return {
    questions: unit.questions
      .filter((q) => q.concept === conceptId)
      .map((q) => {
        const key = getAnswer(q.id);
        const correctText =
          q.type === "mc"
            ? (key?.correctText ?? (typeof key?.correctIndex === "number" ? q.options[key.correctIndex] : undefined))
            : undefined;
        return {
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          modelAnswer: key?.modelAnswer,
          rubric: key?.rubric ?? [],
          correctText,
        };
      }),
  };
}

/**
 * Answer-key material for the self-mark screen when a photo read fails (spec 004 FR-019):
 * the model answer, rubric and max marks, so the student can mark their photo answer
 * themselves. This is the same material the grade route returns for self-marking today.
 * Lives here (not in the transcribe route) so the answer key is only ever read through
 * this module (spec 002 FR-043).
 */
export function getSelfMarkMaterial(questionId: string): {
  modelAnswer?: string;
  rubric: string[];
  maxMarks?: number;
} {
  const found = getQuestion(questionId);
  const key = getAnswer(questionId);
  return {
    modelAnswer: key?.modelAnswer,
    rubric: key?.rubric ?? [],
    maxMarks: found?.question.maxMarks,
  };
}

/**
 * Why a wrong multiple-choice option is wrong (spec 002 FR-039 to FR-043), or undefined when
 * there is nothing to show: not an MC question, the unit's explanations are not complete, the
 * chosen option is the correct one, or that option has no written explanation. The explanation
 * is keyed by option text (options are shuffled per attempt) and is read from the key at the
 * time of asking, so an old attempt shows the current wording.
 */
export function getOptionExplanation(questionId: string, chosenOptionText: string): string | undefined {
  const found = getQuestion(questionId);
  if (!found || found.question.type !== "mc" || !found.unit.explanationsComplete) return undefined;
  const key = getAnswer(questionId);
  if (!key) return undefined;
  const q = found.question;
  const correctText =
    key.correctText ?? (typeof key.correctIndex === "number" ? q.options[key.correctIndex] : undefined);
  if (chosenOptionText === correctText) return undefined;
  return key.wrongExplanations?.[chosenOptionText];
}

export interface Graded {
  result: GradeResult;
  /** What to store as the answer: the chosen option's text for MC, the student's text for short. */
  answerText: string;
  /** How it was marked, as stored. Meaningless while the result still needs a self-mark. */
  gradedBy: "auto" | "llm";
}

/**
 * Grade one answer. Runs only on the server so the answer key never reaches
 * the browser.
 *
 * MC is marked here directly: `answer` is the DISPLAY index, mapped to the
 * original option through the attempt's option order. Short answers go to the
 * LLM grader (OpenRouter) when it is configured; otherwise the client falls
 * back to student self-marking against the model answer.
 */
export async function gradeAnswer(
  questionId: string,
  answer: string,
  options: GradeOptions = {},
): Promise<Graded | null> {
  const found = getQuestion(questionId);
  const key = getAnswer(questionId);
  if (!found || !key) return null;

  const { question } = found;

  if (question.type === "mc") {
    const count = question.options.length;
    const order = options.optionOrder ?? question.options.map((_, i) => i);
    const displayIndex = Number.parseInt(answer, 10);
    const original = order[displayIndex];
    if (
      !Number.isInteger(displayIndex) ||
      original === undefined ||
      original < 0 ||
      original >= count
    ) {
      throw new RangeError("invalid option index");
    }
    const correctIndex =
      key.correctText !== undefined
        ? question.options.indexOf(key.correctText)
        : (key.correctIndex ?? -1);
    const correct = original === correctIndex && correctIndex >= 0;
    const optionExplanation = correct ? undefined : getOptionExplanation(questionId, question.options[original]);
    return {
      result: {
        questionId,
        type: "mc",
        maxMarks: question.maxMarks,
        marksAwarded: correct ? question.maxMarks : 0,
        correctDisplayIndex: correctIndex >= 0 ? order.indexOf(correctIndex) : undefined,
        rubric: key.rubric,
        ...(optionExplanation ? { optionExplanation } : {}),
        needsSelfMark: false,
      },
      answerText: question.options[original],
      gradedBy: "auto",
    };
  }

  // short answer
  const base = {
    questionId,
    type: "short" as const,
    maxMarks: question.maxMarks,
    modelAnswer: key.modelAnswer,
    rubric: key.rubric,
    notes: key.notes,
  };

  if (!answer.trim()) {
    return {
      result: { ...base, marksAwarded: 0, feedback: "No answer was submitted.", needsSelfMark: false },
      answerText: answer,
      gradedBy: "auto",
    };
  }

  if (options.skipLlm) {
    return {
      result: { ...base, marksAwarded: null, feedback: "", needsSelfMark: true },
      answerText: answer,
      gradedBy: "llm",
    };
  }

  const llm = await gradeShortAnswer({
    formula: question.formula,
    prompt: question.prompt,
    modelAnswer: key.modelAnswer ?? "",
    rubric: key.rubric,
    maxMarks: question.maxMarks,
    answer,
    markingGuidance: key.notes,
    handwritten: options.handwritten,
  });

  if (llm) {
    return {
      result: {
        ...base,
        marksAwarded: llm.marksAwarded,
        feedback: llm.feedback,
        rubricHits: llm.rubricHits,
        rubricMisses: llm.rubricMisses,
        gradedBy: llm.gradedBy,
        needsSelfMark: false,
      },
      answerText: answer,
      gradedBy: "llm",
    };
  }

  // No LLM (not configured, or the call failed twice) — student self-marks.
  return {
    result: { ...base, marksAwarded: null, feedback: "", needsSelfMark: true },
    answerText: answer,
    gradedBy: "llm",
  };
}

// ---- rewrite grading (spec 005) ----------------------------------------------

export const REWRITE_WORD_LIMIT = 25;

/** Normalise for span matching: trim and collapse runs of whitespace (incl. newlines) to one space. */
function normaliseForSpan(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * spec 006 FR-032: a credited span is kept only when it is found in the student's sentence —
 * exact characters after case- and whitespace-normalisation (so "Subsidies" matches "subsidies"
 * and a span split across a line break matches).
 */
function spanFoundIn(sentence: string, span: string): boolean {
  const s = normaliseForSpan(sentence).toLowerCase();
  const t = normaliseForSpan(span).toLowerCase();
  return t.length > 0 && t.length <= s.length && s.includes(t);
}

export interface RewriteGraded {
  result: RewriteGradeResult;
  /** What to store as the answer: the final sentence. */
  answerText: string;
  gradedBy: "auto" | "llm";
}

/**
 * The discussion material (FR-018): the model sentences and every target term with its
 * definition and why it fits this sentence. Read from the key at grade time; never stored.
 */
/** The target-term concept ids of a rewrite question (for the self-mark token, FR-046). */
export function rewriteTermConceptIds(questionId: string): string[] {
  const key = getAnswer(questionId);
  return key?.targetTerms?.map((t) => t.conceptId) ?? [];
}

/** The discussion material for a rewrite question, or undefined if it is not one / has no key. */
export function rewriteDiscussionOrNull(questionId: string): RewriteDiscussion | undefined {
  const key = getAnswer(questionId);
  return key ? buildRewriteDiscussion(key) : undefined;
}

export function buildRewriteDiscussion(key: Answer): RewriteDiscussion {
  return {
    modelSentences: key.modelSentences ?? [],
    terms: (key.targetTerms ?? []).map((t) => ({
      term: t.term,
      definition: t.definition,
      why: t.why,
      conceptId: t.conceptId,
    })),
  };
}

/**
 * Grade one rewrite answer (spec 005). The model returns only the judgements code cannot
 * compute (criterion A, padding, per-term status, feedback); code computes the word count,
 * criterion C, the all-or-nothing criterion B, the marks, the phase 2 cap and the hint.
 */
export async function gradeRewriteAnswer(
  questionId: string,
  answer: string,
  phase: 1 | 2,
  options: { skipLlm?: boolean } = {},
): Promise<RewriteGraded | null> {
  const found = getQuestion(questionId);
  const key = getAnswer(questionId);
  if (!found || !key || found.question.type !== "rewrite" || !key.targetTerms) return null;
  const { question } = found;

  const wordCount = countWords(answer);
  const base = {
    questionId,
    type: "rewrite" as const,
    maxMarks: 3 as const,
    phase,
    feedback: "",
    termOutcomes: key.targetTerms.map((t) => ({ conceptId: t.conceptId, correct: false })),
    needsSelfMark: false,
  };

  if (!answer.trim()) {
    return {
      result: { ...base, marksAwarded: 0, feedback: "No answer was submitted." },
      answerText: answer,
      gradedBy: "auto",
    };
  }

  if (options.skipLlm) {
    return {
      result: { ...base, marksAwarded: null, feedback: "", needsSelfMark: true },
      answerText: answer,
      gradedBy: "llm",
    };
  }

  const llm = await gradeRewrite({
    prompt: question.prompt,
    targetTerms: key.targetTerms.map((t) => ({
      term: t.term,
      definition: t.definition,
      equivalents: t.equivalents,
      misuses: t.misuses,
    })),
    answer,
  });

  if (!llm) {
    return {
      result: { ...base, marksAwarded: null, feedback: "", needsSelfMark: true },
      answerText: answer,
      gradedBy: "llm",
    };
  }

  // code computes the marks from the per-term status and criteria A/C (research R4; 2026-11-03 fix)
  const criterionA = llm.criterionA;
  const criterionC = wordCount <= REWRITE_WORD_LIMIT && !llm.padding;
  const byTerm = new Map(llm.terms.map((t) => [t.term, t]));
  const termCount = key.targetTerms.length;
  const termsUsed = key.targetTerms.filter((t) => byTerm.get(t.term)?.status === "used").length;
  const marksAwarded = rewriteScore({
    totalMarks: question.maxMarks,
    termCount,
    termsUsed,
    criterionA,
    criterionC,
    phase,
  });

  // spec 006 FR-031/FR-032: a credited span is kept only when its term was credited AND the span
  // is found in the student's sentence (case-insensitive, whitespace-normalised substring match).
  const creditedSpans: RewriteCreditedSpan[] = [];
  for (const t of key.targetTerms) {
    const entry = byTerm.get(t.term);
    const span = entry?.span;
    if (
      entry?.status === "used" &&
      typeof span === "string" &&
      span.length > 0 &&
      span.length <= 200 &&
      spanFoundIn(answer, span)
    ) {
      creditedSpans.push({ conceptId: t.conceptId, span });
    }
  }

  // spec 006 FR-033: phase 2 term outcomes drive the "Added in retry" / "Not used" pills. Display
  // only; concept tracking still comes from phase 1 (termOutcomes above).
  const phase2TermOutcomes =
    phase === 2
      ? key.targetTerms.map((t) => ({
          conceptId: t.conceptId,
          correct: byTerm.get(t.term)?.status === "used",
        }))
      : undefined;

  // spec 006 FR-034: the language note applies to the final sentence only (phase 2, or phase 1 at
  // 3/3). It is already validated by parseRewriteJson; absent → nothing shown.
  const languageNote = phase === 2 || marksAwarded === question.maxMarks ? llm.languageNote : undefined;

  const result: RewriteGradeResult = {
    ...base,
    marksAwarded,
    feedback: llm.feedback,
    termOutcomes: key.targetTerms.map((t) => ({
      conceptId: t.conceptId,
      correct: byTerm.get(t.term)?.status === "used",
    })),
    ...(creditedSpans.length > 0 ? { creditedSpans } : {}),
    ...(phase2TermOutcomes ? { phase2TermOutcomes } : {}),
    ...(languageNote ? { languageNote } : {}),
  };

  if (phase === 1 && marksAwarded < question.maxMarks) {
    const missed = key.targetTerms.filter((t) => byTerm.get(t.term)?.status !== "used");
    if (missed.length > 0) {
      result.hint = { terms: missed.map((t) => ({ term: t.term, definition: t.definition })) };
    } else {
      // every term used but (a) or (c) lost (FR-045)
      result.hint = {
        terms: [],
        lostCriterion: criterionA ? "c" : "a",
        criterionText: criterionA
          ? "Cut your sentence to 25 words or fewer."
          : "Keep the meaning and the cause and effect of the original sentence.",
      };
    }
  }

  if (phase === 2 || (phase === 1 && marksAwarded === question.maxMarks)) {
    result.discussion = buildRewriteDiscussion(key);
  }

  return { result, answerText: answer, gradedBy: "llm" };
}

/**
 * The rewrite state a resume may see (spec 005 FR-021, FR-023): built server-side from a phase
 * row and the answer key, so the browser only ever gets what that stage allows — nothing from
 * the key before a phase 1 grade, the hint at a phase 1 under 3, the discussion once final.
 * This is the ONLY route by which the quiz page reads the answer key.
 */
export function rewriteResumeState(
  questionId: string,
  phaseRow: {
    status: "phase1" | "phase2" | "final";
    phase1Answer: string;
    phase1Marks: number;
    phase1Feedback: string | null;
    phase1TermOutcomes: Array<{ conceptId: string; correct: boolean }> | null;
    phase2Answer: string | null;
    phase2Marks: number | null;
    phase2Feedback: string | null;
    recordedMark: number | null;
    /** spec 006: the display-only grading data (FR-054). */
    displayData?: RewriteDisplayData | null;
    /** spec 006: the per-phase drafts (FR-053). */
    drafts?: { phase1Draft: string; phase2Draft: string } | null;
  },
): {
  phase: "phase1" | "phase2" | "final";
  phase1Answer: string;
  phase1Marks?: number;
  phase1Feedback?: string;
  phase1TermOutcomes?: Array<{ conceptId: string; correct: boolean }>;
  phase1CreditedSpans?: Array<{ conceptId: string; span: string }>;
  phase2Answer?: string;
  phase2Marks?: number;
  phase2Feedback?: string;
  phase2CreditedSpans?: Array<{ conceptId: string; span: string }>;
  phase2TermOutcomes?: Array<{ conceptId: string; correct: boolean }>;
  languageNote?: { spelling?: Array<{ wrong: string; fix: string }>; grammar?: string };
  marks?: number;
  hint?: RewriteHint;
  discussion?: RewriteDiscussion;
  phase1Draft?: string;
  phase2Draft?: string;
} {
  const key = getAnswer(questionId);
  const spansOf = (map: Record<string, string> | undefined) =>
    map && Object.keys(map).length > 0
      ? Object.entries(map).map(([conceptId, span]) => ({ conceptId, span }))
      : undefined;
  const state: ReturnType<typeof rewriteResumeState> = {
    phase: phaseRow.status,
    phase1Answer: phaseRow.phase1Answer,
    phase1Marks: phaseRow.phase1Marks,
    ...(phaseRow.phase1Feedback ? { phase1Feedback: phaseRow.phase1Feedback } : {}),
    ...(phaseRow.phase1TermOutcomes ? { phase1TermOutcomes: phaseRow.phase1TermOutcomes } : {}),
    ...(spansOf(phaseRow.displayData?.phase1?.spanByTerm)
      ? { phase1CreditedSpans: spansOf(phaseRow.displayData?.phase1?.spanByTerm) }
      : {}),
    ...(phaseRow.phase2Answer ? { phase2Answer: phaseRow.phase2Answer } : {}),
    ...(phaseRow.phase2Marks !== null && phaseRow.phase2Marks !== undefined ? { phase2Marks: phaseRow.phase2Marks } : {}),
    ...(phaseRow.phase2Feedback ? { phase2Feedback: phaseRow.phase2Feedback } : {}),
    ...(spansOf(phaseRow.displayData?.phase2?.spanByTerm)
      ? { phase2CreditedSpans: spansOf(phaseRow.displayData?.phase2?.spanByTerm) }
      : {}),
    ...(phaseRow.displayData?.phase2TermOutcomes ? { phase2TermOutcomes: phaseRow.displayData.phase2TermOutcomes } : {}),
    ...(phaseRow.displayData?.languageNote ? { languageNote: phaseRow.displayData.languageNote } : {}),
    ...(phaseRow.recordedMark !== null ? { marks: phaseRow.recordedMark } : { marks: phaseRow.phase1Marks }),
    ...(phaseRow.drafts?.phase1Draft ? { phase1Draft: phaseRow.drafts.phase1Draft } : {}),
    ...(phaseRow.drafts?.phase2Draft ? { phase2Draft: phaseRow.drafts.phase2Draft } : {}),
  };
  if (phaseRow.status === "phase1" && phaseRow.phase1Marks < 3 && key?.targetTerms) {
    const outcomes = new Map((phaseRow.phase1TermOutcomes ?? []).map((o) => [o.conceptId, o.correct]));
    const missed = key.targetTerms.filter((t) => outcomes.get(t.conceptId) === false);
    if (missed.length > 0) {
      state.hint = { terms: missed.map((t) => ({ term: t.term, definition: t.definition })) };
    } else {
      const over = countWords(phaseRow.phase1Answer) > REWRITE_WORD_LIMIT;
      state.hint = {
        terms: [],
        lostCriterion: over ? "c" : "a",
        criterionText: over
          ? "Cut your sentence to 25 words or fewer."
          : "Keep the meaning and the cause and effect of the original sentence.",
      };
    }
  }
  if (phaseRow.status === "final" && key) state.discussion = buildRewriteDiscussion(key);
  return state;
}


// ---- paragraph writing (spec 007) ----------------------------------------------------------
//
// The ONLY readers of an essay's key. What each export may release, and when (constitution
// Principle I, 2.14.0):
//   paragraphQuestionView  before phase 1 is marked: the brief, which fields the part uses, the
//                          guidance lines, the verb definition and the model text of the EARLIER
//                          parts of the same essay. Never the current part's model, never a later
//                          part's, never the marking notes.
//   paragraphDiscussion    at the discussion or the self-mark screen: the current model part and
//                          its commentary, the models up to and including this part, and LABELS
//                          (never text) for the later parts.
//   markParagraph          sends the current model and the marking notes to the model provider and
//                          returns verdicts only; nothing from the key is in its return value.

function paragraphKey(questionId: string): { question: ParagraphQuestion; essay: NonNullable<Answer["paragraph"]>["essay"]; part: PartNo; unitId: string } | null {
  const found = getQuestion(questionId);
  const key = getAnswer(questionId)?.paragraph;
  if (!found || found.question.type !== "paragraph" || !key) return null;
  return { question: found.question, essay: key.essay, part: key.part, unitId: found.unit.id };
}

const PART_NOS: PartNo[] = [1, 2, 3, 4, 5];

function essayTotalOf(unitId: string): number {
  const unit = getUnit(unitId);
  return Math.floor((unit?.questions.filter((q) => q.type === "paragraph").length ?? 0) / 5);
}

/** What the question screen may show before phase 1 is marked. */
export function paragraphQuestionView(questionId: string): ParagraphQuestionView | null {
  const k = paragraphKey(questionId);
  if (!k) return null;
  const { question, essay, part } = k;
  const info = PARTS[partKeyOf(part)];
  return {
    essayNo: question.essayNo,
    essayTotal: essayTotalOf(k.unitId),
    part,
    partName: info.name,
    limit: info.limit,
    verbDefinition: verbDefinition(question.verb) ?? "",
    guidance: essay.guidance[part],
    brief: {
      economy: essay.brief.economy,
      argument: essay.brief.argument,
      counterpoint: essay.brief.counterpoint,
      chainSteps: [...essay.brief.chainSteps],
      facts: [...essay.brief.facts],
      limitation: [...essay.brief.limitation],
    },
    uses: [...essay.uses[part]],
    earlier: PART_NOS.filter((n) => n < part).map((n) => ({
      part: n,
      label: `${n} · ${PARTS[partKeyOf(n)].name}`,
      text: essay.models[n],
    })),
    parts: PART_NOS.map((n) => ({
      part: n,
      short: PARTS[partKeyOf(n)].short,
      state: n < part ? "done" : n === part ? "current" : "later",
    })),
  };
}

const whenLabel = (distance: number): string =>
  distance === 1 ? "NEXT QUIZ" : distance === 2 ? "QUIZ AFTER" : `IN ${distance} QUIZZES`;

/** What the discussion (or the self-mark screen) may show. */
export function paragraphDiscussion(questionId: string): ParagraphDiscussion | null {
  const k = paragraphKey(questionId);
  if (!k) return null;
  const { question, essay, part } = k;
  const unit = getUnit(k.unitId);
  const hasNextEssay = (unit?.questions ?? []).some((q) => q.type === "paragraph" && q.essayNo === question.essayNo + 1);
  return {
    modelPart: essay.models[part],
    commentary: essay.commentary[part],
    modelWords: countWords(essay.models[part]),
    modelSoFar: PART_NOS.filter((n) => n <= part).map((n) => ({
      part: n,
      label: `${n} · ${PARTS[partKeyOf(n)].name}`,
      text: essay.models[n],
      current: n === part,
    })),
    laterSlots: PART_NOS.filter((n) => n > part).map((n) => ({
      part: n,
      label: `${n} · ${PARTS[partKeyOf(n)].short.toUpperCase()}`,
      when: whenLabel(n - part),
    })),
    next:
      part < 5
        ? { kind: "part", essayNo: question.essayNo, part: (part + 1) as PartNo, name: PARTS[partKeyOf((part + 1) as PartNo)].name }
        : hasNextEssay
          ? { kind: "essay", essayNo: question.essayNo + 1, part: 1, name: PARTS.topic.name }
          : { kind: "none" },
  };
}

export interface ParagraphMarked {
  verdicts: ParagraphVerdicts;
  /** 0..4 at phase 1; 0..3 at phase 2 (the cap is applied here). */
  mark: number;
  feedback: string;
  wordCount: number;
  promptVersion: string;
  model: string;
}

/**
 * Mark one paragraph part. Returns null when the marker is unavailable (the caller self-marks at
 * phase 1 and keeps the first-try mark at phase 2). The word-limit half of criterion (d), the mark
 * and the phase 2 cap are computed in code (research R4).
 */
export async function markParagraph(
  questionId: string,
  answer: string,
  phase: 1 | 2,
  options: { skipLlm?: boolean } = {},
): Promise<ParagraphMarked | null> {
  const k = paragraphKey(questionId);
  if (!k || options.skipLlm) return null;
  const { question, essay, part } = k;
  const partKey = partKeyOf(part);
  const out = await markWithModel({
    part: partKey,
    question: question.prompt,
    verb: question.verb,
    economy: question.economy,
    economyType: essay.economyType,
    strategy: essay.strategy,
    brief: essay.brief,
    earlierModels: PART_NOS.filter((n) => n < part).map((n) => essay.models[n]),
    model: essay.models[part],
    markingNotes: essay.markingNotes[part],
    answer,
  });
  if (!out) return null;
  const wordCount = countWords(answer);
  const verdicts = buildVerdicts(out.raw, wordCount, PARTS[partKey].limit);
  const raw = markOf(verdicts);
  return {
    verdicts,
    mark: phase === 2 ? phase2Mark(raw) : raw,
    feedback: out.raw.feedback,
    wordCount,
    promptVersion: out.promptVersion,
    model: out.model,
  };
}

/** The part key and number of a paragraph question, for the grade handler (no key text). */
export function paragraphPartOf(questionId: string): { part: PartNo; unitId: string } | null {
  const k = paragraphKey(questionId);
  return k ? { part: k.part, unitId: k.unitId } : null;
}

// ---- unseen-text short answers (spec 008) ----------------------------------------------------------
//
// The ONLY readers of an unseen-text question's key. What each export may release (constitution
// Principle I, 2.15.0):
//   markUnseen        sends the criteria, notes, model answer and (for a visual text) its written
//                     description to the model provider and returns verdicts only; nothing from the key
//                     is in its return value.
//   unseenDiscussion  the model answer, for the discussion of a FINAL attempt only. The caller must
//                     check the phase row is final; this function never decides that.
// The criteria, notes and description are never returned by any function.

function unseenKeyOf(questionId: string): { question: UnseenQuestion; text: UnseenText; key: UnseenKey } | null {
  const found = getQuestion(questionId);
  const key = getAnswer(questionId)?.unseen;
  if (!found || found.question.type !== "unseen" || !key) return null;
  const question = found.question;
  const text = found.unit.texts?.find((t) => t.id === question.textId);
  if (!text) return null;
  return { question, text, key };
}

export interface UnseenMarked {
  /** Seven verdicts for a spec 008 question; nine for a comparative one (spec 009). */
  verdicts: AnySkillVerdicts;
  /** 0..maxMarks at the first try; 0..maxMarks-1 at the retry (the cap is applied here). */
  mark: number;
  feedback: string;
  biggestGap: string;
  /** First try at full marks only; null otherwise (the retry is capped below full marks). */
  goFurther: string | null;
  wordCount: number;
  promptVersion: string;
  model: string;
}

/**
 * Mark one unseen-text answer. Returns null when the marker is unavailable (the caller returns the
 * editable box and never invents a mark or self-marks). The retry cap is applied in code.
 */
export async function markUnseen(
  questionId: string,
  answer: string,
  phase: 1 | 2,
  options: { skipLlm?: boolean } = {},
): Promise<UnseenMarked | null> {
  const k = unseenKeyOf(questionId);
  if (!k || options.skipLlm) return null;
  const { question, text, key } = k;
  const visual = text.body.kind === "image";
  const stimulus = visual ? "" : renderTextForMarker(text);
  const out = await markUnseenWithModel({
    maxMarks: question.maxMarks,
    questionHeading: text.heading,
    question: [question.prompt, ...(question.parts ?? []).map((p) => `(${p.label}) ${p.text}`)].join("\n"),
    verb: question.verb,
    textForm: formForPrompt(text.form),
    visual,
    text: visual ? (key.visual?.description ?? "") : stimulus,
    criteria: key.criteria,
    notes: key.notes,
    suggestedWords: question.suggestedWords,
    modelAnswer: key.model,
    stimulus,
    answer,
  });
  if (!out) return null;
  return {
    verdicts: out.reply.skills,
    mark: phase === 2 ? cappedMark(out.reply.mark, question.maxMarks) : out.reply.mark,
    feedback: out.reply.feedback,
    biggestGap: out.reply.biggestGap,
    goFurther: phase === 1 && out.reply.mark === question.maxMarks ? out.reply.goFurther : null,
    wordCount: countWords(answer),
    promptVersion: out.promptVersion,
    model: out.model,
  };
}

/** The model answer for the discussion of a final attempt (never the criteria, notes or description). */
export function unseenDiscussion(questionId: string): UnseenDiscussion | null {
  const k = unseenKeyOf(questionId);
  if (!k) return null;
  return { modelAnswer: k.key.model, modelWords: countWords(k.key.model) };
}

// ---- the comparative unit (spec 009) ------------------------------------------------------------
//   markComparative   sends the criteria, notes, model answer and, for a picked visual text, its written
//                     description to the model provider and returns verdicts only; it is given ONLY the texts the
//                     student wrote about (a choice question's pick, or both texts of a fixed pair), so an unpicked
//                     allowed text's words and description never leave the server for the provider either.
//   comparativeDiscussion  (spec 009 T042) the model answer and, for a choice question, its pairing, for the
//                     discussion of a FINAL attempt only; the caller must check the phase row is final.

function comparativeKeyOf(questionId: string): { question: ComparativeQuestion; texts: UnseenText[]; key: ComparativeKey } | null {
  const found = getQuestion(questionId);
  const key = getAnswer(questionId)?.comparative;
  if (!found || found.question.type !== "comparative" || !key) return null;
  const question = found.question;
  const texts: UnseenText[] = [];
  for (const id of question.textIds) {
    const text = found.unit.texts?.find((t) => t.id === id);
    if (!text) return null;
    texts.push(text);
  }
  return { question, texts, key };
}

/**
 * Mark one comparative answer. Returns null when the marker is unavailable (the caller returns the editable box and
 * never invents a mark or self-marks). The retry cap is applied in code, as for spec 008.
 */
export async function markComparative(
  questionId: string,
  answer: string,
  phase: 1 | 2,
  pickedTextIds: readonly string[] | undefined,
  options: { skipLlm?: boolean } = {},
): Promise<UnseenMarked | null> {
  const k = comparativeKeyOf(questionId);
  if (!k || options.skipLlm) return null;
  const { question, texts, key } = k;
  const ids = pickedTextIdsOf(question, pickedTextIds);
  if (!ids) return null;
  const markerTexts: MarkerText[] = [];
  const stimuli: string[] = [];
  for (const id of ids) {
    const text = texts.find((t) => t.id === id)!;
    const visual = text.body.kind === "image";
    const description = key.visuals?.[id]?.description;
    if (visual && !description) return null; // nothing to mark a picture from
    const stimulus = visual ? "" : renderTextForMarker(text);
    if (stimulus) stimuli.push(stimulus);
    markerTexts.push({ heading: text.heading, textForm: formForPrompt(text.form), visual, text: visual ? description! : stimulus });
  }
  const out = await markUnseenWithModel(
    {
      maxMarks: question.maxMarks,
      questionHeading: "",
      question: [question.prompt, ...(question.parts ?? []).map((p) => `(${p.label}) ${p.text}`)].join("\n"),
      verb: question.verb,
      textForm: "",
      visual: false,
      text: "",
      texts: markerTexts,
      criteria: key.criteria,
      notes: key.notes,
      suggestedWords: question.suggestedWords,
      modelAnswer: key.model,
      stimulus: stimuli.join("\n\n"),
      answer,
    },
    { rubric: comparativeRubric, skillIds: COMPARATIVE_SKILL_IDS, maxTokens: COMPARATIVE_MAX_TOKENS },
  );
  if (!out) return null;
  return {
    verdicts: out.reply.skills,
    mark: phase === 2 ? cappedMark(out.reply.mark, question.maxMarks) : out.reply.mark,
    feedback: out.reply.feedback,
    biggestGap: out.reply.biggestGap,
    goFurther: phase === 1 && out.reply.mark === question.maxMarks ? out.reply.goFurther : null,
    wordCount: countWords(answer),
    promptVersion: out.promptVersion,
    model: out.model,
  };
}

/**
 * The model answer for the discussion of a FINAL comparative attempt, and (choice questions only) the pairing it uses,
 * as the ids of the texts it covers. Never the criteria, notes or descriptions. The caller must check the phase row
 * is final; this function never decides that.
 */
export function comparativeDiscussion(questionId: string): ComparativeDiscussion | null {
  const k = comparativeKeyOf(questionId);
  if (!k) return null;
  return {
    modelAnswer: k.key.model,
    modelWords: countWords(k.key.model),
    ...(k.question.choice ? { pairing: [...k.key.pairing] } : {}),
  };
}


// ---- essays (spec 010) ---------------------------------------------------------------------------------
//
// The ONLY readers of an essay question's key. What each export may release (constitution Principle I, 2.17.0):
//   essayPublicView   the public question, its verb's definition and its source: no key field.
//   markEssay         sends the marking notes and the school's criteria to the model provider and returns the
//                     validated reply and the final mark; nothing from the key is in its return value.
//   essayModelEssay   the band 1 model essay, for the student's OWN FINISHED result only. The caller must check
//                     the phase row is finished and belongs to the session user; this function never decides that.
// The marking notes, the school's criteria and the concept tags are never returned by any function.

function essayKeyOf(questionId: string): { question: EssayQuestion; key: EssayQuestionKey } | null {
  const found = getQuestion(questionId);
  const key = getAnswer(questionId)?.essay;
  if (!found || found.question.type !== "essay" || !key) return null;
  return { question: found.question, key };
}

/** The public question (any essay, live or not) with its verb's definition. No key. */
export function essayPublicView(questionId: string): PublicEssay | null {
  const found = getQuestion(questionId);
  if (!found || found.question.type !== "essay") return null;
  const q = found.question;
  return {
    id: q.id,
    prompt: q.prompt,
    verb: q.verb,
    verbDefinition: verbDefinition(q.verb) ?? "",
    economy: q.economy,
    offer: q.offer,
    ...(q.source ? { source: q.source } : {}),
  };
}

/** Whether an essay exists and is live (only a live essay may be started). */
export function essayIsLive(questionId: string): boolean {
  const found = getQuestion(questionId);
  return !!found && found.question.type === "essay" && found.question.live;
}

export interface EssayMarked {
  reply: ParsedEssayReply;
  model: string;
  promptVersion: string;
  rawMark: number;
  /** The mark after clamping into its band and the one-economy cap. */
  finalMark: number;
  capped: boolean;
}

/** Marks an essay. Null when the marker is unavailable (no key, errors, or a bad reply twice). */
export async function markEssay(questionId: string, essay: string): Promise<EssayMarked | null> {
  const k = essayKeyOf(questionId);
  if (!k) return null;
  const out = await markEssayWithModel({
    question: k.question.prompt,
    verb: k.question.verb,
    economy: k.question.economy,
    markingNotes: k.key.markingNotes,
    schoolCriteria: k.key.schoolCriteria,
    essay,
  });
  if (!out) return null;
  const { final, capped } = finalMark(out.reply.mark, out.reply.band, k.question.economy, out.reply.covers);
  return { reply: out.reply, model: out.model, promptVersion: out.promptVersion, rawMark: out.reply.mark, finalMark: final, capped };
}

/** The band 1 model essay: only for the student's own finished result (see above). */
export function essayModelEssay(questionId: string): string | null {
  return essayKeyOf(questionId)?.key.modelEssay ?? null;
}


// ---- English essays (spec 011) -------------------------------------------------------------------------
//
// The ONLY readers of an English essay question's key (constitution Principle I, 2.18.0). What each may release:
//   englishEssayPublicView    the public question, directive meaning, source and practice ids: no key field.
//   englishEssayKeyForMarker  the marking notes and key concept tags, for the server-side marker prompt ONLY. Its
//                             result must never be placed in any response.
//   englishEssayModelEssay    the band 1 model essay, for the student's OWN FINISHED result only. The caller must
//                             check the phase row is finished and belongs to the session user; this function never
//                             decides that.

function englishEssayQuestion(questionId: string): EnglishEssayQuestion | null {
  const found = getQuestion(questionId);
  return found && found.question.type === "englishEssay" ? found.question : null;
}

/** The public question (any English essay, live or not) with its directive's meaning. No key. */
export function englishEssayPublicView(questionId: string): PublicEnglishEssay | null {
  const q = englishEssayQuestion(questionId);
  if (!q) return null;
  const info = directiveInfo(q.directive);
  return {
    type: "englishEssay",
    group: "englishEssay",
    maxMarks: 20,
    live: q.live,
    id: q.id,
    prompt: q.prompt,
    directive: q.directive,
    directiveDefinition: info.definition,
    directiveGuidance: info.guidance,
    offer: q.offer,
    source: q.source,
    conceptIds: [...q.conceptIds],
  };
}

/** Whether an English essay exists and is live (only a live essay may be started). */
export function englishEssayIsLive(questionId: string): boolean {
  return englishEssayQuestion(questionId)?.live === true;
}

/** The marker's view of the key: the question text, its marking notes and key tags. Server-side marking only. */
export function englishEssayKeyForMarker(
  questionId: string,
): { question: string; markingNotes: string; conceptTags: string[] } | null {
  const q = englishEssayQuestion(questionId);
  const key: EnglishEssayKey | undefined = getAnswer(questionId)?.englishEssay;
  if (!q || !key) return null;
  return { question: q.prompt, markingNotes: key.markingNotes, conceptTags: [...key.conceptTags] };
}

/** The band 1 model essay: only for the student's own finished result (see above). */
export function englishEssayModelEssay(questionId: string): string | null {
  return getAnswer(questionId)?.englishEssay?.modelEssay ?? null;
}

/**
 * Marks an English essay: sends the question, its marking notes and the essay (never the model essay) to the model provider
 * and returns the validated reply. Nothing from the key is in the return value. Null when the marker is unavailable (no
 * key, errors, or a bad reply twice).
 */
export async function markEnglishEssay(questionId: string, essay: string): Promise<EnglishMarkerOutput | null> {
  const key = englishEssayKeyForMarker(questionId);
  if (!key) return null;
  return markEnglishEssayWithModel({ question: key.question, markingNotes: key.markingNotes, essay });
}

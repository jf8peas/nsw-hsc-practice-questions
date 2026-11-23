// Shared content types. See README.md > "Content structure".

export type Year = "Year 11" | "Year 12";

export type UnitType = "Topic Quiz" | "Milestone Test" | "Essay Practice" | "Writing Practice";

/**
 * An idea within a unit that a student needs to understand (spec 002). Ids are
 * `<unit-id>.c-<slug>` and are never renamed or reused once shipped.
 */
export interface Concept {
  id: string;
  /** One line, shown to students next to the number of correct answers still needed. */
  description: string;
  /** The term this concept defines (rewrite units, spec 005): shown in bold before the description. */
  term?: string;
  /**
   * Correct first tries that clear this concept once missed (spec 007): 2 for a paragraph part
   * tip, 3 (the default) for everything else. Public: holds no answers.
   */
  clearAfter?: 2 | 3;
}

/** Draw `n` questions whose `group` matches, per quiz attempt. */
export interface QuizDraw {
  group: string;
  n: number;
}

/** How many questions a quiz attempt draws from the bank. */
export interface QuizConfig {
  /** Number of short-answer questions per attempt (used when `groups` is unset). */
  short: number;
  /** Number of multiple-choice questions per attempt (used when `groups` is unset). */
  mc: number;
  /** Pass mark as a percentage of available marks. */
  passMark: number;
  /**
   * If set, overrides `short`/`mc`: draw `n` questions from each named group.
   * Groups are drawn in listed order, so quiz order follows this list.
   */
  groups?: QuizDraw[];
}

/** A formula shown on the unit page (after the Start quiz button). */
export interface FormulaRef {
  /** The formula as plain text, e.g. "F = ma". */
  formula: string;
  /** LaTeX form for KaTeX rendering, e.g. "\\vec{F} = m\\vec{a}". */
  formulaTex?: string;
  /** What it is, e.g. "Newton's second law". */
  name: string;
}

/** Public metadata for a unit. Safe to ship to the browser. */
export interface UnitMeta {
  /** kebab-case, globally unique, e.g. "y11-formula-test". Never change once shipped. */
  id: string;
  year: Year;
  /** HSC module grouping, e.g. "Kinematics", "Dynamics". Drives UI grouping. */
  topic: string;
  type: UnitType;
  title: string;
  description: string;
  /** Creation date, ISO `YYYY-MM-DD`. Shown as a pill; units are listed newest first. */
  created: string;
  /** Sort order within a topic. */
  order: number;
  /** If set, a quiz attempt draws a random subset of the question bank. */
  quiz?: QuizConfig;
  /**
   * Set only when every question in the unit carries a concept tag. Public metadata: it
   * holds no answers. A unit without it has no "Things you need to know" and no weighting.
   */
  conceptsReady?: boolean;
  /**
   * Set only when every wrong option of every MC question has an explanation in the
   * answer key. Public metadata: it holds no answers.
   */
  explanationsComplete?: boolean;
  /**
   * Set on a unit whose quiz is the NEXT part of one essay, not a random draw (spec 007).
   * Public metadata: it holds no answers.
   */
  sequence?: { kind: "essay-parts"; parts: 5 };
  /**
   * Set on a unit whose quiz is one weighted-random unanswered question (the Advanced English
   * unseen-text unit, spec 008), not a random subset and not a fixed order. Public metadata: it
   * holds no answers.
   */
  draw?: { kind: "unseen-weighted" | "comparative-weighted" };
  /**
   * Set on the Economics essay-writing unit (spec 010): a quiz is one whole essay the student picks
   * (scaffold, optional plan review, 600-800 words, marked out of 20). Public metadata.
   */
  flow?: "essay" | "englishEssay";
  /**
   * Spec 010: a correct use of a concept in the SAME question that last set it does not clear it;
   * only a different question does. Public metadata.
   */
  conceptsClearOnOtherQuestions?: boolean;
  /**
   * Units whose skill progress this unit shares (spec 009 FR-022): one count per shared concept
   * id, replayed from the results of this unit and every unit listed here. Public metadata.
   */
  sharesProgressWith?: string[];
  /** Formulas tested by this unit, shown on the unit page below Start quiz. */
  formulas?: FormulaRef[];
  /** A structured "how to" panel shown on the unit page below Start quiz. */
  guide?: {
    title: string;
    items: Array<{ label: string; text: string }>;
  };
}

interface BaseQuestion {
  /** Namespaced by unit id, e.g. "y11-formula-test.q3". Never renumber. */
  id: string;
  /** Optional grouping used by `QuizConfig.groups` (e.g. "mc", "shift", "micro"). */
  group?: string;
  /** Optional formula shown above the prompt (plain text). */
  formula?: string;
  /** LaTeX form of `formula` for KaTeX rendering. */
  formulaTex?: string;
  /** Optional inline SVG diagram shown between prompt and answer. */
  diagramSvg?: string;
  /** Short description of the diagram for screen readers (defaults to "Diagram"). */
  diagramAlt?: string;
  /**
   * Where a verbatim school-paper question came from (constitution Principle V), e.g.
   * "Knox 2022 Trial, Q16". Public: shown with the question. Original questions have none.
   */
  source?: string;
  prompt: string;
  /** Marks this question is worth. MC is normally 1. */
  maxMarks: number;
  /**
   * The concept this question tests (a `Concept.id` of its own unit). A tag is not an
   * answer, so it lives in public content.
   */
  concept?: string;
  /**
   * The several concepts a rewrite question tests (its target terms' concept ids, spec 005).
   * A tag is not an answer, so it lives in public content. Rewrite questions use this
   * instead of `concept`.
   */
  concepts?: string[];
}

export interface McQuestion extends BaseQuestion {
  type: "mc";
  options: string[];
}

export interface ShortQuestion extends BaseQuestion {
  type: "short";
}

/**
 * A sentence-writing question (spec 005): the prompt is a plain-English sentence the student
 * rewrites as one concise sentence using the target terms. Worth 3 marks.
 */
export interface RewriteQuestion extends BaseQuestion {
  type: "rewrite";
}

/**
 * A paragraph-writing question (spec 007): one part of one essay. `prompt` is the essay question
 * in full. The brief, models, guidance and marking notes are the answer key (SERVER ONLY).
 * Worth 4 marks.
 */
export interface ParagraphQuestion extends BaseQuestion {
  type: "paragraph";
  group: "paragraph";
  /** "e01": the essay this part belongs to. */
  essayId: string;
  /** 1-based position of the essay in the bank. */
  essayNo: number;
  /** 1 topic, 2 mechanism, 3 evidence, 4 evaluation, 5 link. */
  part: 1 | 2 | 3 | 4 | 5;
  /** The directive verb, lower case, a key of content/glossary.ts. */
  verb: string;
  /** The model economy, e.g. "Vietnam". */
  economy: string;
  maxMarks: 4;
}

/**
 * A whole-essay question (spec 010). `prompt` is the essay question in full. The marking notes, the
 * school's criteria, the band 1 model essay and the concept tags are the answer key (SERVER ONLY).
 * Worth 20 marks.
 */
export interface EssayQuestion extends BaseQuestion {
  type: "essay";
  group: "essay";
  maxMarks: 20;
  /** The directive verb, lower case, a key of content/glossary.ts. */
  verb: string;
  /** The economy the student must write about; "both" means one emerging and one developing economy. */
  economy: "china" | "nepal" | "both";
  /** Position in the offered order (1 to 6). */
  offer: 1 | 2 | 3 | 4 | 5 | 6;
  /** False until the essay has passed review and the marker check; a non-live essay is never offered. */
  live: boolean;
}

/** The directive of an English essay question (spec 011): the full stored phrase, lower case. */
export type EnglishDirective = "to what extent" | "discuss" | "how" | "evaluate";

/**
 * A whole-essay question for the Advanced English essay unit (spec 011, data-model §1.1). `prompt` is the
 * school-trial question verbatim. The marking notes, the band 1 model essay and the key concept tags are the
 * answer key (SERVER ONLY, `Answer.englishEssay`). Worth 20 marks. `conceptIds` are PUBLIC practice tags
 * (the eight `skill-*` ids only); they are not the answer key's coverage.
 */
export interface EnglishEssayQuestion extends BaseQuestion {
  type: "englishEssay";
  group: "englishEssay";
  maxMarks: 20;
  /** The directive phrase as it appears in `prompt`; the highlighter and the reviewer use it. */
  directive: EnglishDirective;
  /** Position in the offered order (1 to 6). */
  offer: 1 | 2 | 3 | 4 | 5 | 6;
  /** False until the essay has passed review and the marker gate; a non-live essay is never offered. */
  live: boolean;
  /** Required: all six questions are school-trial questions (constitution Principle V). */
  source: string;
  /** Public skill-only practice tags. */
  conceptIds: string[];
}

/** The form of an unseen text (spec 008). A closed union: the draw weights by form. */
export type TextForm =
  | "poem"
  | "prose-fiction"
  | "non-fiction"
  | "personal-essay"
  | "visual"
  | "drama"
  | "speech";

/**
 * One unseen stimulus text, stored once and pointed at by its questions (spec 008, data-model §1).
 * PUBLIC: it is shown to the student. A visual text's written description for the marker is key
 * material and lives in the server-only answer set, never here.
 */
export interface UnseenText {
  /** Unit-local id, e.g. "fs25-t1". Never reused. */
  id: string;
  form: TextForm;
  /** As on the paper: "Text 1 – Poem". */
  heading: string;
  title: string;
  author: string;
  /** The paper's credit line for the text. */
  sourceLine: string;
  body:
    | { kind: "poem"; stanzas: string[][]; lineNumbers?: { every: number } }
    | { kind: "prose"; paragraphs: string[] }
    /** `image` is the text id; the image is served by the authenticated route. `alt` is a neutral label. */
    | { kind: "image"; image: string; alt: string };
  /** The paper's glossary lines. */
  footnotes?: Array<{ mark: string; text: string }>;
  /** ISO date the text was compared with the NESA HSC papers (Principle V: never a real HSC text). */
  hscChecked: string;
}

/** The paper a school-paper question came from (Principle V's four source items). */
export interface UnseenPaper {
  school: string;
  /** Short label for history names, e.g. "Fort St". */
  short: string;
  year: number;
  exam: "Trial" | "Half-yearly";
  qNo: 1 | 2 | 3 | 4 | 5;
}

/**
 * An unseen-text short-answer question (spec 008): one Section I question on exactly one text. The
 * criteria, marking notes and model answer are the answer key (SERVER ONLY).
 */
export interface UnseenQuestion extends BaseQuestion {
  type: "unseen";
  group: "unseen";
  /** Resolves in the unit's texts. */
  textId: string;
  /** The directive verb, lower case, a key of the rubric's directive verbs. */
  verb: string;
  /** (a), (b) on the same text, shown together; `maxMarks` is their sum when present. */
  parts?: Array<{ label: string; text: string; marks: number }>;
  maxMarks: number;
  /** Answer lines × 12 words, or the median for the mark value. */
  suggestedWords: number;
  suggestedFrom: "lines" | "median";
  paper: UnseenPaper;
  outcome: "EAV-12-01" | "EAV-12-02" | "EAV-12-04";
  /** The 1 to 3 skill concept ids; a tag is not an answer. */
  concepts: string[];
}

/** How a comparative question's texts are chosen (spec 009, data-model §1.1). A fixed pair has no choice. */
export interface ComparativeChoice {
  /** Texts every answer is about (may be empty, e.g. "any TWO of Texts 1 to 4"). */
  fixed: string[];
  /** Texts the student chooses from (all shown in tabs). */
  from: string[];
  /** How many of `from` the student picks (1 or 2). */
  pick: number;
}

/**
 * A comparative short-answer question (spec 009): one Section I question on two texts. A fixed pair
 * names both texts; a choice question lets the student pick. The criteria, notes, model answer and
 * pairing are the answer key (SERVER ONLY).
 */
export interface ComparativeQuestion extends BaseQuestion {
  type: "comparative";
  group: "comparative";
  /** Every text shown, tab order: fixed first, then choosable. Each resolves in the unit's texts. */
  textIds: string[];
  /** null for a fixed pair. */
  choice: ComparativeChoice | null;
  /** The directive verb, lower case, a key of the comparative prompt's directive verbs. */
  verb: string;
  parts?: Array<{ label: string; text: string; marks: number }>;
  /** 3 to 8. */
  maxMarks: number;
  suggestedWords: number;
  suggestedFrom: "lines" | "median";
  paper: UnseenPaper;
  outcome: "EAV-12-01" | "EAV-12-02" | "EAV-12-04";
  /** The 1 to 3 skill concept ids (of the nine). */
  concepts: string[];
}

/** Public question — no answer key. Safe to ship to the browser. */
export type Question = McQuestion | ShortQuestion | RewriteQuestion | ParagraphQuestion | UnseenQuestion | ComparativeQuestion | EssayQuestion | EnglishEssayQuestion;

/** A full unit as consumed by the UI: metadata + public questions. */
export interface Unit extends UnitMeta {
  questions: Question[];
  /** From `concepts.ts`, for units that have adopted concepts. */
  concepts?: Concept[];
  /** The unseen texts of an unseen-text unit (spec 008). Public. */
  texts?: UnseenText[];
  /**
   * Questions removed from the unit, by id. The value is the concept the question belonged
   * to, an array of concepts for a removed rewrite question (spec 005), or `null` when it
   * was removed before the unit was tagged (its results then count toward no concept). Lets
   * a removed question keep counting without a tag per result.
   */
  retired?: Record<string, string | string[] | null>;
}

/**
 * One target term of a rewrite question (spec 005): the term the student must use, its
 * one-line definition (also the concept description), why it fits this sentence, and the
 * accepted equivalents and listed misuses the AI marker uses. SERVER ONLY.
 */
export interface RewriteTargetTerm {
  /** A concept of the unit (the term IS a concept). */
  conceptId: string;
  /** Exact spelling, e.g. "tariff". */
  term: string;
  /** One line, the concept description. */
  definition: string;
  /** One line: why this term fits this sentence (shown in the discussion, FR-018). */
  why: string;
  /** Accepted equivalents, e.g. ["import tax", "customs duty"]. */
  equivalents: string[];
  /** Listed misuses, e.g. ["quota"]. */
  misuses: string[];
}

/**
 * The answer key for one question. SERVER ONLY — never imported into a
 * client component or the public content registry.
 */
export interface Answer {
  /** Present for `mc` questions: index into `options` (legacy — prefer correctText). */
  correctIndex?: number;
  /**
   * Present for `mc` questions: the exact text of the correct option. The grader
   * resolves the index from this, so authored option order can be scrambled
   * without the answer key drifting.
   */
  correctText?: string;
  /** Present for `short` questions: the model answer shown after submitting. */
  modelAnswer?: string;
  /** One bullet per mark-earning point. Used by the LLM grader (step 3). */
  rubric: string[];
  /** Marking notes: accepted variations, common misconceptions. */
  notes?: string;
  /**
   * `mc` only: why each WRONG option is wrong, keyed by the option's text (options are
   * shuffled per attempt, so an index would drift). Shown to the student only after they
   * answer, and only for the option they chose.
   */
  wrongExplanations?: Record<string, string>;
  /** `rewrite` only: one or two accepted model sentences. */
  modelSentences?: string[];
  /** `rewrite` only: 1-3 target terms (usually 2), each with its definition and why it fits. */
  targetTerms?: RewriteTargetTerm[];
  /** `rewrite` only: marking notes (accepted equivalents and common misuses), prose. */
  markingNotes?: string;
  /** `paragraph` only (spec 007): the essay's key and which of its five parts this question is. */
  paragraph?: { essay: EssayKey; part: 1 | 2 | 3 | 4 | 5 };
  /** `unseen` only (spec 008): the question's key. SERVER ONLY. */
  unseen?: UnseenKey;
  /** `comparative` only (spec 009): the question's key. SERVER ONLY. */
  comparative?: ComparativeKey;
  /** `essay` only (spec 010): the essay's key. SERVER ONLY. */
  essay?: EssayQuestionKey;
  /** `englishEssay` only (spec 011): the essay's key. SERVER ONLY. */
  englishEssay?: EnglishEssayKey;
}

/** The answer key of one English essay question (spec 011, data-model §1.2). SERVER ONLY. */
export interface EnglishEssayKey {
  /** What a strong answer to THIS question does. Never browser-facing. */
  markingNotes: string;
  /** An original band 1 response on Away, 900 to 1,100 words. */
  modelEssay: string;
  /** Full concept ids a strong answer uses (any of the unit's ids). */
  conceptTags: string[];
}

/** The answer key of one whole-essay question (spec 010, data-model §1). SERVER ONLY. */
export interface EssayQuestionKey {
  /** What a strong answer to this question is likely to cover. */
  markingNotes: string;
  /** The school's own marking criteria, verbatim, for a school-trial essay; null for an original one. */
  schoolCriteria: string | null;
  /** A band 1 model essay, 600 to 800 words. */
  modelEssay: string;
  /** Concept ids (keys of the unit's concept list) a strong answer uses. */
  concepts: string[];
}

/** The answer key of one unseen-text question (spec 008, data-model §1). SERVER ONLY. */
export interface UnseenKey {
  /** The school's band descriptors, one "N – …" line per mark. */
  criteria: string;
  /** Features a student could discuss; "None provided by the school." is allowed. */
  notes: string;
  /** The example full-mark answer: given to the marker, shown at the discussion. */
  model: string;
  modelOrigin: "school" | "drafted";
  criteriaOrigin: "school" | "drafted";
  /** ISO date; required when either origin is "drafted" (FR-042). */
  reviewedOn?: string;
  /** Present iff the question's text is an image. */
  visual?: {
    /** The marker's written description. Never sent to a browser. */
    description: string;
    /** Absent until scripts/check-unseen-descriptions.ts has run: validation blocks the question. */
    check?: DescriptionCheck;
  };
}

/** The answer key of one comparative question (spec 009, data-model §1.2). SERVER ONLY. */
export interface ComparativeKey {
  /** The school's band descriptors, one "N – …" line per mark. */
  criteria: string;
  notes: string;
  /** An example full-mark answer for ONE pairing: given to the marker, shown at the discussion. */
  model: string;
  modelOrigin: "school" | "drafted";
  criteriaOrigin: "school" | "drafted";
  reviewedOn?: string;
  /** The text ids the model answer uses (all of textIds for a fixed pair). Released at the discussion only. */
  pairing: string[];
  /** One entry per visual text in textIds (picked or not): the marker's description and its check. */
  visuals?: Record<string, { description: string; check?: DescriptionCheck }>;
}

/** The pre-release check that a visual text's description is enough to mark from (FR-017). */
export interface DescriptionCheck {
  adequate: boolean;
  checkedAt: string;
  promptVersion: string;
  model: string;
  samples: number;
  /** sha256 of `description`: editing the description invalidates the pass. */
  descriptionHash: string;
}

// ---- paragraph-writing key (spec 007). SERVER ONLY content: see content/units/y12-economics-paragraph-writing/essays.ts

export type PartNo = 1 | 2 | 3 | 4 | 5;
export type BriefField = "economy" | "argument" | "counterpoint" | "chainSteps" | "facts" | "limitation";
export type LimitationTag = "inequality" | "sustainability" | "external-shocks" | "dependence" | "time-lags";

export interface EssayKey {
  /** Matches the questions' `essayId`. */
  essayId: string;
  /** "emerging and developing" for an essay that compares one of each (e.g. China and Nepal). */
  economyType: "emerging" | "developing" | "emerging and developing";
  /** One line, goes to the marker. */
  strategy: string;
  brief: {
    economy: string;
    argument: string;
    counterpoint: string;
    chainSteps: string[];
    /** Every figure carries its year. */
    facts: string[];
    limitation: string[];
  };
  /** The brief fields marked "Use in this part". */
  uses: Record<PartNo, BriefField[]>;
  /** "What this part must do": four plain lines per part, the last naming the word limit. */
  guidance: Record<PartNo, [string, string, string, string]>;
  /** The five model parts, each within its word limit. */
  models: Record<PartNo, string>;
  /** The text after the dash under "MODEL …" at the discussion. */
  commentary: Record<PartNo, string>;
  /** Marker only; never leaves the server. */
  markingNotes: Record<PartNo, string>;
  /** Anchors that make "the evaluation discusses the limitation the topic sentence framed" checkable. */
  limitation: { tag: LimitationTag; topicPhrase: string; evaluationPhrase: string };
  /** ISO date the content task last checked every figure against its source. */
  figuresVerified: string;
}

/** Map of question id -> answer key, per unit. */
export type AnswerSet = Record<string, Answer>;

/** An upcoming exam, shown on the home page and relevant unit pages. */
export interface Exam {
  id: string;
  title: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Unit ids this exam covers. */
  unitIds: string[];
}

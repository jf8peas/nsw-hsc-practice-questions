// Shared content types. See README.md > "Content structure".

export type Year = "Year 11" | "Year 12";

export type UnitType = "Topic Quiz" | "Milestone Test" | "Essay Practice";

/**
 * An idea within a unit that a student needs to understand (spec 002). Ids are
 * `<unit-id>.c-<slug>` and are never renamed or reused once shipped.
 */
export interface Concept {
  id: string;
  /** One line, shown to students next to the number of correct answers still needed. */
  description: string;
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
  /** Optional inline SVG (a supply/demand diagram) shown between prompt and answer. */
  diagramSvg?: string;
  prompt: string;
  /** Marks this question is worth. MC is normally 1. */
  maxMarks: number;
  /**
   * The concept this question tests (a `Concept.id` of its own unit). A tag is not an
   * answer, so it lives in public content.
   */
  concept?: string;
}

export interface McQuestion extends BaseQuestion {
  type: "mc";
  options: string[];
}

export interface ShortQuestion extends BaseQuestion {
  type: "short";
}

/** Public question — no answer key. Safe to ship to the browser. */
export type Question = McQuestion | ShortQuestion;

/** A full unit as consumed by the UI: metadata + public questions. */
export interface Unit extends UnitMeta {
  questions: Question[];
  /** From `concepts.ts`, for units that have adopted concepts. */
  concepts?: Concept[];
  /**
   * Questions removed from the unit, by id. The value is the concept the question belonged
   * to, or `null` when it was removed before the unit was tagged (its results then count
   * toward no concept). Lets a removed question keep counting without a tag per result.
   */
  retired?: Record<string, string | null>;
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

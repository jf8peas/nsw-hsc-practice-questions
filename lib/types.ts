// Shared content types. See README.md > "Content structure".

export type Year = "Year 11" | "Year 12";

export type UnitType = "Topic Quiz" | "Milestone Test" | "Essay Practice";

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
  /** Sort order within a topic. */
  order: number;
  /** If set, a quiz attempt draws a random subset of the question bank. */
  quiz?: QuizConfig;
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

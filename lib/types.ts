// Shared content types. See README.md > "Content structure".

export type Year = "Year 11" | "Year 12";

export type UnitType = "Topic Quiz" | "Milestone Test";

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
}

interface BaseQuestion {
  /** Namespaced by unit id, e.g. "y11-formula-test.q3". Never renumber. */
  id: string;
  /** Optional formula shown above the prompt (plain text for now, LaTeX later). */
  formula?: string;
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
  /** Present for `mc` questions: index into `options`. */
  correctIndex?: number;
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

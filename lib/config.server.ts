import "server-only";

export interface AppConfig {
  /** AI-graded short answers per student per Sydney day. 0 turns LLM grading off. */
  llmDailyCap: number;
  /** Short-answer submissions per user per minute. */
  gradeRateLimit: number;
  /** Short-answer submissions per IP per minute (looser backstop: schools share IPs). */
  gradeIpRateLimit: number;
  /** New attempts per user per minute. */
  attemptRateLimit: number;
  /** Rewrite draft saves per user per minute (spec 006; never AI-graded, never the grading limits). */
  draftRateLimit: number;
  /** "This mark seems wrong" flags per user per minute (spec 007). */
  flagRateLimit: number;
  /** Concept-generation model calls per Sydney day, across all students. 0 turns generation off. */
  conceptDailyCap: number;
  /** Concept "ensure" requests per student per minute. */
  conceptRateLimit: number;
}

/** Models for the concept pipeline (spec 002). `null` means "not configured". */
export interface ConceptModels {
  /** Writes concept summaries (and decides whether an illustration is needed). */
  generator: string;
  /** Draws illustrations as SVG. Unset means no illustration is ever generated. */
  illustration: string | null;
  /** Reviews every generated item. Unset (or equal to a generator) means nothing is approved. */
  reviewer: string | null;
}

function intOr(value: string | undefined, fallback: number, min: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n >= min ? n : fallback;
}

/** Parsed numeric settings. Never throws, so importing it is safe during `next build`. */
export function getConfig(
  env: Record<string, string | undefined> = process.env,
): AppConfig {
  return {
    llmDailyCap: intOr(env.LLM_DAILY_CAP, 40, 0),
    gradeRateLimit: intOr(env.GRADE_RATE_LIMIT, 20, 1),
    gradeIpRateLimit: intOr(env.GRADE_IP_RATE_LIMIT, 150, 1),
    attemptRateLimit: intOr(env.ATTEMPT_RATE_LIMIT, 20, 1),
    draftRateLimit: intOr(env.DRAFT_RATE_LIMIT, 30, 1),
    flagRateLimit: intOr(env.FLAG_RATE_LIMIT, 10, 1),
    conceptDailyCap: intOr(env.CONCEPT_DAILY_CAP, 100, 0),
    conceptRateLimit: intOr(env.CONCEPT_RATE_LIMIT, 10, 1),
  };
}

const DEFAULT_CONCEPT_MODEL = "deepseek/deepseek-chat";

/** The model the Advanced English unseen-text unit marks with (spec 008). */
export const DEFAULT_ENGLISH_ADV_MODEL = "deepseek/deepseek-v4.1-flash";

function modelOrNull(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/**
 * The unseen-text unit's marking model (`ENGLISH_ADV_GRADING_MODEL`, spec 008 FR-012). It never
 * reads `GRADING_MODEL`: the pilot showed the app's default model one mark harsh on full-mark
 * school answers. Blank counts as unset. Never throws.
 */
export function getEnglishAdvModel(env: Record<string, string | undefined> = process.env): string {
  return modelOrNull(env.ENGLISH_ADV_GRADING_MODEL) ?? DEFAULT_ENGLISH_ADV_MODEL;
}

/** The default model for the Economics essay-writing unit's marker and plan review (spec 010; the marker check may change it). */
export const DEFAULT_ESSAY_MODEL = "deepseek/deepseek-v4.1-flash";

/**
 * The essay unit's marking model (`ESSAY_GRADING_MODEL`, spec 010). It never reads `GRADING_MODEL` or
 * `ENGLISH_ADV_GRADING_MODEL`. Blank counts as unset. Never throws.
 */
export function getEssayGradingModel(env: Record<string, string | undefined> = process.env): string {
  return modelOrNull(env.ESSAY_GRADING_MODEL) ?? DEFAULT_ESSAY_MODEL;
}

/** The essay unit's optional plan-review model (`ESSAY_REVIEW_MODEL`, spec 010). Never falls back to another unit's model. */
export function getEssayReviewModel(env: Record<string, string | undefined> = process.env): string {
  return modelOrNull(env.ESSAY_REVIEW_MODEL) ?? DEFAULT_ESSAY_MODEL;
}

/** The concept pipeline's models. Never throws. */
export function getConceptModels(env: Record<string, string | undefined> = process.env): ConceptModels {
  return {
    generator: modelOrNull(env.CONCEPT_MODEL) ?? DEFAULT_CONCEPT_MODEL,
    illustration: modelOrNull(env.ILLUSTRATION_MODEL),
    reviewer: modelOrNull(env.REVIEW_MODEL),
  };
}

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
    conceptDailyCap: intOr(env.CONCEPT_DAILY_CAP, 100, 0),
    conceptRateLimit: intOr(env.CONCEPT_RATE_LIMIT, 10, 1),
  };
}

const DEFAULT_CONCEPT_MODEL = "deepseek/deepseek-chat";

function modelOrNull(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/** The concept pipeline's models. Never throws. */
export function getConceptModels(env: Record<string, string | undefined> = process.env): ConceptModels {
  return {
    generator: modelOrNull(env.CONCEPT_MODEL) ?? DEFAULT_CONCEPT_MODEL,
    illustration: modelOrNull(env.ILLUSTRATION_MODEL),
    reviewer: modelOrNull(env.REVIEW_MODEL),
  };
}

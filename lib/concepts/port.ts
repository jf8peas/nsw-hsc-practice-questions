// The seam between the concept pipeline and the language models (spec 002, contracts/llm.md).
// A plain module of types only, so tests and the pipeline can import it without pulling in
// the OpenRouter client. The real port is `createConceptLlmPort()` in `llm.server.ts`; tests
// pass a scriptable fake.

/** The model could not be reached, or its reply could not be used as a reply (no tokens worth counting). */
export interface CallFailed {
  ok: false;
  kind: "call_failed";
  reason: string;
}

/** The model answered, but what it produced breaks the content rules (spent tokens). */
export interface ContentRejected {
  ok: false;
  kind: "content_rejected";
  reason: string;
}

export interface UnitContext {
  id: string;
  title: string;
  topic: string;
  description: string;
}

export interface ConceptContext {
  id: string;
  description: string;
}

/** Answer-key material for the questions tagged with a concept. Server-side only: passed to a model, then discarded. */
export interface ReviewMaterial {
  questions: Array<{
    id: string;
    prompt: string;
    type: "mc" | "short";
    modelAnswer?: string;
    rubric: string[];
    correctText?: string;
  }>;
}

export interface GeneratedSummary {
  bullets: string[];
  /** null = the concept does not need a picture */
  illustration: { brief: string; alt: string } | null;
}

export interface ReviewVerdict {
  /** true only when every check is true; computed in code, never taken from the model */
  pass: boolean;
  /** one or two sentences; may quote model answers, so teacher-only */
  reason: string;
  checks: Record<string, boolean>;
}

export interface GenerateSummaryInput {
  model: string;
  unit: UnitContext;
  concept: ConceptContext;
  /** The public prompts of the questions tagged with the concept. Never answers. */
  questionPrompts: string[];
  attemptNo: 1 | 2;
}

export interface ReviewSummaryInput {
  model: string;
  unit: UnitContext;
  concept: ConceptContext;
  questionPrompts: string[];
  bullets: string[];
  material: ReviewMaterial;
}

export interface GenerateIllustrationInput {
  model: string;
  unit: UnitContext;
  concept: ConceptContext;
  bullets: string[];
  brief: string;
  alt: string;
  attemptNo: 1 | 2;
}

export interface ReviewIllustrationInput {
  model: string;
  unit: UnitContext;
  concept: ConceptContext;
  bullets: string[];
  brief: string;
  alt: string;
  svg: string;
  material: ReviewMaterial;
}

export interface ConceptLlmPort {
  generateSummary(input: GenerateSummaryInput): Promise<{ ok: true; value: GeneratedSummary } | CallFailed | ContentRejected>;
  reviewSummary(input: ReviewSummaryInput): Promise<{ ok: true; verdict: ReviewVerdict } | CallFailed>;
  generateIllustration(input: GenerateIllustrationInput): Promise<{ ok: true; svg: string } | CallFailed | ContentRejected>;
  /** Renders the SVG to a picture itself; a render failure is a `call_failed`. */
  reviewIllustration(input: ReviewIllustrationInput): Promise<{ ok: true; verdict: ReviewVerdict } | CallFailed>;
}

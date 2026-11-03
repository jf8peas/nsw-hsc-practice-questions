import "server-only";

// Model calls via OpenRouter. Configured with OPENROUTER_API_KEY. `gradeShortAnswer` marks
// short answers (GRADING_MODEL); `chatCompletion` is the shared request used by the concept
// pipeline too (spec 002). If the key is absent, grading returns null and the caller falls
// back to student self-marking.

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat";
const TIMEOUT_MS = 20_000;

/**
 * Where requests go. `OPENROUTER_BASE_URL` points the app at a local stand-in
 * (scripts/fake-openrouter.ts) for development, and is IGNORED in production so it can never
 * redirect real traffic.
 */
function endpoint(): string {
  const override = process.env.OPENROUTER_BASE_URL?.trim();
  return override && process.env.NODE_ENV !== "production" ? override : ENDPOINT;
}

export function llmGradingConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

/** Same check, named for the concept pipeline. */
export function conceptLlmConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

// ---- shared request ----------------------------------------------------------

export type ChatContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: ChatContent;
}

export interface ChatParams {
  model: string;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  /** Ask for a JSON object reply. */
  json?: boolean;
}

export type ChatResult =
  | { ok: true; content: string }
  | { ok: false; reason: "unconfigured" | "network" | "http" | "empty"; status?: number; detail?: string };

/**
 * One chat completion. Never throws: a missing key, a network error, a non-2xx reply and an
 * empty reply all come back as `{ ok: false, reason }` so callers can fall back. No retry here.
 */
export async function chatCompletion(p: ChatParams): Promise<ChatResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, reason: "unconfigured" };

  let res: Response;
  try {
    res = await fetch(endpoint(), {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "https://nsw-hsc-practice.vercel.app",
        "X-Title": "NSW HSC Practice",
      },
      body: JSON.stringify({
        model: p.model,
        messages: p.messages,
        temperature: p.temperature,
        max_tokens: p.maxTokens,
        ...(p.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(p.timeoutMs),
    });
  } catch (error) {
    return { ok: false, reason: "network", detail: String(error).slice(0, 200) };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, reason: "http", status: res.status, detail: detail.slice(0, 300) };
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: "empty", detail: "reply was not JSON" };
  }
  const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    return { ok: false, reason: "empty", detail: JSON.stringify(data).slice(0, 300) };
  }
  return { ok: true, content };
}

// ---- short-answer grading -------------------------------------------------------

export interface ShortGrade {
  marksAwarded: number;
  feedback: string;
  rubricHits: string[];
  rubricMisses: string[];
  gradedBy: string;
}

interface GradeParams {
  formula?: string;
  prompt: string;
  modelAnswer: string;
  rubric: string[];
  maxMarks: number;
  answer: string;
  /** Extra marking guidance for the grader (from the answer key's `notes`). */
  markingGuidance?: string;
  /** The answer was handwritten and transcribed from photos: credit working and method, ignore crossed-out work. */
  handwritten?: boolean;
}

function clampMarks(v: unknown, max: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), max);
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** Pull the first {...} block out of a model response and parse it. */
function parseGradeJson(content: string, maxMarks: number): Omit<ShortGrade, "gradedBy"> | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
  const feedback = typeof obj.feedback === "string" ? obj.feedback.trim() : "";
  if (!feedback) return null;
  return {
    marksAwarded: clampMarks(obj.marksAwarded, maxMarks),
    feedback,
    rubricHits: asStringArray(obj.rubricHits),
    rubricMisses: asStringArray(obj.rubricMisses),
  };
}

function buildMessages(p: GradeParams): ChatMessage[] {
  const system =
    `You are marking a NSW HSC Year 11 (Preliminary) short-answer response against a rubric. ` +
    `Award a whole number of marks from 0 to ${p.maxMarks}: one mark for each rubric point the student's answer clearly satisfies. ` +
    `Mark on the substance of the reasoning, not on matching the model answer's wording — accept equivalent phrasing, alternative valid arguments, correct diagrams described in words, and accurate recent real-world data. ` +
    `Accept equivalent notation and units (e.g. "m/s^2", "m s^-2" and "metres per second squared" are all the same). ` +
    `Do not award marks for correct material the question did not ask for. ` +
    (p.handwritten
      ? `This answer was handwritten and transcribed; award marks for correct working and method shown, as in HSC marking, and ignore crossed-out work. `
      : "") +
    `Respond with JSON only, no prose outside it.`;

  const user =
    (p.formula ? `Formula: ${p.formula}\n` : "") +
    `Question: ${p.prompt}\n\n` +
    `Rubric (1 mark each, ${p.maxMarks} available):\n` +
    p.rubric.map((r, i) => `${i + 1}. ${r}`).join("\n") +
    `\n\nModel answer: ${p.modelAnswer}\n\n` +
    (p.markingGuidance ? `Marking guidance: ${p.markingGuidance}\n\n` : "") +
    `Student's answer:\n"""\n${p.answer}\n"""\n\n` +
    `Reply with exactly this shape:\n` +
    `{"marksAwarded": <integer 0-${p.maxMarks}>, "feedback": "<1-2 sentences to the student>", ` +
    `"rubricHits": ["<rubric points satisfied>"], "rubricMisses": ["<rubric points missed>"]}`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export async function gradeShortAnswer(p: GradeParams): Promise<ShortGrade | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[grade] OPENROUTER_API_KEY not set — short answer falls back to self-marking");
    return null;
  }
  const model = process.env.GRADING_MODEL || DEFAULT_MODEL;
  const messages = buildMessages(p);

  async function attempt(): Promise<Omit<ShortGrade, "gradedBy"> | null> {
    const res = await chatCompletion({
      model,
      messages,
      temperature: 0,
      maxTokens: 500,
      timeoutMs: TIMEOUT_MS,
      json: true,
    });
    if (!res.ok) {
      if (res.reason === "http") {
        console.error(`[grade] OpenRouter ${res.status} (model ${model}): ${res.detail ?? ""}`);
      } else if (res.reason === "empty") {
        console.error(`[grade] OpenRouter response had no message content: ${res.detail ?? ""}`);
      } else {
        console.error(`[grade] OpenRouter call threw: ${res.detail ?? res.reason}`);
      }
      return null;
    }
    const parsed = parseGradeJson(res.content, p.maxMarks);
    if (!parsed) console.error(`[grade] could not parse grader JSON: ${res.content.slice(0, 300)}`);
    return parsed;
  }

  let out = await attempt();
  if (!out) out = await attempt();
  if (!out) return null;

  console.info(`[grade] ${model} → ${out.marksAwarded}/${p.maxMarks}`);
  return { ...out, gradedBy: model };
}

// ---- rewrite grading (spec 005) ----------------------------------------------

export interface RewriteTermStatus {
  term: string;
  status: "used" | "missing" | "misused";
  /** The exact words in the student's sentence the grader credited, or null (spec 006 FR-031). */
  span?: string | null;
}

export interface RewriteGrade {
  criterionA: boolean;
  padding: boolean;
  terms: RewriteTermStatus[];
  feedback: string;
  /** Optional language note for the final sentence (spec 006 FR-034). */
  languageNote?: { spelling?: Array<{ wrong: string; fix: string }>; grammar?: string };
  gradedBy: string;
}

interface RewriteGradeParams {
  /** The plain-English sentence. */
  prompt: string;
  targetTerms: Array<{
    term: string;
    definition: string;
    equivalents: string[];
    misuses: string[];
  }>;
  answer: string;
}

function asBoolean(v: unknown): boolean {
  return v === true || v === "true";
}

/** A language note is kept only when it matches the shape and caps; anything else is dropped. */
function parseLanguageNote(v: unknown): RewriteGrade["languageNote"] {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  const note: NonNullable<RewriteGrade["languageNote"]> = {};
  if (o.spelling !== undefined) {
    if (!Array.isArray(o.spelling) || o.spelling.length > 3) return undefined;
    const spelling: Array<{ wrong: string; fix: string }> = [];
    for (const pair of o.spelling) {
      if (!pair || typeof pair !== "object" || Array.isArray(pair)) return undefined;
      const p = pair as Record<string, unknown>;
      const wrong = typeof p.wrong === "string" ? p.wrong.trim() : "";
      const fix = typeof p.fix === "string" ? p.fix.trim() : "";
      if (!wrong || !fix || wrong.length > 60 || fix.length > 60) return undefined;
      spelling.push({ wrong, fix });
    }
    if (spelling.length > 0) note.spelling = spelling;
  }
  if (o.grammar !== undefined) {
    const grammar = typeof o.grammar === "string" ? o.grammar.trim() : "";
    if (!grammar || grammar.length > 200 || /\n/.test(grammar)) return undefined;
    note.grammar = grammar;
  }
  return note.spelling || note.grammar ? note : undefined;
}

/** Pull the first {...} block out of a model response and parse it. */
function parseRewriteJson(content: string): Omit<RewriteGrade, "gradedBy"> | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
  const feedback = typeof obj.feedback === "string" ? obj.feedback.trim() : "";
  if (!feedback) return null;
  const terms = Array.isArray(obj.terms)
    ? obj.terms.filter(
        (t): t is { term: string; status: string; span?: unknown } =>
          !!t &&
          typeof t === "object" &&
          typeof (t as { term?: unknown }).term === "string" &&
          typeof (t as { status?: unknown }).status === "string",
      )
    : [];
  return {
    criterionA: asBoolean(obj.criterionA),
    padding: asBoolean(obj.padding),
    terms: terms.map((t) => ({
      term: t.term,
      status: t.status === "used" || t.status === "misused" ? t.status : "missing",
      // a non-string span is treated as null; the new fields never make a reply unparseable
      span: typeof t.span === "string" ? t.span : null,
    })),
    feedback,
    languageNote: parseLanguageNote(obj.languageNote),
  };
}

function buildRewriteMessages(p: RewriteGradeParams): ChatMessage[] {
  const system =
    `You are marking a NSW HSC Year 12 Economics sentence-writing exercise. The student rewrote a ` +
    `plain-English sentence as ONE concise sentence using the correct economics terms. ` +
    `Judge the meaning, not exact word matches. ` +
    `For each target term decide its status: "used" (the term, or an accepted equivalent, is used correctly), ` +
    `"missing" (the term or an accepted equivalent is absent), or "misused" (the term or an equivalent is used ` +
    `incorrectly, or a listed misuse is used). ` +
    `Any grammatical form of a term counts ("specialise" for specialisation, "protected" for protection). ` +
    `An equivalent counts ONLY if it is listed for that term. Everyday synonyms do NOT count unless listed. ` +
    `Listed misuses NEVER count. ` +
    `"criterionA" is true when the meaning and the cause and effect of the original sentence are kept and correct. ` +
    `"padding" is true when the sentence is padded with words that add nothing (the word limit itself is checked separately). ` +
    `For each term you mark "used", "span" must quote the exact words in the student's sentence that earned ` +
    `the credit (a grammatical form or a listed equivalent may differ from the term itself); quote nothing the ` +
    `student did not write; use null for a term you did not credit. ` +
    `"feedback" must name what was done well and what would improve the sentence (more precise terms, or the ` +
    `lost criterion when every term was used correctly). It MUST NOT name or quote any words or phrases of the ` +
    `plain-English sentence as things to replace, and MUST NOT tell the student which words to change. ` +
    `When the sentence has a misspelling or a grammar slip, include an optional "languageNote" with the wrong ` +
    `word and its correction (at most three spelling pairs) and at most one short grammar note; otherwise omit it. ` +
    `Respond with JSON only, no prose outside it.`;

  const user =
    `Plain-English sentence: ${p.prompt}\n\n` +
    `Target terms:\n` +
    p.targetTerms
      .map(
        (t, i) =>
          `${i + 1}. ${t.term} — ${t.definition}` +
          (t.equivalents.length ? ` (accepted equivalents: ${t.equivalents.join(", ")})` : "") +
          (t.misuses.length ? ` (never counts: ${t.misuses.join(", ")})` : ""),
      )
      .join("\n") +
    `\n\nStudent's sentence:\n"""\n${p.answer}\n"""\n\n` +
    `Reply with exactly this shape:\n` +
    `{"criterionA": true|false, "padding": true|false, ` +
    `"terms": [{"term": "<exact term text>", "status": "used"|"missing"|"misused", "span": "<exact words credited or null>"}], ` +
    `"feedback": "<1-2 sentences to the student>", ` +
    `"languageNote": {"spelling": [{"wrong": "<misspelt word>", "fix": "<correction>"}], "grammar": "<one short note>"}}`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export async function gradeRewrite(p: RewriteGradeParams): Promise<RewriteGrade | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[rewrite] OPENROUTER_API_KEY not set — rewrite falls back to self-marking");
    return null;
  }
  const model = process.env.GRADING_MODEL || DEFAULT_MODEL;
  const messages = buildRewriteMessages(p);

  async function attempt(): Promise<Omit<RewriteGrade, "gradedBy"> | null> {
    const res = await chatCompletion({
      model,
      messages,
      temperature: 0,
      maxTokens: 500,
      timeoutMs: TIMEOUT_MS,
      json: true,
    });
    if (!res.ok) {
      console.error(`[rewrite] OpenRouter call failed: ${res.reason} ${res.detail ?? ""}`);
      return null;
    }
    const parsed = parseRewriteJson(res.content);
    if (!parsed) console.error(`[rewrite] could not parse grader JSON: ${res.content.slice(0, 300)}`);
    return parsed;
  }

  let out = await attempt();
  if (!out) out = await attempt();
  if (!out) return null;

  console.info(`[rewrite] ${model} → A=${out.criterionA} padding=${out.padding} terms=${out.terms.length}`);
  return { ...out, gradedBy: model };
}

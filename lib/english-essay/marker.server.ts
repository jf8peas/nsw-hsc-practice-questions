import "server-only";

import { englishConceptLines } from "@/content/units/y12-english-essay-writing/concepts";
import { getEnglishEssayGradingModel } from "@/lib/config.server";
import { scrubKeyMentions } from "@/lib/essay/marker.server";
import { chatCompletion, type ChatMessage } from "@/lib/openrouter.server";
import { countWords } from "@/lib/wordcount";

import rubricJson from "./rubric.json";
import { ENGLISH_CRITERIA_IDS, ENGLISH_VERDICTS, englishEssayConceptId, type EnglishCriteria, type EnglishQuestionFocus } from "./types";

// The English essay marker (spec 011, research R8, contracts/replies.md §1): builds the approved `eng-essay-pilot-5` prompt
// from lib/english-essay/rubric.json (the ONE file scripts/pilot-english-essay-marker.py also reads, with the single concept
// record in content/units/y12-english-essay-writing/concepts.ts), calls the unit's own model, validates the reply and
// retries a bad one once inside a time budget. It receives key material (marking notes) as arguments from
// lib/grading.server.ts and sends it, with the server-only Away notes, to the model provider only; nothing here is
// returned to a browser. It never sends the model essay and never falls back to another unit's model. It logs only
// reason codes, never text.

export interface EnglishRubric {
  promptVersion: string;
  wordRange: [number, number];
  bands: Array<{ band: number; min: number; max: number; descriptor: string }>;
  criteria: Record<string, string>;
  verdicts: string[];
  questionFocusLevels: string[];
  maxGaps: number;
  system: string;
  userTemplate: string;
  textNotes: Record<string, string>;
}

export const rubric = rubricJson as unknown as EnglishRubric;
export const PROMPT_VERSION = rubric.promptVersion;
export const TEXT_TITLE = "Away (Michael Gow), drama";

/** Keep in step with scripts/pilot-english-essay-marker.py. */
export const MAX_TOKENS = 8000;
export const FIRST_CALL_TIMEOUT_MS = 60_000;
export const BUDGET_MS = 115_000; // inside the grade route's maxDuration of 120 s
export const MIN_RETRY_MS = 12_000;
const RETRY_MARGIN_MS = 2_000;
const MAX_REASON = 300;
const MAX_FOCUS_REASON = 400;
const MAX_BAND_REASON = 600;
const MAX_LIFT = 300;
const MAX_WHY = 300;
const MAX_DETAIL = 200;
const MAX_USED_WELL = 8;
/** A run of the notes this long in the reply is an echo (shorter runs are quotation). */
export const ECHO_RUN = 60;

export interface EnglishMarkerInput {
  question: string;
  markingNotes: string;
  essay: string;
}

/** Single-pass {name} substitution, so a student's own braces are never re-expanded (the Python renderer does the same). */
export function render(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));
}

export function buildEnglishEssayMessages(
  input: EnglishMarkerInput,
  rub: EnglishRubric = rubric,
  list: Record<string, string> = englishConceptLines(),
  textNotes: string = rub.textNotes.away ?? "",
): ChatMessage[] {
  const values = {
    question: input.question,
    textTitle: TEXT_TITLE,
    textNotes,
    bands: rub.bands.map((b) => `Band ${b.band} (${b.min}-${b.max}): ${b.descriptor}`).join("\n"),
    criteria: Object.entries(rub.criteria)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n"),
    markingNotes: input.markingNotes,
    concepts: Object.entries(list)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n"),
    words: countWords(input.essay),
    essay: input.essay,
    maxGaps: rub.maxGaps,
  };
  return [
    { role: "system", content: rub.system },
    { role: "user", content: render(rub.userTemplate, values) },
  ];
}

// ---- parsing ------------------------------------------------------------------------------------

export interface ParsedEnglishEssayReply {
  criteria: EnglishCriteria;
  questionFocus: EnglishQuestionFocus;
  questionFocusReason: string;
  /** Marker errors as given; the quote-must-occur and dedupe rules are in lib/english-essay/scoring.ts. */
  knowledgeErrors: Array<{ quote: string; why: string }>;
  band: number;
  mark: number;
  bandReason: string;
  lift: string[];
  /** Full concept ids from the list, deduped, at most maxGaps, in the marker's order. */
  gaps: Array<{ conceptId: string; detail: string }>;
  /** Full concept ids used well, from the list, never also a gap. */
  usedWell: string[];
}

const text = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const safeText = (v: unknown, max: number): string => scrubKeyMentions(text(v, max));

/**
 * The first {...} block of the reply. A missing verdict, band, mark, question focus (or its reason), band reason or lift
 * point, or a gaps, knowledge-error or used-well entry that is not an array, makes the whole reply a failure: it is never
 * read as a default (constitution Principle VI). Items off the concept list are dropped. Unknown keys are ignored.
 */
export function parseEnglishEssayReply(
  content: string,
  list: Record<string, string> = englishConceptLines(),
  maxGaps: number = rubric.maxGaps,
): ParsedEnglishEssayReply | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;

  const rawCriteria = (obj.criteria && typeof obj.criteria === "object" ? obj.criteria : {}) as Record<string, unknown>;
  const criteria = {} as EnglishCriteria;
  for (const id of ENGLISH_CRITERIA_IDS) {
    const entry = rawCriteria[id];
    if (!entry || typeof entry !== "object") return null;
    const verdict = (entry as { verdict?: unknown }).verdict;
    if (typeof verdict !== "string" || !(ENGLISH_VERDICTS as readonly string[]).includes(verdict)) return null;
    criteria[id] = { verdict: verdict as EnglishCriteria[typeof id]["verdict"], reason: safeText((entry as { reason?: unknown }).reason, MAX_REASON) };
  }

  const band = obj.band;
  if (typeof band !== "number" || !Number.isInteger(band) || band < 1 || band > 5) return null;
  const mark = obj.mark;
  if (typeof mark !== "number" || !Number.isInteger(mark) || mark < 0 || mark > 20) return null;
  const focus = obj.questionFocus;
  if (focus !== "fully" && focus !== "partly" && focus !== "barely") return null;
  const questionFocusReason = safeText(obj.questionFocusReason, MAX_FOCUS_REASON);
  if (!questionFocusReason) return null;
  const bandReason = safeText(obj.bandReason, MAX_BAND_REASON);
  if (!bandReason) return null;
  const liftRaw = Array.isArray(obj.liftYourMark) ? obj.liftYourMark : typeof obj.liftYourMark === "string" ? [obj.liftYourMark] : [];
  const lift = liftRaw.map((x) => safeText(x, MAX_LIFT)).filter(Boolean).slice(0, 2);
  if (lift.length === 0) return null;

  if (!Array.isArray(obj.knowledgeErrors) || !Array.isArray(obj.gaps) || !Array.isArray(obj.conceptsUsedWell)) return null;

  const knowledgeErrors: ParsedEnglishEssayReply["knowledgeErrors"] = [];
  for (const e of obj.knowledgeErrors) {
    if (!e || typeof e !== "object") continue;
    const quote = text((e as { quote?: unknown }).quote, 400);
    const why = safeText((e as { why?: unknown }).why, MAX_WHY);
    if (quote && why) knowledgeErrors.push({ quote, why });
  }

  const gaps: ParsedEnglishEssayReply["gaps"] = [];
  const gapKeys = new Set<string>();
  for (const g of obj.gaps) {
    if (!g || typeof g !== "object") continue;
    const key = (g as { concept?: unknown }).concept;
    if (typeof key !== "string" || !(key in list) || gapKeys.has(key)) continue;
    gapKeys.add(key);
    gaps.push({ conceptId: englishEssayConceptId(key), detail: safeText((g as { detail?: unknown }).detail, MAX_DETAIL) });
    if (gaps.length >= maxGaps) break;
  }

  const usedWell: string[] = [];
  for (const u of obj.conceptsUsedWell) {
    if (typeof u !== "string" || !(u in list) || gapKeys.has(u)) continue;
    const id = englishEssayConceptId(u);
    if (!usedWell.includes(id)) usedWell.push(id);
    if (usedWell.length >= MAX_USED_WELL) break;
  }

  return { criteria, questionFocus: focus, questionFocusReason, knowledgeErrors, band, mark, bandReason, lift, gaps, usedWell };
}

const squash = (s: string): string => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * True when a student-facing string of the reply repeats a run of ECHO_RUN or more characters of the marking notes or the
 * Away notes that is not also in the question or the student's essay. Rejecting such a reply keeps key text out of the
 * browser (constitution Principle I). The knowledge-error `quote` is the student's own words and is not checked.
 */
export function containsKeyEcho(reply: ParsedEnglishEssayReply, keyTexts: readonly string[], allowedIn: readonly string[]): boolean {
  const strings = [
    reply.bandReason,
    reply.questionFocusReason,
    ...reply.lift,
    ...Object.values(reply.criteria).map((c) => c.reason),
    ...reply.knowledgeErrors.map((e) => e.why),
    ...reply.gaps.map((g) => g.detail),
  ].map(squash);
  const haystack = strings.join(" ¶ ");
  const allowed = allowedIn.map(squash).join(" ¶ ");
  for (const keyText of keyTexts) {
    const key = squash(keyText);
    if (key.length < ECHO_RUN) continue;
    for (let i = 0; i + ECHO_RUN <= key.length; i++) {
      const window = key.slice(i, i + ECHO_RUN);
      if (window.startsWith(" ") || window.endsWith(" ")) continue;
      if (haystack.includes(window) && !allowed.includes(window)) return true;
    }
  }
  return false;
}

// ---- marking ------------------------------------------------------------------------------------

export interface EnglishMarkerOutput {
  reply: ParsedEnglishEssayReply;
  model: string;
  promptVersion: string;
}

export interface EnglishMarkerOptions {
  rubric?: EnglishRubric;
  model?: string;
  maxTokens?: number;
}

/**
 * One marking: the model call, with ONE retry on a failed call, a cut-off, empty, unparseable or incomplete reply or an
 * echo, but only while at least MIN_RETRY_MS of the 115 s budget remain (so the route answers inside its 120 s limit).
 * Returns null when the marker is unavailable (no key, errors, or failure twice); the caller returns the editable box,
 * never a mark (constitution Principle VI). The model is `ENGLISH_ESSAY_GRADING_MODEL` only: no other unit's setting is read.
 */
export async function markEnglishEssayWithModel(input: EnglishMarkerInput, options: EnglishMarkerOptions = {}): Promise<EnglishMarkerOutput | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[english-essay] OPENROUTER_API_KEY not set — the marker is unavailable");
    return null;
  }
  const model = options.model ?? getEnglishEssayGradingModel();
  const rub = options.rubric ?? rubric;
  const messages = buildEnglishEssayMessages(input, rub);
  const keyTexts = [input.markingNotes, rub.textNotes.away ?? ""].filter((t) => t.trim());
  const startedAt = Date.now();

  async function attempt(timeoutMs: number): Promise<ParsedEnglishEssayReply | null> {
    const res = await chatCompletion({ model, messages, temperature: 0, maxTokens: options.maxTokens ?? MAX_TOKENS, timeoutMs, json: true });
    if (!res.ok) {
      console.error(`[english-essay] model call failed: ${res.reason}${res.status ? ` ${res.status}` : ""}`);
      return null;
    }
    if (res.finishReason === "length") {
      console.error("[english-essay] reply cut off at max_tokens");
      return null;
    }
    const parsed = parseEnglishEssayReply(res.content);
    if (!parsed) {
      console.error("[english-essay] could not parse the marker reply");
      return null;
    }
    if (containsKeyEcho(parsed, keyTexts, [input.question, input.essay])) {
      console.error("[english-essay] the reply repeated the marking notes or the Away notes");
      return null;
    }
    return parsed;
  }

  let reply = await attempt(Math.min(FIRST_CALL_TIMEOUT_MS, BUDGET_MS));
  if (!reply) {
    const remaining = BUDGET_MS - (Date.now() - startedAt);
    if (remaining >= MIN_RETRY_MS) {
      reply = await attempt(Math.min(FIRST_CALL_TIMEOUT_MS, remaining - RETRY_MARGIN_MS));
    }
  }
  return reply ? { reply, model, promptVersion: rub.promptVersion } : null;
}

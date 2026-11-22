import "server-only";

import { getEssayGradingModel } from "@/lib/config.server";
import { chatCompletion, type ChatMessage } from "@/lib/openrouter.server";
import { countWords } from "@/lib/wordcount";

import conceptList from "./concepts.json";
import rubricJson from "./rubric.json";
import {
  CRITERIA_IDS,
  MAX_GAPS,
  VERDICTS,
  quoteInText,
  scrubFlagWhy,
  type CriterionId,
  type Economy,
  type Gap,
  type Verdict,
} from "./scoring";
import { essayConceptId } from "./types";

// The essay marker (spec 010, research R7): builds the pilot's passing prompt from rubric.json (the ONE
// file scripts/pilot-essay-marker.py also reads, with lib/essay/concepts.json for the concept list), calls
// the unit's model, validates the reply, and retries a bad one once inside a time budget. It receives key
// material (marking notes, school criteria) as arguments from lib/grading.server.ts and sends it to the
// model provider only; nothing here is returned to a browser. It logs nothing but a reason code, never text.

export interface Rubric {
  promptVersion: string;
  wordRange: [number, number];
  bands: Array<{ band: number; min: number; max: number; descriptor: string }>;
  criteria: Record<string, string>;
  verdicts: string[];
  maxGaps: number;
  verbMeanings: Record<string, string>;
  system: string;
  userTemplate: string;
}

export const rubric = rubricJson as unknown as Rubric;
export const concepts = conceptList as Record<string, string>;
export const PROMPT_VERSION = rubric.promptVersion;

/** A starting value: the English markers' models reasoned to 7500 tokens (spec 009's gate), so the pilot decides (research R7, R8e). */
export const MAX_TOKENS = 3000;
export const FIRST_CALL_TIMEOUT_MS = 40_000;
export const BUDGET_MS = 55_000; // inside the grade route's maxDuration of 60 s
export const MIN_RETRY_MS = 12_000;
const RETRY_MARGIN_MS = 2_000;
const MAX_REASON = 300;
const MAX_BAND_REASON = 600;
const MAX_LIFT = 300;
const MAX_DETAIL = 200;
const MAX_FLAGS = 5;
const MAX_USED_WELL = 8;
/** A run of the notes or school criteria this long in the reply is an echo (shorter runs are quotation). */
export const ECHO_RUN = 60;

export function economyRule(economy: Economy): string {
  if (economy === "china") return "one emerging economy (here China)";
  if (economy === "nepal") return "one developing economy (here Nepal)";
  return "one emerging AND one developing economy (here China and Nepal); both must be treated";
}

export interface EssayMarkerInput {
  question: string;
  verb: string;
  economy: Economy;
  markingNotes: string;
  /** The school's own criteria for a trial essay; null for an original one. */
  schoolCriteria: string | null;
  essay: string;
}

/** Single-pass {name} substitution, so a student's own braces are never re-expanded. */
function render(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));
}

export function buildEssayMessages(input: EssayMarkerInput, rub: Rubric = rubric, list: Record<string, string> = concepts): ChatMessage[] {
  const values = {
    question: input.question,
    verb: input.verb,
    verbMeaning: rub.verbMeanings[input.verb] ?? "",
    economyRule: economyRule(input.economy),
    bands: rub.bands.map((b) => `Band ${b.band} (${b.min}-${b.max}): ${b.descriptor}`).join("\n"),
    criteria: Object.entries(rub.criteria)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n"),
    markingNotes: input.markingNotes,
    schoolCriteria: input.schoolCriteria?.trim() ? input.schoolCriteria : "None provided.",
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

export interface ParsedEssayReply {
  criteria: Record<CriterionId, { verdict: Verdict; reason: string }>;
  covers: boolean;
  flags: Array<{ quote: string; why: string }>;
  band: number;
  mark: number;
  bandReason: string;
  lift: string[];
  /** Concept ids (full ids) from the list, deduped, at most maxGaps, in the marker's order. */
  gaps: Gap[];
  /** Concept ids (full ids) used well, from the list, never also a gap. */
  usedWell: string[];
  /** false when the reply left conceptsUsedWell out (counted as []; reported as a metric). */
  usedWellPresent: boolean;
}

const text = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * The first {...} block of the reply, as the pilot does. A missing verdict, band, mark,
 * coversRequiredEconomies, band reason or lift point makes the whole reply a failure: it is never read
 * as a default (constitution Principle VI). Flags whose quote is not in the essay are dropped and a
 * reason that gives a number not in its quote is replaced; gaps and used-well ids that are not on the
 * concept list are dropped.
 */
export function parseEssayReply(content: string, essay: string, list: Record<string, string> = concepts): ParsedEssayReply | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }

  const rawCriteria = (obj.criteria && typeof obj.criteria === "object" ? obj.criteria : {}) as Record<string, unknown>;
  const criteria = {} as ParsedEssayReply["criteria"];
  for (const id of CRITERIA_IDS) {
    const entry = rawCriteria[id];
    if (!entry || typeof entry !== "object") return null;
    const verdict = (entry as { verdict?: unknown }).verdict;
    if (typeof verdict !== "string" || !(VERDICTS as readonly string[]).includes(verdict)) return null;
    criteria[id] = { verdict: verdict as Verdict, reason: text((entry as { reason?: unknown }).reason, MAX_REASON) };
  }

  const band = obj.band;
  if (typeof band !== "number" || !Number.isInteger(band) || band < 1 || band > 5) return null;
  const mark = obj.mark;
  if (typeof mark !== "number" || !Number.isInteger(mark) || mark < 0 || mark > 20) return null;
  const covers = obj.coversRequiredEconomies;
  if (typeof covers !== "boolean") return null;
  const bandReason = text(obj.bandReason, MAX_BAND_REASON);
  if (!bandReason) return null;
  const liftRaw = Array.isArray(obj.liftYourMark) ? obj.liftYourMark : [];
  const lift = liftRaw.map((x) => text(x, MAX_LIFT)).filter(Boolean).slice(0, 2);
  if (lift.length === 0) return null;

  const flags: ParsedEssayReply["flags"] = [];
  for (const f of Array.isArray(obj.dataFlags) ? obj.dataFlags : []) {
    if (!f || typeof f !== "object") continue;
    const quote = text((f as { quote?: unknown }).quote, 300);
    if (!quote || !quoteInText(quote, essay)) continue;
    flags.push({ quote, why: scrubFlagWhy(quote, text((f as { why?: unknown }).why, 300)) });
    if (flags.length >= MAX_FLAGS) break;
  }

  const gaps: Gap[] = [];
  const gapKeys = new Set<string>();
  for (const g of Array.isArray(obj.gaps) ? obj.gaps : []) {
    if (!g || typeof g !== "object") continue;
    const key = (g as { concept?: unknown }).concept;
    if (typeof key !== "string" || !(key in list) || gapKeys.has(key)) continue;
    gapKeys.add(key);
    gaps.push({ conceptId: essayConceptId(key), detail: text((g as { detail?: unknown }).detail, MAX_DETAIL) });
    if (gaps.length >= MAX_GAPS) break;
  }

  const usedPresent = "conceptsUsedWell" in obj;
  const usedWell: string[] = [];
  for (const u of Array.isArray(obj.conceptsUsedWell) ? obj.conceptsUsedWell : []) {
    if (typeof u !== "string" || !(u in list) || gapKeys.has(u)) continue;
    const id = essayConceptId(u);
    if (!usedWell.includes(id)) usedWell.push(id);
    if (usedWell.length >= MAX_USED_WELL) break;
  }

  return { criteria, covers, flags, band, mark, bandReason, lift, gaps, usedWell, usedWellPresent: usedPresent };
}

const squash = (s: string): string => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * True when the reply repeats a run of ECHO_RUN or more characters of the marking notes or the school's
 * criteria that is not also in the question or the student's essay. Rejecting such a reply keeps key text
 * out of the browser (constitution Principle I).
 */
export function containsKeyEcho(reply: ParsedEssayReply, keyTexts: readonly string[], allowedIn: readonly string[]): boolean {
  const strings = [
    reply.bandReason,
    ...reply.lift,
    ...Object.values(reply.criteria).map((c) => c.reason),
    ...reply.flags.map((f) => f.why),
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

export interface EssayMarkerOutput {
  reply: ParsedEssayReply;
  model: string;
  promptVersion: string;
}

export interface EssayMarkerOptions {
  rubric?: Rubric;
  model?: string;
  maxTokens?: number;
}

/**
 * One marking: the model call, with ONE retry on a failed call, a cut-off, empty, unparseable or
 * incomplete reply or an echo, but only while at least MIN_RETRY_MS of the 55 s budget remain (so the
 * route answers inside its 60 s limit). Returns null when the marker is unavailable (no key, errors,
 * or failure twice); the caller returns the editable box, never a mark (constitution Principle VI).
 */
export async function markEssayWithModel(input: EssayMarkerInput, options: EssayMarkerOptions = {}): Promise<EssayMarkerOutput | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[essay] OPENROUTER_API_KEY not set — the marker is unavailable");
    return null;
  }
  const model = options.model ?? getEssayGradingModel();
  const rub = options.rubric ?? rubric;
  const messages = buildEssayMessages(input, rub);
  const keyTexts = [input.markingNotes, input.schoolCriteria ?? ""].filter((t) => t.trim());
  const startedAt = Date.now();

  async function attempt(timeoutMs: number): Promise<ParsedEssayReply | null> {
    const res = await chatCompletion({ model, messages, temperature: 0, maxTokens: options.maxTokens ?? MAX_TOKENS, timeoutMs, json: true });
    if (!res.ok) {
      console.error(`[essay] model call failed: ${res.reason}${res.status ? ` ${res.status}` : ""}`);
      return null;
    }
    if (res.finishReason === "length") {
      console.error("[essay] reply cut off at max_tokens");
      return null;
    }
    const parsed = parseEssayReply(res.content, input.essay);
    if (!parsed) {
      console.error("[essay] could not parse the marker reply");
      return null;
    }
    if (!parsed.usedWellPresent) console.warn("[essay] metric used_well_missing=1");
    if (containsKeyEcho(parsed, keyTexts, [input.question, input.essay])) {
      console.error("[essay] the reply repeated the marking notes or the school's criteria");
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

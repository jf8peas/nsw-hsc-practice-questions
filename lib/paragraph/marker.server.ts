import "server-only";

import { chatCompletion, DEFAULT_MODEL, type ChatMessage } from "@/lib/openrouter.server";
import type { RawMarkerVerdicts } from "@/lib/paragraph/scoring";
import type { PartKey } from "@/lib/paragraph/parts";
import { PART_ORDER } from "@/lib/paragraph/parts";
import type { EssayKey } from "@/lib/types";

import rubricJson from "./rubric.json";

// The paragraph marker (spec 007, research R4): builds the round 5 prompt from rubric.json (the
// ONE file the pilot script also reads), calls the model, parses the reply with one retry. It
// receives key material (the current model part and the marking notes) as arguments from
// lib/grading.server.ts and sends it to the model provider only; nothing here is returned to a
// browser. It logs nothing but a reason code, never any text.

interface Rubric {
  promptVersion: string;
  parts: Record<PartKey, { name: string; limit: number; job: string; criteria: Record<"a" | "b" | "c", string> }>;
  conventions: Record<string, string>;
  soFarHeader: string;
  system: string;
  userTemplate: string;
}

export const rubric = rubricJson as unknown as Rubric;
export const PROMPT_VERSION = rubric.promptVersion;

const MAX_TOKENS = 1200;
const TIMEOUT_MS = 30_000;
const MAX_REASON = 300;
const MAX_FEEDBACK = 400;

export interface MarkerInput {
  part: PartKey;
  question: string;
  verb: string;
  economy: string;
  economyType: string;
  strategy: string;
  brief: EssayKey["brief"];
  /** The model text of the earlier parts, in order, exactly as shown to the student. */
  earlierModels: string[];
  /** The current part's model (key material; goes to the provider, never to the browser). */
  model: string;
  markingNotes: string;
  answer: string;
}

/** Single-pass {name} substitution, so a student's own braces are never re-expanded. */
function render(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));
}

export function buildParagraphMessages(input: MarkerInput): ChatMessage[] {
  const spec = rubric.parts[input.part];
  const soFar = input.earlierModels.map((text, i) => `${rubric.parts[PART_ORDER[i]].name}: ${text}`);
  const values = {
    question: input.question,
    verb: input.verb,
    economy: input.economy,
    economyType: input.economyType,
    strategy: input.strategy,
    argument: input.brief.argument,
    counterpoint: input.brief.counterpoint,
    chainSteps: input.brief.chainSteps.join(" -> "),
    facts: input.brief.facts.join(" "),
    limitation: input.brief.limitation.join(" "),
    soFar: soFar.length > 0 ? `${rubric.soFarHeader}${soFar.join("\n")}\n\n` : "",
    partName: spec.name,
    job: spec.job,
    limit: spec.limit,
    criteria: Object.entries(spec.criteria)
      .map(([k, v]) => `(${k}) ${v}`)
      .join("\n"),
    conventions: Object.entries(rubric.conventions)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n"),
    model: input.model,
    markingNotes: input.markingNotes,
    answer: input.answer,
  };
  return [
    { role: "system", content: rubric.system },
    { role: "user", content: render(rubric.userTemplate, values) },
  ];
}

/** A clear boolean, or null. Accepts true/false, "true"/"false", or an object with `met`. */
function flag(v: unknown): boolean | null {
  if (v && typeof v === "object" && !Array.isArray(v)) v = (v as { met?: unknown }).met;
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return null;
}

const text = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * The first {...} block of the reply, as the pilot and the sentence unit do. A missing or unclear
 * verdict makes the whole reply a failure: it is never read as "not met". `restated` is discarded
 * (it can hold a rewrite of the student's text).
 */
export function parseMarkerReply(content: string): RawMarkerVerdicts | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
  const crit = (obj.criteria && typeof obj.criteria === "object" ? obj.criteria : {}) as Record<string, unknown>;
  const conv = (obj.conventions && typeof obj.conventions === "object" ? obj.conventions : {}) as Record<string, unknown>;
  const reasonOf = (v: unknown) => (v && typeof v === "object" ? text((v as { reason?: unknown }).reason, MAX_REASON) : "");

  const a = flag(crit.a);
  const b = flag(crit.b);
  const c = flag(crit.c);
  const precise = flag(conv.preciseLanguage);
  const padding = flag(conv.noPadding);
  const feedback = text(obj.feedback, MAX_FEEDBACK);
  if (a === null || b === null || c === null || precise === null || padding === null || !feedback) return null;
  return {
    a: { met: a, reason: reasonOf(crit.a) },
    b: { met: b, reason: reasonOf(crit.b) },
    c: { met: c, reason: reasonOf(crit.c) },
    conventions: { reason: text(conv.reason, MAX_REASON), preciseLanguage: precise, noPadding: padding },
    feedback,
  };
}

export interface MarkerOutput {
  raw: RawMarkerVerdicts;
  model: string;
  promptVersion: string;
}

/**
 * One marking: the model call with ONE retry on a failed call or an unparseable reply. Returns
 * null when the marker is unavailable (no key, errors, or unparseable twice); the caller falls
 * back (self-mark at phase 1, the first-try mark at phase 2).
 */
export async function markWithModel(input: MarkerInput): Promise<MarkerOutput | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[paragraph] OPENROUTER_API_KEY not set — the marker is unavailable");
    return null;
  }
  const model = process.env.GRADING_MODEL || DEFAULT_MODEL;
  const messages = buildParagraphMessages(input);

  async function attempt(): Promise<RawMarkerVerdicts | null> {
    const res = await chatCompletion({ model, messages, temperature: 0, maxTokens: MAX_TOKENS, timeoutMs: TIMEOUT_MS, json: true });
    if (!res.ok) {
      console.error(`[paragraph] model call failed: ${res.reason}${res.status ? ` ${res.status}` : ""}`);
      return null;
    }
    const parsed = parseMarkerReply(res.content);
    if (!parsed) console.error("[paragraph] could not parse the marker reply");
    return parsed;
  }

  const raw = (await attempt()) ?? (await attempt());
  return raw ? { raw, model, promptVersion: PROMPT_VERSION } : null;
}

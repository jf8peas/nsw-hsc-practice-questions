import "server-only";

import { getEssayReviewModel } from "@/lib/config.server";
import type { StoredPlanReview } from "@/lib/db/schema";
import { chatCompletion, type ChatMessage } from "@/lib/openrouter.server";
import { trimToLimit } from "@/lib/trim";

import { economyRule } from "./marker.server";
import reviewJson from "./review.json";
import rubricJson from "./rubric.json";
import { SCAFFOLD_FIELDS, SCAFFOLD_SECTION_TITLES, getField, type EssayScaffold, type ScaffoldField } from "./scaffold";
import { quoteInText, scrubFlagWhy, type Economy } from "./scoring";

// The optional plan review (spec 010 FR-012 to FR-017, research R5): its own prompt file, its own model setting,
// no mark. It receives the question, the verb, the economy rule and the student's own plan; never the marking
// notes, the school's criteria or the model essay. A fix must be a question or prompt (it must contain a "?"),
// which is the one checkable proxy for "never writes sentences for the student".

export interface ReviewPrompt {
  promptVersion: string;
  checks: Array<{ id: string; label: string; look: string }>;
  system: string;
  userTemplate: string;
}

export const reviewPrompt = reviewJson as unknown as ReviewPrompt;
export const REVIEW_PROMPT_VERSION = reviewPrompt.promptVersion;
/** The seven check ids in the order the student sees them. */
export const CHECK_IDS = reviewPrompt.checks.map((c) => c.id) as StoredPlanReview["checks"][number]["id"][];
export const CHECK_LABEL = Object.fromEntries(reviewPrompt.checks.map((c) => [c.id, c.label])) as Record<string, string>;

export const REVIEW_MAX_TOKENS = 2500;
export const REVIEW_FIRST_CALL_TIMEOUT_MS = 25_000;
export const REVIEW_BUDGET_MS = 45_000; // inside the review route's maxDuration of 60 s
export const REVIEW_MIN_RETRY_MS = 10_000;
const RETRY_MARGIN_MS = 2_000;
const MAX_LINE = 240;
const MAX_WHY = 600;
const MAX_FLAGS = 4;

/** The plan as the reviewer reads it: each section, each field's label and text, an empty field shown as (empty). */
export function planForPrompt(plan: EssayScaffold): string {
  const sections = Object.keys(SCAFFOLD_SECTION_TITLES) as ScaffoldField["section"][];
  return sections
    .map((section) => {
      const lines = SCAFFOLD_FIELDS.filter((f) => f.section === section).map((f) => `- ${f.label}: ${getField(plan, f).trim() || "(empty)"}`);
      return `${SCAFFOLD_SECTION_TITLES[section]}\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

export interface ReviewInput {
  question: string;
  verb: string;
  economy: Economy;
  plan: EssayScaffold;
}

function render(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? values[name]! : whole));
}

export function buildReviewMessages(input: ReviewInput, prompt: ReviewPrompt = reviewPrompt): ChatMessage[] {
  const verbMeanings = (rubricJson as unknown as { verbMeanings: Record<string, string> }).verbMeanings;
  const values = {
    question: input.question,
    verb: input.verb,
    verbMeaning: verbMeanings[input.verb] ?? "",
    economyRule: economyRule(input.economy),
    checks: prompt.checks.map((c) => `- ${c.id}: ${c.look}`).join("\n"),
    plan: planForPrompt(input.plan),
  };
  return [
    { role: "system", content: prompt.system },
    { role: "user", content: render(prompt.userTemplate, values) },
  ];
}

const text = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * The first {...} block of the reply. Exactly the seven check ids, once each (re-sorted to the student's order); a
 * status outside strength or fix, an empty or over-long line, or a fix without a question mark makes the whole reply
 * a failure. Figure flags need a quote that is really in the plan and never carry a replacement number. Unknown keys
 * (a mark, a band, rewritten text) are ignored and never stored.
 */
export function parseReviewReply(content: string, planText: string): StoredPlanReview | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
  const raw = Array.isArray(obj.checks) ? obj.checks : null;
  if (!raw || raw.length !== CHECK_IDS.length) return null;
  const byId = new Map<string, { status: "strength" | "fix"; line: string }>();
  for (const c of raw) {
    if (!c || typeof c !== "object") return null;
    const { id, status, line } = c as { id?: unknown; status?: unknown; line?: unknown };
    if (typeof id !== "string" || !(CHECK_IDS as string[]).includes(id) || byId.has(id)) return null;
    if (status !== "strength" && status !== "fix") return null;
    const l = text(line, MAX_LINE + 1);
    if (!l || l.length > MAX_LINE) return null;
    if (status === "fix" && !l.includes("?")) return null;
    byId.set(id, { status, line: l });
  }
  const checks = CHECK_IDS.map((id) => ({ id, ...byId.get(id)! }));

  const figureFlags: StoredPlanReview["figureFlags"] = [];
  for (const f of Array.isArray(obj.figureFlags) ? obj.figureFlags : []) {
    if (!f || typeof f !== "object") continue;
    const quote = text((f as { quote?: unknown }).quote, 300);
    if (!quote || !quoteInText(quote, planText)) continue;
    const why = (f as { why?: unknown }).why;
    figureFlags.push({ quote, why: scrubFlagWhy(quote, typeof why === "string" ? trimToLimit(why, MAX_WHY) : "") });
    if (figureFlags.length >= MAX_FLAGS) break;
  }
  return { checks, figureFlags };
}

export interface ReviewOutput {
  review: StoredPlanReview;
  model: string;
  promptVersion: string;
}

/**
 * One review: the model call with ONE retry on a failed call, a cut-off, empty or malformed reply, but only while
 * at least REVIEW_MIN_RETRY_MS of the 45 s budget remain. Null when the reviewer is unavailable (no key, errors,
 * or a bad reply twice); the caller says so and offers "Start writing" (constitution Principle VI).
 */
export async function reviewPlan(input: ReviewInput, options: { model?: string; prompt?: ReviewPrompt } = {}): Promise<ReviewOutput | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[essay] OPENROUTER_API_KEY not set — the reviewer is unavailable");
    return null;
  }
  const model = options.model ?? getEssayReviewModel();
  const prompt = options.prompt ?? reviewPrompt;
  const messages = buildReviewMessages(input, prompt);
  const planText = planForPrompt(input.plan);
  const startedAt = Date.now();

  async function attempt(timeoutMs: number): Promise<StoredPlanReview | null> {
    const res = await chatCompletion({ model, messages, temperature: 0, maxTokens: REVIEW_MAX_TOKENS, timeoutMs, json: true });
    if (!res.ok) {
      console.error(`[essay] review call failed: ${res.reason}${res.status ? ` ${res.status}` : ""}`);
      return null;
    }
    if (res.finishReason === "length") {
      console.error("[essay] review reply cut off at max_tokens");
      return null;
    }
    const parsed = parseReviewReply(res.content, planText);
    if (!parsed) console.error("[essay] could not parse the review reply");
    return parsed;
  }

  let review = await attempt(Math.min(REVIEW_FIRST_CALL_TIMEOUT_MS, REVIEW_BUDGET_MS));
  if (!review) {
    const remaining = REVIEW_BUDGET_MS - (Date.now() - startedAt);
    if (remaining >= REVIEW_MIN_RETRY_MS) review = await attempt(Math.min(REVIEW_FIRST_CALL_TIMEOUT_MS, remaining - RETRY_MARGIN_MS));
  }
  return review ? { review, model, promptVersion: prompt.promptVersion } : null;
}

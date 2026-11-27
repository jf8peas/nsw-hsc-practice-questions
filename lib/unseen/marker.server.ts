import "server-only";

import { getEnglishAdvModel } from "@/lib/config.server";
import type { AnySkillVerdicts, SkillVerdict } from "@/lib/db/schema";
import { chatCompletion, type ChatMessage } from "@/lib/openrouter.server";
import { trimToLimit } from "@/lib/trim";
import type { UnseenText } from "@/lib/types";
import { SKILL_IDS } from "@/lib/unseen/skills";
import { countWords } from "@/lib/wordcount";

import rubricJson from "./rubric.json";

// The unseen-text marker (spec 008, research R5): builds the pilot's passing prompt from rubric.json
// (the ONE file scripts/pilot-unseen-marker.py also reads), calls the unit's model, and parses the
// reply with one retry inside a time budget. It receives key material (criteria, notes, the model
// answer and a visual's description) as arguments from lib/grading.server.ts and sends it to the model
// provider only; nothing here is returned to a browser. It logs nothing but a reason code, never text.

export interface Rubric {
  promptVersion: string;
  directiveVerbs: Record<string, string>;
  systemPrompt: string;
  userTemplate: string;
}

export const rubric = rubricJson as unknown as Rubric;
export const PROMPT_VERSION = rubric.promptVersion;

export const MAX_TOKENS = 4000; // the pilot needed it: the model reasons before replying
export const FIRST_CALL_TIMEOUT_MS = 40_000;
export const BUDGET_MS = 55_000; // inside the grade route's maxDuration of 60 s
export const MIN_RETRY_MS = 12_000;
const RETRY_MARGIN_MS = 2_000;
// Ceilings against a runaway reply, not target lengths (the prompt asks for those). Keep them well above a normal reply.
const MAX_REASON = 1200;
const MAX_FEEDBACK = 1500;
const MAX_GAP = 800;
const MAX_GO_FURTHER = 800;
/** A run of the model answer this long in the reply is an echo (shorter runs are quotations). */
export const ECHO_RUN = 60;

/** One text the marker is given (spec 009: a comparative question gives it each picked text in tab order). */
export interface MarkerText {
  /** The text's heading as on the paper, e.g. "Text 4 – Poem". */
  heading: string;
  /** The text form as the prompt names it. */
  textForm: string;
  visual: boolean;
  /** The stimulus text, or for a visual text its written description. */
  text: string;
}

export interface UnseenMarkerInput {
  /** Several texts (the comparative unit); the prompt's {texts} placeholder is filled from them. The single-text fields below stay for spec 008. */
  texts?: MarkerText[];
  maxMarks: number;
  /** The text's heading as on the paper, e.g. "Text 1 – Poem". */
  questionHeading: string;
  /** The question, parts joined as "(a) … (b) …". */
  question: string;
  verb: string;
  /** The text form as the prompt names it: "poem", "prose fiction", "visual" … */
  textForm: string;
  visual: boolean;
  /** The stimulus text, or for a visual text its written description. */
  text: string;
  criteria: string;
  notes: string;
  suggestedWords: number;
  /** The example full-mark answer (the school's, or a reviewed generated one). */
  modelAnswer: string;
  /** The public stimulus as rendered, used by the echo guard to allow legitimate quotation. */
  stimulus: string;
  answer: string;
}

/** Single-pass {name} substitution, so a student's own braces are never re-expanded. */
function render(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));
}

/** "prose-fiction" → "prose fiction": the form names the pilot prompt used. */
export const formForPrompt = (form: string): string => form.replace(/^(prose|personal)-/, "$1 ");

const NL = "\n";
const VISUAL_NOTE = " — VISUAL TEXT: you cannot see the image; this is a written description of it";

/** The picked texts as the comparative prompt shows them: a numbered block per text, in tab order. */
export function renderMarkerTexts(texts: readonly MarkerText[]): string {
  return texts
    .map((t, i) => `TEXT ${i + 1} — ${t.heading} (${t.textForm})${t.visual ? VISUAL_NOTE : ""}` + NL + t.text)
    .join(NL + NL);
}

export function buildUnseenMessages(input: UnseenMarkerInput, rub: Rubric = rubric): ChatMessage[] {
  const values = {
    texts: input.texts ? renderMarkerTexts(input.texts) : "",
    anchor: input.modelAnswer || "None available.",
    marks: input.maxMarks,
    questionHeading: input.questionHeading,
    question: input.question,
    directive: input.verb,
    directiveDefinition: rub.directiveVerbs[input.verb] ?? "",
    textForm: input.textForm,
    visualNote: input.visual ? VISUAL_NOTE : "",
    text: input.text,
    criteria: input.criteria,
    notes: input.notes || "None provided.",
    suggestedWords: input.suggestedWords,
    wordCount: countWords(input.answer),
    answer: input.answer,
  };
  return [
    { role: "system", content: rub.systemPrompt },
    { role: "user", content: render(rub.userTemplate, values) },
  ];
}

/** The stimulus as the marker reads it: title, author, the layout, then the paper's footnotes. */
export function renderTextForMarker(text: UnseenText): string {
  const head = [text.title, text.author].filter(Boolean).join("\n");
  const body =
    text.body.kind === "poem"
      ? text.body.stanzas.map((lines) => lines.join("\n")).join("\n\n")
      : text.body.kind === "prose"
        ? text.body.paragraphs.join("\n\n")
        : "";
  const notes = (text.footnotes ?? []).map((f) => `${f.mark} ${f.text}`).join("\n");
  return [head, body, notes].filter((part) => part.trim()).join("\n\n");
}

// ---- parsing ----------------------------------------------------------------------------------

export interface ParsedReply {
  mark: number;
  skills: AnySkillVerdicts;
  feedback: string;
  /** The one thing to fix; "" at full marks, where there is no gap (goFurther does the job). */
  biggestGap: string;
  /** One sentence of advice beyond the top band: set only when the mark is full marks, else null (FR-018). */
  goFurther: string | null;
  /** true or false for a visual text; null otherwise. */
  descriptionAdequate: boolean | null;
  /** Fields the parser filled in from the verdict reasons because the reply left them out (a metric, never shown as such). */
  filled?: Array<"feedback" | "biggestGap">;
}

/** A clear boolean, or null. Accepts true/false, "true"/"false", or an object with `met`. */
function flag(v: unknown): boolean | null {
  if (v && typeof v === "object" && !Array.isArray(v)) v = (v as { met?: unknown }).met;
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return null;
}

const text = (v: unknown, max: number): string => (typeof v === "string" ? trimToLimit(v, max) : "");

/**
 * The first {...} block of the reply, as the pilot does. A missing mark, verdict or feedback makes
 * the whole reply a failure: it is never read as "missed" or as a default (FR-015). A reply with a
 * valid mark and all seven verdicts but no feedback, or (below full marks) no biggestGap, is repaired
 * instead: feedback is filled from the met skills' reasons and biggestGap from the first missed skill's
 * reason, and `filled` records it. If there is no reason to fill from, the reply fails. A
 * full-mark reply with a missing or empty goFurther also fails; a
 * full-mark reply may have a null or empty biggestGap, and a goFurther on a below-full reply is
 * dropped (biggestGap does that job). A missing reason is stored as "".
 */
export function parseUnseenReply(content: string, maxMarks: number, skillIds: readonly string[] = SKILL_IDS): ParsedReply | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
  const mark = obj.mark;
  if (typeof mark !== "number" || !Number.isInteger(mark) || mark < 0 || mark > maxMarks) return null;

  const raw = (obj.skills && typeof obj.skills === "object" ? obj.skills : {}) as Record<string, unknown>;
  const skills: Record<string, SkillVerdict> = {};
  for (const id of skillIds) {
    const met = flag(raw[id]);
    if (met === null) return null;
    const entry = raw[id];
    const reason = entry && typeof entry === "object" ? text((entry as { reason?: unknown }).reason, MAX_REASON) : "";
    skills[id] = { met, reason };
  }

  const filled: Array<"feedback" | "biggestGap"> = [];
  let feedback = text(obj.feedback, MAX_FEEDBACK);
  if (!feedback) {
    const met = skillIds.filter((id) => skills[id].met && skills[id].reason).map((id) => skills[id].reason);
    feedback = trimToLimit(met.join(" "), MAX_FEEDBACK);
    if (!feedback) return null;
    filled.push("feedback");
  }

  // Full marks: there is no gap to name, so biggestGap may be null or empty (it is stored as "") and a
  // goFurther is required instead. Below full marks biggestGap is required and goFurther is dropped.
  // goFurther never affects the mark: it is read after the mark.
  const full = mark === maxMarks;
  let biggestGap = text(obj.biggestGap, MAX_GAP);
  if (!full && !biggestGap) {
    const firstMissed = skillIds.find((id) => !skills[id].met && skills[id].reason);
    if (!firstMissed) return null;
    biggestGap = trimToLimit(skills[firstMissed].reason, MAX_GAP);
    filled.push("biggestGap");
  }
  const goFurther = full ? text(obj.goFurther, MAX_GO_FURTHER) : "";
  if (full && !goFurther) return null;

  const adequate = flag(obj.descriptionAdequate);
  return { mark, skills: skills as AnySkillVerdicts, feedback, biggestGap, goFurther: goFurther || null, descriptionAdequate: adequate, ...(filled.length ? { filled } : {}) };
}

const squash = (s: string): string => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * True when the reply repeats a run of ECHO_RUN or more characters of the model answer that is not
 * also in the public stimulus (the model answer legitimately quotes the text). Rejecting such a reply
 * keeps the model answer out of the browser before the discussion (constitution Principle I).
 */
export function containsModelEcho(reply: ParsedReply, modelAnswer: string, stimulus: string): boolean {
  const model = squash(modelAnswer);
  if (model.length < ECHO_RUN) return false;
  const inStimulus = squash(stimulus);
  const strings = [reply.feedback, reply.biggestGap, reply.goFurther ?? "", ...Object.values(reply.skills).map((v) => v?.reason ?? "")].map(squash);
  const haystack = strings.join(" ¶ ");
  for (let i = 0; i + ECHO_RUN <= model.length; i++) {
    const window = model.slice(i, i + ECHO_RUN);
    // a window that starts or ends on a space is the same run shifted by one character: skip it, so
    // a quotation of the text is never flagged because the model answer introduces it with a space
    if (window.startsWith(" ") || window.endsWith(" ")) continue;
    if (haystack.includes(window) && !inStimulus.includes(window)) return true;
  }
  return false;
}

// ---- marking ----------------------------------------------------------------------------------

export interface UnseenMarkerOutput {
  reply: ParsedReply;
  model: string;
  promptVersion: string;
}

/**
 * One marking: the model call, with ONE retry on a failed call, a cut-off, empty, unparseable or
 * incomplete reply or an echo, but only while at least MIN_RETRY_MS of the 55 s budget remain (so the
 * route answers inside its 60 s limit). Returns null when the marker is unavailable (no key, errors,
 * or failure twice); the caller returns the editable box, never a mark (constitution Principle VI).
 */
/** What differs between the units' markers: the prompt file and the skills the reply must carry (spec 009 research R6). */
export interface MarkerOptions {
  rubric?: Rubric;
  skillIds?: readonly string[];
  /** Overrides the unit's model (the comparative unit's own model only if its marker check demands one). */
  model?: string;
  /** Overrides max_tokens (the comparative marker reasons for longer: lib/comparative/rubric.ts). */
  maxTokens?: number;
}

export async function markWithModel(input: UnseenMarkerInput, options: MarkerOptions = {}): Promise<UnseenMarkerOutput | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[unseen] OPENROUTER_API_KEY not set — the marker is unavailable");
    return null;
  }
  const model = options.model ?? getEnglishAdvModel();
  const rub = options.rubric ?? rubric;
  const skillIds = options.skillIds ?? SKILL_IDS;
  const messages = buildUnseenMessages(input, rub);
  const startedAt = Date.now();

  async function attempt(timeoutMs: number): Promise<ParsedReply | null> {
    const res = await chatCompletion({ model, messages, temperature: 0, maxTokens: options.maxTokens ?? MAX_TOKENS, timeoutMs, json: true });
    if (!res.ok) {
      console.error(`[unseen] model call failed: ${res.reason}${res.status ? ` ${res.status}` : ""}`);
      return null;
    }
    if (res.finishReason === "length") {
      console.error("[unseen] reply cut off at max_tokens");
      return null;
    }
    const parsed = parseUnseenReply(res.content, input.maxMarks, skillIds);
    if (!parsed) {
      console.error("[unseen] could not parse the marker reply");
      return null;
    }
    if (parsed.filled?.length) console.warn(`[unseen] metric reply_filled=${parsed.filled.join(",")}`); // field names only, never text
    if (containsModelEcho(parsed, input.modelAnswer, input.stimulus)) {
      console.error("[unseen] the reply repeated the model answer");
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

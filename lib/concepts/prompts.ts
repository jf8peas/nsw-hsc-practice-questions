// Prompts and reply parsers for the concept pipeline (specs/002-learn-from-mistakes/contracts/llm.md).
// Pure: no I/O, no secrets. Each system prompt starts with a `[task: …]` line so a stand-in
// server and the logs can tell the four purposes apart.

import type {
  ConceptContext,
  ContentRejected,
  GenerateIllustrationInput,
  GenerateSummaryInput,
  GeneratedSummary,
  ReviewIllustrationInput,
  ReviewMaterial,
  ReviewSummaryInput,
  ReviewVerdict,
  UnitContext,
} from "@/lib/concepts/port";

export interface PromptMessage {
  role: "system" | "user";
  content: string;
}

export const MIN_BULLETS = 3;
export const MAX_BULLETS = 6;
export const MAX_BULLET_CHARS = 240;
export const MAX_ALT_CHARS = 300;
export const MAX_REASON_CHARS = 1000;

export const SUMMARY_CHECKS = ["matches_concept", "accurate", "no_answer_leak", "general_not_question_specific"] as const;
export const ILLUSTRATION_CHECKS = ["matches_concept", "labels_correct", "axes_correct", "shapes_correct", "no_answer_leak"] as const;

const unitBlock = (u: UnitContext, c: ConceptContext) =>
  `Unit: ${u.title} (${u.topic})\nUnit description: ${u.description}\nConcept: ${c.description}`;

// ---- summary generator -------------------------------------------------------

export function summaryMessages(i: GenerateSummaryInput): PromptMessage[] {
  const system =
    `[task: concept-summary]\n` +
    `You write short revision notes for NSW HSC Year 11 students (Australian English). ` +
    `Explain ONE concept in general terms so a student can relearn it.\n` +
    `Rules:\n` +
    `- Write ${MIN_BULLETS} to ${MAX_BULLETS} bullet points, each at most ${MAX_BULLET_CHARS} characters.\n` +
    `- Explain the concept itself. Do not explain why any particular answer is right or wrong, and never state the answer to any question.\n` +
    `- Be accurate and use the terms students meet in the syllabus. Plain language.\n` +
    `- Decide whether a simple labelled diagram would help the student understand it. If so give a one-sentence brief for the diagram and short alt text; otherwise use null.\n` +
    `Reply with JSON only, exactly this shape: ` +
    `{"bullets": ["..."], "illustration": null} or {"bullets": ["..."], "illustration": {"brief": "...", "alt": "..."}}`;
  const user =
    `${unitBlock(i.unit, i.concept)}\n\n` +
    `Questions that test this concept (for context only; do not answer them):\n` +
    (i.questionPrompts.length > 0 ? i.questionPrompts.map((p, n) => `${n + 1}. ${p}`).join("\n") : "(none)");
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function firstJsonObject(content: string): Record<string, unknown> | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(content.slice(start, end + 1));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const rejected = (reason: string): ContentRejected => ({ ok: false, kind: "content_rejected", reason });

/** Validate the generator's reply. Anything outside the rules is `content_rejected` (tokens were spent). */
export function parseSummary(content: string): { ok: true; value: GeneratedSummary } | ContentRejected {
  const obj = firstJsonObject(content);
  if (!obj) return rejected("the reply was not a JSON object");

  const bullets = obj.bullets;
  if (!Array.isArray(bullets) || bullets.length < MIN_BULLETS || bullets.length > MAX_BULLETS) {
    return rejected(`bullets must be ${MIN_BULLETS} to ${MAX_BULLETS} items`);
  }
  const cleaned: string[] = [];
  for (const b of bullets) {
    if (typeof b !== "string" || !b.trim()) return rejected("a bullet was empty or not text");
    const text = b.trim();
    if (text.length > MAX_BULLET_CHARS) return rejected(`a bullet is longer than ${MAX_BULLET_CHARS} characters`);
    cleaned.push(text);
  }

  if (!("illustration" in obj)) return rejected("the illustration key is missing");
  const ill = obj.illustration;
  if (ill === null) return { ok: true, value: { bullets: cleaned, illustration: null } };
  if (!ill || typeof ill !== "object") return rejected("illustration must be null or an object");
  const { brief, alt } = ill as { brief?: unknown; alt?: unknown };
  if (typeof brief !== "string" || !brief.trim() || typeof alt !== "string" || !alt.trim()) {
    return rejected("illustration needs a non-empty brief and alt");
  }
  if (alt.trim().length > MAX_ALT_CHARS) return rejected(`alt text is longer than ${MAX_ALT_CHARS} characters`);
  return { ok: true, value: { bullets: cleaned, illustration: { brief: brief.trim(), alt: alt.trim() } } };
}

// ---- reviewers ---------------------------------------------------------------------

function materialBlock(m: ReviewMaterial): string {
  if (m.questions.length === 0) return "(no questions are tagged with this concept)";
  return m.questions
    .map((q, n) => {
      const parts = [`${n + 1}. ${q.prompt}`];
      if (q.modelAnswer) parts.push(`   Model answer: ${q.modelAnswer}`);
      if (q.correctText) parts.push(`   Correct option: ${q.correctText}`);
      if (q.rubric.length > 0) parts.push(`   Rubric: ${q.rubric.join(" | ")}`);
      return parts.join("\n");
    })
    .join("\n");
}

export function summaryReviewMessages(i: ReviewSummaryInput): PromptMessage[] {
  const system =
    `[task: concept-summary-review]\n` +
    `You are a careful reviewer of revision notes written for NSW HSC Year 11 students. ` +
    `Check the notes against the concept and against the confidential answer key. Answer each check true or false:\n` +
    `- matches_concept: the notes cover the concept described and do not drift to another topic.\n` +
    `- accurate: every statement is correct and none contradicts the answer key.\n` +
    `- no_answer_leak: the notes do not reproduce any model answer, rubric point or correct option.\n` +
    `- general_not_question_specific: the notes explain the concept in general, not as the answer to one question.\n` +
    `Reply with JSON only: {"checks": {"matches_concept": true, "accurate": true, "no_answer_leak": true, "general_not_question_specific": true}, "reason": "one or two sentences, required when any check is false"}`;
  const user =
    `${unitBlock(i.unit, i.concept)}\n\n` +
    `Notes to review:\n${i.bullets.map((b) => `- ${b}`).join("\n")}\n\n` +
    `Questions on this concept and their CONFIDENTIAL answer key (the notes must not reproduce any of this):\n${materialBlock(i.material)}`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function illustrationReviewMessages(i: ReviewIllustrationInput): PromptMessage[] {
  const system =
    `[task: concept-illustration-review]\n` +
    `You are a careful reviewer of a diagram for NSW HSC Year 11 revision notes. You are given the picture, its SVG source, the brief and the notes it accompanies. ` +
    `Answer each check true or false:\n` +
    `- matches_concept: the picture shows the concept in the brief.\n` +
    `- labels_correct: every label is present, spelt correctly and on the right thing.\n` +
    `- axes_correct: each axis is present, labelled with the right quantity, and points the right way.\n` +
    `- shapes_correct: every curve, line and region has the right shape or slope for the concept.\n` +
    `- no_answer_leak: it does not show a model answer, rubric point or correct option from the answer key.\n` +
    `Reply with JSON only: {"checks": {"matches_concept": true, "labels_correct": true, "axes_correct": true, "shapes_correct": true, "no_answer_leak": true}, "reason": "one or two sentences, required when any check is false"}`;
  const user =
    `${unitBlock(i.unit, i.concept)}\n\n` +
    `Brief: ${i.brief}\nAlt text: ${i.alt}\n\n` +
    `Notes it accompanies:\n${i.bullets.map((b) => `- ${b}`).join("\n")}\n\n` +
    `SVG source:\n${i.svg}\n\n` +
    `Questions on this concept and their CONFIDENTIAL answer key:\n${materialBlock(i.material)}\n\n` +
    `The rendered picture is attached.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/**
 * Turn a reviewer's reply into a verdict. The code decides `pass` (every required check true);
 * any `pass` the model volunteers is ignored. A reply that is not JSON or is missing a required
 * check is unusable (`ok: false`), which the caller treats as "reviewer unavailable".
 */
export function parseVerdict(
  content: string,
  required: readonly string[],
): { ok: true; verdict: ReviewVerdict } | { ok: false; reason: string } {
  const obj = firstJsonObject(content);
  if (!obj) return { ok: false, reason: "the reviewer's reply was not a JSON object" };
  const checks = obj.checks;
  if (!checks || typeof checks !== "object" || Array.isArray(checks)) {
    return { ok: false, reason: "the reviewer's reply had no checks" };
  }
  const result: Record<string, boolean> = {};
  for (const name of required) {
    const v = (checks as Record<string, unknown>)[name];
    if (typeof v !== "boolean") return { ok: false, reason: `the reviewer's reply is missing the check ${name}` };
    result[name] = v;
  }
  const failed = required.filter((n) => !result[n]);
  const given = typeof obj.reason === "string" ? obj.reason.trim() : "";
  const reason = (given || (failed.length > 0 ? `Failed checks: ${failed.join(", ")}.` : "")).slice(0, MAX_REASON_CHARS);
  return { ok: true, verdict: { pass: failed.length === 0, reason, checks: result } };
}

// ---- illustration generator ------------------------------------------------------------

export function illustrationMessages(i: GenerateIllustrationInput): PromptMessage[] {
  const system =
    `[task: concept-illustration]\n` +
    `You draw simple, accurate diagrams as SVG for NSW HSC Year 11 revision notes. Reply with ONE self-contained SVG and nothing else.\n` +
    `Rules:\n` +
    `- viewBox="0 0 640 400", with xmlns="http://www.w3.org/2000/svg".\n` +
    `- Use only these elements: svg, g, path, line, polyline, polygon, rect, circle, ellipse, text, tspan, defs, marker, title, desc.\n` +
    `- Use presentation attributes only (fill, stroke, stroke-width, font-size, text-anchor and similar). No style attribute, no href, no script, no images, no external references.\n` +
    `- Text must be at least 14px. Label both axes and every curve or line.\n` +
    `- Be accurate: the shapes, slopes and labels must be correct for the concept.`;
  const user =
    `${unitBlock(i.unit, i.concept)}\n\nNotes the diagram accompanies:\n${i.bullets.map((b) => `- ${b}`).join("\n")}\n\n` +
    `Brief: ${i.brief}\nAlt text (what the diagram shows): ${i.alt}`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

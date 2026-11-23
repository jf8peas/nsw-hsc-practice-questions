// Build-time content rules for the English essay-writing unit (spec 011, research R2). A plain module: no
// `server-only`, no I/O. scripts/validate-content.ts feeds it the unit and its answer set;
// tests/english-essay/content-rules.test.ts feeds it small fixtures. Every message starts with the unit or
// question id it is about. The deterministic quote check of every live model essay against the local play is added
// by scripts/validate-content.ts (T068), because it needs the gitignored play.

import { findDirective } from "@/content/units/y12-english-essay-writing/directives";
import type { AnswerSet, EnglishEssayQuestion, Unit } from "@/lib/types";
import { countWords } from "@/lib/wordcount";

export const ENGLISH_UNIT_ID = "y12-english-essay-writing";
export const MODEL_MIN = 900;
export const MODEL_MAX = 1100;
const LEAK_RUN = 60;

/** The six questions verbatim from the school trial papers: what the public content must keep saying (FR-033). */
export const EXPECTED_QUESTIONS: ReadonlyArray<{ n: number; source: string; directive: string; prompt: string }> = [
  {
    n: 1,
    source: "Knox 2025 Trial, Q6",
    directive: "to what extent",
    prompt:
      "Composers shape texts in memorable ways to illuminate the unique experiences of others. To what extent do you agree with this statement in relation to your prescribed text? In your response make close reference to your prescribed text.",
  },
  {
    n: 2,
    source: "Pymble 2024 Trial, Q6",
    directive: "to what extent",
    prompt:
      "'Texts illuminate the anomalies in human behaviour and motivation, encouraging the audience to see the world differently.' To what extent does this statement align with your understanding of your prescribed text?",
  },
  {
    n: 3,
    source: "Abbotsleigh 2025 Trial, Q6",
    directive: "discuss",
    prompt: "Discuss how the composer of your prescribed text makes connections between the audience and the complex lives of others within the play.",
  },
  {
    n: 4,
    source: "Fort Street 2023 Trial, Q6",
    directive: "how",
    prompt: "How does the representation of human experiences in your prescribed text invite you to reconsider your understanding of desire?",
  },
  {
    n: 5,
    source: "Girraween 2025 Trial, Q6",
    directive: "evaluate",
    prompt:
      "While experiences can be unique to individuals, emotions are universal; hence, making the representation of emotions more powerful. Evaluate this statement with detailed reference to your prescribed text.",
  },
  {
    n: 6,
    source: "Barker 2026 Trial, Q6",
    directive: "discuss",
    prompt:
      "Texts provide a critique of human nature, exposing audiences to the flaws and aspirations of our shared experience. Discuss this statement in relation to your prescribed text.",
  },
];

const squash = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/** True when `needle` shares a run of `run` characters with `haystack`. */
function sharesRun(needle: string, haystack: string, run: number): boolean {
  const n = squash(needle);
  const h = squash(haystack);
  for (let i = 0; i + run <= n.length; i++) {
    const w = n.slice(i, i + run);
    if (!w.startsWith(" ") && !w.endsWith(" ") && h.includes(w)) return true;
  }
  return false;
}

export function validateEnglishEssayRules(unit: Unit, answers: AnswerSet): string[] {
  const errors: string[] = [];
  const essays = unit.questions.filter((q): q is EnglishEssayQuestion => q.type === "englishEssay");
  if (essays.length === 0) return errors;

  const conceptIds = new Set((unit.concepts ?? []).map((c) => c.id));
  const skillIds = new Set([...conceptIds].filter((id) => id.startsWith(`${unit.id}.c-skill-`)));

  if (essays.length !== 6) errors.push(`${unit.id}: ${essays.length} essays; the unit has six (e1 to e6)`);
  const offers = essays.map((q) => q.offer).sort((a, b) => a - b);
  if (JSON.stringify(offers) !== JSON.stringify([1, 2, 3, 4, 5, 6].slice(0, essays.length))) {
    errors.push(`${unit.id}: essay offer positions must be 1 to ${essays.length}, each once (found ${offers.join(", ")})`);
  }

  // Public text the key must never repeat. The question itself is public by design and is not listed.
  const publicTexts = [
    unit.description,
    ...(unit.guide?.items.map((i) => i.text) ?? []),
    ...(unit.concepts ?? []).map((c) => c.description),
  ];

  for (const q of essays) {
    const suffix = q.id.startsWith(`${unit.id}.`) ? q.id.slice(unit.id.length + 1) : "";
    const m = /^e([1-6])$/.exec(suffix);
    if (!m) {
      errors.push(`${q.id}: id must be ${unit.id}.e1 to ${unit.id}.e6`);
    } else {
      const n = Number(m[1]);
      if (q.offer !== n) errors.push(`${q.id}: offer ${q.offer} must equal its id number ${n}`);
      const expected = EXPECTED_QUESTIONS.find((e) => e.n === n)!;
      if (q.prompt !== expected.prompt) errors.push(`${q.id}: prompt differs from the verbatim school-trial question`);
      if (q.source !== expected.source) errors.push(`${q.id}: source must be "${expected.source}"`);
      if (q.directive !== expected.directive) errors.push(`${q.id}: directive must be "${expected.directive}"`);
    }
    if (q.maxMarks !== 20) errors.push(`${q.id}: maxMarks must be 20`);
    if (!q.prompt.trim()) errors.push(`${q.id}: prompt is empty`);
    if (!q.source?.trim()) errors.push(`${q.id}: a school-trial question must show its source`);
    if (!findDirective(q.prompt, q.directive)) errors.push(`${q.id}: directive "${q.directive}" does not occur in the prompt`);
    for (const c of q.conceptIds) {
      if (!skillIds.has(c)) errors.push(`${q.id}: public conceptIds may only be skill-* concepts of ${unit.id} (found ${c})`);
    }

    if (!q.live) continue;

    // a live essay is complete
    const key = answers[q.id]?.englishEssay;
    if (!key) {
      errors.push(`${q.id}: is live but has no English essay key in answers.ts`);
      continue;
    }
    if (!key.markingNotes.trim()) errors.push(`${q.id}: marking notes are empty`);
    const words = countWords(key.modelEssay);
    if (words < MODEL_MIN || words > MODEL_MAX) {
      errors.push(`${q.id}: the model essay is ${words} words; it must be ${MODEL_MIN} to ${MODEL_MAX}`);
    }
    if (key.conceptTags.length === 0) errors.push(`${q.id}: has no concept tags`);
    for (const c of key.conceptTags) if (!conceptIds.has(c)) errors.push(`${q.id}: concept tag ${c} is not a concept of ${unit.id}`);

    for (const [label, text] of [["marking notes", key.markingNotes], ["model essay", key.modelEssay]] as const) {
      if (text && publicTexts.some((p) => sharesRun(text, p, LEAK_RUN))) {
        errors.push(`${q.id}: the ${label} share a run of ${LEAK_RUN} characters with public text`);
      }
    }
  }

  // live models must not be copies of each other
  const liveKeys = essays.filter((q) => q.live).map((q) => [q.id, answers[q.id]?.englishEssay?.modelEssay] as const);
  for (let i = 0; i < liveKeys.length; i++) {
    for (let j = i + 1; j < liveKeys.length; j++) {
      const a = liveKeys[i]![1];
      const b = liveKeys[j]![1];
      if (a && b && sharesRun(a, b, 200)) errors.push(`${liveKeys[i]![0]} and ${liveKeys[j]![0]}: model essays share a run of 200 characters`);
    }
  }
  return errors;
}

import { countWords } from "@/lib/wordcount";

// The essay scaffold (spec 010 FR-006 to FR-011, research R4): the student's plan, 20 short text
// fields in five sections. A plain module (no I/O, no secrets) used by the browser for the buttons
// and by the server, which never trusts the browser, for save, start and review.

export interface BodyPara {
  point: string;
  theory: string;
  data: string;
  evaluation: string;
  link: string;
}

export interface EssayScaffold {
  intro: { judgement: string; terms: string; economies: string };
  body: [BodyPara, BodyPara, BodyPara];
  conclusion: { judgement: string; weighs: string };
}

export const SCAFFOLD_CAP = 250;
export const SCAFFOLD_FIELD_MAX_CHARS = 1500;

export type ScaffoldReason = "over_cap" | "no_judgement" | "no_body_point";

const emptyPara = (): BodyPara => ({ point: "", theory: "", data: "", evaluation: "", link: "" });

export function emptyScaffold(): EssayScaffold {
  return {
    intro: { judgement: "", terms: "", economies: "" },
    body: [emptyPara(), emptyPara(), emptyPara()],
    conclusion: { judgement: "", weighs: "" },
  };
}

/** One input of the form: where it lives, its label and a prompt shown as the placeholder. */
export interface ScaffoldField {
  section: "intro" | "body1" | "body2" | "body3" | "conclusion";
  key: string;
  label: string;
  placeholder: string;
}

const BODY_FIELDS: Array<Pick<ScaffoldField, "key" | "label" | "placeholder">> = [
  { key: "point", label: "Point (topic sentence)", placeholder: "The one idea this paragraph argues" },
  { key: "theory", label: "Theory or model", placeholder: "e.g. AD/AS, Lorenz curve, PPF, Harrod-Domar" },
  { key: "data", label: "Data and indicators (with year)", placeholder: "e.g. GDP growth, HDI, Gini, with the year" },
  { key: "evaluation", label: "Evaluation (limitation or counterpoint)", placeholder: "What weakens or complicates the point?" },
  { key: "link", label: "Link back to the judgement", placeholder: "How this supports your answer to the question" },
];

export const SCAFFOLD_FIELDS: ScaffoldField[] = [
  { section: "intro", key: "judgement", label: "Judgement (one sentence answering the question)", placeholder: "Your answer to the question, in one sentence" },
  { section: "intro", key: "terms", label: "Key terms to define", placeholder: "e.g. globalisation, economic development" },
  { section: "intro", key: "economies", label: "Economy or economies and their status", placeholder: "e.g. China, emerging" },
  ...(["body1", "body2", "body3"] as const).flatMap((section) => BODY_FIELDS.map((f) => ({ section, ...f }))),
  { section: "conclusion", key: "judgement", label: "Restated judgement", placeholder: "Your judgement again, in different words" },
  { section: "conclusion", key: "weighs", label: "The reason that weighs most", placeholder: "Why this reason outweighs the others" },
];

export const SCAFFOLD_SECTION_TITLES: Record<ScaffoldField["section"], string> = {
  intro: "Introduction",
  body1: "Body paragraph 1",
  body2: "Body paragraph 2",
  body3: "Body paragraph 3",
  conclusion: "Conclusion",
};

/** Read one field's text. */
export function getField(s: EssayScaffold, f: Pick<ScaffoldField, "section" | "key">): string {
  if (f.section === "intro") return s.intro[f.key as keyof EssayScaffold["intro"]];
  if (f.section === "conclusion") return s.conclusion[f.key as keyof EssayScaffold["conclusion"]];
  const idx = f.section === "body1" ? 0 : f.section === "body2" ? 1 : 2;
  return s.body[idx][f.key as keyof BodyPara];
}

/** A copy of the scaffold with one field changed. */
export function setField(s: EssayScaffold, f: Pick<ScaffoldField, "section" | "key">, value: string): EssayScaffold {
  const next = structuredClone(s);
  if (f.section === "intro") next.intro[f.key as keyof EssayScaffold["intro"]] = value;
  else if (f.section === "conclusion") next.conclusion[f.key as keyof EssayScaffold["conclusion"]] = value;
  else {
    const idx = f.section === "body1" ? 0 : f.section === "body2" ? 1 : 2;
    next.body[idx][f.key as keyof BodyPara] = value;
  }
  return next;
}

/** The total words across the 20 fields, each counted with the app's one word rule. */
export function scaffoldWords(s: EssayScaffold): number {
  return SCAFFOLD_FIELDS.reduce((n, f) => n + countWords(getField(s, f)), 0);
}

/** How many of a section's fields have text (for the section summary). */
export function filledCount(s: EssayScaffold, section: ScaffoldField["section"]): { filled: number; total: number } {
  const fields = SCAFFOLD_FIELDS.filter((f) => f.section === section);
  return { filled: fields.filter((f) => getField(s, f).trim() !== "").length, total: fields.length };
}

/**
 * Whether a scaffold may be saved or moved on with. "save" refuses only an over-long plan, so a
 * half-written plan autosaves; "start" (and a review) also needs the judgement and at least one
 * body point (FR-008, FR-009).
 */
export function validateScaffold(
  s: EssayScaffold,
  mode: "save" | "start",
): { ok: boolean; reasons: ScaffoldReason[]; words: number } {
  const words = scaffoldWords(s);
  const reasons: ScaffoldReason[] = [];
  if (words > SCAFFOLD_CAP) reasons.push("over_cap");
  if (mode === "start") {
    if (s.intro.judgement.trim() === "") reasons.push("no_judgement");
    if (s.body.every((b) => b.point.trim() === "")) reasons.push("no_body_point");
  }
  return { ok: reasons.length === 0, reasons, words };
}

/**
 * Turns untrusted input into a scaffold: unknown keys are dropped, a missing field is "", and a
 * non-string anywhere makes the whole input invalid (null). Fields are cut to the character cap.
 */
export function sanitiseScaffold(input: unknown): EssayScaffold | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const out = emptyScaffold();
  let valid = true;
  const read = (v: unknown): string => {
    if (v === undefined) return "";
    if (typeof v !== "string") {
      valid = false;
      return "";
    }
    return v.slice(0, SCAFFOLD_FIELD_MAX_CHARS);
  };
  const intro = (raw.intro ?? {}) as Record<string, unknown>;
  const conclusion = (raw.conclusion ?? {}) as Record<string, unknown>;
  const body = Array.isArray(raw.body) ? raw.body : [];
  if (typeof intro !== "object" || typeof conclusion !== "object") return null;
  out.intro = { judgement: read(intro.judgement), terms: read(intro.terms), economies: read(intro.economies) };
  out.conclusion = { judgement: read(conclusion.judgement), weighs: read(conclusion.weighs) };
  for (let i = 0; i < 3; i++) {
    const b = (body[i] ?? {}) as Record<string, unknown>;
    if (typeof b !== "object") return null;
    out.body[i] = { point: read(b.point), theory: read(b.theory), data: read(b.data), evaluation: read(b.evaluation), link: read(b.link) };
  }
  return valid ? out : null;
}

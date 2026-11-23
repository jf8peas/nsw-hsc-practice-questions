import { countWords } from "@/lib/wordcount";

import type { EnglishEssayScaffold } from "./types";

// The English essay scaffold (spec 011, data-model §2, research R6): a thesis and three optional claim/evidence
// pairs, seven strings, capped at 150 words. A plain module (no I/O, no secrets) used by the browser for the buttons
// and by the server, which never trusts the browser, for save, start and review.

export type { EnglishEssayScaffold } from "./types";

export const ENGLISH_SCAFFOLD_CAP = 150;
export const ENGLISH_SCAFFOLD_FIELD_MAX_CHARS = 1500;

export type EnglishScaffoldReason = "over_cap" | "no_thesis";

export const emptyEnglishEssayScaffold = (): EnglishEssayScaffold => ({
  thesis: "",
  body: [
    { claim: "", evidence: "" },
    { claim: "", evidence: "" },
    { claim: "", evidence: "" },
  ],
});

/** All seven fields in reading order. */
const fieldsOf = (s: EnglishEssayScaffold): string[] => [s.thesis, ...s.body.flatMap((b) => [b.claim, b.evidence])];

/** Total words across the seven fields, each counted with the app's one word rule. */
export function scaffoldWords(s: EnglishEssayScaffold): number {
  return fieldsOf(s).reduce((n, f) => n + countWords(f), 0);
}

/**
 * Whether a scaffold may be saved or moved on with. "save" refuses only an over-long plan, so a half-written plan
 * (even an empty thesis) autosaves; "start" and "review" also need a non-blank thesis. Claims and evidence are
 * never compulsory.
 */
export function validateEnglishScaffold(
  s: EnglishEssayScaffold,
  mode: "save" | "start" | "review",
): { ok: boolean; reasons: EnglishScaffoldReason[]; words: number } {
  const words = scaffoldWords(s);
  const reasons: EnglishScaffoldReason[] = [];
  if (words > ENGLISH_SCAFFOLD_CAP) reasons.push("over_cap");
  if (mode !== "save" && s.thesis.trim() === "") reasons.push("no_thesis");
  return { ok: reasons.length === 0, reasons, words };
}

/**
 * Turns untrusted input into a scaffold: unknown keys are dropped, a missing field is "", and a non-string anywhere
 * makes the whole input invalid (null). Fields are cut to the defensive character cap.
 */
export function sanitiseEnglishEssayScaffold(input: unknown): EnglishEssayScaffold | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  let valid = true;
  const read = (v: unknown): string => {
    if (v === undefined) return "";
    if (typeof v !== "string") {
      valid = false;
      return "";
    }
    return v.slice(0, ENGLISH_SCAFFOLD_FIELD_MAX_CHARS);
  };
  const out = emptyEnglishEssayScaffold();
  out.thesis = read(raw.thesis);
  if (raw.body !== undefined && !Array.isArray(raw.body)) return null;
  const body = (raw.body ?? []) as unknown[];
  for (let i = 0; i < 3; i++) {
    const b = body[i];
    if (b === undefined) continue;
    if (!b || typeof b !== "object" || Array.isArray(b)) return null;
    const rb = b as Record<string, unknown>;
    out.body[i] = { claim: read(rb.claim), evidence: read(rb.evidence) };
  }
  return valid ? out : null;
}

/** The counter wording: "NN / 150 words", or "NN / 150 words, cut N word(s)" when over. */
export function scaffoldCounter(n: number, cap = ENGLISH_SCAFFOLD_CAP): { over: boolean; text: string } {
  if (n > cap) {
    const cut = n - cap;
    return { over: true, text: `${n} / ${cap} words, cut ${cut} ${cut === 1 ? "word" : "words"}` };
  }
  return { over: false, text: `${n} / ${cap} words` };
}

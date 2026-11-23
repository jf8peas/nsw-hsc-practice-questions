import { verbDefinition } from "@/content/glossary";
import type { EnglishDirective } from "@/lib/types";

// PUBLIC — the directive words of the English essay questions and what each means (spec 011, data-model §1.3).
// `evaluate` and `discuss` are NESA glossary verbs and resolve through content/glossary.ts. "to what extent" and "how"
// are not glossary terms, so this unit gives its own explanation and labels it as unit guidance, not a NESA definition.

export const UNIT_GUIDANCE_LABEL = "Unit guidance (not a NESA glossary definition)";

const UNIT_DIRECTIVES: Record<"to what extent" | "how", string> = {
  "to what extent": "Make a judgement about how far the statement holds: agree, qualify or challenge it, and sustain that judgement with evidence.",
  how: "Explain and analyse the ways the text achieves the effect named, showing how its form and language make meaning.",
};

export interface DirectiveInfo {
  directive: EnglishDirective;
  definition: string;
  /** "nesa": a glossary definition; "unit": this unit's own guidance. */
  guidance: "nesa" | "unit";
}

export function directiveInfo(directive: EnglishDirective): DirectiveInfo {
  if (directive === "to what extent" || directive === "how") {
    return { directive, definition: UNIT_DIRECTIVES[directive], guidance: "unit" };
  }
  const definition = verbDefinition(directive);
  if (!definition) throw new Error(`No NESA glossary definition for directive "${directive}"`);
  return { directive, definition, guidance: "nesa" };
}

export interface DirectiveRange {
  start: number;
  end: number;
}

const isLetter = (ch: string | undefined): boolean => ch !== undefined && /\p{L}/u.test(ch);

/**
 * Where `directive` occurs in `prompt`, as offsets into the ORIGINAL string, or null when it does not. The match is
 * the whole phrase, case-insensitive, with any run of whitespace between its words, and it must not sit inside a
 * longer word (so "how" is not found in "show" or "however"). The first such occurrence is returned.
 */
export function findDirective(prompt: string, directive: string): DirectiveRange | null {
  const words = directive.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(escaped.join("\\s+"), "giu");
  for (const m of prompt.matchAll(re)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (!isLetter(prompt[start - 1]) && !isLetter(prompt[end])) return { start, end };
  }
  return null;
}

/** The three pieces of a prompt around its directive, for highlighting. Null when the directive is absent. */
export function splitAtDirective(prompt: string, directive: string): { before: string; match: string; after: string } | null {
  const r = findDirective(prompt, directive);
  if (!r) return null;
  return { before: prompt.slice(0, r.start), match: prompt.slice(r.start, r.end), after: prompt.slice(r.end) };
}

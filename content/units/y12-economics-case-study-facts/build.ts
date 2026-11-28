import type { McQuestion, ShortQuestion } from "@/lib/types";
import { shuffleBySeed } from "@/lib/shuffle";

// Shared builders for this unit's question file. Ids are m01–m16 and s01–s25 and are never renumbered; new
// questions are appended. Every question carries the same source line (spec 012 FR-014).

export const U = "y12-economics-case-study-facts";

export const SOURCE = "Original question — case study facts (checked Nov 2026)";

const pad = (n: number) => String(n).padStart(2, "0");

export function mc(n: number, group: "mc-china" | "mc-nepal", prompt: string, options: string[]): McQuestion {
  const id = `${U}.m${pad(n)}`;
  return { id, group, type: "mc", source: SOURCE, prompt, maxMarks: 1, options: shuffleBySeed(id, options) };
}

export function sa(n: number, group: "sa-china" | "sa-nepal" | "sa-both", marks: 2 | 3, prompt: string): ShortQuestion {
  return { id: `${U}.s${pad(n)}`, group, type: "short", source: SOURCE, prompt, maxMarks: marks };
}

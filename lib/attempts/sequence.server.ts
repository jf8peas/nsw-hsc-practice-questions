import "server-only";

import { PARTS, partKeyOf } from "@/lib/paragraph/parts";
import type { ParagraphQuestion, PartNo, Unit } from "@/lib/types";

// The draw for a sequential unit (spec 007, research R1): not random, not weighted. The next
// question is the first one, in bank order, that the student has no result for. Pure: the
// caller reads the results.

function paragraphQuestions(unit: Unit): ParagraphQuestion[] {
  return unit.questions.filter((q): q is ParagraphQuestion => q.type === "paragraph");
}

/** The next question to offer, or null when every question has a result. */
export function nextQuestion(unit: Unit, answered: ReadonlySet<string>): ParagraphQuestion | null {
  return paragraphQuestions(unit).find((q) => !answered.has(q.id)) ?? null;
}

export interface EssayDot {
  part: PartNo;
  short: string;
  state: "done" | "next" | "later";
  mark: number | null;
}

export type EssayProgress =
  | {
      finished: false;
      essayNo: number;
      essayTotal: number;
      essayId: string;
      question: string;
      verb: string;
      economy: string;
      parts: EssayDot[];
      nextPart: PartNo;
    }
  | { finished: true; essayTotal: number };

/** Where the student is: the essay in progress, its five dots and the next part. */
export function essayProgress(unit: Unit, marks: ReadonlyMap<string, number>): EssayProgress {
  const all = paragraphQuestions(unit);
  const essayTotal = Math.floor(all.length / 5);
  const next = nextQuestion(unit, new Set(marks.keys()));
  if (!next) return { finished: true, essayTotal };

  const inEssay = all.filter((q) => q.essayId === next.essayId).sort((a, b) => a.part - b.part);
  const parts: EssayDot[] = inEssay.map((q) => {
    const mark = marks.get(q.id);
    return {
      part: q.part,
      short: PARTS[partKeyOf(q.part)].short,
      state: mark !== undefined ? "done" : q.id === next.id ? "next" : "later",
      mark: mark ?? null,
    };
  });
  return {
    finished: false,
    essayNo: next.essayNo,
    essayTotal,
    essayId: next.essayId,
    question: next.prompt,
    verb: next.verb,
    economy: next.economy,
    parts,
    nextPart: next.part,
  };
}

import { PARAGRAPH_UNIT_ID, PART_ORDER, conceptIdsForPart } from "@/lib/paragraph/parts";
import type { ParagraphQuestion, PartNo, Question } from "@/lib/types";

// PUBLIC — no answer keys here. The brief, the model parts, the guidance and the marking notes
// are the server-only key in ./essays.ts (constitution Principle I). Five questions per essay,
// one per part, in framework order. Ids are `<unit>.e<NN>p<K>`; bank order is the order the
// student meets them. Never renumber; append new essays at the end.

interface EssayHeader {
  essayId: string;
  verb: string;
  economy: string;
  /** The essay question, in full. General: no economy named (FR-038). */
  question: string;
}

// The verb is lower case and a key of content/glossary.ts. Order = the order students meet essays.
export const ESSAYS: EssayHeader[] = [
  {
    essayId: "e03",
    verb: "evaluate",
    economy: "China",
    question:
      "Evaluate the effectiveness of the strategies used by an emerging economy you have studied to promote economic growth and development.",
  },
  {
    essayId: "e04",
    verb: "assess",
    economy: "China",
    question:
      "Assess the effectiveness of infrastructure investment as a strategy to promote economic growth and development in an emerging economy you have studied.",
  },
  {
    essayId: "e05",
    verb: "assess",
    economy: "Nepal",
    question:
      "Assess the impact of globalisation on economic growth and development in a developing economy you have studied.",
  },
  {
    essayId: "e06",
    verb: "evaluate",
    economy: "Nepal",
    question:
      "Evaluate the effectiveness of a strategy used by a developing economy you have studied to promote economic growth and development.",
  },
  {
    essayId: "e07",
    verb: "analyse",
    economy: "China and Nepal",
    question:
      "Analyse the impact of trade liberalisation on economic growth and development in one emerging and one developing economy you have studied.",
  },
  {
    essayId: "e08",
    verb: "discuss",
    economy: "China and Nepal",
    question:
      "Discuss the impact of globalisation on economic development in one emerging and one developing economy you have studied.",
  },
];

function essayQuestions(h: EssayHeader, essayNo: number): ParagraphQuestion[] {
  return PART_ORDER.map((part, i) => ({
    id: `${PARAGRAPH_UNIT_ID}.${h.essayId}p${i + 1}`,
    type: "paragraph" as const,
    group: "paragraph" as const,
    essayId: h.essayId,
    essayNo,
    part: (i + 1) as PartNo,
    verb: h.verb,
    economy: h.economy,
    prompt: h.question,
    maxMarks: 4 as const,
    concepts: conceptIdsForPart(part),
  }));
}

export const questions: Question[] = ESSAYS.flatMap((h, i) => essayQuestions(h, i + 1));

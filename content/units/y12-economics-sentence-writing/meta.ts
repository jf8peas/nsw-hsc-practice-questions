import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-economics-sentence-writing",
  year: "Year 12",
  topic: "Topic 1: The Global Economy",
  type: "Writing Practice",
  title: "Economics Sentence Writing",
  description:
    "HSC Economics Topic 1 (2009 syllabus, examined in the 2027 HSC). You see a plain-English sentence about the global economy and rewrite it as one concise sentence in proper economics language, using the right terms. Each question is marked out of 3: keeping the meaning and the cause and effect (1 mark), using every target term correctly (1 mark), and writing concisely within 25 words (1 mark). Scores under 3 get a hinted retry capped at 2 marks, then the model sentence and feedback.",
  created: "2026-11-02",
  order: 4,
  conceptsReady: true,
  quiz: {
    short: 0,
    mc: 0,
    passMark: 60,
    groups: [{ group: "rewrite", n: 5 }],
  },
  guide: {
    title: "How sentence writing works",
    items: [
      {
        label: "Phase 1 — rewrite",
        text: "Rewrite the plain-English sentence as ONE concise economics sentence, using every target term correctly. Keep the meaning and the cause and effect. Keep it to 25 words or fewer.",
      },
      {
        label: "The 3-mark criteria",
        text: "(a) The meaning and the cause and effect of the original are kept and correct. (b) Every target term is used, and used correctly — all or nothing. (c) The sentence is concise: within the word limit, with no padding.",
      },
      {
        label: "Phase 2 — hinted retry",
        text: "If phase 1 scores under 3, you see only the terms you missed or misused, each with a definition, and you rewrite once more. Phase 2 is capped at 2 marks, so an unaided answer is always worth more.",
      },
      {
        label: "The discussion",
        text: "After the last phase you see the model sentence, every target term with its definition and why it fits, your own sentences and the feedback.",
      },
    ],
  },
};

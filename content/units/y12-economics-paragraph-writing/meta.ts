import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-economics-paragraph-writing",
  year: "Year 12",
  topic: "Topic 1: The Global Economy",
  type: "Writing Practice",
  title: "Writing economics paragraphs",
  description:
    "Build a Band 6 body paragraph one part at a time: Topic Sentence, Theoretical Mechanism, Evidence & Application, Evaluation & Limitation, Linking Judgement. Each quiz is one part, and the next quiz carries on the same essay.",
  created: "2026-11-05",
  order: 5,
  conceptsReady: true,
  // A quiz is one part of one essay, chosen in order from the student's results (spec 007).
  sequence: { kind: "essay-parts", parts: 5 },
  quiz: {
    short: 0,
    mc: 0,
    passMark: 60,
    groups: [{ group: "paragraph", n: 1 }],
  },
  guide: {
    title: "How paragraph writing works",
    items: [
      {
        label: "One part per quiz",
        text: "Each essay is one body paragraph in five parts. A quiz is one part, and your next quiz carries on the same essay with the next part. After the Linking Judgement, the next quiz starts a new essay.",
      },
      {
        label: "Write from the brief",
        text: "The brief gives you the content in plain English, with every fact and figure you need. You do the writing. The model text of the earlier parts is shown above your box so you write into a real paragraph.",
      },
      {
        label: "Four criteria, 4 marks",
        text: "Each part is marked out of 4 on three criteria for that part plus one for conventions (precise economic language, within the word limit). The criteria are listed above the brief before you write.",
      },
      {
        label: "One correction",
        text: "If you lose marks you get the tips for the criteria you lost and one correction, worth up to 3. Your recorded mark is the higher of your two tries.",
      },
      {
        label: "Things I need to know",
        text: "A writing tip you miss on a first try goes into your list. A part tip clears after 2 correct first tries at that part; an all-parts tip after 3.",
      },
    ],
  },
};

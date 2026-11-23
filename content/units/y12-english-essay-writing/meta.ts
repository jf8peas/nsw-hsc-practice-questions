import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-english-essay-writing",
  year: "Year 12",
  topic: "Texts and Human Experiences",
  type: "Writing Practice",
  title: "Away Essays",
  description:
    "Rehearse a whole Section II essay on Michael Gow's Away: plan it, write 800 to 1,200 words and get it marked out of 20 against the school's bands, with your quotations checked against the play.",
  created: "2026-11-23",
  order: 3,
  conceptsReady: true,
  // A quiz is one whole essay the student picks (spec 011).
  flow: "englishEssay",
  conceptsClearOnOtherQuestions: true,
  quiz: {
    short: 0,
    mc: 0,
    passMark: 60,
    groups: [{ group: "englishEssay", n: 1 }],
  },
  guide: {
    title: "How essay writing works",
    items: [
      {
        label: "Plan, then write",
        text: "Make a light plan: a thesis and up to three claims with evidence notes (150 words at most). Then write 800 to 1,200 words. Once you start writing, the plan is locked, as it would be on paper.",
      },
      {
        label: "No pasting",
        text: "Pasting is switched off in the essay box, as in the exam. Type your answer.",
      },
      {
        label: "One try",
        text: "Each essay is marked once, out of 20. Your quotations from Away are checked against the play. You can redo a finished essay as a new attempt, and your latest mark counts.",
      },
      {
        label: "Things I need to know",
        text: "Up to five gaps from each marked essay go into your list. A gap clears after 2 later essays use the idea correctly; redoing the same essay does not clear it.",
      },
    ],
  },
};

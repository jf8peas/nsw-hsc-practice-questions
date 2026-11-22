import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-economics-essay-writing",
  year: "Year 12",
  topic: "Topic 1: The Global Economy",
  type: "Writing Practice",
  title: "Global Economy Essays",
  description:
    "Rehearse the whole extended response: plan it on a one-page scaffold, write 600 to 800 words, and get it marked out of 20 against the school's AT1 bands.",
  created: "2026-11-22",
  order: 6,
  conceptsReady: true,
  // A quiz is one whole essay the student picks (spec 010).
  flow: "essay",
  conceptsClearOnOtherQuestions: true,
  quiz: {
    short: 0,
    mc: 0,
    passMark: 60,
    groups: [{ group: "essay", n: 1 }],
  },
  guide: {
    title: "How essay writing works",
    items: [
      {
        label: "Plan, then write",
        text: "Fill in the plan (250 words at most, about one handwritten side), then write 600 to 800 words. Once you start writing, the plan is locked, as it would be on paper.",
      },
      {
        label: "No pasting",
        text: "Pasting is switched off in the essay box, as in the exam. Type your answer.",
      },
      {
        label: "One try",
        text: "Each essay is marked once, out of 20, in the five AT1 bands. You can redo a finished essay as a new attempt, and your latest mark counts.",
      },
      {
        label: "Things I need to know",
        text: "Up to five gaps from each marked essay go into your list. A gap clears after 2 later essays use the idea correctly; redoing the same essay does not clear it.",
      },
    ],
  },
};

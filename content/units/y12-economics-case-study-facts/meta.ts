import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-economics-case-study-facts",
  year: "Year 12",
  topic: "Topic 1: The Global Economy",
  type: "Topic Quiz",
  title: "Case Study Facts: China and Nepal",
  description:
    "HSC Economics Topic 1: The Global Economy case study (2009 syllabus, examined in the 2027 HSC). Drills the China and Nepal facts and data to memorise: each figure or date with its year, and what it shows for growth, development, inequality or the environment. Each attempt draws 2 multiple-choice and 3 short-answer questions covering both economies, and 8 attempts go by without a repeated question. All questions are original and built from facts checked in November 2026; revise the figures before the 2027 HSC.",
  created: "2026-11-30",
  order: 7,
  explanationsComplete: true,
  quiz: {
    short: 3,
    mc: 2,
    passMark: 55,
    drawUnseenFirst: true,
    groups: [
      { group: "mc-china", n: 1 },
      { group: "mc-nepal", n: 1 },
      { group: "sa-china", n: 1 },
      { group: "sa-nepal", n: 1 },
      { group: "sa-both", n: 1 },
    ],
  },
  guide: {
    title: "Three rules",
    items: [
      { label: "Always give the year", text: "A figure without its year or period is only half a fact." },
      { label: "Say what it shows", text: "Link the figure to growth, development, inequality or the environment. Repeating it is not enough." },
      { label: "Never invent a number", text: "If you are not sure of the exact figure, round it. Do not make one up." },
    ],
  },
};

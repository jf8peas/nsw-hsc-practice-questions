import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-english-advanced-unseen-texts",
  year: "Year 12",
  topic: "Texts and Human Experiences",
  type: "Writing Practice",
  title: "Unseen texts: short answers",
  description:
    "Practise Section I of English Advanced Paper 1: one unseen text and one short-answer question at a time, with no timer. You get a mark, what earned it and the biggest gap, one retry, and a model answer. The skills you miss go into Things I need to know.",
  created: "2026-11-19",
  order: 1,
  conceptsReady: true,
  // A quiz is one unanswered question, weighted toward your weakest text forms and uncleared skills (spec 008).
  draw: { kind: "unseen-weighted" },
  // the seven skills are one count across this unit and the comparative unit (spec 009 FR-022)
  sharesProgressWith: ["y12-english-advanced-comparative-texts"],
  guide: {
    title: "How unseen-text practice works",
    items: [
      {
        label: "One text, one question",
        text: "Each quiz shows one text from a school trial paper with its question below. There is no timer and no reading-time lock: read and write at your own pace.",
      },
      {
        label: "Write to the length",
        text: "The meter shows the suggested length, taken from the lines the paper gave. You need at least 20 words. Going a little over only warns you, but more than 20% over must be cut before you can submit.",
      },
      {
        label: "Marked on seven skills",
        text: "Your answer is marked against the school's band descriptors. You see your mark, what earned it, the biggest gap, and whether you met each of seven skills.",
      },
      {
        label: "One retry",
        text: "Below full marks you can try once more, starting from your first answer with a tip for each skill you missed, or skip the retry. A retry earns at most one mark below full marks, and your recorded mark is the higher of your two tries.",
      },
      {
        label: "Things I need to know",
        text: "A skill you miss on a first try goes into your list, even if you fix it in the retry. It clears after 2 first tries that show it.",
      },
    ],
  },
};

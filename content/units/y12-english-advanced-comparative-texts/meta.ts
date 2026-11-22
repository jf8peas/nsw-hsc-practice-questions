import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-english-advanced-comparative-texts",
  year: "Year 12",
  topic: "Texts and Human Experiences",
  type: "Writing Practice",
  title: "Comparative texts: short answers",
  description:
    "Practise the Section I short answer on two texts in English Advanced Paper 1: one question at a time, with each text in its own tab, and no timer. You get a mark, what earned it and the biggest gap, one retry, and a model answer. The skills you miss, including comparing, go into Things I need to know.",
  created: "2026-11-20",
  order: 2,
  conceptsReady: true,
  // A quiz is one unanswered question, weighted toward uncleared skills (spec 009: no text-form weighting).
  draw: { kind: "comparative-weighted" },
  // the seven shared skills are one count across this unit and the unseen-text unit (spec 009 FR-022)
  sharesProgressWith: ["y12-english-advanced-unseen-texts"],
  guide: {
    title: "How comparative-text practice works",
    items: [
      {
        label: "Two texts, one question",
        text: "Each quiz shows one question that refers to two texts from a school trial paper. Each text is in its own tab, and you can open each one in its own browser tab to keep it beside your answer. There is no timer.",
      },
      {
        label: "Choose if the question lets you",
        text: "Some questions say 'Text 5 and ONE other text' or 'any TWO of Texts 1 to 4'. Pick the texts you want to write about before you submit. The pick is saved as you go and is fixed once you submit.",
      },
      {
        label: "Write to the length",
        text: "The meter shows the suggested length, taken from the lines the paper gave. You need at least 20 words. Going a little over only warns you, but more than 20% over must be cut before you can submit.",
      },
      {
        label: "Marked on nine skills",
        text: "Your answer is marked against the school's band descriptors. You see your mark, what earned it, the biggest gap, and whether you met each of nine skills, including comparing the texts and treating both in depth.",
      },
      {
        label: "One retry",
        text: "Below full marks you can try once more, starting from your first answer with a tip for each skill you missed, or skip the retry. A retry earns at most one mark below full marks, and your recorded mark is the higher of your two tries.",
      },
      {
        label: "Things I need to know",
        text: "A skill you miss on a first try goes into your list, even if you fix it in the retry. It clears after 2 first tries that show it. Seven of the skills are shared with the unseen-text unit, so a skill cleared in one is cleared in both.",
      },
    ],
  },
};

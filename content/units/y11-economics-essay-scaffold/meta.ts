import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y11-economics-essay-scaffold",
  year: "Year 11",
  topic: "Exam preparation",
  type: "Essay Practice",
  title: "Economics Preliminary Essay Scaffold",
  description:
    "Practice planning 20-mark Preliminary Economics essays on Government and the Economy and Financial Markets. Each attempt gives you 3 HSC-style essay questions — many with real-world stimulus on inflation, the RBA cash rate, cost-of-living policy, housing affordability and the federal Budget. For each question you write a scaffold: a short plan of the introduction, three body paragraphs and the conclusion. The plans are marked by an examiner LLM on economic reasoning and structure (the STEEL method), not on matching a model answer word for word.",
  order: 4,
  quiz: {
    short: 3,
    mc: 0,
    passMark: 60,
    groups: [{ group: "essay", n: 3 }],
  },
  guide: {
    title: "Core essay structure breakdown",
    items: [
      {
        label: "Introduction",
        text: "Briefly define the key economic terms, state your overall thesis (your position on the question), and preview the three main body points.",
      },
      {
        label: "Point 1 — Core economic concept / context",
        text: "Define the fundamental economic mechanism, trend or foundational policy that the question rests on. Set the scene.",
      },
      {
        label: "Point 2 — Primary impact / economic mechanism",
        text: "Analyse the main cause-and-effect relationship. Bring in economic theory or a diagram, and real-world data or market trends where you can.",
      },
      {
        label: "Point 3 — Broader implications / trade-offs or limitations",
        text: "Evaluate the secondary effects: conflicting economic objectives, policy limitations, or short-term versus long-term trade-offs.",
      },
      {
        label: "Conclusion",
        text: "Synthesise the main findings and restate how your thesis has been demonstrated. Do not introduce any new information.",
      },
    ],
  },
};

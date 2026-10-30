import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-physics-circular-motion-practical",
  year: "Year 12",
  topic: "Module 5: Advanced Mechanics",
  type: "Topic Quiz",
  title: "Circular Motion Practical",
  description:
    "Get ready for the whirling-bung practical (Module 5, circular motion): the aim and variables, what each part of the apparatus does, why the string tension equals Mg and provides the centripetal force, why v² against r is a straight line with gradient Mg/m, processing the data, measuring the radius, recording results and uncertainties, and the errors and gotchas to watch for on the day. Original short-answer questions written for this practical. Each attempt draws 5 short-answer questions (2–4 marks each), so there are 6 non-repeating attempts.",
  created: "2026-10-30",
  order: 2,
  conceptsReady: true,
  explanationsComplete: true, // no multiple-choice questions, so nothing to explain
  quiz: {
    short: 5,
    mc: 0,
    passMark: 55,
    groups: [{ group: "sa", n: 5 }],
  },
  guide: {
    title: "Key relationships",
    items: [
      { label: "Period from the time for 20 revolutions", text: "T = t ÷ 20" },
      { label: "Speed of the stopper", text: "v = 2πr ÷ T" },
      { label: "Centripetal force, provided by the string tension", text: "F_c = mv²/r = Mg" },
      { label: "The straight-line graph", text: "v² = (Mg/m) r — gradient Mg/m, through the origin" },
      { label: "Acceleration due to gravity", text: "g = 9.8 m s⁻²" },
    ],
  },
};

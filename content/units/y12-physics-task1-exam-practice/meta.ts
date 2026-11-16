import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-physics-task1-exam-practice",
  year: "Year 12",
  topic: "Module 5: Advanced Mechanics",
  type: "Topic Quiz",
  title: "Projectiles, Circular Motion and Practical Analysis",
  description:
    "Practice for the Year 12 Physics Assessment Task 1 exam. Part A–style questions analyse results from the whirling-stopper practical: processing times into T, v and v², the gradient of v² against r and what it gives (m, F or g), percentage error, anomalies, reliability, validity, errors and improvements. Part B–style questions cover projectile motion and circular motion (no torque, no banked tracks) and designing or evaluating investigations. Original short-answer questions. Each attempt draws 5 short-answer questions (2–4 marks each), so there are 7 non-repeating attempts.",
  created: "2026-11-17",
  order: 3,
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
      { label: "Speed in a circle", text: "v = 2πr ÷ T" },
      { label: "Centripetal force", text: "F_c = mv²/r (= Mg in the practical)" },
      { label: "The straight-line graph", text: "v² = (Mg/m) r — gradient Mg/m" },
      { label: "Percentage error", text: "|experimental − accepted| ÷ accepted × 100" },
      { label: "Projectiles", text: "u_x = u cos θ, u_y = u sin θ; v_x constant; a_y = −9.8 m s⁻²" },
    ],
  },
};

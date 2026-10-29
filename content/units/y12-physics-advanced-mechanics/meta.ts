import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-physics-advanced-mechanics",
  year: "Year 12",
  topic: "Module 5: Advanced Mechanics",
  type: "Topic Quiz",
  title: "Advanced Mechanics",
  description:
    "Module 5 of the HSC Physics course (2017 syllabus, examined in the 2027 HSC): projectile motion, circular motion (including banked tracks and torque) and motion in gravitational fields (orbits, Kepler's laws, gravitational potential energy and escape velocity). Every question comes word for word from a school trial or half-yearly paper, with its source shown; no HSC questions are used, so past HSC papers stay unseen for full practice. Each attempt draws 5 multiple-choice and 4 short-answer questions, weighted like the HSC: about half gravitation, a third projectiles and a fifth circular motion.",
  created: "2026-10-28",
  order: 1,
  conceptsReady: true,
  explanationsComplete: true,
  quiz: {
    short: 4,
    mc: 5,
    passMark: 55,
    groups: [
      { group: "mc", n: 5 },
      { group: "sa", n: 4 },
    ],
  },
  guide: {
    title: "Data sheet values",
    items: [
      { label: "Acceleration due to gravity at Earth's surface", text: "g = 9.8 m s⁻²" },
      { label: "Universal gravitational constant", text: "G = 6.67 × 10⁻¹¹ N m² kg⁻²" },
      { label: "Mass of Earth", text: "M_E = 6.0 × 10²⁴ kg" },
      { label: "Radius of Earth", text: "r_E = 6.371 × 10⁶ m" },
    ],
  },
};

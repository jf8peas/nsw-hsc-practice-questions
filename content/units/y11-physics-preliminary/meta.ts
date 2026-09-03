import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y11-physics-preliminary",
  year: "Year 11",
  topic: "Exam preparation",
  type: "Milestone Test",
  title: "Physics Preliminary",
  description:
    "Broad revision for the Year 11 Physics Preliminary exam, covering all three focus areas of the NESA syllabus: Fundamentals of mechanics (motion, vectors, motion graphs, Newton's laws, forces and friction, work, energy and momentum), Waves (wave properties, sound and light, the electromagnetic spectrum, reflection, refraction, diffraction, superposition, standing waves and the Doppler effect), and Electricity and magnetism (electrostatics, electric fields, circuits, and magnetism). Every question is factual or reasoning-based — no calculations. Each attempt draws 5 multiple-choice questions (1 mark each) and 5 short-answer questions (2–4 marks each), so a student gets 10 non-repeating attempts.",
  created: "2026-09-03",
  order: 3,
  quiz: {
    short: 5,
    mc: 5,
    passMark: 55,
    groups: [
      { group: "mc", n: 5 },
      { group: "sa", n: 5 },
    ],
  },
};

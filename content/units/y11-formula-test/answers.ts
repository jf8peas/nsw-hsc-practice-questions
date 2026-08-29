import type { AnswerSet } from "@/lib/types";

// Answer key for y11-formula-test.
// This file has NO "server-only" import so the content validator can read it,
// but it is only ever re-exported through content/answers/index.ts, which is
// server-only. Never import this file from a client component.
export const answers: AnswerSet = {
  "y11-formula-test.q1": {
    modelAnswer: "m is mass. Its SI unit is the kilogram (kg).",
    rubric: ["Identifies m as mass", "States the SI unit as kilogram (kg)"],
  },
  "y11-formula-test.q2": {
    modelAnswer: "a is acceleration. Its SI unit is metres per second squared (m/s²).",
    rubric: ["Identifies a as acceleration", "States the SI unit as m/s² (m s⁻²)"],
    notes: "Accept 'metres per second per second'. 'rate of change of velocity' is acceptable for the quantity.",
  },
  "y11-formula-test.q3": {
    modelAnswer: "W is work done. Its SI unit is the joule (J).",
    rubric: ["Identifies W as work (done)", "States the SI unit as joule (J)"],
    notes: "Accept 'energy transferred' for the quantity. Do not accept 'weight'.",
  },
  "y11-formula-test.q4": {
    modelAnswer: "p is momentum. Its SI unit is kilogram metres per second (kg·m/s).",
    rubric: ["Identifies p as momentum", "States the SI unit as kg·m/s (kg m s⁻¹)"],
    notes: "Accept 'N·s' as an equivalent unit.",
  },
  "y11-formula-test.q5": {
    modelAnswer: "Ek is kinetic energy. Its SI unit is the joule (J).",
    rubric: ["Identifies Ek as kinetic energy", "States the SI unit as joule (J)"],
  },
  "y11-formula-test.q6": {
    correctIndex: 0,
    rubric: ["Selects the net-force scenario (F = ma)"],
  },
  "y11-formula-test.q7": {
    correctIndex: 0,
    rubric: ["Selects the kinetic-energy scenario (Ek = ½mv²)"],
  },
  "y11-formula-test.q8": {
    correctIndex: 0,
    rubric: ["Selects the final-velocity scenario (v = u + at)"],
  },
  "y11-formula-test.q9": {
    correctIndex: 0,
    rubric: ["Selects the momentum scenario (p = mv)"],
  },
  "y11-formula-test.q10": {
    correctIndex: 0,
    rubric: ["Selects the heating-water scenario (Q = mcΔT)"],
  },
};

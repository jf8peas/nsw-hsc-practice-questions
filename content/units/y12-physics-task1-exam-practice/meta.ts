import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-physics-task1-exam-practice",
  year: "Year 12",
  topic: "Module 5: Advanced Mechanics",
  type: "Topic Quiz",
  title: "Analysing Results: Errors, Reliability and Graphs",
  description:
    "Exam practice for analysing results in the whirling-stopper practical, pendulums and projectiles. Each attempt draws one short-answer question (2–3 marks) from each of five skills: following an error through to its effect on the result (random or systematic, and which way it moves the answer); telling accuracy, reliability and validity apart, and why averaging helps; rearranging the model into y = (gradient) × x to find what the gradient means; working out whether a relationship is proportional before choosing the axes; and sanity-checking results, reading a percentage error, and leaving anomalies out of averages. 7 non-repeating attempts. Original questions; no torque and no banked tracks.",
  created: "2026-11-17",
  order: 3,
  conceptsReady: true,
  explanationsComplete: true, // no multiple-choice questions, so nothing to explain
  quiz: {
    short: 5,
    mc: 0,
    passMark: 55,
    groups: [
      { group: "trace", n: 1 },
      { group: "arv", n: 1 },
      { group: "gradient", n: 1 },
      { group: "relation", n: 1 },
      { group: "check", n: 1 },
    ],
  },
  guide: {
    title: "Rules to apply",
    items: [
      { label: "Trace every error", text: "Random or systematic? → what it changes (T, v, r, F) → which way → gradient → final answer too high, too low, or just scattered" },
      { label: "Random vs systematic", text: "Random: some trials high, some low — scatters points, averaging cancels it. Systematic: every trial pushed the same way — shifts the result, averaging can't fix it" },
      { label: "Accuracy, reliability, validity", text: "Accuracy: close to the accepted value. Reliability: repeated trials agree closely (not how many trials). Validity: the method fairly tests the aim" },
      { label: "What the gradient means", text: "Rearrange the model into y-axis = (gradient) × x-axis, read off the gradient, then rearrange for the unknown — e.g. v² = (Mg/m) r, so g = m × gradient ÷ M" },
      { label: "Increases ≠ proportional", text: "Check with the data: if doubling x does not double y, it is not proportional. Work out the relationship first, then choose axes that give a straight line" },
      { label: "Read the percentage error", text: "Small (a few %): random only. Moderate, one-sided: systematic. 3× or more: wrong formula, model or units" },
      { label: "Anomalies", text: "Leave an anomaly out of the average (or repeat the trial). Too short a time → T too small → v too large" },
    ],
  },
};

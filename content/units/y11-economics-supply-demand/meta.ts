import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y11-economics-supply-demand",
  year: "Year 11",
  topic: "The Market Economy",
  type: "Topic Quiz",
  title: "Economics: Supply & Demand",
  description:
    "Year 11 microeconomics — the operation of the market. Multiple-choice questions test the laws of demand and supply, the non-price factors that shift each curve, and how equilibrium price and quantity respond. Short-answer questions give you a scenario and a supply/demand diagram and ask you to describe what happens to the curves and to equilibrium. The last two questions each attempt cover the wider Year 11 market syllabus (the price mechanism, movements versus shifts, market efficiency, price elasticity). Each attempt draws 4 + 4 + 2 questions at random.",
  order: 1,
  quiz: {
    short: 6,
    mc: 4,
    passMark: 60,
    groups: [
      { group: "mc", n: 4 },
      { group: "shift", n: 4 },
      { group: "micro", n: 2 },
    ],
  },
};

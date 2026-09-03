import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y11-economics-supply-demand",
  year: "Year 11",
  topic: "The Market Economy",
  type: "Topic Quiz",
  title: "Economics: The Market Economy",
  description:
    "Year 11 microeconomics — how markets work. Multiple-choice questions cover the laws of demand and supply, movements along versus shifts of a curve, how equilibrium price and quantity respond to changes in the determinants, price elasticity of demand and supply (including calculations and the total outlay method), government intervention (price ceilings, price floors, indirect taxes and subsidies), labour markets, and Australia's housing and commodity markets. Diagram short-answer questions give you a market diagram and a scenario and ask you to describe what happens. Written short-answer questions test the price mechanism, elasticity, intervention and market analysis. Each attempt draws 4 multiple-choice + 4 diagram + 2 written questions at random.",
  created: "2026-08-30",
  order: 1,
  quiz: {
    short: 6,
    mc: 4,
    passMark: 60,
    groups: [
      { group: "mc", n: 4 },
      { group: "diagram", n: 4 },
      { group: "micro", n: 2 },
    ],
  },
};

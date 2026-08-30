import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y11-economics-preliminary",
  year: "Year 11",
  topic: "Exam preparation",
  type: "Milestone Test",
  title: "Economics Preliminary",
  description:
    "Broad revision for the Year 11 Economics Preliminary exam, covering all six focus areas of the NESA syllabus: introduction to economics (scarcity, opportunity cost, the production possibilities model, the circular flow of income, the business cycle), markets (demand and supply, elasticity, market structures, market failure and government intervention), the household and business sector, the financial sector, the government sector, and the international sector. Each attempt draws 5 multiple-choice questions (1 mark each) and 5 short-answer questions (2–4 marks each), so a student gets 10 non-repeating attempts.",
  order: 2,
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

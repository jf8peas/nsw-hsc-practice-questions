import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-economics-global-economy",
  year: "Year 12",
  topic: "Topic 1: The Global Economy",
  type: "Topic Quiz",
  title: "The Global Economy",
  description:
    "HSC Economics Topic 1 (2009 syllabus, examined in the 2027 HSC): globalisation, trade and protection (tariffs, quotas, subsidies), international organisations and forums, trading blocs, the international business cycle, growth and development, and the global distribution of income and wealth. 73 MC and 64 SA questions are copied word for word from school trial papers, with their source shown; 23 MC and 9 SA are original questions written to fill syllabus gaps. No HSC questions are used, so past HSC papers stay unseen for full practice. Each attempt draws 5 multiple-choice and 4 short-answer questions.",
  created: "2026-11-01",
  order: 3,
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
};

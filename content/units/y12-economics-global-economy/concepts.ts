import type { Concept } from "@/lib/types";

// PUBLIC — the concepts a student can be asked to relearn in this unit (spec 002).
// Ids are `<unit-id>.c-<slug>`, are never renamed or reused, and descriptions are one line.
// Which questions carry which concept is in ./concept-tags.ts.

const U = "y12-economics-global-economy";

const list: Array<[slug: string, description: string]> = [
  ["global-economy", "The global economy and Gross World Product: what the global economy is and how its total output is measured."],
  ["globalisation", "Globalisation and its drivers: trade, financial flows, FDI and TNCs, technology, and the division of labour."],
  ["global-interdependence", "Reading statistics on trade and financial flows to judge how interdependent national economies are."],
  ["international-business-cycle", "The international and regional business cycles and how fluctuations in one economy spill over to others."],
  ["free-trade", "The economic case for free trade and its advantages and disadvantages."],
  ["international-organisations", "The roles of the WTO, IMF, World Bank, United Nations and OECD in the global economy."],
  ["economic-forums", "Government economic forums — the G20 and G7/G8 — and how they coordinate global economic policy."],
  ["trading-blocs", "Trading blocs, monetary unions, and multilateral and bilateral free trade agreements: their pros and cons."],
  ["protection", "Why countries protect industries, and the methods and effects of tariffs, quotas, subsidies and local content rules."],
  ["growth-vs-development", "Economic growth vs economic development, and the income and quality-of-life indicators used to compare countries."],
  ["economy-classification", "How economies are classified as developing, emerging or advanced, and the reasons for the differences between nations."],
  ["income-wealth-distribution", "The global distribution of income and wealth and the consequences of an unequal distribution."],
  ["globalisation-effects", "Effects of globalisation on growth, quality of life, the environment, trade, investment and TNCs."],
  ["development-strategies", "Development strategies, and how to evaluate them, including in the case-study economy."],
];

export const concepts: Concept[] = list.map(([slug, description]) => ({ id: `${U}.c-${slug}`, description }));

/** Questions removed from this unit, with the concept each carried. None so far. */
export const retired: Record<string, string | null> = {};

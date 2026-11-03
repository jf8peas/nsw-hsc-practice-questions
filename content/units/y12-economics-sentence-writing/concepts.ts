import { defineTermConcepts } from "../../concept-helpers";

// PUBLIC — the 31 tracked terms of this unit (spec 005, data-model.md). Each term IS a
// concept; its one-line definition is the concept description (FR-031) and the hint text, and
// "Concepts to review" shows the term with it. Terms must match answers.ts.
// Ids are `<unit-id>.c-<slug>`, never renamed or reused. Question tags are in ./concept-tags.ts.

export const concepts = defineTermConcepts("y12-economics-sentence-writing", [
  ["global-economy", "global economy", "All the world's economies and the trade, money and investment links between them."],
  ["gross-world-product", "Gross World Product", "The total value of everything produced in the world in a year."],
  ["globalisation", "globalisation", "The growing connection of economies through trade, money, investment, technology and people."],
  ["trade-in-goods-and-services", "trade in goods and services", "Buying and selling physical goods and services across borders."],
  ["financial-flows", "financial flows", "Short- and long-term movements of money between countries."],
  ["transnational-corporations", "transnational corporations", "Firms that produce or operate in more than one country."],
  ["international-business-cycle", "international business cycle", "Many economies booming and slowing at the same time."],
  ["free-trade", "free trade", "Trade with no artificial barriers like tariffs or quotas."],
  ["comparative-advantage", "comparative advantage", "Producing a good at a lower opportunity cost than another country."],
  ["specialisation", "specialisation", "Concentrating production on what a country does best and trading for the rest."],
  ["international-organisation", "international organisation", "A formal body of member governments with set roles and rules."],
  ["trade-liberalisation", "trade liberalisation", "Reducing barriers to trade between countries."],
  ["government-economic-forum", "government economic forum", "An informal meeting of leaders to coordinate policy, with no binding rules."],
  ["trading-bloc", "trading bloc", "A group of countries that cut trade barriers among themselves."],
  ["free-trade-agreement", "free trade agreement", "A deal between countries to trade with few or no barriers."],
  ["protection", "protection", "Government measures that shelter local producers from foreign competition."],
  ["tariff", "tariff", "A tax on imported goods that raises their price."],
  ["quota", "quota", "A limit on the quantity of a good that may be imported."],
  ["subsidy", "subsidy", "A government payment to local producers that lowers their costs."],
  ["domestic-producers", "domestic producers", "Firms that make goods inside the home country."],
  ["imports", "imports", "Goods and services bought from other countries."],
  ["infant-industry", "infant industry", "A young industry protected until it can compete on its own."],
  ["economic-growth", "economic growth", "An increase in a country's real output (real GDP)."],
  ["economic-development", "economic development", "A broad improvement in living standards and well-being, not just income."],
  ["quality-of-life", "quality of life", "How well people live, including health, education and income."],
  ["developing-economy", "developing economy", "A low-income economy with weak industry and poor health and education."],
  ["emerging-economy", "emerging economy", "A middle-income economy industrialising quickly."],
  ["advanced-economy", "advanced economy", "A high-income economy with a diversified, productive structure."],
  ["environmental-sustainability", "environmental sustainability", "Meeting today's needs without harming future generations' ability to meet theirs."],
  ["structural-change", "structural change", "The shift of resources between industries as an economy changes."],
  ["export-led-growth", "export-led growth", "Growing an economy by selling into world markets."],
]);

/** Questions removed from this unit, with the concept(s) each carried. None so far. */
export const retired: Record<string, string | string[] | null> = {};

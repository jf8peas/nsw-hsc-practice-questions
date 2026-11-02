import { defineConcepts } from "../../concept-helpers";

// PUBLIC — the 31 tracked terms of this unit (spec 005, data-model.md). Each term IS a
// concept; its one-line definition is the concept description (FR-031) and the hint text.
// Ids are `<unit-id>.c-<slug>`, never renamed or reused. Question tags are in ./concept-tags.ts.

export const concepts = defineConcepts("y12-economics-sentence-writing", [
  ["global-economy", "All the world's economies and the trade, money and investment links between them."],
  ["gross-world-product", "The total value of everything produced in the world in a year."],
  ["globalisation", "The growing connection of economies through trade, money, investment, technology and people."],
  ["trade-in-goods-and-services", "Buying and selling physical goods and services across borders."],
  ["financial-flows", "Short- and long-term movements of money between countries."],
  ["transnational-corporations", "Firms that produce or operate in more than one country."],
  ["international-business-cycle", "Many economies booming and slowing at the same time."],
  ["free-trade", "Trade with no artificial barriers like tariffs or quotas."],
  ["comparative-advantage", "Producing a good at a lower opportunity cost than another country."],
  ["specialisation", "Concentrating production on what a country does best and trading for the rest."],
  ["international-organisation", "A formal body of member governments with set roles and rules."],
  ["trade-liberalisation", "Reducing barriers to trade between countries."],
  ["government-economic-forum", "An informal meeting of leaders to coordinate policy, with no binding rules."],
  ["trading-bloc", "A group of countries that cut trade barriers among themselves."],
  ["free-trade-agreement", "A deal between countries to trade with few or no barriers."],
  ["protection", "Government measures that shelter local producers from foreign competition."],
  ["tariff", "A tax on imported goods that raises their price."],
  ["quota", "A limit on the quantity of a good that may be imported."],
  ["subsidy", "A government payment to local producers that lowers their costs."],
  ["domestic-producers", "Firms that make goods inside the home country."],
  ["imports", "Goods and services bought from other countries."],
  ["infant-industry", "A young industry protected until it can compete on its own."],
  ["economic-growth", "An increase in a country's real output (real GDP)."],
  ["economic-development", "A broad improvement in living standards and well-being, not just income."],
  ["quality-of-life", "How well people live, including health, education and income."],
  ["developing-economy", "A low-income economy with weak industry and poor health and education."],
  ["emerging-economy", "A middle-income economy industrialising quickly."],
  ["advanced-economy", "A high-income economy with a diversified, productive structure."],
  ["environmental-sustainability", "Meeting today's needs without harming future generations' ability to meet theirs."],
  ["structural-change", "The shift of resources between industries as an economy changes."],
  ["export-led-growth", "Growing an economy by selling into world markets."],
]);

/** Questions removed from this unit, with the concept(s) each carried. None so far. */
export const retired: Record<string, string | string[] | null> = {};

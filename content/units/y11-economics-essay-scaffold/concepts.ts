import { defineConcepts } from "../../concept-helpers";

// PUBLIC — the concepts a student can be asked to relearn in this unit (spec 002).
// Ids are `<unit-id>.c-<slug>`, never renamed or reused. Question tags are in ./concept-tags.ts.

export const concepts = defineConcepts("y11-economics-essay-scaffold", [
  // --- Government and the economy ---
  ["market-failure", "Market failure: when the price mechanism fails to allocate resources efficiently or equitably"],
  ["externalities", "Negative externalities impose costs on third parties; policies such as a carbon price address them"],
  ["public-goods", "Public goods are non-rival and non-excludable, so markets under-provide them"],
  ["information-market-power", "Asymmetric information and the abuse of market power cause market failure"],
  ["competition-ownership", "Competition policy, the ACCC and government ownership of essential services"],
  ["govt-role-equity", "The government's economic roles and the trade-off between efficiency and equity"],
  ["federal-budget", "The Budget outcome and stance, government debt, GST distribution and revenue risks"],
  ["fiscal-policy", "Fiscal policy: how government spending and taxation affect economic activity"],
  ["taxation", "Types of tax, the features of a good tax system, tax reform and bracket creep"],
  ["monetary-policy", "Monetary policy: how the RBA's cash rate influences spending, inflation and growth"],
  ["stabilisation-policy", "How well monetary and fiscal policy work together to stabilise the economy"],
  ["inflation", "Inflation: demand-side and supply-side causes, and its effects on households and the economy"],
  ["labour-wages-productivity", "Wages, productivity, the minimum wage and the gig economy"],
  ["housing", "Housing affordability: interest rates, supply and demand, and policy responses"],
  // --- Financial markets ---
  ["financial-markets", "Financial markets and intermediaries, and the risks of fintech and digital assets"],
  ["financial-regulation", "Financial regulators, macroprudential rules, bank levies and deposit guarantees"],
  ["exchange-rate-trade", "The floating exchange rate, free trade versus protection, and foreign investment"],
  ["retirement-intergenerational", "Superannuation, retirement incomes and intergenerational equity"],
]);

/** Questions removed from this unit, with the concept each carried. None so far. */
export const retired: Record<string, string | null> = {};

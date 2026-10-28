import { defineConcepts } from "../../concept-helpers";

// PUBLIC — the concepts a student can be asked to relearn in this unit (spec 002).
// Ids are `<unit-id>.c-<slug>`, never renamed or reused. Question tags are in ./concept-tags.ts.

export const concepts = defineConcepts("y11-economics-supply-demand", [
  ["demand-supply-laws", "The laws of demand and supply: price and quantity move in opposite (demand) or the same (supply) direction"],
  ["movement-vs-shift", "A change in price moves along a curve; any other change shifts the curve"],
  ["equilibrium-adjustment", "Equilibrium, and how shortages and surpluses push the price back to it"],
  ["price-mechanism-functions", "The price mechanism's signalling, incentive and rationing functions"],
  ["equilibrium-single-shift", "How one shift in demand or supply changes equilibrium price and quantity"],
  ["equilibrium-double-shift", "When demand and supply both shift, price or quantity is uncertain"],
  ["demand-determinants-general", "Non-price determinants of demand shift the demand curve"],
  ["demand-income", "Income changes shift demand: up for normal goods, down for inferior goods"],
  ["demand-related-goods", "Prices of substitutes and complements shift demand"],
  ["demand-tastes-population", "Tastes, trends, weather and the number of buyers shift demand"],
  ["demand-expectations", "Expecting a higher future price raises demand now; expecting a lower one cuts it"],
  ["supply-determinants-general", "Non-price determinants of supply shift the supply curve"],
  ["supply-costs-technology", "Lower input costs or better technology raise supply; higher costs cut it"],
  ["supply-sellers-conditions", "The number of sellers, weather, disasters and regulation shift supply"],
  ["supply-expectations", "Producers expecting higher future prices hold back supply now"],
  ["ped-calculation", "Price elasticity of demand: how it is calculated and what the value means"],
  ["ped-determinants", "What makes demand more or less price-elastic: substitutes, necessity, budget share, time"],
  ["total-revenue", "Price changes and total revenue depend on whether demand is elastic or inelastic"],
  ["price-elasticity-supply", "Price elasticity of supply: calculation, and the effect of time and storability"],
  ["price-ceilings", "A binding price ceiling causes shortages, black markets and rationing problems"],
  ["price-floors", "A binding price floor causes surpluses that must be bought, stored or wasted"],
  ["indirect-tax-incidence", "A per-unit tax shifts supply left; elasticity decides who bears the burden"],
  ["subsidies", "A per-unit subsidy shifts supply right, lowering price and raising quantity"],
  ["labour-demand", "Labour demand is derived and shifts with product demand, productivity and automation"],
  ["labour-supply", "Labour supply shifts with qualifications, mobility, migration and population"],
  ["wage-equilibrium", "The equilibrium wage, skill shortages and wage differences between occupations"],
  ["minimum-wage", "A minimum wage above equilibrium reduces employment in that labour market"],
  ["housing-supply-side", "Housing supply is price-inelastic, so planning, zoning and land release matter"],
  ["housing-demand-side", "Population, interest rates, tax concessions and speculation drive housing demand and prices"],
  ["commodity-price-volatility", "Commodity prices swing widely because supply responds slowly to demand shocks"],
]);

/** Questions removed from this unit, with the concept each carried. None so far. */
export const retired: Record<string, string | null> = {};

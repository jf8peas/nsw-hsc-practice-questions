import type { McQuestion, Question, ShortQuestion } from "@/lib/types";
import { shuffleBySeed } from "@/lib/shuffle";
import { sd } from "./diagram";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Built from the NESA Economics 11–12 syllabus (Year 11 "The Market Economy":
// demand & supply, equilibrium, price elasticity, government intervention,
// labour markets, and the housing/commodity markets) plus the teaching
// material in resources/topic002.
//
// Three groups, drawn 4 + 4 + 2 per attempt:
//   "mc"      — multiple choice, 1 mark (movement vs shift, shifts & equilibrium,
//               elasticity calcs & concepts, government intervention, labour,
//               property/commodity). 168 questions.
//   "diagram" — short answer with a market diagram, 2–3 marks (curve shifts,
//               price ceilings/floors, taxes/subsidies, labour markets, housing).
//               128 questions.
//   "micro"   — written short answer, 2–4 marks (price mechanism, elasticity,
//               total outlay method, intervention rationale, labour, property).
//               80 questions.

const U = "y11-economics-supply-demand";
const p2 = (n: number) => String(n).padStart(2, "0");

// Reused diagrams (a handful of constants so the client bundle stays small).
const D_BASE = sd();
const D_DINC = sd({ shift: "demand-increase" });
const D_SINC = sd({ shift: "supply-increase" });
const D_SURPLUS = sd({ priceLine: { p: 0.75, label: "P₁" }, caption: "P₁ is above the equilibrium price" });
const D_SHORTAGE = sd({ priceLine: { p: 0.26, label: "P₁" }, caption: "P₁ is below the equilibrium price" });

const D_CEILING = sd({ priceLine: { p: 0.3, label: "Pᶜ" }, span: { p: 0.3, label: "Shortage" }, caption: "Pᶜ — a price ceiling set below equilibrium" });
const D_FLOOR = sd({ priceLine: { p: 0.72, label: "Pᶠ" }, span: { p: 0.72, label: "Surplus" }, caption: "Pᶠ — a price floor set above equilibrium" });
const D_TAX = sd({ shift: "supply-decrease", shiftLabels: { supply2: "S + tax" }, caption: "Per-unit (indirect) tax on producers" });
const D_SUBSIDY = sd({ shift: "supply-increase", shiftLabels: { supply2: "S − subsidy" }, caption: "Per-unit subsidy paid to producers" });

const HOUSE_BASE = sd({ steepSupply: true, caption: "Established housing — supply is price-inelastic" });
const HOUSE_DINC = sd({ steepSupply: true, shift: "demand-increase", caption: "Established housing — supply is price-inelastic" });
const HOUSE_SINC = sd({ steepSupply: true, shift: "supply-increase", caption: "Housing — supply increases" });

const LAB = { axisLabels: { x: "Quantity of labour", y: "Wage" } } as const;
const LAB_BASE = sd({ ...LAB });
const LAB_DINC = sd({ ...LAB, shift: "demand-increase" });
const LAB_DDEC = sd({ ...LAB, shift: "demand-decrease" });
const LAB_SINC = sd({ ...LAB, shift: "supply-increase" });
const LAB_SDEC = sd({ ...LAB, shift: "supply-decrease" });
const LAB_MINWAGE = sd({ ...LAB, priceLine: { p: 0.72, label: "Wₘ" }, span: { p: 0.72, label: "Surplus" }, caption: "Wₘ — a minimum wage above the equilibrium wage" });
const LAB_SHORTAGE = sd({ ...LAB, priceLine: { p: 0.3, label: "W₁" }, span: { p: 0.3, label: "Shortage" }, caption: "At wage W₁ the labour demanded exceeds the labour supplied" });

const HOUSE_DDEC = sd({ steepSupply: true, shift: "demand-decrease", caption: "Established housing — supply is price-inelastic" });
const D_SDEC = sd({ shift: "supply-decrease" });
const D_DDEC = sd({ shift: "demand-decrease" });

function mc(
  n: number,
  prompt: string,
  canonical: [string, string, string, string],
  diagramSvg?: string,
): McQuestion {
  const id = `${U}.m${p2(n)}`;
  return {
    id,
    group: "mc",
    type: "mc",
    prompt,
    maxMarks: 1,
    options: shuffleBySeed(id, canonical),
    ...(diagramSvg ? { diagramSvg } : {}),
  };
}

function shiftQ(n: number, marks: number, prompt: string, diagramSvg: string = D_BASE): ShortQuestion {
  return {
    id: `${U}.s${p2(n)}`,
    group: "diagram",
    type: "short",
    prompt,
    maxMarks: marks,
    diagramSvg,
  };
}

function microQ(n: number, marks: number, prompt: string): ShortQuestion {
  return { id: `${U}.q${p2(n)}`, group: "micro", type: "short", prompt, maxMarks: marks };
}

// --------------------------------------------------------------------------
// Multiple choice — m01..m40
// --------------------------------------------------------------------------

const mcQuestions: McQuestion[] = [
  mc(1, "Which statement best describes the relationship shown by a demand curve?", [
    "As the price of the good rises, the quantity demanded falls, all else equal.",
    "As the price of the good rises, the quantity demanded rises.",
    "As the price of the good rises, demand decreases.",
    "The price of the good and the quantity demanded are unrelated.",
  ]),
  mc(2, "Which statement best describes the law of supply?", [
    "As the price of a good rises, producers are willing to supply a greater quantity, all else equal.",
    "As the price of a good rises, the quantity supplied falls.",
    "As the price of a good rises, supply decreases.",
    "The quantity supplied depends only on the cost of production, not on price.",
  ]),
  mc(3, "A fall in the price of a good, with everything else unchanged, causes:", [
    "an expansion of demand — a movement down along the demand curve.",
    "an increase in demand — a rightward shift of the demand curve.",
    "a decrease in demand — a leftward shift of the demand curve.",
    "a leftward shift of the supply curve.",
  ], D_BASE),
  mc(4, "A rise in the price of a good, with everything else unchanged, causes producers to:", [
    "expand the quantity supplied — a movement up along the supply curve.",
    "shift the supply curve to the right.",
    "shift the supply curve to the left.",
    "decrease supply.",
  ], D_BASE),
  mc(5, "Which of these is a change in demand rather than a change in the quantity demanded?", [
    "Consumers buy more coffee after a report says it has health benefits.",
    "Consumers buy more coffee because its price has fallen.",
    "Consumers buy less coffee because its price has risen.",
    "A café sells fewer coffees after it raises its prices.",
  ]),
  mc(6, "To say that 'the demand for a good has increased' means that the demand curve has:", [
    "shifted to the right — a greater quantity is demanded at every price.",
    "a downward slope.",
    "moved because the good's own price changed.",
    "become steeper.",
  ]),
  mc(7, "Coffee and tea are substitutes. A large, sustained rise in the price of tea will most likely:", [
    "increase the demand for coffee — a rightward shift of the coffee demand curve.",
    "decrease the demand for coffee.",
    "cause an expansion of the supply of coffee.",
    "have no effect on the coffee market.",
  ]),
  mc(8, "Cars and petrol are complements. A sharp, lasting fall in the price of petrol will most likely:", [
    "increase the demand for cars.",
    "decrease the demand for cars.",
    "decrease the supply of cars.",
    "cause a contraction of the demand for cars.",
  ]),
  mc(9, "Beef is a normal good. A recession lowers household incomes. The demand for beef will most likely:", [
    "decrease — the demand curve shifts to the left.",
    "increase — the demand curve shifts to the right.",
    "expand along the existing demand curve.",
    "be unchanged, because the price of beef has not changed.",
  ]),
  mc(10, "Instant noodles are an inferior good. A rise in household incomes will most likely cause the demand for instant noodles to:", [
    "decrease — the demand curve shifts to the left.",
    "increase — the demand curve shifts to the right.",
    "expand along the demand curve.",
    "stay exactly the same.",
  ]),
  mc(11, "Consumers come to expect the price of a good to rise sharply next month. This will most likely cause current demand to:", [
    "increase now, as consumers bring their purchases forward.",
    "decrease now.",
    "contract along the demand curve.",
    "shift the supply curve to the right.",
  ]),
  mc(12, "Which of the following would increase the market demand for a good?", [
    "An increase in the number of consumers in the market.",
    "An improvement in the technology used to produce it.",
    "A fall in the price of a factor of production used to make it.",
    "A new tax imposed on the producers of the good.",
  ]),
  mc(13, "A successful advertising campaign shifts consumer tastes towards a product. In that market:", [
    "demand increases and the demand curve shifts to the right.",
    "the quantity demanded expands along the existing curve.",
    "supply increases.",
    "the demand curve becomes vertical.",
  ]),
  mc(14, "Margarine and butter are substitutes. The price of margarine falls significantly. In the butter market:", [
    "the demand for butter decreases — its demand curve shifts left.",
    "the demand for butter increases — its demand curve shifts right.",
    "the quantity of butter demanded expands along the curve.",
    "the supply of butter decreases.",
  ]),
  mc(15, "Which of the following is NOT a cause of a shift in the demand curve for a good?", [
    "A change in the good's own price.",
    "A change in consumer incomes.",
    "A change in the price of a substitute good.",
    "A change in consumer tastes and preferences.",
  ]),
  mc(16, "A new technology lowers the cost of producing solar panels. In that market, supply will:", [
    "increase — the supply curve shifts to the right.",
    "decrease — the supply curve shifts to the left.",
    "contract along the supply curve.",
    "be unaffected until the price of solar panels changes.",
  ]),
  mc(17, "The wage rate paid to workers in an industry rises sharply. That industry's supply curve will most likely:", [
    "shift to the left — supply decreases.",
    "shift to the right — supply increases.",
    "not move; the quantity supplied simply contracts.",
    "become horizontal.",
  ]),
  mc(18, "The government places a per-unit tax on the producers of sugary drinks. The supply curve for sugary drinks will:", [
    "shift to the left.",
    "shift to the right.",
    "not shift; only the quantity supplied changes.",
    "shift right, then left.",
  ]),
  mc(19, "New firms are attracted into a profitable industry and begin producing. Market supply in that industry will:", [
    "increase — the supply curve shifts to the right.",
    "decrease — the supply curve shifts to the left.",
    "expand along the existing supply curve only.",
    "stay unchanged.",
  ]),
  mc(20, "The government pays producers a subsidy for each unit of a good they produce. This will most likely:", [
    "increase supply — the supply curve shifts to the right.",
    "decrease supply — the supply curve shifts to the left.",
    "cause a contraction of supply along the curve.",
    "shift the demand curve to the right.",
  ]),
  mc(21, "A drought damages a large share of the wheat crop. In the wheat market, supply will:", [
    "decrease — the supply curve shifts to the left.",
    "increase — the supply curve shifts to the right.",
    "expand along the supply curve.",
    "not change until the price of wheat changes.",
  ]),
  mc(22, "Producers come to expect the price of their good to be much higher next season. Their current supply will most likely:", [
    "decrease now, as they withhold stock to sell later at the higher price.",
    "increase now.",
    "expand along the current supply curve.",
    "shift the demand curve to the left.",
  ]),
  mc(23, "Which of the following would increase the supply of a good?", [
    "A fall in the price of the raw materials used to make it.",
    "A rise in the wages of the workers who make it.",
    "A new tax imposed on its producers.",
    "A fall in the number of firms producing it.",
  ]),
  mc(24, "The diagram shows a competitive market. At the equilibrium price:", [
    "the quantity demanded equals the quantity supplied and there is no tendency for the price to change.",
    "there is a surplus that pushes the price up.",
    "there is a shortage that pushes the price down.",
    "consumers pay the highest price they would be willing to pay.",
  ], D_BASE),
  mc(25, "In the diagram, the market price P₁ is set above the equilibrium price. At this price:", [
    "the quantity supplied exceeds the quantity demanded — a surplus — and the price tends to fall.",
    "the quantity demanded exceeds the quantity supplied — a shortage — and the price tends to rise.",
    "the market is in equilibrium.",
    "demand will shift left to remove the surplus.",
  ], D_SURPLUS),
  mc(26, "In the diagram, the market price P₁ is below the equilibrium price. This means there is:", [
    "a shortage — the quantity demanded exceeds the quantity supplied — and upward pressure on the price.",
    "a surplus — the quantity supplied exceeds the quantity demanded — and downward pressure on the price.",
    "no imbalance, because the market clears at any price.",
    "a leftward shift of the demand curve.",
  ], D_SHORTAGE),
  mc(27, "An increase in demand, with supply unchanged, will cause the equilibrium:", [
    "price to rise and the quantity to rise.",
    "price to fall and the quantity to rise.",
    "price to rise and the quantity to fall.",
    "price and quantity to both fall.",
  ], D_BASE),
  mc(28, "An increase in supply, with demand unchanged, will cause the equilibrium:", [
    "price to fall and the quantity to rise.",
    "price to rise and the quantity to rise.",
    "price to fall and the quantity to fall.",
    "price to rise and the quantity to fall.",
  ], D_BASE),
  mc(29, "A decrease in demand, with supply unchanged, will cause the equilibrium:", [
    "price to fall and the quantity to fall.",
    "price to rise and the quantity to fall.",
    "price to fall and the quantity to rise.",
    "price and quantity to be unchanged.",
  ], D_BASE),
  mc(30, "A decrease in supply, with demand unchanged, will cause the equilibrium:", [
    "price to rise and the quantity to fall.",
    "price to fall and the quantity to rise.",
    "price and quantity to both rise.",
    "price and quantity to both fall.",
  ], D_BASE),
  mc(31, "An improvement in the technology used to produce cars will most likely change the equilibrium price and quantity of cars in which way?", [
    "Price falls and quantity rises.",
    "Price rises and quantity rises.",
    "Price rises and quantity falls.",
    "Price falls and quantity falls.",
  ]),
  mc(32, "An increase in the popularity of Good X will most likely change its equilibrium price and quantity in which way?", [
    "Price rises and quantity rises.",
    "Price rises and quantity falls.",
    "Price falls and quantity rises.",
    "Price falls and quantity falls.",
  ]),
  mc(33, "A drought will most likely change the equilibrium price and quantity of oranges in which way?", [
    "Price rises and quantity falls.",
    "Price rises and quantity rises.",
    "Price falls and quantity falls.",
    "Price falls and quantity rises.",
  ]),
  mc(34, "Which of the following would most likely cause an increase in the price of pizza?", [
    "An increase in the price of cheese, a key input in making pizza.",
    "A decrease in the price of hamburgers, a substitute for pizza.",
    "A fall in consumer interest in takeaway and fast food.",
    "A report showing that eating pizza is unhealthy.",
  ]),
  mc(35, "The signalling function of the price mechanism refers to:", [
    "rising or falling prices conveying information to producers and consumers about changing market conditions.",
    "high prices encouraging producers to supply a greater quantity.",
    "the price distributing a scarce good to the buyers most willing and able to pay.",
    "the government setting prices to guide the market.",
  ]),
  mc(36, "The incentive function of the price mechanism refers to:", [
    "higher prices motivating producers to expand output and encouraging consumers to economise on the good.",
    "prices carrying information about scarcity and shortages.",
    "the price distributing a limited quantity among competing buyers.",
    "prices being fixed in advance by producers.",
  ]),
  mc(37, "The rationing function of the price mechanism refers to:", [
    "the price distributing a limited supply of a good to the buyers most willing and able to pay for it.",
    "prices signalling changes in market conditions to participants.",
    "higher prices motivating firms to produce more.",
    "the government allocating goods during a shortage.",
  ]),
  mc(38, "When a market has a shortage, the price mechanism restores equilibrium by:", [
    "the price rising, which contracts the quantity demanded and expands the quantity supplied.",
    "the price rising, which shifts the demand curve to the left.",
    "the price falling, which expands the quantity demanded.",
    "the supply curve shifting to the right on its own.",
  ], D_SHORTAGE),
  mc(39, "The diagram shows the supply curve shifting from S₁ to S₂. Which of the following could have caused this shift?", [
    "An improvement in production technology.",
    "A rise in the price of a key raw material.",
    "A new per-unit tax on producers.",
    "Several firms leaving the industry.",
  ], D_SINC),
  mc(40, "The diagram shows the demand curve shifting from D₁ to D₂. Which of the following could have caused this shift?", [
    "A rise in the price of a substitute good.",
    "A fall in consumer incomes, where the good is normal.",
    "An improvement in the technology used to produce the good.",
    "A new per-unit tax imposed on producers.",
  ], D_DINC),
];

// --------------------------------------------------------------------------
// Curve-shift short answer — s01..s40 (each shows D_BASE)
// --------------------------------------------------------------------------

const ASK2 =
  "Using the diagram, state which curve shifts and in which direction, and explain why.";
const ASK3 =
  "Using the diagram, state which curve shifts and in which direction, explain why, and describe the effect on the equilibrium price and quantity.";

const shiftQuestions: ShortQuestion[] = [
  shiftQ(1, 3, `The diagram shows the market for restaurant meals. A sustained rise in household incomes occurs, and restaurant meals are a normal good.\n${ASK3}`),
  shiftQ(2, 3, `The diagram shows the market for domestic airline flights. The price of petrol, a major cost for airlines, falls sharply.\n${ASK3}`),
  shiftQ(3, 3, `The diagram shows the market for beef. A health campaign persuades many consumers to eat less red meat.\n${ASK3}`),
  shiftQ(4, 3, `The diagram shows the market for coffee. The price of tea, a substitute, rises significantly.\n${ASK3}`),
  shiftQ(5, 3, `The diagram shows the market for solar panels. A new manufacturing technology substantially lowers production costs.\n${ASK3}`),
  shiftQ(6, 3, `The diagram shows the market for new cars. The government introduces a large subsidy paid to car manufacturers for each vehicle produced.\n${ASK3}`),
  shiftQ(7, 3, `The diagram shows the market for wheat. A prolonged drought destroys a large share of the crop.\n${ASK3}`),
  shiftQ(8, 3, `The diagram shows the market for petrol. Consumers come to expect petrol prices to rise sharply next week.\n${ASK3}`),
  shiftQ(9, 3, `The diagram shows the market for bottled water in a fast-growing city. The city's population increases rapidly.\n${ASK3}`),
  shiftQ(10, 3, `The diagram shows the market for printed newspapers. Consumer tastes shift strongly towards reading news online.\n${ASK3}`),
  shiftQ(11, 3, `The diagram shows the market for milk. The wage paid to dairy workers rises considerably.\n${ASK3}`),
  shiftQ(12, 3, `The diagram shows the market for cinema tickets. The price of home streaming subscriptions, a substitute, falls sharply.\n${ASK3}`),
  shiftQ(13, 3, `The diagram shows the market for electric cars. Several new manufacturers enter the industry.\n${ASK3}`),
  shiftQ(14, 3, `The diagram shows the market for sugary soft drinks. The government imposes a new per-litre tax on producers.\n${ASK3}`),
  shiftQ(15, 3, `The diagram shows the market for umbrellas. A long spell of wet weather is forecast and consumers rush to buy.\n${ASK3}`),
  shiftQ(16, 3, `The diagram shows the market for tinned tuna, an inferior good for most consumers. A sustained rise in household incomes occurs.\n${ASK3}`),
  shiftQ(17, 3, `The diagram shows the market for bread. The world price of wheat, the main ingredient, rises steeply.\n${ASK3}`),
  shiftQ(18, 3, `The diagram shows the market for a popular sports shoe. A celebrity endorsement makes the shoe far more fashionable.\n${ASK3}`),
  shiftQ(19, 3, `The diagram shows the market for strawberries. Ideal growing weather produces a bumper crop.\n${ASK3}`),
  shiftQ(20, 3, `The diagram shows the market for petrol-powered lawnmowers. The price of electric lawnmowers, a close substitute, falls sharply.\n${ASK3}`),
  shiftQ(21, 2, `The diagram shows the market for train travel. The government cuts fuel subsidies to bus operators, raising bus fares. Bus travel is a substitute for train travel.\n${ASK2}`),
  shiftQ(22, 2, `The diagram shows the market for hotel rooms in a town. A major music festival is announced for next month.\n${ASK2}`),
  shiftQ(23, 2, `The diagram shows the market for timber. New automated sawmills raise the productivity of timber producers.\n${ASK2}`),
  shiftQ(24, 2, `The diagram shows the market for restaurant meals. A recession causes household incomes to fall.\n${ASK2}`),
  shiftQ(25, 2, `The diagram shows the market for coffee beans. A frost damages plantations in a major producing country.\n${ASK2}`),
  shiftQ(26, 2, `The diagram shows the market for video game consoles. Producers expect to sell them for much more during the December holidays and hold back current supply.\n${ASK2}`),
  shiftQ(27, 2, `The diagram shows the market for butter. The price of margarine, a substitute, rises sharply.\n${ASK2}`),
  shiftQ(28, 2, `The diagram shows the market for tea. The price of coffee, a substitute, falls significantly.\n${ASK2}`),
  shiftQ(29, 2, `The diagram shows the market for bicycles. Steel, a key input, becomes much cheaper.\n${ASK2}`),
  shiftQ(30, 2, `The diagram shows the market for local newspapers. Several publishers close down and leave the industry.\n${ASK2}`),
  shiftQ(31, 2, `The diagram shows the market for beachside apartments. The area is named one of the most desirable places to live and becomes very popular.\n${ASK2}`),
  shiftQ(32, 2, `The diagram shows the market for cigarettes. The government sharply increases the excise tax paid by tobacco producers.\n${ASK2}`),
  shiftQ(33, 2, `The diagram shows the market for fresh flowers. Consumers expect prices to fall after Valentine's Day and delay buying.\n${ASK2}`),
  shiftQ(34, 2, `The diagram shows the market for oranges. A new orchard disease reduces yields across the country.\n${ASK2}`),
  shiftQ(35, 2, `The diagram shows the market for gym memberships. A summer fitness trend makes exercise far more popular.\n${ASK2}`),
  shiftQ(36, 3, `The diagram shows the market for petrol. New oil discoveries and additional refineries increase the number of suppliers.\n${ASK3}`),
  shiftQ(37, 3, `The diagram shows the market for concert tickets for a band that has just announced it is retiring. Fans believe this is their last chance to see the band live.\n${ASK3}`),
  shiftQ(38, 3, `The diagram shows the market for hamburgers. The price of chicken burgers, a substitute, rises sharply.\n${ASK3}`),
  shiftQ(39, 2, `The diagram shows the market for wool. A rise in electricity prices increases the cost of running wool-processing mills.\n${ASK2}`),
  shiftQ(40, 2, `The diagram shows the market for smartphones. A breakthrough in chip manufacturing greatly lowers the cost of key components.\n${ASK2}`),
];

// --------------------------------------------------------------------------
// Wider Year 11 micro short answer — q01..q20
// --------------------------------------------------------------------------

const microQuestions: ShortQuestion[] = [
  microQ(1, 3, "Explain the signalling function of the price mechanism in a market economy. Use an example."),
  microQ(2, 3, "Explain the incentive function of the price mechanism. Use an example."),
  microQ(3, 3, "Explain the rationing function of the price mechanism. Use an example."),
  microQ(4, 3, "Distinguish between a movement along the demand curve and a shift of the demand curve."),
  microQ(5, 2, "Distinguish between an expansion of supply and an increase in supply."),
  microQ(6, 2, "Distinguish between a contraction of demand and a decrease in demand."),
  microQ(7, 2, "Outline the law of demand."),
  microQ(8, 2, "Outline the law of supply."),
  microQ(9, 3, "Explain two reasons why the demand curve for a good is downward sloping."),
  microQ(10, 2, "Explain why the supply curve for a good is upward sloping."),
  microQ(11, 2, "Define market equilibrium."),
  microQ(12, 3, "Explain how the price mechanism removes a shortage and returns a market to equilibrium."),
  microQ(13, 3, "Explain how the price mechanism removes a surplus and returns a market to equilibrium."),
  microQ(14, 2, "Distinguish between a consumer's want for a good and their effective demand for it."),
  microQ(15, 2, "Distinguish between an individual's demand for a good and the market demand for that good."),
  microQ(16, 2, "Define the price elasticity of demand."),
  microQ(17, 4, "Explain how the degree of necessity of a good and the availability of substitutes each affect its price elasticity of demand."),
  microQ(18, 3, "Explain why a firm selling a good with price-inelastic demand might raise its price to increase total revenue."),
  microQ(19, 3, "Define the price elasticity of supply and explain how the time horizon affects it."),
  microQ(20, 3, "Explain how a competitive market reaching equilibrium contributes to the efficient allocation of resources."),
];

// ==========================================================================
// EXPANSION — movement vs shift, elasticity, government intervention, labour,
// property & commodity markets.
// ==========================================================================

// --- multiple choice, m41..m84 -------------------------------------------

const mcMore: McQuestion[] = [
  // movement along vs shift of a curve
  mc(41, "A café sells more cups of coffee this week only because it cut its price. This is best described as:", [
    "an expansion of demand — a movement down along the demand curve.",
    "an increase in demand — a rightward shift of the demand curve.",
    "a decrease in demand.",
    "a shift of the supply curve.",
  ]),
  mc(42, "Wheat growers supply a larger quantity this season only because the market price of wheat is higher. This is:", [
    "an expansion of supply — a movement up along the supply curve.",
    "an increase in supply — a rightward shift of the supply curve.",
    "a decrease in supply.",
    "a shift of the demand curve.",
  ]),
  mc(43, "During a heatwave, far more beach umbrellas are demanded at every price. This is:", [
    "an increase in demand — a rightward shift of the demand curve.",
    "an expansion of demand — a movement along the demand curve.",
    "a contraction of demand.",
    "a movement along the supply curve.",
  ]),
  mc(44, "A bakery is able to supply more bread at every price after installing a faster oven. This is:", [
    "an increase in supply — a rightward shift of the supply curve.",
    "an expansion of supply — a movement up along the supply curve.",
    "a decrease in supply.",
    "a movement along the demand curve.",
  ]),
  // price elasticity of demand — calculation and concept
  mc(45, "The price of a good rises by 20% and, as a result, the quantity demanded falls by 10%. The price elasticity of demand is:", [
    "0.5 — demand is price-inelastic.",
    "2.0 — demand is price-elastic.",
    "0.5 — demand is price-elastic.",
    "10 — demand is perfectly elastic.",
  ]),
  mc(46, "A 5% fall in the price of a good causes the quantity demanded to rise by 15%. The price elasticity of demand is:", [
    "3 — demand is price-elastic.",
    "0.33 — demand is price-inelastic.",
    "3 — demand is price-inelastic.",
    "1 — demand is unit elastic.",
  ]),
  mc(47, "A good has a price elasticity of demand of 0.4. A 10% increase in its price will change the quantity demanded by about:", [
    "a 4% decrease.",
    "a 4% increase.",
    "a 40% decrease.",
    "a 2.5% decrease.",
  ]),
  mc(48, "Demand for a good is price-inelastic. If the seller raises the price, total revenue (total outlay) will:", [
    "rise, because the percentage fall in quantity is smaller than the percentage rise in price.",
    "fall, because the percentage fall in quantity is larger than the percentage rise in price.",
    "stay the same, because revenue does not depend on elasticity.",
    "fall to zero.",
  ]),
  mc(49, "Demand for a good is price-elastic. If the seller raises the price, total revenue will:", [
    "fall, because the percentage fall in quantity is larger than the percentage rise in price.",
    "rise, because higher prices always raise revenue.",
    "stay the same.",
    "rise, because demand is elastic.",
  ]),
  mc(50, "If the price elasticity of demand for a good is exactly 1 (unit elastic), a change in its price will leave total revenue:", [
    "unchanged.",
    "higher.",
    "lower.",
    "at zero.",
  ]),
  mc(51, "Which good is likely to have the most price-inelastic demand?", [
    "Insulin for a person with diabetes.",
    "One particular brand of bottled water among many.",
    "Restaurant meals.",
    "Overseas holidays.",
  ]),
  mc(52, "The demand for a good tends to be more price-elastic when:", [
    "it has many close substitutes.",
    "it is a necessity with no substitutes.",
    "it takes up a very small share of the consumer's budget.",
    "consumers must decide immediately, with no time to adjust.",
  ]),
  mc(53, "The demand for petrol is price-inelastic in the short run mainly because:", [
    "there are few substitutes and most drivers cannot quickly change how much they drive.",
    "petrol takes up a large share of household income.",
    "there are many close substitutes for petrol.",
    "consumers have plenty of time to adjust their behaviour.",
  ]),
  // price elasticity of supply
  mc(54, "The price of a good rises by 10% and the quantity supplied rises by 4%. The price elasticity of supply is:", [
    "0.4 — supply is price-inelastic.",
    "2.5 — supply is price-elastic.",
    "0.4 — supply is price-elastic.",
    "6 — supply is perfectly elastic.",
  ]),
  mc(55, "Supply of a good tends to be more price-elastic when:", [
    "firms have spare (excess) capacity and a longer time to respond.",
    "the good is perishable and cannot be stored.",
    "the factors of production are hard to move into the industry.",
    "the time period considered is very short.",
  ]),
  mc(56, "The supply of most agricultural crops is price-inelastic in the short run because:", [
    "it takes a full growing season to change how much is planted and harvested.",
    "farmers can instantly grow more when the price rises.",
    "there are many substitutes for each crop.",
    "crops can be stored indefinitely at no cost.",
  ]),
  // government intervention
  mc(57, "A government sets a price ceiling (maximum price) below the equilibrium price. The result is:", [
    "a shortage — the quantity demanded exceeds the quantity supplied.",
    "a surplus — the quantity supplied exceeds the quantity demanded.",
    "the market clears at the ceiling price.",
    "an increase in supply.",
  ], D_CEILING),
  mc(58, "A government sets a price floor (minimum price) above the equilibrium price. The result is:", [
    "a surplus — the quantity supplied exceeds the quantity demanded.",
    "a shortage — the quantity demanded exceeds the quantity supplied.",
    "the market clears at the floor price.",
    "a decrease in demand.",
  ], D_FLOOR),
  mc(59, "A binding price ceiling on rents (rent control) is most likely to:", [
    "create a shortage of rental housing, as landlords supply less and tenants demand more.",
    "eliminate the shortage of rental housing.",
    "increase the quantity of rental housing supplied.",
    "have no effect on the rental market.",
  ]),
  mc(60, "A per-unit (indirect) tax imposed on the producers of a good will:", [
    "shift the supply curve upward/left by the amount of the tax, raising the price and reducing the quantity traded.",
    "shift the demand curve left.",
    "shift the supply curve right, lowering the price.",
    "leave the equilibrium price and quantity unchanged.",
  ], D_TAX),
  mc(61, "After a per-unit tax on producers, the burden (incidence) of the tax falls mainly on consumers when demand is:", [
    "relatively price-inelastic.",
    "relatively price-elastic.",
    "perfectly elastic.",
    "unrelated to who bears the tax.",
  ]),
  mc(62, "A per-unit subsidy paid to the producers of a good will most likely change its equilibrium price and quantity in which way?", [
    "Price falls and quantity rises.",
    "Price rises and quantity falls.",
    "Price rises and quantity rises.",
    "Price falls and quantity falls.",
  ], D_SUBSIDY),
  mc(63, "Which of the following is an example of an indirect tax in Australia?", [
    "The Goods and Services Tax (GST).",
    "Personal income tax.",
    "Company tax on profits.",
    "The Medicare levy on taxable income.",
  ]),
  mc(64, "A government might impose a price floor on an agricultural product in order to:", [
    "support and stabilise farmers' incomes above the level the free market would give.",
    "make the product cheaper for consumers.",
    "create a shortage of the product.",
    "reduce the incomes of farmers.",
  ]),
  mc(65, "One likely unintended consequence of a price ceiling set below the equilibrium price is:", [
    "a persistent shortage, with non-price rationing such as queues or waiting lists.",
    "a persistent surplus that the government must buy up.",
    "an increase in the quantity supplied.",
    "the price rising above the equilibrium price.",
  ]),
  mc(66, "A government subsidy for producers of a good, funded from taxation, will tend to:", [
    "increase the quantity produced and consumed beyond the free-market level.",
    "reduce the quantity produced and consumed.",
    "have no effect on the quantity traded.",
    "raise the price paid by consumers.",
  ]),
  // labour markets
  mc(67, "In the labour market:", [
    "households supply labour and businesses demand labour.",
    "households demand labour and businesses supply labour.",
    "the government supplies all labour.",
    "labour is neither demanded nor supplied.",
  ], LAB_BASE),
  mc(68, "The demand for labour is a 'derived demand', meaning it depends on:", [
    "the demand for the goods and services that the labour is used to produce.",
    "the number of people who want to work.",
    "the minimum wage set by the government.",
    "the age of the workers.",
  ]),
  mc(69, "A minimum wage set above the equilibrium wage in a labour market will most likely cause:", [
    "a surplus of labour (unemployment) — the quantity of labour supplied exceeds the quantity demanded.",
    "a shortage of labour — the quantity demanded exceeds the quantity supplied.",
    "the labour market to clear at the minimum wage.",
    "an increase in the demand for labour.",
  ], LAB_MINWAGE),
  mc(70, "A skill shortage in an occupation means that, at the current wage:", [
    "the quantity of labour demanded exceeds the quantity supplied, so wages tend to rise.",
    "the quantity of labour supplied exceeds the quantity demanded, so wages tend to fall.",
    "the labour market is in equilibrium.",
    "there is no demand for that type of labour.",
  ], LAB_SHORTAGE),
  mc(71, "Which of the following would increase the demand for labour in an industry?", [
    "A rise in consumer demand for the industry's output.",
    "A rise in the wage the industry must pay.",
    "A fall in the productivity of workers.",
    "An increase in the number of people qualified to do the work.",
  ], LAB_DINC),
  mc(72, "Which of the following would increase the supply of labour to a particular occupation?", [
    "More people gaining the qualifications the occupation requires.",
    "A fall in the wage paid relative to other occupations.",
    "A fall in the demand for the goods the occupation produces.",
    "An increase in the productivity of those workers.",
  ], LAB_SINC),
  mc(73, "Firms in an industry replace many workers with automated machinery. In that labour market this will most likely:", [
    "decrease the demand for labour, lowering the equilibrium wage and level of employment.",
    "increase the demand for labour, raising the equilibrium wage.",
    "increase the supply of labour.",
    "have no effect on wages or employment.",
  ], LAB_DDEC),
  mc(74, "The equilibrium wage in a competitive labour market is the wage at which:", [
    "the quantity of labour demanded equals the quantity of labour supplied.",
    "every worker is paid the same as every other worker.",
    "the government sets the award rate.",
    "firms make the largest possible profit regardless of workers.",
  ], LAB_BASE),
  // property & commodity markets
  mc(75, "The supply of established housing is relatively price-inelastic because:", [
    "new dwellings take a long time to build and the existing stock is large and slow to change.",
    "there are many close substitutes for housing.",
    "houses can be produced instantly when prices rise.",
    "housing takes up only a small share of household budgets.",
  ], HOUSE_BASE),
  mc(76, "Rapid population growth in a city, where the supply of housing responds only slowly, will most likely:", [
    "push house prices up sharply, with only a small rise in the quantity of housing.",
    "push house prices down, with a large rise in the quantity of housing.",
    "leave house prices and quantity unchanged.",
    "reduce the demand for housing.",
  ], HOUSE_DINC),
  mc(77, "Tax concessions such as negative gearing, which make housing a more attractive investment, tend to:", [
    "increase the demand for housing and put upward pressure on house prices.",
    "increase the supply of housing and lower house prices.",
    "decrease the demand for housing.",
    "have no effect on the housing market.",
  ], HOUSE_DINC),
  mc(78, "Australian commodity prices, such as the price of iron ore, tend to be more volatile than the prices of manufactured goods because:", [
    "demand can change quickly (e.g. with Chinese growth) while supply is slow to adjust, and both are relatively price-inelastic.",
    "commodities have many close substitutes.",
    "commodity supply can be changed instantly.",
    "commodity demand never changes.",
  ]),
  mc(79, "A sharp slowdown in Chinese construction reduces demand for Australian iron ore. In the iron ore market this will most likely:", [
    "lower both the price and the quantity of iron ore sold.",
    "raise both the price and the quantity sold.",
    "raise the price and lower the quantity.",
    "leave the market unchanged.",
  ]),
  mc(80, "A government planning reform allows a large number of new apartments to be built quickly in a city. In the housing market this will most likely:", [
    "increase supply and put downward pressure on prices and rents.",
    "decrease supply and raise prices.",
    "increase demand and raise prices.",
    "have no effect on prices.",
  ], HOUSE_SINC),
  mc(81, "House prices in Australian capital cities have risen faster than incomes over recent decades mainly because:", [
    "strong demand (population growth, investor concessions, low interest rates) has met a slow, inelastic supply response.",
    "the supply of housing has grown much faster than demand.",
    "demand for housing has fallen.",
    "the government has fixed house prices by law.",
  ]),
  mc(82, "A large mining company brings a major new iron ore mine into production. All else equal, in the world iron ore market this will:", [
    "increase supply, putting downward pressure on the price.",
    "decrease supply, raising the price.",
    "increase demand, raising the price.",
    "have no effect on price or quantity.",
  ]),
  mc(83, "Which best explains why a fall in interest rates tends to raise house prices?", [
    "Lower borrowing costs increase the demand for housing, and supply is slow to respond.",
    "Lower interest rates increase the supply of housing.",
    "Lower interest rates reduce the demand for housing.",
    "Interest rates have no link to the housing market.",
  ], HOUSE_DINC),
  mc(84, "A price floor (minimum price) is only effective (binding) if it is set:", [
    "above the market equilibrium price.",
    "below the market equilibrium price.",
    "exactly at the equilibrium price.",
    "at any level — it always changes the market.",
  ], D_FLOOR),
];

// ==========================================================================
// SECOND EXPANSION — doubling the bank: movement/shift, equilibrium & shifts,
// elasticity, government intervention, labour, property & commodity markets.
// ==========================================================================

// --- multiple choice, m85..m168 (14 per sub-topic) -----------------------

const mcMore2: McQuestion[] = [
  // movement along vs shift of a curve — m85..m98
  mc(85, "A cinema reduces its ticket price for Tuesday screenings only, and more tickets are sold on Tuesdays as a result. This is:", [
    "an expansion of demand — a movement down along the demand curve.",
    "an increase in demand — a rightward shift of the demand curve.",
    "a decrease in demand — a leftward shift of the demand curve.",
    "a contraction of demand — a movement up along the demand curve.",
  ]),
  mc(86, "Ice-cream sales rise on hot days at the same price as always, because more people want ice-cream in the heat. This is:", [
    "an increase in demand — a rightward shift of the demand curve.",
    "an expansion of demand — a movement down along the demand curve.",
    "a decrease in demand — a leftward shift of the demand curve.",
    "an increase in supply — a rightward shift of the supply curve.",
  ]),
  mc(87, "A rise in the price of tablet computers reduces the quantity of tablets bought, with nothing else changing. This is:", [
    "a contraction of demand — a movement up along the demand curve.",
    "a decrease in demand — a leftward shift of the demand curve.",
    "an expansion of demand — a movement down along the demand curve.",
    "an increase in demand — a rightward shift of the demand curve.",
  ]),
  mc(88, "A factory works overtime and produces more steel only because the price of steel has risen. This is:", [
    "an expansion of supply — a movement up along the supply curve.",
    "an increase in supply — a rightward shift of the supply curve.",
    "a decrease in supply — a leftward shift of the supply curve.",
    "a contraction of supply — a movement down along the supply curve.",
  ]),
  mc(89, "A new regulation requires expensive safety equipment in coal mines, raising the cost of extracting coal. In the coal market this is:", [
    "a decrease in supply — the supply curve shifts to the left.",
    "an increase in supply — the supply curve shifts to the right.",
    "a contraction of supply — a movement down along the supply curve.",
    "a decrease in demand — the demand curve shifts to the left.",
  ]),
  mc(90, "Rising household incomes lead more families to dine out. Restaurant meals are a normal good. This is:", [
    "an increase in demand — the demand curve shifts to the right.",
    "a decrease in demand — the demand curve shifts to the left.",
    "an expansion of demand — a movement down along the demand curve.",
    "an increase in supply — the supply curve shifts to the right.",
  ]),
  mc(91, "As incomes rise, fewer people buy home-brand (budget) groceries, an inferior good. This is:", [
    "a decrease in demand — the demand curve shifts to the left.",
    "an increase in demand — the demand curve shifts to the right.",
    "a contraction of demand — a movement up along the demand curve.",
    "a decrease in supply — the supply curve shifts to the left.",
  ]),
  mc(92, "Games consoles and game cartridges are complements. A big fall in the price of consoles will most likely:", [
    "increase the demand for cartridges — a rightward shift of the demand curve.",
    "decrease the demand for cartridges — a leftward shift of the demand curve.",
    "cause an expansion of demand for cartridges along its curve only.",
    "increase the supply of cartridges.",
  ]),
  mc(93, "Bus and train travel are substitutes. A rise in train fares will most likely:", [
    "increase the demand for bus travel — a rightward shift of the demand curve.",
    "decrease the demand for bus travel — a leftward shift of the demand curve.",
    "cause an expansion of demand for bus travel along its curve only.",
    "increase the supply of buses.",
  ]),
  mc(94, "Consumers expect a new phone model to be released soon at a lower price than the current model. Current demand for the existing model will most likely:", [
    "decrease now, as consumers wait for the cheaper new model.",
    "increase now.",
    "cause an expansion of demand for the current model.",
    "shift the supply curve for the current model to the right.",
  ]),
  mc(95, "A large number of overseas students arrive to study in a city. In the market for share-house rentals, this will most likely:", [
    "increase the demand for share-house rentals — a rightward shift of the demand curve.",
    "decrease the demand for share-house rentals — a leftward shift of the demand curve.",
    "cause an expansion of demand along the existing curve only.",
    "increase the supply of share-house rentals.",
  ]),
  mc(96, "A new automated packing line lowers the unit cost of bottling soft drinks. In that market, supply will:", [
    "increase — the supply curve shifts to the right.",
    "decrease — the supply curve shifts to the left.",
    "cause an expansion of supply along the existing curve only.",
    "increase the demand for soft drinks.",
  ]),
  mc(97, "Many new cafés open in a suburb that previously had only one. Market supply of coffee in that suburb will:", [
    "increase — the supply curve shifts to the right.",
    "decrease — the supply curve shifts to the left.",
    "cause a contraction of supply along the existing curve only.",
    "increase the demand for coffee.",
  ]),
  mc(98, "Wine producers expect the price of wine to rise substantially after ageing it for another year. Their current supply to the market will most likely:", [
    "decrease now, as they withhold stock to sell later at the higher price.",
    "increase now.",
    "cause a contraction of supply along the existing curve only.",
    "increase the demand for wine.",
  ]),
  // equilibrium & the effect of shifts — m99..m112
  mc(99, "In a competitive market, if the price is temporarily above equilibrium, market forces will:", [
    "push the price down towards equilibrium, because a surplus exists.",
    "push the price up further, because a shortage exists.",
    "leave the price unchanged indefinitely.",
    "cause the demand curve to shift left permanently.",
  ], D_SURPLUS),
  mc(100, "In a competitive market, if the price is temporarily below equilibrium, market forces will:", [
    "push the price up towards equilibrium, because a shortage exists.",
    "push the price down further, because a surplus exists.",
    "leave the price unchanged indefinitely.",
    "cause the supply curve to shift right permanently.",
  ], D_SHORTAGE),
  mc(101, "Demand for a good increases while supply decreases at the same time. The equilibrium price will:", [
    "definitely rise, but the effect on quantity traded depends on the relative size of the two shifts.",
    "definitely rise, and quantity will definitely rise too.",
    "definitely fall.",
    "stay the same, because the two shifts cancel out.",
  ]),
  mc(102, "Demand for a good decreases while supply increases at the same time. The equilibrium price will:", [
    "definitely fall, but the effect on quantity traded depends on the relative size of the two shifts.",
    "definitely fall, and quantity will definitely fall too.",
    "definitely rise.",
    "stay the same, because the two shifts cancel out.",
  ]),
  mc(103, "Demand and supply both increase at the same time. The equilibrium quantity will:", [
    "definitely rise, but the effect on price depends on the relative size of the two shifts.",
    "definitely rise, and price will definitely rise too.",
    "definitely fall.",
    "stay the same, because the two shifts cancel out.",
  ]),
  mc(104, "Demand and supply both decrease at the same time. The equilibrium quantity will:", [
    "definitely fall, but the effect on price depends on the relative size of the two shifts.",
    "definitely fall, and price will definitely fall too.",
    "definitely rise.",
    "stay the same, because the two shifts cancel out.",
  ]),
  mc(105, "Which of the following guarantees that both the equilibrium price and the equilibrium quantity rise?", [
    "An increase in demand, with the supply curve unchanged.",
    "An increase in supply, with the demand curve unchanged.",
    "An increase in demand together with a decrease in supply.",
    "A decrease in demand together with an increase in supply.",
  ]),
  mc(106, "Which of the following would cause the equilibrium price to rise but the equilibrium quantity to fall?", [
    "A decrease in supply, with demand unchanged.",
    "An increase in demand, with supply unchanged.",
    "An increase in supply, with demand unchanged.",
    "A decrease in demand, with supply unchanged.",
  ], D_BASE),
  mc(107, "A new health study makes a food more popular (demand rises) at the same time as a bumper harvest boosts its supply. Compared with before, the equilibrium quantity will:", [
    "definitely rise, while the effect on price is ambiguous without knowing the relative size of the shifts.",
    "definitely rise, and price will definitely rise too.",
    "definitely fall.",
    "stay exactly the same.",
  ]),
  mc(108, "If the current market price is exactly at equilibrium and nothing else changes, we would expect:", [
    "the price to remain stable, since the quantity demanded equals the quantity supplied.",
    "a surplus to build up over time.",
    "a shortage to build up over time.",
    "the price to keep rising indefinitely.",
  ], D_BASE),
  mc(109, "A council bans the sale of a close substitute good in a market. In the original good's market, this will most likely cause the equilibrium price and quantity to:", [
    "both rise, as demand for the original good increases.",
    "both fall.",
    "price to rise and quantity to fall.",
    "price to fall and quantity to rise.",
  ]),
  mc(110, "New research finds a popular food to be harmful, reducing demand for it, while separately a drought reduces its supply. The equilibrium quantity will:", [
    "definitely fall, while the effect on price is ambiguous without knowing the relative size of the shifts.",
    "definitely fall, and price will definitely fall too.",
    "definitely rise.",
    "stay exactly the same.",
  ]),
  mc(111, "Which of the following is certain when demand increases and supply also increases, regardless of the relative size of the shifts?", [
    "The equilibrium quantity rises.",
    "The equilibrium price rises.",
    "The equilibrium price falls.",
    "Both price and quantity are certain to rise.",
  ]),
  mc(112, "Which of the following is certain when demand decreases and supply increases, regardless of the relative size of the shifts?", [
    "The equilibrium price falls.",
    "The equilibrium quantity falls.",
    "The equilibrium quantity rises.",
    "Both price and quantity are certain to fall.",
  ]),
  // price elasticity of demand & supply — m113..m126
  mc(113, "The price of a good falls by 8% and the quantity demanded rises by 20%. The price elasticity of demand is:", [
    "2.5 — demand is price-elastic.",
    "0.4 — demand is price-inelastic.",
    "2.5 — demand is price-inelastic.",
    "12 — demand is perfectly elastic.",
  ]),
  mc(114, "The price of a good rises by 15% and the quantity demanded falls by 3%. The price elasticity of demand is:", [
    "0.2 — demand is price-inelastic.",
    "5 — demand is price-elastic.",
    "0.2 — demand is price-elastic.",
    "18 — demand is perfectly elastic.",
  ]),
  mc(115, "A good has many close substitutes and takes up a large share of a consumer's budget. Its demand will most likely be:", [
    "price-elastic.",
    "price-inelastic.",
    "unit elastic.",
    "perfectly inelastic.",
  ]),
  mc(116, "Which of these goods is likely to have the most price-elastic demand?", [
    "A particular brand of soft drink, among many available brands.",
    "Petrol.",
    "Tap water.",
    "A prescription medicine with no substitute.",
  ]),
  mc(117, "A firm cuts its price and its total revenue falls as a result. Demand for its product must be:", [
    "price-inelastic.",
    "price-elastic.",
    "unit elastic.",
    "perfectly elastic.",
  ]),
  mc(118, "A firm raises its price and its total revenue rises as a result. Demand for its product must be:", [
    "price-inelastic.",
    "price-elastic.",
    "unit elastic.",
    "perfectly elastic.",
  ]),
  mc(119, "The price of a good rises by 8% and the quantity supplied rises by 20%. The price elasticity of supply is:", [
    "2.5 — supply is price-elastic.",
    "0.4 — supply is price-inelastic.",
    "2.5 — supply is price-inelastic.",
    "12 — supply is perfectly elastic.",
  ]),
  mc(120, "The price of a good falls by 12% and the quantity supplied falls by 3%. The price elasticity of supply is:", [
    "0.25 — supply is price-inelastic.",
    "4 — supply is price-elastic.",
    "0.25 — supply is price-elastic.",
    "9 — supply is perfectly elastic.",
  ]),
  mc(121, "Supply of a perishable good such as fresh fish is likely to be price-inelastic mainly because:", [
    "it cannot be stored, so the quantity available on a given day is largely fixed regardless of price.",
    "it has many close substitutes.",
    "producers can catch unlimited extra fish the moment the price rises.",
    "demand for fresh fish never changes.",
  ]),
  mc(122, "In the very short run (the 'momentary' period), the price elasticity of supply of most goods is close to:", [
    "perfectly inelastic — the quantity supplied is essentially fixed and cannot respond to price.",
    "perfectly elastic — any quantity can be supplied at the going price.",
    "exactly 1 — unit elastic.",
    "always greater than 1.",
  ]),
  mc(123, "The government imposes a tax on a good with perfectly inelastic demand, such as a life-saving medicine with no substitutes. The tax will most likely be:", [
    "passed on almost entirely to consumers, who continue to buy the same quantity.",
    "paid almost entirely by producers, because consumers refuse to pay more.",
    "split exactly evenly between consumers and producers in every case.",
    "avoided entirely, because inelastic demand goods cannot be taxed.",
  ]),
  mc(124, "The government imposes a tax on a good with highly elastic demand. Most of the tax burden will fall on:", [
    "producers, because consumers can easily switch away if the price rises much.",
    "consumers, who have no choice but to keep buying.",
    "the government itself.",
    "no one — elastic-demand goods cannot be taxed.",
  ]),
  mc(125, "Which pairing correctly matches a good with its likely price elasticity of demand?", [
    "Bread (a necessity) — inelastic; overseas cruises (a luxury) — elastic.",
    "Bread — elastic; overseas cruises — inelastic.",
    "Both bread and overseas cruises have inelastic demand.",
    "Both bread and overseas cruises have elastic demand.",
  ]),
  mc(126, "Compared with the short run, the price elasticity of demand for petrol in the long run is:", [
    "higher (more elastic), because consumers can switch to more fuel-efficient cars or alternatives over time.",
    "lower (more inelastic), because habits become fixed over time.",
    "unchanged — elasticity does not depend on the time period.",
    "perfectly inelastic in the long run.",
  ]),
  // government intervention — m127..m140
  mc(127, "A binding price ceiling on bread during a famine is intended to keep bread affordable. A likely side effect is:", [
    "producers supply less bread at the low price, worsening the shortage.",
    "producers supply more bread, ending the shortage.",
    "the price rises above the ceiling to clear the market.",
    "demand for bread falls to meet the available supply.",
  ], D_CEILING),
  mc(128, "To make petrol more affordable, a government sets a maximum retail price for petrol below the market price. The most likely result is:", [
    "petrol stations run short of stock and queues form, as a shortage develops.",
    "petrol stations end up with unsold surplus fuel.",
    "the market clears normally at the maximum price.",
    "supply of petrol increases to match the higher demand.",
  ], D_CEILING),
  mc(129, "A government grant helps first-home buyers pay more for a home. Because housing supply is slow to adjust, this policy will most likely:", [
    "increase demand for housing and mostly raise prices rather than the quantity of housing.",
    "increase supply of housing and lower prices.",
    "decrease demand for housing.",
    "have no effect on house prices.",
  ], HOUSE_DINC),
  mc(130, "A minimum price is set for milk paid to dairy farmers, above the market equilibrium. To prevent a build-up of unsold milk, the government would need to:", [
    "buy up and store (or otherwise dispose of) the resulting surplus.",
    "do nothing, since the surplus disappears on its own.",
    "let the price fall to clear the market, which removes the floor's effect.",
    "lower the floor below the equilibrium price.",
  ], D_FLOOR),
  mc(131, "A 'luxury car tax' is a per-unit tax on the sale of expensive cars. In that market this will:", [
    "decrease supply, raising the price paid by buyers and reducing the number of luxury cars sold.",
    "increase supply, lowering the price paid by buyers.",
    "leave the equilibrium price and quantity unchanged.",
    "decrease demand for luxury cars directly.",
  ], D_TAX),
  mc(132, "The alcohol excise is a per-unit tax on alcoholic drinks. One argument for keeping such a tax high is that it:", [
    "reduces the quantity consumed by raising the price, discouraging a good with negative health effects.",
    "increases the quantity consumed by lowering the price.",
    "has no effect on the price or quantity of alcohol sold.",
    "is paid entirely by the government, not consumers or producers.",
  ]),
  mc(133, "A government exempts basic food items from the GST while other goods remain taxed. Removing the GST from these items is intended to:", [
    "keep their price lower for consumers, since supply does not shift left as it would with a tax.",
    "raise their price for consumers.",
    "decrease the quantity of these foods produced.",
    "have no effect on the price consumers pay.",
  ]),
  mc(134, "A city imposes rent control (a binding price ceiling) on established apartments. Over time this is most likely to:", [
    "discourage investment in new rental housing, worsening the long-run shortage.",
    "encourage landlords to build much more rental housing.",
    "cause rents to fall to zero.",
    "have no long-run effect on the rental market.",
  ], D_CEILING),
  mc(135, "A per-unit subsidy differs from a price floor because a subsidy:", [
    "lowers the price paid by consumers while still raising the return to producers, whereas a price floor raises the price paid by consumers.",
    "raises the price paid by consumers, just like a price floor does.",
    "is paid by consumers directly to producers.",
    "always creates a shortage, unlike a price floor.",
  ], D_SUBSIDY),
  mc(136, "A government sets a price ceiling exactly equal to the equilibrium price. The effect on the market will be:", [
    "none — the ceiling is not binding because the market already trades at that price.",
    "a shortage develops immediately.",
    "a surplus develops immediately.",
    "the quantity traded doubles.",
  ], D_BASE),
  mc(137, "A price floor set below the equilibrium price will:", [
    "have no effect, because the market price is already above the (non-binding) floor.",
    "create a large surplus.",
    "create a large shortage.",
    "force the price down to the floor.",
  ], D_BASE),
  mc(138, "Which of these is most likely to be funded through general taxation and paid to producers to lower their costs?", [
    "A subsidy.",
    "A price floor.",
    "A price ceiling.",
    "An indirect tax.",
  ], D_SUBSIDY),
  mc(139, "A sugar tax on soft-drink manufacturers is an example of:", [
    "a per-unit indirect tax intended to raise the price and reduce the quantity of sugary drinks consumed.",
    "a subsidy intended to lower the price of sugary drinks.",
    "a price ceiling on sugary drinks.",
    "a price floor on sugary drinks.",
  ], D_TAX),
  mc(140, "Which combination correctly matches an intervention with who directly pays the government?", [
    "Indirect tax — producers pay the tax to the government; subsidy — the government pays producers.",
    "Indirect tax — the government pays producers; subsidy — producers pay the government.",
    "Both a tax and a subsidy involve producers paying the government.",
    "Neither a tax nor a subsidy involves any payment to or from the government.",
  ]),
  // labour markets — m141..m154
  mc(141, "A boom in the mining industry increases the demand for skilled tradespeople. All else equal, in that labour market this will:", [
    "raise the equilibrium wage and increase employment.",
    "lower the equilibrium wage and reduce employment.",
    "raise the equilibrium wage but reduce employment.",
    "have no effect on the wage or employment.",
  ], LAB_DINC),
  mc(142, "Occupational licensing requires a costly and lengthy qualification to enter a profession. This tends to:", [
    "restrict the supply of labour to that profession, keeping wages higher than they would otherwise be.",
    "increase the supply of labour to that profession.",
    "have no effect on wages in that profession.",
    "lower the equilibrium wage in that profession.",
  ], LAB_SDEC),
  mc(143, "Low geographic mobility of labour (workers unwilling or unable to move to where jobs are) tends to:", [
    "slow the adjustment of wages and employment across regional labour markets.",
    "make wages equalise instantly across all regions.",
    "have no effect on regional labour markets.",
    "increase the supply of labour in every region equally.",
  ]),
  mc(144, "An ageing population reduces the number of people of working age. All else equal, this will most likely:", [
    "decrease the supply of labour, raising the equilibrium wage.",
    "increase the supply of labour, lowering the equilibrium wage.",
    "have no effect on the labour market.",
    "decrease the demand for labour.",
  ], LAB_SDEC),
  mc(145, "The rise of the 'gig economy' (e.g. food delivery apps) has increased the number of people willing to work flexible, casual hours. This represents:", [
    "an increase in the supply of labour to that kind of work.",
    "a decrease in the supply of labour to that kind of work.",
    "an increase in the demand for that kind of labour.",
    "a decrease in the demand for that kind of labour.",
  ], LAB_SINC),
  mc(146, "A firm's demand for labour depends on the value of what an extra worker adds to output. If a worker's output becomes more valuable (for example, due to higher prices for the firm's product), the firm's demand for labour will:", [
    "increase.",
    "decrease.",
    "stay exactly the same.",
    "become perfectly inelastic.",
  ], LAB_DINC),
  mc(147, "Two occupations require identical skills, but one pays a much higher wage due to unpleasant working conditions. Over time, this wage gap tends to:", [
    "attract workers from the lower-paying occupation, increasing labour supply to the higher-paying one and narrowing the gap.",
    "widen further as no workers ever move between occupations.",
    "have no effect on either labour market.",
    "reduce the supply of labour to the higher-paying occupation.",
  ]),
  mc(148, "A national minimum wage increase is announced. Employers in low-margin industries such as retail and hospitality are most likely to respond by:", [
    "hiring fewer workers or reducing hours, since labour is now relatively more expensive.",
    "hiring more workers immediately.",
    "leaving employment levels completely unchanged.",
    "closing down entirely and immediately.",
  ], LAB_MINWAGE),
  mc(149, "Which of the following would decrease the supply of labour to the nursing profession?", [
    "A fall in nurses' wages relative to other professions requiring similar training.",
    "An increase in the number of nursing training places.",
    "Immigration of qualified nurses into the country.",
    "A rise in nurses' wages.",
  ], LAB_SDEC),
  mc(150, "Which of the following would increase the demand for labour in the construction industry?", [
    "A housing construction boom increasing the demand for new dwellings.",
    "Automation of bricklaying tasks.",
    "A recession reducing building activity.",
    "A rise in construction workers' wages.",
  ], LAB_DINC),
  mc(151, "A shortage of qualified electricians exists in a region. Which of the following would help close this shortage over time?", [
    "More people undertaking electrical apprenticeships, increasing the supply of qualified electricians.",
    "Fewer people undertaking electrical apprenticeships.",
    "A fall in the wage paid to electricians.",
    "A decrease in demand for electrical work.",
  ], LAB_SHORTAGE),
  mc(152, "Which best explains why doctors typically earn more than checkout operators in a competitive labour market?", [
    "The long, costly training required for doctors restricts labour supply relative to strong demand, while checkout work needs little training and has abundant labour supply.",
    "The government sets doctors' pay higher by law.",
    "Checkout operators have a stronger union than doctors.",
    "Doctors work fewer hours than checkout operators.",
  ]),
  mc(153, "A fall in demand for the goods produced by a declining manufacturing industry will, through derived demand, most likely:", [
    "reduce the demand for labour in that industry, lowering wages and employment.",
    "increase the demand for labour in that industry.",
    "have no effect on that industry's labour market.",
    "increase the supply of labour to that industry.",
  ], LAB_DDEC),
  mc(154, "The equilibrium wage and level of employment in a competitive labour market change when:", [
    "either the demand for labour or the supply of labour shifts.",
    "the government simply announces a new award wage.",
    "firms decide to pay more purely out of goodwill.",
    "employment always stays fixed regardless of wages.",
  ], LAB_BASE),
  // property & commodity markets — m155..m168
  mc(155, "A sharp rise in interest rates increases the cost of mortgage repayments. In the housing market this will most likely:", [
    "decrease demand for housing, and because supply is slow to adjust, prices fall more than the quantity of housing does.",
    "increase demand for housing and raise prices.",
    "increase the supply of housing.",
    "have no effect on house prices.",
  ], HOUSE_DDEC),
  mc(156, "Strict zoning laws that limit how many new dwellings can be built in a city tend to:", [
    "make the supply of housing more price-inelastic, so demand-side pressures mainly raise prices rather than the quantity of homes.",
    "make the supply of housing more price-elastic.",
    "have no effect on how supply responds to demand.",
    "guarantee that house prices fall over time.",
  ], HOUSE_BASE),
  mc(157, "A mining boom driven by rising global demand for iron ore raises its price. Companies invest in new mines, but these take years to become productive. In the meantime, supply is:", [
    "price-inelastic, so most of the initial adjustment happens through price rather than quantity.",
    "perfectly elastic, so quantity adjusts immediately.",
    "unaffected by the price rise in any way.",
    "certain to fall as the price rises.",
  ], D_DINC),
  mc(158, "OPEC (a group of oil-exporting countries) agrees to cut its oil production. In the world oil market this will most likely:", [
    "decrease supply, raising the price and lowering the quantity traded.",
    "increase supply, lowering the price.",
    "increase demand for oil.",
    "have no effect on the price of oil.",
  ], D_SDEC),
  mc(159, "A bumper wheat harvest across major exporting countries increases global wheat supply. All else equal, the world price of wheat will most likely:", [
    "fall, as supply increases relative to demand.",
    "rise, as supply increases relative to demand.",
    "stay exactly the same.",
    "become impossible to predict.",
  ], D_SINC),
  mc(160, "Investors who buy property mainly because they expect house prices to keep rising, rather than to live in it, are exercising:", [
    "speculative demand, which adds to demand alongside people who want somewhere to live.",
    "supply, since they eventually sell the property.",
    "derived demand, since housing produces no other good.",
    "no demand at all, since they don't occupy the property.",
  ]),
  mc(161, "A government releases a large amount of new land for housing development on a city's outskirts. All else equal, in the housing market this will:", [
    "increase the supply of housing, easing upward pressure on prices.",
    "decrease the supply of housing.",
    "increase demand for housing, raising prices further.",
    "have no effect on house prices.",
  ], HOUSE_SINC),
  mc(162, "Which of the following best explains why rental vacancy rates tend to fall when population growth outpaces new dwelling construction?", [
    "Demand for rental housing rises faster than supply, so a larger share of the relatively fixed rental stock is occupied.",
    "Landlords choose to leave more properties empty.",
    "Rents fall, discouraging tenants from renting.",
    "The supply of rental housing expands faster than demand.",
  ], HOUSE_DINC),
  mc(163, "The price of a commodity such as copper is more volatile than the price of a manufactured good such as a washing machine mainly because:", [
    "commodity supply cannot expand or contract quickly, so shifts in demand cause large price swings rather than large quantity changes.",
    "commodities have many more close substitutes than manufactured goods.",
    "commodity supply can be adjusted instantly to match demand.",
    "demand for commodities never changes.",
  ]),
  mc(164, "Removing a tax concession that made property investment more attractive would most likely:", [
    "decrease the demand for housing from investors, easing some upward pressure on prices.",
    "increase the demand for housing from investors.",
    "increase the supply of housing immediately.",
    "have no effect on the housing market.",
  ], HOUSE_DDEC),
  mc(165, "A slowdown in global economic growth reduces demand for Australian coal and iron ore. In these commodity markets, this will most likely:", [
    "lower prices, since supply cannot quickly contract to match the fall in demand.",
    "raise prices.",
    "leave prices unchanged.",
    "cause a persistent shortage.",
  ], D_DDEC),
  mc(166, "High-density apartment approvals surge in an inner-city area after a planning reform. Over the following years, this is most likely to:", [
    "increase the supply of housing in that area and moderate price growth compared with areas without the reform.",
    "decrease the supply of housing in that area.",
    "increase demand for housing in that area.",
    "have no effect on prices in that area.",
  ], HOUSE_SINC),
  mc(167, "Long lead times for bringing a new mine into production mean that, in the short run, an unexpected rise in demand for a mineral will mostly:", [
    "raise its price rather than the quantity produced.",
    "raise the quantity produced rather than the price.",
    "leave both price and quantity unchanged.",
    "lower its price.",
  ], D_DINC),
  mc(168, "A 'land banking' practice — where developers hold undeveloped land off the market waiting for prices to rise — tends to:", [
    "restrict the supply of new housing in the short run, adding to upward pressure on prices.",
    "increase the supply of new housing immediately.",
    "have no effect on housing supply.",
    "lower house prices.",
  ], HOUSE_BASE),
];

// --- diagram short answer, s41..s64 ------------------------------------

const GOV3 =
  "Using the diagram, describe the effect on the quantity supplied, the quantity demanded, and whether the market is in a shortage or a surplus.";

const diagramMore: ShortQuestion[] = [
  // government intervention
  shiftQ(41, 3, `The diagram shows the market for rental housing. The government sets a maximum (ceiling) rent Pᶜ below the equilibrium level.\n${GOV3}`, D_CEILING),
  shiftQ(42, 3, `The diagram shows the market for a farm product. The government guarantees farmers a minimum (floor) price Pᶠ above the equilibrium level.\n${GOV3}`, D_FLOOR),
  shiftQ(43, 3, `The diagram shows the market for a good. The government imposes a per-unit (indirect) tax on producers.\nUsing the diagram, describe the effect on the supply curve, the price paid by consumers, and the quantity traded.`, D_TAX),
  shiftQ(44, 3, `The diagram shows the market for a good. The government pays producers a per-unit subsidy.\nUsing the diagram, describe the effect on the supply curve, the price paid by consumers, and the quantity traded.`, D_SUBSIDY),
  shiftQ(45, 3, `The diagram shows the market for petrol during a supply disruption. The government sets a price ceiling Pᶜ below the equilibrium price.\nUsing the diagram, explain two consequences of this policy for the petrol market.`, D_CEILING),
  shiftQ(46, 2, `The diagram shows the market for milk. A guaranteed minimum price Pᶠ is set above equilibrium for dairy farmers.\n${GOV3}`, D_FLOOR),
  shiftQ(47, 3, `The diagram shows the market for cigarettes. The government sharply increases the per-pack excise tax paid by producers.\nUsing the diagram, describe the effect on the equilibrium price and quantity, and explain why a government might want this outcome.`, D_TAX),
  shiftQ(48, 2, `The diagram shows the market for electric vehicles. The government introduces a per-vehicle subsidy paid to manufacturers.\nUsing the diagram, describe the effect on the equilibrium price and quantity.`, D_SUBSIDY),
  shiftQ(49, 2, `The diagram shows a price ceiling Pᶜ set below the equilibrium price.\nUsing the diagram, explain why the shortage persists instead of the price simply rising to clear the market.`, D_CEILING),
  shiftQ(50, 3, `The diagram shows the market for bread. The world price of wheat, the main input, rises steeply.\n${ASK3}`),
  // labour markets
  shiftQ(51, 3, `The diagram shows the market for low-skilled labour. The government sets a minimum wage Wₘ above the equilibrium wage.\nUsing the diagram, describe the effect on the quantity of labour demanded, the quantity supplied, and the level of employment.`, LAB_MINWAGE),
  shiftQ(52, 3, `The diagram shows the labour market for an industry. Consumer demand for the industry's product rises strongly.\nUsing the diagram, describe the effect on the demand for labour, the equilibrium wage, and the level of employment.`, LAB_DINC),
  shiftQ(53, 3, `The diagram shows the labour market for an industry. Firms introduce automation that replaces many workers.\nUsing the diagram, describe the effect on the demand for labour, the equilibrium wage, and the level of employment.`, LAB_DDEC),
  shiftQ(54, 3, `The diagram shows the labour market for an occupation. A large rise in immigration increases the number of people available and willing to do this work.\nUsing the diagram, describe the effect on the supply of labour, the equilibrium wage, and employment.`, LAB_SINC),
  shiftQ(55, 3, `The diagram shows the labour market for an occupation that now requires a long, difficult qualification that few people complete.\nUsing the diagram, describe the effect on the supply of labour, the equilibrium wage, and employment.`, LAB_SDEC),
  shiftQ(56, 3, `The diagram shows a skill shortage: at the current wage W₁ the quantity of labour demanded exceeds the quantity supplied.\nUsing the diagram, explain how this labour market is likely to adjust over time.`, LAB_SHORTAGE),
  shiftQ(57, 2, `The diagram shows the labour market for an industry. A rise in workers' productivity makes each worker more valuable to employers.\nUsing the diagram, describe the effect on the demand for labour and the equilibrium wage.`, LAB_DINC),
  shiftQ(58, 3, `The diagram shows the labour market for a declining industry whose product is falling out of favour with consumers.\nUsing the diagram, describe the effect on the demand for labour, the wage, and employment.`, LAB_DDEC),
  // property & commodity markets
  shiftQ(59, 3, `The diagram shows the market for established housing in a growing city, where supply is price-inelastic. The city's population grows rapidly.\nUsing the diagram, describe the effect on house prices and on the quantity of housing.`, HOUSE_DINC),
  shiftQ(60, 3, `The diagram shows the market for established housing (inelastic supply). Tax concessions such as negative gearing make housing a more attractive investment.\nUsing the diagram, describe the effect on the demand for housing and on house prices.`, HOUSE_DINC),
  shiftQ(61, 2, `The diagram shows the housing market with inelastic supply. A government planning reform allows many more dwellings to be built.\nUsing the diagram, describe the effect on housing supply, prices and quantity.`, HOUSE_SINC),
  shiftQ(62, 3, `The diagram shows the market for Australian iron ore. Strong economic growth in China sharply increases demand, while supply expands only slowly.\nUsing the diagram, describe the effect on the price and quantity of iron ore.`, D_DINC),
  shiftQ(63, 2, `The diagram shows the market for Australian coal exports. A global slowdown reduces demand for coal.\n${ASK2}`),
  shiftQ(64, 3, `The diagram shows the market for established housing (inelastic supply). Interest rates fall sharply, making mortgages cheaper.\nUsing the diagram, describe the effect on the demand for housing, house prices and the quantity of housing.`, HOUSE_DINC),
];

// --- written micro short answer, q21..q40 -----------------------------

const microMore: ShortQuestion[] = [
  // elasticity, total outlay, PES
  microQ(21, 3, "Explain the total outlay (total revenue) method for judging whether the demand for a good is price-elastic or price-inelastic."),
  microQ(22, 3, "A bus company faces price-inelastic demand for its tickets. Using the total outlay method, explain what happens to its total revenue if it raises fares, and why."),
  microQ(23, 3, "The price of a good rises from $4 to $5 and, as a result, the quantity demanded falls from 200 units to 160 units. Calculate the price elasticity of demand and interpret the result."),
  microQ(24, 2, "Define the price elasticity of supply and state the formula used to calculate it."),
  microQ(25, 4, "Explain four factors that influence the price elasticity of supply of a good."),
  microQ(26, 3, "Explain why the demand for a good tends to become more price-elastic the longer the time period considered."),
  microQ(27, 3, "Explain how the price elasticity of demand for its product affects a business's decision about whether to raise or lower its price."),
  microQ(28, 3, "A good has a price elasticity of demand of 2.5. Explain what this figure means and what it implies for the seller's total revenue if the price rises."),
  // government intervention rationale
  microQ(29, 3, "Explain why a government might impose a price ceiling on a good, and one unintended consequence of doing so."),
  microQ(30, 3, "Explain why a government might impose a price floor on a good or on wages, and one unintended consequence of doing so."),
  microQ(31, 4, "Explain how a per-unit indirect tax on producers changes the market for a good, and how the price elasticity of demand affects who bears most of the tax."),
  microQ(32, 3, "Explain how a per-unit subsidy paid to producers affects the price, the quantity traded, and the allocation of resources in a market."),
  // labour markets
  microQ(33, 3, "Explain how the equilibrium wage is determined in a competitive labour market."),
  microQ(34, 3, "Explain how a skill shortage in an occupation is likely to affect wages and employment in that occupation over time."),
  microQ(35, 2, "Distinguish between the supply of labour and the demand for labour."),
  microQ(36, 3, "Explain two factors that affect the supply of labour to a particular occupation."),
  // property & commodity markets
  microQ(37, 3, "Explain why the supply of established housing is relatively price-inelastic, and what this means for house prices when demand rises."),
  microQ(38, 3, "Explain why the prices of commodities such as iron ore and coal tend to be more volatile than the prices of most manufactured goods."),
  microQ(39, 3, "Analyse the effect of rapid population growth on the Australian housing market when the supply of new housing responds only slowly."),
  microQ(40, 2, "Explain one demand-side factor and one supply-side factor that have contributed to rising house prices in Australian cities."),
];

// --- more curve-shift short answer, s65..s96 (general shifts, D_BASE) ---

const shiftQuestions2: ShortQuestion[] = [
  shiftQ(65, 3, `The diagram shows the market for smartphones. A new operating system update makes older smartphone models much less desirable to buyers.\n${ASK3}`),
  shiftQ(66, 3, `The diagram shows the market for movie streaming subscriptions. Cinemas raise their ticket prices sharply, and streaming is a substitute for going to the cinema.\n${ASK3}`),
  shiftQ(67, 3, `The diagram shows the market for avocados. A widely shared health article convinces many more consumers to add avocado to their diet.\n${ASK3}`),
  shiftQ(68, 3, `The diagram shows the market for university textbooks. A much cheaper digital alternative becomes widely available, and many students switch to it instead.\n${ASK3}`),
  shiftQ(69, 3, `The diagram shows the market for ride-share trips. Petrol, a major cost for drivers, rises sharply in price.\n${ASK3}`),
  shiftQ(70, 3, `The diagram shows the market for domestic plane tickets. A second budget airline enters the market on popular routes.\n${ASK3}`),
  shiftQ(71, 3, `The diagram shows the market for chocolate. A poor cocoa harvest in West Africa sharply reduces the world cocoa supply available to chocolate makers.\n${ASK3}`),
  shiftQ(72, 3, `The diagram shows the market for sunscreen. Health authorities launch a major skin-cancer awareness campaign urging people to use more sunscreen.\n${ASK3}`),
  shiftQ(73, 3, `The diagram shows the market for camping gear. Several large camping-gear retailers close down.\n${ASK3}`),
  shiftQ(74, 3, `The diagram shows the market for gaming PCs. A global shortage of computer chips raises the cost of key components.\n${ASK3}`),
  shiftQ(75, 3, `The diagram shows the market for private tutoring services. Anxiety about upcoming HSC exams leads many more students to seek tutoring.\n${ASK3}`),
  shiftQ(76, 3, `The diagram shows the market for one brand of fitness tracker. A rival brand releases a cheaper model with better features.\n${ASK3}`),
  shiftQ(77, 3, `The diagram shows the market for secondhand cars. New car prices rise sharply due to a shortage of new vehicles, and secondhand cars are a substitute.\n${ASK3}`),
  shiftQ(78, 3, `The diagram shows the market for plant-based meat products. Several large supermarket chains stock a much wider range, and improved processing lowers production costs.\n${ASK3}`),
  shiftQ(79, 3, `The diagram shows the market for air conditioners. A run of record-breaking heatwaves is forecast for the coming summer.\n${ASK3}`),
  shiftQ(80, 3, `The diagram shows the market for firewood. A government bans the sale of firewood harvested from native forests, restricting suppliers to plantation timber only.\n${ASK3}`),
  shiftQ(81, 3, `The diagram shows the market for taxi services. Ride-share apps, a substitute, cut their fares significantly.\n${ASK3}`),
  shiftQ(82, 3, `The diagram shows the market for olive oil. A drought across major Mediterranean olive-growing regions sharply reduces the harvest.\n${ASK3}`),
  shiftQ(83, 3, `The diagram shows the market for honey. A disease affecting bee colonies significantly reduces honey production.\n${ASK3}`),
  shiftQ(84, 3, `The diagram shows the market for wool jumpers. A colder-than-usual winter is forecast.\n${ASK3}`),
  shiftQ(85, 3, `The diagram shows the market for tickets to a major music festival. Several headline acts pull out, and the festival becomes far less appealing to fans.\n${ASK3}`),
  shiftQ(86, 3, `The diagram shows the market for e-scooters. A city council approves e-scooter sharing schemes in many new suburbs, greatly increasing the number of firms operating them.\n${ASK3}`),
  shiftQ(87, 2, `The diagram shows the market for coffee pods. A popular brand simplifies its machines so pods from many other brands now fit, increasing the number of pod suppliers.\n${ASK2}`),
  shiftQ(88, 2, `The diagram shows the market for board games. A viral social media trend makes tabletop board games suddenly fashionable.\n${ASK2}`),
  shiftQ(89, 2, `The diagram shows the market for fresh seafood. A prolonged storm season disrupts fishing fleets and reduces the daily catch.\n${ASK2}`),
  shiftQ(90, 2, `The diagram shows the market for hand sanitiser. A new health advisory recommends frequent hand sanitising during flu season.\n${ASK2}`),
  shiftQ(91, 2, `The diagram shows the market for home-delivered meals. Rising delivery-driver wages raise costs for meal-delivery companies.\n${ASK2}`),
  shiftQ(92, 2, `The diagram shows the market for electric bikes. A government rebate scheme is announced but will only start next year, so consumers delay buying now.\n${ASK2}`),
  shiftQ(93, 2, `The diagram shows the market for garden furniture. An unusually warm and sunny spring arrives earlier than expected.\n${ASK2}`),
  shiftQ(94, 2, `The diagram shows the market for paint. A leading manufacturer develops a cheaper synthetic pigment, lowering production costs across the industry.\n${ASK2}`),
  shiftQ(95, 2, `The diagram shows the market for umbrellas after a long drought ends and consistent rain returns to a region.\n${ASK2}`),
  shiftQ(96, 2, `The diagram shows the market for public transport tickets. The price of petrol rises sharply, and driving is a substitute for taking public transport.\n${ASK2}`),
];

// --- more government intervention diagrams, s97..s106 -------------------

const diagramGov2: ShortQuestion[] = [
  shiftQ(97, 3, `The diagram shows the market for a life-saving medicine during a supply disruption. The government sets a price ceiling Pᶜ below the equilibrium price to keep the medicine affordable.\n${GOV3}`, D_CEILING),
  shiftQ(98, 3, `The diagram shows the international market for coffee beans. An international agreement sets a minimum guaranteed price Pᶠ for coffee growers, above the equilibrium price.\n${GOV3}`, D_FLOOR),
  shiftQ(99, 3, `The diagram shows the market for single-use plastic bags. The government imposes a per-bag tax on retailers to discourage their use.\nUsing the diagram, describe the effect on the supply curve, the price paid by consumers, and the quantity traded.`, D_TAX),
  shiftQ(100, 3, `The diagram shows the market for rooftop solar panel installations. The government offers installers a per-unit subsidy to encourage renewable energy uptake.\nUsing the diagram, describe the effect on the supply curve, the price paid by consumers, and the quantity traded.`, D_SUBSIDY),
  shiftQ(101, 2, `The diagram shows the market for hand sanitiser during a pandemic. The government sets a maximum retail price Pᶜ below the rapidly rising equilibrium price.\n${GOV3}`, D_CEILING),
  shiftQ(102, 3, `The diagram shows the market for luxury motor vehicles. The government introduces a luxury car tax, a per-unit tax on producers/importers of expensive vehicles.\nUsing the diagram, describe the effect on the equilibrium price and quantity, and explain why a government might want this outcome.`, D_TAX),
  shiftQ(103, 2, `The diagram shows the market for a staple grain crop. The government sets a guaranteed minimum price Pᶠ for farmers, above the equilibrium price.\n${GOV3}`, D_FLOOR),
  shiftQ(104, 3, `The diagram shows the market for electric vehicles. The government offers manufacturers a per-vehicle subsidy to encourage the transition away from petrol cars.\nUsing the diagram, describe the effect on the supply curve, the price paid by consumers, and the quantity traded.`, D_SUBSIDY),
  shiftQ(105, 3, `The diagram shows the market for rental accommodation in a city experiencing a housing crisis. A newly elected government introduces a strict cap on rents, Pᶜ, below the equilibrium rent.\nUsing the diagram, explain two consequences of this policy for the rental market.`, D_CEILING),
  shiftQ(106, 2, `The diagram shows the market for sugary breakfast cereals. The government proposes a per-unit tax on manufacturers as part of an anti-obesity strategy.\nUsing the diagram, describe the likely effect on the equilibrium price and quantity.`, D_TAX),
];

// --- more labour market diagrams, s107..s117 -----------------------------

const diagramLabour2: ShortQuestion[] = [
  shiftQ(107, 3, `The diagram shows the labour market for food delivery riders. The rise of the gig economy attracts many more people willing to work flexible hours in this role.\nUsing the diagram, describe the effect on the supply of labour, the equilibrium wage, and the level of employment.`, LAB_SINC),
  shiftQ(108, 3, `The diagram shows the labour market for supermarket checkout operators. Widespread adoption of self-service checkouts reduces the number of workers needed.\nUsing the diagram, describe the effect on the demand for labour, the equilibrium wage, and the level of employment.`, LAB_DDEC),
  shiftQ(109, 3, `The diagram shows the labour market for registered nurses. A new skilled-migration agreement makes it easier for qualified overseas nurses to work in Australia.\nUsing the diagram, describe the effect on the supply of labour, the equilibrium wage, and the level of employment.`, LAB_SINC),
  shiftQ(110, 3, `The diagram shows the labour market for mine workers. A new mining project sharply increases the demand for workers willing to work on a fly-in fly-out basis.\nUsing the diagram, describe the effect on the demand for labour, the equilibrium wage, and the level of employment.`, LAB_DINC),
  shiftQ(111, 3, `The diagram shows the labour market for hospitality workers during a period when public health restrictions close many venues.\nUsing the diagram, describe the effect on the demand for labour, the equilibrium wage, and the level of employment.`, LAB_DDEC),
  shiftQ(112, 3, `The diagram shows the labour market for electricians. New, stricter licensing requirements make it harder and more expensive to qualify.\nUsing the diagram, describe the effect on the supply of labour, the equilibrium wage, and the level of employment.`, LAB_SDEC),
  shiftQ(113, 2, `The diagram shows the labour market for data analysts. A popular new university degree greatly increases the number of graduates qualified for this work each year.\nUsing the diagram, describe the effect on the supply of labour and the equilibrium wage.`, LAB_SINC),
  shiftQ(114, 3, `The diagram shows the labour market for junior retail workers. The government raises the national minimum wage well above the current equilibrium wage for this group.\nUsing the diagram, describe the effect on the quantity of labour demanded, the quantity supplied, and the level of employment.`, LAB_MINWAGE),
  shiftQ(115, 3, `The diagram shows the labour market for aged-care workers. At the current wage W₁, far fewer people are willing to do this demanding work than aged-care providers wish to hire.\nUsing the diagram, explain how this labour market is likely to adjust over time.`, LAB_SHORTAGE),
  shiftQ(116, 2, `The diagram shows the labour market for teachers in a rural region. The government introduces a relocation subsidy for teachers who move to rural schools, effectively increasing the number of people willing to work there.\nUsing the diagram, describe the effect on the supply of labour and the equilibrium wage.`, LAB_SINC),
  shiftQ(117, 3, `The diagram shows the labour market for print journalists. As more readers move to online news, demand for the industry's traditional print product falls sharply.\nUsing the diagram, describe the effect on the demand for labour, the equilibrium wage, and the level of employment.`, LAB_DDEC),
];

// --- more property & commodity diagrams, s118..s128 ----------------------

const diagramProperty2: ShortQuestion[] = [
  shiftQ(118, 3, `The diagram shows the market for established housing (inelastic supply). A sharp rise in interest rates increases mortgage repayments and reduces how much buyers can borrow.\nUsing the diagram, describe the effect on the demand for housing, house prices and the quantity of housing.`, HOUSE_DDEC),
  shiftQ(119, 3, `The diagram shows the world market for crude oil. Major oil-producing countries agree to cut production.\nUsing the diagram, describe the effect on the equilibrium price and quantity of oil.`, D_SDEC),
  shiftQ(120, 2, `The diagram shows the world market for wheat. A bumper harvest across several major exporting countries greatly increases global supply.\nUsing the diagram, describe the effect on the equilibrium price and quantity of wheat.`, D_SINC),
  shiftQ(121, 3, `The diagram shows the housing market (inelastic supply) in a city. A state government releases a large amount of new land for residential development.\nUsing the diagram, describe the effect on the supply of housing, house prices and the quantity of housing.`, HOUSE_SINC),
  shiftQ(122, 2, `The diagram shows the world market for copper. New mines cannot be brought into production quickly even though prices have risen, and a major existing mine unexpectedly closes due to flooding.\nUsing the diagram, describe the effect on the equilibrium price and quantity of copper.`, D_SDEC),
  shiftQ(123, 3, `The diagram shows the market for established housing (inelastic supply) in a coastal town. The town is named the country's most liveable place, sharply increasing its popularity with buyers.\nUsing the diagram, describe the effect on the demand for housing, house prices and the quantity of housing.`, HOUSE_DINC),
  shiftQ(124, 2, `The diagram shows the world market for lithium, a key input for batteries. Rapid growth in electric vehicle production sharply increases demand for lithium, while mining output takes years to expand.\nUsing the diagram, describe the effect on the equilibrium price and quantity of lithium.`, D_DINC),
  shiftQ(125, 3, `The diagram shows the market for established housing (inelastic supply). The government removes a tax concession that had made property investment more attractive.\nUsing the diagram, describe the effect on the demand for housing, house prices and the quantity of housing.`, HOUSE_DDEC),
  shiftQ(126, 2, `The diagram shows the market for a mineral commodity. A major exporting country experiences political instability that disrupts its mining industry.\nUsing the diagram, describe the effect on the equilibrium price and quantity.`, D_SDEC),
  shiftQ(127, 3, `The diagram shows the housing market (inelastic supply) in an inner-city area. A planning reform allows many more high-density apartments to be approved and built.\nUsing the diagram, describe the effect on the supply of housing, house prices and the quantity of housing.`, HOUSE_SINC),
  shiftQ(128, 2, `The diagram shows the world market for Australian coal. A global slowdown in industrial activity reduces demand for coal, while mines cannot quickly reduce output.\nUsing the diagram, describe the effect on the equilibrium price and quantity of coal.`, D_DDEC),
];

// --- more written micro short answer, q41..q80 ---------------------------

const microMore2: ShortQuestion[] = [
  // elasticity
  microQ(41, 3, "Calculate the price elasticity of demand when a 10% fall in price causes an 18% rise in quantity demanded, and interpret the result."),
  microQ(42, 3, "Calculate the price elasticity of supply when a 12% rise in price causes a 6% rise in quantity supplied, and interpret the result."),
  microQ(43, 3, "Explain why demand for petrol is more price-elastic in the long run than in the short run."),
  microQ(44, 3, "Explain the relationship between the price elasticity of demand and the effect of a price change on a firm's total revenue."),
  microQ(45, 2, "Explain why goods with many close substitutes tend to have more price-elastic demand than goods with few substitutes."),
  microQ(46, 3, "Explain why the supply of a perishable, unstorable good tends to be more price-inelastic than the supply of a good that can be stockpiled."),
  microQ(47, 3, "Explain how the proportion of a consumer's income spent on a good affects the price elasticity of demand for it."),
  microQ(48, 4, "Distinguish between price-elastic, price-inelastic and unit-elastic demand, and state what happens to total revenue when price rises in each case."),
  // government intervention
  microQ(49, 3, "Explain why a black market can emerge when a government imposes a binding price ceiling."),
  microQ(50, 3, "Explain how the price elasticity of demand affects how much of an indirect tax is passed on to consumers rather than absorbed by producers."),
  microQ(51, 3, "Compare a price floor and a subsidy as ways for a government to support producers' incomes, including one advantage of the subsidy."),
  microQ(52, 2, "Explain why a price ceiling set above the equilibrium price would have no effect on a market."),
  microQ(53, 3, "Explain the difference between a direct tax and an indirect tax, giving one Australian example of each."),
  microQ(54, 3, "Explain how a per-unit tax on a good with price-inelastic demand affects the price paid by consumers, and why."),
  microQ(55, 3, "Explain one reason a government might subsidise a good, and one way the resulting change in supply affects the market."),
  // labour markets
  microQ(56, 3, "Explain how a shortage of workers in a particular occupation is likely to affect wages and the supply of labour to that occupation over time."),
  microQ(57, 2, "Explain why the demand for labour is described as a 'derived demand'."),
  microQ(58, 3, "Explain how a minimum wage set above the equilibrium wage can lead to unemployment in that labour market."),
  microQ(59, 3, "Explain two factors that would increase the demand for labour in a particular industry."),
  microQ(60, 3, "Explain two factors that would increase the supply of labour to a particular occupation."),
  microQ(61, 3, "Explain how automation is likely to affect the demand for labour in industries where machines can replace workers."),
  microQ(62, 2, "Distinguish between the demand for labour and the supply of labour in a competitive labour market."),
  // property & commodity markets
  microQ(63, 3, "Explain why house prices in fast-growing Australian cities tend to rise more than in cities with slower population growth, given that housing supply is price-inelastic."),
  microQ(64, 3, "Explain two reasons why the supply of housing is price-inelastic in the short run."),
  microQ(65, 3, "Explain why commodity prices, such as those for iron ore or wheat, tend to be more volatile than the prices of most manufactured goods."),
  microQ(66, 3, "Analyse the effect of a fall in interest rates on the market for established housing, given that supply is price-inelastic."),
  microQ(67, 2, "Explain one way government policy can influence the supply side of the housing market."),
  microQ(68, 3, "Explain how a sudden increase in world demand for a mineral commodity affects its price when new mines take years to develop."),
  microQ(69, 3, "Explain why a bumper agricultural harvest can sometimes reduce the total income earned by farmers, using the concept of price elasticity of demand."),
  // movement/shift & price mechanism review
  microQ(70, 2, "Distinguish between a change in the quantity supplied and a change in supply."),
  microQ(71, 2, "Explain why a change in the price of a good's substitute shifts the demand curve for the good rather than causing a movement along it."),
  microQ(72, 3, "Explain how the price mechanism allocates resources in a market economy, referring to at least two of its three functions."),
  microQ(73, 2, "Give an example of a determinant of demand (other than price) and explain how a change in it would shift the demand curve."),
  microQ(74, 2, "Give an example of a determinant of supply (other than price) and explain how a change in it would shift the supply curve."),
  microQ(75, 3, "Explain why an event that changes a good's own price causes a movement along its demand curve, while an event that changes a non-price factor causes the whole curve to shift."),
  // equilibrium & general
  microQ(76, 3, "Explain what happens in a market where demand increases and supply decreases at the same time, in terms of the certainty of the price and quantity effects."),
  microQ(77, 3, "Explain why a competitive market has a natural tendency to move towards its equilibrium price from either a shortage or a surplus."),
  microQ(78, 2, "Explain the difference between a shortage and a surplus in a market."),
  microQ(79, 3, "Using an example, explain how a change in consumer expectations about future prices can shift current demand."),
  microQ(80, 3, "Using an example, explain how a change in producer expectations about future prices can shift current supply."),
];

export const questions: Question[] = [
  ...mcQuestions,
  ...mcMore,
  ...mcMore2,
  ...shiftQuestions,
  ...diagramMore,
  ...shiftQuestions2,
  ...diagramGov2,
  ...diagramLabour2,
  ...diagramProperty2,
  ...microQuestions,
  ...microMore,
  ...microMore2,
];

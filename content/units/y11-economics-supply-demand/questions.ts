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
//               property/commodity).
//   "diagram" — short answer with a market diagram, 2–3 marks (curve shifts,
//               price ceilings/floors, taxes/subsidies, labour markets, housing).
//   "micro"   — written short answer, 2–4 marks (price mechanism, elasticity,
//               total outlay method, intervention rationale, labour, property).

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

export const questions: Question[] = [
  ...mcQuestions,
  ...mcMore,
  ...shiftQuestions,
  ...diagramMore,
  ...microQuestions,
  ...microMore,
];

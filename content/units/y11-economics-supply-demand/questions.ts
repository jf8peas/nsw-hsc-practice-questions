import type { McQuestion, Question, ShortQuestion } from "@/lib/types";
import { shuffleBySeed } from "@/lib/shuffle";
import { sd } from "./diagram";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Built from the NESA Economics 11–12 syllabus (Year 11 "operation of the
// market") and the supply/demand teaching material in resources/topic002.
//
// 40 multiple choice (group "mc", 1 mark) + 40 curve-shift short answer
// (group "shift", 2–3 marks) + 20 wider-micro short answer (group "micro",
// 2–4 marks). A quiz draws 4 + 4 + 2 at random — 10 non-repeating attempts.

const U = "y11-economics-supply-demand";
const p2 = (n: number) => String(n).padStart(2, "0");

// Reused diagrams (kept as a handful of constants so the client bundle stays small).
const D_BASE = sd();
const D_DINC = sd({ shift: "demand-increase" });
const D_DDEC = sd({ shift: "demand-decrease" });
const D_SINC = sd({ shift: "supply-increase" });
const D_SDEC = sd({ shift: "supply-decrease" });
const D_SURPLUS = sd({ priceLine: { p: 0.75, label: "P₁" }, caption: "P₁ is above the equilibrium price" });
const D_SHORTAGE = sd({ priceLine: { p: 0.26, label: "P₁" }, caption: "P₁ is below the equilibrium price" });

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

function shiftQ(n: number, marks: number, prompt: string): ShortQuestion {
  return {
    id: `${U}.s${p2(n)}`,
    group: "shift",
    type: "short",
    prompt,
    maxMarks: marks,
    diagramSvg: D_BASE,
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

export const questions: Question[] = [
  ...mcQuestions,
  ...shiftQuestions,
  ...microQuestions,
];

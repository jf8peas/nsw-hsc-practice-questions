import type { Answer, AnswerSet } from "@/lib/types";

// Answer key for y11-economics-supply-demand. NO "server-only" import here (so
// the validator can read it); only re-exported via content/answers/index.ts,
// which is server-only. Never import from a client component.

const U = "y11-economics-supply-demand";
const p2 = (n: number) => String(n).padStart(2, "0");

// ---- multiple choice ----------------------------------------------------

function ma(n: number, correctText: string, why: string): [string, Answer] {
  return [`${U}.m${p2(n)}`, { correctText, rubric: [why] }];
}

const mcAnswers: Array<[string, Answer]> = [
  ma(1, "As the price of the good rises, the quantity demanded falls, all else equal.", "The law of demand — an inverse relationship between a good's price and the quantity demanded, giving the demand curve its downward slope."),
  ma(2, "As the price of a good rises, producers are willing to supply a greater quantity, all else equal.", "The law of supply — a positive relationship between price and quantity supplied, giving the supply curve its upward slope."),
  ma(3, "an expansion of demand — a movement down along the demand curve.", "A change in the good's own price causes a movement along the demand curve (an expansion when price falls), not a shift."),
  ma(4, "expand the quantity supplied — a movement up along the supply curve.", "A change in the good's own price is a movement along the supply curve (an expansion / contraction), not a shift."),
  ma(5, "Consumers buy more coffee after a report says it has health benefits.", "A change in tastes is a non-price factor, so it shifts the demand curve (a change in demand). The other options are price-driven movements along the curve."),
  ma(6, "shifted to the right — a greater quantity is demanded at every price.", "An increase in demand means the whole curve shifts right; more is demanded at every price. A price change would be a movement along the curve."),
  ma(7, "increase the demand for coffee — a rightward shift of the coffee demand curve.", "When the price of a substitute rises, consumers switch to this good, raising its demand at every price."),
  ma(8, "increase the demand for cars.", "When the price of a complement falls, the combined cost of using the two goods falls, so demand for the complement good rises."),
  ma(9, "decrease — the demand curve shifts to the left.", "For a normal good, lower income reduces demand at every price, shifting the curve left."),
  ma(10, "decrease — the demand curve shifts to the left.", "For an inferior good, higher income reduces demand as consumers switch to preferred alternatives."),
  ma(11, "increase now, as consumers bring their purchases forward.", "An expectation of higher future prices raises demand today — a rightward shift now."),
  ma(12, "An increase in the number of consumers in the market.", "More consumers (population) is a non-price demand factor and shifts demand right. The other options shift supply."),
  ma(13, "demand increases and the demand curve shifts to the right.", "A change in tastes towards the good is a non-price factor, shifting the whole demand curve right."),
  ma(14, "the demand for butter decreases — its demand curve shifts left.", "A fall in the price of a substitute (margarine) leads consumers to switch away from butter, reducing its demand."),
  ma(15, "A change in the good's own price.", "A change in the good's own price causes a movement along the demand curve, not a shift of it. The other options are shift factors."),
  ma(16, "increase — the supply curve shifts to the right.", "Lower production costs from better technology let firms supply more at every price."),
  ma(17, "shift to the left — supply decreases.", "Higher wages raise the cost of a factor of production, so less is supplied at every price."),
  ma(18, "shift to the left.", "A per-unit tax raises producers' costs, reducing the quantity supplied at every price — a leftward shift."),
  ma(19, "increase — the supply curve shifts to the right.", "More suppliers in the industry raises the quantity supplied at every price."),
  ma(20, "increase supply — the supply curve shifts to the right.", "A per-unit subsidy lowers producers' effective costs, so more is supplied at every price."),
  ma(21, "decrease — the supply curve shifts to the left.", "A drought destroys output, reducing the quantity that can be supplied at every price (a supply-side climate shock)."),
  ma(22, "decrease now, as they withhold stock to sell later at the higher price.", "An expectation of higher future prices reduces current supply as producers hold back stock."),
  ma(23, "A fall in the price of the raw materials used to make it.", "Cheaper inputs lower production costs, shifting supply right. The other options raise costs or reduce the number of firms."),
  ma(24, "the quantity demanded equals the quantity supplied and there is no tendency for the price to change.", "At equilibrium the plans of buyers and sellers coincide and the market clears."),
  ma(25, "the quantity supplied exceeds the quantity demanded — a surplus — and the price tends to fall.", "Above equilibrium, producers offer more than consumers will buy; the surplus puts downward pressure on price."),
  ma(26, "a shortage — the quantity demanded exceeds the quantity supplied — and upward pressure on the price.", "Below equilibrium, consumers want more than producers offer; the shortage pushes price up."),
  ma(27, "price to rise and the quantity to rise.", "An increase in demand against unchanged supply raises both equilibrium price and quantity."),
  ma(28, "price to fall and the quantity to rise.", "An increase in supply against unchanged demand lowers equilibrium price and raises equilibrium quantity."),
  ma(29, "price to fall and the quantity to fall.", "A decrease in demand against unchanged supply lowers both equilibrium price and quantity."),
  ma(30, "price to rise and the quantity to fall.", "A decrease in supply against unchanged demand raises equilibrium price and lowers equilibrium quantity."),
  ma(31, "Price falls and quantity rises.", "Better technology increases supply (shift right), lowering price and raising quantity."),
  ma(32, "Price rises and quantity rises.", "Greater popularity increases demand (shift right), raising both price and quantity."),
  ma(33, "Price rises and quantity falls.", "A drought decreases supply (shift left), raising price and lowering quantity."),
  ma(34, "An increase in the price of cheese, a key input in making pizza.", "Dearer cheese raises production costs, decreasing supply and raising the price of pizza. The other options decrease demand or price."),
  ma(35, "rising or falling prices conveying information to producers and consumers about changing market conditions.", "Signalling: relative price changes carry information about scarcity and demand to market participants."),
  ma(36, "higher prices motivating producers to expand output and encouraging consumers to economise on the good.", "Incentive: price changes create incentives that alter the behaviour of producers and consumers."),
  ma(37, "the price distributing a limited supply of a good to the buyers most willing and able to pay for it.", "Rationing: price shares a scarce quantity among competing buyers."),
  ma(38, "the price rising, which contracts the quantity demanded and expands the quantity supplied.", "In a shortage the price rises, moving both sides along their curves until quantity demanded equals quantity supplied."),
  ma(39, "An improvement in production technology.", "Better technology lowers costs and increases supply (rightward shift). The other options decrease supply."),
  ma(40, "A rise in the price of a substitute good.", "A dearer substitute makes consumers switch to this good, increasing its demand (rightward shift). The other options decrease demand or shift supply."),
];

// ---- curve-shift short answer -----------------------------------------

/**
 * `demand` or `supply`, `up` (right / increase) or `down` (left / decrease),
 * plus the reason and the equilibrium effect.
 */
function shiftAns(
  n: number,
  marks: 2 | 3,
  curve: "demand" | "supply",
  dir: "increase" | "decrease",
  reason: string,
  eqPrice: "rises" | "falls",
  eqQty: "rises" | "falls",
): [string, Answer] {
  const shiftDir = dir === "increase" ? "right" : "left";
  const other = curve === "demand" ? "supply" : "demand";
  const model =
    `The ${curve} curve shifts to the ${shiftDir} (${dir} in ${curve}), because ${reason}. ` +
    `The ${other} curve does not move. ` +
    `As a result, the equilibrium price ${eqPrice} and the equilibrium quantity ${eqQty}.`;
  const rubric = [
    `Identifies that ${curve} shifts to the ${shiftDir} — an ${dir} in ${curve}`,
    `Explains the reason: ${reason}`,
  ];
  if (marks === 3) {
    rubric.push(`States the effect on equilibrium: price ${eqPrice} and quantity ${eqQty}`);
  }
  return [`${U}.s${p2(n)}`, { modelAnswer: model, rubric }];
}

const shiftAnswers: Array<[string, Answer]> = [
  shiftAns(1, 3, "demand", "increase", "restaurant meals are a normal good and higher incomes raise consumers' willingness and ability to buy them at every price", "rises", "rises"),
  shiftAns(2, 3, "supply", "increase", "petrol is a major cost for airlines, so a lower petrol price cuts production costs and firms will supply more flights at every price", "falls", "rises"),
  shiftAns(3, 3, "demand", "decrease", "the health campaign shifts consumer tastes away from beef, so less is demanded at every price", "falls", "falls"),
  shiftAns(4, 3, "demand", "increase", "tea is a substitute for coffee, so a higher tea price leads consumers to switch to coffee", "rises", "rises"),
  shiftAns(5, 3, "supply", "increase", "the new technology lowers the cost of producing solar panels, so firms supply more at every price", "falls", "rises"),
  shiftAns(6, 3, "supply", "increase", "the per-vehicle subsidy lowers manufacturers' effective costs, so they supply more cars at every price", "falls", "rises"),
  shiftAns(7, 3, "supply", "decrease", "the drought destroys part of the crop, reducing the quantity of wheat that can be supplied at every price", "rises", "falls"),
  shiftAns(8, 3, "demand", "increase", "consumers expect petrol prices to rise, so they bring purchases forward and demand more now", "rises", "rises"),
  shiftAns(9, 3, "demand", "increase", "a larger population means more consumers, so more bottled water is demanded at every price", "rises", "rises"),
  shiftAns(10, 3, "demand", "decrease", "consumer tastes have shifted towards online news, so fewer printed newspapers are demanded at every price", "falls", "falls"),
  shiftAns(11, 3, "supply", "decrease", "higher dairy-worker wages raise the cost of a factor of production, so less milk is supplied at every price", "rises", "falls"),
  shiftAns(12, 3, "demand", "decrease", "streaming is a substitute for cinema, so a lower streaming price leads consumers to switch away from cinema tickets", "falls", "falls"),
  shiftAns(13, 3, "supply", "increase", "new manufacturers add to the number of suppliers, so more electric cars are supplied at every price", "falls", "rises"),
  shiftAns(14, 3, "supply", "decrease", "the per-litre tax raises producers' costs, so less is supplied at every price", "rises", "falls"),
  shiftAns(15, 3, "demand", "increase", "the wet-weather forecast shifts tastes towards umbrellas and consumers buy now, so demand rises at every price", "rises", "rises"),
  shiftAns(16, 3, "demand", "decrease", "tinned tuna is an inferior good, so higher incomes lead consumers to switch to preferred substitutes and demand less", "falls", "falls"),
  shiftAns(17, 3, "supply", "decrease", "wheat is the main ingredient in bread, so a higher wheat price raises production costs and less bread is supplied at every price", "rises", "falls"),
  shiftAns(18, 3, "demand", "increase", "the celebrity endorsement shifts consumer tastes towards the shoe, raising demand at every price", "rises", "rises"),
  shiftAns(19, 3, "supply", "increase", "the ideal weather produces a bumper crop, so more strawberries can be supplied at every price", "falls", "rises"),
  shiftAns(20, 3, "demand", "decrease", "electric lawnmowers are a substitute, so their lower price leads consumers to switch away from petrol lawnmowers", "falls", "falls"),
  shiftAns(21, 2, "demand", "increase", "bus travel is a substitute for train travel, so higher bus fares lead commuters to switch to trains", "rises", "rises"),
  shiftAns(22, 2, "demand", "increase", "the festival brings many more visitors needing rooms, raising demand for hotel rooms at every price", "rises", "rises"),
  shiftAns(23, 2, "supply", "increase", "the automated sawmills raise productivity, lowering unit costs, so more timber is supplied at every price", "falls", "rises"),
  shiftAns(24, 2, "demand", "decrease", "restaurant meals are a normal good, so lower incomes in a recession reduce demand at every price", "falls", "falls"),
  shiftAns(25, 2, "supply", "decrease", "the frost damages plantations, reducing the quantity of coffee beans that can be supplied at every price", "rises", "falls"),
  shiftAns(26, 2, "supply", "decrease", "producers expect higher prices in December, so they withhold stock and supply less now", "rises", "falls"),
  shiftAns(27, 2, "demand", "increase", "margarine is a substitute for butter, so a higher margarine price leads consumers to switch to butter", "rises", "rises"),
  shiftAns(28, 2, "demand", "decrease", "coffee is a substitute for tea, so a lower coffee price leads consumers to switch away from tea", "falls", "falls"),
  shiftAns(29, 2, "supply", "increase", "steel is a key input for bicycles, so cheaper steel lowers costs and more bicycles are supplied at every price", "falls", "rises"),
  shiftAns(30, 2, "supply", "decrease", "publishers leaving the industry reduces the number of suppliers, so less is supplied at every price", "rises", "falls"),
  shiftAns(31, 2, "demand", "increase", "the area becoming desirable shifts tastes towards living there, raising demand for apartments at every price", "rises", "rises"),
  shiftAns(32, 2, "supply", "decrease", "the higher excise tax raises producers' costs, so fewer cigarettes are supplied at every price", "rises", "falls"),
  shiftAns(33, 2, "demand", "decrease", "consumers expect flower prices to fall after Valentine's Day, so they delay buying and demand less now", "falls", "falls"),
  shiftAns(34, 2, "supply", "decrease", "the orchard disease reduces yields, so fewer oranges can be supplied at every price", "rises", "falls"),
  shiftAns(35, 2, "demand", "increase", "the fitness trend shifts tastes towards exercise, raising demand for gym memberships at every price", "rises", "rises"),
  shiftAns(36, 3, "supply", "increase", "new oil discoveries and extra refineries add to the number of suppliers, so more petrol is supplied at every price", "falls", "rises"),
  shiftAns(37, 3, "demand", "increase", "fans believe this is their last chance to see the band, shifting tastes and raising demand for tickets at every price", "rises", "rises"),
  shiftAns(38, 3, "demand", "increase", "chicken burgers are a substitute for hamburgers, so a higher chicken-burger price leads consumers to switch to hamburgers", "rises", "rises"),
  shiftAns(39, 2, "supply", "decrease", "higher electricity prices raise the cost of running wool-processing mills, so less wool is supplied at every price", "rises", "falls"),
  shiftAns(40, 2, "supply", "increase", "the breakthrough greatly lowers the cost of key smartphone components, so more smartphones are supplied at every price", "falls", "rises"),
];

// ---- wider micro short answer ----------------------------------------

function micro(n: number, model: string, rubric: string[]): [string, Answer] {
  return [`${U}.q${p2(n)}`, { modelAnswer: model, rubric }];
}

const microAnswers: Array<[string, Answer]> = [
  micro(1,
    "The signalling function is the way changes in relative prices pass information to producers and consumers about changing market conditions. A rising price signals that a good has become scarcer or more wanted; a falling price signals the reverse. For example, a rising avocado price signals to growers that demand has strengthened and signals to consumers that avocados have become relatively scarce.",
    [
      "Defines signalling: relative price changes carry information about changing market conditions",
      "Explains that a rising price signals greater scarcity/demand and a falling price the opposite",
      "Gives a valid example linking a price change to the information it conveys",
    ]),
  micro(2,
    "The incentive function is the way a change in price motivates producers and consumers to change their behaviour. A higher price gives producers an incentive to expand output because profit rises, and gives consumers an incentive to buy less and seek substitutes. For example, higher petrol prices encourage oil firms to produce more while encouraging drivers to use less fuel.",
    [
      "Defines the incentive function: price changes create incentives that change behaviour",
      "Explains the producer incentive (higher price → expand output for more profit) and the consumer incentive (higher price → economise)",
      "Gives a valid example",
    ]),
  micro(3,
    "The rationing function is the way price distributes a limited supply of a good among the consumers who want it. When a good is scarce its price rises until only buyers who are willing and able to pay that price continue to buy, so the available quantity is shared among them and the shortage is removed. For example, a high price for finals tickets rations them to the fans who value them most.",
    [
      "Defines rationing: price distributes a limited quantity among competing buyers",
      "Explains that price rises until only those willing and able to pay obtain the good, clearing the shortage",
      "Gives a valid example",
    ]),
  micro(4,
    "A movement along the demand curve happens when the good's own price changes and nothing else does: a price fall causes an expansion of demand (down the curve) and a price rise causes a contraction (up the curve). A shift of the whole demand curve happens when a non-price factor changes — income, population, tastes, the price of a substitute or complement, or expected future prices — and is described as an increase in demand (shift right) or a decrease in demand (shift left).",
    [
      "States a movement along the curve is caused only by a change in the good's own price (expansion/contraction)",
      "States a shift of the curve is caused by a change in a non-price factor (increase/decrease in demand)",
      "Identifies at least one correct non-price factor",
    ]),
  micro(5,
    "An expansion of supply is a movement up along the existing supply curve, caused by a rise in the good's own price, so a greater quantity is supplied at that higher price. An increase in supply is a rightward shift of the whole supply curve, caused by a favourable change in a non-price factor such as lower input costs, better technology or more suppliers, so more is supplied at every price.",
    [
      "Defines expansion of supply: a movement along the curve caused by a rise in the good's own price",
      "Defines increase in supply: a rightward shift of the whole curve caused by a non-price factor",
    ]),
  micro(6,
    "A contraction of demand is a movement up along the existing demand curve, caused by a rise in the good's own price, so a smaller quantity is demanded at that higher price. A decrease in demand is a leftward shift of the whole demand curve, caused by an unfavourable change in a non-price factor such as lower incomes (for a normal good), a change in tastes away from the good, or a fall in the price of a substitute, so less is demanded at every price.",
    [
      "Defines contraction of demand: a movement along the curve caused by a rise in the good's own price",
      "Defines decrease in demand: a leftward shift of the whole curve caused by a non-price factor",
    ]),
  micro(7,
    "The law of demand states that, all other things being equal, as the price of a good rises the quantity demanded falls, and as the price falls the quantity demanded rises. This inverse relationship gives the demand curve its downward (negative) slope.",
    [
      "States the inverse relationship between a good's price and quantity demanded, all else equal",
      "Links this to the downward-sloping demand curve",
    ]),
  micro(8,
    "The law of supply states that, all other things being equal, as the price of a good rises the quantity supplied rises, and as the price falls the quantity supplied falls. This positive relationship gives the supply curve its upward slope.",
    [
      "States the positive relationship between a good's price and quantity supplied, all else equal",
      "Links this to the upward-sloping supply curve",
    ]),
  micro(9,
    "The demand curve slopes downward for two reasons. First, the income effect: a lower price raises consumers' real purchasing power, so they can afford to buy more of the good. Second, the substitution effect: a lower price makes the good cheaper relative to its substitutes, so consumers switch towards it and buy more. Both effects mean a larger quantity is demanded at lower prices.",
    [
      "Explains the income effect (lower price raises real purchasing power)",
      "Explains the substitution effect (lower price makes the good cheaper relative to substitutes)",
      "Links both to a larger quantity demanded at lower prices (the downward slope)",
    ]),
  micro(10,
    "The supply curve slopes upward because a higher price makes producing the good more profitable, so existing firms have an incentive to expand output; a higher price also allows firms to cover the higher marginal cost of producing extra units and can attract additional resources or firms into the industry.",
    [
      "Explains that a higher price raises profitability, giving firms an incentive to supply more",
      "Explains that a higher price covers the higher marginal cost of extra output (or attracts more resources/firms)",
    ]),
  micro(11,
    "Market equilibrium is the price at which the quantity demanded equals the quantity supplied. At this price the plans of buyers and sellers coincide, the market clears, and there is no tendency for the price to change.",
    [
      "States equilibrium is where quantity demanded equals quantity supplied",
      "States that at this price the market clears and there is no tendency for price to change",
    ]),
  micro(12,
    "A shortage exists when the price is below equilibrium, so the quantity demanded exceeds the quantity supplied. Unsatisfied buyers bid the price up. As the price rises, the quantity demanded contracts and the quantity supplied expands, and this continues until quantity demanded again equals quantity supplied at the equilibrium price.",
    [
      "Identifies a shortage: price below equilibrium, quantity demanded exceeds quantity supplied",
      "Explains that the shortage causes the price to rise",
      "Explains that the higher price contracts quantity demanded and expands quantity supplied until they are equal",
    ]),
  micro(13,
    "A surplus exists when the price is above equilibrium, so the quantity supplied exceeds the quantity demanded. Sellers with unsold stock cut the price. As the price falls, the quantity supplied contracts and the quantity demanded expands, and this continues until quantity supplied again equals quantity demanded at the equilibrium price.",
    [
      "Identifies a surplus: price above equilibrium, quantity supplied exceeds quantity demanded",
      "Explains that the surplus causes the price to fall",
      "Explains that the lower price contracts quantity supplied and expands quantity demanded until they are equal",
    ]),
  micro(14,
    "A want is simply a desire for a good. Effective demand is a want that is backed by both the willingness and the ability (the purchasing power) to pay for the good. Only effective demand influences the market, because wants without the means to pay do not lead to purchases.",
    [
      "Defines a want as a desire for a good",
      "Defines effective demand as a want backed by willingness AND ability to pay, and notes only it affects the market",
    ]),
  micro(15,
    "Individual demand is the quantity of a good that one consumer is willing and able to buy at each price. Market demand is the sum of all individual demands — the total quantity that all consumers together will buy at each price — found by adding the quantities demanded by every consumer at each price.",
    [
      "Defines individual demand: one consumer's quantity demanded at each price",
      "Defines market demand: the sum of all individual demands (total quantity demanded at each price)",
    ]),
  micro(16,
    "The price elasticity of demand measures the responsiveness of the quantity demanded of a good to a change in its price. It is calculated as the percentage change in quantity demanded divided by the percentage change in price.",
    [
      "Defines PED as the responsiveness of quantity demanded to a change in price",
      "Gives the formula: % change in quantity demanded ÷ % change in price",
    ]),
  micro(17,
    "The degree of necessity matters because demand for a necessity is price-inelastic — consumers must keep buying it even when its price rises — whereas demand for a luxury or discretionary good is more elastic. The availability of substitutes matters because when a good has many close substitutes, demand is elastic since buyers can readily switch away when its price rises; when it has few substitutes, demand is inelastic.",
    [
      "Explains that necessities have inelastic demand (must keep buying despite price rises)",
      "Explains that luxuries / discretionary goods have more elastic demand",
      "Explains that more (and closer) substitutes make demand more elastic",
      "Explains that few substitutes make demand more inelastic",
    ]),
  micro(18,
    "When demand is price-inelastic, the percentage fall in quantity demanded is smaller than the percentage rise in price. Because total revenue is price multiplied by quantity, the gain from the higher price outweighs the loss from the smaller quantity, so total revenue rises. This is why firms selling necessities or goods with few substitutes can raise prices to increase revenue.",
    [
      "States that with inelastic demand the % fall in quantity is smaller than the % rise in price",
      "Concludes that total revenue (price × quantity) therefore rises",
      "Links this to goods with inelastic demand (necessities / few substitutes)",
    ]),
  micro(19,
    "The price elasticity of supply measures the responsiveness of the quantity supplied of a good to a change in its price (the percentage change in quantity supplied divided by the percentage change in price). Supply is more inelastic in the short run because firms cannot quickly change their capacity or factor inputs, and more elastic in the long run because firms have time to expand capacity, hire, and enter or leave the industry.",
    [
      "Defines PES as the responsiveness of quantity supplied to a change in price (with the formula)",
      "Explains that supply is more inelastic in the short run (capacity and inputs are fixed)",
      "Explains that supply is more elastic in the long run (firms can adjust capacity and enter/exit)",
    ]),
  micro(20,
    "At equilibrium the price equals both consumers' valuation of the last unit bought and producers' cost of the last unit made, so all mutually beneficial trades take place. The signalling and incentive functions of price draw resources into producing the goods consumers value most and away from those they value less, and because there is no surplus or shortage, scarce resources are not wasted. This is allocative efficiency.",
    [
      "States that at equilibrium price reflects both consumers' valuation and producers' cost of the last unit",
      "Explains that price signals and incentives direct resources to the goods consumers value most",
      "Concludes that with no surplus or shortage resources are not wasted — allocative efficiency",
    ]),
];

export const answers: AnswerSet = Object.fromEntries([
  ...mcAnswers,
  ...shiftAnswers,
  ...microAnswers,
]);

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

// ==========================================================================
// EXPANSION — answers for the movement/elasticity/intervention/labour/property
// questions (m41..m84, s41..s64, q21..q40).
// ==========================================================================

const mcMoreAnswers: Array<[string, Answer]> = [
  ma(41, "an expansion of demand — a movement down along the demand curve.", "A change in the good's own price causes a movement along the demand curve (an expansion when price falls), not a shift."),
  ma(42, "an expansion of supply — a movement up along the supply curve.", "A change in the good's own price causes a movement along the supply curve (an expansion when price rises), not a shift."),
  ma(43, "an increase in demand — a rightward shift of the demand curve.", "The heatwave is a non-price factor (tastes/conditions), so the whole demand curve shifts right — more is demanded at every price."),
  ma(44, "an increase in supply — a rightward shift of the supply curve.", "Better technology is a non-price factor, so the whole supply curve shifts right — more is supplied at every price."),
  ma(45, "0.5 — demand is price-inelastic.", "PED = %ΔQd ÷ %ΔP = 10 ÷ 20 = 0.5. Because it is less than 1, demand is price-inelastic."),
  ma(46, "3 — demand is price-elastic.", "PED = %ΔQd ÷ %ΔP = 15 ÷ 5 = 3. Because it is greater than 1, demand is price-elastic."),
  ma(47, "a 4% decrease.", "PED = 0.4 means %ΔQd = PED × %ΔP = 0.4 × 10% = 4%; a price rise reduces quantity demanded, so a 4% fall."),
  ma(48, "rise, because the percentage fall in quantity is smaller than the percentage rise in price.", "With inelastic demand the quantity effect is small, so a higher price raises total outlay (price × quantity)."),
  ma(49, "fall, because the percentage fall in quantity is larger than the percentage rise in price.", "With elastic demand the quantity effect is large, so a higher price reduces total outlay."),
  ma(50, "unchanged.", "With unit-elastic demand the percentage change in quantity exactly offsets the percentage change in price, so total revenue is unchanged."),
  ma(51, "Insulin for a person with diabetes.", "A necessity with no substitutes has very inelastic demand — the person must buy it almost regardless of price."),
  ma(52, "it has many close substitutes.", "More close substitutes let consumers switch away when the price rises, making demand more responsive (elastic)."),
  ma(53, "there are few substitutes and most drivers cannot quickly change how much they drive.", "Petrol is a short-run necessity with few substitutes, so quantity demanded changes little when price changes."),
  ma(54, "0.4 — supply is price-inelastic.", "PES = %ΔQs ÷ %ΔP = 4 ÷ 10 = 0.4. Because it is less than 1, supply is price-inelastic."),
  ma(55, "firms have spare (excess) capacity and a longer time to respond.", "Spare capacity and time let firms increase output easily when price rises, making supply more elastic."),
  ma(56, "it takes a full growing season to change how much is planted and harvested.", "Farmers cannot expand output quickly, so quantity supplied responds little to price in the short run."),
  ma(57, "a shortage — the quantity demanded exceeds the quantity supplied.", "Below equilibrium, buyers want more than sellers will supply, so a persistent shortage results."),
  ma(58, "a surplus — the quantity supplied exceeds the quantity demanded.", "Above equilibrium, sellers offer more than buyers will take, so a persistent surplus results."),
  ma(59, "create a shortage of rental housing, as landlords supply less and tenants demand more.", "A binding rent ceiling holds the price below equilibrium, so quantity demanded exceeds quantity supplied."),
  ma(60, "shift the supply curve upward/left by the amount of the tax, raising the price and reducing the quantity traded.", "An indirect tax adds to producers' costs, decreasing supply; price rises and quantity falls."),
  ma(61, "relatively price-inelastic.", "When demand is inelastic consumers keep buying despite the higher price, so they bear most of the tax."),
  ma(62, "Price falls and quantity rises.", "A subsidy lowers producers' effective costs, increasing supply — price falls and quantity rises."),
  ma(63, "The Goods and Services Tax (GST).", "The GST is levied on producers/sellers but paid by consumers through higher prices — an indirect tax. The others are direct taxes."),
  ma(64, "support and stabilise farmers' incomes above the level the free market would give.", "A price floor guarantees producers a minimum price, raising and stabilising their revenue."),
  ma(65, "a persistent shortage, with non-price rationing such as queues or waiting lists.", "The ceiling prevents the price from rising to clear the market, so the shortage lasts and the good is rationed by other means."),
  ma(66, "increase the quantity produced and consumed beyond the free-market level.", "A subsidy raises supply, lowering price and raising quantity above the free-market equilibrium."),
  ma(67, "households supply labour and businesses demand labour.", "In the labour market, workers (households) offer their labour and firms (businesses) hire it."),
  ma(68, "the demand for the goods and services that the labour is used to produce.", "Labour is wanted not for itself but to produce output, so its demand is derived from the demand for that output."),
  ma(69, "a surplus of labour (unemployment) — the quantity of labour supplied exceeds the quantity demanded.", "A minimum wage above equilibrium means more people want to work than firms will hire — a labour surplus."),
  ma(70, "the quantity of labour demanded exceeds the quantity supplied, so wages tend to rise.", "A skill shortage is excess demand for labour; the wage is bid up until the market clears."),
  ma(71, "A rise in consumer demand for the industry's output.", "Because labour demand is derived, more demand for the output raises the demand for the labour that makes it."),
  ma(72, "More people gaining the qualifications the occupation requires.", "More qualified people willing to do the work increases the supply of labour to that occupation."),
  ma(73, "decrease the demand for labour, lowering the equilibrium wage and level of employment.", "Automation substitutes capital for labour, shifting labour demand left."),
  ma(74, "the quantity of labour demanded equals the quantity of labour supplied.", "As in any competitive market, equilibrium is where the quantities demanded and supplied are equal."),
  ma(75, "new dwellings take a long time to build and the existing stock is large and slow to change.", "Because supply adjusts slowly, quantity responds little to price — supply is price-inelastic."),
  ma(76, "push house prices up sharply, with only a small rise in the quantity of housing.", "With inelastic supply, a demand increase raises price a lot and quantity only a little."),
  ma(77, "increase the demand for housing and put upward pressure on house prices.", "Tax concessions raise the after-tax return to housing investment, increasing demand."),
  ma(78, "demand can change quickly (e.g. with Chinese growth) while supply is slow to adjust, and both are relatively price-inelastic.", "Inelastic demand and slow, inelastic supply mean shocks translate into large price swings."),
  ma(79, "lower both the price and the quantity of iron ore sold.", "A fall in demand shifts the demand curve left, reducing equilibrium price and quantity."),
  ma(80, "increase supply and put downward pressure on prices and rents.", "More dwellings shift the housing supply curve right, lowering prices and rents."),
  ma(81, "strong demand (population growth, investor concessions, low interest rates) has met a slow, inelastic supply response.", "Persistent demand growth against inelastic supply drives prices up faster than incomes."),
  ma(82, "increase supply, putting downward pressure on the price.", "A major new mine adds to world output, shifting supply right and lowering the price."),
  ma(83, "Lower borrowing costs increase the demand for housing, and supply is slow to respond.", "Cheaper mortgages let buyers borrow and bid more, raising demand against inelastic supply."),
  ma(84, "above the market equilibrium price.", "A price floor only binds if it is above equilibrium; below equilibrium the market price is already higher and the floor has no effect."),
];

// diagram short answers — s41..s64
const diagramMoreAnswers: Array<[string, Answer]> = [
  [`${U}.s41`, {
    modelAnswer:
      "At the ceiling rent Pᶜ, which is below equilibrium, the quantity of rental housing demanded exceeds the quantity supplied. Tenants want more housing at the lower rent, while landlords offer less. The market is in a shortage equal to the gap between quantity demanded and quantity supplied, and it persists because the price is not allowed to rise to clear it.",
    rubric: [
      "States that at Pᶜ the quantity demanded rises / quantity supplied falls compared with equilibrium",
      "Identifies that quantity demanded exceeds quantity supplied",
      "Concludes the market is in a (persistent) shortage",
    ],
  }],
  [`${U}.s42`, {
    modelAnswer:
      "At the floor price Pᶠ, which is above equilibrium, the quantity supplied exceeds the quantity demanded. Producers offer more at the higher guaranteed price, while consumers buy less. The market is in a surplus equal to the gap between quantity supplied and quantity demanded, which the government may have to buy up or store.",
    rubric: [
      "States that at Pᶠ the quantity supplied rises / quantity demanded falls compared with equilibrium",
      "Identifies that quantity supplied exceeds quantity demanded",
      "Concludes the market is in a (persistent) surplus",
    ],
  }],
  [`${U}.s43`, {
    modelAnswer:
      "The per-unit tax adds to producers' costs, so the supply curve shifts up/left by the amount of the tax (from S to S + tax). At the new equilibrium the price paid by consumers is higher and the quantity traded is lower. (The price producers keep, after paying the tax, is lower than before.)",
    rubric: [
      "States the supply curve shifts up / to the left (by the amount of the tax)",
      "States the price paid by consumers rises",
      "States the quantity traded falls",
    ],
  }],
  [`${U}.s44`, {
    modelAnswer:
      "The per-unit subsidy lowers producers' effective costs, so the supply curve shifts down/right by the amount of the subsidy (from S to S − subsidy). At the new equilibrium the price paid by consumers is lower and the quantity traded is higher.",
    rubric: [
      "States the supply curve shifts down / to the right (by the amount of the subsidy)",
      "States the price paid by consumers falls",
      "States the quantity traded rises",
    ],
  }],
  [`${U}.s45`, {
    modelAnswer:
      "First, because Pᶜ is below equilibrium, the quantity demanded exceeds the quantity supplied, so there is a petrol shortage — some motorists who want petrol at Pᶜ cannot get it. Second, because the price cannot rise, petrol must be rationed by other means, such as queues, limits per customer, or a black market where petrol sells above Pᶜ.",
    rubric: [
      "Consequence 1: a shortage — quantity demanded exceeds quantity supplied at Pᶜ",
      "Consequence 2: non-price rationing (queues / limits / black market)",
      "Links both consequences to the price being held below the market-clearing level",
    ],
  }],
  [`${U}.s46`, {
    modelAnswer:
      "At the floor price Pᶠ, above equilibrium, dairy farmers supply a larger quantity while consumers buy a smaller quantity. Quantity supplied exceeds quantity demanded, so the market is in a surplus equal to the difference.",
    rubric: [
      "States quantity supplied rises and quantity demanded falls at Pᶠ",
      "Concludes there is a surplus (quantity supplied exceeds quantity demanded)",
    ],
  }],
  [`${U}.s47`, {
    modelAnswer:
      "The higher excise tax raises producers' costs and shifts the supply curve up/left, so the equilibrium price of cigarettes rises and the quantity traded falls. A government may want this because cigarettes are a demerit good with negative externalities; the higher price and lower quantity reduce smoking and raise tax revenue.",
    rubric: [
      "States the equilibrium price rises",
      "States the equilibrium quantity falls",
      "Gives a valid government motive (reduce consumption of a demerit good / negative externalities / raise revenue)",
    ],
  }],
  [`${U}.s48`, {
    modelAnswer:
      "The per-vehicle subsidy lowers manufacturers' effective costs and shifts the supply curve right, so the equilibrium price of electric vehicles falls and the quantity traded rises.",
    rubric: [
      "States the equilibrium price falls",
      "States the equilibrium quantity rises",
    ],
  }],
  [`${U}.s49`, {
    modelAnswer:
      "Normally a shortage would push the price up until quantity demanded equals quantity supplied. A price ceiling makes it illegal to charge more than Pᶜ, so the price cannot rise. Quantity supplied stays low, quantity demanded stays high, and the shortage remains for as long as the ceiling is in place.",
    rubric: [
      "Explains that a shortage normally causes the price to rise to clear the market",
      "Explains that the ceiling prevents the price from rising above Pᶜ, so the shortage persists",
    ],
  }],
  // s50 — bread / wheat input cost (reuse shiftAns pattern)
  shiftAns(50, 3, "supply", "decrease", "wheat is the main input for bread, so a higher wheat price raises production costs and less bread is supplied at every price", "rises", "falls"),
  [`${U}.s51`, {
    modelAnswer:
      "At the minimum wage Wₘ, above the equilibrium wage, the quantity of labour supplied rises (more people want these jobs) while the quantity of labour demanded falls (firms hire fewer workers at the higher wage). Employment falls to the quantity demanded at Wₘ, and the gap between quantity supplied and quantity demanded is a surplus of labour — unemployment.",
    rubric: [
      "States the quantity of labour demanded falls at Wₘ",
      "States the quantity of labour supplied rises at Wₘ",
      "Concludes employment falls and there is a labour surplus (unemployment)",
    ],
  }],
  [`${U}.s52`, {
    modelAnswer:
      "Because the demand for labour is derived from the demand for output, stronger demand for the industry's product increases the demand for its labour — the labour demand curve shifts right. This raises the equilibrium wage and increases the level of employment in the industry.",
    rubric: [
      "States the demand for labour increases (shifts right), because labour demand is derived",
      "States the equilibrium wage rises",
      "States employment rises",
    ],
  }],
  [`${U}.s53`, {
    modelAnswer:
      "Automation substitutes machines for workers, so firms need less labour at every wage — the labour demand curve shifts left. This lowers the equilibrium wage and reduces the level of employment in the industry.",
    rubric: [
      "States the demand for labour decreases (shifts left)",
      "States the equilibrium wage falls",
      "States employment falls",
    ],
  }],
  [`${U}.s54`, {
    modelAnswer:
      "More people available and willing to do this work increases the supply of labour — the labour supply curve shifts right. This lowers the equilibrium wage, but the equilibrium quantity of labour employed rises.",
    rubric: [
      "States the supply of labour increases (shifts right)",
      "States the equilibrium wage falls",
      "States the quantity of labour employed rises",
    ],
  }],
  [`${U}.s55`, {
    modelAnswer:
      "A long, difficult qualification that few people complete reduces the number of people able to do the work, so the supply of labour decreases — the labour supply curve shifts left. This raises the equilibrium wage but reduces the equilibrium quantity of labour employed.",
    rubric: [
      "States the supply of labour decreases (shifts left)",
      "States the equilibrium wage rises",
      "States the quantity of labour employed falls",
    ],
  }],
  [`${U}.s56`, {
    modelAnswer:
      "At W₁ there is excess demand for labour — a shortage. Employers competing for scarce workers bid the wage up. As the wage rises, the quantity of labour demanded contracts and the quantity supplied expands (and, over time, more people train for the occupation), until the shortage is removed at a higher equilibrium wage.",
    rubric: [
      "Identifies the shortage as excess demand for labour at W₁",
      "Explains that competition among employers bids the wage up",
      "Explains that the higher wage reduces quantity demanded and raises quantity supplied until the market clears",
    ],
  }],
  [`${U}.s57`, {
    modelAnswer:
      "More productive workers produce more output per hour, so each worker is worth more to employers. The demand for labour increases (shifts right), which raises the equilibrium wage.",
    rubric: [
      "States the demand for labour increases (shifts right) because workers are more valuable",
      "States the equilibrium wage rises",
    ],
  }],
  [`${U}.s58`, {
    modelAnswer:
      "As the product falls out of favour, demand for the industry's output falls, so the derived demand for its labour also falls — the labour demand curve shifts left. The equilibrium wage falls and employment in the industry declines.",
    rubric: [
      "States the demand for labour decreases (shifts left)",
      "States the equilibrium wage falls",
      "States employment falls",
    ],
  }],
  [`${U}.s59`, {
    modelAnswer:
      "Rapid population growth increases the demand for housing — the demand curve shifts right. Because the supply of established housing is price-inelastic (nearly vertical), the increase in demand raises house prices sharply while the quantity of housing rises only slightly.",
    rubric: [
      "States the demand for housing increases (shifts right)",
      "States house prices rise sharply because supply is inelastic",
      "States the quantity of housing rises only a little",
    ],
  }],
  [`${U}.s60`, {
    modelAnswer:
      "Negative gearing raises the after-tax return to owning an investment property, so more investors want to buy housing — the demand curve shifts right. With price-inelastic supply, this pushes house prices up substantially and the quantity of housing rises only slightly.",
    rubric: [
      "States the demand for housing increases (shifts right)",
      "States house prices rise (substantially, given inelastic supply)",
      "Links the small quantity change to inelastic supply",
    ],
  }],
  [`${U}.s61`, {
    modelAnswer:
      "The planning reform lets many more dwellings be built, so the supply of housing increases — the supply curve shifts right. This lowers house prices and raises the quantity of housing.",
    rubric: [
      "States the supply of housing increases (shifts right)",
      "States house prices fall and the quantity of housing rises",
    ],
  }],
  [`${U}.s62`, {
    modelAnswer:
      "Strong Chinese growth increases demand for iron ore — the demand curve shifts right. Because supply expands only slowly (it is relatively inelastic in the short run), the price of iron ore rises sharply while the quantity sold rises only modestly.",
    rubric: [
      "States demand for iron ore increases (shifts right)",
      "States the price rises (sharply, given slow/inelastic supply)",
      "States the quantity rises only modestly",
    ],
  }],
  // s63 — coal export demand fall (reuse shiftAns pattern)
  shiftAns(63, 2, "demand", "decrease", "a global slowdown reduces the demand for coal, so less is demanded at every price", "falls", "falls"),
  [`${U}.s64`, {
    modelAnswer:
      "Cheaper mortgages let buyers borrow more and bid higher, so the demand for housing increases — the demand curve shifts right. With price-inelastic supply, house prices rise substantially while the quantity of housing rises only slightly.",
    rubric: [
      "States the demand for housing increases (shifts right)",
      "States house prices rise (substantially, given inelastic supply)",
      "States the quantity of housing rises only slightly",
    ],
  }],
];

// written micro — q21..q40
const microMoreAnswers: Array<[string, Answer]> = [
  micro(21,
    "The total outlay method judges elasticity by watching what happens to total revenue (price × quantity) when the price changes. If a price rise reduces total revenue (or a price fall raises it), demand is price-elastic. If a price rise raises total revenue (or a price fall reduces it), demand is price-inelastic. If total revenue is unchanged, demand is unit elastic.",
    [
      "States the method compares total revenue (price × quantity) before and after a price change",
      "States that revenue moving opposite to price means elastic demand",
      "States that revenue moving with price means inelastic demand (unchanged = unit elastic)",
    ]),
  micro(22,
    "Because demand is price-inelastic, raising fares causes only a small percentage fall in the number of tickets sold — smaller than the percentage rise in the fare. Since total revenue is fare multiplied by tickets sold, the gain from the higher fare outweighs the loss from fewer passengers, so total revenue rises.",
    [
      "States that with inelastic demand the % fall in quantity is smaller than the % rise in price",
      "Applies this to total revenue = price × quantity",
      "Concludes total revenue rises when fares are raised",
    ]),
  micro(23,
    "The price rises from $4 to $5, a 25% increase. Quantity demanded falls from 200 to 160, a 20% decrease. PED = %ΔQd ÷ %ΔP = 20 ÷ 25 = 0.8. Because this is less than 1, the demand for the good is price-inelastic — quantity demanded is not very responsive to the price change.",
    [
      "Calculates the percentage change in price (25%) and in quantity demanded (20%)",
      "Computes PED = 20 ÷ 25 = 0.8",
      "Interprets 0.8 as price-inelastic demand",
    ]),
  micro(24,
    "The price elasticity of supply measures the responsiveness of the quantity supplied of a good to a change in its price. It is calculated as the percentage change in quantity supplied divided by the percentage change in price.",
    [
      "Defines PES as the responsiveness of quantity supplied to a change in price",
      "States the formula: % change in quantity supplied ÷ % change in price",
    ]),
  micro(25,
    "Supply is more price-elastic when: (1) the time horizon is longer, giving firms time to adjust output; (2) firms have spare (excess) production capacity they can bring into use; (3) the good can be stored, so firms can build or run down stocks; and (4) the factors of production are mobile and can be moved into or out of the industry easily.",
    [
      "Time horizon: longer periods make supply more elastic",
      "Spare / excess capacity makes supply more elastic",
      "Ability to store the good (durability / stocks) makes supply more elastic",
      "Mobility of factors of production makes supply more elastic",
    ]),
  micro(26,
    "In the short run consumers are locked into habits, contracts and equipment, so they cannot easily change how much of a good they buy when its price changes. Over a longer period they can find or develop substitutes, change their habits, and adjust the equipment they own (for example switching to a more fuel-efficient car). Because there is more scope to respond, the quantity demanded becomes more responsive to price — demand becomes more elastic.",
    [
      "Explains that in the short run consumers are constrained (habits, contracts, equipment)",
      "Explains that over time consumers can find substitutes and adjust behaviour/equipment",
      "Concludes that more scope to respond makes demand more price-elastic",
    ]),
  micro(27,
    "If demand for its product is price-inelastic, a firm can raise its price and gain revenue, because the quantity sold falls by proportionally less than the price rises. If demand is price-elastic, raising the price would lose revenue because quantity sold falls by proportionally more, so the firm is more likely to hold or cut its price. Firms therefore use elasticity to work out how a price change will affect total revenue.",
    [
      "States that with inelastic demand a price rise raises total revenue",
      "States that with elastic demand a price rise lowers total revenue (so hold or cut price)",
      "Concludes the firm uses PED to predict the revenue effect of a price change",
    ]),
  micro(28,
    "A price elasticity of demand of 2.5 means that a 1% change in the price causes a 2.5% change in the quantity demanded in the opposite direction — demand is price-elastic (responsive). If the seller raises the price, the quantity sold falls by proportionally more than the price rises, so total revenue falls.",
    [
      "Interprets 2.5 as elastic: quantity changes 2.5% for each 1% price change (opposite direction)",
      "States that a price rise causes a proportionally larger fall in quantity",
      "Concludes total revenue falls",
    ]),
  micro(29,
    "A government might impose a price ceiling to keep an essential good (such as rental housing or petrol) affordable for lower-income consumers, especially during a shortage. An unintended consequence is that, by holding the price below equilibrium, it creates a persistent shortage: quantity demanded exceeds quantity supplied, producers supply less, and the good must be rationed by queues, waiting lists or a black market.",
    [
      "Gives a valid reason (keep an essential good affordable, protect consumers during a shortage)",
      "Identifies the unintended consequence: a persistent shortage",
      "Explains the shortage / non-price rationing that results from the price being held below equilibrium",
    ]),
  micro(30,
    "A government might impose a price floor to protect the incomes of producers (for example a minimum farm price) or of workers (a minimum wage), keeping earnings above the level the free market would set. An unintended consequence is a persistent surplus: quantity supplied exceeds quantity demanded. For a minimum wage this surplus is unemployment — more people want work at the higher wage than firms will hire.",
    [
      "Gives a valid reason (support producer incomes / protect low-paid workers)",
      "Identifies the unintended consequence: a persistent surplus",
      "Explains the surplus (for a minimum wage, that it is unemployment)",
    ]),
  micro(31,
    "A per-unit tax on producers adds to their costs, so the supply curve shifts up/left by the amount of the tax. The equilibrium price paid by consumers rises and the quantity traded falls; the price producers keep after tax is lower than before. Who bears most of the tax depends on the price elasticity of demand: if demand is inelastic, consumers keep buying despite the higher price, so consumers bear most of the tax; if demand is elastic, consumers cut back sharply, so producers must absorb more of the tax.",
    [
      "States the tax shifts supply up/left, raising the consumer price and lowering the quantity traded",
      "States the price producers receive after tax falls",
      "Explains that with inelastic demand consumers bear most of the tax",
      "Explains that with elastic demand producers bear more of the tax",
    ]),
  micro(32,
    "A per-unit subsidy paid to producers lowers their effective costs, shifting the supply curve down/right by the amount of the subsidy. The equilibrium price paid by consumers falls and the quantity traded rises. In terms of resource allocation, the subsidy draws more resources into producing this good than the free market would — output is higher than the level set by consumers' valuations and producers' unsubsidised costs.",
    [
      "States the subsidy shifts supply down/right, lowering the consumer price and raising the quantity traded",
      "States producers receive the market price plus the subsidy",
      "Explains that resources are drawn into producing more of this good than the free market would (over-allocation)",
    ]),
  micro(33,
    "In a competitive labour market, households supply labour (the supply curve slopes up — more people offer more hours as the wage rises) and firms demand labour (the demand curve slopes down — firms hire more workers at a lower wage). The equilibrium wage is where the quantity of labour demanded equals the quantity supplied; at that wage there is neither a shortage nor a surplus of workers.",
    [
      "Describes labour supply (households, upward sloping) and labour demand (firms, downward sloping)",
      "States equilibrium is where quantity of labour demanded equals quantity supplied",
      "Notes that at the equilibrium wage there is no shortage or surplus of labour",
    ]),
  micro(34,
    "A skill shortage means that at the current wage the quantity of labour demanded exceeds the quantity supplied. Employers compete for the scarce workers, bidding the wage up. The higher wage reduces the quantity of labour firms demand and, over time, encourages more people to train for or move into the occupation, increasing the quantity supplied, until the shortage is removed at a higher equilibrium wage and a higher level of employment than before the training response.",
    [
      "Identifies the skill shortage as excess demand for labour at the current wage",
      "Explains that competition among employers bids the wage up",
      "Explains that the higher wage and increased training eventually remove the shortage (higher wage, higher employment)",
    ]),
  micro(35,
    "The supply of labour is provided by households: it is the number of workers (or hours) willing and able to work at each wage, and it slopes upward because a higher wage attracts more people to work. The demand for labour comes from firms: it is the number of workers firms are willing to hire at each wage, and it slopes downward because labour is more costly at a higher wage and firms substitute towards capital.",
    [
      "Defines labour supply: households, quantity of labour offered at each wage (upward sloping)",
      "Defines labour demand: firms, quantity of labour hired at each wage (downward sloping)",
    ]),
  micro(36,
    "The supply of labour to an occupation is affected by: the wage paid relative to other occupations (a higher relative wage attracts more workers); and the education, training or qualifications required (the harder and longer the training, the fewer people can enter, reducing supply). Other valid factors include working conditions and non-wage benefits, and the size of the working-age population.",
    [
      "Factor 1: relative wage — a higher wage relative to other jobs increases labour supply",
      "Factor 2: required education/training/qualifications — harder entry reduces labour supply",
      "Each factor is correctly linked to the direction of the effect on labour supply",
    ]),
  micro(37,
    "The supply of established housing is price-inelastic because new dwellings take years to plan and build, land is limited, and the existing stock of housing is very large relative to what can be added in any year. So when demand rises, the quantity of housing can increase only slowly; most of the adjustment happens through price, and house prices rise sharply.",
    [
      "Explains that new housing is slow to build and the existing stock changes little each year",
      "Concludes supply is price-inelastic (quantity responds little to price)",
      "Explains that a rise in demand therefore raises price sharply rather than quantity",
    ]),
  micro(38,
    "Commodity prices are volatile because both demand and supply are relatively price-inelastic and slow to adjust. Demand depends on world industrial activity, which can change quickly, while supply is fixed in the short run by existing mines and takes years to expand. When demand shifts, the inelastic supply means the price moves a long way to clear the market. Manufactured goods have more flexible supply and closer substitutes, so their prices are more stable.",
    [
      "Explains that commodity demand can shift quickly (world industrial activity)",
      "Explains that commodity supply is inelastic / slow to adjust (existing mines, long lead times)",
      "Concludes that inelastic supply makes price swing a lot when demand shifts (vs stable manufactured-good prices)",
    ]),
  micro(39,
    "Rapid population growth increases the demand for housing, shifting the demand curve to the right. Because the supply of new housing responds only slowly (planning delays, construction time, limited land), the quantity of housing rises only a little in the short run. Most of the adjustment is through price, so house prices and rents rise sharply. Over time, if supply eventually catches up, price pressure eases; if it does not, prices stay high relative to incomes.",
    [
      "States population growth increases the demand for housing (rightward shift)",
      "Explains that slow supply response means quantity rises only a little in the short run",
      "Concludes that house prices/rents rise sharply (adjustment mainly through price)",
    ]),
  micro(40,
    "A demand-side factor is strong population growth (including immigration), which increases the number of households needing housing and raises demand. A supply-side factor is the slow, inelastic supply response caused by planning restrictions, construction lead times and limited well-located land, which prevents the quantity of housing from keeping up with demand.",
    [
      "Gives a valid demand-side factor (e.g. population growth / immigration / investor tax concessions / low interest rates)",
      "Gives a valid supply-side factor (e.g. planning restrictions / construction lead times / limited land)",
    ]),
];

export const answers: AnswerSet = Object.fromEntries([
  ...mcAnswers,
  ...mcMoreAnswers,
  ...shiftAnswers,
  ...diagramMoreAnswers,
  ...microAnswers,
  ...microMoreAnswers,
]);

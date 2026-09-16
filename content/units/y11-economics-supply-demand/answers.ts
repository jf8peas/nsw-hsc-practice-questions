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

// ==========================================================================
// SECOND EXPANSION — answers for m85..m168, s65..s128, q41..q80.
// ==========================================================================

const mcMore2Answers: Array<[string, Answer]> = [
  // movement along vs shift of a curve
  ma(85, "an expansion of demand — a movement down along the demand curve.", "A change in the good's own price causes a movement along the demand curve, not a shift — here a fall in price expands the quantity demanded."),
  ma(86, "an increase in demand — a rightward shift of the demand curve.", "Hot weather is a non-price factor (tastes/conditions), so the whole demand curve shifts right at every price."),
  ma(87, "a contraction of demand — a movement up along the demand curve.", "A rise in the good's own price causes a movement up along the existing demand curve, not a shift."),
  ma(88, "an expansion of supply — a movement up along the supply curve.", "A change in the good's own price causes a movement along the supply curve — here a price rise expands the quantity supplied."),
  ma(89, "a decrease in supply — the supply curve shifts to the left.", "The regulation raises production costs, a non-price factor, so the whole supply curve shifts left."),
  ma(90, "an increase in demand — the demand curve shifts to the right.", "For a normal good, higher income is a non-price factor that shifts demand right at every price."),
  ma(91, "a decrease in demand — the demand curve shifts to the left.", "For an inferior good, higher income reduces demand as consumers switch to preferred alternatives, shifting demand left."),
  ma(92, "increase the demand for cartridges — a rightward shift of the demand curve.", "Consoles and cartridges are complements, so a cheaper console raises demand for the complementary good."),
  ma(93, "increase the demand for bus travel — a rightward shift of the demand curve.", "Train and bus travel are substitutes, so dearer trains lead commuters to switch to buses, raising bus demand."),
  ma(94, "decrease now, as consumers wait for the cheaper new model.", "Expecting a cheaper substitute soon reduces the incentive to buy the current model now, shifting its demand left."),
  ma(95, "increase the demand for share-house rentals — a rightward shift of the demand curve.", "More students is an increase in the number of buyers, a non-price factor that shifts demand right."),
  ma(96, "increase — the supply curve shifts to the right.", "Lower unit costs from automation are a non-price factor that shifts the supply curve right."),
  ma(97, "increase — the supply curve shifts to the right.", "More firms in the market raises the quantity supplied at every price, shifting supply right."),
  ma(98, "decrease now, as they withhold stock to sell later at the higher price.", "Expecting a much higher future price gives producers an incentive to hold back current supply."),
  // equilibrium & the effect of shifts
  ma(99, "push the price down towards equilibrium, because a surplus exists.", "Above equilibrium, quantity supplied exceeds quantity demanded; unsold stock pushes the price back down."),
  ma(100, "push the price up towards equilibrium, because a shortage exists.", "Below equilibrium, quantity demanded exceeds quantity supplied; competition among buyers pushes the price back up."),
  ma(101, "definitely rise, but the effect on quantity traded depends on the relative size of the two shifts.", "An increase in demand and a decrease in supply both push price up, so price definitely rises; but they push quantity in opposite directions, so quantity is ambiguous."),
  ma(102, "definitely fall, but the effect on quantity traded depends on the relative size of the two shifts.", "A decrease in demand and an increase in supply both push price down, so price definitely falls; but they push quantity in opposite directions, so quantity is ambiguous."),
  ma(103, "definitely rise, but the effect on price depends on the relative size of the two shifts.", "An increase in demand and an increase in supply both raise quantity, so quantity definitely rises; but they push price in opposite directions, so price is ambiguous."),
  ma(104, "definitely fall, but the effect on price depends on the relative size of the two shifts.", "A decrease in demand and a decrease in supply both lower quantity, so quantity definitely falls; but they push price in opposite directions, so price is ambiguous."),
  ma(105, "An increase in demand, with the supply curve unchanged.", "With supply fixed, an increase in demand alone raises both the equilibrium price and quantity — the only option here with no offsetting shift."),
  ma(106, "A decrease in supply, with demand unchanged.", "With demand fixed, a decrease in supply raises the equilibrium price while lowering the equilibrium quantity."),
  ma(107, "definitely rise, while the effect on price is ambiguous without knowing the relative size of the shifts.", "Both a demand increase and a supply increase raise quantity, so quantity definitely rises; the two shifts push price in opposite directions, so price is ambiguous."),
  ma(108, "the price to remain stable, since the quantity demanded equals the quantity supplied.", "At equilibrium the plans of buyers and sellers coincide, so there is no tendency for the price to move unless something else changes."),
  ma(109, "both rise, as demand for the original good increases.", "Removing a substitute increases demand for the remaining good (a rightward shift with supply unchanged), raising both price and quantity."),
  ma(110, "definitely fall, while the effect on price is ambiguous without knowing the relative size of the shifts.", "Both a demand decrease and a supply decrease lower quantity, so quantity definitely falls; the two shifts push price in opposite directions, so price is ambiguous."),
  ma(111, "The equilibrium quantity rises.", "Both an increase in demand and an increase in supply push quantity up, so quantity is certain to rise regardless of the relative size of the shifts; price depends on which shift is larger."),
  ma(112, "The equilibrium price falls.", "Both a decrease in demand and an increase in supply push price down, so price is certain to fall regardless of the relative size of the shifts; quantity depends on which shift is larger."),
  // price elasticity of demand & supply
  ma(113, "2.5 — demand is price-elastic.", "PED = %ΔQd ÷ %ΔP = 20 ÷ 8 = 2.5. Because it is greater than 1, demand is price-elastic."),
  ma(114, "0.2 — demand is price-inelastic.", "PED = %ΔQd ÷ %ΔP = 3 ÷ 15 = 0.2. Because it is less than 1, demand is price-inelastic."),
  ma(115, "price-elastic.", "Many close substitutes and a large budget share both make demand more responsive to price — price-elastic."),
  ma(116, "A particular brand of soft drink, among many available brands.", "With many close substitute brands, buyers can easily switch away if its price rises, making demand for that one brand elastic. The others are necessities with few substitutes."),
  ma(117, "price-inelastic.", "If a price cut lowers total revenue, the percentage rise in quantity must be smaller than the percentage fall in price, so demand is inelastic."),
  ma(118, "price-inelastic.", "If a price rise raises total revenue, the percentage fall in quantity must be smaller than the percentage rise in price — demand is inelastic."),
  ma(119, "2.5 — supply is price-elastic.", "PES = %ΔQs ÷ %ΔP = 20 ÷ 8 = 2.5. Because it is greater than 1, supply is price-elastic."),
  ma(120, "0.25 — supply is price-inelastic.", "PES = %ΔQs ÷ %ΔP = 3 ÷ 12 = 0.25. Because it is less than 1, supply is price-inelastic."),
  ma(121, "it cannot be stored, so the quantity available on a given day is largely fixed regardless of price.", "Perishability prevents producers from holding stock to release later, so the quantity supplied responds little to price changes in the short run."),
  ma(122, "perfectly inelastic — the quantity supplied is essentially fixed and cannot respond to price.", "In the momentary period there is no time to produce more, so the available quantity is fixed no matter what happens to price."),
  ma(123, "passed on almost entirely to consumers, who continue to buy the same quantity.", "With perfectly inelastic demand, consumers keep buying the same quantity regardless of price, so they end up bearing the tax."),
  ma(124, "producers, because consumers can easily switch away if the price rises much.", "With elastic demand, raising the price much would lose too many sales, so producers absorb most of the tax instead of passing it on."),
  ma(125, "Bread (a necessity) — inelastic; overseas cruises (a luxury) — elastic.", "Necessities with few substitutes have inelastic demand; discretionary luxuries with many alternatives (including not travelling) have elastic demand."),
  ma(126, "higher (more elastic), because consumers can switch to more fuel-efficient cars or alternatives over time.", "Given more time, consumers have more ways to respond to a price change, so demand becomes more elastic in the long run."),
  // government intervention
  ma(127, "producers supply less bread at the low price, worsening the shortage.", "Because the ceiling holds price below equilibrium, producers are only willing to supply the smaller quantity corresponding to that low price, widening the gap between quantity demanded and supplied."),
  ma(128, "petrol stations run short of stock and queues form, as a shortage develops.", "A price held below equilibrium means quantity demanded exceeds quantity supplied — a shortage, often rationed by queues."),
  ma(129, "increase demand for housing and mostly raise prices rather than the quantity of housing.", "The grant raises what buyers can pay, shifting demand right; since supply is price-inelastic, most of the adjustment shows up as higher prices."),
  ma(130, "buy up and store (or otherwise dispose of) the resulting surplus.", "A binding floor creates a persistent surplus (quantity supplied exceeds quantity demanded) that the government must absorb to maintain the floor price."),
  ma(131, "decrease supply, raising the price paid by buyers and reducing the number of luxury cars sold.", "A per-unit tax raises producers' costs, shifting supply left, which raises the price and lowers the quantity traded."),
  ma(132, "reduces the quantity consumed by raising the price, discouraging a good with negative health effects.", "The tax shifts supply left, raising price and reducing the quantity of alcohol consumed — the intended health effect."),
  ma(133, "keep their price lower for consumers, since supply does not shift left as it would with a tax.", "Without the GST added, producers' effective costs (and hence the price) are lower than they would be if the tax applied."),
  ma(134, "discourage investment in new rental housing, worsening the long-run shortage.", "A binding rent ceiling reduces the return to landlords, discouraging new rental supply and deepening the shortage over time."),
  ma(135, "lowers the price paid by consumers while still raising the return to producers, whereas a price floor raises the price paid by consumers.", "A subsidy shifts supply right (lower consumer price, more output); a price floor instead holds the price above equilibrium, raising what consumers pay."),
  ma(136, "none — the ceiling is not binding because the market already trades at that price.", "A ceiling only has an effect if it is set below the equilibrium price; set at equilibrium it does not constrain the market."),
  ma(137, "have no effect, because the market price is already above the (non-binding) floor.", "A floor only binds if set above equilibrium; a floor below equilibrium is irrelevant because the market already trades higher than it."),
  ma(138, "A subsidy.", "A subsidy is a government payment to producers, typically funded from general taxation, to lower their effective costs."),
  ma(139, "a per-unit indirect tax intended to raise the price and reduce the quantity of sugary drinks consumed.", "Levied on manufacturers per unit sold, the sugar tax shifts supply left, raising price and reducing quantity — the policy's goal."),
  ma(140, "Indirect tax — producers pay the tax to the government; subsidy — the government pays producers.", "A tax is a payment from producers to government; a subsidy is a payment from government to producers — opposite directions of cash flow."),
  // labour markets
  ma(141, "raise the equilibrium wage and increase employment.", "Stronger demand for tradespeople shifts the labour demand curve right, raising both the wage and the quantity of labour employed."),
  ma(142, "restrict the supply of labour to that profession, keeping wages higher than they would otherwise be.", "A costly, lengthy qualification limits how many people can enter, shifting labour supply left and keeping wages elevated."),
  ma(143, "slow the adjustment of wages and employment across regional labour markets.", "If workers cannot move to where jobs and higher wages are, wage and employment differences between regions persist longer."),
  ma(144, "decrease the supply of labour, raising the equilibrium wage.", "Fewer working-age people means the labour supply curve shifts left, raising the equilibrium wage."),
  ma(145, "an increase in the supply of labour to that kind of work.", "More people willing to do this work at each wage is a rightward shift of the labour supply curve."),
  ma(146, "increase.", "A more valuable marginal product raises what firms are willing to pay for an extra worker, shifting labour demand right."),
  ma(147, "attract workers from the lower-paying occupation, increasing labour supply to the higher-paying one and narrowing the gap.", "Workers move toward better-paid opportunities over time, increasing supply to the higher-paying job and easing the wage gap."),
  ma(148, "hiring fewer workers or reducing hours, since labour is now relatively more expensive.", "A binding minimum wage above equilibrium raises the cost of hiring, so firms in low-margin industries respond by cutting jobs or hours."),
  ma(149, "A fall in nurses' wages relative to other professions requiring similar training.", "Lower relative pay makes nursing less attractive, reducing the number of people willing to train for and enter the profession."),
  ma(150, "A housing construction boom increasing the demand for new dwellings.", "More building activity raises the derived demand for construction labour, shifting labour demand right. The other options reduce demand or don't affect it."),
  ma(151, "More people undertaking electrical apprenticeships, increasing the supply of qualified electricians.", "A rightward shift in the supply of qualified electricians closes the gap between quantity demanded and quantity supplied at the current wage."),
  ma(152, "The long, costly training required for doctors restricts labour supply relative to strong demand, while checkout work needs little training and has abundant labour supply.", "Scarce, hard-to-obtain skills combined with strong demand raise the equilibrium wage; abundant, easily obtained skills keep it low."),
  ma(153, "reduce the demand for labour in that industry, lowering wages and employment.", "Because labour demand is derived from the demand for output, less demand for the industry's product reduces the demand for its workers."),
  ma(154, "either the demand for labour or the supply of labour shifts.", "As in any competitive market, the equilibrium wage and quantity change only when one of the two curves shifts."),
  // property & commodity markets
  ma(155, "decrease demand for housing, and because supply is slow to adjust, prices fall more than the quantity of housing does.", "Costlier mortgages reduce what buyers can afford, shifting demand left; with inelastic supply most of the adjustment is in price."),
  ma(156, "make the supply of housing more price-inelastic, so demand-side pressures mainly raise prices rather than the quantity of homes.", "Zoning restricts how much new housing can be built even if prices rise, making supply less responsive to price."),
  ma(157, "price-inelastic, so most of the initial adjustment happens through price rather than quantity.", "Because new mines take years to develop, the quantity supplied cannot respond quickly, so demand shocks mostly move the price."),
  ma(158, "decrease supply, raising the price and lowering the quantity traded.", "A coordinated production cut shifts the supply curve left, raising the price and reducing the quantity traded."),
  ma(159, "fall, as supply increases relative to demand.", "A bumper harvest shifts supply right; with demand unchanged, the equilibrium price falls and quantity rises."),
  ma(160, "speculative demand, which adds to demand alongside people who want somewhere to live.", "Buying an asset mainly for expected future price gains is speculative demand, a component of total demand for housing."),
  ma(161, "increase the supply of housing, easing upward pressure on prices.", "More available land lets more dwellings be built, shifting the housing supply curve right and moderating prices."),
  ma(162, "Demand for rental housing rises faster than supply, so a larger share of the relatively fixed rental stock is occupied.", "With population growing faster than new dwellings, a greater proportion of existing rentals are tenanted, so vacancy rates fall."),
  ma(163, "commodity supply cannot expand or contract quickly, so shifts in demand cause large price swings rather than large quantity changes.", "Inelastic supply means quantity barely adjusts to a demand shock, so nearly all of the adjustment shows up as a price change."),
  ma(164, "decrease the demand for housing from investors, easing some upward pressure on prices.", "A less attractive after-tax return makes property investment less appealing, shifting investor demand left."),
  ma(165, "lower prices, since supply cannot quickly contract to match the fall in demand.", "With supply slow to adjust, a fall in demand for commodities mostly shows up as a lower price rather than a large quantity change."),
  ma(166, "increase the supply of housing in that area and moderate price growth compared with areas without the reform.", "More approvals allow more dwellings to be built, shifting supply right and easing price pressure relative to areas without the reform."),
  ma(167, "raise its price rather than the quantity produced.", "Because new supply cannot be brought on quickly, an unexpected demand increase mostly raises price with only a small change in quantity."),
  ma(168, "restrict the supply of new housing in the short run, adding to upward pressure on prices.", "Holding land off the market keeps it out of the supply of developable housing, reducing how much new supply reaches buyers."),
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

// more general curve-shift diagrams — s65..s96
const shiftAnswers2: Array<[string, Answer]> = [
  shiftAns(65, 3, "demand", "decrease", "the operating system update makes older models much less desirable, so tastes shift away from them and less is demanded at every price", "falls", "falls"),
  shiftAns(66, 3, "demand", "increase", "streaming is a substitute for cinema, so dearer cinema tickets lead consumers to switch to streaming, raising its demand at every price", "rises", "rises"),
  shiftAns(67, 3, "demand", "increase", "the health article shifts consumer tastes towards avocados, raising demand at every price", "rises", "rises"),
  shiftAns(68, 3, "demand", "decrease", "the cheaper digital textbook is a substitute, so students switch away from the printed textbook, reducing its demand at every price", "falls", "falls"),
  shiftAns(69, 3, "supply", "decrease", "petrol is a major cost for ride-share drivers, so a higher petrol price raises costs and less is supplied at every price", "rises", "falls"),
  shiftAns(70, 3, "supply", "increase", "a second airline adds to the number of suppliers, so more seats are supplied at every price", "falls", "rises"),
  shiftAns(71, 3, "supply", "decrease", "the poor cocoa harvest reduces a key input, raising costs, so less chocolate can be supplied at every price", "rises", "falls"),
  shiftAns(72, 3, "demand", "increase", "the awareness campaign shifts tastes towards using sunscreen, raising demand at every price", "rises", "rises"),
  shiftAns(73, 3, "supply", "decrease", "fewer retailers means fewer suppliers, so less camping gear is supplied at every price", "rises", "falls"),
  shiftAns(74, 3, "supply", "decrease", "the chip shortage raises the cost of key components, so fewer gaming PCs can be supplied at every price", "rises", "falls"),
  shiftAns(75, 3, "demand", "increase", "exam anxiety shifts tastes towards seeking tutoring, raising demand at every price", "rises", "rises"),
  shiftAns(76, 3, "demand", "decrease", "the rival's cheaper, better model is a substitute, so consumers switch away from this brand, reducing its demand at every price", "falls", "falls"),
  shiftAns(77, 3, "demand", "increase", "new cars are a substitute, so their higher price leads buyers to switch to secondhand cars, raising demand at every price", "rises", "rises"),
  shiftAns(78, 3, "supply", "increase", "wider stocking and cheaper processing lower costs and raise availability, so more is supplied at every price", "falls", "rises"),
  shiftAns(79, 3, "demand", "increase", "the forecast heatwaves shift tastes towards buying air conditioners, raising demand at every price", "rises", "rises"),
  shiftAns(80, 3, "supply", "decrease", "restricting suppliers to plantation timber only reduces the sources of firewood, so less can be supplied at every price", "rises", "falls"),
  shiftAns(81, 3, "demand", "decrease", "ride-share is a substitute for taxis, so cheaper ride-share fares lead consumers to switch away from taxis, reducing demand at every price", "falls", "falls"),
  shiftAns(82, 3, "supply", "decrease", "the drought damages the olive harvest, reducing the quantity of olive oil that can be supplied at every price", "rises", "falls"),
  shiftAns(83, 3, "supply", "decrease", "the bee disease reduces honey production, so less can be supplied at every price", "rises", "falls"),
  shiftAns(84, 3, "demand", "increase", "the colder forecast shifts tastes towards wool jumpers, raising demand at every price", "rises", "rises"),
  shiftAns(85, 3, "demand", "decrease", "losing headline acts makes the festival less appealing, shifting tastes away from it and reducing demand for tickets at every price", "falls", "falls"),
  shiftAns(86, 3, "supply", "increase", "approving many more sharing schemes adds to the number of suppliers, so more e-scooter trips are supplied at every price", "falls", "rises"),
  shiftAns(87, 2, "supply", "increase", "compatibility with many more brands increases the number of pod suppliers, so more pods are supplied at every price", "falls", "rises"),
  shiftAns(88, 2, "demand", "increase", "the social media trend shifts tastes towards board games, raising demand at every price", "rises", "rises"),
  shiftAns(89, 2, "supply", "decrease", "the storm season disrupts fishing fleets, reducing the catch that can be supplied at every price", "rises", "falls"),
  shiftAns(90, 2, "demand", "increase", "the health advisory shifts tastes towards using hand sanitiser, raising demand at every price", "rises", "rises"),
  shiftAns(91, 2, "supply", "decrease", "higher driver wages raise costs for delivery companies, so less is supplied at every price", "rises", "falls"),
  shiftAns(92, 2, "demand", "decrease", "consumers expect a cheaper e-bike once the rebate starts, so they delay buying and demand less now", "falls", "falls"),
  shiftAns(93, 2, "demand", "increase", "the early warm spring shifts tastes towards garden furniture, raising demand at every price", "rises", "rises"),
  shiftAns(94, 2, "supply", "increase", "the cheaper pigment lowers production costs, so more paint is supplied at every price", "falls", "rises"),
  shiftAns(95, 2, "demand", "decrease", "with the drought over, tastes shift away from umbrellas, reducing demand at every price", "falls", "falls"),
  shiftAns(96, 2, "demand", "increase", "driving is a substitute for public transport, so dearer petrol leads commuters to switch to public transport, raising its demand at every price", "rises", "rises"),
];

// more government intervention diagrams — s97..s106
const diagramGov2Answers: Array<[string, Answer]> = [
  [`${U}.s97`, {
    modelAnswer:
      "At the ceiling price Pᶜ, below equilibrium, the quantity of the medicine demanded exceeds the quantity supplied. Suppliers offer less at the low price while demand stays high, so the market is in a shortage that persists because the price is not allowed to rise to clear it.",
    rubric: [
      "States that at Pᶜ the quantity demanded rises / quantity supplied falls compared with equilibrium",
      "Identifies that quantity demanded exceeds quantity supplied",
      "Concludes the market is in a (persistent) shortage",
    ],
  }],
  [`${U}.s98`, {
    modelAnswer:
      "At the floor price Pᶠ, above equilibrium, coffee growers supply more while buyers purchase less. Quantity supplied exceeds quantity demanded, so there is a surplus of coffee beans that the agreement's members may need to buy up or store.",
    rubric: [
      "States that at Pᶠ the quantity supplied rises / quantity demanded falls compared with equilibrium",
      "Identifies that quantity supplied exceeds quantity demanded",
      "Concludes the market is in a (persistent) surplus",
    ],
  }],
  [`${U}.s99`, {
    modelAnswer:
      "The per-bag tax adds to retailers' costs, so the supply curve shifts up/left by the amount of the tax. At the new equilibrium the price paid by consumers is higher and the quantity of bags traded is lower.",
    rubric: [
      "States the supply curve shifts up / to the left (by the amount of the tax)",
      "States the price paid by consumers rises",
      "States the quantity traded falls",
    ],
  }],
  [`${U}.s100`, {
    modelAnswer:
      "The per-unit subsidy lowers installers' effective costs, so the supply curve shifts down/right by the amount of the subsidy. At the new equilibrium the price paid by consumers is lower and the quantity of installations is higher.",
    rubric: [
      "States the supply curve shifts down / to the right (by the amount of the subsidy)",
      "States the price paid by consumers falls",
      "States the quantity traded rises",
    ],
  }],
  [`${U}.s101`, {
    modelAnswer:
      "At the ceiling price Pᶜ, below the rapidly rising equilibrium price, the quantity demanded exceeds the quantity supplied. Retailers have less sanitiser than shoppers want at the low price, so the market is in a shortage — often rationed by limits per customer or empty shelves.",
    rubric: [
      "States quantity demanded rises / quantity supplied falls at Pᶜ",
      "Concludes there is a (persistent) shortage",
    ],
  }],
  [`${U}.s102`, {
    modelAnswer:
      "The luxury car tax raises manufacturers'/importers' costs, shifting the supply curve up/left, so the equilibrium price of luxury cars rises and the quantity traded falls. A government might want this because luxury cars are bought mainly by higher-income buyers, so the tax raises revenue relatively equitably while only modestly affecting overall car ownership.",
    rubric: [
      "States the equilibrium price rises",
      "States the equilibrium quantity falls",
      "Gives a valid government motive (revenue from higher-income buyers / equity, with limited effect on essential transport)",
    ],
  }],
  [`${U}.s103`, {
    modelAnswer:
      "At the floor price Pᶠ, above equilibrium, farmers supply a larger quantity of the grain while buyers purchase a smaller quantity. Quantity supplied exceeds quantity demanded, so the market is in a surplus equal to the difference.",
    rubric: [
      "States quantity supplied rises and quantity demanded falls at Pᶠ",
      "Concludes there is a surplus (quantity supplied exceeds quantity demanded)",
    ],
  }],
  [`${U}.s104`, {
    modelAnswer:
      "The per-vehicle subsidy lowers manufacturers' effective costs, shifting the supply curve down/right. At the new equilibrium the price paid by consumers for electric vehicles is lower and the quantity sold is higher, encouraging the switch away from petrol cars.",
    rubric: [
      "States the supply curve shifts down / to the right (by the amount of the subsidy)",
      "States the price paid by consumers falls",
      "States the quantity traded rises",
    ],
  }],
  [`${U}.s105`, {
    modelAnswer:
      "First, because Pᶜ is below equilibrium, the quantity of rental housing demanded exceeds the quantity supplied, creating a persistent shortage of rentals. Second, landlords earn a lower return at the capped rent, so some withdraw properties from the rental market or stop maintaining them, and fewer new rental properties are built, worsening the shortage over time.",
    rubric: [
      "Consequence 1: a persistent shortage of rental housing (quantity demanded exceeds quantity supplied at Pᶜ)",
      "Consequence 2: reduced landlord returns discourage new rental supply / maintenance over time",
      "Links both consequences to the rent being held below the market-clearing level",
    ],
  }],
  [`${U}.s106`, {
    modelAnswer:
      "The per-unit tax raises manufacturers' costs, shifting the supply curve up/left, so the equilibrium price of sugary cereals rises and the quantity traded falls.",
    rubric: [
      "States the equilibrium price rises",
      "States the equilibrium quantity falls",
    ],
  }],
];

// more labour market diagrams — s107..s117
const diagramLabour2Answers: Array<[string, Answer]> = [
  [`${U}.s107`, {
    modelAnswer:
      "The gig economy attracts many more people willing to work flexible hours, so the supply of labour for delivery riding increases — the labour supply curve shifts right. This lowers the equilibrium wage per delivery, but the equilibrium quantity of riders employed rises.",
    rubric: [
      "States the supply of labour increases (shifts right)",
      "States the equilibrium wage falls",
      "States the quantity of labour employed rises",
    ],
  }],
  [`${U}.s108`, {
    modelAnswer:
      "Self-service checkouts substitute machines for workers, so firms need fewer checkout operators at every wage — the labour demand curve shifts left. This lowers the equilibrium wage and reduces the level of employment for checkout operators.",
    rubric: [
      "States the demand for labour decreases (shifts left)",
      "States the equilibrium wage falls",
      "States employment falls",
    ],
  }],
  [`${U}.s109`, {
    modelAnswer:
      "Easier entry for qualified overseas nurses increases the number of people able to work in the profession, so the supply of labour increases — the labour supply curve shifts right. This lowers the equilibrium wage but raises the quantity of nurses employed.",
    rubric: [
      "States the supply of labour increases (shifts right)",
      "States the equilibrium wage falls",
      "States the quantity of labour employed rises",
    ],
  }],
  [`${U}.s110`, {
    modelAnswer:
      "The new mining project raises the demand for FIFO workers, shifting the labour demand curve right. This raises the equilibrium wage and increases the level of employment in that occupation.",
    rubric: [
      "States the demand for labour increases (shifts right)",
      "States the equilibrium wage rises",
      "States employment rises",
    ],
  }],
  [`${U}.s111`, {
    modelAnswer:
      "With venues closed, the derived demand for hospitality workers falls, shifting the labour demand curve left. This lowers the equilibrium wage and reduces the level of employment in hospitality.",
    rubric: [
      "States the demand for labour decreases (shifts left)",
      "States the equilibrium wage falls",
      "States employment falls",
    ],
  }],
  [`${U}.s112`, {
    modelAnswer:
      "The stricter, more costly licensing requirements make it harder to become an electrician, reducing the supply of labour — the labour supply curve shifts left. This raises the equilibrium wage but reduces the quantity of electricians employed.",
    rubric: [
      "States the supply of labour decreases (shifts left)",
      "States the equilibrium wage rises",
      "States the quantity of labour employed falls",
    ],
  }],
  [`${U}.s113`, {
    modelAnswer:
      "The popular new degree increases the number of graduates qualified as data analysts, increasing the supply of labour — the labour supply curve shifts right. This lowers the equilibrium wage for data analysts.",
    rubric: [
      "States the supply of labour increases (shifts right)",
      "States the equilibrium wage falls",
    ],
  }],
  [`${U}.s114`, {
    modelAnswer:
      "At the minimum wage Wₘ, above the equilibrium wage for junior retail workers, the quantity of labour supplied rises (more people want these jobs) while the quantity demanded falls (firms hire fewer workers at the higher wage). Employment falls to the quantity demanded at Wₘ, leaving a labour surplus (unemployment) equal to the gap between quantity supplied and quantity demanded.",
    rubric: [
      "States the quantity of labour demanded falls at Wₘ",
      "States the quantity of labour supplied rises at Wₘ",
      "Concludes employment falls and there is a labour surplus (unemployment)",
    ],
  }],
  [`${U}.s115`, {
    modelAnswer:
      "At W₁ there is excess demand for aged-care labour — a shortage. Providers competing for scarce workers bid the wage up. As the wage rises, the quantity of labour demanded contracts and the quantity supplied expands (and, over time, more people may train for or enter the occupation), until the shortage is reduced at a higher equilibrium wage.",
    rubric: [
      "Identifies the shortage as excess demand for labour at W₁",
      "Explains that competition among providers bids the wage up",
      "Explains that the higher wage reduces quantity demanded and raises quantity supplied until the market adjusts",
    ],
  }],
  [`${U}.s116`, {
    modelAnswer:
      "The relocation subsidy makes rural teaching more attractive, increasing the number of teachers willing to work there — the labour supply curve shifts right. This lowers the equilibrium wage needed to attract teachers to rural schools.",
    rubric: [
      "States the supply of labour increases (shifts right)",
      "States the equilibrium wage falls",
    ],
  }],
  [`${U}.s117`, {
    modelAnswer:
      "As readers move online, demand for the industry's print product falls, and because labour demand is derived from the demand for output, the demand for print journalists falls too — the labour demand curve shifts left. This lowers the equilibrium wage and reduces employment among print journalists.",
    rubric: [
      "States the demand for labour decreases (shifts left)",
      "States the equilibrium wage falls",
      "States employment falls",
    ],
  }],
];

// more property & commodity diagrams — s118..s128
const diagramProperty2Answers: Array<[string, Answer]> = [
  [`${U}.s118`, {
    modelAnswer:
      "Higher mortgage costs reduce what buyers can afford to pay, so the demand for housing decreases — the demand curve shifts left. Because the supply of established housing is price-inelastic, house prices fall substantially while the quantity of housing sold falls only slightly.",
    rubric: [
      "States the demand for housing decreases (shifts left)",
      "States house prices fall (substantially, given inelastic supply)",
      "States the quantity of housing falls only slightly",
    ],
  }],
  [`${U}.s119`, {
    modelAnswer:
      "The production cut decreases supply — the supply curve shifts left. With demand unchanged, the equilibrium price of oil rises and the quantity traded falls.",
    rubric: [
      "States supply decreases (shifts left)",
      "States the price rises",
      "States the quantity falls",
    ],
  }],
  [`${U}.s120`, {
    modelAnswer:
      "The bumper harvest increases supply — the supply curve shifts right. With demand unchanged, the equilibrium price of wheat falls and the quantity traded rises.",
    rubric: [
      "States supply increases (shifts right)",
      "States the price falls and the quantity rises",
    ],
  }],
  [`${U}.s121`, {
    modelAnswer:
      "Releasing more land allows more dwellings to be built, so the supply of housing increases — the supply curve shifts right. This lowers house prices and raises the quantity of housing available.",
    rubric: [
      "States the supply of housing increases (shifts right)",
      "States house prices fall",
      "States the quantity of housing rises",
    ],
  }],
  [`${U}.s122`, {
    modelAnswer:
      "The mine closure decreases supply — the supply curve shifts left. Because new supply cannot be brought on quickly, the equilibrium price of copper rises and the quantity traded falls.",
    rubric: [
      "States supply decreases (shifts left)",
      "States the price rises and the quantity falls",
    ],
  }],
  [`${U}.s123`, {
    modelAnswer:
      "Becoming the most liveable place shifts tastes towards living in the town, increasing the demand for housing there — the demand curve shifts right. Because supply is price-inelastic, house prices rise sharply while the quantity of housing rises only slightly.",
    rubric: [
      "States the demand for housing increases (shifts right)",
      "States house prices rise sharply because supply is inelastic",
      "States the quantity of housing rises only a little",
    ],
  }],
  [`${U}.s124`, {
    modelAnswer:
      "Rapid growth in electric vehicle production increases demand for lithium — the demand curve shifts right. Because mining output takes years to expand, the equilibrium price of lithium rises sharply while the quantity traded rises only modestly.",
    rubric: [
      "States demand for lithium increases (shifts right)",
      "States the price rises (sharply, given slow supply) and the quantity rises only modestly",
    ],
  }],
  [`${U}.s125`, {
    modelAnswer:
      "Removing the tax concession makes property investment less attractive, so the demand for housing decreases — the demand curve shifts left. With price-inelastic supply, house prices fall substantially while the quantity of housing falls only slightly.",
    rubric: [
      "States the demand for housing decreases (shifts left)",
      "States house prices fall (substantially, given inelastic supply)",
      "States the quantity of housing falls only slightly",
    ],
  }],
  [`${U}.s126`, {
    modelAnswer:
      "Political instability disrupts mining and reduces supply — the supply curve shifts left. With demand unchanged, the equilibrium price of the commodity rises and the quantity traded falls.",
    rubric: [
      "States supply decreases (shifts left)",
      "States the price rises and the quantity falls",
    ],
  }],
  [`${U}.s127`, {
    modelAnswer:
      "Allowing many more apartments to be approved and built increases the supply of housing in the area — the supply curve shifts right. This lowers prices in the area and raises the quantity of housing available.",
    rubric: [
      "States the supply of housing increases (shifts right)",
      "States prices fall",
      "States the quantity of housing rises",
    ],
  }],
  [`${U}.s128`, {
    modelAnswer:
      "The global slowdown reduces demand for Australian coal — the demand curve shifts left. Because mines cannot quickly reduce output, the equilibrium price of coal falls while the quantity sold falls only slightly.",
    rubric: [
      "States demand for coal decreases (shifts left)",
      "States the price falls (with only a small change in quantity, given slow-adjusting supply)",
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

// written micro — q41..q80
const microMore2Answers: Array<[string, Answer]> = [
  micro(41,
    "The price fell by 10% and quantity demanded rose by 18%. PED = %ΔQd ÷ %ΔP = 18 ÷ 10 = 1.8. Because this is greater than 1, demand for the good is price-elastic — quantity demanded is quite responsive to the price change.",
    [
      "Identifies the percentage change in price (10%) and in quantity demanded (18%)",
      "Computes PED = 18 ÷ 10 = 1.8",
      "Interprets 1.8 as price-elastic demand",
    ]),
  micro(42,
    "The price rose by 12% and quantity supplied rose by 6%. PES = %ΔQs ÷ %ΔP = 6 ÷ 12 = 0.5. Because this is less than 1, supply of the good is price-inelastic — quantity supplied is not very responsive to the price change.",
    [
      "Identifies the percentage change in price (12%) and in quantity supplied (6%)",
      "Computes PES = 6 ÷ 12 = 0.5",
      "Interprets 0.5 as price-inelastic supply",
    ]),
  micro(43,
    "In the short run drivers are locked into their existing cars and routines, so they cannot easily reduce how much petrol they buy when its price rises. In the long run they can buy more fuel-efficient or electric vehicles, move closer to work, or use public transport more, giving them far more ways to respond. This greater scope to adjust makes demand for petrol more price-elastic the longer the time period considered.",
    [
      "Explains that in the short run consumers are constrained (existing vehicles/routines)",
      "Explains that over time consumers can adopt substitutes (efficient cars, public transport, relocating)",
      "Concludes demand becomes more elastic over a longer time period",
    ]),
  micro(44,
    "Total revenue is price multiplied by quantity, so how it responds to a price change depends on elasticity. If demand is inelastic, a price rise increases revenue (quantity falls proportionally less than price rises) and a price fall decreases revenue. If demand is elastic, a price rise decreases revenue and a price fall increases revenue. If demand is unit elastic, revenue is unchanged either way.",
    [
      "States that total revenue = price × quantity",
      "Explains the inelastic case (price and revenue move together)",
      "Explains the elastic case (price and revenue move in opposite directions)",
    ]),
  micro(45,
    "When a good has many close substitutes, consumers can easily switch to an alternative if its price rises, so the quantity demanded falls by a large percentage — demand is elastic. When a good has few or no substitutes, consumers have nowhere else to go and keep buying roughly the same quantity, so demand is inelastic.",
    [
      "Explains that many close substitutes let buyers switch away easily, making demand more elastic",
      "Explains that few substitutes mean buyers have no alternative, making demand more inelastic",
    ]),
  micro(46,
    "A perishable good cannot be held back and sold later, so producers must sell whatever they have produced regardless of the current price — the quantity supplied barely changes when price changes, making supply inelastic. A good that can be stockpiled lets producers release more from storage when the price rises and hold back stock when it falls, so the quantity supplied responds much more to price, making supply more elastic.",
    [
      "Explains that a perishable good must be sold regardless of price, so quantity supplied is largely fixed",
      "Concludes this makes supply of the perishable good inelastic",
      "Explains that a storable good lets producers vary how much reaches the market, making its supply more elastic",
    ]),
  micro(47,
    "When a good takes up only a small share of a consumer's budget (e.g. salt), a price change has little effect on their overall spending power, so they keep buying roughly the same quantity — demand is inelastic. When a good takes up a large share of the budget (e.g. rent or a car), a price change noticeably affects what consumers can afford, so they respond more strongly by changing the quantity they buy — demand is more elastic.",
    [
      "Explains that a small budget share means a price change barely affects spending power",
      "Concludes this makes demand for that good inelastic",
      "Explains that a large budget share makes demand more elastic, since a price change noticeably affects what consumers can afford",
    ]),
  micro(48,
    "Demand is price-elastic when the percentage change in quantity demanded is larger than the percentage change in price (PED > 1); a price rise then reduces total revenue and a price fall raises it. Demand is price-inelastic when the percentage change in quantity is smaller than the percentage change in price (PED < 1); a price rise then raises total revenue and a price fall reduces it. Demand is unit elastic when the two percentage changes are equal (PED = 1); a price change then leaves total revenue unchanged.",
    [
      "Defines elastic (PED > 1) and states a price rise lowers revenue",
      "Defines inelastic (PED < 1) and states a price rise raises revenue",
      "Defines unit elastic (PED = 1)",
      "States a price change leaves revenue unchanged when unit elastic",
    ]),
  micro(49,
    "A binding price ceiling holds the price below equilibrium, so the quantity demanded exceeds the quantity supplied — a shortage. Because it is illegal to charge more than the ceiling in the legal market, some buyers who cannot obtain the good legally are willing to pay more, creating an incentive for an illegal (black) market where the good is resold above the ceiling price.",
    [
      "States the ceiling creates a shortage (quantity demanded exceeds quantity supplied)",
      "Explains that frustrated buyers are willing to pay more than the ceiling",
      "Concludes this creates an incentive for illegal resale above the ceiling price (a black market)",
    ]),
  micro(50,
    "A per-unit tax shifts the supply curve up/left, raising the price consumers pay and lowering the quantity traded. If demand is price-inelastic, consumers keep buying nearly the same quantity despite the higher price, so most of the tax is passed on to them. If demand is price-elastic, consumers cut back sharply rather than pay much more, so producers must absorb more of the tax themselves by accepting a lower after-tax price.",
    [
      "States the tax shifts supply left, raising the consumer price",
      "Explains that inelastic demand means consumers bear most of the tax",
      "Explains that elastic demand means producers bear more of the tax",
    ]),
  micro(51,
    "A price floor and a subsidy can both raise producers' income, but they work differently. A price floor holds the market price above equilibrium, which raises the price consumers pay and can create an unsold surplus that the government may need to buy and store. A subsidy instead pays producers directly per unit, which lowers the price consumers pay and raises the quantity traded without necessarily creating an unsold surplus. An advantage of the subsidy is that it supports producer income while keeping the good more affordable for consumers.",
    [
      "Describes a price floor: raises the price paid by consumers and can create a surplus",
      "Describes a subsidy: a direct payment that lowers the price paid by consumers and raises the quantity traded",
      "States an advantage of the subsidy (keeps the good affordable / avoids an unsold surplus)",
    ]),
  micro(52,
    "A price ceiling only affects a market if it is set below the equilibrium price, forcing sellers to charge less than they otherwise would. If the ceiling is set above equilibrium, the market already trades at a lower, equilibrium price, so the ceiling is not binding and has no effect on the price or quantity traded.",
    [
      "States a ceiling above equilibrium is not binding",
      "Explains that the market continues to trade at the (lower) equilibrium price and quantity",
    ]),
  micro(53,
    "A direct tax is paid straight to the government by the person or business it is levied on and cannot easily be passed on to someone else — for example, personal income tax. An indirect tax is levied on producers or sellers of a good or service but is typically passed on to consumers through a higher price — for example, the Goods and Services Tax (GST).",
    [
      "Defines a direct tax: paid directly by the taxed party, not easily shifted",
      "Gives a valid Australian example of a direct tax (e.g. income tax)",
      "Defines an indirect tax (levied on sellers but passed on via price) with a valid Australian example (e.g. GST)",
    ]),
  micro(54,
    "A per-unit tax raises producers' costs, shifting supply up/left and raising the equilibrium price. When demand is price-inelastic, consumers keep buying almost the same quantity even at the higher price, so producers can pass on most of the tax as a higher price without losing many sales.",
    [
      "States the tax shifts supply left",
      "States this raises the equilibrium price",
      "Explains that inelastic demand means quantity barely falls, so producers can pass on most of the tax",
    ]),
  micro(55,
    "A government might subsidise a good to make it more affordable or to encourage its production and consumption — for example, subsidising renewable energy to support the transition away from fossil fuels. The subsidy lowers producers' effective costs, shifting the supply curve down/right, which lowers the price consumers pay and increases the quantity produced and consumed.",
    [
      "Gives a valid reason for a subsidy (affordability / encouraging a socially desirable good)",
      "States the subsidy shifts supply down/right",
      "States this lowers the price consumers pay and raises the quantity traded",
    ]),
  micro(56,
    "A shortage of workers means that at the current wage the quantity of labour demanded exceeds the quantity supplied. Employers compete for the scarce workers, bidding the wage up. The higher wage makes the occupation more attractive, and over time more people train for or move into it, increasing the supply of labour until the shortage narrows and a new, higher equilibrium wage is reached.",
    [
      "Identifies the shortage as excess demand for labour at the current wage",
      "Explains that competition among employers bids the wage up",
      "Explains that the higher wage attracts more workers over time, increasing supply and narrowing the shortage",
    ]),
  micro(57,
    "Labour is not wanted for its own sake but because it is used to produce goods and services that consumers want. The demand for labour is therefore 'derived' from the demand for the output that labour helps to produce — if demand for that output rises or falls, the demand for the labour used to make it rises or falls with it.",
    [
      "States labour demand comes from the demand for the output labour is used to produce",
      "Explains that a change in output demand causes a matching change in labour demand",
    ]),
  micro(58,
    "A minimum wage set above the equilibrium wage raises the cost of hiring, so firms reduce the quantity of labour they demand, while the higher wage attracts more people wanting to work, increasing the quantity of labour supplied. Because the quantity supplied now exceeds the quantity demanded, there is a surplus of labour — unemployment — among those willing to work at the minimum wage but unable to find a job.",
    [
      "States the quantity of labour demanded falls at the minimum wage",
      "States the quantity of labour supplied rises at the minimum wage",
      "Concludes the resulting surplus of labour is unemployment",
    ]),
  micro(59,
    "The demand for labour in an industry increases when demand for the industry's output rises, since labour demand is derived from output demand. It also increases when workers become more productive (each worker adds more value to output), making firms willing to hire more workers or pay higher wages for the same number of workers.",
    [
      "Factor 1: a rise in demand for the industry's output (derived demand) increases labour demand",
      "Explains why (more output needed → more workers hired)",
      "Factor 2: an increase in worker productivity increases labour demand",
    ]),
  micro(60,
    "The supply of labour to an occupation increases when the wage paid rises relative to other occupations, attracting more workers to switch in. It also increases when more people gain the qualifications or training the occupation requires, or when migration brings in more workers with the relevant skills.",
    [
      "Factor 1: a higher relative wage attracts more workers, increasing labour supply",
      "Factor 2: more people gaining the required qualifications increases labour supply",
      "Factor 2 (alt.): skilled migration into the occupation increases labour supply",
    ]),
  micro(61,
    "Where machines can perform tasks previously done by workers, automation reduces the number of workers firms need for a given level of output, so the demand for labour in that industry decreases — the labour demand curve shifts left. This tends to lower the equilibrium wage and reduce employment for the workers whose tasks are automated, although it may increase demand for other workers (such as technicians who maintain the machines).",
    [
      "States automation decreases the demand for labour whose tasks are replaced (shifts left)",
      "States this lowers the equilibrium wage and/or reduces employment for those workers",
      "Notes automation may increase demand for other labour (e.g. technicians/maintenance)",
    ]),
  micro(62,
    "The demand for labour comes from firms: it is the quantity of labour firms are willing and able to hire at each wage, and it slopes downward because labour becomes relatively more expensive at a higher wage. The supply of labour comes from households: it is the quantity of labour people are willing and able to offer at each wage, and it slopes upward because a higher wage attracts more people into the workforce or occupation.",
    [
      "Defines labour demand: firms, downward sloping (quantity hired at each wage)",
      "Defines labour supply: households, upward sloping (quantity offered at each wage)",
    ]),
  micro(63,
    "Faster population growth increases the demand for housing more strongly in fast-growing cities. Because the supply of established housing is price-inelastic in every city — new dwellings take years to build regardless of location — most of this extra demand shows up as higher prices rather than a much larger quantity of housing, so prices rise more where population growth (and hence demand growth) is fastest.",
    [
      "States that faster population growth means a bigger increase in housing demand",
      "States that inelastic supply means most of the adjustment is through price, not quantity",
      "Concludes prices rise more in the faster-growing city",
    ]),
  micro(64,
    "The supply of housing is price-inelastic in the short run because new dwellings take a long time to plan, approve and build, so builders cannot quickly add to the housing stock even if prices rise. In addition, the amount of well-located, buildable land is limited, especially in established suburbs, further constraining how much new supply can be brought to market quickly.",
    [
      "Reason 1: construction and approval times mean new supply cannot be added quickly",
      "Explains this limits how much the quantity supplied can respond to price in the short run",
      "Reason 2: limited available (well-located) land further constrains how much new housing can be built",
    ]),
  micro(65,
    "Commodity demand can shift quickly — for example, when a large economy's industrial activity speeds up or slows down — while commodity supply is largely fixed by existing mines or farms and takes years to expand or contract. Because supply is slow and price-inelastic, a shift in demand has to be absorbed mostly through price rather than quantity, making commodity prices swing much more than the prices of manufactured goods, whose producers can more easily adjust output.",
    [
      "Explains that commodity demand can shift quickly (e.g. changes in industrial activity)",
      "Explains that commodity supply is slow to adjust / price-inelastic (fixed mines, land, long lead times)",
      "Concludes that inelastic supply forces price to do most of the adjusting, making commodity prices more volatile",
    ]),
  micro(66,
    "Lower interest rates reduce mortgage repayments and increase how much buyers can borrow, so the demand for housing increases — the demand curve shifts right. Because the supply of established housing is price-inelastic, this extra demand raises house prices substantially while the quantity of housing sold rises only slightly.",
    [
      "States lower interest rates increase the demand for housing (shifts right)",
      "Explains that inelastic supply means most of the adjustment is through price",
      "Concludes house prices rise substantially while quantity rises only a little",
    ]),
  micro(67,
    "A government can influence the supply side of the housing market through planning and zoning reform — for example, approving more land for development or allowing higher-density building — which makes it easier and faster for developers to add new dwellings, shifting the housing supply curve to the right.",
    [
      "Gives a valid supply-side policy (e.g. planning/zoning reform, land release, faster approvals)",
      "Explains that it shifts the housing supply curve right (more dwellings can be built)",
    ]),
  micro(68,
    "A sudden increase in world demand for a mineral shifts the demand curve for it to the right. Because bringing a new mine into production takes years of exploration, approval and construction, the quantity supplied cannot increase quickly to match the higher demand. As a result, most of the adjustment happens through price: the price of the mineral rises sharply in the short run, and only rises in quantity once new supply eventually comes online.",
    [
      "States the demand increase shifts the demand curve right",
      "Explains that supply cannot expand quickly (long lead times for new mines)",
      "Concludes the price rises sharply in the short run while quantity adjusts only slowly",
    ]),
  micro(69,
    "A bumper harvest shifts the supply curve for the crop to the right, increasing the quantity sold but lowering its price. Demand for many agricultural staples is price-inelastic, meaning the percentage fall in price is larger than the percentage rise in quantity sold. Since total income is price multiplied by quantity, the large fall in price can outweigh the rise in quantity, so farmers' total income falls even though they have produced and sold more.",
    [
      "States the bumper harvest increases supply, lowering price and raising quantity sold",
      "States that demand for the crop is price-inelastic",
      "Explains that with inelastic demand a large price fall can outweigh the quantity rise, reducing total income",
    ]),
  micro(70,
    "A change in the quantity supplied is a movement along the existing supply curve, caused only by a change in the good's own price. A change in supply is a shift of the whole supply curve, caused by a change in a non-price factor such as input costs, technology, taxes or the number of firms in the industry.",
    [
      "Defines a change in quantity supplied as a movement along the curve caused by the good's own price",
      "Defines a change in supply as a shift of the curve caused by a non-price factor",
    ]),
  micro(71,
    "A change in the price of a substitute good is a non-price factor for the good in question — its own price has not changed. Because only a change in a good's own price causes a movement along its demand curve, a change in a substitute's price must instead shift the whole demand curve, changing the quantity demanded at every price.",
    [
      "States a substitute's price change is a non-price factor for the good itself",
      "Explains this is why it shifts the demand curve rather than causing a movement along it",
    ]),
  micro(72,
    "The price mechanism allocates scarce resources in a market economy through its three functions: the signalling function, where changing prices tell producers and consumers about changing scarcity or demand; the incentive function, where price changes motivate producers to expand or contract output and motivate consumers to buy more or less; and the rationing function, where the price distributes a limited quantity to the buyers most willing and able to pay for it. Together these functions direct resources towards producing what consumers value most, without any central planner.",
    [
      "Names and explains at least two of the three functions (signalling, incentive, rationing)",
      "Links the functions to the allocation of scarce resources without central planning",
      "Explanation is coherent and accurate for each function named",
    ]),
  micro(73,
    "One determinant of demand other than price is consumer income. If income rises and the good is a normal good, consumers can afford to buy more of it at every price, so the whole demand curve shifts to the right (an increase in demand).",
    [
      "Names a valid non-price determinant of demand (income, tastes, price of a substitute/complement, population, expectations)",
      "Correctly explains how a change in it shifts the demand curve (direction and reasoning)",
    ]),
  micro(74,
    "One determinant of supply other than price is the cost of production. If input costs (such as wages or raw materials) fall, it becomes cheaper to produce the good, so firms are willing to supply more at every price, shifting the whole supply curve to the right (an increase in supply).",
    [
      "Names a valid non-price determinant of supply (input costs, technology, taxes/subsidies, number of firms, expectations)",
      "Correctly explains how a change in it shifts the supply curve (direction and reasoning)",
    ]),
  micro(75,
    "The demand curve already shows, for a fixed set of other conditions, how the quantity demanded changes as the good's own price changes — so a change in that price simply moves buyers to a different point on the same curve (a movement along it). A non-price factor, such as income or tastes, is not represented on the axes of the diagram; when it changes, the whole relationship between price and quantity demanded changes, which can only be shown by drawing a new curve — a shift of the curve.",
    [
      "Explains that the curve already plots quantity demanded against the good's own price",
      "States a price change therefore moves buyers along the same curve",
      "Explains that a non-price factor changes the underlying relationship, requiring a new curve — a shift",
    ]),
  micro(76,
    "An increase in demand and a decrease in supply both push the equilibrium price up, so the price is certain to rise. However, the increase in demand raises the equilibrium quantity while the decrease in supply lowers it, so these two effects work in opposite directions on quantity — without knowing which shift is larger, the effect on the equilibrium quantity cannot be determined.",
    [
      "States the price is certain to rise (both shifts push price in the same direction)",
      "States the two shifts push quantity in opposite directions",
      "Concludes the effect on quantity is ambiguous without knowing the relative size of the shifts",
    ]),
  micro(77,
    "If the price is above equilibrium, quantity supplied exceeds quantity demanded — sellers are left with unsold stock and cut their price to sell it, pushing the price down towards equilibrium. If the price is below equilibrium, quantity demanded exceeds quantity supplied — buyers who cannot obtain the good bid the price up, pushing it towards equilibrium. In both cases, the imbalance between quantity demanded and supplied itself creates pressure that moves the price back to the level where the two are equal.",
    [
      "Explains that a surplus (price above equilibrium) causes sellers to cut the price",
      "Explains that a shortage (price below equilibrium) causes buyers to bid the price up",
      "Concludes both cases push the price back towards equilibrium",
    ]),
  micro(78,
    "A shortage occurs when the price is below equilibrium, so the quantity demanded exceeds the quantity supplied. A surplus occurs when the price is above equilibrium, so the quantity supplied exceeds the quantity demanded.",
    [
      "Defines a shortage: price below equilibrium, quantity demanded exceeds quantity supplied",
      "Defines a surplus: price above equilibrium, quantity supplied exceeds quantity demanded",
    ]),
  micro(79,
    "If consumers expect the price of a good to rise in the near future, they have an incentive to buy it now before the price goes up, increasing current demand — for example, shoppers stockpiling fuel before an expected price rise, shifting the demand curve for fuel to the right at today's price.",
    [
      "States that expecting a higher future price increases current demand",
      "Explains why (an incentive to buy now before the price rises)",
      "Gives a valid, correctly reasoned example, identifying the rightward shift of demand",
    ]),
  micro(80,
    "If producers expect the price of a good to rise significantly in the near future, they have an incentive to hold back some of their current output and sell it later at the higher price, decreasing current supply — for example, wine producers ageing stock instead of selling it now, shifting the current supply curve for wine to the left.",
    [
      "States that expecting a higher future price decreases current supply",
      "Explains why (an incentive to withhold stock and sell later at the higher price)",
      "Gives a valid, correctly reasoned example, identifying the leftward shift of supply",
    ]),
];

export const answers: AnswerSet = Object.fromEntries([
  ...mcAnswers,
  ...mcMoreAnswers,
  ...mcMore2Answers,
  ...shiftAnswers,
  ...diagramMoreAnswers,
  ...shiftAnswers2,
  ...diagramGov2Answers,
  ...diagramLabour2Answers,
  ...diagramProperty2Answers,
  ...microAnswers,
  ...microMoreAnswers,
  ...microMore2Answers,
]);

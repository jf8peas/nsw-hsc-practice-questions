import type { ExplanationTable } from "../../explanation-helpers";

// ANSWER KEY — why each wrong multiple-choice option is wrong (spec 002). Shown to a student only
// after they answer that question. Each entry is [the start of the wrong option's text, the
// explanation]; the helper resolves it to the full option text and fails if it does not match
// exactly one wrong option. Original wording, one or two sentences each.

export const explanations: ExplanationTable = {
  1: [
    ["As the price of the good rises, demand decreases", "A price rise reduces the quantity demanded, which is a movement along the curve. 'Demand' decreasing would mean the whole curve shifts."],
    ["The price of the good and", "Price and quantity demanded are related: when price is higher, buyers want less."],
    ["As the price of the good rises, the quantity demanded rises", "That would give an upward-sloping demand curve. For most goods, a higher price makes buyers buy less."],
  ],
  2: [
    ["The quantity supplied depends only", "Costs matter, but price matters too. A higher price makes it more profitable to produce, so producers supply more."],
    ["As the price of a good rises, the quantity supplied falls", "It is the other way round. A higher price makes supplying more profitable, so the quantity supplied rises."],
    ["As the price of a good rises, supply decreases", "A rise in price increases the quantity supplied. A decrease in supply would mean the whole curve shifts left."],
  ],
  3: [
    ["an increase in demand", "A change in the good's own price moves you along the demand curve. A shift of the curve needs a change in something other than price."],
    ["a decrease in demand", "A fall in the price causes a movement along the curve, not a shift. Buyers want more at the lower price."],
    ["a leftward shift of the supply", "A fall in a good's own price causes a movement along curves. It does not shift the supply curve."],
  ],
  4: [
    ["shift the supply curve to the left", "The good's own price change causes a movement along the supply curve. A leftward shift would need something else, such as higher costs."],
    ["decrease supply", "A higher price makes producers supply a larger quantity, which is a movement along the curve, not a decrease in supply."],
    ["shift the supply curve to the right", "A change in the good's own price causes a movement along the curve. A rightward shift needs a non-price cause, such as better technology."],
  ],
  5: [
    ["Consumers buy more coffee because", "A price fall causes a larger quantity demanded along the same curve. A change in demand needs something other than price."],
    ["A café sells fewer", "A price rise leads to a smaller quantity demanded along the same curve, which is not a change in demand."],
    ["Consumers buy less", "A higher price reduces the quantity demanded along the curve. A change in demand is a shift."],
  ],
  6: [
    ["a downward slope", "Every demand curve slopes downward. An increase in demand means the whole curve moves to the right."],
    ["moved because", "A change in the good's own price moves along the curve. An increase in demand is a shift caused by something else."],
    ["become steeper", "A steeper curve means demand is less responsive to price. An increase in demand shifts the curve right."],
  ],
  7: [
    ["decrease the demand for coffee", "When tea gets dearer, some people switch to coffee. That increases the demand for coffee."],
    ["have no effect", "Substitutes are linked: a dearer substitute pushes buyers toward this good."],
    ["cause an expansion", "The price of tea affects demand for coffee, not supply. And an expansion of supply would be a movement along the curve."],
  ],
  8: [
    ["cause a contraction", "A contraction of demand is a movement along the curve from a price rise. Here cheaper petrol shifts the demand for cars."],
    ["decrease the supply of cars", "Cheaper petrol affects what buyers want, not what car makers supply."],
    ["decrease the demand for cars", "Cars and petrol are complements, so cheaper petrol makes owning a car cheaper to run and raises demand for cars."],
  ],
  9: [
    ["expand along", "The price of beef has not changed, so there is no movement along the curve. Lower income shifts the curve."],
    ["increase — the demand curve shifts to the right", "A recession lowers incomes, and for a normal good lower income means lower demand."],
    ["be unchanged", "Demand changes when incomes change, even if the good's own price stays the same."],
  ],
  10: [
    ["expand along", "A change in income shifts the demand curve. A movement along it comes from a change in the good's own price."],
    ["stay exactly", "Income affects demand for inferior goods. Richer buyers switch to better alternatives."],
    ["increase — the demand", "That would be a normal good. For an inferior good, higher income reduces demand."],
  ],
  11: [
    ["shift the supply", "Buyers' expectations change demand, not supply."],
    ["decrease now", "Expecting a higher price makes buying now more attractive, so demand today rises."],
    ["contract along", "A contraction is a move along the curve caused by a higher price. Here the expectation shifts the whole curve."],
  ],
  12: [
    ["An improvement in the technology", "Technology lowers costs, which is a supply factor. It affects supply, not demand."],
    ["A new tax", "A tax on producers raises their costs, which shifts supply, not demand."],
    ["A fall in the price of a factor", "Cheaper inputs affect producers' costs, so this shifts supply, not demand."],
  ],
  13: [
    ["the quantity demanded expands", "An expansion along the curve comes from a lower price. A change in tastes shifts the whole curve."],
    ["the demand curve becomes vertical", "A vertical curve would mean demand does not respond to price at all. Tastes shift the curve, but its slope stays similar."],
    ["supply increases", "Advertising changes what buyers want. It does not change the costs or number of producers, so supply stays put."],
  ],
  14: [
    ["the quantity of butter", "The price of butter has not changed, so there is no movement along the curve. The price of a substitute shifts the curve."],
    ["the supply of butter", "Margarine's price affects what buyers want, so it changes demand for butter, not its supply."],
    ["the demand for butter increases", "Cheaper margarine makes buyers switch away from butter, so the demand for butter decreases."],
  ],
  15: [
    ["A change in the price of a substitute", "The price of a related good shifts the demand curve."],
    ["A change in consumer tastes", "A change in tastes shifts the whole demand curve."],
    ["A change in consumer incomes", "Income shifts the demand curve."],
  ],
  16: [
    ["contract along", "A contraction is caused by a lower price. Cheaper production shifts the whole supply curve."],
    ["be unaffected", "Lower costs make firms willing to supply more at each price, even before the price changes."],
    ["decrease — the supply curve shifts to the left", "Lower costs make supplying more profitable, so supply increases, not decreases."],
  ],
  17: [
    ["shift to the right", "Higher wages raise costs, which makes producers supply less at every price, shifting the curve left."],
    ["not move", "The wage is a cost of production, so a rise shifts the whole supply curve, not just the quantity."],
    ["become horizontal", "A horizontal curve means perfectly elastic supply. A higher wage shifts the curve left instead."],
  ],
  18: [
    ["shift to the right.", "A tax raises costs, so firms supply less at each price. That moves the curve left."],
    ["not shift", "A tax on producers is a cost that applies at every price, so it shifts the whole supply curve."],
    ["shift right, then left", "The tax shifts the curve once, to the left. It does not move right first."],
  ],
  19: [
    ["expand along", "New firms add to supply at every price. That shifts the curve, not just moves along it."],
    ["decrease — the supply", "More firms means more output at each price, so supply increases."],
    ["stay unchanged", "More firms produce more, so market supply increases."],
  ],
  20: [
    ["cause a contraction", "A subsidy lowers producers' costs, which makes them supply more, not less."],
    ["shift the demand curve", "A subsidy paid to producers affects supply. It does not change what buyers want."],
    ["decrease supply", "A subsidy reduces effective costs, so supply increases and the curve shifts to the right."],
  ],
  21: [
    ["increase — the supply", "A drought destroys part of the crop, so less can be supplied at every price."],
    ["expand along", "A drought shifts the supply curve left. It does not move along the curve."],
    ["not change until", "The drought cuts what farmers can supply at any price, so supply falls straight away."],
  ],
  22: [
    ["shift the demand curve", "Producers' expectations affect supply, not demand."],
    ["increase now", "If producers expect a higher price later, they hold stock back to sell then, so current supply falls."],
    ["expand along", "An expansion is a movement along the curve caused by a price change. Expectations shift the whole curve."],
  ],
  23: [
    ["A fall in the number", "Fewer producers means less supply, not more."],
    ["A rise in the wages", "Higher wages raise costs and so reduce supply."],
    ["A new tax", "A tax raises costs and reduces supply."],
  ],
  24: [
    ["consumers pay the highest", "Equilibrium is where the quantities match. Some buyers would have been willing to pay more, which is consumer surplus."],
    ["there is a shortage", "A shortage happens below the equilibrium price. At equilibrium, demand equals supply."],
    ["there is a surplus", "A surplus happens above the equilibrium price. At equilibrium, demand equals supply."],
  ],
  25: [
    ["the market is in equilibrium", "P₁ is above the equilibrium price, so the quantities supplied and demanded do not match."],
    ["the quantity demanded exceeds", "That is a shortage, which happens below the equilibrium price. Above it there is a surplus."],
    ["demand will shift left", "The surplus is removed by the price falling, which moves along the curves, not by the demand curve shifting."],
  ],
  26: [
    ["a leftward shift", "A price below equilibrium creates a shortage and does not shift a curve. The price rises to fix it."],
    ["no imbalance", "Markets only clear at the equilibrium price. Below it, buyers want more than sellers offer."],
    ["a surplus", "A surplus is when the price is above equilibrium. Below equilibrium there is a shortage."],
  ],
  27: [
    ["price to rise and the quantity to fall", "More demand pushes the price up, and the higher price encourages more to be supplied, so the quantity rises too."],
    ["price to fall and the quantity to rise", "More demand against fixed supply creates a shortage, which raises the price."],
    ["price and quantity to both fall", "These are the effects of a decrease in demand. An increase pushes both up."],
  ],
  28: [
    ["price to fall and the quantity to fall", "More supply leads to a surplus at the old price, so the price falls, and a lower price means more is bought, so the quantity rises."],
    ["price to rise and the quantity to fall", "These are the effects of a decrease in supply. An increase in supply lowers the price."],
    ["price to rise and the quantity to rise", "These are the effects of an increase in demand. A rise in supply pushes the price down."],
  ],
  29: [
    ["price to rise and the quantity to fall", "Those are the effects of a decrease in supply. Less demand lowers both price and quantity."],
    ["price and quantity to be unchanged", "A shift in demand moves the equilibrium to a new price and quantity."],
    ["price to fall and the quantity to rise", "A lower price comes with a lower quantity when demand falls. A rising quantity comes from a supply increase."],
  ],
  30: [
    ["price and quantity to both fall", "Both fall when demand decreases. With less supply, the price rises."],
    ["price to fall and the quantity to rise", "These are the effects of an increase in supply. Less supply raises the price and cuts the quantity."],
    ["price and quantity to both rise", "Both rise when demand increases. Less supply means a smaller quantity."],
  ],
  31: [
    ["Price falls and quantity falls", "Better technology increases supply, so more is traded, not less."],
    ["Price rises and quantity falls", "That is the effect of a decrease in supply. Better technology increases supply."],
    ["Price rises and quantity rises", "More supply lowers the price. A price rise with more quantity comes from higher demand."],
  ],
  32: [
    ["Price rises and quantity falls", "More popularity increases demand, so more is traded, not less."],
    ["Price falls and quantity falls", "A fall in both comes from decreased demand. Greater popularity raises demand."],
    ["Price falls and quantity rises", "A price fall with more quantity comes from an increase in supply. Popularity raises demand, which pushes the price up."],
  ],
  33: [
    ["Price rises and quantity rises", "Both rise when demand increases. A drought cuts supply, so less is traded."],
    ["Price falls and quantity rises", "That is the effect of an increase in supply. A drought reduces supply."],
    ["Price falls and quantity falls", "A drought makes oranges scarcer, so the price goes up."],
  ],
  34: [
    ["A decrease in the price of hamburgers", "Cheaper hamburgers draw buyers away from pizza, which lowers demand and the price."],
    ["A fall in consumer interest", "Less interest reduces demand, which lowers the price."],
    ["A report showing", "A health scare lowers demand for pizza, which pushes the price down."],
  ],
  35: [
    ["the government setting", "Signalling is done by market prices themselves, not by the government setting them."],
    ["high prices encouraging", "That is the incentive function. Signalling is about prices carrying information."],
    ["the price distributing", "That is the rationing function. Signalling is about prices carrying information."],
  ],
  36: [
    ["prices being fixed", "The incentive function depends on prices changing, not being fixed."],
    ["the price distributing", "That is the rationing function. The incentive function is how price changes alter behaviour."],
    ["prices carrying", "That is the signalling function. Incentives are about changing what people do."],
  ],
  37: [
    ["prices signalling", "That is the signalling function. Rationing is about sharing out a limited supply."],
    ["higher prices motivating", "That is the incentive function. Rationing is about who gets the limited supply."],
    ["the government allocating", "Government allocation is a different way to share goods out. Rationing by price is done by the market."],
  ],
  38: [
    ["the price rising, which shifts", "The rising price moves buyers and sellers along their curves. It does not shift the demand curve."],
    ["the supply curve shifting", "The shortage is removed by price changes along the curves. The supply curve does not move by itself."],
    ["the price falling", "In a shortage the price rises. A falling price would make the shortage worse."],
  ],
  39: [
    ["A rise in the price of a key", "Dearer inputs raise costs, which shifts the supply curve left."],
    ["A new per-unit tax", "A tax raises costs, which shifts supply left."],
    ["Several firms leaving", "Fewer firms means less supply, which shifts the curve left."],
  ],
  40: [
    ["An improvement", "Better technology shifts the supply curve, not the demand curve."],
    ["A fall in consumer incomes", "For a normal good lower incomes shift demand to the left, not right."],
    ["A new per-unit tax", "A tax on producers shifts the supply curve, not demand."],
  ],
  41: [
    ["a decrease in demand", "The café cut its price and sold more. That is a movement along the demand curve."],
    ["a shift of the supply", "Cutting the price is a move along the demand curve. It does not shift supply."],
    ["an increase in demand", "A shift in demand needs a non-price cause. Here the price change caused the extra sales."],
  ],
  42: [
    ["a shift of the demand", "A higher price for wheat causes growers to supply more. That is a movement along the supply curve."],
    ["a decrease in supply", "Growers supplied more, not less, and it came from the higher price."],
    ["an increase in supply", "A shift in supply needs a non-price cause. Here the higher price caused the larger quantity."],
  ],
  43: [
    ["a movement along the supply", "Beach umbrellas demanded at every price means demand has shifted. It is not about the supply curve."],
    ["a contraction of demand", "A contraction means buyers want less because of a higher price. Here they want more at every price."],
    ["an expansion of demand", "An expansion is a movement along the curve caused by a lower price. Here the whole curve shifts."],
  ],
  44: [
    ["a decrease in supply", "The bakery can supply more, so supply has increased."],
    ["a movement along the demand", "This is about the bakery's ability to supply, so it is about the supply curve."],
    ["an expansion of supply", "An expansion is a movement along the curve caused by a higher price. Better technology shifts the whole curve."],
  ],
  45: [
    ["2.0", "2.0 is the answer when you divide the other way round. Elasticity is 10 ÷ 20."],
    ["10 —", "10 is just the quantity change. Divide by the 20% price change to get 0.5."],
    ["0.5 — demand is price-elastic", "The value is right but the label is wrong. A value below 1 means demand is inelastic."],
  ],
  46: [
    ["0.33", "That divides the price change by the quantity change. Elasticity is the quantity change divided by the price change: 15 ÷ 5."],
    ["3 — demand is price-inelastic", "The value is right, but a value above 1 means elastic demand."],
    ["1 —", "Unit elasticity needs the percentage changes to be equal. Here quantity changes three times as much as price."],
  ],
  47: [
    ["a 4% increase", "A price rise makes buyers want less, so the quantity demanded falls."],
    ["a 2.5%", "Multiply the elasticity by the price change: 0.4 × 10 = 4. Dividing 10 by 0.4 gives a different number."],
    ["a 40%", "The elasticity is 0.4, not 4, so the quantity changes by 0.4 times the price change."],
  ],
  48: [
    ["stay the same", "Total revenue is price times quantity. With inelastic demand, the price rise outweighs the small drop in quantity."],
    ["fall, because", "That is what happens when demand is elastic. With inelastic demand, quantity falls by less than price rises."],
    ["fall to zero", "Buyers still buy much of what they bought before, so revenue does not fall to zero."],
  ],
  49: [
    ["rise, because demand is elastic", "With elastic demand the quantity falls by more than the price rises, so revenue falls."],
    ["rise, because higher", "Higher prices do not always raise revenue. If demand is elastic, the fall in quantity is bigger than the rise in price."],
    ["stay the same", "Revenue stays the same only with unit-elastic demand. Here demand is elastic, so revenue falls."],
  ],
  50: [
    ["at zero", "Revenue is not zero. Price and quantity both stay above zero."],
    ["higher", "With unit elasticity the quantity falls by the same percentage as price rises, so the two effects cancel."],
    ["lower", "With unit elasticity the quantity falls by the same percentage as price rises, so revenue does not change."],
  ],
  51: [
    ["Overseas holidays", "Holidays are luxuries that can be postponed or swapped for others, so demand is more elastic."],
    ["One particular brand", "There are many close substitutes for a single brand, so buyers can easily switch. That makes demand elastic."],
    ["Restaurant meals", "Eating out can be cut back or swapped for eating at home, so demand is fairly elastic."],
  ],
  52: [
    ["it takes up a very small", "A small share of the budget makes buyers less sensitive to price, which makes demand less elastic."],
    ["it is a necessity", "A necessity with no substitutes has to be bought whatever the price, so demand is inelastic."],
    ["consumers must decide", "A short time to adjust makes demand less elastic. More time makes it more elastic."],
  ],
  53: [
    ["petrol takes up", "Petrol is a smaller share of most budgets, and a large share would make demand more elastic, not less."],
    ["there are many close", "There are few close substitutes for petrol. Many substitutes would make demand elastic."],
    ["consumers have plenty", "In the short run people cannot change much, such as moving house or buying a new car. More time makes demand more elastic."],
  ],
  54: [
    ["2.5", "That divides the other way round. Elasticity of supply is 4 ÷ 10."],
    ["0.4 — supply is price-elastic", "The value is right but the label is wrong. A value below 1 means inelastic supply."],
    ["6 —", "6 is the difference between the two percentages. Elasticity is the quantity change divided by the price change."],
  ],
  55: [
    ["the time period", "A very short period makes supply less elastic, because firms cannot change output quickly."],
    ["the factors of production", "Hard-to-move inputs make it difficult to raise output, so supply is less elastic."],
    ["the good is perishable", "A perishable good cannot be stored, so supply cannot respond to price easily. That makes it inelastic."],
  ],
  56: [
    ["there are many substitutes", "Substitutes affect demand. Supply is inelastic because of the time it takes to grow."],
    ["farmers can instantly", "Crops take a season to grow, so farmers cannot respond to a price rise straight away."],
    ["crops can be stored", "Storage would help supply respond. The problem is the time it takes to grow more."],
  ],
  57: [
    ["the market clears", "At a ceiling below the equilibrium price, buyers want more than sellers will supply, so the market does not clear."],
    ["a surplus", "A surplus is where supply exceeds demand, which happens at prices above equilibrium. A ceiling below equilibrium causes a shortage."],
    ["an increase in supply", "A ceiling holds the price down, which gives sellers less reason to supply, so supply does not increase."],
  ],
  58: [
    ["a decrease in demand", "A price floor does not change what buyers want. It holds the price above equilibrium and creates a surplus."],
    ["the market clears", "At a floor above the equilibrium price, sellers offer more than buyers will take, so the market does not clear."],
    ["a shortage", "A shortage happens when the price is below equilibrium. A floor above equilibrium creates a surplus."],
  ],
  59: [
    ["increase the quantity", "A lower rent gives landlords less reason to supply housing, so the quantity supplied falls."],
    ["have no effect", "A binding ceiling holds rent below the market level, so it does affect the market."],
    ["eliminate", "Cheaper rent raises demand and cuts supply, so the shortage gets worse, not better."],
  ],
  60: [
    ["leave", "The tax raises producers' costs, which reduces supply, so the equilibrium price and quantity change."],
    ["shift the demand", "A tax on producers affects supply. It does not change what buyers want."],
    ["shift the supply curve right", "A tax raises costs, which reduces supply and shifts the curve left. A rightward shift would lower the price."],
  ],
  61: [
    ["perfectly elastic", "If demand is perfectly elastic, buyers will not pay any higher price at all, so the sellers bear the tax."],
    ["relatively price-elastic", "When demand is elastic buyers cut back sharply if the price rises, so producers have to absorb most of the tax."],
    ["unrelated", "How much buyers respond to price affects who bears the tax. With inelastic demand consumers carry more."],
  ],
  62: [
    ["Price falls and quantity falls", "A subsidy increases supply, so more is traded, not less."],
    ["Price rises and quantity falls", "A subsidy lowers producers' costs. That increases supply, which lowers the price."],
    ["Price rises and quantity rises", "More supply lowers the price. A price rise with more quantity would come from a rise in demand."],
  ],
  63: [
    ["Company", "Company tax is paid by the firm on its own profit, so it is a direct tax."],
    ["The Medicare", "The Medicare levy is paid by the person on their own income, so it is a direct tax."],
    ["Personal", "Income tax is paid by the person who earns the income, so it is a direct tax."],
  ],
  64: [
    ["create a shortage", "A floor above equilibrium creates a surplus, not a shortage. A shortage comes from a price ceiling."],
    ["make the product cheaper", "A floor holds the price above the market level, so it makes the product dearer for consumers."],
    ["reduce the incomes", "The aim is to raise and steady farmers' incomes by guaranteeing a minimum price."],
  ],
  65: [
    ["an increase in the quantity supplied", "A ceiling below equilibrium reduces the incentive to supply, so the quantity supplied falls."],
    ["a persistent surplus", "A surplus is the result of a price floor. A ceiling creates a shortage."],
    ["the price rising above", "The ceiling stops the price from rising, which is why the shortage lasts."],
  ],
  66: [
    ["have no effect", "A subsidy lowers producers' costs and so increases supply, which changes the quantity traded."],
    ["reduce the quantity", "A subsidy encourages production, so more is produced and bought."],
    ["raise the price", "More supply pushes the price down, so consumers pay less."],
  ],
  67: [
    ["households demand", "This is the wrong way round. In the labour market households supply their labour and businesses demand it."],
    ["the government supplies", "Workers are mostly households, not the government. Households supply labour to firms."],
    ["labour is neither", "The labour market is where labour is demanded by firms and supplied by households."],
  ],
  68: [
    ["the age", "Derived demand means labour is wanted for what it produces. The age of the workers is not the source of the demand."],
    ["the number of people", "That describes the supply of labour. Demand is the firms' side and comes from demand for the product."],
    ["the minimum wage", "The minimum wage affects the price of labour. 'Derived' means the demand comes from demand for the product."],
  ],
  69: [
    ["an increase in the demand", "A higher wage makes workers dearer, so firms want fewer of them. The demand for labour does not rise."],
    ["the labour market to clear", "At a wage above equilibrium, more people offer to work than firms will hire, so the market does not clear."],
    ["a shortage of labour", "A shortage happens when the wage is too low. A minimum above equilibrium leads to a surplus of labour, which is unemployment."],
  ],
  70: [
    ["there is no demand", "A skill shortage means demand is strong, with more jobs than qualified workers."],
    ["the labour market is in equilibrium", "A shortage means the quantities do not match. Employers want more workers than are available."],
    ["the quantity of labour supplied exceeds", "That is a labour surplus. In a skill shortage, firms want more workers than are available, so wages tend to rise."],
  ],
  71: [
    ["A rise in the wage", "A higher wage makes labour dearer, which reduces the quantity of labour demanded. It does not raise the demand for labour."],
    ["A fall in the productivity", "Lower productivity makes each worker less valuable, which reduces demand for labour."],
    ["An increase in the number", "More qualified people raises the supply of labour, not the demand."],
  ],
  72: [
    ["A fall in the wage", "A lower relative wage makes the job less attractive, so fewer people want it. That reduces supply."],
    ["A fall in the demand", "That reduces the demand for labour, since firms need fewer workers. It does not change how many want to work."],
    ["An increase in the productivity", "Higher productivity raises the demand for labour. It does not directly change how many are willing to supply it."],
  ],
  73: [
    ["have no effect", "Replacing workers with machines reduces the demand for labour, which lowers the wage and employment."],
    ["increase the supply of labour", "Automation affects firms' demand for workers. It does not change how many people want to work."],
    ["increase the demand", "Machines replace workers, so firms want fewer of them. Demand for labour falls."],
  ],
  74: [
    ["firms make", "The equilibrium wage is where the quantities of labour demanded and supplied match, not where firms' profits are largest."],
    ["every worker", "Equilibrium is about the quantities matching in the market. Wages differ between jobs and workers."],
    ["the government sets", "In a competitive market the wage is set by demand and supply, not by the government."],
  ],
  75: [
    ["houses can be produced", "Houses take a long time to build, which is why supply is slow to respond to price. It cannot be done instantly."],
    ["there are many close", "Substitutes affect demand. Supply is inelastic because it is slow to change."],
    ["housing takes up", "Housing is a big share of most budgets. Supply is inelastic because of how slowly more can be built."],
  ],
  76: [
    ["leave house", "More people in the city raises the demand for housing, and with slow supply, prices rise."],
    ["push house prices down", "More demand pushes prices up. A large rise in the quantity of housing would need supply to respond quickly."],
    ["reduce the demand", "More people means more demand for housing, not less."],
  ],
  77: [
    ["increase the supply", "Tax concessions make investing in housing more attractive, which raises demand. They do not directly build more housing."],
    ["have no effect", "A tax concession raises the after-tax return on housing, so it changes how many people want to buy."],
    ["decrease the demand", "Making housing a better investment attracts more buyers, so demand rises."],
  ],
  78: [
    ["commodities have many", "Commodities have few close substitutes, which makes demand inelastic and prices swing more."],
    ["commodity supply can be changed", "Supply is slow to change because mines and farms take time to expand. That makes prices swing."],
    ["commodity demand never", "Demand for commodities does change, for example when a large buyer's economy slows."],
  ],
  79: [
    ["leave the market", "Weaker demand shifts the demand curve left, which changes the equilibrium."],
    ["raise both", "Lower demand reduces both the price and the quantity traded."],
    ["raise the price and lower", "Weaker demand cannot raise the price. Both fall when the demand curve shifts left."],
  ],
  80: [
    ["increase demand", "Planning reforms that allow more building affect supply. They do not change what buyers want."],
    ["decrease supply", "Allowing more apartments to be built increases the supply of housing."],
    ["have no effect", "More dwellings shift the supply curve right, which lowers prices and rents."],
  ],
  81: [
    ["the supply of housing has grown", "If supply had outpaced demand, prices would have fallen. Supply has been slow to respond to rising demand."],
    ["the government has fixed", "House prices are set by the market, not fixed by law."],
    ["demand for housing has fallen", "Demand has risen with population growth, investor tax concessions and lower interest rates."],
  ],
  82: [
    ["increase demand", "A new mine affects the supply of iron ore, not demand for it."],
    ["decrease supply", "A new mine adds to the amount available, so supply increases."],
    ["have no effect", "More supply on the world market pushes the price down."],
  ],
  83: [
    ["Lower interest rates increase the supply", "Lower rates affect buyers' borrowing costs first, which raises demand. Housing supply is slow to respond."],
    ["Interest rates have no link", "Most buyers borrow to buy, so the cost of a mortgage strongly affects what they can pay."],
    ["Lower interest rates reduce", "Lower rates make mortgages cheaper, so more buyers can afford to bid. Demand rises."],
  ],
  84: [
    ["at any level", "A floor below the equilibrium price has no effect, because the market price is already higher."],
    ["below", "A floor below equilibrium is not binding, because the market price is already above it."],
    ["exactly", "At exactly the equilibrium price the floor does not change the outcome, so it is not binding either."],
  ],
  85: [
    ["a decrease in demand", "The cinema cut its own price and sold more. That is a movement along the demand curve, not a shift."],
    ["an increase in demand", "A shift in demand needs a non-price cause. Here the price cut caused the extra sales."],
    ["a contraction of demand", "A contraction is a movement up the curve from a price rise. The price fell, so demand expanded."],
  ],
  86: [
    ["an increase in supply", "Hot weather changes what buyers want, so it affects demand, not supply."],
    ["a decrease in demand", "More people want ice-cream, so demand has increased."],
    ["an expansion of demand", "An expansion is a movement along the curve from a price fall. The price is unchanged here, so the curve itself has shifted."],
  ],
  87: [
    ["a decrease in demand", "A higher price for the good itself moves us along the demand curve. It does not shift it."],
    ["an expansion of demand", "An expansion would come from a lower price. The price rose, so this is a contraction."],
    ["an increase in demand", "The quantity fell, so this is not an increase in demand. A price rise causes a movement along the curve."],
  ],
  88: [
    ["an increase in supply", "A shift in supply needs a non-price cause. Here the higher price caused the extra output."],
    ["a contraction of supply", "A contraction is caused by a lower price. The price of steel rose."],
    ["a decrease in supply", "The factory produced more, and the cause was the price, so supply expanded along the curve."],
  ],
  89: [
    ["an increase in supply", "Higher costs make firms supply less at each price, so supply decreases."],
    ["a decrease in demand", "Safety rules for mines affect the producers' costs, so they affect supply, not demand."],
    ["a contraction of supply", "A contraction is a movement along the curve caused by a lower price. Higher costs shift the whole curve."],
  ],
  90: [
    ["an increase in supply", "Higher incomes change what buyers want. That affects demand, not supply."],
    ["a decrease in demand", "For a normal good, higher income increases demand."],
    ["an expansion of demand", "An expansion is a movement along the curve from a lower price. Higher income shifts the whole curve."],
  ],
  91: [
    ["an increase in demand", "For an inferior good, higher incomes reduce demand, because people switch to better goods."],
    ["a decrease in supply", "Changing incomes affect what buyers want, not what producers supply."],
    ["a contraction of demand", "A contraction is a movement along the curve from a higher price. Here income shifts the whole curve."],
  ],
  92: [
    ["decrease the demand", "Cheaper consoles mean more consoles are sold, and more people want cartridges to play on them, so demand for cartridges rises."],
    ["increase the supply", "The console price affects what buyers want, not what is supplied."],
    ["cause an expansion", "The price of cartridges has not changed, so there is no movement along their curve. The price of a complement shifts the curve."],
  ],
  93: [
    ["decrease the demand", "Dearer trains push commuters toward buses, so demand for buses rises."],
    ["increase the supply", "The price of train fares changes what buyers want. It does not change how many buses are supplied."],
    ["cause an expansion", "The price of bus travel has not changed, so there is no movement along its curve. The substitute's price shifts the curve."],
  ],
  94: [
    ["cause an expansion", "An expansion is a movement along the curve from a lower price. Here the expectation shifts the whole curve left."],
    ["shift the supply", "Buyers' expectations change demand, not supply."],
    ["increase now", "If a cheaper model is coming, buyers delay purchases of the current one, so demand falls now."],
  ],
  95: [
    ["increase the supply", "More students means more people wanting to rent. That is demand, not supply."],
    ["decrease the demand", "More students is more buyers in the market, so demand rises."],
    ["cause an expansion", "The rent has not changed, so there is no movement along the curve. More buyers shifts the whole curve."],
  ],
  96: [
    ["decrease — the supply", "Lower unit costs let firms supply more at each price, so supply increases."],
    ["increase the demand", "Production costs affect supply. They do not change what buyers want."],
    ["cause an expansion", "An expansion would come from a higher price. A cost saving shifts the whole supply curve."],
  ],
  97: [
    ["cause a contraction", "More cafés add to supply at every price. That is a shift, not a movement along the curve."],
    ["decrease — the supply", "More firms means more output, so supply increases."],
    ["increase the demand", "New cafés change the amount supplied. They do not change what buyers want."],
  ],
  98: [
    ["increase the demand", "Producers' expectations affect supply, not demand."],
    ["increase now", "Producers expecting a higher price later hold stock back to sell then, so current supply falls."],
    ["cause a contraction", "A contraction is a movement along the curve from a lower price. The expectation shifts the whole curve left."],
  ],
  99: [
    ["cause the demand", "The surplus is cleared by the price falling, which moves along the curves. The demand curve does not shift."],
    ["push the price up further", "Above equilibrium there is a surplus, not a shortage, so there is pressure on the price to fall."],
    ["leave the price", "A surplus leaves sellers with unsold stock, so competition among them pushes the price down."],
  ],
  100: [
    ["push the price down further", "Below equilibrium there is a shortage, not a surplus, so buyers compete and the price rises."],
    ["cause the supply", "The shortage is cleared by the price rising, which moves along the curves. The supply curve does not shift."],
    ["leave the price", "A shortage means buyers compete for limited stock, which pushes the price up."],
  ],
  101: [
    ["definitely rise, and quantity", "The two shifts push quantity in opposite directions: more demand raises it, less supply cuts it. The result depends on which shift is bigger."],
    ["stay the same", "Both shifts push the price up, so they add together rather than cancel."],
    ["definitely fall", "More demand and less supply both push the price up, not down."],
  ],
  102: [
    ["stay the same", "Both shifts push the price down, so they add together rather than cancel."],
    ["definitely fall, and quantity", "Less demand lowers quantity, but more supply raises it. They pull in opposite directions."],
    ["definitely rise", "Less demand and more supply both push the price down, not up."],
  ],
  103: [
    ["stay the same", "Both increases push quantity up, so they add together instead of cancelling."],
    ["definitely fall", "More demand and more supply both raise the quantity traded."],
    ["definitely rise, and price", "The shifts push price in opposite directions: more demand raises it, more supply lowers it. The result depends on which is larger."],
  ],
  104: [
    ["definitely rise", "Less demand and less supply both reduce the quantity traded."],
    ["definitely fall, and price", "The shifts push price in opposite directions: less demand lowers it, less supply raises it. The result depends on which is larger."],
    ["stay the same", "Both decreases push quantity down, so they add together rather than cancel."],
  ],
  105: [
    ["An increase in demand together", "More demand raises price and quantity, but less supply cuts the quantity, so quantity is not guaranteed to rise."],
    ["A decrease in demand together", "Less demand lowers both price and quantity, and more supply lowers price. Neither is guaranteed to rise."],
    ["An increase in supply", "More supply lowers the price, so the price does not rise."],
  ],
  106: [
    ["An increase in supply", "More supply lowers the price and raises the quantity."],
    ["An increase in demand", "More demand raises the price and also raises the quantity."],
    ["A decrease in demand", "Less demand lowers both the price and the quantity."],
  ],
  107: [
    ["definitely rise, and price", "More demand raises the price, but more supply lowers it. The effect on price depends on which shift is bigger."],
    ["stay exactly", "Both shifts push quantity up, so it rises."],
    ["definitely fall", "More demand and more supply both increase the quantity traded."],
  ],
  108: [
    ["a shortage", "At equilibrium the quantities match, so no shortage builds up."],
    ["the price to keep", "At equilibrium there is no pressure on the price to change, so it stays where it is."],
    ["a surplus", "At equilibrium the quantities match, so no surplus builds up."],
  ],
  109: [
    ["price to rise and quantity to fall", "More demand raises the quantity as well as the price, because the higher price brings out more supply."],
    ["both fall", "Banning a substitute pushes buyers toward the original good, which raises demand, price and quantity."],
    ["price to fall and quantity to rise", "More demand raises the price. A price fall with more quantity would come from more supply."],
  ],
  110: [
    ["definitely fall, and price", "Less demand lowers the price, but less supply raises it. The effect on price depends on which shift is bigger."],
    ["stay exactly", "Both shifts push quantity down, so it falls."],
    ["definitely rise", "Less demand and less supply both reduce the quantity traded."],
  ],
  111: [
    ["Both price and quantity", "Quantity is certain to rise, but the price is not, because more demand raises it and more supply lowers it."],
    ["The equilibrium price rises", "The two shifts push price in opposite directions, so it depends on which shift is larger."],
    ["The equilibrium price falls", "The two shifts push price in opposite directions, so it depends on which shift is larger."],
  ],
  112: [
    ["Both price and quantity", "Price is certain to fall, but quantity is not, because less demand lowers it and more supply raises it."],
    ["The equilibrium quantity falls", "The shifts push quantity in opposite directions, so it depends on which shift is larger."],
    ["The equilibrium quantity rises", "The shifts push quantity in opposite directions, so it depends on which shift is larger."],
  ],
  113: [
    ["2.5 — demand is price-inelastic", "The value is right, but a value above 1 means demand is elastic."],
    ["0.4 —", "0.4 comes from dividing the other way round. Elasticity is the quantity change (20) divided by the price change (8)."],
    ["12 —", "12 is the sum of the two percentages. Elasticity is their ratio, 20 ÷ 8."],
  ],
  114: [
    ["0.2 — demand is price-elastic", "The value is right, but a value below 1 means demand is inelastic."],
    ["5 —", "5 comes from dividing the other way round. Elasticity is the quantity change (3) divided by the price change (15)."],
    ["18 —", "18 is the sum of the two percentages. Elasticity is their ratio, 3 ÷ 15."],
  ],
  115: [
    ["perfectly inelastic", "Perfectly inelastic demand would not respond to price at all. Many substitutes and a big budget share make buyers very responsive."],
    ["price-inelastic", "Both features make buyers sensitive to price, so demand is elastic, not inelastic."],
    ["unit elastic", "Unit elasticity is the special case of exactly 1. Both features here point to demand that is clearly elastic."],
  ],
  116: [
    ["Tap water", "Water is a necessity with few substitutes, so buyers keep buying it whatever the price."],
    ["Petrol", "Petrol is a necessity for most drivers in the short run, with few substitutes, so demand is inelastic."],
    ["A prescription medicine", "With no substitute and a medical need, buyers have to buy it whatever the price, so demand is very inelastic."],
  ],
  117: [
    ["price-elastic", "With elastic demand, a price cut raises the quantity by more than the price falls, so revenue would rise."],
    ["unit elastic", "With unit elasticity, revenue does not change when the price changes."],
    ["perfectly elastic", "Perfectly elastic demand would make revenue rise sharply after a cut, not fall."],
  ],
  118: [
    ["price-elastic", "With elastic demand, a price rise cuts the quantity by more than the price rises, so revenue would fall."],
    ["unit elastic", "With unit elasticity, revenue does not change when the price changes."],
    ["perfectly elastic", "With perfectly elastic demand, any price rise would lose all the sales, so revenue would fall."],
  ],
  119: [
    ["0.4 —", "0.4 comes from dividing the other way round. Elasticity of supply is the quantity change (20) divided by the price change (8)."],
    ["12 —", "12 is the sum of the two percentages. Elasticity is their ratio, 20 ÷ 8."],
    ["2.5 — supply is price-inelastic", "The value is right, but a value above 1 means supply is elastic."],
  ],
  120: [
    ["9 —", "9 is the sum of the two percentages. Elasticity is their ratio, 3 ÷ 12."],
    ["0.25 — supply is price-elastic", "The value is right, but a value below 1 means supply is inelastic."],
    ["4 —", "4 comes from dividing the other way round. Elasticity of supply is the quantity change (3) divided by the price change (12)."],
  ],
  121: [
    ["producers can catch", "Fishers cannot catch unlimited extra fish at once, and what is caught cannot be kept. That is why supply is inelastic."],
    ["it has many close", "Substitutes affect demand. Supply is inelastic because the fish cannot be stored."],
    ["demand for fresh fish", "Demand does change, but elasticity of supply is about how supply responds to price."],
  ],
  122: [
    ["perfectly elastic", "In the very short run, the quantity cannot be increased, so supply is fixed rather than endlessly flexible."],
    ["exactly 1", "There is no reason for supply to respond proportionally when nothing more can be produced in time."],
    ["always greater than 1", "Greater than 1 would mean supply is elastic. In the momentary period there is no time to respond."],
  ],
  123: [
    ["avoided entirely", "Governments can tax any good. With inelastic demand, buyers just keep buying, which makes it a reliable source of revenue."],
    ["paid almost entirely by producers", "Buyers with no substitutes will keep buying at the higher price, so they bear the tax rather than refuse to pay."],
    ["split exactly", "The split depends on elasticity. Perfectly inelastic demand puts nearly all of the burden on consumers."],
  ],
  124: [
    ["no one", "The tax is still paid. With elastic demand, producers bear most of it."],
    ["consumers, who", "Consumers with elastic demand can easily switch away, so they do not carry most of the burden."],
    ["the government itself", "The government collects the tax, and it falls on producers and consumers."],
  ],
  125: [
    ["Both bread and overseas cruises have elastic", "Bread is a necessity, so demand for it is inelastic."],
    ["Bread — elastic", "These are swapped. Bread is a necessity with inelastic demand, and cruises are a luxury with elastic demand."],
    ["Both bread and overseas cruises have inelastic", "Cruises are a luxury that can be put off or swapped for something else, so demand for them is elastic."],
  ],
  126: [
    ["lower (more inelastic)", "With time, people can change their cars or habits, so demand becomes more responsive, not less."],
    ["unchanged", "Time is one of the main factors in elasticity. More time makes demand more elastic."],
    ["perfectly inelastic", "Demand is least responsive in the short run, not the long run. Given time, buyers can adjust."],
  ],
  127: [
    ["demand for bread falls", "Demand does not fall to meet supply. A low price keeps demand high while supply drops."],
    ["the price rises above", "A binding ceiling is a legal maximum, so the price cannot rise above it. That is why the shortage stays."],
    ["producers supply more bread", "A low price gives producers less reason to supply, so supply falls and the shortage grows."],
  ],
  128: [
    ["supply of petrol increases", "A maximum price below the market price lowers the incentive to supply, so supply does not increase."],
    ["petrol stations end up", "A surplus would come from a price above equilibrium. A maximum below equilibrium leads to a shortage."],
    ["the market clears normally", "At a price below equilibrium, buyers want more than sellers supply, so the market does not clear."],
  ],
  129: [
    ["have no effect", "The grant lets buyers bid more, so demand rises and prices are affected."],
    ["increase supply", "The grant helps buyers pay, so it shifts demand, not supply."],
    ["decrease demand", "The grant gives buyers more to spend, so demand rises."],
  ],
  130: [
    ["do nothing", "At a binding floor price, farmers supply more than buyers will take. The surplus stays unless someone removes it."],
    ["lower the floor", "Lowering the floor below equilibrium would remove the surplus, but it would also remove the support for farmers, which was the aim."],
    ["let the price fall", "Letting the price fall would end the floor. The question asks how to keep the minimum price in place."],
  ],
  131: [
    ["leave the equilibrium", "The tax raises producers' costs, which reduces supply and changes the price and quantity."],
    ["decrease demand", "The tax is charged on sellers, so it affects supply first. The demand curve itself does not move."],
    ["increase supply", "A tax makes supplying more costly, so supply falls and the price rises."],
  ],
  132: [
    ["is paid entirely", "Tax on alcohol is paid by producers and passed on, at least partly, to consumers. The government receives it."],
    ["has no effect", "A higher tax shifts supply left, which raises the price and cuts the quantity sold."],
    ["increases the quantity", "A tax raises the price, which reduces the quantity consumed."],
  ],
  133: [
    ["decrease the quantity", "Removing the tax makes the goods cheaper, which tends to increase the quantity bought and produced."],
    ["have no effect", "A tax adds to the price, so removing it lowers the price consumers pay."],
    ["raise their price", "Taking the tax away lowers the price. Taxing them would raise it."],
  ],
  134: [
    ["cause rents to fall", "A ceiling keeps rents below the market level, but not to zero. It is a maximum price."],
    ["have no long-run", "Over time landlords respond to lower returns, so rent control does affect the long-run supply."],
    ["encourage landlords", "Lower returns discourage building new rentals, not encourage it."],
  ],
  135: [
    ["raises the price paid by consumers, just", "A subsidy increases supply, which lowers the price consumers pay. It is a price floor that raises it."],
    ["is paid by consumers", "A subsidy is a payment from the government to producers, not from consumers."],
    ["always creates", "A subsidy increases supply and does not on its own create a shortage. A price floor creates a surplus."],
  ],
  136: [
    ["a surplus", "At exactly the equilibrium price, the quantities match, so there is no surplus."],
    ["a shortage", "At exactly the equilibrium price, the quantities match, so there is no shortage."],
    ["the quantity traded doubles", "The market already trades at the ceiling price, so nothing changes."],
  ],
  137: [
    ["create a large surplus", "A floor below equilibrium is not binding. The market price is already higher, so no surplus appears."],
    ["force the price", "The market price is above the floor, so it is not pushed down."],
    ["create a large shortage", "A floor below equilibrium has no effect at all, and a floor can never cause a shortage."],
  ],
  138: [
    ["An indirect tax", "A tax is collected from producers by the government, not paid to them."],
    ["A price floor", "A price floor sets a minimum price. It is not a payment to producers from tax revenue."],
    ["A price ceiling", "A price ceiling sets a maximum price. It involves no payment to producers."],
  ],
  139: [
    ["a subsidy", "A tax makes the product dearer. A subsidy would make it cheaper."],
    ["a price ceiling", "A ceiling is a legal maximum price. A tax is a per-unit charge."],
    ["a price floor", "A floor is a legal minimum price. A tax is a per-unit charge on producers."],
  ],
  140: [
    ["Both a tax", "A subsidy goes the other way: the government pays the producers."],
    ["Neither", "Both involve payments with the government: producers pay a tax, and producers receive a subsidy."],
    ["Indirect tax — the government pays", "These are the wrong way round. Producers pay the tax to the government, and the government pays the subsidy to producers."],
  ],
  141: [
    ["have no effect", "More demand for tradespeople shifts the labour demand curve, which changes the wage and employment."],
    ["raise the equilibrium wage but", "When demand for labour rises, firms hire more people as well as pay more, so employment rises."],
    ["lower the equilibrium wage", "More demand for labour pushes the wage up, not down."],
  ],
  142: [
    ["lower the equilibrium", "Restricting entry reduces supply of labour, which raises the wage."],
    ["have no effect", "A costly, lengthy qualification keeps some people out, which reduces supply and raises wages."],
    ["increase the supply", "A costly qualification puts people off, so the supply of labour is smaller, not bigger."],
  ],
  143: [
    ["make wages equalise", "Workers who cannot move keep local differences in place, so wages do not equalise instantly."],
    ["increase the supply of labour in every", "Low mobility does not add workers. It keeps them where they are."],
    ["have no effect", "If workers cannot move to where jobs are, regional wage and employment differences last longer."],
  ],
  144: [
    ["have no effect", "Fewer people of working age means fewer workers on offer, which changes the labour market."],
    ["increase the supply", "An ageing population reduces the number of workers, so supply falls."],
    ["decrease the demand", "The change is in how many people can work, which is supply. Demand comes from firms."],
  ],
  145: [
    ["a decrease in the demand", "More people willing to work is a change in supply. Demand comes from the firms that want workers."],
    ["an increase in the demand", "More people willing to work is on the supply side, not the demand side."],
    ["a decrease in the supply", "More people are willing to do the work, so supply has increased."],
  ],
  146: [
    ["decrease.", "A more valuable worker is worth more to the firm, so it wants to employ more workers."],
    ["become perfectly", "The value of output changes the amount demanded, not the shape of the curve. Demand for labour rises."],
    ["stay exactly", "Labour demand depends on the value of the extra output. When that rises, so does demand."],
  ],
  147: [
    ["widen further", "Workers do move to higher-paying jobs, which is what closes the gap over time."],
    ["have no effect", "A wage gap attracts workers into the better-paid job, which affects both labour markets."],
    ["reduce the supply", "A higher wage attracts workers to that job, so its supply increases."],
  ],
  148: [
    ["closing down", "Some firms might, but most would adjust gradually, by cutting hours or hiring less. Immediate closure is an extreme response."],
    ["leaving employment", "A higher wage makes labour dearer, so firms with thin margins tend to cut back."],
    ["hiring more", "A higher cost of labour reduces how many workers firms want, not increases it."],
  ],
  149: [
    ["An increase in the number of nursing", "More training places lets more people qualify, which increases supply."],
    ["A rise in nurses", "Higher pay makes nursing more attractive, which increases supply."],
    ["Immigration", "More qualified nurses entering the country adds to the supply of nurses."],
  ],
  150: [
    ["A rise in construction", "Higher wages make workers dearer, which reduces the quantity demanded. It is not a rise in demand."],
    ["Automation", "Machines doing the bricklaying replace workers, which reduces the demand for labour."],
    ["A recession", "Less building means less need for construction workers, so demand for labour falls."],
  ],
  151: [
    ["A decrease in demand", "Less demand for electrical work would cut the shortage, but it does not bring in more electricians, and the question asks about supply."],
    ["A fall in the wage", "A lower wage would make the job less attractive and make the shortage worse."],
    ["Fewer people", "Fewer apprentices means fewer qualified electricians later, which makes the shortage worse."],
  ],
  152: [
    ["Doctors work fewer", "Hours do not explain the gap. The key factors are the long training for doctors and the abundant supply of checkout workers."],
    ["Checkout operators have", "Union strength is not the main reason. The difference comes from the supply of skills and the demand for them."],
    ["The government sets", "In a competitive labour market wages come from demand and supply, not from a law."],
  ],
  153: [
    ["have no effect", "Labour demand is derived from product demand, so weaker demand for the product reduces the demand for labour."],
    ["increase the demand", "Less demand for the output means firms want fewer workers, not more."],
    ["increase the supply", "The fall in demand for the goods affects firms' demand for workers. It does not change how many want to work."],
  ],
  154: [
    ["employment always", "In a competitive market the level of employment changes when demand or supply for labour shifts."],
    ["firms decide", "Goodwill does not shift the market. The equilibrium wage changes when demand or supply shifts."],
    ["the government simply", "An announced award wage is not a shift in market demand or supply. It acts as a price control."],
  ],
  155: [
    ["have no effect", "Dearer mortgages reduce what buyers can borrow, which lowers the demand for housing."],
    ["increase the supply", "Higher interest rates affect buyers' borrowing, which is demand. Supply is slow to change."],
    ["increase demand", "Higher repayments make housing less affordable, so demand falls."],
  ],
  156: [
    ["make the supply of housing more price-elastic", "Zoning limits building, so supply responds less to price, not more."],
    ["have no effect", "Zoning limits how many dwellings can be built, which makes supply less responsive to demand."],
    ["guarantee", "Restricting supply tends to push prices up, not down, when demand is growing."],
  ],
  157: [
    ["unaffected", "Higher prices do encourage more investment in supply, but it takes years. In the short run the quantity cannot change much."],
    ["perfectly elastic", "Perfectly elastic supply would mean quantity adjusts straight away. New mines take years, so supply is inelastic."],
    ["certain to fall", "A higher price does not reduce supply. It just takes a long time for supply to respond."],
  ],
  158: [
    ["have no effect", "A cut in production reduces supply, which raises the price."],
    ["increase demand", "Producers cutting output changes supply, not demand."],
    ["increase supply", "A production cut means less oil on the market, so supply decreases."],
  ],
  159: [
    ["stay exactly", "More supply against unchanged demand pushes the price down."],
    ["rise, as", "More supply tends to lower the price, not raise it."],
    ["become impossible", "With only supply changing, we can predict that the price falls and the quantity rises."],
  ],
  160: [
    ["supply, since", "Investors who buy property add to demand. Selling later does not make them suppliers when they buy."],
    ["no demand at all", "Buying property creates demand whether or not the buyer lives in it."],
    ["derived demand", "Derived demand is demand for something because of the good it helps to produce. Speculators buy for expected price gains."],
  ],
  161: [
    ["increase demand", "More land affects how many dwellings can be built, which is supply. It does not change what buyers want."],
    ["have no effect", "More land lets more dwellings be built, which increases supply and moderates prices."],
    ["decrease the supply", "More land available for development raises supply, not lowers it."],
  ],
  162: [
    ["The supply of rental housing expands", "If supply grew faster than demand, more properties would be empty and vacancy rates would rise."],
    ["Rents fall", "Falling vacancies come with rising rents, not falling ones, as tenants compete for fewer properties."],
    ["Landlords choose", "Landlords leaving more empty would raise vacancy rates. The rate falls because demand outpaces supply."],
  ],
  163: [
    ["commodities have many", "Commodities have few close substitutes. That makes demand inelastic, so prices swing more."],
    ["commodity supply can be adjusted", "Supply cannot be adjusted instantly. Mines and farms take time to change output."],
    ["demand for commodities never", "Demand for commodities does change, for example with the world economy."],
  ],
  164: [
    ["have no effect", "A tax concession raised the return on investment property. Removing it makes property less attractive to investors."],
    ["increase the demand", "Removing a tax benefit makes property investment less attractive, so investors' demand falls."],
    ["increase the supply", "The change affects investors' demand. It does not immediately add new dwellings."],
  ],
  165: [
    ["raise prices", "Weaker demand pushes the price down."],
    ["leave prices", "A fall in demand reduces the price, particularly when supply is slow to adjust."],
    ["cause a persistent shortage", "Lower demand with unchanged supply creates a surplus, not a shortage."],
  ],
  166: [
    ["increase demand", "The reform lets more apartments be built, which is on the supply side."],
    ["decrease the supply", "Approving more apartments allows supply to increase."],
    ["have no effect", "More supply eases price growth compared with areas without the reform."],
  ],
  167: [
    ["raise the quantity produced rather", "Supply cannot expand quickly, so quantity changes little. Most of the adjustment is in price."],
    ["lower its price", "An unexpected rise in demand pushes the price up, not down."],
    ["leave both", "More demand raises the price, even if the quantity cannot change much."],
  ],
  168: [
    ["have no effect", "Land held off the market cannot be built on, so it reduces the supply of new housing."],
    ["increase the supply", "Holding land back restricts supply. Releasing it would increase supply."],
    ["lower house", "Less new supply tends to push prices up, not down."],
  ],
};

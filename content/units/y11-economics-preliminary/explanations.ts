import type { ExplanationTable } from "../../explanation-helpers";

// ANSWER KEY — why each wrong multiple-choice option is wrong (spec 002). Shown to a student only
// after they answer that question. Each entry is [the start of the wrong option's text, the
// explanation]; the helper resolves it to the full option text and fails if it does not match
// exactly one wrong option. Original wording, one or two sentences each.

export const explanations: ExplanationTable = {
  1: [
    ["some people earn", "Differences in income are a question about fairness. The basic economic problem is that wants are unlimited while resources are scarce."],
    ["governments cannot", "Disagreement over spending is a political matter. Scarcity affects every economy whatever its government does."],
    ["there is too much", "The problem is too little, not too much. Resources are limited, so not every want can be met."],
  ],
  2: [
    ["the benefit received", "The benefit from the option you choose is what you gain. Opportunity cost is what you give up."],
    ["the money price", "The price paid is a cost, but opportunity cost is the value of the best alternative you gave up, which may not be money at all."],
    ["the total value", "Opportunity cost counts only the next best alternative, not all of the alternatives you passed up."],
  ],
  3: [
    ["Households,", "These are the sectors in the circular flow of income, not the factors of production."],
    ["Land, labour, money", "Money and goods are not factors of production. The fourth factor is enterprise, and capital means the man-made equipment used to produce."],
    ["Rent, wages", "These are the incomes the factors earn, not the factors themselves."],
  ],
  4: [
    ["wages", "Wages are the income earned by labour, not by the owners of capital."],
    ["rent", "Rent is the income earned by the owners of land."],
    ["profit", "Profit is the reward for enterprise. The owners of capital earn interest."],
  ],
  5: [
    ["the largest firm", "In a market economy no single firm decides. Prices set by the interaction of many buyers and sellers do."],
    ["a central planning", "A central planning authority decides what to produce in a command economy, not a market economy."],
    ["custom", "Custom and tradition are how a traditional economy decides. A market economy relies on prices."],
  ],
  6: [
    ["the frontier has", "A point inside the frontier shows how resources are used with the frontier where it is. A shift of the frontier would move the curve itself."],
    ["the economy is producing an unattainable", "Unattainable combinations lie outside the frontier. A point inside is attainable but not using all resources."],
    ["the economy is producing at maximum", "Maximum efficiency is on the frontier. A point inside means resources are going unused or are wasted."],
  ],
  7: [
    ["Investment", "Investment, government spending and exports are injections, which add to the circular flow."],
    ["Wages, rent", "These are incomes paid to the factors of production. They are flows in the model, not leakages."],
    ["Consumption", "Savings and taxation are leakages, but consumption is spending that stays in the flow."],
  ],
  8: [
    ["the government Budget", "A balanced Budget does not make the circular flow balanced. All leakages and injections together must be equal."],
    ["savings equal", "Savings equalling investment is only part of the picture. Taxation, imports, government spending and exports matter too."],
    ["exports equal", "Exports equalling imports covers only the international part. Equilibrium needs all the leakages to equal all the injections."],
  ],
  9: [
    ["record levels", "Record investment fits an expansion or boom. In a contraction, businesses cut back."],
    ["rising inflation", "Rising inflation with falling unemployment is typical of a strong expansion, not a contraction."],
    ["an economic boom", "A boom is the peak of the cycle. A contraction is a downturn."],
  ],
  10: [
    ["rationing", "The rationing function shares out scarce goods among buyers, by price. Encouraging firms to produce more is the incentive function."],
    ["signalling", "The signalling function tells producers and consumers about shortages and surpluses. The prospect of more profit is the incentive."],
    ["redistribution", "Redistribution is a function of government, not the price mechanism."],
  ],
  11: [
    ["a movement up", "A movement along the curve is caused by a change in the good's own price. A change in income shifts the whole curve."],
    ["a rightward shift of the supply", "Income affects what buyers want, so it moves the demand curve, not the supply curve."],
    ["a movement down", "A change in income shifts the curve. A movement along the curve is caused by the good's own price."],
  ],
  12: [
    ["a lower price and a higher", "A higher demand with the same supply creates a shortage at the old price, so the price rises, not falls."],
    ["a lower price and a lower", "An increase in demand pushes both price and quantity up."],
    ["a higher price and a lower", "The quantity also rises, because the higher price encourages suppliers to supply more."],
  ],
  13: [
    ["0.5 — demand is relatively elastic", "The number is right, but a value below 1 means demand is inelastic. Elastic demand has a value above 1."],
    ["2 — demand", "Dividing the other way round gives 2. Elasticity is the percentage change in quantity (5) divided by the percentage change in price (10)."],
    ["5 — demand", "5 is just the quantity change. Elasticity divides it by the 10% price change, giving 0.5."],
  ],
  14: [
    ["is a luxury", "A luxury can be put off if the price rises, so demand responds strongly. That makes it more elastic."],
    ["takes up", "Goods that take a large part of a buyer's income make them sensitive to price, which makes demand more elastic."],
    ["has many", "When there are many close substitutes buyers can easily switch, so demand is more elastic."],
  ],
  15: [
    ["monopolistically", "A monopolistically competitive market has many sellers of similar products. A single seller with high barriers is a monopoly."],
    ["market that must", "A monopoly does not have to be owned by the government. It can be private, as long as there is one seller with high barriers to entry."],
    ["perfectly", "Perfect competition has many sellers and no barriers to entry. A single seller is a monopoly."],
  ],
  16: [
    ["many firms selling slightly", "This describes monopolistic competition. In perfect competition the products are identical and firms cannot set prices."],
    ["one dominant", "This describes a monopoly. Perfect competition has many small firms and no barriers to entry."],
    ["a few large", "This describes an oligopoly. Perfect competition has many small firms with no pricing power."],
  ],
  17: [
    ["a merit", "A merit good is one the market under-provides because its benefits are not fully recognised. Pollution is a cost, not a good."],
    ["a public good", "Public goods are non-rival and non-excludable. Pollution is a cost to third parties, so it is an externality."],
    ["a positive externality", "Pollution harms others, so it is a negative externality. It also comes from production, not consumption."],
  ],
  18: [
    ["produced only", "Public goods are defined by how they are consumed, not who produces them. The market usually fails to provide them."],
    ["always also", "A public good is not necessarily a merit good. The two concepts describe different kinds of market failure."],
    ["any good provided", "Being free or provided by the government does not make a good public. It has to be non-excludable and non-rival."],
  ],
  19: [
    ["a persistent surplus", "A ceiling below the equilibrium makes rent cheap, so more people want to rent than there are rentals. That is a shortage."],
    ["the rental market clearing", "At a ceiling below the equilibrium, demand is greater than supply, so the market does not clear."],
    ["an increase in the supply", "A lower rent gives landlords less reason to supply, so the supply of rentals tends to fall."],
  ],
  20: [
    ["total satisfaction", "Total satisfaction usually keeps rising, just more slowly. It is the extra satisfaction from each additional unit that falls."],
    ["marginal utility stays", "The law says marginal utility falls as consumption rises. It does not stay constant."],
    ["consumers always", "The law is about how much satisfaction each extra unit adds. It does not say consumers always want more."],
  ],
  21: [
    ["0.2", "$20 saved out of $100 gives 0.2. This is the marginal propensity to save. MPC is the part that is spent, 80 ÷ 100."],
    ["80.", "MPC is a ratio of the change in consumption to the change in income. 80 is just the dollar amount spent."],
    ["1.25", "This divides income by consumption. MPC divides the change in consumption (80) by the change in income (100)."],
  ],
  22: [
    ["the rate of interest", "MPC and MPS are shares of extra income spent and saved. They add to 1 because each extra dollar is either spent or saved."],
    ["the level of income", "MPC and MPS are proportions, not amounts of income. Together they cover all of the extra income."],
    ["0.", "Both propensities cannot be zero, because any extra income is either spent or saved. They add to 1."],
  ],
  23: [
    ["rises as", "That describes a normal good. For an inferior good, higher incomes lead buyers to switch to better goods."],
    ["does not respond", "Inferior goods do respond to income: buyers want less of them as their income rises."],
    ["always has", "An inferior good is defined by how demand responds to income, not by its price. Many inferior goods are cheap, but it is not part of the definition."],
  ],
  24: [
    ["consumers can set", "Consumer sovereignty is about consumers influencing what is produced through their spending, not setting prices."],
    ["producers completely", "The idea is that consumers guide producers, not that producers control consumers."],
    ["the government decides", "In a system of consumer sovereignty, consumers' choices decide what is produced, not the government."],
  ],
  25: [
    ["the depreciation", "Accounting profit already subtracts depreciation as an explicit cost. What economic profit also subtracts is opportunity cost."],
    ["the wages", "Wages paid to employees are explicit costs, which accounting profit already deducts."],
    ["the Goods", "GST is not a cost that separates economic from accounting profit. The difference is implicit costs, such as the owner's own time."],
  ],
  26: [
    ["a firm produces exactly", "Minimum efficient scale is the output where average cost stops falling. Economies of scale are the falling average cost on the way there."],
    ["long-run average cost rises", "That is diseconomies of scale. Economies of scale mean average cost falls as output rises."],
    ["a firm is making", "Profit or loss depends on revenue as well as cost. Economies of scale are about unit costs falling."],
  ],
  27: [
    ["the age profile", "Derived demand means labour is wanted for what it produces. The age of the workforce does not determine the demand."],
    ["the number of people", "This describes the supply of labour. Demand comes from firms wanting workers to produce goods."],
    ["the level of the minimum", "The minimum wage affects the cost of labour, but 'derived' means the demand comes from demand for the product."],
  ],
  28: [
    ["A fall in the wage", "A lower relative wage makes the occupation less attractive, so fewer people want to do it. That reduces supply."],
    ["A fall in consumer", "This reduces the demand for labour, as firms need fewer workers. It does not make more people qualified to supply labour."],
    ["An increase in the productivity", "Higher productivity raises the demand for labour, because each worker is worth more. It does not directly change how many are willing to work."],
  ],
  29: [
    ["collect", "Collecting tax is done by the government. The financial sector moves savings to borrowers."],
    ["print", "Printing currency is done by the central bank. The financial sector moves savings to borrowers."],
    ["decide", "Government spending is decided by the government. The financial sector channels funds from savers to borrowers."],
  ],
  30: [
    ["bond market", "Bonds are a way to borrow, not a share issue. New shares issued to raise funds are sold in the primary market."],
    ["foreign exchange", "The foreign exchange market is where currencies are traded, not shares."],
    ["secondary", "The secondary market is where existing shares are traded between investors. New issues are made in the primary market."],
  ],
  31: [
    ["a private", "The RBA is not a private fund manager. It is the central bank, owned by the government."],
    ["the largest commercial", "The RBA does not serve the public as a retail bank. It is the central bank and the banks' bank."],
    ["the government department", "The Budget is prepared by the Treasury. The RBA conducts monetary policy."],
  ],
  32: [
    ["the rate of inflation", "Inflation is the rise in the general price level. An interest rate is the price of borrowing money."],
    ["the rate of growth", "That is the rate of economic growth. An interest rate is the price of borrowing money."],
    ["the exchange rate", "The exchange rate is the price of one currency in another. The interest rate is the price of borrowing money."],
  ],
  33: [
    ["raise", "More funds available for lending make borrowing cheaper, so the interest rate falls."],
    ["reduce", "With more funds supplied and a lower rate, more is borrowed and lent, not less."],
    ["have no effect", "Moving the supply curve changes the equilibrium. The interest rate falls when more funds are supplied."],
  ],
  34: [
    ["buying a share", "A bond is a loan, not ownership. Owning part of a company is what shares are for."],
    ["borrowing money", "The buyer is the lender. The government is the one borrowing."],
    ["paying a form", "Buying a bond is a loan that the government repays with interest. A tax is not repaid."],
  ],
  35: [
    ["cheaper to build", "Higher rates generally raise costs for builders, who also borrow. The question is about buyers, who face dearer mortgages."],
    ["unaffected", "Most housing is bought with a mortgage, so interest rates have a big effect."],
    ["more affordable", "Higher rates raise repayments, so housing is less affordable. House prices are not fixed by law."],
  ],
  36: [
    ["a form of government", "Super is saved by workers and invested. It is not spending by the government."],
    ["a type of consumer", "Super is a pool of savings, not a good that people consume."],
    ["a consumption tax", "Super contributions go into the worker's own retirement savings. They are not a tax on spending."],
  ],
  37: [
    ["Preventing", "Governments usually support trade. Preventing all trade is not one of the syllabus roles of government."],
    ["Maximising", "Governments do not aim to maximise private profits. Their roles include redistribution, reallocation and stabilisation."],
    ["Setting", "In a market economy prices are mostly set by supply and demand, and governments only intervene in some markets."],
  ],
  38: [
    ["is always calculated", "A percentage of the selling price is how the GST works, and that is an indirect tax. A direct tax such as income tax is on income."],
    ["applies only", "Taxes on imports are tariffs. A direct tax, such as income tax, applies to people and businesses and is paid by them."],
    ["is levied on producers", "That is an indirect tax: the burden is passed on to consumers. A direct tax stays with the person who pays it."],
  ],
  39: [
    ["Company", "Company tax is charged on a firm's profit and paid by that firm, so it is a direct tax."],
    ["Personal income", "Income tax is paid by the person who earns the income, so it is a direct tax."],
    ["The Medicare", "The Medicare levy is charged on a person's taxable income and paid by them, so it is a direct tax."],
  ],
  40: [
    ["the legal name", "A tax's name has nothing to do with who bears it. Economic incidence is about who ends up paying."],
    ["the government agency", "Which agency collects the tax is not the incidence. The incidence is who ultimately bears the burden."],
    ["the date", "The collection date is not the incidence. The incidence is who ultimately bears the cost."],
  ],
  41: [
    ["every person pays", "A flat dollar amount for everyone is a poll tax, which takes a bigger share of low incomes. A progressive tax takes a larger share as income rises."],
    ["the average rate of tax falls", "That is a regressive tax. In a progressive tax the average rate rises with income."],
    ["only businesses", "A progressive tax is defined by how the rate changes with income. It can apply to individuals, such as income tax."],
  ],
  42: [
    ["regressivity", "These are poor features for a tax. A good tax is simple, fair and efficient."],
    ["high revenue", "Secrecy and complexity make a tax harder to follow and comply with, so they are the opposite of good features."],
    ["progressivity", "A good tax need not be progressive or indirect. The three widely accepted features are simplicity, equity and efficiency."],
  ],
  43: [
    ["The salaries", "Teachers' salaries are payment for work done, so they are not transfers. A transfer payment is made for nothing in return."],
    ["Government purchases", "Buying equipment is payment for a good, so it is not a transfer. Nothing is provided in return for a transfer."],
    ["Government spending on building", "Building a hospital pays for goods and services, so it is spending on production, not a transfer."],
  ],
  44: [
    ["leakages equal", "This describes the circular flow being in equilibrium. A deficit is about the government's spending and revenue."],
    ["government revenue exceeds", "That is a surplus. In a deficit spending exceeds revenue."],
    ["the government has any", "A government can have debt while running a surplus. A deficit is about one period's spending and revenue."],
  ],
  45: [
    ["trade removes", "Scarcity cannot be removed, because wants are still unlimited. Trade makes better use of scarce resources."],
    ["a country's exports are always", "Trade is not about exports beating imports. Both sides gain from trade, whatever the balance."],
    ["trade allows", "Trade lets a country specialise in what it does best, but it still produces goods. It does not avoid production."],
  ],
  46: [
    ["the value of its exports equals", "Equal exports and imports is a balanced trade position, not a surplus."],
    ["it holds no", "Foreign debt and the trade balance are separate things. A surplus means exports exceed imports."],
    ["the value of its imports exceeds", "That is a trade deficit. A surplus is when exports exceed imports."],
  ],
  47: [
    ["Australian exports become cheaper", "An appreciation makes the Australian dollar worth more, so exports cost buyers more, not less."],
    ["there is no effect", "A change in the exchange rate changes the price of traded goods in the other currency."],
    ["the Australian dollar now buys fewer", "After an appreciation the Australian dollar buys more US cents, not fewer. That is why imports get cheaper."],
  ],
  48: [
    ["the value of Australia's service", "Exports are sales to other countries. Foreign equity is about who owns Australian assets."],
    ["money Australia has borrowed", "That is foreign debt. Equity is ownership, not borrowing."],
    ["Australian government bonds", "Bonds held by Australians are domestic holdings. Foreign equity means ownership by foreigners."],
  ],
  49: [
    ["the difference between GDP", "This is not what the balance of payments measures. It records transactions with the rest of the world."],
    ["the Australian Government's annual", "The Budget statement covers government spending and revenue. The balance of payments is about dealings with other countries."],
    ["a measure of the total money", "The money supply is a different measure. The balance of payments records transactions with the rest of the world."],
  ],
  50: [
    ["that it can produce in the largest", "That is absolute advantage. Comparative advantage looks at opportunity cost, so a country can gain from trade even if it is not the best at anything."],
    ["that sell for the highest", "The price a good sells for is not the rule. Specialise where the opportunity cost is lower than your partners'."],
    ["that it currently imports", "What a country imports does not show its advantage. The test is lower opportunity cost."],
  ],
  51: [
    ["A shop has too much", "Leftover stock is a problem of poor sales or planning. Scarcity is about not having enough resources to meet every want."],
    ["Prices are set by the government", "Price setting is a feature of some economic systems. It is not what scarcity means."],
    ["The government prints", "Printing too much money is about inflation. Scarcity is the limit on resources compared with wants."],
  ],
  52: [
    ["consumer demand for goods falls", "Falling demand does not change what the economy is able to produce. The frontier shifts only when productive capacity changes."],
    ["unemployment in the economy rises", "Higher unemployment moves the economy inside the frontier. It does not move the frontier itself."],
    ["some of the economy's resources", "Losing resources reduces what the economy can produce, so the frontier would shift inward, not outward."],
  ],
  53: [
    ["A higher minimum wage would", "'Would be good' is a value judgement and cannot be tested against facts. That makes it normative."],
    ["The government should", "'Should' signals an opinion about what ought to happen, so it is normative."],
    ["It is unfair", "'Unfair' is a value judgement, so this is normative."],
  ],
  54: [
    ["loanable funds", "In the basic model households supply the factors of production. Import revenue is paid to overseas sellers, not to households."],
    ["government spending, in exchange", "Governments, not households, spend in the circular flow. Households do not pay for goods with votes."],
    ["finished goods", "It is firms that produce finished goods and services for households, not the other way round."],
  ],
  55: [
    ["Injections rise", "Rising injections with falling leakages would add spending to the flow and expand activity."],
    ["Leakages and injections both", "If both rise by the same amount, they stay equal, so the economy stays in equilibrium rather than contracting."],
    ["Leakages and injections stay", "If they stay equal, the economy remains in equilibrium and activity does not change."],
  ],
  56: [
    ["the point at which growth", "The peak is the highest level of activity, not a point where growth is zero for ever. Activity turns down after it."],
    ["the point at which economic activity is at its lowest", "That is the trough. The peak is the highest point."],
    ["a period of steady", "The business cycle is about fluctuations. The peak is a turning point, not a steady period."],
  ],
  57: [
    ["assuming firms never", "Behavioural economics is about how people, including consumers, depart from perfect rationality. It does not say firms ignore profit."],
    ["ignoring psychology", "It is the other way around. Behavioural economics brings psychology into economics, while traditional theory largely leaves it out."],
    ["assuming consumers always", "Traditional theory often assumes perfect information. Behavioural economics recognises that people are limited in what they know and how they decide."],
  ],
  58: [
    ["Who should hold", "Choosing political leaders is not an economic allocation question. The three questions are what, how and for whom to produce."],
    ["How much tax", "How much tax to collect is a government policy decision. It is not one of the basic questions every economy must answer."],
    ["How many banks", "The number of banks is a detail of the financial system and not a basic allocation question."],
  ],
  59: [
    ["fall and rise", "A leftward shift of supply is a reduction in supply, so there is less on the market and the price rises."],
    ["both rise", "With less supplied at each price, the quantity traded falls even though the price rises."],
    ["both fall", "Less supply makes the good scarcer, so the price goes up, not down."],
  ],
  60: [
    ["A fixed piece", "Land in one spot cannot be expanded, so its supply is inelastic, not elastic."],
    ["A good that requires years", "If it takes years to expand production, supply cannot respond quickly to price, so it is inelastic."],
    ["Fresh perishable", "Produce that must be sold on the day cannot be stored or increased quickly, so supply is inelastic."],
  ],
  61: [
    ["has no competitors", "That describes a monopoly. A monopolistically competitive firm has many competitors but sells a differentiated product."],
    ["sells an identical", "That describes a firm in perfect competition. The monopolistically competitive firm sells a differentiated product."],
    ["is always the largest", "Size does not define the market structure. The difference is product differentiation and some price control."],
  ],
  62: [
    ["thousands", "Thousands of sellers of an identical good describes perfect competition. An oligopoly has only a few firms."],
    ["many small firms", "Many small price-taking firms is perfect competition. An oligopoly has a small number of large firms."],
    ["one firm", "One firm in control is a monopoly. An oligopoly has a few large firms."],
  ],
  63: [
    ["the free market tends to over-consume", "That is the effect of a negative externality. A positive externality means others benefit, so the market under-consumes."],
    ["the good has no effect", "A positive externality means other people also get a benefit, so the good does affect third parties."],
    ["the market outcome is already", "The price ignores the benefit to others, so too little is consumed and the outcome is not socially optimal."],
  ],
  64: [
    ["the government is legally", "Governments often fund merit goods, but there is no legal requirement in the definition. A merit good is defined by its benefits and under-consumption."],
    ["generates no", "Merit goods usually generate external benefits, which is part of why they are under-consumed."],
    ["is always non-excludable", "That is the definition of a public good. A merit good can be bought and sold and can exclude people."],
  ],
  65: [
    ["a tax raises", "Raising more revenue than expected is not a failure of resource allocation. Government failure is intervention making things worse."],
    ["a market reaches", "Reaching equilibrium is how a market normally works. It is not government failure."],
    ["the private sector is unable", "That is market failure, where the market does not provide a good. Government failure is when intervention makes the outcome worse."],
  ],
  66: [
    ["A subsidy", "A subsidy would encourage more production, which makes the external cost bigger."],
    ["Removing all", "Without regulation nothing makes the producer pay for the harm, so the externality goes uncorrected."],
    ["A price ceiling", "A ceiling below the equilibrium reduces supply and causes shortages. It does not make producers bear the external cost."],
  ],
  67: [
    ["output is produced at the lowest", "That is productive efficiency. Allocative efficiency is about producing what consumers value, where price equals marginal cost."],
    ["firms earn the maximum", "Maximum profit is a goal of the firm. Allocative efficiency is about price matching marginal cost."],
    ["the government sets", "In a competitive market the price is set by supply and demand. Allocative efficiency does not need a government price."],
  ],
  68: [
    ["the price of the good keeps", "Rising prices do not make more units worthwhile. A rational buyer keeps buying while the extra satisfaction is worth at least the price."],
    ["every unit gives exactly", "The law says each extra unit gives less satisfaction. It does not stay the same."],
    ["total utility is falling", "A rational consumer stops before total utility falls. Marginal utility is the extra satisfaction from one more unit."],
  ],
  69: [
    ["a rise in consumption", "With income fixed, income is either spent or saved. If saving rises, there is less left to spend."],
    ["a rise in household income", "The question says income is unchanged. The extra saving comes from spending less."],
    ["no change in consumption", "Income is either spent or saved. If saving rises and income is fixed, consumption must fall."],
  ],
  70: [
    ["Expectations of an upcoming", "Fearing a recession makes households cautious, so they save more and spend less of their income."],
    ["Higher interest rates", "Higher interest rates on savings reward saving, so households tend to save more and consume less."],
    ["An increase in the rate of income tax", "Higher tax reduces disposable income. It does not make households spend a larger share of what they have left."],
  ],
  71: [
    ["average cost always rises", "Average cost falls at low output as fixed costs are spread over more units. It rises only later."],
    ["average cost stays constant", "In the short run some inputs are fixed, so average cost changes with output."],
    ["average cost always falls", "At higher output diminishing returns set in and average cost rises, which is why the curve turns up."],
  ],
  72: [
    ["savings that come", "Economies of scale come from the firm's own growth in size, such as bulk buying, not from subsidies."],
    ["cost savings shared between", "Savings shared between competitors are not internal. Internal economies belong to the individual firm."],
    ["cost savings shared by an entire", "Savings shared by a whole industry are external economies of scale. Internal ones belong to a single firm."],
  ],
  73: [
    ["a bank loan", "A bank loan is debt, which must be repaid with interest."],
    ["trade credit", "Trade credit is a debt owed to suppliers, which has to be paid."],
    ["a corporate bond", "A bond is a loan to the company that must be repaid, with interest."],
  ],
  74: [
    ["is always equal", "Normal profit is not zero. It is the amount that covers the owner's opportunity cost, so the owner stays in the business."],
    ["is the maximum", "Normal profit is a minimum, not a legal limit. It is the least the owner needs to stay in the business."],
    ["includes only explicit", "Normal profit covers the implicit cost of the owner's resources. Counting only explicit costs gives accounting profit."],
  ],
  75: [
    ["wages have", "Productivity is about output per hour of work. Wages may rise with productivity, but that is a different thing."],
    ["the size of the labour force", "Productivity is output per unit of labour, not the number of workers."],
    ["more workers have", "Hiring more workers raises total output, but productivity is output per worker or per hour."],
  ],
  76: [
    ["A rise in the prices", "A higher price for the product makes each worker more valuable, so firms want more workers, not fewer."],
    ["An increase in worker", "Higher productivity makes labour more valuable to the firm, which tends to raise demand for it."],
    ["A government subsidy", "A subsidy lowers the firm's costs and encourages production, which raises the demand for labour."],
  ],
  77: [
    ["a government-guaranteed", "Shares are not guaranteed by the government, and their value can go up and down. A share is part ownership of a company."],
    ["a loan to the company", "That is a bond or debt. A share gives part ownership, not a loan."],
    ["a fixed-interest", "A share pays dividends that vary, not a fixed interest rate. A fixed-interest security is debt."],
  ],
  78: [
    ["printing", "Printing currency is done by the central bank, not by commercial banks."],
    ["collecting", "Collecting income tax is done by the tax office."],
    ["setting", "Fiscal policy is set by the government. Banks take deposits and lend."],
  ],
  79: [
    ["all investments carry", "Investments carry different levels of risk. The trade-off is that taking more risk gives a chance at higher returns."],
    ["safer investments always", "It is the opposite. Safer investments typically offer lower returns."],
    ["risk and expected return", "The two are linked: investors usually need the prospect of higher returns to accept more risk."],
  ],
  80: [
    ["increase the reward", "Lower interest rates reduce the return on saving."],
    ["have no effect", "Cheaper borrowing makes investment more attractive, so a fall in interest rates tends to increase it."],
    ["discourage", "Lower rates make borrowing cheaper, so they encourage borrowing and investment."],
  ],
  81: [
    ["It sets the official", "The cash rate is set by the Reserve Bank, not the ASX."],
    ["It regulates", "The minimum wage is set by the Fair Work Commission. The ASX runs a market for securities."],
    ["It collects", "Company tax is collected by the tax office, not the ASX."],
  ],
  82: [
    ["borrowing directly", "Intermediaries take deposits from savers. Borrowing from the government would not spread risk among savers."],
    ["refusing", "Lending is what intermediaries do. They reduce risk by lending carefully and widely, not by not lending."],
    ["guaranteeing zero", "No lender can guarantee zero risk. Intermediaries reduce risk by pooling funds and diversifying."],
  ],
  83: [
    ["an insurance policy", "Insurance protects against loss. A term deposit is a savings product that earns interest."],
    ["a government bond", "A term deposit is held with a financial institution, not issued by the government to fund the Budget."],
    ["a type of company share", "A term deposit pays a fixed interest rate and is not traded. A share is part ownership of a company."],
  ],
  84: [
    ["shares always pay", "Shares pay dividends that vary, and a company may pay none. A fixed rate of interest is what a deposit offers."],
    ["bank deposits pay no", "Bank deposits do pay interest. That is part of why they are safer."],
    ["share prices never", "Share prices change all the time, which is a source of risk."],
  ],
  85: [
    ["the exchange rate to", "Exchange rate policy is separate. Fiscal policy uses the Budget, which means government spending and taxation."],
    ["interest rates and the money", "That is monetary policy, run by the Reserve Bank. Fiscal policy is about government spending and taxation."],
    ["foreign aid", "Foreign aid is a small part of spending and not what fiscal policy means. It uses spending and taxation."],
  ],
  86: [
    ["only changing", "Changing interest rates is monetary policy. A Budget works through government spending and taxes."],
    ["cutting government spending", "That is a contractionary Budget, which slows spending in the economy."],
    ["keeping spending", "Unchanged spending and taxes would be a neutral Budget, which would not stimulate the economy."],
  ],
  87: [
    ["the average rate of tax rises", "That is a progressive tax. In a regressive tax the average rate falls as income rises."],
    ["every taxpayer pays", "The same rate for everyone is a proportional tax. A regressive tax takes a smaller share as income rises."],
    ["only businesses", "Whether a tax is regressive depends on how the rate changes with income. It is not limited to businesses."],
  ],
  88: [
    ["The government paying unemployment", "Unemployment benefits move income between people, which is redistribution. Reallocation shifts resources toward goods like health and education."],
    ["The Reserve Bank", "Lowering interest rates is a stabilisation tool, not reallocation of resources."],
    ["The government allowing", "A floating exchange rate is a market arrangement, not the government shifting resources to different uses."],
  ],
  89: [
    ["guarantee a Budget", "Stabilisation policy aims to smooth the business cycle. It does not aim for a surplus every year, and during a downturn it may run a deficit."],
    ["maximise government", "Stabilisation is about smoothing the economy, not maximising tax revenue."],
    ["eliminate the business cycle", "Policy tries to reduce the swings, not remove the cycle for ever."],
  ],
  90: [
    ["government expenditure exceeds", "That is a deficit. A surplus is when revenue exceeds spending."],
    ["the government has no", "A government can have debt and still run a surplus. A surplus is about one period's revenue and spending."],
    ["revenue and expenditure are exactly", "Equal revenue and expenditure is a balanced Budget. A surplus has revenue greater than spending."],
  ],
  91: [
    ["A price ceiling", "A ceiling would cause shortages. It does not make producers pay the external cost."],
    ["Removing all", "Without regulation, producers ignore the cost to others, so the externality is not corrected."],
    ["A subsidy", "A subsidy would encourage more production and so make the external cost bigger."],
  ],
  92: [
    ["everyone should pay exactly", "The same dollar amount from everyone ignores ability to pay. Vertical equity is about paying according to capacity."],
    ["tax rates should never", "Vertical equity is about how the burden is shared by capacity to pay, not about whether rates change."],
    ["people in similar", "That is horizontal equity. Vertical equity is about people with different incomes."],
  ],
  93: [
    ["its receipts", "Receipts greater than payments is a current account surplus."],
    ["its exchange rate is fixed", "A current account deficit has nothing to do with the exchange rate regime. It is about payments exceeding receipts."],
    ["its payments and receipts", "Equal payments and receipts means the current account is balanced, not in deficit."],
  ],
  94: [
    ["only affect", "A change in the exchange rate changes the prices of exports and imports. It is not limited to government debt."],
    ["have no effect", "A depreciation changes the foreign-currency price of exports and the domestic price of imports."],
    ["make Australian exports more expensive", "That is what an appreciation does. A depreciation does the opposite."],
  ],
  95: [
    ["Australians investing", "Investing overseas means Australians supply Australian dollars to buy foreign currency, which raises supply of the AUD, not demand."],
    ["An increase in Australian demand", "Buying imports requires Australians to sell Australian dollars, which increases the supply of the dollar, not the demand."],
    ["A fall in Australian interest rates", "Lower relative interest rates make Australian assets less attractive, so foreign investors want fewer Australian dollars."],
  ],
  96: [
    ["apply only", "Protectionism mostly targets imports, with tariffs and quotas. It is not limited to exports."],
    ["remove all", "Removing barriers is the opposite. Protectionism puts barriers in place."],
    ["encourage completely", "Free trade is the opposite of protectionism. Protectionism restricts trade."],
  ],
  97: [
    ["a subsidy", "A subsidy is a payment to producers. A tariff is a tax on imports."],
    ["a tax imposed on goods a country exports", "A tariff is a tax on imports, not exports."],
    ["a limit on the physical", "That is an import quota. A tariff is a tax on imports."],
  ],
  98: [
    ["has no effect", "A quota restricts supply, which usually raises the domestic price."],
    ["applies only", "Import quotas apply to imports, not exports."],
    ["always raises", "A tariff raises revenue for the government. A quota does not collect a tax by itself."],
  ],
  99: [
    ["Export and import prices rising", "If both rise by the same percentage, the relative price does not change, so the terms of trade do not change."],
    ["The exchange rate becoming", "The terms of trade compare export prices with import prices. Fixing the exchange rate does not change that ratio."],
    ["Import prices rising", "That worsens the terms of trade, because a given quantity of exports now buys fewer imports."],
  ],
  100: [
    ["a country closing", "Closing borders is the opposite of globalisation, which is increasing links between economies."],
    ["a single country's", "Globalisation is about links between many economies, not one economy growing alone."],
    ["the abolition", "Globalisation concerns economic links across borders. National governments continue to exist."],
  ],
};

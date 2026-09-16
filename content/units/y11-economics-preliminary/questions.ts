import type { McQuestion, Question, ShortQuestion } from "@/lib/types";
import { shuffleBySeed } from "@/lib/shuffle";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Original questions written to the current (2025) NESA Economics 11–12
// syllabus, Year 11 — see docs/y11-economics-preliminary-research.md.
//
// 100 multiple choice (group "mc", 1 mark) + 100 short answer (group "sa",
// 2–4 marks). A quiz draws 5 + 5 — 20 non-repeating attempts.

const U = "y11-economics-preliminary";
const p2 = (n: number) => String(n).padStart(2, "0");

function mc(n: number, prompt: string, canonical: [string, string, string, string]): McQuestion {
  const id = `${U}.m${p2(n)}`;
  return {
    id,
    group: "mc",
    type: "mc",
    prompt,
    maxMarks: 1,
    options: shuffleBySeed(id, canonical),
  };
}

function sa(n: number, marks: number, prompt: string): ShortQuestion {
  return { id: `${U}.s${p2(n)}`, group: "sa", type: "short", prompt, maxMarks: marks };
}

// ========================================================================
// Multiple choice — m01..m50
// ========================================================================

const mcQuestions: McQuestion[] = [
  // --- Introduction to economics ---
  mc(1, "The fundamental economic problem is that:", [
    "unlimited wants must be satisfied using scarce (limited) resources.",
    "governments cannot agree on how to spend tax revenue.",
    "there is too much money in the economy.",
    "some people earn more income than others.",
  ]),
  mc(2, "The opportunity cost of a decision is:", [
    "the value of the next best alternative that is given up.",
    "the money price paid for the option chosen.",
    "the total value of all the alternatives not chosen.",
    "the benefit received from the option that is chosen.",
  ]),
  mc(3, "Which list correctly identifies the four factors of production?", [
    "Land, labour, capital and enterprise.",
    "Land, labour, money and goods.",
    "Rent, wages, interest and profit.",
    "Households, businesses, government and the overseas sector.",
  ]),
  mc(4, "The factor income earned by the owners of capital is:", [
    "interest.",
    "rent.",
    "wages.",
    "profit.",
  ]),
  mc(5, "In a market economy, the questions of what, how and for whom to produce are answered mainly by:", [
    "the price mechanism — the interaction of buyers and sellers.",
    "a central planning authority.",
    "custom and tradition.",
    "the largest firm in each industry.",
  ]),
  mc(6, "A point located inside (below) a country's production possibilities frontier indicates that:", [
    "resources are unemployed or not being used efficiently.",
    "the economy is producing an unattainable combination of goods.",
    "the economy is producing at maximum efficiency.",
    "the frontier has shifted outward.",
  ]),
  mc(7, "Which of the following lists contains only leakages from the circular flow of income?", [
    "Savings, taxation and imports.",
    "Investment, government spending and exports.",
    "Consumption, savings and taxation.",
    "Wages, rent and profit.",
  ]),
  mc(8, "An economy is in equilibrium in the circular flow of income model when:", [
    "S + T + M = I + G + X (total leakages equal total injections).",
    "the government Budget is balanced.",
    "savings equal investment, regardless of the other flows.",
    "exports equal imports.",
  ]),
  mc(9, "During the contraction (downturn) phase of the business cycle, an economy would typically experience:", [
    "rising unemployment and slowing or falling economic activity.",
    "rising inflation and falling unemployment.",
    "record levels of business investment.",
    "an economic boom.",
  ]),
  // --- Markets ---
  mc(10, "When a rise in the price of a good encourages firms to produce more of it, the price mechanism is performing its:", [
    "incentive function.",
    "signalling function.",
    "rationing function.",
    "redistribution function.",
  ]),
  mc(11, "A rise in consumer incomes that increases the demand for a normal good is shown on a demand and supply diagram as:", [
    "a rightward shift of the demand curve.",
    "a movement up along the demand curve.",
    "a movement down along the demand curve.",
    "a rightward shift of the supply curve.",
  ]),
  mc(12, "If the demand for a good increases while its supply is unchanged, the new market equilibrium will have:", [
    "a higher price and a higher quantity.",
    "a lower price and a higher quantity.",
    "a higher price and a lower quantity.",
    "a lower price and a lower quantity.",
  ]),
  mc(13, "A 10% rise in the price of a good causes the quantity demanded to fall by 5%. The price elasticity of demand is:", [
    "0.5 — demand is relatively inelastic.",
    "2 — demand is relatively elastic.",
    "0.5 — demand is relatively elastic.",
    "5 — demand is perfectly elastic.",
  ]),
  mc(14, "The demand for a good is likely to be most price-inelastic when the good:", [
    "is a necessity with few close substitutes.",
    "has many close substitutes.",
    "takes up a large share of the consumer's income.",
    "is a luxury that can be postponed.",
  ]),
  mc(15, "A market with a single seller, no close substitutes and very high barriers to entry is a:", [
    "monopoly.",
    "perfectly competitive market.",
    "monopolistically competitive market.",
    "market that must be government-owned.",
  ]),
  mc(16, "Perfect competition is characterised by:", [
    "many small firms selling identical products, with no barriers to entry and no pricing power.",
    "a few large firms with significant pricing power.",
    "one dominant firm protected by high barriers to entry.",
    "many firms selling slightly differentiated products with some pricing power.",
  ]),
  mc(17, "Air pollution produced by a factory, for which neither the firm nor its customers pay, is an example of:", [
    "a negative externality from production.",
    "a positive externality from consumption.",
    "a public good.",
    "a merit good.",
  ]),
  mc(18, "A public good is best defined as a good that is:", [
    "non-excludable and non-rival in consumption.",
    "any good provided free of charge by the government.",
    "always also a merit good.",
    "produced only by monopolies.",
  ]),
  mc(19, "A government imposes a binding price ceiling (maximum price) on rents. The most likely result is:", [
    "a persistent shortage of rental housing.",
    "a persistent surplus of rental housing.",
    "the rental market clearing at the ceiling price.",
    "an increase in the supply of rental housing.",
  ]),
  // --- Household and business sector ---
  mc(20, "The law of diminishing marginal utility states that:", [
    "as a person consumes more units of a good, the extra satisfaction from each additional unit falls.",
    "total satisfaction falls as a person consumes more of a good.",
    "consumers always want more of every good.",
    "marginal utility stays constant as consumption rises.",
  ]),
  mc(21, "A household receives an extra $100 of income and spends $80 of it. Its marginal propensity to consume is:", [
    "0.8.",
    "0.2.",
    "1.25.",
    "80.",
  ]),
  mc(22, "In a simple model of household behaviour, MPC + MPS equals:", [
    "1.",
    "0.",
    "the level of income.",
    "the rate of interest.",
  ]),
  mc(23, "An inferior good is one for which the quantity demanded:", [
    "falls as consumer incomes rise.",
    "rises as consumer incomes rise.",
    "does not respond to changes in income.",
    "always has a very high price.",
  ]),
  mc(24, "Consumer sovereignty is the idea that:", [
    "consumers, through their spending decisions, ultimately determine what is produced.",
    "consumers can set the prices they are charged.",
    "the government decides what consumers are allowed to buy.",
    "producers completely control consumer tastes through advertising.",
  ]),
  mc(25, "Economic profit differs from accounting profit because economic profit also subtracts:", [
    "the opportunity cost of the resources the owner supplies (such as their own labour and capital).",
    "the Goods and Services Tax.",
    "the depreciation of equipment.",
    "the wages paid to employees.",
  ]),
  mc(26, "Economies of scale occur when:", [
    "long-run average cost falls as the scale of production increases.",
    "long-run average cost rises as output increases.",
    "a firm produces exactly at its minimum efficient scale.",
    "a firm is making an economic loss.",
  ]),
  mc(27, "The demand for labour is described as a 'derived demand' because it depends on:", [
    "the demand for the goods and services that the labour is used to produce.",
    "the number of people looking for work.",
    "the level of the minimum wage.",
    "the age profile of the workforce.",
  ]),
  mc(28, "Which of the following would increase the supply of labour to a particular occupation?", [
    "More people gaining the qualifications the occupation requires.",
    "A fall in the wage paid relative to other occupations.",
    "A fall in consumer demand for the goods that occupation produces.",
    "An increase in the productivity of those workers.",
  ]),
  // --- Financial sector ---
  mc(29, "The main role of the financial sector in the economy is to:", [
    "channel funds from savers to borrowers, facilitating saving and investment.",
    "print the nation's currency.",
    "decide the level of government spending.",
    "collect taxation revenue.",
  ]),
  mc(30, "When a company issues new shares to the public to raise funds, this transaction takes place in the:", [
    "primary market.",
    "secondary market.",
    "foreign exchange market.",
    "bond market.",
  ]),
  mc(31, "The Reserve Bank of Australia is best described as:", [
    "Australia's central bank, responsible for monetary policy.",
    "the largest commercial (retail) bank in Australia.",
    "the government department that prepares the federal Budget.",
    "a private superannuation fund manager.",
  ]),
  mc(32, "An interest rate is best described as:", [
    "the price of money — the cost of borrowing and the reward for saving.",
    "the rate of inflation in the economy.",
    "the exchange rate of the Australian dollar.",
    "the rate of growth of real GDP.",
  ]),
  mc(33, "In the loanable funds model, an increase in the supply of funds (for example, higher household saving) will, all else equal:", [
    "lower the equilibrium interest rate.",
    "raise the equilibrium interest rate.",
    "have no effect on the interest rate.",
    "reduce the total quantity of funds borrowed and lent.",
  ]),
  mc(34, "The buyer of a newly issued government bond is:", [
    "lending money to the government in return for interest payments.",
    "buying a share of ownership in the government.",
    "borrowing money from the government.",
    "paying a form of tax to the government.",
  ]),
  mc(35, "A rise in interest rates, all else equal, tends to make housing:", [
    "less affordable, because mortgage repayments increase.",
    "more affordable, because house prices are fixed by law.",
    "cheaper to build.",
    "unaffected, because housing is not bought with credit.",
  ]),
  mc(36, "Superannuation contributes to the Australian economy mainly by acting as:", [
    "a large pool of national savings that helps fund investment.",
    "a form of government spending.",
    "a consumption tax on wages.",
    "a type of consumer durable good.",
  ]),
  // --- Government sector ---
  mc(37, "Which of the following is a core economic role of government identified in the syllabus?", [
    "Redistribution of income.",
    "Maximising the profits of private businesses.",
    "Setting the price of every good in the economy.",
    "Preventing all international trade.",
  ]),
  mc(38, "A direct tax is one that:", [
    "is levied on, and paid by, the same person or entity (for example, personal income tax).",
    "is levied on producers but ultimately paid by consumers through higher prices.",
    "is always calculated as a percentage of a good's selling price.",
    "applies only to imported goods.",
  ]),
  mc(39, "Which of the following is an indirect tax in Australia?", [
    "The Goods and Services Tax (GST).",
    "Personal income tax (PAYG).",
    "Company (profit) tax.",
    "The Medicare levy on taxable income.",
  ]),
  mc(40, "The economic incidence of a tax refers to:", [
    "who ultimately bears the burden of the tax.",
    "the legal name given to the tax.",
    "the date on which the tax is collected.",
    "the government agency that administers the tax.",
  ]),
  mc(41, "A progressive tax is one in which:", [
    "the average rate of tax rises as a person's income rises.",
    "every person pays the same dollar amount of tax.",
    "the average rate of tax falls as income rises.",
    "only businesses, not individuals, pay the tax.",
  ]),
  mc(42, "Three widely accepted features of a 'good' tax are:", [
    "simplicity, fairness (equity) and efficiency.",
    "high revenue, secrecy and complexity.",
    "regressivity, volatility and ease of evasion.",
    "progressivity, indirectness and an excise base.",
  ]),
  mc(43, "Which of the following is a transfer payment?", [
    "The Age Pension.",
    "The salaries paid to public school teachers.",
    "Government spending on building a new hospital.",
    "Government purchases of office equipment.",
  ]),
  mc(44, "A government Budget is in deficit when, over a period:", [
    "government expenditure exceeds government revenue.",
    "government revenue exceeds government expenditure.",
    "the government has any debt outstanding.",
    "leakages equal injections in the circular flow.",
  ]),
  // --- International sector ---
  mc(45, "The basic economic case for international trade is that:", [
    "voluntary exchange lets countries specialise according to opportunity cost, and both trading partners can gain.",
    "a country's exports are always more valuable than its imports.",
    "trade allows a country to avoid producing anything at all.",
    "trade removes the problem of scarcity.",
  ]),
  mc(46, "A country has a trade surplus when:", [
    "the value of its exports exceeds the value of its imports.",
    "the value of its imports exceeds the value of its exports.",
    "the value of its exports equals the value of its imports.",
    "it holds no foreign debt.",
  ]),
  mc(47, "If the Australian dollar appreciates against the US dollar:", [
    "Australian exports become more expensive for US buyers, and US imports become cheaper for Australians.",
    "Australian exports become cheaper for US buyers, and US imports become more expensive for Australians.",
    "there is no effect on the prices of exports or imports.",
    "the Australian dollar now buys fewer US cents.",
  ]),
  mc(48, "Foreign equity in Australia refers to:", [
    "foreign ownership of Australian assets, such as shares in Australian companies and property.",
    "money Australia has borrowed from overseas that must be repaid with interest.",
    "Australian government bonds held by Australian residents.",
    "the value of Australia's service exports.",
  ]),
  mc(49, "The balance of payments is:", [
    "a record of all economic transactions between Australia and the rest of the world over a period.",
    "the Australian Government's annual Budget statement.",
    "a measure of the total money supply in the economy.",
    "the difference between GDP and national income.",
  ]),
  mc(50, "According to the principle of comparative advantage, a country should specialise in producing goods:", [
    "in which it has a lower opportunity cost than its trading partners.",
    "that it can produce in the largest total quantity.",
    "that sell for the highest price on world markets.",
    "that it currently imports the most of.",
  ]),
];

// ========================================================================
// Multiple choice — m51..m100 (second bank)
// ========================================================================

const mcQuestions2: McQuestion[] = [
  // --- Introduction to economics ---
  mc(51, "Which of the following best illustrates the concept of scarcity?", [
    "A city has enough land for either a new hospital or a new school, but not both.",
    "A shop has too much stock left over at the end of the season.",
    "The government prints more money than the economy needs.",
    "Prices are set by the government rather than the market.",
  ]),
  mc(52, "A society's production possibility frontier (PPF) shifts outward when:", [
    "the economy's productive capacity increases, for example through new technology or more resources.",
    "unemployment in the economy rises.",
    "some of the economy's resources are destroyed.",
    "consumer demand for goods falls.",
  ]),
  mc(53, "Which of the following is an example of a positive economic statement, rather than a normative one?", [
    "Raising the minimum wage by 10% increased unemployment among teenagers by 2%.",
    "The government should raise the minimum wage.",
    "It is unfair that the minimum wage is too low.",
    "A higher minimum wage would be good for society.",
  ]),
  mc(54, "In the circular flow of income model, households provide firms with:", [
    "the factors of production, in exchange for factor incomes.",
    "finished goods and services, in exchange for taxation revenue.",
    "government spending, in exchange for votes.",
    "loanable funds, in exchange for import revenue.",
  ]),
  mc(55, "Which combination of leakages and injections would move an economy from equilibrium towards a contraction in economic activity?", [
    "Leakages rise while injections stay the same.",
    "Injections rise while leakages fall.",
    "Leakages and injections stay exactly equal.",
    "Leakages and injections both rise by the same amount.",
  ]),
  mc(56, "The peak of the business cycle is best described as:", [
    "the point at which economic activity is at its highest before turning down.",
    "the point at which economic activity is at its lowest before turning up.",
    "a period of steady, unchanging long-run growth.",
    "the point at which growth is exactly zero forever.",
  ]),
  mc(57, "Behavioural economics differs from traditional economic theory mainly by:", [
    "recognising that people do not always make perfectly rational decisions.",
    "assuming consumers always have perfect information.",
    "ignoring psychology entirely when explaining choices.",
    "assuming firms never try to maximise profit.",
  ]),
  mc(58, "Which of the following is a resource allocation question every economic system must answer?", [
    "What to produce, how to produce it, and for whom to produce it.",
    "How much tax revenue to collect each year.",
    "How many banks should operate in the economy.",
    "Who should hold political office.",
  ]),
  // --- Markets ---
  mc(59, "A leftward shift of a supply curve, with demand unchanged, will cause the equilibrium price and quantity to:", [
    "rise and fall, respectively.",
    "fall and rise, respectively.",
    "both rise.",
    "both fall.",
  ]),
  mc(60, "Which of the following is most likely to have highly elastic supply?", [
    "A manufactured good produced by a firm with spare production capacity.",
    "Fresh perishable produce that must be sold on the day it is picked.",
    "A good that requires years to build new production capacity.",
    "A fixed piece of land in a popular location.",
  ]),
  mc(61, "A firm operating in a monopolistically competitive market differs from a firm in perfect competition mainly because it:", [
    "sells a differentiated product and has some control over its price.",
    "has no competitors at all.",
    "sells an identical product with no pricing power.",
    "is always the largest firm in the industry.",
  ]),
  mc(62, "An oligopoly is a market structure characterised by:", [
    "a small number of large firms, often interdependent in their pricing and output decisions.",
    "many small firms with no pricing power.",
    "one firm with total control of the market.",
    "thousands of identical sellers of a homogeneous good.",
  ]),
  mc(63, "A positive externality of consumption, such as the benefit others receive from a person being vaccinated, means that:", [
    "the free market tends to under-consume the good relative to the socially optimal level.",
    "the free market tends to over-consume the good relative to the socially optimal level.",
    "the good has no effect on anyone besides the person who consumes it.",
    "the market outcome is already socially optimal.",
  ]),
  mc(64, "A merit good is one that:", [
    "society believes should be encouraged, because it is under-consumed relative to its social benefit.",
    "is always non-excludable and non-rival in consumption.",
    "the government is legally required to provide free of charge.",
    "generates no externalities of any kind.",
  ]),
  mc(65, "Government failure occurs when:", [
    "government intervention leads to an outcome that is less efficient than the free market would have produced.",
    "the private sector is unable to supply a good at all.",
    "a market reaches its equilibrium price and quantity.",
    "a tax raises more revenue than expected.",
  ]),
  mc(66, "Which of the following would most likely improve the allocative efficiency of a market with a negative production externality?", [
    "A tax on producers equal to the external cost imposed on third parties.",
    "A subsidy that further increases the quantity produced.",
    "A price ceiling set below the equilibrium price.",
    "Removing all government regulation of the industry.",
  ]),
  mc(67, "In a competitive market, allocative efficiency is achieved when:", [
    "price equals the marginal cost of production, so resources are directed to their most valued use.",
    "firms earn the maximum possible profit regardless of price.",
    "output is produced at the lowest possible cost, regardless of price.",
    "the government sets the price for every good.",
  ]),
  // --- Household and business sector ---
  mc(68, "According to the law of diminishing marginal utility, a rational consumer will keep buying additional units of a good only if:", [
    "the marginal utility from another unit still exceeds, or equals, its price.",
    "total utility is falling.",
    "the price of the good keeps rising indefinitely.",
    "every unit gives exactly the same satisfaction as the last.",
  ]),
  mc(69, "A rise in household saving, with income unchanged, implies:", [
    "a fall in consumption, since income is either spent or saved.",
    "a rise in consumption.",
    "no change in consumption at all.",
    "a rise in household income.",
  ]),
  mc(70, "Which of the following would most likely increase a household's marginal propensity to consume?", [
    "Greater confidence about future job security and income.",
    "Higher interest rates on savings accounts.",
    "Expectations of an upcoming recession.",
    "An increase in the rate of income tax.",
  ]),
  mc(71, "A business's short-run average total cost curve is typically U-shaped because:", [
    "average cost first falls due to specialisation of a fixed factor, then rises due to diminishing returns.",
    "average cost always rises as output increases.",
    "average cost always falls as output increases.",
    "average cost stays constant regardless of the level of output.",
  ]),
  mc(72, "Which best describes the concept of 'internal economies of scale'?", [
    "cost savings a firm achieves as it grows larger, such as buying inputs in bulk.",
    "cost savings shared by an entire industry as it grows.",
    "savings that come only from government subsidies.",
    "cost savings shared between competing firms.",
  ]),
  mc(73, "The main source of business finance that does NOT need to be repaid is:", [
    "equity (funds raised by selling shares).",
    "a bank loan.",
    "a corporate bond.",
    "trade credit from suppliers.",
  ]),
  mc(74, "A firm's normal profit is the level of profit that:", [
    "is just enough to keep the owner's resources employed in this business rather than their next best alternative.",
    "is the maximum profit a firm is legally allowed to earn.",
    "is always equal to zero.",
    "includes only explicit accounting costs.",
  ]),
  mc(75, "An increase in labour productivity means that:", [
    "more output is produced for each hour of labour worked.",
    "wages have increased across the economy.",
    "the size of the labour force has grown.",
    "more workers have been hired by a firm.",
  ]),
  mc(76, "Which of the following would decrease the demand for labour in an industry?", [
    "A fall in consumer demand for the industry's output.",
    "A rise in the prices the industry's output sells for.",
    "An increase in worker productivity.",
    "A government subsidy paid to the industry.",
  ]),
  // --- Financial sector ---
  mc(77, "A share (equity) represents:", [
    "part ownership of a company, entitling the holder to a share of profits and voting rights.",
    "a loan to the company that must be repaid with interest.",
    "a government-guaranteed bank deposit.",
    "a fixed-interest debt security issued by the company.",
  ]),
  mc(78, "Which of the following is a function of financial institutions such as banks?", [
    "accepting deposits from savers and lending those funds to borrowers.",
    "setting the government's fiscal policy.",
    "collecting personal income tax.",
    "printing the nation's physical currency.",
  ]),
  mc(79, "The 'risk–return trade-off' in finance refers to the idea that:", [
    "investments offering higher potential returns typically carry higher risk.",
    "all investments carry exactly the same level of risk.",
    "risk and expected return are unrelated to each other.",
    "safer investments always earn higher returns than riskier ones.",
  ]),
  mc(80, "A fall in the general level of interest rates would most likely:", [
    "encourage borrowing and investment, since credit becomes cheaper.",
    "discourage borrowing and investment.",
    "have no effect on the level of investment.",
    "increase the reward for saving money.",
  ]),
  mc(81, "Which of the following best describes the role of the Australian Securities Exchange (ASX)?", [
    "It provides a market where shares and other securities are bought and sold.",
    "It sets the official cash rate for the economy.",
    "It regulates the national minimum wage.",
    "It collects company tax on behalf of the government.",
  ]),
  mc(82, "Financial intermediaries reduce the risk to individual savers mainly by:", [
    "pooling funds from many savers and lending to a diversified range of borrowers.",
    "guaranteeing zero risk on every loan they make.",
    "borrowing directly from the government instead of from savers.",
    "refusing to lend money to businesses.",
  ]),
  mc(83, "A term deposit is best described as:", [
    "a fixed sum of money deposited with a financial institution for an agreed period at an agreed interest rate.",
    "a type of company share traded on the stock exchange.",
    "a government bond issued to fund the Budget.",
    "an insurance policy against financial loss.",
  ]),
  mc(84, "One risk to an individual of holding shares rather than a bank deposit is that:", [
    "the share price can fall, and the dividend paid is not guaranteed.",
    "shares always pay a fixed rate of interest.",
    "share prices never change over time.",
    "bank deposits pay no interest at all.",
  ]),
  // --- Government sector ---
  mc(85, "Fiscal policy refers to the use of:", [
    "government spending and taxation to influence the level of economic activity.",
    "interest rates and the money supply to influence the economy.",
    "the exchange rate to influence export competitiveness.",
    "foreign aid as the government's only economic tool.",
  ]),
  mc(86, "An expansionary Budget, designed to stimulate a slowing economy, would typically involve:", [
    "increasing government spending and/or cutting taxes, moving the Budget towards deficit.",
    "cutting government spending and raising taxes.",
    "keeping spending and taxes completely unchanged.",
    "only changing interest rates.",
  ]),
  mc(87, "A regressive tax is one in which:", [
    "the average rate of tax falls as a person's income rises.",
    "the average rate of tax rises as a person's income rises.",
    "every taxpayer pays exactly the same rate regardless of income.",
    "only businesses, not individuals, are required to pay.",
  ]),
  mc(88, "Which of the following is an example of government reallocation of resources?", [
    "The government funding public hospitals and schools rather than leaving their provision entirely to the market.",
    "The government paying unemployment benefits to jobseekers.",
    "The Reserve Bank lowering interest rates.",
    "The government allowing the exchange rate to float freely.",
  ]),
  mc(89, "Government stabilisation policy aims to:", [
    "smooth out fluctuations in the business cycle, such as high inflation or high unemployment.",
    "eliminate the business cycle permanently.",
    "maximise government tax revenue every year.",
    "guarantee a Budget surplus in every year.",
  ]),
  mc(90, "A Budget surplus occurs when, over a period:", [
    "government revenue exceeds government expenditure.",
    "government expenditure exceeds government revenue.",
    "revenue and expenditure are exactly equal.",
    "the government has no outstanding debt.",
  ]),
  mc(91, "Which of the following is most likely to be used by government to correct a negative externality?", [
    "A tax imposed on producers to reflect the external cost they generate.",
    "A subsidy that further increases the quantity produced.",
    "A price ceiling set on the good.",
    "Removing all regulation of the industry.",
  ]),
  mc(92, "Vertical equity in taxation means that:", [
    "people with a greater capacity to pay (e.g. higher income) should pay proportionally more tax.",
    "everyone should pay exactly the same dollar amount of tax.",
    "people in similar financial circumstances should pay the same tax.",
    "tax rates should never be changed once set.",
  ]),
  // --- International sector ---
  mc(93, "A country has a current account deficit when, over a period:", [
    "its payments to the rest of the world (for goods, services, income and transfers) exceed its receipts from the rest of the world.",
    "its receipts from the rest of the world exceed its payments.",
    "its payments and receipts are exactly equal.",
    "its exchange rate is fixed by the central bank.",
  ]),
  mc(94, "A depreciation of the Australian dollar would most likely:", [
    "make Australian exports cheaper for foreign buyers and imports more expensive for Australians.",
    "make Australian exports more expensive for foreign buyers and imports cheaper for Australians.",
    "have no effect on the price of exports or imports.",
    "only affect the level of government debt.",
  ]),
  mc(95, "Which of the following is most likely to increase demand for the Australian dollar on the foreign exchange market?", [
    "An increase in foreign demand for Australian exports.",
    "An increase in Australian demand for imports.",
    "Australians investing more money overseas.",
    "A fall in Australian interest rates relative to other countries.",
  ]),
  mc(96, "Protectionism refers to government policies that:", [
    "restrict international trade to protect domestic industries, such as tariffs and import quotas.",
    "encourage completely free trade between all countries.",
    "remove all barriers to international trade.",
    "apply only to a country's exports, never its imports.",
  ]),
  mc(97, "A tariff is:", [
    "a tax imposed on imported goods, raising their price to domestic consumers.",
    "a subsidy paid to exporters.",
    "a limit on the physical quantity of a good that can be imported.",
    "a tax imposed on goods a country exports.",
  ]),
  mc(98, "An import quota differs from a tariff because a quota:", [
    "directly limits the physical quantity of a good that can be imported, rather than taxing it.",
    "always raises more government revenue than a tariff.",
    "applies only to a country's exports.",
    "has no effect on the domestic price of the good.",
  ]),
  mc(99, "Which of the following would improve Australia's terms of trade?", [
    "Export prices rising relative to import prices.",
    "Import prices rising relative to export prices.",
    "Export and import prices rising by the same percentage.",
    "The exchange rate becoming fixed.",
  ]),
  mc(100, "Globalisation refers to:", [
    "the increasing economic integration and interdependence of the world's economies through trade, investment and finance.",
    "a single country's economy growing rapidly in isolation.",
    "the abolition of national governments.",
    "a country closing its borders to international trade.",
  ]),
];

// ========================================================================
// Short answer — s01..s50
// ========================================================================

const saQuestions: ShortQuestion[] = [
  // --- Introduction to economics ---
  sa(1, 2, "Define opportunity cost and illustrate it with an example."),
  sa(2, 3, "Explain how a production possibilities frontier (PPF) illustrates opportunity cost and the concept of efficiency."),
  sa(3, 2, "Distinguish between a free market economy and a planned (command) economy."),
  sa(4, 3, "Outline the circular flow of income model, identifying the leakages and the injections."),
  sa(5, 3, "Using the equilibrium condition S + T + M = I + G + X, explain what happens to the level of economic activity when total leakages exceed total injections."),
  sa(6, 2, "Explain two reasons why economies aim to achieve economic growth (a higher level of GDP)."),
  sa(7, 2, "Explain what is meant by a cognitive bias in behavioural economics, using one example."),
  sa(8, 3, "Explain how the price mechanism answers the key economic questions — what, how, and for whom to produce — in a market economy."),
  sa(9, 2, "Explain the relationship between the four factors of production and their corresponding factor incomes."),
  // --- Markets ---
  sa(10, 3, "Explain how a rise in the cost of production for a good affects its supply curve and the market equilibrium price and quantity."),
  sa(11, 3, "Explain how the price elasticity of demand is calculated using the percentage method, and interpret a calculated value of 0.4."),
  sa(12, 2, "Explain two factors that make the demand for a particular good relatively price-inelastic."),
  sa(13, 3, "Distinguish between perfect competition and monopoly, referring to the number of firms, barriers to entry and pricing power."),
  sa(14, 3, "Explain how a negative externality from production causes market failure."),
  sa(15, 2, "Define a public good and explain the free-rider problem associated with it."),
  sa(16, 3, "Explain how a government subsidy paid to producers affects the market price, the quantity traded and the allocation of resources."),
  sa(17, 2, "Explain one limitation of government intervention in markets (an example of government failure)."),
  sa(18, 3, "Explain why the price elasticity of demand for its product is important for a business's pricing decisions."),
  // --- Household and business sector ---
  sa(19, 2, "Explain the law of diminishing marginal utility, using an example."),
  sa(20, 2, "Define the marginal propensity to consume (MPC), and calculate it if a $200 rise in income leads to $150 of additional consumption."),
  sa(21, 3, "Explain the relationship between consumption, saving and income for a household."),
  sa(22, 2, "Distinguish between a normal good and an inferior good."),
  sa(23, 3, "Explain three factors that affect the supply of labour by households."),
  sa(24, 2, "Distinguish between economic profit and accounting profit."),
  sa(25, 3, "Explain the relationship between productivity and living standards."),
  sa(26, 3, "Explain the difference between economies of scale and diseconomies of scale, with reference to a long-run average cost curve."),
  sa(27, 2, "Explain the role of the minimum wage in the labour market."),
  sa(28, 3, "Explain how automation and artificial intelligence (AI) may affect the demand for labour by businesses."),
  // --- Financial sector ---
  sa(29, 2, "Define interest rates and outline two roles that interest rates play in the economy."),
  sa(30, 3, "Explain how the interaction of the demand for and the supply of loanable funds determines the interest rate."),
  sa(31, 2, "Distinguish between the primary and the secondary share market."),
  sa(32, 2, "Distinguish between debt and equity as ways for a business to raise funds."),
  sa(33, 3, "Explain the role of financial intermediaries in the economy."),
  sa(34, 2, "Explain the role of the Reserve Bank of Australia (RBA) in the financial sector."),
  sa(35, 3, "Explain how a fall in interest rates is likely to affect household consumption and business investment."),
  sa(36, 2, "Explain the role of superannuation as a source of savings and investment in the Australian economy."),
  // --- Government sector ---
  sa(37, 3, "Explain three economic roles that government performs in a market economy."),
  sa(38, 2, "Distinguish between a direct tax and an indirect tax, referring to the incidence of the tax."),
  sa(39, 2, "Explain what is meant by a progressive tax, and give an Australian example."),
  sa(40, 3, "Explain the features of a 'good' tax — simplicity, equity and efficiency."),
  sa(41, 2, "Distinguish between recurrent and capital (non-recurrent) government spending."),
  sa(42, 2, "Define a transfer payment and give an example."),
  sa(43, 3, "Explain how the government can use the tax and transfer system to redistribute income."),
  sa(44, 3, "Explain the rationale for government intervention to correct market failure."),
  // --- International sector ---
  sa(45, 3, "Explain the economic benefits of international trade for a country."),
  sa(46, 2, "Distinguish between a trade surplus and a trade deficit."),
  sa(47, 3, "Explain how an appreciation of the Australian dollar affects Australian exporters and importers."),
  sa(48, 2, "Distinguish between foreign debt and foreign equity."),
  sa(49, 3, "Explain the purpose of the balance of payments."),
  sa(50, 2, "Explain why Australia relies on foreign investment to fund some of its economic activity."),
];

// ========================================================================
// Short answer — s51..s100 (second bank)
// ========================================================================

const saQuestions2: ShortQuestion[] = [
  // --- Introduction to economics ---
  sa(51, 2, "Explain the difference between a 'need' and a 'want' in economics."),
  sa(52, 3, "Using a production possibilities frontier, explain what is meant by economic growth and how it would be shown on the diagram."),
  sa(53, 2, "Distinguish between a positive economic statement and a normative economic statement, giving one example of each."),
  sa(54, 3, "Explain how the circular flow of income model shows the interdependence between the household and business sectors."),
  sa(55, 2, "Outline two examples of leakages from the circular flow of income and explain their effect on the level of economic activity."),
  sa(56, 3, "Describe the four phases of the business cycle."),
  sa(57, 2, "Explain what is meant by 'bounded rationality' in behavioural economics."),
  sa(58, 3, "Explain why every economic system, regardless of how it allocates resources, must answer the same three basic economic questions."),
  // --- Markets ---
  sa(59, 3, "Explain how an increase in supply, with demand unchanged, affects the equilibrium price and quantity in a market."),
  sa(60, 2, "Explain why the price elasticity of supply tends to be higher in the long run than in the short run."),
  sa(61, 3, "Distinguish between an oligopoly and a monopolistically competitive market, referring to the number of firms and the degree of product differentiation."),
  sa(62, 3, "Explain how a positive externality of consumption can lead to under-consumption of a good in a free market."),
  sa(63, 2, "Define market failure and give one example of it."),
  sa(64, 3, "Explain how a government subsidy can be used to correct the under-consumption of a merit good."),
  sa(65, 2, "Explain one example of government failure arising from intervention in a market."),
  sa(66, 3, "Explain the condition for allocative efficiency in a competitive market and why it represents an efficient outcome for society."),
  // --- Household and business sector ---
  sa(67, 2, "Explain the difference between total utility and marginal utility."),
  sa(68, 3, "Explain how expectations about future income can affect a household's current level of consumption and saving."),
  sa(69, 2, "Distinguish between a normal good and a luxury good in terms of how their demand responds to income."),
  sa(70, 3, "Explain why a firm's long-run average cost curve may eventually turn upward after a period of falling costs (diseconomies of scale)."),
  sa(71, 2, "Distinguish between debt finance and equity finance as sources of funds for a business."),
  sa(72, 3, "Explain the relationship between labour productivity and a business's competitiveness."),
  sa(73, 2, "Explain why the demand for labour is a 'derived demand'."),
  sa(74, 3, "Explain two factors, other than the wage rate, that would affect the supply of labour to a particular occupation."),
  sa(75, 3, "Explain how automation might affect both the demand for labour and the productivity of the workers who remain employed."),
  // --- Financial sector ---
  sa(76, 2, "Distinguish between the primary and secondary functions of financial markets, using shares as an example."),
  sa(77, 3, "Explain the risk-return trade-off faced by an investor choosing between a bank term deposit and company shares."),
  sa(78, 2, "Outline two functions performed by financial intermediaries such as banks."),
  sa(79, 3, "Explain how a rise in the interest rate is likely to affect the level of business investment."),
  sa(80, 2, "Distinguish between a bond and a share as ways for an investor to provide funds to a company."),
  sa(81, 3, "Explain the role of the Australian Securities Exchange (ASX) in the Australian financial system."),
  sa(82, 2, "Explain how superannuation provides a source of long-term investment funds for the Australian economy."),
  sa(83, 3, "Explain how the interaction between the demand for and supply of loanable funds determines the market interest rate, and describe the effect of an increase in the demand for funds."),
  // --- Government sector ---
  sa(84, 2, "Distinguish between fiscal policy and monetary policy."),
  sa(85, 3, "Explain the difference between an expansionary and a contractionary Budget, and the circumstances in which a government might use each."),
  sa(86, 2, "Distinguish between a progressive and a regressive tax, giving an example of each."),
  sa(87, 3, "Explain how the government can use taxation and transfer payments together to redistribute income."),
  sa(88, 2, "Explain what is meant by horizontal equity and vertical equity in taxation."),
  sa(89, 3, "Explain the difference between a Budget surplus, a Budget deficit and a balanced Budget."),
  sa(90, 2, "Explain one example of the government's reallocation role in the economy."),
  sa(91, 3, "Explain how a government might use a tax to correct a negative externality, and what determines the size of the tax needed."),
  // --- International sector ---
  sa(92, 2, "Explain the difference between the current account and the capital and financial account of the balance of payments."),
  sa(93, 3, "Explain how an appreciation of the Australian dollar would affect the price of Australian exports and the price of imports."),
  sa(94, 2, "Distinguish between a tariff and an import quota as forms of protection."),
  sa(95, 3, "Explain the concept of comparative advantage and why it provides the basis for international trade."),
  sa(96, 2, "Define the terms of trade and explain what an improvement in the terms of trade means for a country."),
  sa(97, 3, "Explain two arguments a government might use to justify protecting a domestic industry from foreign competition."),
  sa(98, 2, "Distinguish between foreign debt and foreign equity as forms of foreign investment in Australia."),
  sa(99, 3, "Explain how globalisation has affected the Australian economy, giving one example."),
  sa(100, 2, "Explain why a country's exchange rate is important for its international competitiveness."),
];

export const questions: Question[] = [
  ...mcQuestions,
  ...mcQuestions2,
  ...saQuestions,
  ...saQuestions2,
];

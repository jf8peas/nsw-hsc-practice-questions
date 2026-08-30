import type { McQuestion, Question, ShortQuestion } from "@/lib/types";
import { shuffleBySeed } from "@/lib/shuffle";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Original questions written to the current (2025) NESA Economics 11–12
// syllabus, Year 11 — see docs/y11-economics-preliminary-research.md.
//
// 50 multiple choice (group "mc", 1 mark) + 50 short answer (group "sa",
// 2–4 marks). A quiz draws 5 + 5 — 10 non-repeating attempts.

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

export const questions: Question[] = [...mcQuestions, ...saQuestions];

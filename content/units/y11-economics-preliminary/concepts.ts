import { defineConcepts } from "../../concept-helpers";

// PUBLIC — the concepts a student can be asked to relearn in this unit (spec 002).
// Ids are `<unit-id>.c-<slug>`, never renamed or reused. Question tags are in ./concept-tags.ts.

export const concepts = defineConcepts("y11-economics-preliminary", [
  // --- Introduction to economics ---
  ["scarcity-opportunity-cost", "Scarcity forces choices, and opportunity cost is the next best alternative given up"],
  ["factors-of-production", "The four factors of production (land, labour, capital, enterprise) and the income each earns"],
  ["economic-systems", "How market and planned economies answer what, how and for whom to produce"],
  ["ppf", "A production possibilities frontier shows opportunity cost, efficiency and economic growth"],
  ["positive-normative", "Positive statements can be tested against facts; normative statements are value judgements"],
  ["behavioural-economics", "Behavioural economics: cognitive biases and bounded rationality"],
  ["circular-flow", "The circular flow of income, its leakages and injections, and its equilibrium"],
  ["business-cycle-growth", "The phases of the business cycle, and why economies aim for economic growth"],
  // --- Markets and the price mechanism ---
  ["demand-supply-equilibrium", "Shifts in demand and supply change the equilibrium price and quantity"],
  ["normal-inferior-goods", "Normal, inferior and luxury goods respond differently to a change in income"],
  ["elasticity-demand", "Price elasticity of demand: how it is calculated and what makes demand elastic or inelastic"],
  ["elasticity-supply", "Price elasticity of supply is higher when producers have more time to respond"],
  ["market-structures", "Perfect competition, monopoly, oligopoly and monopolistic competition differ in firms and barriers"],
  ["externalities", "Externalities are costs or benefits to third parties, and can be corrected by taxes or subsidies"],
  ["public-merit-goods", "Public goods suffer from free riders; merit goods are under-consumed by the market"],
  ["market-failure-intervention", "Market failure justifies government intervention, which can itself fail"],
  ["allocative-efficiency", "Allocative efficiency is reached where price equals marginal cost"],
  // --- Consumers, businesses and labour ---
  ["utility", "Diminishing marginal utility: each extra unit consumed adds less satisfaction"],
  ["consumption-saving", "Households split income between consumption and saving (MPC + MPS = 1)"],
  ["profit", "Economic profit subtracts opportunity costs; normal profit is the minimum to stay in business"],
  ["costs-economies-scale", "Economies and diseconomies of scale shape a firm's average costs"],
  ["labour-demand-supply", "Labour demand is derived; labour supply, wages and automation affect the labour market"],
  ["productivity", "Higher productivity raises living standards and business competitiveness"],
  // --- Financial markets ---
  ["financial-intermediaries", "Financial intermediaries channel savings to borrowers and reduce risk for savers"],
  ["risk-return", "Higher expected returns come with higher risk"],
  ["share-market-asx", "Primary and secondary share markets, and the role of the ASX"],
  ["debt-equity-finance", "Debt must be repaid with interest; equity (shares) gives part-ownership and need not be repaid"],
  ["rba-role", "The Reserve Bank of Australia is the central bank and runs monetary policy"],
  ["interest-rates", "Interest rates are set by loanable funds and affect spending, saving and investment"],
  ["superannuation", "Superannuation is a major source of long-term savings and investment"],
  // --- Government and the economy ---
  ["govt-economic-roles", "The government's roles: reallocation, redistribution and stabilisation"],
  ["taxation-types", "Direct, indirect, progressive, proportional and regressive taxes"],
  ["good-tax-equity", "The features of a good tax, and horizontal and vertical equity"],
  ["transfer-redistribution", "Transfer payments and the tax–transfer system redistribute income"],
  ["fiscal-policy", "Fiscal policy uses the Budget; expansionary and contractionary stances suit different conditions"],
  ["budget-balance", "Budget deficit, surplus and balance, and recurrent versus capital spending"],
  // --- International economy ---
  ["trade-benefits", "Comparative advantage is the basis for gains from international trade"],
  ["trade-balance-bop", "The balance of payments, the current account and trade surpluses and deficits"],
  ["exchange-rate", "Exchange rate changes affect export and import prices and competitiveness"],
  ["foreign-investment", "Foreign debt and foreign equity fund investment that domestic saving cannot"],
  ["protection", "Protectionism: tariffs, import quotas and the arguments for them"],
  ["terms-of-trade", "The terms of trade compare export prices with import prices"],
  ["globalisation", "Globalisation links economies through trade, investment, finance and technology"],
]);

/** Questions removed from this unit, with the concept each carried. None so far. */
export const retired: Record<string, string | null> = {};

import type { ExplanationTable } from "../../explanation-helpers";

// ANSWER KEY — why each wrong multiple-choice option is wrong (spec 002). Shown to a
// student only after they answer that question. Each entry is [the start of the wrong
// option's text, the explanation]; the helper resolves it to the full option text and
// fails if it does not match exactly one wrong option. The unit's ids are three digits,
// so answers.ts calls withWrongExplanations(..., 3).

export const explanations: ExplanationTable = {
  1: [
    ["Country A has a higher real GDP but lower economic development level than Country B", "wrong, because Country A's HDI (0.97) is the higher one."],
    ["Country A has a higher level of economic development but lower real GDP than Country B", "wrong, because Country A has the higher real GDP too."],
    ["Country A has a lower real GDP and lower level of economic development than country B", "wrong on both counts."],
  ],
  2: [
    ["Reduced labour mobility and less access to funds in the global economy", "wrong, because TNCs increase labour mobility and provide access to global funds."],
    ["Greater trade protection and less sharing of technology", "wrong, because TNCs generally promote freer trade and transfer technology across borders."],
    ["Increased global financial volatility and higher costs of production", "wrong, because TNCs are associated with large, stabilising financial flows and lower-cost production."],
  ],
  3: [
    ["An Australian investor buys a small parcel of shares on the Japanese stock market", "wrong, this is portfolio investment, not FDI, because it confers no control."],
    ["A domestic trader purchasing foreign currency on the foreign exchange market", "wrong, this is a foreign-exchange transaction, not investment."],
    ["A state government borrowing funds from overseas to build road infrastructure", "wrong, this is an overseas loan (foreign debt), not direct investment."],
  ],
  4: [
    ["The World Bank", "wrong, it lends to and advises developing countries to reduce poverty and fund development; it does not coordinate policy across trade, health and climate."],
    ["The World Trade Organisation", "wrong, its role is limited to trade rules, negotiations and disputes."],
    ["The International Monetary Fund", "wrong, it oversees the international monetary system and lends to countries in balance-of-payments difficulty."],
  ],
  5: [
    ["Government spending increases by $1600 and these farmers are less competitive on the global market", "wrong amount of spending, and the subsidy makes domestic farmers lower-cost (more competitive), not less."],
    ["Government spending increases by $2000 and the price of milk falls by $20 a litre", "wrong, the price falls by $10, not $20."],
    ["Government spending increases by $1600 and the price of milk falls by $10 a litre", "wrong amount of spending ($20 × 100 = $2000, not $1600)."],
  ],
  6: [
    ["When foreign firms sell more goods in another country than local producers sell in that country.", "wrong, this describes market share, not price discrimination."],
    ["When foreign firms sell their products in another country, at a cheaper price than local producers in that country.", "wrong, the comparison must be with the exporter's own home-market price, not local producers' prices."],
    ["When a foreign country signs a free trade agreement with another country and trade is diverted there.", "wrong, this describes trade diversion, not dumping."],
  ],
  7: [
    ["Domestic producers' revenue will increase by $2600 and the government will receive $400 in taxation", "wrong, revenue rises by $1200 ($1600 − $400) and the government receives $800."],
    ["Domestic producers' revenue will increase by $1600 and the government will receive $1600 in taxation", "wrong, the increase in revenue is $1200 not $1600, and tariff receipts are $800."],
    ["Domestic producers' revenue will increase by $1600 and the government will receive $800 in taxation", "wrong, $1600 is the new total revenue, not the increase."],
  ],
  8: [
    ["The Comprehensive & Progressive Agreement for Trans-Pacific Partnership (CPTPP)", "wrong, Australia is a party to the CPTPP."],
    ["APEC", "wrong, Australia is a member of APEC."],
    ["ANZCERTA", "wrong, Australia is a party to ANZCERTA with New Zealand."],
  ],
  9: [
    ["An increase in subsidies and a decrease in tariffs", "wrong, while tariffs fall, extra subsidies distort trade and may still restrict import competition."],
    ["A decrease in a quota and an increase in local content rules", "wrong, a smaller quota and stricter local content rules both restrict trade."],
    ["An increase in tariffs and a decrease in subsidies", "wrong, higher tariffs directly reduce trade."],
  ],
  10: [
    ["Australian exporter revenue increases and export volumes rise", "wrong, subsidised Chinese competition weakens, not strengthens, Australian export demand."],
    ["Australian exporter revenue increases and export volumes fall", "wrong, volumes and revenue move in the same direction here — both fall."],
    ["Australia exporter revenue decreases and export volumes rise", "wrong, volumes fall alongside revenue."],
  ],
  11: [
    ["100 units", "wrong, a quota of 100 would cut imports below the tariff level and raise price above 8."],
    ["300 units", "wrong, a quota of 300 would allow more imports than under the tariff, keeping price below 8."],
    ["400 units", "wrong, 400 units is the level of imports at the world price 6 (no protection), not at the tariff price 8."],
  ],
  12: [
    ["International Monetary Fund", "wrong, the IMF provides short-term loans to countries with balance of payments problems, not project financing for hospitals."],
    ["OECD", "wrong, the OECD is a forum of advanced economies that produces analysis and sets standards; it does not lend for hospital construction."],
    ["World Trade Organisation", "wrong, the WTO administers trade rules and dispute settlement; it does not provide financing."],
  ],
  13: [
    ["$10", "wrong, $10 is not the per-unit subsidy (which is $20) nor the total cost."],
    ["$20", "wrong, $20 is the per-unit subsidy, not the total cost."],
    ["$400", "wrong, $400 would be the total if the subsidy were $10 per unit on 40 units, which matches neither the subsidy nor the quantity."],
  ],
  14: [
    ["EU", "wrong, the European Union is a bloc of European economies; Australia is not a member."],
    ["ChAFTA", "wrong, the China–Australia FTA is bilateral (two countries), not multilateral."],
    ["USMCA", "wrong, the United States–Mexico–Canada Agreement does not include Australia."],
  ],
  15: [
    ["The World Trade Organisation", "wrong, the WTO deals with trade rules and disputes, not balance of payments financing."],
    ["The World Bank", "wrong, the World Bank lends for long-term development projects, not short-term balance of payments support."],
    ["The Organisation for Economic Co-operation and Development", "wrong, the OECD is a policy forum, not a lender."],
  ],
  16: [
    ["Increase in tariffs on imported goods — Increase in quotas on imported goods", "wrong, increasing the quota allows more imports in, weakening protection."],
    ["Decrease in tariffs on imported goods — Decrease in quotas on imported goods", "wrong, lowering tariffs makes imports cheaper and increases import competition."],
    ["Decrease in tariffs on imported goods — Increase in quotas on imported goods", "wrong, both changes reduce protection."],
  ],
  17: [
    ["Low population growth rates, high levels of foreign debt and high levels of capital accumulation", "wrong, low population growth and high capital accumulation tend to help, not restrict, development."],
    ["High levels of domestic savings, low levels of technology and high levels of foreign direct investment", "wrong, high savings and high FDI are development-promoting factors."],
    ["Low levels of domestic savings, low per capita incomes and high levels of exports", "wrong, high export levels support development."],
  ],
  18: [
    ["WTO", "wrong, the WTO administers trade agreements; it does not fund school construction."],
    ["OECD", "wrong, the OECD is a policy forum of advanced economies, not a development lender."],
    ["G20", "wrong, the G20 is a forum for international economic cooperation, not a lending institution."],
  ],
  19: [
    ["Reliance on agricultural production.", "wrong, heavy reliance on agriculture indicates a low level of development, not development in progress."],
    ["Increasing levels of income inequality.", "wrong, growing inequality is not an indicator of development (development is about improvements in wellbeing broadly)."],
    ["Decreased levels of foreign investment.", "wrong, falling foreign investment signals weaker growth prospects, not development."],
  ],
  20: [
    ["Government Revenue $30,000 — Foreign Producer Revenue $40,000 — Subsidy Value $5 per unit", "wrong, this would require imports of 6000 units at the tariff, exceeding pre-tariff imports."],
    ["Government Revenue $20,000 — Foreign Producer Revenue $30,000 — Subsidy Value $10 per unit", "wrong, both revenue figures and the subsidy value are incorrect."],
    ["Government Revenue $10,000 — Foreign Producer Revenue $20,000 — Subsidy Value $10 per unit", "wrong, the subsidy with the same effect as a $5 tariff is $5 per unit, not $10."],
  ],
  21: [
    ["Price after quota 10 — Overseas producer revenue after quota 20 000", "wrong, the quota drives the domestic price above the world price to 12, not 10."],
    ["Price after quota 12 — Overseas producer revenue after quota 20 000", "wrong, 12 × 2000 units is $24,000, not $20,000."],
    ["Price after quota 10 — Overseas producer revenue after quota 24 000", "wrong, at the world price of 10 the revenue would be 10 × 2000 = $20,000, not $24,000."],
  ],
  22: [
    ["They increase trade between non-member and member countries.", "wrong, blocs reduce trade with non-members by discriminating against them."],
    ["They apply the same level of protection to member and non-member countries.", "wrong, members get preferential, usually lower, barriers."],
    ["They allow member states to use the same currency.", "wrong, a shared currency is a feature of a monetary union, not a trade bloc."],
  ],
  23: [
    ["Standards of living will fall as countries will face lower prices of goods and services from countries that are more efficient.", "wrong, lower prices raise, not lower, living standards."],
    ["Infant industries will have access to new technology and capital.", "wrong, this is an advantage of free trade for infant industries."],
    ["Free trade forces innovation which improves efficiency in the production process.", "wrong, this is an advantage of free trade."],
  ],
  24: [
    ["Provide university scholarships for students to study overseas.", "wrong, with adult educational attainment of only 5 years, scholarships to a few students do not target the country's biggest development problem."],
    ["Provide loans to stabilise the country's currency.", "wrong, currency stabilisation is the IMF's role, and nothing in the data shows a currency problem."],
    ["Pay off the deficit in the balance of goods and services.", "wrong, export revenue ($100m) already exceeds import expenditure ($90m), so there is no goods-and-services deficit to pay off."],
  ],
  25: [
    ["There is a new revenue of $10,000 — Demand expands along the demand curve from 50,000 units to 60,000 units as price falls by $1", "wrong, producers' revenue falls by $60,000, not $10,000."],
    ["There is a new revenue of $60,000 — Demand curve shifts to the right from 50,000 units to 60,000 units as price falls by $1", "wrong, the demand curve does not shift; there is a movement along it."],
    ["Revenue decreases by $10,000 — Demand expands from 50,000 units to 60,000 units as price drops from $4 to $3", "wrong, revenue falls by $60,000, not $10,000."],
  ],
  26: [
    ["Lower trade due to increased trade diversion amongst member countries.", "wrong, monetary unions raise trade among members, and trade diversion is a criticism of trade blocs generally."],
    ["Economic policies are largely ineffective against international business cycle shocks.", "wrong, members keep fiscal policy, and monetary policy is effective at the union level."],
    ["Member countries will have to fix their currencies to the monetary union's exchange rate.", "wrong, members share one currency rather than fixing separate currencies."],
  ],
  27: [
    ["Advanced", "wrong, advanced economies have high savings rates and diversified, service-and-industry-based exports."],
    ["Emerging", "wrong, emerging economies have higher savings and industrialising export structures than the description suggests."],
    ["Transitional", "wrong, \"transitional\" refers to economies moving from central planning to markets."],
  ],
  28: [
    ["Increase rates of economic growth and productivity", "wrong, growth and productivity are means to development, not development itself."],
    ["Increase trade and foreign investments", "wrong, this describes the channels of globalisation, not the improvement in development."],
    ["Increase financial contagion and exchange rate volatility", "wrong, contagion and volatility worsen, not improve, development."],
  ],
  29: [
    ["A decrease in gross world product", "wrong, the international division of labour raises, not lowers, gross world product."],
    ["Transnational corporations reducing investment", "wrong, TNCs have expanded cross-border investment as the division of labour deepened."],
    ["A decline in workers' financial remittances", "wrong, migration under the international division of labour has increased remittance flows."],
  ],
  30: [
    ["Tariffs", "wrong, a tariff is a tax on imports, not a requirement to buy domestic inputs."],
    ["Quotas", "wrong, a quota limits the quantity of imports, it does not mandate domestic input use."],
    ["Export incentives", "wrong, export incentives encourage exporting, they do not force domestic input use."],
  ],
  31: [
    ["G20", "wrong, it is a forum of major economies that coordinates policy; it has no common currency."],
    ["ASEAN", "wrong, it is a regional association and free trade area of South-East Asian nations, each with its own currency."],
    ["APEC", "wrong, it is a forum promoting free trade and cooperation in the Asia-Pacific, with no common currency."],
  ],
  32: [
    ["Emerging economy", "wrong, emerging economies are industrialising and more integrated with the global economy."],
    ["Advanced economy", "wrong, advanced economies are industrialised, have low population growth and are highly integrated."],
    ["Transition economy", "wrong, a transition economy is one moving from central planning toward markets."],
  ],
  33: [
    ["Monetary union", "wrong, a monetary union involves a shared currency, not just a common trade policy."],
    ["Bilateral agreement", "wrong, a bilateral agreement involves exactly two countries."],
    ["Government economic forum", "wrong, a forum is a discussion body, not a binding common trade policy."],
  ],
  34: [
    ["Life expectancy at birth", "wrong, life expectancy at birth is a health dimension of the HDI."],
    ["Gross National Income (GNI) per capita", "wrong, GNI per capita is the income dimension of the HDI."],
    ["Mean years of schooling completed", "wrong, mean years of schooling is the education dimension of the HDI."],
  ],
  35: [
    ["Absolute advantage", "wrong, absolute advantage explains who can make more of a good, but trade is based on opportunity costs (comparative advantage)."],
    ["Purchasing power parity", "wrong, this is an exchange-rate theory, not a basis for trade."],
    ["Law of diminishing marginal utility", "wrong, this explains consumer behaviour, not why countries trade."],
  ],
  36: [
    ["The World Trade Organisation", "wrong, the WTO administers trade rules and dispute settlement, not crisis financing."],
    ["The European Union", "wrong, the EU is a regional bloc; it does not generally lend to countries in balance of payments crisis."],
    ["The World Bank", "wrong, the World Bank lends for long-term development projects, not short-term balance of payments support."],
  ],
  37: [
    ["The International Monetary Fund", "wrong, the IMF's focus is international monetary stability and balance of payments support, not development lending."],
    ["The World Trade Organisation", "wrong, the WTO's role is trade rules and dispute settlement."],
    ["The United Nations", "wrong, while the UN promotes development, the World Bank is the institution specifically focused on financing developing economies' development."],
  ],
  38: [
    ["An increase in real GDP growth over time", "wrong, this describes economic growth, which is narrower than development."],
    ["A measure of labour and capital productivity over time", "wrong, productivity is an input to growth, not a measure of development."],
    ["An outward shift in an economy's production possibility frontier", "wrong, this describes productive capacity growth, not development."],
  ],
  39: [
    ["A subsidy helps to reduce production costs while a tariff does not", "wrong, a tariff does not reduce production costs; it raises the domestic price, so this is not the defining difference."],
    ["A subsidy is less efficient than a tariff", "wrong, in terms of effect on consumers a subsidy is generally more efficient than a tariff."],
    ["A subsidy provides revenue for the government while a tariff does not", "wrong, it is the tariff that raises government revenue; a subsidy costs the government."],
  ],
  40: [
    ["Increases in the volatility of foreign direct investment", "wrong, volatility of investment does not indicate integration; calm, growing flows would."],
    ["Increases in bi-lateral trade agreements between countries", "wrong, bilateral agreements are one channel, but growth of trade relative to output is the direct indicator of globalisation."],
    ["Increases in the growth rates of developing nations", "wrong, higher developing-country growth can occur without deeper global integration."],
  ],
  41: [
    ["An improvement in working conditions for the workforce", "wrong, this describes labour standards, not the international division of labour."],
    ["An increase in the mobility of the labour force in an economy", "wrong, this describes labour mobility within an economy, not international specialisation."],
    ["Emerging countries with a workforce of low skilled and low paid workers", "wrong, this describes a characteristic of some emerging economies, not the division of labour."],
  ],
  42: [
    ["Inequality within advanced economies is increasing", "wrong, the HDI does not measure income inequality."],
    ["Economic growth rates are highest in emerging economies", "wrong, the HDI measures levels of development, not growth rates."],
    ["Absolute poverty levels are reducing in all types of economies", "wrong, the HDI does not directly measure poverty levels."],
  ],
  43: [
    ["Domestic supply falls from Q1Q4 to Q2Q3", "wrong, Q1Q4 and Q2Q3 are import quantities, not domestic supply."],
    ["Domestic supply is Q1 to Q4", "wrong, Q1 to Q4 is the range of quantities on the axis, not the change in domestic supply."],
    ["Domestic supply falls from the tariff price to the free trade price", "wrong, the tariff raises the price, so domestic supply rises, not falls."],
  ],
  44: [
    ["CERTA", "wrong, Australia is a party to the Australia–New Zealand Closer Economic Relations agreement."],
    ["WTO", "wrong, Australia is a member of the World Trade Organisation."],
    ["OECD", "wrong, Australia is a member of the Organisation for Economic Co-operation and Development."],
  ],
  45: [
    ["A fall in global portfolio investment", "wrong, globalisation has seen portfolio investment flows rise, not fall."],
    ["A fall in trade flows between developed economies", "wrong, trade flows between developed economies have grown under globalisation."],
    ["A fall in currency speculation", "wrong, currency speculation has increased with global financial integration."],
  ],
  46: [
    ["An increase in agricultural subsidies in the EU", "wrong, EU agricultural subsidies protect rich-country farmers and disadvantage developing-country exporters, worsening global inequality."],
    ["An increase in bilateral trade agreements between developed nations", "wrong, agreements among developed nations do little for developing countries' incomes."],
    ["An increase in global interest rates", "wrong, higher global interest rates raise debt-servicing costs for developing countries, worsening inequality."],
  ],
  47: [
    ["$80,000", "wrong, this is $2 × 40 000, using the world price instead of the $1 tariff."],
    ["$20,000", "wrong, it uses the 20 000 rise in imports or domestic supply instead of the 40 000 units imported."],
    ["$0", "wrong, a tariff (unlike a quota) collects revenue for the government on every imported unit."],
  ],
  48: [
    ["Transnational corporations", "wrong, TNCs are the firms that undertake investment, not the capital itself."],
    ["Machinery", "wrong, machinery is a physical good traded in goods flows, not a capital flow."],
    ["Disposable income", "wrong, disposable income is household income after tax, not international capital."],
  ],
  49: [
    ["Fertility rate, unemployment rate, adult literacy rate", "wrong, fertility and unemployment are not HDI components."],
    ["Life expectancy at birth, school enrolment rate, doctors per 1,000 people", "wrong, school enrolment and doctors per 1,000 people are not the HDI's education and health measures."],
    ["GNI per capita at purchasing power parity, unemployment rate, adult literacy rate", "wrong, unemployment and adult literacy are not HDI components."],
  ],
  50: [
    ["Local content rules", "wrong, local content rules require firms to use domestic inputs, not to export."],
    ["Subsidy", "wrong, a subsidy is a payment to domestic producers to lower their costs, not assistance to enter export markets."],
    ["Dumping", "wrong, dumping is selling exports below cost or below the home-market price, not government assistance."],
  ],
  51: [
    ["When it can produce a good using smaller quantities of resources than that of another country", "wrong, this describes absolute advantage, not comparative advantage."],
    ["When it is able to specialise in the production of one good over another", "wrong, specialisation follows from comparative advantage but is not its definition."],
    ["When it is able to gain greater trade than that of another country", "wrong, the size of trade is not the definition of comparative advantage."],
  ],
  52: [
    ["Increased productivity of labour and the promotion of structural change", "wrong, a subsidy does not directly raise labour productivity or promote structural change."],
    ["Higher prices domestically and a redistribution of income in the economy", "wrong, a subsidy lowers, not raises, domestic prices."],
    ["Increased supply by domestic producers and a more efficient allocation of resources in the economy", "wrong, while supply increases, a subsidy distorts resource allocation rather than making it more efficient."],
  ],
  53: [
    ["The total sum of economic activity of the OECD", "wrong, GWP covers the whole world, not just the OECD."],
    ["The total sum of economic activity in the advanced economies", "wrong, GWP includes developing and emerging economies too."],
    ["The total sum of economic activity in high and low income economies", "wrong, this omits middle-income economies and is not the standard definition."],
  ],
  54: [
    ["To resolves trade disputes", "wrong, resolving trade disputes is the WTO's role."],
    ["To ensure stability in global financial markets", "wrong, financial stability is the IMF's role."],
    ["To provide resources and information to member countries", "wrong, this is too general and describes the OECD's information role more than the World Bank's lending role."],
  ],
  55: [
    ["High exports as a percentage of GDP, small services sector, advanced manufacturing", "wrong, advanced manufacturing is a feature of advanced economies, not developing ones."],
    ["Low exports as a percentage of GDP, large services sector, low population growth rates", "wrong, these describe an advanced economy."],
    ["Income greater than $13,845 per capita, high population growth rates, low exports as a percentage of GDP", "wrong, income above $13,845 per capita is a World Bank threshold for high-income economies, not developing ones."],
  ],
  56: [
    ["Domestic producers' market share will increase and government revenue will fall", "wrong, while market share rises, a quota does not generate government revenue, so this is not the standard effect of a quota change."],
    ["Domestic producers' market share will decrease and government revenue will decrease", "wrong, a tighter quota increases, not decreases, domestic producers' market share."],
    ["Domestic producers' market share will decrease and the price of domestic products may fall", "wrong, a tighter quota raises the price and increases domestic market share."],
  ],
  57: [
    ["Moderate growth — Heavily reliant on service industry — Income levels are high", "wrong, a large service industry and high incomes describe an advanced economy."],
    ["Fast growth — Heavily reliant on manufacturing industry — Income levels are low", "wrong, heavy reliance on manufacturing describes an industrialising (emerging) economy more than a developing one."],
    ["Fast growth — Heavily reliant on foreign aid — Income levels vary", "wrong, reliance on foreign aid is not a defining structural characteristic of a developing economy."],
  ],
  58: [
    ["$20", "wrong, $20 is the per-unit subsidy, not the total value."],
    ["$50", "wrong, $50 is the new price paid by consumers, not the total subsidy."],
    ["$2000", "wrong, $2000 would be the total if the subsidy were $40 per unit on 50 units, which is not the case."],
  ],
  59: [
    ["Imports Increase — Government revenue Increase", "wrong, removing the tariff eliminates the government's tariff revenue."],
    ["Imports Decrease — Government revenue Decrease", "wrong, removing the tariff increases, not decreases, imports."],
    ["Imports Decrease — Government revenue Increase", "wrong on both counts."],
  ],
  60: [
    ["An increase in real gross domestic product and an increase in gross domestic product per capita", "wrong, both measures describe economic growth, not development."],
    ["An increase in real gross domestic product and an increase in educational attainment", "wrong, real GDP growth is a growth measure, and only one development indicator (education) is present."],
    ["An increase in gross domestic product per capita and an increase in the productive capacity of the economy", "wrong, productive capacity is a growth concept, not a development outcome."],
  ],
  61: [
    ["$1", "wrong, domestic supply rises to 20 000, imports fall to 50 000 and overseas revenue falls by only $20 000."],
    ["$2", "wrong, domestic supply rises to 30 000, imports fall to 40 000 and overseas revenue falls by $40 000."],
    ["$3", "wrong, domestic supply rises to 40 000, imports fall to 30 000 and overseas revenue falls by $60 000."],
  ],
  62: [
    ["The provision of development aid and technical assistance to developing countries", "wrong, development aid and technical assistance are mainly functions of the World Bank, not the IMF."],
    ["The resolution of trade disputes between countries and the promotion of free trade", "wrong, resolving trade disputes is a function of the WTO, not the IMF."],
    ["The promotion of Sustainable Development Goals and the reduction in global poverty", "wrong, the SDGs are a UN framework, and poverty reduction is associated with the World Bank rather than being two IMF functions."],
  ],
  63: [
    ["ChAFTA", "wrong, it is a bilateral free trade agreement between China and Australia, with no common currency."],
    ["ASEAN", "wrong, it is a regional trading bloc whose members keep their own currencies, so it is not a monetary union."],
    ["OECD", "wrong, it is an international organisation that researches and advises on economic policy; it is not a trade bloc."],
  ],
  64: [
    ["Production output: Decreases | Price level: Increases", "wrong, a subsidy encourages production, so output does not fall and price does not rise."],
    ["Production output: Increases | Price level: Increases", "wrong, a subsidy reduces costs and puts downward pressure on price, so the price level falls rather than rises."],
    ["Production output: Decreases | Price level: Decreases", "wrong, output increases, not decreases, when a subsidy is provided."],
  ],
  65: [
    ["Price of product: $50 | Government revenue: Increases | Change in domestic producer revenue: $1000", "wrong, the tariff raises the domestic price to $60, not $50, and the producer revenue change is $1400m, not $1000m."],
    ["Price of product: $50 | Government revenue: Decreases | Change in domestic producer revenue: $1400", "wrong, the domestic price is $60 and government revenue increases, not decreases."],
    ["Price of product: $60 | Government revenue: Decreases | Change in domestic producer revenue: $1000", "wrong, government revenue increases under a tariff, and the producer revenue change is $1400m, not $1000m."],
  ],
  66: [
    ["Dependence on agricultural production", "wrong, developing economies typically depend heavily on agriculture."],
    ["Weak political and economic institutions", "wrong, weak institutions are a common feature of developing economies."],
    ["Reliance on foreign aid", "wrong, many developing economies rely on foreign aid."],
  ],
  67: [
    ["International Monetary Fund", "wrong, the IMF promotes monetary stability and balance-of-payments support, not an extreme-poverty target."],
    ["World Trade Organisation", "wrong, the WTO deals with the rules of trade between nations, not poverty-reduction targets."],
    ["Organisation for Economic Cooperation and Development", "wrong, the OECD is a forum of advanced economies and does not set this poverty goal."],
  ],
  68: [
    ["Global factor: Weak entrepreneurial culture | Domestic factor: Phantom aid", "wrong, a weak entrepreneurial culture is a domestic factor, not a global one, so the classification is wrong."],
    ["Global factor: High levels of agricultural protection | Domestic factor: Highly skilled labour force", "wrong, a highly skilled labour force raises income rather than causing low income."],
    ["Global factor: Sustainable Development Goals | Domestic factor: High levels of foreign debt", "wrong, the SDGs are a development framework, not a cause of low income."],
  ],
  69: [
    ["Greater technology flows", "wrong, greater technology flows link economies more closely and strengthen the international business cycle."],
    ["Better transport networks", "wrong, cheaper and faster transport increases trade flows and strengthens the cycle."],
    ["Higher quotas", "wrong, higher import quotas expand the volume of trade and therefore strengthen the international business cycle."],
  ],
  70: [
    ["BFRL", "wrong, this covers an area along the with-tariff price line and does not represent foreign producers' income gain."],
    ["CENM", "wrong, this covers an area along the world price line rather than the foreign producers' gain in net income."],
    ["BAML + GFRN", "wrong, this double-counts by including the base-line areas, which do not represent the gain in net income experienced by foreign producers."],
  ],
  71: [
    ["Loss of domestic industries due to increased competition from imports", "wrong, this is a cost of globalisation (structural change in import-competing industries)."],
    ["Increased financial volatility due to rapid movement of capital across borders", "wrong, this is a cost: freer capital flows can transmit financial shocks quickly."],
    ["Loss of local jobs as transnational corporations relocate production overseas", "wrong, this is a cost borne by workers in the home economy."],
  ],
  72: [
    ["Export opportunities for agricultural producers in new overseas markets", "wrong, wider market access is an advantage for exporters."],
    ["Increased access to cheaper imported inputs for manufacturers", "wrong, cheaper inputs lower costs, an advantage."],
    ["Achieving economies of scale by accessing larger international markets", "wrong, larger markets let firms lower average costs, an advantage."],
  ],
  73: [
    ["An increase of 80 million units", "wrong, a quota restricts imports, and 80 million is the free-trade level of imports, not the change."],
    ["A decrease of 80 million units", "wrong, 80 million is the starting level of imports; 40 million are still imported at $60."],
    ["An increase of 40 million units", "wrong, the size is right but a quota reduces imports."],
  ],
  74: [
    ["Country B has become more integrated into the global economy than Country A, because its trade flows are more stable.", "wrong, because stability is not the measure of interdependence; the size of the rise in trade and financial flows is."],
    ["Both countries have become equally integrated, because both increased their exports as a share of GDP.", "wrong, because the increases are very different in size (16 points vs 3 points), and financial flows also matter."],
    ["Neither country has become more integrated, because financial flows are not a measure of interdependence.", "wrong, because financial flows (FDI and portfolio investment) are a core measure of interdependence alongside trade."],
  ],
  75: [
    ["Trade growth is always higher than output growth, which shows trade is the only driver of interdependence.", "wrong, because in Year 3 trade growth (−5.3%) is lower than output growth (−3.0%), and trade is not the only driver."],
    ["Output growth is more volatile than trade growth, which shows economies are not interdependent.", "wrong, because trade growth is the more volatile series, and co-movement actually shows interdependence."],
    ["Trade and output growth are unrelated, which shows interdependence is weak.", "wrong, because the two series clearly move together (both fall in Year 3, both rebound in Year 4)."],
  ],
  76: [
    ["The economy is becoming less open and therefore more insulated from the global economy.", "wrong, because the ratio is rising, not falling."],
    ["The economy's openness is unchanged, because the ratio is still below 100%.", "wrong, because openness is judged by the change in the ratio, not by whether it reaches 100%."],
    ["The economy is becoming more open, which means it is becoming less interdependent.", "wrong, because greater openness means greater, not less, interdependence."],
  ],
  77: [
    ["Emerging and developing economies receive most world FDI inflows, so financial interdependence is concentrated among poorer economies.", "wrong, because they receive only about a third (480 of 1430)."],
    ["FDI inflows are split evenly between the two groups, so financial interdependence is balanced.", "wrong, because the split is roughly two-thirds to one-third, not even."],
    ["The data cannot show interdependence, because FDI is not a financial flow.", "wrong, because FDI is a long-term financial flow and a core measure of financial integration."],
  ],
  78: [
    ["An international organisation that lends to countries in balance-of-payments crisis and enforces its conditions.", "wrong, this describes the IMF, not the G20."],
    ["A trading bloc whose members have removed all barriers to trade among themselves.", "wrong, the G20 is not a trading bloc and does not remove trade barriers among members."],
    ["A monetary union whose members share a single currency and a single monetary policy.", "wrong, the G20 members do not share a currency."],
  ],
  79: [
    ["The G20 lends to countries in crisis, whereas the IMF only coordinates policy.", "wrong, it is the reverse — the IMF lends, the G20 coordinates."],
    ["The G20 has a permanent secretariat, whereas the IMF has none.", "wrong, the G20 has no permanent secretariat, while the IMF is a permanent organisation."],
    ["The G20 settles trade disputes, whereas the IMF sets trade rules.", "wrong, settling trade disputes and setting trade rules are WTO functions, not G20 or IMF functions."],
  ],
  80: [
    ["legislating a binding rule that all members were required to follow.", "wrong, the G20 cannot legislate or bind its members."],
    ["providing emergency loans to member countries facing balance-of-payments difficulties.", "wrong, that is the IMF's role, not the G20's."],
    ["removing trade barriers between its members to stimulate world trade.", "wrong, the G20 is not a trading bloc and does not remove members' trade barriers."],
  ],
  81: [
    ["the total value of world trade in goods and services in a year.", "wrong, GWP measures production, not trade."],
    ["the sum of all countries' government budgets in a year.", "wrong, GWP is total production, not government spending."],
    ["the total value of world financial flows in a year.", "wrong, GWP is production, not financial flows."],
  ],
  82: [
    ["It is the total value of goods and services traded between countries.", "wrong, that is world trade, only one part of the global economy."],
    ["It is the combined output of the world's advanced economies only.", "wrong, the global economy includes all economies, not just advanced ones."],
    ["It is the total value of foreign direct investment between countries.", "wrong, that is one financial flow, not the whole global economy."],
  ],
  83: [
    ["market exchange rates overstate the output of emerging economies.", "wrong, market rates understate emerging economies' output because their prices are low."],
    ["PPP measures only the output of emerging economies.", "wrong, PPP measures all economies' output."],
    ["market exchange rates include the value of services, which PPP excludes.", "wrong, both measures include services; the difference is the price basis, not the coverage."],
  ],
  84: [
    ["Import substitution, protecting domestic industry behind high tariffs to serve its small home market.", "wrong, a small home market limits scale, and import substitution has largely failed in practice (inefficiency, no scale)."],
    ["Reducing investment in education to lower government spending.", "wrong, human capital investment raises productivity and development; cutting it would harm growth."],
    ["Restricting foreign direct investment to keep domestic firms insulated from competition.", "wrong, FDI brings capital, technology and market access, which developing economies need."],
  ],
  85: [
    ["it guarantees that all the benefits of growth are shared equally within the economy.", "wrong, FDI-led growth often raises inequality; nothing guarantees equal sharing."],
    ["it removes the need for the economy to invest in its own infrastructure.", "wrong, infrastructure is still needed, and SEZs often require the host to build it."],
    ["it eliminates the risk of environmental damage from new industry.", "wrong, new industry can increase environmental damage; the SEZ does not eliminate that risk."],
  ],
  86: [
    ["The international business cycle affects only advanced economies, whereas a regional business cycle affects only developing economies.", "wrong, both cycles can affect any type of economy."],
    ["The international business cycle is caused by domestic policy, whereas a regional business cycle is caused by world trade.", "wrong, both are transmitted through trade, finance and confidence, not by a single cause."],
    ["The international business cycle is a long-run trend, whereas a regional business cycle is a short-run fluctuation.", "wrong, both are short-run fluctuations around the long-run trend."],
  ],
  87: [
    ["a depreciation of its partners' currencies, which reduces the competitiveness of their exports and lowers their output.", "a depreciation makes partners' exports cheaper and more competitive, so it cushions the downturn rather than transmitting it."],
    ["a widening of the major economy's current account deficit, which raises its partners' export earnings.", "in a downturn the major economy buys fewer imports, so its deficit tends to narrow and partners earn less, not more."],
    ["a rise in world commodity prices as firms stockpile raw materials, which raises commodity exporters' incomes.", "a downturn lowers demand for raw materials, so commodity prices tend to fall, reducing exporters' incomes."],
  ],
  88: [
    ["Emerging economies usually fix their exchange rates to the US dollar, which makes their cycles follow the US cycle more closely than other advanced economies do.", "this would make cycles converge, not diverge; and most large emerging economies do not run a fixed peg to the US dollar."],
    ["Globalisation has reduced trade between emerging and advanced economies, so their business cycles have become separated from each other.", "globalisation has increased trade between them, which links cycles more closely."],
    ["Emerging economies have larger service sectors than advanced economies, so their output depends less on world demand.", "advanced economies have the larger service sectors; emerging economies rely more on manufacturing and commodities."],
  ],
  89: [
    ["Income is the stock of assets owned, whereas wealth is the flow of earnings received.", "wrong, this reverses the two definitions."],
    ["Income and wealth are the same thing, measured at different times.", "wrong, they are different concepts (flow vs stock)."],
    ["Income is always more unequally distributed than wealth.", "wrong, it is the reverse — wealth is more unequally distributed than income."],
  ],
  90: [
    ["Inequality between countries has risen this century, while inequality within countries has fallen everywhere.", "wrong, between-country inequality has fallen, and within-country inequality has not fallen everywhere."],
    ["Global inequality has risen steadily in every dimension this century.", "wrong, between-country inequality has fallen."],
    ["Global inequality has fallen to the point where income is now distributed almost equally worldwide.", "wrong, global inequality remains very high (the top 10% receive about half of global income)."],
  ],
  91: [
    ["Higher saving rates in poor countries, because low incomes make households save more for the future.", "low incomes leave little to save, so saving and investment are low; this is part of the poverty cycle."],
    ["Migration of skilled workers from rich countries to poor countries, attracted by lower living costs.", "the main flow is the reverse: skilled workers leave poor countries for higher wages (brain drain)."],
    ["Faster growth in poor countries' exports, because rich countries' higher incomes raise demand for all goods.", "inequality is not a source of export growth for poor countries; their limited capital, skills and market access hold exports back."],
  ],
  92: [
    ["Trade has grown, but foreign investment has shifted almost entirely to portfolio flows, reducing the role of transnational corporations.", "FDI has grown strongly alongside portfolio flows, and TNCs have become more important, not less."],
    ["Transnational corporations have grown mainly by expanding production in their home countries and exporting, so FDI has fallen relative to trade.", "TNCs have spread production across countries through FDI and global supply chains, rather than concentrating it at home."],
    ["Trade in goods has grown, but trade in services has fallen because services cannot be supplied across borders.", "technology has made many services tradable (finance, education, IT), and services trade has grown."],
  ],
  93: [
    ["It raises growth in advanced economies but lowers it in developing economies, widening the gap between them.", "many developing and emerging economies (e.g. China, Vietnam, India) have grown fastest under globalisation."],
    ["It raises total GDP but not GDP per capita, because population growth absorbs the gains.", "world GDP per capita has risen substantially; population growth has not absorbed the gains."],
    ["It raises average incomes, so quality of life rises by the same proportion in every economy that opens up.", "the gains are unevenly shared within and between economies, and income is only one part of quality of life."],
  ],
  94: [
    ["Development lowers global emissions overall, because production shifts from developing economies to cleaner advanced economies.", "production, especially manufacturing, has shifted towards developing and emerging economies, and global emissions have risen."],
    ["Development harms the environment mainly in advanced economies, because developing economies produce mostly agricultural goods.", "emerging economies are now the largest sources of emissions growth, and agriculture itself causes land clearing and emissions."],
    ["Development affects the environment only through population growth, not through rising production and consumption.", "rising production and consumption per person are major drivers of resource use and emissions."],
  ],
  95: [
    ["highly efficient domestic firms that quickly become world-class exporters.", "wrong, protection removes the competitive pressure that drives efficiency."],
    ["a rapid rise in exports, because protected firms sell more abroad.", "wrong, protected firms serve the home market and are rarely competitive exporters."],
    ["lower prices for domestic consumers, because protection reduces costs.", "wrong, protection raises domestic prices above world prices."],
  ],
  96: [
    ["Raising tariffs on imported consumer goods.", "wrong, this is a protection measure, not a human-capital investment."],
    ["Establishing a special economic zone with tax breaks.", "wrong, this attracts FDI, not human capital directly."],
    ["Signing a bilateral free trade agreement.", "wrong, this liberalises trade, not human capital."],
  ],
};

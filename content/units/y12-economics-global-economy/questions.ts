import type { Question } from "@/lib/types";
import { conceptOfQuestionId } from "./concept-tags";
import { mc, sa } from "./build";
import { dataTable } from "./diagram";
import { diagrams, tableQuestions } from "./diagrams-econ";

// PUBLIC — no answer keys here. HSC Economics Topic 1: The Global Economy (2009
// syllabus, examined in the 2027 HSC). Trial questions are copied word for word and show
// their source (constitution Principle V); supplement questions are original. No HSC
// questions. See docs/y12-economics-global-economy-research.md.
export const questions: Question[] = [
  mc(1, "Abbotsleigh 2021 Trial, Q4",
    "The table shows selected economic data for 2 countries, A and B\n\nAccording to the data in the table, which statement correctly describes the value of real GDP and the level of economic development between Country A and Country B?",
    ["Country A has a higher real GDP but lower economic development level than Country B", "Country A has a higher real GDP and higher level of economic development than country B", "Country A has a higher level of economic development but lower real GDP than Country B", "Country A has a lower real GDP and lower level of economic development than country B"],
    { svg: dataTable(tableQuestions["m001"]), alt: tableQuestions["m001"].alt }),

  mc(2, "Abbotsleigh 2021 Trial, Q7",
    "Which of the following are negative impacts of transnational corporations in the global economy?",
    ["Reduced labour mobility and less access to funds in the global economy", "Increased tax minimisation strategies and increased environmental degradation", "Greater trade protection and less sharing of technology", "Increased global financial volatility and higher costs of production"]),

  mc(3, "Abbotsleigh 2021 Trial, Q12",
    "Which of the following is an example of foreign direct investment?",
    ["An Australian investor buys a small parcel of shares on the Japanese stock market", "A domestic trader purchasing foreign currency on the foreign exchange market", "A transnational company establishes a subsidiary in another country", "A state government borrowing funds from overseas to build road infrastructure"]),

  mc(4, "Baulkham Hills 2022 Trial, Q1",
    "Which of the following international organisations is a major forum which coordinates global policy on trade, health, climate, and other issues?",
    ["The World Bank", "The World Trade Organisation", "G20", "The International Monetary Fund"]),

  mc(5, "Abbotsleigh 2021 Trial, Q16",
    "Examine the following graph which illustrates the effects of introducing a subsidy to dairy farmers producing milk in a hypothetical closed economy.\n\nWhich of the following statements is CORRECT in relation to introducing the subsidy?",
    ["Government spending increases by $1600 and these farmers are less competitive on the global market", "Government spending increases by $2000 and the price of milk falls by $20 a litre", "Government spending increases by $1600 and the price of milk falls by $10 a litre", "Government spending increases by $2000 and the price of milk falls by $10 a litre"],
    diagrams["m005"]),

  mc(6, "Abbotsleigh 2021 Trial, Q17",
    "Which of the following best describes dumping in international trade?",
    ["When foreign firms sell their products in another country at a lower price than the selling price in the country of origin.", "When foreign firms sell more goods in another country than local producers sell in that country.", "When foreign firms sell their products in another country, at a cheaper price than local producers in that country.", "When a foreign country signs a free trade agreement with another country and trade is diverted there."]),

  mc(7, "Abbotsleigh 2021 Trial, Q18",
    "The graph below shows information about a tariff where the world price is $20 and the price with the tariff is $40.\n\nWhich of the following statements is CORRECT in relation to this tariff being implemented?",
    ["Domestic producers' revenue will increase by $2600 and the government will receive $400 in taxation", "Domestic producers' revenue will increase by $1600 and the government will receive $1600 in taxation", "Domestic producers' revenue will increase by $1200 and the government will receive $800 in taxation", "Domestic producers' revenue will increase by $1600 and the government will receive $800 in taxation"],
    diagrams["m007"]),

  mc(8, "Abbotsleigh 2021 Trial, Q20",
    "Which of the following is an example of a multilateral trade agreement that Australia is NOT part of?",
    ["The Comprehensive & Progressive Agreement for Trans-Pacific Partnership (CPTPP)", "APEC", "ASEAN", "ANZCERTA"]),

  mc(9, "Abbotsleigh 2023 Trial, Q1",
    "Which of the following is most likely to lead to an increase in free trade?",
    ["An increase in subsidies and a decrease in tariffs", "A decrease in a quota and an increase in local content rules", "A decrease in tariffs and an increase in a quota", "An increase in tariffs and a decrease in subsidies"]),

  mc(10, "Abbotsleigh 2023 Trial, Q2",
    "If there was an increase in subsidies paid by the Chinese government to their domestic producers, what would be the impact on Australian exporters?",
    ["Australian exporter revenue increases and export volumes rise", "Australian exporter revenue increases and export volumes fall", "Australia exporter revenue decreases and export volumes rise", "Australian exporter revenue decreases and export volumes fall"]),

  mc(11, "Abbotsleigh 2023 Trial, Q9",
    "The following diagram shows domestic demand and supply curves for a hypothetical economy.\n\nWhat is the size of the quota that would have the same effect on the price of this good in this economy as a tariff of $2?",
    ["100 units", "200 units", "300 units", "400 units"],
    diagrams["m011"]),

  mc(12, "Abbotsleigh 2023 Trial, Q11",
    "Which of the following organisations is most likely to provide low interest rate financing to build hospitals in a developing country?",
    ["World Bank", "International Monetary Fund", "OECD", "World Trade Organisation"]),

  mc(13, "Abbotsleigh 2023 Trial, Q12",
    "The following diagram shows the impact of a subsidy on a hypothetical economy.\n\nWhat is the total cost of the subsidy to the government?",
    ["$10", "$20", "$400", "$1000"],
    diagrams["m013"]),

  mc(14, "Abbotsleigh 2023 Trial, Q18",
    "Which of the following is an example of a multilateral FTA of which Australia is a member?",
    ["EU", "ChAFTA", "AANZFTA", "USMCA"]),

  mc(15, "Ascham 2018 Trial, Q13",
    "An emerging country is experiencing balance of payment difficulties and instability in its exchange rate.\n\nWhich of the following international organisations could provide the country with financial assistance?",
    ["The World Trade Organisation", "The World Bank", "The International Monetary Fund", "The Organisation for Economic Co-operation and Development"]),

  mc(16, "Ascham 2018 Trial, Q14",
    "A government wants to protect its industries from import competition.\n\nWhich combination of trade policies would be most appropriate to achieve this?",
    ["Increase in tariffs on imported goods — Increase in quotas on imported goods", "Increase in tariffs on imported goods — Decrease in quotas on imported goods", "Decrease in tariffs on imported goods — Decrease in quotas on imported goods", "Decrease in tariffs on imported goods — Increase in quotas on imported goods"]),

  mc(17, "Ascham 2018 Trial, Q19",
    "Which of the following factors can restrict economic growth and development in developing economies?",
    ["High population growth rates, low per capita incomes and low levels of capital accumulation", "Low population growth rates, high levels of foreign debt and high levels of capital accumulation", "High levels of domestic savings, low levels of technology and high levels of foreign direct investment", "Low levels of domestic savings, low per capita incomes and high levels of exports"]),

  mc(18, "Barker 2022 Trial, Q1",
    "Which of the following international organisations would support a developing country to build educational facilities?",
    ["WTO", "World Bank", "OECD", "G20"]),

  mc(19, "Barker 2022 Trial, Q5",
    "What situation would indicate a country undergoing economic development?",
    ["Reliance on agricultural production.", "Increasing levels of income inequality.", "Decreased levels of foreign investment.", "Greater levels of rural to urban migration."]),

  mc(20, "Barker 2022 Trial, Q20",
    "Use the following tariff diagram to answer Question 20.\n\nAssume the world price is $10 and the government introduces a tariff of $5.\n\nWhich of the following correctly shows the change in government revenue, change in foreign producer revenue and the value of the subsidy which would have the same effect on the market as the tariff.",
    ["Government Revenue $30,000 — Foreign Producer Revenue $40,000 — Subsidy Value $5 per unit", "Government Revenue $20,000 — Foreign Producer Revenue $30,000 — Subsidy Value $10 per unit", "Government Revenue $10,000 — Foreign Producer Revenue $20,000 — Subsidy Value $10 per unit", "Government Revenue $10,000 — Foreign Producer Revenue $20,000 — Subsidy Value $5 per unit"],
    diagrams["m020"]),

  mc(21, "Baulkham Hills 2022 Trial, Q6",
    "The diagram shows the impact of a quota in a hypothetical economy.\n\nWhat is the effect of the quota on the price and revenue of the overseas producer?",
    ["Price after quota 10 — Overseas producer revenue after quota 20 000", "Price after quota 12 — Overseas producer revenue after quota 20 000", "Price after quota 10 — Overseas producer revenue after quota 24 000", "Price after quota 12 — Overseas producer revenue after quota 24 000"],
    diagrams["m021"]),

  mc(22, "Baulkham Hills 2022 Trial, Q8",
    "Which of the following statements about trade blocs is correct?",
    ["They increase trade between non-member and member countries.", "They can lead to trade diversion from efficient non-member countries to inefficient member countries.", "They apply the same level of protection to member and non-member countries.", "They allow member states to use the same currency."]),

  mc(23, "Baulkham Hills 2023 Trial, Q1",
    "What is a disadvantage of free trade?",
    ["Integration in the international business cycle makes countries vulnerable due to specialisation.", "Standards of living will fall as countries will face lower prices of goods and services from countries that are more efficient.", "Infant industries will have access to new technology and capital.", "Free trade forces innovation which improves efficiency in the production process."]),

  mc(24, "Baulkham Hills 2023 Trial, Q2",
    "Based on the data in the table, what should the World Bank implement to best improve the economic development of the hypothetical country?",
    ["Provide university scholarships for students to study overseas.", "Provide loans to stabilise the country's currency.", "Pay off the deficit in the balance of goods and services.", "Provide funds to pay for childhood vaccination programs."],
    { svg: dataTable(tableQuestions["m024"]), alt: tableQuestions["m024"].alt }),

  mc(25, "Baulkham Hills 2023 Trial, Q6",
    "The diagram shows the demand and supply for cheese within an economy. The world price is $2.\n\nThe government has recently changed its tariff on cheese. Current imports are 20,000 units but the change is expected to add another 20,000 units.\n\nWhat is the likely effect of this change?",
    ["There is a new revenue of $10,000 — Demand expands along the demand curve from 50,000 units to 60,000 units as price falls by $1", "There is a new revenue of $60,000 — Demand curve shifts to the right from 50,000 units to 60,000 units as price falls by $1", "Revenue decreases by $10,000 — Demand expands from 50,000 units to 60,000 units as price drops from $4 to $3", "Revenue decreases by $60,000 — Demand expands along the demand curve due to lower price from $4 to $3"],
    diagrams["m025"]),

  mc(26, "Baulkham Hills 2023 Trial, Q17",
    "What is a disadvantage of a country being a member of a monetary union?",
    ["Lower trade due to increased trade diversion amongst member countries.", "Loss of competitiveness due to exchange rate inflexibility for individual members.", "Economic policies are largely ineffective against international business cycle shocks.", "Member countries will have to fix their currencies to the monetary union's exchange rate."]),

  mc(27, "Baulkham Hills 2024 Trial, Q4",
    "An economy is experiencing low levels of savings and high dependency on agricultural exports.\n\nWhich of the following economies demonstrate these characteristics?",
    ["Advanced", "Emerging", "Developing", "Transitional"]),

  mc(28, "Baulkham Hills 2024 Trial, Q14",
    "How can globalisation lead to an improvement in economic development in the world economy?",
    ["Increase rates of economic growth and productivity", "Increase trade and foreign investments", "Increase real incomes and living standards", "Increase financial contagion and exchange rate volatility"]),

  mc(29, "Baulkham Hills 2025 Trial, Q3",
    "Which of the following has occurred due to an increase in the international division of labour?",
    ["A decrease in gross world product", "Transnational corporations reducing investment", "A decline in workers' financial remittances", "A loss of skilled labour from developing countries"]),

  mc(30, "Baulkham Hills 2025 Trial, Q4",
    "A government introduces legislation requiring businesses to make goods and services using inputs from the domestic market.\n\nWhat type of protection does this best reflect?",
    ["Tariffs", "Quotas", "Export incentives", "Local content rules"]),

  mc(31, "Knox 2024 Trial, Q1",
    "Which of the following is an example of a monetary union?",
    ["European Union", "G20", "ASEAN", "APEC"]),

  mc(32, "Baulkham Hills 2025 Trial, Q8",
    "A hypothetical economy shows low levels of integration with the global economy. The economy is primarily agrarian, has a high population growth rate and low economic development.\n\nThis economy is most likely an example of which type of economy?",
    ["Developing economy", "Emerging economy", "Advanced economy", "Transition economy"]),

  mc(33, "Baulkham Hills 2025 Trial, Q12",
    "A group of regional economies has developed a common trade policy.\n\nWhich of the following is this an example of?",
    ["Monetary union", "Bilateral agreement", "Multilateral agreement", "Government economic forum"]),

  mc(34, "Baulkham Hills 2025 Trial, Q14",
    "Which of the following is NOT a Human Development Index (HDI) indicator?",
    ["Life expectancy at birth", "Gross National Income (GNI) per capita", "Mean years of schooling completed", "Gross Domestic Product (GDP)"]),

  mc(35, "James Ruse 2021 Trial, Q1",
    "What is the theoretical basis of international trade?",
    ["Absolute advantage", "Purchasing power parity", "Law of diminishing marginal utility", "Comparative advantage"]),

  mc(36, "James Ruse 2021 Trial, Q11",
    "Which of the following organisations could assist a country experiencing a Balance of Payments and exchange rate crisis due to a world recession?",
    ["The World Trade Organisation", "The European Union", "The International Monetary Fund", "The World Bank"]),

  mc(37, "James Ruse 2021 Trial, Q15",
    "Which international organisation is most concerned with helping poorer countries with their economic development?",
    ["The International Monetary Fund", "The World Trade Organisation", "The United Nations", "The World Bank"]),

  mc(38, "James Ruse 2021 Trial, Q16",
    "Which of the following is the most accurate description of economic development?",
    ["An increase in real GDP growth over time", "A measure of labour and capital productivity over time", "An outward shift in an economy's production possibility frontier", "A broad measure of welfare in an economy including indicators of health, education, environmental quality, and material living standards"]),

  mc(39, "James Ruse 2021 Trial, Q17",
    "How does the effect of a subsidy differ from the effect of a tariff?",
    ["A subsidy helps to reduce production costs while a tariff does not", "A subsidy is less efficient than a tariff", "A subsidy can lower prices for consumers while a tariff can not", "A subsidy provides revenue for the government while a tariff does not"]),

  mc(40, "James Ruse 2021 Trial, Q20",
    "Which of the following most likely indicates an expansion in globalisation?",
    ["Increases in the volatility of foreign direct investment", "Increases in bi-lateral trade agreements between countries", "Increases in the value of global trade as a proportion of total output", "Increases in the growth rates of developing nations"]),

  mc(41, "Knox 2024 Trial, Q2",
    "Which of the following best describes the international division of labour?",
    ["An improvement in working conditions for the workforce", "An increase in the mobility of the labour force in an economy", "Emerging countries with a workforce of low skilled and low paid workers", "Different nations that specialise in different types of production and labour"]),

  mc(42, "Knox 2025 Trial, Q2",
    "Which of the following is indicated by the Human Development Index (HDI)?",
    ["Inequality within advanced economies is increasing", "Economic growth rates are highest in emerging economies", "Absolute poverty levels are reducing in all types of economies", "The average life expectancy at birth for OECD countries exceeds 80 years"]),

  mc(43, "Newington 2017 Trial, Q9",
    "The following diagram shows the effect of a tariff.\n\nWhat effect does the imposition of the tariff have on domestic supply?",
    ["Domestic supply falls from Q1Q4 to Q2Q3", "Domestic supply rises from Q1 to Q2", "Domestic supply is Q1 to Q4", "Domestic supply falls from the tariff price to the free trade price"],
    diagrams["m043"]),

  mc(44, "Newington 2017 Trial, Q12",
    "Which of the following agreements does not include Australia?",
    ["CERTA", "NAFTA", "WTO", "OECD"]),

  mc(45, "Newington 2017 Trial, Q13",
    "Which of the following is a trend of globalisation?",
    ["A fall in global portfolio investment", "A fall in trade flows between developed economies", "A fall in barriers to labour mobility", "A fall in currency speculation"]),

  mc(46, "Newington 2017 Trial, Q14",
    "Which of the following is likely to reduce inequality in the global distribution of income?",
    ["An increase in agricultural subsidies in the EU", "An increase in bilateral trade agreements between developed nations", "An increase in global interest rates", "An increase in multi-lateral trade agreements involving developing nations"]),

  mc(47, "Knox 2024 Trial, Q19",
    "Use the information below to answer Questions 19 and 20.\n\nThe following diagram shows the demand and supply for a particular good within a hypothetical economy. The world price is $2.\n\nThe government is considering imposing a tariff that would have the same impact on domestic production as an import quota of 40,000 items.\n\nWhat is the total tariff revenue that will be generated?",
    ["$80,000", "$40,000", "$20,000", "$0"],
    diagrams["m047"]),

  mc(48, "Newington 2025 Trial, Q2",
    "The \"global movement of capital\" refers to the movement of:",
    ["Transnational corporations", "Investment", "Machinery", "Disposable income"]),

  mc(49, "Newington 2025 Trial, Q6",
    "Which of the following measures are used in calculating the Human Development Index (HDI)?",
    ["Fertility rate, unemployment rate, adult literacy rate", "GDP per capita at purchasing power parity, years of schooling, life expectancy at birth", "Life expectancy at birth, school enrolment rate, doctors per 1,000 people", "GNI per capita at purchasing power parity, unemployment rate, adult literacy rate"]),

  mc(50, "Newington 2025 Trial, Q10",
    "The government of The United States of Pym have been encouraging domestic businesses to penetrate new markets around the world through providing financial assistance and legal information. Which method of protection best describes this?",
    ["Export incentives", "Local content rules", "Subsidy", "Dumping"]),

  mc(51, "Newington 2025 Trial, Q14",
    "When is a country said to have a comparative advantage over its competitors?",
    ["When it can produce a good using smaller quantities of resources than that of another country", "When it is able to specialise in the production of one good over another", "When it can produce a good with a lower opportunity cost than another country", "When it is able to gain greater trade than that of another country"]),

  mc(52, "Newington 2025 Trial, Q18",
    "Which of the following is an effect of a subsidy?",
    ["Decreased domestic prices and improved international competitiveness for Australian goods", "Increased productivity of labour and the promotion of structural change", "Higher prices domestically and a redistribution of income in the economy", "Increased supply by domestic producers and a more efficient allocation of resources in the economy"]),

  mc(53, "Riverview 2024 Trial, Q1",
    "Which of the following best describes Gross World Product?",
    ["The total sum of economic activity of the world", "The total sum of economic activity of the OECD", "The total sum of economic activity in the advanced economies", "The total sum of economic activity in high and low income economies"]),

  mc(54, "Riverview 2024 Trial, Q2",
    "Which of the following is the main role of the World Bank?",
    ["To resolves trade disputes", "To help fund investment in infrastructure", "To ensure stability in global financial markets", "To provide resources and information to member countries"]),

  mc(55, "Riverview 2024 Trial, Q14",
    "Which of the following most accurately describes an emerging and developing economy?",
    ["Small services sector, high population growth rates, less advanced manufacturing", "High exports as a percentage of GDP, small services sector, advanced manufacturing", "Low exports as a percentage of GDP, large services sector, low population growth rates", "Income greater than $13,845 per capita, high population growth rates, low exports as a percentage of GDP"]),

  mc(56, "Sydney Boys 2020 Trial, Q4",
    "The following diagram shows the effect of a change in the import quota on demand and supply for pharmaceutical products.\n\nWhich of the following statements is most likely to explain the impact of the change in the import quota on the domestic economy?",
    ["Domestic producers' market share will increase and government revenue will fall", "Domestic producers' market share will decrease and government revenue will decrease", "Domestic producers' market share will increase and the price of domestic products may rise", "Domestic producers' market share will decrease and the price of domestic products may fall"],
    diagrams["m056"]),

  mc(57, "Sydney Boys 2020 Trial, Q11",
    "Which of the following combinations characterise a developing economy?",
    ["Moderate growth — Heavily reliant on agriculture — Income levels are low", "Moderate growth — Heavily reliant on service industry — Income levels are high", "Fast growth — Heavily reliant on manufacturing industry — Income levels are low", "Fast growth — Heavily reliant on foreign aid — Income levels vary"]),

  mc(58, "Sydney Boys 2020 Trial, Q12",
    "The following diagram shows the impact of a subsidy on a domestic industry.\n\nWhat is the size of the total value of the subsidy payable by the government?",
    ["$20", "$50", "$1000", "$2000"],
    diagrams["m058"]),

  mc(59, "Sydney Boys 2022 Trial, Q3",
    "The following diagram shows a reduction in tariff protection reducing the price of rice cookers through the removal of a $5 tariff for each cooker sold for a hypothetical economy.\n\nWhich row of the table shows the likely effect of the change in tariff on imports and government revenue?",
    ["Imports Increase — Government revenue Increase", "Imports Increase — Government revenue Decrease", "Imports Decrease — Government revenue Decrease", "Imports Decrease — Government revenue Increase"],
    diagrams["m059"]),

  mc(60, "Sydney Boys 2022 Trial, Q8",
    "A hypothetical country records an improvement in its level of economic development.\n\nWhich of the following measures would best support this statement?",
    ["An increase in real gross domestic product and an increase in gross domestic product per capita", "An increase in real gross domestic product and an increase in educational attainment", "An increase in gross domestic product per capita and an increase in the productive capacity of the economy", "An increase in real gross domestic product per capita and an increase in life expectancy"]),

  mc(61, "Knox 2024 Trial, Q20",
    "Use the information below to answer Questions 19 and 20.\n\nThe following diagram shows the demand and supply for a particular good within a hypothetical economy. The world price is $2.\n\nThe government is also considering a per unit subsidy to assist local producers. What per unit subsidy would result in the revenue for overseas producers reducing by $80,000?",
    ["$1", "$2", "$3", "$4"],
    diagrams["m061"]),

  mc(62, "Sydney Boys 2022 Trial, Q14",
    "What are TWO major functions of the International Monetary Fund (IMF)?",
    ["The provision of development aid and technical assistance to developing countries", "The resolution of trade disputes between countries and the promotion of free trade", "The promotion of global monetary stability and lending to crisis-affected countries", "The promotion of Sustainable Development Goals and the reduction in global poverty"]),

  mc(63, "Sydney Boys 2025 Trial, Q1",
    "Which of the following is an example of a monetary union and trade bloc?",
    ["ChAFTA", "ASEAN", "OECD", "EU"]),

  mc(64, "Sydney Boys 2025 Trial, Q9",
    "Which of the following will most likely occur if the government provides a subsidy?",
    ["Production output: Increases | Price level: Decreases", "Production output: Decreases | Price level: Increases", "Production output: Increases | Price level: Increases", "Production output: Decreases | Price level: Decreases"]),

  mc(65, "Sydney Boys 2025 Trial, Q20",
    "Use the following demand and supply diagram to answer Questions 19 and 20.\n\nThe government replaces the import quota with a $10 tariff.\n\nWhich of the following shows the impacts of the tariff on the domestic economy?",
    ["Price of product: $50 | Government revenue: Increases | Change in domestic producer revenue: $1000", "Price of product: $50 | Government revenue: Decreases | Change in domestic producer revenue: $1400", "Price of product: $60 | Government revenue: Increases | Change in domestic producer revenue: $1400", "Price of product: $60 | Government revenue: Decreases | Change in domestic producer revenue: $1000"],
    diagrams["m065"]),

  mc(66, "Sydney Grammar 2020 Trial, Q1",
    "Which of the following is not a typical characteristic of a developing economy?",
    ["Dependence on agricultural production", "Weak political and economic institutions", "Reliance on foreign aid", "Low level of inequality"]),

  mc(67, "Sydney Grammar 2020 Trial, Q4",
    "Which of the following international organisations has an aim to reduce the rate of extreme poverty to less than 3% of the world's population by 2030?",
    ["International Monetary Fund", "World Trade Organisation", "World Bank", "Organisation for Economic Cooperation and Development"]),

  mc(68, "Sydney Grammar 2020 Trial, Q19",
    "Which of the following combinations is generally regarded as causes of low levels of national income?",
    ["Global factor: Weak entrepreneurial culture | Domestic factor: Phantom aid", "Global factor: High levels of agricultural protection | Domestic factor: Highly skilled labour force", "Global factor: Tied aid | Domestic factor: Poor access to capital", "Global factor: Sustainable Development Goals | Domestic factor: High levels of foreign debt"]),

  mc(69, "Sydney Grammar 2021 Trial, Q3",
    "Which of the following would not strengthen the international business cycle?",
    ["More regulation of financial sectors", "Greater technology flows", "Better transport networks", "Higher quotas"]),

  mc(70, "Sydney Grammar 2021 Trial, Q8",
    "The following graph relates to the impact on an economy following the removal of a tariff on a particular good:\n\nWhich area represents the gain in net income experienced by foreign producers?",
    ["BFRL", "CENM", "BCML + EFRN", "BAML + GFRN"],
    diagrams["m070"]),

  mc(71, "Sydney Boys 2025 Trial, Q3",
    "Which of the following is a benefit of globalisation?",
    ["Loss of domestic industries due to increased competition from imports", "Increased financial volatility due to rapid movement of capital across borders", "Loss of local jobs as transnational corporations relocate production overseas", "Increased access to affordable and innovative products and new markets"]),

  mc(72, "Sydney Boys 2025 Trial, Q5",
    "Which of the following is a disadvantage of free trade agreements on domestic producers?",
    ["Export opportunities for agricultural producers in new overseas markets", "Business closures in some industries due to strong foreign competition", "Increased access to cheaper imported inputs for manufacturers", "Achieving economies of scale by accessing larger international markets"]),

  mc(73, "Sydney Boys 2025 Trial, Q19",
    "Use the following demand and supply diagram to answer Questions 19 and 20.\n\nWorld Price with free trade is $50. The government imposes an import quota that changes the price to $60.\n\nWhat was the change in the quantity of imports?",
    ["An increase of 80 million units", "A decrease of 80 million units", "An increase of 40 million units", "A decrease of 40 million units"],
    diagrams["m073"]),

  mc(74, "Original question",
    "The table shows selected trade and financial-flow data for two hypothetical economies, Country A and Country B, over three years.",
    ["Country A has become more integrated into the global economy than Country B, because its trade and financial flows have both risen by a larger amount.", "Country B has become more integrated into the global economy than Country A, because its trade flows are more stable.", "Both countries have become equally integrated, because both increased their exports as a share of GDP.", "Neither country has become more integrated, because financial flows are not a measure of interdependence."],
    { svg: dataTable(tableQuestions["m074"]), alt: tableQuestions["m074"].alt }),

  mc(75, "Original question",
    "The table shows world merchandise trade growth and world output (GWP) growth over four years.",
    ["Trade growth is more volatile than output growth, and the two move together, which shows economies are interdependent.", "Trade growth is always higher than output growth, which shows trade is the only driver of interdependence.", "Output growth is more volatile than trade growth, which shows economies are not interdependent.", "Trade and output growth are unrelated, which shows interdependence is weak."],
    { svg: dataTable(tableQuestions["m075"]), alt: tableQuestions["m075"].alt }),

  mc(76, "Original question",
    "The table shows the trade-to-GDP ratio (exports plus imports as a percentage of GDP) for a hypothetical economy over four years.",
    ["The economy is becoming more open and therefore more exposed to changes in the global economy.", "The economy is becoming less open and therefore more insulated from the global economy.", "The economy's openness is unchanged, because the ratio is still below 100%.", "The economy is becoming more open, which means it is becoming less interdependent."],
    { svg: dataTable(tableQuestions["m076"]), alt: tableQuestions["m076"].alt }),

  mc(77, "Original question",
    "The table shows the direction of foreign direct investment (FDI) inflows for a hypothetical world economy over two years.",
    ["Advanced economies receive about two-thirds of world FDI inflows, so financial interdependence is concentrated among richer economies.", "Emerging and developing economies receive most world FDI inflows, so financial interdependence is concentrated among poorer economies.", "FDI inflows are split evenly between the two groups, so financial interdependence is balanced.", "The data cannot show interdependence, because FDI is not a financial flow."],
    { svg: dataTable(tableQuestions["m077"]), alt: tableQuestions["m077"].alt }),

  mc(78, "Original question",
    "Which of the following best describes the G20?",
    ["A forum of the world's largest economies that coordinates global economic policy but whose agreements are not legally binding.", "An international organisation that lends to countries in balance-of-payments crisis and enforces its conditions.", "A trading bloc whose members have removed all barriers to trade among themselves.", "A monetary union whose members share a single currency and a single monetary policy."]),

  mc(79, "Original question",
    "Which of the following is a key difference between the G20 and the International Monetary Fund (IMF)?",
    ["The G20 is an informal forum whose decisions are not binding, whereas the IMF is a formal organisation with binding lending conditions.", "The G20 lends to countries in crisis, whereas the IMF only coordinates policy.", "The G20 has a permanent secretariat, whereas the IMF has none.", "The G20 settles trade disputes, whereas the IMF sets trade rules."]),

  mc(80, "Original question",
    "In 2009, in response to the global financial crisis, the G20 leaders agreed to coordinate a large fiscal stimulus across their economies. This action is best described as an example of the G20",
    ["coordinating a shared policy response to a global shock, which boosted confidence and supported the recovery.", "legislating a binding rule that all members were required to follow.", "providing emergency loans to member countries facing balance-of-payments difficulties.", "removing trade barriers between its members to stimulate world trade."]),

  mc(81, "Original question",
    "Gross World Product (GWP) is best defined as",
    ["the total market value of all final goods and services produced in the world in a year.", "the total value of world trade in goods and services in a year.", "the sum of all countries' government budgets in a year.", "the total value of world financial flows in a year."]),

  mc(82, "Original question",
    "Which of the following is the most accurate statement about the global economy?",
    ["It is the sum of all national economies and the international economic relationships linking them.", "It is the total value of goods and services traded between countries.", "It is the combined output of the world's advanced economies only.", "It is the total value of foreign direct investment between countries."]),

  mc(83, "Original question",
    "GWP measured at purchasing power parity (PPP) gives emerging economies a larger share of world output than GWP measured at market exchange rates. This is because",
    ["PPP adjusts for the fact that goods and services are cheaper in emerging economies, so their real output is larger than market exchange rates suggest.", "market exchange rates overstate the output of emerging economies.", "PPP measures only the output of emerging economies.", "market exchange rates include the value of services, which PPP excludes."]),

  mc(84, "Original question",
    "A hypothetical developing economy, Country X, has a small domestic market and abundant low-cost labour. Which development strategy is most likely to raise its growth and development?",
    ["Export-oriented industrialisation, using its low-cost labour to produce manufactured goods for world markets.", "Import substitution, protecting domestic industry behind high tariffs to serve its small home market.", "Reducing investment in education to lower government spending.", "Restricting foreign direct investment to keep domestic firms insulated from competition."]),

  mc(85, "Original question",
    "A hypothetical economy, Country Y, attracts foreign direct investment by establishing a special economic zone with tax breaks and streamlined regulation. The most likely trade-off of this strategy is that",
    ["it can raise growth and employment, but profits may be repatriated and tax revenue forgone.", "it guarantees that all the benefits of growth are shared equally within the economy.", "it removes the need for the economy to invest in its own infrastructure.", "it eliminates the risk of environmental damage from new industry."]),

  mc(86, "Original question",
    "Which of the following best describes the difference between the international business cycle and a regional business cycle?",
    ["The international business cycle is the tendency for many economies worldwide to experience booms and contractions at similar times, whereas a regional business cycle is co-movement within a specific region.", "The international business cycle affects only advanced economies, whereas a regional business cycle affects only developing economies.", "The international business cycle is caused by domestic policy, whereas a regional business cycle is caused by world trade.", "The international business cycle is a long-run trend, whereas a regional business cycle is a short-run fluctuation."]),

  mc(87, "Original question",
    "A downturn in a major economy such as the United States is most likely to be transmitted to its trading partners through",
    ["a fall in the major economy's imports, which reduces demand for its partners' exports, lowering their output and employment.", "a depreciation of its partners' currencies, which reduces the competitiveness of their exports and lowers their output.", "a widening of the major economy's current account deficit, which raises its partners' export earnings.", "a rise in world commodity prices as firms stockpile raw materials, which raises commodity exporters' incomes."]),

  mc(88, "Original question",
    "Which of the following best explains why an emerging economy's business cycle can diverge from the business cycles of advanced economies?",
    ["The emerging economy may be driven by different factors, such as commodity prices or domestic investment, so its cycle need not move in step with advanced economies.", "Emerging economies usually fix their exchange rates to the US dollar, which makes their cycles follow the US cycle more closely than other advanced economies do.", "Globalisation has reduced trade between emerging and advanced economies, so their business cycles have become separated from each other.", "Emerging economies have larger service sectors than advanced economies, so their output depends less on world demand."]),

  mc(89, "Original question",
    "Which of the following best describes the difference between income and wealth?",
    ["Income is the flow of earnings received over a period, whereas wealth is the stock of assets owned at a point in time.", "Income is the stock of assets owned, whereas wealth is the flow of earnings received.", "Income and wealth are the same thing, measured at different times.", "Income is always more unequally distributed than wealth."]),

  mc(90, "Original question",
    "Which of the following statements about the global distribution of income is most accurate?",
    ["Inequality between countries has fallen this century as China and India have converged, while inequality within many advanced economies has tended to rise.", "Inequality between countries has risen this century, while inequality within countries has fallen everywhere.", "Global inequality has risen steadily in every dimension this century.", "Global inequality has fallen to the point where income is now distributed almost equally worldwide."]),

  mc(91, "Original question",
    "Which of the following is a likely consequence of a highly unequal global distribution of income and wealth?",
    ["Reduced human capital and social problems in poor countries, and political instability that can slow growth.", "Higher saving rates in poor countries, because low incomes make households save more for the future.", "Migration of skilled workers from rich countries to poor countries, attracted by lower living costs.", "Faster growth in poor countries' exports, because rich countries' higher incomes raise demand for all goods."]),

  mc(92, "Original question",
    "Which of the following is the most likely effect of globalisation on trade, investment and transnational corporations?",
    ["Trade and foreign investment have grown, and transnational corporations have expanded production across many countries.", "Trade has grown, but foreign investment has shifted almost entirely to portfolio flows, reducing the role of transnational corporations.", "Transnational corporations have grown mainly by expanding production in their home countries and exporting, so FDI has fallen relative to trade.", "Trade in goods has grown, but trade in services has fallen because services cannot be supplied across borders."]),

  mc(93, "Original question",
    "Which of the following best describes the effect of globalisation on economic growth and the quality of life?",
    ["It tends to raise growth and average living standards, but the benefits are unevenly distributed.", "It raises growth in advanced economies but lowers it in developing economies, widening the gap between them.", "It raises total GDP but not GDP per capita, because population growth absorbs the gains.", "It raises average incomes, so quality of life rises by the same proportion in every economy that opens up."]),

  mc(94, "Original question",
    "Which of the following best describes the relationship between continuing world economic development and the environment?",
    ["Development raises resource use and emissions, but it also funds green technology and international agreements that can reduce environmental damage.", "Development lowers global emissions overall, because production shifts from developing economies to cleaner advanced economies.", "Development harms the environment mainly in advanced economies, because developing economies produce mostly agricultural goods.", "Development affects the environment only through population growth, not through rising production and consumption."]),

  mc(95, "Original question",
    "A hypothetical developing economy, Country Z, has protected its domestic manufacturing industry behind high tariffs for two decades. The most likely outcome of this import-substitution strategy is",
    ["inefficient domestic firms with little incentive to improve, because they face no foreign competition and cannot achieve economies of scale.", "highly efficient domestic firms that quickly become world-class exporters.", "a rapid rise in exports, because protected firms sell more abroad.", "lower prices for domestic consumers, because protection reduces costs."]),

  mc(96, "Original question",
    "Which of the following development strategies is most directly aimed at raising a country's human capital?",
    ["Increasing investment in education and health.", "Raising tariffs on imported consumer goods.", "Establishing a special economic zone with tax breaks.", "Signing a bilateral free trade agreement."]),

  sa(1, 2, "Abbotsleigh 2021 Trial, Q24(a)",
    "Distinguish between a trade bloc and a monetary union."),

  sa(2, 3, "Abbotsleigh 2021 Trial, Q24(b)",
    "Outline the role of the International Monetary Fund during an international business cycle downswing. Provide a specific example."),

  sa(3, 1, "Abbotsleigh 2023 Trial, Q21(a)",
    "Define ecologically sustainable development."),

  sa(4, 4, "Abbotsleigh 2023 Trial, Q21(b)",
    "For an economy other than Australia, describe ONE impact of globalisation on\nenvironmental sustainability and ONE strategy the country has used to address it."),

  sa(5, 2, "Abbotsleigh 2023 Trial, Q23(a)",
    "Distinguish between subsidies and local content rules."),

  sa(6, 2, "Abbotsleigh 2023 Trial, Q23(b)",
    "Outline TWO impacts of decreased subsidies on the government's budget."),

  sa(7, 2, "Abbotsleigh 2023 Trial, Q24(a)",
    "Outline the role of the IMF in the global economy."),

  sa(8, 1, "Ascham 2018 Trial, Q24(a)",
    "Define the term globalisation."),

  sa(9, 2, "Ascham 2018 Trial, Q24(b)",
    "How has globalisation contributed to changes in the international business cycle?"),

  sa(10, 2, "Ascham 2018 Trial, Q24(c)",
    "Describe TWO economic consequences of an unequal distribution of global income and wealth."),

  sa(11, 5, "Ascham 2018 Trial, Q24(d)",
    "Discuss the factors that cause global inequalities."),

  sa(12, 2, "Barker 2022 Trial, Q21(a)",
    "Outline one contribution of the International Monetary Fund (IMF) to the global economy."),

  sa(13, 3, "Barker 2022 Trial, Q21(b)",
    "Explain how comparative advantage influences the global allocation of resources."),

  sa(14, 5, "Barker 2022 Trial, Q21(c)",
    "With reference to an economy other than Australia, analyse the relationship between economic growth and economic development."),

  sa(15, 2, "Barker 2022 Trial, Q24(a)",
    "Distinguish between local content rules and a quota."),

  sa(16, 2, "Baulkham Hills 2022 Trial, Q22(a)",
    "Outline TWO benefits of free trade."),

  sa(17, 4, "Baulkham Hills 2022 Trial, Q22(b)",
    "For an economy other that Australia, explain how recent changes in the international business cycle have impacted on its economic growth."),

  sa(18, 4, "Baulkham Hills 2022 Trial, Q22(c)",
    "Explain how globalisation has affected the distribution of wealth in the global economy."),

  sa(19, 1, "Baulkham Hills 2023 Trial, Q23(a)",
    "Define Gross World Product."),

  sa(20, 1, "Baulkham Hills 2023 Trial, Q23(b)",
    "Outline ONE contribution of Transnational Corporations to globalisation."),

  sa(21, 3, "Baulkham Hills 2023 Trial, Q23(c)",
    "Briefly explain how ONE international organisation responded to recent changes in the international business cycle."),

  sa(22, 5, "Baulkham Hills 2023 Trial, Q23(d)",
    "For an economy other than Australia, discuss the impact of globalisation on the distribution of income and quality of life."),

  sa(23, 1, "Fort St 2021 Trial, Q4(a)",
    "The table shows selected data for two hypothetical countries.\n\n\nIdentify the type of economy for Country X",
    { svg: dataTable(tableQuestions["s023"]), alt: tableQuestions["s023"].alt }),

  sa(24, 2, "Fort St 2021 Trial, Q4(b)",
    "The table shows selected data for two hypothetical countries.\n\n\nExplain why Country Y has a higher Human Development Index score than Country X,\ndespite a lower income per capita",
    { svg: dataTable(tableQuestions["s024"]), alt: tableQuestions["s024"].alt }),

  sa(25, 3, "Fort St 2021 Trial, Q7(a)",
    "The table shows economic information for three hypothetical economies with flexible exchange rates.\n\n\nIdentify the country that is potentially most vulnerable to a global recession. Justify your choice.",
    { svg: dataTable(tableQuestions["s025"]), alt: tableQuestions["s025"].alt }),

  sa(26, 3, "Fort St 2021 Trial, Q7(b)",
    "The table shows economic information for three hypothetical economies with flexible exchange rates.\n\n\nCountry Y decides to impose a quota on imports to protect domestic employment in a\nparticular industry. Explain why this action might lead to an overall decrease in domestic\nemployment in the country over time.",
    { svg: dataTable(tableQuestions["s026"]), alt: tableQuestions["s026"].alt }),

  sa(27, 1, "James Ruse 2021 Trial, Q21(a)",
    "Consider an economy in which the government implements a tariff of $20 in addition to the\nworld price of $20.\n\nIndicate on the diagram above the change in domestic production.",
    diagrams["s027"]),

  sa(28, 1, "James Ruse 2021 Trial, Q21(b)",
    "Consider an economy in which the government implements a tariff of $20 in addition to the\nworld price of $20.\n\nWhat import quota could the government introduce to have the same effect on domestic output as a $10 tariff?",
    diagrams["s028"]),

  sa(29, 2, "James Ruse 2021 Trial, Q21(c)",
    "Outline ONE reason for protection in an economy."),

  sa(30, 6, "James Ruse 2021 Trial, Q21(d)",
    "Discuss the effects of different protectionist policies on the domestic economy."),

  sa(31, 1, "James Ruse 2021 Trial, Q23(a)",
    "If a country’s HDI moves from 0.784 to 0.692, identify whether economic development has improved or worsened."),

  sa(32, 2, "James Ruse 2021 Trial, Q23(b)",
    "Define the concept of Gross World Product."),

  sa(33, 2, "James Ruse 2021 Trial, Q23(c)",
    "Distinguish between economic growth and economic development."),

  sa(34, 5, "James Ruse 2021 Trial, Q23(d)",
    "Examine how a country other than Australia has used economic policies to improve their economic development."),

  sa(35, 1, "Knox 2024 Trial, Q22(a)",
    "Outline ONE role of the World Trade Organisation that promotes globalisation."),

  sa(36, 4, "Knox 2024 Trial, Q22(b)",
    "Explain TWO global factors that account for the differences that exist between nations."),

  sa(37, 5, "Knox 2024 Trial, Q22(c)",
    "Evaluate strategies used to promote trade and investment in an economy other than Australia."),

  sa(38, 2, "Knox 2025 Trial, Q23(a)",
    "Identify TWO distinguishing characteristics of an advanced economy."),

  sa(39, 2, "Knox 2025 Trial, Q23(b)",
    "What is the economic rationale for free trade?"),

  sa(40, 2, "Knox 2025 Trial, Q23(c)",
    "Why are subsidies considered to be a form of protection?"),

  sa(41, 4, "Knox 2025 Trial, Q23(d)",
    "Assess the impact of international labour migration on different types of economies."),

  sa(42, 2, "Newington 2017 Trial, Q22(a)",
    "Outline one economic effect of a subsidy."),

  sa(43, 4, "Newington 2017 Trial, Q22(c)",
    "Describe how the International Monetary Fund and the World Bank have accelerated global economic development."),

  sa(44, 1, "Newington 2025 Trial, Q22(a)(i)",
    "The diagram below shows the domestic demand and supply for a particular good in an economy.\n\nWhat is the quantity of imports at the world price of $20?",
    diagrams["s044"]),

  sa(45, 1, "Newington 2025 Trial, Q22(a)(ii)",
    "The diagram below shows the domestic demand and supply for a particular good in an economy.\n\nCalculate domestic producer revenue if a subsidy of $20 is introduced",
    diagrams["s045"]),

  sa(46, 3, "Newington 2025 Trial, Q22(b)",
    "Describe the role of ONE international organisation on the global economy"),

  sa(47, 5, "Newington 2025 Trial, Q22(c)",
    "Analyse factors contributing to the difference between emerging and advanced economies."),

  sa(48, 2, "Riverview 2021 Trial, Q3(a)",
    "Outline the impact on domestic prices and gross domestic product where a government reduces a subsidy paid to domestic producers."),

  sa(49, 2, "Riverview 2021 Trial, Q3(b)",
    "How can a country have a higher gross national income PPP per person than another country and have a lower value Human Development Index?"),

  sa(50, 6, "Riverview 2021 Trial, Q3(c)",
    "For an economy other than Australia, assess the influence of globalisation on the economy and the effectiveness of policies in relation to environmental sustainability."),

  sa(51, 2, "Riverview 2024 Trial, Q21(a)",
    "Distinguish between economic growth and economic development."),

  sa(52, 4, "Riverview 2024 Trial, Q21(b)",
    "Explain ONE domestic and ONE global reason for differences in economic development between nations."),

  sa(53, 4, "Riverview 2024 Trial, Q21(c)",
    "Analyse the impact of globalisation on an economy other than Australia."),

  sa(54, 2, "Sydney Boys 2020 Trial, Q23(a)",
    "Define the term economic development."),

  sa(55, 2, "Sydney Boys 2020 Trial, Q23(b)",
    "Outline ONE domestic influence contributing to the differences in development between nations due to the process of globalisation."),

  sa(56, 6, "Sydney Boys 2020 Trial, Q23(c)",
    "Analyse how trade flows and financial flows have promoted global growth."),

  sa(57, 2, "Sydney Boys 2022 Trial, Q21(a)",
    "Outline ONE reason for a country entering into a bilateral trade agreement with a\nmajor trading partner."),

  sa(58, 2, "Sydney Boys 2022 Trial, Q21(b)",
    "Distinguish between a bilateral trade agreement and a multilateral trade agreement."),

  sa(59, 1, "Sydney Boys 2022 Trial, Q22(a)",
    "Outline what is meant by environmental sustainability."),

  sa(60, 4, "Sydney Boys 2022 Trial, Q22(b)",
    "Explain the potential impact on the environment of continuing world economic\ndevelopment in both the short term and long term."),

  sa(61, 2, "Sydney Boys 2025 Trial, Q23(a)",
    "Outline ONE benefit of free trade for Australian consumers."),

  sa(62, 3, "Sydney Boys 2025 Trial, Q23(b)",
    "Distinguish between free trade and protection."),

  sa(63, 2, "Sydney Grammar 2020 Trial, Q24(a)",
    "Outline ONE benefit and ONE cost of using tariffs to protect domestic industries."),

  sa(64, 4, "Sydney Grammar 2020 Trial, Q24(c)",
    "With reference to ONE economy other than Australia, how has the\ngovernment responded to fluctuations in the international business cycle?"),

  sa(65, 2, "Original question",
    "The table shows trade data for a hypothetical economy, Country A, over two years.\n\n\nCalculate the trade-to-GDP ratio for Country A in Year 1 and in Year 2.",
    { svg: dataTable(tableQuestions["s065"]), alt: tableQuestions["s065"].alt }),

  sa(66, 3, "Original question",
    "The table shows trade and financial-flow data for a hypothetical economy, Country B, over three years.\n\n\nUsing the data, explain how the nature of Country B's interdependence with the global economy has changed.",
    { svg: dataTable(tableQuestions["s066"]), alt: tableQuestions["s066"].alt }),

  sa(67, 4, "Original question",
    "The table shows trade and financial-flow data for two hypothetical economies, Country C and Country D, over three years.\n\n\nUsing the data, analyse the extent of interdependence of Country C and Country D with the global economy.",
    { svg: dataTable(tableQuestions["s067"]), alt: tableQuestions["s067"].alt }),

  sa(68, 2, "Original question",
    "Outline the role of the G20 in the global economy."),

  sa(69, 3, "Original question",
    "Distinguish between a government economic forum such as the G20 and an international organisation such as the International Monetary Fund (IMF)."),

  sa(70, 4, "Original question",
    "Assess the influence of the G20 on the global economy, using an example."),

  sa(71, 3, "Original question",
    "Explain ONE development strategy that an economy other than Australia has used to promote economic growth and development."),

  sa(72, 4, "Original question",
    "A hypothetical developing economy, Country E, has a small domestic market, abundant low-cost labour and limited capital. It is considering two strategies: protecting its domestic manufacturing industry behind high tariffs (import substitution), or opening up to foreign direct investment and exporting manufactured goods (export-oriented industrialisation).\n\nEvaluate which strategy is more likely to promote economic growth and development in Country E."),

  sa(73, 2, "Original question",
    "Distinguish between Gross World Product measured at market exchange rates and Gross World Product measured at purchasing power parity."),

].map((q) => ({ ...q, concept: conceptOfQuestionId[q.id] }));

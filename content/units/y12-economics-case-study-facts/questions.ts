import type { Question } from "@/lib/types";

import { mc, sa } from "./build";
import { conceptOfQuestionId } from "./concept-tags";

// PUBLIC — no answer keys here. Forty-one original questions on the HSC Economics Topic 1 case study (China and Nepal),
// written from docs/y12-economics-case-study-facts-research.md only. A short-answer prompt never states a figure or
// year that the question gives a mark for.
export const questions: Question[] = [
  mc(1, "mc-china", "Which statement about China's Belt and Road Initiative is correct?", [
    "It builds trade and infrastructure links with other countries",
    "It is the domestic program that lifts rural households out of poverty",
    "It set up the first four Special Economic Zones on China's coast",
    "It is the plan to upgrade China to high-tech manufacturing",
  ]),

  mc(2, "mc-china", "Which statement about Made in China 2025 is correct?", [
    "Issued in 2015 to upgrade to high-tech manufacturing, with 2025 as the target year",
    "Issued in 2025 to upgrade to high-tech manufacturing, as the first year of the plan",
    "Issued in 2015 to lift poor rural households above the national poverty line",
    "Issued in 2013 to build trade and infrastructure links with other countries",
  ]),

  mc(3, "mc-china", "China approved Special Economic Zones at Shenzhen, Zhuhai, Shantou and Xiamen. Which statement best explains what the zones did?", [
    "Used special incentives to draw foreign investment and export factories to the coast",
    "Kept foreign investment out of the coast so that local factories were protected",
    "Registered each poor rural household and gave it a tailored plan for support",
    "Sent workers overseas so that the money they sent home supported spending",
  ]),

  mc(4, "mc-china", "China's official National Bureau of Statistics (NBS) Gini coefficient is reported as about 0.47. How should it be used with China's World Bank Gini coefficient?", [
    "The two should not be compared, because they are measured on a different basis",
    "The two should be compared to show that inequality rose from one to the other",
    "The two should be compared to show that inequality fell from one to the other",
    "The two should be averaged to give a single Gini coefficient for China",
  ]),

  mc(5, "mc-china", "Which statement about the start of China's targeted poverty alleviation is correct?", [
    "Xi Jinping proposed it at Shibadong village, Hunan, in 2013",
    "Deng Xiaoping proposed it at Shibadong village, Hunan, in 1978",
    "Xi Jinping proposed it in Kazakhstan and Indonesia in 2013",
    "It was issued as part of Made in China 2025 in 2015",
  ]),

  mc(6, "mc-china", "By which year does the case study say China had eradicated extreme poverty?", ["By 2020", "By 1990", "By 2013", "By 2015"]),

  mc(7, "mc-china", "China has started a national emissions trading scheme, beginning with the power sector. Which statement best explains what the scheme does?", [
    "Puts a price on carbon, so that polluters pay for the damage they cause",
    "Pays power producers to emit more carbon, so that output grows faster",
    "Puts a tariff on imports, so that only foreign producers pay for pollution",
    "Earns foreign exchange for China by exporting clean electricity to India",
  ]),

  mc(8, "mc-china", "Which statement about China's average rate of economic growth since reform is correct?", [
    "It has averaged over 9% a year since 1978",
    "It has averaged about 6.1% a year since 1978",
    "It has averaged about 15.2% a year since 1978",
    "It has averaged over 9% a year only since 2013",
  ]),

  mc(9, "mc-nepal", "Which statement about Nepal's graduation from least developed country (LDC) status is correct?", [
    "It has been postponed to 24 Nov 2029",
    "It is still due to happen on 24 Nov 2026",
    "It has already happened, on 24 Nov 2026",
    "It has been brought forward from 2029 to 2026",
  ]),

  mc(10, "mc-nepal", "What does Nepal's figure of 4,120 MW of electricity measure?", [
    "Its total generation capacity from all sources",
    "Its generation capacity from hydropower alone",
    "The electricity it exported to India in one year",
    "The amount of exports it agreed with India",
  ]),

  mc(11, "mc-nepal", "Which statement about income inequality in Nepal, as measured by the World Bank Gini coefficient, is correct?", [
    "It fell, so income became more equally shared",
    "It rose, so income became less equally shared",
    "It fell, so income became less equally shared",
    "It rose, so income became more equally shared",
  ]),

  mc(12, "mc-nepal", "Which statement correctly gives Nepal's poverty rates on the World Bank's two poverty lines (2021 PPP)?", [
    "2.4% lived on under $3.00 a day, and 52.7% on under $8.30 a day",
    "52.7% lived on under $3.00 a day, and 2.4% on under $8.30 a day",
    "0.0% lived on under $3.00 a day, and 15.2% on under $8.30 a day",
    "71.1% lived on under $3.00 a day, and 52.7% on under $8.30 a day",
  ]),

  mc(13, "mc-nepal", "Which statement about the IMF Extended Credit Facility for Nepal is correct?", [
    "The IMF Board approved about US$395.9 million in January 2022",
    "Donors pledged about US$395.9 million for reconstruction in June 2015",
    "The IMF Board approved about US$4.1 bn in June 2015",
    "India agreed to lend about US$395.9 million in January 2024",
  ]),

  mc(14, "mc-nepal", "Which two measures did Nepal introduce in 1992?", [
    "A liberal Industrial Policy and a Foreign Investment and Technology Transfer Act",
    "Entry to the World Trade Organization and an IMF Extended Credit Facility",
    "Four Special Economic Zones and the Belt and Road Initiative",
    "An electricity export agreement with India and a hydropower deal with an Indian firm",
  ]),

  mc(15, "mc-nepal", "Nepal has agreed with India to export electricity. Which statement best explains what this could mean for Nepal?", [
    "It could build up an export and narrow the trade deficit, but relies on one buyer",
    "It could widen the trade deficit, because exporting power adds to Nepal's imports",
    "It could make Nepal a manufacturing base that sells high-tech goods to the world",
    "It could spread sales across many buyers, so Nepal relies on no single country",
  ]),

  mc(16, "mc-nepal", "Which statement best explains the limit the World Bank sees in Nepal's reliance on remittances?", [
    "They are central to growth but have not created quality jobs at home",
    "They have created so many quality jobs that few workers are now informal",
    "They have built up export manufacturing, which has added to pollution",
    "They play little part in growth, because households cannot spend them",
  ]),

  sa(1, "sa-china", 3, "State how China's World Bank Gini coefficient has changed over the period the case study covers, giving both values and both years, and explain what this shows about how the gains have been shared."),

  sa(2, "sa-china", 3, "State how China's GDP per person has changed over the period the case study covers, giving both values and both years, and explain what this shows about living standards."),

  sa(3, "sa-china", 3, "State China's share of the world's carbon dioxide (CO2) emissions in the latest year in the case study, giving the year, and explain what this shows about China's growth and the environment."),

  sa(4, "sa-china", 3, "State how China's Human Development Index (HDI) has changed over the period the case study covers, giving both values and both years, and explain what this shows about development."),

  sa(5, "sa-china", 2, "State when China joined the World Trade Organization (WTO), and explain what membership meant for China's place in the global economy."),

  sa(6, "sa-china", 3, "Using Chinese government figures, state what targeted poverty alleviation had achieved for China's rural poor by the time it finished. Give one figure and the year, and explain what this shows about development or inequality."),

  sa(7, "sa-china", 3, "State China's urban–rural income ratio in the latest year in the case study, giving the year, and explain what this shows about how income is shared."),

  sa(8, "sa-china", 3, "Describe the pledge China made at the UN General Assembly about its carbon dioxide (CO2) emissions, giving both target years and the year the pledge was made, and explain what it shows about China and the environment."),

  sa(9, "sa-nepal", 3, "State how Nepal's remittances, as a share of GDP, have changed over the period the case study covers, giving both values and both years, and explain what this shows."),

  sa(10, "sa-nepal", 3, "State how Nepal's GDP per person has changed over the period the case study covers, giving both values and both years, and explain what this shows about its level of development."),

  sa(11, "sa-nepal", 3, "Give one figure for the cost of Nepal's major earthquake, saying what it measures, and the year the earthquake happened. Explain what this shows about the challenges to Nepal's development."),

  sa(12, "sa-nepal", 3, "State how Nepal's national poverty rate changed between the two Nepal Living Standards Surveys in the case study, giving both values and both survey years, and explain what this shows."),

  sa(13, "sa-nepal", 3, "State Nepal's net inflows of foreign direct investment (FDI) in the latest year in the case study, giving a figure and the year, and explain what this shows about Nepal's growth and development."),

  sa(14, "sa-nepal", 3, "State how tourist arrivals in Nepal changed through the COVID pandemic: give the case study's figures for before the pandemic, for its low point and for the latest year, each with its year, and explain what this shows about tourism."),

  sa(15, "sa-nepal", 3, "State the size of Nepal's trade deficit in the latest financial year in the case study, giving the figure and the financial year, and explain what this shows about Nepal's trade."),

  sa(16, "sa-nepal", 3, "State either how much electricity Nepal exported to India, or what it earned from this, in the latest financial year in the case study. Give the financial year and explain what these exports show for Nepal."),

  sa(17, "sa-both", 3, "Compare the change in the Human Development Index (HDI) in China and Nepal, giving both values and both years for each economy, and explain what the comparison shows about development."),

  sa(18, "sa-both", 3, "Compare how income inequality, measured by the World Bank Gini coefficient, changed in China and Nepal, giving both values and both years for each economy, and explain why the changes differ."),

  sa(19, "sa-both", 3, "Compare recent real GDP growth in China and Nepal, giving each economy's figure with its year or financial year, and explain what the comparison shows about each economy's growth."),

  sa(20, "sa-both", 3, "Compare net inflows of foreign direct investment (FDI) into China and Nepal in the latest year in the case study, giving each economy's figure and year, and explain what the comparison shows."),

  sa(21, "sa-both", 3, "Compare the change in GDP per person in China and Nepal, giving both values and both years for each economy, and explain what the comparison shows about living standards."),

  sa(22, "sa-both", 3, "Write the sentence you would use in an essay about what China's integration into the global economy has meant for poverty. Include a World Bank figure and the length of time it covers, and say what it shows."),

  sa(23, "sa-both", 3, "Write the sentence you would use in an essay on globalisation and the environment, using the change in China's carbon dioxide (CO2) emissions per person. Include both values and both years, and say what the change shows."),

  sa(24, "sa-both", 2, "State when China and when Nepal joined the World Trade Organization (WTO), and compare what membership meant for the two economies."),

  sa(25, "sa-both", 3, "Write the sentence you would use in an essay about how Nepal is linked to the global economy, using Nepal's remittance inflows in the latest financial year in the case study. Include the figure and the financial year, and say what it shows."),
].map((q) => ({ ...q, concept: conceptOfQuestionId[q.id] }));

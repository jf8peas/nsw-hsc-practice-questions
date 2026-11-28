import type { AnswerSet } from "@/lib/types";

import { withWrongExplanations } from "../../explanation-helpers";
import { U } from "./build";
import { explanations } from "./explanations";
import { questions } from "./questions";

// Answer key for y12-economics-case-study-facts. NO "server-only" import here (the validator reads it); only
// re-exported via content/answers/index.ts, which is server-only. Never import from a client component.
// `factIds` names the rows of docs/y12-economics-case-study-facts-research.md that a question tests. Notes are shown
// to the student under the model answer and are also the marker's guidance.

const keys: AnswerSet = {
  [`${U}.m01`]: { correctText: "It builds trade and infrastructure links with other countries", rubric: ["The Belt and Road Initiative, proposed in autumn 2013, builds international trade and infrastructure links and is not a rural program (Source S4)."], factIds: ["C04", "C19"] },
  [`${U}.m02`]: { correctText: "Issued in 2015 to upgrade to high-tech manufacturing, with 2025 as the target year", rubric: ["Made in China 2025 was issued on 8 May 2015 to upgrade to high-tech manufacturing, and 2025 is its target year (Source S5)."], factIds: ["C05"] },
  [`${U}.m03`]: { correctText: "Used special incentives to draw foreign investment and export factories to the coast", rubric: ["The four Special Economic Zones, approved on 26 Aug 1980, used special incentives to draw foreign investment and export factories to the coast (Source S2)."], factIds: ["C02"] },
  [`${U}.m04`]: { correctText: "The two should not be compared, because they are measured on a different basis", rubric: ["The official NBS Gini (a secondary figure) and the World Bank Gini are measured on a different basis and must never be compared (Source S8)."], factIds: ["C24", "C25"] },
  [`${U}.m05`]: { correctText: "Xi Jinping proposed it at Shibadong village, Hunan, in 2013", rubric: ["Xi Jinping proposed targeted poverty alleviation at Shibadong village, Hunan, on 3 Nov 2013 (Source S11)."], factIds: ["C19"] },
  [`${U}.m06`]: { correctText: "By 2020", rubric: ["China had eradicated extreme poverty by 2020 (Source S6)."], factIds: ["C16"] },
  [`${U}.m07`]: { correctText: "Puts a price on carbon, so that polluters pay for the damage they cause", rubric: ["China's national emissions trading scheme, started on 16 Jul 2021 in the power sector, puts a price on carbon so that polluters pay (Source S17)."], factIds: ["C30"] },
  [`${U}.m08`]: { correctText: "It has averaged over 9% a year since 1978", rubric: ["China's economic growth has averaged over 9% a year since 1978 (Source S6)."], factIds: ["C06"] },
  [`${U}.m09`]: { correctText: "It has been postponed to 24 Nov 2029", rubric: ["Nepal's LDC graduation, originally due on 24 Nov 2026, was postponed to 24 Nov 2029 (Source S26)."], factIds: ["N09"] },
  [`${U}.m10`]: { correctText: "Its total generation capacity from all sources", rubric: ["Nepal's 4,120 MW is its total generation capacity from all sources in FY2025/26 (Source S31)."], factIds: ["N25"] },
  [`${U}.m11`]: { correctText: "It fell, so income became more equally shared", rubric: ["Nepal's World Bank Gini coefficient fell, so income inequality fell (Source S8)."], factIds: ["N23"] },
  [`${U}.m12`]: { correctText: "2.4% lived on under $3.00 a day, and 52.7% on under $8.30 a day", rubric: ["In 2022, 2.4% of people in Nepal lived on under $3.00 a day and 52.7% on under $8.30 a day, on 2021 PPP lines (Source S8)."], factIds: ["N21", "N22"] },
  [`${U}.m13`]: { correctText: "The IMF Board approved about US$395.9 million in January 2022", rubric: ["The IMF Board approved an Extended Credit Facility of about US$395.9 million for Nepal on 12 Jan 2022 (Source S24)."], factIds: ["N07"] },
  [`${U}.m14`]: { correctText: "A liberal Industrial Policy and a Foreign Investment and Technology Transfer Act", rubric: ["In 1992 Nepal introduced a new liberal Industrial Policy and the Foreign Investment and Technology Transfer Act (Source S19)."], factIds: ["N02"] },
  [`${U}.m15`]: { correctText: "It could build up an export and narrow the trade deficit, but relies on one buyer", rubric: ["The agreement of 4 Jan 2024 with India could build up electricity exports and narrow the trade deficit, but ties Nepal to a single buyer (Source S25)."], factIds: ["N08"] },
  [`${U}.m16`]: { correctText: "They are central to growth but have not created quality jobs at home", rubric: ["The World Bank says remittances are central to growth but have not created quality jobs at home (Source S28)."], factIds: ["N17"] },
  [`${U}.m17`]: { correctText: "In 2018 the US added 25% tariffs on about US$34 bn of Chinese goods", rubric: ["The first US tariffs of the US–China trade war, 25% on about US$34 bn of Chinese goods, came on 6 Jul 2018 (Source S33)."], factIds: ["C32"] },
  [`${U}.m18`]: { correctText: "It ran from 1996 to 2006 and was ended by the Comprehensive Peace Accord", rubric: ["Nepal's Maoist civil war ran from 1996 to 2006, killed more than 13,000 people and was ended by the Comprehensive Peace Accord on 21 Nov 2006 (Source S35)."], factIds: ["N27"] },

  [`${U}.s01`]: {
    modelAnswer: "China's World Bank Gini coefficient rose from 32.2 in 1990 to 36.0 in 2022. Growth was uneven, with coastal, urban and skilled workers gaining most, so income became more unequally shared.",
    rubric: [
      "Figure: the World Bank Gini rose from 32.2 to 36.0 (both values).",
      "Period: from 1990 to 2022 (both years).",
      "What it shows: growth was uneven (coastal, urban and skilled workers gained most), so income inequality increased.",
    ],
    notes: "Give both values for the first mark and both years for the second: one end on its own earns neither. Rounding to about 32 and 36 is fine, and a day or month is never needed. A fall instead of a rise, Nepal's figures, or China's official NBS Gini (a different measure) earn no figure mark. The mark is for the case study's World Bank values (or accepted roundings above); different values from another source do not earn it. For the last mark, say what the rise shows: growth was uneven, with coastal, urban and skilled workers gaining most, so inequality increased. Another point the case study supports, such as the Lorenz curve moving away from the line of equality, also earns it. Only saying the numbers again, or saying inequality fell, does not.",
    factIds: ["C24"],
  },
  [`${U}.s02`]: {
    modelAnswer: "China's GDP per person rose from US$318 in 1990 to US$13,862 in 2025. Average income rose greatly as the economy grew, so material living standards improved, which is part of economic development.",
    rubric: [
      "Figure: GDP per person rose from US$318 to US$13,862 (both values).",
      "Period: from 1990 to 2025 (both years).",
      "What it shows: average incomes rose greatly, so living standards improved as the economy grew.",
    ],
    notes: "Give both values for the first mark and both years for the second: one end on its own earns neither. Accept about US$320 for the first value and about US$14,000 or about US$13,900 for the second. A day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Nepal's figures, or a fall instead of a rise, earn no figure mark. For the last mark, say what the rise shows: average incomes rose greatly, so living standards improved. Another point the case study supports, such as strong economic growth over a long period, also earns it. Only saying the numbers again, or saying incomes fell, does not.",
    factIds: ["C08"],
  },
  [`${U}.s03`]: {
    modelAnswer: "In 2025 China produced about 32% of the world's CO2 emissions, 12.4 billion tonnes. Rapid, energy-hungry industrial growth, boosted by exports, made China the world's largest emitter, a negative externality of globalisation.",
    rubric: [
      "Figure: about 32% of the world total.",
      "Period: in 2025.",
      "What it shows: rapid, energy-hungry industrial growth, boosted by exports, made China the world's largest emitter, a negative externality of globalisation (an environmental cost of growth).",
    ],
    notes: "Accept \"about 32%\" or \"about a third\" for the share. The total in tonnes is extra detail and is not needed. You need the year 2025 for the second mark; a day or month is never needed. The mark is for the case study's share (or an accepted rounding above); a different share from another source does not earn it. Another country's figure earns no figure mark. For the last mark, say what it shows: rapid, energy-hungry industrial growth, boosted by exports, made China the world's largest emitter, a negative externality of globalisation (a cost that falls on others). Another point the case study supports, such as an environmental cost of rapid growth, also earns it. Only saying the share again, or saying China's growth has had no environmental cost, does not.",
    factIds: ["C27"],
  },
  [`${U}.s04`]: {
    modelAnswer: "China's HDI rose from 0.491 in 1990 to 0.797 in 2023, when it ranked 78 of 193. This shows gains in health, education and income, not just GDP, so growth turned into development.",
    rubric: [
      "Figure: the HDI rose from 0.491 to 0.797 (both values; the rank is not needed).",
      "Period: from 1990 to 2023 (both years).",
      "What it shows: health, education and income improved, not just GDP, so growth turned into development.",
    ],
    notes: "Give both values for the first mark and both years for the second: one end on its own earns neither. Accept about 0.49 and about 0.80. The rank is not needed, and a day or month is never needed. The mark is for the case study's China values (or accepted roundings above); different values from another source do not earn it. Nepal's HDI, or a fall instead of a rise, earns no figure mark. For the last mark, say what the rise shows: health, education and income improved, so growth turned into development. Another point the case study supports, such as better living standards, also earns it. Only saying the numbers again, or saying development went backwards, does not.",
    factIds: ["C13"],
  },
  [`${U}.s05`]: {
    modelAnswer: "China joined the World Trade Organization on 11 Dec 2001. Lower tariffs and secure access to world markets turned China into a manufacturing base for the world, although this also brought emissions and competition for domestic firms.",
    rubric: [
      "Event and year: China joined the World Trade Organization in 2001.",
      "What it shows: lower tariffs and secure access to world markets turned China into a manufacturing base for the world.",
    ],
    notes: "The year 2001 earns the first mark; the day and month are never needed. The mark is for the case study's year; a different year from another source does not earn it. The year Nepal joined earns nothing for this part. For the second mark, say what membership did: lower tariffs and secure access to world markets turned China into a manufacturing base for the world. Another point the case study supports, such as higher exports and foreign investment helping growth, or competition for domestic firms, also earns it. Only saying again that China joined, or saying membership cut China off from world markets, does not.",
    factIds: ["C03"],
  },
  [`${U}.s06`]: {
    modelAnswer: "According to Chinese government figures, China's rural poverty rate, measured against the national poverty line, fell from 10.2% at the end of 2012 to zero by the end of 2020, as the last 98.99 million rural poor were lifted out. This shows the government had to act to spread the gains from globalisation to rural areas that export-led growth had left behind.",
    rubric: [
      "Figure: the rural poverty rate on China's national poverty line fell from 10.2% to zero (both values; or the last 98.99 million rural poor lifted out, all 832 poor counties, or 128,000 poor villages, removed from the list).",
      "Period: from the end of 2012 to the end of 2020 (both years).",
      "What it shows: the government had to act to spread globalisation's gains to rural areas that growth had left behind.",
    ],
    notes: "For the first mark give both values of the rural poverty rate, 10.2% (about 10%) and zero: one value on its own does not earn it. One of these earns the first mark instead: the last 98.99 million rural poor (about 99 million, or nearly 100 million), all 832 poor counties, or 128,000 poor villages. These are Chinese government figures measured against China's national poverty line, not a World Bank line. The second mark needs both years, 2012 and 2020 (the end of each), whichever figure you give: one year on its own does not earn it, and a day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Another country's figure earns nothing, and the World Bank's figures on China's poverty are different facts. For the last mark, say what it shows: the government had to act to spread globalisation's gains to rural areas left behind. Another point the case study supports, such as support aimed at lasting income for each poor household instead of one-off handouts, also earns it. Only saying the figures again, or saying the program left rural people poorer, does not.",
    factIds: ["C20"],
  },
  [`${U}.s07`]: {
    modelAnswer: "In 2025 China's urban–rural income ratio was 2.31: income per person was about US$7,910 (56,502 yuan) in urban areas and about US$3,424 (24,456 yuan) in rural areas. Urban households earn far more than rural ones, so a large gap in income remains.",
    rubric: [
      "Figure: an urban–rural income ratio of 2.31 (or urban about US$7,910 against rural about US$3,424 per person; 56,502 against 24,456 yuan).",
      "Period: in 2025.",
      "What it shows: urban households earn far more than rural ones, so income is still very unequally shared between city and countryside.",
    ],
    notes: "Accept the ratio 2.31 (or about 2.3), or both incomes per person in either currency: about US$7,910 urban and about US$3,424 rural (about US$7,900 and about US$3,400), or about 56,500 yuan urban and about 24,500 yuan rural. A US dollar figure of the wrong size, such as an income given in millions or billions, earns nothing. You need the year 2025 for the second mark; a day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Another country's figure earns no figure mark. For the last mark, say what it shows: a large income gap remains between urban and rural households. Another point the case study supports, such as growth having been concentrated in the coastal cities, also earns it. Only saying the ratio or the two incomes again, or saying rural households earn more, does not.",
    factIds: ["C26"],
  },
  [`${U}.s08`]: {
    modelAnswer: "On 22 Sep 2020, at the UN General Assembly, China pledged that its CO2 emissions would peak before 2030 and that it would be carbon neutral before 2060. This commits China to cutting emissions while still growing, a test of whether growth and sustainability can be balanced.",
    rubric: [
      "Pledge: CO2 emissions to peak before 2030 and carbon neutrality before 2060 (both targets).",
      "Year: the pledge was made in 2020.",
      "What it shows: China has committed to cutting emissions while still growing, a test of balancing growth and sustainability.",
    ],
    notes: "For the first mark give both parts of the pledge: CO2 emissions to peak before 2030 and carbon neutrality before 2060 (\"by\" is accepted for \"before\"). The second mark needs the year the pledge was made, 2020; the day and month are never needed. The marks are for the case study's years; different years from another source do not earn them. Either target year on its own is not the year of the pledge, and another country's pledge earns nothing. For the last mark, say what it shows: China is committed to cutting emissions while still growing, which tests whether growth and sustainability can be balanced. Another point the case study supports, such as a response to the environmental cost of China's growth, also earns it. Only saying the pledge again, or saying China pledged to raise emissions without limit, does not.",
    factIds: ["C29"],
  },
  [`${U}.s09`]: {
    modelAnswer: "Nepal's remittances rose from 1.5% of GDP in 1993 to 32.3% of GDP in 2025. Exporting labour is Nepal's main link to the global economy, and the money sent home supports household spending and reduces poverty.",
    rubric: [
      "Figure: remittances rose from 1.5% to 32.3% of GDP (both values).",
      "Period: from 1993 to 2025 (both years).",
      "What it shows: exporting labour is Nepal's main link to the global economy, and remittances support household spending and cut poverty.",
    ],
    notes: "Give both values for the first mark and both years for the second: one end on its own earns neither. Accept about 1.5% and about 32% or about a third. A day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. A fall instead of a rise, or another country's figure, earns no figure mark. For the last mark, say what the rise shows: remittances support household spending and cut poverty, or exporting labour is now Nepal's main link to the global economy. Another point the case study supports, such as remittances helping to pay for the trade deficit, also earns it. Only saying the numbers again, or saying remittances became less important, does not.",
    factIds: ["N15"],
  },
  [`${U}.s10`]: {
    modelAnswer: "Nepal's GDP per person rose from US$186 in 1990 to US$1,536 in 2025. Average income rose but remains low, so Nepal is still a developing economy.",
    rubric: [
      "Figure: GDP per person rose from US$186 to US$1,536 (both values).",
      "Period: from 1990 to 2025 (both years).",
      "What it shows: average income rose but remains low, so Nepal is still a developing economy.",
    ],
    notes: "Give both values for the first mark and both years for the second: one end on its own earns neither. Accept about US$190 and about US$1,500. A day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. China's figures, or a fall instead of a rise, earn no figure mark. For the last mark, say what it shows: income rose but is still low, so Nepal remains a developing economy. Another point the case study supports, such as economic growth raising material living standards, also earns it. Only saying the numbers again, or saying incomes fell, does not.",
    factIds: ["N10"],
  },
  [`${U}.s11`]: {
    modelAnswer: "The earthquake of April–May 2015 caused US$5.15 bn of damage and US$1.9 bn of losses, and recovery needed US$6.6 bn, about a third of the economy. It was a huge shock for a small economy: it destroyed homes and infrastructure and left Nepal reliant on foreign aid to rebuild.",
    rubric: [
      "Figure: damage of US$5.15 bn, losses of US$1.9 bn, or recovery needs of US$6.6 bn (about a third of the economy), with what it measures.",
      "Period: 2015.",
      "What it shows: a huge shock for a small economy that destroyed homes and infrastructure and left Nepal reliant on foreign aid to rebuild.",
    ],
    notes: "One figure, correctly labelled, earns the first mark: damage US$5.15 bn (about US$5 bn), losses US$1.9 bn (about US$2 bn), or recovery needs US$6.6 bn or about a third of the economy. The year 2015 earns the second mark; a day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. A figure with the wrong label, or for another country, earns no figure mark. The donors' pledge is a different fact. For the last mark, say what it shows: a huge shock to a small economy that destroyed homes and infrastructure and made Nepal rely on foreign aid. Another point the case study supports, such as dependence on international organisations in a crisis, also earns it. Only saying the figure again, or saying the earthquake helped development, does not.",
    factIds: ["N04"],
  },
  [`${U}.s12`]: {
    modelAnswer: "Nepal's national poverty rate fell from about 42% in 1995-96 to about 20% in 2022-23, according to its Living Standards Surveys. This is evidence that Nepal's integration into the global economy, especially through remittances, improved living standards.",
    rubric: [
      "Figure: the national poverty rate fell from about 42% to about 20% (both values).",
      "Period: from 1995-96 to 2022-23 (both survey years).",
      "What it shows: Nepal's integration, especially through remittances, improved living standards.",
    ],
    notes: "Give both values for the first mark and both survey years for the second: one end on its own earns neither. Accept about 42% or about 40% for the earlier rate, and about 20% or about a fifth for the later one. Write the survey years as 1995-96 and 2022-23 (or 1995/96 and 2022/23); a single calendar year is not enough, and a day or month is never needed. The mark is for the case study's national figures (or accepted roundings above); different figures from another source do not earn it. The World Bank's poverty lines are a different measure. A rise instead of a fall, or another country's figure, earns no figure mark. For the last mark, say what the fall shows: living standards improved, helped especially by remittances. Another point the case study supports, such as progress in development, also earns it. Only saying the numbers again, or saying poverty rose, does not.",
    factIds: ["N20"],
  },
  [`${U}.s13`]: {
    modelAnswer: "In 2025 Nepal's net FDI inflows were only US$43.5 million, 0.10% of GDP. Foreign investment is very low, so Nepal gets little capital, technology and job creation from abroad.",
    rubric: [
      "Figure: net FDI inflows of US$43.5 million (or 0.10% of GDP).",
      "Period: in 2025.",
      "What it shows: low foreign investment means little capital, technology and job creation from abroad.",
    ],
    notes: "Accept US$43.5 million (about US$44 million) or 0.10% of GDP (about 0.1%). You need the year 2025 for the second mark; a day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. China's figure, or US$43.5 bn instead of million, earns no figure mark. For the last mark, say what it shows: Nepal gets little capital, technology and job creation from abroad. Another point the case study supports, such as low investment limiting economic growth, also earns it. Only saying the figure again, or saying Nepal attracts a great deal of foreign investment, does not.",
    factIds: ["N18"],
  },
  [`${U}.s14`]: {
    modelAnswer: "Tourist arrivals in Nepal fell from 1,197,191 in 2019 to 230,085 in 2020 during COVID, then recovered to 1,162,365 in 2025. Tourism is a key source of foreign exchange and jobs, but it is highly vulnerable to global shocks such as the pandemic.",
    rubric: [
      "Figure: arrivals of 1,197,191, then 230,085, then 1,162,365 (all three).",
      "Period: 2019, 2020 and 2025 (all three years).",
      "What it shows: tourism is a key source of foreign exchange and jobs but is highly vulnerable to global shocks such as the pandemic.",
    ],
    notes: "All three figures earn the first mark and all three years the second; leaving one out earns neither mark for that part. Accept about 1,200,000, about 230,000 and about 1,160,000. A day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Another country's figure earns nothing, and the changes must run the right way: a sharp fall and then a recovery. For the last mark, say what it shows: tourism brings foreign exchange and jobs but is very exposed to global shocks. Another point the case study supports, such as the risk of relying on a sector that depends on the rest of the world, also earns it. Only saying the numbers again, or saying tourism was unaffected by the pandemic, does not.",
    factIds: ["N24"],
  },
  [`${U}.s15`]: {
    modelAnswer: "In FY2025/26 Nepal's trade deficit was about US$12.2 bn (Rs 1,781.09 bn). Imports far exceed exports, a sign of a narrow export base, and remittances help to finance the gap.",
    rubric: [
      "Figure: a trade deficit of about US$12.2 bn (Rs 1,781.09 bn).",
      "Period: FY2025/26 (also written 2025/26).",
      "What it shows: imports far exceed exports, a sign of a narrow export base, with remittances helping to finance the gap.",
    ],
    notes: "Accept the deficit in either currency: about US$12.2 bn (or about US$12 bn), or Rs 1,781.09 bn, about Rs 1,780 bn or about Rs 1,800 bn. A US dollar figure of the wrong size (million instead of bn) earns nothing. You need the financial year, FY2025/26 or 2025/26, for the second mark; a single calendar year is not enough, and a day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Calling it a surplus, or giving China's trade figures, earns no figure mark. For the last mark, say what it shows: imports far exceed exports because the export base is narrow, or remittances help to finance the gap. Another point the case study supports, such as a lack of competitive export industries, also earns it. Only saying the figure again, or saying Nepal exports more than it imports, does not.",
    factIds: ["N13"],
  },
  [`${U}.s16`]: {
    modelAnswer: "In FY2025/26 Nepal exported about 3,965 GWh of electricity to India, earning about US$201 million (NRs 29.31 bn). These electricity exports are promising for Nepal: they earn foreign exchange and supply clean energy to the region.",
    rubric: [
      "Figure: about 3,965 GWh exported to India, or about US$201 million (NRs 29.31 bn) earned.",
      "Period: FY2025/26 (also written 2025/26).",
      "What it shows: electricity is a promising export that earns foreign exchange and supplies clean energy to the region.",
    ],
    notes: "One figure earns the first mark: about 3,965 GWh (about 4,000 GWh), or the earnings in either currency, about US$201 million (about US$200 million) or NRs 29.31 bn (about NRs 29 bn), with its unit. A US dollar figure of the wrong size (bn instead of million) earns nothing. You need the financial year, FY2025/26 or 2025/26, for the second mark; a single calendar year is not enough, and a day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Another country's figure earns nothing, and the generation capacity in MW and the agreement with India are different facts. For the last mark, say what it shows: electricity is a promising export that earns foreign exchange and supplies clean energy to the region. Another point the case study supports, such as helping to narrow the trade deficit, also earns it. Only saying the figure again, or saying Nepal only imports electricity, does not.",
    factIds: ["N26"],
  },
  [`${U}.s17`]: {
    modelAnswer: "China's HDI rose from 0.491 in 1990 to 0.797 in 2023, while Nepal's rose from 0.404 in 1990 to 0.622 in 2023. Both made gains in human development, and China reached the higher level; China's growth turned into better health, education and income, while Nepal's progress was helped by remittances.",
    rubric: [
      "Figure: China's HDI rose from 0.491 to 0.797 and Nepal's from 0.404 to 0.622.",
      "Period: 1990 to 2023 for each economy.",
      "What it shows: both economies became more developed and China reached the higher level (China's growth turned into development; Nepal was helped by remittances).",
    ],
    notes: "The first mark needs both values for both economies, and the second needs both years for each: one economy alone, or one end of a change, earns neither. Accept about 0.49 and 0.80 for China, and about 0.40 and 0.62 for Nepal. A day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Swapping the two economies, or showing a fall, earns no figure mark. For the last mark, say what the comparison shows: both developed, with China at the higher level. Another point the case study supports, such as remittances helping Nepal's development, also earns it. Only saying the numbers again, or saying either economy's development went backwards, does not.",
    factIds: ["C13", "N19"],
  },
  [`${U}.s18`]: {
    modelAnswer: "China's World Bank Gini coefficient rose from 32.2 in 1990 to 36.0 in 2022, while Nepal's fell from 35.2 in 1995 to 30.0 in 2022. Inequality rose in China, where coastal, urban and skilled workers gained most, but fell in Nepal, where remittances flow straight to ordinary households, including poor rural ones.",
    rubric: [
      "Figure: China's Gini rose from 32.2 to 36.0 and Nepal's fell from 35.2 to 30.0.",
      "Period: China 1990 to 2022 and Nepal 1995 to 2022.",
      "What it shows: inequality rose in China (coastal, urban and skilled workers gained most) but fell in Nepal (remittances reach ordinary households).",
    ],
    notes: "The first mark needs both values for both economies, and the second needs each economy's own two years: one economy alone, or one end of a change, earns neither. Accept about 32 and 36 for China, and about 35 and 30 for Nepal. A day or month is never needed. The mark is for the case study's World Bank values (or accepted roundings above); different values from another source do not earn it. China's official NBS Gini is a different measure. A wrong direction, or swapped economies, earns no figure mark. For the last mark, say why the changes differ: in China growth favoured coastal, urban and skilled workers, while in Nepal remittances reach ordinary households. Another point the case study supports, such as China's Lorenz curve moving away from the line of equality while Nepal's moves closer, also earns it. Only saying the numbers again, or saying inequality fell in China or rose in Nepal, does not.",
    factIds: ["C24", "N23"],
  },
  [`${U}.s19`]: {
    modelAnswer: "China's real GDP grew 5.0% in 2025, while Nepal's grew about 4.4% in FY2024/25. China's growth is still strong for an economy of its size, whereas Nepal's moderate growth relies on spending funded by remittances more than on investment or exports.",
    rubric: [
      "Figure: China 5.0% and Nepal about 4.4% (or Nepal's estimated 3.85%).",
      "Period: China 2025, and Nepal FY2024/25 for about 4.4% (FY2025/26 for the estimated 3.85%).",
      "What it shows: China's growth is still strong for its size, while Nepal's is moderate and relies on remittance-funded spending more than investment or exports.",
    ],
    notes: "The first mark needs a figure for both economies and the second needs both periods: one economy alone earns neither. For China give 5.0% (5% is fine) in 2025. For Nepal give about 4.4% in FY2024/25, or the estimated 3.85% in FY2025/26; the figure and the financial year must match, and a single calendar year is not enough. A day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Swapping the economies earns no figure mark. For the last mark, say what the comparison shows: China's growth is still strong for its size, while Nepal's is moderate and leans on remittance-funded spending. Another point the case study supports, such as low investment limiting Nepal's growth, also earns it. Only saying the numbers again, or saying China's economy shrank, does not.",
    factIds: ["C07", "N11"],
  },
  [`${U}.s20`]: {
    modelAnswer: "In 2025 China received net FDI inflows of US$79.98 bn, while Nepal received only US$43.5 million, 0.10% of GDP. Foreign firms brought China capital, technology and management skills that raised productivity, whereas Nepal's low foreign investment means little capital, technology and job creation from abroad.",
    rubric: [
      "Figure: China US$79.98 bn and Nepal US$43.5 million (or 0.10% of GDP).",
      "Period: 2025 for both economies.",
      "What it shows: foreign investment has brought China capital, technology and skills, while Nepal's low inflows bring little capital, technology or jobs.",
    ],
    notes: "The first mark needs a figure for both economies and the second the year for both (saying \"both in 2025\" is enough): one economy alone earns neither. Accept about US$80 bn for China, and about US$44 million or about 0.1% of GDP for Nepal. A day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Mixing up bn and million, or swapping the economies, earns no figure mark. For the last mark, say what the comparison shows: China has gained far more capital, technology and skills from foreign firms than Nepal. Another point the case study supports, such as foreign investment shifting China's production possibility frontier outward, also earns it. Only saying the numbers again, or saying Nepal receives more than China, does not.",
    factIds: ["C11", "N18"],
  },
  [`${U}.s21`]: {
    modelAnswer: "China's GDP per person rose from US$318 in 1990 to US$13,862 in 2025, while Nepal's rose from US$186 in 1990 to US$1,536 in 2025. Average income rose in both, but far more in China; in Nepal it remains low, so Nepal is still a developing economy.",
    rubric: [
      "Figure: China rose from US$318 to US$13,862 and Nepal from US$186 to US$1,536.",
      "Period: 1990 to 2025 for each economy.",
      "What it shows: living standards, measured by average income, rose far more in China, while Nepal's income remains low.",
    ],
    notes: "The first mark needs both values for both economies, and the second needs both years for each: one economy alone, or one end of a change, earns neither. Accept about US$320 and US$14,000 for China, and about US$190 and US$1,500 for Nepal. A day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Swapping the economies, or showing a fall, earns no figure mark. For the last mark, say what the comparison shows: average income rose far more in China, and Nepal is still a developing economy with low income. Another point the case study supports, such as both economies growing and raising material living standards, also earns it. Only saying the numbers again, or saying Nepal's income is now higher than China's, does not.",
    factIds: ["C08", "N10"],
  },
  [`${U}.s22`]: {
    modelAnswer: "As China integrated into world markets under the Open Door Policy (reform and opening-up), the share of its population living in extreme poverty ($3.00 a day, World Bank measure) fell from 83.1% in 1990 to 0.0% in 2022, a major development gain linked to globalisation that counters the argument that globalisation only harmed China.",
    rubric: [
      "Figure: the share of the population in extreme poverty ($3.00 a day) fell from 83.1% to 0.0% (both shares; close to 800 million people lifted out of poverty is also accepted).",
      "Period: from 1990 to 2022 (both years; over 40 years if the 800 million figure is used instead).",
      "What it shows: a major development gain linked to globalisation, which counters the argument that globalisation only harmed China.",
    ],
    notes: "For the first mark give both shares of the population in extreme poverty, 83.1% (about 83% or about 80%) and 0.0% (zero, or almost zero): one share on its own does not earn it. The second mark needs both years, 1990 and 2022: one year on its own does not earn it, and a day or month is never needed. You may also give close to, nearly or about 800 million people lifted out of poverty. Used instead of the shares, it earns the first mark, and its length of time, over 40 years (or four decades), earns the second. The mark is for the case study's World Bank figures (or accepted roundings above); different figures from another source do not earn it. The Chinese government's rural poverty figures are a different measure. A rise in poverty, or another country's figure, earns no figure mark. For the last mark, say what it shows: a major development gain linked to globalisation. Another point the case study supports, such as the Open Door Policy (reform and opening-up, either name is accepted) ending a closed, centrally planned economy, or China making close to three-quarters of the world's poverty reduction, also earns it. Only saying the figures again, or saying globalisation raised poverty, does not.",
    factIds: ["C01", "C14", "C15"],
  },
  [`${U}.s23`]: {
    modelAnswer: "China's CO2 emissions per person rose from 2.13 t in 1990 to 9.32 t in 2024, showing that emissions rose with living standards, not just with population: an environmental cost of rising incomes.",
    rubric: [
      "Figure: CO2 emissions per person rose from 2.13 t to 9.32 t (both values).",
      "Period: from 1990 to 2024 (both years).",
      "What it shows: emissions rose with living standards, not just population, an environmental cost of rising incomes.",
    ],
    notes: "Give both values for the first mark and both years for the second: one end on its own earns neither. Accept about 2.1 t and about 9.3 t. A day or month is never needed. The mark is for the case study's per person values (or accepted roundings above); different values from another source do not earn it. China's total emissions are a different fact. A fall instead of a rise earns no figure mark. For the last mark, say what the rise shows: emissions rose with living standards, an environmental cost of rising incomes. Another point the case study supports, such as pollution being a negative externality of growth, also earns it. Only saying the numbers again, or saying emissions per person fell, does not.",
    factIds: ["C28"],
  },
  [`${U}.s24`]: {
    modelAnswer: "China joined the World Trade Organization on 11 Dec 2001 and Nepal on 23 Apr 2004. Membership and access to world markets turned China into a manufacturing base for the world, while Nepal also gained access but had few competitive exports to sell.",
    rubric: [
      "Events and years: China joined in 2001 and Nepal in 2004 (both).",
      "What it shows: access to world markets turned China into a manufacturing base, while Nepal had few competitive exports to sell.",
    ],
    notes: "The first mark needs both years, 2001 for China and 2004 for Nepal; one economy alone, or the years swapped, earns nothing for this part. A day or month is never needed. The mark is for the case study's years; different years from another source do not earn it. For the second mark, compare what membership meant: China became a manufacturing base for the world, while Nepal had few competitive exports to sell. Another point the case study supports, such as lower tariffs bringing more competition for domestic firms, also earns it. Only saying again that both joined, or saying membership cut either economy off from world markets, does not.",
    factIds: ["C03", "N03"],
  },
  [`${U}.s25`]: {
    modelAnswer: "In FY2025/26 Nepal received remittance inflows of US$16.19 bn, which shows that exporting labour is Nepal's main link to the global economy, with the money sent home supporting household spending and cutting poverty.",
    rubric: [
      "Figure: remittance inflows of US$16.19 bn (the 28.1% rise is not needed).",
      "Period: FY2025/26 (also written 2025/26).",
      "What it shows: exporting labour is Nepal's main link to the global economy, and remittances support household spending and cut poverty.",
    ],
    notes: "Accept US$16.19 bn, about US$16.2 bn or about US$16 bn. The 28.1% rise is not needed. You need the financial year, FY2025/26 or 2025/26, for the second mark; a single calendar year is not enough, and a day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Remittances as a share of GDP are a different fact, and another country's figure, or millions instead of billions, earns no figure mark. For the last mark, say what it shows: exporting labour is Nepal's main link to the global economy, or remittances support household spending and cut poverty. Another point the case study supports, such as the World Bank's caveat that remittances have not created quality jobs at home, also earns it. Only saying the figure again, or saying remittances matter little to Nepal, does not.",
    factIds: ["N16"],
  },
  [`${U}.s26`]: {
    modelAnswer: "China's real GDP growth fell to 2.3% in 2020 and 3.1% in 2022 during COVID-19 lockdowns. This shows that growth can be hit by domestic policy shocks as well as global ones, because strict lockdowns cut output and incomes.",
    rubric: [
      "Figure: real GDP growth of 2.3% and 3.1% (both rates).",
      "Period: 2020 for 2.3% and 2022 for 3.1% (both years, each with its own rate).",
      "What it shows: strict lockdowns cut output and incomes, so growth can be hit by domestic policy shocks as well as global ones.",
    ],
    notes: "Give both growth rates for the first mark and both years for the second: one on its own earns neither. For either year, a rate up to a tenth of a percentage point below the case study's is also accepted, because China's own official figures differ by about that much. For the second mark each year must go with its own rate, so swapping them does not earn it. A day or month is never needed. The mark is for the case study's figures (or ones within that tenth); other figures from another source do not earn it. China's average growth and its latest growth are different facts, and another country's figure earns no figure mark. For the last mark, say what the fall shows: growth can be hit by domestic policy shocks as well as global ones. Another point the case study supports, such as strict lockdowns cutting output and incomes, also earns it. Only saying the figures again, or saying the lockdowns speeded up China's growth, does not.",
    factIds: ["C34"],
  },
  [`${U}.s27`]: {
    modelAnswer: "In 2025 China's population fell by 3.39 million to 1,404.89 million, and 23.0% of its people were aged 60 and over. With fewer workers and more retirees, growth will slow and pressure on pensions and health spending will rise, a long-term limit on development.",
    rubric: [
      "Figure: the population down 3.39 million (to 1,404.89 million), or 23.0% aged 60 and over.",
      "Period: in 2025.",
      "What it shows: fewer workers and more retirees will slow growth and raise pressure on pensions and health spending, a long-term limit on development.",
    ],
    notes: "One figure, correctly labelled, earns the first mark: a population fall of 3.39 million (about 3.4 million), or 23.0% aged 60 and over (about 23%, or nearly a quarter). The total population on its own does not show either change. You need the year 2025 for the second mark; a day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Saying the population grew, giving the fall in billions instead of millions, or giving another country's figure earns no figure mark. For the last mark, say what it means: fewer workers and more retirees will slow growth, or raise pressure on pensions and health spending. Another point the case study supports, such as a long-term limit on development, also earns it. Only saying the figure again, or saying an ageing population will speed up growth, does not.",
    factIds: ["C36"],
  },
  [`${U}.s28`]: {
    modelAnswer: "India's border blockade cut Nepal's supplies of fuel and goods, and Nepal's economy grew by only about 0.4% in 2015-16 (World Bank). Coming on top of the earthquake, the blockade shows the danger of relying on one neighbour for trade.",
    rubric: [
      "Figure: growth fell below 1%, to about 0.4%.",
      "Period: 2015-16 (also written 2015/16).",
      "What it shows: the danger of relying on one neighbour for trade, as the blockade cut supplies and hit growth on top of the earthquake.",
    ],
    notes: "For the first mark, accept about 0.4%, or \"below 1%\" or \"less than 1%\" if you give it with the year. You need the year 2015-16 (or 2015/16) for the second mark; a single calendar year is not enough, and a day or month is never needed. The mark is for the case study's figure (or an accepted rounding above); a different figure from another source does not earn it. Saying the economy shrank, giving the figure for Nepal's COVID year, or another country's figure earns no figure mark. For the last mark, say what the blockade shows: the danger of relying on one neighbour for trade. Another point the case study supports, such as being landlocked leaving Nepal exposed to decisions made in India, also earns it. Only saying the figure again, or saying the blockade helped Nepal grow, does not.",
    factIds: ["N28"],
  },
  [`${U}.s29`]: {
    modelAnswer: "In September 2025, 19 protesters were killed on the first day of Nepal's Gen Z anti-corruption protests and Prime Minister Oli resigned the next day; a government committee later counted 77 deaths in total. Political crises and weak governance like this deter investment and slow reform, one reason Nepal's strategies have delivered less than hoped.",
    rubric: [
      "Figure or result: 19 protesters killed on the first day (8 Sep), 77 deaths in total (government committee), or Prime Minister Oli resigning.",
      "Period: in 2025.",
      "What it shows: political crises and weak governance deter investment and slow reform, so Nepal's strategies have delivered less than hoped.",
    ],
    notes: "Any one of these earns the first mark: 19 protesters killed on the first day (8 Sep), 77 deaths in total (a government committee's count), or Prime Minister Oli resigning. Writing \"19 killed\" without saying it was the first day still earns the mark, because it is the case study's figure, but remember that 19 was only the first day's toll: the total was 77. You need the year 2025 for the second mark; a day or month is never needed. The mark is for the case study's figure; a different figure from another source does not earn it. The death toll of Nepal's civil war is a different fact. For the last mark, say what it shows: political crises and weak governance deter investment, or slow reform. Another point the case study supports, such as Nepal's strategies delivering less than hoped, also earns it. Only saying what happened again, or saying the crisis attracted investment, does not.",
    factIds: ["N31"],
  },
  [`${U}.s30`]: {
    modelAnswer: "The average US tariff on Chinese goods rose from 2.7% in 2017 to about 36.5% in Jul 2026, while in Nepal, hit by India's border blockade, growth fell below 1%, to about 0.4%, in 2015-16. Both economies can be hurt by other countries' decisions: rising protectionism is a key risk to China's export-led growth, and the blockade showed the danger of Nepal relying on one neighbour for trade.",
    rubric: [
      "Figure: the average US tariff on Chinese goods rose from 2.7% to about 36.5%, and Nepal's growth fell below 1%, to about 0.4%.",
      "Period: China 2017 and 2026, and Nepal 2015-16.",
      "What it shows: both are exposed to other countries: rising US protectionism is a key risk to China's export-led growth, while the blockade showed the danger of Nepal relying on one neighbour for trade.",
    ],
    notes: "The first mark needs both China tariff figures, 2.7% and about 36.5% (about 36% or about 37% is fine), and Nepal's growth, about 0.4% (or below 1%). The second needs China's two years, 2017 and 2026, and Nepal's year, 2015-16 (or 2015/16). One economy alone, or one end of China's change, earns neither mark. China's tariff for the year in between is not needed, and a day or month is never needed. The mark is for the case study's figures (or accepted roundings above); different figures from another source do not earn it. A fall in the tariff instead of a rise, or swapping the economies, earns no figure mark. For the last mark, say what the comparison shows: each economy can be hurt by another country's decisions, China by rising US tariffs on its exports and Nepal by a blockade from the neighbour it relies on. Another point the case study supports, such as protectionism being a risk to China's export-led growth while Nepal's risk comes from relying on one neighbour, also earns it. Only saying the figures again, or saying either hindrance helped growth, does not.",
    factIds: ["C33", "N28"],
  },
};

export const answers: AnswerSet = withWrongExplanations(keys, questions, U, explanations);

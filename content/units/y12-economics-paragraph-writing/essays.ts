import type { EssayKey } from "@/lib/types";

// SERVER-ONLY CONTENT — the essay keys for y12-economics-paragraph-writing (spec 007). NO
// "server-only" import here (the validator reads it); only re-exported through ./answers.ts and
// content/answers/index.ts, which is server-only. Never import from a client component.
//
// Authoring rules (spec 007 FR-007, FR-037):
//  - the brief supplies EVERY fact and figure; every idea in a model part is already in the brief
//    (the model adds structure, precision and terminology, never new facts);
//  - the five model parts together form one Band 6 paragraph and each is within its word limit
//    (Topic 40, Mechanism 90, Evidence 80, Evaluation 90, Link 45);
//  - the Evaluation discusses the SAME limitation the Topic Sentence framed (limitation anchors);
//  - guidance line 4 names the part's word limit;
//  - no placeholder figures: `figuresVerified` records when every figure was last checked.
// Sources are documented in docs/y12-economics-paragraph-writing-research.md (Principle V) and are
// never shown to students.

// The same four plain lines per part for every essay: the rubric the student is taught before
// writing, taken from the part's criteria. The last line always names the part's word limit.
export const GUIDANCE: EssayKey["guidance"] = {
    1: [
      "State how effective the strategy has been, using a word of degree such as “highly” or “limited”.",
      "Name the strategy and the outcome it affects (growth, poverty or development).",
      "Frame the counterpoint with while, although or despite.",
      "Precise economic terms, within 40 words.",
    ],
    2: [
      "Follow the chain steps in order and don’t skip a link.",
      "Give the economic reason behind each link, not just “consequently”.",
      "Name the model that explains it (AD/AS or AD = C + I + G + (X − M)); no figures and no drawbacks.",
      "Precise economic terms, within 90 words.",
    ],
    3: [
      "Use specific indicators from the brief, each with its year.",
      "Say what each number shows — don’t just list the data.",
      "Link the evidence back to the mechanism, so it proves the chain actually happened.",
      "Precise economic terms, within 80 words.",
    ],
    4: [
      "Discuss the same limitation the Topic Sentence framed — check the paragraph above.",
      "Explain why it reduces the strategy’s effect, not just that it exists.",
      "Weigh how much it limits the strategy, for example partly offsets or qualifies.",
      "Precise economic terms, within 90 words.",
    ],
    5: [
      "Make a judgement that answers the question, with a word of degree.",
      "Weigh the argument against the counterpoint from the Topic Sentence above.",
      "Add nothing new — no new issue, risk or evidence — and echo the question’s wording.",
      "Precise economic terms, within 45 words.",
    ],
};

// Which brief fields each part uses ("Use in this part").
export const USES: EssayKey["uses"] = {
    1: ["argument", "counterpoint"],
    2: ["chainSteps"],
    3: ["chainSteps", "facts"],
    4: ["counterpoint", "limitation"],
    5: ["argument", "counterpoint"],
};

// Live essays: China (emerging) and Nepal (developing), the pair Peyton chose (17 Nov 2026).
// e01 Vietnam and e02 Bangladesh are archived in content/archive/y12-economics-paragraph-writing/
// and tombstoned in ./concepts.ts. Never renumber: new essays take the next id.
export const essays: EssayKey[] = [
  {
    essayId: "e03",
    economyType: "emerging",
    strategy:
      "The Open Door Policy from 1978: special economic zones (from 1980) and opened coastal cities that attracted foreign direct investment (FDI) into export manufacturing.",
    brief: {
      economy:
        "China, an emerging economy. Strategy: the Open Door Policy from 1978, using special economic zones (SEZs) and open coastal cities to attract foreign direct investment (FDI) into export manufacturing.",
      argument:
        "Opening up through SEZs brought in foreign investment that drove decades of very fast growth and lifted hundreds of millions of people out of poverty.",
      counterpoint:
        "The gains went mostly to the coast and the cities, so the gaps between regions and between rich and poor grew wide.",
      chainSteps: [
        "SEZs offer foreign firms lower taxes and fewer rules",
        "Foreign firms build factories in the zones because costs and risks are lower (FDI)",
        "More machines, technology and know-how, so each worker produces more and factory jobs grow",
        "Factory goods are exported, so net exports and total spending rise, and the economy can produce more",
        "Real GDP grows fast",
        "Workers move from farms to better-paid factory jobs, so incomes rise and poverty falls",
      ],
      facts: [
        "The first four SEZs opened in 1980: Shenzhen, Zhuhai, Shantou and Xiamen. Fourteen coastal cities were opened in 1984.",
        "World Bank: since 1978 GDP growth has averaged almost 10% a year, and more than 800 million people have been lifted out of poverty.",
        "World Bank: extreme poverty fell from 88% of the population in 1981 to 0.7% in 2015.",
      ],
      limitation: [
        "Over 85% of FDI between 1978 and 1998 went to the eastern coastal region; only 3% went to the west.",
        "Inland and rural regions gained fewer factory jobs and less investment.",
        "Income inequality rose: the official Gini coefficient peaked at 0.491 in 2008.",
      ],
    },
    uses: USES,
    guidance: GUIDANCE,
    models: {
      1: "While the Open Door Policy's special economic zones have been highly effective in attracting FDI and accelerating China's economic growth, their contribution to development has been limited by widening regional and income inequality.",
      2: "Special economic zones offered foreign firms tax concessions and fewer regulations, lowering their costs and risks and thereby attracting FDI from transnational corporations. Consequently, capital formation and technology transfer raised labour productivity and expanded manufacturing employment, shifting aggregate supply rightward. Rising manufactured exports increased net exports (X - M) and aggregate demand, so real GDP grew rapidly. As a result, workers moving from farms into better-paid factory jobs earned higher incomes, reducing absolute poverty and raising living standards.",
      3: "After the first four SEZs opened in 1980 and fourteen coastal cities in 1984, FDI-led export manufacturing helped China's GDP grow by almost 10% a year since 1978, according to the World Bank. This growth translated into development: extreme poverty fell from 88% of the population in 1981 to 0.7% in 2015, as more than 800 million people were lifted out of poverty.",
      4: "However, the strategy has been far less effective in spreading development evenly. Because SEZ incentives were confined to the coast, over 85% of FDI between 1978 and 1998 went to the eastern coastal region and only 3% to the west, so inland and rural households gained fewer factory jobs and slower income growth. Consequently, income inequality widened, with the Gini coefficient peaking at 0.491 in 2008. This significantly qualifies, but does not outweigh, the strategy's success in reducing poverty.",
      5: "Therefore, the Open Door Policy has been highly effective in promoting China's economic growth and reducing poverty, though its effectiveness in achieving balanced development has been significantly limited by regional and income inequality.",
    },
    commentary: {
      1: "names the strategy and the outcome, judges it with “highly effective”, and frames the counterpoint with “While … limited by”.",
      2: "every link from the SEZ incentives to lower poverty is stated with its reason, and it names the AD/AS model; no figures and no drawbacks.",
      3: "each figure is followed by what it shows, and the growth figure is tied back to FDI-led export manufacturing.",
      4: "stays on the inequality the Topic Sentence framed, explains why the coast gained more, and weighs how much it matters.",
      5: "a judgement of degree that weighs fast growth against uneven development and adds nothing new.",
    },
    markingNotes: {
      1: "'Evaluate' needs a judgement of effectiveness with a word of degree. Accept 'special economic zones', 'the Open Door Policy', 'opening to FDI' or 'export-oriented industrialisation' as the strategy, and growth, poverty or development as the outcome. The counterpoint must be uneven gains: regional, urban-rural or income inequality.",
      2: "Accept AD/AS or the AD equation as the model. Accept 'multinationals' for transnational corporations. Required links: (1) SEZ tax concessions or fewer rules -> lower costs and risk -> FDI; (2) FDI -> capital and technology -> higher productivity or more factory jobs; (3) higher exports -> net exports (X - M) / aggregate demand -> real GDP; (4) higher incomes -> less poverty or better living standards (either is enough). Optional: the aggregate supply shift, rural-to-urban migration. Key reasons: (i) lower costs and risk attract foreign firms; (ii) more capital and technology raise output per worker; (iii) exports add to aggregate demand through (X - M).",
      3: "Rounded figures are acceptable if correct. The 1980 and 1984 openings are context. The growth figure must be tied back to FDI, SEZs or exports (criterion c); the poverty figures show development.",
      4: "The limitation must be uneven distribution, as framed in the model topic sentence: regional (coast versus inland or west), urban-rural or income inequality. Pollution, debt or dependence on exports is a different limitation (criterion a fails).",
      5: "The judgement must answer 'evaluate' (how effective). Growth and development (or poverty) should both appear to echo the question.",
    },
    limitation: {
      tag: "inequality",
      topicPhrase: "widening regional and income inequality",
      evaluationPhrase: "income inequality widened",
    },
    // Every figure checked against the sources in docs/y12-economics-paragraph-writing-research.md.
    figuresVerified: "2026-11-16",
  },
  {
    essayId: "e04",
    economyType: "emerging",
    strategy:
      "State-led infrastructure investment, such as high-speed rail and transport networks, funded largely through local government borrowing.",
    brief: {
      economy:
        "China, an emerging economy. Strategy: state-led infrastructure investment, such as the high-speed rail network, funded largely by local governments and their financing companies.",
      argument:
        "Building railways, roads and other transport has boosted growth by creating jobs now and making the whole economy more productive.",
      counterpoint:
        "Much of it was paid for with borrowed money and coal-powered heavy industry, so the debt and the pollution make this kind of growth hard to sustain.",
      chainSteps: [
        "The government and local governments spend heavily on railways, roads and other transport",
        "Building them creates construction jobs and orders for steel and cement straight away",
        "This investment adds to total spending in the economy",
        "Once built, faster and cheaper transport lowers firms' costs and links markets, so the economy can produce more",
        "Real GDP grows",
        "People reach jobs, markets and services more easily, so incomes and living standards rise",
      ],
      facts: [
        "China had almost no high-speed rail in 2008; by the end of 2024 its network was about 48,000 km.",
        "Railway investment was expected to exceed 800 billion yuan in 2024.",
        "Real estate and infrastructure construction have consistently exceeded 30% of GDP in recent years (IMF working paper).",
      ],
      limitation: [
        "IMF: local government financing companies were projected to owe 66 trillion yuan by the end of 2023, on top of 40 trillion yuan owed directly by local governments.",
        "The growth returns to new building appear to be falling in some regions (IMF working paper).",
        "IEA: China produced 35% of the world's energy-related CO2 emissions in 2023, mostly from coal.",
      ],
    },
    uses: USES,
    guidance: GUIDANCE,
    models: {
      1: "Although state-led infrastructure investment has had a significant positive effect on China's economic growth and living standards, its effectiveness has been increasingly limited by rising local government debt and environmental costs.",
      2: "Large-scale public spending on railways and transport immediately raised investment (I), a component of aggregate demand, creating construction jobs and orders for steel and cement, so real GDP rose. Once completed, faster and cheaper transport lowered firms' costs and integrated regional markets, raising productivity and shifting aggregate supply rightward, thereby sustaining growth. Consequently, improved access to jobs, markets and services raised household incomes and living standards, promoting economic development.",
      3: "The scale of this investment is clear: China moved from almost no high-speed rail in 2008 to a network of about 48,000 km by the end of 2024, with railway investment expected to exceed 800 billion yuan in 2024 alone. Real estate and infrastructure construction have consistently exceeded 30% of GDP in recent years, showing that infrastructure-led investment has been a central source of aggregate demand and growth.",
      4: "However, the strategy's effectiveness is increasingly constrained by its sustainability. Because projects were funded largely by borrowing, the IMF projected local government financing companies to owe 66 trillion yuan by the end of 2023, and falling returns to new building make this debt harder to service. Moreover, construction-led growth relies on coal-powered heavy industry, so China produced 35% of global energy-related CO2 emissions in 2023. These costs significantly qualify, though do not negate, the growth gains.",
      5: "Therefore, infrastructure investment has significantly promoted China's economic growth and development, though its effectiveness has been increasingly limited by unsustainable local government debt and high carbon emissions.",
    },
    commentary: {
      1: "names the strategy and the outcome, judges it with “significant positive effect”, and frames the counterpoint with “Although … limited by”.",
      2: "traces both channels, spending now (I in aggregate demand) and capacity later (aggregate supply), with the reason for each link.",
      3: "each figure is followed by what it shows, and the 30% of GDP figure ties the investment back to aggregate demand.",
      4: "stays on the debt and emissions the Topic Sentence framed, explains why they make growth harder to sustain, and weighs how much.",
      5: "a judgement of degree that weighs growth gains against sustainability and adds nothing new.",
    },
    markingNotes: {
      1: "'Assess' needs a judgement of how significant or effective, with a word of degree. Accept 'infrastructure investment', 'high-speed rail' or 'state-led investment' as the strategy, and growth, living standards or development as the outcome. The counterpoint must be sustainability: debt and/or environmental costs.",
      2: "Accept AD/AS, the AD equation or the multiplier as the model. Required links: (1) public spending on transport -> higher investment (I) / construction jobs; (2) higher investment -> aggregate demand -> real GDP; (3) completed transport -> lower costs or linked markets -> higher productivity or capacity; (4) better access to jobs and services -> higher incomes or living standards (either is enough). Key reasons: (i) investment spending is a component of aggregate demand; (ii) cheaper, faster transport lowers firms' costs; (iii) better transport raises productive capacity (aggregate supply).",
      3: "Rounded figures are acceptable if correct. The rail and investment figures show the scale; the 30% of GDP figure must be tied to aggregate demand or growth (criterion c).",
      4: "The limitation must be sustainability, as framed in the model topic sentence: local government debt and/or carbon emissions and pollution. Either half alone is acceptable. Inequality or dependence on exports is a different limitation (criterion a fails).",
      5: "The judgement must answer 'assess' (how effective or significant). Growth and development should both appear to echo the question.",
    },
    limitation: {
      tag: "sustainability",
      topicPhrase: "rising local government debt",
      evaluationPhrase: "harder to service",
    },
    // Every figure checked against the sources in docs/y12-economics-paragraph-writing-research.md.
    figuresVerified: "2026-11-16",
  },
  {
    essayId: "e05",
    economyType: "developing",
    strategy:
      "Integration into the global labour market: large-scale labour migration abroad and the remittances migrants send home.",
    brief: {
      economy:
        "Nepal, a developing economy. Strategy: integration into the global labour market, with workers migrating abroad for jobs and sending money (remittances) home.",
      argument:
        "Money sent home by workers abroad has raised household spending and cut poverty.",
      counterpoint:
        "The economy now depends on jobs in other countries: most remittances are spent on daily needs rather than investment, and many young and skilled people leave.",
      chainSteps: [
        "Few well-paid jobs at home, so workers take jobs in countries such as Qatar, Malaysia, Saudi Arabia and the UAE",
        "They earn higher wages abroad and send part home as remittances",
        "Households have more income to spend, so consumption rises, adding to total spending",
        "The foreign currency also pays for imports",
        "Real GDP grows, led by consumption and services",
        "Families can afford food, schooling and health care, so poverty falls",
      ],
      facts: [
        "World Bank: Nepal received about US$9.6 billion in remittances in 2023, slightly over 25% of GDP.",
        "76.8% of households received remittances in 2022/23 (Nepal Living Standards Survey IV).",
        "The national poverty rate fell from 25.16% in 2010/11 to 20.27% in 2022/23 (Nepal Living Standards Survey IV).",
        "World Bank: without remittances, an estimated 2.6 million more people would have been in poverty.",
      ],
      limitation: [
        "Around 90% of remittances are used for daily consumption, not investment.",
        "Youth unemployment was 22.7% in 2022/23, which pushes young and skilled workers to emigrate (World Bank).",
        "Remittance income depends on jobs and demand for workers in other countries.",
      ],
    },
    uses: USES,
    guidance: GUIDANCE,
    models: {
      1: "While labour migration and remittances have had a significant positive impact on Nepal's household incomes and poverty reduction, their contribution to sustained development has been limited by a growing dependence on jobs abroad.",
      2: "Because few well-paid jobs exist at home, Nepali workers migrate to labour markets such as Qatar, Malaysia and the UAE, where higher wages allow them to send remittances home. Consequently, household disposable income rises, increasing consumption (C), the largest component of aggregate demand, so real GDP grows, led by consumption and services. The inflow of foreign currency also finances imports. As a result, families can afford food, schooling and health care, reducing poverty and improving development.",
      3: "Remittances have become central to Nepal's economy: the World Bank estimates inflows of about US$9.6 billion in 2023, slightly over 25% of GDP, and 76.8% of households received them in 2022/23. This income has supported development, as the national poverty rate fell from 25.16% in 2010/11 to 20.27% in 2022/23, and without remittances an estimated 2.6 million more people would have been in poverty.",
      4: "However, this strategy has created a damaging dependence on jobs abroad. Because around 90% of remittances fund daily consumption rather than investment, they raise living standards without building Nepal's productive capacity, so few jobs are created at home. Consequently, with youth unemployment at 22.7% in 2022/23, young and skilled workers continue to emigrate, while household incomes remain exposed to falling demand for workers in other countries. This significantly limits, though does not erase, the development gains.",
      5: "Therefore, globalisation through labour migration has had a significant positive impact on Nepal's economic growth and poverty reduction, though its contribution to sustained development has been substantially limited by dependence on jobs abroad.",
    },
    commentary: {
      1: "names the strategy and the outcome, judges it with “significant positive impact”, and frames the counterpoint with “While … limited by”.",
      2: "explains why workers leave and how remittances reach aggregate demand through consumption (C); no figures and no drawbacks.",
      3: "each figure is followed by what it shows, and the poverty figures are tied back to remittance income.",
      4: "stays on the dependence the Topic Sentence framed, explains why consumption-led remittances build little capacity at home, and weighs how much.",
      5: "a judgement of degree that weighs poverty reduction against dependence and adds nothing new.",
    },
    markingNotes: {
      1: "'Assess' needs a judgement of how significant the impact has been. Accept 'labour migration', 'remittances' or 'integration into the global labour market' as the strategy, and incomes, poverty, growth or development as the outcome. The counterpoint must be dependence on jobs abroad (or on remittances).",
      2: "Accept the AD equation or the circular flow as the model. Required links: (1) few jobs at home -> migration to foreign labour markets -> higher wages; (2) wages sent home -> higher household income -> higher consumption (C) / aggregate demand; (3) higher aggregate demand -> real GDP; (4) higher incomes -> less poverty or better access to food, schooling and health (either is enough). Optional: foreign currency paying for imports. Key reasons: (i) wages abroad are higher than at home; (ii) remittances raise disposable income, so households consume more; (iii) consumption is a component of aggregate demand.",
      3: "Rounded figures are acceptable if correct. The remittance figures show the scale of the strategy; the poverty figures must be tied back to remittance income (criterion c).",
      4: "The limitation must be dependence on jobs abroad, as framed in the model topic sentence: remittances spent on consumption not investment, few jobs at home, emigration of young and skilled workers, or exposure to demand in other countries. Inequality or environmental damage is a different limitation (criterion a fails).",
      5: "The judgement must answer 'assess' (how significant the impact). Growth and development (or poverty) should both appear to echo the question.",
    },
    limitation: {
      tag: "dependence",
      topicPhrase: "dependence on jobs abroad",
      evaluationPhrase: "without building Nepal's productive capacity",
    },
    // Every figure checked against the sources in docs/y12-economics-paragraph-writing-research.md.
    figuresVerified: "2026-11-16",
  },
  {
    essayId: "e06",
    economyType: "developing",
    strategy:
      "Developing hydropower with private and foreign investment, and exporting surplus electricity to India and Bangladesh.",
    brief: {
      economy:
        "Nepal, a developing economy. Strategy: developing hydropower with private and foreign investment, and exporting surplus electricity to India and Bangladesh.",
      argument:
        "Hydropower is turning Nepal from an electricity importer into an exporter, earning foreign currency and attracting investment.",
      counterpoint:
        "The gains are slow to arrive: power plants and cross-border lines take years to build, and exports so far are small and happen mainly in the wet season.",
      chainSteps: [
        "Nepal opens hydropower to private and foreign investors and signs power trade agreements",
        "Investors build hydropower plants, so investment and construction jobs rise",
        "More electricity is generated than Nepal needs in the wet season, so the surplus is exported",
        "Electricity exports earn foreign currency and raise net exports, adding to total spending",
        "Reliable, cheaper power lets local firms produce more",
        "Real GDP grows and more households have electricity, improving living standards",
      ],
      facts: [
        "Nepal's hydropower potential is estimated at up to 83,000 MW, of which about 43,000 MW is technically feasible.",
        "Nepal's generation capacity was about 3,240 MW in 2024.",
        "India first approved 39 MW of electricity imports from Nepal in October 2021; exports reached around 1,000 MW in 2024.",
        "In January 2024 Nepal and India agreed a target of up to 10,000 MW of exports to India over 10 years.",
      ],
      limitation: [
        "141 private projects of about 4,063 MW were still under construction in 2024.",
        "New cross-border transmission lines are still being built.",
        "Nepal exports electricity in the wet season but still imports it in the dry season, when river flows fall.",
      ],
    },
    uses: USES,
    guidance: GUIDANCE,
    models: {
      1: "While hydropower development has been increasingly effective in turning Nepal into an electricity exporter and attracting investment, its contribution to economic growth and development has so far been limited by long construction lags and seasonal exports.",
      2: "Opening hydropower to private and foreign investors and signing power trade agreements reduced the risk of building plants, attracting investment (I) that immediately raised aggregate demand and construction employment. Consequently, generation capacity expanded beyond domestic wet-season demand, so surplus electricity could be exported, increasing net exports (X - M) and earning foreign currency. In addition, more reliable and cheaper power lowered local firms' costs, shifting aggregate supply rightward. As a result, real GDP grew and wider access to electricity improved living standards.",
      3: "Nepal's shift from importer to exporter is clear: India first approved 39 MW of electricity imports from Nepal in October 2021, and by 2024 exports had reached around 1,000 MW, showing that generation capacity of about 3,240 MW now produces an exportable surplus. The January 2024 agreement targeting up to 10,000 MW of exports to India over 10 years confirms the growing potential of electricity exports to raise net exports and growth.",
      4: "However, these gains have been slow to materialise. Because hydropower plants and cross-border transmission lines take years to build, 141 private projects of about 4,063 MW were still under construction in 2024, leaving current capacity of about 3,240 MW far below the 43,000 MW that is technically feasible. Moreover, exports occur mainly in the wet season, and Nepal still imports electricity in the dry season when river flows fall. These lags significantly limit, though do not negate, the strategy's contribution so far.",
      5: "Therefore, hydropower development has been an increasingly effective strategy for Nepal's economic growth and development, though its benefits have so far been significantly limited by long construction lags and seasonal exports.",
    },
    commentary: {
      1: "names the strategy and the outcome, judges it with “increasingly effective”, and frames the counterpoint with “While … limited by”.",
      2: "traces investment now (I) and exports later (X - M), plus cheaper power for firms (aggregate supply), with the reason for each link.",
      3: "each figure is followed by what it shows, and the export figures are tied back to expanded generation capacity.",
      4: "stays on the time lags the Topic Sentence framed, explains why the gains arrive slowly, and weighs how much.",
      5: "a judgement of degree that weighs the strategy's promise against its slow, seasonal gains and adds nothing new.",
    },
    markingNotes: {
      1: "'Evaluate' needs a judgement of effectiveness with a word of degree ('increasingly', 'partly', 'highly'). Accept 'hydropower development', 'electricity exports' or 'energy trade with India' as the strategy, and growth, investment or development as the outcome. The counterpoint must be time lags: slow construction and/or small, seasonal exports.",
      2: "Accept AD/AS or the AD equation as the model. Required links: (1) opening to investors or power trade deals -> investment in plants; (2) investment -> aggregate demand or construction jobs; (3) more generation -> surplus electricity exported -> net exports (X - M); (4) real GDP grows or better access to electricity improves living standards (either is enough). Optional: cheaper power for local firms (aggregate supply). Key reasons: (i) agreements and openness lower the risk for investors; (ii) investment and exports are components of aggregate demand; (iii) surplus generation in the wet season makes exports possible.",
      3: "Rounded figures are acceptable if correct. The export figures (39 MW in 2021, around 1,000 MW in 2024) must be tied to the growth of generation or to net exports (criterion c); the 10,000 MW agreement shows future potential.",
      4: "The limitation must be time lags, as framed in the model topic sentence: long construction times for plants and transmission lines, and/or exports that are small and seasonal. Dependence on India or environmental damage is a different limitation (criterion a fails).",
      5: "The judgement must answer 'evaluate' (how effective). Growth and development should both appear to echo the question.",
    },
    limitation: {
      tag: "time-lags",
      topicPhrase: "long construction lags",
      evaluationPhrase: "slow to materialise",
    },
    // Every figure checked against the sources in docs/y12-economics-paragraph-writing-research.md.
    figuresVerified: "2026-11-16",
  },
  {
    essayId: "e07",
    economyType: "emerging and developing",
    strategy:
      "Trade liberalisation through membership of the World Trade Organization (WTO): China joined in 2001 and Nepal in 2004.",
    brief: {
      economy:
        "China (emerging) and Nepal (developing). Strategy: trade liberalisation through joining the World Trade Organization (WTO): China in 2001, Nepal in 2004.",
      argument:
        "Joining the WTO opened world markets and helped China become the world's largest exporter, driving fast growth.",
      counterpoint:
        "The same strategy did little for Nepal: with few competitive industries and heavy dependence on India, its imports grew much faster than its exports.",
      chainSteps: [
        "Joining the WTO lowers tariffs and secures access to world markets",
        "Firms with a cost advantage, such as China's factories, win more export orders and attract foreign investment",
        "Exports rise faster than imports, so net exports and total spending rise",
        "Real GDP grows and factory jobs expand",
        "Incomes rise, so poverty falls",
        "Where firms cannot compete, as in Nepal, cheaper imports grow faster than exports, so net exports fall",
      ],
      facts: [
        "China joined the WTO in December 2001; Nepal joined in April 2004.",
        "China's exports grew from about US$266 billion in 2001 to US$3.4 trillion in 2023.",
        "China's share of global exports rose from 4.3% in 2001 to 15% in 2020.",
        "Eight years after Nepal joined, its exports had fallen from 10% to 5% of GDP and its trade deficit had grown about fourfold.",
        "In 2022/23 Nepal's exports were only 8.9% of its total trade.",
      ],
      limitation: [
        "Nepal is landlocked, with a weak production base and high transport costs.",
        "Nepal has struggled to produce competitive goods, so imports have grown faster than exports (National Planning Commission, 2024).",
        "India remains by far Nepal's biggest trading partner.",
      ],
    },
    uses: USES,
    guidance: GUIDANCE,
    models: {
      1: "While WTO-led trade liberalisation has been highly significant in driving China's export-led growth, its impact on Nepal's growth and development has been limited by weak productive capacity and dependence on India.",
      2: "WTO membership lowers tariffs and secures access to world markets, so its effect on growth depends on whether firms hold a comparative advantage. Where they do, as with China's low-cost manufacturers, export orders and foreign investment rise, so exports grow faster than imports, raising net exports (X - M) and aggregate demand. Consequently, real GDP grows, factory employment expands and rising incomes reduce poverty. Where firms cannot compete, as in Nepal, cheaper imports grow faster than exports, so net exports fall and aggregate demand gains less.",
      3: "China's export boom shows the strategy's power: exports grew from about US$266 billion in 2001 to US$3.4 trillion in 2023, lifting its share of global exports from 4.3% to 15% by 2020. Nepal's experience is the reverse: eight years after joining, exports had fallen from 10% to 5% of GDP, and by 2022/23 exports were only 8.9% of total trade, showing imports outpacing exports.",
      4: "However, the strategy's impact on Nepal has been limited by weak productive capacity. Because Nepal is landlocked, with a weak production base and high transport costs, its firms could not produce competitive goods, so tariff cuts mainly made imports cheaper rather than expanding exports. Consequently, its trade deficit grew about fourfold within eight years, and it remained heavily dependent on India as its biggest trading partner. This substantially qualifies the strategy's overall impact, though it does not diminish its success in China.",
      5: "Therefore, trade liberalisation has had a highly significant impact on China's economic growth and development, but only a limited impact on Nepal's, because weak productive capacity and dependence on India prevented it from expanding exports.",
    },
    commentary: {
      1: "judges the strategy in both economies, names the outcome, and frames Nepal's experience as the counterpoint with “While … limited by”.",
      2: "explains why the same strategy works where firms have a comparative advantage and not where they cannot compete, through net exports (X - M).",
      3: "each figure is followed by what it shows, and the two economies' figures are set side by side to show opposite results.",
      4: "stays on Nepal's weak productive capacity, as the Topic Sentence framed it, explains why tariff cuts mainly raised imports, and weighs how much.",
      5: "a judgement of degree for each economy that weighs the contrast and adds nothing new.",
    },
    markingNotes: {
      1: "'Analyse' still needs a judgement: how significant the impact was in each economy. Accept 'WTO membership', 'trade liberalisation' or 'tariff reductions' as the strategy, and growth or development as the outcome. Both economies must be named. The counterpoint must be Nepal's limited gains: weak productive capacity and/or dependence on India.",
      2: "Accept AD/AS or the AD equation as the model. Required links: (1) WTO membership -> lower tariffs and access to world markets; (2) competitive firms (China) -> more exports or FDI -> net exports (X - M) / aggregate demand -> real GDP; (3) higher incomes -> less poverty or more jobs (either is enough); (4) uncompetitive firms (Nepal) -> imports grow faster than exports -> net exports fall. Key reasons: (i) the effect depends on comparative advantage; (ii) exports add to aggregate demand through (X - M); (iii) cheaper imports reduce net exports where firms cannot compete. Describing Nepal's case as theory is not evaluation; only an added judgement of a drawback fails (c).",
      3: "Rounded figures are acceptable if correct. Both economies need evidence. China's export figures and Nepal's falling export share must each be tied back to trade liberalisation (criterion c).",
      4: "The limitation must be Nepal's weak productive capacity and/or dependence on India, as framed in the model topic sentence. China's debt, pollution or inequality is a different limitation (criterion a fails).",
      5: "The judgement must answer 'analyse' with a degree for each economy. Growth and development should both appear to echo the question.",
    },
    limitation: {
      tag: "dependence",
      topicPhrase: "weak productive capacity",
      evaluationPhrase: "could not produce competitive goods",
    },
    // Every figure checked against the sources in docs/y12-economics-paragraph-writing-research.md.
    figuresVerified: "2026-11-16",
  },
  {
    essayId: "e08",
    economyType: "emerging and developing",
    strategy:
      "Integration with the global economy: export manufacturing in China, and labour migration with remittances in Nepal.",
    brief: {
      economy:
        "China (emerging) and Nepal (developing). Strategy: integration with the global economy, through export manufacturing in China, and through workers migrating abroad and sending remittances home in Nepal.",
      argument:
        "Both countries have used global markets to cut poverty: China by selling factory goods to the world, Nepal by selling its labour abroad.",
      counterpoint:
        "The gains have been uneven: cities and richer regions have gained far more than rural and remote areas.",
      chainSteps: [
        "China sells factory goods to world markets; Nepali workers earn wages in foreign labour markets",
        "Foreign income flows in: export earnings in China, remittances in Nepal",
        "Household incomes rise, so spending rises, adding to total spending",
        "Real GDP grows",
        "Families can afford better food, health care and schooling",
        "Poverty falls and living standards rise",
      ],
      facts: [
        "World Bank: extreme poverty in China fell from 88% of the population in 1981 to 0.7% in 2015.",
        "World Bank: Nepal received about US$9.6 billion in remittances in 2023, slightly over 25% of GDP.",
        "Nepal's national poverty rate fell from 25.16% in 2010/11 to 20.27% in 2022/23 (Nepal Living Standards Survey IV).",
      ],
      limitation: [
        "Rural and remote regions have poorer roads, electricity and access to markets, so they gain less (World Bank on Nepal's poorest provinces).",
        "In China, urban residents' disposable income was 2.57 times rural residents' in 2021 (National Bureau of Statistics).",
        "In Nepal in 2022/23, poverty was 34.16% in Sudurpaschim province but 11.88% in Gandaki province, and higher in rural areas (24.66%) than urban areas (18.34%).",
      ],
    },
    uses: USES,
    guidance: GUIDANCE,
    models: {
      1: "Although globalisation has significantly improved economic development in both China and Nepal by reducing poverty, its benefits have been unevenly distributed, favouring cities and richer regions over rural and remote areas.",
      2: "Integration with world markets raises foreign income through different channels: China's manufacturers earn export revenue by selling low-cost goods abroad, while Nepali workers earn higher wages in foreign labour markets and send remittances home. Consequently, household disposable incomes rise, increasing consumption and, in China, net exports (X - M), thereby lifting aggregate demand and real GDP. As a result, families can afford better food, health care and schooling, reducing poverty and raising living standards, which improves economic development.",
      3: "The development gains are substantial in both economies. In China, export-led integration helped cut extreme poverty from 88% of the population in 1981 to 0.7% in 2015, according to the World Bank. In Nepal, remittances worth about US$9.6 billion in 2023, slightly over 25% of GDP, supported a fall in the national poverty rate from 25.16% in 2010/11 to 20.27% in 2022/23.",
      4: "However, these gains have been unevenly distributed. Because rural and remote regions have poorer roads, electricity and access to markets, they share less in the income that global integration generates. In China, urban disposable incomes were 2.57 times rural incomes in 2021, while in Nepal poverty reached 34.16% in Sudurpaschim but only 11.88% in Gandaki province in 2022/23. This inequality significantly qualifies, though does not outweigh, globalisation's contribution to development in both economies.",
      5: "Therefore, globalisation has had a significant positive impact on economic development in both China and Nepal, though its benefits have been substantially limited by an uneven distribution between urban and rural regions.",
    },
    commentary: {
      1: "judges the impact in both economies with “significantly improved”, names the outcome, and frames the counterpoint with “Although … unevenly distributed”.",
      2: "explains the two channels of foreign income and how each reaches aggregate demand; no figures and no drawbacks.",
      3: "each figure is followed by what it shows, and each economy's poverty figure is tied back to its channel of integration.",
      4: "stays on the uneven distribution the Topic Sentence framed, explains why remote regions gain less, and weighs how much.",
      5: "a judgement of degree for both economies that weighs poverty reduction against uneven gains and adds nothing new.",
    },
    markingNotes: {
      1: "'Discuss' still needs a judgement of how significant the impact has been. Accept 'globalisation', 'integration with the global economy', 'export manufacturing' and 'remittances' as the strategy, and development or poverty as the outcome. Both economies must be named. The counterpoint must be uneven distribution: regional, urban-rural or income inequality.",
      2: "Accept the AD equation or the circular flow as the model. Required links: (1) China's exports and Nepal's migrant wages -> foreign income; (2) foreign income -> higher household incomes -> consumption (and net exports in China) / aggregate demand; (3) aggregate demand -> real GDP; (4) higher incomes -> less poverty or better food, health and schooling (either is enough). Key reasons: (i) exporters sell low-cost goods abroad and migrants earn higher wages abroad; (ii) higher disposable income raises consumption; (iii) consumption and net exports are components of aggregate demand.",
      3: "Rounded figures are acceptable if correct. Both economies need evidence, and each poverty figure must be tied back to its channel: exports for China, remittances for Nepal (criterion c).",
      4: "The limitation must be uneven distribution, as framed in the model topic sentence: urban-rural, regional or provincial gaps. Dependence on jobs abroad, debt or pollution is a different limitation (criterion a fails).",
      5: "The judgement must answer 'discuss' with a degree. Development should be named and both economies should appear to echo the question.",
    },
    limitation: {
      tag: "inequality",
      topicPhrase: "unevenly distributed",
      evaluationPhrase: "share less in the income",
    },
    // Every figure checked against the sources in docs/y12-economics-paragraph-writing-research.md.
    figuresVerified: "2026-11-16",
  },
];

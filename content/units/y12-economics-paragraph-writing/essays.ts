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
const GUIDANCE: EssayKey["guidance"] = {
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
const USES: EssayKey["uses"] = {
    1: ["argument", "counterpoint"],
    2: ["chainSteps"],
    3: ["chainSteps", "facts"],
    4: ["counterpoint", "limitation"],
    5: ["argument", "counterpoint"],
};

export const essays: EssayKey[] = [
  {
    essayId: "e01",
    economyType: "emerging",
    strategy:
      "Trade liberalisation and FDI attraction under the Doi Moi reforms (from 1986), deepened by WTO accession in 2007.",
    brief: {
      economy:
        "Vietnam, an emerging economy. Strategy: trade liberalisation and attracting foreign direct investment (FDI) under the Doi Moi reforms from 1986, deepened by joining the WTO in 2007.",
      argument:
        "Opening up to trade and foreign investment has driven fast growth and lifted millions of people out of poverty.",
      counterpoint:
        "The gains have been uneven (rural people and ethnic minorities have gained less), and growth leans on foreign-owned exporters that have weak links to local firms, so it depends on world demand.",
      chainSteps: [
        "Tariffs cut and foreign ownership made legal (Law on Foreign Investment, 1987)",
        "Producing in Vietnam becomes cheaper and less risky for foreign firms, so they build factories (FDI)",
        "More machines and new technology, so each worker produces more and factory jobs grow",
        "Exports rise, so net exports and total spending in the economy rise, and the economy can also produce more",
        "Real GDP grows",
        "Household incomes rise, so poverty falls and families can afford better health and education",
      ],
      facts: [
        "Inflation was 774% in 1986, before the reforms.",
        "Vietnam joined the WTO in 2007.",
        "Since 1990 Vietnam's growth in output per person has been second only to China's (The Economist).",
        "Foreign-invested firms produce a substantial share of Vietnam's exports.",
        "World Bank: poverty fell from 16.8% in 2010 to 5% in 2020; over 10 million people moved out of poverty.",
      ],
      limitation: [
        "Foreign factories cluster around the big cities and the coast.",
        "Poverty is highest among rural residents and ethnic minorities.",
        "Links between foreign-invested and local firms are weak, so little technology spreads to local firms.",
        "Export growth depends on foreign firms and on demand in other countries.",
      ],
    },
    uses: USES,
    guidance: GUIDANCE,
    models: {
      1: "While trade liberalisation and FDI attraction under Doi Moi have been highly effective in accelerating Vietnam's economic growth, their contribution to economic development has been qualified by an uneven distribution of gains and a reliance on foreign-owned exporters.",
      2: "Reducing tariffs and legalising foreign ownership through the 1987 Law on Foreign Investment lowered the cost and risk of producing in Vietnam, attracting FDI from transnational corporations. Consequently, capital formation and technology transfer raised labour productivity, shifting aggregate supply rightward and expanding manufacturing employment. Rising exports increased net exports (X - M), thereby lifting aggregate demand, so real GDP grew. As a result, higher household incomes reduced absolute poverty and funded better health and education, raising economic development.",
      3: "Following Doi Moi, Vietnam moved from 774% inflation in 1986 to growth in output per person since 1990 second only to China's. WTO accession in 2007 deepened this integration, and foreign-invested firms now produce a substantial share of exports, confirming that FDI-led exports drove this growth. This growth translated into development: the World Bank reports poverty fell from 16.8% in 2010 to 5% in 2020, lifting over 10 million people out of poverty.",
      4: "However, openness has been less effective in promoting broad-based development. Because export-oriented FDI clusters around major cities and the coast, poverty remains concentrated among rural residents and ethnic minorities, who gain less from manufacturing employment. Moreover, weak linkages between foreign-invested and domestic firms limit technology spillovers, leaving growth dependent on transnational corporations and external demand, and thereby vulnerable to global downturns. These constraints partially offset, rather than outweigh, the development gains of trade liberalisation.",
      5: "Therefore, trade liberalisation and FDI attraction have been highly effective in promoting Vietnam's economic growth, though their effectiveness in achieving broad-based development has been partially constrained by regional inequality and dependence on foreign-owned exporters.",
    },
    commentary: {
      1: "names the strategy and the outcome, judges it with “highly effective”, and frames the counterpoint with “While … qualified by”.",
      2: "every link in the chain is stated with its reason, and it names the AD model; no figures and no drawbacks.",
      3: "every figure is followed by what it shows, and the exports figure ties back to the FDI-led chain.",
      4: "stays on the limitation the Topic Sentence framed, explains why it limits the gains, and weighs how much.",
      5: "a judgement of degree that weighs the argument against the counterpoint and adds nothing new.",
    },
    markingNotes: {
      1: "The counterpoint can be framed with while, although, despite or a 'but ... limited by' clause. 'Opening to trade', 'outward-oriented strategy' and 'integration with the global economy' are acceptable names for the strategy if trade or FDI is clear.",
      2: "Steps may be merged in one sentence if each causal link is still stated. Accept AD/AS, the AD equation or 'circular flow' as the model. Accept 'multinationals' for transnational corporations. Required links: (1) tariff cuts / legal foreign ownership -> FDI; (2) FDI -> capital and technology -> higher productivity or more manufacturing jobs; (3) higher exports -> net exports (X - M) / aggregate demand -> real GDP; (4) higher incomes -> less poverty or better health and education (either is enough). Optional: the aggregate supply shift. Key reasons: (i) lower costs and risk attract foreign firms; (ii) more capital and new technology raise output per worker; (iii) exports add to aggregate demand through (X - M).",
      3: "Rounded figures are acceptable if correct. The 774% inflation figure is context, not required. Evidence must be tied back to trade or FDI (criterion c).",
      4: "The limitation must be the one framed in the model topic sentence: uneven distribution and/or reliance on foreign-owned exporters. Either half alone is acceptable. Environmental damage, debt or corruption is a different limitation (criterion a fails).",
      5: "The judgement must answer 'evaluate' (how effective). 'Development' or 'living standards' must appear alongside growth to echo the question.",
    },
    limitation: {
      tag: "inequality",
      topicPhrase: "uneven distribution of gains",
      evaluationPhrase: "concentrated among rural residents and ethnic minorities",
    },
    // Figures checked against the sources in docs/y12-economics-paragraph-writing-research.md for
    // the marker pilot on 4 Nov 2026. TODO(T015): re-verify the poverty-rate figures against the
    // World Bank release before launch, then update this date.
    figuresVerified: "2026-11-04",
  },
  {
    essayId: "e02",
    economyType: "developing",
    strategy:
      "Export-oriented growth through the ready-made garment industry, using preferential access to EU and US markets and export processing zones.",
    brief: {
      economy:
        "Bangladesh, a developing economy. Strategy: export-oriented growth through the ready-made garment industry, using duty-free or low-tariff access to EU and US markets and export processing zones.",
      argument:
        "Joining global garment supply chains has greatly increased growth, export earnings and jobs for women, and has reduced poverty.",
      counterpoint:
        "Exports are concentrated in one industry, so growth depends on overseas buyers, and low wages and unsafe factories limit how much workers' lives improve.",
      chainSteps: [
        "Duty-free or low-tariff access to EU and US markets, very low labour costs and export processing zones",
        "Bangladesh becomes the cheapest place to make labour-intensive clothing (comparative advantage)",
        "Overseas brands place orders with local factories, and factories expand",
        "Millions of low-skilled workers, mostly women, get factory jobs",
        "Export earnings rise, so net exports and total spending rise and real GDP grows",
        "Household incomes, especially women's, rise, so poverty falls and families spend more on health and education",
      ],
      facts: [
        "Garments were 3.89% of exports in FY1984 and 84.58% in FY2022-23 (BGMEA / Export Promotion Bureau).",
        "Garment exports earned US$46.99 billion in FY2022-23.",
        "Textile, apparel and leather employed 4.44 million people in 2022; 57.7% were women.",
        "The national poverty rate fell from 24.3% in 2016 to 18.7% in 2022 (Bangladesh Bureau of Statistics).",
      ],
      limitation: [
        "With garments over four-fifths of exports, a fall in orders from EU and US buyers hits export earnings and jobs directly.",
        "Competition for orders keeps wages low: a minimum wage of about US$113 a month against an estimated living wage of about US$460.",
        "The 2013 Rana Plaza factory collapse showed how unsafe many factories were.",
      ],
    },
    uses: USES,
    guidance: GUIDANCE,
    models: {
      1: "While integration into global garment supply chains has significantly increased Bangladesh's economic growth and reduced poverty, the impact of globalisation on development has been limited by heavy export concentration and low wages and unsafe working conditions.",
      2: "Preferential access to EU and US markets, combined with low labour costs and export processing zones, gave Bangladesh a comparative advantage in labour-intensive garment production. Consequently, transnational buyers placed orders with local factories, which expanded and employed millions of low-skilled workers, mostly women. Rising export revenue increased net exports (X - M), thereby lifting aggregate demand and real GDP. As a result, higher household incomes, particularly women's earnings, reduced poverty and supported spending on health and education, raising economic development.",
      3: "Integration into global garment markets transformed Bangladesh's export structure: garments rose from 3.89% of exports in FY1984 to 84.58% in FY2022-23, earning US$46.99 billion. This expansion employed 4.44 million textile and apparel workers in 2022, 57.7% of them women, thereby channelling export income to low-income households. Consequently, the national poverty rate fell from 24.3% in 2016 to 18.7% in 2022, reflecting gains in economic development.",
      4: "However, the developmental impact of globalisation has been limited. Because garments generate 84.58% of export earnings, any fall in orders from EU and US buyers directly reduces export revenue and employment, leaving growth highly vulnerable to external shocks. Moreover, competition for orders suppresses wages, with a minimum wage of about US$113 a month against an estimated US$460 living wage, while the 2013 Rana Plaza collapse exposed unsafe conditions. These limitations significantly qualify, though do not negate, the development gains.",
      5: "Therefore, globalisation has had a significant positive impact on Bangladesh's economic growth and poverty reduction, though its contribution to development has been substantially qualified by export concentration and low wages and unsafe working conditions.",
    },
    commentary: {
      1: "judges the impact with “significantly”, names growth and poverty as the outcomes, and frames the counterpoint with “While … limited by”.",
      2: "market access and low labour costs lead to a comparative advantage, orders, jobs and (X - M); each link has its reason and there are no figures.",
      3: "each figure is followed by what it shows, and the jobs figure is tied to who gains, women and low-income households.",
      4: "stays on export concentration and low wages and unsafe conditions, explains why each limits the gains, and weighs how far.",
      5: "a judgement of degree answering “assess”, weighing the gains against the limits and adding nothing new.",
    },
    markingNotes: {
      1: "'Assess' needs a judgement of how significant the impact has been. Accept 'export-oriented industrialisation' or 'the garment export industry' as the name of the strategy, and growth, poverty or development as the outcome.",
      2: "Accept AD/AS or the AD equation as the model. Required links: (1) market access and low labour costs -> comparative advantage -> overseas orders; (2) orders -> factory expansion -> jobs for low-skilled workers, mostly women; (3) higher exports -> net exports (X - M) / aggregate demand -> real GDP; (4) higher incomes -> less poverty or better health and education (either is enough). Key reasons: (i) low labour costs and duty-free access make Bangladesh the cheapest place to make clothes, so orders come; (ii) garment making is labour-intensive, so it absorbs low-skilled workers; (iii) exports add to aggregate demand through (X - M).",
      3: "Rounded figures are acceptable if correct. The jobs figure should be tied to who benefits (women, low-income households), and the poverty figure to development.",
      4: "The limitation must be export concentration (vulnerability) and/or low wages and unsafe conditions, as framed in the model topic sentence. Environmental damage from dyeing and textiles is a different limitation (criterion a fails).",
      5: "The judgement must answer 'assess' (how significant the impact). Growth and development should both be named to echo the question.",
    },
    limitation: {
      tag: "external-shocks",
      topicPhrase: "heavy export concentration",
      evaluationPhrase: "any fall in orders from EU and US buyers",
    },
    // Checked for the marker pilot on 4 Nov 2026 against the sources in
    // docs/y12-economics-paragraph-writing-research.md. TODO(T068): re-verify the poverty rates, the
    // minimum and living wage figures and the garment shares against their sources before launch.
    figuresVerified: "2026-11-04",
  },
];

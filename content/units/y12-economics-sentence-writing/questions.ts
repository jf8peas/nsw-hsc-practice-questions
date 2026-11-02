import type { Question, RewriteQuestion } from "@/lib/types";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync by
// scripts/validate-content.ts.
//
// Original sentence-writing questions for HSC Economics Topic 1 (2009 syllabus). Each shows a
// plain-English sentence the student rewrites as ONE concise sentence using the target terms.
// Authoring rule (FR-024): every idea in the model sentence is already in the plain sentence;
// the model adds precision and terminology, never new facts. Terms map to the unit's concepts
// (FR-031), so each question carries several `concepts`. 61 questions, group "rewrite", 3
// marks each; a quiz draws 5.

const U = "y12-economics-sentence-writing";
const p2 = (n: number) => String(n).padStart(2, "0");

type Slugs = [string, string] | [string, string, string];

function rw(n: number, prompt: string, termSlugs: Slugs): RewriteQuestion {
  const conceptId = (slug: string) => `${U}.c-${slug}`;
  return {
    id: `${U}.r${p2(n)}`,
    group: "rewrite",
    type: "rewrite",
    prompt,
    maxMarks: 3,
    concepts: termSlugs.map(conceptId),
  };
}

const q: Array<[string, Slugs]> = [
  // --- globalisation cluster ---
  ["Countries are buying and selling more stuff with each other, and big companies now make things in lots of different countries, so the world's economies are getting more and more tied together.", ["globalisation", "trade-in-goods-and-services", "transnational-corporations"]],
  ["If you add up everything produced by every country in the world in a year, that total tells you how big the whole world's set of economies is.", ["global-economy", "gross-world-product"]],
  ["The world's total production is the sum of every country's output, and it keeps growing as countries sell more goods and services to each other across borders.", ["gross-world-product", "trade-in-goods-and-services", "global-economy"]],
  ["Money is moving across borders more than ever, and that flow of money is one of the big reasons the world's economies are so connected now.", ["globalisation", "financial-flows"]],
  ["Big firms that make things in many countries shift money between their operations all over the world.", ["transnational-corporations", "financial-flows"]],
  ["When many economies boom and slump at the same time, the whole world's set of economies rises and falls together.", ["international-business-cycle", "global-economy"]],
  ["More cross-border buying and selling means a slowdown in one country quickly spreads to its trading partners.", ["trade-in-goods-and-services", "international-business-cycle"]],
  ["Countries should focus on making the things they are relatively best at and swap with each other, with no artificial barriers in the way.", ["free-trade", "comparative-advantage", "specialisation"]],
  ["A place can beat another place at making something because it gives up less of other things to make it, so it should concentrate on making that thing and get the rest by trading.", ["comparative-advantage", "specialisation"]],
  ["Without tariffs or quotas in the way, each country can focus on what it does best and buy the rest from abroad.", ["free-trade", "specialisation"]],
  ["If trade faces no artificial barriers, each country makes the goods it makes with the least sacrifice and swaps for the rest, so everyone ends up better off.", ["comparative-advantage", "free-trade"]],
  ["A formal group of member governments works to get countries to lower their trade barriers step by step, moving the world toward fewer restrictions on trade.", ["international-organisation", "trade-liberalisation", "free-trade"]],
  ["Cutting trade barriers bit by bit is how the world gets closer to trade with no artificial barriers at all.", ["trade-liberalisation", "free-trade"]],
  ["World leaders meet informally to talk about coordinating policy and pushing for fewer trade barriers, which is quite different from a formal body with set roles and rules.", ["government-economic-forum", "international-organisation", "trade-liberalisation"]],
  ["Leaders of the big economies meet informally to try to stop their booms and slumps from hitting every economy at the same time.", ["government-economic-forum", "international-business-cycle"]],
  ["A set of countries agreed to cut the trade rules just among themselves, and the deal they signed lets them trade with few or no barriers.", ["trading-bloc", "free-trade-agreement"]],
  ["A group of countries that cut barriers among themselves now buys and sells more goods and services with each other than before.", ["trading-bloc", "trade-in-goods-and-services"]],
  ["A deal between two countries to trade with few or no barriers is negotiated under the formal rules of an international body and is one step in cutting trade barriers.", ["free-trade-agreement", "trade-liberalisation", "international-organisation"]],
  ["Groups of countries that cut barriers among their members are one of the ways the world's economies become more connected.", ["trading-bloc", "globalisation"]],

  // --- protection cluster ---
  ["The government shelters local industry from foreign competition by putting a tax on goods coming in from overseas.", ["protection", "tariff"]],
  ["A tax on goods bought from abroad made those goods pricier, so people bought more from firms making things at home.", ["tariff", "imports", "domestic-producers"]],
  ["The government restricts how much foreign-made stuff can come in, with a strict cap on the quantity allowed.", ["quota", "imports"]],
  ["The government pays local firms a bit of money so their production costs fall.", ["subsidy", "domestic-producers"]],
  ["Putting a cap on how many imports may enter the country is one way the government protects local industry from foreign competition.", ["protection", "quota"]],
  ["Giving local producers money so their costs fall keeps foreign competition from hurting them.", ["protection", "subsidy"]],
  ["A new industry that is not yet big enough to stand up to foreign competition gets looked after by the government until it can compete on its own.", ["infant-industry", "protection"]],
  ["A young industry that cannot yet compete is helped by a tax on the imported goods it competes with.", ["infant-industry", "tariff"]],
  ["Governments either tax imported goods or cap how much can come in, and both are ways to protect home industries.", ["tariff", "quota"]],
  ["The government gives money to a young industry so it can grow until it competes on its own, which is one way of sheltering local firms from foreign competition.", ["subsidy", "infant-industry", "protection"]],
  ["Firms at home lose sales to goods from overseas when the foreign products are cheaper.", ["domestic-producers", "imports"]],

  // --- growth and development ---
  ["A country's total real output went up, but people's lives did not broadly improve, because the extra income was not spread around.", ["economic-growth", "economic-development", "environmental-sustainability"]],
  ["Output per person in a country rose, yet how well people actually live — their health, education and income — may not have improved at the same time.", ["economic-growth", "economic-development", "quality-of-life"]],
  ["How well people live in a country, across health, education and income, is a much broader idea than just how much money comes in.", ["quality-of-life", "economic-development"]],
  ["A low-income country with weak industry can raise its total real output, but that alone does not fix all its problems.", ["economic-growth", "developing-economy"]],
  ["Improving living standards in a poor country means better health, education and incomes, not just more money in total.", ["economic-development", "developing-economy"]],
  ["A poor country with weak factories and bad schools is starting to make things and get richer quickly, so it is becoming something more than just a poor country.", ["developing-economy", "emerging-economy"]],
  ["A middle-income country that is industrialising quickly shifts its workers between industries as it builds the diversified, high-income structure of a rich economy.", ["emerging-economy", "advanced-economy", "structural-change"]],
  ["The gap between low-income countries with weak industry and high-income countries with productive, diversified economies remains huge.", ["developing-economy", "advanced-economy"]],
  ["The world's more connected economies grow faster, but that growth must not harm the ability of future generations to meet their own needs.", ["environmental-sustainability", "globalisation"]],
  ["Improving living standards must not come at the cost of future generations being able to meet their own needs.", ["environmental-sustainability", "economic-development"]],
  ["As the world's economies become more connected, resources and jobs move from making things toward doing services, and old industries shrink.", ["structural-change", "globalisation"]],
  ["Moving resources between industries can raise total real output when workers shift from low-productivity to high-productivity jobs.", ["structural-change", "economic-growth"]],
  ["A country got richer by selling a lot of its goods to the rest of the world, and this broadly improved people's living standards.", ["export-led-growth", "economic-development"]],
  ["Growing by selling into world markets needs open access to those markets, and it must not harm future generations' ability to meet their needs.", ["export-led-growth", "free-trade", "environmental-sustainability"]],
  ["A country that grows by selling abroad wants that growth to show up in better health, education and incomes for its people.", ["export-led-growth", "quality-of-life"]],

  // --- fillers / balancing questions ---
  ["Formal bodies with set roles and rules, and informal summits of leaders, both shape how the global economy is governed, but they work very differently.", ["international-organisation", "government-economic-forum"]],
  ["Money moving between countries carries booms and slumps across borders, so many economies rise and fall together.", ["financial-flows", "international-business-cycle"]],
  ["Money moving across borders helps pay for the production that makes up the world's total output, tying the global economy together.", ["financial-flows", "gross-world-product", "global-economy"]],
  ["When the total output of the whole world rises from year to year, that is real growth for the world as a whole.", ["gross-world-product", "economic-growth"]],
  ["Big companies that produce in more than one country are a huge part of the web of trade, money and investment that makes up the world's economies.", ["transnational-corporations", "global-economy"]],
  ["Some groups of countries go further than a simple deal and cut barriers among themselves on many products, building their trade relationship through formal agreements.", ["trading-bloc", "free-trade-agreement"]],
  ["A deal to trade freely between two countries removes the import taxes they used to charge each other.", ["free-trade-agreement", "tariff"]],
  ["Capping how much foreign product can enter the country gives local firms a bigger share of the market.", ["quota", "domestic-producers"]],
  ["When the world's many economies boom together, a country buys more from abroad, so the goods it brings in rise and fall with the cycle.", ["imports", "international-business-cycle"]],
  ["The government pays local producers so their goods are cheaper at home and they can compete, including the young industries getting started.", ["subsidy", "domestic-producers", "infant-industry"]],
  ["Big cross-border firms split up the production jobs between different countries, so each country does the part of the job it does best.", ["specialisation", "transnational-corporations"]],
  ["A country that gives up little to make a good should concentrate on making it and trade for the rest, which leaves the whole world better off than if every country made everything.", ["specialisation", "comparative-advantage"]],
  ["Growing by selling a lot to the rest of the world raises a country's total real output and gives it the resources to make people's lives better.", ["export-led-growth", "economic-growth", "quality-of-life"]],
  ["A fast-industrialising middle-income country shifts resources between its industries as it builds toward the diversified structure of a rich economy.", ["emerging-economy", "structural-change", "advanced-economy"]],
  ["A middle-income economy that industrialises quickly grows its total real output fast, building toward the productive structure of a high-income country.", ["emerging-economy", "economic-growth", "advanced-economy"]],
  ["When world leaders meet informally to coordinate policy, that coordination is itself part of how economies become more connected.", ["government-economic-forum", "globalisation"]],
];

export const questions: Question[] = q.map(([prompt, terms], i) => rw(i + 1, prompt, terms));

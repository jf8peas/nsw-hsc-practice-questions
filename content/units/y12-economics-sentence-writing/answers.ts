import type { Answer, AnswerSet, RewriteTargetTerm } from "@/lib/types";

// Answer key for y12-economics-sentence-writing. NO "server-only" import here (the validator
// reads it); only re-exported via content/answers/index.ts, which is server-only. Never import
// from a client component.
//
// Per question: one or two model sentences, 1-3 target terms (term, concept id, one-line
// definition, why it fits this sentence, accepted equivalents and listed misuses) and marking
// notes. Authoring rule (FR-024): every idea in the model sentence is already in the plain
// sentence in questions.ts; spelling and usage are exact (FR-025).

const U = "y12-economics-sentence-writing";
const p2 = (n: number) => String(n).padStart(2, "0");

/** One target term library entry: term text, one-line definition, equivalents and misuses. */
interface TermDef {
  term: string;
  definition: string;
  equivalents?: string[];
  misuses?: string[];
}

const TERMS: Record<string, TermDef> = {
  "global-economy": { term: "global economy", definition: "All the world's economies and the trade, money and investment links between them.", equivalents: ["world economy"], misuses: ["the world's GDP", "globalisation"] },
  "gross-world-product": { term: "Gross World Product", definition: "The total value of everything produced in the world in a year.", equivalents: ["world GDP", "world output"], misuses: ["world trade", "GDP of one country"] },
  globalisation: { term: "globalisation", definition: "The growing connection of economies through trade, money, investment, technology and people.", equivalents: ["economic integration", "international economic integration"], misuses: ["only about trade", "westernisation"] },
  "trade-in-goods-and-services": { term: "trade in goods and services", definition: "Buying and selling physical goods and services across borders.", equivalents: ["international trade", "merchandise and services trade"], misuses: ["only goods", "financial flows"] },
  "financial-flows": { term: "financial flows", definition: "Short- and long-term movements of money between countries.", equivalents: ["capital flows", "cross-border finance"], misuses: ["trade", "foreign aid"] },
  "transnational-corporations": { term: "transnational corporations", definition: "Firms that produce or operate in more than one country.", equivalents: ["multinational corporations", "multinationals"], misuses: ["any large firm", "international organisation"] },
  "international-business-cycle": { term: "international business cycle", definition: "Many economies booming and slowing at the same time.", equivalents: ["global business cycle", "synchronised cycle"], misuses: ["regional business cycle", "structural trend growth"] },
  "free-trade": { term: "free trade", definition: "Trade with no artificial barriers like tariffs or quotas.", equivalents: ["open trade", "liberalised trade"], misuses: ["fair trade", "protection"] },
  "comparative-advantage": { term: "comparative advantage", definition: "Producing a good at a lower opportunity cost than another country.", equivalents: ["relative cost advantage"], misuses: ["absolute advantage", "cheaper wages", "cheaper"] },
  specialisation: { term: "specialisation", definition: "Concentrating production on what a country does best and trading for the rest.", misuses: ["division of labour", "self-sufficiency"] },
  "international-organisation": { term: "international organisation", definition: "A formal body of member governments with set roles and rules.", misuses: ["government economic forum", "trading bloc"] },
  "trade-liberalisation": { term: "trade liberalisation", definition: "Reducing barriers to trade between countries.", equivalents: ["trade barrier reduction", "opening markets"], misuses: ["free trade", "protection"] },
  "government-economic-forum": { term: "government economic forum", definition: "An informal meeting of leaders to coordinate policy, with no binding rules.", equivalents: ["economic forum", "leaders' summit"], misuses: ["trading bloc", "international organisation"] },
  "trading-bloc": { term: "trading bloc", definition: "A group of countries that cut trade barriers among themselves.", equivalents: ["preferential trade agreement", "regional trade agreement"], misuses: ["monetary union", "economic forum"] },
  "free-trade-agreement": { term: "free trade agreement", definition: "A deal between countries to trade with few or no barriers.", equivalents: ["trade agreement", "preferential agreement"], misuses: ["customs union", "APEC"] },
  protection: { term: "protection", definition: "Government measures that shelter local producers from foreign competition.", equivalents: ["protectionism", "trade barriers"], misuses: ["free trade", "a single method"] },
  tariff: { term: "tariff", definition: "A tax on imported goods that raises their price.", equivalents: ["import tax", "customs duty"], misuses: ["quota", "subsidy"] },
  quota: { term: "quota", definition: "A limit on the quantity of a good that may be imported.", equivalents: ["import limit", "quantity restriction"], misuses: ["tariff", "subsidy"] },
  subsidy: { term: "subsidy", definition: "A government payment to local producers that lowers their costs.", equivalents: ["producer payment", "government assistance"], misuses: ["tariff", "welfare payment"] },
  "domestic-producers": { term: "domestic producers", definition: "Firms that make goods inside the home country.", equivalents: ["local producers", "domestic firms", "home industry"], misuses: ["domestic consumers", "exporters"] },
  imports: { term: "imports", definition: "Goods and services bought from other countries.", equivalents: ["foreign goods", "goods from abroad"], misuses: ["exports", "domestic goods"] },
  "infant-industry": { term: "infant industry", definition: "A young industry protected until it can compete on its own.", equivalents: ["sunrise industry"], misuses: ["any small firm"] },
  "economic-growth": { term: "economic growth", definition: "An increase in a country's real output (real GDP).", equivalents: ["rise in real GDP", "rise in real income"], misuses: ["economic development"] },
  "economic-development": { term: "economic development", definition: "A broad improvement in living standards and well-being, not just income.", equivalents: ["improvement in living standards", "rise in quality of life"], misuses: ["economic growth", "HDI"] },
  "quality-of-life": { term: "quality of life", definition: "How well people live, including health, education and income.", equivalents: ["living standards", "well-being"], misuses: ["income"] },
  "developing-economy": { term: "developing economy", definition: "A low-income economy with weak industry and poor health and education.", equivalents: ["less-developed economy", "low-income economy"], misuses: ["emerging economy", "poor country"] },
  "emerging-economy": { term: "emerging economy", definition: "A middle-income economy industrialising quickly.", equivalents: ["newly industrialising economy"], misuses: ["developing economy", "advanced economy"] },
  "advanced-economy": { term: "advanced economy", definition: "A high-income economy with a diversified, productive structure.", equivalents: ["developed economy", "high-income economy"], misuses: ["emerging economy"] },
  "environmental-sustainability": { term: "environmental sustainability", definition: "Meeting today's needs without harming future generations' ability to meet theirs.", equivalents: ["ecologically sustainable development", "ESD"], misuses: ["economic growth", "renewable energy"] },
  "structural-change": { term: "structural change", definition: "The shift of resources between industries as an economy changes.", equivalents: ["industrial restructuring", "reallocation of resources"], misuses: ["cyclical change", "unemployment"] },
  "export-led-growth": { term: "export-led growth", definition: "Growing an economy by selling into world markets.", equivalents: ["export-oriented growth", "export-oriented industrialisation"], misuses: ["import substitution"] },
};

interface QKey {
  /** Model sentence(s): 1-2 accepted versions. */
  model: string[];
  /** One-line "why it fits" per target term, in the question's term order. */
  why: string[];
  /** Optional prose marking notes. */
  notes?: string;
}

const KEY: Record<string, QKey> = {
  r01: { model: ["Increased trade in goods and services and the spread of transnational corporations are deepening globalisation."], why: ["names the growing connection of economies", "names the cross-border buying and selling", "names the firms operating across borders"] },
  r02: { model: ["Gross World Product measures the total output of the global economy."], why: ["names the world's set of economies", "names the world's total production"] },
  r03: { model: ["Gross World Product, the total output of the global economy, grows with trade in goods and services."], why: ["names the world's total production", "names the cross-border buying and selling", "names the world's set of economies"] },
  r04: { model: ["Growing financial flows are a major driver of globalisation."], why: ["names the growing connection of economies", "names the cross-border money movements"] },
  r05: { model: ["Transnational corporations move financial flows across borders."], why: ["names the firms operating across borders", "names the cross-border money movements"] },
  r06: { model: ["The international business cycle means many economies, and the global economy as a whole, boom and slump together."], why: ["names economies booming and slowing at the same time", "names the world's set of economies"] },
  r07: { model: ["Expanded trade in goods and services transmits the international business cycle between countries."], why: ["names the cross-border buying and selling", "names economies moving together"] },
  r08: { model: ["Free trade lets countries specialise according to comparative advantage."], why: ["names trade with no artificial barriers", "names producing at lower opportunity cost", "names concentrating on what a country does best"] },
  r09: { model: ["A country with a comparative advantage should specialise in producing that good."], why: ["names producing at lower opportunity cost", "names concentrating on one good and trading for the rest"] },
  r10: { model: ["Free trade allows each country to specialise in what it does best."], why: ["names trade with no artificial barriers", "names concentrating on what a country does best"] },
  r11: { model: ["Under free trade, each country produces according to its comparative advantage and gains from exchange."], why: ["names trade with no artificial barriers", "names producing at lower opportunity cost"] },
  r12: { model: ["International organisations pursue trade liberalisation toward free trade."], why: ["names the formal body of member governments", "names reducing trade barriers", "names trade with no artificial barriers"] },
  r13: { model: ["Trade liberalisation moves economies closer to free trade."], why: ["names reducing trade barriers", "names trade with no artificial barriers"] },
  r14: { model: ["A government economic forum encourages trade liberalisation without the binding rules of an international organisation."], why: ["names the informal leaders' meeting", "names the formal body with set rules", "names reducing trade barriers"] },
  r15: { model: ["Government economic forums try to soften the international business cycle."], why: ["names the informal leaders' meetings", "names economies booming and slowing together"] },
  r16: { model: ["A free trade agreement is the simplest form of trading bloc."], why: ["names the group cutting barriers among members", "names the deal to trade with few barriers"] },
  r17: { model: ["A trading bloc increases trade in goods and services among its members."], why: ["names the group cutting barriers among members", "names the cross-border buying and selling"] },
  r18: { model: ["Free trade agreements negotiated within international organisations advance trade liberalisation."], why: ["names the deal to trade with few barriers", "names reducing trade barriers", "names the formal body of member governments"] },
  r19: { model: ["Trading blocs contribute to globalisation by cutting barriers among members."], why: ["names the groups cutting barriers among members", "names the growing connection of economies"] },
  r20: { model: ["A tariff is a form of protection that raises the price of imports."], why: ["names sheltering local producers from foreign competition", "names the tax on imported goods"] },
  r21: { model: ["A tariff makes imports dearer, so consumers buy more from domestic producers."], why: ["names the tax on imported goods", "names goods bought from abroad", "names firms making goods at home"] },
  r22: { model: ["A quota limits the quantity of imports."], why: ["names the cap on imported quantity", "names goods bought from abroad"] },
  r23: { model: ["A subsidy lowers the production costs of domestic producers."], why: ["names the government payment that lowers costs", "names firms making goods at home"] },
  r24: { model: ["A quota is a protectionist measure that restricts imports."], why: ["names sheltering local producers from foreign competition", "names the cap on imported quantity"] },
  r25: { model: ["Subsidies are a form of protection for local producers."], why: ["names the government payments that lower costs", "names sheltering local producers from foreign competition"] },
  r26: { model: ["An infant industry is protected until it can compete without assistance."], why: ["names the young industry sheltered until it can compete", "names the sheltering of local producers"] },
  r27: { model: ["A tariff can shelter an infant industry from import competition."], why: ["names the young industry sheltered until it can compete", "names the tax on imported goods"] },
  r28: { model: ["Tariffs and quotas are both barriers that reduce imports."], why: ["names the tax on imported goods", "names the cap on imported quantity"] },
  r29: { model: ["A subsidy supports an infant industry, a form of protection, until it can compete."], why: ["names the government payment that lowers costs", "names the young industry sheltered until it can compete", "names the sheltering of local producers"] },
  r30: { model: ["Cheaper imports displace sales of domestic producers."], why: ["names firms making goods at home", "names goods bought from abroad"] },
  r31: { model: ["Economic growth does not guarantee economic development, which must respect environmental sustainability."], why: ["names the rise in real output", "names the broad improvement in living standards", "names not harming future generations"] },
  r32: { model: ["Economic growth only improves economic development and quality of life if the gains are broadly shared."], why: ["names the rise in real output", "names the broad improvement in living standards", "names how well people live"] },
  r33: { model: ["Quality of life, a broader measure than income, is the goal of economic development."], why: ["names how well people live", "names the broad improvement in living standards"] },
  r34: { model: ["Economic growth in a developing economy can raise real output without ending poverty."], why: ["names the rise in real output", "names the low-income economy with weak industry"] },
  r35: { model: ["Economic development raises living standards in a developing economy."], why: ["names the broad improvement in living standards", "names the low-income economy with weak industry"] },
  r36: { model: ["A developing economy that industrialises rapidly becomes an emerging economy."], why: ["names the low-income economy with weak industry", "names the middle-income economy industrialising quickly"] },
  r37: { model: ["An emerging economy undergoes structural change as it approaches the diversity of an advanced economy."], why: ["names the middle-income economy industrialising quickly", "names the high-income diversified economy", "names the shift of resources between industries"] },
  r38: { model: ["The development gap between developing and advanced economies remains large."], why: ["names the low-income economy with weak industry", "names the high-income diversified economy"] },
  r39: { model: ["Globalisation-led growth must respect environmental sustainability."], why: ["names the growing connection of economies", "names not harming future generations"] },
  r40: { model: ["Economic development should be consistent with environmental sustainability."], why: ["names the broad improvement in living standards", "names not harming future generations"] },
  r41: { model: ["Globalisation drives structural change from manufacturing toward services."], why: ["names the growing connection of economies", "names the shift of resources between industries"] },
  r42: { model: ["Structural change toward more productive industries supports economic growth."], why: ["names the shift of resources between industries", "names the rise in real output"] },
  r43: { model: ["Export-led growth can raise economic development."], why: ["names growing by selling into world markets", "names the broad improvement in living standards"] },
  r44: { model: ["Export-led growth needs free trade and should respect environmental sustainability."], why: ["names growing by selling into world markets", "names trade with no artificial barriers", "names not harming future generations"] },
  r45: { model: ["Export-led growth should also improve quality of life."], why: ["names growing by selling into world markets", "names how well people live"] },
  r46: { model: ["An international organisation has binding rules, unlike a government economic forum."], why: ["names the formal body with set roles and rules", "names the informal leaders' meeting"] },
  r47: { model: ["Financial flows transmit the international business cycle across economies."], why: ["names the cross-border money movements", "names economies booming and slowing together"] },
  r48: { model: ["Financial flows help finance the production counted in Gross World Product across the global economy."], why: ["names the cross-border money movements", "names the world's total production", "names the world's set of economies"] },
  r49: { model: ["An increase in Gross World Product reflects global economic growth."], why: ["names the world's total production", "names the rise in real output"] },
  r50: { model: ["Transnational corporations integrate the global economy."], why: ["names the firms operating across borders", "names the world's set of economies"] },
  r51: { model: ["A trading bloc may be built on a series of free trade agreements."], why: ["names the group cutting barriers among members", "names the deals to trade with few barriers"] },
  r52: { model: ["A free trade agreement eliminates tariffs between its partners."], why: ["names the deal to trade with few barriers", "names the tax on imported goods"] },
  r53: { model: ["Quotas protect domestic producers from import competition."], why: ["names the cap on imported quantity", "names firms making goods at home"] },
  r54: { model: ["Imports rise and fall with the international business cycle."], why: ["names goods bought from abroad", "names economies booming and slowing together"] },
  r55: { model: ["Subsidies help domestic producers, including infant industries, compete until they can stand alone."], why: ["names the government payments that lower costs", "names firms making goods at home", "names the young industries sheltered until they can compete"] },
  r56: { model: ["Transnational corporations organise specialisation across countries."], why: ["names the firms operating across borders", "names concentrating production on what each does best"] },
  r57: { model: ["Specialisation according to comparative advantage raises total world output."], why: ["names concentrating production on what a country does best", "names producing at lower opportunity cost"] },
  r58: { model: ["Export-led growth raises real output and can improve quality of life."], why: ["names growing by selling into world markets", "names the rise in real output", "names how well people live"] },
  r59: { model: ["An emerging economy undergoing structural change approaches an advanced economy in diversity."], why: ["names the middle-income economy industrialising quickly", "names the shift of resources between industries", "names the high-income diversified economy"] },
  r60: { model: ["Rapidly industrialising emerging economies grow toward advanced economy status."], why: ["names the middle-income economies industrialising quickly", "names the rise in real output", "names the high-income diversified economies"] },
  r61: { model: ["Government economic forums are part of the machinery of globalisation."], why: ["names the informal leaders' meetings", "names the growing connection of economies"] },
};

/** The concept id for a term slug. */
const c = (slug: string) => `${U}.c-${slug}`;

export const answers: AnswerSet = Object.fromEntries(
  Object.entries(KEY).map(([n, k]) => {
    const question = questionsFor(n);
    const targetTerms: RewriteTargetTerm[] = question.map((slug, i) => {
      const t = TERMS[slug]!;
      return {
        conceptId: c(slug),
        term: t.term,
        definition: t.definition,
        why: k.why[i] ?? "",
        equivalents: t.equivalents ?? [],
        misuses: t.misuses ?? [],
      };
    });
    const answer: Answer = {
      modelSentences: k.model,
      targetTerms,
      // the three 3-mark criteria, one per mark (FR-013)
      rubric: [
        "Meaning and the cause and effect of the original are kept and correct",
        "Every target term is used, and used correctly (all or nothing)",
        "Concise within 25 words with no padding",
      ],
      ...(k.notes ? { markingNotes: k.notes } : {}),
    };
    return [`${U}.${n}`, answer];
  }),
);

/** The term slugs of a question, in order (mirrors questions.ts). */
import { questions } from "./questions";
function questionsFor(n: string): string[] {
  const q = questions.find((x) => x.id === `${U}.${n}`);
  if (!q || q.type !== "rewrite") return [];
  const idx = new Map(q.concepts!.map((id, i) => [id, i]));
  return (q.concepts ?? [])
    .map((id) => id.replace(`${U}.c-`, ""))
    .sort((a, b) => (idx.get(c(a)) ?? 0) - (idx.get(c(b)) ?? 0));
}

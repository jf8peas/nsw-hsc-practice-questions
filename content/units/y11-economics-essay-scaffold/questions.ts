import type { Question, ShortQuestion } from "@/lib/types";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Original 20-mark essay prompts for Year 11 Preliminary Economics (Government
// and the Economy / Financial Markets), written to the current NESA syllabus.
// The student writes a five-part SCAFFOLD, not a full essay.
//
// 34 questions in the bank, group "essay", 5 marks each (1 per scaffold part).
// A quiz draws 3 — 11 non-repeating attempts.

const U = "y11-economics-essay-scaffold";
const p2 = (n: number) => String(n).padStart(2, "0");

const SCAFFOLD_TASK =
  "\n\nWrite a scaffold (plan) for this 20-mark essay. For each of the five parts below, " +
  "write 2–4 sentences setting out what you would include — the key terms, the economic " +
  "theory or diagram, any real-world evidence, and the analysis:\n" +
  "1. Introduction — your thesis and the key terms you will define\n" +
  "2. Body 1 — Point 1: the core economic concept or context\n" +
  "3. Body 2 — Point 2: the primary impact or economic mechanism (cause and effect)\n" +
  "4. Body 3 — Point 3: the trade-offs, limitations or conflicting objectives\n" +
  "5. Conclusion — how you synthesise the argument and restate the thesis";

function essay(n: number, prompt: string): ShortQuestion {
  return {
    id: `${U}.e${p2(n)}`,
    group: "essay",
    type: "short",
    prompt: prompt + SCAFFOLD_TASK,
    maxMarks: 5,
  };
}

const essayQuestions: ShortQuestion[] = [
  // --- Limitations of the free market / market failure ---
  essay(1, "Explain the limitations of the free market in allocating resources efficiently and equitably. Discuss the case for government intervention to address these limitations."),
  essay(2, "Market failure occurs when the price mechanism does not lead to an efficient allocation of resources. Analyse the main types of market failure and evaluate the role of the Australian government in correcting them."),
  essay(3, "Negative externalities from production, such as pollution and carbon emissions, impose costs on society that are not reflected in market prices. Explain how negative externalities lead to market failure and assess the effectiveness of taxes and regulation as government responses."),
  essay(4, "Explain why public goods, such as national defence and street lighting, are not adequately provided by private markets. Discuss how and why the Australian government provides these goods."),
  essay(5, "Explain how asymmetric information and the abuse of market power can each cause market failure. Discuss the ways the government intervenes to address them."),

  // --- Economic roles of government ---
  essay(6, "The Australian government performs the economic functions of reallocation, redistribution and stabilisation. Explain these functions and analyse the policy tools the government uses to carry them out."),
  essay(7, "Assess the role of the Australian government in redistributing income. In your answer, refer to the tax and transfer system and the trade-off between equity and efficiency."),
  essay(8, "Discuss the arguments for and against government intervention to achieve a more equitable distribution of income in Australia."),
  essay(9, "Explain the difference between economic efficiency and economic equity. Discuss the trade-offs the Australian government faces when it pursues both objectives."),

  // --- The federal Budget / fiscal policy ---
  essay(10, "Explain what is meant by the Budget outcome and the Budget stance. With recent Australian Budgets balancing cost-of-living relief against a return to surplus, discuss the trade-offs a government faces when deciding whether to run a surplus or a deficit."),
  essay(11, "With the federal Budget under growing pressure from spending on health, aged care, the NDIS, defence and interest on government debt, analyse the choices the government faces in framing a Budget and the effects of those choices on the economy."),
  essay(12, "Explain how changes in government spending (G) and taxation (T) affect the level of economic activity through the circular flow of income. Discuss the limitations of using the Budget to stabilise the economy."),
  essay(13, "Cost-of-living relief measures — such as energy bill rebates, cheaper medicines, rent assistance and tax cuts — have been a central feature of recent Australian Budgets. Analyse the economic effects of cost-of-living relief and evaluate the trade-offs involved."),
  essay(14, "Explain the difference between discretionary fiscal policy and automatic (non-discretionary) fiscal policy. Discuss the role of automatic stabilisers in smoothing fluctuations in economic activity."),

  // --- Taxation ---
  essay(15, "Explain the purposes of taxation in the Australian economy. Discuss the features of a 'good' tax and the trade-off between equity and efficiency in tax design."),
  essay(16, "Distinguish between direct and indirect taxes and between progressive, proportional and regressive taxes. Analyse the effect of Australia's tax mix on the distribution of income."),
  essay(17, "There have been repeated calls to reform Australia's tax system, including changes to income tax, the rate and base of the GST, and superannuation tax concessions. Discuss the case for tax reform and the political and economic obstacles to achieving it."),
  essay(18, "Analyse how 'bracket creep' affects taxpayers and government revenue over time, and discuss why governments periodically adjust income tax thresholds."),

  // --- Government spending ---
  essay(19, "Explain the difference between recurrent and capital government spending, and between government purchases and transfer payments. Discuss the factors that influence the Australian government's spending priorities."),
  essay(20, "Discuss the economic arguments for the Australian government investing in infrastructure, and the trade-offs involved in funding this investment."),

  // --- The RBA and monetary policy ---
  essay(21, "Explain the role of the Reserve Bank of Australia and how it uses the cash rate to influence the economy. Analyse the effects of a cash rate increase on households, businesses and the wider economy."),
  essay(22, "With inflation remaining above the Reserve Bank of Australia's 2–3% target band at around 3.5–3.8%, and the cash rate held at 4.35%, explain why the RBA has kept monetary policy restrictive and analyse the effects of this stance on the Australian economy."),
  essay(23, "Explain how a change in the cash rate is transmitted through the economy to affect consumer spending, business investment, the exchange rate and inflation. Discuss why monetary policy operates with a time lag."),
  essay(24, "Analyse the effects of a decrease in the cash rate on the Australian economy, referring to borrowers, savers, the exchange rate, asset prices and the level of economic activity."),
  essay(25, "Discuss the strengths and limitations of monetary policy as a tool for managing the level of economic activity in Australia."),

  // --- Inflation and the cost of living ---
  essay(26, "Explain what is meant by inflation and outline its main causes. Analyse the effects of persistently high inflation on different groups in the Australian economy."),
  essay(27, "'Sticky' services inflation, together with strong growth in rents, insurance premiums and other administered prices, has kept Australian inflation elevated. Explain why some prices are slower to fall than others, and discuss the challenge this creates for the Reserve Bank."),
  essay(28, "Analyse the distributional effects of the recent cost-of-living crisis in Australia — how rising prices and higher interest rates have affected renters, mortgage holders, low-income earners and retirees differently."),

  // --- Interest rates and housing affordability ---
  essay(29, "Explain the relationship between interest rates and housing affordability. With house prices and rents high relative to incomes, discuss the effectiveness of government and central bank policy in improving housing affordability."),
  essay(30, "Analyse the demand-side and supply-side factors that have contributed to declining housing affordability in Australia, and evaluate possible policy responses."),

  // --- Fiscal and monetary policy together ---
  essay(31, "Assess the effectiveness of monetary policy and fiscal policy in stabilising fluctuations in economic activity in Australia. In your answer, consider how the two policies can reinforce or work against each other."),
  essay(32, "During a period of above-target inflation and slowing growth, the Reserve Bank tightens monetary policy while the government continues to provide cost-of-living support. Analyse the tension between fiscal and monetary policy in this situation."),

  // --- Financial markets ---
  essay(33, "Examine the contribution of financial markets and financial intermediaries to the economic welfare of individuals and firms in the Australian economy. Discuss why the financial sector is regulated."),
  essay(34, "Examine the role of Australia's financial regulators — the Reserve Bank of Australia, APRA and ASIC — and discuss why the regulation of financial markets is necessary."),
];

export const questions: Question[] = [...essayQuestions];

import type { Question, ShortQuestion } from "@/lib/types";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Original 20-mark essay prompts for Year 11 Preliminary Economics (Government
// and the Economy / Financial Markets), written to the current NESA syllabus.
// The student writes a five-part SCAFFOLD, not a full essay.
//
// 68 questions in the bank, group "essay", 5 marks each (1 per scaffold part).
// A quiz draws 3 — 22 non-repeating attempts.

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

// ==========================================================================
// EXPANSION — competition & labour, welfare & equity, fiscal governance,
// monetary policy & central bank governance, inflation & productivity,
// housing, financial regulation, and exchange rate / trade policy.
// ==========================================================================

const essayQuestionsMore: ShortQuestion[] = [
  // --- Government & market failure extensions ---
  essay(35, "Examine the role of competition policy and the Australian Competition and Consumer Commission (ACCC) in preventing the abuse of market power. Discuss the trade-offs involved in regulating mergers and anti-competitive conduct."),
  essay(36, "Carbon emissions are a classic negative externality. Analyse the case for a carbon price or emissions reduction scheme as a policy response, and evaluate the economic trade-offs involved in transitioning away from fossil fuels."),
  essay(37, "Discuss the economic arguments for and against government ownership of essential services with natural-monopoly characteristics (such as electricity networks or water utilities), compared with privatisation."),
  essay(38, "The rise of the 'gig economy' has raised questions about whether platform workers are adequately protected by Australia's labour market regulations. Discuss the economic arguments for and against extending stronger protections to gig workers."),

  // --- Equity, welfare and the labour market ---
  essay(39, "Assess whether Australia's social safety net — including JobSeeker and the minimum wage — adequately addresses poverty and hardship, and discuss the trade-offs involved in making it more generous."),
  essay(40, "Analyse the likely economic effects of a significant increase in the minimum wage on employment, business costs and income inequality."),
  essay(41, "Discuss the concept of intergenerational equity in Australian economic policy, with reference to government debt, housing affordability and superannuation."),
  essay(42, "Examine the role of compulsory superannuation in providing for Australians' retirement incomes, and discuss the equity and efficiency issues raised by superannuation tax concessions."),

  // --- Fiscal policy and Budget governance ---
  essay(43, "Assess whether the level of Australian Government debt is a cause for economic concern, considering the trend in the debt-to-GDP ratio and the cost of servicing that debt."),
  essay(44, "Explain the process of horizontal fiscal equalisation and the distribution of GST revenue among the states and territories. Discuss the economic arguments for and against this system."),
  essay(45, "Examine the use of public-private partnerships (PPPs) to fund major infrastructure projects in Australia, and evaluate the economic advantages and risks of this funding model compared with direct government funding."),
  essay(46, "Discuss the economic case for the government saving a share of resource-related revenue in a sovereign wealth (future) fund, rather than spending it immediately."),
  essay(47, "Explain how the roles of the Australian Treasury (fiscal policy) and the Reserve Bank of Australia (monetary policy) differ, and analyse the risks that arise when the two policies pull in different directions."),

  // --- Monetary policy and central bank governance ---
  essay(48, "Following the 2023 Review of the Reserve Bank of Australia, significant reforms were made to how monetary policy decisions are made. Discuss the reasons for these reforms and their likely effects on the conduct of monetary policy."),
  essay(49, "Examine the role of macroprudential regulation (such as APRA's lending standards) in managing risks in the housing and credit markets, and discuss how it complements monetary policy."),
  essay(50, "During the COVID-19 pandemic, the Reserve Bank of Australia used unconventional monetary policy tools, including quantitative easing and a Term Funding Facility. Explain these tools and evaluate their effects on the Australian economy."),
  essay(51, "Discuss why central bank independence is considered important for the effective conduct of monetary policy, and evaluate the arguments for and against granting the Reserve Bank of Australia full independence from government."),
  essay(52, "Explain how Australia's floating exchange rate operates and discuss the costs and benefits of a floating exchange rate compared with a fixed exchange rate."),

  // --- Inflation, wages and productivity ---
  essay(53, "Analyse the relationship between wage growth, productivity growth and inflation, and explain why the Reserve Bank monitors wage growth closely when setting monetary policy."),
  essay(54, "Discuss whether Australia faces a significant risk of a 'wage-price spiral', and evaluate the policy options available to prevent one from developing."),
  essay(55, "Distinguish between demand-side and supply-side causes of inflation, and analyse why the appropriate policy response differs depending on the cause."),
  essay(56, "Examine the importance of productivity growth for raising long-run living standards in Australia, and discuss possible reasons for Australia's recent weak productivity performance."),

  // --- Housing and property markets ---
  essay(57, "Government schemes such as first-home buyer grants and deposit guarantees aim to help people into home ownership. Discuss whether such demand-side measures help or worsen housing affordability, given that housing supply is price-inelastic."),
  essay(58, "Examine the economic arguments for and against reforming negative gearing and the capital gains tax discount as a way of improving housing affordability in Australia."),
  essay(59, "Assess the effectiveness of planning and zoning reform as a supply-side solution to Australia's housing affordability crisis, compared with demand-side policies."),

  // --- Financial markets and regulation extensions ---
  essay(60, "The growth of 'buy now, pay later' services and other fintech products has changed how Australians borrow and spend. Discuss the economic benefits of these innovations and the regulatory challenges they raise."),
  essay(61, "Examine the economic risks posed by cryptocurrencies and other digital assets, and discuss the case for and against stronger government regulation of this market."),
  essay(62, "Explain the purpose of a bank levy on the profits or liabilities of major financial institutions, and evaluate the economic arguments for and against such a tax."),
  essay(63, "Explain the purpose of deposit guarantee arrangements, such as Australia's Financial Claims Scheme, and discuss how they help maintain confidence in the financial system while creating a risk of moral hazard."),
  essay(64, "Examine the role of the Foreign Investment Review Board (FIRB) in regulating foreign investment in Australia, and discuss the economic arguments for and against restricting foreign ownership of Australian assets."),

  // --- Exchange rate, trade and international linkages to domestic policy ---
  essay(65, "Analyse the effects of a volatile Australian dollar on businesses, consumers and government policy, and discuss the options available to reduce the economic disruption this volatility causes."),
  essay(66, "Australia's Budget revenue is heavily influenced by commodity export prices. Analyse the risks this dependence poses for fiscal policy, and discuss strategies the government could use to manage this risk."),
  essay(67, "Examine the economic arguments for free trade and the arguments used to justify protecting domestic industries from international competition, with reference to a specific Australian industry."),
  essay(68, "Analyse the economic effects of high net overseas migration on housing demand, wage growth and government spending on infrastructure and services, and discuss the policy trade-offs involved in setting migration levels."),
];

export const questions: Question[] = [...essayQuestions, ...essayQuestionsMore];

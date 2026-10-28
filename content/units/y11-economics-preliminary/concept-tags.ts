import { defineTags } from "../../concept-helpers";

import { concepts } from "./concepts";

// PUBLIC — the concept each question tests (spec 002). "m" = multiple choice, "s" = short answer.

export const conceptOfQuestionId = defineTags("y11-economics-preliminary", concepts, {
  "scarcity-opportunity-cost": ["m01", "m02", "m51", "s01", "s51"],
  "factors-of-production": ["m03", "m04", "s09"],
  "economic-systems": ["m05", "m24", "m58", "s03", "s08", "s58"],
  ppf: ["m06", "m52", "s02", "s52"],
  "positive-normative": ["m53", "s53"],
  "behavioural-economics": ["m57", "s07", "s57"],
  "circular-flow": ["m07", "m08", "m54", "m55", "s04", "s05", "s54", "s55"],
  "business-cycle-growth": ["m09", "m56", "s06", "s56"],

  "demand-supply-equilibrium": ["m10", "m11", "m12", "m59", "s10", "s59"],
  "normal-inferior-goods": ["m23", "s22", "s69"],
  "elasticity-demand": ["m13", "m14", "s11", "s12", "s18"],
  "elasticity-supply": ["m60", "s60"],
  "market-structures": ["m15", "m16", "m61", "m62", "s13", "s61"],
  externalities: ["m17", "m63", "m91", "s14", "s62", "s91"],
  "public-merit-goods": ["m18", "m64", "s15", "s64"],
  "market-failure-intervention": ["m19", "m65", "s16", "s17", "s44", "s63", "s65"],
  "allocative-efficiency": ["m66", "m67", "s66"],

  utility: ["m20", "m68", "s19", "s67"],
  "consumption-saving": ["m21", "m22", "m69", "m70", "s20", "s21", "s68"],
  profit: ["m25", "m74", "s24"],
  "costs-economies-scale": ["m26", "m71", "m72", "s26", "s70"],
  "labour-demand-supply": ["m27", "m28", "m76", "s23", "s27", "s28", "s73", "s74", "s75"],
  productivity: ["m75", "s25", "s72"],

  "financial-intermediaries": ["m29", "m78", "m82", "s33", "s78"],
  "risk-return": ["m79", "m83", "m84", "s77"],
  "share-market-asx": ["m30", "m81", "s31", "s76", "s81"],
  "debt-equity-finance": ["m34", "m73", "m77", "s32", "s71", "s80"],
  "rba-role": ["m31", "s34"],
  "interest-rates": ["m32", "m33", "m35", "m80", "s29", "s30", "s35", "s79", "s83"],
  superannuation: ["m36", "s36", "s82"],

  "govt-economic-roles": ["m37", "m88", "m89", "s37", "s90"],
  "taxation-types": ["m38", "m39", "m40", "m41", "m87", "s38", "s39", "s86"],
  "good-tax-equity": ["m42", "m92", "s40", "s88"],
  "transfer-redistribution": ["m43", "s42", "s43", "s87"],
  "fiscal-policy": ["m85", "m86", "s84", "s85"],
  "budget-balance": ["m44", "m90", "s41", "s89"],

  "trade-benefits": ["m45", "m50", "s45", "s95"],
  "trade-balance-bop": ["m46", "m49", "m93", "s46", "s49", "s92"],
  "exchange-rate": ["m47", "m94", "m95", "s47", "s93", "s100"],
  "foreign-investment": ["m48", "s48", "s50", "s98"],
  protection: ["m96", "m97", "m98", "s94", "s97"],
  "terms-of-trade": ["m99", "s96"],
  globalisation: ["m100", "s99"],
});

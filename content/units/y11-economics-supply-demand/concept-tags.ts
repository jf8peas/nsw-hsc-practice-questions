import { defineTags } from "../../concept-helpers";

import { concepts } from "./concepts";

// PUBLIC — the concept each question tests (spec 002). "m" = multiple choice, "s" = diagram
// short answer, "q" = written short answer.

export const conceptOfQuestionId = defineTags("y11-economics-supply-demand", concepts, {
  "demand-supply-laws": ["m01", "m02", "m03", "m04", "q07", "q08", "q09", "q10"],
  "movement-vs-shift": ["m05", "m06", "m41", "m42", "m43", "m44", "m85", "m86", "m87", "m88", "q04", "q05", "q06", "q70", "q75"],
  "equilibrium-adjustment": ["m24", "m25", "m26", "m38", "m99", "m100", "m108", "q11", "q12", "q13", "q77", "q78"],
  "price-mechanism-functions": ["m35", "m36", "m37", "q01", "q02", "q03", "q20", "q72"],
  "equilibrium-single-shift": ["m27", "m28", "m29", "m30", "m31", "m32", "m33", "m34"],
  "equilibrium-double-shift": ["m101", "m102", "m103", "m104", "m105", "m106", "m107", "m110", "m111", "m112", "q76"],
  "demand-determinants-general": ["m12", "m15", "m40", "q14", "q15", "q73"],
  "demand-income": ["m09", "m10", "m90", "m91", "s01", "s16", "s24"],
  "demand-related-goods": ["m07", "m08", "m14", "m92", "m93", "m109", "s04", "s12", "s20", "s21", "s27", "s28", "s38", "s66", "s68", "s76", "s77", "s81", "s96", "q71"],
  "demand-tastes-population": ["m13", "m95", "s03", "s09", "s10", "s18", "s22", "s31", "s35", "s65", "s67", "s72", "s75", "s79", "s84", "s85", "s88", "s90", "s93", "s95"],
  "demand-expectations": ["m11", "m94", "s08", "s15", "s33", "s37", "s92", "q79"],
  "supply-determinants-general": ["m23", "m39", "q74"],
  "supply-costs-technology": ["m16", "m17", "m89", "m96", "s02", "s05", "s11", "s17", "s23", "s29", "s39", "s40", "s50", "s69", "s74", "s78", "s91", "s94"],
  "supply-sellers-conditions": ["m19", "m21", "m97", "s07", "s13", "s19", "s25", "s30", "s34", "s36", "s70", "s71", "s73", "s80", "s82", "s83", "s86", "s87", "s89"],
  "supply-expectations": ["m22", "m98", "s26", "q80"],
  "ped-calculation": ["m45", "m46", "m47", "m113", "m114", "q16", "q23", "q28", "q41", "q48"],
  "ped-determinants": ["m51", "m52", "m53", "m115", "m116", "m125", "m126", "q17", "q26", "q43", "q45", "q47"],
  "total-revenue": ["m48", "m49", "m50", "m117", "m118", "q18", "q21", "q22", "q27", "q44", "q69"],
  "price-elasticity-supply": ["m54", "m55", "m56", "m119", "m120", "m121", "m122", "q19", "q24", "q25", "q42", "q46"],
  "price-ceilings": ["m57", "m59", "m65", "m127", "m128", "m134", "m136", "s41", "s45", "s49", "s97", "s101", "s105", "q29", "q49", "q52"],
  "price-floors": ["m58", "m64", "m84", "m130", "m137", "s42", "s46", "s98", "s103", "q30", "q51"],
  "indirect-tax-incidence": ["m18", "m60", "m61", "m63", "m123", "m124", "m131", "m132", "m133", "m139", "m140", "s14", "s32", "s43", "s47", "s99", "s102", "s106", "q31", "q50", "q53", "q54"],
  "subsidies": ["m20", "m62", "m66", "m135", "m138", "s06", "s44", "s48", "s100", "s104", "q32", "q55"],
  "labour-demand": ["m68", "m71", "m73", "m141", "m146", "m150", "m153", "s52", "s53", "s57", "s58", "s108", "s110", "s111", "s117", "q57", "q59", "q61"],
  "labour-supply": ["m72", "m142", "m143", "m144", "m145", "m149", "s54", "s55", "s107", "s109", "s112", "s113", "s116", "q36", "q60"],
  "wage-equilibrium": ["m67", "m70", "m74", "m147", "m151", "m152", "m154", "s56", "s115", "q33", "q34", "q35", "q56", "q62"],
  "minimum-wage": ["m69", "m148", "s51", "s114", "q58"],
  "housing-supply-side": ["m75", "m80", "m156", "m161", "m166", "m168", "s61", "s121", "s127", "q37", "q64", "q67"],
  "housing-demand-side": ["m76", "m77", "m81", "m83", "m129", "m155", "m160", "m162", "m164", "s59", "s60", "s64", "s118", "s123", "s125", "q39", "q40", "q63", "q66"],
  "commodity-price-volatility": ["m78", "m79", "m82", "m157", "m158", "m159", "m163", "m165", "m167", "s62", "s63", "s119", "s120", "s122", "s124", "s126", "s128", "q38", "q65", "q68"],
});

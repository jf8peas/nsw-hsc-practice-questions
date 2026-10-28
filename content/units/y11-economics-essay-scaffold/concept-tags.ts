import { defineTags } from "../../concept-helpers";

import { concepts } from "./concepts";

// PUBLIC — the concept each essay prompt tests (spec 002); "e01" is question number 1.

export const conceptOfQuestionId = defineTags("y11-economics-essay-scaffold", concepts, {
  "market-failure": ["e01", "e02"],
  externalities: ["e03", "e36"],
  "public-goods": ["e04"],
  "information-market-power": ["e05"],
  "competition-ownership": ["e35", "e37"],
  "govt-role-equity": ["e06", "e07", "e08", "e09", "e39"],
  "federal-budget": ["e10", "e11", "e43", "e44", "e46", "e66"],
  "fiscal-policy": ["e12", "e13", "e14", "e19", "e20", "e45"],
  taxation: ["e15", "e16", "e17", "e18"],
  "monetary-policy": ["e21", "e22", "e23", "e24", "e25", "e32", "e48", "e50", "e51"],
  "stabilisation-policy": ["e31", "e47"],
  inflation: ["e26", "e27", "e28", "e55"],
  "labour-wages-productivity": ["e38", "e40", "e53", "e54", "e56"],
  housing: ["e29", "e30", "e57", "e58", "e59", "e68"],
  "financial-markets": ["e33", "e60", "e61"],
  "financial-regulation": ["e34", "e49", "e62", "e63"],
  "exchange-rate-trade": ["e52", "e64", "e65", "e67"],
  "retirement-intergenerational": ["e41", "e42"],
});

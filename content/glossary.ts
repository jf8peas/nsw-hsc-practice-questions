// PUBLIC — NESA glossary of key words for the directive verbs the paragraph unit uses (spec 007).
// Shared, not essay data. Keys are lower case.

export const GLOSSARY: Record<string, string> = {
  analyse: "identify components and the relationship between them; draw out and relate implications.",
  assess: "make a judgement of value, quality, outcomes, results or size.",
  discuss: "identify issues and provide points for and/or against.",
  evaluate: "make a judgement based on criteria; determine the value of.",
};

export function verbDefinition(verb: string): string | undefined {
  return GLOSSARY[verb.toLowerCase()];
}

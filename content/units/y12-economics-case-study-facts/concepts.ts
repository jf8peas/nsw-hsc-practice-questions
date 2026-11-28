import { defineConcepts } from "../../concept-helpers";

// PUBLIC — one concept per fact group of docs/y12-economics-case-study-facts-research.md (spec 012 FR-022).
// Descriptions state a topic only: no figure, year, name that answers a question or direction of change.
// Which questions carry which concept is in ./concept-tags.ts.

export const concepts = defineConcepts("y12-economics-case-study-facts", [
  ["china-opening-up", "China's steps to open to the world economy, and what each one was for"],
  ["china-growth", "How fast China has grown, with the trade and investment data behind it"],
  ["china-development", "China's development and poverty measures, and what they show about living standards"],
  ["china-targeted-poverty-alleviation", "China's targeted poverty alleviation: its start, method and results"],
  ["china-inequality", "How income is shared in China, and how to read the measures of it"],
  ["china-environment", "China's emissions, climate commitments and environmental policy"],
  ["nepal-strategies", "Nepal's policies, agreements and major events that shape growth and development"],
  ["nepal-growth-trade", "Nepal's economic growth and its trade position"],
  ["nepal-flows", "Remittances, aid and foreign investment, and what they do for Nepal's economy"],
  ["nepal-development", "Nepal's development, poverty and inequality measures"],
  ["nepal-tourism-electricity", "Nepal's tourism and electricity sectors"],
]);

export const retired: Record<string, string | null> = {};

// PUBLIC — safe in the browser bundle. The five parts of a paragraph, their word limits, the
// criterion names and the 17 writing tips (spec 007). No model text, no marking notes: the tips
// and the "how to apply" lines are static, so a tip card can never carry model wording
// (research R13). The marker's criterion TEXT lives in the server-only rubric.json.

import type { PartNo } from "@/lib/types";

export const PARAGRAPH_UNIT_ID = "y12-economics-paragraph-writing";

export const PART_ORDER = ["topic", "mechanism", "evidence", "evaluation", "link"] as const;
export type PartKey = (typeof PART_ORDER)[number];
export type CriterionKey = "a" | "b" | "c" | "d";

export const partKeyOf = (no: PartNo): PartKey => PART_ORDER[no - 1];
export const partNoOf = (key: PartKey): PartNo => (PART_ORDER.indexOf(key) + 1) as PartNo;

/** Per-part word limits (FR-009). */
export const LIMITS: Record<PartKey, number> = {
  topic: 40,
  mechanism: 90,
  evidence: 80,
  evaluation: 90,
  link: 45,
};

export interface CriterionInfo {
  key: CriterionKey;
  /** Short name shown on the result row and the tip card ("Ties every number to what it shows"). */
  short: string;
  /** The tracked tip ids (criterion d has two: precise language, and concise). */
  tipSlugs: string[];
  /** One line: what to do. For d, one line per tip slug, joined at display time. */
  tip: string;
  /** One generic line on applying it; never essay-specific, never model text. */
  apply: string;
}

export interface PartInfo {
  no: PartNo;
  key: PartKey;
  name: string;
  /** Progress bar, dots, history ("Evidence"). */
  short: string;
  limit: number;
  criteria: Record<CriterionKey, CriterionInfo>;
}

const D = (limit: number): CriterionInfo => ({
  key: "d",
  short: "Conventions: precise terms, within the word limit",
  tipSlugs: ["all-precise", "all-concise"],
  tip: "Use precise economic terms in a formal register, and stay within the word limit with no filler.",
  apply: `Swap everyday or slangy wording for the economic term, cut filler such as “it is important to note”, and keep to ${limit} words.`,
});

const c = (key: CriterionKey, part: PartKey, short: string, tip: string, apply: string): CriterionInfo => ({
  key,
  short,
  tipSlugs: [`${part}-${key}`],
  tip,
  apply,
});

export const PARTS: Record<PartKey, PartInfo> = {
  topic: {
    no: 1,
    key: "topic",
    name: "Topic Sentence",
    short: "Topic",
    limit: LIMITS.topic,
    criteria: {
      a: c("a", "topic", "Takes a position, with words of degree",
        "State how well the strategy worked, using words of degree such as “highly effective” or “limited success”.",
        "Add a phrase of degree to your verdict instead of only saying what the strategy did."),
      b: c("b", "topic", "Names the strategy and the outcome",
        "Name both the strategy and the outcome it affects (growth, poverty or development), not just that it “succeeded”.",
        "Check your sentence names the strategy and the specific outcome from the brief."),
      c: c("c", "topic", "Frames the counterpoint",
        "Frame the counterpoint up front: “While X has…, its impact has been limited by…”.",
        "Use while, although or despite to signal the limitation the brief gives you."),
      d: D(LIMITS.topic),
    },
  },
  mechanism: {
    no: 2,
    key: "mechanism",
    name: "Theoretical Mechanism",
    short: "Mechanism",
    limit: LIMITS.mechanism,
    criteria: {
      a: c("a", "mechanism", "Complete chain, in order",
        "Include every link of the chain in order, from the strategy to the final outcome.",
        "Compare your steps with the brief’s chain steps and fill any gap."),
      b: c("b", "mechanism", "States the economic reasons",
        "Give the economic reason behind each link, not just “consequently”.",
        "For each step, say why it follows from the one before."),
      c: c("c", "mechanism", "Names the model, stays on theory",
        "Name the economic model (such as AD/AS or AD = C + I + G + (X − M)) and keep figures and drawbacks out.",
        "Move any figure or drawback to a later part and name the economic model that explains the chain."),
      d: D(LIMITS.mechanism),
    },
  },
  evidence: {
    no: 3,
    key: "evidence",
    name: "Evidence & Application",
    short: "Evidence",
    limit: LIMITS.evidence,
    criteria: {
      a: c("a", "evidence", "Specific indicators, each with its year",
        "Use specific figures, each with its year or period.",
        "Replace words like “sharply” with the figure and year from the brief."),
      b: c("b", "evidence", "Ties every number to what it shows",
        "Tie every number to what it shows; no data dumping.",
        "After each figure, add a few words on what it shows."),
      c: c("c", "evidence", "Connects the evidence back to the mechanism",
        "Show the evidence proves the mechanism actually happened.",
        "Name the strategy or its channel, and tie each figure to a step in the chain."),
      d: D(LIMITS.evidence),
    },
  },
  evaluation: {
    no: 4,
    key: "evaluation",
    name: "Evaluation & Limitation",
    short: "Evaluation",
    limit: LIMITS.evaluation,
    criteria: {
      a: c("a", "evaluation", "Discusses the limitation the topic sentence framed",
        "Discuss the same limitation the topic sentence framed.",
        "Re-read the model Topic Sentence above and use the brief’s limitation that matches it."),
      b: c("b", "evaluation", "Explains why it limits the strategy",
        "Explain why the limitation reduces the strategy’s effect, not just that it exists.",
        "Add the economic reason the limitation cuts into the gains."),
      c: c("c", "evaluation", "Weighs how much it limits",
        "Weigh how much it limits the strategy: “partially offsets”, “qualifies but does not negate”.",
        "Say how far the limitation reduces the strategy’s success."),
      d: D(LIMITS.evaluation),
    },
  },
  link: {
    no: 5,
    key: "link",
    name: "Linking Judgement",
    short: "Link",
    limit: LIMITS.link,
    criteria: {
      a: c("a", "link", "Gives a judgement that answers the question",
        "Finish with a judgement of degree that answers the question, not a restatement of what was done.",
        "Use the question’s directive verb and a word of degree such as “highly effective”."),
      b: c("b", "link", "Weighs the argument against the counterpoint",
        "Weigh the argument against the counterpoint from the topic sentence.",
        "Say which side is stronger and why, using the argument and the limitation."),
      c: c("c", "link", "Adds nothing new",
        "Add nothing new: no fresh issue, risk or evidence, and echo the question’s wording.",
        "Check every point already appears in the paragraph above or in the brief."),
      d: D(LIMITS.link),
    },
  },
};

// TODO(spec 007 T075): confirm every tip sentence below against the requirements doc (Claude Docs)
// before launch; the wording is drafted from design.md and the marker criteria.
/** The tracked tip texts, keyed by slug. `term` is the bold lead on the unit page row. */
export interface TipInfo {
  slug: string;
  term: string;
  description: string;
  clearAfter: 2 | 3;
}

export const TIPS: TipInfo[] = [
  ...PART_ORDER.flatMap((part) =>
    (["a", "b", "c"] as const).map((k) => ({
      slug: `${part}-${k}`,
      term: PARTS[part].name,
      description: PARTS[part].criteria[k].tip,
      clearAfter: 2 as const,
    })),
  ),
  {
    slug: "all-precise",
    term: "All parts",
    description: "Use precise economic terms in a formal register: no slang, contractions or everyday wording.",
    clearAfter: 3,
  },
  {
    slug: "all-concise",
    term: "All parts",
    description: "Stay within the word limit and cut filler such as “it is important to note”.",
    clearAfter: 3,
  },
];

export const tipConceptId = (slug: string) => `${PARAGRAPH_UNIT_ID}.c-${slug}`;

/** The full concept ids a part's question is tagged with: its three tips and the two all-parts tips. */
export function conceptIdsForPart(part: PartKey): string[] {
  return [
    ...(["a", "b", "c"] as const).map((k) => tipConceptId(`${part}-${k}`)),
    tipConceptId("all-precise"),
    tipConceptId("all-concise"),
  ];
}

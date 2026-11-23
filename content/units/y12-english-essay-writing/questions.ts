import type { EnglishEssayQuestion, Question } from "@/lib/types";

import { conceptId } from "./concepts";

// PUBLIC — no answer keys here. The marking notes, the band 1 model essay and the key concept tags are the
// server-only key in ./answers.ts (constitution Principle I). Ids are `<unit>.e<n>`, never renumbered or reused.
// `offer` is the order the student is offered them (1 to 6). The six questions are verbatim from school trial
// papers (Principle V), so each shows its source; Section II questions are generic and apply to Away as written.
// An essay is `live` only after its content has been reviewed AND the unit's marker gate has passed
// (specs/011-english-essay-writing/quickstart.md §3). A non-live essay is never offered and the server refuses to
// start it. Making an essay non-live never removes stored attempts or results.

const UNIT = "y12-english-essay-writing";

/** Public practice tags: writing skills only. They do not drive progress and are not the answer key's coverage. */
const SKILLS = ["skill-answers-question", "skill-thesis", "skill-analysis-not-recount"].map(conceptId);

const essay = (
  n: 1 | 2 | 3 | 4 | 5 | 6,
  e: Pick<EnglishEssayQuestion, "prompt" | "directive" | "source" | "live">,
): EnglishEssayQuestion => ({
  id: `${UNIT}.e${n}`,
  type: "englishEssay",
  group: "englishEssay",
  maxMarks: 20,
  offer: n,
  conceptIds: SKILLS,
  ...e,
});

export const questions: Question[] = [
  essay(1, {
    prompt:
      "Composers shape texts in memorable ways to illuminate the unique experiences of others. To what extent do you agree with this statement in relation to your prescribed text? In your response make close reference to your prescribed text.",
    directive: "to what extent",
    source: "Knox 2025 Trial, Q6",
    live: false,
  }),
  essay(2, {
    prompt:
      "'Texts illuminate the anomalies in human behaviour and motivation, encouraging the audience to see the world differently.' To what extent does this statement align with your understanding of your prescribed text?",
    directive: "to what extent",
    source: "Pymble 2024 Trial, Q6",
    live: false,
  }),
  essay(3, {
    prompt:
      "Discuss how the composer of your prescribed text makes connections between the audience and the complex lives of others within the play.",
    directive: "discuss",
    source: "Abbotsleigh 2025 Trial, Q6",
    live: false,
  }),
  essay(4, {
    prompt:
      "How does the representation of human experiences in your prescribed text invite you to reconsider your understanding of desire?",
    directive: "how",
    source: "Fort Street 2023 Trial, Q6",
    live: false,
  }),
  essay(5, {
    prompt:
      "While experiences can be unique to individuals, emotions are universal; hence, making the representation of emotions more powerful. Evaluate this statement with detailed reference to your prescribed text.",
    directive: "evaluate",
    source: "Girraween 2025 Trial, Q6",
    live: false,
  }),
  essay(6, {
    prompt:
      "Texts provide a critique of human nature, exposing audiences to the flaws and aspirations of our shared experience. Discuss this statement in relation to your prescribed text.",
    directive: "discuss",
    source: "Barker 2026 Trial, Q6",
    live: false,
  }),
];

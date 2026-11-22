import type { EssayQuestion, Question } from "@/lib/types";

// PUBLIC — no answer keys here. The marking notes, the school's criteria, the band 1 model essay and
// the concept tags are the server-only key in ./answers.ts (constitution Principle I). Ids are
// `<unit>.e<n>`, never renumbered or reused. `offer` is the order the student is offered them
// (1 China, 3 Nepal, 5 both, 2 China, 4 Nepal, 6 both). An essay is `live` only after it has passed
// review AND the unit's marker check (specs/010-economics-essay-writing/quickstart.md §2); a non-live
// essay is never offered, and the server refuses to start it.

const UNIT = "y12-economics-essay-writing";

const essay = (n: 1 | 2 | 3 | 4 | 5 | 6, e: Omit<EssayQuestion, "id" | "type" | "group" | "maxMarks" | "offer">): EssayQuestion => ({
  id: `${UNIT}.e${n}`,
  type: "essay",
  group: "essay",
  maxMarks: 20,
  offer: ({ 1: 1, 3: 2, 5: 3, 2: 4, 4: 5, 6: 6 } as const)[n],
  ...e,
});

export const questions: Question[] = [
  essay(1, {
    prompt: "With reference to an economy other than Australia, explain the role that globalisation has played in their economic growth and development.",
    verb: "explain",
    economy: "china",
    source: "Barker 2024 Trial, Q27",
    live: true,
  }),
  essay(2, {
    prompt: "Assess the effectiveness of the strategies used by an emerging economy you have studied to balance economic growth with environmental sustainability and income equality.",
    verb: "assess",
    economy: "china",
    live: false,
  }),
  essay(3, {
    prompt: "Evaluate the impacts of globalisation on the growth and development of an economy other than Australia.",
    verb: "evaluate",
    economy: "nepal",
    source: "Sydney Boys 2020 Trial, Q27",
    live: true,
  }),
  essay(4, {
    prompt: "Explain the impact of globalisation in achieving economic growth and development on an economy other than Australia.",
    verb: "explain",
    economy: "nepal",
    source: "Abbotsleigh 2025 Trial, Q28",
    live: false,
  }),
  essay(5, {
    prompt: "Evaluate the effectiveness of the strategies used to promote economic growth and development in one emerging and one developing economy you have studied.",
    verb: "evaluate",
    economy: "both",
    live: true,
  }),
  essay(6, {
    prompt: "Assess the extent to which integration into the global economy has improved living standards in one emerging and one developing economy you have studied.",
    verb: "assess",
    economy: "both",
    live: false,
  }),
];

export const ESSAY_UNIT_ID = UNIT;

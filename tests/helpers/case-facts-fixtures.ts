// A synthetic case-facts unit (spec 012) for the rules and draw tests, so they never depend on the real unit. Every
// fact and line here is invented.
//
// 8 questions in each of mc-china, mc-nepal, sa-china, sa-nepal and sa-both, over 13 invented fact groups with three
// facts each (the first of each is ★).

import type { AnswerSet, McQuestion, Question, ShortQuestion, Unit } from "@/lib/types";

const SOURCE = "Original question — case study facts (checked Nov 2026)";

export const FIXTURE_SECTIONS: Array<[economy: "china" | "nepal", letter: string, slug: string]> = [
  ["china", "A", "china-opening-up"],
  ["china", "B", "china-growth"],
  ["china", "C", "china-development"],
  ["china", "D", "china-targeted-poverty-alleviation"],
  ["china", "E", "china-inequality"],
  ["china", "F", "china-environment"],
  ["china", "G", "china-hindrances"],
  ["nepal", "A", "nepal-strategies"],
  ["nepal", "B", "nepal-growth-trade"],
  ["nepal", "C", "nepal-flows"],
  ["nepal", "D", "nepal-development"],
  ["nepal", "E", "nepal-tourism-electricity"],
  ["nepal", "F", "nepal-hindrances"],
];

interface FixtureFact {
  id: string;
  star: boolean;
  economy: "china" | "nepal";
  slug: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

function fixtureFacts(): FixtureFact[] {
  const next = { china: 0, nepal: 0 };
  return FIXTURE_SECTIONS.flatMap(([economy, , slug]) =>
    [0, 1, 2].map((i) => {
      next[economy] += 1;
      return { id: `${economy === "china" ? "C" : "N"}${pad(next[economy])}`, star: i === 0, economy, slug };
    }),
  );
}

function fixtureMarkdown(facts: FixtureFact[]): string {
  const out: string[] = ["# Invented facts", ""];
  for (const economy of ["china", "nepal"] as const) {
    out.push(`## ${economy === "china" ? "China" : "Nepal"} (invented)`, "");
    for (const [e, letter, slug] of FIXTURE_SECTIONS) {
      if (e !== economy) continue;
      out.push(`### ${letter}. Invented section`, "", "| ID | ★ | Fact | When | Exams | Source |", "|---|---|---|---|---|---|");
      for (const f of facts.filter((x) => x.slug === slug)) {
        out.push(`| ${f.id} | ${f.star ? "★" : ""} | Invented widget measure for ${f.slug} | long ago | 1 | [S1] |`);
      }
      out.push("");
    }
  }
  out.push("## Context and impact", "", "One invented line per fact.", "");
  for (const f of facts) out.push(`- **${f.id}** Showed that invented widgets matter.`);
  out.push("", "## Sources", "", "- **S1** An invented source.", "- **S2** A second invented source.", "");
  return out.join("\n");
}

export function buildCaseFactsFixture(id = "fx-facts"): { unit: Unit; answers: AnswerSet; factMarkdown: string } {
  const facts = fixtureFacts();
  const china = facts.filter((f) => f.economy === "china");
  const nepal = facts.filter((f) => f.economy === "nepal");
  const questions: Question[] = [];
  const answers: AnswerSet = {};
  const concept = (f: FixtureFact) => `${id}.c-${f.slug}`;

  const mc = (n: number, group: string, f: FixtureFact) => {
    const qid = `${id}.m${pad(n)}`;
    const q: McQuestion = {
      id: qid,
      group,
      type: "mc",
      source: SOURCE,
      prompt: `Invented multiple choice ${n}`,
      maxMarks: 1,
      options: [`Right choice ${n}`, `Wrong choice ${n}a`, `Wrong choice ${n}b`, `Wrong choice ${n}c`],
      concept: concept(f),
    };
    questions.push(q);
    answers[qid] = {
      correctText: `Right choice ${n}`,
      rubric: [`The invented fact behind multiple choice ${n} (Source S1).`],
      factIds: [f.id],
      wrongExplanations: Object.fromEntries(
        ["a", "b", "c"].map((x) => [`Wrong choice ${n}${x}`, `Invented explanation ${n}${x} of the right fact (Source S1).`]),
      ),
    };
  };

  const sa = (n: number, group: string, used: FixtureFact[], tag: FixtureFact) => {
    const qid = `${id}.s${pad(n)}`;
    const marks = n % 4 === 0 ? 2 : 3;
    const q: ShortQuestion = {
      id: qid,
      group,
      type: "short",
      source: SOURCE,
      prompt: `Invented short answer ${n}`,
      maxMarks: marks,
      concept: concept(tag),
    };
    questions.push(q);
    answers[qid] = {
      modelAnswer: `Invented model answer number ${n}, long enough to be recognisable if it ever leaked.`,
      rubric: Array.from({ length: marks }, (_, i) => `Invented mark point ${i + 1} for short answer ${n}`),
      notes: `Invented notes for short answer ${n}, long enough to be recognisable if they ever leaked.`,
      factIds: used.map((f) => f.id),
    };
  };

  // China facts are used in file order across both China pools, Nepal facts likewise; "both" takes one of each.
  for (let i = 0; i < 8; i++) mc(i + 1, "mc-china", china[i]);
  for (let i = 0; i < 8; i++) mc(i + 9, "mc-nepal", nepal[i]);
  // C17 and C18 are left untested (a rules test stars one of them); C19, the last group's ★ fact, is tested
  const saChina = [8, 9, 10, 11, 12, 13, 15, 18];
  for (let i = 0; i < 8; i++) sa(i + 1, "sa-china", [china[saChina[i]]], china[saChina[i]]);
  for (let i = 0; i < 8; i++) sa(i + 9, "sa-nepal", [nepal[(8 + i) % nepal.length]], nepal[(8 + i) % nepal.length]);
  for (let i = 0; i < 8; i++) sa(i + 17, "sa-both", [china[i], nepal[i]], i % 2 === 0 ? china[i] : nepal[i]);

  const unit: Unit = {
    id,
    year: "Year 12",
    topic: "Fixtures",
    type: "Topic Quiz",
    title: "Case facts fixture",
    description: "An invented case-facts unit.",
    created: "2026-10-01",
    order: 1,
    explanationsComplete: true,
    quiz: {
      short: 3,
      mc: 2,
      passMark: 55,
      drawUnseenFirst: true,
      groups: ["mc-china", "mc-nepal", "sa-china", "sa-nepal", "sa-both"].map((group) => ({ group, n: 1 })),
    },
    questions,
    concepts: FIXTURE_SECTIONS.map(([, , slug]) => ({ id: `${id}.c-${slug}`, description: `Invented idea about ${slug}` })),
    retired: {},
  };

  return { unit, answers, factMarkdown: fixtureMarkdown(facts) };
}

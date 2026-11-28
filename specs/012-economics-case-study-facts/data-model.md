# Data model: Case Study Facts: China and Nepal (spec 012)

No database table, column or stored student field is added. Everything below is content, types or check input.

## 1. Type changes (`lib/types.ts`)

| Type | Field | Release | Public? |
|---|---|---|---|
| `QuizConfig` | `drawUnseenFirst?: boolean`: each group takes a never-answered question while one exists, then the least recently answered. Needs `groups`. | 1 | public |
| `Answer` | `factIds?: string[]`: fact-file IDs the question tests | 1 | **server-only** |
| `Answer` | `conceptNote?: string`: one line, the fact with its figure and year; may end with that fact's impact line; at most 450 characters | 2 | **server-only** |
| `UnitMeta` | `conceptContent?: "key-notes"`: the concept list shows key notes; no AI summaries or pictures | 2 | public |

In memory only: `DrawHistory { lastAnswered: ReadonlyMap<questionId, Date>; missed?: ReadonlySet<conceptId> /* R2 */ }`,
built per request from the session user's own results.

## 2. Unit metadata (`content/units/y12-economics-case-study-facts/meta.ts`)

```ts
import type { UnitMeta } from "@/lib/types";

export const meta: UnitMeta = {
  id: "y12-economics-case-study-facts",
  year: "Year 12",
  topic: "Topic 1: The Global Economy",
  type: "Topic Quiz",
  title: "Case Study Facts: China and Nepal",
  description:
    "HSC Economics Topic 1: The Global Economy case study (2009 syllabus, examined in the 2027 HSC). Drills the China and Nepal facts and data to memorise: each figure or date with its year, and what it shows for growth, development, inequality or the environment, including what has held each economy back. Each attempt draws 2 multiple-choice and 3 short-answer questions covering both economies, and 9 attempts go by without a repeated question. All questions are original and built from facts checked in November 2026; revise the figures before the 2027 HSC.",
  created: "2026-11-30",
  order: 7,
  explanationsComplete: true,
  quiz: {
    short: 3,
    mc: 2,
    passMark: 55,
    drawUnseenFirst: true,
    groups: [
      { group: "mc-china", n: 1 },
      { group: "mc-nepal", n: 1 },
      { group: "sa-china", n: 1 },
      { group: "sa-nepal", n: 1 },
      { group: "sa-both", n: 1 },
    ],
  },
  guide: {
    title: "Three rules",
    items: [
      { label: "Always give the year", text: "A figure without its year or period is only half a fact." },
      { label: "Say what it shows", text: "Link the figure to growth, development, inequality or the environment. Repeating it is not enough." },
      { label: "Never invent a number", text: "If you are not sure of the exact figure, round it. Do not make one up." },
    ],
  },
};
```

Release 2 adds `conceptsReady: true` and `conceptContent: "key-notes"`.

## 3. Concepts (`concepts.ts`, public)

`defineConcepts("y12-economics-case-study-facts", [...])`, so ids are
`y12-economics-case-study-facts.c-<slug>`; `export const retired = {}`.

| Slug | Fact group | Description (public; no digits, no answers) |
|---|---|---|
| `china-opening-up` | China A | China's steps to open to the world economy, and what each one was for |
| `china-growth` | China B | How fast China has grown, with the trade and investment data behind it |
| `china-development` | China C | China's development and poverty measures, and what they show about living standards |
| `china-targeted-poverty-alleviation` | China D | China's targeted poverty alleviation: its start, method and results |
| `china-inequality` | China E | How income is shared in China, and how to read the measures of it |
| `china-environment` | China F | China's emissions, climate commitments and environmental policy |
| `china-hindrances` | China G | What has held China's growth and development back |
| `nepal-strategies` | Nepal A | Nepal's policies, agreements and major events that shape growth and development |
| `nepal-growth-trade` | Nepal B | Nepal's economic growth and its trade position |
| `nepal-flows` | Nepal C | Remittances, aid and foreign investment, and what they do for Nepal's economy |
| `nepal-development` | Nepal D | Nepal's development, poverty and inequality measures |
| `nepal-tourism-electricity` | Nepal E | Nepal's tourism and electricity sectors |
| `nepal-hindrances` | Nepal F | What has held Nepal's growth and development back |

`concept-tags.ts`: `defineTags(U, concepts, { "<slug>": ["m01", "s05", ...] })`, exactly one per question.
`questions.ts` ends `].map((q) => ({ ...q, concept: conceptOfQuestionId[q.id] }))`.

## 4. Questions, groups and default allocation

Ids `…​.m01`–`m18`, `…​.s01`–`s30`. Source on every question:
`Original question — case study facts (checked Nov 2026)` (the dash is U+2014).

This allocation meets FR-010 and FR-011 by construction (44 of 44 ★ facts, 13 of 13 groups, no fact more than 3
times). The content agent may move facts if a question does not work, as long as the rules still pass and the six
slots marked † keep their subject (the marker cases depend on them).

Pool sizes: mc-china 9, mc-nepal 9, sa-china 10, sa-nepal 10, sa-both 10 (48 questions).

| Id | Group | Marks | Facts | Concept slug | Subject |
|---|---|---|---|---|---|
| m01 | mc-china | 1 | C04, C19 | china-opening-up | Belt and Road is international; the rural program is another |
| m02 | mc-china | 1 | C05 | china-opening-up | Made in China 2025: issued when, target year |
| m03 | mc-china | 1 | C02 | china-opening-up | The four Special Economic Zones |
| m04 | mc-china | 1 | C24, C25 | china-inequality | Two Gini measures are not one scale |
| m05 | mc-china | 1 | C19 | china-targeted-poverty-alleviation | Who proposed it, where, when |
| m06 | mc-china | 1 | C16 | china-development | Extreme poverty eradicated by when |
| m07 | mc-china | 1 | C30 | china-environment | National emissions trading scheme |
| m08 | mc-china | 1 | C06 | china-growth | Average growth since reform |
| m09 | mc-nepal | 1 | N09 | nepal-strategies | LDC graduation date |
| m10 | mc-nepal | 1 | N25 | nepal-tourism-electricity | 4,120 MW is all sources |
| m11 | mc-nepal | 1 | N23 | nepal-development | Direction of change in inequality |
| m12 | mc-nepal | 1 | N21, N22 | nepal-development | The two poverty lines |
| m13 | mc-nepal | 1 | N07 | nepal-strategies | IMF Extended Credit Facility |
| m14 | mc-nepal | 1 | N02 | nepal-strategies | The 1992 policy and Act |
| m15 | mc-nepal | 1 | N08 | nepal-strategies | Electricity export agreement with India |
| m16 | mc-nepal | 1 | N17 | nepal-flows | World Bank on remittances and jobs |
| m17 | mc-china | 1 | C32 | china-hindrances | The first US tariffs of the trade war |
| m18 | mc-nepal | 1 | N27 | nepal-hindrances | The Maoist civil war |
| s01 † | sa-china | 3 | C24 | china-inequality | Change in the World Bank Gini |
| s02 | sa-china | 3 | C08 | china-growth | Change in GDP per person |
| s03 † | sa-china | 3 | C27 | china-environment | China's share of world CO2 in the latest year |
| s04 † | sa-china | 3 | C13 | china-development | Change in HDI (rank optional) |
| s05 † | sa-china | 2 | C03 | china-opening-up | WTO entry (date-only fact) |
| s06 | sa-china | 3 | C20 | china-targeted-poverty-alleviation | Change in the rural poverty rate (China's national line) |
| s07 † | sa-china | 3 | C26 | china-inequality | Urban–rural income ratio |
| s08 | sa-china | 3 | C29 | china-environment | The climate pledge: both targets, and the year it was made |
| s09 † | sa-nepal | 3 | N15 | nepal-flows | Change in remittances, share of GDP |
| s10 | sa-nepal | 3 | N10 | nepal-growth-trade | Change in GDP per person |
| s11 | sa-nepal | 3 | N04 | nepal-strategies | Earthquake cost |
| s12 | sa-nepal | 3 | N20 | nepal-development | Change in the national poverty rate |
| s13 | sa-nepal | 3 | N18 | nepal-flows | FDI inflows |
| s14 | sa-nepal | 3 | N24 | nepal-tourism-electricity | Tourist arrivals through COVID (say which years) |
| s15 | sa-nepal | 3 | N13 | nepal-growth-trade | Trade deficit |
| s16 | sa-nepal | 3 | N26 | nepal-tourism-electricity | Electricity exports to India |
| s17 | sa-both | 3 | C13, N19 | nepal-development | Compare HDI |
| s18 | sa-both | 3 | C24, N23 | china-inequality | Compare changes in inequality (own periods) |
| s19 | sa-both | 3 | C07, N11 | china-growth | Compare recent growth (own periods) |
| s20 | sa-both | 3 | C11, N18 | nepal-flows | Compare FDI inflows |
| s21 | sa-both | 3 | C08, N10 | nepal-growth-trade | Compare growth in GDP per person |
| s22 | sa-both | 3 | C01, C14, C15 | china-development | Essay sentence: share of the population in extreme poverty |
| s23 | sa-both | 3 | C28 | china-environment | Essay sentence: emissions per person |
| s24 | sa-both | 2 | C03, N03 | nepal-strategies | Compare WTO entry (date-only facts) |
| s25 | sa-both | 3 | N16 | nepal-flows | Essay sentence: remittance inflows |
| s26 | sa-china | 3 | C34 | china-hindrances | Growth in the COVID-19 lockdown years |
| s27 | sa-china | 3 | C36 | china-hindrances | The shrinking, ageing population |
| s28 | sa-nepal | 3 | N28 | nepal-hindrances | The Indian border blockade |
| s29 | sa-nepal | 3 | N31 | nepal-hindrances | The Gen Z protests |
| s30 | sa-both | 3 | C33, N28 | china-hindrances | Compare trade hindrances: US tariffs and the blockade |

## 5. Answer key shapes (`answers.ts`, `explanations.ts`, server-only)

```ts
// multiple choice
[`${U}.m02`]: { correctText: "…exact option text…", rubric: ["One sentence: the fact (Source S5)."], factIds: ["C05"] },
// short answer: rubric length equals maxMarks
[`${U}.s01`]: { modelAnswer: "…", rubric: ["Figure: …", "Period: …", "What it shows: …"], notes: "…", factIds: ["C24"] },
```

`export const answers = withWrongExplanations(keys, questions, U, explanations);` (two-digit ids, so no width
argument). `explanations.ts`: `{ 2: [["start of wrong option", "The correct fact … (Source S5)."], …] }`.

| Rule | Requirement |
|---|---|
| Three marks | figure or date; year or period; significance |
| Two marks (date-only facts) | event with its correct year; significance. A missing or wrong day or month costs nothing |
| Significance point | from the impact line(s) of the question's fact(s) (§9), in student words; no quantity, ranking or trend taken from a line. The notes also accept another significance the fact file supports, never a restatement or the wrong direction |
| Change over time | both values for the figure point, both years for the period point |
| One year | that value and that year only |
| Comparison | both economies for each of the first two points; each with its own period |
| Model answer | shows the full date where the fact file gives one |
| Two currencies | US dollars first, local currency in brackets, as the fact row; either accepted; a US dollar figure of the wrong size earns nothing |
| Financial years | the financial year as written (`FY2024/25`, also `2024/25`) |

## 6. Fact-check report (`specs/012-economics-case-study-facts/fact-check.md`)

```markdown
# Fact check: Case Study Facts (Release 1)
Checked by: <agent>, <date>. Fact file commit/date: <…>.

## Changed, rounded or not traced
- (every item; "none" if none)

## Coverage
| Fact | ★ | Questions |

## Questions
### s01 · sa-china · 3 marks · C24 · china-inequality
| As written | Where | Fact | Fact file says |
|---|---|---|---|
| 32.2 | model, figure point | C24 | 32.2 → 36.0 |
Names: World Bank (C24). Sources cited: none.
Significance: impact line C24.
Changed or rounded: "about 32" accepted in notes. Not traced: none.
- [ ] Read by maintainer

<!-- script:start -->
(written by npm run case-facts:check; do not edit)
<!-- script:end -->
```

Every short answer has a `Significance:` line: either `impact line C24` (list each line used, for example
`impact lines C24, N23`) or `own significance: <the point>; support: <the fact row, definition or theory in the fact
file>`.

## 7. Marker cases (`specs/012-economics-case-study-facts/marker-cases.json`)

```json
{ "cases": [ { "id": "r1-rounded", "tolerance": "rounded", "questionId": "y12-economics-case-study-facts.s03",
               "answer": "…", "expected": 3 } ] }
```

| Case | Question | Student answer | Expected |
|---|---|---|---|
| r1-rounded | s03 | China produced about a third of the world's carbon dioxide emissions in 2025, which shows its industrial growth has come at a large environmental cost. | 3 |
| r1-year-only | s05 | China joined the World Trade Organization in 2001, which opened export markets to its manufacturers and supported economic growth. | 2 |
| r1-one-end | s01 | China's World Bank Gini coefficient was 36.0 in 2022. | 0 |
| r1-wrong-country | s04 | China's HDI rose from 0.404 in 1990 to 0.622 in 2023. | 1 (period only) |
| r1-wrong-direction | s01 | China's World Bank Gini coefficient fell from 36.0 in 1990 to 32.2 in 2022, so income inequality fell. | 1 (period only) |
| r1-restatement | s09 | Nepal's remittances rose from 1.5% of GDP in 1993 to 32.3% of GDP in 2025. That is an increase from 1.5% to 32.3%. | 2 |
| r1-outside-figure | s07 | China's urban to rural income ratio was 2.8 in 2025. | 1 (year only) |
| r1-other-significance | s09 | Nepal's remittances rose from 1.5% of GDP in 1993 to 32.3% of GDP in 2025. Although they are central to growth, they have not created quality jobs at home. | 3 |
| r1-wrong-significance | s01 | China's World Bank Gini coefficient rose from 32.2 in 1990 to 36.0 in 2022, which shows income inequality in China fell. | 2 |

`r1-other-significance` must give a significance that the fact file supports (here row N17) and that is not the
question's expected point; if the final notes expect this one, change the answer to another supported point.
`r1-wrong-significance` keeps both figures and years correct, so only the last mark is lost.

If a question's final wording asks for something these answers do not address, change the answer, not the principle
being tested, and say so in the fact-check report.

## 8. Concept progress (no change to the model)

Question: **unseen → seen** when a result is saved; it never returns to unseen. Concept (Release 2, derived):
**not listed → listed (3 to go)** on any result below full marks → one less per full-mark answer on that concept →
**cleared** at 0. Release 1 results are replayed by the same rule when Release 2 ships.

## 9. Fact (check input, parsed from the fact file)

| Field | From |
|---|---|
| `id`, `star`, `statement`, `when`, `source`, `sourceNumbers` | the fact's table row |
| `group` | its lettered section (`china-a` … `nepal-f`) |
| impact line | its `- **<ID>** …` bullet under `## Context and impact`, held in the parser's `impact` map keyed by ID |

Rules (the parser throws, naming the ID): exactly one impact line per fact, none for an ID without a fact row, no digit
outside the ID. An impact line is interpretation: it is never a source of a figure, date, name or source number, and
the fact row governs if the two seem to differ. The app does not read the fact file at run time; a line reaches a
student only as text written into the unit's key.


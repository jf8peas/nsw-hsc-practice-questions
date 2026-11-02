# Data Model: Economics Sentence Writing

Phase 1 output. Every change here is additive: existing units, results and queries keep working
unchanged. See `research.md` for the decisions behind each shape.

## Content types (`lib/types.ts`)

```ts
export type UnitType = "Topic Quiz" | "Milestone Test" | "Essay Practice" | "Writing Practice";

interface BaseQuestion {
  // ...existing fields...
  concept?: string;        // unchanged, single-concept units
  concepts?: string[];     // NEW: rewrite questions only — the target terms' concept ids
}

export interface RewriteQuestion extends BaseQuestion {
  type: "rewrite";
}

export type Question = McQuestion | ShortQuestion | RewriteQuestion;

export interface RewriteTargetTerm {
  conceptId: string;   // a concept of the unit (the term IS a concept)
  term: string;        // exact spelling, e.g. "tariff"
  definition: string;  // one line, the concept description
  why: string;         // one line: why this term fits this sentence (shown in the discussion, FR-018)
  equivalents: string[];  // accepted equivalents, e.g. ["import tax", "customs duty"]
  misuses: string[];      // listed misuses, e.g. ["quota"]
}

export interface Answer {
  // ...existing fields...
  modelSentences?: string[];          // NEW, rewrite only: 1-2 accepted versions
  targetTerms?: RewriteTargetTerm[];  // NEW, rewrite only: 1-3, usually 2
  markingNotes?: string;              // NEW, rewrite only: prose marking guidance
}

// `retired` becomes:
retired?: Record<string, string | string[] | null>;
// string  — a removed single-concept question's concept
// string[] — a removed rewrite question's several concepts
// null    — removed before the unit was tagged
```

`content/index.ts` gains `conceptsOfQuestion(unit, questionId): string[]` (question's `concepts`,
else `[concept]`, else the retired value as an array). `conceptOfQuestion` stays for the
single-concept path. The public registry never imports `modelSentences`, `targetTerms` or
`markingNotes`; they live only in `content/answers/index.ts` (server-only) and are read only
through `lib/grading.server.ts`.

## The unit (`content/units/y12-economics-sentence-writing/`)

- `meta.ts`: `id: "y12-economics-sentence-writing"`, `year: "Year 12"`,
  `topic: "Topic 1: The Global Economy"`, `type: "Writing Practice"`, `conceptsReady: true`,
  `quiz: { short: 0, mc: 0, passMark: 60, groups: [{ group: "rewrite", n: 5 }] }`, and a `guide`
  explaining the two phases and the 3-mark criteria (FR-003).
- `questions.ts`: ~60 `RewriteQuestion`s, ids `y12-economics-sentence-writing.r01` … `.r60`,
  `group: "rewrite"`, `maxMarks: 3`, `prompt` = the plain-English sentence, `concepts` = the
  target terms' concept ids. No `source` (all original, Principle V).
- `answers.ts`: per question, `modelSentences` (1-2), `targetTerms` (1-3, usually 2, each with
  `conceptId`, `term`, `definition`, `why`, `equivalents`, `misuses`) and `markingNotes`.
- `concepts.ts`: the 31 tracked terms below, ids `y12-economics-sentence-writing.c-<slug>`,
  descriptions one line (the term definitions). `retired` starts empty.
- `concept-tags.ts`: `defineTags` maps each question number to its several concepts — the helper
  is extended to accept `string[]` values, or the unit uses a small local map; the validator
  checks every `concepts` entry is a concept of the unit.

### The 31 tracked terms (FR-007: each appears in ≥ 4 of ~60 questions)

| Concept id (`y12-economics-sentence-writing.c-…`) | Description (one line) |
|---|---|
| `global-economy` | The global economy: all the world's economies and the trade, money and investment links between them. |
| `gross-world-product` | Gross World Product (GWP): the total value of everything produced in the world in a year. |
| `globalisation` | Globalisation: the growing connection of economies through trade, money, investment, technology and people. |
| `trade-in-goods-and-services` | Trade in goods and services: buying and selling physical goods and services across borders. |
| `financial-flows` | Financial flows: short- and long-term movements of money between countries. |
| `transnational-corporations` | Transnational corporations (TNCs): firms that produce or operate in more than one country. |
| `international-business-cycle` | International business cycle: many economies booming and slowing at the same time. |
| `free-trade` | Free trade: trade with no artificial barriers like tariffs or quotas. |
| `comparative-advantage` | Comparative advantage: producing a good at a lower opportunity cost than another country. |
| `specialisation` | Specialisation: concentrating production on what a country does best and trading for the rest. |
| `international-organisation` | International organisation: a formal body of member governments with set roles and rules. |
| `trade-liberalisation` | Trade liberalisation: reducing barriers to trade between countries. |
| `government-economic-forum` | Government economic forum: an informal meeting of leaders to coordinate policy, with no binding rules. |
| `trading-bloc` | Trading bloc: a group of countries that cut trade barriers among themselves. |
| `free-trade-agreement` | Free trade agreement (FTA): a deal between countries to trade with few or no barriers. |
| `protection` | Protection: government measures that shelter local producers from foreign competition. |
| `tariff` | Tariff: a tax on imported goods that raises their price. |
| `quota` | Quota: a limit on the quantity of a good that may be imported. |
| `subsidy` | Subsidy: a government payment to local producers that lowers their costs. |
| `domestic-producers` | Domestic producers: firms that make goods inside the home country. |
| `imports` | Imports: goods and services bought from other countries. |
| `infant-industry` | Infant industry: a young industry protected until it can compete on its own. |
| `economic-growth` | Economic growth: an increase in a country's real output (real GDP). |
| `economic-development` | Economic development: a broad improvement in living standards and well-being, not just income. |
| `quality-of-life` | Quality of life: how well people live, including health, education and income. |
| `developing-economy` | Developing economy: a low-income economy with weak industry and poor health and education. |
| `emerging-economy` | Emerging economy: a middle-income economy industrialising quickly. |
| `advanced-economy` | Advanced economy: a high-income economy with a diversified, productive structure. |
| `environmental-sustainability` | Environmental sustainability: meeting today's needs without harming future generations' ability to meet theirs. |
| `structural-change` | Structural change: the shift of resources between industries as an economy changes. |
| `export-led-growth` | Export-led growth: growing an economy by selling into world markets. |

Dropped from the 40-term inventory (research R10): international division of labour, regional
business cycle, dispute settlement, monetary union, trade creation, dumping, HDI, Gini
coefficient, income distribution, import substitution, special economic zone. "Imports" is added
(pilot Q3 uses it); "economic growth" is defined as real GDP, not per person.

## Database schema (`lib/db/schema.ts`)

### New table `rewrite_phases` (research R2)

One row per question in a writing-practice attempt, created at phase 1 and kept for the attempt
detail page. Deleted with the student (cascade).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `attempt_id` | uuid NOT NULL | FK `(attempt_id, user_id)` → `attempts(id, user_id)` on delete cascade |
| `user_id` | uuid NOT NULL | FK → `users(id)` on delete cascade |
| `unit_id` | text NOT NULL | |
| `question_id` | text NOT NULL | |
| `status` | text NOT NULL | `phase1` \| `phase2` \| `final` (check) |
| `phase1_answer` | text NOT NULL | the phase 1 sentence |
| `phase1_marks` | smallint NOT NULL | 0-3 |
| `phase1_feedback` | text | shown to the student |
| `phase1_term_outcomes` | jsonb | `Array<{ conceptId, correct }>` from phase 1 |
| `phase1_graded_at` | timestamp NOT NULL | |
| `phase2_answer` | text | null until phase 2 |
| `phase2_marks` | smallint | null until phase 2; 0-2 |
| `phase2_feedback` | text | |
| `phase2_graded_at` | timestamp | |
| `recorded_mark` | smallint | the final mark (best of phase 1 and capped phase 2; phase 1 if phase 2 skipped) |
| `created_at` / `updated_at` | timestamp | |

Constraints: `UNIQUE(attempt_id, question_id)` (idempotency key); check `phase1_marks between 0 and 3`;
check `phase2_marks is null or phase2_marks between 0 and 2`; check `status = 'final'` implies
`recorded_mark is not null`; index `(user_id, unit_id)`.

### New column on `results`

| Column | Type | Notes |
|---|---|---|
| `concept_outcomes` | jsonb, nullable | `Array<{ conceptId: string; correct: boolean }>` — per-term outcomes from phase 1 (or the self-mark ticks). Null for every existing result. |

`results.marks_awarded` holds the recorded mark; `results.answer` holds the final sentence (phase 2
if any, else phase 1). Both sentences and both marks live in `rewrite_phases` for the attempt
detail page.

### Migration

One new Drizzle migration (`npm run db:generate`): create `rewrite_phases` and add
`results.concept_outcomes`. No data backfill: existing rows have `concept_outcomes = null` and
replay exactly as today.

## Phase state machine

```
phase1 (graded 0-3)
  ├─ 3/3  → final (recorded_mark = 3)          [no phase 2]
  ├─ <3   → phase2 (hint shown) → graded 0-2
  │          → final (recorded_mark = max(phase1, phase2))
  │          → phase 2 call fails → self-mark phase 2 → final (best of phase 1 and capped self-mark)
  │          → phase 2 skipped → final (recorded_mark = phase1)
  └─ model fails / cap / db down → self-mark (no phase 2) → final (recorded_mark = self-mark, 0-3)
```

A `results` row is inserted only at `final`. `rewrite_phases.status` guards phase 2 (refused unless
`phase1` and `phase1_marks < 3`) and double taps (idempotent insert/update).

## Concept progress (`lib/concepts/progress.ts`)

`ConceptResult` gains `conceptOutcomes?: Array<{ conceptId: string; correct: boolean }>`.
`conceptProgress` replays a result with `conceptOutcomes` by applying each term in order:
`correct` → count −1 (never below 0); `wrong` → count = 3 and `lastMissedAt` = answeredAt. A result
without `conceptOutcomes` uses the question's current tag exactly as today. `listUnitResultsForProgress`
and `listAllResultsForProgress` select the new column. A removed rewrite question still replays
from its stored `conceptOutcomes`.

## sessionStorage drafts (`lib/drafts.ts`)

- `draft:rewrite:<attemptId>:<questionId>:phase1` and `:phase2` — the typed sentence per phase
  (reuses the existing draft helpers with a phase-qualified key).
- `graded:rewrite:<attemptId>:<questionId>` — the last grade result plus the hint/discussion
  material, so a reload does not lose the phase 2 or discussion step (same pattern as `GradedState`).
- The attempt payload (`attempt:<attemptId>`) is unchanged.

## Logging (FR-044)

One line per grading call: `[rewrite] outcome=<outcome> user=<hmac(userId)> question=<questionId>
duration_ms=<ms> model=<model>`. Outcomes: `graded`, `unparseable`, `model_fail`, `rate_limited`,
`over_allowance`, `already_answered`, `phase_refused`, `db_unavailable`. Never a sentence, model
reply, definition or marking note.

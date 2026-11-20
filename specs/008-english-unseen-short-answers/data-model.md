# Data Model: Advanced English Unseen-Text Short Answers

Shapes for [plan.md](plan.md); the reasons are in [research.md](research.md). TypeScript is shown for
clarity; the files named are where the code goes.

## 1. Content types

### Public (`lib/types.ts`, `lib/unseen/*`, `content/units/y12-english-advanced-unseen-texts/{meta,texts,questions,concepts}.ts`)

```ts
// UnitMeta gains:
draw?: { kind: "unseen-weighted" };     // marks a unit whose quiz is one weighted-random unanswered question

// UnitType: unchanged ("Writing Practice")

// Question union gains:
export type TextForm =
  | "poem" | "prose-fiction" | "non-fiction" | "personal-essay" | "visual" | "drama" | "speech";

export interface UnseenQuestion extends BaseQuestion {
  type: "unseen";
  group: "unseen";
  textId: string;                                   // resolves in the unit's texts
  verb: string;                                     // lower case; a key of rubric.directiveVerbs
  prompt: string;                                   // the question stem (e.g. "Analyse how Hostovsky explores the nature of happiness.")
  parts?: Array<{ label: string; text: string; marks: number }>;   // (a), (b) on the same text, shown together
  maxMarks: number;                                 // 1..6; the sum of parts when present
  suggestedWords: number;                           // answer lines × 12, or the median for the mark value
  suggestedFrom: "lines" | "median";
  paper: { school: string; short: string; year: number; exam: "Trial" | "Half-yearly"; qNo: 1 | 2 | 3 | 4 };
  outcome: "EAV-12-01" | "EAV-12-02" | "EAV-12-04";
  concepts: string[];                               // the 1 to 3 skill concept ids (a tag is not an answer)
  // source (BaseQuestion) = sourceOf(paper) from lib/unseen/source.ts: "Fort St 2025 Trial, Q1"
}

export interface UnseenText {
  id: string;                                       // "fs25-t1": unit-local, never reused
  form: TextForm;
  heading: string;                                  // as on the paper: "Text 1 – Poem"
  title: string;
  author: string;
  sourceLine: string;                               // the paper's credit line for the text
  body:
    | { kind: "poem"; stanzas: string[][]; lineNumbers?: { every: number } }
    | { kind: "prose"; paragraphs: string[] }
    | { kind: "image"; image: string; alt: string };     // image = text id; served by the authenticated route
  footnotes?: Array<{ mark: string; text: string }>;     // the paper's glossary lines
  hscChecked: string;                                // ISO date the text was compared with the NESA HSC papers
}
```

Ids: `y12-english-advanced-unseen-texts.fs25-q1` (the suffix is `<short slug><yy>-q<n>`, equal to the pilot's
case-id prefix). Bank order is the order in `questions.ts`; ids are appended and never renumbered or
reused. `Unit` gains `texts?: UnseenText[]` (public) so the client receives only the text its question
points at (the start response carries the one text, not the registry).

`lib/unseen/skills.json` and `lib/unseen/skills.ts` (public, no key):

```ts
export type SkillId =
  | "answers-question" | "directive-verb" | "analyses-not-retells"
  | "technique-effect" | "apt-evidence" | "human-experience" | "succinct";
export const SKILLS: Array<{ id: SkillId; name: string; tip: string; description: string }>;   // the seven, in rubric order
export const skillConceptId = (id: SkillId) => `y12-english-advanced-unseen-texts.c-${id}`;
```

`lib/unseen/limits.ts` (public, pure): `MIN_WORDS = 20`, `limitsFor`, `lengthState`, `MEDIAN_WORDS`
(research R6).

### Key (server only)

```ts
// lib/types.ts: Answer gains
unseen?: {
  criteria: string;                                  // the school's band descriptors, one "N – …" line per mark
  notes: string;                                     // "None provided by the school." allowed
  model: string;                                     // the example full-mark answer, shown at the discussion
  modelOrigin: "school" | "drafted";
  criteriaOrigin: "school" | "drafted";
  reviewedOn?: string;                               // ISO date; required when either origin is "drafted"
  visual?: {                                         // present iff the question's text is an image
    description: string;                             // the marker's written description (never sent to a browser)
    check: { adequate: boolean; checkedAt: string; promptVersion: string; model: string; samples: number; descriptionHash: string };
  };
};
```

`content/units/.../answers.ts` builds one `Answer` per question: `{ rubric: [], unseen: { …keys, visual? } }`
(`rubric: []` keeps `Answer` valid, as spec 007; the validator's rubric-per-mark rule is skipped for
`type: "unseen"`). The per-text `descriptions.ts` and generated `description-checks.ts` are merged in at
build, so `Answer.unseen.visual` is the only shape the grader reads.

### Marker rubric (server only: `lib/unseen/rubric.json`)

`{ promptVersion, directiveVerbs: Record<string, string>, systemPrompt, userTemplate }`. Read by
`lib/unseen/marker.server.ts` and by `scripts/pilot-unseen-marker.py`. The seven skills are **not** in this
file (they are public, `skills.json`).

## 2. Schema change (`lib/db/schema.ts`, migration `drizzle/0006_*.sql`)

```ts
export interface SkillVerdict { met: boolean; reason: string }                 // reason "" when the marker gave none
export type SkillVerdicts = Record<SkillId, SkillVerdict>;                     // all seven keys present

export const unseenPhases = pgTable("unseen_phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  unitId: text("unit_id").notNull(),
  questionId: text("question_id").notNull(),
  maxMarks: smallint("max_marks").notNull(),               // the question's value when marked
  status: text("status").notNull(),                        // 'try1' | 'final'
  ending: text("ending"),                                  // 'full_marks' | 'retried' | 'declined' | 'no_retry'; null until final
  try1Text: text("try1_text").notNull(),
  try1Mark: smallint("try1_mark").notNull(),               // 0..max_marks
  try1Verdicts: jsonb("try1_verdicts").$type<SkillVerdicts>().notNull(),
  try1Feedback: text("try1_feedback").notNull(),
  try1BiggestGap: text("try1_biggest_gap").notNull(),
  try1GoFurther: text("try1_go_further"),          // nullable; set only for a full-mark first try (migration 0007)
  try1PromptVersion: text("try1_prompt_version").notNull(),
  try1Model: text("try1_model").notNull(),
  try1GradedAt: ts("try1_graded_at").notNull().defaultNow(),
  try2Text: text("try2_text"),
  try2Mark: smallint("try2_mark"),                         // 0..max_marks - 1 (already capped)
  try2Verdicts: jsonb("try2_verdicts").$type<SkillVerdicts>(),
  try2Feedback: text("try2_feedback"),
  try2BiggestGap: text("try2_biggest_gap"),
  try2PromptVersion: text("try2_prompt_version"),
  try2Model: text("try2_model"),
  try2GradedAt: ts("try2_graded_at"),
  recordedMark: smallint("recorded_mark"),                 // set when final
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "unseen_phases_attempt_owner_fk",
    columns: [t.attemptId, t.userId], foreignColumns: [attempts.id, attempts.userId] }).onDelete("cascade"),
  unique("unseen_phases_attempt_question_unique").on(t.attemptId, t.questionId),
  check("unseen_phases_status", sql`${t.status} in ('try1','final')`),
  check("unseen_phases_ending", sql`${t.ending} is null or ${t.ending} in ('full_marks','retried','declined','no_retry')`),
  check("unseen_phases_max", sql`${t.maxMarks} between 1 and 6`),
  check("unseen_phases_try1_mark", sql`${t.try1Mark} between 0 and ${t.maxMarks}`),
  check("unseen_phases_try2_mark", sql`${t.try2Mark} is null or ${t.try2Mark} between 0 and ${t.maxMarks} - 1`),
  check("unseen_phases_try2_shape",
    sql`(${t.try2Text} is null) = (${t.try2Mark} is null) and (${t.try2Text} is null) = (${t.try2Verdicts} is null)`),
  check("unseen_phases_final_shape", sql`${t.status} <> 'final' or (${t.recordedMark} is not null and ${t.ending} is not null)`),
  check("unseen_phases_ending_shape", sql`
    ${t.ending} is null
    or (${t.ending} = 'retried' and ${t.try2Mark} is not null)
    or (${t.ending} in ('full_marks','declined','no_retry') and ${t.try2Mark} is null)`),
  check("unseen_phases_recorded_is_higher",
    sql`${t.recordedMark} is null or ${t.recordedMark} = greatest(${t.try1Mark}, coalesce(${t.try2Mark}, 0))`),
  index("unseen_phases_user_unit_idx").on(t.userId, t.unitId),
]);
```

**Attempts index (no new column):**

```sql
CREATE UNIQUE INDEX attempts_unseen_incomplete_unique
  ON attempts (user_id)
  WHERE unit_id = 'y12-english-advanced-unseen-texts' AND completed_at IS NULL;
```

Declared in `schema.ts` as `uniqueIndex("attempts_unseen_incomplete_unique").on(t.userId).where(sql\`${t.unitId} =
'y12-english-advanced-unseen-texts' and ${t.completedAt} is null\`)`. One open attempt per student in this
unit; completed attempts are unconstrained, so a student has as many finished attempts as questions.

**Existing tables, unchanged:** `results` (the unseen row has `max_marks` = the question's value,
`graded_by = 'llm'`, `answer` = the deciding try's text, `feedback` = that try's feedback, `rubric_hits` and
`rubric_misses` = skill ids, `concept_outcomes` = the seven first-try outcomes of §3.2), `rewrite_drafts`
(reused for the two drafts), `daily_ai_usage`, `attempts`.

**Retention and deletion.** `unseen_phases.user_id` and the composite attempt FK are `ON DELETE CASCADE`;
`deleteUsersByEmail` and `runRetention` delete `users` rows, which cascade, so `scripts/delete-student.ts`
and the retention job need no change (proved by `tests/api/delete-unseen.test.ts`).

## 3. Derived data (never stored)

### 3.1 Answered, pending, and the draw

```ts
// lib/unseen/draw.ts (pure)
answeredIds(results): Set<string>                         // a results row exists in this unit
formStats(unit, results): Map<TextForm, { n: number; avg: number }>   // avg = mean(marks / max) over answered questions
weight(q, stats, uncleared: ReadonlySet<SkillId>): number // formWeight × (2 + skillCount)
drawUnseen(candidates, weightOf, rand: RandomInt): UnseenQuestion | null          // null only for an empty bank

// repeats, once every question has a recorded mark (FR-029)
latestAnswers(results): Map<questionId, { share: number; at: number }>   // the LATEST result per question
recentQuestionIds(questions, results, 3): string[]                      // the last 3 quizzes, newest first
repeatCandidates(questions, recent): UnseenQuestion[]                   // bank > 3: minus the last 3; 2..3: minus the most recent; 1: it
markWeight(share) = 1 + round(4 * (1 - share))                           // 1 (full marks) to 5
ageWeights(candidates, latest): Map<id, 1..4>                            // by rank: longest since answered = 4
repeatWeightOf(q, form, stats, uncleared, latest, ages) = weight(q) * markWeight * ageWeight
```

```
formWeight(f) = 10                                        if n_f = 0
              = 2 + round(6 × (1 − avg_f))                otherwise      (2..8)
skillCount(q) = |{ skill tags of q } ∩ uncleared|          (0..3)
weight(q)     = formWeight(form(q)) × (2 + skillCount(q))  (4..50, integer)
```

A pending question is not drawn: the attempts route resumes the student's incomplete attempt first
(`getLatestIncompleteAttempt`). A question already answered is never a candidate. Nothing about the draw
is stored.

### 3.2 Concept outcomes (the seven first-try outcomes, stored in `results.concept_outcomes`)

For try 1 verdicts `V`:

```
[ { conceptId: c-answers-question, correct: V["answers-question"].met }, … seven, in SKILLS order ]
```

All seven count whatever the question's tags. Try 2, a decline and a no-retry question add nothing beyond
the try 1 outcomes. `conceptProgress` replays outcomes in order: a miss sets the count to `clearAfter` (2),
a correct use takes 1 away (never below 0), 0 clears. Pips on the unit page: two per row, filled
`2 − count`; the mono text is `count + " to go"`.

### 3.3 Recorded mark and the summary line

```
cap        = maxMarks − 1                                  // a retry earns at most this
try2Mark   = min(rawMark, cap)                             // applied in code, stored capped
recorded   = max(try1Mark, try2Mark ?? 0)                  // stored as recorded_mark
retryOffered(try1Mark, maxMarks) = try1Mark < maxMarks && maxMarks > 1

summary line by ending:
  full_marks → "Full marks on your first try."
  retried    → feedback(deciding try) + (try2Mark = cap: "A retry can earn at most {cap} out of {max}. Meet every skill on the first try next time for the full {max}.")
               + (try1Mark > try2Mark: "Your recorded mark is {recorded} / {max} (your better try).")
  declined   → "You skipped the retry, so your first try is recorded: {recorded} / {max}."
  no_retry   → "Your first try is recorded: {recorded} / {max}."
pill(skill) = "First try" if try1.met; else "Fixed in retry" if try2?.met; else "Missed"      ("Missed" only for a skill unmet on both tries, or unmet on try 1 with no retry)
```

## 4. Stored and transmitted records

### 4.1 `unseenState` (the start and resume payload; `lib/unseen/state.server.ts`)

```ts
interface UnseenState {
  stage: "write" | "choice" | "retry" | "discussion";
  text: UnseenText;                         // public stimulus; image src is the authenticated route
  draft1?: string;                          // stage write
  try1?: TryView;                           // stage choice | retry | discussion
  try2?: TryView;                           // stage discussion after a marked retry
  draft2?: string;                          // stage retry
  // the text panel has an open-in-a-new-tab link to /unit/<unit>/text/<text> at every stage (no UI state of its own; spec 008 FR-006)
  retryOffered?: boolean;                   // stage choice | retry
  dailyLimit?: { reached: true; resetsAt: string };   // present only when the allowance is used up
  ending?: "full_marks" | "retried" | "declined" | "no_retry";
  recordedMark?: number;
  repeating?: boolean;                      // true when the student answered this question before (a repeat quiz)
  discussion?: { modelAnswer: string; modelWords: number };   // only when stage = "discussion"
}
interface TryView { text: string; mark: number; skills: SkillView[]; feedback: string; biggestGap: string; goFurther: string | null; wordCount: number }   // goFurther: a first try at full marks only
interface SkillView { id: SkillId; met: boolean; reason: string }
```

`stage = "discussion"` is entered only from a `final` row. `choice` and `retry` come from a `try1` row.
There is no `marking` stage and no `notMarked` stage: marking states and notices are never restored (the
`dailyLimit` field restores the one that must persist).

### 4.2 Row lifecycle

See research R8. `final` is terminal; each arrow inserts or updates once, guarded by `status`; a `results`
row is written on every arrow into `final`.

## 5. Question card state machine (`components/unseen/UnseenPanel.tsx`)

States: `writing`, `marking1`, `result` (first-try result, retry choice), `retrying`, `marking2`,
`declining`, `discussion`. The not-marked notices are conditions of `writing` and `retrying` (a
`notice: "marker" | "limit" | null`), not states: the text and the box are exactly as before, plus a
status message and, for the limit, a disabled Submit.

The transition table is in research R12. Invariants: the submitted text is held in React state across
`marking*` and never cleared; the retry is reachable only from `result` or a resumed `retry`; `discussion`
is reachable only from a server response that carried `discussion`; no state offers a third try or a
self-mark; "Skip the retry" is available in `result`, `retrying` (including with the limit notice) and
never in `writing`.

### 4.3 Highlights (browser only, never sent to the server; spec 008 FR-006a)

```ts
interface HlRange { id: string; block: number; start: number; end: number }   // lib/unseen/highlights.ts
// block: body blocks first (a poem's line index across stanzas, or the prose paragraph index), then the footnotes
//        (bodyCount + footnote index); start/end are character offsets in that block's string, end exclusive.
// id: the connected highlight; a highlight across blocks is one HlRange per block with one id.
// localStorage key: `unseen-hl:v1:<userId>:<attemptId>:<textId>`
// value: { items: HlRange[]; finalAt?: number }   // finalAt: first time the attempt was seen final; swept 30 days later
```

Normalised on save (sorted, same-id ranges that meet are merged, clipped to the block length). Shared with other open
views of the attempt through `BroadcastChannel("unseen-highlights")` (`{ key, items }`) and the window `storage` event.
The text-only page is addressed `/unit/<unit>/text/<text>?attempt=<attemptId>`.

## 6. Offline files (not in the database)

`resources/english-unseen/pilot-questions.json` (gitignored), existing shape, with `set` of `"tuning"`,
`"holdout"` or `"field"` on each question. A field question:

```jsonc
{ "id": "field-fs25-q1", "set": "field", "source": "…", "marks": 3, "questionHeading": "Text 1 – Poem",
  "question": "…", "directive": "analyse", "textForm": "poem", "visual": false, "text": "…",
  "criteria": "…", "notes": "…", "suggestedWords": 204, "anchors": ["field-fs25-q1-model"],
  "cases": [
    { "id": "field-fs25-q1-model", "origin": "model answer", "expectMark": [3, 3], "allSkillsMet": true, "answer": "…" },
    { "id": "field-fs25-q1-17", "origin": "re-mark disagreement", "needsLabel": true, "expectMark": [0, 3], "expectMissed": [], "answer": "…" } ] }
```

No student name, email, user id, attempt id or date is written. `needsLabel: true` cases are refused by the
runner until the teacher edits `expectMark` and `expectMissed` and clears `needsLabel`.

`resources/english-unseen/{inventory,bank,review}/` (gitignored): the content task's inputs and outputs
(research R2).

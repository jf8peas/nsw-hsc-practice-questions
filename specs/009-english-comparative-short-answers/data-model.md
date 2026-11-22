# Data Model: Advanced English Comparative Short Answers (spec 009)

Builds on [008's data-model.md](../008-english-unseen-short-answers/data-model.md); only what is new or changed is here. Decisions are in [research.md](research.md) (R-numbers).

## 1. Content types (`lib/types.ts`)

### 1.1 Public (ships to the browser)

```ts
// UnseenPaper.qNo widens from 1|2|3|4 to 1|2|3|4|5

/** Pick shape of a choice question. A fixed pair has `choice: null`. */
export interface ComparativeChoice {
  /** Texts every answer is about (may be empty, e.g. "any TWO of Texts 1 to 4"). */
  fixed: string[];
  /** Texts the student chooses from (all shown in tabs). */
  from: string[];
  /** How many of `from` the student picks (1 or 2). */
  pick: number;
}

export interface ComparativeQuestion extends BaseQuestion {
  type: "comparative";
  group: "comparative";
  /** Every text shown, tab order: fixed first, then choosable. Each resolves in the unit's texts. */
  textIds: string[];
  choice: ComparativeChoice | null;
  verb: string;                       // key of lib/comparative/rubric.json directiveVerbs
  parts?: Array<{ label: string; text: string; marks: number }>;
  maxMarks: number;                   // 3..8
  suggestedWords: number;
  suggestedFrom: "lines" | "median";
  paper: UnseenPaper;
  outcome: "EAV-12-01" | "EAV-12-02" | "EAV-12-04";
  concepts: string[];                 // 1..3 of the nine skill concept ids
}
// Question = … | UnseenQuestion | ComparativeQuestion
// UnitMeta gains: sharesProgressWith?: string[];  draw?: { kind: "unseen-weighted" | "comparative-weighted" }
```

`UnseenText` (spec 008) is unchanged and shared. `Unit.texts` for this unit is the filtered subset of the shared store its questions name (R2).

Invariants (validator): fixed pair ⇒ `choice === null`, `textIds.length === 2`; choice ⇒ `textIds = [...fixed, ...from]`, no overlap, `1 ≤ pick ≤ from.length`, `fixed.length + pick ≥ 2`.
`picked(q, pick) = choice ? [...choice.fixed, ...pick] : q.textIds`.

### 1.2 Key (server-only, `keys.ts` + `answers.ts`)

```ts
export interface ComparativeKey {
  criteria: string;                   // "N – …" per mark; school's or drafted
  notes: string;                      // "None provided by the school." allowed
  model: string;                      // an example full-mark answer for ONE pairing
  modelOrigin: "school" | "drafted";
  criteriaOrigin: "school" | "drafted";
  reviewedOn?: string;                // required when either origin is drafted
  /** The text ids the model answer uses (all of textIds for a fixed pair). Released at the discussion only. */
  pairing: string[];
  /** One entry per visual text in textIds (picked or not): the marker's description and its check. */
  visuals?: Record<string, { description: string; check?: DescriptionCheck }>;
}
// AnswerSet entry gains: comparative?: ComparativeKey
```

`descriptions.ts` and `description-checks.ts` stay in the shared store, keyed by text id; `answers.ts` copies them into `visuals` for the visual texts a question shows.

## 2. Shared text store

| File (in `content/units/y12-english-advanced-unseen-texts/`) | Change |
|---|---|
| `texts.ts` | now a filter over `store-texts.ts` returning the texts 008's questions use |
| `store-texts.ts` (new, generated) | every text of both banks |
| `images/`, `descriptions.ts`, `description-checks.ts` | unchanged; hold the visuals of both units |

`content/units/y12-english-advanced-comparative-texts/texts.ts` is the same filter over `store-texts.ts` for its own questions' `textIds`. Text ids are unique across the store and never reused.

## 3. Schema change (`lib/db/schema.ts`, migration `drizzle/0008_*.sql`)

| Table | Change |
|---|---|
| `unseen_phases` | add `picked_text_ids text[] null` (the first try's pick, choice questions only); widen check `unseen_phases_max` to `max_marks between 1 and 8`; add check `unseen_phases_pick_shape` (`picked_text_ids is null or cardinality(picked_text_ids) between 1 and 2`); `try1_verdicts` / `try2_verdicts` jsonb type widens to the nine-skill record |
| `rewrite_drafts` | add `picked_text_ids text[] null` (the draft pick, before the first try is submitted) |
| `attempts` | add partial unique index `attempts_comparative_incomplete_unique` on `(user_id)` where `unit_id = 'y12-english-advanced-comparative-texts' and completed_at is null` |
| `results` | unchanged (a comparative result stores per-skill `conceptOutcomes` from the first try, like 008) |

No new table. Rows keep `unit_id`, so 008 and 009 rows never mix in unit-scoped queries. Retention, `delete-student` and the draft route's cascade already cover the rows; the pick columns add no new personal data (text ids of the question's own public texts).

## 4. Skills and shared progress

`lib/unseen/skills.json` (public, unchanged) holds spec 008's seven; `lib/comparative/skills.json` (public) holds the two comparison skills; `lib/unseen/skills.ts` exports both as `COMPARATIVE_SKILLS` (nine, seven first). Entries are `{ id, name, tip, description }` and `scope` below is descriptive only:

| id | name | scope |
|---|---|---|
| `answers-question`, `directive-verb`, `analyses-not-retells`, `technique-effect`, `apt-evidence`, `human-experience`, `succinct` | spec 008's seven, unchanged ids, names and tips (skill 1's marker definition also covers "uses the texts the question requires", in the comparative prompt only) | `both` |
| `compares-texts` | Compares the texts | `comparative` |
| `treats-both-in-depth` | Treats both texts in depth | `comparative` |

Concept ids: shared seven = `y12-english-advanced-unseen-texts.c-<id>` (used by both units); new two = `y12-english-advanced-comparative-texts.c-<id>`, each `clearAfter: 2`. Skill tips for the two new skills are written by the content step (one sentence each, in 008's tip voice).

**Derivation** (no storage): `sharedConceptProgress(unit, resultsByUnit)`:

```
results  = ⋃ resultsByUnit[u] for u in [unit.id, ...unit.sharesProgressWith]
ordered  = results sorted by answeredAt, then id
for r in ordered:  for o in r.conceptOutcomes:  miss → count = clearAfter(concept) (2), lastMissedAt = r.answeredAt
                                               show → count = max(0, count − 1)
states   = concepts with count > 0, restricted to ids in unit.concepts
```

A miss in either unit sets a shared skill to 2; any two shows, in any mix, clear it; the two comparison skills only ever receive outcomes from 009 results. Each unit's list shows only its own concepts.

## 5. Draw weights (`lib/unseen/draw.ts`, generalised to `{id, concepts}`)

For this unit `formOf = () => null`, so `formWeight = 10` for all.

| Draw | Weight of a candidate question |
|---|---|
| New (some unanswered) | `10 × (2 + uncleared skill tags)` (20–50) |
| Repeat (all answered) | `10 × (2 + uncleared) × markWeight(latest share) × ageWeight` |
| Candidates | unanswered, or (repeat) all but the last 3 quizzes' questions, the small-bank rule as 008 |
| Pending | the open attempt for this unit, offered first at whatever step |

## 6. Marker I/O (`lib/unseen/marker.server.ts`, generalised)

`MarkerInput` gains `texts: Array<{ heading; form; title; author; text }>` (the picked texts in tab order; `text` is the stimulus, or a visual's description), `skillIds`, and a `rubric` parameter. Reply:

```json
{ "mark": 0, "skills": { "<nine ids>": { "met": true, "reason": "…" } }, "feedback": "…", "biggestGap": "…", "goFurther": "…" }
```

(`goFurther` required at full marks, `biggestGap` below full marks, as 008.) A missing or non-boolean verdict, an out-of-range mark, or an unparseable reply is retried.

## 7. API-level state (`lib/comparative/types.ts`)

```ts
export type ComparativeStage = "write" | "choice" | "retry" | "discussion";   // 008's stages

export interface ComparativeState {
  stage: ComparativeStage;
  /** Every text the question shows (public). */
  texts: UnseenText[];
  /** Choice questions: the saved pick (draft row, or phase row once submitted). */
  pick?: string[];
  pickLocked: boolean;               // true once the first try is submitted
  draft1?: string; draft2?: string;
  try1?: TryView9; try2?: TryView9;  // TryView with nine skills
  retryOffered?: boolean;
  dailyLimit?: { reached: true; resetsAt: string };
  ending?: UnseenEnding; recordedMark?: number;
  repeating?: boolean;
  /** Only at the discussion. */
  discussion?: UnseenDiscussion & { pairing?: string[] };   // pairing: choice questions only
}
```

## 8. The question card's states

| State | Shows | Moves on when |
|---|---|---|
| **pick** (choice question, stage `write`, pick incomplete) | tabs, chips, answer box (typing allowed), Submit disabled with "Choose N text(s) to write about" | pick complete → saved at once |
| **write** | tabs, chips (choice), question, box, meter | Submit (≥ 20 words, ≤ 120% of suggested, pick complete) |
| **marking** | answer locked, live status "Marking your answer…" | reply, or `not_marked` |
| **result** | mark, nine verdicts with reasons, feedback, biggest gap or "To go further" | full marks → discussion; below → retry choice |
| **retry choice** | result + "Try again" / "Skip the retry" (not offered on a 1-mark question; not applicable at 3–8) | retry / decline |
| **retry** | tabs, read-only chips, one tip card per skill missed, box from the first try | Submit |
| **discussion** | both tries, recorded mark, model answer; choice: the one-pairing line | — (question ends) |
| **waiting on cap / marker down** | box returns with its text; daily-limit notice and Submit disabled until the next Sydney day, or the "could not be marked just now" notice | next day / resubmit (no self-marking, no invented mark) |

## 9. Inventory and bank formats (gitignored `resources/english-unseen/`)

- Inventory question: `{ qNo, marks, texts, forms, decision: "kept"|"skipped", reason?, choice?: {fixed,from,pick} }`.
- Bank `bank/comparative/<paper>.json`: `{ paper, texts: [new texts only], questions: [{ id, textIds, choice, pairing, marks, parts?, verb, source, answerLines|null, outcome, concepts, key }] }`.
- Pilot `pilot-comparative.json`: 008's pilot format with `texts[]` (each `{heading, form, text|description}`), `choice`, `pick` per labelled answer, `set: tuning|holdout|field`, `expectMark: [lo, hi]`, `expectMissed: [skill ids]`, `anchors`.

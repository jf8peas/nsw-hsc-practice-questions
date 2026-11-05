# Data Model: Economics Paragraph Writing

Shapes for [plan.md](plan.md); the reasons are in [research.md](research.md). TypeScript is shown
for clarity; the files named are where the code goes.

## 1. Content types

### Public (`lib/types.ts`, `content/units/y12-economics-paragraph-writing/questions.ts`)

```ts
// UnitMeta gains:
sequence?: { kind: "essay-parts"; parts: 5 };   // marks a unit whose draw is the next part, not random

// Concept gains:
clearAfter?: 2 | 3;                              // correct first tries that clear it; default 3

// Question union gains:
export interface ParagraphQuestion extends BaseQuestion {
  type: "paragraph";
  group: "paragraph";
  essayId: string;          // "e01"
  essayNo: number;          // 1-based position of the essay in the bank
  part: 1 | 2 | 3 | 4 | 5;  // 1 topic, 2 mechanism, 3 evidence, 4 evaluation, 5 link
  verb: string;             // "evaluate" (a key of content/glossary.ts)
  economy: string;          // "Vietnam"
  maxMarks: 4;
  prompt: string;           // the essay question, in full
  concepts: string[];       // the part's 3 tip ids + the 2 all-parts tip ids
}
```

Ids: `y12-economics-paragraph-writing.e01p1` … `.e12p5`. Bank order = array order = essay 1 parts 1 to
5, then essay 2. Ids are never renumbered or reused; essays are appended.

`lib/paragraph/parts.ts` (public, no model text):

```ts
export const PART_ORDER = ["topic","mechanism","evidence","evaluation","link"] as const;
export const PARTS: Record<PartKey, {
  name: string;           // "Evidence & Application"
  short: string;          // "Evidence" (progress bar, dots, history)
  limit: number;          // 40, 90, 80, 90, 45
  criteria: Record<"a"|"b"|"c"|"d", { short: string; tipId: string | [string, string]; tip: string; apply: string }>;
}>;
export const LIMITS = { topic: 40, mechanism: 90, evidence: 80, evaluation: 90, link: 45 };
```

`criteria.d.tipId` is the pair `[c-all-precise, c-all-concise]`; `tip` for (d) is the pair's two
sentences. `apply` is the generic one-line application used on tip cards.

`content/glossary.ts` (public): `Record<string, string>` NESA verb definitions, e.g. `evaluate:
"make a judgement based on criteria; determine the value of"`. Keys used: assess, evaluate, analyse,
discuss.

### Key (server only: `content/units/y12-economics-paragraph-writing/essays.ts`, `answers.ts`)

```ts
export type BriefField = "economy" | "argument" | "counterpoint" | "chainSteps" | "facts" | "limitation";
export type LimitationTag = "inequality" | "sustainability" | "external-shocks" | "dependence" | "time-lags";

export interface EssayKey {
  essayId: string;                       // matches questions' essayId
  economyType: "emerging" | "developing";
  strategy: string;
  brief: {
    economy: string;                     // "Vietnam — trade liberalisation and FDI since the 1986 Doi Moi reforms"
    argument: string;
    counterpoint: string;
    chainSteps: string[];
    facts: string[];                     // every figure carries its year
    limitation: string[];
  };
  uses: Record<PartNo, BriefField[]>;    // "Use in this part"
  guidance: Record<PartNo, [string, string, string, string]>;
  models: Record<PartNo, string>;        // each within PARTS limit
  commentary: Record<PartNo, string>;    // the text after the dash under "MODEL …"
  markingNotes: Record<PartNo, string>;  // marker only
  limitation: { tag: LimitationTag; topicPhrase: string; evaluationPhrase: string };
  figuresVerified: string;               // ISO date; must be in the past
}

// lib/types.ts: Answer gains
paragraph?: { essay: EssayKey; part: PartNo };
```

`answers.ts` returns one `Answer` per question: `{ rubric: [], paragraph: { essay, part } }`.
`rubric: []` keeps `Answer` valid; the validator's rubric-per-mark rule is skipped for
`type: "paragraph"` (as it skips MC options for rewrite).

### Marker rubric (server only: `lib/paragraph/rubric.json`)

`{ promptVersion, parts: { topic|mechanism|evidence|evaluation|link: { name, limit, job, criteria: { a, b, c } } }, conventions: { preciseLanguage, noPadding }, system, userTemplate }`.
Read by `lib/paragraph/marker.server.ts` and `scripts/pilot-paragraph-marker.py`.

## 2. Schema change (`lib/db/schema.ts`, migration `drizzle/0005_*.sql`)

```ts
export interface CriterionVerdict {
  met: boolean;
  reason: string;                         // marker's one line; "" on the self-mark path
  subs?: { preciseLanguage: boolean; noPadding: boolean; withinLimit: boolean }; // criterion d only
}
export type Verdicts = Record<"a" | "b" | "c" | "d", CriterionVerdict>;

export const paragraphPhases = pgTable("paragraph_phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  unitId: text("unit_id").notNull(),
  questionId: text("question_id").notNull(),
  status: text("status").notNull(),              // 'phase1' | 'final'
  mode: text("mode").notNull(),                  // 'marker' | 'self_mark'
  ending: text("ending"),                        // 'full_marks' | 'corrected' | 'no_correction' | 'self_mark'; null until final
  phase1Text: text("phase1_text").notNull(),
  phase1Mark: smallint("phase1_mark").notNull(), // 0..4
  phase1Verdicts: jsonb("phase1_verdicts").$type<Verdicts>().notNull(),
  phase1Feedback: text("phase1_feedback"),       // null on self-mark
  phase1PromptVersion: text("phase1_prompt_version"), // null on self-mark
  phase1Model: text("phase1_model"),             // null on self-mark
  phase1GradedAt: ts("phase1_graded_at").notNull().defaultNow(),
  phase2Text: text("phase2_text"),               // only when phase 2 was marked
  phase2Mark: smallint("phase2_mark"),           // 0..3 (already capped)
  phase2Verdicts: jsonb("phase2_verdicts").$type<Verdicts>(),
  phase2Feedback: text("phase2_feedback"),
  phase2PromptVersion: text("phase2_prompt_version"),
  phase2Model: text("phase2_model"),
  phase2GradedAt: ts("phase2_graded_at"),
  recordedMark: smallint("recorded_mark"),       // set when final
  flaggedAt: ts("flagged_at"),                   // once per answer
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "paragraph_phases_attempt_owner_fk",
    columns: [t.attemptId, t.userId], foreignColumns: [attempts.id, attempts.userId] }).onDelete("cascade"),
  unique("paragraph_phases_attempt_question_unique").on(t.attemptId, t.questionId),
  check("paragraph_phases_status", sql`${t.status} in ('phase1','final')`),
  check("paragraph_phases_mode", sql`${t.mode} in ('marker','self_mark')`),
  check("paragraph_phases_ending", sql`${t.ending} is null or ${t.ending} in ('full_marks','corrected','no_correction','self_mark')`),
  check("paragraph_phases_phase1_mark", sql`${t.phase1Mark} between 0 and 4`),
  check("paragraph_phases_phase2_mark", sql`${t.phase2Mark} is null or ${t.phase2Mark} between 0 and 3`),
  check("paragraph_phases_final_shape", sql`${t.status} <> 'final' or (${t.recordedMark} is not null and ${t.ending} is not null)`),
  check("paragraph_phases_recorded_is_higher",
    sql`${t.recordedMark} is null or ${t.recordedMark} = greatest(${t.phase1Mark}, coalesce(${t.phase2Mark}, 0))`),
  check("paragraph_phases_flag_needs_marker", sql`${t.flaggedAt} is null or ${t.mode} = 'marker'`),
  index("paragraph_phases_user_unit_idx").on(t.userId, t.unitId),
  index("paragraph_phases_flagged_idx").on(t.flaggedAt).where(sql`${t.flaggedAt} is not null`),
]);
```

On the self-mark path `recorded_is_higher` still holds (`recorded = phase1_mark`, `phase2_mark`
null). In the FR-019a ending `phase2_*` stay null and `ending = 'no_correction'`.

**Attempts index (no new column):**

```sql
CREATE UNIQUE INDEX attempts_paragraph_part_unique
  ON attempts (user_id, (question_ids[1]))
  WHERE unit_id = 'y12-economics-paragraph-writing';
```

Declared in `schema.ts` with `uniqueIndex("attempts_paragraph_part_unique").on(t.userId, sql\`(${t.questionIds}[1])\`).where(sql\`${t.unitId} = 'y12-economics-paragraph-writing'\`)`.

**Existing tables, unchanged:** `results` (the paragraph row has `max_marks = 4`, `graded_by =
llm | self`, `answer` = the final text, `feedback` = the deciding phase's overall feedback,
`concept_outcomes` = the five phase-1 outcomes below), `rewrite_drafts` (reused for paragraph
drafts), `daily_ai_usage`, `attempts`.

**Retention and deletion.** `paragraph_phases.user_id` and the composite attempt FK are `ON DELETE
CASCADE`. `deleteUsersByEmail` and `runRetention` delete `users` rows, which cascade; no script
change. `flagged_at` is deleted with the row.

## 3. Derived data (never stored)

### 3.1 Progression

```ts
// lib/attempts/sequence.server.ts (pure)
nextQuestion(unit, answered: ReadonlySet<string>): ParagraphQuestion | null   // first bank-order question with no result
essayProgress(unit, marks: ReadonlyMap<string, number>): {
  essayNo: number; essayTotal: number; essayId: string; question: string; verb: string; economy: string;
  parts: Array<{ part: 1|2|3|4|5; short: string; state: "done" | "next" | "later"; mark: number | null }>;
  nextPart: 1|2|3|4|5;
  finished: false;
} | { finished: true; essayTotal: number }
```

Inputs: the unit's public questions and the student's `results` (question id, marks). Nothing is
stored. `essayTotal = unit.questions.length / 5`.

### 3.2 Concept outcomes (the five phase-1 outcomes, stored in `results.concept_outcomes`)

For part `p` and phase 1 verdicts `V`:

```
[ { conceptId: c-<p>-a, correct: V.a.met }, { c-<p>-b, V.b.met }, { c-<p>-c, V.c.met },
  { c-all-precise, V.d.subs.preciseLanguage }, { c-all-concise, V.d.subs.noPadding && V.d.subs.withinLimit } ]
```

Self-mark: `a/b/c` ticks map as above; the `d` tick sets both all-parts outcomes. Phase 2 and the
FR-019a ending add nothing.

`conceptProgress` replays outcomes in order. A miss sets `count = clearAfter` (2 or 3); a correct
use takes 1 away, never below 0; at 0 the concept is cleared. Pips on the unit page: one per
`clearAfter`, filled `clearAfter - count`; the mono text is `count + " to go"`.

### 3.3 Recorded mark and the summary line

```
recorded   = max(phase1Mark, min(phase2Mark ?? 0, 3))     // stored as recorded_mark
outcome    =  ending 'full_marks'    → "Full marks on your first try."
              ending 'corrected', p2 = 3        → "Full marks for a correction — every criterion met." + cap line
              ending 'corrected', p2 < 3, p2 ≥ p1 → feedback(p2) + "A correction can earn at most 3."
              ending 'corrected', p1 > p2       → feedback(p2) + "Your recorded mark is n / 4 (your better try)."
              ending 'no_correction'            → "Your first try is recorded: n / 4 marks." + "We couldn't mark a correction this time, so your first-try mark stands. The tips below are what to work on."
              ending 'self_mark'                → "You marked n / 4." + "Compare your text with the model part."
pill(c)    = 'First try' if p1.c.met; else 'Fixed in correction' if p2?.c.met; else 'Not met'    (omitted for 'no_correction'; 'Your tick' for 'self_mark')
```

Summary panel is grey (not green) when `recorded <= 2`.

## 4. Stored and transmitted records

### 4.1 Phase row lifecycle

```
(no row) --phase 1 marked 4--------------------> final / full_marks
(no row) --phase 1 marked <4-------------------> phase1
(no row) --marker unavailable, self-mark saved-> final / self_mark          (mode self_mark)
phase1   --phase 2 marked----------------------> final / corrected
phase1   --phase 2: cap used or marker down----> final / no_correction
final    --flag (marker mode only)-------------> final, flagged_at set (once)
```

`final` is terminal. Each arrow inserts or updates exactly once (guarded by `status`), and a
`results` row is written on every arrow into `final`.

### 4.2 `paragraphState` (the resume and start payload; `lib/paragraph/state.server.ts`)

```ts
interface ParagraphState {
  stage: "write" | "correct" | "discussion";
  view: ParagraphQuestionView;           // always: brief, uses, guidance, earlier models, verb definition, essay progress
  draft1?: string;                       // saved phase 1 draft when stage = "write"
  phase1?: PhaseView;                    // stage correct | discussion
  phase2?: PhaseView;                    // stage discussion after a marked correction
  draft2?: string;                       // saved correction draft when stage = "correct"
  ending?: "full_marks" | "corrected" | "no_correction" | "self_mark";
  recordedMark?: number;
  flagged?: boolean;
  mode?: "marker" | "self_mark";
  discussion?: ParagraphDiscussion;      // only when stage = "discussion"
}
interface PhaseView { text: string; mark: number; criteria: CriterionView[]; feedback: string; wordCount: number }
interface CriterionView { key: "a"|"b"|"c"|"d"; met: boolean; reason: string; subs?: {...} }
interface ParagraphQuestionView {
  essayNo: number; essayTotal: number; part: 1|2|3|4|5; partName: string; limit: number;
  verbDefinition: string; guidance: string[];
  brief: EssayKey["brief"]; uses: BriefField[];
  earlier: Array<{ part: number; label: string; text: string }>;
  parts: Array<{ part: number; short: string; state: "done" | "current" | "later" }>;
}
interface ParagraphDiscussion {
  modelPart: string; commentary: string; modelWords: number;
  modelSoFar: Array<{ part: number; label: string; text: string; current: boolean }>;
  laterSlots: Array<{ part: number; label: string; when: string }>;   // labels only
  next: { kind: "part"; essayNo: number; part: number; name: string }
      | { kind: "essay"; essayNo: number; part: 1; name: string }
      | { kind: "none" };
}
```

`stage = "discussion"` is entered only from a `final` row. `stage = "correct"` from a `phase1` row.
A `final` row for a self-marked part resumes at `discussion` with `mode = "self_mark"`.
There is no `marking` stage: marking states are never restored.

## 5. Question card state machine (`components/paragraph/ParagraphPanel.tsx`)

States: `writing`, `marking1`, `correction`, `marking2`, `selfMark`, `discussion` (with
`discussion.kind` = `normal | noCorrection | selfMark`).

| From | Event | To | Effects |
|---|---|---|---|
| (mount) | `stage = write` | `writing` | focus the textarea only if empty draft and the user tapped; restore `draft1` |
| (mount) | `stage = correct` | `correction` | textarea = `draft2` if present else `phase1.text`; focus, caret at end |
| (mount) | `stage = discussion` | `discussion` | focus the result summary |
| `writing` | submit, text non-empty | `marking1` | lock text, start timers, `POST /api/grade` phase 1 |
| `writing` | submit, empty | `writing` | no request |
| `marking1` | 200, mark 4 | `discussion` (normal) | store result; focus summary |
| `marking1` | 200, mark < 4 | `correction` | show result + tip cards; correction box pre-filled with the first try, focus, caret at end |
| `marking1` | 200, `needsSelfMark` | `selfMark` | show model part + four ticks; focus first tick |
| `marking1` | 409 already_answered | `correction` or `discussion` | use the stored result in the body |
| `marking1` | 429, 5xx, network error | `writing` | text intact, usual error line |
| `correction` | submit | `marking2` | lock correction, start timers, `POST /api/grade` phase 2 |
| `correction` | any attempt to skip | (not offered) | no control exists; a request with `skip` is refused `400` |
| `marking2` | 200 marked | `discussion` (normal) | focus summary |
| `marking2` | 200 `ending = no_correction` | `discussion` (noCorrection) | tip cards, no pills, no correction box |
| `marking2` | 409 | `discussion` | stored result |
| `marking2` | 429, 503, network error | `correction` | text intact, usual error line |
| `selfMark` | "Save my mark" | `discussion` (selfMark) | `POST /api/results/self-mark` |
| `discussion` | flag | `discussion` | `POST /api/paragraph/flag`; button → "Flagged for your teacher" |
| `discussion` | Finish | (route) | `router.push(/unit/<id>)` |

Invariants: the submitted text is held in state across `marking*`; the correction is reachable only
from `marking1` with a mark under 4; `discussion` is reachable only from a server response that
carried `discussion`; no state offers a third try.

## 6. Offline files (not in the database)

`resources/topic010/pilot-essays.json` (gitignored). A field essay entry:

```jsonc
{ "id": "field-e01", "set": "field", "economy": "...", "type": "...", "question": "...", "directiveVerb": "...",
  "strategy": "...", "brief": {...}, "models": {...}, "markingNotes": {...},
  "cases": [ { "id": "field-e01-17", "part": "link", "text": "...", "fails": ["a"], "ambiguous": [], "needsLabel": false } ] }
```

No student name, email, user id, attempt id or date is written. `set` on an essay applies to all its
cases; a case-level `set` overrides it.

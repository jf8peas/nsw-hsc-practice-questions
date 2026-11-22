# Data Model: Economics Essay Writing (spec 010)

Slice tags: **[S1]** ships before 1 Dec 2026; **[S2]** follows.

## 1. Content types

### Public (`content/units/y12-economics-essay-writing/questions.ts`, in `lib/types.ts`)

```ts
interface EssayQuestion extends BaseQuestion {
  type: "essay"; group: "essay"; maxMarks: 20;
  id: string;                         // "y12-economics-essay-writing.e1" … ".e6"; never renumbered or reused
  prompt: string;                     // the essay question, verbatim for trial essays
  verb: string;                       // lower case, a key of content/glossary.ts ("explain" added)
  economy: "china" | "nepal" | "both";
  offer: 1 | 2 | 3 | 4 | 5 | 6;       // display/offer order
  live: boolean;                      // false until reviewed AND the marker gate has passed
  source?: string;                    // trial essays only: "Barker 2024 Trial, Q27"
}
```

| id | economy | offer | source | verb |
|---|---|---|---|---|
| e1 | china | 1 | Barker 2024 Trial, Q27 | explain |
| e2 | china | 4 | — | assess |
| e3 | nepal | 2 | Sydney Boys 2020 Trial, Q27 | evaluate |
| e4 | nepal | 5 | Abbotsleigh 2025 Trial, Q28 | explain |
| e5 | both | 3 | — | evaluate |
| e6 | both | 6 | — | assess |

(The spec's offered order 1, 3, 5, 2, 4, 6 is `offer` 1…6. The spec's "Essays" list numbers are the ids e1…e6.) `UnitMeta` additions: `flow?: "essay"`, `conceptsClearOnOtherQuestions?: boolean`.

### Server-only key (`content/units/y12-economics-essay-writing/answers.ts`, `Answer.essay`)

```ts
interface EssayKey {
  markingNotes: string;               // what a strong answer is likely to cover (Qwen draft, Claude reviewed)
  schoolCriteria: string | null;      // the school's own marking criteria, trial essays only; null for e2, e5, e6
  modelEssay: string;                 // band 1, 600–800 words, contemporary figures with years and sources
  concepts: string[];                 // concept ids a strong answer uses; each on the concept list
}
```

Read only through `lib/grading.server.ts` (`essayView`, `essayKeyForMarker`, `essayModelEssay`). A non-live essay may have no key.

## 2. The scaffold (`lib/essay/scaffold.ts`)

Twenty text fields in five sections. Stored as JSON in `essay_phases.scaffold`; every value a string (empty allowed).

```ts
interface EssayScaffold {
  intro:      { judgement: string; terms: string; economies: string };            // 3
  body:       [BodyPara, BodyPara, BodyPara];                                       // 15
  conclusion: { judgement: string; weighs: string };                                // 2
}
interface BodyPara { point: string; theory: string; data: string; evaluation: string; link: string }
```

Rules (`validateScaffold`, one function for client and server):
- `scaffoldWords = Σ countWords(field)` over the 20 fields; **> 250** → `over_cap`.
- `intro.judgement.trim() === ""` → `no_judgement`.
- all three `body[i].point.trim() === ""` → `no_body_point`.
- Each field ≤ 1500 characters (a defence; the 250-word cap is the real limit). Unknown keys are dropped; non-strings rejected.
- `save` accepts any scaffold not over the cap (empty allowed); `start` and `review` also need `no_judgement` and `no_body_point` clear.

## 3. Schema change (migration `drizzle/0009_*.sql`) [S1]

```text
essay_phases
  id                      uuid pk default gen_random_uuid()
  attempt_id              uuid not null
  user_id                 uuid not null references users(id) on delete cascade
  unit_id                 text not null
  question_id             text not null
  status                  text not null                 -- 'planning' | 'writing' | 'finished'
  scaffold                jsonb not null                -- EssayScaffold; default all-empty
  scaffold_words          smallint not null default 0
  scaffold_locked_at      timestamptz
  review                  jsonb                         -- {checks:[7], figureFlags:[]} (S2); null = no review
  review_prompt_version   text
  review_model            text
  reviewed_at             timestamptz
  marking_started_at      timestamptz                   -- the lease
  essay_text              text
  essay_words             smallint
  raw_mark                smallint                      -- the marker's mark before clamping and the cap
  band                    smallint
  final_mark              smallint
  covers_both             boolean
  criteria                jsonb                         -- {understanding,theory,assessment,data,structure}: {verdict, reason}
  band_reason             text
  lift                    jsonb                         -- string[2]
  flags                   jsonb                         -- [{quote, why}]
  gaps                    jsonb                         -- [{conceptId, detail}] (≤ 5, ordered)
  used_well               text[]                        -- concept ids
  prompt_version          text
  model                   text
  graded_at               timestamptz
  created_at, updated_at  timestamptz not null default now()

  FOREIGN KEY (attempt_id, user_id) → attempts(id, user_id) ON DELETE CASCADE
  UNIQUE (attempt_id, question_id)
  CHECK status in ('planning','writing','finished')
  CHECK scaffold_words between 0 and 250
  CHECK (status = 'finished') = (final_mark is not null)
  CHECK final_mark is null or (final_mark between 1 and 20 and raw_mark between 1 and 20 and band between 1 and 5
        and essay_text is not null and essay_words between 600 and 800 and criteria is not null
        and prompt_version is not null and model is not null)
  CHECK status = 'planning' = (scaffold_locked_at is null)   -- locked ⇔ not planning
  CHECK review is null or scaffold_locked_at is not null     -- a review only exists on a locked plan

INDEX attempts_essay_incomplete_unique ON attempts (user_id)
  WHERE unit_id = 'y12-economics-essay-writing' AND completed_at IS NULL      -- one open attempt per student
```

`results` (existing, one row per finished attempt): `marks_awarded` = `final_mark`, `max_marks` 20, `graded_by` `llm`, `answer` = essay text, `feedback` = `band_reason`, `concept_outcomes` as §5. `results_marks_range` and `results_attempt_question_unique` already fit. `rewrite_drafts.phase1_draft` holds the in-progress essay; `phase2_draft` stays "". No change to `attempts`' columns.

No stored "marking" status; no `reviewing` status (both are requests in flight; the lease guards marking).

## 4. State machine

```text
(no attempt) --start essay--> planning   [attempts row + essay_phases row created together]
planning --save scaffold--> planning     [unlocked; ≤ 250 words]
planning --Start writing--> writing      [validate; lock; scaffold frozen]                       S1
planning --Get feedback--> (review in flight)
     review ok            --> writing    [review stored; lock]                                    S2
     reviewer failed/cap  --> planning   [nothing locked; "Start writing" offered]                 S2
planning|writing --Discard--> (deleted)  [unmarked only; confirm; lease null or > 90 s old]        S2
writing --Submit essay--> (marking in flight; lease taken)
     marked               --> finished   [row filled; results row saved; attempt completes; draft deleted]
     marker failed        --> writing    [lease cleared; slot refunded; editable box; draft kept]
     daily cap            --> writing    [lease cleared; draft kept; Submit disabled until next Sydney day]
     second request while leased --> 409 marking_in_progress
finished --Redo--> new attempt (planning) [a new attempts row; this one is untouched]
```

Resume shows the stage the row is in: `planning` → scaffold page; `writing` → essay page (with the review if stored; the draft restored); `finished` → result. The marking screen is never restored (a lease older than 90 s is ignored). An unreadable database at start/resume → a notice ("try again"), never a guess.

## 5. Concept list and gap progress

`lib/essay/concepts.json` is the one list (26 entries; the prompt in `lib/essay/rubric.json` has none of its own); `concepts.ts` builds `Concept[]` with ids `y12-economics-essay-writing.c-<key>`, `clearAfter: 2`.

| Group | Keys (JSON key → id suffix) |
|---|---|
| China (9) | `china-open-door`, `china-wto`, `china-fdi-bri`, `china-soe`, `china-infrastructure-debt`, `china-hukou`, `china-environment`, `china-inequality-poverty`, `china-rebalancing` |
| Nepal (9) | `nepal-liberalisation`, `nepal-wto-trade`, `nepal-remittances`, `nepal-tourism`, `nepal-hydropower`, `nepal-aid-imf-wb`, `nepal-ldc-graduation`, `nepal-instability-earthquake`, `nepal-poverty-hdi` |
| Shared skills (8) | `skill-growth-vs-development`, `skill-globalisation-channels`, `skill-environment-tradeoff`, `skill-inequality-measures`, `skill-external-bodies`, `skill-models`, `skill-judgement`, `skill-data-as-evidence` |

(The content step checks and extends the list; a shipped id is never renamed or reused. `skill-models`, `skill-data-as-evidence` and `skill-judgement` take their description from spec 007's matching tips.)

**Outcomes written to `results.concept_outcomes`** at marking: for each gap `{conceptId, correct:false}` in the marker's order (most important first, ≤ 5), then each used-well id `{conceptId, correct:true}`. The marker sees only ids on the list; code drops others and removes from used-well any id also a gap.

**Derived progress** (`conceptProgress`, replayed from `results` in answer order, nothing stored): `start = clearAfter = 2`. A wrong outcome sets the concept's count to 2 and `raisedBy = questionId`. A correct outcome takes 1 off, **except** (the unit's `conceptsClearOnOtherQuestions`) when its `questionId` equals `raisedBy`, in which case it is ignored. Uncleared = count > 0 and a miss exists. Ordering (count, last missed, id) as today. The "what was missing" line comes from `essay_phases.gaps` of the latest finished row that lists the concept (`latestGapDetails`).

Worked example: e1 misses `china-wto` (2). Redo e1 uses it well → ignored (2). e3 (Nepal) never mentions China → no effect. e5 (both) uses it well → 1. e2 (China) uses it well → 0, cleared. Result: two later essays **on different essays** cleared it.

## 6. Retention and deletion

All new data hangs off `users` by cascade (`essay_phases.user_id`, and its composite FK through `attempts`). Retention (2 years after last activity) and `scripts/delete-student.ts` need no new code beyond tests and a count line in the script's dry-run listing. Discard deletes the open `attempts` row; cascade removes its `essay_phases`, `rewrite_drafts` row and (none yet) `results`. Earlier finished attempts are separate `attempts` rows and are untouched.

## 7. Views (computed, not stored)

- **Unit page row**: `{ question (public), latest: { mark, band, attemptId, at } | null, open: boolean }`, from `results` (latest per question by `created_at`) joined to `essay_phases` for the band.
- **Result view** (`lib/essay/views.ts`): `{ finalMark, band, rawMark?, capped: boolean, criteria[5], lift[2], flags[], gaps[], essay, plan, modelEssay? }` where `capped` is `final_mark < min(raw clamped)` due to the one-economy cap and `modelEssay` is set only when `status = 'finished'` and the caller is the owner.
- **Gap lines**: `Map<conceptId, detail>` from the latest finished row listing each concept.

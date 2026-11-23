# Data Model: English Essay Writing (spec 011)

Slice tags: **[S1]** is the first release; **[S2]** follows it. TypeScript is shown for clarity; the reasons and rejected alternatives are in [research.md](research.md).

## 1. Content types

### 1.1 Public question (`content/units/y12-english-essay-writing/questions.ts`, `lib/types.ts`)

```ts
type EnglishDirective = "to what extent" | "discuss" | "how" | "evaluate";

interface EnglishEssayQuestion extends BaseQuestion {
  type: "englishEssay";
  group: "englishEssay";
  maxMarks: 20;
  id: string;                            // "y12-english-essay-writing.e1" … ".e6"
  prompt: string;                        // verbatim from specify-prompt.md
  directive: EnglishDirective;           // full phrase, used by the highlighter and reviewer
  offer: 1 | 2 | 3 | 4 | 5 | 6;          // display order 1–6
  live: boolean;                         // false until content review + marker/model gates
  source: string;                        // required on all six school-trial questions
  conceptIds: string[];                  // PUBLIC practice tags; skill-* ids only
}
```

| id | offer | source | directive |
|---|---:|---|---|
| e1 | 1 | Knox 2025 Trial, Q6 | to what extent |
| e2 | 2 | Pymble 2024 Trial, Q6 | to what extent |
| e3 | 3 | Abbotsleigh 2025 Trial, Q6 | discuss |
| e4 | 4 | Fort Street 2023 Trial, Q6 | how |
| e5 | 5 | Girraween 2025 Trial, Q6 | evaluate |
| e6 | 6 | Barker 2026 Trial, Q6 | discuss |

`conceptIds` names the writing skills the question practises. It is public metadata, does not drive progress, and may contain only the eight `skill-*` concepts. It is not the model answer's coverage.

`UnitMeta` additions are `flow: "englishEssay"`, `conceptsReady: true`, `conceptsClearOnOtherQuestions: true`, and a one-question quiz group. The unit is registered only when at least one essay is live. Ids are never renumbered or reused; making an essay non-live does not delete its attempts or results.

### 1.2 Server-only key (`answers.ts`, `Answer.englishEssay`)

```ts
interface EnglishEssayKey {
  markingNotes: string;       // what a strong answer to THIS question does; never browser-facing
  modelEssay: string;         // original band 1 response on Away, 900–1,100 words
  conceptTags: string[];      // full concept ids a strong answer uses; all 19 ids allowed
}
```

There is no `schoolCriteria` field: the approved rubric carries the Section II bands and the per-question key carries marking notes. `conceptTags` is distinct from public `conceptIds`; it may name Away-specific answer coverage and never reaches the browser. A non-live essay may have no key.

The only key readers are `englishEssayPublicView`, `englishEssayKeyForMarker` and `englishEssayModelEssay` in `lib/grading.server.ts`. The model reader is called only for a finished row owned by the session user.

### 1.3 Directive definitions (`directives.ts`)

`evaluate` and `discuss` resolve through `verbDefinition` in `content/glossary.ts`. Two local entries are explicitly labelled "Unit guidance (not a NESA glossary definition)":

- `to what extent`: "Make a judgement about how far the statement holds: agree, qualify or challenge it, and sustain that judgement with evidence."
- `how`: "Explain and analyse the ways the text achieves the effect named, showing how its form and language make meaning."

`findDirective(question, directive)` returns original-string offsets using the full stored phrase, whitespace-tolerant matching and letter boundaries. The renderer highlights that range and displays the definition. A missing directive is a validation error.

### 1.4 Concept list (`concepts.ts`, one source)

`ENGLISH_ESSAY_CONCEPTS` is the single record used to build public `Concept[]`, the TypeScript marker prompt and (through `scripts/english-essay-concepts-json.ts`) the Python pilot. Every id is `y12-english-essay-writing.c-<key>` with `clearAfter: 2`; shipped ids are never renamed or reused.

| Group | Keys |
|---|---|
| Away (11) | `away-tom-mortality`, `away-coral-grief`, `away-gwen-fear`, `away-class-migrants`, `away-meg-independence`, `away-harry-vic-acceptance`, `away-storm-catalyst`, `away-shakespeare-frame`, `away-play-within-play`, `away-context-1967`, `away-symbols` |
| Writing skills (8) | `skill-answers-question`, `skill-thesis`, `skill-analysis-not-recount`, `skill-technique-effect`, `skill-dramatic-form`, `skill-apt-evidence`, `skill-human-experience`, `skill-expression` |

Reviewed content may append ids, never rename them. A list edit changes the prompt hash, requires a new `promptVersion`, regenerates the golden and reruns the marker gate.

## 2. Scaffold (`lib/english-essay/scaffold.ts`)

```ts
interface EnglishEssayScaffold {
  thesis: string;
  body: [
    { claim: string; evidence: string },
    { claim: string; evidence: string },
    { claim: string; evidence: string },
  ];
}

type ScaffoldReason = "over_cap" | "no_thesis";
```

Seven string fields; no conclusion and no unknown keys. Each field has a defensive 1,500-character cap; non-strings invalidate the body and unknown keys are dropped.

- `scaffoldWords = Σ countWords(field)` over all seven fields.
- `save`: valid at 0–150 words, including an empty thesis; over 150 is refused and not stored.
- `start` and `review`: the same cap plus `thesis.trim() !== ""`; every claim and evidence note may be empty.
- `scaffoldCounter(n, 150)` supplies the counter wording.
- A successful start/review stores the scaffold and atomically sets `status = "writing"` and `scaffold_locked_at`. Later edits return `409 scaffold_locked`.

The browser mirrors drafts to `sessionStorage` under `draft:english-essay-scaffold:<attemptId>`; the server row is authoritative on resume.

## 3. Review (`lib/english-essay/review.json`) [S2]

```ts
type EnglishReviewCheckId = "thesis" | "claims" | "development" | "evidence" | "fit";
interface EnglishPlanReview {
  checks: Array<{ id: EnglishReviewCheckId; status: "strength" | "fix"; line: string }>; // exactly five, in this order
}
```

The review has no mark, band, figure flags or rewritten plan. It is stored with `review_prompt_version`, `review_model` and `reviewed_at`, but is never included in the result view. `ENGLISH_ESSAY_REVIEW_LIVE` starts false and changes only after the seven-scaffold pilot and Chiang's approval.

## 4. Reference text (`reference_texts`) [S1]

```text
reference_texts
  id             text primary key                 -- "away"
  content        text not null                    -- full server-only play
  content_hash   text not null                    -- 64-character SHA-256 hex
  loaded_at      timestamptz not null default now()
```

This is shared non-personal state: no user id, attempt id, answer or name. `scripts/load-reference-text.ts` reads the gitignored local copy and upserts by id, printing only id/hash/byte count. `reference-text.server.ts` loads it on first use and caches the normalised play index by hash.

There is no browser route for this table. Tests seed a short invented passage into PGlite. Content validation and the content builder read the local file directly instead of the database. A missing row refuses marking before a model call or daily slot; it never produces an unchecked result.

## 5. Essay attempt schema change (`drizzle/0010_*.sql`) [S1]

### 5.1 Additive columns on `essay_phases`

| Column | Type | English meaning |
|---|---|---|
| `final_band` | smallint null | band containing `final_mark`; required for a finished English row |
| `question_focus` | text null | `fully`, `partly` or `barely` |
| `question_focus_reason` | text null | question terms engaged or missed |
| `knowledge_errors` | jsonb null | deduplicated `[{ quote, why, source }]` |
| `quote_results` | jsonb null | every checked quotation and its status/ratio/correction |
| `reference_text_hash` | text null | hash of the play version used for this result |

Existing columns retain their lifecycle roles: `band` is the **marker-selected** band, `raw_mark` the marker's mark, `final_mark` the adjusted mark, `criteria` the four English verdicts, `review` the five-line English review, and `scaffold` the English JSON. `covers_both` and Economics `flags` are null/empty for English. `used_well`, `gaps`, `lift`, `band_reason`, `prompt_version`, `model`, timestamps and the 130-second lease are reused.

`EnglishEssayPhaseRow` gives these fields English types without changing the Economics `EssayPhaseRow` alias. The English query module validates and maps the JSON at its boundary.

### 5.2 Attempt index

```sql
CREATE UNIQUE INDEX attempts_english_essay_incomplete_unique
  ON attempts (user_id)
  WHERE unit_id = 'y12-english-essay-writing' AND completed_at IS NULL;
```

One open English attempt per student; completed attempts and Redo are unconstrained. Other units are unaffected.

### 5.3 Per-unit checks

The migration drops and recreates the existing checks with the same names and per-unit branches; no Economics row is backfilled or rewritten.

- `essay_phases_scaffold_words`: Economics 0–250; English 0–150.
- `essay_phases_marked_fields`: Economics keeps its current raw/final marks 1–20, 600–800 words and required fields. English requires final mark 1–20, raw mark 0–20, marker/final bands 1–5, 800–1,200 words, four criteria, focus and reason, knowledge errors, quote results, a 64-character reference hash, prompt version and model.
- `essay_phases_finished_iff_marked`, `essay_phases_status`, `essay_phases_locked_iff_not_planning`, and `essay_phases_review_needs_lock` retain their current meaning for both units.
- `question_focus` is null or one of `fully`, `partly`, `barely`; `final_band` is null or 1–5. English finished rows require them non-null; Economics rows may leave them null.

`results` is unchanged: one row per finished attempt with `marks_awarded = final_mark`, `max_marks = 20`, `graded_by = "llm"`, `answer = essay_text`, `feedback = band_reason`, and `concept_outcomes` from §9. `rewrite_drafts.phase1_draft` holds the in-progress essay; phase 2 is unused.

## 6. Stored attempt records and state machine

### 6.1 Marking-related JSON

```ts
type EnglishCriterionId = "argument" | "analysis" | "knowledge" | "expression";
type EnglishCriteria = Record<EnglishCriterionId, { verdict: "strong" | "sound" | "developing" | "weak"; reason: string }>;

type KnowledgeError = {
  quote: string;                         // student's exact words
  why: string;                           // what is wrong, or not-found wording
  source: "marker" | "quote-check";
};

type QuoteCheckResult = {
  quote: string;
  status: "ok" | "near" | "other-source" | "not-found";
  correct?: string;                      // near only: exact play words
  ratio?: number;                        // near/not-found, two decimals
};
```

All quote results are stored for audit. Only `near` and `not-found` become browser `quoteFlags`; `other-source` (the question's wording or a listed syllabus phrase) is never shown or counted. `ok` results never need display. Knowledge errors are stored deduplicated, marker errors first, then unique not-found errors.

### 6.2 State transitions

```text
(no attempt) --start live essay--> planning       [attempt + English phase created]
planning --save scaffold--> planning              [unlocked, ≤150 words]
planning --Start writing--> writing               [thesis required; plan locked]             S1
planning --Get feedback--> (review in flight)                                               S2
     review ok            --> writing             [five lines stored; plan locked]
     reviewer failed/cap  --> planning            [editable; Start writing offered]
     review not live      --> planning            [only Start writing offered]
planning|writing --Discard--> deleted             [open/unmarked only; lease null or stale]   S1
writing --Submit--> (marking lease, then reference load)
     reference missing    --> writing             [no model/slot; draft kept; explicit refusal]
     marked               --> finished            [all fields; results row; attempt complete; draft deleted]
     marker failed        --> writing             [lease cleared; slot refunded; draft kept]
     daily cap            --> writing             [lease cleared; no slot; Submit off until Sydney midnight]
     duplicate leased     --> 409 marking_in_progress
finished --Redo--> new planning attempt           [old result untouched; latest mark wins]
```

A failed result-row save leaves a finished phase with a signed receipt; the next start/unit visit repairs it idempotently. Resume maps `planning → scaffold`, `writing → write`, `finished → result`; a lease is never restored as a marking screen. The timer is client-only and not represented here [S2].

## 7. Final-mark function (`lib/english-essay/scoring.ts`)

### 7.1 Knowledge-error deduplication

1. Validate marker errors: non-empty `why`; `quote` must occur in the essay after case/whitespace normalisation; otherwise drop the item.
2. Within marker errors, deduplicate when either normalised `quote` **or** normalised `why` repeats. This counts repeated occurrences of one underlying mistake once, including a repeated quote with reworded explanation or the same explanation for another occurrence.
3. The quote checker emits only unique not-found quotations. Append one `quote-check` error per unique not-found quote unless an existing marker error overlaps it. Overlap uses straightened/collapsed text with surrounding punctuation removed and is true when either quote contains the other. This handles a marker quoting the whole sentence around the same invented quotation.
4. Near matches and quotations under three words add no error. The final list preserves marker order, then quote-check order.

The approved prompt instructs the model to list each distinct underlying mistake once. Code deliberately uses these deterministic keys rather than guessing semantic similarity between different factual mistakes.

### 7.2 Exact calculation

```text
clamped       = clampToBand(rawMark, markerBand)       // 17–20, 13–16, 9–12, 5–8, 1–4
errorCount    = deduplicated knowledge errors (marker + unique not-found)
deduction     = min(errorCount, 2)
mark          = clamped - deduction
if errorCount >= 2: mark = min(mark, 16)
focusCap      = partly ? 12 : barely ? 10 : 20
mark          = min(mark, focusCap)
finalMark     = max(mark, 1)
finalBand     = band containing finalMark
```

Return audit/display fields `{ clampedMark, finalMark, finalBand, deduction, knowledgeCapApplied, focusCap, capped }`, where `capped = finalMark < clampedMark`. `band` remains the marker-selected band; `final_band` is stored separately.

### 7.3 Boundary test matrix

A table-driven test generates every combination of:

- each band 1–5;
- raw marks `band.min - 1`, `band.min`, `band.min + 1`, `band.max`, `band.max + 1` (clamped to the parser's 0–20 domain where needed);
- error counts 0, 1, 2 and 3;
- focus `fully`, `partly`, `barely`.

That is 5 × 5 × 4 × 3 = **300 cases**, with expected values calculated independently in the test. Additional cases prove: raw 0 clamps to the selected band's minimum; minimum final mark 1; final band changes after caps; repeated marker errors count once; a marker/not-found overlap counts once; near matches cost nothing; and two different underlying mistakes count twice.

Examples:

| raw / marker band | errors | focus | final | final band | Reason |
|---|---:|---|---|---:|---|
| 15 / 1 | 0 | fully | 17 | 1 | clamp up |
| 20 / 3 | 0 | fully | 12 | 3 | clamp down |
| 19 / 1 | 1 | fully | 18 | 1 | one deduction |
| 19 / 1 | 2 | fully | 16 | 2 | deduction, then cap 16 |
| 17 / 1 | 3 | fully | 15 | 2 | deduction capped at two |
| 19 / 1 | 1 | partly | 12 | 3 | deduction, then focus cap |
| 19 / 1 | 2 | barely | 10 | 3 | knowledge cap, then focus cap |
| 18 / 1 | 2 | partly | 12 | 3 | cap 16 before focus cap |
| 13 / 2 | 1 | partly | 12 | 3 | focus cap after deduction |
| 11 / 3 | 1 | barely | 10 | 3 | focus cap after deduction |
| 2 / 5 | 3 | fully | 1 | 5 | minimum 1 |
| 19 / 1 | one overlapping marker + not-found | fully | 18 | 1 | overlap counts once |

## 8. Quote-check data

The deterministic contract is in [contracts/quote-check.md](contracts/quote-check.md). Stored `quote_results` uses the `QuoteCheckResult` shape in §6.1. `near` corresponds to the Python pilot's `misquote`; `correct` is present only for `near` and contains the exact raw play words. Ratios are rounded to two decimals. A model essay is valid only when every extracted quotation has `status = "ok"`.

The reference hash is stored with the finished attempt so a later play reload cannot change the interpretation of an old result. No full play or unflagged excerpt is included in a browser payload.

## 9. Gap outcomes and derived progress

`outcomesFrom(gaps, usedWell)` is reused unchanged:

```text
results.concept_outcomes =
  gaps (on-list, deduped, ≤5, marker order) as { conceptId, correct: false }
  followed by usedWell (on-list, ≤8, minus any gap) as { conceptId, correct: true }
```

`conceptProgress` replays results in answer order. A miss sets count to 2 and `raisedBy = questionId`; a correct use decrements unless it is on that same question; a later miss re-raises and changes `raisedBy`. At 0 the concept clears. Nothing is stored per student beyond results.

Example: e1 misses `skill-thesis` (2) → redo e1 uses it well (ignored, still 2) → e2 uses it well (1) → e3 uses it well (0, cleared). `latestGapDetails` supplies the latest English detail line to `ConceptPanel.details`; public practice tags play no part in this replay.

## 10. Computed views

### 10.1 Unit page item

```ts
{
  question: PublicEnglishEssay;             // live only, offer order
  latest: { mark: number; band: number | null; attemptId: string; at: string } | null;
  open: boolean;
  nextUp: boolean;
}
```

`band` is `final_band`, not the marker-selected band. `openAttempt` includes the signed token needed by Discard and the current stage.

### 10.2 Finished result view

```ts
interface EnglishEssayResultView {
  questionId: string;
  essay: PublicEnglishEssay;
  finalMark: number;
  finalBand: 1 | 2 | 3 | 4 | 5;
  capped: boolean;
  knowledgeCapApplied: boolean;
  focusCap: 12 | 10 | null;
  criteria: EnglishCriteria;
  bandReason: string;
  lift: string[];
  questionFocus: "fully" | "partly" | "barely";
  questionFocusReason: string;
  knowledgeErrors: Array<{ quote: string; why: string }>;
  quoteFlags: Array<{ quote: string; status: "near" | "not-found"; correct?: string; ratio?: number }>;
  gaps: Array<{ conceptId: string; term: string; detail: string }>;
  essayText: string;
  plan: EnglishEssayScaffold;
  words: number;
  modelEssay?: string;                       // only the student's own finished result
}
```

The view omits raw mark, marker-selected band, review, notes, Away notes, key tags, used-well ids and successful quote results. The focus warning renders only for `partly`/`barely`. Unfinished detail returns only public question, plan and draft.

## 11. Retention, deletion and cleanup

All attempt data cascades from `users` through the phase's user FK and composite attempt FK. Two-year retention and immediate delete-student therefore remove English phase, draft, attempt and result rows; tests prove another student's rows remain. The dry-run report includes English `essay_phases` counts.

Discard deletes the open `attempts` row only when incomplete and the lease is null or older than 130 seconds; its phase and draft cascade, while earlier finished attempts remain. `clear-unfinished-essays.ts` stays paragraph-only and is not used for this unit. `reference_texts` has no student data and is not deleted by retention; it is replaced only by an explicit loader run or the pre-commercial licensing action in Principle V.

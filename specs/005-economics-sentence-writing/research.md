# Research: Economics Sentence Writing

Phase 0 output for `specs/005-economics-sentence-writing`. Each item gives the decision, the
reason, and the alternatives rejected. Where the spec's Assumptions and `resources/topic009/04-findings.md`
disagree, the spec wins.

## R1. Question type and content shape

**Decision**: a new public question type `"rewrite"` whose `prompt` is the plain-English sentence
and whose `maxMarks` is 3. The server-only answer key gains three optional fields on `Answer`:

```ts
interface RewriteTargetTerm {
  conceptId: string;        // a concept of the unit (the term IS a concept)
  term: string;             // exact spelling, e.g. "tariff"
  definition: string;       // one line, the concept description
  equivalents: string[];    // accepted equivalents, e.g. ["import tax", "customs duty"]
  misuses: string[];        // listed misuses, e.g. ["quota"]
}

// on Answer, rewrite questions only:
modelSentences?: string[];  // 1-2 accepted versions
targetTerms?: RewriteTargetTerm[];  // 1-3, usually 2
markingNotes?: string;      // accepted equivalents and common misuses, prose
```

Multi-concept tagging: add an optional public `concepts?: string[]` to `BaseQuestion` and keep the
existing `concept?: string` untouched. A rewrite question sets `concepts` to its target terms'
concept ids; every existing unit keeps using `concept` and works unchanged. The `retired` map
becomes `Record<string, string | string[] | null>`: a removed rewrite question records its several
concept ids as an array, a removed single-concept question keeps a string, and a pre-tagging
removal keeps `null`. `content/index.ts` gains `conceptsOfQuestion(unit, questionId): string[]`
(question's `concepts`, else `[concept]`, else the retired value) alongside the existing
`conceptOfQuestion`, which stays for the single-concept path.

**Rationale**: a new type keeps the existing `mc`/`short` flows byte-for-byte intact; the answer
key fields are optional so the validator and every existing unit are unaffected. `concepts` is
public (a tag is not an answer, as today) and the key fields stay in `content/answers/index.ts`
(server-only), so the public registry never imports them.

**Alternatives rejected**: changing `concept` to `string[]` would force every existing unit and
every consumer (`conceptOfQuestion`, progress, weighting, validator) to change at once; a separate
`concepts` field is additive. Storing the key fields in a new file per unit was rejected because
the existing `answers.ts` + `content/answers/index.ts` registry already enforces server-only.

## R2. Phase state

**Decision**: a small new table `rewrite_phases`, one row per `(attempt_id, question_id)`, holding
the phase 1 sentence, phase 1 marks, phase 1 per-term outcomes, phase 1 feedback, the phase 2
sentence, phase 2 marks, phase 2 feedback, and a `status` (`phase1` | `phase2` | `final`). The
`results` row is created only when the question is final, so "a results row means answered" and
every existing query (sums, counts, completion, history, averages) keeps working unchanged.

**Rationale**:
- **Resume on another device**: the phase row is in the database, scoped to the session user, so a
  student can continue at phase 2 with the hint on any device (FR-021).
- **FR-023 (nothing leaks on reload)**: the phase row is read server-side; the browser only ever
  receives the hint (missed/misused terms and definitions) after phase 1 is graded below 3, and the
  full key only with the discussion or self-mark screen. A reload re-reads the row and re-sends
  exactly what that stage allows.
- **Idempotency**: `UNIQUE(attempt_id, question_id)` on the phase table makes the phase 1 insert
  idempotent; a second simultaneous phase 1 submit conflicts and returns the stored result without
  a second grading call or a second allowance slot (R6).
- **History and averages**: a pending phase is not a result, so it never counts as answered.
- **Principle II**: the phase row stores only the kinds of data already permitted per result — the
  student's own sentences, the marks, the per-term outcomes and the feedback they saw — and is
  deleted with the student (cascade). The constitution is amended to say so explicitly (see plan,
  Constitution Check).

**Alternatives rejected**:
- (a) A signed phase token like the photo transcription token: survives a same-tab reload but not
  another device, so it fails FR-021's cross-device resume.
- (b) Nullable phase columns on `results` plus a pending state: `marks_awarded` is `NOT NULL` and
  the unique key means a row exists from phase 1, so every existing query would need to filter
  pending rows; too invasive.

## R3. Term outcomes for concept tracking

**Decision**: a new nullable `jsonb` column `concept_outcomes` on `results`:
`Array<{ conceptId: string; correct: boolean }>`, set for rewrite results from phase 1 (or from
the self-mark ticks on the degrade path). `lib/concepts/progress.ts` replays a result with
`conceptOutcomes` by applying each term in order: `correct` takes 1 off the count (never below 0),
`wrong` sets it to 3 and records `lastMissedAt`. A result without `conceptOutcomes` replays exactly
as today (one concept from the question's current tag). A removed rewrite question still replays
from its stored `conceptOutcomes`; the `retired` tombstone still records its concept ids for the
validator.

**Rationale**: a per-term outcome cannot be derived from the total mark (2/3 can mean "term A
correct, term B wrong, conciseness lost"), so it must be stored with the result — the same way
marks are. Storing it on the result row (not a separate per-student table) keeps it inside
Principle II's per-result allowance and deleted with the student. Existing units' progress is
untouched because their results have no `conceptOutcomes`.

**Alternatives rejected**: reusing `rubric_hits`/`rubric_misses` would mix the LLM's shown rubric
points with concept ids and would leak concept outcomes into the student-visible feedback lists;
a separate per-student concept table would violate "concept counts are derived from results".

## R4. Grading

**Decision**: a new `gradeRewrite` call in `lib/openrouter.server.ts` with its own prompt. The
model returns only the judgements code cannot compute:

```json
{
  "criterionA": true,
  "padding": false,
  "terms": [ { "term": "tariff", "status": "used" | "missing" | "misused" } ],
  "feedback": "1-2 sentences to the student"
}
```

Code computes everything else, so the model cannot game marks:
- **Word count** — one shared `countWords(text)` (whitespace-separated tokens; hyphenated words and
  numbers count as one) in a new plain module `lib/wordcount.ts` used by both the client counter
  and the server (FR-043).
- **Criterion (c)** — `wordCount <= 25 && !padding`.
- **Criterion (b)** — all-or-nothing: every term's status is `used`.
- **Marks** — `criterionA + criterionB + criterionC` (0-3); phase 2 is capped at 2.
- **Recorded mark (FR-019)** — the higher of the phase 1 mark and the capped phase 2 mark; a 3/3
  phase 1 records 3.

The grader receives the plain-English sentence, the target terms (term, definition, accepted
equivalents, listed misuses) and the student's answer — **not** the model sentence, so it judges
meaning against the plain sentence rather than parroting the model. The prompt follows the existing
grader's safeguards: answer delimited in the prompt, "respond with JSON only", answer truncated at
6000 characters, one retry on an unparseable reply, then `needsSelfMark` (slot refunded).

**Rationale**: keeping marks in code makes the three criteria exact and testable with a stand-in
grader (FR-036), and keeps the phase 2 cap and best-of rule out of the model's hands.

**Alternatives rejected**: letting the model return `marksAwarded` directly (it could drift from
the all-or-nothing rule and the cap); passing the model sentence to the grader (biases it toward
exact matching, against FR-026).

## R5. What reaches the browser, when (FR-023)

**Decision**: a strict per-stage map, enforced by the server:

| Stage | Key material the browser may receive |
|---|---|
| Attempt start / quiz page (before phase 1) | None. Public question data only: prompt, `maxMarks: 3`, `type: "rewrite"`, `concepts` |
| Phase 1 grade, 3/3 | Discussion material: model sentences, every target term with definition and why it fits, feedback |
| Phase 1 grade, under 3 | The hint only: missed/misused terms with their definitions (FR-015); if every term was used, no terms, only the lost criterion in the marker's words (FR-045); plus the phase 1 feedback |
| Phase 2 grade | Discussion material (as above) |
| Resume (quiz page load) | Whatever the phase row's status allows: nothing before a phase 1 grade; the hint after a sub-3 phase 1; the discussion once final |
| Self-mark screen (degrade) | Model sentences, every target term with its definition, the plain sentence |
| Attempt detail page | The stored sentences, both marks, feedback, per-term outcomes (as hits/misses); never model sentences (not stored per result, Principle I) |
| Unit page | Concept descriptions (public) in "Concepts to review" |

The public content registry (`content/index.ts`) never imports `modelSentences`, `targetTerms` or
`markingNotes`; they live only in `content/answers/index.ts` (server-only) and are read only
through `lib/grading.server.ts`.

**Rationale**: the hint is a deliberate, scoped release of part of the key after the student has
attempted phase 1 and scored below 3 — the answer cannot be read from the page source beforehand.
The constitution is amended to permit exactly this (see plan).

## R6. Allowance and double taps

**Decision**: each phase uses at most one grading call and one daily-allowance slot (FR-029). The
grade route's existing order is kept: verify token → already-answered check → rate limit → reserve
one slot atomically → grade. For rewrite:
- **Phase 1**: the already-answered check reads the phase table. A second simultaneous submit finds
  the row and returns the stored phase 1 result (`409 already_answered`-style) before any slot is
  reserved, so it cannot spend a second slot or grade twice. The phase 1 insert is
  `INSERT … ON CONFLICT (attempt_id, question_id) DO NOTHING`; a lost race returns the stored row.
- **Phase 2**: refused unless the phase row's status is `phase1` and `phase1_marks < 3` (the server
  reads the row; the client cannot forge it). The phase 2 update is guarded by
  `WHERE status = 'phase1'`, so a double tap updates once; the second returns the stored result.
- Client single flight is kept as a nicety but is not the control — the database is.

**Rationale**: the atomic slot reservation (`reserveAiSlot`) and the phase table's unique key are
the same controls that already stop double-spend on short answers; no new mechanism is needed.

## R7. Degrade path (FR-030, FR-046)

**Decision**: when the model fails, the allowance is used up or the database is down, there is no
phase 2. The self-mark screen shows the model sentence and every target term with its definition,
and asks the student to mark each criterion with one tick per term for criterion (b). The
self-mark token is extended to carry the question's target-term concept ids, and the self-mark
route accepts `criterionA`, `termTicks: { [conceptId]: boolean }` and `criterionC` for rewrite
questions instead of the binary `correct` flag. The route verifies the token (which binds the term
ids, so the client cannot invent terms), computes `marks = A + B(all terms ticked) + C`, and stores
`concept_outcomes` from the ticks. Self-marked term results count the same as automatically marked
ones (spec 002 FR-005, FR-046).

If phase 1 was graded but phase 2's call fails, the student self-marks the phase 2 sentence with
the same per-criterion ticks; the recorded mark is the best of the phase 1 mark and the capped
self-marked phase 2 mark (FR-019 still applies).

**Rationale**: per-term ticks are the only way to get concept outcomes on the degrade path, and
signing the term ids into the token is the same anti-forgery pattern as the existing self-mark
token's `answerHash`.

## R8. Draw and weighting

**Decision**: the unit's `meta.quiz` is `{ short: 0, mc: 0, passMark: 60, groups: [{ group: "rewrite", n: 5 }] }`.
`lib/attempts/draw.server.ts`'s `drawWeighted` is extended so a rewrite question is a candidate for
a weighted place when **any** of its `concepts` is in the student's uncleared states (the existing
round-robin, unseen-first, within-mix logic is unchanged). The unweighted draw already picks 5 from
the `rewrite` group at random; with ~60 questions the weighted draw's unseen-first preference keeps
repeats rare, matching the essay scaffold unit's draw.

**Rationale**: the existing weighted draw already handles "a question belongs to a concept"; the
only change is matching a question whose `concepts` array contains the current state's concept.
No new draw algorithm is needed.

**Alternatives rejected**: a separate weighted draw for rewrite questions would duplicate the
round-robin and mix logic for no benefit.

## R9. Concept summaries

**Decision**: definition only — the spec 002 summary/illustration pipeline does **not** run for
this unit. The unit is marked `conceptsReady: true` (so "Concepts to review" and weighting work),
but the unit page lists terms by their one-line definitions only, and the concept-content ensure
route is never called for this unit's concepts. The existing `ConceptPanel` already degrades to
one-line descriptions when no approved content exists, so no new UI is needed.

**Rationale**: a term's definition is its concept description, and the definition is the teaching
content (the hint shows it after phase 1). Generating summaries and illustrations would cost model
calls for no added value and would risk leaking model sentences into shared content.

**Alternatives rejected**: running the pipeline (cost, and the reviewer would need the rewrite
answer key, widening the answer-key read path); a new meta flag to suppress the panel (the panel
already degrades gracefully).

## R10. The final term list (FR-007)

**Decision**: 31 tracked terms, each a concept of the unit, chosen from the 40 in
`01-term-inventory.md` so every term can appear in at least 4 of ~60 questions (31 × 4 = 124
term-slots ≤ ~132 available at 2.2 terms per question). Applied the findings' drops and merges
(§3) and the review fixes: "imports" (used by pilot Q3) is added as a tracked term, and "economic
growth" is defined as an increase in real GDP (not per person).

Dropped (12): international division of labour, regional business cycle, dispute settlement,
monetary union, trade creation (not in the inventory), dumping, HDI, Gini coefficient, income
distribution, import substitution, special economic zone, and infant industry was kept (pilot Q4,
classic protection concept). The full list with concept ids and descriptions is in `data-model.md`.

**Rationale**: 31 terms fits the FR-007 floor (each ≥ 4 questions) within the ~132 slots, and the
drops are exactly the narrow or near-synonym terms the findings flagged as hard to write 4 varied
sentences for. Writing the 60 questions is a later content task; this plan fixes the format, the
validation and the content-authoring prompt it will need.

## R11. Logging (FR-044)

**Decision**: reuse the photo answers' HMAC-hashed user id and outcome list. A small
`logRewriteGrade(outcome, durationMs, model)` helper logs one line per grading call:
`[rewrite] outcome=<outcome> user=<hmac(userId)> question=<questionId> duration_ms=<ms> model=<model>`.
Outcomes cover every path: `graded`, `unparseable`, `model_fail`, `rate_limited`,
`over_allowance`, `already_answered`, `phase_refused`, `db_unavailable`. No sentence, model reply,
definition or marking note is ever logged.

**Rationale**: the HMAC-hashed user id and the outcome vocabulary already exist for photo answers
(spec 004 FR-026); reusing them keeps observability consistent and bounded.

## R12. UI

**Decision**: `components/Quiz.tsx` gains a rewrite branch: the phase 1 box with the live word
counter (over 25 shown in warning colour, submit still allowed), the phase 2 hint panel (missed or
misused terms with definitions, or the lost criterion per FR-045, plus the phase 1 feedback), and
the discussion (model sentences, each term with its definition and why it fits, the student's
sentences, the feedback). No Photo tab for this type. A `sessionStorage` draft per phase (reusing
`lib/drafts.ts` with a phase-qualified key). The attempt detail page shows both sentences and both
marks from the phase row. The unit card and unit page show the new type "Writing Practice" and the
`meta.guide` (FR-003). All layouts are checked at 390 px with no sideways scrolling.

**Rationale**: the quiz runner already has the short-answer box, the self-mark fallback and the
draft machinery; the rewrite branch reuses them rather than adding a new page.

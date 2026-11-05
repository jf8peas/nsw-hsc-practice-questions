# Research: Economics Paragraph Writing

Decisions for [plan.md](plan.md). Each has the decision, the reason and the alternatives rejected.
File and line references are to the repo as read on 2026-11-05. Rules from specs 005 and 006 carry
over unless a decision here says otherwise.

**Source gap to close first.** The requirements doc linked from `design.md` is a Claude Docs
document; this session had no Claude Docs connector, so it could not be opened. Everything here is
taken from `spec.md`, `design.md`, the mockup sources, `scripts/pilot-paragraph-marker.py` (round 5
criteria) and `resources/topic010/`. The criteria are therefore the marker's wording. The 17 tip
sentences in R7 are drafts built from the examples in `design.md` and the criteria; the content
task confirms each against the requirements doc before it ships (T-content in tasks).

---

## R1. Progression (FR-001 to FR-005)

**Decision.** The unit is *sequential*: public metadata `meta.sequence = { kind: "essay-parts", parts: 5 }`.
For a sequential unit the draw is not random and not weighted. A pure function
`nextQuestion(unit, answeredIds)` in `lib/attempts/sequence.server.ts` walks the unit's questions
in bank order (essay 1 part 1 … essay 1 part 5, essay 2 part 1 …) and returns the first one with no
`results` row for the student. Every quiz is one attempt holding exactly one question id.

- **Recorded mark.** A part has a recorded mark when a `results` row exists for its question for
  this student ("a results row means answered", spec 005). The row is written at these endings and
  no others:
  1. phase 1 scores 4/4 → recorded 4 (ending `full_marks`);
  2. phase 2 marked → recorded = max(phase 1, min(phase 2, 3)) (ending `corrected`);
  3. FR-019a: cap used up or marker unavailable at phase 2 → recorded = phase 1 mark (ending
     `no_correction`);
  4. self-mark at phase 1 → recorded = number of ticks (ending `self_mark`).
  A phase 1 under 4 with no phase 2 yet leaves only a `paragraph_phases` row (status `phase1`), no
  result, so the part is offered again.
- **Starting a quiz.** `POST /api/attempts` for a sequential unit reads the student's results,
  finds the next question, and either returns the existing incomplete attempt for that question or
  creates one. If every question has a result the route answers `200 { finished: true }` and
  creates nothing.
- **Two tabs at once.** A partial unique index on `attempts (user_id, (question_ids[1]))` where
  `unit_id = 'y12-economics-paragraph-writing'` means a second insert for the same part conflicts.
  The route does `INSERT … ON CONFLICT DO NOTHING RETURNING`, and when nothing is returned selects
  the existing attempt. Both tabs end up on the same attempt id (`201` for the creator, `200
  { resumed: true }` for the other). This also enforces "one essay in progress, no restart" in the
  database: a part can never have two attempts.
- **Unfinished part offered again.** The incomplete attempt is reused (same id), so the saved
  draft, phase row and correction text come back (FR-035). No new attempt row is created, so history
  shows one row per part.
- **"Essay N of M".** M is the number of essays in the unit's bank (questions ÷ 5, checked to be a
  whole number by the validator), so a bank of 2 reads "Essay 1 of 2". N is the 1-based position of
  the essay the next question belongs to. The mockup's "of 12" is the target bank, not a constant.
- **Fixed order.** Bank order is the order of `questions.ts`. New essays are appended and ids never
  renumbered (Principle III), so a student mid-bank never sees the order change.
- **All essays finished.** `finished: true`. The unit page drops the essay block and shows, in its
  place, "You've finished every essay so far. New essays are added as they're written." with no
  start button. The attempt history and "Things I need to know" still show.
- **Fits the attempt model.** One question per attempt is already valid (`questionIds` is an array;
  `finalizeIfComplete` completes when every question has a result). `quiz.groups = [{ group:
  "paragraph", n: 1 }]` keeps `UnitMeta` valid but the sequential branch never calls `drawAttempt`.
- **Helpers that change.** `app/api/attempts/route.ts` (branch on `unit.sequence`, skip
  `loadWeighting`), `lib/attempts/draw.server.ts` (untouched; sequence logic is a new file),
  `lib/db/queries/attempts.server.ts` (new `createSequentialAttempt`), `lib/startAttempt.ts` (read
  `finished`, store `paragraphState`), `lib/types.ts` (`UnitMeta.sequence`, `ParagraphQuestion`).
  `complete.server.ts` is unchanged.

**Reason.** The progression must be derivable from stored results (FR-003) and survive two tabs and
two devices. A unique key in the database is the only race-proof way on the Neon HTTP driver, which
has no interactive transactions.

**Alternatives rejected.**
- A per-student "position" column or table: a second source of truth that can disagree with results
  (Principle II: derive, do not store).
- Advisory locks or `SELECT … FOR UPDATE`: the HTTP driver cannot hold a lock across statements.
- Letting the client send the part it wants: Principle I forbids it and would allow skipping.
- Using the weighted draw with a "pick the next part" quota: it shuffles and weights by concept,
  and the draw is deliberately untouched for other units.

**Database unreadable.** The next part cannot be chosen without reading results, and a guess would
send a student to Essay 1 mid-bank. `POST /api/attempts` answers `503 { error:
"temporarily_unavailable" }` and the unit page shows "We can't load your place in the essay right
now. Try again in a moment." This is the one place a quiz does not start during an outage, so it
needs a Principle VI amendment (R12, A4).

---

## R2. Content shape (FR-006, FR-007, FR-037 to FR-040)

**Decision.** `content/units/y12-economics-paragraph-writing/` holds `meta.ts`, `questions.ts`,
`concepts.ts`, `essays.ts` (server only) and `answers.ts`. Five public questions per essay.

Public (safe in the browser bundle):

| Field | Where | Why public |
|---|---|---|
| question id `y12-economics-paragraph-writing.eNNpK` (K = 1..5) | `questions.ts` | foreign key in results; never renumbered |
| `type: "paragraph"`, `group: "paragraph"`, `maxMarks: 4` | `questions.ts` | shape |
| `essayId` (`e01`), `essayNo`, `part` (1..5), `prompt` = the essay question, `verb` (`evaluate`), `economy` ("Vietnam") | `questions.ts` | the unit page shows question, verb and economy to every student; none is an answer |
| `concepts`: the part's three tip ids and the two all-parts tip ids | `questions.ts` | a tag is not an answer (Principle III) |
| verb definitions (NESA glossary) for evaluate, assess, analyse, discuss | `content/glossary.ts` | shared, not essay data |
| part names, short labels, word limits, criterion short names, the 17 tips, the generic "how to apply" line per criterion | `lib/paragraph/parts.ts` | taught before writing; no model text |

Key (server only, in `essays.ts`, read only through `lib/grading.server.ts`, FR-023 to FR-025):

```ts
interface EssayKey {
  essayId: string;                 // "e01"
  economyType: "emerging" | "developing";
  strategy: string;                // one line, goes to the marker
  brief: { economy: string; argument: string; counterpoint: string;
           chainSteps: string[]; facts: string[]; limitation: string[] };
  uses: Record<1|2|3|4|5, BriefField[]>;           // fields marked "Use in this part"
  guidance: Record<1|2|3|4|5, [string, string, string, string]>; // "What this part must do"
  models: Record<1|2|3|4|5, string>;
  commentary: Record<1|2|3|4|5, string>;           // text after the dash under the model part
  markingNotes: Record<1|2|3|4|5, string>;
  limitation: { tag: LimitationTag; topicPhrase: string; evaluationPhrase: string };
  figuresVerified: string;         // ISO date the content task last checked every figure
}
```

`answers.ts` builds an `AnswerSet` with one entry per question: `{ rubric: [], paragraph: { essay,
part } }` (a new optional `Answer.paragraph`). `content/answers/index.ts` registers it unchanged in
form, so the "only `lib/grading.server.ts` imports the key" test still passes. Briefs and guidance
are key material even though a student sees them: they are released one essay at a time by
`paragraphQuestionView()` (R3) instead of shipping all 12 briefs in the public bundle, which also
keeps future essays out of the page source.

**Validation** (extends `lib/content-rules.ts` with `validateParagraphRules`, wired into
`scripts/validate-content.ts`; FR-039 plus extras):

1. every essay has five questions and an `EssayKey` with all five models, guidance (4 lines each),
   uses (non-empty, subset of brief fields), commentary and marking notes;
2. every model part is within its word limit using `countWords` (40, 90, 80, 90, 45);
3. guidance line 4 names the part's limit ("within 80 words");
4. **counterpoint thread.** `limitation.tag` is one of the recognised angles (inequality,
   sustainability, external-shocks, dependence, time-lags); `topicPhrase` must appear verbatim
   (case-insensitive) in the Topic Sentence model and `evaluationPhrase` in the Evaluation model;
   the Link model must contain at least one of the two phrases' content words (flag only, a
   warning, because the link may paraphrase). An author who changes either model must keep the
   anchors honest, and the validator fails the build if they drift;
5. **no new facts (FR-007).** Every figure in a model part (a number with %, a year, or 2+ digits)
   must also appear in the brief's `facts`, `limitation` or `chainSteps`;
6. **placeholders fail.** Any brief or model text matching `/\bUS\$x\b|\b0\.x{2,}\b|\bx{1,3}\b(?=\s*(bn|%|m\b))|\bTODO\b|\bTBC\b|supplied by the content task/i`
   fails, and `figuresVerified` must be a past ISO date. The design's placeholders therefore can
   never reach a student;
7. **public files hold no model text.** No 30-character run of any model part, note or brief
   sentence may appear in `questions.ts`, `concepts.ts`, `parts.ts` or `glossary.ts`;
8. the verb appears in the essay question; the verb is in the glossary;
9. the 17 tip concepts exist with the right `clearAfter` (R7), ids unique, every question tagged;
10. the bank size is a multiple of five and question ids follow `eNNpK` with no gaps.

**Which essays ship first.** Essay 1 is Vietnam (trade liberalisation and FDI, emerging), the pilot's
`vn` essay, authored fresh in TypeScript from the pilot content with figures re-verified. Essay 2 is
Bangladesh (garment exports, developing), the pilot's `bd` essay. Both were tuning material, which
is fine: they only seed the *content*; the marker prompt is never tuned to the unit's live answers
beyond the revision loop (R8). The **India** essay (`in`, the frozen held-out set) is not shipped
as unit content in v1, so no student can write against text the held-out answers were labelled
against, and the prompt is never tuned to it. Remaining essays (target 12) are a separate content
task, not plan tasks; the unit launches with what passes validation. Sources go in
`docs/y12-economics-paragraph-writing-research.md` (Principle V); nothing is shown to students.

**Reason.** Keeping briefs and models in the server-only key matches Principle I's "public files
hold no model answers" and lets the release schedule in R3 be enforced in one module.

**Alternatives rejected.**
- Briefs in public `questions.ts`: simpler, but ships every future essay's facts to every browser
  and makes "release only at the right time" untestable for the brief.
- One question per essay with five internal parts: breaks "a quiz is one part", the attempt model
  and per-part history.
- A free-text counterpoint comparison by LLM at build time: nondeterministic; the anchor-phrase
  rule is cheap, deterministic and reviewable.

---

## R3. What reaches the browser, when (FR-021, FR-023 to FR-025)

**Decision.** All key reads go through four exports of `lib/grading.server.ts`; no other module
imports the key.

| Export | Returns | Called from |
|---|---|---|
| `paragraphQuestionView(questionId)` | essay no/total, part, limit, verb definition, 4 guidance lines, the brief, `uses`, and `earlier[]` = model text of parts 1..K-1 of this essay | attempt start, quiz page (every stage), resume |
| `paragraphDiscussion(questionId)` | the current model part, its commentary, `modelSoFar[]` (parts 1..K), `laterSlots[]` (labels only), `next` (what Finish leads to) | grade response (4/4, phase 2, FR-019a, self-mark), resume at discussion |
| `markParagraph(questionId, answer, phase)` | verdicts, reasons, feedback (the marker; sends the current model and notes to the model, never to the caller) | grade route |
| *(none for tips)* | tips and application lines are public static text in `lib/paragraph/parts.ts`, so they cannot carry model text | — |

Release map:

| Surface | May carry | Never carries |
|---|---|---|
| `POST /api/attempts` (start/resume) | public question, `paragraphState.view` (brief, guidance, verb definition, earlier models), essay progress, saved drafts, and for a resumed attempt the stage payload | current model, later models, markingNotes |
| Quiz page (server component) | same as above, rebuilt from the database | same |
| `POST /api/grade` phase 1/2 | `criteria[]` (verdict, reason, subs), `feedback`, marks, `ending`, and `discussion` only when the question is final or self-marking | later models, notes; **no model text under 4 with a correction pending** |
| Self-mark needed (`needsSelfMark`) | `discussion` (model part, commentary, model so far, labels) | later models |
| `POST /api/results/self-mark` | marks, `ending`, `discussion` | later models |
| Discussion on resume | `discussion` | later models |
| `POST /api/paragraph/flag` | `{ flagged }` | everything else |
| Unit page | essay question, verb, economy, part dots, recorded marks (from results) | brief, models |
| Attempt detail | texts, marks, criteria, reasons, feedback from `paragraph_phases` | any model text, notes, brief |

`earlier[]` is key material released before grading (FR-023, FR-008): it is built in
`paragraphQuestionView`, never read from a public file. The labels for later slots are computed from
the part number alone ("4 · EVALUATION — NEXT QUIZ", "5 · LINK — QUIZ AFTER") and contain no key
text.

**Tests (extend `tests/no-key-leak.test.ts`).** A new `describe("paragraph unit")`:
1. for every shipped essay and every part, the start response contains none of the later parts'
   models, the current model, any marking note (substring of ≥ 30 characters), and contains every
   earlier model;
2. the same for the quiz page payload, the grade response at each of: phase 1 under 4, phase 1 at
   4, phase 2, FR-019a, self-mark, and the resume payload at each stage (using the PGlite route
   env);
3. the discussion at part K contains models 1..K and exactly `5-K` labelled slots, none with text
   beyond its label;
4. `BANNED_KEYS` gains `markingNotes`, `models`, `commentary` (the generic loop must not fail for
   this unit's legitimate `brief` and `earlier`, so the loop's "banned" set is the existing list
   plus these three, and `brief`, `earlier`, `guidance` are not banned);
5. the import-boundary tests already cover `content/units/*/answers` and `essays.ts` must be
   added to the offender regex (`essays` in the path), so only `lib/grading.server.ts` and the
   validator import it.

**Principle I amendment text** (full text in R12, A1).

**Alternatives rejected.** Releasing the whole paragraph's model with the later parts "hidden by
CSS": violates FR-021 by definition. Computing earlier models client-side from a public file:
public file would hold all five.

---

## R4. The marker (FR-011, FR-012, FR-018, FR-019, FR-028)

**Decision.** `lib/paragraph/marker.server.ts` exports
`markParagraph(input): Promise<MarkerResult | null>`; `lib/grading.server.ts` assembles `input`
from the key. The rubric is **one JSON file**, `lib/paragraph/rubric.json`, read by both the app and
`scripts/pilot-paragraph-marker.py`:

```jsonc
{
  "promptVersion": "round 5 (4 Nov 2026)",
  "parts": { "topic": { "name": "Topic Sentence", "limit": 40, "job": "...", "criteria": { "a": "...", "b": "...", "c": "..." } }, ... },
  "conventions": { "preciseLanguage": "...", "noPadding": "..." },
  "system": "You are marking one part ... Respond with JSON only, no prose outside it.",
  "userTemplate": "Essay question: {question}\nDirective verb: {verb}\n..."   // {placeholders}
}
```

The Python script is refactored to `json.load` this file and fill `userTemplate`; the TypeScript
module does the same substitution. Drift is caught two ways: (a) a vitest `tests/paragraph/prompt.test.ts`
renders a fixture input and compares to `tests/fixtures/paragraph-prompt.golden.txt`; (b)
`python scripts/pilot-paragraph-marker.py --check` renders the same fixture and compares to the
same golden file, and is run in the quickstart. Changing the rubric text means editing one JSON
file, regenerating the golden file and bumping `promptVersion`; both checks fail until all three
agree. `parts.ts` (public: names, limits, short names) is checked against the JSON's `name` and
`limit` by the same test.

- **Inputs** (`MarkerInput`): essay question, directive verb, economy and type, strategy, brief,
  the earlier parts' model text *as shown to the student*, the part and its job and criteria, the
  word limit, the current model part, the marking notes, the student's text. The current model and
  notes go to the *model provider* (as in the pilot, where they raised agreement) but never to the
  browser.
- **Reply** (unchanged from round 5): `{ restated, criteria: { a|b|c: { reason, met } },
  conventions: { reason, preciseLanguage, noPadding }, feedback }`. `restated` is discarded, not
  stored (it can contain a rewrite of the student's text). A missing or non-boolean verdict is a
  failed parse. Reasons are trimmed and capped at 300 characters, feedback at 400 (truncate, never
  fail). The marker is not asked for "tips missed": they are computed in code from the verdicts
  (FR-018's "tips missed" is satisfied by `lostCriteria`), so a model cannot invent a tip.
- **Parsing with one retry.** First `{…}` block, as the pilot and `parseRewriteJson` do; on failure
  one second call with the same messages; on failure again the marker is *unavailable*.
- **Unavailable** means any of: no `OPENROUTER_API_KEY`; `LLM_DAILY_CAP` is 0 or used up;
  per-user or per-IP rate limit (a 429 is *not* unavailable, see R5); HTTP error or timeout on both
  attempts; unparseable twice.
- **Decided in code, not by the model.**
  - Word count: `countWords` from `lib/wordcount.ts` for the meter, the marker and the validator.
  - Criterion (d) = `preciseLanguage && noPadding && wordCount <= limit`. When over the limit the
    (d) reason is overwritten with "Over the {limit}-word limit ({n} words)." and
    `subs.withinLimit = false`; the model's own `noPadding`/`preciseLanguage` still decide the other
    halves and their tips.
  - Mark = number of met criteria (a, b, c, d). Phase 2 mark = `min(raw, 3)`. Recorded = `max(p1,
    p2capped)`. These live in `lib/paragraph/scoring.ts` (pure, no I/O), tested in isolation.
  - Cause-and-effect connectors are not criteria; the feedback line may mention them (prompt as is).
- **Safeguards kept.** Answer length cap `MAX_ANSWER_LEN` (6000, as the rewrite route), the
  student's text inside a triple-quoted block, `temperature: 0`, JSON mode. No prompt text is
  added in v1; a prompt-injection hardening line is a revision-loop change (new `promptVersion`),
  not a silent edit.
- **Model and env.** `GRADING_MODEL` (default `deepseek/deepseek-chat`) and `OPENROUTER_API_KEY`
  via `chatCompletion` in `lib/openrouter.server.ts`. `maxTokens: 1200` (as the pilot), timeout 30 s
  (the shared `TIMEOUT_MS` is 20 s; `chatCompletion` already takes `timeoutMs`). The grade route
  gets `export const maxDuration = 60` (the transcribe and regenerate routes already set it).
- **Fake server.** `scripts/fake-openrouter.ts` gains `FAKE_PARAGRAPH=pass|partial|fail|malformed|down|slow`.
  The reply honours a directive inside the student's text, `[met:abd]`, so a manual or automated
  run chooses the verdicts; `malformed` returns prose twice (tests the retry then
  unavailable); `slow` sleeps 12 s (tests the status steps). Route tests stub `chatCompletion` as
  `tests/api/grade-rewrite.test.ts` does.

**Reason.** One file the Python and TypeScript both read removes drift by construction; the golden
test is the safety net against the two template renderers diverging.

**Alternatives rejected.**
- Port the prompt as TypeScript constants and keep the Python copy: the two *will* drift, and the
  revision loop (R8) exists to compare exactly those prompts.
- Spawn Python from the app: no Python at request time (Vercel), and Principle VIII.
- Ask the model for the tips and the mark: the mark and the word-limit rule must be deterministic
  (FR-009); tips follow from verdicts.

---

## R5. Limits and failure paths (FR-019, FR-019a, FR-033, FR-034)

**Decision.** `handleParagraphGrade` (new `lib/paragraph/grade-handler.server.ts`, called from the
`question.type === "paragraph"` branch of `app/api/grade/route.ts`, mirroring `handleRewriteGrade`).

Per call, in order: validate body → read the phase row (scoped to the session user) → decide what
phase is allowed → per-user then per-IP rate limit → `reserveAiSlot` (one slot of `LLM_DAILY_CAP`) →
marker → refund the slot if the marker was unavailable.

- **At most 2 slots per quiz, enforced by state, not a counter.** Phase 1 is allowed only when no
  phase row exists; phase 2 only when the row is `phase1` with a mark under 4; a final row refuses
  everything with `409 already_answered`. Each allowed phase takes exactly one slot (the marker's
  internal retry is a second HTTP call inside the same slot, as for rewrite). A refunded slot is
  not "used", so a quiz that self-marks uses 0.
- **Phase 1, marker unavailable or over the cap →** no row is written; the response carries
  `needsSelfMark: true`, the `discussion` (model part, so the student can self-mark) and a signed
  self-mark token; `aiLimit` is set when it was the cap. No error text. The student ticks four
  boxes, `POST /api/results/self-mark` writes a `final` row (`mode: self_mark`) and the result
  (R6).
- **Phase 2, over the cap or marker unavailable →** FR-019a. The row is finalised
  `ending: no_correction`, `recorded = phase 1 mark`, a result is written, and the response is a
  normal 200 with `result.ending = "no_correction"`, the phase 1 criteria (so the tip cards show),
  `discussion`, and `aiLimit` when applicable. The correction is never self-marked and no error
  string is returned. The correction text the student typed is *not* stored on this path (it was
  never marked); the draft row is deleted with the others.
- **Rate-limited (429) is not "unavailable".** It returns `429 { error: "rate_limited",
  retryAfter }`, the box returns with the student's text and the usual message (nothing consumed).
  The same for a request that never reached the server (offline, network or 5xx): the client
  returns to the editable box holding the text and shows the usual error; nothing was recorded.
- **Database down mid-quiz.** Start is refused (R1). During a quiz: phase 1 → self-mark with a
  notice (as rewrite, `degraded: true`, receipt-based save through the existing
  `/api/results/retry`); phase 2 → `503 temporarily_unavailable`, box returns with text, same as
  rewrite. Principle VI is amended for the start and for FR-019a (A4).
- **Logging.** `lib/paragraph/log.server.ts` (modelled on `rewrite-log.server.ts`): hashed user id,
  question id, phase, outcome (`graded | unparseable | model_fail | rate_limited | over_allowance |
  already_answered | phase_refused | db_unavailable | flagged | flag_repeat`), `duration_ms`,
  model. Never the answer, a reason, the feedback, the brief or a model part. A test spies on
  `console.*` for a full run and asserts none of the fixture strings appear (FR-034).

**Reason.** State-based limits cannot be bypassed by a client and survive two tabs; the cap
behaviour reuses `reserveAiSlot`'s atomic upsert unchanged.

**Alternatives rejected.** Counting slots per attempt in a column (second source of truth);
returning an error at phase 2 when the cap is used (violates FR-019a and Principle VI's "no error");
self-marking the correction (the clarification forbids it).

---

## R6. Persistence (FR-028, FR-029, FR-035, FR-036)

**Decision.** A new table `paragraph_phases`, one row per question in a paragraph attempt, plus a
partial unique index on `attempts`. Drafts reuse `rewrite_drafts`. Full shapes are in
[data-model.md](data-model.md).

Compared:

| Option | For | Against |
|---|---|---|
| Extend `rewrite_phases` | one table, existing queries | its checks (`phase1_marks <= 3`, `phase2_marks <= 2`) and term-specific columns do not fit; a type column plus nullable columns makes every rewrite query carry paragraph concerns |
| **New `paragraph_phases`** | clean checks (0..4, 0..3), verdict jsonb, flag, prompt version | one more table to cascade (it cascades with the user and attempt like the others) |

`paragraph_phases` stores, per phase: text, mark, the four verdicts with a one-line reason each
(jsonb, including the (d) sub-verdicts), the overall feedback, the prompt version and the model
slug that marked it, and when. It also stores `mode` (`marker | self_mark`), `ending`
(`full_marks | corrected | no_correction | self_mark`, null until final), `recorded_mark` and
`flagged_at`. The unique `(attempt_id, question_id)` makes the phase 1 insert idempotent across
tabs (as `insertRewritePhase`). The flag is a conditional update (`WHERE flagged_at IS NULL`), so
it is stored once and a repeat is a no-op (FR-029).

- **Drafts.** `rewrite_drafts` is already generic (attempt, question, phase1/phase2 text, `unit_id`).
  `app/api/rewrite/draft/route.ts` currently insists on `question.type === "rewrite"` and a
  `rewrite_phases` stale check; it gains a `paragraph` branch checking `paragraph_phases`. The
  route name stays (renaming breaks the sendBeacon client for rewrite); the contract notes it
  serves both. `MAX_DRAFT_LEN` 6000 is enough (limits are ≤ 90 words).
- **Migration.** `npx drizzle-kit generate` → `drizzle/0005_*.sql`: `CREATE TABLE paragraph_phases`
  with the composite FK to `attempts (id, user_id)` and the user FK, both `ON DELETE CASCADE`;
  `CREATE UNIQUE INDEX attempts_paragraph_part_unique ON attempts (user_id, (question_ids[1]))
  WHERE unit_id = 'y12-economics-paragraph-writing'`. No backfill, no change to existing rows.
- **Delete and retention.** Both paths delete `users` rows; every table with a `user_id` FK
  `ON DELETE CASCADE` goes with them (`lib/retention.server.ts` and `deleteUsersByEmail` delete
  only from `users` and `daily_ai_usage`). `scripts/delete-student.ts` needs no code change; a test
  creates a paragraph attempt with phases, a draft and a flag, runs `deleteStudentByEmail` and
  `runRetention`, and asserts zero rows remain in `paragraph_phases`, `rewrite_drafts`, `attempts`,
  `results`.
- **Attempt detail** reads `paragraph_phases` through `listParagraphPhases(db, userId, attemptId)`
  (scoped to the session user, Principle IX) and shows text, marks, criteria, reasons and feedback.
- **Principle II amendment** (A2, below). The amendment is task T001 and must land before any
  schema change.

**Reason.** The spec requires the verdicts, reasons and prompt version stored for every marked
phase and a once-only flag; a dedicated table with real constraints is the simplest correct
shape.

**Alternatives rejected.** Storing verdicts in `results.rubric_hits/misses` (loses the structure and
the phase split, and `results` is one row per question); logging the prompt version only (cannot
tie a flag to the prompt that marked it); a separate `flags` table (an extra join for a
once-per-answer boolean).

---

## R7. Tip tracking (FR-026, FR-027, FR-033)

**Decision.** 17 concepts in `concepts.ts`, one per tracked criterion, ids
`y12-economics-paragraph-writing.c-<slug>`:

| Group | Ids | Count |
|---|---|---|
| Topic Sentence | `c-topic-a` position with evaluative language, `c-topic-b` names strategy and outcome, `c-topic-c` frames the counterpoint | 3 |
| Mechanism | `c-mechanism-a` complete ordered chain, `c-mechanism-b` states the economic reason, `c-mechanism-c` names the model, stays on theory | 3 |
| Evidence | `c-evidence-a` figures with years, `c-evidence-b` ties each number to what it shows, `c-evidence-c` links back to the mechanism | 3 |
| Evaluation | `c-evaluation-a` same limitation as the topic sentence, `c-evaluation-b` explains why it limits, `c-evaluation-c` weighs how much | 3 |
| Link | `c-link-a` judgement answering the verb, `c-link-b` weighs argument against counterpoint, `c-link-c` adds nothing new | 3 |
| All parts | `c-all-precise` precise economic language, `c-all-concise` within the limit, no padding | 2 |

Each `Concept` gets `term` ("Topic Sentence" … "All parts") so `ConceptText` already renders
"**Topic Sentence**: …", and a new optional `clearAfter?: 2 | 3` (2 for the 15 part tips, 3 for the
two all-parts tips). The connectors advice is not a concept, so it can never be tracked.

Criterion (d) maps to two tips: `preciseLanguage` false → `c-all-precise` missed; `noPadding` false
or over the limit → `c-all-concise` missed. A met (d) is a correct use of both. A paragraph
question's outcome list has five entries (a, b, c tips and the two all-parts tips), stored in
`results.concept_outcomes` from **phase 1 only** (as spec 005 FR-033), or from the ticks on the
self-mark path (ticked = correct, unticked = missed, FR-033; a (d) tick covers both all-parts
tips). Phase 2 outcomes and the FR-019a ending never feed progress.

**Change to `lib/concepts/progress.ts`:**

```ts
const DEFAULT_CLEAR_AFTER = 3;
// in conceptProgress(unit, results):
const clearAfter = new Map(unit.concepts?.map((c) => [c.id, c.clearAfter ?? DEFAULT_CLEAR_AFTER]));
const apply = (concept, correct, at) => {
  const start = clearAfter.get(concept) ?? DEFAULT_CLEAR_AFTER;
  ...
  else { current.count = start; current.lastMissedAt = at; }   // was MAX_COUNT
};
```

`ConceptState.count` widens to `1 | 2 | 3` unchanged (a 2-start concept is 1 or 2). Existing
tests keep passing because every existing concept defaults to 3. `components/ConceptPanel.tsx`
reads pips from `TO_CLEAR` (3); it takes `concept.clearAfter ?? 3` per row, and the section
description string for this unit is "Writing tips you missed on a first try. A part tip clears after
2 correct first tries at that part; an all-parts tip after 3." (from `design.md` §4.2). The
mono count ("1 to go") is `count`.

- **Summaries and illustrations (spec 002).** Switched off, as for the sentence unit:
  `ConceptPanel` already skips the live-content pipeline for `unit.type === "Writing Practice"`
  (line 141), and `planConceptWork` only runs for visible concepts. The unit page shows the tip as
  the row text only.
- **Weighting.** None. The sequential branch never calls `loadWeighting`/`drawWeighted`, so
  "Things I need to know" has no effect on the draw (the draw is fixed order). The home page's "to
  review" count still uses `conceptReviewCounts`, which works unchanged.
- **Amendment** to the derived concept-count rule: R12, A3.

**Alternatives rejected.** Storing a per-concept counter (Principle II: derive); one tip per
(d) sub-criterion shown as one row (spec says 17 and two shared tips); a global start of 2 (would
change the existing units).

---

## R8. Flag and the offline revision loop (FR-029 to FR-032, SC-003)

**Flag route.** `POST /api/paragraph/flag`, body `{ attemptId, questionId, attemptToken }` (exactly
the fields Principle I allows plus the signed token). Session required; the attempt is looked up
for the session user; the token is verified; `UPDATE paragraph_phases SET flagged_at = now() WHERE
… AND flagged_at IS NULL AND status = 'final' AND mode = 'marker'` returns the row or nothing.
First call → `200 { flagged: true }`; repeat or second tab → `200 { flagged: true, already: true }`
(idempotent, same done state). A part still on the correction → `409 { error: "not_final" }`;
self-marked → `400 { error: "not_flaggable" }`. Rate limit: a new `checkFlagRateLimit`
(same Upstash/in-memory helper as the draft limiter; default 10 per minute per user, overridable
with a new `FLAG_RATE_LIMIT` env var documented in `README.md` and `.env.example` like
`DRAFT_RATE_LIMIT`). It never touches the
mark or the result row. Done-state button wording: **"Flagged for your teacher"** (disabled, with a
check icon, `aria-live` announcement "Flagged. Your teacher will look at it.").

**Offline scripts** (all under `scripts/`, run locally through Git Bash, no request-time code).
The two TypeScript scripts are registered in `package.json` as `paragraph-flags` and
`paragraph-remark`, run with `tsx --conditions=react-server` exactly like `delete-student`, because
they import `lib/` modules marked `server-only`:

1. `scripts/paragraph-flags.ts` — `list` prints flagged answers (essay, part, marks, flagged date,
   phase texts and reasons) from the database; `export <id…>` appends reviewed ones to
   `resources/topic010/pilot-essays.json` as a new essay entry `{ id: "field-<essayId>", set:
   "field", … }` copied from the content key (brief, models, markingNotes) with one case per
   exported answer: `{ id, part, text, fails: [] , ambiguous: [], note: "from flag, label by
   reviewer" }`. **The teacher edits `fails` to the correct label before it is a test case**
   (export marks it `"needsLabel": true`; the regression run refuses unlabelled field cases).
   Exported records contain **no student identity**: no name, email, user id, attempt id or
   timestamp; the id is `field-<n>`.
2. `scripts/paragraph-remark.ts` — samples N (default 40) recent phase-1 `full_marks` answers
   (mark 4, `mode = marker`), re-marks each with a **stronger model** through OpenRouter using the
   same rendered prompt (it imports `lib/paragraph/marker.server.ts`'s builder with `server-only`
   bypassed through the script's own tsconfig path, the way `scripts/*` already import `lib/`),
   and writes disagreements to a review file and, on `--export`, to the pilot file as unlabelled
   field cases. It **checks the three leniency patterns first**: Link (a) comparatives taken as
   a judgement, Topic (b) "success" accepted as the outcome, Mechanism (c) a drawback with no
   statistic: those parts are sampled with priority (`--priority-first` default on) and reported
   in a separate table. It reads `OPENROUTER_API_KEY` and `REMARK_MODEL` from the environment or
   `.env.local` (Principle VII, scripts may), calls OpenRouter directly (so it never touches a
   student's `daily_ai_usage` or `LLM_DAILY_CAP`), and sends the same text to the same provider
   already used to mark it. No default for `REMARK_MODEL`: the teacher picks a model stronger than
   `GRADING_MODEL`; the script refuses to run if they are equal.
3. `scripts/pilot-paragraph-marker.py` (existing) — reads `rubric.json` (R4), resolves a case's set
   as `case.set ?? essay.set ?? "tuning"`, reports **tuning, holdout and field separately** (it
   already splits tuning/holdout), prints the prompt version in the report header, runs **every**
   case in the file by default (the existing `--set all`), refuses to run if a field case has
   `needsLabel`, and with `--gate` exits non-zero when tuning < 90 % or holdout < 80 % agreement
   (SC-003). The frozen India set stays untouched; the script's header comment and `--help` say the
   prompt is never tuned to it.

**Prompt version.** `rubric.json`'s `promptVersion` bumps on every change to the prompt text, the
criteria or the conventions. `paragraph_phases.phaseN_prompt_version` stores the value read at
mark time, so a flag always says which prompt marked it.

**Privacy.** Exported cases stay in `resources/` (gitignored: `git check-ignore resources` prints
`resources`). The answer text is student writing about a public economics topic; the identity is
removed at export. The re-mark sends sampled answer text to OpenRouter, the same provider that
marked it. The consent wording that covers AI marking of text answers needs one added sentence:
"Some answers may be re-marked later, without your name, to check and improve the marker." (A2
covers the constitutional side; the consent document itself is a task to locate and update.)

**Alternatives rejected.** A teacher review page (out of scope, FR-032); automatic prompt
tuning from flags (the loop is human-reviewed by design); storing field cases in git (student
writing in the repo).

---

## R9. Components and the question card's state machine

**Decision.** Build `components/paragraph/*` beside `components/rewrite/*`. Reuse the `rw-*` CSS
classes (R11) but not the rewrite components.

Why not generalise: of the six pieces named in the brief, only the step tracker and the locked block
are structurally the same; the first-try result, the self-mark screen and the collapsed first try
differ (four criteria with reasons instead of a term table, credited spans, a language note). A
generalisation touches the rewrite unit's tests (`quiz-rewrite.test.tsx`) and spec 007 says
"changes to other units" are out of scope. A later refactor can lift the two shared pieces.

Components (all client, props are plain data from `paragraphState`):

| Component | Role |
|---|---|
| `ParagraphPanel` | the state machine; owns text, step, timers, focus; the only stateful piece |
| `EssayProgressBar` | `<ol aria-label="Essay 3 progress: part 3 of 5">`, five labelled segments |
| `ParagraphStepTracker` | Write / Correct with tips / Discuss (or Mark it yourself); `<ol aria-label="Steps">` |
| `EssayQuestionBlock` | "ESSAY QUESTION", curly-quoted prompt with `<mark>`-styled verb (bold, not colour alone), optional definition |
| `PartGuidance` | "What this part must do" numbered list, "Marked out of 4 on these" |
| `BriefTable` | six field rows, "Use in this part" pill on the fields the part uses |
| `ModelSoFar` | earlier models under mono labels and the dashed slot for this part |
| `WriteBox` | label, textarea, word meter (`countWords`), "Submit for marking"; info line |
| `LockedPart` | read-only block with lock icon, word count, indeterminate bar |
| `MarkingStatus` | the three timed steps in a `role="status"` list |
| `CriterionResults` | the first-try result list: ✓/✗ with `aria-label`, short name, one reason |
| `TipCards` | one amber card per lost criterion: name, tip, generic application line |
| `CorrectionBox` | "Your correction", pre-filled, focused, cursor at end, "Submit correction" |
| `ResultSummary` | recorded mark and the two lines (table in design §8.1 plus FR-019a row) |
| `CriterionPills` | "First try" / "Fixed in correction" / "Not met" list |
| `FlagButton` | "This mark seems wrong" → "Flagged for your teacher" |
| `FinalBeside` | "YOUR CORRECTION"/"YOUR PART" beside "MODEL …" with commentary |
| `ModelParagraph` | paragraph with highlighted current part and chips for later parts |
| `TipsAdded` | tips missed in phase 1 with pips |
| `SelfMarkScreen` | locked text, model part, four ticks, "Save my mark" |

**States** (transitions are in `data-model.md` §State machine):
`writing → marking1 → {discussion (4/4) | correction (<4) | selfMark}`, `correction → marking2 →
discussion` or `→ discussion(noCorrection)` (FR-019a), `selfMark → discussion(selfMark)`.
`marking1` and `marking2` return to `writing` / `correction` with the text intact on a network
error, 429 or 503. `resume` enters `writing`, `correction` or `discussion` directly from
`paragraphState.stage`; `marking*` is never restored.

- **The submitted text is never cleared.** `ParagraphPanel` keeps `text1` and `text2` in refs and
  state as `RewritePanel` does; the textarea is replaced by `LockedPart` showing the same string;
  an error swaps back. Drafts save to sessionStorage on change and beacon to `/api/rewrite/draft`
  on blur/hide (`lib/drafts.ts` already has `saveRewriteDraft`, `loadRewriteDraft`,
  `sendRewriteDraftBeacon`; they are generic over attempt and question, so no new draft helper).
- **Timed steps.** As `RewritePanel`: step 1 ticked at once, step 2 after 1500 ms
  (`STEP2_DELAY_MS`), step 3 until the response arrives; one `setTimeout` per marking, cleared on
  unmount and on response; the live region announces each status once (text changes only when the
  step changes). Reduced motion: no spinner rotation or sliding bar (CSS media query plus the
  `reducedMotion` state the rewrite panel reads).
- **Focus.** Entering `correction`: the correction `textarea` gets focus with the caret at
  the end (spec 006 behaviour, FR-022). Entering `discussion`: the result summary (tabIndex -1)
  takes focus. The first-try result does not take focus (design §12 said it did; spec wins and
  design is corrected). `selfMark` focuses the first tick.
- **Quiz integration.** `Quiz.tsx` renders `ParagraphPanel` for `q.type === "paragraph"`, hides its
  own `.progress` bar and counter (the panel draws the essay bar and the pill row), and "Finish"
  calls `router.push(/unit/<id>)` instead of the end-of-quiz screen. `lib/startAttempt.ts` stores
  `paragraphState` and `essay` in the sessionStorage payload for offline resume.
- **FR-019a variant.** Summary line 1 "Your first try is recorded: n / 4 marks." line 2 "We couldn't
  mark a correction this time, so your first-try mark stands. The tips below are what to work on."
  Criteria list shows ✓/✗ only (no pills); tip cards titled "Work on these next"; no correction
  box; "This mark seems wrong" present (it flags the phase 1 mark); no "first try collapsed" row.

**Alternatives rejected.** One `ParagraphPanel` file of 600 lines (the rewrite panel is 475 and
hard to test); server-driven UI (the card state is client-local by design, as spec 006).

---

## R10. Unit page and history (FR-004, FR-036)

**Decision.** `app/unit/[unitId]/page.tsx` branches on `unit.sequence`:

- `loadEssayProgress(userId, unit)` (new, `lib/db/queries/sequence.server.ts`) returns the essay
  number/total, its public question/verb/economy, five part dots with recorded marks from
  `results`, the next part and `finished`. It reads only `results` and public content.
- The intro card shows the badges, the title "Writing economics paragraphs", the description from
  `design.md` §4.1, the exam row, then `EssayBlock` (server component) and the existing
  `StartQuiz` client button with label "Continue essay (Part 3 of 5)" or "Start essay (Part 1 of 5)".
  The old "Continue attempt" resume button is not rendered for this unit (the start route itself
  resumes).
- "Things I need to know" is `ConceptPanel` with the unit's description string and two/three-pip
  rows (R7).
- "Your results" and "Past attempts" reuse `AttemptHistory`; the row name for this unit is
  "Essay N · <part name>" derived from the attempt's single question id (public data); the mark is
  out of 4.
- `app/attempts/[attemptId]/page.tsx` gains a `paragraph` branch rendering text, phase marks,
  per-criterion ✓/✗ with reasons and the feedback from `paragraph_phases`. It reads no key and
  shows no model text, so later parts cannot leak there.
- The exam row needs an entry: `content/exams.ts` gets `{ id: "y12-econ-at1-2026", title: "Year 12
  Economics Assessment Task 1", date: "2026-12-01", unitIds: ["y12-economics-paragraph-writing"] }`
  (today the list is empty). Only this unit is listed; other units are unchanged.
- **Degraded.** If `requirePageUser` reports a degraded database the page shows the notice from R1
  and no start button.
- **Progress bar on the quiz page.** `EssayProgressBar` (R9) replaces the quiz progress bar; its
  data (`essay.parts[].state`) comes from the same loader.

**Alternatives rejected.** A separate page for the essay (the intro card is where the button
already is, per Principle VIII "Start quiz reachable without scrolling"); showing the brief on the
unit page (key material).

---

## R11. Styles (FR-042, SC-007)

**Decision.** Take sizes and wording from the mockup sources; map every colour to a token; add
only unit-scoped classes (`pg-*`) to `app/globals.css`, next to the `rw-*` block, and reuse `rw-card`,
`rw-steps`, `rw-textarea`, `rw-meter`, `rw-btn`, `rw-locked`, `rw-progress`, `rw-status`,
`rw-summary`, `rw-compare`, `rw-hint-grid`/`rw-hint-card`, `.q-card`, `.unit-intro`, `.section-head`,
`.concept-item`, `.stat-strip`, `.unit-attempt`.

Colours seen in the mockup sources and their tokens (no new colour literals):

| Mockup | Token |
|---|---|
| `#0B0F0D` | `--rd-ink-900` |
| `#2A2F36` | `--rd-ink-700` |
| `#4B5563` | `--rd-mute-600` |
| `#6B7280` | `--rd-mute-500` |
| `#D6DAE0`, `#E5E7EB` | `--rd-border-200`, `--rd-border-100` |
| `#F3F4F6`, `#F8F9FA`, `#ECEEF1` | `--rd-surface-100`, `-50`, `-200` |
| `#1A56DB`, `#0E3796`, `#DCE7FD`, `#EFF4FE` | `--rd-blue-500`, `-700`, `-100`, `-50` |
| `#1F8A5B`, `#ECF8F1` | `--rd-success-500`, `--rd-success-50` |
| amber card (warn) | `--rd-warn-500`, `--rd-warn-50` |
| red ✗ | `--rd-danger-500`, `--rd-danger-50` |

Sizes: body 14 px = `--rd-fs-md`; 12 px = `--rd-fs-sm`; 16 px = `--rd-fs-lg`; the 22 px mark follows
`.rw-summary-mark`. The mockup's 9.5 px mono labels are below `--rd-fs-xs` (11 px) and unreadable
at 390 px, so they use `--rd-fs-xs` (a deliberate departure). Radii: 4 → `--rd-r-xs`, 8 →
`--rd-r-md`, 12 → `--rd-r-lg`, pills 999 → `--rd-r-pill`.

Checks, each an automated test where possible:
- **Contrast 4.5:1.** `tests/styles/contrast.test.ts` computes WCAG ratios for the token pairs
  the `pg-*` and reused classes use. Known risks found by hand: `--rd-mute-500` on
  `--rd-surface-100` is about 4.4 :1 (below 4.5), so grey helper text on tinted panels uses
  `--rd-mute-600`; `--rd-warn-500` on `--rd-warn-50` is about 3.6 :1, so the amber card's text is
  `--rd-ink-700` and `--rd-warn-500` is only the border and icon; `--rd-success-500` is used for
  the ✓ glyph (non-text, 3 :1 suffices) and for text only on white at 16 px bold or larger.
  The test fails if a pair drops below its required ratio.
- **Targets ≥ 44 px.** Buttons `min-height: 48px`; collapsed `<details>` summaries, tick rows and
  the flag button `min-height: 44px`; checked in `tests/client/paragraph-a11y.test.tsx` by reading
  the CSS rules for those classes.
- **Reduced motion.** `@media (prefers-reduced-motion: reduce)` disables the indeterminate bar
  slide and spinner for `pg-*` and the reused classes (the `rw-*` rules already do; add the new
  ones).
- **390 px, no sideways scroll.** The brief table stacks its label above the text under 560 px;
  the beside-cards stack; long words wrap (`overflow-wrap: anywhere` on text blocks). Verified in
  the quickstart on a real phone (no layout test in jsdom can prove it) plus a Playwright-free
  check that no `pg-*` rule sets a fixed width over 100 %.

**Alternatives rejected.** Importing the `.dc.html` mockups or Tailwind; copying the mockup's
literal hex values.

---

## R12. Constitution amendments (version 2.13.0 → 2.14.0, MINOR)

The Constitution Check found five places where the feature cannot comply with 2.13.0 as written.
Task T001 applies all five, bumps the version to **2.14.0**, sets Last Amended to 2026-11-05 and
adds the Sync Impact Report entry, before any other task.

**A1. Principle I.** Add after the sentence-writing [DECISION] bullet:

> - [DECISION] The paragraph-writing unit (spec 007) MAY send part of its essay key to the browser
>   at defined moments, and only then. Before phase 1 is marked: the essay's brief, which brief
>   fields the part uses, the "What this part must do" lines, the directive verb's definition, and
>   the model text of the EARLIER parts of the same essay. After phase 1 is marked: the
>   per-criterion verdicts, the marker's one-line reasons and its overall feedback (never model
>   text). At the discussion or self-mark screen: the current part's model text and commentary,
>   the model text of the earlier parts, and labels (never text) for the later parts. Never, at any
>   moment, including on reload, resume or the attempt detail page: the model text of LATER parts,
>   the marking notes, or any model text in a tip. Earlier parts' model text MUST come through
>   functions exported from `lib/grading.server.ts`.

And amend the submission-routes bullet: "…the client MAY send only: `questionId`, `answer`, an
opaque `attemptId` together with the signed attempt token, **a phase number (1 or 2)**; for a
self-mark, **per-criterion tick flags (a to d)** or a binary `correct` flag together with the
signed self-mark token; … **and, for the paragraph unit's flag route, `attemptId`, `questionId`
and the signed attempt token**." (The phase number and ticks were already sent by the sentence
unit; this makes the text match.)

**A2. Principle II.** Add to the storage list after the writing-practice bullet:

> - per paragraph-writing question in an attempt (spec 007): the phase 1 and phase 2 texts, their
>   marks, the four per-criterion verdicts each with the marker's one-line reason, the overall
>   feedback shown, the prompt version and model that marked each phase, how the question ended
>   (marker, self-mark, or first-try mark kept because the correction could not be marked), the
>   recorded mark, and whether and when the student flagged the mark for review; stored in a phase
>   row, kept for the attempt detail page, deleted with the student like results. The student's
>   in-progress draft text is stored in the existing draft row. Verdicts, reasons and the flag
>   never change marks or concept tracking, which always come from the phase 1 outcomes.

And after the minimal-metrics sentence: "Answer text and per-criterion results MAY be copied,
without any student identifier, into local test files outside the repository (`/resources/`) to
test and improve the marker, and re-marked by the same AI provider; school consent must state this."

**A3. Principle II, derived concept-count rule and Quality Gates.** Replace "a wrong answer sets the
concept's count to 3, a correct answer takes 1 away, and the concept clears at 0" with "a wrong
answer sets the concept's count to its clear-after number (3, or 2 for a concept whose
`concepts.ts` entry declares `clearAfter: 2`), a correct answer takes 1 away, and the concept
clears at 0", in Principle II and in the Quality Gates testing bullet.

**A4. Principle VI.** Add:

> - [DECISION] A unit whose draw is sequential (spec 007) cannot choose its next question without
>   reading the student's results. If the database cannot be read, such a unit does not start a
>   quiz: it shows a notice and asks the student to try again; it MUST NOT guess a question.
> - [DECISION] On a correction (phase 2) of the paragraph-writing unit, a daily-cap or LLM failure
>   ends the question with the first-try mark and the discussion; the correction is never
>   self-marked. At phase 1 the self-marking fallback applies as for other units.

**A5. Principle VII.** Add: "`REMARK_MODEL` follows the same server-only rules as
`OPENROUTER_API_KEY`; it is read only by `scripts/**`, and offline re-marks do not count against
`LLM_DAILY_CAP`."

Also: Quality Gates "A constitution check confirming" gains "paragraph-unit later-part model text
and marking notes never leave the server", and the testing bullet list gains "the paragraph unit's
cap-at-phase-2 ending and tip clear-after counts".

**Checked and not needing amendment.** Principle III (sequential units still draw only from the
bank; ids appended never renumbered; every question carries concept tags); IV (the validator is
extended in the same change); V (sources doc; no source line shown; no real HSC questions, essays
are original); VIII (no new runtime dependency); IX (the flag and phase rows are scoped by the
session user; no teacher route is added; the scripts use direct database access like
`delete-student`).

---

## R13. Remaining decisions

- **Wording decided here.** Done flag: "Flagged for your teacher". All essays finished: "You've
  finished every essay so far. New essays are added as they're written." Next-essay footer: "Next
  quiz: Essay 4, Part 1 of 5, Topic Sentence". Phase 2 status steps: "Read your correction" /
  "Checking it against the four criteria again…" / "Writing your feedback"; footer "Usually takes
  10–20 seconds." / "Correction is worth up to 3 marks.". Self-mark discussion rows show "Your tick"
  instead of the three pills. FR-019a wording in R9.
- **Tip card application line.** Design §7.2 shows one line "applying it here" per card, written
  per essay. v1 uses one static line per criterion in `parts.ts` ("Re-read the brief's {field} and
  add …"). It names the field the part uses, never model wording. This makes "tip cards contain no
  model text" true by construction and testable across all essays (every card string comes from 17
  constants plus 15 static lines). `design.md` is corrected.
- **Later-slot labels.** First later slot "NEXT QUIZ", second "QUIZ AFTER", further ones "IN n
  QUIZZES".
- **Language note / credited spans.** Not carried over; the paragraph result has no span highlight.
- **Idempotent grading and `409`.** As rewrite: a second phase 1 submit returns `409
  already_answered` with the stored result; the client shows it.
- **Resume with a stale local token.** The quiz page re-signs the attempt token (as today).
- **No new dependency** (Principle VIII): `crypto`, `fetch`, `drizzle` and React only.

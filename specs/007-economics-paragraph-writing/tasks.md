---

description: "Task list for Economics Paragraph Writing implementation"
---

# Tasks: Economics Paragraph Writing

**Input**: Design documents from `/specs/007-economics-paragraph-writing/`

**Prerequisites**: plan.md, spec.md, research.md (R1 to R13), data-model.md, contracts/api.md, quickstart.md

**Tests**: The spec lists the tests it needs (its "Tests" input) and plan.md's Quality Gates table maps each to a file, so test tasks are included. Write each story's tests first and watch them fail before the implementation tasks.

**Organization**: Grouped by user story (spec.md). US1 to US4 are P1, US5 to US7 are P2, US8 is P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 to US8, as in spec.md
- Paths are from the repository root. Shell commands run through Git Bash (see CLAUDE.md); scratch files go in `.cline/`.

## Path Conventions

Single Next.js project: `content/`, `lib/`, `app/`, `components/`, `scripts/`, `tests/`, `drizzle/` (plan.md "Project Structure").

---

## Phase 1: Setup (amendment first, then shared types and the shared rubric)

**Purpose**: Constitution 2.14.0, then the types, schema and rubric every story needs.

- [X] T001 Amend `.specify/memory/constitution.md` to **2.14.0** exactly as research.md R12 (A1 Principle I paragraph-unit release schedule and the allowed request fields incl. phase, ticks and the flag route; A2 Principle II storage list and the re-marking sentence; A3 the clear-after-2 concept rule in Principle II and the Quality Gates testing bullet; A4 Principle VI sequential-start and FR-019a rules; A5 Principle VII `REMARK_MODEL`). Set Last Amended 2026-11-05, add the Sync Impact Report entry at the top, and add the two Quality Gates bullets from R12. Nothing else starts before this.
- [X] T002 Extend `lib/types.ts`: `UnitMeta.sequence`, `Concept.clearAfter`, `ParagraphQuestion` (added to the `Question` union), `Answer.paragraph`, as in data-model.md §1. Fix any exhaustive `switch` on `Question["type"]` that `npx tsc --noEmit` flags (add a `paragraph` case or default).
- [X] T003 Add `paragraphPhases` and the `attempts_paragraph_part_unique` partial unique index to `lib/db/schema.ts` per data-model.md §2, then generate and review `drizzle/0005_*.sql` with `npm run db:generate` (check it contains the table, both cascading FKs, all checks and the `question_ids[1]` expression index; no change to existing tables). Then run one PGlite test (`tests/helpers/db.ts` applies `./drizzle` for real) that applies migration 0005, inserts a `paragraph_phases` row that satisfies every check and one that violates `recorded_is_higher`, and inserts two attempts for the same part to prove the unique index rejects the second, before anything builds on it.
- [X] T004 [P] Create `lib/paragraph/rubric.json` (server only) from `scripts/pilot-paragraph-marker.py` round 5: `promptVersion` "round 5 (4 Nov 2026)", `parts` (name, limit, job, criteria a to c), `conventions`, `system` and `userTemplate` with `{placeholders}` reproducing `build_messages` exactly (including the "Model … (one acceptable version)" and "Marking notes" lines).
- [X] T005 [P] Create `lib/paragraph/parts.ts` (public, no model text): `PART_ORDER`, `PARTS` (name, short, limit 40/90/80/90/45, criterion short names, tip text, static `apply` line per criterion, tip ids with (d) as the pair `c-all-precise` / `c-all-concise`), `LIMITS`, and the helper that maps a part and verdicts to its five concept outcomes. Draft the 17 tip sentences from design.md §4.2/§7.2 and the criteria; mark each `// TODO confirm against the requirements doc` for the content owner.
- [X] T006 [P] Create `content/glossary.ts` (public): NESA definitions for `assess`, `evaluate`, `analyse`, `discuss`.

---

## Phase 2: Foundational (blocks every story)

**Purpose**: Pure logic, the unit skeleton with essay 1, the key accessors, the marker, the sequential start and the DB queries.

**⚠️ CRITICAL**: No user story starts until this phase is done.

- [X] T007 [P] Write `tests/paragraph/scoring.test.ts` (fails first) for `lib/paragraph/scoring.ts`: mark = met count; (d) = preciseLanguage && noPadding && within limit; over the limit loses (d) without blocking; phase 2 capped at 3 (all four met = 3); recorded = max(p1, capped p2); lost criteria and tip ids; concept outcomes (a,b,c + both all-parts tips; self-mark ticks, a `d` tick covers both).
- [X] T008 Implement `lib/paragraph/scoring.ts` (pure, no I/O) using `countWords` from `lib/wordcount.ts` until T007 passes.
- [X] T009 [P] Write `tests/paragraph/sequence.test.ts` (fails first) for `lib/attempts/sequence.server.ts`: `nextQuestion` returns the first bank-order question with no result; one essay at a time; a part without a result is returned again; `essayProgress` gives essay N of M with M = bank size ÷ 5 (a bank of 2 essays reads "of 2"); all answered gives `finished: true`.
- [X] T010 Implement `lib/attempts/sequence.server.ts` (`nextQuestion`, `essayProgress`) until T009 passes.
- [X] T011 [P] Implement `lib/db/queries/paragraph-phases.server.ts`: `getParagraphPhase`, `listParagraphPhases`, `insertParagraphPhase` (idempotent on the unique key, returns `{ inserted }`), `finaliseParagraphPhase` (guarded by `status = 'phase1'`), `flagParagraphPhase` (conditional `flagged_at is null`, `mode = 'marker'`, `status = 'final'`). All scoped to the session user id.
- [X] T012 [P] Add `createSequentialAttempt` to `lib/db/queries/attempts.server.ts` (`INSERT … ON CONFLICT DO NOTHING RETURNING`, else select the existing incomplete attempt for that user and first question id; returns `{ attempt, created }`) and `loadEssayProgress` to a new `lib/db/queries/sequence.server.ts` (reads `results` for the unit, calls `essayProgress`).
- [X] T013 [P] Add `checkFlagRateLimit` to `lib/ratelimit.server.ts` (same helper as `checkDraftRateLimit`, env `FLAG_RATE_LIMIT`, default 10 a minute) and `lib/paragraph/log.server.ts` (hashed user, question, phase, outcome, duration_ms, model; outcomes from contracts/api.md; never text).
- [X] T014 Create the unit skeleton `content/units/y12-economics-paragraph-writing/`: `meta.ts` (type "Writing Practice", title "Writing economics paragraphs", description from design.md §4.1, `sequence`, `conceptsReady: true`, `quiz.groups [{ group: "paragraph", n: 1 }]`, a `guide` for how it works), `concepts.ts` (17 tips via the helper in `content/concept-helpers.ts`, `term` = part name or "All parts", `clearAfter` 2 or 3, empty `retired`), `questions.ts` (a builder emitting the five `ParagraphQuestion`s for an essay with ids `eNNpK`, concept tags, `maxMarks 4`; starts with essay 1). Do **not** register the unit yet: registration in both `content/index.ts` and `content/answers/index.ts` happens together in T015, so the validator never sees a unit with no answer set.
- [X] T015 Author **essay 1 (Vietnam, trade liberalisation and FDI, emerging)** key in `content/units/y12-economics-paragraph-writing/essays.ts` and `answers.ts` (server only, `import "server-only"`), starting from the pilot `vn` essay but re-checking every figure and filling `figuresVerified`, `uses`, four `guidance` lines per part (line 4 names the limit), `commentary`, `markingNotes` and `limitation` anchors; register the unit in `content/index.ts` and its answer set in `content/answers/index.ts` in this same task. Record sources in `docs/y12-economics-paragraph-writing-research.md` (Principle V). No placeholder figures.
- [X] T016 [P] Write `tests/paragraph/content-rules.test.ts` (fails first), a failing and a passing fixture for each rule in research.md R2: five parts and keys complete, model within limit, guidance line 4 names the limit, counterpoint anchors (`topicPhrase` in the Topic model, `evaluationPhrase` in the Evaluation model), no new numeric facts in a model, placeholder regex, `figuresVerified` in the past, no 30-character run of key text in public files, verb in question and glossary, 17 tips with right `clearAfter`, bank multiple of five with no id gaps.
- [X] T017 Implement `validateParagraphRules` in `lib/content-rules.ts`, call it from `scripts/validate-content.ts` (skip the rubric-per-mark and MC rules for `type: "paragraph"`), and run `npm run validate` until T016 passes and essay 1 validates.
- [X] T018 Edit `lib/concepts/progress.ts`: per-concept start count from `unit.concepts[].clearAfter ?? 3` (research R7); keep every existing test green (`tests/rewrite/progress.test.ts`, `tests/usage-concept.test.ts`).
- [X] T019 [P] Write `tests/paragraph/marker-parse.test.ts` and `tests/paragraph/prompt.test.ts` (fail first): parse accepts the reply shape, rejects missing/non-boolean verdicts, trims and caps reasons/feedback, discards `restated`; one retry then unavailable; the rendered prompt for a fixed fixture equals `tests/fixtures/paragraph-prompt.golden.txt` (generate the golden from the current Python `--show-prompt` output, T020); `rubric.json` `name`/`limit` equal `parts.ts`.
- [X] T020 Refactor `scripts/pilot-paragraph-marker.py` to load `lib/paragraph/rubric.json` (no inline PARTS, CONVENTIONS or prompt text), keep behaviour identical, add `--check` rendering of the golden fixture and writing/diffing `tests/fixtures/paragraph-prompt.golden.txt`; confirm `python scripts/pilot-paragraph-marker.py --check` passes and the rendered prompt for a sample case is byte-identical to the old output.
- [X] T021 Implement `lib/paragraph/marker.server.ts` (build messages from `rubric.json`, `chatCompletion` with `temperature 0`, JSON mode, `maxTokens 1200`, `timeoutMs 30000`, `GRADING_MODEL`, parse, one retry, `null` when unavailable) until T019 passes.
- [X] T022 Add to `lib/grading.server.ts`: `paragraphQuestionView(questionId)`, `paragraphDiscussion(questionId)` and `markParagraph(questionId, answer, phase)` (assembles `MarkerInput` from the key and calls T021; applies `scoring.ts`). They are the only readers of `answer.paragraph`.
- [X] T023 Add the sequential branch to `app/api/attempts/route.ts` per contracts/api.md (derive next question from results; `createSequentialAttempt`; `201`/`200 resumed`/`200 finished`/`503`; skip `loadWeighting`; return `essay` and `paragraphState`), and `lib/paragraph/state.server.ts` (`buildParagraphState` from phase row + draft + view). Update `lib/startAttempt.ts` and `lib/drafts.ts` `AttemptPayload` to carry `finished`, `essay`, `paragraphState`.
- [X] T024 [P] Extend `scripts/fake-openrouter.ts` with `FAKE_PARAGRAPH=pass|partial|fail|malformed|down|slow` and the `[met:abcd]` directive (research R4); document the modes in its header comment.

**Checkpoint**: `npm run validate`, `npx tsc --noEmit` and the new pure tests pass; `POST /api/attempts` returns a one-question attempt with `paragraphState`.

---

## Phase 3: User Story 1 - Write one part and get marked (P1) 🎯 MVP

**Goal**: A student opens the quiz, sees the full question screen, writes, submits, sees the locked marking state and then the mark with per-criterion verdicts; 4/4 goes to the discussion.

**Independent Test**: With essay 1, open Part 1, submit `[met:abcd]` text and land on a discussion; submit a weaker text and see a mark under 4 with four verdicts and reasons.

### Tests for User Story 1 ⚠️ (write first)

- [X] T025 [P] [US1] `tests/api/grade-paragraph.test.ts` (phase 1 part): stubbed `chatCompletion`; marks 4 → `final/full_marks` with discussion and a result row; marks under 4 → `phase1` row, **no discussion, no recordedMark, no model text**; empty answer `400`; a second phase 1 `409` with no second slot; verdicts, reasons, `phase1_prompt_version` and model stored; one slot taken; over-limit text loses (d) and still submits; logs contain no text (spy on `console.*`); `maxDuration` exported.
- [X] T026 [P] [US1] Extend `tests/no-key-leak.test.ts` with the paragraph block (research R3 items 1 to 5): for every shipped essay and part, start response, quiz page payload and each grade response contain every earlier model and none of the later models, the current model before grading, or any marking note; add `markingNotes`, `models`, `commentary` to the banned keys and `essays` to the import-boundary regexes.
- [X] T027 [P] [US1] `tests/client/quiz-paragraph.test.tsx` (writing and marking part): the full question screen (progress bar, verb highlighted and defined, four guidance lines, brief with "Use in this part" rows, earlier models and the slot, textarea, meter using `countWords`); submit locks the text and shows the three status steps in a `role="status"` region; a network error returns the editable box holding the text; the button is never disabled by over-limit.

### Implementation for User Story 1

- [X] T028 [US1] Create `lib/paragraph/grade-handler.server.ts` phase 1 path (body validation, token and question checks, phase row decision, rate limits, `reserveAiSlot`, `markParagraph`, refund on failure, row insert, result save with phase 1 concept outcomes, logging, and the phase 1 `needsSelfMark` response with `signSelfMarkToken` and `discussion` when the marker is unavailable or the cap is used, so a marker failure is defined from the first story) and call it from the paragraph branch of `app/api/grade/route.ts`; export `maxDuration = 60` from that route.
- [X] T029 [P] [US1] Components in `components/paragraph/`: `EssayProgressBar.tsx`, `ParagraphStepTracker.tsx`, `EssayQuestionBlock.tsx`, `PartGuidance.tsx`, `BriefTable.tsx`, `ModelSoFar.tsx`, `WriteBox.tsx` (reuse `rw-*` classes and `countWords`), `LockedPart.tsx`, `MarkingStatus.tsx` (1500 ms second step, one timeout cleaned up on response/unmount, announce each change once).
- [X] T030 [US1] Create `components/paragraph/ParagraphPanel.tsx` with the states `writing`, `marking1` and the 4/4 route to the discussion (data-model.md §5), draft saving through `saveRewriteDraft`/`sendRewriteDraftBeacon`, the pill row ("Paragraph writing · 4 marks", "Essay N · Part K of 5") and no text clearing. Add the paragraph branch to `components/Quiz.tsx` (hide its progress bar and counter; "Finish" does `router.push(/unit/<id>)`).
- [X] T031 [US1] Add the `pg-*` styles for the components in T029 to `app/globals.css` beside the `rw-*` block (tokens only; sizes per research R11; 44 px targets; reduced-motion rules; wrap long words; brief table stacks under 560 px).

**Checkpoint**: US1 works end to end for a 4/4; weaker marks reach the result but the correction is US2.

---

## Phase 4: User Story 2 - One correction with tips (P1)

**Goal**: Under 4 shows tip cards and a pre-filled, focused correction box; one correction marked and capped at 3; no third try, no skip; FR-019a ending.

**Independent Test**: A `[met:ab]` first try shows two tip cards and the box holding the first try; `[met:abcd]` as the correction records 3.

### Tests for User Story 2 ⚠️

- [X] T032 [P] [US2] `tests/api/grade-paragraph.test.ts` (phase 2 part): correction capped at 3; recorded = higher try (first 3, correction lower → 3); `skip: true` `400` before any call; phase 2 without a `phase1` row `phase_refused`; a second phase 2 `409`; no phase 3 possible; **FR-019a**: cap used (`LLM_DAILY_CAP=1`) and marker down both return 200 with `ending: "no_correction"`, recorded = first-try mark, phase 1 criteria present, discussion present, no `error` field, correction text not stored; 429 and db-down `503` record nothing; at most 2 slots per quiz (count `dailyAiUsage` after every ending).
- [X] T033 [P] [US2] `tests/paragraph/tips.test.ts` (cards part): for all shipped essays, no 30-character run of any model, note or brief sentence appears in any tip, apply line or criterion name; a card exists for exactly each lost criterion; (d) card shows only the failed sub-tips.
- [X] T034 [P] [US2] Add to `tests/client/quiz-paragraph.test.tsx`: result shows mark and ✓/✗ with accessible "Met"/"Not met" and a reason each; tip cards; correction box pre-filled, focused, caret at end; submit correction locks it with "Correction is worth up to 3 marks."; there is no skip control and no third try; an error returns the box with the text; FR-019a renders without a correction box.

### Implementation for User Story 2

- [X] T035 [US2] Add the phase 2 path and FR-019a ending to `lib/paragraph/grade-handler.server.ts` (finalise `corrected` or `no_correction`, result row with `max(p1, min(p2,3))`, delete the draft row, never self-mark a correction).
- [X] T036 [P] [US2] Components: `CriterionResults.tsx`, `TipCards.tsx` (cards from `parts.ts` only; heading "Fix these in your correction", or "Work on these next" for FR-019a), `CorrectionBox.tsx` (pre-filled, focus with caret at the end, "Submit correction", "Starts from your first try — edit it").
- [X] T037 [US2] Extend `ParagraphPanel.tsx` with `correction`, `marking2` (phase 2 status wording from research R13), the 409/429/503 transitions and the FR-019a discussion entry; add the `pg-*` styles for tip cards and criteria rows.

**Checkpoint**: A full two-phase part works; tips never carry model text.

---

## Phase 5: User Story 3 - Discussion with the model so far (P1)

**Goal**: Recorded-mark summary, per-criterion pills, flag, final text beside the model, model paragraph up to this part with later parts as labelled slots, tips added, first try collapsed, Finish naming the next part.

**Independent Test**: Finish Part 2 and see models 1 and 2 only, labelled slots for 3 to 5, and no later text anywhere in the response.

### Tests for User Story 3 ⚠️

- [X] T038 [P] [US3] `tests/api/flag-paragraph.test.ts`: first flag `200 { flagged: true }` and one `flagged_at`; repeat and second tab `200 { already: true }` with one row change; mark and result unchanged; self-marked `400 not_flaggable`; still on correction `409 not_final`; another student's attempt `404`; `429`; db down `503`; the body reads only `attemptId`, `questionId`, `attemptToken`.
- [X] T039 [P] [US3] Add to `tests/client/quiz-paragraph.test.tsx`: the four summary outcomes plus FR-019a and self-mark lines (grey panel at 2 or below); pills "First try"/"Fixed in correction"/"Not met"; summary takes focus; flag button becomes "Flagged for your teacher"; model paragraph highlights this part and shows chips with the labels for later parts (including Link: whole paragraph); tips added list shows only phase 1 misses with 2- or 3-pip rows; first-try row hidden when phase 1 was final; Finish text names the next part or next essay.
- [X] T040 [P] [US3] Add to `tests/no-key-leak.test.ts`: the discussion at part K (K = 1 to 5) holds models 1..K and exactly `5-K` labels, none longer than a label.

### Implementation for User Story 3

- [X] T041 [US3] Create `app/api/paragraph/flag/route.ts` per contracts/api.md (session, body, attempt token, question in token, `checkFlagRateLimit`, `flagParagraphPhase`, log `flagged`/`flag_repeat`).
- [X] T042 [P] [US3] Components: `ResultSummary.tsx` (outcome table in data-model.md §3.3), `CriterionPills.tsx`, `FlagButton.tsx`, `FinalBeside.tsx`, `ModelParagraph.tsx` (highlight, key, chips), `TipsAdded.tsx`, `FirstTryCollapsed.tsx`, and the footer "Finish".
- [X] T043 [US3] Extend `ParagraphPanel.tsx` with the `discussion` state (normal, noCorrection variant, selfMark variant), focus on the summary, and the flag call; add the `pg-*` styles for the paragraph, chips and beside cards.

**Checkpoint**: P1 stories 1 to 3 work for a whole part.

---

## Phase 6: User Story 4 - One essay, one part at a time (P1)

**Goal**: The unit page shows the essay in progress and continues it; after the Link the next essay starts.

**Independent Test**: Finish parts 1 to 5 in turn; each quiz offers the next part; after the Link the unit page shows the next essay.

### Tests for User Story 4 ⚠️

- [X] T044 [P] [US4] `tests/api/attempts-paragraph.test.ts`: new student gets part 1; after a result the next call gives part 2; after part 5 gives essay 2 part 1; two parallel starts (`Promise.all`) give one attempt id and one row; an unfinished part returns the same attempt; bank of 2 essays then all done → `200 { finished: true }`; db down `503`; weighting never called; one attempt per part (`unique` index) holds.
- [X] T045 [P] [US4] Add to `tests/home-units.test.ts` or a new `tests/pages/unit-paragraph.test.tsx`: the unit page renders "Essay 3 of 12 · next: Evidence & Application", dots with recorded marks, "Continue essay (Part 3 of 5)", "Start essay (Part 1 of 5)" at a fresh essay, the finished and database-down texts, and the exam row "Year 12 Economics Assessment Task 1".

### Implementation for User Story 4

- [X] T046 [US4] Create `components/EssayBlock.tsx` (server component: bordered box, essay question with the verb highlighted, "· Model economy: X", `<ol aria-label="Essay N parts">` dots with green tick + mark / blue "next" / grey) and edit `app/unit/[unitId]/page.tsx` to branch on `unit.sequence` (essay block, `StartQuiz` with the Continue/Start label, finished and degraded notices, no "Continue attempt" button, `loadEssayProgress`).
- [X] T047 [P] [US4] Add the exam to `content/exams.ts` (`{ id: "y12-econ-at1-2026", title: "Year 12 Economics Assessment Task 1", date: "2026-12-01", unitIds: ["y12-economics-paragraph-writing"] }`) and add the `pg-essay`/`pg-dots` styles.
- [X] T048 [US4] Edit `components/AttemptHistory.tsx` so a paragraph attempt row is named "Essay N · <part name>" and its mark is out of 4; make `lib/startAttempt.ts` surface `finished` to `components/StartQuiz.tsx` (refresh the page instead of navigating).

**Checkpoint**: A student can work through an essay across sessions.

---

## Phase 7: User Story 5 - Writing tips in "Things I need to know" (P2)

**Goal**: Phase 1 misses become tracked tips that clear after 2 (part) or 3 (all parts) correct first tries.

**Independent Test**: Miss a part tip, fix it in the correction, see "2 to go"; meet it twice on first tries and see it clear.

### Tests for User Story 5 ⚠️

- [X] T049 [P] [US5] Add to `tests/paragraph/tips.test.ts` and `tests/rewrite/progress.test.ts`: part tip starts at 2 and clears after 2 correct phase 1 uses; all-parts tip starts at 3 and clears after 3; a fixed-in-correction tip still counts as missed; phase 2 and FR-019a never feed progress; connectors never appear; 17 concepts, no others; existing units still use 3.

### Implementation for User Story 5

- [X] T050 [US5] Make `lib/paragraph/grade-handler.server.ts` and the self-mark path write the five phase 1 `conceptOutcomes` (via `scoring.ts`) to the result row; verify `lib/concepts/progress.ts` replay (T018) yields the counts.
- [X] T051 [US5] Edit `components/ConceptPanel.tsx`: pips from `concept.clearAfter ?? 3` (replace the fixed `TO_CLEAR`), the unit's description string from design.md §4.2 ("Writing tips you missed on a first try…") and the "N to review" pill; keep the live-content pipeline off for Writing Practice.

**Checkpoint**: Tips persist across attempts and clear on the right counts.

---

## Phase 8: User Story 6 - Self-mark when the marker is unavailable (P2)

**Goal**: Marker down or cap used at phase 1 → model part plus four ticks, no phase 2, no error.

**Independent Test**: With `LLM_DAILY_CAP=0`, submit a part, tick three, save, and get 3/4 with the unticked tip added.

### Tests for User Story 6 ⚠️

- [X] T052 [P] [US6] `tests/api/self-mark-paragraph.test.ts`: phase 1 `needsSelfMark` response has the discussion and a token and no error; ticks give the mark (3 ticks = 3); unticked criteria become missed tips and ticked correct (a `d` tick covers both all-parts tips); phase 2 refused; token bound to the answer; row `final/self_mark`; flag not allowed; db down returns a receipt.
- [X] T053 [P] [US6] Add to `tests/client/quiz-paragraph.test.tsx`: self-mark screen shows locked text, model part, four ticks each with its guidance line, "Save my mark"; tracker reads "Write → Mark it yourself"; no correction step.

### Implementation for User Story 6

- [X] T054 [US6] Add the self-mark branch to `app/api/results/self-mark/route.ts` (paragraph handler per contracts/api.md; synthetic verdicts; concept outcomes from ticks). The `needsSelfMark` response and token already exist from T028; this task consumes that token.
- [X] T055 [P] [US6] Create `components/paragraph/SelfMarkScreen.tsx` and add the `selfMark` state to `ParagraphPanel.tsx` with the "Your tick" labels in the discussion.

**Checkpoint**: Marker outages never stop practice.

---

## Phase 9: User Story 7 - Revise the marker from real use (P2)

**Goal**: Flags and full-mark re-marks become labelled field cases; every prompt change reruns every case.

**Independent Test**: Export a flagged answer, label it, run the regression, see tuning, holdout and field reported separately with the prompt version.

### Tests for User Story 7 ⚠️

- [X] T056 [P] [US7] `tests/scripts/paragraph-flags.test.ts`: export writes a `field` essay entry with `needsLabel: true` and no name, email, user id, attempt id or date; unlabelled cases are refused by the regression run; the India held-out essay is untouched.
- [X] T057 [P] [US7] `tests/scripts/paragraph-remark.test.ts` (stubbed model): samples only phase 1 `full_marks` marker answers; leniency-pattern parts are sampled and reported first; refuses when `REMARK_MODEL` equals `GRADING_MODEL`; never writes `daily_ai_usage`.
- [X] T058 [P] [US7] `tests/paragraph/rubric-drift.test.ts`: changing `rubric.json` without bumping `promptVersion` and regenerating the golden fails (compare against a committed hash file `tests/fixtures/rubric.hash`).

### Implementation for User Story 7

- [X] T059 [US7] Create `scripts/paragraph-flags.ts` (`list`, `export <id…>`), register `paragraph-flags` in `package.json` as `tsx --conditions=react-server scripts/paragraph-flags.ts`.
- [X] T060 [US7] Create `scripts/paragraph-remark.ts` (`--sample`, `--priority-first`, `--export`), register `paragraph-remark` in `package.json`, read `OPENROUTER_API_KEY` and `REMARK_MODEL` from the environment or `.env.local`.
- [X] T061 [US7] Edit `scripts/pilot-paragraph-marker.py`: resolve a case's set as `case.set ?? essay.set ?? "tuning"`, report tuning, holdout and field separately with the prompt version in the header, refuse `needsLabel` cases, add `--gate` (exit non-zero below 90 % tuning or 80 % holdout), and state in `--help` that the holdout set is never tuned to.

**Checkpoint**: The loop from flag to regression runs offline.

---

## Phase 10: User Story 8 - Resume and past attempts (P3)

**Goal**: Reopen mid-question to the right state; past attempts show text, marks, criteria and feedback.

**Independent Test**: Leave during the correction, return on another browser, see the tip cards and saved text.

### Tests for User Story 8 ⚠️

- [X] T062 [P] [US8] Add to `tests/api/attempts-paragraph.test.ts` and `tests/client/quiz-paragraph.test.tsx`: resume payload per stage (`write` with `draft1`; `correct` with phase 1 and `draft2`, else the first try; `discussion` with `ending`, `flagged`, `mode`); marking is never restored; no later models, notes or current model before final at any stage.
- [X] T063 [P] [US8] `tests/api/rewrite-draft-paragraph.test.ts`: the draft route accepts paragraph questions, is stale once the phase row exists (phase 1) or is final (phase 2), and still serves rewrite questions unchanged.
- [X] T064 [P] [US8] `tests/pages/attempt-paragraph.test.tsx`: the attempt detail page shows both texts, marks, ✓/✗ with reasons and feedback, "Essay N · part" naming, and contains no model text or brief.

### Implementation for User Story 8

- [X] T065 [US8] Edit `app/unit/[unitId]/quiz/page.tsx` to build `paragraphState` from `listParagraphPhases` and `listRewriteDrafts` through `lib/paragraph/state.server.ts`.
- [X] T066 [P] [US8] Edit `app/api/rewrite/draft/route.ts` to accept paragraph questions with the stale checks from contracts/api.md.
- [X] T067 [US8] Edit `app/attempts/[attemptId]/page.tsx` and `lib/db/queries/history.server.ts` for the paragraph branch (reads `paragraph_phases`, no key access).

**Checkpoint**: All eight stories work.

---

## Phase 11: Content and cross-cutting polish

- [X] T068 [P] Author **essay 2 (Bangladesh, garment exports, developing)** in `essays.ts` and `questions.ts` with verified figures and sources; confirm `npm run validate` passes with two essays and the sequence tests still hold ("Essay 1 of 2"). The remaining essays up to 12 are a separate content task, not part of this plan.
- [X] T069 [P] `tests/api/delete-paragraph.test.ts`: create a paragraph attempt with phases, a draft and a flag; run `deleteStudentByEmail` and `runRetention`; assert no rows remain in `paragraph_phases`, `rewrite_drafts`, `attempts`, `results`.
- [X] T070 [P] `tests/styles/contrast.test.ts` (token pairs used by `pg-*` and reused classes meet 4.5:1 for text, 3:1 for glyphs) and `tests/client/paragraph-a11y.test.tsx` (live region, focus targets, `aria-current`, accessible names, 44 px min-height on interactive classes, reduced-motion rules present).
- [X] T071 [P] Update `README.md` and `.env.example`: the unit row, `FLAG_RATE_LIMIT`, `REMARK_MODEL`, the new scripts, the paragraph-unit data note; find where the school consent wording lives (README privacy section or `docs/`) and add the sentence "Some answers may be re-marked later, without your name, to check and improve the marker."
- [X] T072 Run `npm run validate:shipped` to record the new question and concept ids (Principle III), then the gates in quickstart.md §0 in Git Bash: `npm run validate`, `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`, `python scripts/pilot-paragraph-marker.py --check`.
- [X] T073 Run `python scripts/pilot-paragraph-marker.py --runs 1 --gate` against the ported prompt and record the tuning, holdout and field agreement in `resources/topic010/05-status.md` (round 5 baseline for the app).
- [ ] T074 Walk quickstart.md §2 to §5 on a real phone at 390 px with the fake model, then the real model; fix defects and record any wrong marks as field cases (T059).
- [ ] T075 Confirm the 17 tip sentences in `lib/paragraph/parts.ts` against the requirements doc (Claude Docs) and remove the `TODO confirm` comments; update `specs/007-economics-paragraph-writing/design.md` §4.2 if wording changed.
- [X] T076 [P] `tests/client/design-wording.test.tsx`: render each screen state (unit page, writing, marking, result + correction, FR-019a, discussion, self-mark) and assert the exact strings from design.md §3 to §9 and `research.md` R13: "ESSAY QUESTION", "What this part must do", "Marked out of 4 on these", "The brief", "Use in this part", "The model paragraph so far", "Submit for marking", "Fix these in your correction", "Work on these next", "Submit correction", "First try", "Fixed in correction", "Not met", "This mark seems wrong", "Flagged for your teacher", "Added to Things I need to know", the four summary lines, the footer "Next quiz: …" forms, and the unit page strings.

---

## Dependencies & Execution Order

- **Phase 1**: T001 first. T002 to T006 after T001 (T004, T005, T006 parallel with each other; T003 needs T002).
- **Phase 2** needs Phase 1. Order: T007→T008, T009→T010, T011/T012/T013 parallel (need T003), T014→T015→T016→T017 (T016 can be written beside T014), T018, T019→T020→T021→T022 (needs T004, T005, T015), T023 (needs T010, T012, T022), T024 parallel.
- **US1** (Phase 3) needs Phase 2. **US2** needs US1 (same handler and panel). **US3** needs US2. **US4** needs Phase 2 only and can run beside US1 to US3. **US5** needs US1 (outcomes) and T018. **US6** needs US1 and US3 (discussion). **US7** needs T020 and T041. **US8** needs US1 to US3.
- **Phase 11** after the stories it touches (T076 needs every screen state, so after US3 and US6); T068 can start once T017 passes.

### Parallel opportunities

- Setup: T004, T005, T006.
- Foundational: T007 with T009 and T016 and T019 (all tests, different files); T011, T012, T013, T024.
- Each story: its test tasks ([P]) together, then components ([P]) before the panel task.
- US4 and US7 can run alongside the P1 story chain with a second developer.

### Parallel example: User Story 1

```text
Task: tests/api/grade-paragraph.test.ts (T025)
Task: tests/no-key-leak.test.ts paragraph block (T026)
Task: tests/client/quiz-paragraph.test.tsx writing and marking (T027)
then
Task: components/paragraph/* pieces (T029)
```

## Implementation Strategy

- **MVP**: Phases 1 and 2, then US1 to US4. That is a student working through an essay with marks, correction, discussion and the unit page, with essay 1 only. Stop and run quickstart.md §2.
- **Then** US5 (tips), US6 (self-mark), US8 (resume and history), US7 (revision loop). The unit must not ship to students without US6, because the marker can fail on day one (Principle VI).
- **Content**: essay 2 (T068) and the bank growth continue after launch; each new essay is added by editing `essays.ts`, `questions.ts` and running `npm run validate:shipped`.

## Notes

- T001 (the amendment) must be committed before any schema or route change; commits are made by the user.
- Every route and query added is session-scoped; every key read goes through `lib/grading.server.ts`.
- Avoid editing `components/rewrite/*` or other units' content; the only shared files edited are those named in plan.md.

---

description: "Task list for Economics Sentence Writing implementation"
---

# Tasks: Economics Sentence Writing

**Input**: Design documents from `/specs/005-economics-sentence-writing/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The spec explicitly requests tests (FR-036 to FR-040 and the plan's Testing section), so test tasks are included and MUST be written first and fail before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js project: `content/`, `lib/`, `app/`, `components/`, `scripts/`, `tests/`, `drizzle/` at repository root (see plan.md "Project Structure").

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The constitution amendment and the shared type/content changes every story depends on.

- [x] T001 Amend `.specify/memory/constitution.md` from 2.11.0 → 2.12.0: add the Principle I bullet permitting the scoped hint (missed/misused target terms with one-line definitions after phase 1 is graded below 3) and the discussion material (model sentences, full target-term set with definitions) at the discussion or self-mark screen, never before; add the Principle II bullet permitting the phase row (phase 1 and 2 sentences, marks, per-term outcomes, feedback, deleted with the student); update version, Last Amended, amendment log and Sync Impact Report (exact text in plan.md "Constitution Check > Amendment")
- [x] T002 [P] Add to `lib/types.ts`: `"Writing Practice"` to `UnitType`; the `"rewrite"` question type (`RewriteQuestion extends BaseQuestion { type: "rewrite" }`, added to the `Question` union); `concepts?: string[]` on `BaseQuestion`; `RewriteTargetTerm` (`conceptId`, `term`, `definition`, `why`, `equivalents: string[]`, `misuses: string[]`); the `Answer` key fields `modelSentences?: string[]`, `targetTerms?: RewriteTargetTerm[]`, `markingNotes?: string`; and `retired?: Record<string, string | string[] | null>`
- [x] T003 [P] Create `lib/wordcount.ts` with `countWords(text: string): number` — whitespace-separated tokens; hyphenated words and numbers count as one word each (FR-043, data-model.md)
- [x] T004 [P] Extend `content/concept-helpers.ts` `defineTags` so a concept slug maps to question numbers and each question may carry several concepts (values become `string[]` on the question)
- [x] T005 [P] Add `conceptsOfQuestion(unit, questionId): string[]` to `content/index.ts` — the question's `concepts`, else `[concept]`, else the `retired` value as an array; keep `conceptOfQuestion` for the single-concept path

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Create the `rewrite_phases` table and the `results.concept_outcomes` jsonb column in `lib/db/schema.ts` with the exact constraints from data-model.md: `UNIQUE(attempt_id, question_id)`; FK `(attempt_id, user_id)` → `attempts(id, user_id)` on delete cascade; `user_id` FK → `users(id)` on delete cascade; check `phase1_marks between 0 and 3`; check `phase2_marks is null or phase2_marks between 0 and 2`; check `status in ('phase1','phase2','final')`; check `status = 'final'` implies `recorded_mark is not null`; index `(user_id, unit_id)`; `concept_outcomes` is `Array<{ conceptId: string; correct: boolean }>` nullable
- [x] T007 Generate and commit the Drizzle migration (`npm run db:generate`) in `drizzle/` for the `rewrite_phases` table and `results.concept_outcomes` column
- [x] T008 Create `lib/db/queries/rewrite-phases.server.ts` — idempotent phase-row insert (`INSERT … ON CONFLICT (attempt_id, question_id) DO NOTHING`), guarded update (`UPDATE … WHERE status = 'phase1'`), and read, all scoped to the session user's id (Principle IX)
- [x] T009 [P] Extend `lib/db/queries/results.server.ts` — add `conceptOutcomes` to `ResultInsert` and select it in `listUnitResultsForProgress` and `listAllResultsForProgress`
- [x] T010 [P] Extend `lib/concepts/progress.ts` — `ConceptResult` gains `conceptOutcomes?: Array<{ conceptId: string; correct: boolean }>`; replay each term in order: `correct` → count −1 (never below 0), `wrong` → count = 3 and `lastMissedAt` = answeredAt; a result without `conceptOutcomes` replays exactly as today (existing units' progress unchanged)
- [x] T011 [P] Extend `lib/attempts/draw.server.ts` `drawWeighted` — a question is a candidate for a weighted place when ANY of its `concepts[]` is in the student's uncleared states (research R8); the round-robin, unseen-first and within-mix logic is unchanged
- [x] T012 [P] Extend `lib/content-rules.ts` — rewrite rules: every rewrite question has a model sentence and 1-3 target terms each with a definition; every target term's `conceptId` is a concept of the unit; every `concepts[]` entry is a valid concept id; every concept appears in at least 4 questions of the unit (FR-008)
- [x] T013 [P] Extend `scripts/validate-content.ts` to run the rewrite rules from `lib/content-rules.ts` for every unit
- [x] T014 [P] Extend `lib/tokens.server.ts` — the self-mark token (`SelfMarkPayload`) carries the question's target-term concept ids (`termConceptIds: string[]`) so the client can only tick the terms the server listed (research R7)
- [x] T015 [P] Extend `lib/grading.ts` — `RewriteGradeResult`, `RewriteHint` (`terms`, `lostCriterion?`, `criterionText?`), `RewriteDiscussion` (`modelSentences`, `terms` with `why`), `RewriteTermView` shapes (contracts/api.md)
- [x] T016 Add `gradeRewrite()` to `lib/openrouter.server.ts` — new prompt (plain-English sentence, target terms with definitions/equivalents/misuses, student answer; NOT the model sentence), reply `{ criterionA, padding, terms: [{ term, status: "used"|"missing"|"misused" }], feedback }`, parse with one retry, `null` on failure (research R4)
- [x] T017 Add `gradeRewriteAnswer()` to `lib/grading.server.ts` — computes the word count via `lib/wordcount.ts`, criterion C = `wordCount <= 25 && !padding`, criterion B all-or-nothing (every term `used`), marks = A + B + C, phase 2 cap at 2, best-of recorded mark (FR-019), and hint selection (missed/misused terms, or no terms + the lost criterion per FR-045)
- [x] T018 [P] Extend `scripts/fake-openrouter.ts` — `FAKE_REWRITE=pass|partial|fail|down` answering the rewrite grader (pass = 3/3 all terms used; partial = criterion A kept, one term missing; fail = HTTP 500; down = HTTP 503)

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Rewrite a plain-English sentence in economics language (Priority: P1) 🎯 MVP

**Goal**: A student starts a Writing Practice attempt, sees a plain-English sentence, types a rewrite in a text box with a live word counter, and gets a mark out of 3 with feedback.

**Independent Test**: Start a Writing Practice attempt, answer one question in phase 1, and confirm a mark out of 3 appears with feedback, and that a 3/3 answer goes straight to the discussion.

### Tests for User Story 1 (requested by spec FR-036, FR-040, FR-043) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T019 [P] [US1] Test `gradeRewriteAnswer` with a stand-in grader in `tests/rewrite/grading.test.ts`: criterion (b) is all or nothing; a 3/3 phase 1 skips phase 2; marks = A + B + C
- [x] T020 [P] [US1] Test `countWords` gives the same count on client and server in `tests/rewrite/wordcount.test.ts` (FR-043)
- [x] T021 [P] [US1] Test content validation of the new type in `tests/content-rules.test.ts`: every rewrite question has a model sentence and 1-3 target terms each with a definition; every target term is a concept of the unit; every concept appears in at least 4 questions (FR-008, FR-040)
- [ ] T022 [P] [US1] Test one slot per phase under double taps in `tests/rewrite/double-tap.test.ts`: two simultaneous phase 1 submits spend one allowance slot and grade once (FR-029)

### Implementation for User Story 1

- [x] T023 [US1] Create `content/units/y12-economics-sentence-writing/meta.ts` — id `y12-economics-sentence-writing`, year "Year 12", topic "Topic 1: The Global Economy", type "Writing Practice", `conceptsReady: true`, `quiz: { short: 0, mc: 0, passMark: 60, groups: [{ group: "rewrite", n: 5 }] }`, and a `guide` explaining the two phases and the 3-mark criteria (FR-003)
- [x] T024 [US1] Create `content/units/y12-economics-sentence-writing/concepts.ts` — the 31 tracked terms from data-model.md with ids `y12-economics-sentence-writing.c-<slug>` and their one-line descriptions (e.g. `economic-growth` = "Economic growth: an increase in a country's real output (real GDP)."); `retired = {}`
- [x] T025 [US1] Create `content/units/y12-economics-sentence-writing/concept-tags.ts` — map each question number to its several concept slugs using the extended `defineTags`
- [x] T026 [US1] Write the ~60 original rewrite questions in `content/units/y12-economics-sentence-writing/questions.ts` — ids `y12-economics-sentence-writing.r01`…`.r60`, `group: "rewrite"`, `maxMarks: 3`, `prompt` = the plain-English sentence, `concepts` = the target terms' concept ids; authoring rule: every idea in the model sentence is already in the plain sentence (the model adds precision, never new facts); 2-3 target terms (1 allowed for a standalone term); every concept appears in at least 4 questions; no `source` (all original, Principle V)
- [x] T027 [US1] Write the answer keys in `content/units/y12-economics-sentence-writing/answers.ts` — `modelSentences` (1-2), `targetTerms` (each with `conceptId`, `term`, `definition`, `why` — one line on why the term fits this sentence, shown in the discussion — `equivalents`, `misuses`), `markingNotes`; spelling and usage exact (e.g. "affect", not "effect") (FR-025)
- [x] T028 [US1] Register the unit in `content/index.ts` (import meta/questions/concepts/retired/concept-tags, add to `UNITS` with `tagQuestions`) and `content/answers/index.ts` (spread its answers into `ALL_ANSWERS`); run `npm run validate:shipped` and commit `content/shipped-ids.json`
- [x] T029 [US1] Extend `app/api/grade/route.ts` — phase 1 handling for rewrite questions: verify no phase row exists (else `409 already_answered` with the stored result), reserve one daily AI slot, grade with `gradeRewriteAnswer`, insert the phase row idempotently, return the phase 1 result with the hint (marks < 3) or the discussion (3/3) per contracts/api.md
- [x] T030 [US1] Extend `components/Quiz.tsx` — the rewrite branch: phase 1 text box with the live word counter (over 25 shown, submit still allowed), submit via `/api/grade` with `phase: "1"`, no Photo tab for this type (FR-009)
- [x] T031 [US1] Add the phase 1 draft key to `lib/drafts.ts` (`draft:rewrite:<attemptId>:<questionId>:phase1`)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Get a targeted hint and retry once (Priority: P1)

**Goal**: When phase 1 scores under 3, the student sees only the missed or misused terms with their definitions (or the lost criterion per FR-045) and rewrites once more, capped at 2 marks.

**Independent Test**: Score under 3 in phase 1 and confirm the hint lists only the missed or misused terms with their definitions, a second rewrite is accepted, and its mark is capped at 2.

### Tests for User Story 2 (requested by spec FR-036; SC-009) ⚠️

- [x] T032 [P] [US2] Test phase 2 is capped at 2 and the recorded mark is the best of the two (FR-019) in `tests/rewrite/grading.test.ts`
- [x] T033 [P] [US2] Test the hint holds only missed or misused terms, or no terms and the lost criterion (FR-045) in `tests/rewrite/hint.test.ts`
- [ ] T034 [P] [US2] Test phase 2 is refused unless phase 1 was graded below 3 (`400 phase_refused`) in `tests/rewrite/phase.test.ts`
- [ ] T035 [P] [US2] Test empty or whitespace-only submissions are blocked in both phases and a skipped phase 2 keeps the phase 1 mark (SC-009, FR-041, FR-042) in `tests/rewrite/submission.test.ts`

### Implementation for User Story 2

- [x] T036 [US2] Extend `app/api/grade/route.ts` — phase 2 handling: refuse with `400 { error: "phase_refused" }` unless the phase row's status is `phase1` and `phase1_marks < 3`; grade capped at 2; update the phase row to `final` (`WHERE status = 'phase1'`); insert the `results` row with `marks_awarded = max(phase1_marks, phase2_marks)`, `answer` = the phase 2 sentence, `concept_outcomes` = the phase 1 term outcomes, `graded_by = 'llm'` (contracts/api.md)
- [x] T037 [US2] Extend `components/Quiz.tsx` — the phase 2 hint panel (missed/misused terms with definitions, or the lost criterion in the marker's words, plus the phase 1 feedback) and the phase 2 submit via `/api/grade` with `phase: "2"`
- [x] T038 [US2] Add the phase 2 draft key to `lib/drafts.ts` (`draft:rewrite:<attemptId>:<questionId>:phase2`)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - See the discussion (Priority: P1)

**Goal**: After the last phase, the student sees the model sentence (one or two accepted versions), each target term with its definition and why it fits, their own sentences, and the feedback.

**Independent Test**: Complete a question and confirm the discussion shows the model sentence, each target term with its definition and why it fits, the student's own sentences, and feedback, in the same place and style as the short-answer model answer and feedback today.

### Tests for User Story 3 (requested by spec FR-036) ⚠️

- [x] T039 [P] [US3] Test the discussion material (model sentences, every term with definition and why it fits) is returned only at a 3/3 phase 1 or after phase 2, never before, in `tests/rewrite/discussion.test.ts`

### Implementation for User Story 3

- [x] T040 [US3] Extend `lib/grading.server.ts` — assemble the discussion (model sentences, each target term with its definition and its authored `why` text) from the key at grade time (FR-018)
- [x] T041 [US3] Extend `components/Quiz.tsx` — the discussion view: model sentence(s), each term with its definition and why it fits, the student's phase 1 sentence (and phase 2 sentence, if any), and the marker's feedback on their final sentence

**Checkpoint**: At this point, User Stories 1, 2 AND 3 should all work independently.

---

## Phase 6: User Story 4 - Never blocked by a failure (Priority: P1)

**Goal**: If the AI marker is unavailable or today's allowance is used up, the question degrades to self-marking: the student sees the model sentence and every target term with its definition, and marks each criterion with one tick per term; there is no phase 2.

**Independent Test**: With the marker unavailable and with the daily allowance exhausted in turn, answer a question and confirm each ends in self-marking with no error and no phase 2.

### Tests for User Story 4 (requested by spec FR-039) ⚠️

- [ ] T042 [P] [US4] Test the degrade path in `tests/rewrite/selfmark.test.ts`: model failure / cap / db down → self-mark with per-term ticks, no phase 2, and concept outcomes built from the ticks (FR-030, FR-046)

### Implementation for User Story 4

- [x] T043 [US4] Extend `lib/grading.server.ts` — when phase 1 falls back to self-marking, return the self-mark material (model sentences, every target term with its definition) and a self-mark token carrying the term concept ids (research R7)
- [x] T044 [US4] Extend `app/api/results/self-mark/route.ts` — for rewrite questions accept `criterionA`, `termTicks: { [conceptId]: boolean }`, `criterionC` instead of the binary `correct` flag; verify every `termTicks` key is in the token's `termConceptIds`; compute marks = A + (all terms ticked ? 1 : 0) + C, capped at 2 when `phase === 2`; store `concept_outcomes` from the ticks; `graded_by = 'self'` (contracts/api.md)
- [x] T045 [US4] Extend `components/Quiz.tsx` — the rewrite self-mark screen: model sentence, every term with its definition, one tick per term for criterion (b), and criterion A and C ticks; no phase 2

**Checkpoint**: At this point, User Stories 1-4 should all work independently.

---

## Phase 7: User Story 5 - Resume an attempt mid-question (Priority: P2)

**Goal**: A student can leave an attempt and come back later, resuming in the middle of a question, including at phase 2 with the hint showing; the attempt detail page shows both sentences and both marks.

**Independent Test**: Reach phase 2 of a question, leave the attempt, return, and confirm the question resumes at phase 2 with the hint showing and the phase 1 sentence intact.

### Tests for User Story 5 (requested by spec FR-037) ⚠️

- [ ] T046 [P] [US5] Test no key field reaches the browser before a phase 1 grade, including on resume, in `tests/rewrite/leak.test.ts` (FR-023, FR-037)
- [ ] T047 [P] [US5] Test resume at phase 2 with the hint showing and the phase 1 sentence intact in `tests/rewrite/resume.test.ts` (FR-021)

### Implementation for User Story 5

- [x] T048 [US5] Extend `app/unit/[unitId]/quiz/page.tsx` — read the phase row for the current question and pass only the allowed material: nothing from the key before a phase 1 grade, the hint at phase 2, the discussion once final (FR-023, contracts/api.md "Resume")
- [x] T049 [US5] Extend `components/Quiz.tsx` — restore the rewrite state on load (phase, phase 1 sentence, hint/discussion) from the page props
- [x] T050 [US5] Extend `app/attempts/[attemptId]/page.tsx` — for rewrite questions show both sentences and both marks from the phase row, plus the stored feedback and per-term outcomes; never model sentences (Principle I)

**Checkpoint**: At this point, User Stories 1-5 should all work independently.

---

## Phase 8: User Story 6 - Missed terms feed "Concepts to review" (Priority: P2)

**Goal**: A term missed or misused in phase 1 counts as wrong for the unit's "Concepts to review" list even if used correctly in phase 2; missed terms appear with their definitions, carry across attempts, clear after 3 correct uses, and new attempts weight towards questions that use them.

**Independent Test**: Miss a term in phase 1 but use it correctly in phase 2, and confirm it still appears in "Concepts to review"; then use it correctly in phase 1 across three later questions and confirm it clears.

### Tests for User Story 6 (requested by spec FR-038) ⚠️

- [x] T051 [P] [US6] Test concept results are counted from phase 1 only (a term missed in phase 1 counts wrong even if used correctly in phase 2) in `tests/rewrite/concepts.test.ts` (FR-033, FR-038)
- [x] T052 [P] [US6] Test existing units' progress replays exactly as before (results without `conceptOutcomes`) in `tests/concepts/progress.test.ts`

### Implementation for User Story 6

- [x] T053 [US6] Wire the unit page's `ConceptPanel` for the new unit — terms listed by definition only; the concept-content ensure route is never called for this unit's concepts (research R9)
- [ ] T054 [US6] Verify the weighted draw includes rewrite questions for uncleared terms end to end (integration of `lib/attempts/draw.server.ts` from T011 with the new unit's `concepts[]`)

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T055 [P] Add `logRewriteGrade()` (FR-044) — one line per grading call: `[rewrite] outcome=<outcome> user=<hmac(userId)> question=<questionId> duration_ms=<ms> model=<model>`; outcomes `graded|unparseable|model_fail|rate_limited|over_allowance|already_answered|phase_refused|db_unavailable`; never a sentence, model reply, definition or marking note; wire it into the grade route
- [ ] T056 [P] Test no sentence or definition appears in any log (FR-044) in `tests/rewrite/logging.test.ts`
- [x] T057 [P] Update `README.md` — add the new unit to the units table and note the "Writing Practice" type
- [ ] T058 Run `quickstart.md` validation end to end (automated checks plus the manual 390 px phone checks and the three failure modes)
- [x] T059 Run `npm run validate`, `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` through Git Bash and fix any failures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (Phase 3) is the MVP and must land first: US2, US3 and US4 extend the same question flow and build on US1's grade route and Quiz branch
  - US5 (Phase 7) and US6 (Phase 8) can proceed in parallel with US2-US4 once the phase row, concept outcomes and draw changes exist (T006-T011)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 (the phase 1 grade route and Quiz branch)
- **User Story 3 (P1)**: Depends on US1 (the discussion is returned by the same grade flow)
- **User Story 4 (P1)**: Depends on US1 (the self-mark fallback is part of the phase 1 grade path)
- **User Story 5 (P2)**: Depends on Foundational (phase row queries, T008) and US1; independent of US2-US4
- **User Story 6 (P2)**: Depends on Foundational (concept outcomes, draw weighting, T009-T011); independent of US2-US5

### Within Each User Story

- Tests (included) MUST be written and FAIL before implementation
- Models/content before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T005)
- All Foundational tasks marked [P] can run in parallel (T009-T015, T018)
- Once Foundational completes, US5 and US6 can start in parallel with US2-US4 (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Content tasks within US1 (T023-T027) can be written in parallel once the types (T002) and validation rules (T012) exist

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Test gradeRewriteAnswer with a stand-in grader in tests/rewrite/grading.test.ts"
Task: "Test countWords gives the same count on client and server in tests/rewrite/wordcount.test.ts"
Task: "Test content validation of the new type in tests/content-rules.test.ts"
Task: "Test one slot per phase under double taps in tests/rewrite/double-tap.test.ts"

# Launch the content files together (types and validation rules already exist):
Task: "Create content/units/y12-economics-sentence-writing/meta.ts"
Task: "Create content/units/y12-economics-sentence-writing/concepts.ts"
Task: "Create content/units/y12-economics-sentence-writing/concept-tags.ts"
Task: "Write the ~60 original rewrite questions in content/units/y12-economics-sentence-writing/questions.ts"
Task: "Write the answer keys in content/units/y12-economics-sentence-writing/answers.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (constitution amendment + shared types)
2. Complete Phase 2: Foundational (schema, phase row, grading, validation — CRITICAL, blocks all stories)
3. Complete Phase 3: User Story 1 (phase 1 rewrite + 3-mark grade + the unit content)
4. **STOP and VALIDATE**: Test User Story 1 independently (a student can answer phase 1 and get a 3-mark grade)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (hinted retry) → Test independently → Deploy/Demo
4. Add User Story 3 (discussion) → Test independently → Deploy/Demo
5. Add User Story 4 (degrade path) → Test independently → Deploy/Demo
6. Add User Story 5 (resume) and User Story 6 (concepts to review) → Test independently → Deploy/Demo
7. Polish (logging, README, quickstart, full suite) → Ship

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (then 2, 3, 4 — the question flow)
   - Developer B: User Story 5 (resume) — depends only on the phase row
   - Developer C: User Story 6 (concepts) — depends only on concept outcomes and the draw
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- The full ~60-question bank is content work: T026/T027 must satisfy the validator (every concept in ≥ 4 questions) and the authoring rules in the spec (FR-024, FR-025)

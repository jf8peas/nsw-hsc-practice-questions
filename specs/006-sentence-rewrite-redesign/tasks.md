# Tasks: Sentence Rewrite Question Redesign

**Input**: Design documents from `/specs/006-sentence-rewrite-redesign/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: The feature spec explicitly requests automated tests (FR-045 to FR-052, FR-055 and the Testing section), so test tasks are included. Write each story's tests FIRST, confirm they fail, then implement.

**Organization**: Tasks are grouped by user story so each story is an independently testable increment. Grading behaviour from spec 005 is unchanged (3-mark criteria, phase-2 cap of 2, hint selection, phase 1 concept tracking, self-mark rules, two calls per question).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1−US6)
- Include exact file paths in descriptions

## Path Conventions

Single Next.js project at the repository root: `components/`, `lib/`, `app/`, `tests/`, `scripts/`, `drizzle/`, `styles/`. The rewrite sub-components live in the new `components/rewrite/` folder (research R1).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: the constitution amendment, the component folder, and the schema/migration scaffolding that every story builds on.

- [x] T001 Apply the constitution amendment 2.12.0 → 2.13.0 in `.specify/memory/constitution.md`: extend the Principle II writing-practice storage bullet with the display-only grading data ("the credited spans for each phase, the phase 2 term outcomes and any language note") and the student's in-progress draft text per phase, plus "The display data and drafts never change marks or concept tracking, which always come from the phase 1 outcomes."; update the version to 2.13.0, Last Amended to 2026-11-03, the amendment log and the Sync Impact Report (exact text in `plan.md` §Amendment) — **first task**
- [x] T002 [P] Create the `components/rewrite/` folder; move `components/RewritePanel.tsx` into `components/rewrite/RewritePanel.tsx`, delete the old file, and update the import in `components/Quiz.tsx` to `@/components/rewrite/RewritePanel` so the machine rewrite proceeds in place

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the shared data shapes, the grader output with validation, storage, the draft route, and the common styles that MUST be complete before ANY user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Add the display-data types to `lib/grading.ts`: `RewriteCreditedSpan { conceptId: string; span: string }`, `RewriteLanguageNote { spelling?: Array<{ wrong: string; fix: string }>; grammar?: string }`, and the three optional fields on `RewriteGradeResult` — `creditedSpans?: RewriteCreditedSpan[]`, `phase2TermOutcomes?: Array<{ conceptId: string; correct: boolean }>`, `languageNote?: RewriteLanguageNote` (verbatim from `data-model.md`)
- [x] T004 [P] Add to `lib/db/schema.ts`: `display_data` on `rewritePhases` as jsonb, nullable, typed `RewriteDisplayData { phase1: { spanByTerm: Record<string, string> }; phase2?: { spanByTerm: Record<string, string> }; phase2TermOutcomes?: Array<{ conceptId: string; correct: boolean }>; languageNote?: RewriteLanguageNote }`; and the new `rewrite_drafts` table with `id uuid PK defaultRandom`, `attempt_id uuid NOT NULL`, `user_id uuid NOT NULL references users(id) on delete cascade`, `unit_id text NOT NULL`, `question_id text NOT NULL`, `phase1_draft text NOT NULL default ''`, `phase2_draft text NOT NULL default ''`, `created_at`/`updated_at`; constraint `UNIQUE(attempt_id, question_id)`, FK `(attempt_id, user_id)` → `attempts(id, user_id)` on delete cascade, index `(user_id, unit_id)` (verbatim from `data-model.md`)
- [x] T005 Generate and commit the Drizzle migration (`npm run db:generate` + the generated file in `drizzle/`): `ALTER TABLE rewrite_phases ADD COLUMN display_data jsonb;` and `CREATE TABLE rewrite_drafts` per `data-model.md`; no backfill
- [x] T006 [P] Extend `buildRewriteMessages` in `lib/openrouter.server.ts`: the system prompt must (1) forbid the feedback from naming or quoting words or phrases of the plain-English sentence as things to replace and from telling the student which words to change (FR-013), (2) require criterion-shaped feedback when every target term is used correctly but a criterion is lost (FR-045/FR-016), (3) ask for `terms[].span` — "the exact words in the student's sentence that earned the credit for a term you mark 'used', or null otherwise; quote nothing the student did not write", and (4) ask for an optional `languageNote { spelling: [{ wrong, fix }] (≤ 3), grammar (one short note) }`; add the reply-shape line with the new fields (shape in `contracts/api.md`)
- [x] T007 [P] Extend `parseRewriteJson` in `lib/openrouter.server.ts`: parse `terms[].span` (non-string → null) and `languageNote` (non-object or malformed → absent); a parseable reply without the new fields must still parse and grade exactly as today — the new fields may never make a reply unparseable (research R3, FR-036)
- [x] T008 [P] Extend `gradeRewriteAnswer` in `lib/grading.server.ts`: derive `creditedSpans` keeping a span only when (a) its term's status is `"used"` (a span for a non-credited term is dropped) and (b) it is found in the student's sentence after trimming and collapsing runs of whitespace (including newlines) to a single space, matched case-insensitively as a contiguous substring (FR-032; length cap 200 before validation); derive `phase2TermOutcomes` from the phase 2 `terms[].status` exactly as phase 1 outcomes are derived; validate `languageNote` (kept only when `spelling` ≤ 3 arrays of two non-empty strings of ≤ 60 chars and `grammar` is one string ≤ 200 chars, else the whole note is dropped); keep each spelling pair only when its `wrong` word is found in the sentence under the same span rule (drop failing pairs individually; drop the note if nothing is left), and attach it only on the final phase (phase 2, or phase 1 at 3/3)
- [x] T009 [P] Create `lib/db/queries/rewrite-drafts.server.ts`: getUser-scoped upsert (`INSERT … ON CONFLICT (attempt_id, question_id) DO UPDATE SET phase1_draft/phase2_draft = …, updated_at = now()`), read, and clear helpers; every query filtered by `userId` (Principle IX)
- [x] T010 [P] Add a draft rate limiter to `lib/ratelimit.server.ts`: a separate instance/namespace from the grading limits, `DRAFT_RATE_LIMIT` default 30 per user per minute (research R5.2; never the grading limits, never `LLM_DAILY_CAP`)
- [x] T011 [P] Create `app/api/rewrite/draft/route.ts` (POST): body `{ attemptId, attemptToken, questionId, phase: 1|2, draft }` with `draft` trimmed to 6000 characters (empty clears that phase's column); server checks in order — session → attempt token valid/unexpired/bound → questionId in the token and a rewrite question (404) → the T010 limiter → **stale check**: attempt completed, or the phase already graded (phase row exists for phase 1; status `final` for phase 2) → write nothing, `200 { saved: false }` → upsert; read the raw body text and `JSON.parse` it (a beacon body is not sent as a normal JSON request); statuses per `contracts/api.md`: `200 { saved: true }`, `200 { saved: false }` (stale), `400 invalid_request`, `401 unauthenticated`, `401 invalid_attempt_token`, `404 not_found`, `429 rate_limited` (+`retryAfter`), `503 temporarily_unavailable` on DB down
- [x] T012 [P] Add a beacon helper to `lib/drafts.ts`: `sendRewriteDraftBeacon(attemptId, attemptToken, questionId, phase, text)` calling `navigator.sendBeacon("/api/rewrite/draft", JSON.stringify({ attemptId, attemptToken, questionId, phase, draft: text }))` (the token comes from the attempt payload), skipping a beacon when `text` equals the last text already sent for that box; sessionStorage `saveRewriteDraft`/`loadRewriteDraft` already exist and stay
- [x] T013 [P] Extend the rewrite branch of `scripts/fake-openrouter.ts` to return the new fields: `terms[].span` = the term text when the answer contains it (else `null`, always `null` for a term the fake marks "missing"), and `languageNote { spelling: [{ wrong: "fromm", fix: "from" }] }` when the answer contains "fromm"; keep the fake feedback strings free of plain-English quoting (FR-013)
- [x] T014 [P] Update `app/api/grade/route.ts` (rewrite path): write `display_data` at phase 1 (`{ phase1: { spanByTerm } }`, plus `languageNote` when 3/3) and extend it at phase 2 (`{ phase1, phase2: { spanByTerm }, phase2TermOutcomes, languageNote? }`) inside the existing `status = 'phase1'`-guarded update so a double tap still updates once; clear the graded phase's draft column on `rewrite_drafts`, and delete the `rewrite_drafts` row when the question becomes final (3/3 phase 1 or phase 2); do the same row delete in `app/api/results/self-mark/route.ts` when a rewrite self-mark is saved (no draft outlives its question, Principle II); extend `rewriteResultFromRow` (the `409 already_answered` shape) to carry the stored `creditedSpans`, `phase2TermOutcomes` and `languageNote` per `contracts/api.md`
- [x] T015 Add the `rw-*` common styles to `app/globals.css` per research R2: the card frame (radius 16, padding 28 desktop / 20 phone, `--rd-border-100`, `--rd-shadow-1`), the step tracker (24 px circles, blue-500 current, success-50 + success-500 check done, border-200 outlined future), the PLAIN ENGLISH block (surface-50, radius 12, mono 12 px uppercase mute-600 label, sentence 19 px/1.55 ink-700), the 18 px textarea with 1.5 px blue-500 border + 4 px `--rd-blue-100` focus ring, the 120 px word meter (success-500 fill, warn-500 over the limit, mono count), 48 px primary buttons, and a `@media (prefers-reduced-motion: reduce)` block disabling the progress-bar and spinner animations with static equivalents (FR-041); use `var(--rd-*)` everywhere a token exists and the three tokenless design colours (#14653F, #5C3F00, #F1D9A8) as commented class literals; do NOT edit `styles/tokens.css`

- [x] T053 [P] Create `tests/api/rewrite-draft.test.ts` (PGlite, written alongside T009-T011 and failing first): 401 with no session and with another student's attempt token; 400 for a bad body; 404 for a question not in the attempt or not a rewrite question; 429 over `DRAFT_RATE_LIMIT`; 503 with the database down; a stale beacon (phase already graded, attempt completed) writes nothing and returns `200 { saved: false }`; an empty draft clears the column; a raw-text beacon body parses; the grade route clears the graded phase's column and deletes the row at final, and the self-mark save deletes it; drafts are only ever read for their owner; deleting the student removes the draft rows (cascade) — constitution Quality Gates: authorization and cost-control logic ships with tests

**Checkpoint**: Foundation ready — the grader returns validated spans/outcomes/notes, the phase row stores them, the draft route saves drafts, and the common styles exist. User story implementation can now begin.

---

## Phase 3: User Story 1 - Write and submit a first try (Priority: P1) 🎯 MVP

**Goal**: the writing state (state 1) with the step tracker, the plain-English block, the box with the new placeholder, the live word meter, the retry info line and "Submit for marking" — nothing typed is ever cleared.

**Independent Test**: open a rewrite question and confirm the tracker (Write / Retry with hints / Compare), the PLAIN ENGLISH block, the box with placeholder "Write your sentence here…", the meter "12 / 25 words", the warning over 25 words (submission still allowed), the line "Miss a term? You'll get one retry with hints, worth up to 2 marks." and "Submit for marking".

### Tests for User Story 1 ⚠️

- [x] T016 [P] [US1] Update `tests/client/quiz-rewrite.test.tsx` to the state-1 wording: placeholder "Write your sentence here…", button "Submit for marking" (not "Submit answer"), meter "0 / 25 words", the retry info line, the tracker labels, no Photo tab (FR-009), and the live counter over-limit case (FR-012) — write first, confirm they fail

### Implementation for User Story 1

- [x] T017 [US1] Implement `components/rewrite/RewriteStepTracker.tsx`: `<ol aria-label="Steps">` with `aria-current="step"` on the current step; done steps show a check in a success-50 circle and the phase mark ("Write · n/3", "Retry · m/2" — the retry mark out of 2, FR-002); the 3/3 first try shows the two-step "Write · 3/3" → "Compare"; the self-mark path shows "Write" → "Mark it yourself" (FR-037), or "Write · n/3" (done) → "Mark it yourself" when the self-mark comes at phase 2 after a graded phase 1
- [x] T018 [P] [US1] Implement `components/rewrite/PlainEnglishBlock.tsx`: surface-50 panel with the mono 12 px uppercase mute-600 "PLAIN ENGLISH" label and the sentence at 19 px/1.55 ink-700; the component accepts only the sentence string — it can never highlight, underline or bold any word (FR-003)
- [x] T019 [US1] Implement the writing state inside `components/rewrite/RewritePanel.tsx`: heading "Rewrite it in economics language" with "Use the precise terms an HSC marker looks for" (wraps below on phones), a textarea with placeholder "Write your sentence here…" (MUST NOT mention target terms, FR-004), the live word meter via `countWords` ("12 / 25 words", and "27 / 25 words · over the limit — you lose the conciseness mark" with the button still enabled, FR-005), the divider info line "Miss a term? You'll get one retry with hints, worth up to 2 marks." (FR-006), the 48 px primary button "Submit for marking", and **do NOT clear `text1` on submit — delete the `setText1("")` pattern** so the text survives an error (research R1)
- [x] T020 [US1] Wire the phase-1 draft save in `components/rewrite/RewritePanel.tsx`: `saveRewriteDraft(attemptId, questionId, 1, text)` to sessionStorage on every change and `sendRewriteDraftBeacon` (T012) on blur of the writing box (FR-053, research R5.2)
- [x] T021 [US1] Update `components/Quiz.tsx` to pass `attemptId` and `questionId` into `RewritePanel` and keep the phase-1 submit path (`grade(answer, undefined, undefined, 1)`) including the pending-rewrite early return — phase 1 under 3 must not record marks or show Next (FR-042)

**Checkpoint**: US1 is fully functional — a student can write, watch the counter, and submit phase 1.

---

## Phase 4: User Story 2 - Watch the first try being marked (Priority: P1)

**Goal**: the marking state (state 2): the submitted sentence stays visible in a locked block with its word count, cosmetic timed status steps announced via a live region, and an error returning an editable box holding the text.

**Independent Test**: submit a first try and confirm the sentence stays in a locked block headed "Your sentence" with its word count and a progress bar + status list; force a grading error and confirm the block becomes an editable box holding the same text.

### Tests for User Story 2 ⚠️

- [x] T022 [P] [US2] Extend `tests/client/quiz-rewrite.test.tsx`: while marking, the locked block "Your sentence" shows the submitted sentence and its word count and the box is never cleared; a forced grading error returns an editable box holding the same text (FR-011/FR-045); the live region announces the step changes; the progress bar/spinners do not animate under `prefers-reduced-motion` (FR-041/FR-009) — write first, confirm they fail

### Implementation for User Story 2

- [x] T023 [P] [US2] Implement `components/rewrite/LockedSentence.tsx`: a locked read-only block with a heading label prop ("Your sentence" / "Your retry"), a lock icon (inline stroke SVG), a static word count on the right ("12 / 25 words"), and the sentence at 18 px in a white box with a `--rd-blue-100` border (FR-007, FR-018)
- [x] T024 [P] [US2] Implement `components/rewrite/MarkingStatus.tsx`: the 3 px indeterminate progress bar (blue-500 sliding on a blue-50 track, static under reduced motion) and the status list in a `role="status"` `aria-live="polite"` container: step 1 ticked immediately, step 2 in progress after ~1.5 s, step 3 pending until the response arrives and never shown done before it; a single `announcedLabel` state announces each change once (no per-tick announcements, research R8); label/lists configurable for state 4 ("Read your retry", "Checking <hint terms>…", "Preparing the model sentence")
- [x] T025 [US2] Add the marking timers to `components/rewrite/RewritePanel.tsx`: start on entering a marking state, cancel in the effect cleanup on a fast reply and on unmount — a reply before 1.5 s must never delay the UI (research R8)
- [x] T026 [US2] Add the marking footer and a local `submitting` state to `components/rewrite/RewritePanel.tsx`: footer "Usually takes a few seconds." with a disabled pale-blue button with spinner, "Marking…" (FR-010); `submitting` distinguishes state 2 (phase 1 sent, no result) from states 1/3/5
- [x] T027 [US2] Implement the error return in `components/rewrite/RewritePanel.tsx`: when a grading error occurs the locked block becomes the editable box holding `text1` (still set — never cleared at submit), with the existing error message above it (FR-011)

**Checkpoint**: US1 AND US2 both work — the main fix (the sentence never disappears while marking) is delivered.

---

## Phase 5: User Story 3 - Retry once with hints (Priority: P1)

**Goal**: the feedback + retry state (state 3) and the marking-retry state (state 4): first-try result with credited-term highlights, term-definition hint cards that never map to the plain-English sentence, a pre-filled retry box, and the retry's marking screen with the hint pills.

**Independent Test**: score under 3 in phase 1 and confirm the hint is one card per missed/misused term (term + definition only, no plain-English mapping), the retry box is pre-filled with the first-try sentence (focused, cursor at the end on desktop), "Retry is worth up to 2 marks" is shown, and submitting the retry shows the collapsed first try, the "Terms you were asked to use:" pills and the "Read your retry" status list.

### Tests for User Story 3 ⚠️

- [x] T028 [P] [US3] Extend `tests/client/quiz-rewrite.test.tsx`: the retry box starts pre-filled with the first-try sentence (FR-046); the hint shows term + definition only and never contains any word or "replaces …" mapping of the plain-English sentence, and the plain-English sentence is never highlighted (FR-047); the "What to fix" criterion hint (FR-045); state 4 shows "Terms you were asked to use:" with one pill per hint term (and "You were asked to fix:" + the "Meaning"/"Conciseness" pill for a criterion hint); while the retry is marking, the locked "Your retry" block shows the submitted retry and the box is never cleared, and a phase 2 grading error returns state 3 with the retry box holding the same text (FR-018/FR-045, both phases) — write first, confirm they fail

### Implementation for User Story 3

- [x] T029 [US3] Implement `components/rewrite/FirstTryResult.tsx`: one bordered box — mono label "FIRST TRY", the mark large (36 px display, blue-700, "/ 3"), the grader's feedback (16 px; FR-013 wording comes from the T006 prompt rule), and the surface-50 strip "Your first try" with the sentence and each credited term highlighted (success-50 background, #14653F text, weight 600, radius 4) by locating each validated span index-based in the sentence; a span not found is not highlighted (FR-014, FR-032); missed terms unmarked
- [x] T030 [P] [US3] Implement `components/rewrite/HintCards.tsx`: heading "Use these terms in your retry" (16 px, 600) with one warn-50 card per missed/misused term — term in the display font (20 px, 700) and its one-line definition (15 px) — with NO "replaces …" line and nothing from the plain-English sentence (FR-015); when `hint.terms` is empty, heading "What to fix" with a single card from `hint.criterionText` (FR-016)
- [x] T031 [P] [US3] Implement `components/rewrite/RetryBox.tsx`: label "Your retry" with "Starts from your first try — edit it", a textarea pre-filled with `phase2Draft ?? phase1Answer`, live word meter, the notice "Retry is worth up to 2 marks" (info icon), and the primary "Submit retry" button; focus the box and place the cursor at the end **only when `matchMedia("(pointer: fine)")`** so the phone keyboard never pops over the hint (FR-017, research R9); save the phase-2 draft on change (sessionStorage) and on blur (beacon)
- [x] T032 [P] [US3] Implement `components/rewrite/FirstTryCollapsed.tsx`: a `<details>/<summary>` closed row "FIRST TRY · n/3" with the truncated sentence (ellipsis) and a chevron; `summary` `min-height: 44px` (FR-042); opening shows the full first-try result (FR-019, FR-029)
- [x] T033 [US3] Compose state 3 in `components/rewrite/RewritePanel.tsx` in this exact order (FR-012): step tracker → plain-English block → `FirstTryResult` → `HintCards` → `RetryBox`
- [x] T034 [US3] Compose state 4 in `components/rewrite/RewritePanel.tsx` (FR-018 to FR-021): `FirstTryCollapsed` → the row "Terms you were asked to use:" (or "You were asked to fix:") with one warn-50 pill per hint term (single "Meaning"/"Conciseness" pill for a criterion hint) → `LockedSentence` headed "Your retry" with its own word count → `MarkingStatus` with "Read your retry", "Checking <the hint terms by name>…" (or "Checking your sentence…" for a criterion hint) and "Preparing the model sentence" → footer "Retry is worth up to 2 marks." + the disabled "Marking…" button; do NOT clear the retry text on submit (delete the `setText2("")` pattern) and on a grading error return to state 3 with the retry box holding the same text and the existing error message (FR-018 with FR-011)

**Checkpoint**: US3 delivers the retry teaching loop end-to-end (feedback → hint → pre-filled retry → retry marking).

---

## Phase 6: User Story 4 - See the result and compare with the model (Priority: P1)

**Goal**: the result state (state 5): the outcome summary with the correct outcome line, the final sentence beside the model sentence, one term table replacing the old duplicated lists, the collapsed first try, and the footer.

**Independent Test**: complete a question and confirm the outcome line matches the outcome table for its case, the final sentence sits beside the model sentence (credited terms highlighted, model terms bold, commentary line, language note when present), the term table shows the right statuses, and "Next question" advances.

### Tests for User Story 4 ⚠️

- [x] T035 [P] [US4] Extend `tests/api/grade-rewrite.test.ts`: phase 1 (sub-3 and 3/3) carries `creditedSpans` only for terms credited AND found in the sentence — a span not found or on a non-credited term is absent (FR-032); phase 2 carries `phase2TermOutcomes` and `languageNote`; a reply without the new fields grades exactly as today (marks/hint/discussion unchanged, FR-036); `rewrite_phases.display_data` is written at phase 1 and extended at phase 2 (FR-053); the `409 already_answered` rewrite result carries the stored display fields — write first, confirm they fail
- [x] T036 [US4] Extend `tests/client/quiz-rewrite.test.tsx`: the four outcome lines — 3/3 first try, a capped retry at 2 with the "all three terms used"/"both terms used"/"the term used" wording, a retry below 2, and phase 1 beating phase 2 using the real phase 1 mark (FR-048/FR-024); term statuses from the phase outcomes including a term correct in phase 1 and dropped in phase 2 staying "First try" (FR-049/FR-028); the term table replaces the old hint list and "Why these terms fit" (old strings absent); spans not found are not highlighted; the result summary receives focus (FR-025) — write first, confirm they fail

### Implementation for User Story 4

- [x] T037 [US4] Add the term-status computation (in `components/rewrite/TermTable.tsx` or a small shared util): per term, "First try" when correct in phase 1 (`phase1Result.termOutcomes`), else "Added in retry" when correct in phase 2 (`phase2Result.phase2TermOutcomes`), else "Not used" — the order from FR-028, display only (research R4)
- [x] T038 [P] [US4] Implement `components/rewrite/OutcomeSummary.tsx`: the recorded-mark panel — success-50 with the mark in the display font (48 px, #14653F; surface-50 + ink-900 when the recorded mark is below 2) and "/ 3 marks" — and the outcome pair per FR-024: (1) 3/3 → "Full marks on your first try." + grader feedback; (2) phase 2 = 2 → "Full marks for a retry — all three terms used." / "both terms used" / "the term used" (by the question's term count from `discussion.terms.length`) + "A retry can earn at most 2. Use every term on the first try next time for the full 3."; (3) phase 2 < 2 and phase 2 ≥ phase 1 → grader feedback + "A retry can earn at most 2."; (4) phase 1 > phase 2 → the retry feedback + "Your recorded mark is n / 3 (your better try)." with n = the phase 1 mark; `tabIndex={-1}` and focus on appear (FR-025)
- [x] T039 [P] [US4] Implement `components/rewrite/SentenceComparison.tsx`: two cards side by side (stack below ~640 px) — "YOUR RETRY" (or "YOUR SENTENCE" when phase 1 was final) with every credited term highlighted as in `FirstTryResult`, and the language note rendered as a wavy `--rd-danger-500` underline on the wrong word with one note line below ("Spelling: fromm → from. …") only when a validated `languageNote` exists (absent → nothing, FR-027/FR-034); "MODEL SENTENCE" (blue-50 card) with the target terms in bold blue-700 and one commentary line "N words — the terms do the work, so it can be short." (N computed by `countWords`; the text after the dash is fixed copy, FR-026)
- [x] T040 [P] [US4] Implement `components/rewrite/TermTable.tsx`: heading "The three terms" / "The two terms" / "The term" matching the question's term count; one row per term — term in the display font (18 px, 700) with its status pill ("First try" success-50/success-700, "Added in retry" blue-50/blue-700, "Not used" surface-100/ink-700), the key's `why` text (13 px, mute-600 — e.g. "names the government payment that lowers costs") and the definition (15 px); this table is the ONLY term listing — the old hint list and "Why these terms fit" are gone (FR-028); a `selfMark` variant renders without pills (used by US5)
- [x] T041 [US4] Compose state 5 in `components/rewrite/RewritePanel.tsx` in this exact order (FR-023): step tracker → `OutcomeSummary` → `SentenceComparison` → `TermTable` → `FirstTryCollapsed` (hidden when phase 1 was final) → footer; the plain-English block is NOT repeated; pass the footer needs ("Next: question N of M" / "Last question") up via a prop from `Quiz`
- [x] T042 [US4] Update the footer logic in `components/Quiz.tsx`: for a rewrite result show "Next: question 4 of 5" (number = current question index + 2; "Last question" on the last) above the existing "Next question" / "Finish" primary button (FR-030); keep the `canNext` gate (a rewrite shows Next only when the result is final)

**Checkpoint**: US1-US4 deliver the full P1 flow: write → mark → retry → mark → result with comparison.

---

## Phase 7: User Story 5 - Mark your own answer when the AI marker is unavailable (Priority: P2)

**Goal**: the self-mark screen in the new layout when the marker is unavailable or the allowance is used up, with the locked sentence, the model card, the term table without pills plus checkboxes, and "Save my mark".

**Independent Test**: with the marker unavailable, answer a question and confirm the self-mark screen uses the new layout (locked visible sentence, model-sentence card, term table without status pills, checkboxes, "Save my mark") with no phase 2.

### Tests for User Story 5 ⚠️

- [x] T043 [P] [US5] Extend `tests/client/quiz-rewrite.test.tsx`: the self-mark screen shows the locked sentence, the model-sentence card, the term table WITHOUT pills, a checkbox per term row and per criterion (a)/(c), "Save my mark", and the tracker "Write" then "Mark it yourself", with no phase 2 (FR-051/FR-037); the self-mark POST still sends the phase-appropriate ticks (spec 005 FR-046) — write first, confirm they fail

### Implementation for User Story 5

- [x] T044 [US5] Implement `components/rewrite/SelfMarkScreen.tsx` and compose it in `components/rewrite/RewritePanel.tsx` when `needsSelfMark`: `LockedSentence` (the sentence being marked), the model-sentence card, `TermTable` in its `selfMark` variant (no status pills; a checkbox per term row with a ≥ 44 px hit area), checkboxes for criteria (a) and (c), and the primary button "Save my mark" calling `onSelfMark(ticks)` exactly as today; the tracker variant "Write" → "Mark it yourself" (FR-037); behaviour unchanged — no phase 2, term ticks still feed concept tracking server-side (spec 005 FR-030/FR-046)

**Checkpoint**: the degrade path keeps working in the new layout.

---

## Phase 8: User Story 6 - Resume a half-finished question (Priority: P2)

**Goal**: resuming an attempt shows the state it is in — feedback + retry with the prefilled retry box, or the result with the full display data restored — never a marking state, with no typed text lost.

**Independent Test**: leave the question during feedback + retry (blur the box), return on another device, and confirm the hint and the retry box are shown with every saved character intact; confirm a completed result restores highlights, pills and the language note.

### Tests for User Story 6 ⚠️

- [x] T045 [P] [US6] Extend `tests/attempts/resume.test.ts` and `tests/api/grade-rewrite.test.ts`: a resumed `rewriteState` restores the display data (phase 1/2 credited spans, phase 2 term outcomes, language note) and the per-phase drafts (FR-055); no key field (no span, hint term, definition, model sentence or note) appears before a phase 1 grade, including on resume — extend the `allKeys` checks and the no-key-leak suite for the new field names (FR-044); marking states are never represented in the payload — write first, confirm they fail

### Implementation for User Story 6

- [x] T046 [US6] Extend `rewriteResumeState` in `lib/grading.server.ts` to accept the phase row's `display_data` and the drafts row and return `phase1CreditedSpans`, `phase2CreditedSpans`, `phase2TermOutcomes`, `languageNote`, `phase1Draft`, `phase2Draft` per the resume payload in `contracts/api.md`; stage discipline unchanged (nothing before a phase 1 grade, spans+hint at `phase1`, all display data at `final`)
- [x] T047 [US6] Extend `app/unit/[unitId]/quiz/page.tsx` to read `display_data` and the `rewrite_drafts` row (scoped to the session user) for each question and pass them into `rewriteState`
- [x] T048 [P] [US6] Extend `AttemptPayload.rewriteState` in `lib/drafts.ts` with the new display and draft fields (exact optional field names from `contracts/api.md`)
- [x] T049 [US6] Restore in `components/Quiz.tsx` (and consume in `components/rewrite/RewritePanel.tsx`): map the resumed fields onto the phase results (spans, phase 2 outcomes, language note), initialise the phase-2 draft from `phase2Draft ?? phase1Answer`, and clear a phase's sessionStorage draft once that phase is graded (the server clears its own draft column in T014; the client sends no clearing beacon) (research R6); a grade stored while away resumes at the graded state — never at a marking state (FR-038)

**Checkpoint**: all six user stories are complete; an attempt survives leaving, reloading and switching devices.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: full-suite gate, the manual validation, and documentation.

- [x] T050 [P] Update `tests/no-key-leak.test.ts` (if it is a static field-name scan) so the new display field names are part of the leak sweep; then run the full suite `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` and `npm run validate` through Git Bash (per CLAUDE.md) and fix every failure — including the existing rewrite tests updated to the new wording (FR-052)
- [x] T051 Run the manual check in `quickstart.md` on a real phone at 390 px through all five states (a 3/3 answer, a hinted retry reaching 2, a retry scoring lower than phase 1, an all-terms-but-too-long answer giving the "What to fix" hint), a reload during marking, resume on another device at feedback + retry with a half-edited retry, and the self-mark screen with the model off; during the pass audit FR-042 (every interactive target ≥ 44 px) and FR-043 (no sideways scrolling at 390 px) and fix anything that fails
- [x] T052 [P] Update `README.md` (the unit row for `y12-economics-sentence-writing` and the env-var table) to mention the rewrite redesign and the new `DRAFT_RATE_LIMIT` env var (default 30/min, draft saves only, never AI-graded), matching the existing env-var table format

**Checkpoint**: the feature is complete, validated automatically and by hand, and documented.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — starts immediately (T001 is the constitution amendment and MUST land first)
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories (the grader output, storage, draft route and styles are shared)
- **User Stories (Phase 3+)**: all depend on Foundational. US1 → US2 → US3 → US4 build one card in sequence (each story's components compose into the same `RewritePanel`); US5 and US6 depend on US1-US4 having added the states they reuse (locked sentence, term table, resume payload) but are then independently testable
- **Polish (Phase 9)**: depends on all user stories

### User Story Dependencies

- **US1 (P1)**: after Foundational — no other story
- **US2 (P1)**: after US1 (renders in the same panel, uses its submit path)
- **US3 (P1)**: after US2 (needs the marking machinery); `FirstTryCollapsed` (T032) is reused at result
- **US4 (P1)**: after US3 (needs `FirstTryResult` spans and the phase 2 data from US3)
- **US5 (P2)**: after US1-US4 (needs `LockedSentence`, `TermTable` and the composed panel)
- **US6 (P2)**: after US4 (needs the display data to restore); the resume payload/render work is additive

### Within Each User Story

- Tests (included per the spec) MUST be written and FAIL before implementation
- Components before composition (`RewritePanel` compose tasks last in each story)
- `components/Quiz.tsx` is touched only by the story that needs that specific change (T021 US1, T042 US4, T049 US6) to avoid same-file conflicts

### Parallel Opportunities

- Setup: T002 runs alongside T001 + the Foundational types/schema tasks (different files)
- Foundational: T003, T004, T006-T014 and T053 are all different files and can run in parallel (T005 depends on T004; T015 is independent)
- Within a story: the component tasks marked [P] (e.g. US3's T029-T032, US4's T038-T040) can run in parallel, then the compose tasks
- Tests per story ([P]) can be written in parallel with that story's other components since they only touch the test file

---

## Parallel Example: User Story 3

```bash
Task: "Extend tests/client/quiz-rewrite.test.tsx (US3 tests)"   # T028
Task: "Implement FirstTryResult.tsx"                            # T029
Task: "Implement HintCards.tsx"                                 # T030
Task: "Implement RetryBox.tsx"                                  # T031
Task: "Implement FirstTryCollapsed.tsx"                         # T032
# then compose states 3 and 4 in RewritePanel.tsx: T033, T034
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001: the constitution amendment (2.12.0 → 2.13.0) — must land first (FR-044, FR-053)
2. Complete Phase 2: Foundational (grader output + validation, storage, draft route, styles)
3. Complete Phase 3: US1 — a student can write and submit phase 1
4. **STOP and VALIDATE**: US1's independent test, then the suite

### Incremental Delivery

1. Setup + Foundational → the new data flows end-to-end (spans validated, display_data persisted, drafts saved)
2. US1 → writing state, MVP; US2 → the main fix (sentence stays visible while marking); US3 → the retry loop; US4 → the result with comparison — each independently tested before moving on
3. US5 → the degrade path keeps working in the new layout; US6 → cross-device resume with drafts and the full result
4. Polish → full-suite gate, the 390 px manual pass, README/env docs

### Parallel Team Strategy

1. Team completes Setup + Foundational together (the shape of the grader reply and the storage are the contract everyone else depends on)
2. Once Foundational is done: one developer drives the RewritePanel state machine through US1→US4 (they touch the same file); another can take the US4 route tests and US6 resume work; a third can take US5 once `LockedSentence` and `TermTable` exist
3. Stories integrate independently and are validated at each checkpoint

---

## Notes
- [P] tasks = different files, no dependencies; the RewritePanel compose tasks (T019/T033/T034/
  T041/T044/T049) are deliberately NOT [P]
- [Story] label maps the task to its user story for traceability; Foundational and Setup have no label
- Exact on-screen wording and visual values come from `spec.md` (final) and `design.md` (corrected — §3.2 and §8.1 already match the spec); the mockup sources in `mockups/source/*.dc.html` are static comps — take sizes and wording from them, never import them
- Verify tests fail before implementing; commit after each task or logical group; stop at each checkpoint to validate the story independently
- No new runtime dependency (constitution Principle VIII); `styles/tokens.css` stays untouched; logging stays as spec 005 FR-044 — never a sentence, span, language note, definition or model reply
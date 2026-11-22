# Tasks: Economics Essay Writing

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md) (R1–R13), [data-model.md](data-model.md), [contracts/api.md](contracts/api.md), [contracts/replies.md](contracts/replies.md), [quickstart.md](quickstart.md), [content-prompt.md](content-prompt.md)

**Prerequisites**: constitution 2.16.0 in force; specs 005–009 shipped and their suite green (baseline recorded in T002).

**Tests**: requested by plan.md ("Tests to ship"); each story has its test tasks, written before the code they cover.

**Shell**: every command runs through Git Bash (CLAUDE.md); scratch files go in `.cline/` as `tmp-*` and are deleted after. **Never commit or push unless asked** (the user does commits); never set an essay `live: true` before its review approval **and** the marker gate (T029) have passed.

**"Suite green"** means `npm test`, `npx tsc --noEmit` and `npm run lint` pass with the T002 baseline counts plus only this feature's new tests (the only lint warning allowed is the existing `Quiz.tsx` one), and `npm run validate` passes. Run it at the end of every phase.

## Implementation status (2026-11-22)

**Built and green** (`npx tsc --noEmit` clean; `npm run lint` only the three existing warnings in `Quiz.tsx`, `ParagraphPanel.tsx` and `paragraph/Results.tsx`; `npm run validate` and `npm run build` pass; the full suite is 2280 passing and 4 failing at the last full run, and the two contrast failures were fixed after it, in files that now pass): the constitution 2.17.0 amendment (T001), everything in slice S1 that does not need a person or a model (Foundation, scaffold, essay box, marker and grade handler, result page, unit page with Redo, gaps), and the whole of slice S2 (plan review, timer, Discard). The two remaining failures are **not from this feature**: `tests/api/grade-paragraph.test.ts` and `grade-paragraph-phase2.test.ts` expect the paragraph prompt version `round 5 (4 Nov 2026)` but `lib/paragraph/rubric.json` now says `round 6 (22 Nov 2026)` (they failed in the baseline before any change here).

**Not done, and why**
- **T020 to T024 (the marker gate)**: needs you to run `python scripts/pilot-essay-marker.py` locally and paste the report (OpenRouter is not reachable from here). The pilot script, golden prompt and app marker are ready: `--check` passes offline, `essay-pilot-2` is the prompt version.
- **T078 to T083 (content)**: the research (school criteria transcribed from the three trial solutions, marking notes, 600 to 800 word band 1 model essays with checked figures) is Qwen's job per `content-prompt.md`. `npm run essay-build-answers` (T080, written and tested) turns the approved JSON into `answers.ts`. Until an essay is approved and the gate has passed, all six stay `live: false` and the unit is not registered, so nothing is listed.
- **T058, T064, T087, T088 (manual phone checks and ship gates)**: need a real phone and a live essay.

**Deviations from the plan, all deliberate**
- The concept list is `lib/essay/concepts.json`, not a key inside `rubric.json`: `concepts.ts` is public and must not import the prompt and band descriptors. The documents were updated to match.
- `lib/essay/scoring.ts` holds the five band ranges and the criterion ids as constants (checked against `rubric.json` by `tests/essay/rubric-drift.test.ts`) for the same reason.
- `PublicEssay` is carried in `essayState`; the attempt payload's `questions` holds the real public `EssayQuestion`.
- The unit page passes the discard route a signed attempt token built on the server, because the client cannot make one.
- The daily-limit state is rebuilt on resume from the day's usage (`cap` in `EssayState`), so Submit stays off after a reload.
- A finished essay whose `results` row failed to save is repaired the next time the student starts or opens the unit (analysis C2).

## Format: `[ID] [P?] [Story] [Slice] Description with file path`

[P] = different files, no dependency on an unfinished task. Story labels: **US1** plan-write-mark flow and result, **US2** scaffold, **US3** plan review, **US4** word limit / paste / timer / drafts, **US5** marking, **US6** gaps, **US7** unit page / Redo / Discard, **US8** marker gate and content. Slice labels (plan.md): **S1** ships before Tue 1 Dec 2026 (target deployed Fri 27 Nov), **S2** follows.

## Phase 1: Setup

- [X] T001 [S1] Constitution first (research R1): amend `.specify/memory/constitution.md` 2.16.0 → 2.17.0 with the exact text in research.md R1 (Principle I release bullet and request-fields bullet; Principle II essay bullet and the "different essay" clause in the derived concept rule; Principle VI never-self-marked extension and plan-review failure; Principle VII `ESSAY_GRADING_MODEL`/`ESSAY_REVIEW_MODEL`; Quality Gates leakage, testing and marker-check bullets), prepend the Sync Impact Report above the 2.16.0 entry, set `**Version**: 2.17.0` and `Last Amended` to the real date. State that `POST /api/essay/scaffold` and the essay grade route are answer-submission routes. Hand-check the three templates in `.specify/templates/` (no unit named; nothing else changes).
- [X] T002 [S1] Record the baseline: run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run validate`, `npm run build` through Git Bash; write the pass counts and the lint warning into `.cline/tmp-baseline.md` (scratch; delete at the end). Every later "suite green" compares with it.

## Phase 2: Foundation (blocks every story)

**Purpose**: types, schema, config, pure modules, the unit scaffold (unlisted until an essay is live), shared helpers. Ends with suite green.

- [X] T003 [S1] Add the essay types to `lib/types.ts`: `EssayQuestion` (type "essay", group "essay", maxMarks 20, verb, economy `"china"|"nepal"|"both"`, offer 1–6, live, optional source), `EssayKey`, `Answer.essay`, `Question` union member, `UnitMeta.flow?: "essay"` and `UnitMeta.conceptsClearOnOtherQuestions?: boolean` (data-model §1). Fix every exhaustive `switch`/union the compiler then flags (`npx tsc --noEmit`) without changing other units' behaviour.
- [X] T004 [P] [S1] Add `explain` to `content/glossary.ts` with NESA's definition ("Relate cause and effect; make the relationships between things evident; provide why and/or how"); extend the glossary test in `tests/content-rules.test.ts` (or the nearest existing glossary test) to cover it.
- [X] T005 [P] [S1] Create `lib/essay/scaffold.ts` (plain module, no I/O): `EssayScaffold`/`BodyPara` types, `emptyScaffold()`, `SCAFFOLD_FIELDS` (20 fields with labels and placeholder prompts per spec FR-007), `scaffoldWords(s)` (sum of `countWords` per field), `validateScaffold(s, mode: "save" | "start")` returning `{ ok, reasons: ("over_cap"|"no_judgement"|"no_body_point")[] }`, `sanitiseScaffold(unknown)` (drops unknown keys, rejects non-strings, 1500-char field cap) per data-model §2. Constants `SCAFFOLD_CAP = 250`.
- [X] T006 [P] [S1] Create `lib/essay/counter.ts`: `ESSAY_MIN = 600`, `ESSAY_MAX = 800`, `essayCounter(n)` → `{ state: "under"|"ready"|"over", text, canSubmit }` with the exact wording of spec FR-019 ("412 / 600–800 words — 188 more to go", "712 / 600–800 words", "836 / 800 — cut 36 words"; singular "1 more to go" / "cut 1 word"), and `scaffoldCounter(n)` ("183 / 250 words", "263 / 250 words, cut 13 words").
- [X] T007 [P] [S1] Create `lib/essay/scoring.ts` (pure; research R7, contracts/replies.md §3): `normalise`, `quoteInText`, `scrubFlagWhy`, `clampToBand(mark, band, bands)`, `applyOneEconomyCap(final, economy, covers)` (cap 12 only when economy is "both"), `finalMark(...)` returning `{ final, capped }`, `outcomesFrom(gaps, usedWell)` → `[{conceptId, correct}]` (gaps false first, then used-well true, used-well minus gaps), `BAND_RANGES` from `rubric.json`.
- [X] T008 [S1] Add `essay_phases` and the partial unique index `attempts_essay_incomplete_unique` to `lib/db/schema.ts` exactly as data-model §3 (FK `(attempt_id, user_id)` → `attempts`, unique `(attempt_id, question_id)`, all checks); run `npm run db:generate` to create `drizzle/0009_*.sql`; confirm it contains only this change (no unrelated drift) and that PGlite test helpers (`tests/helpers/db.ts`) apply it.
- [X] T009 [S1] Create `lib/db/queries/essay-phases.server.ts`: `getEssayPhase`, `insertEssayPhase` (idempotent with the attempt), `saveScaffold` (where status = planning, else `scaffold_locked`), `lockScaffold` (planning → writing, sets `scaffold_locked_at`), `takeMarkingLease`/`clearMarkingLease` (the 90 s conditional update of research R6), `finaliseEssay` (where status = writing; fills all marking columns; one statement), `latestEssayMarks(db, userId)` (latest result per essay joined to band), `latestGapDetails(db, userId)`; add `createEssayAttempt` to `lib/db/queries/attempts.server.ts` (modelled on `createUnseenAttempt`, returns the existing open attempt on conflict). (`storeReviewAndLock` is in T073 and `discardOpenAttempt` in T063.)
- [X] T010 [P] [S1] Config: add `getEssayGradingModel()` (default `deepseek/deepseek-v4.1-flash`, blank is unset, never falls back to `GRADING_MODEL` or `ENGLISH_ADV_GRADING_MODEL`) and `getEssayReviewModel()` to `lib/config.server.ts`; document both in `.env.example` and the README env table; add cases to `tests/config.test.ts`.
- [X] T011 [S1] Update `lib/essay/rubric.json` for the app (research R7, R9; contracts/replies.md §1): add the `{schoolCriteria}` slot to `userTemplate` (value "None provided." when null), add `conceptsUsedWell` to the reply shape and one sentence of instruction, add a `verbMeanings` map (explain, assess, evaluate) if the pilot's `VERB_MEANINGS` is not already in the file, bump `promptVersion` to `essay-pilot-2`. Keep the concept list and band descriptors unchanged. Do not tune wording here (that is T026).
- [X] T012 [S1] Create the unit folder `content/units/y12-economics-essay-writing/`: `meta.ts` (id, Year 12, "Topic 1: The Global Economy", type "Writing Practice", title "Global Economy Essays", description, `flow: "essay"`, `conceptsReady: true`, `conceptsClearOnOtherQuestions: true`, order after the paragraph unit, `quiz: { short: 0, mc: 0, passMark: 60, groups: [{ group: "essay", n: 1 }] }`, a `guide`); `questions.ts` (the six public essays e1–e6 per data-model §1, wording verbatim from content-prompt.md, all `live: false`); `concepts.ts` (builds `Concept[]` from `lib/essay/rubric.json` `concepts`: id `y12-economics-essay-writing.c-<key>`, `term` before the colon, `description`, `clearAfter: 2`; the descriptions of `skill-models`, `skill-data-as-evidence`, `skill-judgement` import wording from `lib/paragraph/parts.ts` `TIPS`; `retired = {}`); `answers.ts` (`import "server-only"`; empty `Record` of `EssayKey` keyed by question id, filled by T080). Register in `content/index.ts` **only when at least one essay is `live`** (009's pattern) and in `content/answers/index.ts`.
- [X] T013 [S1] Validation: add `validateEssayRules` to `lib/content-rules.ts` per research R2 (ids, `offer` a permutation of 1–6, verb in glossary, `source` set exactly for e1/e3/e4, live essays need notes + model essay 600–800 words + tags on the list + school criteria on trial essays, no repeat of spec 007's essay questions, no key text in public data) and call it from `scripts/validate-content.ts`; make the concept-ready check accept an essay's key tags. Tests in `tests/essay/content-rules.test.ts` (new): pass case, and one failing case per rule using fixtures with `live: true`.
- [X] T014 [S1] In `lib/grading.server.ts` add the only readers of the essay key: `essayView(questionId)` (public question + verb definition, no key), `essayKeyForMarker(questionId)` (notes, school criteria, tags), `essayModelEssay(questionId)`; none exported from any other file (Principle I).
- [X] T015 [P] [S1] Create `lib/grade-common.server.ts`: `clientIp(req)`, `giveBack(slot)`, `json`, `bad` (copied once from `lib/unseen/grade-handler.server.ts`; do **not** refactor 007–009 to use it), and `lib/essay/log.server.ts` (outcome codes only, hashed user id, question id, duration, model; never text; model on `lib/paragraph/log.server.ts`).
- [X] T016 [S1] Concept rule: in `lib/concepts/progress.ts` track `raisedBy` (the `questionId` of each concept's last miss) and, when `unit.conceptsClearOnOtherQuestions`, ignore a correct outcome whose `questionId` equals `raisedBy` (research R9, data-model §5). Pass the flag through `conceptProgress`/`conceptReviewCounts`/`loadConceptProgress` (`lib/db/queries/results.server.ts`, `lib/concepts/weighting.server.ts`). Tests in `tests/essay/concept-rule.test.ts`: the worked example of data-model §5 (e1 miss, redo e1 ignored, e5 then e2 clears), a miss on a second essay re-raises, units without the flag behave exactly as before (run the existing concept tests unchanged).
- [X] T017 [S1] Foundation checkpoint: suite green; the unit is registered nowhere (no essay is live) so no route or page changed for other units.

## Phase 3: User Story 8, the marker gate (Priority: P1) — runs in parallel with Phases 4–7

**Goal**: the marker passes the gate on the shipping prompt before any essay goes live. **Independent Test**: the pilot report meets bar (a)–(g) of research R8. The agent cannot reach OpenRouter; **the user runs the pilot locally in Git Bash and pastes the report back.**

- [X] T018 [US8] [S1] Update `scripts/pilot-essay-marker.py` (research R7, R8): read `{schoolCriteria}` from each question (default "None provided."), `conceptsUsedWell` parsing and the disjoint-from-gaps check, record `finish_reason` and report any `length` cut-off, report seconds per call with median and p95, `quote_in_text` and `scrub_flag_why` twins of the TS guards (a flag whose quote is not in the essay is dropped from the hits), `--set tuning|holdout` (default tuning; `--data` already exists), `--write-golden` (writes `tests/fixtures/essay-golden-prompt.txt`) and `--check` that also compares the golden file, and a gate summary section that prints each of bar (a)–(g) as pass/fail. Keep standard library only.
- [X] T019 [P] [US8] [S1] Update `resources/topic011/pilot-essays.json` (gitignored): add `schoolCriteria` to the questions that have one (use "None provided." for the rest), `expectedUsedWell` where a labelled essay clearly uses a concept well; run `python scripts/pilot-essay-marker.py --check` offline until it passes; run `--write-golden` and keep the fixture.
- [X] T020 [US8] [S1] **User action**: run the pilot locally (`python scripts/pilot-essay-marker.py`, 3 runs, default model) and paste `resources/topic011/runs/<ts>/report.md` into the conversation. Claude reads it against bar (a)–(g).
- [X] T021 [US8] [S1] Tune `lib/essay/rubric.json` against the 7 labelled essays only (bump `promptVersion` each time, `--write-golden`, rerun **every** case, record each run); decide `max_tokens` and the first-call timeout from the report (raise `MAX_TOKENS` in the pilot and, later, in `lib/essay/marker.server.ts` together). Repeat T020/T021 until the bar passes. If an anchor (the model essay) or another model is needed, say so before adding it.
- [X] T022 [US8] [S1] Model comparison: the user runs `--model deepseek/deepseek-chat` (3 runs); choose the model per research R8; if not the default, change `getEssayGradingModel`'s default (T010) and `.env.example`.
- [X] T023 [US8] [S1] Frozen holdout (after tuning stops): Claude writes `resources/topic011/pilot-holdout.json`, 4 generated essays labelled with ranges (bands 2, 3, 4 and a China-only essay on the both-economies question 5), the user reviews the labels; the user runs `--set holdout`; the bar is none more than one band from its label; any miss goes to the user before release. Never tune on it.
- [X] T024 [US8] [S1] Record the gate: fill `quickstart.md` §2a (prompt version, model, set, results against (a)–(g), run folders, every change made); the shipping `promptVersion` and its golden fixture are the ones in the repo. **Gate result blocks T082 and T083 (`live: true`).**

## Phase 4: User Story 2, the scaffold (Priority: P1)

**Goal**: the student starts an essay, fills the scaffold with the 250-word cap and required-field rule, autosaves, and locks it with "Start writing". **Independent Test**: with a synthetic live essay, start an attempt, type 251 words and see both buttons disabled, reach 250 with a judgement and one point, press "Start writing" and see the scaffold locked; the server refuses a later edit.

### Tests for User Story 2

- [X] T025 [P] [US2] [S1] `tests/essay/scaffold.test.ts`: word total across the 20 fields, 250 passes and 251 fails, `no_judgement`, `no_body_point` (one non-empty point is enough), field cap, unknown keys dropped, non-strings rejected, `save` accepts an empty scaffold but not over the cap.
- [X] T026 [P] [US2] [S1] `tests/api/essay-scaffold.test.ts` (PGlite, helpers from `tests/helpers/routes.ts`; add `tests/helpers/essay.ts` for a synthetic live essay and the fake marker): save under the cap (200, words), save over the cap (400 `over_cap`, nothing stored), start invalid (400 `scaffold_invalid` with reasons), start valid (locked, status writing), any later save or start (409 `scaffold_locked`), another student's attempt (404), missing or bad attempt token (401), malformed body (400), draft rate limit.
- [X] T027 [P] [US2] [S1] `tests/api/attempts-essay.test.ts`: start with `questionId` (201, `essayState` stage "scaffold", no key fields), non-live or unknown essay (404), resume without `questionId` (200, `resumed: true`), none open (404 `no_open_attempt`), another essay while one is open (409 `attempt_open` with the open essay id), two simultaneous starts end on one attempt, database unreadable (503), a finished attempt does not block starting a new one (Redo).
- [X] T028 [P] [US2] [S1] `tests/client/essay-scaffold.test.tsx`: both buttons disabled over 250 words, with no judgement, and with all three body points empty; enabled otherwise; the counter wording; sections are `<details>`; restore from `sessionStorage` then from the server state; the sticky bar buttons are at least 44 px (class check).

### Implementation for User Story 2

- [X] T029 [US2] [S1] `lib/essay/state.server.ts`: `loadEssayState(db, userId, attempt)` building `EssayState` (stage from the row: planning → "scaffold", writing → "write" with the draft, finished → "result" via T054's builder; never the key); `lib/essay/start.server.ts`: `startEssay(userId, unit, questionId?)` implementing contracts B (live check, one open attempt, `attempt_open`, resume, `no_open_attempt`, database unreadable → unavailable).
- [X] T030 [US2] [S1] `app/api/attempts/route.ts`: add the essay branch (`unit.flow === "essay"`, read optional `questionId`, require a user session, 503 if degraded) returning the payload of contracts B with `essayState`; extend the `AttemptPayload` type in `lib/startAttempt.ts` (`essayState`).
- [X] T031 [US2] [S1] `lib/essay/scaffold-handler.server.ts` and `app/api/essay/scaffold/route.ts`: `action` `save`/`start` per contracts C (token and ownership checks, `checkDraftRateLimit` on save, server recount via `scaffoldWords`, `lockScaffold` on start, `409 scaffold_locked`).
- [X] T032 [P] [US2] [S1] `lib/drafts.ts`: add `saveEssayScaffoldDraft`/`loadEssayScaffoldDraft` (`sessionStorage`, key `draft:essay-scaffold:<attemptId>`, try/catch as the existing helpers).
- [X] T033 [US2] [S1] `components/essay/Scaffold.tsx`: the question with verb highlighted and defined (reuse the paragraph/unseen verb component), the economy line ("You write about China."), five `<details open>` sections with the 20 fields (auto-growing textareas, labels and placeholder prompts from `SCAFFOLD_FIELDS`), section summaries ("Body paragraph 2 · 3 of 5 filled"), a sticky bottom bar with `scaffoldCounter` and the **"Start writing"** button (the "Get feedback on my plan" button is T063), 1.5 s debounced autosave plus `pagehide`/`visibilitychange` `fetch` with `keepalive`, sessionStorage mirror, error states, 44 px targets; styles in `app/globals.css` from `styles/tokens.css` only.
- [X] T034 [US2] [S1] Suite green; run `tests/essay`, `tests/api/essay-scaffold.test.ts`, `tests/api/attempts-essay.test.ts`, `tests/client/essay-scaffold.test.tsx`.

## Phase 5: User Story 4, word limit, no paste, drafts (Priority: P1)

**Goal**: the essay page enforces 600–800 words in browser and server, blocks pasting, autosaves the draft. **Independent Test**: type 599, 600, 800, 801 words and see the Submit state and wording; try to paste and drop; a 500-word essay sent straight to the server is refused.

### Tests for User Story 4

- [X] T035 [P] [US4] [S1] `tests/essay/counter.test.ts`: wording and `canSubmit` at 0, 1, 599, 600, 712, 800, 801, 836; singular forms; the scaffold counter at 250 and 251.
- [X] T036 [P] [US4] [S1] `tests/client/essay-box.test.tsx`: Submit disabled at 599 and 801, enabled at 600 and 800; the counter text in a polite live region; a `paste` event, a `drop` event, `beforeinput` with `insertFromPaste`/`insertFromDrop`/`insertFromYank` insert nothing and show the "Pasting is switched off" note, which clears; `insertReplacementText` is allowed; the draft saves on a debounce and on pagehide.
- [X] T037 [P] [US4] [S1] `tests/api/rewrite-draft-essay.test.ts`: the essay draft saves for a writing attempt (phase 1, 8000-character cap), is refused (`saved: false`) while the attempt is still planning, after the essay row is finished and after the attempt completes; ownership and token checks; limiter.

### Implementation for User Story 4

- [X] T038 [US4] [S1] `app/api/rewrite/draft/route.ts`: accept `type: "essay"` questions (phase 1 only), raise `MAX_DRAFT_LEN` to 8000 for essays only (others keep 6000), stale check via the essay row (`getEssayPhase`: status planning or finished → `{ saved: false }`).
- [X] T039 [US4] [S1] `components/essay/EssayBox.tsx`: the textarea with `essayCounter`, `onPaste`/`onDrop`/`onDragOver` `preventDefault`, `onBeforeInput` cancel for the paste/drop/yank input types, the 4 s note, `autoComplete="off"`, debounced draft save + `sendRewriteDraftBeacon` on blur/pagehide + sessionStorage (`lib/drafts.ts` pattern, key `draft:essay:<attemptId>`), `aria-describedby` to the counter, the locked/busy state for T047.
- [X] T040 [P] [US4] [S1] `components/essay/PlanReadout.tsx`: the read-only scaffold in a collapsible section ("Your plan", open by default), empty fields hidden, used by the essay page and the result page.

## Phase 6: User Story 5, marking out of 20 (Priority: P1)

**Goal**: the essay is marked in the AT1 bands with five verdicts, clamped, capped for one economy, flags and gaps validated. **Independent Test**: with the fake marker, submit a 700-word essay and get a stored result; submit a China-only essay on a both-economy question and get a mark ≤ 12; make the marker fail and get the box back with no mark.

### Tests for User Story 5

- [X] T041 [P] [US5] [S1] `tests/essay/marker-parse.test.ts` (contracts/replies.md §1): a valid reply; each missing or invalid verdict fails; band 0 and 6 fail; non-integer mark fails; missing `coversRequiredEconomies` fails; missing `bandReason` fails; `liftYourMark` empty fails, three items keep two; flags whose quote is not in the essay are dropped, ≤ 5 kept, digits not in the quote scrubbed; gaps off the list dropped, deduped, ≤ 5 in order; `conceptsUsedWell` off-list dropped and minus gaps, missing → `[]`; the echo guard fails a reply that repeats 60+ characters of the notes or school criteria.
- [X] T042 [P] [US5] [S1] `tests/essay/scoring.test.ts`: a mark outside its band is clamped (both directions) with raw kept; the cap at 12 applies only to economy "both" with `covers` false; a capped band 1 reply ends at 12 and `capped` is true; one-economy essays ignore `covers`; `outcomesFrom` order and disjointness.
- [X] T043 [P] [US5] [S1] `tests/essay/prompt.test.ts` and `tests/essay/rubric-drift.test.ts` (patterns of `tests/paragraph/prompt.test.ts`, `rubric-drift.test.ts`): the TS prompt for a fixed question equals `tests/fixtures/essay-golden-prompt.txt` (written by the pilot's `--write-golden`); changing `promptVersion` without regenerating the golden file fails; the school-criteria slot renders "None provided." when null; economy rules render for china, nepal, both.
- [X] T044 [P] [US5] [S1] `tests/api/grade-essay.test.ts` (PGlite + `scripts/fake-openrouter.ts`): success stores every column, writes the `results` row (final mark, max 20, concept outcomes), completes the attempt, deletes the draft, returns `EssayResultView`; 599 and 801 words refused before any slot (`essay_too_short`/`essay_too_long`, slot count unchanged); empty refused; attempt still planning (409 `scaffold_not_locked`); second request while leased (409 `marking_in_progress`) and after finishing (409 `already_answered` with the stored result); marker failure (no key, bad JSON twice) returns `{ notMarked: marker_unavailable }`, refunds the slot, clears the lease, keeps the draft, no mark stored; a malformed first reply and valid second is accepted (one retry); daily limit returns `{ notMarked: daily_limit, resetsAt }`, takes no slot, keeps drafts; rate limit 429; database unreadable 503; a 90-second-old lease is ignored; marks clamped and capped as stored (raw vs final).
- [X] T045 [P] [US5] [S1] `tests/client/essay-marking.test.tsx`: submitting locks the box (`readOnly`, `aria-busy`) with timed status steps in a polite live region; `notMarked: marker_unavailable` returns the editable box with the text and the plain notice; `daily_limit` shows "come back tomorrow" and Submit stays disabled after reload; a 400 `essay_too_short` shows the counter state; a network error returns the box with the usual error.

### Implementation for User Story 5

- [X] T046 [US5] [S1] `lib/essay/marker.server.ts` (model on `lib/unseen/marker.server.ts`): `buildEssayMessages` rendering `rubric.json` exactly as the pilot's `build_messages`; `parseEssayReply` (contracts/replies.md §1); the generalised echo guard (corpus of notes + school criteria); `markEssay(question, essay)` using `getEssayGradingModel()`, `chatCompletion` with `json: true`, `maxTokens` and timeouts from T021, one retry inside the 55 s budget, `finishReason === "length"` a failure, logs reason codes only; the model essay is never sent. Reads the key through `essayKeyForMarker` only.
- [X] T047 [US5] [S1] `lib/essay/grade-handler.server.ts` and the essay branch in `app/api/grade/route.ts` (`export const maxDuration` stays 60 unless T021 says otherwise): order per contracts F (parse → word check → database → row state → lease → marking available → rate limits → slot → marker → finalise → result row via `saveResult` → clear draft); `notMarked` paths clear the lease, save the draft (`upsertRewriteDraft`, phase 1) and refund as specified; `buildReceipt` on a failed result save (as `saveFinalAndRespond`).
- [X] T048 [US5] [S1] `components/essay/EssayPanel.tsx` (the stage router: scaffold → write → result) with the locked marking screen (reuse the status-step pattern of `components/unseen/Writing.tsx`: steps at 0, 8, 18, 30, 45 s; reduced-motion safe), the not-marked notices (`lib/unseen/notices.ts` wording reused where it fits), the over-cap state; wire the "Submit essay" button to `POST /api/grade` with `{ attemptId, attemptToken, questionId, answer }`.
- [X] T049 [US5] [S1] Suite green; run the new essay tests.

## Phase 7: User Story 1, the whole flow and the result page (Priority: P1) 🎯 MVP

**Goal**: plan, write, submit, see the result, with the scaffold locked after planning and no key before the student's own result. **Independent Test**: with one synthetic live essay, complete scaffold → "Start writing" → 700 words → submit → result with mark, band, five verdicts, lift points, essay beside plan, model essay, gaps; open the attempt later from "Your results".

### Tests for User Story 1

- [X] T050 [P] [US1] [S1] `tests/essay/views.test.ts`: `resultView` for a finished row includes `modelEssay`, `capped`, two lift points and ≤ 5 gaps with terms; for any other status it throws or omits `modelEssay`; never includes the raw mark, the review, notes, criteria or tags.
- [X] T051 [US1] [S1] Extend `tests/no-key-leak.test.ts` (research R12): add `schoolCriteria`, `modelEssay`, `essayKey` to `BANNED_KEYS` where the helper scans payloads; loop **every essay in the unit (live or not)**: start, resume, unit page data, scaffold save/start, draft save, an unfinished attempt detail, a not-marked response, the over-cap response all contain no substring of the key (notes, school criteria, model essay, each tag); then mark with the fake marker and assert the model essay appears only in the grade response and the finished detail. Add the essay unit to the shipped-output scan (`tests/unseen/no-key-leak-shipped.test.ts` pattern) so `.next/static` is scanned for the key.
- [X] T052 [P] [US1] [S1] `tests/client/essay-result.test.tsx`: the summary takes focus; mark and band; five criteria each with the verdict **word and icon** (not colour alone) and the reason; two lift points; flags show the quoted words and no number; the capped message; essay and plan beside each other (grid class) with plan collapsible; the model essay is collapsed by default; "Added to Things I need to know" lists the gaps; no review information anywhere.
- [X] T053 [P] [US1] [S1] `tests/api/essay-flow.test.ts`: end to end through the real routes with the fake marker: start → save scaffold → start writing → save draft → grade → result; resume at each stage returns the right `essayState`; the finished attempt resumes to the result; the scaffold cannot change after "Start writing"; the unfinished attempt detail has no model essay.

### Implementation for User Story 1

- [X] T054 [US1] [S1] `lib/essay/views.ts`: `resultView(row, question, modelEssay)` → `EssayResultView` (contracts F); `capped` from raw/clamped/final; gap terms from the unit's concepts; called only for a finished row owned by the session user, with `essayModelEssay` from `lib/grading.server.ts`. Use it in `loadEssayState` (T029) for stage "result" and in the grade handler.
- [X] T055 [P] [US1] [S1] `components/essay/Result.tsx` (research R11): summary, criteria rows with verdict word + icon, lift points, flags, `PlanReadout` beside the essay (CSS grid two columns from 900 px, stacked below), collapsed model essay, gaps list, "Back to essays"; focus on the summary; tokens only.
- [X] T056 [US1] [S1] `components/Quiz.tsx`: the essay stage (`current.type === "essay" && payload?.essayState` renders `EssayPanel`), add `essayState` to the single-question attempt test (`isParagraphAttempt` pattern) so no "Next question" or score screen is shown; `app/unit/[unitId]/quiz/page.tsx` accepts `?essay=<id>` for a start and plain for a resume.
- [X] T057 [US1] [S1] `app/attempts/[attemptId]/page.tsx` and `components/essay/AttemptDetail.tsx`: finished attempt → `Result` (own result, including the model essay); unfinished → plan and draft only; `components/AttemptHistory.tsx` lists "Essay 3 · Nepal" with date, mark / 20 and band (via `lib/db/queries/history.server.ts`, scoped to the session user).
- [ ] T058 [US1] [S1] Suite green; quickstart §4 steps 5, 8, 9, 11, 12, 16 on a synthetic live essay in `npm run dev` with `npm run fake-openrouter`.

## Phase 8: User Story 7, the unit page, Redo, Discard (Priority: P1; Discard S2)

**Goal**: the student sees the live essays in offer order with the latest mark, starts, resumes or redoes one at a time; Discard frees them if unmarked. **Independent Test**: list order 1, 3, 5, 2, 4, 6 filtered to live; Resume on the open essay with others disabled; Redo shows the new mark; Discard keeps earlier results.

### Tests for User Story 7

- [X] T059 [P] [US7] [S1] `tests/essay/unit-page.test.ts` (loader and component): live filter (non-live absent), offer order, latest mark per essay (a redo replaces it), "Next up" on the first live essay with no result, Start/Redo/Resume labels, other cards disabled with the message while an attempt is open, a student with no live essays sees the waiting message, database unreadable shows a notice and no list.
- [X] T060 [P] [US7] [S2] `tests/api/essay-discard.test.ts`: discard of a planning attempt and of a writing attempt deletes the attempt, essay row and draft; earlier finished attempts of the same essay and their results are untouched; refused while the lease is under 90 s (409 `marking_in_progress`); refused for a finished attempt (409 `already_finished`); another student's attempt 404; after discard any essay can start.
- [X] T061 [P] [US7] [S2] `tests/client/essay-discard.test.tsx`: the button appears only on the open card while unmarked; the confirm names what is deleted (`components/unseen/Dialog.tsx` reused), focus is trapped and restored; cancel changes nothing.

### Implementation for User Story 7

- [X] T062 [US7] [S1] `lib/essay/progress.server.ts` (`loadEssayProgress(db, userId)`: per essay the latest `results` row by `created_at` with its band, and the open attempt's essay and stage) and `components/essay/UnitEssays.tsx` (cards: question with verb highlighted, economy tag, source for trial essays, latest "14 / 20 · band 2", Start/Redo/Resume button, "Next up"); `app/unit/[unitId]/page.tsx`: render `UnitEssays` for `unit.flow === "essay"` (no "Start quiz" button, no weakness weighting) beside the existing `ConceptPanel` and results history.
- [X] T063 [US7] [S2] `lib/db/queries/essay-phases.server.ts`: `discardOpenAttempt(db, userId, attemptId)` (delete the `attempts` row where `completed_at is null` and the lease is null or older than 90 s; report which refusal); `lib/essay/discard-handler.server.ts`, `app/api/essay/discard/route.ts` (contracts B), `components/essay/DiscardButton.tsx` with the confirm; wire into `UnitEssays`.
- [ ] T064 [US7] [S1] Suite green; quickstart §4 steps 1 and 14.

## Phase 9: User Story 6, gaps in "Things I need to know" (Priority: P2)

**Goal**: up to 5 gaps from the concept list after marking, with the missing-piece line, clearing after 2 correct uses on different essays. **Independent Test**: mark an essay that names the WTO without effects and see the concept with its line; use it well on two other essays and see it clear; a redo does not clear it.

### Tests for User Story 6

- [X] T065 [P] [US6] [S1] `tests/essay/gaps-integration.test.ts` (PGlite): after a marked essay `results.concept_outcomes` holds gaps false then used-well true; `loadConceptProgress` lists the gap with count 2; a second marked essay that uses it well takes it to 1, a third to 0 (cleared); a redo of the raising essay does not change it; a miss on another essay re-raises it; a concept never tracked before is not listed; off-list ids never reach the results row; the unit's `conceptReviewCounts` entry matches.
- [X] T066 [P] [US6] [S1] `tests/client/concept-gap-detail.test.tsx`: `ConceptPanel` with the optional `details` map shows the one-line detail under the matching concept; without the prop it renders exactly as before (existing snapshot tests stay green).

### Implementation for User Story 6

- [X] T067 [US6] [S1] In the grade handler (T047) write `conceptOutcomes` from `outcomesFrom(gaps, usedWell)` into the result fields; `latestGapDetails` (T009) feeds `components/ConceptPanel.tsx` (new optional `details` prop; the unit page passes it for the essay unit only) and `app/api/units/[unitId]/concepts/status/route.ts` if it renders the same list.
- [X] T068 [US6] [S1] Result page gap list (T055) shows each gap as "<concept term>: <detail>"; confirm the gaps shown equal the gaps stored.

## Phase 10: User Story 3, plan review (Priority: P2, slice S2)

**Goal**: optional unmarked feedback on the scaffold before writing; failure and the daily limit offer "Start writing". **Independent Test**: review a scaffold with one body point lacking a year and see seven lines, a fix worded as a question and no mark; turn the reviewer off and see "Start writing" offered.

### Tests for User Story 3

- [X] T069 [P] [US3] [S2] `tests/essay/review-parse.test.ts` (contracts/replies.md §2): seven ids once each re-sorted; missing id fails; status outside the set fails; a `fix` line without "?" fails the reply; line > 240 chars fails; flags whose quote is not in the scaffold dropped, ≤ 4, numbers scrubbed; unknown keys (mark, band, rewritten text) are never stored.
- [X] T070 [P] [US3] [S2] `tests/api/essay-review.test.ts`: success stores the review and locks the scaffold in one update and takes one slot; reviewer failure (no key, bad JSON twice) returns `notReviewed: reviewer_unavailable`, refunds the slot, **does not lock**; daily limit returns `notReviewed: daily_limit` without locking; a second review 409 `already_reviewed`; locked scaffold 409; invalid scaffold 400; no mark or band anywhere; the finished result view contains no review.
- [X] T071 [P] [US3] [S2] `tests/client/essay-review.test.tsx`: both buttons on the scaffold page with the same disabled rules; pressing "Get feedback on my plan" shows a busy state then the essay page with "Feedback on your plan" (collapsible, seven lines with strength/fix words and icons, fixes as questions, figure flags "check this figure"); `notReviewed` shows the plain notice and keeps "Start writing" enabled; "Start writing" never shows the review section.

### Implementation for User Story 3

- [X] T072 [US3] [S2] `lib/essay/review.json` (own `promptVersion` `essay-review-1`; seven checks per spec FR-013, "never write sentences or paragraphs for the student", fixes as questions, flag wrong figures with no replacement number) and `lib/essay/review.server.ts` (`buildReviewMessages`, `parseReviewReply`, `reviewPlan` with `getEssayReviewModel()`, one retry inside a 45 s budget, first call 25 s, `maxTokens` 1500; the prompt receives the scaffold, question, verb meaning and economy rule only, never the key).
- [X] T073 [US3] [S2] `lib/db/queries/essay-phases.server.ts`: `storeReviewAndLock` (one update: review, versions, model, `reviewed_at`, status writing, `scaffold_locked_at`, where status = planning); `lib/essay/review-handler.server.ts` and `app/api/essay/review/route.ts` (contracts D, the slot refunded on failure via `lib/grade-common.server.ts`).
- [X] T074 [US3] [S2] `components/essay/ReviewPanel.tsx` (collapsible "Feedback on your plan" on the essay page); add the **"Get feedback on my plan"** button to `components/essay/Scaffold.tsx` beside "Start writing" with the shared disabled rule and the `notReviewed` notice; pass `essayState.review` through `loadEssayState`.
- [X] T075 [P] [US3] [S2] `scripts/pilot-essay-review.py` (standard library only; `--check`, 4 scaffolds × 3 runs reading `lib/essay/review.json`): reports seven lines on every reply, every fix a question, no rewritten sentence, the planted wrong figure flagged without a number, no cut-off; user runs it locally and pastes the report; record the result in `quickstart.md` §3. Not part of the marker gate.

## Phase 11: User Story 4 (timer), slice S2

- [X] T076 [P] [US4] [S2] `tests/client/essay-timer.test.tsx`: the timer is optional and never blocks Submit; counts down from 50:00 once started (fake timers); at zero shows "Time is up. You can still submit." in a polite live region and Submit stays enabled; a reload shows it unstarted; no animation class under `prefers-reduced-motion`.
- [X] T077 [US4] [S2] `components/essay/Timer.tsx` (client-only state, "Start 50-minute timer", "mm:ss left") wired into `EssayPanel` beside the counter.

## Phase 12: User Story 8, content (Priority: P1; e1, e3, e5 are S1, e2, e4, e6 S2)

**Goal**: essays go live one at a time as each passes review, after the gate. **Independent Test**: `npm run validate` passes with the essay live and its model essay reaches band 1 on the real marker.

- [ ] T078 [US8] [S1] Content batch 0 (content-prompt.md, run by Qwen, reviewed by Claude): check and extend the concept list in `lib/essay/concepts.json` (a changed list changes the prompt, so bump `promptVersion` in `lib/essay/rubric.json` and `--write-golden`; if it changes after the gate it is rerun; never rename an existing key), and write `resources/topic011/figures.md` (every figure with year, source, URL and check date; UNVERIFIED ones unused).
- [ ] T079 [US8] [S1] Content batch 1 (essays e1, e3, e5): Qwen produces `resources/topic011/content/<id>.json` (school criteria verbatim for e1 and e3, marking notes, band 1 model essay of 600–800 words, concept keys, sources); Claude reviews each stage against the school papers in `resources/y12_economics_trial_exams/` and `figures.md`; the user approves each essay in a review report (`resources/topic011/review/ALL-REVIEW.md`, "Essay 1/3/5", an empty box each).
- [ ] T080 [US8] [S1] A generator script `scripts/essay-build-answers.ts` (gitignored inputs in `resources/topic011/content/`, `tsx --conditions=react-server`) that writes `content/units/y12-economics-essay-writing/answers.ts` from the approved JSON (only essays the user has ticked), refuses a model essay outside 600–800 words, and prints which essays it wrote; add an npm script `essay-build-answers`.
- [ ] T081 [US8] [S1] Model-essay check for each approved essay: mark it with the real marker three times (add it as a labelled case expecting band 1 in a scratch copy of the pilot data, `.cline/tmp-modelcheck.*`); it must reach band 1 on the majority with no data flags and only on-list gaps; revise and rerun any that fail; list results.
- [ ] T082 [US8] [S1] After the gate (T024) has passed on the shipping prompt version and the user has ticked an essay: run `npm run essay-build-answers`, set `live: true` for that essay in `content/units/y12-economics-essay-writing/questions.ts`, run `npm run validate`, `npx tsc --noEmit`, `npm test`, `npm run build`. Do e1, then e3, then e5, one at a time. Leave the changes uncommitted for the user.
- [ ] T083 [US8] [S2] Content batch 2 (essays e2, e4, e6): as T079 (school criteria verbatim for e4), T080, T081, T082 in order.

## Phase 13: Polish and ship gate

- [X] T084 [P] [S1] `scripts/delete-student.ts` and its dry-run listing: report `essay_phases` rows; `tests/api/delete-essay.test.ts` (pattern of `tests/api/delete-paragraph.test.ts`): deleting a student removes attempts, essay rows, drafts and results; retention (`tests/retention.test.ts`) covers the new rows.
- [X] T085 [P] [S1] `tests/client/essay-a11y.test.tsx`: verdicts and strength/fix lines never rely on colour alone; marking progress in a live region; the counter in a live region; focus on the result summary and on the box after a not-marked return; buttons and targets at least 44 px (class checks); reduced motion; the pages have no fixed widths over 390 px (class check).
- [X] T086 [P] [S1] Docs: README unit row and env table (`ESSAY_GRADING_MODEL`, `ESSAY_REVIEW_MODEL`), `.env.example`, `docs`/README units table sources line (school trial papers credited, original essays), `CLAUDE.md` plan pointer (already set).
- [X] T087 [S1] S1 ship gate (quickstart §5): `npm run validate`, `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` green; the shipped-output scan finds no key text; the gate record in quickstart §2a shows a pass on the shipping `promptVersion` (rerun once if the prompt changed since); §4 steps 1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 14, 15, 16 on essays 1 and 5 on a real phone; the user deploys (target Fri 27 Nov 2026). Essays 1, 3, 5 live.
- [ ] T088 [S2] S2 ship gate: the review pilot (T075) passed; §4 steps 4, 7 and 13 on a real phone; essays 2, 4, 6 live; suite green.

---

## Dependencies & Execution Order

- **T001 first** (constitution), then T002. Phase 2 (T003–T017) blocks every story; within it T003 blocks T005–T016 that import the types, T008 blocks T009, T011 blocks T012 (concepts read the JSON), T014 needs T012, T013 needs T012.
- **Phase 3 (the gate, US8)** needs only T011 and the pilot data; it runs **in parallel** with Phases 4–7 and content (T078–T081). It does not block building, only `live: true` (T082, T083).
- **US2 (Phase 4)** → **US4 essay box (Phase 5)** → **US5 marking (Phase 6)** → **US1 result and flow (Phase 7)**: each needs the previous stage's components. US7 (Phase 8) needs T029/T030/T054 (start and views). US6 (Phase 9) needs T047 and T055. US3 (Phase 10), the timer (Phase 11) and Discard (T063) are S2 and independent of each other once their stories' S1 parts exist.
- Content batch 0 (T078) should finish before the shipping prompt is fixed, because a changed concept list changes the prompt and reopens the gate; run it first.
- **T082 (set live) needs**: T024 (gate passed on the shipping prompt), T079–T081 for that essay, the user's tick, and T080's generator.

### Parallel opportunities

- Phase 2: T004, T005, T006, T007, T010, T015 are independent files after T003.
- Gate (T018–T024) and content (T078–T081) alongside Phases 4–7.
- Within stories: all `[P]` test tasks of a story together (e.g. T025–T028; T035–T037; T041–T045; T050, T052, T053; T059–T061; T065–T066; T069–T071).

```text
# After T003: launch together
T004 explain glossary · T005 scaffold.ts · T006 counter.ts · T007 scoring.ts · T010 config · T015 grade-common + log
# Phase 6 tests together
T041 marker-parse · T042 scoring · T043 prompt/drift · T044 grade-essay route · T045 marking client
```

## Implementation Strategy

### S1, shippable by Fri 27 Nov (essays 1, 3, 5)

1. T001–T002, then Phase 2 (suite green).
2. In parallel: the gate (T018–T024, the user runs the pilot twice or three times) and the build (Phases 4 → 7), plus content batches 0 and 1.
3. Phase 8 (unit page with Redo; Discard waits), Phase 9 (gaps).
4. T082 for e1, then e3, then e5 as each is approved and the gate has passed; T084–T087.
5. **Stop and validate on a real phone; the user deploys.** If the gate has not passed, nothing goes live; the unit stays unlisted (the date does not override the gate, research R8).

### S2 (after the exam date if time runs short)

Plan review (Phase 10), timer (Phase 11), Discard (T063), content batch 2 (T083), then T088. Each is independent of the others.

### Notes

- Never commit or push; the user does. Never set `live: true` before the gate and the user's tick. Scratch files in `.cline/` as `tmp-*`, deleted after.
- Live 007–009 code is not refactored in S1 (plan Structure Decision); `lib/grade-common.server.ts` is for the essay handlers only.
- After any prompt change: bump `promptVersion`, `--write-golden`, rerun every pilot case.

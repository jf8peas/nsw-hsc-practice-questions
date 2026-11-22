# Tasks: Advanced English Comparative Short Answers

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md) (R1–R13), [data-model.md](data-model.md), [contracts/api.md](contracts/api.md), [quickstart.md](quickstart.md), [content-prompt.md](content-prompt.md)

**Prerequisites**: spec 008 shipped and its suite green (baseline recorded in T002).

**Tests**: requested by plan.md ("Tests to ship"); each story has its test tasks, written before the code they cover.

**Shell**: every command runs through Git Bash (CLAUDE.md); scratch files go in `.cline/` as `tmp-*` and are deleted after. Never commit or push unless asked; never set `reviewedOn` or tick `ALL-REVIEW.md` boxes: the user does.

**"008 green"** means: `npm test` (the full suite), `npx tsc --noEmit` and `npm run lint` pass with the same counts as the T002 baseline plus only this feature's new tests, and `npm run unseen-build-bank` leaves 008's generated files byte-identical (`git diff --stat content/units/y12-english-advanced-unseen-texts` empty apart from intended changes).

## Implementation status (2026-11-20)

**Done and green** (tsc, lint with only the existing `Quiz.tsx` warning, `npm run validate`, `npm run build`, the full suite at 2093 tests before the last small script edits and 549 in `tests/scripts` + `tests/unseen` after them): T001–T018, T024–T057, plus the mechanical part of T058 and T063's README row. Everything student-visible works end to end on a synthetic bank (two questions on real store texts), and the unit is **not registered** (so not listed, no routes) until its bank has questions.

**Not done, and why**
- **T019–T023 (the marker gate)**: DONE 2026-11-21. Passed on `comparative-pilot-2` (see quickstart.md §2a); `comparative-pilot-1` had failed the holdout on one answer.
- **T058 (rest), T059–T061 (content batches)**: inventory of Fort St 2023 and 2025, Roseville 2026 (OCR) and North Sydney Boys 2024; the bank files; the model-answer checks. The six single-text Question 5s are relabelled `kept` in their inventories, 008's FR-040 is amended and 008's `qNo` range widened to 1–5; restating the multi-text count after the four papers is outstanding.
- **T062 (release) and T064 (ship gate)**: wait for the gate, the user's ticks in `ALL-REVIEW.md` and the phone check.

**Deviations from the plan, all deliberate**
- **Skills layout (T004)**: `lib/unseen/skills.json` stays spec 008's seven (its prompt, pilot script and tests are untouched); the two comparison skills are in `lib/comparative/skills.json`, and `lib/unseen/skills.ts` exports both as `COMPARATIVE_SKILLS`.
- **Hidden until released (T016)**: `content/index.ts` registers the unit only when `questions.length > 0`, so there is no empty-unit validation error and no route to it.
- **Migration `drizzle/0008_*.sql`** also drops `unseen_phases_flagged_idx`: spec 008 removed `flagged_at` from the schema in 2.15.1 without a migration, so drizzle-kit's snapshot differed; the column and its check were left in the database untouched, only the unused index is dropped.
- **Skill progress is written when a question ends** (full marks, a marked retry or a declined retry), as for spec 008, so a below-full first try that is still at its retry choice does not yet move "Things I need to know".
- **Draw tests, unit page**: "Results by question type" is the section title (the history section below it keeps "Your results").

## Format: `[ID] [P?] [Story] Description with file path`

[P] = different files, no dependency on an unfinished task. Story labels: US1 tabs/pick/mark, US2 tab out/highlights, US3 retry/discussion, US4 skills, US5 marker gate, US6 draw/unit page, US7 offline re-mark, US8 bank.

## Phase 1: Setup

- [X] T001 Constitution first (research R1): amend `.specify/memory/constitution.md` 2.15.1 → 2.16.0 with the exact text in research.md R1 (Principles I, II, V, VI, VII, Quality Gates; amendment log above the 2.15.1 entry; Sync Impact Report; version and Last Amended date), then sync dependent templates the constitution workflow lists (`.specify/templates/plan-template.md` Constitution Check wording if it names the unit). Run `/speckit-constitution`'s consistency pass by hand; nothing else changes. Details: (a) `Last Amended` is the real date the task runs, not a fixed date; (b) state explicitly that `POST /api/comparative/pick` is an answer-submission route (listed in that bullet with `pick`), not an "other route"; (c) add to the amendment log that a unit's concept list may name concept ids defined by another unit it shares progress with (spec 009 FR-022).
- [X] T002 Record the 008 baseline: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run validate`, `npm run build`; write the pass counts and the lint warning (`Quiz.tsx:249`) into `.cline/tmp-baseline.md` (scratch; delete at the end). Every later "008 green" compares with this.

## Phase 2: Foundation (blocks every story)

**Each refactor of live 008 code is its own task and ends with 008 green before the next starts.**

- [X] T003 [P] Types: in `lib/types.ts` add `ComparativeChoice`, `ComparativeQuestion`, `ComparativeKey`, `AnswerSet.comparative`, `UnitMeta.sharesProgressWith?: string[]`, `draw.kind` `"comparative-weighted"`; widen `UnseenPaper.qNo` to `1|2|3|4|5` and add `ComparativeQuestion` to `Question` (data-model §1). Fix compile errors in exhaustive switches by adding the `"comparative"` branch as a no-op or "not for this type" only. 008 green.
- [X] T004 [P] Skills (implemented with a safer layout than first planned: `lib/unseen/skills.json` stays the seven so 008's prompt, pilot script and tests are untouched): new `lib/comparative/skills.json` holds `compares-texts` and `treats-both-in-depth` (name, tip, description); `lib/unseen/skills.ts` keeps `SKILLS`, `SKILL_IDS`, `SkillId` (seven) and adds `COMPARATIVE_ONLY_SKILL_IDS`, `COMPARATIVE_SKILL_IDS` (nine), `ComparativeSkillId`, `COMPARATIVE_SKILLS`, `comparativeSkillConceptId` (`y12-english-advanced-comparative-texts.c-<id>` for the two, 008's ids for the seven), `comparativeSkillOfConcept`. Update tests that assert "seven skills" only where they read the shared list. 008 green (the 008 golden prompt/hash fixtures must not change).
- [X] T005 Refactor `lib/unseen/draw.ts` to a structural question type `{ id: string; concepts: string[] }` (no behaviour change); add a test in `tests/unseen/draw.test.ts` that `formOf = () => null` gives weight `10 × (2 + uncleared)` for new draws and the repeat formula. 008 green.
- [X] T006 Refactor `lib/unseen/marker.server.ts`: `UnseenMarkerInput` gains `texts: MarkerText[]` (single-text callers pass a one-item list built from `text`), `markWithModel(input, rubric = unseenRubric)` takes the rubric, prompt-building renders every text with its heading and form; the single-text prompt must stay **byte-identical** (golden prompt test in `tests/unseen/` unchanged). Add tests for a two-text prompt (both stimuli in tab order; a visual sent as its description). 008 green.
- [X] T007 Refactor `parseUnseenReply(raw, maxMarks, skillIds)` in `lib/unseen/marker.server.ts` to take the skill list (default the seven); a missing or non-boolean verdict for any listed skill is malformed and retried; repair rules and `reply_filled` unchanged. Tests in `tests/unseen/marker-parse.test.ts` for nine verdicts, a missing `compares-texts`, and the unchanged seven. 008 green.
- [X] T008 Refactor `lib/unseen/grade-handler.server.ts` into a shared core `gradeUnseenLike(config)` that both units call (word rules, DB-degraded 503, phase checks, rate limits, `reserveAiSlot`/`refundAiSlot`, insert/finalise, result fields from the first try's `conceptOutcomes`); the unseen entry is a thin wrapper. No behaviour change. Add one structured log line per marked try with the time from submit to reply (no answer text, no identity) so SC-003 (95% within 1 minute) can be read from real use, not only the pilot's p95. 008 green (`tests/api/attempts-unseen.test.ts` etc.).
- [X] T009 Refactor `lib/unseen/start.server.ts` into `startDraw(config)` (question list, weights, state loader, unit id) with `startUnseen` calling it. No behaviour change. 008 green.
- [X] T010 Shared text store (research R2): `scripts/unseen-build-bank-lib.ts`/`unseen-build-bank.ts` write `content/units/y12-english-advanced-unseen-texts/store-texts.ts` (every text of every bank file, both units) and make 008's `texts.ts` a filter returning the store texts 008's questions use; `lib/unseen/images.server.ts` looks visuals up in the store; `content/index.ts` keeps assigning `Unit.texts` from the filters. Test in `tests/unseen/build-bank.test.ts`: 008's `questions.ts`, `keys.ts`, `answers.ts`, `descriptions.ts` are byte-identical and `texts.ts` returns the same texts as before; `tests/` image-route test still passes. 008 green.
- [X] T011 Migration (research R10, data-model §3): in `lib/db/schema.ts` add `unseen_phases.picked_text_ids`, `rewrite_drafts.picked_text_ids`, widen `unseen_phases_max` to 1–8, add `unseen_phases_pick_shape`, add `attempts_comparative_incomplete_unique`, widen `SkillVerdicts` to nine skills; generate `drizzle/0008_*.sql` with drizzle-kit; extend `tests/db/` PGlite schema test (max 8 accepted, 9 rejected; pick shape; second index allows one open attempt per unit per user and rejects two in this unit). 008 green.
- [X] T012 [P] Queries: `lib/db/queries/rewrite-drafts.server.ts` gains `savePick`/read of `picked_text_ids` (scoped to the user, creates the row, never touches the draft text); `lib/db/queries/unseen-phases.server.ts` inserts and reads `pickedTextIds` with the try-1 row. Tests in `tests/db/` (round trip, scoped to user, pick survives a draft clear). 008 green.
- [X] T013 Shared progress (inert until T014 sets `sharesProgressWith` on both units) (research R8): add `sharedConceptProgress(unit, resultsByUnit)` to `lib/concepts/progress.ts`; add `loadConceptProgress(db, userId, unit)` (reads the unit's and each `sharesProgressWith` unit's results) and switch every call site to it: `lib/db/queries/concepts.server.ts`, `lib/concepts/weighting.server.ts`, `app/api/units/[unitId]/concepts/status/route.ts`, `…/ensure/route.ts`, `lib/unseen/start.server.ts`, `lib/db/queries/unseen-progress.server.ts`; make `conceptReviewCounts` merge for sharing units. Set `sharesProgressWith: ["y12-english-advanced-comparative-texts"]` in 008's `meta.ts` **only in T016** (so this task is inert until the unit exists). Tests in `tests/concepts/progress.test.ts`: no sharing ⇒ identical to today; a miss in one unit sets 2 in both; two shows in any mix clear both; comparison-skill outcomes appear only from the comparative unit; each unit lists only its own concepts. 008 green.
- [X] T014 Unit scaffold with no questions: create `content/units/y12-english-advanced-comparative-texts/` (`meta.ts` with `draw: { kind: "comparative-weighted" }`, `sharesProgressWith`, guide text; `concepts.ts` with the seven shared concept ids (008's) and the two own, `clearAfter: 2`, descriptions and tips read from `skills.json`; `texts.ts` filter; empty generated `questions.ts`, `keys.ts`, `answers.ts`); register in `content/index.ts` and `content/answers/index.ts`; set `sharesProgressWith` in 008's `meta.ts` (T013's switch is now live). 008 green.
- [X] T015 [P] Validation: add `validateComparativeRules` to `lib/content-rules.ts` (research R12 list: nine skill concepts with shared ids resolving in 008's unit, `textIds` resolve, fixed-pair and choice invariants, `pairing`, marks 3–8, 1–3 tags from the nine, verb in the comparative prompt, outcome, key complete, `reviewedOn` when drafted, adequate visual descriptions with matching hash for every visual in `textIds`, source string, `qNo` 1–5, 40-character leak rule including pairing labels); take the rubric as a parameter so verbs come from the unit's prompt; call it from `scripts/validate-content.ts` with the comparative skip lists beside the unseen ones. Tests in `tests/unseen/content-rules-comparative.test.ts` (one passing fixture and one failing case per rule). 008 green; `npm run validate` passes with the empty unit. 008's own `maxMarks` cap stays 1–6 and is not changed here; this unit's rule is 3–8 (T058 revisits 008's cap if one of the six moved single-text Q5s is worth more than 6 marks).
- [X] T016 Hidden until released: verify (and if needed add, with a test in `tests/pages/`) that the home page and `app/unit/[unitId]/page.tsx` do not offer a unit with zero questions a Start button or card; with the bank held back the new unit must not appear, and a direct visit to `/unit/y12-english-advanced-comparative-texts` or its quiz route answers 404 while it has no questions. First grep `content/index.ts`, `app/page.tsx`, `app/unit/[unitId]/page.tsx` and `lib/` for where units are listed and routed, and list the places changed in the task's notes. 008 green.

**Checkpoint**: 008 green, the new unit exists but is not offered, the marker, draw, handler, start and store are generalised.

## Phase 3: US5 Trust the marker on comparative answers (P1) — the release gate, first content-dependent step

**Goal**: the marker passes the comparative marker check before any content is released. **Independent test**: `python scripts/pilot-unseen-marker.py --unit comparative --gate` reports tuning, holdout and field separately and meets the bar.

- [X] T017 [US5] Write `lib/comparative/rubric.json` (server-only; `promptVersion: "comparative-pilot-1"`): 008's prompt with the nine skills and their met/missed definitions (incl. "each text in turn then compares only at the end ⇒ missed", "one text analysed, the other mentioned ⇒ missed"), skill 1 widened to using the required texts, `compare` ("Show how things are similar or different.", NESA) and the `evaluate` reading of "most effectively", and the instructions that the model answer is an example of the standard for one pairing, an answer must not be marked down for a different allowed pairing, and the answer is judged against the supplied texts only. The marker gets no information about the pairing except the model answer's text (no text ids or labels of the pairing). Wire `markUnseen`'s comparative entry in `lib/grading.server.ts` to pass this rubric (`markComparative(questionId, answer, phase, pick)`: picked texts only, descriptions for visuals, cap at phase 2, `goFurther` as 008). Tests with `scripts/fake-openrouter.ts` in `tests/unseen/marker-comparative.test.ts`: an unpicked allowed text's wording and description never appear in the request; nine verdicts returned; a different-pairing pick still gets the full-mark verdicts the fake returns.
- [X] T018 [P] [US5] Extend `scripts/pilot-unseen-marker.py` with `--unit comparative` (default `unseen`, so every 008 invocation and fixture is unchanged): reads `lib/comparative/rubric.json`, `resources/english-unseen/pilot-comparative.json`, the nine skills; builds the multi-text messages exactly as `marker.server.ts` (T006); its own golden prompt and rubric-hash fixtures `tests/unseen/golden/comparative-*` written with `--write-golden`; reports tuning, holdout and field separately, skill catch for the two comparison skills, false docks on different-pairing full answers, and p95 latency. `--check` runs offline. Add `tests/unseen/pilot-comparative.test.ts` (golden prompt equals the TypeScript builder's output for a fixture question; the python and TypeScript parsers agree on nine verdicts).
- [X] T019 [US5] (36 tuning + 13 holdout answers on 7 questions, reviewed and frozen 2026-11-21) Author `resources/english-unseen/pilot-comparative.json` (gitignored): about 8 questions (5 fixed pair, 3 choice; poem+visual, prose+non-fiction, a 3-mark and an 8-mark), texts/criteria/notes/school sample answers verbatim, answers at each band (low, mid, high, full) anchored on school samples where they exist, for 4 questions an "each text in turn, one comparing sentence at the end" answer (expect `compares-texts` missed) and a "one text far deeper" answer (expect `treats-both-in-depth` missed), and for each choice question a full-standard answer on a different allowed pairing; each answer labelled with `expectMark` range, `expectMissed`, `set` and source (school sample or authored). Freeze the holdout (St George Girls 2025 Q5, Cheltenham Girls 2023 Q1, several bands each) and note in the file that it is never tuned to. Run `--unit comparative --check`.
- [X] T020 [US5] **STOP for user review**: give the user the labelled answers and labels (a list file in `resources/english-unseen/review/pilot-comparative-labels.md`, one line each with the label and its source). Do not run the gate until they approve or correct.
- [X] T021 [US5] Run tuning (`--unit comparative --set tuning --runs 3`); iterate on `lib/comparative/rubric.json` (bump `promptVersion` each change, regenerate golden fixtures, rerun **every** case after every change, never read holdout detail to tune); then run holdout once per prompt version. Pass bar: ≥ 90% tuning and ≥ 80% holdout majority marks in range, none more than 1 away, every labelled comparison miss caught, no false docks on different-pairing answers, p95 under the first-call timeout. Save the report path.
- [X] T022 [US5] If the bar cannot be met with `ENGLISH_ADV_GRADING_MODEL` but a stronger model passes: add `COMPARATIVE_GRADING_MODEL` to `lib/config.server.ts` (never falling back to `GRADING_MODEL`), `.env.example`, the README env table and `lib/grading.server.ts`, write a constitution patch (2.16.1) naming it, and rerun T021. Otherwise record "same model passes" in `specs/009-english-comparative-short-answers/research.md` R7 as a dated note. Also set `MAX_TOKENS` from the pilot's longest reply (+25%, never above twice 008's current value) in `lib/unseen/marker.server.ts` and raise `FIRST_CALL_TIMEOUT_MS` only if p95 needs it (research R6); 008 green.
- [X] T023 [US5] Gate decision: write the result (versions, set results, model, p95) into `quickstart.md` §2 as the last gate run. **No question may be given `reviewedOn` until this task is done and the gate passed.**

**Checkpoint**: the gate has passed. Stories below can be built in parallel with the content track (Phase 11).

## Phase 4: US1 Read two texts, choose if I may, write one comparison, get marked (P1) 🎯 MVP

**Independent test**: with a fixed pair and a choice question in a test bank, open the quiz, switch tabs, pick, write ≥ 20 words, submit and get a mark with nine verdicts.

### Tests (write first, see them fail)

- [X] T024 [P] [US1] `tests/api/comparative-pick.test.ts` (PGlite): pick saved to the draft row; idempotent; `invalid_pick` for incomplete, outside `from`, duplicates, wrong count, fixed pair; `invalid_attempt_token`; 404 for another user's attempt; `pick_locked` after the first try; scoped to the user; 503 when the database is unreadable.
- [X] T025 [P] [US1] `tests/api/attempts-comparative.test.ts`: first-try grading with `scripts/fake-openrouter.ts`: nine verdicts, mark, `pick` stored in `unseen_phases.picked_text_ids` with the try; `invalid_pick` on incomplete/disallowed pick and a pick on a fixed pair; marker given only picked texts (assert the fake received no unpicked text); word rules (< 20, > 120% of suggested); marker failure ⇒ `notMarked` with no mark, no self-mark, slot refunded; daily cap ⇒ `daily_limit`; database degraded ⇒ 503; result row stores per-skill `conceptOutcomes` from the first try.
- [X] T026 [P] [US1] `tests/client/comparative-tabs.test.tsx`: tabs exactly the question's texts (fixed pair; choice shows fixed + every allowed), `role=tablist/tab/tabpanel`, `aria-selected`, arrow/Home/End keys, all panels mounted (inactive `hidden`), switching tabs never changes or clears the answer box, selected state not colour only.
- [X] T027 [P] [US1] `tests/client/comparative-pick.test.tsx`: chips per allowed text, `aria-pressed`, Submit disabled with a note until complete, typing allowed before picking, changing the pick keeps the answer text, pick saved on change (debounced) and sent by beacon on hide, restored on resume, 44 px targets.
- [X] T028 [P] [US1] `tests/pages/attempt-comparative.test.tsx`: page renders resume for write/choice/retry/discussion states, restores pick and drafts, and carries no key field before the discussion.

### Implementation

- [X] T029 [US1] `lib/comparative/types.ts` (`ComparativeState`, `TryView9`, discussion type per data-model §7) and `lib/comparative/views.ts` (question and text payload builders: public fields only; `pick` returned only if still valid).
- [X] T030 [US1] `lib/comparative/state.server.ts`: `loadComparativeState` from the phase row, draft row and open attempt (stage, drafts, pick from the phase row else the draft row, `pickLocked`, `dailyLimit`, `repeating`); unreadable database ⇒ `unavailable`, never a guess.
- [X] T031 [US1] `lib/comparative/pick.server.ts`: `validatePick(question, pick)`, `picked(question, pick)` and `savePick`; `app/api/comparative/pick/route.ts` per contracts/api.md (session, attempt token, rate limit, no key material in any response).
- [X] T032 [US1] `lib/comparative/grade.server.ts`: the comparative entry of the T008 core: pick checks (`invalid_pick`, `pick_changed`), store the pick with the try-1 insert in one write, call `markComparative`, result as contracts/api.md; route `app/api/grade/route.ts` to it for `question.type === "comparative"`.
- [X] T033 [US1] `lib/comparative/start.server.ts` (`startComparative` via `startDraw`, flattened form weight, shared progress) and branch `app/api/attempts/route.ts` for the comparative unit (response with `comparativeState`, `texts`, `201`/`200`/finished/503 as contracts).
- [X] T034 [P] [US1] `components/unseen/TextTabs.tsx` (research R4: WAI-ARIA tabs, roving tabindex, all panels mounted, one `TextPanel` per text, picked badge in text) and `components/unseen/PickChips.tsx` (research R5); styles in `app/globals.css` using tokens only (phone 390 px: tab strip scrolls inside itself, 44 px targets).
- [X] T035 [US1] `components/unseen/ComparativePanel.tsx` composing `TextTabs`, 008's `Writing` (box, meter, marking states, result with nine verdicts) and `PickChips`; wire into `components/Quiz.tsx` for `payload.comparativeState` (pass `uid`), the `AttemptHistory`/results shape, and `app/attempts/[attemptId]/page.tsx` resume. Make T024–T028 pass; 008 green.

**Checkpoint**: US1 works end to end on test content.

## Phase 5: US2 Put each text in its own window and highlight it (P1)

**Independent test**: open a fixed-pair quiz, open both texts in their own tabs, highlight in each direction.

- [X] T036 [P] [US2] `tests/pages/unseen-text-page-cross-unit.test.ts`: access counts an attempt in either unit; both texts of a fixed pair; every allowed text of a choice question picked or not; text only in 009 opened via this unit's link; text only in 008's bank opened via 009's link when 009 shows it; no attempt ⇒ the same 404 for unknown unit, unknown text, text not in that unit; signed-out redirect; DB down ⇒ notice; `?attempt=` from either unit turns highlighting on, a foreign or wrong-text attempt turns it off; page imports no key module.
- [X] T037 [P] [US2] Extend `tests/client/text-highlight.test.tsx`: two texts of one question keep separate highlights (keys per user, attempt, text); a text highlighted in a 008 attempt starts clean in a 009 attempt; BroadcastChannel sync between the quiz panel and the text page per text; no highlighter on an image-only text; each tab's open icon links to `/unit/y12-english-advanced-comparative-texts/text/<text>?attempt=<id>` for that text only.
- [X] T038 [US2] Refactor text access (research R3): change `hasStartedText(db, userId, textId)` and `attemptUsesText(db, userId, attemptId, textId)` in `lib/db/queries/unseen-progress.server.ts` to collect, across every unit whose `texts` include the id, the question ids that show it (`q.textId === id` or `q.textIds.includes(id)`), and query attempts in those units; update `app/unit/[unitId]/text/[textId]/page.tsx` (and its `generateMetadata`) to the new signatures. 008's page tests unchanged and green, T036 passes. 008 green.
- [X] T039 [US2] Confirm each text's `TextPanel` inside `TextTabs` gets its own `openHref` and `highlight={{userId, attemptId, final}}` (final from stage); `tests` T037 pass; the image route serves visuals from the store (T010) to both units (extend `tests/api/unseen-image.test.ts` with a visual only 009 shows).

## Phase 6: US3 Fix it once with tips, then see the model answer (P1)

**Independent test**: submit below full on a choice question, retry, check the cap, the recorded mark, the unchanged pick and the discussion pairing line.

- [X] T040 [P] [US3] `tests/api/comparative-retry.test.ts`: full-mark first try ⇒ discussion with model answer; below full ⇒ `retryOffered`; retry capped at max − 1, recorded mark the higher, no third try, one-mark path (retry not offered), `pick_changed` 409 on a different pick and accepted identical pick, marker receives the same picked texts, decline records the first try's mark with `declined`, marker failure and daily limit on the retry (answer kept, Submit gated, offered first on return), double submit ⇒ `already_answered`.
- [X] T041 [P] [US3] `tests/client/comparative-retry.test.tsx`: tip card per skill missed (from `skills.json`), read-only pick chips on the retry, retry box starts from the first try, discussion shows the one-pairing sentence and pairing labels for a choice question and nothing for a fixed pair, result summary takes focus, live status region announces marking.
- [X] T042 [US3] `lib/grading.server.ts`: `comparativeDiscussion(questionId)` returns model answer, word count and (choice only) `pairing`; only called when the phase row is final. Generalise `app/api/unseen/decline/route.ts` and `lib/unseen/decline-handler.server.ts` to comparative questions; extend retry handling in `lib/comparative/grade.server.ts` (phase 2 uses the stored pick).
- [X] T043 [US3] UI: retry stage and discussion in `ComparativePanel` (read-only chips, "This model answer shows one possible pairing (…). Any allowed pairing can earn full marks." for choice), generalise `components/unseen/AttemptDetail.tsx`, `Results.tsx` and `components/AttemptHistory.tsx` to nine skills, the pick and the source name; discussion data only through `loadComparativeState`; the attempt detail names the pick (assert in the tests). T040–T041 pass; 008 green.

## Phase 7: US4 Learn what I missed, including comparing (P1)

**Independent test**: miss "Compares the texts", see it in "Things I need to know", clear it after two first tries; clear a shared skill in 008 and see it cleared here.

- [X] T044 [P] [US4] `tests/unseen/shared-skills-integration.test.ts` (PGlite): real results from both units through `loadConceptProgress` and the unit pages' loaders: a miss in 008 shows in 009's list and the reverse; two shows in any mix clear both; a retry that fixes a skill does not stop the miss counting; comparison skills only from 009; the home "to review" counts follow.
- [X] T045 [US4] Ensure the first-try `conceptOutcomes` of a comparative result carry all nine skills (T032) and that `components/unseen/UnitProgress.tsx`/`ConceptPanel` show the two new skills with their tips (copy written in `lib/unseen/skills.json`, one sentence each in 008's tip voice); extend tests/client for the two tips. T044 passes; 008 green.

## Phase 8: US6 Keep getting questions that target my weak spots (P2)

- [X] T046 [P] [US6] `tests/unseen/draw-comparative.test.ts` (pure, injected random): unanswered only until all answered; weight `10 × (2 + uncleared)`; no form weight; repeats use mark and age weights; never one of the last 3 (small-bank rule); pending question offered first at pick, retry choice and retry.
- [X] T047 [P] [US6] `tests/pages/unit-comparative.test.ts`: unit page shows "Your results" for Fixed pair and Choice (answered of total, average share of latest marks, "Not tried yet"), no text-form rows, "Things I need to know" and the start/resume button.
- [X] T048 [US6] `lib/db/queries/unseen-progress.server.ts`: add `loadComparativeProgress` (fixed/choice rows from the latest recorded marks; pending question); `components/unseen/UnitProgress.tsx` renders by `draw.kind`; `app/unit/[unitId]/page.tsx` selects the loader. T046–T047 pass; 008 green.

## Phase 9: US7 Revise the marker from an offline re-mark (P2)

- [X] T049 [P] [US7] Tests in `tests/unseen/remark-comparative.test.ts`: the re-mark samples first tries from every mark band of the comparative unit, uses `REMARK_MODEL`, never counts against a student's daily limit, and exports disagreements as field cases with no identity and with the pick and texts.
- [X] T050 [US7] Generalise `scripts/unseen-remark*.ts`, `scripts/unseen-field-cases.ts` and the pilot's `--set field` to the comparative unit (unit flag; field cases in `resources/english-unseen/field-comparative.json`); `--gate` reruns tuning, holdout and field separately. 008 green.

## Phase 10: Cross-cutting before content (privacy, key safety, accessibility)

- [X] T051 [P] Extend `tests/no-key-leak.test.ts` so its every-shipped-question loop covers both units, including a choice question's `pairing` before the discussion, the shared visual description, the text page and tabs importing no key module; extend `tests/unseen/no-key-leak-shipped.test.ts` to scan both units' keys in the built output.
- [X] T052 [P] `scripts/delete-student.ts` and its test: a comparative phase row (with pick) and a draft row (with pick) are removed with the student; retention job test covers the comparative unit's rows.
- [X] T053 [P] Accessibility and layout tests (`tests/client/comparative-a11y.test.tsx`): focus and live regions, result summary takes focus, 44 px targets for tabs and chips, no colour-only state; manual 390 px check is in the ship gate.

## Phase 11: US8 A question bank from real trial papers (P1) — the content track

A separate content task run from [content-prompt.md](content-prompt.md); it can run **alongside the gate** (Phases 3–4), but **release (T064) waits for T023**. Tooling tasks come first so the content task has something to write to.

- [X] T054 [US8] Inventory format (research R12): add `choice?: {fixed,from,pick}` and the `kept` decision for multi-text questions to the inventory reader in `scripts/unseen-report-lib.ts` and the validator of inventory files in its tests; the fixed skip-reason list gains nothing new; additive, 008's inventories still validate. Test in `tests/unseen/report.test.ts`.
- [X] T055 [US8] Generator pass for `resources/english-unseen/bank/comparative/*.json` in `scripts/unseen-build-bank-lib.ts`/`unseen-build-bank.ts`: write the comparative unit's `questions.ts`, `keys.ts`, `answers.ts` (visuals copied from the store descriptions and checks for every visual in `textIds`), the store and both filtered `texts.ts`; pending (drafted without `reviewedOn`) stays out unless `--include-pending`; with no comparative bank file 008's output is byte-identical. Tests in `tests/unseen/build-bank.test.ts`.
- [X] T056 [US8] Report: `scripts/unseen-report.ts`/`-lib.ts` add the comparative section (kept and skipped per paper with reasons, counts by mark value and by fixed pair / choice, rubric source, medians for 7 and 8 marks counted from this unit's papers). The report also lists any text in the store used by no question in either unit. `MEDIAN_WORDS` in `lib/unseen/limits.ts` gains 7 and 8 **only from the counted values**; `tests/unseen/limits.test.ts` updated; the report fails if a counted value differs from the table (as 008).
- [X] T057 [US8] `scripts/check-unseen-descriptions*.ts`: accept comparative question ids and visual ids from the store (limit runs to new ids); a visual that fails removes its question from the bank.
- [X] T058 [US8] Content Batch 0 (follow content-prompt.md, Batch 0): inventory Fort St 2023 and 2025, Roseville 2026 (OCR), North Sydney Boys 2024; relabel the six single-text Q5s `not_q1_to_q4` → `kept`; after inventorying the four papers, restate the multi-text question count (31 came from the first scan without them) and, if it differs, update spec.md SC-007 and US8 scenario 1, plan.md ("31") and the T059/T060 counts; edit 008's `spec.md` FR-040 (spec 009 FR-034) and widen 008's validator `qNo` to 1–5 in `lib/content-rules.ts` with a test. Do not build the six questions. Stop for review.
- [ ] T059 [US8] Content Batch 1 (the multi-text Question 5s: 22 found, 21 once the St George Girls 2025 Q5 holdout is excluded; the six single-text Q5s are not among the 21 and go to spec 008), per content-prompt.md steps 1–12, then **stop for the user's review**: report path and the "Comparative, Batch 1" section of `resources/english-unseen/review/ALL-REVIEW.md` with empty `[ ]` boxes. No `reviewedOn`.
- [ ] T060 [US8] Content Batch 2 (the 11 multi-text Questions 1–4, 9 once the Cheltenham Girls 2023 Q1 holdout and North Sydney Boys 2024 Q4 (missing booklet) are excluded, and the Batch 0 papers), same steps, stop for review.
- [ ] T061 [US8] Marker check of generated model answers (content-prompt step 10) using `lib/comparative/rubric.json` after the gate's final prompt version: any model answer that does not get full marks on the majority of 3 runs is revised and listed; rerun after any prompt change.

## Phase 12: Release and ship gate

- [ ] T062 Content-prompt follow-up: when the user has ticked questions in `ALL-REVIEW.md` **and T023 has passed**, set `key.reviewedOn` to today's UTC date for ticked drafted questions only (in the bank files), rebuild with `npm run unseen-build-bank`, and run `npm run unseen-report`, `npm run validate`, `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`. Report the question count and anything left out. Do not commit unless asked.
- [X] T063 [P] Docs: `README.md` unit row for the comparative unit (and 008's note about shared texts and progress), env table unchanged unless T022 added a variable, `.env.example` likewise; `specs/008-english-unseen-short-answers/spec.md` FR-040 edit is T058; update the data-model/contracts notes if implementation differed.
- [ ] T064 Ship gate: run T002's full chain again (validate, tsc, lint, `npm test`, build), confirm no key text in `.next/static` for both units, rerun the marker gate (`--gate`: tuning, holdout and field separately), and do the quickstart §3 manual check at 390 px (the user does the phone check). If all pass, tick this task and give the user the commit message `spec 009: ship gate`. Do not push unless asked.

## Dependencies and order

- T001 → T002 → Phase 2 (T003–T016, mostly sequential because each live-code refactor must end 008 green; [P] tasks T003, T004, T012, T015 touch separate files) → Phase 3 gate (T017–T023) → stories.
- Phase 3 needs T004 (skills), T006–T007 (marker/parser), T010 (store for the pilot's texts) and the pilot data; **the content track (Phase 11) starts after T010 and T015 and can run beside Phase 3**, but T061 needs T021's final prompt and T062 needs T023.
- US1 (T024–T035) needs Phase 2 and T017 (`markComparative`); US2 needs US1's panel (T035); US3 needs US1; US4 needs T013 and US1's grading; US6 needs T033; US7 needs a stored first try (T032) and T018.
- Phase 10 can start once US1 exists; T051 must pass before T062.

## Parallel examples

```text
After T002:          T003 types  ‖  T004 skills  ‖  (then T005 → T006 → T007 → T008 → T009 → T010 → T011 in order, 008 green each)
After T011:          T012 queries ‖ T015 validation
Gate and stories:    T018 pilot script ‖ T019 pilot data ‖ T024–T028 US1 tests (write first)
Stories after US1:   T036–T037 (US2 tests) ‖ T040–T041 (US3 tests) ‖ T044 (US4) ‖ T046–T047 (US6)
Content track:       T054 → T055 → T056 → T057 → T058 → T059 → T060 (beside the gate); T061 after T021
```

## Implementation strategy

1. **Amend, baseline, generalise** (T001–T016): nothing student-visible; 008 stays green after every refactor, which is the safety net for reuse over copy.
2. **Gate first** (T017–T023): the marker is the biggest risk and a failure changes the prompt or model, so find out before building UI polish or content.
3. **MVP = US1** (T024–T035) on test content, then US2–US4 (the P1 stories), then P2 (US6, US7).
4. **Content** runs as its own task from `content-prompt.md`, reviewed by the user batch by batch; **release only after the gate and the user's ticks** (T062), then the ship gate (T064), before 7 Dec 2026.
5. Never commit, push, set `reviewedOn` or tick review boxes unless the user asks.

## Notes

- Task counts: Setup 2, Foundation 14, US5 gate 7, US1 12, US2 4, US3 4, US4 2, US6 3, US7 2, Cross-cutting 3, US8 content 8, Release 3 (64 tasks).
- Constitution first (T001), then no code that needs the amendment's wording before it merges.
- If the gate forces `COMPARATIVE_GRADING_MODEL`, T022 adds it with its own constitution patch before T062.

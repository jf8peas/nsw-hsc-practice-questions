---
description: "Task list for spec 012: Case Study Facts: China and Nepal"
---

# Tasks: Case Study Facts: China and Nepal

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[quickstart.md](quickstart.md), [content-prompt.md](content-prompt.md). No `contracts/`.

**Deadlines**: content and fact check Sun 29 Nov; the maintainer reads on Mon 30 Nov; live by Monday evening.
Phases 1 to 6 are **Release 1**. Phases 7 and 8 are **Release 2**: do not start them before Tue 1 Dec.

**Tests**: requested (plan, Testing). Write each test first and see it fail.

## Rules for whoever runs these

- Shell: Git Bash only (see `CLAUDE.md`). Scratch files go in `.cline/` as `tmp-<purpose>.<ext>`.
- **Never commit.** Leave all changes uncommitted. No new dependency.
- Facts come only from `docs/y12-economics-case-study-facts-research.md` (the "fact file").
- Tasks marked **(MAINTAINER)** are the user's: an agent stops and asks, and does not tick them.
- **Two sessions may run at once.** The content session is started by pasting `content-prompt.md`; it owns
  `content/units/y12-economics-case-study-facts/`, `fact-check.md` and `marker-cases.json` (T002, T012–T017) and
  does not edit this file. Tick its tasks when it reports. The code session owns everything else and never writes
  those files.
- Story order is US4, US1, US2 (all P1; the checks come first because the content is verified with them), then US3.

## Format: `[ID] [P?] [Story] Description`

**[P]** = different files and no dependency on an unfinished task in the same phase.

---

## Phase 1: Setup

- [X] T001 In `lib/types.ts` add `drawUnseenFirst?: boolean` to `QuizConfig` (doc comment: each group takes a never-answered question while one exists, then the least recently answered; needs `groups`) and `factIds?: string[]` to `Answer` (comment: SERVER ONLY, fact-file IDs the question tests). Do not add Release 2 fields.
- [X] T002 [P] (content session, content-prompt step 1) Create `content/units/y12-economics-case-study-facts/meta.ts` (exactly data-model §2), `concepts.ts` (`defineConcepts` with the 11 rows of data-model §3; `export const retired: Record<string, string | null> = {};`) and `build.ts`: exports `U`, `SOURCE = "Original question — case study facts (checked Nov 2026)"` (U+2014 dash), `mc(n, group: "mc-china" | "mc-nepal", prompt, options: string[]): McQuestion` (id `${U}.m` + two digits, `options: shuffleBySeed(id, options)`, `maxMarks: 1`, `source: SOURCE`) and `sa(n, group: "sa-china" | "sa-nepal" | "sa-both", marks: 2 | 3, prompt): ShortQuestion` (id `${U}.s` + two digits). Copy the style of `content/units/y12-economics-global-economy/build.ts`.

---

## Phase 2: Foundational (blocks the checks and the draw tests)

- [X] T003 Write `tests/case-facts/fact-file.test.ts` for `parseFactFile`: a small inline file parses (ids, ★ flags, statement, when, source numbers, group keys such as `china-a`, source list); CRLF line endings give the same result; it throws on a fact row without six cells, a duplicate id, a row outside a lettered section, and a file with no facts; rows of other tables (practice exams, comparison) are ignored; the shipped fact file gives 57 facts, 36 ★, 11 groups, 31 sources, and C25 has no source number. Release 1, impact lines: the inline file has a `## Context and impact` section and the parser maps each ID to its line in `impact`; it throws, naming the ID, on a fact with no impact line, a second line for one ID, a line for an ID with no fact row, and a digit outside the ID; `text` omits that section; the shipped fact file gives 57 impact lines.
- [X] T004 Create `lib/case-facts/fact-file.ts` (plain module, no I/O): `parseFactFile(markdown): { facts: Map<string, Fact>; groups: string[]; sources: Set<string>; impact: Map<string, string>; text: string }` with `Fact = { id, star, statement, when, source, sourceNumbers: string[], group }`. Split on `/\r?\n/`. A heading starting `## China (` or `## Nepal (` sets the economy; any other `## ` heading clears economy and section; `### X. ` sets the section letter; group = `china-a` … `nepal-e`. A fact row matches `/^\|\s*([CN]\d{2})\s*\|/` and has six cells (ID, ★, Fact, When, Exams, Source); `sourceNumbers = source.match(/S\d+/g) ?? []`; sources are lines matching `/^- \*\*(S\d+)\*\*/`. Release 1, impact lines (research §7, data-model §9): inside `## Context and impact` only, each line matching `/^- \*\*([^*]+)\*\*\s*(.*)$/` goes into `impact` by ID; throw an `Error` naming the ID for a repeated ID, an ID with no fact row, any digit in the text after the ID, or (after parsing) a fact with no non-empty line. `text` is the file with that whole section removed. Make T003 pass.
- [X] T005 [P] Create `tests/helpers/case-facts-fixtures.ts`: `buildCaseFactsFixture(id = "fx-facts")` returns `{ unit, answers, factMarkdown }`, all invented. The unit has the quiz block of data-model §2, `explanationsComplete: true`, concepts `${id}.c-<slug>` for the 11 slugs of data-model §3 (descriptions without digits), `retired: {}`, and 8 questions in each of `mc-china`, `mc-nepal`, `sa-china`, `sa-nepal`, `sa-both`, each tagged, sourced with the FR-014 string, MC with four options, short answers of 2 or 3 marks. Answers pass every rule in research §7 (correct text, rubric length = marks, notes, `factIds`, three wrong-option explanations ending `(Source S1).`). `factMarkdown` has the same table and heading layout as the fact file, with all 11 lettered sections, some ★ rows all used, China pools using only `C` ids, Nepal pools only `N` ids, and no fact used more than 3 times. `factMarkdown` also has a `## Context and impact` section with one invented, digit-free line per fact (Release 1).

**Checkpoint**: parser tests pass.

---

## Phase 3: User Story 4 - Trust every figure (P1)

**Goal**: the build stops on a coverage or traceability fault, and every figure can be traced.

**Independent test**: `npx vitest run tests/case-facts` passes on the fixture and fails each broken variant with a message naming the problem.

- [X] T006 [US4] Write `tests/case-facts/content-rules.test.ts`: `validateCaseFactRules` returns `[]` for the fixture; then, changing one thing per test, an error naming the fact, question or group for: a ★ fact in no key; an unknown fact ID; a key with no `factIds`; a duplicated fact ID in one key; a fact group with no question; a fact used by 4 questions; a pool of 7; a changed quiz group list or missing `drawUnseenFirst`; a wrong source string; `explanationsComplete` unset; a missing wrong-option explanation (assert through `validateExplanationRules`); three MC options; an explanation citing no source of its facts; a short answer worth 4 marks; empty notes; an empty model answer; rubric length different from marks; a `correctText` not among the options; an `N` fact in a China pool; an untagged question; a concept whose group matches none of the question's facts; a missing or extra concept; a digit in a concept description; a fact ID inside a prompt or note. Add one case: a question whose facts have no source number accepts "secondary source".
- [X] T007 [US4] Create `lib/content-rules-case-facts.ts` (plain module, no I/O, no `server-only`): export `CASE_FACTS_UNIT_ID = "y12-economics-case-study-facts"`, `CASE_FACTS_FILE = "docs/y12-economics-case-study-facts-research.md"`, `CASE_FACTS_SOURCE`, `FACT_GROUP_CONCEPT` (`china-a` → `china-opening-up` … `nepal-e` → `nepal-tourism-electricity`, per data-model §3) and `validateCaseFactRules(unit: Unit, answers: AnswerSet, factFile): string[]` implementing every rule in research §7 plus T006's key-shape rules. Concept ids are `${unit.id}.c-<slug>`. "Student-visible text" is prompt, options, correct text, model answer, rubric, notes and explanations; a fact ID there is `/\b[CN]\d{2}\b/`. Each message starts with the unit, question or fact id. The FR-028 impact-line rules are not repeated here: `parseFactFile` (T004) enforces them. Make T006 pass.
- [X] T008 [P] [US4] Write `tests/case-facts/trace.test.ts` for `traceUnit` on small inline cases: thousands commas; `FY2025/26` and `1995-96` periods; `11 Dec 2001` dates (a wrong day is untraced; the bare year of a row date is OK); `36` equals `36.0`; digits in `CO2` and `S8` and "3 marks" ignored; "about 14,000" for 13,862 is `ROUNDED`; a value from another row in a model answer is `OTHER_ROW` and in a wrong option is `OK`; a value nowhere in the file is `UNTRACED`; bn against million warns; a short-answer prompt containing a value in its figure or period point warns; a fact shared by an MC and a short answer warns; a capitalised name absent from the file is listed. Release 1, impact lines are never a source: a number written only in the intro paragraph of `## Context and impact` is `UNTRACED` in a wrong option and in a model answer, and a name found only in an impact line is listed as absent.
- [X] T009 [US4] Create `lib/case-facts/trace.ts`: `traceUnit(unit, answers, factFile): { findings: Array<{ questionId, where, value, status: "OK" | "ROUNDED" | "OTHER_ROW" | "UNTRACED", factIds }>; warnings: string[] }` per research §8. Strict fields (correct option, model answer, rubric, notes): value must be in the question's own fact rows (`statement` + `when`). Loose fields (prompt, wrong options, explanations): anywhere in `factFile.text`, which excludes `## Context and impact` (Release 1); the name list uses the same text; never read `factFile.impact` for values or names. Normalise: remove thousands commas and a leading `FY`, treat `–` as `-` and `2025/26` = `2025-26`; remove `\d+[- ]marks?`; extract dates first, then `\d{4}[/-]\d{2}\b` periods, then numbers not preceded by a letter, digit or dot; compare numbers numerically; a row date also contributes its year. `ROUNDED` = fewer significant figures and within 5% of a row value. Make T008 pass.
- [X] T010 [US4] Create `scripts/check-case-facts.ts` and add `"case-facts:check": "tsx scripts/check-case-facts.ts"` to `package.json`. Dynamic-import the unit folder's `meta`, `questions`, `concepts`, `answers` (it need not be registered; exit 1 with a plain message if absent), read the fact file, run `validateConceptRules`, `validateExplanationRules`, `validateCaseFactRules` and `traceUnit`; print errors, every non-OK finding and warnings; replace only the text between `<!-- script:start -->` and `<!-- script:end -->` in `specs/012-economics-case-study-facts/fact-check.md` (create the file or append the markers if missing); exit 1 on any rule error or `UNTRACED`, or if `parseFactFile` throws (print its message, which names the fact ID). Add `scripts/check-case-facts.ts` to `OFFLINE_KEY_READERS` in `tests/no-key-leak.test.ts`.
- [X] T011 [US4] In `scripts/validate-content.ts`: accept `q.source === CASE_FACTS_SOURCE` only when `unit.id === CASE_FACTS_UNIT_ID` (research §2, option B); for that unit, read `CASE_FACTS_FILE`, push an error if it is missing or does not parse (include the parser's message: this is how the FR-028 impact-line rules stop the build, Release 1), else push `validateCaseFactRules` errors. Leave `SOURCE_RE` and other units unchanged. `npm run validate` still passes.

**Checkpoint**: `npm run case-facts:check` is ready for the content session. Tell the user.

---

## Phase 4: User Story 1 - Drill the facts in a short quiz (P1)

**Goal**: the unit with 41 questions is on the site, marked and explained, with no revision list.

**Independent test**: start one quiz locally and answer all five: shape, marking, explanation, source line; no "to review" pill.

- [X] T012 [US1] (content session, step 2) Write `content/units/y12-economics-case-study-facts/questions.ts`: slots m01–m16 and s01–s25 of data-model §4, following the prompt rules in `content-prompt.md`, with at least 4 multiple-choice questions testing significance (Release 1); end with `.map((q) => ({ ...q, concept: conceptOfQuestionId[q.id] }))`.
- [X] T013 [US1] (content session, step 3) Write `answers.ts` in that folder in the shapes of data-model §5, with `factIds`, rubrics, student-readable notes (each including the "only this figure" sentence, research §0 B); each short answer's significance point and model-answer sentence come from its facts' impact lines (or, where a line does not fit the question, another supported point recorded in `fact-check.md`, FR-019), and its notes also accept another supported point, never a restatement or the wrong direction (Release 1, research §11), ending `export const answers = withWrongExplanations(keys, questions, U, explanations);`.
- [X] T014 [US1] (content session, step 4) Write `explanations.ts` there: one entry per wrong option of m01–m16, stating the correct fact with figure and year, ending `(Source S<n>)` or "secondary source"; the fact's impact line may be added before the source, without any quantity or trend it states (Release 1).
- [X] T015 [P] [US1] (content session, step 5) Write `concept-tags.ts` there with `defineTags`, exactly one concept per question as in data-model §4.
- [X] T016 [P] [US1] (content session, step 6) Write `specs/012-economics-case-study-facts/marker-cases.json` with the nine cases of data-model §7.
- [X] T017 [US1] (content session, steps 7–9; needs T010) Write `specs/012-economics-case-study-facts/fact-check.md` (data-model §6, including a `Significance:` line for every short answer, Release 1), run `npm run case-facts:check` until it has no error and nothing `UNTRACED`, explain each remaining warning, do the hostile second pass, and report.
- [X] T018 [P] [US1] Create `scripts/case-facts-marker-check.ts` and add `"case-facts:marker-check": "tsx --conditions=react-server scripts/case-facts-marker-check.ts"` to `package.json`: `loadEnvConfig(process.cwd())`; exit 2 without `OPENROUTER_API_KEY`; print the model (`GRADING_MODEL` or `DEFAULT_MODEL` from `lib/openrouter.server.ts`); read `marker-cases.json`; for each case call `gradeAnswer(questionId, answer)` from `lib/grading.server.ts` three times; a null result (unknown question) or `needsSelfMark` is an error; print case, expected, marks per run, and feedback for mismatches; exit 1 unless every run matches. Import nothing from `content/answers`.
- [X] T019 [P] [US1] Add to `tests/concepts/review-counts.test.ts`: a unit with tagged questions and concepts but no `conceptsReady` gets no count after a wrong answer (research §0 A).
- [X] T020 [US1] In `lib/concepts/progress.ts`, `conceptReviewCounts` skips units without `conceptsReady`; correct the function's comment. T019 and the existing concept tests pass.
- [X] T021 [US1] (needs T011–T015) Register the unit in `content/index.ts` (`{ ...meta, questions, concepts, retired }`, placed with the other Y12 Economics units) and spread its answers in `content/answers/index.ts`. `npm run validate` passes with 15 units. Do not run `validate:shipped`.
- [X] T022 [US1] In `tests/no-key-leak.test.ts`: add `factIds` and `conceptNote` to `BANNED_KEYS`; add a `describe` for the case-facts unit asserting that `JSON.stringify` of the public unit and of a start response contain no `/\b[CN]\d{2}\b/` and, for all 40 keys, none of the model answer, rubric points, notes or explanations over 20 characters (first 60 characters, JSON-escaped); and that grading one MC and one short answer through `POST /api/grade` returns no `factIds` or `conceptNote` key. All tests in the file pass.

**Checkpoint**: one local quiz works end to end.

---

## Phase 5: User Story 2 - Eight attempts with no repeated question (P1)

**Goal**: 8 attempts, 40 different questions, always one per group; no other unit changes.

**Independent test**: `npx vitest run tests/attempts tests/api/attempts-case-facts.test.ts`.

- [X] T023 [US2] **Before editing the draw**: write `.cline/tmp-draw-baseline.ts` that, for every unit in `UNITS` and seeds 1–50 (the `seeded` generator in `tests/attempts/draw.test.ts`), records `drawAttempt(unit, seeded(s))` to `.cline/tmp-draw-baseline.json`; run it with `npx tsx --conditions=react-server .cline/tmp-draw-baseline.ts`.
- [X] T024 [P] [US2] Write `tests/attempts/draw-unseen-first.test.ts` using the fixture: five ids in group order for many seeds; simulating 8 attempts (adding each drawn id to `history.lastAnswered` with increasing dates) gives 40 different ids, attempt 9 draws attempt 1's set and attempt 10 attempt 2's; with 7 of 8 seen in each pool the unseen one is drawn; without history the shape holds and draws vary; with `conceptsReady: true` and a `Weighting` passed the shape holds with and without history; for every real unit except `y12-economics-case-study-facts`, `quiz.drawUnseenFirst` is unset and a draw with a history equals the draw without one (seeds 1–25).
- [X] T025 [P] [US2] Write `tests/api/attempts-case-facts.test.ts` (PGlite, `fixtureContent([fixture.unit], fixture.answers)`, `seedResultAt`): response keys are the usual ones and five questions in group order; 8 attempts with a result per drawn question give 40 different, then attempt 9 repeats attempt 1's set; two attempts answered through `POST /api/grade` (with `setupRouteEnv`) do not overlap; drawn but unanswered questions are drawn again when they are the only unseen ones; another student's results have no effect; database down gives 201, five in order, `persisted: false`; only `listUnitResultsForProgress` throwing `DbUnavailableError` gives 201, five in order, `persisted: true`.
- [X] T026 [US2] In `lib/attempts/draw.server.ts` add `export interface DrawHistory { lastAnswered: ReadonlyMap<string, Date> }`, `drawUnseenFirst` as in research §3, and a fourth parameter `history?: DrawHistory` to `drawAttempt`: use it when `unit.quiz.drawUnseenFirst && unit.quiz.groups && history`; never call `drawWeighted` for a unit with `drawUnseenFirst`; all other paths unchanged. T024 passes.
- [X] T027 [US2] In `app/api/attempts/route.ts`, before the draw: for `session.kind === "user" && unit.quiz?.drawUnseenFirst`, `dbCall` `listUnitResultsForProgress(db, user.id, unit.id)` and build `lastAnswered` from the rows (answer order, last wins); on any error leave `history` undefined; pass it to `drawAttempt`. No request or response change. T025 passes.
- [X] T028 [US2] Re-run `.cline/tmp-draw-baseline.ts` writing to a second file, confirm every unit in the baseline is identical, then delete both JSON files and the script. Report the comparison.

**Checkpoint**: Release 1 code is complete.

---

## Phase 6: Release 1 gate

- [X] T029 [P] In `README.md` add the `y12-economics-case-study-facts` row to the Units table (Topic 1, 41 original questions, five pools (9 in SA both, 8 in the others), unseen-first draw, source: `docs/y12-economics-case-study-facts-research.md`; commands `case-facts:check` and `case-facts:marker-check`) and one sentence on `quiz.drawUnseenFirst` under "Content structure".
- [X] T030 Run `npm run case-facts:check`, then `npm run validate && npx tsc --noEmit && npm run lint && npm test && npm run build`; fix failures.
- [ ] T031 **(MAINTAINER)** Monday early: run the marker sample (quickstart §2) with the production `GRADING_MODEL`. 9 of 9 on three runs.
- [ ] T032 **(MAINTAINER)** Read all 48 questions, keys, explanations and notes against the checklist (quickstart §3); tick each in `fact-check.md`; list findings.
- [ ] T033 Fix every marker and read-through finding in `content/units/y12-economics-case-study-facts/` (and `marker-cases.json` if a question's wording changed); record changes in `fact-check.md`; rerun `case-facts:check`, and ask the maintainer to rerun the marker sample if a short answer or note changed.
- [ ] T034 After the maintainer confirms the findings are closed: `npm run validate:shipped` (adds 48 question ids and 13 concept ids to `content/shipped-ids.json`), rerun the full chain of T030, delete any scratch file this feature's tasks left in `.cline/`, naming each file (never by a `tmp-*` wildcard: the folder holds files from other work), leave everything uncommitted and report.
- [ ] T035 **(MAINTAINER)** Commit, including the fact file (the Vercel build fails without it), and deploy; Preview first if set up (quickstart §4). Live by Monday evening.
- [ ] T036 **(MAINTAINER)** Phone check at 390 px as a fresh student (quickstart §5; steps 1–6 at minimum).

---

## Phase 6b: Fact-file revision (Release 1)

The fact file was revised on 28 Nov (67 facts, 44 ★, 13 groups, 40 sources). These tasks run after T030 and before
T031; T031 to T036 then cover all 48 questions. Counts in the completed tasks above are as they were at the time.

- [X] T052 [US4] Add `china-g` and `nepal-f` to `FACT_GROUP_CONCEPT` in `lib/content-rules-case-facts.ts`; update the pins in `tests/case-facts/fact-file.test.ts` (including the multi-source cells of C20, N28 and N31), the fixture in `tests/helpers/case-facts-fixtures.ts` and the affected rules and leak tests.
- [X] T053 [US1] Add the `china-hindrances` and `nepal-hindrances` concepts and their tags.
- [X] T054 [US1] Write m17, m18 and s26 to s30 (C32, C33, C34, C36, N27, N28, N31) with keys and explanations.
- [X] T055 [US1] Update s06, s07, s15, s16, s22 and the m05 explanation to the changed facts.
- [X] T056 Update `spec.md`, `data-model.md`, `research.md`, `plan.md`, `quickstart.md`, the meta description and the README row.
- [X] T057 [US4] Run `npm run case-facts:check`, update `fact-check.md`, then the full chain of T030.

---

## Phase 7: User Story 3 - See what to relearn (P2, Release 2, after Tue 1 Dec)

**Goal**: a missed question puts its concept under "Things I need to know" with a one-line note; quizzes favour it within its group.

**Independent test**: miss one question, see the concept and note, answer it correctly three times, and it clears.

- [ ] T037 [US3] In `lib/types.ts` add `conceptNote?: string` to `Answer` (SERVER ONLY) and `conceptContent?: "key-notes"` to `UnitMeta` (public); create `lib/concepts/ai-content.ts` exporting `hasAiConceptContent(unit)` = `conceptsReady && conceptContent !== "key-notes"`. Do not set either on any unit yet.
- [ ] T038 [US3] Extend `tests/attempts/draw-unseen-first.test.ts` and `tests/api/attempts-case-facts.test.ts` for FR-008: five-group shape with every concept missed; within a group unseen on a missed concept, then unseen, then seen on a missed concept (oldest first), then seen (oldest first); history read failing still starts.
- [ ] T039 [US3] Add `missed?: ReadonlySet<string>` to `DrawHistory` and sort by `(answered ? 2 : 0) + (missed.has(concept) ? 0 : 1)` then last answered (research §5) in `lib/attempts/draw.server.ts`; in `app/api/attempts/route.ts` build `missed` with `conceptProgress` from the same rows when `unit.conceptsReady`, and skip `loadWeighting` for units with `drawUnseenFirst`. T038 passes.
- [ ] T040 [P] [US3] Write `tests/concepts/ai-content-gates.test.ts` with a `conceptsReady`, `key-notes` fixture unit: ensure and status routes 404; `runConceptPipeline` returns `nothing_to_do` with no model call; `startTeacherRegeneration` returns `not_found`; `approveConcept` refuses; the teacher list omits it; the unit page loads no concept content and mounts no `ConceptLive`.
- [ ] T041 [US3] Apply the gate in `app/api/units/[unitId]/concepts/ensure/route.ts`, `.../status/route.ts`, `lib/concepts/pipeline.server.ts` (both checks), `lib/db/queries/concepts.server.ts` (`listConceptContentForTeacher`), `lib/concepts/approve.server.ts` and the content load in `app/unit/[unitId]/page.tsx`. T040 and existing concept tests pass.
- [ ] T042 [P] [US3] Write `tests/concepts/case-fact-notes.test.ts`: no note and "nothing to review" before any miss; after a miss the concept is listed with the note of the most recently missed question on it; the note stays after a later correct answer on that question until the concept clears; after three full-mark answers neither shows; another student's misses release nothing; no note text appears in start or grade responses or stored rows; a Release 1 style result (saved before the flag) counts.
- [ ] T043 [US3] Add `latestMissByConcept(unit, results)` (uncleared concepts only) to `lib/concepts/progress.ts`, `getConceptNotes(unitId, questionIdByConcept)` to `lib/grading.server.ts` (returns nothing unless the unit is `key-notes`), and `loadUnitConceptNotes(userId, unit)` to `lib/db/queries/concepts.server.ts`, scoped to the session user.
- [ ] T044 [US3] Pass the notes to `ConceptPanel`'s `details` prop in `app/unit/[unitId]/page.tsx`; in `components/ConceptPanel.tsx`, for `key-notes` units title the list "Things I need to know", with sub text "Facts you missed. A topic clears after 3 later full-mark answers on it, and your quizzes favour it until then." and empty text "All clear — nothing to review right now. Any fact you miss in a quiz will show up here." T042 passes.
- [ ] T045 [US3] In `lib/content-rules-case-facts.ts` require, when `conceptContent === "key-notes"`, a one-line `conceptNote` of at most 450 characters on every key, with no fact ID; trace notes as a strict field in `lib/case-facts/trace.ts`; add cases to `tests/case-facts/`.
- [ ] T046 [US3] (needs T045) Write 48 `conceptNote`s in the unit's `answers.ts` (each names the fact with the correct figure and year or period, from the fact file only, and may end with that fact's impact line, without any quantity or trend it states); add a Release 2 section to `fact-check.md`; `npm run case-facts:check` clean.
- [ ] T047 [P] [US3] Amend `.specify/memory/constitution.md` to 2.19.0 with the text drafted in research §1 (Principles I, III, VI, Quality Gates, Sync Impact Report, Last Amended).
- [ ] T048 [P] [US3] Extend `marker-cases.json` to every short answer, with each tolerance case that applies to it (rounded, year without day or month, one end only, wrong country, wrong direction, bare restatement) and expected marks.

---

## Phase 8: Release 2 gate

- [ ] T049 **(MAINTAINER)** Read the 48 notes; run `npm run case-facts:marker-check` on `marker-cases.json`; findings are fixed and rerun.
- [ ] T050 Set `conceptsReady: true` and `conceptContent: "key-notes"` in the unit's `meta.ts` (only with T039–T047 done: same deploy), update the README row, add `factIds`/`conceptNote` leak checks for the unit page to `tests/no-key-leak.test.ts`, run `validate:shipped` and the full chain; leave uncommitted.
- [ ] T051 **(MAINTAINER)** Commit, deploy, and run quickstart §6 on a phone.

---

## Dependencies

| Task | Needs first |
|---|---|
| T005 | T001 |
| T004 | T003 |
| T006, T008 | T004, T005 |
| T007 | T006 |
| T009 | T008 |
| T010 | T007, T009 |
| T011 | T007 |
| T012 | T002 |
| T013, T015 | T012 |
| T014 | T013 |
| T017 | T010, T012–T016 |
| T020 | T019 |
| T021 | T011–T015 |
| T022 | T021 |
| T024, T025 | T005 |
| T026 | T023, T024 |
| T027 | T025, T026 |
| T028 | T027 |
| T030 | Phases 3 to 5 |
| T031 → T032 → T033 → T034 → T035 → T036 | in that order, after T030 |
| T037 | Release 1 live |
| T038–T048 | T037; T039 after T038, T041 after T040, T043 → T044 after T042, T046 after T045 |
| T049 → T050 → T051 | Phase 7 |

- **US4** needs Foundational only. **US1** content needs nothing but T002; its final check (T017) needs US4, and
  registering (T021) needs T011. **US2** needs Foundational only, and T023 before any draw edit. **US3** needs
  Release 1.

## Parallel opportunities

- **Two sessions, from the start**: content (T002, T012–T017) beside code (T001, T003–T011, T018–T028).
- Phase 3: T008–T009 beside T006–T007; T011 beside T010.
- Phase 4 code: T018, T019–T020 any time, without waiting for content.
- Phase 5: T024 and T025 together.
- Phase 7: T040, T042, T047, T048 beside each other.

```bash
# Phase 5, tests first, together:
#   T024  tests/attempts/draw-unseen-first.test.ts
#   T025  tests/api/attempts-case-facts.test.ts
```

## Implementation strategy

**Release 1 (the smallest releasable set)** is US4 + US1 + US2 and the gate: all three are P1 and in the spec's
Release 1, so none ships alone.

| When | Do |
|---|---|
| Sat evening | Start the content session (T002, T012 on); code T001, T003–T011 |
| Sun daytime | T012–T016 content; code T018–T020, T023–T028 |
| Sun evening | T017, T021, T022, T029, T030 |
| Mon | T031–T034, then T035 by evening, T036 |
| After Tue | Phases 7 and 8 |

If time runs short, keep this order: content correct and read; validator rules; draw. Nothing ships unread, and a
bad question is rewritten, not dropped (a pool under 8 fails validation).

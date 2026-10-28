---

description: "Task list for Learn From Mistakes"
---

# Tasks: Learn From Mistakes

**Input**: Design documents from `/specs/002-learn-from-mistakes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (`api.md`, `llm.md`), quickstart.md

**Tests**: Included. Constitution 2.9.1 Quality Gates require automated tests for authorization and cost-control logic and make `npm test` a required gate; plan.md lists the required cases. Within each story, write the tests first and confirm they fail before implementing.

**Organization**: Tasks are grouped by user story so each can be implemented and tested on its own. Story labels map to spec.md: US1 Know which concepts I still need to learn, US2 Relearn from a clear explanation, US3 Weak concepts always visible, US4 Quizzes focus on what I got wrong, US5 Why each wrong option is wrong, US6 Teacher reviews and approves, US7 Students only see reviewed content. Phases follow dependency order inside the priority bands: P1 stories US1, US7, US2, US3 first (US7 builds the review pipeline that US2 and US3 present), then P2 (US4, US5), then P3 (US6).

**Open items**: none block implementation. The `@resvg/resvg-js` dependency is allowed by constitution Principle VIII (since 2.9.0), so T001 to T003 stand. The retired-question tombstones (research R3) are part of the spec (FR-006, FR-008), and the shipped-id snapshot (`content/shipped-ids.json`, T009, T011, T012, T013) is what makes a removed or renumbered id fail the build unless it is tombstoned.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: Which user story the task belongs to
- Every task names the file(s) it creates or changes

## Path Conventions

Single Next.js project at the repository root (`app/`, `components/`, `lib/`, `content/`, `scripts/`, `docs/`, `drizzle/`, `assets/`, `tests/`), per plan.md. Server-only modules end in `.server.ts` and start with `import "server-only"`. New pipeline code lives under `lib/concepts/`. Tests import server modules through the existing helpers in `tests/helpers/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The one new dependency, the bundled font, build config and npm scripts.

- [X] T001 Add the runtime dependency `@resvg/resvg-js` at the exact version `2.6.2` (no caret) to `package.json` and run `npm install`; confirm `package-lock.json` gains the platform packages and `npm run build` still works (allowed by constitution Principle VIII; research R7)
- [X] T002 [P] Add `assets/fonts/NotoSans-Regular.ttf` (Noto Sans Regular, SIL Open Font License) and `assets/fonts/OFL.txt` with the licence text; this is the only font the renderer will use
- [X] T003 [P] Edit `next.config.mjs`: add `serverExternalPackages: ["@resvg/resvg-js"]` and `outputFileTracingIncludes` mapping `/api/units/[unitId]/concepts/ensure` and `/api/admin/concepts/regenerate` to `["./assets/fonts/**"]` so the font ships with the functions that render pictures
- [X] T004 [P] Add npm scripts to `package.json`: `"concept:approve": "tsx --conditions=react-server scripts/approve-concept.ts"` `"fake-openrouter": "tsx scripts/fake-openrouter.ts"` and `"validate:shipped": "tsx scripts/validate-content.ts --update-shipped"`; leave every existing script unchanged

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, schema, config, the content rules and validator, the content registry helpers, the background-work wrapper and the test fixtures. No user story can start until this is done.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Edit `lib/types.ts`: add `export interface Concept { id: string; description: string }`; add `concept?: string` to `BaseQuestion`; add `conceptsReady?: boolean` and `explanationsComplete?: boolean` to `UnitMeta`; add `concepts?: Concept[]` and `retired?: Record<string, string | null>` to `Unit` (`null` = removed before the unit was tagged, so it counts toward no concept); add `wrongExplanations?: Record<string, string>` (keyed by option text) to `Answer`; document each field in a one-line comment, noting that `concept` is a tag and not an answer
- [X] T006 Edit `lib/db/schema.ts`: add `conceptSlots`, `conceptVersions` and `dailyConceptUsage` exactly as in `specs/002-learn-from-mistakes/data-model.md` (primary key `(concept_id, kind)` on slots; pointer columns `live_version_id` and `replacement_version_id` referencing `concept_versions.id` with `ON DELETE SET NULL`; lease, `retry_after`, `last_error` columns; every CHECK in the data model including the kind-shape, `approved` and `failed_review` rules; index on slots `(unit_id)` and versions `(concept_id, kind)`; `daily_concept_usage` primary key `sydney_date`); add `index("results_user_unit_created_idx").on(t.userId, t.unitId, t.createdAt, t.id)` to `results`; export the row types; none of the new tables may have a user id column (Principle II)
- [X] T007 Run `npm run db:generate` to create the next migration in `drizzle/`, then review the SQL by hand: the two pointer foreign keys, every CHECK, the primary keys and the new `results` index are present; hand-edit if Drizzle could not express a CHECK; commit the new `drizzle/*.sql` and `drizzle/meta/` changes (depends on T006)
- [X] T008 [P] Extend `tests/db/schema.test.ts`: the migration applies; the three new tables have exactly the columns in data-model.md and none is a user column; the kind-shape CHECKs reject a summary with an SVG and an illustration with bullets; `approved` without `approved_by` is rejected; `failed_review` without a reason is rejected; a slot cannot point its live and replacement at the same version; `daily_concept_usage.count` cannot go negative; deleting a user changes nothing in the concept tables (depends on T007)
- [X] T009 [P] Write `tests/content-rules.test.ts` (fails until T011): with small fixture units, a bad `concept` tag, a duplicate or un-prefixed concept id, an empty description, an untagged question in a `conceptsReady` unit, a `retired` key equal to a live question id, a tombstone pointing at an unknown concept, a `null` tombstone in a `conceptsReady` unit, an `explanationsComplete` MC question missing an explanation for one wrong option, an explanation keyed by the correct option, by a non-option, or empty, and an explanation on a short question each give one specific error message; a unit with neither marker produces no concept errors even if it has no `concepts.ts`; a `conceptsReady: true` unit with all questions tagged is clean; `validateShippedIds(snapshot, units)`: a snapshotted question id missing from its unit fails unless it is a key in that unit's `retired` map (in a unit that is not concept-ready, a `null` tombstone in a `concepts.ts` holding only `retired` is accepted), a renumbered question (old id gone, new id present) fails like any other removal unless its old id is tombstoned on purpose, a snapshotted concept id that disappears always fails, and ids that are new since the snapshot are allowed
- [X] T010 [P] Edit `lib/config.server.ts`: extend `AppConfig` with `conceptDailyCap` (`CONCEPT_DAILY_CAP`, default 100, `0` allowed and means generation off) and `conceptRateLimit` (`CONCEPT_RATE_LIMIT`, default 10, minimum 1); add `getConceptModels(env)` returning `{ generator: string; illustration: string | null; reviewer: string | null }` where `CONCEPT_MODEL` defaults to `deepseek/deepseek-chat` and `ILLUSTRATION_MODEL` and `REVIEW_MODEL` are `null` when unset or blank; nothing may throw at import time; extend `tests/config.test.ts` for the defaults, `0`, bad values and blank models
- [X] T011 Create `lib/content-rules.ts` (a plain module: no `server-only`, no I/O) exporting `validateConceptRules(unit)` and `validateExplanationRules(unit, answers)` that return `string[]` of error messages implementing exactly the rules in research.md R1 (only for units carrying the matching marker, plus the "any `concept` must be a concept of its own unit" and tombstone checks for every unit); each message starts with the unit or question id and `validateShippedIds(snapshot, units)` as described in T009 (depends on T005, makes T009 pass)
- [X] T012 Edit `scripts/validate-content.ts`: for every unit, dynamically import `../content/units/<id>/concepts` when the file exists (as it already does for `answers`), attach `concepts` and `retired` to the unit used by the checks, call `validateConceptRules` and `validateExplanationRules`, and add their messages to `errors`; the concept and explanation content rules apply only to units carrying the matching marker, while the tombstone and shipped-id checks apply to every unit; update the success line to also print how many units are concept-ready and explanations-complete; load `content/shipped-ids.json` (an object `{ questions: string[], concepts: string[] }`) and add the messages from `validateShippedIds`; fail with a clear message when a `concepts.ts` exists in a unit folder but the registry gave the unit no `concepts` (the file was never imported in `content/index.ts`); and support `--update-shipped`, which rewrites `content/shipped-ids.json` as the sorted union of the snapshot and every current question and concept id (it never removes an id) and exits 0 (depends on T011)
- [X] T013 Run `npm run validate:shipped` to create `content/shipped-ids.json` from the current units (every current question id; no concept ids yet), commit it, and confirm `npm run validate` passes with it (depends on T012)
- [X] T014 Edit `content/index.ts`: add `getConcept(conceptId): { unit: Unit; concept: Concept } | undefined`, `conceptsOf(unit): Concept[]` (empty when none) and `conceptOfQuestion(unit, questionId): string | undefined` (the question's `concept`, else the unit's `retired` tombstone; a `null` tombstone returns `undefined`, meaning no concept); keep `UNITS` unchanged for now (each unit's `concepts.ts` import is added in Phase 10 when it adopts concepts); this file stays public: no answers (depends on T005)
- [X] T015 [P] Create `lib/background.server.ts` (`import "server-only"`) exporting `runInBackground(work: () => Promise<void>): void`: calls `after(work)` from `next/server`, and when `after` throws because there is no request scope (tests, scripts) runs `work()` as a detached promise that logs rejections; export `settleBackground(): Promise<void>` used only by tests to await detached work; add `tests/background.test.ts` for both paths
- [X] T016 Create `tests/helpers/concept-fixtures.ts`: two synthetic units, `fx-ready` (quiz groups `mc` 4 and `sa` 4 so a quiz has 8 questions; 12 MC and 12 short questions; 6 concepts `fx-ready.c-a` to `fx-ready.c-f`; every question tagged; `conceptsReady` and `explanationsComplete` true; each MC answer has `wrongExplanations` for its three wrong options) and `fx-plain` (no concepts, no markers, `quiz` of 3 MC), a `fixtureContent()` helper that `vi.doMock`s `@/content` and `@/content/answers` with them, plus `seedResultAt(db, user, attemptId, unitId, questionId, marks, max, at)` to insert results at an exact time and `fakeLlmPort()` returning a scriptable `ConceptLlmPort` (summary generate/review, illustration generate/review) that records every call and its model name (depends on T005, T014)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Know which concepts I still need to learn (Priority: P1) 🎯 MVP

**Goal**: The unit page lists the student's uncleared concepts, highest count first, from their saved results, in answer order. Counts follow the rule: wrong sets 3, correct takes 1 away, clear at 0. No generated content yet; each entry shows the one-line description and "N more correct answers needed".

**Independent Test**: With the `fx-ready` fixture, answer a question wrongly and see its concept at count 3; answer three tagged questions correctly and watch 3, 2, 1, gone; answer wrongly again and see 3, not 4. Two students are independent. A late-saved result keeps its answer time.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T017 [P] [US1] Write `tests/concepts/progress.test.ts` against `conceptProgress(unit, results)`: first miss gives count 3; wrong at 2 gives 3 (not 4); correct at 3 gives 2; correct at 1 clears; correct on a concept never missed stays 0 and is not listed; cleared then wrong returns at 3; partial credit (1 of 2) counts as wrong, full marks as correct; a self-marked result counts like any other; equal counts order by most recent miss first, then concept id; results given out of order are replayed by `answeredAt` then `id`; the same results shuffled produce the same output (FR-007); a result for a retired question uses the unit's `retired` tombstone; a result for a question with a `null` tombstone counts toward no concept and is ignored; a result for a question with no tag and no tombstone is ignored; a tag changed on the question applies to the student's old results (FR-006)
- [X] T018 [P] [US1] Write `tests/concepts/progress-db.test.ts` using PGlite and `fixtureContent()`: `loadUnitConceptProgress` returns only the session user's results (a second student's misses never appear, FR-014); results are ordered by `created_at` then `id`; a result inserted with an explicit earlier `created_at` is replayed before a later one even if saved after it; `pg_indexes` contains `results_user_unit_created_idx` on `(user_id, unit_id, created_at, id)`, and with `SET enable_seqscan = off` the loader's `EXPLAIN` uses it (small PGlite tables otherwise get a sequential scan)
- [X] T019 [P] [US1] Write `tests/api/retry-answer-time.test.ts`: a receipt signed with an `iat` ten minutes ago, retried through `POST /api/results/retry`, stores `created_at` equal to that `iat`; the normal `POST /api/grade` save keeps `created_at` within a second of now; retrying the same receipt again changes nothing (duplicate, same `created_at`); a result saved late after a newer answer on the same concept still replays in answer order
- [X] T020 [P] [US1] Write `tests/pages/unit-concepts.test.ts` rendering the unit page for `fx-ready` with a student's seeded results: the "Things you need to know" section lists the uncleared concepts in count then recency order with their descriptions and "N more correct answers needed"; a student with none sees the positive message and no list; a student with results only in another unit sees nothing here; `fx-plain` shows no section at all; with the database unreachable the section shows the plain unavailable notice and the page does not throw; the Start quiz control appears before the section in the markup (Principle VIII)

### Implementation for User Story 1

- [X] T021 [US1] Create `lib/concepts/progress.ts` (plain module, no `server-only`, no I/O, no answer key): export `interface ConceptResult { id: string; questionId: string; marks: number; max: number; answeredAt: Date }`, `interface ConceptState { conceptId: string; count: 1 | 2 | 3; lastMissedAt: Date }`, `conceptProgress(unit: Unit, results: readonly ConceptResult[]): ConceptState[]` (replays in `(answeredAt, id)` order using `conceptOfQuestion`, skipping any result whose concept is `undefined` (no tag, or a `null` tombstone), correct only when `marks >= max`, returns only uncleared concepts sorted by count descending, `lastMissedAt` descending, then `conceptId`); makes T017 pass
- [X] T022 [US1] Edit `lib/db/queries/results.server.ts`: add optional `createdAt?: Date` to `ResultInsert` and pass it through `insertResultIdempotent` only when set (the column default `now()` otherwise); add `listUnitResultsForProgress(db: Db, userId: string, unitId: string): Promise<ConceptResult[]>` selecting `id, question_id, marks_awarded, max_marks, created_at` where `user_id = userId and unit_id = unitId` ordered by `created_at, id` (always the session user's id, Principle IX)
- [X] T023 [US1] Edit `lib/results/save.server.ts`: add `answeredAt?: Date` to `ResultFields`; pass it as `createdAt` to `insertResultIdempotent`; leave `touchLastAnswer` and every other behaviour unchanged (depends on T022)
- [X] T024 [US1] Edit `app/api/results/retry/route.ts`: pass `answeredAt: new Date(r.iat * 1000)` in the fields given to `saveResult`; the grade and self-mark routes keep the default (depends on T023; makes T019 pass)
- [X] T025 [US1] Create `lib/db/queries/concepts.server.ts` (`import "server-only"`): export `loadUnitConceptProgress(userId: string, unit: Unit): Promise<Loaded<ConceptState[]>>` using the same `load()` pattern and `HISTORY_TIMEOUT_MS` as `lib/db/queries/history.server.ts` (reuse its exported `Loaded` type and `load` helper by exporting them from that file if needed); it returns `{ status: "ok", data: [] }` for a unit that is not `conceptsReady`, and `{ status: "unavailable" }` on `DbUnavailableError`
- [X] T026 [P] [US1] Create `components/ConceptPanel.tsx` (server component, no client JS): props `{ unit: Unit; progress: Loaded<ConceptState[]> }`; renders the heading "Things you need to know", one list item per uncleared concept showing its description from `conceptsOf(unit)` and "`N` more correct answer(s) needed" (singular for 1), a positive message when the list is empty, and `HistoryUnavailable`-style plain text ("We can't load your weak concepts right now.") when unavailable; returns `null` when the unit is not `conceptsReady`
- [X] T027 [P] [US1] Edit `app/globals.css`: add `.concept-panel`, `.concept-list`, `.concept-item`, `.concept-count` rules using only variables from `styles/tokens.css` (no new colours), readable at phone width
- [X] T028 [US1] Edit `app/unit/[unitId]/page.tsx`: load `loadUnitConceptProgress` in parallel with `loadUnitHistory` (`Promise.all`, skipped when `degraded` or the unit is not `conceptsReady`, in which case pass `{ status: "unavailable" }` or render nothing respectively); render `<ConceptPanel>` immediately after the `start-actions` block and before the history section so Start/Continue stays first (depends on T025, T026; makes T020 pass)

**Checkpoint**: User Story 1 works on its own; the MVP shows weak concepts with counts

---

## Phase 4: User Story 7 - Students only see reviewed content (Priority: P1)

**Goal**: A shared concept summary (and illustration) is generated, checked by an independent reviewer, regenerated once on failure, and flagged when it fails twice. Only approved content is ever readable by students. Runs under a database lease and a separate daily cap.

**Independent Test**: Drive `runConceptPipeline` with the fake port: pass → approved and live; fail then pass → only the second version live; fail twice → flagged `failed_review`, no student read path returns it; reviewer unset, equal to the generator, or down → stays `pending_review` and is not readable; cap used up → no model calls.

### Tests for User Story 7 ⚠️

- [X] T029 [P] [US7] Write `tests/usage-concept.test.ts` in the style of `tests/usage.test.ts`: `reserveConceptCall(db, cap)` inserts the first call and increments only while `count < cap`; 20 concurrent reservations with cap 7 grant exactly 7; cap 0 grants none; `refundConceptCall` never goes below 0; the day is the Sydney date from the database; the counter is global (no user)
- [X] T030 [P] [US7] Write `tests/concepts/store.test.ts`: `ensureSlot` is idempotent; `claimLease` lets exactly one of two concurrent callers win and is claimable again after `lease_until` passes or after `releaseLease`; `claimLease` refuses while `retry_after` is in the future; `insertReplacement` deletes the previous replacement so at most one exists; `promote(versionId)` sets `status = 'approved'` and swaps the slot pointers in one statement, leaves the old live version unreferenced, and `cleanupOrphans` removes it; `promote` on a version that is not the slot's replacement changes nothing; a failed version never becomes live
- [X] T031 [P] [US7] Write `tests/concepts/svg.test.ts`: `checkSvg` accepts a small valid diagram (axes, two curves, labels) and rejects, each with a specific reason, `<script>`, `<foreignObject>`, `<image>`, `<use>`, `<style>`, any `on*` attribute, `href` and `xlink:href`, `javascript:` and `data:` values, `url()` pointing outside `#id`, a `<!DOCTYPE>` or `<!ENTITY>`, an element or attribute off the allowlist, input over 40 KB and text with no `<svg>`; `renderPng` of the valid diagram returns a PNG buffer starting with the PNG signature whose width is 800 (skipped with a clear message if the native module cannot load on the machine)
- [X] T032 [P] [US7] Write `tests/concepts/llm.test.ts`: the summary generator prompt contains the unit title, concept description and the tagged questions' prompts and contains no model answer, rubric or correct option (assert against the fixture answer key); the reviewer prompt contains the bullets and the answer-key material; reply parsing accepts valid JSON and rejects 2 or 7 bullets, a 300-character bullet, a missing `illustration` key and non-JSON; the review pass rule ignores a model-supplied `pass` and requires every check `true`; a reviewer reply missing a check is "reviewer unavailable", not a failure; `overlapsAnswerKey` flags a run of 8 shared words (after lower-casing and stripping punctuation) and not 7; neither prompt builder takes student input, so a prompt can contain no student name, email or answer
- [X] T033 [P] [US7] Write `tests/concepts/pipeline.test.ts` with `fakeLlmPort()`, an injected `now`, and PGlite: (a) pass → the version is `approved`, `approved_by = 'reviewer'`, live, reviewer model and time recorded; (b) first review fails, regeneration passes → exactly 4 cap slots used, only the second version live, `attempt_no` 2; (c) fails twice → status `failed_review` with the reason, nothing live, no email or notification path exists to call; (d) `REVIEW_MODEL` unset, then equal to the recorded generator model (including a `:variant` suffix and different case) → no reviewer call, version stays `pending_review`; (e) reviewer reply unparseable or HTTP failure → stays pending, slot refunded, `retry_after` set 15 minutes ahead; (f) cap exhausted before generation → no model call at all; cap exhausted between generate and review → stays pending; (g) a pre-check overlap is a failed review with the fixed reason, spends no reviewer slot, and triggers the single regeneration; (h) a second concurrent run for the same concept makes zero model calls (lease held); (i) an expired lease can be taken over; (j) the deadline passes mid-run → work stops cleanly, version pending, lease released; (k) an illustration is generated only when the approved or pending summary decided it needs one, reviewed separately, and a failing illustration leaves the approved summary live; (l) a teacher-origin run keeps the existing live version until the replacement is approved, and a replacement that fails twice leaves the live version in place; (m) the illustration slot has its own lease: when another worker holds it, the summary still completes and the run reports `lease_busy` for the illustration only; (n) a run that starts at `illustration` takes the brief from the live summary, else the replacement summary, else returns `no_brief` and makes no model call
- [X] T034 [P] [US7] Write `tests/concepts/visibility.test.ts` for `loadApprovedContent(db, conceptIds)`: returns only versions reachable through `live_version_id` with `status = 'approved'`; returns nothing for a concept whose only version is `pending_review` or `failed_review`; returns the old live version while a replacement is pending; after promote returns the new one; a version that failed review twice is not returned by any exported read function; the result type has no field for `reviewer_reason`, `last_error` or model names (assert on the object keys)

### Implementation for User Story 7

- [X] T035 [US7] Edit `lib/openrouter.server.ts`: extract the shared request code into `export async function chatCompletion(p: { model: string; messages: ChatMessage[]; temperature: number; maxTokens: number; timeoutMs: number; json?: boolean }): Promise<{ ok: true; content: string } | { ok: false; reason: "unconfigured" | "network" | "http" | "empty"; status?: number }>`, where a message's `content` may be a string or an array with an `image_url` part; honour `OPENROUTER_BASE_URL` only when `process.env.NODE_ENV !== "production"`; keep `gradeShortAnswer` behaviour, logs and retry identical by calling it; add `conceptLlmConfigured()` (same key check); existing tests that mock this module keep passing (they only use `llmGradingConfigured` and `gradeShortAnswer`)
- [X] T036 [P] [US7] Edit `lib/grading.server.ts`: add `getReviewMaterial(unitId: string, conceptId: string): { questions: Array<{ id: string; prompt: string; type: "mc" | "short"; modelAnswer?: string; rubric: string[]; correctText?: string }> } | null` returning the tagged questions' public prompt plus answer-key material read through `getAnswer`; this and `getOptionExplanation` (US5) are the only code allowed to read `content/answers` for these features; the return value is only ever passed to a model and discarded (add that in the doc comment)
- [X] T037 [P] [US7] Create `lib/concepts/svg.server.ts` (`import "server-only"`): `checkSvg(svg: string): { ok: true; svg: string } | { ok: false; reason: string }` implementing the allowlist in `contracts/llm.md` section 4 by tokenising tags and attributes with regular expressions (reject, never repair; trim to the first `<svg…</svg>` block; 40 KB limit) and `renderPng(svg: string): Promise<Buffer>` using `Resvg` from `@resvg/resvg-js` with `fitTo: { mode: "width", value: 800 }`, `font: { fontFiles: [<absolute path of assets/fonts/NotoSans-Regular.ttf>], loadSystemFonts: false, defaultFontFamily: "Noto Sans" }`; the font path is resolved with `path.join(process.cwd(), "assets", "fonts", …)`; makes T031 pass
- [X] T038 [P] [US7] Create `lib/concepts/precheck.ts` (plain module): `normalise(text)` (lower-case, strip punctuation, collapse spaces) and `overlapsAnswerKey(text: string, material: string[]): boolean` returning true when any run of 8 consecutive words of `text` appears in any material string after normalising both
- [X] T039 [US7] Create `lib/concepts/store.server.ts` (`import "server-only"`; every function takes `db: Db` first): `reserveConceptCall(db, cap, sydneyDate?)` and `refundConceptCall(db, slot)` copying the single-upsert pattern of `lib/usage.server.ts` on `daily_concept_usage`; `ensureSlot(db, conceptId, kind, unitId)` (`insert … on conflict do nothing`); `claimLease(db, conceptId, kind, owner, now, leaseMs = 300000)` as one atomic `update … where (lease_until is null or lease_until < now) and (retry_after is null or retry_after <= now) returning`; `releaseLease`; `setBackoff(db, conceptId, kind, now, error)` (15 minutes); `insertReplacement(db, input)` which inserts a `pending_review` version, deletes the slot's previous replacement version and points `replacement_version_id` at the new one; `markReviewed(db, versionId, { status: "failed_review" | "pending_review", reviewerModel, reason, at })`; `promote(db, conceptId, kind, versionId, approvedBy, review)` as the single CTE statement in research R9 (approve the version and swap the pointers together, only when `replacement_version_id = versionId`); `cleanupOrphans(db, conceptId, kind)`; `getSlot`; `hasActiveLease(db, conceptIds, now)` (true when any listed concept's slot has an unexpired lease; used for the `pending` flag) and `contentVersionHash(content)` (a short stable hash of the approved version ids, used for the `version` field); makes T029 and T030 pass
- [X] T040 [US7] Create `lib/concepts/llm.server.ts` (`import "server-only"`): export `interface ConceptLlmPort` with `generateSummary`, `reviewSummary`, `generateIllustration`, `reviewIllustration` (signatures per `contracts/llm.md`, each returning a discriminated union that separates `call_failed` from `content_rejected`), and `createConceptLlmPort(): ConceptLlmPort` built on `chatCompletion` from T035: prompts exactly as in `contracts/llm.md`, JSON parsing and validation, `temperature` 0.4 for generators and 0 for reviewers, timeouts 20 s (60 s for the illustration generator), the illustration reviewer sending the PNG from `renderPng` as an `image_url` data URL plus the SVG source, and a failure to render or an image-rejecting model reported as `call_failed`; also export `sameModel(a: string, b: string): boolean` (trim, lower-case, drop a trailing `:variant`); makes T032 pass (depends on T035, T036, T037, T038)
- [X] T041 [US7] Create `lib/concepts/pipeline.server.ts` (`import "server-only"`): `runConceptPipeline(input: { db; port: ConceptLlmPort; conceptId; kind: "summary" | "illustration"; origin: "first" | "teacher"; cap: number; models: { generator; illustration; reviewer }; now: () => Date; deadline: Date; owner: string }): Promise<PipelineOutcome>` implementing generate → pre-check → review → one automatic regeneration → review → flag, exactly the state machine in data-model.md, reserving one cap slot before every model call (not for the pre-check, SVG check or rendering) and refunding on `call_failed`, never reviewing when the reviewer is unset or `sameModel` as the version's recorded generator, retrying a version already `pending_review` without regenerating, never touching a `failed_review` version unless `origin = 'teacher'`, never feeding a reviewer reason back to a generator, continuing into the illustration when the summary version has a non-null `illustration_brief` and an illustration model is set (call `ensureSlot` for the illustration, claim its own lease and run the same cycle; `kind` only chooses where a run starts, and a run that starts at `illustration` takes the brief from the live summary, else the replacement summary, else returns `no_brief` without a model call), setting backoff on `call_failed`, releasing the lease in `finally`, and returning an outcome code (`approved`, `flagged`, `pending_reviewer_unavailable`, `pending_cap`, `pending_deadline`, `failed_call`, `lease_busy`, `backoff`, `no_brief`, `nothing_to_do`); makes T033 pass (depends on T039, T040)
- [X] T042 [US7] Edit `lib/db/queries/concepts.server.ts` (created in T025): add `loadApprovedContent(db: Db, conceptIds: string[]): Promise<Map<string, ApprovedContent>>` where `ApprovedContent = { summary: { versionId: string; bullets: string[] } | null; illustration: { versionId: string; alt: string } | null }`, selecting only through `concept_slots.live_version_id` joined to `concept_versions` with `status = 'approved'`; it is the only read path for students and its type carries no reason, error, model or timestamp; makes T034 pass (depends on T039)
- [X] T043 [P] [US7] Create `scripts/fake-openrouter.ts`: a Node HTTP server on port 4010 answering `POST /v1/chat/completions` with canned replies chosen by the prompt (summary generation → valid bullets and, for concepts whose description contains "diagram", an illustration brief; illustration generation → a small valid SVG with labelled axes and two curves; summary and illustration review → a reply controlled by `FAKE_REVIEW` = `pass` | `fail` | `fail-once` | `down` (`down` returns HTTP 503), where `fail-once` fails the first review per concept id and passes later ones); log each request's model and purpose; documented in the file header and in quickstart.md

**Checkpoint**: The pipeline produces approved, flagged or pending content correctly and students can only read approved content

---

## Phase 5: User Story 2 - Relearn a concept from a clear explanation (Priority: P1)

**Goal**: Each uncleared concept on the unit page can be opened to show its approved bullets and, if any, its picture. The page renders instantly with descriptions; generation starts in the background from the page and approved content appears without a reload.

**Independent Test**: With an approved explanation for a concept, two students who missed it see the same text immediately. With none stored, the page shows the description at once, the ensure call queues work, and when the fake pipeline approves it the status poll triggers one refresh that shows the bullets.

### Tests for User Story 2 ⚠️

- [X] T044 [P] [US2] Write `tests/api/concepts-ensure.test.ts`: 401 signed out; 404 for an unknown unit or one that is not `conceptsReady`; claims only the signed-in student's own uncleared concepts that have nothing stored or a `pending_review` version (never a concept the student has cleared, never another student's); never claims a concept whose version is `failed_review`; claims at most 3 per call, highest count first; skips a concept with an unexpired lease or a future `retry_after`; returns `202 { queued, pending: true, version }` when work started and `200 { queued: [], pending: false, version }` when not; the background work uses the injected port and writes an approved live version; the 11th call in a minute is `429 rate_limited` with `retry-after`; a second student's identical call after approval makes zero model calls
- [X] T045 [P] [US2] Write `tests/api/concepts-status.test.ts`: 401 signed out; 404 for an unready unit; `pending` is true only while a lease on one of this student's listed concepts is unexpired; `version` changes when an approved version for a listed concept changes and not otherwise; a different student's content never affects it; the response has exactly the keys `pending` and `version`
- [X] T046 [P] [US2] Write `tests/api/concept-illustration.test.ts`: 401 signed out; 404 for an unknown concept id, for a missing or wrong `v`, for a pending or failed version, and for a superseded version; 200 for the live approved illustration with `Content-Type: image/svg+xml`, `X-Content-Type-Options: nosniff`, a `Content-Security-Policy` containing `sandbox` and `default-src 'none'`, and `Cache-Control: private, max-age=31536000, immutable`
- [X] T047 [P] [US2] Write `tests/client/concept-live.test.tsx` (React Testing Library, fake timers, mocked `fetch` and `useRouter`): calls ensure once on mount only when `needsContent` is true; polls the status route every 5 seconds easing to 15; stops when `pending` is false, after 3 minutes, and while `document.hidden`; calls `router.refresh()` exactly once per change of `version`; renders nothing visible and no live-region announcement; does nothing when `needsContent` is false
- [X] T048 [P] [US2] Extend `tests/pages/unit-concepts.test.ts`: an approved summary renders as a keyboard-operable `<details>` whose body lists the bullets; an approved illustration renders as `<img src="/api/concepts/<id>/illustration?v=<versionId>" alt="…" loading="lazy">` and the markup contains no inline `<svg`; a concept with no approved content renders only its description line and no empty image area; a text-approved concept whose illustration is not approved shows bullets and no image; the page markup contains no reviewer reason, model name or error text; Start quiz still precedes the section

### Implementation for User Story 2

- [X] T049 [US2] Edit `lib/ratelimit.server.ts`: add `checkConceptRateLimit(userId: string): Promise<RateResult>` using the existing `checkRateLimit` helper with a `concept:` key prefix and the `conceptRateLimit` setting from T010, so it works with Upstash and the in-memory fallback like the others
- [X] T050 [US2] Create `app/api/units/[unitId]/concepts/ensure/route.ts` implementing `contracts/api.md`: `export const runtime = "nodejs"; export const maxDuration = 60;` use `authenticate()`; validate the unit; apply `checkConceptRateLimit`; load the student's progress and `loadApprovedContent`/slots to pick up to 3 concepts that need work (rules in the contract); `claimLease` each; for each claimed concept call `runInBackground(() => runConceptPipeline({ …, kind: "summary", origin: "first", deadline: now + 50 s }))` (the run continues into the illustration when the summary asked for one); respond `202` or `200` with `pending` and `version`; the `version` hash comes from `contentVersionHash` and `pending` from `hasActiveLease`, both in `lib/concepts/store.server.ts` (T039); makes T044 pass (depends on T041, T042, T049)
- [X] T051 [P] [US2] Create `app/api/units/[unitId]/concepts/status/route.ts`: `authenticate()`, validate the unit, return `{ pending, version }` computed from active leases and `loadApprovedContent` for the student's current uncleared concepts; read-only; makes T045 pass
- [X] T052 [P] [US2] Create `app/api/concepts/[conceptId]/illustration/route.ts`: `authenticate()`, validate the concept with `getConcept`, require `v`, look up the slot's live approved illustration, return `404 { error: "not_found" }` unless `v` equals its version id, otherwise the SVG with the headers in `contracts/api.md`; makes T046 pass (depends on T042)
- [X] T053 [US2] Create `components/ConceptLive.tsx` (`"use client"`): props `{ unitId: string; needsContent: boolean; initialPending: boolean; initialVersion: string }`; implements the ensure-once, polling with easing and the 3-minute and hidden-tab rules, and `router.refresh()` once per version change, exactly as tested in T047; renders `null`; makes T047 pass
- [X] T054 [US2] Edit `components/ConceptPanel.tsx`: accept `content: Map<string, ApprovedContent>`; render each uncleared concept as a native `<details>` whose `<summary>` is the description plus the count and whose body lists the approved bullets and, when approved, the `<img>` described in T048; a concept with no approved content stays a plain row (no `<details>`); mount `<ConceptLive>` with `needsContent` true when any listed concept has no approved summary (depends on T053)
- [X] T055 [P] [US2] Edit `app/globals.css`: styles for `.concept-details`, the summary row, the bullet list and `.concept-illustration` (max width 100%, `height: auto`, token colours only)
- [X] T056 [US2] Edit `app/unit/[unitId]/page.tsx`: after the progress loader, load `loadApprovedContent` for the listed concept ids (same timeout and `Loaded` handling; failure means "no content", never an error) and pass it, with the initial `pending` and `version` from a server call to the same helper the status route uses, to `<ConceptPanel>` (depends on T042, T054; makes T048 pass)

**Checkpoint**: Students see approved explanations and pictures, and new content appears without a reload

---

## Phase 6: User Story 3 - Always be able to see weak concepts, even when generation fails (Priority: P1)

**Goal**: Whatever fails (generator, reviewer, cap, database), the unit page still lists weak concepts by description and count with no error, quizzes still start, and AI marking of short answers is unaffected.

**Independent Test**: Switch the generator off, set the cap to 0, then use an unset reviewer, then take the database down: each time the unit page lists the descriptions and counts, no error is shown, Start quiz works, and short-answer AI marking still works.

### Tests for User Story 3 ⚠️

- [X] T057 [P] [US3] Write `tests/api/concepts-degrade.test.ts`: with the cap at 0 the ensure route returns `200` with nothing queued and the unit page lists descriptions and counts; with the cap used up after the first call, later calls make no model call and the page still lists them; with the generator port failing, the version is absent, `retry_after` is set, and a second ensure within 15 minutes makes no call, then makes one after 15 minutes; with `REVIEW_MODEL` unset the content stays `pending_review` and the page shows descriptions only; with the reviewer equal to the generator the same; a `failed_review` version is shown to no student and is never re-claimed by opening the page; with the database unreadable the unit page shows the notice, `POST /api/attempts` still returns 201, and the ensure and status routes answer `503 temporarily_unavailable` (never 401); an already-approved live summary and illustration are still returned by `loadApprovedContent` and rendered on the unit page when the cap is 0 or used up; the student-facing responses never contain a reason, error or model name
- [X] T058 [P] [US3] Extend `tests/api/grade-cap.test.ts`: with the concept cap fully used, a short answer is still AI-graded and counted against the student's own `daily_ai_usage`; with the student's AI-marking allowance fully used (short answers self-mark), the concept pipeline still runs and uses `daily_concept_usage` only; the two counters never change each other (SC-006)
- [X] T059 [P] [US3] Extend `tests/auth/middleware.test.ts`: in production mode, leaving `REVIEW_MODEL`, `ILLUSTRATION_MODEL`, `CONCEPT_MODEL`, `CONCEPT_DAILY_CAP`, `CONCEPT_RATE_LIMIT` and `ADMIN_EMAILS` unset does not make the site refuse to serve, while missing `AUTH_SECRET` or `DATABASE_URL` still does (Principle VII fail closed unchanged)
- [X] T060 [P] [US3] Write `tests/openrouter-base-url.test.ts`: `chatCompletion` sends to `OPENROUTER_BASE_URL` when `NODE_ENV` is `development` or `test` and ignores it (uses the real OpenRouter URL) when `NODE_ENV` is `production`; with no `OPENROUTER_API_KEY` it returns `{ ok: false, reason: "unconfigured" }` without a network call

### Implementation for User Story 3

- [X] T061 [US3] Edit `lib/concepts/pipeline.server.ts` and `app/api/units/[unitId]/concepts/ensure/route.ts`: log each non-approved outcome code once per run with `console.warn("[concepts] <code> <conceptId> <kind>")` (no student data, no reasons, no model answers) so an operator can see why content is pending; make the ensure route return `200` (not an error) for `pending_cap`, `pending_reviewer_unavailable`, `backoff`, `lease_busy` and `failed_call`; confirm the unit page, status route and ensure route never throw to the student for any outcome; makes T057 and T058 pass (T059 and T060 are met by T010 and T035) (depends on T041, T050, T051)

**Checkpoint**: P1 complete - weak concepts always visible, approved explanations delivered, nothing unreviewed shown

---

## Phase 7: User Story 4 - Quizzes focus on what I got wrong (Priority: P2)

**Goal**: In a concept-ready unit, every normal quiz gives exactly half its places (rounded up) to questions on the student's uncleared concepts, drawn from the bank, with the rest drawn as usual. A database that cannot be read gives an ordinary quiz.

**Independent Test**: With `fx-ready` and a student with two uncleared concepts, start a quiz: 4 of 8 questions carry those concepts, unseen first, spread across both, the MC/short mix kept where it costs no weighted place; the quiz appears in history unlabelled; with no weak concepts, with `fx-plain`, or with the database down, the quiz is the ordinary draw.

### Tests for User Story 4 ⚠️

- [X] T062 [P] [US4] Write `tests/attempts/draw-weighted.test.ts` with an injected deterministic `rand`: with `weighting` undefined the output equals the existing draw (reuse a case from `tests/attempts/draw.test.ts`); exactly `ceil(N/2)` weighted for N = 8, 10 and 3 (3 gives 2); fewer candidates than the weighted places uses them all and draws the rest as usual; round-robin across concepts in count then recency order so no concept takes every place while others have questions; unseen preferred over seen, and seen ordered last-answered-wrong first then least recently answered; the group mix is kept when it costs no weighted place and exact half wins when it does (and the remaining quotas are trimmed from the largest, ties to the later group); the preference order is within-capacity unseen, within-capacity seen, over-capacity unseen, over-capacity seen; no question appears twice and every drawn id is in `unit.questions` (the bank); groups appear in listed order; each MC question has an option order; a unit with no `quiz` config is unchanged; a retired id in `seen` or states is ignored
- [X] T063 [P] [US4] Write `tests/api/attempts-weighted.test.ts` through the real `POST /api/attempts` with `fixtureContent()` and PGlite: a ready unit with a student who has uncleared concepts returns half its questions from them and the response and attempt token have the same shape as before; a student with no results, a student with all concepts cleared, and `fx-plain` get the ordinary draw; when `listUnitResultsForProgress` throws `DbUnavailableError` (and on a timeout) the quiz still returns 201 unweighted with `persisted` behaving as in spec 001; the attempt is stored and appears in history with no extra field; another student's weaknesses never influence the draw; an incomplete weighted attempt resumes with the same remaining question ids and its saved answers and draws nothing new (start on `fx-ready`, answer three questions through `POST /api/grade`, then read the resume from `unitHistory`); the response contains no marker of which questions were weighted

### Implementation for User Story 4

- [X] T064 [US4] Create `lib/concepts/weighting.server.ts` (`import "server-only"`): `loadWeighting(db: Db, userId: string, unit: Unit): Promise<Weighting | null>` returning `null` unless the unit is `conceptsReady` and has a `quiz` config; otherwise runs `listUnitResultsForProgress`, `conceptProgress`, and builds `{ states: ConceptState[]; seen: Set<string>; lastAnswer: Map<string, { at: Date; correct: boolean }> }`; returns `null` when no concept is uncleared; define and export the `Weighting` type here (`lib/attempts/draw.server.ts` imports the type only, with `import type`)
- [X] T065 [US4] Edit `lib/attempts/draw.server.ts`: add the optional third parameter `weighting?: Weighting` to `drawAttempt` and implement the algorithm in research R4 (quotas from `quiz.groups` or the legacy `short`/`mc`, `N` from available questions, `W = ceil(N / 2)`, four-pass round-robin by concept, remaining quotas with trimming and top-up, per-group shuffle of weighted and usual picks, groups in listed order, MC option order as today); with no `weighting` the function must behave exactly as before; keep it pure and driven by the injected `rand`; makes T062 pass (depends on T064)
- [X] T066 [US4] Edit `app/api/attempts/route.ts`: before drawing, call `dbCall((db) => loadWeighting(db, user.id, unit))` only when `session.kind === "user"` and catch `DbUnavailableError` (and any timeout) as "no weighting"; pass the result to `drawAttempt(unit, randomInt, weighting ?? undefined)`; do not change the response, the token or the stored attempt; makes T063 pass (depends on T064, T065)

**Checkpoint**: Quizzes concentrate on weak concepts and still start when the database is down

---

## Phase 8: User Story 5 - Understand why each wrong option is wrong (Priority: P2)

**Goal**: In an explanations-complete unit, after answering an MC question wrongly, the student sees the written reason for the option they chose; nothing about any option is sent before answering, and a correct answer reveals nothing about the others. Past attempts show the current explanation.

**Independent Test**: With `fx-ready`, answer an MC question wrongly: the response and the quiz show that option's explanation. Answer correctly: none. Inspect the attempt payload: no explanation text. Open the attempt page: wrong MC items show the explanation. `fx-plain` behaves as before.

### Tests for User Story 5 ⚠️

- [X] T067 [P] [US5] Write `tests/api/grade-explanation.test.ts`: a wrong MC answer in `fx-ready` returns `result.optionExplanation` equal to the fixture's text for the chosen option and for no other option; a correct answer returns no `optionExplanation` and no response field contains any wrong-option explanation; the degraded path (database unreachable, graded from the attempt token) returns it; the `409 already_answered` body returns it recomputed from the stored option text; a unit that is not `explanationsComplete` returns none; an MC option with no explanation returns none and no error; short answers never include the field
- [X] T068 [P] [US5] Extend `tests/no-key-leak.test.ts`: for every unit, the `POST /api/attempts` body contains no `wrongExplanations` key and none of that unit's explanation strings; for `fx-ready` no page rendered for a student before answering contains an explanation string; a test greps `app/`, `components/`, `lib/` and `scripts/` and fails if any file other than `lib/grading.server.ts` and `content/answers/index.ts` imports `content/answers` or a unit's `answers` module (`scripts/validate-content.ts` and the unit `answers.ts` files themselves are the documented exceptions)
- [X] T069 [P] [US5] Write `tests/pages/attempt-explanation.test.ts`: the attempt detail page for a student's attempt shows the current explanation under each wrong MC item in an explanations-complete unit; changing the fixture explanation text changes what the page shows for an old attempt (nothing is stored per result); correct MC items and short items show none; another student's attempt id is the not-found page

### Implementation for User Story 5

- [X] T070 [US5] Edit `lib/grading.ts`: add `optionExplanation?: string` with a doc comment to `GradeResult`, and to the `Pick<…>` in `AlreadyAnswered["result"]`; no other shape changes
- [X] T071 [US5] Edit `lib/grading.server.ts`: add `getOptionExplanation(questionId: string, chosenOptionText: string): string | undefined` returning the answer key's `wrongExplanations[chosenOptionText]` only when the question is MC, its unit has `explanationsComplete`, and the chosen option is not the correct one; add the same value to the MC result inside `gradeAnswer` for a wrong answer (set `optionExplanation` on the returned `GradeResult`)
- [X] T072 [US5] Edit `app/api/grade/route.ts`: no new input; make sure the `optionExplanation` from `gradeAnswer` reaches the success response, the degraded response and, in `alreadyAnswered`, the `409` body (computed with `getOptionExplanation(row.questionId, row.answer)` for MC); makes T067 pass (depends on T070, T071)
- [X] T073 [US5] Edit `components/Quiz.tsx`: after an MC question is marked wrong, render `result.optionExplanation` (when present) in an `.explanation` block directly under the option list with the label "Why this is wrong"; nothing is rendered when it is absent; keep `aria-live="polite"` consistent with the existing feedback block; no new fetches
- [X] T074 [P] [US5] Edit `app/globals.css`: `.explanation` styles using tokens (distinct from `.feedback` and `.model-answer`)
- [X] T075 [US5] Edit `app/attempts/[attemptId]/page.tsx`: for each answered MC item with `marks === 0` and `gradedBy === "auto"`, call `getOptionExplanation(item.questionId, item.answer)` (a server component, so importing `@/lib/grading.server` is allowed) and show it under the answer with the same label; nothing for other items; makes T069 pass (depends on T071)

**Checkpoint**: MC explanations work in finished units and leak nowhere

---

## Phase 9: User Story 6 - Teacher reviews, regenerates and approves concept content (Priority: P3)

**Goal**: An allow-listed teacher sees every concept's content, status and reviewer reason, can regenerate an item (reviewed again, live version kept until the replacement is approved), finds flagged items with a documented query, and fixes and approves them in the backend. Everyone else is refused on the server.

**Independent Test**: As an allow-listed verified teacher, open `/admin/concepts`, regenerate one item and see the old version stay live until the replacement is approved; as a student, with an empty allow-list, or with an unverified email, every admin page and route refuses; run the flagged-items query and `npm run concept:approve`.

### Tests for User Story 6 ⚠️

- [X] T076 [P] [US6] Write `tests/admin.test.ts` for `lib/admin.server.ts`: `ADMIN_EMAILS` is split on commas, trimmed and compared case-insensitively; an empty or unset list admits nobody; an email not in the list is refused; a listed email without the verified claim is refused; a listed verified email passes; whitespace-only entries are ignored; the allow-list is read per call (changing the env var takes effect immediately)
- [X] T077 [P] [US6] Write `tests/api/admin-concepts.test.ts`: for the page data, `POST /api/admin/concepts/regenerate` and `GET /api/admin/concepts/[conceptId]/illustration`: signed out gets 401 (page: redirect to sign-in); a signed-in student, an empty allow-list, and a listed but unverified email each get 403 (page: not-found) and cause no database write and no model call; an allow-listed verified teacher succeeds; the regenerate route returns 404 for an unknown concept, a unit that is not ready, and `illustration` when no illustration model is set; 409 when a lease is held; 429 `cap_reached` with `resetsAt` when the cap is used up, leaving the live version untouched; 202 starts a run in which the live version stays on show until the replacement is approved and, if the replacement fails twice, stays on show while the replacement is flagged; the preview route serves any version of that concept and 404s one from another concept; student routes never return the reviewer reason, `last_error` or model names even after a flagged failure; regenerating an illustration for a concept whose summary decided none is needed returns `404 { error: "no_illustration_brief" }`; after a replacement is promoted, the live version id and the student image URL change
- [X] T078 [P] [US6] Write `tests/auth/email-verified-claim.test.ts`: signing in with a Google profile whose `email_verified` is true puts `ev: true` in the JWT claims and false or absent puts `ev: false`; the dev login counts as verified only when `NODE_ENV !== "production"`; the flag is a boolean in `session.user` (visible to the client like the name and email, adding no personal data); nothing is written to the database for it; existing sign-in tests still pass
- [X] T079 [P] [US6] Extend `tests/teacher-queries.test.ts`: seed a concept slot with a `failed_review` replacement and run `flagged_concept_content` exactly as written in `docs/teacher-queries.sql`: it returns concept, unit, kind, reason, generator and reviewer models and times, and omits approved and pending versions; run `concept_generation_usage` for a seeded day and for the default today
- [X] T080 [P] [US6] Write `tests/scripts/approve-concept.test.ts` for the function behind `scripts/approve-concept.ts`: promoting a `failed_review` replacement sets `approved`, `approved_by = 'teacher'`, makes it live, clears the replacement pointer and keeps the earlier reviewer fields; `--bullets-file` replaces the bullets first and rejects fewer than 3 or more than 6; refuses a concept with no replacement; refuses when run without `DATABASE_URL`; is idempotent when run twice

### Implementation for User Story 6

- [X] T081 [US6] Edit `lib/session.server.ts` and `lib/auth.callbacks.server.ts`: add `ev?: boolean` to `TokenClaims` and `SessionUser`; in `jwtCallback` pass the Google profile's `email_verified` (the `profile` argument Auth.js provides) into the claims, `true` for the dev login only outside production; keep it in the JWT only (never in the database); `identityFromClaims` and `sessionCallback` carry it through; update `lib/auth.server.ts` to pass `profile` to `jwtCallback`; makes T078 pass
- [X] T082 [US6] Create `lib/admin.server.ts` (`import "server-only"`): `isAdmin(user: { email: string; ev?: boolean }): boolean` (reads `process.env.ADMIN_EMAILS` on every call; requires `ev === true`), `requireAdminPage()` (calls `requirePageUser()`, then `notFound()` unless admin; returns the user), and `authenticateAdmin()` (calls `authenticate()`, then returns `{ response: NextResponse.json({ error: "forbidden" }, { status: 403 }) }` unless admin); this is the only file that reads `ADMIN_EMAILS`; makes T076 pass (depends on T081)
- [X] T083 [US6] Edit `tests/auth/route-guard.test.ts`: extend the guard regex to also accept `authenticateAdmin\(` and `requireAdminPage\(`, and update its failure message; add a case showing that a route whose source calls only `authenticateAdmin()` passes and one that calls nothing fails; keep the public allowlist unchanged (depends on T082)
- [X] T084 [US6] Edit `lib/concepts/pipeline.server.ts`: export `startTeacherRegeneration(input)` that validates the concept and kind, checks `claimLease` (returning `lease_busy`), checks a cap slot can be reserved (returning `cap_reached` with the next Sydney midnight, without creating a version), for `kind: "illustration"` requires a brief from the live summary, else the replacement summary (returning `no_brief` otherwise), and otherwise inserts a `pending_review` replacement with `origin: "teacher"` and runs the pipeline in the background with the same one-regeneration rule; the live version is untouched until `promote`; extend `tests/concepts/pipeline.test.ts` only if a case in T033(l) is missing (depends on T041)
- [X] T085 [US6] Create `app/api/admin/concepts/regenerate/route.ts`: `runtime = "nodejs"`, `maxDuration = 60`, `authenticateAdmin()`, validate `{ conceptId, kind }` with `getConcept` and the unit's `conceptsReady`, reject `illustration` when `ILLUSTRATION_MODEL` is unset, call `startTeacherRegeneration` inside `runInBackground`, and map outcomes to `404` (`no_brief` returns `404 { error: "no_illustration_brief" }`), `409 busy`, `429 cap_reached`, `202 { queued: true }` per `contracts/api.md`; makes T077 pass (depends on T082, T084)
- [X] T086 [P] [US6] Create `app/api/admin/concepts/[conceptId]/illustration/route.ts`: `authenticateAdmin()`, require `v`, serve any version of that concept's illustration with the security headers from the student route but `Cache-Control: private, no-store`; 404 when the version does not belong to the concept (depends on T082)
- [X] T087 [US6] Edit `lib/db/queries/concepts.server.ts`: add `listConceptContentForTeacher(db: Db): Promise<TeacherConceptRow[]>` joining slots and their live and replacement versions for every concept in `conceptsOf` of the ready units, including `reviewer_reason`, `last_error`, models, times and `approved_by`; its result type is used only by admin code (depends on T039)
- [X] T088 [P] [US6] Create `components/RegenerateButton.tsx` (`"use client"`): props `{ conceptId: string; kind: "summary" | "illustration" }`; posts to `/api/admin/concepts/regenerate`, shows "Queued" on 202 and the specific refusal text for 409, 429 (with the reset time) and 404, then calls `router.refresh()`; no polling
- [X] T089 [US6] Create `app/admin/concepts/page.tsx`: `await requireAdminPage()`; load `listConceptContentForTeacher` (database failure shows the plain unavailable notice); render per unit and concept the live summary and picture (via the admin preview URL), the replacement's status and reviewer reason, generator and reviewer models, generation, review and approval times and who approved, the slot's `last_error`, "not generated" where nothing exists, and a `<RegenerateButton>` for each kind; never any student data (depends on T082, T086, T087, T088; makes T077's page cases pass)
- [X] T090 [P] [US6] Edit `docs/teacher-queries.sql`: add `-- QUERY: flagged_concept_content` (every `concept_versions` row that is a slot's `replacement_version_id` with `status = 'failed_review'`: concept, unit, kind, reason, generator and reviewer models, generated and reviewed times, ordered newest first) and `-- QUERY: concept_generation_usage` (calls used per Sydney day with the same `params` CTE style as the other queries); add a header section "Fixing a flagged item" documenting: edit `summary_bullets` (or `illustration_svg`) on the replacement row in the SQL console, then run `npm run concept:approve -- --concept <id> --kind summary` (makes T079 pass)
- [X] T091 [US6] Create `scripts/approve-concept.ts` (run with `tsx --conditions=react-server`, like `scripts/delete-student.ts`): parse `--concept`, `--kind` and optional `--bullets-file`, load `.env.local` with `loadEnvConfig`, fail clearly without `DATABASE_URL`, validate the replacement exists, optionally replace the bullets (3 to 6, each at most 240 characters), then call `promote(db, conceptId, kind, versionId, "teacher", …)` and `cleanupOrphans`, and print what changed; put the testable logic in an exported `approveConcept(db, args)` function; makes T080 pass (depends on T039)

**Checkpoint**: All user stories work; teachers can review, regenerate and approve

---

## Phase 10: Content Rollout (content work, one unit at a time)

**Purpose**: Make the feature usable on real units. These are content tasks (concept lists, tags, explanations), not code. Each ends with `npm run validate` passing. A unit only gets `conceptsReady` or `explanationsComplete` once it fully meets the rule.

- [ ] T092 Pilot unit `y11-economics-preliminary`, concepts: create `content/units/y11-economics-preliminary/concepts.ts` exporting `concepts` (about 24 to 30 concepts with ids `y11-economics-preliminary.c-<slug>`, one-line descriptions of at most 120 characters, grouped by the six syllabus focus areas in `docs/y11-economics-preliminary-research.md`) and `retired = {}`; add the import to `content/index.ts` so the unit gets `concepts` and `retired`; run `npm run validate:shipped` and commit `content/shipped-ids.json` so the new concept ids are snapshotted (depends on T014)
- [ ] T093 Pilot unit tags: add a `concept` to every question in `content/units/y11-economics-preliminary/questions.ts` (use a map applied after the question lists, or an extra helper argument, whichever keeps the 200 questions readable); do not renumber or reorder any question id; give every existing `null` tombstone in the unit's `retired` map its concept, because a `conceptsReady` unit may not have `null` tombstones (depends on T092)
- [ ] T094 Pilot unit readiness: set `conceptsReady: true` in `content/units/y11-economics-preliminary/meta.ts` and run `npm run validate` until it passes (depends on T093)
- [ ] T095 Pilot unit explanations, batch 1: add `wrongExplanations` (keyed by option text, one per wrong option, one or two sentences, original wording, no copied exam material) for MC questions `m01` to `m25` in `content/units/y11-economics-preliminary/answers.ts`
- [ ] T096 Pilot unit explanations, batch 2: the same for `m26` to `m50` (depends on T095, same file)
- [ ] T097 Pilot unit explanations, batch 3: the same for `m51` to `m75` (depends on T096, same file)
- [ ] T098 Pilot unit explanations, batch 4: the same for `m76` to `m100` (depends on T097, same file)
- [ ] T099 Pilot unit explanations readiness: set `explanationsComplete: true` in `content/units/y11-economics-preliminary/meta.ts` and run `npm run validate` (depends on T098)
- [ ] T100 [P] Unit `y11-economics-essay-scaffold`: add `concepts.ts` (concepts for the essay skills: introduction, thesis, body structure, evidence, conclusion and the economic themes it tests), tag all 68 prompts, set `conceptsReady: true` and `explanationsComplete: true` (it has no MC questions so explanations are complete by definition), register in `content/index.ts`, run `npm run validate:shipped` and commit `content/shipped-ids.json`, then run `npm run validate`
- [ ] T101 [P] Unit `y11-economics-supply-demand`: add `concepts.ts`, tag every question, register in `content/index.ts`, set `conceptsReady: true`, run `npm run validate:shipped` and commit `content/shipped-ids.json`, then `npm run validate`
- [ ] T102 [P] Unit `y11-formula-test`: add `concepts.ts` (one concept per formula family), tag every question, register in `content/index.ts`, set `conceptsReady: true`, run `npm run validate:shipped` and commit `content/shipped-ids.json`, then `npm run validate`
- [ ] T103 [P] Unit `y11-physics-preliminary`: add `concepts.ts` grouped by its three modules, tag every question, register in `content/index.ts`, set `conceptsReady: true`, run `npm run validate:shipped` and commit `content/shipped-ids.json`, then `npm run validate`
- [ ] T104 [P] Explanations for `y11-economics-supply-demand` MC questions in its `answers.ts`, then set `explanationsComplete: true` and run `npm run validate` (depends on T101)
- [ ] T105 [P] Explanations for `y11-formula-test` MC questions in its `answers.ts`, then set `explanationsComplete: true` and run `npm run validate` (depends on T102)
- [ ] T106 [P] Explanations for `y11-physics-preliminary` MC questions in its `answers.ts`, then set `explanationsComplete: true` and run `npm run validate` (depends on T103)

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, settings, constitution bookkeeping and the final gates.

- [X] T107 [P] Edit `README.md`: add the new routes, `lib/concepts/*` modules and `docs/` additions to the structure table; a "Learn From Mistakes" section covering concept tags, the readiness markers, the weighted quiz rule, the review pipeline, the teacher page and `npm run concept:approve`; the authoring rule that removing any question needs a `retired` tombstone in `concepts.ts` (its concept, or `null` in a unit not yet tagged; a `concepts.ts` may hold only `retired`), and that marking a unit `conceptsReady` means giving every `null` tombstone its concept, and the `content/shipped-ids.json` snapshot with `npm run validate:shipped` (a removed or renumbered id fails the build unless it is tombstoned); and the new settings
- [X] T108 [P] Edit `.env.example`: document `CONCEPT_MODEL`, `ILLUSTRATION_MODEL`, `REVIEW_MODEL` (unset or equal to a generator means nothing is approved), `CONCEPT_DAILY_CAP` (default 100, 0 = off), `CONCEPT_RATE_LIMIT`, `ADMIN_EMAILS` and the non-production-only `OPENROUTER_BASE_URL`; nothing prefixed `NEXT_PUBLIC_`
- [X] T109 Edit the Sync Impact Report comment at the top of `.specify/memory/constitution.md`: mark the README and `.env.example` lines ✅ (depends on T107, T108); change nothing else in the file and do not change the version (this is bookkeeping, not an amendment)
- [X] T110 [P] Review `specs/001-student-saved-scores/{spec,plan,research,data-model,contracts,quickstart,tasks}.md` against constitution 2.9.1 and spec 002: list anything now inaccurate (for example the results timestamp semantics in `contracts/tokens.md`, the "other server-side state" description, and the admin allow-list), fix those lines, and mark the spec 001 line in the Sync Impact Report ✅ when done
- [ ] T111 Run the manual checks in `specs/002-learn-from-mistakes/quickstart.md` end to end against the fake model server (concept counts, weighted draw, the four review modes, caps, teacher routes, MC explanations, late saves) and record any deviation as a fix or a spec note
- [X] T112 Run `npm run build` (includes `gen:formulas` and `validate`), `npm run lint` and `npm test`; fix failures; run `npm audit` and confirm nothing new beyond the accepted `postcss` advisory (the new dependency must add none)
- [ ] T113 Production-mode check from the quickstart: `NODE_ENV=production` with `REVIEW_MODEL` and `ADMIN_EMAILS` unset still serves; `OPENROUTER_BASE_URL` is ignored; a student cannot reach `/admin/concepts`; an illustration URL for a non-live version returns 404

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Phase 1 for T003 only; BLOCKS all user stories
- **US1 (Phase 3)**: depends on Foundational; the MVP
- **US7 (Phase 4)**: depends on Foundational (and uses `lib/db/queries/concepts.server.ts` from US1's T025); can start in parallel with US1 once T025 exists
- **US2 (Phase 5)**: depends on US1 (panel and loaders) and US7 (pipeline and read path)
- **US3 (Phase 6)**: depends on US2 and US7; it verifies and finishes their degraded behaviour
- **US4 (Phase 7)**: depends on US1 (`progress.ts`, results loader); independent of US2, US3, US5, US7
- **US5 (Phase 8)**: depends on Foundational only (types, fixtures); independent of the others; `getReviewMaterial` (T036) and `getOptionExplanation` (T071) share `lib/grading.server.ts`, so do T071 after T036
- **US6 (Phase 9)**: depends on US7 (pipeline, store) and US2 (illustration route pattern); T081 touches auth files used by every route, so merge it carefully
- **Content Rollout (Phase 10)**: T092 to T094 can start after Foundational; later weighting, explanation and pipeline features need only a ready unit to be exercised; every explanation task needs US5 to be visible
- **Polish (Phase 11)**: after the stories you intend to ship

### Within each story

- Tests first and failing, then types/loaders, then services, then routes, then UI
- Edits to the same file are ordered (`lib/db/queries/concepts.server.ts`: T025, T042, T087; `components/ConceptPanel.tsx`: T026, T054; `app/unit/[unitId]/page.tsx`: T028, T056; `app/globals.css`: T027, T055, T074; `lib/concepts/pipeline.server.ts`: T041, T061, T084; `lib/grading.server.ts`: T036, T071)

### Story dependency graph

```text
Foundational ─┬─> US1 ─┬─> US4
              │        └─> US2 ─> US3
              ├─> US7 ──────┘└──> US6
              └─> US5
```

### Parallel opportunities

- Setup T002, T003 and T004 together
- Foundational: T008, T009, T010 and T015 together; T011 after T009; T012 and T014 after T011/T005
- US1 tests T017 to T020 together; T026 and T027 together
- US7 tests T029 to T034 together; implementation T036, T037 and T038 together, then T039, then T040
- US2 tests T044 to T048 together; T051, T052 and T055 together
- US3 tests T057 to T060 together
- US4 tests T062 and T063 together
- US5 tests T067 to T069 together; T074 alongside T073
- US6 tests T076 to T080 together; T086, T088 and T090 together
- US4 and US5 can proceed in parallel with US7/US2/US3 by different people
- Content rollout T100 to T103 (and later T104 to T106) in parallel, different folders

---

## Parallel Example: User Story 7

```bash
# Launch all tests for User Story 7 together:
Task: "Write tests/usage-concept.test.ts (cap reservation, refund, global counter)"
Task: "Write tests/concepts/store.test.ts (lease, promotion, single replacement)"
Task: "Write tests/concepts/svg.test.ts (allowlist and rendering)"
Task: "Write tests/concepts/llm.test.ts (prompts, parsing, pass rule, pre-check)"
Task: "Write tests/concepts/pipeline.test.ts (the review state machine)"
Task: "Write tests/concepts/visibility.test.ts (students read only approved live content)"

# Then the three independent modules:
Task: "Add getReviewMaterial in lib/grading.server.ts"
Task: "Create lib/concepts/svg.server.ts"
Task: "Create lib/concepts/precheck.ts"
```

---

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1 (Setup; T001 to T003 can wait until US7) and Phase 2 (Foundational)
2. Phase 3 (US1) and Phase 10's T092 to T094 for the pilot unit
3. **STOP and VALIDATE**: a student sees their weak concepts with counts, ordered correctly, on the pilot unit; counts follow the rule; late saves keep answer order
4. Deploy: this alone changes no existing behaviour for units that are not `conceptsReady`

### Incremental delivery

1. MVP (US1) → Deploy
2. US7 then US2 then US3 (P1 complete): reviewed explanations appear; turn on `REVIEW_MODEL` last, so nothing is approved until the reviewer is configured
3. US4 (weighted quizzes) → Deploy; this changes averages, best, latest and trend for students with weak concepts (accepted, FR-043)
4. US5 (MC explanations), which can ship at any point after Foundational, unit by unit through Phase 10
5. US6 (teacher page) once there is content to review; until then the SQL queries and `approve-concept` are enough
6. Phase 10 continues unit by unit; Phase 11 before the final merge

### Parallel team strategy

1. One person on Setup and Foundational, then split:
   - A: US1, then US4
   - B: US7, then US2, then US3, then US6
   - C: US5, then content rollout
2. Merge `lib/db/queries/concepts.server.ts`, `app/unit/[unitId]/page.tsx` and `app/globals.css` changes in the order listed above

---

## Quality gate coverage

| Gate (constitution 2.9.1) | Tasks |
|---|---|
| `npm run build`, `npm run lint`, `npm test` pass | T112 |
| No answer-key leakage into client bundles | T036, T068, T071, T073 |
| Client sends only the fields Principle I allows; server verifies tokens | T044, T045, T050 (no new body fields), existing grade tests unchanged |
| Secrets read only in permitted server-side locations | T010, T035, T060, T108 |
| Retention endpoint meets Principle II | unchanged; T008 pins no user columns on concept tables |
| Every new route requires a session | T044, T045, T046, T077, T083 and the existing `tests/auth/route-guard.test.ts` |
| Every results query scoped to the session user (or `ADMIN_EMAILS`) | T018, T022, T025, T064 |
| No new personal-data fields beyond Principle II's list | T006, T008 |
| No renumbered question ids | T009, T011, T012, T013 (the shipped-id snapshot checked by `validate`), T112 |
| LLM path enforces the daily cap | existing `tests/api/grade-cap.test.ts`, T058 |
| No MC explanation in any client bundle | T067, T068, T069 |
| Illustrations rendered only through `<img>` | T046, T048 |
| Concept generation enforces its own cap | T029, T033, T057 |
| Test: students can only read their own results | T018, T020 |
| Test: admin routes reject non-allowlisted emails | T076, T077 |
| Test: production fails closed when auth/DB config is missing | T059 |
| Test: the daily cap falls back to self-marking | existing `tests/api/grade-cap.test.ts`, T058 |
| Test: the concept cap falls back to descriptions only | T057, T058 |
| Test: concept counts follow the rule | T017 |
| Test: the regenerate route rejects non-allowlisted emails | T077 |
| Test: an item that fails review twice is never shown to students | T033, T034, T057 |

## Notes

- [P] tasks = different files, no dependencies on unfinished tasks
- [Story] label maps each task to its user story for traceability
- Each user story should be completable and testable on its own, given the stated dependencies
- Verify tests fail before implementing
- Commit after each task or logical group (you make the commits)
- Stop at any checkpoint to validate a story independently
- Avoid: vague tasks, same-file conflicts between parallel tasks, any code path that shows a version that is not live and approved

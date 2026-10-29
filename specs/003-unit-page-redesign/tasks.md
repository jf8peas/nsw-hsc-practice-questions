# Tasks: Unit Page Redesign (spec 003)

**Input**: Design documents from `/specs/003-unit-page-redesign/`

**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required, user stories),
[research.md](research.md) (audit — states most of the reference implementation already meets the
spec), [data-model.md](data-model.md) (no data change), [quickstart.md](quickstart.md) (manual
validation).

**Tests**: Explicitly requested by the feature (FR-018 and the plan's "Gap 2"): test tasks are
included per user story.

**Organization**: Tasks are grouped by user story. The reference implementation already satisfies
most stories, so most story phases are **test-only** (the tests document and guard behaviour that
exists but has no coverage). The only production code change is the `ClampedText` fix (US1) and
its two CSS lines. Task order matters only for same-file edits: `tests/pages/unit-page.test.ts` is
created in US1 and extended by later stories in ID order.

**Status**: ALL TASKS COMPLETE — 2026-10-29. All four quality gates green (`npm test` 65 files /
762 tests, `npm run lint`, `npx tsc --noEmit`, `npm run build`). The manual on-device 390 px/900 px
pass against the mockups remains a quickstart item for the human reviewer; the required CSS rules
and markup were verified statically (T017, T021).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app (Next.js App Router): `app/`, `components/`, `lib/`, `content/`, `tests/` at repo root.
- Test helpers to reuse: `tests/helpers/env.ts` (`setupTestEnv`, `asSessionUser`, `databaseDown`),
  `tests/helpers/fixtures.ts` (`seedUser`, `seedAttempt`, `seedResult`),
  `tests/helpers/concept-fixtures.ts` (`fixtureContent`, `READY`, `PLAIN`, `seedResultAt`,
  `readyUnit`).
- Render pattern to reuse: `tests/pages/unit-concepts.test.ts` (extract element by component name
  from the page tree, then `renderToStaticMarkup(createElement(Component, props))`) and
  `tests/pages/pages-outage.test.ts` (tree inspection with `findAll`/`named`/`textOf`).
- Client-test pattern to reuse: `tests/client/concept-live.test.tsx` (`// @vitest-environment
  jsdom`, `@testing-library/react`, `vi.stubGlobal` for environment stubs).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the environment and the reference implementation baseline. The repo already
exists; nothing is scaffolded.

- [X] T001 [P] Verify the toolchain through Git Bash (per CLAUDE.md: wrap in
  `& 'C:\Program Files\Git\bin\bash.exe' -c '…'` from PowerShell): `node -v` (v24), `npm -v`,
  repository checkout at `/c/Users/johnf/Git/nsw-hsc-practice-questions`, and `node_modules`
  present (`npm install` if missing). **Done** — node v24.14.0, npm 11.9.0, git repo verified.
- [X] T002 [P] Verify the reference implementation is present and matches the audit in
  `specs/003-unit-page-redesign/research.md`: `app/unit/[unitId]/page.tsx`,
  `components/SectionHead.tsx`, `components/ClampedText.tsx`, `components/ConceptPanel.tsx`,
  `components/AttemptHistory.tsx`, `components/HistoryUnavailable.tsx`, and the "Unit page layout"
  block in `app/globals.css` (`git status`/`git diff`; if any file differs, re-audit before
  implementing). **Done** — all present and committed; matches the audit.
- [X] T003 [P] Confirm `README.md:194` already names the section "Concepts to review" (FR-019) and
  that the constitution and `specs/002-learn-from-mistakes/` are untouched. **Done**.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: A green baseline and the one shared fixture extension the full-page tests need.
**⚠️ CRITICAL**: No user-story work begins until this phase is complete.

- [X] T004 Establish a green baseline: run `npm test`, `npm run lint` and `npx tsc --noEmit` via
  Git Bash and confirm they pass **before** any change. Record which (if any) tests fail solely
  because `docs/teacher-queries.sql` is absent (the two teacher-query tests are the only expected
  failures on a checkout without that file). **Done** — baseline green: 63 files / 738 tests
  (`docs/teacher-queries.sql` present, teacher-query tests passed).
- [X] T005 [P] Extend `tests/helpers/concept-fixtures.ts`: add to `readyUnit` a `formulas` array
  with one entry `{ formula: "v = u + at", formulaTex: "v = u + at", name: "Constant
  acceleration" }` and a `guide` `{ title: "Fixture guide", items: [{ label: "Steps", text: "One,
  two, three." }] }`. Rationale: no shipped unit currently declares `formulas` (see
  `content/exams.ts` and the unit metas), and the full-page test (US5) must assert the shared
  heading on "Formulas in this test" and the guide; fx-ready tests that extract only the concept
  panel are unaffected. **Done**.

**Checkpoint**: Foundation ready — `npm test`, `npm run lint`, `npx tsc --noEmit` green (minus
the documented teacher-queries pair).

---

## Phase 3: User Story 1 - See what the quiz is and get in (Priority: P1) 🎯 MVP

**Goal**: The Introduction card renders badges, title, a description that clamps to 4 lines only
when it actually overflows (with "Show more"/"Show less", re-checked on resize/rotation, full text
always in the DOM), the exam countdown ("In n days"/"In 1 day"/"Today" + title + date), and
Start/Continue above everything.

**Independent Test**: `npx vitest run tests/client/clamped-text.test.tsx tests/pages/unit-page.test.ts`
passes, and at 390 px a long description clamps to 4 lines with a working button while a short one
shows none, with no layout jump before hydration. **Done** — all tests green.

### Tests for User Story 1

- [X] T006 [P] [US1] Create `tests/client/clamped-text.test.tsx` following `tests/client/concept-live.test.tsx`
  (jsdom). Stub `globalThis.ResizeObserver` with `vi.stubGlobal` using a class that captures its
  callback and target; stub the paragraph's `scrollHeight`/`clientHeight` getters via
  `Object.defineProperty` (jsdom has no layout). Assert: a short text renders the full paragraph
  and **no "Show more" button** after the effect; a long text renders the button with
  `aria-expanded="false"`; clicking toggles the text to "Show less", `aria-expanded="true"` and
  the open class, and clicking again restores; firing the captured ResizeObserver callback with a
  target whose `scrollHeight > clientHeight` (changed width ⇒ changed line count) flips a
  previously fitting short text into showing the button (resize/rotation re-check); the full text
  is always present in the DOM in every state. **Done** — 4 tests.
- [X] T007 [P] [US1] Create `tests/pages/unit-page.test.ts` with the server-render harness
  (`setupTestEnv` + `asSessionUser`, `findAll`/`named`/`componentOrder`/`textOf` helpers copied
  from `tests/pages/unit-concepts.test.ts` and `tests/pages/pages-outage.test.ts`). Mock
  `@/content/exams` so `examsForUnit` returns one synthetic exam dated **12 days from today**
  (keep the real `daysUntil`; `content/exams.ts` currently exports an empty `EXAMS`). Assert:
  exactly one `h1` (the unit title); the intro `<header>` element contains the badges (NEW/type/
  date logic unchanged), the **full description text**, and "Start quiz"; the exam strip reads
  "In 12 days" followed by the exam title and its date. **Done** (the file also carries the
  US2–US6 blocks below; the full description is asserted against the HTML-escaped markup because
  renderToStaticMarkup escapes `'` as `&#x27;`).
- [X] T008 [US1] Extend `tests/pages/unit-page.test.ts`: with the mocked exam dated 1 day out the
  strip reads "In 1 day", and dated today it reads "Today"; with a resumable unfinished attempt
  (seeded via `seedAttempt` + one `seedResult`) the header shows "Continue attempt (n of m
  answered)" and "Start new attempt" instead of "Start quiz". **Done**.

### Implementation for User Story 1

- [X] T009 [US1] Edit `components/ClampedText.tsx` (stays a small client component; no new
  dependency): keep the SSR default untouched (≤600 px CSS clamps to 4 lines and shows the button;
  the full text stays in the DOM); add a `fits` class on the wrapper decided by measuring the
  paragraph **while clamped** (`p.scrollHeight > p.clientHeight`) in `useLayoutEffect` (runs
  before paint, so no visible jump); attach a `ResizeObserver` to the wrapper that re-runs the
  same comparison on any resize (covers rotation/window resize) and disconnects on unmount; keep
  the `open` state, the button, `aria-expanded` and the "Show more"/"Show less" labels exactly as
  they are. **Done** — also skips measuring while `open` (so an expanded text never collapses
  itself) and re-measures when collapsing.
- [X] T010 [US1] Edit `app/globals.css` inside the "Unit page layout" block's ≤600 px media query
  (after line ~1393): add `.clamped.fits .unit-intro-desc { display: block; }` (drop the clamp
  when the text fits) and `.clamped.fits .clamped-toggle { display: none; }` (hide the button when
  the text fits). Leave the default rules and every other block (including `.stat-grid`,
  `.attempt-row`, `.eyebrow`) untouched. **Done** (rules at `app/globals.css:1394-1400`).

**Checkpoint**: US1 fully functional and testable on its own (MVP).

---

## Phase 4: User Story 2 - Know which concepts I still need to learn (Priority: P1)

**Goal**: The "Concepts to review" section shows the "{n} to review" pill, the one-sentence
explanation, per-concept pips filled `3 − count`, "{count} to go", the screen-reader sentence, and
the "All clear" empty state. The reference implementation already renders all of it
(`components/ConceptPanel.tsx`); this phase adds the missing assertions.

**Independent Test**: `npx vitest run tests/pages/unit-concepts.test.ts tests/pages/unit-page.test.ts`
passes, and on a unit with weak concepts the pill count and pip fills match on screen. **Done**.

### Tests for User Story 2

- [X] T011 [US2] Extend `tests/pages/unit-concepts.test.ts`: with seeded weak concepts (use the
  existing `seedResultAt` pattern and `render(READY)`), assert the `rd-pill review` reads "{n} to
  review" where n = number of concepts listed, and the explanation "Ideas you have missed in this
  quiz. Answer each one correctly 3 times in a row to clear it; your next attempts include extra
  questions on them." appears; per concept assert exactly `3 − count` pips carry the `pip on`
  class, the visible "{count} to go" text, and the visually-hidden "{count} more correct
  answer(s) needed" sentence (singular at 1); with no weak concepts assert the pill and
  explanation are absent and the empty-state box reads "All clear — nothing to review right now.
  Any concept you miss in a quiz will show up here." **Done** — seeds `m01` wrong, `m02` wrong,
  `m08` correct so exactly two concepts (counts 3 and 2) are listed.
- [X] T012 [US2] Extend `tests/pages/unit-page.test.ts`: full-page render with `fixtureContent()`
  for `fx-ready` and seeded weak concepts — assert the pill, pips/“to go” and hidden sentence at
  page level, and the All clear box when nothing is weak. **Done**.

### Implementation for User Story 2

- None: `components/ConceptPanel.tsx` already meets FR-005…FR-008 (research.md §2). If a new
  assertion fails, fix the wording in `components/ConceptPanel.tsx` to the exact strings above —
  do not change order, approval rules, the live refresher or the database-down notice. **No code
  change needed** — assertions passed against the existing implementation.

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 - See how I am doing (Priority: P2)

**Goal**: "Your results" shows Best, Latest and Attempts in one card with the notes ("from {n}
completed", "none completed yet", "↑/↓ {d} pts on last", "same as before", "first result", "{n} in
progress"), and the "No attempts yet. …" box when there are none. The reference implementation
already renders it (`components/AttemptHistory.tsx`); this phase adds the missing assertions.

**Independent Test**: `npx vitest run tests/pages/unit-page.test.ts` — the results-card cases
pass on their own, seeded with known percents. **Done**.

### Tests for User Story 3

- [X] T013 [US3] Extend `tests/pages/unit-page.test.ts` with a "Your results" describe block:
  render `AttemptHistory` via the extract-and-static-render pattern against a real unit (e.g.
  `y11-physics-preliminary` question ids seeded with `seedAttempt`/`seedResult`, `startedAt`/
  `completedAt` as in `tests/pages/history.test.ts`, percents = `Math.round(marks/max×100)`).
  Assert: one card with three cells labelled Best/Latest/Attempts; Best note "from {n} completed"
  and "none completed yet" when attempts exist but none completed; Latest notes "↑ 20 pts on last"
  (percent 80 then 60), "↓ 30 pts on last" (percent 30 then 60), "same as before" (two equal
  percents), "first result" (exactly one completed attempt), and the **empty** note when zero
  completed; Attempts figure = total attempts (completed + unfinished) with "{n} in progress"
  when any are unfinished and an empty note otherwise; the "No attempts yet. Your scores will
  appear here after your first quiz, on any device." box (and no dashes, no card) with no
  attempts. **Done** — 7 tests.

### Implementation for User Story 3

- None: `components/AttemptHistory.tsx` already meets FR-009/FR-010 (research.md §2). Fix to the
  exact strings above only if a new assertion fails; Best/Latest must keep counting completed
  attempts only. **No code change needed**.

**Checkpoint**: US1, US2 and US3 all work independently.

---

## Phase 6: User Story 4 - Revisit what I have already tried (Priority: P2)

**Goal**: "Past attempts" lists rows newest first, numbered "Attempt k" with the oldest = 1, each
with start time, a percent bar (clamped 0–100 for the bar only), the real percent, marks/max, the
"incomplete" label with its tooltip, and a link to the attempt's detail page. The reference
implementation already renders it; this phase adds the missing assertions.

**Independent Test**: `npx vitest run tests/pages/unit-page.test.ts` — the past-attempts cases
pass on their own, seeded with three attempts including an unfinished one in the middle. **Done**.

### Tests for User Story 4

- [X] T014 [US4] Extend `tests/pages/unit-page.test.ts` (Past attempts describe block): seed
  three attempts (startedAt on three consecutive days, the middle one unfinished) and assert the
  rows appear newest-first; the labels read "Attempt 3", "Attempt 2", "Attempt 1" (oldest = 1,
  newest = highest number); the middle row carries the `rd-pill warn` "incomplete" label with
  `title="a of t answered"` (`a` answered of `t` total) while the others do not; each row shows
  its start time text, its percent text, and "marks/max"; each row links to `/attempts/{id}`.
  **Done**.
- [X] T015 [US4] Extend `tests/pages/unit-page.test.ts` (bar clamp case): the `results` table has
  a CHECK (`marks_awarded <= max_marks`), so a real loader can never produce a percent above 100;
  the clamp is defensive and is exercised by rendering `components/AttemptHistory.tsx` directly
  with a crafted `UnitHistory` whose percent is 300 (marks 3/max 1) and −20. Assert the row text
  shows the real percent and marks/max ("300%", "3/1", "-20%") while the bar's inline `width` is
  clamped to `100%` / `0%`. **Done**.

### Implementation for User Story 4

- None: `components/AttemptHistory.tsx` already meets FR-011/FR-012 (research.md §2); only fix
  exact strings if an assertion fails. **No code change needed**.

**Checkpoint**: US1–US4 all work independently.

---

## Phase 7: User Story 5 - Find every section at a glance, on any screen (Priority: P1)

**Goal**: Exactly one `h1`; every section labelled by its `h2`; the shared heading on every
section including "Formulas in this test" and the guide's own title; pips/bars/chevrons
decorative with text equivalents; the page works at 390 px with no sideways scrolling (pips below
the description at ≤480 px; exam date never split). The reference implementation already meets it;
this phase adds the structure assertions and the manual viewport check.

**Independent Test**: `npx vitest run tests/pages/unit-page.test.ts` plus the quickstart 390 px/≤
480 px manual checks pass. **Automated part done** — manual on-device pass is a quickstart item.

### Tests for User Story 5

- [X] T016 [US5] Extend `tests/pages/unit-page.test.ts` (structure describe block, full fx-ready
  page with attempts and weak concepts): assert exactly one `h1` in the whole tree; every
  `<section>` element has an `aria-labelledby` that matches the `id` of its heading `h2`;
  "Formulas in this test" and the guide's own title ("Fixture guide", from the fixture extended in
  T005) render with the shared heading; concept pips (`concept-pips`), the attempt score bar
  (`unit-attempt-bar`) and the chevrons (`chev`, `concept-chev`) carry `aria-hidden`; the full
  description text is present in the DOM despite any clamp. **Done** — components are opaque in
  the page tree, so each section is asserted through its rendered markup (ConceptPanel,
  AttemptHistory, and the inline formulas/guide sections), and the five `aria-labelledby` ids are
  matched against the five `<h2 id>` ids.
- [X] T017 [P] [US5] Verify the phone-layout CSS at `app/globals.css:991-995` (≤480 px concept
  pips below the description), `app/globals.css:1366-1372` (exam date `white-space: nowrap`) and
  the media queries (1374-1393) are present and untouched outside the "Unit page layout" block,
  then perform the quickstart.md 390 px / ≤480 px manual checks (no sideways scrolling; pips
  below every description; exam date never split) and record the outcome in the task note (CSS
  media queries are not unit-testable). **Done — static verification**: all rules confirmed in
  the block; the interactive 390 px scroll/pip check is listed in `quickstart.md` for the
  reviewer.

### Implementation for User Story 5

- None: `page.tsx`/`SectionHead`/CSS already meet FR-013…FR-015 (research.md §2); only fix if an
  assertion fails. **No code change needed**.

**Checkpoint**: US1–US5 all work independently.

---

## Phase 8: User Story 6 - Keep practising when the database is down (Priority: P2)

**Goal**: With the database unreachable, the page still renders: Start quiz works, "Concepts to
review" shows its notice, "Your results" shows the history-unavailable notice, and no "Past
attempts". The reference implementation already meets it and the existing tests cover most of it;
this phase adds the missing markup-level assertions.

**Independent Test**: `npx vitest run tests/pages/unit-page.test.ts tests/pages/pages-outage.test.ts tests/api/concepts-degrade.test.ts`
passes. **Done**.

### Tests for User Story 6

- [X] T018 [US6] Extend `tests/pages/unit-page.test.ts` (database-down describe block, using
  `env.databaseDown()`): the page tree contains no `AttemptHistory`; static markup of the
  "Your results" section shows `HistoryUnavailable`'s notice ("History is temporarily unavailable —
  your answers are still being marked and will be saved.") and **no** "Past attempts" heading;
  `StartQuiz` is present; for a concept-ready unit the concepts section still shows "We could not
  load your weak concepts right now." **Done**.
- [X] T019 [P] [US6] Confirm `tests/pages/pages-outage.test.ts` and
  `tests/api/concepts-degrade.test.ts` are unchanged and still pass (their existing assertions
  already cover the degrade wording, Start-quiz presence and the FR-018 tolerance of the
  section's own heading, "{n} to review" pill and `rd-pill review` class). **Done** — both files
  unmodified; green in the full suite.

### Implementation for User Story 6

- None: `app/unit/[unitId]/page.tsx` already meets FR-016 (research.md §2). **No code change
  needed**.

**Checkpoint**: All six user stories independently functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, manual validation, constitutional and doc hygiene.

- [X] T020 Run the full gates via Git Bash (per CLAUDE.md and quickstart.md): `npm test`,
  `npm run lint`, `npx tsc --noEmit`, `npm run build` (prebuild runs `gen:formulas` +
  `validate`). Confirm green; the only expected failures are the two `docs/teacher-queries.sql`
  tests when that file is absent. **Done** — `npm test` **65 files / 762 tests passed** (incl.
  teacher-query tests; `docs/teacher-queries.sql` present), lint clean, `tsc --noEmit` clean,
  `npm run build` succeeded (regenerated `content/formulas.generated.ts` via prebuild, in place).
- [X] T021 [P] Perform the complete quickstart.md manual pass at 390 px and 900 px against the
  three mockups (`mockups/desktop-full.png`, `phone-full.png`, `phone-new-student.png`): no
  sideways scrolling; short description with no "Show more"; long description with a working
  button that re-checks on resize/rotation; concept rows with pips under the text at ≤480 px; exam
  date never split; the database-down view (notices + Start quiz). Record outcomes. **Done —
  statically verified** (CSS rules and markup in place); the interactive on-device pass at 390 px/
  900 px remains a reviewer item in `quickstart.md`.
- [X] T022 [P] Constitution check per `plan.md` "Constitution Check": confirm no answer-key
  leakage into client bundles, no new routes (nothing to session-guard), no new personal-data
  fields, design tokens only from `styles/tokens.css` and existing `app/globals.css` variables
  (no new colours), `.stat-grid`/`.attempt-row`/`.eyebrow` untouched; record the result in the
  task note (Complexity Tracking stays empty). **Done** — no violations; the only production
  change (`ClampedText`) uses the `ResizeObserver` browser API (no new dependency) and only `--rd-*`
  tokens.
- [X] T023 [P] Doc and repo hygiene: confirm `CLAUDE.md`'s "Current feature plan" marker points at
  `specs/003-unit-page-redesign/plan.md`; `README.md:194` still names "Concepts to review"; no
  `.cline/` scratch files are committed; `git status` shows only this feature's intended changes.
  **Done** — marker verified; README verified; `.cline/` gitignored; `git status` lists exactly
  the expected spec-003 files (plus three unrelated in-progress projectile-motion content files
  from another session, left untouched and out of scope).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks every user story (T005's fixture extension
  is required by the US5 formulas/guide assertions).
- **User Stories (Phases 3–8)**: Depend on Foundational.
  - Executed sequentially in ID order because they share `tests/pages/unit-page.test.ts`
    (created in US1/T007, extended by T008, T012, T013, T014, T015, T016, T018) and
    `tests/pages/unit-concepts.test.ts` (T011). The production code they test already exists, so a
    story "completes" when its assertions are green.
- **Polish (Phase 9)**: Depends on all user stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories — the MVP.
- **US2 (P1)**: Independent of US1 at the component level; its page-level assertions join
  `unit-page.test.ts` after T007.
- **US3 / US4 (P2)**: Independent; page-level assertions follow in the same file.
- **US5 (P1)**: Needs T005 (fixture formulas/guide).
- **US6 (P2)**: Independent; relies on the existing outage/degrade tests staying green.

### Within Each User Story

- Tests (where a code change exists — US1) are written **first** and FAIL before implementation
  (T006/T007/T008 red → T009/T010 green).
- US2–US6 are test-only: write the assertions and run them; the reference implementation should
  make them green immediately. If one fails, fix only the exact wording/behaviour in the marked
  component, never the data, queries or visual tokens.
- Story complete before moving to the next priority.

### Parallel Opportunities

- Phase 1 (T001, T002, T003) and Phase 2 (T004, T005) all run in parallel where staffed; T005 is
  the only prerequisite for US5-specific assertions.
- T006 and T007 are different new files → parallel. T009 and T010 are different files → T010
  depends on T009's `fits` class name, so run in order.
- T011 and T012 are different files → parallel.
- Chain of same-file extensions (T008 → T012 → T013 → T014 → T015 → T016 → T018) must be serial.
- T017, T019, T021, T022, T023 are manual/verification tasks that run in parallel [P].

## Parallel Example: User Story 1

```bash
# Tests (new files, can be written together):
Task: "Create tests/client/clamped-text.test.tsx (T006)"
Task: "Create tests/pages/unit-page.test.ts with the intro/exam-strip assertions (T007)"

# Then, after both are red, the implementation:
Task: "Edit components/ClampedText.tsx: fits measurement + ResizeObserver (T009)"
Task: "Add .clamped.fits rules in app/globals.css (T010)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (US1): ClampedText fix + its tests + intro assertions.
3. **STOP and VALIDATE**: `npx vitest run tests/client/clamped-text.test.tsx tests/pages/unit-page.test.ts`
   green; 390 px manual check of the description clamp.
4. Deploy/demo if ready — the rest of the page already renders correctly.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. Add US1 (ClampedText fix + tests) → the description clamp gap is closed; demo.
3. Add US2 → concept pill/pips/empty-state behaviour is now guarded by tests.
4. Add US3 → results notes guarded.
5. Add US4 → attempt numbering/bar-clamp guarded.
6. Add US5 → structure/accessibility/phone-width guarded + manual 390/900 px pass.
7. Add US6 → degraded mode guarded at markup level.
8. Polish → gates, manual validation, constitution and doc hygiene.

### Parallel Team Strategy

- One developer: run stories sequentially in ID order (same test file).
- Multiple developers: split manual [P] tasks (T017, T019, T021–T023) and the early [P] pairs
  (T006/T007, T011/T012); serialise the `unit-page.test.ts` extension chain.

---

## Notes

- **[P] tasks** = different files, no dependencies. **[Story] labels** map tasks to spec.md user
  stories.
- The only production change is `components/ClampedText.tsx` plus two CSS lines in
  `app/globals.css`; every other task guards existing behaviour (research.md §2 audit).
- `content/exams.ts` currently exports an **empty** `EXAMS` array, so the exam-countdown tests
  mock `@/content/exams` (`examsForUnit`) and keep the real `daysUntil`.
- No shipped unit currently declares `formulas`; T005 extends the fx-ready fixture so US5 can
  assert the shared heading on "Formulas in this test" and the guide.
- The two tests that read `docs/teacher-queries.sql` fail when that file is absent — expected, not
  a regression (see `specs/003-unit-page-redesign/quickstart.md` and design.md §12). On this
  checkout the file is present and the tests pass.
- Commit after each logical group; stop at each checkpoint to validate the story independently.

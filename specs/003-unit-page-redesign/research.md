# Research: Unit Page Redesign (spec 003)

**Created**: 2026-10-29 · **Branch**: `003-unit-page-redesign` · **Spec**: [spec.md](spec.md) · **Design**: [design.md](design.md)

## 1. Purpose and method

Spec 003 restructures `/unit/[unitId]` into four clearly separated sections. The reference
implementation listed in design.md §12 is present in the working tree and is being kept, so the
plan starts from it. This document audits that implementation requirement by requirement against
spec.md — every functional requirement (FR-001…FR-019) and every acceptance scenario — records
what already meets the spec and what does not, and records the decisions for the gaps. The plan's
implementation steps fall straight out of this audit.

**Files audited**

- `app/unit/[unitId]/page.tsx` — section order, introduction card, degraded branches.
- `components/SectionHead.tsx`, `components/ClampedText.tsx`, `components/ConceptPanel.tsx`,
  `components/AttemptHistory.tsx`, `components/HistoryUnavailable.tsx`.
- `app/globals.css` — the "Unit page layout" block (≈ lines 1295–1574) plus the concept styles,
  and the untouched `.stat-grid`, `.attempt-row`, `.eyebrow` rules used by `/progress` and others.
- Tests: `tests/pages/unit-concepts.test.ts`, `tests/pages/pages-outage.test.ts`,
  `tests/api/concepts-degrade.test.ts`, `tests/pages/history.test.ts`, `README.md`.
- Read-only inputs: `lib/db/queries/history.server.ts` (`UnitHistory`/`AttemptSummary`),
  `lib/stats.ts` (`attemptPercent`, `bestLatest`), `lib/format.ts` (`formatWhen`,
  `HISTORY_UNAVAILABLE`), `tests/helpers/concept-fixtures.ts` (`fx-ready`/`fx-plain`).

## 2. Audit: functional requirements

### FR-001 Sections in order — **Meets**
`page.tsx:44-128` renders, in order: the introduction `<header class="rd-card unit-intro">`
(badges → title → description → exam strips → start-actions), `ConceptPanel` (concepts), then
`AttemptHistory` (Your results + Past attempts) or, when degraded, a "Your results" section with
`HistoryUnavailable`, then Formulas in this test, then the unit guide. `unit-concepts.test.ts:141-150`
keeps the existing page-order test (StartQuiz → ConceptPanel → results/history). Start/Continue
stays above Concepts to review, which stays above results/history, as today (design §2).

### FR-002 Introduction card — **Meets**
`page.tsx:46-84`. One `rd-card` with the badges (NEW when `unitIsNew`, unit type, created date),
the `h1` title, the `ClampedText` description, one exam strip per exam, and the start actions
("Start quiz", or "Continue attempt (n of m answered)" plus "Start new attempt" when a resume
exists — labels unchanged).

### FR-003 Description clamp + Show more/less — **Partial (one gap, decision §5.1)**
`ClampedText.tsx` renders a `<p>` with the **full text always in the DOM** and a real
`<button class="clamped-toggle" aria-expanded>` toggling "Show more"/"Show less" plus an `open`
class. `app/globals.css:1384-1392`: at ≤600 px `.clamped:not(.open) .unit-intro-desc` is clamped
to 4 lines with `-webkit-line-clamp`; ≥600 px the full text shows and the button is
`display:none` (1323-1333, 1390-1392). Because the clamp is CSS, the server-rendered page looks
right before JavaScript runs and no layout jump moves Start quiz for a long description.
**Gap (spec US1 scenario 3a; design §4):** the button is shown on every ≤600 px screen even when
the text fits in 4 lines, and visibility is never re-checked on resize/rotation.

### FR-004 Exam countdown — **Meets**
`page.tsx:60` renders `"Today"` / `"In 1 day"` / `In ${d} days` from `daysUntil`, followed by the
exam title and date. `globals.css:1366-1372`: the date is mono 12 px mute-500,
`margin-left:auto`, `white-space:nowrap` (wraps as a whole, never split).

### FR-005 Concepts to review heading, pill, explanation — **Meets**
`ConceptPanel.tsx:64-74` uses `SectionHead` with title **"Concepts to review"**, aside
`rd-pill review` reading "{n} to review" only when concepts exist, and the agreed explanation
"Answer each one correctly 3 times in a row to clear it; your next attempts include extra
questions on them." under the "Ideas you have missed in this quiz." opener.

### FR-006 Pips, "to go", screen-reader sentence — **Meets**
`ConceptProgress` (`ConceptPanel.tsx:21-36`): three `.pip` bars, `.pip.on` for each earned
(`earned = 3 − count`), `.concept-togo` "{count} to go"; both are `aria-hidden`, and a
`.visually-hidden` span carries "{count} more correct answer(s) needed" (singular at 1,
`countLabel`). `globals.css:975-989`: pip 14×6 px, radius 3 px, 3 px apart, `.on` success-500,
rest border-200 grey.

### FR-007 Approved-summary disclosure — **Meets**
`ConceptPanel.tsx:97-123`: native `<details>/<summary>` with a `.concept-chev` (decorative) after
"to go"; opened content is the approved bullets and any approved illustration only as an `<img>`
(with alt, `loading="lazy"`). No review status, model or error text in the markup.
`globals.css:1151-1203`: marker hidden, chevron 7 px / 1.5 px mute-500 border rotating on
`[open]` (animated 0.15 s), the open divider runs edge to edge, hover surface-50, focus-visible
outline preserved. Existing tests (`unit-concepts.test.ts:186-256`) cover bullets, `<img>` only,
pending/failed-review invisibility and the no-secrets rule.

### FR-008 Concepts states and unchanged behaviour — **Meets**
`ConceptPanel.tsx:76-136`: database unavailable → `.notice` with "We could not load your weak
concepts right now."; none → `.section-empty` "All clear — nothing to review right now. Any
concept you miss in a quiz will show up here."; concepts → `ul.concept-list` in the loader's order
(highest count first, then most recently missed — unchanged); unit not concept-ready → the whole
section returns `null` (56). The live refresher `ConceptLive` renders only when progress and view
are ok and concepts exist (128-135), unchanged. Tests: `unit-concepts.test.ts:71-151`.

### FR-009 Your results card and notes — **Meets**
`AttemptHistory.tsx:31-58`: one `rd-card stat-strip` split into three equal columns with 1 px
border-100 dividers. Best figure + note "from {n} completed" / "none completed yet"; Latest figure
+ change note "↑ {d} pts on last" / "↓ {d} pts on last" / "same as before" / "first result" /
empty; Attempts figure = total attempts + note "{n} in progress" / empty. Best and Latest count
**completed attempts only** via `lib/stats.ts:bestLatest` (unchanged rule). The up/down colour
classes always accompany the arrow and words, so nothing is conveyed by colour alone.

### FR-010 No-attempts sentence; database-down notice — **Meets**
`AttemptHistory.tsx:26-30`: with no attempts the card is not rendered; a `.section-empty` shows
"No attempts yet. Your scores will appear here after your first quiz, on any device." — no
dashes. With the database unreachable, `page.tsx:90-97` renders "Your results" +
`HistoryUnavailable` (wording from `lib/format.ts:36-37`). Covered by
`pages-outage.test.ts:65-85`.

### FR-011 Past attempts heading — **Meets**
`AttemptHistory.tsx:61-67`: rendered only when `attempts.length > 0`, with title "Past attempts"
and explanation "Open an attempt to see each of your answers with its marks and feedback."

### FR-012 Past-attempt rows — **Meets**
`AttemptHistory.tsx:68-98`: rows are `<Link href={/attempts/${a.id}}>` (opens the detail page);
label "Attempt {attempts.length − i}" so the oldest attempt is 1 and the newest has the highest
number; the warn pill "incomplete" (title "a of t answered") appears when `completedAt` is null;
start time from `formatWhen`; the bar is `aria-hidden` with width
`Math.max(0, Math.min(100, a.percent))%` — **clamped for the bar only** — while the score text
shows the real rounded percent and "marks/max"; the chevron "›" is decorative.

### FR-013 Shared heading everywhere — **Meets**
`SectionHead` opens every section after the introduction: Concepts to review (`ConceptPanel:66`),
Your results and Past attempts (`AttemptHistory:24,63`), Formulas in this test and the guide
(`page.tsx:101,117`). The page no longer uses `.eyebrow` (those rules at `globals.css:179` are
left untouched for other pages). The introduction's title is the page `h1`, not a `SectionHead` —
by design.

### FR-014 Accessibility — **Meets**
One `h1` (`page.tsx:52`); every section is a `<section aria-labelledby={heading-id}>`
(ConceptPanel:64, AttemptHistory:23,62, page.tsx:93,100,116); pips, the score bar and chevrons
are `aria-hidden` with their meaning present as text; the "needed" sentence is visually hidden but
readable; "Show more" is a real `<button>` with `aria-expanded`; the change note has an arrow and
words; the concept summary keeps its focus-visible outline.

### FR-015 390 px, no sideways scroll — **Meets in code; confirmed manually (quickstart)**
No fixed-width content; `.concept-desc` takes the full row at ≤480 px so pips drop below,
left-aligned, for every row (`globals.css:991-995`); the exam date is `white-space:nowrap`; stat
cells have `min-width:0`; the attempt bar shrinks to 56 px at ≤480 px (1570-1574). The actual
"no sideways scrolling at 390 px" property is a rendering check done against the phone mockups in
the quickstart manual pass — CSS media queries are not assertable in the unit tests.

### FR-016 Degraded database — **Meets**
`page.tsx:30-39` turns both loaders into `{status:"unavailable"}` when the session is degraded;
Start quiz is untouched; ConceptPanel shows its notice; the results section shows
`HistoryUnavailable` and no Past attempts. Tests: `unit-concepts.test.ts:132-139`,
`pages-outage.test.ts:65-85`, `concepts-degrade.test.ts:196-218`.

### FR-017 No data/query/tracking/other-page change — **Meets**
No schema, query, loader or route change exists in the working tree: the page still calls
`loadUnitHistory`, `loadUnitConceptProgress` and `loadConceptContentViewForPage`; `/progress`,
attempt detail and quiz pages, `lib/stats.ts` and `lib/format.ts` are unchanged. Concept tracking,
weighting and history semantics are exactly spec 002's.

### FR-018 Test updates — **Meets (already applied; new coverage is gap §5.2)**
- `unit-concepts.test.ts` uses the heading "Concepts to review" (81, 103, 137) and keeps the
  page-order test (141-150).
- `concepts-degrade.test.ts:79-81`: `NO_ERROR` is unchanged, and `withoutHeading` strips the
  section's own `Concepts to review`, `\d+ to review` and `rd-pill review` before matching, so the
  checks (95, 125, 159) still catch any genuine reviewer status, error or generation wording
  without being fooled by the section's own pill. All degrade scenarios (cap, generator failure,
  reviewer scenarios, fail-twice, secrets) are unchanged.

### FR-019 README rename — **Meets**
`README.md:194` already reads: `"Concepts to review" on the unit page lists the student's
uncleared concepts`. The constitution and spec 002 are untouched (the phrase "Things you need to
know" remains only in old docs and code comments, exactly as the spec allows).

## 3. Audit: acceptance scenarios

- **US1 (Introduction) 1–6**: met. **3a is the one gap** — the button must appear only when the
  text is actually cut off and must re-check on resize/rotation (§5.1).
- **US2 (Concepts to review) 1–9**: met (`unit-concepts.test.ts` covers the list, order, singular
  sentence, positive message, cross-unit isolation, per-student isolation, not-ready absence,
  database-down notice, page order, and the approved-content rules). The pill text, per-pip fill
  and "{count} to go" are rendered but not yet asserted — hardened in §5.2.
- **US3 (Your results) 1–6**: met in code; **no automated test asserts the notes** (from {n}
  completed / none completed yet / ↑ / ↓ / same as before / first result / {n} in progress) →
  gap §5.2.
- **US4 (Past attempts) 1–6**: met in code; **no test asserts "Attempt k" numbering with an
  unfinished attempt in the middle, the 0–100 bar clamp, or the percent/marks text** → gap §5.2.
- **US5 (Shared headings, a11y, phone width) 1–6**: met in code; tests do not yet assert one h1,
  every section labelled by its h2, the shared heading on Formulas in this test and the guide, or
  the full description in the DOM → gap §5.2; the ≤480 px pip layout and 390 px no-scroll are
  confirmed in the quickstart manual pass.
- **US6 (Database down) 1–3**: met and covered (FR-016).

**SC-002 sanity check (new student):** with no attempts and no weak concepts, ConceptPanel shows
the All clear box and AttemptHistory shows "No attempts yet. …"; the results card (the only place
"—" could appear) is not rendered at all, so a new student never sees dashes.

## 4. Decisions

### 4.1 Gap 1 — ClampedText must show the button only when the text is cut off

**Required** (spec US1 scenario 3a; design §3/§4): at ≤600 px a description that fits in 4 lines
shows in full with no button; a longer one is clamped to 4 lines with "Show more"; both states
re-check on resize and rotation; the full text stays in the HTML; the page looks right before
JavaScript runs with no layout jump that moves Start quiz.

**Decision — keep `ClampedText` a small client component, no new dependency (ResizeObserver is a
web platform API), and let CSS own the visuals:**

1. Keep the current SSR default: at ≤600 px the CSS already clamps to 4 lines and shows the
   button; ≥600 px shows the full text. The full text is always in the DOM. For a long
   description this default state is final and correct, so nothing moves before hydration.
2. In the component, measure the paragraph **while clamped**: text is cut iff
   `p.scrollHeight > p.clientHeight` (with `-webkit-line-clamp` the overflow stays in
   `scrollHeight`). Add a `fits` class to the wrapper when the text fits; remove it when it does
   not.
3. Run the measurement in `useLayoutEffect` so the correction happens **before the browser
   paints** — a short description's button is removed with no visible jump (the text height is
   unchanged because it already fit; the button disappears, so Start quiz never visibly moves).
4. Attach a `ResizeObserver` to the wrapper and re-run the same comparison whenever the element
   resizes — this covers orientation change and window resizing, since the width (and therefore
   the line count) changes with the element. Disconnect on unmount.
5. CSS addition inside the "Unit page layout" block's ≤600 px media query:
   - `.clamped.fits .unit-intro-desc { display: block; }` (drop the clamp when it fits),
   - `.clamped.fits .clamped-toggle { display: none; }` (hide the button when it fits).
   The default rules (clamped + button) are untouched.
6. `aria-expanded` and the open/close behaviour are unchanged: pressing the button toggles the
   `open` class (the clamp is `:not(.open)`-based), and the full text stays in the DOM at all
   times.

**Alternatives rejected:** server-side length estimation (wrong at many widths; duplicates layout
logic); a plain `resize` listener instead of `ResizeObserver` (works but less precise and misses
container/font changes); a CSS-only solution (CSS cannot know whether text fits in 4 lines).

### 4.2 Gap 2 — tests for behaviour the reference implementation added but nothing tests yet

**Decision — add two test files** (scaffolding in the plan):

1. `tests/pages/unit-page.test.ts` — server-renders the real page (the `renderToStaticMarkup`
   pattern from `unit-concepts.test.ts`, using the real content units as `pages-outage.test.ts`
   does, plus `fixtureContent()` where a concept-ready unit is needed) and asserts the markup
   nothing tests today:
   - section order and headings: exactly one `h1` at the top; every section is a
     `<section aria-labelledby>` whose heading id matches; the shared heading appears on "Formulas
     in this test" and the guide too;
   - the introduction: badges, the **full description text in the DOM**, the exam strip wording
     "In n days" / "In 1 day" / "Today" with the exam title and date, and Start/Continue;
   - Your results notes, seeded with known percents and completion times: "from {n} completed",
     "none completed yet", "↑ {d} pts on last", "↓ {d} pts on last", "same as before",
     "first result", "{n} in progress", and the empty note for zero completed;
   - Past attempts: newest-first order, "Attempt k" numbering with the oldest = 1 and the newest =
     highest, an **unfinished attempt in the middle** still labelled "incomplete" with its
     "a of t answered" tooltip, the start time, the percent, marks/max, and `/attempts/{id}`
     hrefs;
   - the bar clamp: seed a result whose marks exceed its max (insert the row directly if the
     fixture helper caps marks ≤ max) so percent > 100 → the bar width is capped at 100 % while
     the text shows the real percent and marks;
   - concepts: the "{n} to review" pill, the pips with the right number of `.on`
     (`3 − count`), "{count} to go", and the visually-hidden "{count} more correct answer(s)
     needed" sentence;
   - empty states: "All clear — …" with no weak concepts and "No attempts yet. …" with no
     attempts; Past attempts absent with no attempts and when the database is down (assert the
     missing heading at markup level rather than duplicating `pages-outage`'s component-existence
     checks).
2. `tests/client/clamped-text.test.tsx` — jsdom + `@testing-library/react` (both already in
   devDependencies):
   - stub `globalThis.ResizeObserver` (jsdom lacks it) with a class that records its callback;
   - a short text renders the full paragraph and, after the effect runs, **no "Show more"
     button**;
   - a long text renders the button with `aria-expanded=false`; clicking swaps to "Show less"
     with `aria-expanded=true` and toggles the open class; clicking again restores;
   - invoking the recorded observer callback (simulating an element resize where
     `scrollHeight > clientHeight`) flips the button on, proving the resize/rotation re-check;
   - the full text is always present in the DOM regardless of state.

**Keep untouched:** the page-order test (`unit-concepts.test.ts:141-150`) and the degrade-test
change (`withoutHeading` + `NO_ERROR`) — their assertions are final per FR-018.

### 4.3 No data-model or API-contract change

**Decision:** there is **no data-model change and no API-contract change**. Everything renders
from the existing loaders and content helpers — `loadUnitHistory`, `loadUnitConceptProgress`,
`loadConceptContentViewForPage`, `getUnit`, `conceptsOf`, `examsForUnit`, `daysUntil` — and from
the unchanged statistics helpers. No schema, query, weighting, tracking or route change; the only
new client-side behaviour is the measurement inside `ClampedText`, which is already a client
component. Per the plan instruction, **no `contracts/` directory is created** (no empty
contracts), and [data-model.md](data-model.md) records "no change" with the consumed shapes.

### 4.4 Constitution conformance at design time

- **Principle VI (graceful degradation):** every degrade path verified unchanged (FR-016); a
  database outage never blocks Start quiz, and the concepts and history notices are preserved.
- **Principle VIII (simplicity, mobile-first):** no new dependency (ResizeObserver is a browser
  API); the mobile-first order and Start-above-reference placement are unchanged; and an audit of
  the new CSS block found only existing `--rd-*` variables (all from `styles/tokens.css` and the
  existing `app/globals.css` variables, including `--rd-review-*` for the pill) — **no new
  colours**.
- Server components stay server components; the only client code is `ClampedText`, `ConceptLive`
  and `StartQuiz` (unchanged).
- CSS stays in `app/globals.css` under the "Unit page layout" block; `.stat-grid`, `.attempt-row`
  and `.eyebrow` are untouched because `/progress` and other pages still use them.

## 5. Open items

- **`docs/teacher-queries.sql`**: two tests read it and fail when it is absent (design.md §12
  note). It is not part of this feature; `quickstart.md` calls it out so the two failures are
  not mistaken for regressions.
- The 390 px / 900 px visual results are validated by hand against the three mockups
  (`mockups/desktop-full.png`, `phone-full.png`, `phone-new-student.png`) as the quickstart
  describes; no automated CSS/layout testing is part of this feature.

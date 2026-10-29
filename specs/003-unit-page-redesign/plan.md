# Implementation Plan: Unit Page Redesign

**Branch**: `003-unit-page-redesign` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md) | **Design**: [design.md](design.md) | **Research**: [research.md](research.md)

**Input**: Feature specification from `/specs/003-unit-page-redesign/spec.md`

## Summary

Restructure `/unit/[unitId]` into four clearly separated sections — Introduction, Concepts to
review, Your results, Past attempts — with Formulas in this test and the unit guide below, all
using one shared section-heading style, exact on-screen wording from design.md, and the guarantee
that the page works at 390 px with no sideways scrolling and degrades gracefully when the
database is unreachable.

**There is no data-model change and no API-contract change**: the page renders existing data from
the unchanged loaders (`loadUnitHistory`, `loadUnitConceptProgress`,
`loadConceptContentViewForPage`) and content helpers, and nothing else changes — no schema,
query, weighting, concept-tracking, home-page, `/progress`, attempt-detail or quiz changes. No
`contracts/` directory is created (empty contracts are not produced).

The reference implementation listed in design.md §12 is **present in the working tree and is
being kept**. The plan starts from it. The requirement-by-requirement audit in
[research.md](research.md) shows it already meets FR-001, FR-002, FR-004…FR-019 and every
acceptance scenario except one: **`ClampedText` shows the "Show more" button on every ≤600 px
screen even when the description fits in 4 lines, and never re-checks on resize or rotation**
(FR-003 / US1 scenario 3a). The work is therefore:

1. Fix `ClampedText` so the button (and clamp) appear only when the text is actually cut off,
   re-checked on resize/rotation, with no layout jump before JavaScript runs and the full text
   always in the DOM.
2. Add the tests the reference implementation's new behaviour has no coverage for yet (Your
   results notes, Attempt k numbering, bar clamp, pips, empty states, headings/labelled sections,
   `ClampedText` itself).
3. Keep the existing page-order test and the degrade-test change (FR-018) exactly as they are.
4. Confirm the README rename (already applied: README.md:194), and validate the 390 px / 900 px
   result by hand against the three mockups (quickstart).

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Next.js 15 (App Router), Node 24 (Git Bash
toolchain per CLAUDE.md).

**Primary Dependencies**: none added. `ResizeObserver` is a web platform API. Existing packages
used by the tests: `vitest`, `jsdom`, `@testing-library/react` (all already in
devDependencies). No state library, no new runtime dependency (constitution VIII).

**Storage**: Neon Postgres via the existing drizzle schema — unchanged; no migrations, no new
tables or columns.

**Testing**: Vitest. Server components are rendered with `react-dom/server`'s
`renderToStaticMarkup` over extracted component props, exactly as `tests/pages/unit-concepts.test.ts`
does; the client `ClampedText` is tested in jsdom with `@testing-library/react` as the existing
`tests/client/*` tests do. Test helpers already present: `setupTestEnv`/`asSessionUser`/
`databaseDown` (tests/helpers/env.ts), `seedUser`/`seedAttempt`/`seedResult`
(tests/helpers/fixtures.ts), and `fixtureContent`/`READY`/`PLAIN`/`seedResultAt`
(tests/helpers/concept-fixtures.ts).

**Target Platform**: evergreen browsers; mobile-first at 390 px (no sideways scrolling) and
desktop at 900 px, per the mockups.

**Performance Goals**: the page stays server-rendered; the only new client work is one small
element measurement in `ClampedText`, run before first paint so Start quiz never visibly moves
(no layout jump).

**Constraints**:
- Constitution 2.10.0 — in particular Principle VI (degrade gracefully), Principle VIII
  (simplicity — no new dependencies; mobile-first with Start quiz above reference material), and
  design tokens only from `styles/tokens.css` and the existing `app/globals.css` variables
  (including `--rd-review-*`): **no new colours**.
- No change to data loading, queries, concept tracking, weighting, the home page, `/progress`,
  attempt detail or quiz pages.
- Server components stay server components; the only client code is `ClampedText` (and the
  existing `ConceptLive` and `StartQuiz`).
- CSS stays in `app/globals.css` under the "Unit page layout" block; the old `.stat-grid`,
  `.attempt-row` and `.eyebrow` rules are left alone because `/progress` and other pages still use
  them.
- Exact on-screen wording comes from design.md/spec.md; every visual detail below is from
  design.md and must not be guessed.

**Scale/Scope**: one page (`app/unit/[unitId]/page.tsx`), its components, the "Unit page layout"
CSS block, two new test files, and confirmatory checks. `README.md` is already renamed.

## Constitution Check

*GATE: passed before Phase 0 research; re-checked after Phase 1 design below.*

| Principle | Status | Notes |
|---|---|---|
| I. Answer key never reaches the browser | ✅ | Presentation-only change; no new client payloads; illustration routes and grading untouched |
| II. Signed-in students, minimal personal data | ✅ | No new per-student fields; concept counts stay derived from results; sessions untouched (spec 002 rule kept) |
| III. Content is code | ✅ | No content or id changes; units, concepts and questions untouched |
| IV. Validation gates the build | ✅ | No content conventions change; `npm run validate` still passes |
| V. Syllabus fidelity, original content | ✅ | No content touched |
| VI. Grading fair, explainable, graceful | ✅ | All degrade paths verified unchanged (FR-016); a database outage keeps Start quiz working, the concepts notice and the history-unavailable notice, and no Past attempts |
| VII. Cost and abuse controls | ✅ | No new paid paths; degrades/ensure/status routes untouched |
| VIII. Simplicity | ✅ | No new dependency (ResizeObserver is a browser API); mobile-first order kept; tokens only from `styles/tokens.css` + existing variables — no new colours |
| IX. Teacher access server-side | ✅ | Teacher routes untouched |

**Quality gates** (constitution "Quality Gates"): `npm run build` (runs `gen:formulas` +
`validate` via `prebuild`), `npm run lint` and `npm test` must pass. No answer-key leakage (no
client payload changes), no new routes (so no session/authorization additions), no new
personal-data fields, no renumbered ids, scoped results queries unchanged. Authorization and
cost-control logic is untouched, so its existing test coverage stands.

## Project Structure

### Documentation (this feature)

```text
specs/003-unit-page-redesign/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 audit of the reference implementation (/speckit-plan output)
├── data-model.md        # Phase 1 output: no data-model change, consumed shapes
├── quickstart.md        # Phase 1 output: manual 390/900 px checks + quality gates
├── design.md            # Visual and wording reference (agreed)
├── spec.md              # Requirements (final)
├── mockups/             # desktop-full.png, phone-full.png, phone-new-student.png
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

No `contracts/` directory: there is no data-model or API-contract change, and empty contracts are
not created.

### Source Code (repository root)

```text
app/
└── unit/[unitId]/page.tsx             # kept: section order, introduction card, degraded branches

components/
├── SectionHead.tsx                    # kept: shared heading (title, optional sub, optional aside)
├── ClampedText.tsx                    # EDIT: show the button only when the text is cut off
├── ConceptPanel.tsx                   # kept: heading/pill/explanation, pips, chevron, states
├── AttemptHistory.tsx                 # kept: Your results + Past attempts
└── HistoryUnavailable.tsx             # kept: database-down notice

app/globals.css                        # EDIT: "Unit page layout" block only (clamped.fits rules)
                                       # .stat-grid / .attempt-row / .eyebrow untouched

tests/
├── pages/unit-page.test.ts            # NEW: full-page render tests (research §4.2)
├── client/clamped-text.test.tsx       # NEW: ClampedText button state + aria-expanded
├── pages/unit-concepts.test.ts        # kept (heading + page-order already updated)
├── pages/pages-outage.test.ts         # kept
├── api/concepts-degrade.test.ts       # kept (withoutHeading + NO_ERROR already updated)
└── pages/history.test.ts              # kept (query layer, unchanged)
```

**Structure Decision**: keep the existing layout exactly as it is — no new source directories, no
new dependencies. `SectionHead` stays a single shared server component; `ClampedText` stays a
small client component; tests follow the existing `tests/pages/` (server render) and `tests/client/`
(jsdom) split.

## Visual specification (from design.md — implementation must not guess)

All colours, radii, fonts and shadows come from `styles/tokens.css` and the existing `app/globals.css`
variables. **No new colours.** Tokens referenced below are the existing `--rd-*` variables.

### Page structure and rhythm

- Section order MUST be: Introduction → Concepts to review → Your results → Past attempts →
  Formulas in this test (only when the unit has formulas) → Unit guide (only when the unit has a
  guide). Start/Continue stays above Concepts to review; Concepts to review stays above
  results/history (existing page-order test).
- Sections are separated by **40 px** of space (`.unit-section { margin-top: 40px }`). No
  dividers and no boxes around headings; section headings are not cards.

### Shared section heading (every section after the introduction)

- **Title**: an `h2` in the display font (`--rd-font-display`), **19 px**, weight **700**,
  letter-spacing **−0.3 px**, colour **ink-900** (`--rd-ink-900`).
- **Explanation** (optional): one sentence underneath, **13.5 px**, **mute-500**
  (`--rd-mute-500`), line-height **1.5**, at most about **62 characters** wide (max-width 62ch).
- **Aside** (optional): an item on the right, **top-aligned** (the heading block is a flex row
  with `align-items: flex-start`, `justify-content: space-between`, gap 12 px; the aside is
  `flex: 0 0 auto` with 3 px top padding — used for the "n to review" pill).
- The heading `id` is the section's `aria-labelledby`.
- This heading style replaces the mono uppercase "eyebrow" labels on this page, including
  "Formulas in this test" and the guide title.

**Empty-state box** (sections 2 and 3): **16 px** padding, **1 px dashed** border (**border-200**),
radius **md** (`--rd-r-md`), text **13.5 px mute-600**, line-height 1.5. A plain sentence — never
a row of dashes, never an error colour.

### Section 1: Introduction

One white card (`rd-card`, `--rd-shadow-1`, padding **24 px**; on screens ≤ 600 px padding
**18 px × 16 px**), top to bottom:

1. **Badges**: `NEW` (only when the unit is new), unit type, created date — unchanged pills
   (`rd-pill new-pill`, `rd-pill blue`, `rd-pill date-pill`).
2. **Title**: the page `h1`, display font, **28 px** (≤ 600 px: **24 px**), **14 px above, 8 px
   below** (`margin: 14px 0 8px`).
3. **Description**: **14.5 px** (≤ 600 px: **14 px**), **mute-600**, line-height **1.6**, max
   about **70 characters** wide (max-width 70ch), **20 px below** (margin-bottom 20 px).
   - On screens ≤ 600 px, **if it is longer than 4 lines**, it is cut to **4 lines** with an
     ellipsis (`-webkit-line-clamp: 4` on a `-webkit-box` display) and a **"Show more"** text
     button underneath: **blue-500** (`--rd-blue-500`), **13.5 px**, weight **500**, no button
     chrome (border 0, background none, padding 0), `margin-top: 4px`, pointer cursor.
   - A description that **fits in 4 lines shows in full with no button** (this is the one gap the
     plan closes — research §4.1), **re-checked on resize and rotation** (ResizeObserver).
   - Pressed, it shows the full text and becomes **"Show less"**; the button carries
     `aria-expanded`.
   - On wider screens the full text shows and the button is hidden (CSS only).
   - **The full text is always in the HTML** (clamped only visually).
4. **Exam countdown** (one strip per exam, unchanged data): a **blue-50** (`--rd-blue-50`) strip,
   radius **md**, padding **10 px × 14 px**, **12 px** below.
   - Left: "In 12 days" / "In 1 day" / "Today", display font **15 px**, weight **700**,
     **blue-600**.
   - Then the exam title, **13.5 px ink-700**.
   - Right-aligned: the date in mono (**`--rd-font-mono`**), **12 px**, **mute-500**, **never
     broken across lines** (`white-space: nowrap`, `margin-left: auto` — it wraps as a whole to
     its own line on narrow screens).
5. **Start / Continue**: unchanged behaviour and labels ("Start quiz", or "Continue attempt
   (n of m answered)" plus "Start new attempt"), **full card width**, **8 px apart**.

### Section 2: Concepts to review

Replaces "Things you need to know". Name matches the "n to review" pill on the home page.

- **Heading**: title "Concepts to review". The **aside** (only when at least one concept is
  listed) is the existing **`rd-pill review`** (orange tint, `--rd-review-*`) reading **"{n} to
  review"**, n = number of concepts listed. The **explanation** (only when at least one concept is
  listed) is:
  > Ideas you have missed in this quiz. Answer each one correctly 3 times in a row to clear it;
  > your next attempts include extra questions on them.
- **Each concept** (a row in the existing white bordered list; order unchanged: highest count
  first, then most recently missed):
  - Left: the concept's one-line description, **14 px**, weight **500**.
  - Right: **progress pips** — three small bars (**14 × 6 px**, radius **3 px**, **3 px apart**);
    one bar fills **green (success-500, `--rd-success-500`)** for each correct answer already
    earned towards clearing it; the rest are **border-200 grey**. Earned = **3 − count**, so a
    count of 3 shows none filled, 2 shows one, 1 shows two.
  - After the pips: **"{count} to go"** in mono (`--rd-font-mono`), **12 px**, **mute-600**.
  - The pips and the "to go" text are **hidden from screen readers** (`aria-hidden`). Instead a
    visually hidden sentence reads **"{count} more correct answer(s) needed"** (singular at 1, the
    existing wording).
  - On screens **≤ 480 px** the description takes the full row and the pips sit on the line
    below, **left-aligned, for every row** (consistent rather than some rows wrapping and some
    not).
- **A concept with an approved summary** (native `<details>`, unchanged content rules):
  - The summary row looks like any other row, plus a small chevron after "to go" (**7 px, 1.5 px
    mute-500 border**), pointing **down** when closed and **up** when open, **animated 0.15 s**.
  - The `<details>` fills the row's full width (the open divider runs edge to edge).
  - Hover on the summary row: **surface-50** background.
  - Opened: the existing bullets and picture, unchanged (picture only as an `<img>`).
- **States**:

  | State | Shows |
  |---|---|
  | One or more concepts | Heading with pill and explanation, then the list |
  | None | Heading only, then an empty-state box: "All clear — nothing to review right now. Any concept you miss in a quiz will show up here." |
  | Database unavailable | Heading only, then the existing notice "We could not load your weak concepts right now." |
  | Unit not concept-ready | Whole section absent (unchanged) |

- Unchanged: the live refresher (`ConceptLive`), approval rules, `<img>` only for pictures,
  nothing about review status, models or errors in the markup.

### Section 3: Your results

- **Heading**: title "Your results", no explanation.
- **With attempts**: one white card (`rd-card`) split into **three equal columns** with **1 px
  border-100** dividers (no separate boxes; a CSS grid `repeat(3, 1fr)`, cells have
  `border-left: 1px solid border-100` except the first). Each column padding **16 × 18 px**
  (≤ 480 px: **14 × 12 px**):
  - Label, **12.5 px**, weight **500**, **mute-500**.
  - Figure, display font (**`--rd-font-display`**), **30 px** (≤ 480 px: **24 px**), weight
    **700**, letter-spacing **−0.5 px**, **ink-900**; margin 2 px 0.
  - Note, **12 px**, **mute-500**, always taking **one line of height** (min-height 1.4 em) so the
    columns line up; "up" notes colour **success-500**, "down" notes **danger-500**
    (`--rd-danger-500`) *alongside* the arrow and words (never colour alone).

  | Column | Figure | Note |
  |---|---|---|
  | Best | best completed % or "—" | "from {n} completed", or "none completed yet" |
  | Latest | latest completed % or "—" | "↑ {d} pts on last" (success-500), "↓ {d} pts on last" (danger-500), "same as before"; "first result" when exactly one is completed; empty when none |
  | Attempts | total attempts, including unfinished | "{n} in progress" when any are unfinished, else empty |

  Best and latest count **completed attempts only** (unchanged rule, `lib/stats.ts`).
- **No attempts**: no card. An empty-state box: "No attempts yet. Your scores will appear here
  after your first quiz, on any device."
- **Database unavailable**: the heading, then the existing `HistoryUnavailable` notice. Section 4
  (Past attempts) is not shown.

### Section 4: Past attempts

Shown only when there is at least one attempt.

- **Heading**: title "Past attempts", explanation: "Open an attempt to see each of your answers
  with its marks and feedback."
- **Each attempt** (newest first, unchanged order and link to `/attempts/{id}`), a white bordered
  row, radius **md**, padding **12 × 14 px**, **14 px gaps**, hover **surface-50**:
  - Left, stacked:
    - **"Attempt {k}"**, **14 px**, weight **600**, where k counts from **1 for the oldest
      attempt** (so the newest has the highest number). Unfinished attempts add the existing
      **`incomplete` warn pill** beside it (**tooltip "a of t answered"**).
    - The start time from `formatWhen`, **12.5 px**, **mute-500**.
  - **Score bar**: **96 px** wide (≤ 480 px: **56 px**), **6 px** tall, radius 3 px,
    **surface-200** track, **blue-500** fill at the attempt's percent **(clamped 0–100 for the bar
    only**; the text shows the real figures). Hidden from screen readers (`aria-hidden`).
  - **Score**, right-aligned and stacked: the percent in display font, **17 px**, weight **700**,
    then "marks/max" in mono, **12 px**, **mute-500**.
  - Chevron "›", **mute-400** (`--rd-mute-400`), decorative.

The `/progress` page keeps its own attempt rows (`.attempt-row`); this redesign does not touch it.

## Implementation approach (from research.md decisions)

1. **ClampedText: button only when the text is cut off** (FR-003, US1 3a)
   - Edit `components/ClampedText.tsx` (stays a small client component, no new dependency):
     - keep the SSR default (≤600 px CSS already clamps to 4 lines and shows the button; the full
       text is always in the DOM);
     - measure the paragraph while clamped in `useLayoutEffect` (before paint): cut iff
       `p.scrollHeight > p.clientHeight`; toggle a `fits` class on the wrapper;
     - attach a `ResizeObserver` to the wrapper and re-run the same comparison on resize (covers
       rotation/window resize/container changes); disconnect on unmount;
     - keep the `open` state, the button, `aria-expanded` and the "Show more"/"Show less" labels
       exactly as they are.
   - Edit `app/globals.css` inside the "Unit page layout" block's ≤600 px media query:
     - `.clamped.fits .unit-intro-desc { display: block; }` (drop the clamp when it fits),
     - `.clamped.fits .clamped-toggle { display: none; }` (hide the button when it fits).
     Defaults (clamped + button at ≤600 px, full + hidden button ≥600 px) stay untouched.
2. **Tests for the new behaviour** (research §4.2):
   - New `tests/pages/unit-page.test.ts` — full-page server render: section order and headings
     (one `h1`, every section `aria-labelledby` its `h2`, shared heading on Formulas and the
     guide), introduction markup (badges, full description in the DOM, exam strip wording
     "In n days"/"In 1 day"/"Today" + title + date, Start/Continue), Your results notes (up /
     down / same / first result / none completed / {n} in progress / "from {n} completed"), Past
     attempts ("Attempt k" numbering with oldest = 1, unfinished attempt in the middle labelled
     "incomplete" with its tooltip, newest-first, start time, percent, marks/max, `/attempts/{id}`
     hrefs), the bar clamp (percent > 100 seeds a bar capped at 100 % while the text shows the
     real percent and marks), concepts (pill, pip `.on` count = 3 − count, "to go", hidden
     sentence), and the empty states ("All clear", "No attempts yet.") with Past attempts absent
     (no attempts; database down).
   - New `tests/client/clamped-text.test.tsx` — jsdom + `@testing-library/react`: a
     `globalThis.ResizeObserver` stub (jsdom lacks it); short text → no button after the effect;
     long text → button with `aria-expanded=false`, toggle to "Show less"/`aria-expanded=true`
     and back; invoking the recorded observer callback to simulate a resize flips the button on;
     the full text stays in the DOM throughout.
   - Keep `unit-concepts.test.ts` (page-order test and "Concepts to review" wording), the
     degrade-test change (`withoutHeading` + `NO_ERROR`), `pages-outage.test.ts` and
     `history.test.ts` unchanged in what they assert.
3. **Confirm the no-change side** — no edits to `page.tsx`, `SectionHead.tsx`, `ConceptPanel.tsx`,
   `AttemptHistory.tsx`, `HistoryUnavailable.tsx`, queries, stats, content or other pages unless
   a new test exposes a real mismatch (the audit says none exists).
4. **README** — already updated (README.md:194); verify only.
5. **Validate** — full suite, lint, type check and build through Git Bash (quickstart.md).

## No data-model or API-contract change

Stated explicitly per the feature instruction: this feature introduces **no data-model change and
no API-contract change**. All figures render from the existing loaders and content helpers and the
unchanged statistics in `lib/stats.ts`; no schema, query, weighting, tracking or route changes;
no new client/server boundary beyond the measurement that is already inside the client
`ClampedText`. Consequently **no `contracts/` directory is created** and
[data-model.md](data-model.md) documents "no change" with the consumed shapes.

## Complexity Tracking

No constitution violations to justify — the Complexity Tracking table is intentionally empty. The
only behavioural change (ClampedText) uses a standard browser API with no new dependency, keeps
server components server-side, and touches only the "Unit page layout" CSS block.

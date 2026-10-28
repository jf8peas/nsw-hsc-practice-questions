# Design: Unit Page Redesign

**Feature folder**: `specs/003-unit-page-redesign`
**Created**: 2026-10-29
**Status**: Design agreed; input to `/speckit-specify` (see `specify-prompt.md`)
**Page**: `/unit/[unitId]` (`app/unit/[unitId]/page.tsx`)

This is the visual and wording reference for the redesign. `spec.md` (written by
`/speckit-specify`) states the requirements; this file pins down exactly what the page looks like
and says, so the plan and tasks do not have to guess. Where the two disagree, `spec.md` wins and
this file should be corrected.

## 1. Problem

The unit page grew one feature at a time, and its parts are stacked with no structure:

- The badges, title and long description run straight into the Start button, and on a phone the
  description pushes "Start quiz" well down the screen.
- "Things you need to know" uses the same small grey uppercase label as everything else, so it
  does not read as a section. Each concept ends in a long mono line ("3 more correct answers
  needed") that repeats on every row and wraps badly on phones.
- Best / Latest / Attempts are three identical boxes with little context ("Attempts 1" next to
  "1 completed"), and they show "—" for a student with no attempts.
- "Your attempts" is a bare list of dates and scores, with no attempt numbers and no sense of how
  each one went.

## 2. Page structure

The page is four sections in this order, followed by the existing reference material:

| # | Section | Heading | Shown when |
|---|---------|---------|------------|
| 1 | Introduction | (the unit title, as the page `h1`) | always |
| 2 | Concepts to review | "Concepts to review" | unit is concept-ready (unchanged rule) |
| 3 | Your results | "Your results" | always |
| 4 | Past attempts | "Past attempts" | the student has at least one attempt |
| – | Formulas in this test | "Formulas in this test" | unit has formulas (unchanged) |
| – | Unit guide | the guide's own title | unit has a guide (unchanged) |

The order Start/Continue → Concepts to review → results/history MUST be kept (constitution:
mobile-first, key actions above reference material; existing page-order test).

Mockups (sample data, rendered from the reference implementation):

- `mockups/desktop-full.png`: 900 px wide, five concepts (one opened), three attempts.
- `mockups/phone-full.png`: 390 px wide, same data, description shortened.
- `mockups/phone-new-student.png`: 390 px wide, no concepts and no attempts.

## 3. Shared section heading

Every section after the introduction opens with the same heading block:

- **Title**: an `h2` in the display font, 19 px, weight 700, letter-spacing −0.3 px, ink-900.
- **Explanation** (optional): one sentence underneath, 13.5 px, mute-500, line-height 1.5, at most
  about 62 characters wide.
- **Aside** (optional): an item on the right, top-aligned (used for the "n to review" pill).
- Sections are separated by 40 px of space. No dividers, no boxes around the heading.
- The heading `id` is used as the section's `aria-labelledby`.

This replaces the mono uppercase "eyebrow" labels on this page, including "Formulas in this
test" and the guide title.

**Empty-state box** (used by sections 2 and 3): 16 px padding, 1 px dashed border-200, radius md,
13.5 px mute-600 text. A plain sentence, never a row of dashes and never an error colour.

## 4. Section 1: Introduction

A single white card (`rd-card`, shadow-1, padding 24 px; 18 px × 16 px on screens ≤ 600 px)
containing, top to bottom:

1. **Badges**: NEW (if new), unit type, created date; unchanged.
2. **Title**: page `h1`, 28 px (24 px on phones), 14 px above, 8 px below.
3. **Description**: 14.5 px (14 px on phones), mute-600, line-height 1.6, max about 70 characters
   wide, 20 px below.
   - On screens ≤ 600 px it is cut to **4 lines** with an ellipsis and a **"Show more"** text
     button (blue-500, 13.5 px, weight 500) underneath. Pressed, it shows the full text and
     becomes **"Show less"**. The button carries `aria-expanded`.
   - On wider screens the full text shows and the button is hidden.
   - The full text is always in the HTML (it is only hidden visually).
4. **Exam countdown** (one strip per exam, unchanged data): a blue-50 strip, radius md, padding
   10 px × 14 px, 12 px below.
   - Left: "In 12 days" / "In 1 day" / "Today", display font 15 px, weight 700, blue-600.
   - Then the exam title, 13.5 px ink-700.
   - Right-aligned: the date in mono 12 px mute-500, never broken across lines (it wraps as a
     whole to its own line on narrow screens).
5. **Start / Continue**: unchanged behaviour and labels ("Start quiz", or "Continue attempt
   (n of m answered)" plus "Start new attempt"), full card width, 8 px apart.

## 5. Section 2: Concepts to review

Replaces "Things you need to know". The name matches the "n to review" pill on the home page.

**Heading**

- Title: **Concepts to review**
- Aside (only when there is at least one concept): the existing `rd-pill review` (orange tint)
  reading **"{n} to review"**, n = number of concepts listed.
- Explanation (only when there is at least one concept):
  > Ideas you have missed in this quiz. Answer each one correctly 3 times in a row to clear it;
  > your next attempts include extra questions on them.

**Each concept** (a row in the existing white bordered list, order unchanged: highest count
first, then most recently missed):

- Left: the concept's one-line description, 14 px weight 500.
- Right: **progress pips**: three small bars (14 × 6 px, radius 3 px, 3 px apart). One bar fills
  green (success-500) for each correct answer already earned towards clearing it; the rest are
  border-200 grey. Earned = 3 − count, so a count of 3 shows none filled, 2 shows one, 1 shows two.
- After the pips: **"{count} to go"** in mono 12 px mute-600.
- The pips and "to go" text are hidden from screen readers. Instead a visually hidden sentence
  reads "{count} more correct answer(s) needed" (singular at 1, the existing wording).
- On screens ≤ 480 px the description takes the full row and the pips sit on the line below,
  left-aligned, for every row (consistent, rather than some rows wrapping and some not).

**A concept with an approved summary** (native `<details>`, unchanged content rules):

- The summary row looks like any other row, plus a small chevron after "to go" (7 px, 1.5 px
  mute-500 border), pointing down when closed and up when open, animated 0.15 s.
- The `<details>` fills the row's full width (the open divider runs edge to edge).
- Hover on the summary row: surface-50 background.
- Opened: the existing bullets and picture, unchanged.

**States**

| State | Shows |
|-------|-------|
| One or more concepts | Heading with pill and explanation, then the list |
| None | Heading only, then an empty-state box: "All clear — nothing to review right now. Any concept you miss in a quiz will show up here." |
| Database unavailable | Heading only, then the existing notice "We could not load your weak concepts right now." |
| Unit not concept-ready | Whole section absent (unchanged) |

Unchanged: the live refresher (`ConceptLive`), approval rules, `<img>` only for pictures, nothing
about review status, models or errors in the markup.

## 6. Section 3: Your results

**Heading**: "Your results", no explanation.

**With attempts**: one white card split into three equal columns with 1 px border-100 dividers
(no separate boxes). Each column, padding 16 × 18 px (14 × 12 px on ≤ 480 px):

- Label, 12.5 px weight 500 mute-500.
- Figure, display font 30 px (24 px on ≤ 480 px), weight 700.
- Note, 12 px mute-500, always taking one line of height so the columns line up.

| Column | Figure | Note |
|--------|--------|------|
| Best | best completed % or "—" | "from {n} completed", or "none completed yet" |
| Latest | latest completed % or "—" | change since the completed attempt before it: "↑ {d} pts on last" (success-500), "↓ {d} pts on last" (danger-500), "same as before"; "first result" when exactly one is completed; empty when none |
| Attempts | total attempts, including unfinished | "{n} in progress" when any are unfinished, else empty |

Best and latest still count completed attempts only (unchanged rule).

**No attempts**: no card. An empty-state box: "No attempts yet. Your scores will appear here after
your first quiz, on any device."

**Database unavailable**: the heading, then the existing `HistoryUnavailable` notice. Section 4 is
not shown.

## 7. Section 4: Past attempts

Shown only when there is at least one attempt.

**Heading**: "Past attempts", explanation: "Open an attempt to see each of your answers with its
marks and feedback."

**Each attempt** (newest first, unchanged order and link to `/attempts/{id}`), a white bordered row
with padding 12 × 14 px and 14 px gaps, hover surface-50:

- Left, stacked:
  - **"Attempt {k}"**, 14 px weight 600, where k counts from 1 for the oldest attempt (so the
    newest has the highest number). Unfinished attempts add the existing `incomplete` warn pill
    beside it (tooltip "a of t answered").
  - The start time from `formatWhen`, 12.5 px mute-500.
- **Score bar**: 96 px wide (56 px on ≤ 480 px), 6 px tall, surface-200 track, blue-500 fill at
  the attempt's percent (clamped 0–100). Hidden from screen readers.
- **Score**, right-aligned and stacked: the percent in display font 17 px weight 700, then
  "marks/max" in mono 12 px mute-500.
- Chevron "›", mute-400.

The `/progress` page keeps its own attempt rows (`.attempt-row`); this redesign does not touch it.

## 8. Accessibility

- One `h1` (unit title); every section is a `<section>` labelled by its `h2`.
- Pips, score bars and chevrons are `aria-hidden`; their meaning is given in text (the "needed"
  sentence; the percent and marks).
- "Show more" is a real `<button>` with `aria-expanded`; the full description is in the DOM.
- No information is given by colour alone (the change note has an arrow and words).
- Focus styles unchanged (the concept summary keeps its focus-visible outline).

## 9. Design tokens

All colours, radii, fonts and shadows come from `styles/tokens.css` and the existing variables in
`app/globals.css` (`--rd-review-50/700` for the pill). No new colours.

## 10. Content and test changes

- README: rename "Things you need to know" to "Concepts to review".
- `tests/pages/unit-concepts.test.ts`: heading text becomes "Concepts to review"; the
  empty-state regex already accepts "All clear".
- `tests/api/concepts-degrade.test.ts`: its "no error/review wording" check must ignore the
  section's own heading ("Concepts to review"), the "{n} to review" pill text and the
  `rd-pill review` class, and still catch any reviewer status, error or generation wording.
- The constitution and spec 002 mention "Things you need to know" as the feature's name. They are
  not rewritten; spec 003 records the new on-screen name.

## 11. Out of scope

- The home page, `/progress`, attempt detail and quiz pages.
- Any change to concept tracking, weighting, history queries or what data is loaded.
- Charts of score over time (possible later; would need two or more completed attempts).

## 12. Reference implementation

A working version of this design was built in the working tree on 2026-10-29 (uncommitted at the
time of writing). If it is still present, the plan can start from it rather than from scratch:

- `app/unit/[unitId]/page.tsx`: introduction card, section order, `SectionHead` on reference sections
- `components/SectionHead.tsx` (new): shared heading
- `components/ClampedText.tsx` (new, client): 4-line description with Show more / Show less
- `components/ConceptPanel.tsx`: heading, pill, explanation, pips, chevron, empty state
- `components/AttemptHistory.tsx`: "Your results" and "Past attempts" sections
- `app/globals.css`: new block "Unit page layout" plus edits to the concept styles
- the README and test changes listed in section 10

Tested against that version: type check and lint clean; full test suite passing apart from two
tests that need `docs/teacher-queries.sql`, which was not in the test copy.

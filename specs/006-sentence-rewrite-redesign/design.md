# Design: Sentence Rewrite Question Redesign

**Feature folder**: `specs/006-sentence-rewrite-redesign`
**Created**: 2026-11-03
**Status**: Design agreed; input to `/speckit-specify` (see `specify-prompt.md`)
**Component**: the rewrite question flow (`components/RewritePanel.tsx`, inside `components/Quiz.tsx`)
**Builds on**: spec 005 (economics sentence writing). Grading rules, the 3-mark criteria, the
phase-2 cap, the hint rules and concept tracking are unchanged unless this file says otherwise.

This is the visual and wording reference. `spec.md` (written by `/speckit-specify`) states the
requirements; this file pins down what the question looks like and says, so the plan and tasks do
not have to guess. Where the two disagree, `spec.md` wins and this file should be corrected.

## 1. Problem

The spec 005 flow works, but the student experience has rough edges (see the before screenshots
supplied in the design conversation):

- **The sentence disappears while it is being marked.** On submit the text box is cleared and
  shows its placeholder and "0/25 words" while the button says "Marking…". The student cannot see
  what they are waiting on. The same happens on the retry.
- **No sense of where you are.** Nothing tells the student that a retry may follow or that the
  flow ends in a comparison.
- **The retry starts from an empty box.** The student retypes their whole sentence to add two
  words.
- **The retry cap is a surprise.** A retry that uses every term scores "2 / 3" with praise-only
  feedback ("Good use of economic terms…"), which reads as a contradiction. The cap is not shown
  before the retry or explained after it.
- **The ending is a stack of repeats.** The terms are listed twice (hint, then "Why these terms
  fit"), the student's sentences sit in two disabled text boxes with resize handles, and the model
  sentence is plain text with nothing to compare it against.

## 2. Flow and states

One question card, five states. Mockups are in `mockups/` (desktop 1280 px and phone 390 px for
each). The editable source is in `mockups/source/` (Claude Design `.dc.html` files; they render
with `design/v001/support.js` copied beside them). The live canvas is
https://claude.ai/artifact/321c1c5AFbvPkGrZRzbqWt.

| # | State | Mockups | When |
|---|-------|---------|------|
| 1 | Writing | `1-writing-*.png` | Question opened, phase 1 not submitted |
| 2 | Marking first try | `2-marking-*.png` | Phase 1 submitted, waiting for the grade |
| 3 | Feedback + retry | `3-feedback-retry-*.png` | Phase 1 graded under 3/3 |
| 4 | Marking retry | `4-marking-retry-*.png` | Phase 2 submitted, waiting for the grade |
| 5 | Result | `5-result-*.png` | Phase 1 at 3/3, or phase 2 graded |

A 3/3 first try goes straight from state 2 to state 5. The self-mark path (grader unavailable)
is covered in section 9.

## 3. Common frame (all states)

> **Type follows the site (2026-11-03).** After implementation the font sizes below were found to
> be larger than the rest of the quiz page. The panel now uses the quiz page's type roles instead,
> and the sizes in this file are superseded: question text 15 px (as `.q-prompt`); body, feedback,
> sentences, definitions and the text box 14 px (as `.feedback`, `.q-textarea`); small labels mono
> 9.5 px uppercase (as `.model-answer .label`); marks in the display font at 16 px (as
> `.feedback-score`); term names in the display font at 15 px; help and note lines 12–12.5 px;
> pills as `.rd-pill`; buttons as `.rd-btn` type (14 px, weight 500) but kept 48 px tall for the
> 44 px target. The panel no longer draws its own bordered card inside the question card.

Unchanged from the current quiz page: header, five-segment progress bar, the
"Sentence rewrite · 3 marks" pill and "Question 3 of 5". The question card is a single bordered
card (radius 16, padding 28, `--rd-border-100`, `--rd-shadow-1`) in a column 880 px max wide.

### 3.1 Step tracker

The first row of the card. Three steps joined by short rules:

| Step | Label (current) | Label (done) |
|------|-----------------|--------------|
| 1 | Write | Write · 2/3 |
| 2 | Retry with hints | Retry · 2/2 |
| 3 | Compare | — |

- Current step: filled blue circle with the number, label blue-700, weight 600.
- Done step: green check in a success-50 circle, label ink-700, with the mark for that phase.
  The retry mark is shown out of 2 (its cap), not out of 3.
- Future step: grey outlined circle, label mute-500.
- A 3/3 first try skips step 2: the tracker shows "Write · 3/3" then "Compare" (two steps).
- It is an `<ol aria-label="Steps">`; the current step has `aria-current="step"`.

### 3.2 Plain English block

At the top of the card under the tracker in every state except the result (§8): surface-50 panel, radius 12, mono label
"PLAIN ENGLISH" (12 px, uppercase, mute-600), then the sentence at 19 px / 1.55, ink-700.
**No highlighting, underlining or bolding of any words in it, in any state.** The design
deliberately does not tell the student which phrases to replace.

## 4. State 1: Writing

- Label "Rewrite it in economics language" (16 px, 600), with "Use the precise terms an HSC
  marker looks for" on the right (14 px, mute-600; wraps below on phones).
- Text box: 18 px text, 3 rows, blue 1.5 px border with the 4 px blue-100 focus ring.
- Footer row: a word meter (120 px bar, success-500 fill in proportion to the 25-word limit) with
  "12 / 25 words" in mono; the primary button **"Submit for marking"** with a right arrow.
- Over the limit: the bar fills warn-500 and the count reads
  "27 / 25 words · over the limit — you lose the conciseness mark" (current wording). Submission is
  still allowed (spec 005).
- Under a divider, an info line: **"Miss a term? You'll get one retry with hints, worth up to 2
  marks."**
- The placeholder no longer mentions "the target terms" (the student has not been told any). Use
  "Write your sentence here…".

## 5. State 2: Marking first try (the main fix)

- **The student's sentence stays on screen.** The text box is replaced in place by a locked
  read-only block: header row "Your sentence" with a lock icon (inline stroke SVG) with
  "12 / 25 words" on the right; the sentence at 18 px in a white box with a blue-100 border.
- A 3 px indeterminate progress bar runs along the bottom edge of that block (blue bar sliding
  across a blue-50 track).
- Below it, a status list (`role="status"`, `aria-live="polite"`) of three steps:
  1. ✓ Read your sentence
  2. ◌ Checking your economics terms… (spinner, bold)
  3. ○ Writing your feedback (grey)
  The steps are **cosmetic and timed** (one grading call sits behind them): step 1 ticks at once,
  step 2 at about 1.5 s, and step 3 keeps spinning until the response arrives. Never show a step
  as done that depends on the response.
- Footer: "Usually takes a few seconds." and a disabled pale-blue button with a spinner,
  "Marking…".
- On a grading error the block returns to an editable text box **holding the student's text**,
  with the existing error message. Nothing the student typed is lost.
- Reduced motion (`prefers-reduced-motion`): no sliding bar or spinning; show static states.

## 6. State 3: Feedback + retry

Order inside the card: tracker → plain English → first-try result → hint → retry box → footer.

### 6.1 First-try result

One bordered box, two parts:

- Top: mono label "FIRST TRY", the mark large ("2" in the display font, 36 px, blue-700, then
  "/ 3"), and the grader's feedback beside it (16 px). Feedback wording must name what was done
  well and say more terms would help **without naming phrases to replace**, e.g. "You named
  **protection**. Two more terms would make your sentence more precise."
- Bottom (surface-50 strip): "Your first try" then the student's sentence, with each target term
  the grader credited highlighted (success-50 background, success-700 text, weight 600, radius 4).
  Missed terms are not marked in the sentence.

### 6.2 Hint: "Use these terms in your retry"

- Heading "Use these terms in your retry" (16 px, 600).
- One card per missed or misused term (spec 005 FR-015), in a responsive grid (min 260 px):
  warn-50 background, a light warn border, the term in the display font (20 px, 700), and its
  one-line definition (15 px). **No "replaces …" line and no mapping to the plain-English
  sentence.**
- When no term was missed (the student lost criterion (a) or (c), spec 005 FR-045) the heading is
  "What to fix" and there is a single card with the marker's criterion text.

### 6.3 Retry box

- Label "Your retry", with "Starts from your first try — edit it" on the right.
- **The text box is pre-filled with the first-try sentence**, focused, cursor at the end.
- Footer: word meter + "Retry is worth up to 2 marks" (info icon), and the primary button
  **"Submit retry"** with a right arrow.

## 7. State 4: Marking retry

As state 2, with:

- The first try collapsed to one row (`<details>`, closed): "FIRST TRY", "2 / 3", the sentence
  truncated with an ellipsis, a chevron. Opening it shows the full first-try result.
- A row "Terms you were asked to use:" followed by a warn-50 pill per hint term (for a criterion
  hint: "You were asked to fix:" and one pill, "Meaning" or "Conciseness").
- The locked block is headed "Your retry", with its own word count.
- Status steps: "Read your retry", "Checking subsidy and infant industry…" (the hint terms by
  name, or "Checking your sentence…" when the hint was a criterion), "Preparing the model
  sentence".
- Footer: "Retry is worth up to 2 marks." and the disabled "Marking…" button.

## 8. State 5: Result

Order: tracker → result summary → "Your retry" / "Model sentence" side by side → the term table →
the first try (collapsed) → footer. The plain English block is not repeated here.

### 8.1 Result summary

A success-50 panel with the recorded mark ("2" in the display font, 48 px, success-700, then
"/ 3 marks") and two lines chosen by outcome:

| Outcome | Line 1 (18 px, 600) | Line 2 (15 px) |
|---------|---------------------|----------------|
| Phase 1 = 3 | "Full marks on your first try." | grader feedback |
| Phase 2 = 2 | "Full marks for a retry — all three terms used." ("both terms used" / "the term used") | "A retry can earn at most 2. Use every term on the first try next time for the full 3." |
| Phase 2 < 2, phase 2 ≥ phase 1 | grader feedback | "A retry can earn at most 2." |
| Phase 1 > phase 2 | grader feedback on the retry | "Your recorded mark is n / 3 (your better try)." (n = phase 1 mark; current FR-019 wording) |

When the recorded mark is below 2 the panel uses surface-50 instead of success-50 and the mark is
ink-900.

### 8.2 Your sentence and the model sentence

Two cards side by side (stack below about 640 px):

- **"YOUR RETRY"** (or "YOUR SENTENCE" when phase 1 was final): the final sentence with every
  credited target term highlighted as in 6.1. If the grader returned a language note, a spelling or
  grammar slip is shown with a wavy danger-500 underline on the word and one line below, e.g.
  "Spelling: fromm → from. “Subsidies … enable” (plural)." Language notes never change the mark.
- **"MODEL SENTENCE"** (blue-50 card): the model sentence(s) with the target terms in bold
  blue-700, then one line of commentary, e.g. "14 words — the terms do the work, so it can be
  short." (word count computed; the sentence after the dash is fixed copy).

### 8.3 The term table: "The three terms"

Heading "The three terms" ("The two terms", "The term"). One row per target term, replacing both
the old hint list and "Why these terms fit":

- Term in the display font (18 px, 700) with a status pill beside it:
  - **"First try"** (success-50 / success-700): used correctly in phase 1 (whatever phase 2 did).
  - **"Added in retry"** (blue-50 / blue-700): missed or misused in phase 1, used correctly in
    phase 2.
  - **"Not used"** (surface-100 / ink-700): used correctly in neither.
- Under the term, the key's `why` text (13 px, mute-600), e.g. "names the government payment that
  lowers costs".
- The definition (15 px) to the right; on phones it wraps below.
- Concept tracking is unchanged: only phase 1 counts (spec 005 FR-033). The pills are display
  only.

### 8.4 First try and footer

- The first try collapsed into one `<details>` row: "FIRST TRY · 2/3" and the truncated sentence.
  Hidden when phase 1 was final.
- Footer: "Next: question 4 of 5" and the primary **"Next question"** button with a right arrow
  (on the last question: "Last question" and the existing "Finish" button).

## 9. Self-mark path (grader unavailable)

Behaviour is unchanged (spec 005 FR-030, FR-046). Visually it follows the new pattern: the
student's sentence stays visible as the locked block; the model sentence card and the term table
(without status pills) follow; each term row and criteria (a) and (c) get a checkbox; the footer
button is "Save my mark". The tracker shows "Write" then "Mark it yourself".

## 10. Resume

Resuming mid-question shows the state the attempt is in: state 3 with the hint and the retry box
pre-filled with the first try (or with the saved retry draft, if drafts are kept), or state 5.
Marking states are never restored; an unanswered submission is shown as state 1 or 3 with the
text in the box.

## 11. Data needed beyond spec 005

The design needs three things the grade result does not return today. The plan decides the
shapes; all of them are display only and never change marks or concept tracking.

1. **Credited spans**: for each phase, the exact words in the student's sentence the grader
   credited for each target term (a grammatical form or listed equivalent may differ from the term
   itself, so the client cannot find them by string matching). Drives the highlighting in 6.1 and
   8.2. If a span is not found verbatim in the sentence, no highlight is shown for it.
2. **Phase 2 term outcomes**: which terms the retry used correctly. Drives the "Added in retry" /
   "Not used" pills. (`termOutcomes` today is phase 1 only and must stay the concept-tracking
   source.)
3. **Language note** (optional): misspelt words and one short grammar note for the final
   sentence. Drives 8.2's wavy underline and note line. Absent → nothing shown.

Highlighting the credited terms in the first-try sentence (6.1) reveals that those words were
target terms after phase 1 is graded. The plan must check this against constitution
Principle I's scoped release (2.12.0) and adjust the wording there if needed.

## 12. Accessibility

- Highlights are never colour alone: credited terms are also weight 600; the misspelling also has
  the note line; pills carry text.
- Status changes are announced through the `role="status"` region; the result summary receives
  focus when state 5 appears (as the current marking box does).
- Touch targets ≥ 44 px; text contrast ≥ 4.5:1 (mute-600 `#4B5563` for small grey text, not
  mute-400/500 below 14 px).
- Works at 390 px with no sideways scrolling (see the phone mockups).

## 13. Reference implementation

None yet. The mockup sources in `mockups/source/` are static comps, not components; the plan maps
them onto `RewritePanel.tsx` and the existing `rd-` styles.

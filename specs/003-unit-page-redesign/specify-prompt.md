# `/speckit-specify` prompt for spec 003

Paste everything inside the block below into Roo Code as one message. The first line makes Spec Kit
write `spec.md` into this folder (beside `design.md` and `mockups/`) instead of creating a new one.

```text
/speckit-specify SPECIFY_FEATURE_DIRECTORY=specs/003-unit-page-redesign

Unit Page Redesign: restructure the unit page (/unit/[unitId]) into four clearly separate sections, so a student can see at a glance what the quiz is, what they still need to learn, how they are doing, and what they have already tried. The page currently stacks its parts with no structure: the long description pushes Start quiz down a phone screen, "Things you need to know" uses the same small grey label as everything else, the Best/Latest/Attempts boxes give little context and show dashes for a new student, and the attempt list is bare dates and scores.

The visual and wording reference is specs/003-unit-page-redesign/design.md, with mockups in specs/003-unit-page-redesign/mockups/. Read both first. Use the exact on-screen wording from design.md, and put the visual details (sizes, spacing, colours) into the plan, not the spec.

Sections, in this order (keep Start/Continue above Concepts to review, and Concepts to review above results and history, as now):

1. Introduction: one card with the badges, title, description, exam countdown and Start/Continue. On phones the description shows at most 4 lines with "Show more" / "Show less"; the full text stays in the page. The exam countdown reads "In n days" / "In 1 day" / "Today" with the exam title and date.
2. Concepts to review (the new name for "Things you need to know", matching the "n to review" pill on the home page): a heading with an "n to review" count and a one-sentence explanation of how a concept is cleared and that new attempts include extra questions on it. Each concept shows its one-line description and its progress towards clearing as three pips (one filled per correct answer earned) plus "n to go"; screen readers get the existing "n more correct answer(s) needed" sentence instead. Concepts with an approved summary still open to show it, now with a visible open/closed indicator. With nothing to review it shows a short "All clear" message. Order, approval rules, the live refresher and the database-down notice are unchanged.
3. Your results: Best, Latest and Attempts in one card. Each figure has a short note: how many completed attempts Best is from; how Latest changed since the previous completed attempt (up, down or the same, in points, or "first result"); how many attempts are still in progress. With no attempts it shows a sentence instead of dashes. Best and Latest still count completed attempts only.
4. Past attempts: only when there is at least one attempt. A heading with a one-line explanation, then each attempt newest first, numbered "Attempt k" (1 is the oldest), with its start time, a bar showing its percent, the percent and marks, and the existing "incomplete" label for unfinished attempts. Each still opens the attempt's detail page.

Formulas and the unit guide stay below, using the same section heading style. Every section uses one shared heading style (a title, an optional one-line explanation, an optional item on the right) in place of the small uppercase labels. Each section is labelled by its heading for screen readers; pips, bars and arrows are decorative and their meaning is also given in text; nothing is shown by colour alone. The page must work at phone width (390 px) with no sideways scrolling.

Out of scope: the home page, /progress, the attempt detail and quiz pages; any change to concept tracking, quiz weighting, history queries or the data the page loads; score-over-time charts. If the database cannot be reached, the page keeps working as now: Start quiz works, Concepts to review shows its notice, and Your results shows the history-unavailable notice without Past attempts.

Tests: update the existing unit page tests for the new heading and wording. The degrade tests' check for error and reviewer-status wording must ignore the section's own "Concepts to review" heading, the "n to review" pill and its CSS class, while still catching any real reviewer status, error or generation text. The README is updated to the new name; the constitution and spec 002 are not rewritten.

A reference implementation of this design may already be in the working tree (listed in design.md section 12); the plan may start from it. Must comply with constitution 2.10.0.
```

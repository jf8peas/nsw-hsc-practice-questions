# Feature Specification: Unit Page Redesign

**Feature Branch**: `003-unit-page-redesign`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Unit Page Redesign: restructure the unit page (/unit/[unitId]) into four clearly separate sections, so a student can see at a glance what the quiz is, what they still need to learn, how they are doing, and what they have already tried. The page currently stacks its parts with no structure: the long description pushes Start quiz down a phone screen, 'Things you need to know' uses the same small grey label as everything else, the Best/Latest/Attempts boxes give little context and show dashes for a new student, and the attempt list is bare dates and scores. The visual and wording reference is specs/003-unit-page-redesign/design.md, with mockups in specs/003-unit-page-redesign/mockups/. Read both first. Use the exact on-screen wording from design.md, and put the visual details (sizes, spacing, colours) into the plan, not the spec. Sections, in this order: 1. Introduction (badges, title, description, exam countdown, Start/Continue; phones clamp description to 4 lines with Show more / Show less; countdown reads 'In n days' / 'In 1 day' / 'Today' with exam title and date); 2. Concepts to review (the new name for 'Things you need to know', matching the 'n to review' pill on the home page) with 'n to review' count, one-sentence explanation, pips plus 'n to go', 'n more correct answer(s) needed' for screen readers, approved summaries open with a visible indicator, 'All clear' when nothing to review, unchanged order/approval/live refresher/database-down notice; 3. Your results — Best, Latest and Attempts in one card with short notes, a sentence instead of dashes with no attempts, Best and Latest count completed attempts only; 4. Past attempts only when there is at least one attempt, numbered 'Attempt k' newest first, start time, percent bar, percent and marks, existing 'incomplete' label, each opening the attempt's detail page. Formulas and the unit guide stay below with the same section heading style. Every section uses one shared heading style (a title, an optional one-line explanation, an optional item on the right) in place of the small uppercase labels; each section is labelled by its heading for screen readers; pips, bars and arrows are decorative and their meaning is also given in text; nothing is shown by colour alone; the page must work at 390 px with no sideways scrolling. Out of scope: the home page, /progress, attempt detail and quiz pages; any change to concept tracking, quiz weighting, history queries or the data the page loads; score-over-time charts. If the database cannot be reached, the page keeps working as now. Tests: update the existing unit page tests; the degrade tests' check for error and reviewer-status wording must ignore the section's own 'Concepts to review' heading, the 'n to review' pill and its CSS class, while still catching any real reviewer status, error or generation text. The README is updated to the new name; the constitution and spec 002 are not rewritten. A reference implementation may already be in the working tree (design.md section 12); the plan may start from it. Must comply with constitution 2.10.0."

## Reference

The visual and wording reference for every sentence on the page is `specs/003-unit-page-redesign/design.md`; the agreed appearance is shown in `specs/003-unit-page-redesign/mockups/` (`desktop-full.png` at 900 px, `phone-full.png` and `phone-new-student.png` at 390 px). This spec states the requirements and the exact on-screen wording. Visual details (sizes, spacing, colours, radii, fonts and spacing rules) are pinned in `design.md` and belong to the plan, not this spec. Where this spec and `design.md` disagree, this spec wins and `design.md` is corrected.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See what the quiz is and get in (Priority: P1)

The top of the unit page is one card holding the badges, the unit title, the description, an exam countdown and the Start/Continue action, so a student knows what the quiz is, when the exam is and how to begin, without scrolling. On phones the description is cut to at most 4 lines with a "Show more" button that expands to the full text ("Show less" collapses it again); the full text is always in the page. The exam countdown reads "In n days" / "In 1 day" / "Today" beside the exam's title and date. Start/Continue stays above everything else, exactly where it is today.

**Why this priority**: This is the entry point and the source of the "what is the quiz and how do I start" glance. It also fixes the concrete phone problem in the description: a long description currently pushes Start quiz down a phone screen.

**Independent Test**: Open a unit page at 390 px with a long description. Confirm the description is clamped with a working "Show more" / "Show less" button, the exam countdown reads correctly for the exam's date, and Start/Continue appears above the other sections.

**Acceptance Scenarios**:

1. **Given** a unit with an exam, **When** a student opens its page, **Then** the card shows the badges, title, description, one exam strip per exam and the Start/Continue action, in that order.
2. **Given** the exam is 12 days away, **When** the page renders, **Then** the strip reads "In 12 days" followed by the exam title and its date; with 1 day to go it reads "In 1 day", and on the day itself "Today" (unchanged rules).
3. **Given** a description longer than 4 lines, **When** the page is viewed on a 600 px or narrower screen, **Then** the description is cut to 4 lines with a "Show more" button underneath; pressing it shows the full text and the button becomes "Show less", and pressing again restores the clamp, with the button carrying an expanded state that screen readers receive.
3a. **Given** a description that fits in 4 lines at the current width, **When** the page is viewed on a 600 px or narrower screen, **Then** it is shown in full with no "Show more" button; if the screen is resized or rotated so that it no longer fits (or fits again), the button appears (or disappears) to match.
4. **Given** the same unit viewed on a wider screen, **When** the page renders, **Then** the full description is shown and the "Show more"/"Show less" button is not visible.
5. **Given** a unit whose description is long, **When** the page is opened on a phone, **Then** the full text is still in the page, and Start/Continue is reachable above the Concepts to review and results sections.
6. **Given** a student with an unfinished attempt, **When** they open the page, **Then** "Continue attempt (n of m answered)" and "Start new attempt" appear; otherwise "Start quiz" appears (unchanged).

---

### User Story 2 - Know which concepts I still need to learn (Priority: P1)

The "Things you need to know" section is renamed **Concepts to review**, matching the "n to review" pill on the home page. Its heading carries an "{n} to review" pill (when there is at least one concept) and a one-sentence explanation of how a concept is cleared and that new attempts include extra questions on it. Each concept shows its one-line description and its progress towards clearing as three pips, one filled per correct answer earned, plus "{count} to go"; screen readers get the existing "{count} more correct answer(s) needed" sentence instead. A concept with an approved summary still opens to show it (now with a visible open/closed indicator), and with nothing to review the section shows a short "All clear" message. Order, approval rules, the live refresher and the database-down notice are unchanged.

**Why this priority**: This is the "what do I still need to learn" glance and the rename that aligns the page with the home page's language, which the design treats as the feature's headline change.

**Independent Test**: Seed a student with missed questions on a concept, open the unit page and confirm the heading, pill count, explanation, pips and "to go" figure; approve a summary and confirm the row shows an open/closed indicator and opens it; clear every concept and confirm the "All clear" message appears.

**Acceptance Scenarios**:

1. **Given** a student with at least one uncleared concept in a concept-ready unit, **When** they open the unit page, **Then** the section is headed "Concepts to review", with an "{n} to review" pill (n = number of concepts listed) and the explanation "Ideas you have missed in this quiz. Answer each one correctly 3 times in a row to clear it; your next attempts include extra questions on them."
2. **Given** a listed concept with a count, **When** the page renders, **Then** the concept shows its one-line description, three pips of which one is filled for each correct answer earned towards clearing (none filled at a count of 3, one at 2, two at 1), and "{count} to go" that matches the count.
3. **Given** any listed concept, **When** screen readers read the row, **Then** they receive "{count} more correct answer(s) needed" (singular at a count of 1) instead of the pips and "to go" text, which are decorative.
4. **Given** a listed concept with an approved summary, **When** the page renders, **Then** the row shows a visible open/closed indicator and opens as the existing native disclosure showing the approved bullets, and any approved illustration only as an image with alt text; a concept without approved content is just its description, with no empty space and no error.
5. **Given** a student with no uncleared concepts and the database reachable, **When** they open the page, **Then** the section keeps its heading and shows "All clear — nothing to review right now. Any concept you miss in a quiz will show up here."
6. **Given** the database cannot be reached, **When** they open the page, **Then** the section keeps its heading and shows the existing notice "We could not load your weak concepts right now.", with no list, no error and no effect on Start quiz.
7. **Given** a unit that is not concept-ready, **When** they open its page, **Then** the whole section is absent, as today.
8. **Given** several uncleared concepts, **When** the page renders, **Then** they keep today's order: highest count first, ties broken by the most recently missed, and the live refresher keeps working exactly as today.
9. **Given** any list of concepts, **When** the markup is inspected, **Then** nothing about review status, models or failures appears (unchanged rule).

---

### User Story 3 - See how I am doing (Priority: P2)

Best, Latest and Attempts move into one card with three columns, each column carrying a short note that explains the figure: how many completed attempts Best is from; how Latest changed since the previous completed attempt (up, down or the same, in points, or "first result"); and how many attempts are still in progress. With no attempts, the card is replaced by a sentence — never dashes. Best and Latest still count completed attempts only.

**Why this priority**: This delivers the "how am I doing" glance with context a student can actually use. It is P2 because it shows existing data and is not the gateway to starting or learning.

**Independent Test**: Seed completed and in-progress attempts with known percents, open the unit page and confirm the three figures, the "from {n} completed" note, the change note comparing the two most recent completed attempts, and the "{n} in progress" note; for a student with no attempts, confirm the sentence appears instead of dashes.

**Acceptance Scenarios**:

1. **Given** a student with completed attempts, **When** they open the page, **Then** the three figures appear in one card with the labels Best, Latest and Attempts, and Best and Latest use only completed attempts while Attempts counts every attempt including unfinished ones (unchanged rule).
2. **Given** a student with completed attempts, **When** the Best note renders, **Then** it reads "from {n} completed" counted over completed attempts, or "none completed yet" when there are attempts but none completed.
3. **Given** a student with at least two completed attempts, **When** the Latest note renders, **Then** it reads "↑ {d} pts on last" when Latest is higher than the completed attempt before it, "↓ {d} pts on last" when lower, and "same as before" when equal, where d is the difference in percentage points between the latest completed attempt and the completed attempt before it; with exactly one completed attempt it reads "first result", and with none it is empty.
4. **Given** a student with unfinished attempts, **When** the Attempts note renders, **Then** it reads "{n} in progress" for the number of unfinished attempts; otherwise it is empty.
5. **Given** a student with no attempts, **When** they open the page, **Then** no card and no dashes appear; the section shows "No attempts yet. Your scores will appear here after your first quiz, on any device."
6. **Given** the database cannot be reached, **When** they open the page, **Then** the section keeps its heading and shows the existing history-unavailable notice instead of any figures, and nothing about Past attempts is shown.

---

### User Story 4 - Revisit what I have already tried (Priority: P2)

Past attempts appears only when there is at least one attempt. Each attempt is a row, newest first, numbered "Attempt k" (1 is the oldest), with its start time, a bar showing its percent, the percent and marks, and the existing "incomplete" label on unfinished attempts. Each row still opens the attempt's detail page.

**Why this priority**: This delivers the "what have I already tried" glance and gives each past result shape and context. It is P2 because it is the least time-sensitive of the four sections and depends on attempts existing.

**Independent Test**: Seed several attempts (including an unfinished one), open the unit page and confirm the rows are numbered newest first with start times, percent bars, percents, marks and the incomplete label, each linking to its detail page.

**Acceptance Scenarios**:

1. **Given** a student with at least one attempt, **When** they open the page, **Then** after "Your results" they see "Past attempts" with the explanation "Open an attempt to see each of your answers with its marks and feedback."
2. **Given** a student with several attempts, **When** the list renders, **Then** attempts appear newest first, each labelled "Attempt {k}" where k counts from 1 for the oldest attempt, so the newest has the highest number.
3. **Given** any attempt row, **When** the page renders, **Then** it shows the start time, a bar filled to the attempt's percent (clamped to 0–100 for the bar only), the percent and the "marks/max" figures.
4. **Given** an unfinished attempt, **When** its row renders, **Then** it keeps the existing "incomplete" label and its "a of t answered" tooltip.
5. **Given** any attempt row, **When** a student activates it, **Then** the attempt's detail page opens (unchanged target).
6. **Given** a student with no attempts, **When** they open the page, **Then** no Past attempts section appears.

---

### User Story 5 - Find every section at a glance, on any screen (Priority: P1)

Every section after the introduction opens with the same shared heading style — a title, an optional one-line explanation, and an optional item on the right — replacing the small uppercase labels that currently introduce "Things you need to know", the results, "Formulas in this test" and the unit guide. The four sections appear in the fixed order Introduction → Concepts to review → Your results → Past attempts, with Formulas and the unit guide below, so a student can scan the page top to bottom: what the quiz is, what to learn, how they are doing, what they tried, then reference material. Each section is labelled by its heading for screen readers; pips, bars and arrows are decorative and their meaning is also given in text; nothing is shown by colour alone; and the page works at 390 px with no sideways scrolling.

**Why this priority**: This is the structural core of the redesign — without it the four parts are still "stacked with no structure". It also carries the accessibility and phone-width guarantees that the design requires everywhere, so it is the first thing reviewed across every section.

**Independent Test**: Open the unit page on a 390 px viewport with data for every section and confirm: one page title; every section headed consistently (title, optional explanation, optional aside) including Formulas and the unit guide; the section order; no sideways scrolling; and that removing styling still leaves every pip, bar and arrow's meaning in text.

**Acceptance Scenarios**:

1. **Given** the unit page with all sections present, **When** it renders, **Then** the sections appear in the order Introduction (badges, title, description, exam countdown, Start/Continue), Concepts to review, Your results, Past attempts, then Formulas in this test and the unit guide, and Start/Continue stays above Concepts to review and the results/history as today.
2. **Given** every section after the introduction, **When** it renders, **Then** it opens with the shared heading block (a title, an optional one-line explanation under it, and an optional item at the right), including "Formulas in this test" and the guide's title, and no small uppercase section labels remain on the page (the badges in the Introduction are unchanged).
3. **Given** the rendered page, **When** its structure is inspected, **Then** there is exactly one page title and every section is a labelled region whose heading names it for screen readers.
4. **Given** a concept's pips, an attempt's score bar, an attempt row's chevron or any arrow, **When** styling is removed, **Then** their meaning is still present as text ("{count} more correct answer(s) needed"; the percent and marks), because the decorative elements are hidden from screen readers.
5. **Given** a Latest change shown with an arrow, **When** colours are the only difference a student could see, **Then** the arrow and the words ("↑ / ↓ {d} pts on last", "same as before", "first result") still convey the change, so nothing relies on colour alone.
6. **Given** a 390 px phone viewport, **When** the page renders with a long description, several concepts and attempts, **Then** nothing scrolls sideways; on 480 px and below each concept's pips move below its description consistently, and the exam date never breaks across lines.

---

### User Story 6 - Keep practising when the database is down (Priority: P2)

If the database cannot be reached, the page keeps working exactly as now: Start quiz still works, Concepts to review shows its notice, and Your results shows the history-unavailable notice without Past attempts.

**Why this priority**: The constitution requires practice to degrade gracefully (Principle VI) and a database outage must never block a student. It is P2 because it preserves existing behaviour rather than adding new value, but it must be re-verified because the page is being restructured around it.

**Independent Test**: With the database down (test harness), open a unit page and confirm the page loads, Start quiz still starts an attempt, the concepts notice shows, and the results notice shows with no Past attempts section.

**Acceptance Scenarios**:

1. **Given** the database cannot be reached, **When** a student opens a unit page, **Then** the page loads with the Introduction card and Start quiz, and starting a quiz still works.
2. **Given** the database cannot be reached and the unit is concept-ready, **When** the Concepts to review section renders, **Then** it shows its heading and "We could not load your weak concepts right now." with no list and no error.
3. **Given** the database cannot be reached, **When** the results section renders, **Then** it shows "Your results" and the existing history-unavailable notice, with no figures, no dashes and no Past attempts section.

---

### Edge Cases

- A unit with no exams shows no countdown strip, and a unit with several exams shows one strip each (unchanged data).
- An exam that is today, or in 1 day, switches the countdown wording to "Today" / "In 1 day" by the existing rules.
- A unit that is not concept-ready shows no Concepts to review section at all, and no error or empty box.
- A student with weak concepts while the database is down sees the heading and the notice, never a partial list.
- A student with only unfinished attempts sees the results card with Best "—" and "none completed yet", Latest "—" with no change note, Attempts {n} with "{n} in progress", and every past-attempt row labelled "incomplete".
- A student with exactly one completed attempt sees "first result" as the Latest note; with two equal percents it is "same as before".
- A description of 4 lines or fewer on a phone is shown in full with no "Show more" button; one even slightly longer is cut to 4 lines with the button.
- An attempt percent outside 0–100 is clamped for the bar only; the percent and marks text show the real figures.
- Attempt numbering is fixed by position from the oldest attempt, so an unfinished attempt in the middle of history still carries the "incomplete" label and its own number.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page MUST show the sections in the order Introduction (badges, title, description, exam countdown, Start/Continue), Concepts to review, Your results, Past attempts, then Formulas in this test and the unit guide when present — keeping Start/Continue above Concepts to review, and Concepts to review above results and history, as today.
- **FR-002**: The Introduction MUST be one card with the badges, the unit title as the page's single title, the description, one exam countdown strip per exam and Start/Continue (labels unchanged: "Start quiz", or "Continue attempt (n of m answered)" with "Start new attempt").
- **FR-003**: On screens 600 px and narrower a description longer than 4 lines MUST be cut to 4 lines with a "Show more" button that expands to the full text and becomes "Show less", carrying an expanded state for screen readers. A description that fits in 4 lines MUST show in full with no button, and the button MUST appear or disappear if a resize or rotation changes whether the text fits. The full text MUST always remain in the page, and on wider screens the full text shows with the button hidden.
- **FR-004**: Each exam strip MUST read "In n days" / "In 1 day" / "Today" with the exam's title and date, using the unchanged exam data and wording rules.
- **FR-005**: The renamed section MUST be headed "Concepts to review" and, when at least one concept is listed, show an "{n} to review" pill (n = concepts listed, the same number as the unit's "{n} to review" pill on the home page) and the explanation "Ideas you have missed in this quiz. Answer each one correctly 3 times in a row to clear it; your next attempts include extra questions on them."
- **FR-006**: Each listed concept MUST show its one-line description and its progress as three pips — one filled per correct answer earned, i.e. 3 − count — plus "{count} to go" beside them; the pips and "to go" text MUST be decorative, with the existing "{count} more correct answer(s) needed" sentence (singular at 1) delivered to screen readers instead.
- **FR-007**: A concept with an approved summary MUST open as the existing native disclosure showing the approved bullets (and any approved illustration as an image with alt text), with a visible open/closed indicator; a concept without approved content MUST be just its description, with no empty space and no error, and the markup MUST carry nothing about review status, models or failures.
- **FR-008**: The Concepts to review states MUST be: list when there are concepts; "All clear — nothing to review right now. Any concept you miss in a quiz will show up here." in an empty-state box when there are none; the existing notice "We could not load your weak concepts right now." when the database is unavailable; and no section at all when the unit is not concept-ready — with order (highest count first, ties by most recently missed), approval rules and the live refresher unchanged.
- **FR-009**: Your results MUST show Best, Latest and Attempts as three columns in one card, where Best and Latest count completed attempts only and Attempts counts every attempt including unfinished ones (unchanged). Each column's note MUST read: Best "from {n} completed" or "none completed yet"; Latest "↑ {d} pts on last" / "↓ {d} pts on last" / "same as before" for the two most recent completed attempts, "first result" when exactly one is completed, or empty when none; Attempts "{n} in progress" when any are unfinished, else empty.
- **FR-010**: With no attempts, Your results MUST show the empty-state sentence "No attempts yet. Your scores will appear here after your first quiz, on any device." instead of a card or dashes; with the database unavailable it MUST show the existing history-unavailable notice under the heading.
- **FR-011**: Past attempts MUST appear only when there is at least one attempt, under the heading "Past attempts" with the explanation "Open an attempt to see each of your answers with its marks and feedback."
- **FR-012**: Each past attempt MUST be a row, newest first, labelled "Attempt {k}" with k counting from 1 for the oldest attempt, showing the start time, a bar filled to the attempt's percent (clamped 0–100 for the bar), the percent, the "marks/max" figures, the existing "incomplete" label (with its "a of t answered" tooltip) for unfinished attempts, and an indicator that it opens the attempt's detail page, which MUST still open.
- **FR-013**: Every section after the Introduction MUST open with one shared heading block — a title, an optional one-line explanation, and an optional item on the right — replacing the small uppercase labels everywhere on the page, including "Formulas in this test" and the unit guide's title.
- **FR-014**: The page MUST have exactly one page title (the unit title), and every section MUST be a labelled region whose heading names it for screen readers; concept pips, score bars, chevrons and arrows MUST be decorative with their meaning also present as text; "Show more"/"Show less" MUST be a real button with an expanded state; and nothing MUST be conveyed by colour alone (the change note keeps its arrow and words).
- **FR-015**: At 390 px the page MUST render with no sideways scrolling; on 480 px and narrower each concept's pips MUST move below its description consistently for every row, and the exam date MUST wrap as a whole without breaking across lines.
- **FR-016**: When the database cannot be reached, the page MUST keep working as today: Start quiz works, Concepts to review shows its notice, Your results shows the history-unavailable notice, and Past attempts is not shown.
- **FR-017**: The redesign MUST NOT change concept tracking, quiz weighting, history queries or the data the page loads, and MUST NOT touch the home page, /progress, the attempt detail or quiz pages.
- **FR-018**: The existing unit page tests MUST be updated for the new heading ("Concepts to review") and wording; the degrade tests' error and reviewer-status wording check MUST ignore the section's own "Concepts to review" heading, the "{n} to review" pill text and the pill's CSS class, while still catching any real reviewer status, error or generation text.
- **FR-019**: The README MUST rename "Things you need to know" to "Concepts to review"; the constitution and spec 002 are NOT rewritten — this spec records the new on-screen name.

### Key Entities

- **Unit**: id, title, description, type, created date, new badge, formulas, guide, concept-ready flag. All display data already loaded; unchanged.
- **Exam**: title and date; the countdown figure ("In n days" / "In 1 day" / "Today") is derived from the date by the existing rules.
- **Concept**: id and one-line description from the unit's concept list, together with the student's current count derived from stored results (a miss sets 3, a correct answer takes 1 away, cleared at 0 — unchanged). The count drives the pips, the "to go" figure and the screen-reader sentence.
- **Attempt**: id, unit, start time, completion time, questions answered and total, percent, marks and max. Drives Best, Latest, the change note, the in-progress count and the Past attempts rows (newest first, numbered from the oldest).

No new data is stored and no per-student field is added; all figures are derived from the existing stored results (constitution Principle II).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a 390 px viewport the page renders with no sideways scrolling, and Start/Continue, Concepts to review, Your results and Past attempts appear in that order, with Formulas in this test and the unit guide below.
- **SC-002**: A student with no attempts and no weak concepts sees the "All clear" message and the "No attempts yet." sentence — no dashes anywhere on the page.
- **SC-003**: Every heading and on-screen sentence in the four sections, Formulas in this test and the guide matches the exact wording listed in this spec and pinned in `design.md` ("Concepts to review", the explanation, "{n} to review", "Show more"/"Show less", the countdown, "from {n} completed", the change notes, "Attempt {k}", "incomplete" and the two empty-state sentences).
- **SC-004**: Best and Latest are computed from completed attempts only, and the Latest note compares the two most recent completed attempts, as verified by seeded history covering up, down, equal, "first result" and no-completed cases.
- **SC-005**: A screen-reader pass of the page receives the meaning of every pip, bar and arrow in text, every section is announced by its heading, and no information is conveyed by colour alone.
- **SC-006**: With the database unreachable, the page still loads, Start quiz starts an attempt, the concept and history notices show, and Past attempts is absent.
- **SC-007**: With the database reachable and generation/review failed or capped, the Concepts to review section still lists concepts by description with no error, and the updated degrade tests still fail on genuine reviewer-status, error or generation wording while accepting the section's own heading, pill and pill class.
- **SC-008**: The project's automated quality gates pass with the updated tests — build, lint and the test suite — and the README names the section "Concepts to review" while the constitution and spec 002 are unchanged.

## Assumptions

- The reference implementation listed in `design.md` section 12 is present in the working tree and the plan MAY start from it rather than from scratch.
- Visual details — sizes, spacing, colours, radii, fonts, the pill's appearance and the bar dimensions — are pinned in `design.md` and the mockups and belong to the plan, not this spec.
- Existing behaviour not restated here is unchanged: exam countdown and Start/Continue wiring, concept ordering and approval rules, the live refresher, the incomplete label and tooltip, the history-unavailable notice, and the attempt detail page link target.
- The "Show more" button is shown only when the description is actually cut off (decided 2026-10-29 in review: the reference implementation showed it on phones even for short descriptions, which is a defect to fix).
- The degrade-test requirement to ignore the pill's CSS class is deliberate and comes from the feature description: the check must accept the section's own heading, pill and pill class while still rejecting genuine reviewer status, error or generation wording.
- Conformance to constitution 2.10.0 is required, in particular Principle VI (graceful degradation) and Principle VIII (mobile-first, key actions reachable without scrolling past reference material).
- No scoring data, concept tracking or loaded data changes; everything shown is derived from existing data, and no new personal-data fields are introduced (constitution Principle II).

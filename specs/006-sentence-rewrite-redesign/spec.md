# Feature Specification: Sentence Rewrite Question Redesign

**Feature Branch**: `006-sentence-rewrite-redesign`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "Redesign the student experience of the sentence-rewrite question (spec 005, `components/RewritePanel.tsx`) so it is clear where the student is, what they are waiting on, and how their final sentence compares with the model. Grading, the 3-mark criteria, the phase-2 cap of 2, the hint rules, concept tracking from phase 1, the self-mark degrade path and the LLM call limits are all unchanged. Five question-card states (writing, marking first try, feedback + retry, marking retry, result) with new data from grading (credited spans, phase 2 term outcomes, optional language note) that is display only. Must comply with constitution 2.12.0."

## Reference

- `design.md` and the mockups in `mockups/` (desktop 1280 px and phone 390 px per state) are the
  visual and wording reference. The plan and tasks take every size, spacing, colour and font from
  them; this spec states the requirements and the exact on-screen wording.
- Spec 005 (`specs/005-economics-sentence-writing/spec.md`) defines the grading rules, the 3-mark
  criteria, the phase-2 cap of 2, the hint rules (spec 005 FR-015, FR-045), concept tracking from
  phase 1 only (FR-033), the recorded-mark rule (FR-019), the self-mark degrade path (FR-030,
  FR-046), the call limit of two per question (FR-029) and the submission rules (FR-041, FR-042).
  This feature changes the student experience of the rewrite question only; that behaviour is
  unchanged.
- Constitution 2.12.0 applies, in particular Principle I's scoped release for the sentence-writing
  unit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Write and submit a first try (Priority: P1)

A student opens the rewrite question, sees where they are in the flow, rewrites the plain-English
sentence, and submits it for marking.

**Why this priority**: A clear first screen is the foundation: the student must know the flow
ahead (write, retry, compare), that a missed term earns one hinted retry worth at most 2 marks,
and exactly what to type.

**Independent Test**: Open the question and confirm the step tracker, the plain-English block, the
text box with its new placeholder, the word meter, the retry info line and the "Submit for
marking" button all appear as described.

**Acceptance Scenarios**:

1. **Given** a rewrite question in its first state, **When** the student opens it, **Then** they
   see a step tracker with the steps "Write", "Retry with hints" and "Compare", the plain-English
   sentence, a text box whose placeholder is "Write your sentence here…" (no mention of target
   terms), a word meter showing the live count as "12 / 25 words", a button labelled "Submit for
   marking", and the line "Miss a term? You'll get one retry with hints, worth up to 2 marks."
2. **Given** a sentence over 25 words, **When** the student keeps typing, **Then** the meter warns
   "27 / 25 words · over the limit — you lose the conciseness mark" and submission is still
   allowed.
3. **Given** a valid rewrite, **When** the student submits, **Then** the question moves to the
   marking state.

---

### User Story 2 - Watch the first try being marked (Priority: P1)

While the first try is being marked, the student keeps seeing the exact sentence they submitted,
progress on the marking steps, and their sentence back in the box (text intact) if marking fails.

**Why this priority**: This is the main fix — the sentence was cleared while marking, so the
student could not see what they were waiting on.

**Independent Test**: Submit a first try and confirm the sentence stays visible in a locked block
with a progress bar and status list, and that a forced marking error returns it to an editable box
holding the same text.

**Acceptance Scenarios**:

1. **Given** a submitted first try, **When** the marking state appears, **Then** the submitted
   sentence stays on screen in place of the text box, locked, headed "Your sentence" with its live
   word count, and the text box is not cleared.
2. **Given** the marking state, **When** the student views the status list, **Then** it ticks
   "Read your sentence", shows "Checking your economics terms…" in progress after a short timed
   delay, and keeps "Writing your feedback" pending until the marking response arrives; no step
   that depends on the response is shown done before the response arrives.
3. **Given** the marking state, **When** the student's assistive technology reads the page,
   **Then** the progress is announced through a live status region as the steps change.
4. **Given** a marking error, **When** the error result returns, **Then** the locked block becomes
   an editable text box holding the student's text, with the existing error message, and nothing
   the student typed is lost.

---

### User Story 3 - Retry once with hints (Priority: P1)

After phase 1 scores under 3, the student sees their mark, feedback and their first-try sentence
with the credited terms highlighted, gets a hint that never maps back to the plain-English
sentence, and edits the first-try sentence in a pre-filled retry box knowing the retry is worth at
most 2 marks.

**Why this priority**: The retry is the unit's teaching mechanism; the redesign removes the
surprises (empty retry box, unexplained 2-mark cap) and the hint leakage.

**Independent Test**: Score under 3 in phase 1, confirm the hint is one card per missed or misused
term (term and definition only) with no plain-English mapping, confirm the retry box is pre-filled
with the first-try sentence, and confirm "Retry is worth up to 2 marks" is shown.

**Acceptance Scenarios**:

1. **Given** a phase 1 grade below 3/3, **When** the feedback + retry state appears, **Then** it
   shows the "FIRST TRY" label, the mark out of 3, and the grader's feedback that names what was
   done well and says more terms would help without naming phrases to replace, followed by "Your
   first try" with the sentence and each target term the grader credited highlighted (missed
   terms not marked).
2. **Given** one or more missed or misused terms, **When** the hint is shown, **Then** it is
   headed "Use these terms in your retry" with one card per missed or misused term containing only
   the term and its one-line definition, and it contains no "replaces …" line, no mapping to the
   plain-English sentence and no highlighting of the plain-English sentence.
3. **Given** every term used correctly but criterion (a) or (c) lost, **When** the hint is shown,
   **Then** it is headed "What to fix" with a single card naming the criterion in the marker's
   words.
4. **Given** the retry box, **When** the student edits, **Then** it is labelled "Your retry" with
   the supporting line "Starts from your first try — edit it", is pre-filled with the first-try
   sentence (focused, cursor at the end), shows the word meter and "Retry is worth up to 2 marks",
   and submits via "Submit retry".

---

### User Story 4 - See the result and compare with the model (Priority: P1)

The student sees a summary of their recorded mark with an outcome line that explains the retry
cap, their final sentence beside the model sentence, and one table of the target terms with
definitions, why each fits, and its status — replacing the old duplicated lists and disabled text
boxes.

**Why this priority**: How the question ends is where the learning lands; the redesign replaces
the confusing parcel of repeats with a single comparison and explanation.

**Independent Test**: Complete a question and confirm the result summary's outcome line matches the
outcome table for that case, the final sentence sits beside the model sentence with credited terms
highlighted (and the model terms in bold), the term table shows the right statuses, and "Next
question" advances.

**Acceptance Scenarios**:

1. **Given** a question finished with phase 1 at 3/3, **When** the result appears, **Then** the
   tracker shows "Write · 3/3" then "Compare", there was no hint and no retry (spec 005 FR-014),
   and the summary reads "Full marks on your first try." beside the grader's feedback.
2. **Given** a retry capped at 2 marks, **When** the result appears, **Then** the summary reads
   "Full marks for a retry — all three terms used." ("both terms used" / "the term used" for two or
   one terms) with "A retry can earn at most 2. Use every term on the first try next time for the
   full 3."
3. **Given** a retry below 2 marks that still matches or beats phase 1, **When** the result
   appears, **Then** the summary shows the grader's feedback with "A retry can earn at most 2."
4. **Given** phase 1 beating phase 2, **When** the result appears, **Then** the summary shows the
   grader's feedback on the retry with "Your recorded mark is n / 3 (your better try)." where n is
   the phase 1 mark (the existing spec 005 FR-019 wording).
5. **Given** the result state, **When** the student views the sentence comparison, **Then** the
   final sentence card (labelled "YOUR RETRY", or "YOUR SENTENCE" when phase 1 was final) shows
   every credited target term highlighted, and the "MODEL SENTENCE" card shows the target terms in
   bold with one line of commentary.
6. **Given** the result state, **When** the student views the term table headed "The three terms"
   ("The two terms", "The term"), **Then** each row shows the term, its definition, the key's "why"
   text and a status: "First try" (used correctly in phase 1, whatever phase 2 did), "Added in
   retry" (missed or misused in phase 1 and used correctly in phase 2), or "Not used" (used
   correctly in neither), and
   this table is the only term listing (the old hint list and "Why these terms fit" are gone).
7. **Given** a phase 2 that happened, **When** the student views the result, **Then** the first try
   is collapsed into a single closed row, and it is hidden entirely when phase 1 was final.
8. **Given** the result state, **When** the student finishes reading, **Then** the footer shows
   "Next: question 4 of 5" (question number taken from the attempt) with a primary "Next question"
   button; on the last question, "Last question" with the existing "Finish" button.

---

### User Story 5 - Mark your own answer when the AI marker is unavailable (Priority: P2)

When the AI marker is unavailable or today's allowance is used up, the question degrades to
self-marking with the new layout: the sentence stays visible, the model sentence and term table
are shown, each term row and criteria (a) and (c) get a checkbox, and the student saves their mark.

**Why this priority**: The degrade path must keep working (constitution Principle VI) and the new
layout must not break it.

**Independent Test**: With the marker unavailable, answer a question and confirm the self-mark
screen uses the new layout (locked visible sentence, model sentence card, term table without status
pills, checkboxes, "Save my mark") with no phase 2.

**Acceptance Scenarios**:

1. **Given** the AI marker is unavailable or the daily allowance is used up, **When** the student
   submits a rewrite, **Then** the question degrades exactly as spec 005 FR-030: the student sees
   the locked sentence, the model sentence card and the term table (without status pills), a
   checkbox per term row and per criterion (a) and (c), and a "Save my mark" button, with no phase
   2.
2. **Given** the self-mark screen, **When** the student saves, **Then** the term results exist for
   concept tracking as spec 005 FR-046 requires, and the tracker shows "Write" then "Mark it
   yourself".

---

### User Story 6 - Resume a half-finished question (Priority: P2)

A student who leaves mid-question comes back to the state their attempt is in — including feedback
+ retry with the pre-filled retry box, or the result — never to a marking state, and never loses
typed text.

**Why this priority**: Students practise on phones in short sessions; losing a half-finished
question wastes the work.

**Independent Test**: Leave the question during feedback + retry, return, and confirm the hint and
the pre-filled retry box are shown with every typed character intact; confirm no marking state is
ever restored.

**Acceptance Scenarios**:

1. **Given** an attempt saved in feedback + retry, **When** the student returns, **Then** the
   question resumes at feedback + retry with the hint and the retry box pre-filled with the
   saved retry draft (falling back to the first-try sentence when no draft was saved).
2. **Given** an attempt saved in the result state, **When** the student returns, **Then** the
   question resumes at the result state.
3. **Given** an unanswered submission, **When** the student returns, **Then** the question shows
   the writing or feedback + retry state with the student's text in the box; no marking state is
   ever restored and no typed text is lost.

---

### Edge Cases

- A 3/3 first try: the retry step is skipped entirely; the tracker shows "Write · 3/3" then
  "Compare" (two steps), and the result uses the phase-1-final wording and label.
- A marking error in either phase: the locked block becomes an editable box holding the student's
  text, with the existing error message; nothing is lost.
- A retry that reaches the cap: the outcome line "Full marks for a retry — all three terms used."
  with the cap explained ("A retry can earn at most 2. Use every term on the first try next time
  for the full 3.").
- A retry below 2 that still matches or beats phase 1: feedback plus "A retry can earn at most 2."
- A term used correctly in phase 1 but dropped or misused in the retry: its status stays "First
  try" (matching concept tracking); the final sentence simply shows no highlight for it.
- Phase 1 graded but the phase 2 marking call fails or the allowance runs out: handled exactly as
  spec 005 (the recorded mark and self-mark rules there); the tracker keeps "Write · n/3" done.
- Phase 1 beating phase 2: the recorded mark keeps the better try wording (spec 005 FR-019).
- Every term used correctly but criterion (a) or (c) lost: the hint is "What to fix" with a single
  criterion card (spec 005 FR-045).
- A credited span not found verbatim in the sentence: no highlight is shown for it.
- A language note absent from the grade: nothing extra is shown on the final sentence.
- A sentence over 25 words: submission still allowed; the conciseness mark is lost (unchanged).
- Empty or whitespace-only submissions are still blocked in both phases (spec 005 FR-041
  unchanged).
- Resume: the full result state is restored from the persisted display data (credited-term
  highlights, term table statuses, language note); marking states are never restored; an
  unanswered submission shows the box holding the persisted draft text, so nothing typed is lost.
- Reduced motion: the progress bar and spinners do not animate; static equivalents are shown.
- A 390 px viewport: the card renders without sideways scrolling.
- Double submission (another tab, a double tap): the stored result is shown as today (unchanged).

## Requirements *(mandatory)*

### Functional Requirements

**States and common frame**

- **FR-001**: The rewrite question MUST present exactly five states on one question card — writing,
  marking first try, feedback + retry, marking retry, and result — in the order described here,
  with a 3/3 first try going straight from marking first try to result.
- **FR-002**: The card MUST open with a step tracker of three steps labelled "Write", "Retry with
  hints" and "Compare". The current step MUST be identified visually and to assistive technology; a
  completed step MUST show a check and the mark it earned, with the retry mark shown out of 2 (its
  cap); a future step MUST be shown as not yet reached. A 3/3 first try MUST take the tracker
  straight from "Write · 3/3" to "Compare" (two steps).
- **FR-003**: The plain-English sentence MUST appear at the top of the card under a "PLAIN
  ENGLISH" label in every state except the result state (FR-023), and no word in it MAY ever be
  highlighted, underlined or bolded in any state.

**Writing (state 1)**

- **FR-004**: In the writing state the card MUST show the heading "Rewrite it in economics
  language" with the supporting line "Use the precise terms an HSC marker looks for", a text box
  whose placeholder is "Write your sentence here…", a word meter with a live count in the form
  "12 / 25 words", and a primary button labelled "Submit for marking". The placeholder MUST NOT
  mention target terms.
- **FR-005**: When the sentence goes over 25 words, the meter MUST warn in the form "27 / 25 words
  · over the limit — you lose the conciseness mark" and submission MUST still be allowed (spec 005
  FR-012 unchanged).
- **FR-006**: Under a divider the writing state MUST show the line "Miss a term? You'll get one
  retry with hints, worth up to 2 marks." so the student knows a retry may follow, comes with
  hints, and is worth at most 2 marks.

**Marking first try (state 2)**

- **FR-007**: While a submitted sentence is being marked, the sentence the student submitted MUST
  stay visible on screen in place of the text box, as a locked read-only block headed "Your
  sentence" with its word count shown. The text box MUST NOT be cleared at any point during
  marking.
- **FR-008**: The marking state MUST show an indeterminate progress bar and a status list of three
  steps: "Read your sentence" (shown done immediately), "Checking your economics terms…" (shown in
  progress after a short timed delay), and "Writing your feedback" (shown pending). The last step
  MUST stay in progress until the marking response arrives, and no step that depends on the
  response MAY be shown as done before it arrives. The steps are cosmetic and timed: a single
  marking request sits behind them.
- **FR-009**: Marking progress MUST be announced to assistive technology through a live status
  region as the steps change.
- **FR-010**: The marking-state footer MUST show "Usually takes a few seconds." and a disabled
  button labelled "Marking…".
- **FR-011**: If marking fails, the locked block MUST become an editable text box holding the
  student's text, together with the existing error message, and nothing the student typed MAY be
  lost.

**Feedback + retry (state 3)**

- **FR-012**: When phase 1 is graded below 3/3, the card MUST show, in order: the step tracker, the
  plain-English block, the first-try result, the hint, and the retry box.
- **FR-013**: The first-try result MUST show the label "FIRST TRY", the mark out of 3, and the
  grader's feedback. The feedback MUST name what was done well and what would improve the sentence
  (more precise terms, or the lost criterion), and MUST NOT name or quote words of the
  plain-English sentence to replace (e.g. "You named protection. Two more terms would make your
  sentence more precise."). This changes the grader's feedback instructions only; marks are
  unchanged.
- **FR-014**: The first-try result MUST show the student's sentence under the label "Your first
  try" with each target term the grader credited highlighted. Missed terms MUST NOT be marked in
  the sentence.
- **FR-015**: When one or more terms were missed or misused (spec 005 FR-015), the hint MUST be
  headed "Use these terms in your retry" and MUST show one card per missed or misused term, each
  card with the term and its one-line definition only. The hint MUST NOT tell the student which
  words of the plain-English sentence to replace: there MUST be no "replaces …" line, no mapping
  to the plain-English sentence, and no highlighting of the plain-English sentence.
- **FR-016**: When every target term was used correctly and only criterion (a) or (c) was lost
  (spec 005 FR-045), the hint MUST be headed "What to fix" and MUST show a single card naming the
  criterion in the marker's words.
- **FR-017**: The retry box MUST be labelled "Your retry" with the supporting line "Starts from
  your first try — edit it", MUST be pre-filled with the first-try sentence (focused, with the
  cursor at the end), MUST show the word meter and the notice "Retry is worth up to 2 marks", and
  MUST have a primary button labelled "Submit retry".

**Marking retry (state 4)**

- **FR-018**: While the retry is being marked, the retry sentence MUST stay visible in a locked
  read-only block headed "Your retry" with its own word count, under the same visibility and
  error rules as the first try (FR-007, FR-011).
- **FR-019**: In the marking-retry state, the first try MUST be collapsed to a single closed row
  showing "FIRST TRY", its mark, the sentence truncated with an ellipsis and a chevron; opening
  the row MUST show the full first-try result.
- **FR-020**: In the marking-retry state, the card MUST show a row headed "Terms you were asked to
  use:" followed by one labelled pill per hint term (when the hint was a criterion, the row is
  headed "You were asked to fix:" with a single pill, "Meaning" for criterion (a) or "Conciseness"
  for criterion (c)), and a status list "Read your retry", "Checking <the hint terms by
  name>…" (or "Checking your sentence…" when the hint was a criterion) and "Preparing the model
  sentence", under the same cosmetic-and-timed rules as FR-008.
- **FR-021**: The marking-retry footer MUST show "Retry is worth up to 2 marks." and a disabled
  button labelled "Marking…".

**Result (state 5)**

- **FR-022**: When phase 1 is graded 3/3, the question MUST move straight from marking first try
  to the result state, with no hint and no retry (spec 005 FR-014 unchanged).
- **FR-023**: The result state MUST show, in order: the step tracker, the result summary, the
  student's final sentence beside the model sentence, the term table, the first try (collapsed when
  phase 2 happened, hidden when phase 1 was final), and the footer. The plain-English block MUST NOT
  be repeated in this state.
- **FR-024**: The result summary MUST show the recorded mark out of 3 and an outcome pair chosen
  by outcome:
  1. Phase 1 = 3: "Full marks on your first try." with the grader's feedback.
  2. Phase 2 = 2: "Full marks for a retry — all three terms used." ("both terms used" for two
     terms, "the term used" for one) with "A retry can earn at most 2. Use every term on the first
     try next time for the full 3."
  3. Phase 2 below 2 and phase 2 at least phase 1: the grader's feedback with "A retry can earn at
     most 2."
  4. Phase 1 above phase 2: the grader's feedback on the retry with "Your recorded mark is n / 3
     (your better try)." where n is the phase 1 mark (spec 005 FR-019 wording).
- **FR-025**: The result summary MUST take focus when the result state appears.
- **FR-026**: The result MUST show the student's final sentence next to the model sentence. The
  final sentence card MUST be labelled "YOUR RETRY" — or "YOUR SENTENCE" when phase 1 was final —
  and MUST show every credited target term highlighted. The model sentence card MUST be labelled
  "MODEL SENTENCE", show the target terms in bold, and include one line of commentary (the computed
  word count plus fixed copy).
- **FR-027**: When the grader returns an optional language note, a misspelt word or grammar slip in
  the final sentence MUST be shown with a wavy underline on the word and one line beneath it (e.g.
  "Spelling: fromm → from. "Subsidies … enable" (plural)."). When no language note is returned,
  nothing extra is shown. A language note MUST never change the mark.
- **FR-028**: The result MUST show one term table headed "The three terms" ("The two terms", "The
  term", matching the question's term count) that replaces both the old hint list and "Why these
  terms fit". Each row MUST show the term, its definition, the key's "why" text, and one of three
  labelled statuses, decided in this order: "First try" (used correctly in phase 1, whatever
  phase 2 did), "Added in retry" (missed or misused in phase 1 and used correctly in phase 2), or
  "Not used" (used correctly in neither). The statuses therefore agree with concept tracking, which
  counts phase 1 only. They are display only and MUST NOT change concept tracking.
- **FR-029**: When phase 2 happened, the first try MUST be shown collapsed into a single closed row
  reading "FIRST TRY · 2/3" with the truncated sentence; when phase 1 was final it MUST be hidden.
- **FR-030**: The result footer MUST show "Next: question 4 of 5" (question number taken from the
  attempt) and a primary button labelled "Next question". On the last question the line reads
  "Last question" and the button keeps the existing label "Finish".

**New grading data (display only)**

- **FR-031**: For each phase, the grader MUST return, for each target term, the words in the
  student's sentence the grader credited for that term (credited spans), so that equivalents and
  other grammatical forms can be highlighted. This data is display only.
- **FR-032**: When a credited span is not found verbatim in the student's sentence, no highlight
  MUST be shown for it.
- **FR-033**: The grader MUST return which terms the retry used correctly (phase 2 term outcomes)
  to drive the "Added in retry" and "Not used" statuses. The phase 1 outcomes used for concept
  tracking MUST be unchanged (spec 005 FR-033).
- **FR-034**: The grader MAY return an optional language note (misspelt words and one short grammar
  note) for the final sentence. When absent, nothing is shown.
- **FR-035**: All new grading data MUST be delivered by the existing marking calls. Each question
  MUST still use at most 2 marking calls (spec 005 FR-029); there MUST be no extra grading calls.
- **FR-036**: The new grading data MUST never change marks, the criteria, the phase-2 cap, the
  hint selection rules or concept tracking.

**Self-mark path**

- **FR-037**: When the AI marker is unavailable or today's allowance is used up (spec 005 FR-030),
  the question MUST degrade to self-marking with the new layout: the student's sentence stays
  visible as a locked block; the model sentence card and the term table (without status pills)
  follow; each term row and criteria (a) and (c) get a checkbox; the footer button is labelled
  "Save my mark"; and the tracker shows "Write" then "Mark it yourself". Behaviour MUST be
  unchanged (spec 005 FR-030, FR-046): no phase 2, and self-marked term results exist for concept
  tracking.

**Resume**

- **FR-038**: Resuming an attempt mid-question MUST show the state the attempt is in: feedback +
  retry with the hint and the retry box pre-filled with the saved retry draft (falling back to the
  first-try sentence when no draft was saved), or the result state. Marking states MUST never be
  restored; an unanswered submission MUST be shown as the writing or feedback + retry state with
  the student's persisted draft text in the box. A submission that was graded before the student
  left MUST resume at the graded state, not as unanswered. No typed text MAY be lost (FR-053,
  FR-054).

**Accessibility**

- **FR-039**: Highlights and statuses MUST never be conveyed by colour alone: a credited term MUST
  also be distinguished by weight; a misspelling MUST also have the note line; statuses and pills
  MUST carry text.
- **FR-040**: Marking progress MUST be announced through a live status region (FR-009) and the
  result summary MUST take focus when it appears (FR-025).
- **FR-041**: Under the student's reduced-motion preference, the progress bar and spinners MUST
  stop animating and static equivalents MUST be shown.
- **FR-042**: Every interactive target MUST be at least 44 px.
- **FR-043**: The question card MUST render and remain usable at a 390 px viewport width with no
  sideways scrolling.

**Security and constitution**

- **FR-044**: The first-try credited-span highlighting (FR-014) reveals only after phase 1 is
  graded that certain words in the sentence were target terms. The plan MUST include a constitution
  check that this stays within Principle I's scoped release (nothing from the answer key reaches
  the browser before phase 1 is graded, or has fallen back to self-marking, including on reload or
  resume) and MUST amend the constitution's wording through the amendment process if the check
  finds the wording needs to cover it.

**Testing**

- **FR-045**: Automated tests MUST cover that the submitted sentence stays visible (and is not
  cleared) while marking, for both phases, and that a grading error returns an editable box holding
  the text.
- **FR-046**: Automated tests MUST cover that the retry box starts pre-filled with the first-try
  sentence.
- **FR-047**: Automated tests MUST cover that the hint never contains a mapping to the
  plain-English sentence.
- **FR-048**: Automated tests MUST cover the result outcome lines for each case: a 3/3 first try, a
  capped retry at 2, a retry below 2, and phase 1 beating phase 2.
- **FR-049**: Automated tests MUST cover that term statuses come from the phase outcomes and that
  credited-span highlighting ignores spans not found in the sentence.
- **FR-050**: Automated tests MUST cover that concept results are still counted from phase 1 only.
- **FR-051**: Automated tests MUST cover the self-mark path with the new layout.
- **FR-052**: Existing rewrite tests MUST be updated for the new on-screen wording.

**Persistence (clarified 2026-11-03)**

- **FR-053**: The app MUST save with the attempt, per writing question, the new display-only
  grading data (credited spans for each phase, phase 2 term outcomes, optional language note) and
  the student's in-progress draft text for each phase, so a resumed or reloaded question shows the
  full new result and restores what the student had typed. This extends the constitution Principle
  II storage list for writing questions; the plan MUST amend that wording through the amendment
  process. The data MUST remain display only and MUST never change marks or concept tracking.
- **FR-054**: On resume or reload, the persisted display data MUST restore the full result state
  (credited-term highlights, term table statuses, language note) and the persisted draft text MUST
  restore the contents of the writing or retry box. No typed text MAY be lost.

**Testing (additions)**

- **FR-055**: Automated tests MUST cover that a resumed or reloaded result restores the full
  display data (credited-term highlights, term table statuses, language note) and that the
  in-progress draft text is restored, with no typed text lost.

### Key Entities

- **Phase grade (display data)**: For each phase, the mark, the feedback, the per-target-term
  credited spans, and for phase 2 the term outcomes and the optional language note. Display only;
  never changes marks or concept tracking. Saved with the attempt (and deleted with the student)
  so a resumed result is fully restored.
- **Term status**: One of "First try", "Added in retry" or "Not used", derived from the phase
  outcomes and shown as a labelled pill in the term table. Display only.
- **Draft**: The student's in-progress text for each phase, saved with the attempt. The retry box
  starts pre-filled with the first-try sentence; on resume it restores the saved retry draft. No
  typed text is lost.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of submissions in both phases keep the submitted sentence visible while marking;
  the text box is never cleared.
- **SC-002**: 100% of marking errors return the student's text in the editable box.
- **SC-003**: 100% of retry boxes start pre-filled with the first-try sentence.
- **SC-004**: 100% of hints consist only of missed-or-misused-term cards or the single lost-criterion
  card and never include a mapping to the plain-English sentence.
- **SC-005**: 100% of results show the outcome line from the outcome table that matches their case
  (3/3 first try, capped retry at 2, retry below 2, phase 1 beating phase 2).
- **SC-006**: 100% of term statuses in the term table match the phase outcomes.
- **SC-007**: The new grading data changes no marks and no concept counts, and concept counts are
  still derived from phase 1 only (100% of tested cases).
- **SC-008**: Each question still uses at most 2 marking calls (100% of tested cases).
- **SC-009**: Marking progress is announced to assistive technology and the result summary receives
  focus when it appears (100% of tested cases).
- **SC-010**: The question card renders at 390 px with no sideways scrolling and every interactive
  target is at least 44 px (100% of audited cases).
- **SC-011**: Resuming mid-question shows the full saved state — credited-term highlights, term
  table statuses and the language note restored from the persisted display data — never a marking
  state, with the in-progress draft text intact (100% of tested cases).

## Clarifications

### Session 2026-11-03

- Review edits (2026-11-03): FR-003 excludes the result state (it contradicted FR-023); locked
  blocks show a static word count (FR-007, FR-018); FR-013 bars the feedback from naming
  plain-English phrases but no longer forces "more terms" wording when the hint is a criterion;
  FR-020 gives the criterion hint its own row and pill; FR-024 wording works for 1–3 terms and
  uses the real phase 1 mark; FR-028 statuses follow phase 1 first, so they agree with concept
  tracking; FR-030 keeps the existing "Finish" label; FR-038 resumes a submission graded before
  the student left at its graded state.

- Q: Should the new display-only grading data (credited spans, phase 2 term outcomes, language
  note) and the student's in-progress draft text be saved per attempt, so that a resumed or
  reloaded question shows the full new result and restores what the student had typed? → A: Yes —
  save both with the attempt and amend constitution Principle II's storage list for writing
  questions to add them; the data stays display only and never changes marks or concept tracking.
  Drives FR-053, FR-054 and FR-055 and the updated FR-038.

## Assumptions

- Constitution 2.12.0 applies as-is. The credited-span highlighting of the first-try sentence
  stays within Principle I's scoped release because the spans are delivered only with the phase 1
  grade (never before, including on reload or resume); the plan verifies this and amends the
  wording through the amendment process if needed (FR-044). Per the 2026-11-03 clarification, the
  plan MUST also amend constitution Principle II's storage list for writing questions to add the
  display-only grading data and the per-phase drafts (FR-053).
- All grading behaviour from spec 005 is unchanged: the 3-mark criteria, the phase-2 cap of 2, the
  hint rules (only missed or misused terms, or the lost criterion), concept tracking from phase 1,
  the self-mark degrade path, and the LLM call limits.
- The new grading data (credited spans, phase 2 term outcomes, optional language note) is returned
  by the existing two marking calls; there are no extra grading calls.
- The exact on-screen wording is taken from `design.md`. Where this spec and `design.md` disagree,
  this spec wins and `design.md` is corrected.
- Visual details (sizes, spacing, colours, fonts) are pinned in `design.md` and the mockups and are
  resolved in the plan, not the spec.
- The "Terms you were asked to use:" row in the marking-retry state follows the same pill pattern
  when the hint is a criterion (FR-020).
- A retry submitted unchanged from the first try is allowed: it is marked like any retry, and the
  2-mark cap and the cap notice apply. The design pre-fills the box for editing but does not
  require an edit.
- Out of scope: other question types (short answer, multiple choice, essay, photo answers); the
  quiz header, progress bar and end-of-quiz screens; changes to marks, the criteria, the phase-2
  cap, the hint selection rules, concept tracking or the question bank.

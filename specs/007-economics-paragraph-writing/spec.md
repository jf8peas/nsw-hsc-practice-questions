# Feature Specification: Economics Paragraph Writing

**Feature Branch**: `007-economics-paragraph-writing`

**Created**: 2026-11-05

**Status**: Draft

## Clarifications

### Session 2026-11-05

- Q: When the daily limit runs out after a first try under 4, what happens to the correction? → A: The first-try mark is recorded and the student goes to the discussion, with the tip cards shown there and no correction step.

### Review edits 2026-11-05

- FR-019a widened: the marker being unavailable when the correction is submitted ends the question the same way as the daily limit (first-try mark recorded, discussion with tip cards, no error). FR-015 notes this as the one exception to "not skippable". The Edge Cases line on marker failure is rewritten to match constitution Principle VI (an LLM failure never shows an error; only a request that never reached the server returns the box with the usual error).
- FR-022 aligned with User Story 2 and spec 006: the correction box takes focus (cursor at the end) when the correction screen appears; the result summary takes focus on the discussion.
- FR-009: going over the limit means conventions criterion (d) is not met; the word count uses one rule for the meter and the marker (as spec 005 FR-043).
- FR-023: scoped to the question screen, and lists the essay question and directive verb.
- FR-033: ticked criteria count as correct first-try uses for tip tracking (spec 002 FR-005), unticked ones as misses.
- FR-006: the brief on the writing screen is collapsible; open on Part 1, closed on Parts 2 to 5.

**Input**: User description: see [specify-prompt.md](specify-prompt.md). Wording and layout reference: [design.md](design.md) and `mockups/`.

## Terms

- **Part**: one of the five items of the framework (Topic Sentence, Theoretical Mechanism, Evidence & Application, Evaluation & Limitation, Linking Judgement). Together they make one body paragraph.
- **Essay**: one essay question with the content for that paragraph (the brief, five model parts, and marking material).
- **Quiz**: one question, which is one part of one essay.
- **Criterion**: one of the four marked items of a part, each met or not met.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Write one part and get marked (Priority: P1)

A Year 12 student opens the unit and sees the essay in progress and its next part. They open the quiz, read the essay question, "What this part must do", the brief and the model text of the earlier parts, write the part, and submit it. While it is marked their text stays on screen, locked. The result shows the mark out of 4, a met/not met verdict and one feedback line for every criterion, and their first try. A 4/4 goes straight to the discussion.

**Why this priority**: This is the core loop. Without one part being written and marked there is no feature.

**Independent Test**: With one essay available, open Part 1, submit a text, and see a mark out of 4 with four criterion verdicts and feedback lines; a full-mark text lands on the discussion.

**Acceptance Scenarios**:

1. **Given** a student at the start of an essay, **When** they open the quiz, **Then** they see the five-part progress bar with Part 1 current, the full essay question with the directive verb highlighted and defined, four "What this part must do" lines, the brief with every field visible and the fields this part needs marked "Use in this part", a slot for this part in place of earlier model text, and an empty text box with a word meter.
2. **Given** a student at Part 3, **When** they open the quiz, **Then** the model text of Parts 1 and 2 is shown above the box whatever they scored on them, with a slot for Part 3, and no model text of Parts 4 or 5 is present anywhere in what reaches their browser.
3. **Given** a student writes over the part's word limit, **When** they submit, **Then** submission is allowed and the meter shows the over state.
4. **Given** a submitted part, **When** marking is in progress, **Then** the student's text stays visible, locked, with timed status steps announced through a live status region, and a marking error returns an editable box holding their text.
5. **Given** a phase 1 mark of 4/4, **When** the result arrives, **Then** the student goes straight to the discussion.

---

### User Story 2 - One correction with tips when marks are lost (Priority: P1)

When the first try scores under 4, the student sees the first-try result with one tip card per lost criterion, naming the criterion and its writing tip. The text box is pre-filled with their first try. They submit one correction, which is marked on the same criteria and capped at 3. There is no third try and the correction cannot be skipped.

**Why this priority**: The correction is what turns marking into learning and is part of the agreed approach from the sentence unit.

**Independent Test**: Submit a text that loses two criteria, confirm two tip cards and a pre-filled box, submit the correction, and confirm the mark is capped at 3 and no further try is offered.

**Acceptance Scenarios**:

1. **Given** a first try that loses criteria (b) and (c), **When** the result is shown, **Then** exactly two tip cards appear, each naming its lost criterion and tip, and no tip card contains any sentence of the model part or a rewrite of the student's text.
2. **Given** the correction box, **When** it appears, **Then** it holds the first try and has focus.
3. **Given** a correction that meets all four criteria, **When** it is marked, **Then** its mark is 3, not 4.
4. **Given** a correction marked lower than the first try, **When** the discussion appears, **Then** the recorded mark is the first-try mark and the discussion says so.
5. **Given** the correction has been marked, **Then** no further try is offered.
6. **Given** the student leaves during the correction, **Then** the part has no recorded mark and the next quiz offers the same part again.

---

### User Story 3 - Discussion with the model so far (Priority: P1)

After marking the student sees the recorded mark and why; each criterion with "First try", "Fixed in correction" or "Not met"; a "This mark seems wrong" button; their final text beside the model part with a commentary line; the model paragraph up to and including this part with this part highlighted and later parts as labelled "next quiz" slots; the tips added to "Things I need to know"; their first try collapsed; and "Finish", naming the next part.

**Why this priority**: The discussion is where the model is released and the learning lands.

**Independent Test**: Complete Part 2 of an essay and confirm the discussion shows model Parts 1 and 2 only, with Parts 3 to 5 as labelled slots, and that the browser never received Part 3's text.

**Acceptance Scenarios**:

1. **Given** the discussion for Part 2, **Then** model text of Parts 1 and 2 is shown, Part 2 is highlighted, and Parts 3 to 5 appear only as labelled slots ("next quiz", "quiz after") with no model text.
2. **Given** the Link part, **Then** the whole paragraph is shown with the Link highlighted.
3. **Given** a correction that scored 3 with a first try of 2, **Then** the summary says a correction earns at most 3 and the recorded mark is 3 of 4.
4. **Given** criteria met in the first try or only in the correction, **Then** each carries "First try" or "Fixed in correction" respectively, and a criterion met in neither is shown "Not met".
5. **Given** the student presses "This mark seems wrong", **Then** the answer is flagged for review, the button shows a done state, the mark is unchanged, and the same answer cannot be flagged again.
6. **Given** the first try was final (4/4), **Then** the first-try row is not shown.

---

### User Story 4 - Move through one essay, one part at a time (Priority: P1)

The unit page shows the essay in progress (for example "Essay 3 of 12 · next: Evidence & Application"), its question, five part dots with the recorded mark on each finished part, and a button that always continues it ("Continue essay (Part 3 of 5)"). After the Link, the next quiz starts the next essay.

**Why this priority**: The one-part-per-quiz progression is the unit's structure.

**Independent Test**: Finish Parts 1 to 5 in turn and confirm each quiz offers the next part in order, and that after the Link the unit page shows the next essay with "Start essay (Part 1 of 5)".

**Acceptance Scenarios**:

1. **Given** Parts 1 and 2 of Essay 3 have recorded marks, **Then** the unit page shows "Essay 3 of 12 · next: Evidence & Application" and the button "Continue essay (Part 3 of 5)".
2. **Given** a student with no history, **Then** the unit page shows "Essay 1 of 12 · next: Topic Sentence" and the button "Start essay (Part 1 of 5)".
3. **Given** a part without a recorded mark, **Then** the next quiz offers that same part again.
4. **Given** any state, **Then** there is no way to skip a part, restart the essay, or have two essays in progress.
5. **Given** the bank holds fewer than 12 essays at launch, **Then** the unit works with the essays that exist and the count shown reflects the bank.

---

### User Story 5 - Writing tips in "Things I need to know" (Priority: P2)

A tip missed on a first try (phase 1 only) goes into "Things I need to know" with its one-line advice and progress pips. A part tip clears after 2 correct first-try uses of that part; an all-parts tip after 3. A tip fixed in the correction still counts as missed.

**Why this priority**: It carries learning across quizzes, but the unit works without it.

**Independent Test**: Miss a part tip on a first try, fix it in the correction, and confirm it is listed with two to go; then meet it on first try twice and confirm it clears.

**Acceptance Scenarios**:

1. **Given** a criterion missed in phase 1 and fixed in the correction, **Then** its tip is added and nothing counts toward clearing it from that attempt.
2. **Given** a part tip with two correct first tries at that part, **Then** it clears; an all-parts (conventions) tip needs three.
3. **Given** the connectors advice appears in feedback, **Then** it never appears in "Things I need to know".
4. **Given** the unit has 17 tracked tips (three per part and the two shared conventions tips), **Then** no other concepts are tracked.

---

### User Story 6 - Self-mark when the marker is unavailable (Priority: P2)

If the marker is unavailable or the student is over the daily limit, the student's text stays visible, the model part is shown, and they tick each criterion they met. The ticks give the mark and the tip results. No second phase. No error is shown and no mark is invented.

**Why this priority**: Required by the constitution's degrade rule, but rare.

**Independent Test**: Force the marker to fail and confirm four tick boxes, a saved mark equal to the ticks, tip results from the unticked criteria, and no correction step.

**Acceptance Scenarios**:

1. **Given** the marker fails or the daily limit is used, **When** the student submits, **Then** the model part and four criterion tick boxes appear and no error message is shown.
2. **Given** three ticks, **When** they save, **Then** the mark is 3 of 4 and the unticked criterion's tip is recorded as missed.
3. **Given** this path, **Then** there is no correction step.

---

### User Story 7 - Revise the marker from real use (Priority: P2)

A teacher reviews answers students flagged, turns reviewed ones into labelled test cases in the pilot file, and reruns every case after any prompt change. A periodic sample of real full-mark answers is re-marked offline by a stronger model and disagreements become labelled cases, checking the three known leniency patterns first.

**Why this priority**: Held-out testing showed every miss was leniency; this is how marking quality improves after launch without silently breaking earlier fixes.

**Independent Test**: Add a labelled case and run the regression; confirm every case in the file is marked and reported, and that the prompt version changed.

**Acceptance Scenarios**:

1. **Given** each marked phase, **Then** its text, per-criterion verdicts, the marker's one-line reason for each, the attempt and the prompt version are stored.
2. **Given** a reviewed flag, **Then** it can be added to the pilot file as a "field" case.
3. **Given** any prompt change, **Then** the version is bumped and the regression run covers every case in the file, including the frozen India held-out set, which is never used to tune the prompt.
4. **Given** the leniency patterns (comparatives taken as a judgement in the Link; "success" accepted as the named outcome in the Topic Sentence; a drawback inside the Mechanism with no statistic), **Then** the offline re-mark checks these first.

---

### User Story 8 - Resume and past attempts (Priority: P3)

Resuming mid-question shows the state the attempt is in: the correction with its tip cards and saved text, or the discussion. Marking states are never restored and no typed text is lost. Past attempts show each part's text, marks, per-criterion results and feedback.

**Why this priority**: Protects the student's work; secondary to the main loop.

**Independent Test**: Leave during the correction, return, and see the correction with tip cards and the saved text.

**Acceptance Scenarios**:

1. **Given** a student leaves while a part is being marked, **When** they return, **Then** the writing or correction screen appears holding their text.
2. **Given** a past quiz, **Then** it appears as "Essay 3 · Mechanism" with its date, bar, percentage and mark out of 4.

---

### Edge Cases

- Over the word limit: the conciseness half of the conventions criterion is lost; submission is never blocked.
- Marker unavailable (no key, timeout, or an unparseable reply after one retry) on the first try: the self-mark path (FR-033), with no error shown. On the correction: FR-019a. Only a request that never reached the server (offline, network or server error) returns the editable box with the student's text and the usual error message.
- The daily limit is reached, or the marker is unavailable, after a first try under 4: the first-try mark is recorded and the student goes to the discussion, where the tip cards are shown; there is no correction step and no error (FR-019a).
- The student has finished every essay in the bank: no essay block is shown (wording decided in the plan).
- Empty or whitespace-only submission: not submitted.
- A flag is pressed twice, or from two tabs: only one flag is stored.
- A part has no recorded mark when the student returns: the same part is offered again and the essay does not advance.
- Later parts' model text must not appear in any response, page source, or stored client state at any point, including on the discussion screen.
- Topic Sentence counterpoint: marking compares against the model Topic Sentence shown to the student, not their own earlier attempt.

## Requirements *(mandatory)*

### Functional Requirements

**Progression**

- **FR-001**: The system MUST offer one part per quiz, in framework order, continuing the student's essay in progress; after the Link, the next quiz MUST start the next essay.
- **FR-002**: Exactly one essay MUST be in progress at a time. The system MUST NOT allow skipping a part or restarting an essay mid-way.
- **FR-003**: The essay in progress and next part MUST be derived from recorded marks. A part with no recorded mark MUST be offered again.
- **FR-004**: The unit page MUST show the essay in progress with its question, five part dots with the recorded mark on each finished part, and a button reading "Continue essay (Part N of 5)", or "Start essay (Part 1 of 5)" at the start of an essay, using the wording in design.md.
- **FR-005**: The unit MUST work with however many essays exist in the bank, launching with the first essays and growing; essay order through the bank is fixed.

**The question screen**

- **FR-006**: Each question MUST show: the essay's five parts as the progress bar; the essay question quoted in full with its directive verb highlighted and (before marking) defined; "What this part must do" (four plain lines taken from the part's criteria, the last naming the part's word limit); the brief with every field visible and the fields this part needs marked "Use in this part"; the model text of earlier parts of this essay with a slot for this part; and a text box with a word meter.
- **FR-007**: The brief MUST supply every fact and figure the part needs. Every idea in a model part MUST already be in the brief; the model adds structure, precision and terminology, never new facts.
- **FR-008**: The model text of earlier parts MUST be shown whatever the student scored on them.
- **FR-009**: The word limits MUST be Topic Sentence 40, Mechanism 90, Evidence 80, Evaluation 90, Link 45. Going over MUST mean conventions criterion (d) is not met (the conciseness half of it fails) and MUST NOT block submission. The live meter and the marking MUST count words by the same rule (as spec 005 FR-043).
- **FR-010**: On-screen wording MUST follow design.md exactly; visual details (sizes, spacing, colours) are decided in the plan.

**Marking**

- **FR-011**: Each part MUST be marked out of 4: three criteria specific to the part plus one shared conventions criterion (precise economic language; within the part's word limit with no padding), each met or not met. The criteria per part are those in the round 5 marker and the requirements doc. Cause-and-effect connectors MUST NOT be marked; feedback may mention them.
- **FR-012**: The counterpoint thread MUST be enforced: the Topic Sentence frames the counterpoint; the Evaluation discusses the same limitation the model Topic Sentence framed; the Link weighs argument against counterpoint and adds nothing new.
- **FR-013**: Phase 1: the result MUST show the mark out of 4, a met/not met verdict and one feedback line for every criterion, and the first try. A 4/4 MUST go straight to the discussion.
- **FR-014**: Phase 2 (only under 4): the system MUST offer exactly one correction starting from the first try, with one tip card per lost criterion naming the criterion and its writing tip. Tips MUST NOT contain model text or a rewrite of the student's text.
- **FR-015**: The correction MUST be marked on the same criteria and capped at 3. There MUST be no third try, and the correction MUST NOT be skippable; the only way a question under 4 ends without a marked correction is FR-019a.
- **FR-016**: The recorded mark MUST be the higher of phase 1 and the capped correction, and the discussion MUST explain the cap.
- **FR-017**: While marking, the student's text MUST stay on screen, locked, with timed status steps announced through a live status region; on error the editable box MUST return holding their text.
- **FR-018**: The grader MUST be built from the round 5 prompt in `scripts/pilot-paragraph-marker.py`. It MUST receive the brief, the earlier parts shown to the student, the part's criteria and the marking notes, and MUST return per-criterion verdicts, a one-line reason for each, an overall feedback line, and the tips missed.
- **FR-019**: There MUST be one slot of `LLM_DAILY_CAP` taken per phase, at most 2 per quiz. The single retry allowed for an unparseable reply is part of that phase's slot, not a further one.
- **FR-019a**: If `LLM_DAILY_CAP` is used up after a first try under 4, or the marker is unavailable when the correction is submitted, the system MUST record the first-try mark, show the tip cards in the discussion, offer no further correction, and show no error. The correction is never self-marked.

**Discussion**

- **FR-020**: The discussion MUST show, in order: the recorded-mark summary; per-criterion results each marked "First try", "Fixed in correction" or "Not met"; the "This mark seems wrong" button; the student's final text beside the model part with its commentary line; the model paragraph up to and including this part with this part highlighted and later parts as labelled "next quiz" slots; the tips added to "Things I need to know" (phase 1 misses only); the first try collapsed; and "Finish", naming the next part.
- **FR-021**: Later parts' model text MUST NOT be released at any point before the student has written those parts, including at the discussion.
- **FR-022**: The result summary MUST take focus when the discussion appears; the correction box MUST take focus, with the cursor at the end, when the correction screen appears (as spec 006).

**Information release (constitution Principle I, as amended)**

- **FR-023**: Before phase 1 is marked, the question screen MAY receive from the essay's key only: the essay question and its directive verb, the verb definition, the brief, which brief fields this part uses, the "What this part must do" lines, and the model text of earlier parts of the essay. (Tip wording shown on the unit page is concept text, not key material.)
- **FR-024**: After phase 1 is marked, the browser MAY additionally receive the per-criterion verdicts, reasons and tips (never model text). The current part's model and commentary MAY be released only at the discussion or self-mark screen.
- **FR-025**: Marking notes and later parts' model text MUST NEVER reach the browser.

**Things I need to know**

- **FR-026**: The unit's concepts MUST be 17 writing tips, one per criterion (three per part and the two shared conventions tips). The connectors advice MUST NOT be tracked.
- **FR-027**: A tip missed in phase 1 MUST appear with its one-line advice and progress pips, persist across attempts, and clear after 2 correct phase 1 uses for a part tip and 3 for an all-parts tip. Only phase 1 counts; a tip fixed in the correction still counts as missed.

**Stored data and revision loop**

- **FR-028**: The system MUST store, per part answered and per phase: the text, the per-criterion verdicts, the marker's one-line reason for each, the attempt, and the prompt version that marked it.
- **FR-029**: "This mark seems wrong" MUST flag that answer for review, MUST NOT change the mark, and MUST allow a single flag per answer.
- **FR-030**: Flagged answers, once reviewed, MUST be addable as labelled test cases in `resources/topic010/pilot-essays.json` (a "field" set). Every prompt change MUST bump the prompt version and rerun every case in that file. The frozen India held-out set MUST remain in the file and MUST NOT be used to tune the prompt.
- **FR-031**: A periodic sample of real full-mark answers MUST be re-markable offline by a stronger model, with disagreements added as labelled test cases; the three leniency patterns in `resources/topic010/06-findings-holdout.md` MUST be checked first.
- **FR-032**: Reviewing flags and running the re-mark MUST be offline teacher tasks (scripts). No teacher review page is part of v1.

**Degrade path and logging**

- **FR-033**: If the marker is unavailable or the student is over `LLM_DAILY_CAP`, the system MUST show the model part and let the student tick each criterion they met. The ticks MUST give the mark and tip results (ticked criteria count as correct first-try uses, unticked ones as phase 1 misses). There MUST be no phase 2 on this path, no error shown, and no mark invented.
- **FR-034**: Grading MUST log only minimal metrics as in spec 005 FR-044, never answer text.

**Resume**

- **FR-035**: Resuming mid-question MUST show the state the attempt is in (the correction with its tip cards and saved text, or the discussion). Marking states MUST NOT be restored, and no typed text MUST be lost.
- **FR-036**: Past attempt pages MUST show each part's text, marks, per-criterion results and feedback.

**Content**

- **FR-037**: v1 MUST provide 12 original essays on the Global Economy aligned to the Assessment Task 1 notification (globalisation's influence on an emerging and a developing economy; strategies since 1980 to promote growth and development). Each essay MUST have a brief, five model parts that together form one Band 6 paragraph, per-part "What this part must do" lines, the brief fields each part uses, per-part marking notes and a commentary line per model part. Not every essay must exist before 1 Dec 2026 (see FR-005).
- **FR-038**: Essay questions MUST be general ("an emerging economy you have studied"); each brief MUST use one well-documented economy, with directive verbs varying (evaluate, assess, analyse, discuss). No source line is shown (constitution Principle V).
- **FR-039**: Content validation MUST check that every essay has all five parts, every model part is within its word limit, and the model Topic Sentence's counterpoint matches the Evaluation's.
- **FR-040**: Figures shown in design.md and the mockups are placeholders; the content task MUST supply and verify real figures.

**Constitution**

- **FR-041**: This feature MUST amend constitution Principle I (what is released and when, per FR-023 to FR-025), Principle II (store per-criterion verdicts and reasons, prompt version and flag), the derived concept-count rule (part tips clear after 2), Principle VI (a correction that cannot be marked keeps the first-try mark per FR-019a; a sequential unit does not start when the database cannot be read) and Principle VII (the server-only `REMARK_MODEL` variable for the offline re-mark). The feature MUST comply with the constitution as amended.

**Accessibility**

- **FR-042**: Verdicts and statuses MUST NOT rely on colour alone; marking progress MUST be announced through a live status region; animations MUST stop under reduced motion; touch targets MUST be at least 44 px; the pages MUST work at 390 px with no sideways scrolling.

### Key Entities

- **Essay**: question, directive verb and definition, economy, brief fields, five model parts, per-part guidance lines, per-part field usage, per-part marking notes, per-part commentary. Server-side content, released only per FR-023 to FR-025.
- **Part**: one of five framework items with a word limit, three specific criteria and the shared conventions criterion.
- **Part attempt**: a student's answer to one part of one essay: phase 1 text, phase 2 text, marks, recorded mark, per-criterion verdicts and reasons per phase, prompt version, marking mode (marker or self-mark), flag.
- **Tip**: one of 17 writing tips with its progress toward clearing.
- **Labelled case**: a test answer with expected verdicts, in sets (tuning, held-out, field) in the pilot file.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can complete one part (read, write, submit, see the result) in under 5 minutes.
- **SC-002**: No later part's model text is present in any response or page delivered before the student has written that part (0 occurrences in automated checks across all essays).
- **SC-003**: The marker agrees with the labelled verdicts on at least 90% of tuning cases and 80% of held-out cases, and after every prompt change every case in the pilot file is rerun and reported.
- **SC-004**: At most 2 marking calls are made per quiz, and 100% of marked phases have stored verdicts, reasons and prompt version.
- **SC-005**: 0 tip cards contain a sentence of the model part (checked across all essays).
- **SC-006**: When the marker is unavailable, 100% of students can still finish a part by self-marking with no error shown.
- **SC-007**: No sideways scrolling at 390 px on any of the five screens, and every interactive element is at least 44 px.
- **SC-008**: The first essays are available before 1 Dec 2026, and every essay in the bank passes content validation.
- **SC-009**: Every flagged answer is recorded exactly once and never alters the recorded mark.

## Assumptions

- The sentence-writing unit (spec 005) and rewrite layout (spec 006) exist; their rules carry over unless this spec says otherwise (phase 2 cap, tip-clearing approach, self-mark degrade, minimal logging).
- Marker accuracy so far: 46 of 50 tuning and 21 of 25 held-out answers; every held-out miss was leniency. The thresholds in SC-003 are targets the revision loop works toward, not launch blockers.
- Proposed economies for the 12 essays: Vietnam, China, India, Indonesia, Bangladesh, Ethiopia, two essays each on different strategies; the content task may vary these.
- The exam countdown on the unit page uses the existing exam data (Year 12 Economics Assessment Task 1, 2026-12-01).
- Wording for "all essays finished", the done state of the flag button, and the phase 2 status steps is decided in the plan.
- Out of scope for v1: whole essays, introductions and conclusions; diagrams; quoting Section III stimulus; photo answers; teacher reports and a teacher review page; changes to other units.

# Feature Specification: Economics Essay Writing

**Feature Branch**: `010-economics-essay-writing`

**Created**: 2026-11-22

**Status**: Draft

## Clarifications

### Session 2026-11-22

- Q: Can a student drop an attempt in progress? → A: Yes, with a "Discard this attempt" button on the unit page, shown only while the attempt is unmarked; it deletes the scaffold, review and draft after a confirm, and any earlier marked result stays.
- Q: Does redoing the same essay count towards clearing a gap? → A: No. Only a later attempt on a different essay from the one that raised the gap counts.

**Input**: User description: see [specify-prompt.md](specify-prompt.md). Settled requirements: the Claude doc "Economics Essay Unit — Requirements". Draft marking prompt: `lib/essay/rubric.json`; marker pilot: `scripts/pilot-essay-marker.py`; labelled essays: `resources/topic011/pilot-essays.json`. There is no design.md: the quiz screen styling of spec 007 is reused and visual details belong in the plan.

## Terms

- **Essay**: one essay question with its server-only content (marking notes, the school's marking criteria where they exist, a band 1 model essay, the concepts a strong answer uses). Each essay is tagged with the economy the student must write about (China, Nepal, or both).
- **Attempt**: one try at an essay: a scaffold, an optional plan review, the essay text and its marking.
- **Scaffold**: the student's structured plan for the essay.
- **Plan review**: optional, unmarked feedback on the scaffold, read before writing.
- **Band**: one of the five AT1 mark bands: 17–20, 13–16, 9–12, 5–8, 1–4 (band 1 is the top).
- **Gap**: a concept from the unit's fixed concept list that the marker finds wrong, missing or only named.
- **AT1**: Year 12 Economics Assessment Task 1.

## Why

Peyton sits AT1 on Tue 1 Dec 2026: an in-class extended response (20%) on the Global Economy case study, with 5 minutes of planning on a handwritten one-page guide sheet, then 50 minutes to write an unseen question, aiming for 600–800 words. His economies are China (emerging) and Nepal (developing). The unit rehearses that task end to end: plan, write, get marked against the school's criteria. It also serves the 2027 HSC Section IV extended response. Spec 007 drills one paragraph part at a time; this unit is the whole essay. It reuses the rules and patterns of specs 005 and 007 (word counter, directive-verb glossary, drafts, locked-while-marking screen, LLM failure handling, "Things I need to know" tracking, one essay in progress at a time) rather than restating them. Shipping is urgent: the flow and marker first, then essays one at a time as each passes review.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Plan, write and be marked on a whole essay (Priority: P1)

A Year 12 student opens the unit, picks an essay, fills in the scaffold, starts writing, writes 600–800 words and submits. They see a mark out of 20 and its band, a verdict and feedback line for each of five criteria, and the band 1 model essay.

**Why this priority**: This is the whole feature. Without plan, write and mark there is nothing to ship.

**Independent Test**: With one essay available, complete the scaffold with a judgement and one body point, choose "Start writing", write 700 words, submit, and see a mark out of 20 with a band, five criterion verdicts and the model essay.

**Acceptance Scenarios**:

1. **Given** a student on the unit page, **When** they open an essay, **Then** the scaffold page shows the essay question with its directive verb highlighted and defined, the economy they must write about, and the scaffold form.
2. **Given** a student who chose "Start writing", **When** the essay page opens, **Then** it shows, top to bottom: the question (verb highlighted and defined), "Your plan" (read-only, collapsible, open by default), the essay box with a live word counter, an optional 50-minute timer, and "Submit essay"; there is no "Feedback on your plan" section.
3. **Given** a submitted essay, **When** marking finishes, **Then** the result page shows the mark out of 20 and band; a verdict and one feedback line for each of the five criteria; two "to lift your mark" points; any "check this figure" flags; the essay with the plan beside it; the band 1 model essay; and the gaps added to "Things I need to know".
4. **Given** the student has used their one try, **Then** there is no second try at that attempt.

---

### User Story 2 - Build the plan as a scaffold (Priority: P1)

The student plans in short fields: Introduction (judgement in one sentence answering the question; key terms to define; the economy or economies and their status); three body paragraphs, each with Point, Theory or model, Data and indicators with year, Evaluation, and Link back to the judgement; and Conclusion (restated judgement; the reason that weighs most). Notes and dot points are welcome. A total word counter caps the plan at 250 words, roughly one handwritten A4 side.

**Why this priority**: The plan is the first half of the task and the scaffold gates the essay page.

**Independent Test**: Type 251 words across the fields and confirm both buttons are disabled; cut to 250 and confirm they enable; clear the judgement and confirm both disable again.

**Acceptance Scenarios**:

1. **Given** a student typing in the scaffold, **Then** the total word counter updates live and shows the cap of 250.
2. **Given** more than 250 words, **Then** both "Get feedback on my plan" and "Start writing" are disabled.
3. **Given** an empty judgement, or all three body points empty, **Then** both buttons are disabled; any other single field may be empty.
4. **Given** a student who leaves and returns, **Then** the scaffold they typed is restored from its autosaved draft.
5. **Given** a student who chose either button, **Then** the scaffold is locked and cannot be edited, including from the essay page.

---

### User Story 3 - Optional feedback on the plan (Priority: P2)

Before writing, the student may press "Get feedback on my plan". They get one line on each of seven checks, each marked as a strength or a fix, then the essay page opens with "Feedback on your plan" (collapsible) above the box. The review never writes sentences or paragraphs for the student: each fix is a question or prompt ("Which indicator shows inequality rose after the reforms?"). It carries no mark.

The seven checks: (1) answers the question (the judgement responds to the directive verb and covers the economy or economies required); (2) strategies or globalisation influences are in scope (since 1980, by government or external bodies such as the IMF, World Bank, WTO, donors); (3) coverage of the top band (growth, development, environmental sustainability, income equality); (4) data (each body point has an indicator with a year; a figure that looks wrong is flagged "check this figure", never corrected with a number); (5) models (at least one, fitting its point); (6) evaluation (each point has a limitation or counterpoint, weighed in the conclusion); (7) fit (the plan would fill 600–800 words).

**Why this priority**: It lets the student fix the plan before writing, but the unit works without it.

**Independent Test**: Submit a scaffold with one body point lacking a year and confirm check 4 is a fix phrased as a question, no sentence is written for the student, and the essay page then shows the review.

**Acceptance Scenarios**:

1. **Given** a reviewed scaffold, **Then** the student sees seven lines, one per check, each marked strength or fix, and every fix is worded as a question or prompt.
2. **Given** a figure in the plan that looks wrong, **Then** it is flagged "check this figure" with no replacement number.
3. **Given** a reviewed plan, **Then** no mark is shown and the result page does not record whether the plan was reviewed.
4. **Given** the reviewer cannot be reached, or the student is at the daily marking limit, **Then** the student is told and offered "Start writing" without a review, and the scaffold is not lost.
5. **Given** a student who chose "Start writing", **Then** no review is made and no "Feedback on your plan" section appears.

---

### User Story 4 - Hard 600–800 word limit, no pasting, optional timer (Priority: P1)

Submit is enabled only at 600–800 words. The counter reads, for example, "412 / 600–800 words — 188 more to go" (Submit disabled), "712 / 600–800 words" (ready) or "836 / 800 — cut 36 words" (over, disabled). Pasting into the essay box is blocked, as in the in-class task. A 50-minute timer is optional, started by the student, not enforced, and submission stays open when it runs out.

**Why this priority**: The word limit and no-paste rule are what make this rehearse the real task.

**Independent Test**: Type 599, 600, 800 and 801 words and confirm the Submit state each time; attempt to paste and confirm nothing is inserted; send a 500-word essay straight to the server and confirm it is refused.

**Acceptance Scenarios**:

1. **Given** 599 words, **Then** Submit is disabled and the counter says "1 more to go"; **given** 600 or 800 words, Submit is enabled; **given** 801, it is disabled and the counter says to cut 1 word.
2. **Given** a paste into the essay box (keyboard, menu or drag), **Then** nothing is inserted.
3. **Given** the timer is not started, **Then** nothing about time is enforced; **given** it runs out, **Then** the student can still submit.
4. **Given** a submission outside 600–800 words reaching the server, **Then** the server refuses it using the same word count the browser shows.
5. **Given** a student who leaves and returns, **Then** their essay text is restored from its autosaved draft.

---

### User Story 5 - Marking out of 20 in the AT1 bands (Priority: P1)

While marking runs, the essay stays on screen, locked, with timed status steps. The mark is one holistic number out of 20 placed in one of the five AT1 bands. The marker judges five criteria, each as strong, sound, developing or weak with a reason: understanding of strategies; terms, concepts and theory; assessment of effectiveness; data and indicators; logical, cohesive response. It then picks the band whose descriptor fits best and a mark inside it. A mark outside its band is clamped into the band.

**Why this priority**: The mark and feedback are the payoff of the unit.

**Independent Test**: Submit a strong, a middling and a weak labelled essay and confirm each is marked in the expected band with five verdicts and reasons.

**Acceptance Scenarios**:

1. **Given** an essay under marking, **Then** the essay stays visible and locked, with timed status steps announced through a live status region.
2. **Given** a marker reply whose mark falls outside its chosen band, **Then** the final mark is clamped into the band and both raw and final marks are stored.
3. **Given** a question that requires one emerging and one developing economy, and the essay does not treat both, **Then** the final mark is capped at 12 (band 3) in code, from the marker's verdict on whether both economies are covered.
4. **Given** a figure the marker judges clearly wrong, **Then** the result flags it "check this figure", quoting the student's words, and states no replacement figure.
5. **Given** the essay's marking notes and, for trial questions, the school's own marking criteria, **Then** the marker uses them and the student never receives them.
6. **Given** a marking failure, **Then** the editable essay box returns with the text intact and a plain notice (no error, no invented mark).
7. **Given** the student is at the daily marking limit, **Then** they are told to come back tomorrow, the scaffold and essay are kept as drafts, and no marking is attempted.

---

### User Story 6 - Gaps feed "Things I need to know" (Priority: P2)

After marking, up to 5 gaps (most important first) are added to "Things I need to know", each one bullet naming the concept and what was missing, for example "China's WTO accession (2001): named but no effect on exports or FDI shown". Gaps come only from a fixed concept list. A gap clears after 2 later essays use it correctly.

The list: China (open-door policy and SEZs; WTO accession and export-led growth; FDI and the Belt and Road; SOE reform; infrastructure-led investment and debt; hukou and migration; environmental policy and emissions; inequality and poverty reduction; rebalancing and "dual circulation"); Nepal (1990s liberalisation; WTO accession and trade with India and China; remittances and labour migration; tourism; hydropower; aid, IMF and World Bank programs; LDC graduation; instability and the 2015 earthquake; poverty, HDI and human capital); shared skills (growth vs development; globalisation channels; environment trade-offs; inequality measures; external bodies; using models; sustaining a judgement; using data as evidence). Writing-skill gaps reuse spec 007's tips where they match.

**Why this priority**: It carries learning across essays, but the unit works without it.

**Independent Test**: Mark an essay that names the WTO without effects and confirm that concept is listed with its missing piece; then use it correctly in two later essays and confirm it clears.

**Acceptance Scenarios**:

1. **Given** a marked essay, **Then** at most 5 gaps are added, each from the concept list, most important first.
2. **Given** a marker reply naming a concept not on the list, **Then** that gap is dropped.
3. **Given** a gap used correctly in 2 later essays, **Then** it clears; **given** the correct use is in a redo of the essay that raised the gap, **Then** it does not count.
4. **Given** a concept that has not come up as a gap, **Then** it is not tracked.

---

### User Story 7 - Unit page, one essay at a time, redo (Priority: P1)

The unit page lists the six essays in alternating economy order: 1 (China), 3 (Nepal), 5 (both), 2 (China), 4 (Nepal), 6 (both). Each shows its latest mark; finished essays offer "Redo" and the essay in progress offers "Resume". Only one attempt is in progress at a time. Redoing a finished essay starts a new attempt and the latest mark counts. Trial questions show their source.

**Why this priority**: Navigation and one-in-progress protect the student's work and keep the flow simple.

**Independent Test**: Start essay 1, return to the unit page, confirm "Resume" on essay 1 and no way to start another; finish it, confirm "Redo" and the mark; redo it and confirm the new mark replaces the old on the page.

**Acceptance Scenarios**:

1. **Given** a new student, **Then** the page lists the live essays in the stated order with no marks.
2. **Given** an attempt in progress, **Then** that essay shows "Resume" and "Discard this attempt", and no other essay can be started until it is finished or discarded.
2a. **Given** the student confirms "Discard this attempt", **Then** the scaffold, review and draft are deleted, every essay can be started again, and any earlier marked result stays; **given** marking has begun, **Then** no discard is offered.
3. **Given** a finished essay, **Then** it shows its latest mark and "Redo".
4. **Given** a trial essay, **Then** its source (e.g. "Barker 2024 Trial, Q27") is shown; new essays show no source.
5. **Given** a resumed attempt, **Then** it opens at the step it was in: scaffold, essay page, or result. Marking in progress is never restored as marking: the essay opens editable, or the result shows.

---

### User Story 8 - Marker passes a check before content goes live (Priority: P1)

Before any essay is live, the marker is run on the labelled pilot essays and must pass the gate. Results are recorded in `resources/topic011/`. After launch, tuning on written test essays stops and the marker is revised from real student essays.

**Why this priority**: A wrong mark on a 20% task damages trust; the gate protects against that.

**Independent Test**: Run the pilot and confirm the gate figures are reported and each live essay's content has passed review.

**Acceptance Scenarios**:

1. **Given** the 7 pilot essays, **Then** the median mark is within the labelled range for at least 6, and none is more than one band away.
2. **Given** a one-economy essay on a two-economy question, **Then** the cap applies.
3. **Given** essays with planted wrong figures, **Then** the wrong figures are flagged.
4. **Given** the pilot's gaps, **Then** every gap is on the concept list.
5. **Given** an essay's content (marking notes, a band 1 model essay of 600–800 words with dated, sourced, checked figures, concept tags), **Then** it is live only once reviewed, and essays go live one at a time.

---

### Edge Cases

- Empty or whitespace-only essay: not submitted; the counter shows zero.
- Double submit or two tabs: only one marking per attempt; a second request is refused and the student is shown the first outcome.
- The counter and the server use one word-counting rule, so the browser and server never disagree about the limit.
- The essay box is locked while marking runs, so it cannot be edited then.
- A restored draft scaffold over 250 words: both buttons stay disabled until it is cut.
- A review that cannot be reached, or an unparseable reply after one retry: the student is told and offered "Start writing"; the scaffold is locked only once they move on.
- The database cannot be read: the unit does not start, resume or mark an attempt and shows a notice; it does not guess state.
- A student who writes about Australia, or an economy other than the one tagged, is marked down on the "logical, cohesive response" criterion; a two-economy question still needs both economies.
- Marks are always 1–20 inside the five bands; a mark of 0 is never returned.
- The model essay, marking notes and school criteria are never present in any response before the student's own result page.
- The timer is not saved with the attempt: a resumed attempt shows it unstarted until the student starts it again.
- A student who has finished all six essays sees all six with "Redo" and no "Resume".

## Requirements *(mandatory)*

### Functional Requirements

**Unit page and progression**

- **FR-001**: The unit page MUST list the essays in the order 1, 3, 5, 2, 4, 6 (China, Nepal, both, China, Nepal, both), each with its latest mark, "Redo" on finished essays and "Resume" on the one in progress.
- **FR-002**: Exactly one attempt MUST be in progress at a time; the system MUST NOT start a second while one is open.
- **FR-002a**: The essay in progress MUST offer "Discard this attempt" on the unit page while it is unmarked (planning or writing). After a confirm, it MUST delete the attempt's scaffold, review and draft and free the student to start any essay. It MUST NOT be offered once marking has begun, and it MUST NOT remove the marked result of any earlier attempt of that essay.
- **FR-003**: A finished essay MUST be redoable as a new attempt; the latest mark MUST count.
- **FR-004**: Trial essays MUST show their source to the student; new essays MUST NOT.
- **FR-005**: The unit MUST work with however many of the six essays are live, launching with at least essays 1, 3 and 5, and MUST NOT offer an essay that is not live.

**Scaffold**

- **FR-006**: The scaffold page MUST show the essay question with its directive verb highlighted and defined (as spec 007), the economy the student must write about, and the scaffold form.
- **FR-007**: The scaffold form MUST have: Introduction (judgement; key terms to define; economy or economies and status); Body paragraphs 1–3, each with Point, Theory or model, Data and indicators with year, Evaluation, and Link back to the judgement; and Conclusion (restated judgement; the reason that weighs most).
- **FR-008**: A total scaffold word counter MUST show a hard cap of 250 words; past 250 both buttons MUST be disabled.
- **FR-009**: No single field MUST be compulsory, but both buttons MUST be disabled while the judgement is empty or all three body points are empty.
- **FR-010**: The scaffold MUST autosave as a draft, as existing drafts do.
- **FR-011**: Two buttons MUST be offered: "Get feedback on my plan" and "Start writing". Once either is pressed and the student moves on, the scaffold MUST be locked and not editable anywhere.

**Plan review**

- **FR-012**: "Get feedback on my plan" MUST send the scaffold for review and then open the essay page with the review; "Start writing" MUST open it without one.
- **FR-013**: The review MUST give one line on each of seven checks (answers the question; strategies or globalisation influences in scope; top-band coverage; data; models; evaluation; fit to 600–800 words), each marked a strength or a fix, with fixes worded as questions or prompts.
- **FR-014**: The review MUST NOT write sentences or paragraphs for the student, MUST NOT state a replacement figure, and MUST flag a figure that looks wrong as "check this figure".
- **FR-015**: The review MUST give no mark, MUST NOT count towards the essay mark, and the result MUST NOT record whether the plan was reviewed.
- **FR-016**: If the reviewer cannot be reached or the student is at the daily marking limit, the system MUST tell the student and offer "Start writing" without a review. The review MUST use its own prompt file with its own prompt version and its own model setting, separate from marking.
- **FR-017**: A review MUST use one slot of the student's daily marking limit, and the slot MUST be refunded if the reviewer fails.

**Essay page**

- **FR-018**: The essay page MUST show, top to bottom: the question (verb highlighted and defined); "Your plan" (read-only, collapsible, open by default); "Feedback on your plan" (only if a review was chosen; collapsible); the essay box with a live word counter; an optional 50-minute timer; and "Submit essay".
- **FR-019**: Submit MUST be enabled only at 600–800 words, and the counter MUST read "N / 600–800 words — M more to go" under, "N / 600–800 words" in range and "N / 800 — cut M words" over.
- **FR-020**: Words MUST be counted with the rule in spec 005 (`lib/wordcount.ts`): one rule for the counter and the server. The server MUST re-check and refuse an essay outside 600–800.
- **FR-021**: Pasting into the essay box MUST be blocked.
- **FR-022**: The timer MUST be optional, started by the student, MUST NOT be enforced, and submission MUST stay open when it runs out.
- **FR-023**: The essay MUST autosave as a draft.
- **FR-024**: While marking runs, the essay MUST stay on screen, locked, with timed status steps announced through a live status region.
- **FR-025**: On a marking failure the editable box MUST return with the text intact and a plain notice; no error is shown, no mark is invented, the daily slot is refunded, and the essay is never self-marked (spec 007 failure handling; constitution Principle VI).
- **FR-026**: At the daily marking limit the student MUST be told to come back tomorrow, the scaffold and essay MUST be kept as drafts, and no marking MUST be attempted.

**Marking**

- **FR-027**: The marker MUST give one holistic mark out of 20 placed in the AT1 bands 17–20, 13–16, 9–12, 5–8, 1–4: it judges each criterion, picks the band whose descriptor fits best, then a mark inside it; a mark outside its band MUST be clamped into the band.
- **FR-028**: The five criteria MUST each carry a verdict (strong, sound, developing, weak) and a reason: understanding of strategies; terms, concepts and theory; assessment of effectiveness (a judgement answering the directive verb, sustained to the conclusion); data and indicators (contemporary, with years, used as evidence); logical, cohesive response (staying on the chosen economies, not Australia).
- **FR-029**: Each essay MUST carry its own marking notes; trial essays MUST also carry the school's own marking criteria from the solutions. These MUST reach the marker and never the browser.
- **FR-030**: For essays requiring two economies, if the essay does not treat both, the mark MUST be capped at 12 (band 3), applied in code from the marker's verdict on whether both economies are covered.
- **FR-031**: A figure the marker judges clearly wrong MUST be flagged "check this figure" with the student's words quoted; the marker MUST NOT state a replacement figure.
- **FR-032**: The result MUST show: the mark out of 20 and band; a verdict and one feedback line for each of the five criteria; two "to lift your mark" points; any "check this figure" flags; the essay with the plan beside it; the band 1 model essay; and the gaps added to "Things I need to know".
- **FR-033**: There MUST be one try per attempt. Marking MUST use its own prompt file with a prompt version bumped on every change and its own model setting. A malformed reply MUST be retried once, as elsewhere in the app.
- **FR-034**: The system MUST store, per attempt: the scaffold, the review (if any), the essay, every criterion verdict and reason, the band, the raw and final mark, flags, gaps and the prompt version.
- **FR-035**: Marking logs MUST contain only minimal metrics, never essay or plan text (spec 005 FR-044).

**Marker check (gate)**

- **FR-036**: Before any essay goes live, the marker MUST pass: median mark within the labelled range for at least 6 of the 7 pilot essays and none more than one band away; the one-economy cap applied; planted wrong figures flagged; and gaps only from the concept list. Results MUST be recorded in `resources/topic011/`.
- **FR-037**: After launch, the marker MUST be revised from real student essays, not further tuned on written test essays.

**Things I need to know**

- **FR-038**: After marking, up to 5 gaps MUST be added as tracked concepts, most important first, each one bullet naming the concept and what was missing.
- **FR-039**: Gaps MUST come only from the fixed concept list (stored with the marking prompt); a gap not on the list MUST be dropped. The content step MUST check and extend this list before launch.
- **FR-040**: A gap MUST clear after 2 later essays use it correctly. Only a later attempt on a different essay from the one that raised the gap counts; a redo of that essay does not; writing-skill gaps MUST reuse spec 007's tips where they match.

**Information release (constitution Principle I)**

- **FR-041**: Before marking, the browser MAY receive only: the essay question, directive verb and definition, the economy tag, the source of a trial question, and the student's own scaffold, review and drafts.
- **FR-042**: Marking notes and the school's criteria MUST NEVER reach the browser. The band 1 model essay MUST be released only with the student's own result.
- **FR-043**: The client MUST NOT send a user id, mark or band; the server MUST authorise every request from the session and the attempt the student owns.

**Content**

- **FR-044**: The unit MUST have six essays, each tagged with its economy: (1) China, Barker 2024 Trial Q27, verbatim; (2) China, new; (3) Nepal, Sydney Boys 2020 Trial Q27, verbatim; (4) Nepal, Abbotsleigh 2025 Trial Q28, verbatim; (5) both, new; (6) both, new. Question wording is as in [specify-prompt.md](specify-prompt.md).
- **FR-045**: No real HSC question MUST be used. "Explain" MUST be added to the directive-verb glossary with NESA's definition ("Relate cause and effect; make the relationships between things evident; provide why and/or how").
- **FR-046**: Each live essay MUST have marking notes, a band 1 model essay of 600–800 words with contemporary figures carrying years and sources that have been checked, concept tags from the concept list, and (trial essays) the school's marking criteria. Essays MUST go live one at a time as each passes review.
- **FR-047**: None of the six essays MUST repeat one of spec 007's essays.

**Constitution and accessibility**

- **FR-048**: This feature MUST amend the constitution where it changes the rules: Principle I (the essay unit's routes and what is released and when), Principle II (what is stored per attempt), Principle VI (the essay unit is never self-marked and keeps the editable box on failure, as specs 008 and 009), and Principle VII (the essay unit's model settings and daily cap use), and MUST comply with the constitution as amended.
- **FR-049**: Verdicts, strengths/fixes and statuses MUST NOT rely on colour alone; marking progress MUST be announced through a live status region; animations MUST stop under reduced motion; touch targets MUST be at least 44 px; pages MUST work at 390 px with no sideways scrolling.

### Key Entities

- **Essay**: question, directive verb, economy tag, source (trial questions), server-only marking notes, school criteria, band 1 model essay, concept tags.
- **Attempt**: one student's try at one essay: status (planning, writing, marking, finished), scaffold, review (if any), essay text, marks and per-criterion results, prompt version. At most one open per student.
- **Scaffold**: the fields of FR-007 with its autosaved draft and lock state.
- **Plan review**: seven check lines (strength or fix) for an attempt, with its prompt version.
- **Marking result**: raw and final mark, band, five criterion verdicts and reasons, two lift points, flags, gaps, prompt version.
- **Gap**: a concept from the fixed list, what was missing, and progress toward clearing.
- **Concept list**: the fixed list of China, Nepal and shared-skill concepts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can plan, optionally get plan feedback, write and submit an essay, and see the result, with the scaffold locked after planning (verified end to end on each live essay).
- **SC-002**: No essay outside 600–800 words is accepted, by the browser or the server (0 accepted in tests at 599, 801 and far outside), and pasting into the essay box inserts nothing.
- **SC-003**: At least 95% of essays show a mark and feedback within 2 minutes of submitting.
- **SC-004**: The marker passes the marker check before content goes live: at least 6 of 7 pilot essays inside their labelled range, none more than one band away, the one-economy cap applied and planted wrong figures flagged.
- **SC-005**: 100% of gaps shown are from the concept list, and each clears after 2 correct later uses.
- **SC-006**: 0 occurrences of marking notes, school criteria or a model essay in any response before the student's own result page (automated check across all essays).
- **SC-007**: When marking or review fails, 100% of students keep their text and see no error or invented mark.
- **SC-008**: The flow and marker are live with at least essays 1, 3 and 5 before Tue 1 Dec 2026.
- **SC-009**: No sideways scrolling at 390 px on any screen, and every interactive element is at least 44 px.

## Assumptions

- Specs 005 and 007 exist; their rules (word counter, glossary, drafts, locked-while-marking screen, failure handling, concept tracking, daily cap) carry over unless this spec says otherwise.
- The marking prompt, concept list and band descriptors in `lib/essay/rubric.json` are a draft that the content step revises; the marker pilot has not yet been run, and its results decide the default marking model.
- Marking and review use model settings separate from each other and from the other units (`ESSAY_GRADING_MODEL`, default deepseek/deepseek-v4.1-flash unless the pilot shows otherwise, and `ESSAY_REVIEW_MODEL`); the plan decides the details.
- Essays 2, 5 and 6 are new questions written for this unit; their marking notes, band 1 model essays and concept tags are researched and drafted by Qwen and reviewed by Claude. Trial essays use the school papers' wording verbatim.
- Essays 1–4 are written about the one economy tagged; essays 5 and 6 about both.
- The 50-minute timer and 250-word scaffold cap mirror the in-class task and are not configurable.
- Out of scope: photo answers; stimulus (Section III) essays; full exams; the paragraph unit's part-by-part correction loop; a second try within an attempt; teacher review pages.
- Visual design reuses spec 007's quiz screen styling; layout, spacing, collapsible behaviour and status step wording are decided in the plan.

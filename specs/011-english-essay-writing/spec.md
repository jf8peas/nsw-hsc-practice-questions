# Feature Specification: English Essay Writing

**Feature Branch**: `011-english-essay-writing`

**Created**: 2026-11-23

**Status**: Draft

## Clarifications

### Session 2026-11-23

- Q: When the marker and the quote check both flag the same invented quotation, should that quotation count as one knowledge error or two? → A: Count one knowledge error when both findings concern the same quotation.
- Q: After penalties or caps move the final mark into a different mark range, which band should the student see? → A: Show the band containing the final adjusted mark and store the marker-selected band separately.
- Q: Which parts of Away may be included in a finished result despite the general rule that the play text stays on the server? → A: Permit only near-miss correction excerpts and quotations within the released model essay; keep every other part of the play server-only.
- Q: What must the plan-review prompt demonstrate before the optional review can go live? → A: Test at least five scaffolds covering both strength and fix outcomes for every check; Chiang must approve every output for the five-line format, prompt-only fixes, no supplied writing and no mark.
- Q: If a student repeats the same factual mistake in an essay, should each occurrence count as a separate knowledge error? → A: Count each distinct underlying mistake once per essay; repeated occurrences do not increase the deduction or error count.
- Q: A quotation in single quotation marks often contains an apostrophe (I'm, don't, Tom's). Is it checked? → A: Yes. An apostrophe between two letters stays inside the quotation; single- and double-quoted quotations are checked alike (found in review on 23 Nov 2026: the pilot's pattern skipped them, which would have let misquotes and invented quotes through).
- Q: A student quotes the essay question or a syllabus phrase (e.g. "anomalies, paradoxes and inconsistencies"). Is that an invented quotation? → A: No. A quotation that matches the question's own wording or a phrase in lib/english-essay/quote-exclusions.json is "other source": it is not flagged and costs nothing.
- Q: The pilot gate used pilot marking notes; live essays use newly written notes. Is the pilot result enough? → A: No. Before essays 1–4 go live, the Away part of the gate is rerun with each essay's shipped marking notes (pilot option --notes-from).

**Input**: User description: see [specify-prompt.md](specify-prompt.md). Settled requirements: the Claude doc "English Essay Unit — Requirements" (https://claude.ai/artifact/Q29BJdcSdAJtPLNZktzCeF). The approved marking prompt is [rubric.json](../../lib/english-essay/rubric.json), prompt version **eng-essay-pilot-5**; the fixed gap concept list is [concepts.json](../../lib/english-essay/concepts.json); the pilot is [pilot-english-essay-marker.py](../../scripts/pilot-english-essay-marker.py), with results and decisions in [pilot-notes.md](../../resources/english-essay/pilot-notes.md). NESA's 2025 Paper 1 marking guideline and feedback are summarised in [2025-paper1-section-ii.md](../../resources/english-essay/nesa/2025-paper1-section-ii.md). The play text is [away-by-michael-gow.txt](../../resources/english-unseen/away-by-michael-gow.txt). There is no separate design document: reuse spec 010's screens and decide visual details in the plan.

## Terms

- **Essay**: one essay question with its server-only content (marking notes and a band 1 model essay).
- **Attempt**: one try at an essay: a scaffold, an optional plan review, the essay text and its marking.
- **Scaffold**: the student's deliberately light plan for the essay.
- **Plan review**: optional, unmarked feedback on the scaffold, read before writing.
- **Band**: one of the five HSC Section II mark bands: 17–20, 13–16, 9–12, 5–8, 1–4 (band 1 is the top).
- **Gap**: a concept from the unit's fixed concept list that the marker finds wrong, missing or only named.
- **Quote check**: a deterministic code step, not a model judgement, that compares every quotation in the essay with the play's text.
- **Away**: Michael Gow's play, the only prescribed text in this unit.

## Why

Peyton sits Year 12 Advanced English Task 1 on Mon 7 Dec 2026. The timed written response is worth 20%: 10 minutes of reading, then 90 minutes for Section I unseen texts and Section II, an unseen essay question on Away, with about 45 minutes for each section. There is no separate planning time and no notes. This unit rehearses Section II end to end: make a light plan, optionally improve it, write 800–1,200 words without pasting, and receive a mark out of 20 with specific feedback. It also serves the 2027 HSC Paper 1 Section II. Shipping is urgent, so the flow and marker ship first and essays go live one at a time as their content passes review.

## Inherited baseline

This unit has unit id **y12-english-essay-writing**. Except where this specification explicitly differs, [spec 010](../010-economics-essay-writing/spec.md) is normative for the flow, screens and rules: unit page; one attempt in progress per student; resume and confirmed discard of an unmarked attempt; autosaved scaffold and essay drafts; the locked-while-marking screen; marker-failure and daily-cap handling; one try per attempt; redo with the latest mark counting; the result page; band 1 model essay release; "Things I need to know" tracking; information release; accessibility; and minimal logging. [Spec 008](../008-english-unseen-short-answers/spec.md) supplies the established English conventions. This specification overrides Economics-specific content, scaffold structure, word and time limits, review checks, marking criteria, penalties and result additions; it does not restate unchanged behaviour.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rehearse an unseen Away essay end to end (Priority: P1)

A Year 12 Advanced English student opens the unit, chooses a live school-trial question, plans a response to Away, optionally requests plan feedback, writes and submits an 800–1,200 word essay, and sees a mark out of 20 with feedback and a band 1 model essay. The scaffold is locked once the student moves on, and there is no second try within that attempt.

**Why this priority**: This is the complete assessment rehearsal and the minimum useful feature.

**Independent Test**: With one live essay, complete a thesis and one claim, choose "Start writing", write an in-range essay, submit it, and confirm the locked plan, one marking run, the result and the model essay.

**Acceptance Scenarios**:

1. **Given** a student on the unit page, **When** they open a live essay, **Then** the scaffold page shows the verbatim question, its school-trial source, Away as the prescribed text, the directive verb highlighted and explained, and the light scaffold.
2. **Given** a valid scaffold, **When** the student chooses either "Get feedback on my plan" or "Start writing" and moves on, **Then** the scaffold is locked and the essay page opens with the question and read-only plan.
3. **Given** an in-range essay, **When** it is submitted, **Then** it stays visible and locked while marking runs, and the finished result shows the mark, band, four criterion verdicts and reasons, English-specific checks, model essay and gaps.
4. **Given** a finished attempt, **Then** no second try is offered within it; **when** the student chooses "Redo", **Then** a new attempt starts and its latest mark becomes the mark shown for that essay.
5. **Given** an unmarked attempt in progress, **Then** spec 010's resume and confirmed-discard behaviour applies, and no other essay in this unit can be started until it is finished or discarded.

---

### User Story 2 - Plan with a light, non-prescriptive scaffold (Priority: P1)

The student writes a one- or two-sentence thesis and up to three one-line body-paragraph claims, each with optional evidence notes. The scaffold encourages a sustained argument rather than a fixed paragraph template and has no conclusion field. Placeholder prompts guide the student instead of labelled sub-boxes. The whole plan is capped at 150 words, approximately five minutes of planning.

**Why this priority**: The real task has no separate planning time, and English rewards a sustained argument over a heavily prescribed planning template.

**Independent Test**: Type 151 words across the fields and confirm both actions are disabled; cut to 150 and confirm they enable when the thesis is present; clear the thesis and confirm both disable again while every other field may remain empty.

**Acceptance Scenarios**:

1. **Given** the scaffold page, **Then** it contains Thesis; Body paragraphs 1–3, each with a one-line Claim and an optional free-text Evidence notes box; and no conclusion field or labelled sub-boxes.
2. **Given** an empty or whitespace-only thesis, **Then** neither "Get feedback on my plan" nor "Start writing" can move the student on, regardless of the other fields.
3. **Given** a non-empty thesis and any combination of empty or filled claims and evidence notes, **Then** the student may move on, provided the total is at most 150 words.
4. **Given** more than 150 words in total, **Then** both actions are disabled until the plan is cut to 150 or fewer.
5. **Given** a student who leaves and returns, **Then** the scaffold draft is restored; **given** a restored draft over 150 words, **Then** both actions remain disabled.
6. **Given** a question using "to what extent", "discuss", "how" or "evaluate", **Then** that directive is highlighted and explained in terms that tell the student what the question requires.

---

### User Story 3 - Get optional, non-writing feedback on the plan (Priority: P2)

Before writing, the student may request a short plan review. It returns one line on each of five checks, marked strength or fix. Every fix is a question or prompt; the reviewer never writes sentences for the student. The review has no mark and does not affect the essay result.

**Why this priority**: It can improve the argument before writing, but the complete rehearsal works without it and the real assessment has no feedback step.

**Independent Test**: Submit a scaffold whose thesis is responsive but whose claims repeat it and whose evidence is narrow; confirm five lines, prompt-style fixes for the weak checks, no supplied sentences, and a transition to the essay page.

**Acceptance Scenarios**:

1. **Given** a reviewed scaffold, **Then** the student sees exactly one strength-or-fix line for each of: thesis answers this question in its own terms and takes a position, including "to what extent" where asked; each claim is an idea about human experience rather than a plot point or technique; claims build the thesis rather than restate it; evidence ranges across the play and its forms, including dialogue, stage directions, the play-within-a-play, staging and symbol; and the plan fits 45 minutes and 800–1,200 words.
2. **Given** any fix, **Then** it is phrased as a question or prompt and does not write a thesis, claim, sentence or paragraph for the student.
3. **Given** a completed review, **Then** no mark is shown, the review does not affect marking, and the result page does not report whether a review was used.
4. **Given** the reviewer cannot be reached or the student is at the daily marking limit, **Then** the student is told and offered "Start writing" without a review, with the scaffold retained.
5. **Given** the student chooses "Start writing" directly, **Then** no review is requested and no plan-feedback section appears on the essay page.

---

### User Story 4 - Write under the real length and no-paste constraints (Priority: P1)

The essay page follows spec 010, with an 800–1,200 word range and an optional 45-minute timer. The browser counter and server use the same counting rule. Submit is available only inside the range, and pasting is blocked.

**Why this priority**: These constraints make the practice resemble the timed, handwritten assessment rather than an unrestricted writing exercise.

**Independent Test**: Check 799, 800, 1,200 and 1,201 words in the browser; submit out-of-range text directly to the server; attempt keyboard, menu and drag pasting; and let the optional timer expire.

**Acceptance Scenarios**:

1. **Given** 799 words, **Then** Submit is disabled and the counter says how many more words are needed; **given** 800 or 1,200 words, **Then** Submit is enabled; **given** 1,201 words, **Then** Submit is disabled and the counter says how many to cut.
2. **Given** an essay outside 800–1,200 words reaching the server, **Then** it is refused using the same word count shown by the browser.
3. **Given** a paste into the essay box by keyboard, context menu or drag, **Then** nothing is inserted.
4. **Given** the optional 45-minute timer is not started, **Then** no time limit is enforced; **given** it expires, **Then** the student can still edit and submit.
5. **Given** a student who leaves and returns, **Then** the essay draft and locked scaffold are restored at the correct step, as in spec 010.

---

### User Story 5 - Receive a calibrated HSC mark with verified evidence (Priority: P1)

The marker awards one holistic mark out of 20 in the five Section II bands and explains four criteria: argument, analysis, knowledge and expression. It judges how fully the essay answers this particular question and identifies factual knowledge errors. A separate quote check verifies quotations against Away. Deterministic penalties and caps prevent prepared essays, invented evidence and factual errors from receiving undeservedly high marks.

**Why this priority**: A trustworthy mark and specific evidence feedback are the core learning value; an over-generous mark would create false confidence before a high-stakes assessment.

**Independent Test**: Mark labelled essays that fully, partly and barely answer their questions, plus essays with a near-miss quotation, an invented quotation and two factual errors; confirm the expected bands, deductions, caps and quote messages.

**Acceptance Scenarios**:

1. **Given** any marked essay, **Then** the result contains one whole mark from 1–20, its band, and a strong, sound, developing or weak verdict with a reason for each of argument, analysis, knowledge and expression.
2. **Given** a marker mark outside its selected band, **Then** it is first clamped into that band.
3. **Given** question focus "partly" or "barely", **Then** the final mark is capped at 12 or 10 respectively; **given** "fully", **Then** no question-focus cap applies.
4. **Given** wrong speakers, names or events, **Then** each distinct underlying mistake is listed as a knowledge error, one mark is deducted per error up to two marks, and two or more errors cap the mark at 16; repeated occurrences of the same mistake count once, and the marker's criterion verdicts are not independently lowered for those errors.
5. **Given** a quotation of three or more words that nearly matches the play, **Then** it is shown as "check this quote" with the play's exact words and costs no marks.
6. **Given** a quotation of three or more words not found in the play, **Then** it is shown as "check this quote: not found in the play" and counts as a knowledge error; **when** the marker also reports that same quotation as a knowledge error, **Then** the overlapping findings count as one error.
7. **Given** punctuation or ellipses in an otherwise accurate quotation, **Then** the quote check tolerates them rather than flagging the quotation.
8. **Given** any combination of adjustments, **Then** the final mark is calculated in this order: clamp to band, subtract the knowledge-error deduction, apply the two-error cap, apply the question-focus cap, and enforce a minimum of 1; **then** the displayed band is the one containing that final mark, even when it differs from the marker-selected band.
9. **Given** a malformed marker reply, **Then** it is retried once; **given** continued failure, **Then** spec 010's no-self-marking failure behaviour preserves the essay and awards no invented mark.
10. **Given** a quotation in single quotation marks containing apostrophes, such as 'Tell me what I'm feeling', **Then** it is extracted whole and checked exactly like a double-quoted quotation.
11. **Given** a quotation that matches the essay question's own wording or a listed syllabus phrase, **Then** it is treated as another source: no flag, no knowledge error and no deduction.
12. **Given** a not-found quotation on the result, **Then** the flag also tells the student that if the words come from another source they should say so, so the student understands why it was flagged.

---

### User Story 6 - Understand the result and carry gaps forward (Priority: P2)

The result page follows spec 010 and adds question-focus feedback, knowledge errors and quote-check findings. After the student's own finished result, it shows the band 1 model essay and the gaps added to "Things I need to know". Up to five gaps are recorded, most important first, and each clears after two later essays use it correctly.

**Why this priority**: The mark becomes useful when the student understands what hurt it, sees a strong response and carries a short list of weaknesses into later practice.

**Independent Test**: Finish an essay that partly answers the question, contains one factual error and one near-miss quote, and has two listed gaps; confirm every result element, then use each gap correctly on two later different essays and confirm it clears.

**Acceptance Scenarios**:

1. **Given** question focus "partly" or "barely", **Then** a question-focus line names the part of the question the essay did not engage; **given** "fully", **Then** that warning line is not shown.
2. **Given** knowledge errors or flagged quotes, **Then** the result lists each one, including the play's correct words for a near match.
3. **Given** a finished result, **Then** it shows the student's essay and locked plan, the band 1 model essay and the gaps, in addition to spec 010's mark, band, criterion feedback and lift points.
4. **Given** a marked essay, **Then** at most five gaps are added, most important first, and every gap comes from the unit's concept list.
5. **Given** a marker reply naming a concept outside that list, **Then** the gap is discarded.
6. **Given** a gap used correctly in two later essays, **Then** it clears; **given** a correct use only in a redo of the essay that raised it, **Then** it does not count toward clearing, consistent with spec 010.
7. **Given** an unfinished attempt, **Then** marking notes, the model essay and server-side calibration essays are neither shown nor sent to the browser.

---

### User Story 7 - Practise across six sourced questions as content is approved (Priority: P1)

The unit contains six generic Section II school-trial questions, answered as written about Away. Each displays its source. The flow and marker can ship before all six are available; each essay goes live separately after its marking notes and model essay pass review. The unit page and attempt lifecycle otherwise behave as in spec 010.

**Why this priority**: A varied unseen-question bank is necessary for assessment preparation, while staged release avoids delaying the approved flow and marker.

**Independent Test**: Enable only essays 1, 2 and 3 and confirm the complete flow works and no other essay can be started; approve essay 4 and confirm it appears without changing existing results.

**Acceptance Scenarios**:

1. **Given** the unit page, **Then** it lists live essays in the order 1–6, showing Knox 2025 Trial Q6, Pymble 2024 Trial Q6, Abbotsleigh 2025 Trial Q6, Fort Street 2023 Trial Q6, Girraween 2025 Trial Q6 and Barker 2026 Trial Q6 respectively.
2. **Given** an essay that has not passed content review, **Then** it is not live and cannot be started.
3. **Given** any live essay, **Then** its wording is verbatim from [specify-prompt.md](specify-prompt.md), its source is visible, and no real HSC question is used.
4. **Given** a live essay, **Then** its band 1 model essay is 900–1,100 words, every quotation passes the quote check with no flags, and Chiang has reviewed its marking notes and model essay.
5. **Given** questions 1–4, **Then** their pilot essays remain server-side calibration material and are never presented as student content.
6. **Given** all live essays are finished, **Then** each offers "Redo" with its latest mark and no attempt shows "Resume".

---

### User Story 8 - Preserve the pilot standard before release (Priority: P1)

The approved marker has passed its pilot. Any marking-prompt change requires a new prompt version and a fresh pass of the one-sided pilot gate with the deployed prompt and model. The separate plan-review prompt has not been piloted and must be drafted in the plan and pass the approval gate in FR-012 before students can use it.

**Why this priority**: The marker may be slightly harsh but must never be generous; regression checks protect the student from false confidence. The optional reviewer must not become an unvalidated source of misleading advice.

**Independent Test**: Run the pilot against the shipping configuration and confirm every gate component passes; change the marking prompt without changing its version or with a failed gate and confirm the content cannot go live.

**Acceptance Scenarios**:

1. **Given** the deployed marking prompt and model, **Then** at least 80% of pilot medians are within their labelled ranges, no median is above its range, every run is within two marks below to one mark above its range, and each essay's run spread is at most four marks.
2. **Given** the pilot's question-focus and knowledge-error cases, **Then** all expected checks pass; **given** its gap output, **Then** every concept is on the fixed list and no Away-only concept appears on another text's calibration essay.
3. **Given** the planted quote errors, **Then** all are caught with no false flags; **given** any pilot run, **Then** a usable reply is obtained after at most one retry.
4. **Given** any marking-prompt change, **Then** its prompt version changes and the full gate passes again before release.
5. **Given** at least five representative scaffolds, **When** the plan-review prompt is validated, **Then** the set collectively produces both strength and fix outcomes for every check, and Chiang approves every output for exactly five lines, prompt-only fixes, no supplied student writing and no mark; **given** any unmet condition, **Then** the review is not live, while "Start writing" remains available.

---

### Edge Cases

- Empty or whitespace-only thesis: treated as empty; both planning actions remain disabled.
- Empty or whitespace-only essay, or any essay outside 800–1,200 words: not accepted by either browser or server.
- Double submit or two tabs: only one marking run occurs per attempt; a duplicate request receives the first outcome, as in spec 010.
- A restored scaffold over 150 words: both planning actions stay disabled until it is cut.
- Reviewer failure, malformed review after one retry, or daily limit: the student is told and may start writing without feedback; no review blocks the essay.
- Marker failure or daily limit: spec 010's behaviour applies; text and drafts are preserved, no self-mark or invented mark appears, and a failed marking slot is refunded.
- Database unavailable: the unit does not start, resume, review, mark, discard or save an attempt and does not guess its state.
- Quotation under three words: outside the quote check's required scope and does not receive a quote flag.
- Single-quoted quotation with apostrophes inside: checked whole, like a double-quoted one.
- Quotation of the question or a listed syllabus phrase: other source, never a flag or a knowledge error.
- Quotation from a genuine outside source (a critic, an interview, a Shakespeare line not printed in Away): not found in the play and counted as a knowledge error, with the attribution hint shown; accepted as the cost of a never-generous marker.
- Near-miss quotation: exact play wording is shown with no mark penalty; a not-found quotation is a knowledge error and participates in the deduction and caps.
- Multiple adjustments at a band boundary: the mandated adjustment order applies and the final mark never falls below 1.
- Timer expiry or reload: never auto-submits or prevents submission; the timer itself follows spec 010's non-persisted behaviour.
- Model essay with any quote-check flag: blocked from going live until corrected and rechecked.
- The play text must be available to the server for every quote check. Only an exact near-miss correction excerpt or a quotation within a model essay released with the student's own finished result may include play words in a browser response; every other part of the play must remain server-only, and the play text must never be included in a public repository.

## Requirements *(mandatory)*

### Functional Requirements

**Inherited flow and attempt lifecycle**

- **FR-001**: The unit MUST be identified as **y12-english-essay-writing** and MUST reuse spec 010's unit page, screens and attempt lifecycle unless this specification explicitly overrides them.
- **FR-002**: Per student, exactly one attempt in this unit MUST be in progress at a time. Spec 010's resume, confirmed discard of an unmarked attempt, autosaved drafts, one try per attempt, redo and latest-mark rules MUST apply without change.
- **FR-003**: Spec 010's locked-while-marking presentation, marker-failure handling, daily-cap handling, database-unavailable handling, result persistence, accessibility behaviour and minimal logging MUST apply without change. This unit MUST never fall back to self-marking.

**Scaffold**

- **FR-004**: The scaffold MUST contain Thesis (one or two sentences answering this question and taking a position); Body paragraphs 1–3, each with a one-line Claim about human experience and an optional free-text Evidence notes box for quotations, scenes and techniques; and no conclusion field. Guidance MUST use placeholder prompts rather than labelled sub-boxes.
- **FR-005**: A total scaffold word counter MUST enforce a hard cap of 150 words. Above 150, both "Get feedback on my plan" and "Start writing" MUST be disabled.
- **FR-006**: The student MUST NOT be able to move on with an empty or whitespace-only thesis. No other scaffold field MUST be compulsory.
- **FR-007**: The question MUST show its directive verb highlighted and defined as in spec 010. The unit MUST support "to what extent", "discuss", "how" and "evaluate"; the plan MUST decide the presentation and explanation of the two non-NESA-glossary directives, with "to what extent" conveying a judgement about how far the statement holds.
- **FR-008**: Once the student moves on through either planning action, the scaffold MUST be locked and read-only everywhere, while remaining visible with the essay and result as in spec 010.

**Plan review**

- **FR-009**: "Get feedback on my plan" MUST request one optional review and then open the essay page with that feedback; "Start writing" MUST open the essay page without requesting a review.
- **FR-010**: The review MUST contain one line on each of the five checks in User Story 3, each marked strength or fix. Every fix MUST be a question or prompt, and the review MUST NOT write sentences or paragraphs for the student.
- **FR-011**: The review MUST have no mark, MUST NOT affect the essay mark, and MUST NOT be reported on the result page as a reviewed/not-reviewed outcome. The review itself, if made, MUST be stored with the attempt.
- **FR-012**: The review MUST use its own prompt file and prompt version, separate from marking, and its own model setting **ENGLISH_ESSAY_REVIEW_MODEL**, defaulting to **openai/gpt-6.2-sol**. Its prompt MUST be drafted in the plan. Before the review goes live, at least five representative scaffolds MUST collectively produce both strength and fix outcomes for every check, and Chiang MUST approve every output for exactly five lines, prompt-only fixes, no supplied student writing and no mark; any unmet condition MUST keep the review not live.
- **FR-013**: If the reviewer cannot be reached or the student is at **LLM_DAILY_CAP**, the student MUST be told and offered "Start writing" without a review. Review usage and failure refunds MUST follow spec 010's daily-cap rules.

**Essay page**

- **FR-014**: The essay page MUST follow spec 010's layout and draft behaviour, including the read-only collapsible plan and optional collapsible plan feedback, but MUST use an 800–1,200 word range and an optional 45-minute timer.
- **FR-015**: Submit MUST be enabled only from 800 through 1,200 words inclusive. The live counter MUST explain how many words remain below the range or must be cut above it.
- **FR-016**: Browser and server MUST use the word-counting rule inherited from [spec 005](../005-economics-sentence-writing/spec.md), and the server MUST refuse every submission outside 800–1,200 words even if the browser is bypassed.
- **FR-017**: Pasting into the essay box MUST be blocked for keyboard, menu and drag input.
- **FR-018**: The 45-minute timer MUST be optional, started by the student and never enforced; expiry MUST NOT auto-submit or disable editing or submission.
- **FR-019**: While marking runs, the essay MUST remain visible and locked. On failure or at the daily limit, spec 010's preservation, notice, retry and slot-refund behaviour MUST apply.

**Marking**

- **FR-020**: Marking MUST use the approved prompt in [rubric.json](../../lib/english-essay/rubric.json), prompt version **eng-essay-pilot-5**, with model setting **ENGLISH_ESSAY_GRADING_MODEL** defaulting to **openai/gpt-6.2-sol**, temperature 0 and a JSON reply. A malformed reply MUST be retried once. The marker MUST NOT silently fall back to another unit's marking model.
- **FR-021**: The marker MUST award one holistic whole mark out of 20 in bands 17–20, 13–16, 9–12, 5–8 and 1–4, using the band descriptors, criteria and per-question marking notes. It MUST also receive the server-only Away notes in [rubric.json](../../lib/english-essay/rubric.json) to check textual knowledge.
- **FR-022**: Four criteria MUST each receive a verdict of strong, sound, developing or weak and a reason: argument (answers this question and sustains a thesis); analysis (explains how form and language make meaning and their effect, rather than recounting); knowledge (accurate, well-chosen evidence); and expression (cohesive, controlled writing).
- **FR-023**: The marker MUST classify question focus as fully, partly or barely and provide a reason naming the question terms engaged or missed. Deterministic code MUST cap the final mark at 12 for partly and 10 for barely.
- **FR-024**: The marker MUST list wrong speakers, names and events as knowledge errors and MUST NOT lower its own criterion verdicts for them. Deterministic code MUST deduct one mark per error, to a maximum deduction of two, and cap the mark at 16 when there are two or more errors. Each distinct underlying mistake MUST count once per essay, regardless of repeated occurrences. When the marker and quote check both report the same invented quotation, the overlapping findings MUST also count as one knowledge error for the deduction and cap.
- **FR-025**: A deterministic quote check, not the model, MUST compare every quotation of three or more words with Away, tolerating punctuation and ellipses. A near miss MUST be labelled "check this quote", show the play's exact words and cost nothing. A quotation not found in the play MUST be labelled "check this quote: not found in the play", MUST add that a quotation from another source should be attributed in the sentence, and MUST count as a knowledge error. Quotations in single quotation marks MUST be extracted whole even when they contain apostrophes between letters. A quotation matching the essay question's own wording or a phrase listed in lib/english-essay/quote-exclusions.json MUST be classed "other source": never flagged and never a knowledge error. The exclusion list is not part of the marking prompt; editing it requires the quote parity check, not a new prompt version.
- **FR-026**: The final mark MUST be calculated in this exact order: clamp the marker's mark into its selected band; subtract the knowledge-error deduction; apply the cap at two or more knowledge errors; apply the question-focus cap; then enforce a minimum final mark of 1. The displayed final band MUST be the band containing that final mark, and the marker-selected band MUST be retained separately for audit.
- **FR-027**: The marking standard MUST remain one-sided: the marker may be slightly harsh but MUST NOT be generous. No marking-prompt change MUST ship without a new prompt version and a new pass of the pilot gate using the deployed prompt and model.
- **FR-028**: Per attempt, the system MUST store the scaffold; review if any; essay; every criterion verdict and reason; question focus and its reason; knowledge errors; quote-check results; raw and final mark; marker-selected and final band; gaps; concepts used well; and both marking and review prompt versions, together with the model information required by spec 010.

**Result and concept tracking**

- **FR-029**: The result page MUST follow spec 010 and additionally show a question-focus line when focus is partly or barely, naming the part of the question not engaged; all knowledge errors; and every flagged quote, with the play's correct words for a near match.
- **FR-030**: Only with the student's own finished result MUST the band 1 model essay be released. Marking notes MUST never reach the browser, and pilot essays MUST never be shown to students.
- **FR-031**: After marking, up to five gaps MUST be added to "Things I need to know", most important first, each naming the concept and what was wrong, missing or only named. Gaps MUST come only from the 11 Away concepts and 8 writing skills in [concepts.json](../../lib/english-essay/concepts.json), as extended through the reviewed content step; any other concept MUST be dropped.
- **FR-032**: A gap MUST clear after two later essays use it correctly. Spec 010's different-essay rule MUST apply: a redo of the essay that raised the gap does not count toward clearing it.

**Question bank and content release**

- **FR-033**: The unit MUST contain the six essay questions verbatim from [specify-prompt.md](specify-prompt.md), in the order and with the sources listed in User Story 7. Every source MUST be shown to the student, and no real HSC question MUST be included.
- **FR-034**: Each live essay MUST have server-only marking notes and a band 1 model essay of 900–1,100 words on Away. Every model-essay quotation MUST pass the quote check with no flags. Claude Code MUST draft the content and Chiang MUST review each essay's content before it goes live.
- **FR-035**: Essays MUST go live one at a time as each passes review, and the unit MUST work with any approved subset. The flow and marker MUST ship first, with at least essays 1, 2 and 3 live before Mon 7 Dec 2026.
- **FR-036**: The pilot essays associated with questions 1–4 in [pilot-away.json](../../resources/english-essay/pilot-away.json) MUST remain server-side calibration material and MUST NOT be released as student content.
- **FR-037**: "Evaluate" and "discuss" MUST reuse the existing directive glossary in [glossary.ts](../../content/glossary.ts). The plan MUST define how "to what extent" and "how" are highlighted and explained because they are not NESA glossary terms.

**Play text, information release and governance**

- **FR-038**: The server MUST have Away's text available at runtime for the quote check. The play text MUST remain server-only except for an exact correction excerpt for a near-miss quotation and quotations within a model essay released with the student's own finished result; every other part of the play MUST NOT be sent to the browser. The plan MUST choose a deployable server-only copy because the source under [resources/](../../resources/) is not version-controlled; the copyrighted text MUST NOT be committed to a public repository.
- **FR-039**: Before marking, public question content and the student's own scaffold, review and drafts MAY be released only on spec 010's schedule. Marking notes, server-only Away notes, all play text and the model essay before the student's own finished result MUST remain server-only. With the finished result, only the near-miss correction excerpts and model-essay quotations permitted by FR-038 MAY release play words; every other part of the play MUST remain server-only.
- **FR-040**: The feature MUST amend [constitution.md](../../.specify/memory/constitution.md) where its new unit changes the rules, including Principle I (release schedule and permitted requests), Principle II (stored attempt fields), Principle VI (no self-marking and failure behaviour), Principle VII (the two model settings and daily-cap use), and Principle V if the selected deployable play-text arrangement requires it. All quality gates MUST be extended to this unit.

**Pilot gate**

- **FR-041**: The deployed marker MUST pass [pilot-english-essay-marker.py](../../scripts/pilot-english-essay-marker.py): at least 80% of medians in range; no median above range; every run within the labelled low minus 2 to high plus 1; spread no greater than 4 per essay; all question-focus and knowledge-error checks passing; no off-list gaps or Away-only gaps on other texts; every planted quote error caught with zero false flags; and no unusable reply after one retry. Before essays 1–4 go live, the Away part of the gate MUST also pass with each essay's shipped marking notes in place of the pilot notes (pilot option `--notes-from`), and the TypeScript marking path MUST reproduce the Python pilot's final mark for every saved reply in the passing runs.
- **FR-042**: Pilot results and release decisions MUST remain recorded under [resources/english-essay/](../../resources/english-essay/). After real student essays arrive, marker revision MUST follow spec 010's real-use revision rule rather than continued tuning on newly written test essays.

### Key Entities

- **Essay**: one of six questions, its directive verb, school-trial source, live state, server-only marking notes and band 1 model essay.
- **Attempt**: one student's try at one essay, with status, locked scaffold, optional review, essay draft and submission, marking result and prompt versions. At most one is open per student in this unit.
- **Scaffold**: thesis, three optional claims with optional evidence notes, total word count, draft state and lock state.
- **Plan review**: five strength-or-fix lines, its prompt version and model; unmarked and never a prerequisite for writing.
- **Marking result**: raw and final mark, marker-selected and final band, four criterion verdicts and reasons, question focus and reason, knowledge errors, quote-check results, lift points, gaps and concepts used well.
- **Quote-check result**: each checked quotation, its status, and the play's exact words where a near match exists.
- **Gap**: a concept from the fixed list, the essay-specific detail and progress toward clearing through two later different essays.
- **Concept list**: 11 Away concepts and 8 writing skills, extendable only through reviewed content.
- **Play text**: the server-only reference used to verify quotations; only exact near-miss correction excerpts and quotations within a released model essay may become student-facing browser content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can plan, optionally receive plan feedback, write and submit an essay, and see the result, with the scaffold locked after planning, verified end to end on every live essay.
- **SC-002**: Zero essays outside 800–1,200 words are accepted by the browser or server in boundary and bypass tests, and 100% of tested paste attempts insert nothing.
- **SC-003**: At least 95% of submitted essays show a mark and feedback within 2 minutes of submission.
- **SC-004**: The deployed marker passes every component of the one-sided pilot gate, including zero essays with a median above the labelled range, on the shipping prompt version and model.
- **SC-005**: 100% of live band 1 model essays are 900–1,100 words and pass the quote check with zero flags.
- **SC-006**: 100% of displayed gaps come from the approved concept list, and each clears after exactly two correct uses on later different essays.
- **SC-007**: The flow and marker are live with at least essays 1, 2 and 3 before Mon 7 Dec 2026.
- **SC-008**: Across all six essays and all attempt states, there are zero occurrences of marking notes, server-only Away notes, pilot essays or a model essay before the permitted result; the only play excerpts in browser responses are near-miss correction excerpts and quotations within a released model essay, with every other part of the play appearing in zero browser responses.
- **SC-009**: In 100% of tested marker or reviewer failures and daily-limit cases, student text is preserved, no invented mark appears, and the student can continue through the specified fallback.
- **SC-010**: Every screen meets spec 010's mobile and accessibility checks, including no sideways scrolling at 390 px and touch targets of at least 44 px.
- **SC-011**: Before plan review goes live, 100% of at least five representative validation scaffolds have Chiang's approval for the five-line format, prompt-only fixes, no supplied student writing and no mark, with both strength and fix outcomes observed for every check.

## Assumptions

- [Spec 010](../010-economics-essay-writing/spec.md) and [spec 008](../008-english-unseen-short-answers/spec.md) exist and their inherited conventions carry over unless this specification explicitly says otherwise.
- The marking prompt and concept list are approved pilot assets, not drafts. Prompt version **eng-essay-pilot-5** and **openai/gpt-6.2-sol** passed the gate; DeepSeek v4.1 Flash and Claude Sonnet 5.5 were harsher than NESA's standard in the pilot.
- The plan-review prompt is not yet approved and must be validated separately before release; failure of the optional reviewer never blocks writing.
- Away is the only prescribed text in scope. The six Section II questions are generic enough to apply to Away exactly as written.
- The 150-word scaffold cap, 800–1,200 essay range and optional 45-minute timer are fixed rehearsal constraints, not student-configurable settings.
- The content step may extend the fixed concept list through review; it may not allow arbitrary marker-invented concepts.
- Visual design reuses spec 010's screens. Layout, spacing, collapsible behaviour, status wording, directive presentation for non-glossary terms and the deployable server-only play-text location are plan decisions.
- Out of scope: Section I unseen texts (specs 008 and 009); prescribed texts other than Away; photo answers; a full timed Paper 1; a second try within an attempt; and any separate planning timer or notes allowed in the real task.

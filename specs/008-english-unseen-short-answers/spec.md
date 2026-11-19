# Feature Specification: Advanced English Unseen-Text Short Answers

**Feature Branch**: `008-english-unseen-short-answers`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: see [specify-prompt.md](specify-prompt.md). Requirements doc: "Spec 008: Advanced English unseen-text short answers" (https://claude.ai/artifact/8iiHQJGqBbGtfx634bzBEp). Marker pilot: `resources/english-unseen/` and `scripts/pilot-unseen-marker.py`.

## Clarifications

### Session 2026-11-19

- Q: When does a question count as "answered" if the student leaves after a first try below full marks? → A: Not until the retry is marked or declined. The next quiz offers the same question again, resumed at the retry choice with the saved first try, and the first-try mark is not yet the recorded mark.
- Q: Which skills' verdicts count toward adding and clearing? → A: All seven verdicts on every first try, whatever the question's tags. Tags only steer the draw.
- Q: Does the flag cover the whole question or one marked answer? → A: One flag per question. The single button flags the whole attempt, with the first try, any retry, verdicts, reasons and marks all stored for the reviewer.
- Q: What happens when the retry cannot be marked? → A: The same as the first try (review edit, 2026-11-19, restoring the requirements doc's decision): marker unavailable → the retry text stays locked while the app waits and retries, then the editable box returns holding it to resubmit; daily limit reached → the student is told to come back tomorrow and the question stays at the retry, offered again first. The spec 007 FR-019a ending (record the first try, discard the retry) does not apply.
- Q: Visual texts are cropped images from the papers, which constitution Principle V forbids ("scanned, photographed or otherwise copied images MUST NOT be committed or served"). → A: Amend Principle V (review decision, 2026-11-19) to allow a visual stimulus text cropped from a school paper under the school-paper exception: credited with its source, served only to signed-in students, never a real HSC image, and removed or replaced if the app goes commercial.

## Terms

- **Text**: one unseen stimulus text (a poem, prose fiction, non-fiction, a personal essay, a visual text and so on).
- **Question**: one Section I question from a school trial paper that refers to exactly one text. A question with parts (a), (b) on the same text is one question.
- **Quiz**: one question shown with its text.
- **Skill**: one of the seven tracked skills listed under Key Entities.
- **Full marks**: the question's mark value (for example 4 out of 4).
- **First try / retry**: the first submitted answer, and the one optional corrected answer.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read one text, answer one question, get marked (Priority: P1)

A Year 12 Advanced English student opens the unit and gets one quiz: an unseen text with a question below it. They read at their own pace, type an answer in a box sized to the marks, and submit. They see their mark out of the question's value, what earned it, the single biggest gap, and a met or missed verdict on each of the seven skills.

**Why this priority**: This is the core loop. Peyton sits Year 12 Advanced English Task 1 on Mon 7 Dec 2026, and Section I is exactly this format. Without a question that can be answered and marked there is no feature.

**Independent Test**: With a handful of questions in the bank, open a quiz, write an answer of at least 20 words, submit, and see a mark, feedback, the biggest gap and seven skill verdicts, with no timer anywhere.

**Acceptance Scenarios**:

1. **Given** a student opens a quiz, **When** the page loads, **Then** the text is shown first, headed as on the paper (for example "Text 2 — Poem") with its title, author and source line, and the question, its mark value, its source and the answer box with a word meter sit below it.
2. **Given** a poem, **When** it is shown, **Then** its line and stanza breaks and any line numbers from the paper are kept; **and given** a prose text, **Then** its paragraphs are kept; **and** any glossary footnotes from the paper are shown.
3. **Given** a visual text, **When** the quiz opens, **Then** the student sees an image cropped from the paper which they can zoom, and the written description used for marking is not shown to them.
4. **Given** a question with parts (a) and (b) on the same text, **When** the quiz opens, **Then** both parts appear together and are marked together as one question.
5. **Given** a student on a phone, **When** they open a quiz, **Then** the text and the question stack, and the text stays reachable while they write.
6. **Given** a student takes as long as they like, **When** they read or write, **Then** no timer, reading-time lock or auto-submit ever appears.
7. **Given** an answer is submitted, **When** marking finishes, **Then** the mark, the feedback (two or three sentences on what earned the mark), the biggest gap (one sentence) and seven skill verdicts are shown within one minute.

---

### User Story 2 - Fix it once with tips, then see the model answer (Priority: P1)

When the first try scores below full marks, the student may retry once or decline. The retry box starts from their first try, with one tip card for each skill missed on the first try. The retry is marked on the same rubric and capped at one mark below full marks. The discussion shows the recorded mark (the higher of the two), which skills were met on the first try or fixed in the retry, the student's final answer beside the model answer, and a "This mark seems wrong" button.

**Why this priority**: The retry and the model answer turn marking into learning, and are the agreed approach from the paragraph-writing unit (spec 007). The model answer is also answer-key material, so when it appears matters.

**Independent Test**: Submit an answer that scores below full marks, confirm tip cards for the missed skills and a pre-filled box, submit the retry, and confirm the mark is capped, there is no third try, and the model answer first appears at the discussion; then flag the attempt twice and confirm one stored flag and an unchanged mark.

**Acceptance Scenarios**:

1. **Given** a first try at full marks, **When** the result arrives, **Then** the student goes straight to the discussion, which shows one "To go further" sentence below the feedback (the single most useful step to make the answer stronger still); it is never shown for a try below full marks and never changes the mark.
2. **Given** a first try below full marks, **When** the result arrives, **Then** the student sees the mark, feedback, biggest gap and skill verdicts, and can choose to retry once or decline, and the model answer is not shown or sent to the browser.
3. **Given** the student chooses to retry, **When** the retry screen opens, **Then** the box holds their first try, with one tip card per skill missed on the first try, and the tip cards contain no model-answer text.
4. **Given** a retry is submitted, **When** it is marked, **Then** it is marked on the same rubric, its mark is capped at one mark below full marks, no third try is offered, and the recorded mark is the higher of the first try and the capped retry.
5. **Given** the discussion, **When** it appears, **Then** it shows the recorded mark and an explanation of the cap where it applied, each skill marked "First try", "Fixed in retry" or missed, the student's final answer beside the model answer, the skills added to "Things I need to know", the first try collapsed, and a "This mark seems wrong" button; a full-mark first try also shows its "To go further" sentence below the feedback.
6. **Given** the student declines the retry, **When** they decline, **Then** the first-try mark is recorded and the discussion appears with the model answer.
7. **Given** an answer is being marked, **When** the student waits, **Then** their text stays on screen, locked, with status steps.
8. **Given** the discussion, **When** the student presses "This mark seems wrong", **Then** the attempt (the first try and any retry) is flagged, the button shows a done state ("Flagged for your teacher"), and the mark does not change.
9. **Given** an attempt already flagged, **When** the student presses the button again (or from another tab), **Then** nothing further is stored.

---

### User Story 3 - Learn what I missed (Priority: P1)

The skills a student misses on a first try are added to "Things I need to know", each with its short tip. A skill stays there until the student shows it on two first tries, then it clears.

**Why this priority**: This is the unit's link to the rest of the app and the reason the marker judges all seven skills on every answer.

**Independent Test**: Miss a skill on a first try and see it listed with its tip; fix it in the retry and confirm it is still listed; show it on two later first tries and confirm it clears.

**Acceptance Scenarios**:

1. **Given** a first try that misses a skill (any of the seven, tagged on the question or not), **When** the discussion appears, **Then** that skill is shown as added to "Things I need to know" with its tip.
2. **Given** a skill missed on the first try but met in the retry, **When** progress is counted, **Then** it still counts as missed.
3. **Given** a skill still in the list, **When** the student shows it on a first try, **Then** that counts toward clearing, and after two such first tries it clears.
4. **Given** a retry, **When** progress is counted, **Then** only the first try counts.

---

### User Story 4 - Keep getting new questions that target my weak spots (Priority: P2)

Each new quiz picks a question the student has not answered. It leans toward the text forms where their average mark is lowest, and toward questions tagged with a skill still in "Things I need to know".

**Why this priority**: The unit works with one question, but practice is more useful when it targets weaknesses. It depends on a bank large enough to choose from.

**Independent Test**: Answer questions of different text forms with different scores, start new quizzes many times, and confirm questions already answered never repeat and weaker forms and uncleared skills come up more often.

**Acceptance Scenarios**:

1. **Given** the student has answered some questions, **When** a new quiz starts, **Then** it is a question they have not answered, except that a question left after a first try below full marks is offered again first.
2. **Given** a text form the student has not yet tried, **When** the next question is drawn, **Then** untried forms have top weight until each has one answer.
3. **Given** the student's average mark (as a share of full marks) is lower for one text form, **When** questions are drawn, **Then** that form is chosen more often.
4. **Given** a skill still in "Things I need to know", **When** questions are drawn, **Then** questions tagged with that skill get extra weight.
5. **Given** the student has answered every question in the bank, **When** a new quiz is requested, **Then** they are told they have finished the bank.

---

### User Story 5 - Review flagged marks offline (Priority: P2)

The flags students raise with the discussion's "This mark seems wrong" button (User Story 2) are reviewed offline. A teacher exports reviewed flags as labelled test cases, every prompt change reruns every labelled case with the tuning, holdout and field sets reported separately, and a stronger model re-marks a sample of real answers near full marks so disagreements become new test cases. A teacher review page is not part of v1.

**Why this priority**: The marker passed its pilot but is not perfect (middle-band answers are sometimes marked one too high). Real use is the only source of further test cases, and the loop only matters once students are using the unit.

**Independent Test**: Export a flagged answer as a field case, label it, run the regression and confirm tuning, holdout and field are reported separately and the exported case carries no student identity; run the re-mark and confirm "marked too high" disagreements are listed first.

**Acceptance Scenarios**:

1. **Given** a flagged answer reviewed offline, **When** the teacher exports it, **Then** it becomes a labelled "field" case in the pilot file with no student identity, and every prompt change reruns every case in that file.
2. **Given** a sample of real answers marked at full marks or one below, **When** the teacher re-marks them offline with a stronger model, **Then** disagreements are listed with "marked too high" first and lower bands first, and can be exported as labelled field cases.
3. **Given** the regression run, **When** it finishes, **Then** the tuning, holdout and field sets are reported separately, and the holdout set is never used to tune the prompt.

---

### User Story 6 - A question bank built from real trial papers (Priority: P1)

The unit ships with a **starter bank** of five Fort Street questions (a poem, two prose texts, a non-fiction text and one visual text with its cropped image), live before 7 Dec 2026. The **full bank** is every usable single-text question from Questions 1–4 of the 37 school trial papers (15 schools, 2023–2026), each with its text, source, marking criteria, marking notes and model answer, tagged with text form, one to three skills and a syllabus outcome; it is built by a separate content task (the paper research, R-001 to R-008) that writes into the format and tooling this feature provides, and it has the same 7 Dec 2026 target. A review report lists what was kept and skipped for approval before any content goes live.

**Why this priority**: The bank is what the student practises on. The unit is only useful for Task 1 if it is stocked in time.

**Independent Test**: Run content validation and open the review report; confirm per-paper kept and skipped counts, counts by text form and mark value, the rubric source for each question, and that no skipped question appears in the bank.

**Acceptance Scenarios**:

1. **Given** a trial paper, **When** it is processed, **Then** every Section I question is listed (number, marks, texts referred to, text form) and only Questions 1–4 that refer to exactly one text are kept.
2. **Given** a kept question, **When** its text is stored, **Then** the text is copied verbatim with its layout, stored once, and the question points at it.
3. **Given** a question whose text is illegible or missing, that reuses a real HSC text, or whose visual detail a description cannot carry, **When** the paper is processed, **Then** it is skipped and logged with the reason.
4. **Given** a visual text, **When** its description is checked before going live, **Then** one the marker says is not enough is blocked from the bank and never shown.
5. **Given** a paper with school marking guidelines or sample answers, **When** its questions are stored, **Then** the criteria and model answer come from the school; **and given** a paper without them, **Then** draft band descriptors and a generated model answer are used and flagged as new for review before the question goes live.
6. **Given** the review report, **When** it is approved, **Then** only then does the content go live.

---

### Edge Cases

- A question worth 1 mark: the retry would be capped at 0, so no retry is offered and the first try is recorded.
- A student's first answer is under 20 words: Submit is disabled with a note saying why.
- A student's answer is more than 20% over the suggested length: Submit is disabled until the answer is cut. Up to 20% over shows a warning only.
- The marker is unavailable on the first try: the answer stays locked while the app waits and retries; if marking still fails the editable box returns with the student's text, and no mark is invented. There is no self-marking.
- The student has reached the daily marking limit: they are told to come back tomorrow, the answer stays in the box, and Submit stays disabled until the next day.
- The marker is unavailable, or the limit is reached, when the retry is submitted: handled exactly as on the first try (FR-032). The retry text is kept; the student resubmits, or comes back tomorrow and the question is offered again at the retry. The student may still decline the retry instead, which records the first-try mark.
- The marker's reply is empty, cut off, unparseable, or missing the mark, any skill verdict, the feedback or the biggest gap (or, at full marks, the "to go further" sentence): it is retried like a failed call.
- A request that never reached the server (network down): the editable box returns holding the text with the usual error.
- The student leaves after a first try below full marks, or mid-retry, and returns: the next quiz offers the same question again at the retry choice or the retry with the saved text; no recorded mark exists yet, marking states are never restored and typed text is not lost.
- A visual text whose description is not enough for the marker: blocked from the bank, never shown.
- Roseville 2026 is a scan and needs OCR; North Sydney Boys 2024 may be missing its stimulus booklet: both are handled in the content step and logged if unusable.

## Requirements *(mandatory)*

### Functional Requirements

**Quiz layout**

- **FR-001**: A quiz MUST show exactly one question on exactly one text.
- **FR-002**: The text MUST come first, headed as on the paper (for example "Text 2 — Poem"), with its title, author and source line.
- **FR-003**: Poems MUST keep their line and stanza breaks and line numbers where the paper has them. Prose MUST keep its paragraphs. Glossary footnotes from the paper MUST be kept.
- **FR-004**: Visual texts MUST be shown as an image cropped from the paper which the student can zoom. Each visual text MUST have a written description for the marker. The description MUST NOT reach the browser. Serving the cropped image needs the Principle V amendment recorded under Clarifications.
- **FR-005**: Below the text the quiz MUST show the question, its mark value, the question's source (school, year, exam, question number, as other units quote sources), and an answer box with a word meter and the suggested length.
- **FR-006**: On a phone the text and the question MUST stack, and the text MUST stay reachable while the student writes.
- **FR-007**: A question with parts on the same text MUST be one quiz: all parts appear together and are marked together.

**Answering**

- **FR-008**: There MUST be no timer, reading-time lock or auto-submit.
- **FR-009**: Answers MUST be typed. There is no photo-answer option.
- **FR-010**: Under 20 words, Submit MUST be disabled with a note saying why.
- **FR-011**: Each question's suggested length MUST be every line the paper gives for it (the main space plus the "If you need additional space" lines) at 12 words a line (for example 17 lines is about 204 words), shown on the word meter. Up to 20% over MUST show a warning. More than 20% over MUST disable Submit until the answer is cut. Where a paper's answer lines cannot be counted (for example drawn rather than printed lines), the suggested length MUST be the median for that mark value across the papers whose lines can be counted.

**Marking**

- **FR-012**: An LLM MUST mark each answer against the question's rubric (the school's band descriptors for each mark, with the marking notes as features a student could discuss, not a checklist). The unit MUST mark with the model named by a new environment variable, `ENGLISH_ADV_GRADING_MODEL`, defaulting to `deepseek/deepseek-v4.1-flash` when unset. It MUST NOT fall back to `GRADING_MODEL` (the rest of the app's marker, `deepseek/deepseek-chat`), which marked full-mark answers one mark low in the pilot.
- **FR-013**: The marker MUST receive the question, the directive verb and its definition, the text (or the visual's description), the school's marking criteria, the marking notes, the suggested length and the answer's word count, the question's model answer as an example of a full-mark answer, and the student's answer.
- **FR-014**: The marker MUST return one whole mark; a met or missed verdict with a one-line reason for each of the seven skills; two or three sentences of feedback on what earned the mark; and one sentence naming the biggest gap. At full marks only, it MUST also return one "go further" sentence (`goFurther`): the single most useful step that would make this answer stronger still, specific to this text and this answer; below full marks `goFurther` is null (the biggest gap does that job). `goFurther` is advice beyond the top band: the mark is decided first and MUST NOT be lowered because a `goFurther` point exists, and it MUST NOT quote or paraphrase the model answer or mention marks. The prompt is the pilot's passing prompt (`unseen-pilot-4`, then `unseen-pilot-5` with `goFurther` added and the marks unchanged), moved into the app as `lib/unseen/rubric.json` so the app and the pilot script read one file, and its `promptVersion` MUST be bumped on every change.
- **FR-015**: A reply that is empty, cut off, unparseable or missing any field (the mark, any skill verdict, the feedback or the biggest gap, or `goFurther` on a full-mark reply) MUST be retried like a failed call; a `goFurther` on a below-full reply is dropped.
- **FR-016**: The model answer given to the marker MUST be the school's sample answer where one exists, otherwise a generated answer reviewed before the question goes live.
- **FR-017**: The marker MUST also say whether a visual text's description was enough to mark from. Before a visual question goes live its description MUST be checked this way, and a visual text whose description is not enough MUST be blocked from the bank and never shown.
- **FR-018**: The result MUST show the mark out of the question's value, the feedback, the biggest gap and the seven skill verdicts. For a first try at full marks it MUST show the "To go further" sentence below the feedback instead of a biggest gap, in the same style as "Biggest gap" (not a warning or error colour), on the result, the discussion and the attempt detail page; it is never shown for a try below full marks.

**Retry and discussion**

- **FR-019**: A first try at full marks MUST go straight to the discussion.
- **FR-020**: Below full marks, the student MAY retry once or decline. The retry MUST start from the first try in the box, with one tip card per skill missed on the first try. The retry MUST be marked on the same rubric and capped at one mark below full marks. There MUST be no third try. The recorded mark MUST be the higher of the first try and the capped retry.
- **FR-021**: The discussion MUST show the recorded mark (and explain the cap where it applied); each skill marked "First try", "Fixed in retry" or missed; the student's final answer beside the model answer; the skills added to "Things I need to know"; the first try collapsed; and a "This mark seems wrong" button.
- **FR-022**: The model answer MUST NOT be shown, or reach the browser, before the discussion (after the retry, or once the retry is declined). Marking criteria, marking notes, model answers and visual descriptions are answer-key material and MUST stay server-only (constitution Principle I). Tip cards MUST NOT contain model-answer text.
- **FR-023**: While an answer is being marked, it MUST stay on screen, locked, with status steps announced through a live status region. On an error the editable box MUST return holding the student's text.
- **FR-024**: The first try and the retry MUST be recorded with the higher mark as the question's recorded mark. Scores MUST save per question like the other units; the question's text form and skill tags come from the bank by question id.

**Things I need to know**

- **FR-025**: The unit's concepts MUST be the seven skills, each with its short tip from the shared skills file `lib/unseen/skills.json` (public, so the tips can reach the browser; the prompt file is server-only).
- **FR-026**: Only the first try counts, and all seven skill verdicts on a first try count whatever the question's skill tags (tags only steer the draw, FR-028). A skill missed on the first try MUST be added to "Things I need to know" even if the student fixes it in the retry. A skill MUST clear after 2 first tries that show it.

**Question order**

- **FR-027**: Each new quiz MUST pick a question the student has not answered. A question is answered only when its recorded mark exists: a full-mark first try, a marked retry, or a declined retry. A question left after a first try below full marks, or with a retry that could not yet be marked (FR-032), is not answered: the next quiz offers it again, resumed at the retry choice or the retry with the saved text, before any new question is drawn. The draw MUST be weighted toward the text forms where the student's average mark (as a share of full marks) is lowest. Text forms not yet tried MUST get top weight until each has one answer.
- **FR-028**: Each question MUST carry 1–3 skill tags. Questions tagged with a skill still in "Things I need to know" MUST get extra weight. (The marker still judges all seven skills on every answer.)
- **FR-029**: When the student has answered every question in the bank, the unit MUST say so instead of starting a quiz.

**When marking can't happen**

- **FR-030**: If the marker is unavailable on the first try, the answer MUST stay on screen, locked, while the app waits and retries. If marking still fails, the editable box MUST return holding the student's text so they can resubmit. No mark MUST be invented and there MUST be no self-marking path.
- **FR-031**: If the student has reached the daily marking limit (LLM_DAILY_CAP), the app MUST tell them they have reached today's marking limit and to come back tomorrow. The answer MUST stay in the box and Submit MUST stay disabled until the next day.
- **FR-032**: If the retry cannot be marked, it MUST be handled like the first try, not as in spec 007 FR-019a: if the marker is unavailable, the retry text stays on screen, locked, while the app waits and retries, and if marking still fails the editable box returns holding the retry text so the student can resubmit; if the daily limit is reached, the student is told to come back tomorrow, the retry text stays in the box, Submit stays disabled until the next day, and the question stays at the retry (FR-027). No mark is recorded until the retry is marked or declined, and nothing is ever self-marked.
- **FR-033**: Each marked try MUST take one slot of the daily limit, with at most 2 per quiz (a marking that fails because the marker is unavailable is refunded, and the model retries inside one marking do not take a second slot). Grading MUST log only minimal metrics, never answer text.

**Revision from real use**

- **FR-034**: For each attempt the system MUST store the first-try and retry text, every skill verdict with the marker's one-line reason, the mark, and the prompt version that marked it (constitution Principle II).
- **FR-035**: The "This mark seems wrong" button MUST flag the question's attempt for review (the first try, any retry, their verdicts, reasons and marks). It MUST NOT change the mark, and an attempt MUST be flaggable once, idempotently across tabs, with one button for the whole question.
- **FR-036**: Reviewed flagged answers MUST become labelled test cases in `resources/english-unseen/pilot-questions.json` as a "field" set, exported with no student identity, and every prompt change MUST rerun every case in that file, reporting the tuning, holdout and field sets separately. The holdout set (Cheltenham Girls 2023, St George Girls 2025) MUST stay frozen and the prompt MUST never be tuned to it.
- **FR-037**: A periodic sample of real full-mark answers MUST be re-markable offline by a stronger model, with disagreements becoming labelled test cases, checking middle-band answers marked one too high first.
- **FR-038**: Reviewing flags and running the re-mark MUST be offline teacher tasks run by script. A teacher review page is not part of v1.

**Content**

- **FR-039**: The bank MUST be built from the 37 school trial papers in `resources/y12_english_advanced_paper1_trial_exams/`. Content MUST be copied verbatim with each question's source quoted. No real HSC question or text, including one reused in a school paper, MAY be used, so real HSC papers stay unseen.
- **FR-040**: For each paper, every Section I question MUST be listed (number, marks, texts referred to, each text's form), and only Questions 1–4 that refer to exactly one text MUST be kept.
- **FR-041**: Each kept text MUST be extracted verbatim with its layout and stored once, with questions pointing at it. Visual texts MUST be cropped to an image with a written description of what the marker needs (composition, colour, salient detail, any words in the image).
- **FR-042**: The school's marking guidelines and sample answers MUST be used where they exist. Otherwise draft band descriptors and a generated model answer MUST be written and flagged as new for review.
- **FR-043**: Each question MUST be tagged with its text form, 1–3 skills and a syllabus outcome (EAV-12-01, EAV-12-02 or EAV-12-04).
- **FR-044**: Questions whose text is illegible or missing, that reuse an HSC text, or whose visual detail a description cannot carry MUST be skipped and logged with the reason.
- **FR-045**: The bank MUST be written in the same format as the existing units under `content/units/` as unit `y12-english-advanced-unseen-texts`.
- **FR-046**: A review report MUST list questions kept and skipped per paper, counts by text form and mark value, and the rubric source, and MUST be approved before content goes live. Content validation MUST fail a shipped question that lacks a source, tags, criteria, model answer, or (for a visual) a checked description.

**Accessibility and layout**

- **FR-047**: Verdicts and statuses MUST NOT depend on colour alone; marking progress MUST be announced through a live status region; the result summary MUST take focus when it appears; animations MUST stop under `prefers-reduced-motion`; touch targets MUST be at least 44 px; and the quiz MUST work at 390 px with no sideways scrolling.

### Key Entities

- **Text**: one unseen stimulus text with its form, heading, title, author, source line, layout (poem lines or prose paragraphs), footnotes, and for visual texts an image and a server-only description. Stored once and referred to by one or more questions.
- **Question**: one Section I question with its mark value, directive verb, suggested length, source (school, year, exam, question number), text form, 1–3 skill tags and a syllabus outcome. Server-only: marking criteria, marking notes, model answer.
- **Skill**: one of seven tracked skills, shown in "Things I need to know" with a short tip:
  1. Answers every part of the question: covers every idea the question names, including qualifiers such as "complex" or "diverse".
  2. Follows the directive verb: does the task the verb sets. Missed only when the answer does a different task (an opinion when asked to analyse, or explaining without the judgement "assess" or "evaluate" requires).
  3. Analyses, doesn't retell: interprets meaning rather than recounting the text.
  4. Explains a technique's effect: names techniques with accurate metalanguage and shows how each shapes meaning.
  5. Uses apt evidence: short, precise quotations or visual details that prove the point.
  6. Links to the human experience: ties the analysis to the experience or emotion in the question.
  7. Writes succinctly: no padding, repetition or drift, and not well past the suggested length. Never missed for being short.
- **Attempt record**: per quiz, the first-try and retry text, the mark of each, every skill verdict with the marker's one-line reason, the feedback and biggest gap, the "to go further" sentence (full-mark first try only), the prompt version, the recorded mark and the flag.
- **Review report**: per paper, questions kept and skipped with reasons, counts by text form and mark value, and the rubric source (school or drafted).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can open a quiz, read the text and answer the question with no time limit, and no timer, lock or auto-submit appears anywhere in the unit.
- **SC-002**: At least 95% of submitted answers show a mark and feedback within 1 minute of submitting.
- **SC-003**: Every skill missed on a first try appears in "Things I need to know", and clears after exactly 2 first tries that show it.
- **SC-004**: Before 7 Dec 2026 the starter bank (five Fort Street questions, including the visual one) is live. The full bank (every usable single-text question from Questions 1–4 of the 37 papers) is delivered by the separate content task toward the same date, and its approved review report accounts for every skipped question with a reason; this feature is complete when the starter bank is live and the generator and report tooling work.
- **SC-005**: On the pilot's labelled sets the marker keeps its recorded results: at least 90% of tuning answers and at least 80% of held-out answers marked within the labelled range, and no more than 1 mark away on any case, checked on every prompt change.
- **SC-006**: The model answer, marking criteria, marking notes and visual descriptions appear in no response, page or static file before the discussion, checked across every shipped question.
- **SC-007**: Every screen works at 390 px with no sideways scrolling, with all touch targets at least 44 px and text meeting 4.5:1 contrast.
- **SC-008**: Across repeated draws, no question the student has already answered is offered again until the bank is finished, and the text forms with the lowest average mark are drawn more often.

## Assumptions

- The seven skills, `clearAfter: 2`, the model, the retry cap, the submission thresholds and the draw rule are as approved in the requirements doc (19 Nov 2026); this spec does not reopen them.
- The unit reuses spec 007's machinery and patterns (attempt model, retry and discussion layout, tip cards, flag, offline revision loop), and spec 006's question-screen patterns; spec 007's rules carry over unless this spec says otherwise.
- A question worth 1 mark gets no retry (the cap would be 0); the first try is recorded.
- Retry marking failures are handled like first-try failures (FR-032), not as in spec 007 FR-019a.
- Neither try has a self-marking path (unlike spec 007 and constitution Principle VI's general fallback), as decided for this unit; this needs a Principle VI amendment.
- "Next day" for the daily limit follows the app's existing Sydney-day boundary.
- The marker's calibration (model answer in the prompt, `deepseek-v4.1-flash`) holds in production as in the pilot; middle-band answers may occasionally be marked one too high, which the flag and offline re-mark exist to catch.
- Content is the work of a separate content step (paper research R-001 to R-008) run after planning; the bank may grow in stages as long as the approved report precedes going live.
- Constitution amendments are made as the plan's first task, as in spec 007. Known: Principle V (cropped visual stimulus images under the school-paper exception), Principle VI (no self-marking: wait and resubmit when the marker fails, come back tomorrow at the daily limit, on both tries). The plan identifies any others (for example Principle I for the new key fields, Principle II for the stored verdicts and flag, Principle VII for a unit-specific model).
- This is the app's first English unit; no Section II essay, comparative questions, full papers, reading time, teacher review page or photo answers are in scope.

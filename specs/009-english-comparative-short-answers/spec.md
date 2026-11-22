# Feature Specification: Advanced English Comparative Short Answers

**Feature Branch**: `009-english-comparative-short-answers`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: see [specify-prompt.md](specify-prompt.md). Requirements doc: "Spec 009: Advanced English multi-text short answers (Question 5)" (https://claude.ai/artifact/YZUmyBHmbYhabCn6S2DyMh). This is [spec 008](../008-english-unseen-short-answers/spec.md) with one change: each question refers to two texts and asks the student to compare them. **Everything spec 008 settled carries over unless this spec says otherwise**; this spec records only what differs. Where it says "as 008 FR-nnn", that requirement applies to this unit unchanged.

## Clarifications

### Session 2026-11-20

- Review (2026-11-20): the text-only page's access check counts every text a question shows (both texts of a fixed pair; every allowed text of a choice question, picked or not), so FR-005's "every allowed text can be opened" holds on a first visit; repeats drop the text-form weight as new draws do (FR-024); FR-027 no longer mentions reviewing flags (there is no flag).

- Q: When is a choice question's pick saved? → A: As soon as the student completes or changes it, with their draft (like a draft), so a resume restores it; the last saved pick before submit is the one marked, and it is fixed once the first try is submitted.
- Q: How do the two units share skill counts? → A: One count per skill across both units: a first try in either unit that misses a skill sets it back to 2 still to clear, and each later first try in either unit that shows it takes 1 off, so any two shows (in any mix of units) clear it. The two comparison skills have the same rule but only this unit's first tries feed them.
- Q: What does the unit page show for results? → A: "Your results" by question type, fixed pair and choice, each with answered of total and the average mark as a share of full marks (no text-form breakdown).
- Q: What if a choice answer writes about a text outside the student's pick? → A: The marker judges it against the picked texts only: material about a text outside the pick counts as off-task, and skill 1 ("Answers every part of the question") is missed if the answer does not cover the picked texts. Submit is never blocked for it.

## Terms

- **Text**, **quiz**, **skill**, **marker**, **recorded mark**, **discussion**: as spec 008.
- **Question**: one Section I question from a school trial paper that refers to two or more texts (every one found refers to exactly two). A quiz is one question.
- **Fixed-pair question**: names both texts ("Compare how Text 4 and Text 5 ...").
- **Choice question**: lets the student choose, either "Text 5 and ONE other text" or "any TWO of Texts 1 to 4". Its **allowed texts** are the fixed text (if any) and every text the student may pick from.
- **Pick**: the text or texts a student chooses on a choice question; the texts the answer is about.
- **Nine skills**: spec 008's seven skills (same ids and tips) plus **Compares the texts** and **Treats both texts in depth** (FR-021).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read two texts, choose if I may, write one comparison, get marked (Priority: P1)

A student starts a quiz and sees the question's texts in tabs, each labelled as on the paper ("Text 4 — Poem", "Text 5 — Image"). Below the tabs are the question, its mark value, its source and the answer box with the word meter. On a choice question they first pick the text or texts they are allowed to choose, then write, submit and get a mark, feedback, the biggest gap (or a "To go further" sentence at full marks) and a verdict for each of the nine skills. There is no time limit.

**Why this priority**: This is the core loop for the last and usually highest-mark question of Section I, which Peyton sits on Mon 7 Dec 2026 (Year 12 Advanced English Task 1) and which the 2027 HSC repeats. Without it the unit has no value.

**Independent Test**: With a handful of fixed-pair and choice questions in the bank, open a fixed-pair quiz, switch between its two texts, write at least 20 words, submit and get a mark with nine verdicts; then do the same on a choice question, picking first.

**Acceptance Scenarios**:

1. **Given** a student opens a quiz, **When** the page loads, **Then** every text the question refers to is in its own tab labelled as on the paper, on every screen size (never side by side), each with spec 008's display rules (heading, title, author, source line, poem and prose layout, footnotes, zoomable cropped image).
2. **Given** a fixed-pair question, **When** the quiz opens, **Then** the tabs are exactly the two named texts; **Given** a choice question, **When** it opens, **Then** the tabs show the fixed text and every text the student may choose from.
3. **Given** the answer box has text in it, **When** the student switches tabs, **Then** the answer box does not move and its text is not cleared.
4. **Given** a choice question, **When** the student has not completed the pick, **Then** Submit is disabled with a note saying why; **When** they complete or change the pick, **Then** it is saved at once with their draft, the last saved pick before they submit is the one marked, and leaving and returning (even on another device) restores it.
5. **Given** the student has submitted a choice question, **When** the marker runs, **Then** it receives only the picked texts (or each picked visual's description), and the pick is stored with the attempt.
6. **Given** a student takes as long as they like, **When** they read or write, **Then** no timer, reading-time lock or auto-submit appears (as 008 FR-008).
7. **Given** a student on a phone, **When** they open a quiz, **Then** the tabs, question and answer box stack and every control is at least 44 px with no sideways scrolling.

---

### User Story 2 - Put each text in its own window and highlight it (Priority: P1)

Each text's tab has spec 008's open-in-a-new-tab icon beside its heading. It opens only that text in a new browser tab (never the pair), so the student can keep each text in its own window beside the answer. Each text also has spec 008's highlighter toggle, in the quiz and in its tabbed-out page, synced live between them.

**Why this priority**: With two texts and one answer box, seeing both at once is the main reason to leave the quiz tabs; it is also why spec 008 made the text openable.

**Independent Test**: Open a fixed-pair quiz, open both texts in their own tabs, highlight a phrase in the quiz and see it appear in that text's tab; highlight in the tab and see it in the quiz.

**Acceptance Scenarios**:

1. **Given** a fixed-pair quiz, **When** the student uses the open icon on one text, **Then** only that text opens in a new tab, headed as on the paper, with no question, answer box or other text.
2. **Given** a choice question, **When** the student uses the icon, **Then** every allowed text can be opened this way, picked or not.
3. **Given** the text-only page, **When** a student without an attempt on a question that uses the text opens it, **Then** it answers a 404 and never reveals whether the text exists; **When** the student's only attempt on the text is in this unit (or only in spec 008's), **Then** it opens (the access check counts both units).
4. **Given** the student highlights words (as 008 FR-006a), **When** the quiz and the text's own tab are both open, **Then** the highlight appears in the other without reloading; the two texts of one question keep separate highlights.
5. **Given** a text the student highlighted in a spec 008 quiz, **When** it appears in this unit, **Then** it starts with no highlights (highlights are kept per user, attempt and text); a new attempt or a repeat starts with none; there is no highlighter on an image-only text.

---

### User Story 3 - Fix it once with tips, then see the model answer (Priority: P1)

As 008 User Story 2. A full-mark first try goes straight to the discussion. Below full marks the student may retry once or decline; the retry starts from the first try with one tip card per skill missed on it, is capped at one mark below full marks, and the recorded mark is the higher try. On a choice question the retry keeps the first try's pick and cannot change it. The model answer appears only in the discussion; on a choice question the discussion says it shows one possible pairing.

**Why this priority**: The retry and the model answer turn a mark into learning, and comparative answers are where students most need to see a worked example.

**Independent Test**: Submit a below-full answer on a choice question, take the retry, and check the cap, the recorded mark, the unchanged pick and the discussion note about the model answer's pairing.

**Acceptance Scenarios**:

1. **Given** a first try at full marks, **When** the result arrives, **Then** the student goes straight to the discussion (as 008 FR-019).
2. **Given** a first try below full marks, **When** the student retries, **Then** the retry is marked on the same rubric, capped at full marks minus one, and there is no third try (as 008 FR-020); a one-mark question offers no retry.
3. **Given** a choice question's retry, **When** it opens, **Then** the pick shown is the first try's and cannot be changed, and the marker receives the same picked texts.
4. **Given** the discussion of a choice question, **When** the model answer is shown beside the student's answer, **Then** a line says it shows one possible pairing and that other allowed pairings earn full marks equally.
5. **Given** a marking that cannot happen (marker unavailable, or the daily limit reached), **When** it fails on either try, **Then** spec 008's rules apply unchanged (FR-030 to FR-033): text stays, no mark is invented, no self-marking, one daily-limit slot per marked try.

---

### User Story 4 - Learn what I missed, including comparing (Priority: P1)

The unit's concepts are nine skills: spec 008's seven plus "Compares the texts" and "Treats both texts in depth". Only the first try counts; a skill clears after 2 first tries that show it. The seven shared skills use the same ids as spec 008, so a skill cleared in one unit is cleared in both and a miss in either unit adds it. The two comparison skills are tracked only from this unit's first tries.

**Why this priority**: Comparing is the skill this unit exists to teach, and "one text, then the other" is the commonest way to lose marks on it.

**Independent Test**: Miss "Compares the texts" on a first try and see it in "Things I need to know"; answer two later first tries that show it and see it clear; clear a shared skill in a spec 008 quiz and see it cleared here.

**Acceptance Scenarios**:

1. **Given** a first try that writes about each text in turn with a comparing sentence only at the end, **When** it is marked, **Then** the marker misses "Compares the texts".
2. **Given** a first try that analyses one text closely and only mentions the other, **When** it is marked, **Then** the marker misses "Treats both texts in depth".
3. **Given** a first try that misses a skill, **When** the student fixes it in the retry, **Then** the skill is still added (only first tries count, as 008 FR-026).
4. **Given** a skill cleared in spec 008 (or here), **When** the student opens "Things I need to know" in either unit, **Then** it shows as cleared in both; a miss in either unit adds it in both.
5. **Given** each of the two new skills, **When** it is shown in "Things I need to know", **Then** it has a short tip, like the seven skills.

---

### User Story 5 - Trust the marker on comparative answers (Priority: P1)

The marker has not yet been piloted on comparative answers. Before any content goes live, a pilot marks answers at each mark band on a handful of fixed-pair and choice questions across text forms, including "one text, then the other" answers and "one text far deeper than the other" answers, and must meet the same pass bar as spec 008. This is a release gate, not a feature the student sees.

**Why this priority**: A comparative mark that rewards or punishes the wrong thing would mislead the student more than a single-text mark would; nothing ships until the gate passes.

**Independent Test**: Run the pilot's tuning and holdout sets and read the report: results by set, errors, any answer outside its range.

**Acceptance Scenarios**:

1. **Given** the labelled tuning answers, **When** the pilot runs 3 times, **Then** at least 90% of majority marks fall inside their labelled range and none is more than 1 mark away.
2. **Given** the held-out answers (St George Girls 2025 Q5 and Cheltenham Girls 2023 Q1, already reserved), **When** the pilot runs, **Then** at least 80% fall inside their range, none more than 1 away, and the prompt is never tuned to them.
3. **Given** the labelled "one text, then the other" and "one text far deeper" answers, **When** they are marked, **Then** each misses the matching comparison skill.
4. **Given** the pilot's results, **When** they show comparative answers need a stronger model than `ENGLISH_ADV_GRADING_MODEL`, **Then** the unit uses its own appropriately named model setting instead of reusing it.

---

### User Story 6 - Keep getting questions that target my weak spots (Priority: P2)

Each new quiz picks a question the student has not answered, weighted toward questions tagged with a skill still in "Things I need to know". Spec 008's text-form weighting is dropped, because every question mixes forms. Once every question is answered, questions repeat as in spec 008.

**Why this priority**: The bank is small, so choosing the next question well matters less than the marking, but steering at weak spots is what makes the unit more than a quiz.

**Independent Test**: With skill counts and answered questions seeded, draw many quizzes and check that answered questions are not repeated, weak-skill questions are favoured, and after the bank is exhausted the repeat rule holds.

**Acceptance Scenarios**:

1. **Given** unanswered questions, **When** a quiz starts, **Then** it picks an unanswered one, with questions tagged with a skill still in "Things I need to know" weighted up.
2. **Given** every question answered, **When** a quiz starts, **Then** questions repeat: lower latest mark and older last answer first, never one from the last 3 quizzes, with spec 008's small-bank rule (as 008 FR-029).
3. **Given** a question left at the retry or the pick, **When** the student returns, **Then** it is offered again first, resumed at that step with the pick and drafts kept.

---

### User Story 7 - Revise the marker from an offline re-mark (Priority: P2)

As 008 User Story 5: there is no "This mark seems wrong" button. Both tries, every verdict with its reason, the mark, the prompt version, and the texts picked are stored. An offline re-mark of a sample of real first tries from every mark band by a stronger model produces a "field" set of labelled cases, and every prompt change reruns every case, reporting tuning, holdout and field separately.

**Why this priority**: It is how the marker is corrected once real students use it, but it needs real use first.

**Independent Test**: Run the offline re-mark on stored first tries and see disagreements exported as field cases without any student identity; run the full regression and see three separate sections.

**Acceptance Scenarios**:

1. **Given** stored first tries, **When** the re-mark runs, **Then** a sample from each mark band is re-marked by a stronger model (never counting against a student's daily limit) and disagreements become labelled field cases.
2. **Given** any prompt change, **When** the regression runs, **Then** every tuning, holdout and field case is rerun and reported separately.

---

### User Story 8 - A question bank built from real trial papers (Priority: P1)

The bank holds every usable multi-text Section I question from the 37 trial papers, with each question's texts, whether the student chooses, and which texts are allowed, built from spec 008's inventory and the papers. Texts shared with spec 008's bank are not duplicated. A review report is approved before content goes live.

**Why this priority**: Without questions there is no unit, and the sources are the papers' own questions, copied word for word and credited.

**Independent Test**: Read the review report: kept and skipped per paper with reasons, counts by mark value and by fixed-pair or choice, and the rubric source; spot-check a fixed-pair and a choice question against the paper.

**Acceptance Scenarios**:

1. **Given** the inventory, **When** the bank is built, **Then** every Section I question that refers to two or more texts is listed (33 found once the four extra papers were inventoried: 22 are Question 5 and 11 are Questions 1–4, 17 choice and 16 fixed pair, marks 3–8, most often 6), with for each whether the student chooses and which texts are allowed.
2. **Given** a text already in spec 008's bank, **When** a question here uses it, **Then** it points at the stored text and nothing is extracted twice; **Given** a new text, **Then** it is extracted with spec 008's rules (verbatim layout, cropped image with description, no inline footnote markers, "word: definition" footnotes, HSC check).
3. **Given** a question with school criteria and a sample answer, **When** it is built, **Then** they are used (origin "school"); **Given** none, **Then** drafted band descriptors that restate the question's wording and a generated model answer, flagged for review, meeting (not exceeding) the schools' full-mark standard: a clear comparative answer to the whole question with both texts treated in depth, about 35 words a mark.
4. **Given** the four papers not yet inventoried (Fort St 2023 and 2025, Roseville 2026, North Sydney Boys 2024), **When** the content step runs, **Then** they are inventoried (Roseville 2026 is a scan and needs OCR; North Sydney Boys 2024 may be missing its stimulus booklet).
5. **Given** a question whose text is illegible or missing, that reuses a real HSC text, or whose visual detail a description cannot carry, **When** the bank is built, **Then** it is skipped and logged with a reason.
6. **Given** the 6 papers whose Question 5 is on a single text (Abbotsleigh 2023, Barker 2026, Caringbah 2024, James Ruse 2024, North Sydney Girls 2024 and 2025), **When** the content step runs, **Then** they are not added here but recorded as a small amendment to spec 008's content rule (FR-040: keep every single-text Section I question, not only Questions 1–4), so they go into spec 008's bank.

---

### Edge Cases

- A fixed-pair question where one text is a visual: its tab shows the zoomable image; the marker reads the description for it, and there is no highlighter on it.
- A choice question where the student picks a different pairing from the model answer's: the marker never marks the answer down for the choice of an allowed text.
- A student switches the pick after typing: the answer text stays; only the stored pick and the marker's texts change, and the picked set is final once submitted.
- A choice question's pick is incomplete (for example "any TWO of Texts 1 to 4" with one chosen): Submit stays disabled with a note.
- A student picks a text the question does not allow: not possible in the UI; a submission naming one is rejected by the server.
- The same text appears in several questions, in spec 008's bank and in this unit: it is stored once; highlights are per attempt, so they are never shared across questions or units.
- A text tab opened in a new window for a text whose only attempt is a spec 008 one (or the reverse): it opens, because the access check counts attempts in both units.
- A choice answer writes about a text the student did not pick: the marker sees only the picks, treats material about the other text as off-task and misses skill 1 if the picked texts are not covered; Submit is not blocked.
- The marker returns a reply missing a comparison skill verdict: retried like any malformed reply (as 008 FR-015).
- The marker echoes the model answer, or names a text the student did not pick: handled as spec 008's echo guard and rejected as a malformed reply when it repeats the answer key.
- The database cannot be read when a quiz would start or resume: the unit does not guess a pick or a step (as 008).
- A multi-text question (3–8 marks) whose printed answer lines cannot be counted: the median for its mark value applies (as 008 FR-011), including 7 and 8 marks.

## Requirements *(mandatory)*

### Functional Requirements

**The quiz screen (changes from 008 FR-001 to FR-007)**

- **FR-001**: A quiz MUST show exactly one question that refers to two or more texts (in practice exactly two).
- **FR-002**: Every text the question refers to MUST be in its own tab, labelled as on the paper ("Text 4 — Poem", "Text 5 — Image"), on every screen size; texts MUST never be shown side by side. Each text keeps spec 008's display rules (as 008 FR-002 to FR-004): heading, title, author, source line, poem and prose layout, footnotes, a zoomable cropped image with a server-only description.
- **FR-003**: On a fixed-pair question the tabs MUST be the two named texts. On a choice question the tabs MUST show the fixed text (if any) and every text the student may choose from.
- **FR-004**: Below the tabs the quiz MUST show the question, its mark value, its source (as 008 FR-005) and the answer box with the word meter and suggested length. Switching tabs MUST NOT move the answer box or clear its text.
- **FR-005**: Each text's tab MUST have spec 008's open-in-a-new-tab icon beside its heading (008 FR-006). It MUST open ONLY that text, never the pair, on the text-only page. On a choice question every allowed text MUST be openable this way, picked or not.
- **FR-006**: The text-only page and its access rule MUST be spec 008's: sign-in required; a text shows only to a student with an attempt on a question that uses it (here, a text "used" by a question is every text it shows: both texts of a fixed pair, and every allowed text of a choice question, picked or not); anything else is a 404 that does not reveal whether the text exists; public text fields only. Because texts are shared with spec 008, the access check MUST count attempts in this unit as well as spec 008's, and the quiz MUST pass its attempt id to the page as in spec 008 (the page checks it is the student's own attempt on a question using the text).
- **FR-007**: Each text MUST have spec 008's highlighter toggle (008 FR-006a) in the quiz and in its tabbed-out page, synced live between them. Highlights MUST be kept per user, attempt and text, in the browser only (nothing sent to the server); a text highlighted in a spec 008 quiz starts clean here; a new attempt or repeat starts with none; they are removed 30 days after the attempt is final; there is no highlighter on an image-only text.

**Choosing a text**

- **FR-008**: On a choice question the student MUST pick the text or texts the question lets them choose, from chips naming each allowed text, before submitting. They MAY change the pick until they submit. Submit MUST be disabled, with a note saying why, until the pick is complete (the allowed number of texts picked, all from the allowed set).
- **FR-009**: The pick MUST be saved with the attempt as soon as the student completes or changes it (like a draft), so that leaving and returning restores it; the last saved pick before the first try is submitted is the one marked, and it is fixed from that submission on. The marker MUST receive only the picked texts (or each picked visual's description), never an unpicked allowed text. The retry MUST keep the first try's pick and MUST NOT allow it to change.
- **FR-010**: The server MUST reject a submission whose pick is incomplete, names a text the question does not allow, or (on a retry) differs from the first try's.

**Submission rules**

- **FR-011**: Submission rules MUST be spec 008's, unchanged (008 FR-008 to FR-011): no timer, reading-time lock or auto-submit; typed answers only; under 20 words Submit is disabled with a note; the suggested length is every printed answer line at 12 words a line, a warning up to 20% over, blocked beyond, with the median for the mark value as the fallback when lines cannot be counted (the medians for 7 and 8 marks are counted from this unit's papers).

**Marking**

- **FR-012**: Marking MUST be as spec 008 (008 FR-012 to FR-018): one whole mark; a met or missed verdict with a one-line reason for every skill (here all nine); two or three sentences of feedback; one sentence naming the biggest gap below full marks, or a "To go further" sentence at full marks; a reply that is empty, cut off, unparseable or missing a field is retried; criteria, notes, model answers and visual descriptions are server-only (constitution Principle I).
- **FR-013**: The marker MUST receive the question, its directive verb and definition, every text the student wrote about (the picked texts on a choice question, or each visual's description), the school's criteria, the marking notes, the suggested length and word count, the model answer as an example of a full-mark answer, and the answer.
- **FR-014**: The directive verb is nearly always "compare"; the unit MUST add NESA's definition of "compare" ("Show how things are similar or different") to its prompt's verbs. Girraween 2025 asks which of two texts uses language "most effectively", an evaluative comparison read as NESA's "evaluate".
- **FR-015**: On a choice question the model answer covers one pairing (the school's, or one generated pairing). The marker MUST be told it is an example of the standard, not of the texts to use, and MUST NOT mark an answer down for choosing a different allowed text, but MUST judge the answer against the picked texts only (an answer that does not cover them misses skill 1). The discussion MUST say the model answer shows one possible pairing.
- **FR-016**: The unit's marker prompt MUST be its own file (based on spec 008's prompt with the two comparison skills added) with its own prompt version, bumped on every change, and the offline pilot MUST read the same file the app does.
- **FR-017**: The marker model MUST be the same as spec 008's (`ENGLISH_ADV_GRADING_MODEL`) unless the marker check (FR-033) shows comparative answers need a stronger model; then the unit MUST use its own appropriately named model setting.
- **FR-018**: The result, the retry (a first try at full marks goes straight to the discussion; below full marks one retry or a decline; the retry starts from the first try with one tip card per skill missed on it, is capped at full marks minus one, and the recorded mark is the higher try), the discussion, the timing of the model answer, the locked answer during marking, and the handling of an unavailable marker or the daily limit MUST be spec 008's (008 FR-019 to FR-024 and FR-030 to FR-033), with the pick shown and fixed on the retry (FR-009).

**Skills**

- **FR-019**: The unit's concepts MUST be nine skills: spec 008's seven (same ids, same tips) plus the two in FR-021. Each has a short tip for "Things I need to know".
- **FR-020**: Skill 1 ("Answers every part of the question") MUST also cover using the texts the question requires (for example Text 5 plus one other).
- **FR-021**: The two new skills are: **Compares the texts** (draws out similarities and differences in how the texts shape the idea, linked by comparative language such as "whereas", "similarly", "by contrast"; missed when the answer writes about each text in turn and adds a comparing sentence only at the end) and **Treats both texts in depth** (gives each text the same depth of analysis with apt evidence from both; missed when one text is analysed closely and the other only mentioned).
- **FR-022**: The seven shared skills MUST share one count per skill with spec 008 (same skill ids): a first try in either unit that misses the skill sets it back to 2 still to clear, and each later first try in either unit that shows it takes 1 off, so any two shows, in any mix of units, clear it; a skill cleared in one unit is cleared in both, and a miss in either unit adds it. The two comparison skills MUST be tracked only from this unit's first tries. Only the first try counts; a skill clears after 2 first tries that show it (`clearAfter: 2`), as 008 FR-026.

**Question order**

- **FR-023**: Each new quiz MUST pick a question the student has not answered, weighted toward questions tagged with a skill still in "Things I need to know". Spec 008's text-form weighting MUST NOT apply. Each question carries 1–3 skill tags.
- **FR-024**: Once every question is answered the unit MUST NOT stop: questions repeat as in spec 008 (lower latest mark and older last answer first, plus the uncleared-skill weight; never one from the last 3 quizzes, with 008's small-bank rule); the text-form weight is dropped from repeats too. A question left unfinished (the pick, the first try's retry choice or the retry) MUST be offered again first, resumed at that step with the pick and draft restored.

- **FR-024a**: The unit page MUST show "Your results" by question type, fixed pair and choice, each with the number answered of the total and the average of the latest recorded marks as a share of full marks ("Not tried yet" where none), alongside "Things I need to know" and the start button as in spec 008 (008 FR-027, FR-029). It MUST NOT break results down by text form.

**Storage and revision from real use**

- **FR-025**: For each attempt the system MUST store the first-try and retry text, the texts picked (on a choice question), every skill verdict with its one-line reason, the mark, and the prompt version, so the marker can be revised from real use (as 008 FR-034).
- **FR-026**: The unit MUST NOT offer a flag or dispute button, route or stored flag (as 008 FR-035).
- **FR-027**: A periodic sample of real first tries, from every mark band, MUST be re-markable offline by a stronger model (never counting against a student's daily limit); disagreements become labelled "field" cases without any student identity, and every prompt change reruns every case, reporting tuning, holdout and field separately (as 008 FR-036 to FR-038). Running the re-mark and exporting field cases are offline teacher tasks run by script.

**Content**

- **FR-028**: The bank MUST keep every Section I question that refers to two or more texts, whatever its number, and record for each whether the student chooses and which texts are allowed. It is built from spec 008's inventory (`resources/english-unseen/inventory/`) and the 37 trial papers; the four papers not in the inventory (Fort St 2023 and 2025, Roseville 2026, North Sydney Boys 2024) MUST be inventoried in this step. The original PDFs and the bank source files stay in gitignored `resources/`.
- **FR-029**: Texts MUST be stored once and shared with spec 008's bank: questions here point at spec 008's stored texts; only texts not already there are extracted, with spec 008's extraction, cropping, description and HSC-check rules (FR-039 to FR-046 of spec 008, including verbatim layout, footnotes as "word: definition" with no inline markers, and the visual description check).
- **FR-030**: The rubric and model answer MUST follow spec 008 FR-042: the school's criteria and sample answers where they exist; otherwise drafted band descriptors restating the question's own wording and a generated model answer flagged for review that meets (not exceeds) the schools' full-mark standard, about 35 words a mark. No real HSC question or text may ship.
- **FR-031**: Each question MUST be tagged with the forms of its texts, 1–3 skills and a syllabus outcome (EAV-12-01, EAV-12-02 or EAV-12-04). Questions that cannot be kept (illegible or missing text, a reused HSC text, a visual a description cannot carry) MUST be skipped and logged with a reason.
- **FR-032**: A review report MUST list questions kept and skipped per paper with reasons, counts by mark value and by fixed-pair or choice, and the rubric source, and MUST be approved before content goes live.
- **FR-033** (marker check, a release gate): Before any content goes live, a pilot (as spec 008's `scripts/pilot-unseen-marker.py`) MUST mark answers at each mark band on a handful of fixed-pair and choice questions across text forms, including answers that write about each text in turn with one comparing sentence at the end (they must miss "Compares the texts") and answers that treat one text far more deeply than the other (they must miss "Treats both texts in depth"). The pass bar is spec 008's: at least 90% of tuning answers and 80% of holdout answers in the labelled range, none more than 1 mark away. The holdout is St George Girls 2025 Q5 and Cheltenham Girls 2023 Q1, already reserved and never tuned to.
- **FR-034** (amendment to spec 008): As part of this feature's content step, spec 008's content rule FR-040 MUST be amended to keep every single-text Section I question, not only Questions 1–4. The 6 single-text Question 5s (Abbotsleigh 2023, Barker 2026, Caringbah 2024, James Ruse 2024, North Sydney Girls 2024 and 2025) belong in spec 008's bank, not this unit.

**Accessibility**

- **FR-035**: Verdicts, statuses and tab state MUST NOT depend on colour alone; the tabs MUST be operable by keyboard and announce their labels and selected state; marking progress MUST be announced through a live status region and the result summary MUST take focus (as 008 FR-047).

### Key Entities

- **Question**: a Section I question referring to two or more texts: its texts, its type (fixed pair or choice), its allowed texts and how many the student may pick, mark value, directive verb, source, suggested length, 1–3 skill tags, syllabus outcome, and a server-only key (criteria, notes, model answer and its pairing).
- **Text**: as spec 008, shared with its bank; stored once.
- **Pick**: the text or texts the student chose on a choice question, stored with the attempt and fixed on the retry.
- **Attempt record**: as spec 008 with the pick added: both tries' text, every verdict with its reason, feedback, biggest gap, marks, prompt version, and the pick.
- **Skill**: one of nine; the seven shared skills use spec 008's ids and progress, the two comparison skills belong to this unit.
- **Review report**: the pre-release summary of kept and skipped questions, counts and rubric source.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A quiz shows one question with its texts in tabs; each text can be opened alone in its own tab and highlighted; and the question can be answered with no time limit and no timer, lock or auto-submit anywhere in the unit.
- **SC-002**: On a choice question the student's pick is stored with the attempt, the retry keeps it, and only the picked texts reach the marker (checked on every kept choice question).
- **SC-003**: At least 95% of submitted answers show a mark and feedback within 1 minute of submitting.
- **SC-004**: Before any content goes live the marker passes the marker check on comparative answers (at least 90% of tuning and 80% of held-out answers in the labelled range, none more than 1 mark away) and catches every labelled "one text, then the other" and "one text far deeper" answer as missing the matching comparison skill.
- **SC-005**: Every skill missed on a first try appears in "Things I need to know" and clears after exactly 2 first tries that show it; a shared skill's count is one across both units, so two shows in any mix of units clear it and it shows as cleared in both.
- **SC-006**: The model answer, marking criteria, marking notes and visual descriptions appear in no response, page or static file before the discussion, checked across every question, including the text-only page.
- **SC-007**: Before 7 Dec 2026 the bank holds every usable multi-text question from the 37 trial papers except the two held out for the marker check (33 found, so at most 30 ship: St George Girls 2025 Q5 and Cheltenham Girls 2023 Q1 are used only by the pilot, and North Sydney Boys 2024 Q4 is skipped because its stimulus booklet is missing), and the review report is approved.
- **SC-008**: Every screen works at 390 px with no sideways scrolling, all touch targets are at least 44 px, and text meets 4.5:1 contrast.
- **SC-009**: Across repeated draws, no answered question is offered again until every question is answered; after that, no question from the last 3 quizzes is offered (subject to the small-bank rule).

## Assumptions

- Spec 008 is in place and its code, patterns and rules are reused rather than restated: the question screen, the text panel and text-only page, highlighting, the marker pipeline, the retry and discussion, the draw's repeat rules, the content tooling and the review report.
- The two comparison skills are new to this unit and their tips are written for it; the seven shared skills keep spec 008's tips and ids so progress is shared.
- Every multi-text question found refers to exactly two texts; a question that names three or more would be handled by the same tabs and pick, but none is expected.
- The marker model starts as spec 008's; whether comparative answers need a stronger one is decided by the marker check, not assumed.
- Peyton's Task 1 date, Mon 7 Dec 2026, is the deadline for the bank; the marker check gates it, so the gate runs first.
- Constitution Principles I (answer key server-only), II (minimal data, signed-in students), V (school-paper exception) and VI (no self-marking) apply as in spec 008; a stored pick is the only new attempt data.

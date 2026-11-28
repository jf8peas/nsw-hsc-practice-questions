# Feature Specification: Case Study Facts: China and Nepal

**Feature Branch**: `012-economics-case-study-facts` (name only; no branch created)

**Created**: 2026-11-28

**Status**: Draft

**Input**: User description: "Economics Case Study Facts: a new topic-quiz unit (`y12-economics-case-study-facts`, Year 12, Topic 1: The Global Economy) that drills the facts and data a student needs to memorise for the Global Economy case study. Each attempt draws 2 multiple-choice and 3 short-answer questions, all built from one fact file. Ship before Tue 1 Dec 2026 (Assessment Task 1, an in-class unseen extended response); the unit also serves the 2027 HSC Section IV."

## Why

The student's weakest criterion in the first handwritten practice essay was data: no indicator with a year, three figures that could not be supported, and two wrong headline facts (the Belt and Road Initiative described as a rural program; Made in China 2025 dated 2025). Assessment Task 1 is on Tue 1 Dec 2026 and the 2027 HSC asks for the same skill. This unit drills recall of each fact with its year, and what the fact shows.

## Clarifications

### Session 2026-11-28

- Q: Where is the unit listed among the Year 12 units? → A: In the existing newest-first order, which puts it at the top. This replaces the earlier default of "straight after The Global Economy" (FR-004).
- Q: Does the unit show AI-written concept summaries and illustrations? → A: No (FR-026).
- Q: How precise must a date be to earn a short-answer mark? → A: The correct year is enough; day and month are never required, but model answers show them.
- Q: What earns the marks when a figure shows a change? → A: A question asking how something changed needs both values for the figure mark and both years for the period mark; a question about one year needs only that value and year.
- Q: Who checks the questions before the unit goes live? → A: The AI agent building the unit checks every figure and year against the fact file and reports the results; the maintainer then reads all questions and keys before release.
- Q: What ships if the work isn't all ready before Tue 1 Dec? → A: Two releases. The quiz, no-repeat draw and checks go first; "Things I need to know" follows as a second release, and until then the unit shows no revision list.
- Q: How many questions in each pool? → A: 8 per pool (40 questions), giving 8 attempts with no repeats. *(Amended after the 28 Nov review: a 41st question, s25, makes 9 in the "both" pool. Amended again on 28 Nov for the revised fact file: 48 questions, in pools of 9, 9, 10, 10 and 10.)*
- Q: What counts as the significance of a fact? → A: The fact's impact line is the expected significance; any other significance supported by the fact file earns the mark too.

## Terms

- **Fact file**: `docs/y12-economics-case-study-facts-research.md`. It holds 67 facts (China C01–C36, Nepal N01–N31), 44 of them marked ★ (priority), plus a comparison table, definitions, theory, common errors, an impact line for each fact and 40 numbered sources.
- **Fact**: one row of the fact file, identified by its ID.
- **Fact group**: one lettered section of the file (China A–G, Nepal A–F; 13 in all).
- **Impact line**: the fact file's context-and-impact line for a fact, keyed by its ID.
- **Quiz group**: one of the five slots in an attempt. A **question pool** is the set of questions a quiz group draws from.
- **Seen question**: a question the student has already answered in this unit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drill the facts in a short quiz (Priority: P1)

A signed-in student opens "Case Study Facts: China and Nepal", reads the description and three rules, and starts a quiz. It has 2 multiple-choice and 3 short-answer questions covering both economies. They answer each (typing, or by photo for short answers), see their mark, the correct answer and an explanation, and finish with a score.

**Why this priority**: This is the feature. It alone gives the student fact practice before Tuesday.

**Independent Test**: Start one quiz, answer all five questions, and check the shape, the marking and the feedback.

**Acceptance Scenarios**:

1. **Given** a student on the unit page, **When** they start a quiz, **Then** they get, in order, 1 China multiple-choice, 1 Nepal multiple-choice, 1 China short answer, 1 Nepal short answer and 1 short answer on both economies or an essay argument.
2. **Given** a multiple-choice question, **When** the student picks a wrong option, **Then** they see it is wrong, which option is correct, and an explanation that names the fact and its source number.
3. **Given** a 3-mark short answer, **When** the answer has the right figure (or an accepted rounding), the right year or period, and a statement of what it shows, **Then** it earns 3 marks.
4. **Given** a short answer that restates the figure without saying what it shows, **When** it is marked, **Then** the significance mark is not awarded.
5. **Given** a short answer with the other country's figure or the opposite direction of change, **When** it is marked, **Then** that part earns no mark.
6. **Given** the AI marker is unavailable or the daily limit is reached, **When** a short answer is submitted, **Then** the student self-marks against the model answer, as in other quiz units.
7. **Given** any question, **When** it is shown, **Then** its source line reads "Original question — case study facts (checked Nov 2026)".

---

### User Story 2 - Eight attempts with no repeated question (Priority: P1)

Over the days before the exam the student does quiz after quiz. For the first eight, every question is new to them, and every quiz still covers both economies, including when the app is steering them toward facts they have missed.

**Why this priority**: Repeats within a few attempts would waste most of the practice time and leave priority facts untested.

**Independent Test**: As one student, complete eight attempts, answering some wrongly, and compare the 40 questions drawn.

**Acceptance Scenarios**:

1. **Given** a student who has answered no questions in the unit, **When** they complete eight attempts, **Then** no question appears twice.
2. **Given** the second release and a student with missed concepts, **When** a quiz is drawn, **Then** it still has exactly one question from each quiz group, and within each group a not-yet-seen question on a missed concept is preferred.
3. **Given** a student who has seen every question in a pool, **When** the next quiz is drawn, **Then** that slot is filled with a seen question, preferring a missed concept and then the one answered longest ago.
4. **Given** the student's history cannot be read, **When** they start a quiz, **Then** it still starts with the same five-slot shape, drawn at random.

---

### User Story 3 - See what to relearn (Priority: P2)

After missing a question, the student sees its fact group under "Things I need to know" on the unit page, with a one-line note giving the fact and the correct figure and year. It clears after the app's usual run of correct answers.

**Why this priority**: It turns a wrong answer into a revision list. The quiz is useful without it, so this story ships in the second release.

**Independent Test**: Miss one question, open the unit page, then answer questions on that concept correctly until it clears.

**Acceptance Scenarios**:

1. **Given** a student who has missed no question, **When** they open the unit page, **Then** "Things I need to know" shows nothing to review.
2. **Given** a student who scored less than full marks on a question, **When** they open the unit page, **Then** that question's concept is listed with its description and a one-line note naming the fact and the correct figure and year.
3. **Given** a listed concept, **When** the student answers three questions on it with full marks, **Then** it is cleared and its note is no longer shown.
4. **Given** a student who has not missed a question, **When** any page is loaded, **Then** that question's note is not sent to their browser.

---

### User Story 4 - Trust every figure (Priority: P1)

The maintainer can trace every answer, figure and explanation to a fact ID, reads all questions and keys before release, and the build stops if the unit breaks a coverage or traceability rule.

**Why this priority**: A wrong figure taught the night before an exam does more harm than no unit.

**Independent Test**: Run content validation on the finished unit (passes), then break each rule in turn (fails with a message naming the problem).

**Acceptance Scenarios**:

1. **Given** the finished unit, **When** validation runs, **Then** it passes.
2. **Given** a ★ fact that no question tests, **When** validation runs, **Then** it fails and names the fact.
3. **Given** a question key naming a fact ID that is not in the fact file, or naming none, **When** validation runs, **Then** it fails and names the question.
4. **Given** a pool with fewer than 8 questions, a fact group with no question, or a fact tested by more than 3 questions, **When** validation runs, **Then** it fails.
5. **Given** a finished unit, **When** it is proposed for release, **Then** the fact-check report exists and the maintainer has read all questions and keys and had their findings fixed.

---

### Edge Cases

- **Date-only facts** (a WTO entry date): the date and year cannot be two separate marks. These are 2-mark questions: 1 mark for the event with its correct year, 1 for the significance. The year alone earns the date part; a missing or wrong day or month costs nothing. The UN climate pledge carries its own target years, so it is a 3-mark question: both targets; the year the pledge was made; the significance.
- **Comparison questions**: the figure mark needs the figures for both economies and the year mark needs both periods; one economy's data alone earns neither. Where the comparison is about change, each economy needs both values and both years.
- **Change over time**: one end of a change earns neither the figure mark nor the period mark. Where a fact has more than two points (tourist arrivals 2019, 2020, 2025), the values and years required are those the question asks about.
- **Different periods**: China and Nepal figures often cover different years (for example Gini 1990–2022 and 1995–2022). A question states or asks for each economy's own period.
- **Rounding**: "about 32%", "about a third" and "over 9%" are accepted where the marking notes say so; rounding never changes a direction of change or turns one fact into another.
- **Accurate figures outside the fact file**: the marking notes tell the marker that the mark is for the fact file's figure (or an accepted rounding of it).
- **Two Gini measures**: China's NBS figure (about 0.47) and the World Bank figure (36.0) are never compared as if on one scale; confusing them is a distractor, not a correct answer.
- **Secondary and government figures** (NBS Gini, Nepal's 1995-96 poverty rate, targeted poverty alleviation figures): wording does not claim more certainty than the fact file's notes allow.
- **Two currencies**: where the fact file gives a US dollar figure with the local currency in brackets, the model answer leads with US dollars, either currency is accepted, and a US dollar figure of the wrong size (bn for million) earns nothing.
- **A fact the file lacks**: the question is dropped, not completed from elsewhere.
- **Distractor years and figures**: wrong options are built only from values that appear in the fact file.
- **Photo answers, daily limit, database outage, abandoned quiz**: behave as in other quiz units. A question that was drawn but never answered counts as unseen.

## Requirements *(mandatory)*

### Functional Requirements

**Unit and page**

- **FR-001**: The app MUST offer a Year 12 topic-quiz unit with id `y12-economics-case-study-facts`, title "Case Study Facts: China and Nepal", topic "Topic 1: The Global Economy", built on the same pattern as the unit `y12-economics-global-economy`. It adds no new screen, route, question type or environment setting.
- **FR-002**: The description MUST follow the style of the other units and state: what it drills; that each attempt draws 2 multiple-choice and 3 short-answer questions covering both economies; that all questions are original and built from facts checked in November 2026; and that figures should be revised before the 2027 HSC.
- **FR-003**: The unit page MUST show a short guide with three rules: always give the year with a figure; say what the figure shows; never invent a number.
- **FR-004**: The unit MUST be listed in the existing order of units (newest first, so at the top of Year 12 when released). No ordering change is made.

**Attempt shape and draw**

- **FR-005**: Each attempt MUST draw exactly one question from each of five quiz groups, presented in this order: multiple choice China; multiple choice Nepal; short answer China; short answer Nepal; short answer both.
- **FR-006**: Each pool MUST hold at least 8 questions; the unit is written with 48 questions: 9 multiple choice on China, 9 on Nepal, 10 short answers on China, 10 on Nepal and 10 on both. The "both" pool's questions compare the two economies, or ask for the sentence a fact would support in an essay argument.
- **FR-007**: For this unit, each quiz group MUST draw an unseen question while its pool has one. *(Needs new code: the existing draw is random and can repeat questions after one attempt.)*
- **FR-008**: From the second release, favouring missed concepts MUST happen only within a quiz group and after the unseen rule; it MUST NOT change the one-per-group shape. When a pool has no unseen question, the draw prefers a missed concept, then the question answered longest ago. *(Needs new code: the existing weighting can move a place from one group to another, which could drop an economy from a quiz.)*
- **FR-009**: FR-007 and FR-008 MUST NOT change how any other unit draws.

**Coverage**

- **FR-010**: Every ★ fact (44) MUST be tested by at least one question.
- **FR-011**: Every fact group (13) MUST have at least one question, and no fact may be tested by more than 3 questions.

**Question rules**

- **FR-012**: Every question MUST be original; none is copied or adapted from a school trial or HSC paper.
- **FR-013**: Every question MUST record, in its server-only answer key, the IDs of the facts it tests (at least one).
- **FR-014**: Every question's public source line MUST read exactly "Original question — case study facts (checked Nov 2026)". *(Needs a validation change: only "Original question" or a school-paper credit is accepted today.)*
- **FR-015**: Every figure, date and name in a question, option, model answer, marking note, explanation or concept note MUST come from the fact file and be quoted as written there (rounding allowed). A statement of significance may draw on the impact lines of the question's facts and on the fact file's definitions and theory, but MUST NOT introduce a new figure, date, name or source. Nothing is taken from an impact line as data, including a quantity, ranking or trend it states in words; an explanation or note that adds a line leaves those words out.
- **FR-016**: Each multiple-choice question MUST have four options with exactly one correct. Distractors MUST come from real confusions: the fact file's common errors (Belt and Road as a rural program; Made in China 2025 dated 2025; NBS Gini compared with World Bank Gini; Nepal's graduation from least developed country status given as 2026; 4,120 MW called all hydro), China's and Nepal's figures swapped, the right figure with the wrong year, or the right event with the wrong direction (inequality rose in China and fell in Nepal). At least 4 of the 18 multiple-choice questions MUST test a fact's significance rather than recall: the correct option paraphrases the impact line, and the distractors are a wrong direction, the other economy's impact or a common error.
- **FR-017**: Every wrong multiple-choice option MUST have an explanation, shown only after the student answers, that names the fact and its source number. It MAY add the fact's impact line.
- **FR-018**: Each short-answer question MUST be worth 2 or 3 marks and ask the student to recall a fact with its figure or date and year, and to say what it shows for growth, development, inequality or the environment (or, in the "both" pool, to compare or to write the essay sentence it supports). The expected significance is that of the impact line(s) of the question's fact(s).
- **FR-019**: Each short-answer key MUST have a model answer and one mark point per mark: for 3 marks, the figure or date; the year or period; the significance. For 2 marks, the first two combined; then the significance. The significance point MUST state the expected significance from the impact line(s) of the question's fact(s), in words a student would write, not necessarily verbatim. Where the line does not fit what the question asks, the point MAY state another significance the fact file supports, recorded with that support in the fact-check report (FR-032). When the question asks how something changed, the figure point requires both values and the period point both years; when it asks about one year, only that value and year. The question's wording MUST make clear which it asks.
- **FR-020**: Each short answer's marking notes MUST state the tolerance: accept a rounded figure (for example "about 32%", "about a third") and the correct year or financial year; never require a day or month, although the model answer shows the full date the fact file gives; accept "over 9%" for the growth average; a figure from the wrong country, or the wrong direction of change, earns no mark for that part. For the significance mark, accept the impact line's point or any other significance the fact file supports; never award it for a bare restatement of the figure, or for a significance with the wrong direction (for example, saying China's inequality fell). The notes are shown to the student with the model answer, so they MUST read sensibly to a student.
- **FR-021**: Short answers MUST be marked by the app's existing short-answer marker, with its existing behaviour on marker failure and daily limit (self-marking) and for photo answers.

**Things I need to know**

- **FR-022**: The unit MUST have 13 concepts, one per fact group: `china-opening-up`, `china-growth`, `china-development`, `china-targeted-poverty-alleviation`, `china-inequality`, `china-environment`, `china-hindrances`, `nepal-strategies`, `nepal-growth-trade`, `nepal-flows`, `nepal-development`, `nepal-tourism-electricity`, `nepal-hindrances`. Every question MUST carry exactly one of them. Concept descriptions are public and MUST NOT give away answers.
- **FR-023**: A question scored below full marks MUST add its concept to the student's list, and the concept MUST clear by the app's existing rule (three later full-mark answers).
- **FR-024**: The unit page MUST head this list "Things I need to know" and show, under each listed concept, the one-line note of the most recently missed question on it, naming the fact and the correct figure and year. The note MAY end with that fact's impact line. *(Needs new code: this heading and per-concept notes exist only for the writing units.)*
- **FR-025**: Concept notes are answer-key material. They MUST stay on the server until the student has missed that question, MUST NOT be stored with results, and the project constitution MUST be amended in the same change to allow this release.
- **FR-026**: The unit MUST NOT show or generate AI-written concept summaries or illustrations, because they could introduce figures that are not in the fact file. *(Needs new code.)*

**Checks, documentation and delivery**

- **FR-027**: Content validation MUST cover the unit (every question has a key; concept tags are valid; every wrong option is explained) and MUST fail if any quiz group cannot be filled from a pool of at least 8. *(The quiz-group check is new.)*
- **FR-028**: An automated check MUST fail if any ★ fact ID appears in no question key, if any fact ID used is not in the fact file, if a question names no fact, if a fact group has no question, or if a fact is used by more than 3 questions. It MUST also fail if a fact ID has no impact line or more than one, if an impact line names an ID that is not in the fact file, or if an impact line contains a digit outside its ID. The fact file is the only list of facts, ★ flags and impact lines. *(New.)*
- **FR-029**: No answer-key material, including fact IDs and concept notes, may reach the browser before the app's rules release it (constitution Principle I).
- **FR-030**: The README units table MUST gain a row for the unit that cites the fact file as its source.
- **FR-031**: The full check chain (content validation, type check, lint, tests, build) MUST pass. Changes are left uncommitted.
- **FR-032**: Before release, the AI agent building the unit MUST check every figure, date, name and source number in every question, key and note against the fact file and report the results, including anything it changed or could not trace. The maintainer MUST then read all questions and keys. Nothing MUST be released until that read is done and its findings are fixed; this applies to each release for the content it adds or changes.
- **FR-033**: Delivery MUST be in two releases. **Release 1** (before Tue 1 Dec 2026): FR-001 to FR-007, FR-009 to FR-022 and FR-027 to FR-032, with no revision list, no concept notes and no favouring of missed concepts; every question already carries its concept tag. **Release 2**: FR-008 and FR-023 to FR-026, including the constitution amendment. Answers given during release 1 MUST count toward the revision list when release 2 arrives.

### Out of Scope

Essays and paragraph writing (specs 007 and 010); new question types; diagrams; timers; Australia; any fact not in the fact file.

### Key Entities

- **Fact**: ID, ★ flag, statement, date or period, source number, fact group, impact line. Lives in the fact file.
- **Question**: id, quiz group, type, marks, prompt, options (multiple choice), source line, concept tag. Public.
- **Answer key**: correct option or model answer and mark points, marking notes, wrong-option explanations, fact IDs, concept note. Server-only.
- **Concept**: one per fact group; id and one-line description.
- **Student progress**: derived from saved results; no new stored student data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can complete 9 attempts (45 of the unit's 48 questions) without seeing any question twice; the two multiple-choice pools of 9 set the limit.
- **SC-002**: 100% of attempts contain 2 multiple-choice and 3 short-answer questions, with at least one question dedicated to China and one to Nepal in each question type.
- **SC-003**: All 44 ★ facts and all 13 fact groups are tested; no fact is tested by more than 3 questions.
- **SC-004**: 100% of answer keys, figures, dates, names and explanations trace to a fact ID, and a full read-through finds no figure in any question that is not in the fact file.
- **SC-005**: In a check of sample answers for every short-answer question's tolerance cases that apply to it (rounded figure, year without day or month, only one end of a change, wrong country, wrong direction, bare restatement), the marks awarded match the marking notes.
- **SC-006**: Release 1 is live and usable on a phone before Tue 1 Dec 2026.
- **SC-007**: Release happens only after the fact-check report and the maintainer's read of all questions and keys, with no finding left unfixed.

## Assumptions

- The fact file is complete and correct as checked on 23–28 November 2026; this feature does not re-verify facts. The printed fact sheet and the six handwritten practice exams hold the same facts. `resources/topic011/figures.md` is background only; where wording differs, the fact file governs.
- The unit serves any signed-in student, like other units; no per-student targeting.
- Existing behaviour covers sign-in, saved results, daily limit, photo answers, teacher views and the pass mark (55%, as for "The Global Economy").
- New work is limited to the items marked in FR-007, FR-008, FR-014 and FR-024 to FR-028; everything else is content.

### Defaults kept from the feature description

| Decision | Default |
|---|---|
| Per-attempt split by economy | MC China 1, MC Nepal 1, SA China 1, SA Nepal 1, SA both 1 |
| Short-answer marks | 2 or 3 |
| Facts beyond the fact file's 67 | No: the fact file is the scope |

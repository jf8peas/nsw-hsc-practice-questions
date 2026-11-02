# Feature Specification: Economics Sentence Writing

**Feature Branch**: `005-economics-sentence-writing`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Economics Sentence Writing: a new Year 12 Economics unit that teaches students to write concise sentences in functional economics language. Each attempt draws 5 questions at random. Each question shows a plain-English sentence (e.g. "The government put a tax on stuff coming in from overseas, so the stuff from overseas got more expensive and people bought more of the stuff made at home instead.") and the student rewrites it as one concise sentence using the correct economics terms (e.g. "A tariff raises the price of imports, so consumers buy more from domestic producers."). The skill being taught is precision: naming the mechanism and using the right term, not adding new economics.

Question flow (one question at a time, like the existing short-answer flow):

1. Phase 1 - rewrite. The student sees the plain-English sentence and types a rewrite in a text box with a live word counter (limit 25 words). The answer is graded out of 3 marks: (a) the meaning and the cause and effect of the original are kept and correct; (b) every target term is used, and used correctly (all or nothing: one missing or misused term loses this mark); (c) the sentence is concise (within the word limit, no padding). Going over the limit does not block submission; it loses the conciseness mark. A 3/3 answer goes straight to the discussion.
2. Phase 2 - hinted retry (only when phase 1 scores under 3). The app lists only the target terms the student missed or misused, each with a one-line definition, and the student rewrites once more. Phase 2 is marked on the same criteria but capped at 2 marks, so a hinted answer never counts the same as an unaided one. There is no third try: whatever phase 2 scores, the question moves to the discussion.
3. Discussion. Shown after the last phase, in the same place and style as the short-answer model answer and feedback today: the model sentence (one or two accepted versions), each target term with its definition and why it fits this sentence, the student's phase 1 sentence (and phase 2 sentence, if any), and the grader's feedback on their final sentence.

The question's recorded mark is the phase 1 mark if it was 3, otherwise the phase 2 mark (max 2). Both sentences and both marks are saved with the attempt, and an attempt can be resumed in the middle of a question, including at phase 2 with the hint showing.

Answer key. Each question's key (server only, per constitution Principle I) holds: one or two model sentences; 1-3 target terms (usually 2), each with a one-line definition suitable for a student; and marking notes (accepted equivalents and common misuses). The target terms and definitions are sent to the browser only after phase 1 has been graded below 3 marks, and never before, including on page reload or resume. Authoring rule: every idea in the model sentence must already be in the plain-English sentence; the model adds precision and terminology, never new facts. Spelling and usage in model sentences must be exact (e.g. "affect", not "effect").

Grading. The LLM grader judges meaning, not exact word matches, under three rules: any grammatical form of a term counts ("specialise" for specialisation, "protected" for protection); an equivalent counts only if it is listed for that term (e.g. "import tax" or "customs duty" for tariff); everyday synonyms do not count unless listed ("poor country" is not "developing economy"). Listed misuses never count (e.g. "cheaper" for comparative advantage, "quota" for tariff). Besides the marks and feedback, the grader returns which target terms were missing and which were misused; that list drives the phase 2 hint. If the grader is unavailable, the question degrades the way short answers do today (constitution Principle VI): the student sees the target terms, their definitions and the model sentence and marks their own answer, with no phase 2. Each question uses at most 2 grading calls, so at most 10 per attempt, all counted against the existing LLM daily cap.

Concepts to review. Each target term is a concept of the unit (its one-line definition is the concept description), so a question is tagged with several concepts, not one as today. A term counts as correct for a question only when the student used it correctly in phase 1; a term missed or misused in phase 1 counts as wrong, even if it was used correctly in phase 2. Missed terms therefore appear in the unit's "Concepts to review" list (spec 002/003) with their definitions, carry across attempts, and clear after 3 correct uses, as concepts do now. New attempts weight towards questions that use terms still under review, as for other units.

Unit and content. A new unit type, "Writing Practice", alongside Topic Quiz, Milestone Test and Essay Practice. Unit id y12-economics-sentence-writing, Year 12, topic matching the existing Global Economy unit, with a short unit-page guide explaining the two phases and the 3-mark criteria. The first bank covers HSC Topic 1 "The Global Economy" of the 2009 syllabus only (the syllabus the 2027 HSC examines). The term list and a 10-question pilot are in resources/topic009/ (01-term-inventory.md, 03-pilot-questions.md, 04-findings.md); read them first. About 60 original questions (written for this app, so no source line; constitution Principle V), drawn 5 at a time so a student gets about 12 attempts before questions repeat. Because a missed term needs 3 later correct uses to clear, every tracked term must appear in at least 4 questions of the bank; with about 60 questions at about 2.2 terms each, that means roughly 30 tracked terms, not the 40 in the inventory (the plan settles the final list). Content validation must check that every question of this type has a model sentence and 1-3 target terms each with a definition, that every target term is a concept of the unit, and that every concept appears in at least 4 questions. Photo answers are not offered for this question type.

Out of scope: writing the question bank itself (a separate content task, done after the plan); other Economics topics or Year 11 terms; changes to the existing short-answer, multiple-choice or essay scaffold flows beyond what multi-concept tagging needs; teacher-facing reports.

Tests: grading and hint selection with a stand-in grader (criterion (b) all or nothing; phase 1 full marks skips phase 2; phase 2 capped at 2; only missing/misused terms shown); the terms and definitions never reach the browser before a phase 1 grade, including on resume; concept results counted from phase 1 only; the degrade path; content validation of the new question type.

Must comply with constitution 2.11.0."

## Reference

The term inventory, the 10-question pilot and the findings that shape this spec are in
`resources/topic009/`:

- `01-term-inventory.md` — 40 candidate terms with student definitions, accepted equivalents and
  common misuses, mapped to syllabus dot points and existing concepts;
- `03-pilot-questions.md` — 10 pilot questions with plain-English sentences, model sentences,
  target terms, marking notes and worked weak rewrites;
- `04-findings.md` — findings and recommendations (word limit, terms per question, term reuse,
  hint leakage, grading risks) that this spec adopts.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rewrite a plain-English sentence in economics language (Priority: P1)

A student starts a Writing Practice attempt, sees a plain-English sentence, and types a rewrite in
a text box with a live word counter. They submit and get a mark out of 3 with feedback.

**Why this priority**: This is the whole point of the unit — precision in naming the mechanism and
using the right term, not adding new economics.

**Independent Test**: Start a Writing Practice attempt, answer one question in phase 1, and confirm
a mark out of 3 appears with feedback, and that a 3/3 answer goes straight to the discussion.

**Acceptance Scenarios**:

1. **Given** a Writing Practice attempt, **When** the student starts, **Then** they see one question
   at a time, each showing a plain-English sentence and a text box with a live word counter (limit
   25 words).
2. **Given** the student has typed a rewrite, **When** they submit, **Then** the answer is graded
   out of 3: (a) the meaning and the cause and effect of the original are kept and correct; (b)
   every target term is used, and used correctly (all or nothing — one missing or misused term
   loses this mark); (c) the sentence is concise (within the word limit, no padding).
3. **Given** a rewrite over 25 words, **When** the student submits, **Then** submission is not
   blocked but the conciseness mark is lost.
4. **Given** a phase 1 score of 3/3, **When** the question is graded, **Then** the question moves
   straight to the discussion with no hint and no retry.

---

### User Story 2 - Get a targeted hint and retry once (Priority: P1)

When phase 1 scores under 3, the student sees only the target terms they missed or misused, each
with a one-line definition, and rewrites once more. The retry is marked on the same criteria but
capped at 2 marks.

**Why this priority**: The two-phase design is the unit's teaching mechanism — a targeted hint, then
one more chance, with an unaided answer always worth more than a hinted one.

**Independent Test**: Score under 3 in phase 1 and confirm the hint lists only the missed or misused
terms with their definitions, a second rewrite is accepted, and its mark is capped at 2.

**Acceptance Scenarios**:

1. **Given** a phase 1 score under 3, **When** the student moves on, **Then** they see only the
   target terms they missed or misused, each with a one-line definition, and can rewrite once more.
2. **Given** a phase 2 rewrite, **When** it is graded, **Then** it is marked on the same three
   criteria but capped at 2 marks, so a hinted answer never counts the same as an unaided one.
3. **Given** phase 2 is complete, **When** the student submits, **Then** there is no third try and
   the question moves to the discussion whatever phase 2 scored.

---

### User Story 3 - See the discussion (Priority: P1)

After the last phase, the student sees the model sentence (one or two accepted versions), each
target term with its definition and why it fits this sentence, their own phase 1 sentence (and
phase 2 sentence, if any), and the marker's feedback on their final sentence.

**Why this priority**: The discussion is where the learning lands — the student sees exactly what
precision looked like.

**Independent Test**: Complete a question and confirm the discussion shows the model sentence, each
target term with its definition and why it fits, the student's own sentences, and feedback, in the
same place and style as the short-answer model answer and feedback today.

**Acceptance Scenarios**:

1. **Given** a question has finished its last phase, **When** the discussion is shown, **Then** it
   shows the model sentence (one or two accepted versions), each target term with its definition and
   why it fits this sentence, the student's phase 1 sentence (and phase 2 sentence, if any), and the
   marker's feedback on their final sentence.
2. **Given** the discussion, **When** the student views it, **Then** it appears in the same place and
   style as the short-answer model answer and feedback today.

---

### User Story 4 - Never blocked by a failure (Priority: P1)

If the AI marker is unavailable or today's AI allowance is used up, the question degrades the way
short answers do today: the student sees the target terms, their definitions and the model sentence,
and marks their own answer, with no phase 2.

**Why this priority**: Constitution Principle VI — a flaky marker must never block practice or award
a wrong mark.

**Independent Test**: With the marker unavailable and with the daily allowance exhausted in turn,
answer a question and confirm each ends in self-marking with no error and no phase 2.

**Acceptance Scenarios**:

1. **Given** the AI marker is unavailable, **When** the student submits a phase 1 rewrite, **Then**
   they see the target terms, their definitions and the model sentence, and mark their own answer,
   with no phase 2.
2. **Given** today's AI allowance is used up, **When** the student submits a rewrite, **Then** the
   question degrades to self-marking exactly as short answers do today.

---

### User Story 5 - Resume an attempt mid-question (Priority: P2)

A student can leave an attempt and come back later, resuming in the middle of a question, including
at phase 2 with the hint showing.

**Why this priority**: Students practise on phones in short sessions; losing a half-finished question
wastes the work.

**Independent Test**: Reach phase 2 of a question, leave the attempt, return, and confirm the
question resumes at phase 2 with the hint showing and the phase 1 sentence intact.

**Acceptance Scenarios**:

1. **Given** an attempt with a question at phase 2, **When** the student returns to it, **Then** the
   question resumes at phase 2 with the hint showing.
2. **Given** a resumed attempt, **When** the student completes it, **Then** both sentences and both
   marks are saved with the attempt.

---

### User Story 6 - Missed terms feed "Concepts to review" (Priority: P2)

A term missed or misused in phase 1 counts as wrong for the unit's "Concepts to review" list, even
if it was used correctly in phase 2. Missed terms appear with their definitions, carry across
attempts, and clear after 3 correct uses. New attempts weight towards questions that use terms still
under review.

**Why this priority**: The review loop is what makes the precision stick beyond a single attempt.

**Independent Test**: Miss a term in phase 1 but use it correctly in phase 2, and confirm it still
appears in "Concepts to review"; then use it correctly in phase 1 across three later questions and
confirm it clears.

**Acceptance Scenarios**:

1. **Given** a term missed or misused in phase 1, **When** the question is graded, **Then** the term
   counts as wrong for concept tracking even if it was used correctly in phase 2.
2. **Given** a missed term, **When** the student views the unit, **Then** it appears in the unit's
   "Concepts to review" list with its definition, carries across attempts, and clears after 3
   correct uses, as concepts do now.
3. **Given** terms still under review, **When** the student starts a new attempt, **Then** the draw
   weights towards questions that use those terms, as for other units.

---

### Edge Cases

- The student submits a rewrite over 25 words: submission is not blocked; the conciseness mark is
  lost.
- The student scores 3/3 in phase 1: phase 2 is skipped entirely and the question goes straight to
  the discussion.
- The student scores under 3 in phase 1: the hint shows only the missed or misused terms, never the
  full answer key.
- The student reloads the page or resumes later: the target terms and definitions are never shown
  before a phase 1 grade, including on reload or resume.
- The student resumes at phase 2: the hint is still showing and the phase 1 sentence is intact.
- The question already has a saved result (another tab, a double tap): the submission is refused and
  the stored mark is shown, as for a short answer today.
- The AI marker is unavailable or the daily allowance is used up: the question degrades to
  self-marking with the target terms, definitions and model sentence shown, and no phase 2.
- A term is used correctly in phase 2 but was missed in phase 1: it still counts as wrong for
  concept tracking.
- The student writes a rewrite that keeps the meaning but uses no target terms: criterion (b) is
  lost but (a) and (c) can still be earned.
- The student uses every target term correctly but loses (a) or (c): phase 2 is offered with no
  terms in the hint, only the criterion lost and the marker's feedback (FR-045).
- Phase 2 scores lower than phase 1: the recorded mark is the phase 1 mark (FR-019).
- The student submits an empty or whitespace-only rewrite in phase 1 or phase 2: submission is
  blocked until they type a rewrite.
- The student skips phase 2 without rewriting: the recorded mark is the phase 1 mark, not 0.
- Hyphenated words and numbers count as one word each in the 25-word limit, and the live counter
  and the marker use the same rule.

## Requirements *(mandatory)*

### Functional Requirements

**Unit and content**

- **FR-001**: The app MUST offer a new unit type, "Writing Practice", alongside Topic Quiz,
  Milestone Test and Essay Practice.
- **FR-002**: The unit MUST have id `y12-economics-sentence-writing`, be Year 12, and match the
  topic of the existing Global Economy unit.
- **FR-003**: The unit page MUST show a short guide explaining the two phases and the 3-mark
  criteria.
- **FR-004**: The first question bank MUST cover HSC Topic 1 "The Global Economy" of the 2009
  syllabus only (the syllabus the 2027 HSC examines).
- **FR-005**: The bank MUST contain about 60 original questions written for this app, with no source
  line (constitution Principle V).
- **FR-006**: Each attempt MUST draw 5 questions at random, so a student gets about 12 attempts
  before questions repeat.
- **FR-007**: Every tracked term MUST appear in at least 4 questions of the bank, so a missed term
  can clear after 3 later correct uses.
- **FR-008**: Content validation MUST check that every question of this type has a model sentence
  and 1-3 target terms each with a definition, that every target term is a concept of the unit, and
  that every concept appears in at least 4 questions.
- **FR-009**: Photo answers MUST NOT be offered for this question type.

**Question flow**

- **FR-010**: Questions MUST be presented one at a time, like the existing short-answer flow.
- **FR-011**: Phase 1 MUST show the plain-English sentence and a text box with a live word counter
  (limit 25 words) for the student's rewrite.
- **FR-012**: Going over the 25-word limit MUST NOT block submission; it MUST lose the conciseness
  mark.
- **FR-013**: Phase 1 MUST be graded out of 3 marks: (a) the meaning and the cause and effect of the
  original are kept and correct; (b) every target term is used, and used correctly (all or nothing —
  one missing or misused term loses this mark); (c) the sentence is concise (within the word limit,
  no padding).
- **FR-014**: A 3/3 phase 1 answer MUST go straight to the discussion, with no hint and no retry.
- **FR-015**: Phase 2 MUST be offered only when phase 1 scores under 3, and MUST list only the
  target terms the student missed or misused, each with a one-line definition, for one more rewrite.
- **FR-016**: Phase 2 MUST be marked on the same three criteria but capped at 2 marks, so a hinted
  answer never counts the same as an unaided one.
- **FR-017**: There MUST be no third try; whatever phase 2 scores, the question MUST move to the
  discussion.
- **FR-018**: The discussion MUST show the model sentence (one or two accepted versions), each
  target term with its definition and why it fits this sentence, the student's phase 1 sentence (and
  phase 2 sentence, if any), and the marker's feedback on their final sentence, in the same place
  and style as the short-answer model answer and feedback today.
- **FR-019**: The question's recorded mark MUST be the higher of the phase 1 mark and the capped
  phase 2 mark (max 2), so a retry can never lower a student's mark. A 3/3 phase 1 records 3.
- **FR-020**: Both sentences and both marks MUST be saved with the attempt.
- **FR-021**: An attempt MUST be resumable in the middle of a question, including at phase 2 with
  the hint showing.

**Answer key and security**

- **FR-022**: Each question's key MUST be server-only (constitution Principle I) and hold: one or
  two model sentences; 1-3 target terms (usually 2), each with a one-line definition suitable for a
  student; and marking notes (accepted equivalents and common misuses).
- **FR-023**: No target term, definition, model sentence or marking note MAY reach the browser
  before phase 1 has been graded (or has fallen back to self-marking), including on page reload or
  resume. After a phase 1 grade below 3, only the missed or misused terms and their definitions are
  sent (the hint); the full set and the model sentence are sent only with the discussion or the
  self-mark screen.
- **FR-024**: Every idea in the model sentence MUST already be in the plain-English sentence; the
  model adds precision and terminology, never new facts.
- **FR-025**: Spelling and usage in model sentences MUST be exact (e.g. "affect", not "effect").

**Grading**

- **FR-026**: The AI marker MUST judge meaning, not exact word matches, under three rules: any
  grammatical form of a term counts ("specialise" for specialisation, "protected" for protection);
  an equivalent counts only if it is listed for that term (e.g. "import tax" or "customs duty" for
  tariff); everyday synonyms do not count unless listed ("poor country" is not "developing
  economy").
- **FR-027**: Listed misuses MUST never count (e.g. "cheaper" for comparative advantage, "quota" for
  tariff).
- **FR-028**: Besides the marks and feedback, the marker MUST return which target terms were missing
  and which were misused; that list MUST drive the phase 2 hint.
- **FR-029**: Each question MUST use at most 2 marking calls, so at most 10 per attempt, all counted
  against the existing daily AI allowance.
- **FR-030**: If the marker is unavailable, the question MUST degrade the way short answers do today
  (constitution Principle VI): the student sees the target terms, their definitions and the model
  sentence and marks their own answer, with no phase 2.

**Concepts to review**

- **FR-031**: Each target term MUST be a concept of the unit, with its one-line definition as the
  concept description.
- **FR-032**: A question MUST be tagged with several concepts, not one as today.
- **FR-033**: A term MUST count as correct for a question only when the student used it correctly in
  phase 1; a term missed or misused in phase 1 MUST count as wrong, even if it was used correctly in
  phase 2.
- **FR-034**: Missed terms MUST appear in the unit's "Concepts to review" list with their
  definitions, carry across attempts, and clear after 3 correct uses, as concepts do now.
- **FR-035**: New attempts MUST weight towards questions that use terms still under review, as for
  other units.

**Testing**

- **FR-036**: Automated tests MUST cover grading and hint selection with a stand-in marker:
  criterion (b) is all or nothing; a full-marks phase 1 skips phase 2; phase 2 is capped at 2; only
  missing or misused terms are shown in the hint.
- **FR-037**: Automated tests MUST cover that the terms and definitions never reach the browser
  before a phase 1 grade, including on resume.
- **FR-038**: Automated tests MUST cover that concept results are counted from phase 1 only.
- **FR-039**: Automated tests MUST cover the degrade path.
- **FR-040**: Automated tests MUST cover content validation of the new question type.

**Submission handling**

- **FR-041**: Empty or whitespace-only submissions MUST be blocked in both phases; the student MUST
  type a rewrite before submitting.
- **FR-042**: If the student skips phase 2 without submitting a rewrite, the recorded mark MUST be
  the phase 1 mark, not 0.
- **FR-043**: The 25-word limit MUST count whitespace-separated tokens, with hyphenated words and
  numbers counting as one word each; the live word counter and the marker MUST use the same rule.
- **FR-044**: The grading calls MUST log only minimal structured metrics: timestamp, hashed user id,
  question id, outcome, duration, and model used. No answer text, model sentence, target-term
  definitions or marking notes MAY be logged.

**Hint with no missed terms, and self-marking**

- **FR-045**: When phase 1 scores under 3 but every target term was used correctly (only criterion
  (a) or (c) was lost), phase 2 MUST still be offered. The hint then lists no terms; instead it
  names the criterion lost, in the marker's words (e.g. keep the cause and effect of the original;
  cut to 25 words or fewer). In every phase 2, the marker's phase 1 feedback is shown with the hint.
- **FR-046**: The self-mark screen (FR-030) MUST ask the student to mark each criterion, with one
  tick per target term for criterion (b), so that term results exist for concept tracking. As spec
  002 FR-005 requires, self-marked term results count the same as automatically marked ones.

### Key Entities

- **Writing question**: A plain-English sentence, one or two model sentences, 1-3 target terms
  (usually 2) each with a one-line definition, and marking notes (accepted equivalents and common
  misuses). Tagged with several concepts. The key is server-only.
- **Target term**: A concept of the unit; its one-line definition is the concept description. Has
  accepted equivalents and common misuses that the marker uses.
- **Attempt**: 5 questions drawn at random, weighted towards terms under review. Per-question phase
  state (phase 1 sentence and mark, phase 2 sentence and mark if any). Resumable mid-question.
- **Result**: Per question, the recorded mark (the higher of the phase 1 mark and the capped phase
  2 mark; if phase 2 is skipped, the phase 1 mark), both sentences, both marks, the marker's
  feedback, and a correct/wrong outcome per target term from phase 1.
- **Concept result**: Derived from phase 1 only. A term missed or misused in phase 1 counts as
  wrong; a term used correctly in phase 1 counts as correct; clears after 3 correct uses.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can complete a 5-question Writing Practice attempt in under 10 minutes on a
  phone.
- **SC-002**: 100% of 3/3 phase 1 answers go straight to the discussion with no hint shown.
- **SC-003**: 100% of phase 2 answers are capped at 2 marks.
- **SC-004**: The target terms and definitions never appear before a phase 1 grade, including on
  reload or resume (100% of tested cases).
- **SC-005**: Every tracked term appears in at least 4 questions of the bank (100% of terms, checked
  by content validation).
- **SC-006**: Every failure path (marker unavailable, daily allowance used up) ends in self-marking
  with no error shown (100% of tested cases).
- **SC-007**: A term missed in phase 1 counts as wrong for concept tracking even when used correctly
  in phase 2 (100% of tested cases).
- **SC-008**: A student can resume an attempt mid-question at phase 2 with the hint showing (100% of
  tested cases).
- **SC-009**: An empty submission is never recorded, and a skipped phase 2 keeps the phase 1 mark
  (100% of tested cases).
- **SC-010**: Grading calls log only minimal metrics (hashed user, question, outcome, duration,
  model) and never answer text or model sentences (100% of tested cases).

## Clarifications

### Session 2026-11-02

- Q: If a student submits an empty rewrite, or skips phase 2 without rewriting, what should the app
  do? → A: Block empty submissions in both phases; a skipped phase 2 keeps the phase 1 mark as the
  recorded mark.
- Q: How should the 25-word limit count words in the live word counter and in marking? → A: Count
  whitespace-separated tokens; hyphenated words and numbers count as one word each, and the counter
  and the marker use the same rule.
- Q: Should the new sentence-writing grading calls log minimal metrics, like photo answers do? → A:
  Yes — log the same minimal metrics (hashed user, question, outcome, duration, model), with no
  answer text or model sentences logged.

## Assumptions

- The constitution at version 2.11.0 applies as-is; this feature complies with it and needs no
  amendment.
- The existing short-answer flow, AI marker, daily AI allowance, self-mark flow, saved-results
  history and degraded mode are reused unchanged except where stated.
- The final tracked term list is settled in the plan. FR-007 (every term in at least 4 questions)
  governs: with about 60 questions at about 2.2 terms each, that allows roughly 30 terms. The
  findings' 34 (40 minus the 6 terms dropped or merged in `04-findings.md` §3) assumed 3 questions
  per term and is too many.
- Target terms per question are 2-3, with 1 allowed for a genuinely standalone term, per
  `04-findings.md` §2 (not the 2-4 in the original description).
- The hint definitions stay precise (e.g. "a tax on imported goods" for tariff). The near-leak
  rewrites in `04-findings.md` §5 are NOT adopted: the hint appears only after phase 1 falls short
  and phase 2 is capped at 2, so a precise definition is how the term is taught.
- The grading rules adopt `04-findings.md` §6-7 except the noun-only rule, which conflicts with
  FR-026 (any grammatical form of a term counts): everyday synonyms are not accepted equivalents
  unless listed; "cheaper"/"lower cost" is a misuse, not an equivalent, of comparative advantage.
- The authoring rule adopts `04-findings.md` §4: the plain sentence must encode the cause in
  everyday words that cannot be misread as a different cause (e.g. "gives up less of other things",
  not "gives up less").
- The 25-word limit stays unchanged, per `04-findings.md` §1.
- Writing the question bank itself is a separate content task done after the plan, and is out of
  scope for this feature.
- Photo answers are not offered for this question type.
- The unit's topic matches the existing Global Economy unit, so the unit page and navigation reuse
  that topic's placement.

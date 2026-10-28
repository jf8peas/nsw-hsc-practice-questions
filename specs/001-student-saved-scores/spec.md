# Feature Specification: Signed-In Students with Saved Scores

**Feature Branch**: `001-student-saved-scores`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Signed-in students with saved scores across devices. Today scores live only in the student's browser, so they're lost when a student switches device and the teacher can't see how anyone is going. Students should sign in once and see their full history from any device. Every answer should be stored so the teacher can analyse progress directly in the database. A teacher view in the app is a later feature."

## Clarifications

### Session 2026-10-26

- Q: Is the AI grading feedback stored with each result? → A: Yes. Store the feedback text and the rubric hits/misses per result so the attempt detail can show them. The constitution will be amended to allow the attempt id and feedback as stored fields.
- Q: What happens to a student who signs in but never answers anything? → A: Retention runs from the later of the student's last recorded answer and last sign-in (or account creation if neither exists). Delete 2 years after that date.
- Q: Does an unfinished attempt count towards a student's best score? → A: No. Every attempt appears in the history, but only completed attempts count towards best, latest and trend. Unfinished ones are labelled "incomplete".
- Q: What counts against the daily AI limit? → A: Only answers successfully graded by the AI grader. A failed or timed-out grading attempt, which falls back to self-marking, does not count.
- Q: Can a student resume an unfinished attempt? → A: Yes, on any device. Opening a unit offers to continue the latest incomplete attempt, with the same questions and the answers already given kept.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in to practise (Priority: P1)

A visitor opens the site and sees only a sign-in page. It explains what the site is and what data is kept (name, email and quiz results, deleted 2 years after last activity). They sign in with their Google account and land on the home page. From then on every page, including every quiz, works as it does today, but only while signed in. On every page they can see who they are signed in as and can sign out.

**Why this priority**: Everything else depends on knowing who the student is. Without it nothing can be saved or shown across devices.

**Independent Test**: Visit any page while signed out and confirm only the sign-in page is reachable. Sign in with a Google account, confirm landing on the home page with the student's identity and a sign-out control visible, then sign out and confirm access is removed again.

**Acceptance Scenarios**:

1. **Given** a visitor who is not signed in, **When** they open any page or quiz address, **Then** they see only the sign-in page, with a plain-language explanation of what data is kept and for how long.
2. **Given** the sign-in page, **When** the visitor signs in with any Google account, **Then** they land on the home page.
3. **Given** a signed-in student on any page, **When** they look at the page header, **Then** they can see which account they are signed in as and can sign out.
4. **Given** a student who has just signed out, **When** they press the browser's back button or open a saved quiz address, **Then** they are taken to the sign-in page.
5. **Given** a student with scores previously held in their browser, **When** they first sign in, **Then** they start with no history; the old browser scores are not carried over.

---

### User Story 2 - Every answer is saved to the student's account (Priority: P1)

Whenever a student's answer is graded, whether multiple choice or short answer, it is recorded against their account: the unit, the question, what they answered, marks awarded, maximum marks, how it was marked (automatically, by the AI grader, or self-marked), which quiz attempt it belongs to, and when. Saving happens in the background. The student sees their mark immediately and is never held up by saving.

**Why this priority**: This is the data the whole feature exists to collect. Student history and teacher analysis are both built on it.

**Independent Test**: Sign in, answer several MC and short-answer questions, then inspect the stored records and confirm one record per graded answer with all listed fields filled in correctly.

**Acceptance Scenarios**:

1. **Given** a signed-in student answering a multiple-choice question, **When** it is graded, **Then** one record is stored showing the answer given, marks, maximum marks, "marked automatically", the attempt and the time.
2. **Given** a short answer graded by the AI grader, **When** grading completes, **Then** one record is stored marked "AI graded".
3. **Given** a short answer the student self-marked, **When** they submit their self-mark, **Then** one record is stored marked "self-marked".
4. **Given** saving is slow or the storage service is unavailable, **When** the student submits an answer, **Then** they still see their mark immediately and can continue the quiz.
5. **Given** the database cannot be reached at all, **When** the student starts a quiz and answers a multiple-choice question, **Then** the quiz starts and the answer is marked and shown, and **When** they answer a short question, **Then** they are told AI marking is unavailable and asked to self-mark; the attempt and both results are saved, once each, when the database returns.
6. **Given** a save that failed, **When** time passes, **Then** the save is retried automatically; the student is told only if the result is finally lost.
7. **Given** a student who abandons a quiz part-way, **When** they later look at their history, **Then** the answers already graded in that attempt are present.

---

### User Story 3 - Student sees their own progress on any device (Priority: P1)

On a unit page the student sees their attempts at that unit (date, score, percentage) with their best and latest score. A "My progress" page lists every unit they have attempted with attempt count, latest percentage, best percentage and trend. They can open any attempt to see each question, their answer, the marks and the feedback they received. Signing in on a different device shows exactly the same history. A student can never see another student's results.

**Why this priority**: This is the direct student benefit and the reason to sign in: scores follow them from phone to laptop.

**Independent Test**: Complete an attempt on one device, sign in with the same account on a second device, and confirm the unit page, "My progress" and the attempt detail all show the same data. Sign in as a second student and confirm none of the first student's data is visible.

**Acceptance Scenarios**:

1. **Given** a student with past attempts at a unit, **When** they open that unit's page, **Then** they see each attempt's date, score and percentage, plus their best and latest score.
2. **Given** a student who has attempted several units, **When** they open "My progress", **Then** each attempted unit shows attempt count, latest percentage, best percentage and a trend.
3. **Given** "My progress", **When** the student opens an attempt, **Then** they see every question in it with their answer, marks awarded and the feedback they were given.
4. **Given** results recorded on device A, **When** the student signs in on device B, **Then** all of those results are visible and identical.
5. **Given** two different signed-in students, **When** either tries to open or request the other's results by any address or request, **Then** nothing of the other student's data is returned.
6. **Given** a student with an incomplete attempt, **When** they view the unit page or "My progress", **Then** the attempt appears labelled "incomplete" and does not affect best, latest or trend.
7. **Given** a student with an incomplete attempt at a unit, **When** they open that unit on any device, **Then** they are offered the choice to continue that attempt or start a new one.
8. **Given** a student who continues an incomplete attempt, **When** the quiz opens, **Then** it shows the same questions as before, skips those already answered, and any answers already graded stay saved against the same attempt.
9. **Given** a student with no attempts at a unit, **When** they open that unit's page, **Then** they see an empty-history message, not an error.

---

### User Story 4 - Fair use of AI grading (Priority: P2)

Each student has a daily limit on AI-graded short answers, 40 per day by default and configurable by the teacher, resetting at midnight Sydney time. Multiple-choice answers have no limit. Once a student reaches the limit, short answers switch to self-marking, with a clear message saying when AI grading returns. Practice is never blocked.

**Why this priority**: Anyone with a Google account can sign in, so AI grading cost needs a per-student ceiling. It is not needed for the first working slice, but must be in place before wide use.

**Independent Test**: Set the limit low, submit that many AI-graded short answers, then submit one more and confirm it switches to self-marking with a message stating when AI grading returns. Confirm MC answers still grade normally.

**Acceptance Scenarios**:

1. **Given** a student under their daily limit, **When** they submit a short answer and the AI grader grades it, **Then** it counts toward the limit.
2. **Given** a student under their daily limit, **When** AI grading fails or times out and they self-mark instead, **Then** it does not count toward the limit.
3. **Given** a student who has used their daily allowance, **When** they submit a short answer, **Then** they are asked to self-mark and see a message saying when AI grading returns.
4. **Given** a student over the limit, **When** they answer a multiple-choice question, **Then** it is graded instantly as normal.
5. **Given** a limit reached before midnight Sydney time, **When** the Sydney date rolls over, **Then** the student's allowance is available again.
6. **Given** the teacher changes the configured daily limit, **When** the change takes effect, **Then** new submissions are checked against the new limit.
7. **Given** a student who falls back to self-marking because of the limit, **When** they self-mark, **Then** the result is saved as "self-marked".

---

### User Story 5 - Teacher analysis from the backend (Priority: P2)

The teacher has no in-app view in this feature. Instead the stored data is easy to query directly in the database console, and a short documented set of ready-to-run queries is provided: units ranked by class average (lowest first), questions within a unit ranked by average mark, the most common wrong multiple-choice option per question, one student's history, each student's last-active date, and the number of AI-graded answers each student has used today. Each query can be limited by date range and can include or exclude self-marked answers.

**Why this priority**: This is the teacher's only window into how the class is going until a later in-app view is built.

**Independent Test**: With realistic stored data, run each documented query as written and confirm the output is correct, then use them to find the 3 weakest units and the 5 weakest questions in one unit.

**Acceptance Scenarios**:

1. **Given** stored results from several students, **When** the teacher runs the unit-ranking query, **Then** units appear lowest class average first.
2. **Given** a unit, **When** the teacher runs the question-ranking query, **Then** its questions appear lowest average mark first.
3. **Given** a multiple-choice question, **When** the teacher runs the wrong-option query, **Then** the most commonly chosen incorrect option is shown.
4. **Given** a student's email, **When** the teacher runs the student-history query, **Then** all of that student's results are listed in time order.
5. **Given** the student list, **When** the teacher runs the last-active query, **Then** each student's most recent answer date is shown.
6. **Given** today's activity, **When** the teacher runs the AI-usage query, **Then** each student's AI-graded answer count for today (Sydney date) is shown.
7. **Given** any ranking query, **When** the teacher sets a date range or chooses to exclude self-marked answers, **Then** only matching results are included.
8. **Given** stored results, **When** the teacher reads the unit and question identifiers, **Then** they are the same readable ids used in the content files.

---

### User Story 6 - Data deletion and retention (Priority: P3)

A student's account and all of their results are deleted automatically 2 years after the student's last activity (their latest answer or sign-in; for an account that has only ever been created, its creation date). The teacher can also delete one student's data immediately, by email, using a documented backend script or command. Once deleted, that student's data is gone from every query and from their own view. If the student signs in again, they start as a new student.

**Why this priority**: Students are minors and data must not outlive its use. It is required before production launch but does not affect the day-to-day practice experience.

**Independent Test**: Run the delete command for a test student and confirm they have no data in queries or in the app. Simulate a student whose last activity is over 2 years old and confirm automatic removal; simulate one just under 2 years and confirm they are kept.

**Acceptance Scenarios**:

1. **Given** a student whose last activity (latest answer or sign-in) is more than 2 years old, **When** the automatic clean-up runs, **Then** their account and all their results are removed.
2. **Given** a student whose last activity is within 2 years, **When** the clean-up runs, **Then** nothing of theirs is removed.
3. **Given** a student who signed in once but never answered a question, **When** 2 years pass since that sign-in, **Then** their account is removed by the clean-up.
4. **Given** the teacher runs the documented delete command with a student's email, **When** it completes, **Then** that student's account and results no longer appear in any teacher query or in the student's own view.
5. **Given** a student whose data was deleted, **When** they sign in again, **Then** they are treated as a new student with an empty history.
6. **Given** an email that matches no student, **When** the teacher runs the delete command, **Then** it reports that nothing was found and changes nothing.

---

### Edge Cases

- **Two devices at once**: the same student answering on two devices at the same time has every answer from both saved, with no duplicates and no overwrites.
- **Retired questions**: a question later removed from a unit keeps its past results, shown in the student's history labelled "retired", and kept in the database. If it was drawn for an incomplete attempt, resuming skips it and the attempt can still be completed.
- **Self-marked answers**: stored with a clear "self-marked" flag so the teacher can tell them apart from automatic and AI-graded results.
- **Session expires mid-quiz**: the student is asked to sign in again and the answer they just typed is not lost.
- **Sign-in or storage not configured in production**: the site refuses to serve any page rather than opening up without sign-in.
- **Storage outage during a quiz**: the student can keep practising and sees every mark; saves are retried. This includes the database being completely unreachable: a quiz can still be started, multiple-choice answers are still marked, short answers switch to self-marking with a notice (and never count against the daily AI limit), the history pages show "History is temporarily unavailable — your answers are still being marked and will be saved.", and everything is saved once the database returns. Accepted trade-offs during an outage: a deleted student's still-valid session can practise, but nothing is saved for them; duplicate answers are prevented when saving, not when marking; resuming an attempt and viewing history are unavailable.
- **Retry after a lost response**: a retried save for the same answer does not create a duplicate record.
- **Student with no history**: unit and "My progress" pages show a friendly empty state.
- **Time zones**: "today" and "midnight" for the daily AI limit always mean Sydney time, regardless of where the student is.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST require a signed-in Google account for every page and every request, except the sign-in page, the sign-in completion step and the scheduled retention endpoint (which is protected by the `CRON_SECRET` bearer token instead of a sign-in and returns no student data). Signed-out page requests redirect to the sign-in page; signed-out API requests receive 401.
- **FR-002**: The system MUST allow any Google account to sign in, with no restriction on email domain.
- **FR-003**: The sign-in page MUST explain what the site is and what data is kept (name, email, quiz results) and that it is deleted 2 years after last activity. It MUST also say that students' typed short answers are sent to a third-party AI service to be marked.
- **FR-004**: A signed-in student MUST be able to see which account they are signed in as, and sign out, from every page.
- **FR-005**: The system MUST NOT import or migrate scores previously held in a browser; every student starts with an empty history.
- **FR-006**: The system MUST store, for each graded answer (multiple choice and short answer): the student, unit, question, the student's answer, marks awarded, maximum marks, how it was marked (automatic, AI grader or self-marked), the quiz attempt it belongs to, and the time.
- **FR-007**: The system MUST store exactly one record per graded answer, and MUST NOT create a duplicate if the same answer is submitted for saving more than once.
- **FR-008**: The system MUST show the student their mark immediately; saving MUST NOT delay or block marking or moving on in the quiz. If the database cannot be reached at all, a quiz MUST still be startable, multiple-choice answers MUST still be marked and shown, short answers MUST switch to self-marking with a notice, the history pages MUST show a temporary-unavailable notice (never an error), and the attempt and results MUST be saved when the database returns.
- **FR-009**: The system MUST retry a failed save automatically, creating the attempt record first if it was never stored, saving each result exactly once, and MUST tell the student only if the result is finally lost. A result for a student who no longer exists is discarded without telling the student.
- **FR-010**: The system MUST keep answers already graded in an attempt that the student abandons part-way.
- **FR-011**: The system MUST store, with each AI-graded result, the written feedback and the rubric points hit and missed that the student received, so they can be shown again in the attempt detail. Model answers and rubric text MUST NOT be stored per result.
- **FR-012**: The unit page MUST show the signed-in student's attempts at that unit (date, score, percentage), with unfinished attempts labelled "incomplete", and their best and latest score calculated from completed attempts only.
- **FR-013**: A "My progress" page MUST list every unit the student has attempted with attempt count, latest percentage, best percentage and trend; best, latest and trend MUST use completed attempts only.
- **FR-014**: The student MUST be able to open any past attempt to see each question, their answer, marks awarded and feedback.
- **FR-015**: A student's history MUST be identical on every device they sign in on.
- **FR-016**: The system MUST return a student only their own results, for every page and request; no address, parameter or request from the client can select another student's data.
- **FR-017**: The system MUST limit each student to a configurable number of AI-graded short answers per day (default 40), counted per student per Sydney calendar day, where only answers successfully graded by the AI grader count (a failed or timed-out grading that falls back to self-marking does not), with the allowance resetting at midnight Sydney time.
- **FR-018**: Multiple-choice answers MUST NOT be subject to the daily AI limit.
- **FR-019**: When a student is over the daily limit, the system MUST switch short answers to self-marking and show a clear message saying when AI grading returns; practice MUST NOT be blocked.
- **FR-020**: Stored records MUST use the same readable unit and question identifiers as the content files, with one row per graded answer, so they can be queried directly.
- **FR-021**: The project MUST include a short documented set of ready-to-run queries covering: units ranked by class average (lowest first); questions within a unit ranked by average mark; most common wrong multiple-choice option per question; one student's history; each student's last-active date; AI-graded answers used per student today.
- **FR-022**: Each documented query MUST be filterable by date range, and MUST allow self-marked answers to be included or excluded.
- **FR-023**: Results for a question that has since been removed from a unit MUST be kept in storage and shown in the student's history labelled "retired".
- **FR-024**: Self-marked results MUST be flagged as self-marked in storage.
- **FR-025**: The system MUST delete a student's account and all their results automatically 2 years after the student's last activity, being the later of their latest answer and latest sign-in, or the account creation date if neither exists.
- **FR-026**: The project MUST include a documented script or command that lets the teacher delete one student's account and all results immediately, identified by email.
- **FR-027**: After deletion, the student's data MUST be absent from all queries and from the student's own view, and a later sign-in by that person MUST create a new, empty student.
- **FR-028**: If a student's session ends mid-quiz, the system MUST prompt them to sign in again without losing the answer they had just typed.
- **FR-029**: If sign-in or storage is not configured in production, the system MUST refuse to serve any page rather than allow access without sign-in.
- **FR-030**: The system MUST store only name, email, a Google account identifier and quiz results about a student; it MUST NOT store profile photos or other personal data.
- **FR-031**: The system MUST NOT expose correct answers, model answers or rubrics to the browser as part of saved or displayed history.
- **FR-032**: The system MUST remember which questions were drawn for each attempt, and when a student opens a unit that has an incomplete attempt, MUST offer to continue the latest one with the same questions, skipping those already answered, or to start a new attempt. Only the latest incomplete attempt per unit is offered. Starting a new attempt leaves the earlier one "incomplete".

### Key Entities *(include if feature involves data)*

- **Student**: a person who has signed in. Holds their Google account identifier, name, email, and creation date, last sign-in and last answer dates. Owns all their attempts and results. Deleting a student deletes everything below.
- **Quiz Attempt**: one run through a unit by one student. Has a unit, a start time and a score (marks earned out of marks available). Records which questions were drawn for it. May be incomplete if abandoned, and can be resumed on any device. Groups answer results.
- **Answer Result**: one graded answer within an attempt. Has the student, unit id, question id, the student's answer, marks awarded, maximum marks, marking method (automatic, AI-graded or self-marked), feedback shown with the rubric points hit and missed (AI-graded only), and time. One row per graded answer.
- **Daily AI Usage**: the count of AI-graded answers a student has used on a given Sydney calendar day, used to enforce the daily limit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student who signs in on a second device sees 100% of the results recorded on the first device.
- **SC-002**: In automated tests, no signed-in student can retrieve another student's results by any page address or request; zero cross-student leaks.
- **SC-003**: With saving enabled, a student sees an answer's mark as quickly as before this feature; saving adds no more than 150 milliseconds at the 95th percentile to the time taken to show a mark.
- **SC-004**: With saving unavailable, or with the database completely unreachable, a student can still start a quiz, 100% of multiple-choice answers still show their mark and 100% of short answers can still be self-marked, so the quiz can be completed; the history pages show a notice instead of an error; and every result is saved exactly once when the database returns.
- **SC-005**: Using the documented queries, the teacher can identify the 3 weakest units and the 5 weakest questions in a unit within 5 minutes.
- **SC-006**: AI-graded answers per student per Sydney day never exceed the configured daily limit.
- **SC-007**: A signed-out visitor can reach no page other than the sign-in page: 100% of other page addresses redirect to sign-in and 100% of signed-out API requests (other than the secret-protected retention endpoint) receive 401.
- **SC-008**: After the teacher's delete command for a student, that student appears in 0 results of the documented queries.
- **SC-009**: No student whose last activity (answer or sign-in) is under 2 years old is removed by clean-up, and every student whose last activity is over 2 years old is.
- **SC-010**: With sign-in or storage unconfigured in production, 100% of requests are refused.

## Assumptions

- Students are the only users of the app in this feature; the teacher works directly with the database console and repo scripts, and no in-app teacher or admin pages exist in this feature (spec 002 later adds one teacher page, for reviewing concept content only).
- Students mostly use phones, so the sign-in page, "My progress" and attempt detail must work well on a small screen.
- A "quiz attempt" is one run through a unit's drawn set of questions, started when the student begins the quiz. The attempt score is the total marks earned over total marks available for the answers graded in it. An attempt is "completed" once every question drawn for it has been answered; otherwise it is "incomplete". Incomplete attempts are shown in the history with the score so far, but are excluded from best, latest and trend.
- "Trend" on "My progress" compares the most recent attempts' percentages with the earlier ones (up, down or steady). The exact rule is a planning detail.
- Feedback shown in the attempt detail is the feedback given at grading time. Self-marked answers have no AI feedback; the detail shows what the student recorded.
- Retention is measured from the student's last activity (latest answer or sign-in, else account creation), and the automatic clean-up runs at least weekly, so a student's data can be kept up to about a week past the 2-year mark.
- A "retired" question is one whose id exists in stored results but no longer exists in the current content.
- The daily limit is configured by the teacher outside the app. Teacher-run queries and scripts need database access and are not exposed in the app.
- Students must be shown a clear data notice before or at sign-in. School approval / consent for holding minors' data is required before production launch but is outside this feature's scope.
- Constitution v2.3.0 Principle II (stored fields unchanged since v2.1.0) permits the stored fields this feature needs: the attempt id, the question ids drawn per attempt, the AI feedback with rubric hits/misses, and the per-student created, last sign-in and last answer timestamps. Retention runs from last activity as defined in FR-025.
- Out of scope for this feature: any in-app teacher/admin pages, student groups or classes, assigning quizzes, emailing reports, data export, parent access, and changes to quiz content or grading rubrics.

# Feature Specification: Photo Answers for Short-Answer Questions

**Feature Branch**: `004-photo-answers`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Photo Answers: let students answer any short-answer question by writing on paper and submitting 1-3 photos, which are read into text, shown back to the student to confirm, and then AI-marked by the existing grader against the same rubric. Typing maths working on a phone is slow, so students skip steps or whole questions, and the grader never sees the working that HSC marking rewards. The agreed technical decisions are in specs/004-photo-answers/design-notes.md; read it first and put its technical details (routes, tokens, image sizes, timeouts, models, env vars) into the plan, not the spec. Every short-answer question offers Type (today's box) or Photo. Photo mode takes 1-3 photos (rear camera on phones, file picker on laptops) shown as thumbnails with Retake and Remove, plus an optional typed note of up to 500 characters. 'Check my answer' reads the photos and shows a read-only read-back with maths shown as formulas and any drawn diagram described in words; the student either accepts ('Looks right, mark it') or retakes; the read-back cannot be edited. The accepted read-back (plus the note) is marked exactly like a typed answer, with the grader told to credit working and method shown and to ignore crossed-out work. Only the read-back text and note are stored, never the photos, which are discarded after reading and never logged. The reading step never sees the model answer or rubric. An unreadable photo, or one that is not an answer to the question (wrong question, blank page, selfie), prompts a retake and is never given 0 marks. A question may be read at most 3 times; after that the student types the answer or self-marks. Every failure (the model fails, today's AI allowance is used up, the database is down) falls back to self-marking exactly as today; if nothing was read, the stored answer is '[photo answer, not transcribed]' and the self-mark screen shows the photo thumbnails beside the model answer. Photos share the existing daily AI allowance (40 a day) with no separate photo allowance: a question uses one allowance from its first read through marking; the allowance is given back when the photo is unreadable or not an answer or the read fails, but not when a student reads and then leaves without marking. A question that already has a saved result is refused before any read. A reload after the read-back keeps the read-back so it is not read again; photos not yet read are lost on reload and the student is told so. Privacy: photos are sent to an AI provider that may use them for training; answer photos are treated as non-sensitive; the school consent says so and tells students to keep personal or sensitive information out of their photos. On-screen tip: 'Write clearly in dark pen, one question per photo, fill the frame.' Mobile-first: on a 390 px phone the Photo tab, camera button and submit are reachable without scrolling past the question. Out of scope: storing photos or teacher review of photos; taking the photo on a phone while quizzing on a laptop; multiple choice; any change to concept tracking or quiz weighting. Requires a constitution amendment to 2.11.0 (Principles I, II, V, VI, VII) before implementation. Tests: the daily allowance falls back to self-marking on the photo path; another student's attempt is rejected; oversized or non-image uploads are refused; no image data reaches the database or logs; the 3-read limit is enforced."

## Reference

The technical decisions agreed with the teacher (flow, limits, models, tokens, failure table and
the constitution amendment) are in `specs/004-photo-answers/design-notes.md`. This spec states the
requirements and on-screen wording; the plan takes the technical detail from `design-notes.md`.
Where the two disagree, this spec wins and `design-notes.md` is corrected.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Answer on paper and get it marked (Priority: P1)

A student working a calculation question writes their working on paper, switches the question to
Photo, takes a photo, checks what the app read, and gets marks, feedback and the model answer
exactly as for a typed answer.

**Why this priority**: This is the whole point of the feature: students can show maths working
without typing it on a phone, and the grader sees the working.

**Independent Test**: On a phone, open a quiz with a short-answer calculation, answer it on paper,
submit one photo, accept the read-back, and confirm a mark with feedback, rubric points hit and
missed, and the model answer appear and are saved to the student's history.

**Acceptance Scenarios**:

1. **Given** any short-answer question, **When** the student views it, **Then** they can choose
   between "Type" and "Photo"; Type behaves exactly as today.
2. **Given** Photo is chosen on a phone, **When** the student taps "Take photo", **Then** the rear
   camera opens; on a laptop the same button opens a file picker.
3. **Given** a photo has been taken, **When** it is added, **Then** it appears as a thumbnail with
   "Retake" and "Remove", and the student may add a second and third photo.
4. **Given** 1-3 photos, **When** the student taps "Check my answer", **Then** a progress state is
   shown and then the read-back appears: the working in reading order, maths shown as formulas,
   crossed-out work marked as crossed out, and any drawn diagram described in words.
5. **Given** the read-back is shown, **When** the student taps "Looks right, mark it", **Then** the
   answer is marked against the question's rubric, one mark per point, with credit for correct
   working and method, and the result screen shows marks, feedback, rubric points hit and missed
   and the model answer, with the photo thumbnails still on screen.
6. **Given** the result, **When** the student later opens that attempt from their history,
   **Then** the read-back text (and note) appears as their answer, like a typed answer.

---

### User Story 2 - Catch a misread before it costs marks (Priority: P1)

The read-back is read-only. If the app misread the writing, or could not read it, the student
retakes the photo rather than being marked on the wrong text.

**Why this priority**: Without it, a misread silently costs marks and students lose trust in the
marking (Principle VI: fair and explainable).

**Independent Test**: Submit a deliberately blurry photo and a photo of the wrong question;
confirm both prompt a retake with no mark. Submit a clear photo, tap "Retake" on the read-back,
and confirm nothing is marked until a read-back is accepted.

**Acceptance Scenarios**:

1. **Given** the read-back is shown, **When** the student looks at it, **Then** it cannot be
   edited; the only choices are "Looks right, mark it" and "Retake".
2. **Given** a photo too unclear to read, **When** it is checked, **Then** the student sees "We
   couldn't read this clearly" and is asked to retake; no mark is given and no AI allowance is used.
3. **Given** a photo of the wrong question, a blank page or something that is not an answer,
   **When** it is checked, **Then** the student is asked to retake; no mark and no allowance used.
4. **Given** a question has already been read 3 times, **When** the student tries a 4th read,
   **Then** they are told they have used their photo reads for this question and can type the
   answer or mark it themselves.

---

### User Story 3 - Add a short typed note (Priority: P2)

In Photo mode a small typed box lets the student add a note such as "see the diagram on photo 2",
which is marked together with the read-back.

**Why this priority**: Useful for multi-photo answers but not needed for a working photo path.

**Independent Test**: Submit two photos with a note, accept, and confirm the stored answer is the
read-back followed by the note and that the note is limited to 500 characters.

**Acceptance Scenarios**:

1. **Given** Photo mode, **When** the student types a note, **Then** it is limited to 500
   characters and is optional.
2. **Given** a note and an accepted read-back, **When** the answer is marked and saved, **Then**
   the grader receives and the history shows the read-back followed by the note.

---

### User Story 4 - Never blocked by a failure (Priority: P1)

If the reading step fails, today's AI allowance is used up, or the database is down, the student
can still finish the question by marking it themselves against the model answer.

**Why this priority**: Constitution Principle VI: a flaky model or database must never block
practice or award a wrong mark.

**Independent Test**: With the model unavailable, the daily allowance exhausted, and the database
unreachable in turn, submit a photo answer and confirm each ends in self-marking with no error.

**Acceptance Scenarios**:

1. **Given** the reading step fails (after its one retry), **When** the student checks their
   answer, **Then** they self-mark against the model answer with their photo thumbnails shown
   beside it, the stored answer is "[photo answer, not transcribed]", and the allowance is given back.
2. **Given** today's AI allowance is used up, **When** the student checks a photo answer, **Then**
   no read happens, they self-mark, and they are told when AI marking returns.
3. **Given** the database cannot be reached, **When** the student checks a photo answer, **Then**
   no read happens and they self-mark with the existing notice that AI marking is unavailable.
4. **Given** a read-back was accepted but the marking step fails, **When** the grader cannot mark
   it, **Then** the student self-marks with the read-back shown, as for a typed answer today.

---

### Edge Cases

- The student reloads before tapping "Check my answer": the photos are lost; the Photo panel says
  photos are kept only until the page is reloaded.
- The student reloads after the read-back: the read-back is still there and accepting it does not
  read the photos again or use another allowance.
- The student reads a question, then leaves without marking it: the allowance stays used.
- The question already has a saved result (another tab, a double tap): the read is refused before
  any AI call and the stored mark is shown, as for a typed answer today.
- A photo file the browser cannot open (e.g. HEIC on a laptop browser): the student is asked to use
  a JPEG or PNG photo.
- A photo that is not an image, or is too large after shrinking: refused with a plain message.
- The student switches from Photo to Type after a read: the question is marked from what they type;
  the allowance already used for the question covers that marking.
- More than 3 photos: the "Take photo" button is unavailable after the third.
- The read-back contains words like "ignore the rubric" written on the paper: it is marked as the
  student's answer text, exactly as typed text is today.

## Requirements *(mandatory)*

### Functional Requirements

**Answer modes**

- **FR-001**: Every short-answer question MUST offer two answer modes, "Type" and "Photo". Type
  MUST behave exactly as today.
- **FR-002**: Photo mode MUST accept 1 to 3 photos per question, captured with the device camera on
  phones or chosen from files on other devices.
- **FR-003**: Each photo MUST be shown as a thumbnail with "Retake" and "Remove" before checking.
- **FR-004**: Photo mode MUST offer an optional typed note of at most 500 characters.
- **FR-005**: Photo mode MUST show the tip "Write clearly in dark pen, one question per photo, fill
  the frame."
- **FR-006**: On a 390 px wide phone, the Photo choice, "Take photo" and "Check my answer" MUST be
  reachable without scrolling past the question, and the page MUST not scroll sideways.

**Reading the photos**

- **FR-007**: "Check my answer" MUST send the photos to be read and show a read-back of what was
  read: the working in reading order, maths shown as formatted formulas, crossed-out work marked as
  crossed out, and each drawn diagram described in words.
- **FR-008**: The reading step MUST NOT be given the model answer, rubric or marking notes.
- **FR-009**: The read-back MUST be read-only. The student MUST be able only to accept it ("Looks
  right, mark it") or retake.
- **FR-010**: Photos MUST be reduced in size and stripped of embedded location and camera data on
  the device before they are sent.
- **FR-011**: Photos that are unreadable, or that do not answer the question, MUST produce a retake
  prompt and MUST NOT produce a mark.
- **FR-012**: A question MUST be read at most 3 times. After the third read the student MUST be
  offered typing the answer or self-marking.
- **FR-013**: A read MUST be refused, before any AI call, for a question that already has a saved
  result in that attempt.
- **FR-014**: A read MUST be accepted only from the signed-in student who owns the attempt, for a
  short-answer question in that attempt; uploads that are not images or exceed the size limit MUST
  be refused.

**Marking**

- **FR-015**: An accepted read-back, followed by the note if any, MUST be marked by the existing
  short-answer grader against the same rubric (one mark per point, partial credit), with the grader
  told the answer was handwritten and transcribed, to credit correct working and method shown, and
  to ignore crossed-out work.
- **FR-016**: The marking step MUST accept a photo answer only if its text is exactly the read-back
  the server produced for that student, attempt and question (plus the note).
- **FR-017**: The result MUST show marks, feedback, rubric points hit and missed and the model
  answer as today, with the photo thumbnails still visible on screen.

**Fallbacks and allowance**

- **FR-018**: Any failure of the reading step (after one retry), an exhausted daily AI allowance, or
  an unreachable database MUST fall back to self-marking, never an error or a wrong mark.
- **FR-019**: When self-marking a photo answer with no read-back, the stored answer MUST be
  "[photo answer, not transcribed]" and the self-mark screen MUST show the photo thumbnails beside
  the model answer.
- **FR-020**: Photo reads MUST count against the existing per-student daily AI allowance, with no
  separate photo allowance. One question MUST use at most one allowance from its first read through
  marking, including retakes.
- **FR-021**: The allowance MUST be given back when a photo is unreadable, does not answer the
  question, or the reading step fails. It MUST NOT be given back when the student reads and then
  leaves without marking.
- **FR-022**: Photo reads MUST be subject to the same per-student and per-network rate limits as
  short-answer marking.

**Data and privacy**

- **FR-023**: Photos MUST NOT be stored anywhere (database, files, logs) after the read; only the
  read-back text and note are stored, as the answer submitted.
- **FR-024**: After a read, the read-back MUST survive a page reload in the same tab so it is not
  read again. Photos not yet read MAY be lost on reload, and the Photo panel MUST say so.
- **FR-025**: The school consent wording MUST state that answer photos are sent to an AI provider
  that may use them for training, and that photos must not contain personal or sensitive information.

**Observability**

- **FR-026**: The transcribe route MUST log only minimal structured metrics: timestamp, hashed userId,
  questionId, outcome (success/legible-fail/answersQuestion-fail/network-fail), duration_ms, and model
  used. No image data and no transcription text MAY be logged.

### Key Entities

- **Photo answer (transient)**: 1-3 images and an optional note for one question in one attempt.
  Exists only on the student's device and during the read; never stored.
- **Read-back**: The text produced from the photos for one question in one attempt, with maths and
  diagram descriptions. Tied to the student, attempt and question; counts its reads (max 3).
- **Result**: Unchanged. For a photo answer, "answer submitted" holds the accepted read-back plus
  note, or "[photo answer, not transcribed]" when self-marked without a read-back.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can go from tapping "Take photo" to seeing their mark in under 30 seconds
  for 90% of photo answers (excluding time spent writing on paper).
- **SC-002**: In a spot-check of at least 20 photo answers against the teacher's own marking after
  launch, the awarded mark matches on at least 90% of answers.
- **SC-003**: Every photo answer that is marked was first shown to the student as a read-back and
  accepted (100%).
- **SC-004**: No photo answer is ever given marks from an unreadable or non-answer photo; each
  produces a retake prompt (100%).
- **SC-005**: Zero photos are retained after reading: none in the database, files or logs.
- **SC-006**: Every failure path (reading fails, allowance used up, database down) ends in
  self-marking with no error shown (100% of tested cases).

## Clarifications

### Session 2026-10-29

- Q: What observability/metrics should be collected for photo reads (e.g., success/failure counts, model used, timing), given that photos themselves must never be logged? → A: Minimal structured metrics only: Log timestamp, userId (hashed), questionId, outcome (success/legible-fail/answersQuestion-fail/network-fail), duration_ms, model used. No image data, no transcription text.

## Assumptions

- The constitution is amended to 2.11.0 (Principles I, II, V, VI, VII, as listed in
  `design-notes.md`) before implementation starts; this spec is written to that amendment.
- The existing grader, daily allowance (40 a day), rate limits, self-mark flow, saved-results
  history and degraded mode are reused unchanged except where stated.
- The reading model is chosen by the teacher and configured on the server; it can be changed
  without a code change if it misreads handwriting.
- Students mostly use phones; iPhone browsers supply camera photos in a format the page can read.
- Answer photos are non-sensitive by policy (school consent); no provider restriction is applied.
- No new per-student data is stored; the read-back is stored in the existing "answer submitted".

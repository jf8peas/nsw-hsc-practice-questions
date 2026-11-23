<!--
Sync Impact Report
- Version change: 2.17.0 → 2.18.0 (MINOR: guidance in Principles I, II, V, VI and VII and the Quality Gates extended to the English essay-writing unit, spec 011).
- Reason (amendment log): the English essay unit has a student make a light plan for an 800–1,200 word essay on Michael Gow's Away, optionally get unmarked plan feedback, and receive one AI mark out of 20 with deterministic question-focus, knowledge-error and quotation checks. It reuses the essay attempt lifecycle but stores four criterion verdicts, question focus, knowledge errors, quote-check results, raw and final marks, marker-selected and final bands, and concepts used well. Marking notes, Away notes, pilot essays and the play text never reach the browser; the model essay is released only with the student's own finished result. The full play is loaded from a gitignored local copy into a server-only database table, never committed to the public repository. Only a near-miss correction excerpt and quotations in a released model essay may include play words in a browser response. Two new model settings serve the English marker and reviewer, with no fallback between them or to another unit. A missing reference text refuses marking rather than silently skipping verification.
- Modified principles: I (English routes and release schedule, including the two permitted play-excerpt exceptions); II (English attempt fields and shared reference-text state); V (the deployable server-only copy of the prescribed play); VI (never self-marked, failure preserves text, review failure offers "Start writing", missing reference text refuses marking); VII (`ENGLISH_ESSAY_GRADING_MODEL` and `ENGLISH_ESSAY_REVIEW_MODEL`, each independent of every other model setting); Quality Gates (English marker and model-essay quote gates, leakage and failure tests).
- Templates requiring updates: none (the plan, spec and tasks templates name no unit).

Previous report (2.17.0):
- Version change: 2.16.0 -> 2.17.0 (MINOR: guidance in Principles I, II, VI and VII and the Quality Gates extended to the Economics essay-writing unit, spec 010).
- Reason (amendment log): the essay unit (spec 010) has a student plan a whole extended response, optionally get feedback on the plan, write 600-800 words and be marked out of 20 in the school's AT1 bands. Like the English units it is one question per attempt, one try, never self-marked, and needs the database. It stores the student's own plan, review and essay. The marking notes, the school's criteria and the band 1 model essay are server-only key material; the model essay is released only with the student's own finished result. Two new model settings serve the marker and the plan review. A gap is cleared only by later essays, not by a redo of the essay that raised it. A marker check on labelled essays gates each unit that is marked by a pilot-tested prompt. The scaffold and essay routes are answer-submission routes.
- Modified principles: I (essay unit release schedule and request fields); II (essay phase row; the derived concept rule's "different essay" clause); VI (the essay unit never self-marked; the plan review's failure); VII (ESSAY_GRADING_MODEL, ESSAY_REVIEW_MODEL); Quality Gates (leakage, testing and the marker check).
- Templates requiring updates: none (plan, spec and tasks templates name no unit).

Previous report (2.16.0):
- Version change: 2.15.1 → 2.16.0 (MINOR: guidance in Principles I, II, V, VI and VII and the Quality Gates extended to a second Advanced English unit, the comparative short-answer unit, and one new student-chosen field, the pick of texts).
- Reason (amendment log): the comparative unit (spec 009) is spec 008 with two texts per question. It reuses 008's stimulus texts and cropped images, marker pipeline, no-self-marking rule and model setting, so the wording that named "the unseen-text unit" now names both units. A choice question lets the student choose which allowed texts to write about; the choice is a list of text ids from the question's own public allowed set, re-checked by the server, stored with the attempt so the marker can be revised from real use. Nine skill verdicts replace seven in this unit. A unit's concept list may name concept ids defined by another unit it shares progress with (spec 009 FR-022). Nothing new is released earlier than in 008: the key is still server-only and the model answer is released at the discussion only.
- Modified principles: I (the comparative unit's release schedule; the pick on the pick-save route, an answer-submission route, and on the grade route; the image route's id checked against the shared text store); II (the comparative phase row, nine verdicts and the pick); V (the cropped-image exception covers the shared store); VI (both units never self-marked; both need the database); VII (the model setting also serves the comparative unit); Quality Gates (leakage and testing bullets).
- Templates requiring updates: none (plan, spec and tasks templates name no unit).

Previous report (2.15.1):
- Version change: 2.15.0 → 2.15.1 (PATCH: two clarifications of the unseen-text unit's Principle I and II wording; no new class of behaviour).
- Amendment log (2.15.1, second line): the unseen-text unit has no student flag. The "This mark seems wrong" button, its route (`POST /api/unseen/flag`) and the stored flag (`unseen_phases.flagged_at`) are removed, so the 2.15.0 amendments no longer list them: Principle I's submission-routes bullet names only the unit's retry-decline route, and Principle II's stored unseen fields no longer include a flag. The marker is revised from an offline re-mark of real first tries in every mark band instead. The paragraph unit's flag route and stored flag (spec 007) are unchanged.
- Reason (amendment log): the unseen-text marker (spec 008, prompt unseen-pilot-5) adds one advice sentence, "Make it even stronger" (field `goFurther`), to a full-mark first try. It is stored in the unseen phase row with the try, shown only for a full-mark first try, and never changes a mark. Principle II lists the stored fields, so it is added there.
- Modified principles: I. The Answer Key Never Reaches the Browser (the unseen unit's flag route removed from the submission-routes bullet); II. Signed-In Students, Minimal Personal Data (the unseen phase row also holds the to-go-further sentence, and holds no flag).

Previous report (2.15.0):
- Version change: 2.14.0 → 2.15.0 (MINOR: materially expanded guidance in Principles I, II, V, VI and VII to allow the Advanced English unseen-text unit's cropped visual stimulus images and stimulus texts, its key schedule, its stored attempt, its no-self-marking behaviour and its own marking model).
- Reason (amendment log): the unseen-text unit (spec 008) shows one unseen text (a poem, prose, or a visual cropped from a school paper) with one question, marks the answer with an LLM against the school's band descriptors and seven skills, and offers one capped retry. A visual stimulus cannot be redrawn in code without changing the text the student analyses, so a cropped school-paper image is allowed under the school-paper exception, served only to signed-in students. Self-marking an interpretive English answer is not a fair mark, so the unit never self-marks: a marker failure returns the editable box with the text, and the daily limit holds the question at its step until the next Sydney day. The unit's draw and resume need the database, so it cannot start without it. Marking criteria, notes, the model answer and a visual's written description are server-only key material; the model answer is released at the discussion only. Each try's verdicts, reasons, feedback, biggest gap, and prompt version are stored so the marker can be revised from an offline re-mark of real use. The unit marks with its own model, which the pilot showed is needed for school full-mark answers.
- Modified principles:
  - I. The Answer Key Never Reaches the Browser: unseen-text release schedule; the decline route's fields; the image route's text id.
  - II. Signed-In Students, Minimal Personal Data: unseen phase row (both tries' texts, marks, seven verdicts and reasons, feedback, biggest gap, to-go-further sentence for a full-mark first try, prompt version and model, ending, recorded mark); per-skill results may be copied without identity into local test files.
  - V. Syllabus Fidelity and Original Content: a cropped visual stimulus from a school paper is allowed under the school-paper exception, behind sign-in, never from a real HSC paper, removed or replaced before the app goes commercial; the exception covers stimulus texts and school guidelines.
  - VI. Grading Is Fair, Explainable and Degrades Gracefully: the unseen-text unit is never self-marked on either try; wait, then return the box; the daily limit holds the question; it needs the database.
  - VII. Cost and Abuse Controls on Paid Paths: `ENGLISH_ADV_GRADING_MODEL` is server-only; one slot per marked try, refunded on failure; `REMARK_MODEL` also serves the unseen-text re-mark.
- Added sections: none
- Removed sections: none
- Quality Gates: constitution check gains unseen-text key leakage and image-route access; testing bullets gain the unseen unit's marker-failure and daily-limit behaviour.
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no change needed
  - .specify/templates/spec-template.md ✅ no change needed
  - .specify/templates/tasks-template.md ✅ no change needed
  - specs/008-english-unseen-short-answers/* ✅ created with the amendment in mind
- Follow-up TODOs: the school consent wording gains the word "per-skill" (README, task T072).
- Version change: 2.13.0 → 2.14.0 (MINOR: materially expanded guidance in Principles I, II, VI and VII to allow the paragraph-writing unit's staged release of its essay key, its stored per-criterion verdicts and flag, its sequential draw and capped-correction ending, and the offline re-mark model).
- Reason (amendment log): the paragraph-writing unit (spec 007) teaches a Band 6 body paragraph one part at a time. Before phase 1 is marked the student needs the brief, the guidance lines and the model text of the EARLIER parts of the essay; after phase 1 the per-criterion verdicts; at the discussion the current model part. Later parts' model text and the marking notes must never reach the browser. Each marked phase's verdicts, the marker's one-line reasons, the prompt version and a once-only flag must be stored so the marker can be revised from real use. Part tips clear after 2 correct first tries. The unit's draw is the next part of one essay, so it cannot start without reading results; and a correction that cannot be marked keeps the first-try mark instead of self-marking.
- Modified principles:
  - I. The Answer Key Never Reaches the Browser: paragraph-unit release schedule; the request fields now also list the phase number, per-criterion tick flags and the paragraph flag route's fields.
  - II. Signed-In Students, Minimal Personal Data: paragraph phase row (texts, marks, per-criterion verdicts and reasons, prompt version, model, ending, recorded mark, flag); answer text may be copied without identity into local test files and re-marked by the same provider; the derived concept-count rule gains a clear-after number (3, or 2 for part tips).
  - VI. Grading Is Fair, Explainable and Degrades Gracefully: a sequential unit does not start when the database cannot be read; a phase 2 failure or cap ends the question with the first-try mark.
  - VII. Cost and Abuse Controls on Paid Paths: `REMARK_MODEL` is server-only, read by scripts only, and offline re-marks do not count against `LLM_DAILY_CAP`.
- Added sections: none
- Removed sections: none
- Quality Gates: constitution check gains paragraph-unit key leakage; testing bullets gain the capped-correction ending, the clear-after counts and the concept rule wording.
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no change needed
  - .specify/templates/spec-template.md ✅ no change needed
  - .specify/templates/tasks-template.md ✅ no change needed
  - specs/007-economics-paragraph-writing/* ✅ created with the amendment in mind
- Follow-up TODOs: school consent wording gains one sentence about re-marking (tasks T071).
- Version change: 2.12.0 → 2.13.0 (MINOR: materially expanded guidance in Principle II to allow the sentence-writing unit's display-only grading data and per-phase drafts to be stored with the attempt).
- Reason (amendment log): the sentence-rewrite redesign (spec 006) shows the student the credited terms highlighted in their own sentence, the phase 2 term outcomes as status pills and an optional language note, and restores what the student had typed on resume from another device; the 2026-11-03 clarification requires the display-only grading data (credited spans for each phase, phase 2 term outcomes, language note) and the student's in-progress draft text for each phase to be saved with the attempt so a resumed or reloaded question shows the full result and restores the typed text. The data stays display only and never changes marks or concept tracking, which always come from the phase 1 outcomes.
- Modified principles:
  - II. Signed-In Students, Minimal Personal Data: per writing-practice question in an attempt, the phase row may also hold the display-only grading data (credited spans for each phase, the phase 2 term outcomes and any language note), and a draft row may hold the student's in-progress draft text for each phase; both are deleted with the student like results.
- Added sections: none
- Removed sections: none
- Quality Gates: unchanged.
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no change needed
  - .specify/templates/spec-template.md ✅ no change needed
  - .specify/templates/tasks-template.md ✅ no change needed
  - specs/006-sentence-rewrite-redesign/{spec,plan,research,data-model,contracts,quickstart,tasks} ✅ created with the amendment in mind
  - specs/005-economics-sentence-writing/* ✅ unaffected
- Follow-up TODOs: none.
- Version change: 2.11.0 → 2.12.0 (MINOR: materially expanded guidance in Principles I and II to allow the sentence-writing unit's scoped hint/discussion release and its phase row).
- Reason (amendment log): the sentence-writing unit (spec 005) teaches students to rewrite plain-English sentences in economics language. After phase 1 is graded below 3 marks the student needs the missed terms' definitions (the hint) to retry, and at the discussion they need the model sentence and every term's definition; the phase 1 and phase 2 sentences, marks, per-term outcomes and feedback must be stored so an attempt can be resumed on another device and the attempt detail page can show both sentences and both marks.
- Modified principles:
  - I. The Answer Key Never Reaches the Browser: the sentence-writing unit may send the missed/misused target terms with their one-line definitions after phase 1 is graded below 3 (the hint), and the model sentences and full target-term set with definitions at the discussion or self-mark screen; never before, including on reload or resume.
  - II. Signed-In Students, Minimal Personal Data: per writing-practice question in an attempt, the phase 1 and phase 2 sentences, their marks, the per-term outcomes and the feedback shown are stored in a phase row, deleted with the student like results.
- Added sections: none
- Removed sections: none
- Quality Gates: unchanged.
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no change needed
  - .specify/templates/spec-template.md ✅ no change needed
  - .specify/templates/tasks-template.md ✅ no change needed
  - specs/005-economics-sentence-writing/{spec,plan,research,data-model,contracts,quickstart,tasks} ✅ created with the amendment in mind
- Follow-up TODOs: none.
- Version change: 2.10.0 → 2.11.0 (MINOR: materially expanded guidance in Principles I, II, V, VI, VII, VIII to allow photo answers).
- Reason (amendment log): students need to answer short-answer questions by writing on paper and submitting 1-3 photos, which are transcribed to text and then AI-marked. Typing maths working on a phone is slow, so students skip steps or whole questions, and the grader never sees the working that HSC marking rewards.
- Modified principles:
  - I. The Answer Key Never Reaches the Browser: transcribe route may accept 1-3 images and an optional note; `/api/grade` may accept the signed transcription token. Vision prompt gets no model answer or rubric.
  - II. Signed-In Students, Minimal Personal Data: photos are never stored or logged; only the transcription (the "answer submitted"). Consent wording: answer photos are sent to an AI provider that may use them for training; students must keep personal or sensitive information out of photos. FR-026 metrics (hashed userId, questionId, outcome, duration_ms, model) are allowed in logs.
  - V. Syllabus Fidelity and Original Content: "No photographed images" covers question content, not student answers.
  - VI. Grading Is Fair, Explainable and Degrades Gracefully: illegible / not-an-answer → retake, never 0; refund rules for AI slot; 3-read limit per question.
  - VII. Cost and Abuse Controls on Paid Paths: `VISION_MODEL` is server-only like `OPENROUTER_API_KEY`; photo reads count against `LLM_DAILY_CAP` (one slot per question, no separate cap).
  - VIII. Simplicity: no new dependency: native file input, canvas, `FormData`, existing fetch wrapper.
- Added sections: none
- Removed sections: none
- Quality Gates: updated to include photo answer checks (no image data in database or logs, 3-read limit enforced, refund rules).
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated (Principle VIII row already present)
  - .specify/templates/spec-template.md ✅ no change needed
  - .specify/templates/tasks-template.md ✅ no change needed
  - specs/001-student-saved-scores/{spec,plan,research,data-model,contracts,quickstart,tasks} ✅ unaffected
  - specs/002-learn-from-mistakes/{spec,plan,tasks}.md ✅ unaffected
  - README.md ⚠ pending: document `VISION_MODEL` env var (add when feature is implemented)
  - .env.example ⚠ pending: add `VISION_MODEL=deepseek/deepseek-v4.1-flash` (add when feature is implemented)
- Follow-up TODOs: TODO(ACCESSIBILITY_TARGET); TODO(VISION_MODEL_ENV): add to `.env.example` and README during implementation.
Legend: rules marked [PRACTICE] describe what the repo already does today. Rules marked
[DECISION] are team decisions that are not yet current practice.
-->

# NSW HSC Practice Constitution

NSW HSC Practice is a Next.js 15 (App Router, React 19, TypeScript) app on Vercel that gives
NSW HSC students practice quizzes (multiple choice and short answer). Short answers are graded by
an LLM against a rubric. This constitution records how the project works, the direction it has
decided to take, and the rules that every feature, spec and plan MUST respect.

## Core Principles

### I. The Answer Key Never Reaches the Browser [PRACTICE]

- All grading MUST happen server-side, in `app/api/grade` and `lib/*.server.ts`.
- `content/answers/index.ts` MUST keep `import "server-only"`, and only
  `lib/grading.server.ts` MAY import it.
- Public files (`meta.ts`, `questions.ts`, `content/index.ts`) MUST NOT contain correct answers,
  model answers, rubrics or marking notes.
- On answer-submission routes (grading, self-mark and save retry), the client MAY send only:
  `questionId`, `answer`, a `phase` number (1 or 2), an opaque `attemptId` together with the
  server-issued signed attempt token; for a self-mark, a binary `correct` flag or per-criterion
  tick flags together with the server-issued signed self-mark token; for the paragraph unit's
  flag route, `attemptId`, `questionId` and the signed attempt token; for the unseen-text unit's
  retry-decline route, `attemptId`, `questionId` and the signed attempt token; for the English essay unit's attempt-start route, a `questionId` (an essay id the server checks is live and not already open); for its scaffold route, `attemptId`, `questionId`, the signed attempt token, an `action` (`save` or `start`) and the English scaffold's text fields; for its review route and discard route, `attemptId`, `questionId` and the signed attempt token (the review also the English scaffold's text fields); for its grade route, `attemptId`, `questionId`, the signed attempt token and the essay text (no `phase`); the existing draft route MAY accept the English essay's own draft at phase 1; for the comparative unit's pick-save route, `attemptId`, `questionId`, the signed attempt token and `pick` (a list of text ids, each re-checked by the server against the question's allowed texts), and for its grade route the same `pick` beside the fields above on the first try; for the essay unit's attempt-start route, a `questionId` (an essay id the server checks is live and not already open); for its scaffold route, `attemptId`, `questionId`, the signed attempt token, an `action` (`save` or `start`) and the scaffold's text fields; for its review route and discard route, `attemptId`, `questionId` and the signed attempt token (the review also the scaffold's text fields); for its grade route, `attemptId`, `questionId`, the signed attempt token and the essay text (no `phase`); and, for a
  save retry, the server-issued signed result receipt. The transcribe route (`POST /api/transcribe`) MAY accept 1-3 images and an optional note;
  `/api/grade` MAY accept the signed transcription token. The vision prompt gets no model answer or rubric.
- The client MUST NOT send a user id, marks, max marks or grading method. The only exception is
  the binary self-mark flag, which the server accepts only with a valid token.
- Other routes MAY take from the client only resource identifiers that the server re-checks: a
  unit id, concept id, version id, the kind of concept item (summary or illustration), or the text
  id of an unseen-text or comparative unit's stimulus image or text page, which the server checks against the shared text store and the student's attempts. They
  MUST NOT accept a user id, marks, max marks, grading method or answer, and the server MUST
  authorise every such request from the session (Principle IX for teacher routes).
- Before acting on any request, the server MUST verify that every `attemptId` belongs to the
  session user (by database lookup, or by a valid signed attempt token bound to that user), and
  that every token or receipt is correctly signed, unexpired and bound to that user, attempt and
  question.
- MC answer keys MUST store the correct option's text (`correctText`), not its index. Option order
  is shuffled deterministically by question id (`lib/shuffle.ts`), so the public bundle shows no
  answer pattern.
- [DECISION] The stored "answer submitted" and grading feedback MAY be shown back to the student
  who wrote them. Model answers and rubrics remain server-only and MUST NOT be stored per-result.
- MC wrong-option explanations MUST live in the server-only answer key (`answers.ts`). One MAY be
  shown to the student only after they answer that question.
- Concept summaries explain a concept in general. They MUST NOT reproduce any question's model
  answer, rubric text or correct MC option.
- Concept review and past-attempt MC explanations MUST get answer-key material only by calling
  functions exported from `lib/grading.server.ts`. That material MUST stay server-side and MUST
  NOT be stored per result.
- [DECISION] The sentence-writing unit (spec 005) MAY send part of the answer key to the browser
  at defined moments, and only then: after phase 1 is graded below 3 marks, the missed or misused
  target terms with their one-line definitions (the hint); and at the discussion or self-mark
  screen, the model sentences and the full target-term set with definitions. Nothing from the key
  MAY reach the browser before phase 1 is graded (or has fallen back to self-marking), including
  on reload or resume.
- [DECISION] The paragraph-writing unit (spec 007) MAY send part of its essay key to the browser
  at defined moments, and only then. Before phase 1 is marked: the essay's brief, which brief
  fields the part uses, the "What this part must do" lines, the directive verb's definition, and
  the model text of the EARLIER parts of the same essay. After phase 1 is marked: the
  per-criterion verdicts, the marker's one-line reasons and its overall feedback (never model
  text). At the discussion or self-mark screen: the current part's model text and commentary,
  the model text of the earlier parts, and labels (never text) for the later parts. Never, at any
  moment, including on reload, resume or the attempt detail page: the model text of LATER parts,
  the marking notes, or any model text in a tip. Earlier parts' model text MUST come through
  functions exported from `lib/grading.server.ts`.
- [DECISION] The unseen-text short-answer unit (spec 008) MAY send part of its key to the browser
  at defined moments, and only then. Before the first try is marked: nothing from the key (the
  stimulus text, the question, its marks and its source are public content). After a try is
  marked: the per-skill verdicts, the marker's one-line reasons, its feedback and its biggest-gap
  sentence (never model-answer text; the server rejects a marker reply that repeats a long run of
  the model answer). At the discussion (the first try at full marks, a question with no retry, a
  marked retry, or a declined retry): the model answer. Never, at any moment, including reload,
  resume and the attempt detail page of an unfinished question: the marking criteria, the marking
  notes, a visual text's written description, or the model answer before the discussion. Key
  material MUST come through functions exported from `lib/grading.server.ts`.
- [DECISION] The comparative short-answer unit (spec 009) follows the unseen-text release schedule above, with two or more texts per question and nine skills. Before the first try is marked: nothing from the key (the texts a question shows, every allowed text of a choice question, the question, its marks, its source and the line that a choice question's model answer shows one pairing are public content). After a try is marked: the nine per-skill verdicts, the marker's one-line reasons, its feedback and its biggest-gap sentence (never model-answer text). At the discussion: the model answer and, for a choice question, the pairing it uses. Never, at any moment, including reload, resume and the attempt detail page of an unfinished question: the marking criteria, the marking notes, any visual text's written description, or the model answer before the discussion. The pick is the student's own choice and may be shown back to them at any step. Key material MUST come through functions exported from `lib/grading.server.ts`.
- [DECISION] The Economics essay-writing unit (spec 010) MAY send part of its key to the browser at defined moments, and only then. Before an essay is marked: nothing from the key (the essay question, its directive verb and definition, its economy tag, its source if it is a school-trial question and whether it is live are public content, and the scaffold, the plan review and the draft are the student's own text). After an essay is marked: the five per-criterion verdicts and reasons, the band, the mark, the two lift points, the flagged figures (quoting the student's words), the gaps and the concepts used well (never model-essay or marking-note text; the server rejects a marker reply that repeats a long run of the notes or the school's criteria). With the student's own finished result: the band 1 model essay. Never, at any moment, including reload, resume, discard and the attempt detail page of an unfinished attempt: the marking notes, the school's criteria, the concept tags of an essay, or the model essay. Key material MUST come through functions exported from `lib/grading.server.ts`.
- [DECISION] The English essay-writing unit (spec 011) MAY send part of its key to the browser at defined moments, and only then. Before an essay is marked: nothing from the key (the essay id, verbatim question, directive and definition, school-trial source, live state and public practice concept ids are public content; the scaffold, plan review and drafts are the student's own text). After an essay is marked: the four per-criterion verdicts and reasons, the final mark and final band, the two lift points, question focus and its reason, knowledge errors, flagged quotations (with the play's exact words only for a near match), the gaps and the concepts used well. With the student's own finished result: the band 1 model essay. Never, at any moment, including reload, resume, discard and an unfinished attempt detail: marking notes, the rubric's Away text notes, per-essay key concept tags, pilot essays, or the model essay before that finished result. The full play text MUST remain server-only. The only play words permitted in a browser response are an exact near-miss correction excerpt and quotations within the model essay released with that same finished result. Key material MUST come through functions exported from `lib/grading.server.ts`; the reference text MUST be read only by the server-only reference-text module.

Rationale: a practice tool whose answers can be read from the page source is worthless. The
`server-only` import makes the build fail if client code ever pulls the key in.

### II. Signed-In Students, Minimal Personal Data [DECISION]

- Every page and API route, except the sign-in page, the auth callback and the scheduled
  retention endpoint, MUST require a signed-in Google account (Auth.js / NextAuth, Google
  provider). There is no anonymous mode in production.
- The retention endpoint MUST require the `CRON_SECRET` bearer token (checked in constant time),
  MUST reject every other caller, MUST only perform retention deletion, and MUST NOT return
  student data.
- Any Google account MAY sign in. There is no domain restriction.
- The server MAY store only:
  - per student: Google account id (`sub`), name, email, and the timestamps created, last
    sign-in and last answer;
  - per quiz attempt: the unit id, start and completion times, the ordered list of question ids
    drawn, and the MC option display order;
  - per result: a quiz-attempt id, unit id, question id, answer submitted, marks awarded, max
    marks, graded-by LLM/self/auto, and timestamp;
  - per AI-graded result: the feedback text and the rubric points hit and missed, exactly as
    shown to the student. Model answers and rubric text MUST NOT be stored per result
    (Principle I);
  - per writing-practice question in an attempt: the phase 1 and phase 2 sentences, their marks,
    the per-term outcomes from phase 1, and the feedback shown, plus the display-only grading data
    (the credited spans for each phase, the phase 2 term outcomes and any language note), stored in
    a phase row until the question is final and kept for the attempt detail page; and the student's
    in-progress draft text for each phase, stored in a draft row only until the question is final;
    all deleted with the student like results. The display data and drafts never change marks or
    concept tracking, which always come from the phase 1 outcomes;
  - per paragraph-writing question in an attempt (spec 007): the phase 1 and phase 2 texts, their
    marks, the four per-criterion verdicts each with the marker's one-line reason, the overall
    feedback shown, the prompt version and model that marked each phase, how the question ended
    (marker, self-mark, or first-try mark kept because the correction could not be marked), the
    recorded mark, and whether and when the student flagged the mark for review; stored in a phase
    row, kept for the attempt detail page, deleted with the student like results. The student's
    in-progress draft text is stored in the existing draft row. Verdicts, reasons and the flag
    never change marks or concept tracking, which always come from the phase 1 outcomes;
  - per unseen-text question in an attempt (spec 008): the first-try and retry texts, their marks,
    the per-skill verdicts each with the marker's one-line reason, the feedback and
    biggest-gap sentence shown, the "to go further" sentence for a full-mark first try, the prompt version and model that marked each try, how the
    question ended (full marks, retried, declined, or no retry offered), and the recorded
    mark; stored in a phase row, kept for
    the attempt detail page, deleted with the student like results. The student's in-progress
    draft text is stored in the existing draft row. Verdicts and reasons never change
    marks or concept tracking, which always come from the first try's verdicts.
  - per comparative question in an attempt (spec 009): everything stored for an unseen-text question, with nine per-skill verdicts instead of seven and the pick (the text ids the student chose, on a choice question), kept in the same phase row (the pick is also held in the draft row until the first try is submitted); deleted with the student like results. Verdicts, reasons and the pick never change marks or concept tracking, which come from the first try's verdicts.
  - per essay attempt (spec 010): the unit and essay id; the scaffold (its text fields) and when it was locked; the plan review, if one was made (seven check lines and any flagged figures), with its prompt version and model; the essay text and its word count; the five per-criterion verdicts each with the marker's one-line reason; the band; the raw and the final mark; the two lift points; flagged figures; the gaps (concept id and one-sentence detail) and the concepts used well; and the prompt version and model that marked it; stored in one essay row, kept for the attempt detail page, deleted with the student like results. The student's in-progress essay is stored in the existing draft row. A discarded attempt (unmarked only) is deleted with its scaffold, review and draft. Verdicts and reasons never change concept tracking, which comes from the gaps and concepts used well.
  - per English essay attempt (spec 011): the unit and essay id; the English scaffold (thesis, three claims and three evidence notes) and when it was locked; the plan review, if one was made (five check lines), with its prompt version and model; the essay text and word count; the four per-criterion verdicts each with the marker's one-line reason; question focus and its reason; knowledge errors; quote-check results; the raw and final mark; the marker-selected and final bands; the band reason and two lift points; the gaps (concept id and one-sentence detail) and concepts used well; the reference-text content hash used by the quote check; and the marking and review prompt versions and models; stored in the essay row with the unit discriminator, kept for the attempt detail page, deleted with the student like results. The student's in-progress essay is stored in the existing draft row. A discarded unmarked attempt is deleted with its scaffold, review and draft. Verdicts and reasons never change concept tracking, which comes from the gaps and concepts used well.
  It MUST NOT store profile photos, Google tokens beyond what the session needs, or any other
  personal data without amending this constitution. Photos for transcription are never stored or logged;
  only the transcription (the "answer submitted") is stored. Answer photos are sent to an AI provider
  that may use them for training; school consent must state this and tell students to keep personal or
  sensitive information out of photos. Minimal observability metrics (hashed userId, questionId, outcome,
  duration_ms, model) are allowed in logs (FR-026). Answer text and per-criterion or per-skill results MAY be
  copied, without any student identifier, into local test files outside the repository
  (`/resources/`) to test and improve the marker, and re-marked by the same AI provider; school
  consent must state this.
- Student data MUST be stored in an Australian region (Neon Postgres, AWS ap-southeast-2 Sydney).
- Retention: a student and all their data MUST be deleted automatically 2 years after their last
  activity (a scheduled job). Last activity is the later of last answer and last sign-in, or the
  account creation time if neither exists. There MUST also be a documented way to
  delete one student's data immediately on request.
- Students are minors. Before production launch the project MUST have school approval / consent
  covering this data.
- No new per-student fields. A student's concept counts MUST be derived from their stored
  results, not stored separately: a wrong answer sets the concept's count to its clear-after number
  (3, or 2 for a concept whose `concepts.ts` entry declares `clearAfter: 2`), a correct answer
  takes 1 away, and the concept clears at 0. A concept whose unit declares `conceptsClearOnOtherQuestions` (spec 010) is not taken one away by a correct use in the same question that last set it; only a different question clears it.
- Other server-side state is limited to rate-limit and daily-cap counters (Principle VII)
  and shared concept content. Shared concept content is, per concept id: the summary and the
  illustration (with its brief), each with its own generator model, generation time, review
  status, reviewer model, reviewer reason, review time and who approved it (reviewer or
  teacher), plus at most one pending or failed replacement for each. It is not personal data and
  MUST NOT contain any student's answers or name. The reviewer's reason MAY quote model answers
  or rubrics, so it MUST be shown to teachers only. Shared concept content MAY also hold pipeline
  bookkeeping that is not personal data: per concept item, a processing lease (owner and
  expiry), a retry-after time and the last error; and per version, its origin (first
  generation, automatic regeneration or teacher regeneration) and attempt number.
  Shared reference texts are also not personal data: a text id, the full reference text, its content hash and its loaded-at time. They contain no student id, answer or name, are read only by server-only code, and are never exposed by a browser route.

Rationale: scores must follow the student across devices and give the teacher a view of
progress. Collection is limited to what that needs, and data does not outlive its use.

### III. Content Is Code [PRACTICE + DECISION]

- Questions are typed TS files under `content/units/<unit-id>/` (`meta.ts`, `questions.ts`,
  `answers.ts`), reviewed in PRs and deployed atomically with the app.
- The unit id, folder name and question-id prefix MUST match (`<unit-id>.<n>`).
- Every unit MUST be registered in both `content/index.ts` and `content/answers/index.ts`.
- Shipped question ids MUST NEVER be renumbered or reused. Bookmarked URLs depend on them.
  [DECISION] Question ids are also foreign keys in the results table, which is one more reason.
  New questions get new ids appended.
- [DECISION] Removing a question from a unit MUST NOT delete its stored results.
- Each concept-ready unit MUST list its concepts in `content/units/<unit-id>/concepts.ts`: an id
  and a one-line description each.
- Every question in a concept-ready unit MUST carry a concept tag from its unit's list.
- Shipped concept ids MUST NEVER be renamed or reused, because student progress depends on them.
- [DECISION] Units adopt concepts and MC wrong-option explanations one at a time. `meta.ts` MAY
  mark a unit concept-ready only when every question in it is tagged, and MAY mark it
  explanations-complete only when every wrong MC option in it has an explanation. A unit that is
  not marked keeps working as it did before: it has no "Things you need to know", no weighting
  toward weak concepts, and no wrong-option explanations, and it MUST NOT show an error. The
  markers are public metadata and MUST NOT contain answers.
- Quiz questions MUST come only from the unit's question bank. No quiz question is written by an
  LLM.

Rationale: versioning content with the code means a deploy can never serve questions without
matching answers.

### IV. Validation Gates the Build [PRACTICE + DECISION]

- `npm run validate` (`scripts/validate-content.ts`) runs in `prebuild` and MUST pass.
- [DECISION] Content rules belong in the validator, not in reviewers' heads. When a new content
  convention is introduced, the validator MUST be extended to check it in the same change.
- Build-time generation is preferred over shipping heavy libraries to the client. For example,
  KaTeX formulas are pre-rendered by `scripts/gen-formula-html.ts`, which keeps KaTeX out of the
  client bundle.
- The validator MUST check that every question in a concept-ready unit has a valid concept tag
  and every concept id is unique, and that every wrong MC option in an explanations-complete unit
  has an explanation. It MUST fail the build if a unit is marked but does not meet this.

Rationale: the validator already checks id namespacing and uniqueness, answer-key coverage, MC
`correctText` membership, model answers, one rubric point per mark, and exam-to-unit references.
Automated checks do not drift.

### V. Syllabus Fidelity and Original Content [PRACTICE + DECISION]

- Questions MUST align to the current NESA syllabus for the subject.
- Each unit's sources MUST be documented, in `docs/<unit>-research.md` or the README units table.
- Questions MUST be original, with one exception. While the app is non-commercial, a question MAY
  be copied word for word from a school trial or half-yearly paper, provided it shows its
  source: the school, the year, the paper type (trial or half-yearly) and the question number.
  The source MUST be recorded in the question's public data and shown with the question.
- Before the app goes commercial (for example by charging students, selling access or carrying
  advertising), every question copied under that exception MUST be rewritten as an original
  question.
- Real HSC questions (from NESA past papers or exams) MUST NEVER be included, whether copied,
  lightly reworded or recreated, so that past HSC papers stay unseen for full practice exams.
- Every diagram MUST be redrawn in code (for example a per-unit `diagram.ts`). Scanned,
  photographed or otherwise copied images MUST NOT be committed or served, with one exception.
  [DECISION] While the app is non-commercial, a visual stimulus text of an unseen-text unit or the comparative unit (specs
  008 and 009) MAY be an image cropped from a school trial or half-yearly paper, under the school-paper
  exception above. It MUST show its credit (school, year, paper type, question number) with the
  question; it MUST be committed only under the `images/` folder of the unseen-text unit that stores texts (spec 008's, shared with spec 009's unit) and served only to a
  signed-in student through an authenticated route, never from a public path and never listed or
  guessable without a session; it MUST NOT come from a real HSC paper; and before the app goes
  commercial it MUST be removed, or replaced by an original or properly licensed image, together
  with its question. This rule covers question content, not student answers (photo answers are
  permitted).
- [DECISION] The school-paper exception also covers the stimulus text printed with a copied
  question (a poem, extract or article, with its title, author and source line as the paper prints
  them) and the school's marking guidelines and sample answers where they are used as the
  question's rubric and model answer (server-only, Principle I). The same duty applies before the
  app goes commercial: the question is removed, or its text is replaced by an original or licensed
  text.
- Other copyrighted past papers and source material stay in `/resources/` (gitignored) and MUST
  NOT be committed or reproduced, apart from the school-paper exception above.

Rationale: students are practising for a specific exam, and the repo is not a vehicle for
redistributing copyrighted papers. School papers are used only for private, non-commercial
practice, with credit, and on the condition that this stops if the app becomes commercial; HSC
papers are kept out entirely so students can still sit them cold as a real test. Redrawing
diagrams in code keeps them accurate, accessible and free of scanned third-party artwork (the one exception
is a cropped visual stimulus under the school-paper exception).
[DECISION]: the "documented sources" rule is stated as mandatory here. Current units follow it,
but the README does not yet say so.
- [DECISION] While the app is non-commercial, a prescribed text needed only to verify a student's quotations (Michael Gow's Away, spec 011) MAY be loaded from a gitignored local copy into a server-only database table. The full text MUST NOT be committed to the repository in any form (plain, encrypted, encoded or in a fixture), MUST NOT be placed under `public/`, and MUST NOT be returned as a text to the browser. Only an exact near-miss correction excerpt and quotations within a reviewed model essay released with the student's own finished result MAY include its words in a browser response. Before the app goes commercial, the reference text and every affected model essay MUST be removed or replaced by original or properly licensed material.

### VI. Grading Is Fair, Explainable and Degrades Gracefully [PRACTICE + DECISION]

- Short answers earn one mark per rubric point, judged on the substance of the reasoning rather
  than exact wording. Partial credit is allowed.
- The grader MUST return `marksAwarded`, `feedback`, `rubricHits` and `rubricMisses`.
- Any LLM failure (no key, bad key, timeout, unparseable output after one retry) MUST fall back
  to student self-marking (`needsSelfMark`), except in the units that say otherwise below. It MUST
  NOT show an error or award a wrong mark.
  For photo answers: an unreadable photo or one that does not answer the question prompts a retake
  and is never given 0 marks. A question may be read at most 3 times; after that the student types
  the answer or self-marks. The AI slot is refunded on illegible, not-an-answer, or model failure;
  it is not refunded when the student reads and then leaves without marking.
- [DECISION] When a student is over the LLM daily cap, short answers fall back to self-marking
  (`needsSelfMark`), exactly like an LLM failure.
- [DECISION] A unit whose draw is sequential (spec 007) or depends on stored progress (spec 008)
  cannot choose its next question without
  reading the student's results. If the database cannot be read, such a unit does not start a
  quiz: it shows a notice and asks the student to try again; it MUST NOT guess a question.
- [DECISION] On a correction (phase 2) of the paragraph-writing unit, a daily-cap or LLM failure
  ends the question with the first-try mark and the discussion; the correction is never
  self-marked and no error is shown. At phase 1 the self-marking fallback applies as for other
  units.
- [DECISION] The unseen-text, comparative and essay-writing units (specs 008, 009, 010 and 011) are never self-marked, on either of its
  two tries, and a try that cannot be marked does not end the question. If the marker fails (no
  key, a failed call, or an empty, cut-off, unparseable or incomplete reply after one retry), the
  student's answer stays locked on screen while the app retries; if marking still fails, the
  editable box returns holding the text with a plain notice that it could not be marked just now,
  no mark is invented, and the AI slot is refunded. If the student is over the daily cap, the app
  tells them they have reached today's marking limit and to come back tomorrow; the answer stays
  in the box, Submit stays disabled until the next Sydney day, and the question waits at that step
  and is offered again first. These notices are plain status messages, not errors, and nothing
  else is shown. A student may still decline the retry, which records the first try's mark.
- [DECISION] The essay-writing units (specs 010 and 011) have one try per attempt and no second phase. If the marker fails, the editable box returns with the essay and the slot is refunded; if the student is over the daily cap, the app tells them to come back tomorrow, and the scaffold and essay stay as drafts. The optional plan review is never marked and never blocks the essay: if the reviewer fails or the student is over the cap, the app says so and offers "Start writing" without it. Until the English review pilot has passed and Chiang has approved it, only "Start writing" is offered. If the English reference text is unavailable, marking refuses before a model call or daily slot, preserves the essay and says quotations could not be checked; it MUST NOT silently skip the quote check or award an unverified mark. Neither unit can start, resume, mark, review, discard or save without the database and MUST NOT guess.
- [DECISION] The unseen-text and comparative units cannot start, resume, mark or save a quiz without the database:
  it draws from the student's results, offers an unfinished question first, reserves a daily-cap
  slot and stores each try. If the database cannot be read, the unit shows a notice and asks the
  student to try again; it MUST NOT guess the next question or a resumed step, MUST NOT mark an
  answer it cannot save, and MUST NOT self-mark. This overrides the weighting rule and the
  unreadable-database rule below for this unit, as the sequential-unit bullet does for spec 007.
- [DECISION] MC grading MUST be instant and server-side. It requires sign-in like everything
  else, but has no daily cap.
- [DECISION] Results MUST be saved for both MC and short answers. If saving fails, the student
  still sees their mark and the save is retried or reported. A database outage MUST NOT block
  practice.
- [DECISION] If the database cannot be read at all, MC answers MUST still be marked and shown
  (graded from the signed attempt token) and queued for saving, and short answers MUST fall back
  to self-marking with a notice. This degraded mode applies only when the database is
  unreachable: if it can be read and the student's row is missing, the session MUST be refused.
- If a concept summary or illustration cannot be generated (no key, failure, over the cap), the
  unit page MUST still list the student's weak concepts by their one-line descriptions. It MUST
  NOT show an error or stop the student starting a quiz.
- Every concept summary and illustration MUST pass an independent reviewer LLM, using a different
  model from the generator, before students see it. The reviewer checks it against the concept
  description and the unit's model answers and rubrics. A failed item is regenerated once; if it
  fails again it MUST be held back and flagged for teacher review. Students then see the
  previously approved version if there is one, otherwise only the one-line description; a failed
  item is never shown.
- Weighting a quiz toward weak concepts needs the student's saved results. If the database cannot
  be read, the quiz MUST still start, drawn without weighting, as in the existing degraded mode.

Rationale: students need to trust their marks, and a flaky or missing LLM or database must never
block practice.

### VII. Cost and Abuse Controls on Paid Paths [DECISION]

- The class-code gate is retired: `CLASS_CODE`, `SKIP_CLASS_CODE`, `/api/unlock`, the unlock
  cookie and `lib/gate.server.ts` are removed. Sign-in replaces it.
- Because any Google account can sign in, the LLM path MUST be protected by:
  - (a) a per-user daily cap on LLM-graded short answers, set by `LLM_DAILY_CAP` (default 40),
    counted server-side per user per Sydney calendar day; and
  - (b) the existing per-IP rate limit, plus a per-user per-minute limit
    (`lib/ratelimit.server.ts`: Upstash, with in-memory fallback).
- Concept generation MUST have its own daily cap, separate from `LLM_DAILY_CAP`, and MUST run
  only in four cases: a concept with nothing stored yet, a teacher's regeneration, the single
  automatic regeneration after a failed review (Principle VI), and a retry of a pending review.
- Secrets MUST be read only in server-side code: `app/api/**`, `lib/*.server.ts`,
  `middleware.ts`, `drizzle.config.ts` and `scripts/**`. They MUST NOT be read in client
  components or anything bundled for the browser, and nothing may be prefixed `NEXT_PUBLIC_`.
  Real keys MUST NOT be committed (`.env.local` is gitignored). This covers `AUTH_SECRET`,
  `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL` and `CRON_SECRET`.
  - `middleware.ts` MAY read only what auth needs (`AUTH_SECRET` and auth config); it MUST NOT
    read `OPENROUTER_API_KEY`.
  - `drizzle.config.ts` and `scripts/**` run only locally or in CI/deploy, never at request time,
    and take secrets from the environment or `.env.local`, which is never committed.
- `ILLUSTRATION_MODEL` and any key it needs follow the same server-only rules as
  `OPENROUTER_API_KEY`.
- `REVIEW_MODEL` follows the same server-only rules as `OPENROUTER_API_KEY`. Reviewer calls count
  toward the concept-generation cap.
- `VISION_MODEL` follows the same server-only rules as `OPENROUTER_API_KEY`. Photo reads count
  against `LLM_DAILY_CAP` (one slot per question, no separate cap).
- `ENGLISH_ADV_GRADING_MODEL` follows the same server-only rules as `OPENROUTER_API_KEY`. It is
  the model the unseen-text and comparative units mark with (default `deepseek/deepseek-v4.1-flash`); it never
  falls back to `GRADING_MODEL`. Each marked try counts one slot against `LLM_DAILY_CAP`,
  refunded if the marker fails.
- `ESSAY_GRADING_MODEL` and `ESSAY_REVIEW_MODEL` follow the same server-only rules as `OPENROUTER_API_KEY`. The first marks the essay-writing unit's essays (default `deepseek/deepseek-v4.1-flash`, or the model its marker check names); the second gives the optional plan review (same default). Neither falls back to `GRADING_MODEL` or `ENGLISH_ADV_GRADING_MODEL`. Each marked essay and each plan review counts one slot against `LLM_DAILY_CAP`, refunded if the call fails.
- `ENGLISH_ESSAY_GRADING_MODEL` and `ENGLISH_ESSAY_REVIEW_MODEL` follow the same server-only rules as `OPENROUTER_API_KEY`. The first marks the English essay-writing unit's essays (default `openai/gpt-6.2-sol`); the second gives its optional plan review (same default). They are separate from each other and from every other unit's setting: neither falls back to the other, to `ESSAY_GRADING_MODEL`, `ESSAY_REVIEW_MODEL`, `ENGLISH_ADV_GRADING_MODEL` or `GRADING_MODEL`. Each marked English essay and each English plan review counts one slot against `LLM_DAILY_CAP`, refunded if the call fails. Loading or reading the reference text makes no model call and takes no slot.
- `REMARK_MODEL` follows the same server-only rules as `OPENROUTER_API_KEY`. It is read only by
  `scripts/**` for the offline re-mark of full-mark paragraph, unseen-text and comparative answers, which does
  not count against `LLM_DAILY_CAP`.
- In production, missing auth or database config MUST fail closed (refuse to serve), never fall
  back to open access. In local development only, a documented dev-login MAY stand in for Google,
  and results MAY be stored in a local or branch database. Without `OPENROUTER_API_KEY`, short
  answers still self-mark.
- Generated illustrations MUST be displayed through an `<img>` element, never inserted as inline
  HTML or SVG.

Rationale: one shared LLM key is reachable by anyone with a Google account, so it needs a
per-user budget as well as per-IP limits. Failing closed stops a misconfigured deploy from
exposing student data.

### VIII. Simplicity [PRACTICE + DECISION]

- [DECISION] Keep the dependency footprint small. Runtime dependencies are `next`, `react`,
  `react-dom`, `katex`, the two Upstash packages, Neon Postgres and Auth.js. The last two are
  now justified for cross-device scores and teacher visibility. `@resvg/resvg-js` is also allowed,
  server-side only, to render generated illustrations for the reviewer (spec 002). Any further
  database, ORM or auth addition, or any state library, requires a written justification in the
  plan. No new dependency is needed for photo answers: native file input, canvas, `FormData`, and
  the existing fetch wrapper are used.
- [DECISION] Mobile-first: students mostly use phones, so key actions (e.g. "Start quiz") MUST
  be reachable without scrolling past reference material (the unit page already places
  `meta.formulas` below Start quiz).
- [PRACTICE] Design tokens come from `styles/tokens.css`.
- [DECISION] The database is the only source of truth for scores. Existing browser
  `localStorage` history is NOT migrated; students start fresh on first sign-in, and the
  `localStorage` score history in `lib/scores.ts` is retired. `localStorage` MAY be used only as
  a cache.

Rationale: a small codebase is easier for a small team to keep correct.

### IX. Teacher Access Is Server-Side and Allowlisted [DECISION]

- Teacher/admin pages (per-student history, per-question and per-unit class averages) MUST check
  the signed-in email against the `ADMIN_EMAILS` env var on the server, for both the page and its
  data routes. Hiding links in the UI is not access control.
- Students MUST only be able to read their own results. Every query for results MUST be scoped
  by the session's user id on the server, never by an id sent from the client.
- The page for reviewing and regenerating concept summaries and illustrations MUST check
  `ADMIN_EMAILS` on the server, for the page and its data routes.
- Aggregate views SHOULD rank units and questions by lowest average mark, so the teacher can see
  where to focus.

Rationale: the results table holds minors' data, so authorization must be enforced where the
data is read.

## Quality Gates

Every feature plan MUST satisfy:

- `npm run build` (which runs `gen:formulas` and `validate`), `npm run lint` and `npm test`
  (Vitest) pass.
- A constitution check confirming:
  - no answer-key leakage into client bundles;
  - the client sends only the fields Principle I allows, and the server verifies attempt
    ownership and every token or receipt before acting on it;
  - secrets are read only in the server-side locations Principle VII allows;
  - the retention endpoint meets Principle II's constraints;
  - every new route requires a session;
  - every results query is scoped to the session user (or `ADMIN_EMAILS` for teacher routes);
  - no new personal-data fields beyond Principle II's list;
  - no renumbered question ids;
  - the LLM path enforces the daily cap;
  - no MC explanation in any client bundle;
  - illustrations are rendered only through `<img>`;
  - concept generation enforces its own cap;
  - the paragraph unit's later-part model text and marking notes never leave the server;
  - the unseen-text and comparative units' marking criteria, marking notes, model answer (before the discussion)
    and visual descriptions never leave the server, and its stimulus images are served only
    through the authenticated route;
  - the essay unit's marking notes, school criteria, concept tags and model essay (before the student's own finished result) never leave the server;
  - the English essay unit's marking notes, Away text notes, key concept tags, pilot essays and full play text never leave the server; its model essay appears only with the student's own finished result, and the only play excerpts in browser responses are near-miss corrections and quotations in that released model essay;
  - every question copied from a school paper shows its source (school, year, paper type,
    question number), no real HSC question is included, and no diagram is a scanned image.
- Testing: authorization and cost-control logic MUST ship with automated tests covering:
  - students can only read their own results;
  - admin routes reject non-allowlisted emails;
  - production fails closed when auth/DB config is missing;
  - the daily cap falls back to self-marking;
  - the concept cap falls back to descriptions only;
  - concept counts follow the rule: a wrong answer sets the count to the concept's clear-after
    number (3, or 2 for part tips), a correct answer takes 1 away, and the concept clears at 0;
  - the paragraph unit's capped-correction ending keeps the first-try mark and shows no error;
  - the unseen-text and comparative units' marker failure returns the editable box with no mark and no self-mark,
    their daily-limit state disables Submit until the next Sydney day on both tries, and a skill's
    concept count clears after 2 first tries (a shared skill's count is one across the two units);
  - the essay unit's marker failure returns the editable box with no mark, its daily-limit state keeps the drafts and disables Submit, a plan-review failure offers "Start writing", and a gap clears after 2 correct uses on a different essay;
  - the English essay unit's marker failure and missing-reference-text state preserve the essay with no mark and no self-mark, its daily-limit state keeps the drafts and disables Submit, a review failure or not-live review offers "Start writing", final-mark adjustments follow the mandated order, quote-check parity and model-essay quote checks pass, and a gap clears after 2 correct uses on a different essay;
  - the regenerate route rejects non-allowlisted emails;
  - an item that fails review twice is never shown to students.
  Other logic MAY have tests but is not required to.
- A unit marked by an LLM against labelled pilot essays MUST NOT set a question `live` until its marker check (`resources/<topic>/`) has passed on the prompt version and model that ship. For the English essay unit this is the one-sided `eng-essay-pilot-5` gate. Every live English model essay MUST also be 900–1,100 words and pass the deterministic quote check with zero flags. The optional English plan review MUST stay not live until its separate scaffold pilot has passed and Chiang has approved every output.
- Accessibility: no target is currently set.
  TODO(ACCESSIBILITY_TARGET): decide a target for quiz flows (e.g. WCAG 2.2 AA), or omit.

## Known Accepted Exceptions

These are documented deliberately. Do not "fix" them silently.

- The `npm audit` high-severity `postcss` advisory is transitive from Next 15 build tooling. It
  is build-time only and not in the request path. It will be revisited deliberately when moving
  to Next 16.
- `content/formulas.generated.ts` is generated but committed so `next dev` works without a
  build step.

## Governance

- This constitution overrides other practice docs (including the README) where they conflict.
- Amendments are made by PR. Each amendment MUST update the version and the Last Amended date.
- Versioning is semantic: MAJOR for removed or redefined principles, MINOR for new principles or
  materially expanded guidance, PATCH for wording and clarifications.
- Plans produced by `/speckit.plan` MUST include a Constitution Check section. Any violation MUST
  be justified in the plan's Complexity Tracking table.
- Compliance is reviewed in PRs against the Quality Gates above.

**Version**: 2.18.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-11-23

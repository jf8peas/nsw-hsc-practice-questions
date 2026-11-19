# `/speckit-specify` prompt for spec 008

Paste everything inside the block below into your agent as one message. The first line makes Spec Kit
write `spec.md` into this folder instead of creating a new one.

```text
/speckit-specify SPECIFY_FEATURE_DIRECTORY=specs/008-english-unseen-short-answers

Advanced English Unseen-Text Short Answers: a new unit (unit id y12-english-advanced-unseen-texts), the app's first English unit. It practises one kind of question: the single-text short answers in Section I of HSC English Advanced Paper 1, Texts and Human Experiences, which in school trial papers are usually Questions 1–4. Each quiz shows one unseen text with one question below it; there is no time limit; an LLM marks the answer; skills the student misses feed "Things I need to know". Why: Peyton sits Year 12 Advanced English Task 1 on Mon 7 Dec 2026 (20%, Section I = 4–6 unseen texts, 5 short-answer questions, 20 marks), and the unit also serves the 2027 HSC, the first under the new English Advanced 11–12 Syllabus (2024), whose Paper 1 Section I has 5 or 6 short-answer questions on unseen texts.

The settled requirements are in the Claude doc "Spec 008: Advanced English unseen-text short answers" (https://claude.ai/artifact/8iiHQJGqBbGtfx634bzBEp). The marker pilot is in resources/english-unseen/ (rubric.json is the prompt that passed, version unseen-pilot-4; pilot-questions.json holds the tuning and holdout answers; runs/ holds every report) and scripts/pilot-unseen-marker.py. The trial papers are in resources/y12_english_advanced_paper1_trial_exams/. There is no design.md for this unit: reuse the question-screen patterns of specs 006 and 007, and put visual details in the plan, not the spec.

Terms: a text is one unseen stimulus text (poem, prose fiction, non-fiction, personal essay, visual and so on). A question is one Section I question from a school trial paper that refers to exactly one text; a question with parts (a), (b) on the same text is one question. A quiz is one question. A skill is one of the seven tracked skills below.

Scope:
- In: Questions 1–4 that refer to exactly one text; one question per quiz; typed answers; LLM marking; one capped retry; a model answer; "Things I need to know".
- Out: questions on two or more texts (usually the final comparative question); full papers; reading time and timers; the Section II essay; photo answers (answers are prose).

Each quiz shows:
- The text first, headed as on the paper (for example "Text 2 — Poem"), with its title, author and source line. Poems keep line and stanza breaks and line numbers where the paper has them; prose keeps its paragraphs; glossary footnotes from the paper are kept.
- Visual texts show as an image cropped from the paper that the student can zoom. Each has a written description stored server-side for the marker, which reads the description, never the image.
- Below the text: the question, its mark value, the question's source (school, year, exam, question number, as the other units quote sources), and a text box with a word meter.
- On a phone the text and the question stack, and the text stays reachable while the student writes.

Submission rules:
- No timer, no reading-time lock, no auto-submit.
- Under 20 words, Submit is disabled with a note saying why.
- Suggested length = every line the paper gives for the question, the main space plus the "If you need additional space" lines, at 12 words a line (17 lines ≈ 204 words). Up to 20% over shows a warning; more than 20% over disables Submit until the answer is cut.

Marking:
- The marker uses deepseek/deepseek-v4.1-flash for this unit (not the app's default grading model). It receives the question, the directive verb and its definition, the text (or the visual's description), the school's marking criteria (band descriptors per mark), the marking notes (features a student could discuss, not a checklist), the suggested length and word count, the question's model answer as an example of a full-mark answer, and the student's answer. It returns one whole mark, a met/missed verdict with a one-line reason for each of the seven skills, two or three sentences of feedback on what earned the mark, and one sentence naming the biggest gap. The prompt is the one in resources/english-unseen/rubric.json (bump promptVersion on every change).
- The model answer given to the marker is what calibrated it in the pilot: without it, school answers the schools had marked full lost a mark. It is the school's sample answer where one exists, otherwise a generated answer reviewed before the question goes live.
- A reply that is empty, cut off, unparseable or missing any field (the mark, any skill verdict, the feedback or the biggest gap) is retried like a failed call.
- The marker also says whether a visual text's description was enough to mark from. In production every visual text's description is checked before the question goes live; a visual text whose description is not enough is blocked from the bank and never shown.
- The result shows the mark out of the question's value, the feedback, the biggest gap and the seven skill verdicts.

The seven skills (approved; NESA's Section I marking feedback for 2022–2024 names these most often; comparison is left out because questions are single-text):
1. Answers every part of the question: covers every idea the question names, including qualifiers such as "complex" or "diverse".
2. Follows the directive verb: does the task the verb sets (explain, analyse, assess, evaluate). Missed only when the answer does a different task, such as giving an opinion when asked to analyse, or explaining without the judgement "assess" or "evaluate" requires.
3. Analyses, doesn't retell: interprets meaning rather than recounting the text.
4. Explains a technique's effect: names techniques with accurate metalanguage and shows how each shapes meaning.
5. Uses apt evidence: short, precise quotations or visual details that prove the point.
6. Links to the human experience: ties the analysis to the experience or emotion in the question.
7. Writes succinctly: no padding, repetition or drift, and not well past the suggested length. Never missed for being short.
Each skill has a short tip (in rubric.json) shown in "Things I need to know".

Retry and discussion (following spec 007's pattern):
- A full-mark first try goes straight to the discussion.
- Below full marks, the student may retry once or decline. The retry starts from the first try in the box, with one tip card per skill missed on the first try. The retry is marked on the same rubric and capped at one mark below full marks; there is no third try. The recorded mark is the higher of the first try and the capped retry, and the discussion explains the cap.
- The discussion shows the recorded mark, the skill verdicts marked "First try" or "Fixed in retry" (or missed), the student's final answer beside the model answer, the skills added to "Things I need to know", the first try collapsed, and a "This mark seems wrong" button.
- The model answer is never shown before the discussion (after the retry, or once the retry is declined), and never reaches the browser earlier.
- While an answer is being marked it stays on screen, locked, with status steps.

"Things I need to know": the unit's concepts are the seven skills. Only the first try counts, as in spec 007: a skill missed on the first try is added even if the student fixes it in the retry. A skill clears after 2 first tries that show it (clearAfter: 2).

Question order: each new quiz picks a question the student has not answered. The draw is weighted toward the text forms where the student's average mark (as a share of full marks) is lowest; text forms not yet tried get top weight until each has one answer. Missed skills steer too: questions tagged with a skill still in "Things I need to know" get extra weight. Each question carries 1–3 skill tags for this purpose (the marker still judges all seven skills on every answer).

When marking can't happen:
- Marker unavailable: the answer stays on screen, locked, while the app waits and retries; if marking still fails, the editable box returns holding the student's text and they can resubmit. No mark is invented and there is no self-marking path.
- Over LLM_DAILY_CAP: the student is told they have reached today's marking limit and to come back tomorrow; the answer stays in the box and Submit stays disabled until the next day.

Revision from real use (as in spec 007; the marker passed a tuning set at 23/24 and a frozen holdout set at 19/20, with middle-band answers occasionally marked one too high):
- Store, per attempt, the first-try and retry text, every skill verdict with the marker's one-line reason, the mark, and the prompt version that marked it.
- The "This mark seems wrong" button flags the answer for review. It never changes the mark, and an answer can be flagged once.
- Reviewed flagged answers become labelled test cases in resources/english-unseen/pilot-questions.json as a "field" set, and every prompt change reruns every case in that file, so fixing one answer cannot silently break another. The holdout set (Cheltenham Girls 2023, St George Girls 2025) stays frozen and the prompt is never tuned to it.
- Because students rarely flag a mark that is too generous: a periodic sample of real full-mark answers is re-marked offline by a stronger model, and disagreements become labelled test cases. Check middle-band answers marked one too high first.
- Reviewing flags and running the re-mark are offline teacher tasks (scripts); a teacher review page is not part of v1.

Content (the question bank):
- Source: the 37 school trial papers (15 schools, 2023–2026) in resources/y12_english_advanced_paper1_trial_exams/. Content is copied verbatim from school papers with each question's source quoted; no real HSC questions or texts, including ones reused in school papers, so real HSC papers stay unseen.
- For each paper: list every Section I question (number, marks, the texts it refers to, each text's form); keep only Questions 1–4 that refer to exactly one text; extract each kept text verbatim with its layout; crop visual texts to an image and write a description of what the marker needs (composition, colour, salient detail, any words in the image); record the source; use the school's marking guidelines and sample answers where they exist, otherwise draft band descriptors and a model answer flagged as new for review; tag text form, 1–3 skills and a syllabus outcome (EAV-12-01, -02 or -04).
- Skip and log questions whose text is illegible or missing, that reuse an HSC text, or whose visual detail a description can't carry. Known issues: Roseville 2026 is a scan (needs OCR); North Sydney Boys 2024 may be missing its stimulus booklet.
- Store each text once and point questions at it. Write the bank in the same format as the existing units under content/units/.
- Produce a review report (questions kept and skipped per paper, counts by text form and mark value, rubric source) for approval before content goes live.
- Marking criteria, marking notes, model answers and visual descriptions are answer-key material and stay server-only (constitution principle I).

Success criteria:
- A quiz shows one text and one question and can be answered with no time limit.
- Every answer gets a mark and feedback within 1 minute of submitting.
- Missed skills appear in "Things I need to know" and clear after 2 correct first tries.
- The bank holds every usable single-text question from Questions 1–4 of the 37 papers before 7 Dec 2026.
```

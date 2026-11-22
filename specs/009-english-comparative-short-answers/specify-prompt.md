# `/speckit-specify` prompt for spec 009

Paste everything inside the block below into your agent as one message. The first line makes Spec Kit
write `spec.md` into this folder instead of creating a new one.

```text
/speckit-specify SPECIFY_FEATURE_DIRECTORY=specs/009-english-comparative-short-answers

Advanced English Comparative Short Answers: a new unit (unit id y12-english-advanced-comparative-texts), the app's second English unit. It practises one kind of question: the Section I short answer in HSC English Advanced Paper 1, Texts and Human Experiences, that refers to two unseen texts. In school trial papers this is usually Question 5. It is spec 008 (specs/008-english-unseen-short-answers/) with one change: each question refers to two texts and asks the student to compare them. Everything spec 008 settled carries over unless this description says otherwise; read 008's spec.md, plan.md, research.md and data-model.md first and reuse its code, patterns and rules rather than restating them. Why: Peyton sits Year 12 Advanced English Task 1 on Mon 7 Dec 2026, whose Section I ends with this question, usually the highest-mark question in the section; the unit also serves the 2027 HSC.

The settled requirements are in the Claude doc "Spec 009: Advanced English multi-text short answers (Question 5)" (https://claude.ai/artifact/YZUmyBHmbYhabCn6S2DyMh). Spec 008's inventory of every Section I question is in resources/english-unseen/inventory/; its question bank sources are in resources/english-unseen/bank/; the trial papers are in resources/y12_english_advanced_paper1_trial_exams/. There is no design.md: reuse spec 008's quiz screen and put visual details in the plan, not the spec.

Terms: a text is one unseen stimulus text, as in spec 008. A question is one Section I question from a school trial paper that refers to two or more texts (every one found refers to exactly two). A fixed-pair question names both texts ("Compare how Text 4 and Text 5 ..."). A choice question lets the student choose: "Text 5 and ONE other text" or "any TWO of Texts 1 to 4". A quiz is one question. A skill is one of the nine tracked skills below.

Scope:
- In: every Section I question that refers to two or more texts, whatever its number (31 found: 21 are Question 5, 10 are Questions 1–4, e.g. Kambala 2025 Q2, Shore 2024 Q2, Sydney Girls 2024 Q1, Sydney Boys 2024 Q4); one question per quiz; typed answers; LLM marking; one capped retry; a model answer; "Things I need to know".
- Out: single-text questions (spec 008); full papers; reading time and timers; the Section II essay; photo answers.
- Separately, 6 papers have a Question 5 on a single text (Abbotsleigh 2023, Barker 2026, Caringbah 2024, James Ruse 2024, North Sydney Girls 2024 and 2025). Spec 008 skipped them as "not_q1_to_q4". They belong in spec 008's bank, not this unit: record this as a small amendment to spec 008's content rule (FR-040: keep every single-text Section I question, not only Questions 1–4), done as part of this feature's content step.

Each quiz shows:
- Every text the question refers to, each in its own tab labelled as on the paper ("Text 4 — Poem", "Text 5 — Image"), on every screen size (decided: tabs, never side by side). Each text keeps spec 008's display rules (heading, title, author, source line, poem and prose layout, footnotes, zoomable cropped image with a server-only description). On a choice question the tabs show the fixed text and every text the student may choose from.
- Below the tabs: the question, its mark value, its source, and the answer box with spec 008's word meter and suggested length. Switching tabs never moves or clears the answer box.
- Tab out: each text's tab has spec 008's open-in-a-new-tab icon beside its heading (008 FR-006). In this unit it opens ONLY that text in a new browser tab, never the pair, so the student can put each text in its own window. The text-only page and its access rule are spec 008's (sign-in required; a text shows only to a student with an attempt on a question that uses it; anything else is a 404; public fields only). Because the texts are shared with spec 008, that access check must count attempts in this unit too. On a choice question every allowed text can be tabbed out, picked or not.
- Highlighting: each text has spec 008's highlighter toggle (008 FR-006a) in the quiz and in its tabbed-out page, synced live between them. Highlights are kept per user, attempt and text, so the two texts of a question keep separate highlights and a text highlighted in a spec 008 quiz starts clean here. Browser-only (localStorage), nothing sent to the server; a new attempt or repeat starts with none; removed 30 days after the attempt is final; no highlighter on an image-only text.

Choosing a text (choice questions):
- Before writing, the student picks the text or texts the question lets them choose, from chips naming each allowed text, as they would in the exam. They can change the pick until they submit; Submit is disabled with a note until the pick is complete.
- The pick is stored with the attempt and the marker receives only the texts the student picked (or each picked visual's description). The retry keeps the first try's pick and cannot change it.

Submission rules: spec 008's, unchanged (no timer, reading-time lock or auto-submit; typed only; under 20 words Submit disabled; suggested length = every printed answer line at 12 words a line, warning up to 20% over, blocked beyond, median fallback when lines can't be counted).

Marking:
- As spec 008: one whole mark, a met/missed verdict with a one-line reason for every tracked skill, two or three sentences of feedback, one sentence naming the biggest gap below full marks or a "To go further" sentence at full marks; malformed replies retried; one capped retry; only the first try counts toward skills; model answer at the discussion only; criteria, notes, model answers and visual descriptions server-only (constitution Principle I).
- The marker receives the question, its directive verb and definition, every text the student wrote about, the school's criteria, the marking notes, the suggested length and word count, the model answer as an example of a full-mark answer, and the answer.
- Directive verbs: nearly always "compare"; Girraween 2025 asks which of two texts uses language "most effectively" (an evaluative comparison, read as NESA's "evaluate"). Add NESA's definition of "compare" ("Show how things are similar or different") to the prompt's verbs.
- On a choice question the model answer covers one pairing (the school's, or one generated pairing). The marker is told it is an example of the standard, not of the texts to use, and must never mark an answer down for choosing a different allowed text. The discussion says the model answer shows one possible pairing.
- The unit's prompt is its own file (based on spec 008's lib/unseen/rubric.json, with the two comparison skills added) with its own promptVersion, bumped on every change.
- Model: the same purpose as spec 008's marker, so it reuses ENGLISH_ADV_GRADING_MODEL (deepseek/deepseek-v4.1-flash), unless the marker check shows comparative answers need a stronger model; then it gets its own appropriately named env var.

Marker check (gate): the marker has not yet been piloted on comparative answers. Before any content goes live, a pilot script (as scripts/pilot-unseen-marker.py) marks answers at each mark band on a handful of fixed-pair and choice questions, across text forms, including answers that write about each text in turn with one comparing sentence at the end (they must miss "Compares the texts") and answers that treat one text far more deeply than the other (they must miss "Treats both texts in depth"). Pass bar as spec 008 (at least 90% of tuning answers and 80% of holdout answers in the labelled range, none more than 1 mark away). Holdout: St George Girls 2025 Q5 and Cheltenham Girls 2023 Q1, already reserved; never tuned to.

Skills (nine): spec 008's seven skills, with the same ids and tips, plus two comparison skills:
8. Compares the texts: draws out similarities and differences in how the texts shape the idea, linked by comparative language ("whereas", "similarly", "by contrast"). Missed when the answer writes about each text in turn and adds a comparing sentence only at the end.
9. Treats both texts in depth: gives each text the same depth of analysis, with apt evidence from both. Missed when one text is analysed closely and the other only mentioned.
Skill 1 ("Answers every part of the question") also covers using the texts the question requires (for example Text 5 plus one other). Each new skill has a short tip for "Things I need to know".

"Things I need to know": skills share progress with spec 008 (the same skill ids): a skill cleared in one unit is cleared in both, and a miss in either unit adds it. The two comparison skills are tracked only from this unit's first tries. Only the first try counts; a skill clears after 2 first tries that show it (clearAfter: 2).

Question order: each new quiz picks a question the student has not answered, weighted toward questions tagged with a skill still in "Things I need to know". Spec 008's text-form weighting is dropped, since every question mixes forms. Once every question is answered, questions repeat as in spec 008 (lower latest mark and older last answer first; never one from the last 3 quizzes, with 008's small-bank rule). A question left at the retry is offered again first.

When marking can't happen; revision from real use: spec 008's rules, unchanged (wait and resubmit; come back tomorrow at LLM_DAILY_CAP; on both tries; no self-marking; one daily-limit slot per marked try; no "This mark seems wrong" button; store both tries, every verdict with its reason, the mark, the prompt version, and here also the texts picked; offline re-mark of a sample from every mark band by a stronger model feeds a "field" test set; every prompt change reruns every case, reporting tuning, holdout and field separately).

Content (the question bank):
- Source: spec 008's inventory (resources/english-unseen/inventory/) and the 37 trial papers. Keep every Section I question that refers to two or more texts; record for each whether the student chooses, and which texts are allowed. The 4 papers not in the inventory (Fort St 2023 and 2025, Roseville 2026 (a scan, needs OCR), North Sydney Boys 2024 (may be missing its stimulus booklet)) are inventoried in this step.
- Texts are stored once and shared with spec 008's bank: point at 008's stored texts and extract only texts not already there, with 008's extraction, cropping, description and HSC-check rules.
- Rubric, source, exclusions, format and review report as spec 008 (school criteria and sample answers where they exist, otherwise drafted band descriptors and a generated model answer flagged for review; a generated model answer meets the schools' full-mark standard, not more: a clear comparative answer to the whole question with both texts treated in depth, about 35 words a mark). No real HSC question or text, so real HSC papers stay unseen.
- Tag each question with the forms of its texts, 1–3 skills and a syllabus outcome (EAV-12-01, -02 or -04).
- Produce a review report (kept and skipped per paper with reasons, counts by mark value and fixed-pair/choice, rubric source) for approval before content goes live.

Known numbers from the first scan: 31 multi-text questions; all refer to exactly 2 texts; 16 are choice questions, 15 fixed pairs; marks 3–8, most often 6; the texts are almost always the same texts as Questions 1–4 of the same paper.

Success criteria:
- A quiz shows one question with its texts in tabs, each text can be tabbed out alone and highlighted, and it can be answered with no time limit.
- On a choice question the student's pick is stored and only the picked texts reach the marker.
- At least 95% of answers show a mark and feedback within 1 minute of submitting.
- The marker passes the marker check on comparative answers before content goes live, including catching "one text, then the other" answers.
- Missed skills appear in "Things I need to know" and clear after 2 correct first tries, shared with spec 008.
- The bank holds every usable multi-text question from the 37 papers before 7 Dec 2026.
```

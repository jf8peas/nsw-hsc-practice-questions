# `/speckit-specify` prompt for spec 011

Paste everything inside the block below into your agent as one message. The first line makes Spec Kit
write `spec.md` into this folder instead of creating a new one.

```text
/speckit-specify SPECIFY_FEATURE_DIRECTORY=specs/011-english-essay-writing

English Essay Writing: a new unit (unit id y12-english-essay-writing) in which a Year 12 Advanced English student plans an essay as a light scaffold, optionally gets feedback on the plan, writes an 800-1,200 word essay on Michael Gow's Away answering an unseen Paper 1 Section II question (Common Module: Texts and Human Experiences), and gets it marked out of 20. It rehearses the real task end to end. It follows spec 010 (specs/010-economics-essay-writing/), which does the same for an Economics extended response: reuse spec 010's flow, screens, code and rules (unit page, one attempt in progress, discard, drafts, locked-while-marking screen, LLM failure handling, daily cap, redo with the latest mark counting, band 1 model essay, "Things I need to know" concept tracking) and spec 008's English conventions (specs/008-english-unseen-short-answers/) rather than restating them. What differs from spec 010 is listed below. Why: Peyton sits Advanced English Task 1 on Mon 7 Dec 2026 (timed written response, 20%: 10 minutes reading, then 90 minutes for Section I unseen texts and Section II, an unseen essay question on Away, about 45 minutes each; no separate planning time, no notes). The unit also serves the 2027 HSC (Paper 1 Section II). We are shipping as soon as possible.

The settled requirements are in the Claude doc "English Essay Unit — Requirements" (https://claude.ai/artifact/Q29BJdcSdAJtPLNZktzCeF). The marker has passed its pilot: the marking prompt is lib/english-essay/rubric.json (promptVersion eng-essay-pilot-5), the gap concept list is lib/english-essay/concepts.json, the pilot is scripts/pilot-english-essay-marker.py, and results and decisions are in resources/english-essay/pilot-notes.md. NESA's 2025 Paper 1 marking guideline and feedback are summarised in resources/english-essay/nesa/2025-paper1-section-ii.md. The play's text (OCR of the Currency Press edition) is resources/english-unseen/away-by-michael-gow.txt. There is no design.md: reuse spec 010's screens and put visual details in the plan, not the spec.

Terms: an essay is one essay question with its server-only content (marking notes, a band 1 model essay). An attempt is one try at an essay: a scaffold, an optional plan review, the essay text and its marking. A scaffold is the student's plan. A gap is a concept from the unit's fixed concept list that the marker finds wrong, missing or only named. The quote check is a code step (not the model) that compares every quotation in the essay with the play's text.

Scope:
- In: six essays (below); one attempt in progress at a time; the light scaffold; an optional plan review; the essay page with a hard 800-1,200 word limit; LLM marking out of 20 in the HSC Section II bands; the quote check; a band 1 model essay after marking; gaps in "Things I need to know"; redoing a finished essay.
- Out: Section I unseen texts (specs 008 and 009); prescribed texts other than Away; photo answers; a full timed Paper 1; a second try within an attempt.

The flow is spec 010's (unit page, scaffold page, "Get feedback on my plan" or "Start writing", essay page, result page), with these differences:

Scaffold (deliberately lighter and less prescriptive than spec 010's, because the real task has no planning time and English rewards a sustained argument over a fixed paragraph template):
- Fields: Thesis (one or two sentences answering this question and taking a position); Body paragraphs 1-3, each a one-line Claim (an idea about human experience, not a plot point or a technique) with an optional free-text Evidence notes box (quotes, scenes, techniques); no conclusion field. Placeholder prompts, not labelled sub-boxes.
- A total word counter with a hard cap of 150 words (about five minutes of planning): past 150 both buttons are disabled.
- The student cannot move on with the thesis empty. No other field is compulsory.
- The question is shown with its directive verb highlighted and defined, as in spec 010 (the questions use "to what extent", "discuss", "how" and "evaluate").

Plan review:
- Short, specific feedback read before writing; never writes sentences for the student; each fix is a question or prompt.
- One line on each of five checks, marked strength or fix: (1) the thesis answers this question in its own terms and takes a position (including "to what extent" where asked); (2) each claim is an idea about human experience, not a plot point or a technique; (3) the claims build the thesis rather than restate it; (4) the evidence ranges across the play and its forms (dialogue, stage directions, the play-within-a-play, staging and symbol); (5) the plan would fit 45 minutes and 800-1,200 words.
- No mark, not recorded in the result. Its own prompt file and promptVersion and its own model env var ENGLISH_ESSAY_REVIEW_MODEL (default openai/gpt-6.2-sol). The review prompt has not been piloted: draft it in the plan and check it on a few scaffolds before it goes live. If the reviewer cannot be reached, or the student is at LLM_DAILY_CAP, the student is told and offered "Start writing" without it.

Essay page: as spec 010, except the word range is 800-1,200 (the counter and the server both enforce it; spec 005's counting rule) and the optional timer is 45 minutes. Pasting is blocked.

Marking (as piloted; change the prompt only with a new promptVersion and a re-run of the pilot gate):
- Model env var ENGLISH_ESSAY_GRADING_MODEL (default openai/gpt-6.2-sol; DeepSeek v4.1 Flash and Claude Sonnet 5.5 were tried and were harsher than NESA's standard). Temperature 0, JSON reply, a malformed reply retried once.
- One holistic mark out of 20 in the five Section II bands (17-20, 13-16, 9-12, 5-8, 1-4), using the rubric's band descriptors, criteria and the per-question marking notes. The prompt also carries server-only notes on Away (rubric.json textNotes.away) so the marker can check the student's knowledge.
- Four criteria, each with a verdict (strong, sound, developing, weak) and a reason: argument (answers this question, sustained thesis), analysis (how form and language make meaning, effect explained, not recount), knowledge (accurate, well-chosen evidence), expression (cohesive, controlled).
- Question focus: the marker judges whether the essay fully, partly or barely answers this question; code caps the mark at 12 for "partly" and 10 for "barely", so a prepared essay is held to Band 3.
- Knowledge errors: the marker lists wrong speakers, names and events; code deducts 1 mark each (at most 2) and caps the mark at 16 at two or more. The marker is told not to lower its own verdicts for them.
- Quote check (code): every quotation of three or more words is matched against the play's text, tolerating punctuation and ellipses. A near miss is shown as "check this quote", with the play's exact words given, and costs nothing. A quotation that is not in the play at all is shown as "check this quote: not found in the play" and counts as a knowledge error. The pilot caught 4/4 planted errors with 0 false flags over 67 accurate quotes.
- Final mark order: clamp the marker's mark into its band, subtract the knowledge-error deduction, apply the cap at two errors, then the question-focus cap; never below 1.
- Standard: the marker may be slightly harsh but must never be generous (Chiang: no false sense of security). The pilot gate is one-sided and must keep passing.
- Store the scaffold, review (if any), essay, every criterion verdict and reason, question focus and its reason, knowledge errors, quote-check results, raw and final mark, band, gaps and both prompt versions.

Result page: as spec 010, plus a "question focus" line (shown when partly or barely, saying which part of the question the essay did not engage), the knowledge errors, and the quote check (each flagged quote, with the correct words where there is a near match). Then the band 1 model essay and the gaps.

"Things I need to know": as spec 010 (up to 5 gaps per essay, most important first, each clearing after 2 later essays use it correctly), from lib/english-essay/concepts.json: 11 Away concepts and 8 writing skills. The content step may extend the list.

The play's text: the server needs the play's text at runtime for the quote check, and it must never be sent to the browser (constitution Principle I). resources/ is gitignored, so the plan decides where a deployable server-only copy lives. The text is copyrighted: it must not be committed to a public repository.

Essays (six, verbatim from school trial papers, source shown to the student; Section II questions are generic, so they apply to Away as written):
1. Knox 2025 Trial, Q6: "Composers shape texts in memorable ways to illuminate the unique experiences of others. To what extent do you agree with this statement in relation to your prescribed text? In your response make close reference to your prescribed text."
2. Pymble 2024 Trial, Q6: "'Texts illuminate the anomalies in human behaviour and motivation, encouraging the audience to see the world differently.' To what extent does this statement align with your understanding of your prescribed text?"
3. Abbotsleigh 2025 Trial, Q6: "Discuss how the composer of your prescribed text makes connections between the audience and the complex lives of others within the play."
4. Fort Street 2023 Trial, Q6: "How does the representation of human experiences in your prescribed text invite you to reconsider your understanding of desire?"
5. Girraween 2025 Trial, Q6: "While experiences can be unique to individuals, emotions are universal; hence, making the representation of emotions more powerful. Evaluate this statement with detailed reference to your prescribed text."
6. Barker 2026 Trial, Q6: "Texts provide a critique of human nature, exposing audiences to the flaws and aspirations of our shared experience. Discuss this statement in relation to your prescribed text."
No real HSC question is used. Questions 1-4 also have pilot essays in resources/english-essay/pilot-away.json; those stay server-side calibration material and are never shown to students. "evaluate" and "discuss" are already in content/glossary.ts; "to what extent" and "how" are not NESA glossary terms, so the plan decides how they are highlighted and explained (e.g. "to what extent": make a judgement about how far the statement holds).

Content: Claude Code writes, for each essay, the marking notes and a band 1 model essay of 900-1,100 words on Away, with every quotation passing the quote check against the play's text; Chiang reviews each. Essays go live one at a time as each passes review; the flow and marker ship first.

Success criteria:
- A student can plan, optionally get plan feedback, write and submit an essay, and see the result, with the scaffold locked after planning.
- No essay outside 800-1,200 words is accepted, by the browser or the server; pasting into the essay box is blocked.
- At least 95% of essays show a mark and feedback within 2 minutes of submitting.
- The marker keeps passing the pilot gate (scripts/pilot-english-essay-marker.py) with the deployed prompt and model, including no essay marked above its range.
- Every band 1 model essay passes the quote check with no flags.
- Gaps appear in "Things I need to know" only from the concept list and clear after 2 correct uses.
- The flow and marker are live with at least essays 1, 2 and 3 before Mon 7 Dec 2026.
```

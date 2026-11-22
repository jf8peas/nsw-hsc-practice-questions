# `/speckit-specify` prompt for spec 010

Paste everything inside the block below into your agent as one message. The first line makes Spec Kit
write `spec.md` into this folder instead of creating a new one.

```text
/speckit-specify SPECIFY_FEATURE_DIRECTORY=specs/010-economics-essay-writing

Economics Essay Writing: a new unit (unit id y12-economics-essay-writing) in which a Year 12 student plans a whole extended response as a scaffold, optionally gets feedback on the plan, writes the full 600–800 word essay, and gets it marked out of 20 against the school's AT1 marking criteria. It rehearses the real task end to end. It follows spec 007 (specs/007-economics-paragraph-writing/), which drills one paragraph part at a time; this unit is the whole essay. Reuse the code, patterns and rules of specs 005 and 007 (word counter, directive-verb glossary, drafts, locked-while-marking screen, LLM failure handling, concept tracking for "Things I need to know", one essay in progress at a time) rather than restating them. Why: Peyton sits Year 12 Economics Assessment Task 1 on Tue 1 Dec 2026 (in-class extended response, 20%: 5 minutes planning with a handwritten one-page guide sheet, then 50 minutes writing an unseen question on the Global Economy case study, aiming for 600–800 words). His economies are China (emerging) and Nepal (developing). The unit also serves the 2027 HSC (Section IV extended response). We are shipping as soon as possible.

The settled requirements are in the Claude doc "Economics Essay Unit — Requirements" (https://claude.ai/artifact/RxbGZgTNDGXWy9gKVk47yf). The AT1 notification (marking criteria and bands) is summarised there. The school trial papers are in resources/y12_economics_trial_exams/; their text extracts are in .cline/trials/. The draft marking prompt is lib/essay/rubric.json and the marker pilot is scripts/pilot-essay-marker.py with labelled essays in resources/topic011/pilot-essays.json. There is no design.md: reuse spec 007's quiz screen styling and put visual details in the plan, not the spec.

Terms: an essay is one essay question with its server-only content (marking notes, school criteria where they exist, a band 1 model essay, the concepts a strong answer uses). An attempt is one try at an essay: a scaffold, an optional plan review, the essay text and its marking. A scaffold is the student's structured plan. A gap is a concept from the unit's fixed concept list that the marker finds wrong, missing or only named.

Scope:
- In: six essays (below); one attempt in progress at a time; the scaffold form; an optional plan review; the essay page with a hard 600–800 word limit; LLM marking out of 20 in the AT1 bands; a band 1 model essay after marking; knowledge gaps in "Things I need to know"; redoing a finished essay.
- Out: photo answers; stimulus (Section III) essays; full exams; the paragraph unit's part-by-part correction loop; a second try within an attempt.

The flow (four screens, one choice):
1. Unit page: lists the six essays with the latest mark on each, "Redo" on finished ones and "Resume" on the one in progress. Essays are offered in alternating order by economy: 1 (China), 3 (Nepal), 5 (both), 2 (China), 4 (Nepal), 6 (both).
2. Scaffold page: the essay question with its directive verb highlighted and defined (as spec 007), the economy the student must write about, and the scaffold form.
3. The student picks one of two buttons: "Get feedback on my plan" (sends the scaffold for review, then opens the essay page with the review) or "Start writing" (opens the essay page with no review). Once the student moves on, the scaffold is locked and cannot be edited.
4. Essay page: top to bottom, the question (verb highlighted and defined); "Your plan" (the scaffold, read-only, collapsible, open by default); "Feedback on your plan" (only if a review was chosen; collapsible); the essay text box with a live word counter; an optional 50-minute timer; "Submit essay".
5. Result page: mark out of 20 and band; a verdict and one feedback line for each of five criteria; two "to lift your mark" points; any "check this figure" flags; the essay with the plan beside it; the band 1 model essay; the gaps added to "Things I need to know".

Scaffold:
- Short text fields, notes and dot points welcome: Introduction (judgement in one sentence answering the question; key terms to define; the economy or economies and their status); Body paragraphs 1–3, each with Point (topic sentence), Theory or model (e.g. AD/AS, Lorenz curve, PPF, Harrod-Domar), Data and indicators with year, Evaluation (limitation or counterpoint), Link back to the judgement (the same five parts as spec 007); Conclusion (restated judgement; the reason that weighs most).
- A total word counter with a hard cap of 250 words (roughly one handwritten A4 side): past 250 both buttons are disabled.
- No single field is compulsory, but the student cannot move on with the judgement empty or all three body points empty.
- The scaffold autosaves as a draft (as existing drafts do).

Plan review:
- Short, specific feedback the student reads before writing. It never writes sentences or paragraphs for the student; it points at what is missing or weak, with each fix written as a question or prompt ("Which indicator shows inequality rose after the reforms?").
- One line on each of seven checks, marked as a strength or a fix: (1) answers the question (judgement responds to the directive verb and covers the economy or economies the question requires); (2) strategies or globalisation influences are in scope (since 1980, by government or external bodies such as the IMF, World Bank, WTO, donors); (3) coverage of the top band (growth, development, environmental sustainability, income equality); (4) data (each body point has an indicator with a year; a figure that looks wrong is flagged "check this figure", never corrected with a number); (5) models (at least one, fitting its point); (6) evaluation (each point has a limitation or counterpoint, weighed in the conclusion); (7) fit (the plan would fill 600–800 words).
- No mark; it does not count towards the essay mark, and the result does not record whether the plan was reviewed.
- Its own prompt file and promptVersion, and its own model env var (ESSAY_REVIEW_MODEL). If the reviewer cannot be reached, or the student is at LLM_DAILY_CAP, the student is told and offered "Start writing" without it.

Essay page and word limits:
- Submit is enabled only at 600–800 words. The counter reads e.g. "412 / 600–800 words — 188 more to go" (disabled), "712 / 600–800 words" (ready), "836 / 800 — cut 36 words" (over, disabled).
- Words are counted with spec 005's rule (lib/wordcount.ts), one rule for the counter and the server; the server re-checks and refuses an essay outside 600–800.
- Pasting into the essay box is blocked, as in the in-class task.
- The optional 50-minute timer is started by the student, is not enforced, and submission stays open when it runs out.
- The essay autosaves as a draft. While marking runs, the essay stays on screen, locked, with timed status steps; a marking failure returns the editable box with the text intact (spec 007's LLM failure handling and constitution Principle VI). At LLM_DAILY_CAP the student is told to come back tomorrow, with scaffold and essay kept as drafts.

Marking:
- One holistic mark out of 20, placed in the AT1 notification's five bands: 17–20, 13–16, 9–12, 5–8, 1–4 (descriptors in lib/essay/rubric.json). The marker judges each criterion, picks the band whose descriptor fits best, then a mark inside it; a mark outside its own band is clamped into the band.
- Five criteria, each with a verdict (strong, sound, developing, weak) and a reason: understanding of strategies; terms, concepts and theory; assessment of effectiveness (a judgement answering the directive verb, sustained to the conclusion); data and indicators (contemporary, with years, used as evidence); logical, cohesive response (staying on the chosen economies, not Australia).
- Question-specific criteria: each essay carries its own marking notes; trial questions also carry the school's own marking criteria from the solutions.
- Two-economy questions: if the essay does not treat both economies, the mark is capped at 12 (band 3), applied in code from the marker's coversRequiredEconomies verdict.
- Data accuracy: a figure the marker judges clearly wrong is flagged "check this figure" with the student's words quoted; the marker never states a replacement figure.
- One try per attempt, matching the in-class task. A finished essay can be redone as a new attempt; the latest mark counts.
- The band 1 model essay is shown on the result page only; marking notes, school criteria and model essays are server-only (constitution Principle I).
- Its own prompt file (lib/essay/rubric.json, promptVersion bumped on every change) and its own model env var ESSAY_GRADING_MODEL (default deepseek/deepseek-v4.1-flash unless the pilot shows otherwise). Malformed replies are retried once, as in the app.
- Store the scaffold, the review (if any), the essay, every criterion verdict and reason, the band, the raw and final mark, flags, gaps and the prompt version.

Marker check (gate): the pilot script exists but has not been run yet. Before content goes live, the marker must place labelled essays in their expected range (median within the labelled range for at least 6 of the 7 pilot essays, none more than one band away), apply the one-economy cap, flag the planted wrong figures, and list gaps only from the concept list. Results go in resources/topic011/. As with spec 007, stop tuning on written test essays once real student essays arrive and revise from real use.

"Things I need to know":
- After marking, the gaps go to "Things I need to know" as tracked concepts: up to 5 per essay, most important first, each one bullet naming the concept and what was missing ("China's WTO accession (2001): named but no effect on exports or FDI shown").
- Gaps come only from a fixed concept list (in lib/essay/rubric.json): China (open-door policy and SEZs; WTO accession and export-led growth; FDI and the Belt and Road; SOE reform; infrastructure-led investment and debt; hukou and migration; environmental policy and emissions; inequality and poverty reduction; rebalancing and "dual circulation"), Nepal (1990s liberalisation; WTO accession and trade with India and China; remittances and labour migration; tourism; hydropower; aid, IMF and World Bank programs; LDC graduation; instability and the 2015 earthquake; poverty, HDI and human capital), and shared skills (growth vs development; globalisation channels; environment trade-offs; inequality measures; external bodies; using models; sustaining a judgement; using data as evidence). The content step checks and extends this list.
- Writing-skill gaps reuse spec 007's tips where they match.
- A gap clears after 2 later essays use it correctly (as spec 007).

Essays (six; each tagged with the economy the student writes about):
1. China — Barker 2024 Trial, Q27 (verbatim): "With reference to an economy other than Australia, explain the role that globalisation has played in their economic growth and development."
2. China — new: "Assess the effectiveness of the strategies used by an emerging economy you have studied to balance economic growth with environmental sustainability and income equality."
3. Nepal — Sydney Boys 2020 Trial, Q27 (verbatim): "Evaluate the impacts of globalisation on the growth and development of an economy other than Australia."
4. Nepal — Abbotsleigh 2025 Trial, Q28 (verbatim): "Explain the impact of globalisation in achieving economic growth and development on an economy other than Australia."
5. Both — new: "Evaluate the effectiveness of the strategies used to promote economic growth and development in one emerging and one developing economy you have studied."
6. Both — new: "Assess the extent to which integration into the global economy has improved living standards in one emerging and one developing economy you have studied."
Trial questions show their source to the student. All 24 trial papers were searched on 22 Nov 2026: only these three essays are on an economy other than Australia alone; none asks the student to evaluate strategies or covers two economies other than Australia, so three are new. No real HSC question is used, so real HSC papers stay unseen. Add "explain" to content/glossary.ts with NESA's definition ("Relate cause and effect; make the relationships between things evident; provide why and/or how"). None of these repeats spec 007's six essays.

Content: Claude writes the prompts, Qwen researches and drafts the marking notes, band 1 model essays (600–800 words, contemporary data with years and sources, checked figures) and concept tags; Claude reviews each stage. Essays go live one at a time as each passes review; the flow and marker ship first.

Success criteria:
- A student can plan, optionally get plan feedback, write and submit an essay, and see the result, with the scaffold locked after planning.
- No essay outside 600–800 words is accepted, by the browser or the server; pasting into the essay box is blocked.
- At least 95% of essays show a mark and feedback within 2 minutes of submitting.
- The marker passes the marker check before content goes live, including the one-economy cap and the wrong-figure flags.
- Gaps appear in "Things I need to know" only from the concept list and clear after 2 correct uses.
- The flow and marker are live with at least essays 1, 3 and 5 before Tue 1 Dec 2026.
```

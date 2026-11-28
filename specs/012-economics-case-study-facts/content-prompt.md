# Content task prompt for spec 012 (the 48 questions, Release 1)

Paste everything inside the block below into Claude Code once. It can start straight away and run beside the code
tasks: it writes only the unit folder and two files in this spec folder, and the code tasks write everything else.
If `npm run case-facts:check` does not exist yet when it reaches step 6, it finishes the rest and tells you; run
step 6 again once it does.

```text
Spec 012 content task, RELEASE 1. Write the 48 questions of the unit y12-economics-case-study-facts ("Case Study Facts: China and Nepal", HSC Economics Topic 1) with their keys, wrong-option explanations and concept tags, from one fact file. A student sits an exam on Tuesday 1 December 2026 and will learn whatever these questions say, so a wrong figure is worse than a missing question. It must be written and fact-checked by Sunday night, 29 November.

Read first, in this order: docs/y12-economics-case-study-facts-research.md (the fact file: the ONLY source of facts, including its "Context and impact" section, one impact line per fact ID), specs/012-economics-case-study-facts/spec.md (FR-001 to FR-022, FR-032 and the edge cases), data-model.md (all of it), research.md (§0 findings B to D, §6, §8, §11), and the pattern unit content/units/y12-economics-global-economy/ (meta.ts, build.ts, concepts.ts, concept-tags.ts, questions.ts, answers.ts, explanations.ts) with content/explanation-helpers.ts and content/concept-helpers.ts.

You may create or change ONLY:
- content/units/y12-economics-case-study-facts/ (meta.ts, build.ts, concepts.ts, concept-tags.ts, questions.ts, answers.ts, explanations.ts)
- specs/012-economics-case-study-facts/fact-check.md and marker-cases.json
Another session is changing lib/, scripts/, tests/, content/index.ts, content/answers/index.ts and README.md: do not touch them. TypeScript may complain about factIds in answers.ts until that session adds the field to lib/types.ts.

Steps:
1. Skeleton: meta.ts exactly as data-model.md §2; concepts.ts from §3; build.ts copied from the global economy unit with this unit's id, two-digit ids (m01, s01), a group parameter, no diagrams, and the source constant "Original question — case study facts (checked Nov 2026)" (the dash is an em dash).
2. Questions (questions.ts): the 48 slots in data-model.md §4, in order, m01–m18 then s01–s30. Keep each slot's facts and subject unless the question cannot be written well; if you move a fact, keep every ★ fact tested, every fact group covered, no fact in more than 3 questions, and the slots marked † unchanged.
3. Keys (answers.ts) in the shapes of data-model.md §5, each with factIds.
4. Wrong-option explanations (explanations.ts): one for every wrong option of every multiple-choice question.
5. Concept tags (concept-tags.ts): exactly one per question, as in §4.
6. Write marker-cases.json from data-model.md §7, adjusting an answer only if a question's final wording needs it.
7. Write fact-check.md in the format of data-model.md §6, by checking each question against the fact file row by row. For each short answer record the impact line(s) its significance point uses, or "own significance" with the fact-file support for it. Then run npm run case-facts:check and fix everything it reports as an error or UNTRACED; explain each warning you leave.
8. Second pass, as a hostile checker: reread all 48 against the fact file as if someone else wrote them. For each: can two options be defended? does the prompt hand over a figure or year that it or another question marks? is the country and direction right? would a student with the right facts be marked down by these notes, or a student with wrong ones marked up? does each significance point match its fact's impact line, or is it supported by the file? did any answer, option, explanation or note take a number, name, quantity or trend from an impact line? Fix, and rerun step 7.
9. Stop and report: the count by pool; any slot you changed and why; every rounding you allowed; every figure, date or name you changed or could not trace (or "none"); the multiple-choice questions that test significance; every short answer with its own significance instead of the impact line; the shared-fact and prompt warnings; your three least confident questions; and the path to fact-check.md. Leave everything uncommitted.

Facts (these override anything you know):
- Every figure, date, name and source number in a prompt, option, model answer, rubric, note or explanation comes from the fact file, quoted as written there; rounding is allowed. Nothing from memory, the web or resources/. A question that needs a fact the file lacks is dropped and replaced, never completed from elsewhere.
- Significance: a fact's impact line (under "## Context and impact", keyed by its ID) is the APPROVED statement of what that fact shows. Use it. A statement of significance may also use the file's definitions and theory. It introduces no new figure, date, name or source, and claims no cause the file does not support.
- Take NOTHING quotable from an impact line: no figure, date, name or source, and no quantity, ranking or trend it states in words (for example "forty-fold", "doubled in seven years", "roughly halved", "narrowed slightly", "largest emitter", "upper-middle-income", "fast growth"). Use its point and leave those words out. If a line and a fact row seem to differ, the row governs. Study advice inside a line ("Pair it with …", "Use it for …", "Quote it on its own …") is not the significance point.
- Do not claim more certainty than the file does for secondary and government figures (NBS Gini, Nepal's 1995-96 poverty rate, targeted poverty alleviation figures, which are Chinese government figures against China's national line).
- Never put China's NBS Gini (about 0.47) and the World Bank Gini (36.0) on one scale. Never call the 4,120 MW all hydro. Each economy keeps its own period (Gini 1990–2022 and 1995–2022).
- C14 has no calendar year: its period is "over 40 years"; do not work out a start or end year. C25 has no source number: write "secondary source". C06 is "over 9% a year" since 1978.
- Quote units exactly: bn, million, tonnes, MW, GWh, yuan, Rs and NRs are not interchangeable.

Prompts:
- All original: nothing copied or adapted from a school trial or HSC paper, including the practice exams.
- Say clearly which economy, which measure (e.g. "World Bank Gini coefficient"), and whether you want ONE year or a CHANGE ("giving both values and both years").
- Never state in a prompt a figure or year that the question gives a mark for. "How did X change between 1990 and 2022" is wrong: it hands over the period mark.
- Short answers ask the student to recall the fact with its figure or date and year AND say what it shows for growth, development, inequality or the environment; the sa-both pool asks for a comparison, or the sentence the fact would support in an essay argument.
- Where one fact is in both a multiple-choice and a short-answer question, avoid showing in the multiple choice the figure and year the short answer asks the student to recall.
- Plain Australian English, short sentences, no trick wording.

Multiple choice:
- Four options, exactly one correct, similar length and form (the correct one not the longest by habit).
- Distractors are real confusions: Belt and Road as a rural program; Made in China 2025 dated 2025; NBS Gini compared with World Bank Gini; Nepal's LDC graduation as 2026; the 4,120 MW as all hydro; China's and Nepal's figures swapped; the right figure with the wrong year; the right event in the wrong direction. Wrong values and years must appear somewhere in the fact file.
- At least 4 of the 16 test significance rather than recall (for example "Which statement best explains what this shows?"). The correct option paraphrases the fact's impact line; the distractors are a wrong direction, the other economy's impact, or a common error, and none of them can be defended. Choose facts no short answer tests, so that a quiz cannot hand a short answer its significance point: for example m03, m07, m15 and m16. Their facts and slots stay as in data-model.md §4.
- Each explanation states the correct fact in words, with its figure and year, says why this choice is wrong, and ends "(Source S8)" using a source number of one of the question's facts. It may add the fact's impact line before the source. No fact IDs in any text a student sees.
- rubric is one sentence: the correct fact and its source.

Short-answer keys:
- 3 marks: rubric points "Figure: …", "Period: …", "What it shows: …". 2 marks (date-only facts s05, s24; s08 is 3 marks: both pledge targets, the year of the pledge, what it shows): the event with its correct year, then "What it shows: …".
- Base the "What it shows" point and the model answer's significance sentence on the impact line(s) of the question's fact(s), in words a student would write, not necessarily verbatim. Only where a line does not fit what the question asks, use another significance the fact file supports, and record it as "own significance" in step 7. In the sa-both pool you may combine the two economies' lines into a comparison (for example, inequality rose in China, where coastal, urban and skilled workers gained most, but fell in Nepal, where remittances reach ordinary households).
- The figure point of a change question needs both values; the period point both years. A comparison needs both economies for the figure point and both periods for the period point.
- Model answer: 2 to 4 sentences a strong Year 12 student could write, with the full date where the file has one.
- notes are shown to the STUDENT under the model answer and are also the marker's guidance. Write plain sentences to the student, no fact IDs, no talk of "the marker". Each says: which rounding is accepted (name it, e.g. "about a third"); the year or financial year needed, and that a day or month is never needed; for a change, that one end alone earns neither of the first two marks; that the other country's figure or the opposite direction earns nothing for that part; that only this figure (or the listed rounding) earns the figure mark, even if the student has seen another figure from a real source; that the last mark is for the expected point (say what it is) or another point the case study supports (name one where you can); that saying the figure again does not earn it; and that a point with the wrong direction (for example, saying China's inequality fell) does not either. Accept "over 9%" for the growth average where it applies.
- The marker also accepts "accurate recent real-world data" by default, so the "only this figure" sentence must be in every set of notes.

Worked examples (use them, adjusting only if you can improve them):
s01 prompt: "State how China's World Bank Gini coefficient has changed since China's integration into the global economy, giving both values and both years, and explain what this shows about how the gains have been shared."
modelAnswer: "China's World Bank Gini coefficient rose from 32.2 in 1990 to 36.0 in 2022. Growth was uneven, with coastal, urban and skilled workers gaining most, so income became more unequally shared."
rubric: ["Figure: the World Bank Gini rose from 32.2 to 36.0 (both values).", "Period: from 1990 to 2022 (both years).", "What it shows: growth was uneven (coastal, urban and skilled workers gained most), so income inequality increased."]
notes: "Give both values for the first mark and both years for the second: one end on its own earns neither. Rounding to about 32 and 36 is fine. A fall instead of a rise, Nepal's figures, or the official Chinese Gini of about 0.47 (a different measure) earn no figure mark. Only these World Bank values count, even if you have seen others. For the last mark, say what the rise shows: growth was uneven, with coastal, urban and skilled workers gaining most, so inequality increased. Another point the case study supports, such as the Lorenz curve moving away from the line of equality, also earns it. Saying inequality fell, or only saying the numbers again, does not."
m02 prompt: "Which statement about Made in China 2025 is correct?"
correct: "Issued in 2015 to upgrade to high-tech manufacturing, with 2025 as the target year"
a wrong option: "Issued in 2025 to upgrade to high-tech manufacturing"
its explanation: "Made in China 2025 was issued on 8 May 2015; 2025 is the target year, not the year it began (Source S5)."

Rules: use .cline/ for scratch scripts (tmp-<purpose>.<ext>) and delete them at the end; use Git Bash for every shell command; no new dependency; do not run npm run validate:shipped (ids are recorded only after the maintainer's read).
```

After it stops, read `fact-check.md`, then follow `quickstart.md` §2 and §3 on Monday.

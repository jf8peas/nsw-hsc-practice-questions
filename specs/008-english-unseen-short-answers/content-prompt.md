# Content task prompt for spec 008 (the 37-paper research, R-001 to R-008)

Paste everything inside the block below into Claude Code, once per batch (change the batch number).

```text
Spec 008 content task, BATCH 1. Build more questions for the unseen-text unit (y12-english-advanced-unseen-texts) from the school trial papers in resources/y12_english_advanced_paper1_trial_exams/. Read first: specs/008-english-unseen-short-answers/spec.md (FR-039 to FR-046, User Story 6), research.md R2 and R3 (the inventory and bank JSON formats, the generator, the report, the median fallback, the image rules), .specify/memory/constitution.md Principle V (the school-paper exception, no HSC material, cropped visual stimuli), CLAUDE.md (Git Bash, .cline/ scratch), and the two existing bank files resources/english-unseen/bank/fort-st-2023.json and fort-st-2025.json as worked examples of the format.

Batches (process only the current batch, then stop for my review):
- Batch 1: Fort St 2024, Fort St 2026, Barker 2026, Danebank 2026, James Ruse 2026, Kambala 2026, North Sydney Girls 2026, Abbotsleigh 2025, Knox 2025, Sydney Grammar 2025.
- Batch 2: the other 2025 papers and all 2024 papers, except North Sydney Boys 2024.
- Batch 3: the 2023 papers, Roseville 2026 (a scan: OCR), North Sydney Boys 2024 (only 8 pages: check whether the stimulus booklet is missing).
- Never: Cheltenham Girls 2023 and St George Girls 2025. They are the marker's frozen holdout set. Write their inventory files with every question skipped for reason "reserved_holdout" (add that reason to the fixed list in the report script and research.md R2), and never put them in the bank.

For each paper in the batch:
1. Inventory (R-001). Read the whole PDF, looking at the pages themselves, not only extracted text. List every Section I question: number, marks, the texts it refers to and each text's form. Keep only Questions 1–4 that refer to exactly one text; a question with parts on the same text is one entry. Write resources/english-unseen/inventory/<school>-<year>.json with every question kept or skipped and a reason from the fixed list.
2. Texts (R-002). Copy each kept text verbatim with its layout: poem lines and stanza breaks and any line numbers, prose paragraphs, glossary footnotes, title, author and source line, and the heading as printed ("Text 2 – Poem"). Extract with a PDF text tool, then check every text line by line against the page image and fix hyphenation, dropped words, smart quotes and footnote markers. Visual texts: crop the image from a high-resolution render of the page, save it as content/units/y12-english-advanced-unseen-texts/images/<textId>.webp, and write the marker's description as in R3 (composition, colour, salient detail, any words in the image), detailed enough to check claims about it. A visual whose meaning depends on detail a description can't carry is skipped with "visual_not_describable".
3. HSC check. A text or question taken from a real HSC paper must never ship. Check each kept text's author and title against the Section I texts of the NESA HSC English Advanced and Standard Paper 1 papers 2019 to 2025. Build that list once in resources/english-unseen/hsc-texts.json, with sources, and reuse it for later batches. Set hscChecked only after the check; a match is skipped with "hsc_text".
4. Source (R-003): school, year, exam type (trial or half-yearly) and question number.
5. Suggested length: count the printed answer lines for the question, main space plus the "If you need additional space" lines, as answerLines. Use null when the lines can't be counted (for example, drawn lines), and the generator then uses the median.
6. Rubric (R-004). Where the paper includes marking guidelines, copy the criteria verbatim (origin "school") and use the school's sample answer as the model answer (origin "school"). Otherwise draft NESA-style band descriptors for each mark (origin "drafted", reviewed false), shaped like the school criteria in the existing bank files, and write a model answer (origin "generated", reviewed false). A generated model answer must match the schools' full-mark standard, not exceed it: a clear interpretive answer to the whole question, 2 or 3 techniques with their effects, short exact quotations from the text, about 35 words a mark. Draft 6 to 10 marking notes (features a student could discuss) where the school gives none.
7. Tags (R-005): text form, 1 to 3 of the seven skills that the question most tests, and the syllabus outcome (EAV-12-01, EAV-12-02 or EAV-12-04).

Then:
8. Write resources/english-unseen/bank/<school>-<year>.json for each paper and run npm run unseen-build-bank.
9. Check every generated model answer with the real marker: mark each one with the unit's marker (ENGLISH_ADV_GRADING_MODEL, the lib/unseen marker, 3 runs). Every model answer must get full marks on the majority of runs. Revise any that don't and list them in the report. Then run npm run check-unseen-descriptions for any new visual texts; a visual that fails is removed from the bank, not shown.
10. Run npm run validate-content, npm test and npm run build through Git Bash, then npm run unseen-report.
11. Stop and give me: the number of questions kept and skipped by paper, with the skip reasons; counts by text form and mark value; every drafted rubric and generated model answer with a line saying whether the marker gave it full marks; any text you were unsure about; and the path to resources/english-unseen/review/report.md. Do not mark anything reviewed: I approve the report.

Rules: everything copied from the papers stays verbatim and credited; the original PDFs and the bank JSON stay in gitignored resources/; only the generated unit files and the cropped images are committed. Use .cline/ for scratch scripts and delete them at the end. Python libraries for PDF rendering, OCR or image cropping may be installed for this offline task, but no new runtime dependency is added to the app (Principle VIII).
```

After you approve a batch, mark its drafted rubrics and model answers as reviewed (or ask Claude Code to,
naming the ones you approved), rerun `npm run unseen-build-bank`, and deploy. Then paste the prompt again
with `BATCH 2`, then `BATCH 3`.

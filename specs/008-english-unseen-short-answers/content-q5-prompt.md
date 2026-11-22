# Spec 008 content task: the six single-text Question 5s

Spec 009 FR-034 amended spec 008's FR-040 to keep every single-text Section I question, not only Questions 1–4, and Batch 0 relabelled these six Question 5s `kept` in their inventories. This task adds them to spec 008's unseen-texts unit (`y12-english-advanced-unseen-texts`), one question per paper, appended to the paper's existing bank file in `resources/english-unseen/bank/<paper>.json`.

For an agent running through OpenRouter. Do all six in one task (each is one new text and one question), then stop for review.

## Read first (and nothing else unless a step fails)

1. `CLAUDE.md` (Git Bash with the full path for every shell command; scratch files only in `.cline/` as `tmp-<purpose>.<ext>`).
2. `specs/008-english-unseen-short-answers/content-prompt.md`: its per-paper steps are the procedure. This file wins where they differ.
3. The existing bank file of each paper below, as the worked example of the format (texts stored once; questions point at a text id).
4. From `specs/009-english-comparative-short-answers/content-batch1-prompt.md`, only the section "Rules learnt from the pilot review".

## Already settled by Claude: do not recount or redo

You cannot view page images. **Do not run any line-counting, pixel or image-inspection script.** None of these texts is a visual, and none of these papers includes marking guidelines or sample answers, so every question gets drafted criteria (origin "drafted") and a drafted model answer (origin "drafted").

| Paper | Question id | Marks | Verb | Text (new; id) | Question wording (copy exactly from the paper) | answerLines (words) |
|---|---|---|---|---|---|---|
| Abbotsleigh 2023 | `ab23-q5` | 6 | discuss | Text 5 – Persuasive extract, Julia Gillard (`ab23-t5`) | "Discuss how Julia Gillard makes connections with the reader and wider world by using both reflective and persuasive devices to represent the courageousness of women." | 37 (444) |
| Barker 2026 | `bk26-q5` | 4 | how | Text 6 — Nonfiction Extract, Goldsworthy (`bk26-t6`) | "How does Goldsworthy explore technology's impact on human relationships?" (curly apostrophe as printed) | 20 (240) |
| Caringbah 2024 | `cb24-q5` | 5 | evaluate | Text 5 – Memoir extract (`cb24-t5`) | the quoted statement line, then "Evaluate how this notion is represented in Text 5." | 36 (432) |
| James Ruse 2024 | `jr24-q5` | 6 | how | Text 5 (`jr24-t5`), Valgardson | "How does Valgardson use contrast to illuminate how human qualities and emotions are shaped by an individual's experiences?" | 41 (492) |
| North Sydney Girls 2024 | `nsg24-q5` | 5 | evaluate | Text 5 – Memoir extract, Skinner (`nsg24-t5`) | "Evaluate how Skinner offers insights into how to live a purposeful life." | 49 (588) |
| North Sydney Girls 2025 | `nsg25-q5` | 5 | evaluate | Text 6 – Prose fiction extract, Nguyen (`nsg25-t6`) | "Evaluate how Nguyen humanises the unwanted." | 49 (588) |

Set `paper.qNo` to 5 (the 008 validator already accepts 1 to 5). Tag each question as spec 008 does (text form, 1–3 of the seven skills, syllabus outcome).

## Rules (each was a real error in spec 009's batches)

- **Verbatim means matching the paper character for character.** Copy each text exactly as the paper prints it: curly quotes where it prints curly, straight where it prints straight; em dash, en dash, spaced hyphen or "--" exactly as printed; "…" or "..." as printed; every paragraph break; for a poem every line and stanza break. Never "restore" or "normalise" punctuation in either direction. Check by diffing your text's tokens against `pdftotext` output of the page, and fix every token that differs.
- Footnotes as "word: definition", no inline markers.
- **HSC check** every new text's author and title against `resources/english-unseen/hsc-texts.json` (extend it with a `q5Checks` section, with sources). A match is skipped with `hsc_text`.
- **Drafted criteria:** one band per mark restating the question's own wording, in the shape of the existing drafted criteria in the same bank files.
- **Drafted model answer:** meets, not exceeds, the schools' full-mark standard for single-text answers: answers the whole question, 2–3 techniques with their effects, short exact quotations, about 35 words a mark. It must not share any 60-character run with the question wording. Check every quotation against the text by script after normalising quotes and dashes.
- **Marking notes:** 6–10 features a student could discuss (as in the existing drafted entries).

## Finish

1. Append each text and question to its paper's bank file, then `npm run unseen-build-bank`.
2. Model-answer check: mark each model answer 3 times with spec 008's marker (`scripts/pilot-unseen-marker.py`, default `--unit unseen`) through a `.cline` data file and `--set field --runs 3`, as in the spec 009 batches. Every model answer needs full marks on the majority of runs. Report the marks and the completion/reasoning token line.
3. Run validate, tsc, test and build with timeout-and-log commands (log names without a trailing semicolon). The paragraph-unit and essay tests may already fail for reasons outside this task: list them, don't edit them.
4. Add an "Unseen, Question 5 additions" section to `resources/english-unseen/review/ALL-REVIEW.md` (per question: source, marks, verb, answer lines, criteria and model answer with its marker result, new text id, any uncertainty) with one empty `[ ]` box each.
5. Stop. Do not set `reviewedOn`, commit or push. Never run the same command more than twice; write "UNCERTAIN: …" in the review section and move on.

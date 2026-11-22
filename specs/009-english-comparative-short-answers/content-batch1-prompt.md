# Spec 009 content task, Batch 1 (the multi-text Question 5s), in three sub-batches

For an agent running through OpenRouter. Paste the short message at the bottom; this file is the full instruction.

## Sub-batches (do ONE, then stop for review)

| Sub-batch | Papers (Question 5 each) | Why grouped |
|---|---|---|
| **1a** | Fort St 2026, Sydney Grammar 2025, Danebank 2026, Pymble 2025, Fort St 2023, Fort St 2025, Roseville 2026 | Texts already in the store or already checked; Fort St have school guidelines |
| **1b** | Abbotsleigh 2024, Abbotsleigh 2025, Ascham 2023, Barker 2023, Cherrybrook Tech 2023, Cherrybrook Tech 2024, Fort St 2024 | |
| **1c** | Girraween 2025, Knox 2025, North Sydney Girls 2026, Pymble 2024, St George Girls 2024, Sydney Boys 2025, Sydney Grammar 2024 | |

Never: St George Girls 2025 Q5 (frozen holdout), Cheltenham Girls 2023 (holdout), North Sydney Boys 2024 (no stimulus booklet). Never edit `resources/english-unseen/pilot-comparative.json`, the holdout labels file, `lib/comparative/rubric.json` or any golden file.

## Read first

1. `CLAUDE.md` (all shell commands through Git Bash with the full path; scratch files only in `.cline/` as `tmp-<purpose>.<ext>`).
2. `specs/009-english-comparative-short-answers/content-prompt.md`: steps 1–12 there are the procedure. This file adds to it and wins where they differ.
3. `specs/009-english-comparative-short-answers/data-model.md` §1 and §9 (the bank file format), `research.md` R2 and R12.
4. The inventory file of each paper in `resources/english-unseen/inventory/`, and `resources/english-unseen/bank/` to find texts already stored.

## Rules learnt from the pilot review (each was a real error)

- **Verbatim means character-exact.** Keep curly quotes and apostrophes (“ ” ‘ ’), en dashes (–) and em dashes (—) exactly as printed; never replace them with straight quotes or a different dash. Keep every stanza break (a blank line) and every line break of a poem as printed. pdftotext loses these: compare each text with a rendered image of the page (`pdftoppm -r 100 -png`) line by line, not only with extracted text.
- **Footnotes** as "word: definition", no inline markers.
- **Answer lines:** count ruled lines too, not only dotted ones (solid drawn lines do not appear in pdftotext; count them on the page image or with a row-scan of the rendered page). Count the main space plus the "additional space" lines. Use `answerLines: null` only when lines truly cannot be counted, and say why.
- **Visual descriptions** describe only what is visible: composition, position (say "the viewer's left/right"), colour, focus, gesture, objects, any words, the printed caption and credit verbatim. No interpretation ("lit with wonder", "symbolises", "lonely"); the marker must not be handed a reading. Name tools and objects exactly (a pencil is not a brush). Leave out descriptors of people that the question does not need.
- **Criteria:** where the paper has marking guidelines, copy the criteria verbatim (origin "school"), repairing only page-wrap breaks, and note each repair. Otherwise draft one band per mark that restates the question's own wording (origin "drafted").
- **Model answer:** the school's sample where one exists (origin "school"). Otherwise write one (origin "drafted"): a clear comparative answer to the whole question, both texts in depth, about 35–40 words a mark, 2–3 techniques with their effects, short exact quotations. It must not open by restating the question word for word, and must not share any 60-character run with the question (the app's echo guard compares replies against the model answer). On a choice question set `pairing` to the texts it uses.
- **Quotations** in model answers must match the text exactly; check every one by script after normalising quotes and dashes.
- **Directive verbs:** "compare" is in the prompt. Fort St 2025 Q5 is "Analyse … and compare"; Girraween 2025 Q5 asks which text is "most effectively" (treat as "evaluate"). List any verb not in `lib/comparative/rubric.json`'s `directiveVerbs`; do not edit the rubric.

## Paper-specific notes

- **Fort St 2026, Sydney Grammar 2025, Danebank 2026, Pymble 2025** are the marker pilot's tuning questions. Copy their texts, criteria, counted suggested length and the `-model` answer (as the model answer, origin "drafted", with its `pairing` for the two choice questions) from `pilot-comparative.json` into the bank file; do not redraft them. Danebank Q5 is 41 lines (492 words) and Pymble Q5 is 42 lines (504 words); Danebank Text 5, and Pymble Text 5's description, were corrected in review and are the versions to use.
- **Fort St 2023 Q5** (5 marks): choice of TWO of Texts 1–4. The paper includes marking guidelines and a sample: use them.
- **Fort St 2025 Q5** (6 marks): Text 5 (graphic novel extract, a visual: crop it and describe it) fixed, plus ONE of Texts 1–4. Uses school guidelines and sample if present. The question also says students may reuse their earlier evidence; keep that sentence in the question text.
- **Roseville 2026 Q5** (5 marks): Text 4 fixed, plus ONE of Texts 1–3. All four texts are Danebank 2026's: point at the stored ids, extract nothing. The paper is a scan: copy the question wording from the OCR and check it against the page image.
- **Cherrybrook Tech 2023:** "the prose fiction extract and ONE other text" = the prose text fixed, pick 1. **Pymble 2024:** choose two of Texts 2, 3 and 4 only (Text 1 is not allowed). **Abbotsleigh 2024, Sydney Grammar 2024:** Text 5 fixed, pick 1 of Texts 1–4.

## For each sub-batch, finish with

1. Bank files in `resources/english-unseen/bank/comparative/<school>-<year>.json`, then `npm run unseen-build-bank`.
2. The model-answer check (content-prompt step 10): every model answer marked 3 times with the real marker (`ENGLISH_ADV_GRADING_MODEL`, the comparative prompt), using the texts of its own pairing; full marks on the majority of runs. Report any that fail and revise them.
3. `npm run validate`, `npx tsc --noEmit`, `npm test`, `npm run build`, `npm run unseen-report` (all via Git Bash).
4. A "Comparative, Batch 1x" section in `resources/english-unseen/review/ALL-REVIEW.md`: per question, the source, marks, fixed pair or choice with allowed texts, criteria origin, the model answer and its marker result, counted answer lines, every new text id, every visual description in full, every repair or uncertainty. One empty `[ ]` box per question.
5. Stop. Do not set `reviewedOn`, commit or push. Delete your `.cline/tmp-*` files if you can; list them if you cannot.

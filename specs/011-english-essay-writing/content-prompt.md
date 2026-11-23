# Content task: English Essay Writing (spec 011)

**Owner**: Claude Code (not Qwen). **Reviewer**: Chiang. **Priority**: essays **1, 2 and 3 first**, then 4–6. This is a content task, not an engine implementation task. Do not change routes, components, schema, the approved marker prompt or `live` flags. The engineering plan supplies the format and checks below.

## Read first

- `specs/011-english-essay-writing/spec.md` and `specify-prompt.md` (the six questions are verbatim and must not be edited).
- `lib/english-essay/rubric.json` (`eng-essay-pilot-5`) and the unit's `content/units/y12-english-essay-writing/concepts.ts`.
- `resources/english-essay/pilot-away.json` for the marking-notes style, and `resources/english-essay/pilot-notes.md` for calibration decisions.
- `resources/english-essay/nesa/2025-paper1-section-ii.md` for the Section II standard and marker feedback.
- The local, gitignored play copy `resources/english-unseen/away-by-michael-gow.txt` for accurate analysis and quotation.
- `specs/011-english-essay-writing/data-model.md` and `contracts/quote-check.md` for the exact input shape and validation rule.

The play, pilot essays and NESA calibration essays are reference material only. Never copy them into committed content, tests, fixtures or browser-facing files. Never use a real HSC question. Do not treat the pilot essays as model essays or as content to release.

## Deliverable per essay

Write one gitignored file `resources/english-essay/content/eN.json` for each assigned essay (`e1`–`e6`):

```json
{
  "markingNotes": "<server-only notes in the style described below>",
  "modelEssay": "<an original band 1 essay of 900–1,100 words on Away>",
  "conceptTags": ["away-…", "skill-…"]
}
```

`conceptTags` are keys from the unit's one concept record, not full ids and not invented concepts. The builder turns them into full ids. Public `conceptIds` in `questions.ts` are separate skill-only practice tags and are not edited by this task.

### Marking notes

Match the useful style of `pilot-away.json`, not its wording:

- Begin with what a strong answer does **in response to this exact question and directive**. Name the question terms that must be engaged throughout, including any judgement required by "to what extent" or "evaluate".
- Identify a defensible thesis territory, not a single compulsory answer. Other valid interpretations must earn equal credit.
- List the dramatic methods and evidence a strong answer could select: structure, the Shakespeare frame, dramatic irony, dialogue, stage directions, staging, the play-within-a-play, symbol and relevant scenes across the play.
- Name the characters, relationships, contradictions and human experiences most relevant to the question, with accurate events and speakers.
- Distinguish analysis from plot recount and technique listing. Explain what the marker should reward when effect is linked to the question.
- Include common prepared-essay failures: ignoring a qualifier, answering another theme, relying on one scene or one form of evidence, misattributing lines, and inventing quotations.
- Keep the notes indicative, not a checklist of required paragraphs or facts. Do not paste the model essay, pilot essays or long play excerpts into the notes.

### Band 1 model essay

- **900–1,100 words** using the app's whitespace `countWords` rule. This is deliberately within the student's 800–1,200 range.
- Original writing on **Away**, answering the public question verbatim and taking a clear, sustainable position. It must not copy a pilot essay, NESA essay or another model.
- Band 1 standard: perceptive interpretation, sustained personal line of argument, well-chosen evidence from across the play, analysis of dramatic form and language with effect explained, cohesive controlled expression. Write as a strong 45-minute response, not a published academic article.
- Use accurate speakers, names, events and chronology. Every quotation must be exact after the deterministic punctuation/ellipsis/slash rules. **Near matches and not-found quotations are both release blockers**, even when the meaning looks right.
- Integrate quotations rather than collecting them. Cover more than one scene, character or dramatic form where the question requires range. Do not pad to reach the word count.
- Choose concept tags that the essay actually demonstrates. Do not tag merely because a concept is mentioned.

## Process

Work on essays **1, 2 and 3 first**, one at a time. Essays 4–6 follow the same process in S2.

1. **Draft** the notes, model and tags for one essay. Do not start the next until the current one has been checked.
2. **Run the local checks** through Git Bash from the repo root:

   ```bash
   npm run english-essay-check-models       # word counts and every quote flag; non-zero on any flag
   npm run english-essay-build-answers -- --dry-run
   npm run validate
   ```

   `check-models` prints each quotation that is near or not found and the exact near-match correction. Correct the essay and rerun until there are **zero flags**. Do not silence a flag by deleting a quotation that is needed for the argument; fix its wording or choose accurate evidence.
3. **Self-review against the question** and record a short report in `resources/english-essay/review/eN-review.md`: thesis/directive coverage, analysis versus recount, evidence range, factual accuracy, word count, quote-check result, concept tags, and confirmation that no pilot/NESA text was reused.
4. **Chiang reviews each essay**. Address every comment and rerun the checks. Chiang records approval only in `resources/english-essay/review/approved.json`, for example `["e1", "e2"]`. An essay is not approved merely because Claude Code finished it.
5. After engineering confirms the shipping marker gate and reference-text load, run:

   ```bash
   npm run english-essay-build-answers
   npm run validate
   npx tsc --noEmit
   npm test
   npm run build
   ```

   Only then may the engineer set that essay's `live: true`, one at a time, and run `npm run validate:shipped` to record new ids. Do not set `live` yourself.

## Concept-list changes

The 11 Away concepts and eight writing skills should be sufficient for most essays. If a genuinely new tracked concept is needed, propose it in the review report with its new key and one-line public description. Do not rename an existing id. The engineering team must approve the addition, move it into `concepts.ts`, change `promptVersion`, regenerate the golden/hash and rerun the full marker gate before the essay can go live. Never add an id only in a content JSON file.

## Review checklist for Chiang

- [ ] Public question and source are unchanged from `specify-prompt.md`; no real HSC question is used.
- [ ] Notes answer this question, distinguish valid approaches and identify prepared-essay traps without becoming a compulsory checklist.
- [ ] Model is original, on Away, band 1 in standard and 900–1,100 words.
- [ ] Thesis and every body paragraph engage the question's own terms and directive.
- [ ] Evidence ranges appropriately across the play and dramatic forms; analysis explains effect rather than retelling or listing techniques.
- [ ] Speakers, names, events and chronology are accurate.
- [ ] `english-essay-check-models` reports zero near/not-found flags; `npm run validate` passes.
- [ ] Every concept tag is on the unit list and demonstrated by the essay.
- [ ] No pilot essay, NESA essay, full play text or other calibration material is copied into deliverables or committed files.
- [ ] Approval is recorded in `approved.json` only after all checks and comments are resolved.

## Release order

Complete and approve **e1, e2 and e3** before starting e4–e6. S1 does not wait for the second batch. Each essay goes live independently after its own approval and the shared marker/reference gates; a problem with one essay never blocks the others or causes an unreviewed essay to be released.

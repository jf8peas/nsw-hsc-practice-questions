# Quickstart: validating spec 012

All commands run in Git Bash from the repo root. §1 to §4 happen **before** release, §5 on the deployed app.

## 1. Content checks

```bash
npm run case-facts:check     # rules + number tracing; rewrites the script block in fact-check.md
```

Expected: no errors, no `UNTRACED`; every warning has a line in `fact-check.md` explaining it.

## 2. Release 1 marker sample (Monday morning, about 10 minutes)

Needs `OPENROUTER_API_KEY` (environment, `.env.local` or `.env`). Set `GRADING_MODEL` to the **production** value from
Vercel; unset means `deepseek/deepseek-chat`. The unit must be registered.

```bash
npm run case-facts:marker-check
```

Expected: the model name, then 9 cases × 3 runs, all matching the expected marks in `data-model.md` §7, exit code 0.
On a failure: fix the question's notes (and similar ones), rerun, and read the changed notes in §3.

## 3. Your read-through (FR-032; allow about 3 hours)

Open `fact-check.md` (changes and untraced items first), the fact file, and the unit's `questions.ts`, `answers.ts`
and `explanations.ts`. For each of the 40, then tick its box:

1. **Prompt**: clear which country, which measure, one year or a change? Does it give away a figure or year that it,
   or another question, marks?
2. **Answer**: right, and for multiple choice is only one option defensible?
3. **Figures**: each matches its fact row, including unit (bn or million), year and financial year.
4. **Direction and country**: rose/fell correct; China's and Nepal's figures not crossed.
5. **Distractors and explanations**: each wrong for the stated reason; the two Gini measures never on one scale;
   4,120 MW never called all hydro.
6. **Mark points and notes**: one per mark; the tolerance is what you want; the notes read sensibly to a student.
7. **Significance**: the significance point of each short answer matches its fact's impact line (or the fact-check
   report justifies its own); no figure, date, name, cause, quantity or trend that the fact rows do not give (an
   impact line is not data); no over-certainty on secondary or government figures. At least 4 multiple-choice
   questions test significance.

Judgement to confirm: a financial-year fact asks for the financial year; a single calendar year is not listed as
accepted.

After fixes: rerun §1, rerun §2 if any short answer or note changed, then record the ids (only now, because shipped
ids can never be reused):

```bash
npm run validate:shipped
```

## 4. Full check chain, then release

```bash
npm run validate && npx tsc --noEmit && npm run lint && npm test && npm run build
```

Expected: all pass; validation reports 15 units. Changes stay uncommitted for you. When you commit, include
`docs/y12-economics-case-study-facts-research.md` (the validator reads it on Vercel), `specs/012-…`, the unit folder
and `content/shipped-ids.json`. No migration and no new environment variable.

If the Preview environment is set up, push a branch first and do §5 there before merging; otherwise deploy and do §5
straight away. Rollback: revert the commit; saved results stay in the database.

## 5. Phone check (390 px, as a fresh student)

Use a real phone and a Google account that has never used the unit.

1. **Home**: "Case Study Facts: China and Nepal" is first under Year 12 with the NEW pill, and no "to review" pill.
2. **Unit page**: the description (Show more) says 2 multiple-choice and 3 short answers, original, checked November
   2026, revise before the 2027 HSC. "Start quiz" is reachable without scrolling past reference material. The
   three-rule guide is lower down. No "Things I need to know" or "Concepts to review". No sideways scrolling.
3. **Attempt 1**: five questions in order: China MC, Nepal MC, China short, Nepal short, both. Each shows
   `Source: Original question — case study facts (checked Nov 2026)`.
4. **MC**: pick a wrong option on one: it is marked wrong, the right one is shown, "Why this is wrong" gives the fact
   and a source number.
5. **Short answer, typed**: type a correct figure and year with no significance: you lose the last mark; model answer,
   mark points and notes appear and read sensibly.
6. **Short answer, photo**: write another on paper, photograph it, check the transcription, submit: it is marked.
7. **Finish**, then back on the unit page: still no revision list; home still shows no "to review" pill.
8. **Seven more attempts** (short throwaway answers are fine; 24 of the 40 daily AI marks in all). Confirm no
   question repeats, in the Neon SQL editor:

```sql
select count(*) as answered, count(distinct r.question_id) as different
from results r join users u on u.id = r.user_id
where u.email = '<test account email>' and r.unit_id = 'y12-economics-case-study-facts';
```

Expected: `40 | 40`.

9. **A ninth attempt** starts and repeats the questions from attempt 1 (answered longest ago).

Short of time: steps 1 to 6 on the phone are the release check; the automated route tests cover steps 8 and 9.

## 6. Release 2 (after Tue 1 Dec)

1. `npm run case-facts:check` with the 40 concept notes written; your read of the notes.
2. `npm run case-facts:marker-check` on the full case file (every short answer).
3. Full chain.
4. On the phone: a student with Release 1 results sees "Things I need to know" with the concepts missed then, each
   with its note; a student with no misses sees nothing to review; three full-mark answers on a concept clear it;
   quizzes keep the five-slot shape and favour missed concepts; no summaries or pictures appear, and
   `/admin/concepts` does not list this unit.
5. View source of the unit page as a student with no misses: no note text is in it.

# Cursor prompt — finish the Advanced Mechanics unit

You are working in the `nsw-hsc-practice-questions` repo (Next.js 15, App Router, TypeScript).

Read `CLAUDE.md`, `README.md` and `.specify/memory/constitution.md` first — the constitution
overrides other docs. Principles III (Content Is Code), IV (Validation Gates the Build) and
V (Syllabus Fidelity and Original Content) apply to everything below.

## Context

The unit `y12-physics-advanced-mechanics` (NSW HSC Physics Module 5, 2017 syllabus) has a
**complete, verified question bank**: 180 multiple-choice (`m001`–`m180`) and 180 short-answer
(`s001`–`s180`), split gravitation 90/90, projectiles 54/54, circular motion 36/36. Questions and
answer keys live in `content/units/y12-physics-advanced-mechanics/`:

```
meta.ts                  questions.ts / answers.ts        (barrels)
questions-gravitation.ts  answers-gravitation.ts
questions-projectiles.ts  answers-projectiles.ts
questions-circular.ts     answers-circular.ts
diagram.ts                (every figure is redrawn as inline SVG)
build.ts                  (mc() / sa() helpers; ids are fixed and never renumbered)
```

Each question is copied word for word from a NSW school trial or half-yearly paper and shows its
source. The transcription record is in `resources/topic006/` (`04-selection.tsv`,
`05-id-map.tsv`, `06-transcription-log.md`).

**Do not change any question or answer text, and do not renumber ids.** The four tasks below are
purely additive.

## Task 1 — Concepts (so the unit can be `conceptsReady`)

Model on `content/units/y11-physics-preliminary/{concepts.ts,concept-tags.ts}`.

1. Create `concepts.ts` exporting `concepts` (use `defineConcepts` from
   `content/concept-helpers.ts`) and `retired: Record<string, string | null> = {}`.
   - Ids are `y12-physics-advanced-mechanics.c-<slug>`. Once shipped, a slug is **never renamed or
     reused** — `content/shipped-ids.json` records concept ids and the validator fails if one
     disappears.
   - Descriptions are one line each, in the house style of the preliminary unit.
   - Group them with comments: `// --- Motion in gravitational fields ---`,
     `// --- Projectile motion ---`, `// --- Circular motion ---`.
   - Aim for roughly 25–35 concepts across the three areas — fine-grained enough to be useful for
     relearning, coarse enough that each has several questions.
2. Create `concept-tags.ts` exporting `conceptOfQuestionId: Record<string, string>`, built from a
   `TAGS: Record<string, string[]>` map keyed by slug.
   **This unit's ids are three digits**, so entries look like `["m001", "m047", "s112"]`, not
   `"m01"`.
3. Wire it up:
   - In `questions.ts`, tag the questions (`.map((q) => ({ ...q, concept: conceptOfQuestionId[q.id] }))`,
     or apply it in each of the three question files — whichever keeps the barrel simplest).
   - In `content/index.ts`, add `concepts` and `retired` to the advanced-mechanics entry (it
     currently has neither).
   - Set `conceptsReady: true` in `meta.ts`.

**Every one of the 360 questions must be tagged exactly once.** A double tag throws at load; a
missing tag fails `npm run validate`.

## Task 2 — Wrong-option explanations (so the unit can be `explanationsComplete`)

Model on `content/units/y11-physics-preliminary/explanations.ts`.

1. **First fix a helper bug.** `content/explanation-helpers.ts` builds question ids with
   `pad2` (two digits), which is wrong for this unit's three-digit ids. Extend
   `withWrongExplanations` so the id width works for both units (e.g. an explicit `pad` option, or
   derive the width from the unit's questions) **without breaking `y11-physics-preliminary`**.
2. Create `explanations.ts` exporting an `ExplanationTable`, and wrap the key in `answers.ts`:
   `export const answers = withWrongExplanations(keyWithoutExplanations, questions, U, explanations)`.
3. Write an explanation for **every wrong option of all 180 MC questions** (3 each, 540 total).
   - Each entry is `[the START of the wrong option's text, the explanation]`. The helper resolves
     it to the full option text and throws if it matches no option, more than one, or the correct
     one. Keep the start string just long enough to be unique.
   - One or two sentences, naming the specific error a student would have made (a wrong formula, a
     dropped factor, a confused direction), not a restatement of the right answer.
   - Short-answer questions must not have `wrongExplanations` — the validator rejects that.
4. Set `explanationsComplete: true` in `meta.ts`.

This is the long task. **Work in batches of about 20 questions and run `npm run validate` after
each batch** rather than writing all 540 before the first check. The existing `rubric` line in each
MC answer explains why the correct option is correct — use it, and the question's source paper, to
pin down what each distractor is testing.

## Task 3 — Research doc

Create `docs/y12-physics-advanced-mechanics-research.md`. It is already referenced from
`questions.ts`, but does not exist yet. Model it on `docs/y11-physics-preliminary-research.md`.

Cover: what the unit is and how an attempt is drawn (5 MC + 4 SA, weighted like the HSC); the
sources (the 2017 NESA Physics syllabus Module 5, plus `resources/y12_physics_trial_exams/` and
`resources/y12_physics_interim_exams/`); the approach (verbatim school questions with the source
shown, **no HSC questions**, so past HSC papers stay unseen — Sydney Boys half-yearly and Sydney
Boys 2020 trial papers were excluded at the owner's request); how the bank was selected and
weighted; the pipeline files in `resources/topic006/`; and the diagram policy (every figure
redrawn in code in `diagram.ts`, photographs dropped or replaced by schematics).

`resources/topic006/06-transcription-log.md` records every question that was replaced and why, and
the handful of **errata found in schools' own marking guides** (e.g. Sydney Boys 2019 Q22 prints
`sin 15` where its own answer uses `tan 15`). Summarise that in the doc rather than repeating it
question by question.

## Task 4 — README units table

Add a row for `y12-physics-advanced-mechanics` to the units table in `README.md` (the table that
currently ends with `y11-economics-essay-scaffold`, around line 296). Match the style of the
neighbouring rows: what the unit covers, the bank size and split, that questions are verbatim from
school papers with sources shown and no HSC questions, the per-unit `diagram.ts`, and the draw
(5 MC + 4 SA). Link `docs/y12-physics-advanced-mechanics-research.md`.

## Checks

After each task, and before you finish:

```bash
npx tsc --noEmit -p .
npm run validate      # must stay green; it is the build gate
npx next lint
npm test
```

Once the concepts are final, run `npm run validate:shipped` once to record the new concept ids in
`content/shipped-ids.json`.

Do not commit or push unless I ask.

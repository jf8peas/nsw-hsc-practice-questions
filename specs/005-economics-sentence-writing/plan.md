# Implementation Plan: Economics Sentence Writing

**Branch**: `005-economics-sentence-writing` | **Date**: 2026-11-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-economics-sentence-writing/spec.md`

## Summary

A new Year 12 Economics unit type, "Writing Practice" (`y12-economics-sentence-writing`, Topic 1:
The Global Economy, 2009 syllabus), that teaches students to rewrite plain-English sentences as one
concise sentence in functional economics language. Each attempt draws 5 rewrite questions. A
question has two phases: phase 1 is graded out of 3 (meaning and cause-effect kept; every target
term used correctly, all or nothing; concise within 25 words), a 3/3 answer goes straight to the
discussion, and a sub-3 answer gets a hinted retry (phase 2) capped at 2 marks, then the
discussion. The recorded mark is the best of the two. Each target term is a concept of the unit;
per-term outcomes from phase 1 feed the existing "Concepts to review" and weighted-draw machinery.
The answer key (model sentences, target terms with definitions/equivalents/misuses) stays
server-only: nothing reaches the browser before a phase 1 grade, then only the hint, then the
discussion. The approach (research.md): a new `"rewrite"` question type with a public `concepts:
string[]` tag; a new `rewrite_phases` table for resumable phase state; a `concept_outcomes` column
on results for per-term concept tracking; a new `gradeRewrite` LLM call whose reply is limited to
the judgements code cannot compute (marks, the all-or-nothing rule, the cap and the best-of rule
stay in code); an extended self-mark token for per-term ticks on the degrade path; and a
constitution amendment (2.11.0 → 2.12.0) permitting the scoped hint release and the phase row.

Terminology: the spec's canonical term for the LLM service is "AI marker"; "grader" in research.md
and tasks.md refers to the same service or its `grade*` code functions (`gradeShortAnswer`,
`gradeRewrite`, `gradeRewriteAnswer`).

## Technical Context

**Language/Version**: TypeScript, Next.js 15 (App Router, React 19), Node 24 (dev), as the repo.

**Primary Dependencies**: No new runtime dependency (Principle VIII). Reuses `next`, `react`,
`react-dom`, `katex`, Upstash, Neon Postgres, Auth.js, and the existing OpenRouter call wrapper.

**Storage**: Neon Postgres (AWS ap-southeast-2). One new table `rewrite_phases` and one new
nullable `jsonb` column `results.concept_outcomes` (data-model.md). One new Drizzle migration.

**Testing**: Vitest (existing suite plus new rewrite tests), the existing PGlite route tests, and
`scripts/fake-openrouter.ts` extended with a `FAKE_REWRITE` mode. `npm run validate`, `npm run lint`,
`npx tsc --noEmit`, `npm test`, `npm run build` all pass.

**Target Platform**: Mobile-first web (phones at 390 px, no sideways scrolling); desktop browsers.

**Project Type**: Web application (Next.js App Router), server-rendered pages + JSON API routes.

**Performance Goals**: A 5-question Writing Practice attempt completes in under 10 minutes on a
phone (SC-001); each grading call within the existing 20 s OpenRouter timeout; the unit page and
quiz page render without waiting on the model.

**Constraints**: Constitution 2.11.0 (amended to 2.12.0 by this feature): answer key server-only
except the scoped hint/discussion; minimal personal data (phase rows deleted with the student);
content is code; validation gates the build; grading degrades gracefully; daily AI allowance and
rate limits apply (at most 2 grading calls per question, 10 per attempt); no new runtime
dependency; mobile-first.

**Scale/Scope**: ~60 original questions, 31 tracked terms, 5 questions per attempt, ~12 attempts
before repeats. One new unit; existing units and flows unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Check the plan against `.specify/memory/constitution.md` (read the current version first). One row
per principle; mark each ✅, ⚠ (justified in Complexity Tracking) or n/a:

| Principle | Status | Notes |
|---|---|---|
| I. Answer key never reaches the browser | ⚠ | Amended to 2.12.0: the sentence-writing unit may send the missed/misused target terms with their one-line definitions after phase 1 is graded below 3 (the hint), and the model sentences and full target-term set with definitions at the discussion or self-mark screen — never before, including on reload or resume. Everything else unchanged: the client sends only the fields Principle I allows; the server verifies attempt ownership and every token; model sentences are never stored per result. |
| II. Signed-in students, minimal personal data | ⚠ | Amended to 2.12.0: per writing-practice question in an attempt, the phase 1 and phase 2 sentences, their marks, the per-term outcomes and the feedback shown are stored in a phase row (deleted with the student, like results). Every route needs a session; Australian region; 2-year retention; delete path unchanged. |
| III. Content is code | ✅ | New unit is typed TS files registered in both registries; question ids `y12-economics-sentence-writing.r<n>` never renumbered; removing a question keeps its results and records a tombstone (now `string \| string[] \| null`). |
| IV. Validation gates the build | ✅ | `npm run validate` extended: every rewrite question has a model sentence and 1-3 target terms each with a definition; every target term is a concept of the unit; every concept appears in at least 4 questions; `concepts` entries are valid concept ids. |
| V. Syllabus fidelity, original content | ✅ | Bank covers HSC Topic 1 of the 2009 syllabus only; all ~60 questions original (no source line); no HSC questions; no diagrams. |
| VI. Grading fair, explainable, graceful | ✅ | LLM failure, daily cap and a database outage all fall back to per-criterion self-marking with the model sentence and every term's definition shown, no phase 2; phase 2 call failure keeps the best-of rule; empty submissions blocked; a skipped phase 2 keeps the phase 1 mark. |
| VII. Cost and abuse controls | ✅ | At most 2 grading calls per question (10 per attempt) against the existing daily AI allowance; per-user and per-IP rate limits; the phase table's unique key and the atomic slot reservation stop double-spend; secrets stay server-only; production fails closed. |
| VIII. Simplicity | ✅ | No new dependency; reuses the quiz runner, drafts, self-mark flow, weighted draw and grader wrapper; one new table and one new column. |
| IX. Teacher access server-side | ✅ | No new teacher routes; every results/phase query is scoped to the session user's id. |

**Quality gates** (constitution "Quality Gates"): `npm run build`, `npm run lint` and `npm test`
pass; no answer-key leakage into client bundles (the public registry never imports the new key
fields; the hint/discussion are sent only at the allowed stages); every new route requires a
session; every results query is scoped to the session user; no personal-data fields beyond
Principle II's list (the phase row is added to that list by the amendment); no renumbered question
ids; the LLM path enforces the daily cap; authorization and cost-control logic ships with automated
tests (the rewrite tests in the spec's Testing section).

### Amendment (first task)

Amend `.specify/memory/constitution.md` from **2.11.0 → 2.12.0** (MINOR: materially expanded
guidance in Principles I and II):

- **Principle I**, add after the existing bullets:
  > - [DECISION] The sentence-writing unit (spec 005) MAY send part of the answer key to the
  >   browser at defined moments, and only then: after phase 1 is graded below 3 marks, the missed
  >   or misused target terms with their one-line definitions (the hint); and at the discussion or
  >   self-mark screen, the model sentences and the full target-term set with definitions. Nothing
  >   from the key MAY reach the browser before phase 1 is graded (or has fallen back to
  >   self-marking), including on reload or resume.
- **Principle II**, extend the per-result list:
  > - per writing-practice question in an attempt: the phase 1 and phase 2 sentences, their marks,
  >   the per-term outcomes from phase 1, and the feedback shown, stored in a phase row until the
  >   question is final and kept for the attempt detail page; deleted with the student like results.
- Update the version, the Last Amended date, the amendment log, and the Sync Impact Report.

## Project Structure

### Documentation (this feature)

```text
specs/005-economics-sentence-writing/
├── plan.md              # This file
├── spec.md              # Feature specification (final, incl. 2026-11-02 clarifications)
├── research.md          # Phase 0: the 12 design decisions
├── data-model.md        # Phase 1: schema, content types, phase state, term outcomes
├── quickstart.md        # Phase 1: manual validation guide
├── contracts/
│   └── api.md           # Phase 1: phase 1/2 grade, resume, self-mark contracts
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
content/
├── units/y12-economics-sentence-writing/
│   ├── meta.ts              # NEW: type "Writing Practice", quiz groups [{rewrite, 5}], guide
│   ├── questions.ts         # NEW: ~60 RewriteQuestion (plain-English prompts, concepts[])
│   ├── answers.ts           # NEW: modelSentences, targetTerms, markingNotes (server-only)
│   ├── concepts.ts          # NEW: 31 tracked terms as concepts + retired
│   └── concept-tags.ts      # NEW: question -> concepts[] map
├── index.ts                 # register the unit; add conceptsOfQuestion()
└── answers/index.ts         # register the unit's answer set (server-only)

lib/
├── types.ts                 # "rewrite" type, concepts?: string[], RewriteTargetTerm, Answer fields, retired union
├── wordcount.ts             # NEW: shared countWords() (client + server, FR-043)
├── grading.ts               # RewriteGradeResult / hint / discussion shapes
├── grading.server.ts        # gradeRewriteAnswer(): word count, criteria, cap, best-of, hint selection
├── openrouter.server.ts     # gradeRewrite(): new prompt + reply parse (retry once)
├── tokens.server.ts         # self-mark token carries term concept ids
├── db/schema.ts             # rewrite_phases table + results.concept_outcomes
├── db/queries/results.server.ts   # select concept_outcomes; phase-row queries
├── db/queries/rewrite-phases.server.ts  # NEW: phase row insert/update/read (idempotent)
├── concepts/progress.ts     # replay conceptOutcomes per term; existing path unchanged
├── attempts/draw.server.ts  # weighted draw matches questions whose concepts[] contain the state
├── content-rules.ts         # rewrite validation rules (model sentence, terms, ≥4 questions)
└── drafts.ts                # phase-qualified draft keys + rewrite graded state

app/
├── api/grade/route.ts       # phase 1/2 handling for rewrite questions
├── api/results/self-mark/route.ts  # per-criterion ticks for rewrite questions
├── unit/[unitId]/quiz/page.tsx     # resume: read phase row, send only the allowed material
└── attempts/[attemptId]/page.tsx   # show both sentences and both marks from the phase row

components/
├── Quiz.tsx                 # rewrite branch: counter, hint panel, discussion, no Photo tab
└── UnitCard.tsx             # "Writing Practice" pill (type comes from meta, no change needed)

scripts/
├── validate-content.ts      # run the new rewrite rules
└── fake-openrouter.ts       # FAKE_REWRITE=pass|partial|fail|down

drizzle/                     # one new migration (rewrite_phases + results.concept_outcomes)
tests/                       # rewrite grading/hint/phase/self-mark/validation/progress tests
```

**Structure Decision**: single Next.js project, following the existing layout exactly — content in
`content/units/<id>/`, server-only grading in `lib/*.server.ts`, routes in `app/api/**`, the quiz
runner in `components/Quiz.tsx`. No new folders or packages.

## Complexity Tracking

> Filled because the Constitution Check has violations that must be justified.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle I: part of the answer key (the hint, then the discussion) reaches the browser | The two-phase teaching design requires showing the missed terms' definitions after a sub-3 phase 1, and the model sentence at the discussion — that is the learning moment. The release is strictly staged and never precedes a phase 1 grade. | Keeping the whole key server-only would make the hint and discussion impossible, removing the unit's teaching mechanism. |
| Principle II: a phase row stores the phase 1/2 sentences, marks, term outcomes and feedback | Phase 1 must be resumable on another device before a final result exists (FR-021), and the attempt detail page must show both sentences and both marks (FR-020). The row holds only the already-permitted kinds of data and is deleted with the student. | A signed client-held phase token does not survive to another device; nullable columns on `results` would break "a row means answered" and every history/average query. |

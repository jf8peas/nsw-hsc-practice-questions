# Implementation Plan: Economics Essay Writing

**Branch**: `010-economics-essay-writing` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-economics-essay-writing/spec.md` (final, including its 2026-11-22 Clarifications: "Discard this attempt", FR-002a; a gap clears only on a different essay). It records only what is new for a whole-essay unit; the rules, code and patterns of [spec 005](../005-economics-sentence-writing/spec.md), [spec 007](../007-economics-paragraph-writing/spec.md) and, closest of all, [specs 008 and 009](../009-english-comparative-short-answers/plan.md) carry over.

## Summary

A new unit `y12-economics-essay-writing`: the student plans a whole extended response (a 20-field scaffold capped at 250 words), optionally gets feedback on the plan, writes 600–800 words with paste blocked, and is marked out of 20 in the AT1 bands by an LLM. Gaps feed "Things I need to know".

The unit is **a one-question, one-try cousin of the English units (008/009)**, not of the paragraph unit: it is never self-marked, a marker failure returns the editable box, the daily limit holds the draft, it needs the database, and an attempt is one question. So the plan reuses 008/009's patterns (attempt per question, open-attempt partial index, `notMarked` replies, refunded slots, draft row, `chatCompletion`) and 007's (word counter, glossary, concept tracking, rubric file shared with an offline pilot, golden prompt test). Decisions in [research.md](research.md) R1–R13:

- **Constitution 2.16.0 → 2.17.0, written first** (R1): Principles I, II, VI, VII and the Quality Gates. No new principle, no new dependency.
- **Content**: a new question type `essay` (public: question, verb, economy, offer position, source, `live`; key, server-only: marking notes, school criteria, band 1 model essay, concept tags). `live` lets the unit run with any subset (R2).
- **Schema**: one new table `essay_phases` (one row per attempt: scaffold, lock, review, essay, marking), one partial unique index for one open attempt per student, one migration `0009` (R3). The finished essay also writes the ordinary `results` row (mark out of 20, concept outcomes), so the unit page, history, delete-student and retention work unchanged.
- **Scaffold**: 20 text fields in 5 collapsible sections, one shared validator for client and server, autosave to the row until it is locked; "Start writing" locks it (R4).
- **Plan review**: own `lib/essay/review.json`, own model setting, one slot refunded on failure, fails to "Start writing" (R5). Slice 2.
- **Essay page**: shared counter wording, server re-check, paste/drop blocked, client-only timer, draft via the existing draft route (R6).
- **Marker**: `lib/essay/rubric.json` is the single prompt source for the app and `scripts/pilot-essay-marker.py`; reply parsed, mark clamped into its band, one-economy cap of 12 in code, off-list gaps dropped, quoted figures checked against the essay (R7).
- **Marker gate first**: the pilot is the first content-dependent step; the user runs it locally (R8).
- **Gaps**: concept list is `lib/essay/concepts.json` (read by `concepts.ts`, the marker and the pilot; kept apart from `rubric.json` so the prompt never reaches a browser bundle); the marker also reports `conceptsUsedWell` so a gap can clear; a correct use on a redo of the raising essay does not count (R9).
- **Shippable slice before Tue 1 Dec**: S1 = amendment, schema, content types, scaffold ("Start writing" only), essay page, marker and handler, result page, gaps, unit page with Redo, essays 1, 3 and 5 once the gate passes. S2 = plan review, timer, Discard, essays 2, 4, 6 (R10, Phases below).

## Technical Context

**Language/Version**: TypeScript 5 on Node 24; Next.js 15 (App Router), React 19.

**Primary Dependencies**: existing only (Next.js, React, Drizzle ORM on Neon Postgres, NextAuth, Vitest, PGlite in tests). Offline scripts use Python 3 standard library (`pilot-essay-marker.py`). **No new runtime dependency** (Principle VIII).

**Storage**: Neon Postgres (PGlite in tests). One migration `drizzle/0009_*.sql`: table `essay_phases`, index `attempts_essay_incomplete_unique` (data-model §3). The scaffold and review are JSON columns of that table; the essay draft reuses `rewrite_drafts.phase1_draft`. Content in committed TypeScript under `content/units/y12-economics-essay-writing/`; school papers, pilot data and run reports stay in gitignored `resources/`.

**Testing**: Vitest: PGlite route tests, client tests (Testing Library), `scripts/fake-openrouter.ts` for the marker and reviewer, `tests/no-key-leak.test.ts`; offline `python scripts/pilot-essay-marker.py` and `--check`.

**Target Platform**: Vercel (region syd1) serving mobile-first web; 390 px phone is the primary target.

**Project Type**: web application (single Next.js project).

**Performance Goals**: ≥ 95% of essays show a mark and feedback within 2 minutes (SC-003). The grade request keeps 008's budget (40 s first call, one retry inside 55 s, `maxDuration` 60); the pilot records seconds per call and the gate requires p95 ≤ 40 s, otherwise the plan raises timeouts (R7, R8).

**Constraints**: constitution 2.17.0 (key server-only; never self-marked; database required; daily cap; no new dependency); 600–800 words enforced in browser and server with one counter; 44 px targets, 4.5:1 contrast, no sideways scroll at 390 px; essays 1, 3 and 5 live before Tue 1 Dec 2026, gate first.

**Scale/Scope**: one student cohort; 6 essays; 26 concepts; at most one open attempt per student; one marker call per essay (plus one per plan review).

## Constitution Check

*GATE: passes before Phase 0 and again after Phase 1 design, **subject to the amendment in research R1 being made first (task T001)**. Under 2.16.0 the rows marked ⚠ are satisfied by the amendment, not by today's wording (which names the paragraph, unseen-text and comparative units).*

| Principle | Status | Notes |
|---|---|---|
| I. Answer key never reaches the browser | ⚠ → ✅ after R1 | New client fields on new routes: `questionId` (an essay id the server re-checks is live) on attempt start; scaffold fields (the student's own text) on the scaffold route; the essay text on the grade route. Marking notes, school criteria and concept tags stay in server-only `answers.ts`, read only through `lib/grading.server.ts`; the band 1 model essay is released only with the student's own finished result. Never a user id, mark or band (R12). |
| II. Signed-in students, minimal personal data | ⚠ → ✅ after R1 | Every route needs a session. Stored per essay attempt: scaffold, review, essay, five verdicts with reasons, band, raw and final mark, lift points, flags, gaps, concepts used well, both prompt versions and models. The student's own writing, deleted with the student (cascade) and by discard (R3). The derived concept rule gains "only a different essay clears a gap". |
| III. Content is code | ✅ | Ids `y12-economics-essay-writing.e<n>`, never renumbered or reused; concept ids `….c-<slug>`; removing an essay keeps its results (`retired`). |
| IV. Validation gates the build | ✅ | `validateEssayRules` joins `npm run validate` (R2): live essays need notes, a 600–800-word model essay, tags from the list, school criteria on trial essays; no repeat of spec 007's essays. |
| V. Syllabus fidelity, original content | ✅ | Three verbatim school-trial questions with source shown and the school's own criteria as server-only rubric (the existing exception, wording unchanged); three original questions; no real HSC question. Model essays are original. |
| VI. Grading fair, explainable, graceful | ⚠ → ✅ after R1 | The unit is added to the never-self-marked units: a marker failure returns the editable box, the slot is refunded, the daily limit holds the draft, and the unit cannot start, resume, mark or save without the database. A reviewer failure or cap offers "Start writing". |
| VII. Cost and abuse controls | ⚠ → ✅ after R1 | `ESSAY_GRADING_MODEL` and `ESSAY_REVIEW_MODEL`: server-only like `OPENROUTER_API_KEY`, never falling back to `GRADING_MODEL`; one `LLM_DAILY_CAP` slot per marked essay and per plan review, refunded on failure; per-user and per-IP limits through the shared pattern. |
| VIII. Simplicity | ✅ | No dependency; reuse over copy; tokens from `styles/tokens.css`. |
| IX. Teacher access server-side | ✅ | No admin route; every query scoped to the session user. |

**Quality gates**: `npm run build`, `npm run lint`, `npm test`, `npm run validate` and `npx tsc --noEmit` pass; no key text in client bundles or `.next/static`; every new route (`/api/essay/scaffold`, `/api/essay/review`, `/api/essay/discard`) needs a session and checks attempt ownership and token; every results query scoped to the user; no personal-data fields beyond Principle II's list; no renumbered ids; the LLM path enforces the daily cap; authorization, cost-control and the concept rule ship with tests.

**Re-check after Phase 1 design**: the contracts add three routes and one field (`questionId` on attempt start); the data model adds one table and no new personal-data category (the student's own writing, as for 007–009); no principle needs more than the R1 wording. ✅ (no unjustified violation; Complexity Tracking lists items for the reviewer's eye).

## Project Structure

### Documentation (this feature)

```text
specs/010-economics-essay-writing/
├── plan.md              # this file
├── research.md          # R1–R13 decisions
├── data-model.md        # content types, concept list, schema, state machine, gap progress
├── quickstart.md        # automated checks, marker gate, phone check
├── contracts/api.md     # routes and payloads; contracts/replies.md: marker and reviewer reply formats
├── content-prompt.md    # the content-task prompt for Qwen (R13)
├── spec.md, specify-prompt.md, checklists/
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

New files marked `+`, changed `~`. Slice in brackets.

```text
.specify/memory/constitution.md              ~ 2.17.0 amendment [S1, first task]
lib/types.ts                                 ~ EssayQuestion, EssayKey, Answer.essay, UnitMeta.flow, UnitMeta.conceptsClearOnOtherQuestions [S1]
lib/content-rules.ts                         ~ validateEssayRules [S1]
scripts/validate-content.ts                  ~ call it; essay tags live in the key [S1]
content/glossary.ts                          ~ "explain" [S1]
content/index.ts, content/answers/index.ts   ~ register the unit [S1]
content/units/y12-economics-essay-writing/   + meta, questions (six public essays with `live`), answers (server-only keys), concepts (reads lib/essay/concepts.json) [S1]
lib/essay/rubric.json                        ~ marker prompt (single source with the pilot), verbMeanings, schoolCriteria slot, conceptsUsedWell; promptVersion bump [S1]
lib/essay/review.json                        + plan-review prompt and its own promptVersion [S2]
lib/essay/{types,scaffold,counter,scoring,views}.ts   + shared pure modules: fields and validation, counter wording, band/cap/outcomes, result view [S1]
lib/essay/marker.server.ts                   + render rubric, call, parse, validate [S1]
lib/essay/review.server.ts                   + reviewer call and parse [S2]
lib/essay/{start,state,log}.server.ts        + start/resume, state loader, minimal logging [S1]
lib/essay/{scaffold,grade}-handler.server.ts + scaffold save and lock; grade flow [S1]
lib/essay/{review,discard}-handler.server.ts + [S2]
lib/grade-common.server.ts                   + clientIp, giveBack, json helpers shared by the essay handlers (008's and 009's keep their copies; no refactor of live code in S1)
lib/grading.server.ts                        ~ essayView, essayModelEssay, essayKeyForMarker (the only readers of the essay key) [S1]
lib/db/schema.ts, drizzle/0009_*.sql         ~ essay_phases, attempts_essay_incomplete_unique [S1]
lib/db/queries/essay-phases.server.ts        + get, insert, save scaffold, lock, review, lease, finalise, discard, latest marks, gap details [S1; review/discard queries S2]
lib/db/queries/attempts.server.ts            ~ createEssayAttempt [S1]
lib/concepts/progress.ts                     ~ clear-on-other-question rule [S1]
lib/openrouter.server.ts, lib/config.server.ts ~ getEssayGradingModel, getEssayReviewModel [S1 / S2]
app/api/attempts/route.ts                    ~ essay branch (`questionId`) [S1]
app/api/grade/route.ts                       ~ essay branch [S1]
app/api/essay/scaffold/route.ts              + save and lock ("start") [S1]
app/api/essay/review/route.ts                + review then lock [S2]
app/api/essay/discard/route.ts               + [S2]
app/api/rewrite/draft/route.ts               ~ accepts type "essay" (phase 1), draft cap 8000 [S1]
app/unit/[unitId]/page.tsx, app/unit/[unitId]/quiz/page.tsx  ~ essay list, Resume, Redo, Discard [S1/S2]
app/attempts/[attemptId]/page.tsx            ~ essay detail [S1]
components/essay/{UnitEssays,EssayPanel,Scaffold,EssayBox,PlanReadout,Result,AttemptDetail}.tsx  + [S1]
components/essay/{ReviewPanel,Timer,DiscardButton}.tsx  + [S2]
components/Quiz.tsx, components/ConceptPanel.tsx  ~ essay stage; gap detail line [S1]
app/globals.css                              ~ tokens only
scripts/pilot-essay-marker.py                ~ --check, --write-golden, conceptsUsedWell, schoolCriteria, latency, holdout set [S1]
scripts/pilot-essay-review.py                + small review pilot [S2]
scripts/delete-student.ts                    ~ essay_phases covered by cascade; add to its report [S1]
resources/topic011/                          pilot-essays.json (+ holdout), runs/, gate report (gitignored)
tests/…                                      + new and extended (below)
README.md, CLAUDE.md, .env.example           ~ unit row, ESSAY_GRADING_MODEL and ESSAY_REVIEW_MODEL, plan pointer
```

**Structure Decision**: single Next.js project; one new unit folder and one new `lib/essay/` module for what is genuinely different; shared pieces reused in place (`chatCompletion`, `reserveAiSlot`/`refundAiSlot`, `saveResult`, `countWords`, `NotMarked`, the draft row and route, concept progress). Live 007–009 code is **not refactored in S1**: the few helpers they each duplicate are copied once into `lib/grade-common.server.ts` for the essay handlers (a later clean-up may point them at it).

## Phases and order (input to /speckit-tasks)

Slice tags: **S1** ships before 1 Dec (target: deployed Fri 27 Nov, so Peyton has several days); **S2** follows, in any order, if time runs short.

1. **Constitution (S1, first task)**: the 2.17.0 amendment of R1.
2. **Foundation (S1)**: types, `essay_phases` and migration, content-rule validator, unit scaffold with the six public essays, all `live: false` (the unit is registered but lists nothing), glossary "explain", concepts from `rubric.json`, config readers, `lib/essay` pure modules (scaffold validator, counter, scoring), `progress.ts` rule.
3. **Marker gate (S1, content-dependent, runs in parallel with 4 and 5)**: update `rubric.json` (school-criteria slot, `conceptsUsedWell`, version bump) and the pilot, `--check`; **the user runs the pilot locally in Git Bash** (OpenRouter is not reachable from the agent's sandbox) and pastes the report; tune (bump `promptVersion`, rerun every case); compare `deepseek-v4.1-flash` and `deepseek-chat`; pass bar in R8. Failure blocks every essay's `live`.
4. **Marker and flow (S1)**: marker module and golden prompt test, start/resume, scaffold route (save, lock), grade handler, result row, gaps, drafts.
5. **Screens (S1)**: unit page (live filter, order, latest mark, Resume, Redo), scaffold page with "Start writing", essay page (counter, paste block, draft, locked marking screen, failure and cap states), result page, attempt detail, "Things I need to know" with the gap line.
6. **Content (S1 for 1, 3, 5; S2 for 2, 4, 6)**: per [content-prompt.md](content-prompt.md): Qwen drafts, Claude reviews, an essay is set `live: true` only after it passes review **and** the gate has passed; essays go live one at a time, 1 then 3 then 5.
7. **S1 ship gate**: validate, tsc, lint, `npm test`, build, no key text in `.next/static`, gate re-run on the final prompt, the quickstart phone check on essays 1 and 5, deploy.
8. **S2**: plan review (prompt, handler, route, two buttons, "Start writing" fallback, small review pilot), 50-minute timer, Discard with confirm, essays 2, 4, 6, the `grade-common` clean-up if wanted.

**Tests to ship** (S1 unless marked S2): unit page order, live filter, latest mark, Redo, Resume; Discard keeps earlier results and is refused once marking has begun (S2); one open attempt enforced by the server (two tabs end on one attempt; a second essay is refused with `attempt_open`); scaffold cap 250 and the judgement-and-a-body-point rule on client and server; autosave and resume; lock after "Start writing" (server refuses later edits) and after a successful review (S2); review: seven lines parsed, fix lines are questions, malformed retried once, failure and cap offer "Start writing", slot refunded, no mark recorded, the result never shows whether the plan was reviewed (S2); counter wording at 0, 599, 600, 800 and 801 words; server refuses outside 600–800 with the same count; paste, drop and `beforeinput` paste insert nothing; the timer is optional and never blocks submit (S2); marking: five verdicts parsed, mark clamped into its band, one-economy cap at 12 on essays 5 and 6 only, off-list gaps dropped, at most 5, unquoted flags dropped, replacement numbers scrubbed, malformed retried once, failure returns the text with no error and refunds the slot, cap says come back tomorrow and keeps the drafts, double submit refused by the lease; gaps feed "Things I need to know" and clear after 2 correct uses on different essays, not on a redo of the raising essay; no key field (notes, school criteria, model essay, tags) in any response before the student's own finished result, on every essay; `validateEssayRules`; delete-student removes the new rows; 390 px, 44 px targets, focus, live region; the golden prompt fixture matches `lib/essay/rubric.json`.

## Complexity Tracking

No unjustified violations. Items worth the reviewer's eye, none a violation:

| Item | Why | Simpler alternative rejected because |
|---|---|---|
| New table `essay_phases` instead of widening `rewrite_phases` or `unseen_phases` | one row holds scaffold, lock, review and marking; the columns share nothing with the sentence or text-marking rows | forcing the essay into `unseen_phases` needs ~15 nullable columns and breaks its checks |
| Scaffold stored in the row, essay draft in `rewrite_drafts` | the scaffold is structured JSON the server validates and freezes; the essay draft is one string the existing route and beacon already handle | a second draft route duplicates 100 lines; a JSON blob in the draft row loses the lock |
| A `marking_started_at` lease on the row | stops a double submit or second tab marking twice, and decides when Discard is refused | no lease means two marker calls and two slots |
| `progress.ts` gets a "different essay" rule behind a unit flag | spec Clarification: a redo of the raising essay must not clear a gap | counting every later result lets a student clear a gap by retyping the model essay they just read |
| Concept list in its own `lib/essay/concepts.json`, imported by `concepts.ts`, the marker and the pilot | one source the Python pilot can read; separate from `rubric.json` because `concepts.ts` is public and the prompt and band descriptors are not | keeping it in `rubric.json` would ship the whole prompt to the browser; moving it into TS makes the pilot and the app drift (`tests/essay/rubric-drift.test.ts` checks the rest) |

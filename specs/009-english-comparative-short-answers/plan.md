# Implementation Plan: Advanced English Comparative Short Answers

**Branch**: `009-english-comparative-short-answers` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-english-comparative-short-answers/spec.md` (final, including its Clarifications). It records only what differs from [spec 008](../008-english-unseen-short-answers/spec.md); 008's rules, code and patterns carry over.

## Summary

A second English unit, `y12-english-advanced-comparative-texts`, for the Section I short answer that refers to two texts and asks the student to compare them (33 found, at most 30 shipped; Q5 in most school trials). It is spec 008 with one change, so the plan **generalises 008's code rather than copying it**:

- **Content**: a new question type `comparative` (fixed pair or choice, `textIds`, `choice`, key with `pairing`), texts and cropped images **shared with 008 and stored once** (008's unit folder is the store; each unit's `texts.ts` is a filter) (R2).
- **Screen**: one `TextPanel` per text inside an accessible `TextTabs` (all panels mounted), the answer box and marking states reused from 008's `Writing`, new `PickChips` for choice questions (R4, R5).
- **Pick**: saved at once to the draft row, fixed on the first submit in the phase row, read-only on the retry, validated by the server; the marker receives only picked texts (R5).
- **Marker**: `marker.server.ts` takes a list of texts, a skill list and a rubric; a new `lib/comparative/rubric.json` (own `promptVersion`) adds the two comparison skills and `compare`; the pilot script gets `--unit comparative` and is the **release gate, run first** (R6, R7).
- **Shared progress**: the seven shared skills are one count across both units, derived by replaying both units' first-try outcomes (R8); the draw is 008's with the text-form weight flattened (R9).
- **Text-only page** counts attempts in either unit and every allowed text (R3).
- **Persistence**: no new table, three schema additions in one migration (R10).
- **Constitution 2.15.1 → 2.16.0**, written first (R1). No new runtime dependency.

## Technical Context

**Language/Version**: TypeScript 5 on Node 24; Next.js 15 (App Router), React 19.

**Primary Dependencies**: existing only (Next.js, React, Drizzle ORM on Neon Postgres, NextAuth, Vitest, PGlite in tests). Offline scripts use Python 3 standard library (`pilot-unseen-marker.py`). **No new runtime dependency.**

**Storage**: Neon Postgres (PGlite in tests). One migration `drizzle/0008_*.sql`: `unseen_phases.picked_text_ids`, `rewrite_drafts.picked_text_ids`, widened `max_marks` check (1–8), pick-shape check, `attempts_comparative_incomplete_unique` index (data-model §3). Content in committed generated TypeScript files; texts, bank JSON, inventories, PDFs, pilot data in gitignored `resources/`.

**Testing**: Vitest: PGlite route tests, client tests (Testing Library), `scripts/fake-openrouter.ts` for the marker, `tests/no-key-leak.test.ts` and the shipped-output scan; offline `python scripts/pilot-unseen-marker.py --unit comparative`.

**Target Platform**: Vercel (Node runtime) serving mobile-first web, 390 px phone is the primary target.

**Project Type**: web application (single Next.js project).

**Performance Goals**: ≥ 95% of answers show a mark within 1 minute (SC-003); first-call timeout 40 s as 008, raised only if the pilot's p95 needs it (R6).

**Constraints**: constitution 2.16.0 (key server-only; no self-marking; database required; daily cap; no new dependency); no timer; 44 px targets, 4.5:1 contrast, no sideways scroll at 390 px; bank ready before 7 Dec 2026, gate first.

**Scale/Scope**: one student cohort; at most 30 shipped questions (33 found) and a few dozen texts (many shared with 008's 119 questions); 9 skills; two units' attempts in the same tables.

## Constitution Check

*GATE: passes before Phase 0 and again after Phase 1 design, **subject to the amendment in research R1 being made first (task T001)**. The current text (2.15.1) names "the unseen-text unit", seven verdicts and one text, so the rows marked ⚠ are satisfied by the amendment, not by the present wording.*

| Principle | Status | Notes |
|---|---|---|
| I. Answer key never reaches the browser | ⚠ → ✅ after R1 | New client field `pick` (text ids) on the pick-save and first-try grade routes, re-checked against the question's public allowed set; the key (criteria, notes, model, pairing, descriptions) stays in server-only `keys.ts`/`answers.ts`, released through `lib/grading.server.ts`; model answer and pairing at the discussion only; the image route and text page check the shared store and the student's attempts (R11). |
| II. Signed-in students, minimal personal data | ⚠ → ✅ after R1 | Every route needs a session; stored: the existing phase-row fields with nine verdicts plus the pick (ids of public texts) in the phase and draft rows; no new personal data; retention and delete-student cover both columns (R10). |
| III. Content is code | ✅ | New unit's ids `y12-english-advanced-comparative-texts.<paper>-q<n>`, never renumbered or reused; text ids never reused; removing a question keeps its results (`retired`). |
| IV. Validation gates the build | ✅ | `validateComparativeRules` joins `npm run validate`; 008's rules untouched (R12). |
| V. Syllabus fidelity, original content | ⚠ → ✅ after R1 | Verbatim school-paper questions and texts with source shown; no real HSC text or question (HSC check per new text); cropped visuals only in the shared store's `images/`, served only to signed-in students; the exception's wording is widened to the shared store; removed before the app goes commercial. |
| VI. Grading fair, explainable, graceful | ⚠ → ✅ after R1 | Never self-marked on either try; marker failure returns the editable box with no mark; daily limit holds the question until the next Sydney day; the unit cannot start, resume, mark or save without the database; one slot per marked try, refunded on failure (same handler core as 008). |
| VII. Cost and abuse controls | ⚠ → ✅ after R1 | Same model variable and server-only rules, wording widened to both units; per-user and per-IP limits and `LLM_DAILY_CAP` apply through the shared handler; `COMPARATIVE_GRADING_MODEL` only if the gate demands it, with its own later amendment. |
| VIII. Simplicity | ✅ | No new dependency; reuse over copy (marker, handler core, draw, panels); tokens from `styles/tokens.css`; the 008 `localStorage` highlight cache is reused unchanged. |
| IX. Teacher access server-side | ✅ | No new admin route; every query scoped to the session user. |

**Quality gates**: `npm run build`, `npm run lint`, `npm test`, `npm run validate` and `npx tsc --noEmit` pass; no key text in client bundles or `.next/static` for either unit; every new route (`/api/comparative/pick`) needs a session and checks attempt ownership and token; every results query scoped to the user; no personal-data fields beyond Principle II's list; no renumbered ids; the LLM path enforces the daily cap; authorization, cost-control and the shared-progress rule ship with tests.

**Re-check after Phase 1 design**: the contracts (api.md) add exactly one client field; the data model adds no new table and no new personal data; no principle needs more than the R1 wording. ✅ (no unjustified violation; Complexity Tracking empty).

## Project Structure

### Documentation (this feature)

```text
specs/009-english-comparative-short-answers/
├── plan.md              # this file
├── research.md          # R1–R13 decisions
├── data-model.md        # content types, schema, shared progress, draw, card states
├── quickstart.md        # automated checks, marker gate, phone check
├── contracts/api.md     # start/resume, pick, grade, decline, text page, image, marker reply
├── content-prompt.md    # the content-task prompt (bank, inventory, FR-034 amendment)
├── spec.md, specify-prompt.md, plan-prompt.md, checklists/
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

Existing Next.js layout; **new** files marked `+`, **changed** `~`.

```text
.specify/memory/constitution.md          ~ 2.16.0 amendment (first task)
lib/types.ts                             ~ ComparativeQuestion, ComparativeChoice, ComparativeKey, AnswerSet.comparative, UnitMeta.sharesProgressWith, draw kind, qNo 1–5
lib/content-rules.ts                     ~ validateComparativeRules (+ rubric parameter for verbs); 008 rules untouched
scripts/validate-content.ts              ~ call it; comparative skip lists beside the unseen ones
content/index.ts, content/answers/index.ts  ~ register the new unit and its answers
content/units/y12-english-advanced-unseen-texts/   ~ store-texts.ts (+, generated), texts.ts (filter), meta (sharesProgressWith); images/ and descriptions stay
content/units/y12-english-advanced-comparative-texts/  + meta, concepts, texts (filter), questions, keys, answers (generated)
lib/unseen/skills.json, skills.ts        ~ nine skills; SKILL_IDS (7) and COMPARATIVE_SKILL_IDS (9)
lib/unseen/marker.server.ts              ~ texts[], skill list and rubric parameters; parse nine verdicts
lib/unseen/draw.ts                       ~ structural question type
lib/unseen/start.server.ts               ~ extract startDraw(config)
lib/unseen/grade-handler.server.ts       ~ shared core with a pick-aware comparative entry
lib/unseen/images.server.ts              ~ look visuals up in the shared store
lib/comparative/rubric.json              + prompt, promptVersion comparative-pilot-N, verbs incl. compare
lib/comparative/{types,state.server,start.server,grade.server,pick.server,views}.ts  + state loader, start, grade entry, pick save and validation, results view
lib/concepts/progress.ts                 ~ sharedConceptProgress
lib/concepts/weighting.server.ts, lib/db/queries/concepts.server.ts, app/api/units/[unitId]/concepts/{status,ensure}/route.ts  ~ use loadConceptProgress
lib/db/schema.ts, drizzle/0008_*.sql     ~ columns, checks, index (data-model §3)
lib/db/queries/{unseen-phases,rewrite-drafts,unseen-progress,attempts}.server.ts  ~ pick columns; text access across units; comparative progress
lib/unseen/limits.ts                     ~ MEDIAN_WORDS 7 and 8 (counted, not guessed)
app/api/comparative/pick/route.ts        + pick save
app/api/grade/route.ts, app/api/unseen/decline/route.ts, app/api/attempts/route.ts  ~ branch on question type / unit
app/unit/[unitId]/text/[textId]/page.tsx ~ cross-unit access
app/unit/[unitId]/page.tsx, app/attempts/[attemptId]/page.tsx, components/AttemptHistory.tsx  ~ comparative results, detail, history
components/unseen/TextTabs.tsx, PickChips.tsx, ComparativePanel.tsx  +
components/unseen/{UnitProgress,AttemptDetail,Results,Writing}.tsx, components/Quiz.tsx  ~ nine skills, pick, reuse
app/globals.css                          ~ tabs, chips (tokens only)
scripts/unseen-build-bank*.ts, unseen-report*.ts, unseen-remark*.ts, unseen-field-cases.ts, check-unseen-descriptions*.ts, delete-student.ts  ~ comparative pass and sections
scripts/pilot-unseen-marker.py           ~ --unit comparative
resources/english-unseen/ (gitignored)   inventory additions, bank/comparative/, pilot-comparative.json, review/ALL-REVIEW.md section
tests/…                                  + new and extended (below)
README.md, CLAUDE.md                     ~ unit row, env note, plan pointer
```

**Structure Decision**: single Next.js project; one new unit folder and one new `lib/comparative/` module for what is genuinely different; everything shared (marker, handler core, draw, panels, store, validator helpers, scripts) is generalised in place so 008 stays byte-for-byte equivalent in behaviour (008's whole suite is the regression net).

## Phases and order (input to /speckit-tasks)

1. **Constitution** (first task): the 2.16.0 amendment of R1, plus the sync of templates the constitution workflow requires.
2. **Foundation**: types and content rules, the shared store (`store-texts.ts`, filtered `texts.ts`, image lookup), the migration, the nine skills and the shared-progress function with its call sites, the generalised marker/draw/start/handler cores with 008's suite green after each refactor, the unit scaffold with **no questions** (not listed). The shared-progress function (T013) is inert until the scaffold sets `sharesProgressWith` on both units (T014).
3. **Marker gate** (R7), the first content-dependent step: `lib/comparative/rubric.json`, `pilot-comparative.json` (labelled answers written by Claude, reviewed by the user), `--unit comparative`, run tuning, then the frozen holdout; failure blocks release.
4. **Stories** in priority order: US1 (tabs, pick, answer, mark) → US2 (tab out, highlights, cross-unit access) → US3 (retry, discussion with pairing line) → US4 (nine skills, shared progress, "Things I need to know") → US6 (draw, unit page results) → US7 (offline re-mark and field cases) , each with its tests.
5. **Content** (US8, separate content task): Batch 0 inventory + FR-034 amendment, Batches 1–2 per `content-prompt.md`, review report, user approval. These run **in parallel with step 3** once the bank tooling exists (the bank does not depend on the prompt); only `reviewedOn` and release wait for the gate to pass, and the model-answer check is rerun if the gate changed the prompt or model.
   **Order inside step 2**: each refactor of live 008 code (marker parameters, handler core, `startDraw`, shared progress, text access, image lookup) lands with 008's whole suite green before the next one starts, since 008 is in use before Task 1.
6. **Ship gate**: validate, tsc, lint, `npm test`, build, no key text in `.next/static`, the marker gate re-run, the quickstart phone check, then deploy before 7 Dec 2026.

**Tests to ship** (from plan-prompt): tabs show exactly the question's texts, keyboard operation, answer box unaffected by switching; each tab opens only its text; text page access across both units and every allowed text, 404 otherwise; highlights per attempt and text, separate per text, synced; pick required before Submit, saved on change, restored on resume, fixed on retry, server rejects incomplete / disallowed / changed picks; only picked texts reach the marker (prompt content); nine verdicts parsed, a missing verdict retried; retry cap, decline, no third try, one-mark question; marker failure and daily cap on both tries; shared skill counts across the units in both directions; draw without the form weight, pending first, repeats; unit page results by fixed pair and choice; no key field before the discussion on every question of both units; `validateComparativeRules`; delete-student removes the new rows; 390 px, 44 px targets, focus and live regions; the pilot reads the unit's prompt file and reports tuning, holdout and field separately; 008's output unchanged when no comparative bank exists.

## Complexity Tracking

No unjustified violations. Items worth the reviewer's eye, none a violation:

| Item | Why | Simpler alternative rejected because |
|---|---|---|
| Shared texts across units (a filter over one store) | spec FR-029: stored once | duplicating texts/images doubles checks and breaks "stored once"; moving the store changes every image path and Principle V's wording |
| `sharesProgressWith` and cross-unit replay | spec FR-022: one count per shared skill | copying results or a second skill-id set cannot give one count |
| Refactors of 008 code (`startDraw`, handler core, marker parameters) | reuse, not copy (plan-prompt) | a forked copy of each would drift; 008's suite protects the refactor |

# Implementation Plan: English Essay Writing

**Branch**: `011-english-essay-writing` | **Date**: 2026-11-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-english-essay-writing/spec.md` (final). It records only what is new for the English essay unit. [Spec 010](../010-economics-essay-writing/spec.md) is normative for the inherited flow and rules; [spec 008](../008-english-unseen-short-answers/spec.md) supplies the English conventions. Decisions are in [research.md](research.md) R1–R16.

## Summary

A new unit `y12-english-essay-writing`: the student makes a light plan (thesis plus three optional claim/evidence pairs, capped at 150 words), writes 800–1,200 words on Michael Gow's Away with paste blocked, and receives one calibrated mark out of 20. The approved `eng-essay-pilot-5` marker is combined with a deterministic quotation checker and deterministic knowledge-error/question-focus adjustments. The result adds question focus, knowledge errors and quote findings to spec 010's verdicts, lift points, model essay and gaps.

The architecture is a **parallel English module**, not a wholesale generalisation of spec 010. New `lib/english-essay/` and `components/english-essay/` modules own the English scaffold, marker, reviewer, quote check, views and handlers. They reuse spec 010's bands, outcome replay, generic client leaves, attempt/draft/result infrastructure and `essay_phases` table with per-unit checks. Economics behaviour, data and tests remain unchanged.

**S1** ships the unit page, scaffold with "Start writing" only, essay page without a timer, marker with quote check and final-mark rules, result/attempt detail, gaps, Discard, and essays 1–3. Target deployment is **Fri 27 Nov 2026**, with **Fri 4 Dec 2026 as the hard deadline** before Peyton's Mon 7 Dec assessment. **S2** adds plan review only after its separate pilot and Chiang's approval, the optional 45-minute timer, and essays 4–6.

## Technical Context

**Language/Version**: TypeScript 5 on Node 24; Next.js 15 (App Router), React 19. Offline pilots use Python 3 standard library.

**Primary Dependencies**: existing only (Next.js, React, Drizzle ORM on Neon Postgres, NextAuth, Vitest, PGlite in tests, `tsx` for scripts). **No new runtime dependency** (Principle VIII). The quote checker includes a TypeScript port of CPython's `SequenceMatcher` rather than adding a fuzzy-match package.

**Storage**: Neon Postgres (PGlite in tests). Migration `drizzle/0010_*.sql`: English columns and partial open-attempt index on the existing essay table, per-unit checks, and shared `reference_texts`. Public content and keys are committed TypeScript under `content/units/y12-english-essay-writing/`; the full play, pilot essays, content drafts and run reports stay in gitignored `resources/`. The play is loaded into the database by a one-off script, never committed.

**Testing**: Vitest: PGlite route tests, client tests (Testing Library), pure boundary/algorithm tests, `scripts/fake-openrouter.ts`, `tests/no-key-leak.test.ts`, golden prompt/drift tests, local Python/TypeScript quote-parity runner, and the real-model English marker and review pilots.

**Target Platform**: Vercel (region syd1) serving mobile-first web; a real phone at 390 px is the primary validation target.

**Project Type**: web application (single Next.js project).

**Performance Goals**: ≥95% of submitted essays show a result within 2 minutes (SC-003). Marker: 60 s first call, one retry inside 115 s, route `maxDuration` 120 s, lease 130 s, `max_tokens` 8000. Quote check: target <500 ms for a 1,200-word essay with 25 quotations, with a 2 s performance-test ceiling.

**Constraints**: constitution 2.17.0 amended to 2.18.0 first; no self-marking; database required; independent English model settings; no new dependency; 150-word plan and 800–1,200-word essay enforced on client and server; full play never committed or sent to the browser; 44 px targets, 4.5:1 contrast, no sideways scroll at 390 px; S1 live with essays 1–3 no later than Fri 4 Dec 2026.

**Scale/Scope**: one student cohort; 6 essays; 19 concepts; at most one open English attempt per student; one marker call per essay (plus one optional review in S2), each with at most one retry.

## Constitution Check

*GATE: passes before Phase 0 and again after Phase 1 design, **subject to the amendment in research R1 being made first**. Under 2.17.0 the rows marked ⚠ are satisfied by the 2.18.0 amendment, not by today's wording.*

| Principle | Status | Notes |
|---|---|---|
| I. Answer key never reaches the browser | ⚠ → ✅ after R1 | New English routes carry only ids, signed token, own scaffold/review/draft/essay. Public practice ids are skill-only. Marking notes, Away notes, key tags, pilot essays and full play stay server-only. Model essay appears only with the student's own finished result; only near-match corrections and that model's quotations may release play words. Every attempt/token is verified. |
| II. Signed-in students, minimal personal data | ⚠ → ✅ after R1 | Every route needs a session. English attempt fields are added to the closed storage list; `reference_texts` is shared non-personal state. Rows cascade on student deletion and Discard; retention remains two years in Sydney. Concept counts remain derived. |
| III. Content is code | ✅ | Ids `y12-english-essay-writing.e1`–`e6` and `….c-<slug>` are stable and never renumbered/reused. Non-live essays keep results; staged `live` flags deploy atomically with content. |
| IV. Validation gates the build | ✅ | `validateEnglishEssayRules` joins `npm run validate`: verbatim questions/sources/directives, live keys, 900–1,100-word models, valid tags and zero quote flags. Concept-list edits change the prompt hash and reopen the marker gate. |
| V. Syllabus fidelity, original content | ⚠ → ✅ after R1 | Six sourced school-trial questions, no real HSC question. R1 adds the narrow non-commercial server-only database arrangement for Away and the two result-excerpt exceptions. Sources are documented in README. |
| VI. Grading fair, explainable, graceful | ⚠ → ✅ after R1 | Never self-marked. Marker failure returns editable text and refunds; daily cap holds drafts; review failure/not-live offers "Start writing". Missing reference text refuses marking before a model call or slot, preserving text with no silent quote pass. |
| VII. Cost and abuse controls | ⚠ → ✅ after R1 | `ENGLISH_ESSAY_GRADING_MODEL` and `ENGLISH_ESSAY_REVIEW_MODEL` default independently to `openai/gpt-6.2-sol`, with no fallback between them or to another unit. One `LLM_DAILY_CAP` slot per marked essay/review, refunded on failure; existing per-user/IP limits. |
| VIII. Simplicity | ✅ | No dependency. Parallel module over a risky general engine rewrite; generic leaves reused; design tokens only; mobile-first. |
| IX. Teacher access server-side | ✅ | No admin route. Every attempt/result query is scoped to the session user; offline scripts read the database directly like existing teacher tasks. |

**Quality gates**: `npm run build`, `npm run lint`, `npm test`, `npm run validate` and `npx tsc --noEmit` pass; the full existing Economics essay suite stays green; every new route requires a session and verifies ownership/token; every result query is user-scoped; no personal-data fields beyond amended Principle II; no renumbered ids; daily cap and refunds are tested; no key field, Away note, pilot essay or play text appears in any premature browser response or client output; the shipping marker passes the one-sided pilot; every live model passes the quote check; the review remains off until its own gate passes.

**Re-check after Phase 1 design**: the contracts add three English routes and additive branches in existing routes, one shared reference table and nullable English attempt fields. The data model introduces no unapproved personal-data category and no new dependency. The response map covers every success, failure, resume and detail payload. No principle needs more than the R1 wording. ✅ No unjustified violation; Complexity Tracking records design trade-offs for review.

## Project Structure

### Documentation (this feature)

```text
specs/011-english-essay-writing/
├── plan.md                    # this file
├── research.md                # R1–R16 decisions and exact 2.18.0 amendment
├── data-model.md              # content, schema, state, final mark, gap replay
├── contracts/
│   ├── api.md                 # pages/routes/payloads and release schedule
│   ├── replies.md             # marker and reviewer JSON formats
│   └── quote-check.md         # deterministic quote result and algorithm contract
├── quickstart.md              # reference loading, automated gates, pilot and phone checks
├── content-prompt.md          # separate Claude Code content task
├── spec.md, specify-prompt.md, plan-prompt.md, checklists/
└── tasks.md                   # /speckit-tasks (NOT created by /speckit-plan)
```

### Source Code (repository root)

New files marked `+`, changed `~`. Slice in brackets.

```text
.specify/memory/constitution.md                         ~ 2.18.0 amendment [S1, first]
lib/types.ts                                            ~ EnglishEssayQuestion, Answer.englishEssay, flow [S1]
lib/content-rules-english-essay.ts                      + live content and model validation [S1]
lib/content-rules.ts                                    ~ englishEssay concept-ready/explanation branches [S1]
lib/english-essay/rubric.json                           (existing approved eng-essay-pilot-5) [S1]
lib/english-essay/concepts.json                         - moved into the unit's concepts.ts [S1]
lib/english-essay/review.json                           + eng-essay-review-1 [S2]
lib/english-essay/{types,scaffold,counter,scoring}.ts   + pure English shapes/rules [S1]
lib/english-essay/{quotes,sequence-matcher}.ts          + deterministic quote check [S1]
lib/english-essay/quote-exclusions.json                 (existing) syllabus phrases treated as other-source [S1]
lib/english-essay/reference-text.server.ts              + DB loader/cache, missing-text error [S1]
lib/english-essay/marker.server.ts                      + prompt/call/parse/retry [S1]
lib/english-essay/{review.server,review-labels}.ts      + reviewer and public labels [S2]
lib/english-essay/{start,state,progress,results,log}.server.ts  + lifecycle [S1]
lib/english-essay/{scaffold,grade,discard}-handler.server.ts    + routes' logic [S1]
lib/english-essay/review-handler.server.ts              + [S2]
lib/english-essay/views.ts                              + result/unfinished views [S1]
lib/db/schema.ts, drizzle/0010_*.sql                    ~ per-unit checks, English fields, reference_texts [S1]
lib/db/queries/english-essay-phases.server.ts           + English rows/latest marks/gaps [S1]
lib/config.server.ts                                    ~ two independent English model getters [S1/S2]
lib/grading.server.ts                                   ~ English public/key/model readers [S1]
lib/drafts.ts, lib/startAttempt.ts                      ~ English state/draft payload [S1]
lib/concepts/progress.ts                                (unchanged: existing different-essay rule reused)
lib/essay/scoring.ts                                    (unchanged: bands/clamp/outcomes reused)
components/essay/EssayBox.tsx                           ~ optional counter prop, Economics default [S1]
components/essay/DiscardButton.tsx                      ~ optional endpoint prop, current default [S1]
components/essay/{Timer,Result}.tsx                     (unchanged: Timer and VerdictBadge reused)
components/english-essay/                               + Scaffold, EssayPanel, UnitEssays, Result,
                                                          ReviewPanel, AttemptDetail, shared [S1/S2]
components/Quiz.tsx, components/ConceptPanel.tsx        ~ additive English branches [S1]
content/units/y12-english-essay-writing/                + meta, questions, answers, concepts, directives [S1]
content/{index,exams}.ts, content/answers/index.ts      ~ registration and Task 1 [S1]
app/api/english-essay/{scaffold,discard}/route.ts       + [S1]
app/api/english-essay/review/route.ts                   + [S2]
app/api/{attempts,grade}/route.ts                       ~ additive English branches [S1]
app/api/rewrite/draft/route.ts                          ~ English phase-1 draft, 12,000 cap [S1]
app/unit/[unitId]/{page,quiz/page}.tsx                  ~ English unit and resume [S1]
app/attempts/[attemptId]/page.tsx                       ~ English detail [S1]
app/globals.css                                         ~ ee-* classes, tokens only [S1]
scripts/load-reference-text.ts                          + one-off Away upsert [S1]
scripts/{english-essay-build-answers,check-english-essay-models}.ts + content tooling [S1]
scripts/{english-essay-concepts-json,check-english-essay-quote-parity}.ts + single-source/parity [S1]
scripts/pilot-english-essay-marker.py                   ~ golden and gitignored parity fixture [S1]
scripts/pilot-english-essay-review.py                   + seven-scaffold review pilot [S2]
scripts/{fake-openrouter,delete-student}.ts             ~ English fake replies/deletion report [S1]
scripts/clear-unfinished-essays.ts                      (unchanged: paragraph-only)
package.json                                            ~ new script entries [S1/S2]
tests/helpers/english-essay.ts                          + PGlite/fake-model helpers [S1]
tests/english-essay/                                    + pure, prompt, quote, scoring, content tests [S1/S2]
tests/api/english-essay-*.test.ts                       + PGlite route/lifecycle/leak tests [S1/S2]
tests/client/english-essay-*.test.tsx                   + screens and accessibility [S1/S2]
tests/fixtures/english-essay-*                          + synthetic golden/hash only, no play text [S1]
tests/no-key-leak.test.ts                               ~ English responses/import boundaries/sentinel [S1]
README.md, CLAUDE.md, .env.example                      ~ unit, models, reference loading, plan pointer [S1/S2]
resources/english-essay/                                (gitignored: content, approvals, parity, pilot runs)
```

**Structure Decision**: single Next.js project. English-specific behaviour lives beside, not inside, Economics modules. Only additive shared branches and two default-compatible client props touch spec 010. The existing `createEssayAttempt`, draft/result saves, concept replay, retention and cascade patterns are reused without changing their Economics behaviour.

## Phases and order (input to /speckit-tasks)

Slice tags: **S1** ships first (target Fri 27 Nov, hard deadline Fri 4 Dec); **S2** follows only after S1 is deployed.

1. **Constitution (S1, first task)**: apply R1's exact 2.18.0 amendment, including Principle V and the Quality Gates. Record the full baseline, especially every existing Economics essay test.
2. **Foundation (S1)**: additive content/types; per-unit migration and `reference_texts`; six public questions all non-live; one concept source; directive helper; independent model getters; English pure scaffold/counter/scoring/quote modules; reference loader and cache; content validator. Economics suite remains green at the checkpoint.
3. **Marker and quote trust gates (S1, parallel with 4–6)**: TypeScript marker and strict parser; golden prompt and rubric+concept drift fixture; CPython matcher port and synthetic tests; gitignored 4/4, 0-false-flag/77 parity run; 25-quote benchmark; shipping `eng-essay-pilot-5`/`openai/gpt-6.2-sol` pilot in small `--only` groups. No live flag before every gate component passes.
4. **Flow (S1)**: English start/resume, scaffold save/lock, essay draft, grade handler with reference check/lease/slot/refund, finalise and result row, latest-mark repair, gaps, Discard. Add shared route branches without changing Economics dispatch.
5. **Screens (S1)**: unit list with sources/latest final mark/Start/Resume/Redo/Discard; light scaffold with only "Start writing"; essay box with 800–1,200 counter, paste block, autosave and locked marking; result and attempt detail with focus/errors/quote flags/model/gaps; 390 px accessibility.
6. **Content (S1: essays 1, 2, 3; S2: 4–6)**: separate Claude Code task per `content-prompt.md`; Chiang reviews each; builder and model quote check; set `live` one at a time only after content approval and the shipping marker gate.
7. **S1 ship gate**: reference hash verified in the target database; full existing and new suites, type check, lint, content validation and build; no-key/client-output scans; final shipping-prompt pilot; real-phone quickstart on essays 1 and 2; deploy by target, never later than Fri 4 Dec.
8. **S2**: seven-scaffold review pilot and Chiang approval first; then enable review prompt/route/UI, add the 45-minute timer, and release essays 4–6 through the same content gates. If S1 slips, all S2 moves after the exam.

## Tests to ship (Quality Gates)

**Economics regression**: the complete `tests/essay/*`, `tests/api/essay-*.test.ts`, `tests/client/essay-*.test.tsx` and `tests/no-key-leak.test.ts` suites stay green unchanged after the additive shared edits; then the full suite runs.

**Unit/lifecycle**: live filter and order 1–6; sources; latest final mark/band; Redo replaces latest; Resume at each stage; Discard planning/writing removes rows but preserves earlier results and refuses active/finished marking; one open English attempt per student including two tabs and different essays; non-live cannot start; database unavailable never guesses.

**Scaffold**: seven fields/no conclusion; 150 accepted and 151 refused on client and server; whitespace-only thesis blocks both actions while every other field may be empty; over-cap restored drafts remain disabled; autosave/resume; lock after "Start writing" and successful review; later edits refused.

**Review [S2]**: five lines parsed/reordered; malformed retried once; non-question fix rejected; reviewer failure, daily cap and not-live all offer "Start writing" without locking; failed slot refunded; no mark or review outcome in the result; seven-scaffold pilot has both outcomes for every check and Chiang's approval.

**Essay writing**: exact counter wording at 799, 800, 1,200 and 1,201; server refuses outside the range before any slot/call; 12,000-character backstop; paste/drop/beforeinput insert nothing while autocorrect works; draft autosave/resume; timer [S2] optional, 45:00, unstarted on reload and never blocks submit; locked marking screen and failure/cap preservation.

**Marking**: four verdicts parsed; required focus/reason, band, whole raw mark, band reason, lift, knowledge errors, gaps and used-well; malformed retried once; cut-off/echo rejected; no cross-unit model fallback; final-mark order tested by a generated matrix at every band boundary and by overlap/repetition cases; focus caps 12/10; deduction capped at two and cap at 16 at two; not-found quotes counted; marker/quote overlap counted once; final band derived from final mark; off-list gaps dropped and at most five; failure keeps text and refunds; cap says come back tomorrow; double submit uses one lease/result.

**Quote/reference**: exact CPython ratio fixtures; straight/curly and single/double extraction, including single quotes containing apostrophes; question and syllabus-phrase quotations as `other-source`; replay parity with the Python final marks for the 48 saved pilot replies; three-word minimum; punctuation, ellipses and slash segments; exact, near and not-found statuses with exact near correction; local pilot parity 4/4 planted and 0 false flags over 67 accurate quotes; 25-quote benchmark; missing reference refuses before model/slot; loader upserts/hash; PGlite uses only invented passages; every live model has zero flags.

**Information release**: golden prompt matches the Python renderer; any rubric or concept change requires a new prompt version; no marking note, Away note, key tag, pilot essay, play text or model essay in any premature response or client output; test-time play sentinel absent from responses and `.next/static`; only near corrections and released model quotations are exceptions; another student's attempt/result is never readable.

**Retention/accessibility**: delete-student and retention remove English rows; discard removes only open rows; `clear-unfinished-essays` remains paragraph-only; 390 px no sideways scroll, 44 px targets, visible focus, result/notice focus, polite live regions, reduced motion, and verdict/quote/review status never conveyed by colour alone.

## Complexity Tracking

No unjustified violations. Items worth the reviewer's eye:

| Item | Why needed | Simpler alternative rejected because |
|---|---|---|
| Parallel English module instead of a subject-agnostic engine rewrite | English needs different scaffold, marker, scoring, quote and result shapes now; Economics must remain untouched | A full config refactor touches every working Economics seam and delays S1; copying generic bands/outcomes/leaves would drift |
| Reuse `essay_phases` with per-unit checks and English row types | One table already owns lease, latest marks, retention and result repair | A second table duplicates lifecycle queries; globally loosening checks weakens Economics |
| Full play in `reference_texts`, loaded per environment | Public git cannot contain it, but runtime quote verification needs a deployable copy | Committing/encrypting is forbidden; object storage adds a dependency; skipping checks is unsafe |
| Port CPython `SequenceMatcher` | The approved 4/4 and zero-false-flag evidence depends on exact ratio behaviour | A different similarity or new dependency changes calibration and violates Principle VIII |
| Public skill-only `conceptIds` beside server-only `conceptTags` | Public practice metadata is requested, but Away answer coverage is key | Publishing all tags leaks the key; having no public practice ids ignores the requested content shape |
| Golden prompt uses synthetic text notes plus a rubric+concept hash | Rendering parity is required, but play text cannot enter a fixture | A full production-prompt golden reproduces protected notes; a version-only regex does not detect prompt drift |
| Missing reference text refuses marking | Quote verification is part of the mark's trustworthiness | Marking anyway would produce an unverified result and could create false confidence |

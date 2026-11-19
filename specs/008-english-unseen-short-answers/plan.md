# Implementation Plan: Advanced English Unseen-Text Short Answers

**Branch**: `008-english-unseen-short-answers` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-english-unseen-short-answers/spec.md`

## Summary

A new Writing Practice unit, `y12-english-advanced-unseen-texts`, practises the single-text short answers
of Section I of HSC English Advanced Paper 1. A quiz is one unseen text with one question below it, no
timer, marked by an LLM against the school's band descriptors and seven tracked skills. It is the app's
first English unit and the second unit built on spec 007's machinery (one capped retry, tip cards, a
discussion with a model, stored verdicts, an offline revision loop; no student flag).

What is new, and where it lands:

- **A text-and-question quiz, not a part of an essay.** A new `unseen` question type points at a public
  text stored once (poem with stanzas and line numbers, prose, footnotes, or a cropped image). The key
  (criteria, notes, model answer, visual description) is server-only and released on a schedule that puts
  the model answer at the discussion and nothing else ever
  ([R2](research.md#r2-content-shape-fr-001-to-fr-007-fr-039-to-fr-046),
  [R4](research.md#r4-what-reaches-the-browser-when-fr-022-sc-006-principle-i)).
- **Cropped visual stimuli, served behind a session.** Images live under the unit and are served by an
  authenticated route, with a neutral alt text and a native zoom dialog. A visual question cannot ship
  until the marker's `descriptionAdequate` check has passed for its description
  ([R3](research.md#r3-visual-texts-fr-004-fr-017)).
- **The pilot's marker, ported.** The passing prompt (`unseen-pilot-4`) moves to `lib/unseen/rubric.json`,
  read by both the app and `scripts/pilot-unseen-marker.py`; a golden prompt file and a hash guard against
  drift. The unit marks with `ENGLISH_ADV_GRADING_MODEL` (`deepseek/deepseek-v4.1-flash`), 4000 tokens, a 55 s budget
  ([R5](research.md#r5-the-marker-fr-012-to-fr-018)).
- **No self-marking and no first-try ending.** A marker failure returns the editable box holding the text
  and refunds the slot; the daily limit disables Submit until the next Sydney day and the question waits at
  that step, on both tries; a student can decline the retry
  ([R7](research.md#r7-limits-and-failure-paths-fr-019-to-fr-020-fr-023-fr-030-to-fr-033-principles-vi-and-vii)).
- **A weighted draw with an exact test.** A pending question first; otherwise integer weights from each text
  form's average mark (untried forms top) times a multiplier for uncleared skills, with an injected random
  source so the probabilities are asserted exactly
  ([R9](research.md#r9-the-draw-fr-027-to-fr-029-sc-008)).
- **New persistence.** An `unseen_phases` table stores both tries' text, seven verdicts with reasons,
  feedback, biggest gap, prompt version and ending; a partial unique index keeps one open attempt
  per student so two tabs end on one attempt ([R8](research.md#r8-persistence-and-resume-fr-024-fr-027-fr-034-fr-035-principle-ii),
  [data-model.md](data-model.md)).
- **Seven skills as concepts** with `clearAfter: 2`, derived from the first try's seven outcomes. No change
  to `lib/concepts/progress.ts` ([R10](research.md#r10-skill-tracking-fr-025-fr-026)).
- **A revision loop** of offline scripts, with no student flag: a stronger-model re-mark that samples first tries
  from every mark band and exports disagreements to a `field` set, and a regression over every case
  reporting tuning, holdout and field separately ([R11](research.md#r11-the-offline-revision-loop-fr-035-to-fr-038-sc-005)).
- **New components** in `components/unseen/*`, driven by an explicit state machine, with a phone text sheet
  so the text stays reachable while writing
  ([R12](research.md#r12-components-and-the-question-cards-state-machine)).
- **Constitution 2.14.0 → 2.15.0**, six amendments (Principles V, VI, I, II, VII and the Quality Gates),
  applied first ([R1](research.md#r1-constitution-amendments-2140--2150-minor)).
- **Content tooling, not content.** A bank generator and a review-report script define the format the
  separate paper-research task writes to (the full 37-paper bank, same 7 Dec target, is that task's deliverable); the starter bank is the five Fort Street tuning questions
  ([R2](research.md#r2-content-shape-fr-001-to-fr-007-fr-039-to-fr-046)).

Where this plan and `spec.md` differ, the spec wins; the two wording adjustments (FR-014 and FR-025 name
`lib/unseen/rubric.json` and `skills.json` instead of `resources/english-unseen/rubric.json`) are recorded
at the end of research.md. The requirements doc was read in full; nothing in it could not be opened.

## Technical Context

**Language/Version**: TypeScript, Next.js 15 (App Router, React 19), Node 24 (dev), Python 3 for the
existing pilot script (stdlib only), as the repo.

**Primary Dependencies**: No new runtime dependency (Principle VIII): `next`, `react`, `drizzle-orm`, Neon,
Upstash, Auth.js and the existing `chatCompletion` wrapper. The zoom and the phone text sheet use the native
`<dialog>`; the image route uses `node:fs`. New scripts use `tsx`, already present.

**Storage**: Neon Postgres (Sydney). One new table `unseen_phases`, one partial unique index on `attempts`,
one migration (`drizzle/0006_*.sql`), no backfill. Drafts reuse `rewrite_drafts`. The cropped images are
files under the unit folder. The labelled test cases live in the gitignored
`resources/english-unseen/pilot-questions.json`.

**Testing**: Vitest (PGlite route tests, client tests with Testing Library, pure unit tests),
`scripts/fake-openrouter.ts` for manual runs, `python scripts/pilot-unseen-marker.py --gate` for the marker
regression. Listed under Quality Gates below.

**Target Platform**: Mobile-first web at 390 px, no sideways scroll; desktop browsers (one column at every width,
prose capped at 68ch, images at full card width); keyboard and screen-reader accessible; reduced-motion aware.

**Project Type**: Web application (Next.js App Router), server-rendered pages plus JSON API routes and one
binary route.

**Performance Goals**: Every marked answer shows its result within 1 minute (SC-002): one model call 40 s,
one retry, a 55 s budget inside `maxDuration = 60`; the page renders without waiting on the model; the
draft beacon never blocks. Real latency is measured in quickstart §7.

**Constraints**: Constitution 2.14.0 amended to 2.15.0 by this feature. The model answer never reaches the
browser before the discussion; criteria, notes and descriptions never. Neither try is ever self-marked. One
slot of `LLM_DAILY_CAP` per marked try, refunded on marker failure. Images only behind a session. Logs carry
no student text.

**Scale/Scope**: One new unit; a starter bank of five questions growing to every usable single-text question
of Questions 1 to 4 across 37 papers (an estimated 100 to 150 questions, 15 to 40 visual texts); a
class-sized user base. Deadline: Task 1 on 7 December 2026.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

Checked against `.specify/memory/constitution.md` **2.14.0**. Where 2.14.0 does not allow what the spec
requires, the amendment is listed and becomes task T001 (research R1, A1 to A6).

| Principle | Status | Notes |
|---|---|---|
| I. Answer key never reaches the browser | ⚠ amend (A3) | New key fields (criteria, notes, model answer, visual description). The model answer is released only at the discussion; verdicts, reasons, feedback and the biggest gap after a try; criteria, notes and the description never. All reads stay in `lib/grading.server.ts`. The decline route's fields (`attemptId`, `questionId`, token) and the image route's text id are added to the allowed list. A marker reply that echoes the model answer is rejected. |
| II. Signed-in students, minimal personal data | ⚠ amend (A4) | New stored items: both tries' text, seven verdicts and reasons, feedback, biggest gap, prompt version, model and ending, in `unseen_phases` (no flag). Every new route needs a session (the image route and the decline POST); all queries scoped to the session user; cascade delete and 2-year retention cover the table; the concept rule is unchanged (`clearAfter: 2` already supported). No new consent sentence. |
| III. Content is code | ✅ | Typed files under `content/units/<unit-id>/`; registered in both registries; ids `<short><yy>-q<n>` appended, never renumbered; every question carries 1 to 3 concept tags; removing a question keeps results. The unit's `images/` folder holds the cropped visual stimuli (Principle V amendment). `npm run validate:shipped` after adding the unit. |
| IV. Validation gates the build | ✅ | `validateUnseenRules` added to `lib/content-rules.ts` and `scripts/validate-content.ts` in the same change (source, text id, tags, criteria, model, suggested length, drafted-needs-review, visual check, no key text in public strings). |
| V. Syllabus fidelity, original content | ⚠ amend (A1) | Stimulus texts and cropped images are copied from school papers under the school-paper exception with a source on each question; no real HSC question or text (a `hscChecked` date per text); the "no copied images" rule gets one narrow, access-controlled exception that must be removed before the app goes commercial. Sources in `docs/y12-english-advanced-unseen-texts-research.md`. |
| VI. Grading fair, explainable, graceful | ⚠ amend (A2) | No self-marking on either try; a marker failure returns the editable box with the text and refunds the slot; the daily limit disables Submit until the next Sydney day and the question waits; a retry that cannot be marked does not end the question; the unit cannot start, resume, mark or save without the database (no guessing). Overrides the general fallback and the unweighted-draw rule for this unit only. |
| VII. Cost and abuse controls | ⚠ amend (A5) | One slot of `LLM_DAILY_CAP` per marked try, refunded on failure; per-user and per-IP limits on grade; the decline route is limited; `ENGLISH_ADV_GRADING_MODEL` is a new server-only env var; `REMARK_MODEL` is reused by scripts only and never counts against a student. Secrets read only in `lib/*.server.ts`, routes and scripts. `maxDuration` stays 60. |
| VIII. Simplicity | ✅ | No new dependency; native `<dialog>`, `fs` and `<img>`; mobile-first; tokens from `styles/tokens.css`, no colour literals. Complexity Tracking lists the choices that add files. |
| IX. Teacher access server-side | ✅ | No teacher route is added (FR-038). The offline scripts read the database directly like `delete-student`. The decline and image routes are student routes scoped by session. |

**Quality gates** (constitution "Quality Gates"): `npm run build`, `npm run lint` and `npm test` pass; no
answer-key leakage into client bundles (extended `tests/no-key-leak.test.ts` and a static scan); the client
sends only the fields Principle I allows; every new route requires a session; every results query is scoped
to the session user; no personal-data fields beyond the amended Principle II list; no renumbered question
ids; the LLM path enforces the daily cap; every question copied from a school paper shows its source (school,
year, paper type, question number), no real HSC question is included, and the only images are the cropped
visual stimuli served through the authenticated route; authorization and cost-control logic ships with
automated tests.

**Re-check after design (2026-11-19):** unchanged. The design adds one table, one index, one binary route,
one JSON route (`decline`) and one env var (`ENGLISH_ADV_GRADING_MODEL`), and the key schedule in
`contracts/api.md` matches A3.

## Project Structure

### Documentation (this feature)

```text
specs/008-english-unseen-short-answers/
├── spec.md                  # /speckit-specify (+ clarifications)
├── plan.md                  # this file
├── research.md              # R1 to R15: decisions with reasons and rejected alternatives
├── data-model.md            # content types, schema, derived data, state machine
├── quickstart.md            # manual validation and the automated gates
├── contracts/
│   └── api.md               # start/resume, grade (both tries, not-marked), decline, draft, image, marker reply
├── checklists/requirements.md
├── specify-prompt.md
└── tasks.md                 # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
content/
├── exams.ts                                      # EDIT: add "Year 12 Advanced English Task 1" (2026-12-07)
├── index.ts                                      # EDIT: register the unit (public files only)
├── answers/index.ts                              # EDIT: register the answer set
└── units/y12-english-advanced-unseen-texts/
    ├── meta.ts                                   # NEW: type "Writing Practice", draw, guide text
    ├── texts.ts                                  # NEW public: each text once
    ├── questions.ts                              # NEW public: UnseenQuestion[]
    ├── concepts.ts                               # NEW public: seven skills (clearAfter 2)
    ├── answers.ts                                # NEW server-only: AnswerSet from keys + descriptions + checks
    ├── keys.ts                                   # NEW server-only: criteria, notes, model, origins
    ├── descriptions.ts                           # NEW server-only: visual descriptions
    ├── description-checks.ts                     # NEW server-only, GENERATED by scripts/check-unseen-descriptions.ts
    └── images/*.webp                             # NEW: cropped visual stimuli (Principle V amendment); served only via the image route

lib/
├── types.ts                                      # EDIT: UnitMeta.draw, UnseenQuestion, UnseenText, Answer.unseen, Unit.texts
├── unseen/
│   ├── skills.json                               # NEW public: the seven skills (id, name, tip, description)
│   ├── skills.ts                                 # NEW public: SKILLS, skillConceptId
│   ├── rubric.json                               # NEW server-only: promptVersion, directiveVerbs, systemPrompt, userTemplate (shared with Python)
│   ├── limits.ts                                 # NEW public pure: MIN_WORDS, limitsFor, lengthState, MEDIAN_WORDS
│   ├── source.ts                                 # NEW public pure: sourceOf(paper), paperLabel(paper)
│   ├── scoring.ts                                # NEW pure: cap, recorded mark, outcomes, summary lines
│   ├── draw.ts                                   # NEW pure: weights and the seeded draw
│   ├── marker.server.ts                          # NEW: build prompt, call model, parse, echo guard, budget
│   ├── images.server.ts                          # NEW: findVisualText(textId), the image directory (one seam, mocked in tests)
│   ├── grade-handler.server.ts                   # NEW: both tries for /api/grade (slots, rows, notMarked)
│   ├── decline-handler.server.ts                 # NEW: the decline route's logic
│   ├── state.server.ts                           # NEW: build unseenState for start and resume
│   ├── start.server.ts                           # NEW: resume or draw, create the attempt, build state
│   ├── views.ts                                  # NEW: TryView / SkillView builders
│   ├── types.ts                                  # NEW public: UnseenState, UnseenGradeResult, NotMarked
│   └── log.server.ts                             # NEW: minimal metrics
├── grading.server.ts                             # EDIT: markUnseen, unseenDiscussion
├── openrouter.server.ts                          # EDIT: expose finishReason on the ok result
├── config.server.ts                              # EDIT: getEnglishAdvModel()
├── content-rules.ts                              # EDIT: validateUnseenRules
├── startAttempt.ts                               # EDIT: unseenState in the stored payload; unit-specific notices
├── drafts.ts                                     # EDIT: AttemptPayload gains unseenState
└── db/
    ├── schema.ts                                 # EDIT: unseenPhases, attempts partial unique index, SkillVerdicts
    └── queries/
        ├── unseen-phases.server.ts               # NEW: get, list, insert, finalise (retry, decline)
        ├── unseen-progress.server.ts             # NEW: answered by form, pending attempt (unit page)
        ├── attempts.server.ts                    # EDIT: createUnseenAttempt (insert or get the open attempt)
        └── history.server.ts                     # EDIT: unseen attempt detail

app/
├── api/
│   ├── attempts/route.ts                         # EDIT: unseen branch
│   ├── grade/route.ts                            # EDIT: unseen branch
│   ├── rewrite/draft/route.ts                    # EDIT: unseen branch
│   └── unseen/
│       ├── decline/route.ts                      # NEW
│       └── image/[textId]/route.ts               # NEW: authenticated image bytes
├── unit/[unitId]/page.tsx                        # EDIT: unseen branch (start button states, results by form)
├── unit/[unitId]/quiz/page.tsx                   # EDIT: unseenState for resume
├── attempts/[attemptId]/page.tsx                 # EDIT: unseen branch
└── globals.css                                   # EDIT: un-* classes beside rw-* and pg-*

components/
├── unseen/*.tsx                                  # NEW: see R12 for the list
├── Quiz.tsx                                      # EDIT: unseen branch (like the paragraph branch)
├── ConceptPanel.tsx                              # EDIT: wording for unit.draw; two pips from clearAfter
├── AttemptHistory.tsx                            # EDIT: "Fort St 2025 · Q1 · Poem" names; /N marks
└── StartQuiz.tsx                                 # EDIT: the unit's finished and unavailable notices

scripts/
├── validate-content.ts                           # EDIT: call validateUnseenRules
├── fake-openrouter.ts                            # EDIT: FAKE_UNSEEN modes, [mark:] and [miss:] directives
├── pilot-unseen-marker.py                        # EDIT: read lib/unseen/*.json, --set field, --gate, --check golden, --write-golden
├── unseen-field-cases.ts                         # NEW offline pure: field export logic
├── unseen-remark.ts                              # NEW offline: stronger-model re-mark
├── check-unseen-descriptions.ts                  # NEW offline: the pre-release description check
├── unseen-build-bank.ts                          # NEW offline: bank/*.json -> the unit's TypeScript
└── unseen-report.ts                              # NEW offline: the review report

drizzle/0006_*.sql                                # NEW migration
docs/y12-english-advanced-unseen-texts-research.md  # NEW sources (Principle V)
next.config.mjs                                   # EDIT: trace the images folder into the image route
.specify/memory/constitution.md                   # EDIT FIRST: amendments A1 to A6, version 2.15.0 (then 2.15.1)
README.md, .env.example                           # EDIT: ENGLISH_ADV_GRADING_MODEL, unit row, consent wording ("per-skill")
package.json                                      # EDIT: scripts unseen-remark, check-unseen-descriptions

tests/
├── unseen/{prompt,rubric-drift,marker-parse,limits,scoring,draw,skills,content-rules,tips,no-key-leak-static}.test.ts
├── api/{grade-unseen,attempts-unseen,decline-unseen,rewrite-draft-unseen,delete-unseen,image-unseen}.test.ts
├── client/{quiz-unseen,unseen-a11y,unseen-text}.test.tsx
├── pages/{unit-unseen,attempt-unseen}.test.tsx
├── styles/contrast.test.ts                       # EDIT
├── no-key-leak.test.ts                           # EDIT
├── fixtures/{unseen-prompt-input.json,unseen-prompt.golden.txt,unseen-rubric.hash}   # NEW (synthetic text only)
└── scripts/{unseen-flags,unseen-remark,unseen-build-bank}.test.ts
```

**Structure Decision**: The existing single Next.js app. Unseen logic sits in `lib/unseen/` and
`components/unseen/` so the paragraph and sentence units' files are untouched apart from the shared route
dispatch, and the shared files edited (`Quiz.tsx`, `ConceptPanel.tsx`, the routes, `openrouter.server.ts`)
get a branch or an additive field, not a rewrite.

## Quality Gates (tests)

The listed tests all use the existing PGlite route env (`tests/helpers`), the client test setup
(`tests/client`) and a stubbed `chatCompletion`, as `tests/api/grade-paragraph.test.ts` does.

| Requirement | Test |
|---|---|
| One question on one text per quiz; poem lines, stanza breaks, line numbers, prose paragraphs and footnotes rendered; parts shown together | `tests/client/unseen-text.test.tsx`, `tests/client/quiz-unseen.test.tsx` |
| Visual image served only when signed in, never with its description; 404 for a non-visual or unknown id; alt is not the description | `tests/api/image-unseen.test.ts`, `tests/unseen/content-rules.test.ts` |
| No key field in any response, page or static file before the discussion, for every shipped question; the model answer first at the discussion; criteria, notes and description never | `tests/no-key-leak.test.ts` (new block, every shipped question and every stage), `tests/unseen/no-key-leak-static.test.ts`, `tests/api/grade-unseen.test.ts` |
| Under 20 words and over 20% rules on client and server; 244 allowed and 245 blocked at 204 suggested | `tests/unseen/limits.test.ts`, `tests/api/grade-unseen.test.ts` (400 before any slot), `tests/client/quiz-unseen.test.tsx` |
| Marker reply parsing and retry on empty, cut-off (`finishReason: "length"`), unparseable, missing-field and echoing replies; mark, feedback, biggest gap and seven verdicts returned | `tests/unseen/marker-parse.test.ts`, `tests/api/grade-unseen.test.ts` |
| Full-mark first try goes straight to the discussion; below full gives result + retry choice, no model answer | `tests/api/grade-unseen.test.ts`, `tests/client/quiz-unseen.test.tsx` |
| Retry pre-filled with tip cards (from `skills.ts`, no model text); capped at max − 1; no third try; higher mark recorded; decline records the first try; a 1-mark question offers no retry | `tests/unseen/scoring.test.ts`, `tests/api/grade-unseen.test.ts`, `tests/api/decline-unseen.test.ts`, `tests/unseen/tips.test.ts` |
| Marker failure on either try: box returns with the text, no mark, no self-mark, slot refunded, draft saved; no tick boxes anywhere | `tests/api/grade-unseen.test.ts`, `tests/client/quiz-unseen.test.tsx` |
| Daily limit on either try: come-back-tomorrow notice, Submit disabled until the next Sydney day, the question resumes at that step and is offered first; `LLM_DAILY_CAP=0` answers marker-unavailable | `tests/api/grade-unseen.test.ts`, `tests/api/attempts-unseen.test.ts`, `tests/client/quiz-unseen.test.tsx` |
| At most two marked tries per quiz against `LLM_DAILY_CAP`; failed markings refunded; parse retries take no second slot | `tests/api/grade-unseen.test.ts` (count `dailyAiUsage` after each ending; cap = 1 and 2) |
| First-try verdicts only feed skills; all seven count whatever the tags; clear after 2; decline and retry add nothing | `tests/unseen/skills.test.ts`, `tests/rewrite/progress.test.ts` (kept green) |
| Draw offers a pending question first, never repeats an answered one, weights weak forms and uncleared skills exactly (every `r` enumerated), repeats over the whole bank once every question is answered (lowest latest mark and oldest first, never the last 3 quizzes, small-bank fallbacks, a new attempt stored, latest mark used for form averages); two tabs end on one attempt | `tests/unseen/draw.test.ts`, `tests/api/attempts-unseen.test.ts` (parallel starts) |
| Database unreadable: the unit does not start (`503`), does not mark | `tests/api/attempts-unseen.test.ts`, `tests/api/grade-unseen.test.ts` |
| No flag route and no stored flag: the unit has no student flag (the 2026-11-19 clarification) | nothing to test (the route, button and column are removed) |
| Verdicts, reasons, feedback, biggest gap, prompt version and model stored for every marked try | `tests/api/grade-unseen.test.ts` (reads `unseen_phases`), `tests/unseen/rubric-drift.test.ts` |
| Logs carry no text | `tests/api/grade-unseen.test.ts` (spy on `console.*` across a full run) |
| Content validation rules, including the visual description check, hash, suggested length and drafted-needs-review | `tests/unseen/content-rules.test.ts` (each rule has a failing and a passing fixture) |
| Delete-student and retention remove the new rows | `tests/api/delete-unseen.test.ts` |
| Resume to each state with drafts; marking never restored | `tests/api/attempts-unseen.test.ts`, `tests/client/quiz-unseen.test.tsx` |
| Live region, focus, reduced motion, 44 px targets, contrast, phone text sheet | `tests/client/unseen-a11y.test.tsx`, `tests/styles/contrast.test.ts` |
| Rubric and prompt do not drift between app and Python; the regression reads `lib/unseen/` and reports tuning, holdout and field separately; field export has no identity | `tests/unseen/prompt.test.ts` (golden), `python scripts/pilot-unseen-marker.py --check` and `--gate` (quickstart), `tests/scripts/unseen-flags.test.ts` (field-case export; the file name predates the flag's removal) |

Constitution tests (Quality Gates): "the daily cap falls back to self-marking" does not apply to this unit
(it is covered for the other units); the unit adds "marker failure returns the box, no self-mark" and "the
daily limit disables Submit on both tries"; "concept counts follow the rule" gains the clear-after-2 case
with seven outcomes.

## Complexity Tracking

| Choice | Why needed | Simpler alternative rejected because |
|---|---|---|
| New table `unseen_phases` (instead of extending `paragraph_phases`) | Seven verdicts keyed by skill, a variable maximum, `biggestGap`, `declined`/`no_retry` endings, no self-mark | `paragraph_phases` has four named criteria, a fixed 0..4 mark, `self_mark` and `no_correction`; a union table makes every paragraph query carry unseen concerns |
| `components/unseen/*` beside `components/paragraph/*` | A text panel, seven verdicts, a retry choice and a possibly-unmarkable state differ structurally; paragraph tests stay untouched | Generalising touches the paragraph unit and its tests for two shared leaf pieces |
| One shared `rubric.json` plus a public `skills.json` and a golden-file test | The Python pilot and the app must send the same prompt; the tips must reach the browser while the prompt must not | Two copies drift; a single file would put the system prompt in the client bundle |
| Authenticated image route + files under the unit | Images must reach signed-in students only, with no new dependency | `public/` is unauthenticated; object storage adds a dependency and a secret |
| Partial unique index on `attempts (user_id)` for open unseen attempts | Two tabs with a random draw must still end on one attempt | Spec 007's per-question index allows two different open questions |
| Five small offline scripts | Field-case export (a pure helper the re-mark uses), re-mark, description check, bank generator and report are each a distinct teacher task | One script with flags hides what each task reads (some read the key, some the database) and breaks the key-import allowlist's granularity |

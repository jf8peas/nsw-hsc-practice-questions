# Implementation Plan: Economics Paragraph Writing

**Branch**: `007-economics-paragraph-writing` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-economics-paragraph-writing/spec.md`

## Summary

A new Writing Practice unit, `y12-economics-paragraph-writing`, teaches a Band 6 body paragraph one
part at a time (Topic Sentence, Theoretical Mechanism, Evidence & Application, Evaluation &
Limitation, Linking Judgement). It is the paragraph-level sequel to the sentence unit (spec 005) and
reuses its machinery: one unaided try marked by an LLM, one capped correction, a discussion with a
model, missed items feeding "Things I need to know", a self-mark degrade path.

What is new, and where it lands:

- **Sequential draw.** A quiz is one part of one essay. A unit flag (`meta.sequence`) makes
  `POST /api/attempts` choose the next part from the student's results, never random or weighted. A
  partial unique index on `attempts` stops two tabs creating two attempts for one part
  ([research R1](research.md#r1-progression-fr-001-to-fr-005)).
- **Content in a server-only key.** Briefs, guidance, five model parts per essay, commentary and
  marking notes live in `essays.ts`, reachable only through `lib/grading.server.ts`, which releases
  them on a schedule that never includes later parts' models or the notes
  ([R2](research.md#r2-content-shape-fr-006-fr-007-fr-037-to-fr-040),
  [R3](research.md#r3-what-reaches-the-browser-when-fr-021-fr-023-to-fr-025)).
- **A four-criterion marker** built from the round 5 prompt. One JSON rubric is read by both the app
  and the Python pilot script; the mark, the word-limit half of criterion (d), the phase 2 cap and
  the higher-mark rule are computed in code ([R4](research.md#r4-the-marker-fr-011-fr-012-fr-018-fr-019-fr-028)).
- **New persistence.** A `paragraph_phases` table stores each phase's text, the four verdicts with
  reasons, the prompt version and the flag ([R6](research.md#r6-persistence-fr-028-fr-029-fr-035-fr-036),
  [data-model.md](data-model.md)).
- **17 writing tips** as concepts, with part tips clearing after 2 and all-parts tips after 3
  (`Concept.clearAfter`), derived from phase 1 only ([R7](research.md#r7-tip-tracking-fr-026-fr-027-fr-033)).
- **FR-019a ending.** A correction that cannot be marked (cap used or marker unavailable) ends the
  question with the first-try mark and the discussion ([R5](research.md#r5-limits-and-failure-paths-fr-019-fr-019a-fr-033-fr-034)).
- **A revision loop** of offline scripts: flag export, stronger-model re-mark, and a regression run
  over every labelled case in `pilot-essays.json` ([R8](research.md#r8-flag-and-the-offline-revision-loop-fr-029-to-fr-032-sc-003)).
- **New components** in `components/paragraph/*` beside the rewrite ones, driven by an explicit
  state machine ([R9](research.md#r9-components-and-the-question-cards-state-machine),
  [data-model.md §5](data-model.md)).
- **Constitution 2.13.0 → 2.14.0**, five amendments, applied first
  ([R12](research.md#r12-constitution-amendments-version-2130--2140-minor)).

Where `spec.md` and `design.md` disagreed, the spec won and `design.md` was corrected in this change
(see "Design corrections" below). The requirements doc linked from `design.md` could not be opened
in this session (see research.md, "Source gap"); the 17 tip sentences are drafts to confirm.

## Technical Context

**Language/Version**: TypeScript, Next.js 15 (App Router, React 19), Node 24 (dev), Python 3 for the
existing pilot script (stdlib only), as the repo.

**Primary Dependencies**: No new runtime dependency (Principle VIII): `next`, `react`,
`drizzle-orm`, Neon, Upstash, Auth.js and the existing `chatCompletion` wrapper. New dev scripts use
`tsx`, already present.

**Storage**: Neon Postgres (Sydney). One new table `paragraph_phases`, one partial unique index on
`attempts`, one migration (`drizzle/0005_*.sql`), no backfill. Drafts reuse `rewrite_drafts`. The
labelled test cases live in the gitignored `resources/topic010/pilot-essays.json`.

**Testing**: Vitest (PGlite route tests, client tests with Testing Library, pure unit tests),
`scripts/fake-openrouter.ts` for manual runs, `python scripts/pilot-paragraph-marker.py --gate` for
the marker regression. Listed under Quality Gates below.

**Target Platform**: Mobile-first web at 390 px, no sideways scroll; desktop browsers; keyboard and
screen-reader accessible; reduced-motion aware.

**Project Type**: Web application (Next.js App Router), server-rendered pages plus JSON API routes.

**Performance Goals**: Each marking call fits in the 30 s model timeout (`maxDuration` 60 on the
grade route); the page renders without waiting on the model; the draft beacon never blocks.

**Constraints**: Constitution 2.13.0 amended to 2.14.0 by this feature. Later parts' model text and
the marking notes never reach the browser. At most 2 marking slots per quiz against
`LLM_DAILY_CAP`. Logs carry no student text.

**Scale/Scope**: One new unit, 12 essays targeted (2 at first launch, grows), 5 questions per essay,
about 60 bank questions; a class-sized user base.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

Checked against `.specify/memory/constitution.md` **2.13.0**. Where 2.13.0 does not allow what the
spec requires, the amendment is listed and becomes task T001 (research R12, A1 to A5).

| Principle | Status | Notes |
|---|---|---|
| I. Answer key never reaches the browser | ⚠ amend (A1) | Spec 007 releases the brief, guidance and **earlier** parts' models *before* grading, verdicts after phase 1, and the current model at the discussion. 2.13.0 only allows the spec 005 schedule. All key reads stay in `lib/grading.server.ts`; later models and notes never leave the server; the flag route's fields (`attemptId`, `questionId`, token) are added to the allowed list. |
| II. Signed-in students, minimal personal data | ⚠ amend (A2, A3) | New stored items: per-criterion verdicts and reasons, prompt version, model slug, ending, flag. Concept rule gains a clear-after count of 2. Every new route needs a session; all queries scoped to the session user; cascade delete and 2-year retention cover the new table; consent gains one sentence about re-marking. |
| III. Content is code | ✅ | Typed files under `content/units/<unit-id>/`; registered in both registries; ids `eNNpK` appended, never renumbered; every question carries concept tags; removing a question keeps results. `npm run validate:shipped` run after adding the unit. |
| IV. Validation gates the build | ✅ | `validateParagraphRules` added to `lib/content-rules.ts` and `scripts/validate-content.ts` in the same change (five parts, limits, counterpoint anchors, no new facts, placeholders fail, public files hold no model text). |
| V. Syllabus fidelity, original content | ✅ | Original essays; economies are public-record case studies; sources in `docs/y12-economics-paragraph-writing-research.md`; no source line shown to students; no HSC questions; no images. |
| VI. Grading fair, explainable, graceful | ⚠ amend (A4) | Phase 1 failure or cap → self-mark, as 2.13.0. Phase 2 failure or cap → keep the first-try mark (FR-019a), a new rule. A sequential unit cannot start when the database is unreadable (it must not guess), also new. No error text on any LLM failure. |
| VII. Cost and abuse controls | ⚠ amend (A5) | One slot of `LLM_DAILY_CAP` per marking call, refunded on marker failure; per-user and per-IP limits on grade; new flag limiter; `maxDuration` 60. `REMARK_MODEL` is a new server-only env var read by scripts only. |
| VIII. Simplicity | ✅ | No new dependency; mobile-first; tokens from `styles/tokens.css`, no colour literals. Complexity Tracking below lists the two choices that add files. |
| IX. Teacher access server-side | ✅ | No teacher route is added (FR-032). The offline scripts read the database directly like `delete-student`. The flag route is a student route scoped by session. |

**Quality gates** (constitution "Quality Gates"): `npm run build`, `npm run lint` and `npm test`
pass; no answer-key leakage into client bundles (extended `tests/no-key-leak.test.ts`); the client
sends only the fields Principle I allows; every new route requires a session; every results query
is scoped to the session user; no personal-data fields beyond the amended Principle II list; no
renumbered question ids; the LLM path enforces the daily cap; authorization and cost-control logic
ships with automated tests.

**Re-check after design (2026-11-05):** unchanged. The design adds no table or route beyond those
named, no new env var other than `REMARK_MODEL` (scripts) and `FLAG_RATE_LIMIT` (rate limit
default), and the key schedule in contracts/api.md matches A1.

## Design corrections

`design.md` is corrected in this change wherever `spec.md` differs:

1. **§8 Discussion**: adds the FR-019a variant (summary lines, criteria ✓/✗ without pills, tip
   cards "Work on these next", no correction box, flag present, no first-try row).
2. **§12 Accessibility / §7**: the correction box (not the first-try result) takes focus with the
   caret at the end when the correction screen appears (FR-022).
3. **§7.2 Tip cards**: the "one line of advice on applying it here" is a static line per criterion
   from the shared `parts.ts`, not an essay-specific sentence (R13).
4. **§8.1 table**: adds the FR-019a and self-mark rows.
5. **§8.2 flag**: done-state wording "Flagged for your teacher".
6. **§4.1 variants**: all-essays-finished wording.

## Project Structure

### Documentation (this feature)

```text
specs/007-economics-paragraph-writing/
├── spec.md              # /speckit-specify (+ clarification)
├── design.md            # visual and wording reference (corrected here)
├── plan.md              # this file
├── research.md          # R1 to R13: decisions with reasons and rejected alternatives
├── data-model.md        # content types, schema, derived data, state machine
├── quickstart.md        # manual validation and the automated gates
├── contracts/
│   └── api.md           # start/resume, grade (both phases, FR-019a), self-mark, draft, flag, marker reply
├── checklists/requirements.md
├── mockups/             # unchanged
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
content/
├── glossary.ts                                   # NEW public: NESA verb definitions
├── exams.ts                                      # EDIT: add the Assessment Task 1 entry (2026-12-01)
├── index.ts                                      # EDIT: register the unit
├── answers/index.ts                              # EDIT: register the answer set
└── units/y12-economics-paragraph-writing/
    ├── meta.ts                                   # NEW: type "Writing Practice", sequence, guide text
    ├── questions.ts                              # NEW public: 5 ParagraphQuestions per essay
    ├── concepts.ts                               # NEW public: 17 tips (clearAfter 2 or 3)
    ├── essays.ts                                 # NEW server-only: EssayKey per essay
    └── answers.ts                                # NEW server-only: AnswerSet built from essays.ts

lib/
├── types.ts                                      # EDIT: UnitMeta.sequence, Concept.clearAfter, ParagraphQuestion, Answer.paragraph
├── paragraph/
│   ├── parts.ts                                  # NEW public: part names, limits, criterion short names, 17 tips, apply lines
│   ├── rubric.json                               # NEW server-only: promptVersion, criteria, system + user template (shared with Python)
│   ├── scoring.ts                                # NEW pure: marks, (d) rule, cap, recorded mark, outcomes
│   ├── marker.server.ts                          # NEW: build prompt, call model, parse, one retry
│   ├── grade-handler.server.ts                   # NEW: phase logic for /api/grade (slots, rows, FR-019a, self-mark)
│   ├── state.server.ts                           # NEW: build paragraphState for start and resume
│   └── log.server.ts                             # NEW: minimal metrics
├── attempts/sequence.server.ts                   # NEW pure: nextQuestion, essayProgress
├── grading.server.ts                             # EDIT: paragraphQuestionView, paragraphDiscussion, markParagraph
├── concepts/progress.ts                          # EDIT: per-concept start count (clearAfter)
├── content-rules.ts                              # EDIT: validateParagraphRules
├── ratelimit.server.ts                           # EDIT: checkFlagRateLimit
├── startAttempt.ts                               # EDIT: finished + paragraphState in the stored payload
├── drafts.ts                                     # EDIT: AttemptPayload gains paragraphState/essay
└── db/
    ├── schema.ts                                 # EDIT: paragraphPhases, attempts partial unique index
    └── queries/
        ├── paragraph-phases.server.ts            # NEW: get, list, insert, finalise, flag
        ├── attempts.server.ts                    # EDIT: createSequentialAttempt (insert or get)
        └── sequence.server.ts                    # NEW: loadEssayProgress for the unit page

app/
├── api/
│   ├── attempts/route.ts                         # EDIT: sequential branch
│   ├── grade/route.ts                            # EDIT: paragraph branch, maxDuration = 60
│   ├── results/self-mark/route.ts                # EDIT: paragraph branch
│   ├── rewrite/draft/route.ts                    # EDIT: paragraph branch
│   └── paragraph/flag/route.ts                   # NEW
├── unit/[unitId]/page.tsx                        # EDIT: essay block, start label, degraded notice
├── unit/[unitId]/quiz/page.tsx                   # EDIT: paragraphState for resume
├── attempts/[attemptId]/page.tsx                 # EDIT: paragraph branch (no key)
└── globals.css                                   # EDIT: pg-* classes beside rw-*

components/
├── paragraph/*.tsx                               # NEW: see R9 for the list
├── Quiz.tsx                                      # EDIT: paragraph branch
├── ConceptPanel.tsx                              # EDIT: pips from clearAfter; unit description string
├── AttemptHistory.tsx                            # EDIT: "Essay N · Part" names; /4 marks
└── EssayBlock.tsx                                # NEW server component for the unit page

scripts/
├── validate-content.ts                           # EDIT: call validateParagraphRules
├── fake-openrouter.ts                            # EDIT: FAKE_PARAGRAPH modes, [met:…] directive
├── pilot-paragraph-marker.py                     # EDIT: read rubric.json, report sets separately, --gate, --check golden
├── paragraph-flags.ts                            # NEW offline: list, export field cases
└── paragraph-remark.ts                           # NEW offline: stronger-model re-mark of full-mark answers

drizzle/0005_*.sql                                # NEW migration
docs/y12-economics-paragraph-writing-research.md  # NEW sources (Principle V)
.specify/memory/constitution.md                   # EDIT FIRST: amendments A1 to A5, version 2.14.0
README.md, .env.example                           # EDIT: FLAG_RATE_LIMIT, REMARK_MODEL, unit row, consent sentence

tests/
├── paragraph/{scoring,sequence,marker-parse,prompt,rubric-drift,content-rules,tips,parts}.test.ts
├── api/{grade-paragraph,self-mark-paragraph,attempts-paragraph,flag-paragraph,rewrite-draft-paragraph,delete-paragraph}.test.ts
├── client/{quiz-paragraph,paragraph-a11y}.test.tsx
├── styles/contrast.test.ts
├── no-key-leak.test.ts                           # EDIT
├── fixtures/paragraph-prompt.golden.txt          # NEW
└── scripts/{paragraph-flags,paragraph-remark}.test.ts
```

**Structure Decision**: The existing single Next.js app. Paragraph logic sits in `lib/paragraph/` and
`components/paragraph/` so the sentence unit's files are untouched apart from the shared route
dispatch, and the shared files edited (`progress.ts`, `Quiz.tsx`, `ConceptPanel.tsx`, the routes)
get a branch, not a rewrite.

## Quality Gates (tests)

The listed tests all use the existing PGlite route env (`tests/helpers`), the client test setup
(`tests/client`) and a stubbed `chatCompletion`, as `tests/api/grade-rewrite.test.ts` does.

| Requirement | Test |
|---|---|
| Next part chosen in order from recorded marks; one essay in progress; two tabs start at once give one attempt; an unfinished part is offered again with the same attempt; a bank smaller than 12 reads "Essay 1 of 2" | `tests/paragraph/sequence.test.ts` (pure), `tests/api/attempts-paragraph.test.ts` (route, parallel `Promise.all` starts, all-finished `200 finished`, db down `503`) |
| Later parts' models and marking notes in no response or page; current model not released before phase 1 is marked; earlier models shown whatever the student scored; discussion has labels only | `tests/no-key-leak.test.ts` (new block, every shipped essay and part and every stage), `tests/api/grade-paragraph.test.ts` |
| Word count shared by meter and marker; over-limit fails (d) without blocking; per-criterion results and one line each | `tests/paragraph/scoring.test.ts`, `tests/paragraph/marker-parse.test.ts`, `tests/client/quiz-paragraph.test.tsx` (meter uses `countWords`) |
| Tip cards never contain model text | `tests/paragraph/tips.test.ts`: for all shipped essays, no 30-character run of any model part, note or brief sentence appears in any tip, application line or criterion short name; the cards render only from `parts.ts` |
| Correction pre-filled and focused, capped at 3, no third try, not skippable; recorded mark is the higher try; the four outcome summaries; First try / Fixed in correction / Not met pills | `tests/paragraph/scoring.test.ts`, `tests/client/quiz-paragraph.test.tsx`, `tests/api/grade-paragraph.test.ts` (`skip` refused, phase 2 twice `409`, no phase 3) |
| FR-019a for the cap and for marker failure at phase 2; self-mark at phase 1 with ticks feeding tips; no phase 2 on self-mark | `tests/api/grade-paragraph.test.ts`, `tests/api/self-mark-paragraph.test.ts` |
| At most 2 LLM calls per quiz against `LLM_DAILY_CAP`; slot refunded on marker failure | `tests/api/grade-paragraph.test.ts` (count `dailyAiUsage` after each ending; cap = 1) |
| Verdicts, reasons, prompt version stored for every marked phase | `tests/api/grade-paragraph.test.ts` (reads `paragraph_phases`), `tests/paragraph/rubric-drift.test.ts` |
| Flag stored once, idempotent across tabs, never changes the mark; self-marked not flaggable; not-final refused | `tests/api/flag-paragraph.test.ts` |
| Part tips clear after 2, all-parts after 3, phase 1 only, phase 2 and FR-019a never feed progress, connectors never tracked, existing units unchanged | `tests/paragraph/tips.test.ts`, `tests/rewrite/progress.test.ts` (kept green) |
| Logs carry no text | `tests/api/grade-paragraph.test.ts` (spy on `console.*` across a full run) |
| Content validation rules | `tests/paragraph/content-rules.test.ts` (each rule has a failing and a passing fixture, including the placeholder regex and anchor phrases) |
| Delete-student and retention remove the new rows | `tests/api/delete-paragraph.test.ts` |
| Resume to each state with drafts; marking never restored | `tests/api/attempts-paragraph.test.ts`, `tests/client/quiz-paragraph.test.tsx` |
| Live region, focus, reduced motion, 44 px targets, contrast | `tests/client/paragraph-a11y.test.tsx`, `tests/styles/contrast.test.ts` |
| Rubric and prompt do not drift between app and Python; regression covers every case in `pilot-essays.json` and reports the sets separately | `tests/paragraph/prompt.test.ts` (golden), `python scripts/pilot-paragraph-marker.py --check` and `--gate` (quickstart), `tests/scripts/paragraph-flags.test.ts` (export has no identity) |

Constitution tests (Quality Gates): "daily cap falls back to self-marking" is covered for phase 1;
"concept counts follow the rule" gains the clear-after-2 case.

## Complexity Tracking

| Choice | Why needed | Simpler alternative rejected because |
|---|---|---|
| New table `paragraph_phases` (instead of extending `rewrite_phases`) | Verdict jsonb with reasons, 0..4 and 0..3 mark checks, prompt version, flag | `rewrite_phases` has term-specific columns and `<= 3` / `<= 2` checks; a union table makes every rewrite query carry paragraph concerns |
| `components/paragraph/*` beside `components/rewrite/*` | Four criteria with reasons, tip cards and a model-so-far differ structurally; rewrite tests stay untouched (changes to other units are out of scope) | Generalising touches the sentence unit and its tests for two shared pieces |
| One shared `rubric.json` plus a golden-file test | The Python pilot and the app must send the same prompt; the revision loop compares them | Two copies drift; the loop would then measure a prompt the app does not send |
| Partial unique expression index on `attempts` | The only race-proof way to keep one attempt per part on an HTTP driver without transactions | A position column duplicates results (Principle II: derive) |

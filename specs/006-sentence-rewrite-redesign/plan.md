# Implementation Plan: Sentence Rewrite Question Redesign

**Branch**: `006-sentence-rewrite-redesign` | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-sentence-rewrite-redesign/spec.md`

## Summary

Redesign the student experience of the sentence-rewrite question (spec 005,
[`components/RewritePanel.tsx`](../../components/RewritePanel.tsx)) as one question card with five
states — writing, marking first try, feedback + retry, marking retry, result — plus the self-mark
screen on the degrade path. The core fix: the submitted sentence stays on screen (locked block,
word count) while marking and the box is never cleared, so nothing typed is lost and a grading
error returns an editable box holding the same text. New display-only grading data is delivered by
the existing two grading calls: credited spans per term (highlighted in the student's own
sentence), phase 2 term outcomes (drive the "Added in retry" / "Not used" pills) and an optional
language note (wavy underline + note line). The result state replaces the old stack of repeats
with an outcome summary, a sentence comparison and one term table; the hint becomes "Use these
terms in your retry" cards (never mapping to the plain-English sentence); the retry box starts
pre-filled from the first try and is worth at most 2 marks, stated up front. Per the 2026-11-03
clarification, the display data and per-phase drafts are saved with the attempt so a resume on
another device restores the full result and the in-progress text (FR-053/054/055), which requires
a constitution amendment (2.12.0 → 2.13.0, Principle II storage list). The approach is in
[`research.md`](research.md); the schema and state machine in [`data-model.md`](data-model.md); the
API shapes in [`contracts/api.md`](contracts/api.md); the manual validation in
[`quickstart.md`](quickstart.md).

Grading behaviour from spec 005 is unchanged: the 3-mark criteria, the phase-2 cap of 2, hint
selection, concept tracking from phase 1 only, the self-mark rules and the two-calls-per-question
limit. Where this spec and `design.md` disagree, the spec wins and `design.md` is corrected (see
"Design corrections" below).

## Technical Context

**Language/Version**: TypeScript, Next.js 15 (App Router, React 19), Node 24 (dev), as the repo.

**Primary Dependencies**: No new runtime dependency (Principle VIII). Reuses `next`, `react`,
`react-dom`, `katex`, Upstash, Neon Postgres, Auth.js, the existing grader wrapper and the
existing `lib/drafts.ts` sessionStorage machinery. `navigator.sendBeacon` is a platform API.

**Storage**: Neon Postgres (AWS ap-southeast-2). One new nullable `jsonb` column
`rewrite_phases.display_data` and one new table `rewrite_drafts`
([`data-model.md`](data-model.md)); one new Drizzle migration, no backfill.

**Testing**: Vitest — the existing PGlite route tests (`tests/api/grade-rewrite.test.ts`,
`tests/api/self-mark-rewrite.test.ts`, `tests/attempts/resume.test.ts`), the client tests
(`tests/client/quiz-rewrite.test.tsx` — rewritten for the new wording), the no-key-leak suite and
new tests listed under Quality Gates. `npm run validate`, `npm run lint`, `npx tsc --noEmit`,
`npm test` and `npm run build` all pass.

**Target Platform**: Mobile-first web (phones at 390 px, no sideways scrolling, FR-043); desktop
browsers; keyboard and screen-reader accessible; reduced-motion aware.

**Project Type**: Web application (Next.js App Router), server-rendered pages + JSON API routes.

**Performance Goals**: Each grading call stays within the existing 20 s OpenRouter timeout; the
draft beacon is fire-and-forget and never blocks the quiz; the page renders without waiting on
the model.

**Constraints**: Constitution 2.12.0 amended to 2.13.0 by this feature (Principle II storage list
for the display data and drafts); answer key stays server-only except the existing staged hint /
discussion release — the new spans never precede a phase 1 grade (FR-044); the new data is
display-only and must never change marks or concept tracking; at most two grading calls per
question; no new runtime dependency; `styles/tokens.css` stays untouched (frozen copy).

**Scale/Scope**: One component tree (`components/rewrite/`) plus the grade route, the draft
route, the resume payload and one migration. No content, unit or grading-rule changes.

## Constitution Check

*GATE: re-checked after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Answer key never reaches the browser | ✅ | Check against 2.12.0 (research R7): the credited spans are words of the student's own sentence, delivered only with the phase's grade (never before, including on reload or resume), and the only key-derived fact they expose — that those words were target terms — is revealed at the same moment the existing scoped discussion/hint release is already allowed. No Principle I amendment is needed. Client still sends only the fields Principle I allows; the server verifies attempt ownership and every token; model sentences are never stored per result. |
| II. Signed-in students, minimal personal data | ⚠ | Amended to 2.13.0 (first task): the writing-practice storage bullet is extended with the display-only grading data (credited spans per phase, phase 2 term outcomes, language note) and the student's in-progress draft text per phase, stored in a phase row and a draft row, deleted with the student. Every route needs a session; Australian region; 2-year retention; delete path unchanged. |
| III. Content is code | ✅ | No content changes; question ids untouched. |
| IV. Validation gates the build | ✅ | No content conventions change; `npm run validate` unaffected and still runs in prebuild. |
| V. Syllabus fidelity, original content | ✅ | No content added. |
| VI. Grading fair, explainable, graceful | ✅ | Grading behaviour unchanged; a database outage still self-marks, and the draft beacon failing never blocks the quiz; the new fields are "keep-if-good, else drop" and can never change a mark. |
| VII. Cost and abuse controls | ✅ | Still at most two grading calls per question against `LLM_DAILY_CAP`; per-user/per-IP grading limits unchanged; the new draft route has its own per-user limiter (`DRAFT_RATE_LIMIT`, default 30/min) and is not AI-graded; secrets stay server-only; production fails closed. |
| VIII. Simplicity | ✅ | No new dependency; the redesign is one component folder, one new column, one small table, one draft route; tokens unchanged; the state machine is derived, not stored. |
| IX. Teacher access server-side | ✅ | No new teacher routes; every phase/draft/result query is scoped to the session user's id. |

**Quality gates** (constitution "Quality Gates"): `npm run build`, `npm run lint` and `npm test`
pass; no answer-key leakage into client bundles (a phase 1 span never names a term the student
did not use; the hint carries only missed/misused terms or the criterion; the model sentence,
"why" text and definitions appear only at the result or self-mark screen); every new route (the
draft route) requires a session; every results/phase/draft query is scoped to the session user; no
personal-data fields beyond Principle II's list (the amendment adds the display data and drafts);
no renumbered question ids; the LLM path enforces the daily cap; authorization and cost-control
logic ships with automated tests (the spec's Testing section, below).

### Amendment (first task)

Amend `.specify/memory/constitution.md` from **2.12.0 → 2.13.0** (MINOR: materially expanded
guidance in Principle II):

- **Principle II**, extend the writing-practice storage bullet to read:
  > - per writing-practice question in an attempt: the phase 1 and phase 2 sentences, their
  >   marks, the per-term outcomes from phase 1, and the feedback shown, plus the display-only
  >   grading data (the credited spans for each phase, the phase 2 term outcomes and any language
  >   note), stored in a phase row until the question is final and kept for the attempt detail
  >   page; and the student's in-progress draft text for each phase, stored in a draft row only
  >   until the question is final; all deleted with the student like results. The display data
  >   and drafts never change marks or concept tracking, which always come from the phase 1
  >   outcomes.
- Update the version to **2.13.0**, the Last Amended date to **2026-11-03**, the amendment log
  (modified principle: II; reason: the 2026-11-03 clarification requires the display data and
  per-phase drafts saved with the attempt so a resumed result and the typed text are restored) and
  the Sync Impact Report (templates: 005's docs unaffected; this feature's docs created with the
  amendment in mind).

## Project Structure

### Documentation (this feature)

```text
specs/006-sentence-rewrite-redesign/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification (final, incl. the 2026-11-03 clarification)
├── design.md            # Visual reference (corrected where the spec wins — see below)
├── research.md          # Phase 0: the 10 design decisions
├── data-model.md        # Phase 1: schema, display-data types, drafts, state machine
├── quickstart.md        # Phase 1: manual validation guide
├── contracts/
│   └── api.md           # Phase 1: grade responses, draft route, resume payload, self-mark
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
components/
├── rewrite/                      # NEW folder for the five-state machine's sub-components
│   ├── RewritePanel.tsx          # NEW: the five-state + self-mark machine (replaces the
│   │                             #       current RewritePanel.tsx, which is deleted)
│   ├── RewriteStepTracker.tsx    # NEW: <ol aria-label="Steps"> (FR-002, FR-037)
│   ├── PlainEnglishBlock.tsx     # NEW: the PLAIN ENGLISH block (FR-003)
│   ├── LockedSentence.tsx        # NEW: "Your sentence" / "Your retry" locked block (FR-007/018)
│   ├── MarkingStatus.tsx         # NEW: progress bar + timed status list + live region (FR-008/009)
│   ├── FirstTryResult.tsx        # NEW: FIRST TRY + feedback + "Your first try" spans (FR-013/014)
│   ├── HintCards.tsx             # NEW: "Use these terms…" / "What to fix" (FR-015/016)
│   ├── RetryBox.tsx              # NEW: pre-filled retry box + focus-at-end (FR-017, R9)
│   ├── OutcomeSummary.tsx        # NEW: recorded mark + outcome line + focus (FR-024/025)
│   ├── SentenceComparison.tsx    # NEW: YOUR RETRY / MODEL SENTENCE + language note (FR-026/027)
│   ├── TermTable.tsx             # NEW: "The three terms" table with statuses (FR-028)
│   ├── FirstTryCollapsed.tsx     # NEW: <details> first-try row (FR-019/029)
│   └── SelfMarkScreen.tsx        # NEW: the degrade path in the new layout (FR-037)
└── Quiz.tsx                      # rewrite branch: pass new display/draft props; draft beacons

lib/
├── grading.ts                    # RewriteGradeResult + creditedSpans / phase2TermOutcomes /
│                                 #   languageNote types (optional)
├── grading.server.ts             # gradeRewriteAnswer(): span validation, phase2TermOutcomes,
│                                 #   language-note validation, display_data for resume
├── openrouter.server.ts          # buildRewriteMessages(): FR-013 + criterion-shaped feedback +
│                                 #   spans/note instructions; parseRewriteJson(): tolerant parse
├── drafts.ts                     # wire the existing rewrite draft keys; beacon helper
├── db/schema.ts                  # rewrite_phases.display_data + rewrite_drafts table
├── db/queries/rewrite-phases.server.ts  # select/save display_data
├── db/queries/rewrite-drafts.server.ts  # NEW: upsert/read/clear drafts (scoped to user)
├── ratelimit.server.ts           # NEW draft limiter instance (DRAFT_RATE_LIMIT)
└── wordcount.ts                  # unchanged

app/
├── api/grade/route.ts            # write/extend display_data; clear the graded phase's draft;
│                                 #   rewriteResultFromRow carries the display fields
├── api/rewrite/draft/route.ts    # NEW: POST — save/clear a phase draft (sendBeacon target)
├── unit/[unitId]/quiz/page.tsx   # resume: join rewrite_drafts + display_data into rewriteState
└── attempts/[attemptId]/page.tsx # unchanged (research R10)

app/globals.css                   # add the rw-* classes only (tokens.css untouched)
scripts/fake-openrouter.ts        # rewrite branch returns spans + the "fromm" language note
drizzle/                          # one new migration (display_data + rewrite_drafts)
tests/                            # updated + new route, client, resume and no-key-leak tests
```

**Structure Decision**: single Next.js project following the existing layout; the rewrite
sub-components live in a new `components/rewrite/` folder (research R1); styles are `rw-`
prefixed classes in the existing `globals.css` (research R2). The old `RewritePanel.tsx` is
replaced by the folder's `RewritePanel.tsx`.

## Design corrections (spec wins)

Changes to `design.md` in the same change, per the spec's reference rule:

1. (Already applied during the spec review.) §8.1 outcome table, "Phase 2 = 2" line 2: "Get all three on the first try next time for the
   full 3." → **"Use every term on the first try next time for the full 3."** (spec FR-024; the
   mockup's wording is superseded).
2. (Already applied during the plan review.) §3.2 "Always at the top of the card under the tracker" → "*In every state except the result
   state*" (spec FR-003 excludes the result state; §8 already says the block is not repeated).
3. §6.1 feedback example stays "Two more terms would make your sentence more precise." — spec
   FR-013 allows naming credited terms ("You named protection.") which the example does; design
   and spec agree; no change.

## Complexity Tracking

> Filled because the Constitution Check has a violation that must be justified.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Principle II: the phase row stores the display-only grading data, and a new draft row stores the in-progress draft text | The 2026-11-03 clarification (FR-053/FR-054/FR-055) requires the full result and the typed text to be restored on resume from another device or a reload; the result screen is driven entirely by spans/outcomes/note, so without persisting them a resumed result would lose the highlights, the pills and the language note, and a half-edited retry would be lost across devices. The data is display only, never changes marks or concept tracking, and is deleted with the student. | Keeping the data client-side in sessionStorage would survive only a same-tab reload and fails FR-053's "saved with the attempt" for another device; a signed client-held token (as spec 005 R2 rejected for the phase row) does not survive to another device either. |
| Principle II: students' in-progress draft sentences are stored server-side | Per-phase drafts are the student's own typed text — the same kind of data Principle II already permits for the submitted sentences — and are required for cross-device resume of the feedback + retry box (FR-053). The draft route is fire-and-forget, separate from grading, and the row is cascade-deleted with the student. | sessionStorage only (option (c) in research R5.2) fails the cross-device clause of FR-053; saving the draft only at submit time loses the in-progress retry text entirely. |

## Testing (Quality Gates)

The spec's Testing requirements, mapped to the suite (see `quickstart.md` for the manual pass):

- submitted sentence stays visible and the box is never cleared while marking, both phases
  (FR-045); a grading error returns an editable box holding the text (FR-011/FR-045); the retry
  box starts pre-filled with the first-try sentence (FR-046);
- the hint never contains a plain-English mapping and the plain-English sentence is never
  highlighted (FR-047); the four outcome lines (3/3, capped retry at 2, retry below 2, phase 1
  beating phase 2 with the real phase 1 mark) and the one/two/three-term wording (FR-048);
- term statuses from the phase outcomes, including a term correct in phase 1 and dropped in
  phase 2 staying "First try"; spans not found in the sentence are not highlighted (FR-049);
  concept results still from phase 1 only and phase 2 outcomes never reach progress or the draw
  (FR-050); still at most two grading calls per question (FR-035/FR-029);
- no key field before the phase 1 grade, including on resume (FR-023/FR-037 of spec 005);
  resume to each state with the draft restored and the display data restored (FR-055);
- the self-mark screen in the new layout (FR-051); the live region and result focus
  (FR-009/FR-025/FR-040); reduced motion (FR-041); existing rewrite tests updated to the new
  wording (FR-052); 390 px layout and 44 px targets covered by the audit in quickstart.md
  (FR-042/FR-043);
- the draft route (constitution: authorization and cost-control logic ships with tests): 401
  without a session or with another student's attempt token; 404 for a question not in the
  attempt or not a rewrite question; 429 over `DRAFT_RATE_LIMIT`; 503 with the database down and
  the quiz unaffected; a stale beacon for a phase already graded, or after the attempt is
  completed, writes nothing (`200 { saved: false }`); the grade route clears the graded phase's
  draft and deletes the draft row when the question is final (including after a self-mark save);
  drafts are only ever returned to their owner's quiz page; deleting the student removes the
  draft rows (cascade);
- `DRAFT_RATE_LIMIT` is documented with the other environment variables in README.md.

# Implementation Plan: Case Study Facts: China and Nepal

**Branch**: `012-economics-case-study-facts` (name only; work is on `main`, uncommitted) | **Date**: 2026-11-28 |
**Spec**: [spec.md](spec.md)

**Beside this plan**: [research.md](research.md) (decisions), [data-model.md](data-model.md) (exact content shapes),
[quickstart.md](quickstart.md) (validation), [content-prompt.md](content-prompt.md) (the question-writing session). No
`contracts/`: no request, response or table changes.

## Summary

A new topic-quiz unit, `y12-economics-case-study-facts`: 48 original questions from one fact file (9 in each multiple-choice pool, 10 in each short-answer pool), in five
pools, one drawn from each pool per attempt. **Release 1 (live Mon 30 Nov)** is content plus four small code changes:

1. an opt-in unseen-first draw for this unit;
2. case-facts rules in the validator (coverage, traceability, source line, pool sizes);
3. a one-line fix so a tagged but not concept-ready unit shows no "to review" pill on the home page;
4. two local scripts: the fact-check tracer and the marker sample.

**Release 2 (after Tue 1 Dec)** adds "Things I need to know" with hand-written notes, a shape-preserving weighted
draw, a switch that keeps AI concept content off, and the constitution amendment.

## Technical Context

**Language/Version**: TypeScript 5.7, Node 24, Next.js 15 (App Router), React 19

**Primary Dependencies**: existing only; none added

**Storage**: Neon Postgres, unchanged: no migration, no new stored data

**Testing**: Vitest 5 with PGlite route tests

**Target Platform**: Vercel (`syd1`); students on phones (390 px)

**Project Type**: web application, single Next.js project

**Performance Goals**: one extra results query when an attempt of this unit starts, within the existing 1.5 s limit

**Constraints**: Release 1 live by the evening of Mon 30 Nov 2026; content and fact check done Sun 29 Nov; Mon daytime
for the maintainer's read; minimum Release 1 code; the sandbox cannot reach OpenRouter, so marker runs are local

**Scale/Scope**: 48 questions, 13 concepts, 67 facts; one unit

## Constitution Check

Checked against version 2.18.0, before research and again after design (no change).

| Principle | R1 | R2 | Notes |
|---|---|---|---|
| I. Answer key never reaches the browser | ✅ | ⚠ amend | R1: `factIds` in the server-only key; nothing new released. R2: concept notes need the new bullet (research §1), applied in the same change |
| II. Signed-in students, minimal data | ✅ | ✅ | No new route or stored field |
| III. Content is code | ⚠ | ⚠ clarify | "No quiz question is written by an LLM" is read as runtime generation (spec 002 FR-040); questions are drafted at authoring, validated and read by the maintainer. See Complexity Tracking |
| IV. Validation gates the build | ✅ | ✅ | New rules go into `validate-content` in the same change |
| V. Syllabus fidelity, original content | ✅ | ✅ | Original questions; fact file and README document sources; no HSC question; no diagram |
| VI. Grading fair, graceful | ✅ | ✅ | Marker, self-mark and cap unchanged; unreadable results mean a random quiz |
| VII. Cost and abuse controls | ✅ | ✅ | Same paid path and cap; R2 switches AI concept generation off for this unit |
| VIII. Simplicity | ✅ | ✅ | No dependency, screen, route or env var |
| IX. Teacher access server-side | ✅ | ✅ | The new history read is scoped to the session user |

**Quality gates**: full chain through Git Bash; `tests/no-key-leak.test.ts` extended to this unit; no renumbered ids;
tests for the draw (including another student's results having no effect). Post-design re-check: unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/012-economics-case-study-facts/
├── spec.md, specify-prompt.md, plan-prompt.md, checklists/
├── plan.md, research.md, data-model.md, quickstart.md, content-prompt.md
├── fact-check.md        # content task output, checked by script
├── marker-cases.json    # content task output
└── tasks.md             # the task list (/speckit-tasks)
docs/y12-economics-case-study-facts-research.md   # the fact file; commit it
```

### Source Code (repository root)

```text
content/units/y12-economics-case-study-facts/     # CONTENT TRACK only
    meta.ts build.ts concepts.ts concept-tags.ts questions.ts answers.ts explanations.ts
content/index.ts, content/answers/index.ts        # register (last)
content/shipped-ids.json                          # after the read
lib/types.ts                                      # drawUnseenFirst, factIds
lib/attempts/draw.server.ts                       # drawUnseenFirst
app/api/attempts/route.ts                         # load history for opting-in units
lib/concepts/progress.ts                          # review counts: concept-ready units only
lib/case-facts/fact-file.ts, trace.ts             # new: parser, number tracing
lib/content-rules-case-facts.ts                   # new: the rules
scripts/validate-content.ts                       # source line; call the rules
scripts/check-case-facts.ts, case-facts-marker-check.ts   # new
package.json                                      # case-facts:check, case-facts:marker-check
README.md                                         # units row; drawUnseenFirst
tests/case-facts/{fact-file,content-rules,trace}.test.ts
tests/attempts/draw-unseen-first.test.ts
tests/api/attempts-case-facts.test.ts
tests/concepts/review-counts.test.ts, tests/no-key-leak.test.ts   # extended
```

**Structure Decision**: the existing single project. The two tracks share no file, so they can run in two sessions
in one working tree. The unit skeleton and meta (a code item) are step 1 of the content task, so that only one
session ever writes the unit folder.

## Delivery order

The task list, with IDs, dependencies and who does each, is [tasks.md](tasks.md). Phases 1 to 6 are **Release 1**;
7 and 8 are **Release 2**.

| When | Content track | Code track |
|---|---|---|
| Sat 28 evening | T002 skeleton, T012 on | T001, T003–T011 types, parser, rules, check script, validator |
| Sun 29 daytime | T013–T016 keys, explanations, tags, marker cases | T018–T020, T023–T028 marker script, pill fix, draw |
| Sun 29 evening | T017 fact check, second pass | T021, T022, T029, T030 register, leak test, README, chain |
| Mon 30 early | T031 marker sample (you) | fix anything it finds |
| Mon 30 daytime | T032 your read | T033 fixes |
| Mon 30 by 17:00 | | T034 ids, full chain; T035 you commit and deploy |
| Mon 30 evening | T036 phone check (you) | |

**Impact lines** (added 28 Nov): the parser map, its test, the FR-028 rules and the trace exclusion fit inside
T003–T011 on Saturday evening; the schedule is unchanged.

If Sunday slips, content comes first: the code is a few hours' work. Nothing ships unread (FR-032). A bad question
is fixed or rewritten, not dropped (a pool under 8 fails validation).

**Release 1** (T001–T036): the 40 questions, the checks, the unseen-first draw, the home page count fix, your read and
the deploy. **Release 2** (T037–T051): the shape-preserving weighted draw, the AI-content switch, concept notes, the
constitution amendment and the full marker check, switched on in one deploy.

## Testing (Quality Gates)

| Requirement | Where |
|---|---|
| 5 questions in group order | draw test; route test |
| 8 attempts, 40 different (also with answers saved through the real grade route) | draw test over many seeds; route test |
| Then least recently answered first (attempt 9 equals attempt 1's set) | draw test; route test |
| Drawn but unanswered stays unseen | route test |
| Database down: 201, random, right shape, `persisted: false`; history query alone fails: 201, saved | route test |
| Another student's results change nothing | route test |
| No other unit's draw changes | draw test over every unit; one-off baseline (T023, T028) |
| Validator failures (seven asked, plus source and concept) | case-facts rules test |
| Impact lines: one per fact, no unknown ID, no digit; never a source of values | fact-file and trace tests |
| No key field before marking | `no-key-leak.test.ts` |
| No review pill in Release 1 | review-counts test |

Route tests use a synthetic five-pool unit through the existing `fixtureContent()` helper, so the code track does not
wait for the content.

## Risks

| Risk | Response |
|---|---|
| Content or read runs late | Content starts tonight without waiting for code; the check script lands tonight; the read has Monday daytime to itself |
| Marker accepts an outside figure (its prompt invites it) | Notes say "only this figure"; case 7 tests it; a prompt change is your call |
| Wrong figure found after release | Edit the text in place (ids unchanged), rerun §1 and §4, redeploy |
| Fact file left out of the commit | Validator fails the Vercel build; quickstart §4 lists it |
| Two sessions editing at once | File ownership above; the final chain runs after both stop |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle III, last bullet, if read literally: Claude Code drafts the 48 questions | The spec requires original questions in two days | Hand-writing 48 questions with keys and explanations does not fit the timetable. The app generates nothing; validation, tracing and the maintainer's read gate the text. The wording is clarified in the Release 2 amendment (or now, as 2.18.1, if you prefer) |

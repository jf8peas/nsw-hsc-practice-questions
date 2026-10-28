# Implementation Plan: Learn From Mistakes

**Branch**: `002-learn-from-mistakes` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-learn-from-mistakes/spec.md`

## Summary

Every question in a unit gets a concept tag. From the results spec 001 already stores, a pure
function replays each student's answers in the order they were given and works out, per concept,
how many more correct answers are needed (a wrong answer sets 3, a correct one takes 1 away, 0
clears). The unit page shows the student's uncleared concepts as "Things you need to know", below
"Start quiz". Every normal quiz in a concept-ready unit gives exactly half its places (rounded
up) to questions on those concepts, drawn from the existing bank.

Each concept has a shared, LLM-written summary and, when useful, an SVG illustration. Nothing is
shown to students until an independent reviewer model has approved it. The work runs in the
background after the student opens the page, so the page never waits, with one automatic
regeneration on a failed review, and a flag for the teacher when it fails twice. A separate global
daily cap bounds the cost. MC questions in finished units also show a written reason for the
student's wrong option. Teachers review and regenerate content on an allow-listed page and fix
flagged items in the backend.

The technical approach, in short (reasons in [research.md](research.md)):

- **Content is code**: `concepts.ts` per unit, a `concept` field on each public question,
  `conceptsReady` / `explanationsComplete` markers in `meta.ts`, and `wrongExplanations` keyed by
  option text in the server-only `answers.ts`. The validator checks all of it (R1).
- **Progress is derived, never stored**: `lib/concepts/progress.ts` replays results ordered by
  `(created_at, id)`. Late saves keep their answer time by passing the receipt's issue time (R2).
- **Weighted draw**: `drawAttempt` takes an optional `weighting`; round-robin across concepts,
  unseen first, exact half beating the MC/short mix; unweighted when the database is unreadable (R4).
- **Pipeline in the background**: a client POST starts `after()` work behind a database lease, so
  there is one generation per concept; pending content is retried on the next visit (R5, R6).
- **Atomic promotion**: the slot row holds `live_version_id` and `replacement_version_id`;
  promotion is one statement, so students can only ever read approved content (R9).
- **Illustrations**: SVG from a text model, sanitised, stored in Postgres, shown only via `<img>`
  from a session-protected route; reviewed as a rendered picture (R7).
- **Teacher access**: one `lib/admin.server.ts` reads `ADMIN_EMAILS`; page and routes both check (R10).

## Technical Context

**Language/Version**: TypeScript 5.7 (strict), React 19, Next.js 15.5 App Router, Node 22 on Vercel

**Primary Dependencies**: existing only, plus one new runtime dependency, `@resvg/resvg-js` 2.6.2
(MPL-2.0), to render an SVG to a picture for the reviewer. Allowed by constitution 2.9.0, Principle VIII.
OpenRouter via the existing `fetch` pattern; no new SDK.

**Storage**: Neon Postgres (Sydney) through Drizzle and the HTTP driver (no interactive
transactions). Three new tables and one index (see [data-model.md](data-model.md)); one new SQL
migration in `drizzle/`. No columns added to `users`, `attempts` or `results`.

**Testing**: Vitest, route handlers called directly with PGlite running the committed migrations,
an injected fake model port. See *Testing* below.

**Target Platform**: Vercel, Node functions in `syd1`. The two routes that run the pipeline set
`maxDuration = 60` and use `after()`. Phones are the main client.

**Project Type**: Web application (single Next.js project)

**Performance Goals**: the unit page adds at most two indexed queries (concept progress, approved
content); the ensure and status routes answer in under 300 ms because the model work happens after
the response; stored content shows with no generation delay (SC-003); the weighted draw adds one
indexed query to `POST /api/attempts` and falls back after the existing 1500 ms database timeout.

**Constraints**: a database or model outage never blocks practice (Principle VI); at most 100
concept model calls per Sydney day by default (R8); students see only `approved` content; no new
per-student or per-attempt data (FR-058); mobile-first with Start quiz above the concept list.

**Scale/Scope**: five units today, a few dozen concepts each, so roughly 100 to 200 concepts and
under 400 slot rows. Tens to a few hundred results per student per unit. Content rollout (tagging,
concept lists, explanations) is unit by unit and is content work, not a code task.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against constitution 2.9.1 (`.specify/memory/constitution.md`). ✅ meets it, ⚠ meets it
only on a stated reading or with a justified exception (see Complexity Tracking), n/a not
affected.

### Principles

| Principle | Status | Notes |
|---|---|---|
| I. Answer key never reaches the browser | ✅ | Answer-key material is read only through `getOptionExplanation` and `getReviewMaterial` in `lib/grading.server.ts`; `content/answers` stays `server-only` and nothing else imports it (test). Wrong-option explanations are sent only after answering, for the chosen option only, never stored per result. Summaries cannot reproduce answers (pre-check + reviewer). Public files gain only the concept tag and readiness markers. New non-answer routes take only a unit, concept or version id or an item kind, which Principle I allows since 2.9.0. |
| II. Signed-in students, minimal personal data | ✅ | No new per-student or per-attempt field; progress is derived. Every new page and route requires a session; teacher routes are allow-listed. Concept tables hold no user id, answer or name. The slot's lease, retry-after and last error, and each version's origin and attempt number, are pipeline bookkeeping that Principle II allows since 2.9.0. |
| III. Content is code | ✅ | Question ids untouched. Concept ids are namespaced, permanent and validated. `retired` tombstones keep a removed question's concept so FR-006 and FR-008 both hold (R3). Units adopt markers one at a time; unmarked units are unchanged. Quiz questions come only from the bank. |
| IV. Validation gates the build | ✅ | `scripts/validate-content.ts` is extended in the same change (tags, concept ids, tombstones, explanations, marker consistency); rules live in a pure `lib/content-rules.ts` with unit tests. |
| V. Syllabus fidelity, original content | ✅ | Summaries are original text generated from the concept description and the unit's public question prompts, and checked by the reviewer against the answer key. No copyrighted material is committed. Each unit's documented sources are unchanged; the concept list for the pilot unit comes from its research document. |
| VI. Grading fair, explainable, graceful | ✅ | No change to grading. Generation or review failure, an unset or equal reviewer, a used-up cap and an unreadable database all fall back to one-line descriptions and an ordinary or unweighted quiz, with no error. MC explanations work on the degraded path. |
| VII. Cost and abuse controls | ✅ | Separate global daily concept cap, atomic reservation, refund on a failed call; generation only in the four allowed cases (nothing stored, teacher regeneration, the single automatic regeneration, retry of a pending review); per-student rate limit on the ensure route; new settings are server-only and optional, so production fail-closed is unchanged; illustrations only via `<img>`. |
| VIII. Simplicity | ✅ | One new runtime dependency, `@resvg/resvg-js`, allowed by Principle VIII since 2.9.0. No state library, no queue, no blob store. Start quiz stays above the concept list. Styles from `styles/tokens.css`. |
| IX. Teacher access server-side | ✅ | `lib/admin.server.ts` is the only reader of `ADMIN_EMAILS`; the page and every admin route check it on the server, and a missing or empty list admits nobody. Results queries stay scoped to the session user. Teacher-only fields never reach a student response. |

### Quality gates

| Gate | Status | How it is met |
|---|---|---|
| `npm run build`, `npm run lint`, `npm test` pass | ✅ | Planned; run before merge (quickstart). |
| No answer-key leakage into client bundles | ✅ | Only `lib/grading.server.ts` imports `content/answers` (test); explanations and review material are server-side; extends `tests/no-key-leak.test.ts`. |
| Client sends only the fields Principle I allows; server verifies attempt ownership and every token or receipt | ✅ | Grading, self-mark and retry routes are unchanged in what they accept and verify. New routes send only a path id or `conceptId` / `kind`, as Principle I allows since 2.9.0. |
| Secrets read only in permitted server-side locations | ✅ | New settings are read only in `lib/*.server.ts` and `app/api/**`; nothing is `NEXT_PUBLIC_`; `OPENROUTER_BASE_URL` is ignored in production. |
| Retention endpoint meets Principle II | ✅ | Unchanged; concept tables hold no student data. |
| Every new route requires a session | ✅ | All new routes and pages call `authenticate()` / `requirePageUser()` (directly or via the admin helpers); the existing route-guard test scans them and is extended to recognise the admin helpers (`authenticateAdmin`, `requireAdminPage`). |
| Every results query scoped to the session user (or `ADMIN_EMAILS`) | ✅ | The progress and weighting loaders take the session user id; no client id is accepted; the teacher page reads concept content only, not results. |
| No new personal-data fields beyond Principle II | ✅ | None added (FR-058); the schema test pins that no concept table has a user column. |
| No renumbered question ids | ✅ | No ids change; tombstones keep removed ids. A committed `content/shipped-ids.json` snapshot is checked by `validate`: a removed or renumbered question id fails the build unless it is tombstoned, and a removed concept id always fails. |
| LLM path enforces the daily cap | ✅ | Short-answer grading cap untouched; the concept path has its own (next row). |
| No MC explanation in any client bundle | ✅ | Explanations live in `answers.ts` (server-only) and travel only in a post-answer response. |
| Illustrations rendered only through `<img>` | ✅ | `<img src alt>` from a session-protected route; no inline HTML or SVG anywhere. |
| Concept generation enforces its own cap | ✅ | `daily_concept_usage`, atomic reservation before every model call. |

### Testing gate

| Required test | Status | Where |
|---|---|---|
| Students can only read their own results | ✅ | `tests/concepts/progress-db.test.ts`, existing history tests |
| Admin routes reject non-allowlisted emails | ✅ | `tests/api/admin-concepts.test.ts` |
| Production fails closed when auth or database config is missing | ✅ | Existing `tests/auth/middleware.test.ts`, plus a case that the new optional settings do not change it |
| Daily cap falls back to self-marking | ✅ | Existing `tests/api/grade-cap.test.ts`, extended to show the concept cap does not touch it |
| Concept cap falls back to descriptions only | ✅ | `tests/concepts/pipeline.test.ts`, `tests/api/concepts-ensure.test.ts` |
| Concept counts follow the rule | ✅ | `tests/concepts/progress.test.ts` |
| Regenerate route rejects non-allowlisted emails | ✅ | `tests/api/admin-concepts.test.ts` |
| An item that fails review twice is never shown to students | ✅ | `tests/concepts/pipeline.test.ts`, `tests/concepts/visibility.test.ts` |
| Accessibility target | n/a | No target is set (constitution TODO). Illustrations have alt text and `<details>` is keyboard-operable. |

### Re-check after design

The design in research.md, data-model.md and contracts/ keeps every ✅ above and adds no new ⚠.
Two points were examined: the verified-email claim in the session token (R10) is a cookie claim,
not a stored field, so Principle II is unaffected; and `OPENROUTER_BASE_URL` is a server-only
setting that production ignores, so Principle VII is unaffected. Open items that need your
decision are listed at the end of research.md and repeated under *Open items* below.

## Project Structure

### Documentation (this feature)

```text
specs/002-learn-from-mistakes/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1 to R14 and open items
├── data-model.md        # Phase 1: tables, invariants, state transitions
├── quickstart.md        # Phase 1: local setup and how to verify each area
├── contracts/
│   ├── api.md           # New and changed routes
│   └── llm.md           # What each model call is given and must return
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

New (+) and changed (~) files. Everything stays in the single Next.js project.

```text
app/
├── admin/concepts/page.tsx                               + teacher review page
├── api/
│   ├── attempts/route.ts                                 ~ weighted draw
│   ├── grade/route.ts                                    ~ optionExplanation on wrong MC
│   ├── results/retry/route.ts                            ~ created_at from receipt iat
│   ├── units/[unitId]/concepts/ensure/route.ts           + start background work
│   ├── units/[unitId]/concepts/status/route.ts           + cheap poll
│   ├── concepts/[conceptId]/illustration/route.ts        + student SVG, live approved only
│   └── admin/concepts/
│       ├── regenerate/route.ts                           + teacher regeneration
│       └── [conceptId]/illustration/route.ts             + teacher preview of any version
├── attempts/[attemptId]/page.tsx                         ~ current explanation for wrong MC
└── unit/[unitId]/page.tsx                                ~ "Things you need to know"

assets/fonts/NotoSans-Regular.ttf                         + bundled font for rendering (OFL)
components/
├── ConceptPanel.tsx                                      + server: <details> per concept
├── ConceptLive.tsx                                       + client: ensure once, poll, refresh
├── RegenerateButton.tsx                                  + client: teacher button
└── Quiz.tsx                                              ~ show optionExplanation

content/
├── index.ts                                              ~ attach concepts to each Unit
└── units/<unit-id>/
    ├── concepts.ts                                       + per unit as it adopts concepts
    └── meta.ts, questions.ts, answers.ts                 ~ markers, tags, explanations (content work)

content/shipped-ids.json                                  + snapshot of shipped question and concept ids
docs/teacher-queries.sql                                  ~ flagged_concept_content, concept_generation_usage
drizzle/0001_*.sql                                        + migration (tables + index)

lib/
├── admin.server.ts                                       + ADMIN_EMAILS check
├── background.server.ts                                  + runInBackground over after()
├── content-rules.ts                                      + pure validator rules (also used by tests)
├── concepts/
│   ├── progress.ts                                       + pure replay, ordering
│   ├── weighting.server.ts                               + load results for the draw
│   ├── store.server.ts                                   + slots, versions, lease, promote, cap
│   ├── pipeline.server.ts                                + generate, review, regenerate, flag
│   ├── llm.server.ts                                     + prompts, parsing, port
│   └── svg.server.ts                                     + allowlist check, render to PNG
├── attempts/draw.server.ts                               ~ weighting
├── grading.ts / grading.server.ts                        ~ optionExplanation; getOptionExplanation,
│                                                           getReviewMaterial
├── openrouter.server.ts                                  ~ shared chatCompletion, OPENROUTER_BASE_URL
├── config.server.ts                                      ~ concept settings
├── results/save.server.ts, db/queries/results.server.ts  ~ optional createdAt
├── db/schema.ts                                          ~ three tables, one index
├── auth.callbacks.server.ts, session.server.ts           ~ verified-email claim
└── types.ts                                              ~ Concept, concept on Question, markers

scripts/
├── validate-content.ts                                   ~ uses content-rules
├── approve-concept.ts                                    + teacher promotes a flagged item
└── fake-openrouter.ts                                    + local model stand-in

next.config.mjs                                           ~ serverExternalPackages, tracing include
package.json, package-lock.json                           ~ @resvg/resvg-js, new npm scripts
.env.example, README.md                                   ~ new settings and structure
tests/                                                    + see Testing
```

**Structure Decision**: keep the single-project layout. All server logic is under
`lib/concepts/*.server.ts` (secrets rule), the only pure logic that the browser could import is
`lib/concepts/progress.ts` (no answer key, no secrets), and routes stay thin.

## Testing

Route handlers are called directly with PGlite and the committed migrations. The pipeline takes an
injected model port, the draw takes an injected `rand`, and `runInBackground` is awaited, so no
test uses the network or timers.

| Suite | Covers |
|---|---|
| `tests/concepts/progress.test.ts` | the count rule, never below 0 or above 3, clear at 0, return at 3, ordering and ties, partial credit and self-marks, current-tag lookup, tombstones, two students independent, replay in answer order |
| `tests/concepts/progress-db.test.ts` | the loader is scoped to the session user; late saves keep answer time (receipt `iat`); the new index is used |
| `tests/attempts/draw.test.ts` (extended) and `draw-weighted.test.ts` | unchanged behaviour with no weighting; exactly half rounded up; fewer candidates than half; unseen first; round-robin spread; highest count first; mix kept only when it does not cost weighted places; 3-prompt unit; unit not ready; no uncleared concepts |
| `tests/api/attempts-weighted.test.ts` | route integration; database unreadable gives an unweighted quiz that still starts; attempt token and response shape unchanged |
| `tests/concepts/store.test.ts` | lease claim is exclusive under concurrent calls, expires; atomic promotion; only one replacement; cap reservation atomic, refund, Sydney day |
| `tests/concepts/pipeline.test.ts` | pass; fail then pass on the retry; fail twice flagged; reviewer unset, equal to generator, or down leaves pending; cap exhausted makes no calls; backoff; deadline stops cleanly; pre-check overlap; separate text and illustration outcomes; teacher regeneration keeps the live version |
| `tests/concepts/visibility.test.ts` | students read only approved live content; a version that failed twice is never returned by any student path; the illustration route returns 404 for any other version |
| `tests/concepts/svg.test.ts` | allowlist accepts a good diagram and rejects scripts, hrefs, styles, oversize; rendering produces a PNG |
| `tests/api/concepts-ensure.test.ts` | session required; only the student's own uncleared concepts; rate limit; cap reached leaves descriptions and AI marking still works; no work for a `failed_review` version |
| `tests/api/admin-concepts.test.ts` | non-allowlisted, empty list, unverified email and signed-out callers are refused on the page, regenerate route and preview route; allowlisted teacher succeeds; reasons never appear in student responses |
| `tests/api/grade-explanation.test.ts` | wrong MC gets the chosen option's explanation; correct gets none and no other option leaks; unit not explanations-complete gets none; degraded path; `409` path |
| `tests/no-key-leak.test.ts` (extended) | attempt payload and pages contain no explanation text; only `lib/grading.server.ts` imports `content/answers` |
| `tests/content-rules.test.ts` | each validator rule, good and bad fixtures, unmarked units untouched |
| `tests/db/schema.test.ts` (extended) | no concept table has a user column; check constraints |
| `tests/teacher-queries.test.ts` (extended) | the two new queries run as written |
| `tests/client/concept-live.test.tsx` | ensure called once; polling stops when not pending, on hidden tab and after 3 minutes; refresh once per version change |
| `tests/auth/route-guard.test.ts` (extended) | its guard pattern also accepts `authenticateAdmin(` and `requireAdminPage(`, then it covers the new routes automatically |

## Implementation order (input to `/speckit-tasks`)

1. Schema, migration, types, content rules and validator, `content/index.ts` attachment, a synthetic
   fixture. (Stories 1, 5 foundations.)
2. `progress.ts`, results ordering fix, the new index, unit page list without content. (Story 1.)
3. Weighted draw and the attempts route. (Story 4.)
4. MC explanations: `grading.server.ts` functions, grade and retry changes, `Quiz.tsx`, attempt
   page. (Story 5.)
5. Store, cap, lease, `llm.server.ts`, pipeline, summaries only; ensure and status routes;
   `ConceptLive`. (Stories 2, 3, 7.)
6. Illustrations: sanitiser, renderer, illustration generation and review, student route. (Stories
   2, 7.)
7. Admin guard, verified-email claim, teacher page, regenerate and preview routes, flagged-items
   query, `approve-concept.ts`. (Story 6.)
8. Docs and settings: README, `.env.example`, `fake-openrouter.ts`, quickstart check.
9. Content rollout, one unit at a time, starting with the pilot unit. (Content work.)

## Complexity Tracking

No violations. The three exceptions in the first draft (CT-1 `@resvg/resvg-js`, CT-2 resource ids on
non-answer routes, CT-3 pipeline bookkeeping) were resolved by constitution 2.9.0.

## Open items

Items 1 to 3 are settled. Items 4 to 7 use the defaults shown and can still change. Full reasoning
is at the end of [research.md](research.md).

1. **Retired questions and tags** (R3): decided. Tombstones in `concepts.ts` (`null` before a unit is
   tagged), recorded in FR-006 and FR-008.
2. **Rasteriser dependency**: decided, `@resvg/resvg-js` (constitution 2.9.0).
3. **Constitution wording**: decided, amended in constitution 2.9.0 and 2.9.1.
4. **Admin hardening** (R10): `email_verified` required; existing teachers sign in once more.
5. **Draw preference order** (R4): mix before unseen.
6. **Cap default** (R8): 100 model calls per day.
7. **Pilot unit**: `y11-economics-preliminary`.

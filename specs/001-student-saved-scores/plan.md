# Implementation Plan: Signed-In Students with Saved Scores

**Branch**: `001-student-saved-scores` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-student-saved-scores/spec.md`

## Summary

Every page and API route becomes sign-in only (Google, via Auth.js v5). Each graded answer is saved
to Neon Postgres (Sydney) against the student's account, grouped into server-drawn quiz attempts
that can be resumed on any device. Students see their own history on the unit page, a `/progress`
page and an attempt detail page. A per-student daily cap limits AI-graded short answers, falling
back to self-marking. The teacher works from documented SQL queries, a delete-student script and
an automatic 2-year retention job. The class-code gate and `localStorage` scores are retired.

The technical approach, in short (reasons in [research.md](research.md)):

- **Sessions**: JWT, no adapter, so no Google tokens are stored; a per-request lookup confirms the
  `users` row exists (a deleted student's session dies immediately).
- **Draw moves server-side**: `POST /api/attempts` ports `prepare()` out of `components/Quiz.tsx`
  and stores the ordered question ids and MC option order on the attempt.
- **Grade and save in one request**: `/api/grade` verifies attempt ownership, grades as today,
  inserts the result idempotently, and on a failed or slow save returns the mark plus an
  HMAC-signed receipt that the client retries from a small `localStorage` outbox.
- **Cap in Postgres**: one atomic upsert reserves a daily AI slot before the LLM call and refunds
  it if the LLM fails.
- **Fail closed**: in `NODE_ENV=production`, missing auth or database config makes middleware
  return 503 for everything.
- **Database outage does not block practice**: a signed attempt token carries the user, attempt id,
  question list and MC option order, so a quiz can start and `/api/grade` can mark MC (and ask for a
  self-mark on short answers) from the session JWT and the token alone. Results are queued as signed
  receipts that also carry the attempt fields; the retry creates the attempt and saves each result
  exactly once. Pages show a history-unavailable notice, never a 500 (research R19).

## Technical Context

**Language/Version**: TypeScript 5.7 (strict), React 19, Next.js 15 App Router, Node 22 on Vercel
(local Node 24 works)

**Primary Dependencies**: existing: `next`, `react`, `react-dom`, `katex`, `@upstash/ratelimit`,
`@upstash/redis`. New runtime: `next-auth@5.0.0-beta.32`, `drizzle-orm`,
`@neondatabase/serverless`. New dev: `drizzle-kit`, `vitest`, `@electric-sql/pglite`, `eslint`, `eslint-config-next`, `@eslint/eslintrc`, `@next/env`. All
justified under Complexity Tracking.

**Storage**: Neon Postgres, AWS `ap-southeast-2`; schema in `lib/db/schema.ts`, SQL migrations in
`drizzle/`. Browser: `localStorage` outbox (cache), `sessionStorage` drafts. Upstash Redis unchanged
(rate limit only, optional).

**Testing**: Vitest (`npm test`); route handlers called directly with PGlite running the committed
migrations; `server-only` aliased out. See Testing below.

**Target Platform**: Vercel (Node functions in `syd1`, middleware on the edge runtime, one Vercel
Cron). Phones are the main client.

**Project Type**: Web application (single Next.js project)

**Performance Goals**: saving adds no noticeable delay (SC-003): extra p95 latency on `/api/grade`
of at most about 150 ms in-region, enforced by a 1500 ms save timeout that falls back to a
receipt rather than waiting.

**Constraints**: no model answers or rubrics stored (Principle I); only the Principle II fields
stored; production fails closed; MC grading never capped or rate limited; no HTTP-driver
transactions (every critical write is one atomic statement or safely repeatable).

**Scale/Scope**: a school cohort (tens to low hundreds of students); a few thousand results per
week; five units today. No sharding or caching layer is warranted.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* Checked against
constitution v2.3.0.

| Principle | Status | Notes |
|---|---|---|
| I. Answer key never reaches the browser | ✅ | Answer key, `server-only` import and "only `lib/grading.server.ts` imports it" are unchanged. The client sends only `questionId`, `answer`, `attemptId` with its signed attempt token, and on self-mark the binary `correct` flag with its signed token, and on retry the signed receipt; never a user id, marks, max marks or grading method. The server verifies attempt ownership and every token/receipt's signature, expiry and binding before acting ([contracts/](contracts/)). Stored data excludes model answers and rubrics. |
| II. Signed-in students, minimal data | ✅ | Stored fields are exactly the permitted list ([data-model.md](data-model.md)); no adapter tables, no tokens, no photo; AU region; 2-year activity-based retention job; delete script. The retention endpoint is the only unauthenticated route besides sign-in and the auth callback: it requires the `CRON_SECRET` bearer (constant-time check), rejects other callers, only deletes, and returns counts only. Consent before launch is a launch checklist item in [quickstart.md](quickstart.md). |
| III. Content is code | ✅ | Question ids are text keys in `results`/`attempts` with no FK to content; retired questions keep their rows. No renumbering. |
| IV. Validation gates the build | ✅ | `npm run validate` unchanged and still in `prebuild`. No new content convention is introduced. A route-guard test (R2) is the equivalent gate for the new "every route requires a session" rule. |
| V. Syllabus fidelity, original content | ✅ | No content changes. |
| VI. Grading fair, explainable, graceful | ✅ | MC: instant, server-side, no cap, no rate limit. Short: LLM failure, no key, and daily-cap all fall back to `needsSelfMark`. Results saved for MC and short; a database failure never blocks (receipt + outbox). Cap exceeded is the same code path as LLM failure. A database outage is handled by the degraded mode in research R19 (a quiz can start, MC is marked from the signed attempt token, short answers are self-marked and never count against the cap, results are queued as receipts that recreate the attempt on retry, pages show a notice). |
| VII. Cost and abuse controls | ✅ | Class-code gate retired as decided. Daily cap + per-user + per-IP limits added. Fail closed in production; dev-login only outside production. Secrets are read only in `app/api/**`, `lib/*.server.ts`, `middleware.ts` (auth config only; never `OPENROUTER_API_KEY`), `drizzle.config.ts` and `scripts/**` (local/CI/deploy only), none with `NEXT_PUBLIC_`. |
| VIII. Simplicity | ✅ | Neon and Auth.js are the justified dependencies; Drizzle (ORM) and dev tools justified in the table below. Mobile-first and `styles/tokens.css` kept. `localStorage` used only as a cache. |
| IX. Teacher access server-side | ✅ n/a | No in-app teacher pages in this feature. Student scoping is by session user id on every query (never a client id), which satisfies the student half of the principle. |

**Quality gates**: `npm run build`, `npm run lint` and `npm test` required (build also runs
`gen:formulas` and `validate`). Constitution check items: no answer-key leakage (tests assert
no key fields in any response or stored row); every new route requires a session (R2 test); every
results query scoped to the session user; no personal-data fields beyond Principle II's list
(schema test asserts the column set); no renumbered ids; the LLM path enforces the daily cap.

**Gate result**: PASS with no exceptions.

### Post-design re-check

Design is complete in [research.md](research.md), [data-model.md](data-model.md) and
[contracts/](contracts/). Re-evaluation: no new violations appeared in design. Two design choices
were made specifically to *keep* compliance: signed tokens instead of a pending-self-mark table
(Principle II: no extra server state) and JWT sessions without an adapter (no stored tokens). The
status above stands.

The amendment recommended during planning was adopted in constitution v2.2.0.

## Project Structure

### Documentation (this feature)

```text
specs/001-student-saved-scores/
├── plan.md              # This file
├── research.md          # Phase 0: decisions and alternatives
├── data-model.md        # Phase 1: tables, constraints, state
├── quickstart.md        # Phase 1: run, verify, production setup
├── contracts/
│   ├── api.md           # Phase 1: routes and pages
│   └── tokens.md        # Phase 1: receipt and self-mark token formats
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
middleware.ts                      # NEW  JWT-presence redirect, fail-closed 503
eslint.config.mjs                  # NEW  the repo had no ESLint setup; `npm run lint` is a gate
vercel.json                        # NEW  regions: ["syd1"], weekly cron
drizzle.config.ts                  # NEW
drizzle/                           # NEW  committed SQL migrations
vitest.config.ts                   # NEW

app/
├── signin/page.tsx                # NEW  data notice + Google (+ dev login)
├── api/
│   ├── auth/[...nextauth]/route.ts   # NEW
│   ├── attempts/route.ts             # NEW  POST: server-side draw
│   ├── grade/route.ts                # CHANGED  attempt-scoped, saves, receipt, cap
│   ├── results/retry/route.ts        # NEW
│   ├── results/self-mark/route.ts    # NEW
│   ├── cron/retention/route.ts       # NEW
│   └── unlock/                       # REMOVED
├── progress/page.tsx              # NEW
├── attempts/[attemptId]/page.tsx  # NEW  attempt detail
└── unit/[unitId]/
    ├── page.tsx                   # CHANGED  history, best/latest, resume, empty state
    └── quiz/page.tsx              # CHANGED  loads attempt by id

components/
├── Quiz.tsx                       # CHANGED  server-drawn questions, display-index MC,
│                                  #          outbox, drafts, no class-code UI
├── Shell.tsx                      # CHANGED  adds UserMenu
├── UserMenu.tsx                   # NEW  identity + sign out
├── StartQuiz.tsx                  # NEW  client button: POST /api/attempts then navigate
├── AttemptHistory.tsx             # NEW
└── UnitStatsPanel.tsx             # REMOVED (localStorage stats)

lib/
├── auth.config.ts                 # NEW  edge-safe Auth.js config (no DB)
├── auth.server.ts                 # NEW  providers, callbacks, requireUser, dev login
├── config.ts                      # NEW  configProblems(env); plain module, imported by middleware
├── config.server.ts               # NEW  parsed env values (getConfig)
├── db/
│   ├── schema.ts                  # NEW
│   ├── index.server.ts            # NEW  Neon + Drizzle client
│   └── queries/*.server.ts        # NEW  users, attempts, results, history (all user-scoped)
├── attempts/
│   ├── draw.server.ts             # NEW  ported from Quiz.tsx prepare()
│   └── complete.server.ts         # NEW  finalizeIfComplete
├── tokens.server.ts               # NEW  HKDF + HMAC receipts, self-mark and attempt tokens
├── usage.server.ts                # NEW  reserve / refund daily AI slot
├── retention.server.ts            # NEW  delete-by-cutoff with injectable now
├── ratelimit.server.ts            # CHANGED  per-user + per-IP, key prefixes
├── grading.server.ts              # CHANGED  display-index MC; reserve/refund hooks
├── grading.ts                     # CHANGED  new request/response shapes
├── stats.ts                       # NEW  pure: percent, best, latest, trend
├── sydney.ts                      # NEW  next Sydney midnight, formatting
├── outbox.ts, drafts.ts           # NEW  client: localStorage outbox, sessionStorage drafts
├── gate.server.ts                 # REMOVED
└── scores.ts                      # REMOVED

scripts/
├── migrate.ts                     # NEW  npm run db:migrate
└── delete-student.ts              # NEW  npm run delete-student -- <email>

docs/teacher-queries.sql           # NEW
tests/                             # NEW  see Testing
```

`package.json` gains scripts `test`, `db:generate`, `db:migrate`, `delete-student`, `vercel-build`.
README and `.env.example` are updated as part of this feature (class code removed; auth, database,
cap, rate-limit, cron and retention documented).

**Structure Decision**: keep the single Next.js project and its existing folders (`app/`,
`components/`, `lib/`, `content/`, `scripts/`, `docs/`). New server-only code goes in `lib/**/*.server.ts`
so the `server-only` guard applies. No new top-level packages. `content/answers` is still imported
only by `lib/grading.server.ts`.

## Testing

Vitest, run by `npm test`. Required tests (each maps to a success criterion in the spec):

| Test | Covers |
|---|---|
| Own-results scoping on every route and page query: attempts, grade, retry, self-mark, `/progress`, attempt detail. Student B using student A's attempt id gets 404 and nothing leaks | SC-002, FR-016 |
| Route-guard scan: every `page.tsx` and `route.ts` calls `requireUser` or is on the reviewed public allowlist | SC-007, FR-001 |
| Signed-out requests: pages redirect to `/signin`; `/api/*` returns 401; deleted-user session returns 401/redirect | SC-007, FR-027 |
| Production fail-closed: with each of `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL` missing, middleware returns 503; dev login absent in production | SC-010, FR-029 |
| Daily cap: N concurrent reservations never exceed the cap; an LLM failure refunds; over-cap returns `needsSelfMark` with the reset time; MC unaffected; empty answer not counted | SC-006, FR-017–019 |
| Idempotent retry: the same receipt twice inserts one row; tampered, expired, wrong-user receipts rejected | FR-007, FR-009 |
| Self-mark rejections: no token, wrong user, wrong question, wrong answer hash, MC question, already answered, expired token | FR-006 |
| Retention cut-off at exactly 2 years: a student at `2 years` is kept, one second older is deleted; `GREATEST` over answer, sign-in, creation; never-answered account | SC-009, FR-025 |
| Completion: all-answered completes; retired drawn question skipped; client cannot complete | FR-032 |
| Draw: group order, shorts-first, counts, no-`quiz` unit; MC order stored and honoured on grading | R14 |
| Trend and best/latest: table-driven cases including incomplete attempts excluded | FR-012, FR-013 |
| No key leakage: responses and stored rows contain no `modelAnswer`/rubric text beyond what `/api/grade` returns after submitting; schema has only permitted columns | Principle I, II |
| Database fully unreachable (calls time out at 1500 ms or fail to connect): a student can start an attempt (`persisted: false`), grade MC, get `needsSelfMark` for a short answer with no LLM call and no cap use, self-mark, and receive receipts; when the database returns, retries create the attempt and each result exactly once; a receipt for a deleted or missing user is discarded; pages render the history-unavailable notice, never a 500; row-missing with the database up still returns 401; non-degraded API routes return 503, not 401; a non-connection error is an ordinary 500 | Principle VI, SC-004, R19 |
| Same question answered from two devices: one row, the second gets 409 with the stored mark; expired or foreign attempt token rejected | edge case, FR-007 |
| Typed-answer draft is stored, restored and cleared; kept across the sign-in redirect | FR-028 |
| Migrations apply cleanly from empty (PGlite) | R3 |

Other code may have tests but they are not required (constitution Quality Gates).

## Complexity Tracking

No constitution violations: the Constitution Check passes against v2.3.0 without exceptions.

New dependencies (Principle VIII requires a written justification):

| ID | Dependency | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|---|
| C1 | `next-auth@5.0.0-beta.32` (Auth.js v5) | Google sign-in, CSRF-safe sign-out, JWT sessions, middleware helper. Constitution already names it. Pinned exactly because v5 is published under the `beta` tag | Hand-rolled OAuth is security-critical code to own; v4 is for the Pages Router and lacks first-class App Router support |
| C2 | `drizzle-orm`, `@neondatabase/serverless`, dev `drizzle-kit` | Typed queries, committed SQL migrations, an HTTP driver that suits serverless. This is the "ORM" justification Principle VIII asks for | Raw SQL strings give no schema or migration tooling and invite scoping mistakes; Prisma adds a heavy runtime and generated client |
| C3 | Dev only: `vitest`, `@electric-sql/pglite` | Constitution now requires tests for authorization and cost-control logic. PGlite runs the real migrations and real Postgres SQL (atomic upsert, `GREATEST`, time zones) in-process with no network | Mocking the database would not test the SQL that enforces the cap and retention; a hosted test database needs credentials and network in CI |
| C4 | Dev only: `eslint`, `eslint-config-next`, `@eslint/eslintrc`, `@next/env` | `npm run lint` is a constitution gate but the repo has no ESLint setup, so it cannot pass today; `@next/env` lets `drizzle.config.ts` and `scripts/*` read `.env.local` the same way Next does | Dropping the lint gate would weaken the constitution; hand-parsing `.env.local` duplicates Next's loader |
| C6 | Dev only: `jsdom`, `@testing-library/react`, `@testing-library/dom`, `server-only` | The browser side of the quiz (requests sent, outbox, session-expiry prompt, offline mode) is where bugs are least visible, so `tests/client/quiz.test.tsx` renders the real component in jsdom. `server-only` is the React marker package the code already imports; Next resolves it internally, but scripts run by `tsx --conditions=react-server` (the delete-student command) need it installed | Untested UI code; or copying server logic out of `.server.ts` files into the scripts |
| C5 | Postgres row for the daily cap instead of Upstash | One atomic statement, no extra service dependency, queryable by the teacher | Upstash would work but splits "AI usage today" between two stores |

## Planning risks and open items

- **Auth.js v5 is a beta**: pinned exactly; upgrade deliberately. Mitigation if it stalls: the
  auth surface used (Google provider, JWT callbacks, middleware wrapper) is small.
- **Preview data**: previews must not branch from production data (research R11). A setup
  checklist item, not code; verify in the Neon console.
- **PGlite concurrency**: single connection, so the cap test proves the SQL, not true contention.
- **Consent and a deletion owner** are launch blockers outside the code (quickstart step 5).
- **Degraded mode trade-off**: during a genuine outage a deleted student's still-valid session can obtain marks (nothing is saved for them). Accepted; the row check applies whenever the database can be read.
- **ESLint**: not set up in the repo today; added as a Setup task so the lint gate can pass.
- **Next 15 `middleware.ts`**: Next 16 renames it to `proxy`; handle when moving to Next 16.
- **Accessibility target** is still undecided (constitution TODO); the new pages follow the
  existing components and token styles.

## Implementation notes (deviations from the plan as written)

Recorded after implementation so the plan stays honest:

- **Test config** is `vitest.config.mts` (the `.ts` form warned about ESM-in-CommonJS) and enables JSX
  compilation (`oxc.jsx.runtime: "automatic"`) because `tsconfig.json` keeps `jsx: "preserve"` for Next.
- **Access decisions** live in `lib/access.ts` (`decideAccess`, `safeCallbackUrl`) and `middleware.ts` calls
  them, instead of an Auth.js `authorized` callback. This keeps the rules testable without the edge runtime.
- **`lib/api-auth.server.ts`** (`authenticate()`) wraps `requireUser` for API routes with no degraded path and
  maps the outcomes to 401 / 503. The route-guard test accepts `requireUser`, `requirePageUser`, `authenticate()`
  and, for the routes that need the session state, `resolveSession`.
- **Rate limiting** was rewritten once (user, IP and attempt limiters share `checkRateLimit`) when the attempts
  route needed it, so the User Story 4 rate-limit task was largely done in User Story 2. The interim class-code
  gate was kept until the daily cap landed, then deleted.
- **`reserveAiSlot`** returns the reserved slot (`{ userId, sydneyDate }`) or `null`, not a boolean, so a refund
  hits the same Sydney day even if midnight passes during the LLM call.
- **History** lists only attempts with at least one saved answer, and "Continue attempt" is offered only for an
  unfinished attempt that has at least one answer.
- **`results.attempt_id`** has only the composite foreign key `(attempt_id, user_id)`; a separate plain foreign
  key on `attempt_id` would be redundant.
- **Teacher query "wrong MC option"** identifies multiple-choice rows as `graded_by = 'auto'` with a non-empty
  `answer`, because no question-type column is stored (Principle II field list).
- **The delete-student command** runs as `tsx --conditions=react-server`, so the `server-only` marker resolves
  to its empty module outside Next.
- **Reviewed against constitution v2.9.1 and spec 002** (while implementing spec 002): the stored personal-data
  fields are unchanged and nothing here conflicts. Updated for accuracy: the `created_at` semantics of a late-saved
  result (`data-model.md`, `contracts/tokens.md`), the new `(user_id, unit_id, created_at, id)` index, the "other
  server-side state" wording (`research.md`, `contracts/tokens.md`), and the "no teacher pages" assumption in
  `spec.md` (spec 002 adds one teacher page for concept content). The route-guard test also accepts
  `authenticateAdmin()` and `requireAdminPage()` now.
- **Not done in code** (manual launch work): measuring SC-003 in a deployed Preview, the full quickstart in a real
  browser against real Google and Neon, and the launch checklist. See `tasks.md`.

# Research: Signed-In Students with Saved Scores

Decisions that were open in the planning brief, plus the technical choices that need a recorded
reason. Versions were checked against the npm registry on 2026-10-26.

## R1. Sessions: JWT, no database adapter

- **Decision**: Auth.js v5 with `session: { strategy: "jwt" }` and **no adapter**. The JWT carries
  only our internal `users.id` (`uid`). The `signIn`/`jwt` callbacks upsert the `users` row by
  Google `sub` and set `last_sign_in_at`.
- **Rationale**: Constitution Principle II forbids storing Google tokens beyond what the session
  needs. The standard Drizzle adapter creates `account` rows holding access, refresh and ID
  tokens, and `session` rows. A custom `users` table with no adapter stores exactly the allowed
  fields. FR-027 (a deleted student's session stops working) is met by a per-request user lookup
  (R2), not by session rows.
- **Alternatives**: database sessions via adapter (rejected: token storage, extra tables, and a
  per-request lookup anyway); adapter with token columns nulled (rejected: fighting the library).
- **Settings**: `maxAge` 30 days, `updateAge` 1 day. A session therefore rarely expires mid-quiz,
  but FR-028 is still handled (R12).

## R2. Every request confirms the user row exists

- **Decision**: `requireUser()` in `lib/auth.server.ts` reads the session, then does one indexed
  `SELECT id FROM users WHERE id = $uid`. No row means "signed out": pages redirect to `/signin`,
  API routes return 401. It is wrapped in React `cache()` so a page render pays for one lookup.
- **Where it runs**: in **every** `page.tsx` and `route.ts` (except the public ones), not only in a
  layout. App Router layouts are not re-rendered on client navigation, so a layout-only check
  would miss a deleted student. Middleware does only the cheap JWT-presence redirect (edge-safe,
  no DB).
- **Enforcement**: a Vitest test scans `app/**/page.tsx` and `app/**/route.ts` and fails if a
  file neither imports `requireUser` nor appears on a short, reviewed public-route allowlist.
  This keeps "every new route requires a session" true as the app grows.
- **Row missing vs database unavailable**: a lookup that returns no row means "signed out" (refuse). A lookup that raises `DbUnavailableError` (a 1500 ms timeout or connection failure) means "unavailable". `/api/attempts`, `/api/grade` and `/api/results/self-mark` then use the degraded mode (R19), pages render a history-unavailable notice, and other routes answer 503 `temporarily_unavailable`, never 401, so the client does not prompt for sign-in during an outage.
- **Re-sign-in after deletion**: the old JWT's `uid` no longer matches; signing in again upserts a
  new `users` row with a new id and a fresh `created_at`, so the person is a new student
  (FR-027).

## R3. Database: Neon Postgres over HTTP, Drizzle, committed SQL migrations

- **Decision**: `@neondatabase/serverless` (HTTP) with `drizzle-orm/neon-http`. Schema in
  `lib/db/schema.ts`. `drizzle-kit generate` writes SQL migrations to `drizzle/`, committed and
  reviewed in PRs. Tests apply the same migration files to an in-process PGlite database.
- **Rationale**: HTTP driver suits Vercel functions (no connection pool to manage, fast cold
  start). Drizzle gives typed queries and migrations without a heavy runtime. Committed SQL
  keeps schema changes reviewable, in line with Principle III ("content is code") and IV.
- **Constraint accepted**: the HTTP driver has no interactive transactions. Every critical
  operation is therefore designed as one atomic statement (R5, R6) or as idempotent steps that
  are safe to repeat. Anything that would need `db.batch` is avoided so the same query code runs
  on PGlite in tests.
- **Alternatives**: Prisma (rejected: heavier runtime and generated client); raw SQL via the
  Neon driver (rejected: no typed schema or migration tooling, more hand-written glue);
  Vercel Postgres (retired in favour of Marketplace Neon).
- **Region**: create the Neon project in `aws-ap-southeast-2` (Sydney) and set the Vercel function
  region to `syd1` in `vercel.json`, so the app-to-database hop is in-region. Preview branches
  inherit the project's region.

## R4. Migrations run on deploy, not on every build

- **Decision**: `npm run db:migrate` (a small script using the Drizzle migrator). A new
  `vercel-build` script runs `npm run db:migrate && npm run build`. Vercel uses `vercel-build`
  when it exists; local `npm run build` never migrates.
- **Rationale**: putting migration in `prebuild` would migrate whatever database `.env.local`
  points at, including production, from a laptop. Migrations are written backwards-compatible
  (add before use, remove after) so the old code keeps working while the new deploy goes live.

## R5. Daily AI cap: a Postgres row, atomic upsert

- **Decision**: table `daily_ai_usage(user_id, sydney_date, count)`. Reserve with one statement:

  ```sql
  INSERT INTO daily_ai_usage (user_id, sydney_date, count)
  VALUES ($1, (now() AT TIME ZONE 'Australia/Sydney')::date, 1)
  ON CONFLICT (user_id, sydney_date)
  DO UPDATE SET count = daily_ai_usage.count + 1
  WHERE daily_ai_usage.count < $2
  RETURNING count;
  ```

  A returned row means the slot is reserved. No row means the cap is reached. Refund is
  `UPDATE ... SET count = GREATEST(count - 1, 0)`. The Sydney date comes from the database clock,
  so the day boundary is DST-correct and matches the teacher query for "today".
- **Why Postgres, not Upstash**: one source of truth that already exists; the statement is atomic
  without a Lua script; the count is queryable by the teacher query (FR-021); and it needs no
  extra environment variables. Upstash stays only for rate limiting, where approximate counting
  is fine.
- **When it is reserved**: only for a non-empty short answer when the LLM grader is configured,
  immediately before the LLM call. Refunded if the call returns nothing (failure or fallback).
  An empty answer scores 0 without calling the LLM and never touches the cap.
- **Known gap**: if the function is killed between reserve and refund, one slot leaks for that
  day. This errs on the side of the cap (SC-006) and is accepted.
- **Cap value**: `LLM_DAILY_CAP`, default 40; a non-number or negative falls back to 40; `0`
  turns LLM grading off for everyone.
- **Message**: the "returns at midnight Sydney time" text is built from the next Sydney midnight
  calculated with `Intl.DateTimeFormat` (`Australia/Sydney`), so it is DST-aware.

## R6. Saving results: one idempotent statement, then a bounded wait

- **Decision**: `INSERT INTO results ... ON CONFLICT (attempt_id, question_id) DO NOTHING
  RETURNING id`. After it, `UPDATE users SET last_answer_at = GREATEST(last_answer_at, now())`,
  then the completion check (R7). Each step is safe to repeat, so a partial failure heals on retry.
- **Latency (SC-003)**: the save is awaited inside `/api/grade` but raced against a 1500 ms
  timeout. On timeout or error the route still returns the mark plus a signed receipt (R8), and the
  write may still land; the retry insert is a no-op if so.
- **Alternatives**: Next `after()` to save after responding (rejected: the student could not be
  told reliably when a save is lost, and the brief wants a receipt path); a write queue
  (rejected: new infrastructure for a small app).

## R7. Completion is decided on the server

- **Decision**: after a result is inserted, `finalizeIfComplete(attempt)` compares the attempt's
  drawn question ids that **still exist in current content** with the question ids that have
  results; if every one is covered it runs
  `UPDATE attempts SET completed_at = now() WHERE id = $1 AND completed_at IS NULL`.
- **Resume path**: opening a unit also runs the check for the latest incomplete attempt. If a
  question was retired since and everything left is answered, the attempt is completed rather
  than offered for resume.
- **All drawn questions retired**: treated as complete with 0 marks available, and not offered.

## R8. Result receipts and self-mark tokens: stateless HMAC

- **Decision**: three signed tokens, `base64url(JSON payload) + "." + base64url(HMAC-SHA256)`,
  keys derived from `AUTH_SECRET` with HKDF and distinct labels (`receipt`, `selfmark`, `attempt`), compared
  with `timingSafeEqual`. No new secret to manage.
  - **Receipt**: `{ v, uid, attemptId, attempt, questionId, answer, marks, max, gradedBy,
    feedback, hits, misses, iat, exp }`, expiry 7 days. Issued only when a save failed.
    `attempt` is `{ unitId, questionIds, mcOptionOrder, issuedAt }` copied from the attempt token so a
    retry can create a missing attempt row (R19).
  - **Self-mark token**: `{ v, uid, attemptId, questionId, answerHash, iat, exp }`, expiry 2 hours.
    Issued whenever grading returns `needsSelfMark`.
- **Why stateless**: Principle II limits other server-side state to rate-limit and cap counters.
  A "pending self-mark" table would be new state. The token proves the grader asked for a
  self-mark without storing anything.
- **Security properties**: the server never trusts a user id or marks from the client; a receipt
  or token is valid only for the `uid` in its payload, which must equal the session user; replays
  hit the `ON CONFLICT DO NOTHING` insert and are harmless. The one client-supplied mark is the
  binary `correct` flag on self-mark, bounded to `0` or `maxMarks` taken from content.
- **Accepted behaviour**: if a save failed, the student can call `/api/grade` again for the same
  question because "no result exists yet". The first insert wins on retry. This costs the student
  a cap slot and gives no advantage, and it only arises when our database is failing.

## R9. Rate limiting

- **Decision**: per-user per-minute limit as the primary (`GRADE_RATE_LIMIT`, default 20), plus a
  looser per-IP backstop (`GRADE_IP_RATE_LIMIT`, default 150) because schools share addresses.
  Both use the existing Upstash-or-memory limiter in `lib/ratelimit.server.ts`, with separate key
  prefixes. Upstash is created in `ap-southeast-2` if used, because the keys contain student ids and IP addresses (Principle II region rule). They apply only to the short-answer path, as today (Principle VI: MC is never rate
  limited). `POST /api/attempts` gets a small per-user limit (`ATTEMPT_RATE_LIMIT`, default 20
  per minute) so a signed-in client cannot grow the table unchecked.
- **Order on a short answer**: validate → per-user limit → per-IP limit → reserve cap → LLM.

## R10. Access control and fail-closed configuration

- **Decision**: `middleware.ts` (Auth.js `auth` wrapper) redirects unauthenticated page requests
  to `/signin?callbackUrl=...` and returns 401 JSON for `/api/*`. Public matcher entries: `/signin`,
  `/api/auth/*`, Next static assets and icons, and `/api/cron/retention` (secret-protected, see the
  Complexity Tracking table).
- **Fail closed**: `configProblems(env)`, in a plain `lib/config.ts` (not a `server-only` module, because the edge middleware imports it), returns the list of missing required variables
  (`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL`, and `CRON_SECRET` for the
  cron route). When `NODE_ENV === "production"` and the list is non-empty, middleware returns
  `503 Service not configured` for every request except static assets, and logs the variable names
  server-side only. The check is **per request, not at import time**, so `next build` (which runs
  with `NODE_ENV=production` but no secrets in CI) still succeeds.
- **Why `NODE_ENV` and not only `VERCEL_ENV`**: `NODE_ENV=production` is true in Vercel Production
  *and* Preview *and* `next start`, so no deployed build can silently run open. `VERCEL_ENV` is
  used only to pick the database and log level.
- **Dev-only login**: a Credentials provider (`dev-login`) registered only when
  `NODE_ENV !== "production"`. It creates or reuses a `users` row with `google_sub = "dev:<name>"`.
  A test asserts the provider list is empty of it in production mode.

## R11. Preview deployments

- **Decision**: previews run the real Google sign-in against a **non-production** database.
  - Database: a dedicated Neon branch for previews created from an **empty, schema-only** branch,
    never from the production branch, because a branch copies its parent's data and previews must
    not hold real students' data. In the Neon–Vercel integration this is configured so the Preview
    environment's `DATABASE_URL` points at that branch. Confirm in the Neon console during setup.
  - Google: a stable preview alias (e.g. `preview.<domain>`) registered as an authorised redirect
    URI, with its own `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` set for the Preview
    environment. Per-deployment `*.vercel.app` URLs are not usable with Google OAuth.
  - Fallback if a stable alias is not wanted: Auth.js `AUTH_REDIRECT_PROXY_URL` pointing at
    production, which requires sharing `AUTH_SECRET` between environments. Not recommended; it
    couples preview and production secrets.
- **Fail closed applies to previews** too (R10), so a preview with missing variables serves 503.

## R12. Surviving a mid-quiz session expiry (FR-028)

- **Decision**: the typed answer is saved to `sessionStorage` under `draft:<attemptId>:<questionId>`
  on each change and cleared when the question is graded. A 401 from `/api/grade` shows "Your
  session has ended. Sign in to continue." with a link to `/signin?callbackUrl=<quiz url>`. Google
  sign-in redirects in the same tab, so `sessionStorage` survives and the quiz reopens at the same
  attempt (resume, FR-032) with the draft restored.
- The pending self-mark token and last grade result for the current question are kept in the same
  place so a reload between "graded" and "self-marked" does not lose the step.

## R13. Retry outbox (FR-008, FR-009)

- **Decision**: `localStorage` key `outbox:<uid>` holds `{ receipt, tries, nextAt }` entries, at
  most 50. A retry runs on quiz page load, on the `online` event, and on a backoff timer (5 s, 30 s,
  2 min, 10 min, then every hour). Entries are scoped by user id so a shared school device does not
  send one student's receipts under another. An entry is dropped on a 2xx or on a definitive
  rejection (bad signature, expired, wrong user). The student sees **"A result could not be saved"**
  only when an entry is dropped on rejection or reaches 10 failed tries; until then there is no
  warning. A small "saving…" indicator is shown while any entry is pending.
- The outbox is a cache, which Principle VIII allows; the database stays the source of truth.

## R14. Attempt draw moves to the server

- **Decision**: port `prepare()` from `components/Quiz.tsx` into `lib/attempts/draw.server.ts`,
  unchanged in behaviour (groups in listed order; otherwise shorts then MC with `quiz.short` and
  `quiz.mc` counts; random within each; a unit with no `quiz` config draws everything). Randomness
  uses `crypto.randomInt`. The MC option shuffle result is stored on the attempt as
  `mc_option_order`.
- **Addressing options by display position**: the API returns each MC question with its options
  **already in display order** and the client sends the **display index**. The server maps it to
  the original index using the stored order. The client never sees original indices, so no extra
  mapping logic ships to the browser, and grading of a resumed attempt is correct.

## R15. Trend rule

For a unit, take the percentages of **completed** attempts in completion order (n of them).
Fewer than 2 gives "not enough data". Otherwise `k = min(3, n - 1)`; `recent` is the mean of the
last `k`, `previous` is the mean of up to 3 before those. The difference `recent - previous` is
**up** above +5 points, **down** below -5, otherwise **steady**. An attempt's percentage is
`sum(marks_awarded) / sum(max_marks)` over its results. Implemented as a pure function in
`lib/stats.ts` with table-driven tests.

## R16. Teacher tooling

- **Queries**: `docs/teacher-queries.sql`. Neon's SQL console has no query parameters, so each
  query starts with a `params` CTE (`from_date`, `to_date`, `include_self`, plus `unit_id` or
  `email` where relevant) that the teacher edits in place.
- **Delete a student**: `npm run delete-student -- <email>`. Looks up users by case-insensitive
  email, prints name, email and the counts of attempts and results, asks for the email to be typed
  to confirm, then deletes the user (cascade removes everything). Not found prints a clear message
  and exits non-zero without changes. `--yes` skips the prompt for scripted use. Reads
  `DATABASE_URL` from `.env.local`.
- **Retention**: `GET /api/cron/retention`, scheduled weekly by `vercel.json`
  (`"crons": [{ "path": "/api/cron/retention", "schedule": "0 17 * * 0" }]`, which is Sunday 17:00 UTC, i.e. 03:00-04:00 on Monday
  Sydney). It requires `Authorization: Bearer $CRON_SECRET`, which Vercel sends automatically when
  `CRON_SECRET` is set. It runs
  `DELETE FROM users WHERE GREATEST(last_answer_at, last_sign_in_at, created_at) < now() - interval '2 years'`
  and prunes `daily_ai_usage` rows older than 7 days. The logic lives in
  `lib/retention.server.ts` taking an injectable `now` so the exact boundary is testable.

## R17. Test strategy

- **Runner**: Vitest (`npm test`), with `server-only` aliased to an empty module.
- **Database in tests**: PGlite with the committed migrations applied, wrapped to satisfy the same
  Drizzle query code. Route handlers are called directly with `Request` objects, with
  `requireUser` and the db module mocked to the test session and PGlite.
- **Honest limit**: PGlite is single-connection, so the cap test proves the atomic SQL and the
  refund logic under many interleaved async calls, but does not exercise true multi-connection
  contention. Postgres guarantees the single-statement upsert atomically; this is covered in the
  quickstart as an optional manual check against a Neon branch.
- **Required cases** are listed in `plan.md` and map one-to-one to success criteria.

## R18. Version pinning

| Package | Version | Note |
|---|---|---|
| `next-auth` | `5.0.0-beta.32` (exact) | Auth.js v5 is still published under the `beta` tag. Pin exactly and upgrade deliberately. Peer range includes Next 15. |
| `drizzle-orm` | `^0.45.4` | latest stable |
| `drizzle-kit` | `^0.31.11` (dev) | latest stable |
| `eslint`, `eslint-config-next`, `@eslint/eslintrc` | `^9`, `^15.5.28`, latest (dev) | The repo has no ESLint setup, so `npm run lint` (a constitution gate) cannot pass today; flat config via `FlatCompat` as in the Next 15 docs |
| `@next/env` | `^15.1.0` (dev) | used by `drizzle.config.ts` and `scripts/*` to read `.env.local`; matches the installed `next` major |
| `@neondatabase/serverless` | `^1.2.0` | |
| `vitest` | `^5.0.5` (dev) | latest |
| `@electric-sql/pglite` | `^0.5.11` (dev) | test database only |

## R19. Database unavailable: degraded mode (Principle VI)

A database outage must never block practice. The goal is that a student can start a quiz, get every
MC mark, self-mark short answers, and have everything saved exactly once when the database returns.

- **What "unavailable" means**: every database call on a request path is wrapped in
  `withDbTimeout(promise, 1500)` (`lib/db/index.server.ts`). A timeout or a connection-level error
  (refused, DNS, TLS, `fetch failed`, Neon connection errors) throws `DbUnavailableError`. Any other
  error (a constraint violation, a bug) is an ordinary 500 and is never treated as an outage.
- **Attempt token** (HMAC, label `attempt`): `{ v, uid, attemptId, unitId, questionIds,
  mcOptionOrder, iat, exp }` with `attemptId` a UUID generated on the server (`crypto.randomUUID()`)
  and `exp` = `iat` + 24 hours. It carries everything grading needs, so **grading is possible from
  the session JWT plus the token alone**. An expired or mismatched token returns
  `400 invalid_attempt_token` and the client reloads the quiz page (the draft survives in
  `sessionStorage`), which issues a fresh token.
- **`POST /api/attempts`**: normal path draws, stores the attempt and returns `persisted: true`.
  When the database is unavailable it still draws on the server and returns an `attemptToken` with
  `persisted: false`; nothing is stored. Resume is not offered because there is no stored state.
- **`/api/grade`, normal path**: session user lookup (row must exist, FR-027) → verify the token is
  bound to the session user → one read for an existing result (409 if present) → limits and cap →
  grade → ensure the attempt row exists (create it from the token fields with `ON CONFLICT (id) DO
  NOTHING` if the attempt was minted while the database was down; reject if the id belongs to
  another user) → insert. Ownership is proven by the signed token and enforced at write time by the
  composite foreign key `(attempt_id, user_id)`. Self-mark requests also carry the `attemptToken`, so
  their receipts can embed the attempt fields.
- **`/api/grade`, degraded path** (the user lookup, the existing-result read or the cap reservation
  raised `DbUnavailableError`): verify the session JWT and the token (user, attempt, question is in
  the token), grade MC with the token's option order, skip the user-exists and already-answered
  checks, and return `saved: false`, `degraded: true` and a signed **receipt**. A short answer cannot
  reserve a daily slot, so no LLM is called: it returns `needsSelfMark` with `aiUnavailable: true`
  and a self-mark token. It never counts against the cap, which preserves SC-006.
- **Receipt contents**: besides the result, the receipt embeds the attempt fields from the token
  (`unitId`, `questionIds`, `mcOptionOrder`, `issuedAt`), so a retry can create the attempt row if it
  was never stored. Every receipt carries them, whether the outage began before or after the attempt
  was stored.
- **Self-mark during an outage**: verify the signed self-mark token and the JWT, compute 0 or
  `maxMarks`, try to insert; on `DbUnavailableError` return a receipt the same way.
- **`/api/results/retry`**: verify the receipt and that its `uid` is the session user; re-check that
  the user row exists. **Row missing** (deleted, or never created): write nothing and respond
  `410 student_not_found`; the client discards the receipt silently (no "result lost" notice).
  Otherwise upsert the attempt row from the receipt if missing (`ON CONFLICT (id) DO NOTHING`;
  an existing attempt with a different owner is rejected), insert the result idempotently
  (`UNIQUE(attempt_id, question_id)`), `touchLastAnswer`, and recompute completion. While the
  database is still unavailable it answers `503`, and the outbox backs off (R13).
- **Pages**: the unit page and the quiz keep working because content is in the repo. The history
  sections of the unit page, `/progress` and the attempt detail page render "History is temporarily
  unavailable — your answers are still being marked and will be saved." and never a 500. The "Start
  quiz" button works and the "Continue attempt" offer is hidden.
- **Quiz hand-off without a database**: `StartQuiz` stores `{ attemptToken, questions, answered }` in
  `sessionStorage` under `attempt:<attemptId>` before navigating, and `Quiz` rewrites it on every
  successful load. When the quiz page cannot load the attempt because the database is unavailable
  it renders `Quiz` in offline mode, which reads that entry; if it is missing the page says the quiz
  cannot be loaded right now and offers to go back.
- **Routes without a degraded path** (`/api/results/retry` and everything else that needs the
  database) answer `503 temporarily_unavailable`, never 401, so the client does not prompt for
  sign-in during an outage.
- **Accepted trade-offs**: during an outage a deleted student's still-valid session can practise but
  nothing is saved for them (the retry route discards their receipts); duplicate answers are
  prevented when saving (the `UNIQUE` key), not when marking, so a client could be marked twice for
  one MC question and the first receipt saved wins; resume and history are unavailable.

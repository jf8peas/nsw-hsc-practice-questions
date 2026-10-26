---

description: "Task list for Signed-In Students with Saved Scores"
---

# Tasks: Signed-In Students with Saved Scores

**Input**: Design documents from `/specs/001-student-saved-scores/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. Constitution v2.3.0 Quality Gates require automated tests for authorization and cost-control logic and make `npm test` a required gate; plan.md lists the required cases. Within each story, write the tests first and confirm they fail before implementing.

**Organization**: Tasks are grouped by user story so each can be implemented and tested on its own. Story labels map to spec.md: US1 Sign in, US2 Every answer saved, US3 Student progress, US4 Fair AI use, US5 Teacher analysis, US6 Deletion and retention.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: Which user story the task belongs to
- Every task names the file(s) it creates or changes

## Path Conventions

Single Next.js project at the repository root (`app/`, `components/`, `lib/`, `content/`, `scripts/`, `docs/`, `drizzle/`, `tests/`), per plan.md. Server-only modules end in `.server.ts` and start with `import "server-only"`.


---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies, tooling and config files that every later phase needs.


- [X] T001 Add runtime dependencies to `package.json` and run `npm install`: `next-auth@5.0.0-beta.32` (exact version, no caret), `drizzle-orm@^0.45.4`, `@neondatabase/serverless@^1.2.0`
- [X] T002 Add dev dependencies to `package.json` and run `npm install`: `drizzle-kit@^0.31.11`, `vitest@^5.0.5`, `@electric-sql/pglite@^0.5.11`, `@next/env@^15.1.0` (read by `drizzle.config.ts` and `scripts/*`), `eslint@^9`, `eslint-config-next@^15.5.28`, `@eslint/eslintrc`
- [X] T003 Add npm scripts to `package.json`: `test` = `vitest run`, `db:generate` = `drizzle-kit generate`, `db:migrate` = `tsx scripts/migrate.ts`, `delete-student` = `tsx scripts/delete-student.ts`, `vercel-build` = `npm run db:migrate && npm run build`; leave `prebuild`, `build` and `lint` unchanged
- [X] T004 [P] Create `vitest.config.mts` (node environment, `@` alias to the repo root, alias `server-only` to `tests/stubs/server-only.ts`, include `tests/**/*.test.ts`) and the empty stub `tests/stubs/server-only.ts`
- [X] T005 [P] Create `drizzle.config.ts`: dialect `postgresql`, schema `lib/db/schema.ts`, out `drizzle`, credentials from `process.env.DATABASE_URL` after calling `loadEnvConfig(process.cwd())` from `@next/env` so `.env.local` is read (Principle VII: this file runs only locally/CI, never at request time)
- [X] T006 [P] Create `eslint.config.mjs` using `FlatCompat` from `@eslint/eslintrc` to extend `next/core-web-vitals` and `next/typescript` (as in the Next 15 docs); run `npm run lint` and fix, or disable with a comment, any pre-existing violations so the Quality Gate `npm run lint` can pass; the repo had no ESLint setup before this feature
- [X] T007 [P] Create `vercel.json` with `"regions": ["syd1"]` and `"crons": [{ "path": "/api/cron/retention", "schedule": "0 17 * * 0" }]` (weekly)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, database client, test harness and config parsing. No user story can start until this is done.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete


- [X] T008 Create `lib/db/schema.ts` (Drizzle pg-core) defining `users`, `attempts`, `results`, `dailyAiUsage` exactly as in `specs/001-student-saved-scores/data-model.md`: uuid PKs with `gen_random_uuid()`, `google_sub` unique, `UNIQUE(id, user_id)` on attempts, composite FK `(attempt_id, user_id)` on results plus FK on `user_id` and `attempt_id` with ON DELETE CASCADE, `UNIQUE(attempt_id, question_id)`, CHECKs (`0 <= marks_awarded <= max_marks`, `graded_by in ('auto','llm','self')`, `count >= 0`), and every index listed (user history, partial index for incomplete attempts, `(unit_id, question_id)`, `(unit_id, created_at)`, `lower(email)`)
- [X] T009 Run `npm run db:generate` to create the first migration in `drizzle/`, then review the SQL by hand: confirm the composite FK, CHECK constraints, partial index and `lower(email)` index are present; hand-edit the SQL if Drizzle could not express any of them; commit `drizzle/` including its `meta/` folder
- [X] T010 [P] Create `lib/db/index.server.ts` (`import "server-only"`): lazy `getDb()` that builds a Drizzle client with `drizzle-orm/neon-http` from `DATABASE_URL`, throws a clear error if it is missing, export `withDbTimeout(promise, ms = 1500)` and a `DbUnavailableError`: a timeout or a connection-level error (refused, DNS, TLS, fetch failed) throws `DbUnavailableError`; any other error propagates unchanged so it becomes an ordinary 500; callers can therefore tell unavailable from no rows. Every database call on a request path must use it; and export a driver-agnostic `Db` type (`PgDatabase`) that query modules accept so PGlite can be injected in tests
- [X] T011 [P] Create `scripts/migrate.ts`: call `loadEnvConfig`, run the Drizzle migrator for `drizzle-orm/neon-http` against `./drizzle`, print applied migrations, exit non-zero on failure
- [X] T012 [P] Create `lib/config.ts` (a plain module with no `server-only` import, because the edge middleware imports it) exporting `configProblems(env)`, which returns the names of missing required variables (`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL`); and `lib/config.server.ts` (`import "server-only"`) exporting `getConfig()` with parsed numbers: `LLM_DAILY_CAP` (default 40; non-number or negative falls back to 40; 0 allowed and means LLM off), `GRADE_RATE_LIMIT` (default 20 per user per minute), `GRADE_IP_RATE_LIMIT` (default 150), `ATTEMPT_RATE_LIMIT` (default 20); nothing may throw at import time (so `next build` works without secrets)
- [X] T013 Create the test harness: `tests/helpers/db.ts` exporting `createTestDb()` (a fresh in-memory PGlite wrapped with `drizzle-orm/pglite`, with every file in `drizzle/` applied via the Drizzle migrator), and `tests/helpers/fixtures.ts` with `seedUser`, `seedAttempt`, `seedResult` helpers and a `mockSession(user | null)` helper that `vi.mock`s `@/lib/auth.server` (`requireUser`) and `@/lib/db/index.server` (`getDb`) to the test session and database (depends on T008, T009)

### Foundational tests

- [X] T014 [P] Write `tests/db/schema.test.ts`: migrations apply to an empty database; the column set of each table equals the data-model.md list (no extra personal-data columns, per Principle II); `UNIQUE(attempt_id, question_id)` rejects duplicates; CHECK constraints reject bad marks and `graded_by`; deleting a user cascades to attempts, results and usage rows; a result whose `user_id` differs from its attempt's owner is rejected by the composite FK
- [X] T015 [P] Write `tests/config.test.ts` (covers `lib/config.ts` and `lib/config.server.ts`): `configProblems` lists exactly the missing variables; `getConfig` defaults and fallbacks (`LLM_DAILY_CAP` of `abc`, `-5`, `0`, `12`); importing the module with no env set does not throw

**Checkpoint**: Foundation ready: `npm test` runs and the schema/config tests pass; user story work can begin.

---

## Phase 3: User Story 1 - Sign in to practise (Priority: P1) 🎯 MVP

**Goal**: A visitor sees only the sign-in page, signs in with Google, lands on the home page, can see who they are and sign out, and every page and quiz requires sign-in. The existing quiz behaviour is unchanged.

**Independent Test**: Run the app in development. Signed out, open `/`, a unit URL and `/api/grade`: expect redirect or 401. Sign in with dev login, reach `/`, see your name, sign out, and confirm the back button returns to `/signin`. Run `npm test` for the US1 tests.


### Tests (write first, confirm they fail)

- [X] T016 [P] [US1] Write `tests/auth/require-user.test.ts`: `requireUser()` returns the user when the session `uid` has a row; returns null (pages redirect, API returns 401) when there is no session; returns null when the `uid` row has been deleted (FR-027); one lookup per request render via `cache()` Also test `resolveSession()`: `unverified` when the session is valid but the lookup throws or times out (1500 ms) with a connection-level error; a non-connection error propagates as a 500; `none` when there is no session or the lookup returns no row (a deleted student); `user` otherwise.
- [X] T017 [P] [US1] Write `tests/auth/signin-callback.test.ts`: first sign-in inserts a user with `created_at` set; a second sign-in updates `name`, `email` and `last_sign_in_at` but not `created_at`; after the row is deleted, signing in again creates a new row with a new id (FR-027); the stored columns are only those allowed by Principle II (no photo, no tokens); the JWT carries only `uid`, `name` and `email`
- [X] T018 [P] [US1] Write `tests/auth/middleware.test.ts`: signed-out page request redirects to `/signin?callbackUrl=…`; signed-out `/api/*` returns 401 JSON; `/signin`, `/api/auth/*`, `/api/cron/retention` and static assets pass through; with `NODE_ENV=production` and each of `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL` missing in turn, every non-static request gets 503 with no variable names in the body (SC-007, SC-010); `/signin?callbackUrl=https://evil.example` and a protocol-relative `//evil.example` are ignored in favour of `/` (only same-origin relative paths are honoured)
- [X] T019 [P] [US1] Write `tests/auth/route-guard.test.ts`: scan `app/**/page.tsx` and `app/**/route.ts`; fail unless each file references `requireUser`, `requirePageUser` or (only for `app/api/attempts/route.ts`, `app/api/grade/route.ts` and `app/api/results/self-mark/route.ts`) `resolveSession` or is in a short reviewed allowlist (`app/signin/page.tsx`, `app/api/auth/[...nextauth]/route.ts`, `app/api/cron/retention/route.ts`)
- [X] T020 [P] [US1] Write `tests/auth/dev-login.test.ts`: the Credentials `dev-login` provider is registered when `NODE_ENV` is `development` or `test` and absent when `production`; dev login creates a user with `google_sub` of `dev:<name>`

### Implementation

- [X] T021 [US1] Create `lib/db/queries/users.server.ts`: `upsertUserOnSignIn(db, {sub, name, email})` (insert; on conflict on `google_sub` update `name`, `email`, `last_sign_in_at = now()` only; return the id), `userExists(db, id)`, `getUser(db, id)`; every function takes the `Db` as its first parameter
- [X] T022 [P] [US1] Create `lib/auth.config.ts` (edge-safe, no DB imports): Auth.js config with `pages: { signIn: "/signin" }`, `session: { strategy: "jwt", maxAge: 30 days, updateAge: 1 day }`, and an `authorized` callback; this is what `middleware.ts` uses (Principle VII: reads only `AUTH_SECRET` and auth config)
- [X] T023 [US1] Create `lib/auth.server.ts` (`import "server-only"`): `NextAuth({...authConfig, providers})` with the Google provider (any account, no domain restriction) and a Credentials `dev-login` provider added only when `NODE_ENV !== "production"`; `jwt` callback upserts via `upsertUserOnSignIn` on sign-in and stores only `uid`, `name` and `email` in the token (no picture and no provider tokens, so the header and pages still show the identity during an outage); `session` callback exposes `uid`, name, email; export `requireUser()` (React `cache()`-wrapped): reads the session, runs `userExists`, returns the user or `null`; export helper `requirePageUser()` that redirects to `/signin` on null (depends on T021, T022, T010); also export `resolveSession()` returning `{ kind: 'user', user }`, `{ kind: 'unverified', uid }` or `{ kind: 'none' }`: `unverified` only when the session JWT is valid but the user lookup throws or exceeds `withDbTimeout` (database unavailable); `none` when there is no session or the lookup returns no row; `requireUser()` (used by API routes with no degraded path) answers 503 `temporarily_unavailable` for `unverified`, never 401; `requirePageUser()` returns the identity from the JWT with `degraded: true` so pages render a history-unavailable notice instead of failing
- [X] T024 [P] [US1] Create `app/api/auth/[...nextauth]/route.ts` re-exporting the Auth.js `GET` and `POST` handlers from `lib/auth.server.ts`
- [X] T025 [US1] Create `middleware.ts` at the repo root: wrap `auth` from `lib/auth.config.ts`; first call `configProblems(process.env)` and, if `NODE_ENV === "production"` and it is non-empty, return `503 Service not configured` (plain text, log the variable names server-side only); then redirect unauthenticated page requests to `/signin?callbackUrl=…` and return 401 JSON for unauthenticated `/api/*`; matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `icon.svg`, `apple-icon.png`; public paths `/signin`, `/api/auth/*`, `/api/cron/retention` (depends on T012, T022)
- [X] T026 [P] [US1] Create `app/signin/page.tsx` (no `Shell` identity, mobile-first, tokens from `styles/tokens.css`): site name and one-paragraph description, the data notice (name, email and quiz results are kept; deleted 2 years after last activity; FR-003), a "Sign in with Google" button using a server action calling `signIn("google", { redirectTo })` honouring `callbackUrl`, and the dev-login form rendered only when `NODE_ENV !== "production"`; the notice also states that students' typed short answers are sent to a third-party AI service to be marked (FR-003); honour `callbackUrl` only when it is a same-origin relative path
- [X] T027 [P] [US1] Create `components/UserMenu.tsx` (server component): shows the signed-in name and email and a "Sign out" form button using a server action calling `signOut({ redirectTo: "/signin" })`; update `components/Shell.tsx` to render it in the header on every page (FR-004)
- [X] T028 [P] [US1] Add styles for the sign-in card and user menu to `app/globals.css` using existing tokens from `styles/tokens.css`; verify the header does not overflow at 360px width
- [X] T029 [US1] Add `requireUser` (pages: `requirePageUser`) to every existing page and route so the guard test passes: `app/page.tsx`, `app/unit/[unitId]/page.tsx`, `app/unit/[unitId]/quiz/page.tsx`, `app/api/grade/route.ts` (return 401 JSON when null, before any other work) and `app/api/unlock/route.ts`; leave their other behaviour unchanged for now (depends on T023)

**Checkpoint**: User Story 1 is fully functional: sign-in gating, identity, sign-out and fail-closed production config.

---

## Phase 4: User Story 2 - Every answer is saved to the student's account (Priority: P1)

**Goal**: Every graded answer (MC or short) is stored once against the student with unit, question, answer, marks, max marks, how it was marked, attempt and time, in attempts drawn on the server. The student always sees their mark immediately; failed saves are retried and only reported if finally lost; abandoned attempts keep their answers.

**Independent Test**: Sign in as a dev user, start a quiz, answer MC and short questions, then inspect the `results` rows (one per answer, correct fields). Point `DATABASE_URL` at an unreachable host, answer a question, confirm the mark shows and the outbox holds a receipt, restore the URL and confirm the row appears. Close the tab mid-quiz and confirm the answered rows remain.


### Tests (write first, confirm they fail)

- [X] T030 [P] [US2] Write `tests/tokens.test.ts`: receipt, self-mark and attempt tokens round-trip (the attempt token round-trips `attemptId`, `unitId`, `questionIds`, `mcOptionOrder` and expiry; the receipt round-trips its `attempt` object); a modified payload fails; a token signed with the other kind's key fails; expired tokens fail; `uid`/`attemptId`/`questionId` binding mismatches fail; verification uses a constant-time compare
- [X] T031 [P] [US2] Write `tests/attempts/draw.test.ts`: groups are drawn in listed order with the right counts; the shorts-first path draws `quiz.short` then `quiz.mc`; a unit with no `quiz` config draws everything with shorts first; MC option order is a permutation per MC question and absent for short questions; run against the real units in `content/` for at least `y11-economics-supply-demand` (groups) and `y11-formula-test`
- [X] T032 [P] [US2] Write `tests/api/attempts.test.ts`: `POST /api/attempts` creates an attempt owned by the session user with ordered `question_ids` and `mc_option_order`; the response contains an `attemptToken` bound to the user and attempt, and public question data only, with MC options in display order and no `correctText`, rubric or model answer; unknown unit returns 404; signed-out returns 401; exceeding `ATTEMPT_RATE_LIMIT` returns 429; with `getDb()` unreachable it still returns 201 with `persisted: false` and a valid `attemptToken` (server-generated UUID) and stores nothing
- [X] T033 [P] [US2] Write `tests/api/grade.test.ts`: with a valid `attemptToken`, an MC display index maps to the right original option and is saved with `graded_by = auto` and the option text as `answer`; a short answer graded by a mocked LLM is saved with feedback and rubric hits/misses and `graded_by = llm`; `last_answer_at` is updated; another student's attempt id or a token bound to another user is rejected and writes nothing (SC-002); an expired or tampered `attemptToken` returns 400 `invalid_attempt_token`; a question not in the token's `questionIds` returns 404; a second answer to the same question returns 409 with the stored mark, including two simultaneous calls for the same question (one row, one 200 and one 409); the client cannot supply marks, user id or grading method (extra body fields are ignored); an empty short answer scores 0 without calling the LLM; a forced save failure and a save slower than 1500 ms both still return the mark plus a receipt; the response and the stored row never contain rubric text or model answer beyond the existing post-submit fields; the first save for an attempt minted while the database was down creates the attempt row instead of failing the foreign key
- [X] T034 [P] [US2] Write `tests/api/grade-outage.test.ts` (Principle VI, SC-004, research R19) with the test database made fully unreachable (`getDb()` calls reject with a connection error, and separately take longer than 1500 ms): `POST /api/attempts` still returns 201 with `persisted: false` and an `attemptToken`; `/api/grade` for an MC question returns the mark with `saved: false`, `degraded: true` and a receipt carrying the attempt fields, graded from the token's option order, skipping the user-exists and already-answered checks; for a short question it returns `needsSelfMark: true`, `aiUnavailable: true` and a self-mark token, the LLM mock is never called and the daily cap is untouched (SC-006); `/api/results/self-mark` verifies its token and returns a receipt; `/api/results/retry` returns 503. Then restore the test database and replay the receipts (twice each): the attempt row exists once and each result exists once; a receipt for a deleted user returns 410 and writes nothing; with the database up and the user row missing `/api/grade` still returns 401; a non-connection error returns an ordinary 500; routes with no degraded path return 503 `temporarily_unavailable`, never 401; the unit page, `/progress` and attempt-detail loaders return an `unavailable` result and rendering them shows "History is temporarily unavailable — your answers are still being marked and will be saved." with no throw
- [X] T035 [P] [US2] Write `tests/api/retry.test.ts`: a valid receipt inserts one row and sets `last_answer_at`; replaying the same receipt returns `duplicate: true` and leaves one row; a tampered, expired or other-user receipt is rejected with 400/403 and writes nothing; a receipt for an attempt that does not belong to the session user is rejected (FR-007, FR-009); a receipt whose attempt row was never stored creates that attempt (with `started_at` from the receipt's issued-at) exactly once however many times it is retried; a receipt for a deleted or non-existent user returns 410 and writes nothing; an attempt id owned by another user is rejected; recomputed completion marks the attempt completed when every drawn question has a result
- [X] T036 [P] [US2] Write `tests/api/self-mark.test.ts`: accepted with a valid token for a short question with no result, saving `graded_by = self` and marks of 0 or `maxMarks` only; rejected for: no token, token for another user, wrong attempt or question, wrong answer hash, expired token, an MC question (422), an already-answered question (409); a failed save returns a receipt; with the database unreachable it verifies the self-mark token and returns a receipt that carries the attempt fields; the request must include a valid `attemptToken` bound to the same user and attempt
- [X] T037 [P] [US2] Write `tests/attempts/complete.test.ts`: an attempt completes only when every drawn question that still exists in content has a result; a drawn question missing from content is skipped; an attempt with all drawn questions retired completes with 0 marks; no request field can set `completed_at`; answers saved in an abandoned attempt remain stored
- [X] T038 [P] [US2] Write `tests/client/outbox.test.ts` for the pure logic in `lib/outbox.ts` using a fake storage: entries are scoped by user id; capped at 50; backoff schedule 5 s, 30 s, 2 min, 10 min then hourly; an entry is dropped and reported "lost" on a definitive rejection or after 10 failed tries; a 2xx removes it; no "lost" signal before that
- [X] T039 [P] [US2] Write `tests/client/drafts.test.ts` for `lib/drafts.ts` with a fake `sessionStorage`: the typed answer is saved per attempt and question, restored on reload, cleared once graded, and preserved across a simulated 401 sign-in redirect; the pending self-mark token and last grade result are restored; storage errors are swallowed (FR-028)
- [X] T040 [P] [US2] Write `tests/no-key-leak.test.ts`: for every unit in `content/`, the JSON returned by `POST /api/attempts` and the pages' public data contain none of the `correctText`, `correctIndex`, `modelAnswer`, `rubric` or `notes` values from `content/answers`; the stored `results` row type has no field that could hold them (Principle I)

### Implementation

- [X] T041 [US2] Create `lib/tokens.server.ts` (`import "server-only"`) per `specs/001-student-saved-scores/contracts/tokens.md`: `signReceipt`, `verifyReceipt`, `signSelfMarkToken`, `verifySelfMarkToken`, `signAttemptToken`, `verifyAttemptToken`; keys from HKDF-SHA256 over `AUTH_SECRET` with info `receipt` / `selfmark` / `attempt`; `crypto.timingSafeEqual`; `v: 1`; receipt expiry 7 days, self-mark expiry 2 hours, attempt token expiry 24 hours; the attempt token carries `uid`, `attemptId` (a UUID generated by the caller with `crypto.randomUUID()`), `unitId`, `questionIds`, `mcOptionOrder`, `iat`, `exp`; the receipt payload embeds an `attempt` object `{ unitId, questionIds, mcOptionOrder, issuedAt }` copied from the attempt token; this is the only module that touches the key
- [X] T042 [US2] Create `lib/db/queries/attempts.server.ts` and `lib/db/queries/results.server.ts` (all take `Db` first, every read filters by `user_id`): `createAttempt`, `getAttemptForUser(db, userId, attemptId)` (null if not the owner), `getResultKeys(db, attemptId)`, `insertResultIdempotent` (`INSERT … ON CONFLICT (attempt_id, question_id) DO NOTHING RETURNING id`), `touchLastAnswer(db, userId)` (`GREATEST(last_answer_at, now())`), `markAttemptCompleted(db, attemptId)` (`WHERE completed_at IS NULL`), `getLatestIncompleteAttempt`; also `ensureAttempt(db, { id, userId, unitId, questionIds, mcOptionOrder, startedAt })` (`INSERT … ON CONFLICT (id) DO NOTHING`, then confirm the stored owner; throws if the id belongs to another user) used by the grade, self-mark and retry routes
- [X] T043 [P] [US2] Create `lib/attempts/draw.server.ts` (`import "server-only"`): port `prepare()`, `shuffle()` and `pick()` from `components/Quiz.tsx` unchanged in behaviour but using `crypto.randomInt`; return the ordered question ids and `mc_option_order` (`optionOrder[displayIndex] = originalIndex`); build the public payload with MC options already in display order using only public `content` (never `content/answers`)
- [X] T044 [US2] Create `lib/attempts/complete.server.ts` (`import "server-only"`): `finalizeIfComplete(db, attempt)` comparing the drawn ids that still exist in content (via `getQuestion` from `content/index.ts`) with the result question ids and calling `markAttemptCompleted` when all are covered; return `{ completed }`; handle the all-retired case (depends on T042)
- [X] T045 [P] [US2] Update `lib/grading.ts`: new `GradeRequest` `{ attemptId, questionId, answer }` (MC `answer` is the display index as a string), `GradeResult` with `correctDisplayIndex` instead of `correctIndex`, and a `GradeResponse` `{ result, saved, receipt?, attemptCompleted, selfMarkToken? }` per `contracts/api.md`
- [X] T046 [US2] Update `lib/grading.server.ts`: `gradeAnswer` takes the attempt's option order for the question, maps the display index to the original index before comparing with `correctText`, and returns `correctDisplayIndex` and the chosen option text so the route can store it as the answer; the answer key is still read only here (depends on T045)
- [X] T047 [US2] Create `app/api/attempts/route.ts`: `POST { unitId }` → `resolveSession` (degraded-capable: an `unverified` session is allowed), per-user `ATTEMPT_RATE_LIMIT` check, `404` for an unknown unit, draw via `draw.server.ts`, `createAttempt`, respond `201` with `attemptId`, `attemptToken` (signed with `signAttemptToken`: user id, attempt id, unit id, ordered question ids, MC option order), `passMark`, `questions`, `answered: {}` (depends on T042, T043, T012); when the database is unavailable (`DbUnavailableError`) still draw, mint a server-generated `attemptId` (`crypto.randomUUID()`), return `201` with `persisted: false` and the `attemptToken`, and store nothing (resume is not offered); `persisted: true` otherwise
- [X] T048 [US2] Rewrite `app/api/grade/route.ts` per `contracts/api.md` and research R19: call `resolveSession()` (`none` returns 401; `unverified` takes the degraded path); verify `attemptToken` (signature, expiry, bound to the session user and `attemptId`, else 400 `invalid_attempt_token`); 404 if the question is not in the token's `questionIds`; on the normal path read for an existing result (409 with the stored mark) inside `withDbTimeout`, and treat a thrown or timed-out read as degraded; keep the existing class-code gate (`hasAccess`) and per-IP `checkGradeRateLimit` on short answers for now (they are retired in User Story 4, so LLM spend stays protected until the cap exists); grade using the token's MC option order; on the normal path call `ensureAttempt` from the attempt token fields (an attempt minted while the database was down has no row yet, and the result's foreign key would otherwise fail), then insert the result and `touchLastAnswer` raced against a 1500 ms timeout, then run `finalizeIfComplete`; on save failure or timeout return the mark plus `receipt` (the receipt embeds the attempt fields from the attempt token: unit id, ordered question ids, MC option order, issued-at); degraded path: MC returns `saved: false`, `receipt`, `degraded: true`, `attemptCompleted: null`, and a short answer skips the LLM, never touches the daily cap, and returns `needsSelfMark` with `aiUnavailable: true`; when the grader returned `needsSelfMark` do not save and return `selfMarkToken`; ignore any client-supplied user id, marks or method; remove the old `GET` handler (depends on T042, T044, T046, T041, T023)
- [X] T049 [P] [US2] Create `app/api/results/retry/route.ts`: verify the receipt and require its `uid` to equal the session user; re-check that the user row exists (missing means write nothing and return 410 `student_not_found`, which the client discards silently with no lost notice); if the attempt row is missing create it from the receipt's `attempt` fields with `ON CONFLICT (id) DO NOTHING` (reject if an attempt with that id belongs to another user); insert the result idempotently (`UNIQUE(attempt_id, question_id)`); `touchLastAnswer`; `finalizeIfComplete`; return `{ saved: true, duplicate }`; 400 for invalid or expired and 403 for another user (definitive, client shows the lost notice); 503 `temporarily_unavailable` when the database is unavailable so the outbox backs off
- [X] T050 [P] [US2] Create `app/api/results/self-mark/route.ts` per `contracts/api.md`: verify the self-mark token (user, attempt, question, `sha256(answer)`) and the request's `attemptToken` (bound to the session user and `attemptId`), require a short question in the user's attempt with no result, marks of `maxMarks` if `correct` else 0, `graded_by = self`, same save/receipt/finalize flow as the grade route; accept `unverified` sessions (database unavailable) and skip database reads before the insert, returning a receipt if the insert fails; the receipt it returns embeds the attempt fields (unit id, question ids, option order, issued-at) from the request's `attemptToken` so a retry can create the attempt row; on the normal path call `ensureAttempt` before inserting
- [X] T051 [P] [US2] Create `lib/outbox.ts` (pure logic plus a thin `localStorage` wrapper keyed `outbox:<uid>`, backoff and give-up rules as in research R13, wrapped in try/catch because storage may be unavailable) and `lib/drafts.ts` (`sessionStorage` keys `draft:<attemptId>:<questionId>`, also holding the pending self-mark token and last grade result for the current question, try/catch)
- [X] T052 [P] [US2] Create `components/StartQuiz.tsx` (client): a full-width primary button that `POST`s `/api/attempts` with the unit id, then `router.push('/unit/<id>/quiz?attempt=<attemptId>')`; shows busy and error states; replace the "Start quiz" `Link` in `app/unit/[unitId]/page.tsx` with it (the button must stay above the formula list, Principle VIII); before navigating, store the response `{ attemptToken, questions, answered }` in `sessionStorage` under `attempt:<attemptId>` (this is what lets a quiz run when `persisted` is false); handle both `persisted: true` and `persisted: false`
- [X] T053 [US2] Rewrite `app/unit/[unitId]/quiz/page.tsx` as a server page: require `?attempt=`, else redirect to the unit page; `getAttemptForUser` (not-found if missing or someone else's); load the already-answered question ids and marks; drop retired drawn questions; run `finalizeIfComplete`; issue a fresh `attemptToken` and pass the client `{ attemptId, attemptToken, unitId, passMark, questions, answered }` with MC options in display order from the stored `mc_option_order` (depends on T042, T044); if loading the attempt raises `DbUnavailableError`, do not fail: render `<Quiz>` in offline mode, which reads `attempt:<attemptId>` from `sessionStorage` (if missing, show "The quiz can't be loaded right now. Go back and start again."); never a 500
- [X] T054 [US2] Rewrite `components/Quiz.tsx` as a client component driven by server-provided questions: remove `prepare`, `shuffle`, `pick` and `saveScore`; start at the first unanswered question and seed marks from `answered`; send `{ attemptId, attemptToken, questionId, answer }` (MC sends the display index); on `409 already_answered` show the stored mark from the response and advance without an error (same attempt open on two devices); on `400 invalid_attempt_token` reload the page with the draft preserved; when a response has `degraded: true` or `aiUnavailable: true` keep the receipt in the outbox and, for a short answer, show "AI marking is unavailable right now. Mark this one yourself."; when `attemptCompleted` is null build the results screen from local marks (display only); keep the existing class-code UI for now; use `correctDisplayIndex`; when `saved` is false store the receipt in the outbox and show a small "saving…" indicator, flushing the outbox on mount, on `online` and on timers; show "A result could not be saved" only when the outbox reports a lost entry; self-mark calls `/api/results/self-mark` with the `selfMarkToken` and the `attemptToken`; store the typed draft in `sessionStorage` and restore it; on 401 show "Your session has ended. Sign in to continue." with a link to `/signin?callbackUrl=<quiz url>` without clearing the draft (FR-028); the final results screen uses `attemptCompleted` and the marks from the server; "Retry quiz" starts a new attempt via `POST /api/attempts` (depends on T051, T048, T050, T049, T053); write `{ attemptToken, questions, answered }` to `sessionStorage` `attempt:<attemptId>` on every successful load and support an offline mode that reads it; outbox receipts for attempts that were never stored carry the attempt fields so a retry can create the attempt

**Checkpoint**: User Stories 1 and 2 both work. Do not deploy this phase to production without User Story 4 (the daily cap), because any Google account can now reach the LLM path; the class-code gate is deliberately kept until then.

---

## Phase 5: User Story 3 - Student sees their own progress on any device (Priority: P1)

**Goal**: On the unit page a student sees their attempts (date, score, percentage) with best and latest from completed attempts, can continue an unfinished attempt on any device, and has a My progress page and an attempt detail page; no student can see another's results.

**Independent Test**: Complete an attempt on one browser as a dev user, sign in as the same user in a private window and confirm the unit page, `/progress` and `/attempts/<id>` match. Sign in as a second dev user and request the first user's attempt URL: expect not-found. Leave an attempt unfinished and confirm "Continue attempt" resumes at the first unanswered question.


### Tests (write first, confirm they fail)

- [X] T055 [P] [US3] Write `tests/stats.test.ts` (table-driven) for `lib/stats.ts`: attempt percentage from results; best and latest use completed attempts only; incomplete attempts are excluded from best, latest and trend; trend returns "not enough data" below 2 completed attempts, `k = min(3, n-1)` recent vs up to 3 previous, and up/down/steady at exactly ±5 points; empty history
- [X] T056 [P] [US3] Write `tests/pages/history.test.ts` against `lib/db/queries/history.server.ts` using PGlite: unit history lists the user's attempts only; per-unit progress summary (count, latest, best, trend); attempt detail returns each question's answer, marks and stored feedback; student B asking for student A's attempt gets nothing (SC-002); a question missing from content is returned flagged `retired` with its stored answer and marks (FR-023); two devices produce the same data (SC-001); a deleted-then-recreated student sees an empty history; each history loader returns `{ status: 'unavailable' }` instead of throwing when the database is unreachable
- [X] T057 [P] [US3] Write `tests/attempts/resume.test.ts`: the latest incomplete attempt for a unit is offered, skipping answered and retired questions; an attempt whose remaining questions are all retired is completed rather than offered; only the latest incomplete attempt per unit is returned; starting a new attempt leaves the old one incomplete

### Implementation

- [X] T058 [P] [US3] Create `lib/stats.ts` (pure, no server-only): `attemptPercent`, `bestLatest`, `trend` implementing research R15 exactly
- [X] T059 [US3] Create `lib/db/queries/history.server.ts` (all functions take `Db` and `userId`, never an id from the client): `unitHistory(db, userId, unitId)`, `progressSummary(db, userId)`, `attemptDetail(db, userId, attemptId)` (null if not the owner), `latestIncompleteAttempt(db, userId, unitId)`; each attempt carries its score from `sum(marks_awarded)/sum(max_marks)`; wrap every query in `withDbTimeout` and return `{ status: 'unavailable' }` (not a throw) on `DbUnavailableError` so pages can render the notice
- [X] T060 [US3] Create `app/attempts/[attemptId]/page.tsx`: `requirePageUser`; `attemptDetail`; not-found if null; list each drawn question in order with prompt (from public content), the student's answer, marks and stored feedback with rubric hits/misses, labelling questions missing from content as "retired" (show the id and stored answer); never read `content/answers`; when the loader returns `unavailable` render "History is temporarily unavailable — your answers are still being marked and will be saved." (never a 500)
- [X] T061 [P] [US3] Create `components/AttemptHistory.tsx`: attempts for the unit (date, score, percentage), "incomplete" label on unfinished attempts, links to `/attempts/<id>`, best and latest from completed attempts only, and an empty state ("No attempts yet")
- [X] T062 [US3] Update `app/unit/[unitId]/page.tsx`: replace `UnitStatsPanel` with `AttemptHistory` fed by `unitHistory`; run `finalizeIfComplete` on the latest incomplete attempt; if one remains, show "Continue attempt" (link to `?attempt=<id>`) beside a "Start new attempt" `StartQuiz` button, both above the formula list (FR-032, Principle VIII); when the history loader returns `unavailable` render "History is temporarily unavailable — your answers are still being marked and will be saved." in place of the history and best/latest, hide "Continue attempt", and keep "Start quiz" working (never a 500)
- [X] T063 [P] [US3] Create `app/progress/page.tsx`: `requirePageUser`; `progressSummary`; one card per attempted unit with attempt count, latest %, best %, and trend (up/down/steady/not enough data); link each to its unit page and list its three most recent attempts, each linking to `/attempts/<id>`; empty state; add a "My progress" link to `components/Shell.tsx`/`UserMenu.tsx`; when the loader returns `unavailable` render the same notice (never a 500)
- [X] T064 [US3] Delete `components/UnitStatsPanel.tsx` and `lib/scores.ts` (no migration of old browser scores, FR-005); grep the repo for remaining imports of `saveScore`, `getScores`, `computeStats`, `resetScores`, `UnitStatsPanel` and fix any; update the README claim later in the Polish phase

**Checkpoint**: User Stories 1 to 3 work independently: sign-in, saving, and progress on any device.

---

## Phase 6: User Story 4 - Fair use of AI grading (Priority: P2)

**Goal**: Each student has a daily limit (default 40) on successful AI-graded short answers, reset at midnight Sydney time; over the limit, short answers fall back to self-marking with a clear message; MC is unlimited; the class-code gate is gone.

**Independent Test**: Set `LLM_DAILY_CAP=2` with an LLM key, answer three short questions as one dev user and confirm the third self-marks with the reset message while MC still works; confirm another dev user still gets AI marking. Confirm no `CLASS_CODE` is read anywhere.


### Tests (write first, confirm they fail)

- [X] T065 [P] [US4] Write `tests/sydney.test.ts`: `nextSydneyMidnight(now)` is correct across the AEDT/AEST changes (first Sunday in April and October) and at 23:59/00:00 boundaries; the formatted "returns at midnight Sydney time" text
- [X] T066 [P] [US4] Write `tests/usage.test.ts` against PGlite: with a cap of N, 3N concurrent `reserve()` calls (`Promise.all`) grant exactly N and deny the rest; `refund()` frees a slot and never goes below 0; a new Sydney date starts at 0 (use the optional `sydneyDate` override); `LLM_DAILY_CAP=0` denies all; rows for different users are independent
- [X] T067 [P] [US4] Write `tests/api/grade-cap.test.ts`: under the cap an LLM-graded answer counts; an LLM failure (mock returns null) refunds and returns `needsSelfMark` with a self-mark token; over the cap returns `needsSelfMark` with `aiLimit { reached: true, resetsAt }` and does not call the LLM; MC is graded normally when the cap is reached (FR-018); an empty short answer never reserves; a self-marked answer after a cap fallback is saved as `self`; the daily count never exceeds the cap under concurrent grade calls (SC-006); a reservation query that throws or times out returns `needsSelfMark` with `aiUnavailable` and never calls the LLM
- [X] T068 [P] [US4] Write `tests/ratelimit.test.ts`: per-user limit blocks after `GRADE_RATE_LIMIT` calls within a minute and does not affect another user; the per-IP backstop blocks when many users share an IP beyond `GRADE_IP_RATE_LIMIT`; MC grading is never rate limited; retry-after is returned

### Implementation

- [X] T069 [P] [US4] Create `lib/sydney.ts` (pure): `nextSydneyMidnight(now: Date)` using `Intl.DateTimeFormat` with `Australia/Sydney` (DST-aware) and `formatResetMessage`
- [X] T070 [US4] Create `lib/usage.server.ts` (`import "server-only"`): `reserveAiSlot(db, userId, cap, sydneyDate?)` running the single atomic upsert from research R5 (date defaults to `(now() AT TIME ZONE 'Australia/Sydney')::date` in SQL) and returning a boolean, and `refundAiSlot` with `GREATEST(count - 1, 0)`
- [X] T071 [US4] Update `lib/ratelimit.server.ts`: add `checkUserRateLimit(userId)` (`GRADE_RATE_LIMIT`, key prefix `grade-user`) and rename the existing function to `checkIpRateLimit(ip)` using `GRADE_IP_RATE_LIMIT` (prefix `grade-ip`), both Upstash with in-memory fallback; add `checkAttemptRateLimit(userId)` using `ATTEMPT_RATE_LIMIT`; keep the sliding-window behaviour and `retryAfter`
- [X] T072 [US4] Update `app/api/grade/route.ts` and `lib/grading.server.ts`: for a non-empty short answer when the LLM is configured, order is validate → `checkUserRateLimit` → `checkIpRateLimit` → `reserveAiSlot`; if the slot is denied skip the LLM and return `needsSelfMark` with `aiLimit { reached: true, resetsAt }`; if the LLM call returns nothing, `refundAiSlot` and return `needsSelfMark`; if the reservation query throws or times out, treat it as degraded (`needsSelfMark` with `aiUnavailable`, no LLM call); MC never touches the limiters or the cap (depends on T070, T071, T069)
- [X] T073 [US4] Retire the class-code gate: delete `lib/gate.server.ts` and `app/api/unlock/route.ts`; remove the `hasAccess` check and imports from `app/api/grade/route.ts`; remove the class-code state, `submitCode`, the unlock UI and the 401-`needsCode` path from `components/Quiz.tsx`; remove `app/api/unlock/route.ts` from the route-guard allowlist if present; grep the repo for `CLASS_CODE`, `SKIP_CLASS_CODE`, `gate.server`, `needsCode` and `/api/unlock` and remove every remaining reference in code (docs are handled in Polish) (depends on T072)
- [X] T074 [US4] Update `components/Quiz.tsx`: when the response has `aiLimit.reached`, show a clear message with the reset time ("AI marking is paused until midnight Sydney time. Mark this one yourself.") above the self-mark buttons; practice is never blocked (depends on T073)
- [X] T075 [US4] Update `app/api/attempts/route.ts` to call `checkAttemptRateLimit(userId)` and return 429 with `retryAfter` (depends on T071)

**Checkpoint**: User Stories 1 to 4 work: safe to deploy to production once the launch checklist in the Polish phase is done.

---

## Phase 7: User Story 5 - Teacher analysis from the backend (Priority: P2)

**Goal**: The teacher can answer the class-level questions directly in the database console using documented, ready-to-run queries filterable by date range and by including or excluding self-marked answers.

**Independent Test**: Seed or use real data, open `docs/teacher-queries.sql` in the Neon SQL console, run each query, and find the 3 weakest units and the 5 weakest questions in one unit within a few minutes (SC-005).


### Tests (write first, confirm they fail)

- [X] T076 [US5] Write `tests/teacher-queries.test.ts`: load `docs/teacher-queries.sql`, split it on the `-- QUERY: <name>` markers, seed PGlite with several students, units, questions, and results (including self-marked, MC wrong options, and different dates), then run each query as written and assert: units ranked lowest class average first; questions within a unit ranked lowest average first; the most common wrong MC option per question; one student's history in time order; each student's last-active date; AI-graded answers per student today (Sydney date); and that editing the `params` CTE date range and `include_self` flag changes the output as described (FR-021, FR-022). Write this first and watch it fail; the wrong-option query works from `answer` text only

### Implementation

- [X] T077 [US5] Create `docs/teacher-queries.sql` with a header explaining how to use it in the Neon SQL console, and six queries each preceded by `-- QUERY: <name>` and starting with an editable `params` CTE (`from_date`, `to_date`, `include_self`, plus `unit_id` or `email` where needed): `units_by_class_average` (lowest first, top rows answer "3 weakest units"), `questions_in_unit_by_average` (lowest first, limit 5 answers "5 weakest questions"), `common_wrong_mc_option` (per MC question, the most chosen incorrect option text with counts, grouped by the stored `answer` text where `marks_awarded = 0`; there is no option-index column), `student_history` (by email, time ordered), `students_last_active` (using `GREATEST(last_answer_at, last_sign_in_at, created_at)`), `ai_answers_used_today` (from `daily_ai_usage` for the current Sydney date); use readable unit and question ids, exclude `graded_by = 'self'` when `include_self` is false

**Checkpoint**: User Story 5 works; it depends only on the schema, so it can be built in parallel with the story phases.

---

## Phase 8: User Story 6 - Data deletion and retention (Priority: P3)

**Goal**: A student's data is deleted automatically 2 years after their last activity, and the teacher can delete one student immediately by email; a deleted student who signs in again is a new student.

**Independent Test**: Run `npm run delete-student -- <dev email>` for a seeded user and confirm the data is gone from the console queries and the old session is rejected; call `/api/cron/retention` with and without the bearer token against seeded old data.


### Tests (write first, confirm they fail)

- [X] T078 [P] [US6] Write `tests/retention.test.ts` against PGlite using an injected `now`: a student whose last activity is exactly 2 years old is kept and one second older is deleted; last activity is `GREATEST(last_answer_at, last_sign_in_at, created_at)` (a recent sign-in keeps a student with old answers); an account with no answers is deleted 2 years after creation or last sign-in; deletion cascades to attempts, results and usage rows; `daily_ai_usage` rows older than 7 days are pruned; counts are returned (SC-009, FR-025)
- [X] T079 [P] [US6] Write `tests/api/cron.test.ts`: no header, wrong token, wrong scheme and a token of different length all get 401; correct `Authorization: Bearer $CRON_SECRET` runs retention and returns only `{ deletedStudents, prunedUsageRows }` (no names or emails); unset `CRON_SECRET` returns 503; the route performs no other action (Principle II)
- [X] T080 [P] [US6] Write `tests/delete-student.test.ts` for the `deleteStudentByEmail` library function: case-insensitive email match; returns counts before deleting; unknown email returns not-found and changes nothing; after deletion the student's data is absent from all queries in `docs/teacher-queries.sql` and `requireUser` returns null for their old session; signing in again with the same Google sub creates a new user with a new id (FR-026, FR-027, SC-008); this test reads the query file created by T077 (US5)

### Implementation

- [X] T081 [US6] Create `lib/retention.server.ts` (`import "server-only"`): `runRetention(db, now = new Date())` deleting users where `GREATEST(last_answer_at, last_sign_in_at, created_at) < now - interval '2 years'` (cascade does the rest) and pruning `daily_ai_usage` older than 7 days; returns `{ deletedStudents, prunedUsageRows }`
- [X] T082 [US6] Create `app/api/cron/retention/route.ts` (`GET`): return 503 if `CRON_SECRET` is unset; compare the `Authorization: Bearer` value to `CRON_SECRET` with `crypto.timingSafeEqual` (guarding length differences), 401 otherwise; call `runRetention`; return only the two counts (depends on T081)
- [X] T083 [P] [US6] Add `findUsersByEmail(db, email)` and `deleteUsersByEmail(db, email)` to `lib/db/queries/users.server.ts` (case-insensitive via `lower(email)`; the second returns the counts of attempts and results removed) and a `deleteStudentByEmail` wrapper in `lib/retention.server.ts`
- [X] T084 [US6] Create `scripts/delete-student.ts` (run as `npm run delete-student -- <email>`): `loadEnvConfig`; look up the email; if none, print "No student found with that email" and exit 1 without changes; otherwise print name, email, and counts of attempts and results, require the email to be typed to confirm (a `--yes` flag skips the prompt), delete, print what was removed (Principle VII: runs locally/CI only, never at request time) (depends on T083)

**Checkpoint**: All user stories work independently.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Docs, environment files, final gates and launch checks.


- [X] T085 [P] Update `README.md`: remove "No accounts" and "scores in localStorage" claims, the "Access gate" section, the `CLASS_CODE`/`SKIP_CLASS_CODE` table and the "runs with none set" statement; add Google sign-in and Neon setup, the new env vars (`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL`, `CRON_SECRET`, `LLM_DAILY_CAP`, `GRADE_RATE_LIMIT`, `GRADE_IP_RATE_LIMIT`, `ATTEMPT_RATE_LIMIT`), the 2-year retention job, `docs/teacher-queries.sql`, `npm run delete-student`, `npm test`, the fail-closed behaviour, and update the "How it's put together" table, the grade endpoint section and the Roadmap
- [X] T086 [P] Update `.env.example`: remove `CLASS_CODE` and `SKIP_CLASS_CODE`; add the new variables with comments (which are required in production, that missing ones make the site refuse to serve, `LLM_DAILY_CAP` default 40, preview environments must use a separate non-production database)
- [X] T087 [P] Update `.specify/templates/plan-template.md` Constitution Check placeholder to reference Principles I–IX and the Quality Gates from `.specify/memory/constitution.md`
- [X] T088 Run `npm test`, `npm run lint` (now possible after T006) and `npm run build` (which runs `gen:formulas` and `validate`); fix any failures; confirm `next build` succeeds with no auth or database env vars set (the fail-closed check must be per request, not at import)
- [X] T089 Constitution check sweep: grep for `NEXT_PUBLIC_`, for `OPENROUTER_API_KEY` inside `middleware.ts` and any client component, for imports of `content/answers` outside `lib/grading.server.ts`, and for any results query without a `user_id` filter (outside `docs/teacher-queries.sql` and `lib/retention.server.ts`); fix or document each finding
- [ ] T090 Measure SC-003 in a deployed Preview in `syd1`: `/api/grade` p95 added latency for saving is within about 150 ms versus the pre-feature baseline, and confirm the 1500 ms save timeout path returns a receipt **NOT DONE: needs a deployed Preview in syd1 with a real Neon database. Locally the save is raced against a 1500 ms timeout and the receipt path is covered by tests/api/grade.test.ts.**
- [ ] T091 Run every check in `specs/001-student-saved-scores/quickstart.md` (cross-device, own-results-only, resume, save failure, database down, session expiry mid-quiz, two devices, daily cap, fail closed, retention, delete a student, teacher queries) and record any deviation **PARTLY DONE: the fake-Neon end-to-end run exercised sign-in, saving, cross-student isolation, resume, database down and recovery, deleted-student handling and fail-closed production; the delete-student command and the production-build fail-closed/dev-login-absent checks were also run. NOT run: a real browser (session expiry and drafts are covered by tests/client/quiz.test.tsx instead), the daily cap with a real LLM key, the cron route on Vercel, and anything against real Google or Neon.**
- [ ] T092 Launch checklist (manual, record results in the PR): Neon project confirmed in `aws-ap-southeast-2`; Preview environment uses a separate database branched from an empty schema-only branch, never from production; Google OAuth client has the production and preview-alias redirect URIs; all required env vars set separately for Production and Preview; `CRON_SECRET` set and the cron visible in Vercel; `CLASS_CODE`/`SKIP_CLASS_CODE` removed from Vercel; school approval/consent obtained (Principle II); a named person owns `npm run delete-student` requests; Upstash database (if used) created in ap-southeast-2; the sign-in notice and the school consent both mention that typed answers go to a third-party AI service **NOT DONE: manual launch checklist for the project owner (Neon region, preview database, Google redirect URIs, Vercel env vars and cron, removing CLASS_CODE, school consent, a named owner for deletion requests).**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup; blocks every user story
- **US1 (Phase 3)**: depends on Foundational
- **US2 (Phase 4)**: depends on US1 (every route needs a session)
- **US3 (Phase 5)**: depends on US2 (it reads what US2 saves; the resume flow reuses the US2 quiz page)
- **US4 (Phase 6)**: depends on US2 (it changes the grade route and `Quiz.tsx`)
- **US5 (Phase 7)**: depends only on Foundational (the tests seed the database directly), so it can run in parallel with any story phase
- **US6 (Phase 8)**: the retention and cron parts depend only on Foundational; its delete test needs US1's `requireUser` (old session rejected) and US5's SQL file (see the task that reads docs/teacher-queries.sql: student absent from the teacher queries)
- **Polish (Phase 9)**: after the stories you intend to ship

### Release gate

Do not deploy US2 or US3 to production without US4. Any Google account can sign in, and until US4 lands the only protection on the paid LLM path is the class-code gate that US2 deliberately keeps. US4 removes that gate and adds the daily cap in the same release. Until then the code still contains the class-code gate that constitution v2.3.0 describes as retired; that is deliberate and transitional.

### Within each story

1. Tests first and failing, then implementation
2. Queries and libraries before routes, routes before pages and components
3. Tasks that edit the same file are not marked [P] (`app/api/grade/route.ts`, `components/Quiz.tsx`, `app/unit/[unitId]/page.tsx`, `lib/db/queries/users.server.ts` are edited by more than one story, in story order)

### Parallel Opportunities

- Setup: the config files marked [P] together
- Foundational: `dbclient`, `migrate`, `config` and the two tests together once the schema exists
- Each story: all of its test files together, then `[P]` libraries (for example US2 `draw`, `types`, `clientlibs`, `retryroute`, `selfroute`; US3 `stats`, `history_ui`, `progress`)
- US5 and US6 can be done by a second person at any time after Phase 2

---

## Parallel Example: User Story 2

```text
# All US2 tests together:
Task: "Write tests/tokens.test.ts"
Task: "Write tests/attempts/draw.test.ts"
Task: "Write tests/api/attempts.test.ts"
Task: "Write tests/api/grade.test.ts"
Task: "Write tests/api/retry.test.ts"
Task: "Write tests/api/self-mark.test.ts"

# Independent libraries together:
Task: "Create lib/attempts/draw.server.ts"
Task: "Update lib/grading.ts types"
Task: "Create lib/outbox.ts and lib/drafts.ts"
```

---

## Implementation Strategy

### MVP first

1. Phase 1 and Phase 2
2. Phase 3 (US1): sign-in gating. Validate, then stop if you only want to protect the site
3. Phase 4 (US2): answers are saved. This is the first slice with real value for the teacher's data
4. Phase 6 (US4) before any production deploy of US2 (see Release gate)
5. Phase 5 (US3): students see their history on any device

### Incremental delivery

1. Foundation, then US1, then US2 + US4 together as the first production release (sign-in, saving, cap)
2. US3 next, so students get cross-device history
3. US5 (teacher queries) can ship as soon as there is data to query
4. US6 (retention and delete) is a launch blocker for minors' data: ship with or before the first production release, with the consent item in the launch checklist

### Notes

- Commit after each task or logical group; run `npm test` before every commit
- Never read `content/answers` outside `lib/grading.server.ts`; never filter results by an id taken from the client
- Stop at any checkpoint to validate the story on its own


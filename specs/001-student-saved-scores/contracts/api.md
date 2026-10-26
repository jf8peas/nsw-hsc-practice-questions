# API Contracts

All routes except `/signin`, `/api/auth/*` and `/api/cron/retention` require a signed-in session
whose user row still exists (`requireUser()`). Unauthenticated page requests redirect to
`/signin?callbackUrl=…`; unauthenticated `/api/*` requests get `401 { "error": "unauthenticated" }`.
No route accepts a user id from the client. All bodies are JSON.

Common error shapes: `400 { error: "invalid_request" }`, `401 { error: "unauthenticated" }`,
`404 { error: "not_found" }` (also used when the attempt belongs to someone else, so ids cannot
be probed), `429 { error: "rate_limited", retryAfter }`, `503 { error: "not_configured" }` (production config missing) or `503 { error: "temporarily_unavailable" }` (database unreachable, on routes with no degraded path; never 401). `DbUnavailableError` means a 1500 ms timeout or connection-level error; any other error is an ordinary 500.

## Types

```ts
/** Public question as sent to the browser. MC options are already in display order. */
type PublicQuestion = Omit<Question, "options"> & { options?: string[] };

interface SavedFields {
  saved: boolean;          // true if the result is in the database
  receipt?: string;        // present only when saved === false (see tokens.md)
}
```

## POST /api/attempts

Start a new attempt: server-side draw (research R14).

Request: `{ "unitId": string }`

`201`:
```json
{
  "attemptId": "uuid",
  "attemptToken": "…",
  "persisted": true,           // false when the database was unavailable; nothing stored
  "unitId": "y11-formula-test",
  "passMark": 70,
  "questions": [ /* PublicQuestion[], in quiz order */ ],
  "answered": {}
}
```
- `404` unknown unit. Limited by `ATTEMPT_RATE_LIMIT` per user per minute.
- When the database is unavailable the draw still happens and the response has `persisted: false`;
  nothing is stored and resume is not offered. The client keeps the response in `sessionStorage`.
- Does not touch earlier incomplete attempts.

## GET /quiz page: `/unit/[unitId]/quiz?attempt=<id>`

A server-rendered page, not an API. Loads the attempt scoped to the session user, drops drawn
questions that are retired or already answered from the *remaining* list, and passes the
client `{ attemptId, attemptToken, questions (all non-retired, in order), answered: { [questionId]: marks } }`.
It also issues a fresh `attemptToken`. If the database is unavailable it renders the quiz in offline mode from the `sessionStorage` entry written when the attempt started (research R19). Unknown or someone else's attempt id renders the not-found page. Opening it with no `attempt`
parameter redirects to the unit page.

## POST /api/grade

Grade one answer and save it (replaces the current endpoint).

Request: `{ "attemptId": string, "attemptToken": string, "questionId": string, "answer": string }`
- For MC, `answer` is the **display index** as a string (research R14).
- `answer` is truncated at 6000 characters as today.

Server checks, in order: session user (row must exist; see degraded mode below) → `attemptToken` valid,
unexpired, and bound to the session user and `attemptId` (else `400 invalid_attempt_token`) → question is
in the token's `questionIds` (404) → no result exists for `(attemptId, questionId)` (else `409
{ error: "already_answered", result }` where `result` is the stored mark, so a double-tap is
harmless) → for short answers: per-user then per-IP rate limit → reserve one daily AI slot (only
when the LLM is configured and the answer is non-empty).

`200`:
```json
{
  "result": {
    "questionId": "…", "type": "mc" | "short", "maxMarks": 1,
    "marksAwarded": 1,          // null when needsSelfMark
    "needsSelfMark": false,
    "correctDisplayIndex": 2,   // MC only
    "modelAnswer": "…", "rubric": ["…"], "notes": "…",   // short only, as today
    "feedback": "…", "rubricHits": ["…"], "rubricMisses": ["…"]
  },
  "saved": true,
  "degraded": false,             // true when the database could not be read
  "attemptCompleted": false,   // null when degraded
  "selfMarkToken": "…",         // only when needsSelfMark
  "aiLimit": {                  // only when this fallback was caused by the daily cap
    "reached": true, "resetsAt": "2026-10-27T00:00:00+11:00"
  }
}
```
- If `saved` is `false`, `receipt` is included and the mark is still returned (FR-008).
- If the attempt row does not exist yet (the attempt was started while the database was down), it is created from the `attemptToken` fields (`ON CONFLICT (id) DO NOTHING`, rejected if the id belongs to another user) before the result is inserted, so the first save never fails the foreign key.
- **Degraded mode** (database unavailable, research R19): the user-exists and already-answered checks
  are skipped and grading uses only the JWT and the attempt token. MC is graded from the token's option
  order and returned with `saved: false`, a `receipt` (which also carries the attempt fields) and
  `degraded: true`. A short answer returns
  `needsSelfMark: true`, a `selfMarkToken` and `aiUnavailable: true`, with no LLM call. A
  deleted student (row missing while the database is up) still gets `401`.
- **Client on `409 already_answered`**: show the stored mark from `result` and move to the next
  question; do not treat it as an error (same attempt open on two devices).
- **Client on `400 invalid_attempt_token`**: reload the quiz page (draft preserved) to get a fresh
  token.
- A needs-self-mark result is **not** saved here; it is saved by `/api/results/self-mark`.
- Result fields never include stored per-result model answers; the model answer and rubric shown
  after submitting are read from the answer key at grade time, as today (Principle I).
- The old `GET /api/grade` (gate status) is removed.

## POST /api/results/self-mark

Save the student's own mark for a short answer the grader could not mark.

Request: `{ "attemptId", "attemptToken", "questionId", "answer", "correct": boolean, "token": string }`

Accepted only if: the session user matches the token's `uid`; the token is valid and unexpired;
`attemptId`/`questionId` match the token; `sha256(answer)` equals the token's `answerHash`; the
question is a short question in the attempt; and no result exists yet. Marks are `maxMarks` if
`correct`, else `0`; `graded_by = 'self'`.

`200 { "saved": true, "attemptCompleted": boolean }`. Works in degraded mode (the session JWT is accepted when the user row cannot be checked; no database read is required before the insert). On a save failure: `200 { "saved": false,
"receipt": "…" }` (so a failed self-mark save is retried like any other).
Errors: `400` bad token/mismatch, `401`, `404`, `409 already_answered`, `422 not_short_question`.

## POST /api/results/retry

Re-send a result whose save failed.

Request: `{ "receipt": string }`

Verifies the HMAC and expiry; the receipt's `uid` must equal the session user; re-checks that the user
row exists. Then creates the attempt row from the receipt's `attempt` fields if it is missing
(`ON CONFLICT (id) DO NOTHING`; an existing attempt owned by someone else is rejected), `INSERT … ON
CONFLICT DO NOTHING` for the result, updates `last_answer_at`, runs the completion check.

- `200 { "saved": true, "duplicate": boolean }` (duplicate means the row already existed).
- `410 { error: "student_not_found" }` when the user row is missing (deleted or never created): nothing
  is written and the client drops the receipt silently, with no "result lost" notice.
- `400 { error: "invalid_receipt" }` for a bad or expired signature, or `403` for a different user.
  These are definitive: the client drops the entry and shows "result lost".
- `503` (database still unavailable) and other `5xx`: transient; the client keeps the entry and backs
  off.

## Auth.js: `/api/auth/*`

Standard Auth.js v5 handlers (sign-in, callback, sign-out, session, CSRF). Providers: Google; plus
a Credentials `dev-login` provider only when `NODE_ENV !== "production"`.

## GET /api/cron/retention

Not session-protected. Requires `Authorization: Bearer <CRON_SECRET>` (Vercel sends this when
`CRON_SECRET` is set); `401` otherwise, and `503` if `CRON_SECRET` is unset. Deletes students whose
last activity is more than 2 years old and prunes old `daily_ai_usage` rows.
`200 { "deletedStudents": number, "prunedUsageRows": number }`.

## Pages

| Route | Purpose |
|---|---|
| `/signin` | Public. What the site is, the data notice (FR-003), "Sign in with Google" (and dev login in development) |
| `/` | Home: units list (unchanged) |
| `/unit/[unitId]` | Unit overview, attempt history, best/latest (completed only), resume offer, Start quiz |
| `/unit/[unitId]/quiz?attempt=<id>` | Quiz runner |
| `/progress` | Per-unit summary: attempt count, latest %, best %, trend, plus each unit's most recent attempts linking to the attempt detail |
| `/attempts/[attemptId]` | Attempt detail: each question, the student's answer, marks, stored feedback; retired questions labelled |

Every page calls `requirePageUser()` and queries with the session user's id. When the database is unavailable the unit page, quiz, `/progress` and attempt detail still render: the history sections show "History is temporarily unavailable — your answers are still being marked and will be saved." (never a 500), "Start quiz" works and "Continue attempt" is hidden. `/attempts/[attemptId]`
for another student's attempt renders not-found, identical to an unknown id.

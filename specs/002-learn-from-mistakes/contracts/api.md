# API Contracts: Learn From Mistakes

New and changed routes only. Everything in
[spec 001's contracts](../../001-student-saved-scores/contracts/api.md) still applies: every route
requires a signed-in session whose user row exists (`401 { error: "unauthenticated" }`, or `503
{ error: "temporarily_unavailable" }` when the database is down on a route with no degraded path),
no route accepts a user id from the client, and all bodies are JSON unless stated.

Two extra error shapes are used by the teacher routes:

- `403 { "error": "forbidden" }`: signed in, but not on the teacher allow-list. Returned for the
  API routes; the teacher *page* answers `404` instead, so its existence is not revealed.
- `409 { "error": "busy" }`: a worker already holds the lease for that concept and kind.

## Changed: POST /api/attempts

No change to the request or response shape. Behaviour change: for a unit with `conceptsReady`, a
quiz-sized `quiz` config and at least one uncleared concept for the signed-in student, exactly
half the questions (rounded up) are drawn from that student's uncleared concepts (research R4).
The response is identical in shape, nothing marks which questions were weighted, and the signed
attempt token carries the drawn ids as before. If the student's results cannot be read (database
down or slow), the draw is unweighted and the response is unchanged (`persisted` behaves as today).

## Changed: POST /api/grade

Request unchanged (`attemptId`, `attemptToken`, `questionId`, `answer`).

`result` (type `GradeResult`, `lib/grading.ts`) gains one optional field:

```ts
/** MC only. The written reason the chosen option is wrong. Present only when the unit is
 *  explanationsComplete, the answer was wrong and an explanation exists for that option. */
optionExplanation?: string;
```

It is set from the server-only answer key through `getOptionExplanation()` in
`lib/grading.server.ts`, so it also works on the degraded path (database down, graded from the
attempt token). A correct answer never includes it, and no other option's explanation is ever
sent (SC-008). `409 already_answered` bodies carry the same field, recomputed from the stored
option text.

## Changed: POST /api/results/retry

Request unchanged (`{ receipt }`). Behaviour change: the stored result's `created_at` is the
receipt's issue time (`iat`), so a result saved late keeps the time it was answered. A duplicate
still returns `{ saved: true, duplicate: true }` and changes nothing.

## New: POST /api/units/[unitId]/concepts/ensure

Called once by the unit page when some listed concept has no approved summary. Starts background
work (generate → review) for the signed-in student's own uncleared concepts in that unit that need
it. Never waits for the model.

Path: `unitId` must name a unit with `conceptsReady`, otherwise `404 { error: "not_found" }`.
Body: none. The concepts come from the student's own results; the client chooses nothing.

Rate limited per student (`CONCEPT_RATE_LIMIT`, default 10 per minute): `429 { error:
"rate_limited", retryAfter }`.

`202`:
```json
{ "queued": ["y11-economics-preliminary.c-scarcity"], "pending": true, "version": "a1b2c3" }
```

`200` (nothing to do: everything approved, in backoff, terminal, or the cap or reviewer is
unavailable):
```json
{ "queued": [], "pending": false, "version": "a1b2c3" }
```

- `queued`: concept ids this call claimed. A concept is claimed only when it has nothing stored, or
  has a version still `pending_review` (a retry of a pending review), and no unexpired lease or
  `retry_after`. A version in `failed_review` is never claimed.
- The background run reserves a cap slot before every model call. When the cap is reached or
  `REVIEW_MODEL` is unset or equal to the generator, the run stops and leaves the version pending;
  the response is still `202`/`200` and the page keeps showing descriptions (FR-031).
- At most 3 concepts are claimed per call, highest count first.

## New: GET /api/units/[unitId]/concepts/status

Cheap poll used by the unit page while `pending` is true.

`200`:
```json
{ "pending": false, "version": "a1b2c3" }
```

- `pending` is true only while a worker holds an unexpired lease on one of this student's listed
  concepts.
- `version` is a short hash of the approved version ids for the student's listed concepts. When it
  changes the page calls `router.refresh()` once.

Same `404` and session rules as above. Read-only.

## New: GET /api/concepts/[conceptId]/illustration

Serves a concept's illustration. Used only as an `<img src>` (Principle VII).

Query: `v=<versionId>` (required).

- `200` with the SVG only when `v` is the concept's **live approved** illustration. Anything else
  (unknown concept, another version, a superseded version, none approved) is `404 { error:
  "not_found" }`.
- Headers: `Content-Type: image/svg+xml`, `X-Content-Type-Options: nosniff`,
  `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`,
  `Cache-Control: private, max-age=31536000, immutable` (the URL carries the version id).
- Alt text is not in this response; the page already has it from the version it rendered.

## New: GET /admin/concepts (page)

Teacher review page. Server-rendered; calls `requireAdminPage()`. A signed-out visitor goes to
`/signin`; a signed-in user not on `ADMIN_EMAILS` gets the not-found page. It lists, per unit and
concept: the live summary and picture, the replacement's review status and the reviewer's reason
(teacher-only), the generator and reviewer models, generation, review and approval times, who
approved, the slot's `last_error`, and "not generated" where nothing exists. It never shows
student data.

## New: POST /api/admin/concepts/regenerate

Request a teacher regeneration of one item.

Body: `{ "conceptId": string, "kind": "summary" | "illustration" }`

- `403 forbidden`: caller is not on the allow-list (checked on the server on every call).
- `404 not_found`: unknown concept, or the unit is not `conceptsReady`; for `illustration`, also
  when `ILLUSTRATION_MODEL` is unset.
- `404 no_illustration_brief`: `kind` is `illustration` but neither the live nor the replacement
  summary carries an illustration brief (the summary decided none is needed).
- `409 busy`: a worker already holds the lease.
- `503 reviewer_unavailable`: `REVIEW_MODEL` is unset or is the same model as the generator, so a
  replacement could never be approved. Nothing is generated or spent.
- `429 cap_reached` with `{ resetsAt }` (Sydney ISO time): the daily concept cap is used up. The
  existing live version is untouched (FR-055).
- `202 { "queued": true }`: a replacement will be generated and reviewed in the background. The
  live version stays on show until the replacement is approved (FR-054). If the replacement later
  fails or fails review twice, the page shows it as a flagged replacement and the live version is
  unchanged.

A teacher's regeneration reserves cap slots like any other run and gets the single automatic
regeneration if the first replacement fails review.

## New: GET /api/admin/concepts/[conceptId]/illustration

Teacher preview of any version.

Query: `v=<versionId>`. `403` for non-teachers. `200 image/svg+xml` with the same security headers
as the student route but `Cache-Control: private, no-store`. `404` when the version does not
belong to that concept.

## Not exposed

- No route returns `reviewer_reason`, `last_error`, the generator or reviewer model names, or any
  model answer or rubric to a student.
- No route accepts a student id, marks, a review verdict or a version id for approval. Approving a
  flagged item is done in the backend with `npm run concept:approve` (research R10), not over HTTP.

## Server-side modules these routes use (for reference)

| Module | Role |
|---|---|
| `lib/concepts/progress.ts` | Pure replay of results into concept states |
| `lib/concepts/weighting.server.ts` | Loads a student's results for the weighted draw |
| `lib/concepts/store.server.ts` | Slots, versions, lease claim, promotion, cap reservation |
| `lib/concepts/pipeline.server.ts` | Generate → review → one regeneration → flag |
| `lib/concepts/llm.server.ts` | Prompts, JSON parsing, the port the pipeline calls |
| `lib/concepts/svg.server.ts` | SVG allowlist check and rendering to PNG |
| `lib/grading.server.ts` | `getOptionExplanation`, `getReviewMaterial` (the only readers of the answer key) |
| `lib/admin.server.ts` | `ADMIN_EMAILS` check: `requireAdminPage`, `authenticateAdmin` |
| `lib/background.server.ts` | `runInBackground()` over `after()` |

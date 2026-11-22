# Contracts: Economics Essay Writing (spec 010)

All routes require a session (`401 unauthenticated` otherwise), are `runtime = "nodejs"`, and check the signed attempt token (`verifyAttemptToken`, bound to the user, attempt and question) and attempt ownership (`getAttemptForUser`) before acting. The client **never** sends a user id, a mark, a band or a word count. Errors are `{ error: "<code>" }`. Slice tags: **[S1]**, **[S2]**.

Shared types:

```ts
type EssayStage = "scaffold" | "write" | "result";
interface PublicEssay { id: string; prompt: string; verb: string; verbDefinition: string;
  economy: "china"|"nepal"|"both"; offer: number; source?: string }        // no key fields
interface EssayState {                                                      // what start/resume returns
  stage: EssayStage;
  essay: PublicEssay;
  scaffold: EssayScaffold;                // own text
  locked: boolean;
  review?: PlanReview;                    // only if one was made (S2); omitted otherwise
  draft?: string;                         // the essay draft (stage "write")
  result?: EssayResultView;               // stage "result" (a finished attempt resumed)
  cap?: { resetsAt: string };             // present when the student is at today's limit (Submit disabled)
}
interface NotMarked { reason: "marker_unavailable" | "daily_limit"; resetsAt?: string }   // 008's type
```

## A. Unit page data (server component, `app/unit/[unitId]/page.tsx`) [S1]

Not an HTTP route. Props built server-side for the session user:

```ts
{ essays: Array<{ question: PublicEssay;                       // live essays only, sorted by offer
                  latest: { mark: number; band: number; attemptId: string; at: string } | null;
                  open: boolean;                               // this essay has the open attempt
                  nextUp: boolean }>,                          // first live essay in offer order with no result
  openAttempt: { essayId: string; stage: EssayStage } | null,
  gaps: Array<{ conceptId; term; description; count: 1|2; detail?: string }> }  // via the existing concept panel
```

Database unreadable → a notice, no list (never a guess). No key fields.

## B. Attempt start, resume and discard

### `POST /api/attempts` — body `{ unitId, questionId? }` [S1]

(Existing route, new branch for `unit.flow === "essay"`; rate limit `checkAttemptRateLimit`.)

| Case | Response |
|---|---|
| `questionId` given, essay live, no open attempt | `201 { attemptId, attemptToken, persisted: true, unitId, questions: [PublicEssay], essayState }` (a new attempt in stage "scaffold") |
| open attempt for the same essay | `200 { …same…, resumed: true }` |
| open attempt for another essay | `409 { error: "attempt_open", questionId: "<the open essay>" }` |
| `questionId` unknown or not live | `404 { error: "not_found" }` |
| no `questionId`, open attempt exists | `200 { …, resumed: true }` |
| no `questionId`, none open | `404 { error: "no_open_attempt" }` |
| database unreadable | `503 { error: "temporarily_unavailable" }` |
| rate limited | `429 { error: "rate_limited", retryAfter }` |

A finished-essay Redo is `questionId` of that essay: a new attempt (the previous one is complete). A race of two tabs starting at once ends on one attempt via `attempts_essay_incomplete_unique` (`resumed: true` for the loser).

### `POST /api/essay/discard` — body `{ attemptId, attemptToken, questionId }` [S2]

`200 { discarded: true }` (the attempt row and, by cascade, its essay row, draft and nothing else); `409 { error: "marking_in_progress" }` if the lease is younger than 130 s; `409 { error: "already_finished" }` if the attempt is complete (finished attempts are never deleted); `404` if not the student's. Earlier finished attempts of the same essay are untouched.

## C. Scaffold save and lock — `POST /api/essay/scaffold` [S1]

Body `{ attemptId, attemptToken, questionId, action: "save" | "start", scaffold: EssayScaffold }`. Per-user limiter `checkDraftRateLimit`.

| Case | Response |
|---|---|
| `save`, under the cap | `200 { saved: true, words }` |
| `save`, over 250 words | `400 { error: "over_cap", words, max: 250 }` (not stored) |
| `start`, valid | `200 { started: true, stage: "write", locked: true }` — status `planning → writing`, `scaffold_locked_at` set, scaffold stored |
| `start`, invalid | `400 { error: "scaffold_invalid", reasons: ("over_cap"\|"no_judgement"\|"no_body_point")[] }` |
| any call after the scaffold is locked | `409 { error: "scaffold_locked" }` |
| malformed body or non-string field | `400 { error: "invalid_request" }` |

The server recounts words itself; `start` is idempotent only through the lock (a second `start` is `409 scaffold_locked`, the client then loads the essay page).

## D. Plan review — `POST /api/essay/review` [S2]

Body `{ attemptId, attemptToken, questionId, scaffold }`. Steps: validate as `start`; refuse if a review exists; rate limits; one `LLM_DAILY_CAP` slot; reviewer call (own model, own prompt, one retry); on success store review and lock in one update.

| Case | Response |
|---|---|
| success | `200 { review: PlanReview, stage: "write" }` |
| reviewer unreachable, unparseable twice, no key, or `LLM_DAILY_CAP=0` | `200 { notReviewed: { reason: "reviewer_unavailable" } }` — slot refunded, **not locked** |
| daily limit | `200 { notReviewed: { reason: "daily_limit", resetsAt } }` — nothing locked |
| already reviewed | `409 { error: "already_reviewed" }` |
| locked already | `409 { error: "scaffold_locked" }` |
| invalid scaffold | `400 { error: "scaffold_invalid", reasons }` |
| rate limited | `429` as above |
| database unreadable | `503 { error: "temporarily_unavailable" }` |

```ts
interface PlanReview { checks: Array<{ id: "answers"|"scope"|"band"|"data"|"models"|"evaluation"|"fit";
                                        status: "strength"|"fix"; line: string }>;   // always 7, spec order
                       figureFlags: Array<{ quote: string; why: string }> }          // "check this figure", no number
```

No mark, no band. The result view never contains it.

## E. Essay draft save — `POST /api/rewrite/draft` [S1]

Existing route, now accepting `type: "essay"` questions: body `{ attemptId, attemptToken, questionId, phase: 1, draft }` (cap 8000 characters). `200 { saved: true }`, or `{ saved: false }` when the attempt is complete or the essay row is `finished` (stale beacon) or still `planning` (the essay cannot be drafted before the scaffold is locked). Per-user limiter as today. Beacon (`navigator.sendBeacon`) and `sessionStorage` as spec 006/007.

## F. Grade — `POST /api/grade` (essay branch) [S1]

Body `{ attemptId, attemptToken, questionId, answer }` (no `phase`). Order of checks: parse → words (**before any limit, slot or call**) → database → row state → lease → marking available → rate limits → slot → marker → store.

| Case | Response |
|---|---|
| words < 600 | `400 { error: "essay_too_short", words, min: 600, max: 800 }` |
| words > 800 or > 8000 characters | `400 { error: "essay_too_long", words, min: 600, max: 800 }` |
| empty | `400 { error: "invalid_request" }` |
| attempt not in `writing` (still planning) | `409 { error: "scaffold_not_locked" }` |
| already finished | `409 { error: "already_answered", result: EssayResultView }` |
| lease held (double submit, second tab) | `409 { error: "marking_in_progress" }` |
| database unreadable | `503 { error: "temporarily_unavailable" }` |
| rate limited | `429 { error: "rate_limited", retryAfter }` |
| marking off (no key / cap 0) or marker failed twice | `200 { notMarked: { reason: "marker_unavailable" }, saved: false }` — slot refunded, lease cleared, draft saved |
| daily limit | `200 { notMarked: { reason: "daily_limit", resetsAt }, saved: false }` — lease cleared, draft saved, no slot taken |
| marked | `200 { result: EssayResultView, saved: true, attemptCompleted: true }` (or `saved:false` plus a `receipt` if the result row save failed, as 008) |

`EssayResultView` (built only by `lib/essay/views.ts`):

```ts
interface EssayResultView {
  questionId: string; essay: PublicEssay;
  finalMark: number;              // 1–20
  band: 1|2|3|4|5;
  capped: boolean;                // true when the one-economy cap lowered the mark
  criteria: Record<"understanding"|"theory"|"assessment"|"data"|"structure",
                   { verdict: "strong"|"sound"|"developing"|"weak"; reason: string }>;
  bandReason: string;
  lift: string[];                 // two items
  flags: Array<{ quote: string; why: string }>;
  gaps: Array<{ conceptId: string; term: string; detail: string }>;   // ≤ 5, most important first
  essay: string;                  // the student's text
  plan: EssayScaffold;            // read-only, beside the essay
  words: number;
  modelEssay: string;             // present ONLY here: the student's own finished result
}
```

Never present: marking notes, school criteria, concept tags, the review, raw mark.

## G. Result and attempt detail [S1]

`GET /attempts/[attemptId]` (page): the finished attempt → `EssayResultView` (including `modelEssay`); an unfinished attempt → `{ essay, plan, draft }` only, with **no** `modelEssay`; another student's attempt → 404.

## H. Reply formats

See [replies.md](replies.md) for the marker's and the reviewer's JSON replies and their validation.

## I. What each response may carry (summary, as research R12)

Public essay fields and the student's own text everywhere; the five verdicts, band, marks, lift points, flags, gaps and used-well only after marking; the model essay only in `EssayResultView`; marking notes, school criteria and concept tags never. Covered by `tests/no-key-leak.test.ts` over every essay in the unit.

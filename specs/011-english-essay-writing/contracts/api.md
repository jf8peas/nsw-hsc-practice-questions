# Contracts: English Essay Writing (spec 011)

All routes require a session (`401 unauthenticated` otherwise), use `runtime = "nodejs"`, and verify the signed attempt token (bound to user, attempt and question) and attempt ownership before acting. The client never sends a user id, mark, band, model, grading method or word count. Errors are `{ "error": "<code>" }` unless a `notMarked`/`notReviewed` fallback is specified. Slice tags: **[S1]**, **[S2]**.

## Shared types

```ts
type EnglishEssayStage = "scaffold" | "write" | "result";

interface PublicEnglishEssay {
  type: "englishEssay";
  group: "englishEssay";
  maxMarks: 20;
  live: boolean;
  id: string;
  prompt: string;
  directive: "to what extent" | "discuss" | "how" | "evaluate";
  directiveDefinition: string;
  directiveGuidance: "nesa" | "unit";
  offer: number;
  source: string;
  conceptIds: string[];                 // public skill-* practice tags only
}

interface EnglishEssayState {
  stage: EnglishEssayStage;
  essay: PublicEnglishEssay;
  scaffold: EnglishEssayScaffold;        // own text
  locked: boolean;
  review?: EnglishPlanReview;            // only if one was made [S2]
  draft?: string;                        // stage write
  result?: EnglishEssayResultView;       // stage result only
  cap?: { resetsAt: string };            // daily cap reached; Submit disabled
}

interface EnglishEssayNotMarked {
  reason: "marker_unavailable" | "daily_limit" | "reference_text_unavailable";
  resetsAt?: string;                     // daily_limit only
}

interface EnglishEssayNotReviewed {
  reason: "reviewer_unavailable" | "daily_limit" | "not_live";
  resetsAt?: string;                     // daily_limit only
}
```

`PublicEnglishEssay` has no marking notes, Away notes, key concept tags, model essay or reference text. `EnglishEssayResultView` is defined in section G and [data-model.md](../data-model.md) §10.2.

## A. Unit page data (server component) [S1]

Not an HTTP route. Props built for the session user:

```ts
{
  essays: Array<{
    question: PublicEnglishEssay;         // live only, offer order 1–6
    latest: { mark: number; band: number | null; attemptId: string; at: string } | null;
    open: boolean;
    nextUp: boolean;
  }>;
  openAttempt: {
    essayId: string;
    attemptId: string;
    stage: "scaffold" | "write";
    attemptToken: string;                // server-signed for Discard
  } | null;
  gapDetails: Record<string, string>;
}
```

`latest.band` is `final_band`. Database unreadable returns a notice and no list; the server never guesses. No key fields or play text.

## B. Attempt start, resume and discard

### `POST /api/attempts` — `{ unitId, questionId? }` [S1]

New `unit.flow === "englishEssay"` branch, using `checkAttemptRateLimit`.

| Case | Response |
|---|---|
| live `questionId`, no open attempt | `201 { attemptId, attemptToken, persisted: true, unitId, questions: [PublicEnglishEssay], englishEssayState }` at `scaffold` |
| open attempt for same essay | `200` same payload plus `resumed: true` |
| open attempt for another essay | `409 { error: "attempt_open", questionId: "<open essay>" }` |
| unknown or non-live id | `404 { error: "not_found" }` |
| no `questionId`, open attempt exists | `200` same payload plus `resumed: true` |
| no `questionId`, none open | `404 { error: "no_open_attempt" }` |
| database unreadable | `503 { error: "temporarily_unavailable" }` |
| rate limited | `429 { error: "rate_limited", retryAfter }` |

Redo is a start with a finished essay's id and creates a new attempt. Two racing starts resolve through `attempts_english_essay_incomplete_unique`; the loser resumes the winner. `englishEssayState` contains no key material.

### `POST /api/english-essay/discard` — `{ attemptId, attemptToken, questionId }` [S1]

| Case | Response |
|---|---|
| open, unmarked, lease null or older than 130 s | `200 { discarded: true }` |
| active marking lease | `409 { error: "marking_in_progress" }` |
| finished attempt | `409 { error: "already_finished" }` |
| not the student's attempt | `404 { error: "not_found" }` (a bad token is `401`) |
| database unreadable | `503 { error: "temporarily_unavailable" }` |

The attempt row is deleted; its phase and draft cascade. Earlier finished attempts and their results are untouched.

## C. Scaffold save and lock — `POST /api/english-essay/scaffold` [S1]

Body:

```ts
{
  attemptId: string;
  attemptToken: string;
  questionId: string;
  action: "save" | "start";
  scaffold: EnglishEssayScaffold;
}
```

`save` uses `checkDraftRateLimit`. The server sanitises and recounts all seven fields.

| Case | Response |
|---|---|
| `save`, 0–150 words | `200 { saved: true, words }` |
| `save`, over 150 | `400 { error: "over_cap", words, max: 150 }` (not stored) |
| `start`, valid | `200 { started: true, stage: "write", locked: true }` |
| `start`, over cap or whitespace-only thesis | `400 { error: "scaffold_invalid", reasons: ("over_cap" | "no_thesis")[], words }` |
| any call after lock | `409 { error: "scaffold_locked" }` |
| malformed body/non-string field | `400 { error: "invalid_request" }` |
| database unreadable | `503 { error: "temporarily_unavailable" }` |

Claims and evidence notes are never compulsory. A valid start conditionally updates `planning → writing` and sets `scaffold_locked_at`.

## D. Plan review — `POST /api/english-essay/review` [S2]

Body `{ attemptId, attemptToken, questionId, scaffold }`. Validation is the same as `start`. The route checks `ENGLISH_ESSAY_REVIEW_LIVE`, refuses a second review, applies rate limits, reserves one daily slot, calls the independent reviewer once with one retry, and stores review + lock atomically on success.

| Case | Response |
|---|---|
| success | `200 { review: EnglishPlanReview, stage: "write", locked: true }` |
| reviewer unavailable, no key, cut-off/malformed twice, cap setting 0 | `200 { notReviewed: { reason: "reviewer_unavailable" } }` — refunded, not locked |
| daily limit | `200 { notReviewed: { reason: "daily_limit", resetsAt } }` — no slot, not locked |
| review not live | `200 { notReviewed: { reason: "not_live" } }` — no slot/call, not locked |
| already reviewed | `409 { error: "already_reviewed" }` |
| already locked | `409 { error: "scaffold_locked" }` |
| invalid scaffold | `400 { error: "scaffold_invalid", reasons, words }` |
| rate limited | `429 { error: "rate_limited", retryAfter }` |
| database unreadable | `503 { error: "temporarily_unavailable" }` |

```ts
interface EnglishPlanReview {
  checks: Array<{
    id: "thesis" | "claims" | "development" | "evidence" | "fit";
    status: "strength" | "fix";
    line: string;
  }>;                                      // exactly five, in this order
}
```

No mark, band or replacement writing. The result view never includes the review.

## E. Essay draft save — `POST /api/rewrite/draft` [S1]

Existing route, new `englishEssay` branch:

```ts
{ attemptId, attemptToken, questionId, phase: 1, draft: string }
```

Maximum 12,000 characters. `200 { saved: true }` while the English row is `writing`; `200 { saved: false }` while planning, once finished, or when the attempt is complete. Phase 2 is `400 invalid_request`. Existing draft limiter, ownership and token checks apply. The shared grade route does not apply its 6,000-character truncation to `englishEssay`.

## F. Grade — `POST /api/grade` (English branch) [S1]

Body `{ attemptId, attemptToken, questionId, answer }` (no `phase`). Order: parse → word/character checks → database/row state → lease → reference text → marking available → rate limits → daily slot → marker → quote check → final-mark function → finalise → result save.

| Case | Response |
|---|---|
| words < 800 | `400 { error: "essay_too_short", words, min: 800, max: 1200 }` |
| words > 1,200 or >12,000 characters | `400 { error: "essay_too_long", words, min: 800, max: 1200 }` |
| empty | `400 { error: "invalid_request" }` |
| still planning | `409 { error: "scaffold_not_locked" }` |
| already finished | `409 { error: "already_answered", result: EnglishEssayResultView }` |
| active lease | `409 { error: "marking_in_progress" }` |
| reference text missing/unreadable | `200 { notMarked: { reason: "reference_text_unavailable" }, saved: false }` — no model/slot, lease cleared, draft saved |
| database unreadable | `503 { error: "temporarily_unavailable" }` |
| rate limited | `429 { error: "rate_limited", retryAfter }` |
| no key / cap 0 / marker failed twice | `200 { notMarked: { reason: "marker_unavailable" }, saved: false }` — refunded, lease cleared, draft saved |
| daily limit | `200 { notMarked: { reason: "daily_limit", resetsAt }, saved: false }` — no slot, draft saved |
| marked | `200 { result: EnglishEssayResultView, saved: true, attemptCompleted: true }` |
| marked but result-row save failed | `200 { result, saved: false, attemptCompleted: null, receipt }` — own finished result still shown; repair on next visit |

The reference check occurs before a model call or daily slot. The quote check runs on the server after a valid marker reply and before finalisation. No self-marking path exists.

## G. Result and attempt detail payloads [S1]

```ts
interface EnglishEssayResultView {
  questionId: string;
  essay: PublicEnglishEssay;
  finalMark: number;                       // 1–20
  finalBand: 1 | 2 | 3 | 4 | 5;            // band containing finalMark
  capped: boolean;                         // finalMark < clampedMark
  knowledgeCapApplied: boolean;            // two or more deduplicated errors
  focusCap: 12 | 10 | null;                // partly/barely, null for fully
  criteria: Record<"argument" | "analysis" | "knowledge" | "expression",
                   { verdict: "strong" | "sound" | "developing" | "weak"; reason: string }>;
  bandReason: string;
  lift: string[];                          // first two
  questionFocus: "fully" | "partly" | "barely";
  questionFocusReason: string;
  knowledgeErrors: Array<{ quote: string; why: string }>;
  quoteFlags: Array<{
    quote: string;
    status: "near" | "not-found";
    correct?: string;                      // near only: exact play correction
    ratio?: number;
  }>;
  gaps: Array<{ conceptId: string; term: string; detail: string }>; // ≤5
  essayText: string;
  plan: EnglishEssayScaffold;
  words: number;
  modelEssay?: string;                     // ONLY the student's own finished result
}
```

`GET /attempts/[attemptId]` returns this view for a finished attempt owned by the session user. An unfinished attempt returns only `{ essay, plan, draft }` with no model, marking fields or quote results. Another student's id returns 404.

The browser never receives raw mark, marker-selected band, review, marking notes, Away notes, key concept tags, used-well ids, successful quote results, pilot essays or full play text. The question-focus warning is rendered only for `partly`/`barely`; near-match corrections are the only quote-check play excerpts.

## H. Model and deterministic reply formats

- Marker and reviewer JSON: [replies.md](replies.md).
- Quote-check result and algorithm: [quote-check.md](quote-check.md).

## I. Information-release summary

Public question data and the student's own writing may appear only on the schedule above. Marking notes, Away text notes, key concept tags, pilot essays and full play text never appear. The model essay appears only in `EnglishEssayResultView` for the student's own finished result. The only play words in any browser response are a near-match `correct` excerpt and quotations inside that released model essay. `tests/no-key-leak.test.ts` covers every essay and every state, including errors and resume, plus the production client output and a test-time play sentinel.

# API Contracts: Advanced English Unseen-Text Short Answers

Extends `specs/001-student-saved-scores/contracts/api.md`, `specs/006-sentence-rewrite-redesign/contracts/api.md`
and `specs/007-economics-paragraph-writing/contracts/api.md`. All routes except `/signin`, `/api/auth/*` and
`/api/cron/retention` need a signed-in session whose user row still exists. No route accepts a user id,
marks, max marks or a grading method from the client. All bodies are JSON except the image route. Every
query is scoped to the session user.

Common errors (unchanged): `400 { error: "invalid_request" }`, `401 { error: "unauthenticated" }`,
`401 { error: "invalid_attempt_token" }`, `404 { error: "not_found" }`, `409 { error: "already_answered",
result }`, `429 { error: "rate_limited", retryAfter }`, `503 { error: "temporarily_unavailable" }`.
`400 { error: "phase_refused" }` and `400 { error: "invalid_phase" }` as spec 005 and 007.

The unit uses `phase` 1 and 2 in request bodies for the first try and the retry (so the shared draft route
and the grade route's shape do not change); the response vocabulary says `try`.

## Types

```ts
type SkillId = "answers-question" | "directive-verb" | "analyses-not-retells"
             | "technique-effect" | "apt-evidence" | "human-experience" | "succinct";

interface SkillView { id: SkillId; met: boolean; reason: string }       // reason "" if the marker gave none

interface TryView {
  text: string; mark: number; skills: SkillView[];                      // all seven, in rubric order
  feedback: string; biggestGap: string; goFurther: string | null;   // goFurther: a first try at full marks only
  wordCount: number;
}

/** Public. The stimulus; an image's src is the authenticated route below. */
interface UnseenText {
  id: string; form: TextForm; heading: string; title: string; author: string; sourceLine: string;
  body: { kind: "poem"; stanzas: string[][]; lineNumbers?: { every: number } }
      | { kind: "prose"; paragraphs: string[] }
      | { kind: "image"; image: string; alt: string };
  footnotes?: Array<{ mark: string; text: string }>;
}

/** Released at the discussion only (constitution Principle I, 2.15.0). */
interface UnseenDiscussion { modelAnswer: string; modelWords: number }

interface UnseenGradeResult {
  questionId: string;
  type: "unseen";
  maxMarks: number;
  phase: 1 | 2;
  marksAwarded: number;                 // 0..maxMarks (try 1) or 0..maxMarks-1 (try 2, capped)
  recordedMark?: number;                // present when the question is final
  skills: SkillView[];
  feedback: string;
  biggestGap: string;
  goFurther?: string | null;            // phase 1 at full marks only ("To go further"); absent or null otherwise
  wordCount: number;
  retryOffered?: boolean;               // phase 1 only: marksAwarded < maxMarks and maxMarks > 1
  ending?: "full_marks" | "retried" | "declined" | "no_retry";   // present when final
  try1?: TryView;                       // on phase 2, decline and 409 responses
  discussion?: UnseenDiscussion;        // only when final
}

interface NotMarked {
  reason: "marker_unavailable" | "daily_limit";
  phase: 1 | 2;
  resetsAt?: string;                    // daily_limit only: next Sydney midnight, ISO with offset
}
```

Tip text is never in a response. The client builds tip cards from the public `lib/unseen/skills.ts` and
the `skills` it received (`met: false`).

## POST /api/attempts (unseen unit)

Request: `{ "unitId": "y12-english-advanced-unseen-texts" }` (as today).

Behaviour: the server resumes the student's incomplete attempt for the unit if there is one; otherwise it
draws one unanswered question (`drawUnseen`, weighted, `RandomInt` injected) and creates the one-question
attempt; then builds `unseenState`. The per-user attempt rate limit still applies. Two simultaneous starts
end on one attempt (the partial unique index).

| Status | Body |
|---|---|
| `201` | a new attempt: `{ attemptId, attemptToken, persisted: true, unitId, passMark, questions: [UnseenQuestion], answered: {}, unseenState }`; `unseenState.repeating: true` marks a repeat of a question the student answered before |
| `200` | the attempt already existed (an unfinished question, or the other tab won the race): same body plus `resumed: true` |
| `200` | an empty bank only: `{ finished: true, total, answered }` (no attempt created). A bank with questions never stops: once every question is answered the draw repeats (research R9) and the response is a `201` new attempt like any other |
| `404` | `not_found` (unknown unit) |
| `429` | `rate_limited` with `retryAfter` |
| `503` | `{ error: "temporarily_unavailable" }` (results cannot be read; no guess is made, constitution A2) |

`questions` has length 1. `UnseenQuestion` is the public question (id, `type: "unseen"`, `textId`,
`prompt`, `parts?`, `maxMarks`, `suggestedWords`, `source`, `paper`, `outcome`, `concepts`, `verb`).
`persisted` is always `true` for this unit (a failed read or insert is the `503` above).

## The quiz page payload (resume)

`app/unit/[unitId]/quiz/page.tsx` builds the same `AttemptPayload` the start route returns, with
`unseenState` rebuilt from `unseen_phases`, `rewrite_drafts` and the day's usage:

| Stored | `stage` | Carries |
|---|---|---|
| no row, draft maybe | `write` | `text`, `draft1`, `dailyLimit?` |
| row `try1`, no retry draft | `choice` | `text`, `try1`, `retryOffered`, `dailyLimit?` |
| row `try1`, retry draft | `retry` | `text`, `try1`, `draft2`, `retryOffered`, `dailyLimit?` |
| row `final` | `discussion` | `text`, `try1`, `try2?`, `ending`, `recordedMark`, `discussion` |

`dailyLimit` is present when `LLM_DAILY_CAP > 0` and the student's used slots today (`aiUsedToday`) have
reached it; `resetsAt` is the next Sydney midnight. The `discussion` object appears **only** for `final`
rows. No stage carries the criteria, notes, description or (before `final`) the model answer.

## POST /api/grade (unseen questions)

Request: `{ "attemptId", "attemptToken", "questionId", "answer", "phase": 1 | 2 }`. `skip: true` →
`400 invalid_request` before anything. `phase` other than 1 or 2 → `400 invalid_phase`. Empty or
whitespace-only → `400 invalid_request`.

**Answer rules, enforced here as on the client (research R6), before any slot, limit or call:**
`400 { error: "answer_too_short", minWords: 20 }`, `400 { error: "answer_too_long", maxWords }` where
`maxWords = floor(1.2 × suggestedWords)`; more than 6000 characters is also `answer_too_long`.

Order of checks: body → answer rules → attempt token (`401 invalid_attempt_token`) → the question is in the
token and is an `unseen` question (`404 not_found`) → phase row (a final row → `409`; phase 1 with a row →
`409`; phase 2 without a `try1` row → `400 phase_refused`; phase 2 on a question with no retry offered →
`400 phase_refused`) → rate limits (`429`) → one slot of `LLM_DAILY_CAP` → marker → write.

### Phase 1, marked

`200 { result, saved, phaseSaved?, attemptCompleted }`

- mark = `maxMarks`: row inserted `final / full_marks`, result row saved. `result` has `phase: 1`,
  `marksAwarded`, `recordedMark`, `ending: "full_marks"`, `skills`, `feedback`, `biggestGap`, `goFurther`,
  `discussion`. `saved: true`, `attemptCompleted` from the save.
- mark below `maxMarks`, `maxMarks > 1`: row inserted `try1`, no result row. `result` has `phase: 1`,
  `marksAwarded`, `skills`, `feedback`, `biggestGap`, `retryOffered: true`, **no `discussion`, no
  `recordedMark`**. `saved: false`, `phaseSaved: true`, `attemptCompleted: false`. The phase 1 draft is
  cleared.
- mark below `maxMarks`, `maxMarks = 1` (mark 0): row inserted `final / no_retry`, result row saved;
  `result` has `ending: "no_retry"`, `recordedMark`, `discussion`.

### Phase 2, marked

`200 { result, saved, attemptCompleted }`. `result.phase: 2`, `marksAwarded` (0..`maxMarks-1`, capped in
code), `recordedMark` (the higher try), `ending: "retried"`, `skills`, `feedback`, `biggestGap`, `try1`
(so the discussion can label pills), `discussion`. Row updated `final / retried`; result row saved. The
drafts are deleted.

### Not marked (marker unavailable or daily limit), either phase

`200 { notMarked, saved: false }` with **no `result`**. The slot is refunded (marker) or never taken
(limit). The server saves the submitted `answer` as the draft for the phase (`rewrite_drafts`) so a
reload cannot lose it. No row is written, no mark is recorded, no error string. `notMarked.reason`:

- `marker_unavailable`: no `OPENROUTER_API_KEY`, `LLM_DAILY_CAP = 0`, a failed call, or a reply that was
  empty, cut off, unparseable, missing a required field or echoing the model answer, after the one retry
  within the 55 s budget. The client unlocks the box and shows the plain retry notice.
- `daily_limit`: the student's allowance for the Sydney day is used up. `resetsAt` is the next Sydney
  midnight. The client keeps the text, shows the limit notice and disables Submit until `resetsAt`.

### Other failures

- rate limited: `429 { error: "rate_limited", retryAfter }` (nothing recorded; the box returns).
- database unreadable: `503 { error: "temporarily_unavailable" }` (nothing recorded; the box returns).
- the question is already final, or the row is no longer `try1`: `409 { error: "already_answered", result }`
  where `result` is the stored view (`ending`, `recordedMark`, `skills`, `try1`, `discussion` when final;
  the try 1 result without `discussion` when the row is `try1`).
- phase 1 sent again after a row exists (a double tap or another tab): the same `409`, no slot.

### Idempotency

A second phase 1 submit returns `409` with the stored view and takes no slot. A second phase 2 after final
returns the same `409`. A request that reached the server and was marked, but whose response was lost,
shows the stored result on the next load (resume) or on the resubmit's `409`.

## POST /api/unseen/decline

Request: `{ "attemptId": string, "questionId": string, "attemptToken": string }` (nothing else is read).

Records the first try's mark as the question's recorded mark and finishes the question.

Order: session → body (`400 invalid_request`) → attempt token (`401`) → question belongs to the token and is
an `unseen` question (`404`) → per-user rate limit (`429`) → conditional finalise.

| Status | Body | When |
|---|---|---|
| `200` | `{ result, saved, attemptCompleted }` | the row was `try1`: updated `final / declined`, result row saved; `result` has `phase: 1`, `marksAwarded` = the first try's mark, `recordedMark`, `ending: "declined"`, `skills`, `feedback`, `biggestGap`, `discussion` |
| `400` | `{ "error": "phase_refused" }` | no `try1` row (nothing was marked), or the question has no retry |
| `409` | `{ "error": "already_answered", result }` | the row is already `final` (another tab, a double tap) |
| `429` | `{ "error": "rate_limited", "retryAfter": number }` | |
| `503` | `{ "error": "temporarily_unavailable" }` | database unreadable |

No marker call, no slot. This works whatever the daily-limit state.

## POST /api/rewrite/draft (now also unseen questions)

Request and responses unchanged: `{ attemptId, attemptToken, questionId, phase: 1 | 2, draft }` →
`200 { saved: boolean }`, `401 invalid_attempt_token`, `404 not_found`, `429 rate_limited`, `503
temporarily_unavailable`. For an unseen question the stale check reads `unseen_phases` (phase 1 stale once
a row exists; phase 2 stale once the row is `final`). `MAX_DRAFT_LEN` 6000. The route's question-type check
accepts `rewrite`, `paragraph` and `unseen`.

There is no flag route: the unit has no student flag (the 2026-11-19 clarification), so `/api/unseen/flag`
does not exist and the discussion has no flag button. The offline re-mark (research R11) is how marks are checked.

## GET /api/unseen/image/[textId]

Path parameter only; no query, no body. The cropped visual stimulus for a text of the unit (constitution
A1).

| Status | Body | When |
|---|---|---|
| `200` | image bytes (`Content-Type: image/webp`, `Cache-Control: private, max-age=86400`, `X-Content-Type-Options: nosniff`, `Vary: Cookie`) | signed in, and `textId` is a visual text of the unit |
| `401` | `{ "error": "unauthenticated" }` | no session (the middleware's answer, and the route's own check) |
| `404` | `{ "error": "not_found" }` | `textId` is malformed, unknown, or not a visual text (one body for all three) |

The route carries bytes only. It never returns the description, a JSON list, or a directory listing, and
the file path is taken from the unit's text record, never from the request string.

## The marker's reply format (model → server, `lib/unseen/marker.server.ts`)

Request: OpenRouter chat completion, `temperature 0`, JSON mode, `max_tokens 4000`, model `ENGLISH_ADV_GRADING_MODEL`
(default `deepseek/deepseek-v4.1-flash`), first-call timeout 40 s, whole-marking budget 55 s. Messages from
`lib/unseen/rubric.json` (`systemPrompt`, `userTemplate`) with the placeholders of research R5.

Reply (the first `{…}` block is parsed; one retry on failure; failure twice, or out of budget = unavailable):

```json
{
  "mark": 3,
  "skills": {
    "answers-question":     { "met": true,  "reason": "<one line>" },
    "directive-verb":       { "met": true,  "reason": "…" },
    "analyses-not-retells": { "met": true,  "reason": "…" },
    "technique-effect":     { "met": false, "reason": "…" },
    "apt-evidence":         { "met": true,  "reason": "…" },
    "human-experience":     { "met": true,  "reason": "…" },
    "succinct":             { "met": true,  "reason": "…" }
  },
  "feedback": "<two or three sentences: what earned the mark>",
  "biggestGap": "<one sentence>",
  "goFurther": "<one sentence at full marks; null below full marks>",
  "descriptionAdequate": true
}
```

A reply is a failure, retried like a failed call, when: it is empty; the provider reports
`finish_reason: "length"`; it does not parse; `mark` is not an integer in `0..maxMarks`; any of the seven
`met` values is missing or is not a boolean (or `"true"`/`"false"`); `feedback` or `biggestGap` is missing
or blank; the mark equals `maxMarks` and `goFurther` is missing, null or blank (a `goFurther` on a below-full reply is dropped); or `feedback`, `biggestGap`, `goFurther` or any `reason` shares a 60-character run with the model answer that
is not also in the stimulus text. A missing `reason` is stored as "". Strings are trimmed and capped
(reason 300, feedback 600, biggest gap 300, go further 300). `descriptionAdequate` is `true`/`false` for a visual text and
`null` otherwise; the app ignores it at request time and the description-check script reads it. The server
then computes: the retry cap (`maxMarks − 1`) and the higher-mark rule (research R8) and the seven
first-try outcomes. The model is not asked for tips.

## Logging contract

One `console.info` line per call: `[unseen] outcome=… user=<sha256> question=… phase=… duration_ms=…
model=…`. Outcomes: `graded`, `unparseable`, `model_fail`, `rate_limited`, `over_allowance`,
`already_answered`, `phase_refused`, `answer_rejected`, `db_unavailable`, `declined`. Never the answer, a reason, feedback, the biggest gap, the text, the model answer or any key.

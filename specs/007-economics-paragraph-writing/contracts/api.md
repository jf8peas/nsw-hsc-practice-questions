# API Contracts: Economics Paragraph Writing

Extends `specs/001-student-saved-scores/contracts/api.md`, `specs/005-economics-sentence-writing/contracts/api.md`
and `specs/006-sentence-rewrite-redesign/contracts/api.md`. All routes except `/signin`,
`/api/auth/*` and `/api/cron/retention` need a signed-in session whose user row still exists. No
route accepts a user id, marks, max marks or a grading method from the client. All bodies are JSON.
Every query is scoped to the session user.

Common errors (unchanged): `400 { error: "invalid_request" }`, `401 { error: "unauthenticated" }`,
`401 { error: "invalid_attempt_token" }`, `404 { error: "not_found" }`, `409 { error:
"already_answered", result }`, `429 { error: "rate_limited", retryAfter }`, `503 { error:
"temporarily_unavailable" }`. `400 { error: "phase_refused" }` and `400 { error: "invalid_phase" }`
as spec 005.

## Types

```ts
type PartNo = 1 | 2 | 3 | 4 | 5;
type CriterionKey = "a" | "b" | "c" | "d";

interface CriterionView {
  key: CriterionKey;
  met: boolean;
  reason: string;               // the marker's one line; "" on the self-mark path
  subs?: { preciseLanguage: boolean; noPadding: boolean; withinLimit: boolean };   // key "d" only
}

interface EssayParts { part: PartNo; short: string; state: "done" | "current" | "later" }

/** Released before phase 1 is marked (constitution Principle I, 2.14.0). */
interface ParagraphQuestionView {
  essayNo: number; essayTotal: number;
  part: PartNo; partName: string; limit: number;     // 40 | 90 | 80 | 90 | 45
  verbDefinition: string;
  guidance: [string, string, string, string];        // "What this part must do"
  brief: { economy: string; argument: string; counterpoint: string;
           chainSteps: string[]; facts: string[]; limitation: string[] };
  uses: Array<"economy" | "argument" | "counterpoint" | "chainSteps" | "facts" | "limitation">;
  earlier: Array<{ part: PartNo; label: string; text: string }>;   // models of parts 1..part-1 ONLY
  parts: EssayParts[];                                              // the progress bar
}

/** Released at the discussion or the self-mark screen only. */
interface ParagraphDiscussion {
  modelPart: string; commentary: string; modelWords: number;
  modelSoFar: Array<{ part: PartNo; label: string; text: string; current: boolean }>;   // parts 1..part
  laterSlots: Array<{ part: PartNo; label: string; when: string }>;   // labels only, never text
  next:
    | { kind: "part"; essayNo: number; part: PartNo; name: string }
    | { kind: "essay"; essayNo: number; part: 1; name: string }
    | { kind: "none" };
}

interface ParagraphGradeResult {
  questionId: string;
  type: "paragraph";
  maxMarks: 4;
  phase: 1 | 2;
  marksAwarded: number | null;          // 0..4 (phase 1) or 0..3 (phase 2, capped); null only when needsSelfMark
  recordedMark?: number;                // present when the question is final
  criteria: CriterionView[];            // [a, b, c, d]; omitted when needsSelfMark
  feedback: string;                     // overall line; "" when needsSelfMark
  wordCount: number;
  ending?: "full_marks" | "corrected" | "no_correction" | "self_mark";   // present when final
  phase1?: { mark: number; criteria: CriterionView[]; feedback: string; text: string };   // on phase 2 and 409 responses
  discussion?: ParagraphDiscussion;     // only when final, or when needsSelfMark
  needsSelfMark: boolean;
}
```

Tip text is never in a response. The client builds tip cards from the public `parts.ts` and the
`criteria` it received.

## POST /api/attempts (paragraph unit)

Request: `{ "unitId": "y12-economics-paragraph-writing" }` (as today).

Behaviour: the server derives the next question from the student's results
(`nextQuestion`), creates the one-question attempt or returns the existing incomplete one, and
builds `paragraphState` for it. The weighting is never used. The per-user attempt rate limit
(`checkAttemptRateLimit`) still applies.

| Status | Body |
|---|---|
| `201` | a new attempt: `{ attemptId, attemptToken, persisted: true, unitId, passMark, questions: [ParagraphQuestion], answered: {}, essay: EssayProgress, paragraphState }` |
| `200` | the attempt already existed (resume, or the other tab won the race): same body plus `resumed: true`, `answered: {}` |
| `200` | nothing left: `{ finished: true, essayTotal }` (no attempt created) |
| `404` | `not_found` (unknown unit) |
| `429` | `rate_limited` with `retryAfter` |
| `503` | `{ error: "temporarily_unavailable" }` (results cannot be read; no guess is made) |

`questions` has length 1. `ParagraphQuestion` is the public question (id, `type: "paragraph"`,
`essayNo`, `part`, `prompt`, `verb`, `economy`, `maxMarks: 4`, `concepts`). `paragraphState.stage`
is `write` for a new attempt. `persisted` is always `true` for this unit (a failed insert is the
`503` above).

```ts
interface EssayProgress { essayNo: number; essayTotal: number; question: string; economy: string;
  parts: Array<{ part: PartNo; short: string; state: "done" | "next" | "later"; mark: number | null }> }
```

## The quiz page payload (resume)

`app/unit/[unitId]/quiz/page.tsx` builds the same `AttemptPayload` the start route returns, with
`paragraphState` rebuilt from `paragraph_phases` and `rewrite_drafts`:

| Stored | `stage` | Carries |
|---|---|---|
| no row, draft maybe | `write` | `view`, `draft1` |
| row `phase1`, draft maybe | `correct` | `view`, `phase1` (text, mark, criteria, feedback), `draft2` (else the client pre-fills with `phase1.text`) |
| row `final` | `discussion` | `view`, `phase1`, `phase2?`, `ending`, `recordedMark`, `flagged`, `mode`, `discussion` |

The `discussion` object appears **only** for `final` rows. `view.earlier` holds earlier models at
every stage. Later models and notes appear in no stage.

## POST /api/grade (paragraph questions)

Request: `{ "attemptId", "attemptToken", "questionId", "answer", "phase": 1 | 2 }`.
`answer` is truncated at 6000 characters; empty or whitespace-only → `400 invalid_request`
(spec 005 FR-041). `skip: true` → `400 invalid_request` before any marker call, slot or write.
`phase` other than 1 or 2 → `400 invalid_phase`.

Order of checks: body → attempt token (`401 invalid_attempt_token`) → question is in the token and is
a paragraph (`404 not_found`) → phase row (a final row → `409`; phase 1 with a row → `409`; phase 2
without a `phase1` row under 4 → `400 phase_refused`) → rate limits (`429`) → one slot of
`LLM_DAILY_CAP` → marker → write.

### Phase 1, marked

`200 { result, saved, phaseSaved?, attemptCompleted }`

- mark 4: row inserted `final / full_marks`, result row saved. `result` has `phase: 1`,
  `marksAwarded: 4`, `recordedMark: 4`, `ending: "full_marks"`, `criteria`, `feedback`,
  `discussion`. `saved: true`, `attemptCompleted` from the save.
- mark under 4: row inserted `phase1`, no result row. `result` has `phase: 1`, `marksAwarded`,
  `criteria`, `feedback`, **no `discussion`, no `recordedMark`**. `saved: false`,
  `phaseSaved: true`, `attemptCompleted: false`.

### Phase 1, marker unavailable or over the cap (self-mark)

`200 { result, saved: false, degraded, attemptCompleted, selfMarkToken, aiUnavailable?, aiLimit? }`

`result.needsSelfMark: true`, `marksAwarded: null`, `feedback: ""`, `criteria` omitted,
`discussion` present (the model part so the student can mark themselves). `aiLimit: { reached:
true, resetsAt }` when it was the cap. No error string. The AI slot is refunded unless the cap
itself was the cause (nothing was reserved then).

### Phase 2, marked

`200 { result, saved, attemptCompleted }`. `result.phase: 2`, `marksAwarded` (0..3), `recordedMark`
(max of the tries), `ending: "corrected"`, `criteria`, `feedback`, `phase1` (so the discussion
can label pills), `discussion`. Row updated `final / corrected`; result row saved.

### Phase 2, cap used or marker unavailable (FR-019a)

`200 { result, saved, attemptCompleted, aiLimit? }` with `result.phase: 2`, `marksAwarded: null`,
`needsSelfMark: false`, `ending: "no_correction"`, `recordedMark` = the first-try mark, `phase1`,
`criteria` (the phase 1 criteria, so tip cards render), `feedback` (phase 1 feedback),
`discussion`. Row updated `final / no_correction`; result row saved with the phase 1 mark. **No
error field.** The correction text is not stored.

### Phase 2, other failures

- rate limited: `429 { error: "rate_limited", retryAfter }` (nothing recorded; box returns).
- database unreadable: `503 { error: "temporarily_unavailable" }` (nothing recorded; box returns).
- phase 1 marked 4, or the row is already final: `409 { error: "already_answered", result }` where
  `result` is the stored final view (`ending`, `recordedMark`, `criteria`, `discussion`).

### Idempotency

A second phase 1 submit (another tab, a double tap) returns `409 already_answered` with the stored
view and takes no slot. A second phase 2 after final returns the same `409`.

## POST /api/results/self-mark (paragraph questions)

Request: `{ "attemptId", "attemptToken", "questionId", "answer", "token": selfMarkToken, "phase": 1,
"ticks": { "a": boolean, "b": boolean, "c": boolean, "d": boolean } }`.

- `phase` other than 1 → `400 phase_refused` (there is no self-marked correction).
- `token` must be a valid signed self-mark token for this user, attempt, question and `answer`
  (`400 invalid_token`). The paragraph tokens carry no term ids.
- The four ticks must all be booleans (`400 invalid_request`).

`200 { saved, marksAwarded, recordedMark, ending: "self_mark", attemptCompleted, discussion? }`
where `marksAwarded` = number of `true` ticks. Row inserted `final / self_mark / mode self_mark`
with synthetic verdicts `{ met: tick, reason: "" }`; result saved with `graded_by = "self"` and the
five concept outcomes from the ticks (a `d` tick covers both all-parts tips). `discussion` is
repeated so a reload of the response is complete. `409 already_answered` if a row exists.
With the database unreadable it works as spec 005: the response carries a `receipt` for
`/api/results/retry` and `saved: false`.

## POST /api/rewrite/draft (now also paragraph questions)

Request and responses unchanged: `{ attemptId, attemptToken, questionId, phase: 1 | 2, draft }` →
`200 { saved: boolean }`, `401 invalid_attempt_token`, `404 not_found`, `429 rate_limited`, `503
temporarily_unavailable`. For a paragraph question the stale check reads `paragraph_phases` (phase 1
stale once a row exists; phase 2 stale once the row is `final`). `MAX_DRAFT_LEN` 6000.

## POST /api/paragraph/flag

Request: `{ "attemptId": string, "questionId": string, "attemptToken": string }` (nothing else is
read).

Order: session → body (`400 invalid_request`) → attempt token (`401 invalid_attempt_token`) →
question belongs to the token (`404 not_found`) → per-user flag rate limit (`429 rate_limited`,
10 a minute) → conditional update.

| Status | Body | When |
|---|---|---|
| `200` | `{ "flagged": true }` | first flag stored |
| `200` | `{ "flagged": true, "already": true }` | already flagged (this tab again, or another tab) |
| `400` | `{ "error": "not_flaggable" }` | the answer was self-marked (no marker mark to dispute) |
| `404` | `{ "error": "not_found" }` | no such attempt/part for this student |
| `409` | `{ "error": "not_final" }` | the part is still on the correction |
| `429` | `{ "error": "rate_limited", "retryAfter": number }` | |
| `503` | `{ "error": "temporarily_unavailable" }` | database unreadable |

The route never reads or writes marks, results or concept outcomes. Done-state wording on the
client: "Flagged for your teacher".

## The marker's reply format (model → server, `lib/paragraph/marker.server.ts`)

Request: OpenRouter chat completion, `temperature 0`, JSON mode, `max_tokens 1200`, timeout 30 s,
model `GRADING_MODEL` (default `deepseek/deepseek-chat`). Messages from `lib/paragraph/rubric.json`
(`system`, `userTemplate`).

Reply (the first `{…}` block is parsed; one retry on failure; unparseable twice = unavailable):

```json
{
  "restated": "<discarded, never stored or sent on>",
  "criteria": {
    "a": { "reason": "<one short sentence>", "met": true },
    "b": { "reason": "...", "met": false },
    "c": { "reason": "...", "met": true }
  },
  "conventions": { "reason": "<one short sentence>", "preciseLanguage": true, "noPadding": true },
  "feedback": "<1-2 sentences naming what to fix, without model wording>"
}
```

Validation: `met`, `preciseLanguage`, `noPadding` must each be a boolean (or the strings
`"true"`/`"false"`); a missing or other value fails the parse. Strings are trimmed and capped
(reason 300, feedback 400 characters). The server computes: `d.met = preciseLanguage && noPadding &&
wordCount <= limit`; `d.reason` is the conventions reason, replaced by "Over the {limit}-word limit
({n} words)." when over; the mark; the phase 2 cap (3); the recorded mark; the lost criteria; the
tip ids. The model is not asked for tips.

## Logging contract

One `console.info` line per call: `[paragraph] outcome=… user=<sha256> question=… phase=… duration_ms=… model=…`.
Outcomes: `graded`, `unparseable`, `model_fail`, `rate_limited`, `over_allowance`,
`already_answered`, `phase_refused`, `db_unavailable`, `flagged`, `flag_repeat`. Never the
answer, a reason, feedback, the brief or any model part.

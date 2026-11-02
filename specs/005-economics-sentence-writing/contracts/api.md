# API Contracts: Economics Sentence Writing

Extends `specs/001-student-saved-scores/contracts/api.md`. All routes except `/signin`, `/api/auth/*`
and `/api/cron/retention` require a signed-in session whose user row still exists (`requireUser()`).
No route accepts a user id from the client. All bodies are JSON.

Common error shapes (unchanged): `400 { error: "invalid_request" }`, `401 { error: "unauthenticated" }`,
`404 { error: "not_found" }`, `409 { error: "already_answered", result }`, `429 { error: "rate_limited", retryAfter }`,
`503 { error: "temporarily_unavailable" }`. New error strings for this feature: `400 { error: "phase_refused" }`
(phase 2 attempted when phase 1 was not graded below 3, or the question is already final) and
`400 { error: "invalid_phase" }` (a `phase` value other than `"1"` or `"2"`).

## Types

```ts
type RewriteTermStatus = "used" | "missing" | "misused";

/** One target term as the browser may see it. Never sent before phase 1 is graded. */
interface RewriteTermView {
  term: string;
  definition: string;   // the concept description
}

/** The hint: only the terms the student missed or misused (FR-015), or none + the lost criterion (FR-045). */
interface RewriteHint {
  terms: RewriteTermView[];          // empty when every term was used
  lostCriterion?: "a" | "c";         // present only when terms is empty (FR-045)
  criterionText?: string;            // the marker's words for the lost criterion
}

/** The discussion: shown only after the last phase (or on the self-mark screen). */
interface RewriteDiscussion {
  modelSentences: string[];          // 1-2 accepted versions
  terms: Array<RewriteTermView & { why: string }>;  // every target term, with why it fits
}

interface RewriteGradeResult {
  questionId: string;
  type: "rewrite";
  maxMarks: 3;
  phase: 1 | 2;
  marksAwarded: number | null;       // null only when needsSelfMark
  feedback: string;
  termOutcomes: Array<{ conceptId: string; correct: boolean }>;  // phase 1 only, for the client's concept display
  hint?: RewriteHint;                // phase 1, marks < 3, not self-marked
  discussion?: RewriteDiscussion;    // phase 1 at 3/3, or phase 2, or self-mark
  needsSelfMark: boolean;
}
```

## POST /api/grade (rewrite questions)

Request: `{ "attemptId": string, "attemptToken": string, "questionId": string, "answer": string, "phase": "1" | "2" }`
- `answer` is the student's sentence, truncated at 6000 characters. Empty or whitespace-only is
  refused with `400 { error: "invalid_request" }` (FR-041).
- `phase` is required for rewrite questions; `"1"` or `"2"` only, else `400 { error: "invalid_phase" }`.
- There is no `skip` field: the retry is compulsory (FR-042). A request with `skip: true` is
  refused with `400 { error: "invalid_request" }` before any grader call, allowance slot or
  database write, and the phase row stays `phase1`.

Server checks, in order: session → attempt token valid, unexpired, bound to the user and attempt →
question is in the token's `questionIds` (404) → question is a rewrite question (else the existing
short/MC path) → phase row state (below) → per-user then per-IP rate limit → reserve one daily AI
slot (only when the LLM is configured) → grade.

**Phase 1** (`phase: "1"`):
- If a phase row exists for `(attemptId, questionId)`: return `409 { error: "already_answered", result: <stored phase 1 result> }`
  (a double tap or a second device; no slot is reserved, no second grading call).
- Grade with `gradeRewrite` (research R4). On success, insert the phase row
  (`INSERT … ON CONFLICT (attempt_id, question_id) DO NOTHING`; a lost race returns the stored row).
- `200`:
  ```json
  {
    "result": {
      "questionId": "…", "type": "rewrite", "maxMarks": 3, "phase": 1,
      "marksAwarded": 0 | 1 | 2 | 3,
      "feedback": "…",
      "termOutcomes": [ { "conceptId": "…", "correct": true } ],
      "hint": { "terms": [ { "term": "tariff", "definition": "…" } ] },   // only when marks < 3
      "discussion": { "modelSentences": ["…"], "terms": [ { "term": "…", "definition": "…", "why": "…" } ] },  // only when marks === 3
      "needsSelfMark": false
    },
    "saved": false,            // the phase row is saved; the result is not final yet
    "attemptCompleted": false,
    "phaseSaved": true
  }
  ```
- On LLM failure / cap / db down: `needsSelfMark: true` with `selfMarkToken` (extended, see below),
  `aiUnavailable` / `aiLimit` as today, and `discussion` material for the self-mark screen
  (model sentences + every term with definition). No phase 2.

**Phase 2** (`phase: "2"`):
- Refused with `400 { error: "phase_refused" }` unless the phase row's `status` is `phase1` and
  `phase1_marks < 3` (FR-017, FR-015). Also refused when the row is `final` (already answered).
- The retry is compulsory (FR-042): there is no skip. A student who leaves at the retry leaves the
  question unanswered, like any other unanswered question.
- Grade with `gradeRewrite`, capped at 2 marks (FR-016). Update the phase row to `final`
  (`UPDATE … WHERE status = 'phase1'`; a lost race returns the stored result), insert the `results`
  row with `marks_awarded = max(phase1_marks, phase2_marks)` (FR-019), `answer` = the phase 2
  sentence, `concept_outcomes` = the phase 1 term outcomes, `graded_by = 'llm'`.
- `200`:
  ```json
  {
    "result": {
      "questionId": "…", "type": "rewrite", "maxMarks": 3, "phase": 2,
      "marksAwarded": 0 | 1 | 2,
      "feedback": "…",
      "discussion": { "modelSentences": ["…"], "terms": [ { "term": "…", "definition": "…", "why": "…" } ] },
      "needsSelfMark": false
    },
    "saved": true,
    "attemptCompleted": false | true
  }
  ```
- If phase 2's grading call fails: the phase 2 sentence is self-marked (see self-mark below); the
  recorded mark is the best of phase 1 and the capped self-marked phase 2 (FR-019).

**Degraded mode** (database unavailable): phase 1 falls back to self-marking with `aiUnavailable: true`
and no phase 2, exactly as short answers do today. Phase 2 cannot be graded (the phase row cannot be
read), so it is refused with `503 { error: "temporarily_unavailable" }` and the student keeps the
phase 1 mark.

## POST /api/results/self-mark (rewrite questions)

Request: `{ "attemptId", "attemptToken", "questionId", "answer", "phase": 1 | 2, "criterionA": boolean, "termTicks": { [conceptId]: boolean }, "criterionC": boolean, "token": string }`
- For rewrite questions the binary `correct` flag is replaced by the three criterion inputs. The
  `token` is the extended self-mark token, which carries the question's target-term concept ids, so
  the client can only tick the terms the server listed (no forged or invented terms).
- Accepted only if: session user matches the token's `uid`; token valid and unexpired;
  `attemptId`/`questionId` match; `sha256(answer)` equals the token's `answerHash`; the question is
  a rewrite question in the attempt; every key of `termTicks` is in the token's term ids; and no
  final result exists yet.
- Marks: `criterionA + (every term ticked ? 1 : 0) + criterionC`, capped at 2 when `phase === 2`
  (FR-016), else 0-3. `graded_by = 'self'`. `concept_outcomes` is built from `termTicks`.
- `200 { "saved": true, "attemptCompleted": boolean }` (or `saved: false` + `receipt` on a save
  failure, as today). Errors: `400` bad token/mismatch, `401`, `404`, `409 already_answered`,
  `422 not_rewrite_question`.

## Resume (GET `/unit/[unitId]/quiz?attempt=<id>`)

The quiz page loader reads the phase row for the current question and returns exactly what the
stage allows (FR-023, research R5):

```json
{
  "attemptId": "…", "attemptToken": "…",
  "questions": [ /* PublicQuestion[] — rewrite questions carry prompt, maxMarks, concepts; never key fields */ ],
  "answered": { "[questionId]": { "marks": 3, "max": 3 } },
  "rewriteState": {
    "[questionId]": {
      "phase": 1 | 2 | "final",
      "phase1Answer": "…",            // the student's own sentence
      "phase1Marks": 2,
      "hint": { "terms": [...] },     // only when phase === 2 (phase 1 was < 3)
      "discussion": { ... }           // only when phase === "final"
    }
  }
}
```

Nothing from the answer key is present before a phase 1 grade; the hint is present only at phase 2;
the discussion only once final. The attempt detail page (`/attempts/[attemptId]`) shows both
sentences and both marks from the phase row, plus the stored feedback and per-term outcomes — never
model sentences (not stored per result, Principle I).

## Logging

Each grading call logs one line (FR-044): `[rewrite] outcome=<outcome> user=<hmac(userId)>
question=<questionId> duration_ms=<ms> model=<model>`. Outcomes: `graded`, `unparseable`,
`model_fail`, `rate_limited`, `over_allowance`, `already_answered`, `phase_refused`,
`db_unavailable`. No sentence, model reply, definition or marking note is ever logged.

# API Contracts: Sentence Rewrite Question Redesign

Extends `specs/005-economics-sentence-writing/contracts/api.md`. Everything documented there is
unchanged except where stated: the phase 1 / phase 2 grade flow, the phase refusals, the
already-answered shapes, the self-mark flow and the error vocabulary stay byte-for-byte the same.
All routes except `/signin`, `/api/auth/*` and `/api/cron/retention` require a signed-in session
whose user row still exists (`requireUser()`). No route accepts a user id from the client. All
bodies are JSON.

Common error shapes (unchanged): `400 { error: "invalid_request" }`,
`400 { error: "invalid_phase" }`, `400 { error: "phase_refused" }`,
`401 { error: "unauthenticated" }`, `401 { error: "invalid_attempt_token" }`,
`404 { error: "not_found" }`, `409 { error: "already_answered", result }`,
`429 { error: "rate_limited", retryAfter }`, `503 { error: "temporarily_unavailable" }`.

## Types

```ts
/** A credited span: the exact words in the student's sentence the grader credited for one term. */
interface RewriteCreditedSpan {
  conceptId: string;
  span: string;           // validated: found in the sentence (see validation below)
}

/** The optional language note for the final sentence (FR-034). */
interface RewriteLanguageNote {
  spelling?: Array<{ wrong: string; fix: string }>;  // ≤ 3 pairs, each string ≤ 60 chars
  grammar?: string;                                  // one short note, ≤ 200 chars
}

interface RewriteGradeResult {
  // ...existing fields (questionId, type: "rewrite", maxMarks: 3, phase, marksAwarded,
  //    feedback, termOutcomes, hint?, discussion?, needsSelfMark)...
  /**
   * Phase 1 or 2: the credited-and-found spans only. Phase 1 spans appear only with the
   * phase 1 grade; a phase 1 span never names a term the student did not use (FR-044).
   */
  creditedSpans?: RewriteCreditedSpan[];
  /** Phase 2 only: which terms the retry used correctly. Display only (FR-033). */
  phase2TermOutcomes?: Array<{ conceptId: string; correct: boolean }>;
  /** Final phase only (phase 2, or phase 1 at 3/3): the optional language note. */
  languageNote?: RewriteLanguageNote;
}
```

Which phase carries which new field:

| Field | Phase 1 < 3 | Phase 1 = 3 | Phase 2 | needsSelfMark |
|---|---|---|---|---|
| `creditedSpans` | ✓ (phase 1) | ✓ (phase 1) | ✓ (phase 2) | – (nothing was credited) |
| `phase2TermOutcomes` | – | – | ✓ | – |
| `languageNote` | – | ✓ (final) | ✓ (final) | – |
| `feedback` / `termOutcomes` / `hint` / `discussion` | as spec 005 | as spec 005 | as spec 005 | discussion (self-mark screen) |

## The rewrite grader's reply (LLM contract)

Still one shared prompt/parse per phase; the reply gains optional fields. A parseable reply
without them grades exactly as today (research R3).

```json
{
  "criterionA": true,
  "padding": false,
  "terms": [
    { "term": "subsidy", "status": "used", "span": "Government subsidies" },
    { "term": "infant industry", "status": "misused", "span": null }
  ],
  "feedback": "You named subsidy. One more term would make your sentence more precise.",
  "languageNote": { "spelling": [ { "wrong": "fromm", "fix": "from" } ], "grammar": "\u201cSubsidies \u2026 enable\u201d (plural)." }
}
```

- `terms[].span`: the exact words in the student's sentence the grader credited for that term, or
  `null` for a term not credited. Non-string → treated as `null`; never makes the reply
  unparseable.
- `languageNote` (optional): `{ spelling?: Array<{ wrong, fix }>, grammar?: string }`. Any
  malformed shape drops the whole note.

**Server-side validation** (in `gradeRewriteAnswer`; the reply is never rendered as HTML):

- **Span kept only if found in the sentence (FR-032)**: normalise span and sentence by trimming
  and collapsing runs of whitespace (including newlines) to a single space; keep the span only
  when it is a contiguous substring of the sentence under a case-insensitive comparison. The
  client re-finds it with the same rule to compute highlight offsets. Longer-than-sentence or
  non-substring spans are dropped.
- **A span for a term not credited is dropped** even if present in the sentence.
- Span length cap 200 characters before validation.
- **Malformed language note dropped**: kept only when `spelling` is ≤ 3 arrays of two non-empty
  strings of ≤ 60 chars and `grammar` is one string ≤ 200 chars; otherwise the whole note is
  dropped (nothing stored, nothing shown).
- The existing safeguards are unchanged: answer trimmed to 6000 chars, delimited in the prompt,
  JSON-only reply, one retry on an unparseable reply, then `needsSelfMark` (slot refunded).

## POST /api/grade (rewrite questions) — response shape changes

Request unchanged: `{ "attemptId", "attemptToken", "questionId", "answer", "phase": "1" | "2" }`.

**Phase 1, marks < 3** — `200` (additions shown in bold):

```json
{
  "result": {
    "questionId": "…", "type": "rewrite", "maxMarks": 3, "phase": 1,
    "marksAwarded": 0 | 1 | 2,
    "feedback": "…",
    "termOutcomes": [ { "conceptId": "…", "correct": true } ],
    "creditedSpans": [ { "conceptId": "…", "span": "…" } ],
    "hint": { "terms": [ { "term": "tariff", "definition": "…" } ] }
  },
  "saved": false, "attemptCompleted": false, "phaseSaved": true
}
```

No `discussion`, no `languageNote`, no phase 2 fields.

**Phase 1, marks = 3** — `200` (as spec 005, plus the two new fields):

```json
{
  "result": {
    "questionId": "…", "type": "rewrite", "maxMarks": 3, "phase": 1,
    "marksAwarded": 3,
    "feedback": "…",
    "termOutcomes": [ { "conceptId": "…", "correct": true } ],
    "creditedSpans": [ { "conceptId": "…", "span": "…" } ],
    "languageNote": { "spelling": [ { "wrong": "fromm", "fix": "from" } ] },
    "discussion": { "modelSentences": ["…"], "terms": [ { "term": "…", "definition": "…", "why": "…" } ] }
  },
  "saved": true,
  "attemptCompleted": false | true
}
```

**Phase 2** — `200` (additions in bold):

```json
{
  "result": {
    "questionId": "…", "type": "rewrite", "maxMarks": 3, "phase": 2,
    "marksAwarded": 0 | 1 | 2,
    "feedback": "…",
    "termOutcomes": [ { "conceptId": "…", "correct": false } ],
    "creditedSpans": [ { "conceptId": "…", "span": "…" } ],
    "phase2TermOutcomes": [ { "conceptId": "…", "correct": true } ],
    "languageNote": { "spelling": [ { "wrong": "fromm", "fix": "from" } ], "grammar": "…" },
    "discussion": { "modelSentences": ["…"], "terms": [ { "term": "…", "definition": "…", "why": "…" } ] }
  },
  "saved": true,
  "attemptCompleted": false | true
}
```

`termOutcomes` remains phase 1's outcomes (the concept-tracking source, spec 005 FR-033);
`phase2TermOutcomes` is the new display-only list.

**409 already_answered (rewrite)** — the `result` shape is extended with the stored display data so
a double tap on another device restores the full state:

```json
{
  "error": "already_answered",
  "result": {
    "questionId": "…", "type": "rewrite", "maxMarks": 3, "phase": 1 | 2,
    "marksAwarded": …,
    "feedback": "…",
    "termOutcomes": [ … ],
    "creditedSpans": [ … ],
    "phase2TermOutcomes": [ … ],       // phase 2 only
    "languageNote": { … },              // final only
    "needsSelfMark": false
  }
}
```

**needsSelfMark** — unchanged from spec 005 (`discussion` attached for the self-mark screen, no
new fields).

**Storage**: the grade route writes `rewrite_phases.display_data`:

- phase 1 (both outcomes): `{ phase1: { spanByTerm } }` (+ `languageNote` when 3/3);
- phase 2: extends to `{ phase1, phase2: { spanByTerm }, phase2TermOutcomes, languageNote? }`
  inside the same `status = 'phase1'`-guarded update;
- and clears the graded phase's draft column on `rewrite_drafts`.

## POST /api/rewrite/draft (NEW)

Saves the in-progress draft text for one phase of a rewrite question, so a resume on another
device restores it (FR-053). Fire-and-forget from the client (`navigator.sendBeacon` on blur,
`pagehide` and `visibilitychange → hidden`); the quiz never waits on it (Principle VI).

Request: `{ "attemptId": string, "attemptToken": string, "questionId": string, "phase": 1 | 2, "draft": string }`
- `draft` is trimmed to 6000 characters. An empty string clears that phase's draft column.
- No marks, no answer-key fields, no user id.

Server checks, in order: session → attempt token valid, unexpired, bound to the user and attempt →
`questionId` is in the token's `questionIds` and is a rewrite question (404) → per-user draft rate
limit (dedicated limiter, `DRAFT_RATE_LIMIT` default 30 per user per minute; never the grading
limits, never `LLM_DAILY_CAP`) → **stale check**: if the attempt is completed, or the phase is
already graded (a phase row exists for phase 1; the row's status is `final` for phase 2), write
nothing and answer `200 { "saved": false }` (a late beacon must not resurrect a draft) → upsert into
`rewrite_drafts` (`INSERT … ON CONFLICT (attempt_id, question_id) DO UPDATE SET phase<1|2>_draft = …, updated_at = now()`).

`sendBeacon` sends the body as a `Blob` (`type: "application/json"`, same-origin, so no preflight
and the session cookie is sent); the route reads the raw body text and parses it as JSON rather
than relying on the request's content type.

Responses and error strings:

| Case | Status / body |
|---|---|
| Saved (or cleared) | `200 { "saved": true }` |
| Stale (phase already graded, or attempt completed) | `200 { "saved": false }` |
| Missing/empty ids, non-string draft, `phase` not 1 or 2 | `400 { "error": "invalid_request" }` |
| No session | `401 { "error": "unauthenticated" }` |
| Bad/expired attempt token | `400 { "error": "invalid_attempt_token" }` (matches the existing grade/self-mark routes and the client's reload-on-400 handling) |
| Question not in the attempt or not a rewrite question | `404 { "error": "not_found" }` |
| Over the draft rate limit | `429 { "error": "rate_limited", "retryAfter": number }` |
| Database unavailable | `503 { "error": "temporarily_unavailable" }` |

The client ignores every non-2xx (beacon semantics); sessionStorage holds the same text for the
same tab, so nothing is lost when a beacon is dropped.

## Resume (GET `/unit/[unitId]/quiz?attempt=<id>`)

The quiz page loader reads the phase row, `display_data` and the `rewrite_drafts` row. The payload
is unchanged except that each `rewriteState` entry gains the display and draft fields
(research R6):

```json
{
  "attemptId": "…", "attemptToken": "…",
  "questions": [ /* PublicQuestion[] — never key fields */ ],
  "answered": { "[questionId]": { "marks": 3, "max": 3 } },
  "rewriteState": {
    "[questionId]": {
      "phase": "phase1" | "phase2" | "final",
      "phase1Answer": "…",
      "phase1Marks": 2,
      "phase1Feedback": "…",
      "phase1CreditedSpans": [ { "conceptId": "…", "span": "…" } ],   // NEW, only once graded
      "phase2Answer": "…",
      "phase2Marks": 0 | 1 | 2,
      "phase2Feedback": "…",
      "phase2CreditedSpans": [ { "conceptId": "…", "span": "…" } ],  // NEW, final only
      "phase2TermOutcomes": [ { "conceptId": "…", "correct": true } ], // NEW, final only
      "languageNote": { "spelling": [ … ], "grammar": "…" },          // NEW, final only
      "marks": 2,
      "hint": { "terms": […] },        // only when phase === "phase1" (marks < 3)
      "discussion": { … },             // only when phase === "final"
      "phase1Draft": "…",             // NEW, from rewrite_drafts
      "phase2Draft": "…"              // NEW, from rewrite_drafts; the retry box loads it,
                                      // falling back to phase1Answer when absent
    }
  }
}
```

Stage discipline (unchanged from spec 005): nothing from the key before a phase 1 grade; the hint
plus phase 1 spans at `phase1`; the discussion and all display data at `final`. Marking states are
never represented.

## POST /api/results/self-mark (rewrite questions) — unchanged

The request, the per-criterion ticks, the token binding and the response are exactly as spec 005:
`200 { "saved": true, "attemptCompleted": boolean }` (or `saved: false` + `receipt` on a save
failure). No `creditedSpans` / `phase2TermOutcomes` / `languageNote` on the self-mark path (nothing
was AI-credited). The self-mark route writes `display_data = null` and stores
`results.concept_outcomes` from the ticks as today.

## Logging

Unchanged from spec 005 FR-044: each grading call logs one line
`[rewrite] outcome=<outcome> user=<hmac(userId)> question=<questionId> duration_ms=<ms>
model=<model>`. Never a sentence, span, language note, definition, model reply or marking note.
The draft route logs nothing beyond rate-limit counters.

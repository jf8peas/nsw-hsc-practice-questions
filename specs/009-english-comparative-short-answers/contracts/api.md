# API Contracts: Advanced English Comparative Short Answers

Extends [008's contracts/api.md](../../008-english-unseen-short-answers/contracts/api.md): every rule there (session
required, no user id / marks / max marks / grading method from the client, common errors, `phase` 1 and 2 in request bodies,
idempotency, logging) applies here unless this file says otherwise. Only the differences are written out. Unit id:
`y12-english-advanced-comparative-texts`. Constitution Principles I and II as amended to 2.16.0 (research R1).

## Types

```ts
type SkillId9 = SkillId /* 008's seven */ | "compares-texts" | "treats-both-in-depth";
interface SkillView { id: SkillId9; met: boolean; reason: string }
interface TryView9 { text: string; mark: number; skills: SkillView[] /* all nine, rubric order */;
                     feedback: string; biggestGap: string; goFurther: string | null; wordCount: number }

/** Public. Every text the question shows, in tab order. */
interface ComparativeQuestionPublic {
  id: string; type: "comparative"; group: "comparative"; prompt: string; parts?: Array<{label: string; text: string; marks: number}>;
  maxMarks: number /* 3..8 */; verb: string; source: string; suggestedWords: number; suggestedFrom: "lines" | "median";
  textIds: string[];                                   // tab order; each resolves in `texts`
  choice: null | { fixed: string[]; from: string[]; pick: number };
  concepts: string[]; outcome: string; paper: { school: string; short: string; year: number; exam: string; qNo: number };
}
// NEVER in a payload before the discussion: criteria, notes, model, pairing, any visual description.

interface ComparativeDiscussion { modelAnswer: string; modelWords: number; pairing?: string[] /* text ids; choice questions only */ }
```

## POST /api/attempts (comparative unit)

Request and statuses as 008's (`{ unitId }`; `201` new attempt, `200` resumed, `200 { finished: true, total, answered }` for an empty bank only, `404`, `429`, `503`).
The `201`/`200` body carries `questions: [ComparativeQuestionPublic]`, `texts: [UnseenText]` (every text of the question, every allowed text of a choice question) and
`comparativeState: ComparativeState` (data-model §7) in place of `unseenState`. A repeat has `comparativeState.repeating: true`.
Stage by stored data, as 008, plus the pick:

| Stored | `stage` | Carries |
|---|---|---|
| no phase row; draft row maybe | `write` | `draft1`, `pick?` (last saved complete pick), `pickLocked: false`, `dailyLimit?` |
| row `try1` | `choice` | `try1`, `pick?` (phase row), `pickLocked: true`, `retryOffered`, `dailyLimit?` |
| row `try1` and a retry draft | `retry` | `try1`, `draft2`, `pick?`, `pickLocked: true`, `retryOffered`, `dailyLimit?` |
| row `final` | `discussion` | `try1`, `try2?`, `ending`, `recordedMark`, `pick?`, `discussion` |

A saved pick is returned only if it still validates against the question (a retired allowed text is dropped, so the student must pick again).
Fixed-pair questions never carry `pick`.

## POST /api/comparative/pick

Saves the pick as soon as it is complete or changed (the pick is a draft-like field; the draft route itself is unchanged).

Request: `{ attemptId: string, attemptToken: string, questionId: string, pick: string[] }`. The client MUST NOT send marks, a phase, a user id or anything else.

| Status | Body | When |
|---|---|---|
| `200` | `{ ok: true }` | pick valid and saved to `rewrite_drafts.picked_text_ids` (row created on first save) |
| `400` | `{ error: "invalid_pick" }` | not an array of distinct strings; an id outside `choice.from`; length ≠ `choice.pick`; or the question is a fixed pair |
| `401` | `{ error: "invalid_attempt_token" }` | token missing, bad, expired, or not bound to this user, attempt and question |
| `404` | `{ error: "not_found" }` | attempt not the user's, or question not in the attempt |
| `409` | `{ error: "pick_locked" }` | the first try is already submitted (the pick is fixed; nothing is changed) |
| `429` / `503` | as 008 | |

Idempotent (the same pick twice is `200`). The response never includes anything from the key. Also sent as a `sendBeacon` on page hide (same body, no response needed).

## POST /api/grade (comparative questions)

Request (first try): `{ questionId, answer, phase: 1, attemptId, attemptToken, pick? }`; (retry): the same with `phase: 2` and no `pick` (a `pick` identical to the stored one is accepted).
`pick` is required for a choice question's first try and absent or empty for a fixed pair.

Server checks, in order, as 008's handler plus the pick: session and attempt ownership and token; the question exists and `type === "comparative"`; the database is readable
(else `503`, nothing marked); word rules from 008 (`answer` ≥ 20 words and ≤ 120% of `suggestedWords`, else `400 invalid_request`); **pick** as below; phase order; the rate limits and the
daily-limit slot (reserved before marking, refunded if the marker fails).

| Pick failure | Status | Body |
|---|---|---|
| incomplete, an id not in `choice.from`, duplicate ids, wrong count, or a pick on a fixed pair | `400` | `{ error: "invalid_pick" }` |
| (retry) a pick that differs from the first try's | `409` | `{ error: "pick_changed" }` |

On a first try the valid pick is stored in `unseen_phases.picked_text_ids` in the same write as the try (so a mark and its pick are never separated); on the retry the stored pick is used. **The marker is given only
`picked(q, pick)` = fixed texts + the pick (a fixed pair: both texts)**, each stimulus or a visual's description, never an unpicked allowed text.

### Phase 1, marked (`200`)

```json
{ "questionId": "…", "type": "comparative", "maxMarks": 6, "phase": 1, "marksAwarded": 4,
  "skills": [ /* nine SkillView */ ], "feedback": "…", "biggestGap": "…", "goFurther": null,
  "wordCount": 214, "retryOffered": true, "pick": ["fs…-t4"] }
```

At full marks: `goFurther` is the one sentence, `retryOffered` absent, `recordedMark`, `ending: "full_marks"` and `discussion: ComparativeDiscussion` are present (the model answer and, for a choice question, `pairing`).
`pick` is echoed on a choice question only. Nothing else from the key appears.

### Phase 2, marked (`200`)

As 008: `phase: 2`, `marksAwarded` capped at `maxMarks − 1`, `recordedMark` = the higher try, `ending: "retried"`, `try1: TryView9`, `discussion`. Both tries' pick is the stored pick.

### Not marked (marker unavailable or daily limit), either phase

Exactly 008's `200 { notMarked: { reason: "marker_unavailable" | "daily_limit", phase, resetsAt? } }`: the answer stays, no mark is invented, no self-marking, the slot is refunded on a marker failure, one slot per marked try.
A stored pick is untouched by a not-marked outcome (the first try row is not created, so the draft pick remains editable).

### Other failures and idempotency

`400 invalid_request` (word rules, malformed body), `400 phase_refused` (retry without a first try, or on a question with no retry), `400 invalid_phase`, `401`, `404`, `409 already_answered` (with `result`),
`429`, `503` — as 008. A double submit of the same phase returns `409 already_answered` with the stored result.

## POST /api/unseen/decline (comparative questions)

As 008: `{ attemptId, attemptToken, questionId }`; the route resolves the question's type (`unseen` or `comparative`) and finalises `try1` as `declined`. Responses as 008 with `skills` (nine) and
`discussion: ComparativeDiscussion`. `400 phase_refused` when there is no `try1` row or the question has no retry.

## The retry

There is no endpoint beyond `/api/grade` phase 2: the retry's box starts from the first try (client), one tip card per skill missed on try 1 (from `skills.json`), the pick chips are read-only and shown from `pick`.

## GET /unit/[unitId]/text/[textId] (a page)

As 008 with the access rule changed (research R3): `200` when signed in and the student has an attempt, in **any unit**, on a question that shows `textId` — both texts of a fixed pair, every allowed text of a choice question,
picked or not. The text must be in the named unit's `texts` (the unit exposes every text it shows). Redirect to `/signin` with no session. `404` for an unknown or malformed unit or text id, a text not in that unit, or
no attempt on a question that shows it (one answer for all of these). Notice page when the database cannot be read. `?attempt=<uuid>` turns highlighting on only if it is the student's own attempt, in any unit, on a question that shows the text
(`attemptUsesText`); otherwise the text shows with highlighting off and a note. The page carries the public text only.

## GET /api/unseen/image/[textId]

As 008. The text id is checked against the **shared text store** (both units' visuals), so one route serves both units. Same `404` for a malformed id, unknown id and non-image text.

## The marker's reply format (model → server, `lib/unseen/marker.server.ts`, prompt `lib/comparative/rubric.json`)

```json
{
  "mark": 5,
  "skills": {
    "answers-question": { "met": true,  "reason": "…" },
    "directive-verb": { "met": true, "reason": "…" },
    "analyses-not-retells": { "met": true, "reason": "…" },
    "technique-effect": { "met": true, "reason": "…" },
    "apt-evidence": { "met": false, "reason": "…" },
    "human-experience": { "met": true, "reason": "…" },
    "succinct": { "met": true, "reason": "…" },
    "compares-texts": { "met": false, "reason": "Writes about each text in turn; compares only in the last sentence." },
    "treats-both-in-depth": { "met": true, "reason": "…" }
  },
  "feedback": "2 or 3 sentences",
  "biggestGap": "one sentence (required below full marks)",
  "goFurther": "one sentence (required at full marks)"
}
```

Rules: as 008 (`mark` a whole number 0..maxMarks; every one of the nine verdicts present with a boolean `met`; `reason` a string, "" if absent; `feedback` and `biggestGap`/`goFurther` filled or repaired from reasons with
`reply_filled` logged; a reply that repeats a long run of the model answer is rejected). A missing verdict for any of the nine, an unparseable or cut-off reply is retried once within the time budget, then returns `notMarked`.
The marker is told the model answer is an example of the standard for one pairing and that an answer must not be marked down for choosing a different allowed text.

## Logging contract

As 008, with `unit` and `type: "comparative"` in the structured fields, and metrics `reply_filled`, `pick_invalid` (count of rejected picks, no ids) and `pick_changed`. Never log the answer, the key, the pick's text, or the user's identity beyond what 008 logs.

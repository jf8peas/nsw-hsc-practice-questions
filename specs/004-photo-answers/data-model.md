# Photo Answers: Data Model

**Feature**: Photo Answers for Short-Answer Questions  
**Branch**: `004-photo-answers`  
**Date**: 2026-10-29  

## Summary

No database schema changes are required. The photo answers feature reuses the existing `results` and `daily_ai_usage` tables. All photo-specific state is carried in signed tokens or browser sessionStorage.

---

## Database Schema: No Changes

### Existing Tables Used

| Table | Columns Used | Purpose |
|-------|--------------|---------|
| `results` | `user_id`, `attempt_id`, `question_id`, `answer`, `marks_awarded`, `max_marks`, `graded_by`, `feedback`, `rubric_hits`, `rubric_misses`, `created_at` | Stores the accepted transcription (+ note) as `answer`, or `"[photo answer, not transcribed]"` when self-marked without a read-back. |
| `daily_ai_usage` | `user_id`, `sydney_date`, `count` | Tracks AI-graded answers per user per Sydney day. Photo reads count against the same cap (default 40/day). |
| `attempts` | `user_id`, `unit_id`, `question_ids`, `mc_option_order`, `started_at`, `completed_at` | Unchanged; photo answers do not add attempt-level state. |

### Why No Schema Change

- **Principle II** (minimal personal data) prohibits new per-student fields.
- The 3-read limit is enforced in the transcription token, not the database.
- The reserved AI slot is tracked in `daily_ai_usage` (existing table).
- Photo answers are distinguished by a marker in the `answer` column, not a new column.

---

## Token Payloads

### Transcription Token

Carries the read-back state from `/api/transcribe` to `/api/grade`.

```typescript
interface TranscriptionTokenPayload {
  v: 1;                          // version
  uid: string;                   // user id (bound to session)
  attemptId: string;             // attempt this read belongs to
  questionId: string;            // question being answered
  transcriptionHash: string;     // SHA-256 of the transcription text (not including note)
  readCount: number;             // how many reads this question has used (1-3)
  reservedSlot: {                // the AI slot reserved for this question
    userId: string;
    sydneyDate: string;          // ISO date in Sydney time
  } | null;                      // null if no slot was reserved (e.g., over cap)
  iat: number;                   // issued at (seconds since epoch)
  exp: number;                   // expires at (seconds since epoch, 2 hours)
}
```

**Signing key**: Derived from `AUTH_SECRET` via HKDF with label `"transcription"`.

**Verification**:
- Signature must match (HMAC-SHA256).
- `uid` must match the session user id.
- `attemptId` must match the request's attempt id.
- `questionId` must match the request's question id.
- `exp` must be in the future.
- For exact-match enforcement: the answer's transcription portion must hash to `transcriptionHash`.

### Self-Mark Token (Existing, Reused)

When a photo read fails, `/api/transcribe` returns a self-mark token bound to `"[photo answer, not transcribed]"`.

```typescript
interface SelfMarkTokenPayload {
  v: 1;
  uid: string;
  attemptId: string;
  questionId: string;
  answerHash: string;            // SHA-256 of "[photo answer, not transcribed]"
  iat: number;
  exp: number;                   // 2 hours
}
```

---

## Stored Answer Format

### Photo Answer (Transcription + Note)

```
<<<TRANSCRIPTION>>>
{transcription text with LaTeX, e.g. "F = ma\\n\\nv^2 = u^2 + 2as"}
<<<NOTE>>>
{optional note, up to 500 chars, e.g. "see diagram on photo 2"}
```

- If no note is provided, the `<<<NOTE>>>` separator and everything after it is omitted.
- The transcription is capped at 5,000 characters.
- The note is capped at 500 characters.
- Total answer length is within the existing 6,000-character `MAX_ANSWER_LEN` in `/api/grade`.

### Typed Answer (Unchanged)

Plain text, as today. No marker.

### Self-Marked Photo Answer (No Read-Back)

```
[photo answer, not transcribed]
```

Stored verbatim in `results.answer`.

---

## Browser SessionStorage

### Photo Draft (Read-Back)

Kept in sessionStorage so a reload does not trigger another paid read.

```typescript
interface PhotoDraft {
  attemptId: string;
  questionId: string;
  transcription: string;       // raw text from vision model (with LaTeX)
  transcriptionHtml: string;   // KaTeX-rendered HTML for display
  transcriptionToken: string;  // signed token
  note?: string;               // optional typed note (≤500 chars)
  reservedSlot?: {             // copied from token for quick access
    userId: string;
    sydneyDate: string;
  };
  readCount: number;           // how many reads used (1-3)
}
```

**Key**: `photo-${attemptId}-${questionId}`

**Cleared when**:
- The student accepts the read-back and grading succeeds.
- The student switches to Type mode (explicitly clears the draft).
- The tab is closed (sessionStorage is per-tab).

**Survives**: Page reload within the same tab.

**Does not survive**: Tab close, or switching to a different tab/device.

### Photo Draft (Unread Photos)

Photos that have not yet been read are NOT stored. A reload before "Check my answer" loses them, and the Photo panel displays a notice: "Photos are kept only until the page is reloaded."

---

## State Transitions

### Photo Answer Flow

```
[No answer]
    │
    ├─► [Photo mode selected]
    │       │
    │       ├─► [1-3 photos taken] ──► [Check my answer tapped]
    │       │                               │
    │       │                               ▼
    │       │                    [POST /api/transcribe]
    │       │                               │
    │       │           ┌───────────────────┼───────────────────┐
    │       │           ▼                   ▼                   ▼
    │       │    [Success: read-back]  [Fail: illegible]  [Fail: not-answer]
    │       │           │                   │                   │
    │       │           │                   ▼                   ▼
    │       │           │           [Retake prompt]     [Retake prompt]
    │       │           │                   │                   │
    │       │           ▼                   └───────────────────┘
    │       │    [Accept or Retake]               │
    │       │           │                         │
    │       │           ▼                         ▼
    │       │    [POST /api/grade]         [Max 3 reads reached]
    │       │           │                             │
    │       │           ▼                             ▼
    │       │    [Marked result]              [Type or self-mark]
    │       │
    │       └─► [Type mode selected] ──► [Typed answer] ──► [POST /api/grade]
    │
    └─► [Already answered] ──► [Show stored result (409)]
```

### Allowance (Slot) Lifecycle

```
[First read requested]
    │
    ▼
[Reserve slot in daily_ai_usage] ──► [Over cap] ──► [Self-mark, no read]
    │
    ▼
[Vision call]
    │
    ├─► [Success: legible & answers question] ──► [Read-back shown]
    │       │
    │       ├─► [Accept & grade] ──► [Spend slot (count stays)]
    │       │
    │       └─► [Retake] ──► [Same slot, increment readCount]
    │
    ├─► [Fail: illegible] ──► [Refund slot] ──► [Retake, no new slot]
    │
    ├─► [Fail: not-answer] ──► [Refund slot] ──► [Retake, no new slot]
    │
    └─► [Fail: model error] ──► [Refund slot] ──► [Self-mark]
```

---

## Validation Rules

### Transcription Token

- `v` must be `1`.
- `uid` must match the session user id.
- `attemptId` must match the request's attempt id.
- `questionId` must match the request's question id.
- `readCount` must be between 1 and 3 (inclusive).
- `exp` must be in the future.
- `transcriptionHash` must match the SHA-256 of the answer's transcription portion (for photo answers).

### Answer Format

- If answer starts with `<<<TRANSCRIPTION>>>`, it is a photo answer.
- The transcription portion (between `<<<TRANSCRIPTION>>>` and `<<<NOTE>>>` or end) must not exceed 5,000 characters.
- The note portion (after `<<<NOTE>>>`) must not exceed 500 characters.
- Total answer length must not exceed 6,000 characters (enforced by `MAX_ANSWER_LEN` in `/api/grade`).

### Photo Upload

- Each file must be a valid image (magic bytes: JPEG, PNG, WebP).
- Each file must be ≤ 1.5 MB after client-side resize.
- Total files: 1-3.
- Multipart form data must include `attemptId`, `attemptToken`, `questionId`.

---

## Privacy & Retention

- **Photos**: Never stored. Exist only in memory during the transcribe request.
- **Transcription**: Stored in `results.answer` as the "answer submitted".
- **Note**: Stored as part of `results.answer` (after the `<<<NOTE>>>` separator).
- **Retention**: Same as typed answers — deleted 2 years after the student's last activity (later of last answer, last sign-in, or account creation).
- **Logs**: Only FR-026 metrics (hashed userId, questionId, outcome, duration_ms, model). No image data, no transcription text.

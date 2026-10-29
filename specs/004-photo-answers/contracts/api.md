# Photo Answers: API Contracts

**Feature**: Photo Answers for Short-Answer Questions  
**Branch**: `004-photo-answers`  
**Date**: 2026-10-29  

This document defines the request and response shapes for the new `POST /api/transcribe` route and the changes to `POST /api/grade`. All routes require a signed-in user (Google, via Auth.js v5).

---

## POST /api/transcribe

**Purpose**: Accept 1-3 photos of a handwritten answer, resize and validate them, send them to a vision model for transcription, and return the read-back with a signed transcription token.

**Runtime**: `nodejs`  
**Max Duration**: 60 seconds  

### Request

**Headers**:
- `Content-Type`: `multipart/form-data` (with boundary)
- Session cookie (Auth.js session, required)

**Body** (multipart form data):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attemptId` | string | Yes | The attempt id (must belong to the session user). |
| `attemptToken` | string | Yes | Signed attempt token (verifies the attempt belongs to the user). |
| `questionId` | string | Yes | The question being answered (must be in the attempt's question list). |
| `images` | File[] | Yes | 1-3 image files (JPEG, PNG, or WebP). Each ≤ 1.5 MB after resize. |
| `note` | string | No | Optional typed note (≤ 500 characters). Not sent to the vision model. |

### Response: Success (200)

**Body**:

```typescript
interface TranscribeSuccess {
  transcription: string;         // raw text from vision model (with LaTeX)
  transcriptionHtml: string;     // KaTeX-rendered HTML for display
  transcriptionToken: string;    // signed token for /api/grade
  note?: string;                 // the note from the request (if provided)
  readCount: number;             // how many reads this question has used (1-3)
  reservedSlot?: {               // the AI slot reserved (if any)
    userId: string;
    sydneyDate: string;
  };
}
```

### Response: Errors

#### 400 Bad Request

```typescript
interface TranscribeError {
  error: "invalid_request" | "invalid_image" | "image_too_large" | "invalid_note";
}
```

| Error | Meaning |
|-------|---------|
| `invalid_request` | Missing or malformed `attemptId`, `attemptToken`, `questionId`, or no images. |
| `invalid_image` | A file is not a valid image (magic bytes check failed), or is not JPEG/PNG/WebP. |
| `image_too_large` | An image exceeds 1.5 MB after resize. |
| `invalid_note` | The `note` field exceeds 500 characters. |

#### 401 Unauthorized

```typescript
interface TranscribeError {
  error: "unauthenticated";
}
```

The user is not signed in.

#### 403 Forbidden

```typescript
interface TranscribeError {
  error: "invalid_attempt_token";
}
```

The `attemptToken` is invalid, expired, or does not belong to the session user.

#### 404 Not Found

```typescript
interface TranscribeError {
  error: "not_found";
}
```

The `questionId` is not in the attempt's question list, or the question does not exist.

#### 409 Conflict

```typescript
interface TranscribeError {
  error: "already_answered";
  result: {
    questionId: string;
    type: "short";
    maxMarks: number;
    marksAwarded: number;
    feedback: string | null;
    rubricHits?: string[];
    rubricMisses?: string[];
    gradedBy: "llm" | "self";
  };
}
```

This question already has a saved result. Show the stored mark and move on.

#### 429 Too Many Requests

```typescript
interface TranscribeError {
  error: "rate_limited";
  retryAfter: number;  // seconds
}
```

Per-user or per-IP rate limit exceeded.

#### 429 Too Many Requests (Daily Cap)

```typescript
interface TranscribeError {
  error: "over_daily_cap";
  resetsAt: string;  // ISO 8601, Sydney time
}
```

The student has used their daily AI allowance. Self-marking is available.

#### 429 Too Many Requests (Read Limit)

```typescript
interface TranscribeError {
  error: "over_read_limit";
}
```

This question has already been read 3 times. Type the answer or self-mark.

#### 500 Internal Server Error

```typescript
interface TranscribeError {
  error: "model_unavailable";
}
```

The vision model failed after one retry. Self-marking is available.

#### 503 Service Unavailable

```typescript
interface TranscribeError {
  error: "db_unavailable";
}
```

The database cannot be reached. Self-marking is available (degraded mode).

---

## POST /api/grade (Changes)

**Purpose**: Grade one answer. For photo answers, verify the transcription token and add a handwriting-specific system prompt line.

**Runtime**: `nodejs`  
**Max Duration**: 60 seconds  

### Request (Unchanged)

**Headers**:
- `Content-Type`: `application/json`
- Session cookie (Auth.js session, required)

**Body**:

```typescript
interface GradeRequest {
  attemptId: string;
  attemptToken: string;
  questionId: string;
  answer: string;              // For photo answers: transcription + note; for typed: plain text
  transcriptionToken?: string; // Optional: present for photo answers
}
```

### Response: Photo Answer with Transcription Token

When `transcriptionToken` is present and valid:

1. Verify the token (signature, expiry, binding to uid/attemptId/questionId).
2. Verify the answer's transcription portion hashes to `transcriptionHash` in the token.
3. Spend the reserved slot (if any) — do NOT reserve a second slot.
4. Grade with the handwriting system prompt line: "This answer was handwritten and transcribed; award marks for correct working and method shown, as in HSC marking, and ignore crossed-out work."

**Success (200)**:

```typescript
interface GradeSuccess {
  result: GradeResult;         // Same as today
  saved: boolean;              // true if saved to database
  degraded: boolean;           // true if database was unavailable
  attemptCompleted: boolean | null;  // true if this completed the attempt, null if degraded
  receipt?: string;            // Signed receipt (if degraded or save failed)
}
```

### Response: Photo Answer Without Matching Transcription

When `transcriptionToken` is present but the answer does not start with `<<<TRANSCRIPTION>>>` (student switched to Type after a read):

1. Verify the token (signature, expiry, binding).
2. Spend the reserved slot (if any).
3. Grade as a typed answer (no handwriting system prompt line).

**Success (200)**: Same as above.

### Response: Self-Mark Token from Transcribe

When the answer is `"[photo answer, not transcribed]"` and a self-mark token is provided:

1. Verify the self-mark token.
2. Save the self-mark result (no LLM call).

**Success (200)**: Same as above.

### Errors (Unchanged from Existing /api/grade)

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | `invalid_request` | Missing or malformed fields. |
| 401 | `unauthenticated` | Not signed in. |
| 403 | `invalid_attempt_token` | Token invalid or wrong user. |
| 404 | `not_found` | Question not in attempt. |
| 409 | `already_answered` | Question already has a result. |
| 429 | `rate_limited` | Per-user or per-IP rate limit. |
| 429 | `over_daily_cap` | Daily AI allowance exhausted. |
| 500 | `model_unavailable` | LLM failed after retry. |
| 503 | `db_unavailable` | Database unreachable. |

---

## Rate Limits

| Route | Limit | Scope |
|-------|-------|-------|
| `POST /api/transcribe` | `GRADE_RATE_LIMIT` (default 20/min) | Per user |
| `POST /api/transcribe` | `GRADE_IP_RATE_LIMIT` (default 150/min) | Per IP |
| `POST /api/grade` | `GRADE_RATE_LIMIT` (default 20/min) | Per user |
| `POST /api/grade` | `GRADE_IP_RATE_LIMIT` (default 150/min) | Per IP |

Photo reads count against the same rate limits as short-answer grading.

---

## Daily AI Cap

| Route | Counts Against Cap | Refund Conditions |
|-------|-------------------|-------------------|
| `POST /api/transcribe` | Yes (one slot per question, from first read through marking) | `legible: false`, `answersQuestion: false`, model failure, database unreachable, over cap (no slot reserved) |
| `POST /api/grade` (with transcription token) | No (slot already reserved) | N/A (slot spent on successful grade) |

**Not refunded**: Student reads and then leaves without marking (slot stays used).

---

## Logging (FR-026)

Both routes log only minimal structured metrics:

```typescript
interface TranscribeLog {
  timestamp: string;           // ISO 8601
  userIdHash: string;          // HMAC-SHA256 with AUTH_SECRET
  questionId: string;
  outcome: "success" | "illegible" | "not-answer" | "model-fail" | "unparseable" | "rate-limited" | "over-cap" | "read-limit" | "already-answered" | "invalid-upload" | "db-unavailable";
  durationMs: number;
  model: string;               // VISION_MODEL
}
```

**Never logged**:
- Image bytes or file names.
- Transcription text.
- Model's raw reply.
- User id in plain text.

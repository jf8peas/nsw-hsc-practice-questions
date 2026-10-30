# Photo Answers: Implementation Tasks

**Feature**: Photo Answers for Short-Answer Questions  
**Branch**: `004-photo-answers`  
**Date**: 2026-10-29  

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Constitution**: v2.11.0

---

## Phase 0: Constitution Amendment (DONE)

- [x] **TASK-001**: Apply constitution amendment 2.11.0 to `.specify/memory/constitution.md`
  - Update Principles I, II, V, VI, VII, VIII
  - Update version to 2.11.0, Last Amended: 2026-10-29
  - **Acceptance**: Constitution file updated, all principles amended as per plan

---

## Phase 1: Server-Side Foundation

### Environment

- [x] **TASK-101**: Add `VISION_MODEL` to `.env.example`
  - Add line: `VISION_MODEL=deepseek/deepseek-v4.1-flash`
  - Add comment: "Vision model for photo transcription (server-only, not prefixed NEXT_PUBLIC_)"
  - **Acceptance**: `.env.example` updated, README mentions `VISION_MODEL`

### Single-Flight Mutex

- [x] **TASK-102**: Create `lib/singleFlight.ts`
  - Export `withSingleFlight<T>(key: string, fn: () => Promise<T>): Promise<T>`
  - In-memory Map for mutex per key (per user, attempt, question)
  - Timeout: 70 seconds (longer than vision call chain)
  - **Acceptance**: Unit tests for concurrent calls, mutex holds

### Transcription Token

- [x] **TASK-103**: Extend `lib/tokens.server.ts` with transcription token kind
  - Add `TRANSCRIPTION_TTL_SECONDS = 2 * 60 * 60` (2 hours)
  - Add `TranscriptionTokenPayload` interface
  - Export `signTranscriptionToken(input, nowMs): string`
  - Export `verifyTranscriptionToken(token, bind, nowMs): Verified<TranscriptionTokenPayload>`
  - **Acceptance**: Unit tests for sign/verify, expiry, wrong_user, mismatch

### Transcribe Server Logic

- [x] **TASK-104**: Create `lib/transcribe.server.ts`
  - Export `buildVisionPrompt(questionPrompt: string): ChatMessage[]`
    - System: "You are transcribing a handwritten NSW HSC answer..."
    - User: question prompt + images (no model answer, no rubric)
    - Request JSON: `{ transcription, legible, answersQuestion, notes }`
  - Export `validateImage(buffer: Buffer): { ok: true } | { ok: false, reason: string }`
    - Check magic bytes for JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WebP (`52 49 46 46...57 45 42 50`)
    - Reject non-images, corrupted files
  - Export `logTranscribeOutcome(outcome: LogOutcome): void`
    - Hash userId with HMAC-SHA256 (AUTH_SECRET)
    - Log: timestamp, userIdHash, questionId, outcome, durationMs, model
    - Never log: image bytes, transcription text, model's raw reply
  - **Acceptance**: Unit tests for prompt builder, image validation, logging

### Transcribe Route

- [x] **TASK-105**: Create `app/api/transcribe/route.ts`
  - `export const runtime = "nodejs"`
  - `export const maxDuration = 60`
  - POST handler:
    1. Resolve session (401 if not signed in)
    2. Parse multipart form data (attemptId, attemptToken, questionId, images[], note)
    3. Validate: attempt token bound to user, question in attempt, short-answer type
    4. Check rate limits (per-user, per-IP) → 429
    5. Check already answered (409 before any AI call)
    6. Check read limit (3 reads via token) → 429 `over_read_limit`
    7. Validate images (magic bytes, ≤1.5 MB each) → 400
    8. Validate note (≤500 chars) → 400
    9. Reserve AI slot (or return over-cap → 429 `over_daily_cap`)
    10. Single-flight lock (prevent double-tap)
    11. Vision call (25 s timeout, one retry)
    12. Parse response JSON
    13. If `legible: false` or `answersQuestion: false`: refund slot, return retake prompt
    14. Sign transcription token (with readCount, reservedSlot)
    15. Return transcription, transcriptionHtml (KaTeX), token, note, readCount
  - Error handling: all error codes per contracts/api.md
  - **Acceptance**: Route tests with PGlite, fake-openrouter for vision

### Grade Route Changes

- [x] **TASK-106**: Extend `app/api/grade/route.ts`
  - Accept `transcriptionToken` in request body
  - If present:
    1. Verify token (signature, expiry, binding)
    2. Extract transcription from answer (before `<<<NOTE>>>` or whole answer)
    3. Verify transcription hash matches token's `transcriptionHash`
    4. Spend the reserved slot (do NOT reserve a new one)
    5. Add handwriting system prompt line: "This answer was handwritten and transcribed; award marks for correct working and method shown, as in HSC marking, and ignore crossed-out work."
  - If answer does not start with `<<<TRANSCRIPTION>>>` (switched to Type): treat as typed answer, spend slot
  - **Acceptance**: Route tests for photo answers, typed answers after read, hash mismatch

### Drafts Extension

- [x] **TASK-107**: Extend `lib/drafts.ts`
  - Add `PhotoDraft` interface
  - Export `savePhotoDraft(attemptId, questionId, draft): void`
  - Export `loadPhotoDraft(attemptId, questionId): PhotoDraft | null`
  - Export `clearPhotoDraft(attemptId, questionId): void`
  - Key: `photo-${attemptId}-${questionId}`
  - **Acceptance**: Unit tests for save/load/clear, survives reload

### Fake OpenRouter Extension

- [x] **TASK-108**: Extend `scripts/fake-openrouter.ts`
  - Handle vision requests (messages with `image_url` content)
  - Return mock transcription JSON: `{ transcription, legible, answersQuestion, notes }`
  - Support `FAKE_VISION=pass|fail|illegible|not-answer` env var
  - **Acceptance**: Can drive transcription tests locally without real API

---

## Phase 2: Client-Side UI

### Photo Answer Panel

- [x] **TASK-201**: Create `components/PhotoAnswerPanel.tsx`
  - File input: `<input type="file" accept="image/*" capture="environment" multiple />`
  - Canvas resize: longest side 1,600 px, JPEG quality 0.8
  - Thumbnails: show 1-3 photos with Retake and Remove buttons
  - Note box: optional, 500 char limit, counter
  - "Check my answer" button: disabled after first tap (single-flight)
  - Progress state: "Reading your answer..."
  - Tip: "Write clearly in dark pen, one question per photo, fill the frame."
  - **Acceptance**: Renders on 390 px phone, no horizontal scroll, all buttons reachable

### Read-Back Panel

- [x] **TASK-202**: Create `components/ReadBackPanel.tsx`
  - Display transcription as read-only HTML (KaTeX-rendered)
  - Show diagram descriptions in words
  - Show crossed-out work marked as crossed out
  - Buttons: "Looks right, mark it" and "Retake"
  - Note display (if any)
  - **Acceptance**: Read-only, formulas rendered, buttons work

### Quiz Component Integration

- [x] **TASK-203**: Extend `components/Quiz.tsx`
  - Add Photo mode toggle (Type/Photo) per question
  - Render PhotoAnswerPanel when Photo mode selected
  - Render ReadBackPanel after "Check my answer"
  - Handle accept: call `/api/grade` with transcription + note + token
  - Handle retake: clear read-back, allow new photos
  - Handle switch to Type: clear photo draft, show typed box
  - Handle reload: restore read-back from sessionStorage, lose unread photos
  - **Acceptance**: Full flow works on phone, all edge cases handled

---

## Phase 3: Testing

### API Tests

- [x] **TASK-301**: Create `tests/api/transcribe.test.ts`
  - All error codes (400, 401, 403, 404, 409, 429, 500, 503)
  - Image validation (magic bytes, size)
  - Rate limits, daily cap, read limit
  - Vision call success/failure
  - Slot refund on failure
  - **Acceptance**: All tests pass with PGlite and fake-openrouter

- [x] **TASK-302**: Create `tests/api/grade-photo.test.ts`
  - Transcription token verification
  - Hash mismatch rejection
  - Handwriting system prompt added
  - Slot spent on success
  - Switch to Type after read
  - **Acceptance**: All tests pass

### Client Tests

- [x] **TASK-303**: Create `tests/client/photo-answer.test.tsx`
  - Photo capture, preview, retake/remove
  - Note box character limit
  - Read-back display, accept/retake
  - Reload behavior (read-back survives, photos lost)
  - **Acceptance**: jsdom tests pass

### Constitution Compliance Tests

- [x] **TASK-304**: Add tests for constitution requirements
  - No image data in database or logs
  - 3-read limit enforced
  - Refund rules (illegible, not-answer, model failure)
  - Production fails closed (missing VISION_MODEL → 503)
  - **Acceptance**: All compliance tests pass

---

## Phase 4: Launch Preparation

- [x] **TASK-401**: Update school consent wording
  - "Answer photos are sent to an AI provider that may use them for training. Do not include personal or sensitive information in photos."
  - **Acceptance**: Consent document updated (outside code) — wording added to README "Before launch" section; the school's actual consent document is outside this repo and must be updated before launch.

- [x] **TASK-402**: Document `VISION_MODEL` in README
  - Add to environment variables table
  - **Acceptance**: README updated

- [ ] **TASK-403**: Manual testing on real phone (390 px)
  - Follow quickstart.md scenarios
  - **Acceptance**: All 12 scenarios pass — REQUIRES a real phone; not executable by code. Run the scenarios in `quickstart.md` before launch.

---

## Task Dependencies

```
TASK-001 (constitution) → All other tasks

TASK-101 (env) → TASK-105 (transcribe route)
TASK-102 (single-flight) → TASK-105
TASK-103 (token) → TASK-105, TASK-106
TASK-104 (transcribe server) → TASK-105
TASK-105 (transcribe route) → TASK-301, TASK-403
TASK-106 (grade route) → TASK-302
TASK-107 (drafts) → TASK-201, TASK-203
TASK-108 (fake-openrouter) → TASK-301, TASK-302

TASK-201 (photo panel) → TASK-203
TASK-202 (read-back panel) → TASK-203
TASK-203 (quiz integration) → TASK-303, TASK-403

TASK-301, TASK-302, TASK-303, TASK-304 → TASK-403

TASK-401, TASK-402, TASK-403 → Launch
```

---

## Estimated Effort

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| Phase 0 | 1 | 0.5 (DONE) |
| Phase 1 | 8 | 12-16 |
| Phase 2 | 3 | 8-12 |
| Phase 3 | 4 | 8-12 |
| Phase 4 | 3 | 2-4 (outside code: 401) |
| **Total** | **19** | **30-44 hours** |

---

## Definition of Done (per task)

- [ ] Code implemented
- [ ] Unit/integration tests written and passing
- [ ] TypeScript strict mode passes
- [ ] Lint passes
- [ ] Constitution compliance verified (no violations)
- [ ] Acceptance criteria met (per task)

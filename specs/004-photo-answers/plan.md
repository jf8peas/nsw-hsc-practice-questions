# Implementation Plan: Photo Answers for Short-Answer Questions

**Branch**: `004-photo-answers` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-photo-answers/spec.md` and technical decisions from `specs/004-photo-answers/design-notes.md`

## Summary

Students can answer short-answer questions by writing on paper and submitting 1-3 photos, which are transcribed to text by a vision model, shown back for confirmation, and then marked by the existing grader against the rubric. This solves the problem of typing maths working on a phone, which causes students to skip steps or whole questions, so the grader never sees the working that HSC marking rewards.

The technical approach, in short:

- **Photo capture**: Native `<input type="file" accept="image/*" capture="environment">` — rear camera on phones, file picker on laptops. No camera library.
- **Client resize**: Browser draws each photo to a canvas, longest side 1,600 px, JPEG quality ~0.8 (~200-500 KB each). Re-encoding drops EXIF including GPS.
- **Transcribe route**: `POST /api/transcribe` (new, `runtime = "nodejs"`, `export const maxDuration = 60`): multipart form data with `attemptId`, `attemptToken`, `questionId`, 1-3 images, optional `note` (≤500 chars). Same checks as `/api/grade`: session, attempt token bound to the user, question in the attempt, short-answer type, per-user and per-IP rate limits. Returns 409 `already_answered` before any model call if the question has a saved result.
- **Vision call**: Through the existing `chatCompletion` (`lib/openrouter.server.ts`), images as `image_url` data URLs, **25 s timeout, one retry** (50 s total, fits in 60 s maxDuration with headroom). Model = new server-only env var `VISION_MODEL`, set to `deepseek/deepseek-v4.1-flash`. The prompt gets the question prompt only — never the model answer or rubric. Reply JSON: `{ transcription, legible, answersQuestion, notes }`.
- **Transcription token**: Signed token (new token kind in `lib/tokens.server.ts`) over uid, attemptId, questionId, SHA-256 of the transcription, **readCount (1-3)**, and the **reserved slot**. The slot and readCount travel ONLY inside the token, never in client state.
- **Grading**: Student accepts → `POST /api/grade` with `answer` = transcription + optional note and the transcription token. `/api/grade` verifies the token covers the transcription, spends the carried slot (never reserves a second one), and grades with `GRADING_MODEL` (`deepseek/deepseek-chat`, text-only, unchanged) plus one system-prompt line: "This answer was handwritten and transcribed; award marks for correct working and method shown, as in HSC marking, and ignore crossed-out work."
- **Images in memory only**: Exist only in the transcribe request: never written to disk, database or logs.
- **Slot and failure rules**:

| Situation | Student sees | Cap slot |
| --- | --- | --- |
| `legible: false` or `answersQuestion: false` | Retake prompt | Refunded |
| Vision call fails twice | Self-mark | Refunded |
| Over the daily cap | Self-mark + time AI marking returns | Not used |
| Database unreachable | Self-mark with notice (degraded mode) | Not used |
| 3 reads used | Type the answer or self-mark | Kept |
| Read-back accepted, never marked | — | Kept (accepted) |

- **Client state**: Photos live only in the tab (memory); a reload before "Check my answer" loses them. After a read, the transcription, its rendered HTML and its token are kept in sessionStorage (`lib/drafts.ts`) so a reload does not trigger another paid read.
- **Constitution amendment**: 2.10.0 → 2.11.0 (MINOR), before any code.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict), React 19, Next.js 15 App Router, Node 22 on Vercel

**Primary Dependencies**: existing: `next`, `react`, `react-dom`, `katex`, `@upstash/ratelimit`, `@upstash/redis`, `next-auth@5.0.0-beta.32`, `drizzle-orm`, `@neondatabase/serverless`. No new runtime dependencies. New dev: none beyond existing test stack.

**Storage**: Neon Postgres, AWS `ap-southeast-2` (Sydney); schema unchanged — no new tables or columns. `results.answer` holds the transcription (+ note). Browser: `sessionStorage` drafts (`lib/drafts.ts`), `localStorage` outbox unchanged. No photo storage.

**Testing**: Vitest (`npm test`); route handlers called directly with PGlite running the committed migrations; `server-only` aliased out. Extend `scripts/fake-openrouter.ts` to answer vision (image_url) requests.

**Target Platform**: Vercel (Node functions in `syd1`, middleware on the edge runtime). Phones are the main client.

**Performance Goals**: photo answer flow completes in under 30 seconds for 90% of submissions (SC-001), excluding time spent writing on paper.

**Constraints**: 
- Photos never stored (Principle II)
- Vision prompt gets no model answer or rubric (Principle I)
- Production fails closed
- MC grading never capped or rate limited
- No HTTP-driver transactions (every critical write is one atomic statement or safely repeatable)
- 3-read limit per question
- Daily cap of 40 shared with marking
- Observability limited to minimal structured metrics (hashed userId, questionId, outcome, duration_ms, model) with no image data or transcription text logged
- Timeout chain: 25 s x 2 vision calls fits in 60 s maxDuration; client timeout 70 s

**Scale/Scope**: a school cohort (tens to low hundreds of students); a few thousand results per week. Photo reads count against the existing `LLM_DAILY_CAP` (40/day), with no separate photo allowance.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* Checked against constitution v2.10.0; amendment to v2.11.0 required and specified below.

| Principle | Status | Notes |
|---|---|---|
| I. Answer key never reaches the browser | ✅ (with amendment) | The vision prompt gets the question prompt only — never the model answer or rubric. The grader receives only the transcription text (plus optional note), exactly as for typed answers. The client sends only `questionId`, `attemptId` with its signed attempt token, 1-3 images, optional `note`, and on accept the signed transcription token. The server verifies attempt ownership and every token's signature, expiry and binding before acting. Stored data excludes model answers and rubrics. Amendment 2.11.0 adds: transcribe route may accept 1-3 images and an optional note; `/api/grade` may accept the signed transcription token. |
| II. Signed-in students, minimal data | ✅ (with amendment) | No new per-student fields are stored. `results.answer` holds the transcription (+ note) — the "answer submitted". Photos are never stored or logged (Principle II amendment). FR-026 metrics (hashed userId, questionId, outcome, duration_ms, model) are allowed in logs. Photos may go to any OpenRouter provider for the model, including ones that retain or train on data (decided: no provider restriction). Answer photos are treated as non-sensitive; school consent says so and tells students to keep personal or sensitive information out of photos. Retention, region and consent rules unchanged. |
| III. Content is code | ✅ | No content changes. Question ids unchanged. |
| IV. Validation gates the build | ✅ | `npm run validate` unchanged. No new content convention introduced. KaTeX formulas pre-rendered server-side (keeps KaTeX out of client bundle). |
| V. Syllabus fidelity, original content | ✅ (with amendment) | "No photographed images" covers question content, not student answers (amendment). No change to question sourcing rules. |
| VI. Grading fair, explainable, graceful | ✅ (with amendment) | MC: instant, server-side, no cap, no rate limit. Short: photo reads follow the same cap and rate limits. Illegible / not-an-answer → retake, never 0 (amendment). LLM failure, daily-cap exhausted, database unreachable all fall back to self-marking. 3-read limit enforced. Refund rules as per design-notes.md table. |
| VII. Cost and abuse controls | ✅ (with amendment) | Photo reads count against `LLM_DAILY_CAP` (one slot per question, no separate cap). `VISION_MODEL` is server-only like `OPENROUTER_API_KEY`. Per-user and per-IP rate limits apply to `/api/transcribe` as for `/api/grade`. Production fails closed. |
| VIII. Simplicity | ✅ | No new dependency: native file input, canvas, `FormData`, existing fetch wrapper. Mobile-first: on a 390 px phone the Photo tab, camera button and submit are reachable without scrolling past the question. |
| IX. Teacher access server-side | ✅ | No teacher pages added. Student scoping by session user id on every query. |

### Constitution Amendment 2.11.0 (MINOR)

Before implementation, the constitution is amended to v2.11.0 with the following changes:

| Principle | Change |
|---|---|
| I | Transcribe route may accept 1-3 images and an optional note; `/api/grade` may accept the signed transcription token. Vision prompt gets no model answer or rubric. |
| II | Photos are never stored or logged; only the transcription (the "answer submitted"). Consent wording: answer photos are sent to an AI provider that may use them for training; students must keep personal or sensitive information out of photos. FR-026 metrics (hashed userId, questionId, outcome, duration_ms, model) are allowed in logs. |
| V | "No photographed images" covers question content, not student answers. |
| VI | Illegible / not-an-answer → retake, never 0; refund rules as per design-notes.md; 3-read limit per question. |
| VII | `VISION_MODEL` is server-only like `OPENROUTER_API_KEY`; photo reads count against `LLM_DAILY_CAP` (one slot per question, no separate cap). |
| VIII | No new dependency: native file input, canvas, `FormData`, existing fetch wrapper. |

**Gate result**: PASS with amendment 2.11.0 required before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/004-photo-answers/
├── plan.md              # This file
├── spec.md              # Requirements and on-screen wording
├── design-notes.md      # Technical decisions (routes, tokens, image sizes, timeouts, models, env vars)
├── research.md          # Design decisions (8 questions resolved)
├── data-model.md        # No schema change, token payloads, answer format
├── quickstart.md        # Manual validation scenarios
└── contracts/
    └── api.md           # Request/response shapes for /api/transcribe and /api/grade
```

### Source Code

```text
app/
├── api/
│   ├── transcribe/route.ts          # NEW  POST: multipart, validate, vision call, transcription token
│   └── grade/route.ts               # CHANGED  accepts transcription token, adds handwriting system prompt
└── unit/[unitId]/
    └── quiz/page.tsx                # NO CHANGE needed (Quiz.tsx handles Photo mode)

components/
├── Quiz.tsx                         # CHANGED  Photo answer panel, camera button, thumbnails, note box, read-back
├── PhotoAnswerPanel.tsx             # NEW  client: file input, canvas resize, preview, retake/remove, check button
├── ReadBackPanel.tsx                # NEW  client: read-only transcription, KaTeX HTML, accept/retake
└── Formula.tsx                      # NO CHANGE (server-side KaTeX already exists)

lib/
├── openrouter.server.ts             # NO CHANGE (chatCompletion already supports image_url)
├── tokens.server.ts                 # CHANGED  adds "transcription" token kind
├── grading.server.ts                # CHANGED  accepts transcription token, adds handwriting system prompt line
├── transcribe.server.ts             # NEW  vision prompt builder, image validation (magic bytes), transcription logic
├── usage.server.ts                  # NO CHANGE (reserveAiSlot already works per user per day)
├── ratelimit.server.ts              # NO CHANGE (rate limits apply to transcribe route)
├── drafts.ts                        # CHANGED  sessionStorage for photo drafts (read-back, token)
└── singleFlight.ts                  # NEW  per-(user, attempt, question) mutex for double-tap protection

.env.example                         # CHANGED  adds VISION_MODEL
```

### Environment Variables

```bash
# Existing
OPENROUTER_API_KEY=sk_or_...
GRADING_MODEL=deepseek/deepseek-chat
LLM_DAILY_CAP=40
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
DATABASE_URL=postgresql://...
CRON_SECRET=...

# New for Photo Answers
VISION_MODEL=deepseek/deepseek-v4.1-flash
```

### Data Model

No new tables or columns. Existing schema reused:

- `results.answer` (TEXT NOT NULL): holds the accepted transcription (+ note), or `"[photo answer, not transcribed]"` when self-marked without a read-back.
- `results.graded_by` (TEXT): unchanged, `"llm"` or `"self"`.
- `results.feedback` (TEXT): unchanged, the grader's feedback.
- `results.rubric_hits` / `results.rubric_misses` (TEXT[]): unchanged.
- `daily_ai_usage` (user_id, sydney_date, count): photo reads count against the same cap.

### Client State (sessionStorage)

```typescript
interface PhotoDraft {
  attemptId: string;
  questionId: string;
  transcription: string;      // raw text from vision model
  transcriptionHtml: string;  // KaTeX-rendered HTML
  transcriptionToken: string; // signed token
  note?: string;              // optional typed note (≤500 chars)
  readCount: number;          // how many reads used (1-3)
}
```

Keyed by `photo-${attemptId}-${questionId}`. Cleared on successful grade or when the student switches to Type mode.

## Testing

Vitest, run by `npm test`. Required tests (each maps to a success criterion in the spec):

| Test | Covers |
|---|---|
| **Photo capture and upload** | |
| On a phone, rear camera opens; on a laptop, file picker opens | SC-001, FR-002 |
| 1-3 photos accepted as thumbnails with Retake and Remove buttons | FR-003 |
| Optional note limited to 500 characters | FR-004 |
| On 390 px phone, Photo choice, "Take photo" and "Check my answer" reachable without scrolling past the question | FR-006 |
| **Transcribe route** | |
| Missing or invalid attempt token → 401 | FR-014 |
| Question already has a saved result → 409 `already_answered` before any AI call | FR-013 |
| Not a short-answer question → 400 | FR-014 |
| Upload is not an image (wrong magic bytes) → 400 | FR-014 |
| Image file exceeds 1.5 MB after resize → 400 | FR-010 |
| Per-user and per-IP rate limits enforced | FR-022 |
| Double-tap: simultaneous requests get same result, only one slot reserved | research #8 |
| **Vision call and read-back** | |
| Vision prompt receives question prompt only, never model answer or rubric | FR-008, Principle I |
| `legible: false` → retake prompt, cap slot refunded | FR-011, FR-021 |
| `answersQuestion: false` (wrong question, blank page, selfie) → retake prompt, cap slot refunded | FR-011, FR-021 |
| Vision call fails twice → self-mark, cap slot refunded | FR-018, FR-021 |
| 3 reads used → type or self-mark prompt, no 4th read | FR-012 |
| Read-back survives page reload in sessionStorage; accepting it does not read again | FR-024 |
| Photos not yet read are lost on reload; Photo panel says so | FR-024, edge cases |
| **Grading** | |
| Transcription token verified: signature, expiry, binding to uid/attemptId/questionId | FR-016 |
| Transcription hash matches answer's transcription portion | FR-016 |
| Grader receives transcription + note, with handwriting system prompt line | FR-015 |
| Result shows marks, feedback, rubric hits/misses, model answer, with photo thumbnails visible | FR-017 |
| Switching to Type after read: slot spent, graded as typed answer | research #5 |
| **Fallbacks and allowance** | |
| Daily cap exhausted → self-mark, told when AI marking returns, no read happens | FR-018, FR-020, FR-021 |
| Database unreachable → self-mark with degraded mode notice | FR-018 |
| Self-mark with no read-back: stored answer is `"[photo answer, not transcribed]"`, photo thumbnails shown beside model answer | FR-019 |
| Read-back accepted but marking fails → self-mark with read-back shown | FR-018 |
| **Scoping and security** | |
| Student B using student A's attemptId gets 404; nothing leaks | FR-014 |
| Another student's attempt token rejected | FR-014 |
| Tampered or expired transcription token rejected | FR-016 |
| No image data reaches the database or logs | FR-023, Principle II |
| **Constitution compliance** | |
| No answer-key leakage: vision prompt gets no model answer or rubric | Principle I |
| Photos never stored: no database writes, no file writes, no logs | Principle II |
| Production fails closed: missing `VISION_MODEL` or auth/DB config → 503 | Principle VII |
| **Logging (FR-026)** | |
| Outcome logged: success, illegible, not-answer, model-fail, etc. | FR-026 |
| User id hashed with HMAC-SHA256 (AUTH_SECRET), not bare SHA-256 | FR-026 |
| No transcription text or model reply logged | FR-026, Principle II |

Other code may have tests but is not required (constitution Quality Gates).

## Complexity Tracking

No constitution violations with amendment 2.11.0.

New dependencies (Principle VIII requires a written justification):

| ID | Dependency | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|---|
| None | No new runtime dependencies | Photo capture uses native browser APIs: `<input type=file>`, canvas for resize, `FormData` for upload, existing `chatCompletion` wrapper for vision call. | N/A |

Complexity additions (justified):

| ID | Addition | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|---|
| C1 | `VISION_MODEL` env var | Teacher needs to swap the vision model without code changes if it misreads handwriting. | Hard-coding the model would require a deploy to change it. |
| C2 | Transcription token kind | Stateless verification that the read-back was produced by the server for this student/attempt/question. Carries readCount and reserved slot. | Storing transcriptions in a separate table would violate Principle II (minimal data). |
| C3 | sessionStorage for read-back | Survives page reload so the student is not charged twice for the same read. | Server-side storage would require a new table and violate Principle II. |
| C4 | 3-read limit per question (in token) | Prevents abuse (repeated reads to game the system) while allowing reasonable retakes. | No limit would allow unlimited free reads; 3 is the minimum that allows for genuine retakes. |
| C5 | Cap slot refund on failure | Fair: students should not lose their daily allowance for system failures. | Not refunding would penalize students for failures outside their control. |
| C6 | Single-flight mutex (per user, attempt, question) | Prevents double-tap from reserving two slots or bypassing the 3-read limit. | Client-side disable alone is insufficient (multi-tab, retries). |
| C7 | Answer format with `<<<TRANSCRIPTION>>>` and `<<<NOTE>>>` markers | Distinguishes photo answers from typed answers for rendering and hash verification. | Separate column would violate Principle II. |

## Implementation Phases

### Phase 0: Constitution Amendment

- [ ] Update `.specify/memory/constitution.md` to v2.11.0 with the amendment table above.
- [ ] Update `.specify/templates/plan-template.md` Constitution Check section if needed.

### Phase 1: Server-Side Foundation

- [ ] Add `VISION_MODEL` to `.env.example`.
- [ ] Create `lib/singleFlight.ts`: per-(user, attempt, question) mutex with Upstash fallback.
- [ ] Extend `lib/tokens.server.ts`: add "transcription" token kind with `signTranscriptionToken` and `verifyTranscriptionToken`.
- [ ] Create `lib/transcribe.server.ts`: vision prompt builder (question prompt only, no model answer/rubric), image validation (magic bytes for JPEG/PNG/WebP, 1.5 MB limit), transcription logic, outcome logging (FR-026).
- [ ] Create `app/api/transcribe/route.ts`: multipart handler, session check, attempt token verification, rate limit, cap reservation (or return over-cap), single-flight lock, vision call (25 s timeout, one retry), transcription token signing, response. Handle all error codes per contracts/api.md.
- [ ] Extend `app/api/grade/route.ts`: accept `transcriptionToken` in request, verify it, check transcription hash matches answer, spend the carried slot (do not reserve), add handwriting system prompt line when grading.

### Phase 2: Client-Side UI

- [ ] Create `components/PhotoAnswerPanel.tsx`: file input (`accept="image/*" capture="environment"`), canvas resize (longest side 1,600 px, JPEG 0.8), thumbnails, Retake/Remove buttons, note box (500 char limit), "Check my answer" button, single-flight on client (disable after first tap).
- [ ] Create `components/ReadBackPanel.tsx`: read-only transcription display, KaTeX-rendered HTML (from server), diagram descriptions, "Looks right, mark it" and "Retake" buttons.
- [ ] Extend `components/Quiz.tsx`: Photo mode toggle (Type/Photo), integrate PhotoAnswerPanel and ReadBackPanel, handle mode switching, clear draft on switch.
- [ ] Extend `lib/drafts.ts`: sessionStorage helpers for photo drafts (`savePhotoDraft`, `loadPhotoDraft`, `clearPhotoDraft`).
- [ ] Extend `scripts/fake-openrouter.ts`: handle vision requests (image_url in messages), return mock transcription JSON.

### Phase 3: Testing and Validation

- [ ] Write all required tests in `tests/api/transcribe.test.ts`, `tests/api/grade-photo.test.ts`, `tests/client/photo-answer.test.tsx`.
- [ ] Run `npm run build`, `npm run lint`, `npm test` — all must pass.
- [ ] Manual testing on a 390 px phone: Photo tab, camera button, submit reachable without scrolling.
- [ ] Spot-check 20 photo answers against teacher's marking (SC-002).

### Phase 4: Launch Preparation

- [ ] Update school consent wording: answer photos sent to AI provider that may use them for training; keep personal/sensitive information out of photos.
- [ ] Document `VISION_MODEL` in README.
- [ ] Add photo answer tip to on-screen UI: "Write clearly in dark pen, one question per photo, fill the frame."

## Planning Risks and Open Items

- **Vision model accuracy**: `deepseek/deepseek-v4.1-flash` is the initial choice; if it misreads handwriting, swap `VISION_MODEL` without code change. Teacher to validate with real student handwriting.
- **HEIC support**: iOS Safari usually supplies JPEG; if the canvas cannot decode a file, show "use JPEG or PNG". No server-side conversion.
- **Consent wording**: Launch blocker outside the code. School must update consent to cover AI training use of answer photos.
- **3-read limit UX**: Students need clear messaging when they've used all 3 reads. UI must show "You have used all photo reads for this question. Type your answer or mark it yourself."
- **Cap slot timing**: Slot reserved on first read, kept through retakes for the same question, spent on successful grade. Refunded on legible/answersQuestion failure, vision call failure, cap exceeded, database unreachable. Not refunded when student reads and leaves without marking.
- **SessionStorage limits**: Read-back stored in sessionStorage (typically 5-10 MB per origin). Transcription text is small (<10 KB), so this is not a concern.
- **Vercel body limit**: 4.5 MB max for function request bodies. 3 photos at ~200-500 KB each fit comfortably.
- **Timeout chain**: Client timeout (70 s) > server maxDuration (60 s) > vision call chain (25 s x 2 = 50 s). Client timeout ends in self-marking, not an error.
- **Double-tap protection**: Server-side single-flight mutex is authoritative; client-side disable is visual only.

## Out of Scope (Phase 2, If Wanted)

- QR handoff so a laptop user can take the photo on a phone.
- Storing photos or teacher review of photos.
- Multiple choice photo answers.
- Any change to concept tracking or quiz weighting.

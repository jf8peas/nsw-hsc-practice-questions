# Photo Answers: Research & Design Decisions

**Feature**: Photo Answers for Short-Answer Questions  
**Branch**: `004-photo-answers`  
**Date**: 2026-10-29  

This document records the eight key design decisions for the photo answers feature, each with the decision made, the rationale, and alternatives considered.

---

## 1. Per-Question State Without a New Table

**Decision**: The 3-read limit (FR-012) and "one allowance per question across reads" (FR-020) are enforced by carrying `readCount` and the reserved AI slot inside the signed transcription token. Each new read sends the previous token back to the server. A read without a token reserves a fresh slot. Getting around the limit always costs the student an allowance.

**Rationale**: 
- No new database table or column is needed (Principle II: minimal data).
- The token is already signed and bound to the user, attempt and question, so `readCount` cannot be tampered with.
- A student can only bypass the 3-read limit by accepting a read-back (which spends the slot) or by burning an allowance on a fresh read with no token.
- This is consistent with how attempt tokens carry question lists and MC option order.

**Alternatives Considered**:
- **Upstash counter**: Would work but splits "AI usage today" between two stores (Principle VIII simplicity). Also requires a separate key per (user, question) pair, which is more complex than the token approach.
- **Database column on attempts**: Would require a schema change and violate Principle II's "no new per-student fields" rule.
- **Server-side session map**: Would not survive serverless cold starts and would leak memory.

---

## 2. Timeouts: Vision Call Chain Within Function maxDuration

**Decision**: Each vision call timeout is 25 seconds, with one retry (50 s total). The route's `maxDuration` is set to 60 seconds, leaving 10 s headroom for multipart upload parsing and the database slot reservation. The client's timeout is 70 seconds (longer than the server worst case). A client timeout ends in self-marking, not an error.

**Rationale**:
- Vercel Hobby/Pro plans allow up to 60 s maxDuration for Node.js functions.
- 25 s per vision call is enough for the model to process 1-3 resized images (each ~200-500 KB).
- One retry handles transient network blips without exceeding the function timeout.
- The client timeout being longer than the server's ensures the server always finishes first and can return a proper self-mark fallback.

**Alternatives Considered**:
- **Raise maxDuration to 120 s**: Would require a Vercel Enterprise plan (not available).
- **No retry**: Would fail too often on transient network issues.
- **Longer timeout (45 s x 2)**: Would exceed 60 s maxDuration when upload time is included.

---

## 3. Answer Format and Verification

**Decision**: The typed note is NOT sent to `/api/transcribe` (the vision model does not need it). It goes only to `/api/grade`. The stored answer format is:

```
<<<TRANSCRIPTION>>>
{transcription text with LaTeX}
<<<NOTE>>>
{note text, up to 500 chars}
```

The `/api/grade` route checks that the text before `<<<NOTE>>>` (or the whole answer if no separator) hashes to the transcription token's transcription hash. The note is capped at 500 characters. The transcription is capped at 5,000 characters so that the 6,000-character slice in `/api/grade` can never break the hash check.

**Rationale**:
- The vision model only needs images and the question prompt, not the student's note.
- The separator format makes it trivial to split transcription and note for display and storage.
- Hash verification ensures the transcription was produced by the server for this student/attempt/question.
- The 5,000-character cap on transcription leaves 1,000 characters for the note and separator within the existing 6,000-character `MAX_ANSWER_LEN`.

**Alternatives Considered**:
- **Send note to transcribe route**: Unnecessary; the vision model would ignore it.
- **Store transcription and note in separate fields**: Would require a schema change (Principle II).
- **No hash check**: Would allow tampering; the token must bind to the exact transcription.

---

## 4. Self-Mark Tokens from the Transcribe Route

**Decision**: When a read fails twice, the allowance is used up, or the database is down, `/api/transcribe` returns a self-mark token bound to `"[photo answer, not transcribed]"` so the existing `/api/results/self-mark` route works unchanged (FR-019). The self-mark screen shows the photo thumbnails beside the model answer.

**Rationale**:
- Reuses the existing self-mark flow without duplication.
- The self-mark token is signed and bound to the answer text, so it cannot be reused for a different answer.
- Students see a consistent self-mark UI whether the photo read failed or they typed an answer that the LLM could not grade.

**Alternatives Considered**:
- **New photo-specific self-mark route**: Would duplicate code; the existing route already handles tokens.
- **No self-mark, just show model answer**: Would break the flow; students expect to self-mark and have it saved.

---

## 5. Switching from Photo to Type After a Read

**Decision**: When `/api/grade` receives a transcription token with an answer that does not match the transcription (the student typed instead), it treats it as a typed answer and spends the slot the token carries. FR-016's exact-match rule applies only to photo answers (where the answer starts with `<<<TRANSCRIPTION>>>`).

**Rationale**:
- Students may change their mind after seeing the read-back and prefer to type.
- The allowance was already used for the question, so it should be spent regardless.
- The exact-match rule prevents tampering with photo transcriptions, but typed answers have no such requirement.

**Alternatives Considered**:
- **Refuse typed answer if token present**: Would block students from switching modes.
- **Require a new token for typed answers**: Unnecessary complexity; the slot is already reserved.

---

## 6. Showing Photo Answers Later

**Decision**: `results.answer` holds the transcription with LaTeX and the note. The attempt page (`/attempts/[attemptId]`) and the result screen detect photo answers by the `<<<TRANSCRIPTION>>>` marker and render them server-side with KaTeX. Typed answers stay plain text.

**Rationale**:
- No new column is needed (Principle II).
- KaTeX rendering is already done server-side for formulas (Principle IV).
- The marker makes it easy to distinguish photo answers from typed answers for rendering.

**Alternatives Considered**:
- **Store rendered HTML**: Would duplicate data and bloat the database.
- **Client-side KaTeX**: Would pull KaTeX into the client bundle (violates Principle IV).
- **Separate column for isPhotoAnswer**: Unnecessary; the marker suffices.

---

## 7. Logging (FR-026)

**Decision**: Outcomes logged for every path: `success`, `illegible`, `not-answer`, `model-fail`, `unparseable`, `rate-limited`, `over-cap`, `read-limit`, `already-answered`, `invalid-upload`, `db-unavailable`. The user id is hashed with a keyed HMAC (using `AUTH_SECRET`), not a bare SHA-256. The vision path never logs the model's reply, even on parse failure (unlike the existing grader which logs up to 300 characters). No request body, image byte or transcription text may reach a log.

**Rationale**:
- FR-026 requires minimal metrics; logging the model's reply would violate Principle II.
- Keyed HMAC prevents rainbow-table attacks on hashed user ids.
- Comprehensive outcome coverage allows monitoring SC-001 (30 s target) and debugging without logging sensitive data.

**Alternatives Considered**:
- **Log transcription for quality analysis**: Would violate Principle II; rejected.
- **Bare SHA-256 hash**: Vulnerable to rainbow tables; keyed HMAC is safer.
- **Copy grader's 300-char reply log**: Would risk leaking image content; rejected.

---

## 8. Double Taps: Simultaneous "Check My Answer" Requests

**Decision**: Two simultaneous requests for the same question are handled by:
1. **Server-side single-flight lock**: A per-(user, attempt, question) mutex in memory (with Upstash fallback) ensures only one read runs at a time. The second request waits for the first to complete and returns the same result.
2. **Token reuse**: If the first read succeeds, its token is returned to both requests. If it fails, both get a self-mark token.
3. **Client-side disable**: The "Check my answer" button is disabled after the first tap (visual only; server-side lock is authoritative).

**Rationale**:
- Client-side disable alone is insufficient (multiple tabs, network retries).
- Server-side lock prevents double slot reservation and bypassing the 3-read limit.
- Upstash fallback ensures the lock works across serverless instances.

**Alternatives Considered**:
- **Database unique constraint on (user, attempt, question, sydneyDate)**: Would not prevent double reads; only prevents double saves.
- **No lock, let both run**: Would waste two slots and allow bypassing the 3-read limit.
- **Client-side lock only**: Insufficient for multi-tab or retry scenarios.

---

## Constitution Amendment 2.11.0

**Decision**: The constitution is amended from v2.10.0 to v2.11.0 (MINOR) with the following changes:

| Principle | Change |
|---|---|
| I | Transcribe route may accept 1-3 images and an optional note; `/api/grade` may accept the signed transcription token. Vision prompt gets no model answer or rubric. |
| II | Photos are never stored or logged; only the transcription (the "answer submitted"). Consent wording: answer photos are sent to an AI provider that may use them for training; students must keep personal or sensitive information out of photos. FR-026 metrics (hashed userId, questionId, outcome, duration_ms, model) are allowed in logs. |
| V | "No photographed images" covers question content, not student answers. |
| VI | Illegible / not-an-answer → retake, never 0; refund rules as per design-notes.md; 3-read limit per question. |
| VII | `VISION_MODEL` is server-only like `OPENROUTER_API_KEY`; photo reads count against `LLM_DAILY_CAP` (one slot per question, no separate cap). |
| VIII | No new dependency: native file input, canvas, `FormData`, existing fetch wrapper. |

**Rationale**: The feature cannot be implemented without these amendments. The amendment is MINOR because it expands guidance on existing principles rather than adding new ones.

**Alternatives Considered**:
- **No amendment, implement anyway**: Would violate the constitution; rejected.
- **MAJOR amendment**: Unnecessary; no principles are redefined, only expanded.

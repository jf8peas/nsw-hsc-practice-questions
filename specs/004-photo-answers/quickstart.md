# Photo Answers: Quickstart Validation Guide

**Feature**: Photo Answers for Short-Answer Questions  
**Branch**: `004-photo-answers`  
**Date**: 2026-10-29  

This guide provides manual validation scenarios to verify the photo answers feature works end-to-end. It assumes the implementation is complete and the server is running locally.

---

## Prerequisites

1. **Local environment set up**:
   ```bash
   npm install
   cp .env.example .env.local
   # Fill in:
   # - DATABASE_URL (Neon Postgres, Sydney region)
   # - AUTH_SECRET (run: npx auth secret)
   # - AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET (for real Google sign-in)
   # - OPENROUTER_API_KEY (for LLM grading)
   # - VISION_MODEL=deepseek/deepseek-v4.1-flash
   ```

2. **Database migrated**:
   ```bash
   npm run db:migrate
   ```

3. **Server running**:
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

4. **Signed in**: Use the Dev login (any name) or real Google sign-in.

5. **Test device**: A phone with a camera (e.g., iPhone Safari at 390 px width) or a laptop with a webcam.

---

## Manual Testing Scenarios

### 1. Photo Tab, Camera, and Thumbnails (FR-001 to FR-006)

**Goal**: Verify the Photo mode UI works on a 390 px phone.

**Steps**:
1. Open a unit with short-answer questions (e.g., `/unit/y12-physics-advanced-mechanics`).
2. Start a quiz.
3. Navigate to a short-answer question.
4. Tap "Photo" to switch from Type to Photo mode.
5. Tap "Take photo".
6. On a phone: Confirm the rear camera opens. On a laptop: Confirm a file picker opens.
7. Take a photo (or select an image file).
8. Confirm the photo appears as a thumbnail with "Retake" and "Remove" buttons.
9. Add a second and third photo.
10. Confirm the "Take photo" button is unavailable after the third photo.
11. Confirm the tip "Write clearly in dark pen, one question per photo, fill the frame." is visible.
12. Confirm the Photo choice, "Take photo" and "Check my answer" are reachable without scrolling past the question (on a 390 px phone).
13. Confirm the page does not scroll sideways.

**Expected**: All UI elements are visible and functional. Thumbnails show with Retake/Remove.

---

### 2. Read-Back with Formulas and Diagram Descriptions (FR-007 to FR-009)

**Goal**: Verify the read-back shows maths as formulas and diagrams as descriptions.

**Steps**:
1. Write a calculation answer on paper with some LaTeX-style maths (e.g., `F = ma`, `v^2 = u^2 + 2as`).
2. Include a simple diagram (e.g., a force arrow labelled "F").
3. Take a photo of the answer.
4. Tap "Check my answer".
5. Wait for the read-back to appear.
6. Confirm maths is shown as formatted formulas (KaTeX-rendered).
7. Confirm the diagram is described in words (e.g., "A force arrow labelled 'F' pointing right").
8. Confirm crossed-out work (if any) is marked as crossed out.
9. Confirm the read-back is read-only (no editing).
10. Confirm the only choices are "Looks right, mark it" and "Retake".

**Expected**: Read-back shows formulas rendered, diagram described, crossed-out work noted.

---

### 3. Accept and Retake (FR-009, FR-015)

**Goal**: Verify accept and retake both work.

**Steps**:
1. After the read-back appears, tap "Retake".
2. Take a new photo.
3. Tap "Check my answer" again.
4. Confirm the new read-back appears.
5. Tap "Looks right, mark it".
6. Wait for marking to complete.
7. Confirm the result screen shows:
   - Marks awarded and max marks.
   - Feedback text.
   - Rubric points hit and missed.
   - Model answer.
   - Photo thumbnails still visible.

**Expected**: Retake works, accept leads to marking with full result.

---

### 4. Three-Read Limit (FR-012)

**Goal**: Verify the 3-read limit is enforced.

**Steps**:
1. After the first read-back, tap "Retake" twice more (total 3 reads).
2. After the third read-back, tap "Retake" again.
3. Confirm the message: "You have used all photo reads for this question. Type your answer or mark it yourself."
4. Confirm the options are to switch to Type mode or self-mark.

**Expected**: 4th read is refused with the message above.

---

### 5. Reload Before and After Read-Back (FR-024)

**Goal**: Verify reload behavior.

**Before read-back**:
1. Take 1-3 photos but do NOT tap "Check my answer".
2. Reload the page.
3. Confirm the photos are lost.
4. Confirm the Photo panel says: "Photos are kept only until the page is reloaded."

**After read-back**:
1. Take a photo, tap "Check my answer", and wait for the read-back.
2. Reload the page.
3. Confirm the read-back is still there (not re-read).
4. Confirm accepting it does not use another allowance.

**Expected**: Photos lost before read, read-back survives reload.

---

### 6. Unreadable Photo (FR-011, FR-021)

**Goal**: Verify an unreadable photo prompts a retake and refunds the allowance.

**Steps**:
1. Take a deliberately blurry photo.
2. Tap "Check my answer".
3. Confirm the message: "We couldn't read this clearly. Please retake the photo."
4. Confirm no mark is given.
5. Confirm the AI allowance is refunded (check `daily_ai_usage` table or try another photo).

**Expected**: Retake prompt, no mark, allowance refunded.

---

### 7. Wrong Question / Blank Page / Selfie (FR-011, FR-021)

**Goal**: Verify a non-answer photo prompts a retake.

**Steps**:
1. Take a photo of a different question, a blank page, or a selfie.
2. Tap "Check my answer".
3. Confirm the message: "This photo does not appear to be an answer to this question. Please retake with your answer to this question."
4. Confirm no mark is given.
5. Confirm the AI allowance is refunded.

**Expected**: Retake prompt, no mark, allowance refunded.

---

### 8. Model Unavailable (FR-018)

**Goal**: Verify fallback when the vision model fails.

**Steps**:
1. Set `OPENROUTER_API_KEY` to an invalid value (or use `scripts/fake-openrouter.ts` with `FAKE_REVIEW=down`).
2. Take a photo and tap "Check my answer".
3. Confirm the self-mark screen appears.
4. Confirm the stored answer is `"[photo answer, not transcribed]"`.
5. Confirm the photo thumbnails are shown beside the model answer.
6. Confirm self-marking works.

**Expected**: Self-mark fallback, allowance refunded.

---

### 9. Daily Allowance Used Up (FR-018, FR-020, FR-021)

**Goal**: Verify fallback when the daily cap is exhausted.

**Steps**:
1. Use up your daily AI allowance (40 short answers or photo reads).
2. Try to submit a photo answer.
3. Confirm no read happens.
4. Confirm the self-mark screen appears.
5. Confirm the message: "AI marking is unavailable. You have used your daily allowance of 40 AI-graded answers. AI marking returns at midnight Sydney time."
6. Confirm self-marking works.

**Expected**: Self-mark fallback, no read, allowance not used (already over).

---

### 10. Database Unavailable (FR-018)

**Goal**: Verify degraded mode when the database is down.

**Steps**:
1. Stop the database or set `DATABASE_URL` to an invalid value.
2. Take a photo and tap "Check my answer".
3. Confirm the self-mark screen appears.
4. Confirm the message: "AI marking is unavailable due to a database issue. Your answer will be self-marked."
5. Confirm self-marking works.
6. Confirm receipts are queued (check browser console or `localStorage`).

**Expected**: Self-mark fallback, degraded mode notice.

---

### 11. Optional Typed Note (FR-004, FR-015)

**Goal**: Verify the note is marked with the transcription.

**Steps**:
1. Take a photo of an answer.
2. Type a note: "see diagram on photo 2".
3. Tap "Check my answer" and accept the read-back.
4. Confirm the stored answer is the read-back followed by the note.
5. Confirm the note is limited to 500 characters (try typing more).

**Expected**: Note is stored and marked with the transcription.

---

### 12. Already Answered (FR-013)

**Goal**: Verify a question with a saved result is refused.

**Steps**:
1. Answer a short-answer question (Type or Photo).
2. Complete the marking.
3. Reload the quiz or open in another tab.
4. Try to submit a photo answer for the same question.
5. Confirm the 409 response with the stored mark.

**Expected**: 409 Conflict with stored result shown.

---

## Running the Full Test Suite

```bash
# From repo root, in Git Bash:
npm test
npm run lint
npm run build
```

**Expected**: All tests pass, lint passes, build succeeds.

---

## Type Check

```bash
npx tsc --noEmit
```

**Expected**: No type errors.

---

## Constitution Compliance Check

Verify the following against `.specify/memory/constitution.md`:

- [ ] No answer-key leakage: vision prompt gets no model answer or rubric.
- [ ] Photos never stored: no database writes, no file writes, no logs.
- [ ] Production fails closed: missing `VISION_MODEL` or auth/DB config → 503.
- [ ] `VISION_MODEL` is server-only (not prefixed `NEXT_PUBLIC_`).
- [ ] Daily cap enforced: photo reads count against `LLM_DAILY_CAP`.
- [ ] 3-read limit enforced per question.
- [ ] Refund rules: illegible, not-answer, model failure refund; accepted-then-abandoned does not.

---

## Launch Checklist (Outside Code)

- [ ] School consent wording updated: "Answer photos are sent to an AI provider that may use them for training. Do not include personal or sensitive information in photos."
- [ ] `VISION_MODEL` documented in README.
- [ ] Teacher briefed on photo answer flow and 3-read limit.

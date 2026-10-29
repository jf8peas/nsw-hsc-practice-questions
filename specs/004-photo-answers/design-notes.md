# Photo Answers — design notes for the plan

Agreed in the requirements discussion of 2026-10-29 (Claude doc "Photo Submission for Short-Answer
Questions — Requirements"). `spec.md` states WHAT and WHY; this file carries the technical decisions
that `/speckit.plan` must adopt. Where the two disagree, `spec.md` wins and this file is corrected.

## Flow (decided: two steps)

1. Student takes 1–3 photos (`<input type=file accept=image/* capture=environment>`; file picker on
   laptops). No camera library.
2. Browser shrinks each photo: draw to a canvas, longest side 1,600 px, JPEG quality ~0.8
   (~200–500 KB each). Re-encoding drops EXIF, including GPS. Vercel rejects function request
   bodies over 4.5 MB, so 3 photos fit.
3. `POST /api/transcribe` (new, `runtime = "nodejs"`, `export const maxDuration = 60`): multipart
   form data with `attemptId`, `attemptToken`, `questionId`, 1–3 images, optional `note`
   (≤ 500 chars).
   - Same checks as `/api/grade`: session, attempt token bound to the user, question in the
     attempt, short-answer type, per-user and per-IP rate limits.
   - 409 `already_answered` before any model call if the question has a saved result.
   - Each part checked by magic bytes (JPEG/PNG/WebP, not the declared type), ≤ 1.5 MB.
   - Reserves ONE `LLM_DAILY_CAP` slot for the question on its first read; up to 3 reads per
     question on that slot (retake limit), then `read_limit` → type or self-mark.
4. Vision call through the existing `chatCompletion` (`lib/openrouter.server.ts`), images as
   `image_url` data URLs, 45 s timeout, one retry. Model = new server-only env var `VISION_MODEL`,
   set to `deepseek/deepseek-v4.1-flash` (decided, no model test; swap the env var if it misreads
   handwriting). The prompt gets the question prompt only — never the model answer or rubric.
   Reply JSON: `{ transcription, legible, answersQuestion, notes }`.
   - Transcription prompt: write out exactly what is on the page in reading order; maths in
     LaTeX; crossed-out work marked as crossed out; each drawn diagram described in words (axes
     and labels, curves and which way they shift, equilibrium points, force arrows and labels);
     nothing corrected or completed; `legible: false` if more than a small part is unreadable;
     `answersQuestion: false` for the wrong question, a blank page or a non-answer photo.
5. Response: transcription, LaTeX rendered server-side with KaTeX (keeps KaTeX out of the client
   bundle, Principle IV), and a signed transcription token (new token kind in
   `lib/tokens.server.ts`) over uid, attemptId, questionId, SHA-256 of the transcription, and the
   reserved slot.
6. Student accepts → `POST /api/grade` with `answer` = transcription + optional note and the
   transcription token. `/api/grade` verifies the token covers the transcription, spends the
   carried slot (never reserves a second one), and grades with `GRADING_MODEL`
   (`deepseek/deepseek-chat`, text-only, unchanged) plus one system-prompt line: "This answer was
   handwritten and transcribed; award marks for correct working and method shown, as in HSC
   marking, and ignore crossed-out work."
7. Images exist only in memory for the transcribe request: never written to disk, database or logs.

## Slot and failure rules

| Situation | Student sees | Cap slot |
| --- | --- | --- |
| `legible: false` or `answersQuestion: false` | Retake prompt | Refunded |
| Vision call fails twice | Self-mark | Refunded |
| Over the daily cap | Self-mark + time AI marking returns | Not used |
| Database unreachable | Self-mark with notice (degraded mode) | Not used |
| 3 reads used | Type the answer or self-mark | Kept |
| Read-back accepted, never marked | — | Kept (accepted) |

Self-mark with no transcription stores `[photo answer, not transcribed]` in `results.answer`
(NOT NULL) and the self-mark screen shows the photo thumbnails beside the model answer. The
self-mark token binds to that stored text.

## Client state

- Photos live only in the tab (memory); a reload before "Check my answer" loses them.
- After a read, the transcription, its rendered HTML and its token are kept in sessionStorage
  (`lib/drafts.ts`) so a reload does not trigger another paid read.
- HEIC: iOS Safari usually supplies JPEG; if the canvas cannot decode a file, show "use JPEG or PNG".

## Data and privacy

- No new tables or columns. `results.answer` holds the transcription (+ note).
- Photos may go to any OpenRouter provider for the model, including ones that retain or train on
  data (decided: no provider restriction). Answer photos are treated as non-sensitive; school
  consent says so and tells students to keep personal or sensitive information out of photos.

## Constitution amendment 2.10.0 → 2.11.0 (MINOR), before any code

| Principle | Change |
| --- | --- |
| I | Transcribe route may accept 1–3 images and an optional note; `/api/grade` may accept the signed transcription token. Vision prompt gets no model answer or rubric. |
| II | Photos are never stored or logged; only the transcription (the "answer submitted"). Consent wording as above. |
| V | "No photographed images" covers question content, not student answers. |
| VI | Illegible / not-an-answer → retake, never 0; refund rules above; 3-read limit. |
| VII | `VISION_MODEL` is server-only like `OPENROUTER_API_KEY`; photo reads count against `LLM_DAILY_CAP` (one slot per question, no separate cap). |
| VIII | No new dependency: native file input, canvas, `FormData`, existing fetch wrapper. |

## Out of scope (phase 2, if wanted)

QR handoff so a laptop user can take the photo on a phone. Storing photos / teacher review of photos.

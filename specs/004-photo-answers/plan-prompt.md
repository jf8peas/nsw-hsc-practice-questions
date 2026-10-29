# `/speckit-plan` prompt for spec 004

Paste everything inside the block below into your agent as one message.

```text
/speckit-plan

Plan specs/004-photo-answers. spec.md is final (including FR-026 from the 2026-10-29 clarify session); design-notes.md holds the agreed technical decisions. Read both, plus .specify/memory/constitution.md, CLAUDE.md and README.md, before writing anything.

The existing specs/004-photo-answers/plan.md is an early draft: replace it with a plan built from the template, and produce research.md, data-model.md, contracts/ and quickstart.md beside it. Do not carry over these mistakes from the draft: the reserved AI slot must never live in client state (it travels only inside the signed transcription token); chatCompletion already supports image_url parts, so it needs no change for images; Formula.tsx and the quiz page.tsx do not need to change; the 45 s x 2 timeout chain does not fit in a 60 s function (see 2 below).

Starting point (read the code, do not guess): app/api/grade/route.ts, lib/grading.server.ts, lib/openrouter.server.ts, lib/tokens.server.ts, lib/usage.server.ts (daily_ai_usage is per user per Sydney day, nothing per question), lib/ratelimit.server.ts, app/api/results/self-mark/route.ts, lib/drafts.ts, components/Quiz.tsx and app/attempts/[attemptId]/page.tsx.

Resolve these in research.md, each with the decision, the reason and the alternatives rejected:

1. Per-question state without a new table. The 3-read limit (FR-012) and "one allowance per question across reads" (FR-020) need state for (attempt, question). Recommended: carry readCount and the reserved slot in the signed transcription token; each new read sends the previous token back; a read without a token reserves a fresh slot, so getting round the limit always costs the student an allowance. Compare with an Upstash counter (Principle II already allows rate-limit counters) and pick one. No new database table or column.
2. Timeouts. One vision try plus one retry must finish inside the route's maxDuration, with headroom for the upload and the database. Either shorten each try (for example 25 s x 2 inside 60 s) or raise maxDuration; check what the Vercel plan allows. The client's own timeout must be longer than the server's worst case, and a client timeout must end in self-marking, not an error.
3. Answer format and verification. The note is NOT sent to /api/transcribe (the vision model does not need it); it goes only to /api/grade. Define the exact stored format (transcription, a fixed separator, then the note), how /api/grade checks that the text before the separator hashes to the token's transcription hash, and that the note is at most 500 characters. /api/grade currently slices answers to 6,000 characters before anything else, so cap the transcription length (for example 5,000) so that slicing can never break the hash check.
4. Self-mark tokens from the transcribe route. When a read fails twice, the allowance is used up or the database is down, /api/transcribe must return a self-mark token bound to "[photo answer, not transcribed]" so the existing self-mark route works unchanged (FR-019).
5. Switching from Photo to Type after a read (spec edge case). When /api/grade receives a transcription token with an answer that does not match the transcription, treat it as a typed answer and spend the slot the token carries; FR-016's exact-match rule applies only to photo answers.
6. Showing photo answers later. results.answer holds LaTeX, so the attempt page would show raw \frac{..}{..}. Recommended: begin stored photo answers with a fixed marker line and render them server-side with KaTeX on the attempt page (and on the result screen); typed answers stay plain text. No new column.
7. Logging (FR-026). Outcomes must cover every path, not just the four in the spec: success, illegible, not-an-answer, model failure, unparseable reply, rate-limited, over the daily allowance, read limit reached, already answered, invalid upload, database unavailable. Hash the user id with a keyed HMAC (AUTH_SECRET), not a bare SHA-256. The vision path must never log the model's reply, even on a parse failure (the existing grader logs up to 300 characters of the reply; that pattern must not be copied), and no request body, image byte or transcription text may reach a log.
8. Double taps. Two simultaneous "Check my answer" requests for the same question must not reserve two slots or bypass the read limit; say how (client-side single flight is not enough on its own).

Constitution:
- The feature needs constitution 2.11.0 (MINOR). Draft the exact amendment text in the plan (Principles I, II, V, VI, VII from design-notes.md, plus a line in II allowing the FR-026 metrics in logs) and add it as the first task. Run the Constitution Check against 2.10.0, listing each rule the feature needs amended, then re-check against the drafted 2.11.0.
- Principle I: the client sends only attemptId, attemptToken, questionId, images, and on /api/grade the answer, note and transcription token. Never a user id, marks, slot or read count in the clear.
- Principle VII: VISION_MODEL is read only in server code; add it to .env.example and the README. No new runtime dependency (Principle VIII).
- The school consent wording (FR-025) is a launch task outside the code: list it, do not plan code for it.

contracts/ should hold the request and response shapes for POST /api/transcribe (every status code and error string) and the changes to POST /api/grade, in the style of specs/001-student-saved-scores/contracts/api.md. data-model.md should state there is no schema change and define the token payload, the stored answer format and the sessionStorage draft.

Testing (Quality Gates): the cap falls back to self-marking on the photo path; another student's attempt is rejected; oversized, non-image and wrongly typed uploads (magic bytes) are refused; no image bytes or transcription text reach the database or logs; the 3-read limit holds, including against a missing or replayed token; a refund happens for illegible, not-an-answer and model failure but not for an accepted-then-abandoned read; 409 before any model call when already answered; the grade route rejects a photo answer whose text does not match its token. Use the existing PGlite route tests and scripts/fake-openrouter.ts (extend it to answer image requests).

quickstart.md: a manual check on a real phone at 390 px (Photo tab, camera, thumbnails, read-back with formulas and a described diagram, accept, retake, the 3-read message, reload before and after the read-back) and with the model off, the allowance used up and the database down. Include running the full suite, lint, type check and build through Git Bash as CLAUDE.md describes.
```

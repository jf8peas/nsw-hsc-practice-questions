# Review fixes for spec 006 (implementation review, 2026-11-03)

Paste everything inside the block below into your agent as one message.

```text
Fix the following problems found in the review of the spec 006 implementation (specs/006-sentence-rewrite-redesign). Read spec.md, plan.md, research.md (R5, R6, R7), contracts/api.md and tasks.md first. Do not change grading behaviour, marks or concept tracking. Write each missing test first and confirm it fails before fixing.

1. Draft writes are silently dropped (bug). lib/db/queries/rewrite-drafts.server.ts passes `{ [column.name]: … }` to Drizzle's `.set()`. `column.name` is the SQL name ("phase1_draft"), but Drizzle's update builder only matches the schema's TypeScript keys (phase1Draft / phase2Draft) and ignores anything else. So in upsertRewriteDraft the ON CONFLICT update only changes updated_at (every save after the first is lost, and a resume on another device restores the first fragment the student typed), and clearRewriteDraft is a no-op. Use the TS keys (`phase === 1 ? { phase1Draft: draft } : { phase2Draft: draft }`) in both functions.

2. Draft rows are never deleted (T014, research R5.2, Principle II). The grade route only clears a column. When the question becomes final (phase 1 at 3/3, or phase 2 graded), delete the rewrite_drafts row for (user, attempt, question) instead of clearing; do the same in app/api/results/self-mark/route.ts when a rewrite self-mark is saved. Add a deleteRewriteDraft helper scoped by user id.

3. No stale check in app/api/rewrite/draft/route.ts (T011, contracts/api.md). After the attempt is completed, or once the phase is already graded (a phase row exists, for phase 1; the phase row's status is final, for phase 2), write nothing and return 200 { "saved": false }. This matters because RewritePanel's pagehide/visibilitychange handler beacons BOTH phases' text whenever the page is hidden, including the already-submitted phase 1 sentence and an empty phase 2 box, which today creates or rewrites draft rows after grading. Also skip the beacon on the client for a phase that is already graded, and skip an empty draft for a phase that has never been saved.

4. The invalid attempt token returns 400; the contract says 401 { "error": "invalid_attempt_token" }. Make the draft route match the contract (leave the grade route as it is).

5. A draft is not restored on another device before phase 1 is graded (FR-038, FR-053, research R6 row "No phase row, server draft present"). app/unit/[unitId]/quiz/page.tsx does `if (!ph) continue;` before reading the draft, so a question with a server draft but no phase row resumes with an empty box. Read the draft for rewrite questions even when there is no phase row, and return a rewriteState entry that carries only phase1Draft (no key fields, stage discipline unchanged). Read the phase row and the draft for the attempt in one query each (all questions) rather than two queries per question.

6. Same-tab draft precedence. RewritePanel initialises text1 from `phase1Draft ?? loadRewriteDraft(...)`. The server draft is only saved on blur/page hide, so it can be older than the sessionStorage draft, which is written on every keystroke. Prefer the sessionStorage draft when it is non-empty, else the server draft (same for the retry box: sessionStorage, then phase2Draft, then the first-try sentence).

7. Constitution wording (T001). The Principle II bullet says the drafts are "stored in a phase row until the question is final". The drafts are in a separate draft row, and only until the question is final. Replace the bullet with the text in plan.md §Amendment (it says "stored in a phase row until the question is final and kept for the attempt detail page; and the student's in-progress draft text for each phase, stored in a draft row only until the question is final; all deleted with the student like results").

8. Missing tests marked done in tasks.md. Untick and complete:
   - T053: tests/api/rewrite-draft.test.ts does not exist. Cover: 401 without a session; 401 with another student's attempt token; 400 for a bad body; 404 for a question not in the attempt or not a rewrite question; 429 over DRAFT_RATE_LIMIT; 503 with the database down; the stale check (200 saved:false, nothing written); a second save for the same phase replaces the text (catches bug 1); an empty draft clears the column; the grade route deletes the row at final and the self-mark save deletes it; deleting the student removes the rows.
   - T035: tests/api/grade-rewrite.test.ts was not extended. Cover creditedSpans only for credited-and-found terms, phase2TermOutcomes and languageNote on phase 2, a reply without the new fields grading exactly as today, display_data written at phase 1 and extended at phase 2, and the 409 rewrite result carrying the stored display fields.
   - T045: tests/attempts/resume.test.ts was not extended. Cover the display data and drafts restored, the draft restored with no phase row (item 5), and no span, hint term, definition, model sentence or note before a phase 1 grade.
   - T050: add the new field names (creditedSpans, phase1CreditedSpans, phase2CreditedSpans, phase2TermOutcomes, languageNote) to the no-key-leak sweep.

Then run npm test, npm run lint, npx tsc --noEmit and npm run build through Git Bash (CLAUDE.md) and fix every failure. Tick the tasks again only when their tests exist and pass.
```

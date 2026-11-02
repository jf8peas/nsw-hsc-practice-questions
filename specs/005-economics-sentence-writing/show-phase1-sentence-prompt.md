# Prompt: show the phase 1 sentence at the retry, and remove Skip retry (spec 005)

Paste the block below into your agent as one message.

```text
Two changes to the sentence-rewrite question (specs/005-economics-sentence-writing). Read CLAUDE.md and spec.md (FR-042 was changed today) first. Do not search the repo: read these files with read_file: components/RewritePanel.tsx, components/Quiz.tsx (only the rewrite parts: the `rewrite` state, isPendingRewrite, grade(), skipRewrite(), rewriteSelfMark() and where <RewritePanel> is rendered), app/globals.css (the existing .label, .detail-answer, .feedback and .rewrite-* classes), tests/client/quiz-rewrite.test.tsx, app/api/grade/route.ts (handleRewriteGrade), lib/db/queries/rewrite-phases.server.ts and tests/api/grade-rewrite.test.ts.

PART 1: show the student's phase 1 sentence.

The problem: after phase 1 is marked under 3, the student sees the marker's feedback and the hint, but their own sentence has gone (the text box is cleared on submit). They cannot see what the feedback is about.

The change:
1. At the retry (phase 1 marked under 3, hint showing, no discussion yet), RewritePanel shows the student's phase 1 sentence, read-only, under a label "Your sentence", ABOVE the marker's feedback and the hint, so it reads: your sentence -> feedback (n / 3 marks) -> terms to use / what to fix -> the retry text box. The retry text box still starts empty.
2. The same applies when the attempt is resumed at the retry (Quiz already passes rewrite.phase1Answer from rewriteState; check it is set on that path).
3. On the self-mark screen (needsSelfMark, the degrade path), show the sentence being marked (the phase 1 sentence, or the phase 2 sentence when phase 2 fell back to self-marking) under "Your sentence", above the model sentence, so the student can compare the two before ticking.
4. The discussion is unchanged (it already shows "Your sentences").

Rules:
- For PART 1, use the phase1Answer / phase2Answer props RewritePanel already receives; do not send anything new from the server (the only route change in this task is PART 2's). Nothing from the answer key may appear earlier than it does now.
- Render the sentence as plain text (React's normal escaping); no dangerouslySetInnerHTML. Reuse the existing classes (.label for the heading, .detail-answer or a new .rewrite-own-sentence class in globals.css for the sentence). It must wrap at 390 px with no sideways scrolling.
- Keep all existing behaviour and tests passing.

PART 2: remove Skip retry. The retry is compulsory (spec.md FR-042, SC-009, changed 2026-11-02): once phase 1 scores under 3, the question is final only after a phase 2 rewrite is submitted, or the degrade path ends it. A student who leaves at the retry leaves the question unanswered, like any other unanswered question.
5. RewritePanel: remove the "Skip retry (keep n / 3)" button and the onSkip prop.
6. Quiz.tsx: remove skipRewrite() and the onSkip wiring.
7. app/api/grade/route.ts: a request with skip: true is refused with 400 {"error":"invalid_request"} before any grader call, slot or database write; the phase row stays phase1. Remove the skip branch and the skip case in the recorded-mark calculation; the recorded mark is now always the best of phase 1 and the capped phase 2 (or 3 for a 3/3 phase 1). Empty or whitespace-only answers stay refused in both phases (FR-041).
8. lib/db/queries/rewrite-phases.server.ts: delete finaliseRewritePhaseWithoutPhase2 if nothing else uses it.
9. Update the docs in specs/005-economics-sentence-writing/ that still describe skipping (plan.md Constitution Check row VI, data-model.md recorded_mark and the state diagram, contracts/ request fields and errors, quickstart.md) so they match FR-042. Do not edit spec.md (already updated) or tick/untick tasks.md.

Tests for PART 1: add to tests/client/quiz-rewrite.test.tsx:
- after a phase 1 under 3, "Your sentence" and the exact phase 1 sentence are shown, and appear before the hint in document order; the retry text box is empty;
- when resuming at the retry from rewriteState, the phase 1 sentence is shown;
- on the self-mark screen after a phase 1 model failure (needsSelfMark with a discussion and a selfMarkToken), the phase 1 sentence is shown;
- after a 3/3 phase 1 there is no separate "Your sentence" block outside the discussion.

Tests for PART 2:
- tests/client/quiz-rewrite.test.tsx: replace the "skipping the retry" test with one that checks there is no Skip button at the retry (resumed from rewriteState) and that "Next question" is not shown until phase 2 has been submitted.
- tests/api/grade-rewrite.test.ts: replace the skip test (phase 2, skip: true) with: 400 invalid_request, no grader call, no allowance slot, no results row, the phase row still phase1, and a normal phase 2 afterwards still works. Remove the skip step from the logging test (keep its other paths). Keep the best-of tests.

Run through Git Bash as CLAUDE.md describes: npx vitest run tests/client/quiz-rewrite.test.tsx, then npm test, npm run lint and npx tsc --noEmit. End with a short report of the files changed.
```

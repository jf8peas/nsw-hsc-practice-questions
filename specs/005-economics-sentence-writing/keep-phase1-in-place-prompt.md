# Prompt: keep the phase 1 sentence in place after marking (spec 005)

Paste the block below into your agent as one message.

```text
UI change to the sentence-rewrite question (specs/005-economics-sentence-writing). Read CLAUDE.md first. Do not search the repo: read these files with read_file: components/RewritePanel.tsx, components/Quiz.tsx (the short-answer type mode around the q-textarea, answer-bar and feedback blocks, plus the rewrite parts: the `rewrite` state, isPendingRewrite, grade(), rewriteSelfMark() and where <RewritePanel> is rendered), lib/drafts.ts (AttemptPayload.rewriteState), app/unit/[unitId]/quiz/page.tsx and the rewriteResumeState function it calls, lib/db/queries/rewrite-phases.server.ts (the phase row fields), app/globals.css (.q-textarea, .answer-bar, .feedback, .feedback-score, .rewrite-*), and tests/client/quiz-rewrite.test.tsx.

The problem: after phase 1 is submitted, the text box the student typed in is cleared and replaced by a new one, with "Your sentence" shown as separate text. This is jarring. A short-answer question does it better: after submitting, the same text box stays in place, disabled, still holding the answer; the submit bar goes; and the marking box (.feedback with "n / m marks" and the feedback) appears directly under it.

The change: make the rewrite question behave like a short answer, phase by phase, one block under the other. Top to bottom:
1. The phase 1 text box. Before submitting: editable, with the live counter and Submit answer, as now. After submitting: the SAME box stays in place, disabled, holding the phase 1 sentence; the submit button goes; keep a static word count under it ("17/25 words", with the over-limit note if it was over), because conciseness is a marking criterion.
2. Phase 1's marking box (.feedback): "n / 3 marks" and the marker's feedback, exactly the short-answer style, directly under the phase 1 box.
3. If phase 1 was under 3: the hint (terms to use, or what to fix), as now.
4. Then a NEW, empty text box for the retry, with the live counter and Submit retry. After submitting it also stays in place, disabled, with its sentence and static count, and phase 2's marking box appears under it. Label the two boxes "First try" and "Retry" only when there are two.
5. Then the discussion (unchanged), or the self-mark screen on the degrade path.

So phase 1's sentence, mark and feedback stay on screen after phase 2 is marked; nothing that was shown is replaced. Remove the separate "Your sentence" blocks added earlier (at the retry and on the self-mark screen): the disabled boxes now show the sentences. Keep the discussion's "Your sentences" list or drop it if it only repeats the boxes above it; say which you chose.

Phase 2's marking box shows the retry's mark (capped at 2). If the recorded mark differs because phase 1 was better (best-of, FR-019), add one line under it: "Your recorded mark is n / 3 (your better try)."

State: Quiz keeps one `result` for the rewrite question, so phase 2 overwrites phase 1. Keep phase 1's result (marks, feedback, hint) and phase 2's result separately, for example rewrite = { phase1Answer, phase1Result, phase2Answer?, phase2Result? }, and pass both to RewritePanel.

Resume: the boxes and marking boxes must look the same after a reload or on another device. The rewrite phase row already stores phase1Marks, phase1Feedback, phase2Marks, phase2Feedback and recordedMark. Extend rewriteResumeState / AttemptPayload.rewriteState to carry phase1Marks, phase1Feedback, phase2Marks and phase2Feedback (the marker's feedback is not answer-key material; FR-023 still holds: no definition, model sentence or marking note before phase 1 is graded, the hint only at the retry, the discussion only once final). Use them in Quiz's resume path instead of the empty feedback it builds now.

Rules:
- No change to the grade route, the self-mark route, marking or the database schema. The only server change is the resume state above.
- Disabled boxes use the textarea's disabled attribute as the short answer does, and must stay readable (check the existing disabled style; the text must not look greyed out to the point of being hard to read).
- Plain text only, no dangerouslySetInnerHTML. Must work at 390 px with no sideways scrolling.
- Keep all other behaviour, including no Skip button and no Next until the question is final.

Tests (tests/client/quiz-rewrite.test.tsx; update the tests that look for "Your sentence"):
- after a phase 1 under 3: the first text box is still there, disabled, with the phase 1 sentence as its value; the .feedback marking box with "n / 3 marks" is directly after it; then the hint; then a second, empty, enabled text box with Submit retry;
- after phase 2: both boxes are disabled with their sentences, both marking boxes are shown, phase 1's feedback text is still present, and the "recorded mark" line appears only when phase 1 was better;
- after a 3/3 phase 1: one disabled box with the sentence, its marking box, then the discussion, and no second box;
- resuming at the retry from rewriteState: the disabled phase 1 box, phase 1's marks and feedback, the hint and an empty retry box;
- resuming a final question: both boxes and both marking boxes;
- the self-mark screen: the disabled box with the sentence being marked, then the self-mark ticks.
Add a test for rewriteResumeState that it carries the feedback and marks but no answer-key fields before the stage allows them.

Run through Git Bash as CLAUDE.md describes: npx vitest run tests/client/quiz-rewrite.test.tsx, then npm test, npm run lint and npx tsc --noEmit. End with a short report of the files changed and the choice you made about the discussion's "Your sentences" list.
```

# Prompt: route tests for rewrite questions (spec 005)

Paste the block below into your agent (DeepSeek) as one message.

```text
Write route tests for the sentence-rewrite question type (specs/005-economics-sentence-writing). Read spec.md, contracts/ and data-model.md in that folder, CLAUDE.md, and .specify/memory/constitution.md first.

Why: there were no route tests for rewrite questions, so a real bug shipped. app/api/grade/route.ts read the phase with `body.phase === "2"`, but the quiz sends the number 2, so every phase 2 retry and every "Skip retry" was handled as a second phase 1 and refused with 409. It is now fixed to accept 2 or "2". The client side is covered by tests/client/quiz-rewrite.test.tsx; this task is the server side.

Code under test (read it, do not guess): app/api/grade/route.ts (handleRewriteGrade, rewriteResultFromRow), lib/grading.server.ts (gradeRewriteAnswer, rewriteTermConceptIds), lib/db/queries/rewrite-phases.server.ts, the rewrite_phases table in lib/db/schema.ts, app/api/results/self-mark/route.ts (the rewrite branch), lib/concepts/progress.ts, wherever rewriteState is built for resume, and content/units/y12-economics-sentence-writing/.

Follow the existing patterns exactly: tests/api/grade.test.ts, grade-photo.test.ts, grade-cap.test.ts, grade-outage.test.ts and self-mark.test.ts, the helpers in tests/helpers/ (setupRouteEnv, signedInStudent, startAttempt, post, allKeys), PGlite, and the way those tests stub the AI grader (scripts/fake-openrouter.ts or the existing mocks). Put the new tests in tests/api/grade-rewrite.test.ts (and tests/api/self-mark-rewrite.test.ts if that is cleaner). Use a fixture unit or the real y12-economics-sentence-writing unit, whichever the existing helpers make simpler. The stubbed grader must let each test choose the marks and the per-term status (used / missing / misused).

Cover each of these, one `it` per line unless two are trivially one:

Phase 1
1. 3/3: 200, a results row with marks 3 and max 3, the phase row final, the response has the discussion and no hint.
2. Under 3: no results row yet, a phase row with status phase1, the response hint lists only the missed or misused terms with their definitions, and the response contains no model sentence, no discussion and no marking notes anywhere (check every key with allKeys, as the no-key-leak tests do).
3. Every term used but criterion (c) lost: the hint has no terms and carries the lost criterion and its text (FR-045).
4. Criterion (b) is all or nothing: one missing term out of two loses the mark.
5. Over 25 words (counted with lib/wordcount): criterion (c) is lost whatever the stubbed grader says.
6. Empty and whitespace-only answers: 400, no grader call, no allowance slot used.
7. A second phase 1 for the same question: 409, no second grader call and no second daily-allowance slot.

Phase 2
8. Regression: phase sent as the number 2 and as the string "2" are both treated as phase 2.
9. Phase 2 is capped at 2 even when the grader returns 3.
10. The recorded mark is the best of the two: phase 1 = 2 and phase 2 = 1 records 2; phase 1 = 1 and phase 2 = 2 records 2.
11. Phase 2 creates the results row, sets the phase row final, returns the discussion, and completes the attempt when it was the last question.
12. Phase 2 is refused with no phase 1 row, after a 3/3 phase 1, and after a final phase 2 (409 with the stored result).
13. Skip (phase 2, skip: true, empty answer): a results row with the phase 1 mark, no grader call, no allowance slot, the attempt completes when last.

Concepts
14. Term outcomes come from phase 1 only: a term missed in phase 1 but used in phase 2 still counts as wrong in the student's concept progress, and a term used in phase 1 counts as correct.
15. Existing units' concept progress is unchanged by the new code (one short check on an existing unit).

Degrade and self-mark
16. Model failure in phase 1, and the daily allowance used up: needsSelfMark, a self-mark token, the discussion (model sentence and every term with its definition) and no hint; a phase 2 request afterwards is refused.
17. The self-mark route with per-criterion and per-term ticks saves the result with the marks they add up to, and the term outcomes from the ticks feed concept progress; a forged or other-student token, or ticks for terms the question does not have, are rejected.
18. Model failure in phase 2: what is recorded matches spec.md and research.md (the best-of rule still applies).
19. Database down (as in grade-outage.test.ts): the rewrite grade still answers without a 500.

Resume and leaks
20. The resume state (rewriteState) holds nothing from the answer key before phase 1 is graded, only the hint after a phase 1 under 3, and the discussion once final.

Logging
21. No answer text, model sentence, definition or marking note reaches console output on any of the paths above (spy on console as the photo compliance tests do).

Rules
- Tests only. If a test fails because the app is wrong (not the test), keep the failing test, make the smallest fix in the app code, and list every app change in your final report with the test that exposed it. Do not change any other behaviour, and do not weaken a test to make it pass.
- Do not edit spec.md, plan.md or tasks.md.
- Run commands through Git Bash as CLAUDE.md describes. Finish with the full suite, lint and type check all passing: npm test, npm run lint, npx tsc --noEmit.
- Final report: the test files added, the number of tests, any app bugs found and fixed, and anything from the list you could not cover and why.
```

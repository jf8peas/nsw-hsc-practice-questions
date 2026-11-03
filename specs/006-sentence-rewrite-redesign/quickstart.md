# Quickstart: Sentence Rewrite Question Redesign

A validation guide for the redesigned rewrite question (spec 006). It proves the feature works
end-to-end — the five card states, the new grading data, persistence and resume — before
implementation is signed off. Shapes and statuses are defined in [`contracts/api.md`](contracts/api.md)
and [`data-model.md`](data-model.md); this file only tells you what to click and what to expect.

## Prerequisites

- `.env.local` with `DATABASE_URL`, `AUTH_SECRET`, `OPENROUTER_API_KEY=local-test`,
  `OPENROUTER_BASE_URL=http://localhost:4010/v1/chat/completions` (ignored in production).
- Migration applied: `npm run db:migrate` (deploys run it on `vercel-build` too).
- The fake model server running:
  ```bash
  npm run fake-openrouter   # defaults FAKE_REWRITE=pass; see below for the other modes
  ```

## Manual check — phone, 390 px, all five states

Open the app on a real phone (dev tools device mode at 390 px is a good approximation), sign in,
start the **Sentence Writing** attempt (`y12-economics-sentence-writing`), and work through one
question at a time. Pause between states and compare against `mockups/1-writing-phone.png` …
`mockups/5-result-phone.png`.

1. **State 1 — writing.** The tracker shows Write / Retry with hints / Compare (1 current, 2-3
   future), the PLAIN ENGLISH block, the box with placeholder "Write your sentence here…", the
   live "12 / 25 words" meter, "Submit for marking", and the line "Miss a term? You'll get one
   retry with hints, worth up to 2 marks." Type more than 25 words and confirm the meter turns
   warning-coloured with "· over the limit — you lose the conciseness mark" and the button stays
   enabled.
2. **A 3/3 answer.** Type a sentence that uses every target term correctly and submit. The card
   moves to marking (see 4), then straight to the **result**: the tracker shows "Write · 3/3" then
   "Compare", no hint, no retry; the summary reads "Full marks on your first try." with the
   feedback; "YOUR SENTENCE" shows every credited term highlighted (weight 600 + tint, not colour
   alone) beside "MODEL SENTENCE" with the terms in bold and the "14 words — …" style commentary;
   the term table shows every term "First try"; the first try is hidden; "Next question" advances.
3. **A hinted retry reaching 2.** Restart; submit a sentence that misses a term (with
   `FAKE_REWRITE=partial` the first listed term is "missing"). In **state 3** confirm: "FIRST
   TRY · n/3" with the feedback, "Your first try" with only the credited terms highlighted
   (missed terms unmarked), the hint headed "Use these terms in your retry" — one card per missed/
   misused term, term + definition only, **no "replaces …" line and no plain-English mapping**, and
   the PLAIN ENGLISH sentence never highlighted. The retry box is pre-filled with the first-try
   sentence, focused, cursor at the end (desktop). Add the missing term and "Submit retry". The
   result summary reads "Full marks for a retry — all three terms used." (or "both terms used" /
   "the term used") with "A retry can earn at most 2. Use every term on the first try next time
   for the full 3."; the term table mixes "First try" and "Added in retry"; the first try is one
   closed row "FIRST TRY · 2/3".
4. **A reload during marking.** Submit a sentence, and while the status list is ticking, reload
   the page. The question must resume at the graded state (never a marking state): feedback +
   retry if phase 1 scored under 3, the result if it did not. Nothing typed is lost: with a
   half-typed retry, reload restores the retry box content (same-tab via sessionStorage).
5. **A retry scoring lower than phase 1.** With phase 1 at 2 and the retry at 1, the result shows
   the retry feedback plus "Your recorded mark is 2 / 3 (your better try)." (the real phase 1
   mark), and the recorded mark is 2.
6. **The "What to fix" hint.** Submit a sentence that uses every term correctly but exceeds 25
   words. Phase 1 scores 2 and the hint is headed "What to fix" with a single criterion card,
   "Cut your sentence to 25 words or fewer." The marking-retry screen (submit the retry) shows
   the row "You were asked to fix:" with one "Conciseness" pill and the status "Checking your
   sentence…".
7. **Self-mark with the model off.** Stop the fake server (or set `FAKE_REWRITE=down` and
   restart). Submit a rewrite; the question degrades: the locked sentence with the word count, the
   model-sentence card, the term table **without** status pills, a checkbox per term row and for
   criteria (a) and (c), and "Save my mark". The tracker shows "Write" then "Mark it yourself".
   No phase 2.
8. **Resume on another device at feedback + retry with a half-edited retry.** On device A, score
   under 3 in phase 1 and type a partial retry, then leave the question (blur the box — the
   draft beacon fires; switching apps fires the visibility-change beacon). On device B, open the
   same attempt: it resumes at feedback + retry with the hint, and the retry box holds the
   half-edited retry (falling back to the first-try sentence if the draft was not saved). A
   completed result, opened on device B, shows the full result: highlights, term-table statuses
   and the language note (type "fromm" in the retry with `FAKE_REWRITE=pass` to see the
   "Spelling: fromm → from." wavy-underline note) — the persisted display data restores.

## Automated suite

Run everything through Git Bash exactly as CLAUDE.md describes (fill in secrets from `.env.local`):

```bash
cd /c/Users/johnf/Git/nsw-hsc-practice-questions

# content validation (also runs in prebuild)
npm run validate

# the full Vitest suite — this feature's tests are among them:
#   tests/api/grade-rewrite.test.ts, tests/api/self-mark-rewrite.test.ts,
#   tests/client/quiz-rewrite.test.tsx, tests/attempts/resume.test.ts,
#   tests/no-key-leak.test.ts, tests/concepts/progress*.test.ts
npm test

# lint, type check and a production build (build runs gen:formulas + validate)
npm run lint
npx tsc --noEmit
npm run build
```

Expected outcomes that gate the feature (from the spec's Testing requirements / FR-045 to
FR-052, FR-055 and the quality gates):

- the submitted sentence stays visible in the locked block and the box is never cleared while
  marking, both phases; a forced grading error returns an editable box holding the same text;
- the retry box starts pre-filled with the first-try sentence;
- the hint never contains a plain-English mapping and the plain-English sentence is never
  highlighted;
- the four outcome lines (3/3 first try, capped retry at 2, retry below 2, phase 1 beating
  phase 2) and the one/two/three-term wording render as specified;
- term statuses come from the phase outcomes — a term correct in phase 1 and dropped in phase 2
  stays "First try"; a span not found in the sentence is not highlighted; a reply without the new
  fields grades exactly as today;
- concept results still come from phase 1 only, and phase 2 outcomes never reach progress or the
  draw; each question still uses at most two grading calls;
- no key field appears in any response or payload before the phase 1 grade, including on resume
  (`allKeys` checks in the route tests and the no-key-leak suite);
- resume restores each state with the draft and the display data (FR-055); the self-mark screen
  uses the new layout; the live region and the result-summary focus work; reduced motion stops the
  bar/spinners (component test with `prefers-reduced-motion`);
- the existing rewrite tests updated to the new wording pass alongside the new ones.

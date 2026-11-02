# Quickstart: Economics Sentence Writing

A manual validation guide for the Writing Practice unit. It proves the feature end to end on a
phone at 390 px and under every failure mode. Implementation details live in `tasks.md`; the
request/response shapes are in `contracts/api.md` and the schema in `data-model.md`.

## Prerequisites

- The unit `y12-economics-sentence-writing` exists in content with at least a few rewrite
  questions (the full ~60-question bank is a later content task; a handful is enough to validate).
- Local database migrated (`npm run db:migrate`), dev login available (`NODE_ENV !== "production"`).
- For the AI-marked paths: `OPENROUTER_API_KEY` set, or the fake model server (below).

### The fake model server

`scripts/fake-openrouter.ts` is extended to answer the rewrite grader. Run it in one terminal:

```bash
FAKE_REWRITE=pass npx tsx scripts/fake-openrouter.ts
```

and in `.env.local`:

```
OPENROUTER_API_KEY=local-test
OPENROUTER_BASE_URL=http://localhost:4010/v1/chat/completions   # ignored in production
```

`FAKE_REWRITE` modes: `pass` (every rewrite grades 3/3, all terms used), `partial` (criterion A
kept, one term missing — drives the hint), `fail` (every call answers HTTP 500 — drives the
degrade path), `down` (HTTP 503). The fake grader never returns a real sentence, so nothing leaks.

## Automated checks (run first, through Git Bash)

CLAUDE.md requires all shell commands through Git Bash:

```bash
& 'C:\Program Files\Git\bin\bash.exe' -c 'cd /c/Users/johnf/Git/nsw-hsc-practice-questions && npm run validate && npm run lint && npx tsc --noEmit && npm test 2>&1 | tail -30'
```

Expected: content validation passes (including the new rewrite rules: every rewrite question has a
model sentence and 1-3 target terms each with a definition, every target term is a concept of the
unit, every concept appears in at least 4 questions); lint clean; type check clean; the full Vitest
suite passes, including the new rewrite tests (criterion (b) all or nothing; a 3/3 phase 1 skips
phase 2; phase 2 capped at 2; recorded mark is the best of the two; the hint holds only missed or
misused terms, or no terms and the lost criterion; no key field reaches the browser before a phase
1 grade, including on resume; phase 2 refused unless phase 1 was graded below 3; one slot per phase
under double taps; concept results from phase 1 only, and from self-mark ticks; existing units'
progress unchanged; the word counter gives the same count on client and server; content validation
of the new type; no sentence or definition in any log).

Then `npm run build` (runs `gen:formulas` and `validate`).

## Manual checks on a real phone (390 px, no sideways scrolling)

Sign in with the dev login, open the unit page, and confirm: the type pill says "Writing Practice",
the guide explains the two phases and the 3-mark criteria, and "Start quiz" is reachable without
scrolling past the guide. Start an attempt (5 questions).

1. **A 3/3 answer.** Type a rewrite that keeps the meaning and uses every target term, under 25
   words. The live counter shows the count. Submit. Confirm: 3/3, the discussion appears (model
   sentence, each term with its definition and why it fits, your sentence, the feedback), and there
   is no hint and no retry.
2. **A hinted retry.** On the next question, write a rewrite that misses one target term. Submit.
   Confirm: a mark under 3, the hint lists only the missed term with its one-line definition, and
   the phase 1 feedback is shown. Rewrite once more using the term. Confirm the phase 2 mark is
   capped at 2 and the discussion follows. There is no third try.
3. **All terms but too long.** Write a rewrite that uses every target term but is over 25 words.
   Confirm submission is not blocked, the counter shows the over-limit count, the conciseness mark
   is lost, and the hint lists no terms — only the lost criterion in the marker's words (FR-045).
4. **Resume at phase 2 on another device.** Reach phase 2 of a question (hint showing), leave the
   attempt, and open the same attempt on a second device (or a fresh browser profile). Confirm the
   question resumes at phase 2 with the hint showing and the phase 1 sentence intact. Complete it
   and confirm both sentences and both marks are saved.
5. **The discussion and the attempt page.** After finishing a question, confirm the discussion
   shows the model sentence, every term with its definition and why it fits, your phase 1 sentence
   (and phase 2 sentence, if any) and the feedback. Finish the attempt and open it from the unit
   page history: confirm the attempt detail shows both sentences and both marks, the feedback and
   the per-term outcomes — and no model sentence.
6. **Concepts to review.** Miss a term in phase 1 but use it correctly in phase 2. Open the unit
   page: the term appears in "Concepts to review" with its definition. Use it correctly in phase 1
   across three later questions and confirm it clears.

## Failure modes

- **Model off** (`FAKE_REWRITE=fail` or no `OPENROUTER_API_KEY`): submit a phase 1 rewrite. Confirm
  the self-mark screen shows the model sentence and every target term with its definition, asks for
  each criterion with one tick per term, and there is no phase 2. Tick the terms and confirm the
  result saves with per-term concept outcomes.
- **Allowance used up** (`LLM_DAILY_CAP=0`): submit a rewrite. Confirm it degrades to self-marking
  with the "AI marking returns at midnight" notice, exactly as short answers do.
- **Database down** (stop the local database): start an attempt and submit a rewrite. Confirm the
  question degrades to self-marking with the existing notice, no error, and the result is queued as
  a receipt and saved when the database returns.

## What "done" looks like

- All automated checks pass.
- Every manual check above behaves as described at 390 px with no sideways scrolling.
- No target term, definition, model sentence or marking note is visible in the browser before a
  phase 1 grade (inspect the network tab on the quiz page and on resume).
- No sentence or definition appears in the server logs.

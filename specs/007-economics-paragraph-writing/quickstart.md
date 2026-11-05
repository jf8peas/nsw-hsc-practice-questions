# Quickstart: Economics Paragraph Writing

Manual validation for [plan.md](plan.md). Run it after the tasks are done, on a preview deploy or
`npm run dev` with a branch database. Shell commands go through Git Bash as `CLAUDE.md` requires; from
the agent's PowerShell tool wrap them:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' -c 'cd /c/Users/johnf/Git/nsw-hsc-practice-questions && npm test 2>&1 | tail -20'
```

Inside a Git Bash window the same commands run directly. Keep the payload in single quotes with no
inner double quotes. Scratch scripts go in `.cline/`.

## 0. Automated gates (all must pass)

```bash
cd /c/Users/johnf/Git/nsw-hsc-practice-questions
npm run validate          # includes the paragraph rules: five parts, word limits, counterpoint anchors, no placeholders
npx tsc --noEmit          # type check
npm run lint
npm test                  # full Vitest suite, including tests/paragraph/*, tests/no-key-leak.test.ts, tests/api/grade-paragraph.test.ts
npm run build             # runs prebuild: gen:formulas + validate
npm run validate:shipped  # only after a deliberate content change; records the shipped ids (Principle III)
```

Marker prompt and regression (needs `OPENROUTER_API_KEY` in `.env.local` or the environment):

```bash
python scripts/pilot-paragraph-marker.py --check      # offline: data, word limits, and the rendered prompt equals tests/fixtures/paragraph-prompt.golden.txt
python scripts/pilot-paragraph-marker.py --runs 1 --gate   # one run over EVERY case; prints tuning, holdout and field agreement separately; exits non-zero below 90 % / 80 %
```

Expected: the report header shows the prompt version from `lib/paragraph/rubric.json`
(`round 5 (4 Nov 2026)` at launch); the same prompt text is what the app sends (the golden test).

## 1. Setup

1. `npm run db:migrate` against a branch database (adds `paragraph_phases` and the partial unique
   index).
2. Start the fake model for repeatable verdicts, in a second terminal:
   `FAKE_PARAGRAPH=pass npm run fake-openrouter`, and in `.env.local` set
   `OPENROUTER_BASE_URL=http://localhost:4010/v1/chat/completions`, `OPENROUTER_API_KEY=fake`.
   (For the real-model pass at the end, remove those two lines.) The fake honours a directive in the
   student's text: `[met:abd]` means criteria a, b, d met and c not met; no directive means all met.
3. Sign in with the dev login. Open the unit "Writing economics paragraphs".

## 2. Whole essay on a real phone at 390 px

Use a real phone (or devtools at 390 px as a fallback, but the real-phone pass is the check). The
page must never scroll sideways on any screen below.

| Step | Do | Expect |
|---|---|---|
| 1 | Unit page, new student | "Essay 1 of N · next: Topic Sentence", five grey dots, button "Start essay (Part 1 of 5)", exam row "In n days · Year 12 Economics Assessment Task 1" |
| 2 | Start | Essay progress bar with 5 labelled parts, Topic current; pill "Paragraph writing · 4 marks" and "Essay 1 · Part 1 of 5"; essay question with the verb highlighted **and bold** plus its definition; four "What this part must do" lines; brief table with Argument and Counterpoint rows marked "Use in this part"; slot "1 · Topic Sentence — you write this below"; text box |
| 3 | Type 20 words, then paste past 40 | Meter turns to the over state at 41; the button still works |
| 4 | **Part 1, 4/4 first try**: text `[met:abcd]` within 40 words, Submit | Locked block with word count; three status steps (the second ticks after about 1.5 s); no layout jump; goes straight to the discussion; summary focused; "Full marks on your first try."; tracker "Write · 4/4 → Discuss"; model so far shows only part 1 highlighted and chips "2 · MECHANISM — NEXT QUIZ", "3 · EVIDENCE — QUIZ AFTER", then "IN 3 QUIZZES", "IN 4 QUIZZES"; no tips added; no first-try row; "Finish" reads "Next quiz: Part 2 of 5, Theoretical Mechanism" |
| 5 | Finish | Unit page: "Essay 1 of N · next: Theoretical Mechanism", dot 1 green with "4/4", dot 2 blue "next", button "Continue essay (Part 2 of 5)" |
| 6 | **Part 2, a correction reaching 3**: first try `[met:ab]` | Result "2 / 4" with ✓/✗ (each with the accessible name Met/Not met) and a reason line each; tip cards for exactly the two lost criteria, each with name, tip and the generic application line, **no model sentence**; correction box pre-filled with the first try, focused, caret at the end; model so far shows part 1 only (never part 2's model yet) |
| 7 | Edit to `[met:abcd]`, Submit correction | Marking screen "Correction is worth up to 3 marks."; discussion summary "3 / 4 marks" with "Full marks for a correction — every criterion met." and "A correction can earn at most 3…"; pills: a, b "First try", c, d "Fixed in correction"; final text beside "MODEL THEORETICAL MECHANISM" with a word count and commentary; model paragraph through part 2; "Added to Things I need to know" lists the two tips missed in phase 1, each "2 to go"; first try collapsed |
| 8 | **Part 3, a correction scoring lower than the first try**: first `[met:abc]` (3/4), correction `[met:a]` | Summary says "Your recorded mark is 3 / 4 (your better try)."; recorded 3 |
| 9 | **Part 4, over-limit answer**: 95 words, `[met:abcd]` | Result 3/4: (d) not met with "Over the 90-word limit (95 words)."; submission was never blocked; tip for conciseness added |
| 10 | Part 5, then Finish | After the Link the footer reads "Next quiz: Essay 2, Part 1 of 5, Topic Sentence"; unit page shows "Essay 2 of N · next: Topic Sentence", button "Start essay (Part 1 of 5)"; essay 1's dots are gone (only one essay in progress) |

Also check at 390 px: the brief table stacks label above text; the "beside" cards stack; every button and
row you tap is at least 44 px tall; text zoom 200 % still wraps.

## 3. Failure and resume checks

| Check | Do | Expect |
|---|---|---|
| Reload during marking | Submit, then reload at once | Quiz reopens on the writing screen (or the correction) holding your text; no marking state restored; one slot used at most (see `daily_ai_usage`) |
| Resume on another device mid-correction | Get a 2/4 on a part, open the same attempt URL on a second browser | Correction screen with the tip cards and the saved correction draft (else the first try); no model text |
| Two tabs start at once | Open the unit page in two tabs, press the start button in both | Both land on the same attempt id; one attempt row |
| Part left unfinished | Abandon on the correction, open the unit page | Button still "Continue essay (Part N of 5)", same attempt, same part |
| Self-mark, model off | Remove `OPENROUTER_API_KEY` (or `LLM_DAILY_CAP=0`), submit a part | No error; locked text, the model part and four tick boxes with their guidance lines; "Save my mark" gives the number of ticks; no correction step; unticked criteria's tips added; the flag button is absent |
| FR-019a, cap set to 1 | `LLM_DAILY_CAP=1`; part A scores under 4 (uses the one slot); submit the correction | No error; discussion with the first-try mark recorded, criteria ✓/✗ without pills, tip cards "Work on these next", no correction box; summary "Your first try is recorded…" |
| FR-019a, marker down | `FAKE_PARAGRAPH=down` after a first try under 4, submit the correction | Same as above |
| 429 / offline | Turn off the network and submit | Box returns holding your text with the usual error; nothing recorded |
| Flag twice | On a marker-marked discussion press "This mark seems wrong", reload, press again | First press: button becomes "Flagged for your teacher" and the mark is unchanged; second: same state, one `flagged_at` in `paragraph_phases` |
| After the Link | Finish part 5 | Unit page shows the next essay; if the bank is exhausted, "You've finished every essay so far. New essays are added as they're written." and no start button |
| Database unreadable | Break `DATABASE_URL` | Unit page shows "We can't load your place in the essay right now. Try again in a moment." and no start button |
| Tips clear | Meet a part tip's criterion on first try in two later essays | The tip leaves "Things I need to know" after the second; an all-parts tip after the third |
| Past attempt | Open a finished part from Past attempts | "Essay 2 · Theoretical Mechanism": texts, marks, ✓/✗ with reasons, feedback; no model text, no brief |

## 4. Revision loop (offline)

```bash
npm run paragraph-flags -- list                      # flagged answers, newest first
npm run paragraph-flags -- export 3 5                # appends field cases (needsLabel: true) to resources/topic010/pilot-essays.json
# edit the "fails" list of each exported case to the correct label and set needsLabel to false
REMARK_MODEL=<a model stronger than GRADING_MODEL> npm run paragraph-remark -- --sample 40   # leniency patterns reported first
python scripts/pilot-paragraph-marker.py --gate      # whole file: tuning, holdout, field, each reported separately
```

Expected: exported cases hold no name, email, user id, attempt id or date; the India held-out set is
still present and unchanged; after any edit to `lib/paragraph/rubric.json` the prompt version in the
report header is the new one and `tests/fixtures/paragraph-prompt.golden.txt` has been regenerated.

## 5. Real-model pass

With the real `GRADING_MODEL`, write one genuinely good and one deliberately weak answer for each of
the five parts of essay 1. Expect the good ones to reach 4/4 on the first try (note any that do not:
they become field cases) and each weak answer to lose the criterion it was written to lose, with a
reason line that quotes or names the fault and gives no model wording. Check the server logs for the
run contain only `[paragraph] outcome=… user=<hash> question=… phase=… duration_ms=…` lines.

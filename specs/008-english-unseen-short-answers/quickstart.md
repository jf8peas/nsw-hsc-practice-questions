# Quickstart: Advanced English Unseen-Text Short Answers

Manual validation for [plan.md](plan.md). Run it after the tasks are done, on a preview deploy or
`npm run dev` with a branch database. Shell commands go through Git Bash as `CLAUDE.md` requires; from the
agent's PowerShell tool wrap them:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' -c 'cd /c/Users/johnf/Git/nsw-hsc-practice-questions && npm test 2>&1 | tail -20'
```

Inside a Git Bash window the same commands run directly. Keep the payload in single quotes with no inner
double quotes. Scratch scripts go in `.cline/`.

## 0. Automated gates (all must pass)

```bash
cd /c/Users/johnf/Git/nsw-hsc-practice-questions
npm run validate          # includes the unseen rules: source, text id, tags, criteria, model, suggested length, visual check
npx tsc --noEmit          # type check
npm run lint
npm test                  # full Vitest suite, including tests/unseen/*, tests/no-key-leak.test.ts, tests/api/*unseen*
npm run build             # runs prebuild: gen:formulas + validate; then confirm no key text in .next/static (step 6)
npm run validate:shipped  # only after a deliberate content change; records the shipped ids (Principle III)
```

Marker prompt and regression (needs `OPENROUTER_API_KEY` in `.env.local` or the environment):

```bash
python scripts/pilot-unseen-marker.py --check          # offline: data, word counts, and the rendered prompt equals tests/fixtures/unseen-prompt.golden.txt
python scripts/pilot-unseen-marker.py --runs 3 --gate  # EVERY case, all sets; prints tuning, holdout and field separately; exits non-zero under 90 % tuning / 80 % holdout or any case more than 1 mark out
```

Expected: the report header shows the prompt version from `lib/unseen/rubric.json` (`unseen-pilot-5` at
launch); the same prompt text is what the app sends (the golden test); tuning about 23/24 and holdout about
19/20 in range, all within 1 (the pilot's recorded results); the "echoes the model answer" count is 0 or
near 0; the holdout section carries the line "not for tuning".

## 1. Setup

1. `npm run db:migrate` against a branch database (adds `unseen_phases` and the partial unique index).
2. Start the fake model for repeatable replies, in a second terminal:
   `FAKE_UNSEEN=pass npm run fake-openrouter`, and in `.env.local` set
   `OPENROUTER_BASE_URL=http://localhost:4010/v1/chat/completions`, `OPENROUTER_API_KEY=fake`. For the
   real-model pass (step 7) remove those two lines. The fake honours a directive in the student's text:
   `[mark:2]` sets the mark and `[miss:technique-effect,apt-evidence]` sets the missed skills; no directive
   in `pass` means full marks and every skill met, in `partial` means 2 and `technique-effect` missed. Pad
   the text to at least 20 words.
3. Sign in with the dev login. The starter bank is five questions (a poem, two prose texts, a non-fiction
   text, one visual), which is also the small bank for the Repeats row of the failure-path table.
4. Open the unit "Unseen texts: short answers". The exam row reads "In n days · Year 12 Advanced English
   Task 1" (7 Dec 2026).

## 2. One quiz on a real phone at 390 px

Use a real phone (devtools at 390 px is a fallback; the real-phone pass is the check). The page must never
scroll sideways on any screen below.

| Step | Do | Expect |
|---|---|---|
| 1 | Unit page, new student | button "Start a question"; "Things I need to know" shows "All clear"; "Your results" lists the forms in the bank, each "Not tried yet" |
| 2 | Start; get a **poem** | the text is first, headed "Text 1 – Poem", with title, author and source line; stanza and line breaks kept; line numbers where the paper has them; the footnote line; below it the question, "3 marks", the credit "Fort St 2025 Trial, Q1", and the answer box with the meter "0 / 204 words" and a **View Text 1** button next to Submit (its accessible name is "View Text 1 – Poem"); no timer anywhere |
| 3 | Scroll to the box, tap **View Text 1** | the text opens in a dialog titled "Text 1 – Poem" over the page, scrolls, closes with Close and Esc, and the typed text and scroll position are unchanged |
| 4 | Type 10 words | Submit is disabled with "Write at least 20 words before you submit." |
| 5 | Paste a 260-word answer (suggested 204) | at 205 to 244 words the meter warns ("N words over the suggested length") and Submit works; at 245 words Submit is disabled with "N words over the limit. Cut it to submit."; cut to 240 and submit still works |
| 6 | **Full-mark first try**: 150 words, `[mark:3]`, all met | locked answer with three status steps (the second ticks after about 1.5 s); no layout jump; goes straight to the discussion; the summary is focused; "Full marks on your first try."; seven skill verdicts each marked "First try" with an icon as well as colour; the final answer beside the model answer (stacked on the phone); no skills added; the first-try row is absent; a green **"Make it even stronger"** panel after the seven skill pills and before the answer comparison (one sentence; 4 px green left border, light green tint, bold green heading, no red or warning colour; at 390 px it fills the card width with no sideways scroll); Finish |
| 7 | Finish, start again; get a **prose** text | same layout without line numbers; paragraphs kept |
| 8 | **A retry that is capped**: `[mark:2][miss:technique-effect,apt-evidence]` on a 4-mark question | result "2 / 4" with feedback, the biggest-gap line and seven verdicts (Met / Missed with icons and a reason each); "Try again" and "Skip the retry and see the model answer"; no model answer yet |
| 9 | Tap "Try again" | the box holds the first try, focused with the caret at the end; one tip card for each of the two missed skills with its name and tip, **no model text**; the meter works |
| 10 | Edit to `[mark:4]`, all met, and submit | marking screen; discussion summary "3 / 4 marks" with "A retry can earn at most 3 out of 4. Meet every skill on the first try next time for the full 4."; pills: the two skills "Fixed in retry", the rest "First try"; the final answer beside the model answer; "Added to Things I need to know" lists the two skills missed on the **first** try, each "2 to go"; the first try is collapsed; no flag button |
| 11 | **A retry declined**: next question, `[mark:1]` on a 3-mark question, then "Skip the retry…" | straight to the discussion; "You skipped the retry, so your first try is recorded: 1 / 3."; recorded 1; the model answer shown |
| 12 | **A visual text** (zoom) | the image fills the column width with a "Zoom" button; Zoom opens a dialog; "Zoom in" steps the image larger and it scrolls both ways; pinch also works; Close and Esc return focus to the Zoom button; the page itself never scrolls sideways; the image alt is the short label, **not** the description |
| 13 | Answer the visual question and open the Network tab | `GET /api/unseen/image/<id>` is 200 with the session; the page, start response and grade response contain no description, criteria or notes |

Also at 390 px: the layout is one column (text, question, answer), the compare cards stack, every button and summary row is at least
44 px tall, text zoom at 200% still wraps.

### 2b. The same quiz on a desktop

Open the same questions in a desktop browser at about 1280 px wide (and once narrower than 900 px). The
layout is the same single column at every width:

| Step | Do | Expect |
|---|---|---|
| 1 | A **poem** and a **prose** text | the text panel comes first at the full card width, then the question block, then the answer box; the lines of prose, poem and footnotes stop at a comfortable reading width and do not run across the whole card |
| 2 | The **visual** text | the image fills the full card width and is shown large; **Zoom** still opens the dialog with Zoom in, Zoom out and Close |
| 3 | Look for a second column | there is none: the text is not beside the question and nothing is sticky; resizing across 900 px changes nothing about the card |
| 4 | Click **View Text 1** in the answer footer | the text opens in the dialog, titled with the full heading, at this width too; the typed answer and scroll position are untouched; Close returns focus to the button |

## 3. Failure and resume checks

| Check | Do | Expect |
|---|---|---|
| Reload during marking | Submit, then reload at once | the quiz reopens on the writing screen holding your text (the server saved it as a draft, or marking finished and the result shows); no marking state restored; at most one slot used (see `daily_ai_usage`) |
| Resume on another device at the retry choice | Get a below-full first try, open the same attempt URL in a second browser | the first-try result with the retry choice; no model answer |
| Resume mid-retry | Start a retry, type, leave, return | the retry box with the saved text and the tip cards |
| Two tabs start at once | Open the unit page in two tabs, press Start in both | both land on the same attempt; one attempt row |
| Unfinished question | Abandon at the retry choice, open the unit page | the button reads "Continue question" and names the question; the next quiz is that question, not a new one |
| **Marker off, first try** | `FAKE_UNSEEN=down` (restart the fake), submit | the text stays locked with the steps, then the box returns holding your text with "We couldn't mark your answer just now. It's still here, so try again in a moment."; no mark, no model answer, no tick boxes, no self-mark; one slot **not** used |
| **Marker off, retry** | after a below-full first try, `FAKE_UNSEEN=down`, submit the retry | the same notice on the retry box with your text; the first-try mark is **not** recorded; "Skip the retry…" still works and records the first try |
| Marker says empty, cut off, missing a field | `FAKE_UNSEEN=empty`, then `cutoff`, then `missing` | each behaves as marker off after one retry; `FAKE_UNSEEN=pass` then marks normally |
| Marker echoes the model answer | `FAKE_UNSEEN=echo` | treated as unavailable (the guard); the notice, no mark |
| **Daily limit, first try** | `LLM_DAILY_CAP=1`; mark one question, finish it; start the next and submit | "You've reached today's marking limit. Come back tomorrow (from midnight Sydney time, …)"; your text stays; Submit is disabled with that note; reload the same evening: still disabled; the question is the one offered next |
| **Daily limit, retry** | `LLM_DAILY_CAP=1`; get a below-full first try (uses the slot); try again and submit | the same limit notice on the retry box; your retry text stays; Submit disabled; "Skip the retry…" works; the next day (or `reserveAiSlot` with another date in a test) the question resumes at the retry |
| 429 / offline | Turn off the network and submit | the box returns holding your text with the usual one-line error; nothing recorded |
| No flag | Open a discussion | there is no "This mark seems wrong" button, and `POST /api/unseen/flag` answers 404 (the route does not exist); `unseen_phases` has no `flagged_at` column |
| Repeats | Answer every question of the starter bank, then press Start again | no "finished" stop: the unit page says "You've answered every question. Questions now repeat, starting with the ones you found hardest." and the button stays; the next quiz is a question you did not answer in your last 3 quizzes (with the 5-question starter bank, one of the first two you answered), the quiz shows the same line above the question, it is marked, retried and discussed as usual, a new row appears in Past attempts (the earlier attempt is unchanged), and Results by text form uses each question's latest mark |
| Database unreadable | Break `DATABASE_URL` | the unit page shows "We can't load your questions right now. Try again in a moment." and no start button; a submit mid-quiz returns the box with your text and the usual error; nothing is marked or self-marked |
| Skills clear | Meet a skill on a first try on two later questions | it leaves "Things I need to know" after the second; a skill met only in a retry stays |
| Past attempt | Open a finished question from Past attempts | "Fort St 2025 · Q1 · Poem": the text, both tries with verdicts and reasons, the feedback and biggest gap (or "Make it even stronger" for a full-mark first try), and the model answer (the attempt is final); an unfinished attempt shows no model answer |
| Draw | Answer several questions with different marks | forms with lower average marks and questions tagged with an uncleared skill appear more often; an answered question never reappears (the automated seeded test is the proof) |

## 4. Revision loop (offline)

```bash
REMARK_MODEL=<a model stronger than ENGLISH_ADV_GRADING_MODEL> npm run unseen-remark -- --sample 40 --export   # samples first tries from every mark band; --export appends the disagreements as field cases (needsLabel: true) to resources/english-unseen/pilot-questions.json
# edit expectMark / expectMissed of each exported case and set needsLabel to false
python scripts/pilot-unseen-marker.py --gate       # whole file: tuning, holdout, field, each reported separately
```

Expected: exported cases hold no name, email, user id, attempt id or date; the holdout questions are
present and unchanged; the re-mark samples answers from every mark band and lists "marked too high" disagreements first, lower bands first; after any
edit to `lib/unseen/rubric.json` the prompt version in the report header is the new one and
`tests/fixtures/unseen-prompt.golden.txt` has been regenerated (`--write-golden`); running the re-mark does
not change `daily_ai_usage`.

## 5. Visual descriptions (before a visual question ships)

```bash
npm run check-unseen-descriptions                  # marks the model answer and stored pilot answers per visual text, 3 runs each
npm run validate
```

Expected: a text whose description is adequate for every sample is written to `description-checks.ts` with
`adequate: true`; one that is not is written with `adequate: false` and `npm run validate` fails until its
description is rewritten and the check passes; editing a passed description changes its hash and
`validate` fails until the check is rerun.

## 6. No key in the bundle

After `npm run build`: search `.next/static` for a distinctive 40-character run of each starter question's
model answer and criteria, and of the visual description. None may appear (the automated version is
`tests/unseen/no-key-leak-static.test.ts`, run in `npm test`). In the browser, open View Source and the
Network tab through a full quiz: the model answer first appears in the discussion response only.

## 7. Real-model pass and latency

With the real `ENGLISH_ADV_GRADING_MODEL`, mark two answers per starter question (one genuinely good, one deliberately
thin). Expect the good ones to reach full marks and the thin ones to lose a mark with a biggest-gap line (and each full-mark reply with a go-further line: the report prints it and its check section must say PASS; marks must not move against `unseen-pilot-4`)
that names what is missing. **Record ten marking durations** (the server log's `duration_ms`): the p95 must
be under 35 s; if not, raise `maxDuration` on the grade route before launch (research R5). Check the server
logs for the run contain only `[unseen] outcome=… user=<hash> question=… phase=… duration_ms=…` lines.

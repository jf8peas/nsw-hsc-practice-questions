# Quickstart: English Essay Writing (spec 011)

Run every command through **Git Bash** as `CLAUDE.md` describes. Repo root: `/c/Users/johnf/Git/nsw-hsc-practice-questions`. Scratch files go in `.cline/` as `tmp-*` and are deleted afterwards. Slice tags: **[S1]** first release (target Fri 27 Nov, hard deadline Fri 4 Dec 2026), **[S2]** after S1 is deployed.

## 1. Load the play before anything else [S1]

Before loading production, fill in the line endings missing from book p. 35 in the local play file (task T010a), so correct quotations from that page are not reported as not found.

The full play is never committed. It is read from the gitignored local copy and loaded into each environment's database. Run migration first, then the loader:

```bash
npm run db:generate                    # once after the schema change; inspect drizzle/0010_*.sql
npm run db:migrate                     # local/branch database
npm run reference-text:load -- --id away
```

The loader reads `resources/english-unseen/away-by-michael-gow.txt`, upserts `reference_texts.id = "away"`, and prints only the id, SHA-256 hash and byte count. It must not print the play. Record the hash in the release notes.

For **Preview and Production**, set that environment's own `DATABASE_URL` in the shell (Preview must use a separate, empty/schema-only branch), run `npm run db:migrate` and then the same `npm run reference-text:load -- --id away`. Vercel's build migrates but cannot load the play because `resources/` is not deployed. S1 cannot ship until this step has succeeded and the hash matches the approved local copy. To verify later, rerun the loader and compare the printed hash; do not query the text into a browser or terminal.

Tests seed a short invented passage into PGlite, never real play lines. If the row is missing at runtime, marking refuses with `reference_text_unavailable`, preserves the essay and spends no slot; it never silently skips quote checking.

## 2. Automated checks [S1]

```bash
npm run validate                    # includes verbatim questions, live keys and model quote checks
npx tsc --noEmit
npm run lint
npm test                            # full existing Economics suite + new English tests
npm run build                       # runs gen:formulas and validate
npm run validate:shipped            # only after deliberate new question/concept ids; commit the snapshot
```

Also run the offline prompt/quote/content checks:

```bash
python scripts/pilot-english-essay-marker.py --check
python scripts/pilot-english-essay-marker.py --write-golden
python scripts/pilot-english-essay-marker.py --write-quote-fixture
npm run english-essay-quote-parity   # 4/4 planted errors, 0 false flags over 67 accurate quotes
npm run english-essay-quote-parity -- --replay   # the 48 saved p5 replies reach the same final marks as Python's rescored.jsonl
npm run english-essay-check-models   # every live model: 900–1,100 words, zero quote flags
npm run english-essay-build-answers -- --dry-run
```

The golden contains synthetic text notes, not the play. The drift test hashes the real rubric plus concept record: any edit requires a new `promptVersion`, regenerated golden/hash and a fresh pilot. The parity fixture and pilot essays stay gitignored. The quote benchmark (1,200 words/25 quotations) targets <500 ms and must not exceed 2 s.

After `npm run build`, run the leakage suite again with a test-time sentinel selected from the local play. This exports the value without printing it and never writes it to a fixture:

```bash
export ENGLISH_ESSAY_TEST_PLAY_SENTINEL="$(python -c 'from pathlib import Path; t=Path("resources/english-unseen/away-by-michael-gow.txt").read_text(encoding="utf-8"); print(next(x.strip() for x in t.splitlines() if len(x.strip()) >= 60))')"
npm test -- tests/no-key-leak.test.ts
```

Expected: the sentinel is absent from every pre-result response and `.next/static`. Separate cases prove that only an exact near-match correction and quotations in the student's own released model essay may contain play words.

## 3. Shipping marker gate (real OpenRouter key) [S1]

Use the shipping `eng-essay-pilot-5` and `openai/gpt-6.2-sol` (or the explicitly configured `ENGLISH_ESSAY_GRADING_MODEL` that has passed the same full gate). `OPENROUTER_API_KEY` must be in `.env.local` or the environment. Run in small `--only` groups so each finishes promptly:

```bash
python scripts/pilot-english-essay-marker.py --set away --only away-a,away-b
python scripts/pilot-english-essay-marker.py --set away --only away-c,away-d
python scripts/pilot-english-essay-marker.py --set nesa --only nesa-2019-b12,nesa-2019-b23
python scripts/pilot-english-essay-marker.py --set nesa --only nesa-2019-b34,nesa-2019-b45
python scripts/pilot-english-essay-marker.py --set nesa --only nesa-2019-b56
```

Read every `resources/english-essay/runs/<timestamp>/report.md`. Across the complete set the release bar is:

- at least 80% of medians in their labelled ranges and **no median above range**;
- every run within labelled low −2 to high +1 and spread ≤4 per essay;
- all question-focus and knowledge-error checks pass;
- no off-list gaps and no Away-only gap on another text's calibration essay;
- 4/4 planted quote errors caught with zero false flags;
- no unusable reply after one retry and no cut-off at `max_tokens`.

Then, for each of e1–e3 (and e4 in S2) once its content is approved, rerun the Away set with the shipped marking notes (task T076a); the essay goes live only if the same bar still holds:

```bash
python scripts/pilot-english-essay-marker.py --set away --only away-a,away-b --notes-from resources/english-essay/content
python scripts/pilot-english-essay-marker.py --set away --only away-c,away-d --notes-from resources/english-essay/content
```

Record prompt version, model, run folders, latency and every gate component in `resources/english-essay/pilot-notes.md`. The approved run saw about 10–20 s per call and a 41 s maximum; the app uses 60 s first call, 115 s total budget and 120 s route duration. Any prompt or concept change requires a new version and the whole gate again. After real student essays arrive, revise from real use, not more invented tuning essays.

## 4. Plan-review pilot [S2 only]

The review remains not live in S1. Before changing `ENGLISH_ESSAY_REVIEW_LIVE`:

```bash
python scripts/pilot-english-essay-review.py --check
python scripts/pilot-english-essay-review.py --only strong,weak-thesis
python scripts/pilot-english-essay-review.py --only plot-claims,restate-thesis
python scripts/pilot-english-essay-review.py --only narrow-evidence,over-cap,overambitious
```

The seven Claude-written scaffolds cover a strong plan, weak thesis, plot-point claims, thesis-restating claims, narrow evidence, an over-150-word plan and an under-cap but overambitious plan. Run three replies per scaffold. Collectively they must show both strength and fix outcomes for every check. Pass only when every planted weakness is a fix, every reply has exactly five valid lines, every fix is a question, no student sentence or mark is supplied, no reply is cut off, and **Chiang approves every output**. Record the report under `resources/english-essay/review-runs/`. Any unmet condition keeps review off and only "Start writing" is offered.

## 5. Manual check on a real phone at 390 px [S1 unless marked]

Use a branch database with the reference text loaded. Start `npm run dev`, or use a Preview deployment accessible to the phone. For repeatable routes use `FAKE_ENGLISH_ESSAY=pass npm run fake-openrouter` with `OPENROUTER_BASE_URL=http://localhost:4010/v1/chat/completions` and `OPENROUTER_API_KEY=fake`; use the real model for the focus and misattribution cases below. Sign in as a test student. There must be no sideways scrolling on any screen.

1. **Unit page**: essays 1, 2 and 3 appear in that order with Knox 2025 Q6, Pymble 2024 Q6 and Abbotsleigh 2025 Q6. Non-live essays are absent and cannot start. Each card has Start/Resume/Redo as appropriate, latest final mark/band, and Discard only on the open unmarked attempt. Buttons and summary rows are at least 44 px.
2. **Scaffold, essay 1**: the verbatim question, source, Away and highlighted "to what extent" with its unit-guidance definition appear. There is Thesis and three Claim/Evidence-notes pairs, no conclusion and no Economics sub-boxes. Enter 151 words across the fields: the planning action disables (both actions once review is live) and the counter says to cut one; return to 150: "Start writing" enables. Clear thesis to whitespace: it disables again even with claims filled. Leave claims/evidence empty but restore thesis: it enables.
3. **Autosave/resume**: type a thesis and one claim, reload, then open on another device. The plan returns. A restored over-cap plan remains disabled. Start writing: the plan locks and a direct later scaffold save returns `scaffold_locked`.
4. **Review state**: in S1 only "Start writing" is offered; a direct review request returns `not_live` without locking or spending a slot. In S2 after the pilot, "Get feedback on my plan" returns exactly five strength/fix lines, every fix a question and no mark, then locks. Turn the reviewer off or reach the cap: the plan stays editable and "Start writing" works.
5. **Essay page**: the question and read-only collapsible plan appear above the box. Try keyboard paste, context-menu paste and drag/drop: nothing inserts and the no-paste note appears. Type to 799: `799 / 800–1,200 words — 1 more to go`, disabled; 800: enabled; 1,200: enabled; 1,201: `1,201 / 1,200 — cut 1 word`, disabled. Direct requests outside the range are refused with the same count and spend no slot. Draft text survives reload and another device.
6. **Timer [S2]**: ignore it and submit successfully. Start the 45-minute timer and let it expire (use a short test value): "Time is up. You can still submit." Editing and Submit remain available; reload shows it unstarted.
7. **Submit and result**: the essay stays visible and locked with live status steps. The result takes focus and shows final mark/band, four word/icon verdicts and reasons, two lift points, knowledge errors, flagged quotes, the student's essay and locked plan, collapsed model essay and gaps. A `partly`/`barely` focus warning names the missed question terms; `fully` has no warning. Near matches show the play's exact correction and no penalty; not-found quotes say not found and count as errors. No status depends on colour alone.
8. **Prepared essay on another theme**: submit a polished but prepared response that does not engage this question's terms. The real marker classifies focus `partly` or `barely`; final mark is capped at 12 or 10 respectively (Band 3), and the displayed band contains the adjusted mark.
9. **Invented and misattributed evidence**: submit an essay with one invented quotation and one deliberately misattributed line from the local notes. The invented quote is flagged not found and the misattribution is listed as a knowledge error. Each distinct mistake costs one, maximum deduction two; two or more cap at 16. If both findings concern the same quotation, they count once. A near-miss quotation shows the exact correction without a deduction.
10. **Discard**: start another essay, add a plan/draft, return to the unit page and confirm Discard. The open attempt and its work disappear, other essays can start, and earlier marked results remain. Discard is refused during an active lease and for a finished attempt.
11. **Redo**: finish an essay, choose Redo and finish with a different mark. The unit page shows the new final mark/band and both attempts remain in history. A gap used well only in that redo does not clear; using it well on two later different essays clears it.
12. **Marker off**: use a bad `ENGLISH_ESSAY_GRADING_MODEL` slug or stop the fake. The editable box returns with the full essay, a plain unavailable notice, no mark and no self-mark; the failed slot is refunded. Confirm no fallback to `ESSAY_GRADING_MODEL`, `ENGLISH_ADV_GRADING_MODEL` or `GRADING_MODEL` appears in logs.
13. **Daily cap = 1**: mark one essay, then submit another. The second says to come back tomorrow, keeps plan/draft, disables Submit and makes no model call. Reload: the cap state and text remain. In S2, a review attempted at the cap offers "Start writing" without locking.
14. **Reference missing (branch only)**: remove the `away` row in the branch database and submit. The response is `reference_text_unavailable`, the essay is preserved, no mark or slot is recorded, and no result is invented. Restore it immediately with `npm run reference-text:load -- --id away`.
15. **Double submit/two tabs**: submit simultaneously. One lease and one result exist; the second request receives `marking_in_progress` or the stored result and no second slot.
16. **Information release**: inspect View Source and Network on unit, start, resume, scaffold, review, draft, failed grade, cap, discard and unfinished detail. No marking notes, Away notes, key tags, pilot essays, play text or model essay appears. The model first appears only in the student's own finished result; no other play excerpt appears except a near-match correction.
17. **Accessibility**: keyboard through every action; focus is visible; the result and not-marked notices take focus; counters/status steps are announced politely; reduced motion stops animation; text zoom at 200% wraps; all targets remain at least 44 px.

## 6. Ship gates

### S1

- Reference hash loaded and verified in the target database.
- Full existing Economics suite and new English suite, `npx tsc --noEmit`, `npm run lint`, `npm run validate`, `npm test` and `npm run build` all green.
- Shipping marker gate passes on the final prompt/model; quote parity and every live model quote check pass.
- No-key response and client-output scans pass, including the test-time play sentinel.
- Essays 1, 2 and 3 have Chiang's approval and go live one at a time; `npm run validate:shipped` records their ids.
- Real-phone checks on essays 1 and 2 pass, including prepared-focus, invented/misattributed evidence, discard, redo, marker-off and cap=1.
- Deploy target **Fri 27 Nov 2026**; absolute deadline **Fri 4 Dec 2026**. Do not start S2 at S1's expense.

### S2

- Review pilot passes and Chiang approves every output before `ENGLISH_ESSAY_REVIEW_LIVE` changes.
- Review success/failure/cap/not-live and 45-minute timer checks pass on a real phone.
- Essays 4–6 pass the same content, quote, review and build gates and go live one at a time.
- Full suite, type check, lint, validation and build are green again.

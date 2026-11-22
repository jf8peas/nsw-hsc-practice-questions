# Quickstart: Economics Essay Writing (spec 010)

Run every command through Git Bash as `CLAUDE.md` describes (the Bash tool, or `& 'C:\Program Files\Git\bin\bash.exe' -c '…'` from PowerShell). Repo root: `/c/Users/johnf/Git/nsw-hsc-practice-questions`. Scratch files go in `.cline/` as `tmp-*` and are deleted afterwards. Slice tags: **[S1]** ships before Tue 1 Dec 2026, **[S2]** after.

## 1. Automated checks (the mechanical part of the ship gate) [S1]

```bash
npm run db:generate                 # once, after the schema change: checks drizzle/0009_*.sql is the only new migration
npm run validate                    # content rules, including validateEssayRules (live essays complete, concept tags on the list)
npx tsc --noEmit
npm run lint                        # only the known Quiz.tsx warning is expected
npm test                            # PGlite route tests, client tests, no-key-leak, golden prompt, concept rule
npm run build                       # runs gen:formulas and validate; then tests/…/no-key-leak-shipped scans .next/static
```

The unit is registered only once at least one essay is `live: true`, so until the gate has passed these checks run against an unlisted unit (all six essays `live: false`); the route and client tests mark with `scripts/fake-openrouter.ts` (`npm run fake-openrouter`, `OPENROUTER_BASE_URL` pointing at it in tests), never a real model.

## 2. The marker check (release gate; run first; blocks every `live: true`) [S1]

OpenRouter is not reachable from the agent's sandbox, so **you run the pilot locally in Git Bash and paste the report back**.

```bash
python scripts/pilot-essay-marker.py --check                       # offline: word counts, labels, prompt renders, golden prompt matches rubric.json
python scripts/pilot-essay-marker.py --write-golden                # offline: rewrites tests/fixtures/essay-golden-prompt.txt after a prompt edit
python scripts/pilot-essay-marker.py                               # 7 essays x 3 runs, default model (OPENROUTER_API_KEY from .env.local)
python scripts/pilot-essay-marker.py --model deepseek/deepseek-chat   # the comparison run
python scripts/pilot-essay-marker.py --set holdout                 # the frozen holdout, read only after tuning stops
```

Reports land in `resources/topic011/runs/<timestamp>/report.md` (and `raw.jsonl`). Pass bar (research R8), on the prompt version that ships: (a) median mark in the labelled range for ≥ 6 of 7 essays, none more than one band away; (b) the one-economy essay capped at 12 in every run; (c) every planted wrong figure flagged in a majority of runs, no flag on a checked-correct figure in more than one strong-essay run; (d) raw off-list gap ids ≤ 5%; (e) ≤ 1 unparseable reply of 21 and **no reply cut off at `max_tokens`** (the English markers needed 12000 once the model reasoned long; raise `MAX_TOKENS` here and in `lib/essay/marker.server.ts` together if the report shows `finish_reason: length`); (f) p95 seconds per call ≤ 40; (g) `conceptsUsedWell` present and disjoint from `gaps`. Tune only on the 7 essays, bumping `promptVersion` and rerunning **every** case each time; record each run's table in the "Gate record" below.

### 2a. Gate record

*(empty: the pilot has not been run yet. Fill in prompt version, model, set, results against (a)–(g), run folder, and any change made, as spec 009's quickstart does.)*

## 3. The plan-review smoke test [S2]

```bash
python scripts/pilot-essay-review.py --check
python scripts/pilot-essay-review.py                               # 4 scaffolds x 3 runs, ESSAY_REVIEW_MODEL or the default
```

Pass: seven lines on every reply; every fix is a question (a "?"); no rewritten sentence handed to the student; the planted wrong figure flagged with no replacement number; no reply cut off. Not part of the marker gate; the review ships when this passes.

## 4. Manual check on a real phone at 390 px [S1 unless marked]

Sign in as a test student. Run the unit on a deployed preview (or `npm run dev` with the phone on the same network). Essay 1 is China, essay 5 is both.

1. **Unit page**: the live essays are listed in the order 1, 3, 5 (then 2, 4, 6 when live); each shows its verb, its economy and, for a trial essay, its source; a "Next up" label sits on the first one with no mark; no sideways scroll.
2. **Scaffold, essay 1**: type past 250 words (paste a long passage from another app) → the counter reads "… / 250 words, cut N words" and both buttons are disabled; cut back under → enabled. Clear the judgement → disabled; leave the judgement but empty all three body points → disabled; fill one point → enabled. All buttons are at least 44 px.
3. **Autosave and resume**: type in three fields, reload the page → the text is back; close the tab, open the unit on another device → "Resume" shows the same scaffold.
4. **Plan feedback** [S2]: press "Get feedback on my plan" with one body point missing a year → seven lines, each a strength or a fix, every fix a question, no paragraph written for you; a made-up figure ("China's GDP was $90 trillion in 2020") is flagged "check this figure" with no corrected number; the essay page opens with "Feedback on your plan" (collapsible) above the box. Turn the reviewer off (blank `OPENROUTER_API_KEY` locally, or `ESSAY_REVIEW_MODEL` to a bad slug) → "We couldn't review your plan just now" and "Start writing" works. Set `LLM_DAILY_CAP=1` and use it up → "come back tomorrow" for the review, "Start writing" still works.
5. **Start writing**: the scaffold locks; the essay page shows the question (verb highlighted and defined), "Your plan" open and read-only, the box with a counter, and "Submit essay" disabled. Try to edit the plan from another tab (`/api/essay/scaffold`) → `scaffold_locked`.
6. **Word limits**: type to 599 → "599 / 600–800 words — 1 more to go", Submit disabled; 600 → "600 / 600–800 words", enabled; 800 → enabled; 801 → "801 / 800 — cut 1 word", disabled. Try to paste (long-press → Paste, keyboard paste on a tablet, drag text in) → nothing inserts and the "Pasting is switched off" note shows.
7. **Timer** [S2]: ignore it and submit → works; start it and let it reach zero (use a short build-time constant) → "Time is up. You can still submit." and Submit still enabled.
8. **Draft**: type 300 words, reload → the text is back, from another device too.
9. **Submit**: the box locks with timed status steps announced by VoiceOver/TalkBack; the result shows the mark out of 20 and band, five verdicts each with a word badge and a reason, two "To lift your mark" items, flags (if any) quoting your words, your essay beside your plan (stacked at 390 px), the band 1 model essay (collapsed), and "Added to Things I need to know". Open "Things I need to know" on the unit page: the same gaps, each with the missing-piece line.
10. **Essay 5 with China only**: write 700 words about China only → the result says "Capped at 12" and the mark is ≤ 12.
11. **Failure**: stop the marker (unset `ESSAY_GRADING_MODEL` to a bad slug) and submit → the box returns with your text and "We couldn't mark your essay just now", no mark, no error. Set `LLM_DAILY_CAP=1`, use it, submit → "You've reached today's marking limit. Come back tomorrow" with your plan and essay still there and Submit disabled; reload → still there.
12. **Double submit**: submit and immediately submit again from a second tab → one marking, one slot, the second tab shows the first result.
13. **Discard** [S2]: start essay 3, type a plan, return to the unit page → "Resume" on e3, other essays disabled with "Finish or discard your open essay first"; "Discard this attempt" → confirm names what is deleted → the scaffold and draft are gone and every essay can be started; your marked essay 1 and its mark are unchanged. Discard is not offered once a marking is in flight.
14. **Redo**: finish essay 1, return → "Redo" and its mark; redo it and finish → the unit page shows the new mark; "Your results" lists both attempts. A gap raised on essay 1, used well in the redo, is **not** cleared; used well on essay 5 and essay 2 it is.
15. **Direct request**: with essay 1's attempt token, `POST /api/grade` with 599 and 801 words → `essay_too_short` / `essay_too_long` and no slot used.
16. **No key**: view source and the Network tab on every screen before the result → no marking notes, school criteria, concept tags or model essay.

## 5. Ship gate (S1)

`npm run validate`, `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all green; the pilot's gate record in §2a shows a pass on the shipping `promptVersion` (re-run once if the prompt changed after the last pass); the model-essay check for each essay being set live (3 runs, band 1 on the majority, no wrong-figure flags); §4 steps 1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 14, 15, 16 on essays 1 and 5 on a real phone; then set `live: true` for essays 1, 3, 5 in turn and deploy. Target: deployed Fri 27 Nov 2026.

# Release prompt for spec 011, slice S1 (essays 1-3)

Paste everything inside the block below into your agent as one message. It runs in two parts with a stop
in between for Chiang's review of the three model essays. Before running it, fill in book p. 35 in the local
play file (task T010a) if you can, so the content checks use the complete text.

```text
Finish slice S1 of specs/011-english-essay-writing: the open tasks T061, T075, T076, T076a, T077-T082 and T101, then
prepare T010a, T102 and the production steps for Chiang. Read first: specs/011-english-essay-writing/tasks.md, quickstart.md,
content-prompt.md, research.md R9-R11 and R15, CLAUDE.md and resources/english-essay/pilot-notes.md.

Rules for the whole job:
- Run every command through Git Bash as CLAUDE.md describes. Scratch files go in .cline/ as tmp-*.
- Never commit or push. Never set an essay live: true without Chiang's written approval of that essay in this chat.
- Never touch the production database or Vercel settings. Use the local/dev DATABASE_URL only.
- resources/ is gitignored and holds the play, pilot essays and content drafts: never copy any of it into a committed
  file, a test or a fixture. Never quote more of the play in committed files than a released model essay contains.
- Mark each task [x] in tasks.md only when it is actually done, and say plainly if anything fails. Do not weaken a gate
  to make it pass.

PART 1: do all of this, then STOP and report.

1. T061: run the US1 end-to-end check with scripts/fake-openrouter.ts and a synthetic live essay in npm run dev, as
   tasks.md describes. Load the play into the LOCAL database first (npm run reference-text:load) and check the printed
   hash. Record the result where T061 says.

2. T077, T078, T079 (one essay at a time, e1 then e2 then e3), following content-prompt.md exactly:
   - Write resources/english-essay/content/eN.json with markingNotes, modelEssay and conceptTags. For e1, e2 and e3 you
     may start from the marking notes for the same question in resources/english-essay/pilot-away.json (Knox 2025 = e1,
     Pymble 2024 = e2, Abbotsleigh 2025 = e3) and improve them; they are original notes, not play text.
   - The model essay is an original Band 1 response on Away, 900-1,100 words, answering the verbatim question in its own
     terms. Use real quotations from the local play file, in double or single quotation marks.
   - Run npm run english-essay-check-models (or the check the content prompt names) until the essay has zero quote flags
     (no near, no not-found) and the word count is in range. Fix quotations against the play; never "fix" the play.
   - Write resources/english-essay/review/eN-review.md for Chiang: the question, word count, quote-check result, concept
     tags, the marking notes in full, the model essay in full, and anything you were unsure about.
   - Do NOT add the id to resources/english-essay/review/approved.json. Chiang approves.

3. T075 and T076: write the shipping-gate record in resources/english-essay/pilot-notes.md from the existing passing p5
   runs (resources/english-essay/runs/20261123-012122 and 20261123-012146: prompt eng-essay-pilot-5, model
   openai/gpt-6.2-sol), including that npm run english-essay-quote-parity passes (71 quotations, 0 differences, 4/4
   planted errors, 0 false flags over 67 accurate quotations; 48 replayed replies, 0 final-mark differences). Rerun that
   parity command now and record its output. Do not change rubric.json or concepts.ts.

4. STOP. Report: the T061 result, each essay's word count and quote-check result, the three review files' paths, and
   the gate record. Ask Chiang to read the three review files and reply with approval or changes for each essay.

PART 2: only after Chiang approves an essay in this chat.

5. For each approved essay, add its id to resources/english-essay/review/approved.json, then run T076a: the Away set
   with the shipped notes, in small groups so each finishes promptly:
     python scripts/pilot-english-essay-marker.py --set away --only away-a,away-b --notes-from resources/english-essay/content --runs 3
     python scripts/pilot-english-essay-marker.py --set away --only away-c,away-d --notes-from resources/english-essay/content --runs 3
   The essay may go live only if every T075 threshold still holds for the cases on its question (no median above range,
   every run within low-2/high+1, spread <= 4, focus and knowledge checks pass, 4/4 planted quote errors, 0 false flags).
   If a threshold fails, stop and report; do not tune the prompt.

6. T080, T081, T082: release each approved essay that passed step 5, one at a time: npm run english-essay-build-answers,
   set only that essay's live: true in content/units/y12-english-essay-writing/questions.ts, then npm run validate,
   npx tsc --noEmit, npm test, npm run build and npm run validate:shipped. Record the evidence in its review file.

7. T101: run the S1 automated ship gate from quickstart.md sections 1-3 and 6 against the LOCAL database, including the
   leak test against the built output, and record it in resources/english-essay/release-s1.md.

8. Write resources/english-essay/release-s1-chiang.md: a short checklist of the steps only Chiang can do, in order:
   - T010a, if not already done: fill in the line endings missing from book p. 35 in
     resources/english-unseen/away-by-michael-gow.txt; then rerun npm run english-essay-check-models.
   - Add ENGLISH_ESSAY_GRADING_MODEL=openai/gpt-6.2-sol to Vercel (Production and Preview).
   - Load the play into the production database BEFORE deploying the live essays:
     DATABASE_URL="<production url>" npm run reference-text:load, and check the hash matches the local one.
   - Commit and push; the Vercel build runs the migration.
   - T102: the real-phone check from quickstart.md section 5 on essays 1 and 2, then record sign-off in release-s1.md.
   Then report what was done, what failed (if anything), and the checklist's path.
```

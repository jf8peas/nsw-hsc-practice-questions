# Research: Economics Essay Writing (spec 010)

Each item: **Decision**, **Reason**, **Alternatives rejected**. Code facts were read on 2026-11-22 from the files named.

## R1. Constitution check and amendments (first task, T001)

**Decision.** Amend the constitution from **2.16.0 to 2.17.0** (MINOR: materially expanded guidance in Principles I, II, VI, VII and the Quality Gates for a whole-essay unit; no new principle, nothing removed). Principles III, IV, V, VIII and IX need no change (V already covers verbatim school-trial questions and the school's guidelines as a server-only rubric; VIII: no dependency). Sync Impact Report entry (prepend, keep the earlier ones):

> - Version change: 2.16.0 → 2.17.0 (MINOR: guidance in Principles I, II, VI and VII and the Quality Gates extended to the Economics essay-writing unit, spec 010).
> - Reason (amendment log): the essay unit (spec 010) has a student plan a whole extended response, optionally get feedback on the plan, write 600–800 words and be marked out of 20 in the school's AT1 bands. Like the English units it is one question per attempt, one try, never self-marked, and needs the database. It stores the student's own plan, review and essay. The marking notes, the school's criteria and the band 1 model essay are server-only key material; the model essay is released only with the student's own finished result. Two new model settings serve the marker and the plan review. A gap is cleared only by later essays, not by a redo of the essay that raised it. A marker check on labelled essays gates each unit that is marked by a pilot-tested prompt.
> - Modified principles: I (essay unit release schedule and request fields); II (essay phase row; the derived concept rule's "different essay" clause); VI (the essay unit never self-marked; the plan review's failure); VII (`ESSAY_GRADING_MODEL`, `ESSAY_REVIEW_MODEL`); Quality Gates (leakage, testing and the marker check).
> - Templates requiring updates: none.

Exact text to add.

**Principle I**, new bullet after the comparative bullet:

> - [DECISION] The Economics essay-writing unit (spec 010) MAY send part of its key to the browser at defined moments, and only then. Before an essay is marked: nothing from the key (the essay question, its directive verb and definition, its economy tag, its source if it is a school-trial question and `live` are public content, and the scaffold, the plan review and the draft are the student's own text). After an essay is marked: the five per-criterion verdicts and reasons, the band, the mark, the two lift points, the flagged figures (quoting the student's words), the gaps and the concepts used well (never model-essay or marking-note text; the server rejects a marker reply that repeats a long run of the notes or the school's criteria). With the student's own finished result: the band 1 model essay. Never, at any moment, including reload, resume, discard and the attempt detail page of an unfinished attempt: the marking notes, the school's criteria, the concept tags of an essay, or the model essay. Key material MUST come through functions exported from `lib/grading.server.ts`.

**Principle I**, request-fields bullet, append: "…; for the essay unit's attempt-start route, a `questionId` (an essay id the server checks is live and not already open); for its scaffold route, `attemptId`, `questionId`, the signed attempt token, an `action` (`save` or `start`) and the scaffold's text fields; for its review route and discard route, `attemptId`, `questionId` and the signed attempt token (the review also the scaffold's text fields); and for its grade route, `attemptId`, `questionId`, the signed attempt token and the essay text (no `phase`)."

**Principle II**, new bullet after the comparative bullet:

> - per essay attempt (spec 010): the unit and essay id; the scaffold (its text fields) and when it was locked; the plan review, if one was made (seven check lines and any flagged figures), with its prompt version and model; the essay text and its word count; the five per-criterion verdicts each with the marker's one-line reason; the band; the raw and the final mark; the two lift points; flagged figures; the gaps (concept id and one-sentence detail) and the concepts used well; and the prompt version and model that marked it; stored in one essay row, kept for the attempt detail page, deleted with the student like results. The student's in-progress essay is stored in the existing draft row. A discarded attempt (unmarked only) is deleted with its scaffold, review and draft. Verdicts and reasons never change concept tracking, which comes from the gaps and concepts used well.

**Principle II**, derived concept rule, append: "A concept whose unit declares `conceptsClearOnOtherQuestions` (spec 010) is not taken one away by a correct use in the same question that last set it; only a different question clears it."

**Principle VI**, extend the 008/009 bullet: "[DECISION] The unseen-text, comparative and **essay-writing** units (specs 008, 009 and 010) are never self-marked…" and add: "The essay unit has one try per attempt and no second phase: if the marker fails, the editable box returns with the essay and the slot is refunded; if the student is over the daily cap, the app tells them to come back tomorrow, and the scaffold and essay stay as drafts. The optional plan review is never marked and never blocks the essay: if the reviewer fails or the student is over the cap, the app says so and offers 'Start writing' without it. The essay unit cannot start, resume, mark, review or save without the database (it MUST NOT guess), as for the units above."

**Principle VII**, new bullet: "`ESSAY_GRADING_MODEL` and `ESSAY_REVIEW_MODEL` follow the same server-only rules as `OPENROUTER_API_KEY`. The first marks the essay-writing unit's essays (default `deepseek/deepseek-v4.1-flash`, or the model its marker check names); the second gives the optional plan review (same default). Neither falls back to `GRADING_MODEL` or `ENGLISH_ADV_GRADING_MODEL`. Each marked essay and each plan review counts one slot against `LLM_DAILY_CAP`, refunded if the call fails."

**Quality Gates**, three additions: leakage "- the essay unit's marking notes, school criteria, concept tags and model essay (before the student's own finished result) never leave the server;"; testing "- the essay unit's marker failure returns the editable box with no mark, its daily-limit state keeps the drafts and disables Submit, a plan-review failure offers 'Start writing', and a gap clears after 2 correct uses on a different essay;"; and a new bullet: "- a unit marked by an LLM against labelled pilot essays MUST NOT set a question `live` until its marker check (`resources/<topic>/`) has passed on the prompt version that ships."

Version line: `**Version**: 2.17.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-11-22`.

**Reason.** 2.15.0/2.16.0 wording names the other units; spec 010 adds routes and stored text that Principle I/II list exhaustively. Reusing the same pattern keeps the amendment small.

**Alternatives.** *No amendment, "existing text covers it"*: rejected: Principle I's field list and II's "may store only" are closed lists. *Fold the essay unit into 009's bullets*: rejected: it differs (no phases, no pick, notes plus school criteria, plan review). *A new Principle*: rejected: nothing new in kind.

## R2. Unit shape and content types

**Decision.** Unit `y12-economics-essay-writing`, `UnitMeta.flow: "essay"`, `conceptsReady: true`, `conceptsClearOnOtherQuestions: true`, order after the paragraph unit. A new question type:

```ts
interface EssayQuestion extends BaseQuestion {   // PUBLIC
  type: "essay"; group: "essay"; maxMarks: 20;
  verb: string;                      // key of content/glossary.ts
  economy: "china" | "nepal" | "both";
  offer: 1 | 2 | 3 | 4 | 5 | 6;      // position in the offered order: ids e1,e3,e5,e2,e4,e6 get 1..6
  live: boolean;                     // false until reviewed and the marker gate has passed
  // source (BaseQuestion): "Barker 2024 Trial, Q27" for trial essays; none for new ones
}
// EssayKey (server-only, content/units/…/answers.ts → Answer.essay)
interface EssayKey { markingNotes: string; schoolCriteria: string | null; modelEssay: string; concepts: string[]; }
```

`needsBoth` is `economy === "both"`, a helper, not a stored field. Concept tags are in the key, not the public question: they are the concepts a strong answer uses, so they are answer content (the existing public `concept` tag rule does not fit). Result rows always carry `conceptOutcomes` (R9), so progress never reads a question tag for this unit; the validator accepts an essay's key tags for "concept-ready". All six public questions are registered with `live` set per essay: question wording is public, so non-live essays leak nothing, and the start route and unit page refuse non-live ids (server-checked). Ids `y12-economics-essay-writing.e1`…`e6` in the order of the spec's list (never renumbered); `offer` gives 1, 3, 5, 2, 4, 6 order: e1→1, e3→2, e5→3, e2→4, e4→5, e6→6. A live essay later made non-live keeps resuming and its results; it cannot be started.

**`explain`** added to `content/glossary.ts` with NESA's definition (spec FR-045). `evaluate` and `assess` exist.

**Validator** (`validateEssayRules` in `lib/content-rules.ts`, called from `scripts/validate-content.ts`): ids namespaced and unique; `offer` a permutation of 1–6; every essay has `verb` in the glossary and `economy`; a `source` exactly when the question is a school-trial one (e1, e3, e4); for a **live** essay: key present, `markingNotes` non-empty, `modelEssay` 600–800 words (`countWords`), `concepts` non-empty and each on the concept list, `schoolCriteria` non-empty when `source` is set, and no question text equal to spec 007's essay questions; no key text in public data; no model essay containing the string of any other essay's key text. Non-live essays need no key. `unit.conceptsReady` requires every live essay to have tags.

**Reason.** Mirrors 007/009's public/key split (Principle I) with the smallest public surface; `live` is a plain boolean so "go live one at a time" is a one-line diff reviewed in a PR.

**Alternatives.** *Register only live essays*: rejected: three Slice-2 essays would need new question ids added later, and the unit page could not show "coming soon"; the id is stable from day one. *`needsBoth` stored*: rejected: two fields to keep consistent. *Tags in public data*: rejected: they name what a strong answer covers.

## R3. Attempt state and schema

**Decision.** Reuse `attempts` (one row per attempt, `questionIds: [essayId]`, `completedAt` set when the result saves) and `results` (one row per finished attempt: `marksAwarded` = final mark, `maxMarks` 20, `gradedBy` "llm", `feedback` = band reason, `answer` = essay text, `conceptOutcomes`). Add one table, `essay_phases`, one row per attempt:

```text
id, attempt_id, user_id (FK cascade, composite FK to attempts), unit_id, question_id,
status            'planning' | 'writing' | 'finished'
scaffold          jsonb (the 20 fields, data-model §2)    -- editable while planning
scaffold_locked_at ts null                                 -- set when status becomes 'writing'
review            jsonb null, review_prompt_version, review_model, reviewed_at
marking_started_at ts null                                 -- the lease (R6)
essay_text text null, essay_words smallint null
raw_mark, band, final_mark smallint null; covers_both boolean null
criteria jsonb null (five {verdict, reason}); band_reason text null; lift jsonb null;
flags jsonb null; gaps jsonb null; used_well text[] null
prompt_version, model text null; graded_at ts null
created_at, updated_at
unique (attempt_id, question_id); checks: status; scaffold word total ≤ 250; finished ⇒ all marking columns set;
band 1–5; marks 1–20; final_mark ≤ 20.
```

Partial unique index `attempts_essay_incomplete_unique` on `(user_id)` where `unit_id = 'y12-economics-essay-writing' and completed_at is null`: one open attempt per student (two tabs starting at once end on one attempt, as 008/009). The essay **draft** reuses `rewrite_drafts.phase1_draft` (R6).

**States**: `planning` (scaffold editable, created with the attempt) → `writing` (scaffold locked; review stored if one was made) → `finished` (marked; the attempt completes). "Marking" is not a stored status: it is a request in flight guarded by `marking_started_at`. "Reviewing" is likewise in flight (the scaffold is locked only when the review succeeds or the student presses "Start writing"). Failure and cap returns leave the row in `writing`.

**Discard** (S2): `POST /api/essay/discard` deletes the **attempt row** (the `essay_phases`, draft and any result cascade by FK) only when `completed_at is null` and the lease is null or older than 90 s. Earlier finished attempts of the same essay are separate attempt rows and stay. A confirm dialog (`Dialog.tsx`, reused from `components/unseen`) names what is deleted. Discard after marking began is refused (`409 marking_in_progress`), after finishing it is impossible (the attempt is complete).

**Redo and latest mark**: Redo starts a new attempt on the same essay (the `attempts_essay_incomplete_unique` index permits it once the previous one is complete); the unit page reads the most recent `results` row per essay by `created_at`. Spec 007's `results_attempt_question_unique` keeps one result per attempt.

**delete-student / retention**: all FKs cascade from `users`; `scripts/delete-student.ts` needs only a test and a line in its dry-run listing (data-model §6). **No counterpart to `clear-unfinished-essays.ts`**: that script exists because 007's essays were archived mid-progress; the essay unit has Discard for the student and `live: false` is never applied to a started essay.

**Reason.** Keeps the unit on existing completion, history, retention and "Your results" paths; one new table only for what truly differs.

**Alternatives.** *Widen `unseen_phases`*: rejected (Complexity Tracking). *Store the scaffold in `rewrite_drafts`*: rejected: no lock, no server validation. *`marking` as a stored status*: rejected: a crashed request would leave the row stuck; a timestamp lease self-heals after 90 s.

## R4. Scaffold (FR-006 to FR-011)

**Decision.** The form has **20 text fields in 5 sections** (the request said 13; counting them: Introduction 3 [judgement, key terms, economy and status], Body paragraphs 1–3 with 5 each = 15 [point, theory or model, data and indicators with year, evaluation, link], Conclusion 2 [restated judgement, the reason that weighs most]). At 390 px each section is a native `<details open>` with a summary showing "Body paragraph 2 · 3 of 5 filled"; all are open by default, and a sticky bottom bar holds the total counter ("183 / 250 words") and the buttons (44 px). Fields are auto-growing textareas; dot points and notes are plain text.

Word total = the sum of `countWords` over the 20 fields (`lib/wordcount.ts`; one rule for client and server). Over 250: both buttons disabled; the counter reads "263 / 250 words, cut 13 words". Move on only if the judgement (`intro.judgement`) is non-empty after trim **and** at least one of the three body points is non-empty. `validateScaffold` lives in `lib/essay/scaffold.ts` (plain module, no I/O); the client calls it for the buttons, the server calls it on `action: "start"` (and on review) and answers `400 scaffold_invalid` with a list of reasons (`over_cap`, `no_judgement`, `no_body_point`), never trusting the client. A `save` (autosave) is accepted when under the cap even if incomplete; over the cap it is **refused** with `400 over_cap` so the stored scaffold can never exceed 250 (the client keeps the text locally and shows the over-cap state).

**Autosave**: debounce 1.5 s plus `pagehide`/`visibilitychange` (`fetch` with `keepalive`) to `POST /api/essay/scaffold {action:"save"}`, with a per-user limiter (`checkDraftRateLimit`); each field's text is also mirrored to `sessionStorage` (`lib/drafts.ts` pattern, key `draft:essay-scaffold:<attemptId>`) for instant restore. The row is the source of truth on resume.

**Lock**: `action: "start"` (button "Start writing") validates, sets `status='writing'` and `scaffold_locked_at` in one conditional update (`where status='planning'`); every later `save`/`start` gets `409 scaffold_locked`. A successful review (R5) locks in the same transaction as storing the review. The essay page renders the scaffold read-only from the stored row.

**Reason.** One validator, one counter, server-enforced lock satisfies FR-008 to FR-011 and the "client never trusted" rule.

**Alternatives.** *Collapse body paragraphs by default*: rejected: students would miss fields. *Store the scaffold only in `sessionStorage` until the button*: rejected: lost on another device, breaks resume. *Allow saves over 250*: rejected: spec's hard cap.

## R5. Plan review (FR-012 to FR-017) [S2]

**Decision.** `lib/essay/review.json` (own `promptVersion` `essay-review-1`), `lib/essay/review.server.ts`, `ESSAY_REVIEW_MODEL` read by `getEssayReviewModel()` in `lib/config.server.ts` (default `deepseek/deepseek-v4.1-flash`; blank counts as unset; documented in `.env.example`, README and constitution VII). The prompt receives the essay question, verb and definition, the economy rule, the AT1 band summary, the **scaffold text** and the seven checks; it never receives the model essay, marking notes or school criteria (the review must not leak key material and does not need it). Reply (contracts/replies.md): `{ "checks": [ { "id", "status": "strength"|"fix", "line" } ×7 ], "figureFlags": [ { "quote", "why" } ] }`.

Parse rules (`parseReviewReply`): exactly the seven ids, once each, in any order (re-sorted to the spec's order); status in the set; `line` non-empty, ≤ 240 chars; **a `fix` line must contain "?"** (written as a question or prompt), else the reply counts as malformed; `figureFlags` ≤ 4, each `quote` must occur in the scaffold (whitespace-normalised), else dropped; a `why` containing a digit that is not in its quote is replaced by "This figure looks wrong; check it against a source" (no replacement number, same `scrubFlagWhy` helper as the marker). One retry on a failed call, cut-off, empty or malformed reply, inside a 45 s budget (first call 25 s). `max_tokens` 1500.

**Handler** (`POST /api/essay/review`): scaffold validated as for "start"; if a review is already stored → `409 already_reviewed` (one review per attempt); rate limits; one slot of the daily cap; reviewer call; on success store review and lock the scaffold in one update, respond `200 { review }`; on failure refund the slot, **do not lock**, respond `200 { notReviewed: { reason: "reviewer_unavailable" } }`; over the cap `200 { notReviewed: { reason: "daily_limit", resetsAt } }`. The student reads "We couldn't review your plan just now" with "Start writing" (and may edit the plan and retry). The review is stored with the attempt but the result view builder takes no review field, so the result page cannot show whether it was reviewed (FR-015).

**Pilot**: `scripts/pilot-essay-review.py` with 4 hand-built scaffolds (strong, no-data, wrong-economy, over-long) checked for: seven lines, fixes are questions, no written sentences, a planted wrong figure flagged without a number. It is **S2 and not part of the marker gate**: the review ships in the second slice and only when this smoke test passes; it can slip until after 1 Dec without touching essays 1, 3, 5.

**Reason.** Separate prompt and model so a harsh or flaky reviewer cannot affect marks; question-form fixes are the one checkable proxy for "never writes sentences".

**Alternatives.** *Share the marker prompt*: rejected (different output, must not see notes). *Review without locking on success*: rejected: spec locks once the student moves on, and a reviewed plan changed afterwards defeats the review. *Strict sentence-detection*: rejected: not checkable by code.

## R6. Essay page (FR-018 to FR-026)

**Decision.**
- **Counter** (`lib/essay/counter.ts`, used by the page and the tests): `n = countWords(text)`; `n < 600`: "`n` / 600–800 words — `600-n` more to go" (disabled; 1 → "1 more to go"); `600 ≤ n ≤ 800`: "`n` / 600–800 words" (ready); `n > 800`: "`n` / 800 — cut `n-800` word(s)" (disabled). The status is in a polite live region updated at most every 2 s; the Submit button also carries `aria-describedby` to it.
- **Server re-check** in the grade handler: `countWords(essay)` outside 600–800 → `400 { error: "essay_too_short" | "essay_too_long", words, min: 600, max: 800 }` before any limit, slot or marker call; character cap 8000 (an 800-word essay of long economics words is about 6000 characters; spec 008's 6000 would be too tight), and the draft route's `MAX_DRAFT_LEN` rises to 8000.
- **Paste blocking**: `onPaste` → `preventDefault()`; `onDrop` and `onDragOver` → `preventDefault()` for text; `onBeforeInput` → cancel when `inputType` is `insertFromPaste`, `insertFromPasteAsQuotation`, `insertFromDrop` or `insertFromYank` (`insertReplacementText` is **not** blocked: autocorrect and spell-check legitimately replace a word); the context-menu paste fires a paste event, so it is covered; a short polite status ("Pasting is switched off, as in the exam. Type your answer.") appears and clears after 4 s. Voice dictation and long autocorrect can still insert text; that cannot be blocked in a browser and is accepted (the control is a rehearsal aid, not an anti-cheat boundary). `autoCapitalize`/`spellCheck` stay on (the exam is handwritten), `autoComplete="off"`.
- **Timer** (S2): optional "Start 50-minute timer" button; **client-only state, not stored** (a reload shows it unstarted; the spec says started by the student and not enforced). A `Timer` component counts down with `setInterval`, shows "mm:ss left"; at 0 it shows "Time is up. You can still submit." in a polite live region and never disables anything. No animation, so reduced motion needs nothing.
- **Draft**: the essay box autosaves through the existing draft route (`POST /api/rewrite/draft`, phase 1, type `essay`) with `sendRewriteDraftBeacon` on blur/pagehide plus a 3 s debounce, and `sessionStorage` (the 007 pattern); the stale check treats `status='finished'` as complete. The draft is deleted on a marked result.
- **Marking screen**: on submit the box locks (read-only, `aria-busy`), status steps appear in a live region (008's `Writing` pattern: "Sending your essay", "Reading your essay", "Checking each criterion", "Choosing your band", "Almost done" at 0 s, 8 s, 18 s, 30 s, 45 s); reduced motion removes any spinner animation.
- **Failure and cap** (`handleEssayGrade`, from 008's flow): `200 { notMarked: { reason: "marker_unavailable" } }` → the editable box returns with the text and a plain notice ("We couldn't mark your essay just now. Your text is still here. Try again."), slot refunded; `{ reason: "daily_limit", resetsAt }` → "You've reached today's marking limit. Come back tomorrow: your plan and essay are saved." Submit disabled until the next Sydney day (008's `NotMarked` type and notices reused); network or 5xx failures return the box with the usual error. Marking off (no key or `LLM_DAILY_CAP=0`) is `marker_unavailable`.
- **Double submit / two tabs**: the handler takes the **lease** first: `update essay_phases set marking_started_at=now() where attempt_id=… and status='writing' and (marking_started_at is null or marking_started_at < now() - interval '90 seconds')`; zero rows → `409 marking_in_progress` (or `409 already_answered` with the stored result if finished). The lease is cleared on every not-marked path and on finish.

**Reason.** Reuses 008's grade flow shape and `NotMarked`; the lease is the smallest thing that makes "one marking per attempt" true without a stored status.

**Alternatives.** *Block all `insertReplacementText`*: rejected: breaks autocorrect on phones. *Store the timer*: rejected: not required, adds a write per tick or a clock-skew case. *Reuse `unseen` handler directly*: rejected: it has two phases, a pick and word rules by suggested length; the essay flow shares helpers, not the function.

## R7. Marker (FR-027 to FR-035)

**Decision.** `lib/essay/marker.server.ts` mirrors `lib/unseen/marker.server.ts`:
- **Prompt**: `buildEssayMessages` renders `rubric.json` exactly as `scripts/pilot-essay-marker.py`'s `build_messages` does: same `{name}` single-pass substitution, same bands/criteria/concepts lines. Placeholders: `{question} {verb} {verbMeaning} {economyRule} {bands} {criteria} {markingNotes} {schoolCriteria} {concepts} {words} {essay} {maxGaps}`. **`{schoolCriteria}`** (new, with "None provided." for the new questions) and the reply field **`conceptsUsedWell`** (R9) are added to the template; `promptVersion` becomes `essay-pilot-2`, bumped on every later change. `economyRule` is derived from `economy`: china → "an essay about China (an emerging economy)", nepal → "…Nepal (a developing economy)", both → "one emerging and one developing economy; both must be treated". The band-1 model essay is **not** sent to the marker (R12: no key text beyond what the marker needs; there is no echo-from-model risk and the pilot passed without an anchor); if the gate shows systematic harshness the anchor is added and the echo guard below extended.
- **Call**: `chatCompletion({ model: getEssayGradingModel(), temperature: 0, json: true, maxTokens: 3000, timeoutMs })` (pilot used 2500; +500 for `conceptsUsedWell` and long reasons). **3000 is a starting value, not a decision**: the English markers' models reasoned to 7500 tokens and needed `max_tokens` 12000 (spec 009's gate record), so the pilot reports `finish_reason` per call and the gate (R8e) requires no cut-off replies; raise the constant in the pilot and the module together, and keep the first-call timeout consistent with the measured p95. First call 40 s, one retry while ≥ 12 s of the 55 s budget remain (008's constants); `finishReason === "length"` is a failure.
- **Parse** (`parseEssayReply`, mirrors `parse_reply` in the pilot): first `{…}` block; all five criteria with a verdict in `[strong, sound, developing, weak]` (a missing verdict is a **failure**, never a default); `band` integer 1–5; `mark` integer; `coversRequiredEconomies` boolean (required even on one-economy essays); `liftYourMark` ≥ 1 string (first two used); `bandReason` string. A missing `reason` is stored as "". Otherwise malformed → retry once → `null` (marker unavailable).
- **Post-processing** (`lib/essay/scoring.ts`, pure, shared with a Python twin in the pilot: `final_mark`): `final = clamp(mark, band.min, band.max)`; `if economy === "both" && !covers: final = min(final, 12)`; the **raw** mark is stored too. `dataFlags`: keep ≤ 5; a flag whose `quote` is not a substring of the essay (whitespace-normalised, case-insensitive) is dropped; `scrubFlagWhy` replaces any digit not present in the quote (no replacement figure, FR-031). `gaps`: concept id must be on the list (`rubric.concepts`), dedupe, ≤ 5 (`maxGaps`), `detail` trimmed to 200 chars; `conceptsUsedWell`: ids on the list, ≤ 8, minus any also in `gaps`.
- **Echo guard**: `containsModelEcho`-style check generalised to take a corpus (marking notes + school criteria): a run of 60+ characters of the notes or criteria in any reply string (not in the question or the essay) fails the reply and is retried (Principle I: key text must not reach the browser through the marker's words).
- **Logging**: `lib/essay/log.server.ts`, outcome codes only, hashed user id, question id, duration, model; never text (spec FR-035).
- **Latency vs SC-003**: the pilot records seconds per call. The route keeps `maxDuration` 60 and 008's budgets; the gate (R8) requires p95 ≤ 40 s on the 21 calls. If the chosen model is slower, raise `maxDuration` within the Vercel plan's limit and the first-call timeout together; SC-003 allows 2 minutes end to end, the client waits on one request. A client-side automatic second request after `marker_unavailable` is **not** added (the student retries), because a retry inside the route already covers a slow first call.
- **Golden fixture**: `tests/essay/prompt.test.ts` renders the prompt for a fixed question with the TS builder and compares it to `tests/fixtures/essay-golden-prompt.txt`, which `python scripts/pilot-essay-marker.py --write-golden` writes from the same `rubric.json` (and `--check` compares both); `tests/essay/rubric-drift.test.ts` fails if `rubric.json`'s `promptVersion` changes without the golden file changing. Pattern: `tests/paragraph/prompt.test.ts` and `rubric-drift.test.ts`.

**Reason.** One prompt file, two readers, a test that catches drift (the failure mode 007 already hit).

**Alternatives.** *Hand-copy the prompt into TS*: rejected (drift). *Send the model essay as an anchor now*: rejected: untested, adds length and an echo risk; keep as a gate-driven option. *Default a missing verdict*: rejected (Principle VI: never invent a mark).

## R8. Marker check, the release gate (FR-036, FR-037, SC-004)

**Decision.** The gate is the first content-dependent step and blocks every essay's `live: true`.
1. Run `--check` (offline). Then the user runs `python scripts/pilot-essay-marker.py` locally in Git Bash (3 runs × 7 essays = 21 calls, default model) and pastes `resources/topic011/runs/<ts>/report.md`; Claude reads it (OpenRouter is not reachable from the agent's sandbox).
2. **Pass bar** (all on the prompt version that ships): (a) median mark inside the labelled range for ≥ 6 of 7 essays and the majority band within one band of the label for all 7 (the spec's bar); (b) the one-economy case capped at 12 in every run; (c) every `mustFlag` figure flagged in a majority of runs and no flag on a checked-correct figure in more than 1 of the strong essays' runs; (d) raw off-list gap ids ≤ 5% of all gaps (they are dropped in code, so this is a quality bar, not a safety one); (e) ≤ 1 unparseable reply of 21; (f) p95 seconds per call ≤ 40; (g) `conceptsUsedWell` present on every parsed reply and never lists an id also in `gaps`.
3. **Tuning**: edit `rubric.json`, bump `promptVersion`, rerun **all** cases each time, record each run's report in `resources/topic011/`. Tune on the 7 essays only until they pass.
4. **Holdout**: the 7 labelled essays were written by Claude, so passing them proves little. Add a **frozen holdout of 4 more essays** (essays 1, 3 and 5 questions; bands 2, 3, 4 and a two-economy band-1-quality China-only essay), generated by Claude in a separate pass **after** tuning stops and labelled by Claude with ranges the user reviews (no student or teacher essays exist: the user cannot obtain any). The holdout is **never used to tune**; its bar is only "none more than one band from its label" and any miss is reviewed by the user before release. Held in `resources/topic011/pilot-holdout.json` (`--set holdout`).
5. **Model comparison**: run `deepseek/deepseek-v4.1-flash` (default) and `deepseek/deepseek-chat` with `--model`, 3 runs each, same prompt; choose the first that passes; if both pass choose the better on bar (a) spread. A chosen non-default is written into `getEssayGradingModel`'s default and `.env.example`.
6. **If the gate fails**: no essay goes live; the unit stays registered with all essays `live: false` (nothing shown). Remedies in order: tighten the prompt (e.g. add the model essay as an anchor, a band-ceiling reminder), try another model, then ship the unit with plan feedback only is **not** an option (the unit's point is a mark). The Tue 1 Dec date does not override the gate.
7. **After launch**: revision comes only from real student essays (copied without identifiers into `resources/` per Principle II, an offline task); stop tuning on written test essays, as in spec 007.

**Reason.** The spec's pass bar plus measures the pilot already reports; a generated holdout is weak but better than none, and its bar is lenient because it is unlabelled by anyone but the author.

**Alternatives.** *Hand-label holdout by the user in the time left*: offered as an optional upgrade, not a blocker. *Release with a note "marks are indicative"*: rejected: a 20% task.

## R9. Gaps and "Things I need to know" (FR-038 to FR-040)

**Decision.**
- **One concept list**: `lib/essay/concepts.json` (moved out of `rubric.json` during the build: `concepts.ts` is public and must not import the prompt and band descriptors) is the source: the marker prints it, the Python pilot reads it and `concepts.ts` builds from it; `content/units/y12-economics-essay-writing/concepts.ts` builds `Concept[]` from it: id `y12-economics-essay-writing.c-<key>` where `<key>` is the JSON key (`c-china-open-door`, …), `term` from the part before ":" (or the key), `description` the whole line, `clearAfter: 2`. This is a deliberate variation from "move the list into `concepts.ts`": one source readable by Python and TS; `concepts.ts` imports it as `lib/paragraph/parts.ts` is imported by 007's. The content step checks and extends the list before launch (ids once shipped are never renamed).
- **Gap vs used-well**: a gap is a miss (`correct: false`); to let a gap clear after two later correct uses (FR-040) the marker also returns `conceptsUsedWell` (concept ids the essay uses **correctly and with effect**, from the list), added to the prompt and the pilot's report (R7, R8g). The result row's `conceptOutcomes` = gaps as `{conceptId, correct:false}` followed by used-well as `{conceptId, correct:true}`; an essay with neither writes `[]` (progress then falls through to question tags, which are empty: no effect).
- **Replay** (`lib/concepts/progress.ts`): `ConceptResult.conceptOutcomes` already replays per outcome in answer order. One change: when the unit sets `conceptsClearOnOtherQuestions`, track `raisedBy: questionId` for each concept's last miss and ignore a correct outcome whose `questionId` equals it (the spec Clarification: a redo does not clear). A concept missed again on essay 3 gets `raisedBy = e3`, so a correct use on essay 1 then counts. `clearAfter: 2`: a miss sets the count to 2, each correct use on a different essay takes 1 off. `conceptReviewCounts` uses the same function (the flag is read from the unit).
- **Writing-skill gaps reuse spec 007's tips where they match**: the eight shared-skill concepts keep their own ids (progress is per unit; no `sharesProgressWith`, which would merge counts with the paragraph unit and re-pace its clearing). Where a skill matches a 007 tip (`skill-models` ↔ the mechanism tips, `skill-data-as-evidence` ↔ the evidence tips, `skill-judgement` ↔ the link tips) the concept's description **imports the wording** from `lib/paragraph/parts.ts`'s `TIPS` instead of retyping it, so one sentence says one thing in both units. Mapping the ids and showing 007's tip cards in this unit is not done (different clear-after, different parts).
- **The "what was missing" line**: stored per attempt in `essay_phases.gaps` as `[{ conceptId, detail }]` (≤ 200 chars, the marker's sentence). It is shown (a) on the result page under "Added to Things I need to know" (up to 5, most important first, each "**<concept term>**: <detail>"), and (b) on the unit page's "Things I need to know" as a second line under each uncleared concept, taken from the **latest** finished essay row whose `gaps` include it (`latestGapDetails(db, userId)` → `Map<conceptId, detail>`, passed to `ConceptPanel` as an optional `details` prop; units without it render as before). If no stored detail exists (the concept was missed on an essay since removed) only the description shows.

**Reason.** Keeps tracking on the existing, tested replay; the only new rule is one conditional; detail lines come from the student's own stored rows (no key text).

**Alternatives.** *Move the list to `concepts.ts` and generate JSON for Python*: rejected: a build step for one file. *`sharesProgressWith` the paragraph unit*: rejected: merges two clear-after regimes. *Count every later essay, redo included*: rejected by the Clarification.

## R10. Unit page and progression (FR-001 to FR-005)

**Decision.** The student **picks** an essay (spec US1: "picks an essay"); there is no random draw and `lib/attempts/sequence.server.ts` (007's essay-parts order) is not used. The unit page (server component) lists the live essays sorted by `offer` (e1, e3, e5, e2, e4, e6), each card showing the question with its verb highlighted, the economy tag, the source for trial essays, and the **latest mark** ("14 / 20 · band 2") from `loadEssayProgress(db, userId)` (latest `results` row per question id by `created_at`, joined to `essay_phases` for the band). A card's button: **Start** (no result yet), **Redo** (has a result), **Resume** (the open attempt's essay); every other card's button is disabled with "Finish or discard your open essay first" while an attempt is open (the server also refuses: `409 attempt_open`). **Discard this attempt** (S2) is a secondary action on the open card while unmarked, behind a confirm. A "Next up" label marks the first live essay in offer order with no result. Non-live essays are not listed (spec FR-005). A student with no live essays sees "Essays are being checked and will appear here." (the unit is not shown on the home page until at least one essay is live; `content/index.ts` registers it only then, 009's pattern).

**Start/resume** is `POST /api/attempts { unitId, questionId? }` (contracts A): with `questionId` it starts that essay (or returns `409 attempt_open` with the open essay's id); without it, it resumes the open attempt (`404 no_open_attempt` when none). The quiz page for an essay unit takes `?essay=<id>` and calls the same route. Rate limit: the existing `checkAttemptRateLimit`.

**Reason.** The exam gives an unseen question, but the plan's practice value is choosing which economy to rehearse; the spec's offer order is guidance, shown by "Next up". An unreadable database is a 503 (the unit never guesses).

**Alternatives.** *Forced next essay*: rejected: spec US1 says the student picks, and a Nepal-only revision session is legitimate. *A random draw like 008*: rejected for the same reason.

## R11. Result page and attempt detail (FR-032)

**Decision.** One `EssayResult` component serves the post-marking screen and `/attempts/[attemptId]` for a finished attempt (`components/essay/Result.tsx`, `AttemptDetail.tsx`), built from `resultView(row, modelEssay)` (`lib/essay/views.ts`; the only place that adds `modelEssay`, called only for a finished row owned by the session user). Order: summary ("**14 / 20** · Band 2"; capped marks show "Capped at 12: the essay treats only one economy" — text, not colour); five criterion rows, each with a **word badge** (Strong / Sound / Developing / Weak with a distinct icon and shape) and the marker's reason; "To lift your mark" (two items); "Check this figure" flags (each shows the student's quoted words and the reason; none states a number); a two-column block (CSS grid `repeat(2, minmax(0, 1fr))` from 900 px, stacked below) with "Your essay" and "Your plan" (read-only); the band 1 model essay (collapsible, closed by default so the page doesn't open with 700 words); "Added to Things I need to know" (gaps, ≤ 5); "Back to essays". The summary takes focus on arrival (spec 006's pattern). Verdict colours are tokens from `styles/tokens.css` and every verdict also carries its word and icon.

"Your results" (`components/AttemptHistory.tsx`) shows "Essay 3 · Nepal" with date, mark/20 and band, linking to the detail page. An **unfinished** attempt's detail shows the plan and the draft only (never the model essay), by the same builder returning `modelEssay: undefined` unless `status='finished'`.

**Reason.** One view builder means one place that can release the model essay.

**Alternatives.** *Show the model essay open*: rejected: pushes feedback below a 700-word block at 390 px.

## R12. What reaches the browser, when (Principle I; FR-041 to FR-043; SC-006)

**Decision.** Fields by response (contracts/api.md has the shapes). The key (`markingNotes`, `schoolCriteria`, `modelEssay`, `concepts` tags) is read only in `lib/grading.server.ts` exports: `essayView(questionId)` (public view), `essayKeyForMarker(questionId)` (notes + criteria + tags, for the marker only), `essayModelEssay(questionId)` (called only from `resultView`).

| Response | May carry | Never |
|---|---|---|
| Unit page / `POST /api/attempts` | public question (id, prompt, verb + definition, economy, offer, source, live), open attempt state, scaffold (own), draft (own), results summary (mark, band) | key fields |
| Start / resume | + `essayState` (stage, scaffold, locked, review if any, draft) | key fields |
| Scaffold save / start | `{ saved, words }` or `409 scaffold_locked`, `400 scaffold_invalid` | key fields |
| Review | seven check lines + figure flags (own scaffold quotes) | key fields |
| Draft save | `{ saved }` | key fields |
| Grade success | verdicts, reasons, band, marks, lift points, flags, gaps, used well, (via `resultView`) the **model essay** with the finished row | notes, school criteria, tags |
| Grade not-marked / errors | `{ notMarked }`, error codes | key fields, mark |
| Attempt detail (finished) | as grade success | notes, criteria, tags |
| Attempt detail (unfinished) / Discard | plan, draft / `{ discarded }` | **model essay** and key |

The client sends only what Principle I (R1) lists: never a user id, mark, band or word count (the server counts). `tests/no-key-leak.test.ts` gains: BANNED_KEYS `schoolCriteria`, `modelEssay` (outside the result), `essayKey`, `markingNotes` (existing); a loop over **every essay of this unit** (live or not) that starts an attempt, saves a scaffold, starts writing, saves a draft, and scans every response (start, resume, unit page data, scaffold, draft, unfinished detail, not-marked, over-cap) for any string of the key (substring of notes, criteria, the model essay and each tag), then marks with the fake marker and asserts the model essay appears **only** in the grade response and the finished detail; a shipped-output scan (008's `no-key-leak-shipped`) over `.next/static`. **Attempt ownership**: every handler gets the attempt via `getAttemptForUser(db, user.id, attemptId)` and verifies the signed attempt token (`verifyAttemptToken`), as 007–009.

**Alternatives.** *Release the model essay at the page after scaffold lock*: rejected: it is the answer.

## R13. Content tooling and the content task

**Decision.** Format and validation are in code (R2); the research is a separate content task described in [content-prompt.md](content-prompt.md) (per essay: the school's criteria transcribed from the solutions of Barker 2024 Q27, Sydney Boys 2020 Q27 and Abbotsleigh 2025 Q28, marking notes, a 600–800-word band 1 model essay with checked contemporary figures carrying years and sources, concept tags from the list, a check and extension of the list). Qwen drafts, Claude reviews each stage; an essay is set `live: true` only after the user approves it in the review report **and** the marker gate has passed. Order: 1, 3, 5 (S1), then 2, 4, 6 (S2). The model essay is also marked with the real marker (3 runs): it must reach band 1 on the majority of runs, with no wrong-figure flags, as 009's step 10 does for model answers. Source figures go in `resources/topic011/figures.md` with the link and date, so a flagged figure can be traced.

**Reason.** Keeps research out of the code path; the gate and the model-essay check are the two automated trust points.

**Alternatives.** *Generate model essays in the app*: rejected (Principle III: no LLM-written quiz content at runtime).

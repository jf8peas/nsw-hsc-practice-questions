# Research: Advanced English Comparative Short Answers (spec 009)

All 13 items from `plan-prompt.md`. Each has the decision, the reason and the alternatives rejected. File
and function names are the ones in the code today (read, not guessed). "008" means
[specs/008-english-unseen-short-answers/](../008-english-unseen-short-answers/).

---

## R1. Constitution check and amendments (the first task)

**Decision.** One amendment, **2.15.1 → 2.16.0 (MINOR)**: guidance in Principles I, II, V, VI, VII and
the Quality Gates is extended from "the unseen-text unit" to "the unseen-text units (specs 008 and 009)",
and Principle I and II gain the one new client-to-server field and stored field (the pick). No principle
is removed or weakened. Amend first, before any code (task T001), because the existing wording names
"the unseen-text unit", "seven" verdicts and one text per question, so code written first would break
the constitution as written. Principles III, IV, VIII and IX need no change (shown below).

### Exact text

Date line and version: `Version: 2.16.0`, `Last Amended: <the real date the task runs>`. Amendment log entry, to be placed above the 2.15.1 entry:

> - Version change: 2.15.1 → 2.16.0 (MINOR: guidance in Principles I, II, V, VI and VII and the Quality Gates extended to a second Advanced English unit, the comparative short-answer unit, and one new student-chosen field, the pick of texts).
> - Reason (amendment log): the comparative unit (spec 009) is spec 008 with two texts per question. It reuses 008's stimulus texts and cropped images, marker pipeline, no-self-marking rule and model setting, so the wording that named "the unseen-text unit" now names both units. A choice question lets the student choose which allowed texts to write about; the choice is a list of text ids from the question's own public allowed set, re-checked by the server, stored with the attempt so the marker can be revised from real use. Nine skill verdicts replace seven in this unit. Nothing new is released earlier than in 008: the key is still server-only and the model answer is released at the discussion only.
> - Modified principles: I (the comparative unit's release schedule; the pick on the pick-save and grade routes; the image route's id checked against the shared text store); II (the comparative phase row, nine verdicts and the pick); V (the cropped-image exception covers the shared store); VI (both units never self-marked; both need the database); VII (the model setting also serves the comparative unit); Quality Gates (leakage and testing bullets).

**Principle I.** In the answer-submission-routes bullet, after "…for the unseen-text unit's retry-decline
route, `attemptId`, `questionId` and the signed attempt token;" insert:

> for the comparative unit's pick-save route, `attemptId`, `questionId`, the signed attempt token and `pick` (a list of text ids, each re-checked by the server against the question's allowed texts), and for its grade route the same `pick` beside the fields above on the first try;

In the "Other routes MAY take from the client only resource identifiers" bullet change "the text id of an
unseen-text unit's stimulus image, which the server checks against the unit's texts" to "the text id of an
unseen-text or comparative unit's stimulus image or text page, which the server checks against the shared
text store and the student's attempts". The pick route is an answer-submission route (it is named in the bullet above, not in the "other routes" bullet). After the 008 `[DECISION]` bullet add:

> - [DECISION] The comparative short-answer unit (spec 009) follows the unseen-text release schedule above, with two or more texts per question and nine skills. Before the first try is marked: nothing from the key (the texts a question shows, every allowed text of a choice question, the question, its marks, its source and the line that a choice question's model answer shows one pairing are public content). After a try is marked: the nine per-skill verdicts, the marker's one-line reasons, its feedback and its biggest-gap sentence (never model-answer text). At the discussion: the model answer and, for a choice question, the pairing it uses. Never, at any moment, including reload, resume and the attempt detail page of an unfinished question: the marking criteria, the marking notes, any visual text's written description, or the model answer before the discussion. The pick is the student's own choice and may be shown back to them at any step. Key material MUST come through functions exported from `lib/grading.server.ts`.

**Principle II.** After the "per unseen-text question in an attempt (spec 008)" bullet add:

> - per comparative question in an attempt (spec 009): everything stored for an unseen-text question, with nine per-skill verdicts instead of seven and the pick (the text ids the student chose, on a choice question), kept in the same phase row (the pick is also held in the draft row until the first try is submitted); deleted with the student like results. Verdicts, reasons and the pick never change marks or concept tracking, which come from the first try's verdicts.

and in the existing 008 bullet change "the seven per-skill verdicts" to "the per-skill verdicts".

**Principle V.** In the visual-stimulus exception change "[DECISION] While the app is non-commercial, a
visual stimulus text of an unseen-text unit (spec 008)" to "…of an unseen-text unit or the comparative
unit (specs 008 and 009)" and "it MUST be committed only under that unit's own `images/` folder" to "it MUST
be committed only under the `images/` folder of the unseen-text unit that stores texts (spec 008's, shared
with spec 009's unit)". The credit, authenticated-route, no-HSC and remove-before-commercial conditions are unchanged.

**Principle VI.** Change "[DECISION] The unseen-text short-answer unit (spec 008) is never self-marked…"
to "The unseen-text and comparative short-answer units (specs 008 and 009) are never self-marked…" and
"The unseen-text unit cannot start, resume, mark or save a quiz without the database" to "The unseen-text
and comparative units cannot…". The behaviour described is unchanged; a choice question's pick is another
thing the database holds, so the same rule covers it.

**Principle VII.** Change "`ENGLISH_ADV_GRADING_MODEL`… It is the model the unseen-text unit marks with"
to "…the model the unseen-text and comparative units mark with" and "`REMARK_MODEL`… unseen-text answers"
to "unseen-text and comparative answers". If the marker gate (R7) forces its own model, that is a
separate later amendment (2.16.1 or 2.17.0) written with the new variable name; this plan assumes it is not needed.

**Quality Gates.** Leakage bullet: "the unseen-text unit's marking criteria…" becomes "the unseen-text and
comparative units'…". Testing bullet: "the unseen-text unit's marker failure…" becomes "the unseen-text
and comparative units' marker failure… and a shared skill's concept count clears after 2 first tries in any mix of the two units".

### Check that nothing else is needed

| Principle | Result |
|---|---|
| III Content is code | Question ids never reused; the new unit's ids are `y12-english-advanced-comparative-texts.<paper>-q<n>`. No change. |
| IV Validation gates the build | New unit rules extend `validate-content`; no change. |
| VIII Simplicity | No new runtime dependency (tabs, pick chips and shared progress are plain React and TypeScript). No change. The 008 `localStorage` highlight store is reused unchanged (already flagged at 008; unchanged here). |
| IX Teacher access | Admin pages list nothing new. No change. |

**Reason.** The constitution overrides other docs, and its unit-by-unit wording is how 008's key rules were
bounded. A single MINOR amendment that widens each bullet is smaller and safer than a second parallel set of bullets.

**Alternatives rejected.** (a) *No amendment, "unseen-text unit" read loosely*: the pick is a new client
field on a submission route and Principle I lists those exhaustively, so this would break the rule as written.
(b) *A new principle for the comparative unit*: duplicates 008's bullets and invites drift. (c) *A MAJOR bump*: nothing is removed or weakened.

---

## R2. Unit shape and shared texts

**Decision.**

- **Unit id** `y12-english-advanced-comparative-texts`, folder `content/units/y12-english-advanced-comparative-texts/`
  with `meta.ts`, `questions.ts`, `keys.ts`, `answers.ts`, `concepts.ts`, `texts.ts` (a filter, below).
- **The shared text store stays in 008's unit folder** (`content/units/y12-english-advanced-unseen-texts/`): texts,
  `images/`, `descriptions.ts`, `description-checks.ts`. Texts for 009 that 008 does not have are extracted into
  that same store (a text is stored once, whichever unit asks for it). The generator writes a new
  `store-texts.ts` (every text from every bank file, both units) and each unit's `texts.ts` becomes a filter that
  returns the store's texts its own questions use. `content/index.ts` keeps assigning `texts` per unit from
  those filters, so `Unit.texts` stays "the texts this unit shows", which is what the validators, the text page and
  the tabs already read. **Rejected:** moving the store to `content/shared/` (every existing image path, the image
  route, Principle V's "own `images/` folder" wording, 008's tests and 114+ committed content paths change for
  no gain), and duplicating texts into 009's folder (breaks "stored once" and doubles the description checks).
- **Images and descriptions.** `/api/unseen/image/[textId]` and `findVisualText` look the text up in the store
  (`images.server.ts` reads `store-texts` instead of `getUnit(UNIT_ID).texts`), so one route serves both units.
  A visual's description and its adequacy check are keyed by **text id** already (`descriptions.ts`,
  `description-checks.ts`), so they are shared for free; `answers.ts` of each unit copies the entries for the
  visual texts its questions show into the key (as 008's `answers.ts` does).
- **Resolution check.** `validateComparativeRules` (new, `lib/content-rules.ts`) requires every id in a
  question's `textIds` to resolve in the unit's filtered texts (which, by construction, are the store texts the
  questions name), plus the rules in R12. 008's rule "no question points at this text" is unchanged for its own
  filtered list. A text used by no question in either unit is reported by the generator (`unseen-report`), not by
  the unit validators, because neither unit sees the other's questions.
- **Question type.** A new type `"comparative"` (not `"unseen"` with an array), so 008's single-text type,
  validator, grade handler and tests stay exactly as they are and the two can be told apart by `type`.

  ```ts
  interface ComparativeQuestion extends BaseQuestion {
    type: "comparative"; group: "comparative";
    textIds: string[];                 // every text shown, in tab order: fixed first, then choosable
    choice: null | { fixed: string[]; from: string[]; pick: number };  // null = fixed pair
    verb: string; parts?: …; maxMarks: number;   // 3 to 8
    suggestedWords: number; suggestedFrom: "lines" | "median";
    paper: UnseenPaper;                // qNo widened to 1 | 2 | 3 | 4 | 5
    outcome: "EAV-12-01" | "EAV-12-02" | "EAV-12-04";
    concepts: string[];                // 1 to 3 of the nine skill concept ids
  }
  ```

  `textIds = [...fixed, ...from]` for a choice question; for a fixed pair `textIds` is the two named texts.
  Public (Principle I): everything above. **Key** (server-only, `keys.ts`): `criteria`, `notes`, `model`,
  `modelOrigin`, `criteriaOrigin`, `reviewedOn`, `pairing: string[]` (the text ids the model answer uses; for a
  fixed pair equal to `textIds`), and for each visual among `textIds` a `visuals[textId] = { description, check }`.
  Every allowed visual needs an adequate description, not only the pairing's, because a student may pick it.

**Reason.** The store and its generator already exist and everything that reads texts reads `Unit.texts`; a
filter keeps that contract. A separate type isolates 008.

**Alternatives rejected.** Generalising `UnseenQuestion` to `textIds[]` (touches 008's questions, key, state,
grade handler and ~40 tests for no benefit while 008 is shipped and live); one unit with both kinds of question
(spec 009 requires its own unit id, skills, results and unit page).

---

## R3. Text-only page across units

**Decision.** This unit's links use **its own unit id**: `/unit/y12-english-advanced-comparative-texts/text/<text>?attempt=<id>`.
The page's lookup stays "the text in `getUnit(unitId).texts`" (the unit exposes every text it shows, so every
allowed text of a choice question is openable). The access check changes from "an attempt in this unit on a
question using the text" to **"an attempt in any unit on a question that shows the text"**:

- `hasStartedText(db, userId, textId)` (was `(db, userId, unit, textId)`) collects, across **every unit whose
  `texts` include the id**, the ids of questions that show it (`q.textId === textId` for 008, `q.textIds.includes(textId)`
  for 009), then runs one query: attempts for this user whose `unit_id` is in those units and whose `question_ids`
  overlap those ids.
- `attemptUsesText(db, userId, attemptId, textId)` does the same with `attempts.id = attemptId`, so a highlight link
  from either unit's quiz is accepted. It does not require the attempt to be in the unit named in the URL.
- A choice question counts every allowed text, picked or not (spec FR-006), because `q.textIds` is the full allowed set.
  A fixed pair counts both.
- Unknown unit, unknown text, a text not in that unit's list, and no attempt all answer the same 404 (as 008).
- The page has no question, key, description or pick; the `no-key-leak` test that the page imports no key module is kept.

**Reason.** The text is the same text; the student who has met it anywhere may reopen it. Using this unit's
id for links keeps the page's existing "text is in this unit" lookup correct for a text only 009 shows.

**Alternatives rejected.** Always linking to 008's unit id (404 for texts 008 never shows, and 008's page would
need to know 009's questions); a new route (`/unit/.../compare-text/...`): duplicates the page, access rule and tests.

---

## R4. Tabs

**Decision.** A `TextTabs` component (`components/unseen/TextTabs.tsx`) renders the WAI-ARIA tabs pattern around
**one `TextPanel` per text** (008's component, unchanged except it already takes `openHref` and `highlight`):

- `role="tablist"` with one `role="tab"` button per text, `aria-selected`, `aria-controls`, `tabIndex` 0 on the
  selected tab and -1 on the rest (roving tabindex); `←`/`→` move and select, `Home`/`End` jump, activation follows
  focus. Each panel is `role="tabpanel"` with `aria-labelledby`. Labels are the text's `heading` as on the paper
  ("Text 4 – Poem"); the selected state is shown by a bar and weight as well as colour (FR-035).
- The open-in-a-new-tab icon and highlighter toggle belong to each text's panel header (they already live inside
  `TextPanel`), so each text opens alone and highlights separately.
- **All panels stay mounted**; inactive ones get the `hidden` attribute. This keeps each text's highlight state,
  BroadcastChannel subscription and zoomed image alive while the student switches, and nothing reloads.
- The tabs sit above the question and answer box in document order, so the box never moves when a tab changes
  height. On a phone (390 px) the tab strip scrolls horizontally inside its own container if labels do not fit; each
  tab is at least 44 px high; the page itself never scrolls sideways. At every width the texts are a single column.
- Tab choice is UI state only (not stored). A choice question's tabs show every allowed text; a small "picked" badge
  (text, not just colour) marks the picked ones once chosen.
- `UnseenPanel` stays as it is for 008. A sibling `ComparativePanel` composes `TextTabs`, `Writing` (008's answer box,
  meter, marking states) and a new `PickChips`, so the answer box component is reused, not copied.

**Alternatives rejected.** Side by side (decided against in the spec); an accordion (the answer box would move);
unmounting inactive panels (loses highlight sync and zoom).

---

## R5. The pick

**Decision.**

- **UI.** `PickChips`: one toggle button per allowed text (the fixed text is shown as already included and is not a
  chip). `role="group"` labelled by the question's wording ("Choose ONE other text"), each chip `aria-pressed`, at
  least 44 px. Submit is disabled with a note until exactly `choice.pick` texts are chosen from `choice.from`. Typing is
  never blocked, and changing the pick keeps the answer text (spec edge case).
- **Saved at once.** A new route `POST /api/comparative/pick` (`{ attemptId, attemptToken, questionId, pick }`) writes
  the pick to **`rewrite_drafts.picked_text_ids text[]`** (the existing draft row, created on first save; one new nullable
  column). The client calls it when the pick becomes complete or changes (debounced 400 ms, plus `sendBeacon` on page hide
  like 008's draft). A pick that is not complete is not sent (nothing to save), so a resume shows the last complete pick.
- **Fixed on first submit.** The first-try grade request carries `pick`; the grade handler validates it, stores it as
  **`unseen_phases.picked_text_ids text[]`** in the same transaction as the try-1 insert, and from then on the phase row
  is the source of truth. The draft's pick is ignored once a phase row exists.
- **Retry.** Read-only chips showing the stored pick. The retry's grade request carries no `pick`; if it does, a value
  different from the stored one is rejected `409 pick_changed`; an identical value is accepted.
- **Server checks** (grade handler and pick route): `pick` must be an array of distinct strings; every id must be in
  `choice.from`; the length must equal `choice.pick`; on a fixed pair `pick` must be absent or empty (the pair is the texts);
  a stored first-try pick cannot change; the attempt must be the user's and the token valid (Principle I). Incomplete
  or disallowed → `400 invalid_pick`; changed on retry → `409 pick_changed`. These are rejection codes, not marks.
- **What reaches the marker**: `picked = [...choice.fixed, ...pick]` (or `textIds` for a fixed pair), rendered in tab
  order; an unpicked allowed text is never in the prompt (a test proves it by prompt content). A visual picked text is sent as its description.
- **Alternatives rejected.** Storing the pick only in `localStorage` (not restored on another device, spec says so);
  a new table (one nullable column on each existing row is simpler, and both rows are already per attempt and question);
  allowing the pick to change on the retry (spec forbids it); inferring the pick from the answer text.

---

## R6. Marker

**Decision.** Generalise `lib/unseen/marker.server.ts`, do not fork it:

- `UnseenMarkerInput` gets `texts: MarkerText[]` (each `{ heading, form, title, author, text }`, `text` being the
  stimulus or the visual's description) beside the existing single `text`; the single-text callers build a one-item list.
  `markWithModel(input, rubric = unseenRubric)` takes the rubric (prompt file, verbs, skills) as a parameter. A new
  `lib/comparative/rubric.json` (server-only, like `lib/unseen/rubric.json`) is the comparative prompt, with
  `promptVersion: "comparative-pilot-1"` (bumped on every change; a golden-hash test fails otherwise, as 008's does).
- **The prompt file** is 008's with: the nine skills (the two comparison skills with their met/missed definitions from the
  spec, including "writes each text in turn then compares only at the end → missed" and "one text analysed closely, the other
  only mentioned → missed"); the directive verb `compare`: "Show how things are similar or different." (NESA) and the
  reading of Girraween's "most effectively" as `evaluate`; skill 1 widened to "uses the texts the question requires"; the
  instruction that the model answer is **an example of the standard, not of the texts to use**, that an answer must never be
  marked down for choosing a different allowed text, and that the answer is judged against **the texts supplied only** (material
  about any other text is off-task and skill 1 is missed if the supplied texts are not covered).
- **Skills.** `lib/unseen/skills.json` gets two entries (`compares-texts`, `treats-both-in-depth`) with `scope: "comparative"`; the
  seven keep their ids and `scope: "both"`. `lib/unseen/skills.ts` exports `SKILL_IDS` (seven, unchanged for 008) and
  `COMPARATIVE_SKILL_IDS` (nine); `SkillId` becomes the union of nine. 008's parser still requires its seven; the comparative
  parser requires its nine.
- **Parsing.** `parseUnseenReply(raw, maxMarks, skillIds)` takes the skill list. A missing or non-boolean verdict for any
  of the nine is a malformed reply and is retried like any other (008 FR-015); a missing reason is "" as in 008, and the
  008 repair rules (fill missing feedback or biggest gap from reasons, log `reply_filled`) apply unchanged.
- **Echo guard.** 008's guard (reject a reply that repeats a long run of the model answer) applies unchanged. A reply that
  names an unpicked text is **not** rejected (the marker may legitimately say what the answer should have covered); the
  prompt rule and the skill-1 verdict handle it. This avoids false rejections.
- **Model.** `ENGLISH_ADV_GRADING_MODEL` (via `lib/config.server.ts`) unless the R7 gate fails; then a new `COMPARATIVE_GRADING_MODEL`
  (server-only, in `lib/config.server.ts`, `.env.example` and the README env table, never falling back to `GRADING_MODEL`) and
  a Constitution patch. Until the gate says so, no new variable.
- **Budget.** Read the text lengths: two stimulus texts plus the answer make the *input* about 1.6 × 008's, which `max_tokens`
  does not cap. The reply gains two verdict lines and a longer biggest gap, so `MAX_TOKENS` rises by 2/7 of the verdict share
  (task: measure on the pilot, set it with 25% headroom over the longest observed reply, and log truncation, which 008
  already does as `reply cut off at max_tokens`). Timeouts (`FIRST_CALL_TIMEOUT_MS` 40 s, 008's budget and retry margin) stay;
  the pilot reports p95 latency, and the task raises them only if p95 exceeds the first-call timeout. The "within 1 minute for 95%" criterion is the measure.
- **Alternatives rejected.** Forking `marker.server.ts` into a comparative copy (two parsers and two repair paths to keep in
  sync); concatenating both texts into the existing single `text` field (the marker could not tell which text a quotation
  came from, and the pick/visual handling would be string work); embedding the skill list in the unit's code instead of one skills file.

---

## R7. Marker check, the release gate

**Decision.** Extend `scripts/pilot-unseen-marker.py` with **`--unit comparative`** (default `unseen`, so every
008 invocation and golden fixture is unchanged). With `--unit comparative` the script reads `lib/comparative/rubric.json`,
`resources/english-unseen/pilot-comparative.json`, the nine skills, its own golden prompt and rubric-hash fixtures
(`tests/unseen/golden/comparative-*`), builds multi-text messages exactly as `marker.server.ts` does (the two scripts are
kept in lock-step by the same golden-prompt test that guards 008), and reports tuning, holdout and field separately.

- **The pilot questions** (`pilot-comparative.json`, gitignored `resources/`): about 8 questions across forms, 5 fixed pair and
  3 choice, chosen from the bank sources, including at least one poem + visual, one prose + non-fiction, one 3-mark and one
  8-mark. Texts, criteria, notes and school sample answers are verbatim from the papers.
- **Labelled answers**: for each question, answers at each mark band (low, mid, high, full), plus for each of 4 questions an
  **"each text in turn, one comparing sentence at the end"** answer (expected: *Compares the texts* missed) and a **"one text far
  deeper than the other"** answer (expected: *Treats both texts in depth* missed), and for each choice question one answer that
  picks a different allowed pairing from the model's at full standard (must not be marked down).
- **Who writes and labels them.** There are no students or other markers to ask. Claude writes the answers, anchored on the
  schools' sample answers where they exist (as in 008), and labels each with an expected mark range and expected missed skills;
  the user reviews every label before the gate runs, as they did for 008. The review report lists each answer, its label and
  its source (school sample, or authored) so the user can see which labels rest on a school mark.
- **Holdout** (never tuned to, frozen before any tuning, noted in the data file): St George Girls 2025 Q5 and Cheltenham Girls 2023 Q1,
  with answers at several bands each.
- **Runs and bar.** 3 runs each; majority mark inside its labelled range for ≥ 90% of tuning answers and ≥ 80% of holdout answers,
  none more than 1 away; every labelled one-text-then-the-other / one-text-deeper answer misses its skill (majority of runs);
  false docks on the "full-mark, different pairing" answers reported (target 0); p95 latency reported.
- **When.** It is the first content-dependent step: tasks order it **before** the bank is built for release, right after the tooling
  and pilot data exist, so a failure is found while prompt changes are cheap.
- **What blocks if it fails.** The prompt is revised (tuning only; every change reruns everything; holdout is read, never tuned to).
  If it still fails with `ENGLISH_ADV_GRADING_MODEL` and a stronger model passes, the unit gets `COMPARATIVE_GRADING_MODEL` (R6) and the
  Constitution patch. Until it passes, no comparative question may get `reviewedOn` (008's pending mechanism: drafted questions
  without `reviewedOn` are not built into the unit), so the unit has no questions and is not listed (R9). The ship-gate task
  re-runs the gate as its last step.
- **After release.** `--set field` and `npm run unseen-remark` / `unseen-field-cases` generalise to the comparative unit (R10), with
  the field set reported separately, as 008.

**Gate result (2026-11-21):** passed on `comparative-pilot-2` with the same model (`ENGLISH_ADV_GRADING_MODEL`): tuning 34/36, holdout 13/13, comparison skills caught 10/10 and 4/4, no false docks; `comparative-pilot-1` failed the holdout on one answer. Full record in quickstart.md §2a. No `COMPARATIVE_GRADING_MODEL` is needed.

**Alternatives rejected.** A separate pilot script (duplicates ~570 lines of request, parse, report and golden code); gating on tuning only; asking students to write
labelled answers (not available).

---

## R8. Shared skill progress

**Decision.** One count per shared skill across both units, **derived** (progress is never stored), by replaying both units'
first-try outcomes in time order.

- `lib/concepts/progress.ts` keeps `conceptProgress(unit, results)` for every other unit. A new
  `sharedConceptProgress(unit, resultsByUnit)` merges the result lists of the unit and of the units named in a new public meta
  field `sharesProgressWith: string[]` (008's meta gets `["y12-english-advanced-comparative-texts"]` and 009's gets
  `["y12-english-advanced-unseen-texts"]`), sorts them by `answeredAt` then `id` (the existing order), and applies each result's
  `conceptOutcomes` (every unseen and comparative result already stores per-skill outcomes from the first try's verdicts, so no
  question-tag lookup is needed) exactly as the existing replay does (`clearAfter: 2`, miss sets to 2, a show takes 1). The returned
  states are then filtered to the **unit's own concept list**: 008 shows its seven; 009 shows its seven shared plus the two comparison skills.
  Because comparison-skill outcomes exist only in 009 results, they are tracked only from 009's first tries without any special case.
- **Concept ids.** The shared seven keep **008's concept ids** (`y12-english-advanced-unseen-texts.c-<skill>`) and appear in 009's
  `concepts.ts` under those same ids (a unit's concept list may name ids from another unit when `sharesProgressWith` is set; validation
  requires every shared id to exist in the named unit). `lib/content-rules.ts` today requires every concept id to start with `<unit-id>.c-` (line 51); that rule is relaxed only for ids belonging to a unit named in `sharesProgressWith`, and the task that adds the shared ids changes it, with a test that a foreign id from any other unit still fails. The two new skills are `y12-english-advanced-comparative-texts.c-compares-texts`
  and `….c-treats-both-in-depth`, each `clearAfter: 2`.
- **Where tips live.** `lib/unseen/skills.json` (public): seven unchanged plus the two new entries with `tip` and `description`; the concepts
  files read the same JSON, so a tip can never differ between units or the prompt.
- **Call sites** (all found by grep today): `lib/db/queries/concepts.server.ts` (unit page and home counts), `lib/concepts/weighting.server.ts`,
  `app/api/units/[unitId]/concepts/status/route.ts`, `…/ensure/route.ts`, `lib/unseen/start.server.ts` (draw weights) and
  `lib/db/queries/unseen-progress.server.ts`. They switch to a single helper `loadConceptProgress(db, userId, unit)` that calls
  `listUnitResultsForProgress` for the unit and each shared unit and returns `sharedConceptProgress`. `conceptReviewCounts` (home) uses the same merge
  for these two units.
- **Effect on 008.** A miss in 009 now puts the skill in 008's "Things I need to know" and in its draw weights, and a clear in either unit clears both. 008's
  tests that assume progress comes from 008 results only keep passing (no 009 results exist in them); one new test proves the merge, in both directions.
  The concept-review (explanatory text) feature is not used by these units.

**Alternatives rejected.** Copying results between units (stored duplicates, breaks "never stored"); a second skill-id set for 009 (progress would not be shared);
giving the two comparison skills a count in 008 (008 has no such skill).

---

## R9. Draw and repeats

**Decision.** Reuse `lib/unseen/draw.ts`; generalise its question type to `{ id: string; concepts: string[] }`
(a structural type both question types satisfy) and pass **`formOf = () => null`** for this unit, so `formWeight` is the constant 10 for
every question and the remaining weight is `10 × (2 + uncleared skills)` (new draws) and that times `markWeight × ageWeight` (repeats), i.e. the
008 formulas with the form factor flattened. Nothing else in the draw changes: unanswered first, then repeats, never one of the last 3 quizzes, the small-bank rule, a
question left unfinished offered first.

- **Pending first** means the open attempt for this unit (`getLatestIncompleteAttempt(db, userId, unitId)`), whatever step it is at: the pick, the first try,
  the retry choice or the retry. `loadComparativeState` returns the step and the saved pick and drafts.
- **Start** is `startComparative` in `lib/comparative/start.server.ts`, written as a thin variant of `startUnseen` (it shares `draw.ts`, `createUnseenAttempt` and the
  shared progress helper; only the question list, the weights and the state loader differ). To avoid copying, `start.server.ts` is refactored to a
  `startDraw(config)` helper both units call (task: extract with 008's tests as the safety net).
- **Unit page "Your results".** `loadComparativeProgress` returns, for `fixed` and `choice`, `{ total, answered, average }` using each question's latest
  recorded mark (as `loadUnseenProgress` does) with "Not tried yet" when none; no text-form rows. `UnitProgress` renders the two rows from this shape
  (008's form rows stay in 008's component, selected by the unit's `draw.kind`, now `"comparative-weighted"` for this unit).
- **Unit listed only with questions.** The unit ships with its code before the bank is released; the home page and `getUnits()` already list units from content, so a task
  verifies (and if needed adds) that a unit with zero questions is not offered a Start button; with the bank held back the unit does not appear.

**Alternatives rejected.** A separate draw module (copy of repeat logic); keeping the form weight with a single form per question (spec drops it).

---

## R10. Persistence and resume

**Decision.** Reuse `unseen_phases` and `rewrite_drafts` and add three things in one migration (`drizzle/0008_*.sql`, generated by `drizzle-kit` from `schema.ts`):

1. `unseen_phases.picked_text_ids text[]` (nullable; set on a choice question's first try) and `rewrite_drafts.picked_text_ids text[]` (nullable; the draft pick).
2. The check `unseen_phases_max` widened from 1–6 to **1–8**, and `unseen_phases_try2_mark` is unchanged (`maxMarks - 1`). `SkillVerdicts` widens to the nine-skill record
   (jsonb, no SQL change). A new check `unseen_phases_pick_shape`: `picked_text_ids is null or cardinality(picked_text_ids) between 1 and 2`.
3. A second partial unique index `attempts_comparative_incomplete_unique` on `(user_id)` where `unit_id = 'y12-english-advanced-comparative-texts' and completed_at is null`, so two
   tabs starting at once end on one attempt, as for 008. (One open attempt per unit; a student may have one open in each.)

- **Why reuse.** The phase row's shape (two tries, verdicts, feedback, biggest gap, go-further, versions, ending, recorded mark) is identical; `unit_id` already
  separates units; results, history, the retention job, `delete-student` and the daily-limit slots already work on it. The attempt row and result row (concept outcomes) are unchanged.
- **Resume.** `loadComparativeState` mirrors `loadUnseenState`: from the phase row, the draft row and the open attempt it returns the stage (`write`, `choice`, `retry`, `discussion`), the drafts, the pick (from the
  phase row, else the draft row), the daily-limit flag and `repeating`. The database being unreadable returns `unavailable`, never a guessed step (Principle VI).
- **Delete-student and retention.** Both columns are in rows already deleted by cascade on `users.id` and by the retention job's attempt deletion; `scripts/delete-student.ts` and its test
  gain a case with a comparative phase row (pick included) to prove nothing remains. No new table, so no new deletion path.
- **Rejected.** A new `comparative_phases` table (duplicates the 008 table, queries, constraints and retention wiring); storing the pick in `attempts` (the pick belongs to a question, and an
  attempt may hold one).

---

## R11. What reaches the browser, when

| Surface | May carry | Never |
|---|---|---|
| `POST /api/attempts` (start/resume), page render of `/attempts/<id>` | question public fields incl. `textIds`, `choice`, every shown text (public), step, drafts, saved pick, try verdicts/feedback after marking, discussion only at discussion | criteria, notes, model (before discussion), any description |
| Question payload | `ComparativeQuestion` public fields; `UnseenText` for every `textIds` entry; image `src` (authenticated route) | `pairing` (the model's pairing is shown only at the discussion), key |
| `POST /api/comparative/pick` request/response | `{attemptId, attemptToken, questionId, pick}`; `{ok}` or `invalid_pick` | anything from the key |
| `POST /api/grade` (comparative) | request: `questionId, answer, phase, attemptId, token, pick (first try)`; response: mark, nine verdicts + reasons, feedback, biggest gap, go-further (try 1 full), word count, retry offered, ending; `discussion` (model answer, `pairing` as text ids and labels, the "one possible pairing" line) only when final | criteria, notes, descriptions, model before final |
| `POST /api/unseen/decline` | as 008, generalised to comparative questions; response with discussion | as 008 |
| Attempt detail `/attempts/<id>` | tries, verdicts, reasons, feedback, pick; discussion only for finished questions | as above |
| Unit page | counts, results by fixed/choice, "Things I need to know" with tips | any key |
| Text-only page | the public text only (the `TextPanel`), access per R3 | question, pick, description |
| Image route | bytes only, authenticated; the text id is checked against the shared store | description, listing |

- `tests/no-key-leak.test.ts` is extended so its "every shipped question" loop covers both units' questions, including the shared-visual description and **the pairing of a choice question before the discussion**; it
  asserts the key strings (criteria, notes, model, description, pairing labels where not public) appear in no payload, page, static chunk or image response, and that the text page and tabs import no key module.
- `tests/unseen/no-key-leak-shipped.test.ts` already scans the built output; it keeps scanning every key of both units.
- The "one possible pairing" sentence is a fixed string in the client (public); the pairing's text ids are released at the discussion with the model answer (they say which texts it covers, so they are
  not public earlier). Rationale: the pairing could hint at the school's expected texts.

---

## R12. Content tooling

**Decision.**

- **Inventory format.** `resources/english-unseen/inventory/<paper>.json` questions today carry `{qNo, marks, texts, forms, decision, reason}`. Add (additive, no existing file breaks) `choice?: { fixed: string[]; from: string[]; pick: number }` and
  `decision: "kept"` for a multi-text question that 009 keeps; the old `skipped / two_or_more_texts` entries are re-labelled by the content step after review (spec FR-028). The four missing papers (Fort St 2023 and 2025, Roseville 2026 (OCR), North Sydney Boys 2024) are inventoried
  by the content step (FR-028), and the 6 single-text Q5s are re-labelled from `not_q1_to_q4` to `kept` (FR-034, below).
- **Bank format.** `resources/english-unseen/bank/comparative/<paper>.json` (new subfolder, so 008's `bank/*.json` glob is untouched), holding `texts[]` that are *new* to the store (same shape as 008's bank texts), plus `questions[]` that
  reference store text ids with `textIds`, `choice`, `pairing`, marks, parts, verb, source, `suggestedWords` or `answerLines`, outcome, concepts and a key (criteria, notes, model, origins, `reviewedOn`).
- **Generator.** `scripts/unseen-build-bank.ts` / `-lib.ts` gain a second pass over `bank/comparative/*.json` that writes `y12-english-advanced-comparative-texts/{questions,keys,answers}.ts`, and `store-texts.ts` plus the two filtered `texts.ts`
  (R2). Pending (drafted without `reviewedOn`) stays out, with the same `--include-pending` switch; the `schoolFirst` ordering is not needed. 008's output must be byte-identical when no comparative file exists (a test).
- **Review report.** `scripts/unseen-report.ts` gains a comparative section: kept and skipped per paper with reasons, counts by mark value and by fixed pair / choice, rubric source, the medians for 7 and 8 marks.
- **Medians.** `MEDIAN_WORDS` (`lib/unseen/limits.ts`) gains `7` and `8`, counted by `unseen-report` from this unit's papers whose lines can be counted (its existing "fails when a counted value differs from the table" check then covers them); until counted, the
  table is not edited and a median-fallback 7/8-mark question fails validation, so nothing ships on a guess. The validator's mark range for this unit is 3–8.
- **Validation rules** (`validateComparativeRules`): the unit declares the nine skill concepts (seven shared ids that exist in 008's unit, two own), each `clearAfter: 2`; `textIds` all resolve; fixed pair has exactly 2 `textIds` and `choice: null`; a choice question has `fixed ∪ from = textIds`,
  `fixed ∩ from = ∅`, `1 ≤ pick ≤ from.length`, and `fixed.length + pick ≥ 2`; `pairing ⊆ textIds`, `pairing.length = fixed.length + pick`; marks 3–8; 1–3 skill tags from the nine; verb in the comparative prompt's verbs (`compare`, and the 008 ones); outcome; key complete
  (criteria band per mark, notes, model of 40+ words not above the submittable limit, `reviewedOn` when drafted); every visual in `textIds` has an adequate description whose hash matches; `source` equals the paper's source string; `paper.qNo` 1–5; the 40-character public/key leak rule (rule 9) applies to the
  model answer, notes, descriptions **and the pairing labels** against public strings.
- **FR-034 amendment** (a small task, no code): edit 008's `spec.md` FR-040 to read "keep every single-text Section I question, not only Questions 1–4"; relabel the six inventories' Q5 entries to `kept`; widen 008's `qNo` to include 5 for those six questions (validator `qNo` 1–5 for 008 too, the `UnseenPaper.qNo` union already widened here) — then the 008 bank content step handles the six questions as a later content task. The
  content step does **not** build them (spec: they belong to 008's bank), but the amendment and the relabel are done here so they are not lost.
- **Content prompt.** `specs/009-english-comparative-short-answers/content-prompt.md` (written beside this plan) is the instruction for the content step, in 008's style.

**Rejected.** Generating this unit from 008's bank folder (the glob would pick up the new format); inferring choice questions at build time (the paper's wording is the only source of truth, so it is recorded in the inventory).

---

## R13. Discussion and attempt detail

**Decision.**

- **Discussion**: the model answer, its word count (as 008), and for a **choice** question one fixed sentence above it: "This model answer shows one possible pairing ({labels of pairing}). Any allowed pairing can earn full marks." The labels come from `pairing`, released only at the discussion. A fixed-pair discussion has no such line.
  The student's answer is shown beside it as in 008.
- **The pick** is shown on the write step (chips), the result card ("You wrote about: Text 5 and Text 2"), the retry (read-only chips), the discussion and the attempt detail.
- **Attempt detail** (`/attempts/<id>`): `UnseenAttemptDetailView` is generalised to take nine skills and an optional `picked` list; a past choice attempt names its pick, a fixed pair names its two texts. Past attempts are named by their source, as in 008 (`paperLabel`).
- **History names** (`components/AttemptHistory.tsx`): comparative questions are listed by source ("Abbotsleigh 2024 Trial, Q5") with a "Compare" tag. Unfinished-question detail never shows key text.

---

## Other decisions needed to plan

- **Directive verb key.** `compare` is added to the comparative prompt's `directiveVerbs`; the validator checks verbs against the unit's prompt file, so `lib/content-rules.ts` takes the rubric as a parameter.
- **Grade route.** `app/api/grade/route.ts` branches on `question.type === "comparative"` to a `gradeComparative` that reuses the generalised 008 handler (word rules, DB-degraded 503, phase checks, rate limits, reserve/refund of the daily-limit slot) with the pick checks added. The handler body is shared through a `gradeUnseenLike` core so the two units cannot drift.
- **Decline route.** `app/api/unseen/decline` accepts comparative questions through the same handler (it checks the question's type, not the unit).
- **Question widening.** `UnseenPaper.qNo` widens to `1 | 2 | 3 | 4 | 5`; 008's validator keeps accepting 1–4 until FR-034's task widens it to 5.
- **No new runtime dependency** (Principle VIII): everything above is React, TypeScript and existing packages.

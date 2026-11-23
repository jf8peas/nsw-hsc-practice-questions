# Research: English Essay Writing (spec 011)

Each item records **Decision**, **Reason**, and **Alternatives rejected**. Code and pilot evidence were read on 2026-11-23 from the files named in the plan prompt. There are no unresolved clarification items. Slice tags: **S1** is the first shippable release, **S2** follows it.

## R1. Constitution check and amendments (first task)

**Decision.** Amend the constitution from **2.17.0 to 2.18.0** (MINOR: materially expanded guidance for a second whole-essay unit, its server-only reference text and its two model settings). The amendment is the first implementation task, before schema or code. Principles I, II, V, VI, VII and the Quality Gates need changes. Principles III, IV, VIII and IX already cover the design.

Prepend this Sync Impact Report entry and retain the earlier reports:

> - Version change: 2.17.0 → 2.18.0 (MINOR: guidance in Principles I, II, V, VI and VII and the Quality Gates extended to the English essay-writing unit, spec 011).
> - Reason (amendment log): the English essay unit has a student make a light plan for an 800–1,200 word essay on Michael Gow's Away, optionally get unmarked plan feedback, and receive one AI mark out of 20 with deterministic question-focus, knowledge-error and quotation checks. It reuses the essay attempt lifecycle but stores four criterion verdicts, question focus, knowledge errors, quote-check results, raw and final marks, marker-selected and final bands, and concepts used well. Marking notes, Away notes, pilot essays and the play text never reach the browser; the model essay is released only with the student's own finished result. The full play is loaded from a gitignored local copy into a server-only database table, never committed to the public repository. Only a near-miss correction excerpt and quotations in a released model essay may include play words in a browser response. Two new model settings serve the English marker and reviewer, with no fallback between them or to another unit. A missing reference text refuses marking rather than silently skipping verification.
> - Modified principles: I (English routes and release schedule, including the two permitted play-excerpt exceptions); II (English attempt fields and shared reference-text state); V (the deployable server-only copy of the prescribed play); VI (never self-marked, failure preserves text, review failure offers "Start writing", missing reference text refuses marking); VII (`ENGLISH_ESSAY_GRADING_MODEL` and `ENGLISH_ESSAY_REVIEW_MODEL`, each independent of every other model setting); Quality Gates (English marker and model-essay quote gates, leakage and failure tests).
> - Templates requiring updates: none (the plan, spec and tasks templates name no unit).

Exact amendment text follows.

### Principle I — routes and information release

Append to the answer-submission-fields bullet:

> …; for the English essay unit's attempt-start route, a `questionId` (an essay id the server checks is live and not already open); for its scaffold route, `attemptId`, `questionId`, the signed attempt token, an `action` (`save` or `start`) and the English scaffold's text fields; for its review route and discard route, `attemptId`, `questionId` and the signed attempt token (the review also the English scaffold's text fields); and for its grade route, `attemptId`, `questionId`, the signed attempt token and the essay text (no `phase`). The existing draft route MAY accept the English essay's own draft at phase 1.

Add this release bullet after the Economics essay bullet:

> - [DECISION] The English essay-writing unit (spec 011) MAY send part of its key to the browser at defined moments, and only then. Before an essay is marked: nothing from the key (the essay id, verbatim question, directive and definition, school-trial source, live state and public practice concept ids are public content; the scaffold, plan review and drafts are the student's own text). After an essay is marked: the four per-criterion verdicts and reasons, the final mark and final band, the two lift points, question focus and its reason, knowledge errors, flagged quotations (with the play's exact words only for a near match), the gaps and the concepts used well. With the student's own finished result: the band 1 model essay. Never, at any moment, including reload, resume, discard and an unfinished attempt detail: marking notes, the rubric's Away text notes, per-essay key concept tags, pilot essays, or the model essay before that finished result. The full play text MUST remain server-only. The only play words permitted in a browser response are an exact near-miss correction excerpt and quotations within the model essay released with that same finished result. Key material MUST come through functions exported from `lib/grading.server.ts`; the reference text MUST be read only by the server-only reference-text module.

### Principle II — stored attempt fields and shared reference state

Add after the spec 010 essay-attempt bullet:

> - per English essay attempt (spec 011): the unit and essay id; the English scaffold (thesis, three claims and three evidence notes) and when it was locked; the plan review, if one was made (five check lines), with its prompt version and model; the essay text and word count; the four per-criterion verdicts each with the marker's one-line reason; question focus and its reason; knowledge errors; quote-check results; the raw and final mark; the marker-selected and final bands; the band reason and two lift points; the gaps (concept id and one-sentence detail) and concepts used well; the reference-text content hash used by the quote check; and the marking and review prompt versions and models; stored in the essay row with the unit discriminator, kept for the attempt detail page, deleted with the student like results. The student's in-progress essay is stored in the existing draft row. A discarded unmarked attempt is deleted with its scaffold, review and draft. Verdicts and reasons never change concept tracking, which comes from the gaps and concepts used well.

Append to the other-server-side-state paragraph:

> Shared reference texts are also not personal data: a text id, the full reference text, its content hash and its loaded-at time. They contain no student id, answer or name, are read only by server-only code, and are never exposed by a browser route.

The existing derived-concept rule needs no new rule: the English unit sets `conceptsClearOnOtherQuestions`, so a redo of the raising essay does not clear a gap.

### Principle V — the deployable copy of Away

**Principle V does need amending.** The existing rule keeps other copyrighted source material in gitignored `resources/` and does not permit a full prescribed text to be reproduced in a deployed database or excerpted in results. Add:

> - [DECISION] While the app is non-commercial, a prescribed text needed only to verify a student's quotations (Michael Gow's Away, spec 011) MAY be loaded from a gitignored local copy into a server-only database table. The full text MUST NOT be committed to the repository in any form (plain, encrypted, encoded or in a fixture), MUST NOT be placed under `public/`, and MUST NOT be returned as a text to the browser. Only an exact near-miss correction excerpt and quotations within a reviewed model essay released with the student's own finished result MAY include its words in a browser response. Before the app goes commercial, the reference text and every affected model essay MUST be removed or replaced by original or properly licensed material.

Document the source and this arrangement in the README unit row and quickstart. No real HSC question is introduced; all six public questions retain their school-trial source.

### Principle VI — no self-marking and failure behaviour

Extend the existing never-self-marked unit lists to name specs **008, 009, 010 and 011**, and extend the essay-specific bullet to read:

> - [DECISION] The essay-writing units (specs 010 and 011) have one try per attempt and no second phase. If the marker fails, the editable box returns with the essay and the slot is refunded; if the student is over the daily cap, the app tells them to come back tomorrow, and the scaffold and essay stay as drafts. The optional plan review is never marked and never blocks the essay: if the reviewer fails or the student is over the cap, the app says so and offers "Start writing" without it. Until the English review pilot has passed and Chiang has approved it, only "Start writing" is offered. If the English reference text is unavailable, marking refuses before a model call or daily slot, preserves the essay and says quotations could not be checked; it MUST NOT silently skip the quote check or award an unverified mark. Neither unit can start, resume, mark, review, discard or save without the database and MUST NOT guess.

### Principle VII — independent model settings and daily cap

Add:

> - `ENGLISH_ESSAY_GRADING_MODEL` and `ENGLISH_ESSAY_REVIEW_MODEL` follow the same server-only rules as `OPENROUTER_API_KEY`. The first marks the English essay-writing unit's essays (default `openai/gpt-6.2-sol`); the second gives its optional plan review (same default). They are separate from each other and from every other unit's setting: neither falls back to the other, to `ESSAY_GRADING_MODEL`, `ESSAY_REVIEW_MODEL`, `ENGLISH_ADV_GRADING_MODEL` or `GRADING_MODEL`. Each marked English essay and each English plan review counts one slot against `LLM_DAILY_CAP`, refunded if the call fails. Loading or reading the reference text makes no model call and takes no slot.

### Quality Gates

Add to the constitution-check leakage list:

> - the English essay unit's marking notes, Away text notes, key concept tags, pilot essays and full play text never leave the server; its model essay appears only with the student's own finished result, and the only play excerpts in browser responses are near-miss corrections and quotations in that released model essay;

Add to the testing list:

> - the English essay unit's marker failure and missing-reference-text state preserve the essay with no mark and no self-mark, its daily-limit state keeps the drafts and disables Submit, a review failure or not-live review offers "Start writing", final-mark adjustments follow the mandated order, quote-check parity and model-essay quote checks pass, and a gap clears after 2 correct uses on a different essay;

Extend the marker-check bullet:

> - a unit marked by an LLM against labelled pilot essays MUST NOT set a question `live` until its marker check (`resources/<topic>/`) has passed on the prompt version and model that ship. For the English essay unit this is the one-sided `eng-essay-pilot-5` gate. Every live English model essay MUST also be 900–1,100 words and pass the deterministic quote check with zero flags. The optional English plan review MUST stay not live until its separate scaffold pilot has passed and Chiang has approved every output.

Set the version line to `**Version**: 2.18.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-11-23`.

**Reason.** Principles I and II are closed lists, Principle V currently limits copyrighted source material to gitignored resources, and the model settings and missing-text behaviour do not exist in 2.17.0. A MINOR amendment adds guidance without removing or redefining a principle.

**Alternatives rejected.** *No amendment*: the closed request/storage lists and copyright rule would be violated. *Principle V unchanged because the database is not the repository*: rejected; it is still a reproduction and the result excerpts need an explicit exception. *A new principle*: rejected; the existing principles already own these concerns.

## R2. Reuse spec 010 through a parallel English module, not a general engine rewrite

**Decision.** Build a **parallel English module** that imports small, genuinely generic pieces from spec 010. Add a new question type `englishEssay` and unit flow `englishEssay`, rather than making English pretend to be an Economics `essay`. Economics files, data, routes and tests keep their current behaviour.

The seams read in code lead to this split:

| Seam | Decision |
|---|---|
| Question and key types | Add `EnglishEssayQuestion` and `Answer.englishEssay`; leave `EssayQuestion` and `Answer.essay` unchanged. Add `UnitMeta.flow: "englishEssay"`. |
| Scaffold | New `lib/english-essay/scaffold.ts`: thesis plus three claim/evidence pairs, 150-word cap and non-empty-thesis rule. The Economics 20-field module is untouched. |
| Counter | New English counter for exact 800–1,200 wording and thousands separators. Reuse `scaffoldCounter(n, 150)`. Add an optional counter injection prop to `components/essay/EssayBox.tsx`, defaulting to the current Economics counter. |
| Scoring | Reuse `BANDS`, `Band`, `Verdict`, `VERDICTS`, `MAX_GAPS`, `clampToBand`, `outcomesFrom`, `Gap`, `normalise` and `quoteInText` from `lib/essay/scoring.ts`. Do not call its Economics `finalMark` or one-economy cap. English gets its own pure final-mark and band-for-mark functions. |
| Marker and reviewer | New `lib/english-essay/marker.server.ts`, `review.server.ts`, `review.json` and `review-labels.ts`. No English import of Economics model getters or prompts. |
| Quote and reference text | New `quotes.ts`, `sequence-matcher.ts` and `reference-text.server.ts` under `lib/english-essay/`. |
| Views and result extras | New English `types.ts`, `views.ts` and `components/english-essay/Result.tsx`; reuse the exported `VerdictBadge` from `components/essay/Result.tsx`. |
| Generic client leaves | Reuse `EssayBox` (with its default-compatible counter prop), `Timer` (already takes seconds), `DiscardButton` (add an endpoint prop defaulting to `/api/essay/discard`) and `VerdictBadge`. English gets its own `Scaffold`, `EssayPanel`, `UnitEssays`, `ReviewPanel`, `AttemptDetail` and shared header/plan readout because their content differs structurally. |
| Phase table | Reuse `essay_phases` with its existing `unit_id` discriminator, adding nullable English columns and per-unit checks. Add English query functions and row types; do not weaken Economics checks. |
| Attempt creation and lifecycle | Reuse the unit-parameterised `createEssayAttempt`, `getLatestIncompleteAttempt`, draft table, result save, retention and cascade patterns. English gets its own start/state/progress/results/handlers because their payload shapes differ. |
| Routes | Add `/api/english-essay/{scaffold,review,discard}` and additive branches in `/api/attempts`, `/api/grade`, `/api/rewrite/draft`, the unit/quiz/attempt pages and `components/Quiz.tsx`. Existing `/api/essay/*` routes remain Economics-only. |

**Refactor order.** (1) Record the full baseline, especially `tests/essay/*`, `tests/api/essay-*.test.ts`, `tests/client/essay-*.test.tsx` and `tests/no-key-leak.test.ts`. (2) Add the constitution amendment. (3) Add additive content/types and the per-unit migration. (4) Add only the default-compatible leaf props. (5) Build the English pure modules and prove them in isolation. (6) Add English queries, handlers and routes. (7) Add English components and page branches. (8) Run the entire existing Economics suite unchanged, then the full suite. No existing Economics file is moved or renamed.

**Reason.** A subject-agnostic config would touch every Economics scaffold, marker, result, handler, component and test at once. The parallel module isolates the new marking rules and lets S1 start immediately while still sharing the counter, bands, outcome replay, generic leaves, table and lifecycle infrastructure.

**Alternatives rejected.** *Generalise `lib/essay`, `components/essay` and the routes into a config-driven engine*: rejected for S1; it is a broad refactor of a working unit and makes the deadline depend on proving every Economics config option before English can start. *Copy every Economics file without sharing anything*: rejected; it duplicates generic counter/band/outcome logic and the useful client leaves, inviting drift. *Reuse `type: "essay"` with a dummy economy*: rejected; it would route English into Economics handlers and falsify public content.

## R3. Unit shape and content types (FR-001, FR-033–FR-037)

**Decision.** Create `content/units/y12-english-essay-writing/` with `meta.ts`, `questions.ts`, `answers.ts`, `concepts.ts` and `directives.ts`.

```ts
interface EnglishEssayQuestion extends BaseQuestion {       // PUBLIC
  type: "englishEssay"; group: "englishEssay"; maxMarks: 20;
  directive: "to what extent" | "discuss" | "how" | "evaluate";
  offer: 1 | 2 | 3 | 4 | 5 | 6;
  live: boolean;
  source: string;                                            // all six are school-trial questions
  conceptIds: string[];                                      // public PRACTICE tags, skill-* only
}

interface EnglishEssayKey {                                  // SERVER ONLY, Answer.englishEssay
  markingNotes: string;
  modelEssay: string;                                        // band 1, 900–1,100 words
  conceptTags: string[];                                     // full ids a strong answer uses
}
```

`conceptIds` and `conceptTags` deliberately differ. Public practice tags are limited to the eight `skill-*` concepts and describe what the question rehearses; they do not drive progress and reveal no model answer. Key tags may include all 19 concepts and describe a strong answer's coverage. Marker gaps and `conceptsUsedWell`, not public tags, drive concept progress. This honours the requested public id list without releasing the key's Away-specific answer coverage.

Move the 19 entries from `lib/english-essay/concepts.json` into `concepts.ts` as one exported record, with `concepts` built from it as `y12-english-essay-writing.c-<slug>` and `clearAfter: 2`. The TypeScript marker imports the same record. The Python pilot reads it through a tiny existing-`tsx` dump helper (`scripts/english-essay-concepts-json.ts`) rather than a second hand-maintained list; the old JSON file is removed. A drift test hashes the rubric plus this record, so a concept edit is a prompt edit requiring a new `promptVersion` and gate.

All six public questions receive stable ids `.e1`–`.e6`, `offer` 1–6 and `live: false` initially. The unit is registered in `content/index.ts` only when at least one is live; its key registry is `content/answers/index.ts`. A non-live essay cannot start, while an already-started essay can resume and its results remain. Any subset works.

`lib/content-rules-english-essay.ts`, called by `scripts/validate-content.ts`, checks: ids and offers; all six sources; directive presence; public practice tags restricted to skills; question text parsed from `specify-prompt.md` verbatim; every live key present with notes, a 900–1,100-word model, valid key tags and zero quote flags; and no 60-character key run in public text (apart from the question's own wording). The model quote check uses the local play file, not the database. Non-live essays need no key. `lib/content-rules.ts` gets an explicit `englishEssay` branch so `conceptsReady` accepts and validates these public practice tags (and skips them for MC wrong-option explanations), while `conceptProgress` continues to ignore them.

**Reason.** This follows spec 010's public/key split and staged release while making the concept list a single TypeScript source as requested. The two tag fields prevent accidental release of answer coverage.

**Alternatives rejected.** *Keep `lib/english-essay/concepts.json` as a second source*: rejected; it drifts from `concepts.ts`. *Publish all key tags*: rejected; Away-specific tags reveal what a strong answer covers. *Register only currently live questions*: rejected; stable ids should exist from day one and non-live content still needs validation. *Require all six before registration*: rejected; staged release is required.

## R4. Directive presentation (FR-007, FR-037)

**Decision.** Store the full directive string on each public question. `directives.ts` resolves `evaluate` and `discuss` by calling `verbDefinition` from `content/glossary.ts`, and supplies two local, explicitly non-NESA definitions:

- **to what extent** — "Make a judgement about how far the statement holds: agree, qualify or challenge it, and sustain that judgement with evidence."
- **how** — "Explain and analyse the ways the text achieves the effect named, showing how its form and language make meaning."

The definition line labels the latter two "Unit guidance (not a NESA glossary definition)" so students are not told they are official NESA terms. `evaluate` and `discuss` use the glossary text unchanged.

A pure `findDirective(question, directive)` escapes the stored phrase, turns its spaces into `\s+`, and applies letter boundaries before returning the original start/end offsets. An English `DirectiveQuestionBlock` highlights that whole phrase with `<mark>` and prints its definition. It never searches for only the first word, so "to what extent" is one highlight and "how" cannot match inside "show" or "however". Validation fails if the stored directive is absent from the verbatim question.

**Reason.** The stored phrase is the most reliable highlighter input and handles multi-word directives without changing the Economics renderer.

**Alternatives rejected.** *Add the two phrases to the NESA glossary*: rejected; they are not NESA glossary entries. *Reuse the Economics single-word search unchanged*: rejected; it has no letter boundaries and does not document the non-NESA status. *Let the client choose the directive*: rejected; public content and the server already own it.

## R5. Attempt state and schema (FR-002, FR-028, Key Entities)

**Decision.** Reuse `attempts`, `results`, `rewrite_drafts` and `essay_phases` with `unit_id` as the discriminator. Migration `drizzle/0010_*.sql` makes only additive changes:

- New partial unique index `attempts_english_essay_incomplete_unique` on `attempts(user_id)` where `unit_id = 'y12-english-essay-writing' AND completed_at IS NULL`.
- New nullable English columns on `essay_phases`: `final_band`, `question_focus`, `question_focus_reason`, `knowledge_errors`, `quote_results`, `reference_text_hash`.
- New shared table `reference_texts(id text primary key, content text not null, content_hash text not null, loaded_at timestamptz not null default now())`.
- Drop and recreate the existing word/mark checks with **per-unit branches**. Economics keeps exactly its current 250 scaffold cap, 600–800 essay range and marked-field requirements. English gets a 150 scaffold cap, 800–1,200 essay range, raw mark 0–20 (clamped later), final mark 1–20, marker and final bands 1–5, required focus/reason, knowledge errors, quote results and reference hash. Existing Economics rows need no backfill.

Keep the Economics `EssayPhaseRow` shape by name. Add `EnglishEssayPhaseRow` with the English scaffold, review and criteria types; the English query module validates and maps rows at its boundary. This avoids forcing union handling into Economics code.

The state machine is spec 010's: `planning → writing → finished`; marking and reviewing are in-flight operations, not stored states. A 130-second marking lease prevents double submits. Review success and "Start writing" lock the scaffold; reviewer failure, cap and not-live leave it editable. Discard deletes only an open, unmarked attempt and cascades its phase and draft. Redo creates a new attempt and latest result wins.

`delete-student` and retention cascade through `users`; add English rows to the dry-run count and deletion tests. `clear-unfinished-essays.ts` remains paragraph-only: its five-part archive model does not apply, and student Discard is the English cleanup path. Do not broaden it silently.

**Reason.** The table already has the unit discriminator and lifecycle columns. Per-unit checks preserve Economics while avoiding a second almost-identical phase table.

**Alternatives rejected.** *A separate English phase table*: rejected; it duplicates latest-mark, lease, discard, retention and repair queries. *Loosen the existing checks globally*: rejected; Economics constraints must not change. *Store a `marking` status*: rejected; a crashed request would strand the attempt, while the lease self-heals. *Extend the paragraph cleanup script*: rejected; its entity model is different.

## R6. Scaffold (FR-004–FR-008)

**Decision.** Use this JSON shape:

```ts
interface EnglishEssayScaffold {
  thesis: string;
  body: [
    { claim: string; evidence: string },
    { claim: string; evidence: string },
    { claim: string; evidence: string },
  ];
}
```

There are seven text fields and no conclusion. Placeholders, not labelled sub-boxes, guide the writing:

- Thesis: "One or two sentences answering this question and taking a position…"
- Claim: "One idea about human experience that builds your thesis (not a plot point or technique)…"
- Evidence notes: "Optional: quotations, scenes, stage directions, staging or symbols to analyse…"

At 390 px the thesis and all three body sections are full width and open by default. Claims use a one-line auto-growing textarea; evidence uses a two-row auto-growing textarea. A sticky bottom bar holds the total counter and actions with at least 44 px targets.

`scaffoldWords` sums `countWords` over all seven fields. `save` accepts an incomplete plan at or under 150 and refuses over-cap text without storing it. `start` and `review` additionally require `thesis.trim() !== ""`; claims and evidence may all be empty. The same pure validator runs on client and server. Autosave is debounced at 1.5 s plus `pagehide`/`visibilitychange`, mirrored to `sessionStorage` under an English-specific key, and the server row is authoritative on resume. A successful review or "Start writing" conditionally changes `planning → writing` and sets the lock; every later save is `409 scaffold_locked`.

**Reason.** This is the light plan in the spec, with one shared word rule and a server-enforced lock.

**Alternatives rejected.** *Require one or more claims*: rejected; only thesis is compulsory. *A conclusion field or Economics-style labelled sub-boxes*: rejected by the spec. *Session-only drafts*: rejected; cross-device resume requires the server row. *Lock on a failed review*: rejected; the student must be able to edit and retry or choose "Start writing".

## R7. Plan review (FR-009–FR-013, User Story 8) [S2]

**Decision.** Draft `lib/english-essay/review.json` as follows, with its own version `eng-essay-review-1`:

```json
{
  "promptVersion": "eng-essay-review-1",
  "checks": [
    { "id": "thesis", "label": "Thesis answers the question", "look": "the thesis answers this question in its own terms and takes a position, including a judgement about how far the statement holds when the question asks 'to what extent'" },
    { "id": "claims", "label": "Claims are ideas about human experience", "look": "each claim is an idea about human experience rather than a plot point, a technique or a character's name" },
    { "id": "development", "label": "Claims build the thesis", "look": "the claims develop different parts of the thesis rather than restating it or listing three similar examples" },
    { "id": "evidence", "label": "Evidence ranges across the play", "look": "the evidence notes range across the play and its forms: dialogue, stage directions, the play-within-a-play, staging and symbol" },
    { "id": "fit", "label": "Fits 45 minutes and 800–1,200 words", "look": "the plan is light enough to make in about five minutes and has enough development for 800–1,200 words in 45 minutes, without too much material" }
  ],
  "system": "You are an experienced NSW HSC English Advanced teacher giving quick feedback on a Year 12 student's light PLAN for an unseen Paper 1 Section II essay on Michael Gow's Away. The student has about five minutes to plan and 45 minutes to write 800–1,200 words without notes. Never write a thesis, claim, sentence or paragraph for the student, never rewrite the plan, and never give a mark or band. Point at what is missing or weak. Every fix MUST be a short question or prompt for the student to answer and MUST contain a question mark. A strength is one short line saying what is working. Do not invent quotations or facts about the play. Respond with JSON only, no prose outside it.",
  "userTemplate": "Essay question: {question}\nDirective: {directive} ({directiveMeaning})\nPrescribed text: Away by Michael Gow (a play)\n\nThe five checks (give exactly one line for each, as a strength or a fix):\n{checks}\n\nThe student's plan (an empty field is shown as (empty)):\n\"\"\"\n{plan}\n\"\"\"\n\nReply with exactly this shape:\n{\"checks\": [{\"id\": \"thesis\", \"status\": \"strength|fix\", \"line\": \"<one short line; every fix is a question or prompt containing a question mark>\"}, {\"id\": \"claims\", ...}, {\"id\": \"development\", ...}, {\"id\": \"evidence\", ...}, {\"id\": \"fit\", ...}]}\nEach line is at most 30 words. Give no mark, no band and no replacement writing."
}
```

The reviewer receives only the public question, directive meaning and plan: never marking notes, Away notes, the model essay, pilot essays or the play text. `ENGLISH_ESSAY_REVIEW_MODEL` defaults to `openai/gpt-6.2-sol` in `lib/config.server.ts`, `.env.example` and README, independently of `ENGLISH_ESSAY_GRADING_MODEL` and every other model.

`parseReviewReply` requires the five ids once each, re-sorts them, accepts only `strength` or `fix`, trims lines to 240 characters, and rejects any fix without `?`. Unknown fields such as marks or rewritten text are ignored and never stored. A failed call, cut-off, empty or malformed reply is retried once: first call 25 s, total budget 45 s, `max_tokens` 1500, route `maxDuration` 60. One daily slot is reserved and refunded on failure.

A public `ENGLISH_ESSAY_REVIEW_LIVE` flag starts **false**. The route then returns `200 { notReviewed: { reason: "not_live" } }` without a slot or lock and the UI offers only "Start writing". Success stores the review and locks in one update. Reviewer failure, daily cap and not-live leave the plan editable and offer "Start writing". The result view never includes the review.

**Pilot before the flag changes.** Adapt `scripts/pilot-essay-review.py` into `scripts/pilot-english-essay-review.py` (standard library only, `--check`, `--only`, `--runs`, reports under `resources/english-essay/review-runs/`). Claude writes seven Away scaffolds: one strong plan; a weak/non-responsive thesis; claims that are plot points; claims that restate the thesis; narrow evidence from one scene/form; an over-150-word plan; and an under-cap but overambitious plan. Run three replies per scaffold in small `--only` groups. Collectively they must produce both strength and fix outcomes for every check. The pass bar is: every planted weakness is a fix; exactly five valid lines on every reply; every fix is a question; no supplied student sentences or mark; no cut-off; and **Chiang approves every output** against those criteria. Any failure keeps the flag false.

**Reason.** The reviewer is optional and unvalidated, so it cannot delay S1. Its prompt, model and release gate are independent of the approved marker.

**Alternatives rejected.** *Share the marker prompt or model setting*: rejected; the tasks and calibration differ. *Go live after a smoke test without Chiang's approval*: rejected by FR-012. *Lock on failure*: rejected; editing and "Start writing" must remain available. *Send the play or model essay for richer feedback*: rejected; unnecessary key exposure.

## R8. Essay page (FR-014–FR-019)

**Decision.** Reuse `EssayBox`'s paste/drop blocking, autosave and locked marking behaviour with an injected English counter. The exact counter strings are:

- 799: `799 / 800–1,200 words — 1 more to go` (disabled)
- 800: `800 / 800–1,200 words` (enabled)
- 1,200: `1,200 / 800–1,200 words` (enabled)
- 1,201: `1,201 / 1,200 — cut 1 word` (disabled)

Other under-range values use plural "more to go"; other over-range values use "cut N words". The server recomputes with `countWords` and rejects outside 800–1,200 or over 12,000 characters before any lease, limiter, slot or model call. The shared grade route stops truncating at 6,000 only for `englishEssay`; every other question type keeps its current truncation behaviour. The English draft route uses phase 1 and a 12,000-character cap.

The essay page shows the question and source, read-only collapsible plan, optional collapsible review (S2 only), essay box and Submit. Paste, context-menu paste, drop and the corresponding `beforeinput` types insert nothing; autocorrect remains allowed. Drafts use the existing beacon and session storage. While marking, the essay remains visible and read-only with live status steps. Marker failure returns the editable text and refunds the slot; daily cap keeps the draft and disables Submit until the next Sydney day.

The optional 45-minute timer is **S2**, uses the existing `Timer` with 2,700 seconds, is client-only and never blocks editing or submission. S1 has no timer.

**Reason.** The existing box already implements the difficult browser behaviours; only its counter and range need to vary.

**Alternatives rejected.** *A second counter implementation in the server*: rejected; browser and server must share `countWords`. *Enforce timer expiry*: rejected by FR-018. *Reuse `EssayPanel` unchanged*: rejected; it hard-codes Economics result and error wording. *Keep the shared route's 6,000-character truncation*: rejected; it could silently alter a valid 1,200-word English essay.

## R9. Marker (FR-020–FR-027)

**Decision.** Implement `lib/english-essay/marker.server.ts` with `buildEnglishEssayMessages`, `parseEnglishEssayReply` and `markEnglishEssayWithModel`.

**Single prompt source.** Render `lib/english-essay/rubric.json` exactly as the pilot's `build_messages`: the same system text and single-pass substitutions for `{question}`, `{textTitle}`, `{textNotes}`, `{bands}`, `{criteria}`, `{markingNotes}`, `{concepts}`, `{words}`, `{essay}` and `{maxGaps}`. `textTitle` is `Away (Michael Gow), drama`; `textNotes` comes only from `rubric.textNotes.away`; per-question notes come from the server-only key; concepts come from the unit's one record. The model essay is not sent.

Add `--write-golden` to the Python pilot and a golden test like spec 010's. To keep play text out of a committed fixture, both golden builders use the production rubric with **only `textNotes.away` replaced by a synthetic fixture note**. The golden therefore proves identical rendering of the system, template, bands, criteria, concepts and substitutions without reproducing the play or its notes. A separate drift fixture stores the prompt version and a SHA-256 of the canonical rubric plus concept record: any change to either requires a changed `promptVersion` and regenerated golden/hash. This is stronger than a version-format check.

**Reply validation.** Require all four criteria with verdicts in `strong|sound|developing|weak` (missing reason becomes `""`); integer band 1–5; integer raw mark 0–20, which is then clamped as the pilot does; `questionFocus` in `fully|partly|barely` with a non-empty reason; non-empty `bandReason`; at least one lift point (first two kept); arrays for `knowledgeErrors`, `gaps` and `conceptsUsedWell`. Knowledge-error quotes must occur in the essay and reasons are capped. Gaps are on-list, deduped and capped at five; used-well ids are on-list, capped at eight and disjoint from gaps. Off-list items are dropped, never invented. A 60-character echo of marking notes or Away notes outside the question/essay fails the reply. Student-facing strings are scrubbed of references to hidden notes.

A failed call, empty/cut-off/malformed reply or echo is retried once. Use `ENGLISH_ESSAY_GRADING_MODEL` (default `openai/gpt-6.2-sol`), temperature 0, JSON mode and **no fallback to any other model setting**. Keep the pilot's `max_tokens` **8000**. The pilot saw 10–20 s typical calls and a 41 s maximum, so set first-call timeout **60 s**, total budget **115 s**, retry only with at least 12 s remaining, route `maxDuration` **120 s**, and lease **130 s**. This fits SC-003's two minutes while allowing one retry.

**Final mark.** One pure function applies FR-026 in exact order: clamp to the marker-selected band; combine and deduplicate knowledge errors including not-found quotes; deduct one per error up to two; cap at 16 for two or more; cap at 12 for `partly` or 10 for `barely`; enforce minimum 1; derive the displayed band from the final mark. Store raw and final marks and marker-selected and final bands. The exhaustive boundary matrix and overlap cases are in `data-model.md` §7.

**Reason.** The approved prompt and model already pass the one-sided gate. Exact rendering, strict parsing and deterministic adjustments preserve that standard.

**Alternatives rejected.** *Hand-copy the Python prompt*: rejected; drift. *Commit a golden containing the real text notes*: rejected; the play must not enter a fixture. *Use another unit's model on failure*: explicitly forbidden. *Send the model essay as an anchor*: rejected; it was not needed for the passing pilot and adds echo risk. *Shorten the timeout to the typical 20 s*: rejected; the observed 41 s tail would cause avoidable failures.

## R10. Quote check (FR-025)

**Decision.** Port the pilot to server-side TypeScript with no dependency:

1. Extract straight/curly, single/double quotations with the same length limits and newline rules as `_QUOTE_RE`.
2. Normalise curly punctuation, lower case, replace non-`[a-z0-9' ]` runs with spaces, and strip edge apostrophes. Ignore quotations with fewer than three normalised words.
3. Split on `...`, `…` or `/`; keep segments of at least two words. If every segment occurs exactly in the normalised play, return `ok`.
4. Otherwise search windows of quote length ±2 words. Return `near` at ratio ≥ 0.75 with the play's exact raw words and the two-decimal ratio; otherwise return `not-found` with the ratio. `near` is the app's name for the pilot's `misquote` status.

Port CPython's `SequenceMatcher.ratio()` rather than approximating it: `find_longest_match`, recursive matching blocks, the 200-character autojunk popular-character rule, and `2*M/T`. Iterate strings as Unicode code points to match Python. Precompute the play's raw words, normalised words, raw-index map and joined text once per cached reference version.

**Parity without committing the play.** The Python pilot gains `--write-quote-fixture`, writing expected results to **gitignored** `resources/english-essay/quote-parity.json`. A local TypeScript parity runner reads that fixture, the gitignored pilot essays and the local play, and asserts all four planted errors are caught, zero false flags occur over the 67 accurate quotations, and statuses/ratios/corrections match. No real quotation, pilot essay or play excerpt is committed. Committed Vitest cases use a short invented passage and invented quotations for exact, curly/single, ellipsis, slash, under-three-word, near and not-found cases, plus SequenceMatcher golden ratios.

Benchmark a 1,200-word essay with 25 quotations. Target under 500 ms locally and fail the performance check above 2 s, leaving ample headroom inside SC-003. The same checker validates every live model essay; only `ok` quotations are acceptable there.

**Reason.** Exact algorithm parity preserves the approved 4/4 and zero-false-flag evidence. Gitignored parity data proves the real corpus without violating the no-play-in-repository decision.

**Alternatives rejected.** *A different fuzzy similarity*: rejected unless parity can be proved; the exact port is feasible and safer. *Ask the marker to verify quotes*: rejected; the check is deterministic code. *Commit the pilot essays or play as a test fixture*: explicitly rejected. *Use a new fuzzy-match library*: rejected by Principle VIII.

**Amendment after review (23 Nov 2026).** Testing beyond the pilot essays found two faults in the pilot's quote check, now fixed in `scripts/pilot-english-essay-marker.py`, which remains the reference: (1) single-quoted quotations containing an apostrophe (`'Tell me what I'm feeling.'`) were skipped entirely, so misquotes and invented quotes in single quotation marks went unchecked; the pattern now keeps an apostrophe between two letters inside the quotation; (2) quoting the essay question or a syllabus phrase returned `not-found` and would have cost a mark; such quotations are now `other-source` (matched against the question plus `lib/english-essay/quote-exclusions.json`, exact segment or ratio ≥ 0.75) and never flagged or counted. On the pilot essays both changes are neutral: 71 quotations, 4/4 planted errors caught, 0 false flags over the 67 accurate quotations, and the two passing p5 runs still pass on rescoring. The parity fixture is generated from the corrected script. A not-found flag also tells the student to name any other source.

**Replay parity.** `--rescore` now writes `rescored.jsonl` (id, run, final mark) in each gitignored run folder. The TypeScript parser, quote check and final-mark function MUST reproduce those final marks for all 48 saved replies in runs 20261123-012122 and 20261123-012146 before the English unit ships.

## R11. Where the play text lives (FR-038)

**Decision.** Use the database arrangement decided by Chiang on 23 Nov 2026.

- `reference_texts` stores `id` (`away`), full `content`, SHA-256 `content_hash` and `loaded_at`. It has no student field.
- `scripts/load-reference-text.ts` reads the gitignored local `resources/english-unseen/away-by-michael-gow.txt`, checks it is non-empty and contains the expected act marker, and upserts `away` into `DATABASE_URL`. It prints only id, hash and byte count, never text. Run it once per environment after migration and document local, preview and production runs in README and quickstart.
- `lib/english-essay/reference-text.server.ts` loads `away` on first use, builds the quote-check index and caches it in memory by content hash. Tests can reset the cache and seed PGlite with a short invented passage.
- **Missing text refuses marking.** Before a model call or daily slot, the handler returns `200 { notMarked: { reason: "reference_text_unavailable" }, saved: false }`, clears the lease and preserves the draft. The student is told quotations could not be checked just now. There is no mark, no silent pass and no slot spent. S1 cannot ship until the loader has run and the hash is verified.
- `validate-content` and the content builder read the local file directly, so model validation does not need a database. Tests never use real play lines.
- The text is never under `public/`, never imported by client code and never returned by a route. Extend `tests/no-key-leak.test.ts` with a test-time `ENGLISH_ESSAY_TEST_PLAY_SENTINEL`: seed it into PGlite, exercise every pre-result response and scan `.next/static`, failing if it appears. Separate tests prove that only an exact near-match correction and quotations in the released model essay are permitted after finishing.

**Principle V needs the R1 amendment** because this is a deployed reproduction with two narrow browser exceptions.

**Reason.** The public repository cannot hold the play, but a deployable deterministic checker needs it. A database is server-only, works in every environment and adds no runtime dependency.

**Alternatives rejected.** *Commit plain, encrypted or encoded text*: explicitly forbidden and offers no real secrecy. *Object storage or a new package*: unnecessary dependency and secret. *Mark with a warning but no quote check*: rejected; unverified marks could create false confidence. *Use real play lines in PGlite tests*: rejected; invented passages prove the algorithm without redistribution.

## R12. Gaps and "Things I need to know" (FR-031, FR-032)

**Decision.** Keep the 19 concepts (11 Away concepts and eight writing skills) in the unit's one record, extendable only through reviewed content with new ids and a prompt-version bump/gate rerun. Marker gaps are filtered to that list, deduped and capped at five in marker order. Used-well ids are filtered, capped at eight and made disjoint from gaps.

Write `results.concept_outcomes` with gaps as `correct: false` followed by used-well as `correct: true`, reusing `outcomesFrom`. Set `conceptsClearOnOtherQuestions: true` and `clearAfter: 2`. `lib/concepts/progress.ts` already replays a miss as count 2, ignores a correct redo of the raising essay, decrements on two later different essays and re-raises on a later miss; it needs no change. `conceptReviewCounts` uses the same replay. Latest English gap details feed the existing optional `ConceptPanel.details` prop.

**Reason.** This is exactly spec 010's tested derivation and avoids a second progress store.

**Alternatives rejected.** *Share progress with the unseen English unit*: rejected; the concept ids and essay-level clearing rule differ. *Store per-student counts*: rejected by Principle II. *Count redos or off-list concepts*: rejected by the spec.

## R13. Unit page and result page (FR-029, FR-030, User Stories 6–7)

**Decision.** The unit page lists live essays in id/offer order 1–6 with source, latest final mark and final band, and Start/Redo/Resume. One open attempt disables other starts. **Discard is S1** and uses the existing confirmation dialog with an endpoint prop. Finished essays offer Redo and the latest result replaces the displayed mark. Non-live essays are absent and cannot start.

The result uses the final mark and final band, four criterion rows with word/icon verdict badges, two lift points, and then:

- a question-focus warning only for `partly` or `barely`, including the marker's reason;
- every deduplicated knowledge error;
- every flagged quote, labelled in words "Near match" or "Not found in the play", with the exact correction only for a near match and a note that near matches cost nothing; a not-found flag adds "If these words come from another source, name it in your sentence."; `other-source` quotations are not shown;
- the student's essay and locked plan, stacked at 390 px and two columns from 900 px;
- the collapsed band 1 model essay, only on this student's finished result;
- up to five gaps with their detail lines.

The summary takes focus. Adjustment text states knowledge deduction/cap and focus cap without relying on colour. Raw mark and marker-selected band remain audit fields, not student-facing bands. Attempt detail reuses the same component; unfinished detail has only public question, plan and draft.

**Reason.** The final band must follow the adjusted mark, and the extra feedback must be understandable on a phone without colour or hidden key material.

**Alternatives rejected.** *Show the marker-selected band*: rejected by the clarification. *Require all six before listing*: rejected; staged release is required. *Show every successful quote check*: rejected; only flags need attention and this minimises play exposure. *Colour-only quote statuses*: rejected by accessibility requirements.

## R14. What reaches the browser, when (FR-039, SC-008)

**Decision.** Enforce this response map through one English view builder and the key readers in `lib/grading.server.ts`:

| Surface | May carry | Never carries |
|---|---|---|
| Unit page | public question/directive/definition/source/live/practice ids, latest final mark/band, open stage, own gap details | notes, Away notes, key tags, pilot essays, play, model |
| Start / resume | public question, own scaffold/review/draft, stage, cap; finished result only when finished | all key material and premature model |
| Scaffold save / lock | `{saved, words}` or `{started, stage, locked}` and validation errors | key material |
| Review | five own-plan lines; not-reviewed reason | notes, Away notes, play, model, mark |
| Essay draft | `{saved}` | everything else |
| Grade success | final mark/band, four verdicts/reasons, lift, focus, knowledge errors, quote flags, gaps, own essay/plan, model essay | notes, Away notes, key tags, pilot essays, other play text |
| Grade not-marked / errors | `notMarked` or error code and reset time | result, model, key material |
| Finished attempt detail | same as grade success | notes, Away notes, key tags, pilot essays, other play text |
| Unfinished attempt detail | public question, own plan/draft | model and every key field |
| Discard | `{discarded: true}` or error code | key material |

`englishEssayPublicView`, `englishEssayKeyForMarker` and `englishEssayModelEssay` are the only key readers; the reference-text module is the only full-play reader. Extend `tests/no-key-leak.test.ts` across every essay and every state, banning `textNotes`, `englishEssayKey`, `conceptTags`, `referenceText` and pilot/model content before the permitted result. Add import-boundary checks, response scans, the test-time play sentinel and production client-output scans.

**Reason.** A single release map prevents accidental leakage through resume, error or detail paths, not just the happy grade response.

**Alternatives rejected.** *Release the model after scaffold lock*: rejected; it is the answer. *Allow the full play in a signed-in page*: rejected; sign-in is not redistribution permission. *Scan only the grade route*: rejected; SC-008 covers every response and state.

## R15. Content tooling and the content task (FR-034, FR-035)

**Decision.** Plan the format and checks; the writing is a separate **Claude Code** task described in `content-prompt.md`.

Each gitignored `resources/english-essay/content/eN.json` contains `{ markingNotes, modelEssay, conceptTags }`, where tags are keys of the unit record. `scripts/english-essay-build-answers.ts` reads only Chiang-approved ids in `resources/english-essay/review/approved.json`, validates notes, 900–1,100 words, tags and zero quote flags against the local play, and deterministically writes `answers.ts`. It never sets `live`.

`scripts/check-english-essay-models.ts` prints each model's word count and every quote flag and exits non-zero on any flag; `validate-content` applies the same check to every live model. It is added to `OFFLINE_KEY_READERS` because it reads the server-only keys; the builder and parity runner do not need that registry. Essays 1, 2 and 3 are drafted/reviewed first, then 4–6. Each goes live independently only after Chiang's approval, the shipping marker gate and the full automated chain. Pilot essays remain calibration-only.

**Reason.** The format makes content review mechanical and prevents an unreviewed or unverifiable model from shipping while allowing staged release.

**Alternatives rejected.** *Qwen writes the content*: rejected by the prompt; Claude Code writes and Chiang reviews. *Generate models at runtime*: rejected by Principle III. *Ship all six only when complete*: rejected by the assessment deadline.

## R16. Delivery slices and schedule

**Decision.** **S1** contains the constitution, per-unit schema/reference loader, English content types and validation, unit page with Start/Resume/Redo/Discard, scaffold with "Start writing" only, essay page without a timer, approved marker with quote check and final-mark rules, result/attempt detail, gaps, essays 1–3, full tests and phone validation. Target deployment is **Fri 27 Nov 2026**, with **Fri 4 Dec 2026 as the hard deadline**, before Peyton's Mon 7 Dec task.

**S2** contains the plan review behind its pilot and Chiang approval, the optional 45-minute timer, and essays 4–6. S2 starts only after S1 is deployed; if S1 slips, S2 moves after the exam rather than weakening S1.

Suggested order: constitution and baseline first; additive types/migration/reference loader and pure English modules next; content essays 1–3 and the shipping marker gate in parallel; flow/screens; integration/leak/accessibility tests; content approval and live flags one at a time; full gates and phone check; deploy. Only the English-needed leaf props are changed in spec 010 code.

**Reason.** This puts a complete, useful rehearsal in Peyton's hands early and keeps optional work off the critical path.

**Alternatives rejected.** *Finish the general engine refactor first*: rejected; it delays the useful slice. *Hold S1 for review, timer or all six essays*: rejected by the deadline and staged-release requirement. *Ship before the marker gate, reference load or model quote checks*: rejected; those are trust gates, not optional polish.

# Research: Case Study Facts: China and Nepal (spec 012)

**Date**: Sat 28 Nov 2026. Read against the code on `main` at `f89c777`; `npm run validate` passes there
(14 units, all concept-ready).

## 0. The starting findings, checked

| Finding | Result |
|---|---|
| The quiz-groups branch of `drawAttempt` draws at random with no memory | **Confirmed**: `lib/attempts/draw.server.ts:179`, `pick()` per group. |
| `drawWeighted` prefers unseen only for weighted units, and its `withinMix: false` passes can move a place between groups | **Confirmed**: passes at `draw.server.ts:108-113`. Also: the non-weighted half is picked at random from each group regardless of what was seen, and the final top-up can borrow from another group. |
| `conceptsReady` gates weighting, the pipeline and the concept list | **Confirmed, with two gaps.** It also gates the ensure and status routes and the teacher concepts page. It does **not** gate the home page "to review" count (finding A). |
| `validate-content` accepts only `"Original question"` or a school-paper credit | **Confirmed**: `scripts/validate-content.ts:63-67,148`. |
| Concept ids are `<unit-id>.c-<slug>` | **Confirmed**: `content/concept-helpers.ts` (`defineConcepts`, `defineTags`). |

### Further findings the plan has to handle

**A. A tagged unit that is not concept-ready still gets a "to review" pill on the home page.**
`conceptReviewCounts` (`lib/concepts/progress.ts:127`) counts every unit whose questions carry tags; its comment
assumes an unadopted unit has none. In Release 1 a student who missed a question would see "1 to review" on the
card and nothing on the unit page, against FR-033 and constitution III.
**Decision**: `if (!unit.conceptsReady) continue;` in that loop, with one test. All 14 shipped units are ready, so
nothing else changes. *Rejected*: leave tags off until Release 2 (breaks FR-022 and FR-033); filter in
`app/page.tsx` (leaves the pure function wrong and untested).

**B. The short-answer marker's system prompt invites other figures.** `lib/openrouter.server.ts:163` says to accept
"accurate recent real-world data", and the spec's edge case says the mark is for the fact file's figure.
**Decision**: keep the marker unchanged (FR-021); every short answer's `notes` says that only the stated figure
(or the listed rounding) earns the figure mark, and marker case 7 tests it. The prompt also says "Year 11"; leave
it. *Rejected*: a per-unit prompt switch (new marker code two days before the exam). If case 7 fails after the
notes are strengthened, that switch is the fallback and needs your decision.

**C. A prompt must not give away what it marks.** FR-019 awards a mark for the year or period, so a prompt such as
"between 1990 and 2022" hands that mark over. Prompts ask for the change "with both values and both years" and do
not state them. In `content-prompt.md`; the check script warns on it.

**D. Two facts need care.** C25 has no source number ("secondary"), so an explanation about it alone says
"secondary source" in place of "Source S…". C14 has no year: its period is "over 40 years", and no start or end
year may be worked out for it.

## 1. Constitution check

**Release 1 needs no amendment**, with one reading you should know about (III).

| Principle | Release 1 |
|---|---|
| I | ✅ `factIds` is a field of the server-only key (`answers.ts`), never copied into a response. Explanations are released after an answer, model answer, rubric and notes with the short-answer grade: all existing behaviour. No fact ID appears in any student-visible text (validated). |
| III | ⚠ New ids, content as code, tags allowed on a unit not yet concept-ready; finding A restores "no revision list". The reading: the last bullet says "No quiz question is written by an LLM", and Claude Code drafts these 41. Its source is spec 002 FR-040, "**the system** MUST NOT use an LLM to write any quiz question": the app generating questions. Here the text is drafted at authoring time, committed, validated and read by you before release. |
| IV | ✅ The new content rules go in the validator in the same change. |
| V | ✅ Original questions, Topic 1, sources documented in `docs/y12-economics-case-study-facts-research.md` and the README. No HSC question, no diagram. |
| VI | ✅ The marker, self-mark fallback and cap are unchanged. The unseen-first draw is a preference: if results cannot be read, the quiz starts at random. It is **not** a "depends on stored progress" unit (specs 007 and 008), which refuses to start. |

If you read III literally, add the clarifying sentence below before release (a three-minute PATCH, 2.18.1). The
plan assumes the runtime reading and folds the sentence into Release 2's amendment.

### Release 2 amendment (draft; apply only with Release 2): 2.18.0 → 2.19.0 (MINOR)

*Principle I, new bullet after the English essay bullet:*

> - [DECISION] A unit whose `meta.ts` declares `conceptContent: "key-notes"` (spec 012,
>   `y12-economics-case-study-facts`) MAY send one further part of its key to the browser: a question's one-line
>   concept note (the fact with its figure and year, optionally followed by that fact's impact line). It MAY be sent only to the signed-in student whose own saved
>   results show less than full marks on that question, only while that question's concept is on their uncleared
>   list, and only for the most recently missed question of each listed concept. A note MUST NOT be sent before
>   then, MUST NOT be stored with results or put in a token, and MUST come through a function exported from
>   `lib/grading.server.ts`. The fact IDs a question tests MUST NOT reach the browser at any time. Such a unit MUST
>   NOT generate or show AI-written concept summaries or illustrations.

*Principle III, last bullet, replace with:*

> - Quiz questions MUST come only from the unit's question bank. The app MUST NOT use an LLM to write a quiz
>   question at request time. A question drafted with an AI tool while content is authored joins the bank only after
>   it passes validation and the maintainer has read it.

*Principle VI, append to the weighting bullet:*

> Preferring a question the student has not yet answered (spec 012) is a preference of the same kind: if results
> cannot be read, the quiz starts, drawn at random.

*Quality Gates, add to the constitution check:* "the case-study unit's fact IDs never leave the server, and a concept
note reaches only the student who missed that question". *Testing bullets:* "a case-study concept note is absent
before a miss and after the concept clears".

*Sync Impact Report reason:* spec 012 Release 2 shows a hand-written, fact-checked note under each concept a
student has missed, in place of AI summaries, which could introduce figures the fact file does not hold.

## 2. FR-014 source line

**Decision: Option B.** Keep the spec's string and allow exactly
`Original question — case study facts (checked Nov 2026)` in the validator, for this unit only. This differs from
your lean.

**Reason**:
- The case for A was keeping Release 1 to one code change, and that is not available: FR-007 changes the draw,
  FR-027/028 change the validator anyway, and finding A changes the progress count.
- B is one extra condition inside the validator edit already being made.
- A needs the final spec amended (FR-014 and User Story 1 scenario 7). B does not.
- The date stays beside every question, including when figures are revised before the 2027 HSC; a unit description
  is clamped on phones.

**Rejected**: A (above); loosening `SOURCE_RE` (weakens the school-paper credit rule for every unit); omitting
`source` (FR-014 requires it).

**To choose A instead**: set `SOURCE = "Original question"` in the unit's `build.ts` and in the case-facts rules,
skip the validator condition, and amend FR-014 and scenario 7.

## 3. FR-007 unseen-first draw (Release 1)

**Decision**: an opt-in `quiz.drawUnseenFirst` on `QuizConfig`.

```ts
// lib/attempts/draw.server.ts
export interface DrawHistory { lastAnswered: ReadonlyMap<string, Date> }

function drawUnseenFirst(unit: Unit, history: DrawHistory, rand: RandomInt): Question[] {
  const at = (q: Question) => history.lastAnswered.get(q.id)?.getTime() ?? 0; // 0 = never answered
  return unit.quiz!.groups!.flatMap(({ group, n }) =>
    shuffle(unit.questions.filter((q) => q.group === group), rand) // random among ties (sort is stable)
      .sort((a, b) => at(a) - at(b))
      .slice(0, n));
}
```

In `drawAttempt(unit, rand, weighting?, history?)`: when the unit opts in and `history` is present, use
`drawUnseenFirst`; `drawWeighted` is **never** used for an opting-in unit, so the five-slot shape holds even if
`conceptsReady` is switched on early; with no history, the existing random groups draw runs.

In `app/api/attempts/route.ts`, next to the weighting load: for `session.kind === "user"` and an opting-in unit,
`dbCall` the existing `listUnitResultsForProgress(db, user.id, unit.id)` (scoped to the session user), build the map
(rows come in answer order, so the last wins), and on **any** error leave `history` undefined.

**Seen** means a saved result exists. A drawn but unanswered question stays unseen. A result still waiting in the
browser outbox is not yet seen (existing behaviour).

**Proof of FR-009**: (1) a test over every registered unit: only this one sets the flag, and for every other unit a
draw with a history equals the draw without one, over many seeds; (2) once, during implementation, dump seeded draws
for every unit to `.cline/tmp-draw-baseline.json` **before** editing `draw.server.ts`, compare after, then delete.

**Rejected**: making unseen-first the behaviour of every groups unit (breaks FR-009); reusing `drawWeighted` with a
fake weighting (it can move places between groups); the sequential draw of spec 007 (refuses to start without a
database, against US2 scenario 4); storing a per-student "seen" list (new stored data); a committed snapshot of every
unit's draws (breaks whenever any unit gains a question).

## 4. Release 1 concept handling

**Decision**: every question is tagged (`concept-tags.ts`), `concepts.ts` holds the 11 concepts, and `conceptsReady`
is **not** set.

**Confirmed**: `validateConceptRules` checks tags and concept lists on every unit and requires them only on ready
units (`lib/content-rules.ts:43-87`), so no rule needs relaxing. The case-facts rules (§7) add "every question
tagged", which nothing else enforces until Release 2. With the flag off there is no list on the unit page, no
weighting, no pipeline, and the concept routes answer 404. The one leak is finding A.

**FR-033**: progress is replayed from saved results using each question's current tag
(`conceptProgress`), so Release 1 answers count the moment Release 2 sets the flag. No migration, no backfill.

**Concept descriptions** ship in the public bundle from Release 1, so they state a topic only: no figure, year,
name that answers a question, or direction of change (validated: no digits). Text in `data-model.md` §3.

## 5. Release 2 design (build after Tue 1 Dec)

**Switch**: one public field, `UnitMeta.conceptContent?: "key-notes"`, with `conceptsReady: true`, and one predicate
`hasAiConceptContent(unit) = unit.conceptsReady && unit.conceptContent !== "key-notes"`. The predicate replaces the
bare flag where AI content is made or shown: the unit page's content load (so `ConceptLive` never mounts), the ensure
and status routes (404), `runConceptPipeline` and `startTeacherRegeneration`, the teacher page's concept list, and
`approveConcept`.

**FR-008 draw**: extend `DrawHistory` with `missed?: ReadonlySet<string>` (uncleared concept ids). Within each group
only, sort by `(answered ? 2 : 0) + (missed ? 0 : 1)`, then least recently answered, ties random. That gives: unseen
on a missed concept, unseen, seen on a missed concept (oldest first), seen (oldest first). One query: the route
builds `missed` from the same rows with `conceptProgress`, and does not call `loadWeighting` for this unit.
*Rejected*: "half the places" across the quiz (FR-008 forbids moving places); ranking by concept count or
last-answered-wrong (the spec asks only "missed, then oldest").

**Concept note**: `Answer.conceptNote?: string` in the server-only key. It may end with the missed fact's impact line
(FR-024), without any quantity or trend that line states (§11). `latestMissByConcept(unit, results)` (pure, in
`progress.ts`) picks the most recently missed question per uncleared concept; `conceptNotes(questionIds)` in
`lib/grading.server.ts` reads the notes; the unit page passes them to `ConceptPanel`'s existing `details` prop.
Nothing is stored and no response shape changes. `ConceptPanel` uses "Things I need to know" and unit-specific sub
and empty text when `conceptContent === "key-notes"`. Validator: with that value, every key has a one-line note of
at most 450 characters (a fact sentence plus an impact line of up to 219; no line break); the check script traces its
figures.

*Rejected*: a second switch for the heading (one switch is enough); a notes file beside the key (it would escape the
import guard in `tests/no-key-leak.test.ts`); sending notes with the grade response (the spec puts them on the unit
page); reusing the AI pipeline with a fixed summary (FR-026).

**Order inside Release 2**: gates and draw, notes written and fact-checked, your read, amendment, then
`conceptsReady: true`, all in **one** deploy. Setting the flag without the gates would start AI generation.

## 6. Content format

- **Ids**: `y12-economics-case-study-facts.m01`–`m16` and `.s01`–`s25`; new ones are appended.
- **Builders**: `build.ts` copied from the global economy unit: two digits, the group as a parameter, the source
  constant inside, no diagrams.
- **Groups**, in quiz order: `mc-china`, `mc-nepal`, `sa-china`, `sa-nepal`, `sa-both`, one each; `short: 3`,
  `mc: 2`, `passMark: 55`.
- **Fact IDs and notes**: new optional fields on `Answer` (`factIds`, later `conceptNote`). `answers.ts` is already
  reachable only through the `server-only` registry, and the grade and self-mark paths copy named fields, never the
  whole key. *Rejected*: a separate `facts.ts` map (unguarded by the import test, and can drift from the key);
  fact IDs on the public question (FR-029).
- **Rubric** (FR-019), one point per mark, already enforced by the validator. Three marks: `Figure: …`,
  `Period: …`, `What it shows: …`. Two marks: the event or figure with its year, then `What it shows: …`. The
  `What it shows` point states the impact line's significance for the question's fact(s), in student words (§11).
- **Notes** (FR-020): the student reads them in italics under the model answer (`components/Quiz.tsx:1244`) and the
  marker receives them as "Marking guidance", so they are plain sentences addressed to the student that also
  instruct the marker: what is accepted, what the change questions need, "only this figure", no day or month needed,
  which significance earns the last mark (the expected point or another one the case study supports), and that
  restating or the wrong direction earns nothing. No fact IDs, no "the marker should".
- **MC**: four options, `correctText`, one `rubric` sentence (not displayed by the quiz). Each wrong option has an
  entry in `explanations.ts` that states the correct fact in words with its figure and year and ends "(Source S8)".
  It may add the fact's impact line before that source. At least 4 of the 16 test significance rather than recall.
  It shows only when the student picks that option. `explanationsComplete: true`.
- **Tags**: one per question; its group must match one of the question's facts.

## 7. Checks (FR-027, FR-028)

**Decision**: the rules are a pure module, `lib/content-rules-case-facts.ts`, **called by `validate-content`** and
exercised by vitest with fixtures.

**Reason**: User Story 4 says the build stops, and constitution IV puts content rules in the validator. `prebuild`
runs the validator; Vercel's build does not run vitest, so a test-only coverage check would not stop a bad deploy.

**Fact file**: **parse the markdown** at check time (`lib/case-facts/fact-file.ts`). Checked today: 57 rows match
`| C01 |` / `| N01 |`, all with six cells, 36 with ★, in 11 `###` sections; sources are `- **S1**` lines. The parser
throws on a fact-id row without six cells, a duplicate id, a row outside a lettered section, or no facts at all; a
test pins 57 / 36 / 11 so a format change is noticed. Line endings may be LF or CRLF.
It also parses the `## Context and impact` bullets (`- **C01** …`) into a map from fact ID to impact line, and throws,
naming the ID, on a fact with no line or two, a line for an ID that has no fact row, or a digit outside the ID. A test
pins 57 impact lines. The validator and the check script report the thrown message.
*Rejected*: a generated JSON (a second list that can drift, and a step to forget); IDs typed into code (the spec
makes the file the only list).

The fact file is untracked today: **it must be in the Release 1 commit**, or the Vercel build fails.

| Rule (each message names the unit, question or fact) | Spec |
|---|---|
| The five groups, in order, `n: 1`, `drawUnseenFirst`; each pool at least 8; every question in one of them with the matching type | FR-005, 006, 027 |
| Every source is the exact FR-014 string | FR-014 |
| `explanationsComplete` is set (the existing rule then requires every wrong option explained); four options | FR-016, 017 |
| Each explanation cites a source number of one of the question's facts (or says "secondary source" if they have none); cited numbers exist | FR-017 |
| Short answers are 2 or 3 marks with non-empty notes (rubric length is already checked) | FR-018–020 |
| Every key names at least one fact, no repeats, all in the fact file; China pools only `C`, Nepal pools only `N` | FR-013, 028 |
| Every ★ fact tested; every fact group has a question; no fact in more than 3 questions | FR-010, 011, 028 |
| Exactly one impact line per fact, none for an unknown ID, no digit outside the ID (the parser throws) | FR-028 |
| Exactly the 11 concepts; every question tagged, with a group matching one of its facts; no digit in a description | FR-022 |
| No fact ID in any prompt, option, model answer, rubric, note or explanation | FR-029 |

## 8. Fact-check report (FR-032)

**Decision**: `specs/012-economics-case-study-facts/fact-check.md`, two layers.
1. The content agent writes, per question, each figure, date, name and source number with the fact ID it traces to,
   and for each short answer where its significance point comes from, plus lists of everything rounded, changed or
   untraceable (format: `data-model.md` §6).
2. `npm run case-facts:check` (`scripts/check-case-facts.ts`) independently runs the §7 rules on the unit folder
   (registered or not), traces every number and full date, and rewrites only the block between
   `<!-- script:start -->` and `<!-- script:end -->`. It exits 1 on a rule error or an untraced value.

Tracing (`lib/case-facts/trace.ts`): strip thousands commas and a leading `FY`; take numbers, `2024/25`-style
periods and `11 Dec 2001`-style dates; skip digits glued to letters (CO2, S8) and mark counts. Impact lines are never
a source of values: the whole `## Context and impact` section is left out of "anywhere in the fact file" matching and
of the name list. It holds no digits today; this stays a rule. For answer text
(correct option, model answer, rubric, notes) a value must be in the question's own fact rows; for prompts, wrong
options and explanations, anywhere in the fact file. Results: `OK`, `ROUNDED` (fewer significant figures, within 5%
of a row value), `OTHER ROW`, `UNTRACED`. It also warns on a changed magnitude word (bn, million), on an SA prompt
that contains a value its own figure or period point awards, on facts shared by an MC and a short answer, and lists
capitalised words absent from the fact file.

The script cannot judge direction of change, which country, whether a significance claim is sound, or a quantity in
words taken from an impact line: those are your read. **Rejected**: a script-only report (it would be the only pair of eyes on names and meaning); an agent-only one
(it checks its own work); a vitest gate on tracing (rounding needs judgement).

**Your read-through checklist** is in `quickstart.md` §3.

## 9. Marker check (SC-005)

**Decision**: `npm run case-facts:marker-check` (`scripts/case-facts-marker-check.ts`) reads
`specs/012-economics-case-study-facts/marker-cases.json`, calls the app's own `gradeAnswer` (same prompt, key and
`GRADING_MODEL`), three runs per case, and prints expected against awarded with the marker's feedback. A case passes
only if all three runs match; a self-mark fallback is an error, not a mark. Runs on your machine
(`OPENROUTER_API_KEY` from the environment, `.env.local` or `.env`), touches no database or daily cap, sends no
student data. Release 1 has nine cases (`data-model.md` §7): your six, the outside-figure case from finding B, and two
on significance (§11): another supported point earns the mark, and a wrong direction with correct figures loses it.
Release 2 extends the same file to every short answer (about 100 cases, 300 calls).

**On a failure**: strengthen that question's notes, apply the same wording to similar questions, re-run all cases,
and include the change in your read.

**Rejected**: testing through the running app (needs a database and sign-in, and costs daily slots); a Python port
like the essay pilots (a second copy of the prompt); one run per case (hides an unstable mark).

## 10. Unit page and copy (FR-001 to FR-004)

Exact `meta.ts` text is in `data-model.md` §2. **Listing**: `created: "2026-11-30"` puts it at the top of Year 12 by
the existing newest-first order, with the NEW pill; no code. **Pass mark** 55. **Guide**: three items with no
figures. The unit page already shows the guide below the history and clamps the description on phones; no layout
change. **README**: one units-table row citing the fact file, and half a sentence on `drawUnseenFirst`.
**Not done**: adding the unit to the AT1 entry in `content/exams.ts`. The spec does not ask for it; it is one line
if you want the countdown on this unit.

## 11. Impact lines (added 28 Nov)

**Decision**: the fact file's `## Context and impact` line for a fact is the expected significance of that fact. Each
short answer's significance point and model-answer sentence are based on the line(s) of its fact(s), in student words;
any other significance the fact file supports also earns the mark. At least 4 multiple-choice questions test
significance. An explanation, and a Release 2 concept note, may add the line.

**Reason**: the marked practice essay lost marks for quoting facts without saying what they show. The lines make the
significance mark consistent across the 24 short answers and give the content agent an approved source, instead of
each statement being written fresh and checked only by the maintainer's read.

**Rejected**: writing each significance statement from scratch (24 separate judgements, no common source, and the read
is the only check).

**Limits**:
- Interpretation only. Several lines state a quantity, ranking or trend (for example C08 "forty-fold", C23 "doubled in
  seven years", C26 "narrowed slightly", C27 "largest emitter", N25 "fast growth"). Content uses the point and leaves
  that part out; the fact rows govern. The script cannot catch quantities in words.
- Some lines carry study advice (C04, C24, C25). It is not a significance point.
- The marker sees only the rubric and notes, so "another point the case study supports" is its own judgement. The
  notes name the expected point and rule out restatement and the wrong direction. Marker cases 8 and 9 sample both
  sides of that judgement.

## Contracts

**No `contracts/` folder.** No request, response, token or table changes in either release: the draw picks different
ids inside the same `POST /api/attempts` response, and Release 2's notes are server-rendered on the unit page. The
concept routes' 404 for this unit is the existing answer for a unit without AI content.

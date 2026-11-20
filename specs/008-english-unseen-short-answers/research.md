# Research: Advanced English Unseen-Text Short Answers

Decisions for [plan.md](plan.md). Each has the decision, the reason and the alternatives rejected.
The code read for this plan is the spec 007 implementation (`lib/paragraph/*`, `components/paragraph/*`,
the grade, attempts, paragraph flag and draft routes, `lib/db/schema.ts`), the draw and progress code, and the
pilot (`resources/english-unseen/`, `scripts/pilot-unseen-marker.py`). Spec 007's rules carry over unless
this spec says otherwise; this document only records where 008 differs or adds.

Terms used here: **try 1** and **try 2** are the first try and the retry (the paragraph unit calls them
phase 1 and phase 2; the API keeps the `phase` field name for the draft and grade routes so the shared
routes and the draft table need no change). **Key** is answer-key material (marking criteria, marking
notes, model answer, visual description).

---

## R1. Constitution amendments (2.14.0 → 2.15.0, MINOR)

The Constitution Check found six places where this unit cannot comply with 2.14.0 as written. Task T001
applies all of them, bumps the version to **2.15.0**, sets Last Amended to 2026-11-19 and adds the Sync
Impact Report entry, before any other task. Exact text follows (bold is the new wording).

### A1. Principle V: cropped visual stimulus images, stimulus texts, school guidelines

**Decision.** Replace the "Every diagram" bullet and add one bullet after it.

> - Every diagram MUST be redrawn in code (for example a per-unit `diagram.ts`). Scanned,
>   photographed or otherwise copied images MUST NOT be committed or served**, with one exception.
>   [DECISION] While the app is non-commercial, a visual stimulus text of an unseen-text unit (spec
>   008) MAY be an image cropped from a school trial or half-yearly paper, under the school-paper
>   exception above. It MUST show its credit (school, year, paper type, question number) with the
>   question; it MUST be committed only under that unit's own `images/` folder and served only to a
>   signed-in student through an authenticated route, never from a public path and never listed or
>   guessable without a session; it MUST NOT come from a real HSC paper; and before the app goes
>   commercial it MUST be removed, or replaced by an original or properly licensed image, together
>   with its question**. This rule covers question content, not student answers (photo answers are
>   permitted).
> - **[DECISION] The school-paper exception also covers the stimulus text printed with a copied
>   question (a poem, extract or article, with its title, author and source line as the paper prints
>   them) and the school's marking guidelines and sample answers where they are used as the
>   question's rubric and model answer (server-only, Principle I). The same duty applies before the
>   app goes commercial: the question is removed, or its text is replaced by an original or
>   licensed text.**

Also amend the Rationale sentence "Redrawing diagrams in code keeps them accurate, accessible and free
of scanned third-party artwork" with "(the one exception is a cropped visual stimulus under the
school-paper exception)".

**Where the images may live.** Only under `content/units/y12-english-advanced-unseen-texts/images/`
(see R3). Never under a public path, never in `resources/` (not deployed), never in a database.

**Reason.** A visual text IS the stimulus; a redrawn diagram would be a different text. The rule's intent
(no redistribution, credit, stop if commercial) is kept; only the format is widened, with the access
control Principle II already demands. Stimulus poems and extracts are copied by the same exception the
questions use, so the constitution should say so rather than leave it implied.

**Alternatives rejected.** (a) Redraw each visual text in code: lossy, and it changes what the student
analyses (a drawing's composition IS the answer). (b) Skip visual texts: they are one of the four text forms in
the pilot's tuning set and common in Section I; the unit would not match the exam. (c) Describe the image
in words only: the student must see the text they are asked about. (d) An exception for any copied image,
not only unseen-text units: wider than needed.

### A2. Principle VI: no self-marking, no first-try ending, database-down behaviour

**Decision.** Change the "Any LLM failure" bullet's last words and add two bullets.

> - Any LLM failure (…) MUST fall back to student self-marking (`needsSelfMark`)**, except in the units
>   that say otherwise below**. It MUST NOT show an error or award a wrong mark. (…)
> - **[DECISION] The unseen-text short-answer unit (spec 008) is never self-marked, on either of its two
>   tries, and a try that cannot be marked does not end the question. If the marker fails (no key, a
>   failed call, or an empty, cut-off, unparseable or incomplete reply after one retry), the student's
>   answer stays locked on screen while the app retries; if marking still fails, the editable box
>   returns holding the text with a plain notice that it could not be marked just now, no mark is
>   invented, and the AI slot is refunded. If the student is over the daily cap, the app tells them they
>   have reached today's marking limit and to come back tomorrow; the answer stays in the box, Submit
>   stays disabled until the next Sydney day, and the question waits at that step and is offered again
>   first. These notices are plain status messages, not errors, and nothing else is shown. A student
>   may still decline the retry, which records the first try's mark.**
> - **[DECISION] The unseen-text unit cannot start, resume, mark or save a quiz without the database: it
>   draws from the student's results, offers an unfinished question first, reserves a daily-cap slot and
>   stores each try. If the database cannot be read, the unit shows a notice and asks the student to try
>   again; it MUST NOT guess the next question or a resumed step, MUST NOT mark an answer it cannot save,
>   and MUST NOT self-mark. This overrides the "weighting" and "database cannot be read at all" bullets
>   for this unit, as the sequential-unit bullet does for spec 007.**

And amend the 2.14.0 sequential-unit bullet to read "A unit whose draw is sequential (spec 007) **or
depends on stored progress (spec 008)**…" so the three units share one rule.

**Reconciling "MUST NOT show an error".** The notices ("We couldn't mark that just now", "You've reached
today's marking limit") are statements about a state the student can act on, not error messages with
codes; the HTTP responses are `200` with a `notMarked` body so the client never treats them as failures
(R7). The unseen unit differs from the general rule only in WHAT the fallback is (wait, then return the
box) because self-marking an interpretive English answer against a band descriptor is not a fair mark
(the spec decided this; the constitution must say so).

**Database down.** The unit does not start (`503 temporarily_unavailable`), does not resume and does not
mark. Mid-quiz, a marking request that cannot read the database answers `503` and the box returns holding
the text (the same "request did not complete" path as a dropped connection). Rejected: draw unweighted
with `persisted: false` as other units do (a resumed step could be guessed wrong, the daily cap could not
be enforced, and the mark could not be saved); marking without saving (a mark the student sees but the
database never records would break "recorded mark" and the cap).

### A3. Principle I: the new key fields and routes

> - **[DECISION] The unseen-text short-answer unit (spec 008) MAY send part of its key to the browser at
>   defined moments, and only then. Before the first try is marked: nothing from the key (the stimulus
>   text, the question, its marks and its source are public content). After a try is marked: the
>   per-skill verdicts, the marker's one-line reasons, its feedback and its biggest-gap sentence (never
>   model-answer text; the server rejects a marker reply that repeats a long run of the model answer).
>   At the discussion (the first try at full marks, a question with no retry, a marked retry, or a
>   declined retry): the model answer. Never, at any moment, including reload, resume and the attempt
>   detail page of an unfinished question: the marking criteria, the marking notes, a visual text's
>   written description, or the model answer before the discussion. Key material MUST come through
>   functions exported from `lib/grading.server.ts`.**

And amend the submission-routes bullet: add "**for the unseen-text unit's retry-decline route,
`attemptId`, `questionId` and the signed attempt token**" and add to the other-routes bullet "**or the
text id of a stimulus image, which the server checks against the unit's texts**".

### A4. Principle II: the stored attempt

> - **per unseen-text question in an attempt (spec 008): the first-try and retry texts, their marks,
>   the seven per-skill verdicts each with the marker's one-line reason, the feedback and biggest-gap
>   sentence shown, the prompt version and model that marked each try, how the question ended (full
>   marks, retried, declined, or no retry offered), and the recorded mark; stored in a phase row, kept for the attempt detail page, deleted with
>   the student like results. The student's in-progress draft text is stored in the existing draft row.
>   Verdicts and reasons never change marks or concept tracking, which always come from the
>   first try's verdicts.**

And in the local-test-files sentence: "Answer text and per-criterion **or per-skill** results MAY be
copied…". The derived concept-count rule needs **no** change (R10): it already reads "2 for a concept
whose `concepts.ts` entry declares `clearAfter: 2`". Stimulus images are behind a session by the existing
"every page and API route… MUST require a signed-in Google account" rule; the new route is listed in the
Constitution Check, not amended.

### A5. Principle VII: a unit-specific model and the re-mark

> - **`ENGLISH_ADV_GRADING_MODEL` follows the same server-only rules as `OPENROUTER_API_KEY`. It is the model the
>   unseen-text unit marks with (default `deepseek/deepseek-v4.1-flash`). Each marked try counts one
>   slot against `LLM_DAILY_CAP`, refunded if the marker fails.**
> - `REMARK_MODEL` … read only by `scripts/**` for the offline re-mark of full-mark paragraph **and
>   unseen-text** answers, which does not count against `LLM_DAILY_CAP`.

### A6. Quality Gates

The "constitution check confirming" list gains: "**the unseen-text unit's marking criteria, marking
notes, model answer (before the discussion) and visual descriptions never leave the server, and its
stimulus images are served only through the authenticated route**". The testing list gains: "**the
unseen-text unit's marker failure returns the editable box with no mark and no self-mark, its daily-cap
state disables Submit until the next Sydney day on both tries, and a try's skill outcomes clear after 2**".

### Checked and not needing amendment

Principle III (the unit's folder holds an extra `images/` folder; ids `<unit-id>.<school><yy>-q<n>`
appended and never renumbered, as spec 007's `eNNpK`; every question carries concept tags); IV (the
validator is extended in the same change, R2); VIII (no new runtime dependency, R3 and R12: native
`<dialog>`, `<img>`, `fs`); IX (no teacher route; the scripts read the database directly like
`delete-student`). Principle V's "sources documented" rule: `docs/y12-english-advanced-unseen-texts-research.md`
holds the paper inventory and the rubric sources.

---

## R2. Content shape (FR-001 to FR-007, FR-039 to FR-046)

**Decision.** One unit folder, `content/units/y12-english-advanced-unseen-texts/`, with a public half and a
key half, mirroring spec 007's split.

| File | Public? | Holds |
|---|---|---|
| `meta.ts` | public | `UnitMeta`: `type: "Writing Practice"`, `topic: "Texts and Human Experiences"`, `conceptsReady: true`, new `draw: { kind: "unseen-weighted" }` (R9), `guide` |
| `texts.ts` | public | each text once: `id`, `form`, `heading` ("Text 2 – Poem"), `title`, `author`, `sourceLine`, `body`, `footnotes`, `hscChecked`; for a visual `body: { kind: "image", image, alt }` |
| `questions.ts` | public | `UnseenQuestion[]` pointing at `textId` |
| `concepts.ts` | public | seven concepts built from `lib/unseen/skills.ts` (R10) |
| `answers.ts` | **server-only** | `AnswerSet` assembled from `keys.ts`, `descriptions.ts` and `description-checks.ts` |
| `keys.ts` | **server-only** | per question: `criteria`, `notes`, `model`, `modelOrigin`, `criteriaOrigin`, `reviewedOn` |
| `descriptions.ts` | **server-only** | per visual text: the marker's written description |
| `description-checks.ts` | **server-only, generated** | per visual text: the pre-release check result (R3) |
| `images/*.webp` | served only by the authenticated route (R3) | the cropped visual stimuli |

Types (full definitions in [data-model.md](data-model.md)):

- `UnseenText.body` is a union: `poem` (`stanzas: string[][]`, `lineNumbers?: { every: number }`), `prose`
  (`paragraphs: string[]`), `image`. A poem keeps stanza and line breaks exactly; leading spaces are kept
  (rendered with `white-space: pre-wrap`). `footnotes: { mark: string; text: string }[]` keeps the paper's
  glossary lines. Text forms: `"poem" | "prose-fiction" | "non-fiction" | "personal-essay" | "visual" |
  "drama" | "speech"` (a closed union; adding a form is a code change that touches the draw's form list).
- `UnseenQuestion` extends `BaseQuestion` with `type: "unseen"`, `group: "unseen"`, `textId`, `verb`
  (a key of the rubric's `directiveVerbs`, lower case), `parts?: { label: string; text: string; marks: number }[]`
  (FR-007: all parts shown together; `maxMarks` is their sum when present), `suggestedWords`,
  `suggestedFrom: "lines" | "median"`, `paper: { school, short, year, exam: "Trial" | "Half-yearly", qNo }`,
  `outcome: "EAV-12-01" | "EAV-12-02" | "EAV-12-04"`, and `concepts` (the 1 to 3 skill concept ids; tags
  are not answers). `source` is derived from `paper` by one helper (`sourceOf`, in the public pure module `lib/unseen/source.ts`, imported by the bank generator, the validator and the question block) so the credit is always
  "Fort St 2025 Trial, Q1" (Principle V's four
  items).
- Question id: `y12-english-advanced-unseen-texts.<short><yy>-q<n>`, for example `….fs25-q1`. The suffix
  equals the pilot's case-id prefix so the description-check script and the field export can map a bank
  question to its pilot entry without a table. Ids are appended, never renumbered.

**Public vs key (Principle I's import rule).** Everything in the left half of the table is imported by
`content/index.ts` and reaches the browser. The key half is read only through `lib/grading.server.ts`
(`content/answers/index.ts` stays the only importer of `answers.ts`; `tests/no-key-leak.test.ts` already
enforces that, and gains the unseen exports). `texts.ts` is public even though the visual description is
key: the description lives in `descriptions.ts`, never beside the image reference, so a text object sent
to the browser cannot carry it.

**Validation (FR-046, Principle IV).** `validateUnseenRules(unit, answers, today)` in `lib/content-rules.ts`,
called from `scripts/validate-content.ts`, fails the build when any shipped unseen question:

1. has no `paper` fields, or `source` differs from `sourceOf(paper)`, or `paper.qNo` is not 1 to 4, or the
   year is outside 2023 to 2026, or the exam is not Trial or Half-yearly;
2. has a `textId` that does not resolve, or a text whose `hscChecked` date is missing or in the future, or
   whose `form` disagrees with its body (`visual` iff `image`);
3. has no skill tags, more than three, a repeated tag, a tag that is not one of the seven, or `concepts`
   differing from the tags;
4. has `maxMarks` outside 1 to 6, or `parts` whose marks do not sum to `maxMarks`, or `verb` not in the
   rubric's `directiveVerbs`, or `outcome` not one of the three;
5. has no `suggestedWords`, or `suggestedFrom: "lines"` with a value that is not a positive multiple of 12,
   or `suggestedFrom: "median"` with a value other than `MEDIAN_WORDS[maxMarks]` (FR-011, R6);
6. has no answer key, or empty `criteria`, or `criteria` without a band line for every mark from the
   maximum down to 1 (lines starting "N –" or "N -"), or empty `notes` (the string "None provided by the
   school." is allowed and is what the pilot stores), or an empty or too-short `model` (under 40 words), or
   a `model` longer than `floor(1.2 × suggestedWords)` (a model answer the student could not submit);
7. has `modelOrigin` or `criteriaOrigin` of `"drafted"` without a `reviewedOn` ISO date that is not in the
   future (FR-042: drafted material is flagged new for review and cannot ship until reviewed);
8. for a visual text: has no image file in `images/`, an empty `alt` or one over 250 characters or one sharing
   a 40-character run with the description, no description, no check result, a check with `adequate: false`,
   or a check whose `descriptionHash` is not the sha256 of the current description (editing the description
   invalidates the pass);
9. leaks key text into public content: a 40-character run of `model`, `criteria`, `notes` or a description
   appears in the question's prompt, parts, source, `alt`, the skill tips, or any other text, **unless** that
   run also appears in the question's own stimulus text (model answers legitimately quote the text; the
   stimulus is public by design);
10. repeats an id (question or text) or points two questions at one text with different headings.

A failing fixture and a passing fixture per rule, as `tests/unseen/content-rules.test.ts`.

**Starter bank.** The five pilot **tuning** questions whose rubric and model answer are the school's own:
`fs25-q1` (poem, 3 marks), `fs25-q2` (prose fiction, 4), `fs25-q3` (non-fiction, 3), `fs23-q1` (visual, 3),
`fs23-q4` (prose fiction, 4). Four text forms, three mark values. The visual question ships only after its
description check passes (R3), so the starter bank may be four questions until the cropped image and check
exist; the plan does not make the starter bank's size a gate.

**Holdout questions (Cheltenham Girls 2023, St George Girls 2025): not in the starter bank.** They WILL
ship with the full bank (SC-004 requires every usable question, and these are usable). The decision is
about the starter bank and about keeping the frozen set honest: the holdout set is a **snapshot** in
`resources/english-unseen/pilot-questions.json` (its own copy of text, criteria, notes and anchors), so a
later edit to the bank's copy of a question (a corrected criteria line, a reviewed model answer) cannot
change what the frozen set measures, and a disagreement found by the re-mark on that question becomes a `field` case
(its own set), never a holdout case. Shipping them is therefore safe once the bank holds a copy
independent of the pilot file; leaving them out of the starter bank costs nothing because the starter
bank only has to exercise the machinery. The two St George Girls questions also have **authored** (not
school) sample answers and "None provided by the school" criteria, so they cannot ship until a teacher has
reviewed them (rule 7) whatever the holdout decision.

**Rejected.** (a) Texts inside `questions.ts`: two questions on one text would store it twice (FR-041 says
once). (b) One big key file: `descriptions.ts` and the generated checks change on a different cadence from
criteria. (c) Putting criteria in public data because school guidelines are "the school's": Principle I
lists rubrics as key. (d) Hand-writing the bank for 37 papers in TypeScript: see the tooling below.

**Tooling and formats for the content task (not plan tasks beyond the tooling).** The inventory,
extraction, OCR, crops and rubric drafting (R-001 to R-008) are a separate content task. The plan builds
only what that task writes into:

- `resources/english-unseen/inventory/<school>-<year>.json` (gitignored): `{ paper: {...}, questions: [{
  qNo, marks, texts: ["Text 1"], forms: ["poem"], decision: "kept" | "skipped", reason }] }`. One file
  per paper; every Section I question appears, kept or skipped with a reason from a fixed list
  (`two_or_more_texts`, `not_q1_to_q4`, `text_illegible`, `text_missing`, `hsc_text`, `visual_not_describable`,
  `scan_needs_ocr`, `reserved_holdout`). `reserved_holdout` is used for every question of the two papers
  that make up the marker's frozen holdout set (Cheltenham Girls 2023, St George Girls 2025): their inventory
  files list every question as skipped for this reason and they are never written to the bank, so the
  frozen set stays unseen by the prompt and by the shipped bank (an HSC-style rule of the pilot, not a
  quality judgement about the questions).
- `resources/english-unseen/hsc-texts.json` (gitignored): the Section I texts of the NESA HSC English
  Advanced and Standard Paper 1 papers 2019 to 2025 with their sources, built once and reused by every
  batch; a bank text's author and title are checked against it before `hscChecked` is set.
- `resources/english-unseen/bank/<school>-<year>.json` (gitignored): the kept questions' verbatim material
  (text with layout, criteria, notes, model, origins, answer-line count, tags). This is the content task's
  output and the generator's input.
- `scripts/unseen-build-bank.ts` (new): reads `bank/*.json` and writes `texts.ts`, `questions.ts`,
  `keys.ts` and `descriptions.ts` deterministically (sorted, stable formatting), so the 37-paper extraction
  becomes reviewable committed TypeScript and re-running it is idempotent. It refuses a text with an
  unresolved `hscChecked`, writes `suggestedFrom: "median"` where `answerLines` is null, and never writes
  `description-checks.ts` (R3 owns that). Questions whose criteria or model answer are drafted and have no
  `reviewedOn` date are **pending review**: by default the generator keeps them (and texts only they use) out
  of the unit, so `npm run validate`, the tests and the build stay green while a batch awaits approval;
  `-- --include-pending` writes them for a preview (validation then fails by design). Setting `reviewedOn` in
  the bank file and rerunning ships them.
- `scripts/unseen-report.ts` (new): the review report (R-008), written to
  `resources/english-unseen/review/report.md`: per paper kept and skipped (with the reasons), counts by text
  form and by mark value, and the rubric source per question (school or drafted, reviewed or not). It reads
  `bank/*.json`, so questions pending review are counted. The
  format is fixed so the approval is a checkbox per section; the approval itself is a teacher task.

**Median fallback (FR-011).** `MEDIAN_WORDS` in `lib/unseen/limits.ts` is `{ 1: 72, 2: 144, 3: 204, 4:
288, 5: 360, 6: 432 }` at launch (the values the pilot's counted papers give: 3 marks 17 lines, 4 marks 24
lines; 1, 2, 5 and 6 marks are extrapolated at 6 lines a mark until counted data exists). The report
script recomputes the medians from the kept questions with `suggestedFrom: "lines"` and **fails** when a
mark value that has counted data differs from the table; mark values with no counted data are not checked
(they keep the extrapolated figure), so the table can only change deliberately, in a reviewed commit.

---

## R3. Visual texts (FR-004, FR-017)

**Where the images live.** Committed under `content/units/y12-english-advanced-unseen-texts/images/<textId>.webp`
and served by **`GET /api/unseen/image/[textId]`**, an authenticated route. This is the decision A1 allows.

**How it is served.**

- The route and its tests reach the content and the files through one seam, `lib/unseen/images.server.ts` (`findVisualText(textId)` returns the matched record, `imageDirectory()` the folder); tests `vi.mock` it to inject a visual text and a temporary directory, so the route is proven before any real image exists.
- `authenticate()` (the route's own check, behind the middleware that already answers `401` to an
  unauthenticated `/api/*`); a missing session user row is `401`.
- `textId` is matched against `^[a-z0-9][a-z0-9-]*$` and then looked up in the unit's `visual` texts; the
  file path is built from the matched record, never from the request string. Unknown id: `404 not_found`
  (the same body for "no such text" and "not a visual text", so ids cannot be probed).
- Reads the file with `fs.readFile` and returns it with `Content-Type: image/webp`, `Cache-Control: private,
  max-age=86400`, `X-Content-Type-Options: nosniff`, `Vary: Cookie`. `next.config.mjs` adds the folder to
  `outputFileTracingIncludes` for this route so Vercel ships the files with the function (the same
  mechanism the concept fonts use).
- The route returns bytes only: no JSON, no description, no list endpoint, no directory index.

**Rejected.** (a) A `public/` folder: unauthenticated and guessable, which Principle II forbids; there is no
`public/` folder today and this does not create one. (b) Object storage with signed URLs (Vercel Blob or
S3): a new dependency or a new secret and a new data path, for a handful of images (Principle VIII); a
signed URL also escapes the session. (c) Base64 data URIs in the attempt payload: ~33% larger, repeated on
every resume, kept in `sessionStorage`, and the browser cannot cache it. (d) `resources/`: gitignored and
not deployed. (e) Inlining the bytes into a server-only module: bloats the function bundle for every route
that imports the registry.

**Size budget.** Each image is WebP, at most 1600 px on the long edge and at most 300 KB; the folder stays
under 6 MB. The validator checks the first limit it can (file size) and the report prints the folder
total. If the bank ever passes about 40 visual texts the storage decision is revisited (a plain note in the
report, not a gate).

**Zoom and alt text.**

- The inline image is `<img src="/api/unseen/image/<id>" alt="<alt>" loading="eager">` at the column width
  with a visible **"Zoom"** button (44 px) and the image itself is a button; both open a native
  `<dialog>` (`showModal()`, Esc and the "Close" button close it, focus returns to the Zoom button). Inside
  the dialog the image sits in a scroll container (`overflow: auto`, `touch-action: pan-x pan-y pinch-zoom`)
  with "Zoom in" and "Zoom out" buttons stepping a CSS variable `--un-zoom` through 100%, 150%, 200%, 300%
  of the container width (no library, no animation, so nothing to switch off under reduced motion).
- `alt` is a short neutral label written with the text (`"Text 1 – Image: a black-and-white line drawing"`),
  at most 250 characters, and is **not** the marker's description (which is key and may analyse). Rule 8
  of R2 fails a build where `alt` shares a 40-character run with the description. The cost is that a
  screen-reader user does not get the analytic description; the alt names what the image is, and the
  question's wording and this limitation are recorded in the research doc for the unit.

**The pre-release description check (FR-017).** `scripts/check-unseen-descriptions.ts` (new, offline,
teacher machine, needs `OPENROUTER_API_KEY`):

1. For each visual text in `descriptions.ts`, builds the marker prompt (R5) for each sample answer of each
   question on that text: the question's **model answer**, plus every stored answer for that question in the
   pilot file (`resources/english-unseen/pilot-questions.json`, matched by the id suffix; none is fine).
2. Runs the marker three times per sample and takes the majority `descriptionAdequate`.
3. A text **passes** when every sample's majority is `true` (and there is at least the model answer).
4. Writes `description-checks.ts` (committed, server-only): `{ [textId]: { adequate, checkedAt,
   promptVersion, model, samples, descriptionHash } }`. A failing check is written with `adequate: false`
   so the build blocks that question and the failure is visible in review.
5. Validation (R2 rule 8) blocks any visual question without `adequate: true` and a matching hash. A text
   that fails is not shown: it is removed from the bank until its description is rewritten and the check
   passes. The app never shows a visual text whose check has not passed.

Why the model answer: it is the one answer guaranteed to exist, and it is written to cover what the
question asks for, so a description too thin to support it is certainly too thin to mark students. Why the
stored pilot answers: they probe claims about composition, colour and gaze that a model answer may not make
(the pilot's 5/5 description checks used them). Rejected: running the check at request time (extra cost on
every attempt for a result that cannot change); trusting the author's judgement alone (the pilot showed
the marker catches thin descriptions the author did not).

---

## R4. What reaches the browser, when (FR-022, SC-006, Principle I)

**Decision.** The key is read in one place, `lib/grading.server.ts`, which exports two functions for this
unit: `markUnseen` (sends the criteria, notes, model answer and the visual description to the model
provider and returns verdicts only) and `unseenDiscussion` (the model answer, for a final attempt only).
The stimulus text is public content and has no key function. The offline scripts (description check,
field export, re-mark, report) import `content/answers` directly and are on the `OFFLINE_KEY_READERS`
allowlist in `tests/no-key-leak.test.ts`; no route or page imports it.

| Surface | May carry | Never carries |
|---|---|---|
| `POST /api/attempts` (start or resume), `unseenState.stage = write` | the question (public fields), the text (public, image as `/api/unseen/image/<id>` URL), `draft1`, `dailyLimit` | any key field |
| quiz page resume, stage `write`, `choice`, `retry` | the same, plus `try1` (text, mark, seven verdicts with reasons, feedback, biggest gap), `draft2` | the model answer, criteria, notes, description |
| `POST /api/grade` try 1 marked below full | `result`: mark, verdicts, reasons, feedback, biggest gap, `retryOffered` (never `goFurther`) | `discussion`, the model answer |
| `POST /api/grade` try 1 at full marks, or no retry offered, or try 2 marked | `result` + `discussion` (model answer) + `try1` on try 2 | criteria, notes, description |
| `POST /api/grade` not marked (marker down, daily limit) | `notMarked: { reason, resetsAt? }` | everything else |
| `POST /api/unseen/decline` | `result` (final) + `discussion` | criteria, notes, description |
| `POST /api/rewrite/draft` | `{ saved }` | everything |
| unit page | public question counts by form, the student's own marks, the pending question's id and form | any key field |
| attempt detail page | both tries with verdicts, feedback, biggest gap; the model answer only when the row is `final` | the model answer of an unfinished attempt; criteria, notes, description at any time |
| `GET /api/unseen/image/[textId]` | image bytes | the description, any JSON |

Tip cards are built by the client from the public `lib/unseen/skills.ts` and the `try1.skills` it received
(`met: false`); no tip text is in any response (as spec 007). The seven skill tips never contain
model-answer text because they are generic sentences (rule 9 of R2 and `tests/unseen/tips.test.ts`
check every tip against every shipped model answer for a 30-character run).

**The model-answer echo guard.** The marker sees the model answer, so its `feedback`, `biggestGap` or a
`reason` could repeat it. After parsing, `unseen/marker.server.ts` rejects a reply in which any of those
strings shares a run of 60 or more characters with the model answer that is not also part of the stimulus
text; a rejected reply is treated as unparseable (retried once, then "marker unavailable"). 60 characters
(not 30) because feedback legitimately quotes a few words of the text and of the criteria; the 007 rule's
`PROMPT_LEAK_RUN` of 60 is reused. The Python regression run counts how often a reply would be rejected
and prints it, so a prompt change that makes echoes common is visible (a rate above 2% of calls is a
finding to review, not a gate).

**Tests.** `tests/no-key-leak.test.ts` gains: (a) `BANNED_KEYS` additions (`criteria`, `visualDescription`,
`descriptionCheck`, `descriptionHash`, `unseenKey`; `modelAnswer` and `markingNotes` are already there);
(b) a block "unseen unit" that, for **every shipped unseen question**, builds the start payload and the
resume state at `write`, `choice` and `retry` and the final discussion, and asserts the key strings are
absent where the table above says so (a 40-character run of `model`, `criteria`, `notes` or the
description, not counting runs inside the stimulus); (c) the route-level test that a first try below full
marks releases no `discussion`; (d) the `UNITS` registry, serialised, holds no key run (SC-006's "static
file"); (e) `GET /api/unseen/image/<id>` is `401` without a session and `404` for a non-visual text id; (f)
the offline allowlist gains the new scripts.

**Rejected.** Sending the description to the client for screen-reader users (it is key by the spec);
returning the model answer with the first try's result "to save a request" (breaks FR-022).

---

## R5. The marker (FR-012 to FR-018)

**Decision.** Port the passing prompt into `lib/unseen/`, the way spec 007 moved the round 5 prompt into
`lib/paragraph/rubric.json`, and make the Python script read the same file.

- `lib/unseen/rubric.json` (server-only; `{ promptVersion, directiveVerbs, systemPrompt, userTemplate }`).
  At port it is `resources/english-unseen/rubric.json` with the `skills` array removed: **byte-identical
  prompt text, `promptVersion: "unseen-pilot-4"`** (now `unseen-pilot-9`: `unseen-pilot-5` added `goFurther`, `-6` made `biggestGap` null at full marks, `-7` added the verb `discuss`, `-8` added the verb `what`, `-9` added `how effectively`). The old file in `resources/` is deleted (the three
  `rubric.pilot-N.json` history files stay as records) so there is one source of truth.
- `lib/unseen/skills.json` (public; `[{ id, name, tip, description }]`, the seven skills). The `skills`
  array moves out of the prompt file because the prompt file is server-only and the tips must reach the
  browser (the retry's tip cards and "Things I need to know"). FR-025 says the tips come "from
  `rubric.json`"; this plan reads that as "from the shared rubric files" and the spec's wording is adjusted
  (see the end of this document).
- `lib/unseen/skills.ts` (public) reads `skills.json`; `lib/unseen/marker.server.ts` reads both.
- `scripts/pilot-unseen-marker.py` changes `RUBRIC_PATH` to `lib/unseen/rubric.json`, adds `SKILLS_PATH =
  lib/unseen/skills.json`, and keeps `build_messages` exactly as is, so the prompt it sends is the one the
  app sends. A **golden test** (`tests/unseen/prompt.test.ts`) renders the prompt for a synthetic input
  (an invented poem and criteria, so no copyrighted text is committed) and compares it with
  `tests/fixtures/unseen-prompt.golden.txt`; `python scripts/pilot-unseen-marker.py --check` renders the
  same input and compares the same file; `--write-golden` regenerates it and the `rubric.hash` fixture (as
  `pilot-paragraph-marker.py` does). A `tests/unseen/rubric-drift.test.ts` fails when `rubric.json` changes
  without `promptVersion` changing (a stored hash of the file against the version).

**Inputs.** The user template's placeholders are unchanged: `marks`, `questionHeading` (the text's heading),
`question` (the prompt, with the parts joined as "(a) … (b) …"), `directive` and `directiveDefinition`
(from `directiveVerbs`), `textForm`, `visualNote`, `text` (or the visual description), `criteria`, `notes`,
`anchor` (the model answer, as "EXAMPLE FULL-MARK ANSWER"), `suggestedWords`, `wordCount` (from
`lib/wordcount.ts`) and `answer`. A single-pass `{name}` substitution (as `lib/paragraph/marker.server.ts`'s
`render`) so a student's own braces are never re-expanded. The text is rendered by one function,
`renderTextForMarker(text)`: the title and author line, stanzas joined by blank lines (no line numbers),
paragraphs joined by blank lines, then the footnotes. The pilot file's `text` strings come from `pdftotext`
and differ from this rendering only in whitespace; the Python regression keeps using them for the stored
cases, and `scripts/unseen-field-cases.ts` writes field cases with the app's rendering.

**Reply.** `{ mark, skills: { <seven ids>: { met, reason } }, feedback, biggestGap, goFurther, descriptionAdequate }`
(`contracts/api.md`, "The marker's reply format"). `parseUnseenReply(content, maxMarks)` takes the first
`{…}` block, as the pilot and spec 007 do. A reply is a **failure** (retried like a failed call) when: it is
empty; the model stopped because of length (`finish_reason: "length"`); it does not parse; `mark` is not an
integer from 0 to `maxMarks`; any of the seven `met` values is missing or not a boolean (or the strings
`"true"`/`"false"`); `feedback` or `biggestGap` is missing or blank after trimming; or the echo guard (R4)
fires, or the mark equals `maxMarks` and `goFurther` is missing, null, blank or not a string. A `goFurther` on a below-full reply is dropped (stored as null), and it is part of the echo guard's strings. A missing `reason` is **not** a failure (stored as ""); the spec lists only the mark, the verdicts,
the feedback and the biggest gap. Strings are trimmed and capped (reason 300, feedback 600, biggest gap 300,
go further 300 characters).

**"Make it even stronger" (the `goFurther` field, prompt `unseen-pilot-5`; `unseen-pilot-6` makes `biggestGap` null at full marks).** A full-mark answer has no biggest gap, so the student would learn
nothing about how to lift it. The reply gains `goFurther`: when the mark equals the question's full marks, one
sentence naming the single most useful step that would make this answer stronger still, specific to this text
and this answer; otherwise null. The system prompt says it is advice beyond the top band, not a reason to
withhold marks: the mark is decided first and never lowered because a point exists; it must not quote or
paraphrase the example answer or mention marks. The retry is capped below full marks, so only a first try can
have one; it is stored in `unseen_phases.try1_go_further` (nullable, migration 0007) and the views release it
only when `try1_mark = max_marks`. Rejected: a second model call (cost and a second failure path); showing the
biggest gap at full marks (the marker has nothing to fix there); reusing `feedback` (it explains what earned
the mark). The offline pilot script reports it and checks every full-mark reply has one; marks must not move
against `unseen-pilot-4`.

**Cut-off detection needs one small change to shared code.** `chatCompletion` returns only `{ ok, content }`
and does not expose `finish_reason`, so the pilot's "cut off at max_tokens" failure cannot be seen in the
app. `lib/openrouter.server.ts` gains `finishReason?: string` on the ok result (additive; no caller breaks)
and the unseen marker treats `"length"` as a failure. Alternatives rejected: parsing a truncated JSON as
"unparseable" (it usually is, but a cut-off reply that happens to close its braces would be accepted with
a short feedback); a second client for this unit.

**Mapping onto Principle VI's grader fields.** `marksAwarded` = `mark` (capped at try 2, R8); `feedback` =
the reply's `feedback`; `rubricHits` = the ids of skills met; `rubricMisses` = the ids missed. The result
row stores `feedback`, `rubric_hits` and `rubric_misses` from the deciding try; the per-skill reasons and
the biggest gap live in the phase row (R8), not in `results`.

**Model and token budget.** `ENGLISH_ADV_GRADING_MODEL` (env, server-only, default `deepseek/deepseek-v4.1-flash`) read
by `getEnglishAdvModel()` in `lib/config.server.ts` next to `getConceptModels`; the app's `GRADING_MODEL` is not
consulted by this unit. `max_tokens: 4000` (the pilot needed it: the model reasons before replying).
`temperature: 0`, JSON mode. Rejected: reusing `GRADING_MODEL` (the pilot showed deepseek-chat one mark
harsh on full-mark school answers whatever the wording); a hard-coded model (a rejected `ENGLISH_ADV_GRADING_MODEL` could
not be rolled back without a deploy).

**Time budget.** One marking call is allowed 40 s; the whole marking (first call plus the one retry) is
budgeted 55 s inside the route's `maxDuration = 60`. The retry runs only if at least 12 s of the budget
remain, with a timeout of what remains minus 2 s. If the first call fails fast (HTTP error, bad JSON) the
retry has the full time; if it times out there is usually no retry, and the box returns. SC-002's "within 1
minute" therefore holds for every marked answer and the failure path answers by about 57 s. The p95 model
latency has not been measured in the app (the pilot's 90 s client timeout hid it); quickstart step R
records ten real timings and the rule is: if the p95 exceeds 35 s, raise `maxDuration` (Vercel allows more
on Pro and with fluid compute) rather than shorten the budget. Rejected: no per-call timeout (a hung call
would burn the whole function); a client-side auto-resubmit after failure (it would double slot use and
hide the failure).

**The marker also decides nothing it should not.** The retry cap (`maxMarks − 1`), the higher-mark rule
and the no-retry rule for a 1-mark question are code (`lib/unseen/scoring.ts`), not the model's job. The
prompt's own instructions about the example answer are unchanged.

**Safeguards kept.** The answer is length-checked before any call (R6); the user template wraps the answer
in `<<<ANSWER … ANSWER>>>` and the system prompt's "calibrate to the criteria" instructions are untouched,
so the pilot's injection behaviour is the behaviour measured; the model answer reaches only the provider.
`scripts/fake-openrouter.ts` gains `FAKE_UNSEEN` modes (see R7).

**Fake model.** `FAKE_UNSEEN=pass|partial|fail|down|empty|cutoff|missing|malformed|slow`. A directive in the
student's text, `[mark:2]` and `[miss:technique-effect,apt-evidence]`, chooses the reply (no directive: full
marks and all skills met in `pass`; mark 2 and `technique-effect` missed in `partial`). `empty` returns an
empty content, `cutoff` returns `finish_reason: "length"`, `missing` omits `biggestGap`, `missing-go-further` is a full-mark reply without `goFurther`, `malformed` returns
prose, `slow` waits 12 s, `fail` is HTTP 500, `down` HTTP 503. The fake echoes the model answer in the
feedback in a mode `echo` to exercise the guard.

---

## R6. Submission rules (FR-008 to FR-011)

**Decision.** One pure module, `lib/unseen/limits.ts`, imported by the meter and by the server:

```ts
export const MIN_WORDS = 20;
export const OVER_WARN = 1.0;     // warn above the suggested length
export const OVER_BLOCK = 1.2;    // block above suggestedWords × 1.2
export function limitsFor(suggestedWords: number): { min: 20; suggested: number; max: number }   // max = floor(suggested × 1.2)
export function lengthState(words: number, suggested: number): "short" | "ok" | "warn" | "over";
export const MEDIAN_WORDS: Record<number, number>;
```

`words` is `countWords` from `lib/wordcount.ts` (the same function the marker input uses, so the student's
count is the marker's). `short` is under 20 words (Submit disabled, note "Write at least 20 words before
you submit."); `warn` is above the suggested length up to the maximum (note "About N words over the
suggested length. Tighten it if you can." Submit enabled); `over` is above `floor(1.2 × suggested)` (Submit
disabled, note "N words over the limit. Cut it to submit."). For the 204-word example the limit is 244:
244 words is allowed, 245 is blocked.

**Server.** Before any slot, rate limit or model call, the grade route refuses with `400 { error:
"answer_too_short", minWords: 20 }` or `400 { error: "answer_too_long", maxWords }`; the client never
relies on its own check. The 6000-character cap the other writing units use is kept as a backstop: longer
is `400 answer_too_long` (not silently truncated, because a truncated answer would be marked as something the
student did not write).

**Rejected.** Warning-only server rules (a request that bypasses the client could burn the daily cap on a
50 000-word paste); a different counter on the server (the spec 005 FR-043 principle).

---

## R7. Limits and failure paths (FR-019 to FR-020, FR-023, FR-030 to FR-033; Principles VI and VII)

**Slots.** One slot of `LLM_DAILY_CAP` per marked try, reserved by `reserveAiSlot` immediately before the
marking and **refunded when the marker fails** (`refundAiSlot`, as spec 007 and Principle VI's photo rule).
"At most 2 per quiz" is enforced by the phase row, not the client: try 2 is only accepted when the row is
`try1`; there is no try 3. **Parse retries inside one marking call do not take a second slot** (a marking is
one slot however many model calls it needed, up to 2) and a failed marking costs nothing, so a flaky
provider never uses a student's allowance. The cost bound is 2 slots × up to 2 model calls = 4 model calls
per quiz in the worst case, which `LLM_DAILY_CAP` (default 40) already bounds per student per day.

**Order of checks (grade route, unseen branch).** body → answer rules (R6) → attempt token → the question is
in the token and is an `unseen` question → phase row state (`final` → `409`; try 1 with a row → `409`; try 2
without a `try1` row → `400 phase_refused`) → per-user and per-IP rate limits (`429`) → the cap check and
slot → marker → write. The cap check is the slot reservation itself (atomic), so two tabs cannot both pass.

**Marker unavailable (either try).** `markUnseen` returns `null` (no key, failed call, or a bad reply after
the one retry, within the 55 s budget). The route refunds the slot, **saves the answer as the draft**
(`upsertRewriteDraft`, phase 1 or 2, so a reload cannot lose it even if the client crashed), and answers
`200 { notMarked: { reason: "marker_unavailable", phase } , saved: false }`. The client keeps the text in
the box, unlocks it, and shows "We couldn't mark your answer just now. It's still here, so try again in a
moment." in a `role="status"` region (no "error" wording, no alert). While the call ran, the text was locked
with the timed status steps (the "waits and retries" the spec describes is the server's in-request retry;
the client does not resend on its own).

**Daily cap (either try).** `reserveAiSlot` returns `null` because the count has reached the cap: the route
answers `200 { notMarked: { reason: "daily_limit", phase, resetsAt } }` (`resetsAt` from
`nextSydneyMidnight`/`toSydneyIso`), saves the draft, takes no slot and records no mark. The client shows
"You've reached today's marking limit. Come back tomorrow (from midnight Sydney time, Fri 20 Nov) and your
answer will be here.", keeps the text, and **disables Submit** with that note until `resetsAt`. On the next
load the same state is built from the server: `unseenState.dailyLimit = { reached: true, resetsAt }` when
`aiUsedToday >= cap` (so a reload the same evening still shows Submit disabled and a reload after midnight
does not). The question stays pending (R8): the next quiz offers it first, resumed at the step with the
draft. **`LLM_DAILY_CAP=0` is not "limit reached":** the cap setting says "0 turns LLM grading off", and
with no self-marking nothing can be marked, so that case answers `marker_unavailable` (the plain retry
notice), not "come back tomorrow" (which would be false). A student at the retry step with the cap used
may still **decline** (R8): the retry notice offers "Skip the retry and see the model answer".

**Never reached the server.** A network failure, a 5xx, a `401` and the `503 temporarily_unavailable`
(database unreadable) all take the client's existing error path: the box returns holding the text with the
usual one-line error. These are distinguishable from the two `notMarked` outcomes because the latter are
`200`s the server chose to send.

**Rate limit.** `429 rate_limited` (per-user or per-IP) returns the box with the text and the usual
"slow down" line; nothing is recorded and no slot is taken. The draft limiter is unchanged
(`DRAFT_RATE_LIMIT`); the decline route uses the per-user grade limiter.

**Logging.** `lib/unseen/log.server.ts`, one `console.info` line per call as `lib/paragraph/log.server.ts`:
`[unseen] outcome=… user=<sha256> question=… phase=… duration_ms=… model=…`. Outcomes: `graded`,
`unparseable`, `model_fail`, `rate_limited`, `over_allowance`, `already_answered`, `phase_refused`,
`answer_rejected`, `db_unavailable`, `declined`. Never the text, a reason, the
feedback, the biggest gap, the model answer or any key. A test spies on `console.*` across a full run.

**Rejected.** (a) Taking a slot per model call (a provider outage would exhaust a student's day in
retries). (b) Refunding nothing (Principle VI's photo rule is the precedent for refunds on model failure).
(c) Auto-resubmitting from the client after a failure. (d) Returning `503` for the two `notMarked` cases
(it would be treated as a transport error by the client and by monitoring).

---

## R8. Persistence and resume (FR-024, FR-027, FR-034, FR-035; Principle II)

**Decision.** A **new table `unseen_phases`**, one row per question in an attempt, plus one partial unique
index on `attempts`. Drafts reuse `rewrite_drafts` (phase 1 and 2 columns) and `POST /api/rewrite/draft`.

**Why a new table, not `paragraph_phases` or `rewrite_phases`.** `paragraph_phases` stores four named
criteria with a `d.subs` sub-structure, a 0..4 mark, a 0..3 capped second mark, a `self_mark` mode and a
`no_correction` ending: this unit has seven skill verdicts, a variable maximum, a `biggestGap`, a `declined`
and a `no_retry` ending, and no self-mark. Extending it would put `max_marks`-dependent checks, an unused
`mode`, and two unused endings into a table that two units then share, and every paragraph query would
have to carry unseen concerns (the same argument spec 007 made against `rewrite_phases`). The repeated
shape (text, mark, verdicts, prompt version) is small enough to repeat.

**Stored per try:** `try1_text`, `try1_mark`, `try1_verdicts` (jsonb: seven `{ met, reason }` keyed by skill
id), `try1_feedback`, `try1_biggest_gap`, `try1_prompt_version`, `try1_model`, `try1_graded_at`; the same
five for `try2_*` (null until a retry is marked). Plus `max_marks` (a copy of the question's value at the
time, so the checks below do not depend on content that can be edited), `status` (`try1` | `final`),
`ending` (`full_marks` | `retried` | `declined` | `no_retry`; null until final), `recorded_mark`,
`created_at`, `updated_at`. There is no flag column: the unit has no student flag (the 2026-11-19 clarification).

**The retry choice (taken, declined, pending) is derived, not stored**, so it cannot disagree with the
rest of the row: `status = 'try1'` is "pending" (the student has seen the first result and has not
finished); `final` with `ending = 'retried'` is "taken"; `final` with `ending = 'declined'` is "declined";
`final` with `ending = 'no_retry'` is "no retry offered" (a 1-mark question). Whether the student has
pressed "Retry" without typing is not stored (reload shows the choice again; nothing is lost).

**Row lifecycle.**

```
(no row) --try 1 marked at max marks------------------> final / full_marks      (+ result row)
(no row) --try 1 marked below max, max = 1------------> final / no_retry        (+ result row)
(no row) --try 1 marked below max, max > 1------------> try1
try1     --try 2 marked (capped at max - 1)-------------> final / retried        (+ result row)
try1     --decline--------------------------------------> final / declined       (+ result row)
```

`final` is terminal. Each arrow inserts or updates once, guarded by `status` (the paragraph unit's pattern:
`insert … on conflict do nothing`, `update … where status = 'try1'`), so two tabs or a double tap give one
winner and a `409 already_answered` with the stored view for the loser. A `results` row is written on
every arrow into `final`: `max_marks` = the question's value, `marks_awarded` = the recorded mark,
`graded_by = 'llm'`, `answer` = the deciding try's text (the retry when its mark is at least the first
try's, else the first try), `feedback` = that try's feedback, `rubric_hits`/`rubric_misses` = skill ids,
`concept_outcomes` = the **seven first-try outcomes** (R10). A declined or no-retry question stores the
first try's.

**"Answered".** A question is answered when a `results` row exists for it in this unit (FR-027): a full-mark
first try, a marked retry, a declined retry, or a no-retry first try. Derived from `results`, never stored.

**Recorded mark.** `recorded = max(try1_mark, try2_mark ?? 0)`, with `try2_mark` already capped; a database
check enforces it (as spec 007's `recorded_is_higher`).

**Resume states** (built by `lib/unseen/state.server.ts`, the same builder for the start response and the
quiz page). There is **no marking stage**: marking is never restored.

| Stored | `stage` | Carries |
|---|---|---|
| no row, draft maybe | `write` | `text`, `draft1`, `dailyLimit` |
| row `try1`, no `draft2` | `choice` | `try1`, `dailyLimit` |
| row `try1`, `draft2` present | `retry` | `try1`, `draft2`, `dailyLimit` |
| row `final` | `discussion` | `try1`, `try2?`, `ending`, `recordedMark`, `discussion` |

"Retry waiting on the daily cap" is the `retry` stage with `dailyLimit.reached`: the server saved the
retry text as a draft when it answered `daily_limit` (R7), so the stage is `retry` with the text and Submit
disabled. "Retry choice pending" is `choice`. "Retry in progress with draft text" is `retry`.

**One incomplete attempt per student for this unit.** The draw (R9) starts a quiz by resuming the student's
incomplete attempt if there is one (`getLatestIncompleteAttempt`, which exists). To make two tabs end on the
same attempt even though the draw is random, a **partial unique index** limits it:

```sql
CREATE UNIQUE INDEX attempts_unseen_incomplete_unique
  ON attempts (user_id)
  WHERE unit_id = 'y12-english-advanced-unseen-texts' AND completed_at IS NULL;
```

`createUnseenAttempt` inserts with `on conflict do nothing` and, when nothing was inserted, returns the
existing incomplete attempt (the `createSequentialAttempt` pattern). Both tabs get the same attempt id (one
`201`, one `200` with `resumed: true`). An attempt becomes complete when its result row is saved
(`finalizeIfComplete`, unchanged).

**Decision: an untouched question stays pending.** A student who opens a quiz and leaves without typing gets
the same question next time (there is no "skip this text"). Rejected: re-drawing when the attempt has no
row and no draft (it would need to delete an attempt, and would make two tabs race again); a skip button
(not in the spec; it would also let a student discard texts they find hard, defeating the weighting).
Revisit if students complain.

**Migration.** `drizzle/0006_*.sql`: `create table unseen_phases` (composite FK to `attempts (id, user_id)`
`on delete cascade`, `user_id` FK to `users` `on delete cascade`, unique `(attempt_id, question_id)`, the
checks in [data-model.md](data-model.md)) and the partial unique index above. No backfill; no data in other
tables changes. `npm run db:migrate` is already part of `vercel-build`.

**Deletion and retention.** `unseen_phases.user_id` and the composite FK are `ON DELETE CASCADE`, and
`scripts/delete-student.ts` and the retention job delete `users` rows, which cascade; **neither needs a code
change** (the spec 007 reasoning, checked against `lib/db/queries/users.server.ts`). `tests/api/delete-unseen.test.ts`
proves it with a seeded row and a draft.

**Rejected.** Storing the retry choice as a column (a second source of truth); one table for paragraph and
unseen (above); a `jsonb` blob for both tries (the checks and the "recorded" queries want
columns); a unique index on `(user_id, (question_ids[1]))` as spec 007 (that allows one attempt per
question, not one open attempt, so two tabs could still open two different questions).

---

## R9. The draw (FR-027 to FR-029, SC-008)

**Decision.** A pure function, `lib/unseen/draw.ts`, with an injected `RandomInt`, plus a thin server
wrapper. Order:

1. **Pending first.** If the student has an incomplete attempt for this unit, resume it (a question waiting
   at the choice, the retry, a draft, or the daily-limit step). No draw.
2. Otherwise, while some question is **unanswered** (no `results` row, R8), draw one of those.
3. Once **every question has a recorded mark**, the draw **repeats** over the whole bank (below). There is no
   finished state for a bank with questions; `{ finished: true, total, answered }` is returned only for an
   empty bank.

**Weights.** Let a *form* be the text form of a question's text. For each form `f`: `n_f` = how many of the
student's answered questions are in `f`; `avg_f` = the mean of `marksAwarded / maxMarks` over them.

```
formWeight(f) = 10                                  if n_f = 0      (untried: top weight)
              = 2 + round(6 × (1 − avg_f))          otherwise        (2..8: weakest form highest)
skillCount(q) = number of q's 1-3 skill tags that are in the student's "Things I need to know"
weight(q)     = formWeight(form(q)) × (2 + skillCount(q))           (integer; 4..50)
```

Draw: `total = Σ weight(q)`, `r = rand(total)`, walk the questions in bank order subtracting weights until
`r < 0`. All integers, so the probabilities are exact: a test enumerates `r` over `[0, total)` and asserts
the exact count per question, with no statistical tolerance. "Top weight until each has one answer" holds
because 10 exceeds every tried form's maximum (8); an untried form is not exclusive (a student is not
forced through each form in turn; they are just far more likely to get one). "Extra weight" for uncleared
skills is `+1` to the multiplier per matching tag, on a base of 2 (so one matching tag is ×1.5, three are
×2.5).

**Inputs.** `listUnitResultsForProgress` (existing) gives every result with its `conceptOutcomes`; the
answered set and `n_f`/`avg_f` come from it joined to the bank (a result for a question no longer in the
bank is ignored for the forms); `conceptProgress(unit, results)` (existing, unchanged) gives the uncleared
skills. The draw does **not** call `loadWeighting`/`drawWeighted` (those are spec 002's concept-balanced
quizzes and assume a multi-question attempt).

**Two tabs.** Each draws its own question, then the partial unique index of R8 makes the second insert a
no-op and returns the first tab's attempt, so both end on one attempt. The loser's draw is discarded, which
is harmless (no state).

**Repeats (FR-029, clarification 2026-11-19).** Questions repeat instead of stopping, so a student who has
answered everything can keep practising. Decision and reasons:

- **Candidates.** All bank questions except those of the student's **last 3 quizzes** (the last three
  `results` rows for bank questions, newest first, each question once). A bank of **3 or fewer** questions
  excludes only the most recent; a bank of **1** offers it. So there is always a candidate in a non-empty bank.
- **Weight.** `repeatWeight(q) = weight(q) × markWeight(q) × ageWeight(q)`, all integers.
  `weight(q)` is the existing form × skills weight, but with the form averages computed from each question's
  **latest** recorded mark (a later result replaces an earlier one), so improvement shows.
  `markWeight = 1 + round(4 × (1 − latestShare))`, 1 (full marks) to 5 (no marks).
  `ageWeight` ranks the candidates by their last answer time and maps the rank linearly to 1 (most recent) to 4
  (longest ago), ties by bank order; with one candidate it is 1. Rank, not days, keeps the test free of the clock.
- **Same draw.** `drawUnseen` over the candidates with the same cumulative walk, so a test enumerates `r` and
  asserts exact counts.
- **A repeat is a new attempt.** The start inserts an attempt, and the grade, phase row, results row and
  concept outcomes are keyed by that attempt, so nothing earlier is overwritten (`results` already has
  `unique(attempt_id, question_id)`, not one per question). `conceptProgress` replays every result in order,
  so a repeat's first-try verdicts add or clear skills as usual.
- **"Answered" and the form results** use the latest result per question: the unit page's "Results by text
  form" counts each question once and averages the latest marks.
- **Notice.** `UnseenProgress.repeating` (every question answered) drives the unit-page notice, and
  `unseenState.repeating` (the student has an earlier result for this question from another attempt, one
  indexed read, `hasEarlierResult`) drives the quiz notice, shown above the question until the discussion:
  "You've answered every question. Questions now repeat, starting with the ones you found hardest." The start
  button stays. Past attempts list each attempt separately (they already do).
- **Rejected.** Stopping at a finished bank (the earlier design: the student runs out of practice); days-based
  age weights (depend on the clock and make the odds hard to enumerate); excluding only the last quiz (a student
  could ping-pong between two questions); overwriting the earlier attempt (loses history, breaks the retry and
  the attempt detail page); a separate "repeat mode" setting (more UI for no gain).

**Database unreadable.** The unit does not start (`503 temporarily_unavailable`; A2). The unit page shows
"We can't load your questions right now. Try again in a moment." and no start button.

**Why the formula.** The spec says "weighted toward the weakest text forms" and "top weight for untried";
two integers and a multiplier are the smallest rule that is exact, testable and monotone (weaker form →
heavier). The range (2..8 against 10) keeps a student's strong forms in the draw (a 100% form still weighs
2) so practice does not collapse onto one form. **Rejected:** a strict "untried forms first" (it forces an
order the spec does not ask for and starves weakness weighting early); `avg²` or softmax weights (not
explainable to a teacher); a seeded PRNG in production (the injected `RandomInt` is the seam; production
uses `crypto.randomInt` like `drawAttempt`).

---

## R10. Skill tracking (FR-025, FR-026)

**Decision.** Seven concepts with `clearAfter: 2`, ids `y12-english-advanced-unseen-texts.c-<skill id>`
(`c-answers-question`, `c-directive-verb`, `c-analyses-not-retells`, `c-technique-effect`,
`c-apt-evidence`, `c-human-experience`, `c-succinct`), built in `concepts.ts` from `lib/unseen/skills.ts`
(`term` = the skill name, `description` = its tip). Every question's `concepts` lists its 1 to 3 tag
concept ids; `meta.conceptsReady: true`.

**Counts are derived from stored first-try verdicts.** Each final result row's `concept_outcomes` holds the
**seven** outcomes `[{ conceptId, correct: verdicts[skill].met }]` of **try 1 only** (all seven count,
whatever the tags; try 2, a decline and a marker failure add nothing). `conceptProgress` already replays
`conceptOutcomes` in order and starts a concept's count from `clearAfter` (2). So **`lib/concepts/progress.ts`
needs no change**; the work is a test: `tests/unseen/skills.test.ts` replays results and asserts "missed on
try 1 and fixed in the retry is still missed", "two later first tries clear it", "a decline adds nothing",
"all seven count whatever the tags". The outcomes are computed at the moment the try 1 row is inserted
and stored on the `results` row when the question becomes final (the row is final one request later in the
retry case; the outcomes come from `try1_verdicts`, so they are identical).

**Weighting.** "Things I need to know" steers the unit's own draw (R9) through the skill-count multiplier
and nothing else. `loadWeighting` is not used.

**Summaries and illustrations (spec 002): off for this unit.** `unit.type = "Writing Practice"`, which
`ConceptPanel` already excludes from the live-content pipeline (line 149) and `planConceptWork` only works on
visible concepts, so the unit page shows each skill as its one-line tip. Reasons: the seven skills are
generic study skills with a fixed tip, not per-question ideas a generated summary could explain, and the
spec's "Things I need to know" is "the seven skills with a short tip". `ConceptPanel` changes only in
wording: `tips = Boolean(unit.sequence || unit.draw)` and a per-unit sentence (below).

**Unit page copy** (ConceptPanel with `unit.draw`): title "Things I need to know"; sub "Skills you missed on a
first try. A skill clears after 2 first tries that show it."; empty "All clear — nothing to review right
now. Any skill you miss on a first try will show up here."; two pips per row (`clearAfter`), the count text
"n to go".

**Rejected.** Counting only tagged skills (decided at clarification); a "not applicable" verdict (the marker
returns met or missed only; the pilot's `succinct`/`apt-evidence` were stable for visual texts).

---

## R11. The offline revision loop (FR-035 to FR-038, SC-005)

**No student flag (clarification, 2026-11-19).** The unit has no "This mark seems wrong" button, no flag route,
no `flagged_at` column and no flag-export script. A student report is a weak signal (students rarely flag a mark
that is too generous, and a flag makes the student the reviewer of the marker). The paragraph unit's flag
(spec 007) is unchanged. The attempt record already holds what the loop needs: both tries' text, the seven
verdicts with reasons, the marks and the prompt version.

**Re-mark is the source of field cases.** `scripts/unseen-remark.ts` (below) finds the answers the marker may
have got wrong; `--export` turns each disagreement into an UNLABELLED field case under a field question built
from the bank key (`scripts/unseen-field-cases.ts`: the text via the app's `renderTextForMarker`, criteria,
notes, suggested length, directive, the model answer as an anchor, `set: "field"`, `id: "field-<question suffix>"`,
the student's try as `needsLabel: true`, `origin: "re-mark disagreement"`). The case holds the student's
**writing only**: no name, email, user id, attempt id or date. The teacher edits `expectMark` and
`expectMissed`, clears `needsLabel`, and the case is live. `unseen-field-cases.ts` holds the pure export logic
(tested without a database) and is on the `OFFLINE_KEY_READERS` allowlist.

**Regression.** `python scripts/pilot-unseen-marker.py --gate` marks **every** case of every set (tuning,
holdout, field) with the prompt `lib/unseen/rubric.json` and prints three sections, each with in-range
and within-1 agreement, the skill-catch and false-dock figures, and the echo-guard count. The existing
`--set` option gains `field`; `--gate` is a single run over all sets (it replaces choosing sets one by
one) and exits non-zero when tuning in-range is under 90%, holdout in-range under 80%, or any tuning or
holdout case is more than 1 mark out (SC-005). **Field cases are reported, not gated**, because a field
case's label is a human judgement; a field regression is a finding to read (the teacher decides whether
the label or the prompt is wrong). A case with `needsLabel: true` is refused by the runner with a message
(as spec 007). The report header carries `promptVersion`; every prompt edit bumps it and regenerates the
golden file. The frozen holdout set is never used to tune (a header line in the report says "holdout: not
for tuning").

**Re-mark.** `scripts/unseen-remark.ts` (offline): reads the database read-only through `DATABASE_URL`,
samples **try 1 answers from every mark band** (zero to full marks), stratified across the bands that have answers, so
the middle-band leniency the pilot saw, and any harshness at the low bands, is sampled, not only top marks;
`--sample 40` by default, builds the same prompt
with the same builder, and marks each with **`REMARK_MODEL`** via OpenRouter (stay on OpenRouter: the same
provider, key and consent as the app; the constitution already allows re-marking by the same provider).
The script refuses to run when `REMARK_MODEL` is unset or equals `ENGLISH_ADV_GRADING_MODEL`. It never reserves a slot
or touches `daily_ai_usage`, so it never counts against a student's cap (A5). Output: disagreements
sorted **"too high" first** (the re-mark gave fewer marks than the app did), lower bands first within
them, which is the "check middle-band answers marked one too high first" rule; a lower mark from the re-mark is
listed after them (possible harshness); `--export` appends each
disagreement as a `needsLabel` field case. Answers copied out carry no identity.

**Where the pilot file lives.** `resources/english-unseen/pilot-questions.json`, gitignored (it holds
copyrighted texts, school answers and students' writing). The prompt moves to `lib/unseen/`; the pilot file
does not, and `/resources/` is already in `.gitignore`. `npm run unseen-remark` is
added to `package.json`.

**Consent.** No new consent sentence. The existing sentence (added by spec 007) already says answer text
and per-criterion results may be copied, without identity, into local test files and re-marked by the same
AI provider; A4 widens the constitution's wording to "per-skill" and the README's consent paragraph gains
the word "per-skill". The stimulus and model answer sent to the provider are not personal data.

**Rejected.** A student flag button (above); a teacher review page (out of scope, FR-038); gating field cases (labels are not settled);
running the re-mark with the unit's own model (it would only agree with itself).

---

## R12. Components and the question card's state machine

**Decision.** A new `components/unseen/*` set beside `components/paragraph/*` and `components/rewrite/*`,
reusing the pieces that are already generic and generalising nothing. The generic pieces reused as they
are: `components/rewrite/MarkingStatus.tsx` (timed steps and the live region), the `rw-card`, `rw-steps`
and `rd-pill` classes, `CheckIcon` from `components/paragraph/Frame.tsx` (a leaf with no paragraph
concerns). The unseen set is separate because its content differs structurally (a text panel, seven skill
verdicts, a biggest-gap line, a retry choice, a possibly-unmarkable state with no ending) and spec 007's
panel tests must stay untouched.

| Component | Role |
|---|---|
| `UnseenPanel` | the state machine and all `fetch` calls (grade, decline, draft) |
| `TextPanel` | heading, title, author, source line, then `PoemText` / `ProseText` / `VisualText`, then `Footnotes` |
| `PoemText` | stanzas of `.un-line`s, optional line numbers (`aria-hidden`), `white-space: pre-wrap` |
| `ProseText` | paragraphs |
| `VisualText` | `<img>` from the authenticated route, "Zoom" button, `ZoomDialog` |
| `TextSheet` | a "View …" button in the answer footer, at every width (label "View " + the text's short label from its heading, e.g. "View Text 1"; `aria-label` "View " + the full heading, e.g. "View Text 1 – Image"), that opens the text in a `<dialog>` titled with the full heading, so the text is reachable while writing (FR-006); its close button stays "Close" |
| `QuestionBlock` | the question (with parts), "N marks", the source credit |
| `AnswerBox` | the textarea, word meter, limit notes, Submit; props for `locked`, `limit`, `notice` |
| `LockedAnswer` | the locked text during marking (reuses the paragraph unit's look, own class) |
| `ResultCard` | mark out of N, feedback, biggest gap (for a full-mark try, `GoFurther`, "Make it even stronger", instead: a panel after the skill verdicts), `SkillList` (seven verdicts as "Met" / "Missed" with an icon and the reason) |
| `RetryChoice` | "Try again" and "Skip the retry and see the model answer", the cap line |
| `RetryBox` | `AnswerBox` pre-filled with try 1, plus `TipCards` (one per skill missed on try 1, from `skills.ts`) |
| `NotMarkedNotice` | the marker-failed status and the daily-limit status (the "waiting-on-cap" and "marker-failed" states) |
| `Discussion` | `OutcomeSummary`, `SkillPills` ("First try" / "Fixed in retry" / "Missed"), `FinalVsModel` (the final answer beside the model answer, stacked on a phone), `SkillsAdded`, `FirstTryCollapsed` (`<details>`), Finish |
| `UnitProgress` (server) | the unit page's "Your results" by form and the start button state |

**Card states.**

| From | Event | To | Effects |
|---|---|---|---|
| (mount) | `stage = write` | `writing` | restore `draft1`; if `dailyLimit.reached`, Submit disabled with the note |
| (mount) | `stage = choice` | `result` | show try 1's result; focus the result summary |
| (mount) | `stage = retry` | `retrying` | box = `draft2` else try 1's text; tip cards; focus the box, caret at the end; if `dailyLimit.reached`, Submit disabled |
| (mount) | `stage = discussion` | `discussion` | focus the summary |
| `writing` | Submit, rules pass | `marking1` | lock the text, start the timed steps, `POST /api/grade` phase 1 |
| `writing` | Submit, rules fail | `writing` | the button is disabled; no request |
| `marking1` | 200, mark = max, or no retry offered | `discussion` | focus the summary |
| `marking1` | 200, mark < max and retry offered | `result` | focus the summary |
| `marking1` | 200 `notMarked` marker | `writing` | text intact; plain notice; focus the notice |
| `marking1` | 200 `notMarked` daily limit | `writing` | text intact; limit notice; Submit disabled |
| `marking1` | 409 already answered | `result` or `discussion` | use the stored result |
| `marking1` | 429, 503, network error | `writing` | text intact; the usual one-line error |
| `result` | "Try again" | `retrying` | box pre-filled with try 1; tip cards; focus the box, caret at the end |
| `result` | "Skip the retry…" | `declining` → `discussion` | `POST /api/unseen/decline`; focus the summary |
| `retrying` | Submit, rules pass | `marking2` | lock, steps, `POST /api/grade` phase 2 |
| `retrying` | "Skip the retry…" | `discussion` | `POST /api/unseen/decline` |
| `marking2` | 200 marked | `discussion` | cap line when relevant; focus the summary |
| `marking2` | 200 `notMarked` marker / limit | `retrying` | text intact; the matching notice; decline stays available |
| `marking2` | 409 | `discussion` | stored result |
| `marking2` | 429, 503, network error | `retrying` | text intact; the usual error |
| `discussion` | Finish | route | `router.push(/unit/<id>)` |

Invariants: the submitted text is held in React state across `marking*` and never cleared; a retry is
reachable only from `result` (a `try1` row below the maximum); `discussion` is reachable only from a
server response that carried `discussion`; no state offers a third try; no state offers self-marking.

**Layout (FR-006).** The card is one column at every width: the text panel first at the full card width,
then the question block, then the answer box. The text is a full inline panel (not collapsed, so the student
reads it where they expect it). Prose, poems and footnotes are capped at a comfortable reading width
(`max-width: 68ch`); an image uses the full card width, so it is shown large, and the Zoom dialog is still
there for detail. In the answer box footer a **"View …"** button (44 px), shown at every width, opens
`TextSheet`. Its label is "View " + the short label from the text's heading (the part before the dash:
"Text 1 – Image" gives "View Text 1"), and its `aria-label` is "View " + the full heading ("View Text 1 – Image").
The sheet's title is the full heading and its close button stays "Close". It opens the sheet so the text stays reachable while the textarea is in view (on a phone, with the keyboard up),
without losing the typed text or the scroll position. There is no two-column layout, no 900 px breakpoint
for the card and no sticky text column. `TextSheet` and `ZoomDialog` share one `<dialog>` wrapper with a labelled
"Close" button, `Esc`, focus return, and `prefers-reduced-motion` handled by having no animation at all.

**Timed status steps** are the paragraph unit's pattern: three steps ("Reading your answer", "Comparing it
with the criteria", "Writing your feedback"), the second ticks at 1.5 s, the third at 8 s, and a fourth
"Still working on it" step shows after 25 s (a marking takes 20 to 40 s), with every timeout cleaned up on
response and on unmount, and each change announced once through a polite `role="status"` region. A
footer note: "Marking can take up to a minute." Reduced motion: the progress element is static.

**"Make it even stronger" panel** (`GoFurther`, class `un-go-further`). It reads as the next step once the basics
are met, so it sits **after the seven skill pills and before the answer / model answer comparison** in the
discussion, after the skill list on the result card, and after the skill list of each try on the attempt detail
page. It is a `<section>` labelled by its heading: a 4 px solid `--rd-success-500` left border, a
`--rd-success-50` tint, the heading bold in success green, the sentence at the normal size in `--rd-ink-900`, and
the padding of the tip cards (12px 14px). No red, amber or warning colour. **Contrast:** `success-500` is 3.96:1
on `success-50` and 4.33:1 on white, below the 4.5:1 this unit holds for text, so the heading uses a new darker
token `--rd-success-700` (`#166B46`, about 6:1 on the tint); the border keeps `success-500` (non-text, 3:1).
`tests/styles/contrast.test.ts` checks both text pairs and `unseen-a11y.test.tsx` the rule. Rejected: the heading
in `success-500` (fails 4.5:1); the `un-gap` blue rule (reads as a fault to fix, not a next step).

**Focus** (FR-047, as spec 007 FR-022): the result summary takes focus when the result or the discussion
appears; the retry box takes focus with the caret at the end when the retry opens; the not-marked notice
takes focus when it appears; the dialogs trap focus natively and return it on close.

**Rejected.** Generalising `components/paragraph/*` (it would touch the paragraph unit and its tests for
the two pieces that overlap); a two-column card with a sticky text column from 900 px (the first design:
it squeezes an image into half the card, makes a long poem scroll inside its own column, and needs a second
layout to test and keep right, while one column reads the same on every screen and the "View …" button already
keeps the text reachable); a modal for the text as the only view (it hides the question); collapsing the
text (reading the text is the task); auto-scroll on focus (jarring with the keyboard open).

---

## R13. Unit page and history

**Unit page** (`app/unit/[unitId]/page.tsx`, a branch for `unit.draw`, as spec 007's `unit.sequence` branch):

1. The usual intro card (badges, title, description, exam row) with the start button. Label: **"Start a
   question"**, or **"Continue question"** when a pending attempt exists (with a line naming it:
   "Text 2 – Poem · Fort St 2025 · Q1"), or the repeat notice above the button, or the database-unavailable notice, each
   with the exact wording above. The button calls the shared `startAttempt` (`finished` for an empty bank and `503` mapped
   to this unit's two notices through the `unit.draw` flag).
2. **"Things I need to know"** (`ConceptPanel`): the seven skills, two pips each (R10).
3. **"Your results"** (`UnitProgress`): one row per text form in the bank: form, answered / total,
   average mark as a share of full marks; forms with no answer show "Not tried yet", which is also what
   the draw treats as top weight.
4. The existing guide (`meta.guide`) and "Past attempts" (`AttemptHistory`), named from the first question:
   `attemptLabel` returns **"Fort St 2025 · Q1 · Poem"** for an unseen question (the paper's `short`, year, `Q`+number,
   and the form), as spec 007 returns "Essay 3 · Mechanism". Marks show "/N" with the question's value.

**Attempt detail** (`app/attempts/[attemptId]/page.tsx`, an `unseen` branch): the question and its credit;
**try 1** (text, mark, the seven verdicts with reasons, feedback, biggest gap, or "Make it even stronger" for a full-mark first try); **try 2** if any; the
recorded mark and how it ended; and the **model answer only when the row is `final`** (the student has
already seen it at the discussion, A3). The stimulus text is shown above (public). An unfinished attempt
shows its tries and no model answer. No criteria, notes or description at any time.

**Loaders.** `lib/db/queries/unseen-progress.server.ts` (`loadUnseenProgress` for the unit page: answered by
form, the pending attempt) and an `unseen` member on the history item (as `paragraph`).

---

## R14. Styles

**Decision.** Reuse the existing tokens and classes (`rw-card`, `rw-steps`, `rd-pill`, `.q-card`,
`.unit-intro`, `.section-head`, `.concept-item`, `.stat-strip`, `.unit-attempt`, the `pg-*` look for
collapsed rows) and add a small set scoped with the prefix **`un-`** at the end of `app/globals.css`, using
tokens only (no colour literals).

New classes: `un-main` (the question and answer column below the text, `gap`), `un-text` (heading, title, author, source line), `un-poem` / `un-stanza` / `un-line` (a hanging
indent so wrapped lines are distinguishable from new lines, line numbers in a fixed 3 ch gutter), `un-prose`,
`un-footnotes`, `un-image` and `un-zoom` (the dialog scroll container driven by `--un-zoom`), `un-sheet`
(the bottom-sheet dialog), `un-q` (question block), `un-meter` (the word meter states: short, ok, warn,
over, each with text and an icon as well as colour), `un-result`, `un-skill` (a verdict row), `un-compare`
(two columns from 900 px, stacked below), `un-notice` (status notices, not alerts).

**Checks.** 4.5:1 contrast: the new text/background pairs are added to `tests/styles/contrast.test.ts`
(they reuse the tested ink and surface tokens, so a pair that is already tested is not repeated).
Targets: every button, summary row, dialog control and tick row is `min-height: 44px` (a test over the
rendered DOM's classes plus a CSS test for the `un-*` rules, as `paragraph-a11y.test.tsx`). Reduced motion:
the unit adds no transition or animation, and the dialog uses none; `.pg-card *` style blanket rules are
not needed. 390 px: a client test renders the whole panel with a 390 px container class and asserts no
element has `min-width` beyond it; the manual quickstart checks horizontal scrolling on a real phone.
Poem lines wrap (`overflow-wrap: anywhere`) so a long line never scrolls the page sideways.

**Rejected.** A serif face for poems (no new font; Principle VIII's tokens); using `pg-*` classes directly
(they are prefixed for the paragraph unit and their tests); an images CDN (R3).

---

## R15. Remaining decisions

- **Unit type and topic.** `type: "Writing Practice"`, `year: "Year 12"`, `topic: "Texts and Human
  Experiences"`, `order` after the economics writing units, `created: "2026-11-19"`. A new `UnitMeta.draw`
  (`{ kind: "unseen-weighted" }`) marks the unit for the attempts route, the unit page, `ConceptPanel` and the
  quiz page, as `sequence` does for spec 007. Both are public metadata with no answers.
- **Exam row.** `content/exams.ts` gains "Year 12 Advanced English Task 1" on **2026-12-07** listing this unit
  (the unit page's "In n days" row).
- **Draft route.** `POST /api/rewrite/draft` already serves sentence and paragraph units; its type check
  gains `unseen`, and the stale check reads `unseen_phases` (try 1 stale once a row exists; try 2 stale once
  the row is `final`). Request and responses unchanged. `MAX_DRAFT_LEN` stays 6000.
- **Directive verb definitions.** Held in `lib/unseen/rubric.json` (`directiveVerbs`: analyse, explain,
  assess, evaluate, how, in what way, and the verbs the full paper research finds); a new verb in a
  question without a definition fails validation (rule 4). The definitions go to the marker only; the
  student is not shown them in v1.
- **Tip wording.** The seven tips are the pilot's (`skills.json` carries them verbatim), so the app's
  tips equal what the marker's pilot called "tips". They are generic, so cards never need model text.
- **Past-attempt "Q" numbering.** `paper.qNo` is the paper's number, 1 to 4.
- **Documents.** `docs/y12-english-advanced-unseen-texts-research.md` records the papers, the rubric
  sources and the image-accessibility limitation (Principle V: sources documented).
- **Environment.** `.env.example` and the README gain `ENGLISH_ADV_GRADING_MODEL` and the unit row; no new rate-limit
  variable.
- **Spec wording adjusted by this plan.** FR-014 ("the prompt is the one in `resources/english-unseen/
  rubric.json`") now reads "…moved to `lib/unseen/rubric.json`"; FR-025 ("short tip from `rubric.json`") now
  reads "from the shared skills file `lib/unseen/skills.json`". No requirement changes.

## Source gap

None. The requirements doc ("Spec 008: Advanced English unseen-text short answers") was read in full. Three
facts are **measured, not assumed, in the first quickstart run**: the real marker latency (R5), whether the
trial-paper crops fit the 300 KB budget (R3), and the echo-guard rate (R4).

# Research: Learn From Mistakes

Decisions for the seven design points in the planning brief, plus the choices that came out of
reading the code. Facts about the existing app were checked against the repo on 2026-10-28
(Next 15.5.24, Drizzle 0.45 on the Neon HTTP driver, Vitest 5 with PGlite).

Items that need your confirmation are collected at the end under **Open items**.

## R1. Content: concepts, tags, markers, wrong-option explanations

- **Decision**:
  - `content/units/<unit-id>/concepts.ts` exports `concepts: Concept[]` (`{ id, description }`)
    and `retired: Record<string, string>` (see R3).
  - A concept id is `<unit-id>.c-<slug>`, for example `y11-economics-preliminary.c-scarcity`. It is
    globally unique by construction, like question ids, and is safe in a URL.
  - Each public question gains an optional `concept?: string` field. A tag is not an answer, so it
    may live in `questions.ts` (Principle I only bans answers, rubrics and marking notes).
  - `meta.ts` gains two optional booleans, `conceptsReady` and `explanationsComplete`. The registry
    (`content/index.ts`) attaches `concepts` to each `Unit`.
  - `answers.ts` gains `wrongExplanations?: Record<string, string>` on an MC answer, **keyed by the
    option's text**, the same way `correctText` is. Options are shuffled per attempt, so an index
    would drift.
- **Validator** (`scripts/validate-content.ts`, rules factored into a pure `lib/content-rules.ts` so
  Vitest can test them without running the script):
  - any `concept` on a question must be a concept of its own unit (catches typos early);
  - `conceptsReady`: `concepts.ts` exists, ids are unique and carry the unit prefix, descriptions
    are non-empty, and every question has a tag;
  - `explanationsComplete`: every MC question has an explanation for every option except
    `correctText`; keys are real options; none is empty; short questions carry none;
  - a committed `content/shipped-ids.json` (`{ questions, concepts }`) is the memory the validator
    lacks: a snapshotted question id that is gone fails unless it is a key in that unit's `retired`
    map, a renumbered question looks like a removal and fails, and a snapshotted concept id that is
    gone always fails. `npm run validate:shipped` adds new ids and never removes one, so a
    removal can only be accepted by tombstoning it (this is how "no renumbered question ids" and
    FR-003 are enforced);
  - a `concepts.ts` in a unit folder that the registry never imported is an error;
  - a unit with neither marker is validated exactly as today;
  - a `retired` tombstone key must not equal a live question id, must be namespaced to the unit,
    and must point at a real concept.
- **Authoring**: 200-question units are tagged with a helper or a map applied in `questions.ts`
  (for example `tag(questions, TAGS)`); either way the public question carries `concept`. Tagging
  and explanation writing are content work, done unit by unit, outside this plan's code tasks.
  One unit is done end to end as the pilot (see Open items).
- **Alternatives**: a separate `tags.ts` map (rejected: the brief asks for a field on the question,
  and a map can drift from the questions); wrong-option explanations by option index (rejected:
  options are shuffled).

## R2. Concept progress: a pure replay in answer order

- **Decision**: `lib/concepts/progress.ts` exports a pure function
  `conceptProgress(unit, results)` that replays one student's results for one unit and returns a
  state per concept. It has no database access.
  - Sort by `(answeredAt, id)`. Each result is correct only if `marks >= max` (FR-005: partial
    credit counts as wrong; self-marked answers count like any other).
  - Wrong sets the concept's count to 3. Correct takes 1 away, never below 0. A concept that was
    never missed stays at 0 and is never listed. At 0 the concept is cleared.
  - `lastMissedAt` is the time of the latest wrong answer. `uncleared()` sorts by count descending,
    then `lastMissedAt` descending, then concept id.
  - The concept of a result is `question.concept`, looked up from the current unit content (FR-006),
    or from the unit's `retired` tombstones when the question no longer exists (R3).
- **Loader**: one query, `select id, question_id, marks_awarded, max_marks, created_at from results
  where user_id = $session and unit_id = $unit order by created_at, id`. It always takes the session
  user's id, never a client value (Principle IX).
- **Answer order, not save order**: today `results.created_at` is `now()` when the row is inserted,
  so a result saved late from the outbox would look newer than answers given after it. The retry
  route will pass the receipt's issue time (`iat`, set when the answer was graded) as the result's
  `created_at`. The normal grade and self-mark paths keep the default, which is within milliseconds
  of grading. No schema change; `ResultInsert` gains an optional `createdAt`.
  - `iat` has one-second resolution. Two answers in the same second could tie. The student reads
    the next question between answers, so this is accepted; ties break on `id` so the result is at
    least deterministic.
  - Side effect: the teacher queries that filter on `created_at` become more accurate for late
    saves.
- **Index**: add `results_user_unit_created_idx` on `(user_id, unit_id, created_at, id)`. The
  existing `(user_id, created_at desc)` index would force a filter on `unit_id`; the new one serves
  the loader as an index range scan. A student has tens to a few hundred results per unit, so one
  query is cheap.
- **Alternatives**: store the replayed state per student (rejected: Principle II says derive it);
  order by `attempts.started_at` then question position (rejected: wrong across devices and for
  resumed attempts).

## R3. Retired questions and tags (conflict in the spec, needs your decision)

- **Problem**: FR-006 says a result counts against its question's *current* tag, and FR-008 says
  results for retired questions still count. A removed question has no current tag, so both cannot
  hold without something extra.
- **Decision (proposed)**: when a tagged question is removed from a concept-ready unit, its id is
  added to the unit's `retired` map in `concepts.ts` with the concept it belonged to
  (`{ "y11-x.m07": "y11-x.c-scarcity" }`). The replay uses the tombstone, so FR-006 and FR-008 both
  hold, nothing is stored per result, and no tag is looked up from the database. The validator
  checks the map is well formed (R1). It cannot detect a removal that forgot the tombstone, because
  it has no history, so the rule is a documented authoring step and a code-review item.
- **Alternatives**: let retired results stop counting (rejected: contradicts FR-008, and a student
  who missed a now-removed question would silently lose the weakness); store the tag on each result
  (rejected: FR-058 and Principle II forbid new per-result fields).

## R4. Weighted draw

- **Decision**: extend `drawAttempt(unit, rand, weighting?)` in `lib/attempts/draw.server.ts`. With
  no `weighting` it behaves exactly as today (all existing draw tests keep passing). The route
  builds `weighting` from the student's results and passes it only for a unit with
  `conceptsReady`, a `quiz` config, and at least one uncleared concept.
- **Algorithm**:
  1. Quotas `q_g` come from `quiz.groups`, or from `quiz.short` / `quiz.mc` (legacy) treated as two
     groups. `N = Σ min(q_g, available_g)` is the quiz size and `W = ceil(N / 2)` (rounded up, as
     the clarified spec says). A unit with no `quiz` config draws its whole bank, so there is
     nothing to weight.
  2. Candidates are bank questions whose concept is uncleared. Concepts are ordered by
     `(count desc, lastMissedAt desc, id)`.
  3. Pick `W` candidates by round-robin across concepts in that order (one question per concept per
     round), so no single concept takes every weighted place while others have questions (FR-036).
     The preference order for each pick is:
     1. unseen, in a group that still has weighted capacity (`< q_g`);
     2. seen (answered before), same capacity rule, ordered "last answered wrong" first, then
        least recently answered;
     3. unseen, over capacity;
     4. seen, over capacity.
     Exact half comes first (FR-033); the usual mix is kept only as far as it does not reduce the
     weighted places (FR-038), which is why over-capacity picks are the last resort. Unseen beats
     seen within each capacity class (FR-035).
  4. If fewer than `W` candidates exist, use all of them (FR-037).
  5. The remaining `N - W` places are drawn as usual from the non-chosen questions. Each group's
     remaining quota is `q_g - w_g`; if that sum exceeds `N - W` (a group went over capacity), the
     largest remaining quota is reduced first (ties: the later group) until it fits. If a group has
     too few questions left, the shortfall is topped up from the other groups in listed order.
  6. Final order: per group in listed order (so MC-first or essays-last is preserved), weighted
     and usual picks shuffled together inside each group so the weighted ones are not predictably
     first. MC option order is drawn as today.
- **Reading the results**: `lib/concepts/weighting.server.ts` loads the unit's results once and
  returns `{ states, seen, lastAnswer }`. The attempts route calls it inside the existing
  `dbCall` wrapper; a `DbUnavailableError` (or any timeout) means "draw unweighted" and the quiz
  still starts (FR-046, Principle VI). The signed attempt token already carries the drawn
  question ids, so nothing about weighting reaches the client or the token format.
- **Trade-off recorded**: the preference order puts "keep the mix" ahead of "unseen first". The
  spec supports that reading (FR-038 says the mix yields only to exact half). If you would rather
  have unseen questions beat the mix, swap passes 2 and 3; it is a one-line change in the helper.
- **Alternatives**: weighted random sampling (rejected: not testable against "exactly half" and
  "highest count first"); a two-pass unseen-then-seen across all concepts ignoring groups
  (rejected: it would distort the MC/short mix more than FR-038 allows).

## R5. Generation pipeline and concurrency

- **Shape**: for one concept and one content kind (summary or illustration):
  generate → pre-check → review → (on failure) one automatic regeneration → review → flag.
  Every LLM call reserves one slot from the concept-generation cap first (R8).
- **States** (per version row): `pending_review`, `approved`, `failed_review`. "Not generated" is
  the absence of any row. A new version is first stored as the slot's *replacement*; approval
  promotes it to *live* in one statement (R9).
- **Runs in the background**: a client component on the unit page calls
  `POST /api/units/[unitId]/concepts/ensure` once on mount when some listed concept has no
  approved summary. The route recomputes the signed-in student's uncleared concepts for that unit,
  claims work for the ones that need it, returns `202`, and runs the pipeline inside
  `after()` (`next/server`, stable in Next 15.5; the route sets `maxDuration = 60`). The page itself
  never waits.
  - Generation is **not** started from the page render. A GET with side effects would also fire
    on prefetch and from crawlers that hold a session. A POST from the client is explicit.
  - A student can only trigger work for concepts they currently have uncleared in that unit, and
    only for the four allowed cases: nothing stored, the single automatic regeneration inside a
    run, a retry of a pending review, and (admin route) a teacher's regeneration. A failed-review
    version is terminal until a teacher acts, so opening the page never loops on it.
  - A thin wrapper, `lib/background.server.ts` (`runInBackground(fn)`), calls `after()` and falls
    back to a plain detached promise when there is no request scope (tests, scripts).
- **One generation per concept under concurrency**: a database lease on the slot row. The claim is
  one atomic statement: `update concept_slots set lease_owner = $id, lease_until = now() + 5 min
  where concept_id = $c and kind = $k and (lease_until is null or lease_until < now()) returning
  ...`. Only the caller that gets a row back may generate; the others return immediately. The lease
  expires by itself, so a crashed function cannot block a concept forever. The slot row is created
  with `insert ... on conflict do nothing` first. This is the "database-level guard" the brief asks
  for and it satisfies FR-022 and SC-004.
- **Illustration in the same run**: the summary version carries the decision (`illustration_brief`
  and `illustration_alt`, or null). When it has a brief and `ILLUSTRATION_MODEL` is set, the run
  continues into the illustration: it creates the illustration slot and claims that slot's own
  lease (a separate worker holding it does not stop the summary completing), then runs the same
  generate → check → review → one regeneration → flag cycle. A teacher's illustration regeneration
  starts at the illustration and takes the brief from the live summary, else the replacement
  summary; with neither it returns `no_brief` (a 404 `no_illustration_brief`).
- **Backoff**: when a call fails (provider error, bad JSON), the slot stores `retry_after =
  now() + 15 min` and `last_error`; the cap slot is refunded (no tokens were spent). Without it,
  every student who opens the page would re-trigger a failing call.
- **Deadline**: the run tracks a deadline a few seconds before `maxDuration`. If it is reached
  mid-run, the work stops and the version stays `pending_review`; the next ensure call retries the
  review (the "retry of a pending review" case).
- **Pre-check before the reviewer**: a deterministic, free check rejects a summary that contains a
  long verbatim run (8 or more consecutive words after normalisation) from any model answer,
  rubric point or correct MC option of the questions tagged with the concept (FR-015). It is
  treated as a failed review with a fixed reason, so it feeds the same one-regeneration rule but
  spends no reviewer call.
- **No raw reasons fed back**: the reviewer's reason may quote model answers (FR-029), so it is
  never given to the generator for the automatic regeneration. The retry uses a higher temperature
  instead.
- **Alternatives**: generate during page render with a spinner (rejected: violates "never waits");
  a queue or cron worker (rejected: a new moving part for a few hundred generations); advisory
  locks (rejected: the HTTP driver has no session to hold them).

## R6. How the page picks up approved content (FR-021)

- **Decision**: a small client component, `ConceptLive`, on the unit page.
  - On mount, if the server marked any concept as lacking approved content, it calls the ensure
    route once.
  - While the server reports `pending: true`, it polls `GET /api/units/[unitId]/concepts/status`
    every 5 s, easing to 15 s, for at most 3 minutes, and pauses while the tab is hidden.
  - The status response is `{ version, pending }`. `version` is a hash of the approved version ids
    for the student's listed concepts. When it changes, the component calls `router.refresh()`
    once; the server component re-renders with the new content and no page reload.
  - `pending` is true only while a worker holds an unexpired lease (or this call just claimed
    work). When the cap is reached, the reviewer is misconfigured or a version is `failed_review`,
    `pending` is false, so nothing polls all day.
- **Alternatives**: `router.refresh()` on a timer (rejected: re-runs the whole page, including the
  history queries, every few seconds); server-sent events or websockets (rejected: no
  infrastructure for them, and the wait is short).

## R7. Illustrations

- **Decision**: SVG written by a text model, stored in Postgres, shown only through `<img>`.
  - **Form**: `ILLUSTRATION_MODEL` is a text model asked for a single self-contained SVG. The
    summary model's JSON decides *whether* an illustration is needed and supplies its `brief` and
    `alt` text (FR-017). Image models were rejected: they draw axis labels, curve labels and
    numbers unreliably, and those are exactly what the reviewer must check (FR-024 and
    User Story 7). The repo already ships hand-authored SVG diagrams for economics and physics,
    so the style is familiar.
  - **Sanitising**: the SVG is rejected, not repaired, unless every element and attribute is on a
    short allowlist (`svg g path line polyline polygon rect circle ellipse text tspan defs marker
    title desc`; presentation attributes only; no `href`, no `style`, no `on*`, no
    `<script>`/`<foreignObject>`/`<image>`/`<use>`, `url()` only as `url(#id)`). A rejection counts
    as a failed generation for the one-regeneration rule. This is defence in depth: `<img>` already
    runs no script.
  - **Storage**: a text column on the illustration version row (a few KB). No blob store, so no new
    service or dependency.
  - **Serving**: `GET /api/concepts/[conceptId]/illustration?v=<versionId>`. It requires a session,
    serves only the concept's *live approved* illustration (any other version, or a superseded
    one, is `404`), and sends `Content-Type: image/svg+xml`, `X-Content-Type-Options: nosniff`,
    `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`, and
    `Cache-Control: private, max-age=31536000, immutable` (the URL carries the version id). The UI
    renders `<img src=… alt={alt} loading="lazy">` and nothing else (Principle VII).
  - **Teacher preview**: `GET /api/admin/concepts/[conceptId]/illustration?v=` serves any version
    to an allow-listed teacher so pending and failed illustrations can be inspected.
- **How the reviewer sees it**: a vision model on a rendered picture, plus the SVG source as text.
  The reviewer must check labels, axes and shapes; shapes in raw path coordinates are hard for a
  text model, so the picture is rendered to a PNG on the server and sent as an image input along
  with the source. If rendering fails or the reviewer cannot take images, the version stays
  `pending_review` and is not shown (FR-028).
- **Rasteriser (new dependency, needs sign-off)**: `@resvg/resvg-js` 2.6.2 (MPL-2.0, small JS
  wrapper with a prebuilt native binary per platform, no build step). It renders SVG text with a
  font file we ship (`assets/fonts/NotoSans-Regular.ttf`, OFL), so output does not depend on fonts
  installed on the Vercel runtime. `next.config.mjs` gets
  `serverExternalPackages: ["@resvg/resvg-js"]` and `outputFileTracingIncludes` for the font on the
  two routes that run the pipeline. This is the only new runtime dependency. It is justified
  because FR-024 requires the reviewer to check "labels, axes and shapes", and a text-only reading
  of SVG paths cannot do that reliably (Complexity Tracking).
  - **Alternatives**: `@resvg/resvg-wasm` (no native binary, but a 2.5 MB wasm blob and manual
    initialisation); `sharp` (not installed, relies on system fonts for text); no rasteriser, text
    review of the SVG only (rejected for the reason above; it remains the fallback if you decline
    the dependency, with a weaker "shapes" check).

## R8. Models, configuration and the cap

- **New server-only settings** (read in `lib/*.server.ts` and `app/api/**` only, never
  `NEXT_PUBLIC_`; none is required for the site to start, so production fail-closed is unchanged):
  - `CONCEPT_MODEL`: summary generator. Default `deepseek/deepseek-chat`, like `GRADING_MODEL`.
  - `ILLUSTRATION_MODEL`: no default. Unset means no illustration is ever generated; summaries still
    work.
  - `REVIEW_MODEL`: no default. **Unset, or the same model as the generator, means nothing is
    approved** (content stays `pending_review`). The comparison is made against the generator model
    recorded on the version, ignoring a `:variant` suffix and case, so changing config later cannot
    approve old content with the wrong reviewer.
  - `CONCEPT_DAILY_CAP`: default **100** model calls per Sydney day across all students; `0` turns
    generation off. Sizing: a concept costs about four calls (generate, review, plus an
    illustration pair) and double that in the worst case, so a 5-unit rollout of a few dozen
    concepts per unit fills in over a couple of days while the daily spend stays bounded.
  - `CONCEPT_RATE_LIMIT`: default 10 ensure calls per student per minute, using the existing
    `checkRateLimit` helper.
  - `ADMIN_EMAILS`: comma-separated teacher allow-list (R10).
- **Cap table**: `daily_concept_usage (sydney_date primary key, count)`, **global** (not per
  student). Reservation is the same single upsert as `reserveAiSlot` (`insert … on conflict do
  update … where count < cap`), so the cap can never be exceeded under concurrency. A call that
  fails before a model answers refunds its slot. Generation calls, review calls, the automatic
  regeneration and teacher regenerations all reserve one. The pre-check does not.
- **LLM access**: add a shared `chatCompletion()` to `lib/openrouter.server.ts` (the existing
  fetch, headers, timeout and error handling, extracted) and leave `gradeShortAnswer` behaviour
  unchanged. New code lives in `lib/concepts/llm.server.ts` (prompts, JSON parsing, the port the
  pipeline calls). Tests inject a fake port, so no test touches the network and the existing grader
  mocks are not affected.
- **Prompts** (settled in `contracts/llm.md`): the generator sees the unit title, topic and
  description, the concept description and the *public* prompts of the questions tagged with the
  concept; it never sees model answers. The reviewer sees all of that plus the model answers,
  rubric points and correct options of those questions, and answers with fixed JSON checks
  (`matches_concept`, `accurate`, `no_answer_leak`, `general_not_question_specific`; for pictures
  also `labels_correct`, `axes_correct`, `shapes_correct`). The code computes pass = all checks true
  and ignores any `pass` the model volunteers.
- **Answer-key access (Principle I)**: the reviewer's material comes only from new functions
  exported by `lib/grading.server.ts` (`getReviewMaterial(unitId, conceptId)` and
  `getOptionExplanation(questionId, optionText)`). A test fails if any other file imports
  `content/answers`. The material is passed to the model and discarded: it is never stored on a
  version, logged or returned to a client. The stored reviewer reason may quote it and is
  teacher-only.

## R9. Data model and promotion without transactions

- **Decision**: three new tables (details in `data-model.md`):
  `concept_slots` (one row per concept and kind: pointers to the live and replacement versions,
  the lease, the retry-after time and the last error), `concept_versions` (immutable content and
  review fields per version), and `daily_concept_usage`. No student ids, answers or names anywhere.
- **Why pointers**: the Neon HTTP driver has no interactive transactions (spec 001 R3). A slot row
  holding `live_version_id` and `replacement_version_id` makes "a live version plus at most one
  replacement" true by construction, and promotion is one statement that approves the version and
  swaps the pointer together:
  `with a as (update concept_versions set status = 'approved', … where id = $v returning id)
  update concept_slots set live_version_id = (select id from a), replacement_version_id = null
  where concept_id = $c and kind = $k and replacement_version_id = $v and exists (select 1 from a)`.
  The superseded live version is deleted afterwards by an idempotent clean-up statement (an
  unreferenced row is harmless if the clean-up is missed).
- **What students can read**: only versions reachable through `live_version_id` with `status =
  'approved'`. That is the single read path, so "only approved content is ever shown" (FR-027,
  SC-012) is one query to test.
- **Retention**: shared concept content is not student data (it holds no user id), so the retention
  job and `delete-student` are unchanged; a test pins that the new tables have no user columns.
- **Alternatives**: two role columns with partial unique indexes (rejected: swapping live and
  replacement in one statement trips non-deferrable unique checks); one wide row per concept
  (rejected: summary and illustration are reviewed and approved separately).

## R10. Teacher access

- **Decision**: a new `lib/admin.server.ts` is the only place `ADMIN_EMAILS` is read.
  `isAdminEmail(email)` splits on commas, trims, lowercases, and returns false for an empty list
  (fail closed). `requireAdminPage()` wraps `requirePageUser()` and calls `notFound()` for anyone
  else; `authenticateAdmin()` wraps `authenticate()` and returns `403 { error: "forbidden" }`.
  Both pages and every admin route call them, so the check is made on the server twice over
  (Principle IX). Hiding the link is not access control.
- **Verified email**: any Google account may sign in, and the allow-list is matched on email, so
  an unverified address must not count. The JWT callback records Google's `email_verified` as a
  claim in the token (a cookie, not a database field) and the admin check requires it. Revoking an
  admin is immediate (the allow-list is read from the environment per request); an existing
  teacher signs in once more so their token gains the claim. The dev login counts as verified
  outside production only.
- **Routes**: `app/admin/concepts/page.tsx`, `POST /api/admin/concepts/regenerate`,
  `GET /api/admin/concepts/[conceptId]/illustration`. All satisfy the existing route-guard test
  (they call `authenticate()` / `requirePageUser()` through the admin helpers).
- **Fixing a flagged item (FR-057)**: done in the backend, as decided. `scripts/approve-concept.ts`
  (`npm run concept:approve -- --concept <id> --kind summary|illustration [--bullets-file f]`) runs
  the same promotion statement with `approved_by = 'teacher'`, after the teacher has edited the
  replacement row in the console (or passed a bullets file). `docs/teacher-queries.sql` documents
  the flagged-items query and the edit recipe.

## R11. UI

- **Unit page**: the order is Start/Continue (unchanged, first), then "Things you need to know",
  then history, then formulas and guide. Start quiz stays above all reference material
  (Principle VIII). Each uncleared concept is a native `<details>`: the summary line shows the
  one-line description and "N more correct answers needed"; opening it shows the bullets and the
  `<img>`. No JavaScript is needed to expand it, and with no content the line is simply the
  description (FR-031). No uncleared concepts shows a short positive message (FR-013). Styles use
  `styles/tokens.css`.
- **Unavailable database**: the page already shows `HistoryUnavailable` when history cannot load;
  the concepts section shows the same plain notice and never an error (spec edge case).
- **MC explanation after answering**: `GradeResult` gains `optionExplanation?: string`. The grade
  route sets it only when the unit is `explanationsComplete`, the question is MC, the answer is
  wrong, and an explanation exists for the chosen option, using
  `getOptionExplanation(questionId, optionText)` from `lib/grading.server.ts`. The degraded path
  (database down, graded from the token) works because the explanation comes from the answer key,
  not the database. The `409 already_answered` body gets the same field, recomputed from the stored
  option text. `components/Quiz.tsx` shows it under the options once the question is marked. A
  correct answer reveals nothing about the other options (SC-008).
- **Past attempts**: `app/attempts/[attemptId]/page.tsx` (a server component) calls the same server
  function for wrong MC items, so the *current* explanation is shown and nothing is stored per
  result (FR-048).
- **Teacher page**: a server-rendered table per unit and concept: the live summary and picture,
  the replacement's status, the reviewer's reason (teacher-only), generator and reviewer models,
  times and who approved. A small client component posts regenerate requests and refreshes the
  page; a `202` answer means "queued", and a refusal reason (cap reached, reviewer not configured,
  busy) is shown immediately. Later failures appear on the next refresh as the replacement's
  status and the slot's `last_error` (FR-055).
- **Accessibility**: no target is set (constitution TODO). Illustrations always carry `alt` text,
  `<details>` is keyboard-operable, and the polling component announces nothing so it never
  interrupts a screen reader.

## R12. Teacher queries

`docs/teacher-queries.sql` gains `flagged_concept_content` (every replacement in `failed_review`,
with concept, kind, reason, models and times) and `concept_generation_usage` (calls used per
Sydney day). `tests/teacher-queries.test.ts` already runs every query in the file, so the new ones
are tested by seeding rows. The data-model decision to keep this in SQL, not in the app, matches
spec 001.

## R13. Testing approach

Route handlers are called directly with PGlite running the committed migrations, as in spec 001.
The pipeline takes an injected port (R8), the clock-sensitive parts take an explicit `now`, and
`runInBackground` is awaited in tests. `quickstart.md` lists how each Quality Gate item is covered;
the test files are named in `plan.md`.

## R14. Testing the models locally without paying for them

- **Decision**: `lib/openrouter.server.ts` honours an optional `OPENROUTER_BASE_URL`, but only when
  `NODE_ENV !== "production"`, and `scripts/fake-openrouter.ts` is a small local server that answers
  generator, reviewer and illustrator requests with canned replies. Knobs set a reviewer outcome
  (`pass`, `fail`, `fail-once`, `down`), so the whole review flow can be driven by hand
  (see `quickstart.md`). Automated tests do not use it; they inject a fake port (R8).
- **Rationale**: the review flow has four outcomes (pass, fail then pass, fail twice, unavailable)
  that are hard to reproduce against a real model. A production build ignores the variable, so it
  cannot be used to redirect traffic.

## Open items

These need your decision or sign-off before `/speckit-tasks`. The plan proceeds on the stated
default for each.

1. **Retired questions and tags** (R3): tombstones in `concepts.ts`. Default: yes.
2. **Rasteriser dependency** (R7): `@resvg/resvg-js` so the reviewer can see a picture. Default:
   yes; fallback is text-only review of the SVG.
3. **Principle wording** (Complexity Tracking): the plan reads Principle I's "client MAY send only"
   as governing answer-submission routes, and treats the slot lease, retry-after, last-error and
   version origin columns as pipeline bookkeeping that Principle II's concept-content list does not
   spell out. A one-line constitution clarification would remove the doubt. Default: proceed, flag.
4. **Admin hardening** (R10): admin checks require Google's `email_verified`, so existing teachers
   sign in once more. Default: yes.
5. **Preference order in the draw** (R4): mix before unseen. Default: as written.
6. **Cap default** (R8): 100 model calls per day. Default: as written.
7. **Pilot unit**: tag and explain `y11-economics-preliminary` first. Its research document already
   groups the questions by syllabus focus area, which gives the concept list a head start. The
   other four units follow, one at a time.

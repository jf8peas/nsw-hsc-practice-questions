# Quickstart: Learn From Mistakes

How to run the feature locally and how to verify each part. Spec 001's quickstart still covers
sign-in, saving and the database; this adds what is new.

## Local setup

1. Do the spec 001 setup first (`npm install`, a Neon dev branch or local database in
   `.env.local`, `npm run db:migrate`). The migration for this feature creates `concept_slots`,
   `concept_versions`, `daily_concept_usage` and the new `results` index.
2. Add to `.env.local`. Everything is server-only; none is prefixed `NEXT_PUBLIC_`:

   ```
   # Models. With the fake server below, any names work.
   OPENROUTER_API_KEY=local-test
   OPENROUTER_BASE_URL=http://localhost:4010/v1/chat/completions   # ignored in production
   CONCEPT_MODEL=fake/generator
   ILLUSTRATION_MODEL=fake/illustrator        # unset = no illustrations
   REVIEW_MODEL=fake/reviewer                 # unset or equal to a generator = nothing approved
   CONCEPT_DAILY_CAP=100                      # model calls per Sydney day, all students; 0 = off
   CONCEPT_RATE_LIMIT=10                      # ensure calls per student per minute
   ADMIN_EMAILS=teacher@dev.local             # comma-separated; empty = nobody is a teacher
   ```
3. In one terminal start the fake model server: `npx tsx scripts/fake-openrouter.ts`
   (it listens on port 4010). Set the reviewer's behaviour with `FAKE_REVIEW=pass|fail|fail-once|down`
   in that terminal's environment. Restart it to change the mode.
4. In another terminal `npm run dev`. Sign in with the dev login as `Alice` (a student) and, in a
   private window, as `Teacher` (its email is `teacher@dev.local`, matching `ADMIN_EMAILS`).
5. Tag a unit for local testing. The pilot unit `y11-economics-preliminary` has `conceptsReady`
   once tagged; until then use the test fixture described under *Unit tests*, or temporarily mark
   a small unit by adding `concepts.ts`, tags and `conceptsReady: true` on a branch.

## Checks by feature area

### Concept counts (Story 1, SC-001)

- As Alice, answer one question wrongly. Open the unit page: its concept appears with count 3.
- Answer three questions tagged with that concept correctly. The count goes 2, 1 and the concept
  disappears. Answer another wrongly: it returns at 3, not 4.
- Two concepts with equal counts: the one missed more recently is listed first.
- Partial credit: a short answer with 1 of 2 marks counts as wrong.

### Weighted draw (Story 4, SC-007)

- With two or more uncleared concepts, start a quiz. For a 10-question unit, 5 questions carry
  those concepts (inspect the `questions` in the `POST /api/attempts` response and compare with
  `content/units/<unit>/questions.ts`). A 3-prompt unit (the essay scaffold) draws 2.
- With one uncleared concept that only has one question in the bank, that question is included and
  the other places are drawn as usual.
- Clear all concepts (or sign in as a student with none): the quiz is a normal quiz.
- A unit without `conceptsReady`: a normal quiz, no error.
- Database down: set `DATABASE_URL` to an unreachable host and restart. The quiz still starts
  (unweighted), exactly as spec 001's degraded mode.
- The attempt appears in history like any other, with no label.

### Review flow (Stories 2, 3, 7, 6)

Use the fake server's modes and watch the teacher page (`/admin/concepts`, signed in as Teacher).

| Mode | Open a unit page with an uncleared concept | Expect |
|---|---|---|
| `pass` | Description shows at once; within ~15 s the bullets appear without a reload | Version approved by `reviewer`; live on the teacher page |
| `fail-once` | Same | First version `failed_review`, the regeneration passes; only the second version is ever shown; the cap shows 4 calls used for the concept (generate, review, regenerate, review) |
| `fail` | Description only, never bullets | Replacement `failed_review` with the reviewer's reason on the teacher page; students never see it; reopening the page does not generate again |
| `down` | Description only, no error | Version stays `pending_review`; reopen the page after switching to `pass`: the review is retried and the content appears |

Also try:

- `REVIEW_MODEL` unset, or equal to `CONCEPT_MODEL`: content stays `pending_review`, descriptions
  only, quizzes still start.
- `CONCEPT_DAILY_CAP=0` or a small number: descriptions only once it is used up; AI marking of
  short answers still works (the two caps are independent, SC-006). Check
  `select * from daily_concept_usage;`.
- Open the same unit page in two windows at once: one generation (check
  `select count(*) from concept_versions where concept_id = '…'`).
- Illustration: the fake generator returns an SVG for concepts whose brief asks for one. In the
  browser's developer tools the picture is an `<img>` with alt text, never inline markup. Open the
  image URL directly: it is served with `Content-Security-Policy: …sandbox`.
- A student cannot see the reviewer's reason: search the unit page's HTML and the status response
  for it; it appears only on `/admin/concepts`.

### Teacher routes (Story 6, SC-009)

- As Alice (not on the allow-list): `/admin/concepts` shows the not-found page; `POST
  /api/admin/concepts/regenerate` and `GET /api/admin/concepts/<id>/illustration?v=…` return 403.
- Clear `ADMIN_EMAILS`: even Teacher is refused.
- As Teacher, press Regenerate on a live concept. The old content stays on show until the
  replacement is approved; with `FAKE_REVIEW=fail` it stays on show and the replacement is flagged.
- Flagged-items query: paste the `flagged_concept_content` query from `docs/teacher-queries.sql`
  into the Neon console. Fix the replacement's text in the console, then run
  `npm run concept:approve -- --concept <id> --kind summary`. Students now see the fixed content,
  recorded as approved by a teacher.

### MC explanations (Story 5, SC-008)

- In an `explanationsComplete` unit, answer an MC question wrongly: the explanation for the chosen
  option appears under the options. Answer correctly: no explanation appears.
- Developer tools, Network: the `POST /api/attempts` response and every page contain no
  explanation text before the question is answered.
- Open the attempt from `/progress`: the wrong MC answers show the current explanation.
- Database down: answer an MC question wrongly. The explanation still appears.
- A unit that is not `explanationsComplete`: behaves exactly as before.

### Late saves keep their answer time (research R2)

- With the database unreachable, answer two questions on the same concept (wrong, then right).
  Restore the database and let the outbox retry. In `results`, `created_at` is the time each was
  answered, not the time it was saved, and the concept ends at count 2.

## Unit tests

`npm test` runs everything. The suites added by this feature are listed in `plan.md` under
*Testing*. They use PGlite with the committed migrations, an injected fake model port and a
synthetic two-unit fixture (one concept-ready, one not), so they do not depend on which real units
have been tagged.

## Before merging

- `npm run build` (runs `gen:formulas` and `validate`), `npm run lint`, `npm test`.
- `npm audit` shows nothing new beyond the accepted `postcss` advisory.
- A production-mode check: `NODE_ENV=production` with `REVIEW_MODEL` and `ADMIN_EMAILS` unset
  still serves (these are optional), and `OPENROUTER_BASE_URL` is ignored.

## Production setup additions

1. Vercel environment variables (Production and Preview): `CONCEPT_MODEL` (optional),
   `ILLUSTRATION_MODEL` (optional), `REVIEW_MODEL` (required for anything to be approved; choose a
   different model from the generators, and a vision-capable one if illustrations are on),
   `CONCEPT_DAILY_CAP`, `ADMIN_EMAILS`.
2. Confirm the function `maxDuration` of 60 seconds is allowed on your Vercel plan for the two
   routes that run the pipeline.
3. After deploying, ask each teacher to sign out and in once (their token needs the
   verified-email claim).
4. Add the new variables to `.env.example` and the README (tasks list).

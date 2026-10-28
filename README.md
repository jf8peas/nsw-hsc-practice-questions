# NSW HSC Practice

NSW HSC practice quizzes — short answer and multiple choice, with an LLM grading
short answers against a rubric. Physics is the first subject. Next.js (App
Router) on Vercel.

- **Students sign in with Google.** Every page and API route needs a signed-in
  account (the only exceptions are the sign-in page, the auth callback and the
  secret-protected retention job). Results are saved to the student's account in
  Postgres, so their history follows them to any device.
- **Minimal personal data.** The database stores a student's name, email and
  Google account id, their quiz results, and a few timestamps. Nothing else. It
  is kept in Australia (Neon, Sydney) and deleted 2 years after the student's
  last activity. See the constitution (`.specify/memory/constitution.md`,
  Principle II) for the exact list.
- **Content lives in the repo.** Questions are typed TS files, version-controlled,
  reviewed in PRs, deployed atomically with the code.
- **The answer key never reaches the browser.** All grading happens server-side.
- **A database outage never blocks practice.** Multiple choice is still marked,
  short answers fall back to self-marking, and results are saved when the
  database returns.

The rules every change must follow are in `.specify/memory/constitution.md`. The
design for the sign-in and saved-scores work is in
`specs/001-student-saved-scores/`.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL and AUTH_SECRET (see below)
npm run db:migrate           # create the tables
npm run dev                  # http://localhost:3000
```

Other commands:

```bash
npm run validate       # check content is well-formed (also runs before build)
npm test               # Vitest: authorization, cost controls, retention, queries
npm run lint
npm run build
npm run db:generate    # after changing lib/db/schema.ts: write a new SQL migration
```

**Database.** Create a Neon project in **AWS ap-southeast-2 (Sydney)** (or a dev
branch) and put its connection string in `.env.local` as `DATABASE_URL`. Use
`npx auth secret` to make an `AUTH_SECRET`.

**Signing in locally.** Without Google credentials, development builds show a
**Dev login** form on the sign-in page (any name). It exists only when
`NODE_ENV` is not `production`. To use real Google sign-in locally, create an
OAuth client in Google Cloud and set `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
(redirect URI `http://localhost:3000/api/auth/callback/google`).

Short answers are marked by the LLM when `OPENROUTER_API_KEY` is set; without it
(or when it fails) the student self-marks.

## How it's put together

| Path | What |
| --- | --- |
| `middleware.ts` | Redirects signed-out page requests to `/signin`, answers `401` to signed-out API calls, and **refuses to serve (503)** in production if auth/database config is missing |
| `app/signin/page.tsx` | Sign-in page with the data notice |
| `app/page.tsx` | Home — units grouped by year → topic, plus upcoming exams |
| `app/unit/[unitId]/page.tsx` | Unit overview, the student's attempt history and best/latest score, "Continue attempt" / "Start quiz" |
| `app/unit/[unitId]/quiz/page.tsx` | Quiz runner (`components/Quiz.tsx`, client) |
| `app/progress/page.tsx` | "My progress": every unit attempted, with latest, best and trend |
| `app/attempts/[attemptId]/page.tsx` | One attempt in full: answers, marks and the feedback the student saw |
| `app/api/attempts/route.ts` | Starts an attempt: draws the questions on the server |
| `app/api/grade/route.ts` | Grades one answer and saves it |
| `app/api/results/self-mark/route.ts` | Saves a student's own mark for a short answer the AI could not mark |
| `app/api/results/retry/route.ts` | Saves a result whose first save failed (idempotent) |
| `app/api/cron/retention/route.ts` | Weekly job: deletes students 2 years after their last activity |
| `app/api/units/[unitId]/concepts/{ensure,status}/route.ts` | Starts preparing the student's weak-concept content in the background; the cheap poll the unit page uses to pick it up |
| `app/api/concepts/[conceptId]/illustration/route.ts` | A concept's live, approved picture, for `<img>` only |
| `app/admin/concepts/page.tsx`, `app/api/admin/concepts/**` | Teacher review page, regenerate route and picture preview (allow-listed, verified email only) |
| `lib/concepts/*` | Concept progress (pure replay of results), the weighted-draw loader, the generate → review → regenerate → flag pipeline, the model port, SVG checking, the database store, and `approve.server.ts` behind `npm run concept:approve` |
| `lib/admin.server.ts` | The only reader of `ADMIN_EMAILS` |
| `lib/background.server.ts` | `after()` wrapper that runs model work after the response |
| `lib/grading.server.ts` | Server-only grading logic (touches the answer key) |
| `lib/db/schema.ts`, `drizzle/` | Database schema and the committed SQL migrations |
| `lib/auth.server.ts`, `lib/session.server.ts` | Auth.js setup and the "does this student still exist?" check |
| `lib/tokens.server.ts` | Signed attempt tokens, result receipts and self-mark tokens |
| `lib/outbox.ts`, `lib/drafts.ts` | Browser-side retry queue for unsaved results, and the typed-answer draft |
| `docs/teacher-queries.sql` | Ready-to-run SQL for the teacher (see below) |
| `styles/tokens.css` | Design tokens, copied unchanged from `design/v001` |

### Sign-in and saved results

1. A visitor who is not signed in sees only `/signin`, which explains what is
   kept. Any Google account can sign in.
2. **Starting a quiz** (`POST /api/attempts`) draws the questions on the server
   and returns the public question data plus a signed **attempt token** that
   carries the question list and the option order.
3. **Answering** (`POST /api/grade` with `{ attemptId, attemptToken, questionId,
   answer }`) checks the token, grades, and saves one result row. For multiple
   choice, `answer` is the *display* index of the chosen option.
4. The student sees their mark immediately. If the save is slow or fails, they
   still get the mark plus a signed **receipt**; the browser keeps unsaved
   receipts in a small `localStorage` outbox and retries them
   (`POST /api/results/retry`) with backoff. The student is told "a result could
   not be saved" only if a result is finally lost.
5. **Resume:** the latest unfinished attempt at a unit can be continued on any
   device. An attempt is complete once every drawn question that still exists has
   a result — decided by the server, never the client.

Question ids are keys in the results table, so they are never renumbered or
reused, and removing a question never deletes its stored results (it shows as
"retired" in a student's history).

### The grade endpoint

- **MC** — marked instantly against the answer key, server-side. Never limited.
- **Short answer** — sent to the LLM grader (`lib/openrouter.server.ts`) when
  `OPENROUTER_API_KEY` is set: it returns `marksAwarded` (partial credit),
  written `feedback`, and `rubricHits` / `rubricMisses`. It grades one mark per
  rubric point, on the substance of the reasoning rather than wording, and the
  answer key's `notes` field is passed through as extra marking guidance
  (used e.g. by `y11-economics-essay-scaffold` to steer essay-scaffold marking).
  On any failure (no key, bad key, timeout, unparseable JSON — retried once) it
  returns `needsSelfMark` and the client falls back to student self-marking.
  The stored result keeps the feedback and rubric hits/misses the student saw,
  never the model answer or rubric text.

The browser never holds the API key or the full answer key.

### Cost and abuse controls

Short answers are the only thing that spends OpenRouter credits, so only they are
limited. Multiple choice is never limited.

- **Daily allowance per student:** `LLM_DAILY_CAP` AI-graded short answers per
  student per Sydney calendar day (default **40**; `0` turns AI marking off).
  The count is a single atomic database update, so concurrent requests can never
  exceed it. A failed or fallen-back marking does not count. Over the limit, the
  student self-marks and is told AI marking returns at midnight Sydney time.
- **Rate limits:** `GRADE_RATE_LIMIT` per signed-in student per minute (default
  20) is the primary limit, with a looser per-IP backstop `GRADE_IP_RATE_LIMIT`
  (default 150) because a school shares addresses. `ATTEMPT_RATE_LIMIT` (default
  20) limits starting attempts. They use Upstash Redis when
  `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set, otherwise a
  per-instance in-memory window (`lib/ratelimit.server.ts`). Over the limit →
  `429` with `retryAfter`.

### When the database is unavailable

Every database call on a request path has a 1.5 second timeout. If the database
cannot be reached:

- a quiz can still be started and runs from the browser tab;
- multiple choice is marked from the signed attempt token;
- short answers switch to self-marking (and never count against the daily cap);
- the history sections show "History is temporarily unavailable — your answers
  are still being marked and will be saved." (never a 500);
- results are queued as receipts; when the database returns, the retry creates
  the attempt (if it was never stored) and saves each result exactly once.

Accepted trade-offs: during an outage a deleted student's still-valid session can
practise, but nothing is saved for them; resume and history are unavailable.

### For the teacher

There is one teacher page, `/admin/concepts` (see "Learn From Mistakes" below);
everything else is the database console and these repo commands:

- **Class analysis:** open `docs/teacher-queries.sql`, paste one query into the
  Neon SQL Editor, edit the small `params` block at the top (date range, include
  or exclude self-marked answers, unit, student email) and run it. It has: units
  by class average (lowest first), questions in a unit by average mark, the most
  common wrong multiple-choice option per question, one student's history,
  students' last-active dates, AI-graded answers used today, concept content that
  was held back after failing review (`flagged_concept_content`), and concept
  generation calls used on a day (`concept_generation_usage`).
- **Delete one student immediately** (on request): `npm run delete-student --
  student@example.com` shows what will be removed and asks you to type the email
  to confirm (`--yes` skips the prompt). Their account, attempts and results are
  gone from every query and from their own view; if they sign in again they start
  as a new student.
- **Retention is automatic.** A weekly Vercel Cron call (Sunday night UTC, early Monday in Sydney) to
  `/api/cron/retention` (protected by `CRON_SECRET`) deletes any student whose
  last activity — the later of their last answer and last sign-in, or account
  creation — is more than 2 years old, and prunes old daily-usage rows.

## Learn From Mistakes

Every question in a unit that has adopted concepts carries a `concept` tag from the
unit's `concepts.ts`. From the student's saved results the app derives, per concept, a
count of correct answers still needed: a wrong answer (any answer short of full marks)
sets it to 3, a full-marks answer on any question with that tag takes 1 off, and at 0
the concept is cleared. Results are replayed in the order they were **answered**, and a
late save keeps its answer time. Nothing about concepts is stored per student.

- **"Concepts to review"** on the unit page lists the student's uncleared concepts
  (highest count first, then most recently missed). "Start quiz" stays above it.
- **Weighted quizzes.** In a unit with a `quiz`, exactly half the places, rounded up,
  go to questions on the student's uncleared concepts whenever enough exist: highest
  count first, unseen questions first, spread across concepts. That beats the unit's
  MC / short-answer mix, which is kept only as far as it does not cost a weighted
  place. If the database cannot be read, the quiz is drawn as before.
- **Concept summaries and pictures** are written by a model once per concept, and shared.
  A different model (`REVIEW_MODEL`) must approve each one against the concept
  description and the unit's answer key before any student sees it. A failed item is
  regenerated once; if it fails again it is held back (students see only the one-line
  description) and flagged. With `REVIEW_MODEL` unset, or the same as the generator,
  nothing is approved. Generation runs after the response (`after()`), never
  while a student waits, and has its own daily cap (`CONCEPT_DAILY_CAP`), separate from
  AI marking. The page picks up approved content without a reload.
- **Pictures** are SVG from `ILLUSTRATION_MODEL`, checked against an allowlist (rejected,
  never repaired), rendered for the reviewer, and shown only through `<img>`.
- **Wrong-option explanations.** A unit with `explanationsComplete` has a written
  explanation for every wrong multiple-choice option in its answer key
  (`wrongExplanations`, keyed by option text). It is shown after the student answers
  and on the attempt page; nothing is stored per result.
- **Teacher page.** Teachers on `ADMIN_EMAILS` with a verified Google email open
  `/admin/concepts` to see every concept's live and replacement content, reviewer
  reason, models and times, and to regenerate a summary or picture. The student's
  version stays live until the replacement is approved. To fix a held-back item by
  hand, edit it in the SQL console and run
  `npm run concept:approve -- --concept <id> --kind summary|illustration`
  (add `--bullets-file` to replace a summary's bullets from a file).

### Authoring concepts

- `content/units/<unit>/concepts.ts` exports `concepts` (`{ id, description }`, ids of the
  form `<unit-id>.c-<slug>`, never renamed or reused; descriptions up to 120 characters)
  and `retired`. Register both in `content/index.ts`.
- Add a `concept` to every question, then set `conceptsReady: true` in the unit's
  `meta.ts`. Set `explanationsComplete: true` only once every MC question has an
  explanation for each wrong option. `npm run validate` enforces both rules.
- **Wrong-option explanations** go in the unit's `explanations.ts`: for each MC question number, one
  `[start of the wrong option's text, explanation]` entry per wrong option. `answers.ts` merges them
  with `withWrongExplanations` (`content/explanation-helpers.ts`), which fails the build if a start
  matches no option, several options, or the correct one.
- **Removing a question needs a tombstone.** Add its id to `retired` in `concepts.ts`
  with the concept it carried, or `null` in a unit not yet tagged (a `conceptsReady`
  unit may not have `null` tombstones). A `concepts.ts` may hold only `retired`.
- `content/shipped-ids.json` is a snapshot of every question and concept id ever shipped.
  `npm run validate:shipped` adds new ids to it (commit the file); it never removes one,
  so a removed or renumbered id fails the build unless it is tombstoned. To remove a **whole unit**,
  delete its folder and registry entries and add its id to `retiredUnits` in `content/shipped-ids.json`;
  students' saved results for it stay in the database and show under its id in their history.

### Trying it locally

`npm run fake-openrouter` starts a stand-in model server (`FAKE_REVIEW=pass|fail|fail-once|down`).
Point `OPENROUTER_BASE_URL` at it in `.env.local`; the variable is ignored in production. The
steps are in `specs/002-learn-from-mistakes/quickstart.md`.

## Content structure

One folder per unit. **The unit id, the folder name, and every question id
prefix must match.**

```
content/
  units/
    y11-physics-preliminary/
      meta.ts        # PUBLIC  — id, year, topic, type, title, description, order
      questions.ts   # PUBLIC  — prompt, formula, MC option text, maxMarks
      answers.ts     # KEY     — correctIndex / modelAnswer / rubric / notes / wrongExplanations
      concepts.ts    # PUBLIC  — the unit's concepts and retired-question tombstones (optional)
  index.ts           # PUBLIC registry — the only file that imports every unit
  answers/index.ts   # `import "server-only"` registry of answer keys
  exams.ts           # upcoming exams, referencing unit ids
```

- `content/index.ts` is safe to import anywhere (client included). It has **no
  answer keys**.
- `content/answers/index.ts` has `import "server-only"` at the top — the build
  fails if anything client-side pulls it in. Only `lib/grading.server.ts` uses it.
- Question ids are namespaced: `y11-physics-preliminary.s03` / `.m12`. The grade
  endpoint finds the answer from the id alone, so the client sends only the
  question id, the answer, the attempt id with its signed token (and, for a
  self-mark or a save retry, the signed token or receipt the server issued) —
  never a user id or marks.
- MC option order in `questions.ts` is scrambled deterministically by id
  (`lib/shuffle.ts`), and the answer key stores the correct option's **text**
  (`correctText`), not its index — so the public bundle never reveals a
  "correct option is first" pattern.
- If `meta.quiz` is set (`{ short, mc, passMark }`), each attempt draws that many
  of each type at random from the bank (on the server, when the attempt starts). For finer control, `meta.quiz.groups`
  (`[{ group, n }]`) draws `n` from each named `group` (a question's `group`
  field), in listed order — `y11-economics-supply-demand` uses this to draw
  4 multiple-choice + 4 curve-shift + 2 wider-micro per attempt.
- MC answers grade instantly server-side; **short answers are LLM-graded** when
  `OPENROUTER_API_KEY` is set, otherwise the student self-marks.
- A question may carry an inline `diagramSvg` (built by a per-unit
  `diagram.ts` — see `y11-economics-supply-demand`), shown between the prompt
  and the answer box.
- `meta.formulas` is the list shown on the unit page (below Start quiz and the
  student's history, so mobile users can go straight to the quiz).

### Units

| Unit | Source |
| --- | --- |
| `y11-economics-supply-demand` | NESA Economics 11–12 syllabus ("The Market Economy") + `resources/topic002`. ~84 MC + ~64 diagram SA + 40 written SA covering demand/supply, elasticity (calcs + total outlay), government intervention (ceilings/floors/taxes/subsidies), labour markets and the housing/commodity markets. SVG diagrams from a per-unit `diagram.ts` (curves, shifts, price ceilings/floors, tax/subsidy, labour axes, inelastic housing supply). |
| `y11-economics-preliminary` | Broad prelim-exam revision across all six Year 11 syllabus focus areas — see `docs/y11-economics-preliminary-research.md`. 50 MC + 50 written SA, original questions written to the current (2025) syllabus. Draws 5 MC + 5 SA (MC first). |
| `y11-physics-preliminary` | Broad prelim-exam revision across the three Year 11 physics modules (mechanics, waves, electricity & magnetism) — see `docs/y11-physics-preliminary-research.md`. 50 MC + 50 SA, all factual/reasoning (no calculations). SVG diagrams from a per-unit `diagram.ts` (motion graphs, free-body forces, transverse wave, ray-at-boundary, charge field lines). Draws 5 MC + 5 SA (MC first). |
| `y11-economics-essay-scaffold` | Practice planning 20-mark Preliminary Economics essays (Government & the Economy / Financial Markets), many with real-world stimulus. 34 essay prompts; the student writes a 5-part scaffold (intro / 3 body / conclusion), 5 marks (1 per part), LLM-marked on reasoning and structure. Draws 3 per attempt. `meta.guide` renders the essay-structure panel on the unit page; the answer key's `notes` field carries the examiner-LLM grading directive. |

### Adding a unit

1. `mkdir content/units/<unit-id>` and add `meta.ts`, `questions.ts`,
   `answers.ts` (copy an existing unit as a template).
2. Give every question an id of the form `<unit-id>.<n>`.
3. Register it in **two** places:
   - `content/index.ts` — import its `meta` + `questions`, add to `UNITS`.
   - `content/answers/index.ts` — import its `answers`, spread into `ALL_ANSWERS`.
4. `npm run validate` — checks id namespacing, uniqueness, that every question
   has a matching answer key, MC `correctText` is one of the options, short
   answers have a model answer, `short` rubrics have one point per mark, and
   exams reference real units.

Never renumber or reuse a shipped question id — students' saved results (the
`results.question_id` column) and any bookmarked URLs depend on it. Append new
ids instead. Removing a question is safe: past results stay in the database and
show as "retired" in the student's history. Record the removal as a tombstone in the
unit's `concepts.ts` (see "Authoring concepts"); the validator fails otherwise.

### Adding an exam

Add an entry to `EXAMS` in `content/exams.ts` with an ISO `date` and the
`unitIds` it covers. Past exams drop off automatically.

## Deploying to Vercel

Import the repo in Vercel (framework auto-detects as Next.js). `vercel.json` sets
the function region to `syd1` and the weekly retention cron. The build command is
the `vercel-build` script, which runs `npm run db:migrate` and then the normal
build, so new migrations are applied on each deploy.

**Production refuses to serve until it is configured.** If `AUTH_SECRET`,
`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` or `DATABASE_URL` is missing, every
request gets a `503` — the site never falls back to open access. (This applies to
any build with `NODE_ENV=production`, including Preview deployments.) The check
runs per request, so `next build` still succeeds without secrets.

**Env vars** go in Vercel → Project → Settings → Environment Variables. Set
Production and Preview **separately** (Preview must use a different database).

| Var | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon Postgres connection string (project in `aws-ap-southeast-2`) |
| `AUTH_SECRET` | yes | signs sessions and the attempt/receipt/self-mark tokens (`npx auth secret`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | yes | Google OAuth client; redirect URI `https://<domain>/api/auth/callback/google` |
| `CRON_SECRET` | yes, for retention | Vercel sends it as `Authorization: Bearer …` to `/api/cron/retention`; without it the route answers 503 and no one is deleted |
| `OPENROUTER_API_KEY` | no | turns on LLM short-answer grading (otherwise students self-mark) |
| `GRADING_MODEL` | no | model slug, default `deepseek/deepseek-chat` |
| `SITE_URL` | no | sent to OpenRouter as `HTTP-Referer` |
| `LLM_DAILY_CAP` | no | AI-graded short answers per student per Sydney day (default 40; `0` = AI marking off) |
| `GRADE_RATE_LIMIT` | no | short-answer submissions per student per minute (default 20) |
| `GRADE_IP_RATE_LIMIT` | no | looser per-IP backstop per minute (default 150) |
| `ATTEMPT_RATE_LIMIT` | no | attempts a student can start per minute (default 20) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | no | distributed rate limiting (create the database in `ap-southeast-2`); falls back to in-memory |
| `CONCEPT_MODEL` | no | model that writes concept summaries (default `deepseek/deepseek-chat`) |
| `ILLUSTRATION_MODEL` | no | model that draws concept pictures as SVG; unset = no pictures |
| `REVIEW_MODEL` | no, but nothing is approved without it | independent reviewer; must differ from the generator (case and `:variant` ignored) |
| `CONCEPT_DAILY_CAP` | no | model calls (generate, review, regenerate) per Sydney day across all students (default 100; `0` = off) |
| `CONCEPT_RATE_LIMIT` | no | concept preparation requests per student per minute (default 10) |
| `ADMIN_EMAILS` | no | comma-separated teacher emails for `/admin/concepts`; empty admits nobody, and the email must be verified by Google |
| `OPENROUTER_BASE_URL` | no | local fake model server only; ignored when `NODE_ENV` is `production` |

`CLASS_CODE` and `SKIP_CLASS_CODE` are gone: signing in replaces the class code.
Remove them from Vercel if they are still set.

**Previews.** Preview deployments run the real Google sign-in against a
**non-production** database: give the Preview environment its own `DATABASE_URL`
(a Neon branch created from an empty, schema-only branch — never from the
production branch, which would copy real students' data into previews), and use
a stable preview domain registered as a redirect URI in the Google OAuth client.

**Before launch** (Principle II, not code): school approval / consent for holding
students' name, email and results — including that the text they type for short
answers is sent to a third-party AI service for marking — and a named person who
handles `npm run delete-student` requests.

Locally, copy `.env.example` to `.env.local`. `.env.local` is gitignored — never
commit a real key. Nothing is prefixed `NEXT_PUBLIC_`. Secrets are read only in
server-side code: `app/api/**`, `lib/*.server.ts`, `middleware.ts` (auth config
only), `drizzle.config.ts` and `scripts/**`.

## Roadmap

1. ✅ Full flow — home / unit / quiz / results.
2. ✅ Answer key is server-only; `/api/grade` live.
3. ✅ LLM short-answer grading via OpenRouter, with self-mark fallback.
4. ✅ KaTeX formula rendering — LaTeX in `content/formulas.ts`, pre-rendered to
   HTML at build time (`scripts/gen-formula-html.ts`) so KaTeX stays out of the
   client bundle.
5. ✅ Google sign-in; results saved per student (attempts, answers, feedback),
   on any device; resume; "My progress"; attempt detail.
6. ✅ Per-student daily AI allowance plus per-user and per-IP rate limits (the
   class-code gate is retired).
7. ✅ Teacher analysis from the database (`docs/teacher-queries.sql`), immediate
   delete by email, and automatic 2-year retention.
8. ✅ A database outage never blocks practice.

Possible next: an in-app teacher view (the data and the allowlist rules are
already designed — constitution Principle IX); student groups; more units; OCR
the 3 scanned exam papers; a bigger MC bank; re-weight short vs MC marks
(currently 3:1).

## Notes

- `npm audit` flags a high-severity `postcss` advisory pulled in transitively by
  Next 15's build tooling. It's build-time only and not in the request path;
  clearing it means moving to Next 16. Revisit deliberately.
- `content/formulas.generated.ts` is generated — `npm run gen:formulas` (also
  runs in `prebuild`). Committed so `next dev` works without a build step.
- `design/v001/` is the original Claude Design canvas prototype, kept for
  reference. `styles/tokens.css` is copied from it.
- `next lint` is deprecated in Next 15.5 and removed in Next 16; migrate to the
  ESLint CLI when moving to Next 16. Likewise `middleware.ts` is renamed `proxy`
  in Next 16.
- Auth.js v5 is still published under the `beta` tag; `next-auth` is pinned to an
  exact version in `package.json`. Upgrade it deliberately.

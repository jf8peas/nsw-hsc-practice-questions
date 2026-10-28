<!--
Sync Impact Report
- Version change: 2.7.0 → 2.8.0 (MINOR: retest attempts replaced by weighted normal quizzes; no
  principle removed). Decision (spec 002): there is no separate retest. Every normal quiz in a
  concept-ready unit fills up to half its places with questions on the student's uncleared
  concepts; the rest are drawn as usual. These quizzes count normally toward averages, best,
  latest and trend. The "whether the attempt is a retest" flag added in 2.7.0 is withdrawn.
- Modified principles:
  - II. Per-attempt storage no longer includes whether the attempt is a retest.
  - III. The unit-readiness bullet now says an unmarked unit has no weighting toward weak
    concepts (instead of no retest). New bullet: quiz questions MUST come only from the unit's
    question bank; no quiz question is written by an LLM.
  - VI. The concept-generation fallback bullet now says the unit page MUST NOT show an error or
    stop the student starting a quiz (instead of block a retest). New bullet: weighting a quiz
    toward weak concepts needs the student's saved results; if the database cannot be read, the
    quiz MUST still start, drawn without weighting, as in the existing degraded mode.
  - All other principles unchanged by 2.8.0.
- Added sections: none
- Removed sections: none
- Quality Gates: unchanged.
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ already checks plans against the current constitution
  - .specify/templates/spec-template.md ✅ no change needed
  - .specify/templates/tasks-template.md ✅ no change needed
  - specs/001-student-saved-scores/{spec,plan,research,data-model,contracts,quickstart,tasks}
    ⚠ pending: not yet reviewed against 2.8.0 (additive rules only, no conflicts expected)
  - specs/002-learn-from-mistakes/spec.md ✅ updated for 2.8.0 (weighted quizzes replace
    retests; concept-ready scope; Concept Content versions; self-marked answers count like any
    other)
  - README.md ⚠ pending (task in tasks.md)
  - .env.example ⚠ pending (task in tasks.md; also add ILLUSTRATION_MODEL, REVIEW_MODEL and the
    concept cap)
- Follow-up TODOs: TODO(ACCESSIBILITY_TARGET)
Legend: rules marked [PRACTICE] describe what the repo already does today. Rules marked
[DECISION] are team decisions that are not yet current practice.
-->

# NSW HSC Practice Constitution

NSW HSC Practice is a Next.js 15 (App Router, React 19, TypeScript) app on Vercel that gives
NSW HSC students practice quizzes (multiple choice and short answer). Short answers are graded by
an LLM against a rubric. This constitution records how the project works, the direction it has
decided to take, and the rules that every feature, spec and plan MUST respect.

## Core Principles

### I. The Answer Key Never Reaches the Browser [PRACTICE]

- All grading MUST happen server-side, in `app/api/grade` and `lib/*.server.ts`.
- `content/answers/index.ts` MUST keep `import "server-only"`, and only
  `lib/grading.server.ts` MAY import it.
- Public files (`meta.ts`, `questions.ts`, `content/index.ts`) MUST NOT contain correct answers,
  model answers, rubrics or marking notes.
- The client MAY send only: `questionId`, `answer`, an opaque `attemptId` together with the
  server-issued signed attempt token; for a self-mark, a binary `correct` flag together with the
  server-issued signed self-mark token; and, for a save retry, the server-issued signed result
  receipt.
- The client MUST NOT send a user id, marks, max marks or grading method. The only exception is
  the binary self-mark flag, which the server accepts only with a valid token.
- Before acting on any request, the server MUST verify that every `attemptId` belongs to the
  session user (by database lookup, or by a valid signed attempt token bound to that user), and
  that every token or receipt is correctly signed, unexpired and bound to that user, attempt and
  question.
- MC answer keys MUST store the correct option's text (`correctText`), not its index. Option order
  is shuffled deterministically by question id (`lib/shuffle.ts`), so the public bundle shows no
  answer pattern.
- [DECISION] The stored "answer submitted" and grading feedback MAY be shown back to the student
  who wrote them. Model answers and rubrics remain server-only and MUST NOT be stored per-result.
- MC wrong-option explanations MUST live in the server-only answer key (`answers.ts`). One MAY be
  shown to the student only after they answer that question.
- Concept summaries explain a concept in general. They MUST NOT reproduce any question's model
  answer, rubric text or correct MC option.
- Concept review and past-attempt MC explanations MUST get answer-key material only by calling
  functions exported from `lib/grading.server.ts`. That material MUST stay server-side and MUST
  NOT be stored per result.

Rationale: a practice tool whose answers can be read from the page source is worthless. The
`server-only` import makes the build fail if client code ever pulls the key in.

### II. Signed-In Students, Minimal Personal Data [DECISION]

- Every page and API route, except the sign-in page, the auth callback and the scheduled
  retention endpoint, MUST require a signed-in Google account (Auth.js / NextAuth, Google
  provider). There is no anonymous mode in production.
- The retention endpoint MUST require the `CRON_SECRET` bearer token (checked in constant time),
  MUST reject every other caller, MUST only perform retention deletion, and MUST NOT return
  student data.
- Any Google account MAY sign in. There is no domain restriction.
- The server MAY store only:
  - per student: Google account id (`sub`), name, email, and the timestamps created, last
    sign-in and last answer;
  - per quiz attempt: the unit id, start and completion times, the ordered list of question ids
    drawn, and the MC option display order;
  - per result: a quiz-attempt id, unit id, question id, answer submitted, marks awarded, max
    marks, graded-by LLM/self/auto, and timestamp;
  - per AI-graded result: the feedback text and the rubric points hit and missed, exactly as
    shown to the student. Model answers and rubric text MUST NOT be stored per result
    (Principle I).
  It MUST NOT store profile photos, Google tokens beyond what the session needs, or any other
  personal data without amending this constitution.
- Student data MUST be stored in an Australian region (Neon Postgres, AWS ap-southeast-2 Sydney).
- Retention: a student and all their data MUST be deleted automatically 2 years after their last
  activity (a scheduled job). Last activity is the later of last answer and last sign-in, or the
  account creation time if neither exists. There MUST also be a documented way to
  delete one student's data immediately on request.
- Students are minors. Before production launch the project MUST have school approval / consent
  covering this data.
- No new per-student fields. A student's concept counts MUST be derived from their stored
  results, not stored separately: a wrong answer sets the concept's count to 3, a correct answer
  takes 1 away, and the concept clears at 0.
- Other server-side state is limited to rate-limit and daily-cap counters (Principle VII)
  and shared concept content. Shared concept content is, per concept id: the summary and the
  illustration (with its brief), each with its own generator model, generation time, review
  status, reviewer model, reviewer reason, review time and who approved it (reviewer or
  teacher), plus at most one pending or failed replacement for each. It is not personal data and
  MUST NOT contain any student's answers or name. The reviewer's reason MAY quote model answers
  or rubrics, so it MUST be shown to teachers only.

Rationale: scores must follow the student across devices and give the teacher a view of
progress. Collection is limited to what that needs, and data does not outlive its use.

### III. Content Is Code [PRACTICE + DECISION]

- Questions are typed TS files under `content/units/<unit-id>/` (`meta.ts`, `questions.ts`,
  `answers.ts`), reviewed in PRs and deployed atomically with the app.
- The unit id, folder name and question-id prefix MUST match (`<unit-id>.<n>`).
- Every unit MUST be registered in both `content/index.ts` and `content/answers/index.ts`.
- Shipped question ids MUST NEVER be renumbered or reused. Bookmarked URLs depend on them.
  [DECISION] Question ids are also foreign keys in the results table, which is one more reason.
  New questions get new ids appended.
- [DECISION] Removing a question from a unit MUST NOT delete its stored results.
- Each concept-ready unit MUST list its concepts in `content/units/<unit-id>/concepts.ts`: an id
  and a one-line description each.
- Every question in a concept-ready unit MUST carry a concept tag from its unit's list.
- Shipped concept ids MUST NEVER be renamed or reused, because student progress depends on them.
- [DECISION] Units adopt concepts and MC wrong-option explanations one at a time. `meta.ts` MAY
  mark a unit concept-ready only when every question in it is tagged, and MAY mark it
  explanations-complete only when every wrong MC option in it has an explanation. A unit that is
  not marked keeps working as it did before: it has no "Things you need to know", no weighting
  toward weak concepts, and no wrong-option explanations, and it MUST NOT show an error. The
  markers are public metadata and MUST NOT contain answers.
- Quiz questions MUST come only from the unit's question bank. No quiz question is written by an
  LLM.

Rationale: versioning content with the code means a deploy can never serve questions without
matching answers.

### IV. Validation Gates the Build [PRACTICE + DECISION]

- `npm run validate` (`scripts/validate-content.ts`) runs in `prebuild` and MUST pass.
- [DECISION] Content rules belong in the validator, not in reviewers' heads. When a new content
  convention is introduced, the validator MUST be extended to check it in the same change.
- Build-time generation is preferred over shipping heavy libraries to the client. For example,
  KaTeX formulas are pre-rendered by `scripts/gen-formula-html.ts`, which keeps KaTeX out of the
  client bundle.
- The validator MUST check that every question in a concept-ready unit has a valid concept tag
  and every concept id is unique, and that every wrong MC option in an explanations-complete unit
  has an explanation. It MUST fail the build if a unit is marked but does not meet this.

Rationale: the validator already checks id namespacing and uniqueness, answer-key coverage, MC
`correctText` membership, model answers, one rubric point per mark, and exam-to-unit references.
Automated checks do not drift.

### V. Syllabus Fidelity and Original Content [PRACTICE + DECISION]

- Questions MUST align to the current NESA syllabus for the subject.
- Each unit's sources MUST be documented, in `docs/<unit>-research.md` or the README units table.
- Questions MUST be original. Copyrighted past papers and source material stay in `/resources/`
  (gitignored) and MUST NOT be committed or reproduced verbatim.

Rationale: students are practising for a specific exam, and the repo is not a vehicle for
redistributing copyrighted papers. [DECISION]: the "documented sources" rule is stated as
mandatory here. Current units follow it, but the README does not yet say so.

### VI. Grading Is Fair, Explainable and Degrades Gracefully [PRACTICE + DECISION]

- Short answers earn one mark per rubric point, judged on the substance of the reasoning rather
  than exact wording. Partial credit is allowed.
- The grader MUST return `marksAwarded`, `feedback`, `rubricHits` and `rubricMisses`.
- Any LLM failure (no key, bad key, timeout, unparseable output after one retry) MUST fall back
  to student self-marking (`needsSelfMark`). It MUST NOT show an error or award a wrong mark.
- [DECISION] When a student is over the LLM daily cap, short answers fall back to self-marking
  (`needsSelfMark`), exactly like an LLM failure.
- [DECISION] MC grading MUST be instant and server-side. It requires sign-in like everything
  else, but has no daily cap.
- [DECISION] Results MUST be saved for both MC and short answers. If saving fails, the student
  still sees their mark and the save is retried or reported. A database outage MUST NOT block
  practice.
- [DECISION] If the database cannot be read at all, MC answers MUST still be marked and shown
  (graded from the signed attempt token) and queued for saving, and short answers MUST fall back
  to self-marking with a notice. This degraded mode applies only when the database is
  unreachable: if it can be read and the student's row is missing, the session MUST be refused.
- If a concept summary or illustration cannot be generated (no key, failure, over the cap), the
  unit page MUST still list the student's weak concepts by their one-line descriptions. It MUST
  NOT show an error or stop the student starting a quiz.
- Every concept summary and illustration MUST pass an independent reviewer LLM, using a different
  model from the generator, before students see it. The reviewer checks it against the concept
  description and the unit's model answers and rubrics. A failed item is regenerated once; if it
  fails again it MUST be held back, students see only the one-line description, and it is flagged
  for teacher review.
- Weighting a quiz toward weak concepts needs the student's saved results. If the database cannot
  be read, the quiz MUST still start, drawn without weighting, as in the existing degraded mode.

Rationale: students need to trust their marks, and a flaky or missing LLM or database must never
block practice.

### VII. Cost and Abuse Controls on Paid Paths [DECISION]

- The class-code gate is retired: `CLASS_CODE`, `SKIP_CLASS_CODE`, `/api/unlock`, the unlock
  cookie and `lib/gate.server.ts` are removed. Sign-in replaces it.
- Because any Google account can sign in, the LLM path MUST be protected by:
  - (a) a per-user daily cap on LLM-graded short answers, set by `LLM_DAILY_CAP` (default 40),
    counted server-side per user per Sydney calendar day; and
  - (b) the existing per-IP rate limit, plus a per-user per-minute limit
    (`lib/ratelimit.server.ts`: Upstash, with in-memory fallback).
- Concept generation MUST have its own daily cap, separate from `LLM_DAILY_CAP`, and MUST run
  only in four cases: a concept with nothing stored yet, a teacher's regeneration, the single
  automatic regeneration after a failed review (Principle VI), and a retry of a pending review.
- Secrets MUST be read only in server-side code: `app/api/**`, `lib/*.server.ts`,
  `middleware.ts`, `drizzle.config.ts` and `scripts/**`. They MUST NOT be read in client
  components or anything bundled for the browser, and nothing may be prefixed `NEXT_PUBLIC_`.
  Real keys MUST NOT be committed (`.env.local` is gitignored). This covers `AUTH_SECRET`,
  `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL` and `CRON_SECRET`.
  - `middleware.ts` MAY read only what auth needs (`AUTH_SECRET` and auth config); it MUST NOT
    read `OPENROUTER_API_KEY`.
  - `drizzle.config.ts` and `scripts/**` run only locally or in CI/deploy, never at request time,
    and take secrets from the environment or `.env.local`, which is never committed.
- `ILLUSTRATION_MODEL` and any key it needs follow the same server-only rules as
  `OPENROUTER_API_KEY`.
- `REVIEW_MODEL` follows the same server-only rules as `OPENROUTER_API_KEY`. Reviewer calls count
  toward the concept-generation cap.
- In production, missing auth or database config MUST fail closed (refuse to serve), never fall
  back to open access. In local development only, a documented dev-login MAY stand in for Google,
  and results MAY be stored in a local or branch database. Without `OPENROUTER_API_KEY`, short
  answers still self-mark.
- Generated illustrations MUST be displayed through an `<img>` element, never inserted as inline
  HTML or SVG.

Rationale: one shared LLM key is reachable by anyone with a Google account, so it needs a
per-user budget as well as per-IP limits. Failing closed stops a misconfigured deploy from
exposing student data.

### VIII. Simplicity [PRACTICE + DECISION]

- [DECISION] Keep the dependency footprint small. Runtime dependencies are `next`, `react`,
  `react-dom`, `katex`, the two Upstash packages, Neon Postgres and Auth.js. The last two are
  now justified for cross-device scores and teacher visibility. Any further database, ORM or
  auth addition, or any state library, requires a written justification in the plan.
- [DECISION] Mobile-first: students mostly use phones, so key actions (e.g. "Start quiz") MUST
  be reachable without scrolling past reference material (the unit page already places
  `meta.formulas` below Start quiz).
- [PRACTICE] Design tokens come from `styles/tokens.css`.
- [DECISION] The database is the only source of truth for scores. Existing browser
  `localStorage` history is NOT migrated; students start fresh on first sign-in, and the
  `localStorage` score history in `lib/scores.ts` is retired. `localStorage` MAY be used only as
  a cache.

Rationale: a small codebase is easier for a small team to keep correct.

### IX. Teacher Access Is Server-Side and Allowlisted [DECISION]

- Teacher/admin pages (per-student history, per-question and per-unit class averages) MUST check
  the signed-in email against the `ADMIN_EMAILS` env var on the server, for both the page and its
  data routes. Hiding links in the UI is not access control.
- Students MUST only be able to read their own results. Every query for results MUST be scoped
  by the session's user id on the server, never by an id sent from the client.
- The page for reviewing and regenerating concept summaries and illustrations MUST check
  `ADMIN_EMAILS` on the server, for the page and its data routes.
- Aggregate views SHOULD rank units and questions by lowest average mark, so the teacher can see
  where to focus.

Rationale: the results table holds minors' data, so authorization must be enforced where the
data is read.

## Quality Gates

Every feature plan MUST satisfy:

- `npm run build` (which runs `gen:formulas` and `validate`), `npm run lint` and `npm test`
  (Vitest) pass.
- A constitution check confirming:
  - no answer-key leakage into client bundles;
  - the client sends only the fields Principle I allows, and the server verifies attempt
    ownership and every token or receipt before acting on it;
  - secrets are read only in the server-side locations Principle VII allows;
  - the retention endpoint meets Principle II's constraints;
  - every new route requires a session;
  - every results query is scoped to the session user (or `ADMIN_EMAILS` for teacher routes);
  - no new personal-data fields beyond Principle II's list;
  - no renumbered question ids;
  - the LLM path enforces the daily cap;
  - no MC explanation in any client bundle;
  - illustrations are rendered only through `<img>`;
  - concept generation enforces its own cap.
- Testing: authorization and cost-control logic MUST ship with automated tests covering:
  - students can only read their own results;
  - admin routes reject non-allowlisted emails;
  - production fails closed when auth/DB config is missing;
  - the daily cap falls back to self-marking;
  - the concept cap falls back to descriptions only;
  - concept counts follow the rule: a wrong answer sets the count to 3, a correct answer takes 1
    away, and the concept clears at 0;
  - the regenerate route rejects non-allowlisted emails;
  - an item that fails review twice is never shown to students.
  Other logic MAY have tests but is not required to.
- Accessibility: no target is currently set.
  TODO(ACCESSIBILITY_TARGET): decide a target for quiz flows (e.g. WCAG 2.2 AA), or omit.

## Known Accepted Exceptions

These are documented deliberately. Do not "fix" them silently.

- The `npm audit` high-severity `postcss` advisory is transitive from Next 15 build tooling. It
  is build-time only and not in the request path. It will be revisited deliberately when moving
  to Next 16.
- `content/formulas.generated.ts` is generated but committed so `next dev` works without a
  build step.

## Governance

- This constitution overrides other practice docs (including the README) where they conflict.
- Amendments are made by PR. Each amendment MUST update the version and the Last Amended date.
- Versioning is semantic: MAJOR for removed or redefined principles, MINOR for new principles or
  materially expanded guidance, PATCH for wording and clarifications.
- Plans produced by `/speckit.plan` MUST include a Constitution Check section. Any violation MUST
  be justified in the plan's Complexity Tracking table.
- Compliance is reviewed in PRs against the Quality Gates above.

**Version**: 2.8.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-28

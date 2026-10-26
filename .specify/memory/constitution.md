<!--
Sync Impact Report
- Version change: 2.2.0 → 2.3.0 (MINOR: expanded guidance in Principles I and VI; nothing removed
  or redefined). Driven by the /speckit-analyze finding on specs/001-student-saved-scores
  (database outage must not block grading).
- Modified principles:
  - I. The client MAY now also send the server-issued signed attempt token alongside the opaque
    attemptId. The server's duty to verify attempt ownership is satisfied either by a database
    lookup or by a valid signed attempt token bound to the session user.
  - VI. New bullet: if the database cannot be read, MC marks MUST still be shown (graded from the
    signed attempt token) and queued for saving, and short answers MUST fall back to
    self-marking. A deleted student's session is still refused when the database CAN be read.
  - All other principles unchanged.
- Added sections: none
- Removed sections: none
- Quality Gates: unchanged (the existing "client sends only the fields Principle I allows" check
  now includes the attempt token).
- Templates requiring updates:
  - .specify/templates/plan-template.md ⚠ pending: its Constitution Check is still the generic
    placeholder; it must reference Principles I–IX and the Quality Gates (task in tasks.md).
  - .specify/templates/spec-template.md ✅ no change needed
  - .specify/templates/tasks-template.md ✅ no change needed
  - specs/001-student-saved-scores/{spec,plan,research,data-model,contracts,quickstart,tasks}
    ✅ updated for 2.3.0
  - README.md ⚠ pending (task in tasks.md)
  - .env.example ⚠ pending (task in tasks.md)
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
- Other server-side state is limited to rate-limit and daily-cap counters (Principle VII).

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

Rationale: versioning content with the code means a deploy can never serve questions without
matching answers.

### IV. Validation Gates the Build [PRACTICE + DECISION]

- `npm run validate` (`scripts/validate-content.ts`) runs in `prebuild` and MUST pass.
- [DECISION] Content rules belong in the validator, not in reviewers' heads. When a new content
  convention is introduced, the validator MUST be extended to check it in the same change.
- Build-time generation is preferred over shipping heavy libraries to the client. For example,
  KaTeX formulas are pre-rendered by `scripts/gen-formula-html.ts`, which keeps KaTeX out of the
  client bundle.

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
- Secrets MUST be read only in server-side code: `app/api/**`, `lib/*.server.ts`,
  `middleware.ts`, `drizzle.config.ts` and `scripts/**`. They MUST NOT be read in client
  components or anything bundled for the browser, and nothing may be prefixed `NEXT_PUBLIC_`.
  Real keys MUST NOT be committed (`.env.local` is gitignored). This covers `AUTH_SECRET`,
  `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL` and `CRON_SECRET`.
  - `middleware.ts` MAY read only what auth needs (`AUTH_SECRET` and auth config); it MUST NOT
    read `OPENROUTER_API_KEY`.
  - `drizzle.config.ts` and `scripts/**` run only locally or in CI/deploy, never at request time,
    and take secrets from the environment or `.env.local`, which is never committed.
- In production, missing auth or database config MUST fail closed (refuse to serve), never fall
  back to open access. In local development only, a documented dev-login MAY stand in for Google,
  and results MAY be stored in a local or branch database. Without `OPENROUTER_API_KEY`, short
  answers still self-mark.

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
  - the LLM path enforces the daily cap.
- Testing: authorization and cost-control logic MUST ship with automated tests covering:
  - students can only read their own results;
  - admin routes reject non-allowlisted emails;
  - production fails closed when auth/DB config is missing;
  - the daily cap falls back to self-marking.
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

**Version**: 2.3.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26

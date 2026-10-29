<!--
Sync Impact Report
- Version change: 2.10.0 → 2.11.0 (MINOR: materially expanded guidance in Principles I, II, V, VI, VII, VIII to allow photo answers).
- Reason (amendment log): students need to answer short-answer questions by writing on paper and submitting 1-3 photos, which are transcribed to text and then AI-marked. Typing maths working on a phone is slow, so students skip steps or whole questions, and the grader never sees the working that HSC marking rewards.
- Modified principles:
  - I. The Answer Key Never Reaches the Browser: transcribe route may accept 1-3 images and an optional note; `/api/grade` may accept the signed transcription token. Vision prompt gets no model answer or rubric.
  - II. Signed-In Students, Minimal Personal Data: photos are never stored or logged; only the transcription (the "answer submitted"). Consent wording: answer photos are sent to an AI provider that may use them for training; students must keep personal or sensitive information out of photos. FR-026 metrics (hashed userId, questionId, outcome, duration_ms, model) are allowed in logs.
  - V. Syllabus Fidelity and Original Content: "No photographed images" covers question content, not student answers.
  - VI. Grading Is Fair, Explainable and Degrades Gracefully: illegible / not-an-answer → retake, never 0; refund rules for AI slot; 3-read limit per question.
  - VII. Cost and Abuse Controls on Paid Paths: `VISION_MODEL` is server-only like `OPENROUTER_API_KEY`; photo reads count against `LLM_DAILY_CAP` (one slot per question, no separate cap).
  - VIII. Simplicity: no new dependency: native file input, canvas, `FormData`, existing fetch wrapper.
- Added sections: none
- Removed sections: none
- Quality Gates: updated to include photo answer checks (no image data in database or logs, 3-read limit enforced, refund rules).
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated (Principle VIII row already present)
  - .specify/templates/spec-template.md ✅ no change needed
  - .specify/templates/tasks-template.md ✅ no change needed
  - specs/001-student-saved-scores/{spec,plan,research,data-model,contracts,quickstart,tasks} ✅ unaffected
  - specs/002-learn-from-mistakes/{spec,plan,tasks}.md ✅ unaffected
  - README.md ⚠ pending: document `VISION_MODEL` env var (add when feature is implemented)
  - .env.example ⚠ pending: add `VISION_MODEL=deepseek/deepseek-v4.1-flash` (add when feature is implemented)
- Follow-up TODOs: TODO(ACCESSIBILITY_TARGET); TODO(VISION_MODEL_ENV): add to `.env.example` and README during implementation.
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
- On answer-submission routes (grading, self-mark and save retry), the client MAY send only:
  `questionId`, `answer`, an opaque `attemptId` together with the
  server-issued signed attempt token; for a self-mark, a binary `correct` flag together with the
  server-issued signed self-mark token; and, for a save retry, the server-issued signed result
  receipt. The transcribe route (`POST /api/transcribe`) MAY accept 1-3 images and an optional note;
  `/api/grade` MAY accept the signed transcription token. The vision prompt gets no model answer or rubric.
- The client MUST NOT send a user id, marks, max marks or grading method. The only exception is
  the binary self-mark flag, which the server accepts only with a valid token.
- Other routes MAY take from the client only resource identifiers that the server re-checks: a
  unit id, concept id, version id, or the kind of concept item (summary or illustration). They
  MUST NOT accept a user id, marks, max marks, grading method or answer, and the server MUST
  authorise every such request from the session (Principle IX for teacher routes).
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
  personal data without amending this constitution. Photos for transcription are never stored or logged;
  only the transcription (the "answer submitted") is stored. Answer photos are sent to an AI provider
  that may use them for training; school consent must state this and tell students to keep personal or
  sensitive information out of photos. Minimal observability metrics (hashed userId, questionId, outcome,
  duration_ms, model) are allowed in logs (FR-026).
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
  or rubrics, so it MUST be shown to teachers only. Shared concept content MAY also hold pipeline
  bookkeeping that is not personal data: per concept item, a processing lease (owner and
  expiry), a retry-after time and the last error; and per version, its origin (first
  generation, automatic regeneration or teacher regeneration) and attempt number.

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
- Questions MUST be original, with one exception. While the app is non-commercial, a question MAY
  be copied word for word from a school trial or half-yearly paper, provided it shows its
  source: the school, the year, the paper type (trial or half-yearly) and the question number.
  The source MUST be recorded in the question's public data and shown with the question.
- Before the app goes commercial (for example by charging students, selling access or carrying
  advertising), every question copied under that exception MUST be rewritten as an original
  question.
- Real HSC questions (from NESA past papers or exams) MUST NEVER be included, whether copied,
  lightly reworded or recreated, so that past HSC papers stay unseen for full practice exams.
- Every diagram MUST be redrawn in code (for example a per-unit `diagram.ts`). Scanned,
  photographed or otherwise copied images MUST NOT be committed or served. This rule covers question
  content, not student answers (photo answers are permitted).
- Other copyrighted past papers and source material stay in `/resources/` (gitignored) and MUST
  NOT be committed or reproduced, apart from the school-paper exception above.

Rationale: students are practising for a specific exam, and the repo is not a vehicle for
redistributing copyrighted papers. School papers are used only for private, non-commercial
practice, with credit, and on the condition that this stops if the app becomes commercial; HSC
papers are kept out entirely so students can still sit them cold as a real test. Redrawing
diagrams in code keeps them accurate, accessible and free of scanned third-party artwork.
[DECISION]: the "documented sources" rule is stated as mandatory here. Current units follow it,
but the README does not yet say so.

### VI. Grading Is Fair, Explainable and Degrades Gracefully [PRACTICE + DECISION]

- Short answers earn one mark per rubric point, judged on the substance of the reasoning rather
  than exact wording. Partial credit is allowed.
- The grader MUST return `marksAwarded`, `feedback`, `rubricHits` and `rubricMisses`.
- Any LLM failure (no key, bad key, timeout, unparseable output after one retry) MUST fall back
  to student self-marking (`needsSelfMark`). It MUST NOT show an error or award a wrong mark.
  For photo answers: an unreadable photo or one that does not answer the question prompts a retake
  and is never given 0 marks. A question may be read at most 3 times; after that the student types
  the answer or self-marks. The AI slot is refunded on illegible, not-an-answer, or model failure;
  it is not refunded when the student reads and then leaves without marking.
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
  fails again it MUST be held back and flagged for teacher review. Students then see the
  previously approved version if there is one, otherwise only the one-line description; a failed
  item is never shown.
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
- `VISION_MODEL` follows the same server-only rules as `OPENROUTER_API_KEY`. Photo reads count
  against `LLM_DAILY_CAP` (one slot per question, no separate cap).
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
  now justified for cross-device scores and teacher visibility. `@resvg/resvg-js` is also allowed,
  server-side only, to render generated illustrations for the reviewer (spec 002). Any further
  database, ORM or auth addition, or any state library, requires a written justification in the
  plan. No new dependency is needed for photo answers: native file input, canvas, `FormData`, and
  the existing fetch wrapper are used.
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
  - concept generation enforces its own cap;
  - every question copied from a school paper shows its source (school, year, paper type,
    question number), no real HSC question is included, and no diagram is a scanned image.
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

**Version**: 2.11.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-29

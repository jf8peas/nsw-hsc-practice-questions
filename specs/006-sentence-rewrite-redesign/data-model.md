# Data Model: Sentence Rewrite Question Redesign

Phase 1 output. Every change is additive: existing units, results, phase rows and queries keep
working unchanged. See `research.md` for the decisions behind each shape.

## Display-data types (`lib/grading.ts`)

New optional fields on `RewriteGradeResult` (all display only; a reply without them grades exactly
as today, FR-036):

```ts
/** A credited span: the exact words in the student's sentence the grader credited for one term. */
interface RewriteCreditedSpan {
  conceptId: string;   // the target term's concept id
  span: string;        // validated: found in the sentence (case-insensitive, whitespace-normalised)
}

/** The optional language note for the final sentence (FR-027, FR-034). */
interface RewriteLanguageNote {
  spelling?: Array<{ wrong: string; fix: string }>;  // ≤ 3 pairs, each string ≤ 60 chars
  grammar?: string;                                  // one short note, ≤ 200 chars
}

interface RewriteGradeResult {
  // ...existing fields...
  /** Phase 1 or 2: credited-and-found spans only (FR-031, FR-032). */
  creditedSpans?: RewriteCreditedSpan[];
  /** Phase 2 only: which terms the retry used correctly (FR-033). Display only. */
  phase2TermOutcomes?: Array<{ conceptId: string; correct: boolean }>;
  /** Final phase only (phase 2, or phase 1 at 3/3): the optional language note (FR-034). */
  languageNote?: RewriteLanguageNote;
}
```

The LLM reply shape (documented in `contracts/api.md`) adds `terms[].span` and an optional
`languageNote`; code derives `creditedSpans`, `phase2TermOutcomes` and the validated
`languageNote` (research R3).

## Database schema (`lib/db/schema.ts`)

### New column on `rewrite_phases`

| Column | Type | Notes |
|---|---|---|
| `display_data` | `jsonb`, nullable | `RewriteDisplayData` (below). Null for every existing row; written at phase 1 and extended at phase 2. Display only; never read by `lib/concepts/progress.ts` or the draw. |

```ts
interface RewriteDisplayData {
  phase1: { spanByTerm: Record<string, string> };   // credited spans, found only
  phase2?: { spanByTerm: Record<string, string> };  // credited spans, found only
  phase2TermOutcomes?: Array<{ conceptId: string; correct: boolean }>;  // display only
  languageNote?: RewriteLanguageNote;
}
```

### New table `rewrite_drafts`

One row per question in a writing-practice attempt, created on the first draft save. Deleted with
the student (cascade). Holds the in-progress draft text per phase so a resume on another device
restores what the student had typed (FR-053, FR-054).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `attempt_id` | uuid NOT NULL | FK `(attempt_id, user_id)` → `attempts(id, user_id)` on delete cascade |
| `user_id` | uuid NOT NULL | FK → `users(id)` on delete cascade |
| `unit_id` | text NOT NULL | |
| `question_id` | text NOT NULL | |
| `phase1_draft` | text NOT NULL default '' | the phase 1 box text |
| `phase2_draft` | text NOT NULL default '' | the retry box text |
| `created_at` / `updated_at` | timestamp | |

Constraints: `UNIQUE(attempt_id, question_id)` (one row per question; the route upserts);
index `(user_id, unit_id)`.

### Migration

One new Drizzle migration (`npm run db:generate`):

```sql
ALTER TABLE rewrite_phases ADD COLUMN display_data jsonb;
CREATE TABLE rewrite_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id text NOT NULL,
  question_id text NOT NULL,
  phase1_draft text NOT NULL DEFAULT '',
  phase2_draft text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rewrite_drafts_attempt_owner_fk
    FOREIGN KEY (attempt_id, user_id) REFERENCES attempts(id, user_id) ON DELETE CASCADE,
  CONSTRAINT rewrite_drafts_attempt_question_unique UNIQUE (attempt_id, question_id)
);
CREATE INDEX rewrite_drafts_user_unit_idx ON rewrite_drafts (user_id, unit_id);
```

No backfill: existing rows have `display_data = null` and no draft rows, and grade exactly as
today.

## Draft storage (`lib/drafts.ts` and the server)

- sessionStorage (unchanged helpers, now actually wired): `draft:rewrite:<attemptId>:<questionId>:
  phase1` and `:phase2` are written on every keystroke (same-tab reload safety).
- Server: `rewrite_drafts` is written by `POST /api/rewrite/draft` on blur / page hide /
  visibility change via `sendBeacon` (research R5.2). The grade route clears the relevant draft
  column when the phase is graded (the submitted sentence is already stored as
  `phaseN_answer`) and deletes the row when the question is final (graded or self-marked). The
  route ignores a stale beacon for a phase already graded or an attempt already completed.
- Resume reads both: the quiz page loader joins `rewrite_drafts` and returns `phase1Draft` /
  `phase2Draft` in `rewriteState`; the retry box initialises from `phase2Draft ?? phase1Answer`.

## Phase state machine (five card states + self-mark)

The persisted state machine is unchanged from spec 005 (`rewrite_phases.status`); the card states
are a client projection of it plus the transient marking states:

```
writing (state 1)
  ├─ submit phase 1 → marking first try (state 2, transient)
  │     ├─ grade ok, 3/3 → result (state 5)                    [no phase 2]
  │     ├─ grade ok, <3  → feedback + retry (state 3)
  │     ├─ grade error   → writing (state 1, text kept, FR-011)
  │     └─ needsSelfMark → self-mark screen → save → result (state 5)
  └─ (leave) → resume at writing with the persisted draft

feedback + retry (state 3)
  ├─ submit phase 2 → marking retry (state 4, transient)
  │     ├─ grade ok   → result (state 5)
  │     ├─ grade error → feedback + retry (state 3, text kept)
  │     └─ needsSelfMark → self-mark screen (phase 2) → save → result (state 5)
  └─ (leave) → resume at feedback + retry with phase2Draft ?? phase1Answer

result (state 5) — terminal for the question; persisted as status = 'final'
```

Persisted ↔ shown mapping (research R6): no row → writing; `status = phase1` → feedback + retry;
`status = final` → result; self-mark pending → same-tab sessionStorage `graded` state only.
Marking states (2, 4) are never persisted or restored (FR-038).

## Concept progress (`lib/concepts/progress.ts`)

Unchanged. `conceptProgress` replays `results.concept_outcomes` (phase 1 outcomes, or the
self-mark ticks) exactly as today. The phase 2 outcomes live only in
`rewrite_phases.display_data`, which `progress.ts` and the draw never read — the "phase 2 outcomes
never reach progress" guarantee is structural (research R4).

## Logging (spec 005 FR-044, unchanged)

One line per grading call: `[rewrite] outcome=<outcome> user=<hmac(userId)> question=<questionId>
duration_ms=<ms> model=<model>`. Never a sentence, span, language note, definition, model reply or
marking note. The draft route logs nothing beyond the existing rate-limit counters.
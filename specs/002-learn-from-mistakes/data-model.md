# Data Model: Learn From Mistakes

Three new tables and one new index. Nothing is added to `users`, `attempts` or `results`
(FR-058): concept progress is derived from `results` (research R2), so there is no per-student or
per-attempt field to store. Concept definitions, tags and the readiness markers live in content
files (code), not in the database.

## What stays in code (public content)

| Item | Where | Shape |
|---|---|---|
| Concept | `content/units/<unit-id>/concepts.ts` | `{ id: "<unit-id>.c-<slug>", description: string }` (one line, at most 120 characters) |
| Retired-question tombstones | same file | `retired: Record<questionId, conceptId \| null>` (`null` only in a unit not yet concept-ready) |
| Concept tag | `questions.ts` | `concept?: conceptId` on each public question |
| Readiness markers | `meta.ts` | `conceptsReady?: boolean`, `explanationsComplete?: boolean` |
| Shipped-id snapshot | `content/shipped-ids.json` | `{ questions: string[], concepts: string[] }`: every question and concept id that has shipped; refreshed with `npm run validate:shipped`, which never removes an id |
| Wrong-option explanations | `answers.ts` (server-only) | `wrongExplanations?: Record<optionText, string>` on MC answers |

Rules (enforced by the validator, research R1): concept ids are unique and carry the unit prefix;
ids are never renamed or reused once shipped; a ready unit has every question tagged; an
explanations-complete unit has an explanation for every wrong option; a shipped question id may
disappear only if the unit's `retired` map records it, and a shipped concept id may never
disappear; markers are public metadata and hold no answers.

## Derived, never stored: concept progress

For one student and one unit, replay `results` ordered by `(created_at, id)`:

```
state[concept] starts at count 0, lastMissedAt null
wrong   (marks < max): count = 3, lastMissedAt = answered time
correct (marks = max): count = max(count - 1, 0)
```

The concept of a result is the question's current `concept`, or the `retired` tombstone when the
question no longer exists. A `null` tombstone means the result counts toward no concept. Uncleared means `count > 0`. Sorted by `count` descending, then
`lastMissedAt` descending, then concept id. A concept never missed is never listed.

## Table: `concept_slots`

One row per concept and content kind. It says which version is live, which is the replacement,
and whether a worker is already generating.

| Column | Type | Notes |
|---|---|---|
| `concept_id` | text | Public concept id. Part of the primary key. |
| `kind` | text | `summary` or `illustration`. Part of the primary key. |
| `unit_id` | text | For the teacher page and queries. |
| `live_version_id` | uuid null | The approved version students see. Foreign key to `concept_versions`. |
| `replacement_version_id` | uuid null | At most one pending or failed version. Foreign key to `concept_versions`. |
| `lease_owner` | uuid null | Random id of the worker that holds the lease. |
| `lease_until` | timestamptz null | Lease expiry (5 minutes after the claim). |
| `retry_after` | timestamptz null | Backoff after a failed call (15 minutes). |
| `last_error` | text null | Short machine reason for the last failed call, shown to the teacher only. |
| `last_error_at` | timestamptz null | |
| `created_at`, `updated_at` | timestamptz | |

Constraints:

- Primary key `(concept_id, kind)`; check `kind in ('summary','illustration')`.
- Check `live_version_id is distinct from replacement_version_id`.
- "A live version plus at most one replacement" holds by construction: the row has exactly one
  pointer of each kind.
- Index on `(unit_id)` for the teacher page.

## Table: `concept_versions`

One row per generated version. A version is immutable except for its review fields and status.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, random. |
| `concept_id`, `kind`, `unit_id` | text | Same values as the slot. |
| `status` | text | `pending_review`, `approved` or `failed_review`. "Not generated" is the absence of a version. |
| `origin` | text | `first`, `teacher` or `auto_retry`. |
| `attempt_no` | smallint | 1 for the first generation of a run, 2 for the automatic regeneration. |
| `summary_bullets` | text[] null | Summary only: 3 to 6 bullets, each at most 240 characters. |
| `illustration_brief` | text null | The brief the picture was drawn from. Set on both kinds; on a summary it is the decision to illustrate (null means none needed). |
| `illustration_alt` | text null | Alt text for students. Same rule as the brief. |
| `illustration_svg` | text null | Illustration only: the sanitised SVG. |
| `generator_model` | text | Model that produced this version. |
| `generated_at` | timestamptz | |
| `reviewer_model` | text null | Model that reviewed it (null until reviewed). |
| `reviewer_reason` | text null | At most 1000 characters. May quote model answers or rubrics, so teacher-only. |
| `reviewed_at` | timestamptz null | |
| `approved_by` | text null | `reviewer` or `teacher`. |
| `created_at` | timestamptz | |

Constraints:

- Check `kind in ('summary','illustration')`, `status in (...)`, `origin in (...)`, `attempt_no in (1,2)`.
- Kind shape: a `summary` has `summary_bullets` (3 to 6 items) and no `illustration_svg`; an
  `illustration` has `illustration_svg`, `illustration_brief` and `illustration_alt`.
- `status = 'approved'` requires `approved_by` and `reviewed_at`; `approved_by = 'reviewer'`
  requires `reviewer_model`.
- `status = 'failed_review'` requires `reviewer_reason` and `reviewed_at`.
- Index on `(concept_id, kind)`.

Invariants kept by the code (and tested):

1. A version is only ever *shown* when it is the slot's `live_version_id` **and** `status =
   'approved'`. This is the single read path for students.
2. `live_version_id` is only set by the promotion statement, which sets `status = 'approved'` in
   the same statement (research R9). No other code writes `live_version_id`.
3. A new replacement replaces the previous replacement: the old failed or pending row is deleted
   when the pointer moves, so there is never more than one.
4. A version that failed review twice stays as the slot's replacement with `status =
   'failed_review'` until a teacher regenerates it (a new replacement) or approves it.

## Table: `daily_concept_usage`

| Column | Type | Notes |
|---|---|---|
| `sydney_date` | date | Primary key. The Sydney calendar day, computed in the database like `daily_ai_usage`. |
| `count` | integer | Model calls made that day across all students; check `count >= 0`. |

Global, not per student: the concept cap bounds total spend (constitution VII). Reservation is a
single upsert that increments only while `count < cap`; a call that fails before a model answers
is refunded.

## Index added to an existing table

`results_user_unit_created_idx` on `results (user_id, unit_id, created_at, id)`. It serves the
concept-progress loader (one student, one unit, in answer order). No column changes.

`ResultInsert` gains an optional `createdAt`. Only `POST /api/results/retry` sets it, from the
receipt's issue time, so a result saved late keeps the time it was answered (research R2).

## Relationships

```
users 1──* attempts 1──* results           (unchanged)

concept_slots (concept_id, kind) ──live_version_id────────┐
                                 └─replacement_version_id─┴─> concept_versions
daily_concept_usage                                           (no link to users or results)
```

The concept tables reference no student. Concept ids and question ids are plain text, as in spec
001, because content lives in code.

## Retention and privacy

- `concept_*` and `daily_concept_usage` hold no student id, name, email or answer, so they are
  shared content (constitution II) and are outside the 2-year student retention.
- `reviewer_reason` may quote model answers and rubrics. It is shown only on the teacher page and
  in teacher queries, never in a student response, and never copied into a summary prompt.
- Deleting a student removes their results (cascade), and so their concept progress. Nothing in
  the concept tables changes.
- `tests/db/schema.test.ts` pins that no concept table has a user column.

## State transitions for one version

```
(none) ──generate──> pending_review ──review passes──> approved ──promote──> live
                          │  ▲
         review fails (1st)│  └── retry of a pending review (reviewer was unavailable)
                          ▼
              auto-regenerate once ──> pending_review ──review fails (2nd)──> failed_review
                                                                                 │
                                                  teacher approves in backend ◄──┘──> teacher regenerates
```

A teacher regeneration starts the same machine with `origin = 'teacher'`; the existing live
version stays on show until the replacement is promoted (FR-054).

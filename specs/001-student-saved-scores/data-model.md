# Data Model: Signed-In Students with Saved Scores

Postgres (Neon, `aws-ap-southeast-2`). Schema is defined in `lib/db/schema.ts` (Drizzle) and
shipped as committed SQL migrations in `drizzle/`. Every column below is permitted by
constitution v2.3.0 Principle II; adding any other personal-data column requires amending it.

Unit and question ids are the readable ids from the content files (`y11-formula-test`,
`y11-formula-test.s03`). They are **text, not foreign keys**: content lives in code, and removing
a question must never delete its results (Principle III, FR-023).

## users

| Column | Type | Notes |
|---|---|---|
| id | uuid PK, default `gen_random_uuid()` | internal id; the only identifier in the session JWT |
| google_sub | text NOT NULL UNIQUE | Google account id. Dev login uses `dev:<name>` |
| name | text NOT NULL | refreshed on each sign-in |
| email | text NOT NULL | refreshed on each sign-in; index on `lower(email)` |
| created_at | timestamptz NOT NULL default `now()` | set on insert only |
| last_sign_in_at | timestamptz NOT NULL default `now()` | set in the sign-in callback |
| last_answer_at | timestamptz NULL | `GREATEST(last_answer_at, now())` on each saved result |

No profile photo, no tokens. Deleting a row cascades to everything below.

## attempts

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NOT NULL → users(id) ON DELETE CASCADE | |
| unit_id | text NOT NULL | |
| started_at | timestamptz NOT NULL default `now()` | when created from a receipt (database was unavailable at start), set from the attempt token's issued-at |
| completed_at | timestamptz NULL | set by the server only (R7) |
| question_ids | text[] NOT NULL | the ordered list drawn |
| mc_option_order | jsonb NOT NULL default `{}` | `{ "<questionId>": [origIdx at display 0, 1, ...] }` |

Also `UNIQUE (id, user_id)` so `results` can reference both and never disagree on owner.

Indexes: `(user_id, unit_id, started_at DESC)` for history; partial `(user_id, unit_id)
WHERE completed_at IS NULL` for finding the latest incomplete attempt.

## results

One row per graded answer (FR-006, FR-007).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| attempt_id | uuid NOT NULL | |
| user_id | uuid NOT NULL | with `attempt_id`: FK `(attempt_id, user_id)` → `attempts(id, user_id)` ON DELETE CASCADE; plus FK `user_id` → `users(id)` ON DELETE CASCADE |
| unit_id | text NOT NULL | denormalised for teacher queries |
| question_id | text NOT NULL | |
| answer | text NOT NULL | MC: the chosen option's text. Short: the student's text |
| marks_awarded | smallint NOT NULL | CHECK `0 <= marks_awarded <= max_marks` |
| max_marks | smallint NOT NULL | |
| graded_by | text NOT NULL | CHECK in (`auto`, `llm`, `self`) |
| feedback | text NULL | AI-graded only; as shown to the student |
| rubric_hits | text[] NULL | AI-graded only |
| rubric_misses | text[] NULL | AI-graded only |
| created_at | timestamptz NOT NULL default `now()` | when the student answered: the save time, except a result saved late from a receipt, which uses the receipt's issue time (spec 002) |

Constraint: `UNIQUE (attempt_id, question_id)`, the idempotency key.
Never stored: model answers, rubric text, marking notes, the LLM model name.

Indexes: `(user_id, created_at DESC)` per-user history; `(unit_id, question_id)` class averages
and wrong-option counts; `(attempt_id)` attempt detail; `(unit_id, created_at)` date-filtered unit
ranking; `(user_id, unit_id, created_at, id)` a student's results in one unit in answer order
(added by spec 002 for concept progress).

## daily_ai_usage

| Column | Type | Notes |
|---|---|---|
| user_id | uuid NOT NULL → users(id) ON DELETE CASCADE | |
| sydney_date | date NOT NULL | `(now() AT TIME ZONE 'Australia/Sydney')::date` |
| count | integer NOT NULL default 0 | CHECK `count >= 0` |

Primary key `(user_id, sydney_date)`. Rows older than 7 days are pruned by the retention job.

## State transitions

**Attempt**

```
created (no results) → in progress (>=1 result) → completed (completed_at set)
        \_____________________________/
              abandoned = stays incomplete; latest one per unit is offered for resume
```

- `completed_at` is set only when every drawn question that still exists in content has a result.
  A drawn question later retired is skipped in that test.
- An incomplete attempt is never deleted by the app. Only student deletion removes it.

**Result**: insert-only. No updates, no deletes except by cascade.

**Student**: created on first sign-in; refreshed on each sign-in; deleted by the retention job or
the delete script. After deletion the same Google account creates a new row (new id).

## Derived values (computed, not stored)

| Value | Definition |
|---|---|
| Attempt score / percentage | `sum(marks_awarded) / sum(max_marks)` over the attempt's results |
| Best / latest (unit) | over **completed** attempts only, by completion time (FR-012) |
| Trend (unit) | rule in research R15 |
| Retired question | an id in `attempts.question_ids` or `results.question_id` that is not in current content |
| Last activity | `GREATEST(last_answer_at, last_sign_in_at, created_at)` (Postgres `GREATEST` ignores NULLs) |

## Relationships

```
users 1──* attempts 1──* results
users 1──* results            (same owner as the attempt, enforced by composite FK)
users 1──* daily_ai_usage
```

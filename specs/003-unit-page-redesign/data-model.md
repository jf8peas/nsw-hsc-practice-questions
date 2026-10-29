# Data Model: Unit Page Redesign (spec 003)

**Created**: 2026-10-29 · **Branch**: `003-unit-page-redesign` · **Plan**: [plan.md](plan.md)

## No data-model change

This feature is a **re-layout of existing data only**. There is no schema change, no new table,
column, index or migration, and **no new per-student field** (constitution Principle II). The unit
page reads exactly the same data through the same loaders as before, and concept tracking, quiz
weighting, history queries and the statistics helpers are untouched.

## Consumed shapes (read-only, all unchanged)

| Shape | Source | Fields the page displays |
|---|---|---|
| `Unit` (shared content) | `content/units/*` via `getUnit` | id, title, description, type, created, `isNew`, `conceptsReady`, formulas (tex + name), guide (label + text), concept list (id + one-line description) |
| `Exam` (shared content) | `content/exams.ts` (`examsForUnit`) | id, title, date; the countdown figure is derived (`daysUntil`: "In n days" / "In 1 day" / "Today") |
| `ConceptState` (per student, derived) | `lib/db/queries/concepts.server.ts` (`loadUnitConceptProgress`) | conceptId, count (1–3; a wrong answer sets 3, a correct answer takes 1 away, 0 clears — unchanged); description looked up from the unit's list |
| `ApprovedContent` (shared, approved only) | `lib/db/queries/concepts.server.ts` (`loadConceptContentViewForPage`) | summary bullets; optional illustration (versionId + alt) — shown only as an `<img>` |
| `UnitHistory` / `AttemptSummary` (per student, derived) | `lib/db/queries/history.server.ts` (`loadUnitHistory`) | attempts newest-first: id, startedAt, completedAt, marks, max, answered, total, `percent` = `Math.round(marks/max×100)`; plus `best`/`latest`/`completed` from **completed attempts only** (`lib/stats.ts:bestLatest`) and `resume` |

## Validation and presentation notes

- No new validation rules: concept counts, `completedAt` semantics, `percent` rounding and the
  completed-only Best/Latest rule are exactly as in spec 002.
- The score bar's 0–100 clamp and the `aria-hidden`/visually-hidden presentation are
  presentation-only; they never change stored values.
- No state transitions are introduced. The finished/in-progress distinction is the existing
  `completedAt` null/non-null field.

## Contracts

There is **no API-contract change**: the page consumes the existing internal loaders; no route is
added, removed or altered (the concept ensure/status/illustration routes, the attempts route and
the grading routes are untouched). Per the plan instruction, **no `contracts/` directory is
created** — this feature has no external interface change to document.

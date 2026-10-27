# Specification Quality Checklist: Learn From Mistakes

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-28
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain (none in the text, but the spec has an Open Questions section with the self-marked-answers question for FR-005 still to decide; see Notes)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Updated 2026-10-28 for constitution 2.8.0: the separate retest is replaced by weighted normal quizzes (User Story 4, FR-033 to FR-046, SC-002 and SC-007 reworded, old SC-008 dropped, Retest Attempt entity removed, FR-058 now says no new per-student or per-attempt fields). Functional requirements are now FR-001 to FR-059 and success criteria SC-001 to SC-012, in order.
- Also updated: FR-001 and FR-002 apply to concept-ready units only; Story 5 applies to explanations-complete units only; Concept Content holds a live approved version plus at most one pending or failed replacement for each of the summary and the illustration, with who approved each (FR-018, FR-054, FR-057).
- Earlier changes still in force: independent review step (User Story 7, FR-024 to FR-029), reviewer calls counted in the generation cap (FR-030), teacher approval in the backend (FR-056, FR-057), per-unit readiness (FR-047 to FR-051), partial credit counts as wrong (FR-005).
- Outstanding, for the user to decide before planning: how self-marked answers count for concept tracking (Open Questions: Option A counts like any other answer, Option B only lets a wrong self-mark set the count).
- Known consequence, accepted: weighted quizzes count in averages, best, latest and trend (FR-043), so students with weak concepts will see tougher quizzes affect those figures.
- Defaults chosen instead of clarification markers: half a quiz's places is rounded down; the default generation daily limit is set in planning.
- The "flagged items" query named in FR-056 is not written yet; the SQL file will be updated when the tables exist (planning and tasks).
- Constitution 2.8.0 rules (server-only explanations, own generation cap, `<img>`-only illustrations, derived concept counts, allow-listed teacher page, independent review, bank-only quiz questions, unweighted quiz when the database is down) are reflected as behaviours, not mechanisms.

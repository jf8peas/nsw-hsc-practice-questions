# `/speckit-plan` prompt for spec 003

Paste everything inside the block below into Roo Code as one message.

```text
/speckit-plan

Plan specs/003-unit-page-redesign (spec.md is final; design.md and mockups/ hold the visual detail). Put every size, spacing, colour, radius and font from design.md into the plan so implementation does not have to guess.

Starting point: the reference implementation listed in design.md section 12 is in the working tree and is being kept. Plan from it, not from scratch. First audit it against every FR and acceptance scenario in spec.md and record in research.md, requirement by requirement, what already meets the spec and what does not. Known gaps to plan for:

1. FR-003 / US1 scenario 3a: components/ClampedText.tsx currently shows "Show more" on every phone, even when the description fits in 4 lines. It must show the button only when the text is actually cut off, and re-check on resize and rotation. Keep it a small client component with no new dependency (e.g. compare scrollHeight with clientHeight in a ResizeObserver). The server-rendered HTML must still contain the full description, and the page must look right before JavaScript runs (no layout jump that moves Start quiz).
2. Tests for behaviour the reference implementation added but nothing tests yet: the Your results notes (up, down, same, "first result", none completed, "{n} in progress", "none completed yet"); "Attempt {k}" numbering with the oldest as 1, including an unfinished attempt in the middle; the bar clamped to 0–100 while the text shows the real figures; the pips filled 3 − count with the "{count} more correct answer(s) needed" sentence for screen readers; the "All clear" and "No attempts yet." empty states; Past attempts absent with no attempts and when the database is down; the shared heading on Formulas and the guide; one h1 and every section labelled by its h2; ClampedText's button state and aria-expanded.
3. Keep the existing page-order test (Start → Concepts to review → results/history) and the degrade-test change described in FR-018.

Constraints:
- Constitution 2.10.0. In particular: Principle VI (degrade gracefully), Principle VIII (simplicity, no new dependencies, mobile-first with Start quiz above reference material), and design tokens only from styles/tokens.css and the existing variables in app/globals.css (no new colours).
- No change to data loading, queries, concept tracking, weighting, the home page, /progress, attempt detail or quiz pages. State in the plan that there is no data-model or API contract change; do not create empty contracts.
- Server components stay server components; only ClampedText (and the existing ConceptLive and StartQuiz) are client code.
- CSS stays in app/globals.css under the "Unit page layout" block; leave the old .stat-grid, .attempt-row and .eyebrow rules alone because /progress and other pages still use them.

quickstart.md should give a manual check at 390 px and 900 px against the three mockups: no sideways scrolling, a short description with no "Show more", a long one with it, the concept rows with pips under the text at 480 px and below, the exam date never split, and the database-down view. Include running the full suite, lint, type check and build through Git Bash as CLAUDE.md describes (the two teacher-queries tests need docs/teacher-queries.sql).
```

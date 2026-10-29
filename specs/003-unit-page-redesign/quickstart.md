# Quickstart: Unit Page Redesign (spec 003)

**Created**: 2026-10-29 · **Branch**: `003-unit-page-redesign` · **Plan**: [plan.md](plan.md)

This guide proves the feature works end to end: a manual pass at 390 px and 900 px against the
three mockups, then the automated quality gates. Requirements are in [spec.md](spec.md); the
visual details are pinned in [design.md](design.md) and the implementation plan.

## Prerequisites

- Node 24 and npm (run through Git Bash, see below), `npm install` done.
- A runnable app: `npm run dev` with a local or branch database and the documented dev-login in
  `.env.local` (per README), or a Preview deployment with its own non-production database.
- A signed-in student with practice data (come attempts, and — on a concept-ready unit — a couple
  of missed questions so concepts appear).

## Manual checks

Use the browser's responsive mode at exactly **390 px** and **900 px**. Compare each check against
the mockups in `specs/003-unit-page-redesign/mockups/`:

| Mockup | Width | Shows |
|---|---|---|
| `desktop-full.png` | 900 px | five concepts (one opened), three attempts |
| `phone-full.png` | 390 px | same data, description shortened |
| `phone-new-student.png` | 390 px | no concepts and no attempts |

### At 390 px (phone)

1. **No sideways scrolling** — the page scrolls vertically only; nothing extends beyond the
   390 px viewport (check the results card, the past-attempt rows with their bars, and the exam
   date especially).
2. **Short description** — a description that fits in 4 lines shows in full with **no "Show
   more"** button.
3. **Long description** — a longer one is cut to exactly 4 lines with an ellipsis and a "Show
   more" button; tapping expands to the full text ("Show less"), tapping again collapses; on
   **resize or rotation** the button appears/disappears to match; after a reload the full text is
   still in the page.
4. **Concept rows at ≤ 480 px** — the description takes its own full row and the pips sit on the
   line below, left-aligned, for **every** row; "{count} to go" and the "n to review" pill render.
5. **Exam date never split** — the date stays on one line; on narrow screens it moves to its own
   line as a whole.
6. **Database-down view** — with the database unreachable (stop the local DB / mispoint
   `DATABASE_URL` on a dev-only run), the page still loads: Start quiz works, "Concepts to
   review" shows "We could not load your weak concepts right now.", "Your results" shows the
   history-unavailable notice, and there is no "Past attempts".

### At 900 px (desktop)

7. The full description is shown with no "Show more" button.
8. The four sections appear in order (Introduction → Concepts to review → Your results → Past
   attempts) with the shared heading style, then Formulas in this test and the unit guide using
   the same headings.
9. Each concept row shows its pips after the description; an approved concept opens with a
   visible chevron.
10. The results card has three equal columns with the notes; past-attempt rows show "Attempt k",
    the start time, the score bar, the percent and marks/max, and open the attempt detail page on
    click.

## Automated quality gates (Git Bash)

CLAUDE.md's standing preference is that all shell commands run through **Git Bash**. Browsers
and agents whose shell spawns PowerShell wrap the payload with the full Git Bash path:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' -c 'cd /c/Users/johnf/Git/nsw-hsc-practice-questions && <command>'
```

Run from the repo root (`cd /c/Users/johnf/Git/nsw-hsc-practice-questions`):

```bash
npm test                 # full Vitest suite
npm run lint             # ESLint (next lint)
npx tsc --noEmit         # type check
npm run build            # next build (prebuild runs gen:formulas + validate)
```

Expected outcomes:

- The full test suite passes — including the updated `tests/pages/unit-concepts.test.ts` (heading
  "Concepts to review" and the page-order test), `tests/api/concepts-degrade.test.ts` (the
  wording check ignores the section's own heading, pill and pill class while still catching real
  reviewer status, error or generation text), `tests/pages/unit-page.test.ts` and
  `tests/client/clamped-text.test.tsx` (new in this feature), and the untouched
  `tests/pages/pages-outage.test.ts` and `tests/pages/history.test.ts`.
- **Known exception**: two tests read `docs/teacher-queries.sql` and fail when that file is
  absent. That file is not part of this feature (see design.md §12); ignore those two failures on
  a checkout that lacks it.
- `lint`, `tsc --noEmit` and `build` are clean.

## Where everything is

- [spec.md](spec.md) — requirements (final).
- [design.md](design.md) — visual and wording reference (final).
- [research.md](research.md) — the audit of the reference implementation and the decisions.
- [plan.md](plan.md) — the implementation plan, including every size, spacing, colour, radius and
  font from design.md.
- [data-model.md](data-model.md) — confirmation that there is no data-model or API-contract
  change.

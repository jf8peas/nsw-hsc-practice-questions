# Archived essays: y12-economics-paragraph-writing

Archived on 17 Nov 2026, when the live bank changed to China and Nepal (the student's chosen
emerging and developing economies for Assessment Task 1).

| Essay | Economy | Strategy |
| --- | --- | --- |
| e01 | Vietnam (emerging) | Trade liberalisation and FDI under Doi Moi |
| e02 | Bangladesh (developing) | Export-oriented ready-made garment industry |

`essays-archived.ts` holds both essays exactly as they were: the question headers from
`questions.ts` and the full keys from `essays.ts`. Nothing in the app imports it, so these essays
are not served or validated. The one exception is `scripts/paragraph-field-cases.ts`, which looks
here so that a flagged answer to an archived essay can still be exported for marker review.

Their 10 question ids are tombstoned in `content/units/y12-economics-paragraph-writing/concepts.ts`
(`retired`). The content validator requires this, because shipped ids may never just disappear.
Students' saved results for these essays stay in the database and still show in their history.

## Bringing an essay back

1. Move its header back into `ESSAYS` in `questions.ts` and its key back into `essays` in
   `essays.ts`. Keep its original id (`e01` or `e02`): ids are never renumbered. Bank order is the
   order students meet essays, so place it where it should come.
2. Remove its five ids from `retired` in `concepts.ts`.
3. Re-verify every figure against its source and update `figuresVerified`.
4. Run `npm run validate` and `npm test`.

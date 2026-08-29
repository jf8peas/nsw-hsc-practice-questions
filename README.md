# Physics Practice

HSC Physics practice quizzes — short answer and multiple choice, with an LLM
grading short answers against a rubric. Next.js (App Router) on Vercel.

- **No accounts.** Scores are kept per-browser in `localStorage`.
- **Content lives in the repo.** Questions are typed TS files, version-controlled,
  reviewed in PRs, deployed atomically with the code.
- **The answer key never reaches the browser.** All grading happens server-side.

## Running locally

```bash
npm install
npm run dev            # http://localhost:3000
npm run validate       # check content is well-formed (also runs before build)
npm run build
```

## How it's put together

| Path | What |
| --- | --- |
| `app/page.tsx` | Home — units grouped by year → topic, plus upcoming exams |
| `app/unit/[unitId]/page.tsx` | Unit overview + per-browser stats + "Start quiz" |
| `app/unit/[unitId]/quiz/page.tsx` | Quiz runner (`components/Quiz.tsx`, client) |
| `app/api/grade/route.ts` | The only server endpoint — grades one answer |
| `lib/grading.server.ts` | Server-only grading logic (touches the answer key) |
| `lib/scores.ts` | `localStorage` score history |
| `styles/tokens.css` | Design tokens, copied unchanged from `design/v001` |

### The grade endpoint

`POST /api/grade` with `{ questionId, answer }` (for MC, `answer` is the option
index as a string). It returns marks for MC immediately. For short answers it
currently returns the model answer + rubric and the student self-marks; step 3
below swaps that for an LLM call. The browser never holds the API key or the
full answer key.

`GET /api/grade` returns `{ gate, unlocked }` so the client can tell up-front
whether short answers will ask for a class code.

### Access gate

The **short-answer** path (the one that will cost OpenRouter credits) can be put
behind a shared class code. MC grading is never gated.

| `CLASS_CODE` | `SKIP_CLASS_CODE` | Behaviour |
| --- | --- | --- |
| unset | — | Open — no code needed |
| set | unset / `false` | Student enters the code once (`POST /api/unlock`), stored in an httpOnly cookie for 180 days |
| set | `true` / `1` | **Open again** — code bypassed, the switch to flip in Vercel when you want it off |

Rotating `CLASS_CODE` invalidates every issued cookie (the cookie value is an
HMAC of the code). Logic lives in `lib/gate.server.ts`.

## Content structure

One folder per unit. **The unit id, the folder name, and every question id
prefix must match.**

```
content/
  units/
    y11-formula-test/
      meta.ts        # PUBLIC  — id, year, topic, type, title, description, order
      questions.ts   # PUBLIC  — prompt, formula, MC option text, maxMarks
      answers.ts     # KEY     — correctIndex / modelAnswer / rubric / notes
  index.ts           # PUBLIC registry — the only file that imports every unit
  answers/index.ts   # `import "server-only"` registry of answer keys
  exams.ts           # upcoming exams, referencing unit ids
```

- `content/index.ts` is safe to import anywhere (client included). It has **no
  answer keys**.
- `content/answers/index.ts` has `import "server-only"` at the top — the build
  fails if anything client-side pulls it in. Only `lib/grading.server.ts` uses it.
- Question ids are namespaced: `y11-formula-test.q3`. The grade endpoint finds
  the answer from the id alone, so the client only ever sends `{ questionId,
  answer }`.

### Adding a unit

1. `mkdir content/units/<unit-id>` and add `meta.ts`, `questions.ts`,
   `answers.ts` (copy an existing unit as a template).
2. Give every question an id of the form `<unit-id>.<n>`.
3. Register it in **two** places:
   - `content/index.ts` — import its `meta` + `questions`, add to `UNITS`.
   - `content/answers/index.ts` — import its `answers`, spread into `ALL_ANSWERS`.
4. `npm run validate` — checks id namespacing, uniqueness, that every question
   has a matching answer key, MC `correctIndex` in range, short answers have a
   model answer, rubrics are non-empty, and exams reference real units.

Never renumber a shipped question id — saved `localStorage` history and any
bookmarked URLs depend on it. Append new ids instead.

### Adding an exam

Add an entry to `EXAMS` in `content/exams.ts` with an ISO `date` and the
`unitIds` it covers. Past exams drop off automatically.

## Deploying to Vercel

Import the repo in Vercel — framework auto-detects as Next.js, no config needed.

**Secrets** (needed from step 3 on) go in Vercel → Project → Settings →
Environment Variables, for Preview + Production:

| Var | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | short-answer grading via OpenRouter (step 3) |
| `GRADING_MODEL` | model slug, e.g. `deepseek/deepseek-chat` (step 3) |
| `CLASS_CODE` | shared code students enter to unlock short-answer grading. Unset = no gate |
| `SKIP_CLASS_CODE` | `true` to bypass `CLASS_CODE` — grading open to anyone |

Locally, copy `.env.example` to `.env.local`. `.env.local` is gitignored — never
commit a real key. Nothing prefixed `NEXT_PUBLIC_`; keys are read only in
`app/api/grade/route.ts` / `lib/*.server.ts`.

## Roadmap

1. ✅ Full flow — home / unit / quiz / results, MC graded server-side, short
   answers self-marked, scores in `localStorage`.
2. ✅ Answer key is server-only; `/api/grade` live.
3. ✅ Access gate — `CLASS_CODE` / `SKIP_CLASS_CODE`, `/api/unlock`, cookie.
4. **LLM short-answer grading.** In `lib/grading.server.ts`, replace the `short`
   branch with an OpenRouter call: send question + model answer + rubric + marks
   + student answer, ask for strict JSON `{ marksAwarded, feedback, rubricHits,
   rubricMisses }`, parse defensively (retry once, then fall back to self-mark).
5. **Rate limit.** Per-IP limit on the short-answer path (Upstash) as a backstop
   even with the gate on. Answer length already capped at 2000 chars.
6. **Polish.** KaTeX formula rendering (store LaTeX in content, render in
   `components/Formula.tsx`), richer exam countdowns.

## Notes

- `npm audit` flags a high-severity `postcss` advisory pulled in transitively by
  Next 15's build tooling. It's build-time only and not in the request path;
  clearing it means moving to Next 16. Revisit deliberately.
- `design/v001/` is the original Claude Design canvas prototype, kept for
  reference. `styles/tokens.css` is copied from it.

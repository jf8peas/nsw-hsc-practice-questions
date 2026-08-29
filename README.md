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
index as a string).

- **MC** — marked instantly against the answer key, server-side.
- **Short answer** — sent to the LLM grader (`lib/openrouter.server.ts`) when
  `OPENROUTER_API_KEY` is set: it returns `marksAwarded` (partial credit),
  written `feedback`, and `rubricHits` / `rubricMisses`. On any failure (no key,
  bad key, timeout, unparseable JSON — retried once) it returns `needsSelfMark`
  and the client falls back to the student self-marking against the model answer.

The browser never holds the API key or the full answer key.

`GET /api/grade` returns `{ gate, unlocked }` so the client can tell up-front
whether short answers will ask for a class code.

### Access gate + rate limit

The **short-answer** path (the one that costs OpenRouter credits) sits behind a
shared class code **and** a per-IP rate limit. MC grading is never gated or
limited.

Rate limit: `GRADE_RATE_LIMIT` submissions per IP per minute (default 30). Uses
Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set;
otherwise a per-instance in-memory window (`lib/ratelimit.server.ts`). Over the
limit → `429` with `retryAfter`.

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
- Question ids are namespaced: `y11-formula-test.s03` / `.m12`. The grade
  endpoint finds the answer from the id alone, so the client only ever sends
  `{ questionId, answer }`.
- MC option order in `questions.ts` is scrambled deterministically by id
  (`lib/shuffle.ts`), and the answer key stores the correct option's **text**
  (`correctText`), not its index — so the public bundle never reveals a
  "correct option is first" pattern.
- If `meta.quiz` is set (`{ short, mc, passMark }`), each attempt draws that many
  of each type at random from the bank. `y11-formula-test` has 50 + 50, so a
  student gets 10 non-repeating attempts.
- `meta.formulas` is the list shown on the unit page (below Start quiz, so mobile
  users can go straight to the quiz).

### Where the questions came from

`docs/y11-formula-test-research.md` records which formulas are in scope (the
teacher's crossings-out on the NESA formulae sheet) and the MC scenario bank
mined from the past papers in `resources/y11_year_end_exam/` (gitignored).

### Adding a unit

1. `mkdir content/units/<unit-id>` and add `meta.ts`, `questions.ts`,
   `answers.ts` (copy an existing unit as a template).
2. Give every question an id of the form `<unit-id>.<n>`.
3. Register it in **two** places:
   - `content/index.ts` — import its `meta` + `questions`, add to `UNITS`.
   - `content/answers/index.ts` — import its `answers`, spread into `ALL_ANSWERS`.
4. `npm run validate` — checks id namespacing, uniqueness, that every question
   has a matching answer key, MC `correctText` is one of the options, short
   answers have a model answer, `short` rubrics have one point per mark, and
   exams reference real units.

Never renumber a shipped question id — saved `localStorage` history and any
bookmarked URLs depend on it. Append new ids instead.

### Adding an exam

Add an entry to `EXAMS` in `content/exams.ts` with an ISO `date` and the
`unitIds` it covers. Past exams drop off automatically.

## Deploying to Vercel

Import the repo in Vercel — framework auto-detects as Next.js, no config needed.

**Env vars** go in Vercel → Project → Settings → Environment Variables, for
Preview + Production. Everything is optional — the app runs with none set
(short answers just self-mark, no gate, in-memory rate limit).

| Var | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | turns on LLM short-answer grading |
| `GRADING_MODEL` | model slug, default `deepseek/deepseek-chat` |
| `SITE_URL` | sent to OpenRouter as `HTTP-Referer` |
| `CLASS_CODE` | shared code students enter to unlock short-answer grading. Unset = no gate |
| `SKIP_CLASS_CODE` | `true` to bypass `CLASS_CODE` — grading open to anyone |
| `GRADE_RATE_LIMIT` | short-answer submissions per IP per minute (default 30) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | distributed rate limiting; falls back to in-memory |

Locally, copy `.env.example` to `.env.local`. `.env.local` is gitignored — never
commit a real key. Nothing prefixed `NEXT_PUBLIC_`; keys are read only in
`app/api/**` and `lib/*.server.ts`.

## Roadmap

1. ✅ Full flow — home / unit / quiz / results, scores in `localStorage`.
2. ✅ Answer key is server-only; `/api/grade` live.
3. ✅ Access gate — `CLASS_CODE` / `SKIP_CLASS_CODE`, `/api/unlock`, cookie.
4. ✅ LLM short-answer grading via OpenRouter, with self-mark fallback.
5. ✅ Per-IP rate limit on the short-answer path (Upstash or in-memory).
6. ✅ KaTeX formula rendering — LaTeX in `content/formulas.ts`, pre-rendered to
   HTML at build time (`scripts/gen-formula-html.ts`) so KaTeX stays out of the
   client bundle.

Possible next: more units; OCR the 3 scanned exam papers; a bigger MC bank;
re-weight short vs MC marks (currently 3:1).

## Notes

- `npm audit` flags a high-severity `postcss` advisory pulled in transitively by
  Next 15's build tooling. It's build-time only and not in the request path;
  clearing it means moving to Next 16. Revisit deliberately.
- `content/formulas.generated.ts` is generated — `npm run gen:formulas` (also
  runs in `prebuild`). Committed so `next dev` works without a build step.
- `design/v001/` is the original Claude Design canvas prototype, kept for
  reference. `styles/tokens.css` is copied from it.

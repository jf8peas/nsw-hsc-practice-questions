# Quickstart: Signed-In Students with Saved Scores

How to run the feature locally and how to verify it end to end. Setup steps for production are
included because they gate launch.

## Local development

1. `npm install`
2. Create a Neon project in **AWS ap-southeast-2 (Sydney)**, or a Neon dev branch. Copy its
   connection string.
3. Copy `.env.example` to `.env.local` and set:

   ```
   DATABASE_URL=postgres://…neon.tech/…?sslmode=require
   AUTH_SECRET=<run: npx auth secret>
   # Google is optional locally; the dev login is used instead
   OPENROUTER_API_KEY=            # optional; without it short answers self-mark
   LLM_DAILY_CAP=40
   ```
4. `npm run db:migrate` to create the tables.
5. `npm run dev`, open http://localhost:3000, and use **Dev login** (shown only when
   `NODE_ENV !== "production"`). Sign in as two different names to check that history is separate.

## Checks

- **Tests, build, lint**: `npm test`, `npm run build`, `npm run lint` all pass.
- **Cross-device (SC-001)**: finish an attempt as `alice`, sign out, open a private window, sign
  in as `alice` again. The unit page and `/progress` show the same attempt.
- **Own results only (SC-002)**: as `bob`, open `/attempts/<alice's attempt id>`. Expect the
  not-found page. The same id sent to `/api/grade` returns 404.
- **Resume (FR-032)**: start a quiz, answer two questions, close the tab. Open the unit page:
  "Continue attempt" resumes at question 3 with the same questions.
- **Save failure (FR-008/009)**: set `DATABASE_URL` to an unreachable host, restart, answer a
  question. The mark appears immediately; the outbox in `localStorage` (`outbox:<uid>`) holds a
  receipt. Restore the URL; within the next retry the result appears in the database.
- **Database down (SC-004, Principle VI)**: set `DATABASE_URL` to an unreachable host and restart the server. Open a unit: the history section says "History is temporarily unavailable…" and Start quiz works. Answer an MC question (marked, shown) and a short question (AI marking unavailable, self-mark). Open `/progress`: same notice, no error. Restore the URL: the outbox creates the attempt and saves each result exactly once (check the database for one attempt row and one row per answer). Then delete the user row and let the outbox retry: the receipts are discarded with no "result lost" notice. With the database up, deleting the user row makes `/api/grade` return 401.
- **Session expiry mid-quiz (FR-028)**: type half an answer, delete the session cookie, submit. Expect "Your session has ended. Sign in to continue."; after signing in you return to the same attempt with your typed answer restored.
- **Two devices (edge case)**: open the same attempt in two tabs and answer the same question in both. The second shows the stored mark from the first and moves on.
- **Daily cap (SC-006)**: set `LLM_DAILY_CAP=2`, answer three short questions with an LLM key
  configured. The third shows the self-mark message with the midnight Sydney time.
- **Fail closed (SC-010)**: `NODE_ENV=production npx next start` with `AUTH_SECRET` unset serves
  `503` for every page.
- **Retention**: `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/retention`.
- **Delete a student**: `npm run delete-student -- alice@example.com`, type the email to confirm.
- **Teacher queries**: open `docs/teacher-queries.sql`, paste a query into the Neon SQL console,
  edit the `params` CTE at the top.

## Production and preview setup

1. **Neon** (via the Vercel Marketplace integration): create the project in `aws-ap-southeast-2`.
   Confirm the region in the Neon console. Enable "branch per preview" only if the preview branch's
   parent is an **empty, schema-only** branch, never the production branch.
2. **Google Cloud**: create an OAuth client. Authorised redirect URIs:
   `https://<prod-domain>/api/auth/callback/google` and
   `https://<preview-alias>/api/auth/callback/google`.
3. **Vercel environment variables** (Production and Preview separately, Preview using a different
   `AUTH_SECRET` and database): `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`,
   `DATABASE_URL`, `CRON_SECRET`, `OPENROUTER_API_KEY`, `LLM_DAILY_CAP`, optional
   `GRADE_RATE_LIMIT`, `GRADE_IP_RATE_LIMIT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   (create the Upstash database in `ap-southeast-2`; its keys hold student ids and IP addresses).
4. **Vercel project**: build command is picked up from the `vercel-build` script (migrates, then
   builds). `vercel.json` sets the function region to `syd1` and the weekly cron.
5. **Before launch** (Principle II, not code): school approval / consent for holding students'
   name, email and results, including the disclosure that students' typed answers go to a
   third-party AI service; and a named person who runs `npm run delete-student` on request.
6. Remove `CLASS_CODE` and `SKIP_CLASS_CODE` from Vercel; they are no longer read.

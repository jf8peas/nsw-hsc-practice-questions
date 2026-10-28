# Signed Tokens

Three stateless tokens let the server hand the browser a verifiable claim without storing anything
(constitution Principle II limits other server-side state to rate-limit and cap counters, plus, as amended for spec 002,
shared concept content and its generation bookkeeping, none of it about any student).

## Format

```
token = base64url(JSON payload) + "." + base64url(HMAC-SHA256(key, base64url(JSON payload)))
```

- Key: `HKDF-SHA256(AUTH_SECRET, info = "receipt" | "selfmark" | "attempt")`, so the two token kinds and the
  Auth.js session cannot be substituted for one another.
- Verification uses `crypto.timingSafeEqual`, checks `v === 1`, `exp > now`, and then the
  payload-specific rules below. Any failure is `invalid_receipt` / `invalid_token`.
- Implemented in `lib/tokens.server.ts`, which is the only module that touches the key.

## Result receipt (`receipt`)

Issued by `/api/grade` or `/api/results/self-mark` only when the database save failed or timed out, or the database was unavailable (research R19).

```ts
{
  v: 1,
  uid: string,           // must equal the session user
  attemptId: string,
  attempt: {             // copied from the attempt token so a retry can create a missing attempt row
    unitId: string,
    questionIds: string[],
    mcOptionOrder: Record<string, number[]>,
    issuedAt: number
  },
  questionId: string,
  answer: string,
  marks: number,
  max: number,
  gradedBy: "auto" | "llm" | "self",
  feedback: string | null,
  hits: string[] | null,
  misses: string[] | null,
  iat: number, exp: number   // seconds; exp = iat + 7 days
}
```

`iat` is also **when the student answered**. Spec 002 stores it as the result's `created_at` when a
receipt is saved late (`POST /api/results/retry`), so concept progress replays results in the order
they were answered, not the order they reached the database.

Replay is harmless: the insert is `ON CONFLICT (attempt_id, question_id) DO NOTHING`.
Contains only the student's own answer and the feedback they were shown, never the answer key.

## Attempt token (`attemptToken`)

Issued by `POST /api/attempts` and by the quiz page. Sent with every `/api/grade` request.

```ts
{
  v: 1,
  uid: string,
  attemptId: string,         // UUID generated on the server
  unitId: string,
  questionIds: string[],                 // the ordered list drawn
  mcOptionOrder: Record<string, number[]>, // questionId -> optionOrder[displayIndex] = originalIndex
  iat: number, exp: number               // exp = iat + 24 hours
}
```

It lets `/api/grade` check ownership, membership and option order without a database read
(research R19). It holds no answer key. An expired or mismatched token returns
`400 invalid_attempt_token`. Grading is possible from the session JWT plus this token alone.

## Self-mark token (`selfMarkToken` / `token`)

Issued by `/api/grade` whenever the result has `needsSelfMark: true` (LLM unavailable, failed, not
configured, or the daily cap reached).

```ts
{
  v: 1,
  uid: string,
  attemptId: string,
  questionId: string,
  answerHash: string,    // hex SHA-256 of the exact answer text
  iat: number, exp: number   // exp = iat + 2 hours
}
```

It proves the grader asked for a self-mark for this user, attempt, question and answer, so a
client cannot self-mark a question it never submitted.

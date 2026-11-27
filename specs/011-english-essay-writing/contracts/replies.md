# Model reply formats (spec 011)

Both model replies are JSON only. The parser takes the first `{…}` block. A failed call, empty/cut-off reply, malformed reply or key-echo failure is retried once within the time budget, then becomes `marker_unavailable` or `reviewer_unavailable`. The marker prompt is `lib/english-essay/rubric.json` (`eng-essay-pilot-5`); the reviewer prompt is `lib/english-essay/review.json` (`eng-essay-review-1`) [S2]. They have independent model settings and versions.

## 1. Marker reply (`eng-essay-pilot-5`) [S1]

```json
{
  "criteria": {
    "argument":   { "reason": "<one or two sentences>", "verdict": "strong|sound|developing|weak" },
    "analysis":   { "reason": "…", "verdict": "…" },
    "knowledge":  { "reason": "…", "verdict": "…" },
    "expression": { "reason": "…", "verdict": "…" }
  },
  "questionFocus": "fully|partly|barely",
  "questionFocusReason": "<one sentence naming the question terms engaged or missed>",
  "knowledgeErrors": [
    { "quote": "<the student's words, exactly>", "why": "<the distinct underlying mistake, one sentence>" }
  ],
  "band": 2,
  "mark": 14,
  "bandReason": "<two sentences naming the descriptor words that decided the band>",
  "liftYourMark": ["<most valuable change, to the student>", "<second>"],
  "gaps": [
    { "concept": "<id from the unit concept list>", "detail": "<what was wrong, missing or only named, one sentence>" }
  ],
  "conceptsUsedWell": ["<id from the unit concept list>"]
}
```

Use `[]` for no knowledge errors, gaps or used-well concepts. The model is instructed to list each distinct underlying mistake once and not to lower criterion verdicts independently for those errors.

### Validation (`parseEnglishEssayReply`)

| Field | Rule | Failure handling |
|---|---|---|
| `criteria.<four ids>.verdict` | all four present and in `strong, sound, developing, weak` | whole reply fails; never a default |
| `criteria.<id>.reason` | string, limited to 1200 chars; missing becomes `""` | — |
| `band` | integer 1–5 | whole reply fails |
| `mark` | integer 0–20; clamped into the selected band later | whole reply fails |
| `questionFocus` | `fully`, `partly` or `barely` | whole reply fails |
| `questionFocusReason` | non-empty string, limited to 1200 chars | whole reply fails |
| `bandReason` | non-empty string, limited to 1500 chars | whole reply fails |
| `liftYourMark` | string or array; at least one non-empty item after sanitising; first two kept, each ≤800 chars | whole reply fails if none |
| `knowledgeErrors` | required array; `why` non-empty ≤600 chars; `quote` must occur in the essay after normalisation | invalid items dropped; deduplicated per data-model §7.1 |
| `gaps` | required array; concept on the unit list, deduped, ≤5 in marker order; detail ≤600 chars | off-list items dropped |
| `conceptsUsedWell` | required array of on-list ids, ≤8, minus any id also in gaps | off-list items dropped |
| key echo | a 60+ character run of marking notes or Away text notes in student-facing strings, not also in question/essay | whole reply fails and is retried |

Student-facing strings are trimmed and scrubbed of references to hidden notes. The length limits guard against a runaway reply: text over its limit is cut back to the last whole sentence, or, where that would drop more than half the allowance, to the last whole word followed by "…" (`trimToLimit`, `lib/trim.ts`). Unknown keys are ignored and never stored.

### Deterministic post-processing

1. Run the quote check and append unique not-found quotations as knowledge errors, deduplicating marker/quote overlap as [data-model.md](../data-model.md) §7.1 specifies.
2. Clamp raw mark into the selected band.
3. Deduct one per deduplicated error, maximum two.
4. Cap at 16 for two or more errors.
5. Cap at 12 for `partly`, 10 for `barely`.
6. Enforce minimum 1 and derive `finalBand` from the final mark.

Store raw/final marks, marker/final bands, focus/reason, knowledge errors, all quote results, reference hash, gaps, used-well ids, prompt version and model. The public result omits raw mark and marker-selected band.

### Call settings

`ENGLISH_ESSAY_GRADING_MODEL`, default `openai/gpt-6.2-sol`; temperature 0; JSON mode; `max_tokens` 8000; first call 60 s; total budget 115 s; retry only with ≥12 s remaining; route `maxDuration` 120 s; lease 130 s. No fallback to `ENGLISH_ESSAY_REVIEW_MODEL`, `ESSAY_GRADING_MODEL`, `ESSAY_REVIEW_MODEL`, `ENGLISH_ADV_GRADING_MODEL` or `GRADING_MODEL`.

## 2. Reviewer reply (`eng-essay-review-1`) [S2]

```json
{
  "checks": [
    { "id": "thesis",      "status": "strength|fix", "line": "<one short line>" },
    { "id": "claims",      "status": "…", "line": "…" },
    { "id": "development", "status": "…", "line": "…" },
    { "id": "evidence",    "status": "…", "line": "…" },
    { "id": "fit",         "status": "…", "line": "…" }
  ]
}
```

The five checks are: thesis answers the question and takes a position; claims are ideas about human experience; claims build rather than restate the thesis; evidence ranges across the play and its forms; the plan fits 45 minutes and 800–1,200 words.

### Validation (`parseEnglishReviewReply`)

- Exactly the five ids once each; output is re-sorted to the order above.
- `status` is `strength` or `fix`; `line` is non-empty and at most 240 characters.
- **Every `fix` line contains `?`**, the checkable proxy for a question/prompt rather than supplied writing. Otherwise the whole reply is malformed and retried.
- Unknown keys such as `mark`, `band`, `rewrittenPlan`, `sampleThesis` or `modelEssay` are ignored and never stored.
- No figure flags, mark, band or replacement writing is part of the stored shape.

### Call settings

`ENGLISH_ESSAY_REVIEW_MODEL`, independently defaulting to `openai/gpt-6.2-sol`; temperature 0; JSON mode; `max_tokens` 1500; first call 25 s; total budget 45 s; retry only with ≥10 s remaining; route `maxDuration` 60 s. One daily slot is reserved and refunded on failure. The reviewer receives only the public question, directive meaning and plan, never notes, model essay, pilot essays or play text.

`ENGLISH_ESSAY_REVIEW_LIVE` starts false. It changes only after all seven pilot scaffolds collectively show both outcomes for every check, every planted weakness is flagged as a fix, every output has five valid question-style lines with no supplied writing or mark, and Chiang approves every output.

## 3. Prompt and concept drift

The Python marker and TypeScript marker render the same `rubric.json` through the same single-pass substitutions. `--write-golden` writes a synthetic-notes golden fixture used by both. A separate fixture stores the prompt version and SHA-256 of the canonical rubric plus concept record. Any prompt or concept edit without a new `promptVersion` fails the drift test and blocks release; any such edit also requires a fresh one-sided pilot pass.

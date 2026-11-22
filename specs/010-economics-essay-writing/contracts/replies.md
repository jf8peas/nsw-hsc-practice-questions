# Model reply formats (spec 010)

Both replies are JSON only; the parser takes the first `{…}` block, as `scripts/pilot-essay-marker.py` and `lib/unseen/marker.server.ts` do. A failed parse is retried once (inside the time budget), then the call is "unavailable" and the student sees the not-marked or not-reviewed path. The prompt text lives in `lib/essay/rubric.json` (marker) and `lib/essay/review.json` (reviewer), each with its own `promptVersion`.

## 1. Marker reply (`lib/essay/rubric.json`, `promptVersion` essay-pilot-2 and later) [S1]

```json
{
  "criteria": {
    "understanding": { "reason": "<one or two sentences>", "verdict": "strong|sound|developing|weak" },
    "theory":        { "reason": "…", "verdict": "…" },
    "assessment":    { "reason": "…", "verdict": "…" },
    "data":          { "reason": "…", "verdict": "…" },
    "structure":     { "reason": "…", "verdict": "…" }
  },
  "coversRequiredEconomies": true,
  "dataFlags": [ { "quote": "<the student's words, exactly>", "why": "<why it looks wrong, no corrected figure>" } ],
  "band": 3,
  "mark": 11,
  "bandReason": "<two sentences naming the descriptor words that decided the band>",
  "liftYourMark": [ "<most valuable change, to the student>", "<second>" ],
  "gaps": [ { "concept": "<id from the concept list>", "detail": "<what the essay got wrong, missed or only named, one sentence>" } ],
  "conceptsUsedWell": [ "<id from the concept list>" ]
}
```

Changes from the draft prompt: `conceptsUsedWell` (added, R9), `{schoolCriteria}` in the user template (R7), `promptVersion` bumped; `dataFlags` is `[]` when none.

**Validation** (`parseEssayReply`, mirrored by `parse_reply` in the pilot):

| Field | Rule | If it fails |
|---|---|---|
| `criteria.<five ids>.verdict` | in `strong, sound, developing, weak`; all five present | whole reply fails (never a default) |
| `criteria.<id>.reason` | string; missing stored as ""; trimmed to 300 chars | — |
| `band` | integer 1–5 | fails |
| `mark` | integer | fails |
| `coversRequiredEconomies` | boolean | fails |
| `bandReason` | string, trimmed to 600 chars; missing → fails | fails |
| `liftYourMark` | array of ≥ 1 strings; the first two kept, each ≤ 300 chars | fails if none |
| `dataFlags` | array; ≤ 5 kept; `quote` must occur in the essay (whitespace-normalised, case-insensitive) else the flag is dropped; `why` with a digit not in its quote is replaced by a fixed sentence | invalid items dropped |
| `gaps` | array; `concept` on the list, deduped, ≤ 5 kept in order; `detail` ≤ 200 chars | off-list items dropped |
| `conceptsUsedWell` | ids on the list, ≤ 8, minus any id also in `gaps` | off-list dropped; missing treated as `[]` (reported as a metric: the gate requires it present) |
| echo | a run of ≥ 60 characters of the marking notes or school criteria (not in the question or essay) in any reply string | whole reply fails, retried |

**Post-processing** (`lib/essay/scoring.ts`): `final = clamp(mark, band.min, band.max)`; if the essay is tagged `both` and `coversRequiredEconomies` is false, `final = min(final, 12)`; `capped = final < clampedMark`. Stored: raw mark, band, final mark, `covers_both`.

## 2. Reviewer reply (`lib/essay/review.json`, `promptVersion` essay-review-1) [S2]

```json
{
  "checks": [
    { "id": "answers",    "status": "strength|fix", "line": "<one line>" },
    { "id": "scope",      "status": "…", "line": "…" },
    { "id": "band",       "status": "…", "line": "…" },
    { "id": "data",       "status": "…", "line": "…" },
    { "id": "models",     "status": "…", "line": "…" },
    { "id": "evaluation", "status": "…", "line": "…" },
    { "id": "fit",        "status": "…", "line": "…" }
  ],
  "figureFlags": [ { "quote": "<the student's words from the plan>", "why": "<why it looks wrong, no number>" } ]
}
```

Check ids map to the spec's seven checks: `answers` (1, answers the question), `scope` (2, strategies or influences in scope), `band` (3, top-band coverage), `data` (4), `models` (5), `evaluation` (6), `fit` (7, would fill 600–800 words).

**Validation** (`parseReviewReply`): exactly these seven ids once each (output re-sorted to this order); `status` in the set; `line` non-empty, ≤ 240 chars; **every `fix` line contains "?"** (a question or prompt) — otherwise the reply is malformed and retried; `figureFlags` ≤ 4, `quote` must occur in the scaffold else dropped, `why` scrubbed of numbers not in the quote. No `mark`, `band` or rewritten text field is accepted: unknown keys are ignored and never stored.

## 3. Shared guards (`lib/essay/scoring.ts`)

`normalise(s)` (lowercase, collapse whitespace), `quoteInText(quote, text)`, `scrubFlagWhy(quote, why)` (digits not in the quote → "This figure looks wrong; check it against a source."), `clampToBand(mark, band)`, `applyOneEconomyCap(final, economy, covers)`. Python twins in the pilot: `final_mark` (exists), `quote_in_text`, `scrub_flag_why`.

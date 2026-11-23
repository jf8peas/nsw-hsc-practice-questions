# Quote-check contract (spec 011)

The quote check is deterministic server-side code, not a model judgement. It compares every extracted quotation of three or more normalised words with the server-only Away reference text. The same implementation verifies student essays and live model essays.

## 1. Result shape

```ts
type QuoteCheckResult = {
  quote: string;                         // student's exact extracted text, without surrounding quote marks
  status: "ok" | "near" | "other-source" | "not-found";
  correct?: string;                      // near only: exact raw words from the play
  ratio?: number;                        // near/not-found: best similarity, rounded to two decimals
};

type QuoteCheckSummary = {
  results: QuoteCheckResult[];            // every checked quotation, in essay order
  referenceTextHash: string;              // 64-character SHA-256 hex of the reference used
};
```

`near` is the application name for the Python pilot's `misquote` status. `other-source` means the quotation matches the essay question's own wording or a phrase in `lib/english-essay/quote-exclusions.json`: it is stored but never flagged and never a knowledge error. `ok` results are stored but not shown. `near` and `not-found` become result `quoteFlags`.

Example values use an invented passage, not Away:

```json
[
  { "quote": "the lantern trembled in the salt wind", "status": "ok" },
  {
    "quote": "the lantern trembles in the salt wind",
    "status": "near",
    "correct": "the lantern trembled in the salt wind",
    "ratio": 0.96
  },
  { "quote": "the moon repaired every sorrow", "status": "not-found", "ratio": 0.21 }
]
```

The ratio above is illustrative only; tests calculate expected ratios with the reference implementation.

## 2. Extraction and normalisation

1. Extract straight double quotes (`"…"`), curly double quotes (`“…”`), and straight/curly single quotes (`'…'`, `‘…’`) with the pilot's length limits and no newline inside a quotation. Single quotes do not open or close when embedded in a word, but an apostrophe between two letters (`I'm`, `don't`, `Tom's`) stays inside a single-quoted quotation; this is the pilot's corrected pattern (23 Nov 2026), which the parity fixture must be regenerated from.
2. Straighten curly apostrophes/quotation marks, lower case, replace every run outside `[a-z0-9' ]` with one space, split on whitespace, and strip leading/trailing apostrophes from each word.
3. Ignore a quotation with fewer than three normalised words.
4. Split the original quotation on `...`, `…` or `/`. Keep segments with at least two normalised words. If every kept segment occurs exactly in the normalised play, return `ok`. This tolerates punctuation, ellipses and slash-separated excerpts.
5. If the quotation is not `ok`, check it against an index of the essay question's text plus the exclusion phrases, using the same exact-segment test and a near match at ratio ≥ 0.75. A hit returns `other-source` before any near search in the play.

The play index is built once per reference version: raw whitespace-separated words, normalised words, a map from each normalised word to its raw-word index, and a space-padded joined normalised string. If the source contains `ACT ONE`, indexing starts there as in the pilot.

## 3. Near-match search

When exact segment matching fails:

1. Join the quotation's normalised words as the target.
2. At every play position, consider windows of `n-2`, `n-1`, `n`, `n+1` and `n+2` normalised words, where `n` is the target length. Keep the pilot's first/last-three-word candidate skip.
3. Compute CPython `difflib.SequenceMatcher(None, target, candidate).ratio()` exactly: recursive longest matching blocks, `find_longest_match`, the autojunk popular-character rule for sequences longer than 200 code points, and `2*M/T`. TypeScript iterates Unicode code points to match Python.
4. Choose the highest ratio. At **ratio ≥ 0.75**, return `near` with `correct` set to the exact raw play words spanning the winning normalised window and the ratio rounded to two decimals. Otherwise return `not-found` with the best ratio.

No correction is returned for `not-found`. A near match costs no marks. A not-found quotation becomes one knowledge error after deduplication.

## 4. Integration with marking and content

- A valid marker reply is required before finalisation. The quote check then runs before the final-mark function.
- Unique not-found results are appended as `{ quote, why: "check this quote: not found in the play", source: "quote-check" }`. Marker errors about the same quotation are deduplicated using the overlap rule in [data-model.md](../data-model.md) §7.1.
- `near` results display "check this quote" and the exact correction, with no deduction.
- `not-found` results display "check this quote: not found in the play" plus "If these words come from another source, name it in your sentence."
- `other-source` results are stored for audit and never displayed or counted.
- `ok` results have no flag or deduction.
- Every live model essay must be 900–1,100 words and have only `ok` results. Any `near` or `not-found` result blocks the builder and `npm run validate`, printing the flag locally.
- Missing reference text returns `notMarked.reason = "reference_text_unavailable"` before a model call or daily slot. It never yields an unchecked result.

## 5. Parity, test data and performance

The Python pilot's `--write-quote-fixture` writes expected results to gitignored `resources/english-essay/quote-parity.json`. A local TypeScript runner compares statuses, ratios and corrections against the gitignored pilot essays and local play. The release bar is **4/4 planted errors caught and 0 false flags over 67 accurate quotations**. No real quotation, pilot essay or play excerpt is committed.

Committed tests use only a short invented passage seeded into PGlite. They cover straight/curly and single/double extraction, single-quoted quotations containing apostrophes between letters, quotations of the question and of exclusion phrases (`other-source`), the three-word minimum, punctuation, ellipses, slash segments, exact matches, near matches, not-found quotes, raw correction reconstruction, CPython ratio fixtures and marker/quote overlap. A separate test-time sentinel scans all pre-result responses and `.next/static` for accidental play leakage.

Benchmark a 1,200-word essay containing 25 quotations. Target <500 ms on the development machine and fail above 2 s. The play index is cached, so repeated markings in one server instance do not rebuild it.

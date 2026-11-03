# Research: Sentence Rewrite Question Redesign

Phase 0 output for `specs/006-sentence-rewrite-redesign`. Each item gives the decision, the
reason, and the alternatives rejected. Where `spec.md` and `design.md` disagree, the spec wins
and `design.md` is corrected (the corrections are listed in `plan.md` under "Design corrections").

Grading behaviour from spec 005 is unchanged: the 3-mark criteria, the phase-2 cap of 2, hint
selection (only missed or misused terms, or the lost criterion), concept tracking from phase 1
only, the self-mark rules, and the two-calls-per-question limit.

## R1. Component structure: the five-state machine

**Decision**: [`components/rewrite/RewritePanel.tsx`](../../components/rewrite/RewritePanel.tsx)
becomes the state machine for the question card. It derives the five states from the existing
`phase1Result` / `phase2Result` props plus one local `submitting` flag, and renders exactly one
state at a time inside the card:

| State | Local condition | Rendered by |
|---|---|---|
| 1 – writing | `!submitting && phase1Result === null` | the retry/info row + editable phase-1 box |
| 2 – marking first try | `submitting && phase1Result === null` | locked `LockedSentence` + `MarkingStatus` |
| 3 – feedback + retry | `!submitting && phase1Result !== null && phase1Result.marksAwarded < 3 && phase2Result === undefined && !needsSelfMark` | `FirstTryResult` + `HintCards` + `RetryBox` |
| 4 – marking retry | `submitting && phase1Result !== null && phase2Result === undefined` | collapsed first try + hint pills + locked `LockedSentence` + `MarkingStatus` |
| 5 – result | `phase2Result !== undefined \|\| (phase1Result?.marksAwarded === 3 && !needsSelfMark)` | `OutcomeSummary` + `SentenceComparison` + `TermTable` + collapsed first try + footer |
| self-mark | `phase1Result?.needsSelfMark \|\| phase2Result?.needsSelfMark` (shown instead of state 5) | `SelfMarkScreen` |

`submitting` mirrors the `busy` prop the quiz already passes, so a single grading fetch sits
behind the cosmetic marking steps (FR-008).

The sub-components, in `components/rewrite/` (each a presentational component receiving its data
as props; nothing new is imported from the answer key — the panel already receives only what the
quiz page allows):

- `RewriteStepTracker.tsx` — the `<ol aria-label="Steps">` with "Write" / "Retry with hints" /
  "Compare" (or the two-step "Write · n/3" → "Compare" at a 3/3 first try, or "Write" →
  "Mark it yourself" on the self-mark path, FR-002, FR-037).
- `PlainEnglishBlock.tsx` — the surface-50 block headed "PLAIN ENGLISH" (FR-003). It never
  receives spans or terms, so it can never highlight the plain-English sentence.
- `LockedSentence.tsx` — the locked read-only block headed "Your sentence" / "Your retry" with
  lock icon, static word count and the sentence (FR-007, FR-018). Used by states 2, 4 and the
  self-mark screen.
- `MarkingStatus.tsx` — the indeterminate progress bar, the three-step status list
  (`role="status"`, `aria-live="polite"`) and the timed cosmetics (R8); the footer line and the
  disabled "Marking…" button stay in `RewritePanel`.
- `FirstTryResult.tsx` — "FIRST TRY", the large mark out of 3, the grader's feedback, and "Your
  first try" with the credited spans highlighted (FR-013, FR-014).
- `HintCards.tsx` — "Use these terms in your retry" (one card per missed/misused term: term +
  definition only) or "What to fix" (single criterion card) (FR-015, FR-016). Built purely from
  `hint.terms` / `hint.criterionText`, which contain no plain-English mapping by construction.
- `RetryBox.tsx` — "Your retry" with "Starts from your first try — edit it", pre-filled text,
  the word meter, "Retry is worth up to 2 marks" and "Submit retry"; owns the focus-at-end
  behaviour (R9).
- `OutcomeSummary.tsx` — the result summary: recorded mark panel, the outcome line chosen by
  outcome (FR-024) and the focus-on-appear behaviour (FR-025, R9).
- `SentenceComparison.tsx` — "YOUR RETRY" / "YOUR SENTENCE" beside "MODEL SENTENCE", credited-term
  highlights, bold model terms, the commentary line and the language-note wavy underline + note
  line (FR-026, FR-027).
- `TermTable.tsx` — "The three terms" / "The two terms" / "The term" with statuses (FR-028),
  plus a `selfMark` variant without statuses but with a checkbox per row and criteria (a)/(c)
  (FR-037).
- `FirstTryCollapsed.tsx` — the closed `<details>` row "FIRST TRY · n/3" with the truncated
  sentence (FR-019, FR-029). State 4 and result reuse it.
- `SelfMarkScreen.tsx` — the degrade path in the new layout: `LockedSentence`, model-sentence
  card, `TermTable` self-mark variant, "Save my mark" (FR-037).
- `RewritePanel.tsx` — composes the above; owns `text1`/`text2` local state, the `ticks` state for
  self-mark, the marking timers (R8) and the per-phase draft save hooks (R5).

**The submitted text is never cleared.** The current `setText1("")` / `setText2("")` pattern in
`onClick` is deleted. Instead the local `text1`/`text2` are kept until the grade for that phase is
stored: the box shows `phase1Result ? phase1Answer : text1` exactly as today, but `text1` is no
longer wiped on submit, so a grading error (FR-011) reverts to an *editable* box holding the same
text; after a stored grade the locked block derives from `phase1Answer`/`phase2Answer`, which is
unchanged behaviour.

**Rationale**: the five states are exactly the spec's five card states plus the mandated degrade
path; deriving them from the two result props keeps the server as the only source of truth for
what is known, and `submitting` distinguishes "sent but no reply" (state 2/4) from "graded" (state
3/5). Splitting the render into small presentational components keeps each aspect (tracker,
marking cosmetics, hint, result layout) independently testable and reusable across states 4 and 5
(the collapsed first try and the term table appear in both).

**Alternatives rejected**: keeping one monolithic `RewritePanel.tsx` render (~700 lines with the
new layout, the timers and the self-mark screen) was rejected because the state machine, focus
handling and live-region timing would be tangled together and the existing client tests would
become brittle; a reducer/state library (Principle VIII notes no state library may be added) was
rejected — the five states are derivable, no library is justified.

## R2. Styles

**Decision**: map `design.md` and the mockup sources (`mockups/source/*.dc.html` are static comps;
sizes and wording are taken from them, never imported) onto the existing `rd-` tokens and the
`globals.css` utility classes. New classes are added only for what the rewrite panel needs, in a
`rw-` namespace inside `app/globals.css` so no structural file or tokens file changes.

`styles/tokens.css` is documented as copied unchanged from `design/v001` (README), so it is NOT
edited. Every colour that has a token uses `var(--rd-*)`. Three design colours have no token and
are programme-required: the success-700-equivalent #14653F (credited-term text and the "First try"
pill — `--rd-success-500` fails 4.5:1 on success-50, below), the warn pill text #5C3F00 and the
warn card border #F1D9A8. They are listed explicitly in the class with a comment
(`/* design #14653F; no token (tokens.css is frozen) */`). The mockup's blue-100 border and focus
ring #DCE7FD map to the existing `--rd-blue-100`.

| mockup value | Token / class | Where |
|---|---|---|
| card `border: 1px solid #E5E7EB; radius 16px; padding 28px` | `var(--rd-border-100)`, `var(--rd-r-xl)`, `padding: 28px` (override on `.rd-card.q-card`? no — the rewrite card keeps the existing `q-card` padding on phones: the mockup 28 px is the desktop value, the 390 px mockups show ~20 px; a `rw-card` wrapper inside `q-card` is not needed — set `padding: clamp(20px, 4vw, 28px)` is overkill; use the mockup's 28 px on ≥640 px and the current 20 px below via a media query) | card |
| card shadow | `var(--rd-shadow-1)` | card |
| "PLAIN ENGLISH" 12 px mono uppercase, mute-600 | `var(--rd-font-mono)`, `var(--rd-fs-sm)`, `var(--rd-mute-600)` | `PlainEnglishBlock` |
| plain sentence 19 px / 1.55, ink-700 | custom `rw-plain`, `var(--rd-ink-700)` | `PlainEnglishBlock` |
| step tracker circles 24 px; current blue-500 filled / done success-50 + success-500 check / future border-200 outline | `var(--rd-blue-500)`, `var(--rd-success-50)`, `var(--rd-success-500)`, `var(--rd-border-200)` | `RewriteStepTracker` |
| textarea 18 px, 3 rows, 1.5 px blue-500 border, 4 px blue-100 focus ring, radius 12 | `var(--rd-blue-500)`, `var(--rd-blue-100)`, `var(--rd-r-lg)`, font-size 18 px (via `rw-textarea`) | writing / retry box |
| word meter: 120 px bar, success-500 fill (warn-500 over the limit), mono count | `var(--rd-success-500)`, `var(--rd-warn-500)`, `var(--rd-font-mono)` | meter |
| locked block: white box, blue-100 border, 18 px sentence | `var(--rd-white)`, `var(--rd-blue-100)`, 18 px | `LockedSentence` |
| progress bar 3 px, blue-500 sliding on blue-50 track | `var(--rd-blue-500)`, `var(--rd-blue-50)` | `MarkingStatus` |
| "FIRST TRY" mark 36 px display blue-700 | `var(--rd-font-display)`, `var(--rd-blue-700)` | `FirstTryResult` |
| credited term highlight: success-50 background, success-700-ish #14653F text, weight 600, radius 4 | `var(--rd-success-50)` + class literal #14653F (no token) | highlight |
| hint cards warn-50 background, warn border #F1D9A8, term 20 px display 700 | `var(--rd-warn-50)` + literal border + `var(--rd-font-display)` | `HintCards` |
| result summary success-50 panel, mark 48 px display (#14653F on success, ink-900 on surface-50 below 2) | `var(--rd-success-50)`, `var(--rd-surface-50)`, literal #14653F / `var(--rd-ink-900)` | `OutcomeSummary` |
| model card blue-50 background, model terms bold blue-700 | `var(--rd-blue-50)`, `var(--rd-blue-700)`, font-weight 700 | `SentenceComparison` |
| language-note wavy underline danger-500 | `var(--rd-danger-500)` + `text-decoration: underline wavy` | `SentenceComparison` |
| status pills: "First try" success-50/700 text; "Added in retry" blue-50/blue-700; "Not used" surface-100/ink-700 | as above, pill height ≥ 22 px (`.rd-pill` style or a `rw-pill` class sized 24 px+ so it meets touch targets when interactive — the result pills are not interactive, the self-mark checkboxes are) | `TermTable` |
| primary buttons 48 px | new `rw-btn h48` (`.rd-btn` is 36 px; the redesign's submit buttons are 48 px per the mockups) | submit / save |
| `<summary>` rows min-height 44 px | `rw-collapsed summary { min-height: 44px }` | `FirstTryCollapsed` |

**Reduced motion (FR-041)**: a `@media (prefers-reduced-motion: reduce)` block in the `rw-`
styles sets the progress-bar sliding animation and the button/lock spinner rotation to `animation:
none` and shows static equivalents: the progress bar renders as a static half-filled track (the
`MarkingStatus` component renders a static `rw-progress-static` bar instead of the animated fill
when reduced motion is detected via `matchMedia`), and spinners render as a static ring. The status
list is text and unchanged.

**Colour contrast (FR-039 to FR-043)**: every text colour pair is checked for 4.5:1. The one
programme rule: `--rd-success-500` (#1F8A5B) on `--rd-success-50` is ≈3.9:1 — below 4.5:1 — so
credited-term text and the "First try" pill use the design's darker green #14653F (≈6.5:1 on
success-50), not a token that fails. Verified pairs: ink-700 on white ≈13:1; mute-600 on white
≈7.1:1 (all small grey text, per design.md §12, is mute-600, never mute-400/500 below 14 px);
mute-500 on white ≈4.74:1 (only at ≥14 px); blue-700 on blue-50 ≈7.8:1; warn text #5C3F00 on
warn-50 ≈8.6:1; danger-500 on white ≈5.9:1; ink-900 on surface-50/success-50 > 13:1. The
credited-term highlight is never colour alone: it adds `font-weight: 600` (FR-039). Interactive
targets: every submit/save button is 48 px tall, `<summary>` rows have `min-height: 44px`, and the
self-mark checkboxes are wrapped in labels whose hit area is ≥ 44 px (checkbox + row padding).
Focus is never removed: the focus ring on the textarea uses `var(--rd-blue-100)` box-shadow like
today, buttons keep the default focus outline (never `outline: none` without a replacement), and
`RewriteStepTracker`/`<summary>` remain in the tab order where interactive.

**Rationale**: keeping tokens and classes additive (a `rw-` namespace in `globals.css`) means zero
risk to the existing short-answer/MC/photo styling, and the frozen-tokens rule is respected; the
contrast rule is decided explicitly at design time because the design's own success green fails the
4.5:1 gate otherwise.

**Alternatives rejected**: adding the missing greens (e.g. `--rd-success-700`) to `tokens.css` was
rejected because the file is documented as copied unchanged from `design/v001`; editing it would
make that statement false and diverge from the kit. Using `--rd-success-500` for credited text was
rejected because it fails 4.5:1 on success-50. A separate CSS file imported from the component was
rejected: Next App Router only allows global stylesheets from the root layout.

## R3. Grader output (FR-031 to FR-036)

**Decision**: extend the *same* `gradeRewrite` LLM reply (one call per phase, still at most two
calls per question, FR-035) with per-term credited spans and an optional language note. The reply
shape becomes:

```json
{
  "criterionA": true,
  "padding": false,
  "terms": [
    { "term": "subsidy", "status": "used", "span": "Government subsidies" },
    { "term": "infant industry", "status": "misused", "span": null }
  ],
  "feedback": "You named subsidy. One more term would make your sentence more precise.",
  "languageNote": { "spelling": [ { "wrong": "fromm", "fix": "from" } ], "grammar": "\u201cSubsidies \u2026 enable\u201d (plural)." }
}
```

- `span` per term: the exact words in the student's sentence the grader credited for that term,
  or `null`. It is `null` for any term the grader did not credit.
- **Phase 2 term outcomes need no new model field**: the phase 2 reply already returns the same
  `terms[].status` array; code derives `phase2TermOutcomes: { conceptId, correct }[]` from it
  exactly as it derives phase 1 outcomes today. Returning a separate field would invite drift
  between the two lists.
- `languageNote` (optional): `{ spelling?: Array<{ wrong, fix }>, grammar?: string }`, at most
  three spelling pairs and one short grammar note.

**Prompt updates** in `buildRewriteMessages`:

1. **FR-013**: the system prompt gains: feedback must name what was done well and what would
   improve the sentence (more precise terms, or the lost criterion), and MUST NOT name or quote
   words or phrases of the plain-English sentence as things to replace, and must not tell the
   student which words to change.
2. **Criterion-shaped feedback (FR-045)**: when every target term is used correctly but a
   criterion is lost, the feedback must name the lost criterion rather than suggesting
   replacements. The existing hardcoded `criterionText` ("Cut your sentence to 25 words or
   fewer." / "Keep the meaning and the cause and effect of the original sentence.") stays as the
   hint card's text.
3. Spans: "for each term you mark 'used', quote the exact words in the student's sentence that
   earned it (a grammatical form or a listed equivalent may differ from the term itself); quote
   nothing the student did not write; use null for a term you did not credit."
4. Language note: "when the sentence has a misspelling or a grammar slip, return a languageNote
   with the wrong word and its correction (at most three), and at most one short grammar note;
   otherwise omit languageNote."

The existing answer-length and injection safeguards are kept: the answer is trimmed to 6000
characters before grading, delimited in the prompt, JSON-only with one retry on an unparseable
reply, and the new fields cannot make a previously-parseable reply unparseable (below).

**Code validation** (in `parseRewriteJson` / `gradeRewriteAnswer`; spans and the note are never
trusted as rendered HTML — highlighting is index-based inside the student's own sentence and the
note text renders as React text nodes):

- **Span kept only if found in the sentence (FR-032)**: normalise both the span and the sentence
  by trimming and collapsing runs of whitespace (including newlines) to a single space; a span is
  kept only when it appears as a contiguous substring of the sentence under a case-insensitive
  comparison (so "Subsidies" matches "subsidies", and a span split across a line break matches).
  This is the decided meaning of "verbatim": exact characters after case- and
  whitespace-normalisation. The client re-finds the span with the same rule to compute highlight
  offsets. A span longer than the sentence, or one that is not a substring, is dropped.
- **A span for a term not credited is dropped** even if it appears in the sentence (FR-031's "per
  target term the words the grader credited"): only `status === "used"` terms keep their span, and
  a stray `span` on a missing/misused term is nulled.
- **Malformed language note dropped**: the note is kept only when it matches `{ spelling?:
  Array<{ wrong: string, fix: string }>, grammar?: string }`, each string non-empty and within
  length caps (wrong/fix ≤ 60 chars, grammar ≤ 200 chars), `spelling` ≤ 3 entries and `grammar`
  at most one line. Anything else drops the whole note (nothing is stored or shown). Each
  spelling pair is also kept only when its `wrong` word is found in the sentence under the span
  rule above (so the wavy underline always lands on the student's own word); pairs that fail are
  dropped individually, and a note left with neither spelling nor grammar is dropped.
- **A parseable reply without the new fields still grades exactly as today**: `parseRewriteJson`
  treats a missing `span`, a non-string `span`, or a non-object `languageNote` as absent — it
  never returns `null` because of them. `gradeRewriteAnswer` therefore produces results identical
  to today's when the model omits the new fields, keeping marks, the cap and the hint selection
  byte-for-byte unchanged (FR-036).
- The validated per-phase display data is added to the `RewriteGradeResult` as optional fields:
  `creditedSpans?: Array<{ conceptId: string; span: string }>` (phase 1 or 2, credited and found
  only), `phase2TermOutcomes?: Array<{ conceptId: string; correct: boolean }>` (phase 2 only), and
  `languageNote?: RewriteLanguageNote` (final phase only — phase 2, or phase 1 at 3/3, per
  FR-034's "final sentence").
- **Prompt-injection and length**: spans are capped at 200 characters before validation, the note
  strings at the caps above, and `feedback` is trimmed as today. Nothing from the model reply is
  ever inserted as HTML.

`scripts/fake-openrouter.ts`'s rewrite branch returns the new fields: `span` = the term text when
the fake's answer contains it (else `null`, and always `null` for a term the fake marks
"missing"), and a `languageNote` with `{ wrong: "fromm", fix: "from" }` when the answer contains
"fromm" (matching the mockup typo), so the manual flow can verify the wavy underline. Its
`feedback` strings are already plain-English-free ("Fake rewrite grader: well done.") and stay so.

**Rationale**: one extended call per phase keeps FR-035 (at most two marking calls) and FR-036
(no mark changes) trivially true: marks and the all-or-nothing rule are computed in code as today
from `criterionA/padding/terms`, and the new fields are validated "keep-if-good, else drop" so a
reply that parses today parses identically tomorrow.

**Alternatives rejected**: a separate spans/note endpoint or call was rejected (violates FR-035);
letting the model return marks or outcomes for phase 2 in a separate list was rejected (drift risk,
and the `terms[].status` array already is the outcome); trusting the span text for rendering was
rejected (an index-based highlight of the student's own sentence cannot inject model text).

## R4. Term statuses (FR-028)

**Decision**: the term table status is computed client-side from the two outcome lists, in this
order (per term):

1. correct in phase 1 (`phase1Result.termOutcomes[i].correct === true`) → **"First try"**,
   whatever phase 2 did (this matches concept tracking, which counts phase 1 only);
2. else correct in phase 2 (`phase2Result.phase2TermOutcomes[i].correct === true`) →
   **"Added in retry"**;
3. else → **"Not used"**.

Phase 2 outcomes exist only when phase 2 happened; with no phase 2 every term is "First try" or
"Not used". The statuses are display only: the stored `results.concept_outcomes` (the concept
tracking source) is still built from phase 1 outcomes only, and the draw and
`lib/concepts/progress.ts` read only `results.concept_outcomes`. The phase 2 outcomes live only in
`rewrite_phases.display_data` (R5) where `progress.ts` and the draw never look; a test asserts
the phase row's phase 2 outcomes never appear in any `conceptProgress` input. A term correct in
phase 1 and dropped in phase 2 keeps "First try" and simply shows no highlight in the final
sentence (spec Edge Cases).

**Rationale**: the order is specified by FR-028 ("decided in this order: 'First try' …,
'Added in retry' …, or 'Not used'") and is exactly the decision procedure that makes the pills
agree with concept tracking.

**Alternatives rejected**: deriving statuses from the final mark (a 2/3 cannot say which terms
were used); storing statuses as their own column (they are derivable, and a stored derivation
could drift from the outcomes).

## R5. Persistence (FR-053, FR-054)

### R5.1 Where the display data goes

**Decision**: one nullable `jsonb` column `display_data` on `rewrite_phases`, holding a single
well-typed object:

```ts
interface RewriteDisplayData {
  phase1: { spanByTerm: Record<string, string> };                 // credited spans, found only
  phase2?: { spanByTerm: Record<string, string> };                // credited spans, found only
  phase2TermOutcomes?: Array<{ conceptId: string; correct: boolean }>;  // display only
  languageNote?: { spelling?: Array<{ wrong: string; fix: string }>; grammar?: string };
}
```

Write timing: the grade route writes `display_data` at phase 1 (phase1 spans) and extends it at
phase 2 (phase2 spans, phase2 outcomes, language note); the 3/3 phase 1 path writes phase1 spans
plus the language note. Because the route reads the phase row before updating, extending the
object at phase 2 is a read-modify-write inside the existing `status = 'phase1'`-guarded `UPDATE`
(R6 of spec 005), so a double tap still updates once.

**Rationale**: the display data is written and read as a unit — the result screen needs all of it
at once, and resume restores it all at once (FR-054) — so four columns buy nothing; one column
keeps the schema, the migration, and the typed validation single, and future display-only fields
need no migration.

**Alternatives rejected**:
- Four nullable `jsonb` columns (`phase1_spans`, `phase2_spans`, `phase2_term_outcomes`,
  `language_note`): more migration surface and two separate partial-update code paths for no
  reading benefit; also makes "a row has no display data" a conjunction of four null-checks.
- Storing it on `results`: the display data for phase 1 must exist while the question is still
  pending (feedback + retry needs the phase 1 spans for the highlight), and `results` rows appear
  only at `final`; `rewrite_phases` is the natural home and is already deleted with the student.

### R5.2 Draft storage

**Decision**: choose **(b) — save the per-phase draft at blur / page hide / visibility change via
`navigator.sendBeacon` to a new lightweight draft route**, layered on top of the existing
`lib/drafts.ts` sessionStorage drafts (which are saved on every keystroke and survive a same-tab
reload). Concretely:

- [`lib/drafts.ts`](../../lib/drafts.ts) keeps `saveRewriteDraft`/`loadRewriteDraft` (phase 1 and
  phase 2 keys) as the always-on local layer: every change writes sessionStorage, so a reload of
  the same tab never loses a keystroke.
- The `RetryBox`/writing box hook calls, on `blur`, on `pagehide` and on
  `visibilitychange → hidden`, `navigator.sendBeacon("/api/rewrite/draft", …)` with
  `{ attemptId, attemptToken, questionId, phase, draft }`. The client skips the beacon when the
  text equals the last text already sent (per box). The submitted sentence is already persisted as
  `phaseN_answer` by the grade call, so submit-time saving is inherent and the draft columns are
  cleared when the relevant phase is graded; the draft row is deleted when the question is final
  (graded or self-marked), so no draft outlives its question (data minimisation, Principle II).
- Server side: a new `rewrite_drafts` table (below, data-model.md) with `UNIQUE(attempt_id,
  question_id)`; the route is a `POST /api/rewrite/draft` that verifies the session and attempt
  token, applies a dedicated per-user draft rate limit (default 30/min, a separate limiter
  instance in `lib/ratelimit.server.ts` — never the grading limits), caps the draft at 6000
  characters, and upserts. Statuses are in `contracts/api.md`.

**Writes per student**: a beacon per blur or page-leave per box — typically 1-2 per phase, at most
~10-20 for a 5-question attempt; comfortably under the 30/min draft limit and irrelevant to the
grading rate limits and `LLM_DAILY_CAP` (the draft route is not AI-graded). **Failure when the
database is down**: `sendBeacon` is fire-and-forget; the route answers `503` and the quiz is
untouched (Principle VI). The beacon payload is only the student's own draft — an explicitly
permitted kind of data (Principle II); the row is cascade-deleted with the student and covered by
the 2.13.0 amendment.

**What "no typed text is lost" means in practice for (b)**: on the same tab, nothing is ever lost
(sessionStorage is written per keystroke and the box is never cleared, R1). Across devices or a
fresh tab, the restored text is the last saved point — the box content as of the last blur /
page hide / visibility change / submit; the only unrecoverable window is keystrokes typed in a
box that is still focused when the process is killed without firing `blur`/`pagehide` (a hard
crash mid-typing), which is bounded to that edit session. Because blur fires when the student
taps "Submit …" (the button takes focus) and visibilitychange fires on app-switch, this window is
the design's accepted boundary; the spec's FR-054 ("no typed text MAY be lost") is met for every
realistic leave path — leaving the question, switching apps, closing the tab, and reload.

**Alternatives rejected**:
- (a) A debounced autosave route per keystroke window: tens of writes per question per student
  (debounce 1-2 s over a 2-minute rewrite can approach the per-minute limit, forcing a separate
  high limit or dropped saves), writes the phase-1 draft to `rewrite_phases` before a phase row
  exists (which collides with the NOT NULL `phase1_answer` and with the route's "a phase row for
  `(attempt, question)` means phase 1 was graded" already-answered check — a draft-only row would
  read as an answered row), and spends database writes for the same text repeatedly. It was the
  runner-up because it bounds the loss window to the debounce; rejected because of the write
  volume and the phase-row collision (the separate `rewrite_drafts` table below avoids that
  collision but (a) was framed as writing the draft on the phase row).
- (c) sessionStorage plus saving only at submit time: fails the core of FR-053 — a student who
  types half a retry on one device and resumes on another gets the first-try sentence, not their
  half-edited retry, and a reload of the *same* tab already works via sessionStorage. **If (c)
  were chosen the spec would need narrowing**: FR-053's "saved with the attempt … so a resumed
  or reloaded question … restores what the student had typed" would have to drop "with the
  attempt" (cross-device) and read "restores what the student had typed in this tab",
  and FR-054's "the persisted draft text MUST restore the contents of the writing or retry box"
  would have to drop "persisted". (c) is rejected; (b) is chosen, so the spec does not need
  narrowing.

**Migration** (drizzle): one new migration — `ALTER TABLE rewrite_phases ADD COLUMN display_data
jsonb` + `CREATE TABLE rewrite_drafts`. No backfill; old rows have `display_data = null` and grade
exactly as today.

## R6. Resume (FR-038)

**Decision**: the quiz page loader already rebuilds `rewriteState` per question from the phase
row; it additionally reads `display_data` and the `rewrite_drafts` row. Each persisted situation
maps to exactly one state:

| Saved situation (phase row / drafts) | State shown on resume |
|---|---|
| No phase row, no server draft | writing (state 1), empty box |
| No phase row, server draft present | writing (state 1), box = draft (FR-053: "phase 1 submitted but the grade never stored" — the draft is the text; nothing typed is lost) |
| Phase row `status = phase1` (under 3) | feedback + retry (state 3): `FirstTryResult` (phase 1 mark, feedback, credited spans), `HintCards` (hint), `RetryBox` pre-filled with `phase2Draft ?? phase1Answer` |
| Phase row `status = final`, `phase2Answer` null (3/3) | result (state 5), sentence labelled "YOUR SENTENCE", phase 1 spans + language note restored |
| Phase row `status = final`, `phase2Answer` set | result (state 5), sentence labelled "YOUR RETRY", phase 1 + phase 2 spans, phase 2 outcomes and language note restored |
| Self-mark pending (a `needsSelfMark` answer not yet saved) | restored only from the same-tab sessionStorage `graded` state (it carries `selfMarkToken` + `discussion` + the answer) → the self-mark screen; without it (fresh tab/device) the phase row decides (writing or feedback + retry) and the student resubmits — the model sentence and terms can never be reconstructed server-side without the token (Principle I) |

A grade stored while the student was away always resumes at the graded state (the phase row's
`status` decides state 3 or state 5), never at a marking state. Marking states (2 and 4) are
transient client states and are never persisted or restored.

The `rewriteState` payload entry gains the display fields (`phase1CreditedSpans`,
`phase2CreditedSpans`, `phase2TermOutcomes`, `languageNote`) and the drafts
(`phase1Draft`, `phase2Draft`) — see `contracts/api.md`. `Quiz.tsx` restores them into the
`rewrite` state and passes them to `RewritePanel`; the retry box initialises from `phase2Draft ??
phase1Answer`.

**Rationale**: the phase row plus the display data and drafts are exactly the write model of R5,
so resume is a pure read; the "self-mark pending" case is the only one the server cannot rebuild,
and sessionStorage already carries it for the same tab (spec 005's `GradedState`).

**Alternatives rejected**: persisting marking states (FR-038 forbids it and they are cosmetic);
persisting the self-mark token/discussion to rebuild a pending self-mark on another device
(Principle I — the discussion is answer-key material that must not be stored per result beyond
what the phase row allows, and the token is short-lived).

## R7. What reaches the browser, when (FR-044, Principle I)

**Decision**: strict per-response map for the new fields:

| Response / page | New fields it may carry |
|---|---|
| `POST /api/grade`, phase 1, marks < 3 | `creditedSpans` (phase 1, credited-and-found terms only), `hint` (only missed/misused terms, or the criterion), `termOutcomes` (phase 1). NO discussion, NO language note, NO phase 2 fields. |
| `POST /api/grade`, phase 1, marks = 3 | `creditedSpans` (phase 1), `discussion` (model sentence + every term with definition and why), `languageNote` (optional — the final sentence), `termOutcomes`. |
| `POST /api/grade`, phase 2 | `creditedSpans` (phase 2), `phase2TermOutcomes`, `discussion`, `languageNote` (optional), plus the phase 1 data already held client-side. |
| `POST /api/grade`, needsSelfMark | `discussion` (model sentence + terms with definitions, as spec 005 does today) on the self-mark screen; no spans (nothing was credited); no phase 2. |
| Resume (quiz page payload, `rewriteState.[qid]`) | exactly what the phase row's stage allows: nothing (no spans, no hint) before a phase 1 grade; phase 1 spans + hint + phase 1 marks/feedback at `phase1`; the full display data + discussion at `final`. A phase 1 span never names a term the student did not use (spans are validated to credited terms only, R3). |
| Attempt detail page | unchanged (see R10). |

The model sentence, the "why" text and every definition continue to appear only at the result or
self-mark screen (or in the hint as term + definition only after a sub-3 phase 1); the plain
English block never carries highlights. Drafts are the student's own text and are only ever
returned to the same student's quiz page.

**Constitution Check against 2.12.0**: at 2.12.0 Principle I already says "Nothing from the key
MAY reach the browser before phase 1 is graded (or has fallen back to self-marking), including on
reload or resume", and permits the hint after a sub-3 phase 1 and the full set at the
discussion/self-mark screen. The credited spans are not key material — they are words of the
student's own sentence — and the only key-derived fact they expose (that those words were target
terms) is revealed strictly after phase 1 is graded, at the same moment the discussion release is
already allowed, and never before, including on reload or resume (the loader sends spans only
from a persisted, post-grade phase row). **The check passes without a Principle I amendment.**
Principle II's storage list does not yet name the display data or the drafts, and the spec
requires them stored with the attempt (FR-053). **The constitution is amended 2.12.0 → 2.13.0**
(MINOR: materially expanded guidance in Principle II). Exact amendment text:

> In Principle II, extend the writing-practice bullet to read:
> - per writing-practice question in an attempt: the phase 1 and phase 2 sentences, their marks,
>   the per-term outcomes from phase 1, and the feedback shown, plus the display-only grading data
>   (the credited spans for each phase, the phase 2 term outcomes and any language note), stored in
>   a phase row until the question is final and kept for the attempt detail page; and the
>   student's in-progress draft text for each phase, stored in a draft row only until the question
>   is final; all deleted with the student like results. The display data and drafts never change
>   marks or concept tracking, which always come from the phase 1 outcomes.
>
> Update the version to 2.13.0, the Last Amended date to 2026-11-03, the amendment log and the
> Sync Impact Report (modified principles: II; templates needing updates: 005's spec/plan/research/
> data-model/contracts/quickstart unaffected, this feature's docs created with the amendment in
> mind).

The amendment is the first task in `plan.md` (required by FR-044/FR-053).

**Rationale**: the map is the same per-stage discipline spec 005 R5 already enforced; the new
fields slot into the existing stages (phase 1 spans go with the phase 1 grade, phase 2 data with
the phase 2 grade, the note only at the final grade) so no stage boundary moves.

**Alternatives rejected**: sending phase 1 spans at attempt start or on a pre-grade reload
(violates FR-044 and Principle I); sending the language note with a sub-3 phase 1 (it applies to
the final sentence only); returning spans for non-credited terms (a span is only meaningful where
the grader credited the term).

## R8. Marking status timing (FR-008, FR-009, FR-020, FR-011)

**Decision**: the cosmetic steps are driven by two timers inside `RewritePanel`, started when a
marking state appears (state 2 or 4) and keyed to the marking response in flight:

- **Timer values**: step 1 ("Read your sentence" / "Read your retry") is ticked immediately;
  step 2 ("Checking your economics terms…" / "Checking <hint terms by name>…" or "Checking your
  sentence…" on a criterion hint) ticks at **1.5 s**; step 3 ("Writing your feedback" /
  "Preparing the model sentence") shows in progress from the start and stays in progress until the
  marking response arrives — never shown done before it arrives (FR-008, FR-020).
- **Cleanup on a fast reply and on unmount**: the timers live in an effect whose cleanup clears
  them; when the reply lands (the phase result prop becomes non-null) or the panel unmounts, any
  pending timer is cancelled. If the reply arrives before 1.5 s, the status list simply never
  shows step 2 as in-progress (the state transitions out of marking) — cosmetics never delay the
  UI.
- **Live region (FR-009)**: the status list container is `role="status"` `aria-live="polite"`;
  the text announced is a single `announcedLabel` state that is set only when the *step index*
  changes (tick or timer fire), so each change is announced once and there is no per-tick
  announcement (the in-progress spinner is `aria-hidden` and never announced).
- **Error return (FR-011)**: on an error the marking state exits (the phase result stays null and
  `error` is set); timers are cancelled by the effect cleanup, the locked block becomes the
  editable box holding `text1`/`text2` (R1), and the existing error message renders above the
  box. Nothing typed is lost.
- Reduced motion (R2): the bar fill and spinner animations are off and static equivalents render.

**Rationale**: the steps are declared cosmetic and timed in FR-008 ("a single marking request sits
behind them"), so the only mandatory behaviours are per-step timing, no response-dependent step
shown early, and a correct live announcement; the 1.5 s value is taken from design.md §5, and
"each change once" is the ARIA live-region contract.

**Alternatives rejected**: announcing every timer tick (inaccessible — screen readers would read a
stream); driving the steps from the fetch state (they are intentionally faster than the network);
removing the timers entirely (design.md pins the effect).

## R9. Focus and keyboard (FR-017, FR-025, FR-042)

**Decision**:

- **Retry box focus (FR-017)**: when state 3 appears, `RetryBox` focuses its textarea and places
  the cursor at the end **on devices with a fine pointer only** (decided via
  `matchMedia("(pointer: fine)")`; touch/coarse pointers are skipped). Rationale: on a phone the
  on-screen keyboard would pop up over the hint the student still needs to read; on a keyboard
  device the box is ready to edit immediately, matching "focused, cursor at the end" (FR-017).
  The cursor-at-end is `setSelectionRange(text.length, text.length)` after focus.
- **Result summary focus (FR-025)**: when state 5 appears, `OutcomeSummary` receives focus via a
  ref + effect (`tabIndex={-1}` on the summary container), the same pattern the marking box uses
  today.
- **Collapsed first-try rows** (FR-019, FR-029): `<details>/<summary>` elements — keyboard
  openable, no JavaScript, and the `summary` is `min-height: 44px` (FR-042). The chevron is the
  native disclosure triangle plus the mockup's text.
- All interactive targets (buttons 48 px, summary rows 44 px, self-mark checkbox hit areas 44 px)
  keep visible focus; text inputs keep the existing `--rd-blue-100` ring.

**Rationale**: focussing the retry box on a phone steals the hint; skipping coarse pointers is the
standard safeguard for exactly this; `<details>` gives the collapsed rows semantics and keyboard
support for free.

**Alternatives rejected**: always focusing the retry box (keyboard pops over the hint on phones);
a JS disclosure button (`aria-expanded`) for the collapsed rows (native `details/summary` is less
code and keyboard-accessible by default).

## R10. Attempt detail page

**Decision**: `app/attempts/[attemptId]/page.tsx` stays as it is — the new result layout is out
of scope. The spec does not require it, and it is **not** nearly free: the term table needs the
definition and "why" text, which are answer-key material (Principle I) — showing them on the
history page would require either storing key material per result (prohibited: "model answers and
rubrics … MUST NOT be stored per-result") or re-reading the key server-side at render (new read
path, new layout in a server component, beyond this feature). The page already shows both
sentences, both marks and the recorded mark from the phase row (spec 005 FR-020), which is what
the spec asked for.

**Rationale**: the redesign is a live-quiz experience; the attempt page is a record. Keeping it
unchanged confines the change to `RewritePanel`/`Quiz`/the grade+resume routes and avoids a
Principle I discussion that the spec explicitly did not sign up for.

**Alternatives rejected**: rendering the sentence comparison + term table on the attempt page
(requires answer-key material on a history page or a new server-side key read — scope and
Principle I risk out of all proportion to the ask); showing only the term names with statuses but
no definitions (inconsistent with the result layout and still new scope).

# LLM Contracts: Learn From Mistakes

What each model call is given and must return. All calls go through the shared
`chatCompletion()` in `lib/openrouter.server.ts` with a 20-second timeout (60 seconds for the
illustration generator), `temperature` 0.4 for generators and 0 for the reviewer, and JSON output
for everything except the SVG itself. Nothing here is sent to or readable from a browser.

## 1. Summary generator (`CONCEPT_MODEL`)

**Input** (public material only; the generator never sees model answers, rubrics or correct
options):

- Unit title, topic and description.
- The concept's id and one-line description.
- The `prompt` text of every question tagged with the concept (so the summary covers what is
  tested without being a worked answer to any one question).
- Fixed instructions: aimed at a NSW HSC Year 11 student; explain the concept itself in general
  terms; 3 to 6 bullets, each at most 240 characters; do not explain why a particular answer is
  wrong; do not state the answer to any question; Australian English; decide whether a diagram
  would help and, if so, give a one-sentence brief and alt text.

**Output** (JSON):

```json
{
  "bullets": ["…", "…", "…"],
  "illustration": null
}
```
or
```json
{
  "bullets": ["…", "…", "…"],
  "illustration": { "brief": "A supply and demand diagram showing …", "alt": "A graph with …" }
}
```

Validation in code: 3 to 6 non-empty strings of at most 240 characters; `illustration` is null or
has non-empty `brief` and `alt` (alt at most 300 characters). Anything else is a failed call (no
retry inside the call; the pipeline's backoff handles it).

## 2. Pre-check (no model, no cap slot)

Before any review, the summary text is normalised (lower-case, punctuation removed, spaces
collapsed) and compared with the normalised model answer, every rubric point and the correct
option of each question tagged with the concept. Any shared run of 8 or more consecutive words
fails the version with the fixed reason `"Verbatim overlap with an answer key."`. It follows the
same one-regeneration rule as a reviewer failure.

## 3. Summary reviewer (`REVIEW_MODEL`)

**Input**:

- Everything the generator saw, plus the generated bullets.
- For each question tagged with the concept: the model answer (short answers), the rubric points,
  and the correct option text (MC), read through `getReviewMaterial()` in `lib/grading.server.ts`.
- Fixed instructions: check each item below and answer only with the JSON shape given.

**Output** (JSON):

```json
{
  "checks": {
    "matches_concept": true,
    "accurate": true,
    "no_answer_leak": true,
    "general_not_question_specific": true
  },
  "reason": "One or two sentences. Required when any check is false."
}
```

| Check | Fails when |
|---|---|
| `matches_concept` | The bullets do not cover the concept's description, or drift to another topic |
| `accurate` | A statement is wrong or contradicts the model answers or rubrics |
| `no_answer_leak` | The text reproduces a model answer, rubric point or correct option |
| `general_not_question_specific` | It reads as the answer to one question rather than an explanation of the concept |

**Pass rule (in code)**: all four checks are `true`. A `pass` field in the reply is ignored. A
reply that is not valid JSON, or is missing a check, is a failed call (reviewer unavailable): the
version stays `pending_review`. `reason` is stored truncated to 1000 characters.

## 4. Illustration generator (`ILLUSTRATION_MODEL`)

**Input**: the concept description, the approved or pending summary bullets, and the `brief` and
`alt` from the summary generator. Instructions: return one self-contained SVG, `viewBox` of
`0 0 640 400`, only the allowed elements and attributes (see below), readable text of at least 14
px, axes and every curve labelled, no external references.

**Output**: SVG text. The code extracts the first `<svg …>…</svg>` block.

**Allowlist** (anything else rejects the whole SVG, which counts as a failed generation):

- Elements: `svg g path line polyline polygon rect circle ellipse text tspan defs marker title desc`.
- Attributes: geometry and presentation only (`d x y x1 y1 x2 y2 cx cy r rx ry points width height
  viewBox transform dx dy fill stroke stroke-width stroke-dasharray stroke-linecap stroke-linejoin
  fill-opacity stroke-opacity opacity font-size font-family font-weight font-style text-anchor
  dominant-baseline marker-end marker-start id`), plus `xmlns`, `markerWidth markerHeight refX refY orient`.
- Never: `href`, `xlink:href`, `style`, any `on*`, `<script>`, `<style>`, `<foreignObject>`,
  `<image>`, `<use>`, `<!DOCTYPE>`, `<!ENTITY>`, `javascript:`, `data:`. `url(...)` is allowed only
  as `url(#id)`. Maximum size 40 KB.

## 5. Illustration reviewer (`REVIEW_MODEL`, must accept images)

**Input**: the concept, the summary bullets, the brief and alt text, the SVG source, and a PNG
(800 px wide) rendered from the SVG on the server with a bundled font. Same model-answer material
as the summary reviewer, so a picture that reproduces an answer fails.

**Output** (JSON): the same shape with these checks, all required to be `true`:

| Check | Fails when |
|---|---|
| `matches_concept` | The picture does not show the concept in the brief |
| `labels_correct` | A label is missing, misspelt or on the wrong thing |
| `axes_correct` | An axis is missing, unlabelled or has the wrong quantity or direction |
| `shapes_correct` | A curve, line or region has the wrong shape or slope for the concept |
| `no_answer_leak` | It shows a model answer, a rubric point or the correct option to a tagged question |

If rendering fails, or the model rejects image input, the version stays `pending_review`.

## Cap accounting

One cap slot (`daily_concept_usage`) is reserved immediately before each of: summary generation,
summary review, illustration generation, illustration review, and the single automatic
regeneration's generation and review. The pre-check, the SVG check and rendering reserve nothing.
A call that fails before a model answers (network error, non-2xx, unparseable body) refunds its
slot. A model reply that parses but fails the content rules does not refund: tokens were spent.

# Review prompt v2 — NSW HSC Physics Module 5 question bank

Paste this, then the contents of one review pack beneath it.

---

You are a NSW HSC Physics examiner checking a practice question bank for **correctness**.

## What this content is

NSW HSC Physics **Module 5: Advanced Mechanics**, 2017 syllabus (projectile motion, circular
motion including banked tracks and torque, and motion in gravitational fields). The questions are
reproduced **word for word from NSW school trial and half-yearly papers** and each shows its
source. The answer keys, rubrics and wrong-option explanations were written separately and are
what you are checking.

Use the NSW Physics data sheet values: g = 9.8 m s⁻², G = 6.67 × 10⁻¹¹ N m² kg⁻²,
mass of Earth = 6.0 × 10²⁴ kg, radius of Earth = 6.371 × 10⁶ m.

Each entry gives the question, any diagram (as a text description — the real figure is drawn as
SVG), the keyed answer, the reasoning behind it, and either the wrong-option explanations (multiple
choice) or the model answer and marking rubric (short answer).

## How to work

**Solve every question yourself from the question text alone, before you look at the key.** Do the
arithmetic. Do not read the key's reasoning and check whether it sounds plausible — that is not a
review.

Then compare your result with the key.

## Part 1 — working table (required, every question)

Before any findings, output one row **per question**, in order, with no questions omitted:

| id | my result | key says | agree? |
| --- | --- | --- | --- |
| m031 | 1.0005 × 10¹⁰ J | 1.0 × 10¹⁰ J | yes |
| s145 | 2mg = 2.55 N | 2.5 N | yes |

- **my result** is the value *you* derived, not a restatement of the key.
- For a question with parts, give each part's result separated by semicolons.
- For a non-numerical question, give the conclusion you reached in a few words.
- A row with no result is not acceptable. If a question genuinely cannot be worked from the
  information given, write `cannot work — <what is missing>` and raise it as a finding.

This table is how the review is audited, so it comes first and it must be complete.

## Part 2 — findings

Only for rows where you answered "no", or where something else is wrong:

| id | severity | what is wrong | correct version |

Severity:
- **CRITICAL** — the keyed answer is wrong, no option is correct, two options are defensible, or a
  model answer reaches a wrong result.
- **MAJOR** — a wrong-option explanation is factually wrong, the rubric point count does not match
  the marks, the model answer contradicts its rubric, or needed data is missing.
- **MINOR** — significant figures, rounding, a unit slip, or an explanation that is correct but
  describes the wrong misconception.

**Quote before you claim.** Quote the exact text you dispute — the `KEYED ANSWER:` line, the
`WHY (key):` line, a rubric point, an explanation — verbatim, before saying what is wrong with it.
If your correction turns out to match what that text already says, there is no finding: drop it.

Show your full working for every CRITICAL and MAJOR finding.

## Do NOT flag these

These are deliberate. Reporting them is a false positive.

- **Wording, grammar, punctuation or typos in the question text.** The questions are verbatim from
  school papers and the originals' phrasing is preserved on purpose. Only raise wording if it makes
  the physics genuinely **ambiguous or unanswerable**.
- Australian spelling and NSW unit style (`m s⁻¹`), or a paper using `q` where you would write `θ`.
- Bracketed instructions such as "(Describe the forces in words.)". These intentionally replace
  draw-on-the-diagram tasks that a typed quiz cannot mark.
- Parts drawing on another module (momentum, magnetic force) kept so a multi-part question stays
  whole. Where this happens the model answer says so.
- The **diagram description**. It is a text rendering of a figure for your benefit; do not critique
  the drawing. Do flag it if it contradicts the question or omits needed data.
- A model answer that notes a discrepancy in the original school marking guide and explains which
  value it follows. Several school keys contain arithmetic slips and this is intentional.
- The **`CONCEPT:` line**. It classifies the question for the app's revision tool. It is not a
  claim about the method used to solve the question, and a question tagged with one formula may
  legitimately be solved with another.

## Finish

A pack with no problems is an expected and acceptable result — but the working table must still be
complete, because that is the evidence the questions were actually worked. Do not manufacture
findings to appear thorough, and do not skip the table because you found nothing.

End with:

```
CHECKED: <n> questions, <c> critical, <m> major, <n> minor.
```

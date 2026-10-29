# Review prompt v3 — NSW HSC Physics Module 5 question bank

**This re-reviews everything.** Earlier runs are not trusted: one model rubber-stamped 19 packs
without working, and another silently rewrote questions before checking them. All 23 packs are in
scope, including `gravitation-mc-01.md` and `gravitation-mc-02.md`.

**Run it in batches of three or four packs, not all 23 at once.** Long unattended runs are where
models start trimming. Both previous failures happened in long loops.

The packs are in the `nsw-hsc-practice-questions` repo at `resources/topic006/review-packs/`
(on this machine, `C:\Users\johnf\Git\nsw-hsc-practice-questions\resources\topic006\review-packs\`).
Write findings to `resources/topic006/review-findings/<same filename>`.

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

## Rule zero — do not retype the questions

**Work only from the pack file exactly as given.** Do not rebuild it, restate it, summarise it,
"clean it up", or reproduce it in your own words anywhere in your output.

A previous reviewer rewrote a question — changed its stated condition, inverted a mass ratio and
invented an option — and then reported the answer key as wrong. The key was right; the rewrite was
not. If you find yourself typing out a question, stop.

Every number, name, option and condition you reason about must be the one printed in the pack. If
a question looks like a familiar textbook problem, **re-read it** — these are real school papers
and they frequently vary the standard setup.

## How to work

**Solve every question yourself from the question text, before you look at the key.** Do the
arithmetic. Reading the key's reasoning and judging whether it sounds plausible is not a review.

## Part 1 — working table (required, every question)

Before any findings, one row **per question**, in order, none omitted:

| id | source (copy verbatim) | my result | key says | agree? |
| --- | --- | --- | --- | --- |
| m031 | James Ruse 2024 Trial, Q14 | 1.0005 × 10¹⁰ J | 1.0 × 10¹⁰ J | yes |

- **source** is copied character for character from the pack's `source:` field. It is a check that
  you are reading the question in front of you; do not reconstruct it from memory.
- **my result** is the value *you* derived, not a restatement of the key.
- For a question with parts, give each part's result separated by semicolons.
- For a non-numerical question, give the conclusion you reached in a few words.
- A row with no result is not acceptable. If a question truly cannot be worked from the information
  given, write `cannot work — <what is missing>` and raise it as a finding.

This table is how the review is audited, so it comes first and it must be complete.

## Part 2 — findings

Only for rows you marked "no", or where something else is wrong:

| id | severity | what is wrong | correct version |

Severity:
- **CRITICAL** — the keyed answer is wrong, no option is correct, two options are defensible, or a
  model answer reaches a wrong result.
- **MAJOR** — a wrong-option explanation is factually wrong, the rubric point count does not match
  the marks, the model answer contradicts its rubric, or needed data is missing.
- **MINOR** — significant figures, rounding, a unit slip, or an explanation that is correct but
  describes the wrong misconception.

Every finding must satisfy all three of these, or it is not a finding:

1. **Quote the text you dispute, verbatim** — the `QUESTION:` lines, the `KEYED ANSWER:` line, the
   `WHY (key):` line, the rubric point or the explanation — copied from the pack, not paraphrased.
2. **For multiple choice, your proposed answer must be one of the printed options.** If your value
   is not among them, you have misread the question; go back and re-read it.
3. **Show your full working** for every CRITICAL and MAJOR finding.

If your correction turns out to match what the disputed text already says, there is no finding:
drop it.

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
  claim about the method used, and a question tagged with one formula may legitimately be solved
  with another.

## Finish

A pack with no problems is an expected and acceptable result — but the working table must still be
complete, because that is the evidence the questions were actually worked. Do not manufacture
findings to appear thorough, and do not skip the table because you found nothing.

End each pack's findings file with:

```
CHECKED: <n> questions, <c> critical, <m> major, <n> minor.
```

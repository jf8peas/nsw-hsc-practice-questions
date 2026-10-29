# Review prompt — NSW HSC Physics Module 5 question bank

**Scope: the 22 packs listed below — everything except `gravitation-mc-01.md`, which is already
covered.**

This cannot be done in one pass. The 22 packs come to about 502 KB (~143k tokens) and R1's context
window is 64k, so paste **one pack per conversation**, starting a fresh conversation each time.
Work through the list:

| # | Pack | # | Pack |
| --- | --- | --- | --- |
| 1 | `gravitation-mc-02.md` | 12 | `projectiles-mc-02.md` |
| 2 | `gravitation-mc-03.md` | 13 | `projectiles-sa-01.md` |
| 3 | `gravitation-sa-01.md` | 14 | `projectiles-sa-02.md` |
| 4 | `gravitation-sa-02.md` | 15 | `projectiles-sa-03.md` |
| 5 | `gravitation-sa-03.md` | 16 | `projectiles-sa-04.md` |
| 6 | `gravitation-sa-04.md` | 17 | `projectiles-sa-05.md` |
| 7 | `gravitation-sa-05.md` | 18 | `circular-mc-01.md` |
| 8 | `gravitation-sa-06.md` | 19 | `circular-mc-02.md` |
| 9 | `gravitation-sa-07.md` | 20 | `circular-sa-01.md` |
| 10 | `gravitation-sa-08.md` | 21 | `circular-sa-02.md` |
| 11 | `projectiles-mc-01.md` | 22 | `circular-sa-03.md` |

Review **only the pack pasted below this prompt**. Do not comment on questions you have not been
shown, and do not ask for the other packs.

**Save each reply** into `../review-findings/`, named after the pack it answers — the reply to
`gravitation-mc-02.md` becomes `review-findings/gravitation-mc-02.md`. Save the whole reply,
including the working. `review-findings/_STATUS.md` tracks which packs are done.

---

You are a NSW HSC Physics examiner checking a practice question bank for **correctness**. Work
each question yourself before judging the key — do the arithmetic, do not eyeball it.

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

## Check these

**Multiple choice**
1. Work the question. Is the **keyed answer correct**?
2. Is **exactly one** option correct? Flag a question where no option works, or where two can be
   defended.
3. Is each **wrong-option explanation** factually correct, and does it describe an error that
   actually produces that option? (A plausible-sounding explanation that would not give that
   number is a real defect.)

**Short answer**
4. Is the **model answer correct** — every number, unit, direction and sign? Check rounding and
   significant figures against the data given.
5. Does the **rubric have exactly as many marking points as the question has marks**, and does each
   point correspond to a real step in the working?
6. Does the **model answer agree with its own rubric**?

**Both**
7. Is the question **answerable as presented**? Flag missing data, or a diagram description that
   contradicts the question or leaves out a value the question needs.

## Do NOT flag these

These are deliberate. Reporting them is a false positive.

- **Wording, grammar, punctuation or typos in the question text.** The questions are verbatim from
  school papers and the originals' phrasing is preserved on purpose. Only raise wording if it makes
  the physics genuinely **ambiguous or unanswerable**.
- Australian spelling and NSW unit style (`m s⁻¹`), or a paper using `q` where you would write `θ`.
- Bracketed instructions such as "(Describe the forces in words.)". These intentionally replace
  draw-on-the-diagram tasks that a typed quiz cannot mark.
- Parts drawing on another module (momentum, magnetic force) kept so that a multi-part question
  stays whole. Where this happens the model answer says so.
- The **diagram description itself**. It is a text rendering of a figure for your benefit; do not
  critique the drawing. Do flag it if it contradicts the question or omits needed data.
- A model answer that notes a discrepancy in the original school marking guide and explains which
  value it follows. Several school keys contain arithmetic slips and this is intentional.

## Output

For each problem, one row:

| id | severity | what is wrong | correct version |

Severity:
- **CRITICAL** — the keyed answer is wrong, no option is correct, two options are defensible, or a
  model answer reaches a wrong result.
- **MAJOR** — a wrong-option explanation is factually wrong, the rubric point count does not match
  the marks, the model answer contradicts its rubric, or needed data is missing.
- **MINOR** — significant figures, rounding, a unit slip, or an explanation that is correct but
  describes the wrong misconception.

Show your working for every CRITICAL and MAJOR finding, so it can be checked.

**If a pack has no problems, say so plainly.** Do not manufacture findings to appear thorough — a
clean pack is an expected result. Report only what you can demonstrate is wrong.

Finish with one line: `CHECKED: <n> questions, <c> critical, <m> major, <n> minor.`

Start your reply with a single line naming the pack you were given, exactly as its heading reads,
so the output can be filed against it:

`PACK: <pack filename>`

# Design: Economics Paragraph Writing

**Feature folder**: `specs/007-economics-paragraph-writing`
**Created**: 2026-11-05
**Status**: Design agreed; input to `/speckit-specify` (see `specify-prompt.md`)
**Unit**: `y12-economics-paragraph-writing` (Writing Practice)
**Builds on**: spec 005 (economics sentence writing: phase 1 mark, one capped phase 2, discussion,
tips into "Things I need to know", self-mark degrade path) and spec 006 (the rewrite question's
frame, step tracker, locked marking block and result layout). Their rules carry over unless this
file says otherwise.
**Requirements**: the Claude doc "Economics Paragraph Writing — Requirements (draft spec 007)",
https://claude.ai/artifact/G39xpYVQPsg6qWvqpyERdo. Every row of its decisions table, the
"Decided 4 Nov" notes, the pilot result and the held-out check are settled.
**Marker**: built from the round 5 prompt in `scripts/pilot-paragraph-marker.py` (`build_messages`,
`PARTS`, `CONVENTIONS`, `PROMPT_VERSION`); pilot findings in `resources/topic010/`.

This is the visual and wording reference. `spec.md` (written by `/speckit-specify`) states the
requirements; this file pins down what each screen looks like and says, so the plan and tasks do
not have to guess. Where the two disagree, `spec.md` wins and this file should be corrected.

## 1. Problem

The sentence unit (spec 005) teaches the vocabulary of economics one sentence at a time. Students
still lose most marks in extended responses on structure: a topic sentence that describes instead
of judging, a mechanism that jumps from the strategy straight to growth, figures dumped without
saying what they show, an evaluation that names a drawback without weighing it, and a closing line
that adds something new instead of answering the question. Their first assessment that tests this
is the Year 12 Economics Assessment Task 1 on Tue 1 Dec 2026 (the Global Economy case study of
globalisation's influence on an emerging and a developing economy).

The new unit trains one body paragraph, one part at a time, using the five-part framework (Topic
Sentence, Theoretical Mechanism, Evidence & Application, Evaluation & Limitation, Linking
Judgement):

- **One part per quiz.** A quiz is one question: one part of one essay. The next quiz continues the
  same essay with the next part, in framework order. After the Link, the next quiz starts a new
  essay. One essay is in progress at a time; no skipping a part and no restarting mid-essay.
- **The app supplies the content; the student does the writing.** Each essay has a brief in plain
  English dot points (economy and strategy, argument, counterpoint, chain steps, facts,
  limitation). Every figure the model uses is in the brief.
- **The rubric is taught before writing**, not revealed after: each part lists what it must do.
- **The student writes into a real paragraph.** The model text of the earlier parts of this essay
  is shown above the box, whatever the student scored on them. Later parts are never shown.
- **Tips, not terms.** The tracked concepts are writing tips, one per criterion; a tip missed on a
  first try goes into "Things I need to know".

## 2. Flow and states

One question card per quiz. Mockups are in `mockups/` (desktop 1280 px and phone 390 px for each
screen). The editable source is in `mockups/source/` (Claude Design `.dc.html` files and
`canvas.json`, copied unchanged from the canvas; they render with `design/v001/support.js` copied
beside them, see `mockups/source/README.md`). The live canvas is
https://claude.ai/artifact/4yQJhH1Qt55akUfRQxpxsP.

The sample throughout: Vietnam, trade liberalisation and FDI; Essay 3 of 12; Part 3, Evidence &
Application; 2/4 on the first try, 3/3 on the correction, 3/4 recorded.

| # | Screen / state | Mockups | When |
|---|----------------|---------|------|
| 1 | Unit page | `1-unit-*.png` | Before a quiz; shows the essay in progress and the next part |
| 2 | Writing a part | `2-writing-*.png` | Quiz opened, phase 1 not submitted |
| 3 | Marking | `3-marking-*.png` | Phase 1 submitted, waiting for the mark (also phase 2, §6.3) |
| 4 | Phase 1 result + correction | `4-correction-*.png` | Phase 1 marked under 4/4 |
| 5 | Discussion | `5-discussion-*.png` | Phase 1 at 4/4, or phase 2 marked |

- A 4/4 first try goes straight from state 3 to state 5 (the tracker then shows "Write · 4/4" then
  "Discuss").
- Marking the correction is state 3 again with the correction's text (§6.3). It is not drawn.
- The self-mark path (marker unavailable or over the cap) replaces states 3–5 (§9).
- "Finish" on state 5 ends the quiz and returns to the unit page, which then shows the next part.

## 3. Common frame (all question states)

Styling comes from the live site (`app/globals.css`): the question card and quiz chrome (`.q-card`),
and the rewrite question's `rw-*` classes from spec 006 (step tracker, locked block, meter, buttons,
status list). The unit page uses `.unit-intro`, `.section-head`, `.concept-item`, `.stat-strip` and
`.unit-attempt`. The mockups use literal values; the plan maps them onto these classes and
`styles/tokens.css`. Sizes and colours belong in the plan, not the spec.

From the top of the page:

1. **Site header**, unchanged.
2. **Essay progress bar.** The site's quiz progress bar, but with one segment per part of the essay
   (five segments), each labelled: **Topic · Mechanism · Evidence · Evaluation · Link**. Done parts
   carry a green tick before the label; the current part is bold blue
   (`aria-current="step"`); later parts are grey. It is an `<ol>` labelled
   "Essay 3 progress: part 3 of 5".
3. **Pill and counter row**: the pill **"Paragraph writing · 4 marks"** on the left; on the right,
   in mono, **"Essay 3 · Part 3 of 5"**.
4. **The question card**, containing the step tracker first.

### 3.1 Step tracker

Three steps joined by short rules, as spec 006 §3.1:

| Step | Label (current or future) | Label (done) |
|------|---------------------------|--------------|
| 1 | Write | Write · 2/4 |
| 2 | Correct with tips | Correct · 3/3 |
| 3 | Discuss | — |

- The correction's mark is shown out of 3 (its cap), not out of 4.
- A 4/4 first try skips step 2: "Write · 4/4" then "Discuss".
- Self-mark path: "Write" then "Mark it yourself" (§9).
- `<ol aria-label="Steps">`; the current step has `aria-current="step"`.

### 3.2 Essay question block

Second row of the card in states 2–4 (not on the discussion): a pale panel with the mono label
**"ESSAY QUESTION"** and the question quoted in full in curly quotes, with its **directive verb
highlighted** (blue mark, weight 600):

> “**Evaluate** the effectiveness of the strategies used by an emerging economy you have studied to
> promote economic growth and development.”

In state 2 only, a line under it defines the verb:

> **Evaluate** — make a judgement based on criteria; determine the value of.

Definitions come from the NESA glossary of key words (content data per essay, not hard-coded). The
verbs the bank uses include assess, evaluate, analyse and discuss.

## 4. Screen 1: Unit page

Mockups `1-unit-desktop.png`, `1-unit-phone.png`. Same layout as the other unit pages
(spec 003), with an essay block in the intro card.

### 4.1 Intro card (`.unit-intro`)

- Badges: **NEW**, **Writing Practice**, and the date badge (mono, e.g. `2026-11-05`).
- Title: **"Writing economics paragraphs"**.
- Description: **"Build a Band 6 body paragraph one part at a time: Topic Sentence, Theoretical
  Mechanism, Evidence & Application, Evaluation & Limitation, Linking Judgement. Each quiz is one
  part, and the next quiz carries on the same essay."**
- Exam row (the existing exam countdown): **"In 26 days"** · **"Year 12 Economics Assessment
  Task 1"** · `2026-12-01` on the right.
- **Essay block** (bordered box):
  - **"Essay 3 of 12 · next: Evidence & Application"** (600 weight).
  - The essay question in curly quotes with the directive verb highlighted, then, in grey,
    **"· Model economy: Vietnam"**.
  - **Five part dots** in a row (`<ol aria-label="Essay 3 parts">`), each with the part's short
    label underneath (Topic, Mechanism, Evidence, Evaluation, Link) and a mono line under that:
    - finished part: green tick in a pale green circle, label in ink, the **recorded mark**
      (e.g. "3/4", "4/4");
    - next part: filled blue circle with its number, label bold blue, **"next"**,
      `aria-current="step"`;
    - later parts: grey outlined circle with its number, grey label, nothing under it.
- Primary button, full width: **"Continue essay (Part 3 of 5)"**.

Variants (not drawn; wording follows the same pattern):

- At the start of an essay (no part finished): "Essay 4 of 12 · next: Topic Sentence", no marks on
  the dots, button **"Start essay (Part 1 of 5)"**.
- A new student: "Essay 1 of 12 · next: Topic Sentence", button "Start essay (Part 1 of 5)".
- All essays in the bank finished: no essay block and no start button; in their place **"You've
  finished every essay so far. New essays are added as they're written."**
- Database unreadable: no essay block and no start button; **"We can't load your place in the essay
  right now. Try again in a moment."**

### 4.2 "Things I need to know"

`.section-head` with the title **"Things I need to know"**, the description **"Writing tips you
missed on a first try. A part tip clears after 2 correct first tries at that part; an all-parts tip
after 3."**, and a count pill on the right (**"4 to review"**).

One `.concept-item` row per tip, laid out like the existing concept rows:

- **Part name in bold**, a colon, then the tip as the student sees it, e.g.
  "**Topic Sentence**: Frame the counterpoint up front: “While X has…, its impact has been limited
  by…”." The all-parts tips use **"All parts"**.
- On the right, pips (one per correct first try needed: two for a part tip, three for an
  all-parts tip; green = done, grey = to go) and a mono count: **"1 to go"**, **"2 to go"**.

The 17 tracked tips and their wording are in the requirements doc ("Things I need to know" table);
the content task finalises them. The connectors tip is feedback-only and never appears here.

### 4.3 "Your results" and "Past attempts"

As the other units: a three-column `.stat-strip` (**Best**, **Latest**, **Attempts**), then
**"Past attempts"** with **"Open an attempt to see each of your answers with its marks and
feedback."** and one `.unit-attempt` row per quiz. The row name is the essay and part:
**"Essay 3 · Mechanism"**, **"Essay 3 · Topic Sentence"**, **"Essay 2 · Linking Judgement"**, with
the date and time, the bar, the percentage and the mark out of 4.

## 5. Screen 2: Writing a part

Mockups `2-writing-*.png` (they show the brief open; the collapsible brief below was added after
the mockups and they are not redrawn). Inside the card, in order:

1. Step tracker (Write current).
2. Essay question block with the verb definition (§3.2).
3. **"What this part must do"**, with **"Marked out of 4 on these"** on the right. A numbered list
   of four plain lines taken from this part's criteria, (a) to (c) then conventions. For Evidence &
   Application:
   1. Use specific indicators from the brief, each with its year.
   2. Say what each number shows — don’t just list the data.
   3. Link the evidence back to the mechanism, so it proves the chain actually happened.
   4. Precise economic terms, within 80 words.

   The content task writes these lines for every part; line 4 always names the part's limit.
4. **"The brief"**, a collapsible section (a native `<details>`/`<summary>`, as the collapsed rows
   on the later screens). It starts **open on Part 1** (Topic Sentence) and **closed on Parts 2 to
   5**, on desktop and phone alike; the student can open and close it freely, and the starting
   state is not saved (a reload or resume starts open or closed by the same rule). The summary
   row is at least 44 px tall: a chevron that turns when the section opens, **"The brief"** as the
   heading, and on the right **"The content in plain English — you do the writing"** when open.
   When closed the right-hand text reads **"Use in this part: "** followed by the labels of the
   fields this part uses, joined with " · " (for example **"Use in this part: Chain steps ·
   Facts"**), so the student knows what is inside. The chevron does not animate under
   `prefers-reduced-motion`. Inside, a
   bordered table, one row per field, label in mono caps on the left (unchanged):
   **Economy**, **Argument**, **Counterpoint**, **Chain steps**, **Facts**, **Limitation**. All
   fields stay visible. The fields this part needs are emphasised: pale blue row, darker text, and
   a pill **"Use in this part"** under the label. Which fields each part needs is content data; for
   Evidence it is Chain steps and Facts.
   - Facts are a bulleted list (FDI inflows, exports as a share of GDP, real GDP growth, poverty
     rate, HDI), each with its year.
   - **Figures are placeholders in the design.** On the canvas every number and year is a dashed
     mono placeholder (`US$x bn`, `x`, `year`, `years`, `0.xxx`), and the Limitation row ends
     "…: *figures supplied by the content task*." The content task supplies and verifies the real
     figures; this file and the spec must not invent them.
5. **"The model paragraph so far"**, with **"Your part continues from here"** on the right. A
   bordered box with each earlier part's model text under a mono label (**"1 · Topic Sentence"**,
   **"2 · Theoretical Mechanism"**), then a dashed blue slot for the current part:
   **"3 · Evidence & Application — you write this below"**. Later parts are not shown at all. In
   Part 1 the box holds only the slot.
6. The answer field: label **"Write the Evidence & Application"** (the part's full name), with
   **"Every figure you need is in the brief"** on the right. Text box six rows tall, placeholder
   **"Write your part here…"**.
7. Footer row: word meter (bar and **"52 / 80 words"**) and the primary button **"Submit for
   marking"** with a right arrow. Limits per part: **Topic 40, Mechanism 90, Evidence 80,
   Evaluation 90, Link 45**. Over the limit the meter shows the over state as in spec 006 §4, with
   the conciseness wording adapted to this unit; submission is never blocked.
8. Under a divider, an info line: **"Lose a mark? You’ll get one correction with tips, worth up to
   3 marks."**

## 6. Screen 3: Marking

Mockups `3-marking-*.png`. As spec 006 §5: nothing the student typed disappears.

Order: tracker (Write current) → essay question (no verb definition) → locked block → status list →
brief collapsed → footer.

### 6.1 Locked block

The text box is replaced in place by a read-only block with a pale blue border: header row with a
lock icon and **"Your Evidence & Application"** (the part's full name), and **"52 / 80 words"** on
the right; then the student's text. A thin indeterminate progress bar runs along the bottom edge.

### 6.2 Status list and footer

A `role="status"`, `aria-live="polite"` list of three timed, cosmetic steps (one marking call sits
behind them):

1. ✓ **Read your writing**
2. ◌ **Checking it against the four criteria…** (spinner, bold)
3. ○ **Writing your feedback** (grey)

Step 1 ticks at once, step 2 after a short delay, step 3 keeps going until the response arrives;
never show a step as done that depends on the response. Under it, the brief and the paragraph so
far collapse into one closed `<details>` row: **"The brief and the model paragraph so far"** with a
chevron. Footer: **"Usually takes 10–20 seconds."** and the disabled pale-blue **"Marking…"**
button with a spinner.

On a marking error the block returns to the editable text box **holding the student's text**, with
the existing error message. Reduced motion: no sliding bar or spinning.

### 6.3 Marking the correction (not drawn)

The same screen after "Submit correction": tracker with "Write · 2/4" done and "Correct with tips"
current; the locked block is headed **"Your correction"** with its own word count; the first-try
result collapses to one row as in spec 006 §7; footer **"Correction is worth up to 3 marks."** and
"Marking…". Status wording for this phase is a plan detail.

## 7. Screen 4: Phase 1 result + correction

Mockups `4-correction-*.png`. Shown when phase 1 scores under 4. Order: tracker (Write · 2/4 done,
Correct with tips current) → essay question → first-try result → tip cards → brief collapsed →
correction box.

### 7.1 First-try result

One bordered box in three parts:

- Top: mono label **"FIRST TRY"**, the mark (**"2 / 4"**), and the marker's overall feedback line
  beside it, e.g. "Your figures are accurate and precise. Now make them **argue**: say what each
  one shows and link it to your mechanism."
- **Results by criterion** (`<ul aria-label="Results by criterion">`): one row per criterion,
  (a) to (d), each with a ✓ (`role="img" aria-label="Met"`, green) or ✗ (`aria-label="Not met"`,
  red), the criterion's short name in 600 weight, and **one feedback line** from the marker under
  it. Sample:
  - ✓ **(a) Specific indicators, each with its year** — "You used every figure in the brief, each
    with its year."
  - ✗ **(b) Ties every number to what it shows** — "The figures are listed one after another; the
    paragraph doesn’t say what each one demonstrates."
  - ✗ **(c) Connects the evidence back to the mechanism** — "Nothing refers back to the mechanism
    above, so the evidence doesn’t show the chain actually happened."
  - ✓ **(d) Conventions: precise terms, within the word limit** — "Precise terms throughout and
    well within the limit. Connectors such as “as a result” would make the cause and effect
    clearer." (The connectors advice is feedback only; it never costs the mark.)
- Bottom strip: **"Your first try · 52 words"** and the student's text.

### 7.2 Tip cards: "Fix these in your correction"

Heading **"Fix these in your correction"**. One amber card per **lost** criterion, in a responsive
grid:

- small line **"Lost: (b) Ties every number to what it shows"**;
- the writing tip in the display font: **"Tie every number to what it shows; no data dumping."**;
- one line of advice on applying it, the same for every essay (a static line per criterion, so a
  card can never carry model text; plan R13): "After each figure, add a few words on what it shows."

Second card: "Lost: (c) Connects back to the mechanism" / "Show the evidence proves the mechanism
actually happened." / "Name the strategy or its channel, and tie each figure to a step in the
chain." (The mockup's essay-specific example sentences are illustrative only.)

**Never model text** (decision 8): a card names the criterion and the tip and may say how to apply
it, but never gives a sentence of the model part or a rewrite of the student's text.

### 7.3 Brief and correction box

- The brief and the paragraph so far, collapsed (**"The brief and the model paragraph so far"**),
  so the student can reopen them.
- Label **"Your correction"**, with **"Starts from your first try — edit it"** on the right. The
  text box is **pre-filled with the first try**, focused, cursor at the end.
- Footer: word meter, an info line **"Correction is worth up to 3 marks"**, and the primary button
  **"Submit correction"** with a right arrow.
- The correction is capped at 3. There is no third try, and the correction cannot be skipped
  (spec 005 FR-042): leaving leaves the question unanswered.

## 8. Screen 5: Discussion

Mockups `5-discussion-*.png`. Order: tracker (Write · 2/4, Correct · 3/3, Discuss current) →
result summary → criteria → flag button → correction beside the model part → model paragraph →
tips added → first try collapsed → footer. The essay question block is not repeated.

### 8.1 Result summary

A pale green panel (it takes focus when the screen appears) with the recorded mark (**"3 / 4
marks"**) and two lines chosen by outcome. Recorded mark = the higher of phase 1 and the capped
phase 2.

| Outcome | Line 1 | Line 2 |
|---------|--------|--------|
| Correction = 3 (drawn) | "Full marks for a correction — every criterion met." | "A correction can earn at most 3. Meet all four on the first try next time for the full 4." |
| Phase 1 = 4 | "Full marks on your first try." | marker feedback |
| Correction < 3, correction ≥ phase 1 | marker feedback on the correction | "A correction can earn at most 3." |
| Phase 1 > correction | marker feedback on the correction | "Your recorded mark is n / 4 (your better try)." |

Two more outcomes (spec FR-019a and FR-033):

| Outcome | Line 1 | Line 2 |
|---------|--------|--------|
| Correction could not be marked (cap used or marker unavailable) | "Your first try is recorded: n / 4 marks." | "We couldn't mark a correction this time, so your first-try mark stands. The tips below are what to work on." |
| Self-marked | "You marked n / 4." | "Compare your text with the model part." |

Only the first row of the first table is on the canvas; the others follow spec 006 §8.1 adapted to 4
and 3. When the recorded mark is 2 or below the panel is neutral grey instead of green.

**FR-019a variant of the whole screen** (not drawn): the criteria list shows ✓/✗ and the short name
only (no "First try" / "Fixed in correction" pills), followed by tip cards headed **"Work on these
next"** (one per lost criterion, same cards as §7.2), then the flag button, the model beside the
student's first try (**"YOUR PART"**), the model paragraph, "Added to Things I need to know" and
"Finish". There is no correction box and no first-try row (the first try is the final text).

### 8.2 "Your correction, criterion by criterion"

Heading **"Your correction, criterion by criterion"** ("Your part, criterion by criterion" when
phase 1 was final). A bordered list, one row per criterion: ✓ or ✗, the criterion's short name, and
a pill:

- **"First try"** (green): met in phase 1 (whatever phase 2 did).
- **"Fixed in correction"** (blue): missed in phase 1, met in phase 2.
- **"Not met"** (grey; not drawn): met in neither.

Under the list, a line **"Think the marker got a criterion wrong? Flag it and your teacher will look
at it."** and a secondary button with a flag icon: **"This mark seems wrong"**. After pressing it
the button shows a done state, **"Flagged for your teacher"** (disabled, with a check), and cannot
flag the same answer twice. It is not shown on the self-mark path (there is no marker mark to
dispute). It
never changes the mark.

### 8.3 Your correction beside the model part

Two cards side by side (stacked on phones):

- **"YOUR CORRECTION"** (or **"YOUR PART"** when phase 1 was final): the final text and
  **"71 / 80 words"**.
- **"MODEL EVIDENCE & APPLICATION"** (pale blue card): the model part, then one line of commentary:
  **"73 words — every figure is followed by what it shows."** (word count computed; the comment
  after the dash is content data per model part).

### 8.4 "The model paragraph"

Heading **"The model paragraph"** with a key on the right (a pale blue swatch and **"This part"**).
One paragraph containing the model text of **every part up to and including this one**, with this
part highlighted (pale blue mark, blue text). The later parts appear only as dashed mono chips:
**"4 · EVALUATION — NEXT QUIZ"** and **"5 · LINK — QUIZ AFTER"**. Their model text is never shown
before the student has written them (decision 2; confirmed 5 Nov, superseding the requirements
doc's "full model paragraph" wording). On the Link part the whole paragraph is shown with the Link
highlighted.

### 8.5 "Added to Things I need to know"

Heading **"Added to Things I need to know"** with **"Missed on your first try, so they count even
though you fixed them"** on the right. One row per tip missed in **phase 1** (spec 005 FR-033),
laid out like the unit page rows: "**Evidence**: Tie every number to what it shows; no data
dumping." with pips and **"2 to go"**. Hidden when nothing was missed in phase 1.

### 8.6 First try and footer

- The first try collapsed into one `<details>` row: **"FIRST TRY · 2/4"** and the text truncated
  with an ellipsis. Hidden when phase 1 was final.
- Footer: **"Next quiz: Part 4 of 5, Evaluation & Limitation"** on the left and the primary
  **"Finish"** button with a right arrow. After the Link part the left line names the next essay
  (e.g. "Next quiz: Essay 4, Part 1 of 5, Topic Sentence"; wording is a plan detail).

## 9. Self-mark path (marker unavailable or over the cap)

The degrade path from the requirements doc, visually following spec 006 §9:

- After "Submit for marking", if the marker fails or the student is over `LLM_DAILY_CAP`, the
  student's text stays visible as the locked block and the **model part** is shown (with the model
  paragraph up to this part, as §8.4).
- One checkbox per criterion, (a) to (d), each with its short name and its "What this part must do"
  line, so the student ticks each criterion they met. The footer button is **"Save my mark"**.
- The mark is the number of ticks out of 4. The ticks give the tip results (an unticked criterion's
  tip counts as missed, as a phase 1 miss).
- **No phase 2** on this path. The tracker shows "Write" then "Mark it yourself".
- No error is shown and no mark is invented (constitution Principle VI).

## 10. Resume and the essay in progress

- **One essay in progress at a time.** The unit page and "Continue essay" always open the next
  part of that essay. No skipping a part and no restarting mid-essay.
- The model text of earlier parts is shown whatever the student scored on them, so a weak Topic
  Sentence never derails the rest of the paragraph.
- Resuming mid-question shows the state the attempt is in: state 4 with the tip cards and the
  correction box (holding the saved correction draft, or the first try), or state 5. Marking
  states are never restored; an unanswered submission comes back as state 2 or 4 with the text in
  the box.
- A quiz left without finishing phase 2 leaves the part unanswered: the next quiz offers the same
  part again (the essay does not advance until a part has a recorded mark).
- Past attempt pages show each part's text, marks, per-criterion results and feedback, as the
  sentence unit's attempt detail does.

## 11. Data needed

The plan decides the shapes. Grouped by what needs it:

**The essay and the student's place in it**

1. Per essay (content, server-only key except where released below): essay question, directive verb
   and its definition, economy and type, brief fields, the five model parts, per-part "What this
   part must do" lines, which brief fields each part uses, per-part marking notes, per-model-part
   commentary line, the tip wording.
2. Per student: which essay is in progress and which part is next, derived from stored results.
   Essay order through the bank is fixed (12 essays in v1).

**Marking and the revision loop** (requirements doc, "Spec 007 must include")

3. Per part answered: the phase 1 and phase 2 text, their marks, the recorded mark, and the
   feedback shown.
4. Per criterion, per phase: the verdict (met / not met) and the marker's one-line reason, stored
   with the attempt.
5. The prompt version that marked each phase (`PROMPT_VERSION` in the marker), so a later prompt
   change can be compared against what students saw.
6. A flag per answer from "This mark seems wrong", with when it was raised, for review.
7. Offline only: the record of the periodic stronger-model re-mark of a sample of full-mark
   answers and any disagreements; disagreements and reviewed flags become labelled cases in
   `resources/topic010/pilot-essays.json` (a "field" set), and every prompt change reruns the whole
   file.

**Tracking**

8. Tip results from phase 1 only (or the self-mark ticks), per criterion. Part tips clear after 2
   correct phase 1 uses; all-parts tips after 3.

**Released to the browser, and when** (constitution Principle I amendment needed; today's scoped
release covers only spec 005)

- Before phase 1 is marked: the brief, the "What this part must do" lines, the verb definition, and
  the model text of the **earlier** parts of this essay (each already released at its own
  discussion). Never the current part's model, the marking notes or later parts.
- After phase 1 is marked under 4: the per-criterion verdicts and feedback lines, and the tip for
  each lost criterion. Never model text.
- At the discussion or self-mark screen: the current part's model text and its commentary line.
- Never, at any point: later parts' model text, or the marking notes.

Constitution Principle II also needs amending for items 2–7 (per-criterion verdicts and reasons,
prompt version, flags), and the derived concept-count rule for the part tips' count of 2.

## 12. Accessibility

- Verdicts and statuses are never shown by colour alone: ✓ and ✗ carry `aria-label` "Met" /
  "Not met"; pills carry text; the highlighted part in the model paragraph also has the "This part"
  key and the verb highlight is also bold.
- Marking progress is announced through the `role="status"` region; the result summary takes focus
  when the discussion appears; the correction box takes focus, with the cursor at the end, when state 4 appears (spec FR-022; the
  first-try result does not take focus).
- Progress bar and step tracker are ordered lists with `aria-current="step"`.
- Touch targets ≥ 44 px (buttons 48 px tall; the collapsed rows ≥ 44 px); small grey text keeps
  ≥ 4.5:1 contrast.
- Animations stop under `prefers-reduced-motion`.
- Works at 390 px with no sideways scrolling (see the phone mockups); the brief's label column
  wraps above its text on phones.

## 13. Reference implementation

None yet. The mockup sources are static comps, not components; the plan maps them onto the quiz
page, the spec 006 `rw-*` pieces and the unit page components. The marker's prompt, rubric
(`PARTS`, `CONVENTIONS`) and reply parsing come from `scripts/pilot-paragraph-marker.py` round 5.

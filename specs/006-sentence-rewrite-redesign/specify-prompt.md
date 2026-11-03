# `/speckit-specify` prompt for spec 006

Paste everything inside the block below into your agent as one message. The first line makes Spec Kit
write `spec.md` into this folder (beside `design.md` and `mockups/`) instead of creating a new one.

```text
/speckit-specify SPECIFY_FEATURE_DIRECTORY=specs/006-sentence-rewrite-redesign

Sentence Rewrite Question Redesign: redesign the student experience of the sentence-rewrite question (spec 005, components/RewritePanel.tsx) so it is clear where the student is, what they are waiting on, and how their final sentence compares with the model. Grading, the 3-mark criteria, the phase-2 cap of 2, the hint rules (only missed or misused terms, or the lost criterion), concept tracking from phase 1 only, the self-mark degrade path and the LLM call limits are all unchanged.

The visual and wording reference is specs/006-sentence-rewrite-redesign/design.md, with mockups in specs/006-sentence-rewrite-redesign/mockups/ (desktop and phone for each state). Read both first. Use the exact on-screen wording from design.md, and put the visual details (sizes, spacing, colours) into the plan, not the spec.

Problems being fixed: while a sentence is being marked the text box is cleared, so the student cannot see what they submitted (first try and retry); nothing tells the student a retry may follow; the retry starts from an empty box; a retry using every term scores 2/3 with praise-only feedback and the cap is never explained; the terms are listed twice and the ending stacks disabled text boxes with no comparison against the model.

The question card has five states:

1. Writing: a step tracker (Write → Retry with hints → Compare), the plain-English sentence, the text box with a word meter, "Submit for marking", and a line saying a missed term earns one retry with hints worth up to 2 marks. The placeholder no longer mentions target terms.
2. Marking first try: the student's sentence stays on screen in place of the text box, locked, with an indeterminate progress bar and a short status list (read, checking terms, writing feedback). The status steps are cosmetic and timed; the last stays in progress until the response arrives. On an error the editable box comes back holding the student's text.
3. Feedback + retry: the first-try mark and feedback, the first-try sentence with the terms the grader credited highlighted, one card per missed or misused term (term and definition only), or a single "What to fix" card when the hint is a lost criterion, and the retry box pre-filled with the first-try sentence for editing, with "Retry is worth up to 2 marks" shown before submitting. The hint must not tell the student which words of the plain-English sentence to replace: no highlighting of the plain-English sentence and no "replaces …" mapping.
4. Marking retry: as state 2, with the first try collapsed to one row and the hint terms shown as pills.
5. Result: a summary of the recorded mark with an outcome line that explains the retry cap (for example "Full marks for a retry — all three terms used." and "A retry can earn at most 2…"), keeping the existing "your better try" wording when phase 1 beat phase 2; the student's final sentence (credited terms highlighted) beside the model sentence (terms in bold); one table of the target terms, each with its definition, the key's "why" text and a status (First try / Added in retry / Not used), replacing both the old hint list and "Why these terms fit"; the first try collapsed; and "Next question". A 3/3 first try skips the retry step.

The self-mark path keeps its behaviour but uses the new layout (sentence locked and visible, model sentence and term table, checkboxes, "Save my mark"). Resuming mid-question shows the saved state; marking states are never restored and no typed text is lost.

New data from grading, display only (never changes marks or concept tracking): for each phase, the words in the student's sentence the grader credited for each target term (so equivalents and other grammatical forms can be highlighted); which terms the retry used correctly; and an optional language note (misspelt words and one short grammar note) for the final sentence, shown with a wavy underline and one line under the sentence. Highlighting credited terms in the first-try sentence reveals them after phase 1 is graded; check this against constitution Principle I's scoped release and amend the constitution's wording if needed. No extra grading calls.

Accessibility: highlights and statuses are never shown by colour alone; marking progress is announced through a live status region; the result summary takes focus when it appears; animations stop under prefers-reduced-motion; touch targets at least 44 px; works at 390 px with no sideways scrolling.

Out of scope: other question types (short answer, multiple choice, essay, photo answers); the quiz header, progress bar and end-of-quiz screens; changes to marks, the criteria, the cap, the hint selection rules, concept tracking or the question bank.

Tests: the submitted sentence stays visible (and is not cleared) while marking, for both phases, and returns to an editable box with the text on error; the retry box starts with the first-try sentence; the hint never contains the plain-English mapping; the result shows the right outcome line for 3/3 first try, a capped retry at 2, a retry below 2, and phase 1 beating phase 2; term statuses come from the phase outcomes; credited-span highlighting ignores spans not found in the sentence; concept results are still counted from phase 1 only; the self-mark path; existing rewrite tests updated for the new wording.

Must comply with constitution 2.12.0.
```

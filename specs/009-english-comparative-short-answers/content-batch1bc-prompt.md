# Spec 009 content task, sub-batches 1b and 1c (the remaining multi-text Question 5s)

For an agent running through OpenRouter. `content-batch1-prompt.md` ("Read first", "Rules learnt from the pilot review", "For each sub-batch, finish with") still applies; this file replaces its sub-batch table and paper notes for 1b and 1c, and wins where they differ. Do ONE sub-batch, then stop for review.

## Already settled by Claude: do not recount or redo

You cannot view page images, so everything that needs looking at a page has been done. **Do not run any line-counting, pixel or image-inspection script.** Use these values exactly.

### Sub-batch 1b (7 questions)

| Question (id) | Marks | Verb | Texts | Type | answerLines (words) |
|---|---|---|---|---|---|
| Abbotsleigh 2024 Q5 (`ab24-q5`) | 6 | compare | Text 5 discursive article (new) fixed + ONE of `ab24-t1`–`t4` | choice, pick 1 | 37 (444) |
| Abbotsleigh 2025 Q5 (`ab25-q5`) | 6 | compare | Text 5 memoir (new) fixed + ONE of `ab25-t1`–`t4` | choice, pick 1 | 38 (456) |
| Ascham 2023 Q5 (`as23-q5`) | 6 | compare | Text 5 illustration (new, visual) + Text 6 nonfiction extract (new) | fixed pair | 48 (576) |
| Barker 2023 Q5 (`bk23-q5`) | 6 | explore | Text 5 nonfiction extract (new) + Text 6 photograph (new, visual) | fixed pair | 45 (540) |
| Cherrybrook Tech 2023 Q5 (`ct23-q5`) | 5 | evaluate | `ct23-t4` (the prose fiction extract) fixed + ONE of `ct23-t1`–`t3` | choice, pick 1 | 44 (528) |
| Cherrybrook Tech 2024 Q5 (`ct24-q5`) | 5 | compare | any TWO of `ct24-t1`–`t4` | choice, pick 2 | 43 (516) |
| Fort St 2024 Q5 (`fs24-q5`) | 5 | compare | Text 5 image (new, visual) fixed + ONE of `fs24-t1`–`t4` | choice, pick 1 | 31 (372) |

### Sub-batch 1c (6 questions, plus one skip to log)

| Question (id) | Marks | Verb | Texts | Type | answerLines (words) |
|---|---|---|---|---|---|
| Knox 2025 Q5 (`kx25-q5`) | 6 | compare | Text 5 prose fiction (new) fixed + ONE of `kx25-t1`–`t4` | choice, pick 1 | 43 (516) |
| North Sydney Girls 2026 Q5 (`nsg26-q5`) | 6 | evaluate | Text 5 prose fiction (new) + `nsg26-t4` | fixed pair | 40 (480) |
| Pymble 2024 Q5 (`py24-q5`) | 6 | compare | any TWO of `py24-t2`, `py24-t3`, `py24-t4` (Text 1 is not allowed) | choice, pick 2 | 38 (456), solid ruled lines |
| St George Girls 2024 Q5 (`sg24-q5`) | 6 | compare | any TWO of `sg24-t1`–`t4` | choice, pick 2 | 48 (576) |
| Sydney Boys 2025 Q5 (`sb25-q5`) | 6 | compare | Text 5 prose fiction (Winch, new) fixed + ONE of `sb25-t1`–`t4` | choice, pick 1 | 59 (708) |
| Sydney Grammar 2024 Q5 (`sgr24-q5`) | 6 | compare | Text 5 letter (new) fixed + ONE of `sgr24-t1`–`t4` | choice, pick 1 | 43 (516) |
| **Girraween 2025 Q5: SKIP** | | | Texts 3 and 4; Text 3 is a real HSC text (Girraween Q3 is already skipped as `hsc_text`) | | log as skipped, reason `hsc_text` |

**Prefixes:** `sg24` is St George Girls 2024 (all four texts in the store). Sydney Girls 2024 is `sgh24`, Sydney Grammar 2024 is `sgr24`, Sydney Boys 2025 is `sb25`. Every text id named above without "(new)" is already in the shared store: point at it and extract nothing. New text ids continue each paper's numbering (`ab24-t5`, `as23-t5`, `as23-t6`, `bk23-t5`, `bk23-t6`, `fs24-t5`, `kx25-t5`, `nsg26-t5`, `sb25-t5`, `sgr24-t5`, …).

**Question wording** must be copied from the paper exactly, including the text-reference line printed under "Question 5" where the paper has one (for example Abbotsleigh's "In your response, make detailed reference to Text 5 AND Text 1 OR 2 OR 3 OR 4." and Fort St 2024's "(You may make reference to the same evidence you employed in previous responses.)").

**Directive verbs:** `explore` (Barker 2023), `evaluate` (Cherrybrook Tech 2023, North Sydney Girls 2026) and "compare and contrast" (Fort St 2024, treat as compare) — list any not in `lib/comparative/rubric.json`'s `directiveVerbs`; do not edit the rubric. For the two "evaluate" questions the model answer must make a judgement, not only compare.

**Fort St 2024** probably includes marking guidelines and a sample answer (the other Fort St papers do): use them if present.

**Ascham 2023:** Text 5 (the illustration) and the start of Text 6 share stimulus page 9; Text 6 has a headline, a standfirst in capitals and continues on page 10. Keep the headline as the title and the standfirst as the first paragraph, as printed.

## New visual texts: use these descriptions verbatim

Written by Claude from the page images. Set each as the text's `description`, and crop the image as before (from the stimulus page named).

`as23-t5` (Ascham 2023 Text 5 – Illustration, stimulus page 9):
> A colour digital illustration in warm orange, yellow and brown tones. A man is shown in profile from the shoulders up, facing the viewer's left, with short reddish-brown hair and a dark high-necked top. A black leather harness is strapped around his head, with straps over the top and back of the head and under the chin fastened by small gold studs; it holds a large black rectangular patch that covers his eyes and the upper part of his face, like a horse's blinder. Around him, on a pale yellow background, float flat icons in orange and brown: a Wi-Fi signal symbol (top left); a Facebook 'f' logo with a notification badge showing '7' (left); a TikTok logo (bottom left); a 'skip forward 10 seconds' symbol (upper centre-left); a large double rewind arrow (centre left); speech bubbles (right and top right); game-controller buttons marked with a triangle, square, circle and cross (top right); and a large round play button (bottom right). Printed beneath: 'Illustration by Eric Chow, from The Guardian'.

`bk23-t6` (Barker 2023 Text 6 – Photograph, stimulus page 8):
> A colour photograph, portrait format, taken outdoors on bare, dark-brown earth. A young boy stands in the centre facing the camera, upright and still, arms at his sides. He wears a grey respirator-style mask over his nose and mouth, a long-sleeved off-white top printed with a cartoon animal, blue jeans with side pockets and flip-flops; his clothes look dusty. A thin clear plastic tube runs from his mask down to the ground at the viewer's left, where it ends at a small seedling with bright green leaves in a pot partly wrapped in a white plastic bag. Behind him a cloud of brown dust rises from the ground across the middle of the frame, blurring the dark green trees and bushes in the background, which are out of focus. The colours are muted browns and greens; the small green plant is the brightest colour in the picture. There is no text in the image.

`fs24-t5` (Fort St 2024 Text Five – Image, stimulus page 8):
> A colour photograph, landscape format, taken indoors at eye level. A young woman with long reddish-brown hair, in a loose white blouse and dark trousers, sits upright in a green-and-white striped armchair in the centre of the frame, hands resting on her knees, looking straight at the camera with a still, unsmiling expression. In front of her, on a glass-topped coffee table, is a round chocolate cake on a white plate with about a dozen lit birthday candles, and a cake knife beside it; the candle flames are reflected in the glass. Behind her a long window with a black metal balcony railing looks out on tall grey apartment towers close by, filling the background. The light is dim and cool, mostly grey and blue-green, apart from the warm glow of the candles. No one else is in the room. Printed beneath: 'NEWSHA TAVAKOLIAN'.

## Everything else

As in `content-batch1-prompt.md`: verbatim new texts (curly quotes, en and em dashes, stanza breaks as printed, footnotes as "word: definition"), HSC check of every new text, school criteria and sample where they exist (otherwise drafted bands restating the question and a drafted model answer that doesn't share a 60-character run with the question), the model-answer check (3 runs with the texts of its pairing; report the marks and completion/reasoning tokens per run), the description check for the three new visuals, then validate, tsc, test, build and unseen-report with timeout-and-log commands (log names without a trailing semicolon), a "Comparative, Batch 1b" or "1c" section in `ALL-REVIEW.md` with empty boxes, and stop. Never run the same command more than twice; write "UNCERTAIN: …" in the review section and move on. Do not set `reviewedOn`, commit or push.

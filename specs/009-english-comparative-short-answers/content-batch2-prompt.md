# Spec 009 content task, Batch 2 (the multi-text Questions 1–4)

For an agent running through OpenRouter. Paste the short message at the bottom of `content-batch1-prompt.md`'s instructions, changed to "Batch 2". This file is the full instruction; `content-batch1-prompt.md` ("Read first" and "Rules learnt from the pilot review") still applies, and this file wins where they differ.

Nine questions, in two sub-batches. Do ONE, then stop for review.

| Sub-batch | Questions |
|---|---|
| **2a** | Barker 2026 Q4, James Ruse 2026 Q4, Kambala 2025 Q2, Kambala 2026 Q2, North Sydney Girls 2025 Q3 |
| **2b** | North Sydney Boys 2025 Q3, Shore 2024 Q2, Sydney Boys 2024 Q4, Sydney Girls 2024 Q1 |

Never: Cheltenham Girls 2023 Q1 (frozen holdout) and North Sydney Boys 2024 Q4 (no stimulus booklet).

## Already settled by Claude: do not recount or redo

You cannot view page images, so everything that needs looking at a page has been done for you. **Do not run any line-counting, pixel or image-inspection script.** Use these values exactly.

| Question | Marks | Texts | Type | answerLines (words) |
|---|---|---|---|---|
| Barker 2026 Q4 | 5 | Text 4 poem, Text 5 prose fiction | fixed pair | 44 (528) |
| James Ruse 2026 Q4 | 6 | Text 4 poem, Text 5 image | fixed pair | 40 (480) |
| Kambala 2025 Q2 | 7 | Text 1 magazine cover, Text 2 poem | fixed pair | 60 (720) |
| Kambala 2026 Q2 | 5 | Text 2 theatre poster, Text 3 theatre poster | fixed pair | 46 (552) |
| North Sydney Girls 2025 Q3 | 4 | Text 3 photograph, Text 4 poem | fixed pair | 23 (276) |
| North Sydney Boys 2025 Q3 | 7 | Text 3 memoir extract, Text 4 fiction extract | fixed pair | 21 (252), solid ruled lines, no additional space |
| Shore 2024 Q2 | 8 | Text 2 article extract fixed, plus ONE of Texts 1, 3, 4 | choice, pick 1 | 55 (660): 23 + 26 + 6 |
| Sydney Boys 2024 Q4 | 8 | Text 4 and Text 5 | fixed pair | 44 (528) |
| Sydney Girls 2024 Q1 | 6 | Text 1 poem, Text 2 prose fiction | fixed pair | 45 (540) |

(The Kambala counts exclude the "Student Number: ____" page header, which pdftotext reports as a line.)

**Texts already in the shared store** (point at them; extract nothing): `bk26-t4`, `bk26-t5` are NOT in the store but are verified in `resources/english-unseen/pilot-comparative.json` (copy them from there with their curly quotes and Cavafy's stanza break); `km25-t1` (Kambala 2025 magazine cover, with its checked description); `sh24-t1`, `sh24-t3`, `sh24-t4`; Sydney Girls 2024 Texts 1 and 2 are NOT in the store: Sydney Girls 2024 uses the prefix `sgh24` (`sgh24-t3` to `sgh24-t5` exist), so extract them as `sgh24-t1` and `sgh24-t2`; `sg24-*` is St George Girls 2024, a different paper. Everything else is a new extraction.

**Barker 2026 Q4** is the pilot question `bk26-q4`: copy its criteria, notes, suggested length and `-model` answer (origin drafted) from `pilot-comparative.json`; do not redraft.

**New visual texts: use these descriptions verbatim** (written by Claude from the page images; set them as the `description`; crop the image as before):

`jr26-t5` (James Ruse 2026 Text 5 – Image, stimulus page 8):
> A colour cartoon illustration, square format, of a three-step winners' podium against a pale green background. The podium is dark navy blue with large white numbers on its front: '2' on the left step, '1' on the tall centre step and '3' on the lowest step at the right. On the centre step stands a bald man with a large nose, in a blue T-shirt and tan shorts, wearing a gold medal; his arms hang at his sides and he frowns down towards the viewer's right. On the left step a young man with brown hair, in a yellow T-shirt and blue shorts, stands with his hands behind his back, wearing a gold medal and frowning sideways towards the viewer's right. On the right, a third man in a pink long-sleeved top, with a medal hanging from his neck, bends over the front of the podium holding a stick of white chalk. A white '+' sign has been chalked between the '2' and the '1', and he is chalking two short strokes between the '1' and the '3', so that the numbers would read '2 + 1 = 3'. Printed beneath the image: 'Source: Unknown'.

`km26-t2` (Kambala 2026 Text 2 – Theatre Poster: TARTUFFE, stimulus page 3):
> A theatre poster, portrait format. Across the top is a black band with large white, rough-edged capital letters reading 'TARTUFFE', and 'MOLIERE'S' in small yellow capitals above the first letters. Below the band a line of small black capitals reads: 'BEGINNING DECEMBER 1 • THE EMPTY SPACE THEATRE • 919 E. PIKE • 325-4443 • TRANSLATION BY ROGER DOWNEY'. The rest of the poster is a flat, bright yellow background. In the centre stands a tall figure in a long black coat, made from a grainy black-and-white photograph, whose head is replaced by an old-fashioned television set; the screen shows, in pink and red, the face of a smiling man looking upwards. The figure holds a white cross against his chest with one hand and stretches his other arm out wide towards the viewer's right, palm open. Around his legs stand five much smaller figures in dark coats and hats, also from grainy black-and-white photographs, who look up at him; one on the left wears a white armband marked with a cross. Tiny vertical printer's text along the right edge is not legible.

`km26-t3` (Kambala 2026 Text 3 – Theatre Poster: MACBETH, stimulus page 4):
> An opera poster, portrait format, in muted olive and yellow-green tones. It shows the inside corner of a bare room seen from above: two cracked, stained walls meet a floor. In the lower left two tiny dark human figures stand side by side on the floor. From them, two huge dark shadows stretch up across the floor and onto the walls, far larger than the figures: the left shadow is broad-shouldered and wears a tall, notched crown; the right shadow is narrower and taller and is also topped by a smaller notched crown. At the top right is '2014/2015'. Across the lower part, large white distressed capitals read 'MACBETH', with 'VERDI' set vertically in smaller letters to its left. Beneath, in three columns: 'OPERA / NAGYSZÍNHÁZ', 'RENDEZTE / GALGÓCZY JUDIT', 'BEMUTATÓ / 2014. OKTÓBER 3.', and at the bottom right a red box with a small drawing of a building and the words 'SZEGEDI NEMZETI SZÍNHÁZ'. A strip of sponsor logos and very small print runs across the bottom, with the web address 'www.szinhaz.szeged.hu'.

`nsg25-t3` (North Sydney Girls 2025 Text 3 – Photograph, stimulus page 4):
> A black-and-white photograph of a bare interior wall. On the left stands a modern, boxy drinking fountain with a white enamel top on a dark cabinet, with a small sign on the wall above it reading 'WHITE'. On the right, a small, plain basin is fixed to the wall, with a stained bowl and a sign above it reading 'COLORED'; the two are joined by the same exposed pipe running along the wall between them. A Black man in a hat and a light short-sleeved shirt bends over the right-hand basin to drink, his face turned slightly towards the camera, at the right edge of the frame. Printed beneath the photograph: 'ELLIOT ERWIIT' and the title 'Segregated Water Fountains' (the photographer's name is spelled as printed).

**Directive verbs:** Shore 2024 Q2 is "To what extent have TWO composers offered insights…" (evaluative: list it if `to what extent` is not in the comparative rubric's verbs). Kambala 2025 Q2 asks how the composers "use their forms"; like Fort St 2023 Q5, its model answer must analyse form-specific features (cover design conventions; the poem's lineation, stanza form, sound), not only language techniques, or the marker will mark it down.

**HSC check** every new text's author and title as before (`resources/english-unseen/hsc-texts.json`), including Langston Hughes "I, Too" (North Sydney Girls 2025 Text 4) and the Erwitt photograph.

## Finish each sub-batch as in content-batch1-prompt.md

Bank files, rebuild, model-answer check (3 runs each, the texts of its pairing; report tokens per run), description check for the four new visuals, then validate, tsc, test, build and unseen-report with timeout-and-log commands (log names without a trailing semicolon), a "Comparative, Batch 2a/2b" section in `ALL-REVIEW.md` with empty boxes, and stop. Never run the same command more than twice; write "UNCERTAIN: …" in the review section and move on. Do not set `reviewedOn`, commit or push.

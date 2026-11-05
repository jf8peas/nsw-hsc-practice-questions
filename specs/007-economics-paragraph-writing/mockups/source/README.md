# Mockup sources

The `.dc.html` files and `canvas.json` are copied unchanged from the Claude Design canvas
"Writing Practice — paragraph writing screens" (https://claude.ai/artifact/4yQJhH1Qt55akUfRQxpxsP,
version 1793824899-f6b3, 5 Nov 2026). Each file matches the canvas byte for byte (sha256 checked).

| Screen | Desktop 1280 | Phone 390 | PNG |
|--------|--------------|-----------|-----|
| 1 Unit page | `Main.dc.html` | `MainPhone.dc.html` | `../1-unit-*.png` |
| 2 Writing a part | `Writing.dc.html` | `WritingPhone.dc.html` | `../2-writing-*.png` |
| 3 Marking | `Marking.dc.html` | `MarkingPhone.dc.html` | `../3-marking-*.png` |
| 4 Phase 1 result + correction | `Correction.dc.html` | `CorrectionPhone.dc.html` | `../4-correction-*.png` |
| 5 Discussion | `Discussion.dc.html` | `DiscussionPhone.dc.html` | `../5-discussion-*.png` |

They render with `design/v001/support.js` copied beside them (as in spec 006): each file loads
`./support.js`, which loads React 18.3.1 from unpkg and the Google fonts (Bricolage Grotesque,
Geist, Geist Mono). `support.js` is not copied here; copy it in to view the files locally.

The PNGs in `../` were rendered from these files at 2x in headless Chrome, full page, with reduced
motion.

These are static comps, not components. Figures in the brief and the student's text are
placeholders (`US$x bn`, `x`, `year`) until the content task supplies verified figures.

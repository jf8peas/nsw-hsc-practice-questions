# Y12 Physics Advanced Mechanics — topic quiz research

Unit: `y12-physics-advanced-mechanics` — Module 5 **Advanced Mechanics** of the
NSW Physics Stage 6 Syllabus (2017), examined in the **2027 HSC** (the last HSC
on the 2017 syllabus). 5 multiple-choice + 4 short-answer per attempt, drawn
from a bank of 180 + 180 (36 non-repeating attempts). MC is 1 mark; short
answers are 2–12 marks and LLM-graded. The draw is weighted like the HSC:
about half gravitation, a third projectiles and a fifth circular motion.

## What the unit is

Every question is copied **word for word** from a NSW school trial or
half-yearly paper, with its source shown (school, year, paper, question
number) — constitution Principle V. **No HSC questions are used**, so past HSC
papers stay unseen for full practice. The 2017 Module 5 content is tested,
including torque and banked tracks; 2025-only dot points are out.

## Sources

- **Syllabus:** `resources/topic006/01b-syllabus-2017-module5.md` — the 2017
  Module 5 dot points (the 2027 HSC syllabus). `resources/topic004/NESA -
  physics_11_12_2025 (S6).pdf` is the current 2025 syllabus, used for
  reference only.
- **Question bank:** `resources/y12_physics_trial_exams/` (71 trial papers,
  2008–2025) and `resources/y12_physics_interim_exams/` (24 half-yearly /
  interim papers, 2005–2024). Questions are copied verbatim; new questions are
  written only to fill syllabus gaps.
- **Weightings:** `resources/y12_physics_hsc_exams/` — six HSC Physics papers
  (2020–2025) and their marking guidelines, used only to calibrate the mix of
  areas and question types (never as question sources).

## Approach

- **Verbatim school questions with the source shown.** Option letters are
  removed (the app shuffles options); picture options become "Diagram A"…
  "Diagram D" with the redrawn diagram labelling its panels; tables in the
  stem become an SVG table or one line of option text per row.
- **No HSC questions.** The HSC papers are used only for weighting and style
  calibration (`resources/topic006/02-hsc-weightings.md`).
- **Excluded at the owner's request:** Sydney Boys half-yearly papers and the
  Sydney Boys 2020 trial.
- **Every answer is worked independently** and checked against the school's
  key where one could be found; a question whose key gives two answers, or
  whose keyed answer is wrong, is replaced (see the transcription log).
- **Diagrams are redrawn in code** by a per-unit `diagram.ts` (never scanned):
  orbits, ellipses, banked tracks, force diagrams, graphs and tables.
  Photographs are dropped or replaced with simple redrawings (e.g. the
  carousel photo in s157, the rotor photo in s170, the Cassini photo in s028).

## Bank selection and weighting

The bank is 180 MC + 180 SA: **gravitation 90/90, projectile motion 54/54,
circular motion 36/36** — matching the HSC's roughly 50% / 30% / 20% split of
core Module 5 marks (2020–2025). Within each area the questions cover the 2017
dot points, with the recurring HSC question types well represented:

- **Gravitation:** comparing orbits (speed, period, energy), Kepler's laws and
  T² ∝ r³, escape velocity, energy conservation with U = −GMm/r, g = GM/r²,
  geostationary orbits, work done by gravity, weightlessness.
- **Projectiles:** independence of horizontal and vertical motion, constant
  horizontal velocity, time of flight and range, velocity components, graphs,
  air resistance, energy, and the standard assumptions.
- **Circular motion:** centripetal force and acceleration, v = ωr and period,
  banked tracks, conical pendulums, vertical circles, torque, work in circular
  motion, friction providing the centripetal force, and investigations.

The selection is recorded in `resources/topic006/04-selection.tsv` (every
candidate with its decision and reason) and the final id map in
`resources/topic006/05-id-map.tsv` (m001–m180, s001–s180; ids are fixed and
never renumbered).

## Pipeline files

`resources/topic006/` holds the whole build:

| File | Contents |
| --- | --- |
| `00-sources.md` | sources and the verbatim-question policy |
| `01b-syllabus-2017-module5.md` | the 2017 Module 5 dot points |
| `02-hsc-weightings.md` | area and question-type weightings from the 2020–2025 HSC |
| `02-hsc-mod5-items.tsv` | item-by-item HSC classification |
| `03-question-pool.*` | the pool of candidate school questions |
| `04-selection.tsv` | every candidate with its keep/drop decision and reason |
| `05-id-map.tsv` | the final id map (m001–m180, s001–s180) |
| `06-transcription-log.md` | every change beyond layout, and how each answer was checked |

## Errata

The transcription log records every change beyond layout. The notable ones:

- **Sydney Boys 2019 Trial, Q22 (s173):** the school's key prints "sin 15" but
  its value (1158 kg) comes from **tan 15°**, which is the correct relation;
  the model answer uses tan 15°.
- **North Sydney Boys 2019 Trial, Q13 (m054):** the paper's orbital radius
  "1.07 × 10³ km" is a typo for 1.07 × 10⁶ km (Ganymede's real orbital
  radius); the school's keyed 1.61 × 10²⁵ N only follows from the typo, and
  with the corrected radius the answer is 1.61 × 10²² N, one of the options.
- **James Ruse 2020 Trial, Q21 (replaced):** the graph's axis scale gives
  Jupiter a mass ten times too small; the school key reaches the right mass
  only through an arithmetic slip.
- **Girraween 2023 Trial, Q23 (replaced):** part (b) can't be answered as
  printed — the school's key relies on an assumption that appears only in the
  marking guide.
- **Baulkham Hills 2023 Trial, Q7 (replaced):** the school key marks two
  answers (A and C).
- **Newington 2024 Trial, Q17 (replaced):** the keyed answer assumes speed
  ∝ 1/r, but the orbit points are not the apsides, so the data do not fix the
  speed.
- **Sydney Boys 2019 Trial, Q1 (replaced):** the keyed graph is wrong for
  launch angles 0–90° (time of flight increases all the way to 90°).
- **Shore 2020 Trial, Q2 (replaced):** two defensible answers (graph A and the
  keyed graph C).
- **Girraween 2024 Trial, Q24 (replaced):** part (b)'s data are inconsistent
  with Earth's mass, and the parts total 9 marks while the question says 8.
- **North Sydney Girls 2020 Trial, Q25 (replaced):** part (b) asks students to
  derive v = √(Gm/r), which is wrong by a factor of 2 (the balls are 2r apart).
- **Sydney Boys 2025 Trial, Q24 (replaced):** over-constrained — equal ranges
  and B landing with A cannot both hold.
- **Penrith 2019 Trial, Q21 (replaced):** the keyed answer assumes the cliff
  top is the highest point of the path, which is not the minimum.
- **Knox 2023 Common Test 1, Q2 (replaced):** the graph's energy values don't
  match Earth's mass, and two of the three parts are drawing tasks.
- **Caringbah 2020 Trial, Q38 (replaced):** part (a) asks the student to plot
  a graph, and the table's 1/d² column has errors.
- **Gosford 2022 Trial, Q26 / Newington 2023 Trial, Q23 / Shore 2019 Trial,
  Q24 (replaced):** parts ask the student to plot a graph, which can't be done
  in the app.
- **James Ruse 2021 Trial, Q32 (replaced):** mostly Module 8 content.
- **Normanhurst Boys 2021 Trial, Q29 (replaced):** part (b) is Module 7
  (time dilation).
- **Kotara 2020 Trial, Q12 (replaced):** options C and D both give a valid
  method.
- **Normanhurst Boys 2020 Trial, Q7 (replaced):** the school key is blank and
  the keyed-looking option depends on an altitude the question never gives.
- **Girraween 2020 Trial, Q1 (replaced):** two options are correct.
- **Hornsby Girls 2021 Trial, Q6 (replaced):** a projectile launched straight
  up has zero horizontal velocity, but all four graph pairs show a non-zero
  v_x.
- **Gosford 2022 Trial, Q25 (replaced):** the data are only in a strobe
  picture with no scale and no launch height.
- **Caringbah 2020 Trial, Q29 (replaced):** the data needed are only in a
  long-jump photograph that can't be redrawn faithfully.
- **James Ruse 2021 Trial, Q34 (replaced):** mostly mass defect and momentum
  of a decaying nucleus.

Where a kept question's wording is loose, the model answer says so (e.g. m021
"decrease by a factor of 2" for U becoming twice as negative; m119's option
wording; s097 part (e)'s keyed answer assuming the balloon falls freely; s123's
0.42 s not quite matching the 1.0 m drop; s169's key printing the mass as
0.85 kg while its answer uses 85.0 kg).
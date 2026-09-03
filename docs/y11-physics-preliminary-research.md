# Y11 Physics Preliminary — milestone test research

Unit: `y11-physics-preliminary` — broad revision for the **Physics Y11
Preliminary** exam. 5 multiple-choice + 5 short-answer per attempt, drawn from a
bank of 50 + 50 (10 non-repeating attempts). MC is 1 mark; short answers are
2–4 marks and LLM-graded.

**Every question is factual or reasoning-based — no calculations**, because the
student sitting this test cannot perform calculations.

## Sources

- **Syllabus:** `resources/topic004/NESA - physics_11_12_2025 (S6).pdf` — the
  current NESA Physics 11–12 Syllabus. Year 11 is three focus areas:
  1. **Fundamentals of mechanics** — quantities of motion (scalars/vectors,
     distance/displacement, speed/velocity/acceleration), motion graphs
     (displacement–time, velocity–time, acceleration–time), uniformly
     accelerated motion, relative velocity, Newton's three laws, free-body
     diagrams, friction (static vs kinetic), inclined planes, work, kinetic and
     gravitational potential energy, conservation of mechanical energy,
     conservation of momentum, elastic vs inelastic collisions, impulse.
  2. **Waves** — transverse vs longitudinal, wave properties (wavelength,
     frequency, period, amplitude, crest/trough, compression/rarefaction),
     `f = 1/T` and `v = fλ`, displacement graphs, mechanical waves needing a
     medium, sound, light as an EM wave, the EM spectrum, the inverse-square
     law, reflection, refraction (refractive index, Snell's law, TIR, critical
     angle), ray diagrams, diffraction, superposition and interference,
     standing waves (nodes/antinodes), the Doppler effect (blueshift/redshift).
  3. **Electricity and magnetism** — electrostatics (charging by friction /
     induction / conduction, electric fields and field lines, Coulomb's law,
     parallel plates `E = V/d`, electric potential energy and work), electric
     circuits (current, conventional current vs electron flow, DC vs AC,
     resistance and its dependence on material/length/area/temperature, Ohm's
     law, power, series vs parallel, ammeters and voltmeters), magnetism (field
     lines, bar magnet / straight wire / loop fields, `B = μ₀I/2πr`, solenoids,
     electromagnets).
- **Past prelim exams:** `resources/y11_physics_year_end_exam/` — ten NSW
  Physics preliminary yearly papers (2018–2024). Used for **question style,
  scope and difficulty calibration only**; questions in the bank are original.

## Approach

Questions are original, written to the 2025 syllabus dot points in the
command-word style of a NSW preliminary exam ("Distinguish…", "Explain…",
"Describe…", "State…"). Because the student cannot calculate, the equations
(`Fnet = ma`, `v = fλ`, `V = IR`, Coulomb's law, etc.) appear only as the basis
of **reasoning** questions — e.g. "if the net force is unchanged and the mass
is larger, the acceleration is…", "if frequency doubles at constant speed, the
wavelength…".

Diagrams are generated as inline SVG by a per-unit `diagram.ts`:

| Builder | Used for |
| --- | --- |
| `motionGraph` | velocity–time and displacement–time graph interpretation |
| `forces` | free-body / balanced-forces questions |
| `wave` | labelling wavelength and amplitude on a transverse wave |
| `rays` | refraction / total internal reflection at a boundary |
| `chargeField` | reading the sign of a charge from field lines |

## Coverage

Roughly even across the three modules — ~17 MC + ~17 SA on mechanics, ~16 each
on waves, ~17 each on electricity and magnetism.

# Y11 Formula Test — question research

Source material:

- **Formulas:** `resources/topic001/y11-formula-sheet.pdf` — the NESA Physics
  formulae sheet with the teacher's crossings-out. The data sheet and periodic
  table are ignored. Crossed-out formulas are **excluded** (see list below).
- **Question styles:** the 10 papers in `resources/y11_year_end_exam/`. Six had
  extractable text and were read in full with their solutions: Girraween 2024,
  James Ruse 2020, Sydney Boys 2020, Fort St 2022, Hornsby Girls 2020, Hornsby
  Girls 2022 (plus Baulkham Hills 2020 partial). Normanhurst 2019, Baulkham Hills
  2018 and Sydney Grammar 2019 are scans and were sampled only where possible.

`resources/` is gitignored (copyrighted papers). This file is the durable
artefact.

---

## Formulas in scope (NOT crossed out)

### Motion, forces and gravity

| Formula | Name |
| --- | --- |
| `s = ut + ½at²` | displacement under uniform acceleration |
| `v² = u² + 2as` | velocity–displacement (uniform acceleration) |
| `v = u + at` | velocity–time (uniform acceleration) |
| `F_net = ma` | Newton's second law |
| `ΔU = mgΔh` | change in gravitational PE (uniform field) |
| `W = Fs cosθ` | work done by a force |
| `K = ½mv²` | kinetic energy |
| `P = ΔE/Δt` | power as rate of energy transfer |
| `P = Fv cosθ` | power delivered by a force |
| `Σ½mv²_before = Σ½mv²_after` | conservation of KE (elastic collisions) |
| `Σmv_before = Σmv_after` | conservation of momentum |
| `Δp = F_net·Δt` | impulse–momentum theorem |
| `U = −GMm/r` | gravitational PE (universal) |

### Waves and thermodynamics

| Formula | Name |
| --- | --- |
| `v = fλ` | wave equation |
| `f = 1/T` | frequency–period |
| `n = c/v` | refractive index (from wave speed) |
| `Q = mcΔT` | specific heat |
| `f_beat = |f₂ − f₁|` | beat frequency |
| `f' = f (v_wave + v_obs)/(v_wave − v_src)` | Doppler effect |
| `n₁ sinθ₁ = n₂ sinθ₂` | Snell's law |
| `sinθ_c = n₂/n₁` | critical angle |
| `I₁r₁² = I₂r₂²` | inverse-square law for intensity |
| `Q/t = kAΔT/d` | thermal conduction |

### Electricity and magnetism

| Formula | Name |
| --- | --- |
| `E = V/d` | uniform electric field between plates |
| `V = ΔU/q` | electric potential difference |
| `W = qV` | work to move charge through a potential difference |
| `W = qEd` | work on a charge in a uniform field |
| `B = μ₀I / 2πr` | magnetic field around a straight wire |
| `F = qE` | force on a charge in an electric field |
| `F = (1/4πε₀)(q₁q₂/r²)` | Coulomb's law |
| `I = q/t` | current as rate of flow of charge |
| `V = IR` | Ohm's law |
| `P = VI` | electrical power |
| `F = qvB sinθ` | force on a moving charge in a magnetic field |
| `F = lIB sinθ` | force on a current-carrying conductor |
| `F/l = (μ₀/2π)(I₁I₂/r)` | force between parallel conductors |

### Crossed out — DO NOT test

`ω = Δθ/t`, `τ = rF sinθ`, `v = 2πr/T`, `a_c = v²/r`, `F_c = mv²/r`,
`F = GMm/r²`, `r³/T² = GM/4π²`, `d sinθ = mλ`, `I = I_max cos²θ`,
`B = μ₀NI/L`, `Φ = BA cosθ`, `ε = −N ΔΦ/Δt`, `V_p/V_s = N_p/N_s`,
`τ = nIAB sinθ`, `V_p I_p = V_s I_s`, and the **entire** "Quantum, special
relativity and nuclear" section.

Note the teacher kept `U = −GMm/r` but crossed `F = GMm/r²`; kept the
moving-charge / current-wire magnetic forces but crossed the solenoid field and
all of induction/transformers. Follow the markings exactly.

---

## MC scenario bank — "which question could this formula answer?"

Every MC in the exams that tests formula selection follows the same shape: a
short real-world scenario with numbers, and the student picks the formula (or,
inverted, picks the scenario a given formula fits). Distractors are scenarios
that fit a *different* sheet formula. Below: the scenario phrasings seen per
formula, to draw the "correct option" and the distractors from.

### Kinematics (`s = ut + ½at²`, `v² = u² + 2as`, `v = u + at`)

- "A landing strip must be long enough for a plane to reach take-off speed of
  70 m/s accelerating at 3.0 m/s² from rest — minimum length?" (Fort St Q14 →
  `v² = u² + 2as`)
- "An object accelerates at 5 m/s² for 6 s and reaches 20 m/s — initial
  velocity?" (Sydney Boys Q3 → `v = u + at`)
- "A book slides 80 cm from rest in 1.25 s down a tilted desk — acceleration?"
  (Fort St Q21 → `s = ut + ½at²`)
- "A car brakes from 60 km/h to rest in 5.5 s — acceleration?" (Hornsby 2022 Q2
  → `v = u + at`)
- "A ball thrown up at 8.0 m/s — maximum height?" (Hornsby 2022 Q3 →
  `v² = u² + 2as`)
- "Distance travelled between 10 s and 20 s from a v–t graph" — area under graph,
  not a formula pick (exclude).
- Braking / stopping-distance problems (James Ruse Q24): reaction distance
  `s = ut`, braking distance `v² = u² + 2as`.

Distractor scenarios for kinematics items: a force question (`F = ma`), an
energy question (`K = ½mv²`), a momentum question (`p = mv`).

### `F_net = ma`

- "Net force on a 1200–2000 kg car accelerating at a given rate" (Girraween Q20a,
  generic).
- "Two blocks pushed by 200 N on a frictionless surface — force of block B on
  block A" (Girraween Q8: `F = ma` on the system then on one block).
- "A 10 kg block pulled up by a rope accelerating at 5 m/s² — tension?" (James
  Ruse Q7 → `F_net = ma` with weight).
- "Net force on a box accelerating at 2.0 m/s²" (Fort St Q30).
- "Acceleration of a boat sliding down a 10° frictionless ramp" (Girraween Q19a →
  `a = g sinθ`, i.e. `F_net = ma`).

Distractors: "find the car's speed after 5 s" (`v = u + at`), "find the work done
by the force over 600 m" (`W = Fs`), "find the momentum" (`p = mv`).

### `ΔU = mgΔh`

- "A person lifts a 5 kg bag of groceries from the floor to a benchtop — work
  done ≈ ?" (Sydney Boys Q5 → `W = mgh`).
- "A clown is projected 3 m up; a person jumps from a 1.5 m box onto a device —
  mass of the jumper?" (Girraween Q15 → equate `mgh` values).
- "GPE gained lifting a package / raising a mass through a height."

Distractors: kinetic energy of the same object (`K = ½mv²`), work done against
friction (`W = Fs`), power to lift it in a given time (`P = ΔE/Δt`).

### `W = Fs cosθ`

- "Work done by a 1200 N driving force as a car moves 600 m" (Fort St Q2 →
  `W = Fs`).
- "Work to move a charged mass 0.5 cm against the field" (Girraween Q24d →
  `W = Fd = qEd`, cross-links to E&M).
- "Work done by a winch pulling a boat 2.25 m up a ramp" (Girraween Q19b, feeds
  a power calc).

Distractors: `ΔU = mgΔh` for a vertical lift, `K = ½mv²`, `P = Fv`.

### `K = ½mv²`

- "Kinetic energy of a 5 kg object moving at 4 m/s."
- "Initial KE of a 2000 kg car at 15 m/s to decide if a collision is elastic"
  (Girraween Q20c, Fort St Q22a).
- "KE of the smaller mass after both are pulled the same distance" (James Ruse
  Q8, conceptual).

Distractors: momentum `p = mv`, GPE `mgΔh`, work `Fs`.

### `P = ΔE/Δt`

- "Minimum effective power of a kettle that boils 500 mL of water in 1 min 35 s"
  (Girraween Q22a → `P = mcΔT / t`, links to `Q = mcΔT`).
- "A 38 kg student climbs stairs in 4.5 s — power?" (Hornsby 2020 Q11).
- "Power required to accelerate a 2250 kg car 0→100 km/h in 3.00 s" (Hornsby 2022
  Q5).
- "Energy dissipated by a heating coil (5.0 Ω, 6.0 A, 1 min)" (Girraween Q5 →
  `P = I²R` then `E = Pt`; links to `P = VI`, `V = IR`).

Distractors: `W = Fs` (work, not power), `K = ½mv²`, `P = Fv` (needs a speed,
not a time).

### `P = Fv cosθ`

- "Power output of a motor pushing a vehicle at constant speed against a known
  resistive force."
- "Minimum power of a winch raising a boat at a steady speed up a ramp"
  (Girraween Q19b, alternative route).

Distractor: `P = ΔE/Δt` (given energy and time instead), `W = Fs`.

### `Σmv_before = Σmv_after` (conservation of momentum)

- "A 3 kg mass at 0.4 m/s collides with a stationary 1.5 kg mass — momentum of
  the 1.5 kg mass afterwards" (Girraween Q14).
- "A 5.5 kg explosive splits into three pieces with known momenta for two —
  momentum of the third" (Fort St Q8).
- "Two balls collide head-on; find the final velocity of ball B" (Sydney Boys
  Q15, James Ruse Q28, Fort St Q28).
- "Recoil / rebound speed after a collision."

Distractors: `K = ½mv²` (energy, used to *classify* the collision, not find the
unknown velocity), `Δp = FΔt`, `F = ma`.

### `Σ½mv²_before = Σ½mv²_after` (elastic-collision KE conservation)

- "Is this collision elastic or inelastic? Justify by comparing total KE before
  and after" (Girraween Q20c, Fort St Q22a, Sydney Boys Q15, James Ruse Q21).
- "A ball dropped from 1 m rebounds to 1 m — is KE conserved?" (James Ruse Q21).

Distractors: conservation of momentum scenario, `Δp = FΔt`.

### `Δp = F_net·Δt` (impulse)

- "Force–time graph of a crash; area under the graph = impulse; find the impact
  speed of a 2000 kg car" (Girraween Q20b).
- "A ball's force–time graph — magnitude of the change in velocity" (Fort St Q3).
- "Impulse given to a 0.5 kg ball by gravity in the 0.80 s it falls" (Hornsby
  2022 Q9).
- "Average force on each car given contact time 0.40 s and known Δv" (Fort St
  Q22b, James Ruse-style).

Distractors: `F = ma` (needs acceleration, not a time interval), `W = Fs`,
`K = ½mv²`.

### `U = −GMm/r`

- "Gravitational potential energy of a satellite/mass at distance r from a
  planet of mass M."
- "Change in gravitational PE moving a mass from r₁ to r₂ far from Earth"
  (contrast with `ΔU = mgΔh` which is only valid near the surface).

Distractors: `ΔU = mgΔh` (uniform-field version — the near-surface distractor),
`K = ½mv²`, `F = GMm/r²` (crossed out — do NOT use as the correct answer, but it
is a tempting distractor phrased as "force between the masses").

### `v = fλ`

- "A radio wave of frequency 3.3 × 10⁷ Hz — wavelength?" (Hornsby 2020 Q3,
  Baulkham 2020 Q4).
- "Light of frequency 4.5 × 10¹⁴ Hz — wavelength in air?" (Sydney Boys Q14).
- "Which wave has the shortest wavelength?" given frequencies/speeds (Fort St
  Q19).
- "Speed of a wave from a frequency and wavelength" / "driving frequency for
  resonance in a 45 cm closed tube" (Sydney Boys Q26b → `λ` from tube length,
  then `v = fλ`).

Distractors: `f = 1/T`, `f_beat`, `n = c/v`.

### `f = 1/T`

- "Period of a wave from a CRO trace at 2.0 ms/division" (Fort St Q20).
- "Frequency of a wave whose period is read from a graph" (Sydney Boys Q20-style).

Distractors: `v = fλ`, `f_beat = |f₂ − f₁|`.

### `n = c/v`

- "Refractive index of a medium in which light travels at a given speed."
- "Speed of light in a medium of refractive index 1.48" (Girraween Q9-style, via
  `n = c/v`).

Distractors: Snell's law `n₁ sinθ₁ = n₂ sinθ₂` (needs angles), `sinθ_c = n₂/n₁`.

### `Q = mcΔT`

- "Energy to raise 2 kg of water by 10 °C."
- "Final equilibrium temperature of a hot metal block in cooler water" (Sydney
  Boys Q29, Girraween Q22b — `Q_lost = Q_gained`).
- "Specific heat of an unknown metal from mixing data" (Sydney Boys Q29b).
- "Minimum power of a kettle" (Girraween Q22a → `mcΔT / t`).

Distractors: `Q/t = kAΔT/d` (conduction rate, not total heat), `ΔU = mgΔh`,
`W = Fs`.

### `f_beat = |f₂ − f₁|`

- "Two 424 Hz whistles, one approaching; passenger hears a 3 Hz beat — speed of
  the moving train?" (James Ruse Q23 → beats + Doppler).
- "Resultant waveform of two sounds; one is 400 Hz — the other could be?" (Sydney
  Boys Q8 → 398/402 Hz from beat period).

Distractors: Doppler `f'`, `v = fλ`.

### `f' = f (v_wave + v_obs)/(v_wave − v_src)` (Doppler)

- "Plane approaching at 221 m/s emits 1200 Hz — frequency heard as it recedes?"
  (Girraween Q13).
- "Aircraft at 100 m/s towards a stationary observer emitting 1000 Hz — observed
  frequency?" (Sydney Boys Q27a).
- "Ambulance between observers A and B — how does each observed frequency compare
  with f?" (James Ruse Q9, conceptual).
- "Which combination of source/observer velocities gives the highest observed
  pitch?" (Fort St Q16).

Distractors: `f_beat`, `v = fλ`.

### `n₁ sinθ₁ = n₂ sinθ₂` (Snell)

- "Light goes from water (n = 1.33) into glass (n = 1.52) at 70° — angle of
  refraction in the glass?" (James Ruse Q5).
- "Refractive index of a block from angles of incidence and refraction" (Sydney
  Boys Q12, Hornsby 2020 Q9, Fort St Q33).
- "A ray enters a substance that halves the speed of light; angle of incidence
  30° — angle of refraction?" (Fort St Q34b).

Distractors: `n = c/v` (no angles), `sinθ_c = n₂/n₁` (critical angle only).

### `sinθ_c = n₂/n₁` (critical angle)

- "Optical fibre of refractive index 1.48 — angle at which light begins to
  escape?" (Girraween Q9).
- "Conditions for total internal reflection" (Fort St Q34a, conceptual).

Distractors: Snell's law (general refraction), `n = c/v`.

### `I₁r₁² = I₂r₂²` (inverse square)

- "Sound intensity 7.6 × 10⁻¹ W/m² at 4.5 m — power of the source?" (Girraween
  Q12 → `P = I × 4πr²`, same inverse-square idea).
- "Light intensity at 4 m as a percentage of the source" (Hornsby 2020 Q11 →
  6.25 %).
- "How the intensity of a spotlight changes as an observer moves away" (Fort St
  Q32c).
- "Lamp 20 cm vs ceiling light 2 m — how many times brighter?" (James Ruse Q29).

Distractors: `Q = mcΔT`, `P = VI`, `v = fλ`.

### `Q/t = kAΔT/d` (conduction)

- "Rate of heat flow through a wall / window / rod of known area, thickness and
  temperature difference."
- "Why does coffee cool faster when stirred with a metal spoon?" (Girraween Q22c,
  conceptual — conduction).

Distractors: `Q = mcΔT` (total heat, no rate), `P = ΔE/Δt`.

### `E = V/d`

- "Electric field strength between plates 1.5 cm apart at 12 V" (Girraween Q24a).
- "Potential difference between plates 1 mm apart given the force on an electron"
  (Fort St Q11 → `E = F/q` then `V = Ed`).

Distractors: `V = IR` (circuit, not field), `F = qE`, `W = qEd`.

### `V = ΔU/q`

- "Potential difference from the work done per unit charge" (Sydney Boys Q31a,
  conceptual — J per C).
- "Energy change of a charge moved through a known potential difference"
  (inverted).

Distractors: `E = V/d`, `W = qV`, `V = IR`.

### `W = qV`

- "Work to move a +3.60 mC charge through 160 V" (Fort St Q24a).
- "Work to move a 5.5 × 10⁻² C charge between two plates at +100 V and +200 V"
  (Sydney Boys Q30a → `W = qΔV`).
- "Energy dissipated by a heating coil" via `W = qV` with `q = It` (Girraween
  Q5).

Distractors: `W = qEd` (field version), `W = Fs`, `P = VI`.

### `W = qEd`

- "Work done pushing a charged mass 0.5 cm towards a plate" (Girraween Q24d).
- "Work on a charge crossing a uniform field of known strength."

Distractors: `W = qV`, `F = qE` (force, not work), `E = V/d`.

### `B = μ₀I / 2πr`

- "Magnetic field 20 cm from a wire carrying 10 A" (Girraween Q7).
- "How field strength varies with perpendicular distance from a straight wire"
  (Sydney Boys Q6, James Ruse Q19b, Hornsby graph items — `B ∝ 1/r`).

Distractors: `F = qvB sinθ`, `F = lIB sinθ`, `F/l = μ₀I₁I₂/2πr`.

### `F = qE`

- "Force on a −2.5 µC charge in a field of 800 N/C" (Girraween Q24b).
- "Force on an electron between charged plates" (Fort St Q11).

Distractors: Coulomb `F = (1/4πε₀)(q₁q₂/r²)` (two point charges), `F = qvB`
(needs motion + magnetic field), `E = V/d`.

### `F = (1/4πε₀)(q₁q₂/r²)` (Coulomb)

- "Force on q₁ (+5 µC) from q₂ (+8 µC) 4.00 cm away" (Girraween Q10).
- "Separation at which a 6 µC and −8 µC charge attract with 1.11 N" (James Ruse
  Q27).
- "Charge on each of two identical objects from force–distance data" (Girraween
  Q23a).
- "Compare the accelerations of +q and −2q released from rest" (James Ruse Q14 →
  Coulomb + `F = ma`).

Distractors: `F = qE` (charge in a field, not two point charges), gravitational
attraction, `V = ΔU/q`.

### `I = q/t`

- "Charge passing a point when 6.0 A flows for one minute" (Girraween Q5 working
  → `q = It`).
- "Current from a quantity of charge delivered in a time."

Distractors: `V = IR`, `P = VI`, `W = qV`.

### `V = IR` (Ohm)

- "Total resistance of a series/parallel network" (Girraween Q25a, James Ruse
  Q26, Sydney Boys Q19, Fort St Q32a).
- "Voltage across a specific resistor / current through the 6 Ω resistor"
  (Girraween Q25b–c, James Ruse Q26).
- "Voltage across a coil carrying 6 A with 5 Ω resistance" (Girraween Q5).

Distractors: `P = VI`, `I = q/t`, `E = V/d`.

### `P = VI`

- "Energy dissipated by a heating coil (R = 5 Ω, I = 6 A, t = 60 s)" (Girraween
  Q5).
- "Energy a spotlight consumes over one hour" (Fort St Q32b).
- "Compare current drawn by a 12 V 150 W globe and a 240 V 600 W globe" (Hornsby
  2020 Q13).
- "Efficiency of a heating coil warming water" (Sydney Boys Q16 → electrical
  energy in vs `mcΔT` out).

Distractors: `V = IR`, `Q = mcΔT`, `P = ΔE/Δt` (mechanical).

### `F = qvB sinθ`

- "Force on a charge moving at speed v through a magnetic field B at angle θ."
- "Why a moving charge is deflected in a magnetic field but a stationary one is
  not."

Distractors: `F = qE` (electric field, no motion needed), `F = lIB sinθ`
(current in a wire), `B = μ₀I/2πr`.

### `F = lIB sinθ`

- "Force on a length l of wire carrying current I in a field B."
- "Force between a current-carrying wire and an external magnet."

Distractors: `F = qvB sinθ` (single charge), `F/l = μ₀I₁I₂/2πr` (two wires),
`B = μ₀I/2πr`.

### `F/l = (μ₀/2π)(I₁I₂/r)`

- "Force per metre between two parallel wires carrying I₁ and I₂, separation r."
- "Do two parallel wires with currents in the same direction attract or repel,
  and with what force per unit length?"

Distractors: `F = lIB sinθ` (one wire in an external field), `F = qvB sinθ`,
Coulomb's law (static charges, not currents).

---

## Short-answer format

Every short-answer question, per the unit spec:

1. **Describe what the formula tells you / lets you calculate** (1 mark).
2. **Name a chosen variable** in the formula (1 mark).
3. **Give the SI unit of that variable** — name and/or symbol (1 mark).

3 marks each. The exams confirm students are regularly expected to state
quantities and SI units precisely (e.g. Sydney Boys Q21b marker notes on units;
Girraween Q24b "many did not specify direction/units"). Accept common
equivalent unit forms (e.g. `m s⁻²` = `m/s²` = "metres per second squared";
`kg m s⁻¹` = `N s` for momentum; `V m⁻¹` = `N C⁻¹` for electric field).

Dimensionless quantities (refractive index) have **no unit** — that is the
correct answer, not "a mistake".

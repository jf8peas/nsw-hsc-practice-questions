import type { Concept } from "@/lib/types";

// PUBLIC — the concepts a student can be asked to relearn in this unit (spec 002).
// Ids are `<unit-id>.c-<slug>`, are never renamed or reused, and descriptions are one line.
// Which questions carry which concept is in ./concept-tags.ts.

const U = "y11-physics-preliminary";

const list: Array<[slug: string, description: string]> = [
  // --- Fundamentals of mechanics ---
  ["scalar-vector", "Scalars have size only; vectors have size and direction"],
  ["distance-displacement", "Distance is the length of the path; displacement is the straight-line change in position"],
  ["speed-velocity", "Speed is a scalar and velocity a vector; average and instantaneous values differ"],
  ["motion-graphs", "Reading motion graphs: gradient and area on displacement–time and velocity–time graphs"],
  ["acceleration", "Acceleration is any change in velocity, including a change of direction"],
  ["free-fall", "In free fall every object has the same acceleration, whatever its mass"],
  ["newton-first-law", "Newton's first law: no net force means no change in motion (inertia)"],
  ["net-force", "Net force is the vector sum of the forces; balanced forces mean constant velocity"],
  ["newton-second-law", "Newton's second law: acceleration depends on the net force and the mass"],
  ["newton-third-law", "Newton's third law: forces come in equal and opposite pairs on different objects"],
  ["mass-weight", "Mass is the amount of matter; weight is the gravitational force on it"],
  ["friction", "Static and kinetic friction, and when friction helps or hinders"],
  ["work", "Work is done only when a force causes displacement along its direction"],
  ["energy-conservation", "Kinetic and potential energy, and conservation of energy in a system"],
  ["momentum-conservation", "Momentum is conserved in an isolated system, because of Newton's third law"],
  ["collision-types", "Elastic collisions conserve kinetic energy; inelastic collisions do not"],
  ["impulse-safety", "Impulse changes momentum; a longer stopping time means a smaller force"],
  // --- Waves ---
  ["wave-types", "Transverse and longitudinal waves differ in how the medium oscillates"],
  ["wave-terms", "Wavelength, amplitude, period and frequency, and how they relate"],
  ["wave-equation", "Wave speed equals frequency times wavelength"],
  ["wave-energy", "Waves transfer energy, not matter, and larger amplitude carries more energy"],
  ["sound-pitch-loudness", "Pitch depends on frequency; loudness depends on amplitude"],
  ["wave-vacuum", "Sound needs a medium; light and other electromagnetic waves do not"],
  ["em-spectrum", "The electromagnetic spectrum orders waves by wavelength and frequency"],
  ["light-intensity", "Light intensity falls as the distance from the source increases"],
  ["refraction", "Refraction: waves change speed and direction at a boundary, but not frequency"],
  ["total-internal-reflection", "Total internal reflection needs dense-to-less-dense travel beyond the critical angle"],
  ["diffraction", "Diffraction is most noticeable when the gap is about one wavelength wide"],
  ["interference", "Superposition: waves add to give constructive or destructive interference"],
  ["standing-waves", "Standing waves form from reflected waves, with nodes and antinodes"],
  ["doppler-redshift", "The Doppler effect shifts observed frequency; redshift means a source moving away"],
  // --- Electricity and magnetism ---
  ["charging-friction", "Objects charge by gaining or losing electrons, for example by friction"],
  ["conduction-induction", "Charging by conduction needs contact, induction does not; conductors move charge freely"],
  ["field-lines", "Electric field lines show field direction and strength, and never cross"],
  ["coulombs-law", "Coulomb's law: electrostatic force depends on the charges and the distance between them"],
  ["uniform-field", "Between oppositely charged parallel plates the electric field is uniform"],
  ["electric-potential", "Electric potential energy and potential difference (voltage) are different things"],
  ["current-flow", "Conventional current runs opposite to electron flow; DC and AC differ"],
  ["resistance-factors", "Resistance rises with length and temperature and falls with cross-sectional area"],
  ["ohmic", "Ohmic conductors keep voltage and current in proportion; non-ohmic devices do not"],
  ["series-parallel", "Series and parallel circuits share current and voltage differently"],
  ["parallel-resistance", "Adding resistors in parallel lowers the total resistance; in series it raises it"],
  ["meters", "Ammeters go in series with low resistance; voltmeters go in parallel with high resistance"],
  ["magnetic-fields", "Magnetic field patterns around bar magnets, straight wires and solenoids"],
  ["electromagnets", "Electromagnet strength depends on the current, the coils and a soft iron core"],
];

export const concepts: Concept[] = list.map(([slug, description]) => ({ id: `${U}.c-${slug}`, description }));

/** Questions removed from this unit, with the concept each carried. None so far. */
export const retired: Record<string, string | null> = {};

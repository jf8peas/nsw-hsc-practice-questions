import type { McQuestion, Question, ShortQuestion } from "@/lib/types";
import { shuffleBySeed } from "@/lib/shuffle";
import { chargeField, forces, motionGraph, rays, wave } from "./diagram";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Original questions written to the current (2025) NESA Physics 11–12 syllabus,
// Year 11 — see docs/y11-physics-preliminary-research.md. Every question is
// factual or reasoning-based (no calculations).
//
// 50 multiple choice (group "mc", 1 mark) + 50 short answer (group "sa",
// 2–4 marks). A quiz draws 5 + 5 — 10 non-repeating attempts.

const U = "y11-physics-preliminary";
const p2 = (n: number) => String(n).padStart(2, "0");

// Reused diagrams (a handful of constants so the client bundle stays small).
const G_VT_TRAP = motionGraph({
  yLabel: "Velocity",
  points: [[0, 0], [0.35, 0.85], [0.65, 0.85], [1, 0]],
  caption: "Velocity–time graph for an object moving in a straight line",
});
const G_VT_LINE = motionGraph({
  yLabel: "Velocity",
  points: [[0, 0.15], [1, 0.95]],
  caption: "Velocity–time graph",
});
const G_VT_FLAT = motionGraph({
  yLabel: "Velocity",
  points: [[0, 0.6], [1, 0.6]],
  caption: "Velocity–time graph",
});
const G_XT_LINE = motionGraph({
  yLabel: "Displacement",
  points: [[0, 0.1], [1, 0.9]],
  caption: "Displacement–time graph",
});
const FORCES_BALANCED = forces({
  bodyLabel: "car",
  forces: [
    { dir: "up", label: "N" },
    { dir: "down", label: "W" },
    { dir: "right", label: "driving force", len: 1 },
    { dir: "left", label: "friction + drag", len: 1 },
  ],
  caption: "Forces on a car",
});
const WAVE_XY = wave({ caption: "A transverse wave: X and Y are marked" });
const RAY_INTO_GLASS = rays({
  incidenceDeg: 42,
  denserBelow: true,
  showReflected: true,
  topLabel: "air",
  bottomLabel: "glass",
  caption: "A ray of light travelling from air into glass",
});
const RAY_OUT_OF_GLASS = rays({
  incidenceDeg: 30,
  denserBelow: false,
  topLabel: "glass",
  bottomLabel: "air",
  caption: "A ray of light travelling from glass into air",
});
const FIELD_POSITIVE = chargeField({ config: "positive", caption: "Field lines around a charge" });
const FIELD_DIPOLE = chargeField({ config: "dipole", caption: "Field lines between two point charges" });

function mc(
  n: number,
  prompt: string,
  canonical: [string, string, string, string],
  diagramSvg?: string,
): McQuestion {
  const id = `${U}.m${p2(n)}`;
  return {
    id,
    group: "mc",
    type: "mc",
    prompt,
    maxMarks: 1,
    options: shuffleBySeed(id, canonical),
    ...(diagramSvg ? { diagramSvg } : {}),
  };
}

function sa(n: number, marks: number, prompt: string, diagramSvg?: string): ShortQuestion {
  return {
    id: `${U}.s${p2(n)}`,
    group: "sa",
    type: "short",
    prompt,
    maxMarks: marks,
    ...(diagramSvg ? { diagramSvg } : {}),
  };
}

// ========================================================================
// Multiple choice — m01..m50
// ========================================================================

const mcQuestions: McQuestion[] = [
  // --- Fundamentals of mechanics ---
  mc(1, "Which of the following is a vector quantity?", [
    "Displacement.",
    "Distance.",
    "Speed.",
    "Time.",
  ]),
  mc(2, "A runner completes exactly one lap of a 400 m circular track, finishing where they started. Their distance travelled and their displacement are:", [
    "400 m and 0 m.",
    "0 m and 400 m.",
    "400 m and 400 m.",
    "0 m and 0 m.",
  ]),
  mc(3, "The gradient (slope) of a displacement–time graph at a point gives the object's:", [
    "instantaneous velocity.",
    "acceleration.",
    "total distance travelled.",
    "average speed for the whole journey.",
  ], G_XT_LINE),
  mc(4, "The velocity–time graph shows an object's motion. During the middle section of the graph, the object is:", [
    "moving at constant velocity with zero acceleration.",
    "speeding up at a constant rate.",
    "slowing down.",
    "stationary.",
  ], G_VT_TRAP),
  mc(5, "On a velocity–time graph, the area between the line and the time axis represents the:", [
    "displacement of the object.",
    "acceleration of the object.",
    "average velocity of the object.",
    "final velocity of the object.",
  ], G_VT_LINE),
  mc(6, "An object is said to be accelerating whenever:", [
    "its velocity is changing in magnitude or direction.",
    "it is moving at a high speed.",
    "a force acts on it, even if the forces are balanced.",
    "it is moving in a straight line.",
  ]),
  mc(7, "According to Newton's first law, an object with zero net force acting on it will:", [
    "remain at rest, or continue moving at constant velocity in a straight line.",
    "always be at rest.",
    "gradually slow down and stop.",
    "accelerate in the direction it is already moving.",
  ]),
  mc(8, "For the same net force, an object with a larger mass will have:", [
    "a smaller acceleration.",
    "a larger acceleration.",
    "the same acceleration.",
    "zero acceleration.",
  ]),
  mc(9, "A book rests on a table. The reaction force to the book's weight (the gravitational pull of the Earth on the book) is:", [
    "the gravitational pull of the book on the Earth.",
    "the normal force of the table pushing up on the book.",
    "the weight of the table.",
    "the friction between the book and the table.",
  ]),
  mc(10, "The diagram shows the forces on a car travelling along a straight, level road. The car is moving at a constant velocity. This tells you that:", [
    "the driving force is equal in size to the total of friction and air resistance.",
    "the driving force is greater than friction and air resistance.",
    "there is no friction acting on the car.",
    "the net force is directed forwards.",
  ], FORCES_BALANCED),
  mc(11, "Compared with kinetic friction, the maximum static friction between two surfaces is usually:", [
    "slightly larger.",
    "much smaller.",
    "exactly the same.",
    "always zero.",
  ]),
  mc(12, "A block slides down a rough inclined plane at a constant velocity. The net force on the block is:", [
    "zero.",
    "directed down the slope.",
    "directed up the slope.",
    "equal to the block's weight.",
  ]),
  mc(13, "Work is done on an object by a force only when:", [
    "the object moves and the force has a component in the direction of motion.",
    "a force is applied, whether or not the object moves.",
    "the object moves, whether or not a force acts.",
    "the force is perpendicular to the object's motion.",
  ]),
  mc(14, "A ball is thrown straight up. Ignoring air resistance, as it rises its kinetic energy and its gravitational potential energy respectively:", [
    "decrease and increase.",
    "increase and decrease.",
    "both increase.",
    "both decrease.",
  ]),
  mc(15, "The total momentum of a system is conserved provided that:", [
    "no net external force acts on the system.",
    "the collision is perfectly elastic.",
    "no kinetic energy is lost.",
    "the objects have equal mass.",
  ]),
  mc(16, "In a perfectly inelastic collision between two objects:", [
    "momentum is conserved but kinetic energy is not.",
    "both momentum and kinetic energy are conserved.",
    "neither momentum nor kinetic energy is conserved.",
    "kinetic energy is conserved but momentum is not.",
  ]),
  mc(17, "Crumple zones in cars reduce the force on the passengers during a crash because they:", [
    "increase the time over which the car's momentum changes.",
    "decrease the change in momentum of the car.",
    "increase the mass of the car.",
    "reduce the car's speed before the crash.",
  ]),
  mc(18, "Two cars, one twice as heavy as the other, travel at the same speed. Compared with the lighter car, the heavier car has:", [
    "twice the momentum and twice the kinetic energy.",
    "twice the momentum and the same kinetic energy.",
    "the same momentum and twice the kinetic energy.",
    "the same momentum and the same kinetic energy.",
  ]),
  // --- Waves ---
  mc(19, "In a transverse wave, the particles of the medium oscillate:", [
    "perpendicular to the direction the wave travels.",
    "parallel to the direction the wave travels.",
    "in circles at the speed of the wave.",
    "in the same direction as the energy transfer.",
  ]),
  mc(20, "A sound wave travelling through air is an example of a:", [
    "longitudinal wave, with compressions and rarefactions.",
    "transverse wave, with crests and troughs.",
    "wave that does not need a medium.",
    "standing wave.",
  ]),
  mc(21, "On the transverse wave diagram, X is the distance between two adjacent crests and Y is the distance from the axis to a crest. X and Y are the wave's:", [
    "wavelength and amplitude.",
    "amplitude and wavelength.",
    "period and frequency.",
    "frequency and wavelength.",
  ], WAVE_XY),
  mc(22, "The period of a wave is the:", [
    "time taken for one complete wave (one full oscillation) to pass a point.",
    "number of waves passing a point each second.",
    "distance between two adjacent crests.",
    "maximum displacement of a particle from rest.",
  ]),
  mc(23, "If the frequency of a wave doubles while the wave speed stays the same, the wavelength will:", [
    "halve.",
    "double.",
    "stay the same.",
    "quadruple.",
  ]),
  mc(24, "Which statement about the electromagnetic spectrum is correct?", [
    "All electromagnetic waves travel at the same speed in a vacuum.",
    "Radio waves travel faster than visible light in a vacuum.",
    "Electromagnetic waves need a medium to travel through.",
    "Gamma rays have a longer wavelength than radio waves.",
  ]),
  mc(25, "As you move further from a point source of light, the intensity of the light:", [
    "decreases in proportion to one over the distance squared.",
    "decreases in proportion to the distance.",
    "stays the same.",
    "increases with distance.",
  ]),
  mc(26, "When light passes from air into glass, it slows down. As it enters the glass it bends:", [
    "toward the normal.",
    "away from the normal.",
    "back along its original path.",
    "along the boundary between the two media.",
  ], RAY_INTO_GLASS),
  mc(27, "The refractive index of a medium is a measure of:", [
    "how much the medium slows light compared with a vacuum.",
    "how transparent the medium is.",
    "the colour of light in the medium.",
    "the density of the medium in kilograms per cubic metre.",
  ]),
  mc(28, "Total internal reflection can occur only when light travels:", [
    "from a medium of higher refractive index toward one of lower refractive index, at an angle greater than the critical angle.",
    "from a medium of lower refractive index toward one of higher refractive index.",
    "along the normal to a boundary.",
    "through a vacuum.",
  ], RAY_OUT_OF_GLASS),
  mc(29, "Diffraction of a wave is most noticeable when the size of the gap or obstacle is:", [
    "similar to, or smaller than, the wavelength of the wave.",
    "much larger than the wavelength.",
    "exactly twice the wavelength.",
    "unrelated to the wavelength.",
  ]),
  mc(30, "When a crest of one wave meets a trough of another wave of equal amplitude, the result at that point is:", [
    "destructive interference — the displacements cancel.",
    "constructive interference — a larger crest.",
    "a standing wave.",
    "total internal reflection.",
  ]),
  mc(31, "A standing wave on a string fixed at both ends has points that never move. These points are called:", [
    "nodes.",
    "antinodes.",
    "crests.",
    "compressions.",
  ]),
  mc(32, "An ambulance siren sounds higher in pitch as it approaches and lower as it moves away. This is because, as the source approaches, the sound waves reaching the observer are:", [
    "compressed to a shorter wavelength and higher frequency.",
    "stretched to a longer wavelength and lower frequency.",
    "travelling faster through the air.",
    "louder but unchanged in frequency.",
  ]),
  mc(33, "Light from a distant galaxy that is moving away from Earth is observed to be 'redshifted'. This means its:", [
    "observed wavelength is longer than the wavelength that was emitted.",
    "observed wavelength is shorter than the wavelength that was emitted.",
    "speed has decreased.",
    "brightness has increased.",
  ]),
  mc(34, "Increasing the amplitude of a sound wave, with frequency unchanged, makes the sound:", [
    "louder.",
    "higher in pitch.",
    "lower in pitch.",
    "travel faster.",
  ]),
  // --- Electricity and magnetism ---
  mc(35, "When a plastic rod is rubbed with a cloth and becomes negatively charged, this is because:", [
    "electrons have been transferred from the cloth to the rod.",
    "protons have been transferred from the cloth to the rod.",
    "electrons have been transferred from the rod to the cloth.",
    "the rod has created new charge.",
  ]),
  mc(36, "The diagram shows the electric field lines around a charge. The field lines point outward, away from the charge. This tells you the charge is:", [
    "positive.",
    "negative.",
    "neutral.",
    "moving.",
  ], FIELD_POSITIVE),
  mc(37, "The diagram shows the electric field between two point charges, with field lines running from one charge to the other. The two charges are:", [
    "one positive and one negative (opposite charges).",
    "both positive.",
    "both negative.",
    "both neutral.",
  ], FIELD_DIPOLE),
  mc(38, "According to Coulomb's law, if the distance between two point charges is doubled, the electrostatic force between them becomes:", [
    "one quarter as large.",
    "half as large.",
    "twice as large.",
    "four times as large.",
  ]),
  mc(39, "The electric field between two parallel charged plates is:", [
    "uniform — the same strength and direction everywhere between the plates.",
    "strongest in the exact centre.",
    "zero everywhere between the plates.",
    "directed along the plates.",
  ]),
  mc(40, "Conventional current is defined as the flow of:", [
    "positive charge, from the positive terminal to the negative terminal around the external circuit.",
    "electrons, from the positive terminal to the negative terminal.",
    "positive charge, from the negative terminal to the positive terminal.",
    "energy, at the speed of light.",
  ]),
  mc(41, "The resistance of a metal wire will increase if the wire is:", [
    "made longer.",
    "made thicker (larger cross-sectional area).",
    "cooled down.",
    "made from a better conductor.",
  ]),
  mc(42, "For an ohmic conductor at constant temperature, if the voltage across it is doubled, the current through it will:", [
    "double.",
    "halve.",
    "stay the same.",
    "become four times as large.",
  ]),
  mc(43, "In a series circuit, as you add more identical resistors, the total resistance and the total current from the battery respectively:", [
    "increase and decrease.",
    "decrease and increase.",
    "both increase.",
    "both stay the same.",
  ]),
  mc(44, "In a parallel circuit with two branches, the voltage across each branch is:", [
    "the same, and equal to the supply voltage.",
    "half the supply voltage each.",
    "different, depending on the resistance of each branch.",
    "zero.",
  ]),
  mc(45, "Adding a second resistor in parallel with an existing one causes the total resistance of that combination to:", [
    "decrease.",
    "increase.",
    "stay the same.",
    "become the sum of the two resistances.",
  ]),
  mc(46, "An ammeter is connected in series and a voltmeter in parallel with a component because:", [
    "an ammeter must carry the same current as the component, and a voltmeter must have the same voltage across it as the component.",
    "an ammeter has a very high resistance and a voltmeter a very low resistance.",
    "it makes the circuit easier to draw.",
    "the meters would be damaged if connected the other way.",
  ]),
  mc(47, "The magnetic field lines outside a bar magnet point:", [
    "from the north pole to the south pole.",
    "from the south pole to the north pole.",
    "into both poles.",
    "out of both poles.",
  ]),
  mc(48, "The magnetic field around a long straight current-carrying wire forms:", [
    "concentric circles around the wire.",
    "straight lines parallel to the wire.",
    "straight lines pointing away from the wire.",
    "a uniform field like that between parallel plates.",
  ]),
  mc(49, "Increasing the current through a solenoid, with everything else unchanged, will make the magnetic field inside it:", [
    "stronger.",
    "weaker.",
    "reverse direction only.",
    "unchanged.",
  ]),
  mc(50, "A soft iron core is used inside an electromagnet rather than a steel core because soft iron:", [
    "becomes strongly magnetised when current flows and loses its magnetism quickly when the current stops.",
    "keeps its magnetism permanently after the current is switched off.",
    "does not conduct electricity.",
    "is a stronger permanent magnet than steel.",
  ]),
];

// ========================================================================
// Short answer — s01..s50 (factual / reasoning only, no calculations)
// ========================================================================

const saQuestions: ShortQuestion[] = [
  // --- Fundamentals of mechanics ---
  sa(1, 2, "Distinguish between a scalar quantity and a vector quantity, giving one example of each."),
  sa(2, 2, "Explain the difference between distance and displacement, using an example."),
  sa(3, 2, "Explain the difference between speed and velocity."),
  sa(4, 3, "The velocity–time graph shows the motion of an object moving in a straight line. Describe the motion of the object during each of the three sections of the graph.", G_VT_TRAP),
  sa(5, 2, "Explain how you can use a velocity–time graph to determine (a) the acceleration of an object and (b) the displacement of an object.", G_VT_LINE),
  sa(6, 2, "Explain why an object moving in a circle at constant speed is still accelerating."),
  sa(7, 3, "State Newton's three laws of motion."),
  sa(8, 3, "Explain, using Newton's third law, how a rocket is able to accelerate upward in space where there is nothing to push against."),
  sa(9, 3, "The diagram shows the forces acting on a car moving along a straight, level road at constant velocity. Explain what the diagram tells you about the net force on the car and about the sizes of the forces.", FORCES_BALANCED),
  sa(10, 2, "Distinguish between static friction and kinetic friction."),
  sa(11, 3, "A box sits on a ramp that is slowly tilted. Explain, in terms of the forces acting on the box, why the box eventually begins to slide."),
  sa(12, 2, "Explain what is meant by a 'conservative force' and give one example."),
  sa(13, 3, "A pendulum swings back and forth. Describe the energy transformations that occur as the pendulum bob moves from its highest point to its lowest point and back up again, assuming no friction."),
  sa(14, 2, "State the conditions under which the total mechanical energy of a system is conserved."),
  sa(15, 3, "Explain why momentum is conserved in a collision between two objects, referring to Newton's third law."),
  sa(16, 3, "Explain how you would classify a collision as elastic or inelastic, and describe what happens to the total kinetic energy in each case."),
  sa(17, 3, "Explain, in terms of impulse and change in momentum, why bending your knees when landing from a jump reduces the force on your legs."),
  // --- Waves ---
  sa(18, 3, "Distinguish between a transverse wave and a longitudinal wave, giving one example of each."),
  sa(19, 2, "Using the transverse wave diagram, define the terms wavelength and amplitude, and state which of X and Y corresponds to each.", WAVE_XY),
  sa(20, 2, "Explain the relationship between the frequency of a wave and its period."),
  sa(21, 2, "For a wave travelling at constant speed, explain what happens to its wavelength if its frequency is increased."),
  sa(22, 2, "Explain why sound cannot travel through a vacuum but light can."),
  sa(23, 3, "Explain how a sound wave transfers energy from one place to another through the air."),
  sa(24, 3, "Explain the relationship between the distance from a point source of light and the intensity of the light received (the inverse square law)."),
  sa(25, 3, "The diagram shows a ray of light passing from air into glass. Explain why the ray changes direction at the boundary, and state whether it bends toward or away from the normal.", RAY_INTO_GLASS),
  sa(26, 2, "Explain the conditions required for total internal reflection to occur.", RAY_OUT_OF_GLASS),
  sa(27, 2, "Explain what is meant by the diffraction of a wave, and state when diffraction is most noticeable."),
  sa(28, 3, "Use the principle of superposition to explain the difference between constructive interference and destructive interference."),
  sa(29, 3, "Explain how a standing wave is produced on a string fixed at both ends, and describe what is meant by a node and an antinode."),
  sa(30, 3, "Explain why the pitch of a car horn sounds higher as the car approaches you and lower as it moves away (the Doppler effect)."),
  sa(31, 2, "Explain what astronomers mean by 'redshift', and what it tells us about a distant galaxy."),
  sa(32, 2, "Explain the difference between the loudness and the pitch of a sound in terms of the properties of the sound wave."),
  sa(33, 2, "Describe one practical application of infrared radiation and one of ultraviolet radiation, linking each to a property of that part of the electromagnetic spectrum."),
  // --- Electricity and magnetism ---
  sa(34, 3, "Explain how an object can become electrically charged by friction, referring to the movement of electrons."),
  sa(35, 3, "Explain the difference between charging an object by conduction and charging it by induction."),
  sa(36, 3, "The diagram shows the electric field around a point charge. Explain what electric field lines represent (both their direction and their spacing), and state what the diagram tells you about the sign of the charge.", FIELD_POSITIVE),
  sa(37, 3, "Explain how the electrostatic force between two point charges depends on the size of the charges and on the distance between them."),
  sa(38, 2, "Explain why the electric field between two parallel charged plates is described as uniform."),
  sa(39, 3, "Explain what happens to the electric potential energy of a positive charge as it moves from the positive plate toward the negative plate of a set of parallel plates, and where the energy goes."),
  sa(40, 2, "Distinguish between conventional current and the actual flow of electrons in a metal wire."),
  sa(41, 2, "Compare direct current (DC) and alternating current (AC)."),
  sa(42, 3, "Explain how the resistance of a length of wire depends on its length, its cross-sectional area and its temperature."),
  sa(43, 3, "Compare how current and voltage behave in a series circuit with how they behave in a parallel circuit."),
  sa(44, 3, "Explain why the total resistance of a parallel combination of resistors is less than the resistance of any one of the resistors."),
  sa(45, 2, "Explain why an ammeter must be connected in series with a component, but a voltmeter must be connected in parallel with it."),
  sa(46, 2, "Describe the shape and direction of the magnetic field around a bar magnet."),
  sa(47, 2, "Describe the shape of the magnetic field around a long straight current-carrying wire."),
  sa(48, 3, "Describe the magnetic field produced by a current-carrying solenoid, and compare it with the field of a bar magnet."),
  sa(49, 3, "Explain three ways in which the strength of an electromagnet could be increased."),
  sa(50, 2, "Explain why a soft iron core, rather than a steel core, is used in an electromagnet."),
];

export const questions: Question[] = [...mcQuestions, ...saQuestions];

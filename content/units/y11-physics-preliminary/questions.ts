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
// 100 multiple choice (group "mc", 1 mark) + 100 short answer (group "sa",
// 2–4 marks). A quiz draws 5 + 5 — 20 non-repeating attempts.

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
// Multiple choice — m51..m100 (second bank)
// ========================================================================

const mcQuestions2: McQuestion[] = [
  // --- Fundamentals of mechanics ---
  mc(51, "A cyclist travels around a circular track at constant speed. Which statement is correct?", [
    "The cyclist's velocity is continually changing because its direction changes, even though speed is constant.",
    "The cyclist's velocity is constant, since speed is constant.",
    "The cyclist has zero acceleration, since speed is constant.",
    "The cyclist's speed must be changing too.",
  ]),
  mc(52, "Which pair correctly identifies a scalar quantity and a vector quantity?", [
    "Mass (scalar) and force (vector).",
    "Force (scalar) and time (vector).",
    "Speed (vector) and displacement (scalar).",
    "Energy (vector) and mass (scalar).",
  ]),
  mc(53, "A ball is dropped and falls freely under gravity, ignoring air resistance. Its acceleration during the fall is:", [
    "constant and directed downward, regardless of its speed.",
    "increasing as it speeds up.",
    "decreasing as it speeds up.",
    "zero once it reaches a high speed.",
  ]),
  mc(54, "The velocity–time graph shown is a horizontal line above the time axis. This tells you that the object is:", [
    "moving at a constant, non-zero velocity, since its acceleration is zero.",
    "at rest.",
    "accelerating uniformly.",
    "decelerating to rest.",
  ], G_VT_FLAT),
  mc(55, "On a velocity–time graph, a straight line with a constant, positive slope represents an object undergoing:", [
    "uniform (constant) acceleration.",
    "constant velocity.",
    "uniform deceleration only.",
    "no motion at all.",
  ]),
  mc(56, "Which of Newton's laws best explains why a passenger without a seatbelt continues moving forward when a car suddenly stops?", [
    "The first law — the passenger's body tends to remain in its state of motion (inertia) until an external force acts on it.",
    "The second law, because F = ma applies only to the car, not the passenger.",
    "The third law, because the car and passenger exert equal and opposite forces on each other.",
    "The law of conservation of energy.",
  ]),
  mc(57, "Two objects of different mass are dropped from the same height in a vacuum (no air resistance). They will:", [
    "hit the ground at the same time, since both accelerate at the same rate due to gravity.",
    "the heavier object will land first.",
    "the lighter object will land first.",
    "this cannot be determined without knowing their exact masses.",
  ]),
  mc(58, "A force of friction acting on a moving object always acts:", [
    "in the direction opposing the object's relative motion.",
    "in the same direction as the object's motion.",
    "perpendicular to the object's motion.",
    "in a fixed direction, regardless of the object's motion.",
  ]),
  mc(59, "According to Newton's second law, doubling the net force on an object while keeping its mass constant will:", [
    "double its acceleration.",
    "halve its acceleration.",
    "leave its acceleration unchanged.",
    "quadruple its acceleration.",
  ]),
  mc(60, "A skydiver reaches 'terminal velocity' when:", [
    "air resistance has increased to exactly balance their weight, so the net force is zero and velocity is constant.",
    "gravity has stopped acting on them.",
    "their parachute has automatically opened.",
    "air resistance has disappeared entirely.",
  ]),
  mc(61, "Which of the following is an example of work being done on an object?", [
    "A person pushes a box and it slides forward across the floor.",
    "A person pushes against a wall that does not move.",
    "A person holds a heavy bag stationary above the ground.",
    "A satellite moves at constant speed in a circular orbit.",
  ]),
  mc(62, "As a pendulum bob swings from its highest point to its lowest point, its gravitational potential energy and kinetic energy respectively:", [
    "decrease and increase.",
    "increase and decrease.",
    "both increase.",
    "both stay the same.",
  ]),
  mc(63, "A satellite moves in a circular orbit around the Earth at constant speed. The work done by gravity on the satellite over one complete orbit is:", [
    "zero, because the gravitational force is always perpendicular to the satellite's velocity.",
    "positive throughout the orbit.",
    "negative throughout the orbit.",
    "equal to the satellite's kinetic energy.",
  ]),
  mc(64, "In an elastic collision between two objects:", [
    "both momentum and total kinetic energy are conserved.",
    "only momentum is conserved.",
    "only kinetic energy is conserved.",
    "neither momentum nor kinetic energy is conserved.",
  ]),
  mc(65, "A moving object collides with, and sticks to, a stationary object. This is an example of:", [
    "a perfectly inelastic collision.",
    "a perfectly elastic collision.",
    "a collision with no momentum transfer.",
    "a collision that conserves kinetic energy.",
  ]),
  mc(66, "Airbags in cars reduce injury during a collision mainly by:", [
    "increasing the time over which the passenger's momentum changes, reducing the average force experienced.",
    "increasing the force on the passenger.",
    "decreasing the passenger's mass.",
    "decreasing the time over which the collision occurs.",
  ]),
  mc(67, "Two identical trolleys move toward each other at the same speed and collide, sticking together. After the collision the combined trolleys are:", [
    "stationary, since their equal and opposite momenta cancel out.",
    "moving at double the original speed.",
    "moving at half the original speed, in the direction of one of the trolleys.",
    "moving faster than either trolley was before the collision.",
  ]),
  mc(68, "A cricket fielder catching a fast-moving ball moves their hands backward as the ball arrives. This technique:", [
    "increases the time of contact, reducing the force needed to stop the ball.",
    "decreases the time of contact, increasing the force needed to stop the ball.",
    "has no effect on the force experienced.",
    "increases the momentum of the ball.",
  ]),
  // --- Waves ---
  mc(69, "Which of the following correctly separates wave properties that are distances from those that are time-based?", [
    "Wavelength and amplitude are distances; period is a time.",
    "Period and frequency are distances; wavelength is a time.",
    "Amplitude and period are distances; wavelength is a time.",
    "All four properties are measured in units of time.",
  ]),
  mc(70, "A wave transfers:", [
    "energy from one place to another, without transferring matter.",
    "matter from one place to another, without transferring energy.",
    "both matter and energy from one place to another.",
    "neither matter nor energy.",
  ]),
  mc(71, "Two waves have the same frequency, but wave A has twice the amplitude of wave B. Wave A carries:", [
    "more energy than wave B.",
    "less energy than wave B.",
    "the same energy as wave B.",
    "twice the wavelength of wave B.",
  ]),
  mc(72, "Which of the following is a correct example of a longitudinal wave?", [
    "A sound wave in air, where compressions and rarefactions travel in the direction of energy transfer.",
    "A wave travelling along a plucked guitar string.",
    "A light wave travelling through space.",
    "A ripple spreading across the surface of a pond.",
  ]),
  mc(73, "As a wave passes from one medium into a denser medium, which properties change while the frequency stays the same?", [
    "The wave's speed and its wavelength both change.",
    "Only the wave's frequency changes.",
    "Only the wave's amplitude changes.",
    "None of the wave's properties change.",
  ]),
  mc(74, "The Doppler effect describes the change in observed:", [
    "frequency (and wavelength) of a wave due to relative motion between the source and the observer.",
    "amplitude of a wave due to the distance from the source.",
    "speed of the wave itself.",
    "direction of the wave only, never its frequency.",
  ]),
  mc(75, "Which colour of visible light has the shortest wavelength?", [
    "Violet.",
    "Red.",
    "Orange.",
    "Green.",
  ]),
  mc(76, "Compared with visible light, X-rays have:", [
    "a shorter wavelength and higher frequency.",
    "a longer wavelength and lower frequency.",
    "exactly the same wavelength.",
    "no defined wavelength.",
  ]),
  mc(77, "A ray of light travels from glass into air. Since air is optically less dense than glass, the ray:", [
    "speeds up and bends away from the normal.",
    "slows down and bends toward the normal.",
    "speeds up and bends toward the normal.",
    "does not change direction at all.",
  ], RAY_OUT_OF_GLASS),
  mc(78, "The critical angle for a glass–air boundary is the angle of incidence in the glass at which:", [
    "the refracted ray travels exactly along the boundary, at a refraction angle of 90°.",
    "the light is completely absorbed by the glass.",
    "the light ray reverses back exactly along its original path.",
    "the light travels perpendicular to the boundary.",
  ]),
  mc(79, "Which observation would be the clearest evidence that light behaves as a wave?", [
    "Light diffracts (spreads out) when passing through a very narrow slit.",
    "Light travels in straight lines through a vacuum.",
    "Light reflects off a flat mirror.",
    "Light can be focused to a point by a lens.",
  ]),
  mc(80, "When two identical waves arrive at a point exactly in phase (crest meets crest), the resulting displacement is an example of:", [
    "constructive interference, producing a larger amplitude.",
    "destructive interference, producing zero displacement.",
    "refraction of the wave.",
    "diffraction of the wave.",
  ]),
  mc(81, "A standing wave pattern on a string requires:", [
    "waves travelling in opposite directions that interfere to produce fixed nodes and antinodes.",
    "a single wave travelling in only one direction.",
    "two waves of very different frequency.",
    "a wave travelling through a vacuum.",
  ]),
  mc(82, "The pitch of a musical note is most closely related to a sound wave's:", [
    "frequency.",
    "amplitude.",
    "speed in air.",
    "direction of travel.",
  ]),
  mc(83, "Two radio stations broadcast at different frequencies. Since all radio waves travel at the same speed in air, their signals must have:", [
    "different wavelengths.",
    "the same wavelength.",
    "different speeds through the air.",
    "no relationship between their wavelengths at all.",
  ]),
  mc(84, "Compared with visible light, the microwaves used in a microwave oven have a wavelength that is:", [
    "longer than visible light but shorter than most radio waves.",
    "shorter than visible light.",
    "exactly the same as visible light.",
    "longer than all radio waves.",
  ]),
  // --- Electricity and magnetism ---
  mc(85, "An object becomes positively charged when it:", [
    "loses electrons, leaving an excess of positive charge.",
    "gains electrons.",
    "gains protons.",
    "creates new positive charge.",
  ]),
  mc(86, "Charging by induction differs from charging by conduction because induction:", [
    "does not require direct contact between the charged object and the object being charged.",
    "requires the two objects to touch directly.",
    "transfers no charge at all.",
    "only works between two insulators.",
  ]),
  mc(87, "An electric field is defined as a region in which:", [
    "a charged object experiences a force.",
    "only positive charges can exist.",
    "electric current always flows.",
    "magnetic effects always occur.",
  ]),
  mc(88, "The direction of an electric field at a point is defined as the direction of the force on:", [
    "a small positive test charge placed at that point.",
    "a small negative test charge placed at that point.",
    "any charge, regardless of its sign.",
    "the nearest free electron.",
  ]),
  mc(89, "Two like charges (both positive, or both negative) placed near each other will:", [
    "repel each other.",
    "attract each other.",
    "exert no force on each other.",
    "neutralise each other.",
  ]),
  mc(90, "According to Coulomb's law, if the magnitude of one of two point charges is doubled while the distance between them stays the same, the force between them:", [
    "doubles.",
    "quadruples.",
    "halves.",
    "stays the same.",
  ]),
  mc(91, "A charged object placed between two oppositely charged parallel plates experiences an electric force that is:", [
    "constant in size and direction anywhere between the plates, due to the uniform field.",
    "strongest only near one of the plates.",
    "zero at the centre of the gap.",
    "always directed along the plates, not between them.",
  ]),
  mc(92, "Electric current in a metal wire is carried by the movement of:", [
    "free (delocalised) electrons through the metal's lattice.",
    "protons moving through the wire.",
    "the metal's positive ions.",
    "positive 'holes' only.",
  ]),
  mc(93, "Which of the following would decrease the resistance of a metal wire?", [
    "Increasing its cross-sectional area.",
    "Increasing its length.",
    "Increasing its temperature.",
    "Using a less conductive material.",
  ]),
  mc(94, "For a non-ohmic device such as a filament globe, the relationship between voltage and current:", [
    "is not a straight line, because the globe's resistance changes as it heats up.",
    "is a straight line through the origin.",
    "is always exactly proportional.",
    "does not exist.",
  ]),
  mc(95, "In a series circuit, if one globe's filament breaks, the other globes in the same loop will:", [
    "also go out, because the circuit is broken and no current can flow.",
    "stay lit as normal.",
    "become brighter.",
    "be completely unaffected.",
  ]),
  mc(96, "In a parallel circuit, if one branch is disconnected, the other branches will:", [
    "continue to operate normally, since each branch has its own complete path for current.",
    "also stop working.",
    "become dimmer.",
    "carry no current at all.",
  ]),
  mc(97, "Adding more resistors in series in a circuit will cause the total resistance to:", [
    "increase, since the current must pass through each resistor in turn.",
    "decrease.",
    "stay exactly the same.",
    "become the average of the resistances.",
  ]),
  mc(98, "A galvanometer adapted to work as an ammeter needs a very low resistance because:", [
    "it is connected in series and should not significantly change the current it is measuring.",
    "it is connected in parallel and needs to draw as much current as possible.",
    "high resistance would make it read voltage instead of current.",
    "resistance is irrelevant to how an ammeter works.",
  ]),
  mc(99, "The strength of the magnetic field produced by a solenoid can be increased by:", [
    "increasing the number of turns of wire or adding a soft iron core.",
    "decreasing the current through it.",
    "reducing the number of turns of wire.",
    "removing any iron core from inside it.",
  ]),
  mc(100, "A magnetic compass placed near a current-carrying wire will:", [
    "deflect, showing that the current produces a magnetic field around the wire.",
    "not be affected at all by the current.",
    "only be affected by permanent magnets, not currents.",
    "always point directly at the wire, regardless of the current's direction.",
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

// ========================================================================
// Short answer — s51..s100 (second bank, factual / reasoning only)
// ========================================================================

const saQuestions2: ShortQuestion[] = [
  // --- Fundamentals of mechanics ---
  sa(51, 2, "Explain why velocity is a vector quantity but speed is a scalar quantity."),
  sa(52, 2, "Explain why an object moving at constant speed around a circular path is still accelerating."),
  sa(53, 3, "Describe the shape of a velocity–time graph for an object that starts at rest and undergoes constant acceleration, then travels at constant velocity, then decelerates uniformly back to rest."),
  sa(54, 2, "Explain the difference between average velocity and instantaneous velocity."),
  sa(55, 3, "Explain why all objects in free fall near Earth's surface (ignoring air resistance) have the same acceleration, regardless of their mass."),
  sa(56, 2, "State Newton's first law of motion and explain what is meant by 'inertia'."),
  sa(57, 3, "Explain, using Newton's second law, why a heavily loaded truck is harder to accelerate than an empty one, for the same driving force."),
  sa(58, 2, "Explain what is meant by a 'net force' and state what happens to an object's motion when the net force on it is zero."),
  sa(59, 3, "Explain why, according to Newton's third law, forces always occur in pairs, and explain why these paired forces do not cancel out for a single object."),
  sa(60, 2, "Distinguish between mass and weight."),
  sa(61, 3, "Explain why friction can sometimes be a useful force and sometimes an unwanted force, giving one example of each."),
  sa(62, 2, "Define kinetic energy and gravitational potential energy."),
  sa(63, 3, "Explain the law of conservation of energy and describe one example of energy being transformed from one form to another."),
  sa(64, 2, "Explain what is meant by an 'isolated system' in the context of the conservation of momentum."),
  sa(65, 3, "Explain, in terms of Newton's third law, why the total momentum of two colliding objects is conserved even though each object's individual momentum changes."),
  sa(66, 2, "Distinguish between elastic and inelastic collisions in terms of what quantities are conserved."),
  sa(67, 3, "Explain why a longer stopping time for a car (for example, braking gently rather than sharply) results in a smaller average force on the passengers."),
  sa(68, 2, "Explain why wearing a seatbelt reduces the risk of injury in a car crash, in terms of impulse and momentum."),
  // --- Waves ---
  sa(69, 2, "Explain what is meant by the amplitude of a wave and how it relates to the energy the wave carries."),
  sa(70, 3, "Explain the difference between the way a wave transfers energy and the way a moving object transfers matter."),
  sa(71, 2, "Explain, in words, the relationship between a wave's speed, its frequency and its wavelength."),
  sa(72, 3, "The diagram shows a ray of light passing from glass into air. Explain why the light's frequency stays the same even though its speed and wavelength change at the boundary.", RAY_OUT_OF_GLASS),
  sa(73, 2, "Describe what happens to the wavelength and frequency of a wave as it moves from a denser medium into a less dense one, given that its speed increases."),
  sa(74, 3, "Explain why sound waves can be heard around corners more easily than light waves can be seen around them, in terms of diffraction and wavelength."),
  sa(75, 2, "Explain what happens during total internal reflection at a boundary between a denser and a less dense medium."),
  sa(76, 3, "Explain how an optical fibre uses total internal reflection to transmit light over long distances."),
  sa(77, 2, "Explain the principle of superposition of waves."),
  sa(78, 3, "Distinguish between constructive interference and destructive interference, describing the conditions needed for each."),
  sa(79, 3, "Explain how a standing wave forms when a wave reflects back along a string that is fixed at one end."),
  sa(80, 2, "Explain why the Doppler effect causes a police siren to sound higher in pitch as it approaches and lower as it moves away."),
  sa(81, 2, "Explain what redshift indicates about the motion of a distant galaxy relative to Earth."),
  sa(82, 3, "Order the following regions of the electromagnetic spectrum from longest to shortest wavelength: visible light, gamma rays, radio waves, X-rays. Explain the general relationship between a region's wavelength and its energy."),
  sa(83, 2, "Explain why all electromagnetic waves can travel through a vacuum, unlike sound waves."),
  sa(84, 3, "Explain the difference between reflection and refraction of a light ray at a boundary between two media."),
  // --- Electricity and magnetism ---
  sa(85, 2, "Explain how an object becomes negatively charged, in terms of the movement of electrons."),
  sa(86, 3, "Explain the process of charging an object by induction, without the charged and neutral objects ever touching."),
  sa(87, 2, "Explain what electric field lines represent, in terms of their direction and their spacing."),
  sa(88, 2, "The diagram shows the electric field between two point charges. Explain why electric field lines never cross one another.", FIELD_DIPOLE),
  sa(89, 3, "Explain how the electrostatic force between two charged objects changes as (a) the size of the charges changes and (b) the distance between them changes, without using numbers."),
  sa(90, 2, "Distinguish between an insulator and a conductor in terms of the movement of electrons."),
  sa(91, 2, "Explain why the electric field between two oppositely charged parallel plates is uniform."),
  sa(92, 3, "Explain the difference between electric potential energy and electric potential difference (voltage)."),
  sa(93, 2, "Explain the difference between conventional current and the actual flow of electrons in a circuit."),
  sa(94, 3, "Explain how the resistance of a wire is affected by its length, its cross-sectional area and its temperature."),
  sa(95, 3, "Compare an ohmic conductor with a non-ohmic device such as a filament globe, in terms of the relationship between voltage and current."),
  sa(96, 3, "Compare how current and voltage are shared among components connected in series with how they are shared among components connected in parallel."),
  sa(97, 2, "Explain why adding resistors in parallel decreases a circuit's total resistance."),
  sa(98, 2, "Explain why an ammeter is designed to have a very low resistance, and a voltmeter a very high resistance."),
  sa(99, 3, "Describe the magnetic field pattern produced by a current-carrying solenoid, and explain how it compares with the field of a bar magnet."),
  sa(100, 2, "Explain two ways in which the strength of the magnetic field produced by an electromagnet could be increased."),
];

export const questions: Question[] = [
  ...mcQuestions,
  ...mcQuestions2,
  ...saQuestions,
  ...saQuestions2,
];

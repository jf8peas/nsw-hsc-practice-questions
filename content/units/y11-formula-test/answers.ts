import type { Answer, AnswerSet } from "@/lib/types";

// Answer key for y11-formula-test. NO "server-only" import here (so the content
// validator can read it); only ever re-exported via content/answers/index.ts,
// which is server-only. Never import this file from a client component.

const U = "y11-formula-test";
const p2 = (n: number) => String(n).padStart(2, "0");

// ---- short answers ---------------------------------------------------------

/** what the formula tells you (reused across a formula's short questions) */
const TELLS: Record<string, string> = {
  suvat_s: "It gives the displacement of an object moving with constant (uniform) acceleration, from its initial velocity, its acceleration and the time.",
  suvat_v2: "It links an object's final velocity to its initial velocity, acceleration and displacement when the acceleration is constant — with no time term.",
  suvat_v: "It gives the final velocity of an object moving with constant acceleration after a time t.",
  fma: "It states that the net (resultant) force on an object equals its mass times its acceleration (Newton's second law).",
  gpe: "It gives the change in gravitational potential energy of a mass raised or lowered through a height Δh near the Earth's surface.",
  work: "It gives the work done by a constant force whose point of application moves through a displacement s, where θ is the angle between the force and the displacement.",
  ke: "It gives the translational kinetic energy of a mass m moving at speed v.",
  powerE: "It gives the average power — the rate at which energy is transferred or transformed.",
  powerFv: "It gives the power delivered by a force F to an object moving with velocity v, where θ is the angle between them.",
  consKE: "It states that the total kinetic energy of a system is the same before and after an interaction; this only holds for an elastic collision.",
  consP: "It states that the total momentum of a system is unchanged by an interaction when no net external force acts on it (conservation of momentum).",
  impulse: "It states that the change in an object's momentum equals the impulse — the net force multiplied by the time for which it acts.",
  ugrav: "It gives the gravitational potential energy of a mass m a distance r from a mass M, with the zero of energy taken at infinite separation (so U is negative).",
  wave: "It relates the speed of a wave to its frequency and its wavelength.",
  fT: "It states that the frequency of a periodic event is the reciprocal of its period.",
  refIndex: "It defines the refractive index of a medium as the speed of light in a vacuum divided by its speed in that medium.",
  specHeat: "It gives the heat energy needed to change the temperature of a mass m of a substance by ΔT, given its specific heat capacity.",
  beats: "It gives the beat frequency heard when two notes of slightly different frequency sound together — the size of the difference between them.",
  doppler: "It gives the frequency detected by an observer when the source and/or observer move relative to the medium (the Doppler effect).",
  snell: "It relates the angles a light ray makes with the normal on each side of a boundary to the refractive indices of the two media (Snell's law).",
  critical: "It gives the critical angle of incidence beyond which light going from a denser to a less dense medium is totally internally reflected.",
  invSquare: "It expresses the inverse-square law: the intensity of radiation from a point source falls off with the square of the distance from it.",
  conduction: "It gives the rate at which heat is conducted through a slab of material of area A and thickness d with a temperature difference ΔT across it.",
  eField: "It gives the strength of the uniform electric field between two parallel plates from the voltage across them and their separation.",
  potDiff: "It defines the electric potential difference between two points as the change in electric potential energy per unit charge moved between them.",
  wqv: "It gives the work done (energy transferred) when a charge q moves through a potential difference V.",
  wqed: "It gives the work done on a charge q as it moves a distance d through a uniform electric field E.",
  bWire: "It gives the magnetic field strength at a perpendicular distance r from a long straight wire carrying current I.",
  fqe: "It gives the force on a charge q placed in an electric field E.",
  coulomb: "It gives the electrostatic force between two point charges — proportional to the product of the charges and inversely proportional to the square of their separation (Coulomb's law).",
  current: "It defines electric current as the rate of flow of charge — the charge passing a point divided by the time taken.",
  ohm: "It relates the potential difference across an ohmic conductor to the current through it and its resistance (Ohm's law).",
  pvi: "It gives the electrical power delivered to or dissipated by a component as the potential difference across it times the current through it.",
  fqvb: "It gives the force on a charge q moving at speed v through a magnetic field B, where θ is the angle between the velocity and the field.",
  flib: "It gives the force on a length l of conductor carrying current I in a magnetic field B, where θ is the angle between the conductor and the field.",
  parallelWires: "It gives the force per unit length between two long parallel conductors carrying currents I₁ and I₂ a distance r apart.",
};

function sa(
  n: number,
  tells: string,
  quantity: string,
  unit: string,
  notes?: string,
): [string, Answer] {
  return [
    `${U}.s${p2(n)}`,
    {
      modelAnswer: `(a) ${tells} (b) It represents ${quantity}. (c) SI unit: ${unit}.`,
      rubric: [
        `Describes what the formula tells you (${tells})`,
        `Names the quantity: ${quantity}`,
        `States the SI unit: ${unit}`,
      ],
      notes,
    },
  ];
}

const MS = "metre per second (m s⁻¹)";
const J = "joule (J)";
const M = "metre (m)";
const HZ = "hertz (Hz)";
const RAD = "radian (rad); degrees are also used in practice";
const DIMLESS = "none — refractive index is a ratio and has no unit";

const shortAnswers: Array<[string, Answer]> = [
  sa(1, TELLS.suvat_s, "the displacement of the object", M),
  sa(2, TELLS.suvat_v2, "the final velocity of the object", MS),
  sa(3, TELLS.suvat_v, "the final velocity of the object", MS),
  sa(4, TELLS.fma, "the net (resultant) force on the object", "newton (N)"),
  sa(5, TELLS.gpe, "the change in gravitational potential energy", J),
  sa(6, TELLS.work, "the work done by the force", J),
  sa(7, TELLS.ke, "the kinetic energy of the object", J),
  sa(8, TELLS.powerE, "power — the rate of energy transfer", "watt (W)"),
  sa(9, TELLS.powerFv, "power", "watt (W)"),
  sa(10, TELLS.consKE, "the speed of one of the colliding objects", MS),
  sa(11, TELLS.consP, "the mass of one of the objects", "kilogram (kg)"),
  sa(12, TELLS.impulse, "the change in momentum (equal to the impulse)", "kilogram metre per second (kg m s⁻¹), equivalently newton second (N s)"),
  sa(13, TELLS.ugrav, "the gravitational potential energy of the two-mass system", J),
  sa(14, TELLS.wave, "the wavelength of the wave", M),
  sa(15, TELLS.fT, "the period of the wave (time for one cycle)", "second (s)"),
  sa(16, TELLS.refIndex, "the absolute refractive index of the medium", DIMLESS),
  sa(17, TELLS.specHeat, "the heat energy transferred to or from the substance", J),
  sa(18, TELLS.beats, "the beat frequency", HZ),
  sa(19, TELLS.doppler, "the frequency detected by the observer", HZ),
  sa(20, TELLS.snell, "the angle of incidence, measured from the normal", RAD),
  sa(21, TELLS.critical, "the critical angle", RAD),
  sa(22, TELLS.invSquare, "the intensity of the radiation at the first position", "watt per square metre (W m⁻²)"),
  sa(23, TELLS.conduction, "the thermal conductivity of the material", "watt per metre per kelvin (W m⁻¹ K⁻¹)"),
  sa(24, TELLS.eField, "the electric field strength between the plates", "volt per metre (V m⁻¹), equivalently newton per coulomb (N C⁻¹)"),
  sa(25, TELLS.potDiff, "the electric potential difference (voltage) between the two points", "volt (V)"),
  sa(26, TELLS.wqv, "the electric charge that is moved", "coulomb (C)"),
  sa(27, TELLS.wqed, "the electric field strength", "newton per coulomb (N C⁻¹), equivalently volt per metre (V m⁻¹)"),
  sa(28, TELLS.bWire, "the magnetic field strength (magnetic flux density)", "tesla (T)"),
  sa(29, TELLS.fqe, "the force on the charge", "newton (N)"),
  sa(30, TELLS.coulomb, "the electrostatic force between the two point charges", "newton (N)"),
  sa(31, TELLS.current, "the electric current", "ampere (A)"),
  sa(32, TELLS.ohm, "the resistance of the conductor", "ohm (Ω)"),
  sa(33, TELLS.pvi, "the electrical power", "watt (W)"),
  sa(34, TELLS.fqvb, "the magnetic force on the moving charge", "newton (N)"),
  sa(35, TELLS.flib, "the force on the current-carrying conductor", "newton (N)"),
  sa(36, TELLS.parallelWires, "the force per unit length between the two wires", "newton per metre (N m⁻¹)"),
  sa(37, TELLS.suvat_s, "the initial velocity of the object", MS),
  sa(38, TELLS.suvat_v2, "the constant acceleration of the object", "metre per second squared (m s⁻²)"),
  sa(39, TELLS.suvat_v, "the time interval", "second (s)"),
  sa(40, TELLS.fma, "the mass of the object", "kilogram (kg)"),
  sa(41, TELLS.gpe, "the change in height", M),
  sa(42, TELLS.work, "the angle between the force and the displacement", RAD),
  sa(43, TELLS.ke, "the speed of the object", MS),
  sa(44, TELLS.specHeat, "the specific heat capacity of the substance", "joule per kilogram per kelvin (J kg⁻¹ K⁻¹)"),
  sa(45, TELLS.snell, "the refractive index of the second medium", DIMLESS),
  sa(46, TELLS.invSquare, "the distance from the source at the first position", M),
  sa(47, TELLS.bWire, "the perpendicular distance from the wire", M),
  sa(48, TELLS.coulomb, "the distance between the two point charges", M),
  sa(49, TELLS.ohm, "the potential difference across the conductor", "volt (V)"),
  sa(50, TELLS.fqvb, "the magnetic field strength (magnetic flux density)", "tesla (T)"),
];

// ---- multiple choice ------------------------------------------------------

function ma(n: number, correctText: string, why: string): [string, Answer] {
  return [`${U}.m${p2(n)}`, { correctText, rubric: [why] }];
}

const mcAnswers: Array<[string, Answer]> = [
  ma(1, "Find how far a car travels in 4.0 s if it starts at 8.0 m s⁻¹ and accelerates uniformly at 2.0 m s⁻².", "s = ut + ½at² gives displacement from u, a and t. The distractors need v = u + at, F = ma and K = ½mv²."),
  ma(2, "Find the take-off speed of a plane after it accelerates at 3.0 m s⁻² from rest along a 900 m runway.", "v² = u² + 2as links final speed to u, a and s with no time. The distractors need v = u + at, F = ma and p = mv."),
  ma(3, "Find the velocity of a ball 1.5 s after it is thrown straight up at 8.0 m s⁻¹.", "v = u + at gives velocity after a time t. The distractors need v² = u² + 2as, ΔU = mgΔh and Δp = FΔt."),
  ma(4, "Find the net force on a 1200 kg car that is accelerating at 3.0 m s⁻².", "F_net = ma gives net force from mass and acceleration. The distractors need v = u + at, W = Fs and K = ½mv²."),
  ma(5, "Find the gravitational potential energy gained when a 45 kg performer is lifted 3.0 m onto a platform.", "ΔU = mgΔh gives change in gravitational PE near Earth. The distractors need K = ½mv², P = ΔE/Δt and p = mv."),
  ma(6, "Find the work done by a 1200 N driving force as a car moves 600 m in the direction of the force.", "W = Fs cos θ gives work done by a force over a displacement. The distractors need P = Fv, F = ma and ΔU = mgΔh."),
  ma(7, "Find the kinetic energy of a 5.0 kg trolley moving at 4.0 m s⁻¹.", "K = ½mv² gives kinetic energy from mass and speed. The distractors need p = mv, ΔU = mgΔh and Δp = FΔt."),
  ma(8, "Find the power of a kettle that transfers 168 000 J of heat to the water in 95 s.", "P = ΔE/Δt gives power as energy per unit time. The distractors need Q = mcΔT, W = Fs and V = IR."),
  ma(9, "Find the power a train's engine delivers while pulling with 20 000 N at a steady 25 m s⁻¹.", "P = Fv cos θ gives power from force and velocity. The distractors need W = Fs, F = ma and P = ΔE/Δt."),
  ma(10, "Check whether a collision between two pucks is elastic by comparing total kinetic energy before and after.", "Σ½mv²(before) = Σ½mv²(after) only holds for elastic collisions, so it is the test for one. The distractors need conservation of momentum and Δp = FΔt."),
  ma(11, "Find the velocity of a stationary 1.5 kg mass after a 3.0 kg mass moving at 0.40 m s⁻¹ strikes it.", "Conservation of momentum gives the unknown final velocity. The distractors need KE conservation, Δp = FΔt and K = ½mv²."),
  ma(12, "Find the impact speed of a 2000 kg crash-test car from the area under its force–time graph.", "Area under a force–time graph is impulse; Δp = FΔt then gives the speed change. The distractors need F = ma, K = ½mv² and W = Fs."),
  ma(13, "Find the gravitational potential energy of a 500 kg probe 2.0 × 10⁷ m from the centre of a planet.", "U = −GMm/r gives gravitational PE far from a planet. The near-surface distractor uses ΔU = mgΔh; the others need K = ½mv² and p = mv."),
  ma(14, "Find the wavelength in air of a 3.3 × 10⁷ Hz radio wave.", "v = fλ links wave speed, frequency and wavelength. The distractors need f = 1/T, n = c/v and f_beat."),
  ma(15, "Find the frequency of a wave whose period is read from a CRO trace as 4.0 ms.", "f = 1/T converts a period into a frequency. The distractors need v = fλ, f_beat and the Doppler effect."),
  ma(16, "Find the refractive index of glass in which light travels at 2.0 × 10⁸ m s⁻¹.", "n = c/v gives refractive index from the speed of light in the medium. The distractors need Snell's law, the critical angle and v = fλ."),
  ma(17, "Find the energy needed to raise the temperature of 2.0 kg of water by 10 °C.", "Q = mcΔT gives the heat for a temperature change. The distractors need Q/t = kAΔT/d, ΔU = mgΔh and P = ΔE/Δt."),
  ma(18, "Find how many beats per second are heard when a 256 Hz and a 259 Hz tuning fork sound together.", "f_beat = |f₂ − f₁| gives the beat frequency. The distractors need f = 1/T, the Doppler effect and v = fλ."),
  ma(19, "Find the frequency a stationary observer hears from a 1200 Hz siren on a truck approaching at 30 m s⁻¹.", "The Doppler formula gives the observed frequency for a moving source. The distractors need f_beat, v = fλ and f = 1/T."),
  ma(20, "Find the angle of refraction when light passes from water (n = 1.33) into glass (n = 1.52) at 40°.", "Snell's law relates the angles and refractive indices at a boundary. The distractors need the critical angle, n = c/v and v = fλ."),
  ma(21, "Find the smallest angle of incidence at which light is totally internally reflected in a fibre of n = 1.48.", "sin θ_c = n₂/n₁ gives the critical angle. The distractors need Snell's law, n = c/v and v = fλ."),
  ma(22, "Find the light intensity 4.0 m from a lamp, given its intensity at 1.0 m.", "I₁r₁² = I₂r₂² is the inverse-square law for intensity. The distractors need P = ΔE/Δt, Q = mcΔT and v = fλ."),
  ma(23, "Find the rate heat is conducted through a 6.0 mm window, 1.5 m² in area, with 15 °C across it.", "Q/t = kAΔT/d gives the rate of heat conduction through a slab. The distractors need Q = mcΔT, P = ΔE/Δt and P = VI."),
  ma(24, "Find the electric field strength between two parallel plates 1.5 cm apart connected to a 12 V supply.", "E = V/d gives the uniform field between plates. The distractors need F = qE, W = qV and I = q/t."),
  ma(25, "Find the potential difference given that 3.0 J of electrical PE is lost when 0.50 C moves between two points.", "V = ΔU/q gives potential difference as energy per unit charge. The distractors need E = V/d, W = qV and V = IR."),
  ma(26, "Find the work done moving a +3.6 mC charge through a potential difference of 160 V.", "W = qV gives the work to move a charge through a voltage. The distractors need E = V/d, Coulomb's law and I = q/t."),
  ma(27, "Find the work done on a +2.5 µC charge as it moves 0.5 cm through a uniform 800 N C⁻¹ field.", "W = qEd gives the work on a charge crossing a uniform field. The distractors need F = qE, E = V/d and I = q/t."),
  ma(28, "Find the magnetic field strength 20 cm from a long straight wire carrying 10 A.", "B = μ₀I/2πr gives the field around a straight wire. The distractors need F = lIB, F = qvB and the force between parallel wires."),
  ma(29, "Find the force on a −2.5 µC charge sitting in a uniform electric field of 800 N C⁻¹.", "F = qE gives the force on a charge in an electric field. The distractors need Coulomb's law, F = qvB and E = V/d."),
  ma(30, "Find the electrostatic force on a +5.0 µC charge from a +8.0 µC charge 4.0 cm away.", "Coulomb's law gives the force between two point charges. The distractors need F = qE, E = V/d and W = qV."),
  ma(31, "Find the current in a wire when 360 C of charge passes a point in 60 s.", "I = q/t defines current as charge per unit time. The distractors need V = IR, P = VI and W = qV."),
  ma(32, "Find the current through a 6.0 Ω resistor connected across a 12 V supply.", "V = IR (Ohm's law) links voltage, current and resistance. The distractors need P = VI, I = q/t and E = V/d."),
  ma(33, "Find the power dissipated by a heating coil carrying 6.0 A at 30 V.", "P = VI gives electrical power from voltage and current. The distractors need V = IR, I = q/t and Q = mcΔT."),
  ma(34, "Find the force on a proton moving at 2.0 × 10⁶ m s⁻¹ at right angles to a 0.30 T magnetic field.", "F = qvB sin θ gives the force on a moving charge in a magnetic field. The distractors need F = lIB, Coulomb's law and B = μ₀I/2πr."),
  ma(35, "Find the force on a 4.0 cm length of wire carrying 3.0 A at right angles to a 0.25 T field.", "F = lIB sin θ gives the force on a current-carrying conductor. The distractors need F = qvB, the force between parallel wires and B = μ₀I/2πr."),
  ma(36, "Find the force per metre between two parallel wires 5.0 cm apart carrying 10 A and 15 A.", "F/l = (μ₀/2π)(I₁I₂/r) gives the force per unit length between parallel currents. The distractors need F = lIB, B = μ₀I/2πr and F = qvB."),
  ma(37, "Find the distance a book slides down a tilted desk in 1.25 s, starting from rest.", "s = ut + ½at² gives displacement from rest under constant acceleration. The distractors need v = u + at, F = ma and K = ½mv²."),
  ma(38, "Find a car's velocity 5.5 s after it starts braking at 3.0 m s⁻² from 17 m s⁻¹.", "v = u + at gives velocity after a time under constant acceleration. The distractors need v² = u² + 2as, F = ma and p = mv."),
  ma(39, "Find the acceleration of two blocks (total 80 kg) pushed across a frictionless floor by a 200 N force.", "F_net = ma gives acceleration from net force and total mass. The distractors need v = u + at, W = Fs and K = ½mv²."),
  ma(40, "Find the potential energy a 38 kg student gains climbing a 3.2 m flight of stairs.", "ΔU = mgΔh gives gravitational PE gained over a height. The distractors need P = ΔE/Δt, K = ½mv² and p = mv."),
  ma(41, "Find the momentum of the third fragment when a stationary 5.5 kg shell bursts into three pieces.", "Conservation of momentum (total zero before) gives the third momentum. The distractors need K = ½mv² and Δp = FΔt."),
  ma(42, "Find the average force on each of two cars in a 0.40 s head-on collision, given their change in velocity.", "Δp = F_net Δt gives the average force from the momentum change and contact time. The distractors need F = ma, K = ½mv² and ΔU = mgΔh."),
  ma(43, "Find the specific heat capacity of a metal block from the temperature change when it is dropped into known water.", "Q = mcΔT (with heat lost = heat gained) gives an unknown specific heat. The distractors need Q/t = kAΔT/d, P = ΔE/Δt and ΔU = mgΔh."),
  ma(44, "Find the frequency an observer hears once a 1000 Hz aircraft has passed and is receding at 100 m s⁻¹.", "The Doppler formula gives the observed frequency for a receding source. The distractors need f_beat, f = 1/T and v = fλ."),
  ma(45, "Find the refractive index of a Perspex block from the gradient of a sin i versus sin r graph.", "Snell's law makes the gradient of sin i vs sin r equal to the refractive index. The distractors need the critical angle, n = c/v and v = fλ."),
  ma(46, "Find how many times brighter a lamp 20 cm from a page is than a ceiling light 2.0 m away.", "I₁r₁² = I₂r₂² (inverse-square law) compares intensities at two distances. The distractors need P = ΔE/Δt, Q = mcΔT and P = VI."),
  ma(47, "Find how the magnetic field strength changes as you move from 10 cm to 20 cm from a straight wire.", "B = μ₀I/2πr shows B ∝ 1/r for a straight wire. The distractors need F = lIB, the force between parallel wires and F = qvB."),
  ma(48, "Find the separation at which a +6 µC and a −8 µC charge attract each other with a force of 1.11 N.", "Coulomb's law, rearranged for r, gives the separation for a given force. The distractors need F = qE, W = qV and E = V/d."),
  ma(49, "Find the energy a spotlight uses in one hour from its operating voltage and current.", "P = VI gives power, and energy = power × time. The distractors need V = IR, I = q/t and the inverse-square law."),
  ma(50, "Find the force on an electron entering a 0.20 T field at 45° to the field lines at 3.0 × 10⁶ m s⁻¹.", "F = qvB sin θ gives the force on a charge moving at an angle to a magnetic field. The distractors need F = lIB, Coulomb's law and B = μ₀I/2πr."),
];

export const answers: AnswerSet = Object.fromEntries([
  ...shortAnswers,
  ...mcAnswers,
]);

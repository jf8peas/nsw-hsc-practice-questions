import type { McQuestion, Question, ShortQuestion } from "@/lib/types";
import { shuffleBySeed } from "@/lib/shuffle";
import { F, type FormulaDef } from "@/content/formulas";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Built from resources/topic001/y11-formula-sheet.pdf (crossed-out formulas
// excluded) and the scenario bank in docs/y11-formula-test-research.md.
//
// 100 short-answer + 100 multiple-choice. A quiz attempt draws 5 of each at
// random (see meta.ts > quiz), so a student gets 20 non-repeating attempts.

const U = "y11-formula-test";
const p2 = (n: number) => String(n).padStart(2, "0");

/**
 * Short-answer question. The student must (a) say what the formula tells you,
 * (b) name the quantity `variable` stands for, (c) give its SI unit.
 */
function short(n: number, f: FormulaDef, variable: string): ShortQuestion {
  return {
    id: `${U}.s${p2(n)}`,
    type: "short",
    formula: f.text,
    formulaTex: f.tex,
    prompt:
      `(a) In one sentence, describe what this formula tells you or lets you calculate.\n` +
      `(b) What quantity does “${variable}” represent in this formula?\n` +
      `(c) State the SI unit of that quantity (its name or symbol).`,
    maxMarks: 3,
  };
}

/**
 * Multiple-choice question. `canonical[0]` is the scenario this formula answers;
 * the rest are answered by other formulas on the sheet. Option order is
 * scrambled deterministically by id so the public bundle never shows a
 * "correct is first" pattern; answers.ts derives correctIndex the same way.
 */
function mc(n: number, f: FormulaDef, canonical: [string, string, string, string]): McQuestion {
  const id = `${U}.m${p2(n)}`;
  return {
    id,
    type: "mc",
    formula: f.text,
    formulaTex: f.tex,
    prompt: "Which of these questions could this formula be used to answer?",
    maxMarks: 1,
    options: shuffleBySeed(id, canonical),
  };
}

const shortQuestions: ShortQuestion[] = [
  // one per formula (primary variable) — s01..s36
  short(1, F.suvat_s, "s"),
  short(2, F.suvat_v2, "v"),
  short(3, F.suvat_v, "v"),
  short(4, F.fma, "F_net"),
  short(5, F.gpe, "ΔU"),
  short(6, F.work, "W"),
  short(7, F.ke, "K"),
  short(8, F.powerE, "P"),
  short(9, F.powerFv, "P"),
  short(10, F.consKE, "v"),
  short(11, F.consP, "m"),
  short(12, F.impulse, "Δp"),
  short(13, F.ugrav, "U"),
  short(14, F.wave, "λ"),
  short(15, F.fT, "T"),
  short(16, F.refIndex, "n"),
  short(17, F.specHeat, "Q"),
  short(18, F.beats, "f_beat"),
  short(19, F.doppler, "f ′"),
  short(20, F.snell, "θ₁"),
  short(21, F.critical, "θ_c"),
  short(22, F.invSquare, "I₁"),
  short(23, F.conduction, "k"),
  short(24, F.eField, "E"),
  short(25, F.potDiff, "V"),
  short(26, F.wqv, "q"),
  short(27, F.wqed, "E"),
  short(28, F.bWire, "B"),
  short(29, F.fqe, "F"),
  short(30, F.coulomb, "F"),
  short(31, F.current, "I"),
  short(32, F.ohm, "R"),
  short(33, F.pvi, "P"),
  short(34, F.fqvb, "F"),
  short(35, F.flib, "F"),
  short(36, F.parallelWires, "F / l"),
  // second variable on richer formulas — s37..s50
  short(37, F.suvat_s, "u"),
  short(38, F.suvat_v2, "a"),
  short(39, F.suvat_v, "t"),
  short(40, F.fma, "m"),
  short(41, F.gpe, "Δh"),
  short(42, F.work, "θ"),
  short(43, F.ke, "v"),
  short(44, F.specHeat, "c"),
  short(45, F.snell, "n₂"),
  short(46, F.invSquare, "r₁"),
  short(47, F.bWire, "r"),
  short(48, F.coulomb, "r"),
  short(49, F.ohm, "V"),
  short(50, F.fqvb, "B"),
  // third variable on each formula — s51..s86
  short(51, F.suvat_s, "a"),
  short(52, F.suvat_v2, "u"),
  short(53, F.suvat_v, "a"),
  short(54, F.fma, "a"),
  short(55, F.gpe, "m"),
  short(56, F.work, "F"),
  short(57, F.ke, "m"),
  short(58, F.powerE, "ΔE"),
  short(59, F.powerFv, "F"),
  short(60, F.consKE, "m"),
  short(61, F.consP, "v"),
  short(62, F.impulse, "F_net"),
  short(63, F.ugrav, "m"),
  short(64, F.wave, "v"),
  short(65, F.fT, "f"),
  short(66, F.refIndex, "c"),
  short(67, F.specHeat, "m"),
  short(68, F.beats, "f₁"),
  short(69, F.doppler, "f"),
  short(70, F.snell, "n₁"),
  short(71, F.critical, "n₁"),
  short(72, F.invSquare, "I₂"),
  short(73, F.conduction, "A"),
  short(74, F.eField, "V"),
  short(75, F.potDiff, "ΔU"),
  short(76, F.wqv, "W"),
  short(77, F.wqed, "q"),
  short(78, F.bWire, "I"),
  short(79, F.fqe, "q"),
  short(80, F.coulomb, "q₁"),
  short(81, F.current, "q"),
  short(82, F.ohm, "I"),
  short(83, F.pvi, "V"),
  short(84, F.fqvb, "q"),
  short(85, F.flib, "I"),
  short(86, F.parallelWires, "I₁"),
  // fourth variable on selected formulas — s87..s100
  short(87, F.suvat_s, "t"),
  short(88, F.suvat_v2, "s"),
  short(89, F.work, "s"),
  short(90, F.powerFv, "v"),
  short(91, F.impulse, "Δt"),
  short(92, F.wave, "f"),
  short(93, F.specHeat, "ΔT"),
  short(94, F.doppler, "v_source"),
  short(95, F.snell, "θ₂"),
  short(96, F.critical, "n₂"),
  short(97, F.eField, "d"),
  short(98, F.wqed, "d"),
  short(99, F.pvi, "I"),
  short(100, F.parallelWires, "r"),
];

const mcQuestions: McQuestion[] = [
  // one per formula — m01..m36
  mc(1, F.suvat_s, [
    "Find how far a car travels in 4.0 s if it starts at 8.0 m s⁻¹ and accelerates uniformly at 2.0 m s⁻².",
    "Find the velocity of that car after the 4.0 s.",
    "Find the net force on the 1500 kg car while it accelerates.",
    "Find the car's kinetic energy at the moment it starts.",
  ]),
  mc(2, F.suvat_v2, [
    "Find the take-off speed of a plane after it accelerates at 3.0 m s⁻² from rest along a 900 m runway.",
    "Find how long the plane takes to reach take-off speed.",
    "Find the thrust needed to accelerate the 50 000 kg plane.",
    "Find the plane's momentum at take-off.",
  ]),
  mc(3, F.suvat_v, [
    "Find the velocity of a ball 1.5 s after it is thrown straight up at 8.0 m s⁻¹.",
    "Find the maximum height the ball reaches above its release point.",
    "Find the gravitational potential energy the 0.20 kg ball has at the top.",
    "Find the impulse gravity gives the ball during the 1.5 s.",
  ]),
  mc(4, F.fma, [
    "Find the net force on a 1200 kg car that is accelerating at 3.0 m s⁻².",
    "Find the car's velocity after it accelerates from rest for 5.0 s.",
    "Find the work the driving force does as the car moves 40 m.",
    "Find the car's kinetic energy when it reaches 15 m s⁻¹.",
  ]),
  mc(5, F.gpe, [
    "Find the gravitational potential energy gained when a 45 kg performer is lifted 3.0 m onto a platform.",
    "Find the performer's kinetic energy just before landing back on the ground.",
    "Find the power of the winch that lifts the performer in 2.0 s.",
    "Find the performer's momentum just before landing.",
  ]),
  mc(6, F.work, [
    "Find the work done by a 1200 N driving force as a car moves 600 m in the direction of the force.",
    "Find the power the engine delivers if the car moves at 25 m s⁻¹.",
    "Find the car's acceleration under a net force of 1200 N.",
    "Find the potential energy the car gains climbing a 10 m hill.",
  ]),
  mc(7, F.ke, [
    "Find the kinetic energy of a 5.0 kg trolley moving at 4.0 m s⁻¹.",
    "Find the momentum of that trolley.",
    "Find the potential energy of the trolley 4.0 m above the floor.",
    "Find the net force needed to stop the trolley in 4.0 s.",
  ]),
  mc(8, F.powerE, [
    "Find the power of a kettle that transfers 168 000 J of heat to the water in 95 s.",
    "Find the heat needed to raise 0.50 kg of water by 80 °C.",
    "Find the work done by the 8.0 N force pushing the kettle 0.30 m.",
    "Find the resistance of the kettle's element carrying 10 A at 240 V.",
  ]),
  mc(9, F.powerFv, [
    "Find the power a train's engine delivers while pulling with 20 000 N at a steady 25 m s⁻¹.",
    "Find the work the engine does over a 500 m stretch of track.",
    "Find the train's acceleration under a net force of 20 000 N.",
    "Find the energy the engine supplies in 60 s if it uses 1.2 MJ.",
  ]),
  mc(10, F.consKE, [
    "Check whether a collision between two pucks is elastic by comparing total kinetic energy before and after.",
    "Find the velocity of the second puck after the collision from the first puck's velocities.",
    "Find the impulse one puck delivers to the other during the collision.",
    "Find the average force between the pucks during a 0.20 s contact.",
  ]),
  mc(11, F.consP, [
    "Find the velocity of a stationary 1.5 kg mass after a 3.0 kg mass moving at 0.40 m s⁻¹ strikes it.",
    "Find whether kinetic energy is conserved in that collision.",
    "Find the average force on the 3.0 kg mass during a 0.10 s contact.",
    "Find the kinetic energy lost in the collision.",
  ]),
  mc(12, F.impulse, [
    "Find the impact speed of a 2000 kg crash-test car from the area under its force–time graph.",
    "Find the car's maximum acceleration from the peak force on the graph.",
    "Find the kinetic energy the car had just before impact.",
    "Find the work done by the barrier as the car crumples 0.5 m.",
  ]),
  mc(13, F.ugrav, [
    "Find the gravitational potential energy of a 500 kg probe 2.0 × 10⁷ m from the centre of a planet.",
    "Find the potential energy gained lifting a 2.0 kg book 1.5 m in a laboratory.",
    "Find the kinetic energy of the probe moving at 3.0 km s⁻¹.",
    "Find the probe's momentum in orbit.",
  ]),
  mc(14, F.wave, [
    "Find the wavelength in air of a 3.3 × 10⁷ Hz radio wave.",
    "Find the period of that radio wave.",
    "Find the refractive index of a medium in which light slows to 2.0 × 10⁸ m s⁻¹.",
    "Find the beat frequency of two notes at 400 Hz and 402 Hz.",
  ]),
  mc(15, F.fT, [
    "Find the frequency of a wave whose period is read from a CRO trace as 4.0 ms.",
    "Find the wavelength of that wave if it travels at 340 m s⁻¹.",
    "Find the beat frequency between a 256 Hz and a 260 Hz tuning fork.",
    "Find the frequency heard as a siren approaches at 30 m s⁻¹.",
  ]),
  mc(16, F.refIndex, [
    "Find the refractive index of glass in which light travels at 2.0 × 10⁸ m s⁻¹.",
    "Find the angle of refraction when light enters that glass at 30°.",
    "Find the critical angle for the glass–air boundary.",
    "Find the wavelength of the light in air given its frequency.",
  ]),
  mc(17, F.specHeat, [
    "Find the energy needed to raise the temperature of 2.0 kg of water by 10 °C.",
    "Find the rate of heat flow through a 5.0 mm glass window pane.",
    "Find the potential energy gained lifting the 2.0 kg mass 10 m.",
    "Find the power of the heater if it supplies that energy in 60 s.",
  ]),
  mc(18, F.beats, [
    "Find how many beats per second are heard when a 256 Hz and a 259 Hz tuning fork sound together.",
    "Find the frequency of a note whose period is 3.9 ms.",
    "Find the frequency an observer hears as the source approaches at 20 m s⁻¹.",
    "Find the wavelength of a 256 Hz sound in air.",
  ]),
  mc(19, F.doppler, [
    "Find the frequency a stationary observer hears from a 1200 Hz siren on a truck approaching at 30 m s⁻¹.",
    "Find the beat frequency between the approaching siren and a 1200 Hz reference tone.",
    "Find the wavelength of the 1200 Hz sound in still air.",
    "Find the period of the 1200 Hz sound.",
  ]),
  mc(20, F.snell, [
    "Find the angle of refraction when light passes from water (n = 1.33) into glass (n = 1.52) at 40°.",
    "Find the critical angle for the glass–water boundary.",
    "Find the speed of light inside the glass.",
    "Find the wavelength of the light in air from its frequency.",
  ]),
  mc(21, F.critical, [
    "Find the smallest angle of incidence at which light is totally internally reflected in a fibre of n = 1.48.",
    "Find the angle of refraction for light entering the fibre at 20°.",
    "Find the speed of light inside the fibre.",
    "Find the wavelength of the light inside the fibre.",
  ]),
  mc(22, F.invSquare, [
    "Find the light intensity 4.0 m from a lamp, given its intensity at 1.0 m.",
    "Find the energy the lamp radiates in 60 s.",
    "Find the heat needed to warm a surface the light falls on by 5 °C.",
    "Find the wavelength of the lamp's light.",
  ]),
  mc(23, F.conduction, [
    "Find the rate heat is conducted through a 6.0 mm window, 1.5 m² in area, with 15 °C across it.",
    "Find the energy needed to warm the 2.0 kg glass pane by 15 °C.",
    "Find the power of a heater that replaces the lost heat in 30 s.",
    "Find the electrical power of a 2.0 kW heater on 240 V mains.",
  ]),
  mc(24, F.eField, [
    "Find the electric field strength between two parallel plates 1.5 cm apart connected to a 12 V supply.",
    "Find the force on a −2.5 µC charge placed between the plates.",
    "Find the work done moving that charge from one plate to the other.",
    "Find the current in the wire connecting the plates to the supply.",
  ]),
  mc(25, F.potDiff, [
    "Find the potential difference given that 3.0 J of electrical PE is lost when 0.50 C moves between two points.",
    "Find the electric field between two plates 2.0 cm apart at that voltage.",
    "Find the work done moving 2.0 C through that potential difference.",
    "Find the resistance of a component carrying 0.50 A at that voltage.",
  ]),
  mc(26, F.wqv, [
    "Find the work done moving a +3.6 mC charge through a potential difference of 160 V.",
    "Find the electric field strength between plates 4.0 cm apart at 160 V.",
    "Find the force between the 3.6 mC charge and another charge 5.0 cm away.",
    "Find the current if the charge is delivered in 2.0 s.",
  ]),
  mc(27, F.wqed, [
    "Find the work done on a +2.5 µC charge as it moves 0.5 cm through a uniform 800 N C⁻¹ field.",
    "Find the force on that charge in the field.",
    "Find the field strength between plates 1.5 cm apart connected to 12 V.",
    "Find the current that flows while the charge moves.",
  ]),
  mc(28, F.bWire, [
    "Find the magnetic field strength 20 cm from a long straight wire carrying 10 A.",
    "Find the force on a 5.0 cm length of that wire in an external 0.30 T field.",
    "Find the force on an electron moving at 2.0 × 10⁶ m s⁻¹ across that field.",
    "Find the force per metre between that wire and a parallel wire 20 cm away.",
  ]),
  mc(29, F.fqe, [
    "Find the force on a −2.5 µC charge sitting in a uniform electric field of 800 N C⁻¹.",
    "Find the force between that charge and a +8 µC charge 4.0 cm away.",
    "Find the force on the charge as it moves at 3.0 × 10⁵ m s⁻¹ across a 0.20 T field.",
    "Find the field strength between the plates producing the force.",
  ]),
  mc(30, F.coulomb, [
    "Find the electrostatic force on a +5.0 µC charge from a +8.0 µC charge 4.0 cm away.",
    "Find the force on the +5.0 µC charge placed in a uniform 800 N C⁻¹ field.",
    "Find the field strength midway between two charged parallel plates.",
    "Find the work done moving the charge through a 12 V potential difference.",
  ]),
  mc(31, F.current, [
    "Find the current in a wire when 360 C of charge passes a point in 60 s.",
    "Find the resistance of that wire if it carries the current at 30 V.",
    "Find the power delivered to the wire at 30 V.",
    "Find the work done moving 360 C through 30 V.",
  ]),
  mc(32, F.ohm, [
    "Find the current through a 6.0 Ω resistor connected across a 12 V supply.",
    "Find the power the resistor dissipates when 2.0 A flows through it.",
    "Find the total charge that passes through it in 60 s.",
    "Find the electric field between plates 2 cm apart on the same 12 V supply.",
  ]),
  mc(33, F.pvi, [
    "Find the power dissipated by a heating coil carrying 6.0 A at 30 V.",
    "Find the resistance of the coil.",
    "Find the charge that flows through it in 60 s.",
    "Find the heat needed to raise the water's temperature by 40 °C.",
  ]),
  mc(34, F.fqvb, [
    "Find the force on a proton moving at 2.0 × 10⁶ m s⁻¹ at right angles to a 0.30 T magnetic field.",
    "Find the force on a 4.0 cm current-carrying wire in the same field.",
    "Find the force on the proton from a +2e point charge 1.0 nm away.",
    "Find the magnetic field 5.0 cm from the wire carrying the current.",
  ]),
  mc(35, F.flib, [
    "Find the force on a 4.0 cm length of wire carrying 3.0 A at right angles to a 0.25 T field.",
    "Find the force on a single electron drifting through that field at 1.0 × 10⁵ m s⁻¹.",
    "Find the force per metre between that wire and a parallel wire 10 cm away.",
    "Find the magnetic field 10 cm from the wire.",
  ]),
  mc(36, F.parallelWires, [
    "Find the force per metre between two parallel wires 5.0 cm apart carrying 10 A and 15 A.",
    "Find the force on a 20 cm length of one wire placed in an external 0.10 T field.",
    "Find the magnetic field one wire produces at the position of the other.",
    "Find the force on a charge moving between the wires at 2.0 × 10⁶ m s⁻¹.",
  ]),
  // second scenario set on richer formulas — m37..m50
  mc(37, F.suvat_s, [
    "Find the distance a book slides down a tilted desk in 1.25 s, starting from rest.",
    "Find the book's speed at the end of that 1.25 s.",
    "Find the friction force on the 0.80 kg book as it slides.",
    "Find the book's kinetic energy when it reaches the bottom.",
  ]),
  mc(38, F.suvat_v, [
    "Find a car's velocity 5.5 s after it starts braking at 3.0 m s⁻² from 17 m s⁻¹.",
    "Find how far the car travels while braking to rest.",
    "Find the braking force on the 1400 kg car.",
    "Find the car's momentum at the moment braking begins.",
  ]),
  mc(39, F.fma, [
    "Find the acceleration of two blocks (total 80 kg) pushed across a frictionless floor by a 200 N force.",
    "Find how fast the blocks are moving after 3.0 s.",
    "Find the work the 200 N force does over 4.0 m.",
    "Find the combined kinetic energy of the blocks at 5.0 m s⁻¹.",
  ]),
  mc(40, F.gpe, [
    "Find the potential energy a 38 kg student gains climbing a 3.2 m flight of stairs.",
    "Find the student's average power if the climb takes 4.5 s.",
    "Find the student's kinetic energy running at 2.0 m s⁻¹.",
    "Find the momentum of the student running at 2.0 m s⁻¹.",
  ]),
  mc(41, F.consP, [
    "Find the momentum of the third fragment when a stationary 5.5 kg shell bursts into three pieces.",
    "Find the kinetic energy released in the explosion.",
    "Find the average force on a fragment during the 0.01 s burst.",
    "Find the speed of a fragment from its kinetic energy.",
  ]),
  mc(42, F.impulse, [
    "Find the average force on each of two cars in a 0.40 s head-on collision, given their change in velocity.",
    "Find the acceleration of a car from the net force acting on it.",
    "Find the total kinetic energy of the cars before the collision.",
    "Find the height a car would fall to reach that speed.",
  ]),
  mc(43, F.specHeat, [
    "Find the specific heat capacity of a metal block from the temperature change when it is dropped into known water.",
    "Find the rate of heat flow along a metal bar.",
    "Find the power of the flame that heats the block in 30 s.",
    "Find the potential energy the block loses falling into the water.",
  ]),
  mc(44, F.doppler, [
    "Find the frequency an observer hears once a 1000 Hz aircraft has passed and is receding at 100 m s⁻¹.",
    "Find the beat frequency between the receding aircraft and a 1000 Hz tone.",
    "Find the period of the 1000 Hz sound.",
    "Find the wavelength of the 1000 Hz sound in air.",
  ]),
  mc(45, F.snell, [
    "Find the refractive index of a Perspex block from the gradient of a sin i versus sin r graph.",
    "Find the critical angle for the Perspex–air boundary.",
    "Find the speed of light inside the Perspex.",
    "Find the frequency of the light from its wavelength in air.",
  ]),
  mc(46, F.invSquare, [
    "Find how many times brighter a lamp 20 cm from a page is than a ceiling light 2.0 m away.",
    "Find the energy the lamp radiates in one minute.",
    "Find the heat delivered to the page to warm it by 3 °C.",
    "Find the power the lamp draws from the 240 V mains at 0.25 A.",
  ]),
  mc(47, F.bWire, [
    "Find how the magnetic field strength changes as you move from 10 cm to 20 cm from a straight wire.",
    "Find the force on a 3.0 cm length of the wire in an external field.",
    "Find the force between this wire and a parallel wire 10 cm away.",
    "Find the force on a charge moving past the wire at 1.0 × 10⁶ m s⁻¹.",
  ]),
  mc(48, F.coulomb, [
    "Find the separation at which a +6 µC and a −8 µC charge attract each other with a force of 1.11 N.",
    "Find the force on the +6 µC charge placed in a 500 N C⁻¹ field.",
    "Find the work done moving the +6 µC charge through 100 V.",
    "Find the electric field halfway between two charged plates.",
  ]),
  mc(49, F.pvi, [
    "Find the energy a spotlight uses in one hour from its operating voltage and current.",
    "Find the resistance of the spotlight filament.",
    "Find the charge that passes through the filament in one hour.",
    "Find how the spotlight's intensity changes as you walk away from it.",
  ]),
  mc(50, F.fqvb, [
    "Find the force on an electron entering a 0.20 T field at 45° to the field lines at 3.0 × 10⁶ m s⁻¹.",
    "Find the force on a current-carrying wire placed in the same field.",
    "Find the electrostatic force between that electron and another point charge.",
    "Find the magnetic field a distance r from a long straight wire.",
  ]),
  // third scenario set on each formula — m51..m86
  mc(51, F.suvat_s, [
    "Find how far a cyclist travels in 6.0 s if she starts at 3.0 m s⁻¹ and pedals with a uniform acceleration of 0.50 m s⁻².",
    "Find the cyclist's velocity after that 6.0 s.",
    "Find the net force needed to produce that acceleration on the 65 kg cyclist and bike.",
    "Find the cyclist's kinetic energy at the end of the 6.0 s.",
  ]),
  mc(52, F.suvat_v2, [
    "Find the speed of a skateboarder at the bottom of a 5.0 m ramp, starting at 1.0 m s⁻¹ with a constant acceleration of 4.0 m s⁻² down the slope.",
    "Find how long the skateboarder takes to reach the bottom of the ramp.",
    "Find the net force accelerating the 55 kg skateboarder and board.",
    "Find the skateboarder's momentum at the bottom of the ramp.",
  ]),
  mc(53, F.suvat_v, [
    "Find the velocity of a lift 2.0 s after it starts from rest, accelerating upward at 1.5 m s⁻².",
    "Find how far the lift rises in that 2.0 s.",
    "Find the gravitational potential energy gained by the 800 kg lift car.",
    "Find the impulse delivered to the lift car during the 2.0 s.",
  ]),
  mc(54, F.fma, [
    "Find the net force needed to accelerate a 25 kg shopping trolley at 0.80 m s⁻².",
    "Find the trolley's velocity after 3.0 s starting from rest.",
    "Find the work done pushing the trolley 2.0 m in the direction of the force.",
    "Find the trolley's kinetic energy once it reaches 1.5 m s⁻¹.",
  ]),
  mc(55, F.gpe, [
    "Find the gravitational potential energy gained when a 12 kg suitcase is lifted 1.2 m onto an overhead locker.",
    "Find the kinetic energy of the suitcase if it is thrown at 2.0 m s⁻¹.",
    "Find the power of the arm lifting the suitcase in 1.5 s.",
    "Find the momentum of the suitcase moving at 2.0 m s⁻¹.",
  ]),
  mc(56, F.work, [
    "Find the work done by a person pushing a 300 N lawnmower a distance of 15 m in the direction of the push.",
    "Find the power delivered while pushing the mower at a steady 1.2 m s⁻¹.",
    "Find the acceleration of the 20 kg mower under that 300 N force.",
    "Find the potential energy gained pushing the mower up a 0.50 m high ramp.",
  ]),
  mc(57, F.ke, [
    "Find the kinetic energy of a 0.15 kg cricket ball bowled at 35 m s⁻¹.",
    "Find the momentum of the ball as it is bowled.",
    "Find the potential energy of the ball held 2.0 m above the pitch.",
    "Find the average force needed to stop the ball in 0.010 s.",
  ]),
  mc(58, F.powerE, [
    "Find the power of a solar panel that delivers 45 000 J of electrical energy in 300 s.",
    "Find the heat needed to warm the panel's cooling water by 8 °C.",
    "Find the work done by the wind on a sail with a steady 200 N force over 30 m.",
    "Find the voltage across a resistor in the panel's circuit carrying 2.0 A at 6.0 Ω.",
  ]),
  mc(59, F.powerFv, [
    "Find the power delivered by a tow rope pulling a water-skier with 400 N at a steady 8.0 m s⁻¹.",
    "Find the work done by the rope over a 200 m tow.",
    "Find the skier's acceleration under a net force of 400 N.",
    "Find the power used if the boat's engine uses 1.2 MJ of fuel energy in 60 s.",
  ]),
  mc(60, F.consKE, [
    "Check whether two gliders on an air track collide elastically by comparing their total kinetic energy before and after.",
    "Find the velocity of one glider after the collision, given the other's velocities before and after.",
    "Find the average force between the gliders during a 0.15 s collision.",
    "Find the kinetic energy of one glider alone before the collision.",
  ]),
  mc(61, F.consP, [
    "Find the recoil velocity of a 4.0 kg rifle after it fires a 0.010 kg bullet at 300 m s⁻¹.",
    "Find whether kinetic energy is conserved when the rifle fires.",
    "Find the average force on the bullet while it is in the 0.60 m barrel for 0.0020 s.",
    "Find the kinetic energy of the bullet as it leaves the barrel.",
  ]),
  mc(62, F.impulse, [
    "Find the average force a goalkeeper exerts catching a 0.45 kg ball that stops in 0.15 s after arriving at 20 m s⁻¹.",
    "Find the force needed to give the ball an acceleration of 44 m s⁻² from rest.",
    "Find the kinetic energy of the ball just before it is caught.",
    "Find the work done stopping the ball over a distance of 0.30 m.",
  ]),
  mc(63, F.ugrav, [
    "Find the gravitational potential energy of a 1200 kg satellite 7.0 × 10⁶ m from Earth's centre.",
    "Find the potential energy gained lifting a 1200 kg lift car 20 m up a shaft.",
    "Find the kinetic energy of the satellite orbiting at 7.5 km s⁻¹.",
    "Find the momentum of the satellite in orbit.",
  ]),
  mc(64, F.wave, [
    "Find the speed of sound in a gas given a 440 Hz tuning fork produces a wavelength of 0.75 m in it.",
    "Find the period of the 440 Hz note.",
    "Find the refractive index of the gas for light travelling through it at a known speed.",
    "Find the beat frequency between the 440 Hz fork and a 442 Hz fork.",
  ]),
  mc(65, F.fT, [
    "Find the frequency of rotation of a fan blade that completes one revolution every 0.040 s.",
    "Find the speed of the blade tip from the spacing of a strobe pattern on it.",
    "Find the beat frequency between two fans running at slightly different speeds.",
    "Find the frequency heard by someone as the spinning fan is carried toward them.",
  ]),
  mc(66, F.refIndex, [
    "Find the refractive index of a diamond in which light travels at 1.24 × 10⁸ m s⁻¹.",
    "Find the angle of refraction as light enters the diamond at 40° to the normal.",
    "Find the critical angle for the diamond–air boundary.",
    "Find the wavelength of the light inside the diamond given its frequency.",
  ]),
  mc(67, F.specHeat, [
    "Find the heat energy needed to warm 3.0 kg of cooking oil from 20 °C to 180 °C, given its specific heat capacity.",
    "Find the rate of heat loss through the base of the pan holding the oil.",
    "Find the power of the stove element supplying that energy in 400 s.",
    "Find the potential energy gained lifting the pan of oil 0.80 m onto the stove.",
  ]),
  mc(68, F.beats, [
    "Find the beat frequency heard when two guitar strings tuned to 330 Hz and 333 Hz are plucked together.",
    "Find the period of the 330 Hz string's note.",
    "Find the frequency heard from a busker's amplifier as it is wheeled toward you.",
    "Find the wavelength of the 330 Hz note in air.",
  ]),
  mc(69, F.doppler, [
    "Find the frequency heard by a stationary observer as an ambulance siren (700 Hz) approaches at 25 m s⁻¹.",
    "Find the beat frequency between the siren and a stationary 700 Hz reference tone.",
    "Find the period of the 700 Hz siren tone.",
    "Find the wavelength of the siren's sound in still air.",
  ]),
  mc(70, F.snell, [
    "Find the angle of incidence in air that produces a 20° angle of refraction in a glass block of n = 1.50.",
    "Find the critical angle for the same glass–air boundary.",
    "Find the speed of light inside the glass.",
    "Find the wavelength of the light inside the glass given its frequency.",
  ]),
  mc(71, F.critical, [
    "Find the critical angle for a diamond–air boundary given diamond's refractive index of 2.42.",
    "Find the angle of refraction for light entering the diamond at 50° to the normal.",
    "Find the speed of light inside the diamond.",
    "Find the wavelength of light inside the diamond given its frequency.",
  ]),
  mc(72, F.invSquare, [
    "Find the intensity of sunlight reaching a planet twice as far from the Sun as Earth, given Earth's intensity.",
    "Find the power output of the Sun from the total energy it radiates each second.",
    "Find the heat absorbed warming a 1.0 m² solar collector by 30 °C.",
    "Find the wavelength of the sunlight from its frequency.",
  ]),
  mc(73, F.conduction, [
    "Find the rate of heat loss through a 12 mm thick wooden door, 2.0 m² in area, with a 12 °C difference across it.",
    "Find the heat needed to warm the door's own 15 kg mass by 12 °C.",
    "Find the power of a heater that replaces the heat lost through the door.",
    "Find the electrical power of a 2.0 kW heater running on 240 V mains.",
  ]),
  mc(74, F.eField, [
    "Find the electric field strength between two charged plates 4.0 mm apart connected to a 6.0 V battery.",
    "Find the work done moving a charge from one plate to the other.",
    "Find the current in the wire charging the plates.",
    "Find the electrostatic force between two point charges placed near the plates.",
  ]),
  mc(75, F.potDiff, [
    "Find the potential difference between two points if a 0.20 C charge gains 5.0 J of electrical potential energy moving between them.",
    "Find the field strength between two plates of known separation at that voltage.",
    "Find the work done moving a different, 0.50 C charge through the same potential difference.",
    "Find the resistance of a component carrying 0.40 A at that voltage.",
  ]),
  mc(76, F.wqv, [
    "Find the energy transferred when a 2.0 C charge moves through a 9.0 V battery.",
    "Find the electric field strength across a 3.0 mm gap connected to the same battery.",
    "Find the force on that charge if it were instead placed in a 500 N C⁻¹ field.",
    "Find the current if the 2.0 C charge flows through the battery in 4.0 s.",
  ]),
  mc(77, F.wqed, [
    "Find the work done on a dust particle carrying +1.2 µC as it crosses 3.0 mm of a uniform 500 N C⁻¹ field in an electrostatic precipitator.",
    "Find the force on the particle in that field.",
    "Find the field strength given the plate voltage and separation instead of the field value.",
    "Find the force between the particle and another point charge 2.0 cm away.",
  ]),
  mc(78, F.bWire, [
    "Find the magnetic field strength 8.0 cm from a power cable carrying 25 A.",
    "Find the force on a 0.50 m length of the cable in an external 0.20 T field.",
    "Find the force on an electron drifting past the cable at 1.0 × 10⁶ m s⁻¹ in that field.",
    "Find the force per metre between the cable and a second cable 8.0 cm away.",
  ]),
  mc(79, F.fqe, [
    "Find the force on a +4.0 µC dust particle in the 500 N C⁻¹ field of an electrostatic precipitator.",
    "Find the force between the particle and a charged plate treated as a point charge 3.0 cm away.",
    "Find the magnetic force on the particle if it moves at 2.0 × 10³ m s⁻¹ across a 0.10 T field.",
    "Find the field strength given the plate voltage and gap instead of the field value.",
  ]),
  mc(80, F.coulomb, [
    "Find the electrostatic force between two charged balloons, each carrying 2.0 µC, held 15 cm apart.",
    "Find the force on one balloon if it were placed in a uniform 400 N C⁻¹ field instead.",
    "Find the work done moving one balloon through a 12 V potential difference.",
    "Find the field strength between two charged plates 5.0 cm apart.",
  ]),
  mc(81, F.current, [
    "Find the current in a torch bulb's filament if 45 C of charge flows through it in 30 s.",
    "Find the voltage across the filament given its resistance and that current.",
    "Find the power delivered to the filament at 3.0 V and that current.",
    "Find the energy delivered by that charge moving through 3.0 V.",
  ]),
  mc(82, F.ohm, [
    "Find the resistance of a heating element that draws 4.0 A when connected to 240 V mains.",
    "Find the power delivered to the element at that voltage and current.",
    "Find the charge that flows through the element in 60 s.",
    "Find the force on a charge carrier in an external electric field near the element.",
  ]),
  mc(83, F.pvi, [
    "Find the power delivered to a phone charger operating at 5.0 V and drawing 2.0 A.",
    "Find the resistance of the charger's internal circuit.",
    "Find the charge delivered by the charger in one hour.",
    "Find the energy delivered to a 10 C charge passing through the charger.",
  ]),
  mc(84, F.fqvb, [
    "Find the magnetic force on an alpha particle (charge +2e) moving at 5.0 × 10⁵ m s⁻¹ perpendicular to a 0.40 T field in a mass spectrometer.",
    "Find the force on a current-carrying wire placed in the same 0.40 T field.",
    "Find the electrostatic force between the particle and a nearby point charge.",
    "Find the magnetic field produced by a nearby wire carrying current at the particle's position.",
  ]),
  mc(85, F.flib, [
    "Find the force on a 6.0 cm length of a loudspeaker voice coil carrying 0.80 A in a 0.50 T magnetic field.",
    "Find the force on a single charge carrier drifting through the field at 3.0 × 10⁻⁴ m s⁻¹.",
    "Find the force per metre between the coil and a nearby parallel wire.",
    "Find the magnetic field produced by the coil's own current at 5.0 cm from it.",
  ]),
  mc(86, F.parallelWires, [
    "Find the force per metre between two overhead power lines 2.0 m apart carrying 200 A and 150 A in the same direction.",
    "Find the magnetic field produced by one line at the position of the other.",
    "Find the force on a 10 m length of one line placed in an external 0.10 T field.",
    "Find the force on a charge moving between the lines at 2.0 × 10⁶ m s⁻¹.",
  ]),
  // fourth scenario set on selected formulas — m87..m100
  mc(87, F.suvat_s, [
    "Find the depth of a well if a stone dropped from rest takes 2.5 s to reach the water.",
    "Find the speed of the stone when it hits the water.",
    "Find the same depth using the stone's impact speed instead of the time.",
    "Find the kinetic energy of the 0.20 kg stone at impact.",
  ]),
  mc(88, F.suvat_v2, [
    "Find the speed of a sledge at the bottom of a 40 m icy slope, starting from rest with a constant acceleration of 2.0 m s⁻².",
    "Find how long the sledge takes to reach the bottom of the slope.",
    "Find the net force accelerating the 25 kg sledge and rider.",
    "Find the sledge's momentum at the bottom of the slope.",
  ]),
  mc(89, F.work, [
    "Find the work done by a tugboat pulling a barge with a steady 5000 N force over 200 m.",
    "Find the power delivered if the barge moves at a steady 2.0 m s⁻¹.",
    "Find the acceleration of the 3.0 × 10⁵ kg barge under that force.",
    "Find the potential energy gained lifting a container 4.0 m onto the barge's deck.",
  ]),
  mc(90, F.powerFv, [
    "Find the power output of a cyclist pushing with 150 N at a steady 6.0 m s⁻¹ into a headwind.",
    "Find the work done by the cyclist over a 500 m stretch.",
    "Find the acceleration of the 80 kg cyclist and bike under a net force of 150 N.",
    "Find the cyclist's power output from the metabolic energy used in 120 s.",
  ]),
  mc(91, F.impulse, [
    "Find the impulse delivered to a 0.058 kg tennis ball that leaves a racquet at 45 m s⁻¹ having arrived at 20 m s⁻¹ travelling the other way.",
    "Find the force needed to give the ball an acceleration of 1500 m s⁻² from rest.",
    "Find the kinetic energy of the ball as it leaves the racquet.",
    "Find the work done by the racquet over its 0.20 m contact distance.",
  ]),
  mc(92, F.wave, [
    "Find the wavelength of a wave on a guitar string vibrating at 196 Hz, given waves travel along the string at 250 m s⁻¹.",
    "Find the period of the string's vibration.",
    "Find the beat frequency between this string and one slightly out of tune at 198 Hz.",
    "Find the frequency heard as the guitarist walks toward a listener.",
  ]),
  mc(93, F.specHeat, [
    "Find the temperature rise of a 0.50 kg aluminium block that absorbs 4500 J of heat, given its specific heat capacity.",
    "Find the rate of heat conduction through the block from one face to the other.",
    "Find the power of the heater supplying that energy in 90 s.",
    "Find the potential energy gained lifting the block 0.60 m onto a bench.",
  ]),
  mc(94, F.doppler, [
    "Find the frequency heard by a driver approaching a stationary factory horn sounding at 500 Hz, moving at 15 m s⁻¹ toward it.",
    "Find the beat frequency between the horn and a stationary 500 Hz reference tone.",
    "Find the period of the 500 Hz horn's sound.",
    "Find the wavelength of the horn's sound in still air.",
  ]),
  mc(95, F.snell, [
    "Find the angle of refraction as light travels from glass (n = 1.50) into water (n = 1.33) at an angle of incidence of 35°.",
    "Find the critical angle for the same glass–water boundary.",
    "Find the speed of light in the water.",
    "Find the wavelength of the light in the water given its frequency.",
  ]),
  mc(96, F.critical, [
    "Find the critical angle for an optical fibre core of refractive index 1.52 surrounded by air-like cladding.",
    "Find the angle of refraction for light entering the fibre core at 25° to the normal.",
    "Find the speed of light inside the fibre core.",
    "Find the wavelength of light inside the core given its frequency.",
  ]),
  mc(97, F.eField, [
    "Find the electric field strength inside a parallel-plate demonstration, plates 2.0 cm apart, connected to a 20 kV supply.",
    "Find the force on a charge placed in that field.",
    "Find the work done moving a charge from one plate to the other.",
    "Find the electrostatic force between two point charges placed near the plates.",
  ]),
  mc(98, F.wqed, [
    "Find the work done on an ink droplet carrying −2.0 µC as it crosses 4.0 mm of a uniform 300 N C⁻¹ field in an inkjet printer's deflection plates.",
    "Find the force on the droplet in that field.",
    "Find the field strength given the plate voltage and gap instead of the field value.",
    "Find the current if droplets carrying that charge arrive at a steady rate.",
  ]),
  mc(99, F.pvi, [
    "Find the power rating of an electric jug that draws 8.0 A from a 240 V supply.",
    "Find the resistance of the jug's heating element.",
    "Find the heat needed to boil the water in the jug.",
    "Find the charge delivered to the element in 3 minutes.",
  ]),
  mc(100, F.parallelWires, [
    "Find the force per metre between two switchboard busbars 3.0 cm apart carrying 400 A and 350 A.",
    "Find the magnetic field produced by one busbar at the position of the other.",
    "Find the force on a 0.50 m segment of one busbar in an external magnetic field.",
    "Find the force on a charge moving between the busbars at 1.0 × 10⁶ m s⁻¹.",
  ]),
];

export const questions: Question[] = [...shortQuestions, ...mcQuestions];

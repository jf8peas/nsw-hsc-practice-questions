import type { McQuestion, Question, ShortQuestion } from "@/lib/types";
import { shuffleBySeed } from "@/lib/shuffle";
import { F, type FormulaDef } from "@/content/formulas";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Built from resources/topic001/y11-formula-sheet.pdf (crossed-out formulas
// excluded) and the scenario bank in docs/y11-formula-test-research.md.
//
// 50 short-answer + 50 multiple-choice. A quiz attempt draws 5 of each at
// random (see meta.ts > quiz), so a student gets 10 non-repeating attempts.

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
      `(a) In one sentence, describe what this formula tells you or lets you calculate. ` +
      `(b) What quantity does “${variable}” represent in this formula? ` +
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
];

export const questions: Question[] = [...shortQuestions, ...mcQuestions];

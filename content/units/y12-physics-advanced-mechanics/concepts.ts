import type { Concept } from "@/lib/types";

// PUBLIC — the concepts a student can be asked to relearn in this unit (spec 002).
// Ids are `<unit-id>.c-<slug>`, are never renamed or reused, and descriptions are one line.
// Which questions carry which concept is in ./concept-tags.ts.

const U = "y12-physics-advanced-mechanics";

const list: Array<[slug: string, description: string]> = [
  // --- Motion in gravitational fields ---
  ["newtons-law-gravitation", "Newton's law of universal gravitation: F = GMm/r², and the force between two masses"],
  ["gravitational-field-strength", "Gravitational field strength g = GM/r² and how it varies with mass, radius and distance"],
  ["keplers-laws", "Kepler's laws: elliptical orbits, equal areas in equal times, and T² ∝ r³"],
  ["keplers-third-law", "Kepler's third law: T² ∝ r³ for bodies orbiting the same central mass"],
  ["orbital-velocity", "Orbital velocity v = √(GM/r), independent of the satellite's mass"],
  ["orbital-energy", "Orbital energy: K = −U/2, E = U/2, and how energy changes with orbital radius"],
  ["escape-velocity", "Escape velocity v = √(2GM/r), independent of the object's mass"],
  ["geostationary-orbit", "Geostationary orbits: 24 h period, equatorial plane, fixed above one point"],
  ["work-by-gravity", "Work done by gravity: zero in a circular orbit, non-zero where the radius changes"],
  ["weightlessness", "Apparent weightlessness in orbit: free fall with no normal force"],
  ["orbit-comparison", "Comparing LEO and GEO orbits: speed, period, energy and uses"],
  // --- Projectile motion ---
  ["projectile-independence", "Horizontal and vertical motion of a projectile are independent"],
  ["projectile-horizontal-velocity", "Horizontal velocity of a projectile is constant (no air resistance)"],
  ["projectile-vertical-motion", "Vertical motion under constant g sets time of flight and maximum height"],
  ["projectile-range-height", "Range and maximum height: R = u² sin 2θ/g, H = u² sin²θ/2g"],
  ["projectile-components", "Resolving projectile velocity into horizontal and vertical components"],
  ["projectile-graphs", "Reading projectile graphs: velocity components and speed against time"],
  ["projectile-energy", "Energy conservation in projectile motion: KE and GPE interconvert"],
  ["air-resistance", "Air resistance lowers and shortens the projectile path"],
  ["projectile-assumptions", "Projectile analysis assumes no air resistance, constant g and point masses"],
  ["projectile-investigation", "Investigating projectile motion: measuring, errors and analysis"],
  // --- Circular motion ---
  ["centripetal-force", "Centripetal force F = mv²/r = mω²r, directed towards the centre"],
  ["centripetal-acceleration", "Centripetal acceleration a = v²/r = ω²r, directed towards the centre"],
  ["angular-velocity", "Angular velocity ω, v = ωr, and period/frequency relationships"],
  ["banked-tracks", "Banked tracks: v = √(rg tan θ), normal force component provides centripetal force"],
  ["conical-pendulum", "Conical pendulum: T sin θ = mv²/r and T cos θ = mg"],
  ["vertical-circles", "Vertical circles: tension at top and bottom, T = mv²/r ± mg"],
  ["torque", "Torque τ = rF sin θ and how to maximise it"],
  ["circular-work", "Work in circular motion: the centripetal force does no work"],
  ["friction-centripetal", "Friction providing the centripetal force on flat curves and rotors"],
  ["circular-investigation", "Investigating circular motion: variables, graphs and analysis"],
];

export const concepts: Concept[] = list.map(([slug, description]) => ({ id: `${U}.c-${slug}`, description }));

/** Questions removed from this unit, with the concept each carried. None so far. */
export const retired: Record<string, string | null> = {};
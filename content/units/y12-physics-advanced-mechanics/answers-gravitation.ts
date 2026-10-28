import type { Answer } from "@/lib/types";
import { U } from "./build";

// ANSWER KEY — motion in gravitational fields. NO "server-only" import here (the validator reads
// it); only re-exported via content/answers/index.ts, which is server-only.
// Every answer was worked independently and checked against the school's key where one could be
// found (see resources/topic006/06-transcription-log.md).

const m = (n: number, correctText: string, why: string): [string, Answer] => [
  `${U}.m${String(n).padStart(3, "0")}`,
  { correctText, rubric: [why] },
];

export const gravitationAnswers: Array<[string, Answer]> = [
  m(1, "5.41 × 10²⁸ kg", "From r³/T² = GM/4π²: M = 4π²r³/(GT²) = 4π²(3.80 × 10¹⁰)³ / (6.67 × 10⁻¹¹ × (2.45 × 10⁷)²) ≈ 5.41 × 10²⁸ kg."),
  m(2, "gravitational potential energy", "The planet is moving towards the star, so its distance r is decreasing and U = −GMm/r becomes more negative (decreases). Its kinetic energy and acceleration increase, and its total energy is constant."),
  m(3, "√(5³)", "By Kepler's third law T² ∝ r³, so T_X/T_Y = (r_X/r_Y)^(3/2) = 5^(3/2) = √(5³)."),
  m(4, "−2.8 × 10⁹ J", "From the graph, U ≈ −2.9 × 10⁹ J at 14 000 km and U ≈ −5.8 × 10⁹ J at 4000 km, so ΔU = U_final − U_initial ≈ −2.8 × 10⁹ J (it decreases as the satellite moves closer)."),
  m(5, "8 g", "g = GM/r². Doubling M doubles g, and halving r multiplies g by 4, so g_Y = 2 × 4 × g = 8g."),
  m(6, "2465", "Kepler's third law for the same star: T_B = T_A (r_B/r_A)^(3/2) = 15 × (6 × 10⁹ / 2 × 10⁸)^(3/2) = 15 × 30^(3/2) ≈ 2465 ooshwucks. Planet A's mass is not needed."),
  m(7, "35,930 km", "r³ = GMT²/4π² with T = 24 h gives r ≈ 4.23 × 10⁷ m (42 300 km); the altitude is r minus Earth's radius (6371 km) ≈ 35 930 km."),
  m(8, "Diagram A", "With no gravitational force there is no net force, so by Newton's first law the satellite moves in a straight line along the tangent to its orbit at X."),
  m(9, "Gravity is the only force acting on him.", "The astronaut and the station are both in free fall around Earth, with gravity the only force acting; there is no normal force, so he feels weightless. Gravity is still about 90% of its surface value there."),
  m(10, "Kinetic energy 40 000 J; gravitational potential energy −80 000 J; total energy −40 000 J", "For a circular orbit K = GMm/2r, U = −GMm/r and E = K + U = −GMm/2r, so U = −2K and E = −K: 40 000 J, −80 000 J and −40 000 J."),
  m(11, "Bohr: planet mass 5 × 10²⁴ kg, planet radius 9500 km", "v_esc = √(2GM/r), so the lowest escape velocity has the smallest M/r. Bohr: 5 × 10²⁴ / 9500 is the smallest ratio."),
  m(12, "F/4", "F = GMm/r², an inverse-square law: doubling the distance divides the force by 2² = 4."),
  m(13, "The period of one revolution of the satellite is equal to the time taken for one spin of the planet on its axis.", "A geostationary satellite stays above the same point, so its orbital period must equal the planet's rotation period (and it orbits above the equator in the direction of rotation)."),
  m(14, "T_A = 15 T_B", "T² ∝ r³, so T_A/T_B = 6^(3/2) ≈ 14.7, i.e. about 15."),
  m(15, "When the moon reaches the perigee, its gravitational potential energy will be at a minimum and its kinetic energy will be at a maximum. It will move at a high velocity.", "At perigee the Moon is closest to Earth, so U = −GMm/r is lowest; total energy is conserved, so kinetic energy and speed are greatest there."),
  m(16, "For an identical planet orbiting a different star", "k = 4π²/GM depends only on the mass M of the central body, so k changes only when the star changes."),
  m(17, "Increase by 105 m/s", "v = √(GM/r). At 850 km, r = 7.221 × 10⁶ m and v ≈ 7445 m/s; at 650 km, r = 7.021 × 10⁶ m and v ≈ 7550 m/s. The speed must increase by about 105 m/s."),
  m(18, "The acceleration due to gravity experienced by Ursae Majoris B is 6.3 times greater than that due to gravity experienced by Ursae Majoris C.", "a = 4π²r/T²: B gives ≈ 13.9 m s⁻² and C gives ≈ 2.2 m s⁻², so B's is about 6.3 times C's (equivalently a ∝ 1/r², and (1.56 × 10⁹ / 6.2 × 10⁸)² ≈ 6.3)."),
  m(19, "E_total = U / 2", "In a circular orbit U = −GMm/r and K = GMm/2r, so E = K + U = −GMm/2r = U/2 (= −K)."),
  m(20, "X : Y = 1 : 1", "Orbital speed v = √(GM/r) depends on the central mass and the orbital radius, not on the satellite's mass, so the speeds are equal."),
];

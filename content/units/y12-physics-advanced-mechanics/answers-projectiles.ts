import type { Answer } from "@/lib/types";
import { U } from "./build";

// ANSWER KEY — projectile motion. NO "server-only" import here (the validator reads it); only
// re-exported via content/answers/index.ts, which is server-only. Every answer was worked
// independently and checked against the school's key where one could be found
// (see resources/topic006/06-transcription-log.md).

const m = (n: number, correctText: string, why: string): [string, Answer] => [
  `${U}.m${String(n).padStart(3, "0")}`,
  { correctText, rubric: [why] },
];

export const projectileAnswers: Array<[string, Answer]> = [
  m(91, "u_Ax = ½u_Bx; u_Ay = u_By; t_A = t_B; R_A = ½R_B", "Both start with zero vertical velocity from the same height, so they fall for the same time. Range = horizontal velocity × time, so A (half B's horizontal velocity) travels half as far."),
  m(92, "R = 4 H", "At 45°: R = u² sin 90°/g = u²/g and H = (u sin 45°)²/2g = u²/4g, so R = 4H."),
  m(93, "Row B", "Both balls land 100 m away. Sam's went higher, so it had the larger vertical component and a longer flight time; to cover the same range in more time it needs a smaller horizontal component. Kim's is the reverse."),
  m(94, "½E", "With equal components, u_x² = ½u². At the top only the horizontal component remains, so K = ½m u_x² = ½(½mu²) = ½E."),
  m(95, "36 m", "Both fall from the same height, so they have the same time of flight: t = 180/45 = 4.0 s. The second travels 9.0 × 4.0 = 36 m."),
  m(96, "90cm", "t = √(2h/g) = √(2 × 1/9.8) = 0.45 s, so d = 2 × 0.45 ≈ 0.90 m = 90 cm."),
  m(97, "5m", "At 45° the range is 4 times the maximum height (R = u²/g, H = u²/4g), so H = 20/4 = 5 m."),
  m(98, "decreased range; decreased maximum height", "Maximum height = u_y²/2g and range = u² sin 2θ/g; both are inversely proportional to g, so both decrease."),
  m(99, "3.86 m", "h = (u sin 60°)²/2g = (8.66)²/(2 × 9.8) ≈ 3.8 m, closest to 3.86 m."),
  m(100, "44.99 m", "The stone starts with zero vertical velocity: h = ½gt² = ½ × 9.8 × 3.03² ≈ 44.99 m. The horizontal speed does not matter."),
  m(101, "The balls hit the ground at the same time because horizontal motion does not affect vertical motion.", "Both start with zero vertical velocity and have the same vertical acceleration g, so they take the same time to fall; Y's horizontal velocity is independent of its vertical motion."),
  m(102, "The vertical component of the velocity of the car will increase.", "Ignoring air resistance, the only force is gravity: the acceleration is constant (g), the horizontal velocity is constant and total energy is conserved, while the vertical velocity increases as it falls."),
  m(103, "D", "Both the maximum height (u_y²/2g) and the range (u² sin 2θ/g) are inversely proportional to g, so with a smaller g the path is both higher and longer: trajectory D."),
  m(104, "5.4 m", "u_x = 25 cos 30° = 21.65 m/s, so t = 12.0/21.65 = 0.554 s. u_y = 12.5 m/s: y = 12.5 × 0.554 − 4.9 × 0.554² ≈ 5.4 m."),
  m(105, "Its kinetic energy will be the same at launch as it is at impact.", "It lands at the launch height, so its potential energy is the same and (with no air resistance) its kinetic energy is the same. At Y it still has horizontal velocity, so K is not zero, and its potential energy there is a maximum."),
  m(106, "10 m s⁻¹ N53.1°E", "Magnitude √(6² + 8²) = 10 m s⁻¹. Measured from north towards east, the angle is tan⁻¹(8/6) = 53.1°, so N53.1°E."),
  m(107, "Time to land: T; distance from table: D", "Projectile motion does not depend on mass: the heavier ball falls the same height with the same acceleration (same time T) and has the same horizontal velocity v, so it lands at D."),
  m(108, "Maximum height for A: equal to H; maximum height for B: less than H", "Starting from rest at height H with no friction, A's cart can just reach height H at the hilltop. B's cart is a projectile once it leaves the track: it keeps its horizontal velocity, so it still has kinetic energy at the top of its flight and cannot reach H."),
  m(109, "Initial velocity", "Same maximum height means the same initial vertical velocity, so the same time of flight. Q goes twice as far in the same time, so its horizontal velocity, and therefore its initial velocity, is different. Gravity is the same for both."),
  m(110, "The projectile launched at a smaller angle", "Time to maximum height t = u sin θ / g. With the same speed, a smaller angle gives a smaller vertical component, so it reaches its maximum height sooner."),
  m(111, "Row D", "With no air resistance the horizontal component is constant. The vertical component starts upwards, decreases to zero at the top, then increases downwards at the same rate."),
  m(112, "Horizontal velocity 15.4 m s⁻¹; vertical velocity 29.0 m s⁻¹", "u_x = 32.8 cos 62° ≈ 15.4 m s⁻¹ and u_y = 32.8 sin 62° ≈ 29.0 m s⁻¹."),
  m(113, "Initial velocity: 2x m s⁻¹; distance fallen at 1 s: 4y m", "Horizontal velocity is constant: u = x/0.5 = 2x. Vertical distance fallen from rest is ½gt², so doubling t quadruples it: 4y."),
  m(114, "The initial horizontal velocity on launch will be the same as the final horizontal velocity.", "The only force is gravity (vertical), so the horizontal velocity is constant. At Y the velocity is horizontal, not zero; the vertical component changes, and at impact it is equal in size but opposite in direction to the launch value."),
  m(115, "↓ (downwards)", "The only force on the projectile is gravity, so its acceleration is g, vertically downwards, at every point including the top."),
  m(116, "A", "Time of flight = 2u sin θ / g. With the same speed, the projectile launched at the steepest angle (A, the highest path) stays in the air longest."),
  m(117, "Maximum height reached: double; final speed: equal", "Maximum height = u_y²/2g, so halving g doubles it. It lands at the launch height, so by energy conservation (or symmetry) its final speed equals the launch speed, 40 m s⁻¹, as on Earth."),
  m(118, "Velocity at X, Y, Z: ↗, →, ↘; acceleration at X, Y, Z: ↓, ↓, ↓", "Velocity is tangent to the path: up and forwards at X, horizontal at Y, down and forwards at Z. The acceleration is g, downwards, everywhere."),
  m(119, "The stone’s kinetic energy has been converted to gravitational potential energy.", "The school's intended answer: the kinetic energy associated with the vertical motion has been converted to gravitational potential energy, so the vertical velocity has fallen to zero. (The acceleration is g throughout and the net force mg is not zero; option B is true but does not explain it.)"),
  m(120, "horizontal and vertical components are dependent on each other", "Projectile analysis assumes the horizontal and vertical motions are independent, with constant g, no air resistance and point masses."),
  m(121, "in the sand.", "Range R = u² sin 2θ / g = 47.8² × sin 85° / 9.8 ≈ 232 m, which is in the sand trap (about 228–236 m)."),
  m(122, "Time of flight will be longer and its horizontal displacement will be shorter with air resistance included", "Air resistance opposes the motion: the upward drag slows the fall (longer time) and the backward drag reduces the horizontal velocity (shorter horizontal displacement)."),
  m(123, "√(v² + 2gH)", "By energy conservation, ½mv_f² = ½mv² + mgH, since the stone ends a height H below its launch point; so v_f = √(v² + 2gH). The extra rise h is regained on the way down."),
  m(124, "Vertical component of velocity: zero; acceleration: g", "At maximum height the vertical velocity is zero (it is changing from up to down), but gravity still acts, so the acceleration is g downwards."),
  m(125, "Diagram A", "Air resistance removes energy throughout the flight: the projectile reaches a lower maximum height and lands short, and because it has slowed, it comes down more steeply than it went up (the path is not symmetrical)."),
  m(126, "80 m s⁻¹", "With no air resistance there is no horizontal force, so the horizontal velocity stays at 80 m s⁻¹ until impact."),
  m(127, "The first arrow will hit the target lower than the second arrow and the time of flight will be shorter for the second arrow.", "Both leave horizontally at the same speed. The second arrow travels 50 m instead of 70 m, so it is in the air for less time and falls less (drop = ½gt²): it hits higher than the first arrow."),
  m(128, "None of the velocities are the same.", "The balls reach different heights, so their initial vertical velocities differ, and they spend different times in the air; to land at the same point in different times their horizontal velocities must also differ. So the initial velocities all differ."),
  m(129, "Acceleration", "The only force is gravity, so the acceleration is g downwards throughout. Height, speed and velocity all change."),
  m(130, "1.39 s", "The water leaves horizontally, so its initial vertical velocity is zero: 9.5 = ½ × 9.8 × t², t = √(2 × 9.5/9.8) ≈ 1.39 s."),
  m(131, "65°", "Images are 0.50 s apart and 10 m apart horizontally, so u_x = 20 m s⁻¹. cos θ = 20/45, θ ≈ 64°, closest to 65°. (Check: the first image, at 0.5 s, is 19 m up, giving u_y ≈ 40 m s⁻¹ and tan θ ≈ 2.)"),
  m(132, "The first object flight-time will be √3 times the second object", "Both start with zero vertical velocity, so t = √(2h/g) ∝ √h. The heights are in the ratio 3 : 1, so the times are in the ratio √3 : 1. Mass and horizontal speed do not affect the time."),
  m(133, "At “Y” the acceleration remains unchanged", "The acceleration is g downwards throughout. At Y only the vertical velocity is zero; the object keeps moving horizontally, so it does not stop. The horizontal velocity is constant."),
  m(134, "Pallas", "At maximum height v = 0: u² = 2gh, so g = 6.5²/(2 × 8.5) ≈ 2.49 m s⁻², which is Pallas. The mass is not needed."),
  m(135, "Time of flight: t; range: 3R", "Thrown horizontally from the same height, the time to fall is the same, t. The range is horizontal speed × time, so tripling the speed triples the range."),
  m(136, "1.5s", "At 45° the vertical and horizontal components are equal: v_y = 15 m s⁻¹ = gt, so t = 15/9.8 ≈ 1.5 s."),
  m(137, "Zero air resistance", "Projectile analysis assumes no air resistance, a uniform (constant) vertical acceleration g and a parabolic path; mass does not matter."),
  m(138, "Graph C", "Speed = √(u_x² + u_y²). It decreases to a non-zero minimum at the top (where only u_x remains), then increases back to v, and because u_y changes linearly the speed changes along a curve, not straight lines."),
  m(139, "2R", "Same height, so same time of flight; range = horizontal speed × time, so doubling the speed doubles the range."),
  m(140, "Random error", "Unpredictable variation in the launch velocity from shot to shot is a random error; it affects precision and is reduced by repeating trials and averaging."),
  m(141, "7.8 m s⁻¹", "t = √(2 × 200.0/9.8) = 6.39 s, so u = 50.0/6.39 ≈ 7.8 m s⁻¹."),
  m(142, "Pair A", "With no air resistance the horizontal velocity is constant, and the vertical velocity increases steadily from zero (constant acceleration g)."),
  m(143, "The magnitude of the horizontal component of the velocity of the car at Z is equal to the speed at Y.", "At Y the car leaves horizontally, so its speed there is all horizontal. As a projectile there is no horizontal force, so the horizontal component at Z is unchanged."),
  m(144, "60° below the horizontal", "At maximum height the speed u is the horizontal component, which is constant. At the ground cos θ = u/2u = ½, so θ = 60° below the horizontal."),
];

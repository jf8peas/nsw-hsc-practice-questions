import type { ExplanationTable } from "../../explanation-helpers";

// ANSWER KEY — why each wrong multiple-choice option is wrong (spec 002). Shown to a student only
// after they answer that question. Each entry is [the start of the wrong option's text, the
// explanation]; the helper resolves it to the full option text and fails if it does not match
// exactly one wrong option. Original wording, one or two sentences each. The unit's ids are three
// digits, so answers.ts calls withWrongExplanations(..., 3).

export const explanations: ExplanationTable = {
  1: [
    ["3.74 × 10⁷ kg", "This is what you get if you drop the 4π² (or use T instead of T²) in M = 4π²r³/GT²; the period must be squared."],
    ["1.42 × 10¹⁸ kg", "This comes from using r² instead of r³ in Kepler's third law (or a power-of-ten slip on the radius); the radius must be cubed."],
    ["1.32 × 10³⁶ kg", "This is the result of cubing the period instead of squaring it (or dividing by T³), which makes the mass far too large."],
  ],
  2: [
    ["acceleration", "The planet is moving towards the star, so it is speeding up: its acceleration increases, not decreases."],
    ["kinetic energy", "As the planet falls towards the star its speed increases, so its kinetic energy increases rather than decreasing."],
    ["total energy", "With only gravity acting, the total mechanical energy of the planet is conserved, so it does not change."],
  ],
  3: [
    ["(√5)^(1/3)", "This is the cube root of √5, which would come from T ∝ r^(1/3); Kepler's third law has T² ∝ r³, so T ∝ r^(3/2), not r^(1/3)."],
    ["√5", "This would be the ratio if T were proportional to r directly; Kepler's third law gives T ∝ r^(3/2), so the ratio is 5^(3/2)."],
    ["(√(5²))^(1/3)", "This is 5^(1/3), the cube root of 5 — the exponent 3/2 has been inverted; T ∝ r^(3/2) gives 5^(3/2)."],
  ],
  4: [
    ["−8.8 × 10⁹ J", "This is the change you would get by reading the graph at the wrong altitudes (e.g. 0 to 14 000 km) instead of 4000 to 14 000 km."],
    ["+2.8 × 10⁹ J", "The sign is wrong: the satellite moves closer to Earth, so its potential energy decreases (becomes more negative); the change is −2.8 × 10⁹ J."],
    ["+8.8 × 10⁹ J", "Both the sign and the magnitude are wrong: the potential energy falls as the satellite descends, so the change is negative, not positive."],
  ],
  5: [
    ["½ g", "This treats the radius as doubled instead of halved: g = GM/r², so halving r multiplies g by 4, not ½."],
    ["1 g", "This ignores the radius change entirely; halving the radius quadruples g, and doubling the mass doubles it again, giving 8g."],
    ["4 g", "This accounts for the radius (×4) but forgets that the mass is doubled; the mass factor of 2 must also be applied, giving 8g."],
  ],
  6: [
    ["4.243 × 10⁻²³", "This is the result of dividing instead of using the (3/2) power, or of inverting the radius ratio; T_B = T_A (r_B/r_A)^(3/2)."],
    ["493.0", "This uses the wrong exponent on the radius ratio: 30^(3/2) ≈ 164, so 15 × 164 ≈ 2465, not 493."],
    ["144.8", "This uses the radius ratio squared (30² = 900) with the wrong exponent, or takes the square root of the ratio; T ∝ r^(3/2)."],
  ],
  7: [
    ["42,230 km", "This is the orbital radius measured from Earth's centre (r ≈ 42 300 km), not the altitude; the question asks for the altitude, so Earth's radius must be subtracted."],
    ["8.086 × 10¹³ m", "This is the result of a unit error — using the period in hours without converting to seconds (or a power-of-ten slip); T must be in seconds."],
    ["5083 km", "This is the altitude you get if the period is taken as 1 hour instead of 24 hours (or if the wrong power of r is used); a geostationary orbit is about 36 000 km up."],
  ],
  8: [
    ["Diagram B", "A path curving outward would need a net force away from Earth; with the gravitational force removed there is no force at all, so the satellite cannot curve."],
    ["Diagram C", "A path curving inward would need a force towards Earth; with gravity removed there is no force, so the satellite moves in a straight line."],
    ["Diagram D", "A straight line towards Earth's centre would require a force pulling it in; with no force the satellite continues along the tangent to its orbit."],
  ],
  9: [
    ["His mass is now zero.", "Mass is a property of the astronaut and does not change in orbit; he still has the same mass, only his apparent weight is zero."],
    ["The gravitational force on him is zero.", "Gravity still acts — at the ISS's altitude it is about 90% of its surface value; it is what keeps him in orbit."],
    ["The gravitational force is balanced by the centrifugal force.", "There is no real centrifugal force in an inertial frame; the astronaut is in free fall, with gravity the only force."],
  ],
  10: [
    ["Kinetic energy 40 000 J; gravitational potential energy 40 000 J; total energy 80 000 J", "The potential energy of a bound orbit is negative, not positive; U = −GMm/r, so it cannot be +40 000 J."],
    ["Kinetic energy 80 000 J; gravitational potential energy 40 000 J; total energy 120 000 J", "Both the sign of U and the relationship are wrong: for a circular orbit U = −2K and E = −K, so U must be negative and twice K."],
    ["Kinetic energy 80 000 J; gravitational potential energy −40 000 J; total energy 40 000 J", "This has U = −K/2, but for a circular orbit U = −2K; the total energy is then −K, not +K."],
  ],
  11: [
    ["Newton: planet mass 5 × 10²⁴ kg, planet radius 8000 km", "v_esc = √(2GM/r): Newton's M/r = 5 × 10²⁴/8000 = 6.25 × 10²⁰, which is larger than Bohr's 5.26 × 10²⁰, so Newton's escape velocity is higher."],
    ["Einstein: planet mass 8 × 10²⁴ kg, planet radius 7800 km", "Einstein's M/r = 8 × 10²⁴/7800 ≈ 1.03 × 10²¹ is the largest ratio, so it has the highest escape velocity, not the lowest."],
    ["Hawkins: planet mass 8 × 10²⁴ kg, planet radius 10200 km", "Hawkins's M/r = 8 × 10²⁴/10200 ≈ 7.8 × 10²⁰ is larger than Bohr's 5.26 × 10²⁰, so its escape velocity is higher."],
  ],
  12: [
    ["F/2", "This treats the force as inversely proportional to the distance; the law is inverse-square, so doubling r divides F by 2² = 4, not 2."],
    ["2F", "This treats the force as proportional to the distance; doubling the distance weakens the force, so it cannot increase."],
    ["F/8", "This uses the wrong power: F ∝ 1/r², so doubling r gives F/4, not F/8 (that would be 1/r³)."],
  ],
  13: [
    ["The orbital velocity of both the satellite and the planet are equal.", "The satellite and the planet's surface have very different speeds; what must match is the period, not the velocity."],
    ["The period of the planet and the satellite are equal.", "The planet's orbital period around its star is irrelevant; it is the planet's rotation period that must equal the satellite's orbital period."],
    ["The mass of the planet and the satellite must be equal.", "The masses have nothing to do with a geostationary orbit; the condition is about the period and the equatorial plane."],
  ],
  14: [
    ["T_A = 3 T_B", "This uses T ∝ r instead of T ∝ r^(3/2); with a radius ratio of 6, the period ratio is 6^(3/2) ≈ 14.7, not 6."],
    ["T_A = 36 T_B", "This squares the radius ratio (6² = 36) instead of raising it to the 3/2 power; Kepler's third law gives T ∝ r^(3/2)."],
    ["T_A = 216 T_B", "This uses T ∝ r³ (6³ = 216); Kepler's third law has T² ∝ r³, so T ∝ r^(3/2), giving about 15."],
  ],
  15: [
    ["When the moon reaches the apogee, its gravitational potential energy as well as its kinetic energy will be at minimum. It will move at a low velocity.", "At apogee U is at its maximum (least negative), not its minimum; only the speed (and K) is at a minimum there."],
    ["When the moon reaches the apogee, its gravitational potential energy as well as its kinetic energy will be at maximum. It will move at a high velocity.", "At apogee the Moon is farthest from Earth, so U is at its maximum but the speed and kinetic energy are at their minimum, not maximum."],
    ["When the moon reaches the perigee, its gravitational potential energy will be at a maximum and its kinetic energy will be at a minimum. It will move at a low velocity.", "This is reversed: at perigee r is smallest, so U is at its minimum (most negative) and K and speed are at their maximum."],
  ],
  16: [
    ["For a planet of the greater orbital period", "The constant k = 4π²/GM depends only on the central mass; a longer period just means a larger orbit, with the same k."],
    ["For a planet of a smaller orbital radius", "The constant k is fixed by the star's mass; a smaller radius gives a shorter period but the same k."],
    ["For a planet of different mass orbiting the same star", "The planet's mass does not appear in k = 4π²/GM; only the central star's mass matters."],
  ],
  17: [
    ["Decrease by 105 m/s", "The direction is wrong: a lower orbit needs a higher speed (v = √(GM/r) increases as r decreases), so the speed must increase."],
    ["Increase by 3115 m/s", "This is the difference between the escape velocity and the orbital velocity at one altitude, not the change between the two orbits; the actual change is about 105 m/s."],
    ["Decrease by 3115 m/s", "Both the direction and the magnitude are wrong: the speed increases by about 105 m/s when moving to the lower orbit."],
  ],
  18: [
    ["The acceleration due to gravity experienced by Ursae Majoris B is 2.5 times greater than that due to gravity experienced by Ursae Majoris C.", "2.5 is the ratio of the radii (1.56 × 10⁹/6.2 × 10⁸), but the acceleration depends on r², so the ratio is about 6.3, not 2.5."],
    ["The acceleration due to gravity experienced by Ursae Majoris C is 2.5 times greater than that due to gravity experienced by Ursae Majoris B.", "This has both the ratio and the direction wrong: B is closer, so B's acceleration is greater, by about 6.3 times."],
    ["The acceleration due to gravity experienced by Ursae Majoris C is 6.3 times greater than that due to gravity experienced by Ursae Majoris B.", "The direction is reversed: the closer planet (B) experiences the greater acceleration, about 6.3 times C's."],
  ],
  19: [
    ["E_total = E_K / 2", "For a circular orbit E = −K, not K/2; the total energy is negative and equal in magnitude to the kinetic energy."],
    ["E_total = −E_K / 2", "This is off by a factor of 2: E = −K (since K = −U/2 and E = U/2 = −K), not −K/2."],
    ["E_total = −U / 2", "The sign is wrong: E = U/2 (both are negative), not −U/2."],
  ],
  20: [
    ["X : Y = 1 : 4", "This treats the orbital speed as proportional to the mass; v = √(GM/r) does not depend on the satellite's mass at all."],
    ["X : Y = 4 : 1", "This treats the speed as proportional to the mass; both satellites are in the same orbit, so their speeds are equal."],
    ["X : Y = 2 : 1", "This uses the square root of the mass ratio, but the mass does not appear in v = √(GM/r); the speeds are equal."],
  ],
  21: [
    ["It would increase by a factor of 2.", "The direction is wrong: moving from 2r to r makes U = −GMm/r twice as negative, so the potential energy decreases, not increases."],
    ["It would increase by a factor of 4.", "U ∝ 1/r, not 1/r²: halving the radius doubles the magnitude of U, so the change is a factor of 2, not 4."],
    ["It would decrease by a factor of 4.", "This uses U ∝ 1/r²; the potential energy is U = −GMm/r, so halving r changes it by a factor of 2, not 4."],
  ],
  22: [
    ["v_orb = √2 v_esc; K = −U / 2", "The relationship is the other way round: v_esc = √2 v_orb (escape speed is √2 times orbital speed), and K = −U/2 is correct but paired with the wrong velocity relation."],
    ["v_esc = √2 v_orb; K = U / 2", "The velocity relation is right, but K = U/2 is wrong: for a circular orbit K = −U/2 (kinetic energy is positive, half the magnitude of U)."],
    ["v_orb = √2 v_esc; E = −U / 2", "Both parts are wrong: v_esc = √2 v_orb, and E = U/2 (both negative), not −U/2."],
  ],
  23: [
    ["Work done on satellite A from X to Y: non-zero; work done on satellite B from P to Q: non-zero", "On the circular orbit B, gravity is always perpendicular to the velocity and r is constant, so no work is done; only A's work is non-zero."],
    ["Work done on satellite A from X to Y: zero; work done on satellite B from P to Q: zero", "On the ellipse A, the distance from Earth changes between X and Y, so U and K change and gravity does non-zero work; only B's work is zero."],
    ["Work done on satellite A from X to Y: zero; work done on satellite B from P to Q: non-zero", "This is reversed: A (elliptical) has non-zero work and B (circular) has zero work."],
  ],
  24: [
    ["U_A = 3U_B; v_A = √3 v_B", "The orbital radii are 2R and 4R, so U_A = 2U_B (not 3) and v_A = √2 v_B (not √3)."],
    ["U_A = 2U_B; v_A = √3 v_B", "The potential energy ratio is right, but v ∝ 1/√r gives v_A/v_B = √(4R/2R) = √2, not √3."],
    ["U_A = 3U_B; v_A = √2 v_B", "The velocity ratio is right, but U ∝ 1/r with radii 2R and 4R gives U_A = 2U_B, not 3U_B."],
  ],
  25: [
    ["(16/7) R", "This is the distance from the planet's centre (r = 16R/7), not the height above the surface; the question asks for the height, so subtract R to get 9R/7."],
    ["(9/16) R", "This squares the speed ratio the wrong way: K = (9/16)GMm/R, and energy conservation gives r = 16R/7, so the height is 9R/7, not 9R/16."],
    ["(23/9) R", "This comes from an arithmetic slip in the energy equation (e.g. adding instead of subtracting the kinetic term); the correct height is 9R/7."],
  ],
  26: [
    ["Diagram B", "A larger ellipse would need more energy, but slowing the satellite reduces its energy; the new orbit must be smaller, not larger."],
    ["Diagram C", "A larger circle would need a higher speed at X, but the satellite has slowed; it cannot move to a larger circular orbit."],
    ["Diagram D", "A smaller circle would require the satellite to be moving at the circular speed for that smaller radius at X, which it is not; the orbit is an ellipse with X as its farthest point."],
  ],
  27: [
    ["6 × 10¹⁶ kg", "This is the result of a power-of-ten slip (or using r in km without converting); with g = 2.5 m s⁻² at r = 4 × 10⁶ m, M ≈ 6 × 10²³ kg."],
    ["3 × 10¹⁷ kg", "This comes from reading the graph at the wrong point or a unit error on the radius; the correct mass is about 6 × 10²³ kg."],
    ["3 × 10²⁴ kg", "This is about five times too large — likely from reading g at the wrong radius (e.g. 2 × 10⁶ m) or an arithmetic slip; the graph gives ≈ 6 × 10²³ kg."],
  ],
  28: [
    ["4.9 × 10¹⁰ J", "This is double the correct value — likely from using GMm/r instead of GMm/2r for the orbital energy difference."],
    ["2.5 × 10¹³ J", "This is the result of a power-of-ten slip (or using r in km without converting to metres); the energy difference is about 2.5 × 10¹⁰ J."],
    ["4.9 × 10¹³ J", "This combines the factor-of-2 error with a power-of-ten slip; the correct minimum energy is about 2.5 × 10¹⁰ J."],
  ],
  29: [
    ["Formula: F = GMm / R²; direction: towards the centre", "F = GMm/R² is the gravitational force, not the acceleration due to gravity; the acceleration is g = GM/R², independent of the object's mass."],
    ["Formula: W = m x g; direction: away from the centre", "W = mg is the weight, and the acceleration due to gravity points towards the centre of the Earth, not away from it."],
    ["Formula: F = m x a; direction: away from the centre", "F = ma is Newton's second law, not the formula for g, and the direction is towards the centre, not away."],
  ],
  30: [
    ["1.3 × 10⁶ m", "This is the result of inverting the period ratio (or using T₁/T₂ instead of T₂/T₁); the second satellite has the longer period, so its radius must be larger than 2.3 × 10⁶ m."],
    ["3.9 × 10⁶ m", "This uses the period ratio to the first power instead of the 2/3 power; Kepler's third law gives r ∝ T^(2/3)."],
    ["5.1 × 10⁶ m", "This uses the period ratio squared (or the wrong power); r ∝ T^(2/3) gives about 3.3 × 10⁶ m."],
  ],
  31: [
    ["1.5 × 10³ J", "This is the result of a power-of-ten slip (or using km as m); the change in potential energy is about 1.0 × 10¹⁰ J."],
    ["1.5 × 10⁹ J", "This is about ten times too small — likely a unit error on the radii; ΔU = GMm(1/r₁ − 1/r₂) ≈ 1.0 × 10¹⁰ J."],
    ["1.0 × 10¹³ J", "This is a power-of-ten slip (or using the radius in km without converting); the correct change is about 1.0 × 10¹⁰ J."],
  ],
  32: [
    ["Diagram B", "An arrow pointing above Earth's centre would mean the acceleration is not towards the centre; gravity always points to the centre of Earth."],
    ["Diagram C", "An arrow pointing below Earth's centre is not towards the centre; the gravitational acceleration is always directed at Earth's centre."],
    ["Diagram D", "An arrow along the orbit (tangent) would be a velocity, not an acceleration; the acceleration points towards the centre of Earth."],
  ],
  33: [
    ["Speed: v_B > v_C > v_A > v_D; total mechanical energy: E_A > E_B > E_C > E_D", "The speed order is wrong (the comet is fastest at D, closest to the Sun) and the total energy is conserved, so it is the same everywhere."],
    ["Speed: v_D > v_A > v_C > v_B; total mechanical energy: E_A > E_B > E_C > E_D", "The speed order is right, but the total mechanical energy is conserved (only gravity acts), so it cannot decrease around the orbit."],
    ["Speed: v_B > v_C > v_A > v_D; total mechanical energy: E_A = E_B = E_C = E_D", "The energy is conserved, but the speed order is reversed: the comet moves fastest at D (closest to the Sun) and slowest at B (farthest)."],
  ],
  34: [
    ["The Earth moves faster when it is closer to the Sun.", "This is Kepler's second law (equal areas in equal times), so it is one of the three laws, not the exception."],
    ["Mars' orbit has an elliptical shape with the Sun at one focus.", "This is Kepler's first law, so it is one of the three laws, not the exception."],
    ["The ratio of the period squared to the radius cubed of Venus and Mercury is the same.", "This is Kepler's third law, so it is one of the three laws, not the exception."],
  ],
  35: [
    ["Graph B", "Graph B shows K and U with equal magnitudes (K = 12…, U = −12…), but for an orbit K = −E and U = 2E, so U must be twice K, not equal to it."],
    ["Graph C", "Graph C shows K = −2E and U = E, which is the reverse of the correct relationship (K = −E, U = 2E)."],
    ["Graph D", "Graph D shows K = −E and U = E, but U = 2E for an orbit: the potential energy is twice the total energy in magnitude, not equal to it."],
  ],
  36: [
    ["0.66 : 1", "This uses the mass ratio divided by the radius ratio (2/3) instead of the radius squared (2/9); g = GM/r², so the ratio is 2/9 ≈ 0.22."],
    ["1.5 : 1", "This uses the mass ratio divided by the radius ratio (2/3) inverted, or forgets to square the radius; g ∝ M/r² gives 2/9."],
    ["4.5 : 1", "This uses the radius ratio squared divided by the mass ratio (9/2) instead of the other way round; g ∝ M/r² gives 2/9."],
  ],
  37: [
    ["The object reaches an infinite distance from Earth.", "This is part of the definition of escape velocity (the object just reaches infinity), so it is a consideration, not the exception."],
    ["The Earth’s gravitational force stops acting on the object.", "At infinity the gravitational force falls to zero, which is part of the escape condition, so it is a consideration."],
    ["The initial gravitational potential energy and kinetic energy of the object are equal in magnitude.", "This is the energy condition for escape (K = |U|), so it is a consideration, not the exception."],
  ],
  38: [
    ["0.0237", "This is the result of inverting the radius ratio (or using the wrong power); T_A/T_B = (7000/14 000)^(3/2) ≈ 0.354."],
    ["0.125", "This uses the radius ratio cubed (0.5³) instead of the 3/2 power; T ∝ r^(3/2) gives 0.354."],
    ["2.828", "This is the inverse of the correct ratio (or uses the radius ratio to the 3/2 power inverted); T_A/T_B ≈ 0.354."],
  ],
  39: [
    ["image the surface of the entire Earth.", "A geostationary satellite is far away and sees only part of the Earth's surface, not the whole of it."],
    ["take more detailed images of the Earth.", "Being much farther away than a low-Earth orbit, a geostationary satellite sees less detail, not more."],
    ["move over the surface of the Earth and therefore scan a larger area of the Earth.", "A geostationary satellite stays above the same point; it is low-Earth-orbit satellites that move over the surface."],
  ],
  40: [
    ["v_A:v_B = 1:1", "The satellites are at different radii (T_A = T_B/8), so their speeds differ; v = √(GM/r) gives v_A/v_B = 2."],
    ["v_A:v_B = 4:1", "This uses the period ratio directly (8) with the wrong power, or r ∝ T^(2/3) then v ∝ 1/√r gives 2, not 4."],
    ["v_A:v_B = 8:1", "This treats the speed as proportional to the period ratio; v ∝ 1/√r and r ∝ T^(2/3) give v ∝ T^(−1/3), so the ratio is 2."],
  ],
  41: [
    ["√2 : 1", "This is the inverse of the correct ratio: v ∝ 1/√r, so with r_X = 2r_Y, v_X/v_Y = 1/√2, not √2."],
    ["1 : 1", "This ignores the different orbital radii; v = √(GM/r) depends on r, so the speeds differ."],
    ["1 : 2", "This treats the speed as inversely proportional to the radius (v ∝ 1/r) instead of 1/√r; the ratio is 1/√2."],
  ],
  42: [
    ["6.0 × 10²³ kg", "This is about five times too large — likely a unit error on the radius (using km as m) or reading g wrongly; M = gr²/G ≈ 1.35 × 10²³ kg."],
    ["40 × 10⁹ kg", "This is the result of a power-of-ten slip (or using r in km without converting); the correct mass is about 1.35 × 10²³ kg."],
    ["9 × 10²⁴ kg", "This is far too large — likely from using the radius in km as m or a power-of-ten slip; M ≈ 1.35 × 10²³ kg."],
  ],
  43: [
    ["Higher speed; longer orbital period; greater orbital radius; more centripetal force", "A geostationary orbit has a lower speed and less centripetal force than a low-Earth orbit, not more."],
    ["Higher speed; shorter orbital period; greater orbital radius; less centripetal force", "The speed is lower in a geostationary orbit (v = √(GM/r) decreases with r), and the period is longer (24 h), not shorter."],
    ["Lower speed; shorter orbital period; lower orbital radius; more centripetal force", "The geostationary orbit has the greater orbital radius and the longer period, not the lower radius and shorter period."],
  ],
  44: [
    ["Centaur would take 8 times longer than Tri to make a full orbit of the star", "The direction is wrong: Tri has the larger radius, so Tri takes longer; T ∝ r^(3/2) gives T_Tri = 8 T_Centaur."],
    ["Tri would take 64 times longer than Centaur to make a full orbit of the star", "This uses the radius ratio squared (4² = 64) instead of the 3/2 power; T ∝ r^(3/2) gives 4^(3/2) = 8."],
    ["Centaur would take 64 times longer than Tri to make a full orbit of the star", "Both the direction and the power are wrong: Tri (larger radius) takes 8 times longer, not 64."],
  ],
  45: [
    ["0.8 m s⁻²", "This is about half the correct value — likely a power-of-ten slip on the mass or radius; g = GM/r² ≈ 1.5 m s⁻²."],
    ["3.8 m s⁻²", "This is about 2.5 times too large — likely a unit error on the radius (using km as m); the correct surface gravity is about 1.5 m s⁻²."],
    ["9.8 m s⁻²", "This is Earth's surface gravity, not Ganymede's; substituting Ganymede's mass and radius gives about 1.5 m s⁻²."],
  ],
  46: [
    ["Kinetic energy: increase; gravitational potential energy: decrease", "This is reversed: as r increases, K = GMm/2r decreases and U = −GMm/r becomes less negative, so U increases."],
    ["Kinetic energy: increase; gravitational potential energy: increase", "The kinetic energy decreases with increasing radius (K = GMm/2r), so it cannot increase."],
    ["Kinetic energy: decrease; gravitational potential energy: decrease", "The potential energy increases (becomes less negative) as the radius increases, so it cannot decrease."],
  ],
  47: [
    ["The mass of the planet it orbits.", "The planet's mass does affect the orbital velocity: v = √(GM/r) depends on M."],
    ["The gravitational force of the planet.", "The gravitational force of the planet is what determines the orbital velocity, so it does affect it."],
    ["The satellite’s altitude.", "The altitude sets the orbital radius r, which appears in v = √(GM/r), so it does affect the velocity."],
  ],
  48: [
    ["√5 r / 2", "This is the radius for a 25% decrease in kinetic energy (or the wrong power of the ratio); K ∝ 1/r, so a 25% increase in K means r × 4/5."],
    ["2r / √5", "This uses the wrong power of the energy ratio; K ∝ 1/r, so r_new = r/1.25 = 4r/5, not 2r/√5."],
    ["5r / 4", "This treats K as proportional to r (or inverts the ratio); K ∝ 1/r, so a larger K means a smaller r, 4r/5."],
  ],
  49: [
    ["The change in kinetic energy between points X and Y.", "Gravity is conservative: the work it does equals the change in gravitational potential energy, not the change in kinetic energy (the spacecraft is under power, so K is not set by gravity alone)."],
    ["The change in total mechanical energy between points X and Y.", "The work done by gravity equals −ΔU, not the change in total mechanical energy; the engines also do work on the spacecraft."],
    ["No work is done by the gravitational force between points X and Y.", "The path changes height, so the gravitational potential energy changes and gravity does work; the winding path does not make the work zero."],
  ],
  50: [
    ["The mass of the planet.", "The planet's mass M appears in v_esc = √(2GM/r), so it does affect the escape velocity."],
    ["The radius of the planet.", "The radius r appears in v_esc = √(2GM/r), so it does affect the escape velocity."],
    ["The universal gravitational constant.", "G appears in v_esc = √(2GM/r), so it does affect the escape velocity."],
  ],
  51: [
    ["The mass is at the top of its trajectory: A; the mass is falling towards the Earth: C", "At the top of the trajectory K = 0, so E = U, which is point B on the curve, not A (A is below the curve, where E < U)."],
    ["The mass is at the top of its trajectory: A; the mass is falling towards the Earth: D & E", "At the top E = U (point B), and while falling the mass is still bound, so E < 0 (point C), not D or E (which are at or above zero)."],
    ["The mass is at the top of its trajectory: B; the mass is falling towards the Earth: D & E", "The top is correctly B, but while falling the mass is still bound (E < 0), so it is point C, not D or E."],
  ],
  52: [
    ["1 : 3", "This uses the mass ratio divided by the radius ratio (12/4 = 3) without squaring the radius; g = GM/r² gives 12/16 = 3/4."],
    ["3 : 1", "This is the inverse of the correct ratio; g_F/g_U = 12/4² = 3/4, not 3."],
    ["4 : 3", "This uses the radius ratio (4) divided by the mass ratio (12) inverted, or forgets to square the radius; the correct ratio is 3/4."],
  ],
  53: [
    ["2:3", "This is the inverse of the correct ratio: K ∝ 1/r, so K_X/K_Y = r_Y/r_X = 3/2, not 2/3."],
    ["1:2", "This treats K as proportional to r (or uses the wrong power); K = GMm/2r ∝ 1/r gives 3/2."],
    ["2:1", "This uses the ratio of the distances from the surface rather than the centre, or the wrong power; the correct ratio is 3/2."],
  ],
  54: [
    ["6.64 × 10²⁴ N", "This is the result of a power-of-ten slip (or using the orbital radius in km as m); F = mv²/r ≈ 1.61 × 10²² N."],
    ["1.61 × 10²⁵ N", "This is a power-of-ten slip on the radius (using 1.07 × 10⁶ km as 1.07 × 10⁶ m); the correct force is 1.61 × 10²² N."],
    ["3.56 × 10²⁵ N", "This is far too large — likely a unit error on the radius or speed; F = mv²/r ≈ 1.61 × 10²² N."],
  ],
  55: [
    ["3.49 × 10⁸ m", "This is the result of using the wrong mass ratio (or not taking the square root); the balance point is d = D/(1 + √(M_M/M_E)) ≈ 3.46 × 10⁸ m."],
    ["3.42 × 10⁸ m", "This is slightly too small — likely from using the mass ratio without the square root or an arithmetic slip; the correct distance is about 3.46 × 10⁸ m."],
    ["3.15 × 10⁸ m", "This is too small — likely from using the wrong mass ratio (e.g. M_E/M_M instead of M_M/M_E); the balance point is about 3.46 × 10⁸ m."],
  ],
  56: [
    ["V/4", "This treats the speed as inversely proportional to the radius (v ∝ 1/r); v = √(GM/r) gives V/2 for 4R."],
    ["4V", "This treats the speed as proportional to the radius; v = √(GM/r) decreases with r, so the speed at 4R is V/2."],
    ["2V", "This is the inverse of the correct ratio: v ∝ 1/√r, so multiplying r by 4 divides v by √4 = 2."],
  ],
  57: [
    ["−1.00 × 10¹⁴ J", "This is a power-of-ten slip (or using the altitude in km as m); U = −GMm/r ≈ −1.00 × 10¹¹ J."],
    ["−3.95 × 10¹¹ J", "This is about four times too large — likely using the altitude instead of the orbital radius (r = R_E + h); the correct value is about −1.00 × 10¹¹ J."],
    ["−1.34 × 10¹⁴ J", "This is far too large — likely a unit error on the radius; U = −GMm/r ≈ −1.00 × 10¹¹ J."],
  ],
  58: [
    ["1.0", "This would mean T ∝ r, but Kepler's third law gives T ∝ r^(3/2), so n = 1.5."],
    ["2.0", "This would mean T ∝ r², but Kepler's third law gives T ∝ r^(3/2), so n = 1.5."],
    ["3.0", "This would mean T ∝ r³, but Kepler's third law gives T ∝ r^(3/2), so n = 1.5."],
  ],
  59: [
    ["Change in potential energy: decreases; change in kinetic energy: decreases", "The kinetic energy increases in a lower orbit (v = √(GM/r) is larger), so it cannot decrease."],
    ["Change in potential energy: increases; change in kinetic energy: increases", "Moving closer makes U = −GMm/r more negative, so the potential energy decreases, not increases."],
    ["Change in potential energy: increases; change in kinetic energy: decreases", "This is reversed: moving closer decreases U and increases K."],
  ],
  60: [
    ["1/8", "This is the result of using the wrong power of the radius ratio (or inverting twice); F = mv²/r gives F₁/F₂ = 4."],
    ["1/4", "This is the inverse of the correct ratio: F₁ = mv²/r and F₂ = m(v²/2)/(2r) = mv²/4r, so F₁/F₂ = 4."],
    ["8", "This uses the wrong power of the radius ratio (e.g. r³ instead of r); F = mv²/r gives F₁/F₂ = 4."],
  ],
  61: [
    ["2.0 × 10⁻⁴ N kg⁻¹.", "This is the result of a power-of-ten slip (or dividing by the mass instead of using it); the field strength equals the free-fall acceleration, 25 N kg⁻¹."],
    ["1.3 × 10⁻¹ N kg⁻¹.", "This is far too small — likely a unit error; gravitational field strength is the force per unit mass, which here is 25 N kg⁻¹."],
    ["5.0 × 10³ N kg⁻¹.", "This is the result of multiplying by the mass instead of dividing (or a power-of-ten slip); g = F/m = 25 N kg⁻¹."],
  ],
  62: [
    ["m and r.", "The object's mass m does not appear in v_esc = √(2GM/r); only the planet's mass M and radius r matter."],
    ["M only.", "The radius r also appears in v_esc = √(2GM/r), so the escape speed depends on both M and r."],
    ["M, m, and r.", "The object's mass m cancels out of the escape-speed expression; v_esc = √(2GM/r) depends only on M and r."],
  ],
  63: [
    ["Distance from the centre of the planet. Gradient = GM", "Plotting g against r would give a curve (g = GM/r²), not a straight line through the origin; the straight line needs 1/r² on the axis."],
    ["Square of distance from the surface of the planet. Gradient = GM", "g is not proportional to r² (it falls as 1/r²), so this would not give a straight line; the axis must be 1/r² from the centre."],
    ["Mass of the planet. Gradient = G/r", "The graph is for a single planet of fixed mass M, so the mass is not the variable; g ∝ 1/r² gives a straight line against 1/r² with gradient GM."],
  ],
  64: [
    ["Short orbital period: Geostationary Orbit; large altitude: Near Earth Orbit; used for mapping surface terrain: Near Earth Orbit", "The geostationary orbit has the long period (24 h) and the large altitude; the near-Earth orbit has the short period."],
    ["Short orbital period: Near Earth Orbit; large altitude: Geostationary Orbit; used for mapping surface terrain: Geostationary Orbit", "The mapping of surface terrain is done by near-Earth orbits, which are close enough for detail; geostationary orbits are too far away."],
    ["Short orbital period: Geostationary Orbit; large altitude: Near Earth Orbit; used for mapping surface terrain: Geostationary Orbit", "Both the period and the altitude are swapped: near-Earth orbits have the short period and low altitude, and geostationary orbits the long period and high altitude."],
  ],
  65: [
    ["2.8 N kg⁻¹", "This is about four times too small — likely a power-of-ten slip on the mass or radius; g = GM/r² ≈ 11.3 N kg⁻¹."],
    ["9.8 N kg⁻¹", "This is Earth's surface gravity, not Neptune's; substituting Neptune's mass and radius gives about 11.3 N kg⁻¹."],
    ["22.6 N kg⁻¹", "This is double the correct value — likely from using the diameter instead of the radius; the radius is 2.46 × 10⁷ m."],
  ],
  66: [
    ["Greater orbital speed: S₁; greater gravitational potential energy: S₁", "The LEO satellite S₁ has the greater speed, but its potential energy is more negative (smaller); the GEO satellite S₂ has the greater potential energy."],
    ["Greater orbital speed: S₂; greater gravitational potential energy: S₁", "The speed is greater for the LEO satellite S₁ (v = √(GM/r) is larger at smaller r), not for S₂."],
    ["Greater orbital speed: S₂; greater gravitational potential energy: S₂", "The GEO satellite S₂ has the greater potential energy, but its speed is lower, not greater."],
  ],
  67: [
    ["It will enter a circular orbit around the Earth with a shorter period than spacecraft 1.", "A launch speed of 2v exceeds the escape speed (√2 v), so the spacecraft does not enter any circular orbit; it escapes."],
    ["It will enter a circular orbit around the Earth with a longer period than spacecraft 1.", "2v is greater than the escape speed, so the spacecraft leaves Earth's gravitational field rather than settling into a circular orbit."],
    ["It will travel in a parabolic path and return to the surface of the Earth.", "A parabolic escape path needs exactly the escape speed (√2 v); 2v is greater, so the path is hyperbolic and the spacecraft leaves for good."],
  ],
  68: [
    ["Orbital velocity of P compared to orbital velocity of Q: greater; escape velocity of P compared to escape velocity of Q: less", "Both velocities are greater for P: v_orb = √(GM/r) and v_esc = √(2GM/r) both increase as r decreases, and P's orbit is smaller."],
    ["Orbital velocity of P compared to orbital velocity of Q: less; escape velocity of P compared to escape velocity of Q: less", "P's smaller orbit gives it the greater orbital and escape velocities, not the lesser."],
    ["Orbital velocity of P compared to orbital velocity of Q: less; escape velocity of P compared to escape velocity of Q: greater", "The orbital velocity is also greater for P (v = √(GM/r) is larger at smaller r); both are greater."],
  ],
  69: [
    ["All planets move about the Sun in elliptical orbits where the Sun is at one of the foci.", "This is Kepler's first law, so it is stated by Kepler's laws, not the exception."],
    ["The ratio of the square of the orbital period to the cube of the mean distances from the Sun is a constant for any planets orbiting the Sun.", "This is Kepler's third law, so it is stated by Kepler's laws, not the exception."],
    ["A radial distance joining any planet to the Sun sweeps out equal areas in equal lengths of time.", "This is Kepler's second law, so it is stated by Kepler's laws, not the exception."],
  ],
  70: [
    ["The impulse of the gravitation force", "The area under a force–distance graph is the work done (∫F dr), not the impulse (which is the area under a force–time graph)."],
    ["The kinetic energy", "The area under the F–r curve is the work done by the force, which equals the change in gravitational potential energy, not the kinetic energy."],
    ["The centripetal force", "The area under the graph is an energy (force × distance), not a force; it equals the change in gravitational potential energy."],
  ],
  71: [
    ["0.5", "This is the result of inverting the mass ratio (or using the wrong power of the distance ratio); F ∝ m/r² gives 8."],
    ["2.0", "This uses the mass ratio (2) without the distance ratio; Mars is 4 times farther, so the force is divided by 16, giving 8."],
    ["32.0", "This uses the distance ratio squared (4² = 16) multiplied by the mass ratio the wrong way; F_Mercury/F_Mars = (1/2) × 16 = 8."],
  ],
  72: [
    ["GMm / r", "This is the change you would get if the potential energy were proportional to 1/r without the factor of 2; ΔU = −GMm/2r − (−GMm/r) = +GMm/2r."],
    ["−GMm / r", "The sign is wrong: moving to a larger orbit increases the potential energy (it becomes less negative), so ΔU is positive."],
    ["−GMm / 2r", "The sign is wrong: doubling the radius makes U less negative, so the change in potential energy is positive, +GMm/2r."],
  ],
  73: [
    ["1.08 N kg⁻¹", "This is the field at 3R (9.76/9), not at 2R; at 2R the field is 9.76/4 = 2.44 N kg⁻¹."],
    ["3.25 N kg⁻¹", "This is the field at 1.5R (9.76/2.25), not at 2R; g ∝ 1/r² gives 9.76/4 = 2.44 N kg⁻¹."],
    ["4.88 N kg⁻¹", "This is the field at √2 R (9.76/2), not at 2R; doubling the distance divides the field by 4, giving 2.44 N kg⁻¹."],
  ],
  74: [
    ["r/2", "This treats the speed as inversely proportional to the square root of the radius the wrong way; v ∝ 1/√r, so doubling v divides r by 4."],
    ["2r", "This treats the speed as inversely proportional to the radius (v ∝ 1/r); v = √(GM/r) gives r/4 for 2v."],
    ["4r", "This treats the speed as proportional to the radius (or inverts the ratio); v = √(GM/r) gives r/4 for 2v."],
  ],
  75: [
    ["2:3", "This uses the mass ratio (50:300 = 1:6) with the wrong power of the radius; by Newton's third law the forces are equal, 1:1."],
    ["1:3", "This uses the mass ratio (50:300 = 1:6) with the wrong power of the radius; the two gravitational forces are an action–reaction pair, so they are equal."],
    ["1:6", "This uses the mass ratio directly, but the force of X on Y and the force of Y on X are equal and opposite (Newton's third law), so the ratio is 1:1."],
  ],
  76: [
    ["120 minutes", "This treats the period as proportional to the radius (doubling r doubles T); Kepler's third law gives T ∝ r^(3/2), so T ≈ 170 minutes."],
    ["145 minutes", "This uses the wrong power of the radius ratio (e.g. 2^1.2); T ∝ r^(3/2) gives 60 × 2^1.5 ≈ 170 minutes."],
    ["30 minutes", "This treats the period as inversely proportional to the radius; doubling the radius makes the period longer, not shorter."],
  ],
  77: [
    ["the initial speed required so that an object will safely orbit the Earth.", "That is the orbital velocity, not the escape velocity; escape velocity is about leaving the gravitational field completely."],
    ["the speed required for an object to be launched and fly through space forever.", "This is close but misses the energy condition: escape velocity is the speed at which the total mechanical energy is zero, so the object just reaches infinity."],
    ["the speed necessary for a spacecraft to escape Earth’s atmosphere.", "Escaping the atmosphere is not the same as escaping the gravitational field; escape velocity is defined by the total energy being zero."],
  ],
  78: [
    ["5.63 × 10¹¹ N", "This is the result of a power-of-ten slip (or using the period in hours as seconds); F = 4π²mr/T² ≈ 4.34 × 10⁴ N."],
    ["4.07 N", "This is far too small — likely a unit error on the period or radius; F = 4π²mr/T² ≈ 4.34 × 10⁴ N."],
    ["1.24 × 10⁴ N", "This is about a third of the correct value — likely using the wrong period (e.g. 1.5 h as 5400 s incorrectly) or radius; the correct force is about 4.34 × 10⁴ N."],
  ],
  79: [
    ["334 555 km", "This is the result of inverting the period ratio (or using the wrong power); r ∝ T^(2/3) gives about 421 900 km."],
    ["643 618 km", "This uses the period ratio to the first power (or the wrong power); r ∝ T^(2/3) gives about 421 900 km."],
    ["751 030 km", "This uses the period ratio squared (or the wrong power); r ∝ T^(2/3) gives about 421 900 km."],
  ],
  80: [
    ["1.84 km s⁻¹", "This is the result of using the wrong radius ratio (or the wrong power); v ∝ 1/√r gives 2.14 km s⁻¹."],
    ["2.50 km s⁻¹", "This uses the mass ratio instead of the radius ratio; the orbital velocity depends on the radius, not the moon's mass."],
    ["5.37 km s⁻¹", "This is far too large — likely using the wrong power of the radius ratio or a unit error; v ∝ 1/√r gives 2.14 km s⁻¹."],
  ],
  81: [
    ["Work done on Satellite A from R to S: zero; work done on Satellite B from P to Q: zero", "On the ellipse B, Q is farther from Earth than P, so U and K change and gravity does non-zero work; only A's work is zero."],
    ["Work done on Satellite A from R to S: non-zero; work done on Satellite B from P to Q: zero", "This is reversed: A is on a circular orbit (zero work) and B is on an ellipse (non-zero work)."],
    ["Work done on Satellite A from R to S: non-zero; work done on Satellite B from P to Q: non-zero", "On the circular orbit A, gravity is always perpendicular to the velocity and r is constant, so no work is done; only B's work is non-zero."],
  ],
  82: [
    ["Double the distance between the objects.", "Doubling the distance divides the force by 4 (F ∝ 1/r²), which is a decrease, not the greatest increase."],
    ["Double the mass of one object.", "Doubling one mass doubles the force, but doubling both masses quadruples it, which is a greater increase."],
    ["Halve the mass of both objects.", "Halving both masses divides the force by 4, which is a decrease, not an increase."],
  ],
  83: [
    ["Both kinetic and potential energy increase.", "As the satellite moves closer, U = −GMm/r becomes more negative (decreases), so the potential energy cannot increase."],
    ["Both kinetic and potential energy decrease.", "The kinetic energy increases as the satellite moves closer (v = √(GM/r) is larger), so it cannot decrease."],
    ["Kinetic energy decreases, potential energy increases.", "This is reversed: moving closer increases the kinetic energy and decreases the potential energy."],
  ],
  84: [
    ["2T", "This uses T ∝ r instead of T ∝ r^(3/2); with a radius ratio of 4, the period ratio is 4^(3/2) = 8."],
    ["4T", "This uses the radius ratio directly (4) instead of raising it to the 3/2 power; T ∝ r^(3/2) gives 8T."],
    ["16T", "This uses the radius ratio squared (4² = 16) instead of the 3/2 power; T ∝ r^(3/2) gives 8T."],
  ],
  85: [
    ["3.5 km/s", "This is about 30% too small — likely a unit error on the radius (using km as m) or the wrong power; v_esc = √(2GM/r) ≈ 5.0 km/s."],
    ["5.6 km/s", "This is slightly too large — likely using the wrong radius (e.g. the altitude without adding Earth's radius); the correct escape velocity is about 5.0 km/s."],
    ["11.2 km/s", "This is Earth's escape velocity at the surface, not at an altitude of 25 480 km; at that height the escape velocity is about 5.0 km/s."],
  ],
  86: [
    ["The star is located at C and the planet takes less time to travel P to Q than it does for R to S.", "The direction is wrong: from focus C, the line to the planet sweeps a much larger area going P to Q (the far end), so P to Q takes longer, not less time."],
    ["The star is located at A and the planet takes the same time to travel P to Q as it does for R to S.", "A is a focus, but the star is at C (the other focus); and P to Q and R to S do not take the same time because the swept areas differ."],
    ["The star is located at B and the planet takes the same time to travel P to Q as it does for R to S.", "B is the centre of the ellipse, not a focus, so the star cannot be at B; the star is at a focus (C)."],
  ],
  87: [
    ["1.2 × 10²⁸ N", "This is the result of a power-of-ten slip (or using the distance in km as m); F = GMm/r² ≈ 3.6 × 10²² N."],
    ["5.3 × 10³³ N", "This is far too large — likely a unit error on the distance; F = GMm/r² ≈ 3.6 × 10²² N."],
    ["8.0 × 10⁴³ N", "This is far too large — likely a power-of-ten slip on the masses or distance; F = GMm/r² ≈ 3.6 × 10²² N."],
  ],
  88: [
    ["T/2", "This uses T ∝ r^(1/2) instead of T ∝ r^(3/2); with r_B = r/4, the period is T × (1/4)^(3/2) = T/8."],
    ["2T", "This treats the period as inversely proportional to the radius (or uses the wrong power); T ∝ r^(3/2) gives T/8."],
    ["8T", "This is the inverse of the correct ratio: a smaller radius means a shorter period, T/8, not 8T."],
  ],
  89: [
    ["Low Earth Orbit: shorter orbital period; Geostationary Orbit: lower orbital radius", "The geostationary orbit has the larger orbital radius, not the lower one."],
    ["Low Earth Orbit: longer orbital period; Geostationary Orbit: fixed orbital radius", "The low Earth orbit has the shorter period (about 90 min), not the longer one."],
    ["Low Earth Orbit: always equatorial; Geostationary Orbit: lower orbital velocity", "Low Earth orbits are not always equatorial (many are polar), and the geostationary orbit has the lower velocity, which is correct but paired with a false statement."],
  ],
  90: [
    ["1.8 days.", "This is the result of using the radius ratio to the first power (0.63) instead of the 3/2 power; T ∝ r^(3/2) gives 3.6 days."],
    ["5.7 days.", "This is the result of using the radius ratio squared (0.63² ≈ 0.4) the wrong way; T ∝ r^(3/2) gives 3.6 days."],
    ["14.4 days.", "This is double Ganymede's period — likely from inverting the radius ratio or using the wrong power; T ∝ r^(3/2) gives 3.6 days."],
  ],
  91: [
    ["u_Ax = ½u_Bx; u_Ay = u_By; t_A = 2t_B; R_A = R_B", "The time of flight depends only on the vertical motion, so t_A = t_B, not 2t_B; and with half the horizontal speed the range is half, not equal."],
    ["u_Ax = ½u_Bx; u_Ay = u_By; t_A = t_B; R_A = R_B", "The time is right, but the range is wrong: R = u_x × t, so with half the horizontal velocity the range is half, R_A = ½R_B."],
    ["u_Ax = ½u_Bx; u_Ay = u_By; t_A = 2t_B; R_A = 2R_B", "Both the time and the range are wrong: the time is the same (t_A = t_B) and the range is half (R_A = ½R_B)."],
  ],
  92: [
    ["R = 16 H", "This is the result of using the wrong power of the angle (e.g. sin 45° = 1/√2 handled wrongly); at 45°, R = u²/g and H = u²/4g, so R = 4H."],
    ["R = 8 H", "This is double the correct ratio; at 45°, R = u²/g and H = u²/4g, so R = 4H."],
    ["R = 2 H", "This is half the correct ratio; at 45°, R = u²/g and H = u²/4g, so R = 4H."],
  ],
  93: [
    ["Row A", "Row A shows Sam with a small vertical and large horizontal component, but Sam's ball went higher, so Sam needs the larger vertical component."],
    ["Row C", "Row C shows both balls with the same components, but Sam's ball went higher, so the vertical components must differ."],
    ["Row D", "Row D shows both balls with the same components, but Sam's ball went higher, so the vertical components must differ."],
  ],
  94: [
    ["0", "At the top the horizontal component of velocity remains, so the kinetic energy is not zero; K = ½m u_x² = ½E."],
    ["¼E", "This is the kinetic energy if only a quarter of the initial energy remained; with equal components u_x² = ½u², so K = ½E."],
    ["E", "This would mean no kinetic energy was lost, but the vertical component is zero at the top, so K = ½E."],
  ],
  95: [
    ["9.0 m", "This is the distance the second projectile would travel if it had the same time as the first but you used the wrong time; both fall from the same height, so t = 4.0 s and d = 9.0 × 4.0 = 36 m."],
    ["45 m", "This is the result of using the first projectile's distance with the second's speed the wrong way; d = 9.0 × 4.0 = 36 m."],
    ["90 m", "This is the result of using the wrong time of flight (e.g. 10 s); both fall from the same height, so t = 4.0 s and d = 36 m."],
  ],
  96: [
    ["9.1m", "This is the result of a unit error (using 1 m as 10 m, or a slip in √(2h/g)); t = √(2 × 1/9.8) ≈ 0.45 s, so d = 2 × 0.45 ≈ 0.90 m."],
    ["136cm", "This is the result of using the wrong time of flight (e.g. √(2h/g) with h = 2 m); the correct distance is about 90 cm."],
    ["64cm", "This is the result of using the wrong time of flight (e.g. t = 0.32 s); t = √(2 × 1/9.8) ≈ 0.45 s, so d ≈ 90 cm."],
  ],
  97: [
    ["1.4m", "This is the result of using the wrong relationship (e.g. H = R/14); at 45°, R = 4H, so H = 20/4 = 5 m."],
    ["1.5m", "This is the result of using the wrong relationship (e.g. H = R/13); at 45°, R = 4H, so H = 5 m."],
    ["2m", "This is the result of using the wrong relationship (e.g. H = R/10); at 45°, R = 4H, so H = 5 m."],
  ],
  98: [
    ["decreased range, same maximum height", "The maximum height also decreases: H = u_y²/2g is inversely proportional to g, so a larger g means a smaller height."],
    ["same range, decreased maximum height", "The range also decreases: R = u² sin 2θ/g is inversely proportional to g, so a larger g means a smaller range."],
    ["same range, same maximum height", "Both the range and the maximum height are inversely proportional to g, so both decrease when g increases."],
  ],
  99: [
    ["0.44 m", "This is the result of using the horizontal component instead of the vertical (or sin/cos swapped); h = (u sin 60°)²/2g ≈ 3.8 m."],
    ["1.28 m", "This is the result of using the wrong angle (e.g. 30° instead of 60°); h = (10 sin 60°)²/2g ≈ 3.8 m."],
    ["5.20 m", "This is the result of using the wrong power (e.g. u² sin θ/g instead of u² sin²θ/2g); the correct height is about 3.8 m."],
  ],
  100: [
    ["19.65 m", "This is the result of using the wrong time (e.g. 2.0 s instead of 3.03 s); h = ½gt² = ½ × 9.8 × 3.03² ≈ 45 m."],
    ["29.69 m", "This is the result of using the wrong time (e.g. 2.46 s instead of 3.03 s); h = ½gt² ≈ 45 m."],
    ["64.83 m", "This is the result of using the wrong time (e.g. 3.64 s instead of 3.03 s) or a slip in the arithmetic; h = ½gt² ≈ 45 m."],
  ],
  101: [
    ["Ball X hits the ground before ball Y because it travels a shorter distance.", "Both balls start with zero vertical velocity from the same height, so they take the same time to fall; the horizontal motion of Y does not change its fall time."],
    ["Ball Y hits the ground before ball X because its initial velocity is greater.", "The initial velocity of Y is horizontal, which does not affect the vertical fall; both balls take the same time to reach the ground."],
    ["The balls hit the ground at the same time because they have equal weights.", "The equal weights are not the reason — the time is the same because both start with zero vertical velocity and accelerate at g; even different masses would fall in the same time."],
  ],
  102: [
    ["The acceleration will increase.", "The acceleration is constant (g) throughout the fall; it does not increase."],
    ["The total energy of the car will increase.", "With no air resistance, mechanical energy is conserved: the car's total energy stays the same as it falls."],
    ["The horizontal component of the velocity will increase.", "There is no horizontal force, so the horizontal component of the velocity stays constant; only the vertical component increases."],
  ],
  103: [
    ["A", "Trajectory A is higher but lands sooner, which would need a larger vertical component and a smaller horizontal component — but the launch speed and angle are the same, so only g changes."],
    ["B", "Trajectory B is lower and lands farther, which would need a smaller vertical and larger horizontal component; with the same speed and angle, a smaller g makes the path higher and longer, not lower."],
    ["C", "Trajectory C is lower and lands sooner, but a smaller g makes the projectile rise higher and stay in the air longer, so the path is higher and longer (D)."],
  ],
  104: [
    ["0.83 m", "This is the result of using the wrong time of flight (e.g. t = 0.41 s instead of 0.554 s); y = u_y t − ½gt² ≈ 5.4 m."],
    ["3.8 m", "This is the result of using the wrong vertical component (e.g. u_y = 25 sin 30° handled wrongly) or the wrong time; the correct height is about 5.4 m."],
    ["10.4 m", "This is the result of using the wrong time of flight (e.g. the full flight time instead of the time to the goal line); the ball crosses the goal line at about 5.4 m."],
  ],
  105: [
    ["Its kinetic energy at point Y will be zero.", "At Y the projectile still has its horizontal velocity, so its kinetic energy is not zero."],
    ["Its potential energy at point Y is a minimum.", "Y is the highest point of the path, so the potential energy is a maximum there, not a minimum."],
    ["Its kinetic energy on launch will be the same as the potential energy at point Y.", "The kinetic energy at launch equals the total energy, which is the sum of the kinetic and potential energy at Y, not just the potential energy."],
  ],
  106: [
    ["7 m s⁻¹ N36.9°E", "This is the result of adding the components without squaring (6 + 8 = 14, then halved) or using the wrong angle; the magnitude is √(6² + 8²) = 10 m s⁻¹."],
    ["7 m s⁻¹ N53.1°E", "The angle is right but the magnitude is wrong: the resultant is √(6² + 8²) = 10 m s⁻¹, not 7."],
    ["10 m s⁻¹ N36.9°E", "The magnitude is right, but the angle is wrong: tan⁻¹(8/6) = 53.1° from north, not 36.9°."],
  ],
  107: [
    ["Time to land: T; distance from table: less than D", "The heavier ball falls the same height with the same acceleration, so it lands at the same time T and travels the same distance D; mass does not affect projectile motion."],
    ["Time to land: less than T; distance from table: D", "The time of flight depends only on the height and g, not on the mass, so the heavier ball takes the same time T."],
    ["Time to land: less than T; distance from table: less than D", "Neither the time nor the distance changes: projectile motion is independent of mass, so the heavier ball lands at T and D."],
  ],
  108: [
    ["Maximum height for A: equal to H; maximum height for B: equal to H", "B's cart leaves the track and becomes a projectile, so it keeps its horizontal velocity and still has kinetic energy at the top of its flight; it cannot reach height H."],
    ["Maximum height for A: less than H; maximum height for B: equal to H", "A's cart stays on the track and, with no friction, can just reach height H; it is B that falls short."],
    ["Maximum height for A: less than H; maximum height for B: less than H", "A's cart can reach height H (energy is conserved on the track); only B's cart falls short because it keeps horizontal kinetic energy."],
  ],
  109: [
    ["Time of flight", "Both balls reach the same maximum height, so they have the same vertical component and the same time of flight; this is not different."],
    ["Gravitational force", "Both balls have the same mass and are in the same gravitational field, so the gravitational force is the same."],
    ["Gravitational acceleration", "Both balls are in the same gravitational field, so the acceleration due to gravity is the same for both."],
  ],
  110: [
    ["The projectile launched at a larger angle", "A larger angle gives a larger vertical component, so it takes longer to reach maximum height (t = u sin θ/g), not sooner."],
    ["Both projectiles will reach maximum height at the same time", "The time to maximum height is t = u sin θ/g, which depends on the angle, so the two projectiles reach it at different times."],
    ["It depends on the mass of the projectiles", "The time to maximum height does not depend on mass; it depends on the vertical component of the velocity, which is set by the angle."],
  ],
  111: [
    ["Row A", "Row A shows the vertical component constant and pointing down, but the vertical velocity starts upwards, decreases to zero, then increases downwards."],
    ["Row B", "Row B shows the horizontal component changing, but with no air resistance the horizontal velocity is constant."],
    ["Row C", "Row C shows the horizontal component changing and the vertical component constant; the horizontal velocity is constant and the vertical velocity changes."],
  ],
  112: [
    ["Horizontal velocity 29.0 m s⁻¹; vertical velocity 15.4 m s⁻¹", "The components are swapped: u_x = 32.8 cos 62° ≈ 15.4 m s⁻¹ and u_y = 32.8 sin 62° ≈ 29.0 m s⁻¹."],
    ["Horizontal velocity 22.1 m s⁻¹; vertical velocity 24.2 m s⁻¹", "These are the components for an angle of about 47°, not 62°; u_x = 32.8 cos 62° ≈ 15.4 m s⁻¹."],
    ["Horizontal velocity 24.2 m s⁻¹; vertical velocity 22.1 m s⁻¹", "These are the components for an angle of about 42°, not 62°; u_x = 32.8 cos 62° ≈ 15.4 m s⁻¹."],
  ],
  113: [
    ["Initial velocity: x m s⁻¹; distance fallen at 1 s: 2y m", "The horizontal velocity is x/0.5 = 2x m s⁻¹, and the vertical distance fallen is ½gt², which quadruples when t doubles: 4y."],
    ["Initial velocity: x m s⁻¹; distance fallen at 1 s: 4y m", "The horizontal velocity is x/0.5 = 2x m s⁻¹, not x; the distance fallen (4y) is right."],
    ["Initial velocity: 2x m s⁻¹; distance fallen at 1 s: 2y m", "The velocity is right, but the distance fallen is ½gt², which quadruples when the time doubles: 4y, not 2y."],
  ],
  114: [
    ["The instantaneous velocity at point Y will be zero.", "At Y the projectile still has its horizontal velocity, so the instantaneous velocity is not zero."],
    ["The vertical component of the velocity is a constant.", "The vertical component changes (it is affected by gravity); it is the horizontal component that is constant."],
    ["The instantaneous vertical velocity will be the same at launch as at landing at impact.", "At impact the vertical velocity is equal in size but opposite in direction to the launch value, so it is not the same."],
  ],
  115: [
    ["↑ (upwards)", "The acceleration is always g downwards; it never points upwards, even at the top of the path."],
    ["↘ (down and to the right)", "The acceleration is vertical (g downwards); it has no horizontal component, so it cannot point down and to the right."],
    ["→ (to the right)", "The acceleration is g downwards, not horizontal; only the velocity can be horizontal at the top."],
  ],
  116: [
    ["B", "B has a smaller vertical component than A, so its time of flight (t = 2u sin θ/g) is shorter, not the longest."],
    ["C", "C has an even smaller vertical component, so its time of flight is shorter than A's."],
    ["D", "D has the smallest vertical component, so it stays in the air the shortest time; the steepest launch (A) has the longest time of flight."],
  ],
  117: [
    ["Maximum height reached: equal; final speed: double", "Halving g doubles the maximum height (H = u_y²/2g), and the final speed is the same (it lands at the launch height), not double."],
    ["Maximum height reached: equal; final speed: equal", "The maximum height doubles when g halves; only the final speed is unchanged."],
    ["Maximum height reached: double; final speed: double", "The height doubles, but the final speed is the same: the projectile lands at its launch height, so by energy conservation its speed equals the launch speed."],
  ],
  118: [
    ["Velocity at X, Y, Z: ↑, zero, ↓; acceleration at X, Y, Z: ↓, zero, ↓", "The velocity at Y is horizontal (→), not zero, and the acceleration is g downwards everywhere, including at Y."],
    ["Velocity at X, Y, Z: ↗, →, ↘; acceleration at X, Y, Z: ↑, zero, ↓", "The velocity arrows are right, but the acceleration is g downwards at every point; it is never zero or upwards."],
    ["Velocity at X, Y, Z: ↗, →, ↘; acceleration at X, Y, Z: ↗, zero, ↘", "The acceleration is g, vertically downwards, at every point; it does not point along the path or become zero at Y."],
  ],
  119: [
    ["The acceleration of the stone at that instant is zero.", "The acceleration is g throughout the flight; it is the vertical velocity that is zero at the top, not the acceleration."],
    ["The net force acting upon the stone at that instant has magnitude mg.", "This is true (gravity is the only force), but it does not explain why the vertical velocity is zero; the reason is the energy conversion."],
    ["The stone has no net force acting on it at the highest point.", "Gravity still acts, so the net force is mg; the vertical velocity is zero because the kinetic energy of the vertical motion has been converted to potential energy."],
  ],
  120: [
    ["a constant acceleration due to gravity", "This is a standard assumption of projectile analysis, so it is not the exception."],
    ["zero air resistance", "This is a standard assumption of projectile analysis, so it is not the exception."],
    ["projectiles are point masses", "This is a standard assumption of projectile analysis, so it is not the exception."],
  ],
  121: [
    ["in the lake", "The range is about 232 m, which is in the sand trap (228–236 m); the lake is farther out (about 266–278 m)."],
    ["on the green", "The green is from about 240 to 260 m, but the ball lands at about 232 m, in the sand trap."],
    ["in the hole", "The hole is at 250 m, but the ball lands at about 232 m, well short of the green."],
  ],
  122: [
    ["Time of flight will be shorter and its horizontal displacement will be shorter with air resistance included", "Air resistance opposes the fall, so the object takes longer to reach the ground, not shorter."],
    ["Its horizontal displacement will be longer and vertical acceleration will be smaller with air resistance included", "Air resistance reduces the horizontal velocity, so the horizontal displacement is shorter, not longer."],
    ["Its vertical displacement will be shorter and vertical acceleration will be smaller with air resistance included", "The vertical displacement is fixed (the object falls to the ground); it is the time that lengthens and the horizontal displacement that shortens."],
  ],
  123: [
    ["v + √(2gh)", "This adds the speeds directly, but energy is conserved: the speed is √(v² + 2gH), and the extra rise h is regained on the way down."],
    ["v + √(2gH)", "Speeds cannot be added like this; by energy conservation the impact speed is √(v² + 2gH), not v + √(2gH)."],
    ["√(2g(h + H))", "This ignores the initial speed v; the stone starts with kinetic energy ½mv², so the impact speed is √(v² + 2gH)."],
  ],
  124: [
    ["Vertical component of velocity: maximum; acceleration: zero", "At maximum height the vertical velocity is zero (it is changing from up to down), and the acceleration is g, not zero."],
    ["Vertical component of velocity: maximum; acceleration: g", "The vertical velocity is zero at maximum height, not maximum; the acceleration is g, which is right."],
    ["Vertical component of velocity: zero; acceleration: zero", "The vertical velocity is zero, but the acceleration is still g downwards; gravity does not switch off at the top."],
  ],
  125: [
    ["Diagram B", "Diagram B reaches the same height but lands sooner; air resistance also lowers the maximum height, so the path must be lower as well as shorter."],
    ["Diagram C", "Diagram C is lower but lands at the same place; air resistance reduces the horizontal velocity, so the projectile lands short."],
    ["Diagram D", "Diagram D is lower and lands slightly short but is symmetrical; with air resistance the descent is steeper than the ascent, so the path is not symmetrical."],
  ],
  126: [
    ["8.0 m s⁻¹", "This is the result of dividing the horizontal velocity by 10 (or a unit slip); with no air resistance the horizontal velocity stays at 80 m s⁻¹."],
    ["8.2 m s⁻¹", "This is the result of a calculation slip (e.g. dividing 80 by 9.8); the horizontal velocity is constant at 80 m s⁻¹."],
    ["800 m s⁻¹", "This is the result of multiplying by 10 (or a unit slip); the horizontal velocity stays at 80 m s⁻¹."],
  ],
  127: [
    ["Both the arrows will hit the same spot on the target just below the bullseye and the time of flight will be shorter for the second arrow.", "The arrows travel different distances, so they are in the air for different times and drop different amounts; they do not hit the same spot."],
    ["The first arrow will hit the target lower than the second arrow and the time of flight will be the same for both.", "The second arrow travels only 50 m, so it is in the air for less time and falls less; the times are not the same."],
    ["The second arrow will hit the target lower than the first arrow and the time of flight will be the same for both.", "The first arrow travels farther (70 m), so it is in the air longer and falls more; it hits lower, and the times differ."],
  ],
  128: [
    ["Each ball has the same initial velocity.", "The balls follow different paths, so their initial velocities differ (different speeds and/or angles)."],
    ["Each ball has the same initial horizontal velocity.", "The balls land at the same point but take different times (they rise different amounts), so their horizontal velocities must differ."],
    ["Each ball has the same initial vertical velocity.", "The balls rise different amounts, so their initial vertical velocities differ."],
  ],
  129: [
    ["Distance from the ground", "The distance from the ground changes throughout the flight, so it is not constant."],
    ["Speed", "The speed changes: it is greatest at launch and impact and smallest at the top of the path."],
    ["Velocity", "The velocity changes continuously (direction and magnitude), so it is not constant."],
  ],
  130: [
    ["0.98 s", "This is the result of using the wrong height (e.g. 4.7 m instead of 9.5 m); t = √(2 × 9.5/9.8) ≈ 1.39 s."],
    ["1.03 s", "This is the result of using the wrong height (e.g. 5.2 m instead of 9.5 m); t = √(2 × 9.5/9.8) ≈ 1.39 s."],
    ["1.94 s", "This is the result of using the wrong height (e.g. 18.5 m instead of 9.5 m) or a slip in the arithmetic; t ≈ 1.39 s."],
  ],
  131: [
    ["37°", "This is the result of using the wrong horizontal distance (e.g. 10 m instead of 50 m) or the wrong time; the angle is about 65°."],
    ["58°", "This is the result of using the wrong vertical displacement or time; the angle is about 65°."],
    ["81°", "This is the result of using the wrong horizontal distance (e.g. 20 m instead of 50 m); the angle is about 65°."],
  ],
  132: [
    ["Both objects will reach the ground at the same time", "The objects are dropped from different heights (150 m and 50 m), so they take different times to fall; t = √(2h/g)."],
    ["The first object flight-time will be 3 times the second object", "The time is proportional to √h, not h: t₁/t₂ = √(150/50) = √3, not 3."],
    ["The lighter object will take much longer to reach the ground", "The time of flight does not depend on mass; it depends on the height, so the 50 m object falls faster to the ground."],
  ],
  133: [
    ["The horizontal and vertical acceleration will vary during the flight time", "The acceleration is constant (g downwards) throughout; it does not vary."],
    ["The horizontal and vertical velocity will vary during the flight time", "The horizontal velocity is constant (no air resistance); only the vertical velocity varies."],
    ["At “Y” the object momentarily stops before starting to fall again", "At Y only the vertical velocity is zero; the object keeps moving horizontally, so it does not stop."],
  ],
  134: [
    ["Ceres", "Ceres has a surface gravity of 5.55 m s⁻², which would give a much higher maximum height for the same throw; the data give g ≈ 2.49 m s⁻² (Pallas)."],
    ["Icarus", "Icarus has a surface gravity of 0.38 m s⁻², which would give a much higher maximum height; the data give g ≈ 2.49 m s⁻² (Pallas)."],
    ["Hermes", "Hermes has a surface gravity of 4.97 m s⁻², which would give a higher maximum height; the data give g ≈ 2.49 m s⁻² (Pallas)."],
  ],
  135: [
    ["Time of flight: t; range: R", "The range is wrong: the time is the same (t), but the range is horizontal speed × time, so tripling the speed triples the range (3R)."],
    ["Time of flight: 3t; range: 3R", "The time of flight depends only on the height, so it stays t; only the range triples."],
    ["Time of flight: 3t; range: R", "Both are wrong: the time stays t (same height) and the range triples (3R)."],
  ],
  136: [
    ["1.0s", "This is the result of using the wrong vertical velocity (e.g. 9.8 m s⁻¹ instead of 15 m s⁻¹); at 45° the components are equal, so t = 15/9.8 ≈ 1.5 s."],
    ["1.2s", "This is the result of using the wrong vertical velocity (e.g. 12 m s⁻¹ instead of 15 m s⁻¹); at 45° the components are equal, so t = 15/9.8 ≈ 1.5 s."],
    ["2.0s", "This is the result of using the wrong vertical velocity (e.g. 19.6 m s⁻¹ instead of 15 m s⁻¹); at 45° the components are equal, so t = 15/9.8 ≈ 1.5 s."],
  ],
  137: [
    ["A non-uniform vertical acceleration", "Projectile analysis assumes a uniform (constant) vertical acceleration g, so this is not a standard assumption."],
    ["Mass is infinite", "Mass does not appear in projectile analysis at all; assuming infinite mass is not a standard assumption."],
    ["The path of the projectile is an ellipse", "The path is a parabola (under constant g), not an ellipse; this is not a standard assumption."],
  ],
  138: [
    ["Graph A", "Graph A touches zero in the middle, but the speed at the top is the horizontal component, which is non-zero; the minimum is not zero."],
    ["Graph B", "Graph B is made of straight lines, but the speed changes along a curve: v = √(u_x² + u_y²) with u_y changing linearly gives a curved graph."],
    ["Graph D", "Graph D touches zero in the middle, but the speed at the top is the non-zero horizontal component; the minimum is not zero."],
  ],
  139: [
    ["R", "The range is horizontal speed × time; doubling the speed doubles the range, so it is 2R, not R."],
    ["√2 R", "This is the result of using the wrong power (e.g. range ∝ √v); the range is proportional to the speed, so doubling it gives 2R."],
    ["4R", "This is the result of using the wrong power (e.g. range ∝ v²); the range is proportional to the speed, so doubling it gives 2R."],
  ],
  140: [
    ["Instrumental error", "An instrumental error is a fault of the equipment itself; here the launcher works but gives inconsistent results shot to shot."],
    ["Human error", "Human error is a mistake by the experimenter; the inconsistency here is in the launcher's output, not the experimenter."],
    ["Systematic error", "A systematic error shifts all results the same way; the launcher's inconsistency is unpredictable, which is a random error."],
  ],
  141: [
    ["6.4 m s⁻¹", "This is the result of using the wrong time of flight (e.g. t = 7.8 s instead of 6.39 s); t = √(2 × 200/9.8) ≈ 6.39 s, so u = 50/6.39 ≈ 7.8 m s⁻¹."],
    ["9.9 m s⁻¹", "This is the result of using the wrong time of flight (e.g. t = 5.05 s instead of 6.39 s); u = 50/6.39 ≈ 7.8 m s⁻¹."],
    ["12.2 m s⁻¹", "This is the result of using the wrong time of flight (e.g. t = 4.1 s instead of 6.39 s); u = 50/6.39 ≈ 7.8 m s⁻¹."],
  ],
  142: [
    ["Pair B", "Pair B shows the horizontal velocity falling to zero, but with no air resistance the horizontal velocity is constant."],
    ["Pair C", "Pair C shows the horizontal velocity rising from zero, but the ball is kicked horizontally, so it starts with its full horizontal velocity and keeps it."],
    ["Pair D", "Pair D shows both components falling to zero, but the horizontal velocity is constant and the vertical velocity increases."],
  ],
  143: [
    ["The magnitude of the horizontal component of the velocity of the car at Z is less than the speed at Y.", "The horizontal component at Z equals the speed at Y: at Y the car leaves horizontally, so its speed is all horizontal, and as a projectile the horizontal component is unchanged."],
    ["The magnitude of the horizontal component of the velocity of the car at Z is greater than the speed at Y.", "The horizontal component cannot exceed the speed at Y, because at Y the entire speed is horizontal and the horizontal component never changes."],
    ["The magnitude of the horizontal component of the velocity of the car at Z depends on the height of the cliff.", "The horizontal component is constant and equals the speed at Y; the cliff height affects the time of flight and the vertical component, not the horizontal one."],
  ],
  144: [
    ["30° below the horizontal", "This is the result of using the wrong relationship (e.g. cos θ = 2u/u); at the ground cos θ = u/2u = ½, so θ = 60°."],
    ["45° below the horizontal", "This is the result of using the wrong relationship (e.g. cos θ = 1/√2); at the ground cos θ = u/2u = ½, so θ = 60°."],
    ["63° below the horizontal", "This is the result of using the wrong relationship (e.g. sin θ = u/2u); the horizontal component is u, so cos θ = ½ and θ = 60°."],
  ],
  145: [
    ["No work is being done as the total energy is constant due to the potential energy and kinetic energy being constant.", "This statement is true (the energies are constant), so it is not the incorrect one; the question asks for the INCORRECT statement."],
    ["Force and displacement are perpendicular at each instant, so there is no displacement in the direction of the force and so W = Fs = 0.", "This is a correct explanation of why no work is done, so it is not the incorrect statement."],
    ["No work is being done as the total energy is constant due to the fact that the speed and height of the object do not change.", "This is a correct statement (speed and height are constant, so the energies are constant), so it is not the incorrect one."],
  ],
  146: [
    ["m = √(F_c r / v)", "This is dimensionally wrong (it would give √(N·m/(m/s)) = √(kg·m/s), not a mass); the correct relation is m = F_T cos θ / g."],
    ["m = g r tan θ / v²", "This is the inverse of the correct relation: from tan θ = v²/(rg), m does not appear; the mass is found from the vertical balance, m = F_T cos θ / g."],
    ["m = F_c g / tan θ", "This is the result of inverting the horizontal balance: F_c = mg tan θ, so m = F_c/(g tan θ), not F_c g / tan θ."],
  ],
  147: [
    ["sin⁻¹(mg/T)", "This would be the angle if the vertical component of the tension balanced the weight with sin θ; the correct relation uses tan θ = v²/(rg)."],
    ["sin⁻¹(m²v²g/r)", "This is dimensionally wrong and mixes the horizontal and vertical balances; the correct expression is tan⁻¹(v²/rg)."],
    ["tan⁻¹(mv²/rg)", "This includes the mass m, but the mass cancels: tan θ = v²/(rg), so the correct expression is tan⁻¹(v²/rg)."],
  ],
  148: [
    ["71 m s⁻¹", "This is the result of using the diameter instead of the radius (v = √(g × 513)); the radius is 513/2 = 256.5 m, giving v ≈ 50 m s⁻¹."],
    ["5.0 × 10³ m s⁻¹", "This is the result of a unit error (using km as m) or a power-of-ten slip; v = √(9.8 × 256.5) ≈ 50 m s⁻¹."],
    ["25 × 10³ m s⁻¹", "This is the result of a unit error (using km as m) or a power-of-ten slip; v = √(9.8 × 256.5) ≈ 50 m s⁻¹."],
  ],
  149: [
    ["The angular velocity would be 1.5 times greater.", "The angular velocity depends only on the frequency, which is unchanged, so it does not change at all."],
    ["The angular velocity would decrease by one third.", "Moving the mass out does not change the frequency, so the angular velocity stays the same."],
    ["The angular velocity would decrease by two thirds.", "The angular velocity is set by the frequency of rotation, not the distance from the centre, so it does not change."],
  ],
  150: [
    ["Diagram A", "Diagram A shows the centripetal force pointing away from Earth, but the force must point towards the centre of the orbit."],
    ["Diagram B", "Diagram B shows the centripetal force pointing away from Earth (and the velocity not tangent); the force must point towards Earth's centre."],
    ["Diagram C", "Diagram C shows the velocity pointing slightly downward of horizontal, but the velocity is tangent to the circular orbit, which is horizontal at the top."],
  ],
  151: [
    ["Arrow B", "Arrow B points horizontally towards the low side of the bank, but the normal force is perpendicular to the track surface, not horizontal."],
    ["Arrow C", "Arrow C points down along the slope, but the normal force is perpendicular to the surface, not along it."],
    ["Arrow D", "Arrow D points vertically down, but the normal force is perpendicular to the banked surface, not vertical."],
  ],
  152: [
    ["The force should be applied at right-angles to the door at the smallest distance possible from the hinge", "A small distance from the hinge gives a small lever arm, so the torque is small; τ = rF sin θ is maximised with the largest r."],
    ["The force should be applied at 45° to the door at the smallest distance possible from the hinge", "Both the angle (45° instead of 90°) and the small distance reduce the torque; τ = rF sin θ is maximised at 90° and the largest r."],
    ["The force should be applied at right-angles to the door at the middle distance between the outer edge of the door and end of the hinge", "The middle distance gives a smaller lever arm than the outer edge; the torque is maximised at the largest distance from the hinge."],
  ],
  153: [
    ["The banking angle, the sideways frictional force between the tyres and the tracks and the radius of the circular track", "At the critical (design) speed no friction is needed, so the frictional force is not part of the critical speed; it depends on the angle, radius and g."],
    ["The radius of the circular track, the sideways frictional force between the tyres and the tracks and the gravitational field strength", "The critical speed depends on the banking angle, not the frictional force; v = √(rg tan θ)."],
    ["The banking angle, the sideways frictional force between the tyres and the track and the gravitational field strength", "At the critical speed no friction is needed, so the frictional force is not a factor; the critical speed depends on the angle, radius and g."],
  ],
  154: [
    ["Diagram B", "Diagram B shows a force to the right (away from the centre), but there is no outward force; the normal force points towards the centre."],
    ["Diagram C", "Diagram C omits the friction force, but friction acts upwards to balance her weight; without it she would slide down."],
    ["Diagram D", "Diagram D shows four forces including one to the right (away from the centre); there is no outward force on the rider."],
  ],
  155: [
    ["A component of the normal reaction force provides the frictional force, parallel to the inclined plane of the road.", "The normal force is perpendicular to the road, so its component cannot be parallel to the road; the normal force's horizontal component provides the centripetal force."],
    ["At speeds lower than the critical speed, the car will tend to slide up the inclined plane of the road, while the frictional force acts down the plane.", "Below the critical speed the car tends to slide down the bank (towards the centre), and friction acts up the plane."],
    ["At speeds greater than the critical speed, the car will tend to slide down the inclined plane of the road, while the frictional force acts up the plane.", "Above the critical speed the car tends to slide up the bank, and friction acts down the plane."],
  ],
  156: [
    ["τ = 7.2 × 350 sin 39° N m", "This uses the rope length (7.2 m) instead of the pole height (5.0 m) and the wrong angle; τ = rF sin θ about the base uses r = 5.0 m and θ = 51°."],
    ["τ = 7.2 × 350 sin 51° N m", "This uses the rope length (7.2 m) instead of the pole height (5.0 m); the lever arm is the 5.0 m pole."],
    ["τ = 5.0 × 350 sin 39° N m", "The lever arm is right, but the angle is wrong: the angle between the pole and the rope is 51°, not 39°."],
  ],
  157: [
    ["2F", "This uses F ∝ ω instead of F ∝ ω²; doubling ω multiplies the tension by 2² = 4."],
    ["F/2", "This treats the tension as inversely proportional to ω; F = mω²r, so doubling ω quadruples the tension."],
    ["F/4", "This is the inverse of the correct factor: F = mω²r, so doubling ω multiplies the tension by 4, not ¼."],
  ],
  158: [
    ["Pair A", "Pair A shows the acceleration pointing down (tangent), but the centripetal acceleration points towards the centre, which at P is to the right."],
    ["Pair B", "Pair B shows the acceleration pointing up, but at P the acceleration points towards the centre, to the right."],
    ["Pair D", "Pair D shows the acceleration pointing to the left (away from the centre), but the centripetal acceleration points towards the centre, to the right."],
  ],
  159: [
    ["188 g", "This is the result of using the wrong torque balance (e.g. omitting m₂ or using the wrong distances); 150 × 49.0 + 100 × 30.0 = m₃ × 39.0 gives m₃ ≈ 265 g."],
    ["241 g", "This is the result of an arithmetic slip in the torque balance; 150 × 49.0 + 100 × 30.0 = 10 350, so m₃ = 10 350/39.0 ≈ 265 g."],
    ["506 g", "This is the result of using the wrong distances (e.g. r₃ = 20.5 cm instead of 39.0 cm); m₃ = 10 350/39.0 ≈ 265 g."],
  ],
  160: [
    ["0.000755 kg", "This is the result of a unit error (using grams as kg the wrong way) or a power-of-ten slip; the gradient gives m ≈ 0.0725 kg."],
    ["0.228 kg", "This is the result of using the wrong relationship (e.g. forgetting the 4π² or using r wrongly); gradient = 4π²rm/g gives m ≈ 0.0725 kg."],
    ["0.456 kg", "This is the result of using the wrong relationship (e.g. doubling the gradient or using the wrong radius); m ≈ 0.0725 kg."],
  ],
  161: [
    ["Angular speed and linear speed both increase from X to Z.", "The angular speed is the same for all points on the rigid blade; only the linear speed increases with distance from the hub."],
    ["Angular speed is constant, linear speed increases from Z to X.", "The linear speed increases towards the tip (Z), not towards the hub (X); v = ωr is larger at larger r."],
    ["Linear speed is constant, angular speed increases from X to Z.", "The linear speed is not constant (v = ωr increases with r), and the angular speed is the same everywhere on the blade."],
  ],
  162: [
    ["Decrease θ, increase μ", "Decreasing the bank angle reduces the horizontal component of the normal force, which lowers the cornering speed, not raises it."],
    ["Increase θ, decrease μ", "A smaller coefficient of friction allows a smaller friction force, which lowers the maximum cornering speed."],
    ["Decrease θ, decrease μ", "Both changes reduce the maximum cornering speed: a shallower bank and less friction both make the corner slower."],
  ],
  163: [
    ["Beam B", "τ = rF sin θ: B gives 0.6 × 5.3 ≈ 3.2 N m, which is less than A's 1.3 × 2.9 × sin 75° ≈ 3.6 N m."],
    ["Beam C", "τ = rF sin θ: C gives 2.0 × 3.4 × sin 30° = 3.4 N m, which is less than A's ≈ 3.6 N m."],
    ["Beam D", "τ = rF sin θ: D gives 1.0 × 4.2 × sin 45° ≈ 3.0 N m, which is less than A's ≈ 3.6 N m."],
  ],
  164: [
    ["11.97 N m", "This is the result of using the wrong angle (e.g. sin 20° instead of sin 70°) or the wrong distance; τ = 0.500 × 70.0 × sin 70° ≈ 32.89 N m."],
    ["1197.07 N m", "This is the result of a unit error (using 50.0 cm as 50.0 m); the distance is 0.500 m, giving τ ≈ 32.89 N m."],
    ["3289.92 N m", "This is the result of a unit error (using 50.0 cm as 50.0 m) combined with the correct angle; τ ≈ 32.89 N m."],
  ],
  165: [
    ["Kinetic energy 0.79 J; work done zero", "This is the kinetic energy for a different speed (e.g. v = 1.4 m s⁻¹); v = 2πr/T ≈ 0.785 m s⁻¹, so KE ≈ 0.25 J."],
    ["Kinetic energy 0.25 J; work done 0.63 J", "The kinetic energy is right, but the work done is not 0.63 J: the centripetal force is perpendicular to the velocity, so no work is done."],
    ["Kinetic energy 0.50 J; work done 1.58 J", "This is the result of using the wrong speed (e.g. v = 1.11 m s⁻¹) and assuming work is done; KE ≈ 0.25 J and the work is zero."],
  ],
  166: [
    ["There is no net force on the car as it is moving with uniform circular motion.", "Uniform circular motion still requires a net force — the centripetal force towards the centre; it is not zero."],
    ["The net force depends on the v, m, and r and is directed towards the west.", "The net force is directed towards the centre of the circle, which at the position shown is east, not west."],
    ["The net force will be the sum of the centripetal force and the gravitational force acting on the car.", "The centripetal force is the net force (the vector sum of all forces); it is not added to the gravitational force separately."],
  ],
  167: [
    ["N cos θ", "N cos θ is the vertical component of the normal force, which balances the weight; the centripetal force is the horizontal component, N sin θ."],
    ["mg sin θ", "mg sin θ is the component of the weight along the slope, not the centripetal force; the centripetal force comes from the normal force's horizontal component."],
    ["mg cos θ", "mg cos θ is the component of the weight perpendicular to the slope, not the centripetal force; the centripetal force is N sin θ."],
  ],
  168: [
    ["the force produced by the car engine acting on the wheels.", "The engine force acts along the direction of motion, not towards the centre of the bend, so it cannot provide the centripetal force."],
    ["the weight of the car.", "The weight acts vertically down, not horizontally towards the centre of the bend, so it cannot provide the centripetal force."],
    ["the force exerted by the driver on the steering wheel.", "The driver's force on the steering wheel is not a force on the car towards the centre; the centripetal force is the friction of the road on the tyres."],
  ],
  169: [
    ["F/4", "This is the result of using the wrong relationship (e.g. F ∝ r/KE); F = mv²/r = 2KE/r, so doubling KE and halving r multiplies F by 4."],
    ["F", "This accounts for only one of the two changes; doubling KE doubles F and halving r doubles it again, giving 4F."],
    ["2F", "This accounts for only one of the two changes (e.g. only the KE doubling); halving r also doubles the force, giving 4F."],
  ],
  170: [
    ["2r", "This is the height needed if the particle had no speed at the top of the loop; it must still have speed √(gr) there, so h = 2.5r."],
    ["3r", "This is the result of using the wrong energy balance (e.g. requiring v² = 2gr at the top); the minimum speed at the top is √(gr), giving h = 2.5r."],
    ["3.5r", "This is the result of using the wrong energy balance (e.g. v² = 3gr at the top); the minimum speed at the top is √(gr), giving h = 2.5r."],
  ],
  171: [
    ["10.0 N", "This is the result of using the wrong speed or radius (e.g. v = 7.0 m s⁻¹); T = mv²/r − mg = 0.20 × 8.2²/0.90 − 0.20 × 9.8 ≈ 13.0 N."],
    ["15.0 N", "This is the result of an arithmetic slip (e.g. adding mg instead of subtracting); at the top, T = mv²/r − mg ≈ 13.0 N."],
    ["17.0 N", "This is the result of an arithmetic slip (e.g. using the wrong speed or radius); T = mv²/r − mg ≈ 13.0 N."],
  ],
  172: [
    ["2.6°", "This is the result of a unit error (using v = 11 m s⁻¹ with r in km) or a power-of-ten slip; tan θ = 11²/(25.0 × 9.8) ≈ 0.494, so θ ≈ 26°."],
    ["10.0°", "This is the result of using the wrong relationship (e.g. tan θ = v²/g without r); tan θ = v²/(rg) ≈ 0.494, so θ ≈ 26°."],
    ["30.0°", "This is the result of using the wrong relationship (e.g. tan θ = v²/(2rg) or a slip); tan θ = 11²/(25.0 × 9.8) ≈ 0.494, so θ ≈ 26°."],
  ],
  173: [
    ["6.07 km h⁻¹", "This is the result of a unit error (using the speed in m s⁻¹ as km h⁻¹, or a power-of-ten slip); v = √(63 × 9.8 × tan 12°) ≈ 11.5 m s⁻¹ ≈ 41.2 km h⁻¹."],
    ["11.5 km h⁻¹", "This is the speed in m s⁻¹, not km h⁻¹; converting 11.5 m s⁻¹ gives about 41.2 km h⁻¹."],
    ["36.5 km h⁻¹", "This is the result of using the wrong relationship (e.g. tan θ = v²/(2rg) or a slip); v = √(rg tan θ) ≈ 41.2 km h⁻¹."],
  ],
  174: [
    ["Independent: hanging mass; dependent: length of string; controlled: mass of rubber stopper, rotational speed", "The student varies the rotational speed and measures the radius of the stopper's path, not the length of string; the hanging mass is kept steady, not varied."],
    ["Independent: rotational speed; dependent: length of string; controlled: hanging mass, rotational speed", "The dependent variable is the radius of the stopper's path, and the rotational speed cannot be both independent and controlled."],
    ["Independent: mass of rubber stopper; dependent: rotational speed; controlled: hanging mass, length of string", "The student does not vary the stopper's mass; the independent variable is the rotational speed and the dependent is the radius."],
  ],
  175: [
    ["80 m", "This is the result of using the wrong relationship (e.g. r ∝ v instead of r ∝ v²); doubling the speed needs 2² = 4 times the radius, 800 m."],
    ["400 m", "This is the result of using the wrong relationship (e.g. r ∝ v^1.5); the maximum sideways force is the same, so r ∝ v², giving 800 m."],
    ["600 m", "This is the result of using the wrong relationship (e.g. r ∝ v^1.6); r ∝ v², so doubling the speed gives 4 × 200 = 800 m."],
  ],
  176: [
    ["F and r", "F = mv²/r: with r on the axis, the graph would fall as 1/r, not rise as a parabola; the rising curve matches F against v (F ∝ v²)."],
    ["m and r", "The mass m is fixed in the experiment, so it cannot be the variable on either axis."],
    ["a and v/r", "a = v²/r, so a against v/r would be a straight line, not the upward-curving parabola shown."],
  ],
  177: [
    ["The normal force acting on the trolley is less than when travelling on a flat surface.", "At the bottom of the dip the normal force is greater than on a flat surface, because it must provide the upward centripetal force as well as balance the weight."],
    ["The centripetal force is equal to the normal force.", "The centripetal force is the net force (N − mg), not the normal force alone; the weight also acts."],
    ["None of the above are correct.", "The sum of the normal force and the gravitational force equals the centripetal force, so one of the statements is correct."],
  ],
  178: [
    ["2.9 N", "This is the result of using the wrong radius (e.g. r = 1.10 m instead of 1.10 cos 30° ≈ 0.953 m); F = mω²r ≈ 3.0 N."],
    ["3.3 N", "This is the result of using the wrong radius (e.g. r = 1.05 m instead of 0.953 m); F = mω²r ≈ 3.0 N."],
    ["3.5 N", "This is the result of using the wrong radius (e.g. r = 1.10 m instead of 0.953 m); F = mω²r ≈ 3.0 N."],
  ],
  179: [
    ["24.0 m s⁻²", "This is the result of using the wrong relationship (e.g. a = 4π²r/T without squaring T); a = 4π²r/T² ≈ 12.3 m s⁻²."],
    ["7.9 m s⁻²", "This is the result of using the wrong relationship (e.g. a = 2πr/T² or a slip); a = 4π²r/T² ≈ 12.3 m s⁻²."],
    ["8.0 m s⁻²", "This is the result of using the wrong relationship (e.g. a = 2πr/T or a slip); a = 4π²r/T² ≈ 12.3 m s⁻²."],
  ],
  180: [
    ["0.81v", "This is the result of using the wrong relationship (e.g. v ∝ 1/√m the wrong way); the same force gives m v² constant, so v_B = v√(m_A/m_B) = v√1.5 ≈ 1.2v."],
    ["1.5v", "This treats the speed as proportional to the mass ratio directly; the same force gives m v² constant, so v ∝ 1/√m, giving 1.2v."],
    ["2.25v", "This uses the mass ratio squared (1.5² = 2.25); the same force gives m v² constant, so v_B = v√1.5 ≈ 1.2v."],
  ],
};
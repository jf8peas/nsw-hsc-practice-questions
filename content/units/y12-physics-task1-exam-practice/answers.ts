import type { Answer, AnswerSet } from "@/lib/types";

// Answer key for y12-physics-task1-exam-practice. NO "server-only" import here
// (the validator reads it); only re-exported via content/answers/index.ts, which is
// server-only. Never import from a client component.
//
// Written alongside the 2027 Task 1 practice papers (A, B, C) and their marking guidelines.
// Every number was checked by calculation.

const U = "y12-physics-task1-exam-practice";
const p2 = (n: number) => String(n).padStart(2, "0");

function sa(n: number, modelAnswer: string, rubric: string[], notes: string): [string, Answer] {
  return [`${U}.s${p2(n)}`, { modelAnswer, rubric, notes }];
}

const answerList: Array<[string, Answer]> = [
  sa(1,
    "Average = (19.86 + 20.02) ÷ 2 = 19.94 s\nT = 19.94 ÷ 20 = 0.997 s\nv = 2πr ÷ T = (2 × π × 0.800) ÷ 0.997 = 5.04 m s⁻¹\nv² = 25.4 m² s⁻²",
    [
      "Calculates the average time (19.94 s) and the period T = 0.997 s.",
      "Calculates v = 2πr/T = 5.04 m s⁻¹.",
      "Calculates v² = 25.4 m² s⁻² (with units on the answers).",
    ],
    "Allow small rounding differences (v 5.03–5.05, v² 25.3–25.5). Carry forward an error in T for marks 2 and 3. Do not award mark 1 if the time is not divided by 20."),

  sa(2,
    "The 17.98 s trial at 0.700 m is anomalous. It is about 1 s (one period) shorter than the other trial, while every other pair agrees within 0.15 s, and it is barely longer than the 0.600 m average (17.40 s), whereas 18.95 s fits the trend between 17.40 s and 20.21 s. It was probably a miscount of revolutions, so it should be excluded from the average (or the trial repeated).",
    [
      "Identifies the 17.98 s trial at 0.700 m as anomalous, with a reason based on the data (does not fit the trend / differs by about one period).",
      "States that it should be excluded from the average or the trial repeated.",
    ],
    "Do not credit identifying 18.95 s. Averaging both trials earns mark 1 at most if the anomaly is correctly identified."),

  sa(3,
    "gradient = (32.0 − 12.6) ÷ (1.00 − 0.40) = 19.4 ÷ 0.60 = 32.3 m s⁻²",
    [
      "Uses rise over run correctly with the two points.",
      "Gets 32.3 with correct units (m s⁻², or m² s⁻² m⁻¹).",
    ],
    "Accept 32 or 32.3. Units are required for mark 2: m s⁻² or m² s⁻² m⁻¹. Do not accept m² s⁻²."),

  sa(4,
    "F_c = Mg and F_c = mv²/r, so mv²/r = Mg, giving v² = (Mg/m) r. The graph of v² against r has gradient Mg/m.\nm = Mg ÷ gradient = (0.0500 × 9.8) ÷ 30.5 = 0.0161 kg = 16.1 g",
    [
      "Equates mv²/r with Mg.",
      "Rearranges to v² = (Mg/m) r, so gradient = Mg/m.",
      "Calculates m = 0.0161 kg = 16.1 g.",
    ],
    "Accept 16 g. Using 50.0 instead of 0.0500 kg loses mark 3 unless converted correctly at the end."),

  sa(5,
    "v² = (F_c/m) r, so gradient = F_c/m and F_c = m × gradient = 0.0250 × 36.8 = 0.920 N.\nWeight of the mass carrier = 0.100 × 9.8 = 0.98 N.\nPercentage error = |0.920 − 0.98| ÷ 0.98 × 100 = 6.1%",
    [
      "States or uses gradient = F_c/m (F_c = m × gradient).",
      "Calculates F_c = 0.92 N.",
      "Calculates the percentage error ≈ 6% with 0.98 N as the accepted value.",
    ],
    "Accept 6.1% or 6%. Using the mass carrier (0.100 kg) as m loses mark 2. Dividing by the experimental value in the percentage error loses mark 3."),

  sa(6,
    "mv²/r = Mg, so v² = (Mg/m) r and gradient = Mg/m.\ng = m × gradient ÷ M = (0.0200 × 31.6) ÷ 0.0700 = 9.03 m s⁻²\nPercentage error = |9.03 − 9.8| ÷ 9.8 × 100 = 7.9%",
    [
      "Rearranges to g = m × gradient ÷ M.",
      "Calculates g = 9.03 m s⁻².",
      "Calculates the percentage error = 7.9% (accept 8%).",
    ],
    "Swapping m and M gives about 110 m s⁻²: no marks for marks 2 and 3. Carry forward an incorrect g into mark 3."),

  sa(7,
    "The model mv²/r = Mg gives v² = (Mg/m) r, so v² is directly proportional to r. A graph of v² against r should be a straight line through the origin, which is easy to test and whose gradient (Mg/m) can be used in calculations. A graph of v against r would be a curve (v ∝ √r), which is hard to judge by eye.",
    [
      "States that the model predicts v² ∝ r (v² = (Mg/m) r).",
      "Explains that plotting v² gives a straight line that can be tested and whose gradient can be used, whereas v against r is a curve.",
    ],
    "Accept “linearises the data” with a reason for mark 2."),

  sa(8,
    "As the radius increases, the tangential velocity increases. The increase is not proportional: doubling r from 0.500 m to 1.000 m increases v by only a factor of about 1.4 (√2), because v² (not v) is proportional to r.",
    [
      "States that v increases as r increases.",
      "States that the relationship is not linear / v increases by less than r does (v² ∝ r, v ∝ √r).",
    ],
    "Do not credit “the graph is a straight line” on its own: the question asks about r and v."),

  sa(9,
    "The reaction time in starting and stopping the stopwatch (about 0.2 s) is roughly the same however long the interval timed. For one revolution (about 1 s) it is about 20% of the measurement, but for 20 revolutions (about 20 s) it is about 1%. Dividing by 20 gives a more accurate period. It also averages out small changes in speed between revolutions.",
    [
      "Identifies that it reduces the effect of reaction time (human timing error).",
      "Explains that the fixed reaction-time error becomes a much smaller percentage of the measured time, improving accuracy.",
    ],
    "A numerical comparison is not required for mark 2 if the reasoning is clear."),

  sa(10,
    "The results are mostly reliable. At five radii the two trials agree within 0.15 s (under 1%), so repeated measurements are consistent. At 0.800 m the trials differ by about 1 s (one period), so one is anomalous (probably a miscount) and only one valid trial remains. With only two trials per radius, reliability is limited; at least three to five trials would allow anomalies to be identified with confidence.",
    [
      "Makes a judgement about reliability.",
      "Supports it with the closeness of the repeated trials at most radii.",
      "Refers to the inconsistent trials at 0.800 m and/or the small number of trials.",
    ],
    "Do not credit statements about accuracy (closeness to an accepted value) as reliability."),

  sa(11,
    "The investigation is moderately valid. Only the radius was changed, while the stopper, the mass carrier (centripetal force) and the string were kept the same, so it fairly tests how r affects v, and the straight-line v² against r graph tests the hypothesis directly. However, the radius can change if the paperclip drifts, the string sags below horizontal, and friction at the glass tube means the centripetal force is not exactly Mg, so the conditions assumed by the model are not fully met.",
    [
      "Makes a judgement about validity.",
      "Explains that only the independent variable (r) was changed with the others controlled.",
      "Identifies a factor that limits validity (e.g. friction at the tube, drifting radius, sagging string).",
    ],
    "Do not credit repetition or number of trials as validity (that is reliability)."),

  sa(12,
    "Friction between the string and the rim of the glass tube supports part of the mass carrier's weight, so the tension acting on the stopper (the centripetal force) is less than Mg. The stopper therefore travels more slowly at each radius, giving a smaller gradient than Mg/m. Since m = Mg ÷ gradient, a smaller gradient gives a calculated mass that is too large. The effect is in the same direction every trial, so it is systematic.",
    [
      "Identifies a valid systematic error (e.g. friction at the tube).",
      "Explains that the actual centripetal force is less than Mg, so the speed/gradient is smaller.",
      "Links the smaller gradient to the calculated mass being too large (m = Mg ÷ gradient).",
    ],
    "Also accept the mass carrier moving downward during timing (tension < Mg), with the same chain of reasoning. Reaction time is random, not systematic: no mark 1."),

  sa(13,
    "Film each trial in slow motion and find the time for 20 revolutions from the video's timestamps (or use a light gate). This removes human reaction time from starting and stopping the stopwatch, so the period, and hence v and the gradient, are closer to their true values.",
    [
      "Suggests a valid improvement that is practical in a school laboratory.",
      "Explains how it makes the measurements closer to their true values (more accurate).",
    ],
    "Also accept timing more revolutions (e.g. 40) to reduce the percentage effect of reaction time. Repeating trials improves reliability, not accuracy: no marks unless linked to accuracy."),

  sa(14,
    "Random errors vary unpredictably from trial to trial. Example: reaction time when starting and stopping the stopwatch. They scatter the points above and below the line of best fit. Systematic errors shift every result in the same direction. Example: friction at the glass tube making the tension less than Mg. They change the gradient (make it smaller) or the intercept without scattering the points.",
    [
      "Distinguishes random (unpredictable, varies each trial) from systematic (consistent, same direction) errors.",
      "Gives a valid example of each from this practical.",
      "Describes the effect of each on the graph (scatter about the line vs a shifted gradient or intercept).",
    ],
    "Accept a drifting radius as random or systematic if the student explains why."),

  sa(15,
    "v² = 32.0 × 1.20 = 38.4 m² s⁻², so v = √38.4 = 6.20 m s⁻¹.\nThe prediction is less reliable because 1.20 m lies outside the range of the data (extrapolation); the relationship has not been tested there, and the stopper may be harder to keep steady at that radius.",
    [
      "Calculates v = 6.2 m s⁻¹.",
      "States that it is an extrapolation beyond the data range, so it is less reliable.",
    ],
    "Forgetting the square root (38.4) loses mark 1."),

  sa(16,
    "Fix the paperclip so the radius stays constant (e.g. 0.800 m). Vary the centripetal force by adding slotted masses to the mass carrier, so F = Mg for M = 20 g to 100 g. For each force, time 20 revolutions (at least two trials) and calculate v = 2πr/T. Control the radius, the stopper and the string, and keep the circle horizontal. Plot F against v²: theory (F = mv²/r) predicts a straight line through the origin with gradient m/r.",
    [
      "Describes varying the hanging mass (force) while keeping the radius constant.",
      "Identifies controlled variables (radius, stopper mass, string).",
      "Identifies a suitable graph: F against v², a straight line through the origin.",
    ],
    "Accept v² against F (gradient r/m)."),

  sa(17,
    "u_y = 20.0 sin 35° = 11.47 m s⁻¹, u_x = 20.0 cos 35° = 16.38 m s⁻¹.\nMaximum height above the platform: 0 = 11.47² − 2(9.8)Δy, so Δy = 6.71 m. Height above the ground = 15.0 + 6.71 = 21.7 m.\nTime of flight: −15.0 = 11.47t − 4.9t², so t = 3.28 s (positive root).\nRange = 16.38 × 3.28 = 53.7 m.",
    [
      "Resolves the velocity: u_y = 11.5 m s⁻¹ and u_x = 16.4 m s⁻¹.",
      "Calculates the maximum height above the ground = 21.7 m.",
      "Calculates the time of flight = 3.28 s from Δy = −15.0 m.",
      "Calculates the horizontal distance = 53.7 m.",
    ],
    "Height above the platform only (6.7 m) loses mark 2. Using the level-ground range formula loses marks 3 and 4."),

  sa(18,
    "Height: Δy = ½gt² = ½ × 9.8 × 2.50² = 30.6 m.\nv_x = 12.0 m s⁻¹; v_y = 9.8 × 2.50 = 24.5 m s⁻¹ downwards.\nv = √(12.0² + 24.5²) = 27.3 m s⁻¹\nθ = tan⁻¹(24.5 ÷ 12.0) = 63.9° below the horizontal.",
    [
      "Calculates the height of the cliff = 30.6 m.",
      "Calculates the vertical velocity at impact = 24.5 m s⁻¹.",
      "Calculates the speed at impact = 27.3 m s⁻¹.",
      "Gives the direction: 63.9° below the horizontal.",
    ],
    "Accept 64°. Mark 4 needs the direction referenced (below the horizontal, or 26° from the vertical)."),

  sa(19,
    "u_x = u_y = 18.0 cos 45° = 12.73 m s⁻¹.\nMaximum height: 0 = 12.73² − 2(9.8)Δy, so Δy = 8.27 m.\nTime to reach the fence: t = 25.0 ÷ 12.73 = 1.96 s.\nHeight at the fence: Δy = 12.73 × 1.96 − 4.9 × 1.96² = 6.1 m.\nSince 6.1 m > 2.5 m, the ball passes over the fence.",
    [
      "Calculates the maximum height = 8.27 m.",
      "Calculates the time to reach the fence = 1.96 s.",
      "Calculates the height of the ball at the fence ≈ 6.1 m.",
      "Concludes correctly that it passes over the fence.",
    ],
    "Comparing the maximum height with the fence height earns no mark 4: the height at the fence is needed."),

  sa(20,
    "Vertical: u_y = 0, so 1.25 = ½ × 9.8 × t², giving t = √(2 × 1.25 ÷ 9.8) = 0.505 s.\nHorizontal: u_x = Δx ÷ t = 2.00 ÷ 0.505 = 3.96 m s⁻¹.",
    [
      "States or uses that the initial vertical velocity is zero.",
      "Calculates the time of flight = 0.505 s.",
      "Calculates the launch speed = 3.96 m s⁻¹.",
    ],
    "Accept 0.51 s and 4.0 m s⁻¹."),

  sa(21,
    "Their ranges are equal, because complementary angles (30° and 60°) give the same range at the same launch speed. The 60° ball is in the air for longer, because it has the larger vertical component of velocity (u sin 60° > u sin 30°), so it takes longer to rise and fall.",
    [
      "States that the ranges are equal.",
      "States that the 60° ball has the longer time of flight because of its larger vertical velocity component.",
    ],
    "Mark 2 requires the reason (vertical component)."),

  sa(22,
    "Air resistance acts against the motion, so the horizontal velocity decreases during the flight and the projectile does not rise as high. As a result, the range is shorter and the path is not symmetrical: the descent is steeper than the ascent.",
    [
      "States that the range (and maximum height) is reduced.",
      "States that the path is no longer symmetrical / the descent is steeper.",
    ],
    "Accept “the horizontal velocity decreases” as part of mark 1's reasoning."),

  sa(23,
    "Horizontal: no force acts horizontally, so the horizontal velocity is constant (zero acceleration). Vertical: the only force is gravity, so the vertical acceleration is constant at 9.8 m s⁻² downwards. Because the forces act independently along each axis, each component can be analysed separately, linked only by time.",
    [
      "States that the horizontal velocity is constant because there is no horizontal force.",
      "States that the vertical acceleration is constant at g (9.8 m s⁻² downwards) because gravity is the only force.",
    ],
    "Mark 1 or 2 needs the reason (no horizontal force / gravity only), not just the assumption."),

  sa(24,
    "Friction provides the centripetal force: mv²/r = F_f.\nv = √(F_f r ÷ m) = √(9000 × 60 ÷ 1500) = √360 = 19.0 m s⁻¹",
    [
      "Equates the friction force with mv²/r.",
      "Calculates v = 19.0 m s⁻¹.",
    ],
    "Including the weight (mg) in the force earns no marks: on a flat bend only friction acts towards the centre."),

  sa(25,
    "T = 1 ÷ 2.0 = 0.50 s\nv = 2πr ÷ T = (2 × π × 0.60) ÷ 0.50 = 7.54 m s⁻¹\nF_T = mv² ÷ r = 0.15 × 7.54² ÷ 0.60 = 14.2 N",
    [
      "Calculates the period T = 0.50 s.",
      "Calculates the speed v = 7.54 m s⁻¹.",
      "Calculates the tension = 14 N.",
    ],
    "Using 2.0 s as the period loses mark 1 (carry forward for marks 2 and 3). Accept the ω method: ω = 4π = 12.6 rad s⁻¹, F = mω²r."),

  sa(26,
    "ω = 900 × 2π ÷ 60 = 94.2 rad s⁻¹\na_c = ω²r = 94.2² × 0.30 = 2.66 × 10³ m s⁻² (or v = ωr = 28.3 m s⁻¹, a_c = v²/r)",
    [
      "Calculates ω = 94 rad s⁻¹.",
      "Calculates a_c = 2.7 × 10³ m s⁻².",
    ],
    "Forgetting to convert from minutes to seconds loses mark 1 (carry forward for mark 2)."),

  sa(27,
    "The centripetal force always acts towards the centre, perpendicular to the object's velocity (its displacement at each instant). Work done = Fs cos θ with θ = 90°, so the work done is zero. With no work done, the kinetic energy (and so the speed) stays constant.",
    [
      "States that the force is perpendicular to the velocity/displacement, so W = Fs cos 90° = 0.",
      "States that the kinetic energy (speed) therefore stays constant.",
    ],
    "Do not credit “because there is no net force”: there is a net (centripetal) force."),

  sa(28,
    "It moves in a straight line along the tangent to the circle at the point where the string broke. Once the string breaks there is no centripetal force, so (by Newton's first law) the stopper continues with the velocity it had at that instant, which is tangential.",
    [
      "States that it moves along the tangent at the point of release (not outwards).",
      "Explains that there is no longer a centripetal force, so it continues with its instantaneous (tangential) velocity.",
    ],
    "No marks for “flies outwards” or “away from the centre”."),

  sa(29,
    "Place the launcher on the floor so the ball lands at its launch height. Set launch angles of 15°, 25°, 35°, 40°, 45°, 50°, 55°, 65° and 75° with the protractor (independent variable). Use the same spring setting and the same ball every time, so the launch speed is constant. Tape carbon paper where the ball lands and measure the range from the launch point to the mark (dependent variable). Do five trials at each angle and average them. Plot average range against angle: the claim is supported if the maximum is at 45° and complementary angles (e.g. 30° and 60°) give equal ranges.",
    [
      "Identifies the independent variable (launch angle) with a suitable range of values, including angles close to 45°.",
      "Controls the launch speed (same spring setting) and the launch/landing height.",
      "Includes repetition and averaging, with an accurate range measurement (carbon paper and tape).",
      "Describes analysis that tests the claim (range against angle graph, maximum at 45°).",
    ],
    "Award marks independently. Any sensible set of angles including values either side of 45° is acceptable for mark 1."),

  sa(30,
    "Mount the camera on a tripod perpendicular to the plane of motion, far enough away to reduce parallax, with a metre ruler in the plane of motion as a scale. Film a dense ball at a high frame rate. In video-analysis software, set the scale and mark the ball's position in each frame to get x and y against t. A straight-line x–t graph shows constant horizontal velocity. A straight-line v_y–t graph shows constant vertical acceleration, and its gradient should be about −9.8 m s⁻². Repeat for several launches.",
    [
      "Describes a valid camera set-up (perpendicular to the motion, with a scale in the plane of motion).",
      "Describes extracting position–time data frame by frame.",
      "Explains testing constant horizontal velocity (straight x–t graph).",
      "Explains testing vertical acceleration (straight v_y–t graph with gradient ≈ −9.8 m s⁻², or fitting the y–t parabola).",
    ],
    "Accept any equivalent analysis (e.g. calculating v_x between frames and showing it is constant)."),

  sa(31,
    "Theoretical times t = √(2h/g): 0.20, 0.29, 0.35, 0.40 and 0.45 s. Every measured time is about 0.05 s longer (10–25%), so the results are not accurate, with a consistent (systematic) error, most likely reaction time in stopping the stopwatch. Reliability cannot be established, because only one trial was done at each height, so the consistency of the measurements cannot be checked.",
    [
      "Calculates the theoretical times using t = √(2h/g).",
      "Judges the accuracy, identifying the consistent (systematic) difference of about 0.05 s.",
      "Judges the reliability as unknown or low because only one trial was done at each height.",
    ],
    "Mark 2 needs a judgement about accuracy supported by the comparison."),

  sa(32,
    "The mean range is 1.49 m, about 9% less than the predicted 1.63 m, so the results are not very accurate. The three trials agree within 0.04 m, so they are reliable. Every trial is low by a similar amount, so the difference is systematic, most likely air resistance reducing the horizontal velocity, which the prediction ignores.",
    [
      "Judges accuracy using the data (mean ≈ 1.49 m, about 9% below the prediction).",
      "Judges reliability using the close agreement of the trials.",
      "Gives a plausible systematic cause (e.g. air resistance, launch speed overestimated, angle not exactly 45°).",
    ],
    "Mark 3 requires an explanation consistent with the measured range being lower than predicted."),

  sa(33,
    "Place the coin at several distances from the centre (e.g. 4 cm to 14 cm). Slowly increase the rotation rate until the coin slides, recording with a phone video so the period just before sliding can be found from the frames (ω = 2π/T). Control the coin, the turntable surface (clean and dry) and how quickly the speed is increased. Repeat three times at each distance and average. Friction provides the centripetal force: F_max = mω²r, so ω² ∝ 1/r. Plot ω² against 1/r: it should be a straight line through the origin.",
    [
      "Describes varying r and measuring the angular velocity at which the coin slides.",
      "Identifies controlled variables and includes repetition.",
      "Describes appropriate analysis: ω² against 1/r gives a straight line (F_max = mω²r).",
    ],
    "Accept plotting ω²r (constant) or v² against r for mark 3 if justified."),

  sa(34,
    "The method has low accuracy and reliability. Hand-timing a 0.50 s interval gives a large percentage error from reaction time (about 20%). The ball slows as it crosses the bench, so its average speed over the last metre is greater than its speed at the edge, which explains why the prediction (0.86 m) is greater than the measurement (0.78 m). Judging the landing point by eye in one trial is imprecise and does not allow reliability to be checked. Improvements: measure the launch speed with a light gate at the edge of the bench; mark the landing point with carbon paper and repeat at least five trials, then average.",
    [
      "Makes a judgement on the method supported by a weakness in measuring the launch speed (reaction time and/or the ball slowing).",
      "Identifies a weakness in measuring the landing point or in the single trial.",
      "Recommends two improvements linked to the weaknesses.",
    ],
    "Mark 3 needs two improvements."),

  sa(35,
    "F_c = mv²/r, so at constant m and r the force is proportional to v². Doubling v multiplies v² by 4, so the centripetal force must be four times larger. Since the centripetal force is provided by the weight of the mass carrier (F = Mg), the mass of the mass carrier must be quadrupled.",
    [
      "States that the centripetal force must increase by a factor of 4 (F ∝ v²).",
      "States that the mass carrier's mass must be multiplied by 4 (F = Mg).",
    ],
    "No marks for “doubled”."),
];

export const answers: AnswerSet = Object.fromEntries(answerList);

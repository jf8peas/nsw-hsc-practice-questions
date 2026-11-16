import type { Answer, AnswerSet } from "@/lib/types";

// Answer key for y12-physics-task1-exam-practice. NO "server-only" import here
// (the validator reads it); only re-exported via content/answers/index.ts, which is
// server-only. Never import from a client component.
//
// Questions s36–s72 target six misunderstandings (see ./questions.ts). The marking notes
// deliberately withhold marks for naming an error or a term without the reasoning: the
// student this unit was written for can name errors but does not trace them.
// Every number was checked by calculation.

const U = "y12-physics-task1-exam-practice";
const p2 = (n: number) => String(n).padStart(2, "0");

function sa(n: number, modelAnswer: string, rubric: string[], notes: string): [string, Answer] {
  return [`${U}.s${p2(n)}`, { modelAnswer, rubric, notes }];
}

const TRACE_NOTE =
  "Each mark needs the reasoning, not just the name of the error: naming the error and its type with no effect earns at most 1 mark. The direction of the effect on the final result must be stated and correct.";

const answerList: Array<[string, Answer]> = [
  // ---- trace ----
  sa(36,
    "Friction is a systematic error. Friction at the rim of the tube supports part of the mass carrier's weight, so the tension pulling the stopper inward is less than Mg. With a smaller centripetal force, the stopper moves more slowly at every radius, so each v² is smaller and the gradient (v²/r) is smaller. Since g = m × gradient ÷ M, the calculated g is too low. Friction acts the same way in every trial, so it pushes g in one direction (low), which is why it is systematic.",
    [
      "Identifies friction as a systematic error (acts the same way every trial).",
      "Traces the chain: tension on the stopper less than Mg, so the stopper is slower, v² smaller and the gradient smaller.",
      "States that the calculated g is too low (because g = m × gradient ÷ M).",
    ],
    `${TRACE_NOTE} Award no mark 3 for “friction does not affect g” or “g is too high”. Mark 2 needs at least: less force on the stopper → smaller speed/v² → smaller gradient.`),

  sa(37,
    "Reaction time is a random error. Sometimes the stopwatch is started or stopped late and sometimes early, so some measured times are too long and others too short. This makes some periods too long and some too short, so the points scatter above and below the line of best fit. It does not push g consistently up or down; it makes g less certain. Timing 20 revolutions and averaging trials reduces its effect, because the high and low errors partly cancel.",
    [
      "Identifies reaction time as a random error.",
      "Explains that it makes some times too long and some too short, scattering the points about the line.",
      "States that it does not consistently raise or lower g (it makes g less certain), and averaging reduces it.",
    ],
    `${TRACE_NOTE} Award no mark 3 for “reaction time increases g” or “decreases g”: a random error does not push the result one way. Accept “the gradient is less certain” for the effect on g.`),

  sa(38,
    "This is a systematic error: every recorded time is for 19 revolutions, not 20, so every period T is too small (by 5%). Since v = 2πr/T, every calculated v is too large (by about 5%), so every v² is too large (by about 11%) and the gradient is too large. Since g = m × gradient ÷ M, the calculated g is too high (by about 11%).",
    [
      "Identifies a systematic error (the same miscount in every trial).",
      "Traces the chain: T too small → v and v² too large → gradient too large.",
      "States that the calculated g is too high.",
    ],
    `${TRACE_NOTE} Award no mark 3 for “g too low”. The percentage is not required.`),

  sa(39,
    "This is a systematic error: the same wrong mass is used in the calculation. g = m × gradient ÷ M, so g is proportional to the stopper's mass. Using 20.0 g instead of 22.0 g makes the calculated g too low by about (22.0 − 20.0) ÷ 22.0 ≈ 9%. (With the true mass, a gradient of 31.6 m s⁻² gives 9.93 m s⁻² instead of 9.03 m s⁻².)",
    [
      "Identifies it as a systematic error (the same incorrect value used every time).",
      "Explains that g = m × gradient ÷ M, so a smaller m gives a smaller g.",
      "States that g is too low by about 9%.",
    ],
    `${TRACE_NOTE} Accept 9–10% for mark 3. The gradient is not affected by the mass label, because the stopper itself is unchanged.`),

  sa(40,
    "This is a systematic error: every length is too short by the same amount. T² = (4π²/g)L, so with every L too short each point on the T² against L graph is shifted left by the same amount. The line of best fit is shifted sideways (it no longer passes through the origin), but its gradient is unchanged. Because g = 4π² ÷ gradient, the calculated g is unaffected. (If g were calculated from a single reading using g = 4π²L/T², it would be too low.) This is a strength of finding g from a gradient: a constant offset only changes the intercept.",
    [
      "Identifies a systematic error (every L too short by the same amount).",
      "Explains the effect on the graph: every point shifts left by the same amount, so the line has a non-zero intercept but the same gradient.",
      "States that g calculated from the gradient is unaffected (only the intercept changes).",
    ],
    `${TRACE_NOTE} Award no mark 3 for “g too high”. Award mark 3 for “g too low” only if the student explicitly calculates g from individual readings rather than from the gradient.`),

  sa(41,
    "The statement is incorrect. Reaction time is a random error: sometimes the student is late starting the stopwatch (time too short) and sometimes late stopping it (time too long), so some periods are too short and some too long. This scatters the points either side of the line of best fit. It does not push g consistently upwards, so it cannot explain a value that is too high. A one-sided error in g points to a systematic error (or a calculation or formula error) instead.",
    [
      "Judges the statement incorrect.",
      "Explains that reaction time is random: it makes some times too long and some too short, scattering the points.",
      "Explains that a random error does not shift g in one direction, so a high g needs a systematic (or calculation) cause.",
    ],
    "Award no marks for agreeing with the statement. Mark 3 needs the link between a one-sided result and a systematic cause."),

  sa(42,
    "This is a systematic error: every range is measured 5 cm too short. For a launch from the floor, R = u² sin 2θ ÷ g, so u = √(Rg ÷ sin 2θ). Using a range that is too short in every trial gives a calculated launch speed that is too low, in every trial.",
    [
      "Identifies a systematic error (every range too short by 5 cm).",
      "Explains that the calculated speed depends on the range (u = √(Rg ÷ sin 2θ)), so a smaller R gives a smaller u.",
      "States that the calculated launch speed is too low.",
    ],
    `${TRACE_NOTE} Accept R ∝ u² or an equivalent argument for mark 2.`),

  sa(43,
    "Friction is a systematic error. It supports part of the mass carrier's weight, so the tension on the stopper is less than Mg. The stopper therefore moves more slowly at every radius, so v² and the gradient are smaller than they should be. Here m = Mg ÷ gradient, so a smaller gradient gives a larger calculated mass: the stopper's mass comes out too high.",
    [
      "Identifies friction as a systematic error.",
      "Traces the chain: tension less than Mg → stopper slower → v² and gradient smaller.",
      "States that the calculated mass is too high, because the gradient is in the denominator (m = Mg ÷ gradient).",
    ],
    `${TRACE_NOTE} Award no mark 3 for “the mass is too low”: the student must follow the gradient through a formula where it is in the denominator.`),

  // ---- arv ----
  sa(44,
    "Accuracy is how close a result is to the accepted (true) value, e.g. how close the experimental g is to 9.8 m s⁻². Reliability is how consistent repeated measurements are, e.g. how closely the two trials of the time for 20 revolutions at the same radius agree. Validity is whether the experiment actually tests the aim fairly, e.g. only the radius is changed while the stopper and mass carrier are kept the same, and r is measured to the centre of the stopper.",
    [
      "Defines accuracy (closeness to the accepted value) with a relevant example.",
      "Defines reliability (consistency of repeated trials) with a relevant example.",
      "Defines validity (fairly tests the aim, with variables controlled) with a relevant example.",
    ],
    "Each mark needs both the definition and an example from this practical. Do not credit “reliability means many trials”: reliability is about agreement between trials."),

  sa(45,
    "The statement is not justified. Reliability is about how closely repeated trials of the same measurement agree, so it is judged by comparing the trials at each radius, not by the line of best fit. Points close to a line show little random scatter, but a systematic error (such as friction at the tube) can give points that lie neatly on a line while all being wrong.",
    [
      "States that reliability is judged by the agreement between repeated trials (not closeness to the line).",
      "Explains that points can lie close to a line yet be affected by a systematic error (so closeness to the line does not show reliability or accuracy).",
    ],
    "Accept “closeness to the line shows small random error” as part of mark 2 only if the student also says reliability needs the repeated trials."),

  sa(46,
    "Each trial has random error: some measurements come out a little too high and others a little too low. When several trials are averaged, the high and low errors partly cancel, so the average is closer to the true value and repeat averages agree more closely, which is why the results are more reliable. Averaging does not fix systematic errors such as friction at the tube: these push every trial the same way, so they do not cancel and the average is still wrong.",
    [
      "States that random errors make some trials too high and some too low.",
      "Explains that averaging lets these errors partly cancel, so the average is more consistent (reliable).",
      "States that averaging does not remove systematic errors, which shift every trial the same way.",
    ],
    "Award no marks for “a larger data set” or “more data is better” on its own: the cancelling of random errors is the key idea."),

  sa(47,
    "The claim is incorrect. Reliability is judged by how closely repeated trials agree, not by how many there are. Student A's trials spread over 1.5 s (19.4 s to 20.9 s), while Student B's agree within 0.04 s, so Student B's results are more reliable.",
    [
      "States that reliability depends on how closely the trials agree, not on how many trials there are.",
      "Uses the data to conclude that Student B's results are more reliable (0.04 s spread vs 1.5 s spread).",
    ],
    "Mark 2 needs the data comparison."),

  sa(48,
    "(i) A light gate mainly improves accuracy: it removes human reaction time, so each measured time is closer to the true time. (ii) A smoother tube improves accuracy: it reduces friction, a systematic error that makes the tension less than Mg, so results are closer to the true value. (iii) More trials improve reliability: random errors push some trials high and some low, so averaging more trials makes the averages more consistent. It does not fix systematic errors.",
    [
      "(i) Light gate: accuracy, because it removes reaction time from the timing.",
      "(ii) Smoother tube: accuracy, because it reduces the systematic friction error.",
      "(iii) More trials: reliability, because averaging lets random errors cancel.",
    ],
    "For (i), also accept “reliability” if the student explains that removing reaction time reduces random scatter between trials. For (ii), do not accept “reliability”. Each mark needs the reason."),

  sa(49,
    "Reaction time is a random error, so it affects the reliability (and accuracy) of the measured times, not validity. Validity is whether the experiment fairly tests the aim: whether only the radius is changed while the other variables are controlled, and whether the assumptions of the model hold. A factor that affects validity is friction at the tube, which means the tension on the stopper is not equal to Mg, so the model mv²/r = Mg being tested does not fully apply. (Also: the radius changing during a trial if the paperclip drifts; the stopper not moving in a horizontal circle.)",
    [
      "States that reaction time is a random error affecting reliability/accuracy, not validity.",
      "States what validity means (fairly tests the aim / variables controlled / model assumptions hold).",
      "Identifies a genuine validity factor with a reason (e.g. friction so the tension is not Mg, a drifting radius).",
    ],
    "Do not credit reaction time, number of trials, or human error as the validity factor."),

  sa(50,
    "Comparing g with the accepted value shows accuracy, not reliability: 9.6 m s⁻² is within about 2% of 9.8 m s⁻², so the result is accurate. To judge reliability, the student would need to look at how closely the repeated trials at each radius agreed (or whether repeating the whole experiment gives a similar g).",
    [
      "States that the comparison shows accuracy (closeness to the accepted value), not reliability.",
      "States that reliability is judged by how closely repeated trials (or repeated values of g) agree.",
    ],
    "A percentage error (about 2%) is not required."),

  // ---- gradient ----
  sa(51,
    "mv²/r = Mg, so v² = (Mg/m) × r. This has the form y = (gradient) × x with y = v² and x = r, so gradient = Mg/m.\nRearranging: g = m × gradient ÷ M = (0.0200 × 31.6) ÷ 0.0700 = 9.03 m s⁻²",
    [
      "Rearranges to v² = (Mg/m) r and identifies gradient = Mg/m.",
      "Derives g = m × gradient ÷ M.",
      "Calculates g = 9.03 m s⁻².",
    ],
    "Mark 1 requires showing that the gradient equals Mg/m from the rearranged model; writing a formula for g without this earns no mark 1. Substituting 31.6 into g = mv²/(Mr) without identifying v²/r as the gradient earns no mark 1. Swapping m and M (about 110 m s⁻²) earns no mark 3."),

  sa(52,
    "T = 2π√(L/g), so T² = 4π²L/g = (4π²/g) × L. This has the form y = (gradient) × x with y = T² and x = L, so gradient = 4π²/g.\nRearranging: g = 4π² ÷ gradient = 39.48 ÷ 4.10 = 9.63 m s⁻²",
    [
      "Squares and rearranges to T² = (4π²/g) L, identifying gradient = 4π²/g.",
      "Derives g = 4π² ÷ gradient.",
      "Calculates g = 9.63 m s⁻².",
    ],
    "Award no marks 2 or 3 for g = 4π² × gradient (which gives about 162 m s⁻²)."),

  sa(53,
    "T² = 4π²L/g, so L = (g/4π²) × T². This has the form y = (gradient) × x with y = L and x = T², so gradient = g/4π².\nRearranging: g = 4π² × gradient = 39.48 × 0.248 = 9.79 m s⁻².\nSwapping the axes turns the gradient upside down (gradient = g/4π² instead of 4π²/g), so g is found by multiplying by 4π² instead of dividing. The formula for the gradient comes from the axes chosen.",
    [
      "Rearranges to L = (g/4π²) T², identifying gradient = g/4π².",
      "Calculates g = 4π² × gradient = 9.79 m s⁻².",
      "Explains that swapping the axes inverts the gradient, so the formula for g changes (× instead of ÷).",
    ],
    "Mark 3 needs the link between the axes and what the gradient represents."),

  sa(54,
    "v = 2πr/T, so v² = 4π²r²/T². Substituting into mv²/r = Mg: m × 4π²r/T² = Mg, so T² = (4π²m/Mg) × r. This has the form y = (gradient) × x with y = T² and x = r, so gradient = 4π²m/(Mg).\nRearranging: g = 4π²m ÷ (M × gradient) = (39.48 × 0.0150) ÷ (0.0500 × 1.25) = 9.47 m s⁻²",
    [
      "Substitutes v = 2πr/T and rearranges to T² = (4π²m/Mg) r, identifying the gradient.",
      "Derives g = 4π²m ÷ (M × gradient).",
      "Calculates g = 9.47 m s⁻².",
    ],
    "Mark 1 requires the rearranged equation in the form T² = (gradient) × r."),

  sa(55,
    "Δy = ½gt² = (g/2) × t². This has the form y = (gradient) × x with y = Δy and x = t², so gradient = g/2.\ng = 2 × gradient = 2 × 4.75 = 9.5 m s⁻²",
    [
      "Identifies gradient = g/2 from Δy = (g/2) t².",
      "Calculates g = 9.5 m s⁻².",
    ],
    "Award no mark 2 for g = gradient ÷ 2 (2.4 m s⁻²) or g = 4.75 m s⁻²."),

  sa(56,
    "F = mv²/r = (m/r) × v². This has the form y = (gradient) × x with y = F and x = v², so gradient = m/r.\nm = gradient × r = 0.0190 × 0.800 = 0.0152 kg = 15.2 g",
    [
      "Rearranges to F = (m/r) v² and identifies gradient = m/r.",
      "Derives m = gradient × r.",
      "Calculates m = 0.0152 kg (15.2 g).",
    ],
    "Award no marks 2 or 3 for m = gradient ÷ r (0.024 kg)."),

  sa(57,
    "F = mv²/r, so v² = (F/m) × r. This has the form y = (gradient) × x with y = v² and x = r, so gradient = F/m.\nThe student divided by m instead of multiplying: F = m × gradient.\nF = 0.0250 × 36.8 = 0.920 N. (A force of 1472 N would be absurd for a stopper on a string: it would also have failed a sanity check.)",
    [
      "Rearranges to v² = (F/m) r, identifying gradient = F/m.",
      "Identifies the mistake: F = m × gradient, not gradient ÷ m.",
      "Calculates F = 0.92 N.",
    ],
    "Mark 2 needs the correct relationship, not just “wrong formula”."),

  // ---- relation ----
  sa(58,
    "The statement is incorrect. Doubling L from 0.40 m to 0.80 m multiplies T by 1.80 ÷ 1.27 = 1.42, not 2; doubling again (0.80 to 1.60 m) multiplies T by 2.54 ÷ 1.80 = 1.41. The period increases with length, but it is not proportional: T is proportional to √L (doubling L multiplies T by √2). From T = 2π√(L/g), T² = (4π²/g)L, so a graph of T² against L gives a straight line through the origin.",
    [
      "Uses the data to show that doubling L multiplies T by about 1.41, not 2.",
      "Concludes that T increases with L but is not proportional (T ∝ √L).",
      "States that T² against L (or T against √L) gives a straight line through the origin.",
    ],
    "Award no mark 2 for “T is proportional to L”."),

  sa(59,
    "Vertically, u_y = 0, so h = ½gt² and t = √(2h/g). Horizontally, R = ut = u√(2h/g). So R is proportional to √h, not to h. The student is wrong: a graph of R against h is a curve that gets less steep as h increases. A graph of R against √h (or R² against h) gives a straight line through the origin.",
    [
      "Derives t = √(2h/g) from the vertical motion.",
      "Derives R = u√(2h/g), so R ∝ √h and the student is wrong (R against h is a curve).",
      "States that R against √h (or R² against h) gives a straight line.",
    ],
    "Mark 2 needs a clear conclusion that R is not proportional to h."),

  sa(60,
    "The tangential velocity increases as the radius increases, but not proportionally: doubling r (0.500 m to 1.000 m) multiplies v by only 5.55 ÷ 3.94 = 1.41, not 2. So v is proportional to √r.",
    [
      "States that v increases as r increases.",
      "States that the increase is not proportional, supported by the data (doubling r multiplies v by about 1.41; v ∝ √r).",
    ],
    "Award no mark 2 for “v is proportional to r” or for describing only v² (e.g. “v² is proportional to r”) without describing v."),

  sa(61,
    "F = mv²/r with m and r constant, so the centripetal force is proportional to v², not to v. Doubling the speed multiplies v² by 4, so the force must be four times larger (the hanging mass must be quadrupled). A graph of F against v is a curve; a graph of F against v² gives a straight line through the origin.",
    [
      "States that F is proportional to v² (from F = mv²/r).",
      "States that doubling v quadruples the force.",
      "States that F against v² gives a straight line (F against v curves).",
    ],
    "Award no mark 2 for “the force doubles”."),

  sa(62,
    "The statement is only half right. Time of flight: t = 2u sin θ ÷ g, so t is proportional to u and doubling u doubles t. Range: R = u² sin 2θ ÷ g, so R is proportional to u², and doubling u multiplies the range by 4, not 2. (The horizontal velocity doubles and the time doubles, so the range is 2 × 2 = 4 times larger.)",
    [
      "Shows that the time of flight is proportional to u, so it doubles.",
      "Shows that the range is proportional to u².",
      "Concludes that the range quadruples, so the statement is incorrect for the range.",
    ],
    "Award marks for a correct reasoning chain without the formulas (e.g. u_x and t both double, so R × 4)."),

  sa(63,
    "T is not proportional to r: doubling r (0.50 to 1.00 m) multiplies T by 1.10 ÷ 0.78 = 1.41, and doubling again multiplies T by 1.56 ÷ 1.10 = 1.42, not 2.\nFrom the model: m(2πr/T)²/r = Mg, so 4π²mr/T² = Mg and T² = (4π²m/Mg) × r. So T² is proportional to r (T ∝ √r), and a graph of T² against r gives a straight line through the origin.",
    [
      "Uses the data to show T is not proportional to r (doubling r multiplies T by about 1.41).",
      "Derives T² = (4π²m/Mg) r from the model.",
      "States that T² against r gives a straight line through the origin.",
    ],
    "Mark 2 needs the algebra from the model, not only the observation."),

  sa(64,
    "This is not correct. H = u² sin²θ ÷ 2g, so at a fixed angle H is proportional to u², not to u: doubling u makes H four times larger. A graph of H against u² gives a straight line through the origin.",
    [
      "States that H is proportional to u² (not u), e.g. doubling u multiplies H by 4.",
      "States that H should be plotted against u² for a straight line.",
    ],
    "Award no marks for agreeing that H is proportional to u."),

  // ---- check ----
  sa(65,
    "Student X (1%): a very small error, consistent with random error only (e.g. reaction time), with no significant systematic error. Student Y (8%, with every point below the line): a moderate error that is all in one direction, which points to a systematic error, such as friction at the tube making the tension less than Mg. Student Z (200%, three times the accepted value): far too large to come from experimental error; it points to a mistake in the model, formula or calculation (e.g. the wrong rearrangement, swapped masses, or a unit error).",
    [
      "Student X: small error, so random error only.",
      "Student Y: one-sided moderate error, so a systematic error (with a plausible cause).",
      "Student Z: an error of three times the value indicates a wrong formula/model or a calculation error, not experimental error.",
    ],
    "Each mark needs the link between the size or direction of the error and its cause."),

  sa(66,
    "A value of 110.6 m s⁻² is about 11 times the accepted value, far too large to be caused by experimental error, so it shows a calculation or formula mistake. The likely mistake is swapping m and M: the correct formula is g = m × gradient ÷ M = 0.0200 × 31.6 ÷ 0.0700 = 9.03 m s⁻², but 0.0700 × 31.6 ÷ 0.0200 = 110.6 m s⁻².",
    [
      "States that the result is far too large to come from experimental error, so it must be a calculation or formula mistake.",
      "Identifies the likely mistake: m and M swapped (g = M × gradient ÷ m instead of m × gradient ÷ M).",
    ],
    "Do not credit “random error” or “friction” as the explanation."),

  sa(67,
    "A pendulum of length about 1 m has a period of about 2 s (T = 2π√(1/9.8) ≈ 2.0 s), and a 0.5 m pendulum about 1.4 s. The student's periods (0.8–1.1 s) are about half of these, so the stopper is not behaving like a pendulum of length r: it is a different system (the tension is set by Mg, not by the stopper's weight). Using the pendulum formula would give a g several times too large, as found (about 33 m s⁻²). The model mv²/r = Mg should be used instead.",
    [
      "Uses a quick estimate to show a pendulum of this length would have a period of about 2 s (much longer than measured).",
      "Concludes that the pendulum model does not apply to this experiment (and explains the inflated g), so the whirling-stopper model must be used.",
    ],
    "Mark 1 needs a numerical estimate or a clear comparison of the expected and measured periods."),

  sa(68,
    "“This percentage error tells us the result is reasonably close to the expected value, but because every point lies below the theoretical line, the error is mostly systematic rather than random. A likely cause is friction between the string and the glass tube, which makes the tension on the stopper less than Mg, so the force calculated from the gradient is too low.”",
    [
      "States that the error is one-sided, so it indicates a systematic error (not just random error).",
      "Gives a plausible cause consistent with the force being too low (e.g. friction at the tube).",
    ],
    "Award no marks for “the result has some error” or “the result is accurate” with no interpretation."),

  sa(69,
    "The 19.97 s trial is anomalous: it is 1.00 s (about one period) shorter than the other trial, while the others agree within 0.2 s, and it is barely more than the 0.800 m average. It should be left out of the average (or the trial repeated), so the average is 20.97 s.\nExcluded: T = 20.97 ÷ 20 = 1.049 s, v = 2π(0.900) ÷ 1.049 = 5.39 m s⁻¹ (v² = 29.1).\nIncluded: average 20.47 s, T = 1.024 s, v = 5.53 m s⁻¹ (v² = 30.5).\nIncluding the anomaly makes the average time, and so T, too small, so v and v² are too large and the point sits above the line.",
    [
      "Identifies 19.97 s as the anomaly and states that it is left out of the average (or repeated).",
      "Calculates v = 5.39 m s⁻¹ (excluded) and v = 5.53 m s⁻¹ (included).",
      "Explains that including it makes T too small, so v and v² are too large and the point lies above the line.",
    ],
    "Allow v within ±0.02 m s⁻¹."),

  sa(70,
    "An outlier does not measure the same thing as the other trials (here 19.20 s is about one period shorter, probably a miscount of revolutions), so averaging it in drags the average away from the true value. It must be left out, giving an average of 20.23 s.\nIncluding it gives an average of 19.72 s, so T = 0.986 s instead of 1.012 s, and v = 2π(0.800) ÷ T = 5.10 m s⁻¹ instead of 4.97 m s⁻¹. The calculated v (and v²) at this radius is too large.",
    [
      "Explains that the outlier must be excluded because it is a mistake (e.g. a miscount) that distorts the average.",
      "States that including it makes the average time and T too small, so v is too large (5.10 m s⁻¹ instead of 4.97 m s⁻¹).",
    ],
    "Mark 2 needs the direction (v too large); the numbers are not required."),

  sa(71,
    "For a launch from level ground, the greatest possible range is at 45°: R = u² ÷ g = 20² ÷ 9.8 ≈ 41 m. An answer of 400 m is about ten times this maximum, so it is unreasonable. The most likely mistake is forgetting to divide by g (u² sin 90° = 400).",
    [
      "Makes a quick estimate of the expected range (about 41 m, the maximum possible).",
      "Concludes that 400 m is about ten times too large, so it is unreasonable.",
      "Identifies a likely mistake (forgot to divide by g).",
    ],
    "Accept any sensible quick estimate (e.g. time of flight about 3 s and horizontal speed about 14 m s⁻¹ give about 40 m)."),

  sa(72,
    "The 15.62 s trial is anomalous: it is about 0.85 s longer than the other two, which agree within 0.09 s. It should be left out of the average (or the trial repeated), giving an average of 14.76 s.\nIncluding it would make the average time too long (15.04 s), so T would be too large and v = 2πr/T too small (4.18 m s⁻¹ instead of 4.26 m s⁻¹).",
    [
      "Identifies 15.62 s as the anomaly and states that it is excluded from the average (or repeated).",
      "Explains that including it makes T too large, so the calculated v is too small.",
    ],
    "The numerical values of v are not required for mark 2, but the direction is."),
];

export const answers: AnswerSet = Object.fromEntries(answerList);

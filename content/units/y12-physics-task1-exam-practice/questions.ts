import type { Question, ShortQuestion } from "@/lib/types";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Original short-answer questions for the Year 12 Physics Assessment Task 1 (Module 5:
// whirling-stopper practical, projectiles, circular motion), written to target six
// misunderstandings seen in a student's practice papers (Nov 2026):
//   trace    — following an error through to its effect on the result (random vs systematic)
//   arv      — accuracy vs reliability vs validity, and why averaging repeated trials helps
//   gradient — rearranging the model into y = (gradient) × x to see what the gradient means
//   relation — "increases" is not "proportional"; working out the relationship before choosing axes
//   check    — sanity-checking results, reading a percentage error, and acting on an anomaly
// No torque and no banked tracks (not examined in this task). No HSC questions.
//
// s01–s35 (the first version of this unit) are retired — see ./concepts.ts.
// 37 short answer, 2–3 marks. A quiz draws one from each of the five groups (5 questions),
// so there are 7 non-repeating attempts.

const U = "y12-physics-task1-exam-practice";
const p2 = (n: number) => String(n).padStart(2, "0");

type Group = "trace" | "arv" | "gradient" | "relation" | "check";

function sa(n: number, group: Group, maxMarks: number, prompt: string): ShortQuestion {
  return { id: `${U}.s${p2(n)}`, group, type: "short", prompt, maxMarks };
}

const SETUP =
  "In the whirling-stopper practical, a rubber stopper (mass m) is whirled in a horizontal circle of radius r on a string that passes through a glass tube to a hanging mass carrier (mass M). The weight of the mass carrier, Mg, is assumed to provide the centripetal force, so mv²/r = Mg. The time for 20 revolutions is measured at each radius, and v² is graphed against r.";

const TRACE =
  "In your answer: state whether it is a random or a systematic error, what it changes in the measurements, which way, and what happens to the final result (too high, too low, or scattered).";

export const questions: Question[] = [
  // ---- trace: follow an error through to the result ----
  sa(36, "trace", 3,
    `${SETUP} The student uses the gradient to calculate g, using g = m × gradient ÷ M. There is friction between the string and the rim of the glass tube. Explain how this friction affects the calculated value of g. ${TRACE}`),
  sa(37, "trace", 3,
    `${SETUP} The student uses the gradient to calculate g. The times are measured with a hand-held stopwatch, so there is reaction time in starting and stopping it. Explain how reaction time affects the calculated value of g. ${TRACE}`),
  sa(38, "trace", 3,
    `${SETUP} The student uses the gradient to calculate g. In every trial, the timer says “one” as they start the stopwatch, so each recorded time is really for only 19 revolutions, but it is still divided by 20 to find T. Explain how this affects the calculated value of g. ${TRACE}`),
  sa(39, "trace", 3,
    `${SETUP} The student calculates g = m × gradient ÷ M using m = 20.0 g, the value written on the stopper's label. The stopper's actual mass is 22.0 g. Explain how this affects the calculated value of g, and by roughly what percentage. ${TRACE}`),
  sa(40, "trace", 3,
    `A student finds g with a pendulum by graphing T² against L and using g = 4π² ÷ gradient. The student measures the length L from the pivot to the top of the bob instead of to its centre, so every length is too short by the same amount. Explain how this affects the calculated value of g. ${TRACE}`),
  sa(41, "trace", 3,
    `${SETUP} After the experiment, a student writes: “Reaction time made my value of g too high.” Evaluate this statement.`),
  sa(42, "trace", 3,
    `A student fires a ball from a projectile launcher on the floor and measures each range from the front edge of the launcher. The ball actually leaves the launcher 5 cm behind the front edge. The student uses the ranges to calculate the launch speed. Explain how this affects the calculated launch speed. ${TRACE}`),
  sa(43, "trace", 3,
    `${SETUP} This time the student uses the gradient to calculate the mass of the stopper, using m = Mg ÷ gradient. There is friction between the string and the rim of the glass tube. Explain how this friction affects the calculated mass of the stopper. ${TRACE}`),

  // ---- arv: accuracy vs reliability vs validity; why averaging helps ----
  sa(44, "arv", 3,
    `${SETUP} Explain the difference between accuracy, reliability and validity, giving one example from this practical for each.`),
  sa(45, "arv", 2,
    `${SETUP} A student writes: “My results are reliable because all my points are close to the line of best fit.” Evaluate this statement.`),
  sa(46, "arv", 3,
    `${SETUP} Explain why averaging several trials at each radius makes the results more reliable. In your answer, explain what averaging does and does not fix.`),
  sa(47, "arv", 2,
    `${SETUP} At r = 0.800 m, Student A did three trials: 20.1 s, 20.9 s and 19.4 s. Student B did two trials: 20.22 s and 20.26 s. Student A says their results are more reliable because they did more trials. Evaluate this claim.`),
  sa(48, "arv", 3,
    `${SETUP} For each change below, state whether it mainly improves accuracy or reliability, and explain why: (i) timing with a light gate instead of a hand-held stopwatch; (ii) using a smoother glass tube to reduce friction; (iii) doing five trials at each radius instead of two.`),
  sa(49, "arv", 3,
    `${SETUP} A student writes: “The investigation was not valid because of reaction time when using the stopwatch.” Explain why this is not a validity issue, and identify ONE factor that does affect the validity of this investigation.`),
  sa(50, "arv", 2,
    `${SETUP} A student's experimental value of g is 9.6 m s⁻², compared with the accepted value of 9.8 m s⁻². The student writes: “This shows my results are reliable.” Explain what this comparison actually shows, and what the student would need to look at to judge reliability.`),

  // ---- gradient: rearrange the model into y = (gradient) × x ----
  sa(51, "gradient", 3,
    `${SETUP} The stopper's mass is 20.0 g and the mass carrier's mass is 70.0 g. The gradient of the graph is 31.6 m s⁻². Starting from mv²/r = Mg, rearrange the model into the form v² = (gradient) × r to show what the gradient stands for, then derive an expression for g and calculate it.`),
  sa(52, "gradient", 3,
    "A student investigates a pendulum, using T = 2π√(L/g), and plots T² on the y-axis against L on the x-axis. The gradient is 4.10 s² m⁻¹. Rearrange the formula into the form T² = (gradient) × L to show what the gradient stands for, then calculate g.",
  ),
  sa(53, "gradient", 3,
    "A student investigates a pendulum, using T = 2π√(L/g), but plots L on the y-axis against T² on the x-axis. The gradient is 0.248 m s⁻². Rearrange the formula into the form L = (gradient) × T² to show what the gradient stands for, then calculate g. Explain why the formula for g is different from the one used when T² is on the y-axis.",
  ),
  sa(54, "gradient", 3,
    `${SETUP} A student plots T² on the y-axis against r on the x-axis instead. The stopper's mass is 15.0 g, the mass carrier's mass is 50.0 g, and the gradient is 1.25 s² m⁻¹. Using v = 2πr/T, rearrange mv²/r = Mg into the form T² = (gradient) × r, then derive an expression for g and calculate it.`),
  sa(55, "gradient", 2,
    "A ball is dropped from rest, and its distance fallen, Δy, is measured at several times t. A student plots Δy on the y-axis against t² on the x-axis and gets a gradient of 4.75 m s⁻². Using Δy = ½gt², show what the gradient stands for and calculate g.",
  ),
  sa(56, "gradient", 3,
    `${SETUP} The radius is kept at 0.800 m while the hanging mass is changed. The student plots the centripetal force F (y-axis) against v² (x-axis) and gets a gradient of 0.0190 kg m⁻¹. Rearrange F = mv²/r into the form F = (gradient) × v² to show what the gradient stands for, then calculate the mass of the stopper.`),
  sa(57, "gradient", 3,
    `${SETUP} The stopper's mass is 25.0 g, and the gradient of the v² against r graph is 36.8 m s⁻². To find the centripetal force, a student writes F = gradient ÷ m = 36.8 ÷ 0.0250 = 1472 N. Rearrange F = mv²/r to show what the gradient stands for, identify the student's mistake, and calculate the correct force.`),

  // ---- relation: increases is not proportional; work out the relationship before choosing axes ----
  sa(58, "relation", 3,
    "A student measures the period T of a pendulum for three lengths: L = 0.40 m, T = 1.27 s; L = 0.80 m, T = 1.80 s; L = 1.60 m, T = 2.54 s. The student writes: “The period increases proportionally with the length.” Use the data to evaluate this statement, and state which graph would give a straight line through the origin.",
  ),
  sa(59, "relation", 3,
    "A ball is launched horizontally at the same speed u from benches of different heights h. A student predicts that a graph of horizontal range R against h will be a straight line. Using the equations of projectile motion, derive the relationship between R and h, explain whether the student is right, and state which graph would give a straight line.",
  ),
  sa(60, "relation", 2,
    `${SETUP} A student's results show v = 3.94 m s⁻¹ at r = 0.500 m and v = 5.55 m s⁻¹ at r = 1.000 m. Describe the relationship between v and r shown by these results. Do not describe v².`),
  sa(61, "relation", 3,
    `${SETUP} The radius is kept constant while the speed of the stopper is changed by changing the hanging mass. Describe how the centripetal force depends on the speed of the stopper, state what happens to the force when the speed doubles, and state which graph would give a straight line.`),
  sa(62, "relation", 3,
    "A student says: “If I double the launch speed of a projectile launched from level ground at a fixed angle, I double both its time of flight and its range.” Using the equations of projectile motion, evaluate this statement.",
  ),
  sa(63, "relation", 3,
    `${SETUP} With the same stopper and mass carrier, a student records the period T at three radii: r = 0.50 m, T = 0.78 s; r = 1.00 m, T = 1.10 s; r = 2.00 m, T = 1.56 s. Use the data to show whether T is proportional to r. Then use v = 2πr/T and mv²/r = Mg to work out the relationship between T and r, and state which graph would give a straight line.`),
  sa(64, "relation", 2,
    "For a projectile launched at a fixed angle, the maximum height is H = u² sin²θ ÷ 2g. A student says that H increases proportionally with the launch speed u. Explain whether this is correct, and state which quantity should be plotted against H to give a straight line.",
  ),

  // ---- check: sanity checks, reading a percentage error, acting on an anomaly ----
  sa(65, "check", 3,
    `${SETUP} Three students use the experiment to find g. Student X gets 9.70 m s⁻² (1% error), Student Y gets 9.03 m s⁻² (8% error, with every point below the theoretical line), and Student Z gets 29.4 m s⁻² (200% error). For each student, explain what the percentage error suggests about the source of the error.`),
  sa(66, "check", 2,
    `${SETUP} The stopper's mass is 20.0 g and the mass carrier's mass is 70.0 g. From a gradient of 31.6 m s⁻², a student calculates g = 110.6 m s⁻². Explain what this result tells the student, and identify the most likely mistake.`),
  sa(67, "check", 2,
    `${SETUP} The student's periods are between 0.8 s and 1.1 s for radii from 0.500 m to 1.000 m. The student uses the pendulum formula T = 2π√(L/g), with L = r, to calculate g and gets about 33 m s⁻². Using a quick estimate of a pendulum's period, explain why the student should have realised the formula was wrong before calculating g.`),
  sa(68, "check", 2,
    `${SETUP} The stopper's mass is 25.0 g and the mass carrier weighs 0.98 N. A student calculates the centripetal force from the gradient as 0.92 N, a percentage error of 6.1%, and every data point lies below the theoretical line. Complete the student's sentence: “This percentage error tells us…”, explaining what kind of error is most likely and giving a likely cause.`),
  sa(69, "check", 3,
    `${SETUP} At r = 0.900 m, the two trials for 20 revolutions are 20.97 s and 19.97 s. At every other radius the trials agree within 0.2 s, and the average at 0.800 m is 19.69 s. Identify the anomalous trial and state how it should be treated. Calculate v at 0.900 m with the anomaly included and with it excluded, and explain what including it does to the point on the graph.`),
  sa(70, "check", 2,
    `${SETUP} At r = 0.800 m, the trials are 20.23 s and 19.20 s. A student correctly identifies 19.20 s as an outlier, but still averages both trials (19.72 s) in the results table. Explain why the outlier must be left out of the average, and how including it changes v at this radius.`),
  sa(71, "check", 3,
    "A student calculates that a football kicked from level ground at 20 m s⁻¹ at 45° travels 400 m before landing. Without redoing the full calculation, use a quick estimate to show that this answer is unreasonable, and suggest the most likely mistake.",
  ),
  sa(72, "check", 2,
    `${SETUP} At r = 0.500 m, a student's three trials for 20 revolutions are 14.71 s, 14.80 s and 15.62 s. Identify the anomalous trial, state how it should be treated, and explain how including it would affect the calculated value of v at this radius.`),
];

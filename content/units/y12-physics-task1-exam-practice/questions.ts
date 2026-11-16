import type { Question, ShortQuestion } from "@/lib/types";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Original short-answer questions in the style of the 2027 Year 12 Physics Assessment
// Task 1 papers (Fishmarket Secondary College, Papers A, B and C, Nov 2026). Part A style:
// analysing results from the whirling-stopper practical (PH11/12-2, PH11/12-5). Part B style:
// projectile and circular motion, Inquiry Questions 1 and 2 (PH12-12, PH11/12-2).
// No torque and no banked tracks (not examined in this task). No HSC questions.
//
// 35 short answer (group "sa", 2–4 marks). A quiz draws 5 — 7 non-repeating attempts.

const U = "y12-physics-task1-exam-practice";
const p2 = (n: number) => String(n).padStart(2, "0");

function sa(n: number, maxMarks: number, prompt: string): ShortQuestion {
  return { id: `${U}.s${p2(n)}`, group: "sa", type: "short", prompt, maxMarks };
}

const SETUP =
  "In the whirling-stopper practical, a rubber stopper (mass m) is whirled in a horizontal circle of radius r on a string that passes through a glass tube to a hanging mass carrier (mass M). The time for 20 revolutions is measured at each radius.";

export const questions: Question[] = [
  // ---- Part A style: processing and analysing the practical results ----
  sa(1, 3,
    `${SETUP} At r = 0.800 m, a student records 19.86 s and 20.02 s for 20 revolutions. Calculate the average time, the period T, the tangential velocity v and v² for this radius.`),
  sa(2, 2,
    `${SETUP} A student's average times for 20 revolutions are 17.40 s at r = 0.600 m and 20.21 s at r = 0.800 m. At r = 0.700 m the two trials are 18.95 s and 17.98 s. At every other radius the two trials agree within 0.15 s. Identify the anomalous trial, and state how it should be treated, giving a reason based on the data.`),
  sa(3, 2,
    `${SETUP} A student's line of best fit on a graph of v² (m² s⁻²) against r (m) passes through the points (0.40, 12.6) and (1.00, 32.0). Calculate the gradient of the line, including its units.`),
  sa(4, 3,
    `${SETUP} The weight of the mass carrier (M = 50.0 g) provides the centripetal force on the stopper. A student's graph of v² against r has a gradient of 30.5 m s⁻². Show that the gradient equals Mg/m, and use it to calculate the mass of the stopper in grams.`),
  sa(5, 3,
    `${SETUP} The stopper has a mass of 25.0 g and the mass carrier has a mass of 100.0 g. A student's graph of v² against r has a gradient of 36.8 m s⁻². Use the gradient to calculate the centripetal force on the stopper, and calculate the percentage error compared with the weight of the mass carrier.`),
  sa(6, 3,
    `${SETUP} The stopper has a mass of 20.0 g and the mass carrier has a mass of 70.0 g. A student's graph of v² against r has a gradient of 31.6 m s⁻². Starting from mv²/r = Mg, calculate an experimental value for g, and its percentage error compared with 9.8 m s⁻².`),
  sa(7, 2,
    `${SETUP} Explain why the student should plot v² against r rather than v against r to test the hypothesis.`),
  sa(8, 2,
    `${SETUP} A student's results show the tangential velocity rising from 3.94 m s⁻¹ at r = 0.500 m to 5.55 m s⁻¹ at r = 1.000 m. Describe qualitatively the relationship between the radius and the tangential velocity shown by these results.`),
  sa(9, 2,
    `${SETUP} Explain why the time for 20 revolutions is measured, rather than the time for a single revolution.`),
  sa(10, 3,
    `${SETUP} A student did two trials at each of six radii. At five radii the two trials agree within 0.15 s, but at r = 0.800 m they are 20.23 s and 19.20 s. Assess the reliability of the student's results.`),
  sa(11, 3,
    `${SETUP} Evaluate the validity of this investigation in testing the hypothesis that v² is proportional to r.`),
  sa(12, 3,
    `${SETUP} Using the gradient of the v² against r graph, a student calculates the stopper's mass as 16.1 g, but an electronic balance gives 15.0 g. Explain how ONE systematic error in the method could account for the calculated mass being larger than the balance reading.`),
  sa(13, 2,
    `${SETUP} Suggest ONE improvement that would increase the accuracy of the results, and justify your suggestion.`),
  sa(14, 3,
    `${SETUP} Distinguish between random and systematic errors in this practical, giving one example of each and its effect on the graph of v² against r.`),
  sa(15, 2,
    `${SETUP} A student's line of best fit for v² against r passes through the origin with a gradient of 32.0 m s⁻². The data were collected for radii from 0.500 m to 1.000 m. Use the gradient to predict the tangential velocity at r = 1.20 m, and comment on how reliable this prediction is.`),
  sa(16, 3,
    `${SETUP} Describe how the apparatus could be modified to investigate how the centripetal force on the stopper depends on its tangential velocity at a constant radius. Identify the variables to be controlled and the graph that should be plotted.`),

  // ---- Part B style: projectile motion (Inquiry Question 1) ----
  sa(17, 4,
    "A ball is kicked from the edge of a platform 15.0 m above level ground, with a velocity of 20.0 m s⁻¹ at 35.0° above the horizontal. Ignoring air resistance, calculate the maximum height of the ball above the ground and the horizontal distance from the base of the platform to where it lands."),
  sa(18, 4,
    "A stone is thrown horizontally at 12.0 m s⁻¹ from the top of a vertical cliff and hits the water below 2.50 s later. Ignoring air resistance, calculate the height of the cliff and the velocity (magnitude and direction) of the stone as it hits the water."),
  sa(19, 4,
    "A ball is kicked from ground level at 18.0 m s⁻¹ at 45.0° above the horizontal, towards a fence 2.5 m high that is 25.0 m away. Ignoring air resistance, calculate the maximum height reached by the ball, and determine whether it passes over the fence."),
  sa(20, 3,
    "A ball rolls off a horizontal bench 1.25 m high and lands 2.00 m from the base of the bench. Ignoring air resistance, calculate the time the ball is in the air and the speed at which it left the bench."),
  sa(21, 2,
    "Two identical balls are launched from level ground with the same speed, one at 30° and the other at 60° above the horizontal. Ignoring air resistance, compare their horizontal ranges and their times of flight, and explain the difference in times of flight."),
  sa(22, 2,
    "Describe how the path of a real projectile launched over level ground differs from the ideal path predicted when air resistance is ignored."),
  sa(23, 2,
    "In the projectile motion model, the horizontal and vertical motions are analysed separately. State what is assumed about each component of the motion, and why, when air resistance is ignored."),

  // ---- Part B style: circular motion (Inquiry Question 2) ----
  sa(24, 2,
    "A car of mass 1500 kg travels around a flat, horizontal bend of radius 60 m. The maximum friction force the tyres can provide towards the centre of the bend is 9000 N. Calculate the maximum speed at which the car can travel around the bend without skidding."),
  sa(25, 3,
    "A 0.15 kg ball on a string is whirled in a horizontal circle of radius 0.60 m, completing 2.0 revolutions every second. Assuming the string is horizontal, calculate the tension in the string."),
  sa(26, 2,
    "A ceiling fan rotates at 900 revolutions per minute. The tip of each blade is 0.30 m from the axis of rotation. Calculate the angular velocity of the fan and the centripetal acceleration of the tip of a blade."),
  sa(27, 2,
    "An object moves in uniform circular motion. Explain why the centripetal force does no work on the object, and what this means for its kinetic energy."),
  sa(28, 2,
    "A stopper is whirled in a horizontal circle on a string, and the string breaks. Describe the direction in which the stopper moves immediately afterwards (viewed from above), and explain why."),

  // ---- Part B style: designing and evaluating investigations ----
  sa(29, 4,
    "A student wants to test the claim that, for a projectile launched from and landing on level ground, the maximum horizontal range occurs at a launch angle of 45°. The student has a spring-loaded launcher with an adjustable angle, a protractor, a measuring tape and carbon paper. Outline a valid and reliable procedure to test this claim, including how the data should be analysed."),
  sa(30, 4,
    "A student plans to use video analysis to test two assumptions of the projectile model: that the horizontal velocity is constant, and that the vertical acceleration is constant and equal to 9.8 m s⁻². Outline a valid procedure, including how the video data would be processed to test both assumptions."),
  sa(31, 3,
    "A student rolled a ball horizontally off benches of heights 0.20, 0.40, 0.60, 0.80 and 1.00 m, and used a hand-held stopwatch to measure the times of flight: 0.25, 0.34, 0.40, 0.46 and 0.50 s. One trial was done at each height. By comparing the data with theoretical values, evaluate the accuracy and reliability of the results."),
  sa(32, 3,
    "A projectile launcher fires a ball from floor level at 45° with a launch speed of 4.0 m s⁻¹, measured with a light gate, so the predicted range is 1.63 m. Three trials give ranges of 1.48 m, 1.51 m and 1.47 m. Evaluate the accuracy and reliability of these results, and account for the difference between the predicted and measured ranges."),
  sa(33, 3,
    "A coin is placed on a horizontal turntable, and the rotation rate is slowly increased until the coin slides. The maximum friction force on the coin is constant. Outline a procedure to investigate how the angular velocity at which the coin slides depends on its distance r from the centre, including the variables to control and how the data should be analysed."),
  sa(34, 3,
    "A student rolls a ball across a bench 0.90 m high and uses a hand-held stopwatch to time it over the final 1.00 m (0.50 s). The student predicts it will land 0.86 m from the bench, but in a single trial judges by eye that it lands 0.78 m away. Evaluate the method and recommend two improvements."),
  sa(35, 2,
    "In the whirling-stopper practical, the radius is kept constant while the speed of the stopper is doubled. Explain how the centripetal force must change, and how the mass carrier must be changed to provide it."),
];

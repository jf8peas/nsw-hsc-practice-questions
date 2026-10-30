import type { Question, ShortQuestion } from "@/lib/types";

// PUBLIC — no answer keys here. Answer keys live in ./answers.ts, kept in sync
// by scripts/validate-content.ts.
//
// Original short-answer questions for the whirling-bung practical (2017 syllabus,
// Module 5 dot point C1) — see resources/topic007/ for the sources, the research
// notes and the review of each question. No HSC questions.
//
// 30 short answer (group "sa", 2–4 marks). A quiz draws 5 — 6 non-repeating attempts.

const U = "y12-physics-circular-motion-practical";
const p2 = (n: number) => String(n).padStart(2, "0");

function sa(n: number, maxMarks: number, prompt: string): ShortQuestion {
  return { id: `${U}.s${p2(n)}`, group: "sa", type: "short", prompt, maxMarks };
}

export const questions: Question[] = [
  sa(1, 2,
    "A student is about to do the whirling-bung experiment. The aim is to find how increasing the radius affects the tangential velocity of the stopper. Identify the independent variable and the dependent variable in this experiment."),
  sa(2, 2,
    "A paperclip is fixed on the string just below the bottom of the glass tube. Outline two jobs the paperclip does in this experiment."),
  sa(3, 2,
    "A student times only 5 revolutions instead of the recommended 20. Describe how this affects the uncertainty in the period T, and explain why."),
  sa(4, 3,
    "The string tension provides the centripetal force on the stopper. Explain why, when the paperclip is hovering steadily just below the tube, the tension in the string equals Mg, where M is the mass of the hanging mass carrier."),
  sa(5, 2,
    "A student says, “The stopper is moving at constant speed, so it has zero acceleration.” Explain why this statement is incorrect."),
  sa(6, 3,
    "A student plots v² on the y-axis against r on the x-axis. Starting from the equation mv²/r = Mg, explain why this graph should be a straight line through the origin."),
  sa(7, 3,
    "For a radius of 0.700 m, a student records a time of 16.2 s for 20 revolutions. Calculate the period T and the tangential velocity v. Give v to three significant figures, with its unit."),
  sa(8, 4,
    "Halfway through a trial, the student timing notices the paperclip slowly rising until it presses against the bottom of the glass tube. Explain what is happening to the stopper's radius, why the time for this trial cannot be used, and what the students should do."),
  sa(9, 2,
    "A student's results table shows times of 14.2 s, 15.75 s and 16.8 s for three different radii. State one error in how these values are recorded, and state the correct practice."),
  sa(10, 3,
    "Before swinging at the next radius, a student needs to set the radius to 0.600 m. Describe how the student should set up and measure the radius so that it matches the radius the stopper will have during the trial."),
  sa(11, 2,
    "A student measures each radius from the top of the glass tube to the nearest edge of the rubber stopper. State where the radius should be measured to, and explain the effect of the student's method on the radii recorded."),
  sa(12, 3,
    "Friction between the string and the rim of the glass tube affects the experiment. Explain why friction at the tube means the tension acting on the stopper is not exactly equal to Mg, and state whether this is a systematic or a random error."),
  sa(13, 2,
    "Two students are working as a pair to complete the experiment. Outline the two roles they should divide between them for each trial."),
  sa(14, 2,
    "For the tension in the string to equal Mg, the hanging mass carrier must meet a condition. State this condition, and state what happens to the tension if it is not met."),
  sa(15, 3,
    "A student draws a free-body diagram for the stopper showing three forces: tension along the string, weight downward, and a horizontal outward force labelled “centrifugal force”. Explain why including the centrifugal force is incorrect in the laboratory frame of reference."),
  sa(16, 3,
    "A student's graph of v² against r has a gradient of 60.0 m s⁻². The hanging mass M is 0.100 kg and g = 9.8 m s⁻². Using gradient = Mg/m, calculate the mass m of the rubber stopper. Give your answer in grams to two significant figures."),
  sa(17, 3,
    "At a radius of 0.600 m, a student records 13.5 s for 20 revolutions. Calculate the period T, the speed v and v² for this radius. Give each to three significant figures, with its unit."),
  sa(18, 4,
    "A student's two trials at a radius of 0.800 m are 17.2 s and 18.9 s for 20 revolutions. Justify whether the student should average these two values or do a third trial, and suggest two likely causes of such a large difference."),
  sa(19, 2,
    "A student records a radius measured with a metre ruler as 0.5 m. State how this measurement should be recorded, and give its uncertainty."),
  sa(20, 3,
    "Before the practical, a student rehearses at home: a pen barrel as the tube, an eraser as the stopper, a bunch of keys as the hanging mass, and a paperclip on the string just below the barrel. Describe what the student must be able to do in this rehearsal before they are ready to time a real trial."),
  sa(21, 3,
    "The hypothesis for this experiment is v² ∝ r. This relies on certain variables being kept constant. Identify three variables that must be controlled throughout the experiment for the hypothesis to be tested fairly."),
  sa(22, 2,
    "The hypothesis v² ∝ r assumes the centripetal force stays constant. Predict what would happen to the graph of v² against r if extra mass were added to the hanging mass carrier halfway through the experiment, and explain your reasoning."),
  sa(23, 3,
    "The string passes over the top rim of the glass tube, changing direction from horizontal to vertical. Explain why the tension pulling the stopper inward can be the same size as the tension holding up the hanging mass, and state the condition needed for this to be true."),
  sa(24, 2,
    "A student plots v² against r and finds that the line of best fit does not pass through the origin: it has a positive y-intercept. State what this suggests about the experiment, and give one possible cause."),
  sa(25, 3,
    "At a radius of 0.900 m, a student records times of 18.4 s and 18.8 s for two trials of 20 revolutions. Calculate the average period T and the tangential velocity v. Give v to three significant figures, with its unit."),
  sa(26, 2,
    "The string to the stopper sags slightly below horizontal because the stopper has weight, so the stopper's circle is a little smaller than the length of string measured. A student worries this makes their radius measurements invalid. Explain why measuring r along the string, from the tube to the stopper, still gives a valid straight-line graph of v² against r."),
  sa(27, 3,
    "A student suggests that repeating trials and averaging will eliminate all errors in this experiment. Explain why this is incorrect, distinguishing between errors that averaging reduces and errors it does not."),
  sa(28, 2,
    "A student measures a radius r = 0.500 m with an uncertainty of ±0.0005 m, and a time t = 14.2 s with an uncertainty of ±0.2 s. Calculate the percentage uncertainty in each measurement, and state which measurement contributes more uncertainty."),
  sa(29, 3,
    "In this apparatus the tension in the string is set by the hanging mass, so F = Mg. Explain why the string to the stopper can never be horizontal, and calculate the angle θ that the string makes below the horizontal for a stopper of mass 0.015 kg and a hanging mass of 0.100 kg."),
  sa(30, 3,
    "During a trial, a student notices the paperclip dropping away from the bottom of the glass tube. Describe what this shows about the stopper's speed and radius, and the adjustment the whirler should make."),
];

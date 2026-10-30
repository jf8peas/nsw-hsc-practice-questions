import type { Answer, AnswerSet } from "@/lib/types";

// Answer key for y12-physics-circular-motion-practical. NO "server-only" import here
// (the validator reads it); only re-exported via content/answers/index.ts, which is
// server-only. Never import from a client component.
//
// Drafted by Qwen from resources/topic007/_RESEARCH-PROMPT.md, then reviewed and
// corrected — see resources/topic007/03-review.md for every change and why.

const U = "y12-physics-circular-motion-practical";
const p2 = (n: number) => String(n).padStart(2, "0");

function sa(n: number, modelAnswer: string, rubric: string[], notes: string): [string, Answer] {
  return [`${U}.s${p2(n)}`, { modelAnswer, rubric, notes }];
}

const answerList: Array<[string, Answer]> = [
  sa(1,
    "The independent variable is the radius r (measured from the top of the tube to the centre of the stopper). The dependent variable is the tangential velocity v of the stopper, calculated from the time for 20 revolutions.",
    [
      "Identifies the radius r as the independent variable.",
      "Identifies the tangential velocity v (speed) of the stopper as the dependent variable.",
    ],
    "Accept “the length of string from the tube to the stopper” for radius. Accept “speed” for velocity, since only its size is found. Also accept “the time for 20 revolutions” as the measured dependent variable if the student says v is calculated from it. Do not accept mass, or time on its own, as either variable."),

  sa(2,
    "It sets the radius: while the clip sits just below the tube, the length of string from the top of the tube to the stopper is the radius that was measured. It also shows whether the radius is drifting: if the clip moves up or down during a trial, the radius is changing and the trial needs to be redone.",
    [
      "States that the clip sets or marks the radius: with the clip just below the tube, the string above the tube is the measured radius.",
      "States that the clip shows whether the radius is changing: the clip moving up or down during a trial means r is drifting.",
    ],
    "Accept “reference point” or “marker” for the first job, and “indicator” or “visual check” for the second. Do not credit “it holds the string” or “it stops the string falling through the tube” on their own."),

  sa(3,
    "Timing only 5 revolutions makes the percentage uncertainty in T much larger. The reaction-time uncertainty (about ±0.2 s) is the same however many revolutions are timed, so dividing by 5 instead of 20 leaves four times as much uncertainty in each period. For example, ±0.2 s on 3.5 s is about 6%, compared with about 1.4% on 14 s for 20 revolutions.",
    [
      "States that the (percentage or relative) uncertainty in T increases.",
      "Explains that the fixed reaction-time uncertainty is shared over fewer revolutions (or gives a correct numerical comparison).",
    ],
    "Accept “percentage uncertainty” or “relative uncertainty”. A qualitative explanation earns mark 2 if the reasoning is clear. Do not accept “it's less accurate” without saying why."),

  sa(4,
    "When the paperclip hovers steadily, the hanging mass is not moving up or down, so it is in equilibrium. The only forces on it are its weight Mg downward and the string tension upward, so the tension must equal Mg. The same tension acts along the string to the stopper, where it provides the centripetal force.",
    [
      "States that the hanging mass is stationary (in equilibrium, not accelerating).",
      "States that the upward tension therefore equals its weight downward: T = Mg.",
      "Links this same tension to the centripetal force on the stopper.",
    ],
    "Accept “net force on the hanging mass is zero” for equilibrium. Do not accept “the tension equals Mg because that's the formula” without the equilibrium reason."),

  sa(5,
    "Velocity is a vector, with both size and direction. The stopper's speed is constant, but its direction changes all the time as it goes round the circle, so its velocity is changing. A changing velocity is an acceleration: a centripetal acceleration towards the centre of the circle, a = v²/r.",
    [
      "States that velocity is a vector whose direction is changing (so the velocity changes even at constant speed).",
      "States that there is a centripetal acceleration directed towards the centre (a = v²/r).",
    ],
    "Accept “velocity changes because its direction changes” without the word vector. Do not accept “because it's circular motion” without saying why that means acceleration."),

  sa(6,
    "Rearranging mv²/r = Mg to make v² the subject gives v² = (Mg/m) × r. M, g and m are all kept constant, so Mg/m is a constant. The equation has the form y = kx, with y = v², x = r and k = Mg/m, and a graph of y = kx is a straight line through the origin with gradient k.",
    [
      "Rearranges mv²/r = Mg to v² = (Mg/m) r.",
      "States that Mg/m is constant because M, g and m do not change.",
      "States that this is of the form y = kx, which gives a straight line through the origin.",
    ],
    "Accept “v² is directly proportional to r” for the y = kx point. Do not accept “it's linear” without the rearrangement or a reason."),

  sa(7,
    "T = t ÷ 20 = 16.2 ÷ 20 = 0.810 s\nv = 2πr ÷ T = (2 × π × 0.700) ÷ 0.810 = 4.398 ÷ 0.810 = 5.43 m s⁻¹",
    [
      "Calculates T = 16.2 ÷ 20 = 0.810 s.",
      "Substitutes into v = 2πr/T with r = 0.700 m and their value of T.",
      "Gives v = 5.43 m s⁻¹, to three significant figures, with the unit.",
    ],
    "Accept 0.81 s for T. If T is wrong but used correctly in v = 2πr/T, award mark 2, and mark 3 if the final value follows from their T, to 3 s.f., with the unit. Do not award mark 3 for 5.4 m s⁻¹ (three significant figures were asked for) or for a missing unit. A common error is dividing by the 20-revolution time (16.2 s) instead of T, which gives about 0.271 m s⁻¹."),

  sa(8,
    "The stopper is going too fast for that radius. It needs more centripetal force than Mg provides, so it moves outward and pulls string up out of the top of the tube: the radius is increasing and the hanging mass is being lifted. The time can't be used because the radius is no longer the value that was measured, and while the hanging mass is moving (or the clip is pressed against the tube, which then also pulls on the string) the tension is not equal to Mg. The whirler should slow down slightly until the clip hovers just below the tube without touching it, wait until the rotation is steady, then restart the timing from zero.",
    [
      "States that the radius is increasing because the stopper is going too fast (it moves outward and pulls string up through the tube).",
      "States that the radius is no longer the measured value, so the time does not match the recorded radius.",
      "States that the tension no longer equals Mg, because the hanging mass is moving or the tube is now pushing on the clip.",
      "States that the whirler should slow down until the clip hovers just below the tube, then restart the timing.",
    ],
    "A rising clip means string is being pulled up out of the top of the tube, so the radius is getting longer: do not credit “the radius is decreasing”. For mark 4, “adjust the speed” alone is not enough — it must be slowing down, and the trial must be restarted rather than continued."),

  sa(9,
    "The values are recorded to different numbers of decimal places: 14.2 s and 16.8 s have one decimal place but 15.75 s has two. All the times in a column should be recorded to the same number of decimal places, e.g. 14.20 s, 15.75 s and 16.80 s.",
    [
      "Identifies that the times have inconsistent numbers of decimal places (mixed precision).",
      "States that every value in a column should be recorded to the same number of decimal places.",
    ],
    "Accept “not consistent” or “different precision” for mark 1. Accept rounding all three to one decimal place (14.2 s, 15.8 s, 16.8 s) as the correct practice. Do not credit comments about units or uncertainty unless the student also identifies the decimal-place problem."),

  sa(10,
    "Hold the tube upright and pull the string straight and taut out of the top of the tube, with the paperclip held just below the bottom of the tube, where it will hover during the trial. Measure with the metre ruler from the top of the tube to the centre of the stopper, sliding the clip along the string until that distance is 0.600 m. A radius measured with the string slack, or with the clip somewhere else, would not be the radius during the run.",
    [
      "States that the string is pulled straight and taut from the top of the tube when measuring.",
      "States that the paperclip is held just below the bottom of the tube (its position during the trial) while measuring.",
      "States that the radius is measured from the top of the tube to the centre of the stopper (moving the clip until it reads 0.600 m).",
    ],
    "Accept “string held tight and horizontal” for mark 1, and “with the clip touching the bottom of the tube” for mark 2. Do not credit measuring to the edge of the stopper, or from the bottom of the tube, for mark 3."),

  sa(11,
    "The radius should be measured from the top of the tube to the centre of the stopper, because it is the stopper's centre that moves around the circle. Measuring to the nearest edge makes every recorded radius too small by the same amount, the stopper's own radius (about 1–2 cm). This is a systematic error: it shifts every result the same way, so repeating trials will not remove it.",
    [
      "States that r should be measured to the centre of the stopper (from the top of the tube).",
      "States that every radius is too small by the same amount (about the stopper's radius), which is a systematic error.",
    ],
    "Accept “middle” for centre. For mark 2, “systematic error” earns the mark only with “too small” or “by a constant amount”. Do not credit “it's inaccurate” on its own."),

  sa(12,
    "Friction at the rim opposes the string slipping over it. So the tension on the stopper side of the tube is not the same as on the hanging-mass side: it is Mg plus or minus the friction force. The calculations assume the stopper is pulled by exactly Mg, so the force in the model is wrong. This is a systematic error, because friction pushes the results the same way during a run, and averaging more trials will not remove it.",
    [
      "States that friction makes the tension different on the two sides of the tube (tension at the stopper ≠ tension holding the hanging mass).",
      "States that the assumed force Mg is therefore not the actual force on the stopper.",
      "Identifies friction as a systematic error.",
    ],
    "Accept “rubbing” or “resistance” for friction. For mark 3, accept “not random” or “affects the results the same way” if systematic is implied. Do not require a direction (friction can make the tension at the stopper bigger or smaller than Mg). Do not accept “human error” as the classification."),

  sa(13,
    "One student whirls the stopper, keeping the rotation steady with the paperclip hovering just below the tube. The other operates the stopwatch and counts exactly 20 revolutions. They can swap roles halfway so both get practice at keeping the clip steady.",
    [
      "Identifies the whirler: swings the stopper and keeps the rotation (paperclip) steady.",
      "Identifies the timer: uses the stopwatch and counts the 20 revolutions.",
    ],
    "Accept “spinner” for whirler and “timekeeper” or “counter” for timer. Do not accept vague roles such as “one holds the tube, one writes” without the rotation and the timing."),

  sa(14,
    "The hanging mass must be stationary (in equilibrium, not accelerating up or down). If it is not, the tension does not equal Mg: if the mass accelerates upward the tension is greater than Mg, and if it accelerates downward the tension is less than Mg.",
    [
      "States that the hanging mass must be stationary (in equilibrium, not accelerating).",
      "States that the tension then no longer equals Mg (greater if it accelerates up, less if it accelerates down).",
    ],
    "Accept “not moving” or “the clip hovering steadily” for mark 1. For mark 2, “the tension changes” is enough if it is clear the tension is no longer Mg."),

  sa(15,
    "In the laboratory (an inertial frame) centrifugal force is not a real force; it only appears when you describe the motion from a rotating frame. The only real forces on the stopper are the tension along the string and its weight. The horizontal component of the tension is what provides the centripetal force, pulling the stopper towards the centre. Without that inward pull the stopper would move off in a straight line — nothing pushes it outward.",
    [
      "States that centrifugal force is fictitious (not a real force, or only appears in a rotating frame).",
      "States that the only real forces on the stopper are the tension and its weight.",
      "States that the horizontal component of the tension provides the centripetal force (towards the centre).",
    ],
    "Accept “pseudo-force” for fictitious. Award no marks for an answer that treats centrifugal force as a real outward force in the lab frame. Do not credit adding a separate “centripetal force” arrow as the correction."),

  sa(16,
    "gradient = Mg/m, so m = Mg ÷ gradient\nm = (0.100 × 9.8) ÷ 60.0 = 0.980 ÷ 60.0 = 0.0163 kg\nm = 16 g (two significant figures)",
    [
      "Rearranges to m = Mg ÷ gradient.",
      "Calculates m = 0.0163 kg (16.3 g).",
      "Gives m = 16 g, to two significant figures, in grams.",
    ],
    "Accept working in grams throughout. Inverting the ratio (gradient ÷ Mg) earns no marks, as it gives about 61 with no sensible unit. If the rearrangement is right but there is an arithmetic slip, mark 3 can be earned for a correctly rounded value in grams that follows from their working."),

  sa(17,
    "T = t ÷ 20 = 13.5 ÷ 20 = 0.675 s\nv = 2πr ÷ T = (2 × π × 0.600) ÷ 0.675 = 3.770 ÷ 0.675 = 5.59 m s⁻¹\nv² = 5.585² = 31.2 m² s⁻²",
    [
      "Calculates T = 0.675 s.",
      "Calculates v = 5.59 m s⁻¹.",
      "Calculates v² = 31.2 m² s⁻², with the unit m² s⁻².",
    ],
    "Later marks follow from earlier wrong values if the working is correct (carry forward). The unit of v² must be m² s⁻² (or m²/s²); m s⁻² or m s⁻¹ does not earn mark 3. Accept 31.2 or 31.3 m² s⁻² for v² depending on rounding."),

  sa(18,
    "The student should do a third trial rather than average these two. A difference of 1.7 s is far bigger than the variation expected from reaction time (about ±0.2 s), and well past the roughly 0.5 s at which two trials should be treated as disagreeing, so one of them is probably wrong. Averaging a good trial with a bad one gives an unreliable average. Likely causes: the student miscounted the revolutions — at about 0.9 s per revolution, 1.7 s is close to two extra revolutions — or the paperclip drifted during one trial, so the radius was not 0.800 m the whole time.",
    [
      "States that the student should do a third trial (not average these two).",
      "Justifies this: a 1.7 s difference is much larger than normal reaction-time variation (or the ~0.5 s guideline).",
      "Identifies miscounting the revolutions as a likely cause.",
      "Identifies the paperclip drifting (the radius changing during a trial) as a likely cause.",
    ],
    "Accept “repeat the trial” for mark 1. For marks 3 and 4, accept “counted wrong” and “the radius wasn't kept steady”. Accept starting or stopping the stopwatch at the wrong moment as one of the two causes in place of either. Do not accept “human error” without specifics."),

  sa(19,
    "It should be recorded as 0.500 m — to three decimal places in metres, i.e. to the nearest millimetre, which is the smallest division on a metre ruler. The uncertainty is ±0.0005 m (half the smallest division).",
    [
      "States 0.500 m (three decimal places in metres, or to the nearest millimetre).",
      "States the uncertainty as ±0.0005 m (±0.5 mm, half the smallest division).",
    ],
    "Accept 50.0 cm for mark 1. Accept ±1 mm (±0.001 m, one smallest division) for mark 2, since some schools use that convention."),

  sa(20,
    "The student must be able to adjust the speed of rotation until the paperclip hovers just below the barrel without drifting up or down, and then keep it there steadily for 20 revolutions. That shows they can hold the radius constant, which is what they need before timing a real trial.",
    [
      "States that the paperclip must hover without drifting (stay in one position).",
      "States that the position is just below the barrel (tube), not touching it.",
      "States that this must be held steadily for 20 revolutions (by adjusting the speed).",
    ],
    "Accept “float” or “stay still” for hover. Do not credit “spin fast” or “spin evenly” without the clip position."),

  sa(21,
    "Three controlled variables: the hanging mass M (it sets the centripetal force, Mg), the mass m of the rubber stopper, and the way the experiment is run — the same string and tube, the tube held upright, the circle kept horizontal, and 20 revolutions timed every trial.",
    [
      "Identifies the hanging mass M as a controlled variable.",
      "Identifies the stopper mass m as a controlled variable.",
      "Identifies a specific controlled condition, e.g. the same string and tube, the tube upright, a horizontal circle, or 20 revolutions per trial.",
    ],
    "Accept “mass on the bottom” or “weight hanging from the string” for M, and “the bung” for m. For mark 3, “same equipment” earns the mark only if something specific is named. Do not accept the radius or the velocity (they are the independent and dependent variables)."),

  sa(22,
    "The graph would no longer be one straight line through the origin. The gradient is Mg/m, so increasing M partway through increases the gradient for the later points: the results at larger radii would sit above the line through the earlier points, on a steeper line, because v² = (Mg/m) r takes a bigger value of Mg/m after the change.",
    [
      "Predicts that the later points lie on a steeper line (the graph is no longer a single straight line).",
      "Explains that the gradient is Mg/m, so a larger M gives a larger gradient.",
    ],
    "Accept “a kink in the line”, “two lines” or “the later points jump above the line”. Do not accept “the graph would be wrong” without the change in gradient."),

  sa(23,
    "The string is light, so the same tension acts all along it. Where it bends over the rim of the tube, the rim pushes on the string at right angles to it (a normal force). That force changes the string's direction but not the size of the tension, so the tension on the stopper side equals the tension on the hanging-mass side, Mg. This needs the rim to be frictionless: any friction between the string and the rim acts along the string and makes the two tensions differ.",
    [
      "States that the string is light (negligible mass), so the tension is the same all along it.",
      "States that the rim only changes the string's direction (it pushes perpendicular to the string), not the size of the tension.",
      "States the condition: no friction between the string and the rim of the tube (smooth tube, string not catching).",
    ],
    "Accept “the tube just redirects the string” for mark 2. Do not credit “Newton's third law means the tension is the same at both ends” on its own: third-law pairs act on different objects (the string on the stopper, the stopper on the string) and do not by themselves make the two tensions equal. Do not credit “friction is the reaction force at the tube”."),

  sa(24,
    "A positive intercept suggests a systematic error that shifted every point the same way, rather than random scatter. One possible cause is that every radius was measured too long by the same amount — for example from the bottom of the tube instead of the top. Because v is calculated from r, every v² is too big as well, which lifts the line.",
    [
      "States that it suggests a systematic error (a consistent shift, not random error).",
      "Gives a cause that changes every radius by the same amount, e.g. r measured from the bottom of the tube (too long).",
    ],
    "For mark 2, accept any constant offset in the radius measurement, even without a direction. Do not credit reaction time, miscounting or other random errors: they scatter points rather than shift the intercept. Do not credit friction at the tube: a steady friction force changes the tension, which changes the gradient, not the intercept."),

  sa(25,
    "Average time = (18.4 + 18.8) ÷ 2 = 18.6 s\nT = 18.6 ÷ 20 = 0.930 s\nv = 2πr ÷ T = (2 × π × 0.900) ÷ 0.930 = 5.655 ÷ 0.930 = 6.08 m s⁻¹",
    [
      "Calculates the average time 18.6 s and T = 0.930 s.",
      "Substitutes into v = 2πr/T with r = 0.900 m and their T.",
      "Gives v = 6.08 m s⁻¹, to three significant figures, with the unit.",
    ],
    "If the average is wrong but used correctly afterwards, award marks 2 and 3 (carry forward). Do not award mark 3 for 6.1 m s⁻¹ (three significant figures were asked for) or for a missing unit. Unit must be m s⁻¹ or m/s."),

  sa(26,
    "Resolving the forces on the stopper: the vertical component of the tension balances its weight (F sin θ = mg) and the horizontal component provides the centripetal force (F cos θ = mv²/r_circle). The real circle is r_circle = L cos θ, where L is the length of string measured. Substituting, the cos θ cancels, leaving F = 4π²mL/T². So with F = Mg, a graph of v² against L (calculating v from L) is still a straight line through the origin with gradient Mg/m, and the sag does not spoil the result.",
    [
      "Shows or states that the cos θ factors cancel when the forces are resolved (r_circle = L cos θ).",
      "States that v² against the measured length L is still a straight line (with gradient Mg/m).",
    ],
    "Accept a correct outline of the cancellation in words for mark 1, e.g. “the smaller circle and the smaller horizontal force both carry the same cos θ factor”. Do not accept “sag doesn't matter” or “the angle is small” without the reason."),

  sa(27,
    "Averaging repeated trials reduces only random errors, which scatter results either way — such as reaction time in starting and stopping the stopwatch, miscounting revolutions, or the paperclip wandering up and down. Systematic errors push every result the same way — such as friction at the tube or measuring r to the wrong point — so averaging does not reduce them; they have to be fixed by changing the equipment or the technique.",
    [
      "States that averaging reduces random errors.",
      "Gives a specific example of a random error (reaction time, miscounting, the clip wandering).",
      "States that systematic errors are not reduced by averaging, with a specific example (friction, r measured to the wrong point).",
    ],
    "Accept “errors that vary” for random and “consistent errors” for systematic. Examples must be specific: “human error” alone earns nothing."),

  sa(28,
    "Percentage uncertainty in r = (0.0005 ÷ 0.500) × 100 = 0.1%\nPercentage uncertainty in t = (0.2 ÷ 14.2) × 100 = 1.4%\nThe time contributes far more uncertainty (1.4% compared with 0.1%).",
    [
      "Calculates both percentage uncertainties: 0.1% for r and 1.4% for t.",
      "States that the time measurement contributes more uncertainty.",
    ],
    "Accept 1.41% for t. Accept “reaction time is the main source of uncertainty” for mark 2. Mark 2 can follow from their percentages if they compare them correctly."),

  sa(29,
    "The stopper's weight mg acts downward, and the only other force on it is the tension, so the tension must have an upward vertical component to hold it up. A horizontal string has no vertical component, so the string must sag.\nVertically: F sin θ = mg, and F = Mg, so sin θ = m ÷ M = 0.015 ÷ 0.100 = 0.15\nθ = sin⁻¹(0.15) = 8.6°\nThe angle depends only on the two masses, not on the speed or the radius.",
    [
      "States that the tension needs an upward (vertical) component to balance the stopper's weight, so the string cannot be horizontal.",
      "Uses F sin θ = mg with F = Mg to get sin θ = m/M (= 0.15).",
      "Gives θ = 8.6° (accept 8.6° to 8.7°).",
    ],
    "Do not credit “the string becomes horizontal if you spin fast enough”: with the tension fixed at Mg, sin θ = m/M whatever the speed. Using tan θ or cos θ in place of sin θ earns no mark 2 or 3."),

  sa(30,
    "The stopper is going too slowly for that radius. The tension Mg is more than the centripetal force it needs at that speed, so it is pulled inward: string is drawn down through the tube, the radius is getting smaller and the hanging mass falls, taking the clip with it. The whirler should speed up until the clip comes back to hover just below the tube, hold that speed steady, and restart the timing.",
    [
      "States that the stopper is going too slowly.",
      "States that the radius is decreasing (the stopper is pulled inward and string is drawn down through the tube).",
      "States that the whirler should speed up until the clip hovers just below the tube again (and restart the timing).",
    ],
    "A clip dropping away means string is being pulled down through the tube, so the length above the tube is getting shorter: do not credit “the radius is increasing”. Do not credit “there is not enough centripetal force”: at this speed the force Mg is more than is needed."),
];

export const answers: AnswerSet = Object.fromEntries(answerList);

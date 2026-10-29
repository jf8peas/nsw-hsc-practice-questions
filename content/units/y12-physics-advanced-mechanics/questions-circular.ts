import type { Question } from "@/lib/types";
import { mc, sa } from "./build";
import {
  bankBlockForces,
  bankSlope,
  bankedArrows,
  bankedRoad,
  beamTorquePanels,
  bowlTrack,
  carOnCorner,
  carouselMass,
  circlePointP,
  coasterDip,
  coinTurntable,
  conicalPendulum,
  conicalPendulumForces,
  conicalPendulumMass,
  curveSketch,
  dataTable,
  fanPoints,
  ferrisWheel,
  flagpoleRope,
  flatAndBankedCar,
  flatAndBankedCurve,
  forceDotPanels,
  horizontalVerticalCircles,
  loopTrack,
  marbleLoop,
  pendulumCone,
  planeBank,
  pointsGraph,
  rotatingDisc,
  rotorRide,
  satelliteForceVelocity,
  spannerNut,
  stack,
  swingAroundBody,
  tetherBall,
  torqueRuler,
  torqueVector,
  trainCurve,
  tubeApparatus,
  turntable,
  twoSpheresStrings,
  vectorPairPanels,
  velodrome,
  verticalCircleMass,
  verticalCircleTopBottom,
  wheelSpanner,
  whirlingStopper,
} from "./diagram";

// PUBLIC — circular motion: MC m145–m180, SA s145–s180. Sources are shown with each question;
// see resources/topic006/06-transcription-log.md for every change made in transcription.
export const circularQuestions: Question[] = [
  mc(145, "Barker 2020 Trial, Q6",
    "Which of the following statements is INCORRECT about the work being done on an object undergoing circular motion in a horizontal plane?",
    [
      "No work is being done as the total energy is constant due to the potential energy and kinetic energy being constant.",
      "Force and displacement are perpendicular at each instant, so there is no displacement in the direction of the force and so W = Fs = 0.",
      "No work is being done as the total energy is constant due to the fact that the speed and height of the object do not change.",
      "Displacement is in the direction of the force and so W = Fs = a constant, causing work to be done on the object.",
    ]),

  mc(146, "Barker 2020 Trial, Q20",
    "A tether ball is swinging around a pole in uniform circular motion on a horizontal plane as shown below.\nWhich of the following expression would correctly determine the mass of the ball?",
    ["m = F_T cos θ / g", "m = √(F_c r / v)", "m = g r tan θ / v²", "m = F_c g / tan θ"],
    { svg: tetherBall(), alt: "A ball on a string tied to the top of a vertical pole moves in a horizontal circle around the pole. The string makes angle θ with the pole. Two forces act on the ball: the tension F_T along the string towards the pole top, and the weight F_g straight down." }),

  mc(147, "Cherrybrook Tech 2025 Trial, Q13",
    "A ball that is attached to a ceiling with a thin string is undergoing uniform circular motion, as shown in the diagram.\nWhich of the following is the correct expression for calculating θ?",
    ["tan⁻¹(v²/rg)", "sin⁻¹(mg/T)", "sin⁻¹(m²v²g/r)", "tan⁻¹(mv²/rg)"],
    { svg: conicalPendulum(), alt: "A ball hangs from the ceiling on a string and moves in a horizontal circle of radius r. The string makes angle θ with the vertical." }),

  mc(148, "Girraween 2020 Trial, Q3",
    "Gerard K O'Neill was a champion of space colonisation. He designed a rotating ring measuring 513 m in diameter that would have people living on the inside. The rotation would simulate Earth gravity of 9.8 N kg⁻¹ within the ring.\nAt what velocity must the ring be spinning to produce centripetal acceleration the same as Earth's gravity?",
    ["50 m s⁻¹", "71 m s⁻¹", "5.0 × 10³ m s⁻¹", "25 × 10³ m s⁻¹"]),

  mc(149, "Hornsby Girls 2021 Trial, Q3",
    "A 50 g mass is rotating at 25 revolutions per minute at 15 cm from the centre of a turntable.\nHow would the angular velocity of this mass change if it continued to rotate with the same frequency, but was moved to a position 20 cm from the centre?",
    [
      "The angular velocity would be 1.5 times greater.",
      "The angular velocity would decrease by one third.",
      "The angular velocity would decrease by two thirds.",
      "The angular velocity would not change.",
    ],
    { svg: turntable(), alt: "A small mass sits on a turntable 15.0 cm from the spindle at its centre." }),

  mc(150, "Hornsby Girls 2021 Trial, Q4",
    "Which option best displays the directions of the centripetal force and instantaneous velocity of a satellite orbiting the earth?",
    ["Diagram A", "Diagram B", "Diagram C", "Diagram D"],
    { svg: satelliteForceVelocity(), alt: "Four diagrams of a satellite at the top of a circular orbit around Earth. (A) centripetal force arrow points up (away from Earth); velocity is horizontal (tangent to the orbit). (B) centripetal force points up; velocity points slightly downward of horizontal. (C) centripetal force points down towards Earth's centre; velocity points slightly downward of horizontal. (D) centripetal force points down towards Earth's centre; velocity is horizontal (tangent to the orbit)." }),

  mc(151, "Hornsby Girls 2021 Trial, Q9",
    "The figure below shows a vehicle travelling in a horizontal circle at constant speed on a frictionless banked track.\nWhich arrow, A, B, C or D, represents the direction of the normal force on the vehicle?",
    ["Arrow A", "Arrow B", "Arrow C", "Arrow D"],
    { svg: bankedArrows(), alt: "A car on a track banked at angle θ. Four arrows start at the car: A points up and away from the track, perpendicular to its surface; B points horizontally (towards the low side of the bank); C points down along the slope; D points vertically down." }),

  mc(152, "Hornsby Girls 2021 Trial, Q14",
    "When pushing on a very heavy door to close it which of the following describes how to achieve maximum torque?",
    [
      "The force should be applied at right-angles to the door at the smallest distance possible from the hinge",
      "The force should be applied at 45° to the door at the smallest distance possible from the hinge",
      "The force should be applied at right-angles to the door at the middle distance between the outer edge of the door and end of the hinge",
      "The force should be applied at right-angles to the door at the largest distance possible from the hinge",
    ]),

  mc(153, "James Ruse 2020 Trial, Q2",
    "A buggy is rounding a banked circular track on the Moon. In order to safely negotiate the bend, what will the critical speed depend on?",
    [
      "The banking angle, the sideways frictional force between the tyres and the tracks and the radius of the circular track",
      "The banking angle, the radius of the circular track and the gravitational field strength of the Moon",
      "The radius of the circular track, the sideways frictional force between the tyres and the tracks and the gravitational field strength",
      "The banking angle, the sideways frictional force between the tyres and the track and the gravitational field strength",
    ]),

  mc(154, "James Ruse 2021 Trial, Q10",
    "A rider in the \"rotor\" in an Amusement Park finds herself stuck with her back to the wall as the floor gradually falls down while the rotor reaches its optimum safe speed.\nWhich diagram correctly shows the forces acting on her?",
    ["Diagram A", "Diagram B", "Diagram C", "Diagram D"],
    {
      svg: stack([
        rotorRide(),
        forceDotPanels([
          { label: "A", arrows: ["up", "down", "left"] },
          { label: "B", arrows: ["left", "right", "down"] },
          { label: "C", arrows: ["left", "down"] },
          { label: "D", arrows: ["up", "down", "left", "right"] },
        ]),
      ], { dir: "column", align: "center" }),
      alt: "A rider stands with her back against the inside wall of a spinning vertical cylinder of radius R; she is on the right-hand side, so the centre is to her left. Four force diagrams, each a dot with arrows: A — up, down and left (towards the centre); B — left, right and down; C — left and down; D — up, down, left and right.",
    }),

  mc(155, "James Ruse 2021 Trial, Q12",
    "To safely negotiate curved section of roads at some critical speed, the roads are usually banked, as shown below.\nWhich of the following statements is correct?",
    [
      "A component of the normal reaction force provides the frictional force, parallel to the inclined plane of the road.",
      "At speeds lower than the critical speed, the car will tend to slide up the inclined plane of the road, while the frictional force acts down the plane.",
      "A component of the normal reaction force provides the centripetal force, directed towards the centre of the curved section of the road.",
      "At speeds greater than the critical speed, the car will tend to slide down the inclined plane of the road, while the frictional force acts up the plane.",
    ],
    { svg: bankedRoad(), alt: "A car on a road banked at angle θ to the horizontal." }),

  mc(156, "James Ruse 2022 Trial, Q8",
    "A person pulls on a rope attached to the top of a flagpole with a tension force of 350 N.\nWhat is the magnitude of the torque the person exerts on the flagpole, which is attached to the ground at its base?",
    ["τ = 7.2 × 350 sin 39° N m", "τ = 5.0 × 350 sin 39° N m", "τ = 7.2 × 350 sin 51° N m", "τ = 5.0 × 350 sin 51° N m"],
    { svg: flagpoleRope(), alt: "A 5.0 m vertical flagpole. A 7.2 m rope runs from the top of the pole down to a person on the ground. The rope makes 51° with the pole and 39° with the horizontal." }),

  mc(157, "James Ruse 2024 Trial, Q2",
    "An object is moving in a horizontal circle on a string with a constant angular velocity ω. The tension in the string, which is approximately horizontal, is F. If ω is doubled while all the other quantities are kept constant, what will the tension in the string become?",
    ["4F", "2F", "F/2", "F/4"]),

  mc(158, "James Ruse 2024 Trial, Q4",
    "An object is executing uniform circular motion, as shown in the figure below.\nAt position P, which of the following shows the directions of instantaneous velocity and acceleration?",
    ["Pair A", "Pair B", "Pair C", "Pair D"],
    {
      svg: stack([
        circlePointP(),
        vectorPairPanels([
          { label: "A", v: -90, a: -90 },
          { label: "B", v: -90, a: 90 },
          { label: "C", v: -90, a: 0 },
          { label: "D", v: -90, a: 180 },
        ]),
      ], { dir: "column", align: "center" }),
      alt: "A circle with its centre marked; an arrowhead at the top of the circle points to the left, so the object moves anticlockwise. P is the leftmost point of the circle. Four pairs of arrows (v, a): A — v down, a down; B — v down, a up; C — v down, a to the right; D — v down, a to the left.",
    }),

  mc(159, "Knox 2020 Trial, Q13",
    "A Knox student used the following experimental setup to investigate torque. At one point in the experiment they set m₂ to 100 g. The mass m₃ was then moved so that the ruler was horizontally balanced. At this point, r₃ was measured to be 39.0 cm.\nWhat is the value of m₃?",
    ["188 g", "241 g", "265 g", "506 g"],
    { svg: torqueRuler(), alt: "A ruler balanced on a pivot. On the left hang m₁ = 150 g at r₁ = 49.0 cm and m₂ (varied) at r₂ = 30.0 cm from the pivot. On the right hangs m₃ (unknown, constant mass) at distance r₃." }),

  mc(160, "Knox 2022 Trial, Q16",
    "A student conducted an experiment as shown below to measure the mass of a rubber stopper being swung in uniform circular motion with a radius of 0.50 m.\nThe student changed the number of metal washers hanging from the cord, and then measured the period of the rubber stopper as it moved in circular motion. The student produced the graph below to present the data collected.\nDetermine the mass of the rubber stopper.",
    ["0.000755 kg", "0.0725 kg", "0.228 kg", "0.456 kg"],
    {
      svg: stack([
        whirlingStopper(),
        pointsGraph({
          xMax: 4, yMax: 0.6, xStep: 0.5, yStep: 0.1, minor: 1, xLabel: "1/T² (s⁻²)", yLabel: "Hanging mass (kg)",
          points: [[2.05, 0.3], [2.45, 0.358], [2.9, 0.424], [3.3, 0.482], [3.68, 0.538]],
          curve: [[0, 0], [3.7, 0.5406]],
          marks: [{ at: [3.4, 0.575], label: "y = 0.1461x" }],
        }),
      ], { dir: "column", align: "center" }),
      alt: "Apparatus: a rubber stopper of mass m is whirled in a horizontal circle on a cord that passes down through a glass tube (ignore friction) to hanging metal washers; a position marker on the cord keeps the radius fixed. Graph of hanging mass (kg) against 1/T² (s⁻²): five points from (2.05, 0.30) to (3.68, 0.54) on a straight line through the origin, labelled y = 0.1461x.",
    }),

  mc(161, "Knox 2023 Trial, Q8",
    "A fan has three points marked on it X, Y and Z as shown below.\nAs the fan blade spins, the angular speed and linear speed of points X, Y and Z are measured.\nRank the angular and linear speed of points X to Z.",
    [
      "Angular speed and linear speed both increase from X to Z.",
      "Angular speed is constant, linear speed increases from X to Z.",
      "Angular speed is constant, linear speed increases from Z to X.",
      "Linear speed is constant, angular speed increases from X to Z.",
    ],
    { svg: fanPoints(), alt: "A three-bladed fan. Points X, Y and Z are marked along one blade: X nearest the hub, then Y, then Z nearest the tip." }),

  mc(162, "Kotara 2020 Trial, Q7",
    "A motorcyclist is cornering on a banked, circular track. Which combination of changes in the bank angle θ and the coefficient of friction μ will result in the greatest increase in the motorcyclist's cornering speed?",
    ["Decrease θ, increase μ", "Increase θ, increase μ", "Increase θ, decrease μ", "Decrease θ, decrease μ"],
    { svg: bankedRoad({ rider: true, label: "cornering" }), alt: "A motorcyclist on a track banked at angle θ, cornering." }),

  mc(163, "Newington 2019 Trial, Q6",
    "Consider the following diagrams showing forces being applied to four identical beams, but the magnitudes and directions of the forces are different, and the axis of rotation also varies. Which alternative would apply the maximum torque onto the beam?",
    ["Beam A", "Beam B", "Beam C", "Beam D"],
    { svg: beamTorquePanels(), alt: "Four 2.0 m beams. (A) Axis at the left end; the beam rises at 15° above the horizontal; a 2.9 N force acts vertically down at a point 0.7 m from the far end (1.3 m from the axis). (B) Horizontal beam with the axis 1.4 m from the left end; a 5.3 N force acts vertically down at the right end (0.6 m from the axis). (C) Axis at the lower end; the beam leans at 30° to the vertical; a 3.4 N force acts vertically down at the top end, at 30° to the beam. (D) Axis at the middle of the beam; the beam is at 45° to the vertical; a 4.2 N force acts vertically down at the upper end, 1.0 m from the axis, at 45° to the beam." }),

  mc(164, "Newington 2023 Trial, Q3",
    "In cycling, it is important for the nuts on bike seats to be tightened appropriately so they do not come loose during a race. Before a race, a cyclist tightens the nuts with a 50.0 cm spanner and applied a force of 70.0 N at an angle of 70° to the spanner, as shown in the diagram.\nWhat magnitude of torque has the cyclist applied to the nut?",
    ["11.97 N m", "32.89 N m", "1197.07 N m", "3289.92 N m"],
    { svg: spannerNut(), alt: "A spanner on a nut. A 70.0 N force is applied at the far end of the handle at 70° to the spanner." }),

  mc(165, "Newington 2024 Trial, Q13",
    "An 0.800 kg mass is swinging in a horizontal circle on the end of a conical pendulum as shown.\nThe radius of the circle r is 0.25 m and the period T is 2.0 s.\nWhich row of the table shows the correct kinetic energy and the correct amount of work done on the mass during one full revolution?",
    ["Kinetic energy 0.79 J; work done zero", "Kinetic energy 0.25 J; work done 0.63 J", "Kinetic energy 0.50 J; work done 1.58 J", "Kinetic energy 0.25 J; work done zero"],
    { svg: conicalPendulumMass(), alt: "A 0.800 kg mass on a string from the ceiling moves in a horizontal circle of radius 0.25 m with period T = 2.0 s." }),

  mc(166, "Normanhurst Boys 2020 Trial, Q3",
    "Consider a car of mass m travelling with a constant velocity v around a corner of radius r as shown below:\nWhich of the following statements best describes the net force on the car when it is at the position shown above?",
    [
      "There is no net force on the car as it is moving with uniform circular motion.",
      "The net force depends on the v, m, and r and is directed towards the centre",
      "The net force depends on the v, m, and r and is directed towards the west.",
      "The net force will be the sum of the centripetal force and the gravitational force acting on the car.",
    ],
    { svg: carOnCorner(), alt: "A circle of radius r seen from above. The car is at the westernmost point of the circle; a compass at the car shows N up, S down, W to the left and E to the right (towards the centre)." }),

  mc(167, "North Sydney Boys 2019 Trial, Q14",
    "A mass on a banked track is undergoing circular motion and remaining at a constant height on the banked track\nWhich of the following expressions describes the centripetal force due to the banked track.",
    ["N sin θ", "N cos θ", "mg sin θ", "mg cos θ"],
    { svg: bankBlockForces(), alt: "A mass m on a track banked at angle θ. The normal force N acts perpendicular to the track surface; the weight mg acts vertically down." }),

  mc(168, "North Sydney Boys 2023 Trial, Q2",
    "The centripetal force that causes a car to go round a bend in the road is provided by",
    [
      "the force produced by the car engine acting on the wheels.",
      "the friction between the tyres and the road.",
      "the weight of the car.",
      "the force exerted by the driver on the steering wheel.",
    ]),

  mc(169, "North Sydney Girls 2022 Trial, Q3",
    "An object travels in circular motion due to a centripetal force F. What is the centripetal force acting on the object when the radius of the circle halves and the kinetic energy of the object doubles?",
    ["F/4", "F", "2F", "4F"]),

  mc(170, "North Sydney Girls 2023 Trial, Q17",
    "A particle P is placed at a height h above the ground on a loop-the-loop track as shown in the diagram below. The radius of the loop is r.\nIf P is released from rest, what is the minimum value of h in order for P to complete the loop?",
    ["2r", "2.5r", "3r", "3.5r"],
    { svg: loopTrack(), alt: "A particle P at height h on a straight ramp that leads down into a vertical circular loop of radius r on the ground." }),

  mc(171, "North Sydney Girls 2024 Trial, Q7",
    "A 0.20 kg mass is whirled around in a vertical circle on the end of a light string with a length of 0.9 m.\nAt the top point of the circle the speed of the mass is 8.2 m s⁻¹.\nWhat is the tension in the string at this point?",
    ["10.0 N", "13.0 N", "15.0 N", "17.0 N"],
    { svg: verticalCircleMass(), alt: "A 0.20 kg mass on a 0.90 m string moves in a vertical circle; it is shown at the top of the circle." }),

  mc(172, "North Sydney Girls 2024 Trial, Q8",
    "An engineer is designing a banked circular curve of radius 25.0 m in a new bicycle velodrome for the Paris Olympics.\nDiagram A shows the bicycle approaching the banked section and diagram B shows the front view of a bicycle moving out of the page as it rounds the banked curve.\nThe bicycle is travelling at 11 m s⁻¹ on the banked section. At this speed there are no sideways frictional forces between the wheels and the road surface.\nWhich one of the following is closest to the angle of the banked bend?",
    ["2.6°", "10.0°", "26.0°", "30.0°"],
    { svg: velodrome(), alt: "Diagram A: plan view of the velodrome bend, radius 25 m, with a bicycle approaching it. Diagram B: front view of a rider on a track banked at angle θ." }),

  mc(173, "Pymble 2022 Trial, Q4",
    "A road has a curve of radius 63 m and is banked at an angle of 12°. The diagram shows a car approaching the curve in wet, slippery conditions.\nAssuming that there is no friction, calculate the maximum speed at which the car can safely make the turn.",
    ["6.07 km h⁻¹", "11.5 km h⁻¹", "36.5 km h⁻¹", "41.2 km h⁻¹"],
    { svg: bankedRoad(), alt: "Cross-section of the curve: a car on a road banked at angle θ (12°). (The original shows the car approaching the curve from above.)" }),

  mc(174, "Pymble 2022 Trial, Q10",
    "A student carries out an investigation to find the relationship between the centripetal force, rotational speed and radius of an object moving in a uniform, circular motion. The student attaches a rubber stopper to a hanging mass using a string that passes through a tube and swings the rubber stopper around the tube, as shown in the diagram. As the rubber stopper is swung, the hanging mass rises and falls depending on the rotational speed of the stopper. When the hanging mass neither rises nor falls, the radius of the stopper's path is measured.\nWhich row of the table identifies the variables for this investigation?",
    [
      "Independent: hanging mass; dependent: length of string; controlled: mass of rubber stopper, rotational speed",
      "Independent: rotational speed; dependent: length of string; controlled: hanging mass, rotational speed",
      "Independent: mass of rubber stopper; dependent: rotational speed; controlled: hanging mass, length of string",
      "Independent: rotational speed; dependent: radius of stopper path; controlled: mass of rubber stopper, length of string",
    ],
    { svg: tubeApparatus({ tube: "tube", mass: "hanging mass", stopper: "rubber stopper" }), alt: "A string runs horizontally from a rubber stopper to the top of a vertical tube, down through the tube, to a hanging mass." }),

  mc(175, "Shore 2021 Trial, Q3",
    "The speed limit for a train taking a curve on level ground is determined by the maximum safe sideways force applied to the rails.\nThe figure shows a train at position P taking a circular curve of radius 200 m on horizontal ground, at a constant speed of 60 km h⁻¹ which is the speed limit for this section of curved track. The radius of a curve track that has a speed limit 120 km h⁻¹ is:",
    ["80 m", "400 m", "600 m", "800 m"],
    { svg: trainCurve(), alt: "A train at position P on a curved section of track, moving along the curve." }),

  mc(176, "Sydney Boys 2019 Trial, Q4",
    "A class undertook a depth study in pairs to investigate centripetal force using the apparatus below.\nOne day a student was sick and their partner had to interpret their results. The lab partner found a graph with unlabelled variables as shown below.\nWhich pair of variables was most likely graphed?",
    ["F and v", "F and r", "m and r", "a and v/r"],
    {
      svg: stack([tubeApparatus({ tube: "Glass tube", mass: "Masses", stopper: "", showR: true }), curveSketch()], { dir: "column", align: "center" }),
      alt: "Apparatus: a stopper whirled in a horizontal circle of radius r on a string that passes down through a glass tube to hanging masses. Graph: unlabelled axes; the curve starts at the origin and curves upwards ever more steeply (like y ∝ x²).",
    }),

  mc(177, "Sydney Boys 2019 Trial, Q6",
    "The rollercoaster trolley shown has a constant speed through the dip. The curvature of the dip is circular.\nWhich of the following descriptions best analyses the forces acting on the trolley?",
    [
      "The normal force acting on the trolley is less than when travelling on a flat surface.",
      "The centripetal force is equal to the normal force.",
      "The sum of the normal force and the gravitational force is equal to the centripetal force.",
      "None of the above are correct.",
    ],
    { svg: coasterDip(), alt: "A rollercoaster trolley at the bottom of a dip in the track; the dip is part of a circle (shown dashed) whose centre is above the trolley." }),

  mc(178, "Sydney Boys 2022 Trial, Q5",
    "A student swings a 20 g metal ball on the end of a 1.10 m length of string around his body at a constant angular velocity of 4π rad s⁻¹.\nWhat is the magnitude of the centripetal force acting on the ball?",
    ["2.9 N", "3.0 N", "3.3 N", "3.5 N"],
    { svg: swingAroundBody(), alt: "A student holds a 1.10 m string above his head; the string makes 30° with the horizontal and the 20 g ball moves in a horizontal circle around his body." }),

  mc(179, "Sydney Boys 2025 Trial, Q1",
    "An object is flying in a circle of radius 5.0 m with a constant speed. One revolution takes 4.0 s. What is the object's centripetal acceleration?",
    ["12.3 m s⁻²", "24.0 m s⁻²", "7.9 m s⁻²", "8.0 m s⁻²"]),

  mc(180, "Sydney Grammar 2021 Trial, Q16",
    "Two cars, A and B, go around the same curved road (radius of curvature r). They both have the same maximum traction force between the road and the tyres. Car A has 1.5 times the mass of car B.\nIf the maximum speed that car A can go around the curve is v, then what is the maximum speed that car B can go around the curve?",
    ["0.81v", "1.2v", "1.5v", "2.25v"]),

  sa(145, 3, "Abbotsleigh 2023 Trial, Q21",
    "A ball of mass 0.130 kg is swung around on a string of length 95.5 cm at 5.00 revolutions per second in a vertical circle.\nDetermine the difference in tension on the ball at the top and the bottom points of the vertical circle.",
    { svg: verticalCircleTopBottom(), alt: "A ball on a string moves in a vertical circle around a fixed centre; it is shown at the top and at the bottom of the circle." }),

  sa(146, 7, "Abbotsleigh 2023 Trial, Q34",
    "A road has a banked corner of radius 66.0 m. The maximum frictional force that the road can provide is 1/6th of the normal contact force. A stationary car of mass 1000.0 kg when parked on this road will only just remain at rest rather than slide down the slope.\n(a) Calculate the angle of banking of the road. [3 marks]\n(b) Calculate the maximum speed at which the car could go around the bend. [4 marks]"),

  sa(147, 4, "Barker 2020 Trial, Q22",
    "A cyclist is travelling with uniform speed at a constant height of 3 meters on a banked curve on a theoretically frictionless circular track.\n(a) Draw a free body diagram labelling the forces acting on the cyclist and showing the direction of the net force. (Describe the diagram in words.) [2 marks]\n(b) If the banked curve was at an angle of 25° with a radius of 30 m, determine the net force acting on a 70 kg cyclist. [2 marks]"),

  sa(148, 6, "Baulkham Hills 2021 Trial, Q21",
    "An 800 kg F1 car travels on a rough banked track in circular motion as shown below. It is travelling at its max speed around this corner.\na) Label ALL forces acting on the car. And label the net force too with a dotted line. (Describe the forces and the net force in words.) [2 marks]\nb) If the radius of the track is 100 m and the coefficient of friction of the track is 0.30, find the max speed at which the car can travel around the track. [4 marks]",
    { svg: bankSlope({ angleLabel: "30°" }), alt: "A car on a track banked at 30° to the horizontal (cross-section)." }),

  sa(149, 6, "Baulkham Hills 2023 Trial, Q23",
    "A year 12 Physics student who owned a motorcycle decided to give up riding it as he was worried for his safety, especially at very high speeds. Therefore, he sold his motorbike and purchased a 1,500 kg car. When driving his car, he remembered what he learned in class about travelling around curves and the forces involved.\nThe diagram below shows the student's new car travelling around curves of the same 12 m radius, but with the right hand curve banked, as shown below.\na) Determine the frictional force required by the 4 tyres in total to prevent the car skidding on the horizontal road if the student drives it at a speed of 30 km/h. [3 marks]\nb) Determine the angle of the banked track needed for the car to safely travel around the banked road if the car travels at 40 km/h assuming that there is no friction between the tyres and the road. [3 marks]",
    { svg: flatAndBankedCar(), alt: "Rear views of the car going around two curves of radius 12 m, both turning to the left. Left: the road is flat. Right: the road is banked at angle θ, sloping down towards the inside of the curve." }),

  sa(150, 2, "Caringbah 2020 Trial, Q25",
    "The diagram below shows a car travelling around a banked circular track. Without friction the car must travel at a speed of 10 m s⁻¹ to maintain a constant radius. When friction is taken into account it can travel anywhere between 7 and 13 m s⁻¹ and maintain a constant radius.\nDraw arrows on diagram above to indicate the forces including friction, acting on the car when it is travelling at 8 m s⁻¹. (Describe the forces and their directions in words.)",
    { svg: bankSlope(), alt: "Front view of a car on a track banked at angle θ; the track slopes down towards the inside of the curve (to the left)." }),

  sa(151, 4, "Cherrybrook Tech 2025 Trial, Q32",
    "A car is travelling on a road that is banked at an angle of θ.\nWhen the car travels at the design speed of this road, there is no sideway friction between the tyres and the road.\n(a) Show how the design speed equation for v can be derived as shown below.\nv = √(r g tan θ) [2 marks]\n(b) Explain what will occur if the car travels slower than the design speed. [2 marks]",
    { svg: bankSlope(), alt: "Front view of a car on a road banked at angle θ." }),

  sa(152, 4, "Cheltenham Girls 2009 Trial, Q17",
    "A student spins a 1.2 kg rock on a string around above her head horizontally in an experiment which aims to model how satellites orbit the Earth. The student counts 3 orbits per second when the string produces an orbit radius of 35 cm.\n(a) Calculate the centripetal force acting on the rock. [2 marks]\n(b) Identify two forces acting on the rock, and describe their effects on the revolving rock in this situation. [2 marks]"),

  sa(153, 5, "Girraween 2024 Trial, Q23",
    "A race car is moving around a banked circular track that has a radius of 90.0 m and an angle of banking of θ degrees, as shown in the diagram.\nThe car has a constant speed.\na) On the diagram, clearly show all of the forces acting on the car using labelled arrows. (Describe the forces in words.) [2 marks]\nb) If the angle of banking is 10°, find the speed necessary so that no sideways force needs to be exerted between the tyres and the track. [3 marks]",
    { svg: bankSlope({ trackLabel: "banked track" }), alt: "A car on a banked track at angle θ to the horizontal." }),

  sa(154, 5, "Hornsby Girls 2019 Trial, Q23",
    "Students carried out an experiment to determine the relationship between the radius and velocity for a 42 g mass moving with a uniform circular motion. The centripetal force was kept constant for each variation in radius. The time for 10 complete cycles was measured. The results are shown in the table below.\nThey were asked by their teacher to use all the results to determine the magnitude of the constant centripetal force.\nList and explain the steps of the analysis required to calculate the centripetal force. (You are not required to calculate the force.)",
    {
      svg: dataTable({ headers: ["Radius of turn (cm)", "time for 10 cycles (s)"], rows: [["10", "4.3"], ["20", "6.1"], ["30", "7.3"], ["40", "8.5"], ["50", "9.5"], ["60", "10.1"]], colWidths: [150, 150] }),
      alt: "Table of radius of turn (cm) and time for 10 cycles (s): 10, 4.3; 20, 6.1; 30, 7.3; 40, 8.5; 50, 9.5; 60, 10.1.",
    }),

  sa(155, 6, "James Ruse 2019 Trial, Q23",
    "(a) Draw and use appropriate labels to show the forces acting on a car, mass, m, moving around a banked track:\n(i) with no friction\n(ii) with friction\n(Describe the forces in words for each case.) [4 marks]\n(b) A road with a turn of radius 125 m is being designed for a speed of 18.0 m s⁻¹.\nAt what angle should the turn be banked? [2 marks]",
    { svg: stack([bankSlope({ mass: true, width: 180, title: "(i) with no friction" }), bankSlope({ mass: true, width: 180, title: "(ii) with friction" })]), alt: "Two identical diagrams, (i) with no friction and (ii) with friction: a block of mass m on a track banked at angle θ." }),

  sa(156, 6, "James Ruse 2019 Trial, Q24",
    "The Hubble space telescope was launched in 1990 into a circular orbit near to the Earth. It travels around the Earth once every 97 minutes.\n(a) Calculate the angular speed of the Hubble telescope. [2 marks]\n(b) (i) Given the relationship between angular speed and linear speed is ω = v/r, calculate the radius of the orbit of the Hubble telescope. [2 marks]\n(ii) The mass of the Hubble telescope is 1.1 × 10⁴ kg.\nCalculate the magnitude of the centripetal force that acts on it. [2 marks]"),

  sa(157, 5, "James Ruse 2022 Trial, Q35",
    "A carousel is a children's ride that rotates at a constant angular velocity. A mass m is attached by a string to one of the vertical bars at a distance R from the center of the carousel. The mass hangs at an angle θ when the ride is rotating with a constant angular velocity of ω.\na) Draw a free body diagram showing the forces acting on the mass, to scale. Indicate the net force with a dotted arrow. (Describe the diagram in words.) [2 marks]\nb) Explain, qualitatively and quantitatively, how the angle θ would change if the string was attached to a pole at a distance ½R from the center of the carousel while it is still rotating at the same constant angular velocity ω.\nYou may assume the angle θ is small. [3 marks]",
    { svg: carouselMass(), alt: "Sketch of the carousel: a central column with a vertical bar at distance R from the centre. A mass m hangs from the top of the bar on a string that makes a small angle θ with the vertical, swinging outwards. (The original also shows a photograph of a carousel.)" }),

  sa(158, 4, "James Ruse 2024 Half-yearly, Q18",
    "Mr. Moraleda is able to apply a maximum force of 85 N. He tries to use a 32 cm long spanner to turn a stuck nut, which requires 25 N m of torque to turn.\n(a) Explain whether Mr. Moraleda would be able to turn the nut if he applied his maximum force at the optimum angle. [2 marks]\n(b) Outline a technical solution that can help Mr. Moraleda to turn another stuck nut which requires 40 N m of torque to undo. [2 marks]"),

  sa(159, 3, "James Ruse 2024 Trial, Q28",
    "A motor-racing track has banked quarter-circle turns. Racing cars travel around the turns at different radii and speeds. Data are collected when the centripetal acceleration is not caused by the frictional force on the tyres. The graph below shows the data collected.\nUsing the graph, calculate the banking angle of the turns.",
    {
      svg: pointsGraph({
        xMax: 200, yMax: 280, xStep: 25, yStep: 40, minor: 1, xLabel: "r (m)", yLabel: "v² (m² s⁻²)",
        points: [150, 155, 160, 165, 170].map((r) => [r, +(1.55 * r).toFixed(1)] as [number, number]),
        curve: [[0, 0], [170, 263.5]],
      }),
      alt: "Graph of v² (m² s⁻², 0 to 280) against r (m, 0 to 200). Five data points between r = 150 m and 170 m (v² from about 232 to 264) lie on a straight line through the origin; the line passes through about (100, 155).",
    }),

  sa(160, 4, "Knox 2020 Trial, Q26",
    "A student has an object tied to the end of a rope. They first swing the object in a flat, horizontal circle as shown on the left below. They then swing the same object, with the same speed and radius, in a vertical circle as shown on the right below.\nUsing labelled force vectors on the diagrams above, compare the forces acting on the object when moving in horizontal and vertical uniform circular motion. You should consider points M, N, X and Y in your answer. (Describe the force vectors in words.)",
    { svg: horizontalVerticalCircles(), alt: "Left: a horizontal circle seen almost edge-on, with the object at points M (left) and N (right). Right: a vertical circle with the object at X (top) and Y (bottom)." }),

  sa(161, 7, "Knox 2023 Common Test 1, Q4",
    "Two road curves have the same radius of 65 m. One road is flat and has a suggested maximum speed of 70 km h⁻¹. One curve is banked at 12° and has a suggested maximum speed of 100 km h⁻¹.\nExplain, both qualitatively and quantitatively, the physics behind the difference in suggested maximum speeds on the two road curves for a 1000 kg car. Your answer must include appropriate annotations on the diagrams below. (Describe the forces you would draw in words.)",
    { svg: flatAndBankedCurve(), alt: "Top: plan view of a car on a flat, non-banked curve. Bottom: cross-section of a car on a banked curve." }),

  sa(162, 7, "Newington 2019 Trial, Q22",
    "A ball of mass 0.25 kg is attached to a string and is made to rotate with constant speed v along a horizontal circle of radius r = 0.33 m. The string is attached to the ceiling and makes an angle of 30° with the vertical.\n(a) (i) On the diagram above, draw and label arrows to represent the two forces acting on the ball in the position shown. (Describe the forces in words.) [2 marks]\n(ii) State and explain whether the ball is in equilibrium. [1 mark]\n(b) Determine the tension in the string. [2 marks]\n(c) Calculate the speed of rotation of the ball. [2 marks]",
    { svg: pendulumCone({ angle: "30°", radius: "r = 0.33 m" }), alt: "A ball on a string from the ceiling moves in a horizontal circle of radius 0.33 m; the string makes 30° with the vertical." }),

  sa(163, 9, "Newington 2022 Trial, Q25",
    "A student conducted several tests on circular motion in accordance with the diagram.\nMass A was swung on a circular path and mass B provided the necessary weight force.\nThe student measured the time for mass A to make 10 rotations. Averaged results after conducting three trails for each of the test conditions are presented in each row of the table.\n(a) Outline THREE different experiments conducted using the information from the table. [3 marks]\n(b) For Tests 5, 6 and 7, identify the dependent, independent and TWO controlled variables. [3 marks]\n(c) If the student repeated all of the tests with 20 rotations would the experiment that used 10 rotations or the experiment that used 20 rotations be more accurate and reliable? Justify your answer. [1 mark]\n(d) Assuming there are no frictional forces, derive an equation for the orbital radius of mass A in terms of v and g. Justify your answer. [2 marks]",
    {
      svg: stack(
        [
          tubeApparatus({ tube: "", mass: "mass B", stopper: "mass A", showR: true, rLabel: "radius" }),
          dataTable({
            headers: ["Test", "Mass of A\n(g)", "Mass of B\n(g)", "Radius of\ncircle (m)", "Average time for\n10 rotations (s)"],
            rows: [
              ["1", "50", "50", "0.125", "10"], ["2", "50", "50", "0.200", "13"], ["3", "50", "50", "0.250", "14"],
              ["4", "50", "50", "0.375", "17"], ["5", "50", "75", "0.125", "8"], ["6", "50", "100", "0.125", "7"],
              ["7", "50", "200", "0.125", "5"], ["8", "125", "50", "0.125", "16"], ["9", "250", "50", "0.125", "22"],
              ["10", "750", "50", "0.125", "27"],
            ],
            colWidths: [50, 80, 80, 90, 130], fontSize: 10,
          }),
        ],
        { dir: "column", align: "center" },
      ),
      alt: "Apparatus: mass A is swung in a horizontal circle of the stated radius on a string that passes down through a vertical tube; mass B hangs from the other end of the string below the tube. Table: Test, Mass of A (g), Mass of B (g), Radius of circle (m), Average time for 10 rotations (s). 1: 50, 50, 0.125, 10. 2: 50, 50, 0.200, 13. 3: 50, 50, 0.250, 14. 4: 50, 50, 0.375, 17. 5: 50, 75, 0.125, 8. 6: 50, 100, 0.125, 7. 7: 50, 200, 0.125, 5. 8: 125, 50, 0.125, 16. 9: 250, 50, 0.125, 22. 10: 750, 50, 0.125, 27.",
    }),

  sa(164, 4, "Newington 2023 Trial, Q22",
    "The diagram below shows a small ball of mass 1.8 kg travelling in a horizontal circular path at a constant speed while suspended from the ceiling by a 0.75 m long string.\n(a) Use labelled arrows the indicate the two physical forces acting on the ball. (Describe the forces in words.) [2 marks]\n(b) Calculate the speed of the ball. [2 marks]",
    {
      svg: pendulumCone({ angle: "25°", radius: "", stringLabel: "0.75 m", ballLabel: "ball", ceilingLabel: "ceiling" }),
      alt: "A ball hangs from the ceiling on a 0.75 m string and travels in a horizontal circle; the string makes 25° with the vertical.",
    }),

  sa(165, 5, "Newington 2024 Trial, Q27",
    "A new car has a maximum lateral acceleration of 0.96g, where 1 g is the equivalent to the magnitude of the acceleration due to gravity. This represents the maximum centripetal acceleration the car can withstand without spinning out on a circular track.\na) The car is travelling at 126 km/h, what is the minimum radius of the circular path the car can navigate safely? (Assume an unbanked track.) [3 marks]\nb) The driver decides to test the limits of the new car on a banked track, with the same radius calculated in Part (a), with an angle of 15° to the horizontal.\nWhat impact does this have on the maximum speed? Why? [2 marks]"),

  sa(166, 9, "North Sydney Boys 2022 Trial, Q20",
    "(a) A satellite goes round a planet at constant speed. Explain why, although its speed is constant, it is accelerating. [1 mark]\nIn the diagram below, a marble (small glass sphere) rolls down a track, the bottom part of which has been bent into a loop. The end A of the track, from which the marble is released, is at a height of 0.80 m above the ground. Point B is the lowest point and point C the highest point of the loop. The diameter of the loop is 0.35 m.\nThe mass of the marble is 0.050 kg. Friction forces and any gain in kinetic energy due to the rotating of the marble can be ignored.\nConsider the marble when it is at point C.\n(b) (i) On the diagram above, draw an arrow to show the direction of the resultant force acting on the marble. (Describe the direction in words.) [1 mark]\n(ii) State the names of the two forces acting on the marble. [2 marks]\n(iii) Deduce that the speed of the marble is approximately 3.0 m s⁻¹. [2 marks]\n(iv) Determine the resultant force acting on the marble and hence determine the reaction force of the track on the marble. [3 marks]",
    { svg: marbleLoop(), alt: "A straight track runs down from point A, 0.80 m above the ground, to a vertical circular loop of diameter 0.35 m standing on the ground. B is the bottom of the loop and C the top. A marble is on the track above A's foot." }),

  sa(167, 7, "North Sydney Girls 2022 Trial, Q27",
    "Planes are designed to produce lift force (F_L) at the wings perpendicular to the surface of the wing when it is flying. The magnitude of the lift force can be adjusted in flight by changing the shape of the wing. When a plane changes direction, it banks in a circular path whilst maintaining altitude. The forces acting on the plane during the bank are shown in the diagram below.\n(a) On the diagram above, accurately draw the centripetal force vector. (Describe its direction in words.) [1 mark]\n(b) Calculate the centripetal force acting on a 757 kg plane banking at an angle of 26° to the vertical whilst maintaining altitude. [3 marks]\n(c) The pilot adjusts the lift force to allow the plane to bank at an angle of 37° whilst maintaining altitude. Explain how the motion of the plane will be affected if the radius of the bank remains the same. Include relevant calculations. [3 marks]",
    { svg: planeBank(), alt: "A plane seen from behind, banked at angle θ to the vertical. The lift force F_L is perpendicular to the wings (tilted θ from the vertical) and the weight F_g acts vertically down." }),

  sa(168, 6, "North Sydney Girls 2023 Trial, Q27",
    "Coin A, is placed on a rotating disc at 1.35 m from the centre of the disc. It has a mass of 15.0 g. The disc begins to rotate and when the frequency of rotation reaches 2.5 Hz, the coin flies off the disc.\n(a) Give a reason for why Coin A flies off the disc. [1 mark]\n(b) Calculate the centripetal force experienced by Coin A just before it flies off. [2 marks]\nCoin A is now placed back onto its original position. Another identical coin, Coin B, is placed on the same rotating disc but closer to the centre of the disc. The disc begins to rotate.\n(c) Explain which coin will fly off the disc first. [3 marks]",
    { svg: rotatingDisc(), alt: "A rotating disc seen from above, turning anticlockwise. Coin A sits 1.35 m from the centre O." }),

  sa(169, 5, "North Sydney Girls 2024 Trial, Q23",
    "The London Eye is a tourist attraction designed to give passengers a panoramic view over London. The giant wheel completes two revolutions in one hour. Each capsule moves with a constant speed of 0.26 m s⁻¹ as it follows a circular path.\n(a) A person with a mass of 85.0 kg follows a circular path as they ride in one of the capsules.\nWhat is the magnitude and direction of the centripetal force acting on the person? [2 marks]\n(b) Explain the forces experienced by the person at point A compared to point B. [3 marks]",
    { svg: ferrisWheel(), alt: "A Ferris wheel with capsules spaced around the rim and a hub at the centre, standing on the ground. Point A is the capsule at the side of the wheel (level with the hub) and point B is the capsule at the top; the capsules move at 0.26 m s⁻¹. Not to scale." }),

  sa(170, 6, "Penrith 2019 Trial, Q22",
    "At Luna Park in Sydney there is a ride called \"The Rotor\". Here patrons enter a vertically oriented cylindrical chamber which will rotate rapidly, causing them to be pinned to the vertical wall as the floor drops away.\nThe rotor cylinder has a diameter of 10 m and rotates with a period of 2.50 s.\nA student of mass 65 kg is on the ride.\n(a) In the space below, sketch a free-body force diagram for the girl. (Describe the diagram in words.) [2 marks]\n(b) Identify on your diagram for part (a) any balanced and unbalanced forces. [2 marks]\n(c) Calculate the linear speed of the girl. [2 marks]",
    { svg: rotorRide(), alt: "A vertically oriented cylindrical chamber of radius R that spins about its vertical axis; a rider stands against the inside wall." }),

  sa(171, 6, "Pymble 2022 Trial, Q28",
    "A small 870 g mass is whirled around in a horizontal circle at one end of a 0.85 m length of string, forming a cone shape with angle q to the vertical. The string when hanging vertically will just support a load of 44 N without breaking.\n(a) Draw the force diagram, in the space provided for the spinning mass, showing the vectors and their vertical and horizontal components. (Describe the diagram in words.) [3 marks]\n(b) Calculate the angle q and the maximum angular speed in rad s⁻¹ of the mass before the string breaks. [3 marks]"),

  sa(172, 4, "Shore 2020 Trial, Q22",
    "A driver had a flat tyre. She struggled to remove the wheel until she used a spanner, rather than her hands, to undo the nut.\nThe diagram below models the set up she was using.\n(a) Explain why using a spanner made it easier to remove the nut. [2 marks]\n(b) Use an example calculation to show why it is most advantageous to put your hand at the far end of the spanner from the nut, rather than grip the middle of the spanner. [2 marks]",
    { svg: wheelSpanner(), alt: "A wheel nut with a 20 cm spanner on it; a force F is applied downwards at the far end of the spanner." }),

  sa(173, 6, "Sydney Boys 2019 Trial, Q22",
    "(a) A car is travelling at a constant speed on a frictionless banked track with a turning radius of 26.0 m, as shown in the diagram. The car maintains a constant height on the track. The centripetal force acting on the car is 3040 N.\nDetermine the mass of the car. [2 marks]\n(b) Determine the minimum coefficient of friction required if the car was to travel around an unbanked track of the same radius at half the speed from part (a). [4 marks]",
    { svg: bankSlope({ angleLabel: "15°" }), alt: "A car on a track banked at 15° to the horizontal." }),

  sa(174, 2, "Sydney Boys 2019 Trial, Q23",
    "In terms of mechanical energy, explain why the work done on a satellite moving in a constant circular orbit around the Earth is equal to zero."),

  sa(175, 6, "Sydney Boys 2025 Trial, Q21",
    "A lunar rover is navigating the surface of the Moon, where the gravitational acceleration is 1.62 m s⁻². The rover has a mass of 200 kg.\nIt drives over a circular hill of radius 30 m at a constant speed of 8.0 m s⁻¹.\n(a) Calculate the normal force acting on the rover at the top of the hill. [3 marks]\n(b) Explain the differences in normal force if the same hill were on Earth instead of the Moon. [3 marks]"),

  sa(176, 6, "Sydney Girls 2020 Trial, Q30",
    "A 55 g coin is placed on a horizontal turntable 15 cm from its centre as shown in the diagrams below. The turntable rotates at a constant rate in a counter clockwise direction as seen from above. The coin does not slip and the turntable completes one rotation every 500 ms.\n(a) On the figure labelled \"side view\", draw free body diagram to represent the forces acting on the coin. (You do not need to draw the arrows to scale.) (Describe the forces in words.) [3 marks]\n(b) Calculate the centripetal force on the coin and the frictional force between the coin and turntable. [3 marks]",
    { svg: coinTurntable(), alt: "Side view: the turntable seen edge-on with the coin sitting on it, to the right of the central axis. Overhead view: the turntable turning anticlockwise with the coin 15 cm from the centre." }),

  sa(177, 4, "Sydney Grammar 2022 Trial, Q34",
    "Two spheres A and B are attached to the ends of light inextensible strings XA and XB as shown below.\nThey are swung in horizontal circles so that the periods are the same.\n(a) Determine the ratio v_B/v_A of the speed of sphere B (v_B) to the speed of sphere A (v_A). [2 marks]\n(b) Determine the ratio a_B/a_A of the centripetal acceleration of sphere B (a_B) to the centripetal acceleration of sphere A (a_A). [2 marks]",
    { svg: twoSpheresStrings(), alt: "Two strings hang from the same point X. Sphere A swings in a horizontal circle of radius 0.20 m and sphere B in a horizontal circle of radius 0.30 m about the same vertical axis." }),

  sa(178, 6, "Sydney Grammar 2022 Trial, Q35",
    "A car of mass m = 1000 kg is travelling around a frictionless banked track (there is no friction between the wheel and the track) at an angle of θ = 30° to the horizontal and radius of r = 60 m.\n(a) For the car:\n(i) determine the magnitude of the force of the track on the car (i.e., the Normal force). [2 marks]\n(ii) determine the speed of the car required to maintain a constant radius of 60 m. [2 marks]\n(b) If the speed of the car is doubled, explain why the car would have to move higher up the incline (i.e., h becomes larger) to still go around the circular track without any sideways friction from the track. [2 marks]",
    { svg: bowlTrack(), alt: "Cross-section of a bowl-shaped banked track: the surface is flat at the bottom and gets steeper further out. The car sits at a point where the surface makes angle θ with the horizontal, at height h above the bottom and horizontal distance r from the axis of the circular track." }),

  sa(179, 2, "Sydney Grammar 2024 Trial, Q21",
    "Determine the magnitude and direction of the torque around the axis O.",
    { svg: torqueVector(), alt: "A rod from the axis O, of length r = 1.2 m, pointing up to the right. At its far end a force F = 6.4 N acts, at θ = 40° to the dashed line that extends the rod, directed down and to the right." }),

  sa(180, 4, "Sydney Grammar 2024 Trial, Q37",
    "The diagram below shows a mass, m, being swung in a horizontal circle on a string of length L.\nAs the mass is rotated faster the angle to the vertical, θ, changes.\nAnalyse the forces on the mass to explain why the vertical angle changes as the speed of the rotating mass is increased.",
    { svg: conicalPendulumForces(), alt: "A mass m on a string of length L from a fixed ceiling point, moving in a horizontal circle of radius r at depth h below the attachment point. The string makes angle θ with the vertical; the tension T acts along the string and the weight mg acts vertically down; the velocity is tangent to the circle." }),
];

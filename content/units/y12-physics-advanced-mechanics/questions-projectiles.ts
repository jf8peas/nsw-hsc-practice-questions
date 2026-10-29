import type { Question } from "@/lib/types";
import { mc } from "./build";
import {
  airResistancePanels,
  archerTarget,
  ballOffTable,
  cannon,
  carHillCliff,
  cliffThreeBalls,
  cliffThrow,
  componentArrowRows,
  cricketShots,
  dataTable,
  dropAndThrow,
  fourTrajectories,
  golfHoleMap,
  golfVectorTable,
  launchAngle,
  pathSXYZ,
  projectileTopY,
  rollercoasters,
  speedTimeGraphs,
  stack,
  stroboscopeGraph,
  trajectoryChoices,
  velocityComponents,
  velocityTimePairs,
  waterPipe,
} from "./diagram";

// PUBLIC — no answer keys. Projectile motion: MC m091–m144, SA s091–s144.
// Questions are copied word for word from school trial / half-yearly papers and show their
// source (constitution Principle V). Layout-only changes are listed in
// resources/topic006/06-transcription-log.md.

export const projectileQuestions: Question[] = [
  mc(91, "Abbotsleigh 2023 Trial, Q10",
    "Two projectiles are launched horizontally from the same height. However projectile B has twice the initial velocity of A. Which of the following statements is true? (u = initial velocity, t = time of flight, R = range)",
    [
      "u_Ax = ½u_Bx; u_Ay = u_By; t_A = t_B; R_A = ½R_B",
      "u_Ax = ½u_Bx; u_Ay = u_By; t_A = 2t_B; R_A = R_B",
      "u_Ax = ½u_Bx; u_Ay = u_By; t_A = t_B; R_A = R_B",
      "u_Ax = ½u_Bx; u_Ay = u_By; t_A = 2t_B; R_A = 2R_B",
    ]),

  mc(92, "Abbotsleigh 2025 Trial, Q17",
    "For an object thrown at 45° to the horizontal, what is the relationship between the horizontal range R and the maximum height H?",
    ["R = 16 H", "R = 8 H", "R = 4 H", "R = 2 H"]),

  mc(93, "Ascham 2024 Trial, Q4",
    "Two golfers, Sam and Kim, used different golf clubs to hit identical golf balls from the same place.\nSam’s ball went higher than Kim’s ball. Both golf balls first hit the ground 100m away from where they were hit.\nWhich set of vectors below best represents the horizontal and vertical components of the initial velocity of the two balls?",
    ["Row A", "Row B", "Row C", "Row D"],
    {
      svg: golfVectorTable([
        { label: "A", sam: [20, 56], kim: [48, 18] },
        { label: "B", sam: [48, 18], kim: [20, 56] },
        { label: "C", sam: [20, 56], kim: [20, 56] },
        { label: "D", sam: [48, 18], kim: [48, 18] },
      ]),
      alt: "A table of vectors with rows A to D. Each row shows a vertical and a horizontal arrow for Sam's ball, then for Kim's ball. Row A: Sam short vertical, long horizontal; Kim long vertical, short horizontal. Row B: Sam long vertical, short horizontal; Kim short vertical, long horizontal. Row C: both balls short vertical, long horizontal. Row D: both balls long vertical, short horizontal.",
    }),

  mc(94, "Ascham 2024 Trial, Q18",
    "A projectile is launched with an initial kinetic energy E.\nThe initial horizontal and vertical components of velocity are equal. Air resistance is negligible.\nWhat is the kinetic energy of the projectile at the highest point of the motion?",
    ["0", "¼E", "½E", "E"]),

  mc(95, "Barker 2020 Trial, Q10",
    "A projectile is fired horizontally from a particular height with an initial velocity of 45 m s⁻¹. At the same time, a second projectile is fired horizontally from the same height with an initial velocity of 9.0 m s⁻¹. The first projectile travels a distance of 180 m. The second projectile will travel a horizontal distance of",
    ["9.0 m", "36 m", "45 m", "90 m"]),

  mc(96, "Baulkham Hills 2021 Trial, Q1",
    "A 10g ball rolls off the edge of a 1m tall table at 2 m s⁻¹. How far from the edge of the table does the ball land?",
    ["9.1m", "90cm", "136cm", "64cm"]),

  mc(97, "Baulkham Hills 2021 Trial, Q9",
    "A projectile is fired from the ground at an angle of 45° to the horizontal and hits the ground 20m away. Find the max height of the projectile.",
    ["1.4m", "1.5m", "2m", "5m"]),

  mc(98, "Caringbah 2020 Trial, Q1",
    "How would an increase in the value of “g”, the acceleration due to gravity, affect the flight of a projectile launched with the same initial conditions?",
    [
      "decreased range; decreased maximum height",
      "decreased range, same maximum height",
      "same range, decreased maximum height",
      "same range, same maximum height",
    ]),

  mc(99, "Cheltenham Girls 2010 Half-yearly, Q5",
    "A ball is thrown into the air, leaving at an angle of 60° to the horizontal at 10.0 m s⁻¹. The maximum height reached by the ball is",
    ["0.44 m", "1.28 m", "3.86 m", "5.20 m"]),

  mc(100, "Cheltenham Girls 2010 Half-yearly, Q6",
    "On a calm day, high on a cliff overlooking the ocean, a girl threw a stone horizontally at 6.55 m s⁻¹ over the edge of the cliff. She then measured the time it took the stone to hit the water below and found it took 3.03 seconds.\nWhat is the height above the water from which the stone was projected?",
    ["19.65 m", "29.69 m", "44.99 m", "64.83 m"]),

  mc(101, "Cheltenham Girls 2011 Trial, Q2",
    "Two identical metal balls, X and Y, are released at the same time from the same height above horizontal ground. Ball X falls vertically from rest. Ball Y is projected horizontally as shown below. (Air resistance is negligible.)\nWhich of the following statements is correct?",
    [
      "Ball X hits the ground before ball Y because it travels a shorter distance.",
      "Ball Y hits the ground before ball X because its initial velocity is greater.",
      "The balls hit the ground at the same time because horizontal motion does not affect vertical motion.",
      "The balls hit the ground at the same time because they have equal weights.",
    ],
    {
      svg: dropAndThrow(),
      alt: "Balls X and Y start side by side at the same height. X falls straight down; Y follows a curved path and lands farther along the ground.",
    }),

  mc(102, "Cheltenham Girls 2008 Trial, Q2",
    "A car drives horizontally off the edge of a 30 m high cliff. What can we predict about the car’s motion during its fall?",
    [
      "The acceleration will increase.",
      "The total energy of the car will increase.",
      "The vertical component of the velocity of the car will increase.",
      "The horizontal component of the velocity will increase.",
    ]),

  mc(103, "Girraween 2024 Trial, Q6",
    "A projectile launched on Earth follows the trajectory labelled X, as shown.\nAnother projectile is launched with identical speed and angle but on the surface of a planet where the gravitational acceleration is less than 9.8 m s⁻².\nWhich trajectory would this other projectile follow? Air resistance can be ignored.",
    ["A", "B", "C", "D"],
    {
      svg: trajectoryChoices(),
      alt: "Height against distance. The solid trajectory X starts at the origin. Four dashed trajectories all start at the same point and angle: A is higher than X but lands sooner; B is lower than X but lands farther; C is lower than X and lands sooner; D is both higher than X and lands farther.",
    }),

  mc(104, "Girraween 2024 Trial, Q15",
    "A football is kicked from ground level over horizontal ground with a speed of 25.0 m/s at an angle of 30° towards a goal. The ball travels a horizontal distance of 12.0 m before crossing the goal line.\nAt what height does the ball cross the goal line?",
    ["0.83 m", "3.8 m", "5.4 m", "10.4 m"]),

  mc(105, "Gosford 2022 Trial, Q1",
    "Which statement about an object undergoing projectile motion is correct?",
    [
      "Its kinetic energy at point Y will be zero.",
      "Its potential energy at point Y is a minimum.",
      "Its kinetic energy will be the same at launch as it is at impact.",
      "Its kinetic energy on launch will be the same as the potential energy at point Y.",
    ],
    {
      svg: projectileTopY(),
      alt: "A projectile launched from the ground follows a symmetrical arch and lands on the ground. Point Y is at the top of the path.",
    }),

  mc(106, "Cheltenham Girls 2010 Half-yearly, Q1",
    "The horizontal velocity and vertical velocity of a projectile were measured. They are represented by the following vectors.\nThe actual velocity of the projectile is",
    ["7 m s⁻¹ N36.9°E", "7 m s⁻¹ N53.1°E", "10 m s⁻¹ N36.9°E", "10 m s⁻¹ N53.1°E"],
    {
      svg: velocityComponents(),
      alt: "Two vectors from one point: vertical velocity 6.0 m s⁻¹ north, and horizontal velocity 8 m s⁻¹ east. A compass shows north up and east to the right.",
    }),

  mc(107, "James Ruse 2019 Half-yearly, Q3",
    "A ball rolls off a horizontal table with velocity v. It lands on the ground a time T later at a distance D from the foot of the table as shown in the diagram below. Air resistance is negligible.\nA second heavier ball rolls off the table with velocity v. Which of the following is correct for the heavier ball?",
    [
      "Time to land: T; distance from table: D",
      "Time to land: T; distance from table: less than D",
      "Time to land: less than T; distance from table: D",
      "Time to land: less than T; distance from table: less than D",
    ],
    {
      svg: ballOffTable(),
      alt: "A ball leaves the edge of a table horizontally with velocity v and lands on the ground a distance D from the foot of the table.",
    }),

  mc(108, "James Ruse 2021 Trial, Q19",
    "Figures 1 and 2 show two designs for a rollercoaster. Both designs are frictionless and have an identical shape everywhere except between positions x₁ and x₂. Between these positions, rollercoaster A has a hill of height H, whereas on rollercoaster B, the cart leaves the track, flying through the air before landing safely on the other side.\nIn both designs, the cart starts from rest at the position shown.\nWhich of the following correctly describes the maximum height that the carts in rollercoaster A and B reach between positions x₁ and x₂?",
    [
      "Maximum height for A: equal to H; maximum height for B: equal to H",
      "Maximum height for A: equal to H; maximum height for B: less than H",
      "Maximum height for A: less than H; maximum height for B: equal to H",
      "Maximum height for A: less than H; maximum height for B: less than H",
    ],
    {
      svg: rollercoasters(),
      alt: "Figure 1, rollercoaster A: the cart starts at rest at height H, the track dips to a valley at x₁, rises over a hill of height H, dips to a valley at x₂ and rises again. Figure 2, rollercoaster B: the same start and the same valleys at x₁ and x₂, but there is no track between them; the track just past x₁ curves slightly upwards and the track resumes just before x₂.",
    }),

  mc(109, "James Ruse 2024 Half-yearly, Q1",
    "The picture shows a game of cricket\nThe picture shows two consecutive shots by the batsman. Both balls reach the same maximum height above the ground but ball Q travels twice as far as ball P.\nWhich of the following is different for balls P and Q?",
    ["Time of flight", "Initial velocity", "Gravitational force", "Gravitational acceleration"],
    {
      svg: cricketShots(),
      alt: "A batsman hits two balls. Both dashed paths reach the same maximum height; ball P lands at a point, and ball Q lands twice as far away. Air resistance is neglected.",
    }),

  mc(110, "Kincoppal 2023 Trial, Q2",
    "If two projectiles are launched at the same initial velocity but at different launch angles, which projectile will reach its maximum height first?",
    [
      "The projectile launched at a smaller angle",
      "The projectile launched at a larger angle",
      "Both projectiles will reach maximum height at the same time",
      "It depends on the mass of the projectiles",
    ]),

  mc(111, "Knox 2020 Trial, Q1",
    "A projectile is launched from ground level, at an angle.\nWhich of the following options shows how the horizontal and vertical components of its velocity change over time?",
    ["Row A", "Row B", "Row C", "Row D"],
    {
      svg: componentArrowRows([
        { label: "A", h: [26, 26, 26, 26], v: [-30, -30, -30, -30] },
        { label: "B", h: [26, 14, 14, 26], v: [30, 14, -14, -30] },
        { label: "C", h: [26, 14, 14, 26], v: [-30, -30, -30, -30] },
        { label: "D", h: [26, 26, 26, 26], v: [30, 14, -14, -30] },
      ]),
      alt: "Four rows, A to D, each showing four successive horizontal arrows then four successive vertical arrows. A: horizontal arrows all equal; vertical arrows all equal, pointing down. B: horizontal arrows long, short, short, long; vertical arrows long up, short up, short down, long down. C: horizontal long, short, short, long; vertical all equal, pointing down. D: horizontal arrows all equal; vertical arrows long up, short up, short down, long down.",
    }),

  mc(112, "Knox 2023 Trial, Q1",
    "A projectile is launched at a speed of 32.8 m s⁻¹ at an angle of 62° above the horizontal as shown below.\nCalculate the magnitude of the initial vertical and horizontal components of the velocity of the projectile.",
    [
      "Horizontal velocity 15.4 m s⁻¹; vertical velocity 29.0 m s⁻¹",
      "Horizontal velocity 29.0 m s⁻¹; vertical velocity 15.4 m s⁻¹",
      "Horizontal velocity 22.1 m s⁻¹; vertical velocity 24.2 m s⁻¹",
      "Horizontal velocity 24.2 m s⁻¹; vertical velocity 22.1 m s⁻¹",
    ],
    { svg: launchAngle(), alt: "A velocity arrow launched from the ground at an angle θ above the horizontal." }),

  mc(113, "Kotara 2020 Trial, Q3",
    "An object is thrown horizontally at time t = 0. At t = 0.5 s the object has travelled x metres horizontally and it has fallen y metres vertically.\nWhat is the initial velocity of the object and the vertical distance fallen at t = 1.0 s?",
    [
      "Initial velocity: x m s⁻¹; distance fallen at 1 s: 2y m",
      "Initial velocity: x m s⁻¹; distance fallen at 1 s: 4y m",
      "Initial velocity: 2x m s⁻¹; distance fallen at 1 s: 2y m",
      "Initial velocity: 2x m s⁻¹; distance fallen at 1 s: 4y m",
    ]),

  mc(114, "Newington 2019 Trial, Q1",
    "Consider an object undergoing projectile motion under an acceleration of gravity as shown in the figure below.\nChoose the most correct statement.",
    [
      "The instantaneous velocity at point Y will be zero.",
      "The vertical component of the velocity is a constant.",
      "The instantaneous vertical velocity will be the same at launch as at landing at impact.",
      "The initial horizontal velocity on launch will be the same as the final horizontal velocity.",
    ],
    { svg: projectileTopY(), alt: "A projectile launched from the ground follows a symmetrical arch and lands on the ground. Point Y is at the top of the path." }),

  mc(115, "Newington 2022 Trial, Q5",
    "A projectile is launched by a cannon as shown. Which of the following represents the acceleration of the particle at its maximum height?",
    ["↑ (upwards)", "↓ (downwards)", "↘ (down and to the right)", "→ (to the right)"],
    { svg: cannon(), alt: "A cannon on level ground pointing up to the right, with a cannonball just leaving it." }),

  mc(116, "Newington 2022 Trial, Q13",
    "Below is a diagram of several projectiles launched at the same speed and different angles. Which trajectory has the longest time of flight?",
    ["A", "B", "C", "D"],
    {
      svg: fourTrajectories(),
      alt: "Height against range for four trajectories from the same launch point. A is the highest and shortest; B is a little lower and lands farther; C is lower still and has the longest range; D is the lowest and lands at the same place as B.",
    }),

  mc(117, "Newington 2023 Trial, Q1",
    "Projectile A is launched on Earth with an initial speed of 40 m s⁻¹ at an angle of 30° to the horizontal.\nProjectile B is launched with the same initial conditions on a planet where the acceleration due to gravity is exactly half that on Earth.\nProjectile B’s path compared to projectile A will have:",
    [
      "Maximum height reached: equal; final speed: double",
      "Maximum height reached: equal; final speed: equal",
      "Maximum height reached: double; final speed: double",
      "Maximum height reached: double; final speed: equal",
    ]),

  mc(118, "Normanhurst Boys 2020 Trial, Q1",
    "A ball is thrown from S at an angle to the horizontal as shown in the diagram below:\nX, Y and Z are different points along the ball’s trajectory.\nWhich of the following best represent the velocity and acceleration of the ball?",
    [
      "Velocity at X, Y, Z: ↑, zero, ↓; acceleration at X, Y, Z: ↓, zero, ↓",
      "Velocity at X, Y, Z: ↗, →, ↘; acceleration at X, Y, Z: ↑, zero, ↓",
      "Velocity at X, Y, Z: ↗, →, ↘; acceleration at X, Y, Z: ↓, ↓, ↓",
      "Velocity at X, Y, Z: ↗, →, ↘; acceleration at X, Y, Z: ↗, zero, ↘",
    ],
    { svg: pathSXYZ(), alt: "A symmetrical trajectory from S on the ground. X is on the way up, Y is at the top and Z is on the way down." }),

  mc(119, "Normanhurst Boys 2021 Trial, Q1",
    "A stone of mass m is thrown upward at a 25° to the horizontal.\nAt the instant the stone reaches its highest point, why is the vertical component of the velocity zero?",
    [
      "The acceleration of the stone at that instant is zero.",
      "The net force acting upon the stone at that instant has magnitude mg.",
      "The stone’s kinetic energy has been converted to gravitational potential energy.",
      "The stone has no net force acting on it at the highest point.",
    ]),

  mc(120, "North Sydney Boys 2019 Trial, Q1",
    "Which of the following are NOT assumptions made in analysing the motion of projectiles",
    [
      "horizontal and vertical components are dependent on each other",
      "a constant acceleration due to gravity",
      "zero air resistance",
      "projectiles are point masses",
    ]),

  mc(121, "North Sydney Boys 2020 Trial, Q2",
    "Hole 12 at the local golf course is on a circular green, surrounded by a small lake and a sand trap. The golf course publishes a map (see figure 1) which shows the distance to the hole from the tee off position which are both at the same elevation.\nA golfer hits the golf ball in line with the hole with a velocity of 47.8 m s⁻¹ at an angle of 42.5° above the ground.\nWhere does the golf ball land?",
    ["in the sand.", "in the lake", "on the green", "in the hole"],
    {
      svg: golfHoleMap(),
      alt: "Figure 1: map of Hole 12 with a distance scale from the tee. The sand trap is between about 228 and 236 m, the circular green from 240 to 260 m with the hole at 250 m, and the lake from about 266 to 278 m.",
    }),

  mc(122, "North Sydney Boys 2020 Trial, Q6",
    "When an aeroplane is at an altitude of 500 m and moving horizontally at a speed of 160 m s⁻¹, a small object falls from it. In the period of time after the object falls until it hits the ground, which of the following describes the effect of including and excluding air resistance?",
    [
      "Time of flight will be longer and its horizontal displacement will be shorter with air resistance included",
      "Time of flight will be shorter and its horizontal displacement will be shorter with air resistance included",
      "Its horizontal displacement will be longer and vertical acceleration will be smaller with air resistance included",
      "Its vertical displacement will be shorter and vertical acceleration will be smaller with air resistance included",
    ]),

  mc(123, "North Sydney Boys 2022 Trial, Q1",
    "A stone is thrown with speed v from the top of a cliff of height H, as shown below.\nThe stone is thrown at an angle to the horizontal so that it rises to a height h above the top of the cliff before falling into the sea. The acceleration of free fall is g. Air resistance is negligible.\nWhich one of the following expressions correctly gives the speed of the stone as it hits the sea?",
    ["v + √(2gh)", "v + √(2gH)", "√(2g(h + H))", "√(v² + 2gH)"],
    {
      svg: cliffThrow(),
      alt: "A stone is thrown up at an angle with speed v from the top of a cliff of height H. It rises a height h above the cliff top, then falls into the sea.",
    }),

  mc(124, "North Sydney Boys 2023 Trial, Q3",
    "Which one of the following is a true statement concerning the vertical component of the velocity and the acceleration of a projectile when it is at its maximum height? (The acceleration of free fall is g.)",
    [
      "Vertical component of velocity: maximum; acceleration: zero",
      "Vertical component of velocity: maximum; acceleration: g",
      "Vertical component of velocity: zero; acceleration: zero",
      "Vertical component of velocity: zero; acceleration: g",
    ]),

  mc(125, "North Sydney Boys 2023 Trial, Q9",
    "The diagram below shows the path of a projectile in the absence of air resistance.\nWhich one of the following diagrams best represents the path of the projectile under the same initial conditions when the air resistance is taken into account? (The path in absence of air resistance is shown for comparison as a dotted line.)",
    ["Diagram A", "Diagram B", "Diagram C", "Diagram D"],
    {
      svg: airResistancePanels(),
      alt: "Top: the path with no air resistance, a symmetrical arch. Below, four diagrams each show that path dotted and a solid path. A: the solid path is lower and shorter, and comes down more steeply than it went up. B: the solid path reaches the same height but lands sooner. C: the solid path is lower but lands at the same place. D: the solid path is lower and lands slightly short, symmetrical.",
    }),

  mc(126, "North Sydney Boys 2025 Trial, Q1",
    "During a game of paintball, player X shoots a paintball, which has a velocity of 80 m s⁻¹, horizontally from a height of 10 m towards player Y, who is positioned 25 m away.\nWhat is the horizontal velocity of the paintball just before impact?",
    ["8.0 m s⁻¹", "8.2 m s⁻¹", "80 m s⁻¹", "800 m s⁻¹"]),

  mc(127, "North Sydney Girls 2020 Trial, Q14",
    "An archer is competing in two events at the Olympics. Each event requires competitors to shoot an arrow to a bullseye (centre of the target) which is the same height off the ground as the release height of the arrow. The archer enters the 70 m and the 50 m events.\nThe archer shoots the first arrow horizontally over the 70.0 m under projectile motion and misses the centre of the target.\nThe archer fires a second arrow horizontally at an identical speed this time for the 50.0 m event.\nWhich of the following would be the expected outcome of the two shots?",
    [
      "Both the arrows will hit the same spot on the target just below the bullseye and the time of flight will be shorter for the second arrow.",
      "The first arrow will hit the target lower than the second arrow and the time of flight will be the same for both.",
      "The first arrow will hit the target lower than the second arrow and the time of flight will be shorter for the second arrow.",
      "The second arrow will hit the target lower than the first arrow and the time of flight will be the same for both.",
    ],
    { svg: archerTarget(), alt: "An archer aims horizontally at a target 70.0 m away; the bullseye is at the same height as the arrow's release point." }),

  mc(128, "North Sydney Girls 2020 Trial, Q19",
    "A golfer hits three golf balls under projectile motion off a cliff top as drawn below.\nWhich of the following statements is correct about the balls being hit?",
    [
      "Each ball has the same initial velocity.",
      "Each ball has the same initial horizontal velocity.",
      "Each ball has the same initial vertical velocity.",
      "None of the velocities are the same.",
    ],
    {
      svg: cliffThreeBalls(),
      alt: "Three golf balls are hit from the top of a cliff and all land at the same point on the ground below. One is hit horizontally, one rises a little before falling, and one rises higher.",
    }),

  mc(129, "North Sydney Girls 2021 Trial, Q1",
    "Which of the following is constant for the entire flight of a projectile?",
    ["Distance from the ground", "Speed", "Velocity", "Acceleration"],
    { svg: projectileTopY(false), alt: "A projectile launched from the ground follows a symmetrical arch and lands on the ground." }),

  mc(130, "North Sydney Girls 2022 Trial, Q4",
    "A water pipe is placed on the edge of an elevated platform that is 9.5 m above the ground. Water runs off the hose with a velocity of 4.5 m s⁻¹. The water hits the ground after t seconds.\nWhat is the value of t?",
    ["0.98 s", "1.03 s", "1.39 s", "1.94 s"],
    { svg: waterPipe(), alt: "A water pipe at the top edge of a 9.5 m high platform. Water leaves it horizontally at 4.5 m s⁻¹ and curves down to the ground. Not to scale." }),

  mc(131, "North Sydney Girls 2023 Trial, Q12",
    "A stroboscopic camera with a frequency of 2.00 Hz captured part of a projectile’s motion before it malfunctioned. The images captured by the camera are shown in the graph below.\nIf the initial speed of projection is 45.0 m s⁻¹, which of the following is closest to the angle of projection of the projectile?",
    ["37°", "58°", "65°", "81°"],
    {
      svg: stroboscopeGraph([[10, 19], [20, 36], [30, 50], [40, 62], [50, 71]]),
      alt: "Graph of vertical displacement (m, 0 to 100) against horizontal displacement (m, 0 to 100). Five points: (10, 19), (20, 36), (30, 50), (40, 62) and (50, 71).",
    }),

  mc(132, "Penrith 2019 Trial, Q1",
    "Two objects are simultaneously flicked horizontally out different windows of a tall building. One is from a height of 150m and the other from 50m. The 50m object is much lighter and has triple the initial velocity of the higher one.\nIgnoring air-resistance, which of the following statements about these projectiles is most correct:",
    [
      "Both objects will reach the ground at the same time",
      "The first object flight-time will be 3 times the second object",
      "The first object flight-time will be √3 times the second object",
      "The lighter object will take much longer to reach the ground",
    ]),

  mc(133, "Penrith 2019 Trial, Q3",
    "Consider the trajectory of a projectile launched at 60°:\nIgnoring air-resistance, which of the following statements about this scenario is most correct:",
    [
      "The horizontal and vertical acceleration will vary during the flight time",
      "The horizontal and vertical velocity will vary during the flight time",
      "At “Y” the object momentarily stops before starting to fall again",
      "At “Y” the acceleration remains unchanged",
    ],
    { svg: projectileTopY(), alt: "A projectile launched from the ground follows a symmetrical arch and lands on the ground. Point Y is at the top of the path." }),

  mc(134, "Pymble 2022 Trial, Q3",
    "A National Aeronautics and Space Administration (NASA) scientist uses a simulator to model the surface gravity of four different bodies in the Solar System. The surface gravity of each body is shown in the table.\nIn the first simulation, the scientist throws a small cube with a mass of 450 g upwards. The cube initially travels at a speed of 6.5 m s⁻¹ and reaches a maximum height of 8.5 m.\nWhich body is the scientist simulating?",
    ["Ceres", "Icarus", "Hermes", "Pallas"],
    {
      svg: dataTable({ headers: ["Body", "Surface gravity (m s⁻²)"], rows: [["Ceres", "5.55"], ["Icarus", "0.38"], ["Hermes", "4.97"], ["Pallas", "2.49"]], colWidths: [90, 160] }),
      alt: "Table of surface gravity: Ceres 5.55, Icarus 0.38, Hermes 4.97, Pallas 2.49 m s⁻².",
    }),

  mc(135, "Shore 2019 Trial, Q12",
    "A stone is thrown horizontally from the top of a cliff with an initial speed v.\nThe time of flight of the stone is t and its range R. Air resistance is negligible.\nFor a stone that is thrown horizontally from the top of the cliff with an initial speed 3v, which of the following is correct?",
    [
      "Time of flight: t; range: R",
      "Time of flight: 3t; range: 3R",
      "Time of flight: t; range: 3R",
      "Time of flight: 3t; range: R",
    ]),

  mc(136, "Shore 2020 Half-yearly, Q2",
    "A rock is thrown horizontally from a high cliff with an initial velocity of 15 m s⁻¹.\nAfter what time interval will the rock have a velocity vector directed at 45° to the horizontal?",
    ["1.0s", "1.2s", "1.5s", "2.0s"]),

  mc(137, "Caringbah 2024 Trial, Q2",
    "Which of the following is a standard assumption when analysing the motion of projectiles?",
    ["Zero air resistance", "A non-uniform vertical acceleration", "Mass is infinite", "The path of the projectile is an ellipse"]),

  mc(138, "Shore 2021 Trial, Q4",
    "A projectile is launched with initial speed v at an angle θ to the horizontal, as shown.\nWhich graph most closely represents the speed of the projectile during the entirety of its flight?",
    ["Graph A", "Graph B", "Graph C", "Graph D"],
    {
      svg: stack([launchAngle(), speedTimeGraphs()], { dir: "column", gap: 10 }),
      alt: "A launch at speed v and angle θ, then four speed–time graphs, each starting and ending at v. A: straight lines down to zero at the middle and back up (a V touching zero). B: straight lines down to a non-zero minimum and back up. C: a smooth curve down to a non-zero minimum and back up. D: a smooth curve down to zero and back up.",
    }),

  mc(139, "Sydney Boys 2023 Trial, Q1",
    "A ball is thrown horizontally from the top of a building with speed v, and it hits the ground with a range, R, from the bottom of the building. A second ball is thrown horizontally from the top of the same building with speed 2v. What is the range of the second ball?",
    ["R", "√2 R", "2R", "4R"]),

  mc(140, "Sydney Boys 2019 Trial, Q2",
    "Using a homemade projectile launcher a student undertook a depth study to analyse projectile motion.\nThe student determined that the launcher did not produce a consistent initial velocity.\nThe type of error this produced would be best defined as:",
    ["Instrumental error", "Human error", "Systematic error", "Random error"]),

  mc(141, "Sydney Boys 2025 Trial, Q3",
    "With what speed must a projectile be launched horizontally off a cliff, 200.0 m above the ocean, so that it lands exactly 50.0 m from the base of the cliff?",
    ["6.4 m s⁻¹", "7.8 m s⁻¹", "9.9 m s⁻¹", "12.2 m s⁻¹"]),

  mc(142, "Sydney Girls 2020 Trial, Q4",
    "A ball is kicked horizontally from the edge of the cliff and lands in the sea.\nAssuming negligible air resistance, which pair of graphs show the horizontal and vertical velocity-time graphs for the ball during its flight?",
    ["Pair A", "Pair B", "Pair C", "Pair D"],
    {
      svg: velocityTimePairs(),
      alt: "Four pairs of velocity–time graphs. A: horizontal velocity constant; vertical velocity rising steadily from zero. B: horizontal velocity falling steadily to zero; vertical velocity rising steadily from zero. C: horizontal velocity rising steadily from zero; vertical velocity constant. D: both falling steadily to zero.",
    }),

  mc(143, "Sydney Grammar 2020 Trial, Q5",
    "A car is stationary on top of a hill at X, h metres above the top of a cliff. The brakes are released and the car starts to roll down the hill to point Y, where it is projected horizontally off a cliff of height H, and lands at point Z, a distance d from the base of the cliff. Ignore friction and air resistance.\nWhich of the statements below is correct?",
    [
      "The magnitude of the horizontal component of the velocity of the car at Z is less than the speed at Y.",
      "The magnitude of the horizontal component of the velocity of the car at Z is equal to the speed at Y.",
      "The magnitude of the horizontal component of the velocity of the car at Z is greater than the speed at Y.",
      "The magnitude of the horizontal component of the velocity of the car at Z depends on the height of the cliff.",
    ],
    {
      svg: carHillCliff(),
      alt: "A car at rest at X on top of a hill, a height h above the top of a cliff. The road goes down to Y at the cliff edge; the cliff has height H. From Y a dashed path curves down to Z in the sea, a distance d from the base of the cliff.",
    }),

  mc(144, "Sydney Grammar 2024 Trial, Q15",
    "When a projectile reaches its maximum height it is travelling at speed u. When it hits the ground, its speed is 2u.\nAt what angle does it hit the ground?",
    ["30° below the horizontal", "45° below the horizontal", "60° below the horizontal", "63° below the horizontal"]),
];

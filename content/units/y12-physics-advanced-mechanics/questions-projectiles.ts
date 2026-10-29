import type { Question } from "@/lib/types";
import { mc, sa } from "./build";
import {
  airResistancePanels,
  archerTarget,
  ballOffTable,
  cameraSetup,
  cannon,
  carHillCliff,
  castleTarget,
  catapult,
  cliffLaunch,
  cliffThreeBalls,
  cliffThrow,
  componentArrowRows,
  coracleThrow,
  cricketShots,
  dataTable,
  dropAndThrow,
  fireworksTower,
  fourTrajectories,
  golfCliffXYZ,
  golfHoleMap,
  golfVectorTable,
  helicopterDrop,
  hillClear,
  kickAndCatch,
  launchAngle,
  launcherCup,
  lookoutCliff,
  nadalServe,
  pathSXYZ,
  personLaunch,
  pointsGraph,
  projectileTopY,
  rocketLaunch,
  rollercoasters,
  rugbyKick,
  sandpitShot,
  serveAngle,
  shoreStrobe,
  sinkTarget,
  skateRamp,
  speedTimeGraphs,
  stack,
  stadiumRoof,
  stroboscopeGraph,
  tennisImages,
  tennisServeNet,
  towerTwoArrows,
  trajectoryChoices,
  treeAndGreen,
  vacuumChamber,
  velocityComponents,
  velocityTimePairs,
  waterPipe,
  xyGraph,
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

  // ---- Short answer: s091–s144 -------------------------------------------------------
  // Multi-part questions are kept whole; each part shows its marks in square brackets.

  sa(91, 6, "Abbotsleigh 2023 Trial, Q24",
    "Lauren throws a basketball with a horizontal component of velocity of 8.00 m s⁻¹. The ball reached the original height from which it is thrown in 3.00 s and took a further 0.11 s to reach the ground.\n(a) Calculate the horizontal range. [1 mark]\n(b) Calculate the vertical component of initial velocity. [2 marks]\n(c) Calculate the initial angle of projection. [1 mark]\n(d) Calculate the height at which Lauren threw the ball. [2 marks]"),

  sa(92, 5, "Abbotsleigh 2025 Trial, Q22",
    "The diagram below shows a sequence of images of a tennis ball being hit by a racket as captured by a digital camera. The camera was set to take a photo every 5.00 ms.\nThe ball has achieved a constant horizontal velocity at position D which is 2.30 m above the ground.\n(a) Calculate the horizontal velocity of the ball at D. [2 marks]\n(b) If a 1.00 m net is placed 30.0 m from point D, will the ball clear the net? [3 marks]",
    {
      svg: tennisImages(),
      alt: "Successive images of a racket hitting a tennis ball, labelled A to D, then the ball alone at E, F and G, equally spaced. The distance from D to G is 0.68 m.",
    }),

  sa(93, 6, "Ascham 2024 Trial, Q21",
    "An object is launched from the ground at an initial velocity of 80 m/s at an angle of 50° above the horizontal as shown below.\nAfter 5 seconds, the object just clears the top of a hill.\n(a) Draw a labelled vector diagram showing the magnitude and direction of the vertical and horizontal components of the object’s initial velocity. Include suitable calculations to support your answer. (Describe the diagram in words.) [3 marks]\n(b) What is the height of the hill above the ground, h? [2 marks]\n(c) What is the horizontal distance, d, between the launch point and the top of the hill? [1 mark]",
    {
      svg: hillClear(),
      alt: "An object launched from the ground at 80 m/s at 50° follows a dashed path that just clears the top of a hill. The hill's height is h and the horizontal distance from the launch point to the hilltop is d.",
    }),

  sa(94, 6, "Barker 2020 Trial, Q21",
    "The diagram below is a record of a stroboscopic photograph of the motion of a projectile fired from a horizontal surface. The time interval between images is 0.5 seconds (i.e. total time is 4s). Take the acceleration due to gravity as 9.8 m s⁻².\nWhen the horizontal distance travelled by the projectile is 18 m, the vertical component of its velocity is zero.\n(a) What was the horizontal component of the velocity of the projectile immediately before impact with the horizontal surface? [2 marks]\n(b) What was the vertical component of its initial velocity? [2 marks]\n(c) At what angle to the horizontal was the projectile fired? [2 marks]",
    {
      svg: pointsGraph({
        xMax: 40, yMax: 20, xStep: 10, yStep: 10, minor: 2, xLabel: "HORIZONTAL DISTANCE (m)", yLabel: "HEIGHT (m)",
        points: [[0, 0], [4.5, 8.6], [9, 14.7], [13.5, 18.4], [18, 19.6], [22.5, 18.4], [27, 14.7], [31.5, 8.6], [36, 0]],
      }),
      alt: "Stroboscopic record of a projectile: height (m, 0 to 20) against horizontal distance (m, 0 to 40). Nine equally timed images, 4.5 m apart horizontally, rise from (0, 0) to a top of about 19.6 m at 18 m, and come back down to (36, 0).",
    }),

  sa(95, 5, "Barker 2021 Trial, Q24",
    "Mr Johnston sees one of his children on the floor, playing with a ‘cannon’ toy, trying to get the projectile to hit a target on a windowsill behind the kitchen sink. Amazingly, the child hits the target first time!\nA diagram of the scenario is shown below.\nMr Johnston measures the time for the projectile, from launch to target, as 0.66 s.\n(a) State where in its trajectory the projectile is experiencing a maximum acceleration. Justify your answer. (Assume no air resistance and a uniform gravitational field.) [2 marks]\n(b) Show, with calculations, that the projectile was launched at a 65° elevation. [3 marks]",
    {
      svg: sinkTarget(),
      alt: "A toy cannon on the floor fires at a target on a windowsill. The cannon is 0.85 m from the front of the kitchen bench, and the target is a further 0.60 m back, against the window. The bench is 0.90 m high and the target is 0.060 m above the bench. Not to scale.",
    }),

  sa(96, 8, "Baulkham Hills 2016 Half-yearly, Q21",
    "An enemy ship was sailing 2km from the coast. A cannon on a 100 metre-high cliff fired a projectile at an angle of 20° to the horizontal, at a muzzle speed of 150 m s⁻¹\n(a) Determine the vertical and horizontal components of the initial velocity? [2 marks]\n(b) Calculate the time taken for the cannon ball to reach the maximum height and the maximum height of the cannon ball above the water. [2 marks]\n(c) Calculate\n(i) the range of the cannon ball [2 marks]\n(ii) how far from the ship the cannon ball landed [1 mark]\n(d) Describe an adjustment of the cannon that is necessary for a cannon ball to hit the ship [1 mark]",
    {
      svg: cliffLaunch({ heightLabel: "100 m", speedLabel: "150 m s⁻¹", angle: 20, rangeLabel: "2 km", ground: "sea", target: "ship", pathHeight: 70, note: "NOT TO SCALE" }),
      alt: "A cannon on a 100 m high cliff fires at 150 m s⁻¹ at 20° above the horizontal towards a ship 2 km from the base of the cliff. Not to scale.",
    }),

  sa(97, 9, "Baulkham Hills 2021 Trial, Q23",
    "Satvik Gupta is in a hot air balloon at rest on a 10m tall platform. It starts rising vertically at a constant acceleration of 2 m s⁻². Satvik stops the burner after 5 seconds, and immediately throws his English text horizontally at 20 m s⁻¹ (in his frame of reference) which impacts the ground sometime later.\n(a) At what height off the ground did Satvik throw his English text? [1 mark]\n(b) Determine the initial velocity of the English text as viewed from the ground. [3 marks]\n(c) Determine the time of flight and range of the English text. [2 marks]\n(d) Determine the velocity of the English text on impact. [2 marks]\n(e) If the landing platform is removed so that Satvik lands on the ground, what is the time difference between himself and the English text impacting the ground? [1 mark]"),

  sa(98, 7, "Baulkham Hills 2023 Trial, Q25",
    "Vanessa, Parleen and Isabella were accepted by NASA and sent to the Moon as astronauts. While on the Moon, Isabella and Parleen tell Vanessa to get rid of her chewing gum. After opening the visor on her helmet, Vanessa spits the gum out from the top of a cliff, hitting the ground below 18.63 s later.\nThe acceleration due to gravity on the Moon is 1.6 m s⁻².\n(a) Determine the horizontal component of the chewing gum’s velocity. [2 marks]\n(b) Determine the vertical component of the gum’s initial velocity. [3 marks]\n(c) The mass of the Moon is miraculously doubled and its radius increased so that is three times larger. On the diagram above, carefully sketch the new trajectory of the gum if Vanessa spat it out with the same initial velocity. Clearly justify your reasoning below. (Describe the new trajectory in words.) [2 marks]",
    {
      svg: cliffLaunch({ heightLabel: "150 m", angle: 25, rangeLabel: "300 m", pathHeight: 30 }),
      alt: "The gum is spat upwards at an angle from the top of a 150 m cliff and lands on the ground 300 m from the base of the cliff.",
    }),

  sa(99, 5, "Cheltenham Girls 2010 Trial, Q23",
    "A stone is thrown from the top of a cliff at a height of 28 m above the sea. The stone is thrown at a speed of 25 m s⁻¹ at an angle of 30° above the horizontal. (Air resistance is negligible.)\nThe maximum height reached by the stone from the point at which it is thrown is 8.0 m.\nThe stone leaves the cliff at time T = 0. It reaches its maximum height at T = T_H and strikes the sea at T = T_S.\n(a) On the axis below, sketch a graph to show the variation in the magnitude of the vertical component of the velocity of the stone, from T = 0 to T = T_S. (Describe the graph in words.) [3 marks]\n(b) Calculate the time (T-total) it will take for the stone to hit the water. [2 marks]",
    {
      svg: cliffLaunch({ heightLabel: "28 m", speedLabel: "25 m s⁻¹", angle: 30, ground: "sea", pathHeight: 30 }),
      alt: "A stone is thrown at 25 m s⁻¹ at 30° above the horizontal from the top of a 28 m cliff and falls into the sea.",
    }),

  sa(100, 5, "Caringbah 2024 Trial, Q32",
    "A model rocket, initially on the ground, was launched at an angle of 20.0° from the horizontal. After a 2.50 s motor burn, the model had a velocity of 82.0 m s⁻¹ and then followed projectile motion for the remainder of its flight.\nDetermine the horizontal range of the rocket after landing. Assume its initial trajectory did not change during its motor burn.",
    { svg: rocketLaunch(), alt: "A model rocket on a launch stand, pointing 20.0° above the horizontal." }),

  sa(101, 6, "Cheltenham Girls 2008 Trial, Q16",
    "In an experiment designed to examine projectile motion, a small steel ball is fired with an initial velocity of 50 m s⁻¹ at a variety of initial angles of projection.\n(a) At which initial angle of projectile does the ball have the greatest initial horizontal velocity? [1 mark]\n(b) At which angle of projection does the ball have the greatest initial vertical velocity? [1 mark]\n(c) Calculate the time of flight for the ball projected at 15°. [2 marks]\n(d) Compare the final velocity of the ball when it is launched at 15° to its final velocity when it is launched at 45°. Note that no calculations are required. [2 marks]"),

  sa(102, 5, "Cheltenham Girls 2011 Trial, Q21",
    "Two students are 130 m apart. One holds a paint ball gun on the ground level and fires a paint ball at the other. The ball leaves the gun at 40 m s⁻¹ at an angle of elevation of 20°.\n(a) Calculate the maximum height of the paint ball above its firing position. [2 marks]\n(b) Determine whether or not the ball hits the second student. [3 marks]"),

  sa(103, 4, "Cherrybrook Tech 2025 Trial, Q31",
    "A spring-loaded ball launcher is fixed at a 35° angle on a platform, as shown in the diagram. When a 46 g ball is launched, a target cup is released from the base of the platform and moves along a linear track directly away from the platform at a constant speed. The speed at which the target cup moves along the track can be set by the operator prior to launching the ball.\nIt is known that the spring in the launcher does 19.4 J of work on the ball.\nDetermine the required speed of the target cup and the distance the target cup must travel so that the ball lands in the cup.",
    {
      svg: launcherCup(),
      alt: "A ball launcher at 35° on top of a 2.6 m high platform. A cup starts at the base of the platform and moves away along the ground at speed v; the ball's dashed path lands in the cup.",
    }),

  sa(104, 5, "Girraween 2020 Trial, Q22",
    "A catapult releases its projectile 4.0 m above the ground with an initial velocity of 50 m s⁻¹ at 40° to the horizontal, as shown in the diagram below.\n(a) Determine the maximum height reached above the ground by the projectile. [2 marks]\n(b) What is the range of the projectile? [3 marks]",
    { svg: catapult(), alt: "A catapult releases a ball 4 m above the ground; the ball lands on the ground some distance away." }),

  sa(105, 5, "Girraween 2023 Trial, Q21",
    "The diagram below shows the H-shaped posts used in a game of rugby.\nThe path of a ball that is kicked and just passes over the crossbar is shown below.\nThe initial velocity of the ball is 20.0 m s⁻¹ at an angle of 40.0° to the ground.\nThe top of the crossbar is 3.00 m above the horizontal ground.\nIgnore the effect of air resistance and treat the ball as a simple projectile.\n(a) Determine the minimum velocity of the ball in flight. [1 mark]\n(b) The ball just passes over the cross bar at a time t after it is kicked. Find t. [2 marks]\n(c) Another attempt is made to kick the ball over the crossbar. It was kicked at the same angle with the same initial velocity as the first attempt.\nThis kick is made from a horizontal distance of 38 m from the posts.\nDetermine whether the ball can pass over the crossbar. Show working. [2 marks]",
    {
      svg: rugbyKick(),
      alt: "Rugby posts with a crossbar 3.00 m above the ground. A ball kicked at 20 m s⁻¹ at 40° from the right rises and comes down just over the crossbar.",
    }),

  sa(106, 5, "Girraween 2024 Trial, Q21",
    "A popular tourist site has a lookout point at the top of a cliff overlooking the sea.\n(a) As shown in the diagram, a visitor accidentally rolls a ball off the lookout point. It takes 3.5 seconds for the ball to land in the sea below.\nCalculate the vertical distance that the ball travels before it lands in the sea. [2 marks]\n(b) The tourist site also offers helicopter sightseeing tours. A passenger in one of the helicopters drops their phone while trying to take a photo of the scenery. When the phone is dropped, the helicopter is 200 m above the ground and travelling at a horizontal speed of 50.0 m s⁻¹.\nCalculate the horizontal distance that the phone travels before it lands on the ground. [3 marks]",
    { svg: lookoutCliff(), alt: "A ball rolls horizontally off a lookout at the top of a cliff and falls into the sea below. Not to scale." }),

  sa(107, 5, "Ascham 2016 Trial, Q22",
    "Jane builds a tall tower with a cannon on top. The cannon is able to launch a cannon ball horizontally at any speed.\n(a) If the cannon ball is fired at a speed of 830 m s⁻¹ at a height of 5050 m above the ground, calculate the range of the cannon ball, assuming the ground is horizontal. [2 marks]\n(b) If the cannon ball is shot at the appropriate speed to achieve circular orbit, calculate the required period of orbit to achieve this motion. The following data must be used in your calculation:\nThe orbital radius of the ball is 6.385 × 10⁶ m, the orbital radius of the Moon is 3.84 × 10⁸ m and the orbital period of the Moon is 27.3 days. [2 marks]\n(c) Identify the principal force acting on the cannon ball during its flight. [1 mark]",
    {
      svg: cliffLaunch({ heightLabel: "5050 m", pathHeight: 0 }),
      alt: "A cannon on top of a 5050 m tall tower fires a cannon ball horizontally; it curves down to the horizontal ground.",
    }),

  sa(108, 6, "Hornsby Girls 2019 Trial, Q21",
    "A cannon fired a projectile from a cliff, with an initial velocity of 110 m s⁻¹ at an angle of 55° as shown.\nnote: diagram not drawn to scale. Ignore the effect of air resistance in your calculations.\n(a) What was the maximum height above ground level reached by the projectile? [3 marks]\n(b) What was the velocity of the projectile at the position of maximum height? [1 mark]\n(c) How far had the projectile travelled horizontally at the position of maximum height? [2 marks]",
    {
      svg: cliffLaunch({ heightLabel: "52 m", speedLabel: "110 m s⁻¹", angle: 55, launcherHeight: "1.5 m", pathHeight: 70 }),
      alt: "A cannon 1.5 m above the top of a 52 m cliff fires at 110 m s⁻¹ at 55° above the horizontal. Not to scale.",
    }),

  sa(109, 4, "Hurlstone 2006 Half-yearly, Q2",
    "The following graph shows the position of a ball over time. Images of the position of the ball are displayed at regular time intervals.\n(a) Ignoring air resistance identify any forces acting on the ball at point B in the graph. [1 mark]\n(b) Identify the maximum height of the projectile. [1 mark]\n(c) Use an equation to calculate the time taken to reach the maximum height. [2 marks]",
    {
      svg: pointsGraph({
        xMax: 3.2, yMax: 1.5, xStep: 1, yStep: 0.5, minor: 4, xLabel: "X (m)", yLabel: "Y (m)",
        points: Array.from({ length: 17 }, (_, k) => {
          const x = (k / 16) * 3.1;
          return [+x.toFixed(3), +((4 * 1.48 * x * (3.1 - x)) / 9.61).toFixed(3)] as [number, number];
        }),
        marks: [{ at: [0.775, 1.11], label: "B" }],
      }),
      alt: "Graph of Y (m) against X (m): 17 equally timed images of a ball rise from (0, 0) to a maximum height of about 1.48 m at X ≈ 1.55 m and come back down to the ground at X ≈ 3.1 m. Point B is on the way up, at about (0.78, 1.1).",
    }),

  sa(110, 5, "James Ruse 2019 Half-yearly, Q11",
    "A ball is kicked at an angle to the horizontal. The diagram below shows the position of the ball every 0.50 s.\nThe acceleration of free fall is g = 9.8 m s⁻². Air resistance may be neglected.\n(a) Using the diagram determine, for the ball\n(i) the horizontal component of the initial velocity. [1 mark]\n(ii) the vertical component of the initial velocity. [2 marks]\n(iii) the magnitude of the displacement after 3.0 s. [1 mark]\n(b) On the diagram draw a line to indicate a possible path for the ball if air resistance were NOT negligible. (Describe the path in words.) [1 mark]",
    {
      svg: pointsGraph({
        xMax: 40, yMax: 30, xStep: 10, yStep: 5, minor: 5, xLabel: "horizontal displacement / m", yLabel: "vertical displacement / m",
        points: Array.from({ length: 11 }, (_, k) => [4 * k, +(24.5 * 0.5 * k - 4.9 * 0.25 * k * k).toFixed(2)] as [number, number]),
      }),
      alt: "Positions of a ball every 0.50 s: vertical displacement (m, 0 to 30) against horizontal displacement (m, 0 to 40). The points are 4 m apart horizontally: (0, 0), (4, 11), (8, 20), (12, 26), (16, 29.4), (20, 30.6), (24, 29.4), (28, 26), (32, 20), (36, 11) and (40, 0).",
    }),

  sa(111, 4, "James Ruse 2019 Trial, Q21",
    "The barrel of a rifle is held at an angle θ to the horizontal. A bullet fired from the rifle leaves the barrel at time t = 0 with a speed, u, 200 m s⁻¹. The graph below shows the variation with time t of the vertical height h of the bullet.\n(a) Using the axes below, draw a sketch graph to show the variation of h with the horizontal distance x travelled by the bullet.\n(Note: this is a sketch graph; you do not have to add any values to the axes.) (Describe the shape of the graph in words.) [1 mark]\n(b) State the expression for the initial vertical component of speed V_y in terms of the initial speed of the bullet and the angle θ. [1 mark]\n(c) Use data from the graph to deduce that the angle θ = 30°. [2 marks]",
    {
      svg: pointsGraph({
        xMax: 25, yMax: 600, xStep: 5, yStep: 100, minor: 1, xLabel: "t / s", yLabel: "h / m", points: [],
        curve: Array.from({ length: 41 }, (_, k) => {
          const t = (k / 40) * 20.41;
          return [+t.toFixed(3), +Math.max(0, 100 * t - 4.9 * t * t).toFixed(2)] as [number, number];
        }),
      }),
      alt: "Graph of height h (m, 0 to 600) against time t (s, 0 to 25). The curve is an inverted parabola starting at the origin, reaching a maximum of about 510 m at t ≈ 10 s and returning to h = 0 at t ≈ 20 s.",
    }),

  sa(112, 4, "James Ruse 2020 Trial, Q22",
    "Paul kicks a ball from point P to point R. At the same instant, Quinn starts from point Q and runs forward, to catch the ball at point R. The initial vertical velocity (u_y) of the ball is 12.0 m s⁻¹ and its horizontal velocity (u_x) is 10.0 m s⁻¹.\nIgnore air resistance throughout this question.\n(a) Calculate the initial velocity of the ball. [2 marks]\n(b) Paul kicks the ball from a point 1.00 m above the ground. Quinn jumps and catches the ball when it is 3.00 m above the ground at point R.\nIf the ball travels for 2.27 s in the air, determine the horizontal distance (s) the ball will cover before Quinn catches it at point R. [2 marks]",
    {
      svg: kickAndCatch(),
      alt: "Figure 1: points P, Q and R on the ground. The ball is kicked from P (components u_y up and u_x along PR) and follows a curved path to R; the horizontal distance PR is s, at angle θ. Quinn runs from Q to R, a distance d. Part (b) side view: the ball leaves 1.00 m above P and is caught 3.00 m above R.",
    }),

  sa(113, 10, "Cheltenham Girls 2010 Half-yearly, Q17",
    "A tennis player aims to serve the ball horizontally when his racquet is 2.5 m above the ground. The distance from the player to the net is 15.0 m and the net is 0.9 m high.\nIf the ball is just clear the net,\n(a) What is the time for the ball to reach the top of the net? [2 marks]\n(b) What is the minimum speed (uₓ) with which the ball must leave the racquet? [2 marks]\n(c) What is the total time for which the ball is in the air from the time that it leaves the racquet until it hits the ground? [2 marks]\n(d) How far beyond the net does the ball land (distance d)? [2 marks]\n(e) What is the final velocity of the ball? [2 marks]",
    {
      svg: tennisServeNet(),
      alt: "A ball is served horizontally with speed uₓ from 2.5 m above the ground. It just clears a net 0.9 m high, 15 m away, and lands a distance d beyond the net.",
    }),

  sa(114, 8, "James Ruse 2022 Trial, Q31",
    "A coracle is a very small, light boat that can be used for fishing. It floats high so that it barely disturbs the water.\nA child of mass 30.0 kg sits in a coracle of mass 10.0 kg on the water at rest. The child throws a fish of mass 5.0 kg onto the riverbank. The fish leaves their hand with at a speed of 5.0 m s⁻¹ at an angle of 10° above the horizontal.\n(a) Determine the initial vertical component of the velocity of the fish. [2 marks]\n(b) The fish lands a horizontal distance of 1.2 m from the child's hand.\nDetermine the vertical displacement, y_f, of the fish from the point it left the child's hand to where it lands. [3 marks]\n(c) How fast are the boat and child moving horizontally after the throw?\nIdentify any assumption/s you make in this calculation. [3 marks]",
    {
      svg: coracleThrow(),
      alt: "Trajectory of the fish: axes x and y with the origin at the child's hand, above a small round boat on the water. The fish leaves at 10° above the horizontal, rises slightly and comes down onto the riverbank at x = 1.2 m, a little below the hand; the vertical drop to the landing point is labelled y_f.",
    }),

  sa(115, 8, "James Ruse 2024 Half-yearly, Q16",
    "A stone is projected upwards at an angle of 30° to the horizontal from the top of a vertical cliff. Given that the initial velocity of the stone is 15 m/s and that it hits the horizontal ground below the cliff 2 seconds later, calculate:\n(a) The horizontal distance travelled by the stone from the foot of the cliff. [2 marks]\n(b) The height of the cliff [2 marks]\n(c) The velocity of the stone just before it hits the ground [3 marks]\n(d) If the same experiment were to be conducted on Mars, which has an acceleration due to gravity of 3.7 m s⁻², how would the range be different on Mars as compared to that on Earth? [1 mark]"),

  sa(116, 6, "James Ruse 2024 Trial, Q27",
    "A person launches a ball upward at a 40° angle with an initial velocity of 25 m s⁻¹ from a height of 1.65 meters above the ground.\n(a) Calculate the time it takes for the ball to return to the initial height from which it was launched. [2 marks]\n(b) Simultaneously, a dog, initially at rest beside the person, starts running in the same direction as the ball's path with a constant acceleration.\nDetermine the dog's acceleration if the dog pounces on the ball precisely when it lands on the ground. [4 marks]",
    {
      svg: personLaunch({ height: "1.65 m", speed: "25 m s⁻¹", angle: 40, dog: true }),
      alt: "A person launches a ball at 25 m s⁻¹ at 40° above the horizontal from 1.65 m above the ground. A dog stands beside the person.",
    }),

  sa(117, 5, "Kinross Wolaroi 2022 Trial, Q22",
    "(a) Compare the force of gravity exerted on the Earth by the Moon with the force of gravity exerted on the Moon by the Earth.\nThe mass of the Moon is 7.3 × 10²² kg and has an average orbital distance (from Earth's centre) of 382,000 km. [2 marks]\n(b) An astronaut on the Moon hits a golf ball with an initial velocity of 60 m s⁻¹ and at an angle 30° above horizontal.\nGiven the Moon's surface gravity is 83% weaker than Earth's surface gravity, calculate the range of the golf ball. Assume a flat surface. [3 marks]"),

  sa(118, 5, "Knox 2020 Trial, Q21",
    "An object is launched horizontally from the edge of a cliff, at 40 m s⁻¹ and lands in the ocean, 70 m below, as shown in the diagram below.\n(a) Calculate the distance from the base of the cliff to where the object lands in the ocean. [2 marks]\n(b) Calculate the velocity of the object as it hits the water. [3 marks]",
    {
      svg: cliffLaunch({ heightLabel: "70 m", speedLabel: "40 m s⁻¹", pathHeight: 0, rangeLabel: "Range", ground: "sea" }),
      alt: "An object is launched horizontally at 40 m s⁻¹ from the edge of a 70 m cliff and curves down into the ocean; the horizontal distance from the cliff base is the range.",
    }),

  sa(119, 5, "Knox 2021 Trial, Q22",
    "A person throws a ball which is projected at a speed of 40 m s⁻¹ at 15° above the horizontal. The ball leaves the thrower at 2.10 m above the ground as seen in the diagram below.\n(a) Calculate the time of flight if the ball is caught at the same height as thrown. [3 marks]\n(b) The person catching the ball is standing 90 m from the thrower at the same level. Determine how much closer or further away the catcher must move in order to catch the ball. [2 marks]",
    {
      svg: personLaunch({ height: "2.10 m", speed: "40.0 m s⁻¹", angle: 15 }),
      alt: "A person throws a ball at 40.0 m s⁻¹ at 15.0° above the horizontal; the ball leaves the hand 2.10 m above the ground.",
    }),

  sa(120, 6, "Knox 2025 Trial, Q37",
    "A ball is hit at a speed of 35 m s⁻¹ from ground level inside a stadium with a roof that is 40 m above the ground.\nAt the top of the flight of the ball, it just touches the roof, and continues on its path, with no impact upon its trajectory. The projectile lands at the same level from which it was launched.\nDetermine the angle at which the ball must be hit so that it just touches the roof, and thus calculate the range of the ball when it lands.",
    {
      svg: stadiumRoof(),
      alt: "A ball is hit from ground level and rises along a curved path until its highest point just touches a roof 40 m above the ground.",
    }),

  sa(121, 3, "Kotara 2020 Trial, Q23",
    "A ball is launched at 60 m s⁻¹. At what angles could this occur for it to travel 250 m horizontally?"),

  sa(122, 8, "Newington 2019 Trial, Q21",
    "Figure 1 shows a golfer hitting a ball from the top of a cliff. The ball follows the path shown. The ball is hit with an initial velocity of 40 m s⁻¹ at an angle of 30° above the horizontal, as shown. Assume that there is no air resistance.\n(a) Calculate the initial vertical component of velocity of the ball. [1 mark]\n(b) Draw on the diagram (on the previous page) an arrow to show the direction of the net force acting on the ball when it is at point X, the highest point of the flight. Label this arrow F. (Describe the direction of F in words.) [1 mark]\n(c) At point Y the ball is level with its initial position.\nFind the time taken to reach Y. [2 marks]\n(d) The total time of flight of the ball is 6.0 s.\nShow on the graph below how v, the vertical component of the velocity, changes throughout the whole 6.0 s. (The graph has v / m s⁻¹ from −60 to 60 on the vertical axis and t / s from 0 to 6 on the horizontal axis. Describe your graph in words.) [2 marks]\n(e) Calculate the height h of the cliff. [2 marks]",
    {
      svg: cliffLaunch({ heightLabel: "h", speedLabel: "40 m s⁻¹", angle: 30, pathHeight: 30, markTop: "X", markLevel: "Y" }),
      alt: "Figure 1: a golfer on top of a cliff of height h hits a ball at 40 m s⁻¹ at 30° above the horizontal. The path rises to its highest point X, comes back down through point Y level with the cliff top, and lands on the ground below.",
    }),

  sa(123, 7, "Newington 2023 Trial, Q21",
    "The figure below shows a skateboarder descending a ramp.\nThe skateboarder starts from rest at the top of the ramp at A and leaves the ramp at B horizontally with a velocity v.\n(a) In going from A to B the skateboarder's centre of gravity descends a vertical height of 1.5 m. Show that the horizontal velocity, v, is 5.4 m s⁻¹, stating an assumption that you make. [2 marks]\n(b) Identify with an X the location on the ramp where the skateboarder has the highest value of acceleration. (Describe the location in words.) [1 mark]\n(c) After leaving the ramp at B the skateboarder lands on the ground at C 0.42 s later.\nFind the horizontal distance travelled between B and C. [1 mark]\n(d) Calculate the vertical component of the velocity immediately before impact at C. [1 mark]\n(e) Determine the magnitude of the resultant velocity immediately before impact at C. [2 marks]",
    {
      svg: skateRamp(),
      alt: "A curved ramp starts vertical at the top, A, and curves round to become horizontal at B, which is 1.0 m above the ground. A skateboarder is shown near the top. C is on the ground some distance beyond B.",
    }),

  sa(124, 5, "Normanhurst Boys 2020 Trial, Q21",
    "In an indoor soccer match, whenever the ball touches the ceiling of the court following a goal kick from the goalkeeper it is considered a foul.\nThe ceiling of the court is 10 m high, and the keeper always kicks the ball at a speed of 20 m s⁻¹.\n(a) What should be the maximum angle the keeper kicks the ball so that a foul is not committed? [3 marks]\n(b) Find the velocity of the ball 2.0 s after being kicked by the goalkeeper, assuming it is kicked at 20 m s⁻¹ at the angle found in part (a) above. [2 marks]"),

  sa(125, 5, "North Sydney Boys 2019 Trial, Q22",
    "A bundle of fireworks are launched from a tower with a velocity, v, of 50 m/s.\n(a) Calculate the horizontal distance away from the tower that the fireworks explode [2 marks]\n(b) Describe quantitatively how increasing the launch angle to 45 degrees would change the situation [3 marks]",
    {
      svg: fireworksTower(),
      alt: "Fireworks are launched with velocity v at 30° above the horizontal from the top of a 305 m tower. They follow a curved path and explode on the way down at a height of 280 m above the ground.",
    }),

  sa(126, 4, "North Sydney Boys 2022 Trial, Q21",
    "A stone is thrown from the top of a cliff of height 28 m above the sea. The stone is thrown at a speed of 14 m s⁻¹ at an angle above the horizontal. Air resistance is negligible.\nThe maximum height reached by the stone measured from the point from which it is thrown is 8.0 m.\n(a) By considering the energy of the stone, determine the speed with which the stone hits the sea. [2 marks]\n(b) The stone leaves the cliff at time t = 0. It reaches its maximum height at t = T_H. On the axis below, draw a sketch-graph to show the variation with time t of the magnitude of the vertical component of speed of the stone from t = 0 to t = T_S, the time just before the stone strikes the sea. (The axes show speed against t, with T_H and T_S marked on the t axis. Describe your sketch in words.) [2 marks]",
    {
      svg: cliffLaunch({ heightLabel: "28 m", speedLabel: "14 m s⁻¹", angle: 60, angleLabel: false, pathHeight: 40, ground: "sea" }),
      alt: "A stone is thrown at 14 m s⁻¹ at an angle above the horizontal from the top of a 28 m cliff and lands in the sea.",
    }),

  sa(127, 5, "North Sydney Girls 2020 Trial, Q21",
    "A top secret photograph was leaked from NASA showing the analysis of projectiles on the Moon. It was designed as a feasibility study to whether water propulsion systems could be used to leave the Moon's gravitational field (m_moon = 7.35 × 10²² kg, r_moon = 1.74 × 10⁶ m).\nA typical high pressure water system can provide a constant thrust such that after 1.9 s a stationary, 120 g rocket is travelling at 22 m s⁻¹.\n(a) Calculate the resultant force on the rocket assuming its mass remains at 120 g. [1 mark]\n(b) Calculate the work done by the water rocket. [1 mark]\n(c) Calculate how high the water rocket is at 1.9 s. [1 mark]\n(d) Explain whether the rocket would escape the moon's gravitational field if the thrust stops at 1.9 s. [2 marks]"),

  sa(128, 8, "North Sydney Girls 2022 Trial, Q32",
    "A golf ball, A, landed in a sandpit. The golfer hits the ball to give it a velocity u m s⁻¹ at 25° to the horizontal. It is known that the horizontal component of u is 6.2 m s⁻¹. The ball is travelling horizontally as it reaches P as shown in the diagram below. Assume that air resistance is negligible.\n(a) Calculate the time taken for the ball to reach P. [2 marks]\n(b) Calculate the depth of the sandpit, d. [2 marks]\nThe golf ball is returned to the same location in the sandpit. This time the golfer wants to hit the golf ball with the same velocity u m s⁻¹ but at an angle of 78°. The golf ball also lands at P.\n(c) On the diagram, sketch the new trajectory of the golf ball. (Describe the trajectory in words.) [1 mark]\n(d) Compare the velocities at point P for the two different trajectories. [3 marks]",
    {
      svg: sandpitShot(),
      alt: "Golf ball A sits in a sandpit of depth d. It is hit with velocity u at 25° and follows a dashed path that is travelling horizontally as it reaches point P on the raised ground beyond the sandpit. Not to scale.",
    }),

  sa(129, 5, "North Sydney Girls 2023 Trial, Q31",
    "In a video game, the player fires arrows at a fixed speed of 53.0 m s⁻¹ to the East from the top of a 45.0 m high castle tower to hit a moving target. The player can adjust the angle of projection θ as shown in the diagram below. Assume air resistance is negligible.\nThe target moves around the castle in a circular path of radius 180.0 m in an anti-clockwise direction. It takes 16.0 s for the target to complete one revolution around the tower. The target is initially placed South of the castle.\n(a) Show that the angle of projection of the arrow is 72.3° if the arrow reaches a maximum height of 175.0 m above the ground. [2 marks]\n(b) Given that the arrow will have a range of 180.0 m when projected at 72.3°, how long should the player wait before firing the arrow such that it will hit the target? [3 marks]",
    {
      svg: castleTarget(),
      alt: "A 45.0 m castle tower stands at the centre of a dashed circle of radius 180.0 m. An arrow is fired at 53.0 m s⁻¹ at angle θ towards the East and lands on the circle at the East point. The target starts at the South point of the circle and moves anticlockwise (towards East).",
    }),

  sa(130, 6, "North Sydney Girls 2024 Trial, Q26",
    "Rafael Nadal is practising his tennis serve. He throws a ball with a mass of 56.0 g up in the air from point A to point B. The ball reaches a maximum height of 1.8 m at point B. He also swings his racquet from point D through to point C. The centre of the racquet head moves with constant speed in a circular arc of radius 1.8 m from point C to point B. The racquet passes point C at the same time as the ball is released at point A and then the racquet hits the ball at point B.\n(a) Calculate the speed of the racquet at point C. [3 marks]\nThe ball leaves Nadal's racquet with an initial speed of 24.0 m s⁻¹ in a horizontal direction, as shown in the diagram below. A tennis net is located 12.0 m in front of Nadal and has a height of 0.90 m.\n(b) How far above the net will the ball be when it passes over the net? [3 marks]",
    {
      svg: nadalServe(),
      alt: "(a) A player releases a ball at A, 1.8 m above the ground; it rises to B, 1.8 m higher, directly above A. The racquet swings up from D through C, which is level with A and at the end of the outstretched arm, and on to B. (b) The ball is hit horizontally at 24 m s⁻¹ from 3.6 m (1.8 m + 1.8 m) above the ground towards a 0.90 m net 12 m away.",
    }),

  sa(131, 5, "Sydney Grammar 2005 Half-yearly, Q18",
    "An experimental golf club was used to hit a ball from point X, as illustrated in the following diagram. The ball reaches a maximum height Y, 44.1 metres vertically above the launch point and lands on top of a cliff Z, at a height of 39.2 metres.\nThe horizontal distance from point Y to point Z is 20.0 metres.\n(a) Calculate the time taken for the ball to travel from Y to Z [2 marks]\n(b) Determine the magnitude and direction of the initial velocity of projection, u, at point X. [3 marks]",
    {
      svg: golfCliffXYZ(),
      alt: "A ball is hit from X with velocity u at angle θ. It rises to its highest point Y, 44.1 m above X, then comes down onto the top of a cliff at Z, 39.2 m high. The horizontal distance from Y to Z is 20 m. Not to scale.",
    }),

  sa(132, 5, "Pymble 2022 Trial, Q22",
    "Two projectiles are launched with the same initial speeds and angles to the horizontal. Projectile A has a mass of m, while projectile B has a mass of 2m.\n(a) Explain why the two projectiles will have the same range. [2 marks]\n(b) Both projectiles were launched again, this time with the same angles to the horizontal but with different initial speeds.\nProjectile B remains in flight for twice as long as projectile A over level ground.\nHow many times further does projectile B travel compared to projectile A? [3 marks]"),

  sa(133, 3, "Shore 2019 Trial, Q29",
    "A stone of mass 2.0 kg is thrown from the top of a 15 m high cliff above the sea at an angle of 30° to the horizontal and at an initial speed of 20 m s⁻¹. Ignore air resistance.\nCalculate the kinetic energy of the stone immediately before it strikes the sea.",
    {
      svg: cliffLaunch({ heightLabel: "15 m", speedLabel: "20 m s⁻¹", angle: 30, pathHeight: 40, ground: "sea" }),
      alt: "A stone is thrown at 20 m s⁻¹ at 30° above the horizontal from the top of a 15 m cliff and lands in the sea.",
    }),

  sa(134, 6, "Shore 2020 Half-yearly, Q10",
    "A ball of mass 160 g is launched horizontally into a vacuum chamber where it falls under the influence of gravity causing it to take the parabolic trajectory shown.\n(a) Calculate the velocity of the ball when it impacts the bottom of the chamber. [3 marks]\nThe experiment is repeated with the ball launched in an identical manner into the chamber. But this time the ball carries a charge of +0.2 C and a uniform magnetic field is applied to the chamber. The ball is observed to travel the length of the chamber without deviating from its initial path.\n(b) Calculate the strength and direction of the magnetic field applied. [3 marks]",
    {
      svg: vacuumChamber(),
      alt: "Top: a ball enters a chamber horizontally 50 cm above its floor and follows a parabolic path to land 150 cm from the entry wall. Bottom: in the repeated experiment the ball travels straight across the chamber, 50 cm above the floor. The page is a side view (up is up, the ball moves to the right).",
    }),

  sa(135, 3, "Shore 2020 Trial, Q21",
    "Greedo shoots a projectile from the top of a cliff upwards at 60° to the horizontal at 40 m s⁻¹. The cliff is 80 m high.\nCalculate the displacement of the projectile from the launch point 5 seconds later."),

  sa(136, 6, "Shore 2020 Trial, Q28",
    "The diagram shows a camera and a ruler set up to obtain data about a projectile's motion along the trajectory shown. The entire trajectory is visible through the camera.\n(a) Identify ONE of the errors in this set-up and describe the effect of this error on the results. [3 marks]\nAn experiment was set up based on the method described in part (a), but conducted so that the data obtained were valid. The image shows the trajectory of the ball.\nThe graphs show data from this experiment.\n(b) Using the graphs, describe the velocity and acceleration of the ball qualitatively and quantitatively. [3 marks]",
    {
      svg: stack(
        [
          cameraSetup(),
          shoreStrobe(),
          stack([
            xyGraph({
              xMax: 1.25, yMin: -1.5, yMax: 0, xStep: 0.25, yStep: 0.5, minor: 5, width: 190, height: 150,
              xLabel: "Time (s)", yLabel: "Horizontal displacement (m)",
              points: Array.from({ length: 27 }, (_, k) => {
                const t = 0.3 + k / 30;
                return [+t.toFixed(3), +(-1.6 * (t - 0.3)).toFixed(3)] as [number, number];
              }),
              marks: [{ at: [0.3, 0], label: "P" }],
            }),
            xyGraph({
              xMax: 1.25, yMin: -6, yMax: 6, xStep: 0.25, yStep: 2, minor: 4, width: 190, height: 150,
              xLabel: "Time (s)", yLabel: "Vertical velocity (m s⁻¹)",
              points: Array.from({ length: 28 }, (_, k) => {
                const t = 0.3 + (k * 0.92) / 27;
                return [+t.toFixed(3), +(7.2 - 9.6 * t).toFixed(3)] as [number, number];
              }),
              marks: [{ at: [0.3, 4.32], label: "P" }],
            }),
          ]),
        ],
        { dir: "column", align: "center" },
      ),
      alt: "Part (a) set-up: the trajectory is drawn on a wall; the starting point P is on the wall. A metre ruler lies on the floor in front of the wall (closer to the camera than the trajectory), and the camera stands close to the wall, off to one side of P. Part (b): a strobe image shows the ball leaving P, moving to the left, rising to a peak and falling. Graph 1: horizontal displacement (m) against time (s) is a straight line from 0 at P (t ≈ 0.3 s) to about −1.4 m at t ≈ 1.17 s, passing through about −0.3 m at 0.5 s and −1.1 m at 1.0 s. Graph 2: vertical velocity (m s⁻¹) against time is a straight line from about +4.3 m s⁻¹ at P (t ≈ 0.3 s) down to about −4.5 m s⁻¹ at t ≈ 1.2 s, passing through about +2.4 m s⁻¹ at 0.5 s and −2.4 m s⁻¹ at 1.0 s.",
    }),

  sa(137, 5, "Shore 2021 Trial, Q25",
    "Fred is playing tennis. He services the ball so that it leaves the racket 3.2 m above the ground. The ball leaves the racket at an angle of 8 degrees to the horizontal as shown. At its maximum height the ball has a speed of 20 m s⁻¹.\n(a) At what speed, relative to the ground, did the ball leave Fred's racket? [1 mark]\n(b) At what horizontal distance from the point where the ball leaves the racket will it hit the ground? [4 marks]",
    { svg: serveAngle(), alt: "The ball's initial velocity is drawn as an arrow at 8° above the horizontal." }),

  sa(138, 5, "Sydney Boys 2019 Trial, Q25",
    "Maverick's F14 plane is flying at a constant altitude of 200.0 m and a speed of 300.0 m s⁻¹ when he fires his missile. The missile's engine creates an acceleration of 25.0 m s⁻² for 10.0 seconds in a straight line and maintains the same altitude. The missile then follows normal projectile motion to hit the target on the ground.\n(a) Calculate the distance travelled by the missile during the first 10 seconds. [2 marks]\n(b) Determine the horizontal distance from the target that Maverick should fire his missile in order to hit it. [3 marks]"),

  sa(139, 4, "Hurlstone 2008 Half-yearly, Q7",
    "(a) The following is a Y-velocity vs time graph for a projectile thrown on another planet. Use this graph to calculate the acceleration due to gravity on the planet. [2 marks]\n(b) The following graph shows an X-displacement vs time graph for the same projectile. Using information from both graphs, calculate the velocity of the projectile at t = 0.54 s [2 marks]",
    {
      svg: stack(
        [
          xyGraph({
            xMax: 1.1, yMin: -15, yMax: 15, xStep: 0.5, yStep: 5, minor: 5, width: 300, height: 200,
            xLabel: "Time (s)", yLabel: "Y velocity (m/s)",
            points: Array.from({ length: 32 }, (_, k) => [+(k / 30).toFixed(3), +(14.6 - 28.0 * (k / 30)).toFixed(2)] as [number, number]),
          }),
          xyGraph({
            xMax: 1.1, yMin: -4, yMax: 4, xStep: 0.5, yStep: 2, minor: 4, width: 300, height: 200,
            xLabel: "Time (s)", yLabel: "X (m)",
            points: Array.from({ length: 32 }, (_, k) => [+(k / 30).toFixed(3), +(-3.9 + 7.26 * (k / 30)).toFixed(2)] as [number, number]),
          }),
        ],
        { dir: "column" },
      ),
      alt: "Graph 1, Y velocity (m/s) against time (s): data points every 1/30 s fall in a straight line from about +14.6 m/s at t = 0 through zero at about t = 0.52 s to about −14.3 m/s at t = 1.03 s. Graph 2, X displacement (m) against time (s): data points rise in a straight line from about −3.9 m at t = 0 through zero at about t = 0.54 s to about +3.6 m at t = 1.03 s.",
    }),

  sa(140, 5, "Sydney Girls 2020 Trial, Q21",
    "A tennis ball bounces off the ground at an angle of 40° to the horizontal, with an initial velocity of 25 m s⁻¹. The tennis court fence is six metres away, and is 4 m high.\n(a) Calculate the time needed for the ball to travel a horizontal distance of 6 m. [3 marks]\n(b) Determine whether the ball will go over the fence. Support your answer with calculations. [2 marks]"),

  sa(141, 6, "Sydney Grammar 2018 Half-yearly, Q17",
    "On a tall platform an arrow (arrow A) is fired horizontally from a height of 40 m and hits a target 50 m horizontally away. Another arrow (arrow B) is fired upwards, hitting the same target again. Arrow B was in the air for twice as long as arrow A.\n(a) What is the time of flight of arrow A? [1 mark]\n(b) What is the initial horizontal velocity of arrow A? [1 mark]\n(c) Determine the initial velocity of arrow B. [4 marks]",
    {
      svg: towerTwoArrows(),
      alt: "An archer on top of a 40 m tower. Arrow A is fired horizontally and curves down to a target on the ground 50 m away horizontally. Arrow B is fired upwards, rises above the launch height and comes down onto the same target. Not to scale.",
    }),

  sa(142, 4, "Sydney Grammar 2020 Trial, Q21",
    "A helicopter is to drop a rescue pack to a group of hikers. The helicopter is flying at a horizontal speed of 52.5 m s⁻¹ at a constant height of 250 m above the ground.\n(a) For the rescue package to land beside the hikers, at what distance d from the hikers should the package be released from the plane? [2 marks]\n(b) What will be the speed of the package as it hits the ground? [2 marks]",
    {
      svg: helicopterDrop(),
      alt: "A helicopter flies horizontally at 52.5 m s⁻¹, 250 m above the ground. The hikers stand on the ground ahead; d is the horizontal distance from the point below the helicopter to the hikers. Not to scale.",
    }),

  sa(143, 8, "Sydney Grammar 2022 Trial, Q36",
    "A golfer must hit a shot over a tree and onto an elevated green as shown in the diagram below.\nThe distance to the tree is x = 8.6 m. The height of the green the ball lands on is h = 3.0 m and the maximum height his shot reaches is 2h.\n(a) What is the initial vertical velocity of the ball? [2 marks]\n(b) How long will it take the ball to reach its maximum height? [1 mark]\n(c) What is the initial launch angle of the ball above the horizontal? [3 marks]\n(d) What is the distance d? [2 marks]",
    {
      svg: treeAndGreen(),
      alt: "A golfer hits a ball over a tree a horizontal distance x from the golfer. The ball's highest point (height 2h) is directly above the tree; the tree is h tall. The ball lands on a green raised to height h, a horizontal distance d beyond the tree.",
    }),

  sa(144, 5, "Sydney Grammar 2024 Trial, Q39",
    "Two projectiles are fired simultaneously at the same launch speed of 15 m s⁻¹ from two different angles. Their trajectories, 1 and 2, are shown in the graph below. At point A, both trajectories have a horizontal displacement of 10 m, and a vertical displacement of 6.0 m.\n(a) The maximum height that that trajectory 1 reaches is 10.6 m. Determine the launch angle of trajectory 1. [2 marks]\n(b) Trajectory 2 is launched at an angle of 46.8°. Determine its speed at point A. [3 marks]",
    {
      svg: xyGraph({
        xMax: 14, yMin: -10, yMax: 15, xStep: 2, yStep: 5, minor: 5, width: 300, height: 220,
        xLabel: "Horizontal Displacement (m)", yLabel: "Vertical Displacement (m)",
        curves: [
          {
            pts: Array.from({ length: 41 }, (_, k) => {
              const t = (k / 40) * (14 / 4.16);
              return [+(4.16 * t).toFixed(3), +(14.41 * t - 4.9 * t * t).toFixed(3)] as [number, number];
            }),
            label: "Trajectory 1", labelAt: [3, 11.5],
          },
          {
            pts: Array.from({ length: 41 }, (_, k) => {
              const t = (k / 40) * (14 / 10.27);
              return [+(10.27 * t).toFixed(3), +(10.93 * t - 4.9 * t * t).toFixed(3)] as [number, number];
            }),
            label: "Trajectory 2", labelAt: [7, 2.5], color: "#c2410c",
          },
        ],
        marks: [{ at: [10, 6], label: "A" }],
      }),
      alt: "Graph of vertical displacement (m, −10 to 15) against horizontal displacement (m, 0 to 14). Trajectory 1 rises steeply from the origin to a maximum of about 10.6 m at about 6 m, passes through A at (10, 6) on the way down and falls below −7 m by 14 m. Trajectory 2 rises less steeply, passes through A at (10, 6) close to its highest point (about 6.1 m at about 11.5 m) and is at about 5.8 m at 14 m.",
    }),
];

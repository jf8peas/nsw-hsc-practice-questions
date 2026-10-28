import type { Question } from "@/lib/types";
import { mc, sa } from "./build";
import {
  accelerationArrowPanels,
  alignedPlanetsPanels,
  binaryStars,
  cassiniLine,
  circleAndEllipseVelocities,
  concentricOrbits,
  dataTable,
  dscovrDiagram,
  ellipseFociChords,
  ellipseOrbit,
  energyDotGraph,
  equalAreaSectors,
  fieldStrengthGraph,
  forceDistanceGraph,
  geoLeoCoverage,
  geoReturnPanels,
  halleyOrbit,
  launchToOrbit,
  linearDataGraph,
  molniyaOrbit,
  moonForceGraph,
  newtonsCannon,
  orbitChangePanels,
  orbitPathPanels,
  perihelionAphelion,
  perihelionAphelionPoints,
  planetMoonPath,
  potentialEnergyAltitudeGraph,
  potentialHeightSketch,
  potentialLineXY,
  projectileEllipse,
  sameEnergyOrbits,
  satelliteAtHeight,
  saturnRing,
  scaleSatellites,
  spacecraftLaunch,
  stack,
  straightLineGraph,
  sweptSegments,
  totalEnergyRadiusSketch,
  twoMasses,
  twoSpheres,
  velocityVectorFigures,
  venusOrbit,
  wavyPathNearEarth,
} from "./diagram";

// Knox 2020 Q15: total energy at five heights, read from the source graph.
const KNOX20_E = [-6, -3.3, -1.8, -1.0, -0.7];
const neg = (k: number) => KNOX20_E.map((e) => +(k * e).toFixed(1));

// PUBLIC — no answer keys. Motion in gravitational fields: MC m001–m090, SA s001–s090.
// Questions are copied word for word from school trial / half-yearly papers and show their
// source (constitution Principle V). Layout-only changes: option letters removed (options are
// shuffled), tables become an SVG table or option text, and diagrams are redrawn in code.
// Every change beyond layout is listed in resources/topic006/06-transcription-log.md.

export const gravitationQuestions: Question[] = [
  mc(1, "Abbotsleigh 2023 Trial, Q11",
    "A satellite revolves around a planet X1B2 with a period of 2.45 × 10⁷ s at an orbital radius of 3.80 × 10¹⁰ m. What is the mass of X1B2?",
    ["3.74 × 10⁷ kg", "1.42 × 10¹⁸ kg", "5.41 × 10²⁸ kg", "1.32 × 10³⁶ kg"]),

  mc(2, "Ascham 2024 Trial, Q2",
    "A planet orbits a star in an elliptical orbit moving in the direction shown.\nAt the position shown, which quantity is decreasing for the planet?",
    ["acceleration", "gravitational potential energy", "kinetic energy", "total energy"],
    {
      svg: ellipseOrbit({
        central: { label: "star", kind: "star", labelDx: 14, labelDy: 22 },
        points: [{ at: 75, label: "planet", labelDx: 6, labelDy: -8 }],
        arrows: [{ at: 98, dir: "ccw" }],
      }),
      alt: "Elliptical orbit with the star at the left focus. The planet is at the top of the orbit and moving left, towards the star's end.",
    }),

  mc(3, "Ascham 2024 Trial, Q7",
    "Planets X and Y orbit the same star.\nThe average distance between planet X and the star is five times greater than the average distance between planet Y and the star.\nWhat is (orbital period of Planet X) ÷ (orbital period of Planet Y)?",
    ["(√5)^(1/3)", "√5", "(√(5²))^(1/3)", "√(5³)"]),

  mc(4, "Barker 2020 Trial, Q8",
    "The Graph shows how the gravitational potential energy U (or Eₚ) of a satellite changes with altitude.\nWhat is the change in gravitational potential energy of the satellite when its altitude is reduced from 14000 km to 4000 km?",
    ["−8.8 × 10⁹ J", "−2.8 × 10⁹ J", "+2.8 × 10⁹ J", "+8.8 × 10⁹ J"],
    {
      svg: potentialEnergyAltitudeGraph({ gmm: 6.0e16, earthRadius: 6.37e6, hMaxKm: 20000, uMinE9: -10 }),
      alt: "Graph of gravitational potential energy (10⁹ J, from 0 down to −10) against altitude (0 to 20 000 km). The curve starts near −9.4 at zero altitude and rises towards zero, reaching about −2.3 at 20 000 km.",
    }),

  mc(5, "Barker 2020 Trial, Q12",
    "The magnitude of the acceleration due to gravity at Earth’s surface is g.\nPlanet Y has twice the mass and half the radius of Earth. Both planets can be considered to be uniform spheres.\nWhich one of the following best gives the magnitude of the acceleration due to gravity on the surface of Planet Y?",
    ["½ g", "1 g", "4 g", "8 g"]),

  mc(6, "Baulkham Hills 2021 Trial, Q3",
    "Two planets, A and B orbit the same star. Planet A has an orbital radius of 2 × 10⁸ m whilst Planet B has an orbital radius of 6 × 10⁹ m. If Planet A’s mass is 3 × 10²⁵ kg and has an orbital period of 15 ooshwucks (measurement of time in Planet A). What is the orbital period of Planet B in ooshwucks?",
    ["4.243 × 10⁻²³", "2465", "493.0", "144.8"]),

  mc(7, "Baulkham Hills 2021 Trial, Q7",
    "What is the altitude of a geostationary satellite?",
    ["42,230 km", "8.086 × 10¹³ m", "5083 km", "35,930 km"]),

  mc(8, "Baulkham Hills 2022 Trial, Q7",
    "A satellite is in a stable geostationary orbit around the Earth.\nWhich of the options below best shows the satellite’s path if the gravitational force on it was somehow removed when it was at point X?",
    ["Diagram A", "Diagram B", "Diagram C", "Diagram D"],
    {
      svg: orbitPathPanels([
        { label: "Diagram A", path: "tangent", caption: "Orbit of satellite" },
        { label: "Diagram B", path: "outward", caption: "Orbit of satellite" },
        { label: "Diagram C", path: "inward" },
        { label: "Diagram D", path: "radial-in" },
      ]),
      alt: "Four diagrams of Earth with the satellite's circular orbit and point X on the right. A: a straight line from X along the tangent. B: a path from X curving outward, away from Earth. C: a path from X curving inward, towards Earth. D: a straight line from X towards Earth.",
    }),

  mc(9, "Baulkham Hills 2023 Trial, Q3",
    "Jet, an astronaut floating in the International Space Station while it is orbiting Earth, feels weightless.\nThis is because",
    ["His mass is now zero.", "The gravitational force on him is zero.", "The gravitational force is balanced by the centrifugal force.", "Gravity is the only force acting on him."]),

  mc(10, "Caringbah 2020 Trial, Q5",
    "Which of the following could represent the kinetic energy, the gravitational potential energy and the total energy for an orbiting satellite in a stable circular orbit?",
    [
      "Kinetic energy 40 000 J; gravitational potential energy −80 000 J; total energy −40 000 J",
      "Kinetic energy 40 000 J; gravitational potential energy 40 000 J; total energy 80 000 J",
      "Kinetic energy 80 000 J; gravitational potential energy 40 000 J; total energy 120 000 J",
      "Kinetic energy 80 000 J; gravitational potential energy −40 000 J; total energy 40 000 J",
    ]),

  mc(11, "Caringbah 2020 Trial, Q8",
    "Which planet would have the lowest escape velocity?",
    [
      "Newton: planet mass 5 × 10²⁴ kg, planet radius 8000 km",
      "Einstein: planet mass 8 × 10²⁴ kg, planet radius 7800 km",
      "Bohr: planet mass 5 × 10²⁴ kg, planet radius 9500 km",
      "Hawkins: planet mass 8 × 10²⁴ kg, planet radius 10200 km",
    ]),

  mc(12, "Caringbah 2024 Trial, Q3",
    "The force of gravity between two objects is F. What happens to the force of gravity between both objects if the distance between the objects is doubled?",
    ["F/2", "2F", "F/4", "F/8"]),

  mc(13, "Caringbah 2024 Trial, Q4",
    "Which of the following variables need to be aligned for a satellite to be in geostationary orbit around a planet?",
    [
      "The orbital velocity of both the satellite and the planet are equal.",
      "The period of one revolution of the satellite is equal to the time taken for one spin of the planet on its axis.",
      "The period of the planet and the satellite are equal.",
      "The mass of the planet and the satellite must be equal.",
    ]),

  mc(14, "Cherrybrook Tech 2025 Trial, Q12",
    "Two planets, A and B, orbit the same star. Planet A’s average orbital distance is six times larger than the average orbital distance of planet B.\nWhat is the relationship between the orbital periods, T, of the planets?",
    ["T_A = 3 T_B", "T_A = 15 T_B", "T_A = 36 T_B", "T_A = 216 T_B"]),

  mc(15, "Girraween 2023 Trial, Q8",
    "The diagram shows the perigee and apogee of the moon – two points in the moon’s elliptical orbit around Earth.\nWhich of the following statements is correct?",
    [
      "When the moon reaches the apogee, its gravitational potential energy as well as its kinetic energy will be at minimum. It will move at a low velocity.",
      "When the moon reaches the apogee, its gravitational potential energy as well as its kinetic energy will be at maximum. It will move at a high velocity.",
      "When the moon reaches the perigee, its gravitational potential energy will be at a minimum and its kinetic energy will be at a maximum. It will move at a high velocity.",
      "When the moon reaches the perigee, its gravitational potential energy will be at a maximum and its kinetic energy will be at a minimum. It will move at a low velocity.",
    ],
    {
      svg: ellipseOrbit({
        a: 130,
        b: 70,
        width: 400,
        height: 200,
        dashed: true,
        centralAt: -0.2,
        central: { label: "Earth", kind: "planet", r: 18 },
        points: [
          { at: 90, label: "Moon", labelDx: -14, labelDy: -10, color: "#64748b" },
          { at: 180, label: "perigee", labelDx: -46, labelDy: 4, kind: "mark" },
          { at: 0, label: "apogee", labelDx: 6, labelDy: 4, kind: "mark" },
        ],
        arrows: [{ at: 120, dir: "ccw", color: "#334155" }, { at: 300, dir: "ccw", color: "#334155" }],
        radials: [{ at: 180, label: "362 570 km" }, { at: 0, label: "405 410 km" }],
      }),
      alt: "The Moon's elliptical orbit around Earth, travelling anticlockwise. Perigee, 362 570 km from Earth, is on the left; apogee, 405 410 km from Earth, is on the right.",
    }),

  mc(16, "Girraween 2024 Trial, Q12",
    "Kepler’s Law of Periods, summarised in the equation T² = kR³, shows a relationship between the orbital period and the radius of a planet orbiting a star.\nIn which of the following situations would a change in the value of the constant k, be needed?",
    [
      "For a planet of the greater orbital period",
      "For a planet of a smaller orbital radius",
      "For an identical planet orbiting a different star",
      "For a planet of different mass orbiting the same star",
    ]),

  mc(17, "Girraween 2024 Trial, Q16",
    "LEOSAR is a search and rescue satellite currently in a low Earth orbit of 850 km and must be brought down to a lower orbit of 650 km for a mission over the Pacific Ocean.\nIn order to be stable in the lower orbit, the speed of the LEOSAR satellite would need to",
    ["Increase by 105 m/s", "Decrease by 105 m/s", "Increase by 3115 m/s", "Decrease by 3115 m/s"]),

  mc(18, "Girraween 2024 Trial, Q18",
    "A physicist team is researching two planets, Ursae Majoris B and Ursae Majoris C, that orbit a distant star. The table shows some of the data that the team has gathered.\nBased on the data in the table, which of the following statements is correct?",
    [
      "The acceleration due to gravity experienced by Ursae Majoris B is 2.5 times greater than that due to gravity experienced by Ursae Majoris C.",
      "The acceleration due to gravity experienced by Ursae Majoris C is 2.5 times greater than that due to gravity experienced by Ursae Majoris B.",
      "The acceleration due to gravity experienced by Ursae Majoris B is 6.3 times greater than that due to gravity experienced by Ursae Majoris C.",
      "The acceleration due to gravity experienced by Ursae Majoris C is 6.3 times greater than that due to gravity experienced by Ursae Majoris B.",
    ],
    {
      svg: dataTable({
        headers: ["Planet", "Radius of orbit (m)", "Orbital Period (s)"],
        rows: [
          ["Ursae Majoris B", "6.2 × 10⁸", "4.2 × 10⁴"],
          ["Ursae Majoris C", "1.56 × 10⁹", "1.68 × 10⁵"],
        ],
        colWidths: [120, 120, 110],
      }),
      alt: "Table. Ursae Majoris B: radius of orbit 6.2 × 10⁸ m, orbital period 4.2 × 10⁴ s. Ursae Majoris C: radius of orbit 1.56 × 10⁹ m, orbital period 1.68 × 10⁵ s.",
    }),

  mc(19, "Gosford 2022 Trial, Q2",
    "Which is a correct expression for the total energy of an orbiting satellite?",
    ["E_total = E_K / 2", "E_total = −E_K / 2", "E_total = U / 2", "E_total = −U / 2"]),

  mc(20, "Gosford 2022 Trial, Q3",
    "Two satellites are in the same Low Earth Orbit. Satellite X has four times the mass of satellite Y.\nWhat is the ratio of their orbital speeds?",
    ["X : Y = 1 : 1", "X : Y = 1 : 4", "X : Y = 4 : 1", "X : Y = 2 : 1"]),

  mc(21, "Hornsby Girls 2021 Trial, Q2",
    "The diagram (not to scale) shows two identical satellites orbiting a planet. The orbital radius of the satellite X is r. Satellite Y, is 2r from the planet's centre.\nHow would the gravitational potential energy of satellite Y change if it was moved into the same orbit as X?",
    ["It would increase by a factor of 2.", "It would decrease by a factor of 2.", "It would increase by a factor of 4.", "It would decrease by a factor of 4."],
    {
      svg: concentricOrbits({
        radii: [55, 108],
        central: { label: "", r: 18 },
        bodies: [
          { orbit: 0, at: 0, label: "X", labelDx: 8, labelDy: 5 },
          { orbit: 1, at: 118, label: "Y", labelDx: -6, labelDy: -10 },
        ],
        radials: [
          { orbit: 1, at: 146, label: "2r", labelDx: 6, labelDy: 16, labelAt: 0.74 },
          { orbit: 0, at: -34, label: "r", labelDx: 4, labelDy: 18 },
        ],
      }),
      alt: "A planet with two circular orbits around it. Satellite X is on the inner orbit, radius r. Satellite Y is on the outer orbit, radius 2r.",
    }),

  mc(22, "James Ruse 2020 Trial, Q9",
    "Which row of the table shows the correct relationship between the escape velocity, v_esc and orbital velocity, v_orb, and the relationship between the total energy, E and kinetic energy, K and / or potential energy, U of a satellite in orbit?",
    ["v_orb = √2 v_esc; K = −U / 2", "v_esc = √2 v_orb; E = U / 2", "v_esc = √2 v_orb; K = U / 2", "v_orb = √2 v_esc; E = −U / 2"]),

  mc(23, "James Ruse 2021 Trial, Q14",
    "Figure 1 shows satellite A in an elliptical orbit around Earth. The velocity of satellite A at two locations, X and Y, is shown using vectors.\nFigure 2 shows satellite B in a circular orbit around Earth. The velocity of satellite B at two locations P and Q is also shown using vectors.\nWhich of the following correctly describes the work done by the force of gravity on satellite A as it moves between positions X and Y, and the work done on satellite B as it moves between positions P and Q?",
    [
      "Work done on satellite A from X to Y: non-zero; work done on satellite B from P to Q: zero",
      "Work done on satellite A from X to Y: non-zero; work done on satellite B from P to Q: non-zero",
      "Work done on satellite A from X to Y: zero; work done on satellite B from P to Q: zero",
      "Work done on satellite A from X to Y: zero; work done on satellite B from P to Q: non-zero",
    ],
    {
      svg: velocityVectorFigures(),
      alt: "Figure 1: satellite A on an elliptical orbit with Earth near the left end. At X, on the top of the orbit, its velocity points left; at Y, the left end of the orbit, its velocity points down. Figure 2: satellite B on a circular orbit around Earth. At P, the top, its velocity points left; at Q, the left side, its velocity points down.",
    }),

  mc(24, "James Ruse 2021 Trial, Q17",
    "Two satellites, A and B, of equal mass m, orbit the Earth at an altitude of R and 3R respectively, where R is the radius of the Earth in km.\nWhich row of the table is a correct comparison of the satellites' gravitational potential energy U and orbital velocity v?",
    ["U_A = 3U_B; v_A = √3 v_B", "U_A = 2U_B; v_A = √3 v_B", "U_A = 3U_B; v_A = √2 v_B", "U_A = 2U_B; v_A = √2 v_B"]),

  mc(25, "James Ruse 2021 Trial, Q20",
    "A probe is launched vertically upwards from the surface of a planet, of radius R, with speed equal to three quarters the escape speed for that planet.\nIn terms of R, what is the maximum height, from the surface of the planet, reached by the probe? Ignore air resistance.",
    ["(16/7) R", "(9/16) R", "(9/7) R", "(23/9) R"]),

  mc(26, "James Ruse 2022 Trial, Q6",
    "A satellite in a circular orbit at position X (shown as a solid line) fires its thrusters briefly, once. This has the effect of reducing its orbital speed.\nWhich of the following shows a possible final orbit for the satellite?",
    ["Diagram A", "Diagram B", "Diagram C", "Diagram D"],
    {
      svg: orbitChangePanels([
        { label: "A", final: "inner-ellipse" },
        { label: "B", final: "outer-ellipse" },
        { label: "C", final: "outer-circle" },
        { label: "D", final: "inner-circle" },
      ]),
      alt: "Four diagrams, each with the original circular orbit as a solid line, X on its left edge and the planet at its centre. The final orbit is dashed. A: a smaller ellipse inside the circle, touching it at X. B: a larger ellipse outside the circle, touching it at X. C: a larger circle around the original. D: a smaller circle inside the original.",
    }),

  mc(27, "James Ruse 2022 Trial, Q13",
    "The graph below shows gravitational field strength as a function of distance from the centre of Mars.\nUsing information on the graph, determine which of the following is closest to the mass of Mars.",
    ["6 × 10¹⁶ kg", "3 × 10¹⁷ kg", "6 × 10²³ kg", "3 × 10²⁴ kg"],
    {
      svg: fieldStrengthGraph({ gm: 4.0e13, rMin: 2e6, rMax: 1e7, gMax: 10 }),
      alt: "Graph of g (m s⁻²) against r (m). The curve starts at g = 10 at r = 2 × 10⁶ m and falls, passing g = 2.5 at 4 × 10⁶ m, about 1.1 at 6 × 10⁶ m and 0.4 at 1 × 10⁷ m.",
    }),

  mc(28, "James Ruse 2022 Trial, Q17",
    "A 1000 kg satellite is to be moved from a circular Low-Earth orbit with a radius of 6800 km to a geostationary orbit at a radius of 42 000 km.\nWhat is the minimum energy that must be supplied to insert the satellite into the new orbit?",
    ["2.5 × 10¹⁰ J", "4.9 × 10¹⁰ J", "2.5 × 10¹³ J", "4.9 × 10¹³ J"]),

  mc(29, "James Ruse 2024 Half-yearly, Q2",
    "The Earth planet has mass M and radius R. Due to its mass, it has a gravitational field around it. Select the most correct answer about acceleration due to gravity.",
    [
      "Formula: F = GMm / R²; direction: towards the centre",
      "Formula: g = GM / R²; direction: towards the centre",
      "Formula: W = m x g; direction: away from the centre",
      "Formula: F = m x a; direction: away from the centre",
    ]),

  mc(30, "James Ruse 2024 Trial, Q13",
    "Two satellites orbit a planet. One of the satellites has an orbital radius of 2.3 × 10⁶ m and a period of 7.6 × 10⁴ s. The other satellite has an orbital period of 1.3 × 10⁵ s. What is the orbital radius of this second satellite?",
    ["1.3 × 10⁶ m", "3.3 × 10⁶ m", "3.9 × 10⁶ m", "5.1 × 10⁶ m"]),

  mc(31, "James Ruse 2024 Trial, Q14",
    "A 500 kg satellite is initially in a circular orbit with a radius of 10 000 km around the Earth. The satellite is then moved to a new circular orbit with a radius of 20 000 km.\nWhat is the change in the gravitational potential energy of the satellite?",
    ["1.5 × 10³ J", "1.5 × 10⁹ J", "1.0 × 10¹⁰ J", "1.0 × 10¹³ J"]),

  mc(32, "Kinross Wolaroi 2022 Trial, Q2",
    "Which of the following diagrams best represents this satellite’s acceleration at this instance of its orbit?",
    ["Diagram A", "Diagram B", "Diagram C", "Diagram D"],
    {
      svg: accelerationArrowPanels([
        { label: "A", aim: "centre" },
        { label: "B", aim: "above-centre" },
        { label: "C", aim: "below-centre" },
        { label: "D", aim: "tangent" },
      ]),
      alt: "Four copies of a satellite on a tilted elliptical orbit around Earth, with the satellite on the lower right of the orbit. A: arrow pointing to the centre of Earth. B: arrow pointing above Earth's centre. C: arrow pointing below Earth's centre. D: arrow pointing along the orbit.",
    }),

  mc(33, "Kinross Wolaroi 2022 Trial, Q6",
    "A representation of the orbit of Halley’s comet is shown below.\nDifferent positions in the orbit are designated by the letters A, B, C and D.\n(The diagram is not to scale.)\nWhich row in the following table correctly expresses the variations in the comet’s speed and its total mechanical energy as it orbits the Sun?",
    [
      "Speed: v_B > v_C > v_A > v_D; total mechanical energy: E_A > E_B > E_C > E_D",
      "Speed: v_D > v_A > v_C > v_B; total mechanical energy: E_A > E_B > E_C > E_D",
      "Speed: v_B > v_C > v_A > v_D; total mechanical energy: E_A = E_B = E_C = E_D",
      "Speed: v_D > v_A > v_C > v_B; total mechanical energy: E_A = E_B = E_C = E_D",
    ],
    {
      svg: halleyOrbit(),
      alt: "A long, thin elliptical comet orbit with the Sun near its left end, inside Earth's dashed circular orbit; part of Neptune's orbit passes near the right end. The comet moves right along the top and left along the bottom. A is on the top, left of centre; B is at the far right end; C is on the bottom, right of centre; D is on the bottom close to the Sun.",
    }),

  mc(34, "Knox 2020 Trial, Q4",
    "Which of the following statements about the orbits of the planets is NOT one of Kepler's three Laws?",
    [
      "The Earth moves faster when it is closer to the Sun.",
      "Mars' orbit has an elliptical shape with the Sun at one focus.",
      "The total orbital energy of Neptune has the same magnitude as its kinetic energy.",
      "The ratio of the period squared to the radius cubed of Venus and Mercury is the same.",
    ]),

  mc(35, "Knox 2020 Trial, Q15",
    "The total energy of a satellite in orbit at different heights is shown below:\nWhich of the following graphs shows the correct kinetic and potential energies for this satellite?",
    ["Graph A", "Graph B", "Graph C", "Graph D"],
    {
      svg: stack(
        [
          energyDotGraph({ yMin: -8, yMax: 8, series: [{ values: KNOX20_E, color: "dark" }], label: "Total energy", width: 300 }),
          stack(
            [
              stack([
                energyDotGraph({ label: "A", yMin: -14, yMax: 8, series: [{ values: neg(-1), color: "dark" }, { values: neg(2), color: "light" }] }),
                energyDotGraph({ label: "C", yMin: -8, yMax: 14, series: [{ values: neg(-2), color: "dark" }, { values: neg(1), color: "light" }] }),
              ]),
              stack([
                energyDotGraph({ label: "B", yMin: -12, yMax: 12, series: [{ values: neg(-2), color: "dark" }, { values: neg(2), color: "light" }] }),
                energyDotGraph({ label: "D", yMin: -8, yMax: 8, series: [{ values: neg(-1), color: "dark" }, { values: neg(1), color: "light" }] }),
              ]),
            ],
            { dir: "column", gap: 12 },
          ),
        ],
        { dir: "column", gap: 18 },
      ),
      alt: "Top graph: total energy at five heights, all negative: −6, −3.3, −1.8, −1.0 and −0.7. Below, four graphs each show two sets of points, dark and light. A: dark points 6, 3.3, 1.8, 1.0, 0.7; light points −12, −6.6, −3.6, −2.0, −1.4. B: dark 12, 6.6, 3.6, 2.0, 1.4; light −12, −6.6, −3.6, −2.0, −1.4. C: dark 12, 6.6, 3.6, 2.0, 1.4; light −6, −3.3, −1.8, −1.0, −0.7. D: dark 6, 3.3, 1.8, 1.0, 0.7; light −6, −3.3, −1.8, −1.0, −0.7.",
    }),

  mc(36, "Knox 2022 Trial, Q18",
    "Planet X is three times the radius of Planet Y and two times the mass.\nWhat is the ratio of the gravitational field strength of Planet X to Planet Y?",
    ["0.22 : 1", "0.66 : 1", "1.5 : 1", "4.5 : 1"]),

  mc(37, "Knox 2023 Trial, Q16",
    "For an object to leave the Earth’s gravitational field it must be projected at escape velocity.\nWhich of the following is NOT a consideration in the definition of escape velocity?",
    [
      "The object reaches an infinite distance from Earth.",
      "The Earth’s gravitational force stops acting on the object.",
      "The acceleration of the object equals the gravitational acceleration of the Earth.",
      "The initial gravitational potential energy and kinetic energy of the object are equal in magnitude.",
    ]),

  mc(38, "Knox 2023 Trial, Q20",
    "Two satellites, A and B are orbiting Earth at different altitudes as shown in the diagram and table below.\nDetermine the ratio of T_A:T_B.",
    ["0.0237", "0.125", "0.354", "2.828"],
    {
      svg: stack([
        concentricOrbits({
          radii: [72, 96],
          dashed: true,
          central: { label: "Earth", r: 13 },
          bodies: [
            { orbit: 0, at: 122, label: "A", labelDx: 6, labelDy: 16 },
            { orbit: 1, at: 122, label: "B", labelDx: -6, labelDy: -10 },
          ],
          size: 230,
        }),
        dataTable({ headers: ["Satellite", "Altitude (km)"], rows: [["A", "629"], ["B", "7 629"]], colWidths: [90, 110], italicHeaders: false }),
      ]),
      alt: "Earth with two dashed circular orbits; satellite A on the inner orbit and B on the outer orbit. Table: satellite A altitude 629 km, satellite B altitude 7 629 km.",
    }),

  mc(39, "Knox 2025 Trial, Q1",
    "A satellite is moved from a low Earth orbit (LEO) to a geostationary orbit (GEO).\nThe satellite will now be able to:",
    [
      "image the surface of the entire Earth.",
      "take more detailed images of the Earth.",
      "continuously monitor the same location on Earth.",
      "move over the surface of the Earth and therefore scan a larger area of the Earth.",
    ],
    {
      svg: geoLeoCoverage(),
      alt: "Earth with a distant GEO satellite on the left whose view lines just touch the edges of Earth, covering a large part of it, and a LEO satellite close to Earth on the lower right whose view covers a small patch.",
    }),

  mc(40, "Knox 2025 Trial, Q20",
    "Two satellites orbit the same planet. Satellite A has a period that is 8 times smaller than satellite B.\nCalculate the ratio of the speed v_A:v_B of the two satellites.",
    ["v_A:v_B = 1:1", "v_A:v_B = 2:1", "v_A:v_B = 4:1", "v_A:v_B = 8:1"]),

  mc(41, "Ascham 2016 Trial, Q12",
    "Two satellites, X and Y, orbit the Earth. The mass of X is half that of Y. The orbital radius of X is twice that of Y.\nWhat is the ratio of the orbital speed of satellite X to the orbital speed of Y?",
    ["1 : √2", "√2 : 1", "1 : 1", "1 : 2"]),

  mc(42, "Newington 2019 Trial, Q4",
    "Titan is a moon of planet Saturn. It has a gravitational field strength of 1.35 N kg⁻¹ on its surface that is 2575 km from Titan’s centre.\nWhat is the mass of Titan closest to?",
    ["6.0 × 10²³ kg", "1.35 × 10²³ kg", "40 × 10⁹ kg", "9 × 10²⁴ kg"]),

  mc(43, "Newington 2019 Trial, Q5",
    "Which of the following alternatives correctly compares all the identified factors in terms of a satellite in a geostationary orbit around the Earth, relative to the same satellite in a stable circular low-Earth orbit?\nRelative to the satellite in a low-Earth orbit, the satellite in a geostationary orbit has:",
    [
      "Higher speed; longer orbital period; greater orbital radius; more centripetal force",
      "Lower speed; longer orbital period; greater orbital radius; less centripetal force",
      "Higher speed; shorter orbital period; greater orbital radius; less centripetal force",
      "Lower speed; shorter orbital period; lower orbital radius; more centripetal force",
    ]),

  mc(44, "Newington 2023 Trial, Q4",
    "Most stars have at least one planet orbiting them. Two planets, Centaur and Tri, have been observed to orbit a star. Centaur has an orbital path with a radius that is four times smaller than the radius of Tri’s orbital path.\nWhich of the following statements about Centaur and Tri is correct?",
    [
      "Tri would take 8 times longer than Centaur to make a full orbit of the star",
      "Centaur would take 8 times longer than Tri to make a full orbit of the star",
      "Tri would take 64 times longer than Centaur to make a full orbit of the star",
      "Centaur would take 64 times longer than Tri to make a full orbit of the star",
    ]),

  mc(45, "Newington 2023 Trial, Q5",
    "Jupiter’s moon Ganymede is its largest satellite.\nGanymede has a mass of 1.5 × 10²³ kg and a radius of 2.6 × 10⁶ m.\nWhich one of the following is closest to the magnitude of Ganymede’s surface gravity?",
    ["0.8 m s⁻²", "1.5 m s⁻²", "3.8 m s⁻²", "9.8 m s⁻²"]),

  mc(46, "Cheltenham Girls 2010 Trial, Q3",
    "A satellite is placed in a circular orbit about the Earth.\nIf the orbital radius of the satellite increases, what effect will this have on its kinetic energy and gravitational potential energy?",
    [
      "Kinetic energy: increase; gravitational potential energy: decrease",
      "Kinetic energy: increase; gravitational potential energy: increase",
      "Kinetic energy: decrease; gravitational potential energy: decrease",
      "Kinetic energy: decrease; gravitational potential energy: increase",
    ]),

  mc(47, "Normanhurst Boys 2020 Trial, Q2",
    "Which of the following does not affect the velocity of a satellite?",
    ["The mass of the planet it orbits.", "The gravitational force of the planet.", "The mass of the satellite.", "The satellite’s altitude."]),

  mc(48, "Sydney Grammar 2022 Trial, Q11",
    "A satellite of mass m is travelling in a circular orbit of radius r around a planet of mass M. If the satellite is moved to a new circular orbit where its kinetic energy is now 25% larger, then the radius of the new circular orbit will be:",
    ["√5 r / 2", "4r / 5", "2r / √5", "5r / 4"]),

  mc(49, "Normanhurst Boys 2021 Trial, Q2",
    "A spacecraft travels from point X to point Y in the Earth’s gravitational field along the path shown.\nWhich of the following is equal to the work done by gravitational force on the spacecraft along the given path?",
    [
      "The change in gravitational potential energy between points X and Y.",
      "The change in kinetic energy between points X and Y.",
      "The change in total mechanical energy between points X and Y.",
      "No work is done by the gravitational force between points X and Y.",
    ],
    {
      svg: wavyPathNearEarth(),
      alt: "Earth with a winding dashed path above it, starting at point X on the left and ending at point Y on the upper right.",
    }),

  mc(50, "Normanhurst Boys 2021 Trial, Q3",
    "Which of the following quantities does NOT affect the magnitude of the escape velocity?",
    ["The mass of the planet.", "The mass of the object being projected.", "The radius of the planet.", "The universal gravitational constant."]),

  mc(51, "Normanhurst Boys 2021 Trial, Q10",
    "The following graph shows the relationship between the gravitational potential energy of a mass m depends on r.\nThe mass is projected vertically upwards from the Earth's surface, R_E. At a certain distance R from the centre of the Earth, the total energy of the body may be represented by a point on the line XY.\nFive points, A, B, C, D and E have been marked on this line.\nWhich rows correctly identifies point(s) which could represent the total energy of the mass represented by the following scenarios?",
    [
      "The mass is at the top of its trajectory: A; the mass is falling towards the Earth: C",
      "The mass is at the top of its trajectory: B; the mass is falling towards the Earth: C",
      "The mass is at the top of its trajectory: A; the mass is falling towards the Earth: D & E",
      "The mass is at the top of its trajectory: B; the mass is falling towards the Earth: D & E",
    ],
    {
      svg: potentialLineXY(),
      alt: "Energy against distance r. The gravitational potential energy curve starts well below zero at R_E and rises towards zero. A vertical line XY at distance R crosses the curve at B. Above B are C (between the curve and zero), D (at zero) and E (above zero); A is below the curve.",
    }),

  mc(52, "North Sydney Boys 2019 Trial, Q2",
    "Planet Falcon is 12 times more massive, with a radius 4 times that of Planet Unicorn. What is the ratio of gravitational acceleration at the surface of Planet Falcon to Planet Unicorn?",
    ["1 : 3", "3 : 1", "3 : 4", "4 : 3"]),

  mc(53, "North Sydney Boys 2019 Trial, Q10",
    "Two satellites of equal mass are in stable circular orbits at locations X and Y as shown in the diagram below.\nWhat is the ratio of the kinetic energies of the satellite at position X to position Y",
    ["3:2", "2:3", "1:2", "2:1"],
    {
      svg: scaleSatellites(),
      alt: "Diagram drawn to scale: Earth of radius R, satellite X at a distance 2R from Earth's centre and satellite Y at 3R, in a line to the right.",
    }),

  mc(54, "North Sydney Boys 2019 Trial, Q13",
    "Ganymede is a moon of Jupiter and has a mass of 1.48 × 10²³ kg and a radius of 2 600 km. It has an orbital speed of 10.8 km/s and an orbital radius of 1.07 × 10⁶ km.\nWhat is the gravitational force of Ganymede on Jupiter?",
    ["1.61 × 10²² N", "6.64 × 10²⁴ N", "1.61 × 10²⁵ N", "3.56 × 10²⁵ N"]),

  mc(55, "North Sydney Boys 2020 Trial, Q3",
    "Some data for the Earth and the Moon is shown in table 1.\nAt what distance will a lunar spacecraft be from the centre of the Earth when it experiences no net gravitational force from the Earth and Moon?",
    ["3.49 × 10⁸ m", "3.46 × 10⁸ m", "3.42 × 10⁸ m", "3.15 × 10⁸ m"],
    {
      svg: dataTable({
        headers: ["Object", "Radius of orbit (m)", "Radius (m)", "Mass (kg)"],
        rows: [
          ["Moon", "3.84 × 10⁸", "1.74 × 10⁶", "7.34 × 10²²"],
          ["Earth", "1.49 × 10¹¹", "6.37 × 10⁶", "5.98 × 10²⁴"],
        ],
        colWidths: [70, 120, 95, 95],
        italicHeaders: false,
      }),
      alt: "Table 1. Moon: radius of orbit 3.84 × 10⁸ m, radius 1.74 × 10⁶ m, mass 7.34 × 10²² kg. Earth: radius of orbit 1.49 × 10¹¹ m, radius 6.37 × 10⁶ m, mass 5.98 × 10²⁴ kg.",
    }),

  mc(56, "North Sydney Boys 2020 Trial, Q7",
    "Two satellites (LSat_A3 and KSat_D7) are in circular orbits around the Earth. LSat_A3 is R metres from the centre of the Earth and has an orbital velocity of V. KSat_D7 is 4R metres from the centre of the Earth.\nWhat is the orbital velocity of KSat_D7?",
    ["V/4", "4V", "V/2", "2V"]),

  mc(57, "North Sydney Boys 2020 Trial, Q10",
    "A satellite of mass 6.30 × 10³ kg is orbiting the Earth at an altitude of 1.88 × 10⁴ km.\nThe potential energy of the satellite is closest to:",
    ["−1.00 × 10¹¹ J", "−1.00 × 10¹⁴ J", "−3.95 × 10¹¹ J", "−1.34 × 10¹⁴ J"]),

  mc(58, "North Sydney Boys 2022 Trial, Q3",
    "The rings of Saturn are made of rocky particles that orbit the planet. The period T of each particle depends on its distance r from the centre of Saturn. The period T is proportional to rⁿ.\nWhich one of the following is n equal to?",
    ["1.0", "1.5", "2.0", "3.0"]),

  mc(59, "North Sydney Boys 2022 Trial, Q8",
    "A satellite is in orbit about Earth. The satellite moves to an orbit closer to Earth. Which of the following correctly gives the change in the potential energy and the kinetic energy of the satellite?",
    [
      "Change in potential energy: decreases; change in kinetic energy: increases",
      "Change in potential energy: decreases; change in kinetic energy: decreases",
      "Change in potential energy: increases; change in kinetic energy: increases",
      "Change in potential energy: increases; change in kinetic energy: decreases",
    ]),

  mc(60, "North Sydney Boys 2022 Trial, Q11",
    "Two satellites of equal mass, S₁ and S₂, orbit the Earth. S₁ is orbiting at a distance r from the Earth’s centre at speed v. S₂ orbits at a distance 2r from the Earth’s centre at speed v/√2. The ratio of the centripetal force on S₁ to the centripetal force on S₂ is",
    ["1/8", "1/4", "4", "8"]),

  mc(61, "North Sydney Boys 2022 Trial, Q14",
    "The acceleration of free fall of a small sphere of mass 5.0 × 10⁻³ kg when close to the surface of Jupiter is 25 m s⁻². The gravitational field strength at the surface of Jupiter is",
    ["2.0 × 10⁻⁴ N kg⁻¹.", "1.3 × 10⁻¹ N kg⁻¹.", "25 N kg⁻¹.", "5.0 × 10³ N kg⁻¹."]),

  mc(62, "North Sydney Boys 2022 Trial, Q16",
    "The escape speed of an object of mass m from a planet of mass M and radius r depends on the gravitational constant and",
    ["M and r.", "m and r.", "M only.", "M, m, and r."]),

  mc(63, "North Sydney Boys 2025 Trial, Q2",
    "A Physics student plotted the graph shown for a planet of mass M.\nWhich of the following could be an appropriate title for the x-axis and the expression for the gradient of the line?",
    [
      "Distance from the centre of the planet. Gradient = GM",
      "Inverse square of the distance from the centre of the planet. Gradient = GM",
      "Square of distance from the surface of the planet. Gradient = GM",
      "Mass of the planet. Gradient = G/r",
    ],
    {
      svg: straightLineGraph({ yLabel: "Gravitational field strength" }),
      alt: "Graph with gravitational field strength on the vertical axis and an unlabelled horizontal axis. The line is straight and passes through the origin.",
    }),

  mc(64, "North Sydney Girls 2020 Trial, Q4",
    "Which of the following rows correctly matches the headings with the orbit type?",
    [
      "Short orbital period: Geostationary Orbit; large altitude: Near Earth Orbit; used for mapping surface terrain: Near Earth Orbit",
      "Short orbital period: Near Earth Orbit; large altitude: Geostationary Orbit; used for mapping surface terrain: Geostationary Orbit",
      "Short orbital period: Geostationary Orbit; large altitude: Near Earth Orbit; used for mapping surface terrain: Geostationary Orbit",
      "Short orbital period: Near Earth Orbit; large altitude: Geostationary Orbit; used for mapping surface terrain: Near Earth Orbit",
    ]),

  mc(65, "North Sydney Girls 2021 Trial, Q4",
    "Neptune has a mass of 1.024 × 10²⁶ kg and radius of 2.46 × 10⁷ m. What is the gravitational field strength on the surface of Neptune?",
    ["2.8 N kg⁻¹", "9.8 N kg⁻¹", "11.3 N kg⁻¹", "22.6 N kg⁻¹"]),

  mc(66, "North Sydney Girls 2021 Trial, Q7",
    "A satellite S₁ is in a stable low-Earth orbit (LEO) and another satellite S₂ is in a stable geostationary orbit (GEO). Both satellites have the same mass. Which of the following is correct about the two satellites in orbit?",
    [
      "Greater orbital speed: S₁; greater gravitational potential energy: S₁",
      "Greater orbital speed: S₁; greater gravitational potential energy: S₂",
      "Greater orbital speed: S₂; greater gravitational potential energy: S₁",
      "Greater orbital speed: S₂; greater gravitational potential energy: S₂",
    ]),

  mc(67, "North Sydney Girls 2021 Trial, Q11",
    "Spacecraft 1 is launched with an initial speed v and eventually enters a circular orbit near the Earth’s surface. An identical spacecraft, Spacecraft 2, is launched from the same position with a launch speed of 2v. Which of the following best describes the motion of Spacecraft 2? Ignore air resistance.",
    [
      "It will enter a circular orbit around the Earth with a shorter period than spacecraft 1.",
      "It will enter a circular orbit around the Earth with a longer period than spacecraft 1.",
      "It will travel in a parabolic path and return to the surface of the Earth.",
      "It will leave the Earth and travel to outer space.",
    ],
    {
      svg: spacecraftLaunch(),
      alt: "Spacecraft 1 just above Earth's surface, moving horizontally with speed v. The diagram is not to scale.",
    }),

  mc(68, "North Sydney Girls 2022 Trial, Q7",
    "Two satellites, P and Q, are both in circular orbit about the same planet. The mass of P is greater than the mass of Q. The radius of P’s orbit is less than that of Q.\nWhich of the following is the correct comparison of the orbital and escape velocities of P and Q?",
    [
      "Orbital velocity of P compared to orbital velocity of Q: greater; escape velocity of P compared to escape velocity of Q: less",
      "Orbital velocity of P compared to orbital velocity of Q: greater; escape velocity of P compared to escape velocity of Q: greater",
      "Orbital velocity of P compared to orbital velocity of Q: less; escape velocity of P compared to escape velocity of Q: less",
      "Orbital velocity of P compared to orbital velocity of Q: less; escape velocity of P compared to escape velocity of Q: greater",
    ],
    {
      svg: concentricOrbits({
        radii: [70, 105],
        dashed: true,
        central: { label: "", r: 55 },
        bodies: [
          { orbit: 0, at: 18, label: "P", labelDx: 8, labelDy: 14 },
          { orbit: 1, at: 66, label: "Q", labelDx: -4, labelDy: -10 },
        ],
      }),
      alt: "A planet with two dashed circular orbits. P is on the inner orbit, just outside the planet; Q is on the outer orbit.",
    }),

  mc(69, "North Sydney Girls 2023 Trial, Q2",
    "Which of the following is NOT stated by Kepler’s Laws of Planetary Motion?",
    [
      "All planets move about the Sun in elliptical orbits where the Sun is at one of the foci.",
      "The ratio of the square of the orbital period to the cube of the mean distances from the Sun is a constant for any planets orbiting the Sun.",
      "The planes in which the planets move about the Sun is parallel to the plane of the equator of the Sun.",
      "A radial distance joining any planet to the Sun sweeps out equal areas in equal lengths of time.",
    ]),

  mc(70, "North Sydney Girls 2023 Trial, Q18",
    "The gravitation force F acting on a planet due to the Sun’s gravitational field varies with the planet’s distance r from the centre of the Sun as shown in the graph below.\nWhich of the following quantity of the planet is given by the area under the graph between X and Y ?",
    ["The impulse of the gravitation force", "The change in the gravitational potential energy", "The kinetic energy", "The centripetal force"],
    {
      svg: forceDistanceGraph(),
      alt: "Graph of force F against distance r. Between r = X and r = Y the curve falls as r increases; dashed lines drop from the curve to the axis at X and Y.",
    }),

  mc(71, "North Sydney Girls 2024 Trial, Q4",
    "Mars has twice the mass of Mercury and is four times further away from the Sun.\nWhat is the ratio of the gravitational force from the Sun on Mercury to the gravitational force from the Sun on Mars?",
    ["0.5", "2.0", "8.0", "32.0"]),

  mc(72, "Shore 2019 Half-yearly, Q2",
    "A satellite of mass m orbits a planet of mass M at an orbital radius of r. What would be the change in potential energy to double the radius of orbit?",
    ["GMm / r", "−GMm / r", "GMm / 2r", "−GMm / 2r"]),

  mc(73, "Shore 2019 Trial, Q2",
    "At one point on Earth’s surface at a distance R from the centre of Earth, the gravitational field strength is measured as 9.76 N kg⁻¹.\nWhich one of the following is closest to Earth’s gravitational field strength at a distance of 2R from the centre of the Earth?",
    ["1.08 N kg⁻¹", "2.44 N kg⁻¹", "3.25 N kg⁻¹", "4.88 N kg⁻¹"]),

  mc(74, "Shore 2020 Half-yearly, Q1",
    "A satellite in circular orbit of radius r around the Earth has an orbital velocity v.\nWhat would be the orbital radius of a satellite with orbital velocity 2v?",
    ["r/4", "r/2", "2r", "4r"]),

  mc(75, "Shore 2020 Trial, Q5",
    "Consider the two objects shown in the diagram at right.\nWhat is the ratio of the gravitational force of object X on object Y to the gravitational force of object Y on object X?",
    ["1:1", "2:3", "1:3", "1:6"],
    {
      svg: twoSpheres(),
      alt: "Two touching spheres: X on top, mass 50 g and radius 0.2 m; Y below, mass 300 g and radius 0.4 m.",
    }),

  mc(76, "Shore 2020 Trial, Q8",
    "The Death Star orbits the planet Yavin at a distance of 50 000 km in 60 minutes. If the orbital radius of the Death Star was doubled, how long would it take to orbit Yavin?",
    ["120 minutes", "170 minutes", "145 minutes", "30 minutes"]),

  mc(77, "Shore 2021 Trial, Q2",
    "The concept of escape velocity can best be described as:",
    [
      "the initial speed required so that an object will safely orbit the Earth.",
      "the speed required for an object to be launched and fly through space forever.",
      "the speed necessary for a spacecraft to escape Earth’s atmosphere.",
      "the velocity needed to provide an initial kinetic energy such that total mechanical energy is zero.",
    ]),

  mc(78, "Shore 2021 Trial, Q5",
    "What is the magnitude of the gravitational force acting on a 3.50 × 10³ kg satellite orbiting a planet when the satellite’s orbital radius is 9.17 × 10⁶ m and the satellite’s orbital period is 1.50 hours?",
    ["4.34 × 10⁴ N", "5.63 × 10¹¹ N", "4.07 N", "1.24 × 10⁴ N"]),

  mc(79, "Shore 2021 Trial, Q14",
    "Two moons of Jupiter, Io and Europa, have respective orbital periods of 1.77 days and 3.55 days. Calculate the orbital radius of Io if Europa has an orbital radius of 671 000 km.",
    ["334 555 km", "421 909 km", "643 618 km", "751 030 km"]),

  mc(80, "Sydney Boys 2022 Trial, Q14",
    "The table contains information related to two moons orbiting mars.\nThe orbital velocity of Phobos can be determined by using data selected from this table.\nWhat is the orbital velocity of the moon Phobos?",
    ["1.84 km s⁻¹", "2.14 km s⁻¹", "2.50 km s⁻¹", "5.37 km s⁻¹"],
    {
      svg: dataTable({
        headers: ["Moon", "Mass (kg)", "Orbital radius (m)", "Orbital velocity (km s⁻¹)"],
        rows: [
          ["Deimos", "1.476 × 10¹⁵", "2.35 × 10⁷", "1.35"],
          ["Phobos", "1.066 × 10¹⁶", "9.38 × 10⁶", "—"],
        ],
        colWidths: [75, 95, 115, 145],
      }),
      alt: "Table. Deimos: mass 1.476 × 10¹⁵ kg, orbital radius 2.35 × 10⁷ m, orbital velocity 1.35 km s⁻¹. Phobos: mass 1.066 × 10¹⁶ kg, orbital radius 9.38 × 10⁶ m, orbital velocity not given.",
    }),

  mc(81, "Sydney Boys 2023 Trial, Q2",
    "Two satellites orbit earth, as shown below. Satellite A orbits with a circular orbit, whilst Satellite B orbits with an elliptical orbit. The velocities at different points of the two satellites are shown by arrows.\nWhich of the following correctly describes the work done by the gravitational field of Earth on Satellite A as it moves from R to S in its orbit, and the work done by the gravitational field of Earth on Satellite B as it moves from P to Q in its orbit?",
    [
      "Work done on Satellite A from R to S: zero; work done on Satellite B from P to Q: zero",
      "Work done on Satellite A from R to S: zero; work done on Satellite B from P to Q: non-zero",
      "Work done on Satellite A from R to S: non-zero; work done on Satellite B from P to Q: zero",
      "Work done on Satellite A from R to S: non-zero; work done on Satellite B from P to Q: non-zero",
    ],
    {
      svg: circleAndEllipseVelocities(),
      alt: "Earth with Satellite A's circular orbit close around it and Satellite B's larger elliptical orbit, whose left end P is just outside the circle. Velocity arrows: at P and at R (left side of the circle) pointing up; at S (top of the circle) and Q (top of the ellipse) pointing right.",
    }),

  mc(82, "Sydney Boys 2025 Trial, Q13",
    "Which change would result in the greatest increase in the gravitational force between two objects?",
    ["Double the distance between the objects.", "Double the mass of one object.", "Double the mass of both objects.", "Halve the mass of both objects."]),

  mc(83, "Sydney Boys 2025 Trial, Q16",
    "As a satellite following an elliptical orbit moves closer to Earth, what happens to its kinetic and potential energy?",
    [
      "Both kinetic and potential energy increase.",
      "Kinetic energy increases, potential energy decreases.",
      "Both kinetic and potential energy decrease.",
      "Kinetic energy decreases, potential energy increases.",
    ]),

  mc(84, "Sydney Girls 2020 Trial, Q9",
    "A satellite in a circular orbit of radius R has a orbital period T. If this satellite is moved to a higher orbit of orbital radius 4R, what will be the orbital period of the satellite in the higher orbit?",
    ["2T", "4T", "8T", "16T"]),

  mc(85, "Sydney Girls 2020 Trial, Q10",
    "The Earth has a radius of 6378 km.\nWhat would be the escape velocity if a spacecraft is in orbit at a height of 25480 km above the surface of the Earth?",
    ["3.5 km/s", "5.0 km/s", "5.6 km/s", "11.2 km/s"]),

  mc(86, "Sydney Girls 2020 Trial, Q13",
    "The image below represents the elliptical path of a planet around a star.\nWhich of the following statements is most correct?",
    [
      "The star is located at C and the planet takes less time to travel P to Q than it does for R to S.",
      "The star is located at C and the planet takes more time to travel P to Q than it does for R to S.",
      "The star is located at A and the planet takes the same time to travel P to Q as it does for R to S.",
      "The star is located at B and the planet takes the same time to travel P to Q as it does for R to S.",
    ],
    {
      svg: ellipseFociChords(),
      alt: "An ellipse on a square grid, centred at B on the horizontal axis. Points A and C are on the axis either side of B, at the foci. Vertical lines through A and C cut the ellipse at Q (top) and P (bottom) on the left, and at R (top) and S (bottom) on the right.",
    }),

  mc(87, "Sydney Grammar 2020 Trial, Q2",
    "The mass of the Sun is 2.0 × 10³⁰ kg and the distance between the Sun and the Earth is 1.5 × 10¹¹ m. What is the gravitational force exerted by the Sun on the Earth?",
    ["3.6 × 10²² N", "1.2 × 10²⁸ N", "5.3 × 10³³ N", "8.0 × 10⁴³ N"]),

  mc(88, "Sydney Grammar 2020 Trial, Q3",
    "Two planets orbit a distant star. Planet A orbits at distance r and has period T. Planet B orbits at distance r/4. What will be the period of Planet B?",
    ["T/8", "T/2", "2T", "8T"]),

  mc(89, "Sydney Grammar 2021 Trial, Q3",
    "Which of the following pairs of comparisons is correct between a circular low Earth orbit satellite and a geostationary orbit satellite.",
    [
      "Low Earth Orbit: shorter orbital period; Geostationary Orbit: lower orbital radius",
      "Low Earth Orbit: higher orbital velocity; Geostationary Orbit: smaller acceleration",
      "Low Earth Orbit: longer orbital period; Geostationary Orbit: fixed orbital radius",
      "Low Earth Orbit: always equatorial; Geostationary Orbit: lower orbital velocity",
    ]),

  mc(90, "Sydney Grammar 2021 Trial, Q19",
    "Ganymede and Europa are both moons of Jupiter. Ganymede orbits Jupiter every 7.2 days. Europa’s orbital radius is 63% of Ganymede’s.\nThe orbital period of Europa is?",
    ["1.8 days.", "3.6 days.", "5.7 days.", "14.4 days."]),

  // ---- Short answer: s001–s090 -------------------------------------------------------
  // Multi-part questions are kept whole; each part shows its marks in square brackets.

  sa(1, 2, "Abbotsleigh 2023 Trial, Q28",
    "Determine the orbital radius around the earth at which the acceleration due to gravity is 2.45 m s⁻²."),

  sa(2, 4, "Abbotsleigh 2025 Trial, Q24",
    "Two satellites I and II are orbiting the Earth in the same circular orbit. The mass of satellite II is twice that of satellite I. Use Physics principles to compare the force, energy and motion of two satellites."),

  sa(3, 7, "Ascham 2024 Trial, Q30",
    "A 50 kg satellite moves at a constant speed v, in a circular orbit around Planet X. The orbital period of the satellite is 2.16 × 10⁴ s.\n(a) Show that the orbital radius of a satellite in a circular orbit can be given by:\nr = T²F_g / (4π²m_s)\nwhere: r = orbital radius (m), m_s = mass of satellite (kg), T = orbital period (s), F_g = gravitational force on satellite (N). [3 marks]\n(b) The gravitational force on the satellite is 80N. Calculate the orbital radius of the satellite. [1 mark]\n(c) Determine the kinetic energy of the satellite. [3 marks]"),

  sa(4, 8, "Barker 2020 Trial, Q23",
    "The moon has a mass of 7.35 × 10²² kg and a radius of 1740 km.\nUse this information to answer the questions below.\n(a) The condition for an object to reach escape velocity is that kinetic energy = absolute potential. Use this to derive an equation for escape velocity. [2 marks]\n(b) Determine the escape velocity of a 200 g golf ball hit vertically upward from the surface of the moon. [1 mark]\n(c) If a 2000 kg capsule was launched vertically with a velocity of 1200 m s⁻¹ from the moon’s surface. It travelled vertically upwards to a height of 30km above the moon’s surface, determine its velocity. (You may assume the only force acting on it is the moon’s gravity). [3 marks]\n(d) If the object was turned so it entered a perfectly circular orbit around the moon at 30 km above the moon’s surface, what speed would it need to have to maintain this orbit? [2 marks]"),

  sa(5, 6, "Barker 2021 Trial, Q21",
    "A telecommunications satellite is in low-Earth orbit at an altitude of 780 km (above sea level).\nThe mass of the satellite is 1500 kg.\nThe satellite is always in a circular orbit.\n(a) Calculate the gravitational force between the Earth and satellite in its orbit. [2 marks]\n(b) Calculate the speed of the satellite in its orbit. [2 marks]\n(c) Engineers determine that its altitude must change to improve transmission. The new altitude will be 67 km LOWER than its initial orbit.\nCalculate the change in gravitational potential energy once the satellite is at its lower orbital altitude. [2 marks]"),

  sa(6, 7, "Barker 2021 Trial, Q32",
    "An astronomer has measured the orbital period and average orbital radius of several moons orbiting a planet. Applying Kepler’s third law, she manipulates the data and constructs a graph to obtain a linear relationship, as shown.\n(a) Using the graph, calculate the mass of the planet around which these moons are orbiting. [3 marks]\n(b) The Australian Space Agency sends a research team to a distant planet, P-299d, with a radius twice that of Earth and a mass of 5.7 × 10²⁶ kg.\n(i) Calculate the escape velocity on the surface of P-299d. [2 marks]\n(ii) At the completion of their mission, the research team leaves P-299d in their spaceship and enters an elliptical orbit around the planet, as depicted in the second diagram.\nIf the spaceship travels from position A to B and position C to D in equal time intervals, compare the areas of segment AOB and COD, justifying your response. [2 marks]",
    {
      svg: stack(
        [
          linearDataGraph({
            title: "Motion of moons orbiting a planet",
            xMax: 25, yMax: 800, xStep: 5, yStep: 100,
            xLabel: "T² (× 10¹¹ s²)", yLabel: "r³ (× 10²⁵ m³)",
            from: [0.3, 10], to: [20.8, 665],
          }),
          sweptSegments(),
        ],
        { dir: "column", gap: 14 },
      ),
      alt: "First, a graph titled 'Motion of moons orbiting a planet': r³ (× 10²⁵ m³, 0 to 800) against T² (× 10¹¹ s², 0 to 25). The straight line starts near the origin and reaches about 665 at T² = 20.8. Second, an elliptical orbit (not to scale) with the planet O near the left end. A and B are close to O, just below and above it; C and D are near the far right end. Lines join O to A, B, C and D.",
    }),

  sa(7, 10, "Baulkham Hills 2022 Trial, Q21",
    "Mars is the only other planet in our solar system where it is realistically possible to send humans to live. NASA aims to launch astronauts to Mars by the late 2030s or early 2040s and two ex BHHS students, Arya and Karan, were selected to be on the first mission.\nUse the following information about Mars to answer the following questions.\n(a) Calculate the acceleration due to gravity that Arya and Karan would experience on the surface of Mars. [2 marks]\n(b) Arya and Karan decide to test their understanding of projectile motion that they learnt at school. They throw a food cannister of 1.25 kg upward at an angle of 25° to the horizontal with an initial velocity of 2.5 m s⁻¹.\nCalculate:\n(i) The maximum distance from the centre of Mars that the food cannister reaches. [2 marks]\n(ii) How far the food cannister lands from where they threw it, assuming that it was thrown at a height 2m above the ground and that the ground was level. [4 marks]\n(c) Calculate the minimum velocity that they would need to throw the food cannister vertically if it was to just escape Mars’ gravitational field. [2 marks]",
    {
      svg: dataTable({ headers: ["Mars", ""], rows: [["Mass", "6.39 × 10²³ kg"], ["Diameter", "6.679 × 10⁶ m"], ["Atmosphere", "Negligible"]], colWidths: [110, 130], italicHeaders: false }),
      alt: "Mars data. Mass 6.39 × 10²³ kg; diameter 6.679 × 10⁶ m; atmosphere negligible.",
    }),

  sa(8, 3, "Baulkham Hills 2022 Trial, Q22",
    "In 1990, the Hubble Space Telescope (HST) was placed in orbit around the Earth. Earth and Hubble follow the orbits shown below, with identical orbital periods. This appears to contradict Kepler’s law of periods.\nFully explain why it is possible for the HST to orbit the Sun with the same orbital period as the Earth.",
    {
      svg: concentricOrbits({
        radii: [74, 92],
        central: { label: "Sun", r: 14 },
        bodies: [
          { orbit: 0, at: 0, label: "Earth", labelDx: -44, labelDy: 4 },
          { orbit: 1, at: 0, label: "HST", labelDx: 8, labelDy: 4 },
        ],
        size: 210,
        note: "NOT TO SCALE",
      }),
      alt: "The Sun at the centre of two close concentric circular orbits: Earth on the inner orbit and the HST just outside it on the outer orbit, in line with Earth. Not to scale.",
    }),

  sa(9, 6, "Baulkham Hills 2023 Trial, Q21",
    "A rocket is in orbit, distance R from the centre of the Earth. At this position, it has a gravitational potential energy (U) equal to −4E J. The rocket is then boosted to an orbit where its gravitational potential energy is −E J.\n(a) Complete the table below to show the missing values. (Give the gravitational potential energy, orbital kinetic energy and total energy for the initial and final positions.) [2 marks]\n(b) Explain how the gravitational potential energy of the rocket seems to decrease from −4E to −E, even though it is boosted to a higher orbit. [2 marks]\n(c) Justify the change in kinetic energy of the rocket by deriving the relationship between the kinetic energy of an orbiting object and the radius of its orbit. [2 marks]",
    {
      svg: dataTable({
        headers: ["", "Grav. potential energy (J)", "Orbital kinetic energy (J)", "Total energy (J)"],
        rows: [["Initial position", "", "", ""], ["Final position", "", "", ""]],
        colWidths: [100, 160, 150, 100],
        italicHeaders: false,
      }),
      alt: "A blank table to complete, with columns for gravitational potential energy, orbital kinetic energy and total energy (all in J), and rows for the initial and final positions.",
    }),

  sa(10, 2, "Baulkham Hills 2023 Trial, Q27",
    "A distant star has several planets orbiting it. Information on the planets are shown below.\nCalculate the orbital radius of Harry",
    {
      svg: dataTable({
        headers: ["Planet", "Radius (m)", "Period (s)"],
        rows: [["Chinson", "6.1 × 10⁸", "4.2 × 10⁴"], ["Harry", "?", "8.4 × 10⁴"], ["Danny", "1.56 × 10⁹", "1.68 × 10⁵"]],
        colWidths: [100, 110, 110],
        italicHeaders: false,
      }),
      alt: "Table. Chinson: radius 6.1 × 10⁸ m, period 4.2 × 10⁴ s. Harry: radius unknown, period 8.4 × 10⁴ s. Danny: radius 1.56 × 10⁹ m, period 1.68 × 10⁵ s.",
    }),

  sa(11, 3, "Caringbah 2020 Trial, Q31",
    "Two planets X and Y travel anticlockwise in circular orbits around a star as shown in the diagram. The radii of the orbits X and Y are in the ratio 2:5.\nThe planets are shown below at a time interval of 5 years. Initially they were aligned, making a straight line with the star. Five years later, planet X has rotated through 120°, as shown.\nDetermine how long it takes planet Y to orbit the star.",
    {
      svg: alignedPlanetsPanels(),
      alt: "Two diagrams of a star with planet X on a small inner orbit and planet Y on a larger outer orbit. Initially both planets are lined up to the right of the star. Five years later planet X has moved 120° anticlockwise and planet Y has moved only a short way anticlockwise around its orbit.",
    }),

  sa(12, 7, "Knox 2023 Common Test 1, Q3",
    "Two satellites R and S, orbit the same planet so that R has an orbital radius three times that of S.\n(a) Use proportionality to find the ratio of their periods T_R : T_S. [3 marks]\n(b) Explain the role of the gravitational force in determining features of the orbit of satellites. Use appropriate mathematical justification as part of your answer. [4 marks]"),

  sa(13, 5, "Caringbah 2024 Trial, Q24",
    "On May 4, 1989, the objective of the Magellan mission to Venus was to place a satellite in orbit to image the entire surface of the planet.\nMass of Venus = 4.867 × 10²⁴ kg\nMass of satellite = 3445 kg\nOrbital radius = 6.346 × 10⁶ m\n(a) Determine the orbital period of the satellite around Venus. Assume a circular orbit. [2 marks]\n(b) How much additional work would need to be done for the satellite to escape the planet Venus? Use relevant equations and calculations to support your answer. [3 marks]",
    {
      svg: venusOrbit(),
      alt: "Venus at the centre of a circular orbit, with a satellite on the orbit to its right joined to Venus by a dotted line. Not to scale.",
    }),

  sa(14, 5, "Cheltenham Girls 2011 Trial, Q22",
    "A spherical planet has radius R and mass M. A satellite of mass m orbits the planet with constant orbital speed v at a height h above the planet's surface, as shown below (not to scale).\n(a) Outline why, although the satellite is moving with constant speed, the net force on it is not zero. [1 mark]\n(b) Why does a person experience weight on the Earth but feel weightless orbiting the Earth in a satellite? [2 marks]\n(c) A second satellite, mass 2m is placed into the same orbit. What will be its orbital speed compared to the first satellite? Justify your answer using Physics equations. [2 marks]",
    {
      svg: satelliteAtHeight(),
      alt: "A planet of mass M and radius R with a dashed circular orbit a height h above its surface. A satellite of mass m is on the orbit.",
    }),

  sa(15, 7, "Cherrybrook Tech 2025 Trial, Q33",
    "Titan is the largest moon of Saturn. It orbits Saturn once every 15.9 days at an average distance of 1.22 × 10⁶ km.\n(a) Calculate the mass of Saturn. [2 marks]\n(b) The mass of Titan is 1.35 × 10²³ kg. Calculate the total mechanical energy of Titan. [3 marks]\n(c) A satellite is launched from the surface of Saturn into an orbit that keeps it directly above a position on the surface of Saturn.\nIdentify the energy changes as the satellite moves from the surface of Saturn into orbit. [2 marks]"),

  sa(16, 2, "Cherrybrook Tech 2025 Trial, Q34",
    "The orbit of a planet is shown.\nAccount for the changes in velocity of the planet as it moves from perihelion to aphelion.",
    {
      svg: perihelionAphelion(),
      alt: "An elliptical orbit with the Sun near its left end. The perihelion is marked at the left end, nearest the Sun, and the aphelion at the right end. A planet is on the upper right of the orbit, moving anticlockwise.",
    }),

  sa(17, 5, "Girraween 2020 Trial, Q21",
    "A GPS satellite with a mass of 11 000 kg orbits the Earth at an altitude of 20 000 km.\n(a) Calculate the magnitude of its gravitational potential energy. [2 marks]\n(b) Calculate its orbital velocity. [3 marks]"),

  sa(18, 4, "Girraween 2020 Trial, Q28",
    "Outline the requirements necessary for a satellite to orbit the Earth in a geostationary orbit. Include any relevant calculations in your answer."),

  sa(19, 8, "Girraween 2023 Trial, Q22",
    "The Global Positioning System (GPS) uses satellites to support navigation on Earth.\nOne GPS satellite is in a circular orbit at a height h above the surface of the Earth.\nThe Earth has mass M and radius R.\n(a) Use ω = 2π/T to show that the angular speed, ω, of the satellite is given by:\nω = √(GM / (R + h)³) [2 marks]\n(b) Calculate the orbital period of the satellite when h equals 2.02 × 10⁷ m. [2 marks]\n(c) The satellite has a mass of 1630 kg.\nCalculate the gravitational potential energy of the satellite when in the orbit in part (b). [2 marks]\n(d) A different satellite is in a higher circular orbit.\nExplain how the linear speed of this satellite compares with the linear speed of the satellite in part (a). [2 marks]"),

  sa(20, 2, "Baulkham Hills 2016 Half-yearly, Q22",
    "Clearly explain why all low earth orbit satellites will eventually fall to the Earth’s surface."),

  sa(21, 3, "Cheltenham Girls 2010 Half-yearly, Q16",
    "NASA recently landed a space probe on an asteroid found between the orbits of Earth and Mars. The 600 kg space probe had a weight of 30 N when it landed on the asteroid.\n(a) What would be the weight of this space probe on the surface of Earth? [1 mark]\n(b) Before landing on the asteroid, the space probe was placed in an orbit with radius 30 km. The orbital period was 7.9 × 10⁴ s. What was the mass of the asteroid? [2 marks]"),

  sa(22, 4, "Gosford 2022 Trial, Q34",
    "A communications company launched a satellite of mass 250 kg. The satellite is in an orbit with an altitude of 27 129 km above the Earth.\nCalculate the gravitational potential energy of the satellite and its escape velocity.\nIn your response, explain what the term ‘escape velocity’ means."),

  sa(23, 3, "Hornsby Girls 2021 Trial, Q21",
    "What is a geostationary satellite? [2 marks]\nWhat is one important function of a geostationary satellite? [1 mark]"),

  sa(24, 7, "Hornsby Girls 2021 Trial, Q22",
    "During the 1971 mission to the Moon, astronaut Alan Shepard hit a golf ball that landed 40.0 m from where he'd hit it. The surface of the moon where he hit the ball was level and flat.\n(a) The moon has a mass of 7.342 × 10²² kg and a radius of 1737.4 km. Find the acceleration due to gravity on the moon [2 marks]\n(b) Shepard’s ball was launched at an angle of 35.0° to the horizontal. Determine the initial launch speed of the ball. [3 marks]\n(c) What was the maximum height above ground level reached by golf ball? [2 marks]"),

  sa(25, 6, "Hornsby Girls 2021 Trial, Q24",
    "The table displays data from the 8 planets in our solar system.\n(a) Which planet in the table has the most elliptical orbit? [1 mark]\n(b) At what distance from the sun is Mars travelling with its greatest orbital velocity? Which of Kepler’s laws did you use to answer this? [2 marks]\n(c) The mass of the Sun = 2.00 × 10³⁰ kg. What is the average gravitational force between the Sun and Mercury? [3 marks]",
    {
      svg: dataTable({
        headers: ["", "Mass\n(× 10²⁴ kg)", "Diameter\n(km)", "Density\n(kg/m³)", "Length of\nday (hours)", "Orbital\nperiod (days)", "Average distance\nfrom Sun (× 10⁶ km)", "Perihelion\n(× 10⁶ km)", "Aphelion\n(× 10⁶ km)"],
        rows: [
          ["Mercury", "0.33", "4879", "5427", "4222.6", "88", "57.9", "46", "69.8"],
          ["Venus", "4.87", "12,104", "5243", "2802", "224.7", "108.2", "107.5", "108.9"],
          ["Earth", "5.97", "12,756", "5514", "24", "365.2", "149.6", "147.1", "152.1"],
          ["Mars", "0.642", "6792", "3933", "24.7", "687", "227.9", "206.6", "249.2"],
          ["Jupiter", "1898", "142,984", "1326", "9.9", "4331", "778.6", "740.5", "816.6"],
          ["Saturn", "568", "120,536", "687", "10.7", "10,747", "1433.5", "1352.6", "1514.5"],
          ["Uranus", "86.8", "51,118", "1271", "17.2", "30,589", "2872.5", "2741.3", "3003.6"],
          ["Neptune", "102", "49,528", "1638", "16.1", "59,800", "4495.1", "4444.5", "4545.7"],
        ],
        colWidths: [62, 70, 64, 58, 66, 76, 112, 70, 70],
        italicHeaders: false,
        fontSize: 10,
      }),
      alt: "Planet data table (rows are planets; the source has them as columns). Mass in 10²⁴ kg, diameter in km, density in kg/m³, length of day in hours, orbital period in days, then average distance, perihelion and aphelion in 10⁶ km. Mercury: 0.33, 4879, 5427, 4222.6, 88, 57.9, 46, 69.8. Venus: 4.87, 12 104, 5243, 2802, 224.7, 108.2, 107.5, 108.9. Earth: 5.97, 12 756, 5514, 24, 365.2, 149.6, 147.1, 152.1. Mars: 0.642, 6792, 3933, 24.7, 687, 227.9, 206.6, 249.2. Jupiter: 1898, 142 984, 1326, 9.9, 4331, 778.6, 740.5, 816.6. Saturn: 568, 120 536, 687, 10.7, 10 747, 1433.5, 1352.6, 1514.5. Uranus: 86.8, 51 118, 1271, 17.2, 30 589, 2872.5, 2741.3, 3003.6. Neptune: 102, 49 528, 1638, 16.1, 59 800, 4495.1, 4444.5, 4545.7.",
    }),

  sa(26, 4, "Hornsby Girls 2021 Trial, Q25",
    "A satellite is in a stable low earth orbit with a constant speed and altitude. The controller of the satellite wants to move it to a higher orbit. On board rockets are fired to increase the speed of the satellite and when the new orbit is reached the rockets are fired to reduce the speed.\nUse your understanding of relevant physical principles to explain this sequence of events."),

  sa(27, 4, "James Ruse 2019 Half-yearly, Q15",
    "How does the force of gravity determine the motion of planets and satellites?"),

  sa(28, 4, "James Ruse 2019 Trial, Q22",
    "In 2002, NASA’s space probe, Cassini, was between Jupiter and Saturn as shown in the figure below. Cassini’s mission was to deliver a probe to one of Saturn’s moons, Titan, and then orbit Saturn collecting data.\nBelow is astronomical data that you may find useful when answering this question.\n(a) Calculate the magnitude of the total gravitational field strength experienced by Cassini when it was 4.2 × 10¹¹ m from Jupiter and 3.9 × 10¹¹ m from Saturn, ignoring the gravitational effects of the Sun. [2 marks]\n(b) Indicate the direction of the gravitational field strength at Cassini, determined from (a) on the figure above. (Describe the direction in words.) [1 mark]\nWhen Cassini arrived in the vicinity of Saturn, in 2017, scientists wanted it to remain above the same point on Saturn’s equator throughout one complete Saturn day. This is called a ‘stationary’ orbit.\n(c) What is the period in seconds of this ‘stationary’ orbit? [1 mark]",
    {
      svg: stack(
        [
          cassiniLine(),
          dataTable({
            headers: ["mass of Cassini 2.2 × 10³ kg", "mass of Jupiter 1.9 × 10²⁷ kg"],
            rows: [["mass of Saturn 5.7 × 10²⁶ kg", "Saturn day 10.7 hours"]],
            colWidths: [190, 190],
            italicHeaders: false,
          }),
        ],
        { dir: "column", gap: 12 },
      ),
      alt: "Saturn, Cassini and Jupiter in a line (not to scale): Cassini is 3.9 × 10¹¹ m from Saturn and 4.2 × 10¹¹ m from Jupiter. Data: mass of Cassini 2.2 × 10³ kg; mass of Jupiter 1.9 × 10²⁷ kg; mass of Saturn 5.7 × 10²⁶ kg; Saturn day 10.7 hours.",
    }),

  sa(29, 5, "Gosford 2009 Half-yearly, Q25",
    "Near the surface of the planet Mars, when a 4.0 kg rock is dropped from rest, it reaches a speed of 7.5 m s⁻¹ in 2.0 s.\n(a) What is the acceleration due to gravity near the surface of Mars? [2 marks]\n(b) The planet Mars has an average radius of 3.4 × 10⁶ m. What is the mass of Mars? [3 marks]"),

  sa(30, 5, "James Ruse 2020 Trial, Q23",
    "Artificial satellites are used to monitor weather conditions on Earth, for surveillance and for communications. Such satellites may be placed in a geostationary orbit or low-Earth orbits.\n(a) Describe the features of the geostationary orbit and the advantages it offers when a satellite is used for communications. [2 marks]\n(b) Calculate the total energy of a 750 kg satellite when it is raised from the Earth’s surface into a Low-Earth orbit, 400 km above the Earth’s surface. [3 marks]"),

  sa(31, 7, "Sydney Grammar 2018 Half-yearly, Q20",
    "A satellite is orbiting a planet α that rotates once every 7.0 earth-days. In a low orbit the satellite goes around the planet 11.2 times for every rotation of the planet at an orbital radius of 3.46 × 10⁷ m.\n(a) What is the period of the satellite around planet α? [1 mark]\n(b) The satellite then has its orbital radius increased so the satellite is in a synchronous orbit, remaining at the same fixed point above the planet’s surface.\n(i) Determine the orbital radius that would be required for this to occur. [2 marks]\n(ii) What other condition needs to be met for the satellite to remain at the same fixed point above the planet’s surface? [1 mark]\n(iii) Determine the mass of the planet α. [3 marks]"),

  sa(32, 5, "James Ruse 2022 Trial, Q33",
    "The Deep Space Climate Observatory (DSCOVR), is a space probe that is located at a position where it orbits the Sun with the same period as the Earth, maintaining a fixed distance from the Earth and the Sun.\n(a) Calculate the radius of the Earth’s orbit, R. [2 marks]\n(b) Identify the force/s acting on DSCOVR.\nWrite down an equation which could be solved using the information provided to determine the distance d.\nYou do not need to solve this equation. [3 marks]",
    {
      svg: dscovrDiagram(),
      alt: "Earth's orbit around the Sun (radius R) with DSCOVR a small distance d from Earth, on the line between Earth and the Sun, on a slightly smaller orbit. Not to scale. Data: mass of DSCOVR m = 570 kg; mass of the Sun M_S = 2.0 × 10³⁰ kg; period of Earth's orbit T_E = 3.16 × 10⁷ s.",
    }),

  sa(33, 4, "James Ruse 2024 Half-yearly, Q23",
    "Compare the orbital velocity, orbital period, and the use of low earth orbits and geostationary orbits."),

  sa(34, 4, "James Ruse 2024 Trial, Q21",
    "Artificial satellites monitor weather conditions on Earth and are used for surveillance and communications. Such satellites may be placed in a geostationary orbit.\n(a) Identify TWO features of a geostationary orbit. [2 marks]\n(b) Explain what happens to the speed of a satellite when it moves to a lower orbit. [2 marks]"),

  sa(35, 3, "James Ruse 2024 Trial, Q24",
    "Explain why the period of a satellite in orbit around the Earth cannot be less than 85 minutes.\nInclude a calculation to support your response."),

  sa(36, 4, "James Ruse 2024 Trial, Q30",
    "The graph shows how the gravitational force F between a 1000 kg mass and the Moon varies with the distance r from the Moon's centre for points above its surface.\n(a) Use data from the graph to determine the mass of the Moon. [2 marks]\n(b) Calculate the speed at which the 1000 kg mass should be thrown vertically upwards from the surface of the Moon if it is to escape from the Moon’s gravitational field. [2 marks]",
    {
      svg: moonForceGraph(),
      alt: "Graph of F (× 10³ N, 0 to 2.0) against r (× 10⁶ m, 0 to 6.6). The curve starts at the radius of the Moon, r ≈ 1.74 × 10⁶ m, where F ≈ 1.62 × 10³ N, and falls as 1/r², to about 0.12 × 10³ N at 6.5 × 10⁶ m.",
    }),

  sa(37, 8, "Kincoppal 2023 Trial, Q25",
    "A satellite of mass 250 kg is launched from Earth’s surface and enters a uniform circular orbit at 5.0 × 10⁵ m above Earth’s surface.\n(a) Calculate the orbital velocity of the satellite. [2 marks]\n(b) Calculate the magnitude of the gravitational potential energy of the satellite. [2 marks]\n(c) Calculate the escape velocity of the satellite from its current position in orbit. [2 marks]\n(d) If the satellite were lifted into a higher orbit, explain why work would need to be done by the satellite’s engines to change its orbital path. [2 marks]"),

  sa(38, 4, "Knox 2020 Trial, Q25",
    "The image below shows a satellite orbiting the Earth at a radius of r metres.\nThe orbital velocity for this satellite (mass m) can be found using information about the centripetal force acting on the satellite. In this case, the centripetal force is provided by the gravitational force of the Earth (mass M).\n(a) Derive an equation for the orbital velocity of the satellite in terms of the gravitational constant, G, the mass of the Earth, M, and the orbital radius, r. [2 marks]\n(b) Given the Earth has a mass of 6.0 × 10²⁴ kg and a radius of 6370 km, determine the required speed of a satellite to be in a stable orbit at an altitude of 1000 km. [2 marks]",
    {
      svg: concentricOrbits({
        radii: [92],
        central: { label: "Earth", r: 30 },
        bodies: [{ orbit: 0, at: 40, label: "", labelDx: 8, labelDy: -8 }],
        radials: [{ orbit: 0, at: -30, label: "r", labelDx: 4, labelDy: 16 }],
        size: 220,
        note: "[This diagram is not drawn to scale.]",
      }),
      alt: "Earth with a satellite on a circular orbit of radius r. Not drawn to scale.",
    }),

  sa(39, 3, "Knox 2021 Trial, Q28",
    "Two satellites, A and B, are in orbit above the Earth.\nSatellite A is used to take images of the weather over different continents, while Satellite B is a communications satellite.\nJustify each satellite as either a LEO (low Earth orbit) or GEO (geostationary) based on their uses and features of their orbit."),

  sa(40, 3, "Knox 2022 Trial, Q25",
    "The table below shows data about four of the moons of Saturn. A fifth moon, Rhea, has an orbital period of 3.90 × 10⁵ s.\nExplain qualitatively how you could use the data in the table to calculate the orbital radius of Rhea.",
    {
      svg: dataTable({
        headers: ["Moon", "Orbital period (s)", "Orbital radius (m)"],
        rows: [["Mimas", "8.14 × 10⁴", "1.86 × 10⁸"], ["Enceladus", "1.18 × 10⁵", "2.38 × 10⁸"], ["Tethys", "1.63 × 10⁵", "2.95 × 10⁸"], ["Dione", "2.36 × 10⁵", "3.77 × 10⁸"]],
        colWidths: [90, 130, 130],
        italicHeaders: false,
      }),
      alt: "Table of four moons of Saturn. Mimas: period 8.14 × 10⁴ s, radius 1.86 × 10⁸ m. Enceladus: 1.18 × 10⁵ s, 2.38 × 10⁸ m. Tethys: 1.63 × 10⁵ s, 2.95 × 10⁸ m. Dione: 2.36 × 10⁵ s, 3.77 × 10⁸ m.",
    }),

  sa(41, 5, "Knox 2022 Trial, Q33",
    "Kepler’s first law suggests that an object’s orbit about a larger object is an ellipse. In the diagram below, a satellite can be seen orbiting Mars in an elliptical orbit. The total mass of the satellite is 677 kg, and the mass of Mars is 6.39 × 10²³ kg.\nAt the closest point of its orbit (point A), the satellite is 3 805 km from the centre of Mars. At the furthest point of its orbit (point B), it is 47 972 km from the centre of Mars.\n(a) Show that the gravitational potential energy of the satellite at point A is approximately −7.6 × 10⁹ J. [2 marks]\n(b) Justify why the speed of the satellite is fastest at point A. [3 marks]",
    {
      svg: ellipseOrbit({
        a: 150, b: 62, width: 360, height: 170,
        central: { label: "Mars", kind: "planet", r: 13, labelDx: 30, labelDy: 4 },
        centralAt: -0.82,
        points: [
          { at: 180, label: "A", labelDx: -16, labelDy: 4, kind: "mark" },
          { at: 0, label: "B", labelDx: 8, labelDy: 4, kind: "mark" },
          { at: 104, label: "Mangalyaan", labelDx: 8, labelDy: 18 },
        ],
        arrows: [{ at: 130, dir: "ccw" }],
      }),
      alt: "An elliptical orbit around Mars, which is near the left end. Point A is the left end of the ellipse, closest to Mars; point B is the right end, farthest away. The satellite (Mangalyaan) is near the top, moving anticlockwise towards A. Not drawn to scale.",
    }),

  sa(42, 5, "Knox 2023 Common Test 1, Q1",
    "A student is analysing the graph below that shows the radius cubed and period squared for three satellites orbiting a planet.\n(a) Justify why the student should have expected a straight line relationship between r³ and T². [2 marks]\n(b) Use the graph to calculate the orbital period of a satellite, with an orbital radius of 5.2 × 10⁷ m. [3 marks]",
    {
      svg: linearDataGraph({
        xMax: 3, yMax: 18, xStep: 0.5, yStep: 2,
        xLabel: "T² (× 10⁹) (s²)", yLabel: "r³ (× 10²²) (m³)",
        from: [0, 0], to: [2.5, 16], points: [[1, 6.4], [1.5, 9.6], [2.5, 16]], dashed: true,
      }),
      alt: "Graph of r³ (× 10²² m³, 0 to 18) against T² (× 10⁹ s², 0 to 3). Three points lie on a dotted straight line through the origin: (1.0, 6.4), (1.5, 9.6) and (2.5, 16).",
    }),

  sa(43, 6, "Cheltenham Girls 2008 Trial, Q17",
    "Newton explained satellite motion using a thought experiment that involved projectiles being fired horizontally from a cannon placed on a mountain top above the atmosphere. Note that the Earth has a radius of 6371 km.\n(a) Which of the projectiles shown would have been fired with the lowest initial velocity? [1 mark]\n(b) Define the term ‘escape velocity’. [2 marks]\n(c) If the cannon were fired from a height of 300 km above the ground, calculate the orbital period of the satellite shown undergoing circular motion (path c). [3 marks]",
    {
      svg: newtonsCannon(),
      alt: "Earth with a cannon on a mountain top. Four dashed projectile paths start horizontally from the cannon: a lands closest; b lands farther around the Earth; c goes all the way around in a circle; d curves away from the Earth.",
    }),

  sa(44, 3, "Sydney Tech 2016 Trial, Q22",
    "The graph shows how the gravitational potential energy (Ep) of a satellite changes with its altitude.\n(a) What is the change in gravitational potential energy of the satellite when its altitude is reduced from 9000 km to 3000 km? [1 mark]\n(b) Explain why the gravitational potential energy of a mass in a gravitational field is always a negative value. [2 marks]",
    {
      svg: potentialEnergyAltitudeGraph({ gmm: 6.0e16, earthRadius: 6.37e6, hMaxKm: 20000, uMinE9: -10 }),
      alt: "Graph of gravitational potential energy (10⁹ J, from 0 down to −10) against altitude (0 to 20 000 km). The curve starts near −9.4 at zero altitude and rises towards zero, passing about −6.4 at 3000 km, −3.9 at 9000 km and −2.3 at 20 000 km.",
    }),

  sa(45, 5, "Knox 2023 Trial, Q24",
    "A planet is orbiting the Sun in an elliptical orbit as shown below where the shaded sections are of equal area.\n(a) Justify whether the planet is travelling faster between A and B or between C and D. [3 marks]\n(b) Explain why a geostationary satellite in orbit around the Earth has a constant total energy. [2 marks]",
    {
      svg: equalAreaSectors(),
      alt: "An elliptical orbit with the Sun near the left end. Two shaded sectors of equal area: a wide, short one from the Sun to the arc A–B at the near end, and a long, thin one from the Sun to the arc C–D at the far end.",
    }),

  sa(46, 6, "Knox 2025 Trial, Q29",
    "An object is launched vertically from the Earth’s surface. After launch, the object has no engine or fuel providing any further force of propulsion.\nThe line on the graph below represents the gravitational potential energy of the object at a range of heights above the Earth’s surface.\n(a) Draw the line representing the kinetic energy of the object for the same range of heights. (Describe the line in words.) [2 marks]\n(b) Derive the equation for escape velocity: v = √(2GM/r), and thus show the escape velocity of Earth is 11.2 km s⁻¹. [4 marks]",
    {
      svg: potentialHeightSketch(),
      alt: "Graph of energy (kJ) against height above Earth's surface (m), with no values on the axes apart from zero energy. The gravitational potential energy line is below zero: it starts well below zero at the surface and curves upwards, flattening out as it approaches zero at greater heights.",
    }),

  sa(47, 5, "Kotara 2020 Trial, Q26",
    "(a) The graph shows the total energy of an orbiting satellite versus its orbital radius. Sketch two lines on the graph to show the satellite’s kinetic and gravitational energies. (Describe the two lines in words.) [2 marks]\n(b) Calculate the change in gravitational potential energy when a 300 kg satellite orbiting Earth increases its orbital altitude from 100 km to 200 km. [3 marks]",
    {
      svg: totalEnergyRadiusSketch(),
      alt: "Graph of energy (−3 to 3) against orbital radius (0 to 3). The total energy curve E_total is negative: about −3 at small radius, rising to about −1 at radius 1 and approaching zero as the radius increases.",
    }),

  sa(48, 7, "Newington 2019 Trial, Q23",
    "The International Space Station orbits 4.00 × 10² km above Earth’s surface in a circular orbit. It has a mass of 4.2 × 10⁵ kg.\n(a) Calculate the orbital speed of the International Space Station. [2 marks]\n(b) Determine the gravitational potential energy of the International Space Station. [2 marks]\n(c) Determine the total mechanical energy of the International Space Station. [2 marks]\n(d) State the work done by the satellite in one revolution of the Earth. Justify your answer. [1 mark]"),

  sa(49, 5, "Newington 2022 Trial, Q21",
    "(a) In the past, Earth’s rotation was much faster than it is today. Calculate the apparent weight of a 60.0 kg person standing on the equator if Earth’s rotational period was 4 hours exactly. [3 marks]\n(b) Identify and describe the effects of two other factors which affect the gravitational field strength on the surface of the earth. [2 marks]"),

  sa(50, 3, "Cheltenham Girls 2010 Trial, Q24",
    "The diagram below shows a satellite in orbit about the Earth.\nThe diameter of the Earth is 12 560 km.\n(a) State the name of the force causing the satellite's acceleration and show the direction in which it acts, by drawing a vector to represent it on the above diagram. (Describe the direction in words.) [1 mark]\n(b) If the satellite is 20 000 km above the surface of the Earth, calculate acceleration of the satellite. [2 marks]",
    {
      svg: concentricOrbits({
        radii: [90],
        central: { label: "Earth", r: 28 },
        bodies: [{ orbit: 0, at: 52, label: "satellite", labelDx: 8, labelDy: 0 }],
        size: 220,
        note: "[not to scale]",
      }),
      alt: "Earth at the centre of a circular orbit with a satellite on the upper right of the orbit. Not to scale.",
    }),

  sa(51, 5, "Newington 2023 Trial, Q24",
    "A communications satellite has a mass of 250 kg. The satellite is in orbit around Earth of radius 33 500 km.\n(a) Determine the gravitational potential energy of the satellite. [2 marks]\n(b) If the satellite was to move to an orbit of a higher radius, state what would happen to its:\n(i) kinetic energy [1 mark]\n(ii) gravitational potential energy [1 mark]\n(iii) total mechanical energy [1 mark]"),

  sa(52, 7, "Normanhurst Boys 2020 Trial, Q25",
    "Discuss the importance of Newton's law of universal gravitation and Kepler's Third Law in understanding and calculating the motion of satellites around Earth."),

  sa(53, 7, "Normanhurst Boys 2021 Trial, Q22",
    "A binary star system consists of two stars, Star 1 and Star 2, which orbit a fixed-point X as shown in the figure below.\nStar 1 has a mass of M₁ and a circular orbit of radius r₁ about X while Star 2 has a mass of M₂ and a circular orbit of radius r₂ about X. Both stars have the same angular speed of 4.98 × 10⁻⁸ rad s⁻¹ about X.\n(a) Explain why the centripetal force acting on both Stars 1 and 2 is the same. [2 marks]\n(b) The distance of separation between the centres of the stars is 2.8 × 10⁸ km.\nGiven that Star 1 is three times heavier than Star 2, calculate r₁. [3 marks]\n(c) Calculate the mass of Star 2. [2 marks]",
    {
      svg: binaryStars(),
      alt: "Two stars on either side of a fixed point X on the line joining them: the larger Star 1 on the left at distance r₁ from X, and the smaller Star 2 on the right at the larger distance r₂. Arrows show both stars circling X. Not to scale.",
    }),

  sa(54, 3, "Knox 2025 Trial, Q26",
    "Outline ONE similarity and ONE difference between the motion of a satellite in orbit, and a charged particle moving perpendicular to a magnetic field."),

  sa(55, 7, "North Sydney Boys 2019 Trial, Q21",
    "As part of the North Sydney Boys Science Week activities, a 500g toy falcon is being launched into space.\n(a) Calculate the weight of this model falcon on the surface of the Earth [2 marks]\n(b) Derive the expression for escape velocity through the consideration of gravitational potential energy. Explain the steps of your derivation [3 marks]\n(c) Does the toy falcon need to possess the escape velocity for Earth to be launched into space? Justify your answer [2 marks]"),

  sa(56, 3, "North Sydney Boys 2019 Trial, Q27",
    "A fiction novel describes physical units with different names than what is used in Science. In it, there are two planets that orbit the star Quill, which has a mass of 7.5 × 10⁴ 'pet'. The data from their orbits is summarised in the table below:\nAssess whether the planets in the novel orbit in accordance with Kepler's 3rd Law",
    {
      svg: dataTable({
        headers: ["Planet", "Orbital period ('rics')", "Orbital radius ('orts')"],
        rows: [["Dra", "15", "9"], ["Groo", "20", "12"]],
        colWidths: [80, 150, 150],
        italicHeaders: false,
      }),
      alt: "Table. Dra: orbital period 15 rics, orbital radius 9 orts. Groo: orbital period 20 rics, orbital radius 12 orts.",
    }),

  sa(57, 10, "North Sydney Boys 2020 Trial, Q25",
    "An astronaut is doing maintenance on a spaceship which is in orbit above the Earth. They are using a spanner with a 45 cm shaft to tighten a nut holding a solar array, which requires a torque of 5.0 Nm to be fully tightened.\n(a) Calculate the force required to fully tighten the nut if the astronaut is able to apply a force perpendicular to the spanner shaft. [2 marks]\n(b) If the same force as in part (a) was applied at 75° to the spanner shaft, how much torque would be applied to the nut? [2 marks]\n(c) Describe the changes in kinetic and potential energy as the spaceship fires its engines to move to a higher orbit. [2 marks]\n(d) Distinguish between escape velocity and orbital velocity, include formulae for both velocities in your answer. [4 marks]"),

  sa(58, 12, "North Sydney Boys 2022 Trial, Q23",
    "This question is about Kepler’s third law.\n(a) Kepler’s third law states that the period T of the orbit of a planet about the Sun is related to the average orbital radius R of the planet by the relationship\nT² = KR³\nwhere K is a constant.\n(i) Suggest why the law specifies the average orbital radius. [1 mark]\n(ii) State the name of the force that causes the acceleration of the planets orbiting the Sun. [1 mark]\n(iii) State an expression for the magnitude F of the force in (ii) in terms of the mass M_S of the Sun, the mass m of the planet, the radius R of the orbit and the universal gravitational constant G. [1 mark]\n(iv) Hence deduce, explaining your working, that the constant K is given by the expression\nK = 4π² / GM_S [4 marks]\n(b) Ganymede is one of the moons of Jupiter and the following data are available.\nAverage orbital radius of Ganymede = 1.1 × 10⁹ m\nOrbital period of Ganymede = 6.2 × 10⁵ s\nUniversal gravitational constant G = 6.67 × 10⁻¹¹ N m² kg⁻²\n(i) Deduce that the gravitational field strength of Jupiter at the surface of Ganymede is approximately 0.1 N kg⁻¹. [2 marks]\n(ii) Estimate the mass of Jupiter. [3 marks]"),

  sa(59, 12, "North Sydney Boys 2023 Trial, Q18",
    "This question is about gravitation\nThe diagram below illustrates the planet Saturn.\nSaturn has several rings, each of which consists of many small particles that orbit the planet. Saturn may be considered to be a sphere with its mass M concentrated at its centre.\n(a) Deduce that, for a particle in one ring moving in a circular orbit of radius R, the linear speed v of the particle in its orbit is given by the expression\nGM = Rv².\nExplain your reasoning. [2 marks]\n(b) One ring, the A ring, has an outer diameter of 2.72 × 10⁸ m. The mass of Saturn is 5.69 × 10²⁶ kg. A particle orbits on the outer edge of this ring. Determine the time for the particle to complete one orbit of Saturn. [3 marks]\n(c) Explain the concept of escape speed. [1 mark]\n(d) A planet has radius R and the acceleration of free fall at its surface is g. The planet may be considered to be a sphere with its mass concentrated at its centre.\nDeduce that the escape speed v_es is given by the expression:\nv_es = √(2gR).\nExplain your working and state one assumption that is made in the derivation. [4 marks]\n(e) Calculate the escape speed for a spherical planet of radius 1.7 × 10³ km having an acceleration of free fall at its surface of 1.6 m s⁻². [2 marks]",
    {
      svg: saturnRing(),
      alt: "Saturn with its rings seen at a slant. The outer diameter of the A ring is marked as 2.72 × 10⁸ m.",
    }),

  sa(60, 8, "North Sydney Boys 2025 Trial, Q17",
    "The spacecraft Juno has been put into orbit around Jupiter. The table below contains information about the planet Jupiter and the spacecraft Juno. The next figure shows gravitational field strength (N kg⁻¹) as a function of distance from the centre of Jupiter.\n(a) Determine the gravitational force acting on Juno by Jupiter when Juno is at a distance of 2.0 × 10⁸ m from the centre of Jupiter. [2 marks]\n(b) Use the graph above to determine the magnitude of the change in gravitational potential energy of the spacecraft Juno as it moves from a distance of 2.0 × 10⁸ m to a distance of 1.0 × 10⁸ m from the centre of Jupiter. [3 marks]\n(c) Europa is a moon of Jupiter. It has a circular orbit of radius 6.70 × 10⁸ m around Jupiter. Calculate the period of Europa’s orbit. [3 marks]",
    {
      svg: stack(
        [
          dataTable({
            headers: ["Mass of Jupiter", "1.90 × 10²⁷ kg"],
            rows: [["Radius of Jupiter", "7.00 × 10⁷ m"], ["Mass of spacecraft Juno", "1500 kg"]],
            colWidths: [170, 130],
            italicHeaders: false,
          }),
          fieldStrengthGraph({ gm: 1.2673e17, rMin: 0.98e8, rMax: 6e8, gMax: 14, ticks: 6, xLabel: "distance from the centre of Jupiter (m)", yLabel: "gravitational field strength (N kg⁻¹)" }),
        ],
        { dir: "column", gap: 14 },
      ),
      alt: "Table: mass of Jupiter 1.90 × 10²⁷ kg; radius of Jupiter 7.00 × 10⁷ m; mass of spacecraft Juno 1500 kg. Graph of gravitational field strength (N kg⁻¹, 0 to 14) against distance from the centre of Jupiter (up to 6 × 10⁸ m): about 12.7 at 1 × 10⁸ m, 3.2 at 2 × 10⁸ m, 1.4 at 3 × 10⁸ m, 0.8 at 4 × 10⁸ m and 0.5 at 5 × 10⁸ m.",
    }),

  sa(61, 6, "Hurlstone 2008 Half-yearly, Q3",
    "A 3000 kg satellite is in a circular orbit around the Earth at an altitude of 400 km. At this altitude it travels at 7668 m/s. Retro rockets are fired briefly, which causes it to slow down and as a result, sometime later it reaches an altitude of 300 km.\n(a) Calculate the change in gravitational potential energy of the satellite. [3 marks]\n(b) Qualitatively state what happens to the speed of the satellite as a result of this orbital change and justify your answer using the law of conservation of energy. [3 marks]"),

  sa(62, 3, "North Sydney Girls 2020 Trial, Q27",
    "Two objects of identical mass fall from space down to the surface of a planet with no atmosphere. Mass m₁ does not have enough speed to remain in orbit and follows a parabolic path down to the planet. Mass m₂ is stationary and starts to fall straight down.\nCompare qualitatively the impact velocities of m₁ and m₂. Refer to energy changes in your answer."),

  sa(63, 3, "North Sydney Girls 2020 Trial, Q29",
    "A satellite is exploring a distant planet and its orbiting moon. It follows the path shown here with a dashed line and only uses its rockets to leave the planet’s orbit. This picture is not to scale.\n(a) Indicate, using a cross, where in the diagram the net force on the rocket is zero. (Describe the position in words.) [1 mark]\n(b) Describe how the model drawn above is useful in understanding satellite motion AND how the model has limitations. [2 marks]",
    {
      svg: planetMoonPath(),
      alt: "A planet with its moon on a large dotted circular orbit to the left. A dashed path comes up from below, curves once around the planet, and then leaves to the left, passing close to the moon. Not to scale.",
    }),

  sa(64, 9, "North Sydney Girls 2021 Trial, Q25",
    "A 975 kg spacecraft is returning to Earth from a space mission. It will be placed into a geostationary orbit around the Earth before landing on the surface. The first diagram shows a possible path of the spacecraft as it approaches the Earth. Assume no air resistance for the entire journey of the spacecraft.\n(a) Calculate the orbital speed of the spacecraft when it is in the geostationary orbit at point B. [3 marks]\n(b) Calculate the change in gravitational potential energy of the spacecraft as it moves from point A to point B. [2 marks]\n(c) Explain what happens to the total energy of the spacecraft as it moves from point A to point B. [2 marks]\nAfter a while in the geostationary orbit, the spacecraft turns on its thrusters momentarily to reduce its speed to 2.5 × 10³ m s⁻¹. It then begins its descent to the surface as shown in the second diagram.\n(d) Calculate the speed of the spacecraft just before it hits the surface at point C. [2 marks]",
    {
      svg: geoReturnPanels(),
      alt: "Two diagrams, not to scale. First: Earth with a dashed geostationary orbit; the spacecraft starts at point A, 5.5 × 10⁷ m from Earth's centre, and curves in to point B on the geostationary orbit. Second: from B on the geostationary orbit the spacecraft curves down to point C on Earth's surface.",
    }),

  sa(65, 8, "North Sydney Girls 2022 Trial, Q31",
    "A space shuttle of mass m is launched from the surface of the Earth at point A. The kinetic energy K given to the shuttle at launch is given by:\nK_A = 5GMm / 7r_E\nwhere M is the mass of the Earth.\nThe space shuttle then enters a circular orbit of radius R at point B as shown in the diagram below.\n(a) Explain why the space shuttle cannot escape the gravitational field of the Earth. [2 marks]\n(b) Show that the total energy of the space shuttle in its orbit at point B is given by\nE_total = −GMm / 2R. [3 marks]\n(c) By using the conservation of energy, find R in terms of r_E. [3 marks]",
    {
      svg: launchToOrbit(),
      alt: "Earth with a dashed circular orbit of radius R. The shuttle is launched from point A on Earth's surface and curves up to point B on the orbit. Not to scale.",
    }),

  sa(66, 4, "North Sydney Girls 2023 Trial, Q22",
    "Two identical masses of 26.5 kg are placed with their centres separated by a distance of d m.\n(a) Given that d = 11.0 m, calculate the gravitational force between the two masses. [2 marks]\n(b) On the axes below, sketch a graph to show the variation of the gravitational force between the two masses as they are separated. In your sketch, you should indicate the magnitude of the forces when the separation of the centres are 2d and 4d. (Describe the graph in words and give the two force values.) [2 marks]",
    {
      svg: twoMasses(),
      alt: "Two identical spheres with their centres a distance d m apart.",
    }),

  sa(67, 7, "North Sydney Girls 2023 Trial, Q26",
    "Mimas is a moon of Saturn and orbits Saturn with a mean radius of 1.86 × 10⁸ m and orbital period of 0.942 Earth days.\n(a) Calculate the mass of Saturn. [2 marks]\n(b) Dione is another moon of Saturn and orbits Saturn with a mean radius of 3.78 × 10⁸ m. Calculate the orbital period of Dione in Earth days. [2 marks]\n(c) Explain why the orbital velocity of Dione changes as it orbits Saturn. [3 marks]"),

  sa(68, 6, "North Sydney Girls 2024 Trial, Q21",
    "A 200.0 kg satellite is put into low Earth orbit at an altitude of 300.0 km.\n(a) Calculate the gravitational acceleration experienced by the satellite in orbit. [2 marks]\n(b) The International Space Station also orbits the Earth with an orbital period of 94.7 minutes. Calculate its orbital radius. [2 marks]\n(c) Calculate the escape velocity for the International Space Station. [2 marks]"),

  sa(69, 5, "North Sydney Girls 2024 Trial, Q22",
    "A 50 kg satellite is in orbit around the Earth. The orbital radius of the satellite is 10 000 km.\n(a) Determine the total energy of the satellite due to its orbit around the Earth. [2 marks]\nWhile in orbit the satellite is subject to a small frictional force due to the Earth’s atmosphere.\n(b) Explain the changes that will occur to the satellite due to this frictional force. [3 marks]"),

  sa(70, 5, "Penrith 2019 Trial, Q23",
    "A satellite is circling the Earth such that it takes 1 hour and 40 minutes to complete one circular orbit:\n(a) Calculate the satellite’s altitude in kilometres: [3 marks]\n(b) Identify two benefits of the satellite orbiting at the altitude you calculated in (a) above: [2 marks]"),

  sa(71, 5, "Pymble 2022 Trial, Q21",
    "By applying the law of conservation of energy to the relationship between gravitational potential energy and kinetic energy, explain how the escape velocity from a distance r from the centre of mass of a planet is given by:\nv = √(2GM / r)\nwhere M is the mass of the planet."),

  sa(72, 4, "Shore 2019 Half-yearly, Q8",
    "The asteroid 243 Ida was discovered in 1884. The Galileo spacecraft, on its way to Jupiter, visited the asteroid in 1993. The asteroid was the first to be found to have a natural satellite, that is, its own moon, now called Dactyl.\n(a) Dactyl orbits Ida at a radius of 100 km and with a period of 27 hours. What is the mass of 243 Ida? [2 marks]\n(b) Jupiter takes approximately 12 earth years to orbit the sun. Assuming Earth is 150 million km from the sun, what is the minimum displacement between Earth and Jupiter. [2 marks]"),

  sa(73, 4, "Shore 2019 Half-yearly, Q9",
    "(a) By equating kinetic and gravitational potential energy, derive an expression for escape velocity v for a spacecraft of mass m, from a body of mass M, at a distance from the centre of mass r. [2 marks]\n(b) An astronaut can push off her spacecraft at 2 m/s. At what distance from the centre of mass of the Earth would this be enough to permanently escape Earth’s gravitational influence? [2 marks]"),

  sa(74, 4, "Sydney Grammar 2005 Half-yearly, Q15",
    "A satellite of mass 4000 kg is launched into a circular orbit at an altitude of 250 km above the surface of the Earth.\n(a) Determine the gravitational potential energy of the satellite at the surface of the Earth. [1 mark]\n(b) Determine the gravitational potential energy of the satellite when it is in orbit 250 km above the surface. [1 mark]\n(c) Determine the kinetic energy of the satellite when it is in orbit 250 km above the surface. [2 marks]"),

  sa(75, 2, "Shore 2020 Half-yearly, Q12",
    "The Earth orbits the Sun with an average radius of approximately 150 million km. Halley’s comet orbits the Sun with a period of 75 years.\nCalculate the average radius of the orbit of Halley’s comet."),

  sa(76, 3, "Shore 2020 Half-yearly, Q15",
    "Two small meteors are drifting with identical velocities in deep space. One has a mass of 250g and the other a mass of 70g. They are 1km apart.\n(a) Calculate the gravitational force of attraction between the two meteors. [1 mark]\n(b) The two meteors will gradually come together due to the gravitational force between them.\nExplain differences and changes in the acceleration of the two meteors as they come together. Support your answer using mathematics. [2 marks]"),

  sa(77, 5, "Shore 2021 Half-yearly, Q2",
    "Geostationary Orbits and Gravitational Potential Energy\nThe Earth may be considered to be a sphere of radius 6.4 × 10⁶ m with its mass of 6.0 × 10²⁴ kg concentrated at its centre.\nA satellite of mass 650 kg is to be launched from the Equator and put into geostationary orbit with a period of 24 hours.\n(a) Show that the radius of the geostationary orbit is 4.2 × 10⁷ m. [2 marks]\n(b) Determine the increase in gravitational potential energy of the satellite during its launch from the Earth’s surface to the geostationary orbit. [3 marks]"),

  sa(78, 7, "Shore 2021 Trial, Q21",
    "A 100 kg satellite is placed into a near circular orbit with an average path radius of 6.671 × 10⁶ m around the Earth.\n(a) Calculate the period of the satellite. [2 marks]\n(b) Calculate the speed of the satellite. [2 marks]\n(c) Explain why a satellite of 1000 kg with the same distance from the centre of the Earth would have the same period. [3 marks]"),

  sa(79, 2, "Sydney Boys 2019 Trial, Q21",
    "Low Earth orbit satellites experience significant orbital decay, have a low life span and are difficult to monitor and troubleshoot. Explain why low Earth orbit satellites are still used extensively despite the above points."),

  sa(80, 3, "Sydney Boys 2019 Trial, Q24",
    "Explain why the mass of an object is not a factor in determining its escape velocity."),

  sa(81, 3, "Sydney Boys 2022 Trial, Q30",
    "A Molniya orbit is an inclined, highly elliptical orbit with a period of 12 hours, designed to provide communications and remote sensing coverage over high latitudes.\nAccount for the changes in velocity of the satellite as it completes one orbit from position P.",
    {
      svg: molniyaOrbit(),
      alt: "Earth with a long, thin elliptical orbit tilted steeply. One end of the orbit passes close to Earth; position P is at the far end of the orbit, farthest from Earth.",
    }),

  sa(82, 5, "Sydney Boys 2025 Trial, Q27",
    "The moon is Earth's only natural satellite. It has a mass of 7.35 × 10²² kg and, on average, the distance from the centre of the Moon to the surface of the Earth is 3.84 × 10⁸ m.\n(a) Show the force due to gravity between the Moon and the Earth is 1.93 × 10²⁰ N. [2 marks]\n(b) A large rock is stationary in space and located at a distance 1.0 × 10⁷ m from the centre of an unknown planet. It takes 1.0 MJ of work to move the rock to a stationary point 2.0 × 10⁷ m from the centre of the unknown planet.\nCalculate how much work needs to be done to move the rock from 2.0 × 10⁷ m away from the centre of the unknown planet to a stationary point 8.0 × 10⁷ m from the centre of the unknown planet. [3 marks]"),

  sa(83, 3, "Sydney Boys 2025 Trial, Q35",
    "(a) A planet orbits the Sun in an elliptical path. The distance between the planet and the Sun varies as the planet moves in its orbit. Explain, using the relevant law, how the speed of the planet changes as it moves along its orbit. [2 marks]\n(b) Given that the orbit of a planet is nearly circular, the time taken for one full revolution around the Sun is 365 days, and the average radius of the orbit is 1.5 × 10¹¹ m, calculate the orbital speed of the planet. [1 mark]"),

  sa(84, 4, "Sydney Girls 2020 Trial, Q31",
    "The earth has a radius of 6378 km.\nData for three different satellites orbiting earth has been outlined in the table provided below.\nAccount for the difference in the orbital velocities of the satellites.",
    {
      svg: dataTable({
        headers: ["Satellite System", "Orbital Height (km)", "Orbital Velocity (km/s)", "Orbital Period (h m s)"],
        rows: [["Intelsat (GEO)", "35,786", "3.0747", "23 56 4.1"], ["New ICO (MEO)", "10,255", "4.8954", "5 55 48.4"], ["Iridium (LEO)", "1,469", "7.1272", "1 55 17.8"]],
        colWidths: [120, 130, 145, 140],
        italicHeaders: false,
      }),
      alt: "Table. Intelsat (GEO): orbital height 35 786 km, orbital velocity 3.0747 km/s, period 23 h 56 m 4.1 s. New ICO (MEO): 10 255 km, 4.8954 km/s, 5 h 55 m 48.4 s. Iridium (LEO): 1469 km, 7.1272 km/s, 1 h 55 m 17.8 s.",
    }),

  sa(85, 3, "Sydney Grammar 2018 Half-yearly, Q19",
    "A satellite of mass m is in a circular orbit around a planet of mass M at a distance of r metres from the centre of the planet.\nUse Newton’s Law of Universal Gravitation to derive a formula for the kinetic energy of the satellite in terms of G, M, m and r."),

  sa(86, 4, "Sydney Grammar 2021 Trial, Q36",
    "A projectile is launched from one point of the Earth to a point on the other side. The trajectory of this projectile (ignoring all atmospheric friction) has the shape of an elliptical orbit with the centre of the Earth as a focus. This is depicted below.\nWhen launched it has an initial speed of 8200 m s⁻¹ at a distance of R from the centre of the Earth and reaches a maximum distance from the centre of the Earth of 2R which is the furthest distance from the Earth’s surface.\nUsing the law of conservation of energy, determine the speed, v, of the projectile when it is furthest from the Earth’s surface. (Assume there is no air resistance acting on the projectile.)",
    {
      svg: projectileEllipse(),
      alt: "Earth of radius R. A projectile's path rises from the Start point on the surface to the Furthest point, a distance 2R from Earth's centre, where its velocity v is horizontal, then comes down to the Finish point on the other side. The rest of the ellipse, inside the Earth, is dashed.",
    }),

  sa(87, 4, "Sydney Grammar 2022 Trial, Q38",
    "A planet of mass m is orbiting a Star, S, of mass M in an elliptical orbit as shown below. The planet is shown at two points in its orbit. At position A it is at its closest to S and at position B, it is at its furthest. The distance from S to A is r_A whereas the distance S to B is r_B.\nFor an elliptical orbit the total energy is given by\nE = −GMm / (r_A + r_B)\nUse the total energy to determine the ratio of the kinetic energy (K_A / K_B) of the planet at position A (K_A) compared to position B (K_B) if the distance r_B is three times larger than r_A. (i.e., r_A = r and r_B = 3r and r_B / r_A = 3).",
    {
      svg: perihelionAphelionPoints(),
      alt: "An elliptical orbit around a star S. A is the closest point, distance r_A from S, with velocity v_A pointing up; B is the farthest point, distance r_B from S, with a shorter velocity v_B pointing down.",
    }),

  sa(88, 6, "Sydney Grammar 2024 Trial, Q31",
    "The diagram below shows two satellites in orbit around the Earth. One orbit is circular, and the other is elliptical. Both satellites have the same total energy.\n(a) If the gravitational potential energy of the satellite is U, show that the kinetic energy, K, of the satellite in a circular orbit is K = −U/2, and that therefore the total energy E = U/2. [3 marks]\n(b) Compare the work done by gravity on each of the satellites over the course of one orbit. [3 marks]",
    {
      svg: sameEnergyOrbits(),
      alt: "Earth at the centre of a dashed circular orbit of radius r, with point C on it. A dotted elliptical orbit, with Earth at one focus, has its nearest point P and farthest point A; it crosses the circle.",
    }),

  sa(89, 4, "Sydney Grammar 2024 Trial, Q33",
    "Around a planet called Pax, a satellite has an orbital velocity of 1400 m s⁻¹ at a constant orbital radius of 5.5 × 10⁷ m.\n(a) Calculate the mass of Pax. [2 marks]\n(b) Determine the escape velocity from Pax at the position of the satellite. [2 marks]"),

  sa(90, 3, "Sydney Tech 2016 Trial, Q24",
    "A low earth satellite completes 12 orbits in the same time a geostationary orbit completes one orbit. Determine the altitude of the low earth satellite if the radius of the earth is 6.371 × 10⁶ m."),
];

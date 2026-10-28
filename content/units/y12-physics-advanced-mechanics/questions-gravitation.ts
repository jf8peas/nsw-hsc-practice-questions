import type { Question } from "@/lib/types";
import { mc } from "./build";
import {
  accelerationArrowPanels,
  concentricOrbits,
  dataTable,
  ellipseOrbit,
  energyDotGraph,
  fieldStrengthGraph,
  forceDistanceGraph,
  geoLeoCoverage,
  halleyOrbit,
  orbitChangePanels,
  orbitPathPanels,
  potentialEnergyAltitudeGraph,
  potentialLineXY,
  scaleSatellites,
  spacecraftLaunch,
  stack,
  straightLineGraph,
  twoSpheres,
  velocityVectorFigures,
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
];

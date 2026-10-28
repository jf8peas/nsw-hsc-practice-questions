import type { Question } from "@/lib/types";
import { mc } from "./build";
import { dataTable, ellipseOrbit, orbitPathPanels, potentialEnergyAltitudeGraph } from "./diagram";

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
];

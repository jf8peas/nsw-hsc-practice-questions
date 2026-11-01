// Hand-written diagrams for this unit, keyed by question id. Each is redrawn from the source
// paper's page (constitution Principle V) using the curve coordinates checked against the page in
// resources/topic008/06-transcription-log.md. Alt text describes what is drawn, not the answer.
// Shared diagrams: m047/m061 (Knox 2024 Q19–20), m065/m073 (Sydney Boys 2025 Q19–20),
// s027/s028 (James Ruse 2021 Q21), s044/s045 (Newington 2025 Q22).

import { market } from "./diagram";

export interface DiagramEntry {
  svg: string;
  alt: string;
}

const grid8 = (): DiagramEntry => ({
  svg: market({
    x: [0, 76], y: [0, 8.6],
    xTicks: [10, 20, 30, 40, 50, 60, 70], yTicks: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    grid: { x: [10, 20, 30, 40, 50, 60, 70], y: [1, 2, 3, 4, 5, 6, 7, 8] },
    xLabel: "Quantity (thousands)", yLabel: "Price ($)",
    lines: [
      { from: [10, 2], to: [70, 8], label: "S", kind: "supply" },
      { from: [10, 8], to: [70, 2], label: "D", kind: "demand", labelDy: 14 },
    ],
  }),
  alt: "Demand and supply drawn on a grid. Price ($) runs from 0 to 8 in steps of 1; quantity (thousands) from 10 to 70 in steps of 10. Supply S is a straight line from 10 thousand at $2 to 70 thousand at $8. Demand D is a straight line from 10 thousand at $8 to 70 thousand at $2. They cross at 40 thousand and $5.",
});

const sb2025 = (): DiagramEntry => ({
  svg: market({
    x: [0, 120], y: [40, 90], origin: undefined,
    xTicks: [20, 40, 60, 80, 100], yTicks: [50, 60, 70],
    xLabel: "Quantity (millions)", yLabel: "Price ($) per unit",
    lines: [
      { from: [10, 45], to: [100, 90], label: "S", kind: "supply" },
      { from: [20, 90], to: [110, 45], label: "D", kind: "demand", labelDy: 14 },
    ],
    guides: [
      { at: [20, 50], toY: false }, { at: [40, 60], toY: false }, { at: [60, 70] },
      { at: [80, 60] }, { at: [100, 50] },
    ],
  }),
  alt: "Demand and supply. Price ($) per unit is marked at 50, 60 and 70; quantity (millions) at 20, 40, 60, 80 and 100. Supply S slopes up and demand D slopes down; they cross at $70 and 60 million. Dashed lines show that at $60 supply is 40 million and demand is 80 million, and at $50 supply is 20 million and demand is 100 million.",
});

const jr2021 = (): DiagramEntry => ({
  svg: market({
    x: [100, 190], y: [0, 62],
    xTicks: [110, 120, 130, 140, 150, 160, 170, 180], yTicks: [10, 20, 30, 40],
    grid: { x: [110, 120, 130, 140, 150, 160, 170, 180], y: [10, 20, 30, 40] },
    xLabel: "Quantity", yLabel: "Price per unit ($)",
    lines: [
      { from: [110, 10], to: [158, 58], label: "S", kind: "supply" },
      { from: [180, 10], to: [132, 58], label: "D", kind: "demand", labelDx: -14 },
    ],
  }),
  alt: "Demand and supply on a grid. Price per unit ($) is marked at 10, 20, 30 and 40; quantity at 110 to 180 in steps of 10. Supply S rises in a straight line from 110 units at $10 through 120 at $20, 130 at $30 and 140 at $40. Demand D falls from 150 units at $40 through 160 at $30 and 170 at $20 to 180 at $10. The two lines cross at about $45 and 145 units.",
});

const n2025 = (): DiagramEntry => ({
  svg: market({
    x: [0, 375], y: [0, 66],
    xTicks: [50, 100, 150, 200, 250, 300, 350],
    yTicks: [[10, "$10"], [20, "$20"], [30, "$30"], [40, "$40"], [50, "$50"], [60, "$60"]],
    grid: { x: [50, 100, 150, 200, 250, 300, 350], y: [10, 20, 30, 40, 50, 60] },
    xLabel: "Quantity", yLabel: "Price",
    lines: [
      { from: [50, 10], to: [300, 60], label: "S", kind: "supply" },
      { from: [100, 60], to: [350, 10], label: "D", kind: "demand", labelDy: 14 },
    ],
  }),
  alt: "Domestic demand and supply on a grid. Price is marked from $10 to $60 in steps of $10; quantity from 50 to 350 in steps of 50. Supply S rises in a straight line from 50 units at $10 to 300 units at $60. Demand D falls in a straight line from 100 units at $60 to 350 units at $10. They cross at $40 and 200 units.",
});

const subsidy4050 = (yLabel: string): DiagramEntry => ({
  svg: market({
    x: [0, 82], y: [0, 82], origin: "0",
    xTicks: [40, 50], yTicks: [[40, "$40"], [50, "$50"], [60, "$60"]],
    xLabel: "Quantity", yLabel,
    lines: [
      { from: [22, 68], to: [76, 14], label: "D", kind: "demand", labelDy: 14 },
      { from: [22, 32], to: [66, 76], label: "S", kind: "supply" },
      { from: [32, 22], to: [76, 66], label: "S₁", kind: "supply" },
    ],
    guides: [{ at: [40, 50] }, { at: [50, 40] }, { at: [50, 60] }],
    arrows: [{ from: [57, 70], to: [72, 70] }],
  }),
  alt: "Demand and supply with a subsidy. Price is marked at $40, $50 and $60; quantity at 40 and 50. Demand D slopes down. Supply S slopes up and crosses D at $50 and 40 units. A second supply curve S₁, parallel to S and to its right (an arrow points from S to S₁), crosses D at $40 and 50 units. A dashed line marks S at $60 at 50 units.",
});

export const diagrams: Record<string, DiagramEntry> = {
  m005: {
    svg: market({
      x: [40, 142], y: [30, 90],
      xTicks: [80, 100], yTicks: [40, 50, 60],
      xLabel: "Q of milk (litres)", yLabel: "Price per litre",
      lines: [
        { from: [56, 72], to: [132, 34], label: "D", kind: "demand", labelDy: 14 },
        { from: [56, 48], to: [124, 82], label: "S", kind: "supply" },
        { from: [70, 35], to: [136, 68], label: "S₁", kind: "supply" },
      ],
      guides: [{ at: [80, 60] }, { at: [100, 50] }, { at: [80, 40], toX: false }],
      arrows: [{ from: [91, 65], to: [124, 65] }],
    }),
    alt: "Demand and supply for milk in a closed economy. Price per litre is marked at 40, 50 and 60; quantity of milk (litres) at 80 and 100. Demand D slopes down. Supply S slopes up and crosses D at 60 and 80 litres. A second supply curve S₁, parallel to S and to its right (an arrow points from S to S₁), crosses D at 50 and 100 litres. A dashed line marks S₁ at 40 at 80 litres.",
  },
  m007: {
    svg: market({
      x: [0, 120], y: [0, 70],
      xTicks: [20, 40, 60, 80, 100], yTicks: [20, 40],
      xLabel: "Quantity", yLabel: "Price $",
      lines: [
        { from: [12, 12], to: [66, 66], label: "S", kind: "supply" },
        { from: [54, 66], to: [108, 12], label: "D", kind: "demand", labelDy: 14 },
      ],
      guides: [{ at: [20, 20], toY: false }, { at: [40, 40], toY: false }, { at: [80, 40] }, { at: [100, 20] }],
    }),
    alt: "Demand and supply. Price ($) is marked at 20 and 40; quantity at 20, 40, 60, 80 and 100. Supply S slopes up and demand D slopes down. Dashed lines show that at $20 supply is 20 and demand is 100, and at $40 supply is 40 and demand is 80.",
  },
  m011: {
    svg: market({
      x: [0, 560], y: [0, 14.5], origin: "0",
      xTicks: [100, 200, 300, 400, 500], yTicks: [8, 10],
      xLabel: "Quantity", yLabel: "Price ($)",
      hlines: [{ y: 6, label: "World price = 6" }],
      lines: [
        { from: [0, 4], to: [450, 13], label: "S", kind: "supply" },
        { from: [100, 14], to: [550, 5], label: "D", kind: "demand", labelDy: 14 },
      ],
      guides: [{ at: [100, 6], toY: false }, { at: [200, 8], toY: false }, { at: [300, 10] }, { at: [400, 8] }, { at: [500, 6], toY: false }],
    }),
    alt: "Domestic demand and supply. Price ($) is marked at 8 and 10, with a dashed line labelled World price = 6; quantity at 100 to 500 in steps of 100. Supply S slopes up and demand D slopes down; they cross at $10 and 300 units. Dashed lines show that at $6 supply is 100 and demand is 500, and at $8 supply is 200 and demand is 400.",
  },
  m013: subsidy4050("Price $"),
  m020: {
    svg: market({
      x: [2000, 8000], y: [0, 31],
      xTicks: [3000, 4000, 5000, 6000, 7000], yTicks: [[10, "$10"], [15, "$15"], [20, "$20"]],
      xLabel: "Quantity", yLabel: "Price ($)",
      lines: [
        { from: [2600, 8], to: [7000, 30], label: "S", kind: "supply" },
        { from: [3000, 30], to: [7600, 7], label: "D", kind: "demand", labelDy: 14 },
      ],
      guides: [{ at: [3000, 10] }, { at: [4000, 15] }, { at: [5000, 20] }, { at: [6000, 15] }, { at: [7000, 10] }],
    }),
    alt: "Tariff diagram. Price ($) is marked at $10, $15 and $20; quantity at 3000 to 7000 in steps of 1000. Supply S slopes up and demand D slopes down; they cross at $20 and 5000. Dashed lines show that at $15 supply is 4000 and demand is 6000, and at $10 supply is 3000 and demand is 7000.",
  },
  m021: {
    svg: market({
      x: [0, 6000], y: [0, 18.5],
      xTicks: [1000, 2000, 4000, 5000], yTicks: [10, 12],
      xLabel: "Quantity", yLabel: "Price",
      lines: [
        { from: [500, 9], to: [5000, 18], label: "S", kind: "supply" },
        { from: [1000, 18], to: [5500, 9], label: "D", kind: "demand", labelDy: 14 },
      ],
      guides: [{ at: [1000, 10] }, { at: [2000, 12] }, { at: [4000, 12] }, { at: [5000, 10] }],
    }),
    alt: "Quota diagram. Price is marked at 10 and 12; quantity at 1000, 2000, 4000 and 5000. Supply S slopes up and demand D slopes down. Dashed lines show that at 10 supply is 1000 and demand is 5000, and at 12 supply is 2000 and demand is 4000.",
  },
  m025: grid8(),
  m043: {
    svg: market({
      x: [0, 12.5], y: [0, 10.5],
      xTicks: [[3, "Q₁"], [5, "Q₂"], [7.5, "Q₃"], [10, "Q₄"]],
      xLabel: "Quantity", yLabel: "Price",
      hlines: [{ y: 5, label: "T", dashed: false }, { y: 3, label: "F", dashed: false }],
      lines: [
        { from: [1.5, 1.5], to: [10, 10], label: "S", kind: "supply" },
        { from: [1.5, 9.8], to: [12, 1.4], label: "D", kind: "demand", labelDy: 14 },
      ],
      guides: [{ at: [3, 3], toY: false }, { at: [5, 5], toY: false }, { at: [7.5, 5], toY: false }, { at: [10, 3], toY: false }],
    }),
    alt: "Tariff diagram. T is the tariff price and F the free trade price, both drawn as horizontal lines, with T above F. Supply S slopes up and demand D slopes down. Supply meets F at Q₁ and T at Q₂; demand meets T at Q₃ and F at Q₄.",
  },
  m047: grid8(),
  m056: {
    svg: market({
      x: [0, 10], y: [0, 10], origin: "0",
      xLabel: "Quantity", yLabel: "Price",
      lines: [
        { from: [2, 8.6], to: [9, 2], label: "D", kind: "demand", labelDy: 14 },
        { from: [7, 0.6], to: [7, 9.6], label: "S", kind: "supply" },
        { from: [4, 0.6], to: [4, 9.6], label: "S₁", kind: "supply", width: 3.5 },
      ],
      arrows: [{ from: [6.6, 8.8], to: [4.3, 8.8] }],
    }),
    alt: "Import quota diagram for pharmaceutical products, with no values marked. Demand D slopes down. Supply is drawn as two vertical lines: S on the right and S₁ (thicker) to its left, with an arrow pointing from S to S₁. D crosses S₁ at a higher price than it crosses S.",
  },
  m058: subsidy4050("Price $"),
  m059: {
    svg: market({
      x: [420, 790], y: [92, 124],
      xTicks: [500, 550, 600, 650, 700], yTicks: [[100, "$100"], [105, "$105"]],
      xLabel: "Quantity", yLabel: "Price",
      hlines: [{ y: 105, dashed: false }, { y: 100, dashed: false }],
      lines: [
        { from: [440, 94], to: [720, 122], label: "S", kind: "supply" },
        { from: [520, 118], to: [760, 94], label: "D", kind: "demand", labelDy: 14 },
      ],
      guides: [{ at: [500, 100], toY: false }, { at: [550, 105], toY: false }, { at: [600, 110], toY: false }, { at: [650, 105], toY: false }, { at: [700, 100], toY: false }],
    }),
    alt: "Market for rice cookers. Price is marked at $100 and $105, each with a horizontal line across the diagram; quantity at 500 to 700 in steps of 50. Supply S slopes up and demand D slopes down; they cross at 600. At $105 supply is 550 and demand is 650; at $100 supply is 500 and demand is 700.",
  },
  m061: grid8(),
  m065: sb2025(),
  m070: {
    svg: market({
      x: [0, 18], y: [0, 10], origin: "0",
      xLabel: "Quantity", yLabel: "Price",
      hlines: [{ y: 4, label: "World price + tariff" }, { y: 2, label: "World price" }],
      lines: [
        { from: [1, 0.5], to: [17, 8.5], label: "S", kind: "supply" },
        { from: [1, 8.5], to: [16.4, 0.8], label: "D", kind: "demand", labelDy: 14 },
      ],
      guides: [{ at: [4, 2], toY: false }, { at: [8, 4], toY: false }, { at: [10, 4], toY: false }, { at: [14, 2], toY: false }],
      points: [
        { at: [8, 4], label: "A", dx: -8 }, { at: [10, 4], label: "G", dx: 8 },
        { at: [4, 2], label: "B" }, { at: [8, 2], label: "C", dx: 8 }, { at: [10, 2], label: "E", dx: 8 }, { at: [14, 2], label: "F", dx: 8 },
        { at: [4, 0], label: "L", dy: 26, dot: false }, { at: [8, 0], label: "M", dy: 26, dot: false },
        { at: [10, 0], label: "N", dy: 26, dot: false }, { at: [14, 0], label: "R", dy: 26, dot: false },
      ],
    }),
    alt: "Tariff removal diagram with lettered points. Two horizontal lines: World price + tariff (upper) and World price (lower). Supply S slopes up and demand D slopes down. On the upper line, A is where it meets S and G where it meets D. On the lower line, from left to right: B where it meets S, C directly below A, E directly below G, and F where it meets D. On the quantity axis, L, M, N and R lie directly below B, C, E and F.",
  },
  m073: sb2025(),
  s027: jr2021(),
  s028: jr2021(),
  s044: n2025(),
  s045: n2025(),
};

export const tableQuestions: Record<string, { headers: string[]; rows: string[][]; alt: string }> = {
  m001: {
    headers: ["Country", "Nominal GDP ($US)", "Consumer Price Index (CPI)", "Human Development Index"],
    rows: [
      ["Country A", "$390 billion", "114", "0.97"],
      ["Country B", "$400 billion", "120", "0.75"],
    ],
    alt: "Table of economic data for two countries: nominal GDP, CPI and HDI for Country A and Country B.",
  },
  m024: {
    headers: ["Life expectancy at birth", "Adult educational attainment", "Export revenue", "Import expenditure"],
    rows: [["40", "5 years", "$100 million", "$90 million"]],
    alt: "Table of development indicators for a hypothetical country: life expectancy 40, adult educational attainment 5 years, export revenue $100 million, import expenditure $90 million.",
  },
  m074: {
    headers: ["Indicator", "Country A (Year 1)", "Country A (Year 3)", "Country B (Year 1)", "Country B (Year 3)"],
    rows: [
      ["Exports of goods and services (% of GDP)", "18", "34", "22", "25"],
      ["Imports of goods and services (% of GDP)", "20", "36", "24", "27"],
      ["Foreign direct investment inflows (% of GDP)", "1.5", "6.0", "2.0", "2.5"],
      ["Portfolio investment inflows (% of GDP)", "0.8", "4.5", "1.0", "1.2"],
    ],
    alt: "Table of trade and financial-flow data for two hypothetical economies, Country A and Country B, over three years.",
  },
  m075: {
    headers: ["Year", "World merchandise trade volume growth (%)", "World real GDP growth (%)"],
    rows: [
      ["Year 1", "3.0", "3.2"],
      ["Year 2", "5.5", "3.0"],
      ["Year 3", "−5.3", "−3.0"],
      ["Year 4", "9.8", "6.3"],
    ],
    alt: "Table of world merchandise trade volume growth and world real GDP growth over four years.",
  },
  m076: {
    headers: ["Year", "Trade-to-GDP ratio (%)"],
    rows: [
      ["Year 1", "40"],
      ["Year 2", "48"],
      ["Year 3", "55"],
      ["Year 4", "61"],
    ],
    alt: "Table of the trade-to-GDP ratio for a hypothetical economy over four years, rising from 40% to 61%.",
  },
  m077: {
    headers: ["Recipient group", "FDI inflows, Year 1 (US$ billion)", "FDI inflows, Year 2 (US$ billion)"],
    rows: [
      ["Advanced economies", "900", "950"],
      ["Emerging and developing economies", "450", "480"],
      ["World total", "1350", "1430"],
    ],
    alt: "Table of foreign direct investment inflows by recipient group over two years.",
  },
  s023: {
    headers: ["Country", "Economic growth (decade-average)", "GNI per capita", "Human Development Index"],
    rows: [
      ["X", "6.8%", "$8068", "0.61"],
      ["Y", "7.1%", "$7654", "0.63"],
    ],
    alt: "Table of selected data for two hypothetical countries: economic growth, GNI per capita and HDI for Country X and Country Y.",
  },
  s024: {
    headers: ["Country", "Economic growth (decade-average)", "GNI per capita", "Human Development Index"],
    rows: [
      ["X", "6.8%", "$8068", "0.61"],
      ["Y", "7.1%", "$7654", "0.63"],
    ],
    alt: "Table of selected data for two hypothetical countries: economic growth, GNI per capita and HDI for Country X and Country Y.",
  },
  s025: {
    headers: ["Country", "Exports ($bn)", "Imports ($bn)", "GDP ($bn)"],
    rows: [
      ["X", "48", "62", "242"],
      ["Y", "89", "36", "284"],
      ["Z", "22", "26", "77"],
    ],
    alt: "Table of economic information for three hypothetical economies: exports, imports and GDP for Country X, Y and Z.",
  },
  s026: {
    headers: ["Country", "Exports ($bn)", "Imports ($bn)", "GDP ($bn)"],
    rows: [
      ["X", "48", "62", "242"],
      ["Y", "89", "36", "284"],
      ["Z", "22", "26", "77"],
    ],
    alt: "Table of economic information for three hypothetical economies: exports, imports and GDP for Country X, Y and Z.",
  },
  s065: {
    headers: ["Year", "Exports of goods and services (US$ billion)", "Imports of goods and services (US$ billion)", "GDP (US$ billion)"],
    rows: [
      ["Year 1", "120", "130", "500"],
      ["Year 2", "150", "160", "500"],
    ],
    alt: "Table of trade data for a hypothetical economy, Country A, over two years: exports, imports and GDP.",
  },
  s066: {
    headers: ["Indicator", "Year 1", "Year 2", "Year 3"],
    rows: [
      ["Exports of goods and services (% of GDP)", "20", "26", "33"],
      ["Foreign direct investment inflows (% of GDP)", "1.0", "2.5", "5.0"],
    ],
    alt: "Table of trade and financial-flow data for a hypothetical economy, Country B, over three years.",
  },
  s067: {
    headers: ["Indicator", "Country C (Year 1)", "Country C (Year 3)", "Country D (Year 1)", "Country D (Year 3)"],
    rows: [
      ["Exports of goods and services (% of GDP)", "15", "40", "25", "28"],
      ["Imports of goods and services (% of GDP)", "17", "42", "27", "30"],
      ["Foreign direct investment inflows (% of GDP)", "1.0", "7.0", "2.0", "2.5"],
      ["Portfolio investment inflows (% of GDP)", "0.5", "5.0", "1.0", "1.2"],
    ],
    alt: "Table of trade and financial-flow data for two hypothetical economies, Country C and Country D, over three years.",
  },
};
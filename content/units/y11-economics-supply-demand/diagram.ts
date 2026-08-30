// Pure SVG builders for Year 11 market diagrams (goods, labour, property). No
// dependencies — the string is embedded in question data and rendered with
// dangerouslySetInnerHTML.
//
// Normalised space: price p and quantity q both run 0..1. Linear curves:
//   demand:  q = 0.82 − 0.62·p (+ shift)
//   supply:  q = 0.14 + 0.70·p (+ shift)   [steep/inelastic: q = 0.42 + 0.15·p]

const VB_W = 340;
const VB_H = 244;
const OX = 46;
const OY = 202;
const PW = 250;
const PH = 170;
const SHIFT = 0.22;

const C = {
  axis: "#475569",
  demand: "#1d4ed8",
  supply: "#c2410c",
  guide: "#94a3b8",
  ink: "#0f172a",
  accent: "#dc2626",
  text: "#334155",
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const toX = (q: number) => OX + clamp01(q) * PW;
const toY = (p: number) => OY - clamp01(p) * PH;

const dQ = (p: number, shift = 0) => 0.82 - 0.62 * p + shift;

export interface SDOptions {
  shift?: "demand-increase" | "demand-decrease" | "supply-increase" | "supply-decrease";
  /** dashed guides + P/Q labels for the equilibrium (default true) */
  equilibrium?: boolean;
  /** when shifted, also mark the original equilibrium (default true) */
  showOriginalEq?: boolean;
  /** labelled points for multiple choice, in normalised coords */
  points?: Array<{ label: string; p: number; q: number }>;
  /** horizontal price line — a ceiling, floor or minimum wage */
  priceLine?: { p: number; label?: string };
  /** mark the horizontal gap between the curves at price `p` (shortage / surplus) */
  span?: { p: number; label: string };
  /** near-vertical (price-inelastic) supply, e.g. established housing */
  steepSupply?: boolean;
  /** rename axes, e.g. { x: "Quantity of labour", y: "Wage" } */
  axisLabels?: { x?: string; y?: string };
  /** override the shifted-curve labels, e.g. { supply2: "S + tax" } */
  shiftLabels?: { demand2?: string; supply2?: string };
  caption?: string;
}

export function sd(opts: SDOptions = {}): string {
  const {
    shift,
    equilibrium: showEq = true,
    showOriginalEq = true,
    points,
    priceLine,
    span,
    steepSupply = false,
    axisLabels,
    shiftLabels,
    caption,
  } = opts;

  const sSlope = steepSupply ? 0.15 : 0.7;
  const sInt = steepSupply ? 0.42 : 0.14;
  const sQ = (p: number, shiftAmt = 0) => sInt + sSlope * p + shiftAmt;

  const dShift = shift === "demand-increase" ? SHIFT : shift === "demand-decrease" ? -SHIFT : 0;
  const sShift = shift === "supply-increase" ? SHIFT : shift === "supply-decrease" ? -SHIFT : 0;
  const shifted = dShift !== 0 || sShift !== 0;

  const equilibrium = (dS = 0, sS = 0) => {
    const p = clamp01((0.68 + dS - sS - (sInt - 0.14)) / (0.62 + sSlope));
    return { p, q: clamp01(sInt + sSlope * p + sS) };
  };

  const parts: string[] = [];

  // axes
  parts.push(
    `<line x1="${OX}" y1="${OY}" x2="${OX + PW + 14}" y2="${OY}" stroke="${C.axis}" stroke-width="1.5" marker-end="url(#arw)"/>`,
    `<line x1="${OX}" y1="${OY}" x2="${OX}" y2="${OY - PH - 14}" stroke="${C.axis}" stroke-width="1.5" marker-end="url(#arw)"/>`,
    text(OX + PW + 10, OY + 17, axisLabels?.x ?? "Quantity", { anchor: "end" }),
    text(OX - 14, 11, axisLabels?.y ?? "Price", { anchor: "start" }),
  );

  // original curves
  parts.push(curveLine((p) => dQ(p), C.demand, false));
  parts.push(curveLine((p) => sQ(p), C.supply, false));
  parts.push(text(toX(dQ(0.05)) + 4, toY(0.05) + 4, shifted && dShift ? "D₁" : "D", { bold: true, color: C.demand }));
  parts.push(text(toX(sQ(0.95)) + 4, toY(0.95) + 4, shifted && sShift ? "S₁" : "S", { bold: true, color: C.supply }));

  // shifted curve + arrow
  if (dShift !== 0) {
    parts.push(curveLine((p) => dQ(p, dShift), C.demand, true));
    parts.push(text(toX(dQ(0.05, dShift)) + 4, toY(0.05) + 4, shiftLabels?.demand2 ?? "D₂", { bold: true, color: C.demand }));
    arrow(parts, toX(dQ(0.55)), toY(0.55), dShift > 0 ? 22 : -22);
  }
  if (sShift !== 0) {
    parts.push(curveLine((p) => sQ(p, sShift), C.supply, true));
    parts.push(text(toX(sQ(0.95, sShift)) + 4, toY(0.95) + 4, shiftLabels?.supply2 ?? "S₂", { bold: true, color: C.supply }));
    arrow(parts, toX(sQ(0.5)), toY(0.5), sShift > 0 ? 22 : -22);
  }

  // equilibria
  const drawEq = (p: number, q: number, plabel: string, qlabel: string) => {
    const x = toX(q);
    const y = toY(p);
    parts.push(
      `<line x1="${OX}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C.guide}" stroke-width="1" stroke-dasharray="4 3"/>`,
      `<line x1="${x.toFixed(1)}" y1="${OY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C.guide}" stroke-width="1" stroke-dasharray="4 3"/>`,
      dot(x, y),
      text(OX - 6, y + 4, plabel, { anchor: "end" }),
      text(x, OY + 14, qlabel, { anchor: "middle" }),
    );
  };

  if (showEq && !points) {
    if (shifted) {
      const e0 = equilibrium(0, 0);
      const e1 = equilibrium(dShift, sShift);
      if (showOriginalEq) drawEq(e0.p, e0.q, "P₁", "Q₁");
      drawEq(e1.p, e1.q, "P₂", "Q₂");
    } else {
      const e = equilibrium(0, 0);
      drawEq(e.p, e.q, "Pₑ", "Qₑ");
    }
  }

  // price line (ceiling / floor / minimum wage)
  if (priceLine) {
    const y = toY(priceLine.p);
    parts.push(
      `<line x1="${OX}" y1="${y.toFixed(1)}" x2="${OX + PW}" y2="${y.toFixed(1)}" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="6 3"/>`,
      text(OX - 6, y + 4, priceLine.label ?? "P", { anchor: "end" }),
    );
  }

  // span: the horizontal gap between D and S at a given price (shortage/surplus)
  if (span) {
    const y = toY(span.p);
    const xa = toX(dQ(span.p));
    const xb = toX(sQ(span.p));
    const lo = Math.min(xa, xb);
    const hi = Math.max(xa, xb);
    parts.push(
      `<line x1="${lo.toFixed(1)}" y1="${y.toFixed(1)}" x2="${hi.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C.accent}" stroke-width="3"/>`,
      `<line x1="${lo.toFixed(1)}" y1="${(y - 4).toFixed(1)}" x2="${lo.toFixed(1)}" y2="${(y + 4).toFixed(1)}" stroke="${C.accent}" stroke-width="2"/>`,
      `<line x1="${hi.toFixed(1)}" y1="${(y - 4).toFixed(1)}" x2="${hi.toFixed(1)}" y2="${(y + 4).toFixed(1)}" stroke="${C.accent}" stroke-width="2"/>`,
      text((lo + hi) / 2, y - 8, span.label, { anchor: "middle", color: C.accent, bold: true }),
    );
  }

  // labelled points
  if (points) {
    for (const pt of points) {
      const x = toX(pt.q);
      const y = toY(pt.p);
      parts.push(dot(x, y), text(x + 6, y - 5, pt.label, { bold: true }));
    }
  }

  const captionSvg = caption
    ? `<text x="${VB_W / 2}" y="${VB_H - 4}" fill="${C.text}" font-size="10" font-family="ui-sans-serif, system-ui, sans-serif" text-anchor="middle">${caption}</text>`
    : "";

  return (
    `<svg viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><marker id="arw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
    `<path d="M0 0 L10 5 L0 10 z" fill="${C.axis}"/></marker></defs>` +
    parts.join("") +
    captionSvg +
    `</svg>`
  );
}

// ---- primitives ---------------------------------------------------------

function curveLine(fn: (p: number) => number, stroke: string, dashed: boolean) {
  const x1 = toX(fn(0.05));
  const y1 = toY(0.05);
  const x2 = toX(fn(0.95));
  const y2 = toY(0.95);
  const dash = dashed ? ` stroke-dasharray="6 4"` : "";
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="2"${dash} stroke-linecap="round"/>`;
}

function text(
  x: number,
  y: number,
  s: string,
  opts: { bold?: boolean; anchor?: string; size?: number; color?: string } = {},
) {
  const weight = opts.bold ? ' font-weight="700"' : "";
  const anchor = opts.anchor ? ` text-anchor="${opts.anchor}"` : "";
  const size = opts.size ?? 11;
  const fill = opts.color ?? C.text;
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-family="ui-sans-serif, system-ui, sans-serif"${weight}${anchor}>${s}</text>`;
}

function dot(x: number, y: number) {
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${C.ink}"/>`;
}

function arrow(parts: string[], x: number, y: number, dx: number) {
  parts.push(
    `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + dx).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C.ink}" stroke-width="1.5" marker-end="url(#arw)"/>`,
  );
}

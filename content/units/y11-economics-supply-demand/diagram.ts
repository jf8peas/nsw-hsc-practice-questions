// Pure SVG builders for Year 11 supply & demand diagrams. No dependencies —
// the string is embedded in question data and rendered with dangerouslySetInnerHTML.
//
// Normalised space: price p and quantity q both run 0..1. Linear curves:
//   demand:  q = 0.82 − 0.62·p (+ shift)
//   supply:  q = 0.14 + 0.70·p (+ shift)

const VB_W = 340;
const VB_H = 244;
const OX = 46; // x of the P axis
const OY = 202; // y of the Q axis
const PW = 250; // plot width
const PH = 170; // plot height
const SHIFT = 0.22;

const C = {
  axis: "#475569",
  demand: "#1d4ed8",
  supply: "#c2410c",
  guide: "#94a3b8",
  ink: "#0f172a",
  text: "#334155",
};

const toX = (q: number) => OX + clamp01(q) * PW;
const toY = (p: number) => OY - clamp01(p) * PH;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const dQ = (p: number, shift = 0) => 0.82 - 0.62 * p + shift;
const sQ = (p: number, shift = 0) => 0.14 + 0.7 * p + shift;

/** equilibrium price/quantity for given demand & supply shifts */
function equilibrium(dShift = 0, sShift = 0) {
  const p = (0.68 + dShift - sShift) / 1.32;
  const q = 0.14 + 0.7 * p + sShift;
  return { p: clamp01(p), q: clamp01(q) };
}

function curve(fn: (p: number) => number, stroke: string, dashed: boolean) {
  const x1 = toX(fn(0.05));
  const y1 = toY(0.05);
  const x2 = toX(fn(0.95));
  const y2 = toY(0.95);
  const dash = dashed ? ` stroke-dasharray="6 4"` : "";
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="2"${dash} stroke-linecap="round"/>`;
}

function text(x: number, y: number, s: string, opts: { bold?: boolean; anchor?: string; size?: number } = {}) {
  const weight = opts.bold ? ' font-weight="700"' : "";
  const anchor = opts.anchor ? ` text-anchor="${opts.anchor}"` : "";
  const size = opts.size ?? 11;
  return `<text x="${x}" y="${y}" fill="${C.text}" font-size="${size}" font-family="ui-sans-serif, system-ui, sans-serif"${weight}${anchor}>${s}</text>`;
}

function dot(x: number, y: number) {
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${C.ink}"/>`;
}

export interface SDOptions {
  heading?: string;
  shift?: "demand-increase" | "demand-decrease" | "supply-increase" | "supply-decrease";
  /** dashed guides + P/Q labels for the equilibrium (default true) */
  equilibrium?: boolean;
  /** when shifted, also mark the original equilibrium (default true) */
  showOriginalEq?: boolean;
  /** labelled points for multiple choice, in normalised coords */
  points?: Array<{ label: string; p: number; q: number }>;
  /** horizontal price line (surplus / shortage questions) */
  priceLine?: { p: number; label?: string };
  caption?: string;
}

export function sd(opts: SDOptions = {}): string {
  const {
    shift,
    equilibrium: showEq = true,
    showOriginalEq = true,
    points,
    priceLine,
    heading,
    caption,
  } = opts;

  const dShift = shift === "demand-increase" ? SHIFT : shift === "demand-decrease" ? -SHIFT : 0;
  const sShift = shift === "supply-increase" ? SHIFT : shift === "supply-decrease" ? -SHIFT : 0;
  const shifted = dShift !== 0 || sShift !== 0;

  const parts: string[] = [];

  // axes
  parts.push(
    `<line x1="${OX}" y1="${OY}" x2="${OX + PW + 14}" y2="${OY}" stroke="${C.axis}" stroke-width="1.5" marker-end="url(#arw)"/>`,
    `<line x1="${OX}" y1="${OY}" x2="${OX}" y2="${OY - PH - 14}" stroke="${C.axis}" stroke-width="1.5" marker-end="url(#arw)"/>`,
    text(OX + PW + 10, OY + 17, "Quantity", { anchor: "end" }),
    text(OX - 14, 11, "Price", { anchor: "start" }),
  );

  // original curves
  parts.push(curve((p) => dQ(p), C.demand, false));
  parts.push(curve((p) => sQ(p), C.supply, false));
  parts.push(text(toX(dQ(0.05)) + 4, toY(0.05) + 4, shifted && dShift ? "D₁" : "D", { bold: true }));
  parts.push(text(toX(sQ(0.95)) + 4, toY(0.95) + 4, shifted && sShift ? "S₁" : "S", { bold: true }));

  // shifted curve + arrow
  if (dShift !== 0) {
    parts.push(curve((p) => dQ(p, dShift), C.demand, true));
    parts.push(text(toX(dQ(0.05, dShift)) + 4, toY(0.05) + 4, "D₂", { bold: true }));
    const ax = toX(dQ(0.55));
    const dir = dShift > 0 ? 22 : -22;
    parts.push(`<line x1="${ax}" y1="${toY(0.55)}" x2="${ax + dir}" y2="${toY(0.55)}" stroke="${C.ink}" stroke-width="1.5" marker-end="url(#arw)"/>`);
  }
  if (sShift !== 0) {
    parts.push(curve((p) => sQ(p, sShift), C.supply, true));
    parts.push(text(toX(sQ(0.95, sShift)) + 4, toY(0.95) + 4, "S₂", { bold: true }));
    const ax = toX(sQ(0.5));
    const dir = sShift > 0 ? 22 : -22;
    parts.push(`<line x1="${ax}" y1="${toY(0.5)}" x2="${ax + dir}" y2="${toY(0.5)}" stroke="${C.ink}" stroke-width="1.5" marker-end="url(#arw)"/>`);
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

  // price line
  if (priceLine) {
    const y = toY(priceLine.p);
    parts.push(
      `<line x1="${OX}" y1="${y.toFixed(1)}" x2="${OX + PW}" y2="${y.toFixed(1)}" stroke="${C.ink}" stroke-width="1.25" stroke-dasharray="5 3"/>`,
      text(OX - 6, y + 4, priceLine.label ?? "P", { anchor: "end" }),
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

  const headingSvg = heading ? text(OX, 16, heading, { bold: true, size: 12 }) : "";
  const captionSvg = caption
    ? `<text x="${VB_W / 2}" y="${VB_H - 4}" fill="${C.text}" font-size="10" font-family="ui-sans-serif, system-ui, sans-serif" text-anchor="middle">${caption}</text>`
    : "";

  return (
    `<svg viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><marker id="arw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
    `<path d="M0 0 L10 5 L0 10 z" fill="${C.axis}"/></marker></defs>` +
    headingSvg +
    parts.join("") +
    captionSvg +
    `</svg>`
  );
}

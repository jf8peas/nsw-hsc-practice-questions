// Pure SVG builders for the Year 12 Economics (Topic 1: The Global Economy) diagrams. Every
// diagram is redrawn in code from the source paper (constitution Principle V): no scans or
// copied images. No dependencies: the string is embedded in question data and rendered with
// dangerouslySetInnerHTML. Colours and font follow content/units/y11-economics-supply-demand.

const C = {
  axis: "#475569",
  demand: "#1d4ed8",
  supply: "#c2410c",
  guide: "#94a3b8",
  grid: "#cbd5e1",
  ink: "#0f172a",
  text: "#334155",
};

const FONT = "ui-sans-serif, system-ui, sans-serif";
const CHAR_W = 6.1; // average glyph width at 11 px, for sizing labels and table columns

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function n(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function txt(
  x: number,
  y: number,
  s: string,
  o: { size?: number; anchor?: "start" | "middle" | "end"; bold?: boolean; italic?: boolean; color?: string } = {},
): string {
  const a = o.anchor ? ` text-anchor="${o.anchor}"` : "";
  const b = o.bold ? ' font-weight="700"' : "";
  const i = o.italic ? ' font-style="italic"' : "";
  return `<text x="${n(x)}" y="${n(y)}" fill="${o.color ?? C.text}" font-size="${o.size ?? 11}" font-family="${FONT}"${a}${b}${i}>${esc(s)}</text>`;
}

function ln(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  o: { color?: string; width?: number; dash?: string; arrow?: boolean } = {},
): string {
  const d = o.dash ? ` stroke-dasharray="${o.dash}"` : "";
  const m = o.arrow ? ' marker-end="url(#arw)"' : "";
  return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${o.color ?? C.ink}" stroke-width="${o.width ?? 1.5}" stroke-linecap="round"${d}${m}/>`;
}

function doc(w: number, h: number, inner: string): string {
  return (
    `<svg viewBox="0 0 ${n(w)} ${n(h)}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><marker id="arw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
    `<path d="M0 0 L10 5 L0 10 z" fill="${C.axis}"/></marker></defs>` +
    inner +
    `</svg>`
  );
}

// ---- data table -----------------------------------------------------------------

function wrap(s: string, maxChars: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const w of s.split(" ")) {
    if (cur && (cur + " " + w).length > maxChars) {
      out.push(cur);
      cur = w;
    } else cur = cur ? cur + " " + w : w;
  }
  if (cur) out.push(cur);
  return out;
}

/** A data table drawn as SVG. Column widths fit the text; long cells wrap onto several lines. */
export function dataTable(o: { headers: string[]; rows: string[][] }): string {
  const fs = 10.5;
  const cw = CHAR_W * (fs / 11);
  const maxChars = 26;
  const cols = o.headers.length;
  const all = [o.headers, ...o.rows];
  const cells = all.map((r) => r.map((c) => wrap(c, maxChars)));
  const widths = Array.from({ length: cols }, (_, c) =>
    Math.max(...cells.map((r) => Math.max(...(r[c] ?? [""]).map((l) => l.length)))) * cw + 16,
  );
  const lineH = 13;
  const heights = cells.map((r) => Math.max(...r.map((c) => c.length)) * lineH + 9);
  const W = widths.reduce((s, w) => s + w, 0) + 2;
  const H = heights.reduce((s, h) => s + h, 0) + 2;
  const parts: string[] = [`<rect x="1" y="1" width="${n(W - 2)}" height="${n(H - 2)}" fill="none" stroke="${C.ink}" stroke-width="1"/>`];
  let y = 1;
  cells.forEach((r, ri) => {
    if (ri > 0) parts.push(ln(1, y, W - 1, y, { width: ri === 1 ? 1 : 0.6 }));
    let x = 1;
    r.forEach((lines, ci) => {
      if (ri === 0 && ci > 0) parts.push(ln(x, 1, x, H - 1, { width: 0.6 }));
      const y0 = y + (heights[ri] - lines.length * lineH) / 2 + 10;
      lines.forEach((l, k) =>
        parts.push(txt(x + widths[ci] / 2, y0 + k * lineH, l, { anchor: "middle", size: fs, italic: ri === 0, bold: false })),
      );
      x += widths[ci];
    });
    y += heights[ri];
  });
  return doc(W, H, parts.join(""));
}

// ---- market (demand-and-supply) diagram -----------------------------------------

type Pt = [number, number];
type Tick = number | [number, string];

export interface MarketSpec {
  /** Data ranges drawn along each axis. */
  x: Pt;
  y: Pt;
  xTicks?: Tick[];
  yTicks?: Tick[];
  xLabel?: string;
  yLabel?: string;
  /** Text at the origin, e.g. "0". */
  origin?: string;
  /** Faint grid lines at these data values. */
  grid?: { x?: number[]; y?: number[] };
  /** Straight curves between two data points; the label sits at the `to` end. */
  lines: Array<{ from: Pt; to: Pt; label?: string; kind: "demand" | "supply"; width?: number; labelDx?: number; labelDy?: number }>;
  /** Horizontal lines across the plot, labelled to the left of the price axis. */
  hlines?: Array<{ y: number; label?: string; dashed?: boolean }>;
  /** Dashed guides from a point down to the quantity axis and/or across to the price axis. */
  guides?: Array<{ at: Pt; toX?: boolean; toY?: boolean }>;
  /** Labelled dots. */
  points?: Array<{ at: Pt; label: string; dx?: number; dy?: number; dot?: boolean }>;
  arrows?: Array<{ from: Pt; to: Pt }>;
}

const label = (t: Tick): [number, string] => (typeof t === "number" ? [t, String(t)] : t);

export function market(o: MarketSpec): string {
  const yTicks = (o.yTicks ?? []).map(label);
  const leftChars = Math.max(0, ...yTicks.map(([, s]) => s.length), ...(o.hlines ?? []).map((h) => (h.label ?? "").length));
  const ML = Math.max(40, leftChars * CHAR_W + 16);
  const PW = 270;
  const PH = 180;
  const MT = 30;
  const MR = 44;
  const OY = MT + PH;
  const W = ML + PW + MR;
  const H = OY + 44;
  const X = (v: number) => ML + ((v - o.x[0]) / (o.x[1] - o.x[0])) * PW;
  const Y = (v: number) => OY - ((v - o.y[0]) / (o.y[1] - o.y[0])) * PH;
  const p: string[] = [];

  for (const gx of o.grid?.x ?? []) p.push(ln(X(gx), OY, X(gx), MT, { color: C.grid, width: 0.8, dash: "2 3" }));
  for (const gy of o.grid?.y ?? []) p.push(ln(ML, Y(gy), ML + PW, Y(gy), { color: C.grid, width: 0.8, dash: "2 3" }));

  for (const g of o.guides ?? []) {
    const [gx, gy] = g.at;
    if (g.toX ?? true) p.push(ln(X(gx), Y(gy), X(gx), OY, { color: C.guide, width: 1, dash: "4 3" }));
    if (g.toY ?? true) p.push(ln(X(gx), Y(gy), ML, Y(gy), { color: C.guide, width: 1, dash: "4 3" }));
  }

  for (const h of o.hlines ?? []) {
    p.push(ln(ML, Y(h.y), ML + PW, Y(h.y), { color: C.ink, width: 1.2, dash: h.dashed === false ? undefined : "6 3" }));
    if (h.label) p.push(txt(ML - 6, Y(h.y) + 4, h.label, { anchor: "end", color: C.ink }));
  }

  for (const l of o.lines) {
    const col = l.kind === "demand" ? C.demand : C.supply;
    p.push(ln(X(l.from[0]), Y(l.from[1]), X(l.to[0]), Y(l.to[1]), { color: col, width: l.width ?? 2 }));
    if (l.label) p.push(txt(X(l.to[0]) + (l.labelDx ?? 5), Y(l.to[1]) + (l.labelDy ?? -4), l.label, { bold: true, color: col, size: 12 }));
  }

  for (const a of o.arrows ?? []) p.push(ln(X(a.from[0]), Y(a.from[1]), X(a.to[0]), Y(a.to[1]), { color: C.axis, width: 1.5, arrow: true }));

  for (const pt of o.points ?? []) {
    if (pt.dot ?? true) p.push(`<circle cx="${n(X(pt.at[0]))}" cy="${n(Y(pt.at[1]))}" r="3" fill="${C.ink}"/>`);
    p.push(txt(X(pt.at[0]) + (pt.dx ?? 0), Y(pt.at[1]) + (pt.dy ?? -7), pt.label, { anchor: "middle", bold: true, color: C.ink }));
  }

  // axes last, so they sit on top of guides and grid
  p.push(ln(ML, OY, ML + PW + 12, OY, { color: C.axis, arrow: true }));
  p.push(ln(ML, OY, ML, MT - 12, { color: C.axis, arrow: true }));
  for (const [v, s] of (o.xTicks ?? []).map(label)) {
    p.push(ln(X(v), OY, X(v), OY + 4, { color: C.axis, width: 1 }));
    p.push(txt(X(v), OY + 16, s, { anchor: "middle" }));
  }
  for (const [v, s] of yTicks) {
    p.push(ln(ML - 4, Y(v), ML, Y(v), { color: C.axis, width: 1 }));
    p.push(txt(ML - 7, Y(v) + 4, s, { anchor: "end" }));
  }
  if (o.origin) p.push(txt(ML - 7, OY + 14, o.origin, { anchor: "end" }));
  if (o.yLabel) p.push(txt(ML + 6, MT - 14, o.yLabel, { anchor: "start", color: C.ink }));
  if (o.xLabel) p.push(txt(ML + PW + 14, OY + 34, o.xLabel, { anchor: "end", color: C.ink }));

  return doc(W, H, p.join(""));
}

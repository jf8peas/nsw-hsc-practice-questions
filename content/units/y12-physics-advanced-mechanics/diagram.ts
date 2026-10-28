// Pure SVG builders for the Module 5 (Advanced Mechanics) diagrams. Every diagram in this unit
// is redrawn in code from the source paper (constitution Principle V): no scans or copied images.
// No dependencies — the string is embedded in question data and rendered with
// dangerouslySetInnerHTML.

const C = {
  axis: "#475569",
  ink: "#0f172a",
  a: "#1d4ed8",
  b: "#c2410c",
  c: "#15803d",
  guide: "#94a3b8",
  grid: "#e2e8f0",
  text: "#334155",
  star: "#f59e0b",
};

const FONT = "ui-sans-serif, system-ui, sans-serif";

type TxtOpts = { bold?: boolean; italic?: boolean; anchor?: "start" | "middle" | "end"; size?: number; color?: string };

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function txt(x: number, y: number, s: string, o: TxtOpts = {}): string {
  const w = o.bold ? ' font-weight="700"' : "";
  const i = o.italic ? ' font-style="italic"' : "";
  const a = o.anchor ? ` text-anchor="${o.anchor}"` : "";
  return `<text x="${f(x)}" y="${f(y)}" fill="${o.color ?? C.text}" font-size="${o.size ?? 11}" font-family="${FONT}"${w}${i}${a}>${esc(s)}</text>`;
}

function f(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function line(x1: number, y1: number, x2: number, y2: number, o: { color?: string; width?: number; dash?: string; head?: "end" | "both" } = {}): string {
  const d = o.dash ? ` stroke-dasharray="${o.dash}"` : "";
  const m = o.head === "end" ? ' marker-end="url(#ah)"' : o.head === "both" ? ' marker-start="url(#ah)" marker-end="url(#ah)"' : "";
  return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${o.color ?? C.ink}" stroke-width="${o.width ?? 1.5}"${d}${m}/>`;
}

function svg(w: number, h: number, inner: string): string {
  return (
    `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
    `<path d="M0 0 L10 5 L0 10 z" fill="${C.ink}"/></marker></defs>` +
    inner +
    `</svg>`
  );
}

// ---- elliptical orbit ------------------------------------------------------

export interface OrbitPoint {
  /** Eccentric-anomaly angle on the ellipse in degrees: 0 = right end, 90 = top. */
  at: number;
  label?: string;
  labelDx?: number;
  labelDy?: number;
  /** "dot" = small filled body (planet, satellite, moon); "mark" = small point. */
  kind?: "dot" | "mark";
  color?: string;
}

/**
 * An elliptical orbit with the central body at the left focus (or at `centralX` if given).
 * `arrows` are short direction arrows drawn just outside the orbit at the given angles.
 * `radials` draw a two-headed line from the central body to a point, with a label.
 */
export function ellipseOrbit(o: {
  a?: number;
  b?: number;
  dashed?: boolean;
  central: { label: string; kind: "star" | "planet"; r?: number; labelDx?: number; labelDy?: number };
  /** Horizontal position of the central body as a fraction of the semi-major axis from the
   *  centre (negative = left). Defaults to the left focus. Use it when the source draws a
   *  nearly circular orbit squashed for space, so the body is not drawn at the true focus. */
  centralAt?: number;
  points?: OrbitPoint[];
  arrows?: Array<{ at: number; dir: "ccw" | "cw"; color?: string }>;
  radials?: Array<{ at: number; label: string }>;
  width?: number;
  height?: number;
}): string {
  const W = o.width ?? 340;
  const H = o.height ?? 200;
  const a = o.a ?? 140;
  const b = o.b ?? 70;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const c = Math.sqrt(Math.max(0, a * a - b * b));
  const fx = o.centralAt !== undefined ? cx + o.centralAt * a : cx - c;
  const P = (t: number, k = 1) => {
    const r = (t * Math.PI) / 180;
    return [cx + k * a * Math.cos(r), cy - k * b * Math.sin(r)] as const;
  };
  const parts: string[] = [];
  parts.push(
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${a}" ry="${b}" fill="none" stroke="${C.ink}" stroke-width="1.4"${o.dashed ? ' stroke-dasharray="5 4"' : ""}/>`,
  );
  const cr = o.central.r ?? (o.central.kind === "star" ? 13 : 16);
  if (o.central.kind === "star") {
    parts.push(`<circle cx="${f(fx)}" cy="${f(cy)}" r="${cr}" fill="${C.star}"/>`);
  } else {
    parts.push(`<circle cx="${f(fx)}" cy="${f(cy)}" r="${cr}" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>`);
  }
  for (const r of o.radials ?? []) {
    const [px, py] = P(r.at);
    const dir = Math.sign(px - fx) || 1;
    parts.push(line(fx + dir * (cr + 2), cy, px - dir * 4, py, { head: "both", width: 1.1 }));
    parts.push(txt((fx + px) / 2, py - 5, r.label, { anchor: "middle", size: 10 }));
  }
  parts.push(
    txt(fx + (o.central.labelDx ?? 0), cy + (o.central.labelDy ?? (o.central.kind === "star" ? cr + 13 : 4)), o.central.label, {
      anchor: "middle",
      size: 10,
    }),
  );
  for (const p of o.points ?? []) {
    const [px, py] = P(p.at);
    const r = p.kind === "mark" ? 2.8 : 5;
    parts.push(`<circle cx="${f(px)}" cy="${f(py)}" r="${r}" fill="${p.color ?? (p.kind === "mark" ? C.ink : C.a)}"/>`);
    if (p.label) parts.push(txt(px + (p.labelDx ?? 8), py + (p.labelDy ?? -8), p.label, { size: 10 }));
  }
  for (const ar of o.arrows ?? []) {
    const d = ar.dir === "ccw" ? 1 : -1;
    const [x1, y1] = P(ar.at - d * 9, 1.12);
    const [x2, y2] = P(ar.at + d * 9, 1.12);
    parts.push(line(x1, y1, x2, y2, { color: ar.color ?? C.b, width: 1.6, head: "end" }));
  }
  return svg(W, H, parts.join(""));
}

// ---- energy against altitude (Barker 2020 Q8) ---------------------------------

/**
 * Gravitational potential energy of a satellite against altitude, plotted from
 * U = −GMm/(R + h), with altitude along the top edge and U downward, as in the source.
 */
export function potentialEnergyAltitudeGraph(o: { gmm: number; earthRadius: number; hMaxKm: number; uMinE9: number }): string {
  const W = 340;
  const H = 250;
  const L = 58;
  const T = 34;
  const PW = 250;
  const PH = 190;
  const X = (km: number) => L + (km / o.hMaxKm) * PW;
  const Y = (u9: number) => T + (u9 / o.uMinE9) * PH; // u9 negative: 0 at top, uMin at bottom
  const parts: string[] = [];
  // grid: minor every 1000 km and 0.2 units, major every 5000 km and 1 unit
  for (let km = 0; km <= o.hMaxKm; km += 1000) {
    const major = km % 5000 === 0;
    parts.push(line(X(km), T, X(km), T + PH, { color: major ? C.guide : C.grid, width: major ? 0.8 : 0.5 }));
  }
  for (let k = 0; k <= Math.round(-o.uMinE9 * 5); k++) {
    const u = -k / 5;
    const major = k % 5 === 0;
    parts.push(line(L, Y(u), L + PW, Y(u), { color: major ? C.guide : C.grid, width: major ? 0.8 : 0.5 }));
  }
  parts.push(`<rect x="${L}" y="${T}" width="${PW}" height="${PH}" fill="none" stroke="${C.axis}" stroke-width="1"/>`);
  for (let km = 0; km <= o.hMaxKm; km += 5000) {
    parts.push(txt(X(km), T - 6, km === 0 ? "0" : km.toLocaleString("en-AU"), { anchor: "middle", size: 9 }));
  }
  parts.push(txt(L + PW / 2, 12, "Altitude (km)", { anchor: "middle", size: 10 }));
  for (let u = 0; u >= o.uMinE9; u--) {
    parts.push(txt(L - 6, Y(u) + 3, u === 0 ? "0" : `−${-u}`, { anchor: "end", size: 9 }));
  }
  parts.push(
    `<text x="14" y="${T + PH / 2}" fill="${C.text}" font-size="10" font-family="${FONT}" text-anchor="middle" transform="rotate(-90 14 ${T + PH / 2})">U (or Eₚ) (10⁹ J)</text>`,
  );
  const pts: string[] = [];
  for (let km = 0; km <= o.hMaxKm; km += 250) {
    const u9 = -o.gmm / (o.earthRadius + km * 1000) / 1e9;
    pts.push(`${f(X(km))},${f(Y(u9))}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);
  return svg(W, H, parts.join(""));
}

// ---- satellite path panels (Baulkham Hills 2022 Q7) ----------------------------

export type OrbitPathKind = "tangent" | "outward" | "inward" | "radial-in";

/**
 * Four labelled panels, each showing Earth, a dashed circular orbit, the satellite at X on the
 * right, and one possible path after gravity is removed.
 */
export function orbitPathPanels(panels: Array<{ label: string; path: OrbitPathKind; caption?: string }>): string {
  const PW = 170;
  const PHt = 130;
  const W = PW * 2;
  const H = PHt * Math.ceil(panels.length / 2);
  const parts: string[] = [];
  panels.forEach((p, i) => {
    const ox = (i % 2) * PW;
    const oy = Math.floor(i / 2) * PHt;
    const cx = ox + 78;
    const cy = oy + 62;
    const R = 40;
    const xx = cx + R;
    parts.push(txt(ox + 8, oy + 14, p.label, { size: 10 }));
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="3 3"/>`);
    parts.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="#fff" stroke="${C.ink}" stroke-width="1"/>`);
    parts.push(txt(cx, cy - 12, "Earth", { anchor: "middle", size: 9 }));
    parts.push(`<circle cx="${xx}" cy="${cy}" r="3" fill="${C.ink}"/>`);
    parts.push(txt(xx + 7, cy + 4, "X", { size: 10, bold: true }));
    if (p.path === "tangent") parts.push(line(xx, cy - 4, xx, cy - 48, { head: "end", width: 1.4 }));
    if (p.path === "outward")
      parts.push(`<path d="M ${xx} ${cy - 4} Q ${xx + 2} ${cy - 30} ${xx + 22} ${cy - 48}" fill="none" stroke="${C.ink}" stroke-width="1.4" marker-end="url(#ah)"/>`);
    if (p.path === "inward")
      parts.push(`<path d="M ${xx} ${cy - 4} Q ${xx - 2} ${cy - 22} ${xx - 18} ${cy - 34}" fill="none" stroke="${C.ink}" stroke-width="1.4" marker-end="url(#ah)"/>`);
    if (p.path === "radial-in") parts.push(line(xx - 4, cy, cx + 10, cy, { head: "end", width: 1.4 }));
    if (p.caption) parts.push(txt(cx, oy + PHt - 10, p.caption, { anchor: "middle", size: 9 }));
  });
  return svg(W, H, parts.join(""));
}

// ---- data table ---------------------------------------------------------------

/** A small data table drawn as SVG, so it keeps its layout inside the plain-text prompt. */
export function dataTable(o: { headers: string[]; rows: string[][]; colWidths?: number[]; italicHeaders?: boolean }): string {
  const widths = o.colWidths ?? o.headers.map(() => 110);
  const W = widths.reduce((s, w) => s + w, 0) + 2;
  const RH = 22;
  const H = RH * (o.rows.length + 1) + 2;
  const parts: string[] = [];
  let x = 1;
  const xs = widths.map((w) => {
    const s = x;
    x += w;
    return s;
  });
  parts.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="${C.ink}" stroke-width="1"/>`);
  for (let r = 1; r <= o.rows.length; r++) parts.push(line(1, 1 + r * RH, W - 1, 1 + r * RH, { width: 0.8 }));
  for (let c = 1; c < widths.length; c++) parts.push(line(xs[c], 1, xs[c], H - 1, { width: 0.8 }));
  o.headers.forEach((h, c) => parts.push(txt(xs[c] + widths[c] / 2, 1 + RH / 2 + 4, h, { anchor: "middle", size: 10.5, italic: o.italicHeaders ?? true })));
  o.rows.forEach((row, r) =>
    row.forEach((cell, c) => parts.push(txt(xs[c] + widths[c] / 2, 1 + (r + 1) * RH + RH / 2 + 4, cell, { anchor: "middle", size: 10.5 }))),
  );
  return svg(W, H, parts.join(""));
}

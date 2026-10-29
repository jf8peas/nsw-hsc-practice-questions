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

/** Text with a subscript, e.g. r_A. */
function subTxt(x: number, y: number, base: string, sub: string, o: { size?: number; anchor?: "start" | "middle" | "end"; italic?: boolean } = {}): string {
  const a = o.anchor ? ` text-anchor="${o.anchor}"` : "";
  const i = o.italic ? ' font-style="italic"' : "";
  const size = o.size ?? 11;
  return `<text x="${f(x)}" y="${f(y)}" fill="${C.text}" font-size="${size}" font-family="${FONT}"${a}${i}>${esc(base)}<tspan font-size="${f(size * 0.72)}" dy="3">${esc(sub)}</tspan></text>`;
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
export function dataTable(o: { headers: string[]; rows: string[][]; colWidths?: number[]; italicHeaders?: boolean; fontSize?: number }): string {
  const widths = o.colWidths ?? o.headers.map(() => 110);
  const W = widths.reduce((s, w) => s + w, 0) + 2;
  const RH = 22;
  const fs = o.fontSize ?? 10.5;
  const hLines = Math.max(...o.headers.map((h) => h.split("\n").length));
  const HH = RH + (hLines - 1) * 13;
  const H = HH + RH * o.rows.length + 2;
  const parts: string[] = [];
  let x = 1;
  const xs = widths.map((w) => {
    const s = x;
    x += w;
    return s;
  });
  parts.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="${C.ink}" stroke-width="1"/>`);
  for (let r = 0; r < o.rows.length; r++) parts.push(line(1, 1 + HH + r * RH, W - 1, 1 + HH + r * RH, { width: 0.8 }));
  for (let c = 1; c < widths.length; c++) parts.push(line(xs[c], 1, xs[c], H - 1, { width: 0.8 }));
  o.headers.forEach((h, c) => {
    const ls = h.split("\n");
    const y0 = 1 + HH / 2 + 4 - ((ls.length - 1) * 13) / 2;
    ls.forEach((l, k) => parts.push(txt(xs[c] + widths[c] / 2, y0 + k * 13, l, { anchor: "middle", size: fs, italic: o.italicHeaders ?? true })));
  });
  o.rows.forEach((row, r) =>
    row.forEach((cell, c) => parts.push(txt(xs[c] + widths[c] / 2, 1 + HH + r * RH + RH / 2 + 4, cell, { anchor: "middle", size: fs }))),
  );
  return svg(W, H, parts.join(""));
}

// ---- shared helpers for batch 2 ------------------------------------------------

/** Lay several SVG strings side by side (or stacked) inside one SVG. */
export function stack(items: string[], o: { dir?: "row" | "column"; gap?: number; align?: "start" | "center" } = {}): string {
  const gap = o.gap ?? 16;
  const dims = items.map((s) => {
    const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(s);
    return m ? [Number(m[1]), Number(m[2])] : [100, 100];
  });
  const row = (o.dir ?? "row") === "row";
  const W = row ? dims.reduce((t, d) => t + d[0], 0) + gap * (items.length - 1) : Math.max(...dims.map((d) => d[0]));
  const H = row ? Math.max(...dims.map((d) => d[1])) : dims.reduce((t, d) => t + d[1], 0) + gap * (items.length - 1);
  let pos = 0;
  const inner = items
    .map((s, i) => {
      const [w, h] = dims[i];
      const x = row ? pos : (o.align ?? "center") === "center" ? (W - w) / 2 : 0;
      const y = row ? ((o.align ?? "center") === "center" ? (H - h) / 2 : 0) : pos;
      pos += (row ? w : h) + gap;
      return s.replace("<svg ", `<svg x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" `);
    })
    .join("");
  return svg(W, H, inner);
}

function planet(cx: number, cy: number, r: number, label?: string, labelSize = 10): string {
  return (
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${r}" fill="#dbeafe" stroke="${C.ink}" stroke-width="1.1"/>` +
    (label ? txt(cx, cy + 3.5, label, { anchor: "middle", size: labelSize }) : "")
  );
}

function dot(x: number, y: number, r = 4, color: string = C.a): string {
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${color}"/>`;
}

const rad = (d: number) => (d * Math.PI) / 180;

// ---- concentric circular orbits (Hornsby Girls 2021 Q2, Knox 2023 Q20) ---------

export function concentricOrbits(o: {
  radii: number[];
  dashed?: boolean;
  central: { label: string; r?: number };
  bodies: Array<{ orbit: number; at: number; label: string; labelDx?: number; labelDy?: number }>;
  radials?: Array<{ orbit: number; at: number; label: string; labelDx?: number; labelDy?: number; labelAt?: number }>;
  size?: number;
  /** Extra width on the right for a note such as "NOT TO SCALE". */
  note?: string;
  centralLabelInside?: boolean;
}): string {
  const S = o.size ?? 250;
  const below = !!o.note && o.note.length > 14;
  const extra = o.note && !below ? 150 : 0;
  const cx = S / 2;
  const cy = S / 2;
  const parts: string[] = [];
  for (const r of o.radii)
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="1.2"${o.dashed ? ' stroke-dasharray="5 4"' : ""}/>`);
  const cr = o.central.r ?? 18;
  parts.push(planet(cx, cy, cr, o.central.label, 9));
  for (const rl of o.radials ?? []) {
    const R = o.radii[rl.orbit];
    const ex = cx + R * Math.cos(rad(rl.at));
    const ey = cy - R * Math.sin(rad(rl.at));
    parts.push(line(cx + (cr + 2) * Math.cos(rad(rl.at)), cy - (cr + 2) * Math.sin(rad(rl.at)), ex, ey, { head: "end", width: 1.1 }));
    const k = rl.labelAt ?? 0.62;
    const mx = cx + R * k * Math.cos(rad(rl.at));
    const my = cy - R * k * Math.sin(rad(rl.at));
    parts.push(txt(mx + (rl.labelDx ?? 0), my + (rl.labelDy ?? -6), rl.label, { anchor: "middle", italic: true, size: 12 }));
  }
  for (const b of o.bodies) {
    const R = o.radii[b.orbit];
    const x = cx + R * Math.cos(rad(b.at));
    const y = cy - R * Math.sin(rad(b.at));
    parts.push(dot(x, y, 5));
    parts.push(txt(x + (b.labelDx ?? 8), y + (b.labelDy ?? -8), b.label, { size: 12, bold: true }));
  }
  if (o.note && !below) parts.push(txt(S + 44, cy + 4, o.note, { size: 11, bold: true }));
  if (below) parts.push(txt(S / 2, S + 14, o.note!, { size: 11, anchor: "middle" }));
  return svg(S + extra, S + (below ? 22 : 0), parts.join(""));
}

// ---- velocity vectors on two orbits (James Ruse 2021 Q14) ----------------------

export function velocityVectorFigures(): string {
  const parts: string[] = [];
  // Figure 1: elliptical orbit, Earth near the left focus.
  const ex = 130, ey = 92, a = 110, b = 48;
  parts.push(`<ellipse cx="${ex}" cy="${ey}" rx="${a}" ry="${b}" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-dasharray="3 3"/>`);
  parts.push(`<circle cx="${ex - 62}" cy="${ey}" r="7" fill="${C.guide}"/>`);
  parts.push(txt(ex - 50, ey + 4, "Earth", { size: 11 }));
  const xx = ex + a * Math.cos(1.9), xy = ey - b * Math.sin(1.9); // X on the upper edge
  parts.push(dot(xx, xy, 3.5, C.ink));
  parts.push(line(xx - 2, xy, xx - 40, xy, { head: "end", width: 1.4 }));
  parts.push(txt(xx, xy - 10, "X", { anchor: "middle", size: 12 }));
  parts.push(dot(ex - a, ey, 3.5, C.ink));
  parts.push(line(ex - a, ey + 2, ex - a, ey + 58, { head: "end", width: 1.4 }));
  parts.push(txt(ex - a - 8, ey + 4, "Y", { anchor: "end", size: 12 }));
  parts.push(txt(ex, 190, "Figure 1: Satellite A", { anchor: "middle", size: 11 }));
  // Figure 2: circular orbit.
  const cx = 330, cy = 92, R = 70;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-dasharray="3 3"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="${C.guide}"/>`);
  parts.push(txt(cx + 12, cy + 4, "Earth", { size: 11 }));
  parts.push(dot(cx, cy - R, 3.5, C.ink));
  parts.push(line(cx - 2, cy - R, cx - 46, cy - R, { head: "end", width: 1.4 }));
  parts.push(txt(cx, cy - R - 8, "P", { anchor: "middle", size: 12 }));
  parts.push(dot(cx - R, cy, 3.5, C.ink));
  parts.push(line(cx - R, cy + 2, cx - R, cy + 50, { head: "end", width: 1.4 }));
  parts.push(txt(cx - R - 8, cy + 4, "Q", { anchor: "end", size: 12 }));
  parts.push(txt(cx, 190, "Figure 2: Satellite B", { anchor: "middle", size: 11 }));
  return svg(420, 200, parts.join(""));
}

// ---- orbit change panels with a key (James Ruse 2022 Q6) -----------------------

export type OrbitChange = "inner-ellipse" | "outer-ellipse" | "outer-circle" | "inner-circle";

export function orbitChangePanels(panels: Array<{ label: string; final: OrbitChange }>): string {
  const PW = 150, PH = 150, R = 48;
  const parts: string[] = [];
  panels.forEach((p, i) => {
    const ox = (i % 2) * PW, oy = Math.floor(i / 2) * PH;
    const cx = ox + 82, cy = oy + 80;
    parts.push(txt(ox + 8, oy + 16, p.label, { size: 11 }));
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);
    const d = ' fill="none" stroke="' + C.b + '" stroke-width="1.4" stroke-dasharray="3 3"';
    if (p.final === "inner-ellipse") {
      const a = 38, c = R - a; // apogee at X (left), focus at the body
      parts.push(`<ellipse cx="${cx - c}" cy="${cy}" rx="${a}" ry="${f(Math.sqrt(a * a - c * c))}"${d}/>`);
    } else if (p.final === "outer-ellipse") {
      const a = 64, c = a - R; // perigee at X (left), focus at the body
      parts.push(`<ellipse cx="${cx + c}" cy="${cy}" rx="${a}" ry="${f(Math.sqrt(a * a - c * c))}"${d}/>`);
    } else if (p.final === "outer-circle") {
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${R + 10}"${d}/>`);
    } else {
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${R - 10}"${d}/>`);
    }
    parts.push(dot(cx, cy, 4, C.ink));
    parts.push(txt(cx - R, cy + 4.5, "X", { anchor: "middle", size: 13, bold: true }));
  });
  const kx = PW * 2 + 26;
  parts.push(`<rect x="${kx}" y="10" width="112" height="62" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(txt(kx + 56, 26, "Key", { anchor: "middle", size: 11 }));
  parts.push(line(kx + 8, 42, kx + 30, 42, { width: 1.4 }));
  parts.push(txt(kx + 36, 46, "Original orbit", { size: 10 }));
  parts.push(line(kx + 8, 60, kx + 30, 60, { width: 1.4, color: C.b, dash: "3 3" }));
  parts.push(txt(kx + 36, 64, "Final orbit", { size: 10 }));
  return svg(kx + 118, PH * Math.ceil(panels.length / 2), parts.join(""));
}

// ---- field strength against distance (James Ruse 2022 Q13) ---------------------

export function fieldStrengthGraph(o: { gm: number; rMin: number; rMax: number; gMax: number; ticks?: number; xLabel?: string; yLabel?: string }): string {
  const NT = o.ticks ?? 5;
  const L = 44, T = 22, PW = 300, PH = 200;
  const X = (r: number) => L + (r / o.rMax) * PW;
  const Y = (g: number) => T + PH - (g / o.gMax) * PH;
  const parts: string[] = [];
  for (let k = 0; k <= NT * 4; k++) {
    const r = (k * o.rMax) / (NT * 4);
    parts.push(line(X(r), T, X(r), T + PH, { color: k % 4 === 0 ? C.guide : C.grid, width: k % 4 === 0 ? 0.8 : 0.5 }));
  }
  for (let k = 0; k <= o.gMax * 2; k++) {
    const g = k / 2;
    parts.push(line(L, Y(g), L + PW, Y(g), { color: k % 4 === 0 ? C.guide : C.grid, width: k % 4 === 0 ? 0.8 : 0.5 }));
  }
  parts.push(line(L, T, L, T + PH, { color: C.axis, width: 1 }));
  parts.push(line(L, T + PH, L + PW, T + PH, { color: C.axis, width: 1 }));
  for (let g = 0; g <= o.gMax; g += 2) parts.push(txt(L - 6, Y(g) + 3.5, String(g), { anchor: "end", size: 9.5 }));
  const sup = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
  for (let k = 1; k <= NT; k++) {
    const r = (k * o.rMax) / NT;
    const e = Math.floor(Math.log10(r));
    const m = +(r / 10 ** e).toFixed(1);
    const label = `${m}×10${String(e).split("").map((d) => sup[Number(d)]).join("")}`;
    parts.push(txt(X(r), T + PH + 13, label, { anchor: "middle", size: 9.5 }));
  }
  parts.push(txt(L - 4, T - 8, o.yLabel ?? "g (m s⁻²)", { size: 10, italic: !o.yLabel }));
  parts.push(txt(L + PW / 2, T + PH + 30, o.xLabel ?? "r (m)", { anchor: "middle", size: 10.5, italic: !o.xLabel }));
  const pts: string[] = [];
  for (let r = o.rMin; r <= o.rMax + 1; r += o.rMax / 200) pts.push(`${f(X(r))},${f(Y(o.gm / (r * r)))}`);
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.c}" stroke-width="2"/>`);
  return svg(L + PW + 16, T + PH + 38, parts.join(""));
}

// ---- acceleration-arrow panels on an elliptical orbit (Kinross Wolaroi 2022 Q2) ----

export type ArrowAim = "centre" | "above-centre" | "below-centre" | "tangent";

export function accelerationArrowPanels(panels: Array<{ label: string; aim: ArrowAim }>): string {
  const PW = 190, PH = 170;
  const parts: string[] = [];
  const a = 70, b = 58, th = rad(60); // ellipse tilted so its long axis runs up and to the right
  const c = Math.sqrt(a * a - b * b);
  panels.forEach((p, i) => {
    const ox = (i % 2) * PW, oy = Math.floor(i / 2) * PH;
    const ecx = ox + 100, ecy = oy + 88;
    // screen coordinates: rotate (x, y) by th, y up
    const P = (x: number, y: number) => [ecx + x * Math.cos(th) - y * Math.sin(th), ecy - (x * Math.sin(th) + y * Math.cos(th))] as const;
    parts.push(txt(ox + 8, oy + 16, p.label, { size: 11 }));
    parts.push(
      `<ellipse cx="${f(ecx)}" cy="${f(ecy)}" rx="${a}" ry="${b}" transform="rotate(${f(-60)} ${f(ecx)} ${f(ecy)})" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-dasharray="4 3"/>`,
    );
    const [fx, fy] = P(-c, 0);
    parts.push(planet(fx, fy, 28, "Earth", 9));
    const t = rad(-62);
    const [sx, sy] = P(a * Math.cos(t), b * Math.sin(t));
    parts.push(dot(sx, sy, 4.5, C.ink));
    let dx = fx - sx, dy = fy - sy;
    const L0 = Math.hypot(dx, dy);
    dx /= L0;
    dy /= L0;
    const rot = (ang: number) => {
      const r = rad(ang);
      return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r)] as const;
    };
    let v: readonly [number, number] = [dx, dy];
    if (p.aim === "above-centre") v = rot(28);
    if (p.aim === "below-centre") v = rot(-16);
    if (p.aim === "tangent") {
      const [tx0, ty0] = P(-a * Math.sin(t), b * Math.cos(t));
      let tx = tx0 - ecx, ty = ty0 - ecy;
      const tl = Math.hypot(tx, ty);
      tx /= tl;
      ty /= tl;
      if (ty < 0) { tx = -tx; ty = -ty; } // point "downwards" along the orbit, as in the source
      v = [tx, ty];
    }
    const len = p.aim === "centre" || p.aim === "below-centre" ? 34 : 38;
    parts.push(line(sx + v[0] * 5, sy + v[1] * 5, sx + v[0] * len, sy + v[1] * len, { head: "end", width: 1.4 }));
  });
  return svg(PW * 2, PH * Math.ceil(panels.length / 2), parts.join(""));
}

// ---- Halley's comet orbit (Kinross Wolaroi 2022 Q6) -----------------------------

export function halleyOrbit(): string {
  const parts: string[] = [];
  const cx = 230, cy = 120, a = 190, b = 34;
  const sunX = 70, sunY = cy;
  // Earth's orbit (dashed circle about the Sun) and part of Neptune's orbit
  parts.push(`<circle cx="${sunX}" cy="${sunY}" r="70" fill="none" stroke="${C.guide}" stroke-width="1" stroke-dasharray="3 3"/>`);
  parts.push(txt(36, 42, "Earth’s Orbit", { size: 10, italic: true }));
  parts.push(`<path d="M 395 10 Q 470 120 395 230" fill="none" stroke="${C.guide}" stroke-width="1" stroke-dasharray="3 3"/>`);
  parts.push(txt(330, 22, "Neptune’s Orbit", { size: 10, italic: true }));
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" fill="none" stroke="${C.ink}" stroke-width="1.3"/>`);
  parts.push(`<circle cx="${sunX}" cy="${sunY}" r="8" fill="${C.ink}"/>`);
  parts.push(txt(sunX + 13, sunY + 4, "Sun", { size: 10, italic: true }));
  const P = (deg: number) => [cx + a * Math.cos(rad(deg)), cy - b * Math.sin(rad(deg))] as const;
  const pts: Array<[number, string, number, number]> = [
    [118, "A", -2, -10],
    [12, "B", 6, -8],
    [-62, "C", -2, 16],
    [-148, "D", -10, 16],
  ];
  for (const [deg, l, dx, dy] of pts) {
    const [x, y] = P(deg);
    parts.push(dot(x, y, 3.2, C.ink));
    parts.push(txt(x + dx, y + dy, l, { size: 12, italic: true, anchor: "middle" }));
  }
  // direction of travel: rightwards along the top, leftwards along the bottom
  const [t1x, t1y] = P(78);
  parts.push(`<path d="M ${f(t1x - 6)} ${f(t1y - 4)} l 10 4 l -10 4 z" fill="${C.ink}"/>`);
  const [b1x, b1y] = P(-112);
  parts.push(`<path d="M ${f(b1x + 6)} ${f(b1y - 4)} l -10 4 l 10 4 z" fill="${C.ink}"/>`);
  parts.push(txt(b1x, b1y + 16, "v", { size: 11, italic: true, anchor: "middle" }));
  const [cpx, cpy] = P(-80);
  parts.push(line(cpx - 20, cpy + 3, cpx, cpy + 30, { width: 0.8 }));
  parts.push(txt(cpx + 4, cpy + 42, "comet orbital path", { size: 10, italic: true }));
  return svg(470, 240, parts.join(""));
}

// ---- energy dot graphs (Knox 2020 Q15) ------------------------------------------

export function energyDotGraph(o: {
  yMin: number;
  yMax: number;
  series: Array<{ values: number[]; color: "dark" | "light" }>;
  label?: string;
  width?: number;
}): string {
  const W = o.width ?? 230;
  const L = 34, T = o.label ? 24 : 10, PW = W - L - 8, PH = 150;
  const n = Math.max(...o.series.map((s) => s.values.length));
  const X = (i: number) => L + (i / n) * PW;
  const Y = (v: number) => T + ((o.yMax - v) / (o.yMax - o.yMin)) * PH;
  const parts: string[] = [];
  if (o.label) parts.push(txt(4, 14, o.label, { size: 11 }));
  for (let v = o.yMin; v <= o.yMax; v += 2) {
    parts.push(line(L, Y(v), L + PW, Y(v), { color: C.grid, width: 0.6 }));
    parts.push(txt(L - 5, Y(v) + 3.5, v < 0 ? `−${-v}` : String(v), { anchor: "end", size: 9 }));
  }
  for (let i = 1; i <= n; i++) parts.push(line(X(i), T, X(i), T + PH, { color: C.grid, width: 0.6 }));
  parts.push(line(L, T, L, T + PH, { color: C.axis, width: 1 }));
  for (const s of o.series) {
    const col = s.color === "dark" ? C.ink : "#94a3b8";
    s.values.forEach((v, i) => parts.push(dot(i === 0 ? L : X(i) - PW / n / 4, Y(v), 3.6, col)));
  }
  return svg(W, T + PH + 8, parts.join(""));
}

// ---- GEO and LEO satellites (Knox 2025 Q1) ---------------------------------------

export function geoLeoCoverage(): string {
  const parts: string[] = [];
  const ex = 250, ey = 82, R = 52;
  const gx = 50, gy = 82;
  // tangent lines from the GEO satellite to Earth
  const d = ex - gx;
  const alpha = Math.asin(R / d);
  const tl = Math.sqrt(d * d - R * R);
  for (const s of [1, -1]) {
    const tx = gx + tl * Math.cos(alpha) , ty = gy - s * tl * Math.sin(alpha);
    parts.push(line(gx + 8, gy, tx, ty, { color: C.guide, width: 2 }));
  }
  parts.push(planet(ex, ey, R));
  // LEO satellite close to the surface with a narrow footprint
  const la = rad(-42);
  const lx = ex + (R + 22) * Math.cos(la), ly = ey - (R + 22) * Math.sin(la);
  const p1 = rad(-30), p2 = rad(-54);
  parts.push(line(lx, ly, ex + R * Math.cos(p1), ey - R * Math.sin(p1), { color: C.guide, width: 2 }));
  parts.push(line(lx, ly, ex + R * Math.cos(p2), ey - R * Math.sin(p2), { color: C.guide, width: 2 }));
  parts.push(`<rect x="${gx - 6}" y="${gy - 18}" width="12" height="36" fill="${C.ink}"/>`);
  parts.push(`<rect x="${gx + 6}" y="${gy - 5}" width="8" height="10" fill="${C.ink}"/>`);
  parts.push(txt(gx, gy + 36, "GEO", { anchor: "middle", size: 11 }));
  parts.push(txt(gx, gy + 50, "Satellite", { anchor: "middle", size: 11 }));
  parts.push(`<rect x="${f(lx - 4)}" y="${f(ly - 8)}" width="8" height="16" fill="${C.ink}" transform="rotate(42 ${f(lx)} ${f(ly)})"/>`);
  parts.push(txt(lx + 10, ly + 20, "LEO", { size: 11 }));
  parts.push(txt(lx + 10, ly + 34, "Satellite", { size: 11 }));
  return svg(360, 175, parts.join(""));
}

// ---- spacecraft path X to Y near Earth (Normanhurst Boys 2021 Q2) ----------------

export function wavyPathNearEarth(): string {
  const parts: string[] = [];
  parts.push(planet(170, 150, 50, "Earth", 11));
  parts.push(
    `<path d="M 62 112 C 70 80, 80 70, 100 72 S 130 92, 140 62 S 150 18, 170 20 S 240 50, 290 62 S 318 70, 289 36" fill="none" stroke="${C.ink}" stroke-width="1.3" stroke-dasharray="5 3" marker-end="url(#ah)"/>`,
  );
  parts.push(dot(62, 112, 4.5, C.ink));
  parts.push(txt(50, 108, "X", { size: 12, bold: true, anchor: "end" }));
  parts.push(dot(285, 30, 4.5, C.ink));
  parts.push(txt(295, 24, "Y", { size: 12, bold: true }));
  return svg(340, 210, parts.join(""));
}

// ---- potential energy graph with line XY (Normanhurst Boys 2021 Q10) -----------

export function potentialLineXY(): string {
  const parts: string[] = [];
  const ox = 50, oy = 80; // origin of the energy axis (energy = 0 at oy)
  const rE = 100, rR = 215;
  parts.push(line(ox, 230, ox, 8, { head: "end", width: 1.2 }));
  parts.push(line(ox, oy, 380, oy, { head: "end", width: 1.2 }));
  parts.push(txt(388, oy + 4, "r", { size: 12, italic: true }));
  parts.push(
    `<text x="24" y="140" fill="${C.text}" font-size="11" font-family="${FONT}" text-anchor="middle" transform="rotate(-90 24 140)">Energy</text>`,
  );
  parts.push(line(rE, oy, rE, 230, { dash: "3 3", width: 1 }));
  parts.push(dot(rE, oy, 4, C.ink));
  parts.push(`<text x="${rE - 4}" y="${oy - 8}" fill="${C.text}" font-size="11" font-family="${FONT}" font-style="italic" text-anchor="middle">R<tspan font-size="8" dy="3">E</tspan></text>`);
  // U = −k/r curve from R_E outward
  const k = 18000;
  const U = (x: number) => oy + k / (x - ox + 60);
  const pts: string[] = [];
  for (let x = rE; x <= 360; x += 4) pts.push(`${f(x)},${f(U(x))}`);
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);
  parts.push(txt(272, U(272) + 18, "Gravitational potential energy, U", { size: 10.5 }));
  // vertical line XY at r = R
  parts.push(line(rR, 228, rR, 12, { width: 1.2 }));
  parts.push(txt(rR, 8, "Y", { size: 11, anchor: "middle" }));
  parts.push(txt(rR, 242, "X", { size: 11, anchor: "middle" }));
  parts.push(txt(rR - 6, oy - 6, "R", { size: 11, italic: true, anchor: "end" }));
  const uB = U(rR);
  const marks: Array<[string, number]> = [
    ["E", oy - 30],
    ["D", oy],
    ["C", oy + (uB - oy) / 2],
    ["B", uB],
    ["A", uB + 26],
  ];
  for (const [l, y] of marks) {
    parts.push(line(rR - 4, y, rR + 4, y, { width: 1.2 }));
    parts.push(txt(rR + 8, y + 4, l, { size: 11, bold: true }));
  }
  return svg(450, 250, parts.join(""));
}

// ---- Earth and two satellites drawn to scale (North Sydney Boys 2019 Q10) --------

export function scaleSatellites(): string {
  const parts: string[] = [];
  const cx = 70, cy = 72, R = 46;
  parts.push(planet(cx, cy, R));
  parts.push(dot(cx, cy, 2, C.ink));
  parts.push(txt(cx, cy - R - 8, "Earth", { size: 11, anchor: "middle" }));
  parts.push(dot(cx + 2 * R, cy, 4, C.ink));
  parts.push(txt(cx + 2 * R, cy - 12, "X", { size: 11, anchor: "middle" }));
  parts.push(dot(cx + 3 * R, cy, 4, C.ink));
  parts.push(txt(cx + 3 * R, cy - 12, "Y", { size: 11, anchor: "middle" }));
  parts.push(`<rect x="240" y="52" width="130" height="40" fill="none" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(txt(305, 69, "THIS DIAGRAM IS", { size: 10, anchor: "middle" }));
  parts.push(txt(305, 84, "DRAWN TO SCALE", { size: 10, anchor: "middle" }));
  return svg(380, 130, parts.join(""));
}

// ---- straight-line graph through the origin (North Sydney Boys 2025 Q2) ----------

export function straightLineGraph(o: { yLabel: string; xLabel?: string }): string {
  const parts: string[] = [];
  const L = 40, B = 200, W = 220, H = 180;
  parts.push(line(L, B, L, B - H, { width: 1.4 }));
  parts.push(line(L, B, L + W, B, { width: 1.4 }));
  parts.push(line(L, B, L + W * 0.88, B - H * 0.95, { width: 1.6 }));
  parts.push(
    `<text x="22" y="${B - H / 2}" fill="${C.text}" font-size="11" font-family="${FONT}" text-anchor="middle" transform="rotate(-90 22 ${B - H / 2})">${esc(o.yLabel)}</text>`,
  );
  if (o.xLabel) parts.push(txt(L + W / 2, B + 18, o.xLabel, { anchor: "middle", size: 11 }));
  return svg(L + W + 12, B + 24, parts.join(""));
}

// ---- spacecraft launched horizontally near Earth (North Sydney Girls 2021 Q11) ----

export function spacecraftLaunch(): string {
  const parts: string[] = [];
  const cx = 140, cy = 120, R = 52;
  parts.push(planet(cx, cy, R));
  parts.push(txt(cx, cy + R + 18, "Earth", { anchor: "middle", size: 11, bold: true }));
  parts.push(line(cx, cy - R, cx, cy - R - 20, { width: 1.2 }));
  const sy = cy - R - 24;
  parts.push(`<path d="M ${cx - 14} ${sy - 6} L ${cx + 8} ${sy - 6} L ${cx + 16} ${sy} L ${cx + 8} ${sy + 6} L ${cx - 14} ${sy + 6} z" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(line(cx + 18, sy, cx + 58, sy, { head: "end", width: 1.4 }));
  parts.push(txt(cx + 40, sy - 8, "v", { italic: true, size: 12, bold: true }));
  parts.push(txt(cx - 20, sy + 4, "Spacecraft 1", { anchor: "end", size: 11, bold: true }));
  parts.push(txt(cx + 72, cy + 30, "NOT TO", { size: 11, bold: true }));
  parts.push(txt(cx + 72, cy + 45, "SCALE", { size: 11, bold: true }));
  return svg(290, 200, parts.join(""));
}

// ---- force against distance with X and Y (North Sydney Girls 2023 Q18) ------------

export function forceDistanceGraph(): string {
  const parts: string[] = [];
  const L = 34, B = 150;
  parts.push(line(L, B + 6, L, 14, { head: "end", width: 1.2 }));
  parts.push(line(L - 6, B, 270, B, { head: "end", width: 1.2 }));
  parts.push(txt(L - 12, 20, "F", { italic: true, size: 12 }));
  parts.push(txt(272, B + 16, "r", { italic: true, size: 12 }));
  const x1 = 72, x2 = 222;
  const F = (x: number) => B - 9000 / (x - 10);
  const pts: string[] = [];
  for (let x = x1; x <= x2; x += 3) pts.push(`${f(x)},${f(F(x))}`);
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`);
  parts.push(line(x1, F(x1), x1, B, { dash: "3 3", width: 1 }));
  parts.push(line(x2, F(x2), x2, B, { dash: "3 3", width: 1 }));
  parts.push(txt(x1, B + 16, "X", { italic: true, size: 12, anchor: "middle" }));
  parts.push(txt(x2, B + 16, "Y", { italic: true, size: 12, anchor: "middle" }));
  return svg(290, 175, parts.join(""));
}

// ---- two touching spheres (Shore 2020 Q5) -----------------------------------------

export function twoSpheres(): string {
  const parts: string[] = [];
  const cx = 90;
  parts.push(`<circle cx="${cx}" cy="40" r="32" fill="#fff" stroke="${C.ink}" stroke-width="1.6"/>`);
  parts.push(txt(cx, 47, "X", { anchor: "middle", size: 20 }));
  parts.push(`<circle cx="${cx}" cy="136" r="64" fill="#fff" stroke="${C.ink}" stroke-width="1.6"/>`);
  parts.push(txt(cx, 143, "Y", { anchor: "middle", size: 20 }));
  parts.push(txt(cx + 70, 34, "Mass = 50g", { size: 11, bold: true }));
  parts.push(txt(cx + 70, 48, "Radius = 0.2m", { size: 11, bold: true }));
  parts.push(txt(cx + 70, 130, "Mass = 300g", { size: 11, bold: true }));
  parts.push(txt(cx + 70, 144, "Radius = 0.4m", { size: 11, bold: true }));
  return svg(260, 206, parts.join(""));
}

// ---- circular and elliptical orbits with velocity arrows (Sydney Boys 2023 Q2) ----

export function circleAndEllipseVelocities(): string {
  const parts: string[] = [];
  const ex = 120, ey = 135; // Earth
  const rA = 52;
  const a = 190, b = 102, ecx = ex - 86 + a; // ellipse: left end P 86 left of Earth
  parts.push(`<ellipse cx="${ecx}" cy="${ey}" rx="${a}" ry="${b}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="3 3"/>`);
  parts.push(`<circle cx="${ex}" cy="${ey}" r="${rA}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="3 3"/>`);
  parts.push(`<circle cx="${ex}" cy="${ey}" r="14" fill="${C.guide}"/>`);
  const arrow = (x: number, y: number, dx: number, dy: number) => line(x, y, x + dx, y + dy, { head: "end", width: 1.3 });
  // P: left end of the ellipse; R: left of the circle; S: top of the circle; Q: top of the ellipse
  const px = ex - 86, rx = ex - rA;
  parts.push(dot(px, ey, 3.2, C.ink), arrow(px, ey - 3, 0, -72), txt(px - 8, ey + 4, "P", { italic: true, size: 12, anchor: "end" }));
  parts.push(dot(rx, ey, 3.2, C.ink), arrow(rx, ey - 3, 0, -52), txt(rx - 7, ey + 4, "R", { italic: true, size: 12, anchor: "end" }));
  parts.push(dot(ex, ey - rA, 3.2, C.ink), arrow(ex + 3, ey - rA, 52, 0), txt(ex, ey - rA - 8, "S", { italic: true, size: 12, anchor: "middle" }));
  parts.push(dot(ecx, ey - b, 3.2, C.ink), arrow(ecx + 3, ey - b, 34, 0), txt(ecx, ey - b - 8, "Q", { italic: true, size: 12, anchor: "middle" }));
  parts.push(txt(ex + rA + 4, ey - 2, "orbit of", { size: 11 }), txt(ex + rA + 4, ey + 12, "Satellite A", { size: 11, italic: true }));
  parts.push(txt(ecx + a + 6, ey - 2, "orbit of", { size: 11 }), txt(ecx + a + 6, ey + 12, "Satellite B", { size: 11, italic: true }));
  return svg(ecx + a + 80, ey + b + 12, parts.join(""));
}

// ---- ellipse on a grid with chords through the foci (Sydney Girls 2020 Q13) ------

export function ellipseFociChords(): string {
  const parts: string[] = [];
  const cx = 150, cy = 110, a = 112, b = 66, g = 14;
  for (let x = cx - 8 * g; x <= cx + 8 * g; x += g) parts.push(line(x, cy - 6 * g, x, cy + 6 * g, { color: C.grid, width: 0.6 }));
  for (let y = cy - 6 * g; y <= cy + 6 * g; y += g) parts.push(line(cx - 8 * g, y, cx + 8 * g, y, { color: C.grid, width: 0.6 }));
  parts.push(line(cx - 8.5 * g, cy, cx + 8.5 * g, cy, { color: C.axis, width: 0.9 }));
  parts.push(line(cx, cy - 6 * g, cx, cy + 6 * g, { color: C.axis, width: 0.9 }));
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" fill="none" stroke="${C.ink}" stroke-width="2.2"/>`);
  const c = 66; // focal distance for this drawing (Q, R, P, S at the chord ends)
  const yy = b * Math.sqrt(1 - (c * c) / (a * a));
  for (const s of [-1, 1]) parts.push(line(cx + s * c, cy - 6.6 * g, cx + s * c, cy + 6.6 * g, { width: 2 }));
  parts.push(dot(cx, cy, 2.6, "#db2777"));
  parts.push(line(cx - c - 6, cy, cx - c + 6, cy, { color: "#db2777", width: 2 }));
  parts.push(line(cx + c - 6, cy, cx + c + 6, cy, { color: "#db2777", width: 2 }));
  parts.push(txt(cx - c - 4, cy - 5, "A", { size: 10, anchor: "end" }), txt(cx - 4, cy - 5, "B", { size: 10, anchor: "end" }), txt(cx + c - 4, cy - 5, "C", { size: 10, anchor: "end" }));
  parts.push(txt(cx - c - 4, cy - yy - 4, "Q", { size: 10, anchor: "end" }), txt(cx + c + 4, cy - yy - 4, "R", { size: 10 }));
  parts.push(txt(cx - c - 4, cy + yy + 12, "P", { size: 10, anchor: "end" }), txt(cx + c + 4, cy + yy + 12, "S", { size: 10 }));
  return svg(300, 225, parts.join(""));
}

// ---- straight-line data graph on a grid (Barker 2021 Q32) --------------------------

export function linearDataGraph(o: {
  title?: string;
  xMax: number;
  yMax: number;
  xStep: number;
  yStep: number;
  xLabel: string;
  yLabel: string;
  from: [number, number];
  to: [number, number];
  points?: Array<[number, number]>;
  dashed?: boolean;
}): string {
  const L = 52, T = o.title ? 26 : 10, PW = 300, PH = 200;
  const X = (x: number) => L + (x / o.xMax) * PW;
  const Y = (y: number) => T + PH - (y / o.yMax) * PH;
  const parts: string[] = [];
  if (o.title) parts.push(txt(L + PW / 2, 15, o.title, { anchor: "middle", size: 11, bold: true }));
  for (let k = 0; k <= 5 * (o.xMax / o.xStep); k++) {
    const x = (k * o.xStep) / 5;
    parts.push(line(X(x), T, X(x), T + PH, { color: k % 5 === 0 ? C.guide : C.grid, width: k % 5 === 0 ? 0.8 : 0.5 }));
  }
  for (let k = 0; k <= 5 * (o.yMax / o.yStep); k++) {
    const y = (k * o.yStep) / 5;
    parts.push(line(L, Y(y), L + PW, Y(y), { color: k % 5 === 0 ? C.guide : C.grid, width: k % 5 === 0 ? 0.8 : 0.5 }));
  }
  for (let x = 0; x <= o.xMax; x += o.xStep) parts.push(txt(X(x), T + PH + 13, String(x), { anchor: "middle", size: 9.5 }));
  for (let y = 0; y <= o.yMax; y += o.yStep) parts.push(txt(L - 5, Y(y) + 3.5, String(y), { anchor: "end", size: 9.5 }));
  parts.push(txt(L + PW / 2, T + PH + 30, o.xLabel, { anchor: "middle", size: 10.5 }));
  parts.push(
    `<text x="14" y="${T + PH / 2}" fill="${C.text}" font-size="10.5" font-family="${FONT}" text-anchor="middle" transform="rotate(-90 14 ${T + PH / 2})">${esc(o.yLabel)}</text>`,
  );
  parts.push(line(X(o.from[0]), Y(o.from[1]), X(o.to[0]), Y(o.to[1]), { width: 1.6, ...(o.dashed ? { dash: "3 3", color: C.a } : {}) }));
  for (const [x, y] of o.points ?? []) parts.push(dot(X(x), Y(y), 3.5, C.a));
  return svg(L + PW + 12, T + PH + 38, parts.join(""));
}

// ---- elliptical orbit with two swept segments (Barker 2021 Q32) ------------------

export function sweptSegments(): string {
  const parts: string[] = [];
  const cx = 210, cy = 90, a = 180, b = 70;
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" fill="none" stroke="${C.a}" stroke-width="1.3" stroke-dasharray="5 4"/>`);
  const ox = cx - 130; // planet near the left focus
  const P = (deg: number) => [cx + a * Math.cos(rad(deg)), cy - b * Math.sin(rad(deg))] as const;
  parts.push(`<circle cx="${ox}" cy="${cy}" r="16" fill="#b45309" opacity="0.85"/>`);
  parts.push(txt(ox + 4, cy - 20, "O", { italic: true, size: 12 }));
  const pts: Array<[number, string, number, number]> = [
    [128, "B", -12, -6],
    [-128, "A", -12, 16],
    [62, "C", 6, -8],
    [22, "D", 8, -2],
  ];
  for (const [deg, l, dx, dy] of pts) {
    const [x, y] = P(deg);
    parts.push(line(ox, cy, x, y, { width: 0.8 }));
    parts.push(dot(x, y, 2.5, C.ink));
    parts.push(txt(x + dx, y + dy, l, { italic: true, size: 13 }));
  }
  parts.push(txt(6, 22, "NOT TO", { size: 10 }), txt(8, 35, "SCALE", { size: 10 }));
  return svg(400, 175, parts.join(""));
}

// ---- planets X and Y five years apart (Caringbah 2020 Q31) ------------------------

export function alignedPlanetsPanels(): string {
  const parts: string[] = [];
  const panel = (ox: number, title: string, xAt: number, yAt: number) => {
    const cx = ox + 95, cy = 110, rX = 32, rY = 80;
    parts.push(txt(cx, 16, title, { anchor: "middle", size: 10.5 }));
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${rX}" fill="none" stroke="${C.ink}" stroke-width="1"/>`);
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${rY}" fill="none" stroke="${C.ink}" stroke-width="1"/>`);
    parts.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="${C.star}"/>`);
    const xx = cx + rX * Math.cos(rad(xAt)), xy = cy - rX * Math.sin(rad(xAt));
    const yx = cx + rY * Math.cos(rad(yAt)), yy = cy - rY * Math.sin(rad(yAt));
    parts.push(`<circle cx="${f(xx)}" cy="${f(xy)}" r="6" fill="${C.guide}" stroke="${C.ink}" stroke-width="0.8"/>`);
    parts.push(`<circle cx="${f(yx)}" cy="${f(yy)}" r="6" fill="${C.guide}" stroke="${C.ink}" stroke-width="0.8"/>`);
    parts.push(txt(xx - 2, xy - 10, "Planet X", { size: 10, anchor: "middle" }));
    parts.push(txt(yx - 4, yy + (yAt < 45 ? 22 : -10), "Planet Y", { size: 10, anchor: "middle" }));
  };
  panel(0, "Initial position of planets", 0, 0);
  panel(210, "Position of planets 5 years later", 120, 0 + (120 * Math.pow(2 / 5, 1.5)));
  return svg(420, 200, parts.join(""));
}

// ---- satellite in circular orbit around Venus (Caringbah 2024 Q24) ----------------

export function venusOrbit(): string {
  const parts: string[] = [];
  const cx = 110, cy = 100, R = 82;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="2"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="26" fill="${C.ink}"/>`);
  parts.push(txt(cx, cy + 4, "Venus", { anchor: "middle", size: 11, color: "#fff" }));
  parts.push(line(cx + 28, cy, cx + R - 8, cy, { dash: "3 2", width: 3 }));
  parts.push(txt(cx + 50, cy + 16, "Orbit", { anchor: "middle", size: 11 }));
  parts.push(`<rect x="${cx + R - 8}" y="${cy - 8}" width="16" height="16" fill="${C.ink}"/>`);
  parts.push(`<rect x="216" y="130" width="12" height="12" fill="${C.ink}"/>`);
  parts.push(txt(234, 140, "Satellite", { size: 11 }));
  parts.push(txt(216, 162, "Not to scale", { size: 11 }));
  return svg(300, 200, parts.join(""));
}

// ---- satellite at height h above a planet (Cheltenham Girls 2011 Q22) -------------

export function satelliteAtHeight(): string {
  const parts: string[] = [];
  const cx = 100, cy = 95, R = 50, h = 22;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R + h}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="3 3"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(txt(cx, cy - 18, "planet", { anchor: "middle", size: 10.5 }), txt(cx, cy - 6, "mass M", { anchor: "middle", size: 10.5 }));
  parts.push(line(cx, cy, cx - R + 3, cy, { head: "both", width: 1 }));
  parts.push(txt(cx - R / 2, cy + 14, "R", { anchor: "middle", size: 11 }));
  parts.push(line(cx, cy + R + 2, cx, cy + R + h - 2, { head: "both", width: 1 }));
  parts.push(txt(cx + 6, cy + R + h / 2 + 4, "h", { size: 11 }));
  const sx = cx + (R + h) * Math.cos(rad(45)), sy = cy - (R + h) * Math.sin(rad(45));
  parts.push(dot(sx, sy, 7, C.ink));
  parts.push(txt(sx + 12, sy + 4, "Satellite, mass m", { size: 11 }));
  return svg(300, 180, parts.join(""));
}

// ---- perihelion and aphelion (Cherrybrook Tech 2025 Q34) --------------------------

export function perihelionAphelion(): string {
  const parts: string[] = [];
  const cx = 230, cy = 90, a = 120, b = 80;
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" fill="none" stroke="${C.a}" stroke-width="1.3"/>`);
  const sx = cx - 72;
  parts.push(`<circle cx="${sx}" cy="${cy}" r="9" fill="${C.star}"/>`);
  parts.push(txt(sx + 12, cy + 18, "Sun", { size: 11 }));
  const P = (deg: number) => [cx + a * Math.cos(rad(deg)), cy - b * Math.sin(rad(deg))] as const;
  const [px, py] = P(50);
  parts.push(`<circle cx="${f(px)}" cy="${f(py)}" r="5" fill="${C.guide}" stroke="${C.ink}"/>`);
  parts.push(txt(px + 8, py - 2, "planet", { size: 11 }));
  const [ax, ay] = P(98);
  parts.push(`<path d="M ${f(ax + 6)} ${f(ay - 4)} l -10 4 l 10 4 z" fill="${C.a}"/>`);
  parts.push(line(20, cy, cx - a - 8, cy, { color: C.b, head: "end", width: 1.4 }));
  parts.push(txt(30, cy - 6, "perihelion", { size: 11 }));
  parts.push(line(450, cy, cx + a + 8, cy, { color: C.b, head: "end", width: 1.4 }));
  parts.push(txt(390, cy - 6, "aphelion", { size: 11 }));
  return svg(460, 180, parts.join(""));
}

// ---- Cassini between Saturn and Jupiter (James Ruse 2019 Q22) ---------------------

export function cassiniLine(): string {
  const parts: string[] = [];
  const y = 60;
  parts.push(`<circle cx="50" cy="${y - 20}" r="16" fill="#fde68a" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(`<ellipse cx="50" cy="${y - 20}" rx="30" ry="7" fill="none" stroke="${C.ink}" stroke-width="1" transform="rotate(-20 50 ${y - 20})"/>`);
  parts.push(`<rect x="196" y="${y - 26}" width="10" height="10" fill="${C.ink}"/>`);
  parts.push(`<circle cx="370" cy="${y - 20}" r="22" fill="#fed7aa" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(line(50, y + 20, 199, y + 20, { head: "both", width: 1 }));
  parts.push(line(203, y + 20, 370, y + 20, { head: "both", width: 1 }));
  parts.push(txt(125, y + 14, "3.9 × 10¹¹ m", { anchor: "middle", size: 10 }));
  parts.push(txt(287, y + 14, "4.2 × 10¹¹ m", { anchor: "middle", size: 10 }));
  parts.push(txt(50, y + 40, "Saturn", { anchor: "middle", size: 10.5 }), txt(201, y + 40, "Cassini", { anchor: "middle", size: 10.5 }), txt(370, y + 40, "Jupiter", { anchor: "middle", size: 10.5 }));
  parts.push(txt(400, 14, "not to scale", { anchor: "end", size: 9.5 }));
  return svg(410, y + 50, parts.join(""));
}

// ---- DSCOVR between Earth and Sun (James Ruse 2022 Q33) ---------------------------

export function dscovrDiagram(): string {
  const parts: string[] = [];
  const sx = 120, sy = 150, R = 118;
  parts.push(`<circle cx="${sx}" cy="${sy}" r="${R}" fill="none" stroke="${C.guide}" stroke-width="1" stroke-dasharray="2 3"/>`);
  parts.push(`<circle cx="${sx}" cy="${sy}" r="${R - 14}" fill="none" stroke="${C.guide}" stroke-width="1" stroke-dasharray="2 3"/>`);
  parts.push(`<circle cx="${sx}" cy="${sy}" r="9" fill="#fff" stroke="${C.ink}"/>`);
  parts.push(txt(sx + 12, sy + 10, "Sun", { size: 11 }));
  parts.push(`<circle cx="${sx}" cy="${sy - R}" r="7" fill="${C.guide}" stroke="${C.ink}"/>`);
  parts.push(txt(sx, sy - R - 12, "Earth", { size: 11, anchor: "middle" }));
  parts.push(dot(sx, sy - R + 14, 2.5, C.ink));
  parts.push(txt(sx - 8, sy - R + 30, "DSCOVR", { size: 10.5 }));
  parts.push(line(sx - 10, sy - R, sx - 10, sy - 2, { head: "both", width: 1 }));
  parts.push(txt(sx - 20, sy - R / 2, "R", { size: 11, anchor: "end" }));
  parts.push(line(sx + 12, sy - R + 1, sx + 12, sy - R + 13, { head: "both", width: 1 }));
  parts.push(txt(sx + 17, sy - R + 11, "d", { size: 11 }));
  parts.push(txt(4, 286, "NOT TO SCALE", { size: 10 }));
  parts.push(`<rect x="262" y="40" width="190" height="170" fill="none" stroke="${C.ink}"/>`);
  const lines = ["Data:", "Mass of the DSCOVR:", "m = 570 kg", "Mass of the Sun:", "M_S = 2.0 × 10³⁰ kg", "Period of the Earth’s orbit:", "T_E = 3.16 × 10⁷ s."];
  lines.forEach((l, i) => parts.push(txt(272, 62 + i * 21 + (i > 0 ? 6 : 0) + (i > 2 ? 6 : 0) + (i > 4 ? 6 : 0), l, { size: 11 })));
  return svg(460, 292, parts.join(""));
}

// ---- force on a 1000 kg mass against distance from the Moon (James Ruse 2024 Q30) ----

export function moonForceGraph(): string {
  const L = 52, T = 14, PW = 330, PH = 210;
  const xMax = 6.6e6, yMax = 2.0e3;
  const X = (r: number) => L + (r / xMax) * PW;
  const Y = (F: number) => T + PH - (F / yMax) * PH;
  const parts: string[] = [];
  for (let k = 0; k <= 66; k++) {
    const r = k * 1e5;
    parts.push(line(X(r), T, X(r), T + PH, { color: k % 10 === 0 ? C.guide : C.grid, width: k % 10 === 0 ? 0.8 : 0.4 }));
  }
  for (let k = 0; k <= 40; k++) {
    const F = k * 50;
    parts.push(line(L, Y(F), L + PW, Y(F), { color: k % 10 === 0 ? C.guide : C.grid, width: k % 10 === 0 ? 0.8 : 0.4 }));
  }
  for (let k = 0; k <= 6; k++) parts.push(txt(X(k * 1e6), T + PH + 13, String(k), { anchor: "middle", size: 9.5 }));
  for (const v of [0, 0.5, 1.0, 1.5, 2.0]) parts.push(txt(L - 5, Y(v * 1e3) + 3.5, v === 0 ? "0" : v.toFixed(1), { anchor: "end", size: 9.5 }));
  parts.push(txt(L + PW / 2, T + PH + 30, "r (× 10⁶ m)", { anchor: "middle", size: 10.5 }));
  parts.push(
    `<text x="16" y="${T + PH / 2}" fill="${C.text}" font-size="10.5" font-family="${FONT}" text-anchor="middle" transform="rotate(-90 16 ${T + PH / 2})">F (× 10³ N)</text>`,
  );
  const GMm = 4.905e15;
  const pts: string[] = [];
  for (let r = 1.74e6; r <= 6.6e6; r += 5e4) pts.push(`${f(X(r))},${f(Y(GMm / (r * r)))}`);
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);
  parts.push(line(X(1.74e6), Y(GMm / 1.74e6 ** 2), X(1.74e6), T + PH, { dash: "3 3", width: 1 }));
  parts.push(txt(X(1.74e6) - 30, Y(400), "radius of", { size: 9.5 }), txt(X(1.74e6) - 30, Y(400) + 11, "Moon", { size: 9.5 }));
  return svg(L + PW + 12, T + PH + 38, parts.join(""));
}

// ---- equal-area sectors in an elliptical orbit (Knox 2023 Q24) ---------------------

export function equalAreaSectors(): string {
  const parts: string[] = [];
  const cx = 150, cy = 95, a = 120, b = 72;
  const sx = cx - 80; // Sun near the left focus
  const P = (deg: number) => [cx + a * Math.cos(rad(deg)), cy - b * Math.sin(rad(deg))] as const;
  const sector = (d1: number, d2: number) => {
    const pts: string[] = [`${sx},${cy}`];
    for (let d = d1; d <= d2; d += 2) {
      const [x, y] = P(d);
      pts.push(`${f(x)},${f(y)}`);
    }
    return `<polygon points="${pts.join(" ")}" fill="#cbd5e1" stroke="${C.ink}" stroke-width="0.8"/>`;
  };
  parts.push(sector(124, 236)); // A to B, near the Sun
  parts.push(sector(-14, 14)); // C to D, far end
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);
  parts.push(`<circle cx="${sx}" cy="${cy}" r="9" fill="${C.ink}"/>`);
  parts.push(txt(sx + 22, cy - 10, "Sun", { size: 11, anchor: "middle" }));
  const lab = (deg: number, l: string, dx: number, dy: number) => {
    const [x, y] = P(deg);
    parts.push(txt(x + dx, y + dy, l, { size: 12, anchor: "middle" }));
  };
  lab(124, "B", -6, -6);
  lab(236, "A", -6, 14);
  lab(14, "C", 8, -4);
  lab(-14, "D", 8, 12);
  return svg(300, 190, parts.join(""));
}

// ---- unlabelled energy graphs (Knox 2025 Q29, Kotara 2020 Q26) -----------------------

export function potentialHeightSketch(): string {
  const parts: string[] = [];
  const L = 50, T = 10, W = 280, H = 240, zy = T + 120;
  for (let k = 0; k <= 12; k++) parts.push(line(L + (k * W) / 12, T, L + (k * W) / 12, T + H, { color: C.grid, width: 0.6, dash: "3 2" }));
  for (let k = 0; k <= 12; k++) parts.push(line(L, T + (k * H) / 12, L + W, T + (k * H) / 12, { color: C.grid, width: 0.6, dash: "3 2" }));
  parts.push(line(L, T, L, T + H, { width: 1.8 }));
  parts.push(line(L, zy, L + W, zy, { width: 1.8 }));
  parts.push(txt(L - 8, zy + 4, "0", { anchor: "end", size: 11 }));
  parts.push(txt(L + W + 8, zy - 4, "Height above Earth’s", { size: 11 }), txt(L + W + 8, zy + 10, "surface (m)", { size: 11 }));
  parts.push(`<text x="18" y="${zy}" fill="${C.text}" font-size="11" font-family="${FONT}" text-anchor="middle" transform="rotate(-90 18 ${zy})">Energy (kJ)</text>`);
  // U ∝ −1/(R + h): about −120 px at the surface, rising towards zero at the right edge
  const pts2: string[] = [];
  for (let x = 0; x <= W; x += 4) {
    const k = 1 / (1 + 3.2 * (x / W));
    pts2.push(`${f(L + x)},${f(zy + 120 * k - 8)}`);
  }
  parts.push(`<polyline points="${pts2.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="2"/>`);
  return svg(L + W + 140, T + H + 8, parts.join(""));
}

export function totalEnergyRadiusSketch(): string {
  const parts: string[] = [];
  const L = 34, T = 10, W = 280, H = 270;
  const X = (r: number) => L + (r / 3.6) * W;
  const Y = (e: number) => T + ((3.2 - e) / 6.4) * H;
  for (let r = 1; r <= 3; r++) parts.push(line(X(r), T, X(r), T + H, { color: C.grid, width: 0.7 }));
  for (let e = -3; e <= 3; e++) parts.push(line(L, Y(e), L + W, Y(e), { color: C.grid, width: 0.7 }));
  parts.push(`<rect x="${L}" y="${T}" width="${W}" height="${H}" fill="none" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(line(L, Y(0), L + W, Y(0), { width: 1.2 }));
  for (let e = -3; e <= 3; e++) parts.push(txt(L - 5, Y(e) + 3.5, String(e), { anchor: "end", size: 9 }));
  for (let r = 1; r <= 3; r++) parts.push(txt(X(r), Y(0) + 12, String(r), { anchor: "middle", size: 9 }));
  parts.push(txt(L + 6, T + 14, "Energy", { size: 10.5 }));
  parts.push(txt(L + W - 4, Y(0) - 6, "Orbital radius", { anchor: "end", size: 10.5 }));
  const pts: string[] = [];
  for (let r = 0.35; r <= 3.6; r += 0.02) {
    const e = -1 / r;
    if (e >= -3.2) pts.push(`${f(X(r))},${f(Y(e))}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.b}" stroke-width="1.6"/>`);
  parts.push(`<text x="${f(X(1.0))}" y="${f(Y(-0.75))}" fill="${C.b}" font-size="11" font-family="${FONT}" font-style="italic">E<tspan font-size="8" dy="3">total</tspan></text>`);
  return svg(L + W + 10, T + H + 8, parts.join(""));
}

// ---- binary star system (Normanhurst Boys 2021 Q22) -------------------------------

export function binaryStars(): string {
  const parts: string[] = [];
  const y = 90;
  const x1 = 90, x2 = 330, xX = x1 + (x2 - x1) / 4;
  parts.push(`<circle cx="${x1}" cy="${y}" r="42" fill="#fff" stroke="${C.ink}" stroke-width="1.4"/>`);
  parts.push(`<circle cx="${x2}" cy="${y}" r="24" fill="#fff" stroke="${C.ink}" stroke-width="1.4"/>`);
  parts.push(txt(x1 - 50, y + 4, "Star 1", { anchor: "end", size: 11 }));
  parts.push(txt(x2 + 30, y + 4, "Star 2", { size: 11 }));
  parts.push(line(x1, y, xX - 2, y, { head: "end", width: 1 }));
  parts.push(line(x2, y, xX + 2, y, { head: "end", width: 1 }));
  parts.push(dot(xX, y, 2.5, C.ink));
  parts.push(txt(xX, y + 16, "X", { anchor: "middle", size: 11, bold: true }));
  parts.push(txt((x1 + xX) / 2, y - 6, "r₁", { anchor: "middle", size: 11, italic: true }));
  parts.push(txt((xX + x2) / 2, y - 6, "r₂", { anchor: "middle", size: 11, italic: true }));
  parts.push(line(x1 + 20, y - 40, x1 + 44, y - 66, { head: "end", width: 1.2 }));
  parts.push(line(x2 + 6, y + 26, x2 - 6, y + 56, { head: "end", width: 1.2 }));
  parts.push(txt(210, y + 80, "NOT TO SCALE", { anchor: "middle", size: 11, bold: true }));
  return svg(420, y + 92, parts.join(""));
}

// ---- Saturn and the A ring (North Sydney Boys 2023 Q18) ----------------------------

export function saturnRing(): string {
  const parts: string[] = [];
  const cx = 160, cy = 70;
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="130" ry="30" fill="none" stroke="${C.ink}" stroke-width="7" opacity="0.35"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="48" fill="#fef3c7" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(`<path d="M ${cx - 130} ${cy} A 130 30 0 0 0 ${cx + 130} ${cy}" fill="none" stroke="${C.ink}" stroke-width="7" opacity="0.5"/>`);
  parts.push(txt(cx + 40, 16, "Saturn", { size: 11 }));
  parts.push(txt(cx + 140, cy - 22, "A ring", { size: 11 }));
  parts.push(line(cx - 130, cy + 50, cx + 130, cy + 50, { head: "both", width: 1 }));
  parts.push(line(cx - 130, cy + 6, cx - 130, cy + 54, { dash: "3 3", width: 0.8 }));
  parts.push(line(cx + 130, cy + 6, cx + 130, cy + 54, { dash: "3 3", width: 0.8 }));
  parts.push(txt(cx, cy + 66, "2.72 × 10⁸ m", { anchor: "middle", size: 11 }));
  return svg(340, cy + 74, parts.join(""));
}

// ---- Newton's cannon (Cheltenham Girls 2008 Q17) ------------------------------------

export function newtonsCannon(): string {
  const parts: string[] = [];
  const cx = 200, cy = 160, R = 80;
  parts.push(planet(cx, cy, R));
  parts.push(`<rect x="${cx - 4}" y="${cy - R - 12}" width="16" height="7" fill="${C.ink}"/>`);
  parts.push(line(cx, cy - R, cx, cy - R - 6, { width: 2 }));
  const top = cy - R - 8;
  const path = (d: string, dash = "4 3") => `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-dasharray="${dash}"/>`;
  parts.push(path(`M ${cx} ${top} Q ${cx - 45} ${top - 6} ${cx - 52} ${cy - R + 18}`));
  parts.push(txt(cx - 44, top - 8, "a", { size: 11, italic: true }));
  parts.push(path(`M ${cx} ${top} Q ${cx - 110} ${top - 12} ${cx - 86} ${cy - 6}`));
  parts.push(txt(cx - 104, cy - 60, "b", { size: 11, italic: true }));
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R + 8}" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-dasharray="4 3"/>`);
  parts.push(txt(cx + R + 12, cy + 40, "c", { size: 11, italic: true }));
  parts.push(path(`M ${cx} ${top} Q ${cx - 170} ${top - 20} ${cx - 192} ${cy + 30}`));
  parts.push(txt(cx - 165, cy - R - 10, "d", { size: 11, italic: true }));
  return svg(330, 260, parts.join(""));
}

// ---- satellite path between a planet and its moon (North Sydney Girls 2020 Q29) -----

export function planetMoonPath(): string {
  const parts: string[] = [];
  const px = 230, py = 110;
  parts.push(`<circle cx="${px}" cy="${py}" r="100" fill="none" stroke="${C.guide}" stroke-width="0.8" stroke-dasharray="2 3"/>`);
  parts.push(`<circle cx="${px}" cy="${py}" r="32" fill="#fff" stroke="${C.ink}" stroke-width="1.3"/>`);
  parts.push(txt(px, py + 4, "planet", { anchor: "middle", size: 10 }));
  parts.push(`<circle cx="${px - 100}" cy="${py}" r="10" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(txt(px - 100, py - 16, "moon", { anchor: "middle", size: 10 }));
  // dashed path: arrives from below, loops once around the planet, then leaves to the left past the moon
  parts.push(
    `<path d="M ${px} ${py + 130} C ${px} ${py + 90}, ${px + 60} ${py + 70}, ${px + 62} ${py} S ${px + 10} ${py - 66}, ${px - 40} ${py - 50} S ${px - 70} ${py + 30}, ${px - 120} ${py + 40} L ${px - 190} ${py + 40}" fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-dasharray="5 3"/>`,
  );
  return svg(400, 250, parts.join(""));
}

// ---- spacecraft returning to a geostationary orbit (North Sydney Girls 2021 Q25) ----

export function geoReturnPanels(): string {
  const parts: string[] = [];
  const earth = (cx: number, cy: number) => {
    parts.push(planet(cx, cy, 32));
    parts.push(txt(cx, cy + 50, "Earth", { anchor: "middle", size: 10.5, bold: true }));
  };
  // panel 1: A at 5.5 × 10⁷ m, B on the geostationary orbit
  const c1x = 110, c1y = 120, R1 = 82;
  parts.push(`<circle cx="${c1x}" cy="${c1y}" r="${R1}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="4 3"/>`);
  earth(c1x, c1y);
  const ax = c1x + 170, ay = c1y - 50, bx = c1x - 6, by = c1y - R1;
  parts.push(`<path d="M ${ax} ${ay} Q ${c1x + 110} ${c1y - 100} ${bx + 4} ${by}" fill="none" stroke="${C.ink}" stroke-width="1.4" marker-end="url(#ah)"/>`);
  parts.push(dot(ax, ay, 3.2, C.ink), txt(ax + 6, ay + 4, "A", { size: 11, bold: true }));
  parts.push(dot(bx, by, 3.2, C.ink), txt(bx, by - 8, "B", { size: 11, bold: true, anchor: "middle" }));
  parts.push(line(ax, ay, c1x + 2, c1y - 1, { head: "end", width: 0.9 }));
  parts.push(txt(c1x + 92, c1y - 10, "5.5 × 10⁷ m", { size: 10.5 }));
  parts.push(txt(c1x + 140, c1y + 50, "NOT TO SCALE", { size: 10, bold: true }));
  // panel 2: descent from B to C on the surface
  const c2x = 430, c2y = 120;
  parts.push(`<circle cx="${c2x}" cy="${c2y}" r="${R1}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="4 3"/>`);
  earth(c2x, c2y);
  const b2x = c2x, b2y = c2y - R1;
  const cxp = c2x - 31, cyp = c2y - 8;
  parts.push(`<path d="M ${b2x} ${b2y} Q ${c2x - 42} ${c2y - 70} ${cxp} ${cyp}" fill="none" stroke="${C.ink}" stroke-width="1.4" marker-end="url(#ah)"/>`);
  parts.push(dot(b2x, b2y, 3.2, C.ink), txt(b2x, b2y - 8, "B", { size: 11, bold: true, anchor: "middle" }));
  parts.push(dot(cxp, cyp, 3.2, C.ink), txt(cxp - 8, cyp + 4, "C", { size: 11, bold: true, anchor: "end" }));
  parts.push(txt(c2x + 70, c2y + 70, "NOT TO SCALE", { size: 10, bold: true }));
  return svg(600, 230, parts.join(""));
}

// ---- shuttle launched from A into a circular orbit at B (North Sydney Girls 2022 Q31) ----

export function launchToOrbit(): string {
  const parts: string[] = [];
  const cx = 130, cy = 110, R = 85;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="4 3"/>`);
  parts.push(planet(cx, cy, 40));
  parts.push(txt(cx, cy + 58, "Earth", { anchor: "middle", size: 10.5, bold: true }));
  const ax = cx - 40, ay = cy - 4;
  parts.push(`<path d="M ${ax} ${ay} Q ${cx - 46} ${cy - 70} ${cx} ${cy - R}" fill="none" stroke="${C.ink}" stroke-width="1.4" marker-end="url(#ah)"/>`);
  parts.push(dot(ax, ay, 3.2, C.ink), txt(ax - 8, ay + 4, "A", { size: 11, bold: true, anchor: "end" }));
  parts.push(dot(cx, cy - R, 3.2, C.ink), txt(cx, cy - R - 8, "B", { size: 11, bold: true, anchor: "middle" }));
  parts.push(line(cx, cy, cx + R * Math.cos(rad(15)) - 2, cy - R * Math.sin(rad(15)), { head: "end", width: 1, dash: "3 2" }));
  parts.push(txt(cx + 50, cy - 4, "R", { size: 11, bold: true }));
  parts.push(txt(cx + R + 16, cy + 50, "NOT TO", { size: 10, bold: true }), txt(cx + R + 16, cy + 63, "SCALE", { size: 10, bold: true }));
  return svg(300, 220, parts.join(""));
}

// ---- two identical masses a distance d apart (North Sydney Girls 2023 Q22) ----------

export function twoMasses(): string {
  const parts: string[] = [];
  parts.push(`<circle cx="70" cy="60" r="22" fill="#e2e8f0" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(`<circle cx="250" cy="60" r="22" fill="#e2e8f0" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(line(70, 60, 248, 60, { head: "both", width: 1, dash: "4 3" }));
  parts.push(txt(160, 52, "d m", { anchor: "middle", size: 11, italic: true }));
  parts.push(txt(160, 18, "Identical masses", { anchor: "middle", size: 11 }));
  return svg(320, 100, parts.join(""));
}

// ---- Molniya orbit (Sydney Boys 2022 Q30) -------------------------------------------

export function molniyaOrbit(): string {
  const parts: string[] = [];
  const ex = 110, ey = 225, R = 34;
  const a = 112, b = 30, c = Math.sqrt(a * a - b * b);
  const th = -58; // long axis tilted up and to the right
  const ccx = ex + (c - 6) * Math.cos(rad(-th)), ccy = ey - (c - 6) * Math.sin(rad(-th));
  parts.push(planet(ex, ey, R));
  parts.push(`<ellipse cx="${f(ccx)}" cy="${f(ccy)}" rx="${a}" ry="${b}" transform="rotate(${th} ${f(ccx)} ${f(ccy)})" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`);
  const px = ccx + a * Math.cos(rad(-th)), py = ccy - a * Math.sin(rad(-th));
  parts.push(dot(px, py, 3.5, C.ink));
  parts.push(txt(px - 8, py + 4, "P", { size: 12, italic: true, anchor: "end" }));
  return svg(260, 270, parts.join(""));
}

// ---- projectile on an elliptical path between two points on Earth (Sydney Grammar 2021 Q36) ----

export function projectileEllipse(): string {
  const parts: string[] = [];
  const cx = 150, cy = 180, R = 70;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#bfdbfe" stroke="${C.ink}" stroke-width="1"/>`);
  // ellipse with the Earth's centre as a focus, top at 2R, crossing the surface at ±60°
  const top = 2 * R; // distance from the centre to the furthest point
  const sx = cx - R * Math.sin(rad(60)), syy = cy - R * Math.cos(rad(60));
  const fxp = cx + R * Math.sin(rad(60));
  parts.push(`<path d="M ${f(sx)} ${f(syy)} C ${f(sx - 8)} ${f(cy - 150)}, ${f(fxp + 8)} ${f(cy - 150)}, ${f(fxp)} ${f(syy)}" fill="none" stroke="#dc2626" stroke-width="1.8" marker-end="url(#ah)"/>`);
  parts.push(`<path d="M ${f(sx)} ${f(syy)} C ${f(sx - 4)} ${f(cy + 60)}, ${f(fxp + 4)} ${f(cy + 60)}, ${f(fxp)} ${f(syy)}" fill="none" stroke="#dc2626" stroke-width="1" stroke-dasharray="4 3"/>`);
  parts.push(dot(cx, cy - top, 3.5, "#dc2626"), dot(sx, syy, 3.5, "#dc2626"), dot(fxp, syy, 3.5, "#dc2626"), dot(cx, cy, 2.5, C.ink));
  parts.push(line(cx, cy, cx, cy - top + 4, { dash: "4 3", width: 1, head: "end" }));
  parts.push(txt(cx + 6, cy - R - 30, "2R", { size: 11, italic: true }));
  parts.push(line(cx, cy, sx + 2, syy + 1, { width: 1, head: "end" }), line(cx, cy, fxp - 2, syy + 1, { width: 1, head: "end" }));
  parts.push(txt((cx + sx) / 2 - 2, (cy + syy) / 2 - 4, "R", { size: 11, italic: true }), txt((cx + fxp) / 2 + 4, (cy + syy) / 2 - 4, "R", { size: 11, italic: true }));
  parts.push(line(cx + 3, cy - top, cx + 40, cy - top, { color: "#16a34a", dash: "3 2", head: "end", width: 1.2 }));
  parts.push(txt(cx + 44, cy - top + 4, "Velocity v", { size: 10, color: "#16a34a" }));
  parts.push(txt(cx, cy - top - 10, "Furthest point", { size: 10.5, anchor: "middle" }));
  parts.push(txt(sx - 6, syy, "Start", { size: 10.5, anchor: "end" }), txt(fxp + 6, syy, "Finish", { size: 10.5 }));
  return svg(320, 260, parts.join(""));
}

// ---- planet at its closest (A) and furthest (B) points (Sydney Grammar 2022 Q38) -----

export function perihelionAphelionPoints(): string {
  const parts: string[] = [];
  const cx = 170, cy = 70, a = 130, b = 46;
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="4 3"/>`);
  const ax = cx - a, bx = cx + a, sx = cx - 70;
  parts.push(`<circle cx="${sx}" cy="${cy}" r="12" fill="${C.star}"/>`, txt(sx, cy + 4, "S", { anchor: "middle", size: 10, bold: true }));
  parts.push(`<circle cx="${ax}" cy="${cy}" r="7" fill="#60a5fa"/>`, `<circle cx="${bx}" cy="${cy}" r="7" fill="#60a5fa"/>`);
  parts.push(txt(ax - 12, cy + 4, "A", { size: 11, anchor: "end" }), txt(bx + 12, cy + 4, "B", { size: 11 }));
  parts.push(line(ax + 8, cy, sx - 13, cy, { head: "both", width: 1 }), line(sx + 13, cy, bx - 8, cy, { head: "both", width: 1 }));
  parts.push(subTxt((ax + sx) / 2, cy - 6, "r", "A", { italic: true, anchor: "middle" }), subTxt((sx + bx) / 2, cy - 6, "r", "B", { italic: true, anchor: "middle" }));
  parts.push(line(ax, cy - 8, ax, cy - 30, { color: "#dc2626", head: "end", width: 1.4 }), subTxt(ax + 4, cy - 30, "v", "A", { italic: true }));
  parts.push(line(bx, cy + 8, bx, cy + 22, { color: "#dc2626", head: "end", width: 1.4 }), subTxt(bx - 4, cy + 34, "v", "B", { italic: true, anchor: "end" }));
  return svg(340, 140, parts.join(""));
}

// ---- circular and elliptical orbits with the same total energy (Sydney Grammar 2024 Q31) ----

export function sameEnergyOrbits(): string {
  const parts: string[] = [];
  const cx = 150, cy = 130, r = 105;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-dasharray="5 4"/>`);
  // ellipse with semi-major axis a = r (same total energy), the Earth at one focus
  const a = r, b = 52, c = Math.sqrt(a * a - b * b), th = 33;
  const ecx = cx + c * Math.cos(rad(th)), ecy = cy + c * Math.sin(rad(th));
  parts.push(`<ellipse cx="${f(ecx)}" cy="${f(ecy)}" rx="${a}" ry="${b}" transform="rotate(${th} ${f(ecx)} ${f(ecy)})" fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-dasharray="2 3"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="11" fill="${C.ink}"/>`);
  const px = ecx - a * Math.cos(rad(th)), py = ecy - a * Math.sin(rad(th));
  const qx = ecx + a * Math.cos(rad(th)), qy = ecy + a * Math.sin(rad(th));
  parts.push(line(px, py, qx, qy, { color: C.c, dash: "2 2", width: 1 }));
  parts.push(dot(px, py, 3, C.ink), txt(px - 6, py - 4, "P", { size: 11, bold: true, anchor: "end" }));
  parts.push(dot(qx, qy, 3, C.ink), txt(qx + 6, qy + 10, "A", { size: 11, bold: true }));
  const ccx = cx + r * Math.cos(rad(222)), ccy = cy - r * Math.sin(rad(222));
  parts.push(line(cx, cy, ccx, ccy, { color: C.c, dash: "2 2", width: 1 }));
  parts.push(dot(ccx, ccy, 3, C.ink), txt(ccx - 6, ccy + 12, "C", { size: 11, bold: true, anchor: "end" }));
  parts.push(txt((cx + ccx) / 2 - 8, (cy + ccy) / 2, "r", { size: 11, italic: true }));
  parts.push(txt(cx + 120, cy + 30, "Elliptical orbit", { size: 10 }), txt(cx - 20, cy + r + 18, "Circular orbit", { size: 10 }));
  return svg(360, 270, parts.join(""));
}

// =====================================================================================
// Projectile motion diagrams
// =====================================================================================

/** Parabolic path y(x) sampled as an SVG polyline (screen coordinates, y down). */
function parabola(x0: number, y0: number, range: number, height: number, o: { dash?: string; color?: string; width?: number; to?: number } = {}): string {
  const pts: string[] = [];
  const end = o.to ?? range;
  for (let k = 0; k <= 60; k++) {
    const x = (k / 60) * end;
    const y = (4 * height * x * (range - x)) / (range * range);
    pts.push(`${f(x0 + x)},${f(y0 - y)}`);
  }
  const d = o.dash ? ` stroke-dasharray="${o.dash}"` : "";
  return `<polyline points="${pts.join(" ")}" fill="none" stroke="${o.color ?? C.ink}" stroke-width="${o.width ?? 1.4}"${d}/>`;
}

// ---- vector-component table for two golf balls (Ascham 2024 Q4) ---------------------

export function golfVectorTable(rows: Array<{ label: string; sam: [number, number]; kim: [number, number] }>): string {
  const parts: string[] = [];
  const L = 34, cw = 80, hh = 46, rh = 64;
  const W = L + cw * 4;
  parts.push(txt(L + cw, 16, "SAM’S BALL", { anchor: "middle", size: 11 }), txt(L + 3 * cw, 16, "KIM’S BALL", { anchor: "middle", size: 11 }));
  ["Vertical", "Horizontal", "Vertical", "Horizontal"].forEach((h, i) => parts.push(txt(L + cw * i + cw / 2, 38, h, { anchor: "middle", size: 10.5, italic: true })));
  parts.push(`<rect x="${L}" y="2" width="${cw * 4}" height="${hh + rh * rows.length - 2}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(line(L, 24, L + cw * 4, 24, { width: 0.6 }));
  for (let c = 1; c < 4; c++) parts.push(line(L + cw * c, c === 2 ? 2 : 24, L + cw * c, hh + rh * rows.length, { width: c === 2 ? 1 : 0.6 }));
  rows.forEach((r, i) => {
    const y0 = hh + rh * i;
    parts.push(line(L, y0, L + cw * 4, y0, { width: 0.6 }));
    parts.push(txt(12, y0 + 18, r.label, { size: 11 }));
    const cells: Array<[number, "v" | "h"]> = [[r.sam[0], "v"], [r.sam[1], "h"], [r.kim[0], "v"], [r.kim[1], "h"]];
    cells.forEach(([len, k], c) => {
      const cx = L + cw * c + cw / 2;
      if (k === "v") parts.push(line(cx, y0 + rh - 8, cx, y0 + rh - 8 - len, { head: "end", width: 1.3 }));
      else parts.push(line(cx - len / 2, y0 + rh / 2, cx + len / 2, y0 + rh / 2, { head: "end", width: 1.3 }));
    });
  });
  return svg(W + 4, hh + rh * rows.length + 4, parts.join(""));
}

// ---- trajectories on a height–distance graph (Girraween 2024 Q6) --------------------

export function trajectoryChoices(): string {
  const parts: string[] = [];
  const x0 = 50, y0 = 170;
  parts.push(line(x0, y0, x0, 14, { head: "end", width: 1.2 }), line(x0, y0, 380, y0, { head: "end", width: 1.2 }));
  parts.push(txt(x0 - 4, 26, "height", { size: 11, anchor: "end" }), txt(370, y0 + 18, "distance", { size: 11, anchor: "end" }));
  parts.push(parabola(x0, y0, 240, 100, { width: 2 }));
  parts.push(parabola(x0, y0, 180, 130, { dash: "5 4" }));
  parts.push(parabola(x0, y0, 290, 88, { dash: "5 4" }));
  parts.push(parabola(x0, y0, 190, 58, { dash: "5 4" }));
  parts.push(parabola(x0, y0, 310, 128, { dash: "5 4" }));
  parts.push(txt(x0 + 62, 50, "A", { size: 11 }), txt(x0 + 232, 100, "B", { size: 11 }), txt(x0 + 134, 128, "C", { size: 11 }), txt(x0 + 252, 74, "D", { size: 11 }));
  parts.push(txt(x0 + 186, 136, "X", { size: 12, bold: true }));
  return svg(390, 190, parts.join(""));
}

// ---- projectile path with top point Y (Gosford 2022 Q1) -----------------------------

export function projectileTopY(showY = true): string {
  const parts: string[] = [];
  const x0 = 40, y0 = 150;
  parts.push(line(20, y0, 260, y0, { width: 1.2 }));
  parts.push(txt(200, y0 - 4, "Ground", { size: 10.5 }));
  parts.push(parabola(x0, y0, 160, 120));
  parts.push(line(x0 + 4, y0 - 12, x0 + 6, y0 - 20, { head: "end", width: 1.2 }));
  if (showY) parts.push(dot(x0 + 80, y0 - 120, 3.5, C.ink), txt(x0 + 80, y0 - 128, "Y", { size: 11, italic: true, anchor: "middle" }));
  return svg(280, 165, parts.join(""));
}

// ---- ball rolling off a table (James Ruse 2019 Half-yearly Q3) -----------------------

export function ballOffTable(): string {
  const parts: string[] = [];
  const g = 120;
  parts.push(`<rect x="10" y="34" width="90" height="12" fill="#cbd5e1" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(`<path d="M 90 46 L 100 46 L 100 ${g} L 92 ${g} L 92 64 Z" fill="#cbd5e1" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(txt(24, 44, "table", { size: 10 }));
  parts.push(`<circle cx="90" cy="22" r="12" fill="#fff" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(line(104, 22, 134, 22, { head: "end", width: 1.2 }), txt(138, 26, "v", { size: 11, italic: true }));
  parts.push(line(10, g, 330, g, { width: 1 }));
  parts.push(`<circle cx="300" cy="${g - 12}" r="12" fill="#fff" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(line(102, g + 12, 298, g + 12, { head: "both", width: 1 }));
  parts.push(txt(200, g + 26, "D", { size: 11, italic: true, anchor: "middle" }));
  return svg(340, g + 32, parts.join(""));
}

// ---- two rollercoaster designs (James Ruse 2021 Q19) ---------------------------------

export function rollercoasters(): string {
  const parts: string[] = [];
  const track = (oy: number, hill: boolean, title: string) => {
    const base = oy + 110, H = 80;
    const pts: string[] = [];
    for (let x = 0; x <= 300; x += 3) {
      // tops (height H) at x = 0, 150, 300; valleys at x = 75 (x₁) and 225 (x₂)
      const h = (H / 2) * (1 + Math.cos((x / 75) * Math.PI));
      if (!hill && x > 90 && x < 210) continue;
      pts.push(`${f(30 + x)},${f(base - h)}`);
    }
    if (hill) parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);
    else {
      const a = pts.filter((p) => Number(p.split(",")[0]) <= 120);
      const b = pts.filter((p) => Number(p.split(",")[0]) >= 240);
      parts.push(`<polyline points="${a.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);
      parts.push(`<polyline points="${b.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);
    }
    parts.push(line(20, base, 340, base, { width: 0.9 }));
    parts.push(`<rect x="24" y="${base - H - 14}" width="12" height="9" fill="${C.ink}" transform="rotate(30 30 ${base - H - 10})"/>`);
    parts.push(line(18, base - H, 18, base, { head: "both", width: 1 }), txt(10, base - H / 2 + 4, "H", { size: 11, anchor: "end" }));
    if (hill) parts.push(line(180, base - H, 180, base, { head: "both", width: 1 }), txt(186, base - H / 2, "H", { size: 11 }));
    for (const [x, l] of [[105, "1"], [255, "2"]] as const) { // x₁, x₂ under the valleys
      parts.push(line(x, base - 4, x, base + 4, { width: 1 }));
      parts.push(subTxt(x - 4, base + 18, "x", l, { italic: true }));
    }
    parts.push(txt(180, base + 36, title, { anchor: "middle", size: 11 }));
  };
  track(0, true, "Figure 1: Rollercoaster A");
  track(160, false, "Figure 2: Rollercoaster B");
  return svg(350, 312, parts.join(""));
}

// ---- two cricket shots with the same maximum height (James Ruse 2024 Half-yearly Q1) ----

export function cricketShots(): string {
  const parts: string[] = [];
  const x0 = 50, y0 = 150;
  parts.push(line(20, y0, 400, y0, { width: 1 }));
  parts.push(`<rect x="${x0 - 14}" y="${y0 - 34}" width="10" height="34" fill="#e2e8f0" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(txt(x0 - 10, y0 - 40, "batsman", { size: 9.5, anchor: "middle" }));
  parts.push(parabola(x0, y0, 160, 120, { dash: "4 3" }), parabola(x0, y0, 320, 120, { dash: "4 3" }));
  parts.push(dot(x0 + 80, y0 - 120, 2.5, C.ink), dot(x0 + 160, y0 - 120, 2.5, C.ink));
  parts.push(`<circle cx="${x0 + 160}" cy="${y0 + 8}" r="4" fill="#fff" stroke="${C.ink}"/>`, txt(x0 + 160, y0 + 26, "P", { anchor: "middle", size: 11, italic: true }));
  parts.push(`<circle cx="${x0 + 320}" cy="${y0 + 8}" r="4" fill="#fff" stroke="${C.ink}"/>`, txt(x0 + 320, y0 + 26, "Q", { anchor: "middle", size: 11, italic: true }));
  parts.push(txt(340, 30, "Neglect", { size: 10 }), txt(340, 43, "air resistance", { size: 10 }));
  return svg(420, y0 + 34, parts.join(""));
}

// ---- velocity component vectors with a compass (Cheltenham Girls 2010 Half-yearly Q1) ----

export function velocityComponents(): string {
  const parts: string[] = [];
  const ox = 150, oy = 110;
  parts.push(line(ox, oy, ox, oy - 75, { head: "end", width: 1.5 }));
  parts.push(line(ox, oy, ox + 140, oy, { head: "end", width: 1.5 }));
  parts.push(txt(ox - 8, oy - 50, "Vertical velocity", { size: 11, anchor: "end" }), txt(ox - 8, oy - 36, "= 6.0 m s⁻¹ north", { size: 11, anchor: "end" }));
  parts.push(txt(ox + 60, oy + 18, "Horizontal velocity", { size: 11 }), txt(ox + 60, oy + 32, "= 8 m s⁻¹ east", { size: 11 }));
  const cx = 330, cy = 26;
  parts.push(line(cx, cy + 10, cx, cy - 10, { head: "end", width: 1 }), line(cx - 8, cy, cx + 8, cy, { width: 1 }));
  parts.push(txt(cx, cy - 14, "N", { anchor: "middle", size: 10 }), txt(cx, cy + 22, "S", { anchor: "middle", size: 10 }), txt(cx - 12, cy + 4, "W", { anchor: "end", size: 10 }), txt(cx + 12, cy + 4, "E", { size: 10 }));
  return svg(360, 150, parts.join(""));
}

// ---- ball X dropped, ball Y projected horizontally (Cheltenham Girls 2011 Q2) --------

export function dropAndThrow(): string {
  const parts: string[] = [];
  const top = 30, g = 150, x = 60;
  parts.push(dot(x, top, 6, C.ink), dot(x + 24, top, 6, C.ink));
  parts.push(txt(x, top - 12, "X", { anchor: "middle", size: 11, bold: true }), txt(x + 24, top - 12, "Y", { anchor: "middle", size: 11, bold: true }));
  parts.push(line(x, top + 8, x, g - 2, { head: "end", width: 1.2 }));
  const pts: string[] = [];
  for (let k = 0; k <= 40; k++) {
    const t = k / 40;
    pts.push(`${f(x + 30 + 160 * t)},${f(top + (g - top) * t * t)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.2" marker-end="url(#ah)"/>`);
  parts.push(line(30, g, 260, g, { width: 1.2 }));
  parts.push(txt(150, g + 16, "ground", { anchor: "middle", size: 10.5 }));
  return svg(270, g + 22, parts.join(""));
}

// ---- horizontal and vertical velocity component rows (Knox 2020 Q1) ------------------

export function componentArrowRows(rows: Array<{ label: string; h: number[]; v: number[] }>): string {
  const parts: string[] = [];
  const L = 30, cw = 170, rh = 46;
  parts.push(txt(L + cw / 2, 16, "Horizontal", { anchor: "middle", size: 11, italic: true }), txt(L + cw + cw / 2, 16, "Vertical", { anchor: "middle", size: 11, italic: true }));
  rows.forEach((r, i) => {
    const y0 = 28 + i * rh;
    parts.push(`<rect x="${L}" y="${y0}" width="${cw * 2}" height="${rh - 8}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);
    parts.push(line(L + cw, y0, L + cw, y0 + rh - 8, { width: 0.8 }));
    parts.push(txt(10, y0 + 22, r.label, { size: 11 }));
    r.h.forEach((len, k) => {
      const cx = L + 22 + k * 40;
      parts.push(line(cx, y0 + 19, cx + len, y0 + 19, { head: "end", width: 1.1 }));
    });
    r.v.forEach((len, k) => {
      // positive = upward arrow, negative = downward; length in px
      const cx = L + cw + 22 + k * 40;
      const mid = y0 + 19;
      const h = Math.abs(len) / 2;
      parts.push(len > 0 ? line(cx, mid + h, cx, mid - h, { head: "end", width: 1.1 }) : line(cx, mid - h, cx, mid + h, { head: "end", width: 1.1 }));
    });
  });
  return svg(L + cw * 2 + 6, 28 + rows.length * rh, parts.join(""));
}

// ---- launch at an angle θ (Knox 2023 Q1) -----------------------------------------------

export function launchAngle(): string {
  const parts: string[] = [];
  parts.push(line(20, 90, 200, 90, { width: 1.4 }));
  parts.push(line(60, 90, 60 + 70 * Math.cos(rad(62)), 90 - 70 * Math.sin(rad(62)), { head: "end", width: 1.6 }));
  parts.push(`<path d="M 85 90 A 25 25 0 0 0 ${f(60 + 25 * Math.cos(rad(62)))} ${f(90 - 25 * Math.sin(rad(62)))}" fill="none" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(txt(90, 80, "θ", { size: 12 }));
  return svg(220, 100, parts.join(""));
}

// ---- cannon on level ground (Newington 2022 Q5) ---------------------------------------

export function cannon(): string {
  const parts: string[] = [];
  parts.push(line(20, 70, 240, 70, { width: 1.2 }));
  parts.push(`<rect x="70" y="50" width="70" height="12" fill="#e2e8f0" stroke="${C.ink}" stroke-width="1" transform="rotate(-20 70 62)"/>`);
  parts.push(`<circle cx="92" cy="62" r="8" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(dot(150, 30, 3.5, C.ink));
  return svg(260, 80, parts.join(""));
}

// ---- several trajectories from one launch point (Newington 2022 Q13) ------------------

export function fourTrajectories(): string {
  const parts: string[] = [];
  const x0 = 40, y0 = 190;
  parts.push(line(x0, y0, x0, 14, { width: 1.4 }), line(x0, y0, 380, y0, { width: 1.4 }));
  parts.push(txt(x0 + 6, 20, "Height (y)", { size: 10 }), txt(370, y0 + 16, "Range (x)", { size: 10, anchor: "end" }));
  parts.push(parabola(x0, y0, 115, 170), parabola(x0, y0, 200, 145), parabola(x0, y0, 320, 90), parabola(x0, y0, 200, 40));
  parts.push(txt(x0 + 58, 14, "A", { size: 12 }), txt(x0 + 108, 40, "B", { size: 12 }), txt(x0 + 196, 92, "C", { size: 12 }), txt(x0 + 130, 146, "D", { size: 12 }));
  return svg(390, 210, parts.join(""));
}

// ---- ball thrown from S with points X, Y, Z (Normanhurst Boys 2020 Q1) ----------------

export function pathSXYZ(): string {
  const parts: string[] = [];
  const x0 = 30, y0 = 160;
  parts.push(line(20, y0, 340, y0, { width: 1 }));
  parts.push(parabola(x0, y0, 300, 140));
  const pt = (x: number, l: string, dx: number) => {
    const y = (4 * 140 * x * (300 - x)) / 90000;
    parts.push(dot(x0 + x, y0 - y, 3, C.ink), txt(x0 + x + dx, y0 - y - 6, l, { size: 12, italic: l === "X" }));
  };
  pt(55, "X", -14);
  pt(150, "Y", -3);
  pt(245, "Z", 6);
  parts.push(txt(x0 - 12, y0 - 2, "S", { size: 12 }));
  return svg(350, 175, parts.join(""));
}

// ---- golf hole map (North Sydney Boys 2020 Q2) ------------------------------------------

export function golfHoleMap(): string {
  const parts: string[] = [];
  const Y = (m: number) => 20 + (280 - m) * 5; // 280 m at the top, 220 m at the bottom
  for (let m = 220; m <= 280; m += 10) {
    parts.push(line(250, Y(m), 266, Y(m), { width: 1.2 }));
    parts.push(txt(272, Y(m) + 4, `${m} m`, { size: 11 }));
  }
  parts.push(`<rect x="80" y="${Y(278)}" width="150" height="${Y(266) - Y(278)}" rx="18" fill="#bfdbfe" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(txt(70, Y(271), "lake", { size: 11, anchor: "end" }));
  parts.push(`<circle cx="140" cy="${Y(250)}" r="${(Y(240) - Y(260)) / 2}" fill="#bbf7d0" stroke="${C.ink}" stroke-width="1.6"/>`);
  parts.push(txt(70, Y(249), "green", { size: 11, anchor: "end" }));
  parts.push(dot(160, Y(250), 3, C.ink), line(160, Y(250), 250, Y(250), { width: 1 }), txt(196, Y(250) - 4, "hole", { size: 10.5 }));
  parts.push(`<rect x="90" y="${Y(236)}" width="150" height="${Y(228) - Y(236)}" rx="12" fill="#fde68a" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(txt(80, Y(232), "sand", { size: 11, anchor: "end" }));
  parts.push(line(160, Y(250), 160, Y(221), { head: "end", width: 1.4 }));
  parts.push(txt(160, Y(220) + 12, "tee", { anchor: "middle", size: 11 }));
  parts.push(txt(150, 14, "Hole 12", { anchor: "middle", size: 13 }));
  return svg(330, Y(220) + 22, parts.join(""));
}

// ---- stone thrown from a cliff (North Sydney Boys 2022 Q1) -----------------------------

export function cliffThrow(): string {
  const parts: string[] = [];
  const cx = 80, top = 90, sea = 250;
  parts.push(line(cx, top, cx, sea, { width: 1.4 }), line(20, top, cx, top, { width: 1.4 }));
  parts.push(`<rect x="20" y="${top}" width="${cx - 20}" height="${sea - top}" fill="#e2e8f0"/>`);
  parts.push(txt(40, 170, "cliff", { size: 11 }));
  parts.push(`<path d="M ${cx} ${sea} Q 120 ${sea - 5} 160 ${sea} T 240 ${sea} T 320 ${sea}" fill="none" stroke="${C.a}" stroke-width="1"/>`);
  parts.push(txt(326, sea + 4, "sea", { size: 11 }));
  const pts: string[] = [];
  for (let k = 0; k <= 60; k++) {
    const t = k / 60;
    const x = cx + 220 * t;
    const y = top - 2 + (-200 * t + 362 * t * t);
    pts.push(`${f(x)},${f(y)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.3" marker-end="url(#ah)"/>`);
  parts.push(`<circle cx="${cx}" cy="${top - 2}" r="3" fill="#fff" stroke="${C.ink}"/>`, txt(cx + 8, top - 14, "v", { size: 11, italic: true }));
  const peakX = cx + 220 * (200 / 724), peakY = top - 2 - (200 * 200) / (4 * 362);
  parts.push(line(peakX, peakY, peakX, top - 4, { head: "both", width: 1 }), txt(peakX + 6, (peakY + top) / 2, "h", { size: 11, italic: true }));
  parts.push(line(cx, top, peakX + 20, top, { dash: "3 3", width: 0.8 }));
  parts.push(line(peakX, top + 4, peakX, sea - 2, { head: "both", width: 1 }), txt(peakX + 6, 180, "H", { size: 11, italic: true }));
  return svg(350, sea + 14, parts.join(""));
}

// ---- the effect of air resistance on a path (North Sydney Boys 2023 Q9) ---------------

export function airResistancePanels(): string {
  const parts: string[] = [];
  const panel = (ox: number, oy: number, label: string, solid: "shortLow" | "short" | "low" | "lowSame" | "ref") => {
    const x0 = ox + 34, y0 = oy + 92;
    parts.push(line(x0, y0, x0, oy + 10, { head: "end", width: 1 }), line(x0, y0, x0 + 150, y0, { head: "end", width: 1 }));
    if (label) parts.push(txt(ox + 6, oy + 18, label, { size: 11 }));
    if (solid === "ref") {
      parts.push(parabola(x0, y0, 120, 62, { width: 1.5 }));
      return;
    }
    parts.push(parabola(x0, y0, 120, 62, { dash: "4 3", width: 1 }));
    if (solid === "shortLow") {
      // lower and shorter, with a steeper descent
      const pts: string[] = [];
      for (let k = 0; k <= 50; k++) {
        const t = k / 50;
        pts.push(`${f(x0 + 92 * t - 10 * t * t * t)},${f(y0 - 4 * 46 * t * (1 - t) * (1 + 0.25 * t))}`);
      }
      parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`);
    }
    if (solid === "short") parts.push(parabola(x0, y0, 90, 62, { width: 1.5, to: 90 }));
    if (solid === "low") parts.push(parabola(x0, y0, 120, 38, { width: 1.5 }));
    if (solid === "lowSame") parts.push(parabola(x0, y0, 110, 38, { width: 1.5 }));
  };
  panel(80, 0, "", "ref");
  parts.push(txt(80 + 34 + 75, 112, "Path with no air resistance", { anchor: "middle", size: 10 }));
  panel(0, 130, "A", "shortLow");
  panel(200, 130, "B", "short");
  panel(0, 240, "C", "low");
  panel(200, 240, "D", "lowSame");
  return svg(400, 340, parts.join(""));
}

// ---- archer and target (North Sydney Girls 2020 Q14) -----------------------------------

export function archerTarget(): string {
  const parts: string[] = [];
  const g = 80;
  parts.push(line(20, g, 360, g, { width: 1 }));
  parts.push(line(44, g, 44, g - 40, { width: 2 }), `<circle cx="44" cy="${g - 46}" r="6" fill="#fff" stroke="${C.ink}"/>`);
  parts.push(line(48, g - 30, 80, g - 30, { head: "end", width: 1.2 }));
  for (const r of [16, 11, 6]) parts.push(`<circle cx="330" cy="${g - 30}" r="${r}" fill="${r === 6 ? C.b : "#fff"}" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(line(320, g - 14, 312, g, { width: 1.2 }), line(340, g - 14, 348, g, { width: 1.2 }));
  parts.push(line(44, g + 18, 330, g + 18, { head: "both", width: 1 }), txt(187, g + 14, "70.0 m", { anchor: "middle", size: 11 }));
  return svg(370, g + 26, parts.join(""));
}

// ---- three golf balls hit off a cliff (North Sydney Girls 2020 Q19) --------------------

export function cliffThreeBalls(): string {
  const parts: string[] = [];
  const cx = 60, top = 60, g = 170, land = 300;
  parts.push(`<rect x="20" y="${top}" width="${cx - 20}" height="${g - top}" fill="#e2e8f0" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(line(20, g, 330, g, { width: 1 }), txt(30, 120, "cliff", { size: 10 }), txt(200, g + 14, "ground", { size: 10 }));
  const path = (peak: number) => {
    const pts: string[] = [];
    // vertical: from top, rising by `peak` then falling to the ground; horizontal: linear to `land`
    const H = g - top;
    const T = (Math.sqrt(peak) + Math.sqrt(peak + H)) || 1;
    for (let k = 0; k <= 60; k++) {
      const s = (k / 60) * T;
      const y = top - (2 * Math.sqrt(peak) * s - s * s);
      pts.push(`${f(cx + ((land - cx) * s) / T)},${f(y)}`);
    }
    return `<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`;
  };
  parts.push(path(0), path(30), path(55));
  return svg(340, g + 20, parts.join(""));
}

// ---- water leaving a pipe on a platform (North Sydney Girls 2022 Q4) -------------------

export function waterPipe(): string {
  const parts: string[] = [];
  const x = 120, top = 60, g = 150;
  parts.push(`<rect x="70" y="${top}" width="${x - 70}" height="${g - top}" fill="#fff" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(txt(95, 110, "platform", { anchor: "middle", size: 10.5 }));
  parts.push(`<rect x="60" y="${top - 12}" width="${x - 58}" height="9" fill="#e2e8f0" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(txt(90, top - 18, "water pipe", { anchor: "middle", size: 10.5 }));
  parts.push(line(x + 4, top - 8, x + 50, top - 8, { head: "end", width: 1.2 }), txt(x + 26, top - 14, "4.5 m s⁻¹", { size: 10.5 }));
  const pts: string[] = [];
  for (let k = 0; k <= 40; k++) {
    const t = k / 40;
    pts.push(`${f(x + 120 * t)},${f(top - 8 + (g - top + 8) * t * t)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="3 3"/>`);
  parts.push(line(60, g, 300, g, { width: 1.2 }), txt(180, g + 14, "ground", { anchor: "middle", size: 10.5 }));
  parts.push(line(56, top, 56, g, { head: "both", width: 1 }), txt(50, 108, "9.5 m", { anchor: "end", size: 10.5 }));
  parts.push(txt(260, 96, "NOT TO", { size: 10 }), txt(260, 109, "SCALE", { size: 10 }));
  return svg(310, g + 20, parts.join(""));
}

// ---- stroboscope positions on a grid (North Sydney Girls 2023 Q12) -------------------

export function stroboscopeGraph(points: Array<[number, number]>): string {
  const L = 52, T = 14, P = 240;
  const X = (x: number) => L + (x / 100) * P;
  const Y = (y: number) => T + P - (y / 100) * P;
  const parts: string[] = [];
  for (let k = 0; k <= 25; k++) {
    const v = k * 4;
    parts.push(line(X(v), T, X(v), T + P, { color: k % 5 === 0 ? C.guide : C.grid, width: k % 5 === 0 ? 0.8 : 0.5 }));
    parts.push(line(L, Y(v), L + P, Y(v), { color: k % 5 === 0 ? C.guide : C.grid, width: k % 5 === 0 ? 0.8 : 0.5 }));
  }
  for (let v = 0; v <= 100; v += 20) {
    parts.push(txt(X(v), T + P + 14, String(v), { anchor: "middle", size: 10 }));
    if (v) parts.push(txt(L - 6, Y(v) + 3.5, String(v), { anchor: "end", size: 10 }));
  }
  parts.push(txt(L + P / 2, T + P + 32, "Horizontal displacement (m)", { anchor: "middle", size: 10.5 }));
  parts.push(`<text x="16" y="${T + P / 2}" fill="${C.text}" font-size="10.5" font-family="${FONT}" text-anchor="middle" transform="rotate(-90 16 ${T + P / 2})">Vertical displacement (m)</text>`);
  for (const [x, y] of points) parts.push(dot(X(x), Y(y), 4, C.ink));
  return svg(L + P + 12, T + P + 40, parts.join(""));
}

// ---- small mass–table (Pymble 2022 Q3) uses dataTable; graphs of U against t (Shore 2020 Q2) ----

export function energyTimeGraphs(): string {
  const parts: string[] = [];
  const panel = (ox: number, oy: number, label: string, hump: boolean, downAxis: boolean) => {
    const x0 = ox + 40, top = oy + 10, bot = oy + 100;
    parts.push(txt(ox + 6, oy + 18, label, { size: 11 }));
    if (!downAxis) {
      parts.push(line(x0, bot, x0, top, { head: "end", width: 1.2 }), line(x0, bot, x0 + 120, bot, { head: "end", width: 1.2 }));
      parts.push(txt(x0 - 10, top + 14, "U", { size: 11, anchor: "end" }), txt(x0 + 112, bot + 16, "t", { size: 11, italic: true }));
    } else {
      parts.push(line(x0, top, x0, bot, { head: "end", width: 1.2 }), line(x0, top, x0 + 120, top, { head: "end", width: 1.2 }));
      parts.push(txt(x0 - 10, bot, "U", { size: 11, anchor: "end" }), txt(x0 + 112, top - 6, "t", { size: 11, italic: true }));
    }
    const pts: string[] = [];
    for (let k = 0; k <= 30; k++) {
      const t = k / 30;
      const shape = 4 * t * (1 - t);
      const yy = downAxis ? (hump ? top + 60 - 45 * shape : top + 15 + 45 * shape) : hump ? bot - 15 - 45 * shape : bot - 60 + 45 * shape;
      pts.push(`${f(x0 + 6 + 100 * t)},${f(yy)}`);
    }
    parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.a}" stroke-width="1.5"/>`);
  };
  panel(0, 0, "A", true, false);
  panel(190, 0, "B", false, false);
  panel(0, 120, "C", true, true);
  panel(190, 120, "D", false, true);
  return svg(390, 240, parts.join(""));
}

// ---- speed against time graphs (Shore 2021 Q4) -------------------------------------------

export function speedTimeGraphs(): string {
  const parts: string[] = [];
  const panel = (ox: number, oy: number, label: string, kind: "vZero" | "vMin" | "curveMin" | "curveZero") => {
    const x0 = ox + 34, top = oy + 14, bot = oy + 110, w = 140;
    parts.push(txt(ox + 4, oy + 16, label, { size: 11 }));
    parts.push(line(x0, bot, x0, top, { head: "end", width: 1.2 }), line(x0, bot, x0 + w, bot, { head: "end", width: 1.2 }));
    parts.push(txt(x0 - 8, top + 22, "v", { size: 11, italic: true, anchor: "end" }), txt(x0 - 8, bot + 4, "0", { size: 10, anchor: "end" }), txt(x0 + w + 4, bot + 4, "t", { size: 11, italic: true }));
    const vy = top + 18;
    const pts: string[] = [];
    for (let k = 0; k <= 40; k++) {
      const t = k / 40;
      let y: number;
      if (kind === "vZero") y = vy + (bot - vy) * (1 - Math.abs(2 * t - 1));
      else if (kind === "vMin") y = vy + 40 * (1 - Math.abs(2 * t - 1));
      else if (kind === "curveMin") y = bot - Math.sqrt(0.35 ** 2 + (1 - 2 * t) ** 2 * (1 - 0.35 ** 2)) * (bot - vy);
      else y = bot - Math.abs(1 - 2 * t) ** 1.6 * (bot - vy);
      pts.push(`${f(x0 + 4 + (w - 16) * t)},${f(y)}`);
    }
    parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="2"/>`);
  };
  panel(0, 0, "A", "vZero");
  panel(200, 0, "B", "vMin");
  panel(0, 125, "C", "curveMin");
  panel(200, 125, "D", "curveZero");
  return svg(390, 250, parts.join(""));
}

// ---- horizontal and vertical velocity–time graph pairs (Sydney Girls 2020 Q4) -----------

export function velocityTimePairs(): string {
  const parts: string[] = [];
  const graph = (ox: number, oy: number, label: string, kind: "const" | "rise" | "fall") => {
    const x0 = ox + 60, top = oy + 6, bot = oy + 66, w = 70;
    parts.push(txt(ox + 52, oy + 24, label, { size: 10, anchor: "end" }), txt(ox + 52, oy + 37, "velocity", { size: 10, anchor: "end" }));
    parts.push(line(x0, bot, x0, top, { head: "end", width: 1.1 }), line(x0, bot, x0 + w + 8, bot, { head: "end", width: 1.1 }));
    parts.push(txt(x0 + w - 6, bot + 14, "time", { size: 10 }));
    if (kind === "const") parts.push(`<polyline points="${x0},${top + 16} ${x0 + w},${top + 16} ${x0 + w},${bot}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);
    if (kind === "rise") parts.push(`<polyline points="${x0},${bot} ${x0 + w},${top + 14} ${x0 + w},${bot}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);
    if (kind === "fall") parts.push(`<polyline points="${x0},${top + 14} ${x0 + w},${bot}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);
  };
  const rows: Array<[string, "const" | "rise" | "fall", "const" | "rise" | "fall"]> = [["A", "const", "rise"], ["B", "fall", "rise"], ["C", "rise", "const"], ["D", "fall", "fall"]];
  rows.forEach(([l, h, v], i) => {
    const oy = i * 84;
    parts.push(txt(4, oy + 40, l, { size: 11 }));
    graph(20, oy, "horizontal", h);
    graph(190, oy, "vertical", v);
  });
  return svg(340, 4 * 84, parts.join(""));
}

// ---- car rolling down a hill and off a cliff (Sydney Grammar 2020 Q4–5) ------------------

export function carHillCliff(): string {
  const parts: string[] = [];
  const xX = 60, yX = 40, yY = 120, cliffX = 220, sea = 200;
  parts.push(`<path d="M 30 ${yX} L ${xX} ${yX} C 110 ${yX}, 120 ${yY}, 160 ${yY} L ${cliffX} ${yY} L ${cliffX} ${sea} L 30 ${sea} Z" fill="#e2e8f0" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(`<rect x="${xX - 14}" y="${yX - 12}" width="22" height="10" rx="3" fill="${C.ink}"/>`);
  parts.push(txt(xX + 12, yX + 12, "X", { size: 10 }), txt(cliffX - 4, yY - 6, "Y", { size: 10 }));
  parts.push(line(xX, yX + 2, xX, yY - 2, { head: "both", width: 0.9 })); // h: from X down to the level of Y
  parts.push(txt(xX - 6, (yX + yY) / 2, "h", { size: 11, italic: true, anchor: "end" }));
  parts.push(line(cliffX - 10, yY + 2, cliffX - 10, sea - 2, { head: "both", width: 0.9 }), txt(cliffX - 16, 165, "H", { size: 11, italic: true, anchor: "end" }));
  const pts: string[] = [];
  for (let k = 0; k <= 30; k++) {
    const t = k / 30;
    pts.push(`${f(cliffX + 70 * t)},${f(yY + (sea - yY) * t * t)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="3 2"/>`);
  parts.push(`<path d="M ${cliffX} ${sea} q 10 -5 20 0 t 20 0 t 20 0 t 20 0 t 20 0" fill="none" stroke="${C.a}" stroke-width="1"/>`);
  parts.push(txt(cliffX + 74, sea - 4, "Z", { size: 10 }));
  parts.push(line(cliffX, sea + 14, cliffX + 70, sea + 14, { head: "both", width: 0.9 }), txt(cliffX + 35, sea + 28, "d", { size: 11, italic: true, anchor: "middle" }));
  return svg(330, sea + 34, parts.join(""));
}

// =====================================================================================
// Projectile short-answer diagrams
// =====================================================================================

/** Scatter of positions on a grid with labelled axes (strobe photographs, position graphs). */
export function pointsGraph(o: {
  xMax: number;
  yMax: number;
  xStep: number;
  yStep: number;
  xLabel: string;
  yLabel: string;
  points: Array<[number, number]>;
  marks?: Array<{ at: [number, number]; label: string }>;
  minor?: number;
  width?: number;
  height?: number;
  curve?: Array<[number, number]>;
}): string {
  const L = 52, T = 12, PW = o.width ?? 300, PH = o.height ?? 200;
  const X = (x: number) => L + (x / o.xMax) * PW;
  const Y = (y: number) => T + PH - (y / o.yMax) * PH;
  const parts: string[] = [];
  const minor = o.minor ?? 5;
  for (let k = 0; k <= Math.round((o.xMax / o.xStep) * minor); k++) {
    const x = (k * o.xStep) / minor;
    parts.push(line(X(x), T, X(x), T + PH, { color: k % minor === 0 ? C.guide : C.grid, width: k % minor === 0 ? 0.8 : 0.5 }));
  }
  for (let k = 0; k <= Math.round((o.yMax / o.yStep) * minor); k++) {
    const y = (k * o.yStep) / minor;
    parts.push(line(L, Y(y), L + PW, Y(y), { color: k % minor === 0 ? C.guide : C.grid, width: k % minor === 0 ? 0.8 : 0.5 }));
  }
  const fmt = (v: number) => String(+v.toFixed(2));
  for (let x = 0; x <= o.xMax + 1e-9; x += o.xStep) parts.push(txt(X(x), T + PH + 13, fmt(x), { anchor: "middle", size: 9.5 }));
  for (let y = 0; y <= o.yMax + 1e-9; y += o.yStep) parts.push(txt(L - 5, Y(y) + 3.5, fmt(y), { anchor: "end", size: 9.5 }));
  parts.push(txt(L + PW / 2, T + PH + 30, o.xLabel, { anchor: "middle", size: 10.5 }));
  parts.push(
    `<text x="14" y="${T + PH / 2}" fill="${C.text}" font-size="10.5" font-family="${FONT}" text-anchor="middle" transform="rotate(-90 14 ${T + PH / 2})">${esc(o.yLabel)}</text>`,
  );
  if (o.curve) parts.push(`<polyline points="${o.curve.map(([x, y]) => `${f(X(x))},${f(Y(y))}`).join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);
  for (const [x, y] of o.points) parts.push(dot(X(x), Y(y), 3.5, C.ink));
  for (const m of o.marks ?? []) parts.push(txt(X(m.at[0]) - 10, Y(m.at[1]) - 8, m.label, { size: 13, bold: true, anchor: "end" }));
  return svg(L + PW + 14, T + PH + 38, parts.join(""));
}

/** A launch from the top of a cliff or tower: launcher, cliff height, optional angle, speed, path and range. */
export function cliffLaunch(o: {
  heightLabel: string;
  speedLabel?: string;
  angle?: number; // degrees above horizontal; 0 for a horizontal launch
  rangeLabel?: string;
  pathHeight?: number; // px the path rises above the launch point
  launcherHeight?: string; // e.g. "1.5 m" for a cannon above the cliff top
  ground?: "ground" | "sea";
  target?: "ship";
  note?: string;
  angleLabel?: boolean; // default true
  markTop?: string; // label at the highest point
  markLevel?: string; // label where the path returns to launch level (draws a dashed level line)
}): string {
  const parts: string[] = [];
  const cx = 120, top = 90, base = 230, land = 360;
  const ang = o.angle ?? 0;
  parts.push(`<rect x="${cx - 50}" y="${top}" width="50" height="${base - top}" fill="#e2e8f0" stroke="${C.ink}" stroke-width="0.8"/>`);
  const ly = o.launcherHeight ? top - 16 : top;
  if (o.launcherHeight) {
    parts.push(line(cx - 6, top, cx - 6, ly, { width: 2 }));
    parts.push(line(cx + 12, ly, cx + 12, top, { head: "both", width: 0.9 }), txt(cx + 16, top - 4, o.launcherHeight, { size: 10 }));
  }
  parts.push(dot(cx - 4, ly, 4, C.ink));
  if (o.ground === "sea") parts.push(`<path d="M ${cx} ${base} q 10 -4 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0" fill="none" stroke="${C.a}" stroke-width="1"/>`);
  else parts.push(line(cx, base, 390, base, { width: 1.2 }));
  if (o.heightLabel) {
    parts.push(line(cx - 58, top + 2, cx - 58, base - 2, { head: "both", width: 1 }));
    parts.push(txt(cx - 62, (top + base) / 2, o.heightLabel, { size: 11, anchor: "end" }));
  }
  // path: quadratic in t from launch point to landing point, rising pathHeight first
  const rise = o.pathHeight ?? (ang > 0 ? 40 : 0);
  const H = base - ly;
  const pts: string[] = [];
  const a = H + 2 * rise + 2 * Math.sqrt(rise * (rise + H)); // y(t) = ly - b t + a t² with y(1) = base
  const b = a - H;
  for (let k = 0; k <= 50; k++) {
    const t = k / 50;
    pts.push(`${f(cx - 4 + (land - cx + 4) * t)},${f(ly - b * t + a * t * t)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-dasharray="4 3"/>`);
  const at = (t: number): [number, number] => [cx - 4 + (land - cx + 4) * t, ly - b * t + a * t * t];
  if (o.markTop) {
    const [x, y] = at(b / (2 * a));
    parts.push(dot(x, y, 2.5, C.ink), txt(x, y - 7, o.markTop, { anchor: "middle", size: 11, bold: true }));
  }
  if (o.markLevel) {
    const [x, y] = at(b / a);
    parts.push(line(cx, ly, 400, ly, { dash: "3 3", width: 0.7, color: C.guide }));
    parts.push(dot(x, y, 2.5, C.ink), txt(x + 6, y - 6, o.markLevel, { size: 11, bold: true }));
  }
  if (ang > 0) {
    const vx = 36 * Math.cos(rad(ang)), vy = 36 * Math.sin(rad(ang));
    parts.push(line(cx - 4, ly, cx - 4 + vx, ly - vy, { head: "end", width: 1.6, color: C.b }));
    parts.push(line(cx - 4, ly, cx + 40, ly, { dash: "3 2", width: 0.8 }));
    if (o.angleLabel !== false) parts.push(txt(cx + 36, ly - 4, `${ang}°`, { size: 10.5 }));
  } else {
    parts.push(line(cx, ly, cx + 36, ly, { head: "end", width: 1.6, color: C.b }));
  }
  if (o.speedLabel) parts.push(txt(cx - 4 + 30 * Math.cos(rad(ang)), ly - 30 * Math.sin(rad(ang)) - 10, o.speedLabel, { size: 10.5, anchor: "middle" }));
  if (o.rangeLabel) {
    parts.push(line(cx, base + 14, land, base + 14, { head: "both", width: 1 }));
    parts.push(txt((cx + land) / 2, base + 28, o.rangeLabel, { anchor: "middle", size: 11 }));
  }
  if (o.target === "ship") {
    parts.push(`<path d="M ${land + 6} ${base - 4} l 34 0 l -6 10 l -24 0 z" fill="${C.ink}"/>`, `<path d="M ${land + 22} ${base - 4} l 0 -34 l -14 30 z" fill="${C.ink}"/>`);
  }
  if (o.note) parts.push(txt(400, 30, o.note, { size: 10, anchor: "end" }));
  return svg(410, base + 34, parts.join(""));
}

// ---- tennis ball leaving a racket (Abbotsleigh 2025 Q22) -------------------------------

export function tennisImages(): string {
  const parts: string[] = [];
  const y = 50;
  const xs = [30, 52, 76, 100];
  ["A", "B", "C", "D"].forEach((l, i) => {
    const x = xs[i];
    parts.push(`<ellipse cx="${x}" cy="${y + 4}" rx="7" ry="20" fill="none" stroke="${C.ink}" stroke-width="2.2"/>`);
    parts.push(line(x - 2, y + 24, x - 8, y + 64, { width: 3 }));
    parts.push(`<circle cx="${x + 4}" cy="${y}" r="6" fill="#fff" stroke="${C.ink}" stroke-width="1"/>`);
    parts.push(txt(x + 6, y + 18, l, { size: 9 }));
  });
  const bxs = [138, 176, 214, 252];
  ["E", "F", "G", ""].forEach((l, i) => {
    parts.push(`<circle cx="${bxs[i]}" cy="${y}" r="6" fill="#fff" stroke="${C.ink}" stroke-width="1"/>`);
    if (l) parts.push(txt(bxs[i] + 6, y + 16, l, { size: 9 }));
  });
  parts.push(txt(30, 14, "racket", { size: 10 }), txt(176, 22, "ball", { size: 10, anchor: "middle" }));
  parts.push(line(104, y + 30, 214, y + 30, { head: "both", width: 1 }), txt(159, y + 44, "0.68 m", { anchor: "middle", size: 10 }));
  parts.push(line(104, y + 6, 104, y + 34, { dash: "2 2", width: 0.8 }), line(214, y + 6, 214, y + 34, { dash: "2 2", width: 0.8 }));
  return svg(280, 130, parts.join(""));
}

// ---- object clearing a hill (Ascham 2024 Q21) ---------------------------------------

export function hillClear(): string {
  const parts: string[] = [];
  const g = 150, x0 = 40;
  parts.push(line(20, g, 380, g, { width: 1.2 }));
  parts.push(parabola(x0, g, 320, 120, { dash: "4 3", width: 1 }));
  parts.push(`<path d="M 140 ${g} L 175 ${g - 100} L 200 ${g - 70} L 215 ${g} Z" fill="#d6a77a" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(line(x0, g, x0 + 40 * Math.cos(rad(50)), g - 40 * Math.sin(rad(50)), { head: "end", width: 1.8, color: C.b }));
  parts.push(txt(x0 + 34, g - 40, "80 m/s", { size: 10.5 }), txt(x0 + 22, g - 6, "50°", { size: 10 }));
  parts.push(line(176, g - 100, 250, g - 100, { dash: "2 2", width: 0.8 }), line(244, g - 100, 244, g, { head: "both", width: 1 }), txt(250, g - 50, "h", { size: 11, italic: true }));
  parts.push(line(x0, g + 12, 175, g + 12, { head: "both", width: 1 }), txt(108, g + 26, "d", { anchor: "middle", size: 11, italic: true }));
  return svg(390, g + 32, parts.join(""));
}

// ---- toy cannon aimed at a target on a windowsill (Barker 2021 Q24) -----------------------

export function sinkTarget(): string {
  const parts: string[] = [];
  const s = 160; // px per metre
  const x0 = 30, g = 200;
  const cab = x0 + 0.85 * s, tx = cab + 0.6 * s, bench = g - 0.9 * s, ty = bench - 0.06 * s;
  parts.push(line(10, g, tx + 30, g, { width: 1.2 }));
  parts.push(`<rect x="${cab}" y="${bench}" width="${tx - cab + 10}" height="${g - bench}" fill="#e2e8f0" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(`<rect x="${tx + 2}" y="${ty - 90}" width="10" height="90" fill="#cbd5e1" stroke="${C.ink}" stroke-width="0.6"/>`);
  parts.push(txt(tx + 20, ty - 50, "window", { size: 10 }));
  parts.push(`<circle cx="${tx}" cy="${ty}" r="6" fill="#fff" stroke="${C.b}" stroke-width="2"/>`, txt(tx - 10, ty + 4, "TARGET", { size: 11, bold: true, color: C.b, anchor: "end" }));
  parts.push(`<rect x="${x0 - 6}" y="${g - 14}" width="16" height="10" fill="${C.b}" transform="rotate(-65 ${x0} ${g - 8})"/>`);
  parts.push(line(x0, g + 14, cab, g + 14, { head: "both", width: 1 }), txt((x0 + cab) / 2, g + 28, "0.85 m", { anchor: "middle", size: 10.5 }));
  parts.push(line(cab, bench - 40, tx, bench - 40, { head: "both", width: 1 }), txt((cab + tx) / 2, bench - 46, "0.60 m", { anchor: "middle", size: 10.5 }));
  parts.push(line(cab - 12, bench, cab - 12, g, { head: "both", width: 1 }), txt(cab - 16, (bench + g) / 2, "0.90 m", { anchor: "end", size: 10.5 }));
  parts.push(line(tx + 40, ty, tx + 40, bench, { head: "both", width: 1 }), txt(tx + 46, ty + 8, "0.060 m", { size: 10.5 }));
  parts.push(line(tx - 4, bench, tx + 30, bench, { dash: "2 2", width: 0.7 }), line(tx - 4, ty, tx + 44, ty, { dash: "2 2", width: 0.7 }));
  parts.push(txt(60, 30, "NOT TO SCALE", { size: 11 }));
  return svg(tx + 110, g + 34, parts.join(""));
}

// ---- spring launcher on a platform with a moving cup (Cherrybrook Tech 2025 Q31) -------

export function launcherCup(): string {
  const parts: string[] = [];
  const g = 140, px = 50, top = 50;
  parts.push(`<rect x="${px}" y="${top}" width="24" height="${g - top}" fill="#fff" stroke="${C.ink}" stroke-width="1"/>`);
  for (let y = top + 12; y < g; y += 12) parts.push(line(px, y, px + 24, y, { width: 0.5 }));
  parts.push(`<rect x="${px + 4}" y="${top - 18}" width="34" height="9" fill="#e2e8f0" stroke="${C.ink}" stroke-width="1" transform="rotate(-35 ${px + 10} ${top - 10})"/>`);
  parts.push(line(px + 20, top - 10, px + 70, top - 10, { dash: "2 2", width: 0.8 }), txt(px + 56, top - 16, "35°", { size: 10 }));
  parts.push(line(px - 12, top - 8, px - 12, g, { head: "both", width: 1 }), txt(px - 16, (top + g) / 2, "2.6 m", { size: 10.5, anchor: "end" }));
  parts.push(parabola(px + 30, top - 20, 220, 30, { dash: "4 3", width: 1, to: 250 }));
  parts.push(line(20, g, 340, g, { width: 1.2 }));
  parts.push(`<rect x="${px + 30}" y="${g - 14}" width="14" height="14" fill="#fff" stroke="${C.ink}"/>`, line(px + 48, g - 7, px + 70, g - 7, { head: "end", width: 1.2 }), txt(px + 60, g - 12, "v", { size: 10.5, italic: true }));
  parts.push(`<rect x="${px + 270}" y="${g - 14}" width="14" height="14" fill="#fff" stroke="${C.ink}"/>`, txt(px + 266, g - 4, "cup", { size: 10.5, anchor: "end" }));
  return svg(350, g + 10, parts.join(""));
}

// ---- catapult (Girraween 2020 Q22) ------------------------------------------------------

export function catapult(): string {
  const parts: string[] = [];
  const g = 110;
  parts.push(line(20, g, 360, g, { width: 1.2 }));
  parts.push(`<rect x="40" y="${g - 10}" width="60" height="6" fill="#e2e8f0" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(`<circle cx="48" cy="${g - 3}" r="4" fill="#fff" stroke="${C.ink}"/>`, `<circle cx="92" cy="${g - 3}" r="4" fill="#fff" stroke="${C.ink}"/>`);
  parts.push(line(60, g - 10, 80, g - 40, { width: 2.5 }));
  parts.push(dot(84, g - 46, 5, C.a));
  parts.push(line(26, g - 46, 26, g, { head: "both", width: 1 }), txt(22, g - 20, "4 m", { size: 10.5, anchor: "end" }));
  parts.push(dot(290, g - 4, 5, C.a));
  return svg(370, g + 10, parts.join(""));
}

// ---- rugby posts and a kick that just clears the crossbar (Girraween 2023 Q21) -----------

export function rugbyKick(): string {
  const parts: string[] = [];
  const g = 140, kx = 330, px = 70;
  parts.push(line(20, g, 360, g, { width: 1.2 }), txt(200, g + 14, "horizontal ground", { anchor: "middle", size: 10 }));
  parts.push(line(px, g, px, 20, { width: 3 }));
  parts.push(line(px - 12, g - 40, px + 12, g - 40, { width: 3 }), txt(px + 16, g - 34, "crossbar", { size: 10 }));
  parts.push(line(px - 26, g - 40, px - 26, g, { head: "both", width: 1 }), txt(px - 30, g - 18, "3.00 m", { size: 10, anchor: "end" }));
  // path from kick point (right) leftwards, passing just over the crossbar on the way down
  const pts: string[] = [];
  for (let k = 0; k <= 50; k++) {
    const t = k / 50;
    const x = kx - (kx - px + 20) * t;
    const y = g - 4 * 100 * t * (1 - t) * 1.05 + 0;
    pts.push(`${f(x)},${f(y)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.3"/>`);
  parts.push(line(kx, g, kx - 30, g - 36, { head: "end", width: 1.6, color: C.b }), txt(kx - 30, g - 42, "20 m s⁻¹", { size: 10 }));
  parts.push(txt(kx - 40, g - 6, "40°", { size: 10 }));
  return svg(370, g + 22, parts.join(""));
}

// ---- launch from a lookout and a moving helicopter (Girraween 2024 Q21) ----------------

export function lookoutCliff(): string {
  return cliffLaunch({ heightLabel: "", ground: "sea", note: "NOT TO SCALE", pathHeight: 0 });
}

// ---- rocket on a launch stand (Caringbah 2024 Q32) ------------------------------------

export function rocketLaunch(): string {
  const parts: string[] = [];
  const g = 110, x0 = 60;
  parts.push(line(20, g, 300, g, { width: 1.2 }));
  parts.push(`<path d="M ${x0} ${g} l 60 0" stroke="${C.ink}" stroke-width="2"/>`);
  const dx = Math.cos(rad(20)), dy = Math.sin(rad(20));
  parts.push(line(x0 + 20, g - 2, x0 + 20 + 110 * dx, g - 2 - 110 * dy, { width: 6, color: C.guide }));
  parts.push(line(x0 + 130 * dx, g - 130 * dy, x0 + 190 * dx, g - 190 * dy, { head: "end", width: 1.4, dash: "4 3" }));
  parts.push(`<path d="M ${x0 + 60} ${g} A 40 40 0 0 0 ${f(x0 + 20 + 40 * dx)} ${f(g - 40 * dy)}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(txt(x0 + 64, g - 6, "20.0°", { size: 10 }));
  return svg(310, g + 10, parts.join(""));
}

// ---- shared stick figure ---------------------------------------------------------------

function person(x: number, g: number, h = 60, o: { armTo?: [number, number] } = {}): string {
  const head = h * 0.12, neck = g - h + 2 * head, hip = g - h * 0.45;
  const parts = [
    `<circle cx="${f(x)}" cy="${f(g - h + head)}" r="${f(head)}" fill="#fff" stroke="${C.ink}" stroke-width="1.4"/>`,
    line(x, neck, x, hip, { width: 1.6 }),
    line(x, hip, x - h * 0.14, g, { width: 1.6 }),
    line(x, hip, x + h * 0.14, g, { width: 1.6 }),
    line(x, neck + h * 0.08, x - h * 0.16, neck + h * 0.3, { width: 1.4 }),
  ];
  const [ax, ay] = o.armTo ?? [x + h * 0.18, neck + h * 0.28];
  parts.push(line(x, neck + h * 0.08, ax, ay, { width: 1.4 }));
  return parts.join("");
}

// ---- Paul kicks, Quinn runs and catches (James Ruse 2020 Q22) ----------------------------

export function kickAndCatch(): string {
  const parts: string[] = [];
  // perspective sketch: ground points P, Q, R
  const P: [number, number] = [50, 120], Q: [number, number] = [120, 170], R: [number, number] = [240, 95];
  parts.push(line(P[0], P[1], R[0], R[1], { dash: "4 3", width: 1 }), txt((P[0] + R[0]) / 2 - 8, (P[1] + R[1]) / 2 - 6, "s", { size: 11, italic: true }));
  parts.push(line(Q[0], Q[1], R[0], R[1], { width: 1 }), line(Q[0], Q[1], P[0], P[1], { width: 0.8, color: C.guide }));
  parts.push(line(Q[0] + 30, Q[1] + 4, Q[0] + 62, Q[1] - 16, { head: "end", width: 1.3, color: C.b }), txt(Q[0] + 66, Q[1] - 6, "Quinn runs", { size: 9.5 }));
  parts.push(txt((Q[0] + R[0]) / 2 + 10, (Q[1] + R[1]) / 2 + 14, "d", { size: 11, italic: true }));
  for (const [p, l, dx, dy] of [[P, "P", -12, 6], [Q, "Q", -4, 16], [R, "R", 6, 4]] as Array<[[number, number], string, number, number]>)
    parts.push(dot(p[0], p[1], 3, C.ink), txt(p[0] + dx, p[1] + dy, l, { size: 11, bold: true }));
  parts.push(txt(P[0] + 26, P[1] + 2, "θ", { size: 10.5, italic: true }));
  // ball path above P→R
  const pts: string[] = [];
  for (let k = 0; k <= 40; k++) {
    const t = k / 40;
    pts.push(`${f(P[0] + (R[0] - P[0]) * t)},${f(P[1] - 6 + (R[1] - P[1] + 6) * t - 150 * t * (1 - t) * 0.95 - 8 * t)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-dasharray="4 3"/>`);
  parts.push(dot(P[0], P[1] - 6, 4, C.a));
  parts.push(line(P[0], P[1] - 6, P[0], P[1] - 40, { head: "end", width: 1.3 }), txt(P[0] - 4, P[1] - 44, "uᵧ", { size: 10, anchor: "end" }));
  parts.push(line(P[0], P[1] - 6, P[0] + 30, P[1] - 14, { head: "end", width: 1.3 }), txt(P[0] + 32, P[1] - 18, "uₓ", { size: 10 }));
  parts.push(txt(10, 20, "Figure 1", { size: 10.5, bold: true }));
  // side view for part (b)
  const ox = 290, g = 170, sP = ox + 20, sR = ox + 200, k = 12; // px per metre vertically
  parts.push(line(ox, g, ox + 230, g, { width: 1.2 }));
  parts.push(dot(sP, g, 3, C.ink), txt(sP, g + 14, "P", { size: 11, bold: true, anchor: "middle" }));
  parts.push(dot(sR, g, 3, C.ink), txt(sR, g + 14, "R", { size: 11, bold: true, anchor: "middle" }));
  const y0 = g - 1 * k, y1 = g - 3 * k;
  const sp: string[] = [];
  for (let j = 0; j <= 40; j++) {
    const t = j / 40, tt = 2.27 * t;
    const y = 1 + 12 * tt - 4.9 * tt * tt;
    sp.push(`${f(sP + (sR - sP) * t)},${f(g - y * k)}`);
  }
  parts.push(`<polyline points="${sp.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-dasharray="4 3"/>`);
  parts.push(dot(sP, y0, 3.5, C.a), dot(sR, y1, 3.5, C.a));
  parts.push(txt(sP - 4, y0 - 4, "1.00 m", { size: 9.5, anchor: "end" }), txt(sR + 6, y1 + 4, "3.00 m", { size: 9.5 }));
  parts.push(line(sP, y0, sP, g, { dash: "2 2", width: 0.7 }), line(sR, y1, sR, g, { dash: "2 2", width: 0.7 }));
  parts.push(txt(ox, 20, "Part (b)", { size: 10.5, bold: true }));
  return svg(540, 190, parts.join(""));
}

// ---- child throwing a fish from a coracle (James Ruse 2022 Q31) ---------------------------

export function coracleThrow(): string {
  const parts: string[] = [];
  const ox = 120, oy = 90, s = 120; // origin at the hand, px per metre
  parts.push(line(ox, 170, ox, 20, { head: "end", width: 1 }), txt(ox - 8, 22, "y", { size: 12, italic: true, anchor: "end" }));
  parts.push(line(40, oy, ox + 1.35 * s, oy, { head: "end", width: 1 }), txt(ox + 1.35 * s + 4, oy + 4, "x", { size: 12, italic: true }));
  // boat and child
  parts.push(`<path d="M 40 112 L 112 112 Q 106 140 76 142 Q 48 140 40 112 Z" fill="#e2e8f0" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(person(78, 112, 46, { armTo: [ox, oy] }));
  // trajectory: x = 4.924 t, y = 0.868 t − 4.9 t²
  const pts: string[] = [];
  for (let k = 0; k <= 40; k++) {
    const t = (k / 40) * 0.2437;
    pts.push(`${f(ox + 4.924 * t * s)},${f(oy - (0.868 * t - 4.9 * t * t) * s)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(line(ox, oy, ox + 34 * Math.cos(rad(10)), oy - 34 * Math.sin(rad(10)), { head: "end", width: 1.5, color: C.b }));
  parts.push(txt(ox + 30, oy + 14, "10°", { size: 10 }), txt(ox + 40, oy - 22, "trajectory of fish", { size: 10 }));
  const xl = ox + 1.2 * s, yl = oy + 0.0794 * s;
  parts.push(line(xl, oy - 4, xl, oy + 4, { width: 1 }), txt(xl + 4, oy - 6, "1.2 m", { size: 10 }));
  parts.push(line(ox - 4, yl, ox + 4, yl, { width: 1 }), subTxt(ox + 7, yl + 4, "y", "f", { size: 11, italic: true }));
  parts.push(`<path d="M ${ox + 40} ${yl + 14} Q ${ox + 90} ${yl - 4} ${ox + 170} ${yl + 2} L ${ox + 170} ${yl + 14}" fill="#d6c7a1" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(txt(ox + 120, yl + 28, "Riverbank", { size: 10, anchor: "middle" }));
  parts.push(line(30, yl + 14, ox + 170, yl + 14, { width: 1, color: C.a }));
  return svg(300, 200, parts.join(""));
}

// ---- person launching a ball from hand height (James Ruse 2024 Q27, Knox 2021 Q22) -------

export function personLaunch(o: { height: string; speed: string; angle: number; dog?: boolean }): string {
  const parts: string[] = [];
  const g = 150, hx = 110, hy = 70;
  parts.push(line(20, g, 340, g, { width: 1.2 }));
  parts.push(person(80, g, 80, { armTo: [hx, hy] }));
  parts.push(dot(hx, hy, 4, C.a));
  const L = 50;
  parts.push(line(hx, hy, hx + L * Math.cos(rad(o.angle)), hy - L * Math.sin(rad(o.angle)), { head: "end", width: 1.6, color: C.b }));
  parts.push(line(hx, hy, hx + 70, hy, { dash: "3 2", width: 0.8 }));
  parts.push(txt(hx + 56, hy - 4, `${o.angle}°`, { size: 10.5 }), txt(hx + L * Math.cos(rad(o.angle)) + 4, hy - L * Math.sin(rad(o.angle)) - 4, o.speed, { size: 10.5 }));
  parts.push(line(hx + 84, hy, hx + 84, g, { head: "both", width: 1 }), txt(hx + 90, (hy + g) / 2 + 4, o.height, { size: 10.5 }));
  if (o.dog) {
    const dx = 130, dy = g - 16;
    parts.push(`<rect x="${dx - 16}" y="${dy - 6}" width="30" height="12" rx="5" fill="${C.ink}"/>`);
    parts.push(`<circle cx="${dx + 18}" cy="${dy - 10}" r="6" fill="${C.ink}"/>`);
    for (const lx of [dx - 12, dx - 6, dx + 6, dx + 11]) parts.push(line(lx, dy + 4, lx, g, { width: 2 }));
    parts.push(line(dx - 16, dy - 4, dx - 24, dy - 12, { width: 2 }));
    parts.push(txt(dx, g + 14, "dog", { size: 10, anchor: "middle" }));
  }
  return svg(350, g + 20, parts.join(""));
}

// ---- ball that just touches a stadium roof (Knox 2025 Q37) -------------------------------

export function stadiumRoof(): string {
  const parts: string[] = [];
  const g = 170, x0 = 60, top = 40, xt = 330;
  parts.push(`<rect x="${x0 - 6}" y="${g}" width="300" height="6" fill="${C.ink}"/>`);
  parts.push(line(x0 - 10, top, 380, top, { dash: "3 2", width: 1, color: C.guide }), txt(140, top - 6, "roof", { size: 10.5 }));
  const pts: string[] = [];
  for (let k = 0; k <= 50; k++) {
    const t = (k / 50) * 1.06;
    pts.push(`${f(x0 + (xt - x0) * t)},${f(g - (g - top) * (1 - (1 - t) * (1 - t)))}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.3"/>`);
  parts.push(dot(xt, top, 3, C.ink));
  parts.push(line(x0 - 20, top, x0 - 20, g, { head: "both", width: 1 }), txt(x0 - 24, (top + g) / 2, "40 m", { size: 10.5, anchor: "end" }));
  return svg(390, g + 16, parts.join(""));
}

// ---- skateboarder leaving a ramp (Newington 2023 Q21) -----------------------------------

export function skateRamp(): string {
  const parts: string[] = [];
  const g = 190, bx = 230, by = 150;
  parts.push(line(20, g, 360, g, { width: 1.2 }));
  parts.push(line(20, 30, 40, 30, { width: 1.2 }));
  parts.push(`<path d="M 40 30 Q 50 150 ${bx} ${by}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);
  parts.push(line(bx, by, bx, g, { width: 1.2 }));
  parts.push(txt(36, 24, "A", { size: 11, bold: true }), txt(bx - 2, by - 6, "B", { size: 11, bold: true }), txt(340, g - 6, "C", { size: 11, bold: true }));
  parts.push(line(bx + 10, by, bx + 10, g, { head: "both", width: 1 }), txt(bx + 14, (by + g) / 2 + 4, "1.0 m", { size: 10.5 }));
  parts.push(dot(61, 91, 5, C.a), line(66, 88, 100, 70, { width: 0.7 }), txt(102, 68, "skateboarder", { size: 10.5 }));
  return svg(370, g + 10, parts.join(""));
}

// ---- fireworks launched from a tower (North Sydney Boys 2019 Q22) ------------------------

export function fireworksTower(): string {
  const parts: string[] = [];
  const g = 210, tx = 60, ty = 60, k = 150 / 305; // px per metre vertically
  const ex = 330, ey = g - 280 * k;
  parts.push(line(20, g, 380, g, { width: 1.2 }));
  for (let x = 24; x < 380; x += 12) parts.push(line(x, g, x - 6, g + 6, { width: 0.6 }));
  parts.push(`<path d="M ${tx - 6} ${g} L ${tx - 3} ${ty + 14} L ${tx + 3} ${ty + 14} L ${tx + 6} ${g} Z" fill="#e2e8f0" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(`<rect x="${tx - 14}" y="${ty - 2}" width="28" height="16" fill="#e2e8f0" stroke="${C.ink}" stroke-width="0.8"/>`, line(tx, ty - 2, tx, ty - 30, { width: 1.2 }));
  const L = 40;
  parts.push(line(tx + 14, ty, tx + 14 + L * Math.cos(rad(30)), ty - L * Math.sin(rad(30)), { head: "end", width: 1.6, color: C.b }), txt(tx + 18, ty - 24, "v", { size: 11, italic: true }));
  parts.push(line(tx + 14, ty, tx + 70, ty, { width: 0.8 }), txt(tx + 52, ty - 4, "30°", { size: 10.5 }));
  // path: x ∝ t, y = 305 + 25t − 4.9t², explode at t = 5.958 s
  const pts: string[] = [];
  for (let j = 0; j <= 50; j++) {
    const t = (j / 50) * 5.958;
    pts.push(`${f(tx + 14 + ((ex - tx - 14) * t) / 5.958)},${f(g - (305 + 25 * t - 4.9 * t * t) * k)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="2 2"/>`);
  for (let a = 0; a < 360; a += 45) parts.push(line(ex + 4 * Math.cos(rad(a)), ey + 4 * Math.sin(rad(a)), ex + 10 * Math.cos(rad(a)), ey + 10 * Math.sin(rad(a)), { width: 1, color: C.b }));
  parts.push(line(tx + 26, ty, tx + 26, g, { head: "both", width: 1 }), txt(tx + 30, (ty + g) / 2, "305 m", { size: 10.5 }));
  parts.push(line(ex, ey + 12, ex, g, { head: "both", width: 1 }), txt(ex + 4, (ey + g) / 2, "280 m", { size: 10.5 }));
  return svg(390, g + 14, parts.join(""));
}

// ---- golf shot out of a sandpit (North Sydney Girls 2022 Q32) -------------------------------

export function sandpitShot(): string {
  const parts: string[] = [];
  const g = 140, x0 = 70, d = 70, px = 270;
  parts.push(`<rect x="40" y="${g}" width="140" height="10" fill="#d6c7a1" stroke="${C.ink}" stroke-width="0.6"/>`, txt(110, g + 26, "sandpit", { size: 10.5, anchor: "middle", bold: true }));
  parts.push(`<path d="M 180 ${g} L 220 ${g} Q 262 ${g} ${px} ${g - d} L 330 ${g - d}" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(`<circle cx="${x0}" cy="${g - 5}" r="5" fill="#fff" stroke="${C.ink}"/>`, `<circle cx="${px}" cy="${g - d - 5}" r="5" fill="#fff" stroke="${C.ink}"/>`);
  parts.push(txt(px + 8, g - d - 10, "P", { size: 11, bold: true }), txt(90, 50, "golf ball A", { size: 10.5, bold: true }), line(96, 54, x0 + 2, g - 12, { width: 0.7 }));
  const pts: string[] = [];
  for (let k = 0; k <= 40; k++) {
    const t = k / 40;
    pts.push(`${f(x0 + (px - x0) * t)},${f(g - 5 - d * (1 - (1 - t) * (1 - t)))}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-dasharray="4 3"/>`);
  parts.push(line(x0, g - 5, x0 + 34 * Math.cos(rad(25)), g - 5 - 34 * Math.sin(rad(25)), { head: "end", width: 1.5, color: C.b }), txt(x0 + 26, g - 28, "u", { size: 11, italic: true, bold: true }));
  parts.push(line(x0, g - 5, x0 + 40, g - 5, { dash: "2 2", width: 0.8 }), txt(x0 + 42, g - 2, "25°", { size: 10 }));
  parts.push(line(40, g - d - 5, 40, g - 5, { head: "both", width: 1 }), txt(34, g - d / 2, "d", { size: 11, italic: true, bold: true, anchor: "end" }));
  parts.push(txt(300, g - 40, "NOT TO", { size: 10, bold: true }), txt(300, g - 27, "SCALE", { size: 10, bold: true }));
  return svg(350, g + 34, parts.join(""));
}

// ---- castle tower and a target moving in a circle (North Sydney Girls 2023 Q31) -------------

export function castleTarget(): string {
  const parts: string[] = [];
  const cx = 150, cy = 230, rx = 130, ry = 32, top = 150;
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.ink}" stroke-width="0.9" stroke-dasharray="3 3"/>`);
  parts.push(`<rect x="${cx - 16}" y="${top}" width="32" height="${cy - top}" fill="#e2e8f0" stroke="${C.ink}" stroke-width="1"/>`);
  for (let x = cx - 16; x < cx + 16; x += 8) parts.push(`<rect x="${x}" y="${top - 6}" width="5" height="6" fill="#e2e8f0" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(line(cx - 28, top, cx - 28, cy, { head: "both", width: 1 }), txt(cx - 32, (top + cy) / 2, "45.0 m", { size: 10.5, anchor: "end" }));
  parts.push(line(cx, cy, cx + rx, cy, { dash: "2 2", width: 0.8 }), line(cx + 18, cy - 8, cx + rx, cy - 8, { head: "both", width: 0.9 }), txt(cx + 70, cy - 12, "180.0 m", { size: 10, anchor: "middle" }));
  parts.push(txt(cx + rx + 10, cy + 4, "East", { size: 10.5 }), txt(cx, cy + ry + 16, "South", { size: 10.5, anchor: "middle" }));
  parts.push(dot(cx, cy + ry, 4, C.b), txt(cx - 40, cy + ry + 12, "Target", { size: 10.5, anchor: "end" }), line(cx - 40, cy + ry + 6, cx - 6, cy + ry, { width: 0.7 }));
  parts.push(line(cx + 60, cy + ry - 3, cx + 70, cy + ry - 6, { head: "end", width: 1.1 }));
  // arrow path from the tower top landing at the East point (not to scale)
  const y0 = top - 8, H = cy - y0, rise = 70;
  const qa = H + 2 * rise + 2 * Math.sqrt(rise * (rise + H)), qb = qa - H;
  const pts: string[] = [];
  for (let k = 0; k <= 50; k++) {
    const t = k / 50;
    pts.push(`${f(cx + rx * t)},${f(y0 - qb * t + qa * t * t)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-dasharray="4 3"/>`);
  const L = 36;
  parts.push(line(cx, top - 8, cx + L * Math.cos(rad(72.3)), top - 8 - L * Math.sin(rad(72.3)), { head: "end", width: 1.6, color: C.b }));
  parts.push(txt(cx - 6, top - 40, "53.0 m s⁻¹", { size: 10.5, anchor: "end" }));
  parts.push(line(cx, top - 8, cx + 34, top - 8, { dash: "2 2", width: 0.8 }), txt(cx + 20, top - 16, "θ", { size: 11, italic: true }));
  return svg(340, cy + ry + 26, parts.join(""));
}

// ---- tennis serve: ball toss and swing, then serve over the net (North Sydney Girls 2024 Q26)

export function nadalServe(): string {
  const parts: string[] = [];
  const g = 210, k = 45; // px per metre
  // panel (a)
  const sx = 120, sy = g - 1.8 * k; // shoulder/centre of the arc, level with A
  parts.push(line(20, g, 220, g, { width: 1.2 }));
  parts.push(person(sx + 6, g, 1.8 * k + 20, { armTo: [sx - 40, sy] }));
  const ax = sx + 30;
  parts.push(dot(ax, sy, 3.5, C.ink), txt(ax + 4, sy - 6, "A", { size: 12, bold: true }));
  parts.push(dot(ax, sy - 1.8 * k, 3.5, C.ink), txt(ax - 6, sy - 1.8 * k - 4, "B", { size: 12, bold: true, anchor: "end" }));
  parts.push(line(ax + 14, sy - 1.8 * k, ax + 14, sy, { head: "both", width: 0.9 }), txt(ax + 18, sy - 0.9 * k, "1.8 m", { size: 11 }));
  parts.push(line(ax + 14, sy, ax + 14, g, { head: "both", width: 0.9 }), txt(ax + 18, sy + 0.9 * k, "1.8 m", { size: 11 }));
  const cxp = sx - 1.8 * k * 0.55;
  parts.push(`<ellipse cx="${f(cxp)}" cy="${f(sy)}" rx="12" ry="8" fill="#fff" stroke="${C.ink}" stroke-width="1.4"/>`, txt(cxp - 16, sy + 4, "C", { size: 12, bold: true, anchor: "end" }));
  parts.push(`<ellipse cx="${f(cxp + 14)}" cy="${f(sy + 52)}" rx="9" ry="12" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>`, txt(cxp + 8, sy + 78, "D", { size: 12, bold: true }));
  parts.push(`<path d="M ${f(cxp + 10)} ${f(sy + 38)} Q ${f(cxp - 10)} ${f(sy + 20)} ${f(cxp - 6)} ${f(sy + 10)}" fill="none" stroke="${C.ink}" stroke-width="0.9" stroke-dasharray="3 2"/>`);
  parts.push(line(cxp - 6, sy - 10, cxp + 4, sy - 40, { head: "end", width: 0.9, dash: "3 2" }));
  parts.push(txt(20, 20, "(a)", { size: 12, bold: true }));
  // panel (b)
  const ox = 250, px = ox + 40, nx = ox + 260;
  parts.push(line(ox, g, ox + 290, g, { width: 1.2 }));
  parts.push(person(px, g, 1.8 * k + 20, { armTo: [px + 4, g - 3.4 * k] }));
  parts.push(line(px + 4, g - 3.3 * k, px + 4, g - 3.6 * k + 8, { width: 1.4 }), `<ellipse cx="${f(px + 4)}" cy="${f(g - 3.6 * k)}" rx="7" ry="10" fill="#fff" stroke="${C.ink}" stroke-width="1.3"/>`);
  parts.push(dot(px + 4, g - 3.6 * k, 3, C.a), line(px + 12, g - 3.6 * k, px + 50, g - 3.6 * k, { head: "end", width: 1.4, color: C.b }), txt(px + 54, g - 3.6 * k + 4, "initial speed of ball = 24 m s⁻¹", { size: 10.5 }));
  parts.push(line(px - 30, g - 3.6 * k, px - 30, g - 1.8 * k, { head: "both", width: 0.9 }), txt(px - 34, g - 2.7 * k, "1.8 m", { size: 11, anchor: "end" }));
  parts.push(line(px - 30, g - 1.8 * k, px - 30, g, { head: "both", width: 0.9 }), txt(px - 34, g - 0.9 * k, "1.8 m", { size: 11, anchor: "end" }));
  parts.push(line(nx, g, nx, g - 0.9 * k, { width: 3 }), txt(nx, g - 0.9 * k - 6, "net", { size: 11, anchor: "middle" }));
  parts.push(line(nx + 10, g - 0.9 * k, nx + 10, g, { head: "both", width: 0.9 }), txt(nx + 14, g - 0.45 * k + 4, "0.90 m", { size: 11 }));
  parts.push(line(px, g + 12, nx, g + 12, { head: "both", width: 0.9 }), txt((px + nx) / 2, g + 26, "12 m", { size: 11, anchor: "middle" }));
  parts.push(txt(ox, 20, "(b)", { size: 12, bold: true }));
  return svg(ox + 330, g + 32, parts.join(""));
}

// ---- horizontal tennis serve just clearing the net (Cheltenham Girls 2010 HY Q17) ---------

export function tennisServeNet(): string {
  const parts: string[] = [];
  const g = 150, x0 = 40, k = 40, s = 15; // px per metre vertical, horizontal
  const nx = x0 + 15 * s, land = x0 + 18.8 * s;
  parts.push(line(x0, g, land + 30, g, { width: 1.2 }), line(x0, g, x0, g - 2.5 * k, { width: 1.2 }));
  parts.push(`<circle cx="${x0}" cy="${g - 2.5 * k}" r="5" fill="#fff" stroke="${C.ink}"/>`, line(x0 + 6, g - 2.5 * k, x0 + 36, g - 2.5 * k, { head: "end", width: 1.4 }), txt(x0 + 40, g - 2.5 * k - 4, "uₓ", { size: 10.5 }));
  const pts: string[] = [];
  for (let j = 0; j <= 40; j++) {
    const x = (j / 40) * 18.8;
    pts.push(`${f(x0 + x * s)},${f(g - (2.5 - 4.9 * (x / 26.3) ** 2) * k)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-dasharray="4 3"/>`);
  parts.push(line(nx, g, nx, g - 0.9 * k, { width: 3 }), txt(nx - 6, g - 0.9 * k + 6, "Net 0.9 m high", { size: 10, anchor: "end" }));
  parts.push(txt(x0 + 8, g - 1.1 * k, "2.5 m", { size: 10.5 }));
  parts.push(line(x0, g + 14, nx, g + 14, { head: "both", width: 1 }), txt((x0 + nx) / 2, g + 28, "15 m", { size: 10.5, anchor: "middle" }));
  parts.push(line(nx, g + 14, land, g + 14, { head: "both", width: 1 }), txt((nx + land) / 2, g + 28, "d", { size: 11, italic: true, anchor: "middle" }));
  return svg(land + 50, g + 36, parts.join(""));
}

// ---- general x–y graph with negative ranges, dots and curves ---------------------------

export function xyGraph(o: {
  xMin?: number;
  xMax: number;
  yMin?: number;
  yMax: number;
  xStep: number;
  yStep: number;
  minor?: number;
  xLabel: string;
  yLabel: string;
  points?: Array<[number, number]>;
  curves?: Array<{ pts: Array<[number, number]>; label?: string; labelAt?: [number, number]; color?: string }>;
  marks?: Array<{ at: [number, number]; label: string }>;
  width?: number;
  height?: number;
}): string {
  const x0 = o.xMin ?? 0, y0 = o.yMin ?? 0;
  const L = 52, T = 20, PW = o.width ?? 300, PH = o.height ?? 200;
  const X = (x: number) => L + ((x - x0) / (o.xMax - x0)) * PW;
  const Y = (y: number) => T + PH - ((y - y0) / (o.yMax - y0)) * PH;
  const parts: string[] = [];
  const minor = o.minor ?? 5;
  const nx = Math.round(((o.xMax - x0) / o.xStep) * minor), ny = Math.round(((o.yMax - y0) / o.yStep) * minor);
  for (let k = 0; k <= nx; k++) {
    const x = x0 + (k * o.xStep) / minor;
    parts.push(line(X(x), T, X(x), T + PH, { color: k % minor === 0 ? C.guide : C.grid, width: k % minor === 0 ? 0.8 : 0.5 }));
  }
  for (let k = 0; k <= ny; k++) {
    const y = y0 + (k * o.yStep) / minor;
    parts.push(line(L, Y(y), L + PW, Y(y), { color: k % minor === 0 ? C.guide : C.grid, width: k % minor === 0 ? 0.8 : 0.5 }));
  }
  if (y0 < 0 && o.yMax > 0) parts.push(line(L, Y(0), L + PW, Y(0), { color: C.axis, width: 1.2 }));
  if (x0 < 0 && o.xMax > 0) parts.push(line(X(0), T, X(0), T + PH, { color: C.axis, width: 1.2 }));
  const fmt = (v: number) => String(+v.toFixed(2)).replace("-", "−");
  for (let k = 0; k <= nx / minor + 1e-9; k++) parts.push(txt(X(x0 + k * o.xStep), T + PH + 13, fmt(x0 + k * o.xStep), { anchor: "middle", size: 9.5 }));
  for (let k = 0; k <= ny / minor + 1e-9; k++) parts.push(txt(L - 5, Y(y0 + k * o.yStep) + 3.5, fmt(y0 + k * o.yStep), { anchor: "end", size: 9.5 }));
  parts.push(txt(L + PW / 2, T + PH + 30, o.xLabel, { anchor: "middle", size: 10.5 }));
  parts.push(
    `<text x="14" y="${T + PH / 2}" fill="${C.text}" font-size="10.5" font-family="${FONT}" text-anchor="middle" transform="rotate(-90 14 ${T + PH / 2})">${esc(o.yLabel)}</text>`,
  );
  for (const c of o.curves ?? []) {
    parts.push(`<polyline points="${c.pts.map(([x, y]) => `${f(X(x))},${f(Y(y))}`).join(" ")}" fill="none" stroke="${c.color ?? C.a}" stroke-width="1.6"/>`);
    if (c.label && c.labelAt) parts.push(txt(X(c.labelAt[0]), Y(c.labelAt[1]), c.label, { size: 10.5 }));
  }
  for (const [x, y] of o.points ?? []) parts.push(dot(X(x), Y(y), 2.6, C.ink));
  for (const m of o.marks ?? []) parts.push(dot(X(m.at[0]), Y(m.at[1]), 2.8, C.ink), txt(X(m.at[0]) + 4, Y(m.at[1]) - 7, m.label, { size: 12, bold: true }));
  return svg(L + PW + 14, T + PH + 38, parts.join(""));
}

// ---- camera and ruler set-up and the strobe image (Shore 2020 Q28) -----------------------

export function cameraSetup(): string {
  const parts: string[] = [];
  // a wall (in perspective) with the trajectory drawn on it
  parts.push(`<path d="M 60 40 L 140 20 L 140 170 L 60 190 Z" fill="#f1f5f9" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(txt(78, 46, "Trajectory", { size: 10.5 }));
  parts.push(`<path d="M 120 88 Q 96 30 74 150" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="3 3"/>`);
  parts.push(`<circle cx="120" cy="88" r="6" fill="#cbd5e1" stroke="${C.ink}"/>`, txt(130, 92, "Starting point P", { size: 10.5 }));
  // floor lines
  for (const [x1, y1, x2, y2] of [[60, 190, 300, 190], [140, 170, 330, 170], [100, 180, 320, 180]]) parts.push(line(x1, y1, x2, y2, { width: 0.6, color: C.guide }));
  // ruler on the floor, in front of the wall (closer to the camera)
  parts.push(`<path d="M 110 168 L 190 150 L 196 156 L 116 174 Z" fill="#fde68a" stroke="${C.ink}" stroke-width="0.8"/>`, txt(200, 166, "Metre ruler", { size: 10.5 }));
  // camera on a tripod, close and to one side of P
  parts.push(`<rect x="232" y="78" width="22" height="14" fill="#fff" stroke="${C.ink}"/>`, `<circle cx="232" cy="85" r="4" fill="#fff" stroke="${C.ink}"/>`);
  parts.push(line(243, 92, 236, 130, { width: 1 }), line(243, 92, 250, 130, { width: 1 }), line(243, 92, 243, 132, { width: 1 }));
  parts.push(txt(260, 88, "Camera", { size: 10.5 }));
  return svg(340, 200, parts.join(""));
}

export function shoreStrobe(): string {
  const parts: string[] = [];
  // P on the right; ball moves left at 1.6 m/s, up at 4.3 m/s, g = 9.6
  const sx = 110, sy = 110, px = 260, py = 120; // px per metre
  for (let k = 0; k <= 27; k++) {
    const t = k / 30;
    const x = -1.6 * t, y = 4.3 * t - 4.8 * t * t;
    parts.push(`<circle cx="${f(px + x * sx)}" cy="${f(py - y * sy)}" r="2.6" fill="#fff" stroke="${C.ink}" stroke-width="0.9"/>`);
  }
  parts.push(txt(px + 8, py + 4, "Starting point P", { size: 10.5 }));
  return svg(360, 170, parts.join(""));
}

// ---- ball launched horizontally into a vacuum chamber (Shore 2020 HY Q10) ----------------

export function vacuumChamber(): string {
  const parts: string[] = [];
  const panel = (oy: number, deflect: boolean) => {
    const x0 = 50, w = 230, top = oy, bot = oy + 70; // 150 cm ↔ 230 px, 50 cm ↔ 70 px? (not to scale)
    const ly = top + 30;
    parts.push(`<rect x="${x0}" y="${top}" width="${w}" height="${bot - top}" fill="none" stroke="${C.ink}" stroke-width="1"/>`);
    parts.push(`<circle cx="${x0 - 14}" cy="${ly}" r="5" fill="#fff" stroke="${C.ink}"/>`, line(x0 - 8, ly, x0 + 6, ly, { head: "end", width: 1.1 }));
    parts.push(line(x0 + 6, ly + 2, x0 + 6, bot, { head: "both", width: 0.9 }), txt(x0 + 10, (ly + bot) / 2 + 4, "50 cm", { size: 10, bold: true }));
    if (deflect) {
      parts.push(`<path d="M ${x0} ${ly} Q ${x0 + 70} ${ly} ${x0 + w * 0.62} ${bot}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="4 3"/>`);
      parts.push(line(x0, bot + 12, x0 + w * 0.62, bot + 12, { head: "both", width: 0.9 }), txt(x0 + w * 0.31, bot + 25, "150 cm", { size: 10, bold: true, anchor: "middle" }));
    } else {
      parts.push(line(x0, ly, x0 + w, ly, { dash: "4 3", width: 1, head: "end" }));
    }
  };
  panel(10, true);
  panel(140, false);
  return svg(300, 225, parts.join(""));
}

// ---- tennis serve leaving the racket at 8° (Shore 2021 Q25) -----------------------------

export function serveAngle(): string {
  const parts: string[] = [];
  parts.push(line(30, 60, 200, 60, { width: 1.4, color: C.a }));
  parts.push(line(30, 60, 30 + 150 * Math.cos(rad(8)), 60 - 150 * Math.sin(rad(8)), { head: "end", width: 1.6, color: C.a }));
  parts.push(`<path d="M 130 60 A 100 100 0 0 0 ${f(30 + 100 * Math.cos(rad(8)))} ${f(60 - 100 * Math.sin(rad(8)))}" fill="none" stroke="${C.ink}" stroke-width="0.9"/>`);
  parts.push(txt(136, 58, "8°", { size: 10.5 }));
  return svg(220, 76, parts.join(""));
}

// ---- two arrows from a tower to the same target (Sydney Grammar 2018 HY Q17) --------------

export function towerTwoArrows(): string {
  const parts: string[] = [];
  const g = 160, tx = 60, ty = 80, land = 330;
  parts.push(line(20, g, 380, g, { width: 1.2 }));
  parts.push(`<path d="M ${tx - 22} ${g} L ${tx - 6} ${ty} L ${tx + 6} ${ty} L ${tx + 22} ${g}" fill="none" stroke="${C.ink}" stroke-width="2"/>`);
  for (let k = 1; k < 5; k++) {
    const y = ty + (k * (g - ty)) / 5, hw = 6 + (16 * k) / 5;
    parts.push(line(tx - hw, y, tx + hw, y, { width: 1 }));
  }
  parts.push(person(tx, ty, 28), txt(tx - 18, ty - 10, "archer", { size: 10, anchor: "end" }));
  const sy = ty - 14;
  // arrow A: horizontal launch; arrow B: up then down, twice the time
  const ptsA: string[] = [], ptsB: string[] = [];
  for (let k = 0; k <= 40; k++) {
    const t = k / 40;
    ptsA.push(`${f(tx + 6 + (land - tx - 6) * t)},${f(sy + (g - sy) * t * t)}`);
    // B: y = sy - b t + a t², y(1) = g, rise 40 px
    const H = g - sy, rise = 40, a = H + 2 * rise + 2 * Math.sqrt(rise * (rise + H)), b = a - H;
    ptsB.push(`${f(tx + 6 + (land - tx - 6) * t)},${f(sy - b * t + a * t * t)}`);
  }
  parts.push(`<polyline points="${ptsA.join(" ")}" fill="none" stroke="${C.a}" stroke-width="1.5"/>`, txt(170, sy + 34, "Arrow A", { size: 10.5 }));
  parts.push(`<polyline points="${ptsB.join(" ")}" fill="none" stroke="${C.b}" stroke-width="1.5" stroke-dasharray="5 3"/>`, txt(292, sy - 8, "Arrow B", { size: 10.5 }));
  parts.push(line(tx + 6, sy, 360, sy, { dash: "2 2", width: 0.8 }));
  parts.push(line(355, sy, 355, g, { head: "both", width: 0.9 }), txt(359, (sy + g) / 2, "40 m", { size: 10.5 }));
  parts.push(txt(land + 4, g - 4, "target", { size: 10 }));
  parts.push(line(tx, g + 14, land, g + 14, { head: "both", width: 0.9, dash: "3 2" }), txt((tx + land) / 2, g + 28, "50 m", { size: 10.5, anchor: "middle" }));
  parts.push(txt(370, 20, "NOT TO SCALE", { size: 10, anchor: "end" }));
  return svg(390, g + 34, parts.join(""));
}

// ---- helicopter dropping a rescue pack (Sydney Grammar 2020 Q21) --------------------------

export function helicopterDrop(): string {
  const parts: string[] = [];
  const g = 150, hx = 70, hy = 40;
  parts.push(line(20, g, 380, g, { width: 1.2 }));
  parts.push(`<ellipse cx="${hx}" cy="${hy}" rx="22" ry="10" fill="#e2e8f0" stroke="${C.ink}"/>`, line(hx - 22, hy - 2, hx - 50, hy - 6, { width: 2 }), line(hx - 30, hy - 14, hx + 30, hy - 14, { width: 1.5 }), line(hx, hy - 14, hx, hy - 10, { width: 1.5 }));
  parts.push(line(hx - 12, hy + 14, hx + 12, hy + 14, { width: 1.2 }));
  parts.push(line(hx + 30, hy + 2, hx + 80, hy + 2, { head: "end", width: 1.5 }), txt(hx + 34, hy - 4, "52.5 m s⁻¹", { size: 10.5 }));
  parts.push(line(hx, hy + 16, hx, g, { dash: "2 3", width: 0.9 }), txt(hx - 6, (hy + g) / 2, "250 m", { size: 10.5, anchor: "end" }));
  parts.push(person(320, g, 40), person(340, g, 44));
  parts.push(line(hx, g - 6, 315, g - 6, { head: "both", width: 0.9, dash: "3 2" }), txt(190, g - 10, "d", { size: 11, italic: true, bold: true, anchor: "middle" }));
  parts.push(txt(370, 20, "not to scale", { size: 10, anchor: "end" }));
  return svg(390, g + 10, parts.join(""));
}

// ---- golf shot over a tree onto an elevated green (Sydney Grammar 2022 Q36) ---------------

export function treeAndGreen(): string {
  const parts: string[] = [];
  const g = 170, k = 20, sx = 14; // px per metre (vertical, horizontal)
  const x0 = 40, tx = x0 + 8.6 * sx, gx = tx + 6.09 * sx, slopeStart = tx + 1.5 * sx, slopeEnd = tx + 4.5 * sx;
  parts.push(`<path d="M 20 ${g} L ${slopeStart} ${g} Q ${(slopeStart + slopeEnd) / 2} ${g} ${slopeEnd} ${g - 3 * k} L ${gx + 80} ${g - 3 * k}" fill="none" stroke="${C.c}" stroke-width="2"/>`);
  parts.push(line(tx, g, tx, g - 3 * k, { width: 4, color: "#92400e" }), `<circle cx="${tx}" cy="${g - 3 * k - 10}" r="16" fill="#86efac" stroke="${C.c}"/>`);
  const pts: string[] = [];
  for (let j = 0; j <= 50; j++) {
    const t = (j / 50) * (1.106 + 0.782);
    pts.push(`${f(x0 + 7.78 * t * sx)},${f(g - (10.84 * t - 4.9 * t * t) * k)}`);
  }
  parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${C.a}" stroke-width="1.5"/>`);
  parts.push(line(tx + 6, g - 6 * k, tx + 6, g - 3 * k, { head: "both", width: 0.9 }), txt(tx + 10, g - 4.5 * k, "h", { size: 11, italic: true, bold: true }));
  parts.push(line(tx - 6, g - 3 * k, tx - 6, g, { head: "both", width: 0.9 }), txt(tx - 10, g - 1.5 * k, "h", { size: 11, italic: true, bold: true, anchor: "end" }));
  parts.push(line(tx, g - 3 * k, gx, g - 3 * k, { dash: "4 3", width: 0.8 }), line(gx, g - 3 * k, gx, g, { dash: "2 2", width: 0.7 }));
  parts.push(line(x0, g + 12, tx, g + 12, { head: "both", width: 0.9 }), txt((x0 + tx) / 2, g + 26, "x", { size: 11, italic: true, bold: true, anchor: "middle" }));
  parts.push(line(tx, g + 12, gx, g + 12, { head: "both", width: 0.9 }), txt((tx + gx) / 2, g + 26, "d", { size: 11, italic: true, bold: true, anchor: "middle" }));
  parts.push(line(gx + 60, g - 3 * k, gx + 60, g - 3 * k - 40, { width: 1.2 }), `<path d="M ${gx + 60} ${g - 3 * k - 40} l 12 4 l -12 4 z" fill="${C.b}"/>`);
  parts.push(person(x0 - 8, g, 34));
  return svg(gx + 100, g + 34, parts.join(""));
}

// ---- golf shot onto a cliff top: launch X, top Y, landing Z (Sydney Grammar 2005 HY Q18) --

export function golfCliffXYZ(): string {
  const parts: string[] = [];
  const g = 170, k = 3, sx = 4; // px per metre vertical/horizontal (not to scale)
  const x0 = 60, yx = x0 + 30 * sx * 1.2, zx = yx + 20 * sx;
  parts.push(line(20, g, zx + 4, g, { width: 1.2 }));
  parts.push(`<path d="M ${zx} ${g} L ${zx} ${g - 39.2 * k} L ${zx + 30} ${g - 39.2 * k} q 20 -6 40 4" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`);
  // not to scale: x is mapped linearly in time separately before and after the top
  const pts2: string[] = [];
  for (let j = 0; j <= 50; j++) {
    const t = (j / 50) * 4.0;
    const x = t <= 3 ? x0 + (t / 3) * (yx - x0) : yx + (t - 3) * (zx - yx);
    pts2.push(`${f(x)},${f(g - (29.4 * t - 4.9 * t * t) * k)}`);
  }
  parts.push(`<polyline points="${pts2.join(" ")}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="4 3"/>`);
  parts.push(dot(x0, g, 3, C.ink), txt(x0, g + 14, "X", { size: 11, bold: true, anchor: "middle" }));
  parts.push(line(x0, g, x0 + 34 * Math.cos(rad(55)), g - 34 * Math.sin(rad(55)), { head: "end", width: 1.5, color: C.b }), txt(x0 + 8, g - 30, "u", { size: 11, italic: true }));
  parts.push(line(x0, g, x0 + 40, g, { dash: "2 2", width: 0.7 }), txt(x0 + 24, g - 6, "θ", { size: 11, italic: true }));
  parts.push(line(yx, g - 44.1 * k, yx, g, { width: 0.9 }), txt(yx - 4, g - 44.1 * k - 6, "Y", { size: 11, bold: true, anchor: "middle" }), txt(yx - 4, g - 20 * k, "44.1 m", { size: 10.5, anchor: "end" }));
  parts.push(txt(zx + 2, g - 39.2 * k - 18, "Z", { size: 11, bold: true }), txt(zx + 6, g - 20 * k, "39.2 m", { size: 10.5 }));
  parts.push(line(yx, g - 44.1 * k - 20, zx, g - 44.1 * k - 20, { head: "both", width: 0.9 }), txt((yx + zx) / 2, g - 44.1 * k - 26, "20 m", { size: 10.5, anchor: "middle" }));
  return svg(zx + 80, g + 22, parts.join(""));
}

// ======================= circular motion =======================

/** Arrow of length L from (x, y) at angle a (degrees, 0 = right, 90 = up). */
function arrowAt(x: number, y: number, a: number, L: number, o: { color?: string; width?: number; dash?: string } = {}): string {
  return line(x, y, x + L * Math.cos(rad(a)), y - L * Math.sin(rad(a)), { head: "end", width: o.width ?? 1.6, color: o.color, dash: o.dash });
}

// ---- tether ball on a pole (Barker 2020 Q20) ---------------------------------------------

export function tetherBall(): string {
  const parts: string[] = [];
  const px = 180, top = 20, bx = 120, by = 140;
  parts.push(`<rect x="${px - 4}" y="${top}" width="8" height="190" fill="#cbd5e1" stroke="${C.ink}" stroke-width="0.6"/>`);
  parts.push(`<ellipse cx="${px}" cy="${by}" rx="${px - bx}" ry="12" fill="none" stroke="${C.ink}" stroke-width="0.9" stroke-dasharray="2 2"/>`);
  parts.push(`<path d="M ${px + 30} ${by + 9} l -6 -4 l 0 8 z" fill="${C.ink}"/>`);
  parts.push(line(px, top, bx, by, { width: 1.2 }));
  parts.push(line(px, top, px, top + 50, { dash: "2 2", width: 0.7 }), txt(px - 14, top + 40, "θ", { size: 11, italic: true, anchor: "end" }));
  const ang = (Math.atan2(by - top, px - bx) * 180) / Math.PI; // angle of string from horizontal
  parts.push(arrowAt(bx, by, ang, 56, { color: C.a }), subTxt(bx + 8, by - 40, "F", "T", { size: 11, italic: true }));
  parts.push(arrowAt(bx, by, -90, 50, { color: C.b }), subTxt(bx - 18, by + 40, "F", "g", { size: 11, italic: true }));
  parts.push(`<circle cx="${bx}" cy="${by}" r="7" fill="#fde047" stroke="${C.ink}"/>`);
  return svg(280, 220, parts.join(""));
}

// ---- ball on a string from the ceiling, conical pendulum (Cherrybrook Tech 2025 Q13) ------

export function conicalPendulum(): string {
  const parts: string[] = [];
  const cx = 170, top = 20, r = 110, by = 170;
  parts.push(`<rect x="${cx - 110}" y="${top - 8}" width="220" height="8" fill="#cbd5e1" stroke="${C.ink}" stroke-width="0.6"/>`);
  parts.push(line(cx, top, cx, by, { dash: "3 3", width: 0.8 }));
  parts.push(`<ellipse cx="${cx}" cy="${by}" rx="${r}" ry="16" fill="none" stroke="${C.ink}" stroke-width="0.8" stroke-dasharray="4 3"/>`);
  parts.push(line(cx, by, cx + r, by, { dash: "3 3", width: 0.8 }), txt(cx + r / 2, by - 4, "r", { size: 11, italic: true, anchor: "middle" }));
  parts.push(line(cx, top, cx - r, by, { width: 1.2 }));
  parts.push(`<circle cx="${cx - r}" cy="${by}" r="8" fill="#cbd5e1" stroke="${C.ink}"/>`);
  parts.push(`<path d="M ${cx} ${top + 30} A 30 30 0 0 1 ${f(cx - 30 * Math.sin(Math.atan(r / (by - top))))} ${f(top + 30 * Math.cos(Math.atan(r / (by - top))))}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(txt(cx - 8, top + 46, "θ", { size: 11, italic: true, anchor: "end" }));
  parts.push(`<path d="M ${cx + 10} ${by + 16} l 8 -4 l 0 8 z" fill="${C.ink}"/>`);
  return svg(340, 200, parts.join(""));
}

// ---- mass on a turntable (Hornsby Girls 2021 Q3) -----------------------------------------

export function turntable(): string {
  const parts: string[] = [];
  const cx = 160, cy = 40, rx = 130, ry = 18;
  parts.push(`<path d="M ${cx - rx} ${cy} L ${cx - rx} ${cy + 34} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + 34} L ${cx + rx} ${cy}" fill="#e2e8f0" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#f1f5f9" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(`<rect x="${cx + 26}" y="${cy - 14}" width="22" height="14" fill="${C.a}" stroke="${C.ink}" stroke-width="0.6"/>`, `<ellipse cx="${cx + 37}" cy="${cy - 14}" rx="11" ry="3" fill="#60a5fa" stroke="${C.ink}" stroke-width="0.6"/>`);
  parts.push(`<ellipse cx="${cx - 20}" cy="${cy - 2}" rx="5" ry="3" fill="${C.a}"/>`);
  parts.push(line(cx - 20, cy + 6, cx + 37, cy + 6, { head: "both", width: 1, color: C.a }), txt(cx + 8, cy + 20, "15.0 cm", { size: 10.5, anchor: "middle" }));
  return svg(320, 100, parts.join(""));
}

// ---- centripetal force and velocity of a satellite: four options (Hornsby Girls 2021 Q4) ---

export function satelliteForceVelocity(): string {
  const parts: string[] = [];
  const panel = (ox: number, oy: number, label: string, forceUp: boolean, velTilt: number) => {
    const cx = ox + 80, cy = oy + 100, R = 50;
    parts.push(txt(ox + 4, oy + 14, `(${label})`, { size: 11, bold: true }));
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.a}" stroke-width="0.9"/>`, planet(cx, cy, 26));
    const sx = cx, sy = cy - R;
    parts.push(arrowAt(sx, sy, forceUp ? 90 : -90, 44), txt(forceUp ? sx + 6 : sx - 6, forceUp ? sy - 30 : sy + 30, "centripetal force", { size: 9, italic: true, anchor: forceUp ? "start" : "end" }));
    parts.push(arrowAt(sx, sy, -velTilt, 50), txt(sx + 54, sy + (velTilt ? 14 : -4), "instantaneous velocity", { size: 9, italic: true }));
    parts.push(dot(sx, sy, 5, C.a));
  };
  panel(0, 0, "A", true, 0);
  panel(220, 0, "B", true, 15);
  panel(0, 170, "C", false, 15);
  panel(220, 170, "D", false, 0);
  return svg(460, 340, parts.join(""));
}

// ---- car on a frictionless banked track with four arrows (Hornsby Girls 2021 Q9) ----------

export function bankedArrows(): string {
  const parts: string[] = [];
  const th = 25, x0 = 40, y0 = 70, len = 300;
  const x1 = x0 + len * Math.cos(rad(th)), y1 = y0 + len * Math.sin(rad(th));
  parts.push(line(x0, y0, x1, y1, { width: 1.4 }), line(x0 + 80, y1, x1 + 10, y1, { width: 1 }));
  parts.push(`<path d="M ${f(x1 - 40)} ${f(y1)} A 40 40 0 0 1 ${f(x1 - 40 * Math.cos(rad(th)))} ${f(y1 - 40 * Math.sin(rad(th)))}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`, txt(x1 - 52, y1 - 4, "θ", { size: 11, italic: true }));
  // car (box) on the slope
  const cx = x0 + 110 * Math.cos(rad(th)), cy = y0 + 110 * Math.sin(rad(th));
  parts.push(`<rect x="${f(cx - 26)}" y="${f(cy - 30)}" width="52" height="30" rx="5" fill="#cbd5e1" stroke="${C.ink}" transform="rotate(${th} ${f(cx)} ${f(cy)})"/>`);
  const ox = cx + 2, oy = cy - 18;
  parts.push(arrowAt(ox, oy, 90 - th, 80, { color: C.c }), txt(ox + 80 * Math.sin(rad(th)) + 4, oy - 80 * Math.cos(rad(th)) - 4, "A", { size: 13, bold: true }));
  parts.push(arrowAt(ox, oy, 0, 80, { color: C.c }), txt(ox + 88, oy + 4, "B", { size: 13, bold: true }));
  parts.push(arrowAt(ox, oy, -th, 80, { color: C.c }), txt(ox + 80 * Math.cos(rad(th)) + 6, oy + 80 * Math.sin(rad(th)) + 10, "C", { size: 13, bold: true }));
  parts.push(arrowAt(ox, oy, -90, 90, { color: C.c }), txt(ox - 10, oy + 90, "D", { size: 13, bold: true, anchor: "end" }));
  return svg(400, 240, parts.join(""));
}

// ---- force diagrams: a dot with arrows (James Ruse 2021 Q10) ------------------------------

export function forceDotPanels(panels: Array<{ label: string; arrows: Array<"up" | "down" | "left" | "right"> }>): string {
  const parts: string[] = [];
  const ang = { up: 90, down: -90, left: 180, right: 0 } as const;
  panels.forEach((p, i) => {
    const ox = (i % 2) * 170, oy = Math.floor(i / 2) * 150;
    const cx = ox + 90, cy = oy + 80;
    parts.push(txt(ox + 10, oy + 18, `${p.label}.`, { size: 12, bold: true }));
    for (const a of p.arrows) parts.push(arrowAt(cx, cy, ang[a], 52, { width: 1.4 }));
    parts.push(dot(cx, cy, 3.5, C.ink));
  });
  return svg(340, Math.ceil(panels.length / 2) * 150, parts.join(""));
}

export function rotorRide(): string {
  const parts: string[] = [];
  const cx = 130, top = 40, bot = 150, rx = 90, ry = 20;
  parts.push(`<path d="M ${cx - rx} ${top} L ${cx - rx} ${bot} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bot} L ${cx + rx} ${top}" fill="#e2e8f0" stroke="${C.ink}"/>`);
  parts.push(`<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="#f1f5f9" stroke="${C.ink}"/>`);
  parts.push(`<ellipse cx="${cx}" cy="${bot}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.ink}" stroke-dasharray="3 3" stroke-width="0.8"/>`);
  parts.push(line(cx, 10, cx, bot + 30, { dash: "4 3", width: 0.8 }));
  parts.push(`<path d="M ${cx - 20} 16 A 20 6 0 1 0 ${cx + 20} 16" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`, `<path d="M ${cx + 20} 16 l -6 -5 l 0 9 z" fill="${C.ink}"/>`);
  parts.push(person(cx + rx - 12, bot - 30, 50));
  parts.push(line(cx, bot, cx - rx, bot, { head: "end", width: 0.9 }), txt(cx - rx / 2, bot - 4, "R", { size: 11, italic: true, anchor: "middle" }));
  return svg(260, bot + 36, parts.join(""));
}

// ---- car on a banked road (James Ruse 2021 Q12, Kotara 2020 Q7) -----------------------------

export function bankedRoad(o: { label?: string; rider?: boolean; angle?: number; angleLabel?: string } = {}): string {
  const parts: string[] = [];
  const th = o.angle ?? 18, x0 = 20, len = 260, y0 = Math.max(110, 40 + len * Math.sin(rad(th)));
  const x1 = x0 + len * Math.cos(rad(th)), y1 = y0 - len * Math.sin(rad(th));
  parts.push(line(x0, y0, x1 + 20, y0, { width: 1.2 }), line(x0, y0, x1, y1, { width: 1.4 }));
  parts.push(`<path d="M ${x0 + 70} ${y0} A 70 70 0 0 0 ${f(x0 + 70 * Math.cos(rad(th)))} ${f(y0 - 70 * Math.sin(rad(th)))}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`, txt(x0 + 76, y0 - 6, o.angleLabel ?? "θ", { size: 11, italic: o.angleLabel === undefined }));
  const cx = x0 + 130 * Math.cos(rad(th)), cy = y0 - 130 * Math.sin(rad(th));
  if (o.rider) {
    parts.push(`<g transform="rotate(${-th} ${f(cx)} ${f(cy)})"><circle cx="${f(cx - 14)}" cy="${f(cy - 9)}" r="9" fill="none" stroke="${C.ink}" stroke-width="2"/><circle cx="${f(cx + 14)}" cy="${f(cy - 9)}" r="9" fill="none" stroke="${C.ink}" stroke-width="2"/><line x1="${f(cx - 14)}" y1="${f(cy - 9)}" x2="${f(cx + 14)}" y2="${f(cy - 9)}" stroke="${C.ink}" stroke-width="3"/><circle cx="${f(cx)}" cy="${f(cy - 38)}" r="6" fill="${C.ink}"/><line x1="${f(cx)}" y1="${f(cy - 32)}" x2="${f(cx)}" y2="${f(cy - 14)}" stroke="${C.ink}" stroke-width="3"/></g>`);
  } else {
    parts.push(`<rect x="${f(cx - 24)}" y="${f(cy - 28)}" width="48" height="28" rx="6" fill="#cbd5e1" stroke="${C.ink}" transform="rotate(${-th} ${f(cx)} ${f(cy)})"/>`);
  }
  if (o.label) parts.push(arrowAt(cx + 40, cy - 50, 0, 50, { width: 1.1 }), txt(cx + 40, cy - 56, o.label, { size: 10 }));
  return svg(320, y0 + 14, parts.join(""));
}

// ---- rope pulling on a flagpole (James Ruse 2022 Q8) ---------------------------------------

export function flagpoleRope(): string {
  const parts: string[] = [];
  const px = 80, top = 30, g = 230, k = 40; // 5.0 m pole → 200 px
  const ex = px + 7.2 * k * Math.sin(rad(51)), ey = top + 7.2 * k * Math.cos(rad(51));
  parts.push(line(20, g, 340, g, { width: 1 }));
  parts.push(line(px, top, px, g, { width: 4, color: C.guide }));
  parts.push(line(px, top, ex, ey, { width: 1.2 }));
  parts.push(line(px, top, px + 60, top, { dash: "2 2", width: 0.7 }), txt(px + 34, top + 12, "39°", { size: 10.5 }), txt(px + 6, top + 34, "51°", { size: 10.5 }));
  parts.push(txt(px - 8, (top + g) / 2, "5.0 m", { size: 10.5, anchor: "end" }), txt((px + ex) / 2 + 10, (top + ey) / 2 - 6, "7.2 m", { size: 10.5 }));
  parts.push(person(ex + 10, Math.min(g, ey + 54), 56, { armTo: [ex, ey] }));
  return svg(360, g + 10, parts.join(""));
}

// ---- velocity and acceleration at P on a circle (James Ruse 2024 Q4) ------------------------

export function circlePointP(): string {
  const parts: string[] = [];
  const cx = 110, cy = 70, R = 55;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`, dot(cx, cy, 3, C.ink));
  parts.push(`<path d="M ${cx - 4} ${cy - R} l 10 -6 l 0 12 z" fill="${C.ink}" transform="rotate(0)"/>`);
  parts.push(dot(cx - R, cy, 3.5, C.ink), txt(cx - R - 8, cy + 4, "P", { size: 12, anchor: "end" }));
  return svg(220, 140, parts.join(""));
}

export function vectorPairPanels(panels: Array<{ label: string; v: number; a: number; sideBySide?: boolean }>): string {
  const parts: string[] = [];
  panels.forEach((p, i) => {
    const ox = (i % 2) * 170, oy = Math.floor(i / 2) * 100;
    parts.push(txt(ox + 8, oy + 20, `${p.label}.`, { size: 12, bold: true }));
    const vx = ox + 60, ax = ox + 100, y = oy + 50;
    const draw = (x: number, a: number, name: string) => {
      const L = 54;
      const sx = x - (L / 2) * Math.cos(rad(a)), sy = y + (L / 2) * Math.sin(rad(a));
      parts.push(arrowAt(sx, sy, a, L, { width: 1.6 }));
      parts.push(txt(x - 12, y - 18, name, { size: 12, italic: true, bold: true, anchor: "middle" }));
    };
    draw(vx, p.v, "v");
    draw(ax + (p.a === 0 || p.a === 180 ? 20 : 0), p.a, "a");
  });
  return svg(340, Math.ceil(panels.length / 2) * 100, parts.join(""));
}

// ---- metre ruler balanced on a pivot (Knox 2020 Q13) ---------------------------------------

export function torqueRuler(): string {
  const parts: string[] = [];
  const s = 4.2, pv = 250, y = 70; // px per cm, pivot x
  parts.push(`<rect x="${pv - 49 * s - 20}" y="${y}" width="${49 * s + 20 + 45 * s}" height="6" fill="#f1f5f9" stroke="${C.ink}"/>`, txt(pv + 45 * s + 4, y + 6, "ruler", { size: 10.5 }));
  parts.push(`<path d="M ${pv} ${y + 6} L ${pv - 18} ${y + 70} L ${pv + 18} ${y + 70} Z" fill="#94a3b8"/>`, txt(pv, y + 86, "pivot", { size: 10.5, anchor: "middle" }));
  const hang = (x: number, lab: string, box = false) => {
    parts.push(line(x, y + 6, x, y + 40, { width: 0.9 }));
    parts.push(box ? `<rect x="${x - 8}" y="${y + 40}" width="16" height="16" fill="#cbd5e1" stroke="${C.ink}"/>` : `<rect x="${x - 7}" y="${y + 40}" width="14" height="22" rx="3" fill="#cbd5e1" stroke="${C.ink}"/>`);
    parts.push(subTxt(x, y + 80, "m", lab, { size: 10.5, italic: true, anchor: "middle" }));
  };
  hang(pv - 49 * s, "1");
  hang(pv - 30 * s, "2", true);
  hang(pv + 39 * s, "3");
  parts.push(txt(pv - 49 * s, y + 96, "= 150 g", { size: 10, anchor: "middle" }), txt(pv - 30 * s + 6, y + 96, "(varied)", { size: 10, anchor: "middle" }), txt(pv + 39 * s, y + 96, "(unknown, constant mass)", { size: 10, anchor: "middle" }));
  parts.push(line(pv - 49 * s, y - 26, pv, y - 26, { head: "both", width: 0.9 }), txt(pv - 24.5 * s, y - 30, "r₁ = 49.0 cm", { size: 10.5, anchor: "middle" }));
  parts.push(line(pv - 30 * s, y - 10, pv, y - 10, { head: "both", width: 0.9 }), txt(pv - 15 * s, y - 14, "r₂ = 30.0 cm", { size: 10.5, anchor: "middle" }));
  parts.push(line(pv, y - 26, pv + 39 * s, y - 26, { head: "both", width: 0.9 }), txt(pv + 19.5 * s, y - 30, "r₃", { size: 10.5, anchor: "middle" }));
  return svg(pv + 45 * s + 40, y + 104, parts.join(""));
}

// ---- whirling stopper apparatus (Knox 2022 Q16) ---------------------------------------------

export function whirlingStopper(): string {
  const parts: string[] = [];
  const tx = 110, ty = 40;
  parts.push(`<ellipse cx="${tx}" cy="${ty}" rx="100" ry="14" fill="none" stroke="${C.ink}" stroke-width="0.8" stroke-dasharray="4 3"/>`);
  parts.push(`<rect x="${tx - 4}" y="${ty}" width="8" height="60" fill="#e2e8f0" stroke="${C.ink}"/>`, txt(tx - 10, ty + 40, "glass tube", { size: 10, anchor: "end" }));
  parts.push(line(tx, ty, tx + 100, ty, { width: 1 }), `<rect x="${tx + 100}" y="${ty - 7}" width="18" height="14" rx="3" fill="#cbd5e1" stroke="${C.ink}"/>`, txt(tx + 124, ty + 4, "rubber stopper, mass m", { size: 10 }));
  parts.push(line(tx, ty + 60, tx, ty + 120, { width: 1 }), `<rect x="${tx + 10}" y="${ty + 74}" width="10" height="6" fill="#fff" stroke="${C.ink}"/>`, txt(tx + 24, ty + 80, "position marker", { size: 10 }));
  for (let k = 0; k < 4; k++) parts.push(`<rect x="${tx - 14}" y="${ty + 120 + k * 6}" width="28" height="5" fill="#94a3b8" stroke="${C.ink}" stroke-width="0.5"/>`);
  parts.push(txt(tx + 20, ty + 134, "metal washers", { size: 10 }));
  parts.push(`<path d="M ${tx - 20} ${ty - 14} l -8 -3 l 8 -3 z" fill="${C.ink}"/>`);
  return svg(360, ty + 150, parts.join(""));
}

// ---- fan blade with three points (Knox 2023 Q8) ------------------------------------------------

export function fanPoints(): string {
  const parts: string[] = [];
  const cx = 110, cy = 120;
  parts.push(`<rect x="${cx - 10}" y="${cy - 100}" width="20" height="94" rx="6" fill="#fff" stroke="${C.ink}" stroke-width="1.6"/>`);
  for (const a of [210, 330]) {
    const x2 = cx + 90 * Math.cos(rad(a)), y2 = cy - 90 * Math.sin(rad(a));
    parts.push(line(cx, cy, x2, y2, { width: 18, color: "#e2e8f0" }), line(cx, cy, x2, y2, { width: 0.8 }));
  }
  parts.push(`<circle cx="${cx}" cy="${cy}" r="12" fill="#fff" stroke="${C.ink}" stroke-width="1.6"/>`, `<circle cx="${cx}" cy="${cy}" r="5" fill="none" stroke="${C.ink}"/>`);
  [["X", 30], ["Y", 58], ["Z", 86]].forEach(([l, d]) => {
    parts.push(dot(cx, cy - (d as number), 4.5, C.ink), txt(cx + 14, cy - (d as number) + 4, l as string, { size: 11 }));
  });
  return svg(220, 180, parts.join(""));
}

// ---- four beams with forces and axes (Newington 2019 Q6) ---------------------------------

export function beamTorquePanels(): string {
  const parts: string[] = [];
  const k = 70; // px per metre
  const beam = (x1: number, y1: number, x2: number, y2: number) =>
    parts.push(line(x1, y1, x2, y2, { width: 7, color: "#fcd9b6" }), line(x1, y1, x2, y2, { width: 0.6, color: C.ink }));
  const axis = (x: number, y: number, lx: number, ly: number) => parts.push(dot(x, y, 3.5, C.a), txt(lx, ly, "Axis", { size: 10 }), line(x, y, lx + 2, ly - 8, { width: 0.7, color: C.a }));
  const force = (x: number, y: number, lab: string) => parts.push(line(x, y, x, y + 42, { head: "end", width: 1.4, color: C.b }), txt(x + 4, y + 52, lab, { size: 10.5 }));
  // (A)
  {
    const ox = 30, oy = 90, a = 15;
    const ex = ox + 2 * k * Math.cos(rad(a)), ey = oy - 2 * k * Math.sin(rad(a));
    const fx = ox + 1.3 * k * Math.cos(rad(a)), fy = oy - 1.3 * k * Math.sin(rad(a));
    parts.push(txt(6, 20, "(A)", { size: 11, bold: true }));
    beam(ox, oy, ex, ey);
    parts.push(line(ox, oy, ox + 60, oy, { dash: "2 2", width: 0.7 }), txt(ox + 42, oy - 4, "15°", { size: 10 }));
    parts.push(txt((ox + ex) / 2 - 10, (oy + ey) / 2 - 12, "2.0 m", { size: 10 }), txt((fx + ex) / 2 + 2, (fy + ey) / 2 + 16, "0.7 m", { size: 10 }));
    force(fx, fy, "2.9 N");
    axis(ox, oy, ox + 2, oy + 24);
  }
  // (B)
  {
    const ox = 220, oy = 50;
    parts.push(txt(196, 20, "(B)", { size: 11, bold: true }));
    beam(ox, oy, ox + 2 * k, oy);
    parts.push(line(ox, oy - 14, ox + 2 * k, oy - 14, { head: "both", width: 0.8 }), txt(ox + k, oy - 18, "2.0 m", { size: 10, anchor: "middle" }));
    parts.push(line(ox, oy + 12, ox + 1.4 * k, oy + 12, { head: "both", width: 0.8 }), txt(ox + 0.7 * k, oy + 24, "1.4 m", { size: 10, anchor: "middle" }));
    force(ox + 2 * k, oy, "5.3 N");
    axis(ox + 1.4 * k, oy, ox + 1.4 * k - 6, oy + 40);
  }
  // (C)
  {
    const ox = 60, oy = 300, a = 30; // beam 30° from the vertical
    const ex = ox + 2 * k * Math.sin(rad(a)), ey = oy - 2 * k * Math.cos(rad(a));
    parts.push(txt(6, 150, "(C)", { size: 11, bold: true }));
    beam(ox, oy, ex, ey);
    parts.push(txt((ox + ex) / 2 - 30, (oy + ey) / 2, "2.0 m", { size: 10 }), txt(ex - 18, ey + 30, "30°", { size: 10 }));
    force(ex, ey, "3.4 N");
    axis(ox, oy, ox + 14, oy - 4);
  }
  // (D)
  {
    const cx = 290, cy = 230, a = 45; // axis at the middle of a 2.0 m beam
    const tx = cx - 1 * k * Math.sin(rad(a)), ty = cy - 1 * k * Math.cos(rad(a));
    const bx = cx + 1 * k * Math.sin(rad(a)), by = cy + 1 * k * Math.cos(rad(a));
    parts.push(txt(196, 150, "(D)", { size: 11, bold: true }));
    beam(tx, ty, bx, by);
    parts.push(txt(tx + 2, ty + 34, "45°", { size: 10 }), txt(cx + 12, cy - 6, "2.0 m (whole beam)", { size: 10 }), txt((cx + bx) / 2 + 8, (cy + by) / 2 + 4, "1.0 m", { size: 10 }));
    parts.push(line(tx, ty, tx, ty + 42, { head: "end", width: 1.4, color: C.b }), txt(tx - 4, ty + 40, "4.2 N", { size: 10.5, anchor: "end" }));
    axis(cx, cy, cx - 10, cy + 40);
  }
  return svg(400, 320, parts.join(""));
}

// ---- spanner on a nut (Newington 2023 Q3) -------------------------------------------------

export function spannerNut(): string {
  const parts: string[] = [];
  const y = 50;
  parts.push(`<path d="M 30 ${y - 10} L 200 ${y - 10} Q 214 ${y - 26} 236 ${y - 20} L 226 ${y - 6} L 226 ${y + 6} L 236 ${y + 20} Q 214 ${y + 26} 200 ${y + 10} L 30 ${y + 10} Z" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(`<path d="M 238 ${y} l 7 -12 l 14 0 l 7 12 l -7 12 l -14 0 z" fill="#fff" stroke="${C.ink}"/>`, `<circle cx="252" cy="${y}" r="5" fill="none" stroke="${C.ink}"/>`, txt(272, y + 4, "nut", { size: 11 }));
  parts.push(txt(120, y - 30, "spanner", { size: 11, anchor: "middle" }), line(120, y - 26, 120, y - 10, { width: 0.7 }));
  parts.push(line(36, y, 100, y, { dash: "4 3", width: 0.8 }));
  const fx = 40;
  parts.push(arrowAt(fx, y, -70, 70, { color: C.b }), txt(fx + 30, y + 80, "70.0 N", { size: 11 }), txt(fx + 14, y + 22, "70°", { size: 10.5 }));
  return svg(300, 140, parts.join(""));
}

// ---- conical pendulum with labels (Newington 2024 Q13) --------------------------------------

export function conicalPendulumMass(): string {
  const parts: string[] = [];
  const cx = 150, top = 20, by = 160, r = 70;
  parts.push(`<rect x="${cx - 110}" y="${top - 8}" width="220" height="8" fill="#94a3b8"/>`);
  parts.push(line(cx, top, cx, by, { dash: "3 3", width: 0.8 }));
  parts.push(`<ellipse cx="${cx}" cy="${by}" rx="${r + 30}" ry="14" fill="none" stroke="${C.ink}" stroke-width="0.8" stroke-dasharray="4 3"/>`);
  parts.push(line(cx, top, cx + r, by, { width: 1.2 }), `<rect x="${cx + r - 7}" y="${by - 7}" width="14" height="14" fill="#64748b"/>`);
  parts.push(line(cx + 2, by, cx + r - 9, by, { head: "both", width: 0.9 }), txt(cx + r / 2, by - 6, "0.25 m", { size: 10.5, anchor: "middle" }));
  parts.push(txt(cx + r, by + 30, "0.800 kg mass", { size: 10.5, anchor: "middle" }), txt(cx - 20, by - 16, "T = 2.0 s", { size: 10.5, bold: true, anchor: "end" }));
  return svg(320, 200, parts.join(""));
}

// ---- car rounding a corner, compass at the car (Normanhurst Boys 2020 Q3) -------------------

export function carOnCorner(): string {
  const parts: string[] = [];
  const cx = 150, cy = 110, R = 95;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(line(cx, cy, cx + R * Math.cos(rad(40)), cy - R * Math.sin(rad(40)), { width: 1 }), txt(cx + 48, cy - 50, "r", { size: 11, italic: true }));
  const x = cx - R, y = cy;
  parts.push(`<rect x="${x - 5}" y="${y - 10}" width="10" height="20" fill="#fed7aa" stroke="${C.ink}"/>`);
  parts.push(txt(x, y - 14, "N", { size: 9, anchor: "middle" }), txt(x, y + 22, "S", { size: 9, anchor: "middle" }), txt(x - 9, y + 3, "W", { size: 9, anchor: "end" }), txt(x + 9, y + 3, "E", { size: 9 }));
  return svg(260, 220, parts.join(""));
}

// ---- block on a banked track with N and mg (North Sydney Boys 2019 Q14) ---------------------

export function bankBlockForces(): string {
  const parts: string[] = [];
  const th = 32, x0 = 40, y0 = 150, len = 220;
  const x1 = x0 + len * Math.cos(rad(th)), y1 = y0 - len * Math.sin(rad(th));
  parts.push(line(x0, y0, x1, y1, { width: 1.4 }), line(x0, y0, x1, y0, { width: 1 }), line(x1, y1, x1, y0, { width: 1 }));
  parts.push(`<path d="M ${x0 + 36} ${y0} A 36 36 0 0 0 ${f(x0 + 36 * Math.cos(rad(th)))} ${f(y0 - 36 * Math.sin(rad(th)))}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`, txt(x0 + 42, y0 - 6, "θ", { size: 11, italic: true }));
  const bx = x0 + 110 * Math.cos(rad(th)), by = y0 - 110 * Math.sin(rad(th));
  parts.push(`<rect x="${f(bx - 16)}" y="${f(by - 26)}" width="32" height="26" fill="#fff" stroke="${C.ink}" transform="rotate(${-th} ${f(bx)} ${f(by)})"/>`);
  const mx = bx - 13 * Math.sin(rad(th)), my = by - 13 * Math.cos(rad(th));
  parts.push(txt(mx, my + 4, "m", { size: 12, italic: true, anchor: "middle" }));
  parts.push(arrowAt(mx, my, 90 + th, 50, { color: C.b }), txt(mx - 40, my - 44, "N", { size: 11, italic: true }));
  parts.push(arrowAt(mx, my, -90, 50, { color: C.b }), txt(mx + 6, my + 50, "mg", { size: 11, italic: true }));
  return svg(320, 170, parts.join(""));
}

// ---- loop-the-loop track (North Sydney Girls 2023 Q17) --------------------------------------

export function loopTrack(): string {
  const parts: string[] = [];
  const g = 140, R = 45, cx = 220;
  parts.push(`<rect x="20" y="${g}" width="320" height="10" fill="#e2e8f0"/>`, line(20, g, 340, g, { width: 1.4 }));
  parts.push(`<circle cx="${cx}" cy="${g - R}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="2"/>`);
  parts.push(line(70, g - 110, cx - 5, g, { width: 2 }), dot(70, g - 110, 4, C.ink), txt(76, g - 116, "P", { size: 12, italic: true }));
  parts.push(line(50, g - 110, 50, g, { head: "both", width: 1 }), txt(44, g - 55, "h", { size: 12, italic: true, anchor: "end" }));
  parts.push(line(cx, g - R, cx + R, g - R, { head: "end", width: 1 }), txt(cx + R / 2, g - R - 4, "r", { size: 11, italic: true, anchor: "middle" }));
  return svg(350, g + 14, parts.join(""));
}

// ---- mass whirled in a vertical circle (North Sydney Girls 2024 Q7) --------------------------

export function verticalCircleMass(): string {
  const parts: string[] = [];
  const cx = 110, cy = 100, R = 60;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(line(cx, cy, cx, cy - R, { width: 1 }), txt(cx + 4, cy - 26, "string", { size: 10 }));
  parts.push(line(cx, cy, cx - R * Math.cos(rad(40)), cy + R * Math.sin(rad(40)), { head: "end", width: 1 }), txt(cx - 14, cy + 50, "0.90 m", { size: 10, anchor: "middle" }));
  parts.push(dot(cx, cy - R, 4, C.ink), arrowAt(cx - 10, cy - R - 14, 0, 26, { width: 1 }), txt(cx + 22, cy - R - 10, "0.20 kg mass", { size: 10 }));
  return svg(240, 180, parts.join(""));
}

// ---- velodrome: plan of the bend and front view of the bank (North Sydney Girls 2024 Q8) ---

export function velodrome(): string {
  const parts: string[] = [];
  // Diagram A: plan of a semicircular bend
  const cx = 70, cy = 80;
  for (const r of [40, 55]) parts.push(`<path d="M 20 ${cy - r} L ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} L 20 ${cy + r}" fill="none" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(line(cx, cy, cx + 48, cy, { dash: "3 3", width: 0.8, head: "end" }), txt(cx + 14, cy - 4, "25 m", { size: 10 }));
  parts.push(dot(40, cy - 48, 4, C.ink), arrowAt(46, cy - 48, 0, 20, { width: 1 }));
  parts.push(txt(70, 160, "Diagram A", { size: 10.5, bold: true, anchor: "middle" }));
  // Diagram B: front view of the bank
  const x0 = 170, y0 = 130, th = 26;
  parts.push(line(x0, y0, 330, y0, { width: 1 }), line(x0, y0, 330, y0 - 160 * Math.tan(rad(th)), { width: 1.2 }), line(330, y0, 330, y0 - 160 * Math.tan(rad(th)), { width: 1 }));
  parts.push(txt(x0 + 34, y0 - 4, "θ", { size: 11, italic: true }), txt(330, y0 + 14, "angle of banked bend: θ", { size: 9.5, anchor: "end" }));
  parts.push(person(280, y0 - 120 * Math.tan(rad(th)), 30));
  parts.push(txt(250, 160, "Diagram B", { size: 10.5, bold: true, anchor: "middle" }));
  return svg(340, 170, parts.join(""));
}

// ---- stopper, tube and hanging mass (Pymble 2022 Q10, Sydney Boys 2019 Q4) ------------------

export function tubeApparatus(o: { tube: string; mass: string; stopper: string; showR?: boolean; rLabel?: string }): string {
  const parts: string[] = [];
  const tx = 70, ty = 40;
  parts.push(`<rect x="${tx - 8}" y="${ty}" width="16" height="70" rx="3" fill="#f1f5f9" stroke="${C.ink}"/>`, txt(tx + 14, ty + 40, o.tube, { size: 10.5 }));
  parts.push(line(tx, ty, tx + 150, ty, { width: 1 }), `<rect x="${tx + 150}" y="${ty - 10}" width="14" height="20" fill="#cbd5e1" stroke="${C.ink}"/>`, txt(tx + 168, ty + 4, o.stopper, { size: 10.5 }));
  parts.push(line(tx, ty + 70, tx, ty + 110, { width: 1 }), `<rect x="${tx - 10}" y="${ty + 110}" width="20" height="26" rx="3" fill="#94a3b8" stroke="${C.ink}"/>`, txt(tx + 16, ty + 128, o.mass, { size: 10.5 }));
  if (o.showR) parts.push(line(tx, ty - 14, tx + 150, ty - 14, { head: "both", width: 0.8 }), txt(tx + 75, ty - 18, o.rLabel ?? "r", { size: 11, italic: !o.rLabel, anchor: "middle" }));
  else parts.push(txt(tx + 75, ty - 6, "string", { size: 10.5, anchor: "middle" }));
  return svg(320, ty + 146, parts.join(""));
}

export function curveSketch(): string {
  const parts: string[] = [];
  parts.push(line(30, 130, 30, 10, { head: "end", width: 1.2 }), line(30, 130, 180, 130, { head: "end", width: 1.2 }));
  parts.push(`<path d="M 30 130 Q 120 125 150 20" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);
  return svg(200, 140, parts.join(""));
}

// ---- train on a curved track (Shore 2021 Q3) ------------------------------------------------

export function trainCurve(): string {
  const parts: string[] = [];
  for (const r of [150, 165]) parts.push(`<path d="M 20 ${30} A ${r} ${r} 0 0 1 ${20 + r * 0.8} ${30 + r * 0.6}" fill="none" stroke="${C.ink}" stroke-width="1" transform="translate(${(165 - r) * 0.3} ${(r - 150) * 0.3})"/>`);
  const px = 100, py = 60;
  parts.push(`<rect x="${px - 30}" y="${py - 7}" width="60" height="14" fill="#cbd5e1" transform="rotate(40 ${px} ${py})"/>`, dot(px, py, 5, C.ink), txt(px + 10, py - 8, "P", { size: 12 }));
  parts.push(arrowAt(px, py, -40, 34, { width: 1.2 }));
  return svg(220, 130, parts.join(""));
}

// ---- rollercoaster dip (Sydney Boys 2019 Q6) -------------------------------------------------

export function coasterDip(): string {
  const parts: string[] = [];
  const cx = 150, cy = 80, R = 70;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.b}" stroke-width="0.8" stroke-dasharray="3 3"/>`);
  parts.push(`<path d="M ${cx - 120} ${cy - 10} Q ${cx - 70} ${cy + R + 6} ${cx} ${cy + R} Q ${cx + 70} ${cy + R + 6} ${cx + 120} ${cy - 10}" fill="none" stroke="${C.ink}" stroke-width="4"/>`);
  parts.push(`<rect x="${cx - 22}" y="${cy + R - 18}" width="44" height="14" rx="5" fill="${C.ink}"/>`, `<circle cx="${cx - 8}" cy="${cy + R - 22}" r="4" fill="#64748b"/>`, `<circle cx="${cx + 4}" cy="${cy + R - 22}" r="4" fill="#64748b"/>`);
  return svg(300, cy + R + 16, parts.join(""));
}

// ---- ball swung around the body on a string (Sydney Boys 2022 Q5) ----------------------------

export function swingAroundBody(): string {
  const parts: string[] = [];
  const hx = 100, hy = 40, L = 150;
  const bx = hx + L * Math.cos(rad(30)), by = hy + L * Math.sin(rad(30));
  parts.push(`<ellipse cx="${hx}" cy="${by}" rx="${bx - hx}" ry="12" fill="none" stroke="${C.ink}" stroke-width="0.8" stroke-dasharray="3 3"/>`);
  parts.push(`<circle cx="${hx}" cy="${hy + 24}" r="12" fill="#64748b"/>`, `<rect x="${hx - 16}" y="${hy + 38}" width="32" height="70" rx="8" fill="#64748b"/>`, `<rect x="${hx - 14}" y="${hy + 104}" width="28" height="60" fill="#64748b"/>`);
  parts.push(line(hx - 12, hy + 44, hx, hy, { width: 6, color: "#64748b" }));
  parts.push(line(hx, hy, bx, by, { width: 1.2 }), line(hx, hy, hx + 60, hy, { dash: "2 2", width: 0.8 }), txt(hx + 36, hy + 14, "30°", { size: 10.5 }));
  parts.push(`<circle cx="${bx}" cy="${by}" r="5" fill="#fff" stroke="${C.ink}"/>`, txt(bx + 8, by + 4, "20 g", { size: 10.5 }));
  parts.push(line(hx + 10, hy - 14, bx + 10, by - 14, { head: "both", width: 0.8 }), txt((hx + bx) / 2 + 18, (hy + by) / 2 - 18, "1.10 m", { size: 10.5 }));
  return svg(280, 210, parts.join(""));
}

// ---- vertical circle with the ball at top and bottom (Abbotsleigh 2023 Q21) -----------------

export function verticalCircleTopBottom(): string {
  const parts: string[] = [];
  const cx = 110, cy = 100, R = 70;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.guide}" stroke-width="1" stroke-dasharray="2 2"/>`);
  parts.push(line(cx, cy - R, cx, cy + R, { width: 1.2 }), dot(cx, cy, 3.5, C.ink));
  parts.push(`<circle cx="${cx}" cy="${cy - R}" r="8" fill="#7c3aed" stroke="${C.ink}"/>`, `<circle cx="${cx}" cy="${cy + R}" r="8" fill="#22d3ee" stroke="${C.ink}"/>`);
  parts.push(`<path d="M ${cx + 14} ${cy - R - 6} Q ${cx + 44} ${cy - R - 8} ${cx + 58} ${cy - R + 6}" fill="none" stroke="${C.ink}" stroke-width="1.2" marker-end="url(#ah)"/>`);
  parts.push(`<path d="M ${cx - 14} ${cy + R + 6} Q ${cx - 44} ${cy + R + 8} ${cx - 58} ${cy + R - 6}" fill="none" stroke="${C.ink}" stroke-width="1.2" marker-end="url(#ah)"/>`);
  return svg(220, 200, parts.join(""));
}

// ---- a slope (banked track cross-section) with a car or block -------------------------------

export function bankSlope(o: { angleLabel?: string; trackLabel?: string; mass?: boolean; width?: number; title?: string } = {}): string {
  const parts: string[] = [];
  if (o.title) parts.push(txt(10, 16, o.title, { size: 11 }));
  const th = 28, x0 = 30, y0 = 140, W = o.width ?? 240;
  const x1 = x0 + W, y1 = y0 - W * Math.tan(rad(th));
  parts.push(`<path d="M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${f(y1)} Z" fill="#f8fafc" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(`<path d="M ${x0 + 44} ${y0} A 44 44 0 0 0 ${f(x0 + 44 * Math.cos(rad(th)))} ${f(y0 - 44 * Math.sin(rad(th)))}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(txt(x0 + 50, y0 - 8, o.angleLabel ?? "θ", { size: 11, italic: !o.angleLabel }));
  const bx = x0 + 0.5 * W, by = y0 - 0.5 * W * Math.tan(rad(th));
  parts.push(`<rect x="${f(bx - 22)}" y="${f(by - 30)}" width="44" height="30" rx="${o.mass ? 0 : 6}" fill="${o.mass ? "#fff" : "#cbd5e1"}" stroke="${C.ink}" transform="rotate(${-th} ${f(bx)} ${f(by)})"/>`);
  if (o.mass) parts.push(txt(bx + 7 * Math.sin(rad(th)), by - 14 * Math.cos(rad(th)) + 4, "m", { size: 12, italic: true, anchor: "middle" }));
  if (o.trackLabel) parts.push(txt(x1 - 70, y1 + 2, o.trackLabel, { size: 10.5, anchor: "end" }));
  return svg(x1 + 20, y0 + 10, parts.join(""));
}

// ---- flat and banked bends, rear views (Baulkham Hills 2023 Q23) -----------------------------

export function flatAndBankedCar(): string {
  const parts: string[] = [];
  const car = (x: number, y: number, rot: number) =>
    parts.push(`<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 34}" y="${y - 36}" width="68" height="30" rx="8" fill="#e2e8f0" stroke="${C.ink}"/><rect x="${x - 26}" y="${y - 52}" width="52" height="18" rx="6" fill="#f8fafc" stroke="${C.ink}"/><rect x="${x - 32}" y="${y - 8}" width="12" height="8" fill="${C.ink}"/><rect x="${x + 20}" y="${y - 8}" width="12" height="8" fill="${C.ink}"/></g>`);
  // flat
  parts.push(line(20, 150, 170, 150, { width: 1.4 }));
  car(95, 150, 0);
  parts.push(`<path d="M 100 80 Q 100 50 70 44" fill="none" stroke="${C.ink}" stroke-width="1.2" marker-end="url(#ah)"/>`, txt(40, 40, "Road", { size: 10.5 }));
  // banked (low side on the left, towards the centre of the curve)
  const th = 25, x0 = 200, y0 = 150;
  parts.push(line(x0, y0, 370, y0, { width: 1 }), line(x0, y0, 370, y0 - 170 * Math.tan(rad(th)), { width: 1.4 }));
  parts.push(`<path d="M ${x0 + 40} ${y0} A 40 40 0 0 0 ${f(x0 + 40 * Math.cos(rad(th)))} ${f(y0 - 40 * Math.sin(rad(th)))}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`, txt(x0 + 46, y0 - 4, "θ", { size: 11, italic: true }));
  car(290, y0 - 90 * Math.tan(rad(th)), -th);
  parts.push(`<path d="M 345 60 Q 345 30 315 24" fill="none" stroke="${C.ink}" stroke-width="1.2" marker-end="url(#ah)"/>`, txt(295, 18, "Road", { size: 10.5 }));
  return svg(380, 162, parts.join(""));
}

// ---- carousel with a hanging mass (James Ruse 2022 Q35) --------------------------------------

export function carouselMass(): string {
  const parts: string[] = [];
  const cx = 130, top = 40, bot = 180, R = 110;
  parts.push(`<ellipse cx="${cx}" cy="${top}" rx="${R + 10}" ry="16" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`, `<ellipse cx="${cx}" cy="${bot}" rx="${R + 10}" ry="16" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(`<rect x="${cx - 26}" y="${top}" width="52" height="${bot - top}" fill="#94a3b8"/>`, `<ellipse cx="${cx}" cy="${top}" rx="30" ry="5" fill="#475569"/>`, `<ellipse cx="${cx}" cy="${bot}" rx="30" ry="5" fill="#475569"/>`);
  parts.push(line(cx + R, top, cx + R, bot, { width: 3, color: "#475569" }));
  parts.push(line(cx, top - 26, cx + R, top - 26, { head: "both", width: 0.9 }), txt(cx + R / 2, top - 30, "R", { size: 11, italic: true, anchor: "middle" }));
  parts.push(line(cx + R, top + 10, cx + R + 22, top + 120, { width: 1 }), dot(cx + R + 22, top + 120, 4, C.ink), txt(cx + R + 28, top + 128, "m", { size: 11, italic: true }));
  parts.push(line(cx + R, top + 10, cx + R, top + 60, { dash: "2 2", width: 0.7 }), txt(cx + R + 14, top + 40, "θ", { size: 11, italic: true }));
  return svg(290, bot + 22, parts.join(""));
}

// ---- object on a rope: horizontal and vertical circles (Knox 2020 Q26) -----------------------

export function horizontalVerticalCircles(): string {
  const parts: string[] = [];
  parts.push(txt(110, 40, "Horizontal", { size: 11, anchor: "middle" }));
  parts.push(`<ellipse cx="110" cy="100" rx="90" ry="7" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`, dot(20, 100, 4.5, C.ink), dot(200, 100, 4.5, C.ink));
  parts.push(txt(16, 90, "M", { size: 11, anchor: "end" }), txt(204, 90, "N", { size: 11 }));
  parts.push(txt(345, 110, "Vertical", { size: 11 }));
  parts.push(`<ellipse cx="300" cy="110" rx="32" ry="90" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`, dot(300, 20, 4.5, C.ink), dot(300, 200, 4.5, C.ink));
  parts.push(txt(290, 16, "X", { size: 11, anchor: "end" }), txt(310, 214, "Y", { size: 11 }));
  return svg(400, 222, parts.join(""));
}

// ---- flat curve (plan view) and banked curve (cross-section) (Knox 2023 CT1 Q4) -------------

export function flatAndBankedCurve(): string {
  const parts: string[] = [];
  parts.push(txt(120, 16, "FLAT NON-BANKED CURVE", { size: 10, anchor: "middle" }));
  parts.push(`<path d="M 40 170 Q 50 60 160 30" fill="none" stroke="${C.ink}" stroke-width="2"/>`);
  parts.push(`<rect x="52" y="86" width="14" height="30" fill="#cbd5e1" stroke="${C.ink}" transform="rotate(25 59 101)"/>`);
  parts.push(txt(120, 200, "BANKED CURVE", { size: 10, anchor: "middle" }));
  const x0 = 30, y0 = 320, W = 240, th = 12;
  parts.push(`<path d="M ${x0} ${y0} L ${x0 + W} ${y0} L ${x0} ${f(y0 - W * Math.tan(rad(th)) - 20)} Z" fill="#cbd5e1" stroke="${C.ink}"/>`);
  const bx = x0 + 120, by = y0 - (W - 120) * ((W * Math.tan(rad(th)) + 20) / W);
  const slope = (Math.atan((W * Math.tan(rad(th)) + 20) / W) * 180) / Math.PI;
  parts.push(`<rect x="${f(bx - 24)}" y="${f(by - 32)}" width="48" height="32" fill="#e2e8f0" stroke="${C.ink}" transform="rotate(${f(slope)} ${f(bx)} ${f(by)})"/>`);
  return svg(300, 330, parts.join(""));
}

// ---- conical pendulum with labelled angle and radius (Newington 2019 Q22) -------------------

export function pendulumCone(o: { angle: string; radius: string; stringLabel?: string; ballLabel?: string; ceilingLabel?: string }): string {
  const parts: string[] = [];
  const cx = 160, top = 20, by = 150, r = 80;
  parts.push(`<rect x="${cx - 18}" y="${top - 6}" width="36" height="6" fill="${C.ink}"/>`);
  parts.push(line(cx, top, cx, by, { dash: "3 3", width: 0.8 }), txt(cx + 6, 80, "vertical", { size: 10 }));
  parts.push(`<ellipse cx="${cx}" cy="${by}" rx="${r}" ry="8" fill="none" stroke="${C.ink}" stroke-width="0.8" stroke-dasharray="4 3"/>`);
  parts.push(line(cx, top, cx - r, by, { width: 1.2 }), dot(cx - r, by, 5, C.ink));
  parts.push(`<path d="M ${cx} ${top + 26} A 26 26 0 0 1 ${f(cx - 26 * Math.sin(Math.atan(r / (by - top))))} ${f(top + 26 * Math.cos(Math.atan(r / (by - top))))}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`, txt(cx + 6, top + 34, o.angle, { size: 10 }));
  parts.push(line(cx, by, cx + r, by, { dash: "3 3", width: 0.8 }), txt(cx + r / 2, by + 20, o.radius, { size: 10.5, anchor: "middle" }));
  if (o.ceilingLabel) parts.push(txt(cx + 24, top - 10, o.ceilingLabel, { size: 10 }));
  if (o.stringLabel) parts.push(txt(cx - r / 2 - 14, (top + by) / 2, o.stringLabel, { size: 10, anchor: "end" }));
  if (o.ballLabel) parts.push(txt(cx - r - 10, by + 4, o.ballLabel, { size: 10, anchor: "end" }));
  return svg(300, by + 28, parts.join(""));
}

// ---- marble track ending in a vertical loop (North Sydney Boys 2022 Q20) --------------------

export function marbleLoop(): string {
  const parts: string[] = [];
  const g = 190, k = 150; // px per metre
  const ax = 70, ay = g - 0.80 * k, bx = 300, R = (0.35 * k) / 2;
  parts.push(line(20, g, 400, g, { width: 1.4 }), txt(150, g + 16, "ground", { size: 10.5, anchor: "middle" }));
  parts.push(line(ax, ay, bx, g, { width: 1.3 }));
  parts.push(txt(ax - 4, ay - 8, "A", { size: 11, bold: true, anchor: "middle" }));
  parts.push(line(ax, ay, ax, g, { head: "both", width: 0.9 }), txt(ax - 6, (ay + g) / 2, "0.80 m", { size: 10.5, anchor: "end" }));
  parts.push(dot(ax + 46, ay + 0.8 * 46 / 2.9 + 10, 4.5, C.ink), txt(ax + 56, ay + 24, "marble", { size: 10.5 }));
  parts.push(`<circle cx="${bx}" cy="${g - R}" r="${f(R)}" fill="none" stroke="${C.ink}" stroke-width="1.3"/>`);
  parts.push(`<circle cx="${bx}" cy="${g - 2 * R + 5}" r="5" fill="none" stroke="${C.ink}"/>`);
  parts.push(txt(bx - 6, g - 2 * R - 6, "C", { size: 11, bold: true, anchor: "end" }), txt(bx, g + 16, "B", { size: 11, bold: true, anchor: "middle" }));
  parts.push(line(bx + R + 16, g - 2 * R, bx + R + 16, g, { head: "both", width: 0.9 }), txt(bx + R + 22, g - R, "0.35 m", { size: 10.5 }));
  return svg(410, g + 24, parts.join(""));
}

// ---- plane banking, lift and weight (North Sydney Girls 2022 Q27) ---------------------------

export function planeBank(): string {
  const parts: string[] = [];
  const cx = 180, cy = 130, th = 26;
  parts.push(line(cx, 20, cx, cy + 10, { dash: "4 3", width: 0.8 }));
  // wings, tilted
  parts.push(`<g transform="rotate(${-th} ${cx} ${cy})"><line x1="${cx - 95}" y1="${cy}" x2="${cx + 95}" y2="${cy}" stroke="${C.ink}" stroke-width="2"/><ellipse cx="${cx}" cy="${cy}" rx="26" ry="9" fill="#e2e8f0" stroke="${C.ink}" stroke-width="1"/><line x1="${cx - 70}" y1="${cy}" x2="${cx - 56}" y2="${cy - 14}" stroke="${C.ink}" stroke-width="1.4"/></g>`);
  parts.push(arrowAt(cx, cy, 90 - th, 92, { color: C.b, width: 1.8 }));
  parts.push(subTxt(cx + 92 * Math.sin(rad(th)) + 8, cy - 92 * Math.cos(rad(th)) + 10, "F", "L", { size: 12, italic: true }));
  parts.push(arrowAt(cx, cy, -90, 92, { color: C.b, width: 1.8 }));
  parts.push(subTxt(cx + 8, cy + 100, "F", "g", { size: 12, italic: true }));
  parts.push(`<path d="M ${cx} ${cy - 46} A 46 46 0 0 1 ${f(cx + 46 * Math.sin(rad(th)))} ${f(cy - 46 * Math.cos(rad(th)))}" fill="none" stroke="${C.ink}" stroke-width="0.9"/>`, txt(cx + 8, cy - 48, "θ", { size: 11, italic: true }));
  parts.push(dot(cx, cy, 4, C.ink));
  return svg(360, 250, parts.join(""));
}

// ---- coin on a rotating disc (North Sydney Girls 2023 Q27) ----------------------------------

export function rotatingDisc(): string {
  const parts: string[] = [];
  const cx = 160, cy = 130, R = 85;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);
  parts.push(`<path d="M ${cx - 50} ${cy - R - 14} A 60 60 0 0 1 ${cx + 56} ${cy - R - 10}" fill="none" stroke="${C.ink}" stroke-width="1" marker-end="url(#ah)"/>`);
  parts.push(dot(cx, cy, 3, C.ink), txt(cx - 8, cy + 4, "O", { size: 11, italic: true, anchor: "end" }));
  parts.push(line(cx + 4, cy - 8, cx + 62, cy - 8, { head: "both", width: 0.9 }), txt(cx + 34, cy - 14, "1.35 m", { size: 10.5, anchor: "middle" }));
  parts.push(`<circle cx="${cx + 62}" cy="${cy}" r="7" fill="#94a3b8" stroke="${C.ink}"/>`);
  parts.push(txt(cx + R + 18, cy + 34, "Coin A", { size: 10.5 }), line(cx + R + 16, cy + 30, cx + 70, cy + 6, { width: 0.7 }));
  parts.push(txt(30, cy + 20, "Rotating", { size: 10.5 }), txt(30, cy + 33, "disc", { size: 10.5 }), line(70, cy + 16, cx - R + 12, cy + 34, { width: 0.7 }));
  return svg(360, 250, parts.join(""));
}

// ---- Ferris wheel with capsules at A (side) and B (top) (North Sydney Girls 2024 Q23) -------

export function ferrisWheel(): string {
  const parts: string[] = [];
  const cx = 150, cy = 130, R = 95;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="1"/>`);
  for (let a = 0; a < 360; a += 15) {
    const x = cx + R * Math.cos(rad(a)), y = cy - R * Math.sin(rad(a));
    parts.push(line(cx, cy, x, y, { width: 0.4, color: C.guide }), dot(x, y, 3.5, C.ink));
  }
  parts.push(dot(cx, cy, 7, C.ink), txt(cx - R - 10, cy - 6, "Hub", { size: 10, anchor: "end" }), line(cx - R - 8, cy - 8, cx - 8, cy - 2, { width: 0.6 }));
  parts.push(`<rect x="${cx - 40}" y="${cy + R + 4}" width="80" height="8" fill="#94a3b8"/>`, txt(cx + 46, cy + R + 12, "Ground", { size: 10 }));
  parts.push(dot(cx + R, cy, 5, C.b), txt(cx + R + 8, cy + 4, "A", { size: 12, bold: true }));
  parts.push(dot(cx, cy - R, 5, C.b), txt(cx - 4, cy - R - 8, "B", { size: 12, bold: true, anchor: "end" }));
  parts.push(line(cx + 6, cy - R - 6, cx + 44, cy - R - 2, { head: "end", width: 1.1 }), txt(cx + 48, cy - R - 2, "0.26 m s⁻¹", { size: 10 }));
  parts.push(txt(20, 20, "Not to scale", { size: 10 }));
  return svg(330, cy + R + 26, parts.join(""));
}

// ---- wheel nut and spanner with a force at the end (Shore 2020 Q22) --------------------------

export function wheelSpanner(): string {
  const parts: string[] = [];
  const nx = 220, ny = 90;
  parts.push(`<circle cx="${nx}" cy="${ny}" r="62" fill="none" stroke="${C.guide}" stroke-width="10"/>`);
  parts.push(`<circle cx="${nx}" cy="${ny}" r="30" fill="#e2e8f0" stroke="${C.ink}"/>`);
  for (let a = 0; a < 360; a += 72) parts.push(`<circle cx="${f(nx + 18 * Math.cos(rad(a)))}" cy="${f(ny - 18 * Math.sin(rad(a)))}" r="3.5" fill="#fff" stroke="${C.ink}" stroke-width="0.7"/>`);
  parts.push(`<path d="M ${nx} ${ny} l 8 -12 l 14 0 l 8 12 l -8 12 l -14 0 z" fill="#cbd5e1" stroke="${C.ink}" stroke-width="0.8" transform="translate(-15 0)"/>`);
  parts.push(`<rect x="${nx - 130}" y="${ny - 5}" width="118" height="10" rx="3" fill="#fff" stroke="${C.ink}" stroke-width="1.2"/>`);
  parts.push(arrowAt(nx - 124, ny - 50, -90, 42, { width: 2.4 }), txt(nx - 132, ny - 46, "F", { size: 13, bold: true, anchor: "end" }));
  parts.push(line(nx - 126, ny + 16, nx - 20, ny + 16, { head: "both", width: 0.9 }), txt(nx - 72, ny + 30, "20 cm", { size: 10.5, anchor: "middle" }));
  return svg(300, 180, parts.join(""));
}

// ---- coin on a turntable: side and overhead views (Sydney Girls 2020 Q30) --------------------

export function coinTurntable(): string {
  const parts: string[] = [];
  // side view
  parts.push(line(20, 110, 180, 110, { width: 3 }));
  parts.push(`<rect x="146" y="104" width="14" height="6" rx="2" fill="#f59e0b" stroke="${C.ink}" stroke-width="0.6"/>`);
  parts.push(line(100, 40, 100, 130, { dash: "4 3", width: 0.8 }));
  parts.push(txt(100, 150, "side view", { size: 10.5, anchor: "middle" }));
  // overhead view
  const cx = 300, cy = 95, R = 70;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#ede9fe" stroke="${C.ink}" stroke-width="1"/>`);
  parts.push(line(cx - 9, cy, cx + 9, cy, { width: 1 }), line(cx, cy - 9, cx, cy + 9, { width: 1 }));
  parts.push(`<circle cx="${cx + 48}" cy="${cy}" r="8" fill="#f59e0b" stroke="${C.ink}" stroke-width="0.6"/>`);
  parts.push(line(cx + 4, cy - 12, cx + 44, cy - 12, { head: "both", width: 0.9 }), txt(cx + 24, cy - 18, "15 cm", { size: 10, anchor: "middle" }));
  parts.push(`<path d="M ${cx + 40} ${cy - R - 12} A 56 56 0 0 0 ${cx - 40} ${cy - R - 12}" fill="none" stroke="${C.ink}" stroke-width="1" marker-end="url(#ah)"/>`);
  parts.push(txt(cx, 150, "overhead view", { size: 10.5, anchor: "middle" }));
  parts.push(txt(100, 20, "a coin on a turntable", { size: 10.5, anchor: "middle" }));
  return svg(390, 160, parts.join(""));
}

// ---- two spheres on strings from the same point (Sydney Grammar 2022 Q34) -------------------

export function twoSpheresStrings(): string {
  const parts: string[] = [];
  const cx = 150, top = 20, by = 150, s = 230; // px per metre
  parts.push(line(cx, top, cx, by, { width: 2 }), txt(cx - 4, top - 6, "X", { size: 11, anchor: "end" }));
  parts.push(`<ellipse cx="${cx}" cy="${by}" rx="${0.2 * s}" ry="14" fill="none" stroke="${C.guide}" stroke-width="0.9" stroke-dasharray="4 3"/>`);
  parts.push(`<ellipse cx="${cx}" cy="${by}" rx="${0.3 * s}" ry="22" fill="none" stroke="${C.guide}" stroke-width="0.9" stroke-dasharray="4 3"/>`);
  for (const [r, lab] of [[0.2, "A"], [0.3, "B"]] as Array<[number, string]>) {
    const x = cx + r * s;
    parts.push(line(cx, top, x, by, { width: 1.2, color: C.a }), dot(x, by, 5, C.a), txt(x, by + 16, lab, { size: 11, anchor: "middle" }));
  }
  parts.push(line(cx - 0.2 * s, by - 4, cx - 2, by - 4, { head: "both", width: 0.9, color: C.b }), txt(cx - 0.1 * s, by - 10, "0.20 m", { size: 10, anchor: "middle", color: C.b }));
  parts.push(line(cx - 0.3 * s, by + 36, cx - 2, by + 36, { head: "both", width: 0.9, color: C.b }), txt(cx - 0.15 * s, by + 48, "0.30 m", { size: 10, anchor: "middle", color: C.b }));
  return svg(330, by + 58, parts.join(""));
}

// ---- car on a curved (bowl) banked track (Sydney Grammar 2022 Q35) ---------------------------

export function bowlTrack(): string {
  const parts: string[] = [];
  const g = 170, x0 = 60, k = 1.6;
  parts.push(`<path d="M ${x0} ${g} Q ${x0 + 130} ${g} ${x0 + 230} ${g - 120}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);
  parts.push(`<path d="M ${x0} ${g} Q ${x0 + 60} ${g - 120} ${x0 + 160} ${g - 150}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="3 3"/>`);
  parts.push(line(x0 + 230, g - 120, x0 + 230, g, { width: 1 }));
  const bx = x0 + 128, by = g - 36, th = 30;
  parts.push(`<rect x="${f(bx - 24)}" y="${f(by - 20)}" width="48" height="20" rx="5" fill="#cbd5e1" stroke="${C.ink}" transform="rotate(${-th} ${f(bx)} ${f(by)})"/>`, txt(bx - 6, by - 26, "m", { size: 11, italic: true }));
  parts.push(`<path d="M ${x0 + 50} ${g} A 50 50 0 0 0 ${f(x0 + 50 * Math.cos(rad(th)))} ${f(g - 50 * Math.sin(rad(th)))}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`, txt(x0 + 44, g - 6, "θ", { size: 11, italic: true, anchor: "end" }));
  parts.push(line(bx + 36, by - 6, bx + 36, g, { head: "both", width: 0.9 }), txt(bx + 42, by + 14, "h", { size: 11, italic: true }));
  parts.push(line(20, g + 16, x0 + 230, g + 16, { head: "both", width: 0.9, dash: "3 2" }), txt((20 + x0 + 230) / 2, g + 30, "r", { size: 11, italic: true, anchor: "middle" }));
  void k;
  return svg(x0 + 260, g + 38, parts.join(""));
}

// ---- torque: a rod with a force at its end (Sydney Grammar 2024 Q21) ------------------------

export function torqueVector(): string {
  const parts: string[] = [];
  const ox = 40, oy = 140, a = 26, L = 170;
  const ex = ox + L * Math.cos(rad(a)), ey = oy - L * Math.sin(rad(a));
  parts.push(line(ox, oy, ex, ey, { width: 5, color: "#334155" }));
  parts.push(`<circle cx="${ox}" cy="${oy}" r="6" fill="#cbd5e1" stroke="${C.ink}"/>`, txt(ox - 10, oy + 4, "O", { size: 11, italic: true, anchor: "end" }));
  parts.push(line(ex, ey, ex + 54 * Math.cos(rad(a)), ey - 54 * Math.sin(rad(a)), { dash: "4 3", width: 0.8 }));
  parts.push(arrowAt(ex, ey, a - 40, 80, { width: 1.8 }));
  parts.push(`<path d="M ${f(ex + 44 * Math.cos(rad(a)))} ${f(ey - 44 * Math.sin(rad(a)))} A 44 44 0 0 1 ${f(ex + 44 * Math.cos(rad(a - 40)))} ${f(ey - 44 * Math.sin(rad(a - 40)))}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);
  parts.push(txt((ox + ex) / 2 - 16, (oy + ey) / 2 - 12, "r = 1.2 m", { size: 11.5, italic: true, anchor: "middle" }));
  parts.push(txt(ex + 54, ey - 26, "θ = 40°", { size: 11.5, italic: true }));
  parts.push(txt(ex + 86 * Math.cos(rad(a - 40)) + 4, ey - 86 * Math.sin(rad(a - 40)) + 12, "F = 6.4 N", { size: 11.5, italic: true }));
  return svg(360, 200, parts.join(""));
}

// ---- conical pendulum with the forces marked (Sydney Grammar 2024 Q37) -----------------------

export function conicalPendulumForces(): string {
  const parts: string[] = [];
  const cx = 180, top = 25, by = 165, r = 90;
  parts.push(`<rect x="${cx - 90}" y="${top - 6}" width="180" height="5" fill="${C.ink}"/>`);
  parts.push(line(cx, top, cx, by, { dash: "3 3", width: 0.8 }), txt(cx + 6, (top + by) / 2, "h", { size: 11, italic: true }));
  parts.push(`<ellipse cx="${cx}" cy="${by}" rx="${r}" ry="16" fill="none" stroke="${C.ink}" stroke-width="0.9"/>`);
  parts.push(line(cx, top, cx - r, by, { width: 1.2 }), txt(cx - r / 2 - 10, (top + by) / 2 - 4, "L", { size: 11, italic: true, anchor: "end" }));
  parts.push(`<circle cx="${cx - r}" cy="${by}" r="7" fill="${C.ink}"/>`, txt(cx - r - 12, by + 4, "m", { size: 11, italic: true, anchor: "end" }));
  parts.push(`<path d="M ${cx} ${top + 30} A 30 30 0 0 0 ${f(cx - 30 * Math.sin(Math.atan(r / (by - top))))} ${f(top + 30 * Math.cos(Math.atan(r / (by - top))))}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`, txt(cx + 6, top + 26, "θ", { size: 11, italic: true }));
  parts.push(arrowAt(cx - r, by, 90 - (Math.atan(r / (by - top)) * 180) / Math.PI, 56, { color: C.b, width: 1.5 }), txt(cx - r + 6, by - 42, "T", { size: 11, italic: true }));
  parts.push(arrowAt(cx - r, by, -90, 44, { color: C.b, width: 1.5 }), txt(cx - r - 6, by + 44, "mg", { size: 11, italic: true, anchor: "end" }));
  parts.push(line(cx - r + 10, by + 16, cx - r + 60, by + 16, { head: "end", width: 1.2 }), txt(cx - r + 64, by + 20, "velocity", { size: 10 }));
  parts.push(line(cx - r + 8, by - 2, cx - 6, by - 2, { head: "both", width: 0.8 }), txt(cx - r / 2, by - 8, "r", { size: 11, italic: true, anchor: "middle" }));
  return svg(360, by + 66, parts.join(""));
}

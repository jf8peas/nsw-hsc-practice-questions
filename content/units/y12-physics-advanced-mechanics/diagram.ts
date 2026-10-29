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

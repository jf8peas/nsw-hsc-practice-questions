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
}): string {
  const S = o.size ?? 250;
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
  return svg(S, S, parts.join(""));
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

export function fieldStrengthGraph(o: { gm: number; rMin: number; rMax: number; gMax: number }): string {
  const L = 44, T = 22, PW = 300, PH = 200;
  const X = (r: number) => L + (r / o.rMax) * PW;
  const Y = (g: number) => T + PH - (g / o.gMax) * PH;
  const parts: string[] = [];
  for (let k = 0; k <= 20; k++) {
    const r = (k * o.rMax) / 20;
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
  for (let k = 1; k <= 5; k++) {
    const r = (k * o.rMax) / 5;
    const e = Math.floor(Math.log10(r));
    const m = Math.round(r / 10 ** e);
    const label = `${m}×10${String(e).split("").map((d) => sup[Number(d)]).join("")}`;
    parts.push(txt(X(r), T + PH + 13, label, { anchor: "middle", size: 9.5 }));
  }
  parts.push(txt(L - 4, T - 8, "g (m s⁻²)", { size: 10, italic: true }));
  parts.push(txt(L + PW / 2, T + PH + 30, "r (m)", { anchor: "middle", size: 10.5, italic: true }));
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

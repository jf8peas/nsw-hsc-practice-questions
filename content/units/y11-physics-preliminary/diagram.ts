// Pure SVG builders for Year 11 physics diagrams. No dependencies — the string
// is embedded in question data and rendered with dangerouslySetInnerHTML.

const VB_W = 340;
const VB_H = 240;

const C = {
  axis: "#475569",
  ink: "#0f172a",
  a: "#1d4ed8", // primary line / incident ray
  b: "#c2410c", // secondary line / refracted ray
  c: "#15803d", // tertiary
  guide: "#94a3b8",
  text: "#334155",
};

function txt(
  x: number,
  y: number,
  s: string,
  o: { bold?: boolean; anchor?: string; size?: number; color?: string } = {},
) {
  const w = o.bold ? ' font-weight="700"' : "";
  const a = o.anchor ? ` text-anchor="${o.anchor}"` : "";
  return `<text x="${x}" y="${y}" fill="${o.color ?? C.text}" font-size="${o.size ?? 11}" font-family="ui-sans-serif, system-ui, sans-serif"${w}${a}>${s}</text>`;
}

function svg(inner: string): string {
  return (
    `<svg viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
    `<path d="M0 0 L10 5 L0 10 z" fill="${C.ink}"/></marker>` +
    `<marker id="ax" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
    `<path d="M0 0 L10 5 L0 10 z" fill="${C.axis}"/></marker></defs>` +
    inner +
    `</svg>`
  );
}

// ---- motion graph -----------------------------------------------------

const GX = 46;
const GY = 200;
const GW = 250;
const GH = 168;

/**
 * A displacement–time / velocity–time / acceleration–time graph.
 * `points` are normalised (t, y) in 0..1; a y of 0.5 is the horizontal axis
 * only when `zeroAtMiddle` is set (needed for graphs that go negative).
 */
export function motionGraph(opts: {
  yLabel: string;
  points: Array<[number, number]>;
  zeroAtMiddle?: boolean;
  caption?: string;
}): string {
  const { yLabel, points, zeroAtMiddle = false, caption } = opts;
  const baseY = zeroAtMiddle ? GY - GH / 2 : GY;
  const toX = (t: number) => GX + Math.max(0, Math.min(1, t)) * GW;
  const toY = (y: number) =>
    zeroAtMiddle
      ? GY - GH / 2 - Math.max(-1, Math.min(1, y)) * (GH / 2)
      : GY - Math.max(0, Math.min(1, y)) * GH;

  const poly = points.map(([t, y]) => `${toX(t).toFixed(1)},${toY(y).toFixed(1)}`).join(" ");

  const parts = [
    `<line x1="${GX}" y1="${baseY}" x2="${GX + GW + 14}" y2="${baseY}" stroke="${C.axis}" stroke-width="1.5" marker-end="url(#ax)"/>`,
    `<line x1="${GX}" y1="${GY}" x2="${GX}" y2="${GY - GH - 14}" stroke="${C.axis}" stroke-width="1.5" marker-end="url(#ax)"/>`,
    zeroAtMiddle
      ? `<line x1="${GX}" y1="${GY}" x2="${GX}" y2="${GY - GH}" stroke="${C.axis}" stroke-width="1.5"/>`
      : "",
    txt(GX + GW + 10, baseY + 16, "Time", { anchor: "end" }),
    txt(GX - 14, 12, yLabel, { anchor: "start" }),
    `<polyline points="${poly}" fill="none" stroke="${C.a}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    caption ? txt(VB_W / 2, VB_H - 4, caption, { anchor: "middle", size: 10 }) : "",
  ];
  return svg(parts.join(""));
}

// ---- free-body / forces --------------------------------------------

/** A box with labelled force arrows. `forces` give direction and relative length. */
export function forces(opts: {
  bodyLabel?: string;
  forces: Array<{ dir: "up" | "down" | "left" | "right"; label: string; len?: number }>;
  caption?: string;
}): string {
  const cx = VB_W / 2;
  const cy = 118;
  const bw = 54;
  const bh = 40;
  const parts = [
    `<rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="4" fill="#e2e8f0" stroke="${C.ink}" stroke-width="1.5"/>`,
    opts.bodyLabel ? txt(cx, cy + 4, opts.bodyLabel, { anchor: "middle", bold: true }) : "",
  ];
  const edge = { up: [0, -bh / 2], down: [0, bh / 2], left: [-bw / 2, 0], right: [bw / 2, 0] } as const;
  for (const f of opts.forces) {
    const [ex, ey] = edge[f.dir];
    const L = (f.len ?? 1) * 46;
    const sx = cx + ex;
    const sy = cy + ey;
    const tx = sx + (f.dir === "left" ? -L : f.dir === "right" ? L : 0);
    const ty = sy + (f.dir === "up" ? -L : f.dir === "down" ? L : 0);
    parts.push(
      `<line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" stroke="${C.a}" stroke-width="2.5" marker-end="url(#ah)"/>`,
    );
    const lx = tx + (f.dir === "left" ? -4 : f.dir === "right" ? 4 : 0);
    const ly = ty + (f.dir === "up" ? -4 : f.dir === "down" ? 12 : 4);
    const anchor = f.dir === "left" ? "end" : f.dir === "right" ? "start" : "middle";
    parts.push(txt(lx, ly, f.label, { anchor, color: C.a, bold: true }));
  }
  if (opts.caption) parts.push(txt(VB_W / 2, VB_H - 4, opts.caption, { anchor: "middle", size: 10 }));
  return svg(parts.join(""));
}

// ---- transverse wave ----------------------------------------------

export function wave(opts: { showWavelength?: boolean; showAmplitude?: boolean; caption?: string } = {}): string {
  const x0 = 40;
  const x1 = 300;
  const mid = 120;
  const amp = 46;
  const cycles = 2;
  const seg: string[] = [];
  const N = 80;
  for (let i = 0; i <= N; i++) {
    const x = x0 + (i / N) * (x1 - x0);
    const y = mid - amp * Math.sin((i / N) * cycles * 2 * Math.PI);
    seg.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const parts = [
    `<line x1="${x0 - 6}" y1="${mid}" x2="${x1 + 12}" y2="${mid}" stroke="${C.axis}" stroke-width="1.25" marker-end="url(#ax)"/>`,
    `<polyline points="${seg.join(" ")}" fill="none" stroke="${C.a}" stroke-width="2.5"/>`,
    txt(x1 + 8, mid + 15, "Distance", { anchor: "end" }),
  ];
  const period = (x1 - x0) / cycles;
  if (opts.showWavelength !== false) {
    const wx0 = x0 + period * 0.25; // first crest
    const wx1 = wx0 + period;
    const wy = mid - amp - 12;
    parts.push(
      `<line x1="${wx0}" y1="${wy}" x2="${wx1}" y2="${wy}" stroke="${C.b}" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/>`,
      `<line x1="${wx0}" y1="${wy}" x2="${wx0}" y2="${mid - amp}" stroke="${C.guide}" stroke-width="1" stroke-dasharray="3 2"/>`,
      `<line x1="${wx1}" y1="${wy}" x2="${wx1}" y2="${mid - amp}" stroke="${C.guide}" stroke-width="1" stroke-dasharray="3 2"/>`,
      txt((wx0 + wx1) / 2, wy - 5, "X", { anchor: "middle", color: C.b, bold: true }),
    );
  }
  if (opts.showAmplitude !== false) {
    const ax = x0 + period * 0.75; // a trough
    parts.push(
      `<line x1="${ax}" y1="${mid}" x2="${ax}" y2="${mid + amp}" stroke="${C.c}" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/>`,
      txt(ax + 6, mid + amp / 2 + 4, "Y", { color: C.c, bold: true }),
    );
  }
  if (opts.caption) parts.push(txt(VB_W / 2, VB_H - 4, opts.caption, { anchor: "middle", size: 10 }));
  return svg(parts.join(""));
}

// ---- ray at a boundary -------------------------------------------

/**
 * A light ray meeting a horizontal boundary between medium 1 (top) and medium 2
 * (bottom). Angles are from the normal, in degrees. If `denserBelow`, the
 * refracted ray bends toward the normal.
 */
export function rays(opts: {
  incidenceDeg: number;
  denserBelow: boolean;
  showReflected?: boolean;
  topLabel?: string;
  bottomLabel?: string;
  caption?: string;
}): string {
  const ox = VB_W / 2;
  const oy = 120;
  const rad = (d: number) => (d * Math.PI) / 180;
  const i = rad(opts.incidenceDeg);
  const rDeg = opts.denserBelow
    ? opts.incidenceDeg * 0.62
    : Math.min(80, opts.incidenceDeg * 1.5);
  const r = rad(rDeg);
  const L = 92;

  const parts = [
    `<line x1="30" y1="${oy}" x2="310" y2="${oy}" stroke="${C.ink}" stroke-width="1.5"/>`,
    `<line x1="${ox}" y1="${oy - 78}" x2="${ox}" y2="${oy + 78}" stroke="${C.guide}" stroke-width="1" stroke-dasharray="4 3"/>`,
    txt(ox + 4, oy - 72, "normal", { color: C.guide }),
    txt(36, oy - 8, opts.topLabel ?? "medium 1", {}),
    txt(36, oy + 16, opts.bottomLabel ?? "medium 2", {}),
    // incident ray (from upper-left to O)
    `<line x1="${(ox - L * Math.sin(i)).toFixed(1)}" y1="${(oy - L * Math.cos(i)).toFixed(1)}" x2="${ox}" y2="${oy}" stroke="${C.a}" stroke-width="2.5" marker-end="url(#ah)"/>`,
    txt(ox - L * Math.sin(i) - 4, oy - L * Math.cos(i) - 4, "incident", { anchor: "end", color: C.a, bold: true }),
    // refracted ray (from O to lower-right)
    `<line x1="${ox}" y1="${oy}" x2="${(ox + L * Math.sin(r)).toFixed(1)}" y2="${(oy + L * Math.cos(r)).toFixed(1)}" stroke="${C.b}" stroke-width="2.5" marker-end="url(#ah)"/>`,
    txt(ox + L * Math.sin(r) + 4, oy + L * Math.cos(r) + 4, "refracted", { color: C.b, bold: true }),
  ];
  if (opts.showReflected) {
    parts.push(
      `<line x1="${ox}" y1="${oy}" x2="${(ox + L * Math.sin(i)).toFixed(1)}" y2="${(oy - L * Math.cos(i)).toFixed(1)}" stroke="${C.c}" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#ah)"/>`,
      txt(ox + L * Math.sin(i) + 4, oy - L * Math.cos(i) - 2, "reflected", { color: C.c, bold: true }),
    );
  }
  if (opts.caption) parts.push(txt(VB_W / 2, VB_H - 4, opts.caption, { anchor: "middle", size: 10 }));
  return svg(parts.join(""));
}

// ---- point-charge field lines ------------------------------------

/** Field lines for a single point charge, or for two charges (dipole/like). */
export function chargeField(opts: { config: "positive" | "negative" | "dipole" | "like-positive"; caption?: string }): string {
  const cy = 118;
  const parts: string[] = [];
  const charge = (x: number, sign: "+" | "−") =>
    `<circle cx="${x}" cy="${cy}" r="12" fill="${sign === "+" ? "#fecaca" : "#bfdbfe"}" stroke="${C.ink}" stroke-width="1.5"/>` +
    txt(x, cy + 5, sign, { anchor: "middle", bold: true, size: 14 });

  if (opts.config === "positive" || opts.config === "negative") {
    const cx = VB_W / 2;
    const sign = opts.config === "positive" ? "+" : "−";
    parts.push(charge(cx, sign));
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * 2 * Math.PI;
      const x1 = cx + 14 * Math.cos(ang);
      const y1 = cy + 14 * Math.sin(ang);
      const x2 = cx + 74 * Math.cos(ang);
      const y2 = cy + 74 * Math.sin(ang);
      const out = sign === "+";
      parts.push(
        `<line x1="${out ? x1 : x2}" y1="${out ? y1 : y2}" x2="${out ? x2 : x1}" y2="${out ? y2 : y1}" stroke="${C.a}" stroke-width="1.5" marker-end="url(#ah)"/>`,
      );
    }
  } else {
    const xL = VB_W / 2 - 52;
    const xR = VB_W / 2 + 52;
    const dipole = opts.config === "dipole";
    parts.push(charge(xL, "+"), charge(xR, dipole ? "−" : "+"));
    for (const dy of [-40, -18, 0, 18, 40]) {
      const midY = cy + dy;
      const bend = dipole ? 0 : Math.sign(dy || 1) * 26;
      parts.push(
        dipole
          ? `<path d="M ${xL + 12} ${cy} Q ${VB_W / 2} ${midY} ${xR - 12} ${cy}" fill="none" stroke="${C.a}" stroke-width="1.5" marker-end="url(#ah)"/>`
          : `<path d="M ${xL + 10} ${cy} Q ${VB_W / 2} ${cy + bend} ${xL + 10} ${cy}" fill="none" stroke="${C.a}" stroke-width="1.25"/>`,
      );
    }
    if (!dipole) {
      // like charges: lines pushing apart
      for (const s of [-1, 1]) {
        for (const dy of [-30, 0, 30]) {
          const x0 = VB_W / 2 + s * 14;
          parts.push(
            `<line x1="${VB_W / 2}" y1="${cy + dy}" x2="${VB_W / 2 + s * 70}" y2="${cy + dy}" stroke="${C.a}" stroke-width="1.25" marker-end="url(#ah)"/>`,
          );
        }
      }
    }
  }
  if (opts.caption) parts.push(txt(VB_W / 2, VB_H - 4, opts.caption, { anchor: "middle", size: 10 }));
  return svg(parts.join(""));
}

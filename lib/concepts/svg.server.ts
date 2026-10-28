import "server-only";

import path from "node:path";

// Illustrations are SVG written by a text model. They are checked here before they are stored
// (reject, never repair), shown only through <img> (constitution Principle VII), and rendered
// to a picture so the reviewer can look at them. The allowlist is defence in depth: <img>
// already runs no script. See specs/002-learn-from-mistakes/contracts/llm.md section 4.

export const MAX_SVG_BYTES = 40 * 1024;
const SVG_NS = "http://www.w3.org/2000/svg";

const ALLOWED_ELEMENTS = new Set([
  "svg", "g", "path", "line", "polyline", "polygon", "rect", "circle", "ellipse",
  "text", "tspan", "defs", "marker", "title", "desc",
]);

const ALLOWED_ATTRIBUTES = new Set([
  // geometry
  "d", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "points", "width", "height",
  "viewbox", "transform", "dx", "dy",
  // presentation
  "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin",
  "fill-opacity", "stroke-opacity", "opacity",
  "font-size", "font-family", "font-weight", "font-style", "text-anchor", "dominant-baseline",
  // markers (arrow heads)
  "marker-end", "marker-start", "markerwidth", "markerheight", "refx", "refy", "orient", "id",
  "xmlns",
]);

export type SvgCheck = { ok: true; svg: string } | { ok: false; reason: string };

// a tag, with quoted attribute values allowed to contain ">" or "<"
const TAG = /<(\/?)([A-Za-z][\w:.-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/g;
const ATTRIBUTE = /\s*([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/y;

const reject = (reason: string): SvgCheck => ({ ok: false, reason });

/**
 * Accept an SVG only if every element and attribute is on the allowlist and nothing in it can
 * reach outside the picture. Returns the cleaned SVG (trimmed to the `<svg>` block, comments
 * removed, the namespace added if missing) or the first reason it was rejected. Anything the
 * model wrote around the block (prose, a code fence, an XML prolog or DOCTYPE) is dropped, not
 * stored; the same constructs INSIDE the block are rejected.
 */
export function checkSvg(input: string): SvgCheck {
  const start = input.search(/<svg[\s>]/i);
  const end = input.toLowerCase().lastIndexOf("</svg>");
  if (start === -1 || end === -1 || end < start) return reject("no <svg> element");

  let svg = input.slice(start, end + "</svg>".length);
  if (Buffer.byteLength(svg, "utf8") > MAX_SVG_BYTES) return reject(`SVG is larger than ${MAX_SVG_BYTES / 1024} KB`);

  if (/<!\[CDATA\[/i.test(svg)) return reject("CDATA sections are not allowed");
  svg = svg.replace(/<!--[\s\S]*?-->/g, "");
  if (/<!DOCTYPE/i.test(svg)) return reject("a DOCTYPE is not allowed");
  if (/<!ENTITY/i.test(svg)) return reject("an ENTITY declaration is not allowed");
  if (/<\?/.test(svg)) return reject("processing instructions are not allowed");
  // an entity the picture does not define would break it; the five standard ones and numeric references are fine
  if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(svg)) return reject("unknown entity reference");

  // anything that is not a well-formed tag must not contain "<"
  if (svg.replace(TAG, "").includes("<")) return reject("malformed markup");

  let opened = 0;
  let sawViewBox = false;
  let hasNamespace = false;
  let first = true;

  for (const match of svg.matchAll(TAG)) {
    const [, closing, rawName, attrText] = match;
    const name = rawName.toLowerCase();
    if (!ALLOWED_ELEMENTS.has(name)) return reject(`element <${rawName}> is not allowed`);
    if (first && (name !== "svg" || closing)) return reject("the first element must be <svg>");
    first = false;
    if (closing) continue;
    if (name === "svg" && ++opened > 1) return reject("nested <svg> elements are not allowed");

    ATTRIBUTE.lastIndex = 0;
    let pos = 0;
    const attrs = attrText;
    while (pos < attrs.length && /\S/.test(attrs.slice(pos))) {
      ATTRIBUTE.lastIndex = pos;
      const a = ATTRIBUTE.exec(attrs);
      if (!a) return reject(`element <${rawName}> has a malformed or unquoted attribute`);
      pos = ATTRIBUTE.lastIndex;
      const attr = a[1].toLowerCase();
      const value = a[2] ?? a[3] ?? "";

      if (attr.startsWith("on")) return reject(`attribute ${a[1]} is not allowed`);
      if (!ALLOWED_ATTRIBUTES.has(attr)) return reject(`attribute ${a[1]} is not allowed`);
      if (attr === "xmlns") {
        if (name !== "svg" || value !== SVG_NS) return reject("xmlns must be the SVG namespace on <svg>");
        hasNamespace = true;
      }
      if (attr === "viewbox" && name === "svg") sawViewBox = true;
      if (/javascript:|data:|vbscript:|&#|[<>]|expression\s*\(/i.test(value)) {
        return reject(`attribute ${a[1]} has a disallowed value`);
      }
      const urls = value.match(/url\s*\(([^)]*)\)/gi);
      if (urls && !urls.every((u) => /^url\(\s*#[\w-]+\s*\)$/i.test(u))) {
        return reject(`attribute ${a[1]} may only reference an id in this picture with url(#id)`);
      }
    }
  }

  if (first) return reject("no <svg> element");
  if (!sawViewBox) return reject("the <svg> element needs a viewBox");

  if (!hasNamespace) svg = svg.replace(/^<svg/i, `<svg xmlns="${SVG_NS}"`);
  return { ok: true, svg: svg.trim() };
}

const FONT_FILE = () => path.join(process.cwd(), "assets", "fonts", "NotoSans-Regular.ttf");

/**
 * Render a checked SVG to a PNG, 800 px wide on a white background, with the bundled font (so
 * the result does not depend on fonts installed on the server). Throws if the native renderer
 * cannot load or the SVG cannot be parsed; the caller treats that as "reviewer unavailable".
 */
export async function renderPng(svg: string): Promise<Buffer> {
  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(svg, {
    background: "#ffffff",
    fitTo: { mode: "width", value: 800 },
    font: { fontFiles: [FONT_FILE()], loadSystemFonts: false, defaultFontFamily: "Noto Sans" },
  });
  return resvg.render().asPng();
}

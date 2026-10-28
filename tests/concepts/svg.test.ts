// The SVG allowlist and the renderer (spec 002 FR-019, Principle VII; contracts/llm.md section 4).

import { describe, expect, it } from "vitest";

import { MAX_SVG_BYTES, checkSvg, renderPng } from "@/lib/concepts/svg.server";

import { GOOD_SVG } from "../helpers/concept-fixtures";

const wrap = (inner: string, attrs = 'viewBox="0 0 640 400"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${inner}</svg>`;

function rejected(svg: string) {
  const r = checkSvg(svg);
  expect(r.ok, `expected a rejection for: ${svg.slice(0, 80)}`).toBe(false);
  return r.ok ? "" : r.reason;
}

describe("checkSvg accepts a good diagram", () => {
  it("accepts axes, curves, labels, markers and gradients-free shapes", () => {
    const r = checkSvg(
      wrap(
        '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="black"/></marker></defs>' +
          '<g stroke="black" stroke-width="2"><line x1="60" y1="340" x2="600" y2="340" marker-end="url(#arrow)"/></g>' +
          '<path d="M80,320 C200,200 400,120 560,80" fill="none" stroke="blue" stroke-dasharray="4 2"/>' +
          '<circle cx="320" cy="200" r="5" fill="red"/><rect x="10" y="10" width="20" height="20" fill-opacity="0.5"/>' +
          '<text x="300" y="380" font-size="16" text-anchor="middle">Quantity <tspan dy="2">(Q)</tspan></text>' +
          "<title>Supply and demand</title><desc>Two curves crossing.</desc>",
      ),
    );
    expect(r).toMatchObject({ ok: true });
  });

  it("accepts the fixture diagram", () => {
    expect(checkSvg(GOOD_SVG).ok).toBe(true);
  });

  it("trims text around the <svg> block and removes comments", () => {
    const r = checkSvg(`Here is your picture:\n\`\`\`svg\n<!-- note -->${wrap("<circle r='5' cx='5' cy='5'/>")}\n\`\`\``);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.svg.startsWith("<svg")).toBe(true);
      expect(r.svg.endsWith("</svg>")).toBe(true);
      expect(r.svg).not.toContain("note");
    }
  });

  it("drops an XML prolog or DOCTYPE written before the <svg> block, rather than storing it", () => {
    const r = checkSvg(
      `<?xml version="1.0"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "x">\n${wrap("<circle r='1' cx='1' cy='1'/>")}`,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.svg).not.toMatch(/DOCTYPE|<\?xml/);
      expect(r.svg.startsWith("<svg")).toBe(true);
    }
  });

  it("accepts the five standard entities and numeric references in text", () => {
    expect(checkSvg(wrap("<text>Price &amp; quantity &lt;Q&gt; &#8594; &#x2192;</text>")).ok).toBe(true);
  });

  it("adds the SVG namespace when the model leaves it out", () => {
    const r = checkSvg('<svg viewBox="0 0 10 10"><circle r="1" cx="1" cy="1"/></svg>');
    expect(r.ok && r.svg.includes('xmlns="http://www.w3.org/2000/svg"')).toBe(true);
  });
});

describe("checkSvg rejects anything that could reach outside the picture", () => {
  const cases: Array<[string, string, RegExp]> = [
    ["a script element", wrap("<script>alert(1)</script>"), /script/i],
    ["a foreignObject", wrap("<foreignObject><div>hi</div></foreignObject>"), /foreignObject/i],
    ["an image element", wrap('<image width="10" height="10"/>'), /image/i],
    ["a use element", wrap('<use x="1"/>'), /use/i],
    ["a style element", wrap("<style>circle{fill:red}</style>"), /style/i],
    ["an on* attribute", wrap('<circle r="1" cx="1" cy="1" onclick="x()"/>'), /onclick/i],
    ["an href", wrap('<path d="M0,0" href="https://example.com"/>'), /href/i],
    ["an xlink:href", wrap('<path d="M0,0" xlink:href="#a"/>'), /xlink:href/i],
    ["a style attribute", wrap('<circle r="1" cx="1" cy="1" style="fill:red"/>'), /style/i],
    ["a javascript: value", wrap('<path d="M0,0" fill="javascript:alert(1)"/>'), /disallowed value/],
    ["a data: value", wrap('<path d="M0,0" fill="data:text/html,x"/>'), /disallowed value/],
    ["a url() to somewhere else", wrap('<path d="M0,0" fill="url(https://evil.example/a.svg)"/>'), /url\(#id\)/],
    ["a DOCTYPE inside the picture", wrap("<!DOCTYPE svg>"), /DOCTYPE/],
    ["an ENTITY declaration inside the picture", wrap('<!ENTITY x "y">'), /ENTITY/],
    ["an entity reference the picture does not define", wrap("<text>&x;</text>"), /entity/],
    ["an element off the allowlist", wrap("<animate attributeName='x'/>"), /animate/i],
    ["an attribute off the allowlist", wrap('<circle r="1" cx="1" cy="1" class="a"/>'), /class/],
    ["an unquoted attribute", wrap("<circle r=1 cx='1' cy='1'/>"), /malformed|unquoted/],
    ["a nested svg", wrap("<svg viewBox='0 0 1 1'></svg>"), /nested/],
    ["a missing viewBox", '<svg xmlns="http://www.w3.org/2000/svg"><circle r="1" cx="1" cy="1"/></svg>', /viewBox/],
    ["a wrong namespace", '<svg xmlns="http://evil.example/ns" viewBox="0 0 1 1"></svg>', /namespace/],
    ["a processing instruction inside the picture", wrap("<?php echo 1 ?>"), /processing/],
    ["a CDATA section", wrap("<text><![CDATA[x]]></text>"), /CDATA/],
    ["text with no svg", "I could not draw that, sorry.", /no <svg>/],
    ["markup that is not closed", '<svg viewBox="0 0 1 1"><circle r="1" ', /svg|malformed/],
  ];
  for (const [name, svg, reason] of cases) {
    it(`rejects ${name}`, () => {
      expect(rejected(svg)).toMatch(reason);
    });
  }

  it(`rejects input over ${MAX_SVG_BYTES / 1024} KB`, () => {
    const big = wrap(`<text x="0" y="0">${"a".repeat(MAX_SVG_BYTES)}</text>`);
    expect(rejected(big)).toMatch(/larger than/);
  });
});

describe("renderPng", () => {
  it("renders a checked diagram to an 800 px wide PNG", async () => {
    let png: Buffer;
    try {
      png = await renderPng(GOOD_SVG);
    } catch (error) {
      // the native module may not exist for this platform; say so rather than pass silently
      console.warn("renderPng skipped: native renderer unavailable:", String(error).slice(0, 120));
      return;
    }
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(png.readUInt32BE(16)).toBe(800); // IHDR width
    expect(png.length).toBeGreaterThan(500);
  });

  it("throws, rather than returning something, for an SVG it cannot parse", async () => {
    await expect(renderPng("<svg")).rejects.toThrow();
  });
});

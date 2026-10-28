/**
 * Headers for an SVG that is only ever shown through <img>, and locked down if someone opens
 * the image URL directly. Shared by the student route and the teacher preview route (a Next.js
 * route file may not export anything but its handlers, so this lives here).
 */
export const SVG_HEADERS = {
  "content-type": "image/svg+xml; charset=utf-8",
  "x-content-type-options": "nosniff",
  // opened as a page, nothing in it can run, load or style anything else
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
} as const;

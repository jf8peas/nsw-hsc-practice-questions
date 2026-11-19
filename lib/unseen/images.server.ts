import "server-only";

import path from "node:path";

import { getUnit } from "@/content";
import type { UnseenText } from "@/lib/types";
import { UNIT_ID } from "@/lib/unseen/skills";

// The one seam between the image route and the unit's content and files (spec 008, research R3).
// Tests mock this module to inject a visual text and a temporary directory, so the route is proven
// before any real image exists.

export type VisualText = UnseenText & { body: { kind: "image"; image: string; alt: string } };

/** The unit's visual text with this id, or null (unknown id, or a text that is not an image). */
export function findVisualText(textId: string): VisualText | null {
  const text = getUnit(UNIT_ID)?.texts?.find((t) => t.id === textId);
  return text && text.body.kind === "image" ? (text as VisualText) : null;
}

/** The folder the unit's cropped images live in (committed under the unit; never a public path). */
export function imageDirectory(): string {
  return path.join(process.cwd(), "content", "units", UNIT_ID, "images");
}

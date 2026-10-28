import type { McQuestion, ShortQuestion } from "@/lib/types";
import { shuffleBySeed } from "@/lib/shuffle";

// Shared builders for this unit's question files. Ids are fixed in
// resources/topic006/05-id-map.tsv (m001–m180, s001–s180) and are never renumbered.

export const U = "y12-physics-advanced-mechanics";

export function mc(
  n: number,
  source: string,
  prompt: string,
  options: string[],
  diagram?: { svg: string; alt: string },
): McQuestion {
  const id = `${U}.m${String(n).padStart(3, "0")}`;
  return {
    id,
    group: "mc",
    type: "mc",
    source,
    prompt,
    maxMarks: 1,
    options: shuffleBySeed(id, options),
    ...(diagram ? { diagramSvg: diagram.svg, diagramAlt: diagram.alt } : {}),
  };
}

export function sa(
  n: number,
  marks: number,
  source: string,
  prompt: string,
  diagram?: { svg: string; alt: string },
): ShortQuestion {
  return {
    id: `${U}.s${String(n).padStart(3, "0")}`,
    group: "sa",
    type: "short",
    source,
    prompt,
    maxMarks: marks,
    ...(diagram ? { diagramSvg: diagram.svg, diagramAlt: diagram.alt } : {}),
  };
}

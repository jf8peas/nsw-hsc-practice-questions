import type { ReactNode } from "react";

/**
 * The first try collapsed into one closed `<details>` row (spec 006 FR-019, FR-029): "FIRST TRY ·
 * n/3" with the truncated sentence and a chevron; opening it shows the full first-try result.
 * Native <details>/<summary> is keyboard-accessible with no JavaScript; the summary is
 * min-height 44 px (FR-042).
 */
export function FirstTryCollapsed({
  marks,
  sentence,
  children,
}: {
  marks: number;
  sentence: string;
  children?: ReactNode;
}) {
  return (
    <details className="rw-collapsed">
      <summary>
        <span className="rw-collapsed-label">First try</span>
        <span className="rw-collapsed-mark">· {marks}/3</span>
        <span className="rw-collapsed-text">{sentence}</span>
        <ChevronIcon />
      </summary>
      {children}
    </details>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
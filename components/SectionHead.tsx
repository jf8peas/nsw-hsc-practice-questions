import type { ReactNode } from "react";

/**
 * The heading every section of the unit page opens with: a title, an optional one-line
 * explanation of what the section is for, and an optional item at the right (e.g. a count).
 */
export function SectionHead({
  id,
  title,
  sub,
  aside,
}: {
  id: string;
  title: string;
  sub?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div className="section-head-text">
        <h2 id={id} className="section-title">
          {title}
        </h2>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      {aside && <div className="section-aside">{aside}</div>}
    </div>
  );
}

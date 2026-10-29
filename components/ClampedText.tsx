"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * A paragraph cut to a few lines on small screens, with "Show more" to read the rest, so a long
 * unit description never pushes Start quiz far down a phone screen. On wider screens the CSS
 * shows it in full and hides the button.
 *
 * On screens where the clamp applies (≤ 600 px), the button is shown ONLY when the text is
 * actually cut off: after mount (before paint, so there is no visible jump) and again on every
 * resize or rotation (via a ResizeObserver), the paragraph is measured while clamped; if
 * `scrollHeight <= clientHeight` the text fits and the wrapper gets the `fits` class, and the CSS
 * then drops the clamp and hides the button. While the text is expanded ("Show less") the
 * measurement is skipped so the opened state never collapses itself. The full text is always in
 * the DOM.
 */
export function ClampedText({ className, children }: { className?: string; children: string }) {
  const [open, setOpen] = useState(false);
  const [fits, setFits] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const p = wrap?.querySelector("p");
    if (!wrap || !p || openRef.current) return;
    // While clamped the overflow stays in scrollHeight, so the text is cut iff the
    // full content is taller than the visible box.
    setFits(p.scrollHeight <= p.clientHeight);
  }, []);

  // Measure right after the first paint (layout effects run before paint, so a short
  // description's button disappears without a visible jump), and re-measure on any
  // resize/rotation of the wrapper (the width — and therefore the line count — changes).
  useLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(wrapRef.current as HTMLDivElement);
    return () => ro.disconnect();
  }, [measure]);

  // Collapsing back after "Show less" must re-measure.
  useLayoutEffect(() => {
    if (!open) measure();
  }, [open, measure]);

  return (
    <div ref={wrapRef} className={`clamped${open ? " open" : ""}${fits ? " fits" : ""}`}>
      <p className={className}>{children}</p>
      <button type="button" className="clamped-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";

/**
 * A paragraph cut to a few lines on small screens, with "Show more" to read the rest, so a long
 * unit description never pushes Start quiz far down a phone screen. On wider screens the CSS
 * shows it in full and hides the button.
 */
export function ClampedText({ className, children }: { className?: string; children: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`clamped${open ? " open" : ""}`}>
      <p className={className}>{children}</p>
      <button type="button" className="clamped-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A native <dialog> wrapper shared by the image zoom and the phone's text sheet (spec 008, research
// R12): showModal (so the page behind is inert), Esc closes it, a labelled Close button at least 44 px
// tall, and focus returns to whatever opened it. No animation, so nothing to switch off under
// prefers-reduced-motion.

export function Dialog({
  open,
  onClose,
  label,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.hasAttribute("open")) {
      opener.current = document.activeElement;
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", ""); // jsdom and very old browsers
    } else if (!open && dlg.hasAttribute("open")) {
      if (typeof dlg.close === "function") dlg.close();
      else dlg.removeAttribute("open");
      (opener.current as HTMLElement | null)?.focus?.();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`un-dialog ${className ?? ""}`.trim()}
      aria-label={label}
      onClose={() => {
        onClose();
        (opener.current as HTMLElement | null)?.focus?.();
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="un-dialog-head">
        <span className="un-dialog-title">{label}</span>
        <button type="button" className="un-btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="un-dialog-body">{open ? children : null}</div>
    </dialog>
  );
}

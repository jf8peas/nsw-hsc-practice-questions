// Renders a formula string. Plain text for now; swap for KaTeX in a later step
// (store LaTeX in content, render with `katex` here) without touching callers.
export function Formula({ children }: { children: string }) {
  return <span>{children}</span>;
}

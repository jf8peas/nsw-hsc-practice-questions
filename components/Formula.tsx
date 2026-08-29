import { FORMULA_HTML } from "@/content/formulas.generated";

// Renders a formula. When `tex` is set and its plain-text form has pre-rendered
// KaTeX HTML (scripts/gen-formula-html.ts), that HTML is used; otherwise it
// falls back to the plain text. KaTeX itself is never bundled into the client.
export function Formula({ children, tex }: { children: string; tex?: string }) {
  const html = tex ? FORMULA_HTML[children] : undefined;
  if (!html) return <span>{children}</span>;
  return (
    <span
      className="katex-formula"
      role="math"
      aria-label={children}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

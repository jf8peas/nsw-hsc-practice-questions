import Link from "next/link";

export function Shell({
  backHref,
  children,
}: {
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <header className="app-header">
        {backHref ? (
          <Link href={backHref} className="back-btn" aria-label="Back">
            ‹
          </Link>
        ) : null}
        <div className="logo">P</div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <span className="title">Physics Practice</span>
          <span className="subtitle">Year 11 &amp; 12</span>
        </div>
      </header>
      <main className="app-main">
        <div className="col">{children}</div>
      </main>
    </div>
  );
}

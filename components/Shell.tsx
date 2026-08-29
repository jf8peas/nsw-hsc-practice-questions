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
            <span aria-hidden="true">&#8592;</span>
          </Link>
        ) : null}
        <Link href="/" className="app-brand" aria-label="Home">
          <div className="logo">P</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span className="title">Physics Practice</span>
            <span className="subtitle">Year 11 &amp; 12</span>
          </div>
        </Link>
      </header>
      <main className="app-main">
        <div className="col">{children}</div>
      </main>
    </div>
  );
}

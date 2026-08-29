import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Physics Practice",
  description: "HSC Physics practice quizzes — short answer and multiple choice.",
};

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={FONT_LINK} />
      </head>
      <body>
        <div className="rd">{children}</div>
      </body>
    </html>
  );
}

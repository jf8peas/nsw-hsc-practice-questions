import Link from "next/link";

import { Shell } from "@/components/Shell";

export default function NotFound() {
  return (
    <Shell backHref="/">
      <h1 className="page-h1">Not found</h1>
      <p className="page-sub">That unit doesn’t exist.</p>
      <Link href="/" className="rd-btn">
        Back to units
      </Link>
    </Shell>
  );
}

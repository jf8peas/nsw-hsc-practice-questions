import Link from "next/link";

import { resolveSession, signOut } from "@/lib/auth.server";

/**
 * Who is signed in, and a sign-out button. Shown on every page that uses Shell.
 * Uses the identity from the JWT, so it still renders during a database outage.
 */
export async function UserMenu() {
  const session = await resolveSession();
  if (session.kind === "none") return null;
  const { name, email } = session.user;

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/signin" });
  }

  return (
    <div className="user-menu">
      <Link href="/progress" className="user-menu-link" aria-label="My progress">
        <span className="user-menu-link-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
            <rect x="1.5" y="9" width="3" height="5" rx="1" fill="currentColor" />
            <rect x="6.5" y="5" width="3" height="9" rx="1" fill="currentColor" />
            <rect x="11.5" y="2" width="3" height="12" rx="1" fill="currentColor" />
          </svg>
        </span>
        <span className="user-menu-link-text">My progress</span>
      </Link>
      {/* Name only in the header; the address stays available as the hover title. */}
      <span className="user-menu-id" title={email}>
        <span className="user-menu-name">{name || email}</span>
      </span>
      <form action={doSignOut}>
        <button type="submit" className="user-menu-btn">
          Sign out
        </button>
      </form>
    </div>
  );
}

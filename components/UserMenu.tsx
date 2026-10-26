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
      <Link href="/progress" className="user-menu-link">
        My progress
      </Link>
      <span className="user-menu-id" title={email}>
        <span className="user-menu-name">{name || email}</span>
        {name && email ? <span className="user-menu-email">{email}</span> : null}
      </span>
      <form action={doSignOut}>
        <button type="submit" className="user-menu-btn">
          Sign out
        </button>
      </form>
    </div>
  );
}

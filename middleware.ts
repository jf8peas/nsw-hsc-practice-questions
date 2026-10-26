import NextAuth from "next-auth";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { UNCONFIGURED_BODY, decideAccess } from "@/lib/access";
import { authConfig } from "@/lib/auth.config";
import { configProblems } from "@/lib/config";

// Reads only what auth needs (AUTH_SECRET, via Auth.js) — never OPENROUTER_API_KEY
// (constitution Principle VII). No database access at the edge.
const { auth } = NextAuth(authConfig);

const guarded = auth((req) => {
  const decision = decideAccess({
    pathname: req.nextUrl.pathname,
    search: req.nextUrl.search,
    authed: Boolean(req.auth),
  });
  switch (decision.type) {
    case "unauthenticated-api":
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    case "redirect-signin": {
      const url = new URL("/signin", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", decision.callbackUrl);
      return NextResponse.redirect(url);
    }
    default:
      return NextResponse.next();
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // Fail closed: in production, missing auth/database config refuses everything,
  // and never falls back to open access. Checked per request, not at import, so
  // `next build` works without secrets.
  if (process.env.NODE_ENV === "production") {
    const missing = configProblems(process.env);
    if (missing.length > 0) {
      console.error(`Service not configured; missing: ${missing.join(", ")}`);
      return new NextResponse(UNCONFIGURED_BODY, {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }
  }
  return (guarded as unknown as (r: NextRequest, e: NextFetchEvent) => Response | Promise<Response>)(
    req,
    event,
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)"],
};

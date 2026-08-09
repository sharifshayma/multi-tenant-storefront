import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { storefrontRewritePath } from "@/lib/custom-domains";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // Custom-domain storefront: rewrite bare paths to /{slug}/... (bookstore keeps bare URLs)
  const rewrite = storefrontRewritePath(host, pathname);
  if (rewrite) {
    return NextResponse.rewrite(new URL(rewrite, request.url));
  }

  // On the platform host, a signed-in operator hitting the root goes straight
  // to their admin — the bare landing is for logged-out visitors, so showing it
  // to a signed-in user looks like they've been logged out. (Custom-domain
  // roots were already rewritten to the storefront above, so pathname "/" here
  // is always the platform host.) This is an optimistic cookie check; the real
  // session validation still happens inside /admin.
  if (pathname === "/") {
    if (getSessionCookie(request)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Admin guard
  if (pathname.startsWith("/admin")) {
    const sessionCookie = getSessionCookie(request);
    // Already signed in? Don't show the login form again — go to the dashboard.
    if (pathname === "/admin/login") {
      return sessionCookie
        ? NextResponse.redirect(new URL("/admin", request.url))
        : NextResponse.next();
    }
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  if (pathname.startsWith("/api/admin")) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  return NextResponse.next();
}

// Runs on page + guarded API routes; excludes static assets and the public Better Auth endpoints.
// NOTE: /api/auth/* must remain public.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};

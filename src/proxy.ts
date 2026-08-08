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

  // Admin guard (unchanged)
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const sessionCookie = getSessionCookie(request);
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

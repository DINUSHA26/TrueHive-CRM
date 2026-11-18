import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Static assets, next internal files, public legal pages, and ALL API proxies
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/api") || // Let all API calls proxy directly to NestJS backend!
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Verify user authentication token for portal pages
  const token =
    req.cookies.get(AUTH_COOKIE_NAME)?.value ||
    req.cookies.get("truehive_auth_token")?.value;
  const payload = token ? await verifyJwtToken(token) : null;

  // 3. Handle /login page specifically
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    if (payload) {
      const homeUrl = req.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }

  // 4. If not authenticated, redirect portal page visits to /login
  if (!payload) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  // 5. User is authenticated -> proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Static assets & next internal files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Allow webhook & public auth endpoints
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks")
  ) {
    return NextResponse.next();
  }

  // 3. Verify user authentication token
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? await verifyJwtToken(token) : null;

  // 4. Handle /login page specifically
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    // If already authenticated, redirect to portal dashboard (/)
    if (payload) {
      const homeUrl = req.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
    // If not authenticated, allow viewing login page
    return NextResponse.next();
  }

  // 5. If not authenticated, protect all other pages and APIs
  if (!payload) {
    // If it's an API request, return 401 Unauthorized JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }
    // For all portal pages (/, /dashboard, /pos, etc.), redirect to /login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  // 6. User is authenticated -> attach role header and proceed
  const res = NextResponse.next();
  res.headers.set("x-user-role", payload.role);
  res.headers.set("x-user-id", payload.userId);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


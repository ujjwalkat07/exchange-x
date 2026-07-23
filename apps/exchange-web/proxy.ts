import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const hasToken = Boolean(accessToken || refreshToken);

  const isProtectedRoute =
    pathname.startsWith("/in/spot") || pathname.startsWith("/in/wallet");

  const isAuthRoute = pathname.startsWith("/in/auth");

  if (isProtectedRoute && !hasToken) {
    const loginUrl = new URL("/in/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasToken) {
    return NextResponse.redirect(new URL("/in/spot/btcusdt", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/in/spot/:path*", "/in/wallet/:path*", "/in/auth/:path*"],
};

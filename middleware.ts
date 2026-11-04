import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_SESI = ["authjs.session-token", "__Secure-authjs.session-token"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const punyaSesi = COOKIE_SESI.some((nama) => request.cookies.has(nama));

  if (pathname === "/login") {
    if (punyaSesi) return NextResponse.redirect(new URL("/beranda", request.url));
    return NextResponse.next();
  }

  if (pathname === "/logout") return NextResponse.next();

  if (!punyaSesi) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

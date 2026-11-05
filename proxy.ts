import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_SESI = ["authjs.session-token", "__Secure-authjs.session-token"];
const PUBLIK = ["/login", "/logout"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIK.includes(pathname)) return NextResponse.next();

  const punyaSesi = COOKIE_SESI.some((nama) => request.cookies.has(nama));
  if (!punyaSesi) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

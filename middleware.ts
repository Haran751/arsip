import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { demoUsers } from "@/lib/demo-data";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const username = request.cookies.get("demo_user")?.value;
  const user = demoUsers.find((item) => item.username === username);

  if (pathname === "/login") {
    if (user?.aktif) return NextResponse.redirect(new URL("/beranda", request.url));
    return NextResponse.next();
  }

  if (pathname === "/logout") return NextResponse.next();

  if (!user?.aktif) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (username) response.cookies.set("demo_user", "", { path: "/", maxAge: 0 });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

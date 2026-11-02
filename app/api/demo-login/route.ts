import { NextResponse } from "next/server";
import { demoUsers } from "@/lib/demo-data";

export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const user = demoUsers.find((item) => item.username === username && item.aktif);

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), { status: 303 });
  }

  const response = NextResponse.redirect(new URL("/beranda", request.url), { status: 303 });
  response.cookies.set("demo_user", user.username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

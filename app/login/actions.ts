"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoUsers } from "@/lib/demo-data";

export async function loginDemo(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const user = demoUsers.find((item) => item.username === username && item.aktif);

  if (!user) {
    redirect("/login?error=1");
  }

  const store = await cookies();
  store.set("demo_user", user.username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/beranda");
}

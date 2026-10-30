"use server";

import { redirect } from "next/navigation";

export async function gantiPasswordDemo(formData: FormData) {
  const baru = String(formData.get("baru") ?? "");
  const konfirmasi = String(formData.get("konfirmasi") ?? "");

  if (baru.length < 6 || baru !== konfirmasi) {
    redirect("/ganti-password?error=1");
  }

  redirect("/profil?password=ok");
}

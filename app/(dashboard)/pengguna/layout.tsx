import { forbidden, redirect } from "next/navigation";
import { ambilPenggunaSesi } from "@/lib/session";
import { keUserAplikasi } from "@/lib/supabase-admin";

// Manajemen pengguna hanya untuk Admin; non-Admin mendapat halaman 403.
export default async function PenggunaLayout({ children }: { children: React.ReactNode }) {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect("/login");
  if (pengguna.user_metadata?.must_change_password) redirect("/ganti-password");

  const user = keUserAplikasi(pengguna);
  if (!user || !user.aktif) redirect("/login");

  if (user.role !== "Admin") forbidden();

  return children;
}

import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import { ambilPenggunaSesi } from "@/lib/session";
import { keUserAplikasi } from "@/lib/supabase-admin";
import { sinkronPengguna } from "@/lib/user-sync";
import { ambilDataAplikasi } from "@/lib/data";
import { DataProvider } from "@/lib/data-store";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect("/login");
  if (pengguna.user_metadata?.must_change_password) redirect("/ganti-password");

  const user = keUserAplikasi(pengguna);
  if (!user) redirect("/login");

  await sinkronPengguna(user, Boolean(pengguna.user_metadata?.must_change_password)).catch(() => undefined);
  const data = await ambilDataAplikasi();

  return (
    <DataProvider initialUser={user} initialData={data}>
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}

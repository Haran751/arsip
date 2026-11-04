import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import { ambilPenggunaSesi, daftarPenggunaSesiDemo } from "@/lib/session";
import { keDemoUserAuth } from "@/lib/supabase-admin";
import { DemoProvider } from "@/lib/demo-store";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect("/login");
  if (pengguna.user_metadata?.must_change_password) redirect("/ganti-password");

  const user = keDemoUserAuth(pengguna);
  if (!user) redirect("/login");

  const users = await daftarPenggunaSesiDemo();

  return (
    <DemoProvider initialUser={user} initialUsers={users.length ? users : [user]}>
      <AppShell>{children}</AppShell>
    </DemoProvider>
  );
}

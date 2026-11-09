import { Suspense } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import Loading from "./loading";
import { ambilPenggunaSesi } from "@/lib/session";
import { keUserAplikasi } from "@/lib/supabase-admin";
import { sinkronPengguna } from "@/lib/user-sync";
import { ambilDataAplikasi } from "@/lib/data";
import { DataProvider } from "@/lib/data-store";
import type { AppUser } from "@/lib/types";

// Semua pekerjaan async ditaruh di dalam Suspense agar skeleton tampil duluan.
async function IsiDashboard({ children }: { children: React.ReactNode }) {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect("/login");
  if (pengguna.user_metadata?.must_change_password) redirect("/ganti-password");

  const user: AppUser | null = keUserAplikasi(pengguna);
  if (!user) redirect("/login");

  await sinkronPengguna(user, false).catch(() => undefined);
  const data = await ambilDataAplikasi();

  return (
    <DataProvider initialUser={user} initialData={data}>
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="content">
          <Loading />
        </div>
      }
    >
      <IsiDashboard>{children}</IsiDashboard>
    </Suspense>
  );
}

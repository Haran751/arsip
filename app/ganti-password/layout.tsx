import { redirect } from "next/navigation";
import { ambilPenggunaSesiAplikasi } from "@/lib/session";
import { sinkronPengguna } from "@/lib/user-sync";
import { ambilDataAplikasi } from "@/lib/data";
import { DataProvider } from "@/lib/data-store";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await ambilPenggunaSesiAplikasi();
  if (!user) redirect("/login");

  await sinkronPengguna(user, true).catch(() => undefined);
  const data = await ambilDataAplikasi();

  return (
    <DataProvider initialUser={user} initialData={data}>
      {children}
    </DataProvider>
  );
}

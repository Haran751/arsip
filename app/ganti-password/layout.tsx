import { redirect } from "next/navigation";
import { ambilPenggunaSesiDemo, daftarPenggunaSesiDemo } from "@/lib/session";
import { DemoProvider } from "@/lib/demo-store";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await ambilPenggunaSesiDemo();
  if (!user) redirect("/login");

  const users = await daftarPenggunaSesiDemo();

  return (
    <DemoProvider initialUser={user} initialUsers={users.length ? users : [user]}>
      {children}
    </DemoProvider>
  );
}

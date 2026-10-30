import { getDemoUser } from "@/lib/demo-session";
import { DemoProvider } from "@/lib/demo-store";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getDemoUser();
  return <DemoProvider initialUser={user}>{children}</DemoProvider>;
}

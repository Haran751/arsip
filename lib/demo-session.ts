import { cookies } from "next/headers";
import { demoUsers, type DemoUser } from "./demo-data";

export async function getDemoUser(): Promise<DemoUser> {
  const store = await cookies();
  const username = store.get("demo_user")?.value;
  return demoUsers.find((user) => user.username === username) ?? demoUsers[0];
}

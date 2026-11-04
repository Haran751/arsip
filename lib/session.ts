import { auth } from "@/auth";
import {
  ambilPenggunaAuth,
  daftarPenggunaDemo,
  keDemoUserAuth,
  type SupabaseAuthUser,
} from "@/lib/supabase-admin";
import type { DemoUser } from "@/lib/demo-data";

export async function ambilPenggunaSesi(): Promise<SupabaseAuthUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.aktif === false) return null;

    const user = await ambilPenggunaAuth(session.user.id);
    if (!user) return null;

    const demo = keDemoUserAuth(user);
    if (!demo || !demo.aktif) return null;

    return user;
  } catch {
    return null;
  }
}

export async function ambilPenggunaSesiDemo(): Promise<DemoUser | null> {
  const user = await ambilPenggunaSesi();
  return user ? keDemoUserAuth(user) : null;
}

export async function daftarPenggunaSesiDemo(): Promise<DemoUser[]> {
  try {
    return await daftarPenggunaDemo();
  } catch {
    return [];
  }
}

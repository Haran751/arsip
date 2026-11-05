import { auth } from "@/auth";
import {
  ambilPenggunaAuth,
  daftarPenggunaAplikasi,
  keUserAplikasi,
  type SupabaseAuthUser,
} from "@/lib/supabase-admin";
import type { AppUser } from "@/lib/types";

export async function ambilPenggunaSesi(): Promise<SupabaseAuthUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.aktif === false) return null;

    const user = await ambilPenggunaAuth(session.user.id);
    if (!user) return null;

    const aplikasi = keUserAplikasi(user);
    if (!aplikasi || !aplikasi.aktif) return null;

    return user;
  } catch {
    return null;
  }
}

export async function ambilPenggunaSesiAplikasi(): Promise<AppUser | null> {
  const user = await ambilPenggunaSesi();
  return user ? keUserAplikasi(user) : null;
}

export async function daftarPenggunaSesiAplikasi(): Promise<AppUser[]> {
  try {
    return await daftarPenggunaAplikasi();
  } catch {
    return [];
  }
}

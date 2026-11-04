"use server";

import { auth, unstable_update } from "@/auth";
import {
  ambilPenggunaAuth,
  daftarPenggunaAuth,
  keDemoUserAuth,
  panggilAuth,
  verifikasiPassword,
  type SupabaseAuthUser,
} from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import type { DemoUser, Role } from "@/lib/demo-data";

export type HasilAksi = { ok: boolean; message: string; user?: DemoUser };

const ROLE_VALID: Role[] = ["Admin", "Operator", "Pimpinan"];
const PASSWORD_AWAL = "EArsip#2026";

async function sesiAktif() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await ambilPenggunaAuth(session.user.id);
  if (!user) return null;

  const demo = keDemoUserAuth(user);
  if (!demo || !demo.aktif) return null;

  return {
    id: demo.id,
    role: demo.role as string,
    email: demo.email,
    nama: demo.nama,
  };
}

function normalisasiNama(user: SupabaseAuthUser) {
  const demo = keDemoUserAuth(user);
  return {
    username: demo?.username ?? "",
    role: demo?.role ?? "Operator",
    aktif: demo?.aktif ?? true,
    nama: demo?.nama ?? "",
  };
}

async function cekBentrok(username: string, email: string, id?: string) {
  const users = await daftarPenggunaAuth();
  const lain = users.filter((user) => user.id !== id);

  const emailBentrok = lain.find((user) => (user.email ?? "").toLowerCase() === email);
  if (emailBentrok) return "Email sudah digunakan akun lain.";

  const usernameBentrok = lain.find(
    (user) => String(user.user_metadata?.username ?? "").toLowerCase() === username,
  );
  if (usernameBentrok) return "Username sudah digunakan.";

  return null;
}

export async function simpanPengguna(
  input: { nama: string; username: string; email: string; role: string; aktif: boolean },
  id?: string,
): Promise<HasilAksi> {
  const aktor = await sesiAktif();
  if (!aktor || aktor.role !== "Admin") {
    return { ok: false, message: "Hanya Admin yang dapat mengelola pengguna." };
  }

  const nama = input.nama.trim();
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();

  if (!nama || !username || !email) return { ok: false, message: "Nama, username, dan email wajib diisi." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Format email tidak valid." };
  if (!/^[a-z0-9._-]+$/.test(username)) {
    return { ok: false, message: "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip." };
  }
  if (!ROLE_VALID.includes(input.role as Role)) return { ok: false, message: "Peran tidak valid." };

  try {
    const bentrok = await cekBentrok(username, email, id);
    if (bentrok) return { ok: false, message: bentrok };

    if (id) {
      const existing = await ambilPenggunaAuth(id);
      if (!existing) return { ok: false, message: "Pengguna tidak ditemukan." };

      const lama = normalisasiNama(existing);
      if (lama.role === "Admin" && lama.aktif && (input.role !== "Admin" || !input.aktif)) {
        const users = await daftarPenggunaAuth();
        const adminAktif = users.filter((user) => {
          const data = normalisasiNama(user);
          return data.role === "Admin" && data.aktif;
        });
        if (adminAktif.length <= 1) return { ok: false, message: "Minimal harus ada satu Admin aktif." };
      }

      const user = await panggilAuth<SupabaseAuthUser>(`/auth/v1/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          email,
          email_confirm: true,
          ban_duration: input.aktif ? "none" : "876000h",
          user_metadata: {
            ...(existing.user_metadata ?? {}),
            nama,
            username,
            role: input.role,
            aktif: input.aktif,
          },
        }),
      });

      const demo = keDemoUserAuth(user);
      if (!demo) return { ok: false, message: "Gagal membaca data pengguna." };
      revalidatePath("/pengguna");
      revalidatePath("/beranda");
      return { ok: true, message: "Pengguna berhasil diperbarui.", user: demo };
    }

    const user = await panggilAuth<SupabaseAuthUser>("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password: PASSWORD_AWAL,
        email_confirm: true,
        user_metadata: {
          nama,
          username,
          role: input.role,
          aktif: input.aktif,
          must_change_password: true,
        },
      }),
    });

    if (!input.aktif) {
      await panggilAuth<SupabaseAuthUser>(`/auth/v1/admin/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ ban_duration: "876000h" }),
      });
    }

    const demo = keDemoUserAuth(user);
    if (!demo) return { ok: false, message: "Gagal membaca data pengguna." };
    revalidatePath("/pengguna");
    revalidatePath("/beranda");
    return {
      ok: true,
      message: `Pengguna ditambahkan. Password awal: ${PASSWORD_AWAL} (wajib diganti saat login pertama).`,
      user: { ...demo, aktif: input.aktif },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Gagal menyimpan pengguna." };
  }
}

export async function resetPasswordPengguna(id: string): Promise<HasilAksi> {
  const aktor = await sesiAktif();
  if (!aktor || aktor.role !== "Admin") {
    return { ok: false, message: "Hanya Admin yang dapat mereset password." };
  }

  try {
    const target = await ambilPenggunaAuth(id);
    if (!target) return { ok: false, message: "Pengguna tidak ditemukan." };

    const user = await panggilAuth<SupabaseAuthUser>(`/auth/v1/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        password: PASSWORD_AWAL,
        user_metadata: { ...(target.user_metadata ?? {}), must_change_password: true },
      }),
    });

    const demo = keDemoUserAuth(user);
    if (!demo) return { ok: false, message: "Gagal membaca data pengguna." };
    revalidatePath("/pengguna");
    return {
      ok: true,
      message: `Password ${demo.nama} direset ke: ${PASSWORD_AWAL} (wajib diganti saat login).`,
      user: demo,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Gagal mereset password." };
  }
}

export async function simpanProfil(input: { nama: string; email: string }): Promise<HasilAksi> {
  const aktor = await sesiAktif();
  if (!aktor) return { ok: false, message: "Sesi tidak valid. Silakan login ulang." };

  const nama = input.nama.trim();
  const email = input.email.trim().toLowerCase();
  if (!nama || !email) return { ok: false, message: "Nama dan email wajib diisi." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Format email tidak valid." };

  try {
    const bentrok = await daftarPenggunaAuth().then((users) =>
      users.find((user) => user.id !== aktor.id && (user.email ?? "").toLowerCase() === email),
    );
    if (bentrok) return { ok: false, message: "Email sudah digunakan akun lain." };

    const existing = await ambilPenggunaAuth(aktor.id);
    if (!existing) return { ok: false, message: "Pengguna tidak ditemukan." };

    const user = await panggilAuth<SupabaseAuthUser>(`/auth/v1/admin/users/${aktor.id}`, {
      method: "PUT",
      body: JSON.stringify({
        email,
        email_confirm: true,
        user_metadata: { ...(existing.user_metadata ?? {}), nama },
      }),
    });

    const demo = keDemoUserAuth(user);
    if (!demo) return { ok: false, message: "Gagal membaca data pengguna." };

    await unstable_update({ user: { name: nama } }).catch(() => undefined);
    revalidatePath("/profil");
    return { ok: true, message: "Profil berhasil diperbarui.", user: demo };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Gagal memperbarui profil." };
  }
}

export async function gantiPasswordSendiri(lama: string, baru: string): Promise<HasilAksi> {
  const aktor = await sesiAktif();
  if (!aktor) return { ok: false, message: "Sesi tidak valid. Silakan login ulang." };

  if (!lama) return { ok: false, message: "Password lama wajib diisi." };
  if (baru.length < 6) return { ok: false, message: "Password baru minimal 6 karakter." };
  if (baru === lama) return { ok: false, message: "Password baru harus berbeda dari password lama." };

  try {
    const existing = await ambilPenggunaAuth(aktor.id);
    if (!existing?.email) return { ok: false, message: "Pengguna tidak ditemukan." };

    const cocok = await verifikasiPassword(existing.email, lama);
    if (!cocok) return { ok: false, message: "Password lama tidak sesuai." };

    await panggilAuth<SupabaseAuthUser>(`/auth/v1/admin/users/${aktor.id}`, {
      method: "PUT",
      body: JSON.stringify({
        password: baru,
        user_metadata: { ...(existing.user_metadata ?? {}), must_change_password: false },
      }),
    });

    await unstable_update({ user: { must_change_password: false } }).catch(() => undefined);
    revalidatePath("/profil");
    return { ok: true, message: "Password berhasil diganti." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Gagal mengganti password." };
  }
}

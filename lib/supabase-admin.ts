import type { DemoUser, Role } from "@/lib/demo-data";

const BASE = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
const DOMAIN_AKUN = "earsip.local";

export const ID_ADMIN_LOKAL = "lokal-admin";
const USERNAME_ADMIN_LOKAL = "admin";
const PASSWORD_ADMIN_LOKAL = process.env.ADMIN_LOKAL_PASSWORD ?? "admin123";

// Cek apakah Supabase sudah diisi nilai asli (bukan placeholder di .env).
export function supabaseTerkonfigurasi() {
  const placeholder = (nilai: string) =>
    !nilai || /xxx|your|ganti|isi|contoh/i.test(nilai);
  return !placeholder(BASE) && !placeholder(KEY);
}

// Fallback login lokal, hanya untuk development saat Supabase belum siap.
export function authLokalAktif() {
  return process.env.NODE_ENV !== "production" && !supabaseTerkonfigurasi();
}

export function penggunaLokalAdmin(): SupabaseAuthUser {
  return {
    id: ID_ADMIN_LOKAL,
    email: `${USERNAME_ADMIN_LOKAL}@${DOMAIN_AKUN}`,
    last_sign_in_at: new Date().toISOString(),
    banned_until: null,
    user_metadata: {
      nama: "Administrator Lokal",
      username: USERNAME_ADMIN_LOKAL,
      role: "Admin",
      aktif: true,
      must_change_password: false,
    },
    app_metadata: {},
  };
}

export function autentikasiLokal(username: string, password: string) {
  if (!authLokalAktif()) return null;
  const target = username.trim().toLowerCase();
  const cocokUser =
    target === USERNAME_ADMIN_LOKAL || target === `${USERNAME_ADMIN_LOKAL}@${DOMAIN_AKUN}`;
  return cocokUser && password === PASSWORD_ADMIN_LOKAL ? penggunaLokalAdmin() : null;
}

export type SupabaseAuthUser = {
  id: string;
  email: string | null;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
};

type DaftarPenggunaResponse = {
  users?: SupabaseAuthUser[];
};

function headerAdmin() {
  if (!supabaseTerkonfigurasi()) {
    throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diisi di .env");
  }
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
  };
}

export async function panggilAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headerAdmin(), ...(init?.headers ?? {}) },
    cache: "no-store",
  });

  const teks = await res.text();
  const data = teks ? JSON.parse(teks) : {};

  if (!res.ok) {
    const pesan = data?.msg ?? data?.error_description ?? data?.message ?? `Permintaan gagal (${res.status})`;
    throw new Error(pesan);
  }
  return data as T;
}

export function emailUntukUsername(username: string) {
  const bersih = username.trim().toLowerCase();
  if (bersih.includes("@")) return bersih;
  return `${bersih}@${DOMAIN_AKUN}`;
}

export async function ambilPenggunaAuth(id: string) {
  if (!supabaseTerkonfigurasi()) {
    const lokal = penggunaLokalAdmin();
    return id === lokal.id ? lokal : null;
  }

  try {
    return await panggilAuth<SupabaseAuthUser>(`/auth/v1/admin/users/${id}`);
  } catch {
    return null;
  }
}

export async function daftarPenggunaAuth(): Promise<SupabaseAuthUser[]> {
  if (!supabaseTerkonfigurasi()) {
    return [penggunaLokalAdmin()];
  }

  const hasil: SupabaseAuthUser[] = [];

  for (let halaman = 1; halaman <= 10; halaman += 1) {
    const data = await panggilAuth<DaftarPenggunaResponse>(
      `/auth/v1/admin/users?page=${halaman}&per_page=200`,
    );
    const users = data.users ?? [];
    hasil.push(...users);
    if (users.length < 200) break;
  }

  return hasil;
}

export async function cariPenggunaAuthByUsername(username: string) {
  const target = username.trim().toLowerCase();
  if (!target) return null;
  const users = await daftarPenggunaAuth();
  return (
    users.find((user) => String(user.user_metadata?.username ?? "").toLowerCase() === target) ?? null
  );
}

export async function verifikasiPassword(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: headerAdmin(),
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  return res.ok;
}

export function keDemoUserAuth(user: SupabaseAuthUser): DemoUser | null {
  const email = user.email ?? "";
  const meta = user.user_metadata ?? {};
  const username = String(meta.username ?? (email ? email.split("@")[0] : "")).trim();

  if (!username) return null;

  const role = String(meta.role ?? "Operator");
  const roleValid: Role = role === "Admin" || role === "Pimpinan" ? role : "Operator";
  const banned = user.banned_until ? new Date(user.banned_until).getTime() > Date.now() : false;

  return {
    id: user.id,
    nama: String(meta.nama ?? username),
    username,
    email,
    role: roleValid,
    aktif: meta.aktif === false ? false : !banned,
    last_login: user.last_sign_in_at ?? "",
  };
}

export async function daftarPenggunaDemo(): Promise<DemoUser[]> {
  const users = await daftarPenggunaAuth();
  return users.map(keDemoUserAuth).filter((user): user is DemoUser => Boolean(user));
}

import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^\s*[A-Za-z_][A-Za-z0-9_]*\s*=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"(.*)"$/, "$1")];
    }),
);

let base;
try {
  base = new URL(env.SUPABASE_URL).origin;
} catch {
  console.error("SUPABASE_URL tidak valid. Jalankan: npm run env:supabase");
  process.exit(1);
}

const key = env.SUPABASE_SECRET_KEY;
if (!key || /ganti|xxx|your|contoh/i.test(key)) {
  console.error("SUPABASE_SECRET_KEY belum diisi. Jalankan: npm run env:supabase");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const akun = [
  { nama: "Administrator", username: "admin", email: "admin@earsip.local", role: "Admin", password: "admin123" },
  { nama: "Operator Arsip", username: "operator", email: "operator@earsip.local", role: "Operator", password: "operator123" },
  { nama: "Pimpinan", username: "pimpinan", email: "pimpinan@earsip.local", role: "Pimpinan", password: "pimpinan123" },
];

const daftar = await (await fetch(`${base}/auth/v1/admin/users?per_page=200`, { headers })).json();
const existing = daftar.users ?? [];

for (const item of akun) {
  const lama = existing.find((u) => u.email?.toLowerCase() === item.email);
  const body = {
    email: item.email,
    password: item.password,
    email_confirm: true,
    ban_duration: "none",
    user_metadata: { nama: item.nama, username: item.username, role: item.role, aktif: true },
  };
  const res = lama
    ? await fetch(`${base}/auth/v1/admin/users/${lama.id}`, { method: "PUT", headers, body: JSON.stringify(body) })
    : await fetch(`${base}/auth/v1/admin/users`, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json();
  console.log(`${item.username}: ${res.status} ${data.id ?? data.message ?? ""}`);

  const login = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: item.email, password: item.password }),
  });
  const sesi = await login.json();
  console.log(`  login: ${login.status} ${sesi.access_token ? "OK" : sesi.error_description ?? sesi.msg ?? ""}`);
}

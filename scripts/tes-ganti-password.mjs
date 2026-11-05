import { readFileSync } from "node:fs";

const base = process.env.TES_BASE ?? "http://localhost:3000";
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^\s*[A-Za-z_][A-Za-z0-9_]*\s*=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"(.*)"$/, "$1")];
    }),
);

const supabase = new URL(env.SUPABASE_URL).origin;
const headers = {
  apikey: env.SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
  "Content-Type": "application/json",
};

const email = "ujicoba@earsip.local";
const password = "EArsip#2026";

const lama = await (await fetch(`${supabase}/auth/v1/admin/users?per_page=200`, { headers })).json();
const sudah = lama.users?.find((u) => u.email === email);
if (sudah) await fetch(`${supabase}/auth/v1/admin/users/${sudah.id}`, { method: "DELETE", headers });

const buat = await fetch(`${supabase}/auth/v1/admin/users`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama: "Uji Coba", username: "ujicoba", role: "Operator", aktif: true, must_change_password: true },
  }),
});
const user = await buat.json();
console.log("buat user uji:", buat.status, user.id);

async function login(username, sandi) {
  const jar = new Map();
  const simpan = (res) => {
    for (const cookie of res.headers.getSetCookie?.() ?? []) {
      const [pair] = cookie.split(";");
      const index = pair.indexOf("=");
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (value) jar.set(name, value);
      else jar.delete(name);
    }
  };
  const header = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  simpan(csrfRes);
  const { csrfToken } = await csrfRes.json();

  const masuk = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: header() },
    body: new URLSearchParams({ csrfToken, username, password: sandi, callbackUrl: `${base}/beranda` }),
    redirect: "manual",
  });
  simpan(masuk);

  const sesi = await fetch(`${base}/api/auth/session`, { headers: { Cookie: header() } }).then((r) => r.json());
  const beranda = await fetch(`${base}/beranda`, { headers: { Cookie: header() }, redirect: "manual" });

  return { sesi, beranda: { status: beranda.status, lokasi: beranda.headers.get("location") } };
}

const hasil = await login("ujicoba", password);
console.log("sesi wajib ganti password:", JSON.stringify(hasil.sesi?.user));
console.log("akses /beranda:", JSON.stringify(hasil.beranda));

await fetch(`${supabase}/auth/v1/admin/users/${user.id}`, { method: "DELETE", headers });
console.log("user uji dihapus");

const base = process.env.TES_BASE ?? "http://localhost:3000";

const jar = new Map();

function simpanCookie(res) {
  for (const cookie of res.headers.getSetCookie?.() ?? []) {
    const [pair] = cookie.split(";");
    const index = pair.indexOf("=");
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (value) jar.set(name, value);
    else jar.delete(name);
  }
}

function headerCookie() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

const csrfRes = await fetch(`${base}/api/auth/csrf`);
simpanCookie(csrfRes);
const { csrfToken } = await csrfRes.json();

const masuk = await fetch(`${base}/api/auth/callback/credentials`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: headerCookie() },
  body: new URLSearchParams({ csrfToken, username: "admin", password: "admin123", callbackUrl: `${base}/beranda` }),
  redirect: "manual",
});
simpanCookie(masuk);
console.log("login:", masuk.status);

const halaman = ["/beranda", "/arsip", "/kode-arsip", "/pemusnahan", "/pengguna", "/log", "/profil", "/pengaturan", "/ganti-password"];

for (const path of halaman) {
  const res = await fetch(`${base}${path}`, { headers: { Cookie: headerCookie() }, redirect: "manual" });
  const html = res.status === 200 ? await res.text() : "";
  const adaDemo = /mode demo/i.test(html);
  console.log(`${path}: ${res.status} ${res.status === 200 ? "OK" : ""}${adaDemo ? " (masih ada teks 'mode demo')" : ""}`);
}

const loginLagi = await fetch(`${base}/login`, { headers: { Cookie: headerCookie() }, redirect: "manual" });
console.log("/login saat sudah masuk:", loginLagi.status, loginLagi.headers.get("location"));

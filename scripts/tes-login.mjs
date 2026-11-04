const base = process.env.TES_BASE ?? "http://localhost:3000";

async function tungguServer() {
  for (let i = 0; i < 90; i += 1) {
    try {
      const res = await fetch(`${base}/login`);
      if (res.ok) return;
    } catch {
      // server belum siap
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Server tidak merespons");
}

function simpanCookie(jar, res) {
  for (const cookie of res.headers.getSetCookie?.() ?? []) {
    const [pair] = cookie.split(";");
    const index = pair.indexOf("=");
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (value) jar.set(name, value);
    else jar.delete(name);
  }
}

function headerCookie(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function login(username, password) {
  const jar = new Map();

  const csrfRes = await fetch(`${base}/api/auth/csrf`, { redirect: "manual" });
  simpanCookie(jar, csrfRes);
  const { csrfToken } = await csrfRes.json();

  const body = new URLSearchParams({
    csrfToken,
    username,
    password,
    callbackUrl: `${base}/beranda`,
  });

  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: headerCookie(jar),
    },
    body,
    redirect: "manual",
  });
  simpanCookie(jar, res);

  const sesi = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: headerCookie(jar) },
  }).then((r) => r.json());

  const beranda = await fetch(`${base}/beranda`, {
    headers: { Cookie: headerCookie(jar) },
    redirect: "manual",
  });
  const html = beranda.status === 200 ? await beranda.text() : "";

  return {
    statusLogin: res.status,
    lokasi: res.headers.get("location"),
    sesi,
    statusBeranda: beranda.status,
    berandaMasuk: html.includes("Keluar") || html.includes("Halo,"),
  };
}

await tungguServer();

const benar = await login("admin", "admin123");
console.log("LOGIN admin/admin123:");
console.log(JSON.stringify(benar, null, 2));

const salah = await login("admin", "password-salah");
console.log("LOGIN password salah:");
console.log(JSON.stringify({ statusLogin: salah.statusLogin, sesi: salah.sesi, statusBeranda: salah.statusBeranda }, null, 2));

const operator = await login("operator", "operator123");
console.log("LOGIN operator/operator123:");
console.log(JSON.stringify({ sesi: operator.sesi, statusBeranda: operator.statusBeranda, berandaMasuk: operator.berandaMasuk }, null, 2));

const pimpinan = await login("pimpinan", "pimpinan123");
console.log("LOGIN pimpinan/pimpinan123:");
console.log(JSON.stringify({ sesi: pimpinan.sesi, statusBeranda: pimpinan.statusBeranda, berandaMasuk: pimpinan.berandaMasuk }, null, 2));

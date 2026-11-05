import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const rl = createInterface({ input: process.stdin, output: process.stdout });

const bersih = (nilai) => nilai.trim().replace(/^["']|["']$/g, "");

const masukan = bersih(await rl.question("SUPABASE_URL (contoh https://abcdefgh.supabase.co): "));
const key = bersih(await rl.question("SUPABASE_SECRET_KEY (service_role atau sb_secret_...): "));

rl.close();

let url;
try {
  url = new URL(masukan).origin;
} catch {
  console.error("SUPABASE_URL tidak valid. Harus berbentuk https://<project-ref>.supabase.co");
  process.exit(1);
}

if (!/^[a-z0-9-]+\.supabase\.co$/i.test(new URL(url).hostname) || /xxx/i.test(url)) {
  console.error("SUPABASE_URL tidak valid. Harus berbentuk https://<project-ref>.supabase.co");
  process.exit(1);
}

if (key.length < 20 || /ganti|xxx|your|contoh|isi/i.test(key)) {
  console.error("SUPABASE_SECRET_KEY tidak valid. Pastikan memakai service_role / Secret key, bukan anon.");
  process.exit(1);
}

if (key.startsWith("sb_publishable_")) {
  console.error("Itu publishable key. Ambil Secret key (service_role / sb_secret_...).");
  process.exit(1);
}

const path = ".env";
const isi = existsSync(path) ? readFileSync(path, "utf8") : "";
const baris = isi.split(/\r?\n/);

function setel(nama, nilai) {
  const baru = `${nama}="${nilai}"`;
  const index = baris.findIndex((l) => new RegExp(`^\\s*${nama}\\s*=`).test(l));
  if (index >= 0) baris[index] = baru;
  else baris.push(baru);
}

setel("SUPABASE_URL", url);
setel("SUPABASE_SECRET_KEY", key);

writeFileSync(path, baris.join("\r\n"), "utf8");

console.log("Berhasil. .env sudah diperbarui.");
console.log("Langkah berikutnya: npm run akun:supabase");

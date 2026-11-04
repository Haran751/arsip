// Ekstrak Kode Klasifikasi Arsip dari teks PDF KMK 539 (halaman 13-120)
// menjadi CSV sesuai template impor halaman Master Kode Arsip.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(root, "Instrumen Pengelolaan Arsip Dinamis di Lingkungan Kemenkes (KMK 539) halaman 13-120.txt");
const OUT = resolve(root, "data", "kode-arsip-kmk539.csv");

const TOP = /^([A-Z]{2})\.\s+(.+)$/;
const L2 = /^(\d{2})\.\s+(\S.*)$/;
const L3 = /^(\d{2})\.\s*(\d{2})\.\s+(\S.*)$/;
const PAGE_NO = /^-\s*\d+\s*-$/;
const URL = /jdih\.kemkes\.go\.id/i;

function bersihkan(teks) {
  return teks
    .replace(/\u000c/g, " ")
    .replace(/\uFFFD+\??/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

const baris = readFileSync(SRC, "utf8").split(/\r?\n/).map((l) => l.replace(/\s+$/, ""));

const entri = [];
const dipakai = new Set();
let top = null;
let nama = null;
let kodeAktif = null;

function tutup() {
  if (!kodeAktif) return;
  if (dipakai.has(kodeAktif)) {
    console.warn(`Duplikat dilewati: ${kodeAktif}`);
  } else {
    dipakai.add(kodeAktif);
    entri.push({ kode: kodeAktif, nama: bersihkan(nama) });
  }
  nama = null;
  kodeAktif = null;
}

for (const asli of baris) {
  const t = asli.trim();
  if (!t || PAGE_NO.test(t) || URL.test(t)) {
    tutup();
    continue;
  }

  // Deskripsi selalu diawali "Naskah..."; semua baris setelahnya diabaikan.
  if (/^naskah/i.test(t)) {
    tutup();
    continue;
  }

  const l3 = t.match(L3);
  const l2 = t.match(L2);
  const l1 = t.match(TOP);

  if (l1 && !l2) {
    tutup();
    top = l1[1];
    kodeAktif = top;
    nama = l1[2];
    continue;
  }
  if (l3) {
    tutup();
    kodeAktif = `${top}-${l3[1]}-${l3[2]}`;
    nama = l3[3];
    continue;
  }
  if (l2) {
    tutup();
    kodeAktif = `${top}-${l2[1]}`;
    nama = l2[2];
    continue;
  }

  // Lanjutan nama (baris wrap) hanya bila sedang mengumpulkan nama.
  if (kodeAktif) nama += ` ${t}`;
}
tutup();

// Validasi induk: setiap kode level 3 harus punya level 2, level 2 harus punya level 1.
const set = new Set(entri.map((e) => e.kode));
const tanpaInduk = entri.filter((e) => {
  const bagian = e.kode.split("-");
  return bagian.length > 1 && !set.has(bagian.slice(0, -1).join("-"));
});

function escape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const rows = entri.map((e) => [e.kode, e.nama, 0, 0, "Dinilai_Kembali"]);
const csv = ["kode,nama,retensi_aktif_thn,retensi_inaktif_thn,nasib_akhir", ...rows.map((r) => r.map(escape).join(","))]
  .join("\r\n");

mkdirSync(resolve(root, "data"), { recursive: true });
writeFileSync(OUT, `\uFEFF${csv}\r\n`, "utf8");

console.log(`Sumber        : ${SRC}`);
console.log(`Total entri   : ${entri.length}`);
console.log(`Level 1       : ${entri.filter((e) => !e.kode.includes("-")).length}`);
console.log(`Level 2       : ${entri.filter((e) => e.kode.split("-").length === 2).length}`);
console.log(`Level 3       : ${entri.filter((e) => e.kode.split("-").length === 3).length}`);
console.log(`Tanpa induk   : ${tanpaInduk.length}`);
if (tanpaInduk.length) console.log(tanpaInduk.slice(0, 10).map((e) => `  ${e.kode} ${e.nama}`).join("\n"));
console.log(`Output        : ${OUT}`);

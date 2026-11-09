import type { Instansi } from "@/lib/types";
import {
  LABEL_JENIS,
  type JenisEkspor,
  type KolomEkspor,
  type SumberEkspor,
  type TabelEkspor,
} from "./types";

const pad = (nilai: number) => String(nilai).padStart(2, "0");

function tanggalRingkas(value: Date) {
  return `${pad(value.getUTCDate())}-${pad(value.getUTCMonth() + 1)}-${value.getUTCFullYear()}`;
}

function tahun(value: Date) {
  return value.getUTCFullYear();
}

function teks(value: string | null | undefined) {
  return (value ?? "").trim();
}

function gabungUnik(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.map(teks).filter(Boolean))).join("; ");
}

function kurunWaktu(items: SumberEkspor[]) {
  const manual = items.map((item) => teks(item.kurun_waktu)).find(Boolean);
  if (manual) return manual;
  const daftar = items.map((item) => tahun(item.tanggal_arsip));
  if (!daftar.length) return "";
  const awal = Math.min(...daftar);
  const akhir = Math.max(...daftar);
  return awal === akhir ? String(awal) : `${awal}-${akhir}`;
}

function pertama(items: SumberEkspor[], ambil: (item: SumberEkspor) => string | null | undefined) {
  return items.map((item) => teks(ambil(item))).find(Boolean) ?? "";
}

function kunciBerkas(item: SumberEkspor) {
  return teks(item.nomor_berkas) || `__${item.id}`;
}

const KOLOM_ISI: KolomEkspor[] = [
  { label: "Nomor Berkas", lebar: 48 },
  { label: "Kode Klasifikasi", lebar: 52, align: "center" },
  { label: "Indeks Berkas", lebar: 95 },
  { label: "Jumlah Folder", lebar: 34, align: "center" },
  { label: "No. Item Arsip", lebar: 34, align: "center" },
  { label: "Uraian Informasi Arsip", lebar: 130 },
  { label: "Tanggal", lebar: 46, align: "center" },
  { label: "Tingkat Perkembangan", lebar: 56 },
  { label: "Jumlah Hal Surat", lebar: 38, align: "center" },
  { label: "Sifat Arsip", lebar: 48, align: "center" },
  { label: "No. Filling Cabinet", grup: "Lokasi", lebar: 38, align: "center" },
  { label: "No. Laci", grup: "Lokasi", lebar: 30, align: "center" },
  { label: "No. Folder", grup: "Lokasi", lebar: 34, align: "center" },
  { label: "Keterangan", lebar: 65 },
];

const KOLOM_BERKAS: KolomEkspor[] = [
  { label: "Nomor Berkas", lebar: 65 },
  { label: "Kode Klasifikasi", lebar: 70, align: "center" },
  { label: "Uraian Informasi Berkas (Indeks)", lebar: 170 },
  { label: "Kurun Waktu", lebar: 75, align: "center" },
  { label: "Jumlah Item Arsip", lebar: 45, align: "center" },
  { label: "Tingkat Perkembangan", lebar: 65 },
  { label: "Sifat Arsip", lebar: 60, align: "center" },
  { label: "No. Filling Cabinet", grup: "Lokasi", lebar: 45, align: "center" },
  { label: "No. Laci", grup: "Lokasi", lebar: 40, align: "center" },
  { label: "No. Folder", grup: "Lokasi", lebar: 45, align: "center" },
  { label: "Keterangan", lebar: 100 },
];

const KOLOM_PINDAH: KolomEkspor[] = [
  { label: "No", lebar: 30, align: "center" },
  { label: "Kode Klasifikasi", lebar: 75, align: "center" },
  { label: "Jenis/seri Arsip", lebar: 155 },
  { label: "Kurun waktu", lebar: 60, align: "center" },
  { label: "Tingkat perkembangan", lebar: 65 },
  { label: "Jumlah", lebar: 40, align: "center" },
  { label: "Ket. Nomor Boks", lebar: 120 },
];

function barisIsi(arsip: SumberEkspor[]): (string | number)[][] {
  return arsip.map((item) => [
    teks(item.nomor_berkas) || item.nomor_arsip,
    item.kode,
    teks(item.indeks) || item.judul,
    item.jumlah_folder ?? "",
    teks(item.nomor_item),
    item.judul,
    tanggalRingkas(item.tanggal_arsip),
    teks(item.tingkat_perkembangan),
    item.jumlah_halaman ?? "",
    teks(item.sifat_arsip),
    teks(item.lokasi_cabinet),
    teks(item.lokasi_laci),
    teks(item.lokasi_folder),
    teks(item.keterangan),
  ]);
}

type GrupBerkas = {
  kunci: string;
  items: SumberEkspor[];
};

function kelompokkan(arsip: SumberEkspor[]): GrupBerkas[] {
  const peta = new Map<string, GrupBerkas>();
  for (const item of arsip) {
    const kunci = kunciBerkas(item);
    const ada = peta.get(kunci);
    if (ada) ada.items.push(item);
    else peta.set(kunci, { kunci, items: [item] });
  }
  return Array.from(peta.values());
}

function barisBerkas(arsip: SumberEkspor[], jumlahItem: Map<string, number>): (string | number)[][] {
  return kelompokkan(arsip).map((grup) => {
    const pertamaItem = grup.items[0];
    const nomor = grup.kunci.startsWith("__") ? pertamaItem.nomor_arsip : grup.kunci;
    const jumlah =
      jumlahItem.get(teks(pertamaItem.nomor_berkas)) ??
      jumlahItem.get(grup.kunci) ??
      grup.items.length;
    return [
      nomor,
      gabungUnik(grup.items.map((item) => item.kode)),
      gabungUnik(grup.items.map((item) => teks(item.indeks) || item.judul)),
      kurunWaktu(grup.items),
      jumlah,
      gabungUnik(grup.items.map((item) => item.tingkat_perkembangan)),
      gabungUnik(grup.items.map((item) => item.sifat_arsip)),
      pertama(grup.items, (item) => item.lokasi_cabinet),
      pertama(grup.items, (item) => item.lokasi_laci),
      pertama(grup.items, (item) => item.lokasi_folder),
      gabungUnik(grup.items.map((item) => item.keterangan)),
    ];
  });
}

function barisPindah(arsip: SumberEkspor[], jumlahItem: Map<string, number>): (string | number)[][] {
  return kelompokkan(arsip).map((grup, index) => {
    const pertamaItem = grup.items[0];
    const jumlah =
      jumlahItem.get(teks(pertamaItem.nomor_berkas)) ??
      jumlahItem.get(grup.kunci) ??
      grup.items.length;
    return [
      index + 1,
      gabungUnik(grup.items.map((item) => item.kode)),
      gabungUnik(grup.items.map((item) => item.judul)),
      kurunWaktu(grup.items),
      gabungUnik(grup.items.map((item) => item.tingkat_perkembangan)),
      jumlah,
      gabungUnik(grup.items.map((item) => item.nomor_boks)),
    ];
  });
}

export function buatTabel(
  jenis: JenisEkspor,
  arsip: SumberEkspor[],
  instansi: Instansi,
  opsi?: {
    logo?: { data: Buffer; type: "png" | "jpeg" } | null;
    jumlahItem?: Map<string, number>;
  },
): TabelEkspor {
  const jumlahItem = opsi?.jumlahItem ?? new Map<string, number>();

  if (jenis === "isi-berkas-aktif") {
    return {
      jenis,
      judul: LABEL_JENIS[jenis],
      orientasi: "landscape",
      kop: true,
      tandaTangan: true,
      kolom: KOLOM_ISI,
      baris: barisIsi(arsip),
      instansi,
      logo: opsi?.logo ?? null,
    };
  }

  if (jenis === "daftar-berkas") {
    return {
      jenis,
      judul: LABEL_JENIS[jenis],
      orientasi: "landscape",
      kop: true,
      tandaTangan: true,
      kolom: KOLOM_BERKAS,
      baris: barisBerkas(arsip, jumlahItem),
      instansi,
      logo: opsi?.logo ?? null,
    };
  }

  return {
    jenis,
    judul: LABEL_JENIS[jenis].toUpperCase(),
    orientasi: "portrait",
    kop: false,
    tandaTangan: false,
    kolom: KOLOM_PINDAH,
    baris: barisPindah(arsip, jumlahItem),
    instansi,
    logo: opsi?.logo ?? null,
  };
}

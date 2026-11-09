import type { Instansi } from "@/lib/types";

export const JENIS_EKSPOR = ["isi-berkas-aktif", "daftar-berkas", "arsip-dipindahkan"] as const;
export type JenisEkspor = (typeof JENIS_EKSPOR)[number];

export const FORMAT_EKSPOR = ["pdf", "docx", "xlsx"] as const;
export type FormatEkspor = (typeof FORMAT_EKSPOR)[number];

export const LABEL_JENIS: Record<JenisEkspor, string> = {
  "isi-berkas-aktif": "Daftar Isi Berkas Arsip Aktif",
  "daftar-berkas": "Daftar Berkas",
  "arsip-dipindahkan": "Daftar Arsip yang Dipindahkan",
};

export const NAMA_BERKAS_JENIS: Record<JenisEkspor, string> = {
  "isi-berkas-aktif": "daftar-isi-berkas-arsip-aktif",
  "daftar-berkas": "daftar-berkas",
  "arsip-dipindahkan": "daftar-arsip-dipindahkan",
};

export type SumberEkspor = {
  id: string;
  nomor_arsip: string;
  judul: string;
  kode: string;
  tanggal_arsip: Date;
  keterangan: string | null;
  nomor_berkas: string | null;
  nomor_item: string | null;
  indeks: string | null;
  jumlah_folder: number | null;
  tingkat_perkembangan: string | null;
  jumlah_halaman: number | null;
  sifat_arsip: string | null;
  lokasi_cabinet: string | null;
  lokasi_laci: string | null;
  lokasi_folder: string | null;
  kurun_waktu: string | null;
  nomor_boks: string | null;
};

export type KolomEkspor = {
  label: string;
  grup?: string;
  lebar: number;
  align?: "left" | "center" | "right";
};

export type TabelEkspor = {
  jenis: JenisEkspor;
  judul: string;
  orientasi: "portrait" | "landscape";
  kop: boolean;
  tandaTangan: boolean;
  kolom: KolomEkspor[];
  baris: (string | number)[][];
  instansi: Instansi;
  logo?: { data: Buffer; type: "png" | "jpeg" } | null;
};

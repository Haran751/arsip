export type Role = "Admin" | "Operator";

export type AppUser = {
  id: string;
  nama: string;
  username: string;
  role: Role;
  aktif: boolean;
  last_login: string;
};

export type StatusRetensi = "Aktif" | "Inaktif" | "Permanen";

export type KodeArsip = {
  id: string;
  kode: string;
  nama: string;
  retensi_aktif_thn: number;
  retensi_inaktif_thn: number;
  nasib_akhir: "Musnah" | "Permanen" | "Dinilai_Kembali";
  uraian: string[];
  jumlah: number;
};

export type Folder = {
  id: string;
  nama: string;
  keterangan?: string;
  pembuat: string;
  created_at: string;
};

export type Arsip = {
  id: string;
  nomor_arsip: string;
  judul: string;
  kode: string;
  folder_id: string;
  tanggal_arsip: string;
  status_retensi: StatusRetensi;
  akhir_retensi: string;
  pembuat: string;
  created_at?: string;
  keterangan?: string;
  nomor_berkas?: string;
  nomor_item?: string;
  indeks?: string;
  jumlah_folder?: number;
  tingkat_perkembangan?: string;
  jumlah_halaman?: number;
  sifat_arsip?: string;
  lokasi_cabinet?: string;
  lokasi_laci?: string;
  lokasi_folder?: string;
  kurun_waktu?: string;
  nomor_boks?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
};

export type Instansi = {
  unit_pengolah: string;
  nama_pimpinan: string;
  nip_pimpinan: string;
  nama_pengelola: string;
  nip_pengelola: string;
  logo_path?: string;
};

export type LogEntry = {
  id: string;
  waktu: string;
  user: string;
  aksi: string;
  target: string;
  sumber: "Aplikasi" | "Database";
  jenis: "buat" | "ubah" | "hapus" | "setuju" | "login" | "ekspor" | "cron";
};

export type Usulan = {
  id: string;
  nomor: string;
  diajukan_oleh: string;
  tanggal: string;
  status: "Diajukan" | "Disetujui" | "Ditolak";
  jumlah_item: number;
  disetujui_oleh?: string;
  item_ids?: string[];
  catatan?: string;
  diputuskan_pada?: string;
};

export type ArsipInput = {
  nomor_arsip: string;
  judul: string;
  kode: string;
  folder_id: string;
  tanggal_arsip: string;
  keterangan?: string;
  nomor_berkas?: string;
  nomor_item?: string;
  indeks?: string;
  jumlah_folder?: number;
  tingkat_perkembangan?: string;
  jumlah_halaman?: number;
  sifat_arsip?: string;
  lokasi_cabinet?: string;
  lokasi_laci?: string;
  lokasi_folder?: string;
  kurun_waktu?: string;
  nomor_boks?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
};

export type FolderInput = {
  nama: string;
  keterangan?: string;
};

export type KodeInput = {
  kode: string;
  nama: string;
  retensi_aktif_thn: number;
  retensi_inaktif_thn: number;
  nasib_akhir: KodeArsip["nasib_akhir"];
  uraian: string[];
};

export type UserInput = {
  nama: string;
  username: string;
  role: Role;
  aktif: boolean;
  password?: string;
};

export type ActionResult = {
  ok: boolean;
  message?: string;
  errorId?: string;
  fieldErrors?: Record<string, string>;
};

// Nilai kosong (mis. pengguna belum pernah login) atau tidak valid tidak boleh
// melempar RangeError dari Intl; tampilkan "-" agar halaman tetap aman.
export function formatTanggal(value: string) {
  const tanggal = new Date(value);
  if (!value || Number.isNaN(tanggal.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(tanggal);
}

export function formatWaktu(value: string) {
  const tanggal = new Date(value);
  if (!value || Number.isNaN(tanggal.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(tanggal);
}

export function inisial(nama: string) {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Buang nomor urut yang menempel pada teks uraian (mis. "01. ", "2) ", atau
// "10.01 ") supaya tidak dobel dengan nomor urut yang dirender aplikasi.
export function bersihkanNomorUraian(item: string) {
  return item.replace(/^\s*(?:\d{1,3}\s*[.)\-–]\s*)+/, "").trim();
}

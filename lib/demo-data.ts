export type Role = "Admin" | "Operator" | "Pimpinan";

export type DemoUser = {
  id: string;
  nama: string;
  username: string;
  email: string;
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
  jumlah: number;
};

export type Arsip = {
  id: string;
  nomor_arsip: string;
  judul: string;
  kode: string;
  tanggal_arsip: string;
  status_retensi: StatusRetensi;
  akhir_retensi: string;
  pembuat: string;
  keterangan?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
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

export const demoUsers: DemoUser[] = [
  {
    id: "usr-001",
    nama: "Rahmat Hidayat",
    username: "admin",
    email: "admin@earsip.local",
    role: "Admin",
    aktif: true,
    last_login: "2026-10-30T08:12:00+07:00",
  },
  {
    id: "usr-002",
    nama: "Sinta Maharani",
    username: "operator",
    email: "operator@earsip.local",
    role: "Operator",
    aktif: true,
    last_login: "2026-10-30T07:44:00+07:00",
  },
  {
    id: "usr-003",
    nama: "Budi Santoso",
    username: "pimpinan",
    email: "pimpinan@earsip.local",
    role: "Pimpinan",
    aktif: true,
    last_login: "2026-10-29T16:20:00+07:00",
  },
  {
    id: "usr-004",
    nama: "Dewi Lestari",
    username: "dewi",
    email: "dewi@earsip.local",
    role: "Operator",
    aktif: false,
    last_login: "2026-08-14T10:05:00+07:00",
  },
];

export const kodeArsipList: KodeArsip[] = [
  {
    id: "kode-001",
    kode: "KEU-01",
    nama: "Laporan Keuangan Tahunan",
    retensi_aktif_thn: 2,
    retensi_inaktif_thn: 8,
    nasib_akhir: "Musnah",
    jumlah: 3,
  },
  {
    id: "kode-002",
    kode: "KEP-01",
    nama: "Berkas Kepegawaian",
    retensi_aktif_thn: 2,
    retensi_inaktif_thn: 5,
    nasib_akhir: "Musnah",
    jumlah: 1,
  },
  {
    id: "kode-003",
    kode: "HKM-01",
    nama: "Peraturan dan Dokumen Hukum",
    retensi_aktif_thn: 5,
    retensi_inaktif_thn: 5,
    nasib_akhir: "Permanen",
    jumlah: 1,
  },
  {
    id: "kode-004",
    kode: "OPR-01",
    nama: "Dokumen Operasional",
    retensi_aktif_thn: 1,
    retensi_inaktif_thn: 3,
    nasib_akhir: "Dinilai_Kembali",
    jumlah: 2,
  },
  {
    id: "kode-005",
    kode: "PRO-01",
    nama: "Dokumen Program dan Evaluasi",
    retensi_aktif_thn: 3,
    retensi_inaktif_thn: 7,
    nasib_akhir: "Musnah",
    jumlah: 1,
  },
];

export const arsipList: Arsip[] = [
  {
    id: "ars-001",
    nomor_arsip: "ARS-2026-001",
    judul: "Laporan Realisasi Anggaran 2025",
    kode: "KEU-01",
    tanggal_arsip: "2025-01-20",
    status_retensi: "Aktif",
    akhir_retensi: "2035-01-20",
    pembuat: "Rahmat Hidayat",
  },
  {
    id: "ars-002",
    nomor_arsip: "ARS-2025-014",
    judul: "Daftar Hadir Rapat Koordinasi Triwulan I",
    kode: "OPR-01",
    tanggal_arsip: "2025-03-11",
    status_retensi: "Inaktif",
    akhir_retensi: "2029-03-11",
    pembuat: "Sinta Maharani",
  },
  {
    id: "ars-003",
    nomor_arsip: "ARS-2025-009",
    judul: "SK Penetapan Pegawai Kontrak",
    kode: "KEP-01",
    tanggal_arsip: "2024-11-02",
    status_retensi: "Inaktif",
    akhir_retensi: "2031-11-02",
    pembuat: "Rahmat Hidayat",
  },
  {
    id: "ars-004",
    nomor_arsip: "ARS-2024-003",
    judul: "Peraturan Internal Tata Kelola Organisasi",
    kode: "HKM-01",
    tanggal_arsip: "2020-06-01",
    status_retensi: "Permanen",
    akhir_retensi: "2030-06-01",
    pembuat: "Budi Santoso",
  },
  {
    id: "ars-005",
    nomor_arsip: "ARS-2025-021",
    judul: "Nota Dinas Perjalanan Dinas Luar Kota",
    kode: "OPR-01",
    tanggal_arsip: "2025-07-14",
    status_retensi: "Aktif",
    akhir_retensi: "2029-07-14",
    pembuat: "Sinta Maharani",
  },
  {
    id: "ars-006",
    nomor_arsip: "ARS-2024-018",
    judul: "Laporan Evaluasi Program Kerja 2023",
    kode: "PRO-01",
    tanggal_arsip: "2023-12-05",
    status_retensi: "Inaktif",
    akhir_retensi: "2033-12-05",
    pembuat: "Sinta Maharani",
  },
  {
    id: "ars-007",
    nomor_arsip: "ARS-2025-030",
    judul: "Berita Acara Serah Terima Barang",
    kode: "KEU-01",
    tanggal_arsip: "2025-09-01",
    status_retensi: "Aktif",
    akhir_retensi: "2035-09-01",
    pembuat: "Rahmat Hidayat",
  },
  {
    id: "ars-008",
    nomor_arsip: "ARS-2023-006",
    judul: "Dokumen Pengadaan Barang dan Jasa",
    kode: "KEU-01",
    tanggal_arsip: "2022-04-18",
    status_retensi: "Permanen",
    akhir_retensi: "2032-04-18",
    pembuat: "Budi Santoso",
  },
];

export const logList: LogEntry[] = [
  {
    id: "log-001",
    waktu: "2026-10-30T08:12:00+07:00",
    user: "Rahmat Hidayat",
    aksi: "Login ke aplikasi",
    target: "Sesi pengguna",
    sumber: "Aplikasi",
    jenis: "login",
  },
  {
    id: "log-002",
    waktu: "2026-10-30T08:20:00+07:00",
    user: "Rahmat Hidayat",
    aksi: "Menambahkan arsip",
    target: "ARS-2026-001 - Laporan Realisasi Anggaran 2025",
    sumber: "Aplikasi",
    jenis: "buat",
  },
  {
    id: "log-003",
    waktu: "2026-10-30T08:35:00+07:00",
    user: "Sinta Maharani",
    aksi: "Memperbarui kode arsip",
    target: "OPR-01 - Dokumen Operasional",
    sumber: "Aplikasi",
    jenis: "ubah",
  },
  {
    id: "log-004",
    waktu: "2026-10-30T09:02:00+07:00",
    user: "Rahmat Hidayat",
    aksi: "Menyetujui usulan pemusnahan",
    target: "USUL-2026-001",
    sumber: "Aplikasi",
    jenis: "setuju",
  },
  {
    id: "log-005",
    waktu: "2026-10-30T09:15:00+07:00",
    user: "sistem",
    aksi: "Cron retensi memperbarui status",
    target: "8 arsip diperiksa, 0 berubah",
    sumber: "Database",
    jenis: "cron",
  },
  {
    id: "log-006",
    waktu: "2026-10-30T09:30:00+07:00",
    user: "Budi Santoso",
    aksi: "Mengekspor daftar arsip",
    target: "Export Excel - 8 baris",
    sumber: "Aplikasi",
    jenis: "ekspor",
  },
];

export const usulanList: Usulan[] = [
  {
    id: "usul-001",
    nomor: "USUL-2026-001",
    diajukan_oleh: "Sinta Maharani",
    tanggal: "2026-10-28",
    status: "Diajukan",
    jumlah_item: 3,
    item_ids: ["ars-002", "ars-003", "ars-006"],
    catatan: "Arsip sudah melewati masa aktif dan siap ditinjau.",
  },
  {
    id: "usul-002",
    nomor: "USUL-2026-002",
    diajukan_oleh: "Sinta Maharani",
    tanggal: "2026-10-25",
    status: "Disetujui",
    jumlah_item: 2,
    disetujui_oleh: "Rahmat Hidayat",
    item_ids: ["ars-001", "ars-005"],
    catatan: "Pemusnahan berkala triwulan III.",
    diputuskan_pada: "2026-10-26",
  },
  {
    id: "usul-003",
    nomor: "USUL-2025-004",
    diajukan_oleh: "Rahmat Hidayat",
    tanggal: "2025-12-14",
    status: "Ditolak",
    jumlah_item: 1,
    item_ids: ["ars-008"],
    catatan: "Ditolak karena masih diperlukan untuk audit.",
    diputuskan_pada: "2025-12-16",
  },
];

export function formatTanggal(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatWaktu(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function inisial(nama: string) {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const statistik = {
  totalArsip: arsipList.length,
  aktif: arsipList.filter((item) => item.status_retensi === "Aktif").length,
  inaktif: arsipList.filter((item) => item.status_retensi === "Inaktif").length,
  permanen: arsipList.filter((item) => item.status_retensi === "Permanen").length,
  jatuhTempo: 2,
  kodeArsip: kodeArsipList.length,
  pengguna: demoUsers.length,
};

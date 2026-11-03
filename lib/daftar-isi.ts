export type TingkatPerkembangan = "Asli" | "Copy";

export type SifatArsip = "Biasa" | "Terbatas" | "Rahasia";

export type BerkasArsip = {
  id: string;
  nomor_berkas: string;
  kode_klasifikasi: string;
  indeks_berkas: string;
  jumlah_folder: number;
  no_item_arsip: string;
  uraian_informasi: string;
  tanggal: string;
  tingkat_perkembangan: TingkatPerkembangan;
  jumlah_halaman: number;
  sifat_arsip: SifatArsip;
  no_filling_cabinet: string;
  no_laci: string;
  no_folder: string;
  keterangan: string;
};

export type BerkasInput = Omit<BerkasArsip, "id">;

export const TINGKAT_PERKEMBANGAN: TingkatPerkembangan[] = ["Asli", "Copy"];

export const SIFAT_ARSIP: SifatArsip[] = ["Biasa", "Terbatas", "Rahasia"];

export const KOLOM_BERKAS = [
  "Nomor Berkas",
  "Kode Klasifikasi",
  "Indeks Berkas",
  "Jumlah Folder",
  "No. Item Arsip",
  "Uraian Informasi Arsip",
  "Tanggal",
  "Tingkat Perkembangan",
  "Jumlah Halaman Surat",
  "Sifat Arsip",
  "No. Filling Cabinet",
  "No. Laci",
  "No. Folder",
  "Keterangan",
] as const;

export const daftarBerkasDummy: BerkasArsip[] = [
  {
    id: "brk-001",
    nomor_berkas: "BKS-2026-001/KEU",
    kode_klasifikasi: "KEU.01.02",
    indeks_berkas: "Laporan Realisasi Anggaran",
    jumlah_folder: 3,
    no_item_arsip: "001",
    uraian_informasi:
      "Berkas laporan realisasi anggaran tahun 2025 yang meliputi ringkasan pendapatan dan belanja, rincian realisasi per program kegiatan, bukti transfer, serta notulen rapat evaluasi anggaran triwulan IV beserta lampiran tanda terima dokumen.",
    tanggal: "2026-01-15",
    tingkat_perkembangan: "Asli",
    jumlah_halaman: 86,
    sifat_arsip: "Biasa",
    no_filling_cabinet: "FC-01",
    no_laci: "L-01",
    no_folder: "F-01",
    keterangan: "Berkas lengkap dan dalam kondisi baik.",
  },
  {
    id: "brk-002",
    nomor_berkas: "BKS-2026-002/KEP",
    kode_klasifikasi: "KEP.02.01",
    indeks_berkas: "Daftar Hadir Rapat Koordinasi",
    jumlah_folder: 1,
    no_item_arsip: "001",
    uraian_informasi:
      "Berkas daftar hadir dan risalah rapat koordinasi triwulan I tahun 2026 yang dihadiri seluruh kepala unit kerja, dilengkapi undangan rapat, materi presentasi, dan dokumentasi kegiatan.",
    tanggal: "2026-02-03",
    tingkat_perkembangan: "Asli",
    jumlah_halaman: 32,
    sifat_arsip: "Biasa",
    no_filling_cabinet: "FC-01",
    no_laci: "L-02",
    no_folder: "F-02",
    keterangan: "Disimpan sebagai bukti pelaksanaan rapat.",
  },
  {
    id: "brk-003",
    nomor_berkas: "BKS-2025-014/KEP",
    kode_klasifikasi: "KEP.01.03",
    indeks_berkas: "Penetapan Pegawai Kontrak",
    jumlah_folder: 2,
    no_item_arsip: "003",
    uraian_informasi:
      "Berkas surat keputusan penetapan pegawai kontrak tahun anggaran 2025 beserta lampiran daftar nama, riwayat pendidikan, hasil seleksi administrasi, dan berita acara penyerahan keputusan kepada pegawai terkait.",
    tanggal: "2025-11-02",
    tingkat_perkembangan: "Asli",
    jumlah_halaman: 48,
    sifat_arsip: "Terbatas",
    no_filling_cabinet: "FC-02",
    no_laci: "L-01",
    no_folder: "F-03",
    keterangan: "Akses terbatas untuk unit kepegawaian.",
  },
  {
    id: "brk-004",
    nomor_berkas: "BKS-2025-009/HKM",
    kode_klasifikasi: "HKM.01.01",
    indeks_berkas: "Peraturan Internal Organisasi",
    jumlah_folder: 4,
    no_item_arsip: "002",
    uraian_informasi:
      "Berkas peraturan internal tata kelola organisasi yang memuat pedoman kerja, standar operasional prosedur, ketentuan disiplin, serta hasil pembahasan harmonisasi dengan unit hukum dan bagian organisasi.",
    tanggal: "2025-08-20",
    tingkat_perkembangan: "Copy",
    jumlah_halaman: 120,
    sifat_arsip: "Terbatas",
    no_filling_cabinet: "FC-02",
    no_laci: "L-03",
    no_folder: "F-04",
    keterangan: "Salinan resmi, dokumen asli disimpan di unit hukum.",
  },
  {
    id: "brk-005",
    nomor_berkas: "BKS-2026-005/OPR",
    kode_klasifikasi: "OPR.03.02",
    indeks_berkas: "Perjalanan Dinas Luar Kota",
    jumlah_folder: 2,
    no_item_arsip: "004",
    uraian_informasi:
      "Berkas nota dinas perjalanan dinas luar kota bulan Juli 2025 yang mencakup surat tugas, tiket perjalanan, bukti penginapan, rincian biaya perjalanan, laporan hasil kunjungan, dan bukti pertanggungjawaban kegiatan.",
    tanggal: "2026-03-11",
    tingkat_perkembangan: "Asli",
    jumlah_halaman: 24,
    sifat_arsip: "Biasa",
    no_filling_cabinet: "FC-03",
    no_laci: "L-01",
    no_folder: "F-05",
    keterangan: "Sudah diverifikasi bagian keuangan.",
  },
  {
    id: "brk-006",
    nomor_berkas: "BKS-2024-018/PRO",
    kode_klasifikasi: "PRO.02.01",
    indeks_berkas: "Evaluasi Program Kerja",
    jumlah_folder: 3,
    no_item_arsip: "001",
    uraian_informasi:
      "Berkas laporan evaluasi program kerja tahun 2023 yang memuat capaian indikator kinerja, analisis kendala pelaksanaan, rekomendasi perbaikan, serta dokumentasi rapat pembahasan hasil evaluasi bersama seluruh pemangku kepentingan.",
    tanggal: "2024-12-05",
    tingkat_perkembangan: "Asli",
    jumlah_halaman: 156,
    sifat_arsip: "Terbatas",
    no_filling_cabinet: "FC-03",
    no_laci: "L-04",
    no_folder: "F-06",
    keterangan: "Digunakan sebagai dasar penyusunan program berikutnya.",
  },
  {
    id: "brk-007",
    nomor_berkas: "BKS-2026-007/KEU",
    kode_klasifikasi: "KEU.02.01",
    indeks_berkas: "Serah Terima Barang",
    jumlah_folder: 2,
    no_item_arsip: "002",
    uraian_informasi:
      "Berkas berita acara serah terima barang hasil pengadaan bulan September 2025 yang dilengkapi daftar inventaris, spesifikasi teknis barang, faktur pembelian, dan tanda tangan panitia penerima barang.",
    tanggal: "2026-04-01",
    tingkat_perkembangan: "Asli",
    jumlah_halaman: 18,
    sifat_arsip: "Biasa",
    no_filling_cabinet: "FC-01",
    no_laci: "L-03",
    no_folder: "F-07",
    keterangan: "Lampiran inventaris tersimpan dalam folder terpisah.",
  },
  {
    id: "brk-008",
    nomor_berkas: "BKS-2023-006/KEU",
    kode_klasifikasi: "KEU.03.04",
    indeks_berkas: "Pengadaan Barang dan Jasa",
    jumlah_folder: 5,
    no_item_arsip: "001",
    uraian_informasi:
      "Berkas dokumen pengadaan barang dan jasa tahun 2022 yang terdiri atas dokumen persiapan, pengumuman, penawaran penyedia, berita acara evaluasi, penetapan pemenang, kontrak kerja, serta dokumen serah terima pekerjaan.",
    tanggal: "2023-04-18",
    tingkat_perkembangan: "Copy",
    jumlah_halaman: 240,
    sifat_arsip: "Terbatas",
    no_filling_cabinet: "FC-02",
    no_laci: "L-05",
    no_folder: "F-08",
    keterangan: "Salinan untuk kebutuhan audit internal.",
  },
  {
    id: "brk-009",
    nomor_berkas: "BKS-2026-009/KEP",
    kode_klasifikasi: "KEP.03.02",
    indeks_berkas: "Mutasi dan Kenaikan Pangkat",
    jumlah_folder: 4,
    no_item_arsip: "002",
    uraian_informasi:
      "Berkas usulan mutasi dan kenaikan pangkat pegawai yang berisi surat pengantar, daftar riwayat hidup, fotokopi SK terakhir, penilaian prestasi kerja, serta berita acara pemeriksaan kelengkapan berkas kepegawaian.",
    tanggal: "2026-05-09",
    tingkat_perkembangan: "Asli",
    jumlah_halaman: 74,
    sifat_arsip: "Rahasia",
    no_filling_cabinet: "FC-03",
    no_laci: "L-02",
    no_folder: "F-09",
    keterangan: "Hanya dapat diakses oleh Admin dan unit kepegawaian.",
  },
  {
    id: "brk-010",
    nomor_berkas: "BKS-2025-021/OPR",
    kode_klasifikasi: "OPR.01.05",
    indeks_berkas: "Kerja Sama Antar Lembaga",
    jumlah_folder: 3,
    no_item_arsip: "003",
    uraian_informasi:
      "Berkas dokumen kerja sama antar lembaga yang mencakup naskah perjanjian kerja sama, surat kuasa, notulen pembahasan teknis, jadwal pelaksanaan kegiatan, dan laporan monitoring pelaksanaan kerja sama.",
    tanggal: "2025-06-30",
    tingkat_perkembangan: "Asli",
    jumlah_halaman: 52,
    sifat_arsip: "Terbatas",
    no_filling_cabinet: "FC-01",
    no_laci: "L-06",
    no_folder: "F-10",
    keterangan: "Masa berlaku kerja sama sampai Desember 2027.",
  },
  {
    id: "brk-011",
    nomor_berkas: "BKS-2022-011/HKM",
    kode_klasifikasi: "HKM.02.03",
    indeks_berkas: "Putusan dan Dokumen Perkara",
    jumlah_folder: 6,
    no_item_arsip: "001",
    uraian_informasi:
      "Berkas putusan dan dokumen perkara yang memuat salinan putusan pengadilan, berita acara persidangan, surat kuasa pendampingan hukum, kronologi perkara, serta dokumen pendukung lain yang bersifat rahasia.",
    tanggal: "2022-09-14",
    tingkat_perkembangan: "Copy",
    jumlah_halaman: 210,
    sifat_arsip: "Rahasia",
    no_filling_cabinet: "FC-02",
    no_laci: "L-04",
    no_folder: "F-11",
    keterangan: "Akses wajib mendapat persetujuan pimpinan.",
  },
  {
    id: "brk-012",
    nomor_berkas: "BKS-2026-012/PRO",
    kode_klasifikasi: "PRO.04.01",
    indeks_berkas: "Rencana Kerja dan Anggaran",
    jumlah_folder: 2,
    no_item_arsip: "001",
    uraian_informasi:
      "Berkas usulan rencana kerja dan anggaran tahun 2027 yang berisi matriks program kegiatan, rincian kebutuhan anggaran per unit kerja, target kinerja, serta hasil pembahasan forum perencanaan pembangunan.",
    tanggal: "2026-06-17",
    tingkat_perkembangan: "Asli",
    jumlah_halaman: 96,
    sifat_arsip: "Biasa",
    no_filling_cabinet: "FC-03",
    no_laci: "L-05",
    no_folder: "F-12",
    keterangan: "Menunggu penetapan anggaran tahun berikutnya.",
  },
];

export function tahunBerkas(tanggal: string) {
  return tanggal.slice(0, 4);
}

export function kelasSifat(sifat: SifatArsip) {
  if (sifat === "Rahasia") return "badge-danger";
  if (sifat === "Terbatas") return "badge-warn";
  return "badge-aktif";
}

export function formatTanggalPanjang(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatTanggalSingkat(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

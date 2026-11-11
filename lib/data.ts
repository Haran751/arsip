import { prisma } from "./prisma";
import { daftarPenggunaAplikasi } from "./supabase-admin";
import type { AppUser, Arsip, Folder, Instansi, KodeArsip, LogEntry, Role, StatusRetensi, Usulan } from "./types";

export type AppData = {
  arsip: Arsip[];
  folders: Folder[];
  kodeArsip: KodeArsip[];
  users: AppUser[];
  usulan: Usulan[];
  logs: LogEntry[];
  instansi: Instansi;
};

export const INSTANSI_KOSONG: Instansi = {
  unit_pengolah: "",
  nama_pimpinan: "",
  nip_pimpinan: "",
  nama_pengelola: "",
  nip_pengelola: "",
  logo_path: "",
};

export function keInstansi(nilai: unknown): Instansi {
  const data = (nilai ?? {}) as Record<string, unknown>;
  const teks = (kunci: string) => String(data[kunci] ?? "");
  return {
    unit_pengolah: teks("unit_pengolah"),
    nama_pimpinan: teks("nama_pimpinan"),
    nip_pimpinan: teks("nip_pimpinan"),
    nama_pengelola: teks("nama_pengelola"),
    nip_pengelola: teks("nip_pengelola"),
    logo_path: teks("logo_path"),
  };
}

function tanggalSaja(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function waktuIso(value: Date) {
  return value.toISOString();
}

function jenisLog(data: unknown): LogEntry["jenis"] {
  const jenis = (data as { jenis?: string } | null)?.jenis;
  const valid: LogEntry["jenis"][] = ["buat", "ubah", "hapus", "setuju", "login", "ekspor", "cron"];
  return valid.includes(jenis as LogEntry["jenis"]) ? (jenis as LogEntry["jenis"]) : "ubah";
}

async function ambilPengguna(): Promise<AppUser[]> {
  try {
    const users = await daftarPenggunaAplikasi();
    return users.map((user) => ({ ...user, role: user.role as Role }));
  } catch {
    const users = await prisma.user.findMany({ orderBy: { nama: "asc" } });
    return users.map((user) => ({
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: (user.role === "Admin" ? user.role : "Operator") as Role,
      aktif: user.aktif,
      last_login: user.last_login?.toISOString() ?? "",
    }));
  }
}

export async function ambilDataAplikasi(): Promise<AppData> {
  const [arsip, folders, kodeArsip, usulan, logs, users, pengaturan] = await Promise.all([
    prisma.arsip.findMany({
      where: { deleted_at: null },
      include: { kode_arsip: true, pembuat: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.folder.findMany({ orderBy: { nama: "asc" } }),
    prisma.kodeArsip.findMany({ orderBy: { kode: "asc" } }),
    prisma.usulanPemusnahan.findMany({
      include: { item: true, pengaju: true, penyetuju: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.logAktivitas.findMany({
      include: { user: true },
      orderBy: { created_at: "desc" },
      take: 500,
    }),
    ambilPengguna(),
    prisma.pengaturan.findUnique({ where: { kunci: "instansi" } }),
  ]);

  const jumlahPerKode = new Map<string, number>();
  for (const item of arsip) {
    jumlahPerKode.set(item.kode_arsip_id, (jumlahPerKode.get(item.kode_arsip_id) ?? 0) + 1);
  }

  return {
    arsip: arsip.map((item) => ({
      id: item.id,
      nomor_arsip: item.nomor_arsip,
      judul: item.judul,
      kode: item.kode_arsip.kode,
      folder_id: item.folder_id ?? "",
      tanggal_arsip: tanggalSaja(item.tanggal_arsip),
      status_retensi: item.status_retensi as StatusRetensi,
      akhir_retensi: tanggalSaja(item.akhir_retensi),
      pembuat: item.pembuat.nama,
      created_at: item.created_at.toISOString(),
      keterangan: item.keterangan ?? undefined,
      nomor_berkas: item.nomor_berkas ?? undefined,
      nomor_item: item.nomor_item ?? undefined,
      indeks: item.indeks ?? undefined,
      jumlah_folder: item.jumlah_folder ?? undefined,
      tingkat_perkembangan: item.tingkat_perkembangan ?? undefined,
      jumlah_halaman: item.jumlah_halaman ?? undefined,
      sifat_arsip: item.sifat_arsip ?? undefined,
      lokasi_cabinet: item.lokasi_cabinet ?? undefined,
      lokasi_laci: item.lokasi_laci ?? undefined,
      lokasi_folder: item.lokasi_folder ?? undefined,
      kurun_waktu: item.kurun_waktu ?? undefined,
      nomor_boks: item.nomor_boks ?? undefined,
      file_path: item.file_path ?? undefined,
      file_name: item.file_name ?? undefined,
      file_size: item.file_size ?? undefined,
      file_type: item.mime_type ?? undefined,
    })),
    folders: folders.map((item) => ({
      id: item.id,
      nama: item.nama,
      keterangan: item.keterangan ?? undefined,
      pembuat: item.pembuat,
      created_at: item.created_at.toISOString(),
    })),
    kodeArsip: kodeArsip.map((item) => ({
      id: item.id,
      kode: item.kode,
      nama: item.nama,
      retensi_aktif_thn: item.retensi_aktif_thn,
      retensi_inaktif_thn: item.retensi_inaktif_thn,
      nasib_akhir: item.nasib_akhir as KodeArsip["nasib_akhir"],
      uraian: item.uraian,
      jumlah: jumlahPerKode.get(item.id) ?? 0,
    })),
    users,
    usulan: usulan.map((item) => ({
      id: item.id,
      nomor: item.nomor,
      diajukan_oleh: item.pengaju.nama,
      tanggal: tanggalSaja(item.tanggal),
      status: item.status as Usulan["status"],
      jumlah_item: item.item.length,
      disetujui_oleh: item.penyetuju?.nama ?? undefined,
      item_ids: item.item.map((baris) => baris.arsip_id),
      catatan: item.catatan ?? undefined,
      diputuskan_pada: tanggalSaja(item.diputuskan_pada),
    })),
    logs: logs.map((item) => ({
      id: item.id,
      waktu: waktuIso(item.created_at),
      user: item.user?.nama ?? "Sistem",
      aksi: item.aksi,
      target: item.keterangan ?? item.objek_type ?? "",
      sumber: item.sumber === "Database" ? "Database" : "Aplikasi",
      jenis: jenisLog(item.data_json),
    })),
    instansi: keInstansi(pengaturan?.nilai),
  };
}

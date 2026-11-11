"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma, transaksi } from "@/lib/prisma";
import { hitungRetensi } from "@/lib/retensi";
import { ConflictError, NotFoundError, ValidationError, gagalAksi } from "@/lib/errors";
import { sesiPengguna, bolehKelola, tulisLog } from "./guard";
import { bersihkanNomorUraian, type ActionResult, type ArsipInput, type FolderInput, type KodeInput } from "@/lib/types";

type HasilImport = ActionResult & { created?: number; updated?: number };

// Jumlah baris per transaksi saat import agar tidak menahan transaksi terlalu lama.
const UKURAN_BATCH_IMPOR = 50;

function statusArsip(nasib: string, akhirAktif: Date, akhirRetensi: Date): "Aktif" | "Inaktif" | "Permanen" {
  if (nasib === "Permanen") return "Permanen";
  const now = new Date();
  if (now >= akhirAktif || now >= akhirRetensi) return "Inaktif";
  return "Aktif";
}

function validasiTanggal(value: string) {
  const tanggal = new Date(`${value}T00:00:00`);
  if (Number.isNaN(tanggal.getTime())) throw new ValidationError("Tanggal arsip tidak valid.");
  return tanggal;
}

function rapikanUraian(uraian: string[] | undefined) {
  return (uraian ?? []).map((item) => bersihkanNomorUraian(item)).filter(Boolean);
}

function teksAtauNull(nilai: string | undefined) {
  return nilai?.trim() || null;
}

function angkaAtauNull(nilai: number | undefined) {
  return typeof nilai === "number" && Number.isFinite(nilai) ? Math.trunc(nilai) : null;
}

function detailEkspor(input: ArsipInput) {
  return {
    nomor_berkas: teksAtauNull(input.nomor_berkas),
    nomor_item: teksAtauNull(input.nomor_item),
    indeks: teksAtauNull(input.indeks),
    jumlah_folder: angkaAtauNull(input.jumlah_folder),
    tingkat_perkembangan: teksAtauNull(input.tingkat_perkembangan),
    jumlah_halaman: angkaAtauNull(input.jumlah_halaman),
    sifat_arsip: teksAtauNull(input.sifat_arsip),
    lokasi_cabinet: teksAtauNull(input.lokasi_cabinet),
    lokasi_laci: teksAtauNull(input.lokasi_laci),
    lokasi_folder: teksAtauNull(input.lokasi_folder),
    kurun_waktu: teksAtauNull(input.kurun_waktu),
    nomor_boks: teksAtauNull(input.nomor_boks),
  };
}

export async function muatDataAksi() {
  await sesiPengguna();
  const { ambilDataAplikasi } = await import("@/lib/data");
  return ambilDataAplikasi();
}

export async function simpanArsipAksi(input: ArsipInput, id?: string): Promise<ActionResult> {
  try {
    const aktor = await sesiPengguna();
    if (!bolehKelola(aktor)) return { ok: false, message: "Hanya Admin dan Operator yang dapat menambah atau mengubah arsip." };

    const nomor = input.nomor_arsip.trim().toUpperCase();
    const judul = input.judul.trim();
    const kodeString = input.kode.trim().toUpperCase();
    if (!nomor || !judul || !kodeString || !input.tanggal_arsip) {
      return { ok: false, message: "Nomor arsip, judul, kode, dan tanggal wajib diisi." };
    }

    const kode = await prisma.kodeArsip.findUnique({ where: { kode: kodeString } });
    if (!kode) return { ok: false, message: "Kode arsip tidak ditemukan." };

    const folderId = input.folder_id?.trim() || null;
    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder) return { ok: false, message: "Folder tidak ditemukan." };
    }

    const tanggal = validasiTanggal(input.tanggal_arsip);
    const { akhirAktif, akhirRetensi } = hitungRetensi(tanggal, kode.retensi_aktif_thn, kode.retensi_inaktif_thn);
    const status = statusArsip(kode.nasib_akhir, akhirAktif, akhirRetensi);

    await transaksi(async (tx) => {
      if (id) {
        const existing = await tx.arsip.findUnique({ where: { id } });
        if (!existing || existing.deleted_at) throw new NotFoundError("Arsip tidak ditemukan.");
        if (existing.nomor_arsip !== nomor) {
          const bentrok = await tx.arsip.findUnique({ where: { nomor_arsip: nomor } });
          if (bentrok) throw new ConflictError("Nomor arsip sudah digunakan.");
        }

        await tx.arsip.update({
          where: { id },
          data: {
            nomor_arsip: nomor,
            judul,
            kode_arsip_id: kode.id,
            folder_id: folderId,
            tanggal_arsip: tanggal,
            keterangan: input.keterangan?.trim() || null,
            ...detailEkspor(input),
            file_path: input.file_path?.trim() || existing.file_path,
            file_name: input.file_name?.trim() || existing.file_name,
            file_size: input.file_size ?? existing.file_size,
            mime_type: input.file_type?.trim() || existing.mime_type,
            akhir_aktif: akhirAktif,
            akhir_retensi: akhirRetensi,
            status_retensi: status,
            updated_by: aktor.id,
          },
        });

        await tx.arsipRiwayat.create({
          data: {
            arsip_id: id,
            user_id: aktor.id,
            aksi: "Diubah",
            keterangan: `Arsip ${nomor} diperbarui.`,
            data_json: {
              sebelum: { nomor_arsip: existing.nomor_arsip, judul: existing.judul, status_retensi: existing.status_retensi },
              sesudah: { nomor_arsip: nomor, judul, status_retensi: status },
            },
          },
        });
        await tulisLog(tx, aktor, "Edit Arsip", `Mengubah arsip ${nomor}.`, "ubah", { type: "arsip", id });
      } else {
        const bentrok = await tx.arsip.findUnique({ where: { nomor_arsip: nomor } });
        if (bentrok) throw new ConflictError("Nomor arsip sudah digunakan.");

        const dibuat = await tx.arsip.create({
          data: {
            nomor_arsip: nomor,
            judul,
            kode_arsip_id: kode.id,
            folder_id: folderId,
            tanggal_arsip: tanggal,
            keterangan: input.keterangan?.trim() || null,
            ...detailEkspor(input),
            file_path: input.file_path?.trim() || null,
            file_name: input.file_name?.trim() || null,
            file_size: input.file_size ?? null,
            mime_type: input.file_type?.trim() || null,
            akhir_aktif: akhirAktif,
            akhir_retensi: akhirRetensi,
            status_retensi: status,
            created_by: aktor.id,
            updated_by: aktor.id,
          },
        });

        await tx.arsipRiwayat.create({
          data: {
            arsip_id: dibuat.id,
            user_id: aktor.id,
            aksi: "Dibuat",
            keterangan: `Arsip ${nomor} ditambahkan.`,
            data_json: { nomor_arsip: nomor, judul, status_retensi: status },
          },
        });
        await tulisLog(tx, aktor, "Tambah Arsip", `Menambahkan arsip ${nomor}.`, "buat", { type: "arsip", id: dibuat.id });
      }
    });

    revalidatePath("/arsip");
    revalidatePath("/beranda");
    revalidatePath("/log");
    return { ok: true, message: id ? "Arsip diperbarui." : "Arsip ditambahkan." };
  } catch (error) {
    return gagalAksi(error, { aksi: "simpan-arsip" });
  }
}

export async function hapusArsipAksi(id: string): Promise<ActionResult> {
  try {
    const aktor = await sesiPengguna();
    if (!bolehKelola(aktor)) return { ok: false, message: "Hanya Admin dan Operator yang dapat menghapus arsip." };

    const arsip = await prisma.arsip.findUnique({ where: { id } });
    if (!arsip || arsip.deleted_at) return { ok: false, message: "Arsip tidak ditemukan." };

    await transaksi(async (tx) => {
      await tx.arsip.update({
        where: { id },
        data: { deleted_at: new Date(), updated_by: aktor.id },
      });
      await tx.arsipRiwayat.create({
        data: {
          arsip_id: id,
          user_id: aktor.id,
          aksi: "Dihapus",
          keterangan: `Arsip ${arsip.nomor_arsip} dihapus.`,
          data_json: { nomor_arsip: arsip.nomor_arsip, judul: arsip.judul },
        },
      });
      await tulisLog(tx, aktor, "Hapus Arsip", `Menghapus arsip ${arsip.nomor_arsip}.`, "hapus", { type: "arsip", id });
    });

    revalidatePath("/arsip");
    revalidatePath("/beranda");
    revalidatePath("/log");
    return { ok: true, message: "Arsip dihapus." };
  } catch (error) {
    return gagalAksi(error, { aksi: "hapus-arsip" });
  }
}

export async function simpanFolderAksi(input: FolderInput, id?: string): Promise<ActionResult> {
  try {
    const aktor = await sesiPengguna();
    if (!bolehKelola(aktor)) return { ok: false, message: "Tidak diizinkan." };

    const nama = input.nama.trim();
    if (!nama) return { ok: false, message: "Nama folder wajib diisi." };

    await transaksi(async (tx) => {
      if (id) {
        const existing = await tx.folder.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError("Folder tidak ditemukan.");
        await tx.folder.update({
          where: { id },
          data: { nama, keterangan: input.keterangan?.trim() || null },
        });
        await tulisLog(tx, aktor, "Edit Folder", `Mengubah folder ${nama}.`, "ubah", { type: "folder", id });
      } else {
        const dibuat = await tx.folder.create({
          data: { nama, keterangan: input.keterangan?.trim() || null, pembuat: aktor.nama },
        });
        await tulisLog(tx, aktor, "Tambah Folder", `Menambahkan folder ${nama}.`, "buat", { type: "folder", id: dibuat.id });
      }
    });

    revalidatePath("/arsip");
    return { ok: true, message: id ? "Folder diperbarui." : "Folder ditambahkan." };
  } catch (error) {
    return gagalAksi(error, { aksi: "simpan-folder" });
  }
}

export async function hapusFolderAksi(id: string): Promise<ActionResult> {
  try {
    const aktor = await sesiPengguna();
    if (aktor.role !== "Admin") return { ok: false, message: "Hanya Admin yang dapat menghapus folder." };

    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) return { ok: false, message: "Folder tidak ditemukan." };
    const jumlah = await prisma.arsip.count({ where: { folder_id: id, deleted_at: null } });
    if (jumlah > 0) return { ok: false, message: "Folder masih berisi arsip. Pindahkan atau hapus arsip terlebih dahulu." };

    await transaksi(async (tx) => {
      await tx.folder.delete({ where: { id } });
      await tulisLog(tx, aktor, "Hapus Folder", `Menghapus folder ${folder.nama}.`, "hapus", { type: "folder", id });
    });

    revalidatePath("/arsip");
    return { ok: true, message: "Folder dihapus." };
  } catch (error) {
    return gagalAksi(error, { aksi: "hapus-folder" });
  }
}

export async function simpanKodeAksi(input: KodeInput, id?: string): Promise<ActionResult> {
  try {
    const aktor = await sesiPengguna();
    if (aktor.role !== "Admin") return { ok: false, message: "Hanya Admin yang dapat mengelola kode arsip." };

    const kode = input.kode.trim().toUpperCase();
    const nama = input.nama.trim();
    if (!kode || !nama) return { ok: false, message: "Kode dan nama wajib diisi." };

    await transaksi(async (tx) => {
      let kodeId = id;
      if (id) {
        const existing = await tx.kodeArsip.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError("Kode arsip tidak ditemukan.");
        if (existing.kode !== kode) {
          const bentrok = await tx.kodeArsip.findUnique({ where: { kode } });
          if (bentrok) throw new ConflictError("Kode arsip sudah digunakan.");
        }
        await tx.kodeArsip.update({
          where: { id },
          data: {
            kode,
            nama,
            retensi_aktif_thn: input.retensi_aktif_thn,
            retensi_inaktif_thn: input.retensi_inaktif_thn,
            nasib_akhir: input.nasib_akhir,
            uraian: rapikanUraian(input.uraian),
          },
        });
        kodeId = existing.id;
        await tulisLog(tx, aktor, "Edit Kode Arsip", `Mengubah kode ${kode}.`, "ubah", { type: "kode_arsip", id });
      } else {
        const bentrok = await tx.kodeArsip.findUnique({ where: { kode } });
        if (bentrok) throw new ConflictError("Kode arsip sudah digunakan.");
        const dibuat = await tx.kodeArsip.create({
          data: {
            kode,
            nama,
            retensi_aktif_thn: input.retensi_aktif_thn,
            retensi_inaktif_thn: input.retensi_inaktif_thn,
            nasib_akhir: input.nasib_akhir,
            uraian: rapikanUraian(input.uraian),
          },
        });
        kodeId = dibuat.id;
        await tulisLog(tx, aktor, "Tambah Kode Arsip", `Menambahkan kode ${kode}.`, "buat", { type: "kode_arsip", id: kodeId });
      }

      await perbaruiRetensiArsip(tx, { id: kodeId! });
    });

    revalidatePath("/kode-arsip");
    revalidatePath("/arsip");
    return { ok: true, message: id ? "Kode arsip diperbarui." : "Kode arsip ditambahkan." };
  } catch (error) {
    return gagalAksi(error, { aksi: "simpan-kode" });
  }
}

export async function hapusKodeAksi(id: string): Promise<ActionResult> {
  try {
    const aktor = await sesiPengguna();
    if (aktor.role !== "Admin") return { ok: false, message: "Hanya Admin yang dapat menghapus kode arsip." };

    const kode = await prisma.kodeArsip.findUnique({ where: { id } });
    if (!kode) return { ok: false, message: "Kode arsip tidak ditemukan." };
    const jumlah = await prisma.arsip.count({ where: { kode_arsip_id: id, deleted_at: null } });
    if (jumlah > 0) return { ok: false, message: "Kode masih dipakai arsip. Pindahkan arsip terlebih dahulu." };

    await transaksi(async (tx) => {
      await tx.kodeArsip.delete({ where: { id } });
      await tulisLog(tx, aktor, "Hapus Kode Arsip", `Menghapus kode ${kode.kode}.`, "hapus", { type: "kode_arsip", id });
    });

    revalidatePath("/kode-arsip");
    return { ok: true, message: "Kode arsip dihapus." };
  } catch (error) {
    return gagalAksi(error, { aksi: "hapus-kode" });
  }
}

export async function imporKodeAksi(rows: KodeInput[]): Promise<HasilImport> {
  try {
    const aktor = await sesiPengguna();
    if (aktor.role !== "Admin") return { ok: false, message: "Hanya Admin yang dapat mengimpor kode arsip." };
    if (!Array.isArray(rows) || rows.length === 0) return { ok: false, message: "Tidak ada data untuk diimpor." };

    // Normalisasi & buang baris tidak valid sekali di awal.
    const bersih = rows
      .map((row) => ({
        kode: row.kode.trim().toUpperCase(),
        nama: row.nama.trim(),
        retensi_aktif_thn: row.retensi_aktif_thn,
        retensi_inaktif_thn: row.retensi_inaktif_thn,
        nasib_akhir: row.nasib_akhir,
        uraian: rapikanUraian(row.uraian),
      }))
      .filter((row) => row.kode && row.nama);
    if (bersih.length === 0) return { ok: false, message: "Tidak ada data valid untuk diimpor." };

    let created = 0;
    let updated = 0;

    // Proses per batch agar tiap transaksi singkat: transaksi panjang lewat
    // pooler Supabase bisa ditutup di tengah jalan ("Transaction not found").
    for (let i = 0; i < bersih.length; i += UKURAN_BATCH_IMPOR) {
      const batch = bersih.slice(i, i + UKURAN_BATCH_IMPOR);
      const kodeBatch = batch.map((row) => row.kode);

      // Hitung hasil per batch; baru dijumlahkan setelah transaksi commit.
      let batchCreated = 0;
      let batchUpdated = 0;

      await transaksi(async (tx) => {
        // Ambil kode yang sudah ada dalam satu query (hindari findUnique per baris).
        const sudahAda = await tx.kodeArsip.findMany({
          where: { kode: { in: kodeBatch } },
          select: { kode: true },
        });
        const setAda = new Set(sudahAda.map((item) => item.kode));
        const sudahDiproses = new Set<string>();
        const affectedIds = new Set<string>();

        for (const row of batch) {
          const sudah = setAda.has(row.kode) || sudahDiproses.has(row.kode);
          sudahDiproses.add(row.kode);

          const saved = await tx.kodeArsip.upsert({
            where: { kode: row.kode },
            create: {
              kode: row.kode,
              nama: row.nama,
              retensi_aktif_thn: row.retensi_aktif_thn,
              retensi_inaktif_thn: row.retensi_inaktif_thn,
              nasib_akhir: row.nasib_akhir,
              uraian: row.uraian,
            },
            update: {
              nama: row.nama,
              retensi_aktif_thn: row.retensi_aktif_thn,
              retensi_inaktif_thn: row.retensi_inaktif_thn,
              nasib_akhir: row.nasib_akhir,
              uraian: row.uraian,
            },
          });
          affectedIds.add(saved.id);
          if (sudah) batchUpdated += 1;
          else batchCreated += 1;
        }

        for (const kodeId of affectedIds) {
          await perbaruiRetensiArsip(tx, { id: kodeId });
        }
      });

      created += batchCreated;
      updated += batchUpdated;
    }

    await transaksi(async (tx) => {
      await tulisLog(tx, aktor, "Import Kode Arsip", `Mengimpor ${bersih.length} kode arsip.`, "buat", {
        type: "kode_arsip",
        data: { created, updated },
      });
    });

    revalidatePath("/kode-arsip");
    revalidatePath("/arsip");
    return { ok: true, message: `Import selesai: ${created} baru, ${updated} diperbarui.`, created, updated };
  } catch (error) {
    return gagalAksi(error, { aksi: "impor-kode" });
  }
}

async function perbaruiRetensiArsip(tx: Prisma.TransactionClient, kode: { id: string }) {
  const kodeData = await tx.kodeArsip.findUnique({ where: { id: kode.id } });
  if (!kodeData) return;
  const daftar = await tx.arsip.findMany({ where: { kode_arsip_id: kode.id, deleted_at: null } });
  for (const arsip of daftar) {
    const { akhirAktif, akhirRetensi } = hitungRetensi(arsip.tanggal_arsip, kodeData.retensi_aktif_thn, kodeData.retensi_inaktif_thn);
    await tx.arsip.update({
      where: { id: arsip.id },
      data: {
        akhir_aktif: akhirAktif,
        akhir_retensi: akhirRetensi,
        status_retensi: statusArsip(kodeData.nasib_akhir, akhirAktif, akhirRetensi),
      },
    });
  }
}

export async function tambahUsulanAksi(itemIds: string[], catatan?: string): Promise<ActionResult> {
  try {
    const aktor = await sesiPengguna();
    if (!bolehKelola(aktor)) return { ok: false, message: "Hanya Admin dan Operator yang dapat mengajukan penyusutan." };
    if (!itemIds.length) return { ok: false, message: "Pilih arsip yang akan diusulkan." };

    const arsip = await prisma.arsip.findMany({
      where: { id: { in: itemIds }, deleted_at: null },
      include: { kode_arsip: true },
    });
    if (arsip.length !== itemIds.length) return { ok: false, message: "Sebagian arsip tidak ditemukan." };

    const tahun = new Date().getFullYear();
    const awal = new Date(tahun, 0, 1);
    const akhir = new Date(tahun + 1, 0, 1);
    const jumlahTahun = await prisma.usulanPemusnahan.count({ where: { tanggal: { gte: awal, lt: akhir } } });
    const nomor = `USUL-${tahun}-${String(jumlahTahun + 1).padStart(3, "0")}`;

    const usulan = await transaksi(async (tx) => {
      const dibuat = await tx.usulanPemusnahan.create({
        data: {
          nomor,
          tanggal: new Date(),
          status: "Diajukan",
          diajukan_oleh: aktor.id,
          catatan: catatan?.trim() || null,
          item: { create: arsip.map((baris) => ({ arsip_id: baris.id })) },
        },
      });
      await tulisLog(tx, aktor, "Ajukan Penyusutan", `Mengajukan usulan ${nomor} untuk ${arsip.length} arsip.`, "buat", {
        type: "usulan_pemusnahan",
        id: dibuat.id,
      });
      return dibuat;
    });

    revalidatePath("/penyusutan");
    revalidatePath("/log");
    return { ok: true, message: `Usulan ${usulan.nomor} dibuat.` };
  } catch (error) {
    return gagalAksi(error, { aksi: "tambah-usulan" });
  }
}

export async function putuskanUsulanAksi(id: string, status: "Disetujui" | "Ditolak"): Promise<ActionResult> {
  try {
    const aktor = await sesiPengguna();
    if (aktor.role !== "Admin") return { ok: false, message: "Hanya Admin yang dapat memutuskan usulan." };

    const usulan = await prisma.usulanPemusnahan.findUnique({ where: { id } });
    if (!usulan) return { ok: false, message: "Usulan tidak ditemukan." };
    if (usulan.status !== "Diajukan") return { ok: false, message: "Usulan sudah diputuskan." };

    await transaksi(async (tx) => {
      await tx.usulanPemusnahan.update({
        where: { id },
        data: {
          status,
          disetujui_oleh: status === "Disetujui" ? aktor.id : null,
          diputuskan_pada: new Date(),
        },
      });
      await tulisLog(tx, aktor, status === "Disetujui" ? "Setujui Penyusutan" : "Tolak Penyusutan", `Usulan ${usulan.nomor} ${status.toLowerCase()}.`, "setuju", {
        type: "usulan_pemusnahan",
        id,
      });
    });

    revalidatePath("/penyusutan");
    revalidatePath("/log");
    return { ok: true, message: `Usulan ${status.toLowerCase()}.` };
  } catch (error) {
    return gagalAksi(error, { aksi: "putuskan-usulan" });
  }
}

export async function catatLogAksi(
  aksi: string,
  target: string,
  jenis: "buat" | "ubah" | "hapus" | "setuju" | "login" | "ekspor" | "cron",
  sumber: "Aplikasi" | "Database" = "Aplikasi",
): Promise<ActionResult> {
  try {
    const aktor = await sesiPengguna();
    await tulisLog(prisma, aktor, aksi, target, jenis, undefined, sumber);
    return { ok: true };
  } catch (error) {
    return gagalAksi(error, { aksi: "catat-log" });
  }
}

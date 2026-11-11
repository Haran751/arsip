"use server";

import { revalidatePath } from "next/cache";
import { prisma, transaksi } from "@/lib/prisma";
import { createSignedUploadUrl, removeFile } from "@/lib/storage";
import { gagalAksi } from "@/lib/errors";
import { kunciInstansi } from "@/lib/data";
import type { ActionResult, Instansi } from "@/lib/types";
import { bolehKelola, sesiPengguna, tulisLog } from "./guard";

const TIPE_LOGO: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export type HasilUploadLogo = ActionResult & {
  signedUrl?: string;
  path?: string;
};

export async function simpanInstansiAksi(input: Instansi): Promise<ActionResult> {
  try {
    const aktor = await sesiPengguna();
    if (!bolehKelola(aktor)) return { ok: false, message: "Hanya Admin dan Operator yang dapat mengubah konfigurasi instansi." };

    const kunci = kunciInstansi(aktor.id);
    const nilai: Instansi = {
      unit_pengolah: input.unit_pengolah.trim(),
      nama_pimpinan: input.nama_pimpinan.trim(),
      nip_pimpinan: input.nip_pimpinan.trim(),
      nama_pengelola: input.nama_pengelola.trim(),
      nip_pengelola: input.nip_pengelola.trim(),
      logo_path: input.logo_path?.trim() || "",
    };

    const lama = await prisma.pengaturan.findUnique({ where: { kunci } });
    const lamaLogo = (lama?.nilai as Record<string, unknown> | null)?.logo_path;

    await transaksi(async (tx) => {
      await tx.pengaturan.upsert({
        where: { kunci },
        create: { kunci, nilai },
        update: { nilai },
      });
      await tulisLog(tx, aktor, "Ubah Konfigurasi Instansi", `Memperbarui identitas instansi dan logo akun ${aktor.nama}.`, "ubah", {
        type: "pengaturan",
        id: aktor.id,
        data: { unit_pengolah: nilai.unit_pengolah, nama_pimpinan: nilai.nama_pimpinan },
      });
    });

    if (lamaLogo && lamaLogo !== nilai.logo_path) {
      await removeFile(String(lamaLogo)).catch(() => undefined);
    }

    revalidatePath("/pengaturan");
    revalidatePath("/arsip");
    return { ok: true, message: "Konfigurasi instansi disimpan untuk akun ini." };
  } catch (error) {
    return gagalAksi(error, { aksi: "simpan-instansi" });
  }
}

export async function buatUploadLogoAksi(ext: string): Promise<HasilUploadLogo> {
  try {
    const aktor = await sesiPengguna();
    if (!bolehKelola(aktor)) return { ok: false, message: "Hanya Admin dan Operator yang dapat mengunggah logo." };

    const bersih = ext.toLowerCase().replace(/^\./, "");
    const contentType = TIPE_LOGO[bersih];
    if (!contentType) return { ok: false, message: "Logo harus berupa berkas PNG atau JPG." };

    const hasil = await createSignedUploadUrl(bersih, contentType, `logo/${aktor.id}`);
    return { ok: true, signedUrl: hasil.signedUrl, path: hasil.path };
  } catch (error) {
    return gagalAksi(error, { aksi: "upload-logo" });
  }
}

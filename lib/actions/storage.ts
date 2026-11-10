"use server";

import { createSignedDownloadUrl } from "@/lib/storage";
import { gagalAksi } from "@/lib/errors";
import { sesiPengguna } from "./guard";

export type HasilUnduh = {
  ok: boolean;
  message?: string;
  url?: string;
};

export async function ambilUrlUnduhAksi(path: string): Promise<HasilUnduh> {
  try {
    await sesiPengguna();
    if (!path) return { ok: false, message: "Berkas tidak tersedia." };
    const url = await createSignedDownloadUrl(path, 60);
    return { ok: true, url };
  } catch (error) {
    return gagalAksi(error, { aksi: "ambil-url-unduh" });
  }
}

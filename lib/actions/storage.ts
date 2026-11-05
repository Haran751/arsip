"use server";

import { createSignedDownloadUrl } from "@/lib/storage";
import { pesanError, sesiPengguna } from "./guard";

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
    return { ok: false, message: pesanError(error) };
  }
}

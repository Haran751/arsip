import type { Instansi } from "@/lib/types";
import { buatTabel } from "./data";
import { buatDocx } from "./docx";
import { buatPdf } from "./pdf";
import { buatXlsx } from "./xlsx";
import { NAMA_BERKAS_JENIS, type FormatEkspor, type JenisEkspor, type SumberEkspor } from "./types";

export const TIPE_KONTEN: Record<FormatEkspor, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "unit"
  );
}

function stempelTanggal() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

export async function buatBerkasEkspor(
  jenis: JenisEkspor,
  format: FormatEkspor,
  arsip: SumberEkspor[],
  instansi: Instansi,
  opsi?: {
    logo?: { data: Buffer; type: "png" | "jpeg" } | null;
    jumlahItem?: Map<string, number>;
  },
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const tabel = buatTabel(jenis, arsip, instansi, opsi);

  const buffer =
    format === "pdf"
      ? await buatPdf(tabel)
      : format === "docx"
        ? await buatDocx(tabel)
        : await buatXlsx(tabel);

  const filename = `${NAMA_BERKAS_JENIS[jenis]}_${slug(instansi.unit_pengolah)}_${stempelTanggal()}.${format}`;

  return { buffer, filename, contentType: TIPE_KONTEN[format] };
}

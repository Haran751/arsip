import ExcelJS from "exceljs";
import type { TabelEkspor } from "./types";

const BORDER_TIPIS: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

function gayaSel(
  sel: ExcelJS.Cell,
  opsi: {
    bold?: boolean;
    align?: "left" | "center" | "right";
    size?: number;
    border?: boolean;
    wrap?: boolean;
  },
) {
  sel.font = { name: "Times New Roman", size: opsi.size ?? 10, bold: opsi.bold };
  sel.alignment = {
    horizontal: opsi.align ?? "left",
    vertical: "middle",
    wrapText: opsi.wrap ?? true,
  };
  if (opsi.border !== false) sel.border = BORDER_TIPIS;
}

function mergeBaris(
  ws: ExcelJS.Worksheet,
  baris: number,
  kolom: TabelEkspor["kolom"],
  mode: "grup" | "label" | "nomor",
) {
  if (mode === "grup") {
    let index = 0;
    while (index < kolom.length) {
      const item = kolom[index];
      if (item.grup) {
        let span = 1;
        while (index + span < kolom.length && kolom[index + span].grup === item.grup) span += 1;
        if (span > 1) ws.mergeCells(baris, index + 1, baris, index + span);
        const sel = ws.getCell(baris, index + 1);
        sel.value = item.grup;
        gayaSel(sel, { bold: true, align: "center", size: 10 });
        index += span;
      } else {
        ws.mergeCells(baris, index + 1, baris + 1, index + 1);
        const sel = ws.getCell(baris, index + 1);
        sel.value = item.label;
        gayaSel(sel, { bold: true, align: "center", size: 10 });
        index += 1;
      }
    }
    return;
  }

  if (mode === "label") {
    let index = 0;
    while (index < kolom.length) {
      const item = kolom[index];
      if (item.grup) {
        let span = 1;
        while (index + span < kolom.length && kolom[index + span].grup === item.grup) span += 1;
        for (let lanjut = 0; lanjut < span; lanjut += 1) {
          const sel = ws.getCell(baris, index + lanjut + 1);
          sel.value = kolom[index + lanjut].label;
          gayaSel(sel, { bold: true, align: "center", size: 10 });
        }
        index += span;
      } else {
        index += 1;
      }
    }
    return;
  }

  kolom.forEach((_, index) => {
    const sel = ws.getCell(baris, index + 1);
    sel.value = index + 1;
    gayaSel(sel, { bold: true, align: "center", size: 10 });
  });
}

export async function buatXlsx(tabel: TabelEkspor): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "E-Arsip";
  workbook.created = new Date();

  const ws = workbook.addWorksheet(tabel.jenis, {
    pageSetup: {
      paperSize: 9,
      orientation: tabel.orientasi,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  const jumlahKolom = tabel.kolom.length;
  ws.columns = tabel.kolom.map((kolom) => ({ width: Math.max(8, Math.round(kolom.lebar / 5)) }));

  let baris = 1;

  if (tabel.logo) {
    const id = workbook.addImage({
      buffer: tabel.logo.data as unknown as ArrayBuffer,
      extension: tabel.logo.type === "png" ? "png" : "jpeg",
    });
    ws.addImage(id, { tl: { col: 0, row: 0 }, ext: { width: 64, height: 64 } });
    ws.getRow(1).height = 50;
    ws.getRow(2).height = 18;
    ws.getRow(3).height = 18;
  }

  const mulaiJudul = tabel.logo ? 3 : 1;
  if (jumlahKolom >= mulaiJudul) {
    ws.mergeCells(baris, mulaiJudul, baris, jumlahKolom);
    const judul = ws.getCell(baris, mulaiJudul);
    judul.value = tabel.judul;
    judul.font = { name: "Times New Roman", size: 14, bold: true };
    judul.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(baris).height = 24;
  }

  if (tabel.kop) {
    baris += 1;
    ws.mergeCells(baris, 3, baris, jumlahKolom);
    const unit = ws.getCell(baris, 3);
    unit.value = `Unit Pengolah : ${tabel.instansi.unit_pengolah}`;
    unit.font = { name: "Times New Roman", size: 10 };
    unit.alignment = { horizontal: "left", vertical: "middle" };

    baris += 1;
    ws.mergeCells(baris, 3, baris, jumlahKolom);
    const pimpinan = ws.getCell(baris, 3);
    pimpinan.value = `Nama Pimpinan Central File : ${tabel.instansi.nama_pimpinan}`;
    pimpinan.font = { name: "Times New Roman", size: 10 };
    pimpinan.alignment = { horizontal: "left", vertical: "middle" };
  }

  baris += 2;
  const awalHeader = baris;
  const adaGrup = tabel.kolom.some((kolom) => kolom.grup);

  if (adaGrup) {
    mergeBaris(ws, baris, tabel.kolom, "grup");
    baris += 1;
    mergeBaris(ws, baris, tabel.kolom, "label");
    baris += 1;
    mergeBaris(ws, baris, tabel.kolom, "nomor");
  } else {
    tabel.kolom.forEach((kolom, index) => {
      const sel = ws.getCell(baris, index + 1);
      sel.value = kolom.label;
      gayaSel(sel, { bold: true, align: "center", size: 10 });
    });
    baris += 1;
    mergeBaris(ws, baris, tabel.kolom, "nomor");
  }

  const akhirHeader = baris;
  ws.getRow(awalHeader).height = 30;
  ws.getRow(akhirHeader).height = 20;
  if (adaGrup) ws.getRow(awalHeader + 1).height = 30;

  baris += 1;
  const awalData = baris;

  for (const data of tabel.baris) {
    data.forEach((nilai, index) => {
      const sel = ws.getCell(baris, index + 1);
      sel.value = nilai === "" ? null : nilai;
      gayaSel(sel, {
        align: tabel.kolom[index]?.align ?? "left",
        size: tabel.kolom.length >= 13 ? 9 : 10,
      });
    });
    baris += 1;
  }

  const akhirData = baris - 1;

  if (tabel.tandaTangan && akhirData >= awalData) {
    const tengah = Math.ceil(jumlahKolom / 2);
    baris += 1;
    ws.mergeCells(baris, 1, baris, tengah);
    ws.mergeCells(baris, tengah + 1, baris, jumlahKolom);
    const kiriJudul = ws.getCell(baris, 1);
    kiriJudul.value = "Pengelola Central File,";
    kiriJudul.font = { name: "Times New Roman", size: 10 };
    kiriJudul.alignment = { horizontal: "center", vertical: "middle" };
    const kananJudul = ws.getCell(baris, tengah + 1);
    kananJudul.value = "Mengetahui, Pimpinan Central File";
    kananJudul.font = { name: "Times New Roman", size: 10 };
    kananJudul.alignment = { horizontal: "center", vertical: "middle" };

    baris += 3;
    ws.mergeCells(baris, 1, baris, tengah);
    ws.mergeCells(baris, tengah + 1, baris, jumlahKolom);
    const kiriNama = ws.getCell(baris, 1);
    kiriNama.value = tabel.instansi.nama_pengelola;
    kiriNama.font = { name: "Times New Roman", size: 10, underline: true };
    kiriNama.alignment = { horizontal: "center", vertical: "middle" };
    const kananNama = ws.getCell(baris, tengah + 1);
    kananNama.value = tabel.instansi.nama_pimpinan;
    kananNama.font = { name: "Times New Roman", size: 10, underline: true };
    kananNama.alignment = { horizontal: "center", vertical: "middle" };

    baris += 1;
    ws.mergeCells(baris, 1, baris, tengah);
    ws.mergeCells(baris, tengah + 1, baris, jumlahKolom);
    const kiriNip = ws.getCell(baris, 1);
    kiriNip.value = `NIP. ${tabel.instansi.nip_pengelola}`;
    kiriNip.font = { name: "Times New Roman", size: 10 };
    kiriNip.alignment = { horizontal: "center", vertical: "middle" };
    const kananNip = ws.getCell(baris, tengah + 1);
    kananNip.value = `NIP. ${tabel.instansi.nip_pimpinan}`;
    kananNip.font = { name: "Times New Roman", size: 10 };
    kananNip.alignment = { horizontal: "center", vertical: "middle" };
  }

  ws.pageSetup.printTitlesRow = `${awalHeader}:${akhirHeader}`;
  ws.views = [{ state: "frozen", ySplit: akhirHeader }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

import path from "path";
import pdfMake from "pdfmake";
import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import type { TabelEkspor } from "./types";

const FONT_DIR = path.join(process.cwd(), "lib", "ekspor", "fonts");
let fontSiap = false;

function siapkanFont() {
  if (fontSiap) return;
  pdfMake.setFonts({
    Tinos: {
      normal: path.join(FONT_DIR, "Tinos-Regular.ttf"),
      bold: path.join(FONT_DIR, "Tinos-Bold.ttf"),
      italics: path.join(FONT_DIR, "Tinos-Italic.ttf"),
      bolditalics: path.join(FONT_DIR, "Tinos-BoldItalic.ttf"),
    },
  });
  pdfMake.setLocalAccessPolicy((lokasi) => lokasi.startsWith(FONT_DIR));
  pdfMake.setUrlAccessPolicy(() => false);
  fontSiap = true;
}

function dataUrlLogo(tabel: TabelEkspor) {
  if (!tabel.logo) return null;
  const mime = tabel.logo.type === "png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${tabel.logo.data.toString("base64")}`;
}

function barisHeader(tabel: TabelEkspor): TableCell[][] {
  const adaGrup = tabel.kolom.some((kolom) => kolom.grup);
  const label: TableCell[] = tabel.kolom.map((kolom) => ({
    text: kolom.label,
    bold: true,
    alignment: "center",
  }));
  const nomor: TableCell[] = tabel.kolom.map((_, index) => ({
    text: String(index + 1),
    bold: true,
    alignment: "center",
  }));

  if (!adaGrup) return [label, nomor];

  const grup: TableCell[] = [];
  const subLabel: TableCell[] = [];
  let index = 0;
  while (index < tabel.kolom.length) {
    const kolom = tabel.kolom[index];
    if (kolom.grup) {
      let span = 1;
      while (index + span < tabel.kolom.length && tabel.kolom[index + span].grup === kolom.grup) span += 1;
      grup.push({ text: kolom.grup, bold: true, alignment: "center", colSpan: span });
      for (let lanjut = 1; lanjut < span; lanjut += 1) grup.push({});
      for (let lanjut = 0; lanjut < span; lanjut += 1) {
        subLabel.push({ text: tabel.kolom[index + lanjut].label, bold: true, alignment: "center" });
      }
      index += span;
    } else {
      grup.push({ text: kolom.label, bold: true, alignment: "center", rowSpan: 2 });
      subLabel.push({});
      index += 1;
    }
  }

  return [grup, subLabel, nomor];
}

function kop(tabel: TabelEkspor): Content[] {
  const logo = dataUrlLogo(tabel);
  const judul: Content = {
    text: tabel.judul,
    bold: true,
    fontSize: tabel.orientasi === "portrait" ? 13 : 14,
    alignment: "center",
  };

  if (!tabel.kop) {
    return [{ ...judul, margin: [0, 0, 0, 8] }];
  }

  const kolom: TableCell[] = [
    logo ? { image: logo, alignment: "left" } : { text: "" },
    { stack: [judul], alignment: "center" },
    { text: "" },
  ];

  return [
    {
      table: { widths: [70, "*", 70], body: [kolom] },
      layout: "noBorders",
      margin: [0, 0, 0, 4],
    },
    {
      stack: [
        { text: `Unit Pengolah : ${tabel.instansi.unit_pengolah}`, fontSize: 10 },
        { text: `Nama Pimpinan Central File : ${tabel.instansi.nama_pimpinan}`, fontSize: 10 },
      ],
      margin: [0, 2, 0, 10],
    },
  ];
}

function tandaTangan(tabel: TabelEkspor): Content {
  const kiri: Content = {
    stack: [
      { text: "Pengelola Central File,", margin: [0, 18, 0, 0] },
      { text: tabel.instansi.nama_pengelola || " ", bold: true, margin: [0, 40, 0, 0] },
      { text: `NIP. ${tabel.instansi.nip_pengelola}` },
    ],
    alignment: "left",
  };
  const kanan: Content = {
    stack: [
      { text: "Mengetahui, Pimpinan Central File", margin: [0, 18, 0, 0] },
      { text: tabel.instansi.nama_pimpinan || " ", bold: true, margin: [0, 40, 0, 0] },
      { text: `NIP. ${tabel.instansi.nip_pimpinan}` },
    ],
    alignment: "right",
  };

  return {
    table: { widths: ["*", "*"], body: [[kiri, kanan]] },
    layout: "noBorders",
    margin: [0, 24, 0, 0],
  };
}

export async function buatPdf(tabel: TabelEkspor): Promise<Buffer> {
  siapkanFont();

  const kolom = tabel.kolom;
  const lebar = kolom.reduce((total, item) => total + item.lebar, 0);
  const ukuranHuruf = kolom.length >= 13 ? 8 : kolom.length >= 11 ? 9 : 10;

  const isi: TableCell[][] = tabel.baris.map((baris) =>
    baris.map((sel, index) => ({
      text: String(sel ?? ""),
      alignment: kolom[index]?.align ?? "left",
    })),
  );

  const body: TableCell[][] = [...barisHeader(tabel), ...isi];
  const headerRows = tabel.kolom.some((item) => item.grup) ? 3 : 2;

  const konten: Content[] = [
    ...kop(tabel),
    {
      table: {
        headerRows,
        widths: kolom.map((item) => item.lebar),
        body,
        dontBreakRows: true,
      },
      layout: {
        hLineWidth: () => 0.6,
        vLineWidth: () => 0.6,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 2,
        paddingBottom: () => 2,
      },
      fontSize: ukuranHuruf,
    },
  ];

  if (tabel.tandaTangan) konten.push(tandaTangan(tabel));

  const definisi: TDocumentDefinitions = {
    pageSize: "A4",
    pageOrientation: tabel.orientasi,
    pageMargins: [24, 28, 24, 32],
    defaultStyle: { font: "Tinos", fontSize: ukuranHuruf },
    content: konten,
    info: {
      title: tabel.judul,
      author: tabel.instansi.unit_pengolah || "E-Arsip",
      creator: "E-Arsip",
    },
  };

  if (lebar <= 0) throw new Error("Kolom ekspor tidak valid.");

  return pdfMake.createPdf(definisi).getBuffer();
}

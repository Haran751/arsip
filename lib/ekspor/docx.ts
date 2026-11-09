import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type IBorderOptions,
  type ITableCellOptions,
} from "docx";
import type { TabelEkspor } from "./types";

const A4_LEBAR = 11906;
const A4_TINGGI = 16838;
const MARGIN = 720;

function border(): IBorderOptions {
  return { style: BorderStyle.SINGLE, size: 4, color: "000000" };
}

function tanpaBorder() {
  const kosong: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return {
    top: kosong,
    bottom: kosong,
    left: kosong,
    right: kosong,
    insideHorizontal: kosong,
    insideVertical: kosong,
  };
}

// Dua tabel yang berdampingan tanpa paragraf akan digabung Word, sehingga
// isinya bisa bergeser/tertutup. Paragraf kosong ini memisahkannya.
function paragrafPemisah(): Paragraph {
  return new Paragraph({ spacing: { before: 0, after: 0 }, children: [] });
}

function sel(
  teks: string,
  opsi?: {
    bold?: boolean;
    align?: "left" | "center" | "right";
    span?: number;
    rowSpan?: number;
    size?: number;
    width?: number;
  },
): TableCell {
  const properti: ITableCellOptions = {
    children: [
      new Paragraph({
        alignment:
          opsi?.align === "center"
            ? AlignmentType.CENTER
            : opsi?.align === "right"
              ? AlignmentType.RIGHT
              : AlignmentType.LEFT,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: teks, bold: opsi?.bold, size: opsi?.size ?? 18 })],
      }),
    ],
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opsi?.span,
    rowSpan: opsi?.rowSpan,
    width: opsi?.width ? { size: opsi.width, type: WidthType.DXA } : undefined,
  };
  return new TableCell(properti);
}

function headerRows(
  tabel: TabelEkspor,
  columnWidths: number[],
  ukuran: number,
): TableRow[] {
  const adaGrup = tabel.kolom.some((kolom) => kolom.grup);
  const label = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: tabel.kolom.map((kolom, index) =>
      sel(kolom.label, { bold: true, align: "center", size: ukuran, width: columnWidths[index] }),
    ),
  });
  const nomor = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: tabel.kolom.map((_, index) =>
      sel(String(index + 1), { bold: true, align: "center", size: ukuran, width: columnWidths[index] }),
    ),
  });

  if (!adaGrup) return [label, nomor];

  const grup: TableCell[] = [];
  const subLabel: TableCell[] = [];
  let index = 0;
  while (index < tabel.kolom.length) {
    const kolom = tabel.kolom[index];
    if (kolom.grup) {
      let span = 1;
      while (index + span < tabel.kolom.length && tabel.kolom[index + span].grup === kolom.grup) span += 1;
      const lebarGrup = columnWidths.slice(index, index + span).reduce((total, lebar) => total + lebar, 0);
      // docx mengatur gridSpan sendiri, jadi tidak boleh ada sel pengisi tambahan.
      grup.push(sel(kolom.grup, { bold: true, align: "center", span, size: ukuran, width: lebarGrup }));
      for (let lanjut = 0; lanjut < span; lanjut += 1) {
        subLabel.push(
          sel(tabel.kolom[index + lanjut].label, {
            bold: true,
            align: "center",
            size: ukuran,
            width: columnWidths[index + lanjut],
          }),
        );
      }
      index += span;
    } else {
      // rowSpan juga otomatis dibuatkan sel lanjutan oleh docx di baris bawahnya.
      grup.push(
        sel(kolom.label, {
          bold: true,
          align: "center",
          rowSpan: 2,
          size: ukuran,
          width: columnWidths[index],
        }),
      );
      index += 1;
    }
  }

  return [
    new TableRow({ tableHeader: true, cantSplit: true, children: grup }),
    new TableRow({ tableHeader: true, cantSplit: true, children: subLabel }),
    nomor,
  ];
}

function kop(tabel: TabelEkspor, contentWidth: number): (Table | Paragraph)[] {
  const judul = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: tabel.judul, bold: true, size: 28 })],
  });

  const kiri = tabel.logo
    ? new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new ImageRun({
                type: tabel.logo.type === "png" ? "png" : "jpg",
                data: tabel.logo.data,
                transformation: { width: 60, height: 60 },
                altText: { name: "Logo instansi", description: "Logo instansi", title: "Logo" },
              }),
            ],
          }),
        ],
        width: { size: 1200, type: WidthType.DXA },
      })
    : new TableCell({ children: [new Paragraph("")], width: { size: 1200, type: WidthType.DXA } });

  const tengah = new TableCell({
    children: [judul],
    verticalAlign: VerticalAlign.CENTER,
  });
  const kanan = new TableCell({ children: [new Paragraph("")], width: { size: 1200, type: WidthType.DXA } });

  const tabelKop = new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: [1200, contentWidth - 2400, 1200],
    layout: TableLayoutType.FIXED,
    borders: tanpaBorder(),
    rows: [new TableRow({ cantSplit: true, children: [kiri, tengah, kanan] })],
  });

  const keterangan = new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: [contentWidth],
    layout: TableLayoutType.FIXED,
    borders: tanpaBorder(),
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: `Unit Pengolah : ${tabel.instansi.unit_pengolah}`, size: 20 })],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Nama Pimpinan Central File : ${tabel.instansi.nama_pimpinan}`, size: 20 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return [tabelKop, paragrafPemisah(), keterangan];
}

function tandaTangan(tabel: TabelEkspor, contentWidth: number): Table {
  const kiri = new TableCell({
    children: [
      new Paragraph({ text: "Pengelola Central File,", spacing: { before: 300, after: 0 } }),
      new Paragraph({ text: "", spacing: { before: 0, after: 0 } }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: tabel.instansi.nama_pengelola || " ", bold: true, size: 20 })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: `NIP. ${tabel.instansi.nip_pengelola}`, size: 20 })],
      }),
    ],
  });
  const kanan = new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        text: "Mengetahui, Pimpinan Central File",
        spacing: { before: 300, after: 0 },
      }),
      new Paragraph({ text: "", spacing: { before: 0, after: 0 } }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: tabel.instansi.nama_pimpinan || " ", bold: true, size: 20 })],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: `NIP. ${tabel.instansi.nip_pimpinan}`, size: 20 })],
      }),
    ],
  });

  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: [Math.floor(contentWidth / 2), Math.ceil(contentWidth / 2)],
    layout: TableLayoutType.FIXED,
    borders: tanpaBorder(),
    rows: [new TableRow({ cantSplit: true, children: [kiri, kanan] })],
  });
}

export async function buatDocx(tabel: TabelEkspor): Promise<Buffer> {
  const landscape = tabel.orientasi === "landscape";
  const contentWidth = (landscape ? A4_TINGGI : A4_LEBAR) - MARGIN * 2;
  const totalLebar = tabel.kolom.reduce((total, kolom) => total + Math.max(1, kolom.lebar), 0);
  // Lebar minimum supaya judul kolom pendek tetap terbaca dan tidak terbungkus aneh.
  const lebarMinimum = Math.min(560, Math.floor(contentWidth / tabel.kolom.length));
  const columnWidths = tabel.kolom.map((kolom) =>
    Math.max(lebarMinimum, Math.round((Math.max(1, kolom.lebar) / totalLebar) * contentWidth)),
  );
  // Pastikan total lebar kolom tepat sama dengan lebar area cetak (tidak melewati margin).
  const selisihLebar = contentWidth - columnWidths.reduce((total, lebar) => total + lebar, 0);
  if (selisihLebar !== 0) {
    const terlebar = columnWidths.indexOf(Math.max(...columnWidths));
    columnWidths[terlebar] += selisihLebar;
  }
  const ukuran = tabel.kolom.length >= 13 ? 16 : 18;

  const isi = tabel.baris.map(
    (baris) =>
      new TableRow({
        cantSplit: true,
        children: baris.map((nilai, index) =>
          sel(String(nilai ?? ""), {
            align: tabel.kolom[index]?.align,
            size: ukuran,
            width: columnWidths[index],
          }),
        ),
      }),
  );

  const tabelUtama = new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    margins: { top: 20, bottom: 20, left: 60, right: 60 },
    borders: {
      top: border(),
      bottom: border(),
      left: border(),
      right: border(),
      insideHorizontal: border(),
      insideVertical: border(),
    },
    rows: [...headerRows(tabel, columnWidths, ukuran), ...isi],
  });

  const anak: (Table | Paragraph)[] = [];
  if (tabel.kop) {
    anak.push(...kop(tabel, contentWidth));
    anak.push(new Paragraph({ text: "", spacing: { after: 120 } }));
  } else {
    anak.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: tabel.judul, bold: true, size: 26 })],
      }),
    );
  }
  anak.push(tabelUtama);
  if (tabel.tandaTangan) {
    anak.push(paragrafPemisah());
    anak.push(tandaTangan(tabel, contentWidth));
  }

  const dokumen = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              // docx menukar width/height sendiri saat orientasi landscape.
              width: A4_LEBAR,
              height: A4_TINGGI,
              orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children: anak,
      },
    ],
  });

  return Packer.toBuffer(dokumen);
}

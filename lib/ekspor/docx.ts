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

function sel(
  teks: string,
  opsi?: {
    bold?: boolean;
    align?: "left" | "center" | "right";
    span?: number;
    rowSpan?: number;
    size?: number;
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
  };
  return new TableCell(properti);
}

function headerRows(tabel: TabelEkspor): TableRow[] {
  const adaGrup = tabel.kolom.some((kolom) => kolom.grup);
  const label = new TableRow({
    tableHeader: true,
    children: tabel.kolom.map((kolom) => sel(kolom.label, { bold: true, align: "center" })),
  });
  const nomor = new TableRow({
    tableHeader: true,
    children: tabel.kolom.map((_, index) => sel(String(index + 1), { bold: true, align: "center" })),
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
      grup.push(sel(kolom.grup, { bold: true, align: "center", span }));
      for (let lanjut = 1; lanjut < span; lanjut += 1) grup.push(sel(""));
      for (let lanjut = 0; lanjut < span; lanjut += 1) {
        subLabel.push(sel(tabel.kolom[index + lanjut].label, { bold: true, align: "center" }));
      }
      index += span;
    } else {
      grup.push(sel(kolom.label, { bold: true, align: "center", rowSpan: 2 }));
      subLabel.push(sel(""));
      index += 1;
    }
  }

  return [
    new TableRow({ tableHeader: true, children: grup }),
    new TableRow({ tableHeader: true, children: subLabel }),
    nomor,
  ];
}

function kop(tabel: TabelEkspor, contentWidth: number): Table[] {
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
    borders: tanpaBorder(),
    rows: [new TableRow({ children: [kiri, tengah, kanan] })],
  });

  const keterangan = new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: [contentWidth],
    borders: tanpaBorder(),
    rows: [
      new TableRow({
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

  return [tabelKop, keterangan];
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
    borders: tanpaBorder(),
    rows: [new TableRow({ children: [kiri, kanan] })],
  });
}

export async function buatDocx(tabel: TabelEkspor): Promise<Buffer> {
  const landscape = tabel.orientasi === "landscape";
  const contentWidth = (landscape ? A4_TINGGI : A4_LEBAR) - MARGIN * 2;
  const totalLebar = tabel.kolom.reduce((total, kolom) => total + kolom.lebar, 0);
  const columnWidths = tabel.kolom.map((kolom) =>
    Math.max(280, Math.round((kolom.lebar / totalLebar) * contentWidth)),
  );
  const ukuran = tabel.kolom.length >= 13 ? 16 : 18;

  const isi = tabel.baris.map(
    (baris) =>
      new TableRow({
        children: baris.map((nilai, index) =>
          sel(String(nilai ?? ""), {
            align: tabel.kolom[index]?.align,
            size: ukuran,
          }),
        ),
      }),
  );

  const tabelUtama = new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    borders: {
      top: border(),
      bottom: border(),
      left: border(),
      right: border(),
      insideHorizontal: border(),
      insideVertical: border(),
    },
    rows: [...headerRows(tabel), ...isi],
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
  if (tabel.tandaTangan) anak.push(tandaTangan(tabel, contentWidth));

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
              width: landscape ? A4_TINGGI : A4_LEBAR,
              height: landscape ? A4_LEBAR : A4_TINGGI,
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

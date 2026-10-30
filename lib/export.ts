"use client";

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers, ...rows].map((row) => row.map(escape).join(","));
  download(filename, new Blob(["\ufeff", lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
}

export function downloadExcel(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const table = [
    "<html><head><meta charset=\"utf-8\" /></head><body><table border=\"1\">",
    "<thead><tr>",
    ...headers.map((header) => `<th>${escape(header)}</th>`),
    "</tr></thead><tbody>",
    ...rows.map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join("")}</tr>`),
    "</tbody></table></body></html>",
  ].join("");
  download(filename, new Blob(["\ufeff", table], { type: "application/vnd.ms-excel;charset=utf-8" }));
}

export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\ufeff/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

export function formatBytes(value?: number) {
  if (!value || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadDokumenDemo(nomor: string, judul: string, isi: string[]) {
  const text = [
    "E-ARSIP - DOKUMEN DEMO",
    "======================",
    `Nomor Arsip : ${nomor}`,
    `Judul       : ${judul}`,
    "",
    ...isi,
    "",
    "Catatan: file asli tidak disimpan karena aplikasi masih berjalan dalam mode demo.",
  ].join("\r\n");
  download(
    `${nomor}-${judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}.txt`,
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
}

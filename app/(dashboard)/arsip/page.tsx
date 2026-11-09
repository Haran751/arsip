"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Drawer from "@/components/drawer";
import Icon from "@/components/icon";
import Modal from "@/components/modal";
import StatusBadge from "@/components/status-badge";
import TombolMemuat from "@/components/loading-button";
import {
  formatTanggal,
  formatWaktu,
  inisial,
  type Arsip,
  type ArsipInput,
  type Folder,
  type FolderInput,
} from "@/lib/types";
import { useData } from "@/lib/data-store";
import { formatBytes } from "@/lib/export";
import { ambilUrlUnduhAksi } from "@/lib/actions/storage";
import { hitungRetensi } from "@/lib/retensi";
import { LABEL_JENIS, type FormatEkspor, type JenisEkspor } from "@/lib/ekspor/types";

const PAGE_SIZE = 8;

const PILIHAN_EKSPOR: { value: JenisEkspor; label: string; deskripsi: string }[] = [
  {
    value: "isi-berkas-aktif",
    label: LABEL_JENIS["isi-berkas-aktif"],
    deskripsi: "Rincian per item arsip lengkap dengan lokasi filling cabinet, laci, dan folder.",
  },
  {
    value: "daftar-berkas",
    label: LABEL_JENIS["daftar-berkas"],
    deskripsi: "Rekap per nomor berkas beserta kurun waktu dan jumlah item.",
  },
  {
    value: "arsip-dipindahkan",
    label: LABEL_JENIS["arsip-dipindahkan"],
    deskripsi: "Daftar arsip yang dipindahkan beserta nomor boks.",
  },
];

const FORMAT_PILIHAN: { value: FormatEkspor; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "xlsx", label: "XLSX" },
];

const BULAN = [
  ["01", "Januari"],
  ["02", "Februari"],
  ["03", "Maret"],
  ["04", "April"],
  ["05", "Mei"],
  ["06", "Juni"],
  ["07", "Juli"],
  ["08", "Agustus"],
  ["09", "September"],
  ["10", "Oktober"],
  ["11", "November"],
  ["12", "Desember"],
];

type ModeTanggal = "" | "satu" | "rentang";

type ArsipFormState = {
  nomor_arsip: string;
  judul: string;
  kode: string;
  folder_id: string;
  tanggal_arsip: string;
  keterangan: string;
  nomor_berkas: string;
  nomor_item: string;
  indeks: string;
  jumlah_folder: string;
  tingkat_perkembangan: string;
  jumlah_halaman: string;
  sifat_arsip: string;
  lokasi_cabinet: string;
  lokasi_laci: string;
  lokasi_folder: string;
  kurun_waktu: string;
  nomor_boks: string;
  file_name: string;
  file_size?: number;
  file_type: string;
};

type FolderFormState = {
  nama: string;
  keterangan: string;
};

const DETAIL_KOSONG = {
  nomor_berkas: "",
  nomor_item: "",
  indeks: "",
  jumlah_folder: "",
  tingkat_perkembangan: "",
  jumlah_halaman: "",
  sifat_arsip: "",
  lokasi_cabinet: "",
  lokasi_laci: "",
  lokasi_folder: "",
  kurun_waktu: "",
  nomor_boks: "",
};

function angkaDariTeks(nilai: string) {
  const bersih = nilai.trim();
  if (!bersih) return undefined;
  const angka = Number(bersih);
  return Number.isFinite(angka) ? Math.trunc(angka) : undefined;
}

function namaBerkasUnduhan(header: string | null) {
  if (!header) return null;
  const cocok = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);
  return cocok ? decodeURIComponent(cocok[1]) : null;
}

function today() {
  const value = new Date();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

export default function ArsipPage() {
  const {
    ready,
    data,
    canManage,
    saveArsip,
    deleteArsip,
    saveFolder,
    deleteFolder,
    nextNomorArsip,
    catatLog,
    refreshData,
    toast,
  } = useData();

  // Mode navigasi: folder-first
  const [folderAktifId, setFolderAktifId] = useState<string | null>(null);
  const [tampilanSemua, setTampilanSemua] = useState(false);

  // Folder modal state
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderForm, setFolderForm] = useState<FolderFormState>({ nama: "", keterangan: "" });
  const [folderFormError, setFolderFormError] = useState("");
  const [hapusFolder, setHapusFolder] = useState<Folder | null>(null);
  const [menyimpanFolder, setMenyimpanFolder] = useState(false);
  const [menghapusFolder, setMenghapusFolder] = useState(false);
  const [menyimpanArsip, setMenyimpanArsip] = useState(false);
  const [menghapusArsip, setMenghapusArsip] = useState(false);

  // Filter & pencarian arsip
  const [cari, setCari] = useState("");
  const [tahun, setTahun] = useState("");
  const [bulan, setBulan] = useState("");
  const [status, setStatus] = useState("");
  const [kode, setKode] = useState("");
  const [pengguna, setPengguna] = useState("");
  const [modeTanggal, setModeTanggal] = useState<ModeTanggal>("");
  const [tanggal1, setTanggal1] = useState("");
  const [tanggal2, setTanggal2] = useState("");
  const [page, setPage] = useState(1);

  // Arsip form & detail modal
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Arsip | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [hapus, setHapus] = useState<Arsip | null>(null);
  const [form, setForm] = useState<ArsipFormState>({
    nomor_arsip: "",
    judul: "",
    kode: "",
    folder_id: "",
    tanggal_arsip: "",
    keterangan: "",
    ...DETAIL_KOSONG,
    file_name: "",
    file_type: "",
  });
  const [formError, setFormError] = useState("");
  const [kodeOpen, setKodeOpen] = useState(false);
  const [kodeQuery, setKodeQuery] = useState("");
  const kodeComboRef = useRef<HTMLDivElement>(null);
  const paramsHandled = useRef(false);

  // Pilihan baris & ekspor
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [eksporOpen, setEksporOpen] = useState(false);
  const [jenisEkspor, setJenisEkspor] = useState<JenisEkspor>("isi-berkas-aktif");
  const [formatEkspor, setFormatEkspor] = useState<FormatEkspor>("pdf");
  const [mengekspor, setMengekspor] = useState(false);
  const pilihSemuaRef = useRef<HTMLInputElement>(null);

  // Folder aktif objek
  const folderAktif = useMemo(
    () => (folderAktifId ? data.folders.find((f) => f.id === folderAktifId) ?? null : null),
    [data.folders, folderAktifId],
  );

  // Kode arsip bisa dicari dengan mengetik kode atau nama.
  useEffect(() => {
    if (!kodeOpen) return;
    const tutupDiLuar = (event: MouseEvent) => {
      if (kodeComboRef.current?.contains(event.target as Node)) return;
      setKodeOpen(false);
      const terpilih = data.kodeArsip.find((item) => item.kode === form.kode);
      setKodeQuery(terpilih ? `${terpilih.kode} - ${terpilih.nama}` : "");
    };
    document.addEventListener("mousedown", tutupDiLuar);
    return () => document.removeEventListener("mousedown", tutupDiLuar);
  }, [kodeOpen, data.kodeArsip, form.kode]);

  // Hitung jumlah arsip per folder
  const jumlahArsipPerFolder = useMemo(() => {
    const counts = new Map<string, number>();
    data.arsip.forEach((item) => {
      counts.set(item.folder_id, (counts.get(item.folder_id) ?? 0) + 1);
    });
    return counts;
  }, [data.arsip]);

  // Daftar tahun dan pengguna untuk opsi filter
  const daftarTahun = useMemo(
    () => Array.from(new Set(data.arsip.map((arsip) => arsip.tanggal_arsip.slice(0, 4)))).sort().reverse(),
    [data.arsip],
  );

  const daftarPengguna = useMemo(
    () => Array.from(new Set(data.arsip.map((arsip) => arsip.pembuat))).sort(),
    [data.arsip],
  );

  // Kumpulan arsip berdasarkan konteks (folder aktif atau semua)
  const arsipTergolong = useMemo(() => {
    if (folderAktifId) {
      return data.arsip.filter((item) => item.folder_id === folderAktifId);
    }
    return data.arsip;
  }, [data.arsip, folderAktifId]);

  // Filter arsip
  const filtered = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return arsipTergolong
      .filter((arsip) => {
        const cocokCari =
          !kata ||
          `${arsip.nomor_arsip} ${arsip.judul} ${arsip.kode} ${arsip.pembuat}`.toLowerCase().includes(kata);
        const cocokTahun = !tahun || arsip.tanggal_arsip.startsWith(tahun);
        const cocokBulan = !bulan || arsip.tanggal_arsip.slice(5, 7) === bulan;
        const cocokStatus = !status || arsip.status_retensi === status;
        const cocokKode = !kode || arsip.kode === kode;
        const cocokPengguna = !pengguna || arsip.pembuat === pengguna;

        let cocokTanggal = true;
        if (modeTanggal === "satu" && tanggal1) {
          cocokTanggal = arsip.tanggal_arsip === tanggal1;
        } else if (modeTanggal === "rentang") {
          if (tanggal1) cocokTanggal = cocokTanggal && arsip.tanggal_arsip >= tanggal1;
          if (tanggal2) cocokTanggal = cocokTanggal && arsip.tanggal_arsip <= tanggal2;
        }

        return cocokCari && cocokTahun && cocokBulan && cocokStatus && cocokKode && cocokPengguna && cocokTanggal;
      })
      .sort((a, b) => b.tanggal_arsip.localeCompare(a.tanggal_arsip));
  }, [arsipTergolong, bulan, cari, kode, modeTanggal, pengguna, status, tahun, tanggal1, tanggal2]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const halaman = Math.min(page, totalPages);
  const paged = filtered.slice((halaman - 1) * PAGE_SIZE, halaman * PAGE_SIZE);
  const awal = filtered.length === 0 ? 0 : (halaman - 1) * PAGE_SIZE + 1;
  const akhir = Math.min(halaman * PAGE_SIZE, filtered.length);

  const idHalaman = paged.map((arsip) => arsip.id);
  const semuaHalamanTerpilih = idHalaman.length > 0 && idHalaman.every((id) => selectedIds.has(id));
  const sebagianHalamanTerpilih = !semuaHalamanTerpilih && idHalaman.some((id) => selectedIds.has(id));
  const jumlahEkspor = selectedIds.size > 0 ? selectedIds.size : filtered.length;

  useEffect(() => {
    if (pilihSemuaRef.current) {
      pilihSemuaRef.current.indeterminate = sebagianHalamanTerpilih;
    }
  }, [sebagianHalamanTerpilih]);

  const togglePilih = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePilihHalaman = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (semuaHalamanTerpilih) {
        idHalaman.forEach((id) => next.delete(id));
      } else {
        idHalaman.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const detail = detailId ? (data.arsip.find((arsip) => arsip.id === detailId) ?? null) : null;
  const detailFolder = detail ? data.folders.find((f) => f.id === detail.folder_id) : null;
  const kodeTerpilih = data.kodeArsip.find((item) => item.kode === form.kode) ?? null;

  // Daftar kode yang cocok dengan kata kunci (kode atau nama).
  const kodeTersaring = useMemo(() => {
    const kata = kodeQuery.trim().toLowerCase();
    const labelTerpilih = kodeTerpilih ? `${kodeTerpilih.kode} - ${kodeTerpilih.nama}` : "";
    if (!kata || kodeQuery === labelTerpilih) return data.kodeArsip;
    return data.kodeArsip.filter(
      (item) =>
        item.kode.toLowerCase().includes(kata) || item.nama.toLowerCase().includes(kata),
    );
  }, [kodeQuery, data.kodeArsip, kodeTerpilih]);

  const pilihKode = (item: (typeof data.kodeArsip)[number]) => {
    setForm((current) => ({ ...current, kode: item.kode }));
    setKodeQuery(`${item.kode} - ${item.nama}`);
    setKodeOpen(false);
  };

  // --- AKSI FOLDER ---
  const bukaTambahFolder = () => {
    setEditingFolder(null);
    setFolderForm({ nama: "", keterangan: "" });
    setFolderFormError("");
    setFolderModalOpen(true);
  };

  const bukaUbahFolder = (f: Folder) => {
    setEditingFolder(f);
    setFolderForm({ nama: f.nama, keterangan: f.keterangan ?? "" });
    setFolderFormError("");
    setFolderModalOpen(true);
  };

  const simpanFolder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: FolderInput = {
      nama: folderForm.nama.trim(),
      keterangan: folderForm.keterangan.trim() || undefined,
    };
    setMenyimpanFolder(true);
    try {
      const hasil = await saveFolder(input, editingFolder?.id);
      if (!hasil.ok) {
        setFolderFormError(hasil.message ?? "Gagal menyimpan folder.");
        return;
      }
      toast(hasil.message ?? "Folder disimpan.");
      setFolderModalOpen(false);
    } finally {
      setMenyimpanFolder(false);
    }
  };

  const konfirmasiHapusFolder = async () => {
    if (!hapusFolder) return;
    setMenghapusFolder(true);
    try {
      const hasil = await deleteFolder(hapusFolder.id);
      toast(hasil.message ?? (hasil.ok ? "Folder dihapus." : "Gagal menghapus folder."), hasil.ok ? "success" : "error");
      if (hasil.ok) {
        if (folderAktifId === hapusFolder.id) {
          setFolderAktifId(null);
        }
        setHapusFolder(null);
      }
    } finally {
      setMenghapusFolder(false);
    }
  };

  const bukaFolder = (id: string) => {
    setFolderAktifId(id);
    setTampilanSemua(false);
    setPage(1);
  };

  const kembaliKeSemuaFolder = () => {
    setFolderAktifId(null);
    setTampilanSemua(false);
    setPage(1);
  };

  // --- AKSI ARSIP ---
  const bukaTambah = () => {
    if (!canManage || data.kodeArsip.length === 0) return;
    if (data.folders.length === 0) {
      toast("Buat folder terlebih dahulu sebelum menambahkan arsip.", "info");
      bukaTambahFolder();
      return;
    }
    const tanggal = today();
    const targetFolderId = folderAktifId ?? data.folders[0]?.id ?? "";
    const kodeAwal = data.kodeArsip[0];
    setEditing(null);
    setForm({
      nomor_arsip: nextNomorArsip(tanggal),
      judul: "",
      kode: kodeAwal?.kode ?? "",
      folder_id: targetFolderId,
      tanggal_arsip: tanggal,
      keterangan: "",
      ...DETAIL_KOSONG,
      file_name: "",
      file_type: "",
    });
    setKodeOpen(false);
    setKodeQuery(kodeAwal ? `${kodeAwal.kode} - ${kodeAwal.nama}` : "");
    setFormError("");
    setFormOpen(true);
  };

  // Menangani URL params (?baru=1, ?detail=..., ?folder=...)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!ready || paramsHandled.current) return;
    paramsHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    const detailParam = params.get("detail");
    const cariParam = params.get("cari");
    const folderParam = params.get("folder");

    if (cariParam) setCari(cariParam);

    if (folderParam && data.folders.some((f) => f.id === folderParam)) {
      setFolderAktifId(folderParam);
    }

    if (detailParam) {
      const targetArsip = data.arsip.find((item) => item.id === detailParam);
      if (targetArsip) {
        setFolderAktifId(targetArsip.folder_id);
        setDetailId(detailParam);
      }
    }

    if (params.get("baru") === "1") {
      bukaTambah();
    }

    if (params.toString()) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const bukaUbah = (arsip: Arsip) => {
    setEditing(arsip);
    const kodeArsip = data.kodeArsip.find((item) => item.kode === arsip.kode);
    setKodeOpen(false);
    setKodeQuery(kodeArsip ? `${kodeArsip.kode} - ${kodeArsip.nama}` : "");
    setForm({
      nomor_arsip: arsip.nomor_arsip,
      judul: arsip.judul,
      kode: arsip.kode,
      folder_id: arsip.folder_id,
      tanggal_arsip: arsip.tanggal_arsip,
      keterangan: arsip.keterangan ?? "",
      nomor_berkas: arsip.nomor_berkas ?? "",
      nomor_item: arsip.nomor_item ?? "",
      indeks: arsip.indeks ?? "",
      jumlah_folder: arsip.jumlah_folder?.toString() ?? "",
      tingkat_perkembangan: arsip.tingkat_perkembangan ?? "",
      jumlah_halaman: arsip.jumlah_halaman?.toString() ?? "",
      sifat_arsip: arsip.sifat_arsip ?? "",
      lokasi_cabinet: arsip.lokasi_cabinet ?? "",
      lokasi_laci: arsip.lokasi_laci ?? "",
      lokasi_folder: arsip.lokasi_folder ?? "",
      kurun_waktu: arsip.kurun_waktu ?? "",
      nomor_boks: arsip.nomor_boks ?? "",
      file_name: arsip.file_name ?? "",
      file_size: arsip.file_size,
      file_type: arsip.file_type ?? "",
    });
    setFormError("");
    setDetailId(null);
    setFormOpen(true);
  };

  const simpan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.kode) {
      setFormError("Kode arsip wajib dipilih.");
      return;
    }
    const input: ArsipInput = {
      nomor_arsip: form.nomor_arsip,
      judul: form.judul,
      kode: form.kode,
      folder_id: form.folder_id,
      tanggal_arsip: form.tanggal_arsip,
      keterangan: form.keterangan,
      nomor_berkas: form.nomor_berkas,
      nomor_item: form.nomor_item,
      indeks: form.indeks,
      jumlah_folder: angkaDariTeks(form.jumlah_folder),
      tingkat_perkembangan: form.tingkat_perkembangan,
      jumlah_halaman: angkaDariTeks(form.jumlah_halaman),
      sifat_arsip: form.sifat_arsip,
      lokasi_cabinet: form.lokasi_cabinet,
      lokasi_laci: form.lokasi_laci,
      lokasi_folder: form.lokasi_folder,
      kurun_waktu: form.kurun_waktu,
      nomor_boks: form.nomor_boks,
      file_name: form.file_name || undefined,
      file_size: form.file_size,
      file_type: form.file_type || undefined,
    };
    setMenyimpanArsip(true);
    try {
      const hasil = await saveArsip(input, editing?.id);
      if (!hasil.ok) {
        setFormError(hasil.message ?? "Gagal menyimpan arsip.");
        return;
      }
      toast(hasil.message ?? "Arsip disimpan.");
      setFormOpen(false);
    } finally {
      setMenyimpanArsip(false);
    }
  };

  const unduh = async (arsip: Arsip) => {
    if (!arsip.file_path) {
      toast("Berkas untuk arsip ini belum diunggah.", "info");
      return;
    }
    const hasil = await ambilUrlUnduhAksi(arsip.file_path);
    if (!hasil.ok || !hasil.url) {
      toast(hasil.message ?? "Gagal menyiapkan unduhan.", "error");
      return;
    }
    window.open(hasil.url, "_blank", "noopener,noreferrer");
    await catatLog("Mengunduh arsip", `${arsip.nomor_arsip} - ${arsip.judul}`, "ekspor");
    toast("Unduhan disiapkan.");
  };

  const unduhEkspor = async () => {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : filtered.map((arsip) => arsip.id);
    if (ids.length === 0) {
      toast("Tidak ada data untuk diekspor.", "info");
      return;
    }

    setMengekspor(true);
    try {
      const res = await fetch("/api/ekspor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenis: jenisEkspor, format: formatEkspor, ids }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Gagal mengekspor data.");
      }

      const blob = await res.blob();
      const nama = namaBerkasUnduhan(res.headers.get("Content-Disposition")) ?? `ekspor.${formatEkspor}`;
      const url = URL.createObjectURL(blob);
      const tautan = document.createElement("a");
      tautan.href = url;
      tautan.download = nama;
      document.body.appendChild(tautan);
      tautan.click();
      tautan.remove();
      URL.revokeObjectURL(url);
      toast(`Ekspor ${formatEkspor.toUpperCase()} berhasil diunduh.`);
      setEksporOpen(false);
      await refreshData();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengekspor data.", "error");
    } finally {
      setMengekspor(false);
    }
  };

  const konfirmasiHapus = async () => {
    if (!hapus) return;
    setMenghapusArsip(true);
    try {
      const hasil = await deleteArsip(hapus.id);
      toast(hasil.message ?? (hasil.ok ? "Arsip dihapus." : "Gagal menghapus arsip."), hasil.ok ? "success" : "error");
      if (hasil.ok) {
        setSelectedIds((current) => {
          const next = new Set(current);
          next.delete(hapus.id);
          return next;
        });
        setHapus(null);
        setDetailId(null);
      }
    } finally {
      setMenghapusArsip(false);
    }
  };

  const resetFilter = () => {
    setCari("");
    setTahun("");
    setBulan("");
    setStatus("");
    setKode("");
    setPengguna("");
    setModeTanggal("");
    setTanggal1("");
    setTanggal2("");
    setSelectedIds(new Set());
    setPage(1);
    toast("Filter arsip dibersihkan.", "info");
  };

  const aktifFilter = Boolean(cari || tahun || bulan || status || kode || pengguna || modeTanggal);

  const riwayatDetail = useMemo(() => {
    if (!detail) return [];
    return data.logs
      .filter((log) => log.target.includes(detail.nomor_arsip) || log.target.includes(detail.judul))
      .sort((a, b) => b.waktu.localeCompare(a.waktu));
  }, [data.logs, detail]);

  const retensiDetail = useMemo(() => {
    if (!detail) return null;
    const kodeData = data.kodeArsip.find((item) => item.kode === detail.kode);
    if (!kodeData) return null;
    return hitungRetensi(
      new Date(`${detail.tanggal_arsip}T00:00:00`),
      kodeData.retensi_aktif_thn,
      kodeData.retensi_inaktif_thn,
    );
  }, [data.kodeArsip, detail]);

  // Menentukan apakah berada di tampilan daftar folder utama
  const beradaDiDaftarFolder = !folderAktifId && !tampilanSemua;

  return (
    <>
      {beradaDiDaftarFolder ? (
        // ================= TAMPILAN 1: FOLDER-FIRST (DAFTAR FOLDER) =================
        <div className="card">
          <div className="section-head">
            <div>
              <h2 className="h2">Folder Arsip</h2>
              <p className="sub">
                Kelola arsip per folder kerja. Buka salah satu folder untuk melihat atau menambahkan arsip di dalamnya.
              </p>
            </div>
            <div className="actions-row">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setTampilanSemua(true);
                  setPage(1);
                }}
              >
                <Icon name="archive" size={15} /> Lihat Semua Arsip ({data.arsip.length})
              </button>
              {canManage ? (
                <button type="button" className="btn" onClick={bukaTambahFolder}>
                  <Icon name="plus" size={16} /> Buat Folder
                </button>
              ) : null}
            </div>
          </div>

          {!canManage ? (
            <div className="form-note" style={{ marginBottom: 14 }}>
              Anda masuk sebagai Pimpinan. Folder dan arsip dapat dilihat serta diunduh, tetapi perubahan data hanya untuk
              Admin dan Operator.
            </div>
          ) : null}

          {data.folders.length === 0 ? (
            <div className="empty" style={{ padding: "48px 16px", marginTop: 16 }}>
              <p style={{ margin: "0 0 12px 0", fontSize: 14 }}>Belum ada folder arsip.</p>
              {canManage ? (
                <button type="button" className="btn" onClick={bukaTambahFolder}>
                  <Icon name="plus" size={16} /> Buat Folder Pertama
                </button>
              ) : null}
            </div>
          ) : (
            <div className="folder-grid">
              {data.folders.map((folder) => {
                const count = jumlahArsipPerFolder.get(folder.id) ?? 0;
                return (
                  <div
                    key={folder.id}
                    className="folder-card"
                    onClick={() => bukaFolder(folder.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") bukaFolder(folder.id);
                    }}
                  >
                    <div className="folder-card-head">
                      <div className="folder-card-icon">
                        <Icon name="folder" size={24} />
                      </div>
                      {canManage ? (
                        <div className="row-menu" onClick={(e) => e.stopPropagation()}>
                          <details>
                            <summary aria-label={`Menu folder ${folder.nama}`}>
                              <Icon name="dots" size={16} />
                            </summary>
                            <div className="row-menu-panel">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.currentTarget.closest("details")?.removeAttribute("open");
                                  bukaFolder(folder.id);
                                }}
                              >
                                <Icon name="folder" size={14} /> Buka folder
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.currentTarget.closest("details")?.removeAttribute("open");
                                  bukaUbahFolder(folder);
                                }}
                              >
                                <Icon name="edit" size={14} /> Ubah nama
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={(e) => {
                                  e.currentTarget.closest("details")?.removeAttribute("open");
                                  setHapusFolder(folder);
                                }}
                              >
                                <Icon name="trash" size={14} /> Hapus
                              </button>
                            </div>
                          </details>
                        </div>
                      ) : null}
                    </div>

                    <div className="folder-card-body">
                      <div className="folder-card-title">{folder.nama}</div>
                      <p className="folder-card-desc">{folder.keterangan || "Tidak ada keterangan."}</p>
                    </div>

                    <div className="folder-card-foot">
                      <span className="badge badge-accent">
                        {count} {count === 1 ? "arsip" : "arsip"}
                      </span>
                      <span>{formatTanggal(folder.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // ================= TAMPILAN 2: DALAM FOLDER ATAU SEMUA ARSIP =================
        <div className="card">
          <div className="folder-breadcrumb">
            <button type="button" className="folder-breadcrumb-btn" onClick={kembaliKeSemuaFolder}>
              <Icon name="chevron" size={14} style={{ transform: "rotate(180deg)" }} /> Folder Arsip
            </button>
            <span>/</span>
            <strong>{folderAktif ? folderAktif.nama : "Semua Arsip"}</strong>
          </div>

          <div className="section-head">
            <div>
              <h2 className="h2">{folderAktif ? folderAktif.nama : "Semua Arsip Digital"}</h2>
              <p className="sub">
                {folderAktif
                  ? folderAktif.keterangan || `Daftar arsip yang tersimpan dalam folder ${folderAktif.nama}.`
                  : "Daftar seluruh arsip yang ada di semua folder."}
              </p>
            </div>
            <div className="actions-row">
              {canManage ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEksporOpen(true)}
                  disabled={filtered.length === 0}
                >
                  <Icon name="download" size={15} /> Ekspor
                </button>
              ) : null}
              {aktifFilter ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilter}>
                  Reset filter
                </button>
              ) : null}
              {folderAktif && canManage ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => bukaUbahFolder(folderAktif)}
                >
                  <Icon name="edit" size={15} /> Ubah Folder
                </button>
              ) : null}
              <button
                type="button"
                className="btn"
                onClick={bukaTambah}
                disabled={!canManage || data.kodeArsip.length === 0}
                title={
                  !canManage
                    ? "Pimpinan hanya dapat melihat"
                    : data.kodeArsip.length === 0
                      ? "Tambahkan kode arsip dahulu"
                      : ""
                }
              >
                <Icon name="plus" size={16} /> Tambah Arsip
              </button>
            </div>
          </div>

          <div className="toolbar">
            <input
              className="input input-search"
              placeholder="Cari nomor, judul, kode, atau pembuat..."
              value={cari}
              onChange={(event) => {
                setCari(event.target.value);
                setPage(1);
              }}
            />
            <select
              className="select"
              value={tahun}
              onChange={(event) => {
                setTahun(event.target.value);
                setPage(1);
              }}
              aria-label="Filter tahun arsip"
            >
              <option value="">Semua tahun</option>
              {daftarTahun.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={bulan}
              onChange={(event) => {
                setBulan(event.target.value);
                setPage(1);
              }}
              aria-label="Filter bulan arsip"
            >
              <option value="">Semua bulan</option>
              {BULAN.map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Filter status retensi"
            >
              <option value="">Semua status</option>
              <option value="Aktif">Aktif</option>
              <option value="Inaktif">Inaktif</option>
              <option value="Permanen">Permanen</option>
            </select>
            <details className="filter-dropdown">
              <summary className="filter-dropdown-trigger" aria-label="Filter kode arsip">
                <span className="filter-dropdown-value">{kode || "Semua kode"}</span>
                <Icon name="chevron" size={14} className="filter-dropdown-caret" />
              </summary>
              <div className="row-menu-panel filter-dropdown-panel">
                <button
                  type="button"
                  className={!kode ? "active" : undefined}
                  onClick={(event) => {
                    event.currentTarget.closest("details")?.removeAttribute("open");
                    setKode("");
                    setPage(1);
                  }}
                >
                  <span className="filter-dropdown-option">
                    <strong>Semua kode</strong>
                  </span>
                </button>
                {data.kodeArsip.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={kode === item.kode ? "active" : undefined}
                    onClick={(event) => {
                      event.currentTarget.closest("details")?.removeAttribute("open");
                      setKode(item.kode);
                      setPage(1);
                    }}
                  >
                    <span className="filter-dropdown-option">
                      <strong className="mono">{item.kode}</strong>
                      <span>{item.nama}</span>
                    </span>
                    {kode === item.kode ? <Icon name="check" size={14} /> : null}
                  </button>
                ))}
              </div>
            </details>
            <select
              className="select"
              value={pengguna}
              onChange={(event) => {
                setPengguna(event.target.value);
                setPage(1);
              }}
              aria-label="Filter pengguna penambah"
            >
              <option value="">Semua pengguna</option>
              {daftarPengguna.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="chips">
            {tahun ? (
              <span className="chip">
                Tahun: <strong>{tahun}</strong>
                <button type="button" onClick={() => setTahun("")} aria-label="Hapus filter tahun">
                  &times;
                </button>
              </span>
            ) : null}
            {bulan ? (
              <span className="chip">
                Bulan: <strong>{BULAN.find(([value]) => value === bulan)?.[1]}</strong>
                <button type="button" onClick={() => setBulan("")} aria-label="Hapus filter bulan">
                  &times;
                </button>
              </span>
            ) : null}
            {modeTanggal ? (
              <span className="chip">
                {modeTanggal === "satu" ? "Tanggal" : "Rentang"}:{" "}
                <strong>
                  {tanggal1 || "-"}
                  {modeTanggal === "rentang" ? ` s.d. ${tanggal2 || "-"}` : ""}
                </strong>
                <button
                  type="button"
                  onClick={() => {
                    setModeTanggal("");
                    setTanggal1("");
                    setTanggal2("");
                  }}
                  aria-label="Hapus filter tanggal"
                >
                  &times;
                </button>
              </span>
            ) : null}
            {status ? (
              <span className="chip">
                Status: <strong>{status}</strong>
                <button type="button" onClick={() => setStatus("")} aria-label="Hapus filter status">
                  &times;
                </button>
              </span>
            ) : null}
            {kode ? (
              <span className="chip">
                Kode: <strong>{kode}</strong>
                <button type="button" onClick={() => setKode("")} aria-label="Hapus filter kode">
                  &times;
                </button>
              </span>
            ) : null}
            {pengguna ? (
              <span className="chip">
                Pengguna: <strong>{pengguna}</strong>
                <button type="button" onClick={() => setPengguna("")} aria-label="Hapus filter pengguna">
                  &times;
                </button>
              </span>
            ) : null}
            {cari ? (
              <span className="chip">
                Pencarian: <strong>{cari}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setCari("");
                    setPage(1);
                  }}
                  aria-label="Hapus pencarian"
                >
                  &times;
                </button>
              </span>
            ) : null}
            <span className="chip">
              Total: <strong>{filtered.length} arsip</strong>
            </span>
            {selectedIds.size > 0 ? (
              <span className="chip chip-accent">
                Dipilih: <strong>{selectedIds.size}</strong>
                <button type="button" onClick={() => setSelectedIds(new Set())} aria-label="Bersihkan pilihan">
                  &times;
                </button>
              </span>
            ) : null}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {canManage ? (
                    <th style={{ width: 38 }}>
                      <input
                        ref={pilihSemuaRef}
                        type="checkbox"
                        className="checkbox"
                        checked={semuaHalamanTerpilih}
                        onChange={togglePilihHalaman}
                        aria-label="Pilih semua arsip di halaman ini"
                      />
                    </th>
                  ) : null}
                  <th>Uraian Informasi Arsip</th>
                  <th>Kode</th>
                  {!folderAktif ? <th>Folder</th> : null}
                  <th>Ditambahkan Oleh</th>
                  <th>Disimpan Sampai</th>
                  <th style={{ width: 56 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {!ready
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <tr key={`skeleton-${index}`}>
                        {canManage ? (
                          <td>
                            <div className="skeleton skeleton-circle" />
                          </td>
                        ) : null}
                        <td>
                          <div className="skeleton skeleton-text" style={{ width: "78%" }} />
                          <div className="skeleton skeleton-text" style={{ width: "38%", marginBottom: 0 }} />
                        </td>
                        <td>
                          <div className="skeleton skeleton-text" style={{ width: 56, marginBottom: 0 }} />
                        </td>
                        {!folderAktif ? (
                          <td>
                            <div className="skeleton skeleton-text" style={{ width: 90, marginBottom: 0 }} />
                          </td>
                        ) : null}
                        <td>
                          <div className="skeleton skeleton-text" style={{ width: 120, marginBottom: 0 }} />
                        </td>
                        <td>
                          <div className="skeleton skeleton-text" style={{ width: 90, marginBottom: 0 }} />
                        </td>
                        <td>
                          <div className="skeleton skeleton-circle" />
                        </td>
                      </tr>
                    ))
                  : paged.map((arsip) => {
                      const fItem = data.folders.find((f) => f.id === arsip.folder_id);
                      return (
                        <tr key={arsip.id} className="row-click" onClick={() => setDetailId(arsip.id)}>
                          {canManage ? (
                            <td onClick={(event) => event.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="checkbox"
                                checked={selectedIds.has(arsip.id)}
                                onChange={() => togglePilih(arsip.id)}
                                aria-label={`Pilih arsip ${arsip.nomor_arsip}`}
                              />
                            </td>
                          ) : null}
                          <td>
                            <div className="cell-title">{arsip.judul}</div>
                            <div className="cell-sub mono">{arsip.nomor_arsip}</div>
                          </td>
                          <td>
                            <span className="badge badge-muted">{arsip.kode}</span>
                          </td>
                          {!folderAktif ? (
                            <td>
                              <span className="badge badge-accent">{fItem?.nama ?? "-"}</span>
                            </td>
                          ) : null}
                          <td>
                            <div className="user-cell">
                              <span className="avatar avatar-xs">{inisial(arsip.pembuat)}</span>
                              <div>
                                <div className="cell-title small">{arsip.pembuat}</div>
                                <div className="cell-sub">{formatTanggal(arsip.created_at ?? arsip.tanggal_arsip)}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={arsip.status_retensi} />
                            <div className="cell-sub">{formatTanggal(arsip.akhir_retensi)}</div>
                          </td>
                          <td onClick={(event) => event.stopPropagation()}>
                            <details className="row-menu">
                              <summary aria-label={`Aksi untuk ${arsip.nomor_arsip}`}>
                                <Icon name="dots" size={18} />
                              </summary>
                              <div className="row-menu-panel">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.currentTarget.closest("details")?.removeAttribute("open");
                                    setDetailId(arsip.id);
                                  }}
                                >
                                  <Icon name="file" size={15} /> Lihat detail
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.currentTarget.closest("details")?.removeAttribute("open");
                                    unduh(arsip);
                                  }}
                                >
                                  <Icon name="download" size={15} /> Unduh
                                </button>
                                {canManage ? (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.currentTarget.closest("details")?.removeAttribute("open");
                                      bukaUbah(arsip);
                                    }}
                                  >
                                    <Icon name="edit" size={15} /> Ubah
                                  </button>
                                ) : null}
                                {canManage ? (
                                  <button
                                    type="button"
                                    className="danger"
                                    onClick={(event) => {
                                      event.currentTarget.closest("details")?.removeAttribute("open");
                                      setHapus(arsip);
                                    }}
                                  >
                                    <Icon name="trash" size={15} /> Hapus
                                  </button>
                                ) : null}
                              </div>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                {ready && paged.length === 0 ? (
                  <tr>
                    <td colSpan={(folderAktif ? 5 : 6) + (canManage ? 1 : 0)}>
                      <div className="empty" style={{ padding: "32px 16px" }}>
                        <p style={{ margin: "0 0 10px 0" }}>
                          {folderAktif
                            ? "Folder ini belum memiliki arsip."
                            : "Tidak ada arsip yang cocok dengan filter."}
                        </p>
                        {folderAktif && canManage ? (
                          <button type="button" className="btn btn-sm" onClick={bukaTambah}>
                            <Icon name="plus" size={14} /> Tambah Arsip Sekarang
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="table-foot">
            <span>
              Menampilkan {awal}-{akhir} dari {filtered.length} arsip
            </span>
            <div className="pager">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={halaman <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Sebelumnya
              </button>
              <span className="chip">
                Halaman <strong>{halaman}</strong> / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={halaman >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER DETAIL ARSIP */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title="Detail Arsip"
        subtitle={detail?.nomor_arsip}
        footer={
          detail ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setDetailId(null)}>
                Tutup
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => unduh(detail)}>
                <Icon name="download" size={15} /> Unduh
              </button>
              {canManage ? (
                <>
                  <button type="button" className="btn btn-danger" onClick={() => setHapus(detail)}>
                    Hapus
                  </button>
                  <button type="button" className="btn" onClick={() => bukaUbah(detail)}>
                    Ubah
                  </button>
                </>
              ) : null}
            </>
          ) : null
        }
      >
        {detail ? (
          <>
            <div className="preview">
              <span className="preview-icon">
                <Icon name="file" size={26} />
              </span>
              <strong>{detail.file_name ?? "Belum ada berkas"}</strong>
              <small>
                {detail.file_name
                  ? `${detail.file_type || "Berkas"} - ${formatBytes(detail.file_size)}`
                  : "Berkas belum diunggah"}
              </small>
            </div>

            <div className="meta-grid">
              <div className="meta-item">
                <span>Folder</span>
                <strong>{detailFolder?.nama ?? "-"}</strong>
              </div>
              <div className="meta-item">
                <span>Kode arsip</span>
                <strong className="mono">{detail.kode}</strong>
              </div>
              <div className="meta-item">
                <span>Tanggal arsip</span>
                <strong>{formatTanggal(detail.tanggal_arsip)}</strong>
              </div>
              <div className="meta-item">
                <span>Status retensi</span>
                <strong>
                  <StatusBadge status={detail.status_retensi} />
                </strong>
              </div>
              <div className="meta-item">
                <span>Akhir aktif</span>
                <strong>{retensiDetail ? formatTanggal(retensiDetail.akhirAktif.toISOString()) : "-"}</strong>
              </div>
              <div className="meta-item">
                <span>Akhir retensi</span>
                <strong>{formatTanggal(detail.akhir_retensi)}</strong>
              </div>
              <div className="meta-item">
                <span>Ditambahkan oleh</span>
                <strong>{detail.pembuat}</strong>
              </div>
            </div>

            <p className="sub" style={{ marginTop: 10 }}>
              Ditambahkan oleh <strong>{detail.pembuat}</strong> pada{" "}
              {formatWaktu(detail.created_at ?? detail.tanggal_arsip)}.
            </p>

            {detail.keterangan ? (
              <div className="drawer-section">
                <div className="drawer-section-title">Keterangan</div>
                <p className="sub" style={{ marginTop: 0 }}>
                  {detail.keterangan}
                </p>
              </div>
            ) : null}

            {detail.nomor_berkas ||
            detail.nomor_item ||
            detail.indeks ||
            detail.jumlah_folder ||
            detail.tingkat_perkembangan ||
            detail.jumlah_halaman ||
            detail.sifat_arsip ||
            detail.lokasi_cabinet ||
            detail.lokasi_laci ||
            detail.lokasi_folder ||
            detail.kurun_waktu ||
            detail.nomor_boks ? (
              <div className="drawer-section">
                <div className="drawer-section-title">Detail Berkas & Lokasi</div>
                <div className="meta-grid" style={{ marginTop: 0 }}>
                  {detail.nomor_berkas ? (
                    <div className="meta-item">
                      <span>Nomor berkas</span>
                      <strong>{detail.nomor_berkas}</strong>
                    </div>
                  ) : null}
                  {detail.nomor_item ? (
                    <div className="meta-item">
                      <span>No. item arsip</span>
                      <strong>{detail.nomor_item}</strong>
                    </div>
                  ) : null}
                  {detail.indeks ? (
                    <div className="meta-item">
                      <span>Indeks berkas</span>
                      <strong>{detail.indeks}</strong>
                    </div>
                  ) : null}
                  {detail.jumlah_folder ? (
                    <div className="meta-item">
                      <span>Jumlah folder</span>
                      <strong>{detail.jumlah_folder}</strong>
                    </div>
                  ) : null}
                  {detail.tingkat_perkembangan ? (
                    <div className="meta-item">
                      <span>Tingkat perkembangan</span>
                      <strong>{detail.tingkat_perkembangan}</strong>
                    </div>
                  ) : null}
                  {detail.jumlah_halaman ? (
                    <div className="meta-item">
                      <span>Jumlah halaman</span>
                      <strong>{detail.jumlah_halaman}</strong>
                    </div>
                  ) : null}
                  {detail.sifat_arsip ? (
                    <div className="meta-item">
                      <span>Sifat arsip</span>
                      <strong>{detail.sifat_arsip}</strong>
                    </div>
                  ) : null}
                  {detail.kurun_waktu ? (
                    <div className="meta-item">
                      <span>Kurun waktu</span>
                      <strong>{detail.kurun_waktu}</strong>
                    </div>
                  ) : null}
                  {detail.lokasi_cabinet || detail.lokasi_laci || detail.lokasi_folder ? (
                    <div className="meta-item">
                      <span>Lokasi</span>
                      <strong>
                        {[detail.lokasi_cabinet, detail.lokasi_laci, detail.lokasi_folder].filter(Boolean).join(" / ")}
                      </strong>
                    </div>
                  ) : null}
                  {detail.nomor_boks ? (
                    <div className="meta-item">
                      <span>Nomor boks</span>
                      <strong>{detail.nomor_boks}</strong>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="drawer-section">
              <div className="drawer-section-title">Riwayat Perubahan</div>
              {riwayatDetail.length ? (
                <ul className="timeline">
                  {riwayatDetail.map((log) => (
                    <li key={log.id}>
                      <span className={`tl-icon ${log.jenis === "hapus" ? "danger" : log.jenis === "ubah" ? "warn" : ""}`}>
                        {log.jenis.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="tl-body">
                        <div className="tl-title">{log.aksi}</div>
                        <div className="tl-meta">
                          {log.user} - {formatWaktu(log.waktu)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty">Belum ada riwayat perubahan untuk arsip ini.</div>
              )}
            </div>
          </>
        ) : null}
      </Drawer>

      {/* MODAL BUAT / UBAH FOLDER */}
      <Modal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        title={editingFolder ? "Ubah Folder" : "Buat Folder Baru"}
        subtitle="Folder memudahkan pengelompokan arsip berdasarkan unit kerja atau kategori dokumen."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFolderModalOpen(false)}>
              Batal
            </button>
            <TombolMemuat
              type="submit"
              form="form-folder"
              className="btn"
              loading={menyimpanFolder}
              loadingText="Menyimpan..."
            >
              {editingFolder ? "Simpan Perubahan" : "Buat Folder"}
            </TombolMemuat>
          </>
        }
      >
        <form id="form-folder" onSubmit={simpanFolder}>
          {folderFormError ? <div className="error-box">{folderFormError}</div> : null}
          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="nama-folder">Nama folder</label>
              <input
                id="nama-folder"
                className="input"
                value={folderForm.nama}
                onChange={(e) => setFolderForm({ ...folderForm, nama: e.target.value })}
                placeholder="Contoh: Keuangan & Anggaran"
                required
                autoFocus
              />
            </div>
            <div className="field field-full">
              <label htmlFor="keterangan-folder">Keterangan folder</label>
              <textarea
                id="keterangan-folder"
                className="input"
                value={folderForm.keterangan}
                onChange={(e) => setFolderForm({ ...folderForm, keterangan: e.target.value })}
                placeholder="Deskripsi singkat isi atau tujuan folder ini"
                rows={3}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL HAPUS FOLDER */}
      <Modal
        open={Boolean(hapusFolder)}
        onClose={() => setHapusFolder(null)}
        title="Hapus Folder"
        subtitle="Folder yang masih berisi arsip tidak dapat dihapus."
        width={460}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setHapusFolder(null)}>
              Batal
            </button>
            <TombolMemuat
              type="button"
              className="btn btn-danger"
              disabled={Boolean(hapusFolder && (jumlahArsipPerFolder.get(hapusFolder.id) ?? 0) > 0)}
              onClick={konfirmasiHapusFolder}
              loading={menghapusFolder}
              loadingText="Menghapus..."
            >
              Hapus Folder
            </TombolMemuat>
          </>
        }
      >
        {hapusFolder ? (
          <div>
            <p className="sub" style={{ margin: "0 0 10px 0" }}>
              Apakah Anda yakin ingin menghapus folder <strong>{hapusFolder.nama}</strong>?
            </p>
            {(jumlahArsipPerFolder.get(hapusFolder.id) ?? 0) > 0 ? (
              <div className="error-box" style={{ marginTop: 10 }}>
                Folder masih berisi {jumlahArsipPerFolder.get(hapusFolder.id)} arsip. Pindahkan atau hapus arsip di
                dalamnya terlebih dahulu sebelum menghapus folder.
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* MODAL TAMBAH / UBAH ARSIP */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Ubah Arsip" : "Tambah Arsip"}
        subtitle="Status dan akhir retensi dihitung otomatis dari kode arsip."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Batal
            </button>
            <TombolMemuat
              type="submit"
              form="form-arsip"
              className="btn"
              loading={menyimpanArsip}
              loadingText="Menyimpan..."
            >
              {editing ? "Simpan Perubahan" : "Simpan Arsip"}
            </TombolMemuat>
          </>
        }
      >
        <form id="form-arsip" onSubmit={simpan}>
          {formError ? <div className="error-box">{formError}</div> : null}
          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="folder-arsip">Folder arsip</label>
              <select
                id="folder-arsip"
                className="select"
                value={form.folder_id}
                onChange={(event) => setForm({ ...form, folder_id: event.target.value })}
                required
              >
                <option value="">Pilih folder</option>
                {data.folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nama}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="nomor-arsip">Nomor arsip</label>
              <input
                id="nomor-arsip"
                className="input mono"
                value={form.nomor_arsip}
                onChange={(event) => setForm({ ...form, nomor_arsip: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="tanggal-arsip">Tanggal arsip</label>
              <input
                id="tanggal-arsip"
                type="date"
                className="input"
                value={form.tanggal_arsip}
                onChange={(event) => {
                  const nilai = event.target.value;
                  setForm({
                    ...form,
                    tanggal_arsip: nilai,
                    nomor_arsip: editing ? form.nomor_arsip : nextNomorArsip(nilai),
                  });
                }}
                required
              />
            </div>
            <div className="field field-full">
              <label htmlFor="judul-arsip">Uraian informasi arsip</label>
              <input
                id="judul-arsip"
                className="input"
                value={form.judul}
                onChange={(event) => setForm({ ...form, judul: event.target.value })}
                placeholder="Contoh: Laporan Realisasi Anggaran 2026"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="kode-arsip">Kode arsip</label>
              <div className="kode-combo" ref={kodeComboRef}>
                <input
                  id="kode-arsip"
                  type="text"
                  className="input kode-combo-input"
                  role="combobox"
                  aria-expanded={kodeOpen}
                  aria-controls="kode-arsip-opsi"
                  aria-autocomplete="list"
                  autoComplete="off"
                  placeholder="Ketik kode atau nama..."
                  value={kodeQuery}
                  onFocus={() => setKodeOpen(true)}
                  onChange={(event) => {
                    const nilai = event.target.value;
                    setKodeQuery(nilai);
                    setKodeOpen(true);
                    setForm((current) => {
                      if (!current.kode) return current;
                      const terpilih = data.kodeArsip.find((item) => item.kode === current.kode);
                      const label = terpilih ? `${terpilih.kode} - ${terpilih.nama}` : "";
                      return nilai === label ? current : { ...current, kode: "" };
                    });
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setKodeOpen(false);
                      return;
                    }
                    if (event.key === "Enter" && kodeOpen && kodeTersaring.length > 0) {
                      event.preventDefault();
                      pilihKode(kodeTersaring[0]);
                    }
                  }}
                />
                <Icon name="search" size={15} className="kode-combo-icon" />
                {kodeOpen ? (
                  <div
                    id="kode-arsip-opsi"
                    role="listbox"
                    className="row-menu-panel filter-dropdown-panel kode-combo-panel"
                  >
                    {kodeTersaring.length === 0 ? (
                      <p className="kode-combo-kosong">Kode tidak ditemukan.</p>
                    ) : (
                      kodeTersaring.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={form.kode === item.kode}
                          className={form.kode === item.kode ? "active" : undefined}
                          onClick={() => pilihKode(item)}
                        >
                          <span className="filter-dropdown-option">
                            <strong className="mono">{item.kode}</strong>
                            <span>{item.nama}</span>
                          </span>
                          {form.kode === item.kode ? <Icon name="check" size={14} /> : null}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="field">
              <label htmlFor="berkas-arsip">Berkas arsip</label>
              <input
                id="berkas-arsip"
                type="file"
                className="input"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    event.target.value = "";
                    toast("Ukuran berkas maksimal 10 MB.", "error");
                    return;
                  }
                  setForm({
                    ...form,
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type || file.name.split(".").pop() || "",
                  });
                }}
              />
              <span className="field-hint">
                {form.file_name
                  ? `${form.file_name} - ${formatBytes(form.file_size)}`
                  : "Opsional, maksimal 10 MB."}
              </span>
            </div>
            <div className="field field-full">
              <label htmlFor="keterangan-arsip">Keterangan</label>
              <textarea
                id="keterangan-arsip"
                className="input"
                value={form.keterangan}
                onChange={(event) => setForm({ ...form, keterangan: event.target.value })}
                placeholder="Catatan tambahan mengenai arsip"
              />
            </div>

            <details className="form-details field-full">
              <summary>Detail Berkas & Lokasi (opsional)</summary>
              <div className="form-grid" style={{ marginTop: 12 }}>
                <div className="field">
                  <label htmlFor="nomor-berkas">Nomor berkas</label>
                  <input
                    id="nomor-berkas"
                    className="input"
                    value={form.nomor_berkas}
                    onChange={(event) => setForm({ ...form, nomor_berkas: event.target.value })}
                    placeholder="Contoh: B-001/2026"
                  />
                </div>
                <div className="field">
                  <label htmlFor="nomor-item">No. item arsip</label>
                  <input
                    id="nomor-item"
                    className="input"
                    value={form.nomor_item}
                    onChange={(event) => setForm({ ...form, nomor_item: event.target.value })}
                    placeholder="Contoh: 1"
                  />
                </div>
                <div className="field field-full">
                  <label htmlFor="indeks-berkas">Indeks berkas</label>
                  <input
                    id="indeks-berkas"
                    className="input"
                    value={form.indeks}
                    onChange={(event) => setForm({ ...form, indeks: event.target.value })}
                    placeholder="Ringkasan isi berkas"
                  />
                </div>
                <div className="field">
                  <label htmlFor="jumlah-folder">Jumlah folder</label>
                  <input
                    id="jumlah-folder"
                    type="number"
                    min={0}
                    className="input"
                    value={form.jumlah_folder}
                    onChange={(event) => setForm({ ...form, jumlah_folder: event.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="field">
                  <label htmlFor="jumlah-halaman">Jumlah halaman</label>
                  <input
                    id="jumlah-halaman"
                    type="number"
                    min={0}
                    className="input"
                    value={form.jumlah_halaman}
                    onChange={(event) => setForm({ ...form, jumlah_halaman: event.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="field">
                  <label htmlFor="tingkat-perkembangan">Tingkat perkembangan</label>
                  <input
                    id="tingkat-perkembangan"
                    className="input"
                    value={form.tingkat_perkembangan}
                    onChange={(event) => setForm({ ...form, tingkat_perkembangan: event.target.value })}
                    placeholder="Asli / Salinan / Tembusan"
                  />
                </div>
                <div className="field">
                  <label htmlFor="sifat-arsip">Sifat arsip</label>
                  <input
                    id="sifat-arsip"
                    className="input"
                    value={form.sifat_arsip}
                    onChange={(event) => setForm({ ...form, sifat_arsip: event.target.value })}
                    placeholder="Biasa / Terbatas / Rahasia"
                  />
                </div>
                <div className="field">
                  <label htmlFor="lokasi-cabinet">No. filling cabinet</label>
                  <input
                    id="lokasi-cabinet"
                    className="input"
                    value={form.lokasi_cabinet}
                    onChange={(event) => setForm({ ...form, lokasi_cabinet: event.target.value })}
                    placeholder="Contoh: FC-01"
                  />
                </div>
                <div className="field">
                  <label htmlFor="lokasi-laci">No. laci</label>
                  <input
                    id="lokasi-laci"
                    className="input"
                    value={form.lokasi_laci}
                    onChange={(event) => setForm({ ...form, lokasi_laci: event.target.value })}
                    placeholder="Contoh: 2"
                  />
                </div>
                <div className="field">
                  <label htmlFor="lokasi-folder">No. folder</label>
                  <input
                    id="lokasi-folder"
                    className="input"
                    value={form.lokasi_folder}
                    onChange={(event) => setForm({ ...form, lokasi_folder: event.target.value })}
                    placeholder="Contoh: 12"
                  />
                </div>
                <div className="field">
                  <label htmlFor="kurun-waktu">Kurun waktu</label>
                  <input
                    id="kurun-waktu"
                    className="input"
                    value={form.kurun_waktu}
                    onChange={(event) => setForm({ ...form, kurun_waktu: event.target.value })}
                    placeholder="Contoh: 2024-2026"
                  />
                </div>
                <div className="field">
                  <label htmlFor="nomor-boks">Nomor boks</label>
                  <input
                    id="nomor-boks"
                    className="input"
                    value={form.nomor_boks}
                    onChange={(event) => setForm({ ...form, nomor_boks: event.target.value })}
                    placeholder="Contoh: 07"
                  />
                </div>
              </div>
            </details>
          </div>
          <div className="form-note">
            Berkas yang dipilih hanya dicatat metadatanya. Penyimpanan berkas asli menunggu integrasi storage.
          </div>
        </form>
      </Modal>

      {/* MODAL HAPUS ARSIP */}
      <Modal
        open={Boolean(hapus)}
        onClose={() => setHapus(null)}
        title="Hapus Arsip"
        subtitle="Tindakan ini juga menghapus arsip dari usulan penyusutan yang belum diputuskan."
        width={460}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setHapus(null)}>
              Batal
            </button>
            <TombolMemuat
              type="button"
              className="btn btn-danger"
              onClick={konfirmasiHapus}
              loading={menghapusArsip}
              loadingText="Menghapus..."
            >
              Hapus
            </TombolMemuat>
          </>
        }
      >
        <p className="sub">
          Hapus <strong>{hapus?.nomor_arsip}</strong> - {hapus?.judul}?
        </p>
      </Modal>

      {/* MODAL EKSPOR */}
      <Modal
        open={eksporOpen}
        onClose={() => setEksporOpen(false)}
        title="Ekspor Daftar Arsip"
        subtitle="Pilih jenis laporan dan format berkas. Data mengikuti arsip yang dipilih atau hasil filter saat ini."
        width={720}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEksporOpen(false)}>
              Batal
            </button>
            <TombolMemuat
              type="button"
              className="btn"
              onClick={unduhEkspor}
              loading={mengekspor}
              loadingText="Menyiapkan..."
              disabled={jumlahEkspor === 0}
            >
              <Icon name="download" size={15} /> Unduh
            </TombolMemuat>
          </>
        }
      >
        <div className="pilihan-grid">
          {PILIHAN_EKSPOR.map((pilihan) => (
            <label
              key={pilihan.value}
              className={`pilihan-card ${jenisEkspor === pilihan.value ? "aktif" : ""}`}
            >
              <input
                type="radio"
                name="jenis-ekspor"
                value={pilihan.value}
                checked={jenisEkspor === pilihan.value}
                onChange={() => setJenisEkspor(pilihan.value)}
              />
              <span className="pilihan-body">
                <strong>{pilihan.label}</strong>
                <span>{pilihan.deskripsi}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="ekspor-label">Format berkas</div>
        <div className="pilihan-format">
          {FORMAT_PILIHAN.map((format) => (
            <button
              key={format.value}
              type="button"
              className={`btn btn-sm ${formatEkspor === format.value ? "" : "btn-ghost"}`}
              onClick={() => setFormatEkspor(format.value)}
              aria-pressed={formatEkspor === format.value}
            >
              {format.label}
            </button>
          ))}
        </div>

        <div className={`ekspor-info ${jumlahEkspor === 0 ? "kosong" : ""}`}>
          {jumlahEkspor === 0
            ? "Tidak ada data untuk diekspor."
            : `Akan mengekspor ${jumlahEkspor} baris ${
                selectedIds.size > 0 ? "dari arsip yang dipilih" : "sesuai filter saat ini"
              }.`}
        </div>
      </Modal>
    </>
  );
}

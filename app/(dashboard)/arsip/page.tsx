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

const PAGE_SIZE = 8;

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
  file_name: string;
  file_size?: number;
  file_type: string;
};

type FolderFormState = {
  nama: string;
  keterangan: string;
};

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
    file_name: "",
    file_type: "",
  });
  const [formError, setFormError] = useState("");
  const paramsHandled = useRef(false);

  // Folder aktif objek
  const folderAktif = useMemo(
    () => (folderAktifId ? data.folders.find((f) => f.id === folderAktifId) ?? null : null),
    [data.folders, folderAktifId],
  );

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

  const detail = detailId ? (data.arsip.find((arsip) => arsip.id === detailId) ?? null) : null;
  const detailFolder = detail ? data.folders.find((f) => f.id === detail.folder_id) : null;

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
    setEditing(null);
    setForm({
      nomor_arsip: nextNomorArsip(tanggal),
      judul: "",
      kode: data.kodeArsip[0]?.kode ?? "",
      folder_id: targetFolderId,
      tanggal_arsip: tanggal,
      keterangan: "",
      file_name: "",
      file_type: "",
    });
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
    setForm({
      nomor_arsip: arsip.nomor_arsip,
      judul: arsip.judul,
      kode: arsip.kode,
      folder_id: arsip.folder_id,
      tanggal_arsip: arsip.tanggal_arsip,
      keterangan: arsip.keterangan ?? "",
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
    const input: ArsipInput = {
      nomor_arsip: form.nomor_arsip,
      judul: form.judul,
      kode: form.kode,
      folder_id: form.folder_id,
      tanggal_arsip: form.tanggal_arsip,
      keterangan: form.keterangan,
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

  const konfirmasiHapus = async () => {
    if (!hapus) return;
    setMenghapusArsip(true);
    try {
      const hasil = await deleteArsip(hapus.id);
      toast(hasil.message ?? (hasil.ok ? "Arsip dihapus." : "Gagal menghapus arsip."), hasil.ok ? "success" : "error");
      if (hasil.ok) {
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
            <select
              className="select"
              value={kode}
              onChange={(event) => {
                setKode(event.target.value);
                setPage(1);
              }}
              aria-label="Filter kode arsip"
            >
              <option value="">Semua kode</option>
              {data.kodeArsip.map((item) => (
                <option key={item.id} value={item.kode}>
                  {item.kode} - {item.nama}
                </option>
              ))}
            </select>
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
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Judul</th>
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
                    <td colSpan={folderAktif ? 5 : 6}>
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
              <label htmlFor="judul-arsip">Judul arsip</label>
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
              <select
                id="kode-arsip"
                className="select"
                value={form.kode}
                onChange={(event) => setForm({ ...form, kode: event.target.value })}
                required
              >
                <option value="">Pilih kode</option>
                {data.kodeArsip.map((item) => (
                  <option key={item.id} value={item.kode}>
                    {item.kode} - {item.nama}
                  </option>
                ))}
              </select>
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
    </>
  );
}

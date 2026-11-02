"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Drawer from "@/components/drawer";
import Icon from "@/components/icon";
import Modal from "@/components/modal";
import StatusBadge from "@/components/status-badge";
import { formatTanggal, formatWaktu, inisial, type Arsip } from "@/lib/demo-data";
import { useDemo, type ArsipInput } from "@/lib/demo-store";
import { downloadDokumenDemo, formatBytes } from "@/lib/export";
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

type FormState = {
  nomor_arsip: string;
  judul: string;
  kode: string;
  tanggal_arsip: string;
  keterangan: string;
  file_name: string;
  file_size?: number;
  file_type: string;
};

function today() {
  const value = new Date();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

export default function ArsipPage() {
  const { ready, data, canManage, saveArsip, deleteArsip, nextNomorArsip, catatLog, toast } = useDemo();
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
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Arsip | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [hapus, setHapus] = useState<Arsip | null>(null);
  const [form, setForm] = useState<FormState>({
    nomor_arsip: "",
    judul: "",
    kode: "",
    tanggal_arsip: "",
    keterangan: "",
    file_name: "",
    file_type: "",
  });
  const [formError, setFormError] = useState("");
  const paramsHandled = useRef(false);

  const daftarTahun = useMemo(
    () => Array.from(new Set(data.arsip.map((arsip) => arsip.tanggal_arsip.slice(0, 4)))).sort().reverse(),
    [data.arsip],
  );

  const daftarPengguna = useMemo(
    () => Array.from(new Set(data.arsip.map((arsip) => arsip.pembuat))).sort(),
    [data.arsip],
  );

  const filtered = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return data.arsip
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
  }, [bulan, cari, data.arsip, kode, modeTanggal, pengguna, status, tahun, tanggal1, tanggal2]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const halaman = Math.min(page, totalPages);
  const paged = filtered.slice((halaman - 1) * PAGE_SIZE, halaman * PAGE_SIZE);
  const awal = filtered.length === 0 ? 0 : (halaman - 1) * PAGE_SIZE + 1;
  const akhir = Math.min(halaman * PAGE_SIZE, filtered.length);

  const detail = detailId ? (data.arsip.find((arsip) => arsip.id === detailId) ?? null) : null;

  const bukaTambah = () => {
    if (!canManage || data.kodeArsip.length === 0) return;
    const tanggal = today();
    setEditing(null);
    setForm({
      nomor_arsip: nextNomorArsip(tanggal),
      judul: "",
      kode: data.kodeArsip[0]?.kode ?? "",
      tanggal_arsip: tanggal,
      keterangan: "",
      file_name: "",
      file_type: "",
    });
    setFormError("");
    setFormOpen(true);
  };

  // Membuka form/detail dari tautan cepat (bottom navbar atau pencarian Ctrl+K).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!ready || paramsHandled.current) return;
    paramsHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    const detailParam = params.get("detail");
    const cariParam = params.get("cari");
    if (cariParam) setCari(cariParam);
    if (detailParam && data.arsip.some((arsip) => arsip.id === detailParam)) {
      setDetailId(detailParam);
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

  const simpan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: ArsipInput = {
      nomor_arsip: form.nomor_arsip,
      judul: form.judul,
      kode: form.kode,
      tanggal_arsip: form.tanggal_arsip,
      keterangan: form.keterangan,
      file_name: form.file_name || undefined,
      file_size: form.file_size,
      file_type: form.file_type || undefined,
    };
    const hasil = saveArsip(input, editing?.id);
    if (!hasil.ok) {
      setFormError(hasil.message ?? "Gagal menyimpan arsip.");
      return;
    }
    toast(hasil.message ?? "Arsip disimpan.");
    setFormOpen(false);
  };

  const unduh = (arsip: Arsip) => {
    downloadDokumenDemo(arsip.nomor_arsip, arsip.judul, [
      `Kode arsip    : ${arsip.kode}`,
      `Tanggal arsip : ${formatTanggal(arsip.tanggal_arsip)}`,
      `Status        : ${arsip.status_retensi}`,
      `Akhir retensi : ${formatTanggal(arsip.akhir_retensi)}`,
      `Pembuat       : ${arsip.pembuat}`,
      `Berkas        : ${arsip.file_name ?? "belum ada berkas"}`,
      `Ukuran        : ${formatBytes(arsip.file_size)}`,
      `Keterangan    : ${arsip.keterangan ?? "-"}`,
    ]);
    catatLog("Mengunduh arsip", `${arsip.nomor_arsip} - ${arsip.judul}`, "ekspor");
    toast("Berkas demo diunduh.");
  };

  const konfirmasiHapus = () => {
    if (!hapus) return;
    const hasil = deleteArsip(hapus.id);
    toast(hasil.message ?? (hasil.ok ? "Arsip dihapus." : "Gagal menghapus arsip."), hasil.ok ? "success" : "error");
    if (hasil.ok) {
      setHapus(null);
      setDetailId(null);
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

  return (
    <>
      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Daftar Arsip</h2>
            <p className="sub">Cari, filter, tambah, ubah, dan unduh arsip digital.</p>
          </div>
          <div className="actions-row">
            {aktifFilter ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilter}>
                Reset filter
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
            aria-label="Filter tahun"
          >
            <option value="">Semua tahun</option>
            {daftarTahun.map((item) => (
              <option key={item} value={item}>
                Tahun {item}
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
            aria-label="Filter bulan"
          >
            <option value="">Semua bulan</option>
            {BULAN.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={modeTanggal}
            onChange={(event) => {
              const mode = event.target.value as ModeTanggal;
              setModeTanggal(mode);
              if (!mode) {
                setTanggal1("");
                setTanggal2("");
              }
              setPage(1);
            }}
            aria-label="Mode tanggal"
          >
            <option value="">Semua tanggal</option>
            <option value="satu">Satu tanggal</option>
            <option value="rentang">Rentang tanggal</option>
          </select>
          {modeTanggal === "satu" ? (
            <input
              type="date"
              className="input"
              value={tanggal1}
              onChange={(event) => {
                setTanggal1(event.target.value);
                setPage(1);
              }}
              aria-label="Tanggal arsip"
            />
          ) : null}
          {modeTanggal === "rentang" ? (
            <>
              <input
                type="date"
                className="input"
                value={tanggal1}
                onChange={(event) => {
                  setTanggal1(event.target.value);
                  setPage(1);
                }}
                aria-label="Tanggal mulai"
              />
              <input
                type="date"
                className="input"
                value={tanggal2}
                onChange={(event) => {
                  setTanggal2(event.target.value);
                  setPage(1);
                }}
                aria-label="Tanggal akhir"
              />
            </>
          ) : null}
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

        {!canManage ? (
          <div className="form-note" style={{ marginBottom: 14 }}>
            Anda masuk sebagai Pimpinan. Daftar arsip dapat dilihat dan diunduh, tetapi perubahan data hanya untuk Admin dan
            Operator.
          </div>
        ) : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Judul</th>
                <th>Kode</th>
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
                : paged.map((arsip) => (
                    <tr key={arsip.id} className="row-click" onClick={() => setDetailId(arsip.id)}>
                      <td>
                        <div className="cell-title">{arsip.judul}</div>
                        <div className="cell-sub mono">{arsip.nomor_arsip}</div>
                      </td>
                      <td>
                        <span className="badge badge-muted">{arsip.kode}</span>
                      </td>
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
                  ))}
              {ready && paged.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">Tidak ada arsip yang cocok dengan filter.</div>
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
                  : "Berkas belum diunggah pada mode demo"}
              </small>
            </div>

            <div className="meta-grid">
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
            <button type="submit" form="form-arsip" className="btn">
              {editing ? "Simpan Perubahan" : "Simpan Arsip"}
            </button>
          </>
        }
      >
        <form id="form-arsip" onSubmit={simpan}>
          {formError ? <div className="error-box">{formError}</div> : null}
          <div className="form-grid">
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
                  : "Opsional pada mode demo, maksimal 10 MB."}
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

      <Modal
        open={Boolean(hapus)}
        onClose={() => setHapus(null)}
        title="Hapus Arsip"
        subtitle="Tindakan ini juga menghapus arsip dari usulan pemusnahan yang belum diputuskan."
        width={460}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setHapus(null)}>
              Batal
            </button>
            <button type="button" className="btn btn-danger" onClick={konfirmasiHapus}>
              Hapus
            </button>
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

"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/modal";
import StatusBadge from "@/components/status-badge";
import { formatTanggal, type Arsip } from "@/lib/demo-data";
import { useDemo, type ArsipInput } from "@/lib/demo-store";
import { downloadDokumenDemo, formatBytes } from "@/lib/export";

const PAGE_SIZE = 5;

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
  const { data, canManage, saveArsip, deleteArsip, nextNomorArsip, catatLog, toast } = useDemo();
  const [cari, setCari] = useState("");
  const [tahun, setTahun] = useState("");
  const [status, setStatus] = useState("");
  const [kode, setKode] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Arsip | null>(null);
  const [detail, setDetail] = useState<Arsip | null>(null);
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

  const daftarTahun = useMemo(
    () => Array.from(new Set(data.arsip.map((arsip) => arsip.tanggal_arsip.slice(0, 4)))).sort().reverse(),
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
        const cocokStatus = !status || arsip.status_retensi === status;
        const cocokKode = !kode || arsip.kode === kode;
        return cocokCari && cocokTahun && cocokStatus && cocokKode;
      })
      .sort((a, b) => b.tanggal_arsip.localeCompare(a.tanggal_arsip));
  }, [cari, data.arsip, kode, status, tahun]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const halaman = Math.min(page, totalPages);
  const paged = filtered.slice((halaman - 1) * PAGE_SIZE, halaman * PAGE_SIZE);
  const awal = filtered.length === 0 ? 0 : (halaman - 1) * PAGE_SIZE + 1;
  const akhir = Math.min(halaman * PAGE_SIZE, filtered.length);

  const bukaTambah = () => {
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
    setDetail(null);
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
      setDetail(null);
    }
  };

  const hapusFilter = (jenis: "tahun" | "status" | "kode") => {
    if (jenis === "tahun") setTahun("");
    if (jenis === "status") setStatus("");
    if (jenis === "kode") setKode("");
    setPage(1);
  };

  return (
    <>
      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Daftar Arsip</h2>
            <p className="sub">Cari, filter, tambah, ubah, dan unduh arsip digital.</p>
          </div>
          <button
            type="button"
            className="btn"
            onClick={bukaTambah}
            disabled={!canManage || data.kodeArsip.length === 0}
            title={!canManage ? "Pimpinan hanya dapat melihat" : data.kodeArsip.length === 0 ? "Tambahkan kode arsip dahulu" : ""}
          >
            + Tambah Arsip
          </button>
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
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
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
          >
            <option value="">Semua kode</option>
            {data.kodeArsip.map((item) => (
              <option key={item.id} value={item.kode}>
                {item.kode} - {item.nama}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => toast(`Filter diterapkan: ${filtered.length} arsip ditemukan.`, "info")}
          >
            Terapkan
          </button>
        </div>

        <div className="chips">
          {tahun ? (
            <span className="chip">
              Tahun: <strong>{tahun}</strong>
              <button type="button" onClick={() => hapusFilter("tahun")} aria-label="Hapus filter tahun">
                &times;
              </button>
            </span>
          ) : null}
          {status ? (
            <span className="chip">
              Status: <strong>{status}</strong>
              <button type="button" onClick={() => hapusFilter("status")} aria-label="Hapus filter status">
                &times;
              </button>
            </span>
          ) : null}
          {kode ? (
            <span className="chip">
              Kode: <strong>{kode}</strong>
              <button type="button" onClick={() => hapusFilter("kode")} aria-label="Hapus filter kode">
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
                <th>Nomor Arsip</th>
                <th>Judul</th>
                <th>Kode</th>
                <th>Tanggal Arsip</th>
                <th>Pembuat</th>
                <th>Akhir Retensi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((arsip) => (
                <tr key={arsip.id}>
                  <td className="mono">{arsip.nomor_arsip}</td>
                  <td>
                    <div className="cell-title">{arsip.judul}</div>
                    <div className="cell-sub">
                      {arsip.file_name ? `${arsip.file_name} - ${formatBytes(arsip.file_size)}` : "Belum ada berkas"}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-muted">{arsip.kode}</span>
                  </td>
                  <td>{formatTanggal(arsip.tanggal_arsip)}</td>
                  <td>{arsip.pembuat}</td>
                  <td>{formatTanggal(arsip.akhir_retensi)}</td>
                  <td>
                    <StatusBadge status={arsip.status_retensi} />
                  </td>
                  <td>
                    <div className="actions-row">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => unduh(arsip)}>
                        Unduh
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetail(arsip)}>
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8}>
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
                {form.file_name ? `${form.file_name} - ${formatBytes(form.file_size)}` : "Opsional pada mode demo, maksimal 10 MB."}
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
          <div className="form-note">Berkas yang dipilih hanya dicatat metadatanya. Penyimpanan berkas asli menunggu integrasi storage.</div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Detail Arsip"
        subtitle={detail?.nomor_arsip}
        footer={
          detail ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setDetail(null)}>
                Tutup
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
            <dl className="kv">
              <dt>Judul</dt>
              <dd>{detail.judul}</dd>
              <dt>Kode arsip</dt>
              <dd className="mono">{detail.kode}</dd>
              <dt>Tanggal arsip</dt>
              <dd>{formatTanggal(detail.tanggal_arsip)}</dd>
              <dt>Status retensi</dt>
              <dd>
                <StatusBadge status={detail.status_retensi} />
              </dd>
              <dt>Akhir retensi</dt>
              <dd>{formatTanggal(detail.akhir_retensi)}</dd>
              <dt>Pembuat</dt>
              <dd>{detail.pembuat}</dd>
              <dt>Berkas</dt>
              <dd>{detail.file_name ?? "Belum ada berkas"}</dd>
              <dt>Ukuran</dt>
              <dd>{formatBytes(detail.file_size)}</dd>
              <dt>Keterangan</dt>
              <dd>{detail.keterangan ?? "-"}</dd>
            </dl>
            <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => unduh(detail)}>
              Unduh Dokumen Demo
            </button>
          </>
        ) : null}
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

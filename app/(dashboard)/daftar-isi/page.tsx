"use client";

import { useMemo, useState } from "react";
import BerkasDetailDrawer from "@/components/daftar-isi/berkas-detail-drawer";
import BerkasFormModal from "@/components/daftar-isi/berkas-form-modal";
import Icon from "@/components/icon";
import Modal from "@/components/modal";
import {
  daftarBerkasDummy,
  formatTanggalSingkat,
  kelasSifat,
  KOLOM_BERKAS,
  SIFAT_ARSIP,
  tahunBerkas,
  type BerkasArsip,
  type BerkasInput,
} from "@/lib/daftar-isi";
import { useDemo } from "@/lib/demo-store";
import { downloadExcel } from "@/lib/export";

const PAGE_SIZE = 8;

function uid() {
  return `brk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function tanggalEkspor() {
  const value = new Date();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

export default function DaftarIsiPage() {
  const { toast } = useDemo();
  const [berkas, setBerkas] = useState<BerkasArsip[]>(daftarBerkasDummy);
  const [cari, setCari] = useState("");
  const [tahun, setTahun] = useState("");
  const [sifat, setSifat] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BerkasArsip | null>(null);
  const [detail, setDetail] = useState<BerkasArsip | null>(null);
  const [hapus, setHapus] = useState<BerkasArsip | null>(null);

  const daftarTahun = useMemo(
    () => Array.from(new Set(berkas.map((item) => tahunBerkas(item.tanggal)))).sort().reverse(),
    [berkas],
  );

  const filtered = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return berkas
      .filter((item) => {
        const cocokCari =
          !kata ||
          `${item.nomor_berkas} ${item.uraian_informasi} ${item.indeks_berkas} ${item.kode_klasifikasi}`
            .toLowerCase()
            .includes(kata);
        const cocokTahun = !tahun || item.tanggal.startsWith(tahun);
        const cocokSifat = !sifat || item.sifat_arsip === sifat;
        return cocokCari && cocokTahun && cocokSifat;
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [berkas, cari, sifat, tahun]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const halaman = Math.min(page, totalPages);
  const paged = filtered.slice((halaman - 1) * PAGE_SIZE, halaman * PAGE_SIZE);
  const awal = filtered.length === 0 ? 0 : (halaman - 1) * PAGE_SIZE + 1;
  const akhir = Math.min(halaman * PAGE_SIZE, filtered.length);
  const aktifFilter = Boolean(cari || tahun || sifat);

  const bukaTambah = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const bukaEdit = (item: BerkasArsip) => {
    setDetail(null);
    setEditing(item);
    setFormOpen(true);
  };

  const simpan = (values: BerkasInput): string | null => {
    const duplikat = berkas.some(
      (item) => item.nomor_berkas.toLowerCase() === values.nomor_berkas.toLowerCase() && item.id !== editing?.id,
    );
    if (duplikat) return "Nomor berkas sudah digunakan.";

    if (editing) {
      setBerkas((current) => current.map((item) => (item.id === editing.id ? { ...values, id: editing.id } : item)));
      toast("Arsip berhasil diperbarui.");
    } else {
      setBerkas((current) => [{ ...values, id: uid() }, ...current]);
      toast("Arsip berhasil ditambahkan.");
    }

    setFormOpen(false);
    setEditing(null);
    return null;
  };

  const konfirmasiHapus = () => {
    if (!hapus) return;
    setBerkas((current) => current.filter((item) => item.id !== hapus.id));
    if (detail?.id === hapus.id) setDetail(null);
    toast("Arsip berhasil dihapus.");
    setHapus(null);
  };

  const ekspor = () => {
    const rows = filtered.map((item) => [
      item.nomor_berkas,
      item.kode_klasifikasi,
      item.indeks_berkas,
      item.jumlah_folder,
      item.no_item_arsip,
      item.uraian_informasi,
      formatTanggalSingkat(item.tanggal),
      item.tingkat_perkembangan,
      item.jumlah_halaman,
      item.sifat_arsip,
      item.no_filling_cabinet,
      item.no_laci,
      item.no_folder,
      item.keterangan,
    ]);
    downloadExcel(`daftar-isi-berkas-arsip-aktif-${tanggalEkspor()}.xls`, [...KOLOM_BERKAS], rows);
    toast(`Export Excel berisi ${filtered.length} berkas disiapkan.`);
  };

  const resetFilter = () => {
    setCari("");
    setTahun("");
    setSifat("");
    setPage(1);
    toast("Filter daftar isi dibersihkan.", "info");
  };

  return (
    <>
      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Daftar Isi Berkas Arsip Aktif</h2>
            <p className="sub">Kelola daftar isi berkas arsip aktif beserta lokasi penyimpanannya.</p>
          </div>
          <div className="actions-row">
            <button type="button" className="btn btn-ghost" onClick={ekspor}>
              <Icon name="download" size={16} /> Export Excel
            </button>
            <button type="button" className="btn" onClick={bukaTambah}>
              <Icon name="plus" size={16} /> Tambah Arsip
            </button>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="input input-search"
            placeholder="Cari nomor berkas atau uraian informasi..."
            value={cari}
            onChange={(event) => {
              setCari(event.target.value);
              setPage(1);
            }}
            aria-label="Cari nomor berkas atau uraian informasi"
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
            value={sifat}
            onChange={(event) => {
              setSifat(event.target.value);
              setPage(1);
            }}
            aria-label="Filter sifat arsip"
          >
            <option value="">Semua sifat arsip</option>
            {SIFAT_ARSIP.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {aktifFilter ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilter}>
              Reset filter
            </button>
          ) : null}
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
          {sifat ? (
            <span className="chip">
              Sifat: <strong>{sifat}</strong>
              <button type="button" onClick={() => setSifat("")} aria-label="Hapus filter sifat arsip">
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
            Total: <strong>{filtered.length} berkas</strong>
          </span>
        </div>

        <p className="doc-scroll-hint">Geser tabel ke samping untuk melihat seluruh kolom.</p>

        <div className="table-wrap doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Nomor Berkas</th>
                <th>Kode Klasifikasi</th>
                <th>Indeks Berkas</th>
                <th className="cell-num">Jumlah Folder</th>
                <th className="cell-center">No. Item Arsip</th>
                <th>Uraian Informasi Arsip</th>
                <th>Tanggal</th>
                <th>Tingkat Perkembangan</th>
                <th className="cell-num">Jumlah Halaman Surat</th>
                <th>Sifat Arsip</th>
                <th>No. Filling Cabinet</th>
                <th>No. Laci</th>
                <th>No. Folder</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((item) => (
                <tr key={item.id} className="row-click" onClick={() => setDetail(item)}>
                  <td>
                    <div className="cell-title mono">{item.nomor_berkas}</div>
                  </td>
                  <td>
                    <span className="badge badge-muted mono">{item.kode_klasifikasi}</span>
                  </td>
                  <td>
                    <div className="cell-title small">{item.indeks_berkas || "-"}</div>
                  </td>
                  <td className="cell-num">{item.jumlah_folder}</td>
                  <td className="cell-center mono">{item.no_item_arsip || "-"}</td>
                  <td className="cell-uraian">{item.uraian_informasi}</td>
                  <td className="cell-center">{formatTanggalSingkat(item.tanggal)}</td>
                  <td className="cell-center">
                    <span className="badge badge-muted">{item.tingkat_perkembangan}</span>
                  </td>
                  <td className="cell-num">{item.jumlah_halaman}</td>
                  <td>
                    <span className={`badge ${kelasSifat(item.sifat_arsip)}`}>
                      <span className="badge-dot" />
                      {item.sifat_arsip}
                    </span>
                  </td>
                  <td className="cell-loc mono">{item.no_filling_cabinet || "-"}</td>
                  <td className="cell-loc mono">{item.no_laci || "-"}</td>
                  <td className="cell-loc mono">{item.no_folder || "-"}</td>
                  <td className="cell-note">{item.keterangan || "-"}</td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-action"
                        onClick={() => setDetail(item)}
                        title="Detail arsip"
                        aria-label={`Detail arsip ${item.nomor_berkas}`}
                      >
                        <Icon name="file" size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-action"
                        onClick={() => bukaEdit(item)}
                        title="Edit arsip"
                        aria-label={`Edit arsip ${item.nomor_berkas}`}
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-action danger"
                        onClick={() => setHapus(item)}
                        title="Hapus arsip"
                        aria-label={`Hapus arsip ${item.nomor_berkas}`}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={15}>
                    <div className="empty">Tidak ada berkas arsip yang cocok dengan filter.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="table-foot">
          <span>
            Menampilkan {awal}-{akhir} dari {filtered.length} berkas
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

      {formOpen ? (
        <BerkasFormModal
          key={editing?.id ?? "baru"}
          initial={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={simpan}
        />
      ) : null}

      <BerkasDetailDrawer
        berkas={detail}
        onClose={() => setDetail(null)}
        onEdit={bukaEdit}
        onDelete={(item) => {
          setDetail(null);
          setHapus(item);
        }}
      />

      <Modal
        open={Boolean(hapus)}
        onClose={() => setHapus(null)}
        title="Hapus Arsip"
        subtitle="Berkas akan dihapus dari daftar isi arsip aktif."
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
          Hapus <strong>{hapus?.nomor_berkas}</strong> - {hapus?.indeks_berkas}?
        </p>
      </Modal>
    </>
  );
}

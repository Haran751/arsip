"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/modal";
import StatusBadge from "@/components/status-badge";
import { type KodeArsip } from "@/lib/demo-data";
import { useDemo, type KodeImportRow, type KodeInput } from "@/lib/demo-store";
import { downloadCsv, parseCsv } from "@/lib/export";

const TEMPLATE_HEADERS = ["kode", "nama", "retensi_aktif_thn", "retensi_inaktif_thn", "nasib_akhir"];
const NASIB = ["Musnah", "Permanen", "Dinilai_Kembali"] as const;

type FormState = {
  kode: string;
  nama: string;
  retensi_aktif_thn: string;
  retensi_inaktif_thn: string;
  nasib_akhir: KodeInput["nasib_akhir"];
};

function normalisasiNasib(value: string): KodeInput["nasib_akhir"] | null {
  const text = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (text === "musnah") return "Musnah";
  if (text === "permanen") return "Permanen";
  if (text === "dinilai_kembali" || text === "dinilaikembali") return "Dinilai_Kembali";
  return null;
}

export default function KodeArsipPage() {
  const { data, isAdmin, countArsip, saveKode, deleteKode, importKode, toast } = useDemo();
  const [cari, setCari] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KodeArsip | null>(null);
  const [hapus, setHapus] = useState<KodeArsip | null>(null);
  const [form, setForm] = useState<FormState>({
    kode: "",
    nama: "",
    retensi_aktif_thn: "0",
    retensi_inaktif_thn: "0",
    nasib_akhir: "Musnah",
  });
  const [formError, setFormError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<KodeImportRow[]>([]);
  const [importError, setImportError] = useState("");
  const [importNama, setImportNama] = useState("");

  const filtered = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return data.kodeArsip.filter((item) => !kata || `${item.kode} ${item.nama}`.toLowerCase().includes(kata));
  }, [cari, data.kodeArsip]);

  const bukaTambah = () => {
    setEditing(null);
    setForm({ kode: "", nama: "", retensi_aktif_thn: "0", retensi_inaktif_thn: "0", nasib_akhir: "Musnah" });
    setFormError("");
    setFormOpen(true);
  };

  const bukaUbah = (item: KodeArsip) => {
    setEditing(item);
    setForm({
      kode: item.kode,
      nama: item.nama,
      retensi_aktif_thn: String(item.retensi_aktif_thn),
      retensi_inaktif_thn: String(item.retensi_inaktif_thn),
      nasib_akhir: item.nasib_akhir,
    });
    setFormError("");
    setFormOpen(true);
  };

  const simpan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasil = saveKode(
      {
        kode: form.kode,
        nama: form.nama,
        retensi_aktif_thn: Number(form.retensi_aktif_thn) || 0,
        retensi_inaktif_thn: Number(form.retensi_inaktif_thn) || 0,
        nasib_akhir: form.nasib_akhir,
      },
      editing?.id,
    );
    if (!hasil.ok) {
      setFormError(hasil.message ?? "Gagal menyimpan kode arsip.");
      return;
    }
    toast(hasil.message ?? "Kode arsip disimpan.");
    setFormOpen(false);
  };

  const konfirmasiHapus = () => {
    if (!hapus) return;
    const hasil = deleteKode(hapus.id);
    toast(hasil.message ?? (hasil.ok ? "Kode arsip dihapus." : "Gagal menghapus kode."), hasil.ok ? "success" : "error");
    if (hasil.ok) setHapus(null);
  };

  const unduhTemplate = () => {
    downloadCsv("template-kode-arsip.csv", TEMPLATE_HEADERS, [
      ["KEU-02", "Laporan Keuangan Bulanan", 2, 5, "Musnah"],
      ["HKM-02", "Dokumen Hukum Permanen", 5, 5, "Permanen"],
    ]);
    toast("Template CSV kode arsip diunduh.");
  };

  const bacaImpor = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast("Gunakan file CSV. Template dapat diunduh dari halaman ini.", "error");
      return;
    }

    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      setImportRows([]);
      setImportNama(file.name);
      setImportError("File kosong atau tidak memiliki baris data.");
      setImportOpen(true);
      return;
    }

    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const index = {
      kode: headers.indexOf("kode"),
      nama: headers.indexOf("nama"),
      aktif: headers.indexOf("retensi_aktif_thn"),
      inaktif: headers.indexOf("retensi_inaktif_thn"),
      nasib: headers.indexOf("nasib_akhir"),
    };
    if (Object.values(index).some((value) => value < 0)) {
      setImportRows([]);
      setImportNama(file.name);
      setImportError("Header tidak sesuai template. Gunakan: kode, nama, retensi_aktif_thn, retensi_inaktif_thn, nasib_akhir.");
      setImportOpen(true);
      return;
    }

    const sudahAda = new Set(data.kodeArsip.map((item) => item.kode));
    const terlihat = new Set<string>();
    const hasil: KodeImportRow[] = rows.slice(1).map((row, indexBaris) => {
      const kode = (row[index.kode] ?? "").trim().toUpperCase();
      const nama = (row[index.nama] ?? "").trim();
      const aktif = Number((row[index.aktif] ?? "").trim());
      const inaktif = Number((row[index.inaktif] ?? "").trim());
      const nasib = normalisasiNasib(row[index.nasib] ?? "");
      const pesan: string[] = [];

      if (!kode) pesan.push("kode kosong");
      if (!nama) pesan.push("nama kosong");
      if (!Number.isInteger(aktif) || aktif < 0) pesan.push("retensi aktif tidak valid");
      if (!Number.isInteger(inaktif) || inaktif < 0) pesan.push("retensi inaktif tidak valid");
      if (!nasib) pesan.push("nasib akhir tidak valid");
      if (kode && terlihat.has(kode)) pesan.push("kode duplikat di dalam file");
      if (kode) terlihat.add(kode);

      const status: KodeImportRow["status"] = pesan.length ? "Error" : sudahAda.has(kode) ? "Diperbarui" : "Baru";
      return {
        baris: indexBaris + 2,
        kode,
        nama,
        retensi_aktif_thn: Number.isInteger(aktif) ? aktif : 0,
        retensi_inaktif_thn: Number.isInteger(inaktif) ? inaktif : 0,
        nasib_akhir: nasib ?? "Musnah",
        status,
        pesan: pesan.join(", "),
      };
    });

    setImportRows(hasil);
    setImportNama(file.name);
    setImportError(hasil.length ? "" : "Tidak ada baris data yang dapat diproses.");
    setImportOpen(true);
  };

  const konfirmasiImpor = () => {
    const valid = importRows.filter((row) => row.status !== "Error");
    if (!valid.length) {
      toast("Tidak ada baris valid untuk diimpor.", "error");
      return;
    }
    const hasil = importKode(
      valid.map((row) => ({
        kode: row.kode,
        nama: row.nama,
        retensi_aktif_thn: row.retensi_aktif_thn,
        retensi_inaktif_thn: row.retensi_inaktif_thn,
        nasib_akhir: row.nasib_akhir,
      })),
    );
    toast(hasil.message ?? "Impor selesai.", hasil.ok ? "success" : "error");
    if (hasil.ok) setImportOpen(false);
  };

  const baru = importRows.filter((row) => row.status === "Baru").length;
  const diperbarui = importRows.filter((row) => row.status === "Diperbarui").length;
  const error = importRows.filter((row) => row.status === "Error").length;

  return (
    <>
      <div className="grid grid-3">
        <div className="card stat-card">
          <div className="stat-label">Total Kode</div>
          <div className="stat-value">{data.kodeArsip.length}</div>
          <div className="stat-note">kode arsip terdaftar</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Nasib Musnah</div>
          <div className="stat-value">{data.kodeArsip.filter((item) => item.nasib_akhir === "Musnah").length}</div>
          <div className="stat-note">dapat diusulkan pemusnahan</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Nasib Permanen</div>
          <div className="stat-value">{data.kodeArsip.filter((item) => item.nasib_akhir === "Permanen").length}</div>
          <div className="stat-note">disimpan selamanya</div>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Master Kode Arsip</h2>
            <p className="sub">Aturan retensi aktif, inaktif, dan nasib akhir arsip.</p>
          </div>
          <button
            type="button"
            className="btn"
            onClick={bukaTambah}
            disabled={!isAdmin}
            title={!isAdmin ? "Hanya Admin yang dapat mengubah master kode" : ""}
          >
            + Tambah Kode
          </button>
        </div>

        <div className="toolbar">
          <input
            className="input input-search"
            placeholder="Cari kode atau nama..."
            value={cari}
            onChange={(event) => setCari(event.target.value)}
          />
          <label className={`btn btn-ghost${isAdmin ? "" : " disabled"}`} style={{ cursor: isAdmin ? "pointer" : "not-allowed" }}>
            Impor CSV
            <input type="file" accept=".csv" hidden disabled={!isAdmin} onChange={bacaImpor} />
          </label>
          <button type="button" className="btn btn-ghost" onClick={unduhTemplate}>
            Unduh Template CSV
          </button>
        </div>

        {!isAdmin ? (
          <div className="form-note" style={{ marginBottom: 14 }}>
            Master kode arsip hanya dapat diubah oleh Admin. Anda tetap dapat mencari dan melihat aturan retensi.
          </div>
        ) : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>Retensi Aktif</th>
                <th>Retensi Inaktif</th>
                <th>Nasib Akhir</th>
                <th>Jumlah Arsip</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((kode) => {
                const jumlah = countArsip(kode.kode);
                return (
                  <tr key={kode.id}>
                    <td className="mono">{kode.kode}</td>
                    <td>
                      <div className="cell-title">{kode.nama}</div>
                      <div className="cell-sub">parent: {kode.kode.split("-")[0]}</div>
                    </td>
                    <td>{kode.retensi_aktif_thn} tahun</td>
                    <td>{kode.retensi_inaktif_thn} tahun</td>
                    <td>
                      <StatusBadge status={kode.nasib_akhir} />
                    </td>
                    <td>{jumlah} arsip</td>
                    <td>
                      <div className="actions-row">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => bukaUbah(kode)}
                          disabled={!isAdmin}
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setHapus(kode)}
                          disabled={!isAdmin}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">Tidak ada kode arsip yang cocok.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Ubah Kode Arsip" : "Tambah Kode Arsip"}
        subtitle="Perubahan aturan retensi akan menghitung ulang arsip yang menggunakan kode ini."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Batal
            </button>
            <button type="submit" form="form-kode" className="btn">
              {editing ? "Simpan Perubahan" : "Simpan Kode"}
            </button>
          </>
        }
      >
        <form id="form-kode" onSubmit={simpan}>
          {formError ? <div className="error-box">{formError}</div> : null}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="kode">Kode</label>
              <input
                id="kode"
                className="input mono"
                value={form.kode}
                onChange={(event) => setForm({ ...form, kode: event.target.value.toUpperCase() })}
                placeholder="KEU-01"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="nasib">Nasib akhir</label>
              <select
                id="nasib"
                className="select"
                value={form.nasib_akhir}
                onChange={(event) => setForm({ ...form, nasib_akhir: event.target.value as KodeInput["nasib_akhir"] })}
              >
                {NASIB.map((item) => (
                  <option key={item} value={item}>
                    {item === "Dinilai_Kembali" ? "Dinilai Kembali" : item}
                  </option>
                ))}
              </select>
            </div>
            <div className="field field-full">
              <label htmlFor="nama-kode">Nama kode arsip</label>
              <input
                id="nama-kode"
                className="input"
                value={form.nama}
                onChange={(event) => setForm({ ...form, nama: event.target.value })}
                placeholder="Laporan Keuangan Tahunan"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="retensi-aktif">Retensi aktif (tahun)</label>
              <input
                id="retensi-aktif"
                type="number"
                min={0}
                className="input"
                value={form.retensi_aktif_thn}
                onChange={(event) => setForm({ ...form, retensi_aktif_thn: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="retensi-inaktif">Retensi inaktif (tahun)</label>
              <input
                id="retensi-inaktif"
                type="number"
                min={0}
                className="input"
                value={form.retensi_inaktif_thn}
                onChange={(event) => setForm({ ...form, retensi_inaktif_thn: event.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-note">
            Contoh: retensi aktif 2 tahun dan inaktif 8 tahun berarti akhir retensi dihitung 10 tahun setelah tanggal arsip.
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(hapus)}
        onClose={() => setHapus(null)}
        title="Hapus Kode Arsip"
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
          Hapus kode <strong>{hapus?.kode}</strong> - {hapus?.nama}? Kode yang masih dipakai arsip tidak dapat dihapus.
        </p>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Pratinjau Impor Kode Arsip"
        subtitle={importNama}
        width={760}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setImportOpen(false)}>
              Batal
            </button>
            <button type="button" className="btn" onClick={konfirmasiImpor} disabled={baru + diperbarui === 0}>
              Impor {baru + diperbarui} Baris Valid
            </button>
          </>
        }
      >
        {importError ? <div className="error-box">{importError}</div> : null}
        {importRows.length ? (
          <>
            <div className="import-summary">
              <div>
                Baru
                <strong>{baru}</strong>
              </div>
              <div>
                Diperbarui
                <strong>{diperbarui}</strong>
              </div>
              <div>
                Error
                <strong>{error}</strong>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Baris</th>
                    <th>Kode</th>
                    <th>Nama</th>
                    <th>Aktif</th>
                    <th>Inaktif</th>
                    <th>Nasib</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((row) => (
                    <tr key={`${row.baris}-${row.kode}`} className={row.status === "Error" ? "row-error" : ""}>
                      <td>{row.baris}</td>
                      <td className="mono">{row.kode || "-"}</td>
                      <td>{row.nama || "-"}</td>
                      <td>{row.retensi_aktif_thn}</td>
                      <td>{row.retensi_inaktif_thn}</td>
                      <td>{row.nasib_akhir === "Dinilai_Kembali" ? "Dinilai Kembali" : row.nasib_akhir}</td>
                      <td>
                        <span
                          className={`badge ${
                            row.status === "Error" ? "badge-danger" : row.status === "Diperbarui" ? "badge-info" : "badge-aktif"
                          }`}
                        >
                          {row.status}
                        </span>
                        {row.pesan ? <div className="cell-sub">{row.pesan}</div> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}

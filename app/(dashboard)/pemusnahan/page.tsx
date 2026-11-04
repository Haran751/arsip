"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/modal";
import StatusBadge from "@/components/status-badge";
import { formatTanggal, type Usulan } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";

export default function PemusnahanPage() {
  const { data, dueArsip, stats, canManage, isAdmin, addUsulan, decideUsulan, toast } = useDemo();
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [catatan, setCatatan] = useState("");
  const [formError, setFormError] = useState("");

  const pendingIds = useMemo(
    () =>
      new Set(
        data.usulan.filter((usulan) => usulan.status === "Diajukan").flatMap((usulan) => usulan.item_ids ?? []),
      ),
    [data.usulan],
  );

  const eligible = dueArsip.filter((arsip) => !pendingIds.has(arsip.id));
  const detail = data.usulan.find((usulan) => usulan.id === detailId) ?? null;
  const detailArsip = detail
    ? (detail.item_ids ?? []).map((id) => data.arsip.find((arsip) => arsip.id === id)).filter(Boolean)
    : [];

  const bukaForm = (ids: string[] = []) => {
    setSelected(ids);
    setCatatan("");
    setFormError("");
    setFormOpen(true);
  };

  const toggle = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const ajukan = () => {
    if (!selected.length) {
      setFormError("Pilih minimal satu arsip.");
      return;
    }
    const hasil = addUsulan(selected, catatan);
    if (!hasil.ok) {
      setFormError(hasil.message ?? "Gagal membuat usulan.");
      return;
    }
    toast(hasil.message ?? "Usulan dibuat.");
    setFormOpen(false);
  };

  const putuskan = (usulan: Usulan, status: "Disetujui" | "Ditolak") => {
    const hasil = decideUsulan(usulan.id, status);
    toast(hasil.message ?? "Usulan diputuskan.", hasil.ok ? "success" : "error");
  };

  return (
    <>
      <div className="grid grid-4">
        <div className="card stat-card">
          <div className="stat-label">Jatuh Tempo</div>
          <div className="stat-value" style={{ color: "#b83a3a" }}>
            {stats.due}
          </div>
          <div className="stat-note">arsip inaktif siap ditinjau</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Usulan Diajukan</div>
          <div className="stat-value" style={{ color: "#1d6f9e" }}>
            {stats.usulanDiajukan}
          </div>
          <div className="stat-note">menunggu persetujuan Admin</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Disetujui</div>
          <div className="stat-value" style={{ color: "#0b7a4b" }}>
            {stats.usulanDisetujui}
          </div>
          <div className="stat-note">siap dimusnahkan</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Item</div>
          <div className="stat-value">{stats.totalItemUsulan}</div>
          <div className="stat-note">arsip dalam usulan</div>
        </div>
      </div>

      <div className="note note-warn">
        <span className="note-mark" />
        <span>
          Persetujuan pemusnahan hanya dapat dilakukan oleh <strong>Admin</strong>. Tidak ada penghapusan otomatis;
          arsip tetap tersimpan sampai usulan disetujui.
        </span>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Usulan Pemusnahan</h2>
            <p className="sub">Daftar usulan beserta status persetujuannya.</p>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => bukaForm()}
            disabled={!canManage || eligible.length === 0}
            title={!canManage ? "Pimpinan hanya dapat melihat" : eligible.length === 0 ? "Tidak ada arsip yang dapat diusulkan" : ""}
          >
            + Ajukan Pemusnahan
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nomor Usulan</th>
                <th>Diajukan Oleh</th>
                <th>Tanggal</th>
                <th>Jumlah Item</th>
                <th>Status</th>
                <th>Disetujui Oleh</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.usulan.map((usulan) => (
                <tr key={usulan.id}>
                  <td className="mono">{usulan.nomor}</td>
                  <td>{usulan.diajukan_oleh}</td>
                  <td>{formatTanggal(usulan.tanggal)}</td>
                  <td>{usulan.jumlah_item} arsip</td>
                  <td>
                    <StatusBadge status={usulan.status} />
                  </td>
                  <td>{usulan.disetujui_oleh ?? "-"}</td>
                  <td>
                    <div className="actions-row">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetailId(usulan.id)}>
                        Detail
                      </button>
                      {usulan.status === "Diajukan" && isAdmin ? (
                        <button type="button" className="btn btn-sm" onClick={() => putuskan(usulan, "Disetujui")}>
                          Setujui
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {data.usulan.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">Belum ada usulan pemusnahan.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Arsip Jatuh Tempo</h2>
            <p className="sub">Arsip inaktif yang belum masuk usulan aktif dan dapat diusulkan.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nomor Arsip</th>
                <th>Judul</th>
                <th>Kode</th>
                <th>Akhir Retensi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {eligible.map((arsip) => (
                <tr key={arsip.id}>
                  <td className="mono">{arsip.nomor_arsip}</td>
                  <td>{arsip.judul}</td>
                  <td>
                    <span className="badge badge-muted">{arsip.kode}</span>
                  </td>
                  <td>{formatTanggal(arsip.akhir_retensi)}</td>
                  <td>
                    <StatusBadge status={arsip.status_retensi} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => bukaForm([arsip.id])}
                      disabled={!canManage}
                    >
                      Pilih
                    </button>
                  </td>
                </tr>
              ))}
              {eligible.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">Tidak ada arsip jatuh tempo yang belum diusulkan.</div>
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
        title="Ajukan Pemusnahan"
        subtitle="Pilih arsip inaktif yang akan dimasukkan ke usulan."
        width={700}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Batal
            </button>
            <button type="button" className="btn" onClick={ajukan} disabled={selected.length === 0}>
              Ajukan {selected.length} Arsip
            </button>
          </>
        }
      >
        {formError ? <div className="error-box">{formError}</div> : null}
        <div className="spread" style={{ marginBottom: 9 }}>
          <span className="sub">{eligible.length} arsip tersedia</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setSelected(selected.length === eligible.length ? [] : eligible.map((arsip) => arsip.id))}
          >
            {selected.length === eligible.length ? "Batal pilih semua" : "Pilih semua"}
          </button>
        </div>
        <div className="check-list">
          {eligible.map((arsip) => (
            <label key={arsip.id} className="check-row">
              <input type="checkbox" checked={selected.includes(arsip.id)} onChange={() => toggle(arsip.id)} />
              <div className="check-row-main">
                <div className="cell-title">
                  {arsip.nomor_arsip} - {arsip.judul}
                </div>
                <div className="cell-sub">
                  {arsip.kode} - akhir retensi {formatTanggal(arsip.akhir_retensi)}
                </div>
              </div>
              <StatusBadge status={arsip.status_retensi} />
            </label>
          ))}
          {eligible.length === 0 ? <div className="empty">Tidak ada arsip yang dapat dipilih.</div> : null}
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="catatan-usulan">Catatan usulan</label>
          <textarea
            id="catatan-usulan"
            className="input"
            value={catatan}
            onChange={(event) => setCatatan(event.target.value)}
            placeholder="Alasan atau dasar pengajuan pemusnahan"
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title="Detail Usulan Pemusnahan"
        subtitle={detail?.nomor}
        width={700}
        footer={
          detail ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setDetailId(null)}>
                Tutup
              </button>
              {detail.status === "Diajukan" && isAdmin ? (
                <>
                  <button type="button" className="btn btn-danger" onClick={() => putuskan(detail, "Ditolak")}>
                    Tolak
                  </button>
                  <button type="button" className="btn" onClick={() => putuskan(detail, "Disetujui")}>
                    Setujui
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
              <dt>Status</dt>
              <dd>
                <StatusBadge status={detail.status} />
              </dd>
              <dt>Diajukan oleh</dt>
              <dd>{detail.diajukan_oleh}</dd>
              <dt>Tanggal usulan</dt>
              <dd>{formatTanggal(detail.tanggal)}</dd>
              <dt>Jumlah item</dt>
              <dd>{detail.jumlah_item} arsip</dd>
              <dt>Disetujui oleh</dt>
              <dd>{detail.disetujui_oleh ?? "-"}</dd>
              <dt>Diputuskan pada</dt>
              <dd>{detail.diputuskan_pada ? formatTanggal(detail.diputuskan_pada) : "-"}</dd>
              <dt>Catatan</dt>
              <dd>{detail.catatan ?? "-"}</dd>
            </dl>

            <div className="detail-list">
              {detailArsip.map((arsip) =>
                arsip ? (
                  <div key={arsip.id} className="detail-row">
                    <div>
                      <strong className="mono">{arsip.nomor_arsip}</strong>
                      <div className="cell-sub">{arsip.judul}</div>
                    </div>
                    <StatusBadge status={arsip.status_retensi} />
                  </div>
                ) : null,
              )}
              {detailArsip.length === 0 ? <div className="empty">Data arsip pada usulan tidak ditemukan.</div> : null}
            </div>

            {detail.status === "Diajukan" && !isAdmin ? (
              <div className="form-note">Menunggu keputusan Admin. Anda hanya dapat melihat detail usulan.</div>
            ) : null}
          </>
        ) : null}
      </Modal>
    </>
  );
}

"use client";

import Link from "next/link";
import StatusBadge from "@/components/status-badge";
import { formatTanggal, formatWaktu } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";

const jenisClass: Record<string, string> = {
  setuju: "warn",
  cron: "info",
  hapus: "danger",
};

export default function BerandaPage() {
  const { data, stats, resetDemo } = useDemo();

  const arsipTerbaru = [...data.arsip].sort((a, b) => b.tanggal_arsip.localeCompare(a.tanggal_arsip)).slice(0, 5);
  const logTerbaru = [...data.logs].sort((a, b) => b.waktu.localeCompare(a.waktu)).slice(0, 4);
  const menjelang = [...data.arsip]
    .filter((arsip) => arsip.status_retensi !== "Permanen")
    .sort((a, b) => a.akhir_retensi.localeCompare(b.akhir_retensi))
    .slice(0, 3);

  return (
    <>
      <div className="grid grid-4">
        <div className="card stat-card">
          <div className="stat-label">Total Arsip</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-note">arsip terdaftar</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Arsip Aktif</div>
          <div className="stat-value" style={{ color: "#0b7a4b" }}>
            {stats.aktif}
          </div>
          <div className="stat-note">masih dalam masa aktif</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Arsip Inaktif</div>
          <div className="stat-value" style={{ color: "#a66a00" }}>
            {stats.inaktif}
          </div>
          <div className="stat-note">menunggu jadwal retensi</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Perlu Ditinjau</div>
          <div className="stat-value" style={{ color: "#b83a3a" }}>
            {stats.due}
          </div>
          <div className="stat-note">arsip inaktif siap diusulkan</div>
        </div>
      </div>

      <div className="note">
        <span className="note-mark" />
        <span style={{ flex: 1 }}>
          Ini adalah <strong>mode demo</strong>. Semua perubahan disimpan di browser Anda dan belum terhubung ke database.
          Halaman arsip, kode arsip, retensi, pemusnahan, pengguna, dan log aktivitas sudah dapat digunakan.
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={resetDemo}>
          Reset Data Demo
        </button>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-head">
            <div>
              <h2 className="h2">Arsip Terbaru</h2>
              <p className="sub">Lima arsip yang terakhir ditambahkan.</p>
            </div>
            <Link href="/arsip" className="btn btn-ghost btn-sm">
              Lihat semua
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nomor</th>
                  <th>Judul</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {arsipTerbaru.map((arsip) => (
                  <tr key={arsip.id}>
                    <td className="mono">{arsip.nomor_arsip}</td>
                    <td>
                      <div className="cell-title">{arsip.judul}</div>
                      <div className="cell-sub">
                        {arsip.kode} - {arsip.pembuat}
                      </div>
                    </td>
                    <td>{formatTanggal(arsip.tanggal_arsip)}</td>
                    <td>
                      <StatusBadge status={arsip.status_retensi} />
                    </td>
                  </tr>
                ))}
                {arsipTerbaru.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty">Belum ada arsip.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="section-head">
              <div>
                <h2 className="h2">Aktivitas Terbaru</h2>
                <p className="sub">Jejak audit terakhir yang tercatat.</p>
              </div>
              <Link href="/log" className="btn btn-ghost btn-sm">
                Buka log
              </Link>
            </div>
            <ul className="timeline">
              {logTerbaru.map((log) => (
                <li key={log.id}>
                  <span className={`tl-icon ${jenisClass[log.jenis] ?? ""}`}>
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
            {logTerbaru.length === 0 ? <div className="empty">Belum ada aktivitas.</div> : null}
          </div>

          <div className="card">
            <div className="section-head">
              <div>
                <h2 className="h2">Menjelang Retensi</h2>
                <p className="sub">Arsip yang perlu ditinjau dalam waktu dekat.</p>
              </div>
              <Link href="/pemusnahan" className="btn btn-ghost btn-sm">
                Tinjau
              </Link>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {menjelang.map((arsip) => (
                <div key={arsip.id} className="spread">
                  <div>
                    <div className="cell-title">{arsip.judul}</div>
                    <div className="cell-sub">
                      {arsip.kode} - akhir retensi {formatTanggal(arsip.akhir_retensi)}
                    </div>
                  </div>
                  <StatusBadge status={arsip.status_retensi} />
                </div>
              ))}
              {menjelang.length === 0 ? <div className="empty">Tidak ada arsip mendekati retensi.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

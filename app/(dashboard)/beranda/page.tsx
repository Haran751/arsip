"use client";

import Link from "next/link";
import { useMemo } from "react";
import AnimatedNumber from "@/components/animated-number";
import Icon from "@/components/icon";
import StatusBadge from "@/components/status-badge";
import WidgetErrorBoundary from "@/components/widget-error-boundary";
import { formatTanggal, formatWaktu } from "@/lib/types";
import { useData } from "@/lib/data-store";

const jenisClass: Record<string, string> = {
  setuju: "warn",
  cron: "info",
  hapus: "danger",
};

export default function BerandaPage() {
  const { ready, data, stats } = useData();

  const arsipTerbaru = useMemo(
    () => [...data.arsip].sort((a, b) => b.tanggal_arsip.localeCompare(a.tanggal_arsip)).slice(0, 5),
    [data.arsip],
  );

  const logTerbaru = useMemo(
    () => [...data.logs].sort((a, b) => b.waktu.localeCompare(a.waktu)).slice(0, 5),
    [data.logs],
  );

  const menjelang = useMemo(
    () =>
      [...data.arsip]
        .filter((arsip) => arsip.status_retensi !== "Permanen")
        .sort((a, b) => a.akhir_retensi.localeCompare(b.akhir_retensi))
        .slice(0, 4),
    [data.arsip],
  );

  const bulanan = useMemo(() => {
    const hitung = new Map<string, number>();
    data.arsip.forEach((arsip) => {
      const key = arsip.tanggal_arsip.slice(0, 7);
      hitung.set(key, (hitung.get(key) ?? 0) + 1);
    });
    const kunci = Array.from(hitung.keys()).sort();
    if (!kunci.length) return { max: 1, items: [] };
    const terakhir = new Date(`${kunci[kunci.length - 1]}-01T00:00:00`);
    const items = Array.from({ length: 6 }, (_, offset) => {
      const tanggal = new Date(terakhir.getFullYear(), terakhir.getMonth() - 5 + offset, 1);
      const key = `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, "0")}`;
      return {
        key,
        count: hitung.get(key) ?? 0,
        tahun: String(tanggal.getFullYear()),
        bulan: String(tanggal.getMonth() + 1).padStart(2, "0"),
        label: `${tanggal.toLocaleDateString("id-ID", { month: "short" })} '${String(tanggal.getFullYear()).slice(2)}`,
        nama: `${tanggal.toLocaleDateString("id-ID", { month: "long" })} ${tanggal.getFullYear()}`,
      };
    });
    return {
      max: Math.max(1, ...items.map((item) => item.count)),
      items,
    };
  }, [data.arsip]);

  return (
    <>
      <section className="banner">
        <div className="banner-content">
          <div>
            <span className="banner-eyebrow">
              <Icon name="sparkle" size={13} /> Sistem Arsip Digital
            </span>
            <h2 className="banner-title">
              Arsip rapi,
              <br />
              kerja lebih ringan.
            </h2>
            <p className="banner-sub">
              Kelola arsip digital, atur retensi, dan awasi penyusutan dalam satu tempat. Perubahan pada data arsip
              tersimpan otomatis di perangkat ini.
            </p>
          </div>
          <div className="banner-actions">
            <Link href="/arsip?baru=1" className="btn">
              <Icon name="plus" size={16} /> Tambah arsip
            </Link>
          </div>
        </div>
        <div className="banner-stats">
          <div className="banner-stat">
            <strong>
              <AnimatedNumber value={stats.total} />
            </strong>
            <span>Total arsip</span>
          </div>
          <div className="banner-stat">
            <strong>
              <AnimatedNumber value={stats.aktif} />
            </strong>
            <span>Arsip aktif</span>
          </div>
          <div className="banner-stat">
            <strong>
              <AnimatedNumber value={stats.due} />
            </strong>
            <span>Masa retensi arsip</span>
          </div>
          <div className="banner-stat">
            <strong>
              <AnimatedNumber value={stats.penggunaAktif} />
            </strong>
            <span>Pengguna aktif</span>
          </div>
        </div>
      </section>

      <div className="grid grid-4">
        <div className="card stat-card">
          <div className="stat-head">
            <span className="stat-label">Total Arsip</span>
            <span className="stat-icon">
              <Icon name="archive" size={18} />
            </span>
          </div>
          <div className="stat-value">
            <AnimatedNumber value={stats.total} />
          </div>
          <div className="stat-note">arsip terdaftar</div>
        </div>
        <div className="card stat-card">
          <div className="stat-head">
            <span className="stat-label">Arsip Aktif</span>
            <span className="stat-icon">
              <Icon name="check" size={18} />
            </span>
          </div>
          <div className="stat-value" style={{ color: "#0b7a4b" }}>
            <AnimatedNumber value={stats.aktif} />
          </div>
          <div className="stat-note">masih dalam masa aktif</div>
        </div>
        <div className="card stat-card">
          <div className="stat-head">
            <span className="stat-label">Arsip Inaktif</span>
            <span className="stat-icon" style={{ background: "#fff4e0", color: "#a66a00" }}>
              <Icon name="clock" size={18} />
            </span>
          </div>
          <div className="stat-value" style={{ color: "#a66a00" }}>
            <AnimatedNumber value={stats.inaktif} />
          </div>
          <div className="stat-note">menunggu jadwal retensi</div>
        </div>
        <div className="card stat-card">
          <div className="stat-head">
            <span className="stat-label">Perlu Ditinjau</span>
            <span className="stat-icon" style={{ background: "#fdecec", color: "#b83a3a" }}>
              <Icon name="trash" size={18} />
            </span>
          </div>
          <div className="stat-value" style={{ color: "#b83a3a" }}>
            <AnimatedNumber value={stats.due} />
          </div>
          <div className="stat-note">arsip inaktif siap diusulkan</div>
        </div>
      </div>

      <div className="grid grid-2">
        <WidgetErrorBoundary judul="Arsip per Bulan">
          <div className="card">
            <div className="section-head">
              <div>
                <h2 className="h2">Arsip per Bulan</h2>
                <p className="sub">Klik batang untuk melihat arsip pada bulan tersebut.</p>
              </div>
              <span className="badge badge-muted">
                <Icon name="chart" size={12} /> {stats.total} arsip
              </span>
            </div>
            {!ready ? (
              <div className="skeleton" style={{ height: 186, borderRadius: 16 }} />
            ) : bulanan.items.length ? (
              <div className="chart">
                {bulanan.items.map((item, index) => (
                  <Link
                    key={item.key}
                    href={`/arsip?tahun=${item.tahun}&bulan=${item.bulan}`}
                    className="chart-col"
                    title={`${item.nama}: ${item.count} arsip`}
                    aria-label={`Lihat ${item.count} arsip dari ${item.nama}`}
                  >
                    <div
                      className="chart-bar"
                      style={{
                        height: `${Math.max(6, (item.count / bulanan.max) * 100)}%`,
                        animationDelay: `${index * 70}ms`,
                      }}
                    >
                      <span>{item.count}</span>
                    </div>
                    <span className="chart-label">{item.label}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty">Belum ada data arsip untuk ditampilkan.</div>
            )}
          </div>
        </WidgetErrorBoundary>

        <WidgetErrorBoundary judul="Aktivitas Terbaru">
          <div className="card">
            <div className="section-head">
              <div>
                <h2 className="h2">Aktivitas Terbaru</h2>
                <p className="sub">Jejak audit terakhir yang tercatat.</p>
              </div>
            </div>
            <ul className="timeline">
              {logTerbaru.map((log) => (
                <li key={log.id}>
                  <span className={`tl-icon ${jenisClass[log.jenis] ?? ""}`}>{log.jenis.slice(0, 2).toUpperCase()}</span>
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
        </WidgetErrorBoundary>
      </div>

      <div className="grid grid-2">
        <WidgetErrorBoundary judul="Arsip Terbaru">
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
                    <th>Judul</th>
                    <th>Kode</th>
                    <th>Disimpan Sampai</th>
                  </tr>
                </thead>
                <tbody>
                  {arsipTerbaru.map((arsip) => (
                    <tr key={arsip.id}>
                      <td>
                        <div className="cell-title">{arsip.judul}</div>
                        <div className="cell-sub mono">{arsip.nomor_arsip}</div>
                      </td>
                      <td>
                        <span className="badge badge-muted">{arsip.kode}</span>
                      </td>
                      <td>
                        <StatusBadge status={arsip.status_retensi} />
                        <div className="cell-sub">{formatTanggal(arsip.akhir_retensi)}</div>
                      </td>
                    </tr>
                  ))}
                  {arsipTerbaru.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <div className="empty">Belum ada arsip.</div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </WidgetErrorBoundary>

        <WidgetErrorBoundary judul="Menjelang Retensi">
          <div className="card">
            <div className="section-head">
              <div>
                <h2 className="h2">Menjelang Retensi</h2>
                <p className="sub">Arsip yang perlu ditinjau dalam waktu dekat.</p>
              </div>
              <Link href="/penyusutan" className="btn btn-ghost btn-sm">
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
        </WidgetErrorBoundary>
      </div>
    </>
  );
}

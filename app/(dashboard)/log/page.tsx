"use client";

import { useMemo, useState } from "react";
import { formatWaktu, type LogEntry } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import { downloadExcel } from "@/lib/export";

const jenisClass: Record<string, string> = {
  setuju: "warn",
  cron: "info",
  hapus: "danger",
};

const JENIS_LABEL: Record<LogEntry["jenis"], string> = {
  buat: "Tambah",
  ubah: "Ubah",
  hapus: "Hapus",
  setuju: "Persetujuan",
  login: "Login",
  ekspor: "Ekspor",
  cron: "Cron",
};

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

function tanggalLokal(value: string) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function LogPage() {
  const { data, catatLog, toast } = useDemo();
  const [tahun, setTahun] = useState("");
  const [bulan, setBulan] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [pengguna, setPengguna] = useState("");
  const [aksi, setAksi] = useState("");
  const [cari, setCari] = useState("");

  const daftarTahun = useMemo(
    () =>
      Array.from(new Set(data.logs.map((log) => String(new Date(log.waktu).getFullYear()))))
        .sort()
        .reverse(),
    [data.logs],
  );

  const daftarPengguna = useMemo(
    () => Array.from(new Set([...data.users.map((user) => user.nama), ...data.logs.map((log) => log.user)])).sort(),
    [data.logs, data.users],
  );

  const filtered = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return data.logs
      .filter((log) => {
        const date = new Date(log.waktu);
        const cocokTahun = !tahun || String(date.getFullYear()) === tahun;
        const cocokBulan = !bulan || String(date.getMonth() + 1).padStart(2, "0") === bulan;
        const cocokTanggal = !tanggal || tanggalLokal(log.waktu) === tanggal;
        const cocokPengguna = !pengguna || log.user === pengguna;
        const cocokAksi = !aksi || log.jenis === aksi;
        const cocokCari = !kata || `${log.aksi} ${log.target} ${log.user}`.toLowerCase().includes(kata);
        return cocokTahun && cocokBulan && cocokTanggal && cocokPengguna && cocokAksi && cocokCari;
      })
      .sort((a, b) => b.waktu.localeCompare(a.waktu));
  }, [aksi, bulan, cari, data.logs, pengguna, tahun, tanggal]);

  const resetFilter = () => {
    setTahun("");
    setBulan("");
    setTanggal("");
    setPengguna("");
    setAksi("");
    setCari("");
    toast("Filter log dibersihkan.", "info");
  };

  const ekspor = () => {
    if (!filtered.length) {
      toast("Tidak ada data log untuk diekspor.", "error");
      return;
    }
    downloadExcel(
      "log-aktivitas.xls",
      ["Waktu", "Pengguna", "Aksi", "Target", "Sumber", "Jenis"],
      filtered.map((log) => [
        formatWaktu(log.waktu),
        log.user,
        log.aksi,
        log.target,
        log.sumber,
        JENIS_LABEL[log.jenis],
      ]),
    );
    catatLog("Mengekspor log aktivitas", `${filtered.length} baris`, "ekspor");
    toast(`${filtered.length} aktivitas diekspor.`);
  };

  return (
    <>
      <div className="note">
        <span className="note-mark" />
        <span>
          Log aktivitas bersifat <strong>append-only</strong>. Perubahan langsung di database tetap terdeteksi melalui
          trigger dan ditampilkan sebagai sumber <strong>Database</strong>.
        </span>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Filter Log</h2>
            <p className="sub">Telusuri aktivitas berdasarkan periode, pengguna, dan jenis aksi.</p>
          </div>
          <div className="actions-row">
            <button type="button" className="btn btn-ghost" onClick={resetFilter}>
              Reset
            </button>
            <button type="button" className="btn btn-ghost" onClick={ekspor}>
              Ekspor Excel
            </button>
          </div>
        </div>

        <div className="toolbar" style={{ marginBottom: 0 }}>
          <input
            className="input input-search"
            placeholder="Cari aksi, target, atau pengguna..."
            value={cari}
            onChange={(event) => setCari(event.target.value)}
          />
          <select className="select" value={tahun} onChange={(event) => setTahun(event.target.value)}>
            <option value="">Semua tahun</option>
            {daftarTahun.map((item) => (
              <option key={item} value={item}>
                Tahun {item}
              </option>
            ))}
          </select>
          <select className="select" value={bulan} onChange={(event) => setBulan(event.target.value)}>
            <option value="">Semua bulan</option>
            {BULAN.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input className="input" type="date" value={tanggal} onChange={(event) => setTanggal(event.target.value)} />
          <select className="select" value={pengguna} onChange={(event) => setPengguna(event.target.value)}>
            <option value="">Semua pengguna</option>
            {daftarPengguna.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="select" value={aksi} onChange={(event) => setAksi(event.target.value)}>
            <option value="">Semua aksi</option>
            {Object.entries(JENIS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn"
            onClick={() => toast(`Filter diterapkan: ${filtered.length} aktivitas.`, "info")}
          >
            Terapkan
          </button>
        </div>

        <div className="chips" style={{ marginTop: 14 }}>
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
          {tanggal ? (
            <span className="chip">
              Tanggal: <strong>{tanggal}</strong>
              <button type="button" onClick={() => setTanggal("")} aria-label="Hapus filter tanggal">
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
          {aksi ? (
            <span className="chip">
              Aksi: <strong>{JENIS_LABEL[aksi as LogEntry["jenis"]]}</strong>
              <button type="button" onClick={() => setAksi("")} aria-label="Hapus filter aksi">
                &times;
              </button>
            </span>
          ) : null}
          <span className="chip">
            Total: <strong>{filtered.length} aktivitas</strong>
          </span>
        </div>

        <ul className="timeline">
          {filtered.map((log) => (
            <li key={log.id}>
              <span className={`tl-icon ${jenisClass[log.jenis] ?? ""}`}>{log.jenis.slice(0, 2).toUpperCase()}</span>
              <div className="tl-body">
                <div className="spread" style={{ alignItems: "flex-start" }}>
                  <div>
                    <div className="tl-title">{log.aksi}</div>
                    <div className="tl-meta">
                      {log.target} - oleh {log.user}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge ${log.sumber === "Database" ? "badge-info" : "badge-muted"}`}>
                      {log.sumber}
                    </span>
                    <div className="tl-meta" style={{ marginTop: 4 }}>
                      {formatWaktu(log.waktu)}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 ? <div className="empty">Tidak ada aktivitas yang cocok dengan filter.</div> : null}
      </div>
    </>
  );
}

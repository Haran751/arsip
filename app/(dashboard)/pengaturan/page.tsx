"use client";

import { useSyncExternalStore, useState } from "react";
import Icon from "@/components/icon";
import TombolMemuat from "@/components/loading-button";
import { usePreferences } from "@/components/preferences";
import { useData } from "@/lib/data-store";
import { buatUploadLogoAksi } from "@/lib/actions/instansi";
import type { Instansi } from "@/lib/types";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const media = window.matchMedia(MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export default function PengaturanPage() {
  const { reduceMotion, setReduceMotion } = usePreferences();
  const { currentUser, isAdmin, data, saveInstansi, refreshData, toast } = useData();
  const sistem = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false
  );

  const [instansi, setInstansi] = useState<Instansi>(data.instansi);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState("");

  const simpanKonfigurasi = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMenyimpan(true);
    try {
      let logo_path = instansi.logo_path ?? "";

      if (logoFile) {
        const ext = logoFile.name.split(".").pop() ?? "";
        const unggah = await buatUploadLogoAksi(ext);
        if (!unggah.ok || !unggah.signedUrl || !unggah.path) {
          throw new Error(unggah.message ?? "Gagal menyiapkan unggahan logo.");
        }

        const res = await fetch(unggah.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": logoFile.type, "x-upsert": "true" },
          body: logoFile,
        });
        if (!res.ok) throw new Error("Gagal mengunggah logo ke penyimpanan.");
        logo_path = unggah.path;
      }

      const hasil = await saveInstansi({ ...instansi, logo_path });
      if (!hasil.ok) {
        setError(hasil.message ?? "Gagal menyimpan konfigurasi.");
        return;
      }

      setInstansi({ ...instansi, logo_path });
      setLogoFile(null);
      setLogoPreview("");
      toast(hasil.message ?? "Konfigurasi instansi disimpan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan konfigurasi.");
    } finally {
      setMenyimpan(false);
    }
  };

  const sumberLogo = logoPreview || (instansi.logo_path ? `/api/logo?v=${encodeURIComponent(instansi.logo_path)}` : "");

  return (
    <>
      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Preferensi Tampilan</h2>
            <p className="sub">Sesuaikan animasi agar nyaman digunakan di perangkat Anda.</p>
          </div>
          <span className="badge badge-muted">
            <Icon name="settings" size={12} /> {currentUser.role}
          </span>
        </div>

        <div className="pref-row">
          <div>
            <strong>Kurangi animasi</strong>
            <p>
              Mematikan animasi non-esensial seperti fade, pergerakan blob latar, dan transisi panel. Berguna untuk perangkat
              kantor berspesifikasi rendah atau pengguna yang sensitif terhadap gerakan.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reduceMotion}
            aria-label="Kurangi animasi"
            className="switch"
            onClick={() => {
              setReduceMotion(!reduceMotion);
              toast(!reduceMotion ? "Animasi dikurangi." : "Animasi diaktifkan kembali.", "info");
            }}
          />
        </div>

        <div className="pref-row">
          <div>
            <strong>Preferensi sistem terdeteksi</strong>
            <p>
              Perangkat Anda {sistem ? "meminta pengurangan animasi" : "tidak meminta pengurangan animasi"}. Pengaturan di
              halaman ini selalu diutamakan.
            </p>
          </div>
          <span className={`badge ${sistem ? "badge-warn" : "badge-aktif"}`}>
            {sistem ? "Reduced motion" : "Normal"}
          </span>
        </div>

        <div className="pref-row">
          <div>
            <strong>Muat ulang data</strong>
            <p>Ambil data arsip, folder, kode, usulan, dan log terbaru dari server.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void refreshData()}>
            Muat ulang
          </button>
        </div>
      </div>

      {isAdmin ? (
        <div className="card">
          <div className="section-head">
            <div>
              <h2 className="h2">Konfigurasi Instansi & Logo</h2>
              <p className="sub">Data ini dipakai pada kepala dan kaki laporan ekspor PDF/DOCX.</p>
            </div>
            <span className="badge badge-aktif">
              <Icon name="settings" size={12} /> Admin
            </span>
          </div>

          <form onSubmit={simpanKonfigurasi}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="unit-pengolah">Unit pengolah</label>
                <input
                  id="unit-pengolah"
                  className="input"
                  value={instansi.unit_pengolah}
                  onChange={(event) => setInstansi({ ...instansi, unit_pengolah: event.target.value })}
                  placeholder="Contoh: Sekretariat"
                />
              </div>
              <div className="field">
                <label htmlFor="nama-pimpinan">Nama pimpinan central file</label>
                <input
                  id="nama-pimpinan"
                  className="input"
                  value={instansi.nama_pimpinan}
                  onChange={(event) => setInstansi({ ...instansi, nama_pimpinan: event.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="field">
                <label htmlFor="nip-pimpinan">NIP pimpinan</label>
                <input
                  id="nip-pimpinan"
                  className="input"
                  value={instansi.nip_pimpinan}
                  onChange={(event) => setInstansi({ ...instansi, nip_pimpinan: event.target.value })}
                  placeholder="NIP"
                />
              </div>
              <div className="field">
                <label htmlFor="nama-pengelola">Nama pengelola central file</label>
                <input
                  id="nama-pengelola"
                  className="input"
                  value={instansi.nama_pengelola}
                  onChange={(event) => setInstansi({ ...instansi, nama_pengelola: event.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="field">
                <label htmlFor="nip-pengelola">NIP pengelola</label>
                <input
                  id="nip-pengelola"
                  className="input"
                  value={instansi.nip_pengelola}
                  onChange={(event) => setInstansi({ ...instansi, nip_pengelola: event.target.value })}
                  placeholder="NIP"
                />
              </div>
            </div>

            <div className="logo-config">
              <div className="logo-preview">
                {sumberLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sumberLogo} alt="Logo instansi" />
                ) : (
                  <span>Belum ada logo</span>
                )}
              </div>
              <div className="logo-actions">
                <label className="btn btn-ghost btn-sm" htmlFor="logo-instansi">
                  <Icon name="upload" size={14} /> Pilih logo
                </label>
                <input
                  id="logo-instansi"
                  type="file"
                  accept="image/png,image/jpeg"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (!/^image\/(png|jpeg)$/.test(file.type)) {
                      toast("Logo harus berupa PNG atau JPG.", "error");
                      event.target.value = "";
                      return;
                    }
                    if (file.size > 1024 * 1024) {
                      toast("Ukuran logo maksimal 1 MB.", "error");
                      event.target.value = "";
                      return;
                    }
                    setLogoFile(file);
                    setLogoPreview(URL.createObjectURL(file));
                  }}
                />
                {instansi.logo_path || logoFile ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview("");
                      setInstansi({ ...instansi, logo_path: "" });
                    }}
                  >
                    Hapus logo
                  </button>
                ) : null}
                <p className="field-hint">Gunakan PNG atau JPG, maksimal 1 MB. Logo tampil di kepala laporan.</p>
              </div>
            </div>

            {error ? <div className="error-box" style={{ marginTop: 14 }}>{error}</div> : null}

            <div className="actions-row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
              <TombolMemuat type="submit" className="btn" loading={menyimpan} loadingText="Menyimpan...">
                Simpan konfigurasi
              </TombolMemuat>
            </div>
          </form>
        </div>
      ) : null}

      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Tentang Aplikasi</h2>
            <p className="sub">Ringkasan penyimpanan dan autentikasi.</p>
          </div>
        </div>
        <div className="meta-grid" style={{ marginTop: 0 }}>
          <div className="meta-item">
            <span>Penyimpanan data</span>
            <strong>Supabase PostgreSQL</strong>
          </div>
          <div className="meta-item">
            <span>Autentikasi</span>
            <strong>Supabase Auth</strong>
          </div>
          <div className="meta-item">
            <span>Berkas</span>
            <strong>Supabase Storage privat</strong>
          </div>
          <div className="meta-item">
            <span>Akun pengguna</span>
            <strong>Tersimpan di Supabase</strong>
          </div>
        </div>
        <div className="note" style={{ marginTop: 16 }}>
          <span className="note-mark" />
          <span>
            Login dan manajemen pengguna memakai Supabase Auth. Data arsip, folder, kode, usulan, dan log tersimpan di
            Supabase PostgreSQL.
          </span>
        </div>
      </div>
    </>
  );
}

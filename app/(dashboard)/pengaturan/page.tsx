"use client";

import { useSyncExternalStore } from "react";
import Icon from "@/components/icon";
import { usePreferences } from "@/components/preferences";
import { useDemo } from "@/lib/demo-store";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const media = window.matchMedia(MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export default function PengaturanPage() {
  const { reduceMotion, setReduceMotion } = usePreferences();
  const { currentUser, resetDemo, toast } = useDemo();
  const sistem = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false
  );

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
            <strong>Data demo</strong>
            <p>Kembalikan seluruh arsip, kode, pengguna, usulan, dan log ke kondisi awal. Perubahan tersimpan di browser ini.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={resetDemo}>
            Reset data demo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Tentang Mode Demo</h2>
            <p className="sub">Frontend berjalan penuh tanpa database.</p>
          </div>
        </div>
        <div className="meta-grid" style={{ marginTop: 0 }}>
          <div className="meta-item">
            <span>Penyimpanan</span>
            <strong>localStorage browser</strong>
          </div>
          <div className="meta-item">
            <span>Autentikasi</span>
            <strong>Cookie sesi demo</strong>
          </div>
          <div className="meta-item">
            <span>Berkas</span>
            <strong>Metadata saja</strong>
          </div>
          <div className="meta-item">
            <span>Database</span>
            <strong>Belum terhubung</strong>
          </div>
        </div>
        <div className="note" style={{ marginTop: 16 }}>
          <span className="note-mark" />
          <span>
            Integrasi Prisma, Supabase, storage privat, dan job retensi akan ditambahkan pada tahap berikutnya. Seluruh alur
            antarmuka sudah mengikuti peran Admin, Operator, dan Pimpinan.
          </span>
        </div>
      </div>
    </>
  );
}

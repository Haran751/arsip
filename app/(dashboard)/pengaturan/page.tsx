"use client";

import { useSyncExternalStore } from "react";
import Icon from "@/components/icon";
import { usePreferences } from "@/components/preferences";
import { useData } from "@/lib/data-store";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const media = window.matchMedia(MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export default function PengaturanPage() {
  const { reduceMotion, setReduceMotion } = usePreferences();
  const { currentUser, refreshData, toast } = useData();
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
            <strong>Muat ulang data</strong>
            <p>Ambil data arsip, folder, kode, usulan, dan log terbaru dari server.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void refreshData()}>
            Muat ulang
          </button>
        </div>
      </div>

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

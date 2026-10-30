"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/lib/demo-store";

export default function GantiPasswordPage() {
  const { currentUser, changePassword, toast } = useDemo();
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState(false);

  const simpan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSukses(false);

    if (baru.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }
    if (baru !== konfirmasi) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    if (baru === lama) {
      setError("Password baru harus berbeda dari password lama.");
      return;
    }

    const hasil = changePassword(lama, baru);
    if (!hasil.ok) {
      setError(hasil.message ?? "Gagal mengganti password.");
      return;
    }
    toast(hasil.message ?? "Password berhasil diganti.");
    setLama("");
    setBaru("");
    setKonfirmasi("");
    setSukses(true);
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">EA</span>
          <div>
            <div className="brand-name" style={{ color: "var(--foreground)" }}>
              E-Arsip
            </div>
            <div className="brand-sub">Keamanan akun</div>
          </div>
        </div>

        <h1 className="login-title">Ganti password</h1>
        <p className="login-sub">
          Akun <strong>{currentUser.nama}</strong> ({currentUser.username}). Minimal 6 karakter. Mode demo tidak menyimpan
          password secara permanen.
        </p>

        {error ? <div className="error-box">{error}</div> : null}
        {sukses ? (
          <div className="note" style={{ marginBottom: 14 }}>
            <span className="note-mark" />
            <span>Password berhasil diganti pada sesi demo ini.</span>
          </div>
        ) : null}

        <form onSubmit={simpan}>
          <div className="field">
            <label htmlFor="lama">Password lama</label>
            <input
              id="lama"
              value={lama}
              onChange={(event) => setLama(event.target.value)}
              type="password"
              className="input"
              placeholder="Password saat ini"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="baru">Password baru</label>
            <input
              id="baru"
              value={baru}
              onChange={(event) => setBaru(event.target.value)}
              type="password"
              className="input"
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="konfirmasi">Konfirmasi password baru</label>
            <input
              id="konfirmasi"
              value={konfirmasi}
              onChange={(event) => setKonfirmasi(event.target.value)}
              type="password"
              className="input"
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-block" style={{ marginTop: 16 }}>
            Simpan Password
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: "center" }}>
          <Link href="/profil" className="sub" style={{ fontWeight: 700 }}>
            Kembali ke profil
          </Link>
        </div>
      </div>
    </main>
  );
}

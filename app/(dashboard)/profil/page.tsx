"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Modal from "@/components/modal";
import { formatWaktu, inisial } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";

export default function ProfilPage() {
  const { data, currentUser, updateProfile, toast } = useDemo();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ nama: currentUser.nama, email: currentUser.email });
  const [formError, setFormError] = useState("");

  const aktivitas = useMemo(
    () =>
      data.logs
        .filter((log) => log.user === currentUser.nama)
        .sort((a, b) => b.waktu.localeCompare(a.waktu))
        .slice(0, 5),
    [currentUser.nama, data.logs],
  );

  const bukaEdit = () => {
    setForm({ nama: currentUser.nama, email: currentUser.email });
    setFormError("");
    setEditOpen(true);
  };

  const simpan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasil = updateProfile({ nama: form.nama, email: form.email });
    if (!hasil.ok) {
      setFormError(hasil.message ?? "Gagal memperbarui profil.");
      return;
    }
    toast(hasil.message ?? "Profil diperbarui.");
    setEditOpen(false);
  };

  return (
    <>
      <div className="card">
        <div className="profile-head">
          <span className="avatar avatar-lg">{inisial(currentUser.nama)}</span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2 className="h2">{currentUser.nama}</h2>
            <p className="sub">
              {currentUser.role} - {currentUser.email}
            </p>
            <div className="row" style={{ marginTop: 10 }}>
              <span className={`badge ${currentUser.aktif ? "badge-aktif" : "badge-danger"}`}>
                {currentUser.aktif ? "Akun aktif" : "Akun nonaktif"}
              </span>
              <span className="badge badge-info">Mode demo</span>
            </div>
          </div>
          <div className="actions-row">
            <button type="button" className="btn btn-ghost" onClick={bukaEdit}>
              Ubah Profil
            </button>
            <Link href="/ganti-password" className="btn">
              Ganti Password
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-head">
            <div>
              <h2 className="h2">Informasi Akun</h2>
              <p className="sub">Data dasar pengguna yang sedang masuk.</p>
            </div>
          </div>
          <dl className="kv">
            <dt>Nama lengkap</dt>
            <dd>{currentUser.nama}</dd>
            <dt>Username</dt>
            <dd className="mono">{currentUser.username}</dd>
            <dt>Email</dt>
            <dd>{currentUser.email}</dd>
            <dt>Peran</dt>
            <dd>{currentUser.role}</dd>
            <dt>Status</dt>
            <dd>{currentUser.aktif ? "Aktif" : "Nonaktif"}</dd>
            <dt>Login terakhir</dt>
            <dd>{formatWaktu(currentUser.last_login)}</dd>
          </dl>
        </div>

        <div className="card">
          <div className="section-head">
            <div>
              <h2 className="h2">Keamanan</h2>
              <p className="sub">Pengaturan akses pada mode demo.</p>
            </div>
          </div>
          <div className="stack" style={{ gap: 12 }}>
            <div className="spread">
              <div>
                <div className="cell-title">Password</div>
                <div className="cell-sub">Ganti password akun demo</div>
              </div>
              <Link href="/ganti-password" className="btn btn-ghost btn-sm">
                Ubah
              </Link>
            </div>
            <div className="spread">
              <div>
                <div className="cell-title">Wajib ganti password</div>
                <div className="cell-sub">Tidak aktif pada akun ini</div>
              </div>
              <span className="badge badge-muted">Tidak</span>
            </div>
            <div className="spread">
              <div>
                <div className="cell-title">Sesi perangkat</div>
                <div className="cell-sub">1 sesi aktif (browser ini)</div>
              </div>
              <span className="badge badge-aktif">Aman</span>
            </div>
          </div>
          <div className="note" style={{ marginTop: 16 }}>
            <span className="note-mark" />
            <span>Perubahan akun disimpan di browser selama mode demo dan belum tersinkron ke database.</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Aktivitas Saya</h2>
            <p className="sub">Lima aktivitas terakhir yang tercatat atas nama Anda.</p>
          </div>
          <Link href="/log" className="btn btn-ghost btn-sm">
            Buka log
          </Link>
        </div>
        <ul className="timeline">
          {aktivitas.map((log) => (
            <li key={log.id}>
              <span className="tl-icon">{log.jenis.slice(0, 2).toUpperCase()}</span>
              <div className="tl-body">
                <div className="tl-title">{log.aksi}</div>
                <div className="tl-meta">
                  {log.target} - {formatWaktu(log.waktu)}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {aktivitas.length === 0 ? <div className="empty">Belum ada aktivitas atas nama Anda.</div> : null}
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Ubah Profil"
        subtitle="Perubahan nama akan tampil di seluruh aplikasi."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(false)}>
              Batal
            </button>
            <button type="submit" form="form-profil" className="btn">
              Simpan Perubahan
            </button>
          </>
        }
      >
        <form id="form-profil" onSubmit={simpan}>
          {formError ? <div className="error-box">{formError}</div> : null}
          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="profil-nama">Nama lengkap</label>
              <input
                id="profil-nama"
                className="input"
                value={form.nama}
                onChange={(event) => setForm({ ...form, nama: event.target.value })}
                required
              />
            </div>
            <div className="field field-full">
              <label htmlFor="profil-email">Email</label>
              <input
                id="profil-email"
                type="email"
                className="input"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-note">Username dan peran akun hanya dapat diubah oleh Admin melalui halaman Pengguna.</div>
        </form>
      </Modal>
    </>
  );
}

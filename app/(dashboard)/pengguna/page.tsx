"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/modal";
import { formatWaktu, inisial, type DemoUser, type Role } from "@/lib/demo-data";
import { useDemo, type UserInput } from "@/lib/demo-store";

const ROLES: Role[] = ["Admin", "Operator", "Pimpinan"];

type FormState = {
  nama: string;
  username: string;
  email: string;
  role: Role;
  aktif: boolean;
};

export default function PenggunaPage() {
  const { data, stats, isAdmin, currentUser, saveUser, resetUserPassword, toast } = useDemo();
  const [cari, setCari] = useState("");
  const [filterPeran, setFilterPeran] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DemoUser | null>(null);
  const [resetTarget, setResetTarget] = useState<DemoUser | null>(null);
  const [form, setForm] = useState<FormState>({
    nama: "",
    username: "",
    email: "",
    role: "Operator",
    aktif: true,
  });
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return data.users.filter((user) => {
      const cocokCari = !kata || `${user.nama} ${user.username} ${user.email}`.toLowerCase().includes(kata);
      const cocokPeran = !filterPeran || user.role === filterPeran;
      const cocokStatus = !filterStatus || (filterStatus === "aktif" ? user.aktif : !user.aktif);
      return cocokCari && cocokPeran && cocokStatus;
    });
  }, [cari, data.users, filterPeran, filterStatus]);

  const bukaTambah = () => {
    setEditing(null);
    setForm({ nama: "", username: "", email: "", role: "Operator", aktif: true });
    setFormError("");
    setFormOpen(true);
  };

  const bukaUbah = (user: DemoUser) => {
    setEditing(user);
    setForm({ nama: user.nama, username: user.username, email: user.email, role: user.role, aktif: user.aktif });
    setFormError("");
    setFormOpen(true);
  };

  const simpan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: UserInput = {
      nama: form.nama,
      username: form.username,
      email: form.email,
      role: form.role,
      aktif: form.aktif,
    };
    const hasil = saveUser(input, editing?.id);
    if (!hasil.ok) {
      setFormError(hasil.message ?? "Gagal menyimpan pengguna.");
      return;
    }
    toast(hasil.message ?? "Pengguna disimpan.");
    setFormOpen(false);
  };

  const reset = () => {
    if (!resetTarget) return;
    const hasil = resetUserPassword(resetTarget.id);
    toast(hasil.message ?? (hasil.ok ? "Password direset." : "Gagal mereset password."), hasil.ok ? "success" : "error");
    if (hasil.ok) setResetTarget(null);
  };

  return (
    <>
      <div className="grid grid-3">
        <div className="card stat-card">
          <div className="stat-label">Total Pengguna</div>
          <div className="stat-value">{stats.totalPengguna}</div>
          <div className="stat-note">akun terdaftar</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Aktif</div>
          <div className="stat-value" style={{ color: "#0b7a4b" }}>
            {stats.penggunaAktif}
          </div>
          <div className="stat-note">dapat masuk aplikasi</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Nonaktif</div>
          <div className="stat-value" style={{ color: "#b83a3a" }}>
            {stats.totalPengguna - stats.penggunaAktif}
          </div>
          <div className="stat-note">akses ditangguhkan</div>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2 className="h2">Daftar Pengguna</h2>
            <p className="sub">Kelola akun, peran, dan status akses pengguna.</p>
          </div>
          <button
            type="button"
            className="btn"
            onClick={bukaTambah}
            disabled={!isAdmin}
            title={!isAdmin ? "Hanya Admin yang dapat mengelola pengguna" : ""}
          >
            + Tambah Pengguna
          </button>
        </div>

        <div className="toolbar">
          <input
            className="input input-search"
            placeholder="Cari nama, username, atau email..."
            value={cari}
            onChange={(event) => setCari(event.target.value)}
          />
          <select className="select" value={filterPeran} onChange={(event) => setFilterPeran(event.target.value)}>
            <option value="">Semua peran</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select className="select" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="">Semua status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>

        {!isAdmin ? (
          <div className="form-note" style={{ marginBottom: 14 }}>
            Hanya Admin yang dapat menambah, mengubah, dan mereset pengguna. Anda tetap dapat melihat daftar akun.
          </div>
        ) : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Username</th>
                <th>Email</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Login Terakhir</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="row">
                      <span className="avatar" style={{ width: 30, height: 30, flexBasis: 30, fontSize: 10 }}>
                        {inisial(user.nama)}
                      </span>
                      <div>
                        <div className="cell-title">{user.nama}</div>
                        {user.id === currentUser.id ? <div className="cell-sub">akun Anda</div> : null}
                      </div>
                    </div>
                  </td>
                  <td className="mono">{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === "Admin" ? "badge-aktif" : "badge-muted"}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${user.aktif ? "badge-aktif" : "badge-danger"}`}>
                      {user.aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>{formatWaktu(user.last_login)}</td>
                  <td>
                    <div className="actions-row">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => bukaUbah(user)} disabled={!isAdmin}>
                        Ubah
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setResetTarget(user)}
                        disabled={!isAdmin}
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">Tidak ada pengguna yang cocok.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="form-note">
          Pengguna baru tersimpan pada data demo di browser. Login untuk akun baru akan aktif setelah autentikasi berbasis
          database terhubung.
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Ubah Pengguna" : "Tambah Pengguna"}
        subtitle="Atur identitas, peran, dan status akses akun."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Batal
            </button>
            <button type="submit" form="form-pengguna" className="btn">
              {editing ? "Simpan Perubahan" : "Simpan Pengguna"}
            </button>
          </>
        }
      >
        <form id="form-pengguna" onSubmit={simpan}>
          {formError ? <div className="error-box">{formError}</div> : null}
          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="nama-pengguna">Nama lengkap</label>
              <input
                id="nama-pengguna"
                className="input"
                value={form.nama}
                onChange={(event) => setForm({ ...form, nama: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="username-pengguna">Username</label>
              <input
                id="username-pengguna"
                className="input mono"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value.toLowerCase() })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email-pengguna">Email</label>
              <input
                id="email-pengguna"
                type="email"
                className="input"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="peran-pengguna">Peran</label>
              <select
                id="peran-pengguna"
                className="select"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Status akun</label>
              <label className="check-row" style={{ border: "1px solid var(--border)", background: "#fff" }}>
                <input
                  type="checkbox"
                  checked={form.aktif}
                  onChange={(event) => setForm({ ...form, aktif: event.target.checked })}
                />
                <span className="cell-title">{form.aktif ? "Aktif" : "Nonaktif"}</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title="Reset Password"
        width={460}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setResetTarget(null)}>
              Batal
            </button>
            <button type="button" className="btn" onClick={reset}>
              Reset Password
            </button>
          </>
        }
      >
        <p className="sub">
          Reset password untuk <strong>{resetTarget?.nama}</strong> menjadi <span className="mono">EArsip#2026</span>?
          Pengguna disarankan mengganti password setelah masuk.
        </p>
      </Modal>
    </>
  );
}

import Icon from "@/components/icon";
import TombolMemuat from "@/components/loading-button";
import { redirect } from "next/navigation";
import { ambilPenggunaSesi } from "@/lib/session";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = params.error;

  const pengguna = await ambilPenggunaSesi();
  if (pengguna) redirect("/beranda");

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">EA</span>
          <div>
            <div className="brand-name">E-Arsip</div>
            <div className="brand-sub">Sistem Arsip Digital</div>
          </div>
        </div>
        <h1 className="login-title">Masuk ke aplikasi</h1>
        <p className="login-sub">Gunakan username dan password yang diberikan oleh Admin.</p>

        {error === "lengkap" ? <div className="error-box">Username dan password wajib diisi.</div> : null}
        {error === "1" ? <div className="error-box">Username atau password salah, atau akun tidak aktif.</div> : null}

        <form action={loginAction}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              className="input"
              placeholder="Masukkan username"
              autoComplete="username"
              required
            />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              placeholder="Password akun"
              autoComplete="current-password"
              required
            />
          </div>
          <TombolMemuat type="submit" className="btn btn-block" style={{ marginTop: 16 }} loadingText="Memproses...">
            <Icon name="logout" size={16} /> Masuk
          </TombolMemuat>
        </form>
      </div>
    </main>
  );
}

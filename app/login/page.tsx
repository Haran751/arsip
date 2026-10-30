import { loginDemo } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">EA</span>
          <div>
            <div className="brand-name" style={{ color: "var(--foreground)" }}>
              E-Arsip
            </div>
            <div className="brand-sub">Sistem Arsip Digital</div>
          </div>
        </div>

        <h1 className="login-title">Masuk ke aplikasi</h1>
        <p className="login-sub">
          Mode demo tanpa database. Pilih salah satu akun di bawah atau ketik username yang tersedia, lalu masuk.
        </p>

        {error ? <div className="error-box">Username tidak ditemukan. Gunakan salah satu akun demo.</div> : null}

        <form action={loginDemo}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              className="input"
              placeholder="admin"
              defaultValue="admin"
              autoComplete="username"
            />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              placeholder="Bebas, tidak divalidasi di demo"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-block" style={{ marginTop: 16 }}>
            Masuk
          </button>
        </form>

        <div className="demo-box">
          <div className="demo-box-title">Akun demo</div>
          <div className="demo-accounts">
            <form action={loginDemo} className="demo-account">
              <input type="hidden" name="username" value="admin" />
              <button type="submit">
                <span>
                  <strong>Admin</strong> - Rahmat Hidayat
                </span>
                <small>akses penuh</small>
              </button>
            </form>
            <form action={loginDemo} className="demo-account">
              <input type="hidden" name="username" value="operator" />
              <button type="submit">
                <span>
                  <strong>Operator</strong> - Sinta Maharani
                </span>
                <small>kelola arsip</small>
              </button>
            </form>
            <form action={loginDemo} className="demo-account">
              <input type="hidden" name="username" value="pimpinan" />
              <button type="submit">
                <span>
                  <strong>Pimpinan</strong> - Budi Santoso
                </span>
                <small>lihat laporan</small>
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

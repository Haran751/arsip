import Icon from "@/components/icon";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="login-page">
      <div className="login-shell">
        <aside className="login-hero">
          <div>
            <div className="login-brand">
              <span className="brand-mark">EA</span>
              <div>
                <div className="brand-name">E-Arsip</div>
                <div className="brand-sub">Sistem Arsip Digital</div>
              </div>
            </div>
            <h2>Arsip digital yang rapi, aman, dan mudah ditelusuri.</h2>
            <p>
              Kelola arsip kantor, atur masa retensi, dan awasi pemusnahan dengan jejak audit yang jelas. Semua teks dan alur
              dirancang untuk kebutuhan administrasi sehari-hari.
            </p>
            <div className="login-features">
              <div className="login-feature">
                <span>
                  <Icon name="shield" size={15} />
                </span>
                Peran Admin, Operator, dan Pimpinan dengan hak akses berbeda.
              </div>
              <div className="login-feature">
                <span>
                  <Icon name="clock" size={15} />
                </span>
                Retensi otomatis dan pengingat arsip yang jatuh tempo.
              </div>
              <div className="login-feature">
                <span>
                  <Icon name="activity" size={15} />
                </span>
                Log aktivitas append-only beserta sumber perubahan data.
              </div>
            </div>
          </div>
          <div className="login-hero-foot">E-Arsip - Pratinjau antarmuka mode demo frontend.</div>
        </aside>

        <div className="login-card">
          <h1 className="login-title">Masuk ke aplikasi</h1>
          <p className="login-sub">
            Mode demo tanpa database. Pilih salah satu akun di bawah untuk langsung masuk, atau ketik username yang tersedia.
            Password tidak divalidasi pada mode demo.
          </p>

          {error ? <div className="error-box">Username tidak ditemukan. Gunakan salah satu akun demo.</div> : null}

          <form action="/api/demo-login" method="post">
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
              <label htmlFor="password">Password (opsional di mode demo)</label>
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
              <Icon name="logout" size={16} /> Masuk
            </button>
          </form>

          <div className="demo-box">
            <div className="demo-box-title">Akun demo</div>
            <div className="demo-accounts">
              <form action="/api/demo-login" method="post" className="demo-account">
                <input type="hidden" name="username" value="admin" />
                <button type="submit">
                  <span>
                    <strong>Admin</strong> - Rahmat Hidayat
                  </span>
                  <small>akses penuh</small>
                </button>
              </form>
              <form action="/api/demo-login" method="post" className="demo-account">
                <input type="hidden" name="username" value="operator" />
                <button type="submit">
                  <span>
                    <strong>Operator</strong> - Sinta Maharani
                  </span>
                  <small>kelola arsip</small>
                </button>
              </form>
              <form action="/api/demo-login" method="post" className="demo-account">
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
      </div>
    </main>
  );
}


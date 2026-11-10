"use client";

// Error paling luar: menggantikan root layout, jadi harus mendefinisikan html/body sendiri.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const errorId = typeof error.digest === "string" && error.digest ? error.digest.slice(0, 8) : undefined;

  return (
    <html lang="id">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5fbf7", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 420, margin: "0 auto", padding: 32, textAlign: "center" }}>
          <div
            style={{ width: 56, height: 56, margin: "0 auto 14px", borderRadius: 18, display: "grid", placeItems: "center", background: "#fdecec", color: "#b83a3a", fontSize: 24 }}
          >
            !
          </div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#0b2b26" }}>Terjadi kesalahan</h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#5c7a75", lineHeight: 1.6 }}>
            Maaf, aplikasi mengalami kendala. Coba muat ulang halaman ini.
          </p>
          {errorId ? (
            <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "#5c7a75" }}>
              Kode lapor: <code style={{ background: "#e3f7ec", borderRadius: 6, padding: "2px 6px" }}>{errorId}</code>
            </p>
          ) : null}
          <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              type="button"
              onClick={reset}
              style={{ border: 0, borderRadius: 10, background: "#1fbf75", color: "#05261d", padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}
            >
              Coba lagi
            </button>
            <a
              href="/beranda"
              style={{ borderRadius: 10, border: "1px solid rgba(15,143,87,.25)", color: "#0f8f57", padding: "10px 18px", textDecoration: "none", fontWeight: 600 }}
            >
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

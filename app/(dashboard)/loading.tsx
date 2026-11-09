export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="grid grid-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="card">
            <div className="skeleton skeleton-text" style={{ width: "45%" }} />
            <div className="skeleton skeleton-title" style={{ width: "35%", height: 30, marginTop: 14 }} />
            <div className="skeleton skeleton-text" style={{ width: "60%", marginBottom: 0 }} />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: "70%" }} />
        <div style={{ marginTop: 18 }}>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="skeleton" style={{ height: 36, marginBottom: 10 }} />
          ))}
        </div>
      </div>

      <div className="loading-line">Memuat halaman...</div>
    </div>
  );
}

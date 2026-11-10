export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="banner">
        <div className="banner-content">
          <div className="skeleton skeleton-text" style={{ width: 170 }} />
          <div className="skeleton skeleton-title" style={{ width: "52%", height: 26 }} />
          <div className="skeleton skeleton-text" style={{ width: "72%" }} />
          <div className="skeleton skeleton-text" style={{ width: "56%", marginBottom: 0 }} />
        </div>
        <div className="banner-stats">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="banner-stat">
              <div className="skeleton" style={{ width: 52, height: 22 }} />
              <div className="skeleton skeleton-text" style={{ width: 76, marginBottom: 0 }} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="card stat-card">
            <div className="skeleton skeleton-text" style={{ width: "55%" }} />
            <div className="skeleton skeleton-title" style={{ width: "40%", height: 26 }} />
            <div className="skeleton skeleton-text" style={{ width: "72%", marginBottom: 0 }} />
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        {[0, 1].map((item) => (
          <div key={item} className="card">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" style={{ width: "62%" }} />
            <div className="skeleton" style={{ height: 118, marginTop: 16 }} />
          </div>
        ))}
      </div>

      <div className="loading-line">Memuat beranda...</div>
    </div>
  );
}

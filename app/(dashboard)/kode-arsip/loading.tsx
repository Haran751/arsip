export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="grid grid-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="card stat-card">
            <div className="skeleton skeleton-text" style={{ width: "52%" }} />
            <div className="skeleton skeleton-title" style={{ width: "38%", height: 26 }} />
            <div className="skeleton skeleton-text" style={{ width: "66%", marginBottom: 0 }} />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" style={{ width: "60%" }} />
          </div>
          <div className="skeleton" style={{ width: 120, height: 32, borderRadius: 10 }} />
        </div>

        <div className="toolbar">
          <div className="skeleton" style={{ height: 34, flex: 1 }} />
          <div className="skeleton" style={{ width: 130, height: 34 }} />
        </div>

        <div className="table-wrap">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="skeleton" style={{ height: 40, marginBottom: 10 }} />
          ))}
        </div>
      </div>

      <div className="loading-line">Memuat master kode arsip...</div>
    </div>
  );
}

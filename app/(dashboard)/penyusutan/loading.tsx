export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="grid grid-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="card stat-card">
            <div className="skeleton skeleton-text" style={{ width: "56%" }} />
            <div className="skeleton skeleton-title" style={{ width: "36%", height: 24 }} />
            <div className="skeleton skeleton-text" style={{ width: "70%", marginBottom: 0 }} />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" style={{ width: "58%" }} />
          </div>
          <div className="skeleton" style={{ width: 140, height: 32, borderRadius: 10 }} />
        </div>

        <div className="table-wrap">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton" style={{ height: 48, marginBottom: 10 }} />
          ))}
        </div>
      </div>

      <div className="loading-line">Memuat data penyusutan...</div>
    </div>
  );
}

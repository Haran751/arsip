export default function Loading() {
  return (
    <main className="status-wrap" aria-busy="true" aria-live="polite">
      <div className="status-loading">
        <span className="skeleton skeleton-circle" style={{ width: 40, height: 40 }} />
        <div className="skeleton" style={{ width: 150, height: 12 }} />
        <div className="loading-line">Memuat halaman...</div>
      </div>
    </main>
  );
}

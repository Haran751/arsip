const statusClass: Record<string, string> = {
  Aktif: "badge-aktif",
  Inaktif: "badge-inaktif",
  Permanen: "badge-permanen",
  Diajukan: "badge-info",
  Disetujui: "badge-aktif",
  Ditolak: "badge-danger",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${statusClass[status] ?? "badge-muted"}`}>
      <span className="badge-dot" />
      {status === "Dinilai_Kembali" ? "Dinilai Kembali" : status}
    </span>
  );
}

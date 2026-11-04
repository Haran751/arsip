const statusClass: Record<string, string> = {
  Aktif: "badge-aktif",
  Inaktif: "badge-inaktif",
  Permanen: "badge-permanen",
  "Jatuh Tempo": "badge-danger",
  Diajukan: "badge-info",
  Disetujui: "badge-aktif",
  Ditolak: "badge-danger",
  Musnah: "badge-warn",
  Dinilai_Kembali: "badge-info",
};

const label: Record<string, string> = {
  Dinilai_Kembali: "Dinilai Kembali",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${statusClass[status] ?? "badge-muted"}`}>
      <span className="badge-dot" />
      {label[status] ?? status}
    </span>
  );
}

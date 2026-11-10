import type { ReactNode } from "react";

export default function EmptyState({
  judul,
  deskripsi,
  aksi,
}: {
  judul: string;
  deskripsi?: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="empty">
      <p className="empty-title">{judul}</p>
      {deskripsi ? <p className="empty-desc">{deskripsi}</p> : null}
      {aksi}
    </div>
  );
}

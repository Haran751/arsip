"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Icon, { type IconName } from "./icon";

export default function StatusPage({
  ikon,
  judul,
  deskripsi,
  errorId,
  onCobaLagi,
  aksiTambahan,
}: {
  ikon: IconName;
  judul: string;
  deskripsi: string;
  errorId?: string;
  onCobaLagi?: () => void;
  aksiTambahan?: ReactNode;
}) {
  return (
    <div className="status-page" role="alert">
      <span className="status-icon">
        <Icon name={ikon} size={26} />
      </span>
      <h2 className="status-title">{judul}</h2>
      <p className="status-desc">{deskripsi}</p>
      {errorId ? (
        <p className="status-code">
          Kode lapor: <code>{errorId}</code>
        </p>
      ) : null}
      <div className="status-actions">
        {onCobaLagi ? (
          <button type="button" className="btn" onClick={onCobaLagi}>
            <Icon name="check" size={15} /> Coba lagi
          </button>
        ) : null}
        {aksiTambahan ?? (
          <Link href="/beranda" className="btn btn-ghost">
            <Icon name="home" size={15} /> Kembali ke Beranda
          </Link>
        )}
      </div>
    </div>
  );
}

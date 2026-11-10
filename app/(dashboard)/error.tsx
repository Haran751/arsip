"use client";

import StatusPage from "@/components/status-page";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const errorId = typeof error.digest === "string" && error.digest ? error.digest.slice(0, 8) : undefined;

  return (
    <StatusPage
      ikon="alert"
      judul="Terjadi kesalahan"
      deskripsi="Maaf, terjadi kendala saat memuat halaman ini. Data Anda tetap aman."
      errorId={errorId}
      onCobaLagi={reset}
    />
  );
}

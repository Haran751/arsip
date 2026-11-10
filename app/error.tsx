"use client";

import StatusPage from "@/components/status-page";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Hanya kode rujukan aman yang ditampilkan; pesan dan stack tidak pernah dikirim ke layar.
  const errorId = typeof error.digest === "string" && error.digest ? error.digest.slice(0, 8) : undefined;

  return (
    <main className="status-wrap">
      <StatusPage
        ikon="alert"
        judul="Terjadi kesalahan"
        deskripsi="Maaf, terjadi kendala saat memuat halaman ini. Data Anda tetap aman."
        errorId={errorId}
        onCobaLagi={reset}
      />
    </main>
  );
}

import StatusPage from "@/components/status-page";

export default function NotFound() {
  return (
    <main className="status-wrap">
      <StatusPage
        ikon="search"
        judul="Halaman tidak ditemukan"
        deskripsi="Alamat yang Anda buka tidak tersedia atau sudah dipindahkan."
      />
    </main>
  );
}

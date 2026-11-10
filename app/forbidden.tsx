import Link from "next/link";
import StatusPage from "@/components/status-page";

export default function Forbidden() {
  return (
    <main className="status-wrap">
      <StatusPage
        ikon="shield"
        judul="Akses ditolak"
        deskripsi="Anda tidak memiliki akses ke halaman ini. Hubungi Admin jika Anda merasa ini keliru."
        aksiTambahan={
          <Link href="/beranda" className="btn">
            Kembali ke Beranda
          </Link>
        }
      />
    </main>
  );
}

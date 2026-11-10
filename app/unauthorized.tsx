import Link from "next/link";
import StatusPage from "@/components/status-page";

export default function Unauthorized() {
  return (
    <main className="status-wrap">
      <StatusPage
        ikon="logout"
        judul="Sesi berakhir"
        deskripsi="Sesi Anda sudah berakhir. Silakan login kembali untuk melanjutkan."
        aksiTambahan={
          <Link href="/login" className="btn">
            Login kembali
          </Link>
        }
      />
    </main>
  );
}

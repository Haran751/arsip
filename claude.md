Kamu adalah senior fullstack engineer. Bangun aplikasi WEB "E-Arsip" (manajemen arsip digital) untuk kantor. Kerjakan BERTAHAP per fase (lihat bagian FASE). Setelah tiap fase berikan kode lengkap, struktur folder, dan cara menjalankannya. Jangan lanjut ke fase berikutnya sebelum saya bilang "lanjut". Semua teks UI berbahasa Indonesia.

## 1. TECH STACK (semua gratis / free tier)
- Framework: Next.js (App Router) + TypeScript strict. Backend memakai Server Actions dan Route Handlers.
- UI: Tailwind CSS + shadcn/ui + lucide-react, font Plus Jakarta Sans.
- Animasi: Motion (Framer Motion) + CSS transition.
- Data: Prisma ORM + Supabase PostgreSQL (free tier), gunakan connection pooler Supabase (DATABASE_URL untuk pooler, DIRECT_URL untuk migration). Validasi: zod. Form: React Hook Form. Tabel: TanStack Table. Chart: Recharts.
- Auth: Auth.js (credentials), password bcrypt, session httpOnly cookie. Akun dibuat oleh Admin dari menu Kelola User.
- Excel: exceljs (export dan import), diproses di server.
- Storage file: Supabase Storage dengan bucket PRIVATE. Upload langsung dari browser ke Supabase lewat signed upload URL (karena Vercel membatasi ukuran body request), download lewat signed URL berumur pendek (60 detik) yang dibuat setelah cek login dan peran. Buat abstraksi storage agar mudah diganti.
- Penjadwalan: Vercel Cron (endpoint /api/cron/retensi dilindungi CRON_SECRET) untuk job retensi harian. Jangan pakai node-cron karena Vercel bersifat serverless.
- Deploy: Vercel (frontend + API). Sertakan .env.example (DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET) dan panduan deploy langkah demi langkah.
- Tanpa Docker, NocoDB, dan Adminer. Pengelolaan database memakai dashboard Supabase.

## 2. PENGELOLAAN DATABASE OLEH ORANG KANTOR
- Pemilik Organization Supabase memakai email resmi kantor (bukan email pribadi). Staf yang dipercaya (maks 1-2 orang selain pemilik) diundang lewat Organization Settings → Team → Invite, lalu mengelola data via Table Editor (tampilan spreadsheet) dan SQL Editor (untuk staf IT).
- Staf biasa TIDAK perlu akun Supabase atau Vercel. Mereka hanya login ke aplikasi web.
- Aktifkan Row Level Security (RLS) di SEMUA tabel tanpa policy publik, sehingga data tidak bisa dibaca lewat API publik Supabase. Aplikasi mengakses data hanya lewat server (Prisma). service_role key HANYA di environment variable server, tidak pernah dikirim ke client.
- Buat TRIGGER AUDIT di PostgreSQL pada tabel arsip dan kode_arsip, agar perubahan langsung lewat Table Editor/SQL Editor tetap masuk log_aktivitas dengan sumber "database langsung". Aplikasi mengirim session variable (misalnya app.current_user_id) saat menulis data sehingga trigger tidak membuat log ganda untuk aksi dari aplikasi.
- log_aktivitas bersifat append-only: cabut hak UPDATE/DELETE dan tambahkan trigger yang menolak UPDATE/DELETE.
- Sertakan panduan IT berbahasa Indonesia: cara mengundang staf, cara memakai Table Editor dengan aman, jangan ubah struktur tabel inti, backup manual berkala (export database ke file, simpan di tempat lain, bukan hanya di Supabase), cara restore, dan peringatan bahwa free tier bisa di-pause jika lama tidak aktif (sediakan cron ringan agar proyek tetap aktif, atau jelaskan cara mengaktifkannya kembali).
- Checklist keamanan: aktifkan 2FA untuk Owner dan Admin Supabase, catat pemilik akun Organization, batasi jumlah anggota dashboard.

## 3. PERAN (RBAC)
- Admin: semua fitur, kelola user, master kode, persetujuan pemusnahan.
- Operator: tambah/edit arsip, unduh, export Excel, ajukan pemusnahan.
- Viewer: lihat dan unduh saja.
Pengecekan peran dilakukan di SERVER (bukan hanya menyembunyikan menu di UI).

## 4. FITUR
1. Login, ganti password, paksa ganti password saat login pertama.
2. Dashboard: kartu total arsip, bulan ini, jatuh tempo, pengguna; grafik arsip per bulan; arsip terbaru; aktivitas terakhir.
3. Daftar Arsip: pencarian, FILTER TAHUN, BULAN, TANGGAL (single/rentang), status retensi, kode, user penambah; chip filter aktif; pagination. Tampilkan SIAPA yang menambahkan (avatar + nama) dan kapan. Klik baris membuka side drawer detail.
4. Tambah/Edit/Hapus (soft delete) arsip: nomor arsip, judul, kode arsip (combobox pencarian), tanggal arsip, keterangan, upload file drag & drop (batasi tipe dan ukuran, validasi tipe di server, nama file di-randomize). created_by otomatis dari session dan tidak bisa dimanipulasi dari client.
5. Detail Arsip: preview file, metadata, "Ditambahkan oleh [nama] pada [tanggal jam]", riwayat perubahan.
6. EXPORT EXCEL sesuai filter aktif (arsip dan log), dengan baris judul, filter yang dipakai, dan tanggal ekspor. Batasi jumlah baris per ekspor atau gunakan streaming agar tidak melewati batas waktu fungsi Vercel.
7. Master Kode Arsip (±107 halaman, ratusan kode): struktur induk-anak (parent_id), tampilan pohon, pencarian. IMPORT EXCEL dengan wizard Upload → Preview & Validasi (duplikat, kolom kosong, format salah) → Konfirmasi → Laporan per baris (berhasil/gagal). Template Excel bisa diunduh. Import dalam transaksi, upsert berdasarkan kode, dan bisa diulang. Pecah proses per batch jika data besar.
8. RETENSI ("disimpan sampai kapan"): tiap kode punya retensi_aktif_thn, retensi_inaktif_thn, nasib_akhir (Musnah/Permanen/Dinilai Kembali). Hitung otomatis akhir_aktif dan akhir_retensi dari tanggal_arsip. Status: Aktif, Inaktif, Jatuh Tempo, Permanen. Override manual dengan alasan wajib. Job harian (Vercel Cron) memperbarui status dan membuat notifikasi 30/90 hari sebelum jatuh tempo.
9. Usulan Pemusnahan: pilih arsip jatuh tempo → ajukan → persetujuan Admin → export Excel. Tidak ada penghapusan otomatis.
10. LOG AKTIVITAS: Login, Logout, Tambah, Edit, Hapus, Unduh, Export, Import, Ubah retensi, Persetujuan, Perubahan database langsung. Kolom: waktu, user, aksi, objek, IP, browser/device, keterangan, before/after JSON. Tampilan TIMELINE vertikal, filter tahun/bulan/tanggal/user/aksi, dan export Excel.
11. Manajemen user (Admin), notifikasi dalam aplikasi, halaman profil.

## 5. DATABASE (Prisma schema + index)
Tabel: users, kode_arsip (parent_id), arsip, arsip_riwayat, usulan_pemusnahan (+ usulan_pemusnahan_item), log_aktivitas, notifikasi, pengaturan.
- users: id, nama, username, email, password_hash, role, aktif, last_login, must_change_password
- kode_arsip: id, kode UNIQUE, nama, parent_id, retensi_aktif_thn, retensi_inaktif_thn, nasib_akhir, keterangan
- arsip: id, nomor_arsip UNIQUE, judul, kode_arsip_id, tanggal_arsip, keterangan, file_path, file_name, file_size, mime_type, created_by, updated_by, akhir_aktif, akhir_retensi, status_retensi, retensi_override_thn, alasan_override, deleted_at, created_at, updated_at
- log_aktivitas: id, user_id (nullable), aksi, objek_type, objek_id, ip_address, user_agent, keterangan, data_json, sumber (aplikasi/database), created_at
Index pada: kode, nomor_arsip, tanggal_arsip, akhir_retensi, status_retensi, created_by, log_aktivitas.created_at.
Sertakan migration, file SQL untuk RLS + trigger audit + trigger append-only (prisma/sql/), dan seed (1 admin default, contoh kode, contoh arsip).

## 6. DESAIN (WAJIB DIIKUTI)
Modern, minimalis, lega, soft. Desktop-first (1440px) dan responsif sampai mobile.
- Warna 60-30-10: 60% putih #FFFFFF / #F5FBF7; 30% hijau primer #1FBF75 (tint #E3F7EC, hijau dalam #0F8F57); 10% aksen #40FF8C (titik indikator, badge kecil, ujung gradien tombol). Gradien #1FBF75 → #40FF8C (135°) hanya untuk tombol utama dan banner. Teks #0B2B26 dan #5C7A75, kontras WCAG AA. Simpan sebagai CSS variables / Tailwind theme.
- SIDEBAR MENGAMBANG: card putih rounded 24px, jarak 16px dari tepi, ramping (ikon saja, melebar saat hover), menu aktif berupa pill tint dengan titik #40FF8C. Di layar mobile berubah menjadi BOTTOM NAVBAR MENGAMBANG glass (jarak 16px dari kiri/kanan/bawah, radius 28px, backdrop-blur, putih transparan 60-70%, border putih tipis, shadow lembut) dengan tombol tengah "+" bergradien. Beri padding bawah ekstra agar konten tidak tertutup.
- TOPBAR GLASS: sapaan "Halo, [Nama]", search pill (Ctrl+K), ikon notifikasi dengan titik aksen, avatar, breadcrumb tipis.
- GLASS CARD (backdrop-blur + putih transparan + border tipis) untuk banner dan kartu statistik, dengan blob gradien hijau blur di background agar efek terlihat. Tabel dan daftar panjang memakai card putih solid.
- Tabel Arsip hanya 5 kolom: Judul (nomor arsip kecil di bawahnya), Kode, Ditambahkan Oleh, Disimpan Sampai (badge pastel), Aksi (⋯). Tanpa zebra, baris lega, hover tint.
- Teks seminimal mungkin: ikon, angka besar, label 1-2 kata. Sudut 16-24px, shadow lembut menyebar, padding card 24-32px, jarak antar section 32-48px.
- Empty state berilustrasi, skeleton loading, toast sukses/gagal.

## 7. ANIMASI (ringan dan inklusif untuk semua kalangan)
- Prinsip: halus, singkat (150-300 ms), hanya animasi transform dan opacity agar ringan di perangkat kantor yang spek rendah. Tanpa animasi berkedip, berputar cepat, atau parallax berlebihan.
- WAJIB hormati prefers-reduced-motion (matikan animasi non-esensial) dan sediakan toggle "Kurangi animasi" di pengaturan.
- Daftar animasi: fade + slide-up halus saat halaman dan card muncul (stagger kecil), angka statistik count-up satu kali, hover card naik 2-4px, sidebar melebar halus, drawer dan modal slide/scale lembut, skeleton shimmer, toast masuk/keluar, centang animasi saat upload/export sukses, blob background bergerak sangat pelan (opsional, otomatis mati pada reduced motion atau perangkat lemah).
- Tidak boleh ada animasi yang menghambat interaksi atau menyembunyikan informasi penting.
- Aksesibilitas: font minimal 14px dan bisa diperbesar, fokus keyboard terlihat jelas, navigasi keyboard lengkap, label ARIA, status tidak hanya mengandalkan warna (selalu ada ikon/teks).

## 8. KEAMANAN
bcrypt, cookie httpOnly, CSRF protection, rate limit login, validasi zod di server, bucket storage private + signed URL pendek, query via Prisma (anti SQL injection), security headers, RLS aktif, service_role key hanya di server, endpoint cron dilindungi CRON_SECRET, tanpa secret di kode, HTTPS (otomatis di Vercel).

## 9. STRUKTUR PROYEK
/app (route groups: (auth), (dashboard)/{beranda,arsip,log,kode-arsip,pemusnahan,pengguna,profil}, api (termasuk api/cron/retensi))
/components (ui, glass, layout, motion)
/lib (prisma, auth, retensi, excel, audit, storage)
/prisma (schema.prisma, migrations, seed.ts, sql/{rls.sql, trigger-audit.sql, log-append-only.sql})
/docs (README, panduan deploy Vercel + Supabase, panduan IT kantor, panduan pengguna singkat, checklist keamanan)

## 10. FASE PENGERJAAN
Fase 1: Struktur proyek, setup Supabase + Prisma (schema, migration, seed), SQL RLS + trigger audit + append-only, auth + RBAC.
Fase 2: Master kode arsip (CRUD, pohon, import/template Excel) dan CRUD arsip (upload via signed URL, filter tahun/bulan/tanggal, created_by).
Fase 3: Retensi + Vercel Cron, pemusnahan, export Excel, log aktivitas.
Fase 4: Theme, komponen glass, sidebar/bottom navbar mengambang, sistem animasi, login, dashboard.
Fase 5: Halaman Daftar & Detail Arsip, form tambah/edit, log timeline, master kode, pemusnahan, user, profil.
Fase 6: Testing (unit test retensi, test alur utama), audit aksesibilitas, panduan deploy ke Vercel dan panduan backup.

## 11. ATURAN KODE
TypeScript strict, modular, komentar singkat berbahasa Indonesia pada logika penting, error handling konsisten, tanpa data dummy tersembunyi.

Mulai dari FASE 1 sekarang.
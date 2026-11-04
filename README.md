# E-Arsip

Sistem pengelolaan arsip digital (Next.js App Router + TypeScript).

## Akun default

Akun dibuat di Supabase Auth dan langsung dapat dipakai login.

| Username | Password     | Peran    |
| -------- | ------------ | -------- |
| admin    | admin123     | Admin    |
| operator | operator123  | Operator |
| pimpinan | pimpinan123  | Pimpinan |

Semua akun memakai email internal `@earsip.local`:

- `admin@earsip.local`
- `operator@earsip.local`
- `pimpinan@earsip.local`

Login boleh memakai username (mis. `admin`) atau email lengkap.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000/login`.

`.env` wajib berisi `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `AUTH_SECRET`.
Contoh lengkap ada di `.env.example`.

## Membuat ulang akun

```bash
npm run akun:supabase
```

Script akan membuat atau memperbarui tiga akun default di Supabase Auth.

## Catatan

- Autentikasi, profil, ganti password, dan manajemen pengguna memakai Supabase Auth.
- Password pengguna baru / hasil reset: `EArsip#2026` dan wajib diganti saat login pertama.
- Data arsip, kode arsip, usulan, dan log saat ini masih tersimpan di `localStorage` browser.
- Schema Prisma disiapkan di `prisma/schema.prisma` untuk migrasi data ke PostgreSQL pada tahap berikutnya.

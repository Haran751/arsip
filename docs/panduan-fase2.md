# Panduan Fase 2 - Master Kode Arsip & CRUD Arsip

## Yang ditambahkan
- lib/supabase.ts, lib/storage.ts (signed upload/download)
- lib/validations.ts
- app/(dashboard)/kode-arsip/actions.ts (CRUD + RBAC)
- app/(dashboard)/arsip/actions.ts (create/update/soft-delete + created_by)
- app/api/storage/upload-url/route.ts, app/api/storage/download-url/route.ts
- app/(dashboard)/arsip/export-actions.ts (Excel dasar)

## Catatan Storage
- Bucket Supabase Storage: `arsip` (PRIVATE)
- Upload: client minta signed upload URL dari server, upload langsung ke Supabase
- Download: minta signed download URL (berumur 60 detik) via API setelah cek login
- Nama file di-randomize (uuid)
- Validasi tipe/ukuran wajib di server saat create/update
- Abstraksi di lib/storage.ts agar mudah diganti

## Filter Arsip
Tahun, Bulan, Tanggal/rentang, status retensi, kode arsip, user penambah + chip filter aktif + pagination

## Import Kode Arsip
Wizard: Upload → Preview & Validasi (duplikat/kosong/format salah) → Konfirmasi → Laporan. Template bisa diunduh. Upsert by kode, transaksi, batch jika besar.

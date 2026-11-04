# Panduan Fase 3 - Retensi, Cron, Pemusnahan, Log

## Retensi
- lib/retensi.ts: hitung otomatis akhir_aktif/akhir_retensi, status, jatuh tempo
- Cron: /api/cron/retensi dilindungi CRON_SECRET (Authorization: Bearer)
- Vercel Cron bisa panggil endpoint ini harian

## Pemusnahan
- Usulan dari arsip jatuh tempo
- Persetujuan hanya Admin
- Tidak ada penghapusan otomatis

## Log Aktivitas
- append-only (trigger + revoke)
- Sumber aplikasi via withAuditContext, database langsung terdeteksi trigger
- Filter tahun/bulan/tanggal/user/aksi, timeline, export Excel

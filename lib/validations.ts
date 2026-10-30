import { z } from 'zod'

export const kodeArsipSchema = z.object({
  kode: z.string().min(1),
  nama: z.string().min(1),
  parent_id: z.string().optional().nullable(),
  retensi_aktif_thn: z.coerce.number().int().min(0),
  retensi_inaktif_thn: z.coerce.number().int().min(0),
  nasib_akhir: z.enum(['Musnah', 'Permanen', 'Dinilai_Kembali']),
  keterangan: z.string().optional().nullable(),
})

export const arsipSchema = z.object({
  nomor_arsip: z.string().min(1),
  judul: z.string().min(1),
  kode_arsip_id: z.string().min(1),
  tanggal_arsip: z.string().min(1),
  keterangan: z.string().optional().nullable(),
  file_path: z.string().min(1),
  file_name: z.string().min(1),
  file_size: z.coerce.number().int().min(1),
  mime_type: z.string().min(1),
})

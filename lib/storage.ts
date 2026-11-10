import { getSupabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { AppError } from '@/lib/errors'

const BUCKET = 'arsip'

export async function createSignedUploadUrl(ext: string, contentType: string, folder = 'arsip') {
  void contentType;
  const filename = `${randomUUID()}.${ext.replace(/^\./,'')}`
  const path = `${folder.replace(/\/+$/,'')}/${filename}`
  const { data, error } = await getSupabaseAdmin().storage.from(BUCKET).createSignedUploadUrl(path)
  if (error) {
    throw new AppError("Gagal menyiapkan unggahan berkas. Silakan coba lagi.", {
      code: "PENYIMPANAN",
      status: 503,
      cause: error,
    });
  }
  return { signedUrl: data.signedUrl, path, filename }
}

export async function createSignedDownloadUrl(path: string, expiresIn = 60) {
  const { data, error } = await getSupabaseAdmin().storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error) {
    throw new AppError("Gagal menyiapkan tautan unduhan. Silakan coba lagi.", {
      code: "PENYIMPANAN",
      status: 503,
      cause: error,
    });
  }
  return data.signedUrl
}

export async function removeFile(path: string) {
  await getSupabaseAdmin().storage.from(BUCKET).remove([path])
}

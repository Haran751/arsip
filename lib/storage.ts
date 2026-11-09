import { supabaseAdmin } from './supabase'
import { randomUUID } from 'crypto'

const BUCKET = 'arsip'

export async function createSignedUploadUrl(ext: string, contentType: string, folder = 'arsip') {
  void contentType;
  const filename = `${randomUUID()}.${ext.replace(/^\./,'')}`
  const path = `${folder.replace(/\/+$/,'')}/${filename}`
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error) throw error
  return { signedUrl: data.signedUrl, path, filename }
}

export async function createSignedDownloadUrl(path: string, expiresIn = 60) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function removeFile(path: string) {
  await supabaseAdmin.storage.from(BUCKET).remove([path])
}

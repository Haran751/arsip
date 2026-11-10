import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let klien: SupabaseClient | null = null

// Klien dibuat saat pertama kali dipakai agar proses build tetap jalan
// meskipun variabel lingkungan belum tersedia.
export function getSupabaseAdmin(): SupabaseClient {
  if (!klien) {
    klien = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return klien
}

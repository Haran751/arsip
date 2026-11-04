export function hitungRetensi(tanggalArsip: Date, retensiAktifThn: number, retensiInaktifThn: number) {
  const akhirAktif = new Date(tanggalArsip)
  akhirAktif.setFullYear(akhirAktif.getFullYear() + (retensiAktifThn || 0))
  const akhirRetensi = new Date(akhirAktif)
  akhirRetensi.setFullYear(akhirRetensi.getFullYear() + (retensiInaktifThn || 0))
  return { akhirAktif, akhirRetensi }
}

export function getStatusRetensi(akhirAktif?: Date | null, akhirRetensi?: Date | null, now = new Date()) {
  if (!akhirRetensi) return 'Aktif'
  if (now >= akhirRetensi) return 'Permanen'
  if (akhirAktif && now >= akhirAktif) return 'Inaktif'
  return 'Aktif'
}

export function isJatuhTempo(akhirRetensi?: Date | null, now = new Date()) {
  if (!akhirRetensi) return false
  const diff = akhirRetensi.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days <= 90 && days >= 0
}

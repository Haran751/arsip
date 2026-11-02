import type { IconName } from "@/components/icon";

export type NavItem = {
  href: string;
  label: string;
  desc: string;
  icon: IconName;
  section?: string;
};

export const navItems: NavItem[] = [
  { href: "/beranda", label: "Beranda", desc: "Ringkasan arsip dan aktivitas terbaru", icon: "home", section: "Utama" },
  { href: "/arsip", label: "Arsip", desc: "Kelola dan telusuri arsip digital", icon: "archive", section: "Pengelolaan" },
  { href: "/kode-arsip", label: "Kode Arsip", desc: "Master kode dan aturan retensi", icon: "folder" },
  { href: "/pemusnahan", label: "Pemusnahan", desc: "Usulan dan persetujuan pemusnahan arsip", icon: "trash" },
  { href: "/log", label: "Log Aktivitas", desc: "Jejak audit aktivitas pengguna", icon: "activity", section: "Sistem" },
  { href: "/pengguna", label: "Pengguna", desc: "Kelola akun dan hak akses", icon: "users" },
  { href: "/pengaturan", label: "Pengaturan", desc: "Preferensi tampilan dan data demo", icon: "settings" },
  { href: "/profil", label: "Profil", desc: "Informasi akun dan keamanan", icon: "user" },
];

export const mobileNavItems: NavItem[] = [
  navItems[0],
  navItems[1],
  navItems[3],
  navItems[4],
  navItems[7],
];

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
  { href: "/arsip", label: "Arsip", desc: "Kelola folder dan arsip digital", icon: "archive", section: "Pengelolaan" },
  { href: "/kode-arsip", label: "Kode Arsip", desc: "Master kode dan aturan retensi", icon: "folder" },
  { href: "/pemusnahan", label: "Pemusnahan", desc: "Usulan dan persetujuan pemusnahan arsip", icon: "trash" },
  { href: "/pengguna", label: "Pengguna", desc: "Kelola akun dan hak akses", icon: "users", section: "Sistem" },
  { href: "/pengaturan", label: "Pengaturan", desc: "Preferensi tampilan dan sistem", icon: "settings" },
  { href: "/profil", label: "Profil", desc: "Informasi akun dan keamanan", icon: "user" },
];

const mobileHrefs = ["/beranda", "/arsip", "/pemusnahan", "/profil"];

export const mobileNavItems: NavItem[] = mobileHrefs
  .map((href) => navItems.find((item) => item.href === href))
  .filter((item): item is NavItem => Boolean(item));

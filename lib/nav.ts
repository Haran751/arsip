import type { IconName } from "@/components/icon";
import type { Role } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
  desc: string;
  icon: IconName;
  section?: string;
  roles?: Role[];
};

export const navItems: NavItem[] = [
  { href: "/beranda", label: "Beranda", desc: "Ringkasan arsip dan aktivitas terbaru", icon: "home", section: "Utama" },
  { href: "/arsip", label: "Arsip", desc: "Kelola folder dan arsip digital", icon: "archive", section: "Pengelolaan" },
  { href: "/kode-arsip", label: "Kode Arsip", desc: "Master kode dan aturan retensi", icon: "folder" },
  { href: "/penyusutan", label: "Penyusutan", desc: "Usulan dan persetujuan penyusutan arsip", icon: "trash" },
  { href: "/pengguna", label: "Pengguna", desc: "Kelola akun dan hak akses", icon: "users", section: "Sistem", roles: ["Admin"] },
  { href: "/pengaturan", label: "Pengaturan", desc: "Preferensi tampilan dan sistem", icon: "settings" },
  { href: "/profil", label: "Profil", desc: "Informasi akun dan keamanan", icon: "user" },
];

export function bolehTampil(item: NavItem, role: Role) {
  return !item.roles || item.roles.includes(role);
}

const mobileHrefs = ["/beranda", "/arsip", "/penyusutan", "/profil"];

export const mobileNavItems: NavItem[] = mobileHrefs
  .map((href) => navItems.find((item) => item.href === href))
  .filter((item): item is NavItem => Boolean(item));

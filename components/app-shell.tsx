"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { inisial } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";

type NavItem = {
  href: string;
  label: string;
  desc: string;
  icon: string;
  section?: string;
};

const navItems: NavItem[] = [
  { href: "/beranda", label: "Beranda", desc: "Ringkasan arsip dan aktivitas terbaru", icon: "home", section: "Utama" },
  { href: "/arsip", label: "Arsip", desc: "Kelola dan telusuri arsip digital", icon: "archive", section: "Pengelolaan" },
  { href: "/kode-arsip", label: "Kode Arsip", desc: "Master kode dan aturan retensi", icon: "folder" },
  { href: "/pemusnahan", label: "Pemusnahan", desc: "Usulan dan persetujuan pemusnahan arsip", icon: "trash" },
  { href: "/log", label: "Log Aktivitas", desc: "Jejak audit aktivitas pengguna", icon: "activity", section: "Sistem" },
  { href: "/pengguna", label: "Pengguna", desc: "Kelola akun dan hak akses", icon: "users" },
  { href: "/profil", label: "Profil", desc: "Informasi akun dan keamanan", icon: "user" },
];

function Icon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );
    case "archive":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="5" rx="1.5" />
          <path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
          <path d="M10 13h4" />
        </svg>
      );
    case "folder":
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M9 7V5h6v2" />
          <path d="M6 7l1 13h10l1-13" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      );
    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l2.5-7 4 14 2.5-7H21" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
          <path d="M16 5.5a3 3 0 0 1 0 5.5" />
          <path d="M17.5 14.5A5.5 5.5 0 0 1 21 20" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
          <path d="M10 8l-4 4 4 4" />
          <path d="M6 12h9" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser: user } = useDemo();
  const pathname = usePathname();
  const current =
    navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/")) ?? navItems[0];

  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/beranda" className="brand">
          <span className="brand-mark">EA</span>
          <span className="brand-text">
            <span className="brand-name">E-Arsip</span>
            <span className="brand-sub" style={{ display: "block" }}>
              Sistem Arsip Digital
            </span>
          </span>
        </Link>

        <nav className="nav">
          {navItems.map((item, index) => {
            const showSection = item.section && item.section !== navItems[index - 1]?.section;
            const active = item.href === current.href;
            return (
              <div key={item.href}>
                {showSection ? <div className="nav-label">{item.section}</div> : null}
                <Link href={item.href} className={`nav-link${active ? " active" : ""}`}>
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <span className="avatar" style={{ width: 32, height: 32, flexBasis: 32, fontSize: 11 }}>
            {inisial(user.nama)}
          </span>
          <div className="sidebar-user">
            <div className="sidebar-user-name">{user.nama}</div>
            <div className="sidebar-user-role">{user.role} - mode demo</div>
          </div>
          <a href="/logout" className="icon-btn" title="Keluar" aria-label="Keluar">
            <Icon name="logout" />
          </a>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">{current.label}</h1>
            <p className="page-sub">{current.desc}</p>
          </div>
          <div className="topbar-user">
            <div style={{ textAlign: "right" }}>
              <div className="user-name">{user.nama}</div>
              <div className="user-role">{user.role}</div>
            </div>
            <span className="avatar">{inisial(user.nama)}</span>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

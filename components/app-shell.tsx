"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./icon";
import CommandPalette from "./command-palette";
import OfflineBanner from "./offline-banner";
import { useData } from "@/lib/data-store";
import { navItems, mobileNavItems } from "@/lib/nav";
import { inisial } from "@/lib/types";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser: user, stats, dueArsip, muatGagal, refreshData } = useData();
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current =
    navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/")) ?? navItems[0];

  const notifications = useMemo(() => {
    const list: { id: string; title: string; desc: string; href: string; tone: string }[] = [];
    if (dueArsip.length) {
      list.push({
        id: "due",
        title: `${dueArsip.length} arsip mencapai akhir masa retensi`,
        desc: "Arsip inaktif siap ditinjau untuk penyusutan.",
        href: "/penyusutan",
        tone: "warn",
      });
    }
    if (stats.usulanDiajukan) {
      list.push({
        id: "usulan",
        title: `${stats.usulanDiajukan} usulan menunggu`,
        desc: "Usulan penyusutan menunggu keputusan Admin.",
        href: "/penyusutan",
        tone: "info",
      });
    }
    return list;
  }, [dueArsip.length, stats.usulanDiajukan]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setNotifOpen(false);
    setMenuOpen(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const badgeCount = dueArsip.length + stats.usulanDiajukan;

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Navigasi utama">
        <Link href="/beranda" className="brand" title="E-Arsip">
          <span className="brand-mark">EA</span>
          <span className="brand-text">
            <span className="brand-name">E-Arsip</span>
            <span className="brand-sub">Sistem Arsip Digital</span>
          </span>
        </Link>

        <nav className="nav">
          {navItems.map((item, index) => {
            const showSection = item.section && item.section !== navItems[index - 1]?.section;
            const active = item.href === current.href;
            return (
              <div key={item.href} className="nav-group">
                {showSection ? <div className="nav-label">{item.section}</div> : null}
                <Link href={item.href} className={`nav-link${active ? " active" : ""}`} title={item.label}>
                  <span className="nav-icon">
                    <Icon name={item.icon} size={19} />
                  </span>
                  <span className="nav-text">{item.label}</span>
                  {active ? <span className="nav-dot" /> : null}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <span className="avatar" aria-hidden>
            {inisial(user.nama)}
          </span>
          <div className="sidebar-user">
            <div className="sidebar-user-name">{user.nama}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
          <a href="/logout" className="icon-btn" title="Keluar" aria-label="Keluar">
            <Icon name="logout" size={17} />
          </a>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="crumb">
              E-Arsip <span>/</span> {current.section ?? "Menu"} <span>/</span> <strong>{current.label}</strong>
            </div>
            <div className="greeting">
              <h1 className="page-title">Halo, {user.nama.split(" ")[0]}</h1>
              <p className="page-sub">{current.desc}</p>
            </div>
          </div>

          <div className="topbar-actions">
            <button type="button" className="search-pill" onClick={() => setPaletteOpen(true)} aria-label="Cari cepat">
              <Icon name="search" size={17} />
              <span className="search-pill-text">Cari arsip atau halaman</span>
              <kbd>Ctrl K</kbd>
            </button>

            <div className="popover-wrap">
              <button
                type="button"
                className="icon-btn topbar-btn"
                onClick={() => setNotifOpen((open) => !open)}
                aria-label="Notifikasi"
                aria-expanded={notifOpen}
              >
                <Icon name="bell" size={19} />
                {badgeCount ? <span className="notif-dot" /> : null}
              </button>
              {notifOpen ? (
                <div className="popover notif-panel">
                  <div className="popover-head">
                    <strong>Notifikasi</strong>
                    <span className="badge badge-muted">{notifications.length} baru</span>
                  </div>
                  <div className="notif-list">
                    {notifications.map((item) => (
                      <Link key={item.id} href={item.href} className="notif-item" onClick={() => setNotifOpen(false)}>
                        <span className={`notif-mark ${item.tone}`} />
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.desc}</small>
                        </span>
                      </Link>
                    ))}
                    {notifications.length === 0 ? <div className="empty">Tidak ada notifikasi baru.</div> : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="popover-wrap" ref={menuRef}>
              <button
                type="button"
                className="profile-trigger"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Menu akun"
                aria-expanded={menuOpen}
              >
                <span className="avatar">{inisial(user.nama)}</span>
                <span className="profile-meta">
                  <span className="user-name">{user.nama}</span>
                  <span className="user-role">{user.role}</span>
                </span>
                <Icon name="chevron" size={14} className="profile-caret" />
              </button>
              {menuOpen ? (
                <div className="popover profile-menu">
                  <div className="profile-menu-head">
                    <span className="avatar avatar-md">{inisial(user.nama)}</span>
                    <div>
                      <strong>{user.nama}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>
                  <Link href="/profil" onClick={() => setMenuOpen(false)}>
                    <Icon name="user" size={16} /> Profil
                  </Link>
                  <Link href="/pengaturan" onClick={() => setMenuOpen(false)}>
                    <Icon name="settings" size={16} /> Pengaturan
                  </Link>
                  <a href="/logout">
                    <Icon name="logout" size={16} /> Keluar
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="content">
          {muatGagal ? (
            <div className="reload-banner" role="alert">
              <span>Gagal memuat data terbaru dari server.</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void refreshData()}>
                Muat ulang
              </button>
            </div>
          ) : null}
          {children}
        </div>
      </div>

      <OfflineBanner />

      <nav className="bottombar" aria-label="Navigasi bawah">
        {mobileNavItems.slice(0, 2).map((item) => {
          const active = item.href === current.href;
          return (
            <Link key={item.href} href={item.href} className={`bottom-item${active ? " active" : ""}`}>
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link href="/arsip?baru=1" className="bottom-add" aria-label="Tambah arsip">
          <Icon name="plus" size={22} />
        </Link>
        {mobileNavItems.slice(2, 3).map((item) => {
          const active = item.href === current.href;
          return (
            <Link key={item.href} href={item.href} className={`bottom-item${active ? " active" : ""}`}>
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link href="/profil" className={`bottom-item${pathname.startsWith("/profil") ? " active" : ""}`}>
          <Icon name="user" size={20} />
          <span>Profil</span>
        </Link>
      </nav>

      <CommandPalette
        key={paletteOpen ? "open" : "closed"}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
}

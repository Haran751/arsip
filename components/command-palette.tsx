"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./icon";
import { navItems, bolehTampil } from "@/lib/nav";
import { useData } from "@/lib/data-store";

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

type Hasil =
  | { kind: "nav"; id: string; label: string; desc: string; href: string }
  | { kind: "arsip"; id: string; label: string; desc: string; href: string };

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { data, currentUser } = useData();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const hasil = useMemo<Hasil[]>(() => {
    const kata = query.trim().toLowerCase();
    const nav = navItems
      .filter((item) => bolehTampil(item, currentUser.role))
      .filter((item) => !kata || `${item.label} ${item.desc}`.toLowerCase().includes(kata))
      .map<Hasil>((item) => ({
        kind: "nav",
        id: `nav-${item.href}`,
        label: item.label,
        desc: item.desc,
        href: item.href,
      }));

    const arsip = data.arsip
      .filter((item) => !kata || `${item.nomor_arsip} ${item.judul} ${item.kode} ${item.pembuat}`.toLowerCase().includes(kata))
      .slice(0, 7)
      .map<Hasil>((item) => ({
        kind: "arsip",
        id: item.id,
        label: item.judul,
        desc: `${item.nomor_arsip} - ${item.kode} - ${item.pembuat}`,
        href: `/arsip?detail=${encodeURIComponent(item.id)}`,
      }));

    return [...nav.slice(0, 6), ...arsip];
  }, [data.arsip, query, currentUser.role]);

  const activeIndex = Math.min(active, Math.max(0, hasil.length - 1));

  if (!open) return null;

  const pilih = (item: Hasil | undefined) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (hasil.length ? (current + 1) % hasil.length : 0));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (hasil.length ? (current - 1 + hasil.length) % hasil.length : 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      pilih(hasil[activeIndex]);
    }
  };

  return (
    <div className="palette-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Pencarian cepat">
        <div className="palette-input">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Cari halaman, nomor, judul, atau kode arsip..."
            aria-label="Cari"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-list" role="listbox" aria-label="Hasil pencarian">
          {hasil.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={`palette-item${index === activeIndex ? " active" : ""}`}
              onMouseEnter={() => setActive(index)}
              onClick={() => pilih(item)}
            >
              <span className="palette-icon">
                <Icon name={item.kind === "arsip" ? "file" : "chevron"} size={16} />
              </span>
              <span className="palette-text">
                <strong>{item.label}</strong>
                <small>{item.desc}</small>
              </span>
              <span className="palette-kind">{item.kind === "arsip" ? "Arsip" : "Halaman"}</span>
            </button>
          ))}
          {hasil.length === 0 ? <div className="empty">Tidak ada hasil untuk pencarian ini.</div> : null}
        </div>
        <div className="palette-foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigasi
          </span>
          <span>
            <kbd>Enter</kbd> buka
          </span>
          <span>
            <kbd>Esc</kbd> tutup
          </span>
        </div>
      </div>
    </div>
  );
}

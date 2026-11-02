"use client";

import { useEffect, type ReactNode } from "react";
import Icon from "./icon";

type DrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export default function Drawer({ open, title, subtitle, onClose, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-head">
          <div>
            <h2 className="h2">{title}</h2>
            {subtitle ? <p className="sub mono">{subtitle}</p> : null}
          </div>
          <button type="button" className="icon-close" onClick={onClose} aria-label="Tutup detail">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-foot">{footer}</div> : null}
      </aside>
    </div>
  );
}

"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import Spinner from "./spinner";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
};

// Tombol dengan indikator proses. Jika `loading` tidak diberikan,
// status pending diambil dari form terdekat (untuk form action server).
export default function TombolMemuat({
  loading,
  loadingText = "Memproses...",
  children,
  className = "btn",
  disabled,
  ...props
}: Props) {
  const { pending } = useFormStatus();
  const sibuk = loading ?? pending;

  return (
    <button {...props} className={className} disabled={disabled || sibuk} aria-busy={sibuk}>
      {sibuk ? (
        <>
          <Spinner size={15} />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

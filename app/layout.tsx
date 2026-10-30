import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-Arsip - Sistem Arsip Digital",
  description: "Aplikasi pengelolaan arsip digital dengan retensi, pemusnahan, dan log aktivitas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

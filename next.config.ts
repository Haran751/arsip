import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Jangan bocorkan teknologi server ke header response.
  poweredByHeader: false,
  // Source map browser tidak ikut terpublikasi di produksi.
  productionBrowserSourceMaps: false,
  // Aktifkan forbidden()/unauthorized() untuk halaman 403/401.
  experimental: { authInterrupts: true },
  serverExternalPackages: ["pdfmake", "exceljs", "docx"],
  outputFileTracingIncludes: {
    "/api/ekspor": ["./lib/ekspor/fonts/*.ttf"],
  },
  async redirects() {
    return [{ source: "/pemusnahan", destination: "/penyusutan", permanent: false }];
  },
};

export default nextConfig;

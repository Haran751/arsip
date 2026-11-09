import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfmake", "exceljs", "docx"],
  outputFileTracingIncludes: {
    "/api/ekspor": ["./lib/ekspor/fonts/*.ttf"],
  },
  async redirects() {
    return [{ source: "/pemusnahan", destination: "/penyusutan", permanent: false }];
  },
};

export default nextConfig;

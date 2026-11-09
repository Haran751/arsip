import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/pemusnahan", destination: "/penyusutan", permanent: false }];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimal for Docker / produksjon
  output: 'standalone',

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;


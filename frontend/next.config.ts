import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Optimize for production
  compress: true,
  
  // Disable powered by header
  poweredByHeader: false,
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      // Don't watch the `patches` directory, which is created by patch-package
      config.watchOptions.ignored = /patches/;
    }
    return config;
  },
};

export default nextConfig;

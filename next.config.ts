
import { type NextConfig } from 'next';
import withNextIntl from 'next-intl/plugin';

const withIntl = withNextIntl();

const nextConfig: NextConfig = {
    images: {
      remotePatterns  : [
        {
          protocol: 'https',
          hostname: 'images.pexels.com',
        },
        {
          protocol: 'https',
          hostname: 'github.com',
        },
        {
          protocol: 'https',
          hostname: 'images.unsplash.com',
        },
        {
          protocol: 'https',
          hostname: 'avatars.githubusercontent.com',
        },
        {
          protocol: 'https',
          hostname: 'ik.imagekit.io',
        },
        {
          protocol: 'https',
          hostname: 'livekit.io',
        },
        {
          protocol: 'https',
          hostname: 'randomuser.me',
        },
        {
          protocol: 'https',
          hostname: 'placehold.co',
        },
      ],
      unoptimized: false,
      formats: ['image/webp', 'image/avif'],
    },
    experimental: {
      optimizePackageImports: ['lucide-react'],
    },
};

export default withIntl(nextConfig);


import { type NextConfig } from 'next';
import withNextIntl from 'next-intl/plugin';

const withIntl = withNextIntl();

const nextConfig: NextConfig = {
    images: {
      domains: ['images.pexels.com', 'github.com', 'images.unsplash.com', 'avatars.githubusercontent.com'],
    },
};

export default withIntl(nextConfig);

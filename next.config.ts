
import { type NextConfig } from 'next';
import withNextIntl from 'next-intl/plugin';

const withIntl = withNextIntl();

const nextConfig: NextConfig = {
    images: {

    domains: ['images.pexels.com'],

},
};

export default withIntl(nextConfig);

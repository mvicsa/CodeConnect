import { NextConfig } from 'next';
import withNextIntl from 'next-intl/plugin';

const withIntl = withNextIntl();

const nextConfig: NextConfig = {};

export default withIntl(nextConfig);
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['fonts.gstatic.com'],
  },
};

module.exports = nextConfig;

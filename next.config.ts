/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['fonts.gstatic.com'],
  },
  experimental: {
    optimizeFonts: true,
  }
};

export default nextConfig;

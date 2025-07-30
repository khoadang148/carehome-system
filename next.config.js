/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tối ưu hóa development
  reactStrictMode: false, // Tắt strict mode để tránh double render trong development
  swcMinify: true,
  
  // Tối ưu hóa images
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  
  // Tối ưu hóa webpack
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Tắt một số optimization trong development để tăng tốc
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    return config
  },
  
  // Tối ưu hóa experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  }
}

module.exports = nextConfig

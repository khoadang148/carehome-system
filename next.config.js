/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tối ưu hóa development
  reactStrictMode: true, // Bật strict mode để phát hiện lỗi sớm
  
  // Tối ưu hóa images
  images: {
    domains: ['localhost'],
    unoptimized: false, // Bật tối ưu hóa images
    formats: ['image/webp', 'image/avif'], // Hỗ trợ format hiện đại
  },
  
  // Tối ưu hóa webpack
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Tối ưu hóa development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    
    // Tối ưu hóa bundle size
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    return config
  },
  
  // Tối ưu hóa experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Tối ưu hóa performance
  compress: true,
  poweredByHeader: false,
  
  // Tối ưu hóa headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Tối ưu hóa redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig

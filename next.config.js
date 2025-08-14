/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tối ưu hóa development
  reactStrictMode: false, // Tắt strict mode trong development để giảm re-render
  
  // Tối ưu hóa images
  images: {
    domains: ['localhost'],
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
      
      // Tắt source maps trong development để tăng tốc
      config.devtool = 'eval-cheap-module-source-map'
    }
    
    // Tối ưu hóa bundle size
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    // Tối ưu hóa cho production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      }
    }
    
    return config
  },
  
  // Tối ưu hóa experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    // Tối ưu hóa performance
    optimizePackageImports: [
      '@mui/material', 
      '@mui/icons-material', 
      'axios',
      'react-icons',
      'lucide-react',
      'framer-motion'
    ],
  },
  
  // Tối ưu hóa turbopack
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
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
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
  
  // Tối ưu hóa output
  output: 'standalone',
}

module.exports = nextConfig

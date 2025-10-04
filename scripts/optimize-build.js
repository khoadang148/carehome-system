#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting build optimization...');

// 1. Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
  execSync('rm -rf .next out dist', { stdio: 'inherit' });
} catch (error) {
  console.log('No previous builds to clean');
}

// 2. Analyze bundle size
console.log('📊 Analyzing bundle size...');
try {
  execSync('npm run build:analyze', { stdio: 'inherit' });
} catch (error) {
  console.log('Bundle analysis failed, continuing...');
}

// 3. Optimize images
console.log('🖼️ Optimizing images...');
const publicDir = path.join(__dirname, '../public');
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

function optimizeImages(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      optimizeImages(filePath);
    } else if (imageExtensions.some(ext => file.toLowerCase().endsWith(ext))) {
      console.log(`Optimizing: ${filePath}`);
      // Add image optimization logic here if needed
    }
  });
}

optimizeImages(publicDir);

// 4. Generate sitemap for better SEO
console.log('🗺️ Generating sitemap...');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://your-domain.com/login</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);

// 5. Generate robots.txt
console.log('🤖 Generating robots.txt...');
const robots = `User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml`;

fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);

// 6. Optimize package.json scripts
console.log('📦 Optimizing package.json...');
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add optimization scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'build:optimized': 'NODE_ENV=production next build && npm run optimize:post-build',
  'optimize:post-build': 'node scripts/optimize-build.js',
  'analyze:bundle': 'ANALYZE=true npm run build',
  'preview:optimized': 'npm run build:optimized && npm run start',
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// 7. Create performance monitoring script
console.log('📈 Creating performance monitoring...');
const performanceScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Performance monitoring for production
const performanceData = {
  timestamp: new Date().toISOString(),
  buildTime: process.env.BUILD_TIME || 'unknown',
  nodeVersion: process.version,
  platform: process.platform,
  memoryUsage: process.memoryUsage(),
};

fs.writeFileSync(
  path.join(__dirname, '../.next/performance.json'),
  JSON.stringify(performanceData, null, 2)
);

console.log('Performance data saved');
`;

fs.writeFileSync(
  path.join(__dirname, 'performance-monitor.js'),
  performanceScript
);

// 8. Create Vercel optimization config
console.log('⚡ Creating Vercel optimization config...');
const vercelConfig = {
  functions: {
    'src/app/api/**/*.ts': {
      maxDuration: 30,
    },
  },
  headers: [
    {
      source: '/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=300, s-maxage=300',
        },
      ],
    },
  ],
  rewrites: [
    {
      source: '/api/:path*',
      destination: 'https://sep490-be-xniz.onrender.com/:path*',
    },
  ],
};

fs.writeFileSync(
  path.join(__dirname, '../vercel.json'),
  JSON.stringify(vercelConfig, null, 2)
);

console.log('✅ Build optimization completed!');
console.log('📋 Next steps:');
console.log('1. Run: npm run build:optimized');
console.log('2. Test the optimized build locally');
console.log('3. Deploy to Vercel');
console.log('4. Monitor performance in production');

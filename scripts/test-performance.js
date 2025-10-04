#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting performance tests...');

// Test 1: Build time
console.log('⏱️ Testing build time...');
const buildStart = Date.now();
try {
  execSync('npm run build', { stdio: 'pipe' });
  const buildTime = Date.now() - buildStart;
  console.log(`✅ Build completed in ${(buildTime / 1000).toFixed(2)}s`);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Test 2: Bundle size analysis
console.log('📦 Analyzing bundle size...');
try {
  const buildDir = path.join(__dirname, '../.next/static/chunks');
  const files = fs.readdirSync(buildDir);
  
  let totalSize = 0;
  const chunkSizes = {};
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(buildDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalSize += stats.size;
      chunkSizes[file] = sizeKB;
    }
  });
  
  console.log('📊 Chunk sizes:');
  Object.entries(chunkSizes)
    .sort(([,a], [,b]) => b - a)
    .forEach(([file, size]) => {
      console.log(`  ${file}: ${size}KB`);
    });
  
  console.log(`📈 Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
  
  // Check if bundle size is within limits
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (totalSize > maxSize) {
    console.warn(`⚠️ Bundle size exceeds 2MB limit: ${(totalSize / 1024).toFixed(2)}KB`);
  } else {
    console.log(`✅ Bundle size within limits: ${(totalSize / 1024).toFixed(2)}KB`);
  }
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
}

// Test 3: Lighthouse audit (if available)
console.log('🔍 Running Lighthouse audit...');
try {
  execSync('npm run performance:audit', { stdio: 'pipe' });
  
  if (fs.existsSync('./lighthouse-report.json')) {
    const report = JSON.parse(fs.readFileSync('./lighthouse-report.json', 'utf8'));
    const scores = report.categories;
    
    console.log('📊 Lighthouse scores:');
    Object.entries(scores).forEach(([category, data]) => {
      console.log(`  ${category}: ${data.score * 100}/100`);
    });
    
    // Check if scores meet minimum requirements
    const minScore = 80;
    const failedCategories = Object.entries(scores)
      .filter(([, data]) => data.score * 100 < minScore)
      .map(([category]) => category);
    
    if (failedCategories.length > 0) {
      console.warn(`⚠️ Categories below ${minScore}%: ${failedCategories.join(', ')}`);
    } else {
      console.log(`✅ All categories above ${minScore}%`);
    }
  }
} catch (error) {
  console.warn('⚠️ Lighthouse audit not available:', error.message);
}

// Test 4: Memory usage
console.log('💾 Checking memory usage...');
const memUsage = process.memoryUsage();
console.log(`📊 Memory usage:`);
console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`);
console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);

// Test 5: Performance recommendations
console.log('💡 Performance recommendations:');
const recommendations = [];

// Check for large chunks
if (Object.values(chunkSizes || {}).some(size => parseFloat(size) > 500)) {
  recommendations.push('Consider code splitting for large chunks (>500KB)');
}

// Check for too many chunks
if (Object.keys(chunkSizes || {}).length > 20) {
  recommendations.push('Consider consolidating small chunks');
}

// Check memory usage
if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
  recommendations.push('High memory usage detected, consider optimization');
}

if (recommendations.length > 0) {
  recommendations.forEach(rec => console.log(`  • ${rec}`));
} else {
  console.log('  ✅ No immediate optimizations needed');
}

// Generate performance report
const report = {
  timestamp: new Date().toISOString(),
  buildTime: buildTime,
  bundleSize: totalSize,
  chunkSizes: chunkSizes,
  memoryUsage: memUsage,
  recommendations: recommendations,
};

fs.writeFileSync(
  path.join(__dirname, '../performance-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('📄 Performance report saved to performance-report.json');
console.log('✅ Performance tests completed!');

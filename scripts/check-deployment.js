#!/usr/bin/env node

/**
 * Script để kiểm tra deployment và build logs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Deployment Status...\n');

async function checkDeployment() {
  try {
    // 1. Kiểm tra build locally
    console.log('1. Testing local build...');
    try {
      execSync('npm run build', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Local build successful');
    } catch (error) {
      console.log('❌ Local build failed:');
      console.log('   Error:', error.message);
      return false;
    }

    // 2. Kiểm tra file sizes
    console.log('\n2. Checking build output sizes...');
    const buildDir = path.join(__dirname, '..', '.next');
    
    if (fs.existsSync(buildDir)) {
      const stats = getDirectorySize(buildDir);
      console.log(`   Build directory size: ${formatBytes(stats.size)}`);
      console.log(`   File count: ${stats.fileCount}`);
      
      if (stats.size > 100 * 1024 * 1024) { // 100MB
        console.log('   ⚠️  Build size is large, this might cause deployment issues');
      }
    }

    // 3. Kiểm tra environment variables
    console.log('\n3. Checking environment variables...');
    const envFile = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envFile)) {
      console.log('   ✅ .env.local found');
    } else {
      console.log('   ⚠️  .env.local not found - check environment variables');
    }

    // 4. Kiểm tra package.json scripts
    console.log('\n4. Checking package.json scripts...');
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const scripts = packageJson.scripts;
    
    const requiredScripts = ['build', 'start', 'dev'];
    requiredScripts.forEach(script => {
      if (scripts[script]) {
        console.log(`   ✅ ${script}: ${scripts[script]}`);
      } else {
        console.log(`   ❌ Missing script: ${script}`);
      }
    });

    // 5. Kiểm tra Next.js config
    console.log('\n5. Checking Next.js configuration...');
    const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      console.log('   ✅ next.config.js found');
      
      const config = fs.readFileSync(nextConfigPath, 'utf8');
      if (config.includes('output: "export"')) {
        console.log('   ⚠️  Static export detected - might cause issues with API routes');
      }
    }

    // 6. Kiểm tra API routes
    console.log('\n6. Checking API routes...');
    const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
    if (fs.existsSync(apiDir)) {
      const apiFiles = fs.readdirSync(apiDir, { recursive: true });
      console.log(`   Found ${apiFiles.length} API files`);
      
      apiFiles.forEach(file => {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          console.log(`     - ${file}`);
        }
      });
    }

    console.log('\n✅ Deployment check completed!');
    return true;

  } catch (error) {
    console.error('❌ Deployment check failed:', error.message);
    return false;
  }
}

function getDirectorySize(dirPath) {
  let size = 0;
  let fileCount = 0;
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        scanDir(filePath);
      } else {
        size += stats.size;
        fileCount++;
      }
    });
  }
  
  scanDir(dirPath);
  return { size, fileCount };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run check
checkDeployment().catch(console.error);
